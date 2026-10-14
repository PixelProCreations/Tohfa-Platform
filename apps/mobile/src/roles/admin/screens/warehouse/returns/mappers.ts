/**
 * Returns (RMA): DTO -> screen model, action visibility, form validation,
 * refund key/invalidation and error copy. Pure, so every rule is unit-tested
 * without React (tests/mappers_returns.test.ts).
 *
 * - BR-61: `returnActions` offers approve ONLY on an INSPECTED return, the
 *   wallet refund ONLY on an APPROVED one, and nothing on a terminal status,
 *   mirroring the server state machine (apps/api returnRequests.service.ts).
 *   The server still enforces it (409 `INVALID_STATE_TRANSITION`); this only
 *   keeps impossible buttons off the screen. There is no bank-refund action:
 *   `rma.refund.bank_process` is `none` for MW/SW.
 * - Quantities (kg strings) become integer grams and the refund amount
 *   becomes integer paise, once, here (root CLAUDE.md §2.2). Parsing is
 *   strict, so a malformed server value surfaces as an error state.
 * - Status/condition maps are exhaustive `Record`s over the OpenAPI enums plus
 *   a fallback, so a value added server-side renders as "Unknown".
 * - Screen models are allow-lists: only the fields below reach a screen. The
 *   API returns no customer name or mobile for a return, so none is shown —
 *   only the ids it does return.
 */
import type { QueryKey } from '@tanstack/react-query';
import { ApiError, NetworkError } from '../../../../../shell/api/client';
import { adminErrorKey } from '../../../api/errors';
import { AdminTimeoutError } from '../../../api/http';
import { adminKeys } from '../../../api/queryKeys';
import {
  RETURN_STATUSES,
  type ReturnInspectionBody,
  type ReturnItemConditionDto,
  type ReturnRefundResultDto,
  type ReturnRequestDto,
  type ReturnRequestItemDto,
  type ReturnRequestSummaryDto,
  type ReturnStatusDto,
  type ReturnStatusHistoryEntryDto,
} from '../../../api/returns';
import type { TranslationKey } from '../../../i18n';
import { parseRupeesToPaise, type Paise } from '../../../money/paise';
import { gramsToKgString, parseKgToGrams, tryParseKgToGrams, type Grams } from '../../../money/quantity';
import type { AdminCan } from '../../../rbac/permissions';
import { formatIstDateTime } from '../../../utils/datetime';
import { isWarehouseFeatureVisible } from '../availability';

export const RETURNS_RESOURCE = 'returns';

/** docs/openapi.yaml `ReturnRejectCreate.reason` maxLength (contract, not a business threshold). */
export const REJECT_REASON_MAX_LENGTH = 300;

export type StatusTone = 'success' | 'danger' | 'warning' | 'info';

export interface ReturnStatusMeta {
  labelKey: TranslationKey;
  tone: StatusTone;
}

const STATUS_META: Record<ReturnStatusDto, ReturnStatusMeta> = {
  PENDING: { labelKey: 'admin.returns.status.PENDING', tone: 'warning' },
  INSPECTED: { labelKey: 'admin.returns.status.INSPECTED', tone: 'info' },
  APPROVED: { labelKey: 'admin.returns.status.APPROVED', tone: 'success' },
  REJECTED: { labelKey: 'admin.returns.status.REJECTED', tone: 'danger' },
  REFUND_PENDING_BANK: { labelKey: 'admin.returns.status.REFUND_PENDING_BANK', tone: 'warning' },
  REFUNDED: { labelKey: 'admin.returns.status.REFUNDED', tone: 'success' },
};
const UNKNOWN_STATUS: ReturnStatusMeta = { labelKey: 'admin.returns.status.unknown', tone: 'info' };

const CONDITION_LABEL: Record<ReturnItemConditionDto, TranslationKey> = {
  GOOD: 'admin.returns.condition.GOOD',
  DAMAGED: 'admin.returns.condition.DAMAGED',
  SPOILED: 'admin.returns.condition.SPOILED',
};
const UNKNOWN_CONDITION: TranslationKey = 'admin.returns.condition.unknown';

