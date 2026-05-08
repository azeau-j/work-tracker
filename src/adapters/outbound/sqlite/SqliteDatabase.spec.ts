// src/adapters/outbound/sqlite/SqliteDatabase.spec.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SqliteDatabase } from './SqliteDatabase.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('SqliteDatabase', () => {
  const dbPath = path.join(__dirname, 'test.db');
  let db: SqliteDatabase;

  beforeEach(async () => {
    db = new SqliteDatabase(dbPath);
  });

  afterEach(async () => {
    db.close();
    try {
      await fs.unlink(dbPath);
    } catch (e) {}
  });

  it('should create tables if they do not exist', () => {
    const conn = db.getConnection();
    const tables = conn.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as {name: string}[];
    const tableNames = tables.map(t => t.name);
    expect(tableNames).toContain('projects');
    expect(tableNames).toContain('time_entries');
  });
});
