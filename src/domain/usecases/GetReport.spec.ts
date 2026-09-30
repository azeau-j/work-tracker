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

    expect(result.dailyReports).toHaveLength(1);
    expect(result.dailyReports[0]).toEqual({
      date: '2024-05-01',
      totalMinutes: 150,
      projects: [
        { project: 'P1', minutes: 90 },
        { project: 'P2', minutes: 60 },
      ],
    });
  });

  it('should extrapolate durations proportionally per day when targetDayHours is provided', async () => {
    const startRange = new Date('2024-05-01T00:00:00Z');
    const endRange = new Date('2024-05-02T23:59:59Z');

    const entries = [
      // 2024-05-01: Total 4h (240m) -> should extrapolate to 8h (480m)
      { project: 'P1', start: new Date('2024-05-01T09:00:00Z'), end: new Date('2024-05-01T11:00:00Z') }, // 2h (120m)
      { project: 'P2', start: new Date('2024-05-01T11:00:00Z'), end: new Date('2024-05-01T13:00:00Z') }, // 2h (120m)
      // 2024-05-02: Total 10h (600m) -> should scale down to 8h (480m)
      { project: 'P1', start: new Date('2024-05-02T08:00:00Z'), end: new Date('2024-05-02T14:00:00Z') }, // 6h (360m) -> 60% of 480m = 288m
      { project: 'P2', start: new Date('2024-05-02T14:00:00Z'), end: new Date('2024-05-02T18:00:00Z') }, // 4h (240m) -> 40% of 480m = 192m
    ];

    vi.mocked(timeEntryRepo.getEntries).mockResolvedValue(entries);

    const result = await useCase.execute({
      startDate: startRange,
      endDate: endRange,
      targetDayHours: 8,
    });

    // 2 days * 8h = 16h = 960m
    expect(result.totalMinutes).toBe(960);
    expect(result.projectDurations.get('P1')).toBe(528); // 240 + 288
    expect(result.projectDurations.get('P2')).toBe(432); // 240 + 192

    expect(result.dailyReports).toHaveLength(2);
    expect(result.dailyReports[0]).toEqual({
      date: '2024-05-01',
      totalMinutes: 480,
      projects: [
        { project: 'P1', minutes: 240 },
        { project: 'P2', minutes: 240 },
      ],
    });
    expect(result.dailyReports[1]).toEqual({
      date: '2024-05-02',
      totalMinutes: 480,
      projects: [
        { project: 'P1', minutes: 288 },
        { project: 'P2', minutes: 192 },
      ],
    });
  });

  it('should adjust rounding discrepancies so daily total equals targetMinutes exactly', async () => {
    const startRange = new Date('2024-05-01T00:00:00Z');
    const endRange = new Date('2024-05-01T23:59:59Z');

    // 7 projects of 1h = 7h total (420m). Target = 8h (480m).
    // 480 / 7 = 68.5714m per project.
    const entries = [
      { project: 'P1', start: new Date('2024-05-01T08:00:00Z'), end: new Date('2024-05-01T09:00:00Z') },
      { project: 'P2', start: new Date('2024-05-01T09:00:00Z'), end: new Date('2024-05-01T10:00:00Z') },
      { project: 'P3', start: new Date('2024-05-01T10:00:00Z'), end: new Date('2024-05-01T11:00:00Z') },
      { project: 'P4', start: new Date('2024-05-01T11:00:00Z'), end: new Date('2024-05-01T12:00:00Z') },
      { project: 'P5', start: new Date('2024-05-01T12:00:00Z'), end: new Date('2024-05-01T13:00:00Z') },
      { project: 'P6', start: new Date('2024-05-01T13:00:00Z'), end: new Date('2024-05-01T14:00:00Z') },
      { project: 'P7', start: new Date('2024-05-01T14:00:00Z'), end: new Date('2024-05-01T15:00:00Z') },
    ];

    vi.mocked(timeEntryRepo.getEntries).mockResolvedValue(entries);

    const result = await useCase.execute({
      startDate: startRange,
      endDate: endRange,
      targetDayHours: 8,
    });

    expect(result.dailyReports[0].totalMinutes).toBe(480);
    expect(result.totalMinutes).toBe(480);
  });
});
