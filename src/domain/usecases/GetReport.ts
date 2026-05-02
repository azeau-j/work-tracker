import dayjs from 'dayjs';
import { TimeEntryRepository } from '@app/domain/ports/outbound/TimeEntryRepository.js';
import { TimeEntry } from '@app/domain/entities/TimeEntry.js';

export interface GetReportRequest {
  startDate: Date;
  endDate: Date;
}

export interface GetReportResponse {
  totalMinutes: number;
  projectDurations: Map<string, number>;
  filteredEntries: TimeEntry[];
}

export class GetReport {
  constructor(private readonly timeEntryRepo: TimeEntryRepository) {}

  async execute(request: GetReportRequest): Promise<GetReportResponse> {
    const entries = await this.timeEntryRepo.getEntries();
    const filteredEntries = this.filterEntriesByDateRange(entries, request.startDate, request.endDate);
    const { projectDurations, totalMinutes } = this.aggregateDurationsByProject(filteredEntries);

    return {
      totalMinutes,
      projectDurations,
      filteredEntries,
    };
  }

  private filterEntriesByDateRange(entries: TimeEntry[], startDate: Date, endDate: Date): TimeEntry[] {
    return entries.filter((entry: TimeEntry) => {
      if (!entry.end) return false;
      const entryStart = dayjs(entry.start);
      return (entryStart.isAfter(startDate) || entryStart.isSame(startDate)) &&
             (entryStart.isBefore(endDate) || entryStart.isSame(endDate));
    });
  }

  private aggregateDurationsByProject(entries: TimeEntry[]): { projectDurations: Map<string, number>; totalMinutes: number } {
    const projectDurations = new Map<string, number>();
    let totalMinutes = 0;

    for (const entry of entries) {
      if (entry.end) {
        const duration = dayjs(entry.end).diff(dayjs(entry.start), 'minute');
        const current = projectDurations.get(entry.project) ?? 0;
        projectDurations.set(entry.project, current + duration);
        totalMinutes += duration;
      }
    }

    return { projectDurations, totalMinutes };
  }
}
