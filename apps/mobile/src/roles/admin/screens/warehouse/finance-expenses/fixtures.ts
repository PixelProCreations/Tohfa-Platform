/**
 * Mock data for the finance screens until the finance APIs exist.
 *
 * The Sub and Main copies each carried their own sample rows, all implicitly
 * "Coonoor". Rows now name their warehouse, so a Sub scope shows only its own
 * (the server applies the real filter: cross-scope reads return an empty set,
 * CLAUDE.md 2.1) and the Main all-warehouses view shows every warehouse.
 * Warehouse names come from WALLET_WAREHOUSES (db/seed/001_reference.sql codes),
 * not from literals in each screen.
 */
import { WALLET_WAREHOUSES } from '../wallet-cashtopup/fixtures';
import type { ExpenseCategoryItem, RevenueRecord, VoucherRecord, WarehouseScope } from './types';

/** Warehouses for the Main all-warehouses selectors. */
export const FINANCE_WAREHOUSES: readonly WarehouseScope[] = WALLET_WAREHOUSES;

function warehouse(id: string): { warehouseId: string; warehouseName: string | undefined } {
  return { warehouseId: id, warehouseName: FINANCE_WAREHOUSES.find((w) => w.warehouseId === id)?.warehouseName };
}

export const SAMPLE_REVENUE_RECORDS: readonly RevenueRecord[] = [
  {
    id: 'REV-000845',
    orderRef: 'Market Sale · Order #ORD-10284',
    category: 'Direct Sales',
    amount: 3450,
    paymentMethod: 'Wallet',
    timestamp: '25 Sep 2026 · 11:20 AM',
    status: 'Completed',
    ...warehouse('WH-COON'),
  },
  {
    id: 'REV-000841',
    orderRef: 'Customer Order · ORD-10279',
    category: 'Orders',
    amount: 1900,
    paymentMethod: 'UPI',
    timestamp: '25 Sep 2026 · 9:05 AM',
    status: 'Completed',
    ...warehouse('WH-COON'),
  },
  {
    id: 'REV-000839',
    orderRef: 'Customer Order · ORD-10275',
    category: 'Orders',
    amount: 4200,
    paymentMethod: 'Cash',
    timestamp: '25 Sep 2026 · 8:30 AM',
    status: 'Completed',
    ...warehouse('WH-OOTY'),
  },
  {
    id: 'REV-000835',
    orderRef: 'Market Sale · Stalls & Counter',
    category: 'Direct Sales',
    amount: 2850,
    paymentMethod: 'Wallet',
    timestamp: '24 Sep 2026 · 4:15 PM',
    status: 'Completed',
    ...warehouse('WH-COON'),
  },
  {
    id: 'REV-000828',
    orderRef: 'Other channels · Wholesale Dispatch',
    category: 'Other',
    amount: 2600,
    paymentMethod: 'Bank Transfer',
    timestamp: '24 Sep 2026 · 2:00 PM',
    status: 'Completed',
    ...warehouse('WH-KOTA'),
  },
];

export const SAMPLE_VOUCHERS: readonly VoucherRecord[] = [
  {
    id: 'VCH-000821',
    type: 'Expense',
    title: 'Expense Voucher · Transport',
    amount: 2400,
    referenceId: 'EXP-001245',
    date: '25 Sep 2026',
    status: 'Recorded',
    paymentMethod: 'Cash',
    ...warehouse('WH-COON'),
  },
  {
    id: 'VCH-000820',
    type: 'Revenue',
    title: 'Revenue Voucher · B2B Sale - Taj Hotel',
    amount: 14500,
    referenceId: 'REV-001089',
    date: '25 Sep 2026',
    status: 'Completed',
    paymentMethod: 'Bank Transfer / Cash',
    notes: 'Direct settlement authorized for delivery batch.',
    ...warehouse('WH-COON'),
  },
  {
    id: 'VCH-000819',
    type: 'Expense',
    title: 'Expense Voucher · Loading / Unloading',
    amount: 1800,
    referenceId: 'EXP-001244',
    date: '25 Sep 2026',
    status: 'Pending',
    paymentMethod: 'Cash',
    ...warehouse('WH-OOTY'),
  },
  {
    id: 'VCH-000818',
    type: 'Revenue',
    title: 'Revenue Voucher · Market Day Cash',
    amount: 8200,
    referenceId: 'REV-001088',
    date: '24 Sep 2026',
    status: 'Completed',
    paymentMethod: 'Cash / UPI',
    ...warehouse('WH-COON'),
  },
  {
    id: 'VCH-000815',
    type: 'Expense',
    title: 'Expense Voucher · Generator Diesel',
    amount: 620,
    referenceId: 'EXP-001238',
    date: '24 Sep 2026',
    status: 'Recorded',
    paymentMethod: 'Cash',
    ...warehouse('WH-KOTA'),
  },
];

export const EXPENSE_CATEGORIES: readonly ExpenseCategoryItem[] = [
  { id: 'cat-1', name: 'Transport', status: 'Active', usedCount: 28 },
  { id: 'cat-2', name: 'Loading', status: 'Active', usedCount: 16 },
  { id: 'cat-3', name: 'Unloading', status: 'Active', usedCount: 14 },
  { id: 'cat-4', name: 'Maintenance', status: 'Active', usedCount: 8 },
  { id: 'cat-5', name: 'Utilities', status: 'Active', usedCount: 6 },
  { id: 'cat-6', name: 'Warehouse Operations', status: 'Active', usedCount: 4 },
  { id: 'cat-7', name: 'Other', status: 'Inactive', usedCount: 2 },
];

/** Default revenue detail (the old SubWarehouseRevenueDetailScreen defaults, minus the hard-wired warehouse). */
export const SAMPLE_REVENUE_DETAIL = {
  revenueId: 'REV-000845',
  orderId: 'ORD-10284',
  invoiceId: 'INV-2026-000845',
  customer: 'Ravi Kumar',
  salesChannel: 'Market Sale',
  quantity: '3 KG',
  product: 'Tomato',
  finalAmount: '3,450',
  paymentMethod: 'Wallet',
  paymentStatus: 'Completed',
  transactionDate: '25 Sep, 11:20 AM',
} as const;

/** Mock date for the daily cash ledger opened from the hub. */
export const FINANCE_TODAY = '25 Sep 2026';
