/**
 * Formats a duration in minutes into a display string.
 *
 * In standard mode (default), formats as hours and minutes (e.g. "1h 30m").
 * In decimal mode, formats as decimal hours rounded to up to 1 decimal place (e.g. "1.5h", "0h").
 *
 * @param minutes - Total duration in minutes.
 * @param isDecimal - Whether to output duration in decimal format.
 * @returns Formatted duration string.
 */
export function formatDuration(minutes: number, isDecimal: boolean = false): string {
  if (isDecimal) {
    const hours = Math.round((minutes / 60) * 10) / 10;
    return `${hours}h`;
  }

  const roundedMinutes = Math.round(minutes);
  const hours = Math.floor(roundedMinutes / 60);
  const mins = roundedMinutes % 60;
  return `${hours}h ${mins}m`;
}
