/**
 * Module 11 (Warehouse Finance): expenses, revenue reads and the two raw reports.
 *
 * Schemas here must match docs/openapi.yaml (/admin/expenses, /admin/expense-categories,
 * /admin/finance/revenue, /admin/finance/reports/*). Request schemas are `.strict()` so a stray
 * field is a 422, not silently ignored. Money is always a decimal STRING (CLAUDE.md 2.2).
 */
import { z } from 'zod';
import { isCalendarDate } from '../certifications/certifications.schema.js';

// A real calendar date: a regex alone let 2026-02-30 through to Postgres, which answers 500.
const isoDate = z
  .string()
  .refine(isCalendarDate, { message: 'Must be a real calendar date in YYYY-MM-DD format' });

/**
 * A money amount as a decimal string with at most 2 decimals and at most 10 integer digits:
 * `expenses.amount` is numeric(12,2). Positive is checked separately so the message is specific.
 */
const MONEY_INPUT = /^[0-9]{1,10}(\.[0-9]{1,2})?$/;
const moneyInput = z
  .string()
  .regex(MONEY_INPUT, 'Must be a decimal string with at most 2 decimals and at most 10 integer digits')
  .refine((value) => /[1-9]/.test(value), { message: 'amount must be greater than 0' });

/** A stored or summed amount, as the API returns it. Same pattern as `Money` in docs/openapi.yaml. */
const moneyResponse = z.string().regex(/^-?[0-9]{1,10}(\.[0-9]{1,2})?$/);

export const expensePaymentMethods = ['CASH', 'UPI', 'BANK'] as const;
export const expensePaymentMethodEnum = z.enum(expensePaymentMethods);
export type ExpensePaymentMethod = z.infer<typeof expensePaymentMethodEnum>;

/** Matches `expenses.status` CHECK in db/migrations/0007_money.sql. */
export const expenseStatuses = ['RECORDED', 'APPROVED', 'REJECTED'] as const;
export const expenseStatusEnum = z.enum(expenseStatuses);
export type ExpenseStatus = z.infer<typeof expenseStatusEnum>;

/** Matches `orders.channel` CHECK (BR-15). */
export const salesChannels = ['ONLINE', 'MARKET', 'HORECA', 'B2B'] as const;
export const salesChannelEnum = z.enum(salesChannels);
export type SalesChannel = z.infer<typeof salesChannelEnum>;

/** Matches the `payment_method` enum in db/migrations/0001_extensions_and_enums.sql. */
export const orderPaymentMethods = ['WALLET', 'UPI', 'CARD', 'NETBANKING', 'CASH'] as const;
export const orderPaymentMethodEnum = z.enum(orderPaymentMethods);
export type OrderPaymentMethod = z.infer<typeof orderPaymentMethodEnum>;

const dateRange = (value: { from?: string | undefined; to?: string | undefined }): boolean =>
  value.from === undefined || value.to === undefined || value.from <= value.to;
const DATE_RANGE_MESSAGE = { message: '"from" must be earlier than or equal to "to"', path: ['to'] };

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------
export const financeIdParams = z.object({ id: z.string().uuid('id must be a UUID') }).strict();
export type FinanceIdParams = z.infer<typeof financeIdParams>;

// ---------------------------------------------------------------------------
// POST /v1/admin/expenses
// ---------------------------------------------------------------------------
export const createExpenseBody = z
  .object({
    categoryId: z.string().uuid('categoryId must be a UUID'),
    expenseDate: isoDate,
    amount: moneyInput,
    paymentMethod: expensePaymentMethodEnum,
    vendor: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().min(1).max(1000).optional(),
    warehouseId: z.string().uuid('warehouseId must be a UUID').optional(),
  })
  .strict();
export type CreateExpenseBody = z.infer<typeof createExpenseBody>;

