import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { users, userRoles, roles, rolePermissions, permissions } from '../db/schema.js';
import { eq, ne, like, or, and, inArray } from 'drizzle-orm';
import { loggers } from '../utils/logger.js';
import { revokeAllUserRefreshTokens } from '../auth/tokens.js';
import { entityExists, findByField, safeExecute } from './utils.js';
import { roleService } from './role-service.js';

export type UserMetadata = {
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;
};

export type UserData = {
  id: string;
  username: string;
  email: string;
  displayName?: string | null;
  isActive: boolean;
};

export type UserRoleData = {
  roles: string[];
  permissions: string[];
};

export type UserDataWithRoles = UserData & UserRoleData;

export type UserDataWithMetadata = UserData & UserMetadata;

export type UserDataWithMetadataAndRoles = UserDataWithMetadata & UserRoleData;

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  isActive?: boolean;
  roleIds?: string[];
}

export interface UpdateUserData {
  email?: string;
  displayName?: string;
  isActive?: boolean;
  roleIds?: string[];
}

export interface UserSearchParams {
  page?: number;
  limit?: number;
  query?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface UserSearchResult {
  items: UserDataWithRoles[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class UserService {
  // 通用字段选择
  private readonly userFields = {
    id: users.id,
    username: users.username,
    email: users.email,
    displayName: users.displayName,
    isActive: users.isActive,
  };

  private readonly userFieldsWithMetadata = {
    ...this.userFields,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
    lastLoginAt: users.lastLoginAt,
  };

  private readonly userFieldsWithPassword = {
    ...this.userFields,
    passwordHash: users.passwordHash,
  };

  /**
   * 验证用户操作权限
   */
  private validateUserOperation(targetUserId: string, currentUserId: string | undefined, operation: string): void {
    if (currentUserId === targetUserId) {
      throw new Error(`Cannot ${operation} your own account`);
    }
  }

  /**
   * 验证唯一性约束
   */
  private async validateUniqueness(username: string, email: string, excludeId?: string): Promise<void> {
    const [usernameExists, emailExists] = await Promise.all([
      entityExists(users, 'username', username, excludeId),
      entityExists(users, 'email', email, excludeId)
    ]);

    if (usernameExists) throw new Error('Username already exists');
    if (emailExists) throw new Error('Email already exists');
  }

  // 公共接口方法
  async findById(id: string): Promise<UserData | null> {
    if (!id) {
      return null;
    }
    return findByField(users, this.userFields, 'id', id, 'user');
  }

  async findByIdWithMetadata(id: string): Promise<UserData | null> {
    if (!id) {
      return null;
    }
    return findByField(users, this.userFieldsWithMetadata, 'id', id, 'user');
  }

  async findByCredentials(usernameOrEmail: string): Promise<UserData | null> {
    if (!usernameOrEmail) {
      return null;
    }
    return safeExecute(
      async () => {
        const byUsername = await db.select(this.userFieldsWithPassword)
          .from(users)
          .where(eq(users.username, usernameOrEmail))
          .get();

        if (byUsername) return byUsername;

        return await db.select(this.userFieldsWithPassword)
          .from(users)
          .where(eq(users.email, usernameOrEmail))
          .get() || null;
      },
      'find user by credentials',
      { credential: usernameOrEmail }
    );
  }

  async findByIdWithRoles(id: string): Promise<UserDataWithRoles | null> {
    if (!id) {
      return null;
    }
    return safeExecute(
      async () => {
        const user = await this.findById(id);
        if (!user) return null;

        const roles = await this.getUserRoles(id);
        const permissions = await this.getUserPermissions(id);
        return {
          ...user,
          roles,
          permissions
        };
      },
      'find user with roles',
      { userId: id }
    );
  }

  async searchUsers(params: UserSearchParams): Promise<UserSearchResult> {
    const { page = 1, limit = 10, query } = params;
    const offset = (page - 1) * limit;

    return safeExecute(
      async () => {
        const baseQuery = db.select(this.userFields).from(users);
        const searchCondition = query ? or(
          like(users.username, `%${query}%`),
          like(users.email, `%${query}%`),
          like(users.displayName, `%${query}%`)
        ) : undefined;

        const [usersData, countResult] = await Promise.all([
          searchCondition
            ? baseQuery.where(searchCondition).limit(limit).offset(offset)
            : baseQuery.limit(limit).offset(offset),
          searchCondition
            ? db.select({ count: users.id }).from(users).where(searchCondition)
            : db.select({ count: users.id }).from(users)
        ]);

        const totalCount = countResult.length;
        const userIds = usersData.map(u => u.id);
        const userRolesMap = await this.getManyUserRoles(userIds);
        const userPermissionsMap = await this.getManyUserPermissions(userIds);

        const usersWithRoles: UserDataWithRoles[] = usersData.map(user => ({
          ...user,
          roles: userRolesMap.get(user.id) || [],
          permissions: userPermissionsMap.get(user.id) || [],
        }));

        return {
          items: usersWithRoles,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        };
      },
      'search users',
      { params }
    );
  }

  async createUser(userData: CreateUserData): Promise<UserData> {
    const { username, email, password, displayName, isActive = true, roleIds = [] } = userData;

    return safeExecute(
      async () => {
        await this.validateUniqueness(username, email);
        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await db.insert(users)
          .values({
            username,
            email,
            passwordHash,
            displayName: displayName || null,
            isActive
          })
          .returning(this.userFields)
          .get();

        if (roleIds.length > 0) {
          await this.assignRolesToUser(newUser.id, roleIds);
        }

        loggers.database.info({ userId: newUser.id, username, email }, 'User created successfully');
        return newUser;
      },
      'create user',
      { username, email }
    );
  }

  async updateUser(id: string, updateData: UpdateUserData, currentUserId?: string): Promise<UserData> {
    const { email, displayName, isActive, roleIds } = updateData;

    return safeExecute(
      async () => {
        const existingUser = await this.findById(id);
        if (!existingUser) throw new Error('User not found');

        if (isActive === false) {
          this.validateUserOperation(id, currentUserId, 'deactivate');
        }

        if (email) {
          await this.validateUniqueness(existingUser.username, email, id);
        }

        const updateFields: any = { updatedAt: new Date() };
        if (email !== undefined) updateFields.email = email;
        if (displayName !== undefined) updateFields.displayName = displayName;
        if (isActive !== undefined) updateFields.isActive = isActive;

        const updatedUser = await db.update(users)
          .set(updateFields)
          .where(eq(users.id, id))
          .returning(this.userFields)
          .get();

        if (roleIds !== undefined) {
          await this.updateUserRoles(id, roleIds);
        }

        loggers.database.info({ userId: id, updateData }, 'User updated successfully');
        return updatedUser;
      },
      'update user',
      { userId: id, updateData }
    );
  }

  async deleteUser(id: string, currentUserId?: string): Promise<void> {
    return safeExecute(
      async () => {
        this.validateUserOperation(id, currentUserId, 'delete');

        const existingUser = await this.findById(id);
        if (!existingUser) throw new Error('User not found');

        await Promise.all([
          db.delete(userRoles).where(eq(userRoles.userId, id)),
          revokeAllUserRefreshTokens(id)
        ]);

        await db.delete(users).where(eq(users.id, id));
        loggers.database.info({ userId: id }, 'User deleted successfully');
      },
      'delete user',
      { userId: id }
    );
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    return safeExecute(
      async () => {
        const user = await db.select({ passwordHash: users.passwordHash })
          .from(users)
          .where(eq(users.id, userId))
          .get();

        if (!user) throw new Error('User not found');

        const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValidPassword) throw new Error('Current password is incorrect');

        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        await Promise.all([
          db.update(users)
            .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
            .where(eq(users.id, userId)),
          revokeAllUserRefreshTokens(userId)
        ]);

        loggers.database.info({ userId }, 'Password changed successfully');
      },
      'change password',
      { userId }
    );
  }

  async updateLastLogin(userId: string): Promise<void> {
    return safeExecute(
      () => db.update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, userId)).then(() => void 0),
      'update last login time',
      { userId }
    );
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    return safeExecute(
      async () => {
        const user = await db.select({ passwordHash: users.passwordHash })
          .from(users)
          .where(eq(users.id, userId))
          .get();

        return user ? await bcrypt.compare(password, user.passwordHash) : false;
      },
      'verify password',
      { userId }
    );
  }

