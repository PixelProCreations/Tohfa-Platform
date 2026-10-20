/**
 * In-module navigator for the wallet & cash top-up screens (design module M8,
 * plus the M11-S08 daily cash ledger).
 *
 * Flows: hub -> Find Customer -> Customer Wallet -> cash top-up -> fiscal tag
 * -> confirm -> success -> Transaction Detail; hub -> Daily Cash Summary ->
 * Daily Cash; hub -> Top-Up History -> details; hub -> Needs Attention (sample
 * screens, see below). They take `scope` + `can`, so every host renders the same flow:
 * the Sub shell / App.tsx with the Sub warehouse scope, the Main shell with
 * MAIN_WAREHOUSE_SCOPE (all warehouses).
 *
 * Route keys are the old App.tsx keys without the 'SubWarehouse' / 'Warehouse'
 * prefix (WalletRoute). TransactionDetail is TopUpDetailsScreen (live ledger
 * rows only).
 *
 * Everything here is live except the two sample screens named at the end:
 *  - Customer Wallet needs the customer uuid (from the live customer screens or
 *    the lookup): GET /admin/customers/{id}/wallet[/transactions] (read-only,
 *    BR-93). Opened without one, it starts at the counter lookup.
 *  - The cash top-up wizard: 'CashTopUp' with a customer uuid opens the amount
 *    step; without one it opens the counter lookup first
 *    (GET /admin/wallets/cash-topup/customers/lookup, wallet.cash_topup.process,
 *    BR-91i). Confirm posts through useCashTopupSubmit, held here so the
 *    Idempotency-Key survives going back a step (root CLAUDE.md 2.4); success
 *    shows the server's ledger row (BR-18).
 *  - The Main admin's collecting-warehouse picker is GET /warehouses
 *    (useWarehouseOptions, warehouse.all.view), uuids only; a Sub admin never
 *    gets a picker: it collects at scope.warehouseId (BR-30).
 *
 * Sample screens (no backend): Top-Up History and Wallet Needs Attention. No
 * endpoint lists cash top-up rows or feeds wallet issues, and by the owner
 * decision of 2026-10-14 nothing is hidden for having no server API, so both
 * stay reachable from the hub and show their sample rows (fixtures.ts) until an
 * API exists. A history row opens the live Transaction Detail view with the
 * sample row's fields ('TopUpDetails' route; the old sectioned variant is not
 * restored). The hub's numbers are GET /admin/reports/cash-topups.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useFlowBack } from '../useFlowBack';

import { t } from '../../../i18n';
import { customerIdParam, toWalletScreenTransaction } from '../customers/mappers';
import { useCustomerWallet, useCustomerWalletTxns } from '../customers/useCustomersData';
import { CashTopUpScreen } from './CashTopUpScreen';
import { ConfirmCashTopUpScreen } from './ConfirmCashTopUpScreen';
import { CustomerLookupScreen } from './CustomerLookupScreen';
import { CustomerWalletScreen } from './CustomerWalletScreen';
import { DailyCashScreen } from './DailyCashScreen';
import { DailyCashSummaryScreen } from './DailyCashSummaryScreen';
import { FiscalTagScreen } from './FiscalTagScreen';
import {
  buildCashTopupBody,
  cashTopupErrorKey,
  customerLookupView,
  isTopUpOutcomeUnknown,
  toTopUpReceipt,
  topUpCustomerFromWallet,
  walletCustomerOf,
  type TopUpCustomer,
} from './mappers';
import { TopUpDetailsScreen } from './TopUpDetailsScreen';
import { TopUpHistoryScreen } from './TopUpHistoryScreen';
import { TopUpSuccessScreen } from './TopUpSuccessScreen';
import { useCashTopupSubmit, useCustomerLookup, useWalletWarehouseScopes, type LiveCashTopupSubmit } from './useWalletData';
import type {
  CashTopUpDraft,
  PermissionCheck,
  ResolvedWalletCustomer,
  WalletCustomer,
  WalletRoute,
  WalletRouteParams,
  WalletTransactionRecord,
  WarehouseScope,
  WarehouseTab,
} from './types';
import { WalletAttentionScreen } from './WalletAttentionScreen';
import { WalletOperationsScreen } from './WalletOperationsScreen';
import { EmptyState, WalletScreen } from './WalletParts';

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
}

/** The cash top-up wizard steps; finishing it drops them from the back stack. */
const WIZARD: readonly WalletRoute[] = ['CashTopUp', 'FiscalTag', 'ConfirmCashTopUp'];

