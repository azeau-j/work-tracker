// src/adapters/outbound/sqlite/SqliteTimeEntryRepository.spec.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SqliteDatabase } from './SqliteDatabase.js';
import { SqliteTimeEntryRepository } from './SqliteTimeEntryRepository.js';
import { SqliteProjectRepository } from './SqliteProjectRepository.js';
import { TimeEntry } from '@app/domain/entities/TimeEntry.js';

describe('SqliteTimeEntryRepository', () => {
  let db: SqliteDatabase;
  let repo: SqliteTimeEntryRepository;
  let projectRepo: SqliteProjectRepository;

  beforeEach(async () => {
    db = new SqliteDatabase(':memory:');
    repo = new SqliteTimeEntryRepository(db);
    projectRepo = new SqliteProjectRepository(db);
    await projectRepo.addProject('TestProject');
  });

  afterEach(() => {
    db.close();
  });

  it('should add and retrieve entries', async () => {
    const entry: TimeEntry = {
      project: 'TestProject',
      start: new Date('2026-05-08T10:00:00.000Z'),
      end: new Date('2026-05-08T12:00:00.000Z'),
      comment: 'Testing SQLite',
    };

    await repo.addEntry(entry);
    
    const entries = await repo.getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].project).toBe('TestProject');
    expect(entries[0].start.toISOString()).toBe('2026-05-08T10:00:00.000Z');
    expect(entries[0].end?.toISOString()).toBe('2026-05-08T12:00:00.000Z');
    expect(entries[0].comment).toBe('Testing SQLite');
  });

  it('should update all entries', async () => {
    const entry1: TimeEntry = {
      project: 'TestProject',
      start: new Date('2026-05-08T10:00:00.000Z'),
    };
    await repo.addEntry(entry1);

    const updatedEntry: TimeEntry = {
      project: 'TestProject',
      start: new Date('2026-05-08T10:00:00.000Z'),
      end: new Date('2026-05-08T11:00:00.000Z'),
      comment: 'Updated',
    };

    await repo.updateEntries([updatedEntry]);

    const entries = await repo.getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].end?.toISOString()).toBe('2026-05-08T11:00:00.000Z');
    expect(entries[0].comment).toBe('Updated');
  });
});
