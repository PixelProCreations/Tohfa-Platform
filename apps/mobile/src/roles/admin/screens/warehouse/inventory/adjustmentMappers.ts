/**
 * Pure decisions behind the stock count (BR-107) and stock adjustment (BR-37)
 * screens: DTO -> view mapping, request bodies, which actions to draw, and
 * which message an action error shows. No React, so plain-Node vitest covers
 * all of it (../../../tests/mappers_stockAdjustments.test.ts).
 *
 * Quantities become integer grams at this boundary (money/quantity.ts) and go
 * back to the server as kg strings with gramsToKgString, so a signed delta or
 * a variance never passes through a float.
 *
 * `can` only decides what to draw. The server authorises every call again
 * (root CLAUDE.md 2.1): a Sub admin pressing a stale Approve still gets 403.
 */
import { ApiError } from '../../../../../shell/api/client';
import { adminErrorKey } from '../../../api/errors';
import {
  ADJUSTMENT_REASON_MAX,
  ADJUSTMENT_REASON_MIN,
  LOSS_ONLY_ADJUSTMENT_TYPES,
  REJECT_REASON_MAX,
  STOCK_ADJUSTMENT_TYPES,
  type StockAdjustmentCreate,
  type StockAdjustmentDto,
  type StockAdjustmentStatus,
  type StockAdjustmentType,
} from '../../../api/stockAdjustments';
import {
  VERIFICATION_NOTES_MAX,
  type StockVerificationCreate,
  type StockVerificationDto,
  type StockVerificationStatus,
} from '../../../api/stockVerifications';
import { t, type TranslationKey } from '../../../i18n';
import { formatKg, gramsToKgString, parseKgToGrams } from '../../../money/quantity';
import type { AdminTone } from '../../../theme';
import { formatAdminDate } from '../../../utils/datetime';
import { gradeLabel, productLabelOf, signedKg } from './mappers';
import type { PermissionCheck } from './types';

/** The docs/rbac.json codes these screens check. */
export const STOCK_CODES = {
  /** Raise an adjustment, and read the list and detail (the server reuses it for reads). */
  adjustmentCreate: 'inventory.stock_adjustment.create',
  /** Approve or reject (SA, TOHFA, MAIN; a Sub admin holds none, BR-37a). */
  adjustmentApprove: 'inventory.stock_adjustment.approve',
  /** Record a count, and read counts. */
  verificationPerform: 'inventory.stock_verification.perform',
} as const;

function has<K extends string>(table: Record<K, unknown>, value: string): value is K {
  return Object.prototype.hasOwnProperty.call(table, value);
}

/** "Carrot · Grade 1" when the crop is named among the loaded batches, else just the grade. */
function productOf(cropNames: ReadonlyMap<string, string>, cropId: string, grade: string): string {
  const name = cropNames.get(cropId);
  return name === undefined ? gradeLabel(grade) : productLabelOf(name, grade);
}

/** A short reference for a uuid the screens have no human code for ("3F2A9C1B"). */
export function shortRef(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase();
}

/** The next page number of an offset list, or undefined when the last page is loaded. */
export function nextPageNumber(last: { page: number; pageSize: number; total: number; items: readonly unknown[] }): number | undefined {
  if (last.items.length === 0) return undefined;
  return last.page * last.pageSize < last.total ? last.page + 1 : undefined;
}

// ─── Adjustments ─────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<StockAdjustmentStatus, TranslationKey> = {
  PENDING: 'stockAdj.status.PENDING',
  APPROVED: 'stockAdj.status.APPROVED',
  REJECTED: 'stockAdj.status.REJECTED',
};

const STATUS_TONE: Record<StockAdjustmentStatus, AdminTone> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

const TYPE_LABEL: Record<StockAdjustmentType, TranslationKey> = {
  DAMAGE: 'stockAdj.type.DAMAGE',
  SHRINKAGE: 'stockAdj.type.SHRINKAGE',
  COUNT_CORRECTION: 'stockAdj.type.COUNT_CORRECTION',
  EXPIRY: 'stockAdj.type.EXPIRY',
};

export function adjustmentStatusLabel(status: string): string {
  return t(has(STATUS_LABEL, status) ? STATUS_LABEL[status] : 'stockAdj.status.unknown');
}

export function adjustmentStatusTone(status: string): AdminTone {
  return has(STATUS_TONE, status) ? STATUS_TONE[status] : 'info';
}

