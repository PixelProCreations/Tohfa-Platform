/**
 * In-module navigator for the warehouse customer screens (design module M7).
 *
 * The customer flows (list -> search / details -> orders / purchases / issues /
 * support -> filters / detail) used to be stitched three times: eleven `show*`
 * state branches in the Sub shell, fifteen App.tsx route keys, and six
 * `whSubView` values in the Main shell (onto the separate Main twins). They
 * live next to the screens now and take `scope` + `can`, so every host renders
 * the same flow: the Sub shell / App.tsx with the Sub warehouse scope, the
 * Main shell with MAIN_WAREHOUSE_SCOPE (all warehouses).
 *
 * Route keys are the old App.tsx keys without the 'SubWarehouse' prefix
 * (CustomersRoute). Removed: CustomerActions (dropped, SPEC_GAPS W4h-1).
 *
 * Screens outside the customer area (wallet, cash top-up, new sale, order
 * detail, RMA) are opened through the host: a shell that can
 * draw them inline passes `renderExternalScreen` (they join this flow's back
 * stack); App.tsx, and the Main shell for New Sale, pass `onOpenExternal`
 * and navigate to their own route.
 */
import React, { useEffect, useState } from 'react';
import { useFlowBack } from '../useFlowBack';

import { CustomerDetailsScreen } from './CustomerDetailsScreen';
import { CustomerIssueDetailScreen } from './CustomerIssueDetailScreen';
import { CustomerIssuesScreen } from './CustomerIssuesScreen';
import { CustomerOrdersScreen } from './CustomerOrdersScreen';
import { CustomerSearchScreen } from './CustomerSearchScreen';
import { CustomersListScreen } from './CustomersListScreen';
import { CustomerSupportDetailScreen } from './CustomerSupportDetailScreen';
import { CUSTOMER_WAREHOUSES } from './fixtures';
import { OrderFiltersScreen } from './OrderFiltersScreen';
import { PurchaseHistoryScreen } from './PurchaseHistoryScreen';
import { SupportHistoryScreen } from './SupportHistoryScreen';
import type {
  CustomerRef,
  CustomersExternalRoute,
  CustomersRoute,
  CustomersRouteParams,
  OrderFilterState,
  PermissionCheck,
  PurchaseFilterState,
  WarehouseScope,
  WarehouseTab,
} from './types';

const EXTERNAL_ROUTES: readonly CustomersExternalRoute[] = [
  'CustomerWallet',
  'CashTopUp',
  'NewSale',
  'OrderDetail',
  'RmaDetail',
];

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
  /** Warehouses for the Main all-warehouses selector (ignored for a Sub scope). */
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

