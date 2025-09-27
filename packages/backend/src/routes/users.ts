import { Hono } from 'hono';
import { authMiddleware, requirePermission } from '../auth/middleware.js';
import { validateJson, validateQuery, validateParams } from '../middleware/validation.js';
import { userService } from '../services/index.js';
import { 
  createUserSchema, 
  updateUserSchema, 
  updateUserProfileSchema,
  paginationSchema,
  searchSchema,
  idParamSchema
} from '../schemas/index.js';

const userRoutes = new Hono();

// Apply authentication to all user routes
userRoutes.use('*', authMiddleware);

/**
 * GET /users - List users with pagination and search
 */
userRoutes.get('/', requirePermission('user.read'), validateQuery(paginationSchema.merge(searchSchema.partial())), async (c) => {
  const { page, limit, orderBy = 'username', orderDirection, q } = c.get('validatedQuery');

  try {
    const result = await userService.searchUsers({
      page,
      limit,
      query: q,
      orderBy,
      orderDirection
    });

    return c.json({
      users: result.users,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('List users error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /users/:id - Get specific user
 */
userRoutes.get('/:id', requirePermission('user.read'), validateParams(idParamSchema), async (c) => {
  const { id } = c.get('validatedParams');

  try {
    const user = await userService.findByIdWithRoles(id);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /users - Create new user
 */
userRoutes.post('/', requirePermission('user.write'), validateJson(createUserSchema), async (c) => {
  const { username, email, password, displayName, isActive = true, roleIds = [] } = c.get('validatedData');

  try {
    const newUser = await userService.createUser({
      username,
      email,
      password,
      displayName,
      isActive,
      roleIds
    });

    return c.json({
      message: 'User created successfully',
      user: newUser
    }, 201);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Username already exists') {
        return c.json({ error: 'Username already exists' }, 409);
      }
      if (error.message === 'Email already exists') {
        return c.json({ error: 'Email already exists' }, 409);
      }
    }
    console.error('Create user error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * PUT /users/:id - Update user
 */
userRoutes.put('/:id', requirePermission('user.write'), validateParams(idParamSchema), validateJson(updateUserSchema), async (c) => {
  const { id } = c.get('validatedParams');
  const { email, displayName, isActive, roleIds } = c.get('validatedData');
  const currentUser = c.get('user');

  try {
    const updatedUser = await userService.updateUser(id, {
      email,
      displayName,
      isActive,
      roleIds
    }, currentUser.id);

    return c.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return c.json({ error: 'User not found' }, 404);
      }
      if (error.message === 'Cannot deactivate your own account') {
        return c.json({ error: 'Cannot deactivate your own account' }, 400);
      }
      if (error.message === 'Email already exists') {
        return c.json({ error: 'Email already exists' }, 409);
      }
    }
    console.error('Update user error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * DELETE /users/:id - Delete user
 */
userRoutes.delete('/:id', requirePermission('user.delete'), validateParams(idParamSchema), async (c) => {
  const { id } = c.get('validatedParams');
  const currentUser = c.get('user');

  try {
    await userService.deleteUser(id, currentUser.id);

    return c.json({ message: 'User deleted successfully' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Cannot delete your own account') {
        return c.json({ error: 'Cannot delete your own account' }, 400);
      }
      if (error.message === 'User not found') {
        return c.json({ error: 'User not found' }, 404);
      }
    }
    console.error('Delete user error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * PUT /users/profile - Update current user's profile
 */
userRoutes.put('/profile', validateJson(updateUserProfileSchema), async (c) => {
  const currentUser = c.get('user');
  const { email, displayName } = c.get('validatedData');

  try {
    const updatedUser = await userService.updateUser(currentUser.id, {
      email,
      displayName
    });

    return c.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Email already exists') {
        return c.json({ error: 'Email already exists' }, 409);
      }
    }
    console.error('Update profile error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { userRoutes };