// ---------------------------------------------------------------------------
// GET /v1/admin/expenses
// ---------------------------------------------------------------------------
export const listExpensesQuery = z
  .object({
    categoryId: z.string().uuid('categoryId must be a UUID').optional(),
    paymentMethod: expensePaymentMethodEnum.optional(),
    status: expenseStatusEnum.optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
    warehouseId: z.string().uuid('warehouseId must be a UUID').optional(),
    cursor: z.string().max(512).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .refine(dateRange, DATE_RANGE_MESSAGE);
export type ListExpensesQuery = z.infer<typeof listExpensesQuery>;

// ---------------------------------------------------------------------------
// GET /v1/admin/finance/revenue
// ---------------------------------------------------------------------------
export const listRevenueQuery = z
  .object({
    from: isoDate.optional(),
    to: isoDate.optional(),
    channel: salesChannelEnum.optional(),
    paymentMethod: orderPaymentMethodEnum.optional(),
    cursor: z.string().max(512).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .refine(dateRange, DATE_RANGE_MESSAGE);
export type ListRevenueQuery = z.infer<typeof listRevenueQuery>;

// ---------------------------------------------------------------------------
// GET /v1/admin/finance/reports/{revenue,expenses}
// ---------------------------------------------------------------------------
export const reportQuery = z
  .object({ from: isoDate, to: isoDate })
  .strict()
  // The span cap is system_config.finance_report_max_range_days, enforced by the service.
  .refine(dateRange, DATE_RANGE_MESSAGE);
export type ReportQuery = z.infer<typeof reportQuery>;

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------
const pageMeta = z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() });

export const expenseCategoryResponse = z.object({ id: z.string().uuid(), name: z.string() });
export type ExpenseCategoryResponse = z.infer<typeof expenseCategoryResponse>;

export const listExpenseCategoriesResponse = z.object({ items: z.array(expenseCategoryResponse) });
export type ListExpenseCategoriesResponse = z.infer<typeof listExpenseCategoriesResponse>;

export const expenseResponse = z.object({
  id: z.string().uuid(),
  warehouseId: z.string().uuid().nullable(),
  /** Null on rows recorded before migration 0047; `category` (the name) is always present. */
  categoryId: z.string().uuid().nullable(),
  category: z.string(),
  amount: moneyResponse,
  expenseDate: z.string(),
  /** Null on rows recorded before migration 0047. */
  paymentMethod: expensePaymentMethodEnum.nullable(),
  vendor: z.string().nullable(),
  description: z.string().nullable(),
  status: expenseStatusEnum,
  recordedBy: z.string().uuid(),
  createdAt: z.string(),
});
export type ExpenseResponse = z.infer<typeof expenseResponse>;

export const totalSummary = z.object({ count: z.number().int(), total: moneyResponse });
export type TotalSummary = z.infer<typeof totalSummary>;

export const listExpensesResponse = z.object({
  items: z.array(expenseResponse),
  summary: totalSummary,
  page: pageMeta,
});
export type ListExpensesResponse = z.infer<typeof listExpensesResponse>;

const revenueItem = z.object({
  orderId: z.string().uuid(),
  channel: salesChannelEnum,
  paymentMethod: orderPaymentMethodEnum,
  paymentStatus: z.string(),
  status: z.string(),
  totalAmount: moneyResponse,
  gstAmount: moneyResponse,
  placedAt: z.string(),
  completedAt: z.string(),
  warehouseId: z.string().uuid(),
});
export const revenueItemResponse = revenueItem;
export type RevenueItemResponse = z.infer<typeof revenueItemResponse>;

export const revenueDetailResponse = revenueItem.extend({
  /** Both null when the order has no invoice row. */
  invoiceNumber: z.string().nullable(),
  invoiceStatus: z.string().nullable(),
});
export type RevenueDetailResponse = z.infer<typeof revenueDetailResponse>;

export const channelTotal = z.object({
  channel: salesChannelEnum,
  count: z.number().int(),
  total: moneyResponse,
});
export type ChannelTotal = z.infer<typeof channelTotal>;

export const listRevenueResponse = z.object({
  items: z.array(revenueItemResponse),
  summary: totalSummary.extend({ byChannel: z.array(channelTotal) }),
  page: pageMeta,
});
export type ListRevenueResponse = z.infer<typeof listRevenueResponse>;

const dayTotal = z.object({ date: z.string(), count: z.number().int(), total: moneyResponse });
const orderPaymentMethodTotal = z.object({
  paymentMethod: orderPaymentMethodEnum,
  count: z.number().int(),
  total: moneyResponse,
});
const categoryTotal = z.object({
  category: z.string(),
  count: z.number().int(),
  total: moneyResponse,
});
const expensePaymentMethodTotal = z.object({
  /** Null groups the rows recorded before migration 0047, which carry no payment method. */
  paymentMethod: expensePaymentMethodEnum.nullable(),
  count: z.number().int(),
  total: moneyResponse,
});

export const revenueReportResponse = z.object({
  from: z.string(),
  to: z.string(),
  summary: totalSummary,
  byDay: z.array(dayTotal),
  byChannel: z.array(channelTotal),
  byPaymentMethod: z.array(orderPaymentMethodTotal),
});
export type RevenueReportResponse = z.infer<typeof revenueReportResponse>;

export const expenseReportResponse = z.object({
  from: z.string(),
  to: z.string(),
  summary: totalSummary,
  byDay: z.array(dayTotal),
  byCategory: z.array(categoryTotal),
  byPaymentMethod: z.array(expensePaymentMethodTotal),
});
export type ExpenseReportResponse = z.infer<typeof expenseReportResponse>;

// ---------------------------------------------------------------------------
// GET /v1/admin/expenses/{id}/voucher   (BR-75)
// ---------------------------------------------------------------------------
const personRef = z.object({ id: z.string().uuid(), name: z.string() });

export const expenseVoucherResponse = z.object({
  /** Derived from the expense, never allocated: VCH-<expense date YYYYMMDD>-<first 8 hex of the expense id, upper case>. */
  voucherNumber: z.string().regex(/^VCH-\d{8}-[0-9A-F]{8}$/),
  voucherType: z.literal('EXPENSE'),
  expenseId: z.string().uuid(),
  warehouse: z.object({ id: z.string().uuid(), code: z.string(), name: z.string() }).nullable(),
  category: z.string(),
  amount: moneyResponse,
  expenseDate: z.string(),
  paymentMethod: expensePaymentMethodEnum.nullable(),
  vendor: z.string().nullable(),
  description: z.string().nullable(),
  status: expenseStatusEnum,
  recordedBy: personRef,
});
export type ExpenseVoucherResponse = z.infer<typeof expenseVoucherResponse>;