function has<K extends string>(map: Record<K, unknown>, key: string): key is K {
  return Object.prototype.hasOwnProperty.call(map, key);
}

export function returnStatusMeta(status: string): ReturnStatusMeta {
  return has(STATUS_META, status) ? STATUS_META[status] : UNKNOWN_STATUS;
}

export function returnConditionLabelKey(condition: string): TranslationKey {
  return has(CONDITION_LABEL, condition) ? CONDITION_LABEL[condition] : UNKNOWN_CONDITION;
}

/** `undefined` = "All" (no `status` param). `GET /admin/returns` filters by status server-side. */
export const RETURN_STATUS_FILTERS: readonly (ReturnStatusDto | undefined)[] = [
  undefined,
  ...RETURN_STATUSES,
];

// ---------------------------------------------------------------------------
// Screen models
// ---------------------------------------------------------------------------

export interface ReturnRow {
  id: string;
  orderId: string;
  /** Raw API status, kept for action gating (an unknown status gates to nothing). */
  statusCode: string;
  status: ReturnStatusMeta;
  reason: string;
  createdAtLabel: string;
}

export interface ReturnItem {
  id: string;
  orderItemId: string;
  requestedGrams: Grams;
  acceptedGrams: Grams | null;
  damagedGrams: Grams | null;
  conditionKey: TranslationKey | null;
}

export interface ReturnDetail extends ReturnRow {
  customerId: string;
  note: string | null;
  updatedAtLabel: string | null;
  items: ReturnItem[];
}

function dateTimeLabel(value: string): string {
  return formatIstDateTime(value) ?? value;
}

function optionalGrams(value: string | null): Grams | null {
  return value === null ? null : parseKgToGrams(value);
}

export function toReturnRow(dto: ReturnRequestSummaryDto): ReturnRow {
  return {
    id: dto.id,
    orderId: dto.orderId,
    statusCode: dto.status,
    status: returnStatusMeta(dto.status),
    reason: dto.reason,
    createdAtLabel: dateTimeLabel(dto.createdAt),
  };
}

function toReturnItem(item: ReturnRequestItemDto): ReturnItem {
  return {
    id: item.id,
    orderItemId: item.orderItemId,
    requestedGrams: parseKgToGrams(item.requestedQty),
    acceptedGrams: optionalGrams(item.acceptedQty),
    damagedGrams: optionalGrams(item.damagedQty),
    conditionKey: item.condition === null ? null : returnConditionLabelKey(item.condition),
  };
}

export function toReturnDetail(dto: ReturnRequestDto): ReturnDetail {
  return {
    ...toReturnRow(dto),
    customerId: dto.customerId,
    note: dto.note ?? null,
    updatedAtLabel:
      dto.updatedAt === null || dto.updatedAt === undefined ? null : dateTimeLabel(dto.updatedAt),
    items: dto.items.map(toReturnItem),
  };
}

export interface ReturnHistoryEntry {
  id: string;
  from: ReturnStatusMeta | null;
  to: ReturnStatusMeta;
  note: string | null;
  createdAtLabel: string;
}

export function toReturnHistoryEntry(dto: ReturnStatusHistoryEntryDto): ReturnHistoryEntry {
  return {
    id: dto.id,
    from:
      dto.fromStatus === null || dto.fromStatus === undefined ? null : returnStatusMeta(dto.fromStatus),
    to: returnStatusMeta(dto.toStatus),
    note: dto.note ?? null,
    createdAtLabel: dateTimeLabel(dto.createdAt),
  };
}

// ---------------------------------------------------------------------------
// BR-61 action visibility
// ---------------------------------------------------------------------------

export interface ReturnActions {
  inspect: boolean;
  approve: boolean;
  reject: boolean;
  refundWallet: boolean;
}

/**
 * Which transitions to OFFER for a return in `status`. Each needs both the
 * BR-61 source status and the docs/rbac.json grant (via availability.ts, so
 * the endpoint must exist too).
 */
