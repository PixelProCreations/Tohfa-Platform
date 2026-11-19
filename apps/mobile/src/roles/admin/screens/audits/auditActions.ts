/**
 * The write side of the three legacy audit screens (ScheduleNewAuditScreen,
 * AuditInspectionScreen, BulkRescheduleAuditsScreen), as plain functions with
 * no React and no react-native, so plain-Node vitest covers every branch
 * (tests/audit_actions_*.test.ts).
 *
 * Nothing here decides a business threshold. Category list, per-category
 * maximum, total, tier and status all come from the server's response. The
 * audit start time is picked by the admin (no default is ever substituted).
 */
import type {
  AuditBulkRescheduleBody,
  AuditBulkRescheduleResultDto,
  AuditCreateBody,
  AuditDetailDto,
  AuditScoreInput,
  AuditStatus,
  AuditType,
  AuditBulkRescheduleItem,
} from '../../api/audits';
import { ApiError } from '../../../../shell/api/client';
import { t, type TranslationKey } from '../../i18n';
import { AGENCY_NAME_MAX, AGENCY_NAME_MIN, parseDayInput, parseTimeInput, toScheduledFor } from './auditScheduleFormat';

/** A key of the i18n catalogue for these actions (admin/i18n/en.json, `admin.auditActions.*`). */
export type AuditActionKey = Extract<TranslationKey, `admin.auditActions.${string}`>;

/** An IST calendar date picked on the inline calendar (month is 0-based, like Date). */
export function istDayText(day: number, month0: number, year: number): string {
  return `${String(day).padStart(2, '0')}/${String(month0 + 1).padStart(2, '0')}/${year}`;
}

/** True when the admin has typed a start time the API can use ("10:30 AM", "14:30"). Empty is not a time. */
export function isStartTimePicked(timeText: string): boolean {
  return parseTimeInput(timeText) !== null;
}

function istDateInvalid(day: number, month0: number, year: number): boolean {
  return parseDayInput(istDayText(day, month0, year)) === null;
}

/**
 * The ISO instant (+05:30, Asia/Kolkata) for a picked date at the admin's
 * chosen time, or null for a non-date or a missing/invalid time. The server
 * derives the fiscal quarter from it in IST (BR-03). No time is ever invented.
 */
export function scheduledForDate(day: number, month0: number, year: number, timeText: string): string | null {
  return toScheduledFor(istDayText(day, month0, year), timeText);
}

// ---------------------------------------------------------------------------
// Schedule New Audit  ->  POST /admin/audits
// ---------------------------------------------------------------------------

export interface QuickScheduleInput {
  farmerId: string | null;
  auditType: AuditType;
  externalAgencyName: string;
  day: number;
  month0: number;
  year: number;
  /** The start time the admin typed, e.g. "10:30 AM"; IST. */
  startTime: string;
}

export type ActionBody<B> = { ok: true; body: B } | { ok: false; errorKey: AuditActionKey };

/**
 * POST /admin/audits body. fiscalYear/quarter are never sent (server-derived).
 * EXTERNAL requires the agency name and INTERNAL never sends one; an INTERNAL
 * audit is created with no auditor ("may leave auditorUserId unassigned until
 * start"), because the app has no list of auditor accounts to pick from.
 */
export function buildQuickScheduleBody(input: QuickScheduleInput): ActionBody<AuditCreateBody> {
  if (input.farmerId === null) return { ok: false, errorKey: 'admin.auditActions.schedule.farmerRequired' };
  if (istDateInvalid(input.day, input.month0, input.year)) return { ok: false, errorKey: 'admin.auditActions.schedule.dateInvalid' };
  const scheduledFor = scheduledForDate(input.day, input.month0, input.year, input.startTime);
  if (scheduledFor === null) return { ok: false, errorKey: 'admin.auditActions.schedule.timeInvalid' };
  const body: AuditCreateBody = { farmerId: input.farmerId, auditType: input.auditType, scheduledFor };
  if (input.auditType === 'EXTERNAL') {
    const agency = input.externalAgencyName.trim();
    if (agency.length < AGENCY_NAME_MIN || agency.length > AGENCY_NAME_MAX) {
      return { ok: false, errorKey: 'admin.auditActions.schedule.agencyInvalid' };
    }
    body.externalAgencyName = agency;
  }
  return { ok: true, body };
}

