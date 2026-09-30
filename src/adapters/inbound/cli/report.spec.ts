import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as prompts from '@clack/prompts';
import { reportCommand } from './report.js';
import { GetReport, GetReportResponse } from '@app/domain/usecases/GetReport.js';

vi.mock('@clack/prompts', () => ({
  log: {
    info: vi.fn(),
    step: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  outro: vi.fn(),
}));

describe('reportCommand', () => {
  let mockGetReport: GetReport;
  let mockResult: GetReportResponse;

  beforeEach(() => {
    vi.clearAllMocks();

    mockResult = {
      projectDurations: new Map([
        ['Project A', 90],
        ['Project B', 45],
      ]),
      dailyReports: [
        {
          date: '2026-03-30',
          projects: [
            { project: 'Project A', minutes: 90 },
            { project: 'Project B', minutes: 45 },
          ],
          totalMinutes: 135,
        },
      ],
      totalMinutes: 135,
      filteredEntries: [],
    };

    mockGetReport = {
      execute: vi.fn().mockResolvedValue(mockResult),
    } as unknown as GetReport;
  });

  it('formats durations in standard format (Xh Ym) by default in summary view', async () => {
    await reportCommand(mockGetReport, { period: 'today' });

    expect(prompts.log.step).toHaveBeenCalledWith(
      expect.stringMatching(/Project A\s*:\s*[█░]+\s*1h 30m/)
    );
    expect(prompts.log.step).toHaveBeenCalledWith(
      expect.stringMatching(/Project B\s*:\s*[█░]+\s*0h 45m/)
    );
    expect(prompts.outro).toHaveBeenCalledWith('Total temps travaillé : 2h 15m');
  });

  it('formats durations in decimal format when decimal option is true in summary view', async () => {
    await reportCommand(mockGetReport, { period: 'today', decimal: true });

    expect(prompts.log.step).toHaveBeenCalledWith(
      expect.stringMatching(/Project A\s*:\s*[█░]+\s*1.5h/)
    );
    expect(prompts.log.step).toHaveBeenCalledWith(
      expect.stringMatching(/Project B\s*:\s*[█░]+\s*0.8h/)
    );
    expect(prompts.outro).toHaveBeenCalledWith('Total temps travaillé : 2.3h');
  });

  it('formats durations in decimal format when decimal option is true in detail view', async () => {
    await reportCommand(mockGetReport, { period: 'today', detail: true, decimal: true });

    expect(prompts.log.step).toHaveBeenCalledWith('  Project A            : 1.5h');
    expect(prompts.log.step).toHaveBeenCalledWith('  Project B            : 0.8h');
    expect(prompts.outro).toHaveBeenCalledWith('Total temps travaillé : 2.3h');
  });

  it('formats durations in standard format by default in detail view', async () => {
    await reportCommand(mockGetReport, { period: 'today', detail: true });

    expect(prompts.log.step).toHaveBeenCalledWith('  Project A            : 1h 30m');
    expect(prompts.log.step).toHaveBeenCalledWith('  Project B            : 0h 45m');
    expect(prompts.outro).toHaveBeenCalledWith('Total temps travaillé : 2h 15m');
  });

  it('works alongside targetDayHours extrapolation in decimal mode', async () => {
    await reportCommand(mockGetReport, {
      period: 'today',
      targetDayHours: '8',
      decimal: true,
    });

    expect(mockGetReport.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        targetDayHours: 8,
      })
    );
    expect(prompts.log.info).toHaveBeenCalledWith(
      'ℹ Extrapolation appliquée sur une base de 8h / jour travaillé'
    );
    expect(prompts.outro).toHaveBeenCalledWith('Total temps travaillé : 2.3h');
  });
});
