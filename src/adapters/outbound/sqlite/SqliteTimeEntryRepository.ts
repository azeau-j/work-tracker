// src/adapters/outbound/sqlite/SqliteTimeEntryRepository.ts
import { TimeEntryRepository } from '@app/domain/ports/outbound/TimeEntryRepository.js';
import { TimeEntry } from '@app/domain/entities/TimeEntry.js';
import { SqliteDatabase } from './SqliteDatabase.js';

export class SqliteTimeEntryRepository implements TimeEntryRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async addEntry(entry: TimeEntry): Promise<void> {
    const stmt = this.db.getConnection().prepare(`
      INSERT INTO time_entries (project, start, end, comment)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(
      entry.project,
      entry.start.toISOString(),
      entry.end ? entry.end.toISOString() : null,
      entry.comment ?? null
    );
  }

  async getEntries(): Promise<TimeEntry[]> {
    const stmt = this.db.getConnection().prepare('SELECT * FROM time_entries ORDER BY start ASC');
    const rows = stmt.all() as { id: number, project: string, start: string, end: string | null, comment: string | null }[];
    
    return rows.map(row => ({
      project: row.project,
      start: new Date(row.start),
      end: row.end ? new Date(row.end) : undefined,
      comment: row.comment ?? undefined
    }));
  }

  async updateEntries(entries: TimeEntry[]): Promise<void> {
    const conn = this.db.getConnection();
    
    const transaction = conn.transaction((newEntries: TimeEntry[]) => {
      // Delete all and insert new array to simulate previous behavior
      conn.prepare('DELETE FROM time_entries').run();
      
      const insertStmt = conn.prepare(`
        INSERT INTO time_entries (project, start, end, comment)
        VALUES (?, ?, ?, ?)
      `);
      
      for (const entry of newEntries) {
        insertStmt.run(
          entry.project,
          entry.start.toISOString(),
          entry.end ? entry.end.toISOString() : null,
          entry.comment ?? null
        );
      }
    });

    transaction(entries);
  }
}
