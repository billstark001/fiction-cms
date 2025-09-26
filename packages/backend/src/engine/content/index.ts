import fs from 'fs/promises';
import path from 'path';
import { SiteConfig, ContentFile, FileOperationResult } from '../types.js';
import { textFileManager } from './text-manager.js';
import { sqliteManager } from './sqlite-manager.js';
import { assetManager } from './asset-manager.js';
import { commonFileOperations } from './common-operations.js';

// 导出基础管理器类供扩展使用
export { BaseManager } from './base-manager.js';

/**
 * 内容管理器
 * 统一的内容管理接口，整合所有子模块的功能
 */
export class ContentManager {
  
  // 公开各个子管理器，允许直接访问
  public readonly text = textFileManager;
  public readonly sqlite = sqliteManager;
  public readonly asset = assetManager;
  public readonly common = commonFileOperations;

  /**
   * 获取站点的所有可编辑文件列表
   */
  async getEditableFiles(siteConfig: SiteConfig): Promise<FileOperationResult> {
    const { localPath, editablePaths = [], sqliteFiles = [] } = siteConfig;

    try {
      const files: ContentFile[] = [];

      // 处理普通文件路径
      for (const editablePath of editablePaths) {
        const fullPath = path.join(localPath, editablePath);
        const pathFiles = await commonFileOperations.scanDirectory(fullPath, localPath);
        files.push(...pathFiles);
      }

      // 处理SQLite文件
      for (const sqliteConfig of sqliteFiles) {
        const sqliteFilePath = path.join(localPath, sqliteConfig.filePath);
        try {
          const stats = await fs.stat(sqliteFilePath);
          files.push({
            path: path.relative(localPath, sqliteFilePath),
            type: 'sqlite',
            lastModified: stats.mtime,
            size: stats.size
          });
        } catch (error) {
          // SQLite文件不存在，跳过
        }
      }

      return {
        success: true,
        data: files.sort((a, b) => a.path.localeCompare(b.path))
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取文件列表失败'
      };
    }
  }

  // 文本文件操作的便捷方法
  async readTextFile(siteConfig: SiteConfig, relativePath: string) {
    return this.text.readTextFile(siteConfig, relativePath);
  }

  async writeTextFile(siteConfig: SiteConfig, relativePath: string, content: string) {
    return this.text.writeTextFile(siteConfig, relativePath, content);
  }

  // SQLite操作的便捷方法
  async getSQLiteTableData(
    siteConfig: SiteConfig, 
    sqliteFilePath: string, 
    tableName: string,
    limit?: number,
    offset?: number
  ) {
    return this.sqlite.getSQLiteTableData(siteConfig, sqliteFilePath, tableName, limit, offset);
  }

  async updateSQLiteData(
    siteConfig: SiteConfig,
    sqliteFilePath: string,
    tableName: string,
    updates: Parameters<typeof sqliteManager.updateSQLiteData>[3]
  ) {
    return this.sqlite.updateSQLiteData(siteConfig, sqliteFilePath, tableName, updates);
  }

  async insertSQLiteData(
    siteConfig: SiteConfig,
    sqliteFilePath: string,
    tableName: string,
    insertData: Record<string, any>[]
  ) {
    return this.sqlite.insertSQLiteData(siteConfig, sqliteFilePath, tableName, insertData);
  }

  async deleteSQLiteData(
    siteConfig: SiteConfig,
    sqliteFilePath: string,
    tableName: string,
    whereConditions: Record<string, any>[]
  ) {
    return this.sqlite.deleteSQLiteData(siteConfig, sqliteFilePath, tableName, whereConditions);
  }

  // 资产文件操作的便捷方法
  async uploadAsset(siteConfig: SiteConfig, relativePath: string, buffer: Buffer) {
    return this.asset.uploadAsset(siteConfig, relativePath, buffer);
  }

  /**
   * 关闭SQLite连接
   */
  closeSQLiteConnection(siteId: string, sqliteFilePath?: string): void {
    this.sqlite.closeSQLiteConnection(siteId, sqliteFilePath);
  }

  /**
   * 关闭所有SQLite连接
   */
  closeAllSQLiteConnections(): void {
    this.sqlite.closeAllSQLiteConnections();
  }

