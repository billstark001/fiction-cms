import Database, { type Database as DatabaseType } from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import path from 'path';

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'fiction-cms.db');

const sqliteDb = new Database(dbPath);

// Enable WAL mode for better concurrent access
sqliteDb.pragma('journal_mode = WAL');
sqliteDb.pragma('synchronous = NORMAL');
sqliteDb.pragma('cache_size = 1000000');
sqliteDb.pragma('foreign_keys = ON');

export const db = drizzle(sqliteDb, { schema });

// Export type-safe sqlite instance
export const sqlite: DatabaseType = sqliteDb;