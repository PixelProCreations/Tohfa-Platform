/**
 * API shapes -> what the returns (RMA) screens draw, and the rules they act on
 * (plan phase 10). Pure (no React), so plain-Node vitest covers every rule here
 * (../../../tests/mappers_returns.test.ts).
 *
 * BR-61 lives in returnActions and approveGate: inspect only a PENDING return,
 * approve only an INSPECTED one (and only when something was accepted), reject
 * from PENDING or INSPECTED, refund to the wallet only an APPROVED one, each
 * also behind its docs/rbac.json code. The bank refund is never offered
 * (rma.refund.bank_process is `none` for both warehouse roles). The server
 * enforces the same machine (409 INVALID_STATE_TRANSITION); this only keeps
 * the screens from offering what it will refuse.
 *
 * Quantities are integer grams (parseKgToGrams, never parseFloat) and the
 * refund amount is integer paise. Statuses and conditions go through
 * exhaustive tables with an explicit fallback; the API values never change.
 */
import { ApiError, NetworkError } from '../../../../../shell/api/client';
import { adminErrorKey } from '../../../api/errors';
import {
  REJECT_REASON_MAX_LENGTH,
  type ReturnHistoryDto,
  type ReturnInspectionBody,
  type ReturnItemCondition,
  type ReturnRefundResultDto,
  type ReturnRequestDto,
  type ReturnStatus,
  type ReturnSummaryDto,
} from '../../../api/returns';
import { t, type TranslationKey } from '../../../i18n';
import type { Paise } from '@tohfa/shared-types';
import { formatPaise, parseRupeesToPaise } from '../../../money/paise';
import { gramsToKgString, parseKgToGrams } from '../../../money/quantity';
import { formatAdminDate } from '../../../utils/datetime';
import type { AdminTone } from '../../../theme';
import type { InspectionCondition, PermissionCheck, ReturnDetailView, ReturnItemView, ReturnRowView, ReturnTimelineEntry } from './types';

// ─── Status ──────────────────────────────────────────────────────────────────

/** Every docs/openapi.yaml ReturnStatus: its label key and badge tone. */
export const RETURN_STATUS_VIEW: Readonly<Record<ReturnStatus, { labelKey: TranslationKey; tone: AdminTone }>> = {
  PENDING: { labelKey: 'returns.status.PENDING', tone: 'warning' },
  INSPECTED: { labelKey: 'returns.status.INSPECTED', tone: 'info' },
  APPROVED: { labelKey: 'returns.status.APPROVED', tone: 'success' },
  REJECTED: { labelKey: 'returns.status.REJECTED', tone: 'danger' },
  REFUND_PENDING_BANK: { labelKey: 'returns.status.REFUND_PENDING_BANK', tone: 'warning' },
  REFUNDED: { labelKey: 'returns.status.REFUNDED', tone: 'success' },
};

export function isReturnStatus(value: unknown): value is ReturnStatus {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(RETURN_STATUS_VIEW, value);
}

/** Label and tone of a status; a status the app does not know reads "Unknown" (never a guessed state). */
export function returnStatusView(status: string): { label: string; tone: AdminTone; known: boolean } {
  if (!isReturnStatus(status)) return { label: t('returns.status.unknown'), tone: 'warning', known: false };
  const view = RETURN_STATUS_VIEW[status];
  return { label: t(view.labelKey), tone: view.tone, known: true };
}

/**
 * The queue's chips: "All" (no `status` param) and the open statuses. The
 * server filters by one status; the closed ones are the history's chips.
 */
export const RETURN_QUEUE_FILTERS: readonly (ReturnStatus | undefined)[] = [undefined, 'PENDING', 'INSPECTED', 'APPROVED'];

/** Return History's chips: the closed statuses, one server filter each. */
export const RETURN_HISTORY_FILTERS: readonly ReturnStatus[] = ['REFUNDED', 'REJECTED', 'REFUND_PENDING_BANK'];

// ─── Condition ───────────────────────────────────────────────────────────────

/** The API's item conditions, 1:1 to the design's labels. */
export const CONDITION_FROM_API: Readonly<Record<ReturnItemCondition, InspectionCondition>> = {
  GOOD: 'Acceptable',
  DAMAGED: 'Damaged',
  SPOILED: 'Spoiled',
};

