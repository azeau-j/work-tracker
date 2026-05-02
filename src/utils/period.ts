import dayjs, {Dayjs} from "dayjs";

export function getDateRange(period: string): { start: dayjs.Dayjs; end: dayjs.Dayjs; label: string } {
  let start: Dayjs
  let end: Dayjs
  let label: string

  if (period === 'today') {
    start = dayjs().startOf('day');
    end = dayjs().endOf('day');
    label = "Aujourd'hui";
  } else if (period === 'week') {
    start = dayjs().startOf('week');
    end = dayjs().endOf('week');
    label = "Cette semaine";
  } else if (period === 'month') {
    start = dayjs().startOf('month');
    end = dayjs().endOf('month');
    label = "Ce mois-ci";
  } else if (period === 'last-month') {
    start = dayjs().subtract(1, 'month').startOf('month');
    end = dayjs().subtract(1, 'month').endOf('month');
    label = "Le mois dernier";
  } else {
    throw new Error(`Période ${period} invalide.`);
  }

  return { start, end, label };
}