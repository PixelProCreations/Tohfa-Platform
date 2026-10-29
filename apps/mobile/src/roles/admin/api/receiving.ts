/**
 * Goods receiving against purchase orders (docs/openapi.yaml tag Purchase, as
 * on origin/feat/admin-apis-for-mobile):
 *   GET  /admin/purchase-orders                          purchase.order.view             (BR-30, BR-122)
 *   GET  /admin/purchase-orders/{id}                     purchase.order.view             (BR-119)
 *   GET  /admin/goods-receipts                           inventory.goods_receipt.record  (BR-30, BR-119, BR-122)
 *   POST /admin/goods-receipts                           inventory.goods_receipt.record  (BR-37, BR-118, BR-123; Idempotency-Key)
 *   GET  /admin/goods-receipts/{id}                      inventory.goods_receipt.record  (BR-119, BR-120: with its quality check)
 *   GET  /admin/goods-receipts/{id}/document             inventory.goods_receipt.record  (BR-124: printable receipt note)
 *   POST /admin/goods-receipts/{id}/quality-check        inventory.quality_check.perform (BR-106, BR-118, BR-120; Idempotency-Key)
 *   GET  /admin/goods-receipts/{id}/discrepancies        inventory.goods_receipt.record  (BR-121)
 *   POST /admin/goods-receipts/{id}/discrepancies        inventory.quality_check.perform (BR-121; Idempotency-Key)
 *   POST /admin/goods-receipts/{id}/counter-offer        inventory.quality.counter_offer (BR-10, BR-11, BR-118; Idempotency-Key)
 *
 * Quantities stay as the API's kg strings here (`Quantity`, at most 3
 * decimals) and Money as its decimal string; the screens' mappers turn them
 * into integer grams and paise. Ids are uuids; poNumber / grnNumber are the
 * human codes.
 *
 * Every write takes an Idempotency-Key and the server honours it (BR-118): a
 * replay with the same key and body returns the original answer and writes
 * nothing; the same key with another body is 409 IDEMPOTENCY_KEY_REUSED. So a
 * retry reuses the key of the same body (the wizard's key ring), and a
 * changed body gets a new key.
 *
 * BR-106: the quality check stocks the accepted goods as ONE batch and copies
 * the storage location onto it in the same call. There is no separate batch
 * or storage-location write after the fact.
 *
 * No UI imports, so the Main and Sub warehouse admins share this module.
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

/** docs/openapi.yaml `GoodsReceiptPackageUnit` (BR-123, UNCONFIRMED set). */
export type GoodsReceiptPackageUnit = 'CRATE' | 'BAG' | 'SACK' | 'BOX' | 'BUNDLE' | 'TRAY' | 'OTHER';

/** docs/openapi.yaml `QcConditionLevel` (BR-120, UNCONFIRMED set), best to worst. */
export type QcConditionLevel = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'UNACCEPTABLE';

/** docs/openapi.yaml `QcRejectionReasonCode` (BR-120, UNCONFIRMED set). */
export type QcRejectionReasonCode =
  | 'BELOW_GRADE'
  | 'PHYSICAL_DAMAGE'
  | 'SPOILAGE'
  | 'PEST_OR_DISEASE'
  | 'MOISTURE_OUT_OF_RANGE'
  | 'FOREIGN_MATTER'
  | 'WRONG_CROP'
  | 'OTHER';

/** docs/openapi.yaml `GoodsReceiptDiscrepancyType` (BR-121, UNCONFIRMED set). */
export type GoodsReceiptDiscrepancyType = 'QUANTITY' | 'QUALITY' | 'CROP_MISMATCH' | 'DAMAGE' | 'OTHER';

/** docs/openapi.yaml `GoodsReceiptDiscrepancyStatus`: OPEN is the only one (no resolve endpoint yet). */
export type GoodsReceiptDiscrepancyStatus = 'OPEN';

/** The five points of the quality check (docs/openapi.yaml `QualityCheckItemCreate.parameter`). */
export type QualityCheckParameter = 'APPEARANCE' | 'SIZE_UNIFORMITY' | 'MOISTURE' | 'DAMAGE_PEST' | 'FRESHNESS';

