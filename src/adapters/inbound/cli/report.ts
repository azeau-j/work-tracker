import * as prompts from '@clack/prompts';
import dayjs from 'dayjs';
import { GetReport } from '@app/domain/usecases/GetReport.js';
import { TimeEntry } from '@app/domain/entities/TimeEntry.js';
import {getDateRange} from "@app/utils/period.js";

interface ReportOptions {
  period: string;
  detail?: boolean;
}

function renderProgressBar(minutes: number, totalMinutes: number): string {
  const percentage = totalMinutes > 0 ? (minutes / totalMinutes) : 0;
  const barLength = Math.round(percentage * 10);
  return '█'.repeat(barLength).padEnd(10, '░');
}

function aggregateEntriesByDay(entries: TimeEntry[]): Record<string, Record<string, number>> {
  const aggregationByDay: Record<string, Record<string, number>> = {};
  
  for (const entry of entries) {
    if (entry.end === undefined) {
      continue;
    }
    const duration = dayjs(entry.end).diff(dayjs(entry.start), 'minute');
    
    const dayKey = dayjs(entry.start).format('YYYY-MM-DD');
    if (!aggregationByDay[dayKey]) {
      aggregationByDay[dayKey] = {};
    }
    aggregationByDay[dayKey][entry.project] = (aggregationByDay[dayKey][entry.project] ?? 0) + duration;
  }

  return aggregationByDay;
}

function displayDetailedReport(entries: TimeEntry[]) {
  const aggregationByDay = aggregateEntriesByDay(entries);
  const sortedDays = Object.keys(aggregationByDay).sort();
  
  for (const day of sortedDays) {
    prompts.log.info(`📅 ${day}`);
    const projects = aggregationByDay[day];
    const sortedProjects = Object.entries(projects).sort((a, b) => b[1] - a[1]);
    
    for (const [project, minutes] of sortedProjects) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      prompts.log.step(`  ${project.padEnd(20)} : ${hours}h ${mins}m`);
    }
  }
}

function displaySummaryReport(projectDurations: Map<string, number>, totalMinutes: number) {
  const sortedProjects = Array.from(projectDurations.entries()).sort((a, b) => b[1] - a[1]);

  for (const [project, minutes] of sortedProjects) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const bar = renderProgressBar(minutes, totalMinutes);
    
    prompts.log.step(`${project.padEnd(20)} : ${bar} ${hours}h ${mins}m`);
  }
}

export async function reportCommand(usecase: GetReport, options: ReportOptions) {
  let dateRange;
  try {
    dateRange = getDateRange(options.period);
  } catch (error: any) {
    prompts.log.error(error.message);
    process.exit(1);
  }
  const { start, end, label } = dateRange;

  const result = await usecase.execute({
    startDate: start.toDate(),
    endDate: end.toDate(),
  });

  if (result.totalMinutes === 0) {
    prompts.log.warn(`Aucune entrée trouvée pour la période : ${label}`);
    return;
  }

  prompts.log.info(`Rapport pour : ${label}`);

  if (options.detail) {
    displayDetailedReport(result.filteredEntries);
  } else {
    displaySummaryReport(result.projectDurations, result.totalMinutes);
  }

  const totalHours = Math.floor(result.totalMinutes / 60);
  const totalMins = result.totalMinutes % 60;
  
  prompts.outro(`Total temps travaillé : ${totalHours}h ${totalMins}m`);
}

