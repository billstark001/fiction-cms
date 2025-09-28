import { db } from './index.js';
import { roles, permissions, rolePermissions, users, userRoles, refreshTokens, userSites, sites } from './schema.js';
import { eq } from 'drizzle-orm';
import { loggers, logHelpers } from '../utils/logger.js';
import { userService, roleService } from '../services/index.js';

const defaultRoles = [
  {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full system access with all permissions',
    isDefault: false
  },
  {
    name: 'editor',
    displayName: 'Editor',
    description: 'Can manage content and sites',
    isDefault: false
  },
  {
    name: 'author',
    displayName: 'Author',
    description: 'Can create and edit content',
    isDefault: true
  },
  {
    name: 'viewer',
    displayName: 'Viewer',
    description: 'Read-only access to content',
    isDefault: false
  }
];

const defaultPermissions = [
  // System permissions
  { name: 'system.read', displayName: 'View System Info', resource: 'system', action: 'read', description: 'View system information and health' },
  { name: 'system.admin', displayName: 'System Administration', resource: 'system', action: 'admin', description: 'Full system administration access' },

  // User permissions
  { name: 'user.read', displayName: 'View Users', resource: 'user', action: 'read', description: 'View user information' },
  { name: 'user.write', displayName: 'Edit Users', resource: 'user', action: 'write', description: 'Create and edit users' },
  { name: 'user.delete', displayName: 'Delete Users', resource: 'user', action: 'delete', description: 'Delete user accounts' },
  { name: 'user.admin', displayName: 'User Administration', resource: 'user', action: 'admin', description: 'Full user management including roles' },

  // Site permissions
  { name: 'site.read', displayName: 'View Sites', resource: 'site', action: 'read', description: 'View site information and content' },
  { name: 'site.write', displayName: 'Edit Sites', resource: 'site', action: 'write', description: 'Create and edit site content' },
  { name: 'site.delete', displayName: 'Delete Sites', resource: 'site', action: 'delete', description: 'Delete sites and their content' },
  { name: 'site.admin', displayName: 'Site Administration', resource: 'site', action: 'admin', description: 'Full site management including settings' },
  { name: 'site.deploy', displayName: 'Deploy Sites', resource: 'site', action: 'deploy', description: 'Trigger site deployments' },

  // Content permissions
  { name: 'content.read', displayName: 'View Content', resource: 'content', action: 'read', description: 'View content files and data' },
  { name: 'content.write', displayName: 'Edit Content', resource: 'content', action: 'write', description: 'Create and edit content files' },
  { name: 'content.delete', displayName: 'Delete Content', resource: 'content', action: 'delete', description: 'Delete content files' },
];

// Role-Permission mappings
const rolePermissionMappings = {
  admin: [
    'system.read', 'system.admin',
    'user.read', 'user.write', 'user.delete', 'user.admin',
    'site.read', 'site.write', 'site.delete', 'site.admin', 'site.deploy',
    'content.read', 'content.write', 'content.delete'
  ],
  editor: [
    'system.read',
    'user.read',
    'site.read', 'site.write', 'site.admin', 'site.deploy',
    'content.read', 'content.write', 'content.delete'
  ],
  author: [
    'system.read',
    'site.read', 'site.write',
    'content.read', 'content.write'
  ],
  viewer: [
    'system.read',
    'site.read',
    'content.read'
  ]
};

export async function seedDatabase() {
  const startTime = Date.now();
  loggers.database.info('Starting database seeding');

  try {
    // Create default permissions
    loggers.database.info({ count: defaultPermissions.length }, 'Creating default permissions');
    let insertedPermissions = 0;
    for (const permission of defaultPermissions) {
      try {
        await db.insert(permissions)
          .values(permission)
          .onConflictDoNothing()
          .run();
        insertedPermissions++;
      } catch (error) {
        loggers.database.warn({ permission: permission.name, error }, `Failed to insert permission ${permission.name}`);
      }
    }
    logHelpers.dbOperation('insert', 'permissions', Date.now() - startTime, insertedPermissions);

    // Create default roles
    loggers.database.info({ count: defaultRoles.length }, 'Creating default roles');
    let insertedRoles = 0;
    for (const role of defaultRoles) {
      try {
        await db.insert(roles)
          .values(role)
          .onConflictDoNothing()
          .run();
        insertedRoles++;
      } catch (error) {
        loggers.database.warn({ role: role.name, error }, `Failed to insert role ${role.name}`);
      }
    }
    logHelpers.dbOperation('insert', 'roles', Date.now() - startTime, insertedRoles);

    // Assign permissions to roles
    loggers.database.info('Assigning permissions to roles');
    let assignedPermissions = 0;
    for (const [roleName, permissionNames] of Object.entries(rolePermissionMappings)) {
      const role = await db.select().from(roles).where(eq(roles.name, roleName)).get();
      if (!role) {
        loggers.database.warn(`Role not found: ${roleName}`);
        continue;
      }

      for (const permissionName of permissionNames) {
        const permission = await db.select().from(permissions).where(eq(permissions.name, permissionName)).get();
        if (!permission) {
          loggers.database.warn(`Permission not found: ${permissionName}`);
          continue;
        }

        try {
          await db.insert(rolePermissions)
            .values({
              roleId: role.id,
              permissionId: permission.id
            })
            .onConflictDoNothing()
            .run();
          assignedPermissions++;
        } catch (error) {
          loggers.database.warn({ role: roleName, permission: permissionName, error }, `Failed to assign permission ${permissionName} to role ${roleName}`);
        }
      }
    }
    logHelpers.dbOperation('insert', 'rolePermissions', Date.now() - startTime, assignedPermissions);

    // Create default admin user if it doesn't exist
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length === 0) {
      loggers.database.info('Creating default admin user');
      
      const adminUser = await userService.createUser({
        username: 'admin',
        email: 'admin@fictioncms.local',
        password: 'admin123',
        displayName: 'System Administrator',
        isActive: true
      });

      const adminRole = await roleService.findRoleByName('admin');
      if (adminRole) {
        await userService.assignRolesToUser(adminUser.id, [adminRole.id]);
      }

      loggers.database.info({
        username: 'admin',
        email: 'admin@fictioncms.local',
        userId: adminUser.id
      }, 'Default admin user created');
    } else {
      loggers.database.info('Admin user already exists, skipping creation');
    }

    const totalDuration = Date.now() - startTime;
    loggers.database.info({ duration: totalDuration }, 'Database seeding completed successfully');
  } catch (error) {
    const duration = Date.now() - startTime;
    loggers.database.error({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration
    }, 'Error seeding database');
    throw error;
  }
}

export async function resetDatabase() {
  loggers.database.info('Starting database reset');
  
  try {
    // Truncate all tables in reverse dependency order
    await db.delete(rolePermissions);
    await db.delete(userRoles);
    await db.delete(refreshTokens);
    await db.delete(userSites);
    await db.delete(permissions);
    await db.delete(roles);
    await db.delete(sites);
    await db.delete(users);

    loggers.database.info('Database reset completed successfully');
  } catch (error) {
    loggers.database.error({
      error: error instanceof Error ? error.message : String(error)
    }, 'Failed to reset database');
    throw error;
  }
}