// ---------------------------------------------------------------------------
// Audit Inspection  ->  start, scores, finding, complete
// ---------------------------------------------------------------------------

/** The server calls the inspection makes, in the order it makes them. */
export type InspectionStep = 'start' | 'scores' | 'finding' | 'complete';

export const INSPECTION_STEP_ORDER: readonly InspectionStep[] = ['start', 'scores', 'finding', 'complete'];

/**
 * What has already landed on the server for one inspection, kept across
 * retries so a retry continues instead of repeating:
 *   - `started`     POST /start accepted (or the audit was found IN_PROGRESS);
 *   - `scoresKey`   fingerprint of the last PUT /scores body (a PUT is an
 *                   upsert, so an edited sheet is sent again, an unchanged one is not);
 *   - `findingDone` the MAJOR finding was created. POST /findings is not
 *                   idempotent and has no delete, so it is sent at most once.
 */
export interface InspectionProgress {
  started: boolean;
  scoresKey: string | null;
  findingDone: boolean;
}

export function newInspectionProgress(): InspectionProgress {
  return { started: false, scoresKey: null, findingDone: false };
}

export interface InspectionInput {
  auditId: string;
  /** The status the screen loaded; SCHEDULED is started first, IN_PROGRESS goes straight to scoring. */
  status: AuditStatus;
  /** One score per category, all of them (a missing category is incomplete, never zero, BR-06). */
  scores: AuditScoreInput[];
  /** The auditor's overall remarks; saved with the scores. */
  summary?: string | undefined;
  /** Present when the auditor flagged a major violation: logged as a MAJOR finding (BR-05a). */
  majorFindingDescription?: string | undefined;
}

export interface InspectionDeps {
  startAudit: (auditId: string) => Promise<AuditDetailDto>;
  setAuditScores: (auditId: string, body: { scores: AuditScoreInput[]; summary?: string }) => Promise<AuditDetailDto>;
  createAuditFinding: (auditId: string, body: { severity: 'MAJOR'; description: string }) => Promise<unknown>;
  completeAudit: (auditId: string) => Promise<AuditDetailDto>;
  getAudit: (auditId: string) => Promise<AuditDetailDto>;
}

/**
 * The inspection stopped part-way. `step` is the call that failed, `saved` the
 * steps that DID land (their data is on the server even though the audit is not
 * completed), `cause` the original error for adminErrorKey.
 */
export class InspectionStepError extends Error {
  constructor(
    readonly step: InspectionStep,
    readonly saved: readonly InspectionStep[],
    override readonly cause: unknown,
  ) {
    super(`Inspection failed at ${step}`);
    this.name = 'InspectionStepError';
  }
}

function isInvalidTransition(err: unknown): boolean {
  return err instanceof ApiError && err.is('INVALID_STATE_TRANSITION');
}

function savedSteps(progress: InspectionProgress, input: InspectionInput): InspectionStep[] {
  const saved: InspectionStep[] = [];
  if (progress.started) saved.push('start');
  if (progress.scoresKey !== null) saved.push('scores');
  if (progress.findingDone && input.majorFindingDescription !== undefined) saved.push('finding');
  return saved;
}

function scoresKeyOf(input: InspectionInput): string {
  return JSON.stringify({ s: input.scores, m: input.summary ?? null });
}