  /**
   * 获取文件统计信息
   */
  async getFileStats(siteConfig: SiteConfig, relativePath: string): Promise<FileOperationResult> {
    const fullPath = path.join(siteConfig.localPath, relativePath);

    try {
      if (!commonFileOperations.isPathAllowed(siteConfig, relativePath)) {
        return {
          success: false,
          error: '访问被拒绝：文件不在允许的编辑路径内'
        };
      }

      const stats = await commonFileOperations.getFileStats(fullPath);
      const ext = path.extname(relativePath).toLowerCase();

      let fileType: ContentFile['type'] = 'asset';
      if (ext === '.md') fileType = 'markdown';
      else if (ext === '.json') fileType = 'json';
      else if (ext === '.db' || ext === '.sqlite') fileType = 'sqlite';

      return {
        success: true,
        data: {
          path: relativePath,
          type: fileType,
          size: stats.size,
          lastModified: stats.mtime,
          created: stats.birthtime,
          extension: ext
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取文件统计信息失败'
      };
    }
  }

  /**
   * 批量操作：读取多个文本文件
   */
  async readMultipleFiles(
    siteConfig: SiteConfig,
    relativePaths: string[]
  ): Promise<Array<FileOperationResult & { path: string }>> {
    return this.text.readMultipleTextFiles(siteConfig, relativePaths);
  }

  /**
   * 搜索文件内容
   */
  async searchFileContent(
    siteConfig: SiteConfig,
    searchTerm: string,
    fileExtensions: string[] = ['.md', '.json']
  ): Promise<FileOperationResult> {
    try {
      const filesResult = await this.getEditableFiles(siteConfig);
      if (!filesResult.success) {
        return filesResult;
      }

      const searchResults: Array<{
        path: string;
        matches: Array<{
          line: number;
          content: string;
          index: number;
        }>;
      }> = [];

      const targetFiles = (filesResult.data as ContentFile[]).filter(file => 
        fileExtensions.includes(path.extname(file.path).toLowerCase()) &&
        (file.type === 'markdown' || file.type === 'json')
      );

      for (const file of targetFiles) {
        const readResult = await this.text.readTextFile(siteConfig, file.path);
        if (readResult.success && readResult.data?.content) {
          const content = readResult.data.content as string;
          const lines = content.split('\n');
          const matches = [];

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const index = line.toLowerCase().indexOf(searchTerm.toLowerCase());
            if (index !== -1) {
              matches.push({
                line: i + 1,
                content: line.trim(),
                index
              });
            }
          }

          if (matches.length > 0) {
            searchResults.push({
              path: file.path,
              matches
            });
          }
        }
      }

      return {
        success: true,
        data: {
          searchTerm,
          totalFiles: targetFiles.length,
          matchingFiles: searchResults.length,
          results: searchResults
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '搜索失败'
      };
    }
  }

  /**
   * 创建新的文本文件
   */
  async createNewFile(
    siteConfig: SiteConfig,
    relativePath: string,
    content: string = '',
    template?: string
  ): Promise<FileOperationResult> {
    try {
      // 检查文件是否已存在
      if (await this.text.textFileExists(siteConfig, relativePath)) {
        return {
          success: false,
          error: '文件已存在'
        };
      }

      // 如果提供了模板，使用模板内容
      const finalContent = template || content;

      return this.text.writeTextFile(siteConfig, relativePath, finalContent);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建文件失败'
      };
    }
  }

  /**
   * 获取目录结构树
   */
  async getDirectoryTree(siteConfig: SiteConfig, relativePath: string = ''): Promise<FileOperationResult> {
    const fullPath = path.join(siteConfig.localPath, relativePath);

    try {
      if (!commonFileOperations.isPathAllowed(siteConfig, relativePath)) {
        return {
          success: false,
          error: '访问被拒绝：目录不在允许的编辑路径内'
        };
      }

      const buildTree = async (dirPath: string, basePath: string): Promise<any> => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const tree = {
          name: path.basename(dirPath) || 'root',
          path: path.relative(basePath, dirPath).replace(/\\/g, '/'),
          type: 'directory' as const,
          children: [] as any[]
        };

        for (const entry of entries) {
          const entryPath = path.join(dirPath, entry.name);
          const relativePath = path.relative(basePath, entryPath).replace(/\\/g, '/');

          if (entry.isDirectory()) {
            const subTree = await buildTree(entryPath, basePath);
            tree.children.push(subTree);
          } else {
            const stats = await fs.stat(entryPath);
            const ext = path.extname(entry.name).toLowerCase();
            
            let fileType: ContentFile['type'] = 'asset';
            if (ext === '.md') fileType = 'markdown';
            else if (ext === '.json') fileType = 'json';
            else if (ext === '.db' || ext === '.sqlite') fileType = 'sqlite';

            tree.children.push({
              name: entry.name,
              path: relativePath,
              type: fileType,
              size: stats.size,
              lastModified: stats.mtime
            });
          }
        }

        // 排序：目录在前，文件在后，按名称排序
        tree.children.sort((a, b) => {
          if (a.type === 'directory' && b.type !== 'directory') return -1;
          if (a.type !== 'directory' && b.type === 'directory') return 1;
          return a.name.localeCompare(b.name);
        });

        return tree;
      };

      const tree = await buildTree(fullPath, siteConfig.localPath);

      return {
        success: true,
        data: tree
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取目录结构失败'
      };
    }
  }
}

// 导出单例实例
export const contentManager = new ContentManager();