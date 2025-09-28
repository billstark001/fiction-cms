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
import { ConfigValidator } from '../engine/content/config-validator.js';
import { SiteConfig } from '../engine/types.js';
import { deployRateLimit, uploadRateLimit } from '../middleware/rate-limiting.js';
import { sanitizeFileUpload, bodyLimit } from '../middleware/security.js';

const engineRoutes = new Hono();

engineRoutes.use('*', authMiddleware);

// Helper functions
async function getSiteConfig(siteId: string): Promise<Readonly<SiteConfig> | null> {
  const site = await db.select().from(sites).where(eq(sites.id, siteId)).get();
  if (!site) {
    return null;
  }

  const config: SiteConfig = {
    id: site.id,
    name: site.name,
    githubRepositoryUrl: site.githubRepositoryUrl,
    githubPat: (site.githubPatEncrypted as Buffer).toString('utf8'),
    localPath: site.localPath,
    buildCommand: site.buildCommand || undefined,
    buildOutputDir: site.buildOutputDir || undefined,
    validateCommand: site.validateCommand || undefined,
    editablePaths: site.editablePaths ? JSON.parse(site.editablePaths) : undefined,
    sqliteFiles: site.sqliteFiles ? JSON.parse(site.sqliteFiles) : undefined,
    modelFiles: site.modelFiles ? JSON.parse(site.modelFiles) : undefined,
    customFileTypes: site.customFileTypes ? JSON.parse(site.customFileTypes) : undefined,
  };

  return config;
}

