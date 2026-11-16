/**
 * Pure logic behind the Audit Schedule & Assignment list and the Schedule
 * Audit form (screens/audits/auditScheduleFormat.ts): status badges, row
 * mapping with the no-value dash, server list filters, date/time parsing in
 * IST, and the create/update bodies (no fiscalYear/quarter, EXTERNAL needs an
 * agency, INTERNAL never sends one, update sends only changed fields).
 */
import { describe, expect, it } from 'vitest';
import type { AuditDetailDto, AuditSummaryDto } from '../api/audits';
import {
  buildCreateBody,
  buildUpdateBody,
  draftFromAudit,
  emptyDraft,
  isValidCancelReason,
  istDateInput,
  matchesSearch,
  mergeOptions,
  parseDayInput,
  parseTimeInput,
  scheduleStatus,
  statusTone,
  toListFilters,
  toScheduleRow,
  toScheduledFor,
  withinScore,
  EMPTY_SCHEDULE_FILTERS,
  type ScheduleAuditDraft,
} from '../screens/audits/auditScheduleFormat';
import { ADMIN_NO_VALUE } from '../utils/noValue';

const NOW = new Date('2026-10-10T06:00:00.000Z');

function summary(over: Partial<AuditSummaryDto> = {}): AuditSummaryDto {
  return {
    id: 'a-1',
    farmerId: 'f-1',
    tohfaFarmerId: 'TOHFA-F-2026-0001',
    farmerName: 'Lakshmi',
    farmId: null,
    farmName: null,
    zoneId: null,
    zoneName: null,
    fiscalYear: '2026-27',
    quarter: 3,
    auditType: 'INTERNAL',
    status: 'SCHEDULED',
    scheduledFor: '2026-10-20T04:30:00.000Z',
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

function detail(over: Partial<AuditDetailDto> = {}): AuditDetailDto {
  return {
    ...summary(),
    summary: null,
    reportUpload: null,
    redFlagReason: null,
    redFlaggedAt: null,
    redFlaggedByName: null,
    cancelledReason: null,
    cancelledAt: null,
    createdByName: 'Admin',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: null,
    categoryScores: [],
    findings: [],
    ...over,
  };
}

function draft(over: Partial<ScheduleAuditDraft> = {}): ScheduleAuditDraft {
  return { ...emptyDraft(), farmerId: 'f-1', date: '20/10/2026', startTime: '10:00 AM', ...over };
}

describe('schedule list rows', () => {
  it('maps status to the design badges, past-dated live audits as past due', () => {
    expect(scheduleStatus(summary(), NOW)).toBe('scheduled');
    expect(scheduleStatus(summary({ status: 'IN_PROGRESS' }), NOW)).toBe('inProgress');
    expect(scheduleStatus(summary({ status: 'COMPLETED', scheduledFor: '2026-01-01T00:00:00Z' }), NOW)).toBe('completed');
    expect(scheduleStatus(summary({ scheduledFor: '2026-10-08T04:00:00Z' }), NOW)).toBe('pastDue');
    expect(scheduleStatus(summary({ status: 'IN_PROGRESS', scheduledFor: '2026-10-08T04:00:00Z' }), NOW)).toBe('pastDue');
    expect(statusTone('completed')).toBe('success');
    expect(statusTone('pastDue')).toBe('danger');
    expect(statusTone('scheduled')).toBe('info');
    expect(statusTone('inProgress')).toBe('warning');
  });

  it('carries the real API id and dashes every missing value', () => {
    const row = toScheduleRow(summary({ id: 'uuid-9' }), NOW);
    expect(row.id).toBe('uuid-9');
    expect(row.audit.id).toBe('uuid-9');
    expect(row.code).toBe(ADMIN_NO_VALUE);
    expect(row.farmLocation).toBe(ADMIN_NO_VALUE);
    expect(row.zone).toBe(ADMIN_NO_VALUE);
    expect(row.isEditable).toBe(true);
    expect(row.isCancellable).toBe(true);
    expect(row.isViewOnly).toBe(false);
  });

  it('completed audits are view only; in-progress ones cannot be edited but can be cancelled', () => {
    const done = toScheduleRow(summary({ status: 'COMPLETED' }), NOW);
    expect(done.isViewOnly).toBe(true);
    expect(done.isEditable).toBe(false);
    expect(done.isCancellable).toBe(false);
    const running = toScheduleRow(summary({ status: 'IN_PROGRESS' }), NOW);
    expect(running.isEditable).toBe(false);
    expect(running.isCancellable).toBe(true);
  });

  it('searches farmer, farmer id, farm, zone and auditor', () => {
    const a = summary({ farmName: 'Highland', auditorName: 'R. Devi' });
    expect(matchesSearch(a, '')).toBe(true);
    expect(matchesSearch(a, 'laksh')).toBe(true);
    expect(matchesSearch(a, '0001')).toBe(true);
    expect(matchesSearch(a, 'highland')).toBe(true);
    expect(matchesSearch(a, 'devi')).toBe(true);
    expect(matchesSearch(a, 'nobody')).toBe(false);
  });

  it('score bounds exclude unscored audits only when a bound is set', () => {
    expect(withinScore({ totalScore: null }, null, null)).toBe(true);
    expect(withinScore({ totalScore: null }, 10, null)).toBe(false);
    expect(withinScore({ totalScore: 70 }, 60, 80)).toBe(true);
    expect(withinScore({ totalScore: 90 }, 60, 80)).toBe(false);
  });

  it('merges filter options from rows and keeps the same object when nothing is new', () => {
    const first = mergeOptions({ farmers: [], zones: [] }, [summary({ zoneId: 'z-1', zoneName: 'Zone A' })]);
    expect(first.farmers.map((o) => o.id)).toEqual(['f-1']);
    expect(first.zones).toEqual([{ id: 'z-1', label: 'Zone A' }]);
    expect(mergeOptions(first, [summary({ zoneId: 'z-1', zoneName: 'Zone A' })])).toBe(first);
  });
});

describe('server list filters', () => {
  it('always asks for live and completed audits, never cancelled ones', () => {
    expect(toListFilters(EMPTY_SCHEDULE_FILTERS)).toMatchObject({ status: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'] });
  });

  it('sends farmer, zone, type and the IST day range; drops unparseable dates', () => {
    const f = toListFilters({ ...EMPTY_SCHEDULE_FILTERS, farmerId: 'f-1', zoneId: 'z-1', type: 'EXTERNAL', dateFrom: '01-10-2026', dateTo: '31-10-2026' });
    expect(f.farmerId).toBe('f-1');
    expect(f.zoneId).toBe('z-1');
    expect(f.type).toBe('EXTERNAL');
    expect(f.scheduledFrom).toBe('2026-10-01T00:00:00+05:30');
    expect(f.scheduledTo).toBe('2026-10-31T23:59:59+05:30');
    expect(toListFilters({ ...EMPTY_SCHEDULE_FILTERS, dateFrom: '31-02-2026' }).scheduledFrom).toBeUndefined();
  });

  it('cancel reason is 3-500 characters', () => {
    expect(isValidCancelReason('ab')).toBe(false);
    expect(isValidCancelReason('  abc ')).toBe(true);
    expect(isValidCancelReason('x'.repeat(501))).toBe(false);
  });
});

describe('form dates and times (IST)', () => {
  it('parses DD/MM/YYYY and dd-mm-yyyy, rejecting impossible dates', () => {
    expect(parseDayInput('20/10/2026')).toBe('2026-10-20');
    expect(parseDayInput('5-1-2027')).toBe('2027-01-05');
    expect(parseDayInput('30/02/2026')).toBeNull();
    expect(parseDayInput('2026-10-20')).toBeNull();
  });

  it('parses 12- and 24-hour times', () => {
    expect(parseTimeInput('10:00 AM')).toEqual({ hour: 10, minute: 0 });
    expect(parseTimeInput('12:15 am')).toEqual({ hour: 0, minute: 15 });
    expect(parseTimeInput('12:00 PM')).toEqual({ hour: 12, minute: 0 });
    expect(parseTimeInput('2:30 PM')).toEqual({ hour: 14, minute: 30 });
    expect(parseTimeInput('14:30')).toEqual({ hour: 14, minute: 30 });
    expect(parseTimeInput('13:00 PM')).toBeNull();
    expect(parseTimeInput('10:75')).toBeNull();
  });

  it('builds scheduledFor with the +05:30 offset and round-trips the IST date', () => {
    expect(toScheduledFor('20/10/2026', '10:00 AM')).toBe('2026-10-20T10:00:00+05:30');
    expect(istDateInput('2026-10-19T20:00:00.000Z')).toBe('20/10/2026');
  });
});

describe('create body', () => {
  it('never sends fiscalYear or quarter, and INTERNAL never sends an agency name', () => {
    const r = buildCreateBody(draft({ farmId: 'farm-1', auditorUserId: 'u-1', externalAgencyName: 'AgriCert' }));
    expect(r).toEqual({
      ok: true,
      body: { farmerId: 'f-1', auditType: 'INTERNAL', scheduledFor: '2026-10-20T10:00:00+05:30', farmId: 'farm-1', auditorUserId: 'u-1' },
    });
  });

  it('EXTERNAL requires an agency name of 2-200 characters and sends no auditor', () => {
    expect(buildCreateBody(draft({ auditType: 'EXTERNAL', externalAgencyName: 'A' }))).toEqual({
      ok: false,
      errorKey: 'admin.audits.form.error.agencyInvalid',
    });
    const r = buildCreateBody(draft({ auditType: 'EXTERNAL', externalAgencyName: ' AgriCert ', auditorUserId: 'u-1' }));
    expect(r.ok && r.body).toEqual({ farmerId: 'f-1', auditType: 'EXTERNAL', scheduledFor: '2026-10-20T10:00:00+05:30', externalAgencyName: 'AgriCert' });
  });

  it('requires a farmer, a valid date and a valid time', () => {
    expect(buildCreateBody(draft({ farmerId: null }))).toMatchObject({ ok: false, errorKey: 'admin.audits.form.error.farmerRequired' });
    expect(buildCreateBody(draft({ date: '' }))).toMatchObject({ ok: false, errorKey: 'admin.audits.form.error.dateInvalid' });
    expect(buildCreateBody(draft({ startTime: 'soon' }))).toMatchObject({ ok: false, errorKey: 'admin.audits.form.error.timeInvalid' });
  });
});

describe('update body', () => {
  const original = detail({ scheduledFor: '2026-10-20T04:30:00.000Z', farmId: 'farm-1', farmName: 'Highland' });

  it('an untouched prefilled form is "no changes" (the server needs a field besides reason)', () => {
    expect(buildUpdateBody(original, draftFromAudit(original))).toEqual({ ok: false, errorKey: 'admin.audits.form.error.noChanges' });
  });

  it('sends only the changed fields and never auditType, farmer or reason', () => {
    const r = buildUpdateBody(original, { ...draftFromAudit(original), date: '21/10/2026' });
    expect(r).toEqual({ ok: true, body: { scheduledFor: '2026-10-21T10:00:00+05:30' } });
    const r2 = buildUpdateBody(original, { ...draftFromAudit(original), farmId: 'farm-2' });
    expect(r2).toEqual({ ok: true, body: { farmId: 'farm-2' } });
  });

  it('refuses audits that are not SCHEDULED', () => {
    expect(buildUpdateBody(detail({ status: 'IN_PROGRESS' }), draft())).toEqual({ ok: false, errorKey: 'admin.audits.form.error.notEditable' });
  });

  it('EXTERNAL edits send a changed agency name only', () => {
    const ext = detail({ auditType: 'EXTERNAL', externalAgencyName: 'AgriCert' });
    const r = buildUpdateBody(ext, { ...draftFromAudit(ext), externalAgencyName: 'PGS Certifiers' });
    expect(r).toEqual({ ok: true, body: { externalAgencyName: 'PGS Certifiers' } });
  });
});
