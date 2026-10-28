/**
 * The Goods Receiving wizard's own decisions (design M2-05 … M2-14), apart
 * from the screen so plain-Node vitest covers every branch
 * (../../../tests/receiving_wizard.test.ts). The data layer it builds on is
 * ./mappers.ts (bodies, labels), ./receivingViews.ts (derived views) and
 * ./submission.ts (the two writes); nothing here fetches.
 *
 * What lives here, and why each is a decision rather than wiring:
 *   - the checklist: what the three buttons per point (Pass / Needs Attention
 *     / Fail) send as a QualityCheckItemCreate (BR-120);
 *   - the decision and WHERE phase 2 runs: the quality check stocks the batch
 *     and copies its storage location in one call (BR-106), so it runs at the
 *     storage confirm when a batch will be stocked, else at the summary;
 *   - resuming a receipt that already exists, so an order is never received
 *     twice (BR-118);
 *   - the session's damage / mismatch reports (BR-121) and which of them are
 *     already persisted, so each is sent once;
 *   - the result views and the receipt activity, which show only what the
 *     API recorded (a batch code exists only once the server assigned one).
 *
 * Weights are integer grams; null = not known / not decided (the screen
 * hides it, never a 0 or a sample).
 */
import type { Grade } from '../../../api/inventory';
import type {
  GoodsReceiptDiscrepancyCreate,
  GoodsReceiptDiscrepancyType,
  GoodsReceiptDto,
  QcConditionLevel,
  QcRejectionReasonCode,
  QualityCheckResultDto,
  QualityOutcome,
} from '../../../api/receiving';
import { t, type TranslationKey } from '../../../i18n';
import { formatAdminDate } from '../../../utils/datetime';
import type { LiveDiscrepancy, LiveQcResult, LiveReceiptDetail, QcCriterionId } from './liveTypes';
import {
  discrepancyTypeLabel,
  gradeLabel,
  grams,
  kgLabel,
  QC_ORDER,
  rejectionReasonLabel,
  text,
  type QcDraft,
  type QcPointDraft,
} from './mappers';
import { deriveDiscrepancies, type DiscrepancyInput, type GradeVerification } from './receivingViews';
import { initialSubmissionState, type SubmissionState } from './submission';
import type { QcCriterion, ReceivingOutcome } from './types';

// ─── M2-07 Quality Check ─────────────────────────────────────────────────────

const QC_TITLE_KEYS: Record<QcCriterionId, TranslationKey> = {
  appearance: 'receiving.wizard.qc.appearance',
  size: 'receiving.wizard.qc.size',
  moisture: 'receiving.wizard.qc.moisture',
  damage: 'receiving.wizard.qc.damage',
  freshness: 'receiving.wizard.qc.freshness',
};

const QC_ICONS: Record<QcCriterionId, QcCriterion['icon']> = {
  appearance: 'eye',
  size: 'ruler',
  moisture: 'drop',
  damage: 'bug',
  freshness: 'leaf',
};

export interface WizardQcCriterion {
  id: QcCriterionId;
  /** "01 — REQUIRED". */
  code: string;
  title: string;
  icon: QcCriterion['icon'];
}

/** The five checklist rows, one per QualityCheckParameter, in the order the API stores them (QC_ORDER). */
export function wizardQcCriteria(): WizardQcCriterion[] {
  return QC_ORDER.map((id, idx) => ({
    id,
    code: t('receiving.wizard.qc.code', { n: String(idx + 1).padStart(2, '0') }),
    title: t(QC_TITLE_KEYS[id]),
    icon: QC_ICONS[id],
  }));
}

/** The checklist as it opens: every point on Pass, as the design pre-selects it. */
export const ALL_PASS: Readonly<Record<QcCriterionId, LiveQcResult>> = {
  appearance: 'pass',
  size: 'pass',
  moisture: 'pass',
  damage: 'pass',
  freshness: 'pass',
};

/**
 * JUDGMENT CALL (reported): the API stores a point as passed / not passed,
 * plus an optional condition level. "Needs Attention" and "Fail" both fail the
 * point; the condition keeps which of the two the admin picked, so the record
 * says more than "failed". The levels are the API's own reference values.
 */
const RESULT_CONDITION: Record<Exclude<LiveQcResult, 'pass'>, QcConditionLevel> = {
  attention: 'FAIR',
  fail: 'POOR',
};