/** The design's labels back to the API values (exhaustive, so the inspect body never carries a label). */
export const CONDITION_TO_API: Readonly<Record<InspectionCondition, ReturnItemCondition>> = {
  Acceptable: 'GOOD',
  Damaged: 'DAMAGED',
  Spoiled: 'SPOILED',
};

export const INSPECTION_CONDITIONS: readonly InspectionCondition[] = ['Acceptable', 'Damaged', 'Spoiled'];

const CONDITION_LABEL: Readonly<Record<InspectionCondition, TranslationKey>> = {
  Acceptable: 'returns.condition.Acceptable',
  Damaged: 'returns.condition.Damaged',
  Spoiled: 'returns.condition.Spoiled',
};

/** The translated label of a condition (the design value is a key, not display text). */
export function conditionLabel(condition: InspectionCondition): string {
  return t(CONDITION_LABEL[condition]);
}

function conditionOf(value: unknown): InspectionCondition | null {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(CONDITION_FROM_API, value)
    ? CONDITION_FROM_API[value as ReturnItemCondition]
    : null;
}

// ─── Actions (BR-61) ─────────────────────────────────────────────────────────

/** docs/rbac.json codes of the return actions (each exists there). */
export const RETURN_CODES = {
  view: 'rma.request.process',
  inspect: 'inventory.quality_check.perform',
  decide: 'rma.refund.approve',
  refundWallet: 'rma.refund.wallet_process',
} as const;

export interface ReturnActions {
  inspect: boolean;
  approve: boolean;
  reject: boolean;
  refundWallet: boolean;
}

/** What the screens may offer for a return in `status` (BR-61), given the caller's codes. */
export function returnActions(status: string, can: PermissionCheck): ReturnActions {
  return {
    inspect: status === 'PENDING' && can(RETURN_CODES.inspect),
    // BR-61: approval only ever follows an inspection.
    approve: status === 'INSPECTED' && can(RETURN_CODES.decide),
    reject: (status === 'PENDING' || status === 'INSPECTED') && can(RETURN_CODES.decide),
    refundWallet: status === 'APPROVED' && can(RETURN_CODES.refundWallet),
  };
}

/** Sum of the accepted grams over every item; an item not inspected (null) counts as 0. */
export function totalAcceptedGrams(items: readonly ReturnItemView[]): number {
  return items.reduce((sum, item) => sum + (item.acceptedGrams ?? 0), 0);
}

export interface ApproveGate {
  /** Draw the Approve button at all (INSPECTED, with rma.refund.approve). */
  visible: boolean;
  /** Let it be pressed. */
  enabled: boolean;
  /** Why it is drawn disabled; null when it is enabled or hidden. */
  noteKey: TranslationKey | null;
}

/**
 * The Approve button on the review step (BR-61): hidden unless the return is
 * INSPECTED and the caller holds rma.refund.approve; drawn but disabled when
 * nothing was accepted on any line, so the admin is steered to Reject.
 *
 * TODO(server, tracked separately): a return approved with zero accepted
 * quantity refunds Rs 0, which wallet.move refuses (422), and an APPROVED
 * return cannot be rejected, so it would be stuck in APPROVED for good. The
 * proper fix is a server-side "close with no refund" path; until then the
 * client does not offer the approve that leads there. A tiny accepted weight
 * whose value rounds to Rs 0.00 is not caught here: the detail carries no
 * price, so only the server can see that case.
 */
export function approveGate(status: string, items: readonly ReturnItemView[], can: PermissionCheck): ApproveGate {
  if (!returnActions(status, can).approve) return { visible: false, enabled: false, noteKey: null };
  if (totalAcceptedGrams(items) === 0) return { visible: true, enabled: false, noteKey: 'returns.review.zeroAccepted' };
  return { visible: true, enabled: true, noteKey: null };
}

