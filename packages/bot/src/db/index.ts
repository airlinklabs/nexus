import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { join, dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { env } from '../env.js';
import * as schema from './schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DB_PATH = env.DATABASE_PATH ?? join(__dirname, '../../../nexus.db');
const DB_DIR = dirname(DB_PATH);

mkdirSync(DB_DIR, { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

export function runMigrations(): void {
  const migrationsFolder = join(__dirname, '../../drizzle');
  migrate(db, { migrationsFolder });
}