/**
 * How long the lookup waits after the last keystroke before it asks the
 * server. A typing debounce for the request, not a business threshold.
 */
const LOOKUP_DEBOUNCE_MS = 300;

/** Initial params for a host that opens the flow on a customer's wallet or cash top-up. */
export function walletParamsForCustomer(customer?: {
  name?: string | undefined;
  code?: string | undefined;
  id?: string | undefined;
  mobileMasked?: string | undefined;
  phone?: string | undefined;
  walletBalance?: string | undefined;
}): WalletRouteParams {
  if (customer === undefined) return {};
  // `id` is the customer uuid on the live customer screens; the wallet shows the code.
  const customerUuid = customerIdParam(customer.id);
  return {
    customer: {
      name: customer.name,
      id: customer.code ?? (customerUuid === undefined ? customer.id : undefined),
      mobile: customer.mobileMasked ?? customer.phone,
      balance: customer.walletBalance,
      customerUuid,
    },
  };
}

interface LiveCustomerWalletRouteProps {
  base: { scope: WarehouseScope; can: PermissionCheck; onBack: () => void; onTabChange?: ((tab: WarehouseTab) => void) | undefined };
  customer: WalletCustomer;
  customerUuid: string;
  onCashTopUp: (customer: ResolvedWalletCustomer) => void;
  onOpenTransaction: (transaction: WalletTransactionRecord) => void;
}

/** Customer Wallet on the live summary and ledger (read-only, BR-93). */
function LiveCustomerWalletRoute({ base, customer, customerUuid, onCashTopUp, onOpenTransaction }: LiveCustomerWalletRouteProps) {
  const warehouseId = base.scope.warehouseId;
  const summary = useCustomerWallet(warehouseId, customerUuid);
  const txns = useCustomerWalletTxns(warehouseId, customerUuid);
  const transactions = useMemo(() => txns.items.map(toWalletScreenTransaction), [txns.items]);
  const refresh = () => {
    summary.refresh();
    txns.refresh();
  };
  return (
    <CustomerWalletScreen
      {...base}
      customer={customer}
      transactions={transactions}
      live={{
        wallet: summary.wallet,
        isLoading: summary.isLoading,
        error: summary.error,
        transactionsLoading: txns.isLoading,
        transactionsError: txns.error,
        onRetry: refresh,
        onRefresh: refresh,
        isRefreshing: summary.isRefreshing || txns.isRefreshing,
        onLoadMore: txns.loadMore,
        hasMore: txns.hasMore,
      }}
      onCashTopUp={onCashTopUp}
      onOpenTransaction={onOpenTransaction}
    />
  );
}

type BaseRouteProps = LiveCustomerWalletRouteProps['base'];

/** The counter lookup (Find Customer, live): picks the customer for the wallet or a top-up. */
function LiveCustomerLookupRoute({ base, onSelect }: { base: BaseRouteProps; onSelect: (customer: TopUpCustomer) => void }) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), LOOKUP_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);
  const lookup = useCustomerLookup(base.scope.warehouseId, debounced);
  const view = customerLookupView({
    hasQuery: lookup.hasQuery,
    isLoading: lookup.isLoading,
    error: lookup.error,
    itemCount: lookup.customers.length,
  });
  return (
    <CustomerLookupScreen
      {...base}
      query={query}
      onQueryChange={setQuery}
      customers={lookup.customers}
      view={view}
      error={lookup.error}
      onRetry={lookup.refresh}
      onSelect={onSelect}
    />
  );
}