// ─── Rows and detail ─────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A return uuid, or undefined. A host still passing a sample RMA number
 * ('RMA-00231') gets "not found" instead of a request (BR-30: the server
 * answers 404 for anything outside the caller's scope anyway).
 */
export function returnIdParam(value: unknown): string | undefined {
  return typeof value === 'string' && UUID_RE.test(value) ? value : undefined;
}

/**
 * The return's display reference: `RET-` + the first 8 hex characters of its
 * id, upper-cased. The same derived label docs/rules.md BR-91h pins for the
 * customer issues list (return_requests has no number column); a label, not a
 * unique key.
 */
export function returnReference(id: string): string {
  return `RET-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

export function toReturnRow(dto: ReturnSummaryDto, now: Date): ReturnRowView {
  const view = returnStatusView(dto.status);
  return {
    id: dto.id,
    reference: returnReference(dto.id),
    orderId: dto.orderId,
    status: dto.status,
    statusLabel: view.label,
    statusTone: view.tone,
    reason: dto.reason,
    note: dto.note ?? null,
    created: formatAdminDate(dto.createdAt, now),
  };
}

function gramsOrNull(kg: string | null | undefined): number | null {
  return kg === null || kg === undefined ? null : parseKgToGrams(kg);
}

export function toReturnItem(item: ReturnRequestDto['items'][number]): ReturnItemView {
  return {
    orderItemId: item.orderItemId,
    requestedGrams: parseKgToGrams(item.requestedQty) ?? 0,
    acceptedGrams: gramsOrNull(item.acceptedQty),
    damagedGrams: gramsOrNull(item.damagedQty),
    condition: conditionOf(item.condition),
  };
}

export function toReturnDetail(dto: ReturnRequestDto, now: Date): ReturnDetailView {
  return { ...toReturnRow(dto, now), customerId: dto.customerId, items: dto.items.map(toReturnItem) };
}

/** The status trail, oldest first, as the server keeps it. */
export function toReturnTimeline(dto: ReturnHistoryDto, now: Date): ReturnTimelineEntry[] {
  return dto.items.map((entry) => ({
    id: entry.id,
    title: returnStatusView(entry.toStatus).label,
    time: formatAdminDate(entry.createdAt, now),
    note: entry.note ?? null,
  }));
}

// ─── Inspection ──────────────────────────────────────────────────────────────

/** What the inspection form holds per item, as typed. */
export interface InspectionFormItem {
  condition: InspectionCondition | undefined;
  /** kg as typed. */
  accepted: string;
  /** kg as typed; blank = 0 (the spec default '0.000'). */
  damaged: string;
}

export type InspectionForm = Readonly<Record<string, InspectionFormItem | undefined>>;

export type InspectionBodyResult =
  | { ok: true; body: ReturnInspectionBody }
  | {
      ok: false;
      /** The first problem, for a banner. */
      errorKey: TranslationKey;
      /** Every item with a problem, keyed by orderItemId, for an inline message. */
      itemErrors: Readonly<Record<string, TranslationKey>>;
    };

function inspectionItemError(item: ReturnItemView, entry: InspectionFormItem | undefined): TranslationKey | { accepted: number; damaged: number } {
  if (entry === undefined || entry.condition === undefined || entry.accepted.trim() === '') return 'returns.inspect.error.incomplete';
  const accepted = parseKgToGrams(entry.accepted);
  const damaged = entry.damaged.trim() === '' ? 0 : parseKgToGrams(entry.damaged);
  if (accepted === null || damaged === null || accepted < 0 || damaged < 0) return 'returns.inspect.error.quantity';
  // SUMMED, as the DB constraint return_request_items_qty_balance_chk is
  // (db/migrations/0046_returns.sql: accepted_qty + damaged_qty <=
  // requested_qty + 0.001). Checking each against the requested quantity on
  // its own let "requested 2, accepted 2, damaged 1" through to a server 500.
  // Integer grams with no tolerance: the client is never looser than the DB.
  if (accepted + damaged > item.requestedGrams) return 'returns.inspect.error.overRequested';
  return { accepted, damaged };
}

/**
 * The inspect body for every item of the return, or why it cannot be sent.
 * Every item needs a condition and an accepted quantity (the server accepts a
 * subset, but an item left out keeps a null accepted quantity and silently
 * refunds as zero); quantities are kg with at most 3 decimals; and accepted +
 * damaged may not exceed the requested quantity, per item.
 */
export function inspectionBody(items: readonly ReturnItemView[], form: InspectionForm): InspectionBodyResult {
  const rows: ReturnInspectionBody['items'] = [];
  const itemErrors: Record<string, TranslationKey> = {};
  let firstError: TranslationKey | null = null;
  for (const item of items) {
    const entry = form[item.orderItemId];
    const result = inspectionItemError(item, entry);
    if (typeof result === 'string') {
      itemErrors[item.orderItemId] = result;
      firstError ??= result;
      continue;
    }
    rows.push({
      orderItemId: item.orderItemId,
      // entry is defined here: inspectionItemError refuses an undefined entry.
      condition: CONDITION_TO_API[(entry as InspectionFormItem).condition as InspectionCondition],
      acceptedQty: gramsToKgString(result.accepted),
      damagedQty: gramsToKgString(result.damaged),
    });
  }
  if (firstError !== null) return { ok: false, errorKey: firstError, itemErrors };
  if (rows.length === 0) return { ok: false, errorKey: 'returns.inspect.error.incomplete', itemErrors };
  return { ok: true, body: { items: rows } };
}

// ─── Reject ──────────────────────────────────────────────────────────────────

export type RejectReasonResult = { ok: true; reason: string } | { ok: false; errorKey: TranslationKey };

/** docs/openapi.yaml ReturnRejectCreate.reason: 1..300 characters after trimming. */
export function validateRejectReason(text: string): RejectReasonResult {
  const reason = text.trim();
  if (reason === '') return { ok: false, errorKey: 'returns.reject.error.required' };
  if (reason.length > REJECT_REASON_MAX_LENGTH) return { ok: false, errorKey: 'returns.reject.error.tooLong' };
  return { ok: true, reason };
}

// ─── Refund ──────────────────────────────────────────────────────────────────

/** The server's refund amount (Money string) in integer paise; null when it is not Money. */
export function refundAmountPaise(result: { amount: string }): Paise | null {
  return parseRupeesToPaise(result.amount);
}

export interface RefundResultView {
  amountPaise: Paise | null;
  /** formatPaise of the paise; null when the server amount is not Money. */
  amountLabel: string | null;
  walletTransactionId: string | null;
  reference: string;
}

export function toRefundResult(dto: ReturnRefundResultDto): RefundResultView {
  const amountPaise = refundAmountPaise(dto);
  return {
    amountPaise,
    amountLabel: amountPaise === null ? null : formatPaise(amountPaise),
    walletTransactionId: dto.walletTransactionId,
    reference: returnReference(dto.returnRequest.id),
  };
}

/**
 * What useIdempotencyKey().keyFor hashes for a wallet refund (root CLAUDE.md
 * 2.4). The request has no body; the operation is "refund THIS return to the
 * wallet", so a retry of the same return replays its key and another return
 * never does. The server also derives its ledger key from the return id, so a
 * replay never credits twice (BR-61d).
 */
export function refundIdempotencyFingerprint(returnId: string): { returnId: string; refund: 'wallet' } {
  return { returnId, refund: 'wallet' };
}

// ─── Error copy ──────────────────────────────────────────────────────────────

/** Inspect / approve / reject / reads. */
export function returnWriteErrorKey(error: unknown): TranslationKey {
  if (error instanceof ApiError) {
    const errorCode: string = error.problem.code;
    // Someone else moved the return on (BR-61): say so instead of "not allowed".
    if (errorCode === 'INVALID_STATE_TRANSITION') return 'returns.error.INVALID_STATE_TRANSITION';
    // Unknown id or another warehouse's return (BR-30): the same 404.
    if (errorCode === 'NOT_FOUND') return 'returns.error.NOT_FOUND';
  }
  return adminErrorKey(error);
}

/**
 * The wallet refund:
 *  - network / timeout: it may have gone through. A retry resends the same
 *    key and the server keys the ledger row on the return id, so the wallet
 *    is credited at most once (BR-61d).
 *  - 422 VALIDATION_FAILED: in practice the refund amount is zero (nothing
 *    accepted at inspection); wallet.move refuses a non-positive credit.
 */
export function returnRefundErrorKey(error: unknown): TranslationKey {
  if (error instanceof NetworkError) return 'returns.refund.error.uncertain';
  if (error instanceof ApiError && (error.problem.code as string) === 'VALIDATION_FAILED') return 'returns.refund.error.zeroAmount';
  return returnWriteErrorKey(error);
}
