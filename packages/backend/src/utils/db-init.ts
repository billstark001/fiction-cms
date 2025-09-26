import { db, sqlite as sqliteDb } from '../db/index.js';
import { seedDatabase } from '../db/seed.js';
import { createTables } from './create-tables.js';

/**
 * Initialize database schema and seed initial data
 */
export async function initializeDatabase() {
  try {
    console.log('Initializing database...');

    // Test database connection
    const result = sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table';").all();
    console.log('Database connected. Tables:', result.length);

    // If no tables exist, create them manually
    if (result.length === 0) {
      createTables();
    }

    // Seed database with default data
    await seedDatabase();
    
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}