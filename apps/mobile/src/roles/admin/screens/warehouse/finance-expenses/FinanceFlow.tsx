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
 *
 * Route params are ids only (FinanceRouteParams): each screen reads its own
 * record from the API, so a stale or hand-built param can never show figures
 * the server did not send. There is no warehouse list prop: a Main-admin
 * screen that needs a warehouse fetches the live list itself
 * (useFinanceWarehousePicker in ./FinanceParts.tsx).
 */
import React, { useEffect, useState } from 'react';
import { useFlowBack } from '../useFlowBack';

import { DailyCashScreen } from '../wallet-cashtopup/DailyCashScreen';
import { ExpenseCategoriesScreen } from './ExpenseCategoriesScreen';
import { ExpenseDetailScreen } from './ExpenseDetailScreen';
import { canOpenFinanceRoute } from './FinanceParts';
import { FinanceHistoryScreen } from './FinanceHistoryScreen';
import { FinanceHubScreen } from './FinanceHubScreen';
import { FinanceReportsScreen } from './FinanceReportsScreen';
import { RevenueDetailScreen } from './RevenueDetailScreen';
import { RevenueScreen } from './RevenueScreen';
import type { FinanceRoute, FinanceRouteParams, PermissionCheck, WarehouseScope, WarehouseTab } from './types';
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
  /** Ids only (orderId / expenseId); every screen reads its own record from the API. */
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
  const openVoucher = (expenseId: string) => navigate('VoucherDetail', { expenseId });

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
      return <RevenueScreen {...common} onSelectRevenue={(orderId) => navigate('RevenueDetail', { orderId })} />;
    case 'RevenueDetail':
      return (
        <RevenueDetailScreen
          {...common}
          orderId={params.orderId}
          onViewOrder={onNavigateToCustomerOrders}
          onViewInvoice={onNavigateToInvoiceList}
          onViewTransactionHistory={canOpenFinanceRoute(can, 'FinanceHistory') ? openHistory : undefined}
        />
      );
    case 'Expenses':
      return (
        <WarehouseExpensesScreen
          {...common}
          onAddExpense={() => navigate('AddExpense')}
          onSelectExpense={(expenseId) => navigate('ExpenseDetail', { expenseId })}
        />
      );
    case 'AddExpense':
      // There is no PATCH /admin/expenses/{id}: the form only records (BR-62).
      return <WarehouseAddExpenseScreen {...common} onSaveSuccess={(expenseId) => replace('ExpenseDetail', { expenseId })} />;
    case 'ExpenseDetail':
      return (
        <ExpenseDetailScreen
          {...common}
          expenseId={params.expenseId}
          onViewVoucher={canOpenFinanceRoute(can, 'VoucherDetail') ? openVoucher : undefined}
        />
      );
    case 'ExpenseCategories':
      return <ExpenseCategoriesScreen {...common} />;
    case 'Vouchers':
      return <VouchersScreen {...common} onSelectVoucher={openVoucher} />;
    case 'VoucherDetail':
      return <VoucherDetailScreen {...common} expenseId={params.expenseId} />;
    case 'FinanceHistory':
      return (
        <FinanceHistoryScreen
          {...common}
          onSelectItem={(row) =>
            row.kind === 'revenue'
              ? navigate('RevenueDetail', { orderId: row.id })
              : navigate('ExpenseDetail', { expenseId: row.id })
          }
        />
      );
    case 'FinanceReports':
      return <FinanceReportsScreen {...common} onNavigateToHistory={openHistory} />;
    case 'DailyCash':
      return <DailyCashScreen scope={scope} can={can} onBack={back} onTabChange={onTabChange} />;
    default:
      return null;
  }
}
