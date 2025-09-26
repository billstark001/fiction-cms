# Fiction CMS Engine API 集成指南

本指南展示了如何将 Fiction CMS Engine 集成到你的 API 服务中，使用 Hono.js 框架作为示例。

## 快速开始

```typescript
import { gitManager, contentManager, deploymentEngine, SiteConfig } from './engine';

// 定义站点配置
const siteConfig: SiteConfig = {
  id: 'my-blog',
  name: 'My Blog',
  githubRepositoryUrl: 'https://github.com/user/my-blog',
  githubPat: 'ghp_xxxxxxxxxxxx',
  localPath: '/path/to/local/repos/my-blog',
  buildCommand: 'npm run build',
  buildOutputDir: 'dist',
  editablePaths: ['content/', 'data/'],
  sqliteFiles: [
    {
      filePath: 'data/blog.db',
      editableTables: [
        {
          tableName: 'posts',
          editableColumns: ['title', 'content', 'published'],
          displayName: '博客文章'
        }
      ]
    }
  ]
};

// 直接使用各个管理器
await gitManager.initializeRepository(siteConfig);
const fileResult = await contentManager.readTextFile(siteConfig, 'content/post.md');
const taskId = await deploymentEngine.createDeploymentTask(siteConfig);

// 或使用子模块
await contentManager.text.writeTextFile(siteConfig, 'content/post.md', '# New Content');
const sqliteData = await contentManager.sqlite.getSQLiteTableData(siteConfig, 'data/blog.db', 'posts');
await contentManager.asset.uploadAsset(siteConfig, 'images/photo.jpg', buffer);
```

## 模块化架构

新的 Fiction CMS Engine 采用模块化架构，包含以下主要模块：

### 内容管理器 (ContentManager)

- **文本管理器** (`contentManager.text`): 处理 Markdown 和 JSON 文件
- **SQLite 管理器** (`contentManager.sqlite`): 数据库操作
- **资产管理器** (`contentManager.asset`): 二进制文件管理
- **通用操作** (`contentManager.common`): 文件系统工具和路径验证

### Git 管理器 (GitManager)

- 仓库初始化和同步
- 提交和推送操作
- 分支管理

### 部署引擎 (DeploymentEngine)

- GitHub Pages 部署
- 构建任务管理
- 部署状态跟踪

## API 端点实现示例

### 1. 内容管理 API

#### GET /api/sites/:siteId/files - 获取文件列表

```typescript
import { Hono } from 'hono';
import { contentManager } from '../engine';
import { getSiteConfig } from '../config';

const app = new Hono();

app.get('/api/sites/:siteId/files', async (c) => {
  try {
    const siteId = c.req.param('siteId');
    const siteConfig = await getSiteConfig(siteId);
    
    if (!siteConfig) {
      return c.json({ error: '站点不存在' }, 404);
    }

    const result = await contentManager.getEditableFiles(siteConfig);
    
    if (!result.success) {
      return c.json({ error: result.error }, 500);
    }

    return c.json({
      files: result.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({ error: '服务器内部错误' }, 500);
  }
});
```

#### GET /api/sites/:siteId/file - 读取文件内容

```typescript
app.get('/api/sites/:siteId/file', async (c) => {
  try {
    const siteId = c.req.param('siteId');
    const filePath = c.req.query('path');
    
    if (!filePath) {
      return c.json({ error: '缺少文件路径参数' }, 400);
    }

    const siteConfig = await getSiteConfig(siteId);
    if (!siteConfig) {
      return c.json({ error: '站点不存在' }, 404);
    }

    const result = await contentManager.readTextFile(siteConfig, filePath);
    
    if (!result.success) {
      return c.json({ error: result.error }, 500);
    }

    return c.json({
      path: filePath,
      content: result.content,
      lastModified: result.lastModified
    });
  } catch (error) {
    return c.json({ error: '服务器内部错误' }, 500);
  }
});
```

