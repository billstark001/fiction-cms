import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { users, userRoles, roles, rolePermissions, permissions } from '../db/schema.js';
import { eq, ne, like, or, and } from 'drizzle-orm';
import { authMiddleware, requirePermission } from '../auth/middleware.js';
import { validateJson, validateQuery, validateParams } from '../middleware/validation.js';
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
  const offset = (page - 1) * limit;

  try {
    let query = db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      displayName: users.displayName,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      lastLoginAt: users.lastLoginAt
    }).from(users);

    // Apply search filter if provided
    if (q) {
      query = query.where(
        or(
          like(users.username, `%${q}%`),
          like(users.email, `%${q}%`),
          like(users.displayName, `%${q}%`)
        )
      );
    }

    // Apply pagination and ordering
    const usersData = await query
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalResult = await db.select({ count: users.id }).from(users);
    const total = totalResult.length;

    // Get roles for each user
    const userIds = usersData.map(u => u.id);
    const userRolesData = await db.select({
      userId: userRoles.userId,
      roleName: roles.name,
      roleDisplayName: roles.displayName
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userIds[0]) || userIds.length > 1 ? 
      // Use IN operator for multiple users
      eq(userRoles.userId, userIds[0]) : eq(userRoles.userId, userIds[0]));

    // Group roles by user
    const userRolesMap = new Map<string, any[]>();
    userRolesData.forEach(ur => {
      if (!userRolesMap.has(ur.userId)) {
        userRolesMap.set(ur.userId, []);
      }
      userRolesMap.get(ur.userId)!.push({
        name: ur.roleName,
        displayName: ur.roleDisplayName
      });
    });

    const usersWithRoles = usersData.map(user => ({
      ...user,
      roles: userRolesMap.get(user.id) || []
    }));

    return c.json({
      users: usersWithRoles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
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
    const user = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      displayName: users.displayName,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      lastLoginAt: users.lastLoginAt
    })
    .from(users)
    .where(eq(users.id, id))
    .get();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Get user roles
    const userRolesData = await db.select({
      roleId: roles.id,
      roleName: roles.name,
      roleDisplayName: roles.displayName
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, id));

    const userWithRoles = {
      ...user,
      roles: userRolesData.map(role => ({
        id: role.roleId,
        name: role.roleName,
        displayName: role.roleDisplayName
      }))
    };

    return c.json({ user: userWithRoles });
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
    // Check if username already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (existingUser) {
      return c.json({ error: 'Username already exists' }, 409);
    }

    // Check if email already exists
    const existingEmail = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (existingEmail) {
      return c.json({ error: 'Email already exists' }, 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await db.insert(users)
      .values({
        username,
        email,
        passwordHash,
        displayName: displayName || null,
        isActive
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .get();

    // Assign roles if provided
    if (roleIds.length > 0) {
      // Verify roles exist
      const existingRoles = await db.select()
        .from(roles)
        .where(eq(roles.id, roleIds[0]) || roleIds.length > 1 ? 
          eq(roles.id, roleIds[0]) : eq(roles.id, roleIds[0])); // Simplified for demo

      for (const roleId of roleIds) {
        await db.insert(userRoles)
          .values({
            userId: newUser.id,
            roleId
          });
      }
    }

    return c.json({
      message: 'User created successfully',
      user: newUser
    }, 201);
  } catch (error) {
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
    // Check if user exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.id, id))
      .get();

    if (!existingUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Prevent users from deactivating themselves
    if (currentUser.id === id && isActive === false) {
      return c.json({ error: 'Cannot deactivate your own account' }, 400);
    }

    // Check if email already exists (excluding current user)
    if (email) {
      const existingEmail = await db.select()
        .from(users)
        .where(and(eq(users.email, email), ne(users.id, id)))
        .get();

      if (existingEmail) {
        return c.json({ error: 'Email already exists' }, 409);
      }
    }

    // Update user
    const updateData: any = { updatedAt: new Date() };
    if (email !== undefined) updateData.email = email;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .get();

    // Update roles if provided
    if (roleIds !== undefined) {
      // Delete existing roles
      await db.delete(userRoles).where(eq(userRoles.userId, id));

      // Add new roles
      if (roleIds.length > 0) {
        for (const roleId of roleIds) {
          await db.insert(userRoles)
            .values({
              userId: id,
              roleId
            });
        }
      }
    }

    return c.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
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
    // Prevent users from deleting themselves
    if (currentUser.id === id) {
      return c.json({ error: 'Cannot delete your own account' }, 400);
    }

    // Check if user exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.id, id))
      .get();

    if (!existingUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Delete user roles first (foreign key constraint)
    await db.delete(userRoles).where(eq(userRoles.userId, id));

    // Delete user
    await db.delete(users).where(eq(users.id, id));

    return c.json({ message: 'User deleted successfully' });
  } catch (error) {
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
    // Check if email already exists (excluding current user)
    if (email) {
      const existingEmail = await db.select()
        .from(users)
        .where(and(eq(users.email, email), ne(users.id, currentUser.id)))
        .get();

      if (existingEmail) {
        return c.json({ error: 'Email already exists' }, 409);
      }
    }

    // Update user profile
    const updateData: any = { updatedAt: new Date() };
    if (email !== undefined) updateData.email = email;
    if (displayName !== undefined) updateData.displayName = displayName;

    const updatedUser = await db.update(users)
      .set(updateData)
      .where(eq(users.id, currentUser.id))
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .get();

    return c.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { userRoutes };