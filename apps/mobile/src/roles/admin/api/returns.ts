/**
 * Returns (RMA) as the warehouse admin processes them (docs/openapi.yaml tag
 * Returns):
 *   GET  /admin/returns                     rma.request.process           (BR-30, BR-61)
 *   GET  /admin/returns/{id}                rma.request.process           (BR-30, BR-61)
 *   GET  /admin/returns/{id}/history        rma.request.process           (BR-35, BR-61)
 *   POST /admin/returns/{id}/inspect        inventory.quality_check.perform (BR-61)
 *   POST /admin/returns/{id}/approve        rma.refund.approve            (BR-61)
 *   POST /admin/returns/{id}/reject         rma.refund.approve            (BR-61)
 *   POST /admin/returns/{id}/refund/wallet  rma.refund.wallet_process     (BR-61; Idempotency-Key)
 *
 * Scope is the server's: return_requests has no warehouse of its own, so the
 * queue is scoped by the linked order's warehouse (a Sub admin sees returns of
 * orders from its own warehouse) and any other id is 404, never 403. No route
 * takes a warehouseId, so this module never sends one (BR-30).
 *
 * The state machine is the server's (BR-61): PENDING -> INSPECTED -> APPROVED
 * -> REFUNDED (or REFUND_PENDING_BANK), or REJECTED from PENDING / INSPECTED.
 * Approve requires INSPECTED and a refund requires APPROVED (409
 * INVALID_STATE_TRANSITION otherwise).
 *
 * The wallet refund moves money: it carries an Idempotency-Key (root
 * CLAUDE.md 2.4), and the server also derives its own ledger key from the
 * return id, so a replay never credits twice (BR-61d).
 *
 * POST /admin/returns/{id}/refund/bank is NOT exported: rma.refund.bank_process
 * is `none` for both warehouse roles (Super Admin / TOHFA Admin only).
 *
 * No UI imports, so the Main Warehouse admin can reuse this module.
 */
import type { ErrorCode, GenericProblemCode, Money } from '@tohfa/shared-types';
import type { Page } from '../../../shell/api/pagination';
import { adminGet, adminPost } from './http';

/** docs/openapi.yaml ReturnStatus. */
export type ReturnStatus = 'PENDING' | 'INSPECTED' | 'APPROVED' | 'REJECTED' | 'REFUND_PENDING_BANK' | 'REFUNDED';

/** docs/openapi.yaml ReturnItemCondition. */
export type ReturnItemCondition = 'GOOD' | 'DAMAGED' | 'SPOILED';

/** docs/openapi.yaml ReturnRequestSummary. */
export interface ReturnSummaryDto {
  id: string;
  orderId: string;
  customerId: string;
  /** Derived from the linked order. */
  warehouseId: string;
  status: ReturnStatus;
  reason: string;
  note?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

/** docs/openapi.yaml ReturnRequestItem. Quantities are kg strings (Quantity). */
export interface ReturnItemDto {
  id: string;
  orderItemId: string;
  requestedQty: string;
  /** Set by the inspection; null until then. */
  acceptedQty: string | null;
  damagedQty: string | null;
  condition: ReturnItemCondition | null;
}

/** docs/openapi.yaml ReturnRequest. */
export interface ReturnRequestDto extends ReturnSummaryDto {
  items: ReturnItemDto[];
}

/** docs/openapi.yaml ReturnStatusHistoryEntry. */
export interface ReturnHistoryEntryDto {
  id: string;
  returnRequestId: string;
  fromStatus?: ReturnStatus | null;
  toStatus: ReturnStatus;
  changedBy?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface ReturnHistoryDto {
  items: ReturnHistoryEntryDto[];
}

/** docs/openapi.yaml ReturnInspectionItem. */
export interface ReturnInspectionItemBody {
  orderItemId: string;
  condition: ReturnItemCondition;
  /** kg string, 3 decimals. */
  acceptedQty: string;
  /** kg string, 3 decimals. */
  damagedQty: string;
}

export interface ReturnInspectionBody {
  items: ReturnInspectionItemBody[];
}

export interface ReturnRejectBody {
  reason: string;
}

/** docs/openapi.yaml ReturnRefundResult. */
export interface ReturnRefundResultDto {
  returnRequest: ReturnRequestDto;
  /** The wallet ledger row; null only for a bank refund (not offered here). */
  walletTransactionId: string | null;
  amount: Money;
}

export interface ListReturnsParams {
  status?: ReturnStatus | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

/** docs/openapi.yaml ReturnRejectCreate `reason` bounds (the request schema's, not a business threshold). */
export const REJECT_REASON_MAX_LENGTH = 300;

/** Every problem code the returns routes document (401, 403, 404, 409 incl. INVALID_STATE_TRANSITION, 422, 500). */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'INVALID_STATE_TRANSITION',
  'VALIDATION_FAILED',
  'INTERNAL',
];

function returnPath(id: string): string {
  return `/admin/returns/${encodeURIComponent(id)}`;
}

/** The caller's return queue, newest first; `status` is the only filter the spec defines. */
export function listReturns(params: ListReturnsParams = {}, signal?: AbortSignal): Promise<Page<ReturnSummaryDto>> {
  return adminGet<Page<ReturnSummaryDto>>('/admin/returns', { status: params.status, cursor: params.cursor, limit: params.limit }, signal);
}

/** One return with its items; 404 outside the caller's scope. */
export function getReturn(id: string, signal?: AbortSignal): Promise<ReturnRequestDto> {
  return adminGet<ReturnRequestDto>(returnPath(id), undefined, signal);
}

/** The append-only status trail, oldest first. */
export function getReturnHistory(id: string, signal?: AbortSignal): Promise<ReturnHistoryDto> {
  return adminGet<ReturnHistoryDto>(`${returnPath(id)}/history`, undefined, signal);
}

/** Records the inspection (PENDING -> INSPECTED). */
export function inspectReturn(id: string, body: ReturnInspectionBody): Promise<ReturnRequestDto> {
  return adminPost<ReturnRequestDto>(`${returnPath(id)}/inspect`, body);
}

/** INSPECTED -> APPROVED (BR-61a: 409 from any other state). */
export function approveReturn(id: string): Promise<ReturnRequestDto> {
  return adminPost<ReturnRequestDto>(`${returnPath(id)}/approve`, {});
}

/** PENDING / INSPECTED -> REJECTED, with a reason of 1..300 characters (checked here, before a 422). */
export async function rejectReturn(id: string, body: ReturnRejectBody): Promise<ReturnRequestDto> {
  const reason = body.reason.trim();
  if (reason.length === 0 || reason.length > REJECT_REASON_MAX_LENGTH) {
    throw new RangeError(`reject reason must be 1-${REJECT_REASON_MAX_LENGTH} characters`);
  }
  return adminPost<ReturnRequestDto>(`${returnPath(id)}/reject`, { reason });
}

/**
 * APPROVED -> REFUNDED with an instant wallet credit (BR-61). The key is
 * required; reuse it for a retry of the same refund.
 */
export async function refundReturnToWallet(id: string, idempotencyKey: string): Promise<ReturnRefundResultDto> {
  if (idempotencyKey.trim().length === 0) throw new RangeError('a wallet refund needs an Idempotency-Key');
  return adminPost<ReturnRefundResultDto>(`${returnPath(id)}/refund/wallet`, {}, { idempotencyKey });
}
