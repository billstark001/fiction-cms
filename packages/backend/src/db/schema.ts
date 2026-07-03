import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { boolean, text, timestamp, pgTable } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).$defaultFn(() => new Date()).notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
});

export const roles = pgTable('roles', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  name: text('name').notNull().unique(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).$defaultFn(() => new Date()).notNull(),
});

export const permissions = pgTable('permissions', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  name: text('name').notNull().unique(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  resource: text('resource').notNull(),
  action: text('action').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).$defaultFn(() => new Date()).notNull(),
});

export const sites = pgTable('sites', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  githubRepositoryUrl: text('github_repository_url').notNull(),
  githubPatEncrypted: text('github_pat_encrypted').notNull(),
  localPath: text('local_path').notNull(),
  buildCommand: text('build_command'),
  buildOutputDir: text('build_output_dir'),
  validateCommand: text('validate_command'),
  editablePaths: text('editable_paths'),
  sqliteFiles: text('sqlite_files'),
  modelFiles: text('model_files'),
  customFileTypes: text('custom_file_types'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).$defaultFn(() => new Date()).notNull(),
});

export const userRoles = pgTable('user_roles', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  roleId: text('role_id').notNull().references(() => roles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).$defaultFn(() => new Date()).notNull(),
});

export const rolePermissions = pgTable('role_permissions', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  roleId: text('role_id').notNull().references(() => roles.id),
  permissionId: text('permission_id').notNull().references(() => permissions.id),
  createdAt: timestamp('created_at', { withTimezone: true }).$defaultFn(() => new Date()).notNull(),
});

export const userSites = pgTable('user_sites', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  siteId: text('site_id').notNull().references(() => sites.id),
  roleId: text('role_id').notNull().references(() => roles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).$defaultFn(() => new Date()).notNull(),
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  token: text('token').notNull().unique(),
  userId: text('user_id').notNull().references(() => users.id),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  isRevoked: boolean('is_revoked').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).$defaultFn(() => new Date()).notNull(),
});

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
