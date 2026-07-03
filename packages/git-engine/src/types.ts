/**
 * Git交互与部署引擎的类型定义
 */

export interface SiteConfig {
  id: string;
  name: string;
  githubRepositoryUrl: string;
  githubPat: string;
  localPath: string;
  buildCommand?: string;
  buildOutputDir?: string;
  validateCommand?: string;
  editablePaths?: string[];
  sqliteFiles?: SQLiteFileConfig[];
  modelFiles?: ModelFileConfig[];
  customFileTypes?: CustomFileTypeConfig[];
}

export interface SQLiteFileConfig {
  filePath: string; // Now supports glob patterns
  editableTables: SQLiteTableConfig[];
}

export interface SQLiteTableConfig {
  tableName: string;
  editableColumns?: string[]; // Optional, defaults to all columns if not specified
  readableColumns?: string[]; // Optional, defaults to all columns if not specified
  displayName?: string;
  defaultValues?: Record<string, any>; // Default values for new rows
  primaryKeyStrategy?: 'auto_increment' | 'random_string' | 'timestamp' | 'custom';
}

export interface ModelFileConfig {
  filePath: string; // Supports glob patterns
  zodValidator: string; // Plain text zod definition like 'z.object({ ... })'
  displayName?: string;
}

export interface CustomFileTypeConfig {
  name: string;
  extensions: string[];
  displayName?: string;
  isText?: boolean; // Whether the file type should be treated as text
}

export interface ValidationResult {
  success: boolean;
  returnCode: number;
  stdout: string;
  stderr: string;
  executionTime: number;
}

export interface DeploymentTask {
  id: string;
  siteId: string;
  status: DeploymentStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  logs: DeploymentLog[];
  error?: string;
}

export interface DeploymentLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  source: 'git' | 'build' | 'deploy';
}

export type DeploymentStatus = 
  | 'pending'
  | 'cloning'
  | 'pulling' 
  | 'building'
  | 'deploying'
  | 'completed'
  | 'failed';

export interface FileOperationResult {
  success: boolean;
  error?: string;
  data?: any;
}

export interface GitOperationResult {
  success: boolean;
  error?: string;
  hash?: string;
  message?: string;
}

export interface SQLiteOperationResult {
  success: boolean;
  error?: string;
  data?: any;
  rowsAffected?: number;
}

export interface ContentFile {
  path: string;
  type: 'markdown' | 'json' | 'sqlite' | 'asset' | string; // Allow custom file types
  content?: string;
  lastModified: Date;
  size: number;
}

export interface SQLiteTableData {
  tableName: string;
  columns: string[];
  rows: Record<string, any>[];
  totalRows: number;
}

export interface BuildResult {
  success: boolean;
  buildTime: number;
  outputSize?: number;
  logs: string[];
  error?: string;
}

export interface DeployResult {
  success: boolean;
  deployTime: number;
  commitHash?: string;
  logs: string[];
  error?: string;
}