#### POST /api/sites/:siteId/file - 更新文件内容

```typescript
app.post('/api/sites/:siteId/file', async (c) => {
  try {
    const siteId = c.req.param('siteId');
    const filePath = c.req.query('path');
    const body = await c.req.json();
    
    if (!filePath || !body.content) {
      return c.json({ error: '缺少必要参数' }, 400);
    }

    const siteConfig = await getSiteConfig(siteId);
    if (!siteConfig) {
      return c.json({ error: '站点不存在' }, 404);
    }

    // 写入文件
    const writeResult = await contentManager.writeTextFile(siteConfig, filePath, body.content);
    if (!writeResult.success) {
      return c.json({ error: writeResult.error }, 500);
    }

    // 提交更改
    const commitMessage = body.commitMessage || `Update ${filePath}`;
    const author = { name: 'CMS User', email: 'cms@example.com' };
    
    const commitResult = await gitManager.commitAndPushChanges(
      siteConfig,
      [filePath],
      commitMessage,
      author
    );

    if (!commitResult.success) {
      return c.json({ error: commitResult.error }, 500);
    }

    return c.json({
      message: '文件更新成功',
      commitHash: commitResult.hash
    });
  } catch (error) {
    return c.json({ error: '服务器内部错误' }, 500);
  }
});
```

### 2. SQLite 数据管理 API

#### GET /api/sites/:siteId/sqlite/:tableName - 获取表数据

```typescript
app.get('/api/sites/:siteId/sqlite/:tableName', async (c) => {
  try {
    const siteId = c.req.param('siteId');
    const tableName = c.req.param('tableName');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');

    const siteConfig = await getSiteConfig(siteId);
    if (!siteConfig) {
      return c.json({ error: '站点不存在' }, 404);
    }

    // 查找对应的 SQLite 文件
    const sqliteFile = siteConfig.sqliteFiles?.find(f => 
      f.editableTables.some(t => t.tableName === tableName)
    );

    if (!sqliteFile) {
      return c.json({ error: '表不存在或不可编辑' }, 404);
    }

    const result = await contentManager.sqlite.getSQLiteTableData(
      siteConfig,
      sqliteFile.filePath,
      tableName,
      page,
      limit
    );

    if (!result.success) {
      return c.json({ error: result.error }, 500);
    }

    return c.json({
      tableName,
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({ error: '服务器内部错误' }, 500);
  }
});
```

#### POST /api/sites/:siteId/sqlite/:tableName - 插入数据

```typescript
app.post('/api/sites/:siteId/sqlite/:tableName', async (c) => {
  try {
    const siteId = c.req.param('siteId');
    const tableName = c.req.param('tableName');
    const body = await c.req.json();

    const siteConfig = await getSiteConfig(siteId);
    if (!siteConfig) {
      return c.json({ error: '站点不存在' }, 404);
    }

    const sqliteFile = siteConfig.sqliteFiles?.find(f => 
      f.editableTables.some(t => t.tableName === tableName)
    );

    if (!sqliteFile) {
      return c.json({ error: '表不存在或不可编辑' }, 404);
    }

    const result = await contentManager.sqlite.insertSQLiteTableData(
      siteConfig,
      sqliteFile.filePath,
      tableName,
      body
    );

    if (!result.success) {
      return c.json({ error: result.error }, 500);
    }

    // 提交数据库更改
    const commitMessage = body.commitMessage || `Add record to ${tableName}`;
    const author = { name: 'CMS User', email: 'cms@example.com' };
    
    await gitManager.commitAndPushChanges(
      siteConfig,
      [sqliteFile.filePath],
      commitMessage,
      author
    );

    return c.json({
      message: '数据插入成功',
      id: result.id
    });
  } catch (error) {
    return c.json({ error: '服务器内部错误' }, 500);
  }
});
```

### 3. 资产管理 API

#### POST /api/sites/:siteId/assets - 上传资产文件

