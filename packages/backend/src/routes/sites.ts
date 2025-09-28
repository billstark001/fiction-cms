import { Hono } from 'hono';
import { db } from '../db/index.js';
import { sites, userSites, roles } from '../db/schema.js';
import { eq, like, or, and, ne } from 'drizzle-orm';
import { authMiddleware, requirePermission, requireSitePermission } from '../auth/middleware.js';
import { validateJson, validateQuery, validateParams } from '../middleware/validation.js';
import {
  createSiteSchema,
  updateSiteSchema,
  paginationSchema,
  searchSchema,
  idParamSchema
} from '../schemas/index.js';
import { SiteConfig } from '../engine/types.js';
import crypto from 'crypto';
import { ConfigValidator } from '../engine/content/config-validator.js';

const siteRoutes = new Hono();

// Apply authentication to all site routes
siteRoutes.use('*', authMiddleware);

// Get encryption key from environment, generate one if not present
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ?
  Buffer.from(process.env.ENCRYPTION_KEY, 'hex') :
  crypto.randomBytes(32);

// Common database selection fields for sites
const SITE_SELECT_FIELDS = {
  id: sites.id,
  name: sites.name,
  description: sites.description,
  githubRepositoryUrl: sites.githubRepositoryUrl,
  localPath: sites.localPath,
  buildCommand: sites.buildCommand,
  buildOutputDir: sites.buildOutputDir,
  validateCommand: sites.validateCommand,
  editablePaths: sites.editablePaths,
  sqliteFiles: sites.sqliteFiles,
  modelFiles: sites.modelFiles,
  customFileTypes: sites.customFileTypes,
  isActive: sites.isActive,
  createdAt: sites.createdAt,
  updatedAt: sites.updatedAt
};

const sanitizeStringArray = (values?: string[] | null) => {
  if (!values) return undefined;
  const sanitized = values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value && value.length > 0));
  return sanitized.length > 0 ? sanitized : undefined;
};

const sanitizeDefaultValues = (defaultValues?: Record<string, any> | null) => {
  if (!defaultValues) return undefined;
  const entries = Object.entries(defaultValues)
    .map(([key, value]) => [key.trim(), typeof value === 'string' ? value.trim() : value])
    .filter(([key]) => key.length > 0);

  if (entries.length === 0) return undefined;

  return Object.fromEntries(entries);
};

const sanitizeSQLiteFiles = (sqliteFiles?: any[] | null) => {
  if (!sqliteFiles) return undefined;

  const sanitized = sqliteFiles
    .map((file) => {
      const filePath = file?.filePath?.trim();
      const editableTables = Array.isArray(file?.editableTables) ? file.editableTables : [];

      const sanitizedTables = editableTables
        .map((table: any) => {
          const tableName = table?.tableName?.trim();
          if (!tableName) return undefined;

          const editableColumns = sanitizeStringArray(table?.editableColumns);
          const readableColumns = sanitizeStringArray(table?.readableColumns);
          const defaultValues = sanitizeDefaultValues(table?.defaultValues);
          const primaryKeyStrategy = table?.primaryKeyStrategy;

          return {
            tableName,
            displayName: table?.displayName?.trim() || undefined,
            editableColumns,
            readableColumns,
            defaultValues,
            primaryKeyStrategy
          };
        })
        .filter((table: any): table is any => Boolean(table));

      if (!filePath || sanitizedTables.length === 0) {
        return undefined;
      }

      return {
        filePath,
        editableTables: sanitizedTables
      };
    })
    .filter((file: any): file is any => Boolean(file));

  return sanitized.length > 0 ? sanitized : undefined;
};

const sanitizeModelFiles = (modelFiles?: any[] | null) => {
  if (!modelFiles) return undefined;

  const sanitized = modelFiles
    .map((file) => {
      const filePath = file?.filePath?.trim();
      const zodValidator = file?.zodValidator?.trim();
      if (!filePath || !zodValidator) return undefined;

      return {
        filePath,
        zodValidator,
        displayName: file?.displayName?.trim() || undefined,
      };
    })
    .filter((file: any): file is any => Boolean(file));

  return sanitized.length > 0 ? sanitized : undefined;
};

const sanitizeCustomFileTypes = (customFileTypes?: any[] | null) => {
  if (!customFileTypes) return undefined;

  const sanitized = customFileTypes
    .map((type) => {
      const name = type?.name?.trim();
      const extensions = sanitizeStringArray(type?.extensions) || [];

      if (!name || extensions.length === 0) return undefined;

      return {
        name,
        extensions,
        displayName: type?.displayName?.trim() || undefined,
        isText: typeof type?.isText === 'boolean' ? type.isText : undefined,
      };
    })
    .filter((type: any): type is any => Boolean(type));

  return sanitized.length > 0 ? sanitized : undefined;
};

