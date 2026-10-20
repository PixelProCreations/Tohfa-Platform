/**
 * Warehouse operations reads and the capacity write not covered by
 * ./warehouses.ts (docs/openapi.yaml):
 *   GET   /warehouses/{id}/performance?from&to  warehouse.all.view     (BR-80; Sub = none)
 *   PATCH /warehouses/{id}/capacity             warehouse.capacity.set (BR-66b; Sub = none)
 *
 * The capacity READ (`getWarehouseCapacity`, warehouse.own.view) stays in
 * ./warehouses.ts and is not redefined here.
 *
 * Performance is a set of exact counts and kg sums from existing rows (orders,
 * goods receipts, return requests, stock-ledger movements) for an inclusive IST
 * date range. It deliberately carries no score, rate, SLA, target or ranking
 * (the data model has no column for them), so a screen must not show any.
 * A Sub admin does not hold `warehouse.all.view` and gets 403 here.
 *
 * Quantities are kg decimal strings (3 decimals), never numbers. The capacity
 * PATCH body is `{ capacityKg }` as such a string. No Idempotency-Key: nothing
 * here moves money. No UI imports.
 */
import type { GenericProblemCode } from '@tohfa/shared-types';
import { adminGet, adminPatch } from './http';
import type { WarehouseCapacityDto } from './warehouses';

/** One `{ status, count }` of a by-status breakdown; statuses are the server's enums, passed through. */
export interface StatusCountDto {
  status: string;
  count: number;
}

/** `stock_movement_type` (db enum), as the server sends it. */
export type StockMovementTypeCode =
  | 'RECEIPT'
  | 'SALE'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'ADJUSTMENT'
  | 'WASTAGE'
  | 'RETURN_IN'
  | 'RESERVATION'
  | 'RELEASE';

/** docs/openapi.yaml `WarehousePerformance`. */
export interface WarehousePerformanceDto {
  warehouseId: string;
  from: string;
  to: string;
  orders: {
    placed: number;
    /** PICKED_UP or DELIVERED. */
    fulfilled: number;
    cancelled: number;
    byStatus: StatusCountDto[];
  };
  receiving: {
    goodsReceipts: number;
    byStatus: StatusCountDto[];
    grossQtyKg: string;
    acceptedQtyKg: string;
    rejectedQtyKg: string;
  };
  returns: {
    requested: number;
    byStatus: StatusCountDto[];
  };
  /** Per movement type; `qtyKg` is the signed sum of the ledger deltas. */
  stockMovements: { movementType: StockMovementTypeCode; entries: number; qtyKg: string }[];
}

/** 401, 403 (no warehouse.all.view / capacity.set), 404, 422 (bad range or body), 500. */
export const ERROR_CODES: readonly GenericProblemCode[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'INTERNAL',
];

/** `from` and `to` are inclusive YYYY-MM-DD IST dates, `from <= to`; the span cap is server config. */
export function getWarehousePerformance(
  warehouseId: string,
  range: { from: string; to: string },
  signal?: AbortSignal,
): Promise<WarehousePerformanceDto> {
  return adminGet<WarehousePerformanceDto>(
    `/warehouses/${encodeURIComponent(warehouseId)}/performance`,
    { from: range.from, to: range.to },
    signal,
  );
}

/** Sets the warehouse capacity; `capacityKg` is a positive kg decimal string (at most 3 decimals). */
export function updateWarehouseCapacity(warehouseId: string, capacityKg: string): Promise<WarehouseCapacityDto> {
  return adminPatch<WarehouseCapacityDto>(`/warehouses/${encodeURIComponent(warehouseId)}/capacity`, { capacityKg });
}
