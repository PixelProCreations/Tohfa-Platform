/**
 * The write side of the three audit screens (screens/audits/auditActions.ts):
 * request bodies, the inspection's call order and its partial-failure rule,
 * and the bulk reschedule outcome. Pure functions, plain Node.
 *
 * BR-03: scheduling (the server derives fiscalYear/quarter; the client never sends them) and
 *        bulk reschedule (per-item outcome, `expectedScheduledFor` replay guard).
 * BR-05: a MAJOR finding is logged before completion, which counts it.
 * BR-06: a missing category score is incomplete, never zero.
 */
import { describe, expect, it, vi } from 'vitest';
import type { Problem } from '@tohfa/shared-types';
import { ApiError, NetworkError } from '../../../shell/api/client';
import type { AuditDetailDto, AuditBulkRescheduleResultDto } from '../api/audits';
import {
  BULK_RESCHEDULE_MAX_ITEMS,
  InspectionStepError,
  buildBulkBody,
  buildQuickScheduleBody,
  inspectionBlocker,
  isStartTimePicked,
  newInspectionProgress,
  runInspection,
  scheduledForDate,
  summariseBulk,
  toScoreInputs,
  type InspectionDeps,
  type InspectionInput,
} from '../screens/audits/auditActions';

function apiError(code: string, status = 409): ApiError {
  return new ApiError({ type: 'about:blank', title: 'x', status, code } as Problem);
}

function audit(over: Partial<AuditDetailDto> = {}): AuditDetailDto {
  return { id: 'a-1', status: 'COMPLETED', totalScore: 71, maxScore: 100, majorViolationsCount: 1, ...over } as AuditDetailDto;
}

const SCORES = [
  { categoryCode: 'CERTIFICATION', score: 8 },
  { categoryCode: 'SOIL_LAND', score: 7 },
] as InspectionInput['scores'];

function input(over: Partial<InspectionInput> = {}): InspectionInput {
  return { auditId: 'a-1', status: 'SCHEDULED', scores: SCORES, ...over };
}

function deps(over: Partial<InspectionDeps> = {}) {
  const calls: string[] = [];
  const d: InspectionDeps = {
    startAudit: vi.fn(async () => (calls.push('start'), audit({ status: 'IN_PROGRESS' }))),
    setAuditScores: vi.fn(async () => (calls.push('scores'), audit({ status: 'IN_PROGRESS' }))),
    createAuditFinding: vi.fn(async () => (calls.push('finding'), {})),
    completeAudit: vi.fn(async () => (calls.push('complete'), audit())),
    getAudit: vi.fn(async () => audit({ status: 'IN_PROGRESS' })),
    ...over,
  };
  return { d, calls };
}

