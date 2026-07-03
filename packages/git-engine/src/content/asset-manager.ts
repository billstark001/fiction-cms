import fs from 'fs/promises';
import path from 'path';
import { SiteConfig, FileOperationResult } from '../types.js';
import { BaseManager } from './base-manager.js';
import { commonFileOperations } from './common-operations.js';

/**
 * 资产文件管理器
 * 负责处理图片、文档等资产文件的上传、管理和操作
 */
export class AssetManager extends BaseManager {

  /**
   * 上传资产文件
   */
  async uploadAsset(
    siteConfig: SiteConfig,
    relativePath: string,
    buffer: Buffer
  ): Promise<FileOperationResult> {
    return this.executeFileOperation(
      async () => {
        const fullPath = path.join(siteConfig.localPath, relativePath);
        
        // 确保目录存在
        await this.ensureTargetDirectory(fullPath);
        
        // 写入文件
        await fs.writeFile(fullPath, buffer);
        
        return await this.getFileInfo(fullPath, relativePath);
      },
      siteConfig,
      relativePath,
      'Upload file'
    );
  }

  /**
   * 批量上传资产文件
   */
  async uploadMultipleAssets(
    siteConfig: SiteConfig,
    assets: Array<{
      relativePath: string;
      buffer: Buffer;
    }>
  ): Promise<Array<FileOperationResult & { path: string }>> {
    return this.executeBatchOperation(
      assets,
      async (asset) => {
        const result = await this.uploadAsset(siteConfig, asset.relativePath, asset.buffer);
        return { ...result, path: asset.relativePath } as FileOperationResult & { path: string };
      },
      'Batch upload files'
    ) as Promise<Array<FileOperationResult & { path: string }>>;
  }

  /**
   * 删除资产文件
   */
  async deleteAsset(siteConfig: SiteConfig, relativePath: string): Promise<FileOperationResult> {
    return this.executeFileOperation(
      async () => {
        const { exists, fullPath } = await this.checkFileExists(siteConfig, relativePath);
        
        if (!exists) {
          throw new Error('File does not exist');
        }

        await fs.unlink(fullPath);

        return {
          path: relativePath,
          deleted: true
        };
      },
      siteConfig,
      relativePath,
      'Delete file'
    );
  }

  /**
   * 复制资产文件
   */
  async copyAsset(
    siteConfig: SiteConfig, 
    sourcePath: string, 
    targetPath: string
  ): Promise<FileOperationResult> {
    return this.performCopyOperation(siteConfig, sourcePath, targetPath, 'Copy');
  }

  /**
   * 移动/重命名资产文件
   */
  async moveAsset(
    siteConfig: SiteConfig, 
    sourcePath: string, 
    targetPath: string
  ): Promise<FileOperationResult> {
    return this.performCopyOperation(siteConfig, sourcePath, targetPath, 'Move');
  }

  /**
   * 获取资产文件信息
   */
  async getAssetInfo(siteConfig: SiteConfig, relativePath: string): Promise<FileOperationResult> {
    return this.executeFileOperation(
      async () => {
        const { fullPath } = await this.checkFileExists(siteConfig, relativePath);
        const fileInfo = await this.getFileInfo(fullPath, relativePath);
        const ext = path.extname(relativePath).toLowerCase();

        return {
          ...fileInfo,
          extension: ext,
          mimeType: this.getMimeType(ext),
          isImage: this.isImageFile(ext),
          isDocument: this.isDocumentFile(ext)
        };
      },
      siteConfig,
      relativePath,
      'Get file info'
    );
  }

  /**
   * 读取资产文件内容（返回Buffer）
   */
  async readAssetBuffer(siteConfig: SiteConfig, relativePath: string): Promise<FileOperationResult> {
    return this.executeFileOperation(
      async () => {
        const { fullPath } = await this.checkFileExists(siteConfig, relativePath);
        const buffer = await fs.readFile(fullPath);
        const fileInfo = await this.getFileInfo(fullPath, relativePath);

        return {
          ...fileInfo,
          buffer
        };
      },
      siteConfig,
      relativePath,
      'Read file'
    );
  }

  /**
   * 获取目录下的所有资产文件
   */
  async getAssetsInDirectory(siteConfig: SiteConfig, relativeDirPath: string = ''): Promise<FileOperationResult> {
    return this.executeFileOperation(
      async () => {
        const fullDirPath = path.join(siteConfig.localPath, relativeDirPath);
        const files = await commonFileOperations.scanDirectory(fullDirPath, siteConfig.localPath);
        
        // 只返回资产文件
        return files.filter(file => file.type === 'asset');
      },
      siteConfig,
      relativeDirPath,
      'Scan directory'
    );
  }

  /**
   * 根据文件扩展名判断MIME类型
   */
  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      // 图片
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.ico': 'image/x-icon',
      // 文档
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // 音频
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      // 视频
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      // 其他
      '.zip': 'application/zip',
      '.txt': 'text/plain',
      '.css': 'text/css',
      '.js': 'text/javascript'
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * 判断是否为图片文件
   */
  private isImageFile(extension: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.ico'];
    return imageExtensions.includes(extension.toLowerCase());
  }

  /**
   * 判断是否为文档文件
   */
  private isDocumentFile(extension: string): boolean {
    const documentExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'];
    return documentExtensions.includes(extension.toLowerCase());
  }
}

// 导出单例实例
export const assetManager = new AssetManager();