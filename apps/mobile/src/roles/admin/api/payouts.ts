/**
 * Farmer payouts (docs/openapi.yaml tag "Payouts & Invoices"):
 *   GET  /admin/payouts               payout.view                (BR-72; cursor paged)
 *   POST /admin/payouts/{id}/approve  payout.approve_above_10k   (BR-31, BR-72; Idempotency-Key)
 *   POST /admin/payouts/{id}/reject   payout.reject              (BR-228; reason 5-500 chars; Idempotency-Key)
 *   POST /admin/payouts/{id}/intimate payout.farmer.initiate     (BR-229; no key; APPROVED/PROCESSING/PAID only)
 *   POST /admin/payouts/bulk          payout.farmer.initiate     (BR-230; Idempotency-Key; atomic, 1-50 items)
 *
 * Reject needs an Idempotency-Key (the server answers 422 without one, BR-228)
 * and only accepts a REQUESTED or PENDING_APPROVAL payout (else 409
 * INVALID_STATE_TRANSITION). Intimate answers a `PayoutIntimateResponse`, not a
 * `Payout`. Bulk is all-or-nothing: one failing item fails the whole batch, so
 * there is no per-item created/skipped/failed result. A screen may claim an
 * outcome only from the server's answer.
 *
 * Approve: the initiator may never approve (403 SAME_ACTOR_APPROVAL), above
 * INR 10,000 the second approver must be a Super Admin (BR-31), a second
 * approver racing the first gets 409 INVALID_STATE_TRANSITION. The response is
 * the `Payout`: `status` is APPROVED once both approvals are in (the payout is
 * then submitted to RazorpayX); until then it is still PENDING_APPROVAL, so a
 * screen must read `status` and not assume the money is on its way.
 *
 * Replay-safe (BR-72): the Idempotency-Key is required (422 when missing or
 * blank). Replaying a key with the same note returns the original 200 and
 * records no second approval; the same key with a different note is 409
 * IDEMPOTENCY_KEY_REUSED.
 *
 * Money stays the API decimal string (`Money`); a screen formats it through
 * integer paise (saOverviewFormat.moneyText), never a float.
 *
 * No UI imports, so any admin area can reuse it.
 */
import type { Money } from '@tohfa/shared-types';
import { bodyFingerprint } from './hookHelpers';
import { adminGet, adminPost } from './http';

/** openapi `PayoutStatus`. */
export type PayoutStatus = 'REQUESTED' | 'PENDING_APPROVAL' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REVERSED' | 'REJECTED';

/** The statuses GET /admin/payouts accepts as a filter. */
export type PayoutListStatus = 'REQUESTED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PAID' | 'FAILED';

/** Waiting for the second (Super Admin) approval. */
export const PAYOUT_AWAITING_STATUS: PayoutListStatus = 'PENDING_APPROVAL';

/** openapi `Payout`: the POST approve response. */
export interface PayoutDto {
  id: string;
  payoutNumber: string;
  farmerId: string;
  amount: Money;
  mode?: 'UPI' | 'IMPS' | 'NEFT' | undefined;
  status: PayoutStatus;
  requiresDualApproval: boolean;
  initiatedBy?: string | undefined;
  approvedBy?: string[] | undefined;
  approvedAt?: string | null | undefined;
  gatewayPayoutId?: string | null | undefined;
  failureReason?: string | null | undefined;
  paidAt?: string | null | undefined;
}

/** One row of GET /admin/payouts. */
export interface PayoutListItemDto {
  id: string;
  payoutNumber: string;
  farmerId: string;
  farmerName: string;
  amount: Money;
  status: string;
  requestedAt: string;
  requestedBy: string;
}

