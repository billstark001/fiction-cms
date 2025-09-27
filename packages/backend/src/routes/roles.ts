import { Hono } from 'hono';
import { authMiddleware, requirePermission } from '../auth/middleware.js';
import { validateJson, validateQuery, validateParams } from '../middleware/validation.js';
import { roleService } from '../services/index.js';
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
  try {
    const allRoles = await roleService.getAllRoles();
    
    // For now, return all roles with empty permissions array
    // TODO: Implement pagination and search in roleService if needed
    const rolesWithPermissions = allRoles.map(role => ({
      ...role,
      permissions: []
    }));

    return c.json({
      items: rolesWithPermissions,
      pagination: {
        page: 1,
        limit: allRoles.length,
        total: allRoles.length,
        totalPages: 1
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
    const roleWithPermissions = await roleService.findRoleByIdWithPermissions(id);

    if (!roleWithPermissions) {
      return c.json({ error: 'Role not found' }, 404);
    }

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
  const roleData = c.get('validatedData');

  try {
    const newRole = await roleService.createRole(roleData);

    return c.json({
      message: 'Role created successfully',
      role: newRole
    }, 201);
  } catch (error) {
    console.error('Create role error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Role name already exists') {
        return c.json({ error: error.message }, 409);
      }
      if (error.message === 'Some permissions do not exist') {
        return c.json({ error: error.message }, 400);
      }
    }
    
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * PUT /roles/:id - Update role
 */
roleRoutes.put('/:id', requirePermission('user.admin'), validateParams(idParamSchema), validateJson(updateRoleSchema), async (c) => {
  const { id } = c.get('validatedParams');
  const updateData = c.get('validatedData');

  try {
    const updatedRole = await roleService.updateRole(id, updateData);

    return c.json({
      message: 'Role updated successfully',
      role: updatedRole
    });
  } catch (error) {
    console.error('Update role error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Role not found') {
        return c.json({ error: error.message }, 404);
      }
      if (error.message === 'Some permissions do not exist') {
        return c.json({ error: error.message }, 400);
      }
    }
    
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * DELETE /roles/:id - Delete role
 */
roleRoutes.delete('/:id', requirePermission('user.admin'), validateParams(idParamSchema), async (c) => {
  const { id } = c.get('validatedParams');

  try {
    await roleService.deleteRole(id);

    return c.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Role not found') {
        return c.json({ error: error.message }, 404);
      }
      if (error.message === 'Cannot delete role that is assigned to users') {
        return c.json({ 
          error: error.message,
          suggestion: 'Remove users from this role first'
        }, 400);
      }
    }
    
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { roleRoutes };