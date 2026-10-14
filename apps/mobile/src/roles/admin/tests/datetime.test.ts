/**
 * Admin date/time display in IST, matching the warehouse fixtures
 * ("25 Sep 2026 · 10:30 AM", "Today · 08:05 AM", "Yesterday · 04:20 PM",
 * "10 minutes ago", "2 days ago"). `now` is always passed in, so every
 * expectation here is fixed and the tests never depend on the machine clock or
 * its time zone.
 */
import { describe, expect, it } from 'vitest';
import { formatAdminDate, formatAdminDay, relativeTime } from '../utils/datetime';

// 25 Sep 2026, 12:00 PM IST.
const NOW = new Date('2026-09-25T06:30:00Z');

describe('formatAdminDate', () => {
  it('shows an earlier day as "25 Sep 2026 · 10:30 AM" style, in IST', () => {
    expect(formatAdminDate('2026-09-20T05:00:00Z', NOW)).toBe('20 Sep 2026 · 10:30 AM');
  });

  it('converts UTC to IST across the date line (+05:30)', () => {
    // 22 Sep 20:00 UTC is 23 Sep 01:30 IST.
    expect(formatAdminDate('2026-09-22T20:00:00Z', NOW)).toBe('23 Sep 2026 · 01:30 AM');
  });

  it('accepts an ISO string that carries its own offset', () => {
    expect(formatAdminDate('2026-09-20T10:30:00+05:30', NOW)).toBe('20 Sep 2026 · 10:30 AM');
  });

  it('says Today for the same IST day', () => {
    expect(formatAdminDate('2026-09-25T02:35:00Z', NOW)).toBe('Today · 08:05 AM');
    // 18:30 UTC on the 24th is midnight starting the 25th in IST.
    expect(formatAdminDate('2026-09-24T18:30:00Z', NOW)).toBe('Today · 12:00 AM');
  });

  it('says Yesterday for the previous IST day', () => {
    expect(formatAdminDate('2026-09-24T10:50:00Z', NOW)).toBe('Yesterday · 04:20 PM');
    expect(formatAdminDate('2026-09-24T18:29:59Z', NOW)).toBe('Yesterday · 11:59 PM');
  });

  it('formats noon and midnight on the 12-hour clock', () => {
    expect(formatAdminDate('2026-09-01T06:30:00Z', NOW)).toBe('1 Sep 2026 · 12:00 PM');
    expect(formatAdminDate('2026-08-31T18:30:00Z', NOW)).toBe('1 Sep 2026 · 12:00 AM');
  });

  it('gives an empty string for an unparseable value', () => {
    expect(formatAdminDate('not a date', NOW)).toBe('');
    expect(formatAdminDate('', NOW)).toBe('');
  });
});

describe('formatAdminDay', () => {
  it('shows just the IST date, "25 Sep 2026"', () => {
    expect(formatAdminDay('2026-09-25T06:30:00Z')).toBe('25 Sep 2026');
    expect(formatAdminDay('2026-12-31T19:00:00Z')).toBe('1 Jan 2027');
    expect(formatAdminDay('nope')).toBe('');
  });
});

describe('relativeTime', () => {
  it('says Just now under a minute, and for a time slightly in the future', () => {
    expect(relativeTime('2026-09-25T06:29:30Z', NOW)).toBe('Just now');
    expect(relativeTime('2026-09-25T06:31:00Z', NOW)).toBe('Just now');
  });

  it('counts minutes', () => {
    expect(relativeTime('2026-09-25T06:29:00Z', NOW)).toBe('1 minute ago');
    expect(relativeTime('2026-09-25T06:20:00Z', NOW)).toBe('10 minutes ago');
    expect(relativeTime('2026-09-25T05:30:01Z', NOW)).toBe('59 minutes ago');
  });

  it('counts hours under a day', () => {
    expect(relativeTime('2026-09-25T05:30:00Z', NOW)).toBe('1 hour ago');
    expect(relativeTime('2026-09-25T03:30:00Z', NOW)).toBe('3 hours ago');
  });

  it('says Yesterday, then N days ago, by IST calendar day', () => {
    expect(relativeTime('2026-09-24T03:00:00Z', NOW)).toBe('Yesterday');
    expect(relativeTime('2026-09-23T06:30:00Z', NOW)).toBe('2 days ago');
    expect(relativeTime('2026-09-19T06:30:00Z', NOW)).toBe('6 days ago');
  });

  it('falls back to the date after a week', () => {
    expect(relativeTime('2026-09-18T06:30:00Z', NOW)).toBe('18 Sep 2026');
  });

  it('gives an empty string for an unparseable value', () => {
    expect(relativeTime('garbage', NOW)).toBe('');
  });
});