```typescript
app.post('/api/sites/:siteId/assets', async (c) => {
  try {
    const siteId = c.req.param('siteId');
    const body = await c.req.parseBody();
    
    const file = body['file'] as File;
    const targetPath = body['path'] as string;
    
    if (!file || !targetPath) {
      return c.json({ error: '缺少文件或目标路径' }, 400);
    }

    const siteConfig = await getSiteConfig(siteId);
    if (!siteConfig) {
      return c.json({ error: '站点不存在' }, 404);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    const result = await contentManager.asset.uploadAsset(
      siteConfig,
      targetPath,
      buffer
    );

    if (!result.success) {
      return c.json({ error: result.error }, 500);
    }

    // 提交文件更改
    const commitMessage = `Upload asset: ${targetPath}`;
    const author = { name: 'CMS User', email: 'cms@example.com' };
    
    await gitManager.commitAndPushChanges(
      siteConfig,
      [targetPath],
      commitMessage,
      author
    );

    return c.json({
      message: '资产上传成功',
      path: targetPath,
      size: buffer.length
    });
  } catch (error) {
    return c.json({ error: '服务器内部错误' }, 500);
  }
});
```

### 4. 部署管理 API

#### POST /api/sites/:siteId/deploy - 触发部署

```typescript
app.post('/api/sites/:siteId/deploy', async (c) => {
  try {
    const siteId = c.req.param('siteId');
    const siteConfig = await getSiteConfig(siteId);
    
    if (!siteConfig) {
      return c.json({ error: '站点不存在' }, 404);
    }

    const taskId = await deploymentEngine.createDeploymentTask(siteConfig);

    return c.json({
      message: '部署任务已创建',
      taskId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({ error: '服务器内部错误' }, 500);
  }
});
```

#### GET /api/sites/:siteId/deploy/:taskId - 查询部署状态

```typescript
app.get('/api/sites/:siteId/deploy/:taskId', async (c) => {
  try {
    const taskId = c.req.param('taskId');
    const status = deploymentEngine.getDeploymentStatus(taskId);

    if (!status) {
      return c.json({ error: '部署任务不存在' }, 404);
    }

    return c.json({
      taskId,
      status: status.status,
      progress: status.progress,
      logs: status.logs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({ error: '服务器内部错误' }, 500);
  }
});
```

## 文件操作详解

### 使用统一的内容管理器

```typescript
// 读取文件
const result = await contentManager.readTextFile(siteConfig, 'content/post.md');
if (result.success) {
  console.log('文件内容:', result.content);
}

// 写入文件
await contentManager.writeTextFile(siteConfig, 'content/post.md', '# 新内容');

// 扫描目录
const files = await contentManager.scanDirectory(siteConfig, 'content/');
```

### 使用专门的子模块

```typescript
// 文本文件操作
await contentManager.text.writeTextFile(siteConfig, 'content/post.md', content);
const textResult = await contentManager.text.readTextFile(siteConfig, 'content/post.md');

// SQLite 数据库操作
const data = await contentManager.sqlite.getSQLiteTableData(siteConfig, 'data/blog.db', 'posts');
await contentManager.sqlite.updateSQLiteTableData(siteConfig, 'data/blog.db', 'posts', 1, updateData);

// 资产文件操作
await contentManager.asset.uploadAsset(siteConfig, 'images/photo.jpg', buffer);
const assetExists = await contentManager.asset.assetExists(siteConfig, 'images/photo.jpg');

// 通用文件系统操作
const isValidPath = contentManager.common.validatePath('content/post.md');
const files = await contentManager.common.scanDirectory('/path/to/dir', '.md');
```

## 错误处理最佳实践

