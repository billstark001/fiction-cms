import { Hono } from 'hono';
import fs from 'fs/promises';
import path from 'path';
import { db } from '../db/index.js';
import { sites } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware, requireSitePermission } from '../auth/middleware.js';
import { validateJson, validateQuery, validateParams } from '../middleware/validation.js';
import { 
  fileOperationSchema,
  createFileSchema,
  sqliteQuerySchema,
  sqliteUpdateSchema,
  sqliteCreateSchema,
  sqliteDeleteSchema,
  siteIdParamSchema,
  deploymentTriggerSchema,
  paginationSchema
} from '../schemas/index.js';
import { contentManager, gitManager, deploymentEngine } from '../engine/index.js';
import { SiteConfig } from '../engine/types.js';
import { deployRateLimit, uploadRateLimit } from '../middleware/rate-limiting.js';
import { sanitizeFileUpload, bodyLimit } from '../middleware/security.js';
import { handleError } from '../utils/error-handling.js';

const engineRoutes = new Hono();

// Apply authentication to all engine routes
engineRoutes.use('*', authMiddleware);

/**
 * Helper function to get site config from database
 */
async function getSiteConfig(siteId: string): Promise<SiteConfig | null> {
  const site = await db.select()
    .from(sites)
    .where(eq(sites.id, siteId))
    .get();

  if (!site) {
    return null;
  }

  // Decrypt GitHub PAT (simplified for demo)
  const githubPat = (site.githubPatEncrypted as Buffer).toString('utf8');

  return {
    id: site.id,
    name: site.name,
    githubRepositoryUrl: site.githubRepositoryUrl,
    githubPat,
    localPath: site.localPath,
    buildCommand: site.buildCommand || undefined,
    buildOutputDir: site.buildOutputDir || undefined,
    editablePaths: site.editablePaths ? JSON.parse(site.editablePaths) : undefined,
  };
}

/**
 * GET /engine/sites/:siteId/files - Get list of editable files
 */
