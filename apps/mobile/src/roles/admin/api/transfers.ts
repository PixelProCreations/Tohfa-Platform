/**
 * Inter-warehouse transfers (docs/openapi.yaml /warehouse-transfers, BR-102):
 *   GET  /warehouse-transfers               transfer.inter_warehouse.view      (BR-30; Sub = touching its warehouse)
 *   GET  /warehouse-transfers/{id}          transfer.inter_warehouse.view      (404 outside scope, never 403)
 *   POST /warehouse-transfers               transfer.inter_warehouse.initiate  (SA, MAIN; BR-26; Idempotency-Key)
 *   POST /warehouse-transfers/{id}/approve  transfer.high_value.approve        (SA only; Idempotency-Key)
 *   POST /warehouse-transfers/{id}/receive  transfer.inter_warehouse.receive   (destination only; Idempotency-Key)
 *   POST /warehouse-transfers/{id}/cancel   transfer.inter_warehouse.initiate  (only from PENDING_APPROVAL)
 *
 * Shapes mirror apps/api/src/modules/warehouse-transfers/warehouse-transfers.schema.ts.
 * Quantities are kg decimal STRINGS (numeric(12,3)) both ways and money is a
 * decimal Money string; the screens' mappers turn them into integer grams and
 * paise, so no kilogram or rupee figure ever passes through a float.
 *
 * There is no dispatch endpoint: a transfer below the high-value threshold is
 * dispatched by the create call itself (IN_TRANSIT), and one at or above it
 * (or with an unvalued line) is dispatched by the approval. There is no
 * separate inspection endpoint either: receiving records each line's received
 * quantity and, on a shortfall, a required receipt note.
 *
 * The list pages by number (`items, page, pageSize, total`), not by cursor.
 * `direction` is relative to `warehouseId` and the server answers 422 without
 * it, so listTransfers drops a direction that has no warehouse.
 *
 * No UI imports, so any admin area can reuse this module.
 */
import type { ErrorCode, GenericProblemCode, Money } from '@tohfa/shared-types';
import type { OffsetPage } from '../../../shell/api/pagination';
import { adminGet, adminPost } from './http';
import type { QuantityKg } from './inventory';

