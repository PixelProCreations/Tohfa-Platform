import { z } from 'zod';
import { isCalendarDate } from '../certifications/certifications.schema.js';

export const poStatuses = [
  'ISSUED',
  'PARTIALLY_RECEIVED',
  'FULLY_RECEIVED',
  'CANCELLED',
  'CLOSED',
] as const;
export type PoStatus = (typeof poStatuses)[number];

export const produceGrades = ['GRADE_1', 'GRADE_2', 'GRADE_3', 'REJECT'] as const;
export type ProduceGrade = (typeof produceGrades)[number];

export const purchaseOrderIdParams = z
  .object({
    id: z.string().uuid('Purchase Order id must be a valid UUID'),
  })
  .strict();
export type PurchaseOrderIdParams = z.infer<typeof purchaseOrderIdParams>;

/** A real calendar date, `YYYY-MM-DD` (2026-02-30 is refused, not rolled over). */
const calendarDate = z
  .string()
  .refine(isCalendarDate, { message: 'Must be a real calendar date in YYYY-MM-DD format' });

/**
 * BR-122: the search and date-range parameters shared by the admin purchase-order and goods-receipt
 * lists. `q` is matched literally by the repos (wildcards escaped); `from` / `to` are inclusive
 * Asia/Kolkata days of the list's own timestamp (the BR-115 convention).
 */
export const intakeListSearchFields = {
  q: z.string().trim().min(1, 'q must not be blank').max(100, 'q must be at most 100 characters').optional(),
  from: calendarDate.optional(),
  to: calendarDate.optional(),
};

/** BR-122: `from` later than `to` is 422 on `query.to`. */
export function fromNotAfterTo(query: { from?: string | undefined; to?: string | undefined }): boolean {
  return query.from === undefined || query.to === undefined || query.from <= query.to;
}
export const fromNotAfterToIssue = { message: '"from" must be earlier than or equal to "to"', path: ['to'] };

export const listPurchaseOrdersQuery = z
  .object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(poStatuses).optional(),
    warehouseId: z.string().uuid().optional(),
    ...intakeListSearchFields,
  })
  .strict()
  .refine(fromNotAfterTo, fromNotAfterToIssue);
export type ListPurchaseOrdersQuery = z.infer<typeof listPurchaseOrdersQuery>;

export const purchaseOrderResponse = z.object({
  id: z.string().uuid(),
  poNumber: z.string(),
  farmerId: z.string().uuid(),
  listingId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  cropId: z.string().uuid(),
  grade: z.enum(produceGrades),
  quantityKg: z.string(),
  pricePerKg: z.string(),
  totalAmount: z.string(),
  status: z.enum(poStatuses),
  expectedDeliveryDate: z.string().nullable().optional(),
  issuedAt: z.string(),
  // BR-119: crop_master.name, joined in the read; null when the crop row is missing.
  cropName: z.string().nullable().optional(),
});
export type PurchaseOrderResponse = z.infer<typeof purchaseOrderResponse>;

export const goodsReceiptSummary = z.object({
  id: z.string().uuid(),
  grnNumber: z.string(),
  purchaseOrderId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  grossQtyKg: z.string(),
  acceptedQtyKg: z.string().optional(),
  rejectedQtyKg: z.string().optional(),
  status: z.string(),
  receivedAt: z.string(),
  // BR-119: the purchase order's crop name, joined in the receipts query (no per-row lookup).
  cropName: z.string().nullable().optional(),
});
export type GoodsReceiptSummary = z.infer<typeof goodsReceiptSummary>;

export const purchaseOrderDetailResponse = purchaseOrderResponse.extend({
  farmerName: z.string().optional(),
  tohfaFarmerId: z.string().optional(),
  receivedQtyKg: z.string().optional(),
  goodsReceipts: z.array(goodsReceiptSummary).default([]),
});
export type PurchaseOrderDetailResponse = z.infer<typeof purchaseOrderDetailResponse>;

/**
 * A row of GET /admin/purchase-orders (openapi `PurchaseOrderListItem`): the purchase order plus
 * the farmer's and crop's display names. Admin-only surface (`purchase.order.view`), so naming the
 * farmer here is not a BR-16 leak; null when the farmer, its user or the crop row is missing.
 */
export const purchaseOrderListItem = purchaseOrderResponse.extend({
  farmerName: z.string().nullable(),
  cropName: z.string().nullable(),
});
export type PurchaseOrderListItem = z.infer<typeof purchaseOrderListItem>;

export const listPurchaseOrdersResponse = z.object({
  items: z.array(purchaseOrderListItem),
  page: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});
export type ListPurchaseOrdersResponse = z.infer<typeof listPurchaseOrdersResponse>;
