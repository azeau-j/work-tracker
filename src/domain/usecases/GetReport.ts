import dayjs from 'dayjs';
import { TimeEntryRepository } from '@app/domain/ports/outbound/TimeEntryRepository.js';
import { TimeEntry } from '@app/domain/entities/TimeEntry.js';

export interface DailyProjectDuration {
  project: string;
  minutes: number;
}

export interface DailyReport {
  date: string;
  projects: DailyProjectDuration[];
  totalMinutes: number;
}

export interface GetReportRequest {
  startDate: Date;
  endDate: Date;
  targetDayHours?: number;
  decimal?: boolean;
}

export interface GetReportResponse {
  totalMinutes: number;
  projectDurations: Map<string, number>;
  dailyReports: DailyReport[];
  filteredEntries: TimeEntry[];
}

export class GetReport {
  constructor(private readonly timeEntryRepo: TimeEntryRepository) {}

  async execute(request: GetReportRequest): Promise<GetReportResponse> {
    const entries = await this.timeEntryRepo.getEntries();
    const filteredEntries = this.filterEntriesByDateRange(entries, request.startDate, request.endDate);
    const dailyReports = this.buildDailyReports(filteredEntries, request.targetDayHours, request.decimal);
    const { projectDurations, totalMinutes } = this.calculateSummaryTotals(dailyReports);

    return {
      totalMinutes,
      projectDurations,
      dailyReports,
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

  private buildDailyReports(entries: TimeEntry[], targetDayHours?: number, decimal?: boolean): DailyReport[] {
    const rawAggregationByDay = new Map<string, Map<string, number>>();

    for (const entry of entries) {
      if (!entry.end) continue;
      const dayKey = dayjs(entry.start).format('YYYY-MM-DD');
      const duration = dayjs(entry.end).diff(dayjs(entry.start), 'minute');

      let dayMap = rawAggregationByDay.get(dayKey);
      if (!dayMap) {
        dayMap = new Map<string, number>();
        rawAggregationByDay.set(dayKey, dayMap);
      }
      dayMap.set(entry.project, (dayMap.get(entry.project) ?? 0) + duration);
    }

    const sortedDayKeys = Array.from(rawAggregationByDay.keys()).sort();
    const dailyReports: DailyReport[] = [];

    for (const dayKey of sortedDayKeys) {
      const dayProjectsMap = rawAggregationByDay.get(dayKey)!;
      let projectList: DailyProjectDuration[] = Array.from(dayProjectsMap.entries()).map(([project, minutes]) => ({
        project,
        minutes,
      }));

      const rawDayTotal = projectList.reduce((sum, item) => sum + item.minutes, 0);

      if (targetDayHours !== undefined && targetDayHours > 0 && rawDayTotal > 0) {
        projectList = this.extrapolateDayProjects(projectList, rawDayTotal, targetDayHours, decimal);
      }

      projectList.sort((a, b) => b.minutes - a.minutes);

      const dayTotalMinutes = projectList.reduce((sum, item) => sum + item.minutes, 0);
      dailyReports.push({
        date: dayKey,
        projects: projectList,
        totalMinutes: dayTotalMinutes,
      });
    }

    return dailyReports;
  }

  private extrapolateDayProjects(
    projects: DailyProjectDuration[],
    rawDayTotal: number,
    targetDayHours: number,
    decimal?: boolean
  ): DailyProjectDuration[] {
    const quantum = decimal ? 6 : 1;
    const targetMinutes = Math.round(targetDayHours * 60);
    const factor = targetMinutes / rawDayTotal;

    let assignedMinutes = 0;
    const extrapolatedProjects: DailyProjectDuration[] = [];

    for (const item of projects) {
      const extrapolated = Math.round((item.minutes * factor) / quantum) * quantum;
      extrapolatedProjects.push({
        project: item.project,
        minutes: extrapolated,
      });
      assignedMinutes += extrapolated;
    }

    const diff = targetMinutes - assignedMinutes;
    if (diff !== 0 && extrapolatedProjects.length > 0) {
      const projectWithMaxDuration = projects.reduce((max, curr) => (curr.minutes > max.minutes ? curr : max)).project;
      const targetItem = extrapolatedProjects.find(p => p.project === projectWithMaxDuration);
      if (targetItem) {
        targetItem.minutes += diff;
      }
    }

    return extrapolatedProjects;
  }

  private calculateSummaryTotals(dailyReports: DailyReport[]): {
    projectDurations: Map<string, number>;
    totalMinutes: number;
  } {
    const projectDurations = new Map<string, number>();
    let totalMinutes = 0;

    for (const day of dailyReports) {
      for (const { project, minutes } of day.projects) {
        projectDurations.set(project, (projectDurations.get(project) ?? 0) + minutes);
        totalMinutes += minutes;
      }
    }

    return { projectDurations, totalMinutes };
  }
}
