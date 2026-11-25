/**
 * Pure helpers of the Audit Schedule screen (screens/dashboard/audit-schedule/scheduleFormat.ts):
 * status/type mapping, the dash for missing values, IST calendar maths and
 * the list query each filter turns into (null where the API has no equivalent).
 */
import { describe, expect, it } from 'vitest';
import type { AuditSummaryDto } from '../api/audits';
import { ADMIN_NO_VALUE } from '../utils/noValue';
import {
  auditCode,
  auditorOf,
  auditsOnDay,
  badgeKeyOf,
  cycle,
  dayMarker,
  dayRange,
  distinctZones,
  exactCount,
  historyListQuery,
  historyYears,
  istDateOf,
  matchesSearch,
  monthListQuery,
  monthRange,
  mondayFirstWeeks,
  orDash,
  scheduleListQuery,
  scoreParts,
  scoreText,
  shiftMonth,
  typeKeyOf,
  weekRange,
} from '../screens/dashboard/audit-schedule/scheduleFormat';

function audit(over: Partial<AuditSummaryDto> = {}): AuditSummaryDto {
  return {
    id: '1a2b3c4d-0000-4000-8000-000000000001',
    farmerId: 'f-1',
    tohfaFarmerId: 'TOHFA-F-2026-0001',
    farmerName: 'Test Farmer',
    farmId: null,
    farmName: null,
    zoneId: null,
    zoneName: null,
    fiscalYear: '2026-27',
    quarter: 3,
    auditType: 'INTERNAL',
    status: 'SCHEDULED',
    scheduledFor: '2026-11-13T04:30:00Z',
    startedAt: null,
    completedAt: null,
    auditorUserId: null,
    auditorName: null,
    externalAgencyName: null,
    totalScore: null,
    maxScore: 100,
    tier: null,
    majorViolationsCount: 0,
    findingCounts: { major: 0, minor: 0, observation: 0, openMajor: 0 },
    redFlagged: false,
    ...over,
  };
}

// 2026-11-13 10:00 IST (a Friday).
const NOW = new Date('2026-11-13T04:30:00Z');

describe('status, type and text mapping', () => {
  it('maps every AuditStatus to a design badge', () => {
    expect(badgeKeyOf('SCHEDULED')).toBe('scheduled');
    expect(badgeKeyOf('IN_PROGRESS')).toBe('inProgress');
    expect(badgeKeyOf('COMPLETED')).toBe('completed');
    expect(badgeKeyOf('CANCELLED')).toBe('cancelled');
    expect(typeKeyOf('INTERNAL')).toBe('internal');
    expect(typeKeyOf('EXTERNAL')).toBe('external');
  });

  it('short audit code is the uuid head, upper-cased', () => {
    expect(auditCode('1a2b3c4d-0000-4000-8000-000000000001')).toBe('1A2B3C4D');
    expect(auditCode('')).toBe(ADMIN_NO_VALUE);
  });

  it('missing values render as the shared dash', () => {
    expect(orDash(null)).toBe(ADMIN_NO_VALUE);
    expect(orDash('  ')).toBe(ADMIN_NO_VALUE);
    expect(orDash(' Ooty ')).toBe('Ooty');
    expect(auditorOf(audit())).toBe(ADMIN_NO_VALUE);
    expect(auditorOf(audit({ externalAgencyName: 'AgriCert' }))).toBe('AgriCert');
    expect(auditorOf(audit({ auditorName: 'Priya', externalAgencyName: 'X' }))).toBe('Priya');
    expect(scoreText(audit())).toBe(ADMIN_NO_VALUE);
    expect(scoreText(audit({ totalScore: 78 }))).toBe('78/100');
    expect(scoreParts(audit())).toEqual({ value: ADMIN_NO_VALUE, total: '100' });
  });

  it('search matches farmer name, farmer code, audit id/code, farm and zone', () => {
    const a = audit({ farmName: 'Hill Plot', zoneName: 'Kotagiri' });
    for (const q of ['test', 'f-2026-0001', '1a2b3c4d', 'hill', 'KOTA', '']) expect(matchesSearch(a, q), q).toBe(true);
    expect(matchesSearch(a, 'coonoor')).toBe(false);
  });
});

