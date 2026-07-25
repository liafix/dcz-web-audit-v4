import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function schemaColumns(source: string): Map<string, Set<string>> {
  const tables = new Map<string, Set<string>>();
  const tablePattern = /pgTable\(\s*['"]([^'"]+)['"]\s*,\s*\{([\s\S]*?)\n\s*\},\s*\(table\)/g;
  for (const match of source.matchAll(tablePattern)) {
    const table = match[1];
    const body = match[2];
    if (!table || !body) continue;
    const columns = new Set<string>();
    for (const column of body.matchAll(/\b(?:uuid|text|integer|boolean|jsonb|timestamp)\(['"]([^'"]+)['"]/g)) {
      if (column[1]) columns.add(column[1]);
    }
    tables.set(table, columns);
  }
  return tables;
}

function migratedColumns(source: string): Map<string, Set<string>> {
  const tables = new Map<string, Set<string>>();
  const add = (table: string, column: string) => {
    const columns = tables.get(table) ?? new Set<string>();
    columns.add(column);
    tables.set(table, columns);
  };
  for (const create of source.matchAll(/CREATE TABLE IF NOT EXISTS "([^"]+)"\s*\(([\s\S]*?)\);/g)) {
    const table = create[1];
    const body = create[2];
    if (!table || !body) continue;
    for (const column of body.matchAll(/^\s*"([^"]+)"\s+(?:uuid|text|integer|boolean|jsonb|timestamptz)\b/gm)) {
      if (column[1]) add(table, column[1]);
    }
  }
  for (const alter of source.matchAll(/ALTER TABLE "([^"]+)" ADD COLUMN IF NOT EXISTS "([^"]+)"/g)) {
    if (alter[1] && alter[2]) add(alter[1], alter[2]);
  }
  return tables;
}

describe('Drizzle migration contract', () => {
  it('provides every runtime schema column through ordered SQL migrations', async () => {
    const root = process.cwd();
    const schema = schemaColumns(await readFile(path.join(root, 'src/lib/db/schema.ts'), 'utf8'));
    const files = (await readdir(path.join(root, 'drizzle')))
      .filter((file) => /^\d+.*\.sql$/.test(file))
      .sort((a, b) => a.localeCompare(b));
    expect(files).toContain('0004_follow_up_claim_hardening.sql');
    const sql = (await Promise.all(files.map((file) => readFile(path.join(root, 'drizzle', file), 'utf8')))).join('\n');
    const migrated = migratedColumns(sql);

    const missing: string[] = [];
    for (const [table, columns] of schema) {
      for (const column of columns) {
        if (!migrated.get(table)?.has(column)) missing.push(`${table}.${column}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('uses statement boundaries in every migration', async () => {
    const files = (await readdir('drizzle')).filter((file) => /^\d+.*\.sql$/.test(file));
    for (const file of files) {
      const source = await readFile(path.join('drizzle', file), 'utf8');
      expect(source).toContain('--> statement-breakpoint');
    }
  });
});
