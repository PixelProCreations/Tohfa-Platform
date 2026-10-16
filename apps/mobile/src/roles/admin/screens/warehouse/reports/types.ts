/**
 * Shared types for the warehouse reports area (design module M12).
 *
 * ReportsScreen (the M12 hub with its inline report views) serves both
 * warehouse roles: `scope` decides Sub (locked to its warehouse) versus Main
 * (all-warehouses selector), and `can` decides which report cards render.
 */
import type { TranslationKey } from '../../../i18n';

/**
 * The hub's report cards, one per inline report view. Every one is fed by a
 * real endpoint (GET /admin/reports/* or /admin/finance/reports/*); the CSV
 * export card is not here because the app has no file save / share mechanism.
 */
export type ReportCode =
  | 'SALES_REPORT'
  | 'INVENTORY_REPORT'
  | 'RECEIVING_REPORT'
  | 'CUSTOMER_REPORT'
  | 'REVENUE_REPORT'
  | 'EXPENSE_REPORT'
  | 'CASH_TOPUP_REPORT'
  | 'RETURNS_REPORT'
  | 'SUMMARY_REPORT';

/** One card on the reports hub. */
export interface ReportCard {
  code: ReportCode;
  titleKey: TranslationKey;
  subtitleKey: TranslationKey;
  /**
   * docs/rbac.json code the server requires for this report's endpoint; the
   * card renders only when `can(permission)`.
   */
  permission?: string | undefined;
  /**
   * For a card composed of several reports (the summary): it renders when the
   * viewer holds at least one of these codes, and shows only those parts.
   */
  anyOf?: readonly string[] | undefined;
}

/** The hub's category ids. */
export type ReportCategory = 'SALES' | 'INVENTORY' | 'WAREHOUSE' | 'CUSTOMERS' | 'FINANCE' | 'RETURNS' | 'SUMMARY';

/** One category block on the reports hub. */
export interface ReportSection {
  category: ReportCategory;
  labelKey: TranslationKey;
  reports: readonly ReportCard[];
}

/** The date presets the hub offers (from/to are always both sent, BR-64e). */
export type ReportPreset = 'Today' | 'Week' | 'Month';

/** The inline views ReportsScreen switches between (its own navigation). */
export type ReportScreenType =
  | 'main'
  | 'sales_report'
  | 'inventory_report'
  | 'receiving_report'
  | 'customer_report'
  | 'cash_topup_report'
  | 'revenue_report'
  | 'expense_report'
  | 'summary_report'
  | 'returns_report';