describe('buildQuickScheduleBody (POST /admin/audits)', () => {
  const base = { farmerId: 'f-1', auditType: 'INTERNAL' as const, externalAgencyName: '', day: 5, month0: 10, year: 2026, startTime: '02:30 PM' };

  it('BR-03: sends farmer, type and the IST instant at the time the admin chose, and never fiscalYear or quarter', () => {
    const r = buildQuickScheduleBody(base);
    expect(r).toEqual({
      ok: true,
      body: { farmerId: 'f-1', auditType: 'INTERNAL', scheduledFor: '2026-11-05T14:30:00+05:30' },
    });
    if (r.ok) expect(Object.keys(r.body)).not.toContain('fiscalYear');
  });

  it('the chosen time is what is sent: 24-hour and AM/PM entries, midnight and noon, never a default', () => {
    const at = (startTime: string) => {
      const r = buildQuickScheduleBody({ ...base, startTime });
      return r.ok ? r.body.scheduledFor : null;
    };
    expect(at('9:05 am')).toBe('2026-11-05T09:05:00+05:30');
    expect(at('14:30')).toBe('2026-11-05T14:30:00+05:30');
    expect(at('12:00 AM')).toBe('2026-11-05T00:00:00+05:30');
    expect(at('12:15 PM')).toBe('2026-11-05T12:15:00+05:30');
  });

  it('refuses a missing or unreadable start time instead of substituting one, so nothing is sent', () => {
    for (const startTime of ['', '   ', 'soon', '25:00', '10:75', '13:00 PM']) {
      expect(buildQuickScheduleBody({ ...base, startTime })).toEqual({
        ok: false,
        errorKey: 'admin.auditActions.schedule.timeInvalid',
      });
      expect(isStartTimePicked(startTime)).toBe(false);
    }
    expect(isStartTimePicked('10:00 AM')).toBe(true);
  });

  it('refuses without a chosen farmer, so nothing is sent', () => {
    expect(buildQuickScheduleBody({ ...base, farmerId: null })).toEqual({
      ok: false,
      errorKey: 'admin.auditActions.schedule.farmerRequired',
    });
  });

  it('EXTERNAL requires the agency name (2-200 chars) and sends it; INTERNAL never does', () => {
    expect(buildQuickScheduleBody({ ...base, auditType: 'EXTERNAL', externalAgencyName: ' ' }).ok).toBe(false);
    const ext = buildQuickScheduleBody({ ...base, auditType: 'EXTERNAL', externalAgencyName: ' PGS Council ' });
    expect(ext.ok && ext.body.externalAgencyName).toBe('PGS Council');
    const internal = buildQuickScheduleBody({ ...base, externalAgencyName: 'ignored' });
    expect(internal.ok && 'externalAgencyName' in internal.body).toBe(false);
  });

  it('refuses a date that is not on the calendar', () => {
    expect(scheduledForDate(31, 1, 2026, '10:00 AM')).toBeNull();
    expect(buildQuickScheduleBody({ ...base, day: 31, month0: 1 })).toEqual({
      ok: false,
      errorKey: 'admin.auditActions.schedule.dateInvalid',
    });
  });
});