  async assignRolesToUser(userId: string, roleIds: string[]): Promise<void> {
    return safeExecute(
      async () => {
        if (roleIds.length > 0) {
          // Use roleService to validate roles exist
          const validationPromises = roleIds.map(roleId => roleService.findRoleById(roleId));
          const roleResults = await Promise.all(validationPromises);
          
          const missingRoles = roleResults.map((role, index) => ({ role, roleId: roleIds[index] }))
            .filter(({ role }) => !role)
            .map(({ roleId }) => roleId);

          if (missingRoles.length > 0) {
            throw new Error(`Some roles do not exist: ${missingRoles.join(', ')}`);
          }

          for (const roleId of roleIds) {
            await db.insert(userRoles)
              .values({ userId, roleId })
              .onConflictDoNothing();
          }
        }

        loggers.database.info({ userId, roleIds }, 'Roles assigned to user');
      },
      'assign roles to user',
      { userId, roleIds }
    );
  }


  /**
   * 获取用户角色数据
   */
  private async getManyUserRoles(userIds: string[]): Promise<Map<string, string[]>> {
    if (userIds.length === 0) return new Map();

    const userRolesData = await db.select({
      userId: userRoles.userId,
      roleName: roles.name,
    })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(inArray(userRoles.userId, userIds));

    const userRolesMap = new Map<string, string[]>();
    userRolesData.forEach(ur => {
      if (!userRolesMap.has(ur.userId)) {
        userRolesMap.set(ur.userId, []);
      }
      userRolesMap.get(ur.userId)!.push(ur.roleName);
    });

    return userRolesMap;
  }


