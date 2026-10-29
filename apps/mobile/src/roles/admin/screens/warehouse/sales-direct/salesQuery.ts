/**
 * Sales history list query helpers: date presets and filter → ListSalesParams mapping.
 *
 * No React, no network. Unit-tested in tests/sales_flow.test.ts.
 *
 * BR-30: the sales list query never carries a warehouseId — the server confines
 * the result to the caller's scope. A filter object may carry a warehouseId for
 * the warehouse picker UI (Main only), but toListSalesParams must not forward it.
 *
 * Date presets are resolved in Asia/Kolkata time. The `now` parameter is passed
 * explicitly so tests can pin the clock.
 */
import type { ListSalesParams, SaleChannel, SalePaymentMethod, SalePaymentStatus, SaleStatus } from '../../../api/sales';

// ─── Date presets ─────────────────────────────────────────────────────────────

const KOLKATA_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

/** Convert a UTC Date to a YYYY-MM-DD string in Asia/Kolkata. */
function toKolkataDate(utc: Date): string {
  const kolkata = new Date(utc.getTime() + KOLKATA_OFFSET_MS);
  const y = kolkata.getUTCFullYear();
  const m = String(kolkata.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kolkata.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Subtract `days` calendar days (in Kolkata) from `utc` and return that date string. */
function kolkataDateMinusDays(utc: Date, days: number): string {
  const shifted = new Date(utc.getTime() - days * 24 * 60 * 60 * 1000);
  return toKolkataDate(shifted);
}

/**
 * Resolve a date preset to `{ from, to }` in Asia/Kolkata calendar days.
 * `now` is the current UTC time (injected for testing).
 */
export function salesDateRange(
  preset: 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | string,
  now: Date,
): { from: string; to: string } {
  const today = toKolkataDate(now);
  switch (preset) {
    case 'TODAY':
      return { from: today, to: today };
    case 'YESTERDAY': {
      const yesterday = kolkataDateMinusDays(now, 1);
      return { from: yesterday, to: yesterday };
    }
    case 'LAST_7_DAYS': {
      const weekAgo = kolkataDateMinusDays(now, 6);
      return { from: weekAgo, to: today };
    }
    default:
      return { from: today, to: today };
  }
}

// ─── Filter types ─────────────────────────────────────────────────────────────

/**
 * The filter state held by the sales history screen. Values of `undefined` or
 * the sentinel `'ALL'` are dropped when building the API params.
 */
export interface SalesFilters {
  /** Date preset or custom range sentinel. */
  dateRange?: 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | string | undefined;
  status?: SaleStatus | 'ALL' | undefined;
  channel?: SaleChannel | 'ALL' | undefined;
  paymentStatus?: Exclude<SalePaymentStatus, 'REFUND_DUE'> | 'ALL' | undefined;
  paymentMethod?: SalePaymentMethod | 'ALL' | undefined;
  searchQuery?: string | undefined;
  /**
   * Main-only warehouse filter — held in the filter object for the UI picker,
   * but NEVER forwarded to the API (ListSalesParams has no warehouseId field;
   * the server applies scope). BR-30.
   */
  warehouseId?: string | undefined;
}

/** Starting state for the filter panel (today, no other filters). */
export const DEFAULT_SALES_FILTERS: SalesFilters = {
  dateRange: 'TODAY',
};

// ─── Filter → params ──────────────────────────────────────────────────────────

/**
 * Map the screen's filter state to the `ListSalesParams` the API accepts.
 * Omits undefined / 'ALL' values. Never forwards warehouseId (BR-30).
 */
export function toListSalesParams(filters: SalesFilters, now: Date): ListSalesParams {
  const { from, to } = salesDateRange(filters.dateRange ?? 'TODAY', now);

  const status = filters.status && filters.status !== 'ALL' ? filters.status : undefined;
  const channel = filters.channel && filters.channel !== 'ALL' ? filters.channel : undefined;
  const paymentStatus = filters.paymentStatus && filters.paymentStatus !== 'ALL' ? filters.paymentStatus : undefined;
  const paymentMethod = filters.paymentMethod && filters.paymentMethod !== 'ALL' ? filters.paymentMethod : undefined;
  const q = filters.searchQuery?.trim() || undefined;

  const params: ListSalesParams = { from, to };
  if (status !== undefined) params.status = status;
  if (channel !== undefined) params.channel = channel;
  if (paymentStatus !== undefined) params.paymentStatus = paymentStatus;
  if (paymentMethod !== undefined) params.paymentMethod = paymentMethod;
  if (q !== undefined) params.q = q;
  // warehouseId is intentionally NOT forwarded — see BR-30 comment above.
  return params;
}