export interface PayoutListPage {
  items: PayoutListItemDto[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ListPayoutsParams {
  status?: PayoutListStatus | undefined;
  farmerId?: string | undefined;
  cursor?: string | undefined;
  /** 1-100. */
  limit?: number | undefined;
}

/** POST .../approve body (all optional; `note` max 500 characters). */
export interface ApprovePayoutBody {
  note?: string | undefined;
}

/** API validation limit of the approval note (openapi maxLength), not a business threshold. */
export const APPROVE_NOTE_MAX = 500;

/**
 * Keys one approval by (payout, note), so a retry of the same press replays the
 * same Idempotency-Key and approving a different payout never replays another's.
 */
export function payoutApproveFingerprint(payoutId: string, body: ApprovePayoutBody): string {
  return bodyFingerprint({ payoutId, body });
}

export function listPayouts(params: ListPayoutsParams = {}, signal?: AbortSignal): Promise<PayoutListPage> {
  return adminGet<PayoutListPage>(
    '/admin/payouts',
    { status: params.status, farmerId: params.farmerId, cursor: params.cursor, limit: params.limit },
    signal,
  );
}

/** Records the caller's approval. 403 SAME_ACTOR_APPROVAL / FORBIDDEN, 404, 409 INVALID_STATE_TRANSITION / IDEMPOTENCY_KEY_REUSED, 422. */
export function approvePayout(payoutId: string, body: ApprovePayoutBody, idempotencyKey: string, signal?: AbortSignal): Promise<PayoutDto> {
  return adminPost<PayoutDto>(`/admin/payouts/${encodeURIComponent(payoutId)}/approve`, body, { idempotencyKey, signal });
}

/** POST .../reject body: `reason` is required, 5-500 characters (openapi PayoutRejectRequest). */
export interface RejectPayoutBody {
  reason: string;
}

/** API validation limits of the rejection reason (openapi), not business thresholds. */
export const REJECT_REASON_MIN = 5;
export const REJECT_REASON_MAX = 500;

/** Keys one rejection by (payout, reason), so a retry of the same press replays the same Idempotency-Key. */
export function payoutRejectFingerprint(payoutId: string, body: RejectPayoutBody): string {
  return bodyFingerprint({ payoutId, reject: true, body });
}

/** Rejects a REQUESTED / PENDING_APPROVAL payout (BR-228). Idempotency-Key required. 404, 409 INVALID_STATE_TRANSITION, 422. */
export function rejectPayout(payoutId: string, body: RejectPayoutBody, idempotencyKey: string, signal?: AbortSignal): Promise<PayoutDto> {
  return adminPost<PayoutDto>(`/admin/payouts/${encodeURIComponent(payoutId)}/reject`, body, { idempotencyKey, signal });
}

/** POST .../intimate body (optional note, max 500). */
export interface IntimatePayoutBody {
  note?: string | undefined;
}

/** openapi `PayoutIntimateResponse`. */
export interface PayoutIntimateResult {
  payoutId: string;
  payoutNumber: string;
  farmerId: string;
  status: PayoutStatus;
  intimatedAt: string;
  intimatedBy: string;
  note: string | null;
}

/** Notifies the farmer about an APPROVED / PROCESSING / PAID payout (BR-229). No money moves, so no Idempotency-Key. 404, 409. */
export function intimatePayout(payoutId: string, body: IntimatePayoutBody, signal?: AbortSignal): Promise<PayoutIntimateResult> {
  return adminPost<PayoutIntimateResult>(`/admin/payouts/${encodeURIComponent(payoutId)}/intimate`, body, { signal });
}

export type PayoutMode = 'UPI' | 'IMPS' | 'NEFT';

/** openapi `PayoutCreate`, one item of a bulk request. */
export interface BulkPayoutItemInput {
  farmerId: string;
  /** API decimal string. */
  amount: Money;
  mode: PayoutMode;
  bankAccountId?: string | undefined;
  /** The payout dues this payout pays (GET /admin/payout-dues ids). */
  dueIds?: string[] | undefined;
  remarks?: string | undefined;
}

/** openapi `BulkPayoutCreateRequest`: 1-50 items, validated and created atomically. */
export interface BulkPayoutsBody {
  items: BulkPayoutItemInput[];
}

/** openapi `BulkPayoutCreateResponse`. */
export interface BulkPayoutsResult {
  batchId: string;
  createdCount: number;
  totalAmount: Money;
  items: PayoutDto[];
}

/** Keys one bulk run by its items, so a retry replays the same Idempotency-Key. */
export function bulkPayoutFingerprint(body: BulkPayoutsBody): string {
  return bodyFingerprint({ bulk: true, body });
}

/** Creates up to 50 payouts atomically (BR-230). Money-moving: Idempotency-Key required. */
export function createBulkPayouts(body: BulkPayoutsBody, idempotencyKey: string, signal?: AbortSignal): Promise<BulkPayoutsResult> {
  return adminPost<BulkPayoutsResult>('/admin/payouts/bulk', body, { idempotencyKey, signal });
}