/**
 * The inspection, in the only order the API allows:
 *
 *   1. POST /start      SCHEDULED -> IN_PROGRESS. Scores and findings are 409 on
 *                       any other status, so this comes first (skipped when the
 *                       audit is already IN_PROGRESS).
 *   2. PUT  /scores     all categories, upserted, with the overall remarks.
 *   3. POST /findings   a MAJOR finding when one was flagged. Before /complete
 *                       because completion counts the MAJOR findings into
 *                       majorViolationsCount (BR-05a).
 *   4. POST /complete   totals, tiers and finishes (BR-04, BR-06); 422
 *                       AUDIT_INCOMPLETE if a category has no score.
 *
 * No step is a transaction with the others, so a failure at step N leaves steps
 * before it saved. The runner never reports success: it resolves only with the
 * COMPLETED audit the server returned from step 4, and otherwise throws an
 * InspectionStepError naming the failed step and what had already landed. A
 * retry resumes from `progress` (see InspectionProgress).
 *
 * A 409 INVALID_STATE_TRANSITION on start or complete can mean an earlier
 * attempt DID land and only its response was lost; the audit is re-read and,
 * when it is in the state the step wanted, that counts as done (the same
 * "found on a re-read" rule as orders/orderActions.ts). Anything else throws.
 */
export async function runInspection(
  input: InspectionInput,
  progress: InspectionProgress,
  deps: InspectionDeps,
): Promise<AuditDetailDto> {
  const fail = (step: InspectionStep, cause: unknown): never => {
    throw new InspectionStepError(step, savedSteps(progress, input), cause);
  };

  if (input.status !== 'SCHEDULED' && input.status !== 'IN_PROGRESS') {
    // Completed or cancelled: nothing to start or score. The screen blocks this; guard anyway.
    return fail('start', new Error(`Audit is ${input.status}`));
  }

  if (input.status === 'SCHEDULED' && !progress.started) {
    try {
      await deps.startAudit(input.auditId);
      progress.started = true;
    } catch (err) {
      if (!isInvalidTransition(err)) return fail('start', err);
      try {
        const current = await deps.getAudit(input.auditId);
        if (current.status !== 'IN_PROGRESS') return fail('start', err);
        progress.started = true;
      } catch {
        // The re-read failed too: report the original refusal.
        return fail('start', err);
      }
    }
  }

  const key = scoresKeyOf(input);
  if (progress.scoresKey !== key) {
    try {
      await deps.setAuditScores(input.auditId, {
        scores: input.scores,
        ...(input.summary !== undefined ? { summary: input.summary } : {}),
      });
      progress.scoresKey = key;
    } catch (err) {
      return fail('scores', err);
    }
  }

  if (input.majorFindingDescription !== undefined && !progress.findingDone) {
    try {
      await deps.createAuditFinding(input.auditId, { severity: 'MAJOR', description: input.majorFindingDescription });
      progress.findingDone = true;
    } catch (err) {
      return fail('finding', err);
    }
  }

  try {
    return await deps.completeAudit(input.auditId);
  } catch (err) {
    if (isInvalidTransition(err)) {
      try {
        const current = await deps.getAudit(input.auditId);
        if (current.status === 'COMPLETED') return current;
      } catch {
        // Fall through: report the original refusal, not the failed re-read.
      }
    }
    return fail('complete', err);
  }
}

/** Why the inspection cannot be submitted yet, or null when it can. */
export function inspectionBlocker(args: {
  status: AuditStatus | undefined;
  scores: ReadonlyArray<number | null>;
  violation: boolean;
  notes: string;
}): AuditActionKey | null {
  if (args.status === 'COMPLETED' || args.status === 'CANCELLED') return 'admin.auditActions.inspection.notConductable';
  if (args.scores.length === 0 || args.scores.some((s) => s === null)) return 'admin.auditActions.inspection.categoryRequired';
  if (args.violation) {
    const len = args.notes.trim().length;
    if (len < FINDING_DESCRIPTION_MIN || len > FINDING_DESCRIPTION_MAX) return 'admin.auditActions.inspection.violationNeedsNote';
  }
  return null;
}

