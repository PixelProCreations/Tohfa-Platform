import { describe, expect, it } from 'vitest';
import {
  formatIstDate,
  formatIstDateTime,
  istDateString,
  istDayEndUtc,
  istDayStartUtc,
} from '../utils/datetime';

describe('IST (fixed +05:30) helpers', () => {
  it('converts a UTC instant to the IST calendar date across the midnight boundary', () => {
    expect(istDateString('2026-10-12T18:29:59Z')).toBe('2026-10-12');
    expect(istDateString('2026-10-12T18:30:00Z')).toBe('2026-10-13');
  });

  it('formats date and date-time without depending on the device timezone', () => {
    expect(formatIstDate('2026-08-18T06:30:00Z')).toBe('18/08/2026');
    expect(formatIstDateTime('2026-08-18T06:30:00Z')).toBe('18/08/2026 12:00');
  });

  it('returns null for unparseable input instead of "Invalid Date"', () => {
    expect(istDateString('nope')).toBeNull();
    expect(formatIstDateTime('')).toBeNull();
  });

  it('gives the UTC instants bounding an IST calendar day (for from/to filters)', () => {
    expect(istDayStartUtc('2026-10-13')).toBe('2026-10-12T18:30:00.000Z');
    expect(istDayEndUtc('2026-10-13')).toBe('2026-10-13T18:29:59.999Z');
    expect(istDayStartUtc('2026-13-40')).toBeNull();
  });
});