export function qcPointsOf(results: Readonly<Record<QcCriterionId, LiveQcResult>>): Record<QcCriterionId, QcPointDraft> {
  const out = {} as Record<QcCriterionId, QcPointDraft>;
  for (const id of QC_ORDER) {
    const result = results[id];
    out[id] = result === 'pass' ? { result } : { result, condition: RESULT_CONDITION[result] };
  }
  return out;
}

export function qcIssueCountOf(results: Readonly<Record<QcCriterionId, LiveQcResult>>): number {
  return QC_ORDER.filter((id) => results[id] !== 'pass').length;
}

/** The one-page review's checklist: a ticked parameter passed, an unticked one failed. */
export function reviewQcResults(checked: Readonly<Record<QcCriterionId, boolean>>): Record<QcCriterionId, LiveQcResult> {
  const out = {} as Record<QcCriterionId, LiveQcResult>;
  for (const id of QC_ORDER) out[id] = checked[id] ? 'pass' : 'fail';
  return out;
}

// ─── M2-10 / M2-11 Decision ──────────────────────────────────────────────────

/** The decision a split means; null until both weights are known. */
export function outcomeOf(grossGrams: number | null, acceptedGrams: number | null): ReceivingOutcome | null {
  if (grossGrams === null || acceptedGrams === null) return null;
  if (acceptedGrams === 0) return 'Reject';
  if (acceptedGrams >= grossGrams) return 'Accept';
  return 'Partial Accept';
}

/** M2-11: Accepted + Rejected = Received, and a partial keeps something on both sides. */
export function isValidPartial(grossGrams: number | null, acceptedGrams: number | null): boolean {
  return grossGrams !== null && acceptedGrams !== null && acceptedGrams > 0 && acceptedGrams < grossGrams;
}

/** Where the quality check (phase 2) is sent from. */
export type Phase2Place = 'storage' | 'summary' | 'none';

export interface Phase2Input {
  canQc: boolean;
  canBatch: boolean;
  acceptedGrams: number | null;
  assignedGrade: Grade;
}

/**
 * BR-106: the check stocks a batch only for an accepted weight above zero at
 * a grade other than REJECT, and copies the storage location onto it. So the
 * check is sent at the storage confirm (M2-14) when a batch will be stocked
 * and the admin may place it (inventory.batch.assign); otherwise nothing is
 * put away and it is sent at the summary confirm (M2-12). Without
 * inventory.quality_check.perform there is no check: the receipt stays
 * awaiting QC.
 */
export function phase2Placement({ canQc, canBatch, acceptedGrams, assignedGrade }: Phase2Input): Phase2Place {
  if (!canQc) return 'none';
  const stocks = acceptedGrams !== null && acceptedGrams > 0 && assignedGrade !== 'REJECT';
  return stocks && canBatch ? 'storage' : 'summary';
}

export interface WizardQcInput {
  assignedGrade: Grade;
  grossGrams: number | null;
  acceptedGrams: number | null;
  results: Readonly<Record<QcCriterionId, LiveQcResult>>;
  rejectionReasonCode?: QcRejectionReasonCode | undefined;
  /** The partial acceptance's free-text note. */
  rejectionNote?: string | undefined;
  /** BR-106: the chosen storage location's code. */
  storageLocationCode?: string | undefined;
}

/**
 * The wizard's QcDraft (./mappers.ts buildQualityCheckBody / qcDraftProblem).
 * The wizard has no moisture, visual score, defect notes, damaged or spoiled
 * inputs, so those are not sent. A reason travels only with a rejected weight.
 */
export function wizardQcDraft(input: WizardQcInput): QcDraft {
  const rejected = input.grossGrams === null || input.acceptedGrams === null ? null : input.grossGrams - input.acceptedGrams;
  const rejecting = rejected !== null && rejected > 0;
  return {
    assignedGrade: input.assignedGrade,
    grossGrams: input.grossGrams,
    acceptedGrams: input.acceptedGrams,
    points: qcPointsOf(input.results),
    moisturePct: '',
    visualScore: '',
    defectNotes: '',
    rejectionReasonCode: rejecting ? input.rejectionReasonCode : undefined,
    rejectionNote: rejecting ? input.rejectionNote : undefined,
    storageLocationCode: input.storageLocationCode,
  };
}

// ─── Resume (BR-118) ─────────────────────────────────────────────────────────