export function CustomersFlow({
  scope,
  can,
  initialScreen = 'CustomersList',
  initialParams,
  onBack,
  onTabChange,
  onNavigateToNotifications,
  warehouseOptions = CUSTOMER_WAREHOUSES,
  renderExternalScreen,
  inlineExternalRoutes = EXTERNAL_ROUTES,
  onOpenExternal,
}: CustomersFlowProps) {
  const [stack, setStack] = useState<CustomersStackEntry[]>(() => [{ screen: initialScreen, params: initialParams }]);
  // Filters survive the trip to the filter screen and back (one set per list).
  const [orderFilters, setOrderFilters] = useState<OrderFilterState | undefined>(undefined);
  const [purchaseFilters, setPurchaseFilters] = useState<PurchaseFilterState | undefined>(undefined);

  // A host that re-targets the open module restarts the stack, as the other
  // area flows do. Hosts keep these props referentially stable.
  useEffect(() => {
    setStack([{ screen: initialScreen, params: initialParams }]);
  }, [initialScreen, initialParams]);

  const current = stack[stack.length - 1] ?? { screen: initialScreen, params: initialParams };
  const params: CustomersRouteParams = current.params ?? {};
  const customer: CustomerRef | undefined = params.customer;

  const navigate = (screen: CustomersRoute | CustomersExternalRoute, nextParams?: CustomersRouteParams) => {
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

  const common = { scope, can, onBack: back, onTabChange };

  if (isExternal(current.screen)) {
    return <>{renderExternalScreen?.(current.screen, params, { back, open: navigate }) ?? null}</>;
  }

  switch (current.screen) {
    case 'CustomersList':
      return (
        <CustomersListScreen
          {...common}
          warehouseOptions={warehouseOptions}
          onNavigateToSearch={() => navigate('CustomerSearch')}
          onSelectCustomer={(selected) => navigate('CustomerDetails', { customer: selected })}
          onNavigateToNotifications={onNavigateToNotifications}
        />
      );
    case 'CustomerSearch':
      return (
        <CustomerSearchScreen
          {...common}
          onSelectCustomer={(name: string, id?: string) =>
            navigate('CustomerDetails', { customer: { name, id, code: id } })
          }
        />
      );
    case 'CustomerDetails':
      return (
        <CustomerDetailsScreen
          {...common}
          customer={customer}
          onNavigateToOrders={() => navigate('CustomerOrders')}
          onNavigateToPurchases={() => navigate('PurchaseHistory')}
          onNavigateToWallet={() => navigate('CustomerWallet')}
          onNavigateToIssues={() => navigate('CustomerIssues')}
          onNavigateToSupport={() => navigate('SupportHistory')}
          onNavigateToNewSale={() => navigate('NewSale')}
          onNavigateToCashTopUp={() => navigate('CashTopUp')}
        />
      );
    case 'CustomerOrders':
      return (
        <CustomerOrdersScreen
          {...common}
          customer={customer}
          warehouseOptions={warehouseOptions}
          appliedFilters={orderFilters}
          defaultFilter={params.defaultFilter}
          onOpenFilters={() => navigate('OrderFilters')}
          onOpenOrder={(order) => navigate('OrderDetail', { order, orderNo: order.orderNo })}
        />
      );
    case 'OrderFilters':
      return (
        <OrderFiltersScreen
          {...common}
          config="order"
          variant="customer"
          customerName={customer?.name}
          warehouseOptions={warehouseOptions}
          initialFilters={orderFilters}
          onApplyFilters={(next) => {
            setOrderFilters(next);
            back();
          }}
        />
      );
    case 'PurchaseHistory':
      return (
        <PurchaseHistoryScreen
          {...common}
          customer={customer}
          appliedFilters={purchaseFilters}
          onOpenFilters={() => navigate('PurchaseFilters')}
          onSelectPurchase={(purchase) => navigate('OrderDetail', { orderNo: purchase.orderNo ?? purchase.invoiceNo })}
        />
      );
    case 'PurchaseFilters':
      return (
        <OrderFiltersScreen
          {...common}
          config="purchase"
          warehouseOptions={warehouseOptions}
          initialFilters={purchaseFilters}
          onApplyFilters={(next) => {
            setPurchaseFilters(next);
            back();
          }}
        />
      );
    case 'CustomerIssues':
      return (
        <CustomerIssuesScreen
          {...common}
          customer={customer}
          onSelectIssue={(issue) => navigate('CustomerIssueDetail', { issue })}
        />
      );
    case 'CustomerIssueDetail':
      return (
        <CustomerIssueDetailScreen
          {...common}
          customer={customer}
          issue={params.issue}
          onViewRma={(issue) => navigate('RmaDetail', { issue })}
        />
      );
    case 'SupportHistory':
      return (
        <SupportHistoryScreen
          {...common}
          customer={customer}
          onSelectTicket={(ticket) => navigate('SupportDetail', { ticket })}
        />
      );
    case 'SupportDetail':
      return <CustomerSupportDetailScreen {...common} customer={customer} ticket={params.ticket} />;
    default:
      return null;
  }
}
