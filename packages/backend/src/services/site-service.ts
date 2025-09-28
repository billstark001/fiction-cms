import crypto from 'crypto';
import { eq, like, or, and, ne } from 'drizzle-orm';
import { db } from '../db/index.js';
import { sites, userSites, roles } from '../db/schema.js';
import type { CreateSiteRequest, UpdateSiteRequest } from '../schemas/index.js';
import {
  SiteConfig,
  SQLiteFileConfig,
  SQLiteTableConfig,
  ModelFileConfig,
  CustomFileTypeConfig
} from '../engine/types.js';
import { ConfigValidator } from '../engine/content/config-validator.js';
import { safeExecute } from './utils.js';

export class SiteServiceError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'SiteServiceError';
  }
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
  : crypto.randomBytes(32);

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
} as const;

export interface SiteListParams {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  q?: string;
}

export interface SiteListResult {
  items: SiteSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SiteSummary {
  id: string;
  name: string;
  description: string | null;
  githubRepositoryUrl: string;
  localPath: string;
  buildCommand: string | null;
  buildOutputDir: string | null;
  validateCommand: string | null;
  editablePaths: string[];
  sqliteFiles: SQLiteFileConfig[];
  modelFiles: ModelFileConfig[];
  customFileTypes: CustomFileTypeConfig[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SiteConfigResult {
  siteConfig: SiteConfig;
  validationErrors: string[];
}

type Nullable<T> = T | undefined | null;

const sanitizeStringArray = (values?: Nullable<string[]>): string[] | undefined => {
  if (!values) return undefined;
  const sanitized = values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value && value.length > 0));
  return sanitized.length > 0 ? sanitized : undefined;
};

const sanitizeDefaultValues = (defaultValues?: Nullable<Record<string, unknown>>): Record<string, unknown> | undefined => {
  if (!defaultValues) return undefined;
  const entries = Object.entries(defaultValues)
    .map(([key, value]) => [key.trim(), typeof value === 'string' ? value.trim() : value] as const)
    .filter(([key]) => key.length > 0);

  if (entries.length === 0) return undefined;

  return Object.fromEntries(entries);
};

const sanitizeSQLiteFiles = (sqliteFiles?: Nullable<any[]>): SQLiteFileConfig[] | undefined => {
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
          const primaryKeyStrategy = table?.primaryKeyStrategy as SQLiteTableConfig['primaryKeyStrategy'] | undefined;

          return {
            tableName,
            displayName: table?.displayName?.trim() || undefined,
            editableColumns,
            readableColumns,
            defaultValues,
            primaryKeyStrategy
          } satisfies SQLiteTableConfig;
        })
        .filter((table: SQLiteTableConfig | undefined): table is SQLiteTableConfig => Boolean(table));

      if (!filePath || sanitizedTables.length === 0) {
        return undefined;
      }

      return {
        filePath,
        editableTables: sanitizedTables
      } satisfies SQLiteFileConfig;
    })
    .filter((file: SQLiteFileConfig | undefined): file is SQLiteFileConfig => Boolean(file));

  return sanitized.length > 0 ? sanitized : undefined;
};

const sanitizeModelFiles = (modelFiles?: Nullable<any[]>): ModelFileConfig[] | undefined => {
  if (!modelFiles) return undefined;

  const sanitized: ModelFileConfig[] = [];

  modelFiles.forEach((file) => {
    const filePath = file?.filePath?.trim();
    const zodValidator = file?.zodValidator?.trim();
    if (!filePath || !zodValidator) {
      return;
    }

    sanitized.push({
      filePath,
      zodValidator,
      displayName: file?.displayName?.trim() || undefined
    });
  });

  return sanitized.length > 0 ? sanitized : undefined;
};

const sanitizeCustomFileTypes = (customFileTypes?: Nullable<any[]>): CustomFileTypeConfig[] | undefined => {
  if (!customFileTypes) return undefined;

  const sanitized: CustomFileTypeConfig[] = [];

  customFileTypes.forEach((type) => {
    const name = type?.name?.trim();
    const extensions = sanitizeStringArray(type?.extensions) || [];

    if (!name || extensions.length === 0) {
      return;
    }

    sanitized.push({
      name,
      extensions,
      displayName: type?.displayName?.trim() || undefined,
      isText: typeof type?.isText === 'boolean' ? type.isText : undefined
    });
  });

  return sanitized.length > 0 ? sanitized : undefined;
};

