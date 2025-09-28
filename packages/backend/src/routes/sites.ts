import { Hono } from 'hono';
import { authMiddleware, requirePermission, requireSitePermission } from '../auth/middleware.js';
import { validateJson, validateQuery, validateParams } from '../middleware/validation.js';
import {
  createSiteSchema,
  updateSiteSchema,
  paginationSchema,
  searchSchema,
  idParamSchema
} from '../schemas/index.js';
import { siteService, SiteServiceError } from '../services/site-service.js';

const siteRoutes = new Hono();

// Apply authentication to all site routes
siteRoutes.use('*', authMiddleware);

const handleServiceError = (error: unknown, operation: string, c: any) => {
  if (error instanceof SiteServiceError) {
    const payload: Record<string, unknown> = { error: error.message };
    if (error.details !== undefined) {
      payload.details = error.details;
    }
    return c.json(payload, error.status);
  }

  console.error(`${operation} error:`, error);
  return c.json({ error: 'Internal server error' }, 500);
};

/**
 * GET /sites - List sites with pagination and search
 */
siteRoutes.get(
  '/',
  requirePermission('site.read'),
  validateQuery(paginationSchema.merge(searchSchema.partial())),
  async (c) => {
    const params = c.get('validatedQuery');

    try {
      const result = await siteService.listSites(params);
      return c.json(result);
    } catch (error) {
      return handleServiceError(error, 'List sites', c);
    }
  }
);

/**
 * GET /sites/:id - Get specific site
 */
siteRoutes.get(
  '/:id',
  requireSitePermission('site.read'),
  validateParams(idParamSchema),
  async (c) => {
    const { id } = c.get('validatedParams');

    try {
      const site = await siteService.getSiteById(id);

      if (!site) {
        return c.json({ error: 'Site not found' }, 404);
      }

      return c.json({ site });
    } catch (error) {
      return handleServiceError(error, 'Get site', c);
    }
  }
);

/**
 * POST /sites - Create new site
 */
siteRoutes.post(
  '/',
  requirePermission('site.admin'),
  validateJson(createSiteSchema),
  async (c) => {
    const data = c.get('validatedData');
    const user = c.get('user');

    try {
      const site = await siteService.createSite(data, user.id);
      return c.json({
        message: 'Site created successfully',
        site
      }, 201);
    } catch (error) {
      return handleServiceError(error, 'Create site', c);
    }
  }
);

/**
 * PUT /sites/:id - Update site
 */
siteRoutes.put(
  '/:id',
  requireSitePermission('site.admin'),
  validateParams(idParamSchema),
  validateJson(updateSiteSchema),
  async (c) => {
    const { id } = c.get('validatedParams');
    const data = c.get('validatedData');

    try {
      const site = await siteService.updateSite(id, data);
      return c.json({
        message: 'Site updated successfully',
        site
      });
    } catch (error) {
      return handleServiceError(error, 'Update site', c);
    }
  }
);

/**
 * DELETE /sites/:id - Delete site
 */
siteRoutes.delete(
  '/:id',
  requirePermission('site.admin'),
  validateParams(idParamSchema),
  async (c) => {
    const { id } = c.get('validatedParams');

    try {
      await siteService.deleteSite(id);
      return c.json({ message: 'Site deleted successfully' });
    } catch (error) {
      return handleServiceError(error, 'Delete site', c);
    }
  }
);

/**
 * GET /sites/:id/config - Get site configuration for engine
 */
siteRoutes.get(
  '/:id/config',
  requireSitePermission('site.read'),
  validateParams(idParamSchema),
  async (c) => {
    const { id } = c.get('validatedParams');

    try {
      const { siteConfig, validationErrors } = await siteService.getSiteConfig(id);
      return c.json({ siteConfig, validationErrors });
    } catch (error) {
      return handleServiceError(error, 'Get site config', c);
    }
  }
);

export { siteRoutes };