/**
 * The submission state to start from once the reads arrive: the receipt the
 * host asked to resume, else the order's receipt still awaiting QC. A receipt
 * that already has its check is seeded as done, so no second check is sent.
 * null = keep the current state (the session already has a receipt, or may
 * have sent a create whose outcome is unknown, or there is nothing to resume).
 */
export function seedSubmission(
  state: SubmissionState,
  resume: GoodsReceiptDto | undefined,
  pending: GoodsReceiptDto | undefined,
): SubmissionState | null {
  if (state.receipt !== null || state.heldCreate !== null) return null;
  const receipt = resume ?? pending;
  if (receipt === undefined) return null;
  const seeded = initialSubmissionState(receipt);
  return receipt.status === 'AWAITING_QC' ? seeded : { ...seeded, qcDone: true };
}

// ─── M2-09 Damage / Mismatch (BR-121) ────────────────────────────────────────

/** docs/openapi.yaml GoodsReceiptDiscrepancyCreate bounds (the API's schema, not business thresholds). */
const SIDE_MAX = 200;
const NOTE_MAX = 500;

/** The report types an admin may pick (docs/openapi.yaml GoodsReceiptDiscrepancyType). */
export const DISCREPANCY_TYPES: readonly GoodsReceiptDiscrepancyType[] = ['QUANTITY', 'QUALITY', 'CROP_MISMATCH', 'DAMAGE', 'OTHER'];

export interface ManualReport {
  type: GoodsReceiptDiscrepancyType;
  description: string;
}

export type DiscrepancyContext = Pick<DiscrepancyInput, 'product' | 'expectedGrams' | 'receivedGrams' | 'listedGrade' | 'assignedGrade'>;

/**
 * JUDGMENT CALL (reported): the report the admin describes on the Sub form.
 * `expected` / `actual` come from what the order and the receipt say where the
 * type has such facts (weights, grades); otherwise `actual` is what the admin
 * wrote. The description is always the note. null without a description.
 */
export function manualDiscrepancyBody(report: ManualReport, ctx: DiscrepancyContext): GoodsReceiptDiscrepancyCreate | null {
  const description = text(report.description);
  if (description === undefined) return null;
  const written = description.slice(0, SIDE_MAX);
  const note = description.slice(0, NOTE_MAX);
  const side = (expected: string, actual: string): GoodsReceiptDiscrepancyCreate => ({ type: report.type, expected, actual, note });
  switch (report.type) {
    case 'QUANTITY':
      return side(
        ctx.expectedGrams === null ? ctx.product : kgLabel(ctx.expectedGrams),
        ctx.receivedGrams === null ? written : kgLabel(ctx.receivedGrams),
      );
    case 'QUALITY':
      return ctx.listedGrade !== undefined && ctx.listedGrade !== ctx.assignedGrade
        ? side(gradeLabel(ctx.listedGrade), gradeLabel(ctx.assignedGrade))
        : side(t('receiving.discrepancy.expectedPass'), written);
    case 'DAMAGE':
      return side(t('receiving.discrepancy.expectedSound'), written);
    default:
      return side(ctx.product, written);
  }
}

function withNote(body: GoodsReceiptDiscrepancyCreate, note: string | undefined): GoodsReceiptDiscrepancyCreate {
  if (note === undefined) return body;
  const joined = body.note === undefined ? note : `${body.note}\n${note}`;
  return { ...body, note: joined.slice(0, NOTE_MAX) };
}

/**
 * The session's reports: the ones derived from what was recorded
 * (deriveDiscrepancies), the grade-mismatch note on the grade report only,
 * and the admin's own report joined to a derived one of the same type (else
 * added), so one finding is one report.
 */
export function sessionDiscrepancyBodies(
  input: DiscrepancyInput,
  gradeNote: string,
  manual: GoodsReceiptDiscrepancyCreate | null,
): GoodsReceiptDiscrepancyCreate[] {
  const bodies = deriveDiscrepancies(input);
  const note = text(gradeNote);
  if (note !== undefined && input.listedGrade !== undefined && input.listedGrade !== input.assignedGrade) {
    const expected = gradeLabel(input.listedGrade);
    const actual = gradeLabel(input.assignedGrade);
    const idx = bodies.findIndex((b) => b.type === 'QUALITY' && b.expected === expected && b.actual === actual);
    const grade = bodies[idx];
    if (grade !== undefined) bodies[idx] = withNote(grade, note);
  }
  if (manual !== null) {
    const idx = bodies.findIndex((b) => b.type === manual.type);
    const same = bodies[idx];
    if (same !== undefined) bodies[idx] = withNote(same, manual.note);
    else bodies.push(manual);
  }
  return bodies;
}