const transformSiteRow = (site: any): SiteSummary => {
  const parseJson = (value: unknown, fallback: any[]) => {
    if (!value) return fallback;
    if (typeof value !== 'string') return value as any[];
    try {
      return JSON.parse(value as string);
    } catch (error) {
      console.warn('Failed to parse site field JSON', error);
      return fallback;
    }
  };

  return {
    ...site,
    description: site.description ?? null,
    buildCommand: site.buildCommand ?? null,
    buildOutputDir: site.buildOutputDir ?? null,
    validateCommand: site.validateCommand ?? null,
    editablePaths: parseJson(site.editablePaths, []),
    sqliteFiles: parseJson(site.sqliteFiles, []),
    modelFiles: parseJson(site.modelFiles, []),
    customFileTypes: parseJson(site.customFileTypes, [])
  } satisfies SiteSummary;
};

const dbSiteToSiteConfig = (site: any): SiteConfig => {
  const parseOptionalJson = (value: unknown) => {
    if (!value) return undefined;
    if (typeof value !== 'string') return value as any;
    try {
      return JSON.parse(value as string);
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
  } satisfies SiteConfig;
};

const encryptPat = (pat: string): { encryptedData: string; iv: string } => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(pat, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    encryptedData: encrypted,
    iv: iv.toString('hex')
  };
};

const decryptPat = (encryptedPat: Buffer): string => {
  try {
    const data = JSON.parse(encryptedPat.toString('utf8'));
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, Buffer.from(data.iv, 'hex'));

    let decrypted = decipher.update(data.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Failed to decrypt PAT:', error);
    throw new SiteServiceError('Failed to decrypt GitHub PAT');
  }
};

const validateSiteConfig = (payload: SiteConfig): void => {
  const errors = ConfigValidator.validateSiteConfig(payload);
  if (errors.length > 0) {
    throw new SiteServiceError('Site configuration validation failed', 400, errors);
  }
};

const checkSiteNameExists = async (name: string, excludeId?: string) => {
  const whereClause = excludeId
    ? and(eq(sites.name, name), ne(sites.id, excludeId))
    : eq(sites.name, name);

  return await db.select({ id: sites.id }).from(sites).where(whereClause).get();
};

export class SiteService {
  async listSites(params: SiteListParams): Promise<SiteListResult> {
    const { page, limit, q } = params;
    const offset = (page - 1) * limit;

    return safeExecute(
      async () => {
        const baseQuery = db.select(SITE_SELECT_FIELDS).from(sites);

        const sitesData = q
          ? await baseQuery
              .where(
                or(
                  like(sites.name, `%${q}%`),
                  like(sites.githubRepositoryUrl, `%${q}%`),
                  like(sites.localPath, `%${q}%`)
                )
              )
              .limit(limit)
              .offset(offset)
          : await baseQuery.limit(limit).offset(offset);

        const totalResult = q
          ? await db.select({ count: sites.id }).from(sites).where(
              or(
                like(sites.name, `%${q}%`),
                like(sites.githubRepositoryUrl, `%${q}%`),
                like(sites.localPath, `%${q}%`)
              )
            )
          : await db.select({ count: sites.id }).from(sites);

        const total = totalResult.length;

        return {
          items: sitesData.map(transformSiteRow),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        } satisfies SiteListResult;
      },
      'list sites',
      params
    );
  }

  async getSiteById(id: string): Promise<SiteSummary | null> {
    const site = await safeExecute(
      async () =>
        db
          .select(SITE_SELECT_FIELDS)
          .from(sites)
          .where(eq(sites.id, id))
          .get(),
      'get site by id',
      { id }
    );

    if (!site) {
      return null;
    }

    return transformSiteRow(site);
  }

  async createSite(data: CreateSiteRequest, userId: string): Promise<SiteSummary> {
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
    } = data;

