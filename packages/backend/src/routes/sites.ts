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
import { validateSiteConfig } from '../engine/config-examples.js';

const siteRoutes = new Hono();

// Apply authentication to all site routes
siteRoutes.use('*', authMiddleware);

/**
 * Encrypt GitHub PAT for storage (simplified encryption for demo)
 */
function encryptPat(pat: string): Buffer {
  // In production, use proper encryption like AES-256-GCM
  return Buffer.from(pat, 'utf8');
}

/**
 * Decrypt GitHub PAT from storage (simplified decryption for demo)
 */
function decryptPat(encryptedPat: Buffer): string {
  // In production, use proper decryption
  return encryptedPat.toString('utf8');
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
 * GET /sites - List sites with pagination and search
 */
siteRoutes.get('/', requirePermission('site.read'), validateQuery(paginationSchema.merge(searchSchema.partial())), async (c) => {
  const { page, limit, orderBy = 'name', orderDirection, q } = c.get('validatedQuery');
  const offset = (page - 1) * limit;
  const user = c.get('user');

    try {
      const baseQuery = db.select({
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
      }).from(sites);

      let sitesData;
      
      // Apply search filter if provided
      if (q) {
        sitesData = await baseQuery.where(
          or(
            like(sites.name, `%${q}%`),
            like(sites.githubRepositoryUrl, `%${q}%`),
            like(sites.localPath, `%${q}%`)
          )
        ).limit(limit).offset(offset);
      } else {
        sitesData = await baseQuery.limit(limit).offset(offset);
      }

    // Get total count for pagination
    const totalResult = await db.select({ count: sites.id }).from(sites);
    const total = totalResult.length;

    return c.json({
      sites: sitesData.map(site => ({
        ...site,
        editablePaths: site.editablePaths ? JSON.parse(site.editablePaths) : []
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('List sites error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /sites/:id - Get specific site
 */
siteRoutes.get('/:id', requireSitePermission('site.read'), validateParams(idParamSchema), async (c) => {
  const { id } = c.get('validatedParams');

  try {
    const site = await db.select({
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
    })
    .from(sites)
    .where(eq(sites.id, id))
    .get();

    if (!site) {
      return c.json({ error: 'Site not found' }, 404);
    }

    return c.json({
      site: {
        ...site,
        editablePaths: site.editablePaths ? JSON.parse(site.editablePaths) : []
      }
    });
  } catch (error) {
    console.error('Get site error:', error);
    return c.json({ error: 'Internal server error' }, 500);
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
      id: 'temp', // Will be replaced with actual ID
      name,
      githubRepositoryUrl,
      githubPat,
      localPath,
      buildCommand,
      buildOutputDir,
      editablePaths
    };

    // Validate site configuration
    const configErrors = validateSiteConfig(siteConfig);
    if (configErrors.length > 0) {
      return c.json({
        error: 'Site configuration validation failed',
        details: configErrors
      }, 400);
    }

    // Check if site name already exists
    const existingSite = await db.select()
      .from(sites)
      .where(eq(sites.name, name))
      .get();

    if (existingSite) {
      return c.json({ error: 'Site name already exists' }, 409);
    }

    // Encrypt GitHub PAT
    const encryptedPat = encryptPat(githubPat);

    // Create site
    const newSite = await db.insert(sites)
      .values({
        name,
        githubRepositoryUrl,
        githubPatEncrypted: encryptedPat,
        localPath,
        buildCommand: buildCommand || null,
        buildOutputDir: buildOutputDir || null,
        editablePaths: editablePaths.length > 0 ? JSON.stringify(editablePaths) : null,
        isActive: true
      })
      .returning({
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
      })
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
      site: {
        ...newSite,
        editablePaths: newSite.editablePaths ? JSON.parse(newSite.editablePaths) : []
      }
    }, 201);
  } catch (error) {
    console.error('Create site error:', error);
    return c.json({ error: 'Internal server error' }, 500);
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
    const existingSite = await db.select()
      .from(sites)
      .where(eq(sites.id, id))
      .get();

    if (!existingSite) {
      return c.json({ error: 'Site not found' }, 404);
    }

    // Check if name already exists (excluding current site)
    if (name) {
      const existingName = await db.select()
        .from(sites)
        .where(and(eq(sites.name, name), ne(sites.id, id)))
        .get();

      if (existingName) {
        return c.json({ error: 'Site name already exists' }, 409);
      }
    }

    // Prepare update data
    const updateData: any = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (githubRepositoryUrl !== undefined) updateData.githubRepositoryUrl = githubRepositoryUrl;
    if (githubPat !== undefined) updateData.githubPatEncrypted = encryptPat(githubPat);
    if (localPath !== undefined) updateData.localPath = localPath;
    if (buildCommand !== undefined) updateData.buildCommand = buildCommand;
    if (buildOutputDir !== undefined) updateData.buildOutputDir = buildOutputDir;
    if (editablePaths !== undefined) {
      updateData.editablePaths = editablePaths.length > 0 ? JSON.stringify(editablePaths) : null;
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update site
    const updatedSite = await db.update(sites)
      .set(updateData)
      .where(eq(sites.id, id))
      .returning({
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
      })
      .get();

    return c.json({
      message: 'Site updated successfully',
      site: {
        ...updatedSite,
        editablePaths: updatedSite.editablePaths ? JSON.parse(updatedSite.editablePaths) : []
      }
    });
  } catch (error) {
    console.error('Update site error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * DELETE /sites/:id - Delete site
 */
siteRoutes.delete('/:id', requirePermission('site.admin'), validateParams(idParamSchema), async (c) => {
  const { id } = c.get('validatedParams');

  try {
    // Check if site exists
    const existingSite = await db.select()
      .from(sites)
      .where(eq(sites.id, id))
      .get();

    if (!existingSite) {
      return c.json({ error: 'Site not found' }, 404);
    }

    // Delete user-site assignments first (foreign key constraint)
    await db.delete(userSites).where(eq(userSites.siteId, id));

    // Delete site
    await db.delete(sites).where(eq(sites.id, id));

    return c.json({ message: 'Site deleted successfully' });
  } catch (error) {
    console.error('Delete site error:', error);
    return c.json({ error: 'Internal server error' }, 500);
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
      validationErrors: validateSiteConfig(siteConfig)
    });
  } catch (error) {
    console.error('Get site config error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { siteRoutes };