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
  editablePaths?: string[];
  sqliteFiles?: SQLiteFileConfig[];
}

export interface SQLiteFileConfig {
  filePath: string;
  editableTables: SQLiteTableConfig[];
}

export interface SQLiteTableConfig {
  tableName: string;
  editableColumns: string[];
  displayName?: string;
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
  type: 'markdown' | 'json' | 'sqlite' | 'asset';
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