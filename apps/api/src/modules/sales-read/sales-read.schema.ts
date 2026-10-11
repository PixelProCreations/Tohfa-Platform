/**
 * SWA Module 6 (Direct / Market sales): the READ side.
 *
 *   GET /v1/admin/sales/summary      sales.dashboard.view   (BR-96)
 *   GET /v1/admin/sales              sales.history.view     (BR-90, BR-92)
 *   GET /v1/admin/sales/{saleId}     sales.history.view     (BR-90, BR-92, BR-30)
 *   GET /v1/admin/sales/market-day   sales.market_day.view  (BR-95, BR-96, BR-90)
 *   GET /v1/admin/sales/horeca       sales.horeca.view      (BR-85h, BR-90)
 *   GET /v1/admin/sales/b2b          sales.b2b.view         (BR-85h, BR-90)
 *
 * Request schemas are `.strict()` so a stray parameter is a 422, not silently ignored. The
 * response types below are the documented key sets of docs/openapi.yaml (`SalesDashboardSummary`,
 * `SaleListItem`, `Sale`, `SalesMarketDay`, `ChannelOrderListItem`); the service builds every
 * response by naming these keys one by one (an allow-list, BR-90), and the `*Response` zod
 * schemas exist so the tests can assert the exact key set.
 */
import { z } from 'zod';
import { isCalendarDate } from '../certifications/certifications.schema.js';

// A real calendar date: a regex alone would let 2026-02-30 through to Postgres, which answers 500.
const isoDate = z
  .string()
  .refine(isCalendarDate, { message: 'Must be a real calendar date in YYYY-MM-DD format' });

const uuid = (name: string) => z.string().uuid(`${name} must be a UUID`);

/** `SaleChannel` in docs/openapi.yaml. HORECA and B2B have their own read-only lists. */
export const saleChannels = ['DIRECT', 'MARKET'] as const;
export const saleChannelEnum = z.enum(saleChannels);
export type SaleChannel = z.infer<typeof saleChannelEnum>;

/** `SaleStatus` in docs/openapi.yaml. */
export const saleStatuses = ['PENDING_PAYMENT', 'PICKED_UP', 'CANCELLED'] as const;
export const saleStatusEnum = z.enum(saleStatuses);
export type SaleStatus = z.infer<typeof saleStatusEnum>;

/** `SalePaymentStatus` = the `orders.payment_status` CHECK. */
export const salePaymentStatuses = ['PENDING', 'PAID', 'PARTIALLY_PAID', 'REFUNDED', 'FAILED'] as const;
export const salePaymentStatusEnum = z.enum(salePaymentStatuses);
export type SalePaymentStatus = z.infer<typeof salePaymentStatusEnum>;

/** `SalePaymentMethod`: the counter methods (NETBANKING is not one, sale_payments_method_chk). */
export const salePaymentMethods = ['CASH', 'UPI', 'CARD', 'WALLET'] as const;
export const salePaymentMethodEnum = z.enum(salePaymentMethods);
export type SalePaymentMethod = z.infer<typeof salePaymentMethodEnum>;

