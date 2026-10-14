/**
 * Returns & Issues (RMA). See CLAUDE.md for the four-file module pattern.
 *
 * <name>.schema.ts holds ONLY Zod schemas and the types inferred from them.
 * Rules:
 *  - Request schemas are the single source of truth for input types; never
 *    hand-write an interface that duplicates one.
 *  - Response schemas exist so the shape stays in step with docs/openapi.yaml.
 *  - `.strict()` on request bodies: an unexpected field is a client bug and we
 *    would rather fail loudly than silently ignore it.
 *  - Never put SQL, HTTP or business logic in this file.
 */
import { z } from 'zod';

const moneySchema = z.string().regex(/^-?[0-9]{1,10}(\.[0-9]{1,2})?$/);
const quantitySchema = z.string().regex(/^[0-9]{1,9}(\.[0-9]{1,3})?$/);

/** Matches the `return_status` enum in db/migrations/0046_returns.sql. */
export const returnStatuses = [
  'PENDING',
  'INSPECTED',
  'APPROVED',
  'REJECTED',
  'REFUND_PENDING_BANK',
  'REFUNDED',
] as const;
export type ReturnStatus = (typeof returnStatuses)[number];

/** Matches the `return_item_condition` enum in db/migrations/0046_returns.sql. */
export const returnItemConditions = ['GOOD', 'DAMAGED', 'SPOILED'] as const;
export type ReturnItemCondition = (typeof returnItemConditions)[number];

// ---------------------------------------------------------------------------
// POST /v1/orders/:orderId/returns
// ---------------------------------------------------------------------------
export const orderIdParams = z
  .object({ orderId: z.string().uuid('orderId must be a UUID') })
  .strict();
export type OrderIdParams = z.infer<typeof orderIdParams>;

export const createReturnRequestItem = z
  .object({
    orderItemId: z.string().uuid(),
    qty: quantitySchema,
  })
  .strict();
export type CreateReturnRequestItem = z.infer<typeof createReturnRequestItem>;

export const createReturnRequestBody = z
  .object({
    reason: z.string().trim().min(1).max(300),
    items: z.array(createReturnRequestItem).min(1),
    note: z.string().trim().max(500).optional(),
  })
  .strict();
export type CreateReturnRequestBody = z.infer<typeof createReturnRequestBody>;

// ---------------------------------------------------------------------------
// GET /v1/admin/returns, GET /v1/admin/returns/:id
// ---------------------------------------------------------------------------
export const returnIdParams = z.object({ id: z.string().uuid('return id must be a UUID') }).strict();
export type ReturnIdParams = z.infer<typeof returnIdParams>;

export const listReturnsQuery = z
  .object({
    status: z.enum(returnStatuses).optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListReturnsQuery = z.infer<typeof listReturnsQuery>;

// ---------------------------------------------------------------------------
// POST /v1/admin/returns/:id/inspect
// ---------------------------------------------------------------------------
export const inspectReturnItem = z
  .object({
    orderItemId: z.string().uuid(),
    condition: z.enum(returnItemConditions),
    acceptedQty: quantitySchema,
    damagedQty: quantitySchema.default('0.000'),
  })
  .strict();
export type InspectReturnItem = z.infer<typeof inspectReturnItem>;

export const inspectReturnBody = z
  .object({ items: z.array(inspectReturnItem).min(1) })
  .strict();
export type InspectReturnBody = z.infer<typeof inspectReturnBody>;

// ---------------------------------------------------------------------------
// POST /v1/admin/returns/:id/reject
// ---------------------------------------------------------------------------
export const rejectReturnBody = z
  .object({ reason: z.string().trim().min(1).max(300) })
  .strict();
export type RejectReturnBody = z.infer<typeof rejectReturnBody>;

// ---------------------------------------------------------------------------
// Response shapes — keep aligned with docs/openapi.yaml.
// ---------------------------------------------------------------------------
export const returnRequestItemResponse = z.object({
  id: z.string().uuid(),
  orderItemId: z.string().uuid(),
  requestedQty: quantitySchema,
  acceptedQty: quantitySchema.nullable(),
  damagedQty: quantitySchema.nullable(),
  condition: z.enum(returnItemConditions).nullable(),
});
export type ReturnRequestItemResponse = z.infer<typeof returnRequestItemResponse>;

export const returnSummaryResponse = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  customerId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  status: z.enum(returnStatuses),
  reason: z.string(),
  note: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type ReturnSummaryResponse = z.infer<typeof returnSummaryResponse>;

export const returnRequestResponse = returnSummaryResponse.extend({
  items: z.array(returnRequestItemResponse),
});
export type ReturnRequestResponse = z.infer<typeof returnRequestResponse>;

export const listReturnsResponse = z.object({
  items: z.array(returnSummaryResponse),
  page: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});
export type ListReturnsResponse = z.infer<typeof listReturnsResponse>;

export const returnStatusHistoryEntryResponse = z.object({
  id: z.string().uuid(),
  returnRequestId: z.string().uuid(),
  fromStatus: z.enum(returnStatuses).nullable(),
  toStatus: z.enum(returnStatuses),
  changedBy: z.string().uuid().nullable(),
  note: z.string().nullable(),
  createdAt: z.string(),
});
export type ReturnStatusHistoryEntryResponse = z.infer<typeof returnStatusHistoryEntryResponse>;

export const returnHistoryResponse = z.object({
  items: z.array(returnStatusHistoryEntryResponse),
});
export type ReturnHistoryResponse = z.infer<typeof returnHistoryResponse>;

/** Response of both refund endpoints: the return's new state plus the wallet txn, when there is one. */
export const returnRefundResponse = z.object({
  returnRequest: returnRequestResponse,
  walletTransactionId: z.string().uuid().nullable(),
  amount: moneySchema,
});
export type ReturnRefundResponse = z.infer<typeof returnRefundResponse>;