async function withSiteConfig<T>(
  c: any,
  siteId: string,
  operation: (siteConfig: Readonly<SiteConfig>) => Promise<T>
): Promise<Response | T> {
  try {
    const siteConfig = await getSiteConfig(siteId);
    if (!siteConfig) {
      return c.json({ error: 'Site not found' }, 404);
    }
    return await operation(siteConfig);
  } catch (error) {
    console.error('Operation error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
}

async function commitChanges(siteConfig: SiteConfig, filePaths: string[], message: string, user: any) {
  const author = { name: user.displayName || user.username, email: user.email };
  return await gitManager.commitAndPush(siteConfig, filePaths, message, author);
}

function createResponse(message: string, data: any = {}, status = 200) {
  return {
    message,
    ...data,
    timestamp: new Date().toISOString()
  };
}

// File routes
engineRoutes.get('/sites/:siteId/files',
  requireSitePermission('content.read'),
  validateParams(siteIdParamSchema),
  async (c) => {
    const { siteId } = c.get('validatedParams');
    return withSiteConfig(c, siteId, async (siteConfig) => {
      const result = await contentManager.getEditableFiles(siteConfig);
      if (!result.success) {
        return c.json({ error: 'Failed to retrieve files', details: result.error }, 500);
      }
      return c.json(createResponse('Files retrieved', { files: result.data }));
    });
  }
);

engineRoutes.get('/sites/:siteId/files/*',
  requireSitePermission('content.read'),
  async (c) => {
    const siteId = c.req.param('siteId');
    const filePath = c.req.param('*');

    if (!filePath) return c.json({ error: 'File path is required' }, 400);

    return withSiteConfig(c, siteId, async (siteConfig) => {
      const result = await contentManager.readTextFile(siteConfig, filePath);
      if (!result.success) {
        const status = result.error?.includes('not found') ? 404 : 500;
        return c.json({ error: 'Failed to read file', details: result.error }, status);
      }
      return c.json(createResponse('File read', { content: result.data, path: filePath }));
    });
  }
);

engineRoutes.put('/sites/:siteId/files/*',
  requireSitePermission('content.write'),
  validateJson(fileOperationSchema),
  async (c) => {
    const siteId = c.req.param('siteId');
    const filePath = c.req.param('*');
    const { content, commitMessage } = c.get('validatedData');
    const user = c.get('user');

    if (!filePath) return c.json({ error: 'File path is required' }, 400);

    return withSiteConfig(c, siteId, async (siteConfig) => {
      const writeResult = await contentManager.writeTextFile(siteConfig, filePath, content);
      if (!writeResult.success) {
        return c.json({ error: 'Failed to write file', details: writeResult.error }, 500);
      }

      const message = commitMessage || `Update ${filePath}`;
      const commitResult = await commitChanges(siteConfig, [filePath], message, user);

      if (!commitResult.success) {
        return c.json({ error: 'File updated but failed to commit', details: commitResult.error }, 500);
      }

      return c.json(createResponse('File updated successfully', {
        path: filePath,
        commitHash: commitResult.hash
      }));
    });
  }
);

engineRoutes.post('/sites/:siteId/files',
  requireSitePermission('content.write'),
  validateParams(siteIdParamSchema),
  validateJson(createFileSchema),
  async (c) => {
    const { siteId } = c.get('validatedParams');
    const { path: filePath, content, commitMessage } = c.get('validatedData');
    const user = c.get('user');

    return withSiteConfig(c, siteId, async (siteConfig) => {
      // Check if file exists
      const existingFile = await contentManager.readTextFile(siteConfig, filePath);
      if (existingFile.success) {
        return c.json({ error: 'File already exists', path: filePath }, 409);
      }

      const writeResult = await contentManager.writeTextFile(siteConfig, filePath, content);
      if (!writeResult.success) {
        return c.json({ error: 'Failed to create file', details: writeResult.error }, 500);
      }

      const message = commitMessage || `Create ${filePath}`;
      const commitResult = await commitChanges(siteConfig, [filePath], message, user);

      return c.json(createResponse('File created successfully', {
        path: filePath,
        commitHash: commitResult.hash || null
      }), 201);
    });
  }
);

engineRoutes.delete('/sites/:siteId/files/*',
  requireSitePermission('content.delete'),
  async (c) => {
    const siteId = c.req.param('siteId');
    const filePath = c.req.param('*');
    const user = c.get('user');

    if (!filePath) return c.json({ error: 'File path is required' }, 400);

    return withSiteConfig(c, siteId, async (siteConfig) => {
      const fullPath = path.join(siteConfig.localPath, filePath);
      try {
        await fs.unlink(fullPath);
      } catch (error) {
        return c.json({
          error: 'Failed to delete file',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
      }

      const commitResult = await commitChanges(siteConfig, [filePath], `Delete ${filePath}`, user);

      return c.json(createResponse('File deleted successfully', {
        path: filePath,
        commitHash: commitResult.hash || null
      }));
    });
  }
);

// SQLite routes helper
async function handleSQLiteOperation(
  c: any,
  siteId: string,
  database: string,
  tableName: string,
  operation: (siteConfig: SiteConfig) => Promise<any>,
  successMessage: string,
  commitFiles: string[] = [],
  user?: any,
  commitMessage?: string
) {
  return withSiteConfig(c, siteId, async (siteConfig) => {
    const result = await operation(siteConfig);
    if (!result.success) {
      return c.json({ error: successMessage.replace('successfully', 'failed'), details: result.error }, 500);
    }

    let commitHash = null;
    if (commitFiles.length && user && commitMessage) {
      const commitResult = await commitChanges(siteConfig, commitFiles, commitMessage, user);
      commitHash = commitResult.hash || null;
    }

    return c.json(createResponse(successMessage, {
      data: result.data,
      commitHash
    }));
  });
}

// SQLite routes
engineRoutes.get('/sites/:siteId/sqlite/:database/tables/:table',
  requireSitePermission('content.read'),
  validateQuery(sqliteQuerySchema.omit({ tableName: true })),
  async (c) => {
    const siteId = c.req.param('siteId');
    const database = c.req.param('database');
    const tableName = c.req.param('table');
    const { limit, offset } = c.get('validatedQuery');

    return withSiteConfig(c, siteId, async (siteConfig) => {
      // Validate SQLite file access using ConfigValidator
      const validation = await ConfigValidator.validateSQLiteConfigWithGlob(siteConfig, database);
      if (!validation.isValid) {
        return c.json({ error: validation.error }, 403);
      }

      // Validate table access
      const tableValidation = ConfigValidator.validateTableAccess(validation.configs![0], tableName);
      if (!tableValidation.isValid) {
        return c.json({ error: tableValidation.error }, 403);
      }

      const result = await contentManager.sqlite.getSQLiteTableData(siteConfig, database, tableName, limit, offset);
      if (!result.success) {
        return c.json({ error: 'Failed to retrieve table data', details: result.error }, 500);
      }

      return c.json(createResponse('Table data retrieved successfully', { data: result.data }));
    });
  }
);

engineRoutes.post('/sites/:siteId/sqlite/:database/tables/:table/rows',
  requireSitePermission('content.write'),
  validateJson(sqliteCreateSchema.omit({ tableName: true })),
  async (c) => {
    const siteId = c.req.param('siteId');
    const database = c.req.param('database');
    const tableName = c.req.param('table');
    const { data, commitMessage } = c.get('validatedData');
    const user = c.get('user');

    return withSiteConfig(c, siteId, async (siteConfig) => {
      // Validate SQLite file access using ConfigValidator
      const validation = await ConfigValidator.validateSQLiteConfigWithGlob(siteConfig, database);
      if (!validation.isValid) {
        return c.json({ error: validation.error }, 403);
      }

      // Validate table access
      const tableValidation = ConfigValidator.validateTableAccess(validation.configs![0], tableName);
      if (!tableValidation.isValid) {
        return c.json({ error: tableValidation.error }, 403);
      }

      // Use new insertTableRow method
      const result = await contentManager.sqlite.insertTableRow(siteConfig, database, tableName, data);
      if (!result.success) {
        return c.json({ error: 'Failed to create row', details: result.error }, 500);
      }

      // Commit changes
      const message = commitMessage || `Add row to ${tableName}`;
      const commitResult = await commitChanges(siteConfig, [database], message, user);

      return c.json(createResponse('Row created successfully', {
        data: result.data,
        commitHash: commitResult.hash || null
      }));
    });
  }
);

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

    return withSiteConfig(c, siteId, async (siteConfig) => {
      // Validate SQLite file access using ConfigValidator
      const validation = await ConfigValidator.validateSQLiteConfigWithGlob(siteConfig, database);
      if (!validation.isValid) {
        return c.json({ error: validation.error }, 403);
      }

      // Validate table access
      const tableValidation = ConfigValidator.validateTableAccess(validation.configs![0], tableName);
      if (!tableValidation.isValid) {
        return c.json({ error: tableValidation.error }, 403);
      }

      // Use new updateTableRow method
      const result = await contentManager.sqlite.updateTableRow(siteConfig, database, tableName, rowId, data);
      if (!result.success) {
        return c.json({ error: 'Failed to update row', details: result.error }, 500);
      }

      // Commit changes
      const message = commitMessage || `Update row ${rowId} in ${tableName}`;
      const commitResult = await commitChanges(siteConfig, [database], message, user);

      return c.json(createResponse('Row updated successfully', {
        data: result.data,
        commitHash: commitResult.hash || null
      }));
    });
  }
);

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

    return withSiteConfig(c, siteId, async (siteConfig) => {
      // Validate SQLite file access using ConfigValidator
      const validation = await ConfigValidator.validateSQLiteConfigWithGlob(siteConfig, database);
      if (!validation.isValid) {
        return c.json({ error: validation.error }, 403);
      }

      // Validate table access
      const tableValidation = ConfigValidator.validateTableAccess(validation.configs![0], tableName);
      if (!tableValidation.isValid) {
        return c.json({ error: tableValidation.error }, 403);
      }

      // Use new deleteTableRow method
      const result = await contentManager.sqlite.deleteTableRow(siteConfig, database, tableName, rowId);
      if (!result.success) {
        return c.json({ error: 'Failed to delete row', details: result.error }, 500);
      }

      // Commit changes
      const message = commitMessage || `Delete row ${rowId} from ${tableName}`;
      const commitResult = await commitChanges(siteConfig, [database], message, user);

      return c.json(createResponse('Row deleted successfully', {
        data: result.data,
        commitHash: commitResult.hash || null
      }));
    });
  }
);

