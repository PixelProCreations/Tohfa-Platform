/**
 * In-module navigator for the warehouse finance screens (design module M11).
 *
 * The finance navigation (hub -> revenue -> revenue detail; hub -> expenses ->
 * add / detail; hub -> categories, vouchers -> voucher detail, history,
 * reports, daily cash) used to be stitched four times: the Sub hub's eleven
 * `show*` flags, the Main hub's twelve, App.tsx's twelve route keys, and the
 * shells' `showFinanceScreen` / `showExpenseRecord` state. It lives here now
 * and takes `scope` + `can`, so every host renders the same flow: App.tsx and
 * the Sub shell with the Sub warehouse scope, the Main shell with
 * MAIN_WAREHOUSE_SCOPE (all warehouses).
 *
 * Every push is checked with the code of the screen it opens
 * (canOpenFinanceRoute); each screen also renders a "not available" state on
 * its own. The server re-checks everything (CLAUDE.md 2.1).
 *
 * Route keys are the old App.tsx keys without the 'SubWarehouse' / 'Warehouse'
 * prefix (FinanceRoute). Daily Cash is the wallet-cashtopup DailyCashScreen
 * (W4i). SubWarehouseExpenseRecord (a duplicate stub with an 'Approve' button;
 * no approve code exists) is ExpenseDetail.
 */
import React, { useEffect, useState } from 'react';
import { useFlowBack } from '../useFlowBack';

import { DailyCashScreen } from '../wallet-cashtopup/DailyCashScreen';
import { ExpenseCategoriesScreen } from './ExpenseCategoriesScreen';
import { ExpenseDetailScreen } from './ExpenseDetailScreen';
import { FINANCE_TODAY, FINANCE_WAREHOUSES } from './fixtures';
import { FINANCE_CODES } from './FinanceParts';
import { FinanceHistoryScreen } from './FinanceHistoryScreen';
import { canOpenFinanceRoute, FinanceHubScreen } from './FinanceHubScreen';
import { FinanceReportsScreen } from './FinanceReportsScreen';
import { RevenueDetailScreen } from './RevenueDetailScreen';
import { revenueDetailOf, RevenueScreen } from './RevenueScreen';
import type {
  ExpenseDraft,
  FinanceRoute,
  FinanceRouteParams,
  PermissionCheck,
  WarehouseScope,
  WarehouseTab,
} from './types';
import { VoucherDetailScreen } from './VoucherDetailScreen';
import { VouchersScreen } from './VouchersScreen';
import { WarehouseAddExpenseScreen } from './WarehouseAddExpenseScreen';
import { WarehouseExpensesScreen } from './WarehouseExpensesScreen';

/** One entry of the flow's back stack. */
export interface FinanceStackEntry {
  screen: FinanceRoute;
  params?: FinanceRouteParams | undefined;
}

export interface FinanceFlowProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  initialScreen?: FinanceRoute | undefined;
  initialParams?: FinanceRouteParams | undefined;
  /** Leave the finance module (pressed back on its first screen). */
  onBack: () => void;
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
  onNavigateToNotifications?: (() => void) | undefined;
  /** Open the wallet module (hub Wallet action, wallet.cash_topup.process). */
  onOpenWallet?: (() => void) | undefined;
  /** Revenue detail 'View Order' (order.list.view_all). */
  onNavigateToCustomerOrders?: (() => void) | undefined;
  /** Revenue detail 'View Invoice' (invoice.view_own). */
  onNavigateToInvoiceList?: (() => void) | undefined;
  /** Warehouses for the Main all-warehouses selectors (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
}

/** The expense the edit form opens with when the detail screen's Edit is used. */
function draftOf(params: FinanceRouteParams): ExpenseDraft | undefined {
  const e = params.expense;
  if (e?.expenseId === undefined) return undefined;
  const method = e.paymentMethod;
  return {
    expenseId: e.expenseId,
    amount: String(e.amount ?? '').replace(/[^0-9.]/g, ''),
    category: e.category ?? '',
    date: e.date ?? '',
    description: e.description ?? '',
    paymentMethod: method === 'UPI' || method === 'Bank' ? method : 'Cash',
    vendorPayee: e.vendorPayee ?? '',
  };
}