export function adjustmentTypeLabel(type: string): string {
  return t(has(TYPE_LABEL, type) ? TYPE_LABEL[type] : 'stockAdj.type.unknown');
}

export type AdjustmentFilter = 'ALL' | StockAdjustmentStatus;
export const ADJUSTMENT_FILTERS: readonly AdjustmentFilter[] = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

export function adjustmentFilterLabel(filter: AdjustmentFilter): string {
  return filter === 'ALL' ? t('stockAdj.filter.ALL') : adjustmentStatusLabel(filter);
}

/** A route param naming a status filter, or 'ALL'. */
export function adjustmentFilterOf(value: unknown): AdjustmentFilter {
  return typeof value === 'string' && (ADJUSTMENT_FILTERS as readonly string[]).includes(value) ? (value as AdjustmentFilter) : 'ALL';
}

export interface AdjustmentView {
  id: string;
  ref: string;
  batchId: string;
  batchCode: string;
  warehouseId: string;
  productLabel: string;
  type: StockAdjustmentType;
  typeLabel: string;
  /** Signed grams; null when the server sent something that is not a quantity. */
  deltaGrams: number | null;
  /** "+5 kg" / "-5 kg"; '' when unreadable. */
  deltaText: string;
  status: StockAdjustmentStatus;
  statusLabel: string;
  statusTone: AdminTone;
  reason: string;
  createdBy: string;
  createdAt: string;
  decidedAt: string | null;
  rejectionReason: string | null;
  verificationId: string | null;
  ledgerEntryId: string | null;
}

export function toAdjustmentView(
  dto: StockAdjustmentDto,
  now: Date,
  cropNames: ReadonlyMap<string, string> = new Map(),
): AdjustmentView {
  const deltaGrams = parseKgToGrams(dto.qtyDeltaKg);
  const decided = dto.approvedAt ?? dto.rejectedAt;
  return {
    id: dto.id,
    ref: shortRef(dto.id),
    batchId: dto.batchId,
    batchCode: dto.batchCode,
    warehouseId: dto.warehouseId,
    productLabel: productOf(cropNames, dto.cropId, dto.grade),
    type: dto.adjustmentType,
    typeLabel: adjustmentTypeLabel(dto.adjustmentType),
    deltaGrams,
    deltaText: signedKg(deltaGrams),
    status: dto.status,
    statusLabel: adjustmentStatusLabel(dto.status),
    statusTone: adjustmentStatusTone(dto.status),
    reason: dto.reason,
    createdBy: dto.createdBy,
    createdAt: formatAdminDate(dto.createdAt, now),
    decidedAt: decided === null ? null : formatAdminDate(decided, now),
    rejectionReason: dto.rejectionReason,
    verificationId: dto.verificationId,
    ledgerEntryId: dto.ledgerEntryId,
  };
}

export interface AdjustmentActions {
  approve: boolean;
  reject: boolean;
}

/**
 * Approve and Reject are drawn only for a PENDING adjustment and only with
 * inventory.stock_adjustment.approve, which a Sub admin never holds (BR-37a).
 * Whether the viewer raised it is the server's call (403
 * SELF_APPROVAL_FORBIDDEN); the app does not guess it from a cached user id.
 */
export function adjustmentActions(can: PermissionCheck, view: Pick<AdjustmentView, 'status'>): AdjustmentActions {
  const decide = view.status === 'PENDING' && can(STOCK_CODES.adjustmentApprove);
  return { approve: decide, reject: decide };
}

export type AdjustmentDirection = 'remove' | 'add';

export function isLossOnly(type: StockAdjustmentType): boolean {
  return LOSS_ONLY_ADJUSTMENT_TYPES.includes(type);
}

/** The directions a type allows: losses only remove; a count correction can go either way. */
export function directionsFor(type: StockAdjustmentType): readonly AdjustmentDirection[] {
  return isLossOnly(type) ? ['remove'] : ['remove', 'add'];
}

export const ADJUSTMENT_TYPE_OPTIONS: readonly StockAdjustmentType[] = STOCK_ADJUSTMENT_TYPES;

export interface AdjustmentDraft {
  batchId: string | undefined;
  type: StockAdjustmentType;
  direction: AdjustmentDirection;
  /** What the admin typed, kg, unsigned. */
  qtyText: string;
  reason: string;
  /** The picked batch's available grams, when known, to stop an impossible removal early. */
  availableGrams: number | null;
}

