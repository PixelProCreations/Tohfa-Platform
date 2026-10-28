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
 * Route keys are the design ids ('M3S01'...'M3S17') because deep links from the
 * shells, notifications and App.tsx already use them. M3S08 (storage location
 * stock) was absorbed into the profile-settings StorageInfoScreen (W4 part B);
 * the 'M3S08' key renders that screen so ProductStockDetail's "View Storage
 * Locations" keeps working.
 *
 * Data is live and owned here (API integration plan, phase 3): each read-only
 * route's container fetches its own data through ./useInventoryData.ts and
 * passes it to the screen. The warehouse every request sends is computed once
 * with inventoryWarehouseFilter: a Sub scope always sends its own warehouse
 * uuid (BR-30), the Main view the warehouse picked in its selector (held here
 * so it survives moving between screens), or none for all warehouses.
 *
 * Stock counts (M3S10-M3S12, BR-107: /admin/stock-verifications) and stock
 * adjustments (M3S13, M3S14, M3S17, BR-37: /admin/stock-adjustments) are live.
 * They are gated by permission (availability.ts): counts on
 * inventory.stock_verification.perform, adjustments on
 * inventory.stock_adjustment.create. Without the code the flow refuses the
 * route, whatever the deep link, and renders the dashboard instead. Approve
 * and Reject inside M3S17 need inventory.stock_adjustment.approve (a Sub admin
 * never holds it, BR-37a). M3S17 opened without an `adjustmentId` (the Main
 * dashboard's "stock adjustment approval" link) shows the history on PENDING.
 * M3S15 (Movement Detail, design M3-16) renders the ledger row the user
 * tapped, carried in the route params: there is no GET /admin/stock-ledger/{id}.
 * Opened without a row it shows "not found" and fetches nothing. The old
 * sample-data movement detail / receipt screens (M3S15 / M3S18) are deleted.
 */
import React, { useEffect, useState } from 'react';
import { inventoryRouteArea, isAreaAvailable } from '../availability';
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
import { MovementDetailScreen } from './MovementDetailScreen';
import { movementParam } from './movementDetailMappers';
import { PhysicalCountScreen } from './PhysicalCountScreen';
import { ProductStockDetailScreen } from './ProductStockDetailScreen';
import { StockAdjustmentRequestScreen } from './StockAdjustmentRequestScreen';
import { StockAllocationDashboardScreen } from './StockAllocationDashboardScreen';
import { StockLedgerScreen } from './StockLedgerScreen';
import { StockListScreen } from './StockListScreen';
import { StockVerificationScreen } from './StockVerificationScreen';
import { VarianceReviewScreen } from './VarianceReviewScreen';
// File import, not the profile-settings barrel: the barrel pulls in ProfileFlow, which this flow never needs.
import { profileWarehouseId } from '../profile-settings/mappers';
import { LiveStorageInfo } from '../profile-settings/ProfileFlow';
import type { Grade } from '../../../api/inventory';
import { adjustmentFilterOf } from './adjustmentMappers';
import { inventoryWarehouseFilter } from './mappers';
import type {
  InventoryProductRef,
  InventoryRouteParams,
  InventoryScreenBaseProps,
  PermissionCheck,
  WarehouseScope,
  WarehouseTab,
} from './types';
import {
  useAllBatches,
  useAllocationDashboard,
  useBatch,
  useBatchList,
  useInventoryWarehouseName,
  useLowStockRows,
  useStockLedger,
  useStockSummary,
} from './useInventoryData';

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

/** The first screen of the module; also what a refused (hidden) route renders. */
const HOME_SCREEN = 'M3S01';

const GRADES: readonly Grade[] = ['GRADE_1', 'GRADE_2', 'GRADE_3', 'REJECT'];

/** A string route param, or undefined. */
function stringParam(params: InventoryRouteParams, key: string): string | undefined {
  const value: unknown = params?.[key];
  return typeof value === 'string' && value !== '' ? value : undefined;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A batch uuid route param, or undefined. Hosts that still hold sample data
 * (the receiving wizard's "View batch") pass a human code; that is not a batch
 * the API can look up, so the screen shows "not found" instead of a 422.
 */
function batchIdParam(params: InventoryRouteParams): string | undefined {
  return uuidParam(params, 'batchId');
}

/** A uuid route param (`verificationId`, `adjustmentId`, ...), or undefined for anything else. */
function uuidParam(params: InventoryRouteParams, key: string): string | undefined {
  const value = stringParam(params, key);
  return value !== undefined && UUID_RE.test(value) ? value : undefined;
}

/** The product a route param names, or undefined when it names none (or an unknown grade). */
function productParam(params: InventoryRouteParams): InventoryProductRef | undefined {
  const cropId = stringParam(params, 'cropId');
  const grade = stringParam(params, 'grade');
  if (cropId === undefined || grade === undefined) return undefined;
  const known = GRADES.find((g) => g === grade);
  return known === undefined ? undefined : { cropId, grade: known };
}

/** Props the flow hands every screen, plus the warehouse every request sends. */
type RouteCommon = InventoryScreenBaseProps & { warehouseId: string | undefined };

function LiveDashboardRoute({ warehouseId, ...common }: RouteCommon) {
  const live = useStockSummary(warehouseId);
  return (
    <InventoryDashboardScreen
      {...common}
      summary={live.summary}
      allocatedGrams={live.allocatedGrams}
      lowStockCount={live.lowStockCount}
      complete={live.complete}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
      onRefresh={live.refresh}
      isRefreshing={live.isRefreshing}
    />
  );
}

function LiveStockListRoute({
  warehouseId,
  initialTab,
  ...common
}: RouteCommon & { initialTab?: 'Stock' | 'Ledger' | 'Allocation' | 'Verify' | undefined }) {
  const live = useStockSummary(warehouseId);
  return (
    <StockListScreen
      {...common}
      initialTab={initialTab}
      products={live.summary.products}
      complete={live.complete}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
      onRefresh={live.refresh}
      isRefreshing={live.isRefreshing}
    />
  );
}

function LiveProductRoute({ warehouseId, ...common }: RouteCommon) {
  const ref = productParam(common.routeParams ?? null);
  const live = useStockSummary(warehouseId);
  const allocation = useAllocationDashboard(warehouseId, ref);
  const product =
    ref === undefined ? undefined : live.summary.products.find((p) => p.cropId === ref.cropId && p.grade === ref.grade);
  return (
    <ProductStockDetailScreen
      {...common}
      product={product}
      allocation={allocation.dashboard}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
      onRefresh={() => {
        live.refresh();
        allocation.refresh();
      }}
      isRefreshing={live.isRefreshing || allocation.isRefreshing}
    />
  );
}

function LiveBatchListRoute({ warehouseId, ...common }: RouteCommon) {
  const ref = productParam(common.routeParams ?? null);
  const list = useBatchList(warehouseId, ref?.cropId, ref?.grade);
  return (
    <BatchListScreen
      {...common}
      batches={list.items}
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

function LiveBatchDetailRoute({ warehouseId, ...common }: RouteCommon) {
  const live = useBatch(warehouseId, batchIdParam(common.routeParams ?? null));
  return (
    <BatchDetailScreen
      {...common}
      batch={live.batch}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
      onRefresh={live.refresh}
      isRefreshing={live.isRefreshing}
    />
  );
}

function LiveLedgerRoute({ warehouseId, ...common }: RouteCommon) {
  const batches = useAllBatches(warehouseId);
  const ledger = useStockLedger(warehouseId, batchIdParam(common.routeParams ?? null), batches.items);
  return (
    <StockLedgerScreen
      {...common}
      movements={ledger.items}
      batches={batches.items}
      isLoading={ledger.isLoading}
      error={ledger.error}
      onRetry={ledger.refresh}
      onRefresh={() => {
        ledger.refresh();
        batches.refresh();
      }}
      isRefreshing={ledger.isRefreshing}
      onLoadMore={ledger.loadMore}
      hasMore={ledger.hasMore}
    />
  );
}

function LiveAllocationRoute({ warehouseId, ...common }: RouteCommon) {
  const live = useAllocationDashboard(warehouseId);
  return (
    <StockAllocationDashboardScreen
      {...common}
      dashboard={live.dashboard}
      rowCount={live.rowCount}
      complete={live.complete}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
      onRefresh={live.refresh}
      isRefreshing={live.isRefreshing}
    />
  );
}

function LiveMovementDetailRoute({ warehouseId: _warehouseId, ...common }: RouteCommon) {
  const movement = movementParam(common.routeParams ?? null);
  // No row, no uuid: the hook fetches nothing and the screen shows "not found".
  const warehouseName = useInventoryWarehouseName(common.scope, common.can, movement?.warehouseId);
  return <MovementDetailScreen {...common} movement={movement} warehouseName={warehouseName} />;
}

function LiveLowStockRoute({
  warehouseId,
  onInitiateTransfer,
  ...common
}: RouteCommon & { onInitiateTransfer?: (() => void) | undefined }) {
  const live = useLowStockRows(warehouseId);
  return (
    <LowStockScreen
      {...common}
      items={live.rows}
      onInitiateTransfer={onInitiateTransfer}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
      onRefresh={live.refresh}
      isRefreshing={live.isRefreshing}
    />
  );
}

export function InventoryFlow({
  scope,
  can,
  initialScreen = HOME_SCREEN,
  initialParams = null,
  onBack,
  onTabChange,
  warehouseOptions,
  onInitiateTransfer,
  renderExternalScreen,
}: InventoryFlowProps) {
  const [stack, setStack] = useState<StackEntry[]>([{ screen: initialScreen, params: initialParams }]);
  // Main only: the warehouse picked in the selector (undefined = all). A Sub
  // scope ignores it; inventoryWarehouseFilter always sends its own warehouse.
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const warehouseId = inventoryWarehouseFilter(scope, selectedWarehouseId);
  /** False for a route of an area hidden from this viewer (no API, or no permission). */
  const isRouteAvailable = (screen: string): boolean => {
    const area = inventoryRouteArea(screen);
    return area === undefined || isAreaAvailable(area, can);
  };

  // The Sub shell re-targets the open module (e.g. a dashboard tile jumps to
  // 'M3S02'); a new initial screen restarts the stack, as the old shell did.
  useEffect(() => {
    setStack([{ screen: initialScreen, params: initialParams }]);
  }, [initialScreen, initialParams]);

  const current = stack[stack.length - 1] ?? { screen: initialScreen, params: initialParams };
  const params = current.params;

  const navigate = (screen: string, nextParams?: InventoryRouteParams) => {
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
    onTabChange,
    routeParams: params ?? undefined,
    warehouseOptions,
    selectedWarehouseId,
    onSelectWarehouse: setSelectedWarehouseId,
  };
  const live: RouteCommon = { ...common, warehouseId };

  // A deep link or an old host key into an area with no API opens the dashboard.
  const screen = isRouteAvailable(current.screen) ? current.screen : HOME_SCREEN;

  const renderScreen = (): React.ReactNode => {
    switch (screen) {
      case 'M3S01':
        return <LiveDashboardRoute {...live} />;
      case 'M3S02':
        return <LiveStockListRoute {...live} initialTab={params?.initialTab} />;
      case 'M3S03':
        return <LiveProductRoute {...live} />;
      case 'M3S04':
        return <LiveBatchListRoute {...live} />;
      case 'M3S05':
        return <LiveBatchDetailRoute {...live} />;
      case 'M3S06':
        return <LiveLedgerRoute {...live} />;
      case 'M3S07':
        return <LiveAllocationRoute {...live} />;
      case 'M3S08':
        // Live storage locations and capacity (plan phase 8), for the scope's own warehouse (BR-30).
        return (
          <LiveStorageInfo
            base={{ scope, can, onBack: back, onTabChange }}
            selection={{ warehouseOptions }}
            warehouseId={profileWarehouseId(scope, undefined)}
          />
        );
      case 'M3S09':
        return <LiveLowStockRoute {...live} onInitiateTransfer={onInitiateTransfer} />;
      case 'M3S10':
        return <StockVerificationScreen {...live} />;
      case 'M3S11':
        return <PhysicalCountScreen {...live} presetBatchId={batchIdParam(params)} />;
      case 'M3S12':
        return <VarianceReviewScreen {...live} verificationId={uuidParam(params, 'verificationId')} />;
      case 'M3S13':
        return <StockAdjustmentRequestScreen {...live} presetBatchId={batchIdParam(params)} />;
      case 'M3S14':
        return <AdjustmentHistoryScreen {...live} initialFilter={adjustmentFilterOf(params?.status)} />;
      case 'M3S15':
        return <LiveMovementDetailRoute {...live} />;
      case 'M3S16':
        return <InventoryFiltersScreen {...common} />;
      case 'M3S17': {
        const adjustmentId = uuidParam(params, 'adjustmentId');
        // No id (the Main dashboard's approval link): the approval queue.
        if (adjustmentId === undefined) return <AdjustmentHistoryScreen {...live} initialFilter="PENDING" />;
        return <AdjustmentDetailScreen {...live} adjustmentId={adjustmentId} />;
      }
      default: {
        const external = renderExternalScreen?.(current.screen, params, { navigate, back });
        return external ?? <LiveDashboardRoute {...live} />;
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
