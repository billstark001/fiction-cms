import fs from 'fs/promises';
import path from 'path';
import { SiteConfig, FileOperationResult } from '../types.js';
import { commonFileOperations } from './common-operations.js';
import { logHelpers } from '../../utils/logger.js';

/**
 * 基础管理器类
 * 提供通用的文件操作方法和错误处理逻辑
 */
export abstract class BaseManager {
  
  /**
   * 安全地执行文件操作，包含统一的权限检查和错误处理
   */
  protected async executeFileOperation<T>(
    operation: () => Promise<T>,
    siteConfig: SiteConfig,
    relativePath: string,
    operationName: string
  ): Promise<FileOperationResult> {
    const startTime = Date.now();
    const fullPath = path.join(siteConfig.localPath, relativePath);
    
    try {
      // 统一的路径权限检查
      if (!commonFileOperations.isPathAllowed(siteConfig, relativePath)) {
        logHelpers.fileOperation('read', relativePath, undefined, Date.now() - startTime, false);
        return {
          success: false,
          error: '访问被拒绝：文件不在允许的编辑路径内'
        };
      }

      const result = await operation();
      const duration = Date.now() - startTime;
      
      // Log successful operation
      let fileSize: number | undefined;
      try {
        const stats = await fs.stat(fullPath);
        fileSize = stats.size;
      } catch {
        // File might not exist for read operations
      }
      
      logHelpers.fileOperation(
        operationName.includes('读取') || operationName.includes('read') ? 'read' : 
        operationName.includes('写入') || operationName.includes('write') ? 'write' :
        operationName.includes('删除') || operationName.includes('delete') ? 'delete' : 'create',
        relativePath,
        fileSize,
        duration,
        true
      );
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logHelpers.fileOperation(
        operationName.includes('读取') || operationName.includes('read') ? 'read' : 
        operationName.includes('写入') || operationName.includes('write') ? 'write' :
        operationName.includes('删除') || operationName.includes('delete') ? 'delete' : 'create',
        relativePath,
        undefined,
        duration,
        false
      );
      
      return {
        success: false,
        error: error instanceof Error ? error.message : `${operationName}失败`
      };
    }
  }

  /**
   * 安全地执行批量文件操作
   */
  protected async executeBatchOperation<T, R>(
    items: T[],
    operation: (item: T) => Promise<FileOperationResult & { path?: string }>,
    operationName: string
  ): Promise<Array<FileOperationResult & { path?: string }>> {
    return Promise.all(
      items.map(async (item) => {
        try {
          return await operation(item);
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : `${operationName}失败`,
            path: typeof item === 'string' ? item : undefined
          };
        }
      })
    );
  }

  /**
   * 检查文件是否存在（带权限验证）
   */
  protected async checkFileExists(
    siteConfig: SiteConfig,
    relativePath: string
  ): Promise<{ exists: boolean; allowed: boolean; fullPath: string }> {
    const fullPath = path.join(siteConfig.localPath, relativePath);
    const allowed = commonFileOperations.isPathAllowed(siteConfig, relativePath);
    
    if (!allowed) {
      return { exists: false, allowed: false, fullPath };
    }

    const exists = await commonFileOperations.fileExists(fullPath);
    return { exists, allowed: true, fullPath };
  }

  /**
   * 获取文件的基础信息
   */
  protected async getFileInfo(fullPath: string, relativePath: string) {
    const stats = await commonFileOperations.getFileStats(fullPath);
    return {
      path: relativePath,
      size: stats.size,
      lastModified: stats.mtime,
      created: stats.birthtime
    };
  }

  /**
   * 确保目标目录存在
   */
  protected async ensureTargetDirectory(fullPath: string): Promise<void> {
    await commonFileOperations.ensureDirectoryExists(fullPath);
  }

  /**
   * 执行文件复制操作的通用逻辑
   */
  protected async performCopyOperation(
    siteConfig: SiteConfig,
    sourcePath: string,
    targetPath: string,
    operationType: '复制' | '移动'
  ): Promise<FileOperationResult> {
    return this.executeFileOperation(
      async () => {
        // 检查源文件和目标路径权限
        const sourceCheck = await this.checkFileExists(siteConfig, sourcePath);
        const targetAllowed = commonFileOperations.isPathAllowed(siteConfig, targetPath);

        if (!sourceCheck.allowed || !targetAllowed) {
          throw new Error('访问被拒绝：文件不在允许的编辑路径内');
        }

        if (!sourceCheck.exists) {
          throw new Error('源文件不存在');
        }

        const targetFullPath = path.join(siteConfig.localPath, targetPath);
        
        // 确保目标目录存在
        await this.ensureTargetDirectory(targetFullPath);

        // 执行操作
        if (operationType === '复制') {
          await fs.copyFile(sourceCheck.fullPath, targetFullPath);
        } else {
          await fs.rename(sourceCheck.fullPath, targetFullPath);
        }

        // 获取结果信息
        const targetInfo = await this.getFileInfo(targetFullPath, targetPath);

        return {
          sourcePath,
          targetPath,
          size: targetInfo.size,
          lastModified: targetInfo.lastModified
        };
      },
      siteConfig,
      sourcePath,
      operationType
    );
  }
}