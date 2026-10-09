/**
 * Shared types for the Main Warehouse inline report screens.
 *
 * These screens used to exist twice (MainWarehouseReturns* and
 * MainWarehouseSales*), identical apart from the title and the four KPI tiles.
 * One screen per purpose now takes a `kind` prop; the per-kind copy and mock
 * data live in fixtures.ts.
 */

/** Which inline report a screen is showing. */
export type ReportKind = 'RETURNS' | 'SALES';

/** One KPI tile on a report summary. `value` is display text (mock today). */
export interface ReportKpi {
  label: string;
  value: string;
}

/** One report record (mock data today; the real report returns the same shape). */
export interface ReportRecord {
  id: string;
  dateText: string;
  /** Warehouse the record belongs to. Falls back to the viewer's scope when absent. */
  warehouseName?: string | undefined;
}
