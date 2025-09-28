import { SiteConfig, SQLiteFileConfig, ModelFileConfig, CustomFileTypeConfig } from '../types.js';
import { z } from 'zod';
import { glob } from 'glob';
import path from 'path';

/**
 * 配置验证工具类
 * 提供统一的配置验证逻辑
 */
export class ConfigValidator {


  static validateSiteConfig(config: SiteConfig): string[] {
    const errors: string[] = [];

    if (!config.id) {
      errors.push('Site ID cannot be empty');
    }

    if (!config.name) {
      errors.push('Site name cannot be empty');
    }

    if (!config.githubRepositoryUrl) {
      errors.push('GitHub repository URL cannot be empty');
    } else if (!config.githubRepositoryUrl.includes('github.com')) {
      errors.push('Invalid GitHub repository URL format');
    }

    if (!config.githubPat) {
      errors.push('GitHub Personal Access Token cannot be empty');
    } else if (!config.githubPat.startsWith('ghp_')) {
      errors.push('Invalid GitHub Personal Access Token format');
    }

    if (!config.localPath) {
      errors.push('Local path cannot be empty');
    }

    // 验证 validateCommand（如果提供）
    if (config.validateCommand && config.validateCommand.trim().length === 0) {
      errors.push('Validate command cannot be empty if provided');
    }

    // Validate SQLite file configuration
    if (config.sqliteFiles) {
      config.sqliteFiles.forEach((sqliteFile, index) => {
        if (!sqliteFile.filePath) {
          errors.push(`SQLite file configuration ${index + 1} file path cannot be empty`);
        }

        if (!sqliteFile.editableTables || sqliteFile.editableTables.length === 0) {
          errors.push(`SQLite file configuration ${index + 1} must contain at least one editable table`);
        }

        sqliteFile.editableTables.forEach((table, tableIndex) => {
          if (!table.tableName) {
            errors.push(`SQLite file ${index + 1} table configuration ${tableIndex + 1} missing table name`);
          }
          
          // 验证主键策略
          if (table.primaryKeyStrategy && !['auto_increment', 'random_string', 'timestamp', 'custom'].includes(table.primaryKeyStrategy)) {
            errors.push(`SQLite file ${index + 1} table ${tableIndex + 1} has invalid primary key strategy`);
          }
        });
      });
    }

    // 验证 modelFiles
    if (config.modelFiles && config.modelFiles.length > 0) {
      config.modelFiles.forEach((modelFile, index) => {
        const validationErrors = this.validateModelFileConfig(modelFile, index);
        errors.push(...validationErrors);
      });
    }

    // 验证 customFileTypes
    if (config.customFileTypes && config.customFileTypes.length > 0) {
      config.customFileTypes.forEach((customType, index) => {
        const validationErrors = this.validateCustomFileTypeConfig(customType, index);
        errors.push(...validationErrors);
      });
    }

    return errors;
  }

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
      : { isValid: false, error: 'Access denied: file is not within allowed editable paths' };
  }

  /**
   * 验证SQLite文件配置 (Legacy method, use validateSQLiteConfigWithGlob for glob support)
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
        error: 'SQLite file is not in the allowed editable list'
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
        error: 'Table is not in the allowed editable list'
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
        error: `Editing columns not allowed: ${unauthorizedColumns.join(', ')}`
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

  /**
   * 验证模型文件配置
   */
  static validateModelFileConfig(modelFile: ModelFileConfig, index: number): string[] {
    const errors: string[] = [];

    if (!modelFile.filePath) {
      errors.push(`Model file configuration ${index + 1} file path cannot be empty`);
    }

    if (!modelFile.zodValidator) {
      errors.push(`Model file configuration ${index + 1} zod validator cannot be empty`);
    } else {
      // 尝试验证zod validator语法
      try {
        // 创建一个简单的测试函数来验证语法
        new Function('z', `return ${modelFile.zodValidator}`);
      } catch (error) {
        errors.push(`Model file configuration ${index + 1} has invalid zod validator syntax: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return errors;
  }

  /**
   * 验证自定义文件类型配置
   */
  static validateCustomFileTypeConfig(customType: CustomFileTypeConfig, index: number): string[] {
    const errors: string[] = [];

    if (!customType.name || customType.name.trim().length === 0) {
      errors.push(`Custom file type configuration ${index + 1} name cannot be empty`);
    }

    if (!customType.extensions || customType.extensions.length === 0) {
      errors.push(`Custom file type configuration ${index + 1} must have at least one extension`);
    } else {
      customType.extensions.forEach((ext, extIndex) => {
        if (!ext || ext.trim().length === 0) {
          errors.push(`Custom file type configuration ${index + 1} extension ${extIndex + 1} cannot be empty`);
        }
      });
    }

    return errors;
  }

  /**
   * 验证SQLite文件配置（使用glob支持）
   */
  static async validateSQLiteConfigWithGlob(
    siteConfig: SiteConfig,
    sqliteFilePath: string
  ): Promise<{ isValid: boolean; configs?: SQLiteFileConfig[]; error?: string }> {
    const { sqliteFiles = [] } = siteConfig;
    
    const matchingConfigs: SQLiteFileConfig[] = [];
    
    for (const config of sqliteFiles) {
      try {
        // 检查是否是直接匹配
        if (config.filePath === sqliteFilePath) {
          matchingConfigs.push(config);
          continue;
        }
        
        // 检查是否是glob模式匹配
        const pattern = path.join(siteConfig.localPath, config.filePath);
        const fullSqlitePath = path.join(siteConfig.localPath, sqliteFilePath);
        const matches = await glob(pattern);
        
        if (matches.some(match => path.resolve(match) === path.resolve(fullSqlitePath))) {
          matchingConfigs.push(config);
        }
      } catch (error) {
        console.warn(`Error matching glob pattern ${config.filePath}:`, error);
      }
    }

    if (matchingConfigs.length === 0) {
      return {
        isValid: false,
        error: 'SQLite file is not in the allowed editable list'
      };
    }

    return { isValid: true, configs: matchingConfigs };
  }

  /**
   * 验证模型文件配置（使用glob支持）
   */
  static async validateModelFileConfigWithGlob(
    siteConfig: SiteConfig,
    modelFilePath: string
  ): Promise<{ isValid: boolean; configs?: ModelFileConfig[]; error?: string }> {
    const { modelFiles = [] } = siteConfig;
    
    const matchingConfigs: ModelFileConfig[] = [];
    
    for (const config of modelFiles) {
      try {
        // 检查是否是直接匹配
        if (config.filePath === modelFilePath) {
          matchingConfigs.push(config);
          continue;
        }
        
        // 检查是否是glob模式匹配
        const pattern = path.join(siteConfig.localPath, config.filePath);
        const fullModelPath = path.join(siteConfig.localPath, modelFilePath);
        const matches = await glob(pattern);
        
        if (matches.some(match => path.resolve(match) === path.resolve(fullModelPath))) {
          matchingConfigs.push(config);
        }
      } catch (error) {
        console.warn(`Error matching glob pattern ${config.filePath}:`, error);
      }
    }

    if (matchingConfigs.length === 0) {
      return {
        isValid: false,
        error: 'Model file is not in the allowed editable list'
      };
    }

    return { isValid: true, configs: matchingConfigs };
  }

  /**
   * 验证zod模式并创建验证器
   */
  static createZodValidator(zodDefinition: string): { isValid: boolean; validator?: any; error?: string } {
    try {
      const validatorFunction = new Function('z', `return ${zodDefinition}`);
      const validator = validatorFunction(z);
      
      // 基本验证，确保返回的是一个zod schema
      if (validator && typeof validator.parse === 'function') {
        return { isValid: true, validator };
      } else {
        return { isValid: false, error: 'Validator does not appear to be a valid zod schema' };
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error creating validator'
      };
    }
  }
}