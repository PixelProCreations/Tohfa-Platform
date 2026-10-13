/**
 * BR-102: inter-warehouse transfers. Schemas must match docs/openapi.yaml (/warehouse-transfers).
 *
 * Request bodies and the list query are `.strict()`. Quantities are decimal STRINGS (numeric(12,3)),
 * never JSON numbers, so a kilogram figure is never rounded by a float on the way in or out. Money is
 * a `Money` string computed from integer paise.
 */
import { z } from 'zod';

export const TRANSFER_STATUSES = ['PENDING_APPROVAL', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'] as const;
export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

/** BR-102 rule 1: 1-50 lines per transfer. */
export const MAX_TRANSFER_LINES = 50;

const KG_PATTERN = /^\d{1,9}(\.\d{1,3})?$/;
const KG_MESSAGE = 'must be a decimal string with at most 9 integer digits and 3 decimals';

/** numeric(12,3), strictly positive (stock_transfer_items.qty_sent CHECK > 0). */
const positiveKg = z
  .string()
  .regex(KG_PATTERN, `qtyKg ${KG_MESSAGE}`)
  .refine((value) => /[1-9]/.test(value), 'qtyKg must be greater than 0');

/** numeric(12,3), zero allowed: a line that arrived with nothing is received as 0. */
const nonNegativeKg = z.string().regex(KG_PATTERN, `qtyReceivedKg ${KG_MESSAGE}`);

export const transferIdParams = z.object({ id: z.string().uuid('transfer id must be a UUID') }).strict();

/** POST /v1/warehouse-transfers */
export const createTransferBody = z
  .object({
    fromWarehouseId: z.string().uuid(),
    toWarehouseId: z.string().uuid(),
    lines: z
      .array(z.object({ batchId: z.string().uuid(), qtyKg: positiveKg }).strict())
      .min(1, 'At least one line is required')
      .max(MAX_TRANSFER_LINES, `At most ${MAX_TRANSFER_LINES} lines`),
    vehicleNumber: z.string().trim().min(1).max(20).optional(),
    notes: z.string().trim().min(1).max(1000).optional(),
  })
  .strict()
  .superRefine((body, ctx) => {
    if (body.fromWarehouseId === body.toWarehouseId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['toWarehouseId'], message: 'The destination must differ from the source warehouse' });
    }
    const seen = new Set<string>();
    body.lines.forEach((line, index) => {
      if (seen.has(line.batchId)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lines', index, 'batchId'], message: 'Each batch may appear only once' });
      }
      seen.add(line.batchId);
    });
  });
export type CreateTransferBody = z.infer<typeof createTransferBody>;

/** POST /v1/warehouse-transfers/{id}/receive */
export const receiveTransferBody = z
  .object({
    lines: z
      .array(z.object({ itemId: z.string().uuid(), qtyReceivedKg: nonNegativeKg }).strict())
      .min(1)
      .max(MAX_TRANSFER_LINES),
    receiptNote: z.string().trim().min(1).max(1000).optional(),
  })
  .strict()
  .superRefine((body, ctx) => {
    const seen = new Set<string>();
    body.lines.forEach((line, index) => {
      if (seen.has(line.itemId)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lines', index, 'itemId'], message: 'Each line may appear only once' });
      }
      seen.add(line.itemId);
    });
  });
export type ReceiveTransferBody = z.infer<typeof receiveTransferBody>;

/** POST /v1/warehouse-transfers/{id}/cancel */
export const cancelTransferBody = z.object({ reason: z.string().trim().min(1).max(500) }).strict();
export type CancelTransferBody = z.infer<typeof cancelTransferBody>;

/** GET /v1/warehouse-transfers */
export const listTransfersQuery = z
  .object({
    status: z.enum(TRANSFER_STATUSES).optional(),
    warehouseId: z.string().uuid().optional(),
    direction: z.enum(['INBOUND', 'OUTBOUND']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .refine((query) => query.direction === undefined || query.warehouseId !== undefined, {
    message: 'direction requires warehouseId',
    path: ['direction'],
  });
export type ListTransfersQuery = z.infer<typeof listTransfersQuery>;

/** One line. Never carries the source farmer (BR-16, BR-102 rule 7). */
export const transferLineResponse = z.object({
  id: z.string().uuid(),
  batchId: z.string().uuid(),
  batchCode: z.string(),
  cropId: z.string().uuid(),
  grade: z.string(),
  qtySentKg: z.string(),
  qtyReceivedKg: z.string().nullable(),
  varianceKg: z.string().nullable(),
  costPerKg: z.string().nullable(),
  lineValue: z.string().nullable(),
  destBatchId: z.string().uuid().nullable(),
});
export type TransferLine = z.infer<typeof transferLineResponse>;

/** The transfer header, as returned in the list (no lines). */
export const transferSummaryResponse = z.object({
  id: z.string().uuid(),
  transferNumber: z.string(),
  fromWarehouseId: z.string().uuid(),
  toWarehouseId: z.string().uuid(),
  status: z.enum(TRANSFER_STATUSES),
  totalValue: z.string(),
  hasUnvaluedLines: z.boolean(),
  requiresApproval: z.boolean(),
  hasDiscrepancy: z.boolean(),
  vehicleNumber: z.string().nullable(),
  notes: z.string().nullable(),
  receiptNote: z.string().nullable(),
  cancelReason: z.string().nullable(),
  initiatedBy: z.string().uuid(),
  approvedBy: z.string().uuid().nullable(),
  approvedAt: z.string().nullable(),
  dispatchedAt: z.string().nullable(),
  receivedBy: z.string().uuid().nullable(),
  receivedAt: z.string().nullable(),
  cancelledBy: z.string().uuid().nullable(),
  cancelledAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type TransferSummary = z.infer<typeof transferSummaryResponse>;

/** One transfer with its lines (create, get, approve, receive, cancel). */
export const transferResponse = transferSummaryResponse.extend({ lines: z.array(transferLineResponse) });
export type Transfer = z.infer<typeof transferResponse>;

export const listTransfersResponse = z.object({
  items: z.array(transferSummaryResponse),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
});
export type ListTransfersResponse = z.infer<typeof listTransfersResponse>;

const KG_RE = /^(\d{1,9})(?:\.(\d{1,3}))?$/;

/** "1.25" -> 1250 (integer grams). Quantities are compared as integers, never as floats. */
export function kgToGrams(kg: string): number {
  const match = KG_RE.exec(kg.trim());
  if (match === null) throw new Error(`not a kg quantity: "${kg}"`);
  return Number(match[1]) * 1000 + Number((match[2] ?? '').padEnd(3, '0'));
}
