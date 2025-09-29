import { db } from '../db/index.js';
import { roles, permissions, rolePermissions, userRoles, users } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { loggers } from '../utils/logger.js';
import { entityExists, findAll, findByField, safeExecute } from './utils.js';

export interface RoleData {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  isDefault: boolean;
  createdAt: Date;
}

export interface PermissionData {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  resource: string;
  action: string;
  createdAt: Date;
}

export interface RoleWithPermissions extends RoleData {
  permissions: PermissionData[];
}

export interface CreateRoleData {
  name: string;
  displayName: string;
  description?: string;
  isDefault?: boolean;
  permissionIds?: string[];
}

export interface UpdateRoleData {
  displayName?: string;
  description?: string;
  isDefault?: boolean;
  permissionIds?: string[];
}

export interface CreatePermissionData {
  name: string;
  displayName: string;
  description?: string;
  resource: string;
  action: string;
}

/**
 * 角色和权限管理服务类
 */
export class RoleService {
  // 通用查询字段定义
  private readonly roleFields = {
    id: roles.id,
    name: roles.name,
    displayName: roles.displayName,
    description: roles.description,
    isDefault: roles.isDefault,
    createdAt: roles.createdAt
  };

  private readonly permissionFields = {
    id: permissions.id,
    name: permissions.name,
    displayName: permissions.displayName,
    description: permissions.description,
    resource: permissions.resource,
    action: permissions.action,
    createdAt: permissions.createdAt
  };

  // ============ 角色相关方法 ============

  async getAllRoles(): Promise<RoleData[]> {
    return findAll(roles, this.roleFields, 'role');
  }

  async findRoleById(id: string): Promise<RoleData | null> {
    return findByField(roles, this.roleFields, 'id', id, 'role');
  }

  async findRoleByName(name: string): Promise<RoleData | null> {
    return findByField(roles, this.roleFields, 'name', name, 'role');
  }

  async isRoleNameExists(name: string): Promise<boolean> {
    return entityExists(roles, 'name', name);
  }

  async getDefaultRoles(): Promise<RoleData[]> {
    return safeExecute(
      () => db.select(this.roleFields).from(roles).where(eq(roles.isDefault, true)),
      'get default roles'
    );
  }

  async findRoleByIdWithPermissions(id: string): Promise<RoleWithPermissions | null> {
    return safeExecute(async () => {
      const role = await this.findRoleById(id);
      if (!role) return null;

      const rolePermissionsData = await db.select(this.permissionFields)
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, id));

      return {
        ...role,
        permissions: rolePermissionsData
      };
    }, 'find role with permissions', { roleId: id });
  }

  async createRole(roleData: CreateRoleData): Promise<RoleData> {
    const { name, displayName, description, isDefault = false, permissionIds = [] } = roleData;

    return safeExecute(async () => {
      if (await this.isRoleNameExists(name)) {
        throw new Error('Role name already exists');
      }

      const newRole = await db.insert(roles)
        .values({
          name,
          displayName,
          description: description || null,
          isDefault
        })
        .returning(this.roleFields)
        .get();

      if (permissionIds.length > 0) {
        await this.assignPermissionsToRole(newRole.id, permissionIds);
      }

      loggers.database.info({ roleId: newRole.id, name }, 'Role created successfully');
      return newRole;
    }, 'create role', { name });
  }

  async updateRole(id: string, updateData: UpdateRoleData): Promise<RoleData> {
    const { displayName, description, isDefault, permissionIds } = updateData;

    return safeExecute(async () => {
      const existingRole = await this.findRoleById(id);
      if (!existingRole) {
        throw new Error('Role not found');
      }

      const updateFields: any = {};
      if (displayName !== undefined) updateFields.displayName = displayName;
      if (description !== undefined) updateFields.description = description;
      if (isDefault !== undefined) updateFields.isDefault = isDefault;

      const updatedRole = await db.update(roles)
        .set(updateFields)
        .where(eq(roles.id, id))
        .returning(this.roleFields)
        .get();

      if (permissionIds !== undefined) {
        await this.updateRolePermissions(id, permissionIds);
      }

      loggers.database.info({ roleId: id, updateData }, 'Role updated successfully');
      return updatedRole;
    }, 'update role', { roleId: id, updateData });
  }

  async deleteRole(id: string): Promise<void> {
    return safeExecute(async () => {
      const existingRole = await this.findRoleById(id);
      if (!existingRole) {
        throw new Error('Role not found');
      }

      const usersWithRole = await db.select()
        .from(userRoles)
        .where(eq(userRoles.roleId, id))
        .limit(1);

      if (usersWithRole.length > 0) {
        throw new Error('Cannot delete role that is assigned to users');
      }

      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
      await db.delete(roles).where(eq(roles.id, id));

      loggers.database.info({ roleId: id }, 'Role deleted successfully');
    }, 'delete role', { roleId: id });
  }

  // ============ 权限相关方法 ============

  async getAllPermissions(): Promise<PermissionData[]> {
    return findAll(permissions, this.permissionFields, 'permission');
  }

  async findPermissionById(id: string): Promise<PermissionData | null> {
    return findByField(permissions, this.permissionFields, 'id', id, 'permission');
  }

  async findPermissionByName(name: string): Promise<PermissionData | null> {
    return findByField(permissions, this.permissionFields, 'name', name, 'permission');
  }

  async isPermissionNameExists(name: string): Promise<boolean> {
    return entityExists(permissions, 'name', name);
  }

  async createPermission(permissionData: CreatePermissionData): Promise<PermissionData> {
    const { name, displayName, description, resource, action } = permissionData;

    return safeExecute(async () => {
      if (await this.isPermissionNameExists(name)) {
        throw new Error('Permission name already exists');
      }

      const newPermission = await db.insert(permissions)
        .values({
          name,
          displayName,
          description: description || null,
          resource,
          action
        })
        .returning(this.permissionFields)
        .get();

      loggers.database.info({ permissionId: newPermission.id, name }, 'Permission created successfully');
      return newPermission;
    }, 'create permission', { name });
  }

  // ============ 角色权限关联方法 ============

  async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<void> {
    return safeExecute(async () => {
      if (permissionIds.length === 0) return;

      const existingPermissions = await db.select()
        .from(permissions)
        .where(inArray(permissions.id, permissionIds));

      if (existingPermissions.length !== permissionIds.length) {
        throw new Error('Some permissions do not exist');
      }

      for (const permissionId of permissionIds) {
        await db.insert(rolePermissions)
          .values({ roleId, permissionId })
          .onConflictDoNothing();
      }

      loggers.database.info({ roleId, permissionIds }, 'Permissions assigned to role');
    }, 'assign permissions to role', { roleId, permissionIds });
  }

  async updateRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    return safeExecute(async () => {
      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
      
      if (permissionIds.length > 0) {
        await this.assignPermissionsToRole(roleId, permissionIds);
      }

      loggers.database.info({ roleId, permissionIds }, 'Role permissions updated');
    }, 'update role permissions', { roleId, permissionIds });
  }
}

// Export singleton instance
export const roleService = new RoleService();