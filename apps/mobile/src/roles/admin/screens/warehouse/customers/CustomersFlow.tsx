/**
 * In-module navigator for the warehouse customer screens (design module M7).
 *
 * The customer flows (list -> details -> orders / purchases / issues /
 * support -> detail) used to be stitched three times: eleven `show*` state
 * branches in the Sub shell, fifteen App.tsx route keys, and six `whSubView`
 * values in the Main shell (onto the separate Main twins). They live next to
 * the screens now and take `scope` + `can`, so every host renders the same
 * flow: the Sub shell / App.tsx with the Sub warehouse scope, the Main shell
 * with MAIN_WAREHOUSE_SCOPE (all warehouses).
 *
 * Route keys are the old App.tsx keys without the 'SubWarehouse' prefix
 * (CustomersRoute). Removed: CustomerActions (dropped, SPEC_GAPS W4h-1).
 *
 * Data is live and owned here (API integration plan, phase 6): each route's
 * container fetches through ./useCustomersData.ts and passes the result to
 * the screen. No customers route takes a warehouse; the server scopes an
 * `own` actor (BR-91), and the scope's warehouse only keys the cache (BR-30).
 * A customer route needs the customer uuid (customerIdParam); a host still
 * passing a CUS- code or a name gets "not found", not a request. The list's
 * search is the server's `q`; 'CustomerSearch' opens the same live list (the
 * old sample search stays the wallet area's until plan phase 9).
 *
 * The order and purchase filter routes still render for old deep links, but
 * nothing opens them from a live screen: the API cannot filter by any of
 * their fields, so applying them only returns.
 *
 * Screens outside the customer area (wallet, cash top-up, new sale, order
 * detail, RMA) are opened through the host: a shell that can draw them inline
 * passes `renderExternalScreen` (they join this flow's back stack); App.tsx,
 * and the Main shell for New Sale, pass `onOpenExternal` and navigate to their
 * own route. 'OrderDetail' carries the order uuid (`orderId`).
 */
import React, { useEffect, useState } from 'react';
import { t } from '../../../i18n';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { useFlowBack } from '../useFlowBack';

import { CustomerDetailsScreen, type CustomerPreviewTab } from './CustomerDetailsScreen';
import { CustomerIssueDetailScreen } from './CustomerIssueDetailScreen';
import { CustomerIssuesScreen } from './CustomerIssuesScreen';
import { CustomerOrdersScreen } from './CustomerOrdersScreen';
import { CustomersListScreen } from './CustomersListScreen';
import { RecentCard, StatusBadge } from './CustomersParts';
import { CustomerSupportDetailScreen } from './CustomerSupportDetailScreen';
import { customerIdParam, customerSearchQuery, uuidParam } from './mappers';
import { OrderFiltersScreen } from './OrderFiltersScreen';
import { PurchaseHistoryScreen } from './PurchaseHistoryScreen';
import { SupportHistoryScreen } from './SupportHistoryScreen';
import type {
  CustomerRef,
  CustomersExternalRoute,
  CustomersRoute,
  CustomersRouteParams,
  PermissionCheck,
  WarehouseScope,
  WarehouseScreenBaseProps,
  WarehouseTab,
} from './types';
import {
  useCustomer,
  useCustomerIssues,
  useCustomerList,
  useCustomerOrders,
  useCustomerPurchases,
  useCustomerSupportTicket,
  useCustomerSupportTickets,
} from './useCustomersData';

const EXTERNAL_ROUTES: readonly CustomersExternalRoute[] = [
  'CustomerWallet',
  'CashTopUp',
  'NewSale',
  'OrderDetail',
  'RmaDetail',
];

/**
 * How long the list waits after the last keystroke before it sends `q`. A
 * typing debounce for the request, not a business threshold.
 */
const SEARCH_DEBOUNCE_MS = 300;

