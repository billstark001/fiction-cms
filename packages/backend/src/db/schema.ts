import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';

// Users table
export const users = sqliteTable('users', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
});

// Roles table
export const roles = sqliteTable('roles', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  name: text('name').notNull().unique(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

// Permissions table
export const permissions = sqliteTable('permissions', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  name: text('name').notNull().unique(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  resource: text('resource').notNull(), // e.g., 'site', 'user', 'system'
  action: text('action').notNull(), // e.g., 'read', 'write', 'delete', 'admin'
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

// Sites table (for multi-site management)
export const sites = sqliteTable('sites', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  name: text('name').notNull(),
  githubRepositoryUrl: text('github_repository_url').notNull(),
  githubPatEncrypted: blob('github_pat_encrypted').notNull(),
  localPath: text('local_path').notNull(),
  buildCommand: text('build_command'),
  buildOutputDir: text('build_output_dir'),
  editablePaths: text('editable_paths'), // JSON string array
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

// User-Role assignments (many-to-many)
export const userRoles = sqliteTable('user_roles', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  roleId: text('role_id').notNull().references(() => roles.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

// Role-Permission assignments (many-to-many)
export const rolePermissions = sqliteTable('role_permissions', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  roleId: text('role_id').notNull().references(() => roles.id),
  permissionId: text('permission_id').notNull().references(() => permissions.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

// User-Site assignments (many-to-many)
export const userSites = sqliteTable('user_sites', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  siteId: text('site_id').notNull().references(() => sites.id),
  roleId: text('role_id').notNull().references(() => roles.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

// Refresh tokens table
export const refreshTokens = sqliteTable('refresh_tokens', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  token: text('token').notNull().unique(),
  userId: text('user_id').notNull().references(() => users.id),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  isRevoked: integer('is_revoked', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  userSites: many(userSites),
  refreshTokens: many(refreshTokens),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
  userSites: many(userSites),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const sitesRelations = relations(sites, ({ many }) => ({
  userSites: many(userSites),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const userSitesRelations = relations(userSites, ({ one }) => ({
  user: one(users, {
    fields: [userSites.userId],
    references: [users.id],
  }),
  site: one(sites, {
    fields: [userSites.siteId],
    references: [sites.id],
  }),
  role: one(roles, {
    fields: [userSites.roleId],
    references: [roles.id],
  }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
export type UserSite = typeof userSites.$inferSelect;
export type NewUserSite = typeof userSites.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;