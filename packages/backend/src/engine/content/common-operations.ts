import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { glob } from 'glob';
import { SiteConfig, FileOperationResult, ContentFile } from '../types.js';

/**
 * 通用文件操作功能
 * 提供基础的文件系统操作和路径验证，以及文件类型检测
 */
export class CommonFileOperations {

  /**
   * 根据文件扩展名和站点配置确定文件类型
   */
  determineFileType(fileName: string, siteConfig?: SiteConfig): string {
    const ext = path.extname(fileName).toLowerCase();
    
    // 首先检查自定义文件类型
    if (siteConfig?.customFileTypes) {
      for (const customType of siteConfig.customFileTypes) {
        if (customType.extensions.some(extension => 
          ext === extension || ext === `.${extension.replace(/^\./, '')}`
        )) {
          return customType.name;
        }
      }
    }

    // 内置文件类型检测
    switch (ext) {
      case '.md':
      case '.markdown':
        return 'markdown';
      case '.json':
        return 'json';
      case '.sqlite':
      case '.sqlite3':
      case '.db':
        return 'sqlite';
      case '.yml':
      case '.yaml':
        return 'yaml';
      case '.txt':
        return 'text';
      case '.js':
      case '.ts':
      case '.jsx':
      case '.tsx':
        return 'javascript';
      case '.css':
      case '.scss':
      case '.less':
        return 'stylesheet';
      case '.html':
      case '.htm':
        return 'html';
      case '.xml':
        return 'xml';
      case '.jpg':
      case '.jpeg':
      case '.png':
      case '.gif':
      case '.svg':
      case '.webp':
        return 'image';
      case '.pdf':
        return 'document';
      case '.mp3':
      case '.wav':
      case '.ogg':
        return 'audio';
      case '.mp4':
      case '.webm':
      case '.avi':
        return 'video';
      default:
        return 'asset';
    }
  }

  /**
   * 检查文件类型是否为文本类型
   */
  isTextFileType(fileType: string, siteConfig?: SiteConfig): boolean {
    // 检查自定义文件类型
    if (siteConfig?.customFileTypes) {
      const customType = siteConfig.customFileTypes.find(ct => ct.name === fileType);
      if (customType) {
        return customType.isText ?? false;
      }
    }

    // 内置文本文件类型
    const textTypes = [
      'markdown', 'json', 'yaml', 'text', 'javascript', 
      'stylesheet', 'html', 'xml'
    ];
    return textTypes.includes(fileType);
  }

  /**
   * 检查glob模式是否匹配文件路径
   */
  async matchesGlobPattern(pattern: string, filePath: string, basePath: string): Promise<boolean> {
    const fullPattern = path.join(basePath, pattern);
    const matches = await glob(fullPattern);
    const fullFilePath = path.resolve(path.join(basePath, filePath));
    return matches.some(match => path.resolve(match) === fullFilePath);
  }

  /**
   * 解析glob模式，返回匹配的文件列表
   */
  async resolveGlobPatterns(patterns: string[], basePath: string): Promise<string[]> {
    const allMatches: string[] = [];
    
    for (const pattern of patterns) {
      try {
        const fullPattern = path.join(basePath, pattern);
        const matches = await glob(fullPattern);
        const relativeMatches = matches.map(match => path.relative(basePath, match));
        allMatches.push(...relativeMatches);
      } catch (error) {
        console.warn(`Failed to resolve glob pattern ${pattern}:`, error);
      }
    }
    
    // 去重并返回
    return [...new Set(allMatches)];
  }
  
  /**
   * 扫描目录获取文件列表
   */
  async scanDirectory(dirPath: string, basePath: string, siteConfig?: SiteConfig): Promise<ContentFile[]> {
    const files: ContentFile[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(basePath, fullPath);

        if (entry.isDirectory()) {
          // 递归扫描子目录
          const subFiles = await this.scanDirectory(fullPath, basePath, siteConfig);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          const fileType = this.determineFileType(entry.name, siteConfig);

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

  expand(filepath: string): string {
    if (filepath.startsWith("~")) {
      return path.join(os.homedir(), filepath.slice(1));
    }
    return filepath;
  };

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