function isExternal(screen: CustomersRoute | CustomersExternalRoute): screen is CustomersExternalRoute {
  return (EXTERNAL_ROUTES as readonly string[]).includes(screen);
}

/** One entry of the flow's back stack. */
export interface CustomersStackEntry {
  screen: CustomersRoute | CustomersExternalRoute;
  params?: CustomersRouteParams | undefined;
}

/** Navigation handle given to `renderExternalScreen`. */
export interface CustomersFlowNavigation {
  back: () => void;
  /** Push another external screen (e.g. wallet -> cash top-up) onto the flow's stack. */
  open: (screen: CustomersExternalRoute, params?: CustomersRouteParams) => void;
}

export interface CustomersFlowProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  initialScreen?: CustomersRoute | undefined;
  initialParams?: CustomersRouteParams | undefined;
  /** Leave the customer module (pressed back on its first screen). */
  onBack: () => void;
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
  /** Bell on the customers list. */
  onNavigateToNotifications?: (() => void) | undefined;
  /** Warehouses for the (deep-link only) filter screens' Main selector. */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  /** Draw an external screen inside the flow; return null for routes the host does not own. */
  renderExternalScreen?:
    | ((screen: CustomersExternalRoute, params: CustomersRouteParams, nav: CustomersFlowNavigation) => React.ReactNode)
    | undefined;
  /**
   * External routes `renderExternalScreen` draws inline. Defaults to all of
   * them when `renderExternalScreen` is given; the rest go to `onOpenExternal`.
   */
  inlineExternalRoutes?: readonly CustomersExternalRoute[] | undefined;
  /** Navigate the host to an external screen that is not drawn inline. */
  onOpenExternal?: ((screen: CustomersExternalRoute, params: CustomersRouteParams) => void) | undefined;
}

type Navigate = (screen: CustomersRoute | CustomersExternalRoute, params?: CustomersRouteParams) => void;

