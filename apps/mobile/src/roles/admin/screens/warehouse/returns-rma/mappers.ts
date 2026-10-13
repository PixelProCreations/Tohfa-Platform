/**
 * API shapes -> what the returns (RMA) screens draw, and the rules they act on
 * (plan phase 10). Pure (no React), so plain-Node vitest covers every rule here
 * (../../../tests/mappers_returns.test.ts).
 *
 * BR-61 lives in returnActions: inspect only a PENDING return, approve only an
 * INSPECTED one, reject from PENDING or INSPECTED, refund to the wallet only an
 * APPROVED one, each also behind its docs/rbac.json code. The bank refund is
 * never offered (rma.refund.bank_process is `none` for both warehouse roles).
 * The server enforces the same machine (409 INVALID_STATE_TRANSITION); this
 * only keeps the screens from offering what it will refuse.
 *
 * Quantities are integer grams (parseKgToGrams, never parseFloat) and the
 * refund amount is integer paise. Statuses and conditions go through
 * exhaustive tables with an explicit fallback; the API values never change.
 */
import { newIdempotencyKey, createIdempotencyKeyCache, type IdempotencyKeyCache } from '../../../../../shell/api/idempotency';
import type {
  ReturnHistoryDto,
  ReturnInspectionBody,
  ReturnItemCondition,
  ReturnRequestDto,
  ReturnStatus,
  ReturnSummaryDto,
} from '../../../api/returns';
import { t, type TranslationKey } from '../../../i18n';
import type { Paise } from '@tohfa/shared-types';
import { parseRupeesToPaise } from '../../../money/paise';
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
export function returnActions(status: ReturnStatus, can: PermissionCheck): ReturnActions {
  return {
    inspect: status === 'PENDING' && can(RETURN_CODES.inspect),
    approve: status === 'INSPECTED' && can(RETURN_CODES.decide),
    reject: (status === 'PENDING' || status === 'INSPECTED') && can(RETURN_CODES.decide),
    refundWallet: status === 'APPROVED' && can(RETURN_CODES.refundWallet),
  };
}

// ─── Rows and detail ─────────────────────────────────────────────────────────

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

export type InspectionBodyResult = { ok: true; body: ReturnInspectionBody } | { ok: false; errorKey: TranslationKey };

/**
 * The inspect body for every item of the return, or why it cannot be sent.
 * Every item needs a condition and an accepted quantity; quantities are kg
 * with at most 3 decimals; and accepted + damaged may not exceed the requested
 * quantity: the return_request_items CHECK (db/migrations/0046_returns.sql)
 * the server would otherwise fail on.
 */
export function inspectionBody(items: readonly ReturnItemView[], form: Readonly<Record<string, InspectionFormItem | undefined>>): InspectionBodyResult {
  const rows: ReturnInspectionBody['items'] = [];
  for (const item of items) {
    const entry = form[item.orderItemId];
    if (entry === undefined || entry.condition === undefined || entry.accepted.trim() === '') {
      return { ok: false, errorKey: 'returns.inspect.error.incomplete' };
    }
    const accepted = parseKgToGrams(entry.accepted);
    const damaged = entry.damaged.trim() === '' ? 0 : parseKgToGrams(entry.damaged);
    if (accepted === null || damaged === null || accepted < 0 || damaged < 0) {
      return { ok: false, errorKey: 'returns.inspect.error.quantity' };
    }
    if (accepted + damaged > item.requestedGrams) return { ok: false, errorKey: 'returns.inspect.error.overRequested' };
    rows.push({
      orderItemId: item.orderItemId,
      condition: CONDITION_TO_API[entry.condition],
      acceptedQty: gramsToKgString(accepted),
      damagedQty: gramsToKgString(damaged),
    });
  }
  if (rows.length === 0) return { ok: false, errorKey: 'returns.inspect.error.incomplete' };
  return { ok: true, body: { items: rows } };
}

// ─── Refund ──────────────────────────────────────────────────────────────────

/** The server's refund amount (Money string) in integer paise; null when it is not Money. */
export function refundAmountPaise(result: { amount: string }): Paise | null {
  return parseRupeesToPaise(result.amount);
}

export interface ReturnRefundKeyRing {
  keyFor: (returnId: string) => string;
}

/**
 * One Idempotency-Key per return's wallet refund (root CLAUDE.md 2.4): a retry
 * of the same return reuses its key; two returns never share one.
 */
export function createReturnRefundKeyRing(generate: () => string = newIdempotencyKey): ReturnRefundKeyRing {
  const caches = new Map<string, IdempotencyKeyCache>();
  return {
    keyFor: (returnId) => {
      let cache = caches.get(returnId);
      if (cache === undefined) {
        cache = createIdempotencyKeyCache(generate);
        caches.set(returnId, cache);
      }
      return cache.keyFor(returnId);
    },
  };
}
