/**
 * Shared types for the warehouse reports area (design module M12).
 *
 * ReportsScreen (M12-S01 hub with the inline M12-S02..S11 report views) serves
 * both warehouse roles: `scope` decides Sub (locked to its warehouse) versus
 * Main (all-warehouses selector), and `can` decides which report cards render.
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

/** The hub's report cards, one per inline report view. */
export type ReportCode =
  | 'SALES_REPORT'
  | 'INVENTORY_REPORT'
  | 'RECEIVING_REPORT'
  | 'CUSTOMER_REPORT'
  | 'REVENUE_REPORT'
  | 'EXPENSE_REPORT'
  | 'CASH_TOPUP_REPORT'
  | 'RETURNS_REPORT'
  | 'SUMMARY_REPORT'
  | 'EXPORT_REPORT';

/** One card on the reports hub. */
export interface ReportCard {
  title: string;
  code: ReportCode;
  subtitle: string;
  /**
   * docs/rbac.json code of the data the report shows; the card renders only when
   * `can(permission)`. Absent = no code covers it (see fixtures.ts).
   */
  permission?: string | undefined;
}

/** One category block on the reports hub. */
export interface ReportSection {
  category: string;
  reports: readonly ReportCard[];
}

/** The inline views ReportsScreen switches between (its own navigation). */
export type ReportScreenType =
  | 'main'
  | 'sales_report'
  | 'sales_order_detail'
  | 'invoice_detail'
  | 'orders_list'
  | 'inventory_report'
  | 'inventory_item_detail'
  | 'receiving_report'
  | 'receiving_item_detail'
  | 'customer_report'
  | 'customer_item_detail'
  | 'cash_topup_report'
  | 'cash_topup_item_detail'
  | 'revenue_report'
  | 'revenue_item_detail'
  | 'expense_report'
  | 'expense_item_detail'
  | 'export_report'
  | 'summary_report'
  | 'returns_report'
  | 'returns_item_detail';
