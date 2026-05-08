import { describe, it, expect, beforeEach } from 'vitest';
import { GetActiveTimer } from './GetActiveTimer.js';
import { TimeEntryRepository } from '@app/domain/ports/outbound/TimeEntryRepository.js';
import { TimeEntry } from '@app/domain/entities/TimeEntry.js';

class MockTimeEntryRepository implements TimeEntryRepository {
  private entries: TimeEntry[] = [];
  async addEntry(entry: TimeEntry): Promise<void> { this.entries.push(entry); }
  async getEntries(): Promise<TimeEntry[]> { return this.entries; }
  async updateEntries(entries: TimeEntry[]): Promise<void> { this.entries = entries; }
}

describe('GetActiveTimer', () => {
  let repo: MockTimeEntryRepository;
  let usecase: GetActiveTimer;

  beforeEach(() => {
    repo = new MockTimeEntryRepository();
    usecase = new GetActiveTimer(repo);
  });

  it('should return undefined if no timer is active', async () => {
    const result = await usecase.execute();
    expect(result).toBeUndefined();
  });

  it('should return the active timer', async () => {
    await repo.addEntry({ project: 'ProjetA', start: new Date('2026-05-08T10:00:00Z') });
    const result = await usecase.execute();
    expect(result).toBeDefined();
    expect(result?.project).toBe('ProjetA');
  });
});
