import { z } from 'zod';
import { CURSOR_TAGS, decodeKeysetCursor } from '../../http/keysetCursor.js';
import { isCalendarDate } from '../certifications/certifications.schema.js';
import {
  fromNotAfterTo,
  fromNotAfterToIssue,
  intakeListSearchFields,
  produceGrades,
} from '../purchase-orders/purchase-orders.schema.js';

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

/**
 * BR-120 (UNCONFIRMED sets): a graded condition per quality-check point, best to worst, and the
 * structured reasons for a rejected quantity. Mirrored by the CHECK constraints of migration 0076
 * and by docs/openapi.yaml QcConditionLevel / QcRejectionReasonCode.
 */
export const qcConditionLevels = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'UNACCEPTABLE'] as const;
export type QcConditionLevel = (typeof qcConditionLevels)[number];

export const qcRejectionReasonCodes = [
  'BELOW_GRADE',
  'PHYSICAL_DAMAGE',
  'SPOILAGE',
  'PEST_OR_DISEASE',
  'MOISTURE_OUT_OF_RANGE',
  'FOREIGN_MATTER',
  'WRONG_CROP',
  'OTHER',
] as const;
export type QcRejectionReasonCode = (typeof qcRejectionReasonCodes)[number];

/**
 * docs/openapi.yaml Quantity without the sign: a non-negative decimal string with at most 3
 * decimals. The regex runs before any `Number` so the value reaches SQL as the string the client
 * sent (numeric(12,3)), never through a JS float.
 */
const qcQuantity = /^[0-9]{1,9}(\.[0-9]{1,3})?$/;

/** quality_check_items.measured_value is numeric(10,3): the largest value the column can hold. */
const MEASURED_VALUE_COLUMN_MAX = 9_999_999.999;

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

/**
 * BR-123 (UNCONFIRMED set and bound): the kind of package counted on a receipt. Mirrored by the
 * CHECK constraints of migration 0078 and by docs/openapi.yaml GoodsReceiptPackageUnit.
 */
export const packageUnits = ['CRATE', 'BAG', 'SACK', 'BOX', 'BUNDLE', 'TRAY', 'OTHER'] as const;
export type PackageUnit = (typeof packageUnits)[number];
const PACKAGE_COUNT_MIN = 1;
const PACKAGE_COUNT_MAX = 100_000;

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
    // BR-122: q (GRN / PO number, farmer, crop) and from / to (Asia/Kolkata days of received_at).
    ...intakeListSearchFields,
  })
  .strict()
  .refine(fromNotAfterTo, fromNotAfterToIssue);
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
    // BR-123: optional, both or neither (checked below). Optional rather than defaulted, so a body
    // without them parses to exactly what it did before and keeps its Idempotency-Key binding.
    packageCount: z
      .number()
      .int('packageCount must be a whole number')
      .min(PACKAGE_COUNT_MIN, `packageCount must be at least ${PACKAGE_COUNT_MIN}`)
      .max(PACKAGE_COUNT_MAX, `packageCount must be at most ${PACKAGE_COUNT_MAX}`)
      .optional(),
    packageUnit: z.enum(packageUnits).optional(),
  })
  .strict()
  .superRefine((body, ctx) => {
    if (body.packageCount !== undefined && body.packageUnit === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['packageUnit'], message: 'packageUnit is required with packageCount' });
    }
    if (body.packageUnit !== undefined && body.packageCount === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['packageCount'], message: 'packageCount is required with packageUnit' });
    }
  });
export type CreateGoodsReceiptBody = z.infer<typeof createGoodsReceiptBody>;

