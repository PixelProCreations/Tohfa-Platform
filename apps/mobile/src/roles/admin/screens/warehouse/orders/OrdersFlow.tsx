/**
 * In-module navigator for the customer-order screens (design module M5).
 *
 * This used to live inside the Sub Warehouse shell (OrdersModule), so only the
 * Sub admin could reach the order screens and the Main shell carried its own
 * copies. It now lives next to the screens and takes `scope` + `can`, so both
 * shells render the same flow: the Sub shell with its own warehouse scope, the
 * Main shell with MAIN_WAREHOUSE_SCOPE (all warehouses).
 *
 * Route keys are the design ids ('M5S04', ...) because deep links from the
 * shells, notifications and App.tsx already use them. Keys of screens that are
 * now inline steps (M5S06, M5S08, M5S10, M5S12, M5S14B, M5S14C, M5S15B, M5S16B)
 * are gone; callers pass `{ step }` to the survivor instead (see ./types).
 *
 * Data is live and owned here (API integration plan, phase 5): each route's
 * container fetches through ./useOrdersData.ts and passes the result to the
 * screen. The warehouse every request sends is computed once with
 * ordersWarehouseFilter: a Sub scope always sends its own warehouse uuid
 * (BR-30, BR-101), the Main view the warehouse picked in its selector (held
 * here so it survives moving between screens), or none for all warehouses. An
 * order route param must be an order uuid (orderIdParam); a host still passing
 * a sample code gets "not found", not a request for it.
 *
 * The order invoice (M5S18) is live: its container reads the order detail
 * (cached from M5S04) for the invoice id and the screen renders the billing
 * area's LiveInvoiceDetail. It is gated on invoice.view_own (availability.ts
 * 'orderInvoices'), so a caller without it is refused like a hidden route.
 *
 * Cancel (M5S17), order issues (M5S16) and dispatch (M5S14) are wired to their
 * writes (POST .../cancel, .../issues, .../dispatch) through useOrderAction,
 * exactly like pack and verify-otp: each reaches its success step only after a
 * 2xx. The stock check (M5S05) only reads the live order and shows
 * ADMIN_NO_VALUE where a figure has no source.
 * Delivery preparation and dispatch (M5S13, M5S14) are wired but availability.ts
 * takes delivery out of the app (pickup only, BR-21), so the flow refuses those
 * two routes and renders the dashboard; they stay in code.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import type {
  AssignWarehouseBody,
  CancelOrderBody,
  CreateOrderIssueBody,
  DispatchOrderBody,
  OrderListStatusFilter,
  PackOrderBody,
  VerifyOtpBody,
} from '../../../api/orders';
import { adminColors } from '../../../theme';
import { isAreaAvailable, ordersRouteArea } from '../availability';
import { OrderFiltersScreen } from '../customers';
import { useFlowBack } from '../useFlowBack';
import { CancelOrderScreen } from './CancelOrderScreen';
import { DeliveryPreparationScreen } from './DeliveryPreparationScreen';
import { DispatchScreen } from './DispatchScreen';
import { OrderDetailScreen } from './OrderDetailScreen';
import { OrderInvoiceScreen } from './OrderInvoiceScreen';
import { OrderIssueScreen } from './OrderIssueScreen';
import { OrderStatusHistoryScreen } from './OrderStatusHistoryScreen';
import { OrdersDashboardScreen } from './OrdersDashboardScreen';
import { OrdersListScreen } from './OrdersListScreen';
import { PackingScreen } from './PackingScreen';
import { PickupOtpScreen } from './PickupOtpScreen';
import { ReadyForPickupScreen } from './ReadyForPickupScreen';
import { StockCheckScreen } from './StockCheckScreen';
import { orderIdParam, ordersWarehouseFilter } from './mappers';
import type {
  DispatchStep,
  OrderIssueStep,
  OrderScreenBaseProps,
  OrdersWarehouseSelector,
  PackingStep,
  PermissionCheck,
  PickupStep,
  StockCheckStep,
  WarehouseScope,
  WarehouseTab,
} from './types';
import { useDeliveryPartners, useOrder, useOrderAction, useOrderList, useOrderTaskCounts } from './useOrdersData';

/** Route params passed between order screens. Loose on purpose: they come from deep links. */
export type OrdersRouteParams = Record<string, any> | null;

