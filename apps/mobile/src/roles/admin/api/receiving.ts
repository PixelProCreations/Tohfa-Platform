/**
 * Goods receiving against purchase orders (docs/openapi.yaml tag Purchase):
 *   GET  /admin/purchase-orders                        purchase.order.view             (BR-30; Sub = own)
 *   GET  /admin/purchase-orders/{id}                   purchase.order.view
 *   GET  /admin/goods-receipts                         inventory.goods_receipt.record  (BR-30)
 *   POST /admin/goods-receipts                         inventory.goods_receipt.record  (BR-30, BR-37; Idempotency-Key)
 *   GET  /admin/goods-receipts/{id}                    inventory.goods_receipt.record
 *   POST /admin/goods-receipts/{id}/quality-check      inventory.quality_check.perform (BR-37; Idempotency-Key)
 *   POST /admin/goods-receipts/{id}/counter-offer      inventory.quality.counter_offer (BR-10, BR-11; Idempotency-Key)
 *
 * Quantities stay as the API's kg strings here (`Quantity`, at most 3
 * decimals) and Money as its decimal string; the screens' mappers turn them
 * into integer grams and paise. Ids are uuids; poNumber / grnNumber are the
 * human codes.
 *
 * The three writes take an Idempotency-Key as the spec asks. The server
 * IGNORES it on all three today (server gap), so a retry after a timeout could
 * record a second receipt; the wizard therefore keeps the created receipt id
 * and re-reads the order before it retries a create (see
 * screens/warehouse/receiving-qc/submission.ts).
 *
 * Spec gaps the types below make visible (docs/openapi.yaml should say these):
 *  - QualityCheckCreate: the server REQUIRES `items`, the five checklist rows,
 *    and refuses a rejected quantity without `defectNotes` (or a
 *    `rejectionReason` the spec does not list). Neither is in the spec.
 *  - GoodsReceipt rows also carry `poNumber`, `cropName` and `grade`, which the
 *    spec omits; they are typed optional and only used when present.
 *  - The batch the accepted goods were stocked as (BR-106) comes back on the
 *    quality check answer (`batch`) and on every receipt (`batchId`,
 *    `batchCode`, null until stocked); the app shows one only when it is sent.
 *
 * No UI imports, so the Main Warehouse admin can reuse this module.
 */
import type { ErrorCode, GenericProblemCode, Money } from '@tohfa/shared-types';
import type { Page } from '../../../shell/api/pagination';
import { adminGet, adminPost } from './http';
import type { BatchDto, Grade, QuantityKg } from './inventory';

/** docs/openapi.yaml `PurchaseOrderStatus`. */
export type PurchaseOrderStatus = 'ISSUED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';

/** docs/openapi.yaml `GoodsReceipt.status`. */
export type GoodsReceiptStatus = 'AWAITING_QC' | 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED' | 'COUNTER_OFFERED';

/** docs/openapi.yaml `QualityCheckCreate.outcome`. */
export type QualityOutcome = 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED';

/** docs/openapi.yaml `CounterOfferStatus`. */
export type CounterOfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'LAPSED';

/** docs/openapi.yaml `PurchaseOrder`. */
export interface PurchaseOrderDto {
  id: string;
  poNumber: string;
  farmerId: string;
  listingId?: string;
  warehouseId: string;
  cropId?: string;
  grade?: Grade;
  quantityKg: QuantityKg;
  pricePerKg: Money;
  totalAmount: Money;
  status: PurchaseOrderStatus;
  /** date (YYYY-MM-DD). */
  expectedDeliveryDate?: string | null;
  issuedAt?: string;
}

/** docs/openapi.yaml `PurchaseOrderDetail`: the order plus the farmer and its receipts (admin-only, BR-16). */
export interface PurchaseOrderDetailDto extends PurchaseOrderDto {
  farmerName?: string;
  tohfaFarmerId?: string;
  /** In the spec; the server does not send it today. */
  receivedQtyKg?: QuantityKg;
  goodsReceipts?: GoodsReceiptDto[];
}