/** Amount step for a live customer; the current balance is the live wallet read (preview only). */
function LiveCashTopUpRoute({
  base,
  customer,
  draft,
  onContinue,
}: {
  base: BaseRouteProps;
  customer: TopUpCustomer;
  draft: CashTopUpDraft | undefined;
  onContinue: (draft: CashTopUpDraft) => void;
}) {
  const wallet = useCustomerWallet(base.scope.warehouseId, customer.customerUuid);
  const warehouseOptions = useWalletWarehouseScopes(base.scope, base.can);
  const currentBalancePaise = wallet.wallet?.balancePaise ?? customer.balancePaise;
  return (
    <CashTopUpScreen
      {...base}
      customer={customer}
      currentBalancePaise={currentBalancePaise}
      draft={draft !== undefined && draft.customer.customerUuid === customer.customerUuid ? draft : undefined}
      warehouseOptions={warehouseOptions}
      onContinue={onContinue}
    />
  );
}

/** Confirm: posts the top-up and maps its failure (cashTopupErrorKey: 409 / timeout = check the wallet first). */
function LiveConfirmRoute({
  base,
  draft,
  submit,
  onSuccess,
  onCheckWallet,
}: {
  base: BaseRouteProps;
  draft: CashTopUpDraft & { fiscalCashTag: string };
  submit: LiveCashTopupSubmit;
  onSuccess: (transaction: WalletTransactionRecord) => void;
  onCheckWallet: () => void;
}) {
  const failed = submit.error !== null && submit.error !== undefined;
  const body = buildCashTopupBody({ amountPaise: draft.amountPaise, fiscalCashTag: draft.fiscalCashTag, warehouseId: draft.warehouseId });
  return (
    <ConfirmCashTopUpScreen
      {...base}
      draft={draft}
      isSubmitting={submit.isPending}
      errorKey={failed ? cashTopupErrorKey(submit.error) : null}
      outcomeUnknown={failed && isTopUpOutcomeUnknown(submit.error)}
      onCheckWallet={onCheckWallet}
      onConfirm={() =>
        submit.submit({ customerId: draft.customer.customerUuid, body }, (row) => {
          submit.finish();
          onSuccess(toTopUpReceipt(row, draft.customer, draft.warehouseName));
        })
      }
    />
  );
}