export function returnActions(status: string, can: AdminCan): ReturnActions {
  return {
    inspect: status === 'PENDING' && isWarehouseFeatureVisible('returnsInspect', can),
    // BR-61: approval only ever follows an inspection.
    approve: status === 'INSPECTED' && isWarehouseFeatureVisible('returnsApprove', can),
    reject:
      (status === 'PENDING' || status === 'INSPECTED') && isWarehouseFeatureVisible('returnsReject', can),
    refundWallet: status === 'APPROVED' && isWarehouseFeatureVisible('returnsRefundWallet', can),
  };
}

// ---------------------------------------------------------------------------
// Inspection form
// ---------------------------------------------------------------------------

export interface InspectionItemForm {
  condition: ReturnItemConditionDto | null;
  acceptedText: string;
  damagedText: string;
}

/** Keyed by `orderItemId` (what the inspect body identifies items by). */
export type InspectionForm = Record<string, InspectionItemForm>;

export interface InspectionItemErrors {
  condition?: TranslationKey;
  accepted?: TranslationKey;
  damaged?: TranslationKey;
}

export type InspectionValidation =
  | { ok: true; body: ReturnInspectionBody }
  | { ok: false; errors: Record<string, InspectionItemErrors> };

/** Nothing is pre-filled: every figure on the inspection is the inspector's own. */
export function emptyInspectionForm(detail: ReturnDetail): InspectionForm {
  const form: InspectionForm = {};
  for (const item of detail.items) {
    form[item.orderItemId] = { condition: null, acceptedText: '', damagedText: '' };
  }
  return form;
}

/**
 * Every item of the return must be inspected: the server accepts a subset,
 * but an item left out keeps a null accepted quantity and silently refunds
 * as zero.
 *
 * Accepted and damaged quantities may not exceed what the customer asked to
 * return. The server does NOT check this, and the refund is
 * `unit_price x accepted_qty` (returnRequests.repo.ts `sumAcceptedAmount`), so
 * an over-typed accepted quantity would over-refund. Whether damaged qty is a
 * part of accepted qty or separate is undocumented, so they are not summed.
 */
export function validateInspectionForm(detail: ReturnDetail, form: InspectionForm): InspectionValidation {
  const errors: Record<string, InspectionItemErrors> = {};
  const items: ReturnInspectionBody['items'] = [];

  for (const item of detail.items) {
    const entry = form[item.orderItemId] ?? { condition: null, acceptedText: '', damagedText: '' };
    const itemErrors: InspectionItemErrors = {};

    if (entry.condition === null) itemErrors.condition = 'admin.returns.inspect.errors.conditionRequired';

    const accepted = tryParseKgToGrams(entry.acceptedText);
    if (accepted === null) itemErrors.accepted = 'admin.returns.inspect.errors.qtyInvalid';
    else if (accepted > item.requestedGrams) itemErrors.accepted = 'admin.returns.inspect.errors.qtyAboveRequested';

    const damagedText = entry.damagedText.trim();
    const damaged = damagedText === '' ? 0 : tryParseKgToGrams(damagedText);
    if (damaged === null) itemErrors.damaged = 'admin.returns.inspect.errors.qtyInvalid';
    else if (damaged > item.requestedGrams) itemErrors.damaged = 'admin.returns.inspect.errors.qtyAboveRequested';

    if (Object.keys(itemErrors).length > 0) {
      errors[item.orderItemId] = itemErrors;
      continue;
    }
    items.push({
      orderItemId: item.orderItemId,
      condition: entry.condition as ReturnItemConditionDto,
      acceptedQty: gramsToKgString(accepted as Grams),
      damagedQty: gramsToKgString(damaged as Grams),
    });
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, body: { items } };
}

// ---------------------------------------------------------------------------
// Reject
// ---------------------------------------------------------------------------

export type RejectValidation = { ok: true; reason: string } | { ok: false; errorKey: TranslationKey };

