import 'server-only';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schema';

function createDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured.');
  }
  return drizzle({ client: neon(connectionString), schema });
}

type Database = ReturnType<typeof createDatabase>;
let database: Database | null = null;

export function db(): Database {
  if (!database) database = createDatabase();
  return database;
}
