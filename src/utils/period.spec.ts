import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import { getDateRange } from './period.js';

dayjs.extend(isoWeek);

describe('getDateRange', () => {
  it('returns today date range with count=1', () => {
    const { start, end, label } = getDateRange('today');

    expect(label).toBe("Aujourd'hui");
    expect(start.format('YYYY-MM-DD HH:mm:ss')).toBe(dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss'));
    expect(end.format('YYYY-MM-DD HH:mm:ss')).toBe(dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss'));
  });

  it('returns today date range spanning multiple days with count > 1', () => {
    const { start, end, label } = getDateRange('today', 3);

    expect(label).toBe('Les 3 derniers jours');
    expect(start.format('YYYY-MM-DD HH:mm:ss')).toBe(dayjs().subtract(2, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss'));
    expect(end.format('YYYY-MM-DD HH:mm:ss')).toBe(dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss'));
  });

  it('returns yesterday date range with count=1', () => {
    const { start, end, label } = getDateRange('yesterday');

    expect(label).toBe('Hier');
    expect(start.format('YYYY-MM-DD HH:mm:ss')).toBe(dayjs().subtract(1, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss'));
    expect(end.format('YYYY-MM-DD HH:mm:ss')).toBe(dayjs().subtract(1, 'day').endOf('day').format('YYYY-MM-DD HH:mm:ss'));
  });

  it('returns yesterday date range spanning multiple days with count > 1', () => {
    const { start, end, label } = getDateRange('yesterday', 3);

    expect(label).toBe('Les 3 jours précédents');
    expect(start.format('YYYY-MM-DD HH:mm:ss')).toBe(dayjs().subtract(3, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss'));
    expect(end.format('YYYY-MM-DD HH:mm:ss')).toBe(dayjs().subtract(1, 'day').endOf('day').format('YYYY-MM-DD HH:mm:ss'));
  });

  it('returns current week starting on Monday and ending on Sunday (ISO) with count=1', () => {
    const { start, end, label } = getDateRange('week');

    expect(label).toBe('Cette semaine');
    expect(start.isoWeekday()).toBe(1); // Monday
    expect(end.isoWeekday()).toBe(7); // Sunday
    expect(start.format('YYYY-MM-DD HH:mm:ss')).toBe(dayjs().startOf('isoWeek').format('YYYY-MM-DD HH:mm:ss'));
    expect(end.format('YYYY-MM-DD HH:mm:ss')).toBe(dayjs().endOf('isoWeek').format('YYYY-MM-DD HH:mm:ss'));
  });

  it('returns multiple weeks up to current week with count > 1', () => {
    const { start, end, label } = getDateRange('week', 2);

    expect(label).toBe('Les 2 dernières semaines');
    expect(start.isoWeekday()).toBe(1); // Monday
    expect(end.isoWeekday()).toBe(7); // Sunday
    expect(start.format('YYYY-MM-DD HH:mm:ss')).toBe(dayjs().subtract(1, 'week').startOf('isoWeek').format('YYYY-MM-DD HH:mm:ss'));
    expect(end.format('YYYY-MM-DD HH:mm:ss')).toBe(dayjs().endOf('isoWeek').format('YYYY-MM-DD HH:mm:ss'));
  });

  it('returns last week (Monday to Sunday) with count=1', () => {
    const { start, end, label } = getDateRange('last-week');

    expect(label).toBe('La semaine dernière');
    expect(start.isoWeekday()).toBe(1);
    expect(end.isoWeekday()).toBe(7);
    expect(start.format('YYYY-MM-DD HH:mm:ss')).toBe(dayjs().subtract(1, 'week').startOf('isoWeek').format('YYYY-MM-DD HH:mm:ss'));
    expect(end.format('YYYY-MM-DD HH:mm:ss')).toBe(dayjs().subtract(1, 'week').endOf('isoWeek').format('YYYY-MM-DD HH:mm:ss'));
  });

  it('returns multiple weeks prior to current week with last-week and count > 1', () => {
    const { start, end, label } = getDateRange('last-week', 2);

    expect(label).toBe('Les 2 semaines précédentes');
    expect(start.isoWeekday()).toBe(1);
    expect(end.isoWeekday()).toBe(7);
    expect(start.format('YYYY-MM-DD HH:mm:ss')).toBe(dayjs().subtract(2, 'week').startOf('isoWeek').format('YYYY-MM-DD HH:mm:ss'));
    expect(end.format('YYYY-MM-DD HH:mm:ss')).toBe(dayjs().subtract(1, 'week').endOf('isoWeek').format('YYYY-MM-DD HH:mm:ss'));
  });

  it('returns current month with count=1', () => {
    const { start, end, label } = getDateRange('month');

    expect(label).toBe('Ce mois-ci');
    expect(start.format('YYYY-MM-DD HH:mm:ss')).toBe(dayjs().startOf('month').format('YYYY-MM-DD HH:mm:ss'));
    expect(end.format('YYYY-MM-DD HH:mm:ss')).toBe(dayjs().endOf('month').format('YYYY-MM-DD HH:mm:ss'));
  });

  it('returns multiple months up to current month with count > 1', () => {
    const { start, end, label } = getDateRange('month', 3);

    expect(label).toBe('Les 3 derniers mois');
    expect(start.format('YYYY-MM-DD HH:mm:ss')).toBe(dayjs().subtract(2, 'month').startOf('month').format('YYYY-MM-DD HH:mm:ss'));
    expect(end.format('YYYY-MM-DD HH:mm:ss')).toBe(dayjs().endOf('month').format('YYYY-MM-DD HH:mm:ss'));
  });

  it('returns last month with count=1', () => {
    const { start, end, label } = getDateRange('last-month');

    expect(label).toBe('Le mois dernier');
    expect(start.format('YYYY-MM-DD HH:mm:ss')).toBe(dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD HH:mm:ss'));
    expect(end.format('YYYY-MM-DD HH:mm:ss')).toBe(dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD HH:mm:ss'));
  });

  it('returns multiple months prior to current month with last-month and count > 1', () => {
    const { start, end, label } = getDateRange('last-month', 2);

    expect(label).toBe('Les 2 mois précédents');
    expect(start.format('YYYY-MM-DD HH:mm:ss')).toBe(dayjs().subtract(2, 'month').startOf('month').format('YYYY-MM-DD HH:mm:ss'));
    expect(end.format('YYYY-MM-DD HH:mm:ss')).toBe(dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD HH:mm:ss'));
  });

  it('throws an error for invalid period', () => {
    expect(() => getDateRange('unknown-period')).toThrow('Période unknown-period invalide.');
  });

  it('throws an error for non-integer or < 1 count', () => {
    expect(() => getDateRange('week', 0)).toThrow('Le nombre de périodes doit être un entier supérieur ou égal à 1.');
    expect(() => getDateRange('week', -1)).toThrow('Le nombre de périodes doit être un entier supérieur ou égal à 1.');
    expect(() => getDateRange('week', 1.5)).toThrow('Le nombre de périodes doit être un entier supérieur ou égal à 1.');
    expect(() => getDateRange('week', NaN)).toThrow('Le nombre de périodes doit être un entier supérieur ou égal à 1.');
  });
});