describe('runInspection (start, scores, finding, complete)', () => {
  it('calls the four endpoints in the only order the API allows and returns the COMPLETED audit', async () => {
    const { d, calls } = deps();
    const result = await runInspection(input({ summary: 'ok', majorFindingDescription: 'Banned input found' }), newInspectionProgress(), d);
    expect(calls).toEqual(['start', 'scores', 'finding', 'complete']);
    expect(result.status).toBe('COMPLETED');
    expect(d.setAuditScores).toHaveBeenCalledWith('a-1', { scores: SCORES, summary: 'ok' });
    expect(d.createAuditFinding).toHaveBeenCalledWith('a-1', { severity: 'MAJOR', description: 'Banned input found' });
  });

  it('skips start for an IN_PROGRESS audit and the finding when no violation was flagged', async () => {
    const { d, calls } = deps();
    await runInspection(input({ status: 'IN_PROGRESS' }), newInspectionProgress(), d);
    expect(calls).toEqual(['scores', 'complete']);
  });

  it('BR-06: partial failure, scores saved but complete refused: throws naming the step and what landed, never resolves', async () => {
    const { d } = deps({ completeAudit: vi.fn(async () => { throw apiError('AUDIT_INCOMPLETE', 422); }) });
    const err = await runInspection(input(), newInspectionProgress(), d).catch((e) => e);
    expect(err).toBeInstanceOf(InspectionStepError);
    expect(err.step).toBe('complete');
    expect(err.saved).toEqual(['start', 'scores']);
    expect((err.cause as ApiError).problem.code).toBe('AUDIT_INCOMPLETE');
  });

  it('a scores failure stops the run: no finding and no complete are attempted', async () => {
    const { d } = deps({ setAuditScores: vi.fn(async () => { throw apiError('SCORE_OUT_OF_RANGE', 422); }) });
    const err = await runInspection(input({ majorFindingDescription: 'x y z' }), newInspectionProgress(), d).catch((e) => e);
    expect(err.step).toBe('scores');
    expect(err.saved).toEqual(['start']);
    expect(d.createAuditFinding).not.toHaveBeenCalled();
    expect(d.completeAudit).not.toHaveBeenCalled();
  });

  it('a start failure sends nothing else', async () => {
    const { d } = deps({ startAudit: vi.fn(async () => { throw new NetworkError(new Error('down')); }) });
    const err = await runInspection(input(), newInspectionProgress(), d).catch((e) => e);
    expect(err.step).toBe('start');
    expect(err.saved).toEqual([]);
    expect(d.setAuditScores).not.toHaveBeenCalled();
  });

  it('BR-05: a retry resumes: start, an unchanged score sheet and the finding are not sent twice', async () => {
    const progress = newInspectionProgress();
    let fail = true;
    const { d } = deps({
      completeAudit: vi.fn(async () => {
        if (fail) throw new NetworkError(new Error('down'));
        return audit();
      }),
    });
    const i = input({ majorFindingDescription: 'Banned input found' });
    await expect(runInspection(i, progress, d)).rejects.toBeInstanceOf(InspectionStepError);
    fail = false;
    const done = await runInspection(i, progress, d);
    expect(done.status).toBe('COMPLETED');
    expect(d.startAudit).toHaveBeenCalledTimes(1);
    expect(d.setAuditScores).toHaveBeenCalledTimes(1);
    expect(d.createAuditFinding).toHaveBeenCalledTimes(1);
    expect(d.completeAudit).toHaveBeenCalledTimes(2);
  });

  it('an edited score sheet is saved again on retry (the PUT is an upsert)', async () => {
    const progress = newInspectionProgress();
    let fail = true;
    const { d } = deps({ completeAudit: vi.fn(async () => { if (fail) throw apiError('AUDIT_INCOMPLETE', 422); return audit(); }) });
    await runInspection(input(), progress, d).catch(() => undefined);
    fail = false;
    await runInspection(input({ scores: [{ categoryCode: 'CERTIFICATION', score: 9 }] as InspectionInput['scores'] }), progress, d);
    expect(d.setAuditScores).toHaveBeenCalledTimes(2);
  });

  it('a lost complete response: 409 INVALID_STATE_TRANSITION is reconciled by re-reading a COMPLETED audit', async () => {
    const { d } = deps({
      completeAudit: vi.fn(async () => { throw apiError('INVALID_STATE_TRANSITION'); }),
      getAudit: vi.fn(async () => audit({ status: 'COMPLETED' })),
    });
    const done = await runInspection(input({ status: 'IN_PROGRESS' }), newInspectionProgress(), d);
    expect(done.status).toBe('COMPLETED');
  });

  it('a 409 on complete while the audit is NOT completed is still a failure', async () => {
    const { d } = deps({ completeAudit: vi.fn(async () => { throw apiError('INVALID_STATE_TRANSITION'); }) });
    const err = await runInspection(input({ status: 'IN_PROGRESS' }), newInspectionProgress(), d).catch((e) => e);
    expect(err).toBeInstanceOf(InspectionStepError);
    expect(err.step).toBe('complete');
  });

  it('a completed or cancelled audit is never started or scored', async () => {
    const { d } = deps();
    await expect(runInspection(input({ status: 'COMPLETED' }), newInspectionProgress(), d)).rejects.toBeInstanceOf(InspectionStepError);
    expect(d.startAudit).not.toHaveBeenCalled();
    expect(d.setAuditScores).not.toHaveBeenCalled();
  });
});