/** Navigation handle given to `renderExternalScreen`. */
export interface OrdersFlowNavigation {
  navigate: (screen: string, params?: OrdersRouteParams) => void;
  back: () => void;
}

export interface OrdersFlowProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  initialScreen?: string | undefined;
  initialParams?: OrdersRouteParams | undefined;
  /** Leave the order module (pressed back on its first screen). */
  onBack: () => void;
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
  /** Warehouses (uuid ids) for the Main all-warehouses selector; ignored for a Sub scope. */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  /** "View Issue" after reporting an order issue. */
  onViewIssue?: (() => void) | undefined;
  /**
   * Host-owned screens reachable from inside the flow (e.g. the Sub shell's
   * operational-issues list for 'M4S09'). Return null for keys you do not own.
   */
  renderExternalScreen?:
    | ((screen: string, params: OrdersRouteParams, nav: OrdersFlowNavigation) => React.ReactNode)
    | undefined;
}

interface StackEntry {
  screen: string;
  params: OrdersRouteParams;
}

/** The first screen of the module; also what a refused (hidden) route renders. */
const HOME_SCREEN = 'M5S01';

const LIST_STATUS_FILTERS: readonly OrderListStatusFilter[] = [
  'CONFIRMED',
  'PACKED',
  'READY_FOR_PICKUP',
  'DISPATCHED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

/** The list's server-side status filter from a route param, or undefined for an unknown value. */
function statusParam(params: OrdersRouteParams): OrderListStatusFilter | undefined {
  const value: unknown = params?.['status'];
  return LIST_STATUS_FILTERS.find((s) => s === value);
}

function stepParam<S extends string>(params: OrdersRouteParams, steps: readonly S[]): S | undefined {
  const value: unknown = params?.['step'];
  return steps.find((s) => s === value);
}

/** What the flow hands every live route: the screen props, the warehouse to send, the route params. */
interface LiveRouteProps {
  base: OrderScreenBaseProps;
  warehouseId: string | undefined;
  params: OrdersRouteParams;
  selector: OrdersWarehouseSelector;
}

function LiveSubDashboardRoute({ base, warehouseId }: LiveRouteProps) {
  const tasks = useOrderTaskCounts(warehouseId);
  return (
    <OrdersDashboardScreen
      {...base}
      counts={tasks.counts}
      isLoading={tasks.isLoading}
      error={tasks.error}
      onRetry={tasks.refresh}
      onRefresh={tasks.refresh}
      isRefreshing={tasks.isRefreshing}
    />
  );
}

function LiveMainDashboardRoute({ base, warehouseId, selector }: LiveRouteProps) {
  const tasks = useOrderTaskCounts(warehouseId);
  const recent = useOrderList(warehouseId);
  return (
    <OrdersDashboardScreen
      {...base}
      {...selector}
      counts={tasks.counts}
      recentOrders={recent.items}
      isLoading={tasks.isLoading}
      error={tasks.error}
      onRetry={tasks.refresh}
      onRefresh={() => {
        tasks.refresh();
        recent.refresh();
      }}
      isRefreshing={tasks.isRefreshing || recent.isRefreshing}
    />
  );
}

/** The fulfilment a dashboard tile opened the list with. */
function fulfillmentParam(params: OrdersRouteParams | undefined): 'Delivery' | 'Pickup' | undefined {
  const value = params?.fulfillment;
  return value === 'Delivery' || value === 'Pickup' ? value : undefined;
}

function LiveListRoute({ base, warehouseId, params, selector }: LiveRouteProps) {
  const status = statusParam(params);
  const list = useOrderList(warehouseId, status);
  return (
    <OrdersListScreen
      {...base}
      {...selector}
      status={status}
      fulfillment={fulfillmentParam(params)}
      orders={list.items}
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

function LiveReadyRoute({ base, warehouseId }: LiveRouteProps) {
  const list = useOrderList(warehouseId, 'READY_FOR_PICKUP');
  return (
    <ReadyForPickupScreen
      {...base}
      orders={list.items}
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

function LiveDetailRoute({ base, warehouseId, params, selector }: LiveRouteProps) {
  const orderId = orderIdParam(params);
  const live = useOrder(warehouseId, orderId);
  const assign = useOrderAction<AssignWarehouseBody>('assign', orderId);
  return (
    <OrderDetailScreen
      {...base}
      warehouseOptions={selector.warehouseOptions}
      assign={assign}
      order={live.order}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
      onRefresh={live.refresh}
      isRefreshing={live.isRefreshing}
    />
  );
}

function LiveHistoryRoute({ base, warehouseId, params }: LiveRouteProps) {
  const live = useOrder(warehouseId, orderIdParam(params));
  return (
    <OrderStatusHistoryScreen
      {...base}
      order={live.order}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
      onRefresh={live.refresh}
      isRefreshing={live.isRefreshing}
    />
  );
}

function LiveInvoiceRoute({ base, warehouseId, params }: LiveRouteProps) {
  const live = useOrder(warehouseId, orderIdParam(params));
  return (
    <OrderInvoiceScreen
      {...base}
      order={live.order}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
      onRefresh={live.refresh}
      isRefreshing={live.isRefreshing}
    />
  );
}

const PACKING_STEPS: readonly PackingStep[] = ['packing', 'confirm'];

function LivePackingRoute({ base, warehouseId, params }: LiveRouteProps) {
  const orderId = orderIdParam(params);
  const live = useOrder(warehouseId, orderId);
  const pack = useOrderAction<PackOrderBody>('pack', orderId);
  const markReady = useOrderAction<DispatchOrderBody>('markReady', orderId);
  return (
    <PackingScreen
      {...base}
      initialStep={stepParam(params, PACKING_STEPS)}
      order={live.order}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
      onRefresh={live.refresh}
      isRefreshing={live.isRefreshing}
      pack={pack}
      markReady={markReady}
    />
  );
}

const PICKUP_STEPS: readonly PickupStep[] = ['verify', 'otp', 'handover'];

function LivePickupRoute({ base, warehouseId, params }: LiveRouteProps) {
  const orderId = orderIdParam(params);
  const live = useOrder(warehouseId, orderId);
  const verify = useOrderAction<VerifyOtpBody>('verifyOtp', orderId);
  return (
    <PickupOtpScreen
      {...base}
      initialStep={stepParam(params, PICKUP_STEPS)}
      order={live.order}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
      onRefresh={live.refresh}
      isRefreshing={live.isRefreshing}
      verify={verify}
    />
  );
}

const STOCK_CHECK_STEPS: readonly StockCheckStep[] = ['check', 'shortage'];

function LiveStockCheckRoute({ base, warehouseId, params }: LiveRouteProps) {
  const live = useOrder(warehouseId, orderIdParam(params));
  return (
    <StockCheckScreen
      {...base}
      initialStep={stepParam(params, STOCK_CHECK_STEPS)}
      order={live.order}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
      onRefresh={live.refresh}
      isRefreshing={live.isRefreshing}
    />
  );
}

function LiveCancelRoute({ base, warehouseId, params }: LiveRouteProps) {
  const orderId = orderIdParam(params);
  const live = useOrder(warehouseId, orderId);
  const cancel = useOrderAction<CancelOrderBody>('cancel', orderId);
  return (
    <CancelOrderScreen
      {...base}
      cancel={cancel}
      order={live.order}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
      onRefresh={live.refresh}
      isRefreshing={live.isRefreshing}
    />
  );
}

const ORDER_ISSUE_STEPS: readonly OrderIssueStep[] = ['form', 'submitted'];

function LiveOrderIssueRoute({
  base,
  warehouseId,
  params,
  onViewIssue,
}: LiveRouteProps & { onViewIssue?: (() => void) | undefined }) {
  const orderId = orderIdParam(params);
  const live = useOrder(warehouseId, orderId);
  const report = useOrderAction<CreateOrderIssueBody>('reportIssue', orderId);
  const issueId: unknown = params?.['issueId'];
  return (
    <OrderIssueScreen
      {...base}
      report={report}
      initialStep={stepParam(params, ORDER_ISSUE_STEPS)}
      issueId={typeof issueId === 'string' ? issueId : undefined}
      onViewIssue={onViewIssue}
      order={live.order}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
      onRefresh={live.refresh}
      isRefreshing={live.isRefreshing}
    />
  );
}

function LiveDeliveryPrepRoute({ base, warehouseId, params }: LiveRouteProps) {
  const live = useOrder(warehouseId, orderIdParam(params));
  return (
    <DeliveryPreparationScreen
      {...base}
      order={live.order}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
      onRefresh={live.refresh}
      isRefreshing={live.isRefreshing}
    />
  );
}

const DISPATCH_STEPS: readonly DispatchStep[] = ['dispatch', 'confirm', 'dispatched'];

function LiveDispatchRoute({ base, warehouseId, params }: LiveRouteProps) {
  const orderId = orderIdParam(params);
  const live = useOrder(warehouseId, orderId);
  const dispatch = useOrderAction<DispatchOrderBody>('dispatch', orderId);
  // The partner list needs delivery.partner.manage; the picker is only useful to a caller who can dispatch.
  const partners = useDeliveryPartners(base.can('order.dispatch') && base.can('delivery.partner.manage'));
  return (
    <DispatchScreen
      {...base}
      dispatch={dispatch}
      partnerList={{ partners: partners.partners, isLoading: partners.isLoading, error: partners.error }}
      initialStep={stepParam(params, DISPATCH_STEPS)}
      order={live.order}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
      onRefresh={live.refresh}
      isRefreshing={live.isRefreshing}
    />
  );
}

export function OrdersFlow({
  scope,
  can,
  initialScreen = HOME_SCREEN,
  initialParams = null,
  onBack,
  onTabChange,
  warehouseOptions,
  onViewIssue,
  renderExternalScreen,
}: OrdersFlowProps) {
  const [stack, setStack] = useState<StackEntry[]>([{ screen: initialScreen, params: initialParams }]);
  // Main only: the warehouse picked in the selector (undefined = all). A Sub
  // scope ignores it; ordersWarehouseFilter always sends its own warehouse.
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const warehouseId = ordersWarehouseFilter(scope, selectedWarehouseId);
  /** False for a route of an order area with no API (cancel, issues, stock check, delivery), or the invoice without invoice.view_own. */
  const isRouteAvailable = (screen: string): boolean => {
    const area = ordersRouteArea(screen);
    return area === undefined || isAreaAvailable(area, can);
  };

  useEffect(() => {
    setStack([{ screen: initialScreen, params: initialParams }]);
  }, [initialScreen, initialParams?.fulfillment, initialParams?.orderId, initialParams?.step]);

  const current = stack[stack.length - 1] ?? { screen: initialScreen, params: initialParams };
  const params = current.params;

  const navigate = (screen: string, nextParams?: OrdersRouteParams) => {
    if (!isRouteAvailable(screen)) return;
    setStack((prev) => [...prev, { screen, params: nextParams ?? null }]);
  };

  const back = () => {
    if (stack.length > 1) {
      setStack((prev) => prev.slice(0, -1));
    } else {
      onBack();
    }
  };

  // Hardware back pops this flow's stack; at its root the host's listener handles it.
  useFlowBack(() => {
    if (stack.length <= 1) return false;
    back();
    return true;
  });

  const common = {
    scope,
    can,
    onBack: back,
    onNavigate: (screen: string, nextParams?: Record<string, unknown>) => navigate(screen, nextParams ?? null),
  };
  const live: LiveRouteProps = {
    base: { ...common, onTabChange },
    warehouseId,
    params,
    selector: { warehouseOptions, selectedWarehouseId, onSelectWarehouse: setSelectedWarehouseId },
  };
  const dashboard =
    scope.warehouseId === undefined ? <LiveMainDashboardRoute {...live} /> : <LiveSubDashboardRoute {...live} />;

  // A deep link or an old host key into an area with no API opens the dashboard.
  const screen = isRouteAvailable(current.screen) ? current.screen : HOME_SCREEN;

  const renderScreen = (): React.ReactNode => {
    switch (screen) {
      case 'M5S01':
      case 'M5S01_OrdersDashboard':
        return dashboard;
      case 'M5S02':
      case 'M5S02_OrdersList':
        return <LiveListRoute {...live} />;
      case 'M5S03':
      case 'M5S03_SearchFilters':
        // The order-queue filters are the shared OrderFiltersScreen ('order'
        // config, queue variant) since the customers wave folded M5S03 into it.
        // The live list no longer links here (its filters are not wired to a
        // request); an old deep link still opens it.
        return (
          <OrderFiltersScreen
            scope={scope}
            can={can}
            onBack={back}
            config="order"
            variant="queue"
            onApplyFilters={(filters) => {
              const listParams = {
                defaultFilter: filters.orderStatus === 'All' ? undefined : filters.orderStatus,
                warehouseId: filters.warehouseId,
              };
              // Back onto the list it was opened from, now filtered (M5S03 pushed a second list).
              setStack((prev) => {
                const below = prev.slice(0, -1);
                const listEntry = below[below.length - 1];
                if (listEntry && (listEntry.screen === 'M5S02' || listEntry.screen === 'M5S02_OrdersList')) {
                  return [...below.slice(0, -1), { screen: listEntry.screen, params: { ...listEntry.params, ...listParams } }];
                }
                return [...below, { screen: 'M5S02', params: listParams }];
              });
            }}
          />
        );
      case 'M5S04':
      case 'M5S04_OrderDetail':
        return <LiveDetailRoute {...live} />;
      case 'M5S05':
      case 'M5S05_StockCheck':
        return <LiveStockCheckRoute {...live} />;
      case 'M5S07':
      case 'M5S07_Packing':
        return <LivePackingRoute {...live} />;
      case 'M5S09':
      case 'M5S09_ReadyForPickup':
        return <LiveReadyRoute {...live} />;
      case 'M5S11':
      case 'M5S11_PickupOTP':
        return <LivePickupRoute {...live} />;
      case 'M5S13':
      case 'M5S13_DeliveryPreparation':
        return <LiveDeliveryPrepRoute {...live} />;
      case 'M5S14':
      case 'M5S14_Dispatch':
        return <LiveDispatchRoute {...live} />;
      case 'M5S15':
      case 'M5S15_OrderStatusHistory':
        return <LiveHistoryRoute {...live} />;
      case 'M5S16':
      case 'M5S16_OrderIssue':
        return <LiveOrderIssueRoute {...live} onViewIssue={onViewIssue} />;
      case 'M5S17':
      case 'M5S17_CancelOrder':
        return <LiveCancelRoute {...live} />;
      case 'M5S18':
      case 'M5S18_OrderInvoice':
        return <LiveInvoiceRoute {...live} />;
      default: {
        const external = renderExternalScreen?.(current.screen, params, { navigate, back });
        return external ?? dashboard;
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: adminColors.brand }}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      {/* key = stack depth: a fresh entry remounts, so `initialStep` applies even
          when the same screen is pushed twice (e.g. M5S11 verify, then M5S11 otp). */}
      <React.Fragment key={stack.length}>{renderScreen()}</React.Fragment>
    </View>
  );
}