/**
 * Encrypt GitHub PAT for secure storage using AES-256-CBC
 */
function encryptPat(pat: string): { encryptedData: string; iv: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(pat, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    encryptedData: encrypted,
    iv: iv.toString('hex')
  };
}

/**
 * Decrypt GitHub PAT from secure storage
 */
function decryptPat(encryptedPat: Buffer): string {
  try {
    const data = JSON.parse(encryptedPat.toString('utf8'));
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, Buffer.from(data.iv, 'hex'));

    let decrypted = decipher.update(data.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Failed to decrypt PAT:', error);
    throw new Error('Failed to decrypt GitHub PAT');
  }
}

/**
 * Transform site data for client response
 */
function transformSiteData(site: any) {
  const parseJson = (value: any, fallback: any) => {
    if (!value) return fallback;
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn('Failed to parse site field JSON', error);
      return fallback;
    }
  };

  return {
    ...site,
    editablePaths: parseJson(site.editablePaths, []),
    sqliteFiles: parseJson(site.sqliteFiles, []),
    modelFiles: parseJson(site.modelFiles, []),
    customFileTypes: parseJson(site.customFileTypes, [])
  };
}

/**
 * Convert database site to SiteConfig
 */
function dbSiteToSiteConfig(site: any): SiteConfig {
  const parseOptionalJson = (value: any) => {
    if (!value) return undefined;
    if (typeof value !== 'string') return value;
    try {
      const parsed = JSON.parse(value);
      return parsed;
    } catch (error) {
      console.warn('Failed to parse site config JSON', error);
      return undefined;
    }
  };

  return {
    id: site.id,
    name: site.name,
    githubRepositoryUrl: site.githubRepositoryUrl,
    githubPat: decryptPat(site.githubPatEncrypted),
    localPath: site.localPath,
    buildCommand: site.buildCommand || undefined,
    buildOutputDir: site.buildOutputDir || undefined,
    validateCommand: site.validateCommand || undefined,
    editablePaths: parseOptionalJson(site.editablePaths),
    sqliteFiles: parseOptionalJson(site.sqliteFiles),
    modelFiles: parseOptionalJson(site.modelFiles),
    customFileTypes: parseOptionalJson(site.customFileTypes)
  };
}

/**
 * Find site by ID with error handling
 */
async function findSiteById(id: string) {
  return await db.select(SITE_SELECT_FIELDS)
    .from(sites)
    .where(eq(sites.id, id))
    .get();
}

/**
 * Check if site name exists (optionally excluding a specific ID)
 */
async function checkSiteNameExists(name: string, excludeId?: string) {
  const whereClause = excludeId ? 
    and(eq(sites.name, name), ne(sites.id, excludeId)) :
    eq(sites.name, name);
    
  return await db.select().from(sites).where(whereClause).get();
}

/**
 * Handle common errors
 */
function handleError(error: any, operation: string, c: any) {
  console.error(`${operation} error:`, error);
  return c.json({ error: 'Internal server error' }, 500);
}

/**
 * GET /sites - List sites with pagination and search
 */
