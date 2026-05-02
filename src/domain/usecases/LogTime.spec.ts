import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogTime } from './LogTime.js';
import { TimeEntryRepository } from '@app/domain/ports/outbound/TimeEntryRepository.js';
import { ProjectRepository } from '@app/domain/ports/outbound/ProjectRepository.js';
import dayjs from 'dayjs';

describe('LogTime', () => {
  let timeEntryRepo: TimeEntryRepository;
  let projectRepo: ProjectRepository;
  let useCase: LogTime;

  beforeEach(() => {
    timeEntryRepo = {
      getEntries: vi.fn(),
      addEntry: vi.fn(),
      updateEntries: vi.fn(),
    };
    projectRepo = {
      getProjects: vi.fn(),
      addProject: vi.fn(),
    };
    useCase = new LogTime(timeEntryRepo, projectRepo);
  });

  it('should add project and time entry with calculated start time', async () => {
    const endTime = new Date('2024-05-02T12:00:00Z');
    const durationMinutes = 90; // 1h30
    const expectedStart = dayjs(endTime).subtract(90, 'minute').toDate();

    await useCase.execute({
      project: 'New Project',
      durationMinutes,
      comment: 'Manual entry',
      endTime
    });

    expect(projectRepo.addProject).toHaveBeenCalledWith('New Project');
    expect(timeEntryRepo.addEntry).toHaveBeenCalledWith({
      project: 'New Project',
      start: expectedStart,
      end: endTime,
      comment: 'Manual entry'
    });
  });
});