export type AdjustmentDraftError =
  | 'BATCH_REQUIRED'
  | 'QTY_INVALID'
  | 'QTY_ABOVE_AVAILABLE'
  | 'DIRECTION_NOT_ALLOWED'
  | 'REASON_TOO_SHORT'
  | 'REASON_TOO_LONG';

export const ADJUSTMENT_DRAFT_ERROR_KEY: Record<AdjustmentDraftError, TranslationKey> = {
  BATCH_REQUIRED: 'stockAdj.form.error.batch',
  QTY_INVALID: 'stockAdj.form.error.qty',
  QTY_ABOVE_AVAILABLE: 'stockAdj.form.error.qtyAboveAvailable',
  DIRECTION_NOT_ALLOWED: 'stockAdj.form.error.direction',
  REASON_TOO_SHORT: 'stockAdj.form.error.reasonShort',
  REASON_TOO_LONG: 'stockAdj.form.error.reasonLong',
};

export type AdjustmentDraftResult =
  | { ok: true; body: StockAdjustmentCreate }
  | { ok: false; error: AdjustmentDraftError };

/**
 * The POST /admin/stock-adjustments body, or the first problem with the
 * draft. The quantity is typed unsigned and signed here from the direction,
 * as integer grams, so "-0.1 + 0.2" style drift is impossible.
 */
export function buildCreateAdjustmentBody(draft: AdjustmentDraft): AdjustmentDraftResult {
  if (draft.batchId === undefined || draft.batchId === '') return { ok: false, error: 'BATCH_REQUIRED' };
  const grams = parseKgToGrams(draft.qtyText);
  if (grams === null || grams <= 0) return { ok: false, error: 'QTY_INVALID' };
  if (!directionsFor(draft.type).includes(draft.direction)) return { ok: false, error: 'DIRECTION_NOT_ALLOWED' };
  if (draft.direction === 'remove' && draft.availableGrams !== null && grams > draft.availableGrams) {
    return { ok: false, error: 'QTY_ABOVE_AVAILABLE' };
  }
  const reason = draft.reason.trim();
  if (reason.length < ADJUSTMENT_REASON_MIN) return { ok: false, error: 'REASON_TOO_SHORT' };
  if (reason.length > ADJUSTMENT_REASON_MAX) return { ok: false, error: 'REASON_TOO_LONG' };
  const signed = draft.direction === 'remove' ? -grams : grams;
  return {
    ok: true,
    body: { batchId: draft.batchId, adjustmentType: draft.type, qtyDeltaKg: gramsToKgString(signed), reason },
  };
}

/** A reject reason the server accepts (1-500 characters, trimmed), or null. */
export function rejectReasonOf(input: string): string | null {
  const reason = input.trim();
  return reason.length === 0 || reason.length > REJECT_REASON_MAX ? null : reason;
}

const ACTION_ERROR_KEY: Readonly<Record<string, TranslationKey>> = {
  SELF_APPROVAL_FORBIDDEN: 'stockAdj.error.selfApproval',
  INVALID_STATE_TRANSITION: 'stockAdj.error.state',
  STOCK_UNAVAILABLE: 'stockAdj.error.stockUnavailable',
  FORBIDDEN: 'stockAdj.error.forbidden',
};

/**
 * The message an approve, reject, create or raise failure shows. The codes
 * these routes document get wording specific to adjustments (BR-37a: a
 * self-approval says why it was refused); anything else falls back to the
 * shared admin error mapping.
 */
export function stockActionErrorKey(err: unknown): TranslationKey {
  if (err instanceof ApiError) {
    const key = ACTION_ERROR_KEY[err.problem.code];
    if (key !== undefined) return key;
  }
  return adminErrorKey(err);
}

// ─── Verifications (counts) ──────────────────────────────────────────────────

const VERIFICATION_STATUS_LABEL: Record<StockVerificationStatus, TranslationKey> = {
  RECORDED: 'stockCount.status.RECORDED',
  RECONCILED: 'stockCount.status.RECONCILED',
  DISPUTED: 'stockCount.status.DISPUTED',
};