/** `ChannelOrderListItem.status`: every `order_status` enum value. */
export const channelOrderStatuses = [
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
export type ChannelOrderStatus = (typeof channelOrderStatuses)[number];

export const grades = ['GRADE_1', 'GRADE_2', 'GRADE_3', 'REJECT'] as const;
export type Grade = (typeof grades)[number];

const dateRangeOk = (value: { from?: string | undefined; to?: string | undefined }): boolean =>
  value.from === undefined || value.to === undefined || value.from <= value.to;
const DATE_RANGE_MESSAGE = { message: '"from" must be earlier than or equal to "to"', path: ['to'] };

const cursor = z.string().min(1).max(512);
const limit = z.coerce.number().int().min(1).max(100).default(20);

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------
export const saleIdParams = z.object({ saleId: uuid('saleId') }).strict();
export type SaleIdParams = z.infer<typeof saleIdParams>;

export const salesSummaryQuery = z
  .object({
    from: isoDate.optional(),
    to: isoDate.optional(),
    warehouseId: uuid('warehouseId').optional(),
  })
  .strict()
  .refine(dateRangeOk, DATE_RANGE_MESSAGE);
export type SalesSummaryQuery = z.infer<typeof salesSummaryQuery>;

export const listSalesQuery = z
  .object({
    channel: saleChannelEnum.optional(),
    status: saleStatusEnum.optional(),
    paymentStatus: salePaymentStatusEnum.optional(),
    paymentMethod: salePaymentMethodEnum.optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
    customerId: uuid('customerId').optional(),
    q: z.string().trim().min(1).max(60).optional(),
    cursor: cursor.optional(),
    limit,
  })
  .strict()
  .refine(dateRangeOk, DATE_RANGE_MESSAGE);
export type ListSalesQuery = z.infer<typeof listSalesQuery>;

export const marketDayQuery = z
  .object({
    date: isoDate.optional(),
    warehouseId: uuid('warehouseId').optional(),
    cursor: cursor.optional(),
    limit,
  })
  .strict();
export type MarketDayQuery = z.infer<typeof marketDayQuery>;

export const channelOrdersQuery = z.object({ cursor: cursor.optional(), limit }).strict();
export type ChannelOrdersQuery = z.infer<typeof channelOrdersQuery>;

// ---------------------------------------------------------------------------
// Responses (documented key sets; `.strict()` so a test fails on any extra key)
// ---------------------------------------------------------------------------
const money = z.string().regex(/^-?[0-9]{1,10}(\.[0-9]{1,2})?$/);
const quantity = z.string().regex(/^-?[0-9]{1,9}(\.[0-9]{1,3})?$/);
const maskedMobile = z.string().regex(/^\*+[0-9]{0,4}$/);
const isoDateTime = z.string().datetime({ offset: true });
const pageMeta = z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() }).strict();

export const saleBuyerResponse = z
  .object({
    kind: z.enum(['CUSTOMER', 'WALK_IN']),
    customerId: z.string().uuid().nullable(),
    customerCode: z.string().nullable(),
    name: z.string(),
    mobileMasked: maskedMobile.nullable(),
  })
  .strict();
export type SaleBuyer = z.infer<typeof saleBuyerResponse>;

export const saleLineResponse = z
  .object({
    productId: z.string().uuid(),
    name: z.string(),
    grade: z.enum(grades),
    qtyKg: quantity,
    unitPrice: money,
    lineTotal: money,
  })
  .strict();
export type SaleLine = z.infer<typeof saleLineResponse>;

export const saleTotalsResponse = z
  .object({ subtotal: money, gst: money, total: money, changeGiven: money.nullable() })
  .strict();
export type SaleTotals = z.infer<typeof saleTotalsResponse>;

export const salePaymentResponse = z
  .object({
    method: salePaymentMethodEnum,
    status: z.enum(['PENDING', 'CONFIRMED', 'FAILED']),
    amount: money,
    amountReceived: money.nullable(),
    cardRef: z.string().nullable(),
    upiTxnRef: z.string().nullable(),
    confirmedAt: isoDateTime.nullable(),
  })
  .strict();
export type SalePayment = z.infer<typeof salePaymentResponse>;

export const saleTimelineEntryResponse = z
  .object({ fromStatus: z.string().nullable(), toStatus: z.string(), at: isoDateTime })
  .strict();
export type SaleTimelineEntry = z.infer<typeof saleTimelineEntryResponse>;

