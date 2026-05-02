import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StartTimer } from './StartTimer.js';
import { TimeEntryRepository } from '@app/domain/ports/outbound/TimeEntryRepository.js';
import { ProjectRepository } from '@app/domain/ports/outbound/ProjectRepository.js';

describe('StartTimer', () => {
  let startTimer: StartTimer;
  let timeEntryRepo: TimeEntryRepository;
  let projectRepo: ProjectRepository;

  beforeEach(() => {
    timeEntryRepo = {
      getEntries: vi.fn().mockResolvedValue([]),
      addEntry: vi.fn().mockResolvedValue(undefined),
      updateEntries: vi.fn(),
    } as unknown as TimeEntryRepository;

    projectRepo = {
      addProject: vi.fn().mockResolvedValue(undefined),
      getProjects: vi.fn(),
    } as unknown as ProjectRepository;

    startTimer = new StartTimer(timeEntryRepo, projectRepo);
  });

  it('should start a timer successfully when no timer is active', async () => {
    const projectName = 'Project A';

    await startTimer.execute(projectName);

    expect(projectRepo.addProject).toHaveBeenCalledWith(projectName);
    expect(timeEntryRepo.addEntry).toHaveBeenCalledWith(expect.objectContaining({
      project: projectName,
      start: expect.any(Date)
    }));
  });

  it('should throw an error if a timer is already active', async () => {
    vi.mocked(timeEntryRepo.getEntries).mockResolvedValue([
      { project: 'Existing Project', start: new Date() } // No end date = active
    ]);

    await expect(startTimer.execute('New Project'))
      .rejects.toThrow('Un chronomètre est déjà en cours pour le projet "Existing Project".');
  });
});
