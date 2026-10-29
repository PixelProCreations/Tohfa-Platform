/**
 * In-module navigator for the warehouse customer screens (design module M7).
 *
 * Route keys are the old App.tsx keys without the 'SubWarehouse' prefix
 * (CustomersRoute).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useFlowBack } from '../useFlowBack';

import { CustomerDetailsScreen } from './CustomerDetailsScreen';
import { CustomerFiltersScreen, type CustomerFilterValues } from './CustomerFiltersScreen';
import { CustomerIssueDetailScreen } from './CustomerIssueDetailScreen';
import { CustomerIssuesScreen } from './CustomerIssuesScreen';
import { CustomerOrdersScreen } from './CustomerOrdersScreen';
import { CustomerSearchScreen } from './CustomerSearchScreen';
import { CustomerSupportDetailScreen } from './CustomerSupportDetailScreen';
import { CustomersListScreen } from './CustomersListScreen';
import { OrderFiltersScreen } from './OrderFiltersScreen';
import { PurchaseHistoryScreen } from './PurchaseHistoryScreen';
import { SupportHistoryScreen } from './SupportHistoryScreen';
import {
  CUSTOMER_WAREHOUSE_LIST_CODE,
  useCustomer,
  useCustomerIssues,
  useCustomerList,
  useCustomerOrders,
  useCustomerPurchases,
  useCustomerSupportTickets,
  useCustomerWallet,
} from './useCustomerData';
import { augmentCustomerRecord, formatMoney } from './mappers';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import type {
  CustomerOrderRecord,
  CustomerRecord,
  CustomerRef,
  CustomersExternalRoute,
  CustomersRoute,
  CustomersRouteParams,
  OrderFilterState,
  PermissionCheck,
  PurchaseFilterState,
  PurchaseRecord,
  SupportTicketRecord,
  WarehouseScope,
  WarehouseTab,
} from './types';

/** One entry of the flow's back stack. */
export interface CustomersStackEntry {
  screen: CustomersRoute | CustomersExternalRoute;
  params?: CustomersRouteParams | undefined;
}

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

export interface CustomersFlowNavigation {
  back: () => void;
  open: (screen: CustomersRoute | CustomersExternalRoute, params?: CustomersRouteParams) => void;
}