describe('IST calendar maths', () => {
  it('reads the IST date, not the UTC one', () => {
    expect(istDateOf('2026-11-12T19:00:00Z')).toEqual({ year: 2026, month: 10, day: 13 });
    expect(istDateOf('not a date')).toBeNull();
  });

  it('day / month ranges start at IST midnight', () => {
    expect(dayRange({ year: 2026, month: 10, day: 13 })).toEqual({
      scheduledFrom: '2026-11-12T18:30:00.000Z',
      scheduledTo: '2026-11-13T18:29:59.999Z',
    });
    expect(monthRange(2026, 11).scheduledTo).toBe('2026-12-31T18:29:59.999Z');
  });

  it('week is Monday to Sunday in IST', () => {
    expect(weekRange(NOW)).toEqual({ scheduledFrom: '2026-11-08T18:30:00.000Z', scheduledTo: '2026-11-15T18:29:59.999Z' });
  });

  it('builds Monday-first weeks (October 2026 starts on a Thursday)', () => {
    const weeks = mondayFirstWeeks(2026, 9);
    expect(weeks[0]).toEqual([null, null, null, 1, 2, 3, 4]);
    expect(weeks[weeks.length - 1]).toEqual([26, 27, 28, 29, 30, 31, null]);
  });

  it('shifts months across years', () => {
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
  });

  it('groups audits by IST day and picks the dot', () => {
    const late = audit({ id: 'a', scheduledFor: '2026-11-12T19:00:00Z' });
    const done = audit({ id: 'b', status: 'COMPLETED', scheduledFor: '2026-11-03T05:00:00Z' });
    expect(auditsOnDay([late, done], 2026, 10, 13).map((a) => a.id)).toEqual(['a']);
    expect(dayMarker([])).toBe('none');
    expect(dayMarker([done])).toBe('completed');
    expect(dayMarker([late])).toBe('active');
    expect(dayMarker([audit({ status: 'CANCELLED' })])).toBe('cancelled');
    expect(dayMarker([late, done])).toBe('multi');
  });

  it('zones come from the loaded audits, deduplicated', () => {
    const zones = distinctZones([
      audit({ zoneId: 'z2', zoneName: 'Ooty' }),
      audit({ zoneId: 'z1', zoneName: 'Coonoor' }),
      audit({ zoneId: 'z2', zoneName: 'Ooty' }),
      audit(),
    ]);
    expect(zones).toEqual([
      { id: 'z1', name: 'Coonoor' },
      { id: 'z2', name: 'Ooty' },
    ]);
    expect(cycle([null, 'z1', 'z2'], 'z2')).toBeNull();
  });
});

describe('list queries', () => {
  it('Field Visit and Rescheduled have no API equivalent: no query at all', () => {
    expect(scheduleListQuery({ type: 'fieldVisit', status: 'all', date: 'today' }, NOW)).toBeNull();
    expect(historyListQuery({ type: 'all', year: 2026, status: 'rescheduled' })).toBeNull();
    expect(monthListQuery(2026, 10, 'fieldVisit', 'all', NOW)).toBeNull();
  });

  it('schedule list: type, status and date map onto the GET /admin/audits query', () => {
    expect(scheduleListQuery({ type: 'external', status: 'inProgress', date: 'today' }, NOW)).toEqual({
      sort: 'scheduledFor',
      limit: 50,
      type: 'EXTERNAL',
      status: ['IN_PROGRESS'],
      scheduledFrom: '2026-11-12T18:30:00.000Z',
      scheduledTo: '2026-11-13T18:29:59.999Z',
    });
    // Upcoming = SCHEDULED from now; "now" is later than today's start, so it wins.
    expect(scheduleListQuery({ type: 'all', status: 'upcoming', date: 'today' }, NOW)).toMatchObject({
      status: ['SCHEDULED'],
      scheduledFrom: NOW.toISOString(),
    });
    expect(scheduleListQuery({ type: 'all', status: 'all', date: 'custom' }, NOW)).toEqual({ sort: 'scheduledFor', limit: 50 });
  });

  it('history: newest first within the calendar year', () => {
    expect(historyListQuery({ type: 'internal', year: 2025, status: 'completed' })).toEqual({
      sort: '-scheduledFor',
      limit: 50,
      scheduledFrom: '2024-12-31T18:30:00.000Z',
      scheduledTo: '2025-12-31T18:29:59.999Z',
      type: 'INTERNAL',
      status: ['COMPLETED'],
    });
    expect(historyYears(NOW)).toEqual([2026, 2025, 2024]);
  });

  it('month query covers the IST month, ascending', () => {
    expect(monthListQuery(2026, 10, 'all', 'scheduled', NOW)).toEqual({
      sort: 'scheduledFor',
      limit: 100,
      scheduledFrom: '2026-10-31T18:30:00.000Z',
      scheduledTo: '2026-11-30T18:29:59.999Z',
      status: ['SCHEDULED'],
    });
  });

  it('a KPI count is exact only when the whole list is loaded', () => {
    const base = { items: [1, 2], hasMore: false, isLoading: false, error: null };
    expect(exactCount(base)).toBe(2);
    expect(exactCount({ ...base, hasMore: true })).toBeNull();
    expect(exactCount({ ...base, isLoading: true })).toBeNull();
    expect(exactCount({ ...base, error: new Error('x') })).toBeNull();
  });
});
