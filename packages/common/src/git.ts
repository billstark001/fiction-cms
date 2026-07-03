import { z } from 'zod';

export const sqliteTableConfigSchema = z.object({
  tableName: z.string().min(1),
  editableColumns: z.array(z.string()).optional(),
  readableColumns: z.array(z.string()).optional(),
  displayName: z.string().optional(),
  defaultValues: z.record(z.string(), z.unknown()).optional(),
  primaryKeyStrategy: z.enum(['auto_increment', 'random_string', 'timestamp', 'custom']).optional(),
});
export type SQLiteTableConfig = z.infer<typeof sqliteTableConfigSchema>;

export const sqliteFileConfigSchema = z.object({
  filePath: z.string().min(1),
  editableTables: z.array(sqliteTableConfigSchema),
});
export type SQLiteFileConfig = z.infer<typeof sqliteFileConfigSchema>;

export const modelFileConfigSchema = z.object({
  filePath: z.string().min(1),
  zodValidator: z.string(),
  displayName: z.string().optional(),
});
export type ModelFileConfig = z.infer<typeof modelFileConfigSchema>;

export const customFileTypeConfigSchema = z.object({
  name: z.string().min(1),
  extensions: z.array(z.string().min(1)),
  displayName: z.string().optional(),
  isText: z.boolean().optional(),
});
export type CustomFileTypeConfig = z.infer<typeof customFileTypeConfigSchema>;

export const siteConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  githubRepositoryUrl: z.string().min(1),
  githubPat: z.string().min(1),
  localPath: z.string().min(1),
  buildCommand: z.string().optional(),
  buildOutputDir: z.string().optional(),
  validateCommand: z.string().optional(),
  editablePaths: z.array(z.string()).optional(),
  sqliteFiles: z.array(sqliteFileConfigSchema).optional(),
  modelFiles: z.array(modelFileConfigSchema).optional(),
  customFileTypes: z.array(customFileTypeConfigSchema).optional(),
});
export type SiteConfig = z.infer<typeof siteConfigSchema>;

export const deploymentStatusSchema = z.enum(['pending', 'cloning', 'pulling', 'building', 'deploying', 'completed', 'failed']);
export type DeploymentStatus = z.infer<typeof deploymentStatusSchema>;

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

export interface FileOperationResult {
  success: boolean;
  error?: string;
  data?: unknown;
  rowsAffected?: number;
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
  data?: unknown;
  rowsAffected?: number;
}

export interface ContentFile {
  path: string;
  type: 'markdown' | 'json' | 'sqlite' | 'asset' | string;
  content?: string;
  lastModified: Date;
  size: number;
}

export interface SQLiteTableData {
  tableName: string;
  columns: string[];
  rows: Record<string, unknown>[];
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
