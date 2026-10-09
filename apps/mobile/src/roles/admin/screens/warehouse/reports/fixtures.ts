/**
 * Report hub cards, their permission gates, and mock data for the report screens.
 *
 * Mock only: there is no report endpoint the screens call yet (SPEC_GAPS.md
 * W3b-1). The values are the ones the screens hard-coded, moved here so the
 * screens hold no data.
 */
import type { PermissionCheck, WarehouseScope } from '../finance-expenses';
import { WALLET_WAREHOUSES } from '../wallet-cashtopup/fixtures';
import type { ReportCard, ReportKind, ReportKpi, ReportRecord, ReportSection } from './types';

/**
 * docs/rbac.json codes the reports area checks. rbac.json has no report-view
 * code (SPEC_GAPS.md W3b-1), so each report card is gated by the code of the
 * data it shows (FINAL_LIST row 92). The server enforces all of them again.
 */
export const REPORT_CODES = {
  sales: 'order.list.view_all',
  revenue: 'finance.sales_income.view',
  expense: 'finance.expense.log',
  cashTopUp: 'wallet.cash_topup.process',
  returns: 'rma.request.process',
  customers: 'customer.list.view',
  inventory: 'inventory.batch.view',
  export: 'report.export.file',
} as const;

/** The four warehouses (seed 001) offered by the Main all-warehouses selector. */
export const REPORT_WAREHOUSES: readonly WarehouseScope[] = WALLET_WAREHOUSES;

/**
 * The hub's report cards. Receiving is gated like the receiving history view
 * (inventory.batch.view, FINAL_LIST row 91). The Daily / Monthly Summary has no
 * code of its own (consolidated read-only totals) and renders ungated.
 */
export const REPORT_SECTIONS: readonly ReportSection[] = [
  {
    category: 'SALES',
    reports: [
      { title: 'Sales Report', code: 'SALES_REPORT', subtitle: 'Orders, channel sales & transaction log', permission: REPORT_CODES.sales },
    ],
  },
  {
    category: 'INVENTORY',
    reports: [
      { title: 'Inventory Report', code: 'INVENTORY_REPORT', subtitle: 'Stock balance, low stock & out-of-stock', permission: REPORT_CODES.inventory },
    ],
  },
  {
    category: 'WAREHOUSE',
    reports: [
      { title: 'Receiving Report', code: 'RECEIVING_REPORT', subtitle: 'Goods receipts, QC status & quantities', permission: REPORT_CODES.inventory },
    ],
  },
  {
    category: 'CUSTOMERS',
    reports: [
      { title: 'Customer Report', code: 'CUSTOMER_REPORT', subtitle: 'Customer orders, frequency & channel spend', permission: REPORT_CODES.customers },
    ],
  },
  {
    category: 'FINANCE',
    reports: [
      { title: 'Revenue Report', code: 'REVENUE_REPORT', subtitle: 'Revenue sources, orders & average sale', permission: REPORT_CODES.revenue },
      { title: 'Expense Report', code: 'EXPENSE_REPORT', subtitle: 'Operational expense categorization & vouchers', permission: REPORT_CODES.expense },
      { title: 'Cash Top-Up Report', code: 'CASH_TOPUP_REPORT', subtitle: 'Customer wallet cash top-up records', permission: REPORT_CODES.cashTopUp },
    ],
  },
  {
    category: 'RETURNS',
    reports: [
      { title: 'Returns Report', code: 'RETURNS_REPORT', subtitle: 'Returns by issue category & resolutions', permission: REPORT_CODES.returns },
    ],
  },
  {
    category: 'SUMMARY',
    reports: [
      { title: 'Daily / Monthly Summary', code: 'SUMMARY_REPORT', subtitle: 'Consolidated overview & metrics' },
      // Visible with any report.export.file grant (MAIN holds it as `view`);
      // Generate / Download are gated separately on the grant (canExport).
      { title: 'Export Report', code: 'EXPORT_REPORT', subtitle: 'Download PDF / Excel reports', permission: REPORT_CODES.export },
    ],
  },
];

/** True when the viewer may open this report card. */
export function reportVisible(card: ReportCard, can: PermissionCheck): boolean {
  return card.permission === undefined || can(card.permission);
}

/**
 * Report types the export wizard offers, keyed to the hub card whose gate they
 * share (an export can only contain data the viewer may see).
 */
export const EXPORT_REPORT_OPTIONS: readonly { label: string; cardTitle: string }[] = [
  { label: 'Sales Report', cardTitle: 'Sales Report' },
  { label: 'Inventory Report', cardTitle: 'Inventory Report' },
  { label: 'Receiving Report', cardTitle: 'Receiving Report' },
  { label: 'Customer Report', cardTitle: 'Customer Report' },
  { label: 'Cash Top-Up Report', cardTitle: 'Cash Top-Up Report' },
  { label: 'Expense Report', cardTitle: 'Expense Report' },
  { label: 'Revenue Report', cardTitle: 'Revenue Report' },
  { label: 'Returns Report', cardTitle: 'Returns Report' },
  { label: 'Daily/Monthly Summary', cardTitle: 'Daily / Monthly Summary' },
];

export interface ReportCopy {
  title: string;
  /** Four KPI tiles, rendered two per row. */
  kpis: readonly [ReportKpi, ReportKpi, ReportKpi, ReportKpi];
}

export const REPORT_COPY: Record<ReportKind, ReportCopy> = {
  RETURNS: {
    title: 'Returns Report',
    kpis: [
      { label: 'Total Returns', value: '22' },
      { label: 'Pending', value: '5' },
      { label: 'Completed', value: '15' },
      { label: 'Refunded', value: '14' },
    ],
  },
  SALES: {
    title: 'Sales Report',
    kpis: [
      { label: 'Total Sales', value: '₹5,84,200' },
      { label: 'Today', value: '₹24,850' },
      { label: 'Transactions', value: '284' },
      { label: 'Avg Sale', value: '₹2,057' },
    ],
  },
};

/**
 * The single sample record both twins showed. The twins hard-coded its
 * warehouse as a literal name; it is left unset so the screen falls back to
 * the viewer's scope instead.
 */
export const SAMPLE_REPORT_RECORD: ReportRecord = {
  id: '001245',
  dateText: '25 Sep 2026',
};
