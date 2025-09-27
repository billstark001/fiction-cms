import fs from 'fs/promises';
import path from 'path';
import { SiteConfig, FileOperationResult, ContentFile } from '../types.js';

/**
 * 通用文件操作功能
 * 提供基础的文件系统操作和路径验证
 */
export class CommonFileOperations {
  
  /**
   * 扫描目录获取文件列表
   */
  async scanDirectory(dirPath: string, basePath: string): Promise<ContentFile[]> {
    const files: ContentFile[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(basePath, fullPath);

        if (entry.isDirectory()) {
          // 递归扫描子目录
          const subFiles = await this.scanDirectory(fullPath, basePath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          const ext = path.extname(entry.name).toLowerCase();

          let fileType: ContentFile['type'] = 'asset';
          if (ext === '.md') fileType = 'markdown';
          else if (ext === '.json') fileType = 'json';

          files.push({
            path: relativePath.replace(/\\/g, '/'), // 统一使用正斜杠
            type: fileType,
            lastModified: stats.mtime,
            size: stats.size
          });
        }
      }
    } catch (error) {
      // 目录不存在或无权限访问，返回空数组
    }

    return files;
  }

  /**
   * 检查路径是否在允许的编辑范围内
   */
  isPathAllowed(siteConfig: SiteConfig, relativePath: string): boolean {
    const { editablePaths = [] } = siteConfig;
    
    if (editablePaths.length === 0) {
      // 如果没有设置限制，则允许所有路径
      return true;
    }

    // 规范化路径（使用正斜杠）
    const normalizedPath = relativePath.replace(/\\/g, '/');

    // 检查路径是否以允许的路径之一开始
    return editablePaths.some(allowedPath => {
      const normalizedAllowedPath = allowedPath.replace(/\\/g, '/');
      return normalizedPath.startsWith(normalizedAllowedPath);
    });
  }

  /**
   * 确保目录存在
   */
  async ensureDirectoryExists(filePath: string): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
  }

  /**
   * 检查文件是否存在
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取文件统计信息
   */
  async getFileStats(filePath: string) {
    try {
      return await fs.stat(filePath);
    } catch (error) {
      throw new Error(`Unable to get file statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// 导出单例实例
export const commonFileOperations = new CommonFileOperations();