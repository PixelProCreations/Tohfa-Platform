/**
 * Report exports (BR-76): request schemas only. The response is a CSV file, not JSON.
 *
 * Each export takes the same query as the report or finance endpoint it exports, so the schemas
 * are those endpoints' own where the shape is identical, and strict (an unknown key is a client
 * bug, not something to ignore). The range-span caps are enforced by the service, from the same
 * `system_config` keys the reports use.
 */
import { z } from 'zod';
import { isCalendarDate } from '../certifications/certifications.schema.js';
import { expensePaymentMethodEnum, expenseStatusEnum } from '../finance/finance.schema.js';
import { inventoryQuery, receivingQuery, salesQuery } from '../reports/reports.schema.js';

/** The reports that can be exported, in the order docs/openapi.yaml lists them. */
export const exportReports = [
  'sales',
  'receiving',
  'inventory',
  'returns',
  'customers',
  'cash-topups',
  'expenses',
  'finance-revenue',
  'finance-expenses',
] as const;
export type ExportReport = (typeof exportReports)[number];

const calendarDate = z
  .string()
  .refine(isCalendarDate, { message: 'Must be a real calendar date in YYYY-MM-DD format' });

/** `from`, `to` and an optional warehouse: receiving, returns, customers, cash-topups and the two finance reports. */
export const rangeExportQuery = receivingQuery;
export type RangeExportQuery = z.infer<typeof rangeExportQuery>;

export const salesExportQuery = salesQuery;
export type SalesExportQuery = z.infer<typeof salesExportQuery>;

/** A current snapshot: from and to are accepted but not used. */
export const inventoryExportQuery = inventoryQuery;
export type InventoryExportQuery = z.infer<typeof inventoryExportQuery>;

/** The expense list's own filters, with the range required: an export is bounded by it. */
export const expensesExportQuery = z
  .object({
    from: calendarDate,
    to: calendarDate,
    warehouseId: z.string().uuid('warehouseId must be a UUID').optional(),
    categoryId: z.string().uuid('categoryId must be a UUID').optional(),
    paymentMethod: expensePaymentMethodEnum.optional(),
    status: expenseStatusEnum.optional(),
  })
  .strict()
  .refine((q) => q.from <= q.to, { message: '"from" date must be earlier than or equal to "to" date', path: ['to'] });
export type ExpensesExportQuery = z.infer<typeof expensesExportQuery>;

export const exportQuerySchemas = {
  sales: salesExportQuery,
  receiving: rangeExportQuery,
  inventory: inventoryExportQuery,
  returns: rangeExportQuery,
  customers: rangeExportQuery,
  'cash-topups': rangeExportQuery,
  expenses: expensesExportQuery,
  'finance-revenue': rangeExportQuery,
  'finance-expenses': rangeExportQuery,
} as const satisfies Record<ExportReport, z.ZodTypeAny>;
