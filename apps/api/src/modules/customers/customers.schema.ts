/**
 * SWA Module 7 (Customers): Zod schemas for `/v1/admin/customers/**`, matching the `Customers`
 * tag of docs/openapi.yaml (AdminCustomer*, MaskedMobile, WalletTransaction, PageMeta).
 *
 * Response schemas are `.strict()` allow-lists: the tests parse every response with them, so a
 * field that is not in the documented key set (a farmer id, a full mobile for an `own` actor, a
 * batch) fails the test instead of reaching a client (BR-16, BR-90, BR-92).
 */
import { z } from 'zod';

const moneySchema = z.string().regex(/^-?[0-9]{1,10}(\.[0-9]{1,2})?$/);
const quantitySchema = z.string().regex(/^-?[0-9]{1,9}(\.[0-9]{1,3})?$/);
const isoDateTime = z.string().datetime({ offset: true });

/** BR-92: `*` for every character but the last four digits, e.g. `*********3210`. */
export const maskedMobileSchema = z.string().regex(/^\*+[0-9]{0,4}$/);

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------
export const customerStatusFilters = ['ACTIVE', 'INACTIVE', 'NEW'] as const;
export type CustomerStatusFilter = (typeof customerStatusFilters)[number];

const cursorField = z.string().min(1).max(512).optional();
const limitField = z.coerce.number().int().min(1).max(100).default(20);

/**
 * BR-115: the sort allow-list. `-` prefix = descending; ties break on the customer id in the same
 * direction, and the keyset cursor carries (sort value, id), so every key pages stably. Only keys
 * that are never null are offered (`lastActivityAt` is nullable and is deliberately not a sort key).
 */
export const customerSorts = [
  'name',
  '-name',
  'createdAt',
  '-createdAt',
  'lifetimeValue',
  '-lifetimeValue',
  'totalOrders',
  '-totalOrders',
] as const;
export type CustomerSort = (typeof customerSorts)[number];

const produceGrades = ['GRADE_1', 'GRADE_2', 'GRADE_3', 'REJECT'] as const;

/** A real calendar date, `YYYY-MM-DD` (2026-02-30 is refused, not rolled over). */
const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, 'Must be a real calendar date');

export const listCustomersQuery = z
  .object({
    q: z.string().trim().min(1).max(100).optional(),
    status: z.enum(customerStatusFilters).optional(),
    /** BR-115: purchase filters (one purchase line must match all of crop, grade and the window). */
    crop: z.string().uuid('crop must be a crop id (UUID)').optional(),
    grade: z.enum(produceGrades).optional(),
    /** Inclusive Asia/Kolkata day of the purchase (`orders.placed_at`). */
    from: calendarDate.optional(),
    to: calendarDate.optional(),
    sort: z.enum(customerSorts).default('name'),
    cursor: cursorField,
    limit: limitField,
  })
  .strict()
  .refine((q) => q.from === undefined || q.to === undefined || q.from <= q.to, {
    message: '"from" must be earlier than or equal to "to"',
    path: ['to'],
  });
/** `sort` is optional for in-process callers (jobs, tests); the service defaults it to `name`. */
export type ListCustomersQuery = Omit<z.output<typeof listCustomersQuery>, 'sort'> & { sort?: CustomerSort | undefined };

export const pageQuery = z.object({ cursor: cursorField, limit: limitField }).strict();
export type PageQuery = z.infer<typeof pageQuery>;

export const customerIdParams = z.object({ customerId: z.string().uuid('customerId must be a UUID') }).strict();
export type CustomerIdParams = z.infer<typeof customerIdParams>;

export const walletTxnParams = z
  .object({ customerId: z.string().uuid('customerId must be a UUID'), txnId: z.string().uuid('txnId must be a UUID') })
  .strict();
export type WalletTxnParams = z.infer<typeof walletTxnParams>;

export const ticketParams = z
  .object({ customerId: z.string().uuid('customerId must be a UUID'), ticketId: z.string().uuid('ticketId must be a UUID') })
  .strict();
export type TicketParams = z.infer<typeof ticketParams>;

/**
 * openapi `AdminCustomerSupportReplyRequest`. Both fields are trimmed; a blank (whitespace-only)
 * message is refused like an empty one. `attachmentUrl` is a storage key, stored as given.
 */
export const replyBody = z
  .object({
    message: z.string().trim().min(1).max(2000),
    attachmentUrl: z.string().trim().min(1).max(2048).optional(),
  })
  .strict();
export type ReplyBody = z.infer<typeof replyBody>;

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------
export const pageMetaSchema = z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() }).strict();
export type PageMeta = z.infer<typeof pageMetaSchema>;