type ReportFacts = Pick<GoodsReceiptDiscrepancyCreate, 'type' | 'expected' | 'actual'>;

function sameFinding(a: ReportFacts, b: ReportFacts): boolean {
  return a.type === b.type && a.expected === b.expected && a.actual === b.actual;
}

/**
 * The reports still to send: a report the receipt already has (same type,
 * expected and actual, whoever sent it) is not sent again, and the list has
 * no duplicates.
 */
export function pendingBodies(bodies: readonly GoodsReceiptDiscrepancyCreate[], persisted: readonly ReportFacts[]): GoodsReceiptDiscrepancyCreate[] {
  const out: GoodsReceiptDiscrepancyCreate[] = [];
  for (const body of bodies) {
    if (persisted.some((p) => sameFinding(p, body)) || out.some((o) => sameFinding(o, body))) continue;
    out.push(body);
  }
  return out;
}

/** One row of the Damage / Mismatch list; id / creator / created only once persisted. */
export interface DiscrepancyRow {
  key: string;
  id?: string | undefined;
  type: GoodsReceiptDiscrepancyType;
  typeLabel: string;
  expected: string;
  actual: string;
  note?: string | undefined;
  statusLabel: string;
  createdBy?: string | undefined;
  createdOn?: string | undefined;
}

/** The persisted reports (the GET, then what this session created and the GET does not show yet), then the ones to send. */
export function discrepancyRows(
  persisted: readonly LiveDiscrepancy[],
  created: readonly LiveDiscrepancy[],
  pending: readonly GoodsReceiptDiscrepancyCreate[],
): DiscrepancyRow[] {
  const all = [...persisted, ...created.filter((c) => !persisted.some((p) => p.id === c.id))];
  return [
    ...all.map(
      (d): DiscrepancyRow => ({
        key: d.id,
        id: d.id,
        type: d.type,
        typeLabel: d.typeLabel,
        expected: d.expected,
        actual: d.actual,
        note: d.note,
        statusLabel: d.statusLabel,
        createdBy: d.createdBy,
        createdOn: d.createdOn,
      }),
    ),
    ...pending.map(
      (b, idx): DiscrepancyRow => ({
        key: `pending-${idx}`,
        type: b.type,
        typeLabel: discrepancyTypeLabel(b.type),
        expected: b.expected,
        actual: b.actual,
        note: text(b.note),
        statusLabel: t('receiving.discrepancyStatus.OPEN'),
      }),
    ),
  ];
}

/** The leading block of a report's uuid: a short form that is still the real id. */
export function shortId(id: string): string {
  const head = id.split('-')[0];
  return head === undefined || head === '' ? id : head;
}

// ─── M2-08B Grade summary ────────────────────────────────────────────────────

export interface GradeSummary {
  text: string;
  tone: 'success' | 'warning' | 'muted';
}

export function gradeSummaryOf(check: GradeVerification): GradeSummary {
  if (check.status === 'match') return { text: t('receiving.wizard.gradeSummary.match'), tone: 'success' };
  if (check.status === 'mismatch') return { text: t('receiving.wizard.gradeSummary.mismatch'), tone: 'warning' };
  return { text: t('receiving.wizard.gradeSummary.noListed'), tone: 'muted' };
}

// ─── Results after the submit ────────────────────────────────────────────────

export type ResultVariant = 'accept' | 'partial' | 'reject' | 'awaiting';

export interface WizardResult {
  variant: ResultVariant;
  acceptedGrams: number | null;
  rejectedGrams: number | null;
  /** BR-106: the stocked batch; absent until the server assigned one. */
  batchId?: string | undefined;
  batchCode?: string | undefined;
  /** The storage location code copied onto the batch (the check's answer only). */
  storageLocation?: string | undefined;
  reasonLabel?: string | undefined;
  /** Checklist points that did not pass; null when the points are not known. */
  failedPoints: number | null;
}

const OUTCOME_VARIANT: Record<QualityOutcome, ResultVariant> = {
  ACCEPTED: 'accept',
  PARTIALLY_ACCEPTED: 'partial',
  REJECTED: 'reject',
};

