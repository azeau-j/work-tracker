import { TimeEntryRepository } from '@app/domain/ports/outbound/TimeEntryRepository.js';
import { TimeEntry } from '@app/domain/entities/TimeEntry.js';

export class GetActiveTimer {
  constructor(private readonly timeEntryRepo: TimeEntryRepository) {}

  async execute(): Promise<TimeEntry | undefined> {
    const entries = await this.timeEntryRepo.getEntries();
    return entries.find(e => !e.end);
  }
}