export function FinanceFlow({
  scope,
  can,
  initialScreen = 'FinanceHub',
  initialParams,
  onBack,
  onTabChange,
  onNavigateToNotifications,
  onOpenWallet,
  onNavigateToCustomerOrders,
  onNavigateToInvoiceList,
  warehouseOptions = FINANCE_WAREHOUSES,
}: FinanceFlowProps) {
  const [stack, setStack] = useState<FinanceStackEntry[]>(() => [{ screen: initialScreen, params: initialParams }]);

  // A host that re-targets the open module restarts the stack, as the other
  // area flows do. Params are compared by value (hosts build them inline).
  const paramsKey = JSON.stringify(initialParams ?? null);
  useEffect(() => {
    setStack([{ screen: initialScreen, params: initialParams }]);
    // paramsKey stands in for initialParams (compared by value, see above).
  }, [initialScreen, paramsKey]);

  const current = stack[stack.length - 1] ?? { screen: initialScreen, params: initialParams };
  const params: FinanceRouteParams = current.params ?? {};
  const isMain = scope.warehouseId === undefined;

  const navigate = (screen: FinanceRoute, nextParams?: FinanceRouteParams) => {
    if (!canOpenFinanceRoute(can, screen)) return;
    setStack((prev) => [...prev, { screen, params: nextParams }]);
  };
  /** Replace the top entry (save -> detail must not return to the form). */
  const replace = (screen: FinanceRoute, nextParams?: FinanceRouteParams) => {
    setStack((prev) => [...prev.slice(0, -1), { screen, params: nextParams }]);
  };
  const back = () => {
    if (stack.length > 1) setStack((prev) => prev.slice(0, -1));
    else onBack();
  };

  // Hardware back walks the flow's own stack.
  // Always handled: at the root back() hands over to the host through onBack.
  useFlowBack(() => {
    back();
    return true;
  });

  const common = { scope, can, onBack: back, onTabChange };
  const openHistory = () => navigate('FinanceHistory');

  switch (current.screen) {
    case 'FinanceHub':
      return (
        <FinanceHubScreen
          {...common}
          onOpen={(route) => navigate(route)}
          onOpenWallet={onOpenWallet}
          onNavigateToNotifications={onNavigateToNotifications}
        />
      );
    case 'Revenue':
      return (
        <RevenueScreen
          {...common}
          warehouseOptions={warehouseOptions}
          onSelectRevenue={(record) => navigate('RevenueDetail', { revenue: revenueDetailOf(record) })}
        />
      );
    case 'RevenueDetail':
      return (
        <RevenueDetailScreen
          {...common}
          {...params.revenue}
          isShortVersion={params.isShortVersion}
          onViewOrder={onNavigateToCustomerOrders}
          onViewInvoice={onNavigateToInvoiceList}
          onViewTransactionHistory={canOpenFinanceRoute(can, 'FinanceHistory') ? openHistory : undefined}
        />
      );
    case 'Expenses':
      return <WarehouseExpensesScreen {...common} onAddExpense={() => navigate('AddExpense')} />;
    case 'AddExpense':
      return (
        <WarehouseAddExpenseScreen
          {...common}
          initialExpense={params.expenseDraft}
          onSaveSuccess={() =>
            replace('ExpenseDetail', {
              expense: params.expenseDraft
                ? {
                    expenseId: params.expenseDraft.expenseId,
                    amount: params.expenseDraft.amount,
                    category: params.expenseDraft.category,
                    date: params.expenseDraft.date,
                    description: params.expenseDraft.description,
                    paymentMethod: params.expenseDraft.paymentMethod,
                    vendorPayee: params.expenseDraft.vendorPayee,
                    status: 'Recorded',
                  }
                : undefined,
            })
          }
        />
      );
    case 'ExpenseDetail':
      return (
        <ExpenseDetailScreen
          {...common}
          {...params.expense}
          isShortVersion={params.isShortVersion}
          isReceiptView={params.isReceiptView}
          onEdit={
            can(FINANCE_CODES.expenseLog) ? () => navigate('AddExpense', { expenseDraft: draftOf(params) }) : undefined
          }
          onViewReceipt={() => navigate('ExpenseDetail', { ...params, isReceiptView: true })}
          onViewVouchers={canOpenFinanceRoute(can, 'Vouchers') ? () => navigate('Vouchers') : undefined}
        />
      );
    case 'ExpenseCategories':
      return <ExpenseCategoriesScreen {...common} />;
    case 'Vouchers':
      return (
        <VouchersScreen
          {...common}
          warehouseOptions={warehouseOptions}
          onSelectVoucher={(voucher) => navigate('VoucherDetail', { voucher })}
        />
      );
    case 'VoucherDetail':
      return <VoucherDetailScreen {...common} voucher={params.voucher} />;
    case 'FinanceHistory':
      return (
        <FinanceHistoryScreen
          {...common}
          onSelectItem={(item) => {
            // Main opened history rows in the compact layout (ported isShortVersion).
            if (item.type === 'Revenue') {
              navigate('RevenueDetail', {
                isShortVersion: isMain,
                revenue: {
                  revenueId: item.id,
                  finalAmount: item.amount.toLocaleString('en-IN'),
                  salesChannel: item.title,
                  transactionDate: item.time,
                },
              });
            } else {
              navigate('ExpenseDetail', {
                isShortVersion: isMain,
                expense: { expenseId: item.id, amount: item.amount, category: item.title, date: item.time },
              });
            }
          }}
        />
      );
    case 'FinanceReports':
      return (
        <FinanceReportsScreen
          {...common}
          // report.export.file is `view` (read-only) for MAIN_WH_ADMIN and `own`
          // for SUB_WH_ADMIN; /auth/me drops the grant scope, so the Main view
          // keeps Generate/Export off explicitly (SPEC_GAPS section 1 #11).
          canExport={isMain ? false : undefined}
          onNavigateToCustomerOrders={onNavigateToCustomerOrders}
          onNavigateToInvoiceList={onNavigateToInvoiceList}
          onNavigateToHistory={openHistory}
        />
      );
    case 'DailyCash':
      return <DailyCashScreen {...common} date={FINANCE_TODAY} warehouseOptions={warehouseOptions} />;
    default:
      return null;
  }
}