export function validateRejectReason(text: string): RejectValidation {
  const reason = text.trim();
  if (reason === '') return { ok: false, errorKey: 'admin.returns.reject.errors.required' };
  if (reason.length > REJECT_REASON_MAX_LENGTH) return { ok: false, errorKey: 'admin.returns.reject.errors.tooLong' };
  return { ok: true, reason };
}

// ---------------------------------------------------------------------------
// Query keys, refund key, invalidation
// ---------------------------------------------------------------------------

export function returnsListKey(warehouseId: string | null, status: ReturnStatusDto | undefined): QueryKey {
  return adminKeys.list(warehouseId, RETURNS_RESOURCE, { status });
}

export function returnDetailKey(warehouseId: string | null, id: string): QueryKey {
  return adminKeys.detail(warehouseId, RETURNS_RESOURCE, id);
}

/** Under the returns prefix, so invalidating the resource refreshes the history too. */
export function returnHistoryKey(warehouseId: string | null, id: string): QueryKey {
  return [...adminKeys.resource(warehouseId, RETURNS_RESOURCE), 'history', id];
}

/** Inspect / approve / reject: the return's list rows, detail and history. */
export function returnTransitionInvalidationKeys(warehouseId: string | null): QueryKey[] {
  return [adminKeys.resource(warehouseId, RETURNS_RESOURCE)];
}

/** A wallet refund also changes the customer's wallet balance. */
export function refundInvalidationKeys(warehouseId: string | null): QueryKey[] {
  return [
    adminKeys.resource(warehouseId, RETURNS_RESOURCE),
    adminKeys.resource(warehouseId, 'wallet'),
    adminKeys.resource(warehouseId, 'customers'),
  ];
}

/**
 * What `useIdempotencyKey().keyFor` hashes for a wallet refund. The request
 * has no body; the operation is "refund THIS return to the wallet", so the
 * same return replays the same key and a different return never does.
 */
export function refundIdempotencyFingerprint(returnId: string): { returnId: string; refund: 'wallet' } {
  return { returnId, refund: 'wallet' };
}

export interface RefundResult {
  amountPaise: Paise;
  walletTransactionId: string | null;
  detail: ReturnDetail;
}

export function toRefundResult(dto: ReturnRefundResultDto): RefundResult {
  return {
    amountPaise: parseRupeesToPaise(dto.amount),
    walletTransactionId: dto.walletTransactionId,
    detail: toReturnDetail(dto.returnRequest),
  };
}

// ---------------------------------------------------------------------------
// Error copy
// ---------------------------------------------------------------------------

/** Inspect / approve / reject / reads. */
export function returnWriteErrorKey(error: unknown): TranslationKey {
  if (error instanceof ApiError) {
    const code = error.problem.code as string;
    // Someone else moved the return on (BR-61): say so instead of "not allowed".
    if (code === 'INVALID_STATE_TRANSITION') return 'admin.returns.errors.INVALID_STATE_TRANSITION';
    // Unknown id or another warehouse's return (BR-30) — the same 404.
    if (code === 'NOT_FOUND') return 'admin.returns.errors.NOT_FOUND';
  }
  return adminErrorKey(error);
}

/**
 * The wallet refund:
 *  - network / timeout: it may have gone through. A retry resends the same
 *    key, and the server keys the ledger row on the return id, so the wallet
 *    is credited once at most (BR-61d).
 *  - 422 VALIDATION_FAILED: in practice the refund amount is zero (no
 *    quantity accepted at inspection) — wallet.move refuses a non-positive
 *    credit.
 */
export function returnRefundErrorKey(error: unknown): TranslationKey {
  if (error instanceof NetworkError || error instanceof AdminTimeoutError) {
    return 'admin.returns.refund.errors.uncertain';
  }
  if (error instanceof ApiError && (error.problem.code as string) === 'VALIDATION_FAILED') {
    return 'admin.returns.refund.errors.VALIDATION_FAILED';
  }
  return returnWriteErrorKey(error);
}