  async getUserRoles(userId: string) {
    return safeExecute(async () => {
      const userRoleData = await db.select({
        roleName: roles.name
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));
      return userRoleData.map((ur: any) => ur.roleName);
    }, 'get user roles', { userId });
  }

  async updateUserRoles(userId: string, roleIds: string[]): Promise<void> {
    return safeExecute(
      async () => {
        await db.delete(userRoles).where(eq(userRoles.userId, userId));
        if (roleIds.length > 0) {
          await this.assignRolesToUser(userId, roleIds);
        }
        loggers.database.info({ userId, roleIds }, 'User roles updated');
      },
      'update user roles',
      { userId, roleIds }
    );
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    return safeExecute(
      async () => {
        const userPermissions = await db.select({
          permissionName: permissions.name
        })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(eq(userRoles.userId, userId));

        return Array.from(new Set(userPermissions.map(p => p.permissionName)));
      },
      'get user permissions',
      { userId }
    );
  }

  async getManyUserPermissions(userIds: string[]): Promise<Map<string, string[]>> {
    if (userIds.length === 0) return new Map();

    const userPermissionsData = await db.select({
      userId: userRoles.userId,
      permissionName: permissions.name
    })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(inArray(userRoles.userId, userIds));

    const userPermissionsMap = new Map<string, string[]>();
    userPermissionsData.forEach(up => {
      if (!userPermissionsMap.has(up.userId)) {
        userPermissionsMap.set(up.userId, []);
      }
      userPermissionsMap.get(up.userId)!.push(up.permissionName);
    });

    // Ensure unique permissions per user
    for (const [userId, perms] of userPermissionsMap.entries()) {
      userPermissionsMap.set(userId, Array.from(new Set(perms)));
    }

    return userPermissionsMap;
  }

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    return safeExecute(
      async () => {
        const userPermissions = await this.getUserPermissions(userId);
        return userPermissions.includes(permission) || userPermissions.includes('system.admin');
      },
      'check user permission',
      { userId, permission }
    );
  }

  async isEmailExists(email: string, excludeUserId?: string): Promise<boolean> {
    return entityExists(users, 'email', email, excludeUserId);
  }

  async isUsernameExists(username: string, excludeUserId?: string): Promise<boolean> {
    return entityExists(users, 'username', username, excludeUserId);
  }
}

// Export singleton instance
export const userService = new UserService();