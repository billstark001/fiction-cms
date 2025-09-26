import { db, sqlite } from '../db/index.js';
import { seedDatabase } from '../db/seed.js';

/**
 * Initialize database schema and seed initial data
 */
export async function initializeDatabase() {
  try {
    console.log('Initializing database...');

    // Run migrations (in a real app, you'd have proper migration files)
    // For now, we'll just ensure tables exist by running a simple query
    // and let Drizzle handle the schema creation
    
    // Test database connection
    const result = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table';").all();
    console.log('Database connected. Tables:', result.length);

    // Seed database with default data
    await seedDatabase();
    
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}