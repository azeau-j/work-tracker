// src/adapters/outbound/sqlite/SqliteProjectRepository.ts
import { ProjectRepository } from '@app/domain/ports/outbound/ProjectRepository.js';
import { SqliteDatabase } from './SqliteDatabase.js';

export class SqliteProjectRepository implements ProjectRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async getProjects(): Promise<string[]> {
    const stmt = this.db.getConnection().prepare('SELECT name FROM projects ORDER BY name ASC');
    const rows = stmt.all() as { name: string }[];
    return rows.map(row => row.name);
  }

  async addProject(project: string): Promise<void> {
    const stmt = this.db.getConnection().prepare('INSERT OR IGNORE INTO projects (name) VALUES (?)');
    stmt.run(project);
  }
}
