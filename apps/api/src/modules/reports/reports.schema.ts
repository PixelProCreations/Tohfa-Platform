/**
 * Reports (Module 12): read-only, warehouse-scoped aggregates. BR-64.
 *
 * <name>.schema.ts holds ONLY Zod schemas and the types inferred from them. The request
 * schemas are strict (an unknown query key is a client bug) and the response schemas keep
 * the shapes in step with docs/openapi.yaml.
 *
 * Nothing here carries a name, phone, email or address: the customers report is counts only.
 */
import { z } from 'zod';
import { isCalendarDate } from '../certifications/certifications.schema.js';
import { returnStatuses } from '../returnRequests/returnRequests.schema.js';

const moneySchema = z.string().regex(/^-?[0-9]{1,10}\.[0-9]{2}$/);
const quantitySchema = z.string().regex(/^[0-9]{1,12}\.[0-9]{3}$/);
const dateSchema = z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);

/** `2026-02-30` passes a YYYY-MM-DD regex and would reach Postgres as a 500 (BR-58). */
const calendarDate = z
  .string()
  .refine(isCalendarDate, { message: 'Must be a real calendar date in YYYY-MM-DD format' });

/** `orders.channel` CHECK constraint, db/migrations/0006_customers_orders.sql. */
export const orderChannels = ['ONLINE', 'MARKET', 'HORECA', 'B2B'] as const;
export type OrderChannel = (typeof orderChannels)[number];

/** `order_status` enum: 0001_extensions_and_enums.sql plus DISPATCHED from 0015_order_dispatch_status.sql. */
export const orderStatuses = [
  'PENDING_PAYMENT',
  'CONFIRMED',
  'PACKED',
  'DISPATCHED',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'PICKED_UP',
  'CANCELLED',
  'RETURNED',
] as const;
export type OrderStatus = (typeof orderStatuses)[number];

/** `grn_status` enum after db/migrations/0013_grn_status_enum_update.sql. */
export const grnStatuses = [
  'AWAITING_QC',
  'ACCEPTED',
  'PARTIALLY_ACCEPTED',
  'REJECTED',
  'COUNTER_OFFERED',
  'DRAFT',
  'RECEIVED',
  'QC_PENDING',
  'QC_DONE',
] as const;
export type GrnStatus = (typeof grnStatuses)[number];

// ---------------------------------------------------------------------------
// Requests. The span cap (system_config.report_max_range_days) is enforced by the service.
// ---------------------------------------------------------------------------
const warehouseIdSchema = z.string().uuid('warehouseId must be a UUID');

const rangeFields = {
  from: calendarDate,
  to: calendarDate,
  warehouseId: warehouseIdSchema.optional(),
};

const fromNotAfterTo = (q: { from: string; to: string }): boolean => q.from <= q.to;
const fromNotAfterToIssue = { message: '"from" date must be earlier than or equal to "to" date', path: ['to'] };

export const salesQuery = z
  .object({ ...rangeFields, channel: z.enum(orderChannels).optional() })
  .strict()
  .refine(fromNotAfterTo, fromNotAfterToIssue);
export type SalesQuery = z.infer<typeof salesQuery>;

const rangeQuery = z.object(rangeFields).strict().refine(fromNotAfterTo, fromNotAfterToIssue);
export const receivingQuery = rangeQuery;
export const returnsQuery = rangeQuery;
export const customersQuery = rangeQuery;
export const cashTopupsQuery = rangeQuery;
export type RangeQuery = z.infer<typeof rangeQuery>;

/** The inventory report is a current snapshot: from/to are accepted but not used. */
export const inventoryQuery = z
  .object({ from: calendarDate.optional(), to: calendarDate.optional(), warehouseId: warehouseIdSchema.optional() })
  .strict()
  .refine((q) => q.from === undefined || q.to === undefined || q.from <= q.to, fromNotAfterToIssue);
export type InventoryQuery = z.infer<typeof inventoryQuery>;

// ---------------------------------------------------------------------------
// Responses. Keep aligned with docs/openapi.yaml.
// ---------------------------------------------------------------------------
const reportHeader = {
  from: dateSchema,
  to: dateSchema,
  warehouseId: z.string().uuid().nullable(),
};

const dayCountTotal = z.object({ date: dateSchema, count: z.number().int(), total: moneySchema });
export type DayCountTotal = z.infer<typeof dayCountTotal>;

const dayCount = z.object({ date: dateSchema, count: z.number().int() });
export type DayCount = z.infer<typeof dayCount>;

export const salesReportResponse = z.object({
  ...reportHeader,
  count: z.number().int(),
  total: moneySchema,
  averageOrderValue: moneySchema,
  byDay: z.array(dayCountTotal),
  byChannel: z.array(z.object({ channel: z.enum(orderChannels), count: z.number().int(), total: moneySchema })),
  byStatus: z.array(z.object({ status: z.enum(orderStatuses), count: z.number().int() })),
});
export type SalesReportResponse = z.infer<typeof salesReportResponse>;

export const receivingReportResponse = z.object({
  ...reportHeader,
  byDay: z.array(z.object({ date: dateSchema, status: z.enum(grnStatuses), count: z.number().int() })),
});
export type ReceivingReportResponse = z.infer<typeof receivingReportResponse>;

export const inventoryReportResponse = z.object({
  from: dateSchema.nullable(),
  to: dateSchema.nullable(),
  warehouseId: z.string().uuid().nullable(),
  items: z.array(
    z.object({
      cropId: z.string().uuid(),
      name: z.string(),
      totalQty: quantitySchema,
      batchCount: z.number().int(),
    }),
  ),
});
export type InventoryReportResponse = z.infer<typeof inventoryReportResponse>;

export const returnsReportResponse = z.object({
  ...reportHeader,
  byStatus: z.array(z.object({ status: z.enum(returnStatuses), count: z.number().int() })),
  byDay: z.array(dayCount),
  refundedTotal: moneySchema,
});
export type ReturnsReportResponse = z.infer<typeof returnsReportResponse>;

export const customersReportResponse = z.object({
  ...reportHeader,
  customersWithOrders: z.number().int(),
  newCustomers: z.number().int(),
  byDay: z.array(dayCount),
});
export type CustomersReportResponse = z.infer<typeof customersReportResponse>;

export const cashTopupsReportResponse = z.object({
  ...reportHeader,
  count: z.number().int(),
  total: moneySchema,
  byDay: z.array(dayCountTotal),
});
export type CashTopupsReportResponse = z.infer<typeof cashTopupsReportResponse>;