export interface CustomersFlowProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  initialScreen?: CustomersRoute | undefined;
  initialParams?: CustomersRouteParams | undefined;
  onBack: () => void;
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
  onNavigateToNotifications?: (() => void) | undefined;
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  renderExternalScreen?:
    | ((
        screen: CustomersExternalRoute,
        params: CustomersRouteParams,
        nav: CustomersFlowNavigation,
      ) => React.ReactNode)
    | undefined;
  inlineExternalRoutes?: readonly CustomersExternalRoute[] | undefined;
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
  warehouseOptions,
  renderExternalScreen,
  inlineExternalRoutes = EXTERNAL_ROUTES,
  onOpenExternal,
}: CustomersFlowProps) {
  const [stack, setStack] = useState<CustomersStackEntry[]>(() => [{ screen: initialScreen, params: initialParams }]);
  const [customerFilters, setCustomerFilters] = useState<CustomerFilterValues | undefined>(undefined);
  const [orderFilters, setOrderFilters] = useState<OrderFilterState | undefined>(undefined);
  const [purchaseFilters, setPurchaseFilters] = useState<PurchaseFilterState | undefined>(undefined);

  const liveWarehouses = useWarehouseOptions({
    enabled: can(CUSTOMER_WAREHOUSE_LIST_CODE),
    activeOnly: true,
  });
  const effectiveWarehouseOptions = warehouseOptions ?? liveWarehouses.options;
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const customerList = useCustomerList(scope, can, selectedWarehouseId);

  useEffect(() => {
    setStack([{ screen: initialScreen, params: initialParams }]);
  }, [initialScreen, initialParams]);

  const current = stack[stack.length - 1] ?? { screen: initialScreen, params: initialParams };
  const params: CustomersRouteParams = current.params ?? {};
  const customerId = params.customerId ?? params.customer?.id;

  const customerQuery = useCustomer(customerId, can);
  const walletQuery = useCustomerWallet(customerId, can);
  const ordersHook = useCustomerOrders(customerId, can);
  const purchasesHook = useCustomerPurchases(customerId, can);
  const issuesHook = useCustomerIssues(customerId, can);
  const supportHook = useCustomerSupportTickets(customerId, can);

  const resolvedCustomer: CustomerRef | undefined = useMemo(() => {
    if (!customerQuery.data) return params.customer;
    const base = params.customer ?? {
      id: customerQuery.data.id,
      name: customerQuery.data.name,
      code: customerQuery.data.customerCode,
      phone: customerQuery.data.mobileMasked,
      status: 'Active',
      ordersCount: customerQuery.data.totalOrders,
      lastPurchase: '—',
    };
    const aug = augmentCustomerRecord(base as CustomerRecord, customerQuery.data, undefined);
    if (walletQuery.data?.balance) {
      aug.walletBalance = formatMoney(walletQuery.data.balance) ?? aug.walletBalance;
    }
    return aug;
  }, [params.customer, customerQuery.data, walletQuery.data]);

  const navigate = (screen: CustomersRoute | CustomersExternalRoute, nextParams?: CustomersRouteParams) => {
    const merged: CustomersRouteParams = { customerId, customer: resolvedCustomer, ...nextParams };
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
          warehouseOptions={effectiveWarehouseOptions}
          customers={customerList.items}
          onNavigateToSearch={() => navigate('CustomerSearch')}
          onSelectCustomer={(selected) => navigate('CustomerDetails', { customerId: selected.id, customer: selected })}
          onNavigateToNotifications={onNavigateToNotifications}
          onOpenFilters={() => navigate('CustomerFilters')}
        />
      );
    case 'CustomerFilters':
      return (
        <CustomerFiltersScreen
          {...common}
          warehouseOptions={effectiveWarehouseOptions}
          initialFilters={
            customerFilters ?? {
              searchQuery: '',
              status: 'All',
              warehouseId: undefined,
            }
          }
          onApplyFilters={(next) => {
            setCustomerFilters(next);
            back();
          }}
        />
      );
    case 'CustomerSearch':
      return (
        <CustomerSearchScreen
          {...common}
          customers={customerList.items}
          onSelectCustomer={(name: string, id?: string) =>
            navigate('CustomerDetails', { customerId: id, customer: { name, id, code: id } })
          }
        />
      );
    case 'CustomerDetails':
      return (
        <CustomerDetailsScreen
          {...common}
          customer={resolvedCustomer}
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
          customer={resolvedCustomer}
          warehouseOptions={effectiveWarehouseOptions}
          appliedFilters={orderFilters}
          defaultFilter={params.defaultFilter}
          onOpenFilters={() => navigate('OrderFilters')}
          onOpenOrder={(order) => navigate('OrderDetail', { order, orderId: order.id, orderNo: order.orderNo })}
          orders={ordersHook.items}
        />
      );
    case 'OrderFilters':
      return (
        <OrderFiltersScreen
          {...common}
          config="order"
          variant="customer"
          customerName={resolvedCustomer?.name}
          warehouseOptions={effectiveWarehouseOptions}
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
          customer={resolvedCustomer}
          appliedFilters={purchaseFilters}
          onOpenFilters={() => navigate('PurchaseFilters')}
          onSelectPurchase={(purchase: PurchaseRecord) =>
            navigate('OrderDetail', { orderId: purchase.orderId, orderNo: purchase.orderNo ?? purchase.invoiceNo })
          }
          purchases={purchasesHook.items}
        />
      );
    case 'PurchaseFilters':
      return (
        <OrderFiltersScreen
          {...common}
          config="purchase"
          warehouseOptions={effectiveWarehouseOptions}
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
          customer={resolvedCustomer}
          onSelectIssue={(issue) => navigate('CustomerIssueDetail', { issue })}
          issues={issuesHook.items}
        />
      );
    case 'CustomerIssueDetail':
      return (
        <CustomerIssueDetailScreen
          {...common}
          customer={resolvedCustomer}
          issue={params.issue}
          onViewRma={(issue) => navigate('RmaDetail', { returnId: issue.id, issue })}
        />
      );
    case 'SupportHistory':
      return (
        <SupportHistoryScreen
          {...common}
          customer={resolvedCustomer}
          onSelectTicket={(ticket: SupportTicketRecord) => navigate('SupportDetail', { ticket })}
          tickets={supportHook.items}
        />
      );
    case 'SupportDetail':
      return <CustomerSupportDetailScreen {...common} customer={resolvedCustomer} ticket={params.ticket} />;
    default:
      return null;
  }
}
