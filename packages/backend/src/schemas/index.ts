import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
  displayName: z.string().max(100, 'Display name must be less than 100 characters').optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(6, 'New password must be at least 6 characters')
    .max(100, 'New password must be less than 100 characters'),
});

// User management schemas
export const createUserSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
  displayName: z.string().max(100, 'Display name must be less than 100 characters').optional(),
  isActive: z.boolean().default(true),
  roleIds: z.array(z.string()).optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  displayName: z.string().max(100, 'Display name must be less than 100 characters').optional(),
  isActive: z.boolean().optional(),
  roleIds: z.array(z.string()).optional(),
});

export const updateUserProfileSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  displayName: z.string().max(100, 'Display name must be less than 100 characters').optional(),
});

// Role management schemas
export const createRoleSchema = z.object({
  name: z.string()
    .min(2, 'Role name must be at least 2 characters')
    .max(50, 'Role name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Role name can only contain letters, numbers, hyphens, and underscores'),
  displayName: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(100, 'Display name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  isDefault: z.boolean().default(false),
  permissionIds: z.array(z.string()).optional(),
});

export const updateRoleSchema = z.object({
  displayName: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(100, 'Display name must be less than 100 characters')
    .optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  isDefault: z.boolean().optional(),
  permissionIds: z.array(z.string()).optional(),
});

// Permission schemas
export const createPermissionSchema = z.object({
  name: z.string()
    .min(2, 'Permission name must be at least 2 characters')
    .max(100, 'Permission name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Permission name can only contain letters, numbers, periods, hyphens, and underscores'),
  displayName: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(100, 'Display name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  resource: z.string()
    .min(2, 'Resource must be at least 2 characters')
    .max(50, 'Resource must be less than 50 characters'),
  action: z.string()
    .min(2, 'Action must be at least 2 characters')
    .max(50, 'Action must be less than 50 characters'),
});

// Site management schemas
export const createSiteSchema = z.object({
  name: z.string()
    .min(1, 'Site name is required')
    .max(100, 'Site name must be less than 100 characters'),
  githubRepositoryUrl: z.string()
    .url('Invalid GitHub repository URL')
    .refine(url => url.includes('github.com'), 'Must be a GitHub repository URL'),
  githubPat: z.string().min(1, 'GitHub Personal Access Token is required'),
  localPath: z.string().min(1, 'Local path is required'),
  buildCommand: z.string().optional(),
  buildOutputDir: z.string().optional(),
  editablePaths: z.array(z.string()).optional(),
});

export const updateSiteSchema = z.object({
  name: z.string()
    .min(1, 'Site name is required')
    .max(100, 'Site name must be less than 100 characters')
    .optional(),
  githubRepositoryUrl: z.string()
    .url('Invalid GitHub repository URL')
    .refine(url => url.includes('github.com'), 'Must be a GitHub repository URL')
    .optional(),
  githubPat: z.string().min(1, 'GitHub Personal Access Token is required').optional(),
  localPath: z.string().min(1, 'Local path is required').optional(),
  buildCommand: z.string().optional(),
  buildOutputDir: z.string().optional(),
  editablePaths: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// Content management schemas
export const fileOperationSchema = z.object({
  content: z.string(),
  commitMessage: z.string().max(500, 'Commit message must be less than 500 characters').optional(),
});

export const createFileSchema = z.object({
  path: z.string().min(1, 'File path is required'),
  content: z.string(),
  commitMessage: z.string().max(500, 'Commit message must be less than 500 characters').optional(),
});

export const uploadAssetSchema = z.object({
  path: z.string().min(1, 'Asset path is required'),
  commitMessage: z.string().max(500, 'Commit message must be less than 500 characters').optional(),
});

// SQLite operation schemas
export const sqliteQuerySchema = z.object({
  tableName: z.string().min(1, 'Table name is required'),
  limit: z.number().int().min(1).max(1000).default(100),
  offset: z.number().int().min(0).default(0),
  orderBy: z.string().optional(),
  orderDirection: z.enum(['asc', 'desc']).default('asc'),
});

export const sqliteUpdateSchema = z.object({
  tableName: z.string().min(1, 'Table name is required'),
  rowId: z.union([z.string(), z.number()]),
  data: z.record(z.any()),
  commitMessage: z.string().max(500, 'Commit message must be less than 500 characters').optional(),
});

export const sqliteCreateSchema = z.object({
  tableName: z.string().min(1, 'Table name is required'),
  data: z.record(z.any()),
  commitMessage: z.string().max(500, 'Commit message must be less than 500 characters').optional(),
});

export const sqliteDeleteSchema = z.object({
  tableName: z.string().min(1, 'Table name is required'),
  rowId: z.union([z.string(), z.number()]),
  commitMessage: z.string().max(500, 'Commit message must be less than 500 characters').optional(),
});

// Deployment schemas
export const deploymentTriggerSchema = z.object({
  force: z.boolean().default(false),
  branch: z.string().default('main'),
});

// Pagination schemas
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  orderBy: z.string().optional(),
  orderDirection: z.enum(['asc', 'desc']).default('asc'),
});

// Search schemas
export const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.number().int().min(1).max(100).default(20),
});

// Common parameter schemas
export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export const siteIdParamSchema = z.object({
  siteId: z.string().min(1, 'Site ID is required'),
});

export const filePathParamSchema = z.object({
  filePath: z.string().min(1, 'File path is required'),
});

// Export type inferences
export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
export type CreateUserRequest = z.infer<typeof createUserSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
export type UpdateUserProfileRequest = z.infer<typeof updateUserProfileSchema>;
export type CreateRoleRequest = z.infer<typeof createRoleSchema>;
export type UpdateRoleRequest = z.infer<typeof updateRoleSchema>;
export type CreatePermissionRequest = z.infer<typeof createPermissionSchema>;
export type CreateSiteRequest = z.infer<typeof createSiteSchema>;
export type UpdateSiteRequest = z.infer<typeof updateSiteSchema>;
export type FileOperationRequest = z.infer<typeof fileOperationSchema>;
export type CreateFileRequest = z.infer<typeof createFileSchema>;
export type UploadAssetRequest = z.infer<typeof uploadAssetSchema>;
export type SqliteQueryRequest = z.infer<typeof sqliteQuerySchema>;
export type SqliteUpdateRequest = z.infer<typeof sqliteUpdateSchema>;
export type SqliteCreateRequest = z.infer<typeof sqliteCreateSchema>;
export type SqliteDeleteRequest = z.infer<typeof sqliteDeleteSchema>;
export type DeploymentTriggerRequest = z.infer<typeof deploymentTriggerSchema>;
export type PaginationRequest = z.infer<typeof paginationSchema>;
export type SearchRequest = z.infer<typeof searchSchema>;