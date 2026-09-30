import { describe, it, expect, vi } from 'vitest';
import * as prompts from '@clack/prompts';
import { Command } from 'commander';
import { registerCommands, Dependencies } from './registerCommands.js';
import * as reportModule from './report.js';

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  log: {
    info: vi.fn(),
    step: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('registerCommands - report --decimal', () => {
  it('parses --decimal option and passes it to reportCommand', async () => {
    const reportSpy = vi.spyOn(reportModule, 'reportCommand').mockResolvedValue(undefined);

    const program = new Command();
    const mockDeps = {
      startTimer: {} as any,
      stopTimer: {} as any,
      getActiveTimer: {} as any,
      logTime: {} as any,
      getReport: {} as any,
      listProjects: {} as any,
      migrateData: {} as any,
      storageDir: '/tmp',
      storageType: 'fs',
    } as Dependencies;

    registerCommands(program, mockDeps);

    await program.parseAsync(['node', 'test', 'report', '--decimal']);

    expect(reportSpy).toHaveBeenCalledWith(
      mockDeps.getReport,
      expect.objectContaining({
        decimal: true,
        period: 'month',
      })
    );
  });
});
