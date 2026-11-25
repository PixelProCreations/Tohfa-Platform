/**
 * Farmer payouts (docs/openapi.yaml tag "Payouts & Invoices"):
 *   GET  /admin/payouts               payout.view                (BR-72; cursor paged)
 *   POST /admin/payouts/{id}/approve  payout.approve_above_10k   (BR-31, BR-72; Idempotency-Key)
 *
 * There is NO reject / return endpoint for a payout in the spec, so this module
 * has no such function and no screen may claim a payout was rejected.
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
export type PayoutStatus = 'REQUESTED' | 'PENDING_APPROVAL' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REVERSED';

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