const customerType = z.enum(['RETAIL', 'B2B', 'HORECA']);
const customerStatus = z.enum(['ACTIVE', 'INACTIVE']);

export const adminCustomerListItemSchema = z
  .object({
    id: z.string().uuid(),
    customerCode: z.string(),
    name: z.string(),
    mobileMasked: maskedMobileSchema,
    mobile: z.string().optional(),
    email: z.string().nullable().optional(),
    customerType,
    status: customerStatus,
    isNew: z.boolean(),
    preferredWarehouseId: z.string().uuid().nullable(),
    totalOrders: z.number().int().min(0),
    lastActivityAt: isoDateTime.nullable(),
    piiMasked: z.boolean(),
    createdAt: isoDateTime,
    /** BR-115: the number of rows `/issues` lists for this actor (return requests). */
    issueCount: z.number().int().min(0),
    /** BR-115: the number of rows `/support-tickets` lists (the customer's support tickets). */
    ticketCount: z.number().int().min(0),
  })
  .strict();
export type AdminCustomerListItem = z.infer<typeof adminCustomerListItemSchema>;

export const adminCustomerListResponseSchema = z
  .object({
    items: z.array(adminCustomerListItemSchema),
    page: pageMetaSchema,
    summary: z
      .object({ total: z.number().int().min(0), active: z.number().int().min(0), new: z.number().int().min(0) })
      .strict(),
  })
  .strict();
export type AdminCustomerListResponse = z.infer<typeof adminCustomerListResponseSchema>;

export const adminCustomerAddressSchema = z
  .object({
    id: z.string().uuid(),
    label: z.string().nullable(),
    line1: z.string(),
    line2: z.string().nullable(),
    city: z.string(),
    state: z.string().nullable(),
    pincode: z.string(),
    isDefault: z.boolean(),
  })
  .strict();
export type AdminCustomerAddress = z.infer<typeof adminCustomerAddressSchema>;

export const adminCustomerDetailSchema = z
  .object({
    id: z.string().uuid(),
    customerCode: z.string(),
    name: z.string(),
    mobileMasked: maskedMobileSchema,
    mobile: z.string().optional(),
    email: z.string().nullable().optional(),
    addresses: z.array(adminCustomerAddressSchema).optional(),
    customerType,
    businessName: z.string().nullable(),
    status: customerStatus,
    isNew: z.boolean(),
    preferredWarehouseId: z.string().uuid().nullable(),
    totalOrders: z.number().int().min(0),
    lifetimeValue: moneySchema,
    walletBalance: moneySchema,
    lastOrderAt: isoDateTime.nullable(),
    lastActivityAt: isoDateTime.nullable(),
    piiMasked: z.boolean(),
    createdAt: isoDateTime,
  })
  .strict();
export type AdminCustomerDetail = z.infer<typeof adminCustomerDetailSchema>;

const salesChannel = z.enum(['ONLINE', 'MARKET', 'HORECA', 'B2B', 'DIRECT']);
const grade = z.enum(['GRADE_1', 'GRADE_2', 'GRADE_3', 'REJECT']);

export const adminCustomerPurchaseSchema = z
  .object({
    orderId: z.string().uuid(),
    orderNumber: z.string(),
    channel: salesChannel,
    warehouseId: z.string().uuid(),
    productId: z.string().uuid(),
    productName: z.string(),
    grade,
    qtyKg: quantitySchema,
    unitPrice: moneySchema,
    lineTotal: moneySchema,
    purchasedAt: isoDateTime,
  })
  .strict();
export type AdminCustomerPurchase = z.infer<typeof adminCustomerPurchaseSchema>;

