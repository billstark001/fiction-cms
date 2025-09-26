import { Hono } from 'hono';
import { auth } from './auth.js';
import { userRoutes } from './users.js';
import { roleRoutes } from './roles.js';
import { siteRoutes } from './sites.js';
import { engineRoutes } from './engine.js';
import { authMiddleware, requirePermission } from '../auth/middleware.js';
import { db } from '../db/index.js';
import { permissions } from '../db/schema.js';

const api = new Hono();

// Public routes (no authentication required)
api.route('/auth', auth);

// Protected routes (authentication required)
api.route('/users', userRoutes);
api.route('/roles', roleRoutes);
api.route('/sites', siteRoutes);
api.route('/engine', engineRoutes);

// System information endpoints
api.get('/system/info', authMiddleware, requirePermission('system.read'), async (c) => {
  const user = c.get('user');
  
  return c.json({
    system: {
      name: 'Fiction CMS Backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      node_version: process.version,
      uptime: process.uptime()
    },
    user: {
      id: user.id,
      username: user.username,
      roles: user.roles,
      permissions: user.permissions.length
    }
  });
});

// Health check endpoint
api.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'fiction-cms-backend'
  });
});

// List all available permissions (for admin interfaces)
api.get('/permissions', authMiddleware, requirePermission('user.read'), async (c) => {
  try {
    const allPermissions = await db.select({
      id: permissions.id,
      name: permissions.name,
      displayName: permissions.displayName,
      description: permissions.description,
      resource: permissions.resource,
      action: permissions.action
    }).from(permissions);

    return c.json({ permissions: allPermissions });
  } catch (error) {
    console.error('Get permissions error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { api };