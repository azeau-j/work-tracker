import * as prompts from '@clack/prompts';
import { GetReport, DailyReport } from '@app/domain/usecases/GetReport.js';
import { getDateRange } from '@app/utils/period.js';
import { formatDuration } from './formatDuration.js';

interface ReportOptions {
  period: string;
  detail?: boolean;
  decimal?: boolean;
  targetDayHours?: string;
}

function renderProgressBar(minutes: number, totalMinutes: number): string {
  const percentage = totalMinutes > 0 ? minutes / totalMinutes : 0;
  const barLength = Math.round(percentage * 10);
  return '█'.repeat(barLength).padEnd(10, '░');
}

function displayDetailedReport(dailyReports: DailyReport[], isDecimal: boolean) {
  for (const day of dailyReports) {
    prompts.log.info(`📅 ${day.date}`);
    for (const { project, minutes } of day.projects) {
      const formatted = formatDuration(minutes, isDecimal);
      prompts.log.step(`  ${project.padEnd(20)} : ${formatted}`);
    }
  }
}

function displaySummaryReport(projectDurations: Map<string, number>, totalMinutes: number, isDecimal: boolean) {
  const sortedProjects = Array.from(projectDurations.entries()).sort((a, b) => b[1] - a[1]);

  for (const [project, minutes] of sortedProjects) {
    const formatted = formatDuration(minutes, isDecimal);
    const bar = renderProgressBar(minutes, totalMinutes);

    prompts.log.step(`${project.padEnd(20)} : ${bar} ${formatted}`);
  }
}

function getTargetDayHours(targetDayHours?: string): number | undefined {
  if (targetDayHours === undefined) {
    return undefined;
  }

  const parsed = parseFloat(targetDayHours);
  if (isNaN(parsed) || parsed <= 0) {
    prompts.log.error("La valeur de --target-day-hours doit être un nombre positif supérieur à 0.");
    process.exit(1);
  }
  return parsed;
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

  const targetDayHours = getTargetDayHours(options.targetDayHours);
  const isDecimal = Boolean(options.decimal);

  const result = await usecase.execute({
    startDate: start.toDate(),
    endDate: end.toDate(),
    targetDayHours,
    decimal: isDecimal,
  });

  if (result.totalMinutes === 0) {
    prompts.log.warn(`Aucune entrée trouvée pour la période : ${label}`);
    return;
  }

  prompts.log.info(`Rapport pour : ${label}`);
  if (targetDayHours !== undefined) {
    prompts.log.info(`ℹ Extrapolation appliquée sur une base de ${targetDayHours}h / jour travaillé`);
  }

  if (options.detail) {
    displayDetailedReport(result.dailyReports, isDecimal);
  } else {
    displaySummaryReport(result.projectDurations, result.totalMinutes, isDecimal);
  }

  prompts.outro(`Total temps travaillé : ${formatDuration(result.totalMinutes, isDecimal)}`);
}
