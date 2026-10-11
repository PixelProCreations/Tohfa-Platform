/**
 * Module 11 (Warehouse Finance): the daily cash summary and close (BR-74).
 *
 * Schemas here must match docs/openapi.yaml (/admin/finance/daily-summary and
 * /admin/finance/cash-close). Request schemas are `.strict()`; money is a decimal STRING.
 */
import { z } from 'zod';
import { isCalendarDate } from '../certifications/certifications.schema.js';

const isoDate = z
  .string()
  .refine(isCalendarDate, { message: 'Must be a real calendar date in YYYY-MM-DD format' });

/**
 * The cash the admin physically counted: a decimal string, at most 2 decimals and 10 integer
 * digits (`cash_closes.counted_cash` is numeric(12,2)). Zero is valid: an empty till is a real count.
 */
const countedCash = z
  .string()
  .regex(/^[0-9]{1,10}(\.[0-9]{1,2})?$/, 'Must be a decimal string with at most 2 decimals and at most 10 integer digits');

/** A stored or computed amount as the API returns it; the difference can be negative. */
const moneyResponse = z.string().regex(/^-?[0-9]{1,10}(\.[0-9]{1,2})?$/);

const dateRange = (value: { from?: string | undefined; to?: string | undefined }): boolean =>
  value.from === undefined || value.to === undefined || value.from <= value.to;

export const cashCloseIdParams = z.object({ id: z.string().uuid('id must be a UUID') }).strict();

// GET /v1/admin/finance/daily-summary
export const dailySummaryQuery = z
  .object({
    warehouseId: z.string().uuid('warehouseId must be a UUID').optional(),
    date: isoDate,
  })
  .strict();
export type DailySummaryQuery = z.infer<typeof dailySummaryQuery>;

// POST /v1/admin/finance/cash-close
export const createCashCloseBody = z
  .object({
    warehouseId: z.string().uuid('warehouseId must be a UUID').optional(),
    date: isoDate,
    countedCash,
    /** The "Difference Reason" field. Optional: the design says "if any", and no difference is ever refused. */
    note: z.string().trim().min(1).max(500).optional(),
  })
  .strict();
export type CreateCashCloseBody = z.infer<typeof createCashCloseBody>;

// GET /v1/admin/finance/cash-close
export const listCashClosesQuery = z
  .object({
    warehouseId: z.string().uuid('warehouseId must be a UUID').optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
    cursor: z.string().max(512).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .refine(dateRange, { message: '"from" must be earlier than or equal to "to"', path: ['to'] });
export type ListCashClosesQuery = z.infer<typeof listCashClosesQuery>;

// Responses
const pageMeta = z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() });

/** The figures the system computes for one warehouse and one Asia/Kolkata day. */
export const systemFigures = z.object({
  /** Counted cash of the latest earlier close of this warehouse; 0.00 when there is none. */
  openingCash: moneyResponse,
  /** The date of that earlier close, null when there is none. */
  openingFrom: z.string().nullable(),
  /** Completed, paid CASH orders of the day (the revenue definition of BR-63, restricted to CASH). */
  cashSales: moneyResponse,
  /** Successful CASH wallet top-ups processed at this warehouse that day. */
  cashTopUps: moneyResponse,
  /** CASH expenses dated that day that are not CANCELLED. */
  cashExpenses: moneyResponse,
  /** openingCash + cashSales + cashTopUps - cashExpenses, computed server-side, never typed in. */
  expectedClosing: moneyResponse,
});
export type SystemFigures = z.infer<typeof systemFigures>;

export const cashCloseResponse = z.object({
  id: z.string().uuid(),
  warehouseId: z.string().uuid(),
  date: z.string(),
  openingCash: moneyResponse,
  openingFrom: z.string().nullable(),
  cashSales: moneyResponse,
  cashTopUps: moneyResponse,
  cashExpenses: moneyResponse,
  expectedClosing: moneyResponse,
  countedCash: moneyResponse,
  /** countedCash - expectedClosing; negative means the cash is short. Never judged against a tolerance. */
  difference: moneyResponse,
  note: z.string().nullable(),
  closedBy: z.string().uuid(),
  createdAt: z.string(),
});
export type CashCloseResponse = z.infer<typeof cashCloseResponse>;

export const dailySummaryResponse = z.object({
  warehouseId: z.string().uuid(),
  date: z.string(),
  /** The figures as they stand NOW (computed, not stored). */
  system: systemFigures,
  /** The stored close for this warehouse and day, or null when the day is still open. */
  closed: cashCloseResponse.nullable(),
});
export type DailySummaryResponse = z.infer<typeof dailySummaryResponse>;

export const listCashClosesResponse = z.object({
  items: z.array(cashCloseResponse),
  page: pageMeta,
});
export type ListCashClosesResponse = z.infer<typeof listCashClosesResponse>;
