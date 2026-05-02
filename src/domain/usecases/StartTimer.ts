import { TimeEntryRepository } from '@app/domain/ports/outbound/TimeEntryRepository.js';
import { ProjectRepository } from '@app/domain/ports/outbound/ProjectRepository.js';
import { TimeEntry } from '@app/domain/entities/TimeEntry.js';

export class StartTimer {
  constructor(
    private readonly timeEntryRepo: TimeEntryRepository,
    private readonly projectRepo: ProjectRepository
  ) {}

  async execute(projectName: string): Promise<void> {
    const entries = await this.timeEntryRepo.getEntries();
    
    if (this.getActiveEntry(entries)) {
      throw new Error(`Un chronomètre est déjà en cours pour le projet "${this.getActiveEntry(entries)?.project}".`);
    }

    await this.projectRepo.addProject(projectName);
    await this.timeEntryRepo.addEntry({
      project: projectName,
      start: new Date()
    });
  }

  private getActiveEntry(entries: TimeEntry[]): TimeEntry | undefined {
    return entries.find(e => !e.end);
  }
}
