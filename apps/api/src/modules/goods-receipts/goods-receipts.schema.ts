import { z } from 'zod';
import { isCalendarDate } from '../certifications/certifications.schema.js';
import { produceGrades } from '../purchase-orders/purchase-orders.schema.js';

export const qcParameters = [
  'APPEARANCE',
  'SIZE_UNIFORMITY',
  'MOISTURE',
  'DAMAGE_PEST',
  'FRESHNESS',
] as const;
export type QcParameter = (typeof qcParameters)[number];

export const qcOutcomes = ['ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED'] as const;
export type QcOutcome = (typeof qcOutcomes)[number];

export const grnStatuses = [
  'AWAITING_QC',
  'ACCEPTED',
  'PARTIALLY_ACCEPTED',
  'REJECTED',
  'COUNTER_OFFERED',
] as const;
export type GrnStatus = (typeof grnStatuses)[number];

export const disposalMethods = [
  'COMPOST',
  'DISCARD',
  'RETURN_TO_FARMER',
  'BIO_WASTE',
] as const;
export type DisposalMethod = (typeof disposalMethods)[number];

export const goodsReceiptIdParams = z
  .object({
    id: z.string().uuid('Goods receipt ID must be a valid UUID'),
  })
  .strict();
export type GoodsReceiptIdParams = z.infer<typeof goodsReceiptIdParams>;

export const listGoodsReceiptsQuery = z
  .object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    warehouseId: z.string().uuid().optional(),
    status: z.enum(grnStatuses).optional(),
    purchaseOrderId: z.string().uuid().optional(),
  })
  .strict();
export type ListGoodsReceiptsQuery = z.infer<typeof listGoodsReceiptsQuery>;

export const createGoodsReceiptBody = z
  .object({
    purchaseOrderId: z.string().uuid('purchaseOrderId must be a valid UUID'),
    warehouseId: z.string().uuid('warehouseId must be a valid UUID'),
    grossQtyKg: z.string().refine((val) => Number(val) > 0, {
      message: 'grossQtyKg must be greater than 0',
    }),
    vehicleNumber: z.string().max(20).optional(),
    photos: z.array(z.string()).max(5).default([]),
    remarks: z.string().max(500).optional(),
  })
  .strict();
export type CreateGoodsReceiptBody = z.infer<typeof createGoodsReceiptBody>;

export const qualityCheckItemInput = z
  .object({
    parameter: z.enum(qcParameters),
    score: z.number().int().min(0).max(10).optional(),
    passed: z.boolean(),
    measuredValue: z.number().optional(),
    remarks: z.string().optional(),
    photoKeys: z.array(z.string()).default([]),
  })
  .strict();
export type QualityCheckItemInput = z.infer<typeof qualityCheckItemInput>;

export const qualityCheckCreateBody = z
  .object({
    assignedGrade: z.enum(produceGrades),
    outcome: z.enum(qcOutcomes),
    acceptedQtyKg: z.string().refine((val) => Number(val) >= 0, {
      message: 'acceptedQtyKg must be non-negative',
    }),
    rejectedQtyKg: z
      .string()
      .default('0.000')
      .refine((val) => Number(val) >= 0, {
        message: 'rejectedQtyKg must be non-negative',
      }),
    rejectionReason: z.string().optional(),
    items: z
      .array(qualityCheckItemInput)
      .length(5, 'Quality check must contain all 5 required parameters (BR-30)'),
    moisturePct: z.number().min(0).max(100).optional(),
    visualScore: z.number().int().min(0).max(10).optional(),
    defectNotes: z.string().max(500).optional(),
    photos: z.array(z.string()).max(5).default([]),
    priceAdjustment: z.string().default('0.00'),
    storageLocation: z.string().max(40).optional(),
    // docs/openapi.yaml `format: date`. A real calendar date, because it is copied to the batch
    // (BR-106) and `2026-02-30` would otherwise reach Postgres as a 500 (as BR-58 found elsewhere).
    expiryOn: z
      .string()
      .refine(isCalendarDate, { message: 'expiryOn must be a real calendar date in YYYY-MM-DD format' })
      .optional(),
  })
  .strict();
export type QualityCheckCreateBody = z.infer<typeof qualityCheckCreateBody>;

/*
 * docs/openapi.yaml CounterOfferCreate: Money (at most 2 decimals) and Quantity (at most 3), as
 * decimal strings. The regex runs first so `Number` only ever sees a plain decimal for the sign
 * check; the value reaches SQL as the string the client sent, never through a JS float.
 */
