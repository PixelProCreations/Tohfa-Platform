/**
 * Permission codes and hub cards for the warehouse reports area (M12). The single
 * source for both: the old fixtures.ts duplicate is gone.
 *
 * rbac.json has no report-view code, so each card is gated by the code its
 * endpoint requires on the server (apps/api/src/modules/reports/reports.routes.ts
 * and finance.routes.ts). The server enforces every one again (BR-64h); the gate
 * here only avoids drawing a card whose request would be a 403.
 *
 * No warehouse list lives here: the Main picker reads GET /warehouses through
 * shared/useWarehouseOptions.ts (BR-64b), a Sub admin has only its scope (BR-30).
 *
 * Not offered, and why (backend / platform gaps, not hidden by accident):
 *   - CSV export (GET /admin/exports/<report>, report.export.file): the endpoint
 *     answers text/csv and the app has no file save or share mechanism to put
 *     it anywhere. Needs a download/share module (e.g. a file-system + share
 *     sheet dependency) before an Export card can exist.
 *   - Per-order / per-invoice / per-item drill-downs: the report endpoints return
 *     aggregates only; the orders, invoices and inventory areas own the detail.
 */
import type { PermissionCheck } from '../finance-expenses';
import type { ReportCard, ReportSection } from './types';

/** docs/rbac.json codes, one per report endpoint (server route permission). */
export const REPORT_CODES = {
  /** GET /admin/reports/sales */
  sales: 'order.list.view_all',
  /** GET /admin/finance/reports/revenue */
  revenue: 'finance.sales_income.view',
  /** GET /admin/finance/reports/expenses */
  expense: 'finance.expense.log',
  /** GET /admin/reports/cash-topups */
  cashTopUp: 'wallet.cash_topup.process',
  /** GET /admin/reports/returns */
  returns: 'rma.request.process',
  /** GET /admin/reports/customers */
  customers: 'customer.list.view',
  /** GET /admin/reports/inventory */
  inventory: 'inventory.batch.view',
  /** GET /admin/reports/receiving (the route requires the goods-receipt code, not batch.view). */
  receiving: 'inventory.goods_receipt.record',
} as const;

/** The parts of the summary card, each gated like its own report. */
export const SUMMARY_PARTS: readonly string[] = [
  REPORT_CODES.sales,
  REPORT_CODES.inventory,
  REPORT_CODES.receiving,
  REPORT_CODES.revenue,
  REPORT_CODES.expense,
  REPORT_CODES.cashTopUp,
  REPORT_CODES.returns,
];

export const REPORT_SECTIONS: readonly ReportSection[] = [
  {
    category: 'SALES',
    labelKey: 'reports.category.SALES',
    reports: [
      {
        code: 'SALES_REPORT',
        titleKey: 'reports.card.sales.title',
        subtitleKey: 'reports.card.sales.subtitle',
        permission: REPORT_CODES.sales,
      },
    ],
  },
  {
    category: 'INVENTORY',
    labelKey: 'reports.category.INVENTORY',
    reports: [
      {
        code: 'INVENTORY_REPORT',
        titleKey: 'reports.card.inventory.title',
        subtitleKey: 'reports.card.inventory.subtitle',
        permission: REPORT_CODES.inventory,
      },
    ],
  },
  {
    category: 'WAREHOUSE',
    labelKey: 'reports.category.WAREHOUSE',
    reports: [
      {
        code: 'RECEIVING_REPORT',
        titleKey: 'reports.card.receiving.title',
        subtitleKey: 'reports.card.receiving.subtitle',
        permission: REPORT_CODES.receiving,
      },
    ],
  },
  {
    category: 'CUSTOMERS',
    labelKey: 'reports.category.CUSTOMERS',
    reports: [
      {
        code: 'CUSTOMER_REPORT',
        titleKey: 'reports.card.customers.title',
        subtitleKey: 'reports.card.customers.subtitle',
        permission: REPORT_CODES.customers,
      },
    ],
  },
  {
    category: 'FINANCE',
    labelKey: 'reports.category.FINANCE',
    reports: [
      {
        code: 'REVENUE_REPORT',
        titleKey: 'reports.card.revenue.title',
        subtitleKey: 'reports.card.revenue.subtitle',
        permission: REPORT_CODES.revenue,
      },
      {
        code: 'EXPENSE_REPORT',
        titleKey: 'reports.card.expense.title',
        subtitleKey: 'reports.card.expense.subtitle',
        permission: REPORT_CODES.expense,
      },
      {
        code: 'CASH_TOPUP_REPORT',
        titleKey: 'reports.card.cashTopup.title',
        subtitleKey: 'reports.card.cashTopup.subtitle',
        permission: REPORT_CODES.cashTopUp,
      },
    ],
  },
  {
    category: 'RETURNS',
    labelKey: 'reports.category.RETURNS',
    reports: [
      {
        code: 'RETURNS_REPORT',
        titleKey: 'reports.card.returns.title',
        subtitleKey: 'reports.card.returns.subtitle',
        permission: REPORT_CODES.returns,
      },
    ],
  },
  {
    category: 'SUMMARY',
    labelKey: 'reports.category.SUMMARY',
    reports: [
      {
        code: 'SUMMARY_REPORT',
        titleKey: 'reports.card.summary.title',
        subtitleKey: 'reports.card.summary.subtitle',
        anyOf: SUMMARY_PARTS,
      },
    ],
  },
];

/** True when the viewer may open this report card. */
export function reportVisible(card: ReportCard, can: PermissionCheck): boolean {
  if (card.permission !== undefined && !can(card.permission)) return false;
  if (card.anyOf !== undefined && !card.anyOf.some((code) => can(code))) return false;
  return true;
}

/** The hub sections with only the cards the viewer may open; empty sections dropped. */
export function visibleReportSections(can: PermissionCheck): ReportSection[] {
  return REPORT_SECTIONS.map((section) => ({
    ...section,
    reports: section.reports.filter((card) => reportVisible(card, can)),
  })).filter((section) => section.reports.length > 0);
}
