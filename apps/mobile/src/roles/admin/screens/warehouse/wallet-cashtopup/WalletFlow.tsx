/**
 * In-module navigator for the wallet & cash top-up screens (design module M8,
 * plus the M11-S08 daily cash ledger).
 *
 * The wallet flows (hub -> customer search -> wallet -> cash top-up -> fiscal
 * tag -> confirm -> success -> details; hub -> history -> details; hub ->
 * needs attention; hub -> daily summary -> daily cash) used to be stitched
 * four times: the W2b hub's own sub-screen state machine, twelve App.tsx route
 * keys, `show*` state in the Sub shell, and nested screens (Confirm drew
 * Success and Details itself, History drew Details, Customer Wallet drew
 * Transaction Detail). They live here now and take `scope` + `can`, so every
 * host renders the same flow: the Sub shell / App.tsx with the Sub warehouse
 * scope, the Main shell with MAIN_WAREHOUSE_SCOPE (all warehouses).
 *
 * Route keys are the old App.tsx keys without the 'SubWarehouse' / 'Warehouse'
 * prefix (WalletRoute). TransactionDetail is TopUpDetailsScreen's
 * 'transaction' variant (SubWarehouseTransactionDetailScreen was absorbed).
 */
import React, { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';

import { CustomerSearchScreen } from '../customers/CustomerSearchScreen';
import { CashTopUpScreen } from './CashTopUpScreen';
import { ConfirmCashTopUpScreen } from './ConfirmCashTopUpScreen';
import { CustomerWalletScreen } from './CustomerWalletScreen';
import { DailyCashScreen } from './DailyCashScreen';
import { DailyCashSummaryScreen } from './DailyCashSummaryScreen';
import { FiscalTagScreen } from './FiscalTagScreen';
import { SAMPLE_TRANSACTION_ID, WALLET_WAREHOUSES } from './fixtures';
import { TopUpDetailsScreen } from './TopUpDetailsScreen';
import { TopUpHistoryScreen } from './TopUpHistoryScreen';
import { TopUpSuccessScreen } from './TopUpSuccessScreen';
import type {
  CashTopUpDraft,
  PermissionCheck,
  WalletCustomer,
  WalletRoute,
  WalletRouteParams,
  WalletTransactionRecord,
  WarehouseScope,
  WarehouseTab,
} from './types';
import { WalletAttentionScreen } from './WalletAttentionScreen';
import { WalletOperationsScreen } from './WalletOperationsScreen';
import { formatRupees } from './WalletParts';

/** One entry of the flow's back stack. */
export interface WalletStackEntry {
  screen: WalletRoute;
  params?: WalletRouteParams | undefined;
}

export interface WalletFlowProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  initialScreen?: WalletRoute | undefined;
  initialParams?: WalletRouteParams | undefined;
  /** Leave the wallet module (pressed back on its first screen). */
  onBack: () => void;
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
  onNavigateToNotifications?: (() => void) | undefined;
  onNavigateToProfile?: (() => void) | undefined;
  /** Warehouses for the Main all-warehouses selectors (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
}

/** The cash top-up wizard steps; finishing it drops them from the back stack. */
const WIZARD: readonly WalletRoute[] = ['CashTopUp', 'FiscalTag', 'ConfirmCashTopUp'];

/** A customer-search row as a wallet customer. */
function fromSearch(c: { name: string; code: string; phone?: string | undefined; balance?: string | undefined }): WalletCustomer {
  const balance = c.balance === undefined ? undefined : c.balance.includes('.') ? c.balance : `${c.balance}.00`;
  return { name: c.name, id: c.code, mobile: c.phone, balance };
}

/** Initial params for a host that opens the flow on a customer's wallet or cash top-up. */
export function walletParamsForCustomer(customer?: {
  name?: string | undefined;
  code?: string | undefined;
  id?: string | undefined;
  phone?: string | undefined;
  walletBalance?: string | undefined;
}): WalletRouteParams {
  if (customer === undefined) return {};
  return {
    customer: {
      name: customer.name,
      id: customer.code ?? customer.id,
      mobile: customer.phone,
      balance: customer.walletBalance,
    },
  };
}

export function WalletFlow({
  scope,
  can,
  initialScreen = 'WalletOperations',
  initialParams,
  onBack,
  onTabChange,
  onNavigateToNotifications,
  onNavigateToProfile,
  warehouseOptions = WALLET_WAREHOUSES,
}: WalletFlowProps) {
  const [stack, setStack] = useState<WalletStackEntry[]>(() => [{ screen: initialScreen, params: initialParams }]);

  // A host that re-targets the open module restarts the stack, as the other
  // area flows do. Params are compared by value: hosts that build them inline
  // (renderExternalScreen) would otherwise restart the flow on every render.
  const paramsKey = JSON.stringify(initialParams ?? null);
  useEffect(() => {
    setStack([{ screen: initialScreen, params: initialParams }]);
    // paramsKey stands in for initialParams (compared by value, see above).
  }, [initialScreen, paramsKey]);

  const current = stack[stack.length - 1] ?? { screen: initialScreen, params: initialParams };
  const params: WalletRouteParams = current.params ?? {};

  const navigate = (screen: WalletRoute, nextParams?: WalletRouteParams) => {
    // The cash top-up wizard is only entered with the codes it needs (BR-18);
    // CashTopUpScreen also renders a not-available state on its own.
    if (screen === 'CashTopUp' && !can('wallet.cash_topup.process')) return;
    setStack((prev) => [...prev, { screen, params: nextParams }]);
  };
  const back = () => {
    if (stack.length > 1) setStack((prev) => prev.slice(0, -1));
    else onBack();
  };
  /** Leave the wizard: back from Top-Up Successful must not re-open Confirm. */
  const finishWizard = (screen: WalletRoute, nextParams: WalletRouteParams) => {
    setStack((prev) => [...prev.filter((entry) => !WIZARD.includes(entry.screen)), { screen, params: nextParams }]);
  };
  /** Done on the success screen: back to where the wizard was entered from. */
  const done = () => {
    const remaining = stack.filter((entry) => !WIZARD.includes(entry.screen) && entry.screen !== 'TopUpSuccess');
    if (remaining.length === 0) onBack();
    else setStack(remaining);
  };

  // Hardware back walks the flow's own stack (the W2b hub did this for its sub-screens).
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      back();
      return true;
    });
    return () => sub.remove();
  });

  const common = { scope, can, onBack: back, onTabChange };
  const startTopUp = (customer?: WalletCustomer) => navigate('CashTopUp', { customer: customer ?? params.customer });
  const openTopUpDetails = (transaction: WalletTransactionRecord) => navigate('TopUpDetails', { transaction });

  switch (current.screen) {
    case 'WalletOperations':
      return (
        <WalletOperationsScreen
          {...common}
          onNavigateToNotifications={onNavigateToNotifications}
          onNavigateToProfile={onNavigateToProfile}
          onNavigateToCashTopUp={() => startTopUp()}
          onNavigateToCustomerSearch={() => navigate('CustomerSearch')}
          onNavigateToTopUpHistory={() => navigate('TopUpHistory')}
          onNavigateToDailySummary={() => navigate('DailyCashSummary')}
          onNavigateToAttention={(category) => navigate('WalletAttention', { category })}
          onOpenCustomerWallet={(customer) => navigate('CustomerWallet', { customer })}
        />
      );
    case 'CustomerSearch':
      return (
        <CustomerSearchScreen
          {...common}
          onNavigateToWallet={(c) => navigate('CustomerWallet', { customer: fromSearch(c) })}
          onNavigateToCashTopUp={(c) => startTopUp(c ? fromSearch(c) : undefined)}
        />
      );
    case 'CustomerWallet':
      return (
        <CustomerWalletScreen
          {...common}
          customer={params.customer}
          onCashTopUp={(customer) => startTopUp(customer)}
          onOpenTransaction={(transaction) => navigate('TransactionDetail', { transaction })}
        />
      );
    case 'CashTopUp':
      return (
        <CashTopUpScreen
          {...common}
          customer={params.customer}
          warehouseOptions={warehouseOptions}
          onContinue={(draft: CashTopUpDraft) => navigate('FiscalTag', { draft, customer: params.customer })}
        />
      );
    case 'FiscalTag':
      return (
        <FiscalTagScreen
          {...common}
          draft={params.draft}
          onReviewTopUp={(draft) => navigate('ConfirmCashTopUp', { draft, customer: params.customer })}
        />
      );
    case 'ConfirmCashTopUp':
      return (
        <ConfirmCashTopUpScreen
          {...common}
          draft={params.draft}
          onConfirmed={(draft) =>
            finishWizard('TopUpSuccess', {
              customer: params.customer,
              transaction: {
                transactionId: SAMPLE_TRANSACTION_ID,
                type: 'Cash Top-Up',
                status: 'Completed',
                customerName: draft.customerName,
                customerId: draft.customerCode,
                amount: formatRupees(draft.topUpAmount, true),
                previousBalance: formatRupees(draft.currentBalance, true),
                newBalance: formatRupees(draft.currentBalance + draft.topUpAmount, true),
                fiscalCashTag: draft.fiscalCashTag,
                dateTime: `${draft.dateStr ?? ''}, ${draft.timeStr ?? ''}`,
                createdAt: `${draft.dateStr ?? ''}, ${draft.timeStr ?? ''}`,
                processedBy: draft.processedBy,
                warehouseId: draft.warehouseId,
                warehouseName: draft.warehouseName,
              },
            })
          }
        />
      );
    case 'TopUpSuccess':
      return (
        <TopUpSuccessScreen
          {...common}
          transaction={params.transaction}
          onDone={done}
          onViewTransaction={openTopUpDetails}
        />
      );
    case 'TopUpDetails':
      return <TopUpDetailsScreen {...common} transaction={params.transaction} variant="topUp" />;
    case 'TransactionDetail':
      return <TopUpDetailsScreen {...common} transaction={params.transaction} variant="transaction" />;
    case 'TopUpHistory':
      return <TopUpHistoryScreen {...common} warehouseOptions={warehouseOptions} onSelectTransaction={openTopUpDetails} />;
    case 'DailyCashSummary':
      return (
        <DailyCashSummaryScreen
          {...common}
          onViewTopUpHistory={() => navigate('TopUpHistory')}
          onNavigateToDailyCash={() => navigate('DailyCash')}
        />
      );
    case 'DailyCash':
      return <DailyCashScreen {...common} warehouseOptions={warehouseOptions} />;
    case 'WalletAttention':
      return (
        <WalletAttentionScreen
          {...common}
          initialCategory={params.category}
          onRetryTopUp={() => startTopUp()}
          onOpenDailyCash={() => navigate('DailyCashSummary')}
          onReviewTransaction={openTopUpDetails}
        />
      );
    default:
      return null;
  }
}