/** docs/openapi.yaml `PurchaseOrder` (and the list row's `PurchaseOrderListItem`). */
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
  /** BR-119: `crop_master.name`; null when the crop row is missing. */
  cropName?: string | null;
  /** List rows: the farmer's full name (admin-only surface); null when missing. */
  farmerName?: string | null;
}

/** docs/openapi.yaml `PurchaseOrderDetail`: the order plus the farmer and its receipts (admin-only, BR-16). */
export interface PurchaseOrderDetailDto extends PurchaseOrderDto {
  tohfaFarmerId?: string;
  receivedQtyKg?: QuantityKg;
  /** Nested receipts carry no poNumber, grade or package fields. */
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
  receivedBy?: string;
  /** BR-119: `users.full_name` of `receivedBy`; null when missing. */
  receivedByName?: string | null;
  receivedAt: string;
  poNumber?: string;
  /** BR-119: the purchase order's crop name. */
  cropName?: string | null;
  /** The purchase order's (listed) grade. */
  grade?: Grade;
  /** BR-106: the batch this receipt was stocked as; null until accepted goods are stocked. */
  batchId?: string | null;
  /** BR-106: that batch's code (`BATCH-<year>-<6 digits>`). */
  batchCode?: string | null;
  /** BR-123: the package count recorded at intake; null when none was given. */
  packageCount?: number | null;
  packageUnit?: GoodsReceiptPackageUnit | null;
}

/** docs/openapi.yaml `QualityCheckItem`: one point of the 5-point check, as stored. */
export interface QualityCheckItemDto {
  id?: string;
  qualityCheckId?: string;
  parameter: QualityCheckParameter;
  score?: number | null;
  passed: boolean;
  /** numeric(10,3) as a decimal string. */
  measuredValue?: string | null;
  remarks?: string | null;
  photoKeys?: string[];
  condition?: QcConditionLevel | null;
}

/** docs/openapi.yaml `QualityCheck`. */
export interface QualityCheckDto {
  id: string;
  goodsReceiptId: string;
  assignedGrade: Grade;
  outcome: QualityOutcome;
  acceptedQtyKg?: QuantityKg;
  rejectedQtyKg?: QuantityKg;
  // moisturePct / visualScore are in the openapi schema but the API never stores or returns
  // them (goods-receipts.repo.ts insertQualityCheckWithItems has no column for either), so the
  // app neither reads nor sends them.
  defectNotes?: string | null;
  photos?: string[];
  priceAdjustment?: Money;
  warehouseId?: string;
  listedGrade?: Grade;
  checkedBy?: string;
  /** BR-119: on the receipt read only. */
  checkedByName?: string | null;
  checkedAt: string;
  items?: QualityCheckItemDto[];
  /** BR-120: parts of the rejected quantity. */
  damagedQtyKg?: QuantityKg;
  spoiledQtyKg?: QuantityKg;
  rejectionReasonCode?: QcRejectionReasonCode | null;
  actualCropId?: string | null;
  actualCropName?: string | null;
  cropMismatchQtyKg?: string | null;
}

/** docs/openapi.yaml `GoodsReceiptDetail`: the receipt with its latest quality check (null before one). */
export interface GoodsReceiptDetailDto extends GoodsReceiptDto {
  qualityCheck: QualityCheckDto | null;
}

/** docs/openapi.yaml `GoodsReceiptCreate`. */
export interface GoodsReceiptCreate {
  purchaseOrderId: string;
  warehouseId: string;
  grossQtyKg: QuantityKg;
  vehicleNumber?: string;
  photos?: string[];
  remarks?: string;
  /** BR-123: sent with `packageUnit` or not at all. */
  packageCount?: number;
  packageUnit?: GoodsReceiptPackageUnit;
}

/** docs/openapi.yaml `QualityCheckItemCreate`. */
export interface QualityCheckItem {
  parameter: QualityCheckParameter;
  passed: boolean;
  /** Whole number 0-10. */
  score?: number;
  measuredValue?: number;
  remarks?: string;
  condition?: QcConditionLevel;
}

