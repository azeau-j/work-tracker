import { TimeEntryRepository } from '@app/domain/ports/outbound/TimeEntryRepository.js';
import { TimeEntry } from '@app/domain/entities/TimeEntry.js';

export class StopTimer {
  constructor(private readonly timeEntryRepo: TimeEntryRepository) {}

  async execute(params: { comment?: string; endTime?: Date }): Promise<TimeEntry> {
    const entries = await this.timeEntryRepo.getEntries();
    const activeEntry = this.getActiveEntry(entries);

    if (!activeEntry) {
      throw new Error("Aucun chronomètre en cours n'a été trouvé.");
    }

    activeEntry.end = params.endTime ?? new Date();
    if (params.comment && params.comment.trim() !== '') {
      activeEntry.comment = params.comment;
    }

    await this.timeEntryRepo.updateEntries(entries);
    return activeEntry;
  }

  private getActiveEntry(entries: TimeEntry[]): TimeEntry | undefined {
    return entries.find(e => !e.end);
  }
}
