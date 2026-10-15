/**
 * Physical stock verification (docs/openapi.yaml /admin/stock-verifications, BR-106):
 *   GET  /admin/stock-verifications                  inventory.stock_verification.perform (BR-30; Sub = own warehouse)
 *   GET  /admin/stock-verifications/{id}             inventory.stock_verification.perform (404 outside scope)
 *   POST /admin/stock-verifications                  inventory.stock_verification.perform (Idempotency-Key)
 *   POST /admin/stock-verifications/{id}/adjustment  inventory.stock_adjustment.create     (Idempotency-Key)
 *
 * Shapes mirror apps/api/src/modules/stock-verifications/stock-verifications.schema.ts.
 *
 * A count never edits the ledger. Recording one makes the SERVER snapshot the
 * batch's ledger balance (`systemQtyKg`) and derive `varianceKg` (counted -
 * system, signed); the app sends only what was counted. A matching count is
 * RECONCILED at once, any other RECORDED. Raising an adjustment for a
 * RECORDED count with a non-zero variance creates one PENDING COUNT_CORRECTION
 * of exactly the variance and marks the count RECONCILED; the stock moves only
 * when someone other than the raiser approves that adjustment (BR-37a/b).
 *
 * Quantities are kg decimal strings (numeric(12,3)); the screens' mappers turn
 * them into integer grams.
 *
 * No UI imports, so any admin area can reuse this module.
 */
import type { ErrorCode, GenericProblemCode } from '@tohfa/shared-types';
import type { OffsetPage } from '../../../shell/api/pagination';
import { adminGet, adminPost } from './http';
import type { QuantityKg } from './inventory';
import type { StockAdjustmentDto, StockAdjustmentStatus } from './stockAdjustments';

/** stock-verifications.schema.ts VERIFICATION_STATUSES. DISPUTED is never written by the API yet. */
export const STOCK_VERIFICATION_STATUSES = ['RECORDED', 'RECONCILED', 'DISPUTED'] as const;
export type StockVerificationStatus = (typeof STOCK_VERIFICATION_STATUSES)[number];

/** Notes length the server accepts (trimmed). */
export const VERIFICATION_NOTES_MAX = 1000;

/** One count (list, detail, record). */
export interface StockVerificationDto {
  id: string;
  warehouseId: string;
  batchId: string;
  batchCode: string;
  cropId: string;
  grade: string;
  /** The ledger balance the server snapshotted when the count was recorded. */
  systemQtyKg: QuantityKg;
  countedQtyKg: QuantityKg;
  /** counted - system, signed (negative = stock missing). */
  varianceKg: QuantityKg;
  status: StockVerificationStatus;
  notes: string | null;
  verifiedBy: string;
  verifiedAt: string;
  adjustmentId: string | null;
  adjustmentStatus: StockAdjustmentStatus | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface StockVerificationCreate {
  batchId: string;
  /** What was physically counted, kg, zero allowed. */
  countedQtyKg: QuantityKg;
  /** 1-1000 characters when sent. */
  notes?: string;
}

export interface RaiseVerificationAdjustment {
  /** 5-500 characters when sent; the server names the count when absent. */
  reason?: string;
}

/** POST /{id}/adjustment answers both rows. */
export interface RaisedVerificationAdjustmentDto {
  verification: StockVerificationDto;
  adjustment: StockAdjustmentDto;
}

export interface ListStockVerificationsParams {
  status?: StockVerificationStatus | undefined;
  warehouseId?: string | undefined;
  batchId?: string | undefined;
  /** true: only counts whose variance is not zero. */
  hasVariance?: boolean | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

/**
 * Problem codes these routes document: 401/403/404/409/422/500, the 409s
 * INVALID_STATE_TRANSITION (zero variance, already raised), STOCK_UNAVAILABLE
 * (stock left the batch since the count) and IDEMPOTENCY_KEY_REUSED.
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
];

const BASE = '/admin/stock-verifications';

function verificationPath(id: string): string {
  return `${BASE}/${encodeURIComponent(id)}`;
}

/** Newest first. `hasVariance` goes on the wire as the string the server's enum expects. */
export function listStockVerifications(
  params: ListStockVerificationsParams = {},
  signal?: AbortSignal,
): Promise<OffsetPage<StockVerificationDto>> {
  return adminGet<OffsetPage<StockVerificationDto>>(
    BASE,
    {
      status: params.status,
      warehouseId: params.warehouseId,
      batchId: params.batchId,
      hasVariance: params.hasVariance === undefined ? undefined : String(params.hasVariance),
      page: params.page,
      pageSize: params.pageSize,
    },
    signal,
  );
}

/** One count; 404 when unknown or outside the caller's scope. */
export function getStockVerification(id: string, signal?: AbortSignal): Promise<StockVerificationDto> {
  return adminGet<StockVerificationDto>(verificationPath(id), undefined, signal);
}

/** Record a count. The server snapshots the system quantity; nothing is written to the ledger. */
export function createStockVerification(body: StockVerificationCreate, idempotencyKey: string): Promise<StockVerificationDto> {
  return adminPost<StockVerificationDto>(BASE, body, { idempotencyKey });
}

/** Hand a RECORDED count's variance to the adjustment workflow (a PENDING COUNT_CORRECTION). */
export function raiseVerificationAdjustment(
  id: string,
  body: RaiseVerificationAdjustment,
  idempotencyKey: string,
): Promise<RaisedVerificationAdjustmentDto> {
  return adminPost<RaisedVerificationAdjustmentDto>(`${verificationPath(id)}/adjustment`, body, { idempotencyKey });
}
