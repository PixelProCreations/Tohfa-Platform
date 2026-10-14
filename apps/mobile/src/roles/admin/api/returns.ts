/**
 * Returns & Issues (RMA) — docs/openapi.yaml tag `Returns`, server module
 * apps/api/src/modules/returnRequests:
 *  - `GET  /admin/returns`                    listReturnRequests       rma.request.process
 *  - `GET  /admin/returns/{id}`               getReturnRequest         rma.request.process
 *  - `GET  /admin/returns/{id}/history`       getReturnRequestHistory  rma.request.process
 *  - `POST /admin/returns/{id}/inspect`       inspectReturnRequest     inventory.quality_check.perform
 *  - `POST /admin/returns/{id}/approve`       approveReturnRequest     rma.refund.approve
 *  - `POST /admin/returns/{id}/reject`        rejectReturnRequest      rma.refund.approve
 *  - `POST /admin/returns/{id}/refund/wallet` refundReturnRequestToWallet  rma.refund.wallet_process
 *
 * BR-61 state machine (enforced by the SERVER; the client only decides which
 * buttons to show, screens/warehouse/returns/mappers.ts `returnActions`):
 *
 *   PENDING --inspect--> INSPECTED --approve--> APPROVED --refund/wallet--> REFUNDED
 *      \--reject------------/--reject--> REJECTED
 *
 * `POST /admin/returns/{id}/refund/bank` is deliberately NOT wrapped:
 * `rma.refund.bank_process` is `none` for MAIN_WH_ADMIN and SUB_WH_ADMIN
 * (docs/rules.md BR-61, open contradiction #7 default), so the warehouse app
 * has no path to it at all (screens/warehouse/availability.ts
 * `returnsRefundBank`).
 *
 * BR-30: scope is the server's. The list sends no warehouse id; another
 * warehouse's return is the same 404 as an unknown id.
 *
 * The wallet refund is a money write (root CLAUDE.md §2.4): it always carries
 * an Idempotency-Key, and `refundReturnToWallet` refuses to send without one.
 * The server additionally derives its wallet ledger key from the return id,
 * so even a new key cannot credit twice (BR-61d) — the client key is still
 * reused for an identical retry, like every other money write.
 *
 * DTOs mirror the OpenAPI schemas exactly. Quantities are kg decimal strings
 * and the refund `amount` is a `Money` string; convert in the mappers.
 */
import type { Page } from '../../../shell/api/pagination';
import { adminGet, adminPost } from './http';

/** docs/openapi.yaml `ReturnStatus`. */
export const RETURN_STATUSES = [
  'PENDING',
  'INSPECTED',
  'APPROVED',
  'REJECTED',
  'REFUND_PENDING_BANK',
  'REFUNDED',
] as const;
export type ReturnStatusDto = (typeof RETURN_STATUSES)[number];

/** docs/openapi.yaml `ReturnItemCondition`. */
export const RETURN_ITEM_CONDITIONS = ['GOOD', 'DAMAGED', 'SPOILED'] as const;
export type ReturnItemConditionDto = (typeof RETURN_ITEM_CONDITIONS)[number];

/**
 * Problem codes these endpoints answer with: the documented 401/403/404/409
 * (`INVALID_STATE_TRANSITION`, BR-61)/422, plus what the wallet refund's
 * `wallet.move` can raise — 422 `VALIDATION_FAILED` for a zero refund amount,
 * 403 `FORBIDDEN` for a frozen wallet and 409 `IDEMPOTENCY_KEY_REUSED`.
 */
export const ERROR_CODES = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'INVALID_STATE_TRANSITION',
  'IDEMPOTENCY_KEY_REUSED',
  'INTERNAL',
] as const;

/** docs/openapi.yaml `ReturnRequestSummary`. */
export interface ReturnRequestSummaryDto {
  id: string;
  orderId: string;
  customerId: string;
  warehouseId: string;
  /** Typed loosely so a status added server-side cannot break parsing. */
  status: ReturnStatusDto | string;
  reason: string;
  note?: string | null | undefined;
  createdAt: string;
  updatedAt?: string | null | undefined;
}

/** docs/openapi.yaml `ReturnRequestItem`. */
export interface ReturnRequestItemDto {
  id: string;
  orderItemId: string;
  /** `Quantity` (kg, up to 3 decimals). */
  requestedQty: string;
  /** Null until the inspection step. */
  acceptedQty: string | null;
  damagedQty: string | null;
  condition: ReturnItemConditionDto | string | null;
}

