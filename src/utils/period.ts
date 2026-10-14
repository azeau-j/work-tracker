import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek.js";

dayjs.extend(isoWeek);

export function getDateRange(period: string, count: number = 1): { start: dayjs.Dayjs; end: dayjs.Dayjs; label: string } {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("Le nombre de périodes doit être un entier supérieur ou égal à 1.");
  }

  let start: Dayjs;
  let end: Dayjs;
  let label: string;

  if (period === 'today') {
    start = dayjs().subtract(count - 1, 'day').startOf('day');
    end = dayjs().endOf('day');
    label = count === 1 ? "Aujourd'hui" : `Les ${count} derniers jours`;
  } else if (period === 'yesterday') {
    start = dayjs().subtract(count, 'day').startOf('day');
    end = dayjs().subtract(1, 'day').endOf('day');
    label = count === 1 ? "Hier" : `Les ${count} jours précédents`;
  } else if (period === 'week') {
    start = dayjs().subtract(count - 1, 'week').startOf('isoWeek');
    end = dayjs().endOf('isoWeek');
    label = count === 1 ? "Cette semaine" : `Les ${count} dernières semaines`;
  } else if (period === 'last-week') {
    start = dayjs().subtract(count, 'week').startOf('isoWeek');
    end = dayjs().subtract(1, 'week').endOf('isoWeek');
    label = count === 1 ? "La semaine dernière" : `Les ${count} semaines précédentes`;
  } else if (period === 'month') {
    start = dayjs().subtract(count - 1, 'month').startOf('month');
    end = dayjs().endOf('month');
    label = count === 1 ? "Ce mois-ci" : `Les ${count} derniers mois`;
  } else if (period === 'last-month') {
    start = dayjs().subtract(count, 'month').startOf('month');
    end = dayjs().subtract(1, 'month').endOf('month');
    label = count === 1 ? "Le mois dernier" : `Les ${count} mois précédents`;
  } else {
    throw new Error(`Période ${period} invalide.`);
  }

  return { start, end, label };
}
