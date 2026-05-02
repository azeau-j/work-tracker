import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StopTimer } from './StopTimer.js';
import { TimeEntryRepository } from '@app/domain/ports/outbound/TimeEntryRepository.js';

describe('StopTimer', () => {
  let timeEntryRepo: TimeEntryRepository;
  let useCase: StopTimer;

  beforeEach(() => {
    timeEntryRepo = {
      getEntries: vi.fn(),
      addEntry: vi.fn(),
      updateEntries: vi.fn(),
    };
    useCase = new StopTimer(timeEntryRepo);
  });

  it('should stop the active timer and update the entry', async () => {
    const start = new Date('2024-05-02T10:00:00Z');
    const end = new Date('2024-05-02T11:00:00Z');
    const activeEntry = { project: 'Project A', start };
    const entries = [activeEntry];
    
    vi.mocked(timeEntryRepo.getEntries).mockResolvedValue(entries);

    const result = await useCase.execute({ comment: 'Worked on feature X', endTime: end });

    expect(result.end).toEqual(end);
    expect(result.comment).toBe('Worked on feature X');
    expect(timeEntryRepo.updateEntries).toHaveBeenCalledWith(entries);
  });

  it('should throw error if no active timer found', async () => {
    vi.mocked(timeEntryRepo.getEntries).mockResolvedValue([{ project: 'A', start: new Date(), end: new Date() }]);
    await expect(useCase.execute({})).rejects.toThrow("Aucun chronomètre en cours n'a été trouvé.");
  });
});