/** docs/openapi.yaml AuditFindingCreate.description length bounds. */
export const FINDING_DESCRIPTION_MIN = 3;
export const FINDING_DESCRIPTION_MAX = 2000;
/** docs/openapi.yaml AuditScoresUpdate.summary maxLength. */
export const SUMMARY_MAX = 4000;

/** The score sheet as it goes to PUT /scores: every category, in the order the server listed them. */
export function toScoreInputs(
  categories: ReadonlyArray<{ categoryCode: AuditScoreInput['categoryCode'] }>,
  values: Readonly<Record<string, number | null>>,
): AuditScoreInput[] {
  const out: AuditScoreInput[] = [];
  for (const c of categories) {
    const v = values[c.categoryCode];
    if (v !== null && v !== undefined) out.push({ categoryCode: c.categoryCode, score: v });
  }
  return out;
}

export function stepLabel(step: InspectionStep): string {
  return t(`admin.auditActions.inspection.step.${step}` as TranslationKey);
}

// ---------------------------------------------------------------------------
// Bulk Reschedule  ->  POST /admin/audits/bulk-reschedule
// ---------------------------------------------------------------------------

/** The most audits one bulk request may carry (docs/openapi.yaml AuditBulkRescheduleRequest.items.maxItems). */
export const BULK_RESCHEDULE_MAX_ITEMS = 100;

export type BulkDateChoice = { mode: 'shift'; days: number } | { mode: 'custom'; day: number; month0: number; year: number; startTime: string };

/**
 * Every item carries `expectedScheduledFor` (the date the admin saw), which is
 * what makes a replay of a `shiftDays` request safe instead of shifting twice;
 * the server reports such an item as CONFLICT. The request has no Idempotency-Key
 * (none moves money, root CLAUDE.md 2.4); this body field is the guard the
 * spec gives it.
 */
export function buildBulkBody(
  audits: ReadonlyArray<{ id: string; scheduledFor: string }>,
  date: BulkDateChoice,
  reason: string,
): ActionBody<AuditBulkRescheduleBody> {
  if (audits.length === 0) return { ok: false, errorKey: 'admin.auditActions.bulk.noneSelected' };
  if (audits.length > BULK_RESCHEDULE_MAX_ITEMS) return { ok: false, errorKey: 'admin.auditActions.bulk.tooMany' };
  const items: AuditBulkRescheduleItem[] = audits.map((a) => ({ auditId: a.id, expectedScheduledFor: a.scheduledFor }));
  const trimmed = reason.trim();
  const base = { items, ...(trimmed !== '' ? { reason: trimmed } : {}) };
  if (date.mode === 'shift') return { ok: true, body: { ...base, shiftDays: date.days } };
  if (istDateInvalid(date.day, date.month0, date.year)) return { ok: false, errorKey: 'admin.auditActions.bulk.dateInvalid' };
  const newScheduledFor = scheduledForDate(date.day, date.month0, date.year, date.startTime);
  if (newScheduledFor === null) return { ok: false, errorKey: 'admin.auditActions.bulk.timeInvalid' };
  return { ok: true, body: { ...base, newScheduledFor } };
}

export interface BulkOutcome {
  rescheduledCount: number;
  failedCount: number;
  /** Failed audits with the server's reason code, for the per-row message. */
  failed: Array<{ auditId: string; code: string | null }>;
}

/** Reads the per-audit outcome; the batch may partially succeed (BR-03), so success is never assumed from a 200. */
export function summariseBulk(result: AuditBulkRescheduleResultDto): BulkOutcome {
  const failed = result.results
    .filter((r) => r.outcome === 'FAILED')
    .map((r) => ({ auditId: r.auditId, code: r.code ?? null }));
  return { rescheduledCount: result.rescheduledCount, failedCount: result.failedCount, failed };
}