/** docs/openapi.yaml `GoodsReceipt`. */
export interface GoodsReceiptDto {
  id: string;
  grnNumber: string;
  purchaseOrderId: string;
  warehouseId: string;
  grossQtyKg: QuantityKg;
  acceptedQtyKg?: QuantityKg;
  rejectedQtyKg?: QuantityKg;
  rejectionReason?: string | null;
  vehicleNumber?: string | null;
  photos?: string[];
  status: GoodsReceiptStatus;
  /** A user uuid only; the spec carries no name. */
  receivedBy?: string;
  receivedAt: string;
  /** BR-106: the batch this receipt was stocked as; null until accepted goods are stocked. */
  batchId?: string | null;
  /** BR-106: that batch's code (`BATCH-<year>-<6 digits>`). */
  batchCode?: string | null;
  /** Sent by the server, not in the spec (spec gap). */
  poNumber?: string;
  /** Sent by the server, not in the spec (spec gap). */
  cropName?: string;
  /** Sent by the server, not in the spec (spec gap). */
  grade?: Grade;
}

/** docs/openapi.yaml `GoodsReceiptCreate`. */
export interface GoodsReceiptCreate {
  purchaseOrderId: string;
  warehouseId: string;
  grossQtyKg: QuantityKg;
  vehicleNumber?: string;
  photos?: string[];
  remarks?: string;
}

/** The five checklist rows the server requires on a quality check (spec gap: not in QualityCheckCreate). */
export type QualityCheckParameter = 'APPEARANCE' | 'SIZE_UNIFORMITY' | 'MOISTURE' | 'DAMAGE_PEST' | 'FRESHNESS';

export interface QualityCheckItem {
  parameter: QualityCheckParameter;
  passed: boolean;
}

/** docs/openapi.yaml `QualityCheckCreate`, plus the server-required `items`. */
export interface QualityCheckCreate {
  assignedGrade: Grade;
  outcome: QualityOutcome;
  acceptedQtyKg: QuantityKg;
  rejectedQtyKg?: QuantityKg;
  moisturePct?: number;
  /** Whole number 0-10. */
  visualScore?: number;
  defectNotes?: string;
  photos?: string[];
  /** Signed per-kg adjustment when the assigned grade differs from the listed one. */
  priceAdjustment?: Money;
  /** Free text (max 40); the app sends a storage location's code. */
  storageLocation?: string;
  /** date (YYYY-MM-DD). */
  expiryOn?: string;
  items: QualityCheckItem[];
}

/** docs/openapi.yaml `QualityCheck`. */
export interface QualityCheckDto {
  id: string;
  goodsReceiptId: string;
  assignedGrade: Grade;
  outcome: QualityOutcome;
  acceptedQtyKg?: QuantityKg;
  rejectedQtyKg?: QuantityKg;
  moisturePct?: number | null;
  visualScore?: number | null;
  defectNotes?: string | null;
  photos?: string[];
  priceAdjustment?: Money;
  checkedBy?: string;
  checkedAt: string;
}

/** The 201 body of POST .../quality-check: the check, and the batch when stock was accepted. */
export interface QualityCheckResultDto {
  qualityCheck: QualityCheckDto;
  batch?: BatchDto | null;
}

/** docs/openapi.yaml `CounterOfferCreate`. */
export interface CounterOfferCreate {
  pricePerKg: Money;
  quantityKg: QuantityKg;
  message?: string;
}

/** docs/openapi.yaml `CounterOffer`. */
export interface CounterOfferDto {
  id: string;
  listingId?: string | null;
  goodsReceiptId?: string | null;
  round: number;
  offeredBy: 'ADMIN' | 'FARMER';
  offeredByUserId?: string | null;
  pricePerKg: Money;
  quantityKg: QuantityKg;
  message?: string | null;
  status: CounterOfferStatus;
  /** Created plus the configured window (BR-10). */
  expiresAt: string;
  respondedAt?: string | null;
}

