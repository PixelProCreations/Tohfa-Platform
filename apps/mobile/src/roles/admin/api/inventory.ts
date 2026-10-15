/**
 * Warehouse inventory, read side (docs/openapi.yaml tag Inventory):
 *   GET /admin/batches            inventory.batch.view            (BR-16, BR-24, BR-30)
 *   GET /admin/batches/{id}       inventory.batch.view
 *   GET /admin/stock-ledger       inventory.stock_ledger.view_own (BR-30, BR-37)
 *   GET /admin/allocations        allocation.dashboard.view       (BR-12, BR-100)
 *
 * Quantities stay as the API's kg strings here (`Quantity`, 3 decimals at
 * most); the screens' mappers turn them into integer grams. Ids are uuids;
 * `batchCode` is the human code.
 *
 * No write lives here: stock adjustments (BR-37) and physical counts (BR-106)
 * have their own clients, ./stockAdjustments.ts and ./stockVerifications.ts.
 *
 * The functions send a warehouseId only when the caller passes one. The server
 * scopes every call to the caller's own warehouse anyway (BR-30); a Sub screen
 * passes its own warehouse so the cache key and the request agree.
 *
 * Grade and AllocationChannel are typed here from the spec, not taken from
 * @tohfa/shared-types, whose enums of those names hold different values
 * (A/B/C, RETAIL/BULK/...) than docs/openapi.yaml; the spec wins.
 *
 * No UI imports, so the Main Warehouse admin can reuse this module.
 */
import type { GenericProblemCode, Money } from '@tohfa/shared-types';
import type { Page } from '../../../shell/api/pagination';
import { adminGet } from './http';

/** docs/openapi.yaml `Quantity`: kg as a decimal string, at most 3 places, signed only on ledger rows. */
export type QuantityKg = string;

/** docs/openapi.yaml `Grade`. */
export type Grade = 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT';

/** docs/openapi.yaml `BatchStatus`. */
export type BatchStatus = 'ACTIVE' | 'DEPLETED' | 'EXPIRED' | 'WRITTEN_OFF';

/** docs/openapi.yaml `StockTxnType`. */
export type StockTxnType =
  | 'RECEIPT'
  | 'SALE'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'ADJUSTMENT'
  | 'WASTAGE'
  | 'RETURN_IN'
  | 'RESERVATION'
  | 'RELEASE';

/** docs/openapi.yaml `AllocationChannel` (the BR-12 buckets). */
export type AllocationChannel = 'ONLINE' | 'LIVE_MARKET' | 'RESERVE' | 'BUFFER';

/** docs/openapi.yaml `Batch`. `sourceFarmerId` is admin-only traceability (BR-16). */
export interface BatchDto {
  id: string;
  batchCode: string;
  warehouseId: string;
  cropId: string;
  cropName?: string;
  grade: Grade;
  goodsReceiptId?: string | null;
  sourceFarmerId?: string | null;
  qtyReceivedKg?: QuantityKg;
  qtyAvailableKg: QuantityKg;
  qtyReservedKg?: QuantityKg;
  costPerKg?: Money;
  storageLocation?: string | null;
  /** date (YYYY-MM-DD). */
  receivedOn?: string;
  expiryOn?: string | null;
  status: BatchStatus;
}

/** docs/openapi.yaml `StockLedgerEntry`: append-only; corrections are new rows (BR-37). */
export interface StockLedgerEntryDto {
  id: string;
  batchId: string;
  warehouseId: string;
  txnType: StockTxnType;
  /** Signed: negative for outflows. */
  qtyDeltaKg: QuantityKg;
  balanceAfterKg: QuantityKg;
  refType?: string | null;
  refId?: string | null;
  /** A user uuid only; the spec carries no name. */
  performedBy?: string | null;
  performedAt: string;
  remarks?: string | null;
}

/** docs/openapi.yaml `Allocation`. */
export interface AllocationDto {
  id: string;
  warehouseId: string;
  cropId: string;
  grade: Grade;
  /** date (YYYY-MM-DD). */
  allocationDate: string;
  channel: AllocationChannel;
  allocatedQtyKg: QuantityKg;
  consumedQtyKg?: QuantityKg;
  /** Held by customer carts (BR-22). */
  reservedQtyKg?: QuantityKg;
  /** Effective availability, capped by the batch's unclaimed shelf (BR-100). */
  availableQtyKg?: QuantityKg;
  computedBy?: 'AUTO' | 'MANUAL';
  overriddenBy?: string | null;
}

export interface ListBatchesParams {
  cursor?: string | undefined;
  /** 1-100, server default 20. */
  limit?: number | undefined;
  warehouseId?: string | undefined;
  cropId?: string | undefined;
  grade?: Grade | undefined;
  status?: BatchStatus | undefined;
}

export interface ListStockLedgerParams {
  cursor?: string | undefined;
  limit?: number | undefined;
  batchId?: string | undefined;
  warehouseId?: string | undefined;
  txnType?: StockTxnType | undefined;
  /** date-time. */
  from?: string | undefined;
  /** date-time. */
  to?: string | undefined;
}

export interface ListAllocationsParams {
  cursor?: string | undefined;
  limit?: number | undefined;
  warehouseId?: string | undefined;
  /** date (YYYY-MM-DD). */
  allocationDate?: string | undefined;
  channel?: AllocationChannel | undefined;
}

/** Problem codes these endpoints document (401, 403, 404 on the detail, 500). */
export const ERROR_CODES: readonly GenericProblemCode[] = ['UNAUTHENTICATED', 'FORBIDDEN', 'NOT_FOUND', 'INTERNAL'];

export function listBatches(params: ListBatchesParams = {}, signal?: AbortSignal): Promise<Page<BatchDto>> {
  return adminGet<Page<BatchDto>>(
    '/admin/batches',
    {
      cursor: params.cursor,
      limit: params.limit,
      warehouseId: params.warehouseId,
      cropId: params.cropId,
      grade: params.grade,
      status: params.status,
    },
    signal,
  );
}

/** One batch; 404 when it does not exist or is outside the caller's scope. */
export function getBatch(id: string, signal?: AbortSignal): Promise<BatchDto> {
  return adminGet<BatchDto>(`/admin/batches/${encodeURIComponent(id)}`, undefined, signal);
}

/** Ledger rows, newest first. */
export function listStockLedger(params: ListStockLedgerParams = {}, signal?: AbortSignal): Promise<Page<StockLedgerEntryDto>> {
  return adminGet<Page<StockLedgerEntryDto>>(
    '/admin/stock-ledger',
    {
      cursor: params.cursor,
      limit: params.limit,
      batchId: params.batchId,
      warehouseId: params.warehouseId,
      txnType: params.txnType,
      from: params.from,
      to: params.to,
    },
    signal,
  );
}

export function listAllocations(params: ListAllocationsParams = {}, signal?: AbortSignal): Promise<Page<AllocationDto>> {
  return adminGet<Page<AllocationDto>>(
    '/admin/allocations',
    {
      cursor: params.cursor,
      limit: params.limit,
      warehouseId: params.warehouseId,
      allocationDate: params.allocationDate,
      channel: params.channel,
    },
    signal,
  );
}
