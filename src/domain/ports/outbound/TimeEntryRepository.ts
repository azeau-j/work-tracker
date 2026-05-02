import { TimeEntry } from '@app/domain/entities/TimeEntry.js';

export interface TimeEntryRepository {
  addEntry(entry: TimeEntry): Promise<void>;
  getEntries(): Promise<TimeEntry[]>;
  updateEntries(entries: TimeEntry[]): Promise<void>;
}