/** docs/openapi.yaml `QualityCheckCreate`. */
export interface QualityCheckCreate {
  assignedGrade: Grade;
  outcome: QualityOutcome;
  acceptedQtyKg: QuantityKg;
  rejectedQtyKg?: QuantityKg;
  rejectionReason?: string;
  rejectionReasonCode?: QcRejectionReasonCode;
  damagedQtyKg?: QuantityKg;
  spoiledQtyKg?: QuantityKg;
  actualCropId?: string;
  cropMismatchQtyKg?: QuantityKg;
  defectNotes?: string;
  photos?: string[];
  /** Signed per-kg adjustment when the assigned grade differs from the listed one. */
  priceAdjustment?: Money;
  /** Free text (max 40), copied to the batch (BR-106); the app sends a storage location's code. */
  storageLocation?: string;
  /** BR-125: a live, ACTIVE storage location of the receipt's warehouse; the batch is linked to it. */
  storageLocationId?: string;
  /** date (YYYY-MM-DD). */
  expiryOn?: string;
  /** Exactly one item per parameter. */
  items: QualityCheckItem[];
}

/** The 201 body of POST .../quality-check: the check, and the batch when stock was accepted (BR-106). */
export interface QualityCheckResultDto {
  qualityCheck: QualityCheckDto;
  batch: BatchDto | null;
}

/** docs/openapi.yaml `GoodsReceiptDiscrepancyCreate`. */
export interface GoodsReceiptDiscrepancyCreate {
  type: GoodsReceiptDiscrepancyType;
  /** 1-200 characters after trimming. */
  expected: string;
  /** 1-200 characters after trimming. */
  actual: string;
  /** 1-500 characters after trimming. */
  note?: string;
}

/** docs/openapi.yaml `GoodsReceiptDiscrepancy`. */
export interface GoodsReceiptDiscrepancyDto {
  id: string;
  goodsReceiptId: string;
  warehouseId: string;
  type: GoodsReceiptDiscrepancyType;
  expected: string;
  actual: string;
  status: GoodsReceiptDiscrepancyStatus;
  note: string | null;
  createdBy: string;
  createdByName: string | null;
  createdAt: string;
}

/** docs/openapi.yaml `DocumentPerson`. */
export interface DocumentPersonDto {
  id: string;
  name: string | null;
}

/** docs/openapi.yaml `GoodsReceiptDocument` (BR-124, derived at read time; UNCONFIRMED field set). */
export interface GoodsReceiptDocumentDto {
  documentType: 'GOODS_RECEIPT_NOTE';
  goodsReceiptId: string;
  grnNumber: string;
  status: GoodsReceiptStatus;
  purchaseOrder: { id: string; poNumber: string };
  warehouse: { id: string; code: string | null; name: string | null };
  farmer: { id: string; name: string | null };
  crop: { id: string; name: string | null };
  grade: { listed: Grade; assigned: Grade | null };
  quantities: {
    grossQtyKg: QuantityKg;
    acceptedQtyKg: QuantityKg;
    rejectedQtyKg: QuantityKg;
    damagedQtyKg: string | null;
    spoiledQtyKg: string | null;
  };
  packages: { count: number; unit: GoodsReceiptPackageUnit } | null;
  vehicleNumber: string | null;
  receivedBy: DocumentPersonDto;
  receivedAt: string;
  batchCode: string | null;
  qualityCheck: {
    outcome: QualityOutcome;
    assignedGrade: Grade;
    rejectionReasonCode: string | null;
    passedPoints: number;
    totalPoints: number;
    checkedBy: DocumentPersonDto;
    checkedAt: string;
  } | null;
  discrepancyCount: number;
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

/** BR-122 search and IST day range, shared by both intake lists. */
export interface IntakeListFilters {
  /** Literal, case-insensitive substring; 1-100 characters. */
  q?: string | undefined;
  /** First Asia/Kolkata day (YYYY-MM-DD), inclusive. */
  from?: string | undefined;
  /** Last Asia/Kolkata day (YYYY-MM-DD), inclusive; not before `from`. */
  to?: string | undefined;
}

export interface ListPurchaseOrdersParams extends IntakeListFilters {
  cursor?: string | undefined;
  /** 1-100, server default 20. */
  limit?: number | undefined;
  status?: PurchaseOrderStatus | undefined;
  warehouseId?: string | undefined;
}

export interface ListGoodsReceiptsParams extends IntakeListFilters {
  cursor?: string | undefined;
  limit?: number | undefined;
  warehouseId?: string | undefined;
  status?: GoodsReceiptStatus | undefined;
  purchaseOrderId?: string | undefined;
}

export interface ListDiscrepanciesParams {
  cursor?: string | undefined;
  limit?: number | undefined;
}

/**
 * Problem codes these endpoints document: 401/403/404/422/500 and the 409s
 * (CONFLICT on a QC already recorded or a pending offer, IDEMPOTENCY_KEY_REUSED
 * on a key sent with another body (BR-118), INVALID_STATE_TRANSITION and
 * COUNTER_LIMIT_REACHED on the counter-offer, BR-11). COUNTER_OFFER_EXPIRED
 * (BR-10) is the counter-offer window's code.
 */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'VALIDATION_FAILED',
  'INTERNAL',
  'IDEMPOTENCY_KEY_REUSED',
  'INVALID_STATE_TRANSITION',
  'COUNTER_LIMIT_REACHED',
  'COUNTER_OFFER_EXPIRED',
];

