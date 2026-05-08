// src/adapters/outbound/sqlite/SqliteProjectRepository.spec.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SqliteDatabase } from './SqliteDatabase.js';
import { SqliteProjectRepository } from './SqliteProjectRepository.js';

describe('SqliteProjectRepository', () => {
  let db: SqliteDatabase;
  let repo: SqliteProjectRepository;

  beforeEach(() => {
    db = new SqliteDatabase(':memory:');
    repo = new SqliteProjectRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  it('should add and retrieve projects', async () => {
    await repo.addProject('Project A');
    await repo.addProject('Project B');
    await repo.addProject('Project A'); // duplicate should be ignored

    const projects = await repo.getProjects();
    expect(projects).toEqual(['Project A', 'Project B']);
  });
});
