import { Context, Next } from 'hono';
import { verifyToken, TokenPayload } from './tokens.js';
import { db } from '../db/index.js';
import { users, userRoles, roles, rolePermissions, permissions, userSites } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { loggers, logHelpers } from '../utils/logger.js';

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  displayName?: string | null;
  isActive: boolean;
  roles: string[];
  permissions: string[];
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthenticatedUser;
  }
}

/**
 * Authentication middleware that verifies PASETO tokens
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401);
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const payload: TokenPayload = await verifyToken(token);

    if (payload.type !== 'access') {
      return c.json({ error: 'Invalid token type' }, 401);
    }

    // Get user from database
    const user = await db.select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .get();

    if (!user || !user.isActive) {
      return c.json({ error: 'User not found or inactive' }, 401);
    }

    // Get user roles and permissions
    const userWithRoles = await db.select({
      roleName: roles.name,
      permissionName: permissions.name
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(userRoles.userId, user.id));

    const roleSet = new Set<string>();
    const permissionSet = new Set<string>();

    userWithRoles.forEach(({ roleName, permissionName }) => {
      roleSet.add(roleName);
      permissionSet.add(permissionName);
    });

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      isActive: user.isActive,
      roles: Array.from(roleSet),
      permissions: Array.from(permissionSet)
    };

    c.set('user', authenticatedUser);
    await next();
  } catch (error) {
    return c.json({ 
      error: 'Invalid authentication token',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 401);
  }
}

/**
 * Optional authentication middleware - sets user if token is valid but doesn't fail if missing
 */
export async function optionalAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      const payload: TokenPayload = await verifyToken(token);
      
      if (payload.type === 'access') {
        const user = await db.select()
          .from(users)
          .where(eq(users.id, payload.sub))
          .get();

        if (user && user.isActive) {
          const userWithRoles = await db.select({
            roleName: roles.name,
            permissionName: permissions.name
          })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(eq(userRoles.userId, user.id));

          const roleSet = new Set<string>();
          const permissionSet = new Set<string>();

          userWithRoles.forEach(({ roleName, permissionName }) => {
            roleSet.add(roleName);
            permissionSet.add(permissionName);
          });

          const authenticatedUser: AuthenticatedUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            isActive: user.isActive,
            roles: Array.from(roleSet),
            permissions: Array.from(permissionSet)
          };

          c.set('user', authenticatedUser);
        }
      }
    } catch (error) {
      // Silently ignore invalid tokens in optional middleware
    }
  }
  
  await next();
}

/**
 * Authorization middleware that checks for specific permissions
 */
export function requirePermission(...requiredPermissions: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const hasPermission = requiredPermissions.some(permission => 
      user.permissions.includes(permission)
    );

    if (!hasPermission) {
      return c.json({ 
        error: 'Insufficient permissions',
        required: requiredPermissions,
        userPermissions: user.permissions
      }, 403);
    }

    await next();
  };
}

/**
 * Authorization middleware that checks for specific roles
 */
export function requireRole(...requiredRoles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const hasRole = requiredRoles.some(role => 
      user.roles.includes(role)
    );

    if (!hasRole) {
      return c.json({ 
        error: 'Insufficient role',
        required: requiredRoles,
        userRoles: user.roles
      }, 403);
    }

    await next();
  };
}

/**
 * Check if user has permission to access a specific site
 */
export async function checkSitePermission(userId: string, siteId: string, permission: string): Promise<boolean> {
  // First check if user has system-wide permission
  const userWithPermissions = await db.select({
    permissionName: permissions.name
  })
  .from(userRoles)
  .innerJoin(roles, eq(userRoles.roleId, roles.id))
  .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
  .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
  .where(eq(userRoles.userId, userId));

  const userPermissions = userWithPermissions.map(p => p.permissionName);
  
  // Check for system admin or global permissions
  if (userPermissions.includes('system.admin') || userPermissions.includes(`${permission.split('.')[0]}.admin`)) {
    return true;
  }

  // Check site-specific permissions
  const siteAccess = await db.select({
    permissionName: permissions.name
  })
  .from(userSites)
  .innerJoin(roles, eq(userSites.roleId, roles.id))
  .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
  .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
  .where(
    and(
      eq(userSites.userId, userId),
      eq(userSites.siteId, siteId)
    )
  );

  const sitePermissions = siteAccess.map(p => p.permissionName);
  return sitePermissions.includes(permission);
}

/**
 * Site-specific authorization middleware
 */
export function requireSitePermission(permission: string) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    const siteId = c.req.param('siteId');
    
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    if (!siteId) {
      return c.json({ error: 'Site ID required' }, 400);
    }

    const hasPermission = await checkSitePermission(user.id, siteId, permission);

    if (!hasPermission) {
      return c.json({ 
        error: 'Insufficient site permissions',
        siteId,
        required: permission
      }, 403);
    }

    await next();
  };
}