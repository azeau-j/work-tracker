import { describe, it, expect } from 'vitest';
import { formatDuration } from './formatDuration.js';

describe('formatDuration', () => {
  describe('Standard format (default or isDecimal=false)', () => {
    it('formats 0 minutes as "0h 0m"', () => {
      expect(formatDuration(0, false)).toBe('0h 0m');
      expect(formatDuration(0)).toBe('0h 0m');
    });

    it('formats minutes under an hour correctly', () => {
      expect(formatDuration(45, false)).toBe('0h 45m');
      expect(formatDuration(30)).toBe('0h 30m');
    });

    it('formats exact hours correctly', () => {
      expect(formatDuration(60, false)).toBe('1h 0m');
      expect(formatDuration(120)).toBe('2h 0m');
    });

    it('formats compound hours and minutes correctly', () => {
      expect(formatDuration(90, false)).toBe('1h 30m');
      expect(formatDuration(155)).toBe('2h 35m');
    });
  });

  describe('Decimal format (isDecimal=true)', () => {
    it('formats 0 minutes as "0h"', () => {
      expect(formatDuration(0, true)).toBe('0h');
    });

    it('formats 30 minutes as "0.5h"', () => {
      expect(formatDuration(30, true)).toBe('0.5h');
    });

    it('formats 45 minutes as "0.8h"', () => {
      expect(formatDuration(45, true)).toBe('0.8h');
    });

    it('formats 60 minutes as "1h"', () => {
      expect(formatDuration(60, true)).toBe('1h');
    });

    it('formats 90 minutes as "1.5h"', () => {
      expect(formatDuration(90, true)).toBe('1.5h');
    });

    it('formats recurring decimals rounded to 1 decimal place (20m -> 0.3h)', () => {
      expect(formatDuration(20, true)).toBe('0.3h');
    });

    it('formats 465 minutes (7h 45m) as "7.8h"', () => {
      expect(formatDuration(465, true)).toBe('7.8h');
    });

    it('handles floating point minutes gracefully by rounding', () => {
      expect(formatDuration(33.3333, true)).toBe('0.6h');
    });
  });
});
