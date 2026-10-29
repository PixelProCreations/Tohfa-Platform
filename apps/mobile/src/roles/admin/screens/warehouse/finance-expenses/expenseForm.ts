/**
 * The add-expense form's request body and its date-picker arithmetic, as pure
 * functions (no react-native import) so vitest can pin them.
 *
 * POST /admin/expenses (docs/openapi.yaml ExpenseCreate; finance.schema.ts
 * createExpenseBody) is `.strict()`: categoryId and warehouseId must be UUIDs,
 * vendor / description are trimmed, 1..200 / 1..1000 chars when present, the
 * amount is a positive decimal string of at most numeric(12,2), the date a real
 * calendar day. A body the server would 422 is refused here instead, so the
 * screen never sends the old fixture ids ('cat-1', 'WH-COON') or an empty
 * description.
 *
 * Warehouse (BR-62.1): a Sub admin is confined to its own warehouse, so its body
 * carries none and the server books it there; a Main admin is not confined and
 * must name one (`requiresWarehouse`).
 */
import { fromPaise, type Paise } from '@tohfa/shared-types';
import type { ExpenseCreateDto, ExpensePaymentMethod } from '../../../api/finance';
import { parseRupeesToPaise } from '../../../money/paise';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
/** numeric(12,2): at most 10 integer digits, i.e. below 10^10 rupees. */
const MAX_AMOUNT_PAISE = 999_999_999_999;
/** docs/openapi.yaml ExpenseCreate maxLength values. */
const VENDOR_MAX = 200;
const DESCRIPTION_MAX = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export type ExpenseFormMethod = 'Cash' | 'UPI' | 'Bank';

const METHOD_CODE: Record<ExpenseFormMethod, ExpensePaymentMethod> = { Cash: 'CASH', UPI: 'UPI', Bank: 'BANK' };

export interface ExpenseFormInput {
  categoryId: string | undefined;
  warehouseId: string | undefined;
  /** True for an actor not confined to a warehouse (Main): it must name one. */
  requiresWarehouse: boolean;
  /** "YYYY-MM-DD", the IST calendar day chosen in the picker. */
  expenseDate: string;
  /** What the admin typed, e.g. "1,250.25". */
  amountText: string;
  paymentMethod: ExpenseFormMethod;
  vendor: string;
  description: string;
}

export type ExpenseFormProblem = 'category' | 'warehouse' | 'date' | 'amount' | 'vendor' | 'description';

export type ExpenseFormResult =
  | { ok: true; body: ExpenseCreateDto; amountPaise: Paise }
  | { ok: false; problems: ExpenseFormProblem[] };

export function isUuid(value: string | undefined): value is string {
  return value !== undefined && UUID_RE.test(value);
}

/** True for a real "YYYY-MM-DD" calendar day (2026-02-30 is not one). */
export function isIsoCalendarDay(value: string): boolean {
  const m = ISO_DAY_RE.exec(value);
  if (m === null) return false;
  const year = Number(m[1]);
  const month0 = Number(m[2]) - 1;
  const day = Number(m[3]);
  return month0 >= 0 && month0 < 12 && day >= 1 && day <= calendarDaysInMonth(year, month0);
}

export function buildExpenseCreateBody(input: ExpenseFormInput): ExpenseFormResult {
  const problems: ExpenseFormProblem[] = [];

  if (!isUuid(input.categoryId)) problems.push('category');
  const warehouseGiven = input.warehouseId !== undefined && input.warehouseId !== '';
  if ((input.requiresWarehouse || warehouseGiven) && !isUuid(input.warehouseId)) problems.push('warehouse');
  if (!isIsoCalendarDay(input.expenseDate)) problems.push('date');

  const amountPaise = parseRupeesToPaise(input.amountText);
  if (amountPaise === null || amountPaise <= 0 || amountPaise > MAX_AMOUNT_PAISE) problems.push('amount');

  const vendor = input.vendor.trim();
  const description = input.description.trim();
  if (vendor.length > VENDOR_MAX) problems.push('vendor');
  if (description.length > DESCRIPTION_MAX) problems.push('description');

  if (problems.length > 0 || amountPaise === null || !isUuid(input.categoryId)) {
    return { ok: false, problems };
  }

  const body: ExpenseCreateDto = {
    categoryId: input.categoryId,
    expenseDate: input.expenseDate,
    amount: fromPaise(amountPaise),
    paymentMethod: METHOD_CODE[input.paymentMethod],
    ...(vendor === '' ? {} : { vendor }),
    ...(description === '' ? {} : { description }),
    ...(isUuid(input.warehouseId) ? { warehouseId: input.warehouseId } : {}),
  };
  return { ok: true, body, amountPaise };
}

// ─── Calendar-day arithmetic for the date picker ─────────────────────────────
// Calendar days, not instants: UTC fields of a UTC-midnight Date are used only
// as a day counter, so the device time zone never shifts a day.

export function isoDayOf(year: number, month0: number, day: number): string {
  return `${year}-${String(month0 + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** { year, month0 (0-11), day } of a "YYYY-MM-DD" day; null when it is not one. */
export function partsOfIsoDay(value: string): { year: number; month0: number; day: number } | null {
  if (!isIsoCalendarDay(value)) return null;
  const [y, m, d] = value.split('-');
  return { year: Number(y), month0: Number(m) - 1, day: Number(d) };
}

export function shiftIsoDay(value: string, deltaDays: number): string {
  const p = partsOfIsoDay(value);
  if (p === null) return value;
  const shifted = new Date(Date.UTC(p.year, p.month0, p.day) + deltaDays * DAY_MS);
  return isoDayOf(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
}

/** "YYYY-MM-01" of the month `value` falls in. */
export function monthStartOf(value: string): string {
  const p = partsOfIsoDay(value);
  return p === null ? value : isoDayOf(p.year, p.month0, 1);
}

export function calendarDaysInMonth(year: number, month0: number): number {
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}

/** Weekday of the 1st of the month, 0 = Sunday. */
export function calendarFirstWeekday(year: number, month0: number): number {
  return new Date(Date.UTC(year, month0, 1)).getUTCDay();
}