export interface VerificationView {
  id: string;
  ref: string;
  batchId: string;
  batchCode: string;
  warehouseId: string;
  productLabel: string;
  systemGrams: number | null;
  countedGrams: number | null;
  varianceGrams: number | null;
  systemText: string;
  countedText: string;
  /** "+2 kg" / "-5 kg"; formatKg of zero for a match; '' when unreadable. */
  varianceText: string;
  status: StockVerificationStatus;
  statusLabel: string;
  statusTone: AdminTone;
  notes: string | null;
  verifiedAt: string;
  adjustmentId: string | null;
  adjustmentStatusLabel: string | null;
}

function verificationTone(status: StockVerificationStatus, varianceGrams: number | null): AdminTone {
  if (status === 'DISPUTED') return 'danger';
  if (status === 'RECORDED') return 'warning';
  return varianceGrams === 0 ? 'success' : 'info';
}

export function toVerificationView(
  dto: StockVerificationDto,
  now: Date,
  cropNames: ReadonlyMap<string, string> = new Map(),
): VerificationView {
  const systemGrams = parseKgToGrams(dto.systemQtyKg);
  const countedGrams = parseKgToGrams(dto.countedQtyKg);
  const varianceGrams = parseKgToGrams(dto.varianceKg);
  return {
    id: dto.id,
    ref: shortRef(dto.id),
    batchId: dto.batchId,
    batchCode: dto.batchCode,
    warehouseId: dto.warehouseId,
    productLabel: productOf(cropNames, dto.cropId, dto.grade),
    systemGrams,
    countedGrams,
    varianceGrams,
    systemText: systemGrams === null ? '' : formatKg(systemGrams),
    countedText: countedGrams === null ? '' : formatKg(countedGrams),
    varianceText: varianceGrams === 0 ? formatKg(0) : signedKg(varianceGrams),
    status: dto.status,
    statusLabel: t(has(VERIFICATION_STATUS_LABEL, dto.status) ? VERIFICATION_STATUS_LABEL[dto.status] : 'stockCount.status.unknown'),
    statusTone: verificationTone(dto.status, varianceGrams),
    notes: dto.notes,
    verifiedAt: formatAdminDate(dto.verifiedAt, now),
    adjustmentId: dto.adjustmentId,
    adjustmentStatusLabel: dto.adjustmentStatus === null ? null : adjustmentStatusLabel(dto.adjustmentStatus),
  };
}

/**
 * BR-107: "Raise adjustment" is offered only for a RECORDED count with a
 * non-zero variance and no adjustment yet, and only with
 * inventory.stock_adjustment.create (what it creates is an adjustment).
 * Anything else the server answers 409 INVALID_STATE_TRANSITION.
 */
export function canRaiseAdjustment(
  can: PermissionCheck,
  view: Pick<VerificationView, 'status' | 'varianceGrams' | 'adjustmentId'>,
): boolean {
  return (
    can(STOCK_CODES.adjustmentCreate) &&
    view.status === 'RECORDED' &&
    view.varianceGrams !== null &&
    view.varianceGrams !== 0 &&
    view.adjustmentId === null
  );
}

export interface CountDraft {
  batchId: string | undefined;
  /** What the admin typed, kg. */
  countedText: string;
  notes: string;
}

export type CountDraftError = 'BATCH_REQUIRED' | 'COUNT_INVALID' | 'NOTES_TOO_LONG';

export const COUNT_DRAFT_ERROR_KEY: Record<CountDraftError, TranslationKey> = {
  BATCH_REQUIRED: 'stockCount.form.error.batch',
  COUNT_INVALID: 'stockCount.form.error.count',
  NOTES_TOO_LONG: 'stockCount.form.error.notesLong',
};

export type CountDraftResult = { ok: true; body: StockVerificationCreate } | { ok: false; error: CountDraftError };

/**
 * The POST /admin/stock-verifications body. Only what was counted is sent
 * (zero is a real count: the shelf was empty); the system quantity and the
 * variance are the server's, snapshotted from the ledger.
 */
export function buildCreateVerificationBody(draft: CountDraft): CountDraftResult {
  if (draft.batchId === undefined || draft.batchId === '') return { ok: false, error: 'BATCH_REQUIRED' };
  const grams = parseKgToGrams(draft.countedText);
  if (grams === null || grams < 0) return { ok: false, error: 'COUNT_INVALID' };
  const notes = draft.notes.trim();
  if (notes.length > VERIFICATION_NOTES_MAX) return { ok: false, error: 'NOTES_TOO_LONG' };
  return {
    ok: true,
    body: { batchId: draft.batchId, countedQtyKg: gramsToKgString(grams), ...(notes === '' ? {} : { notes }) },
  };
}