siteRoutes.get('/', requirePermission('site.read'), validateQuery(paginationSchema.merge(searchSchema.partial())), async (c) => {
  const { page, limit, orderBy = 'name', orderDirection, q } = c.get('validatedQuery');
  const offset = (page - 1) * limit;

  try {
    const baseQuery = db.select(SITE_SELECT_FIELDS).from(sites);

    // Apply search filter if provided
    const sitesData = q ? 
      await baseQuery.where(
        or(
          like(sites.name, `%${q}%`),
          like(sites.githubRepositoryUrl, `%${q}%`),
          like(sites.localPath, `%${q}%`)
        )
      ).limit(limit).offset(offset) :
      await baseQuery.limit(limit).offset(offset);

    // Get total count for pagination
    const totalResult = await db.select({ count: sites.id }).from(sites);
    const total = totalResult.length;

    return c.json({
      items: sitesData.map(transformSiteData),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return handleError(error, 'List sites', c);
  }
});

/**
 * GET /sites/:id - Get specific site
 */
siteRoutes.get('/:id', requireSitePermission('site.read'), validateParams(idParamSchema), async (c) => {
  const { id } = c.get('validatedParams');

  try {
    const site = await findSiteById(id);

    if (!site) {
      return c.json({ error: 'Site not found' }, 404);
    }

    return c.json({ site: transformSiteData(site) });
  } catch (error) {
    return handleError(error, 'Get site', c);
  }
});

/**
 * POST /sites - Create new site
 */
siteRoutes.post('/', requirePermission('site.admin'), validateJson(createSiteSchema), async (c) => {
  const {
    name,
    description,
    githubRepositoryUrl,
    githubPat,
    localPath,
    buildCommand,
    buildOutputDir,
    validateCommand,
    editablePaths = [],
    sqliteFiles,
    modelFiles,
    customFileTypes,
    isActive = true
  } = c.get('validatedData');
  const user = c.get('user');

  try {
    const normalizedName = name.trim();
    const normalizedGithubUrl = githubRepositoryUrl.trim();
    const normalizedLocalPath = localPath.trim();
    const normalizedBuildCommand = buildCommand?.trim() || undefined;
    const normalizedBuildOutputDir = buildOutputDir?.trim() || undefined;
    const normalizedValidateCommand = validateCommand?.trim() || undefined;
    const normalizedDescription = description?.trim() || undefined;
    const sanitizedEditablePaths = sanitizeStringArray(editablePaths);
    const sanitizedSqliteFiles = sanitizeSQLiteFiles(sqliteFiles);
    const sanitizedModelFiles = sanitizeModelFiles(modelFiles);
    const sanitizedCustomFileTypes = sanitizeCustomFileTypes(customFileTypes);

    // Create site config for validation
    const siteConfig: SiteConfig = {
      id: 'temp',
      name: normalizedName,
      githubRepositoryUrl: normalizedGithubUrl,
      githubPat: githubPat.trim(),
      localPath: normalizedLocalPath,
      buildCommand: normalizedBuildCommand,
      buildOutputDir: normalizedBuildOutputDir,
      validateCommand: normalizedValidateCommand,
      editablePaths: sanitizedEditablePaths,
      sqliteFiles: sanitizedSqliteFiles,
      modelFiles: sanitizedModelFiles,
      customFileTypes: sanitizedCustomFileTypes
    };

    // Validate site configuration
    const configErrors = ConfigValidator.validateSiteConfig(siteConfig);
    if (configErrors.length > 0) {
      return c.json({
        error: 'Site configuration validation failed',
        details: configErrors
      }, 400);
    }

    // Check if site name already exists
    const existingSite = await checkSiteNameExists(normalizedName);
    if (existingSite) {
      return c.json({ error: 'Site name already exists' }, 409);
    }

    // Encrypt GitHub PAT
    const encryptedPat = encryptPat(githubPat.trim());
    const encryptedPatBuffer = Buffer.from(JSON.stringify(encryptedPat), 'utf8');

    // Create site
    const newSite = await db.insert(sites)
      .values({
        name: normalizedName,
        description: normalizedDescription ?? null,
        githubRepositoryUrl: normalizedGithubUrl,
        githubPatEncrypted: encryptedPatBuffer,
        localPath: normalizedLocalPath,
        buildCommand: normalizedBuildCommand ?? null,
        buildOutputDir: normalizedBuildOutputDir ?? null,
        validateCommand: normalizedValidateCommand ?? null,
        editablePaths: sanitizedEditablePaths ? JSON.stringify(sanitizedEditablePaths) : null,
        sqliteFiles: sanitizedSqliteFiles ? JSON.stringify(sanitizedSqliteFiles) : null,
        modelFiles: sanitizedModelFiles ? JSON.stringify(sanitizedModelFiles) : null,
        customFileTypes: sanitizedCustomFileTypes ? JSON.stringify(sanitizedCustomFileTypes) : null,
        isActive
      })
      .returning(SITE_SELECT_FIELDS)
      .get();

    // Assign the creator as site admin
    const adminRole = await db.select()
      .from(roles)
      .where(eq(roles.name, 'admin'))
      .get();

    if (adminRole) {
      await db.insert(userSites)
        .values({
          userId: user.id,
          siteId: newSite.id,
          roleId: adminRole.id
        });
    }

    return c.json({
      message: 'Site created successfully',
      site: transformSiteData(newSite)
    }, 201);
  } catch (error) {
    return handleError(error, 'Create site', c);
  }
});

/**
 * PUT /sites/:id - Update site
 */
siteRoutes.put('/:id', requireSitePermission('site.admin'), validateParams(idParamSchema), validateJson(updateSiteSchema), async (c) => {
  const { id } = c.get('validatedParams');
  const {
    name,
    description,
    githubRepositoryUrl,
    githubPat,
    localPath,
    buildCommand,
    buildOutputDir,
    validateCommand,
    editablePaths,
    sqliteFiles,
    modelFiles,
    customFileTypes,
    isActive
  } = c.get('validatedData');

  try {
    // Check if site exists
    const existingSite = await findSiteById(id);
    if (!existingSite) {
      return c.json({ error: 'Site not found' }, 404);
    }

    // Check if name already exists (excluding current site)
  const normalizedName = name?.trim();
    if (normalizedName) {
      const existingName = await checkSiteNameExists(normalizedName, id);
      if (existingName) {
        return c.json({ error: 'Site name already exists' }, 409);
      }
    }

    // Prepare update data
    const updateData: any = { updatedAt: new Date() };

  const normalizedGithubUrl = githubRepositoryUrl?.trim() || undefined;
  const normalizedLocalPath = localPath?.trim() || undefined;
  const normalizedBuildCommand = buildCommand?.trim() || undefined;
  const normalizedBuildOutputDir = buildOutputDir?.trim() || undefined;
  const normalizedValidateCommand = validateCommand?.trim() || undefined;
  const normalizedDescription = description?.trim() || undefined;
    const sanitizedEditablePaths = editablePaths !== undefined ? sanitizeStringArray(editablePaths) : undefined;
    const sanitizedSqliteFiles = sqliteFiles !== undefined ? sanitizeSQLiteFiles(sqliteFiles) : undefined;
    const sanitizedModelFiles = modelFiles !== undefined ? sanitizeModelFiles(modelFiles) : undefined;
    const sanitizedCustomFileTypes = customFileTypes !== undefined ? sanitizeCustomFileTypes(customFileTypes) : undefined;

    if (name !== undefined) {
      updateData.name = normalizedName;
    }

    if (description !== undefined) {
      updateData.description = normalizedDescription ?? null;
    }

    if (githubRepositoryUrl !== undefined) {
      updateData.githubRepositoryUrl = normalizedGithubUrl;
    }

    if (localPath !== undefined) {
      updateData.localPath = normalizedLocalPath;
    }

    if (buildCommand !== undefined) {
      updateData.buildCommand = normalizedBuildCommand ?? null;
    }

    if (buildOutputDir !== undefined) {
      updateData.buildOutputDir = normalizedBuildOutputDir ?? null;
    }

    if (validateCommand !== undefined) {
      updateData.validateCommand = normalizedValidateCommand ?? null;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    // Handle special cases
    if (githubPat !== undefined) {
      const encryptedPat = encryptPat(githubPat.trim());
      updateData.githubPatEncrypted = Buffer.from(JSON.stringify(encryptedPat), 'utf8');
    }
    
    if (editablePaths !== undefined) {
      updateData.editablePaths = sanitizedEditablePaths && sanitizedEditablePaths.length > 0
        ? JSON.stringify(sanitizedEditablePaths)
        : null;
    }

    if (sqliteFiles !== undefined) {
      updateData.sqliteFiles = sanitizedSqliteFiles && sanitizedSqliteFiles.length > 0
        ? JSON.stringify(sanitizedSqliteFiles)
        : null;
    }

    if (modelFiles !== undefined) {
      updateData.modelFiles = sanitizedModelFiles && sanitizedModelFiles.length > 0
        ? JSON.stringify(sanitizedModelFiles)
        : null;
    }

    if (customFileTypes !== undefined) {
      updateData.customFileTypes = sanitizedCustomFileTypes && sanitizedCustomFileTypes.length > 0
        ? JSON.stringify(sanitizedCustomFileTypes)
        : null;
    }

    // Update site
    const updatedSite = await db.update(sites)
      .set(updateData)
      .where(eq(sites.id, id))
      .returning(SITE_SELECT_FIELDS)
      .get();

    return c.json({
      message: 'Site updated successfully',
      site: transformSiteData(updatedSite)
    });
  } catch (error) {
    return handleError(error, 'Update site', c);
  }
});

/**
 * DELETE /sites/:id - Delete site
 */
siteRoutes.delete('/:id', requirePermission('site.admin'), validateParams(idParamSchema), async (c) => {
  const { id } = c.get('validatedParams');

  try {
    // Check if site exists
    const existingSite = await findSiteById(id);
    if (!existingSite) {
      return c.json({ error: 'Site not found' }, 404);
    }

    // Delete user-site assignments first (foreign key constraint)
    await db.delete(userSites).where(eq(userSites.siteId, id));

    // Delete site
    await db.delete(sites).where(eq(sites.id, id));

    return c.json({ message: 'Site deleted successfully' });
  } catch (error) {
    return handleError(error, 'Delete site', c);
  }
});

/**
 * GET /sites/:id/config - Get site configuration for engine
 */
siteRoutes.get('/:id/config', requireSitePermission('site.read'), validateParams(idParamSchema), async (c) => {
  const { id } = c.get('validatedParams');

  try {
    const site = await db.select()
      .from(sites)
      .where(eq(sites.id, id))
      .get();

    if (!site) {
      return c.json({ error: 'Site not found' }, 404);
    }

    const siteConfig = dbSiteToSiteConfig(site);

    return c.json({
      siteConfig,
      validationErrors: ConfigValidator.validateSiteConfig(siteConfig)
    });
  } catch (error) {
    return handleError(error, 'Get site config', c);
  }
});

export { siteRoutes };