const counterOfferMoney = /^[0-9]{1,10}(\.[0-9]{1,2})?$/;
const counterOfferQuantity = /^[0-9]{1,9}(\.[0-9]{1,3})?$/;

export const qualityCounterOfferBody = z
  .object({
    pricePerKg: z
      .string()
      .regex(counterOfferMoney, 'pricePerKg must be a decimal string with at most 2 decimal places')
      .refine((val) => Number(val) > 0, { message: 'pricePerKg must be greater than 0' }),
    quantityKg: z
      .string()
      .regex(counterOfferQuantity, 'quantityKg must be a decimal string with at most 3 decimal places')
      .refine((val) => Number(val) > 0, { message: 'quantityKg must be greater than 0' }),
    message: z.string().max(500).optional(),
  })
  .strict();
export type QualityCounterOfferBody = z.infer<typeof qualityCounterOfferBody>;

/** docs/openapi.yaml CounterOffer, as this endpoint fills it (the listing and receipt are always set). */
export const qualityCounterOfferResponse = z
  .object({
    id: z.string().uuid(),
    listingId: z.string().uuid(),
    goodsReceiptId: z.string().uuid(),
    round: z.number().int().min(1).max(4),
    offeredBy: z.enum(['ADMIN', 'FARMER']),
    offeredByUserId: z.string().uuid(),
    pricePerKg: z.string(),
    quantityKg: z.string(),
    message: z.string().nullable(),
    status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED', 'LAPSED']),
    expiresAt: z.string(),
    respondedAt: z.string().nullable(),
  })
  .strict();
export type QualityCounterOfferResponse = z.infer<typeof qualityCounterOfferResponse>;

export const goodsReceiptResponse = z.object({
  id: z.string().uuid(),
  grnNumber: z.string(),
  purchaseOrderId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  farmerId: z.string().uuid(),
  grossQtyKg: z.string(),
  acceptedQtyKg: z.string(),
  rejectedQtyKg: z.string(),
  rejectionReason: z.string().nullable().optional(),
  vehicleNumber: z.string().nullable().optional(),
  photos: z.array(z.string()),
  status: z.enum(grnStatuses),
  receivedBy: z.string().uuid(),
  // BR-119: users.full_name of received_by (admin surface); null when the user row is missing.
  receivedByName: z.string().nullable().optional(),
  receivedAt: z.string(),
  poNumber: z.string().optional(),
  cropName: z.string().optional(),
  grade: z.string().optional(),
  // BR-106: the batch this receipt was stocked as, once accepted goods have been stocked.
  batchId: z.string().uuid().nullable().optional(),
  batchCode: z.string().nullable().optional(),
});
export type GoodsReceiptResponse = z.infer<typeof goodsReceiptResponse>;

export const qualityCheckItemResponse = z.object({
  id: z.string().uuid(),
  qualityCheckId: z.string().uuid(),
  parameter: z.enum(qcParameters),
  score: z.number().nullable().optional(),
  passed: z.boolean(),
  measuredValue: z.number().nullable().optional(),
  remarks: z.string().nullable().optional(),
  photoKeys: z.array(z.string()),
});
export type QualityCheckItemResponse = z.infer<typeof qualityCheckItemResponse>;

export const qualityCheckResponse = z.object({
  id: z.string().uuid(),
  goodsReceiptId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  assignedGrade: z.enum(produceGrades),
  listedGrade: z.enum(produceGrades),
  outcome: z.enum(qcOutcomes),
  acceptedQtyKg: z.string(),
  rejectedQtyKg: z.string(),
  priceAdjustment: z.string(),
  defectNotes: z.string().nullable().optional(),
  photos: z.array(z.string()),
  checkedBy: z.string().uuid(),
  // BR-119: users.full_name of checked_by, on the receipt read only.
  checkedByName: z.string().nullable().optional(),
  checkedAt: z.string(),
  items: z.array(qualityCheckItemResponse).optional(),
});
export type QualityCheckResponse = z.infer<typeof qualityCheckResponse>;

/** docs/openapi.yaml GoodsReceiptDetail: GET /admin/goods-receipts/{id} (BR-119). */
export const goodsReceiptDetailResponse = goodsReceiptResponse.extend({
  /** The receipt's latest quality check with its items; null before any check. */
  qualityCheck: qualityCheckResponse.nullable(),
});
export type GoodsReceiptDetailResponse = z.infer<typeof goodsReceiptDetailResponse>;

export const listGoodsReceiptsResponse = z.object({
  items: z.array(goodsReceiptResponse),
  page: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});
export type ListGoodsReceiptsResponse = z.infer<typeof listGoodsReceiptsResponse>;