/** A wizard step opened without its draft (an old deep link): nothing to show but the way back. */
function StartAgain({ base }: { base: BaseRouteProps }) {
  return (
    <WalletScreen title={t('wallet.topup.title')} onBack={base.onBack}>
      <EmptyState title={t('wallet.topup.startAgain')} />
    </WalletScreen>
  );
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
}: WalletFlowProps) {
  const [stack, setStack] = useState<WalletStackEntry[]>(() => [{ screen: initialScreen, params: initialParams }]);
  // The top-up write and its Idempotency-Key live as long as the flow (see useCashTopupSubmit).
  const topUp = useCashTopupSubmit();

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
  /**
   * Next wizard step, keeping the draft on the current entry too, so back
   * re-opens the step with what was typed (and the same body keeps its key).
   */
  const advance = (screen: WalletRoute, nextParams: WalletRouteParams) => {
    topUp.reset();
    setStack((prev) => {
      const last = prev[prev.length - 1];
      const kept = last === undefined ? [] : [{ ...last, params: { ...last.params, draft: nextParams.draft } }];
      return [...prev.slice(0, -1), ...kept, { screen, params: nextParams }];
    });
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
  // Always handled: at the root back() hands over to the host through onBack.
  useFlowBack(() => {
    back();
    return true;
  });

  const common = { scope, can, onBack: back, onTabChange };
  const startTopUp = (customer?: WalletCustomer) => navigate('CashTopUp', { customer: customer ?? params.customer });
  /** Daily Cash Summary is the cash close's screen (BR-74): only with its code; the server re-checks. */
  const canDailyCash = can('finance.cash_close.manage');
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
          onNavigateToDailySummary={canDailyCash ? () => navigate('DailyCashSummary') : undefined}
          onNavigateToTopUpHistory={() => navigate('TopUpHistory')}
          onNavigateToAttention={(category) => navigate('WalletAttention', { category })}
        />
      );
    case 'CustomerSearch':
      return <LiveCustomerLookupRoute base={common} onSelect={(c) => navigate('CustomerWallet', { customer: walletCustomerOf(c) })} />;
    case 'CustomerWallet': {
      const customerUuid = customerIdParam(params.customer?.customerUuid);
      if (customerUuid !== undefined && params.customer !== undefined) {
        return (
          <LiveCustomerWalletRoute
            base={common}
            customer={params.customer}
            customerUuid={customerUuid}
            onCashTopUp={(customer) => startTopUp(customer)}
            onOpenTransaction={(transaction) => navigate('TransactionDetail', { transaction })}
          />
        );
      }
      // No live customer (no uuid): find one first; there is no sample wallet.
      return (
        <LiveCustomerLookupRoute
          base={common}
          onSelect={(c) => navigate('CustomerWallet', { customer: walletCustomerOf(c) })}
        />
      );
    }
    case 'CashTopUp': {
      // A top-up needs a live customer (uuid); without one it starts at the counter lookup.
      const customer = topUpCustomerFromWallet(params.customer);
      if (customer === null) {
        return <LiveCustomerLookupRoute base={common} onSelect={(c) => navigate('CashTopUp', { customer: walletCustomerOf(c) })} />;
      }
      return (
        <LiveCashTopUpRoute
          base={common}
          customer={customer}
          draft={params.draft}
          onContinue={(draft) => advance('FiscalTag', { draft, customer: params.customer })}
        />
      );
    }
    case 'FiscalTag':
      if (params.draft === undefined) return <StartAgain base={common} />;
      return (
        <FiscalTagScreen
          {...common}
          draft={params.draft}
          onReviewTopUp={(draft) => advance('ConfirmCashTopUp', { draft, customer: params.customer })}
        />
      );
    case 'ConfirmCashTopUp': {
      const draft = params.draft;
      if (draft?.fiscalCashTag === undefined) return <StartAgain base={common} />;
      return (
        <LiveConfirmRoute
          base={common}
          draft={{ ...draft, fiscalCashTag: draft.fiscalCashTag }}
          submit={topUp}
          onSuccess={(transaction) => finishWizard('TopUpSuccess', { customer: params.customer, transaction })}
          onCheckWallet={() => navigate('CustomerWallet', { customer: walletCustomerOf(draft.customer) })}
        />
      );
    }
    case 'TopUpSuccess':
      return (
        <TopUpSuccessScreen
          {...common}
          transaction={params.transaction}
          onDone={done}
          // The server's ledger row: the live Transaction Detail shows only what it sent.
          onViewTransaction={(transaction) => navigate('TransactionDetail', { transaction })}
        />
      );
    case 'TopUpDetails':
      return <TopUpDetailsScreen {...common} transaction={params.transaction} />;
    case 'TransactionDetail':
      return <TopUpDetailsScreen {...common} transaction={params.transaction} />;
    case 'TopUpHistory':
      return <TopUpHistoryScreen {...common} onSelectTransaction={openTopUpDetails} />;
    case 'DailyCashSummary':
      // The finance area owns these two screens (live BR-74 close); they pick their own warehouse.
      return <DailyCashSummaryScreen {...common} onNavigateToDailyCash={() => navigate('DailyCash')} />;
    case 'DailyCash':
      return <DailyCashScreen {...common} />;
    case 'WalletAttention':
      return (
        <WalletAttentionScreen
          {...common}
          initialCategory={params.category}
          onRetryTopUp={() => startTopUp()}
          onOpenDailyCash={canDailyCash ? () => navigate('DailyCashSummary') : undefined}
          onReviewTransaction={openTopUpDetails}
        />
      );
    default:
      return null;
  }
}
