/**
 * Shared types for the warehouse finance/expense screens.
 *
 * These screens used to exist twice (a SubWarehouse* copy and a MainWarehouse*
 * copy) and each copy declared its own FinanceHistoryItem / ExpenseRecord /
 * FinanceReportItem; the dashboard barrel re-exported both, so the names
 * clashed. One screen now serves both warehouse roles, and its types live here.
 *
 * The role difference is carried by two props instead of two files:
 *   - `scope`: which warehouse the viewer is looking at. `warehouseId`
 *     undefined means "all warehouses" (the Main Warehouse view).
 *   - `can`: a permission check against docs/rbac.json codes. The server
 *     enforces every one of these again (CLAUDE.md 2.1); `can` only decides
 *     what is worth rendering.
 */

/** Which warehouse a screen is scoped to. `warehouseId` undefined = all warehouses (Main). */
export interface WarehouseScope {
  warehouseId?: string | undefined;
  warehouseName?: string | undefined;
}

/** True when the signed-in admin holds the docs/rbac.json permission `code`. */
export type PermissionCheck = (code: string) => boolean;

/** Bottom-navigation tabs of the warehouse admin shells. */
export type WarehouseTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

/** Optional escape hatch to the host navigator (App.tsx `navigate`). */
export type WarehouseNavigate = (screen: string, params?: Record<string, unknown>) => void;

/** Props every shared warehouse finance screen takes. */
export interface WarehouseScreenBaseProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  onBack: () => void;
  onNavigate?: WarehouseNavigate | undefined;
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
}

/** One row of the combined revenue + expense history. */
export interface FinanceHistoryItem {
  id: string;
  type: 'Revenue' | 'Expense';
  title: string;
  amount: number;
  time: string;
}

/** One report card on the finance reports screen. */
export interface FinanceReportItem {
  id: string;
  title: string;
  subtitle: string;
  iconType: 'revenue' | 'expense' | 'daily' | 'monthly' | 'category' | 'voucher';
}

/** One row of the expenses list. */
export interface ExpenseRecord {
  id: string;
  categoryRef: string;
  amount: number;
  timestamp: string;
  status: 'Recorded' | 'Pending' | 'Approved' | 'Rejected';
}

/**
 * One revenue (sales income) row. Was declared twice, as RevenueRecord in both
 * SubWarehouseRevenueScreen and MainWarehouseRevenueScreen. `warehouseId`
 * lets a Sub scope show only its own rows (finance.sales_income.view is `own`
 * for SUB_WH_ADMIN, `all` for MAIN_WH_ADMIN).
 */
export interface RevenueRecord {
  id: string;
  orderRef: string;
  category: 'Orders' | 'Direct Sales' | 'Other';
  amount: number;
  paymentMethod: string;
  timestamp: string;
  status: 'Completed' | 'Pending' | 'Refunded';
  warehouseId?: string | undefined;
  warehouseName?: string | undefined;
}

/** What the revenue detail screen shows; every field optional (deep links carry only some). */
export interface RevenueDetail {
  revenueId?: string | undefined;
  orderId?: string | undefined;
  invoiceId?: string | undefined;
  customer?: string | undefined;
  salesChannel?: string | undefined;
  quantity?: string | undefined;
  product?: string | undefined;
  /** Display amount without the rupee sign, e.g. '3,450'. */
  finalAmount?: string | undefined;
  paymentMethod?: string | undefined;
  paymentStatus?: string | undefined;
  transactionDate?: string | undefined;
  warehouseName?: string | undefined;
}

/** Voucher types. No rbac code covers vouchers; each type is gated by the code of its data (SPEC_GAPS). */
export type VoucherType = 'Expense' | 'Revenue';

/** One voucher row (was VoucherRecord in SubWarehouseVouchersScreen). */
export interface VoucherRecord {
  id: string;
  type: VoucherType;
  title: string;
  amount: number;
  referenceId: string;
  date: string;
  status: 'Recorded' | 'Pending' | 'Completed';
  warehouseId?: string | undefined;
  warehouseName?: string | undefined;
  createdBy?: string | undefined;
  paymentMethod?: string | undefined;
  notes?: string | undefined;
}

/** One expense category (read-only: no rbac code covers category management). */
export interface ExpenseCategoryItem {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  usedCount: number;
}

/** Expense fields a host or the history list can hand the expense detail screen. */
export interface ExpenseDetailParams {
  expenseId?: string | undefined;
  amount?: number | string | undefined;
  category?: string | undefined;
  date?: string | undefined;
  description?: string | undefined;
  paymentMethod?: string | undefined;
  vendorPayee?: string | undefined;
  warehouse?: string | undefined;
  createdBy?: string | undefined;
  status?: string | undefined;
}

/**
 * Routes of FinanceFlow (the finance hub and everything reached from it).
 * The old App.tsx keys map onto these (FINANCE_ROUTE_ENTRY in App.tsx).
 * Daily Cash renders the wallet-cashtopup DailyCashScreen (W4i).
 */
export type FinanceRoute =
  | 'FinanceHub'
  | 'Revenue'
  | 'RevenueDetail'
  | 'Expenses'
  | 'AddExpense'
  | 'ExpenseDetail'
  | 'ExpenseCategories'
  | 'Vouchers'
  | 'VoucherDetail'
  | 'FinanceHistory'
  | 'FinanceReports'
  | 'DailyCash';

/** Params a FinanceFlow route can carry. */
export interface FinanceRouteParams {
  revenue?: RevenueDetail | undefined;
  expense?: ExpenseDetailParams | undefined;
  /** Prefills the add-expense form (edit mode). Absent = a new expense. */
  expenseDraft?: ExpenseDraft | undefined;
  voucher?: VoucherRecord | undefined;
  isReceiptView?: boolean | undefined;
  /** Compact detail layout (Main opens details from history this way). */
  isShortVersion?: boolean | undefined;
}

/** An expense being edited (prefills the add-expense form). */
export interface ExpenseDraft {
  expenseId: string;
  amount: string;
  category: string;
  date: string;
  description: string;
  paymentMethod: 'Cash' | 'UPI' | 'Bank';
  vendorPayee: string;
}
