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
  githubRepositoryUrl: sites.githubRepositoryUrl,
  localPath: sites.localPath,
  buildCommand: sites.buildCommand,
  buildOutputDir: sites.buildOutputDir,
  editablePaths: sites.editablePaths,
  isActive: sites.isActive,
  createdAt: sites.createdAt,
  updatedAt: sites.updatedAt
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
  return {
    ...site,
    editablePaths: site.editablePaths ? JSON.parse(site.editablePaths) : []
  };
}

/**
 * Convert database site to SiteConfig
 */
function dbSiteToSiteConfig(site: any): SiteConfig {
  return {
    id: site.id,
    name: site.name,
    githubRepositoryUrl: site.githubRepositoryUrl,
    githubPat: decryptPat(site.githubPatEncrypted),
    localPath: site.localPath,
    buildCommand: site.buildCommand || undefined,
    buildOutputDir: site.buildOutputDir || undefined,
    editablePaths: site.editablePaths ? JSON.parse(site.editablePaths) : undefined,
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
    githubRepositoryUrl,
    githubPat,
    localPath,
    buildCommand,
    buildOutputDir,
    editablePaths = []
  } = c.get('validatedData');
  const user = c.get('user');

  try {
    // Create site config for validation
    const siteConfig: SiteConfig = {
      id: 'temp',
      name,
      githubRepositoryUrl,
      githubPat,
      localPath,
      buildCommand,
      buildOutputDir,
      editablePaths
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
    const existingSite = await checkSiteNameExists(name);
    if (existingSite) {
      return c.json({ error: 'Site name already exists' }, 409);
    }

    // Encrypt GitHub PAT
    const encryptedPat = encryptPat(githubPat);
    const encryptedPatBuffer = Buffer.from(JSON.stringify(encryptedPat), 'utf8');

    // Create site
    const newSite = await db.insert(sites)
      .values({
        name,
        githubRepositoryUrl,
        githubPatEncrypted: encryptedPatBuffer,
        localPath,
        buildCommand: buildCommand || null,
        buildOutputDir: buildOutputDir || null,
        editablePaths: editablePaths.length > 0 ? JSON.stringify(editablePaths) : null,
        isActive: true
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
    githubRepositoryUrl,
    githubPat,
    localPath,
    buildCommand,
    buildOutputDir,
    editablePaths,
    isActive
  } = c.get('validatedData');

  try {
    // Check if site exists
    const existingSite = await findSiteById(id);
    if (!existingSite) {
      return c.json({ error: 'Site not found' }, 404);
    }

    // Check if name already exists (excluding current site)
    if (name) {
      const existingName = await checkSiteNameExists(name, id);
      if (existingName) {
        return c.json({ error: 'Site name already exists' }, 409);
      }
    }

    // Prepare update data
    const updateData: any = { updatedAt: new Date() };
    
    // Build update object dynamically
    const updates = {
      name,
      githubRepositoryUrl,
      localPath,
      buildCommand,
      buildOutputDir,
      isActive
    };

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    // Handle special cases
    if (githubPat !== undefined) {
      const encryptedPat = encryptPat(githubPat);
      updateData.githubPatEncrypted = Buffer.from(JSON.stringify(encryptedPat), 'utf8');
    }
    
    if (editablePaths !== undefined) {
      updateData.editablePaths = editablePaths.length > 0 ? JSON.stringify(editablePaths) : null;
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