```typescript
// 标准错误处理模式
try {
  const result = await contentManager.readTextFile(siteConfig, filePath);
  
  if (!result.success) {
    // 处理业务逻辑错误
    return c.json({ 
      error: result.error,
      code: 'BUSINESS_ERROR' 
    }, 400);
  }
  
  // 处理成功情况
  return c.json({ data: result.content });
  
} catch (error) {
  // 处理系统异常
  console.error('Unexpected error:', error);
  return c.json({ 
    error: '服务器内部错误',
    code: 'INTERNAL_ERROR' 
  }, 500);
}
```

## 认证与授权集成

```typescript
// 中间件示例
const authMiddleware = async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return c.json({ error: '未提供认证令牌' }, 401);
  }
  
  try {
    const user = await verifyToken(token); // 你的令牌验证逻辑
    c.set('user', user);
    await next();
  } catch (error) {
    return c.json({ error: '无效的认证令牌' }, 401);
  }
};

// 在路由中使用
app.use('/api/*', authMiddleware);

app.post('/api/sites/:siteId/file', async (c) => {
  const user = c.get('user');
  
  // 检查用户权限
  const hasPermission = await checkUserPermission(user.id, siteId, 'write');
  if (!hasPermission) {
    return c.json({ error: '无权限操作' }, 403);
  }
  
  // 继续文件操作...
});
```

## 日志记录

```typescript
import { logger } from './utils/logger';

app.post('/api/sites/:siteId/file', async (c) => {
  const startTime = Date.now();
  const user = c.get('user');
  
  try {
    logger.info('File update started', {
      siteId,
      filePath,
      userId: user.id,
      timestamp: new Date().toISOString()
    });
    
    // 执行文件操作...
    
    logger.info('File update completed', {
      siteId,
      filePath,
      userId: user.id,
      duration: Date.now() - startTime
    });
    
    return c.json({ success: true });
    
  } catch (error) {
    logger.error('File update failed', {
      siteId,
      filePath,
      userId: user.id,
      error: error.message,
      duration: Date.now() - startTime
    });
    
    return c.json({ error: '操作失败' }, 500);
  }
});
```

## 性能优化建议

1. **缓存策略**: 对频繁读取的文件实现缓存
2. **批量操作**: 支持批量文件操作以减少 I/O
3. **异步处理**: 对耗时操作使用后台任务
4. **连接池管理**: 合理管理 SQLite 连接

```typescript
// 缓存示例
const fileCache = new Map();

const getCachedFile = async (siteConfig, filePath) => {
  const cacheKey = `${siteConfig.id}:${filePath}`;
  
  if (fileCache.has(cacheKey)) {
    const cached = fileCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 300000) { // 5分钟缓存
      return cached.content;
    }
  }
  
  const result = await contentManager.readTextFile(siteConfig, filePath);
  if (result.success) {
    fileCache.set(cacheKey, {
      content: result.content,
      timestamp: Date.now()
    });
  }
  
  return result;
};
```

## 测试集成

```typescript
// 测试用例示例
import { describe, it, expect, beforeEach } from 'vitest';
import { contentManager, gitManager } from '../src/engine';

describe('Content Management API', () => {
  const testSiteConfig = {
    id: 'test-site',
    localPath: '/tmp/test-site',
    // ... 其他配置
  };

  beforeEach(async () => {
    // 设置测试环境
    await gitManager.initializeRepository(testSiteConfig);
  });

  it('should read text files correctly', async () => {
    const content = '# Test Content';
    await contentManager.writeTextFile(testSiteConfig, 'test.md', content);
    
    const result = await contentManager.readTextFile(testSiteConfig, 'test.md');
    expect(result.success).toBe(true);
    expect(result.content).toBe(content);
  });

  it('should handle non-existent files gracefully', async () => {
    const result = await contentManager.readTextFile(testSiteConfig, 'nonexistent.md');
    expect(result.success).toBe(false);
    expect(result.error).toContain('文件不存在');
  });
});
```

这个模块化的引擎设计为完全可测试和可扩展的，为你的 Fiction CMS 提供了坚实的基础。
