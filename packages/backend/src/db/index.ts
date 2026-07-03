import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as appSchema from './schema.js';
import { cmsPsqlSchema } from '@fiction-cms/psql';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/fiction_cms';

export const pool = new Pool({ connectionString });

export const db = drizzle({
  client: pool,
  schema: {
    ...appSchema,
    ...cmsPsqlSchema,
  },
});