/** Every value of the database `order_status` enum (DISPATCHED since migration 0015). */
export const adminCustomerOrderStatuses = [
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

export const adminCustomerOrderSchema = z
  .object({
    id: z.string().uuid(),
    orderNumber: z.string(),
    channel: salesChannel,
    status: z.enum(adminCustomerOrderStatuses),
    paymentStatus: z.enum(['PENDING', 'PAID', 'PARTIALLY_PAID', 'REFUNDED', 'FAILED']),
    paymentMethod: z.enum(['WALLET', 'UPI', 'CARD', 'NETBANKING', 'CASH']).nullable(),
    warehouseId: z.string().uuid(),
    itemCount: z.number().int().min(0),
    totalAmount: moneySchema,
    invoiceNumber: z.string().nullable(),
    placedAt: isoDateTime,
    completedAt: isoDateTime.nullable(),
  })
  .strict();
export type AdminCustomerOrder = z.infer<typeof adminCustomerOrderSchema>;

/** `status` is every value the `wallets.status` CHECK allows (migration 0007). */
export const adminCustomerWalletSummarySchema = z
  .object({
    customerId: z.string().uuid(),
    walletId: z.string().uuid(),
    balance: moneySchema,
    /** BR-129: every CREDIT ledger row, summed in integer paise. */
    totalCredited: moneySchema,
    /** BR-129 (UNCONFIRMED): ORDER_DEBIT and SUBSCRIPTION_DEBIT rows, summed in integer paise. */
    totalUsed: moneySchema,
    currency: z.literal('INR'),
    status: z.enum(['ACTIVE', 'FROZEN', 'CLOSED']),
    transactionCount: z.number().int().min(0),
    lastTransactionAt: isoDateTime.nullable(),
  })
  .strict();
export type AdminCustomerWalletSummary = z.infer<typeof adminCustomerWalletSummarySchema>;

export const walletTransactionSchema = z
  .object({
    id: z.string().uuid(),
    walletId: z.string().uuid(),
    txnType: z.enum([
      'TOPUP_CASH',
      'TOPUP_DIGITAL',
      'ORDER_DEBIT',
      'ORDER_REFUND',
      'PAYOUT_DEBIT',
      'SALE_CREDIT',
      'SUBSCRIPTION_DEBIT',
      'ADJUSTMENT',
    ]),
    amount: moneySchema,
    balanceAfter: moneySchema,
    refType: z.string().nullable(),
    refId: z.string().uuid().nullable(),
    fiscalCashTag: z.string().nullable(),
    warehouseId: z.string().uuid().nullable(),
    performedBy: z.string().uuid().nullable(),
    performedAt: isoDateTime,
    remarks: z.string().nullable(),
  })
  .strict();
export type AdminWalletTransaction = z.infer<typeof walletTransactionSchema>;

export const returnStatuses = ['PENDING', 'INSPECTED', 'APPROVED', 'REJECTED', 'REFUND_PENDING_BANK', 'REFUNDED'] as const;

export const adminCustomerIssueSchema = z
  .object({
    id: z.string().uuid(),
    kind: z.literal('RETURN'),
    reference: z.string(),
    orderId: z.string().uuid().nullable(),
    orderNumber: z.string().nullable(),
    status: z.enum(returnStatuses),
    reason: z.string().nullable(),
    refundAmount: moneySchema.optional(),
    createdAt: isoDateTime,
    resolvedAt: isoDateTime.nullable(),
  })
  .strict();
export type AdminCustomerIssue = z.infer<typeof adminCustomerIssueSchema>;

/**
 * API vocabulary for a ticket status. The database (support_tickets, 0008) stores INVESTIGATING
 * where every admin support API says IN_PROGRESS; the service maps it (openapi
 * `AdminCustomerSupportTicket.status`, BR-97).
 */
export const ticketStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;
export type AdminTicketStatus = (typeof ticketStatuses)[number];

/** `support_tickets.category` CHECK list (0008), returned as `categoryCode`. */
export const ticketCategories = ['QUALITY', 'QUANTITY', 'MISSING', 'WRONG_ITEM', 'DAMAGED', 'LATE', 'PAYMENT', 'OTHER'] as const;

/** No `closedAt`: support_tickets records no close time, so the key is not part of the shape. */
export const adminCustomerSupportTicketSchema = z
  .object({
    id: z.string().uuid(),
    ticketNumber: z.string(),
    categoryCode: z.enum(ticketCategories),
    subject: z.string(),
    status: z.enum(ticketStatuses),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
    messageCount: z.number().int().min(0),
    resolvedAt: isoDateTime.nullable(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
  })
  .strict();
export type AdminCustomerSupportTicket = z.infer<typeof adminCustomerSupportTicketSchema>;

export const adminCustomerSupportMessageSchema = z
  .object({
    id: z.string().uuid(),
    ticketId: z.string().uuid(),
    senderUserId: z.string().uuid().nullable(),
    senderRole: z.string(),
    message: z.string(),
    isInternal: z.boolean(),
    redacted: z.boolean(),
    attachmentUrl: z.string().nullable(),
    createdAt: isoDateTime,
  })
  .strict();
export type AdminCustomerSupportMessage = z.infer<typeof adminCustomerSupportMessageSchema>;

export const adminCustomerSupportTicketDetailSchema = adminCustomerSupportTicketSchema
  .extend({ description: z.string(), messages: z.array(adminCustomerSupportMessageSchema) })
  .strict();
export type AdminCustomerSupportTicketDetail = z.infer<typeof adminCustomerSupportTicketDetailSchema>;

export interface Paged<T> {
  items: T[];
  page: PageMeta;
}