/** docs/openapi.yaml QualityCheckItemCreate (BR-120: documented and validated strictly). */
export const qualityCheckItemInput = z
  .object({
    parameter: z.enum(qcParameters),
    score: z.number().int().min(0).max(10).optional(),
    passed: z.boolean(),
    measuredValue: z.number().finite().min(0).max(MEASURED_VALUE_COLUMN_MAX).optional(),
    remarks: z.string().max(500).optional(),
    photoKeys: z.array(z.string()).max(5).default([]),
    condition: z.enum(qcConditionLevels).optional(),
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
    // BR-120: a structured reason next to the free-text note above.
    rejectionReasonCode: z.enum(qcRejectionReasonCodes).optional(),
    // BR-120: parts OF rejectedQtyKg (the service checks the sum), never stocked. Omitted means
    // 0.000 (the column default); optional rather than a Zod default so existing callers that build
    // a parsed body by hand keep compiling.
    damagedQtyKg: z
      .string()
      .regex(qcQuantity, 'damagedQtyKg must be a non-negative decimal string with at most 3 decimal places')
      .optional(),
    spoiledQtyKg: z
      .string()
      .regex(qcQuantity, 'spoiledQtyKg must be a non-negative decimal string with at most 3 decimal places')
      .optional(),
    // BR-120: the crop actually delivered when it is not the purchase order's, and how much of it.
    actualCropId: z.string().uuid('actualCropId must be a valid UUID').optional(),
    cropMismatchQtyKg: z
      .string()
      .regex(qcQuantity, 'cropMismatchQtyKg must be a non-negative decimal string with at most 3 decimal places')
      .refine((val) => Number(val) > 0, { message: 'cropMismatchQtyKg must be greater than 0' })
      .optional(),
    items: z
      .array(qualityCheckItemInput)
      .length(5, 'Quality check must contain all 5 required parameters (BR-30)')
      .superRefine((items, ctx) => {
        // Five items are not five points unless each parameter appears once (BR-120).
        const seen = new Set<string>();
        for (const item of items) {
          if (seen.has(item.parameter)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Quality check parameter "${item.parameter}" appears more than once; each of the 5 must appear exactly once`,
            });
            return;
          }
          seen.add(item.parameter);
        }
      }),
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
  .strict()
  .superRefine((body, ctx) => {
    // BR-120: a crop mismatch names the crop AND the quantity, or neither.
    if (body.actualCropId !== undefined && body.cropMismatchQtyKg === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cropMismatchQtyKg'],
        message: 'cropMismatchQtyKg is required with actualCropId',
      });
    }
    if (body.cropMismatchQtyKg !== undefined && body.actualCropId === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['actualCropId'],
        message: 'actualCropId is required with cropMismatchQtyKg',
      });
    }
  });
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
  // BR-123: null / null when no package count was recorded.
  packageCount: z.number().int().nullable().optional(),
  packageUnit: z.enum(packageUnits).nullable().optional(),
});
export type GoodsReceiptResponse = z.infer<typeof goodsReceiptResponse>;

export const qualityCheckItemResponse = z.object({
  id: z.string().uuid(),
  qualityCheckId: z.string().uuid(),
  parameter: z.enum(qcParameters),
  score: z.number().nullable().optional(),
  passed: z.boolean(),
  // numeric(10,3) reaches the wire as a decimal string (pool.ts keeps NUMERIC as text); typed
  // loosely so the in-memory test repos that echo the request's number still type-check.
  measuredValue: z.union([z.string(), z.number()]).nullable().optional(),
  remarks: z.string().nullable().optional(),
  photoKeys: z.array(z.string()),
  // BR-120: null when the inspector gave no condition.
  condition: z.enum(qcConditionLevels).nullable().optional(),
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
  // BR-120 additions, as stored ("0.000" / null when not given).
  damagedQtyKg: z.string().optional(),
  spoiledQtyKg: z.string().optional(),
  rejectionReasonCode: z.enum(qcRejectionReasonCodes).nullable().optional(),
  actualCropId: z.string().uuid().nullable().optional(),
  actualCropName: z.string().nullable().optional(),
  cropMismatchQtyKg: z.string().nullable().optional(),
});
export type QualityCheckResponse = z.infer<typeof qualityCheckResponse>;

/** docs/openapi.yaml GoodsReceiptDetail: GET /admin/goods-receipts/{id} (BR-119). */
export const goodsReceiptDetailResponse = goodsReceiptResponse.extend({
  /** The receipt's latest quality check with its items; null before any check. */
  qualityCheck: qualityCheckResponse.nullable(),
});
export type GoodsReceiptDetailResponse = z.infer<typeof goodsReceiptDetailResponse>;

/** docs/openapi.yaml DocumentPerson: a user named on a printed document, id and full name only. */
const documentPerson = z.object({ id: z.string().uuid(), name: z.string().nullable() }).strict();

/**
 * docs/openapi.yaml GoodsReceiptDocument (BR-124): the printable goods receipt note. Strict, so it
 * is an allow-list: a field added to a read model cannot reach the printed note by accident, and no
 * farm name, location, phone, e-mail or price is ever in it.
 */
export const goodsReceiptDocumentResponse = z
  .object({
    documentType: z.literal('GOODS_RECEIPT_NOTE'),
    goodsReceiptId: z.string().uuid(),
    grnNumber: z.string(),
    status: z.enum(grnStatuses),
    purchaseOrder: z.object({ id: z.string().uuid(), poNumber: z.string() }).strict(),
    warehouse: z.object({ id: z.string().uuid(), code: z.string().nullable(), name: z.string().nullable() }).strict(),
    farmer: documentPerson,
    crop: z.object({ id: z.string().uuid(), name: z.string().nullable() }).strict(),
    grade: z.object({ listed: z.enum(produceGrades), assigned: z.enum(produceGrades).nullable() }).strict(),
    quantities: z
      .object({
        grossQtyKg: z.string(),
        acceptedQtyKg: z.string(),
        rejectedQtyKg: z.string(),
        damagedQtyKg: z.string().nullable(),
        spoiledQtyKg: z.string().nullable(),
      })
      .strict(),
    packages: z.object({ count: z.number().int(), unit: z.enum(packageUnits) }).strict().nullable(),
    vehicleNumber: z.string().nullable(),
    receivedBy: documentPerson,
    receivedAt: z.string(),
    batchCode: z.string().nullable(),
    qualityCheck: z
      .object({
        outcome: z.enum(qcOutcomes),
        assignedGrade: z.enum(produceGrades),
        rejectionReasonCode: z.enum(qcRejectionReasonCodes).nullable(),
        passedPoints: z.number().int(),
        totalPoints: z.number().int(),
        checkedBy: documentPerson,
        checkedAt: z.string(),
      })
      .strict()
      .nullable(),
    discrepancyCount: z.number().int(),
  })
  .strict();
export type GoodsReceiptDocumentResponse = z.infer<typeof goodsReceiptDocumentResponse>;

/**
 * BR-121 (UNCONFIRMED sets and bounds): a persisted damage / mismatch report on a goods receipt.
 * Mirrored by the CHECK constraints of migration 0077 and by docs/openapi.yaml
 * GoodsReceiptDiscrepancyType / GoodsReceiptDiscrepancyStatus / GoodsReceiptDiscrepancyCreate.
 */
export const discrepancyTypes = ['QUANTITY', 'QUALITY', 'CROP_MISMATCH', 'DAMAGE', 'OTHER'] as const;
export type DiscrepancyType = (typeof discrepancyTypes)[number];

/** OPEN only: no resolve step exists yet (BR-121.5), so nothing can be created in another status. */
export const discrepancyStatuses = ['OPEN'] as const;
export type DiscrepancyStatus = (typeof discrepancyStatuses)[number];

/** Trimmed first, so a value of spaces is the 422 "required", never a blank row (BR-121.2). */
const discrepancyText = (field: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${field} must not be blank`)
    .max(max, `${field} must be at most ${max} characters`);

export const goodsReceiptDiscrepancyCreateBody = z
  .object({
    type: z.enum(discrepancyTypes),
    expected: discrepancyText('expected', 200),
    actual: discrepancyText('actual', 200),
    // Accepted so a client may send the documented row shape; only OPEN, the status every report is
    // created in (BR-121.2). A client can never create a report already closed.
    status: z.enum(discrepancyStatuses).optional(),
    note: discrepancyText('note', 500).optional(),
  })
  .strict();
export type GoodsReceiptDiscrepancyCreateBody = z.infer<typeof goodsReceiptDiscrepancyCreateBody>;

export const listGoodsReceiptDiscrepanciesQuery = z
  .object({
    // Opaque keyset cursor (http/keysetCursor.ts); anything this list did not produce is 422.
    cursor: z
      .string()
      .max(512)
      .refine((raw) => decodeKeysetCursor(CURSOR_TAGS.goodsReceiptDiscrepancies, raw) !== null, {
        message: 'Invalid cursor.',
      })
      .optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListGoodsReceiptDiscrepanciesQuery = z.infer<typeof listGoodsReceiptDiscrepanciesQuery>;

/** docs/openapi.yaml GoodsReceiptDiscrepancy. */
export const goodsReceiptDiscrepancyResponse = z
  .object({
    id: z.string().uuid(),
    goodsReceiptId: z.string().uuid(),
    warehouseId: z.string().uuid(),
    type: z.enum(discrepancyTypes),
    expected: z.string(),
    actual: z.string(),
    status: z.enum(discrepancyStatuses),
    note: z.string().nullable(),
    createdBy: z.string().uuid(),
    createdByName: z.string().nullable(),
    createdAt: z.string(),
  })
  .strict();
export type GoodsReceiptDiscrepancyResponse = z.infer<typeof goodsReceiptDiscrepancyResponse>;

export const listGoodsReceiptDiscrepanciesResponse = z.object({
  items: z.array(goodsReceiptDiscrepancyResponse),
  page: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});
export type ListGoodsReceiptDiscrepanciesResponse = z.infer<typeof listGoodsReceiptDiscrepanciesResponse>;

export const listGoodsReceiptsResponse = z.object({
  items: z.array(goodsReceiptResponse),
  page: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});
export type ListGoodsReceiptsResponse = z.infer<typeof listGoodsReceiptsResponse>;
