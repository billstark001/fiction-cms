import fs from 'fs/promises';
import path from 'path';
import { SiteConfig, FileOperationResult } from '../types.js';
import { BaseManager } from './base-manager.js';
import { logHelpers } from '../../utils/logger.js';

/**
 * 纯文本文件管理器
 * 负责处理 Markdown 和 JSON 文件的读写操作
 */
export class TextFileManager extends BaseManager {

  /**
   * 读取文本文件内容（Markdown或JSON）
   */
  async readTextFile(siteConfig: SiteConfig, relativePath: string): Promise<FileOperationResult> {
    return this.executeFileOperation(
      async () => {
        const fullPath = path.join(siteConfig.localPath, relativePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        const fileInfo = await this.getFileInfo(fullPath, relativePath);

        return {
          content,
          ...fileInfo
        };
      },
      siteConfig,
      relativePath,
      '读取文件'
    );
  }

  /**
   * 写入文本文件内容
   */
  async writeTextFile(
    siteConfig: SiteConfig, 
    relativePath: string, 
    content: string
  ): Promise<FileOperationResult> {
    return this.executeFileOperation(
      async () => {
        const fullPath = path.join(siteConfig.localPath, relativePath);
        
        // 确保目录存在
        await this.ensureTargetDirectory(fullPath);
        
        // 写入文件
        await fs.writeFile(fullPath, content, 'utf-8');
        
        return await this.getFileInfo(fullPath, relativePath);
      },
      siteConfig,
      relativePath,
      '写入文件'
    );
  }

  /**
   * 批量读取文本文件
   */
  async readMultipleTextFiles(
    siteConfig: SiteConfig, 
    relativePaths: string[]
  ): Promise<Array<FileOperationResult & { path: string }>> {
    return this.executeBatchOperation(
      relativePaths,
      async (relativePath) => {
        const result = await this.readTextFile(siteConfig, relativePath);
        return { ...result, path: relativePath } as FileOperationResult & { path: string };
      },
      '批量读取文件'
    ) as Promise<Array<FileOperationResult & { path: string }>>;
  }

  /**
   * 检查文本文件是否存在
   */
  async textFileExists(siteConfig: SiteConfig, relativePath: string): Promise<boolean> {
    const { exists, allowed } = await this.checkFileExists(siteConfig, relativePath);
    return exists && allowed;
  }

  /**
   * 删除文本文件
   */
  async deleteTextFile(siteConfig: SiteConfig, relativePath: string): Promise<FileOperationResult> {
    return this.executeFileOperation(
      async () => {
        const { exists, fullPath } = await this.checkFileExists(siteConfig, relativePath);
        
        if (!exists) {
          throw new Error('文件不存在');
        }

        await fs.unlink(fullPath);

        return {
          path: relativePath,
          deleted: true
        };
      },
      siteConfig,
      relativePath,
      '删除文件'
    );
  }

  /**
   * 复制文本文件
   */
  async copyTextFile(
    siteConfig: SiteConfig, 
    sourcePath: string, 
    targetPath: string
  ): Promise<FileOperationResult> {
    return this.performCopyOperation(siteConfig, sourcePath, targetPath, '复制');
  }

  /**
   * 移动文本文件
   */
  async moveTextFile(
    siteConfig: SiteConfig, 
    sourcePath: string, 
    targetPath: string
  ): Promise<FileOperationResult> {
    return this.performCopyOperation(siteConfig, sourcePath, targetPath, '移动');
  }
}

// 导出单例实例
export const textFileManager = new TextFileManager();