// Validation endpoint
engineRoutes.post('/sites/:siteId/validate',
  requireSitePermission('content.read'),
  validateParams(siteIdParamSchema),
  async (c) => {
    const { siteId } = c.get('validatedParams');

    return withSiteConfig(c, siteId, async (siteConfig) => {
      const validationResult = await gitManager.executeValidation(siteConfig);
      
      let status: 'success' | 'warning' | 'error';
      if (validationResult.success && validationResult.returnCode === 0) {
        status = 'success';
      } else if (validationResult.returnCode === 1) {
        status = 'error';
      } else {
        status = 'warning';
      }

      return c.json(createResponse('Validation completed', {
        status,
        returnCode: validationResult.returnCode,
        stdout: validationResult.stdout,
        stderr: validationResult.stderr,
        executionTime: validationResult.executionTime,
        hasValidateCommand: !!siteConfig.validateCommand
      }));
    });
  }
);

// Asset upload
engineRoutes.post('/sites/:siteId/assets',
  uploadRateLimit,
  bodyLimit(10 * 1024 * 1024),
  sanitizeFileUpload(['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'pdf', 'txt', 'md'], 10 * 1024 * 1024),
  requireSitePermission('content.write'),
  async (c) => {
    const siteId = c.req.param('siteId');
    const user = c.get('user');

    return withSiteConfig(c, siteId, async (siteConfig) => {
      const body = await c.req.parseBody();
      const file = body['file'] as File;
      const path = body['path'] as string;
      const commitMessage = body['commitMessage'] as string;

      if (!file || !path) {
        return c.json({ error: 'File and path are required' }, 400);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await contentManager.asset.uploadAsset(siteConfig, path, buffer);

      if (!result.success) {
        return c.json({ error: 'Failed to upload asset', details: result.error }, 500);
      }

      const message = commitMessage || `Upload asset: ${path}`;
      const commitResult = await commitChanges(siteConfig, [path], message, user);

      return c.json(createResponse('Asset uploaded successfully', {
        path,
        size: buffer.length,
        commitHash: commitResult.hash || null
      }), 201);
    });
  }
);

// Deployment routes
engineRoutes.post('/sites/:siteId/deploy',
  deployRateLimit,
  requireSitePermission('site.deploy'),
  validateJson(deploymentTriggerSchema),
  async (c) => {
    const siteId = c.req.param('siteId');
    const user = c.get('user');

    return withSiteConfig(c, siteId, async (siteConfig) => {
      const taskId = await deploymentEngine.createDeploymentTask(siteConfig, user.username);

      return c.json(createResponse('Deployment task created', {
        taskId,
        siteId,
        triggeredBy: user.username
      }));
    });
  }
);

engineRoutes.get('/sites/:siteId/deploy/:taskId',
  requireSitePermission('site.read'),
  async (c) => {
    const siteId = c.req.param('siteId');
    const taskId = c.req.param('taskId');

    return withSiteConfig(c, siteId, async (siteConfig) => {
      const status = deploymentEngine.getTaskStatus(taskId);

      if (!status || status.siteId !== siteId) {
        return c.json({ error: 'Deployment task not found' }, 404);
      }

      return c.json(createResponse('Deployment status retrieved', {
        taskId,
        status: status.status,
        siteId: status.siteId,
        createdAt: status.createdAt,
        startedAt: status.startedAt,
        completedAt: status.completedAt,
        progress: calculateProgress(status),
        logs: status.logs
      }));
    });
  }
);

engineRoutes.get('/sites/:siteId/deploy',
  requireSitePermission('site.read'),
  validateQuery(paginationSchema.partial()),
  async (c) => {
    const siteId = c.req.param('siteId');
    const { page = 1, limit = 20 } = c.get('validatedQuery');

    return withSiteConfig(c, siteId, async (siteConfig) => {
      const allTasks = deploymentEngine.getActiveTasks()
        .filter(task => task.siteId === siteId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const offset = (page - 1) * limit;
      const paginatedTasks = allTasks.slice(offset, offset + limit);

      return c.json(createResponse('Deployment tasks retrieved', {
        items: paginatedTasks.map(task => ({
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
        }
      }));
    });
  }
);

function calculateProgress(task: any): number {
  const progressMap = {
    pending: 0,
    pulling: 20,
    building: 50,
    deploying: 80,
    completed: 100,
    failed: 100
  };
  return progressMap[task.status as keyof typeof progressMap] || 0;
}

export { engineRoutes };