    return safeExecute(
      async () => {
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

        validateSiteConfig(siteConfig);

        const existingSite = await checkSiteNameExists(normalizedName);
        if (existingSite) {
          throw new SiteServiceError('Site name already exists', 409);
        }

        const encryptedPat = encryptPat(githubPat.trim());
        const encryptedPatBuffer = Buffer.from(JSON.stringify(encryptedPat), 'utf8');

        const newSite = await db
          .insert(sites)
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

        const adminRole = await db
          .select({ id: roles.id })
          .from(roles)
          .where(eq(roles.name, 'admin'))
          .get();

        if (adminRole) {
          await db.insert(userSites).values({
            userId,
            siteId: newSite.id,
            roleId: adminRole.id
          });
        }

        return transformSiteRow(newSite);
      },
      'create site',
      { userId, name: data.name }
    );
  }

  async updateSite(id: string, data: UpdateSiteRequest): Promise<SiteSummary> {
    return safeExecute(
      async () => {
        const existingSite = await db
          .select({ id: sites.id })
          .from(sites)
          .where(eq(sites.id, id))
          .get();

        if (!existingSite) {
          throw new SiteServiceError('Site not found', 404);
        }

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
        } = data;

        const updateData: Record<string, unknown> = { updatedAt: new Date() };

        if (name !== undefined) {
          const normalizedName = name.trim();
          const nameExists = await checkSiteNameExists(normalizedName, id);
          if (nameExists) {
            throw new SiteServiceError('Site name already exists', 409);
          }
          updateData.name = normalizedName;
        }

        if (description !== undefined) {
          const normalizedDescription = description?.trim();
          updateData.description = normalizedDescription?.length ? normalizedDescription : null;
        }

        if (githubRepositoryUrl !== undefined) {
          updateData.githubRepositoryUrl = githubRepositoryUrl.trim();
        }

        if (localPath !== undefined) {
          updateData.localPath = localPath.trim();
        }

        if (buildCommand !== undefined) {
          const normalizedBuildCommand = buildCommand?.trim();
          updateData.buildCommand = normalizedBuildCommand?.length ? normalizedBuildCommand : null;
        }

        if (buildOutputDir !== undefined) {
          const normalizedBuildOutputDir = buildOutputDir?.trim();
          updateData.buildOutputDir = normalizedBuildOutputDir?.length ? normalizedBuildOutputDir : null;
        }

        if (validateCommand !== undefined) {
          const normalizedValidateCommand = validateCommand?.trim();
          updateData.validateCommand = normalizedValidateCommand?.length ? normalizedValidateCommand : null;
        }

        if (isActive !== undefined) {
          updateData.isActive = isActive;
        }

        if (githubPat !== undefined) {
          const encryptedPat = encryptPat(githubPat.trim());
          updateData.githubPatEncrypted = Buffer.from(JSON.stringify(encryptedPat), 'utf8');
        }

        if (editablePaths !== undefined) {
          const sanitizedEditablePaths = sanitizeStringArray(editablePaths);
          updateData.editablePaths = sanitizedEditablePaths?.length
            ? JSON.stringify(sanitizedEditablePaths)
            : null;
        }

        if (sqliteFiles !== undefined) {
          const sanitizedSqliteFiles = sanitizeSQLiteFiles(sqliteFiles);
          updateData.sqliteFiles = sanitizedSqliteFiles?.length
            ? JSON.stringify(sanitizedSqliteFiles)
            : null;
        }

        if (modelFiles !== undefined) {
          const sanitizedModelFiles = sanitizeModelFiles(modelFiles);
          updateData.modelFiles = sanitizedModelFiles?.length
            ? JSON.stringify(sanitizedModelFiles)
            : null;
        }

        if (customFileTypes !== undefined) {
          const sanitizedCustomFileTypes = sanitizeCustomFileTypes(customFileTypes);
          updateData.customFileTypes = sanitizedCustomFileTypes?.length
            ? JSON.stringify(sanitizedCustomFileTypes)
            : null;
        }

        const updatedSite = await db
          .update(sites)
          .set(updateData)
          .where(eq(sites.id, id))
          .returning(SITE_SELECT_FIELDS)
          .get();

        return transformSiteRow(updatedSite);
      },
      'update site',
      { id, data }
    );
  }

  async deleteSite(id: string): Promise<void> {
    await safeExecute(
      async () => {
        const existingSite = await db
          .select({ id: sites.id })
          .from(sites)
          .where(eq(sites.id, id))
          .get();

        if (!existingSite) {
          throw new SiteServiceError('Site not found', 404);
        }

        await db.delete(userSites).where(eq(userSites.siteId, id));
        await db.delete(sites).where(eq(sites.id, id));
      },
      'delete site',
      { id }
    );
  }

  async getSiteConfig(id: string): Promise<SiteConfigResult> {
    return safeExecute(
      async () => {
        const site = await db
          .select()
          .from(sites)
          .where(eq(sites.id, id))
          .get();

        if (!site) {
          throw new SiteServiceError('Site not found', 404);
        }

        const siteConfig = dbSiteToSiteConfig(site);
        const validationErrors = ConfigValidator.validateSiteConfig(siteConfig);

        return { siteConfig, validationErrors } satisfies SiteConfigResult;
      },
      'get site config',
      { id }
    );
  }
}

export const siteService = new SiteService();
