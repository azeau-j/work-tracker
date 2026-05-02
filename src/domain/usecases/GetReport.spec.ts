import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetReport } from './GetReport.js';
import { TimeEntryRepository } from '@app/domain/ports/outbound/TimeEntryRepository.js';

describe('GetReport', () => {
  let timeEntryRepo: TimeEntryRepository;
  let useCase: GetReport;

  beforeEach(() => {
    timeEntryRepo = {
      getEntries: vi.fn(),
      addEntry: vi.fn(),
      updateEntries: vi.fn(),
    };
    useCase = new GetReport(timeEntryRepo);
  });

  it('should aggregate durations by project for a given period', async () => {
    const startRange = new Date('2024-05-01T00:00:00Z');
    const endRange = new Date('2024-05-01T23:59:59Z');

    const entries = [
      { project: 'P1', start: new Date('2024-05-01T10:00:00Z'), end: new Date('2024-05-01T10:30:00Z') }, // 30m
      { project: 'P1', start: new Date('2024-05-01T11:00:00Z'), end: new Date('2024-05-01T12:00:00Z') }, // 60m
      { project: 'P2', start: new Date('2024-05-01T14:00:00Z'), end: new Date('2024-05-01T15:00:00Z') }, // 60m
      { project: 'P1', start: new Date('2024-05-02T10:00:00Z'), end: new Date('2024-05-02T11:00:00Z') }, // Out of range
      { project: 'P3', start: new Date('2024-05-01T09:00:00Z') }, // Active, should be ignored
    ];

    vi.mocked(timeEntryRepo.getEntries).mockResolvedValue(entries);

    const result = await useCase.execute({ startDate: startRange, endDate: endRange });

    expect(result.totalMinutes).toBe(150);
    expect(result.projectDurations.get('P1')).toBe(90);
    expect(result.projectDurations.get('P2')).toBe(60);
    expect(result.projectDurations.has('P3')).toBe(false);
    expect(result.filteredEntries).toHaveLength(3);
    expect(result.filteredEntries.map(e => e.project)).toEqual(['P1', 'P1', 'P2']);
  });
});
