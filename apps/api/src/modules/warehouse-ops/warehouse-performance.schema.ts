/**
 * BR-80: warehouse performance, a read-only set of exact derivations from existing rows.
 * Must match docs/openapi.yaml (`GET /warehouses/{id}/performance`).
 *
 * Deliberately NOT in the response: scores, rates, percentages, targets, SLAs, rankings, on-time
 * handover, putaway time, stock turnover. The data model has no column that makes them an exact
 * derivation and the owner has defined none of them; the designed screen shows them as example data.
 */
import { z } from 'zod';
import { isCalendarDate } from '../certifications/certifications.schema.js';
import { grnStatuses, orderStatuses } from '../reports/reports.schema.js';
import { returnStatuses } from '../returnRequests/returnRequests.schema.js';

const calendarDate = z
  .string()
  .refine(isCalendarDate, { message: 'Must be a real calendar date in YYYY-MM-DD format' });

/** GET /v1/warehouses/{id}/performance?from&to (inclusive IST dates; the span cap is enforced by the service). */
export const performanceQuery = z
  .object({ from: calendarDate, to: calendarDate })
  .strict()
  .refine((value) => value.from <= value.to, { message: '"from" must be earlier than or equal to "to"', path: ['to'] });
export type PerformanceQuery = z.infer<typeof performanceQuery>;

/** `stock_movement_type` enum, db/migrations/0001_extensions_and_enums.sql. */
export const stockMovementTypes = [
  'RECEIPT',
  'SALE',
  'TRANSFER_OUT',
  'TRANSFER_IN',
  'ADJUSTMENT',
  'WASTAGE',
  'RETURN_IN',
  'RESERVATION',
  'RELEASE',
] as const;

const quantity = z.string().regex(/^-?[0-9]{1,12}\.[0-9]{3}$/);
const statusCount = <T extends readonly [string, ...string[]]>(statuses: T) =>
  z.object({ status: z.enum(statuses), count: z.number().int() });

export const warehousePerformanceResponse = z.object({
  warehouseId: z.string().uuid(),
  from: z.string(),
  to: z.string(),
  orders: z.object({
    /** Every order of the warehouse placed in the range, whatever its status. */
    placed: z.number().int(),
    /** Of those, PICKED_UP or DELIVERED. */
    fulfilled: z.number().int(),
    /** Of those, CANCELLED. */
    cancelled: z.number().int(),
    byStatus: z.array(statusCount(orderStatuses)),
  }),
  receiving: z.object({
    goodsReceipts: z.number().int(),
    byStatus: z.array(statusCount(grnStatuses)),
    grossQtyKg: quantity,
    acceptedQtyKg: quantity,
    rejectedQtyKg: quantity,
  }),
  returns: z.object({
    /** Return requests created in the range against orders of this warehouse. */
    requested: z.number().int(),
    byStatus: z.array(statusCount(returnStatuses)),
  }),
  /** Stock-ledger rows of the warehouse in the range, per movement type; `qtyKg` is the signed sum of `qty_delta`. */
  stockMovements: z.array(
    z.object({ movementType: z.enum(stockMovementTypes), entries: z.number().int(), qtyKg: quantity }),
  ),
});
export type WarehousePerformance = z.infer<typeof warehousePerformanceResponse>;
