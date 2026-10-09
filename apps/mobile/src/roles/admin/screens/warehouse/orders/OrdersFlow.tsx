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
 */
import React, { useState } from 'react';
import { StatusBar, View } from 'react-native';
import { adminColors } from '../../../theme';
import { OrderFiltersScreen } from '../customers';
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
import type { PermissionCheck, WarehouseScope, WarehouseTab } from './types';

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

export function OrdersFlow({
  scope,
  can,
  initialScreen = 'M5S01',
  initialParams = null,
  onBack,
  onTabChange,
  onViewIssue,
  renderExternalScreen,
}: OrdersFlowProps) {
  // Params live on the stack entry so going back restores the previous
  // screen's order and step (the old shell reset them to null on back).
  const [stack, setStack] = useState<StackEntry[]>([{ screen: initialScreen, params: initialParams }]);
  const current = stack[stack.length - 1] ?? { screen: initialScreen, params: initialParams };
  const params = current.params;

  const navigate = (screen: string, nextParams?: OrdersRouteParams) => {
    setStack((prev) => [...prev, { screen, params: nextParams ?? null }]);
  };

  const back = () => {
    if (stack.length > 1) {
      setStack((prev) => prev.slice(0, -1));
    } else {
      onBack();
    }
  };

  const common = {
    scope,
    can,
    onBack: back,
    onNavigate: (screen: string, nextParams?: Record<string, unknown>) => navigate(screen, nextParams ?? null),
  };
  const orderId: string | undefined = params?.orderId;

  const renderScreen = (): React.ReactNode => {
    switch (current.screen) {
      case 'M5S01':
      case 'M5S01_OrdersDashboard':
        return <OrdersDashboardScreen {...common} onTabChange={onTabChange} />;
      case 'M5S02':
      case 'M5S02_OrdersList':
        return <OrdersListScreen {...common} routeParams={params ?? undefined} />;
      case 'M5S03':
      case 'M5S03_SearchFilters':
        // The order-queue filters are the shared OrderFiltersScreen ('order'
        // config, queue variant) since the customers wave folded M5S03 into it.
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
        return <OrderDetailScreen {...common} orderId={orderId} customerName={params?.customerName} />;
      case 'M5S05':
      case 'M5S05_StockCheck':
        return <StockCheckScreen {...common} orderId={orderId} initialStep={params?.step} />;
      case 'M5S07':
      case 'M5S07_Packing':
        return <PackingScreen {...common} orderId={orderId} initialStep={params?.step} />;
      case 'M5S09':
      case 'M5S09_ReadyForPickup':
        return <ReadyForPickupScreen {...common} />;
      case 'M5S11':
      case 'M5S11_PickupOTP':
        return <PickupOtpScreen {...common} orderId={orderId} initialStep={params?.step} />;
      case 'M5S13':
      case 'M5S13_DeliveryPreparation':
        return <DeliveryPreparationScreen {...common} orderId={orderId} />;
      case 'M5S14':
      case 'M5S14_Dispatch':
        return <DispatchScreen {...common} orderId={orderId} initialStep={params?.step} />;
      case 'M5S15':
      case 'M5S15_OrderStatusHistory':
        return <OrderStatusHistoryScreen {...common} orderId={orderId} />;
      case 'M5S16':
      case 'M5S16_OrderIssue':
        return (
          <OrderIssueScreen
            {...common}
            orderId={orderId}
            initialStep={params?.step}
            issueId={params?.issueId}
            onViewIssue={onViewIssue}
          />
        );
      case 'M5S17':
      case 'M5S17_CancelOrder':
        return <CancelOrderScreen {...common} orderId={orderId} />;
      case 'M5S18':
      case 'M5S18_OrderInvoice':
        return <OrderInvoiceScreen {...common} orderId={orderId} />;
      default: {
        const external = renderExternalScreen?.(current.screen, params, { navigate, back });
        return external ?? <OrdersDashboardScreen {...common} onTabChange={onTabChange} />;
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: adminColors.brand }}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      {/* key = stack depth: a fresh entry remounts, so `initialStep` applies even
          when the same screen is pushed twice (e.g. M5S11 verify, then M5S11 otp). */}
      <React.Fragment key={stack.length}>{renderScreen()}</React.Fragment>
    </View>
  );
}
