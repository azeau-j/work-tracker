// src/adapters/outbound/sqlite/SqliteDatabase.ts
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

export class SqliteDatabase {
  private db: Database.Database;

  constructor(dbPath: string) {
    if (dbPath !== ':memory:') {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    
    this.db = new Database(dbPath);
    this.initializeTables();
  }

  private initializeTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        name TEXT PRIMARY KEY
      );
      
      CREATE TABLE IF NOT EXISTS time_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project TEXT NOT NULL,
        start TEXT NOT NULL,
        end TEXT,
        comment TEXT,
        FOREIGN KEY (project) REFERENCES projects(name)
      );
    `);
  }

  public getConnection(): Database.Database {
    return this.db;
  }

  public close(): void {
    this.db.close();
  }
}
