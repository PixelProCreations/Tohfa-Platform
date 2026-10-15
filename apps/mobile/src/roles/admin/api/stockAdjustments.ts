/**
 * Manual stock adjustments (docs/openapi.yaml /admin/stock-adjustments, BR-37):
 *   GET  /admin/stock-adjustments               inventory.stock_adjustment.create  (BR-30; Sub = own warehouse)
 *   GET  /admin/stock-adjustments/{id}          inventory.stock_adjustment.create  (404 outside scope, never 403)
 *   POST /admin/stock-adjustments               inventory.stock_adjustment.create  (Idempotency-Key)
 *   POST /admin/stock-adjustments/{id}/approve  inventory.stock_adjustment.approve (SA, TOHFA, MAIN; Sub none; Idempotency-Key)
 *   POST /admin/stock-adjustments/{id}/reject   inventory.stock_adjustment.approve (reason required)
 *
 * Shapes mirror apps/api/src/modules/stock-adjustments/stock-adjustments.schema.ts.
 * Quantities are signed kg decimal STRINGS (numeric(12,3)) both ways; the
 * screens' mappers turn them into integer grams, so no kilogram figure passes
 * through a float.
 *
 * An adjustment never moves stock on creation: it is PENDING until someone
 * other than its creator approves it, and the approval inserts one ADJUSTMENT
 * ledger row (BR-37b). The creator approving or rejecting their own
 * adjustment is 403 SELF_APPROVAL_FORBIDDEN (BR-37a); a Sub admin holds no
 * approve grant and gets 403 FORBIDDEN from the permission gate.
 *
 * The list pages by number (`items, page, pageSize, total`), not by cursor.
 *
 * No UI imports, so any admin area can reuse this module.
 */
import type { ErrorCode, GenericProblemCode } from '@tohfa/shared-types';
import type { OffsetPage } from '../../../shell/api/pagination';
import { adminGet, adminPost } from './http';
import type { QuantityKg } from './inventory';

/** stock-adjustments.schema.ts ADJUSTMENT_TYPES. */
export const STOCK_ADJUSTMENT_TYPES = ['DAMAGE', 'SHRINKAGE', 'COUNT_CORRECTION', 'EXPIRY'] as const;
export type StockAdjustmentType = (typeof STOCK_ADJUSTMENT_TYPES)[number];

/** stock-adjustments.schema.ts ADJUSTMENT_STATUSES. */
export const STOCK_ADJUSTMENT_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type StockAdjustmentStatus = (typeof STOCK_ADJUSTMENT_STATUSES)[number];

/**
 * Types that can only remove stock (server LOSS_ONLY_TYPES, BR-37 note): only
 * a COUNT_CORRECTION may add stock, because only a count can find stock the
 * ledger does not know about. The server refuses a positive loss with 422.
 */
export const LOSS_ONLY_ADJUSTMENT_TYPES: readonly StockAdjustmentType[] = ['DAMAGE', 'SHRINKAGE', 'EXPIRY'];

/** Reason length the server accepts on create (trimmed). */
export const ADJUSTMENT_REASON_MIN = 5;
export const ADJUSTMENT_REASON_MAX = 500;
/** Reason length the server accepts on reject (trimmed). */
export const REJECT_REASON_MAX = 500;

/** One adjustment (list, detail, create, approve, reject). User fields are uuids only. */
export interface StockAdjustmentDto {
  id: string;
  batchId: string;
  batchCode: string;
  warehouseId: string;
  cropId: string;
  grade: string;
  adjustmentType: StockAdjustmentType;
  /** Signed: negative removes stock. */
  qtyDeltaKg: QuantityKg;
  reason: string;
  status: StockAdjustmentStatus;
  createdBy: string;
  createdAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  /** The stock_ledger row the approval inserted (BR-37b); null until APPROVED. */
  ledgerEntryId: string | null;
  /** The BR-106 stock count this adjustment was raised from, if any. */
  verificationId: string | null;
  updatedAt: string | null;
}

export interface StockAdjustmentCreate {
  batchId: string;
  adjustmentType: StockAdjustmentType;
  /** Signed kg string, never zero; negative for DAMAGE, SHRINKAGE and EXPIRY. */
  qtyDeltaKg: QuantityKg;
  /** 5-500 characters. */
  reason: string;
}

export interface StockAdjustmentReject {
  /** 1-500 characters. */
  reason: string;
}

export interface ListStockAdjustmentsParams {
  status?: StockAdjustmentStatus | undefined;
  warehouseId?: string | undefined;
  batchId?: string | undefined;
  adjustmentType?: StockAdjustmentType | undefined;
  /** From 1. */
  page?: number | undefined;
  /** 1-100, server default 20. */
  pageSize?: number | undefined;
}

/**
 * Problem codes these routes document: 401/403/404/409/422/500, the 409s
 * INVALID_STATE_TRANSITION (already decided), STOCK_UNAVAILABLE (a removal
 * larger than the batch balance) and IDEMPOTENCY_KEY_REUSED, and the 403
 * SELF_APPROVAL_FORBIDDEN (deciding one's own adjustment, BR-37a).
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
];

const BASE = '/admin/stock-adjustments';

function adjustmentPath(id: string): string {
  return `${BASE}/${encodeURIComponent(id)}`;
}

/** Newest first. Another warehouse (for a Sub admin) is an empty page, never a 403. */
export function listStockAdjustments(
  params: ListStockAdjustmentsParams = {},
  signal?: AbortSignal,
): Promise<OffsetPage<StockAdjustmentDto>> {
  return adminGet<OffsetPage<StockAdjustmentDto>>(
    BASE,
    {
      status: params.status,
      warehouseId: params.warehouseId,
      batchId: params.batchId,
      adjustmentType: params.adjustmentType,
      page: params.page,
      pageSize: params.pageSize,
    },
    signal,
  );
}

/** One adjustment; 404 when unknown or outside the caller's scope. */
export function getStockAdjustment(id: string, signal?: AbortSignal): Promise<StockAdjustmentDto> {
  return adminGet<StockAdjustmentDto>(adjustmentPath(id), undefined, signal);
}

/** Raise a PENDING adjustment. No stock moves until someone else approves it. */
export function createStockAdjustment(body: StockAdjustmentCreate, idempotencyKey: string): Promise<StockAdjustmentDto> {
  return adminPost<StockAdjustmentDto>(BASE, body, { idempotencyKey });
}

/** Approve a PENDING adjustment, which writes its ledger row. No body. */
export function approveStockAdjustment(id: string, idempotencyKey: string): Promise<StockAdjustmentDto> {
  return adminPost<StockAdjustmentDto>(`${adjustmentPath(id)}/approve`, undefined, { idempotencyKey });
}

/** Reject a PENDING adjustment with a reason. Moves no stock, so the spec asks no Idempotency-Key. */
export function rejectStockAdjustment(id: string, body: StockAdjustmentReject): Promise<StockAdjustmentDto> {
  return adminPost<StockAdjustmentDto>(`${adjustmentPath(id)}/reject`, body);
}
