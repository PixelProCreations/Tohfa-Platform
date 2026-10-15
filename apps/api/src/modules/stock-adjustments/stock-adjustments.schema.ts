/**
 * BR-37: manual stock adjustments. Schemas must match docs/openapi.yaml (/admin/stock-adjustments).
 *
 * Request bodies and the list query are `.strict()`. Quantities are decimal STRINGS
 * (numeric(12,3)), never JSON numbers, so a kilogram figure is never rounded by a float on the way
 * in or out. A signed quantity is compared as integer grams (`signedKgToGrams`), never as a float.
 */
import { z } from 'zod';

/** Matches the CHECK on `stock_adjustments.adjustment_type` (0005). */
export const ADJUSTMENT_TYPES = ['DAMAGE', 'SHRINKAGE', 'COUNT_CORRECTION', 'EXPIRY'] as const;
export type AdjustmentType = (typeof ADJUSTMENT_TYPES)[number];

/** Matches the CHECK on `stock_adjustments.status` (0005). */
export const ADJUSTMENT_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type AdjustmentStatus = (typeof ADJUSTMENT_STATUSES)[number];

/**
 * Types that can only REMOVE stock (BR-37 note, UNCONFIRMED): damage, shrinkage and expiry are
 * losses. Only a COUNT_CORRECTION may add stock, because only a physical count can find stock the
 * ledger does not know about.
 */
export const LOSS_ONLY_TYPES: ReadonlySet<AdjustmentType> = new Set(['DAMAGE', 'SHRINKAGE', 'EXPIRY']);

const SIGNED_KG_RE = /^(-)?(\d{1,9})(?:\.(\d{1,3}))?$/;

/** "-1.25" -> -1250 (integer grams). Never a float. */
export function signedKgToGrams(kg: string): number {
  const match = SIGNED_KG_RE.exec(kg.trim());
  if (match === null) throw new Error(`not a signed kg quantity: "${kg}"`);
  const grams = Number(match[2]) * 1000 + Number((match[3] ?? '').padEnd(3, '0'));
  return match[1] === '-' ? -grams : grams;
}

/** numeric(12,3), signed, never zero (stock_adjustments.qty_delta CHECK <> 0). */
const signedNonZeroKg = z
  .string()
  .regex(SIGNED_KG_RE, 'qtyDeltaKg must be a signed decimal string with at most 9 integer digits and 3 decimals')
  .refine((value) => /[1-9]/.test(value), 'qtyDeltaKg must not be zero');

export const adjustmentIdParams = z.object({ id: z.string().uuid('adjustment id must be a UUID') }).strict();
export type AdjustmentIdParams = z.infer<typeof adjustmentIdParams>;

/** POST /v1/admin/stock-adjustments */
export const createAdjustmentBody = z
  .object({
    batchId: z.string().uuid(),
    adjustmentType: z.enum(ADJUSTMENT_TYPES),
    qtyDeltaKg: signedNonZeroKg,
    reason: z.string().trim().min(5).max(500),
  })
  .strict()
  .superRefine((body, ctx) => {
    if (LOSS_ONLY_TYPES.has(body.adjustmentType) && !body.qtyDeltaKg.trim().startsWith('-')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['qtyDeltaKg'],
        message: `A ${body.adjustmentType} adjustment can only remove stock: qtyDeltaKg must be negative.`,
      });
    }
  });
export type CreateAdjustmentBody = z.infer<typeof createAdjustmentBody>;

/** POST /v1/admin/stock-adjustments/:id/reject */
export const rejectAdjustmentBody = z.object({ reason: z.string().trim().min(1).max(500) }).strict();
export type RejectAdjustmentBody = z.infer<typeof rejectAdjustmentBody>;

/** GET /v1/admin/stock-adjustments */
export const listAdjustmentsQuery = z
  .object({
    status: z.enum(ADJUSTMENT_STATUSES).optional(),
    warehouseId: z.string().uuid().optional(),
    batchId: z.string().uuid().optional(),
    adjustmentType: z.enum(ADJUSTMENT_TYPES).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListAdjustmentsQuery = z.infer<typeof listAdjustmentsQuery>;

/** Wire representation of one adjustment (list, detail, create, approve, reject). */
export const stockAdjustmentResponse = z.object({
  id: z.string().uuid(),
  batchId: z.string().uuid(),
  batchCode: z.string(),
  warehouseId: z.string().uuid(),
  cropId: z.string().uuid(),
  grade: z.string(),
  adjustmentType: z.enum(ADJUSTMENT_TYPES),
  /** Signed: negative removes stock. */
  qtyDeltaKg: z.string(),
  reason: z.string(),
  status: z.enum(ADJUSTMENT_STATUSES),
  createdBy: z.string().uuid(),
  createdAt: z.string(),
  approvedBy: z.string().uuid().nullable(),
  approvedAt: z.string().nullable(),
  rejectedBy: z.string().uuid().nullable(),
  rejectedAt: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  /** The stock_ledger row an approval inserted (BR-37b); null until APPROVED. */
  ledgerEntryId: z.string().uuid().nullable(),
  /** The BR-106 stock verification this adjustment was raised from, if any. */
  verificationId: z.string().uuid().nullable(),
  updatedAt: z.string().nullable(),
});
export type StockAdjustment = z.infer<typeof stockAdjustmentResponse>;

export const listAdjustmentsResponse = z.object({
  items: z.array(stockAdjustmentResponse),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
});
export type ListAdjustmentsResponse = z.infer<typeof listAdjustmentsResponse>;
