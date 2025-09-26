import { Hono } from 'hono';
import { db } from '../db/index.js';
import { roles, permissions, rolePermissions, userRoles } from '../db/schema.js';
import { eq, like, or } from 'drizzle-orm';
import { authMiddleware, requirePermission } from '../auth/middleware.js';
import { validateJson, validateQuery, validateParams } from '../middleware/validation.js';
import { 
  createRoleSchema, 
  updateRoleSchema, 
  paginationSchema,
  searchSchema,
  idParamSchema
} from '../schemas/index.js';

const roleRoutes = new Hono();

// Apply authentication to all role routes
roleRoutes.use('*', authMiddleware);

/**
 * GET /roles - List roles with pagination and search
 */
roleRoutes.get('/', requirePermission('user.read'), validateQuery(paginationSchema.merge(searchSchema.partial())), async (c) => {
  const { page, limit, orderBy = 'name', orderDirection, q } = c.get('validatedQuery');
  const offset = (page - 1) * limit;

    try {
      const baseQuery = db.select({
        id: roles.id,
        name: roles.name,
        displayName: roles.displayName,
        description: roles.description,
        isDefault: roles.isDefault,
        createdAt: roles.createdAt
      }).from(roles);

      let rolesData;
      
      // Apply search filter if provided
      if (q) {
        rolesData = await baseQuery.where(
          or(
            like(roles.name, `%${q}%`),
            like(roles.displayName, `%${q}%`),
            like(roles.description, `%${q}%`)
          )
        ).limit(limit).offset(offset);
      } else {
        rolesData = await baseQuery.limit(limit).offset(offset);
      }

    // Get total count for pagination
    const totalResult = await db.select({ count: roles.id }).from(roles);
    const total = totalResult.length;

    // Get permissions for each role
    const roleIds = rolesData.map(r => r.id);
    if (roleIds.length > 0) {
      const rolePermissionsData = await db.select({
        roleId: rolePermissions.roleId,
        permissionId: permissions.id,
        permissionName: permissions.name,
        permissionDisplayName: permissions.displayName,
        resource: permissions.resource,
        action: permissions.action
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id));

      // Group permissions by role
      const rolePermissionsMap = new Map<string, any[]>();
      rolePermissionsData.forEach(rp => {
        if (!rolePermissionsMap.has(rp.roleId)) {
          rolePermissionsMap.set(rp.roleId, []);
        }
        rolePermissionsMap.get(rp.roleId)!.push({
          id: rp.permissionId,
          name: rp.permissionName,
          displayName: rp.permissionDisplayName,
          resource: rp.resource,
          action: rp.action
        });
      });

      const rolesWithPermissions = rolesData.map(role => ({
        ...role,
        permissions: rolePermissionsMap.get(role.id) || []
      }));

      return c.json({
        roles: rolesWithPermissions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    }

    return c.json({
      roles: rolesData.map(role => ({ ...role, permissions: [] })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('List roles error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /roles/:id - Get specific role
 */
roleRoutes.get('/:id', requirePermission('user.read'), validateParams(idParamSchema), async (c) => {
  const { id } = c.get('validatedParams');

  try {
    const role = await db.select()
      .from(roles)
      .where(eq(roles.id, id))
      .get();

    if (!role) {
      return c.json({ error: 'Role not found' }, 404);
    }

    // Get role permissions
    const rolePermissionsData = await db.select({
      permissionId: permissions.id,
      permissionName: permissions.name,
      permissionDisplayName: permissions.displayName,
      description: permissions.description,
      resource: permissions.resource,
      action: permissions.action
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, id));

    const roleWithPermissions = {
      ...role,
      permissions: rolePermissionsData.map(perm => ({
        id: perm.permissionId,
        name: perm.permissionName,
        displayName: perm.permissionDisplayName,
        description: perm.description,
        resource: perm.resource,
        action: perm.action
      }))
    };

    return c.json({ role: roleWithPermissions });
  } catch (error) {
    console.error('Get role error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /roles - Create new role
 */
roleRoutes.post('/', requirePermission('user.admin'), validateJson(createRoleSchema), async (c) => {
  const { name, displayName, description, isDefault = false, permissionIds = [] } = c.get('validatedData');

  try {
    // Check if role name already exists
    const existingRole = await db.select()
      .from(roles)
      .where(eq(roles.name, name))
      .get();

    if (existingRole) {
      return c.json({ error: 'Role name already exists' }, 409);
    }

    // Create role
    const newRole = await db.insert(roles)
      .values({
        name,
        displayName,
        description: description || null,
        isDefault
      })
      .returning()
      .get();

    // Assign permissions if provided
    if (permissionIds.length > 0) {
      // Verify permissions exist
      const existingPermissions = await db.select()
        .from(permissions);

      const validPermissionIds = existingPermissions.map(p => p.id);
      const invalidIds = permissionIds.filter((id: string) => !validPermissionIds.includes(id));

      if (invalidIds.length > 0) {
        return c.json({ 
          error: 'Some permission IDs are invalid',
          invalidIds
        }, 400);
      }

      for (const permissionId of permissionIds) {
        await db.insert(rolePermissions)
          .values({
            roleId: newRole.id,
            permissionId
          });
      }
    }

    return c.json({
      message: 'Role created successfully',
      role: newRole
    }, 201);
  } catch (error) {
    console.error('Create role error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * PUT /roles/:id - Update role
 */
roleRoutes.put('/:id', requirePermission('user.admin'), validateParams(idParamSchema), validateJson(updateRoleSchema), async (c) => {
  const { id } = c.get('validatedParams');
  const { displayName, description, isDefault, permissionIds } = c.get('validatedData');

  try {
    // Check if role exists
    const existingRole = await db.select()
      .from(roles)
      .where(eq(roles.id, id))
      .get();

    if (!existingRole) {
      return c.json({ error: 'Role not found' }, 404);
    }

    // Update role
    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (description !== undefined) updateData.description = description;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const updatedRole = await db.update(roles)
      .set(updateData)
      .where(eq(roles.id, id))
      .returning()
      .get();

    // Update permissions if provided
    if (permissionIds !== undefined) {
      // Delete existing permissions
      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id));

      // Add new permissions
      if (permissionIds.length > 0) {
        // Verify permissions exist
        const existingPermissions = await db.select()
          .from(permissions);

        const validPermissionIds = existingPermissions.map(p => p.id);
        const invalidIds = permissionIds.filter((permId: string) => !validPermissionIds.includes(permId));

        if (invalidIds.length > 0) {
          return c.json({ 
            error: 'Some permission IDs are invalid',
            invalidIds
          }, 400);
        }

        for (const permissionId of permissionIds) {
          await db.insert(rolePermissions)
            .values({
              roleId: id,
              permissionId
            });
        }
      }
    }

    return c.json({
      message: 'Role updated successfully',
      role: updatedRole
    });
  } catch (error) {
    console.error('Update role error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * DELETE /roles/:id - Delete role
 */
roleRoutes.delete('/:id', requirePermission('user.admin'), validateParams(idParamSchema), async (c) => {
  const { id } = c.get('validatedParams');

  try {
    // Check if role exists
    const existingRole = await db.select()
      .from(roles)
      .where(eq(roles.id, id))
      .get();

    if (!existingRole) {
      return c.json({ error: 'Role not found' }, 404);
    }

    // Check if role is assigned to any users
    const assignedUsers = await db.select()
      .from(userRoles)
      .where(eq(userRoles.roleId, id))
      .limit(1);

    if (assignedUsers.length > 0) {
      return c.json({ 
        error: 'Cannot delete role that is assigned to users',
        suggestion: 'Remove users from this role first'
      }, 400);
    }

    // Delete role permissions first (foreign key constraint)
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id));

    // Delete role
    await db.delete(roles).where(eq(roles.id, id));

    return c.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { roleRoutes };