/** warehouse-transfers.schema.ts TRANSFER_STATUSES. */
export const WAREHOUSE_TRANSFER_STATUSES = ['PENDING_APPROVAL', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'] as const;
export type WarehouseTransferStatus = (typeof WAREHOUSE_TRANSFER_STATUSES)[number];

export type WarehouseTransferDirection = 'INBOUND' | 'OUTBOUND';

/** BR-102 rule 1: 1-50 lines per transfer (schema MAX_TRANSFER_LINES). */
export const MAX_TRANSFER_LINES = 50;

/** One line. Never carries the source farmer (BR-16). */
export interface WarehouseTransferLineDto {
  id: string;
  batchId: string;
  batchCode: string;
  cropId: string;
  grade: string;
  qtySentKg: QuantityKg;
  qtyReceivedKg: QuantityKg | null;
  varianceKg: QuantityKg | null;
  costPerKg: Money | null;
  lineValue: Money | null;
  destBatchId: string | null;
}

/** The header the list returns (no lines). User fields are uuids only. */
export interface WarehouseTransferSummaryDto {
  id: string;
  transferNumber: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  status: WarehouseTransferStatus;
  totalValue: Money;
  hasUnvaluedLines: boolean;
  requiresApproval: boolean;
  hasDiscrepancy: boolean;
  vehicleNumber: string | null;
  notes: string | null;
  receiptNote: string | null;
  cancelReason: string | null;
  initiatedBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
  dispatchedAt: string | null;
  receivedBy: string | null;
  receivedAt: string | null;
  cancelledBy: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

/** One transfer with its lines (get, create, approve, receive, cancel). */
export interface WarehouseTransferDto extends WarehouseTransferSummaryDto {
  lines: WarehouseTransferLineDto[];
}

export interface WarehouseTransferCreate {
  fromWarehouseId: string;
  toWarehouseId: string;
  lines: { batchId: string; qtyKg: QuantityKg }[];
  /** 1-20 characters when sent. */
  vehicleNumber?: string;
  /** 1-1000 characters when sent. */
  notes?: string;
}

export interface WarehouseTransferReceive {
  /** Every line of the transfer exactly once, 0 to qtySentKg. */
  lines: { itemId: string; qtyReceivedKg: QuantityKg }[];
  /** Required when any line is short; 1-1000 characters. */
  receiptNote?: string;
}

export interface WarehouseTransferCancel {
  /** 1-500 characters. */
  reason: string;
}

export interface ListWarehouseTransfersParams {
  status?: WarehouseTransferStatus | undefined;
  /** Either side of the transfer, or the side `direction` names. */
  warehouseId?: string | undefined;
  /** Needs warehouseId; dropped without one (the server answers 422). */
  direction?: WarehouseTransferDirection | undefined;
  /** From 1. */
  page?: number | undefined;
  /** 1-100, server default 20. */
  pageSize?: number | undefined;
}

/** The largest page the server accepts. */
export const TRANSFER_LIST_MAX_PAGE_SIZE = 100;

/**
 * Problem codes these routes document: 401/403/404/409/422/500, the 409s
 * STOCK_UNAVAILABLE (free shelf), INVALID_STATE_TRANSITION and
 * IDEMPOTENCY_KEY_REUSED, and the 403s SELF_APPROVAL_FORBIDDEN (the initiator
 * approving) and WAREHOUSE_SCOPE_VIOLATION (a Sub admin of the source receiving).
 */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'VALIDATION_FAILED',
  'INTERNAL',
  'STOCK_UNAVAILABLE',
  'INVALID_STATE_TRANSITION',
  'IDEMPOTENCY_KEY_REUSED',
  'SELF_APPROVAL_FORBIDDEN',
  'WAREHOUSE_SCOPE_VIOLATION',
];

const BASE = '/warehouse-transfers';

function transferPath(id: string): string {
  return `${BASE}/${encodeURIComponent(id)}`;
}

/** Newest first, headers only. */
export function listWarehouseTransfers(
  params: ListWarehouseTransfersParams = {},
  signal?: AbortSignal,
): Promise<OffsetPage<WarehouseTransferSummaryDto>> {
  return adminGet<OffsetPage<WarehouseTransferSummaryDto>>(
    BASE,
    {
      status: params.status,
      warehouseId: params.warehouseId,
      direction: params.warehouseId === undefined ? undefined : params.direction,
      page: params.page,
      pageSize: params.pageSize,
    },
    signal,
  );
}

/** One transfer with its lines; 404 when unknown or outside the caller's scope. */
export function getWarehouseTransfer(id: string, signal?: AbortSignal): Promise<WarehouseTransferDto> {
  return adminGet<WarehouseTransferDto>(transferPath(id), undefined, signal);
}

/** Initiate: PENDING_APPROVAL (high value or unvalued) or IN_TRANSIT (dispatched now). */
export function createWarehouseTransfer(body: WarehouseTransferCreate, idempotencyKey: string): Promise<WarehouseTransferDto> {
  return adminPost<WarehouseTransferDto>(BASE, body, { idempotencyKey });
}

/** Approve a PENDING_APPROVAL transfer, which dispatches it. No body. */
export function approveWarehouseTransfer(id: string, idempotencyKey: string): Promise<WarehouseTransferDto> {
  return adminPost<WarehouseTransferDto>(`${transferPath(id)}/approve`, undefined, { idempotencyKey });
}

/** Receive an IN_TRANSIT transfer at its destination. */
export function receiveWarehouseTransfer(
  id: string,
  body: WarehouseTransferReceive,
  idempotencyKey: string,
): Promise<WarehouseTransferDto> {
  return adminPost<WarehouseTransferDto>(`${transferPath(id)}/receive`, body, { idempotencyKey });
}

/** Cancel a PENDING_APPROVAL transfer (no stock has moved). The spec asks no Idempotency-Key here. */
export function cancelWarehouseTransfer(id: string, body: WarehouseTransferCancel): Promise<WarehouseTransferDto> {
  return adminPost<WarehouseTransferDto>(`${transferPath(id)}/cancel`, body);
}