/** What the flow hands every live route. */
interface LiveRouteProps {
  base: WarehouseScreenBaseProps;
  /** Keys the cache only; no customers request sends it (BR-30, BR-91). */
  warehouseId: string | undefined;
  customer: CustomerRef | undefined;
  /** The customer uuid, or undefined when the route carried none. */
  customerId: string | undefined;
  params: CustomersRouteParams;
  navigate: Navigate;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

function LiveListRoute({
  base,
  warehouseId,
  navigate,
  onNavigateToNotifications,
}: LiveRouteProps & { onNavigateToNotifications?: (() => void) | undefined }) {
  const [searchText, setSearchText] = useState('');
  const [q, setQ] = useState<string | undefined>(undefined);
  useEffect(() => {
    const timer = setTimeout(() => setQ(customerSearchQuery(searchText)), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText]);
  const list = useCustomerList(warehouseId, q);
  return (
    <CustomersListScreen
      {...base}
      customers={list.items}
      summary={list.summary}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      onSelectCustomer={(selected) =>
        navigate('CustomerDetails', {
          customer: { id: selected.id, code: selected.code, name: selected.name, mobileMasked: selected.mobileMasked, piiMasked: selected.piiMasked },
        })
      }
      onNavigateToNotifications={onNavigateToNotifications}
      isLoading={list.isLoading}
      error={list.error}
      onRetry={list.refresh}
      onRefresh={list.refresh}
      isRefreshing={list.isRefreshing}
      onLoadMore={list.loadMore}
      hasMore={list.hasMore}
    />
  );
}

/** A preview's loading / error / empty state, inside a detail tab. */
function PreviewState({ isLoading, error, onRetry, emptyKey }: { isLoading: boolean; error: unknown; onRetry: () => void; emptyKey: 'customers.empty.orders' | 'customers.empty.purchases' | 'customers.empty.issues' | 'customers.empty.tickets' }) {
  const view = queryViewState({ isLoading, error, itemCount: 0 });
  if (view === 'loading') return <AdminLoadingState />;
  if (view === 'error') return <AdminErrorState error={error} onRetry={onRetry} />;
  return <AdminEmptyState title={t(emptyKey)} />;
}

function OrdersPreview({ warehouseId, customerId, onOpen }: { warehouseId: string | undefined; customerId: string | undefined; onOpen: () => void }) {
  const list = useCustomerOrders(warehouseId, customerId);
  const first = list.items[0];
  if (first === undefined) return <PreviewState isLoading={list.isLoading} error={list.error} onRetry={list.refresh} emptyKey="customers.empty.orders" />;
  return (
    <RecentCard
      code={first.orderNumber}
      badge={<StatusBadge label={first.statusLabel} tone={first.tone} />}
      lines={[first.itemsLabel, first.amountLabel]}
      onPress={onOpen}
      linkLabel="View All Orders →"
    />
  );
}

function PurchasesPreview({ warehouseId, customerId, onOpen }: { warehouseId: string | undefined; customerId: string | undefined; onOpen: () => void }) {
  const list = useCustomerPurchases(warehouseId, customerId);
  const first = list.items[0];
  if (first === undefined) {
    return <PreviewState isLoading={list.isLoading} error={list.error} onRetry={list.refresh} emptyKey="customers.empty.purchases" />;
  }
  return (
    <RecentCard
      code={first.orderNumber}
      lines={[first.lineLabel, first.qtyDetail, first.amountLabel]}
      onPress={onOpen}
      linkLabel="View Purchase History →"
    />
  );
}

function IssuesPreview({ warehouseId, customerId, onOpen }: { warehouseId: string | undefined; customerId: string | undefined; onOpen: () => void }) {
  const list = useCustomerIssues(warehouseId, customerId);
  const first = list.items[0];
  if (first === undefined) return <PreviewState isLoading={list.isLoading} error={list.error} onRetry={list.refresh} emptyKey="customers.empty.issues" />;
  return (
    <RecentCard
      code={first.reference}
      badge={<StatusBadge label={first.statusLabel} tone={first.tone} />}
      lines={[first.reason ?? t('customers.noValue'), first.createdLabel]}
      onPress={onOpen}
      linkLabel="View All Issues →"
    />
  );
}

function SupportPreview({ warehouseId, customerId, onOpen }: { warehouseId: string | undefined; customerId: string | undefined; onOpen: () => void }) {
  const list = useCustomerSupportTickets(warehouseId, customerId);
  const first = list.items[0];
  if (first === undefined) return <PreviewState isLoading={list.isLoading} error={list.error} onRetry={list.refresh} emptyKey="customers.empty.tickets" />;
  return (
    <RecentCard
      code={first.ticketNumber}
      badge={<StatusBadge label={first.statusLabel} tone={first.tone} />}
      lines={[first.subject, first.createdLabel]}
      onPress={onOpen}
      linkLabel="View All Support Tickets →"
    />
  );
}

function LiveDetailRoute({ base, warehouseId, customer, customerId, navigate }: LiveRouteProps) {
  const live = useCustomer(warehouseId, customerId);
  const renderTabPreview = (tab: CustomerPreviewTab) => {
    switch (tab) {
      case 'Orders':
        return <OrdersPreview warehouseId={warehouseId} customerId={customerId} onOpen={() => navigate('CustomerOrders')} />;
      case 'Purchases':
        return <PurchasesPreview warehouseId={warehouseId} customerId={customerId} onOpen={() => navigate('PurchaseHistory')} />;
      case 'Issues':
        return <IssuesPreview warehouseId={warehouseId} customerId={customerId} onOpen={() => navigate('CustomerIssues')} />;
      case 'Support':
        return <SupportPreview warehouseId={warehouseId} customerId={customerId} onOpen={() => navigate('SupportHistory')} />;
    }
  };
  return (
    <CustomerDetailsScreen
      {...base}
      customer={customer}
      profile={live.customer}
      notFound={customerId === undefined}
      renderTabPreview={renderTabPreview}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
      onRefresh={live.refresh}
      isRefreshing={live.isRefreshing}
      onNavigateToOrders={() => navigate('CustomerOrders')}
      onNavigateToPurchases={() => navigate('PurchaseHistory')}
      onNavigateToWallet={() => navigate('CustomerWallet')}
      onNavigateToIssues={() => navigate('CustomerIssues')}
      onNavigateToNewSale={() => navigate('NewSale')}
      onNavigateToCashTopUp={() => navigate('CashTopUp')}
    />
  );
}

function LiveOrdersRoute({ base, warehouseId, customer, customerId, params, navigate }: LiveRouteProps) {
  const list = useCustomerOrders(warehouseId, customerId);
  return (
    <CustomerOrdersScreen
      {...base}
      customer={customer}
      notFound={customerId === undefined}
      orders={list.items}
      defaultFilter={params.defaultFilter}
      onOpenOrder={(order) => navigate('OrderDetail', { order, orderId: order.id, orderNo: order.orderNumber })}
      isLoading={list.isLoading}
      error={list.error}
      onRetry={list.refresh}
      onRefresh={list.refresh}
      isRefreshing={list.isRefreshing}
      onLoadMore={list.loadMore}
      hasMore={list.hasMore}
    />
  );
}

function LivePurchasesRoute({ base, warehouseId, customer, customerId, navigate }: LiveRouteProps) {
  const list = useCustomerPurchases(warehouseId, customerId);
  return (
    <PurchaseHistoryScreen
      {...base}
      customer={customer}
      notFound={customerId === undefined}
      purchases={list.items}
      onSelectPurchase={(purchase) => navigate('OrderDetail', { orderId: purchase.orderId, orderNo: purchase.orderNumber })}
      isLoading={list.isLoading}
      error={list.error}
      onRetry={list.refresh}
      onRefresh={list.refresh}
      isRefreshing={list.isRefreshing}
      onLoadMore={list.loadMore}
      hasMore={list.hasMore}
    />
  );
}

function LiveIssuesRoute({ base, warehouseId, customer, customerId, navigate }: LiveRouteProps) {
  const list = useCustomerIssues(warehouseId, customerId);
  return (
    <CustomerIssuesScreen
      {...base}
      customer={customer}
      notFound={customerId === undefined}
      issues={list.items}
      onSelectIssue={(issue) => navigate('CustomerIssueDetail', { issue })}
      isLoading={list.isLoading}
      error={list.error}
      onRetry={list.refresh}
      onRefresh={list.refresh}
      isRefreshing={list.isRefreshing}
      onLoadMore={list.loadMore}
      hasMore={list.hasMore}
    />
  );
}

function LiveSupportRoute({ base, warehouseId, customer, customerId, navigate }: LiveRouteProps) {
  const list = useCustomerSupportTickets(warehouseId, customerId);
  return (
    <SupportHistoryScreen
      {...base}
      customer={customer}
      notFound={customerId === undefined}
      tickets={list.items}
      onSelectTicket={(ticket) => navigate('SupportDetail', { ticket })}
      isLoading={list.isLoading}
      error={list.error}
      onRetry={list.refresh}
      onRefresh={list.refresh}
      isRefreshing={list.isRefreshing}
      onLoadMore={list.loadMore}
      hasMore={list.hasMore}
    />
  );
}

function LiveSupportDetailRoute({ base, warehouseId, customer, customerId, params }: LiveRouteProps) {
  const ticketId = uuidParam(params.ticket?.id);
  const live = useCustomerSupportTicket(warehouseId, customerId, ticketId);
  return (
    <CustomerSupportDetailScreen
      {...base}
      customer={customer}
      ticket={params.ticket}
      detail={live.ticket}
      notFound={customerId === undefined || ticketId === undefined}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
      onRefresh={live.refresh}
      isRefreshing={live.isRefreshing}
    />
  );
}

// ─── Flow ────────────────────────────────────────────────────────────────────

export function CustomersFlow({
  scope,
  can,
  initialScreen = 'CustomersList',
  initialParams,
  onBack,
  onTabChange,
  onNavigateToNotifications,
  warehouseOptions,
  renderExternalScreen,
  inlineExternalRoutes = EXTERNAL_ROUTES,
  onOpenExternal,
}: CustomersFlowProps) {
  const [stack, setStack] = useState<CustomersStackEntry[]>(() => [{ screen: initialScreen, params: initialParams }]);

  // A host that re-targets the open module restarts the stack, as the other
  // area flows do. Hosts keep these props referentially stable.
  useEffect(() => {
    setStack([{ screen: initialScreen, params: initialParams }]);
  }, [initialScreen, initialParams]);

  const current = stack[stack.length - 1] ?? { screen: initialScreen, params: initialParams };
  const params: CustomersRouteParams = current.params ?? {};
  const customer: CustomerRef | undefined = params.customer;

  const navigate: Navigate = (screen, nextParams) => {
    // Carry the customer in focus forward unless the caller names another.
    const merged: CustomersRouteParams = { customer, ...nextParams };
    if (isExternal(screen) && !(renderExternalScreen && inlineExternalRoutes.includes(screen))) {
      onOpenExternal?.(screen, merged);
      return;
    }
    setStack((prev) => [...prev, { screen, params: merged }]);
  };
  const back = () => {
    if (stack.length > 1) setStack((prev) => prev.slice(0, -1));
    else onBack();
  };

  // Hardware back pops this flow's stack; at its root the host's listener handles it.
  useFlowBack(() => {
    if (stack.length <= 1) return false;
    back();
    return true;
  });

  const base: WarehouseScreenBaseProps = { scope, can, onBack: back, onTabChange };
  const live: LiveRouteProps = {
    base,
    warehouseId: scope.warehouseId,
    customer,
    customerId: customerIdParam(customer?.id),
    params,
    navigate,
  };

  if (isExternal(current.screen)) {
    return <>{renderExternalScreen?.(current.screen, params, { back, open: navigate }) ?? null}</>;
  }

  switch (current.screen) {
    case 'CustomersList':
    case 'CustomerSearch':
      return <LiveListRoute {...live} onNavigateToNotifications={onNavigateToNotifications} />;
    case 'CustomerDetails':
      return <LiveDetailRoute {...live} />;
    case 'CustomerOrders':
      return <LiveOrdersRoute {...live} />;
    case 'OrderFilters':
      return (
        <OrderFiltersScreen
          {...base}
          config="order"
          variant="customer"
          customerName={customer?.name}
          warehouseOptions={warehouseOptions}
          onApplyFilters={() => back()}
        />
      );
    case 'PurchaseHistory':
      return <LivePurchasesRoute {...live} />;
    case 'PurchaseFilters':
      return <OrderFiltersScreen {...base} config="purchase" warehouseOptions={warehouseOptions} onApplyFilters={() => back()} />;
    case 'CustomerIssues':
      return <LiveIssuesRoute {...live} />;
    case 'CustomerIssueDetail':
      return (
        <CustomerIssueDetailScreen
          {...base}
          customer={customer}
          issue={params.issue}
          // An issue is a return request: the host opens the live return by the
          // issue's id. Offered only with rma.request.process (the returns
          // read code); the server re-checks and scopes it (BR-30).
          onOpenReturn={
            can('rma.request.process') && params.issue !== undefined
              ? () => navigate('RmaDetail', { issue: params.issue })
              : undefined
          }
        />
      );
    case 'SupportHistory':
      return <LiveSupportRoute {...live} />;
    case 'SupportDetail':
      return <LiveSupportDetailRoute {...live} />;
    default:
      return null;
  }
}
