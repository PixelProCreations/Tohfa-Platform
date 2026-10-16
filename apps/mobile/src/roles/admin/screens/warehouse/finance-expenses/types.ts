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
import type { Paise } from '@tohfa/shared-types';
import type {
  ExpensePaymentMethod,
  ExpenseStatus,
  RevenueChannel,
  RevenuePaymentMethod,
} from '../../../api/finance';

/** Which warehouse a screen is scoped to. `warehouseId` undefined = all warehouses (Main). */
export interface WarehouseScope {
  warehouseId?: string | undefined;
  warehouseName?: string | undefined;
  /**
   * Human warehouse code (`Warehouse.code`, e.g. WH-COON) from GET
   * /warehouses/{id}. `warehouseId` is the server uuid; screens still running
   * on fixtures key their rows by this code, so their "in scope" checks
   * compare `warehouseCode ?? warehouseId`.
   */
  warehouseCode?: string | undefined;
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

/** One row of the expenses list: a live `Expense` (docs/openapi.yaml), money in integer paise. */
export interface ExpenseRecord {
  /** The expense uuid (GET /admin/expenses/{id} and its voucher take it). */
  id: string;
  categoryName: string;
  description: string | null;
  vendor: string | null;
  amountPaise: Paise;
  /** YYYY-MM-DD, the expense date the admin recorded. */
  expenseDate: string;
  /** Translated "25 Sep 2026". */
  dateLabel: string;
  paymentMethod: ExpensePaymentMethod | null;
  /** Translated payment method, '' when the legacy row carries none. */
  paymentMethodLabel: string;
  status: ExpenseStatus;
  statusLabel: string;
  warehouseId: string | null;
  recordedBy: string;
  createdAt: string;
}

/** One revenue row: a completed, paid order (BR-63), money in integer paise. */
export interface RevenueRecord {
  /** The order uuid (GET /admin/finance/revenue/{id}). */
  id: string;
  channel: RevenueChannel;
  channelLabel: string;
  paymentMethod: RevenuePaymentMethod;
  paymentMethodLabel: string;
  amountPaise: Paise;
  gstPaise: Paise;
  completedAt: string;
  /** Translated "Today · 08:05 AM". */
  dateLabel: string;
  warehouseId: string;
}

/** The revenue detail screen: a revenue row plus its invoice (null when none). */
export interface RevenueDetail extends RevenueRecord {
  invoiceNumber: string | null;
  invoiceStatus: string | null;
  paymentStatus: string;
  orderStatus: string;
  placedAt: string;
}

/** An expense voucher (BR-75), derived by the server from one expense. */
export interface VoucherRecord {
  voucherNumber: string;
  expenseId: string;
  warehouseName: string | null;
  warehouseCode: string | null;
  categoryName: string;
  amountPaise: Paise;
  expenseDate: string;
  dateLabel: string;
  paymentMethodLabel: string;
  vendor: string | null;
  description: string | null;
  statusLabel: string;
  recordedByName: string;
}

/** One expense category (read-only: GET /admin/expense-categories lists active ones only). */
export interface ExpenseCategoryItem {
  id: string;
  name: string;
}

/**
 * Routes of FinanceFlow (the finance hub and everything reached from it).
 * Daily Cash renders the wallet-cashtopup DailyCashScreen (live BR-74 close).
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

/** Params a FinanceFlow route can carry: ids only, every screen reads its own record. */
export interface FinanceRouteParams {
  /** Order uuid for RevenueDetail. */
  orderId?: string | undefined;
  /** Expense uuid for ExpenseDetail and VoucherDetail. */
  expenseId?: string | undefined;
}
