/**
 * Constants, permissions, and section definitions for the warehouse reports area (M12).
 * Gated by real permissions from docs/rbac.json and scoped to warehouse (BR-64).
 */
import type { PermissionCheck, WarehouseScope } from '../finance-expenses';
import { WALLET_WAREHOUSES } from '../wallet-cashtopup/fixtures';
import type { ReportCard, ReportSection } from './types';

/**
 * docs/rbac.json codes the reports area checks (BR-64).
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
 * The hub's report cards.
 * Note: CSV/file export is hidden entirely (BR-64 / M12: no in-app file-share mechanism yet).
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
      { title: 'Inventory Report', code: 'INVENTORY_REPORT', subtitle: 'Stock balance, active batches & quantities', permission: REPORT_CODES.inventory },
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
      { title: 'Customer Report', code: 'CUSTOMER_REPORT', subtitle: 'Active & new customer counts', permission: REPORT_CODES.customers },
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
    ],
  },
];

/** True when the viewer may open this report card. */
export function reportVisible(card: ReportCard, can: PermissionCheck): boolean {
  return card.permission === undefined || can(card.permission);
}
