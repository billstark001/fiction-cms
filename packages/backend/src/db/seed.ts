import { db } from './index.js';
import { roles, permissions, rolePermissions, users, userRoles, refreshTokens, userSites, sites } from './schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

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
  console.log('Starting database seeding...');

  try {
    // Create default permissions
    console.log('Creating default permissions...');
    for (const permission of defaultPermissions) {
      await db.insert(permissions)
        .values(permission)
        .onConflictDoNothing()
        .run();
    }

    // Create default roles
    console.log('Creating default roles...');
    for (const role of defaultRoles) {
      await db.insert(roles)
        .values(role)
        .onConflictDoNothing()
        .run();
    }

    // Assign permissions to roles
    console.log('Assigning permissions to roles...');
    for (const [roleName, permissionNames] of Object.entries(rolePermissionMappings)) {
      const role = await db.select().from(roles).where(eq(roles.name, roleName)).get();
      if (!role) continue;

      for (const permissionName of permissionNames) {
        const permission = await db.select().from(permissions).where(eq(permissions.name, permissionName)).get();
        if (!permission) continue;

        await db.insert(rolePermissions)
          .values({
            roleId: role.id,
            permissionId: permission.id
          })
          .onConflictDoNothing()
          .run();
      }
    }

    // Create default admin user if it doesn't exist
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length === 0) {
      console.log('Creating default admin user...');
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      const adminUser = await db.insert(users)
        .values({
          username: 'admin',
          email: 'admin@fictioncms.local',
          passwordHash,
          displayName: 'System Administrator',
          isActive: true
        })
        .returning()
        .get();

      const adminRole = await db.select().from(roles).where(eq(roles.name, 'admin')).get();
      if (adminRole) {
        await db.insert(userRoles)
          .values({
            userId: adminUser.id,
            roleId: adminRole.id
          })
          .run();
      }

      console.log('Default admin user created:');
      console.log('Username: admin');
      console.log('Password: admin123');
      console.log('Email: admin@fictioncms.local');
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

export async function resetDatabase() {
  console.log('Resetting database...');
  
  // Truncate all tables in reverse dependency order
  await db.delete(rolePermissions);
  await db.delete(userRoles);
  await db.delete(refreshTokens);
  await db.delete(userSites);
  await db.delete(permissions);
  await db.delete(roles);
  await db.delete(sites);
  await db.delete(users);

  console.log('Database reset completed!');
}