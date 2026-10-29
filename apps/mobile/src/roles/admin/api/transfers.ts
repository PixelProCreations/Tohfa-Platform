/**
 * One inter-warehouse transfer and its receipt (docs/openapi.yaml tag
 * Inventory, BR-102):
 *   GET  /warehouse-transfers/{id}          transfer.inter_warehouse.view     (BR-30; 404 outside scope, never 403)
 *   POST /warehouse-transfers/{id}/receive  transfer.inter_warehouse.receive  (destination only; Idempotency-Key)
 *
 * The list (GET /warehouse-transfers) stays in ./warehouseTransfers.ts, which
 * is read-only on purpose; this module adds the one write the receiving
 * screens need. Initiate, approve and cancel are not here (not part of
 * receiving).
 *
 * Quantities are kg decimal STRINGS both ways (`Quantity`, 3 places); the
 * screens' mappers turn them into integer grams, so no kilogram figure ever
 * passes through a float. Money stays the API's decimal string.
 *
 * The receive is a stock-moving write: it needs an Idempotency-Key, and a
 * replay of the same key and body returns the original answer and moves
 * nothing twice (root CLAUDE.md 2.4, BR-118). The caller keeps one key per
 * body (screens/warehouse/transfers/transferReceiving.ts).
 *
 * The lines and header also carry the BR-126 receive details (receipt number,
 * initiator name, per-line damage / spoilage / condition / actual grade and
 * product / storage location). They are deliberately NOT typed or sent here:
 * the receiving screens do not use them yet (orchestrator decision), and an
 * untyped field cannot be rendered by accident.
 *
 * No UI imports, so any admin shell can reuse this module.
 */
import type { ErrorCode, GenericProblemCode, Money } from '@tohfa/shared-types';
import type { QuantityKg } from './inventory';
import { adminGet, adminPost } from './http';
import type { WarehouseTransferDto } from './warehouseTransfers';

/** docs/openapi.yaml `WarehouseTransferLine` (the fields the receiving screens read). Never the source farmer (BR-16). */
export interface WarehouseTransferLineDto {
  id: string;
  /** The source batch. */
  batchId: string;
  batchCode: string;
  cropId: string;
  /** e.g. GRADE_1. */
  grade: string;
  qtySentKg: QuantityKg;
  /** Null until received. */
  qtyReceivedKg: QuantityKg | null;
  /** qtyReceivedKg - qtySentKg (zero or negative); null until received. */
  varianceKg: QuantityKg | null;
  costPerKg: Money | null;
  lineValue: Money | null;
  /** The batch created at the destination; null until received or when 0 was received. */
  destBatchId: string | null;
}

/** docs/openapi.yaml `WarehouseTransfer`: the header plus its lines. */
export interface WarehouseTransferDetailDto extends WarehouseTransferDto {
  lines: WarehouseTransferLineDto[];
}

/** docs/openapi.yaml `WarehouseTransferReceive` (the BR-102 fields only). */
export interface WarehouseTransferReceive {
  /** Every line of the transfer exactly once, 0 to its qtySentKg. */
  lines: { itemId: string; qtyReceivedKg: QuantityKg }[];
  /** Required when any line is short; 1-1000 characters. */
  receiptNote?: string;
}

/**
 * Problem codes the two routes document: 401/403/404/409/422/500, the 409s
 * INVALID_STATE_TRANSITION (not IN_TRANSIT) and IDEMPOTENCY_KEY_REUSED (the
 * same key with another body), and the 403 WAREHOUSE_SCOPE_VIOLATION (a Sub
 * admin of the SOURCE trying to receive).
 */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'VALIDATION_FAILED',
  'INTERNAL',
  'INVALID_STATE_TRANSITION',
  'IDEMPOTENCY_KEY_REUSED',
  'WAREHOUSE_SCOPE_VIOLATION',
];

function transferPath(id: string): string {
  return `/warehouse-transfers/${encodeURIComponent(id)}`;
}

/** One transfer with its lines; 404 when unknown or outside the caller's scope (BR-30). */
export function getWarehouseTransfer(id: string, signal?: AbortSignal): Promise<WarehouseTransferDetailDto> {
  return adminGet<WarehouseTransferDetailDto>(transferPath(id), undefined, signal);
}

/** Receive an IN_TRANSIT transfer at its destination; answers the transfer, now RECEIVED. */
export function receiveWarehouseTransfer(
  id: string,
  body: WarehouseTransferReceive,
  idempotencyKey: string,
): Promise<WarehouseTransferDetailDto> {
  return adminPost<WarehouseTransferDetailDto>(`${transferPath(id)}/receive`, body, { idempotencyKey });
}

export interface WarehouseTransferCreateLineDto {
  batchId: string;
  qtyKg: string;
}

export interface WarehouseTransferCreateDto {
  fromWarehouseId: string;
  toWarehouseId: string;
  lines: WarehouseTransferCreateLineDto[];
  vehicleNumber?: string | undefined;
  notes?: string | undefined;
}

/** Initiate an inter-warehouse transfer (Main Warehouse Admin / Super only). */
export function createWarehouseTransfer(
  body: WarehouseTransferCreateDto,
  idempotencyKey: string,
): Promise<WarehouseTransferDetailDto> {
  return adminPost<WarehouseTransferDetailDto>('/warehouse-transfers', body, { idempotencyKey });
}

/** Approve a high-value transfer. */
export function approveWarehouseTransfer(id: string): Promise<WarehouseTransferDetailDto> {
  return adminPost<WarehouseTransferDetailDto>(`${transferPath(id)}/approve`, {});
}

/** Cancel a transfer before receipt. */
export function cancelWarehouseTransfer(id: string): Promise<WarehouseTransferDetailDto> {
  return adminPost<WarehouseTransferDetailDto>(`${transferPath(id)}/cancel`, {});
}
