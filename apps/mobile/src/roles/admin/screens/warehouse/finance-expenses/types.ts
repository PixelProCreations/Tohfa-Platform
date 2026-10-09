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
