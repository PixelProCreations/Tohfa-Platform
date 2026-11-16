/**
 * Pure helpers of AuditManagementScreen: KPI tile sourcing (em-dash for every
 * figure the compliance summary lacks), the Monday-first IST calendar, the day
 * markers and the audit row text.
 */
import { describe, expect, it, vi } from 'vitest';

// The catalogue is registered in i18n/index.ts by the orchestrator; until then
// this test resolves keys from the real catalogue plus this screen's own file,
// so the assertions hold before and after registration.
vi.mock('../../i18n', async (importOriginal) => {
  const actual = await importOriginal<{ en: Record<string, string> }>();
  const own = (await import('../../i18n/auditsManagement.en.json')).default as Record<string, string>;
  const all: Record<string, string> = { ...actual.en, ...own };
  const t = (key: string, params: Record<string, string | number> = {}) =>
    (all[key] ?? key).replace(/\{\{(\w+)\}\}/g, (_m, name: string) => String(params[name] ?? ''));
  return { ...actual, t };
});
import type { AuditComplianceCountsDto, AuditSummaryDto } from '../../api/audits';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import {
  AUDIT_KPI_SOURCES,
  auditBadge,
  auditKpiTiles,
  auditRowDetails,
  auditRowTitle,
  auditsOnDay,
  dayMarkers,
  istToday,
  monthCells,
  monthRange,
  shiftMonth,
} from './AuditManagementFormat';

const COUNTS: AuditComplianceCountsDto = {
  farmersInScope: 40,
  compliant: 20,
  pending: 12,
  nonCompliant: 8,
  overdueAudits: 3,
  farmersWithoutCurrentQuarterAudit: 5,
  redFlaggedAudits: 4,
  redFlaggedFarmers: 2,
  openMajorFindings: 17,
  scheduledThisQuarter: 9,
};

function audit(over: Partial<AuditSummaryDto> = {}): AuditSummaryDto {
  return {
    id: 'a-1',
    farmerId: 'f-1',
    tohfaFarmerId: 'TOHFA-F-2026-0131',
    farmerName: 'Selvi',
    farmId: 'farm-1',
    farmName: 'Coonoor farm',
    zoneId: 'z-1',
    zoneName: 'Zone A',
    fiscalYear: '2026-27',
    quarter: 3,
    auditType: 'INTERNAL',
    status: 'SCHEDULED',
    scheduledFor: '2026-10-15T04:30:00.000Z',
    startedAt: null,
    completedAt: null,
    auditorUserId: 'u-1',
    auditorName: 'S. Mohan',
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

describe('auditKpiTiles', () => {
  it('renders all six designed tiles as em-dash with no data', () => {
    const tiles = auditKpiTiles(undefined);
    expect(tiles.map((x) => x.id)).toEqual(['upcoming', 'inProgress', 'pendingReview', 'completed', 'correctiveOpen', 'complianceAlerts']);
    for (const tile of tiles) expect(tile.value).toBe(ADMIN_NO_VALUE);
  });

  it('fills only the tiles that have a compliance count', () => {
    const byId = Object.fromEntries(auditKpiTiles(COUNTS).map((x) => [x.id, x.value]));
    expect(byId['correctiveOpen']).toBe('17');
    expect(byId['complianceAlerts']).toBe('4');
    for (const id of ['upcoming', 'inProgress', 'pendingReview', 'completed']) expect(byId[id]).toBe(ADMIN_NO_VALUE);
    expect(AUDIT_KPI_SOURCES.upcoming).toBeNull();
  });

  it('shows 0 as 0, not a dash', () => {
    const tiles = auditKpiTiles({ ...COUNTS, openMajorFindings: 0 });
    expect(tiles.find((x) => x.id === 'correctiveOpen')?.value).toBe('0');
  });
});

describe('calendar', () => {
  it('lays October 2026 out Monday first (1 Oct is a Thursday)', () => {
    const cells = monthCells({ year: 2026, month: 10 });
    expect(cells.slice(0, 4)).toEqual([null, null, null, 1]);
    expect(cells.length % 7).toBe(0);
    expect(cells.filter((c) => c !== null)).toHaveLength(31);
  });

  it('shifts months across a year boundary', () => {
    expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
  });

  it('queries one IST month as UTC instants', () => {
    expect(monthRange({ year: 2026, month: 10 })).toEqual({
      scheduledFrom: '2026-09-30T18:30:00.000Z',
      scheduledTo: '2026-10-31T18:29:59.999Z',
    });
  });

  it('reads today in IST, not UTC', () => {
    expect(istToday(new Date('2026-10-08T19:00:00Z'))).toEqual({ year: 2026, month: 10, day: 9 });
  });

  it('marks days by status on the IST day', () => {
    const markers = dayMarkers(
      [
        audit({ id: '1', status: 'SCHEDULED', scheduledFor: '2026-10-08T19:00:00Z' }),
        audit({ id: '2', status: 'IN_PROGRESS', scheduledFor: '2026-10-09T05:00:00Z' }),
        audit({ id: '3', status: 'COMPLETED', scheduledFor: '2026-10-20T05:00:00Z' }),
        audit({ id: '4', status: 'SCHEDULED', scheduledFor: '2026-11-02T05:00:00Z' }),
      ],
      { year: 2026, month: 10 },
    );
    expect(markers[9]).toEqual({ hasOrangeDot: true, hasBlueDot: true });
    expect(markers[20]).toEqual({ hasGreenRing: true });
    expect(markers[2]).toBeUndefined();
  });

  it('lists the audits of one IST day, earliest first', () => {
    const rows = auditsOnDay(
      [
        audit({ id: 'late', scheduledFor: '2026-10-09T10:00:00Z' }),
        audit({ id: 'early', scheduledFor: '2026-10-08T20:00:00Z' }),
        audit({ id: 'other', scheduledFor: '2026-10-10T05:00:00Z' }),
      ],
      { year: 2026, month: 10, day: 9 },
    );
    expect(rows.map((r) => r.id)).toEqual(['early', 'late']);
  });
});

describe('rows', () => {
  const now = new Date('2026-10-09T06:00:00Z');

  it('badges by status; a past SCHEDULED audit reads past scheduled date', () => {
    expect(auditBadge(audit({ scheduledFor: '2026-10-15T04:30:00Z' }), now).tone).toBe('info');
    expect(auditBadge(audit({ scheduledFor: '2026-10-08T04:00:00Z' }), now)).toEqual({
      labelKey: 'admin.audits.management.badge.pastScheduled',
      tone: 'danger',
    });
    expect(auditBadge(audit({ status: 'COMPLETED' }), now).tone).toBe('success');
    expect(auditBadge(audit({ status: 'IN_PROGRESS' }), now).tone).toBe('warning');
  });

  it('title carries the farmer and an em-dash for the audit code the API lacks', () => {
    const title = auditRowTitle(audit());
    expect(title).toContain(ADMIN_NO_VALUE);
    expect(title).toContain('Selvi');
    expect(title).toContain('TOHFA-F-2026-0131');
  });

  it('details use the agency for an EXTERNAL audit and dashes for missing parts', () => {
    const external = auditRowDetails(audit({ auditType: 'EXTERNAL', externalAgencyName: 'AgriCert', auditorName: null }));
    expect(external).toContain('AgriCert');
    const bare = auditRowDetails(audit({ farmName: null, zoneName: null, auditorName: null }));
    expect(bare).toContain(ADMIN_NO_VALUE);
    expect(bare).not.toContain('null');
  });
});
