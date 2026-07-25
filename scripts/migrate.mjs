import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });
config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required.');
}

const sql = neon(process.env.DATABASE_URL);
const scriptsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../drizzle');
const files = (await readdir(scriptsDir))
  .filter((file) => /^\d+.*\.sql$/.test(file))
  .sort((a, b) => a.localeCompare(b));

await sql.query(
  `CREATE TABLE IF NOT EXISTS "_dcz_migrations" (
    "name" text PRIMARY KEY NOT NULL,
    "checksum" text NOT NULL,
    "applied_at" timestamptz NOT NULL DEFAULT now()
  )`,
  [],
);

const appliedRows = await sql.query('SELECT "name", "checksum" FROM "_dcz_migrations"', []);
const applied = new Map(appliedRows.map((row) => [String(row.name), String(row.checksum)]));
let statementCount = 0;
let migrationCount = 0;

for (const file of files) {
  const source = await readFile(path.join(scriptsDir, file), 'utf8');
  const checksum = createHash('sha256').update(source).digest('hex');
  const previousChecksum = applied.get(file);

  if (previousChecksum) {
    if (previousChecksum !== checksum) {
      throw new Error(`Applied migration ${file} was modified. Create a new migration instead.`);
    }
    console.log(`Skipped ${file} (already applied).`);
    continue;
  }

  const statements = source
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter(Boolean);

  await sql.transaction((transaction) => [
    transaction.query(`SELECT pg_advisory_xact_lock(hashtext('_dcz_migrations'))`, []),
    ...statements.map((statement) => transaction.query(statement, [])),
    transaction.query(
      'INSERT INTO "_dcz_migrations" ("name", "checksum") VALUES ($1, $2)',
      [file, checksum],
    ),
  ]);
  statementCount += statements.length;
  migrationCount += 1;
  console.log(`Applied ${file} (${statements.length} statements).`);
}

console.log(`Migration complete: ${migrationCount} new files, ${statementCount} statements.`);
