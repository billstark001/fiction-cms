import { sqlite } from '../db/index.js';

/**
 * Manually create database tables if they don't exist
 * This is a fallback approach for when drizzle-kit push is not available
 */
export function createTables() {
  console.log('Creating database tables manually...');

  // Users table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      last_login_at INTEGER
    );
  `);

  // Roles table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      description TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `);

  // Permissions table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      description TEXT,
      resource TEXT NOT NULL,
      action TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  // Sites table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sites (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      github_repository_url TEXT NOT NULL,
      github_pat_encrypted BLOB NOT NULL,
      local_path TEXT NOT NULL,
      build_command TEXT,
      build_output_dir TEXT,
      editable_paths TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // User-Role assignments
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user_roles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      role_id TEXT NOT NULL REFERENCES roles(id),
      created_at INTEGER NOT NULL
    );
  `);

  // Role-Permission assignments
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id TEXT PRIMARY KEY,
      role_id TEXT NOT NULL REFERENCES roles(id),
      permission_id TEXT NOT NULL REFERENCES permissions(id),
      created_at INTEGER NOT NULL
    );
  `);

  // User-Site assignments
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user_sites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      site_id TEXT NOT NULL REFERENCES sites(id),
      role_id TEXT NOT NULL REFERENCES roles(id),
      created_at INTEGER NOT NULL
    );
  `);

  // Refresh tokens
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL REFERENCES users(id),
      expires_at INTEGER NOT NULL,
      is_revoked INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `);

  console.log('Database tables created successfully!');
}