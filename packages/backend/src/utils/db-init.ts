import { pool } from '../db/index.js';
import { seedDatabase } from '../db/seed.js';
import { createTables } from './create-tables.js';
import { loggers } from './logger.js';

/**
 * Initialize database schema and seed initial data
 */
export async function initializeDatabase() {
  const startTime = Date.now();
  
  try {
    loggers.database.info('Starting database initialization');

    // Test database connection
    const result = await pool.query<{ table_name: string }>(
      "select table_name from information_schema.tables where table_schema = 'public'",
    );
    loggers.database.info({
      tableCount: result.rows.length,
      tables: result.rows.map((row) => row.table_name)
    }, `Database connected successfully`);

    if (result.rows.length === 0) {
      loggers.database.info('No tables found, creating schema');
      await createTables();
    }

    // Seed database with default data
    await seedDatabase();
    
    const duration = Date.now() - startTime;
    loggers.database.info({ duration }, 'Database initialization completed successfully');
  } catch (error) {
    const duration = Date.now() - startTime;
    loggers.database.error({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration
    }, 'Failed to initialize database');
    throw error;
  }
}
