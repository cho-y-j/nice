import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { config } from '../config/index.js';
import * as schema from './schema/index.js';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

let db: ReturnType<typeof createDb>;

function createDb() {
  const dbPath = config.db.url;

  // Ensure data directory exists
  mkdirSync(dirname(dbPath), { recursive: true });

  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  return drizzle(sqlite, { schema });
}

export function getDb() {
  if (!db) {
    db = createDb();
  }
  return db;
}

export type AppDb = ReturnType<typeof getDb>;