describe('inspectionBlocker and toScoreInputs', () => {
  it('BR-06: a missing category score blocks submission (incomplete, not zero)', () => {
    expect(inspectionBlocker({ status: 'IN_PROGRESS', scores: [8, null], violation: false, notes: '' })).toBe(
      'admin.auditActions.inspection.categoryRequired',
    );
    expect(inspectionBlocker({ status: 'IN_PROGRESS', scores: [8, 0], violation: false, notes: '' })).toBeNull();
  });

  it('BR-05: a flagged major violation needs a 3-2000 character description for its finding', () => {
    expect(inspectionBlocker({ status: 'IN_PROGRESS', scores: [8], violation: true, notes: 'ab' })).toBe(
      'admin.auditActions.inspection.violationNeedsNote',
    );
    expect(inspectionBlocker({ status: 'IN_PROGRESS', scores: [8], violation: true, notes: 'abc' })).toBeNull();
  });

  it('a completed or cancelled audit is blocked', () => {
    expect(inspectionBlocker({ status: 'COMPLETED', scores: [8], violation: false, notes: '' })).toBe(
      'admin.auditActions.inspection.notConductable',
    );
  });

  it('sends only scored categories, in the order the server listed them', () => {
    expect(
      toScoreInputs([{ categoryCode: 'SOIL_LAND' }, { categoryCode: 'CERTIFICATION' }], { SOIL_LAND: 7, CERTIFICATION: null }),
    ).toEqual([{ categoryCode: 'SOIL_LAND', score: 7 }]);
  });
});

describe('buildBulkBody and summariseBulk (POST /admin/audits/bulk-reschedule)', () => {
  const picked = [
    { id: 'a-1', scheduledFor: '2026-10-14T04:30:00Z' },
    { id: 'a-2', scheduledFor: '2026-10-15T04:30:00Z' },
  ];

  it('BR-03: a shift sends shiftDays and each audit\'s expectedScheduledFor (the replay guard), not newScheduledFor', () => {
    const r = buildBulkBody(picked, { mode: 'shift', days: 7 }, ' Heavy rainfall ');
    expect(r).toEqual({
      ok: true,
      body: {
        items: [
          { auditId: 'a-1', expectedScheduledFor: '2026-10-14T04:30:00Z' },
          { auditId: 'a-2', expectedScheduledFor: '2026-10-15T04:30:00Z' },
        ],
        shiftDays: 7,
        reason: 'Heavy rainfall',
      },
    });
  });

  it('a custom date sends newScheduledFor and never shiftDays (exactly one of the two)', () => {
    const r = buildBulkBody(picked, { mode: 'custom', day: 20, month0: 10, year: 2026, startTime: '4:45 PM' }, '');
    expect(r.ok && r.body).toMatchObject({ newScheduledFor: '2026-11-20T16:45:00+05:30' });
    expect(r.ok && 'shiftDays' in r.body).toBe(false);
    expect(r.ok && 'reason' in r.body).toBe(false);
  });

  it('a custom date with no start time is refused, never given a default one', () => {
    for (const startTime of ['', 'noon-ish']) {
      expect(buildBulkBody(picked, { mode: 'custom', day: 20, month0: 10, year: 2026, startTime }, '')).toEqual({
        ok: false,
        errorKey: 'admin.auditActions.bulk.timeInvalid',
      });
    }
  });

  it('refuses nothing selected, more than 100, and an impossible date', () => {
    expect(buildBulkBody([], { mode: 'shift', days: 3 }, '').ok).toBe(false);
    const many = Array.from({ length: BULK_RESCHEDULE_MAX_ITEMS + 1 }, (_, i) => ({ id: `a-${i}`, scheduledFor: '2026-10-14T04:30:00Z' }));
    expect(buildBulkBody(many, { mode: 'shift', days: 3 }, '')).toEqual({ ok: false, errorKey: 'admin.auditActions.bulk.tooMany' });
    expect(buildBulkBody(picked, { mode: 'custom', day: 31, month0: 1, year: 2026, startTime: '10:00 AM' }, '').ok).toBe(false);
  });

  it('BR-03: a 200 with failures is reported per audit, with the server\'s reason code', () => {
    const res = {
      rescheduledCount: 1,
      failedCount: 1,
      results: [
        { auditId: 'a-1', outcome: 'RESCHEDULED' },
        { auditId: 'a-2', outcome: 'FAILED', code: 'AUDIT_QUARTER_TAKEN' },
      ],
    } as AuditBulkRescheduleResultDto;
    expect(summariseBulk(res)).toEqual({
      rescheduledCount: 1,
      failedCount: 1,
      failed: [{ auditId: 'a-2', code: 'AUDIT_QUARTER_TAKEN' }],
    });
  });
});