/** docs/openapi.yaml `ReturnRequest`. */
export interface ReturnRequestDto extends ReturnRequestSummaryDto {
  items: ReturnRequestItemDto[];
}

/** docs/openapi.yaml `ReturnStatusHistoryEntry`. */
export interface ReturnStatusHistoryEntryDto {
  id: string;
  returnRequestId: string;
  fromStatus?: ReturnStatusDto | string | null | undefined;
  toStatus: ReturnStatusDto | string;
  changedBy?: string | null | undefined;
  note?: string | null | undefined;
  createdAt: string;
}

/** docs/openapi.yaml `ReturnRefundResult`. */
export interface ReturnRefundResultDto {
  returnRequest: ReturnRequestDto;
  /** Set for a wallet refund. */
  walletTransactionId: string | null;
  /** `Money` decimal string. */
  amount: string;
}

/** docs/openapi.yaml `ReturnInspectionItem`. */
export interface ReturnInspectionItemBody {
  orderItemId: string;
  condition: ReturnItemConditionDto;
  acceptedQty: string;
  /** Server default `'0.000'`. */
  damagedQty?: string | undefined;
}

/** docs/openapi.yaml `ReturnInspectionCreate`. */
export interface ReturnInspectionBody {
  items: ReturnInspectionItemBody[];
}

/** docs/openapi.yaml `ReturnRejectCreate`. */
export interface ReturnRejectBody {
  reason: string;
}

export interface ListReturnsParams {
  status?: ReturnStatusDto | undefined;
  cursor?: string | undefined;
  /** 1..100, server default 20. */
  limit?: number | undefined;
}

export class MissingRefundIdempotencyKeyError extends Error {
  constructor() {
    super('A wallet refund must carry an Idempotency-Key');
    this.name = 'MissingRefundIdempotencyKeyError';
  }
}

function returnPath(id: string): string {
  return `/admin/returns/${encodeURIComponent(id)}`;
}

export function listReturns(
  params: ListReturnsParams,
  signal?: AbortSignal,
): Promise<Page<ReturnRequestSummaryDto>> {
  // Allow-list: nothing but the documented query params reaches the wire.
  return adminGet<Page<ReturnRequestSummaryDto>>('/admin/returns', {
    query: { status: params.status, cursor: params.cursor, limit: params.limit },
    signal,
  });
}

export function getReturn(id: string, signal?: AbortSignal): Promise<ReturnRequestDto> {
  return adminGet<ReturnRequestDto>(returnPath(id), { signal });
}

export function getReturnHistory(
  id: string,
  signal?: AbortSignal,
): Promise<{ items: ReturnStatusHistoryEntryDto[] }> {
  return adminGet<{ items: ReturnStatusHistoryEntryDto[] }>(`${returnPath(id)}/history`, { signal });
}

export function inspectReturn(id: string, body: ReturnInspectionBody): Promise<ReturnRequestDto> {
  // The server's schema is `.strict()`: a stray key would be a 422, so copy only the contract.
  const wire: ReturnInspectionBody = {
    items: body.items.map((item) => {
      const out: ReturnInspectionItemBody = {
        orderItemId: item.orderItemId,
        condition: item.condition,
        acceptedQty: item.acceptedQty,
      };
      if (item.damagedQty !== undefined) out.damagedQty = item.damagedQty;
      return out;
    }),
  };
  return adminPost<ReturnRequestDto>(`${returnPath(id)}/inspect`, wire);
}

export function approveReturn(id: string): Promise<ReturnRequestDto> {
  return adminPost<ReturnRequestDto>(`${returnPath(id)}/approve`, undefined);
}

export function rejectReturn(id: string, body: ReturnRejectBody): Promise<ReturnRequestDto> {
  return adminPost<ReturnRequestDto>(`${returnPath(id)}/reject`, { reason: body.reason });
}

export function refundReturnToWallet(
  id: string,
  idempotencyKey: string,
): Promise<ReturnRefundResultDto> {
  if (typeof idempotencyKey !== 'string' || idempotencyKey.trim() === '') {
    return Promise.reject(new MissingRefundIdempotencyKeyError());
  }
  return adminPost<ReturnRefundResultDto>(`${returnPath(id)}/refund/wallet`, undefined, {
    idempotencyKey,
  });
}