engineRoutes.get('/sites/:siteId/files', 
  requireSitePermission('content.read'), 
  validateParams(siteIdParamSchema), 
  async (c) => {
    const { siteId } = c.get('validatedParams');

    try {
      const siteConfig = await getSiteConfig(siteId);
      if (!siteConfig) {
        return c.json({ error: 'Site not found' }, 404);
      }

      const result = await contentManager.getEditableFiles(siteConfig);
      
      if (!result.success) {
        return c.json({ 
          error: 'Failed to retrieve files',
          details: result.error 
        }, 500);
      }

      return c.json({
        files: result.data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get files error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

/**
 * GET /engine/sites/:siteId/files/* - Get specific file content
 */
engineRoutes.get('/sites/:siteId/files/*', 
  requireSitePermission('content.read'),
  async (c) => {
    const siteId = c.req.param('siteId');
    const filePath = c.req.param('*'); // Get the wildcard part

    if (!filePath) {
      return c.json({ error: 'File path is required' }, 400);
    }

    try {
      const siteConfig = await getSiteConfig(siteId);
      if (!siteConfig) {
        return c.json({ error: 'Site not found' }, 404);
      }

      const result = await contentManager.readTextFile(siteConfig, filePath);
      
      if (!result.success) {
        return c.json({ 
          error: 'Failed to read file',
          details: result.error 
        }, result.error?.includes('not found') ? 404 : 500);
      }

      return c.json({
        content: result.data,
        path: filePath,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get file content error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

/**
 * PUT /engine/sites/:siteId/files/* - Update file content
 */
engineRoutes.put('/sites/:siteId/files/*', 
  requireSitePermission('content.write'),
  validateJson(fileOperationSchema),
  async (c) => {
    const siteId = c.req.param('siteId');
    const filePath = c.req.param('*');
    const { content, commitMessage } = c.get('validatedData');
    const user = c.get('user');

    if (!filePath) {
      return c.json({ error: 'File path is required' }, 400);
    }

    try {
      const siteConfig = await getSiteConfig(siteId);
      if (!siteConfig) {
        return c.json({ error: 'Site not found' }, 404);
      }

      // Write file
      const writeResult = await contentManager.writeTextFile(siteConfig, filePath, content);
      
      if (!writeResult.success) {
        return c.json({ 
          error: 'Failed to write file',
          details: writeResult.error 
        }, 500);
      }

      // Commit changes
      const defaultCommitMessage = commitMessage || `Update ${filePath}`;
      const author = { 
        name: user.displayName || user.username, 
        email: user.email 
      };
      
      const commitResult = await gitManager.commitAndPush(
        siteConfig,
        [filePath],
        defaultCommitMessage,
        author
      );

      if (!commitResult.success) {
        return c.json({ 
          error: 'File updated but failed to commit',
          details: commitResult.error 
        }, 500);
      }

      return c.json({
        message: 'File updated successfully',
        path: filePath,
        commitHash: commitResult.hash,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Update file content error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

/**
 * POST /engine/sites/:siteId/files - Create new file
 */
engineRoutes.post('/sites/:siteId/files', 
  requireSitePermission('content.write'),
  validateParams(siteIdParamSchema),
  validateJson(createFileSchema),
  async (c) => {
    const { siteId } = c.get('validatedParams');
    const { path: filePath, content, commitMessage } = c.get('validatedData');
    const user = c.get('user');

    try {
      const siteConfig = await getSiteConfig(siteId);
      if (!siteConfig) {
        return c.json({ error: 'Site not found' }, 404);
      }

      // Check if file already exists
      const existingFile = await contentManager.readTextFile(siteConfig, filePath);
      if (existingFile.success) {
        return c.json({ 
          error: 'File already exists',
          path: filePath 
        }, 409);
      }

      // Create file
      const writeResult = await contentManager.writeTextFile(siteConfig, filePath, content);
      
      if (!writeResult.success) {
        return c.json({ 
          error: 'Failed to create file',
          details: writeResult.error 
        }, 500);
      }

      // Commit changes
      const defaultCommitMessage = commitMessage || `Create ${filePath}`;
      const author = { 
        name: user.displayName || user.username, 
        email: user.email 
      };
      
      const commitResult = await gitManager.commitAndPush(
        siteConfig,
        [filePath],
        defaultCommitMessage,
        author
      );

      return c.json({
        message: 'File created successfully',
        path: filePath,
        commitHash: commitResult.hash || null,
        timestamp: new Date().toISOString()
      }, 201);
    } catch (error) {
      console.error('Create file error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

/**
 * DELETE /engine/sites/:siteId/files/* - Delete file
 */
engineRoutes.delete('/sites/:siteId/files/*', 
  requireSitePermission('content.delete'),
  async (c) => {
    const siteId = c.req.param('siteId');
    const filePath = c.req.param('*');
    const user = c.get('user');

    if (!filePath) {
      return c.json({ error: 'File path is required' }, 400);
    }

    try {
      const siteConfig = await getSiteConfig(siteId);
      if (!siteConfig) {
        return c.json({ error: 'Site not found' }, 404);
      }

      // Delete file using file system
      const fullPath = path.join(siteConfig.localPath, filePath);
      try {
        await fs.unlink(fullPath);
        const deleteResult = { success: true };
      } catch (error) {
        return c.json({ 
          error: 'Failed to delete file',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
      }

      // Commit changes
      const commitMessage = `Delete ${filePath}`;
      const author = { 
        name: user.displayName || user.username, 
        email: user.email 
      };
      
      const commitResult = await gitManager.commitAndPush(
        siteConfig,
        [filePath],
        commitMessage,
        author
      );

      return c.json({
        message: 'File deleted successfully',
        path: filePath,
        commitHash: commitResult.hash || null,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Delete file error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

/**
 * GET /engine/sites/:siteId/sqlite/:database/tables/:table - Get SQLite table data
 */
engineRoutes.get('/sites/:siteId/sqlite/:database/tables/:table', 
  requireSitePermission('content.read'),
  validateQuery(sqliteQuerySchema.omit({ tableName: true })),
  async (c) => {
    const siteId = c.req.param('siteId');
    const database = c.req.param('database');
    const tableName = c.req.param('table');
    const { limit, offset, orderBy, orderDirection } = c.get('validatedQuery');

    try {
      const siteConfig = await getSiteConfig(siteId);
      if (!siteConfig) {
        return c.json({ error: 'Site not found' }, 404);
      }

      const result = await contentManager.sqlite.getSQLiteTableData(
        siteConfig,
        database,
        tableName,
        limit,
        offset
      );
      
      if (!result.success) {
        return c.json({ 
          error: 'Failed to retrieve table data',
          details: result.error 
        }, 500);
      }

      return c.json({
        table: result.data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get SQLite table data error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

/**
 * POST /engine/sites/:siteId/sqlite/:database/tables/:table/rows - Create new row
 */
engineRoutes.post('/sites/:siteId/sqlite/:database/tables/:table/rows', 
  requireSitePermission('content.write'),
  validateJson(sqliteCreateSchema.omit({ tableName: true })),
  async (c) => {
    const siteId = c.req.param('siteId');
    const database = c.req.param('database');
    const tableName = c.req.param('table');
    const { data, commitMessage } = c.get('validatedData');
    const user = c.get('user');

    try {
      const siteConfig = await getSiteConfig(siteId);
      if (!siteConfig) {
        return c.json({ error: 'Site not found' }, 404);
      }

      const result = await contentManager.sqlite.insertSQLiteData(
        siteConfig,
        database,
        tableName,
        [data] // Wrap in array as expected by the method
      );
      
      if (!result.success) {
        return c.json({ 
          error: 'Failed to create row',
          details: result.error 
        }, 500);
      }

      // Commit changes
      const defaultCommitMessage = commitMessage || `Add row to ${tableName}`;
      const author = { 
        name: user.displayName || user.username, 
        email: user.email 
      };
      
      const commitResult = await gitManager.commitAndPush(
        siteConfig,
        [database],
        defaultCommitMessage,
        author
      );

      return c.json({
        message: 'Row created successfully',
        data: result.data,
        commitHash: commitResult.hash || null,
        timestamp: new Date().toISOString()
      }, 201);
    } catch (error) {
      console.error('Create SQLite row error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

/**
 * PUT /engine/sites/:siteId/sqlite/:database/tables/:table/rows/:rowId - Update row
 */
engineRoutes.put('/sites/:siteId/sqlite/:database/tables/:table/rows/:rowId', 
  requireSitePermission('content.write'),
  validateJson(sqliteUpdateSchema.omit({ tableName: true, rowId: true })),
  async (c) => {
    const siteId = c.req.param('siteId');
    const database = c.req.param('database');
    const tableName = c.req.param('table');
    const rowId = c.req.param('rowId');
    const { data, commitMessage } = c.get('validatedData');
    const user = c.get('user');

    try {
      const siteConfig = await getSiteConfig(siteId);
      if (!siteConfig) {
        return c.json({ error: 'Site not found' }, 404);
      }

      const result = await contentManager.sqlite.updateSQLiteData(
        siteConfig,
        database,
        tableName,
        [{
          whereCondition: { id: rowId }, // Assuming 'id' is the primary key
          updateData: data
        }]
      );
      
      if (!result.success) {
        return c.json({ 
          error: 'Failed to update row',
          details: result.error 
        }, 500);
      }

      // Commit changes
      const defaultCommitMessage = commitMessage || `Update row ${rowId} in ${tableName}`;
      const author = { 
        name: user.displayName || user.username, 
        email: user.email 
      };
      
      const commitResult = await gitManager.commitAndPush(
        siteConfig,
        [database],
        defaultCommitMessage,
        author
      );

      return c.json({
        message: 'Row updated successfully',
        data: result.data,
        commitHash: commitResult.hash || null,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Update SQLite row error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

/**
 * DELETE /engine/sites/:siteId/sqlite/:database/tables/:table/rows/:rowId - Delete row
 */
engineRoutes.delete('/sites/:siteId/sqlite/:database/tables/:table/rows/:rowId', 
  requireSitePermission('content.write'),
  validateJson(sqliteDeleteSchema.omit({ tableName: true, rowId: true })),
  async (c) => {
    const siteId = c.req.param('siteId');
    const database = c.req.param('database');
    const tableName = c.req.param('table');
    const rowId = c.req.param('rowId');
    const { commitMessage } = c.get('validatedData');
    const user = c.get('user');

    try {
      const siteConfig = await getSiteConfig(siteId);
      if (!siteConfig) {
        return c.json({ error: 'Site not found' }, 404);
      }

      const result = await contentManager.sqlite.deleteSQLiteData(
        siteConfig,
        database,
        tableName,
        [{ id: rowId }] // Wrap in array with condition object
      );
      
      if (!result.success) {
        return c.json({ 
          error: 'Failed to delete row',
          details: result.error 
        }, 500);
      }

      // Commit changes
      const defaultCommitMessage = commitMessage || `Delete row ${rowId} from ${tableName}`;
      const author = { 
        name: user.displayName || user.username, 
        email: user.email 
      };
      
      const commitResult = await gitManager.commitAndPush(
        siteConfig,
        [database],
        defaultCommitMessage,
        author
      );

      return c.json({
        message: 'Row deleted successfully',
        rowId: rowId,
        commitHash: commitResult.hash || null,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Delete SQLite row error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

/**
 * POST /engine/sites/:siteId/assets - Upload asset file
 */
engineRoutes.post('/sites/:siteId/assets', 
  uploadRateLimit,
  bodyLimit(10 * 1024 * 1024), // 10MB limit for assets
  sanitizeFileUpload(['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'pdf', 'txt', 'md'], 10 * 1024 * 1024),
  requireSitePermission('content.write'),
  async (c) => {
    const siteId = c.req.param('siteId');
    const user = c.get('user');

    try {
      const siteConfig = await getSiteConfig(siteId);
      if (!siteConfig) {
        return c.json({ error: 'Site not found' }, 404);
      }

      const body = await c.req.parseBody();
      const file = body['file'] as File;
      const path = body['path'] as string;
      const commitMessage = body['commitMessage'] as string;

      if (!file) {
        return c.json({ error: 'No file provided' }, 400);
      }

      if (!path) {
        return c.json({ error: 'No path provided' }, 400);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      
      const result = await contentManager.asset.uploadAsset(
        siteConfig,
        path,
        buffer
      );
      
      if (!result.success) {
        return c.json({ 
          error: 'Failed to upload asset',
          details: result.error 
        }, 500);
      }

      // Commit changes
      const defaultCommitMessage = commitMessage || `Upload asset: ${path}`;
      const author = { 
        name: user.displayName || user.username, 
        email: user.email 
      };
      
      const commitResult = await gitManager.commitAndPush(
        siteConfig,
        [path],
        defaultCommitMessage,
        author
      );

      return c.json({
        message: 'Asset uploaded successfully',
        path: path,
        size: buffer.length,
        commitHash: commitResult.hash || null,
        timestamp: new Date().toISOString()
      }, 201);
    } catch (error) {
      return handleError(error, 'Upload asset', c);
    }
  }
);

/**
 * POST /engine/sites/:siteId/deploy - Trigger deployment
 */
engineRoutes.post('/sites/:siteId/deploy', 
  deployRateLimit,
  requireSitePermission('site.deploy'),
  validateJson(deploymentTriggerSchema),
  async (c) => {
    const siteId = c.req.param('siteId');
    const { force, branch } = c.get('validatedData');
    const user = c.get('user');

    try {
      const siteConfig = await getSiteConfig(siteId);
      if (!siteConfig) {
        return c.json({ error: 'Site not found' }, 404);
      }

      const taskId = await deploymentEngine.createDeploymentTask(
        siteConfig, 
        user.username
      );

      return c.json({
        message: 'Deployment task created',
        taskId,
        siteId,
        triggeredBy: user.username,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return handleError(error, 'Trigger deployment', c);
    }
  }
);

/**
 * GET /engine/sites/:siteId/deploy/:taskId - Get deployment status
 */
engineRoutes.get('/sites/:siteId/deploy/:taskId', 
  requireSitePermission('site.read'),
  async (c) => {
    const siteId = c.req.param('siteId');
    const taskId = c.req.param('taskId');

    try {
      const siteConfig = await getSiteConfig(siteId);
      if (!siteConfig) {
        return c.json({ error: 'Site not found' }, 404);
      }

      const status = deploymentEngine.getTaskStatus(taskId);

      if (!status) {
        return c.json({ error: 'Deployment task not found' }, 404);
      }

      // Verify task belongs to this site
      if (status.siteId !== siteId) {
        return c.json({ error: 'Deployment task not found' }, 404);
      }

      return c.json({
        taskId,
        status: status.status,
        siteId: status.siteId,
        createdAt: status.createdAt,
        startedAt: status.startedAt,
        completedAt: status.completedAt,
        progress: calculateProgress(status),
        logs: status.logs,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get deployment status error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

/**
 * GET /engine/sites/:siteId/deploy - Get all deployment tasks for site
 */
engineRoutes.get('/sites/:siteId/deploy', 
  requireSitePermission('site.read'),
  validateQuery(paginationSchema.partial()),
  async (c) => {
    const siteId = c.req.param('siteId');
    const { page = 1, limit = 20 } = c.get('validatedQuery');

    try {
      const siteConfig = await getSiteConfig(siteId);
      if (!siteConfig) {
        return c.json({ error: 'Site not found' }, 404);
      }

      const allTasks = deploymentEngine.getActiveTasks()
        .filter(task => task.siteId === siteId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const offset = (page - 1) * limit;
      const paginatedTasks = allTasks.slice(offset, offset + limit);

      return c.json({
        tasks: paginatedTasks.map(task => ({
          taskId: task.id,
          status: task.status,
          createdAt: task.createdAt,
          startedAt: task.startedAt,
          completedAt: task.completedAt,
          progress: calculateProgress(task)
        })),
        pagination: {
          page,
          limit,
          total: allTasks.length,
          totalPages: Math.ceil(allTasks.length / limit)
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get deployment tasks error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// Helper function to calculate progress
function calculateProgress(task: any): number {
  switch (task.status) {
    case 'pending': return 0;
    case 'pulling': return 20;
    case 'building': return 50;
    case 'deploying': return 80;
    case 'completed': return 100;
    case 'failed': return 100;
    default: return 0;
  }
}

export { engineRoutes };