const RESULT_VARIANT: Partial<Record<LiveReceiptDetail['result'], ResultVariant>> = {
  Accepted: 'accept',
  'Partially Accepted': 'partial',
  Rejected: 'reject',
};

function strip<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

/**
 * What the confirmation views show: this session's check answer first (it
 * carries the batch and its location, BR-106), else the receipt as read back
 * (resumed, or checked elsewhere), else "recorded, QC pending" for a receipt
 * without its check. null before there is any receipt.
 */
export function wizardResultOf(qc: QualityCheckResultDto | null, receipt: LiveReceiptDetail | undefined): WizardResult | null {
  if (qc !== null) {
    const check = qc.qualityCheck;
    const code = check.rejectionReasonCode ?? undefined;
    return strip({
      variant: OUTCOME_VARIANT[check.outcome] ?? 'awaiting',
      acceptedGrams: grams(check.acceptedQtyKg),
      rejectedGrams: grams(check.rejectedQtyKg),
      batchId: text(qc.batch?.id),
      batchCode: text(qc.batch?.batchCode),
      storageLocation: text(qc.batch?.storageLocation),
      reasonLabel: code === undefined ? text(receipt?.rejectionReason) : rejectionReasonLabel(code),
      failedPoints: check.items === undefined ? null : check.items.filter((i) => !i.passed).length,
    });
  }
  if (receipt === undefined) return null;
  const check = receipt.qualityCheck;
  const variant = check !== null ? OUTCOME_VARIANT[check.outcome] : RESULT_VARIANT[receipt.result];
  if (variant === undefined) return { variant: 'awaiting', acceptedGrams: null, rejectedGrams: null, failedPoints: null };
  return strip({
    variant,
    acceptedGrams: receipt.acceptedGrams,
    rejectedGrams: receipt.rejectedGrams,
    batchId: receipt.batchId,
    batchCode: receipt.batchCode,
    reasonLabel: check?.rejectionReasonLabel ?? receipt.rejectionReason,
    failedPoints: check === null ? null : check.points.filter((p) => !p.passed).length,
  });
}

/** The lot a counter-offer is about: the accepted weight once known, else the received weight. */
export function counterQuantityGrams(result: WizardResult | null, acceptedGrams: number | null, grossGrams: number | null): number | null {
  return result?.acceptedGrams ?? acceptedGrams ?? grossGrams;
}

const OUTCOME_TITLE: Record<Exclude<ResultVariant, 'awaiting'>, TranslationKey> = {
  accept: 'receiving.wizard.outcome.accept',
  partial: 'receiving.wizard.outcome.partial',
  reject: 'receiving.wizard.outcome.reject',
};

export interface ActivityEvent {
  key: 'recorded' | 'checked' | 'decision' | 'batch';
  title: string;
  time: string;
}

/**
 * M2-12C: the receipt's events as the API recorded them: the receipt (with
 * its weight) at receivedAt, then its check, decision and batch at the
 * check's time. `checkedAt` is this session's check answer, used until the
 * read carries the check. No time is ever invented.
 */
export function receiptActivity(
  receipt: LiveReceiptDetail | undefined,
  result: WizardResult | null,
  now: Date,
  checkedAt?: string | undefined,
): ActivityEvent[] {
  if (receipt === undefined) return [];
  const events: ActivityEvent[] = [
    { key: 'recorded', title: t('receiving.wizard.activity.quantityVerified'), time: formatAdminDate(receipt.receivedAt, now) },
  ];
  const at = receipt.qualityCheck?.checkedAt ?? checkedAt;
  if (at === undefined || result === null || result.variant === 'awaiting') return events;
  const time = formatAdminDate(at, now);
  const by = receipt.qualityCheck?.checkedBy;
  events.push({
    key: 'checked',
    title: by === undefined ? t('receiving.wizard.activity.qualityChecked') : t('receiving.wizard.activity.qualityCheckedBy', { name: by }),
    time,
  });
  events.push({ key: 'decision', title: t('receiving.wizard.activity.decision', { outcome: t(OUTCOME_TITLE[result.variant]) }), time });
  if (result.batchCode !== undefined) events.push({ key: 'batch', title: t('receiving.wizard.activity.batch', { code: result.batchCode }), time });
  return events;
}