export interface ListPurchaseOrdersParams {
  cursor?: string | undefined;
  /** 1-100, server default 20. */
  limit?: number | undefined;
  status?: PurchaseOrderStatus | undefined;
  warehouseId?: string | undefined;
}

export interface ListGoodsReceiptsParams {
  cursor?: string | undefined;
  limit?: number | undefined;
  warehouseId?: string | undefined;
  status?: GoodsReceiptStatus | undefined;
  purchaseOrderId?: string | undefined;
}

/**
 * Problem codes these endpoints document: 401/403/404/422/500 and the 409s
 * (CONFLICT on a QC already recorded or a pending offer, INVALID_STATE_TRANSITION
 * and COUNTER_LIMIT_REACHED on the counter-offer, BR-11). COUNTER_OFFER_EXPIRED
 * (BR-10) is the counter-offer window's code; the farmer's late answer gets it.
 */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'VALIDATION_FAILED',
  'INTERNAL',
  'INVALID_STATE_TRANSITION',
  'COUNTER_LIMIT_REACHED',
  'COUNTER_OFFER_EXPIRED',
];

export function listPurchaseOrders(params: ListPurchaseOrdersParams = {}, signal?: AbortSignal): Promise<Page<PurchaseOrderDto>> {
  return adminGet<Page<PurchaseOrderDto>>(
    '/admin/purchase-orders',
    { cursor: params.cursor, limit: params.limit, status: params.status, warehouseId: params.warehouseId },
    signal,
  );
}

/** One order with its farmer and receipts; 404 when it is outside the caller's scope. */
export function getPurchaseOrder(id: string, signal?: AbortSignal): Promise<PurchaseOrderDetailDto> {
  return adminGet<PurchaseOrderDetailDto>(`/admin/purchase-orders/${encodeURIComponent(id)}`, undefined, signal);
}

export function listGoodsReceipts(params: ListGoodsReceiptsParams = {}, signal?: AbortSignal): Promise<Page<GoodsReceiptDto>> {
  return adminGet<Page<GoodsReceiptDto>>(
    '/admin/goods-receipts',
    {
      cursor: params.cursor,
      limit: params.limit,
      warehouseId: params.warehouseId,
      status: params.status,
      purchaseOrderId: params.purchaseOrderId,
    },
    signal,
  );
}

export function getGoodsReceipt(id: string, signal?: AbortSignal): Promise<GoodsReceiptDto> {
  return adminGet<GoodsReceiptDto>(`/admin/goods-receipts/${encodeURIComponent(id)}`, undefined, signal);
}

/** Record a delivery against an order; the receipt starts AWAITING_QC. */
export function createGoodsReceipt(body: GoodsReceiptCreate, idempotencyKey: string): Promise<GoodsReceiptDto> {
  return adminPost<GoodsReceiptDto>('/admin/goods-receipts', body, { idempotencyKey });
}

/** Record the quality check of a receipt awaiting QC (409 CONFLICT once it has one). */
export function recordQualityCheck(id: string, body: QualityCheckCreate, idempotencyKey: string): Promise<QualityCheckResultDto> {
  return adminPost<QualityCheckResultDto>(`/admin/goods-receipts/${encodeURIComponent(id)}/quality-check`, body, { idempotencyKey });
}

/** Offer the farmer a revised price for the delivered lot (a round of the listing's negotiation, BR-10/BR-11). */
export function createCounterOffer(id: string, body: CounterOfferCreate, idempotencyKey: string): Promise<CounterOfferDto> {
  return adminPost<CounterOfferDto>(`/admin/goods-receipts/${encodeURIComponent(id)}/counter-offer`, body, { idempotencyKey });
}
