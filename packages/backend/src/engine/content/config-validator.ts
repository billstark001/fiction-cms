import { SiteConfig, SQLiteFileConfig } from '../types.js';

/**
 * 配置验证工具类
 * 提供统一的配置验证逻辑
 */
export class ConfigValidator {
  
  /**
   * 验证文件路径是否在允许的编辑范围内
   */
  static validateFilePath(siteConfig: SiteConfig, relativePath: string): { isValid: boolean; error?: string } {
    const { editablePaths = [] } = siteConfig;
    
    if (editablePaths.length === 0) {
      return { isValid: true };
    }

    const normalizedPath = relativePath.replace(/\\/g, '/');
    const isValid = editablePaths.some(allowedPath => {
      const normalizedAllowedPath = allowedPath.replace(/\\/g, '/');
      return normalizedPath.startsWith(normalizedAllowedPath);
    });

    return isValid 
      ? { isValid: true }
      : { isValid: false, error: '访问被拒绝：文件不在允许的编辑路径内' };
  }

  /**
   * 验证SQLite文件配置
   */
  static validateSQLiteConfig(
    siteConfig: SiteConfig, 
    sqliteFilePath: string
  ): { isValid: boolean; config?: SQLiteFileConfig; error?: string } {
    const { sqliteFiles = [] } = siteConfig;
    const config = sqliteFiles.find(config => config.filePath === sqliteFilePath);
    
    if (!config) {
      return { 
        isValid: false, 
        error: 'SQLite文件不在允许的编辑列表中' 
      };
    }

    return { isValid: true, config };
  }

  /**
   * 验证SQLite表访问权限
   */
  static validateTableAccess(
    sqliteConfig: SQLiteFileConfig, 
    tableName: string
  ): { isValid: boolean; tableConfig?: any; error?: string } {
    const tableConfig = sqliteConfig.editableTables.find(t => t.tableName === tableName);
    
    if (!tableConfig) {
      return { 
        isValid: false, 
        error: '表不在允许的编辑列表中' 
      };
    }

    return { isValid: true, tableConfig };
  }

  /**
   * 验证列编辑权限
   */
  static validateColumnAccess(
    tableConfig: { editableColumns: string[] }, 
    columns: string[]
  ): { isValid: boolean; error?: string } {
    if (tableConfig.editableColumns.length === 0) {
      return { isValid: true };
    }

    const unauthorizedColumns = columns.filter(
      col => !tableConfig.editableColumns.includes(col)
    );

    if (unauthorizedColumns.length > 0) {
      return { 
        isValid: false, 
        error: `不允许编辑列: ${unauthorizedColumns.join(', ')}` 
      };
    }

    return { isValid: true };
  }

  /**
   * 验证文件扩展名是否为允许的文本文件类型
   */
  static isTextFile(filePath: string): boolean {
    const ext = filePath.toLowerCase().split('.').pop();
    return ['md', 'json', 'txt', 'yaml', 'yml'].includes(ext || '');
  }

  /**
   * 验证文件扩展名是否为资产文件类型
   */
  static isAssetFile(filePath: string): boolean {
    const ext = filePath.toLowerCase().split('.').pop();
    const assetExtensions = [
      // 图片
      'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico',
      // 文档
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
      // 音视频
      'mp3', 'wav', 'ogg', 'mp4', 'avi', 'mov',
      // 其他
      'zip', 'css', 'js'
    ];
    return assetExtensions.includes(ext || '');
  }

  /**
   * 获取文件类型
   */
  static getFileType(filePath: string): 'text' | 'asset' | 'sqlite' | 'unknown' {
    const ext = filePath.toLowerCase().split('.').pop();
    
    if (ext === 'db' || ext === 'sqlite' || ext === 'sqlite3') {
      return 'sqlite';
    }
    
    if (this.isTextFile(filePath)) {
      return 'text';
    }
    
    if (this.isAssetFile(filePath)) {
      return 'asset';
    }
    
    return 'unknown';
  }
}