function receiptPath(id: string): string {
  return `/admin/goods-receipts/${encodeURIComponent(id)}`;
}

export function listPurchaseOrders(params: ListPurchaseOrdersParams = {}, signal?: AbortSignal): Promise<Page<PurchaseOrderDto>> {
  return adminGet<Page<PurchaseOrderDto>>(
    '/admin/purchase-orders',
    {
      cursor: params.cursor,
      limit: params.limit,
      status: params.status,
      warehouseId: params.warehouseId,
      q: params.q,
      from: params.from,
      to: params.to,
    },
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
      q: params.q,
      from: params.from,
      to: params.to,
    },
    signal,
  );
}

/** The receipt with its latest quality check (BR-119, BR-120). */
export function getGoodsReceipt(id: string, signal?: AbortSignal): Promise<GoodsReceiptDetailDto> {
  return adminGet<GoodsReceiptDetailDto>(receiptPath(id), undefined, signal);
}

/** The printable goods receipt note, derived at read time (BR-124). */
export function getGoodsReceiptDocument(id: string, signal?: AbortSignal): Promise<GoodsReceiptDocumentDto> {
  return adminGet<GoodsReceiptDocumentDto>(`${receiptPath(id)}/document`, undefined, signal);
}

/** Record a delivery against an order; the receipt starts AWAITING_QC. */
export function createGoodsReceipt(body: GoodsReceiptCreate, idempotencyKey: string): Promise<GoodsReceiptDto> {
  return adminPost<GoodsReceiptDto>('/admin/goods-receipts', body, { idempotencyKey });
}

/** Record the quality check of a receipt awaiting QC; stocks the batch with its storage location (BR-106). */
export function recordQualityCheck(id: string, body: QualityCheckCreate, idempotencyKey: string): Promise<QualityCheckResultDto> {
  return adminPost<QualityCheckResultDto>(`${receiptPath(id)}/quality-check`, body, { idempotencyKey });
}

/** The receipt's damage / mismatch reports, newest first (BR-121). */
export function listGoodsReceiptDiscrepancies(
  id: string,
  params: ListDiscrepanciesParams = {},
  signal?: AbortSignal,
): Promise<Page<GoodsReceiptDiscrepancyDto>> {
  return adminGet<Page<GoodsReceiptDiscrepancyDto>>(
    `${receiptPath(id)}/discrepancies`,
    { cursor: params.cursor, limit: params.limit },
    signal,
  );
}

/** Persist one damage / mismatch report on a receipt; it is created OPEN (BR-121). */
export function createGoodsReceiptDiscrepancy(
  id: string,
  body: GoodsReceiptDiscrepancyCreate,
  idempotencyKey: string,
): Promise<GoodsReceiptDiscrepancyDto> {
  return adminPost<GoodsReceiptDiscrepancyDto>(`${receiptPath(id)}/discrepancies`, body, { idempotencyKey });
}

/** Offer the farmer a revised price for the delivered lot (a round of the listing's negotiation, BR-10/BR-11). */
export function createCounterOffer(id: string, body: CounterOfferCreate, idempotencyKey: string): Promise<CounterOfferDto> {
  return adminPost<CounterOfferDto>(`${receiptPath(id)}/counter-offer`, body, { idempotencyKey });
}
