import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import path from 'path';

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'fiction-cms.db');

const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrent access
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('synchronous = NORMAL');
sqlite.pragma('cache_size = 1000000');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

export { sqlite };