export const saleResponse = z
  .object({
    id: z.string().uuid(),
    saleNumber: z.string(),
    channel: saleChannelEnum,
    status: saleStatusEnum,
    paymentStatus: salePaymentStatusEnum,
    warehouseId: z.string().uuid(),
    buyer: saleBuyerResponse,
    items: z.array(saleLineResponse),
    totals: saleTotalsResponse,
    payment: salePaymentResponse,
    invoiceNumber: z.string().nullable(),
    invoiceId: z.string().uuid().nullable(),
    timeline: z.array(saleTimelineEntryResponse),
    createdAt: isoDateTime,
    completedAt: isoDateTime.nullable(),
  })
  .strict();
export type SaleResponse = z.infer<typeof saleResponse>;

export const saleListItemResponse = z
  .object({
    id: z.string().uuid(),
    saleNumber: z.string(),
    channel: saleChannelEnum,
    status: saleStatusEnum,
    paymentStatus: salePaymentStatusEnum,
    paymentMethod: salePaymentMethodEnum,
    warehouseId: z.string().uuid(),
    buyer: saleBuyerResponse,
    itemCount: z.number().int().min(0),
    total: money,
    invoiceNumber: z.string().nullable(),
    createdAt: isoDateTime,
    completedAt: isoDateTime.nullable(),
  })
  .strict();
export type SaleListItem = z.infer<typeof saleListItemResponse>;

export const listSalesResponse = z.object({ items: z.array(saleListItemResponse), page: pageMeta }).strict();
export type ListSalesResponse = z.infer<typeof listSalesResponse>;

const countRevenue = { count: z.number().int().min(0), revenue: money };

export const salesSummaryResponse = z
  .object({
    from: isoDate,
    to: isoDate,
    warehouseId: z.string().uuid().nullable(),
    count: z.number().int().min(0),
    revenue: money,
    byChannel: z.array(z.object({ channel: saleChannelEnum, ...countRevenue }).strict()),
    byPaymentMethod: z.array(z.object({ method: salePaymentMethodEnum, ...countRevenue }).strict()),
    needsAttention: z
      .object({
        paymentPending: z.number().int().min(0),
        stockIssues: z.number().int().min(0),
        failedSales: z.number().int().min(0),
        invoiceIssues: z.number().int().min(0),
      })
      .strict(),
  })
  .strict();
export type SalesSummaryResponse = z.infer<typeof salesSummaryResponse>;

export const marketAllocationResponse = z
  .object({
    productId: z.string().uuid(),
    name: z.string(),
    grade: z.enum(grades),
    allocatedQtyKg: quantity,
    soldQtyKg: quantity,
    remainingQtyKg: quantity,
  })
  .strict();
export type MarketAllocation = z.infer<typeof marketAllocationResponse>;

export const salesMarketDayResponse = z
  .object({
    date: isoDate,
    warehouseId: z.string().uuid().nullable(),
    totals: z.object(countRevenue).strict(),
    byPaymentMethod: z.array(z.object({ method: salePaymentMethodEnum, ...countRevenue }).strict()),
    allocation: z.array(marketAllocationResponse),
    items: z.array(saleListItemResponse),
    page: pageMeta,
  })
  .strict();
export type SalesMarketDayResponse = z.infer<typeof salesMarketDayResponse>;

export const channelOrderListItemResponse = z
  .object({
    id: z.string().uuid(),
    orderNumber: z.string(),
    channel: z.enum(['HORECA', 'B2B']),
    status: z.enum(channelOrderStatuses),
    paymentStatus: salePaymentStatusEnum,
    warehouseId: z.string().uuid(),
    customerCode: z.string().nullable(),
    businessName: z.string().nullable(),
    itemCount: z.number().int().min(0),
    total: money,
    placedAt: isoDateTime,
  })
  .strict();
export type ChannelOrderListItem = z.infer<typeof channelOrderListItemResponse>;

export const listChannelOrdersResponse = z
  .object({ items: z.array(channelOrderListItemResponse), page: pageMeta })
  .strict();
export type ListChannelOrdersResponse = z.infer<typeof listChannelOrdersResponse>;
