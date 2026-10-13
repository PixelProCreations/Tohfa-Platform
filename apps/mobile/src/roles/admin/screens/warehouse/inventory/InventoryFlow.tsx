/**
 * In-module navigator for the inventory screens (design module M3).
 *
 * This used to live inside the Sub Warehouse shell (InventoryModule), so only
 * the Sub admin could reach these screens and the Main shell carried its own
 * copies (warehouse/StockLedgerScreen, LowStockAlertsScreen, VerifyStockScreen,
 * StockAdjustmentApprovalScreen). It now lives next to the screens and takes
 * `scope` + `can`, so both shells render the same flow: the Sub shell with its
 * own warehouse scope, the Main shell with MAIN_WAREHOUSE_SCOPE (all warehouses).
 *
 * Route keys are the design ids ('M3S01'...'M3S18') because deep links from the
 * shells, notifications and App.tsx already use them. M3S08 (storage location
 * stock) was absorbed into the profile-settings StorageInfoScreen (W4 part B);
 * the 'M3S08' key renders that screen so ProductStockDetail's "View Storage
 * Locations" keeps working.
 */
import React, { useEffect, useState } from 'react';
import { useFlowBack } from '../useFlowBack';
import { StatusBar, View } from 'react-native';
import { adminColors } from '../../../theme';
import { AdjustmentDetailScreen } from './AdjustmentDetailScreen';
import { AdjustmentHistoryScreen } from './AdjustmentHistoryScreen';
import { BatchDetailScreen } from './BatchDetailScreen';
import { BatchListScreen } from './BatchListScreen';
import { InventoryDashboardScreen } from './InventoryDashboardScreen';
import { InventoryFiltersScreen } from './InventoryFiltersScreen';
import { LowStockScreen } from './LowStockScreen';
import { PhysicalCountScreen } from './PhysicalCountScreen';
import { ProductStockDetailScreen } from './ProductStockDetailScreen';
import { StockAdjustmentRequestScreen } from './StockAdjustmentRequestScreen';
import { StockAllocationDashboardScreen } from './StockAllocationDashboardScreen';
import { StockLedgerScreen } from './StockLedgerScreen';
import { StockListScreen } from './StockListScreen';
import { StockMovementDetailScreen } from './StockMovementDetailScreen';
import { StockMovementReceiptScreen } from './StockMovementReceiptScreen';
import { StockVerificationScreen } from './StockVerificationScreen';
import { VarianceReviewScreen } from './VarianceReviewScreen';
// File import, not the profile-settings barrel: the barrel pulls in ProfileFlow, which this flow never needs.
import { StorageInfoScreen } from '../profile-settings/StorageInfoScreen';
import type { InventoryRouteParams, PermissionCheck, WarehouseScope, WarehouseTab } from './types';

/** Navigation handle given to `renderExternalScreen`. */
export interface InventoryFlowNavigation {
  navigate: (screen: string, params?: InventoryRouteParams) => void;
  back: () => void;
}

export interface InventoryFlowProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  initialScreen?: string | undefined;
  initialParams?: InventoryRouteParams | undefined;
  /** Leave the inventory module (pressed back on its first screen). */
  onBack: () => void;
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
  /** Warehouses for the Main all-warehouses selector (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  /** LowStockScreen 'Initiate Transfer' (rendered only with transfer.inter_warehouse.initiate). */
  onInitiateTransfer?: (() => void) | undefined;
  /** Host-owned screens reachable from inside the flow. Return null for keys you do not own. */
  renderExternalScreen?:
    | ((screen: string, params: InventoryRouteParams, nav: InventoryFlowNavigation) => React.ReactNode)
    | undefined;
}

interface StackEntry {
  screen: string;
  params: InventoryRouteParams;
}

export function InventoryFlow({
  scope,
  can,
  initialScreen = 'M3S01',
  initialParams = null,
  onBack,
  onTabChange,
  warehouseOptions,
  onInitiateTransfer,
  renderExternalScreen,
}: InventoryFlowProps) {
  const [stack, setStack] = useState<StackEntry[]>([{ screen: initialScreen, params: initialParams }]);

  // The Sub shell re-targets the open module (e.g. a dashboard tile jumps to
  // 'M3S10'); a new initial screen restarts the stack, as the old shell did.
  useEffect(() => {
    setStack([{ screen: initialScreen, params: initialParams }]);
  }, [initialScreen, initialParams]);

  const current = stack[stack.length - 1] ?? { screen: initialScreen, params: initialParams };
  const params = current.params;

  const navigate = (screen: string, nextParams?: InventoryRouteParams) => {
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
    onTabChange,
    routeParams: params ?? undefined,
    warehouseOptions,
  };

  const renderScreen = (): React.ReactNode => {
    switch (current.screen) {
      case 'M3S01':
        return <InventoryDashboardScreen {...common} />;
      case 'M3S02':
        return <StockListScreen {...common} initialTab={params?.initialTab} />;
      case 'M3S03':
        return <ProductStockDetailScreen {...common} />;
      case 'M3S04':
        return <BatchListScreen {...common} />;
      case 'M3S05':
        return <BatchDetailScreen {...common} />;
      case 'M3S06':
        return <StockLedgerScreen {...common} />;
      case 'M3S07':
        return <StockAllocationDashboardScreen {...common} />;
      case 'M3S08':
        return <StorageInfoScreen scope={scope} can={can} onBack={back} onTabChange={onTabChange} warehouseOptions={warehouseOptions} />;
      case 'M3S09':
        return <LowStockScreen {...common} onInitiateTransfer={onInitiateTransfer} />;
      case 'M3S10':
        return <StockVerificationScreen {...common} />;
      case 'M3S11':
        return <PhysicalCountScreen {...common} />;
      case 'M3S12':
        return <VarianceReviewScreen {...common} />;
      case 'M3S13':
        return <StockAdjustmentRequestScreen {...common} />;
      case 'M3S14':
        return <AdjustmentHistoryScreen {...common} />;
      case 'M3S15':
        return <StockMovementDetailScreen {...common} />;
      case 'M3S16':
        return <InventoryFiltersScreen {...common} />;
      case 'M3S17':
        return <AdjustmentDetailScreen {...common} />;
      case 'M3S18':
        return <StockMovementReceiptScreen {...common} />;
      default: {
        const external = renderExternalScreen?.(current.screen, params, { navigate, back });
        return external ?? <InventoryDashboardScreen {...common} />;
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: adminColors.brand }}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <React.Fragment key={stack.length}>{renderScreen()}</React.Fragment>
    </View>
  );
}
