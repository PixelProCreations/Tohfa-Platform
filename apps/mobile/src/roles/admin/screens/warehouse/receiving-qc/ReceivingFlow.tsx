/**
 * In-module navigator for the warehouse goods receiving screens, shared by the
 * Main and Sub shells.
 *
 *   Dashboard -> Incoming Shipments -> (Quick View) -> Shipment Detail -> Goods Receiving wizard
 *                                   -> Search & Filters (Main: warehouse)
 *             -> Receiving History  -> Receiving History Detail -> Shipment Detail / wizard (resume QC)
 *                                   -> Search & Filters (Main: warehouse + result)
 *             -> Quality Issues     -> wizard (resume QC)
 *             -> Start Receiving    -> Incoming Shipments (pick the order to receive)
 *             -> Receiving Activity -> Receiving History Detail       (Main, design M2-01)
 *             -> Pending Queue      -> Shipment Detail                (Main, design M2-01)
 *   Shipment Detail -> Shipment Product / Shipment Timeline           (design M2-04 sub-views)
 *   Receiving History Detail -> Receipt Activity (its Timeline tile)  (design M2-12C)
 * Each sub-view is a route of its own so hardware back returns to its parent.
 *
 * Data is live and owned here (API integration plan, phase 4): each route's
 * container fetches its own data through ./useReceivingData.ts and passes it to
 * the screen. The warehouse every request sends is computed once with
 * receivingWarehouseFilter: a Sub scope always sends its own warehouse uuid
 * (BR-30); the Main view sends none (all warehouses), except on the dashboard
 * and the lists when a warehouse was picked (route param `filterWarehouseId`,
 * set by the dashboard's selector or Search & Filters). The dashboard hands
 * its pick on to every list it opens, so their figures match.
 *
 * The Main scope names no warehouse, so the flow loads GET /warehouses
 * (warehouse.all.view) and names every row's warehouse from its uuid; without
 * that list a name shows as "—", never blank.
 *
 * Route params carry uuids: `shipmentId` is the purchase order id, `receiptId`
 * the goods receipt id. The wizard needs an order: opened without one (an old
 * shell sub-view key), it shows the shipment list to pick one.
 *
 * Search & Filters carries only what the list endpoints take (warehouseId on
 * both; the receipt status on Receiving History) and is offered only where it
 * adds the warehouse facet, i.e. to Main (mappers.ts offersReceivingFilters).
 * Apply writes the facets into the list's route params, so the list refetches
 * with them as server-side query params.
 *
 * Not offered, because the API has nothing behind them: the storage location
 * assignment screen (storage-ops sample data; the wizard picks a real storage
 * location itself, sent on the quality check, BR-106) and the discrepancy
 * report (not persisted). The receipt timeline is the Receipt Activity view,
 * built from what the receipt carries. Transfer Receiving is offered only
 * while inter-warehouse transfers have an API (availability.ts).
 *
 * Gates: the lists need inventory.batch.view or inventory.goods_receipt.record
 * (each screen renders a note without them); the wizard route needs
 * inventory.goods_receipt.record (navigate() refuses it, and the wizard gates
 * each step again). The server re-checks every action (CLAUDE.md 2.1).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { adminColors } from '../../../theme';
import { isAreaAvailable } from '../availability';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import { useFlowBack } from '../useFlowBack';

import { GoodsReceivingWizardScreen } from './GoodsReceivingWizardScreen';
import { PendingQueueScreen, ReceivingActivityScreen } from './ReceivingActivityScreens';
import { IncomingShipmentsScreen } from './IncomingShipmentsScreen';
import {
  HISTORY_FILTER_STATUS,
  isMainScope,
  offersReceivingFilters,
  receivingFilterParams,
  receivingWarehouseFilter,
  warehouseNameFor,
  type WarehouseNaming,
} from './mappers';
import { QualityIssuesScreen } from './QualityIssuesScreen';
import { ReceivingDashboardScreen } from './ReceivingDashboardScreen';
import { ReceivingHistoryDetailScreen } from './ReceivingHistoryDetailScreen';
import { ReceivingHistoryScreen } from './ReceivingHistoryScreen';
import { RECEIVING_CODES } from './ReceivingParts';
import { ReceivingSearchFiltersScreen } from './ReceivingSearchFiltersScreen';
import { ShipmentDetailScreen } from './ShipmentDetailScreen';
import type {
  HistoryFilter,
  IncomingShipment,
  PermissionCheck,
  QualityIssue,
  ReceivingFilters,
  ReceivingFilterTarget,
  ReceivingRoute,
  ReceivingRouteParams,
  ReceivingWizardStep,
  WarehouseScope,
  WarehouseTab,
} from './types';
import {
  usePurchaseOrder,
  useReceipt,
  useReceiptHistory,
  useReceiptBatch,
  useReceivingDashboard,
  useReceivingWrites,
  useShipmentList,
  useStorageLocations,
} from './useReceivingData';
import type { GoodsReceiptDto } from '../../../api/receiving';

interface ReceivingStackEntry {
  screen: ReceivingRoute;
  params?: ReceivingRouteParams | undefined;
}

/**
 * Old shell sub-view keys (Sub receivingSubView, Main receivingSubView /
 * whSubView) -> route. The keys that named a wizard step or one shipment carry
 * no order, so they open the shipment list to pick one; the storage assignment
 * key opens a screen that is not offered, so it opens the dashboard. The search
 * key opens the shipment list, where Search & Filters is offered (Main).
 */
const SUB_VIEW_ROUTE: Record<string, ReceivingStackEntry> = {
  overview: { screen: 'Dashboard' },
  dashboard: { screen: 'Dashboard' },
  incoming_goods_ops: { screen: 'Dashboard' },
  incoming_shipments: { screen: 'Shipments' },
  search_filters: { screen: 'Shipments' },
  shipment_detail: { screen: 'Shipments' },
  receiving_history: { screen: 'History' },
  receiving_history_detail: { screen: 'History' },
  quality_issues_ops: { screen: 'QualityIssues' },
  storage_location_assignment: { screen: 'Dashboard' },
  start_receiving: { screen: 'Shipments' },
  quantity_verification: { screen: 'Shipments' },
  quality_check: { screen: 'QualityIssues' },
  grade_product_verification: { screen: 'Shipments' },
  damage_mismatch_report: { screen: 'Shipments' },
  acceptance_decision: { screen: 'Shipments' },
  partial_acceptance: { screen: 'Shipments' },
  goods_receipt_summary: { screen: 'History' },
  batch_assignment: { screen: 'Shipments' },
};

/** Route and params for an old shell sub-view key; unknown keys open the dashboard. */
export function receivingRouteFor(subView: string | undefined): ReceivingStackEntry {
  return (subView !== undefined ? SUB_VIEW_ROUTE[subView] : undefined) ?? { screen: 'Dashboard' };
}

/** True when `can` allows opening `route` (only the wizard routes are gated here). */
export function canOpenReceivingRoute(route: ReceivingRoute, can: PermissionCheck): boolean {
  if (route === 'Wizard' || route === 'StorageAssignment') return can(RECEIVING_CODES.receiptRecord);
  return true;
}

export interface ReceivingFlowProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  initialScreen?: ReceivingRoute | undefined;
  initialParams?: ReceivingRouteParams | undefined;
  /** Leave the module (pressed back on its first screen). */
  onBack: () => void;
  /** Bottom tabs on the dashboard. */
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
  /** Receiver name for the wizard's Start Receiving step. */
  receiverName?: string | undefined;
  unreadNotifications?: number | undefined;
  onOpenNotifications?: (() => void) | undefined;
  /** Main: dashboard Transfer Receiving card (the transfers flow); offered only while transfers have an API. */
  onOpenTransferReceiving?: (() => void) | undefined;
  /** Quality Issues "View Operational Issues" (storage-ops), when the host offers it. */
  onOpenOperationalIssues?: (() => void) | undefined;
  /**
   * Unused: the receipt's Timeline tile opens the flow's own Receipt Activity
   * route (design M2-12C). Kept so hosts compile unchanged.
   */
  onOpenTimeline?: (() => void) | undefined;
  /** Inventory Batch Detail for a batch the API returned (inventory.batch.view). */
  onViewBatch?: ((batchId: string) => void) | undefined;
  /** Where a finished receipt lands: the dashboard (default) or Receiving History. */
  finishTo?: 'Dashboard' | 'History' | undefined;
}

export function ReceivingFlow({
  scope,
  can,
  initialScreen = 'Dashboard',
  initialParams,
  onBack,
  onTabChange,
  receiverName,
  unreadNotifications,
  onOpenNotifications,
  onOpenTransferReceiving,
  onOpenOperationalIssues,
  onViewBatch,
  finishTo = 'Dashboard',
}: ReceivingFlowProps) {
  const [stack, setStack] = useState<ReceivingStackEntry[]>(() => [{ screen: initialScreen, params: initialParams }]);

  // A host that re-targets the module restarts the stack (keyed on values so
  // inline params do not reset it on every render).
  const presetKey = [
    initialParams?.shipmentId,
    initialParams?.receiptId,
    initialParams?.statusTab,
    initialParams?.historyFilter,
    initialParams?.wizardStep,
  ].join('|');
  useEffect(() => {
    setStack([{ screen: initialScreen, params: initialParams }]);
    // initialParams is read through presetKey on purpose (see above).
  }, [initialScreen, presetKey]);

  const current = stack[stack.length - 1] ?? { screen: initialScreen, params: initialParams };
  const params: ReceivingRouteParams = current.params ?? {};

  const navigate = (screen: ReceivingRoute, nextParams?: ReceivingRouteParams) => {
    if (!canOpenReceivingRoute(screen, can)) return;
    setStack((prev) => [...prev, { screen, params: nextParams }]);
  };
  const back = () => {
    if (stack.length > 1) setStack((prev) => prev.slice(0, -1));
    else onBack();
  };
  /** Pop back to the nearest `screen` on the stack, or restart the stack on it. */
  const backTo = (screen: ReceivingRoute, nextParams?: ReceivingRouteParams) => {
    setStack((prev) => {
      const index = prev.map((e) => e.screen).lastIndexOf(screen);
      return index >= 0 ? prev.slice(0, index + 1) : [{ screen, params: nextParams }];
    });
  };

  // Hardware back walks the flow's own stack (the shells defer to it while it is open).
  // Always handled: at the root back() hands over to the host through onBack.
  useFlowBack(() => {
    back();
    return true;
  });

  /** Replace the params of the screen on top (a list's own pill or filter choice). */
  const setParams = (patch: ReceivingRouteParams) => {
    setStack((prev) => prev.map((e, i) => (i === prev.length - 1 ? { ...e, params: { ...e.params, ...patch } } : e)));
  };
  /**
   * Search & Filters Apply: pop the filters screen and narrow the list it was
   * opened from (opened as the first screen, it becomes that list).
   */
  const applyFilters = (target: ReceivingFilterTarget, filters: ReceivingFilters) => {
    const patch = receivingFilterParams(scope, filters, target);
    setStack((prev) => {
      const below = prev.slice(0, -1);
      const list = below[below.length - 1];
      if (list === undefined || list.screen !== target) return [...below, { screen: target, params: patch }];
      return [...below.slice(0, -1), { ...list, params: { ...list.params, ...patch } }];
    });
  };

  // The Main scope names no warehouse: name rows from GET /warehouses (a Sub
  // admin gets 403 there and needs it not: its scope carries its own name).
  const mainView = isMainScope(scope);
  const warehouseList = useWarehouseOptions({ enabled: mainView && can('warehouse.all.view') });
  const naming: WarehouseNaming = useMemo(
    () => ({
      warehouseName: scope.warehouseName,
      warehouseNames: new Map(warehouseList.options.map((w) => [w.warehouseId, w.warehouseName])),
    }),
    [scope.warehouseName, warehouseList.options],
  );
  /** The dashboard selector's choices (the shared ScopeHeader picker takes WarehouseScope rows). */
  const warehouseOptions = useMemo(
    () => warehouseList.options.map((w) => ({ warehouseId: w.warehouseId, warehouseName: w.warehouseName })),
    [warehouseList.options],
  );

  /** BR-30: a Sub scope always sends its own warehouse uuid. */
  const warehouseId = receivingWarehouseFilter(scope, undefined);
  const common = { scope, can, onBack: back };
  const live = { warehouseId, naming };
  /** The two lists send the Main warehouse pick; a Sub scope still sends its own (BR-30). */
  const listWarehouseId = receivingWarehouseFilter(scope, params.filterWarehouseId);
  const listLive = { warehouseId: listWarehouseId, naming };
  /** Main header pill: the picked warehouse's name (undefined = the default "All Warehouses"). */
  const pickedLabel =
    mainView && params.filterWarehouseId !== undefined ? warehouseNameFor(params.filterWarehouseId, naming) : undefined;
  const filtersFor = (target: ReceivingFilterTarget) =>
    offersReceivingFilters(scope, can, target)
      ? () =>
          navigate('SearchFilters', {
            filterTarget: target,
            filterWarehouseId: params.filterWarehouseId,
            historyFilter: params.historyFilter,
          })
      : undefined;
  const openWizard = (wizardStep: ReceivingWizardStep, purchaseOrderId: string) =>
    navigate('Wizard', { wizardStep, shipmentId: purchaseOrderId });
  const openIssue = (issue: QualityIssue) => openWizard('quality_check', issue.purchaseOrderId);
  const openShipment = (purchaseOrderId: string) => navigate('ShipmentDetail', { shipmentId: purchaseOrderId });
  const startReceiving = (s: IncomingShipment, resume: boolean) =>
    openWizard(resume ? 'quality_check' : 'start_receiving', s.purchaseOrderId);
  /** A list opened from the dashboard keeps its warehouse pick (undefined for a Sub scope, BR-30). */
  const picked = { filterWarehouseId: mainView ? params.filterWarehouseId : undefined };
  const transferReceiving = isAreaAvailable('interWarehouseTransfers', can) ? onOpenTransferReceiving : undefined;

  switch (current.screen) {
    case 'SearchFilters':
      return (
        <ReceivingSearchFiltersScreen
          {...common}
          target={params.filterTarget ?? 'Shipments'}
          initialFilters={{ warehouseId: params.filterWarehouseId, result: params.historyFilter ?? 'All' }}
          onApply={(filters) => applyFilters(params.filterTarget ?? 'Shipments', filters)}
        />
      );
    case 'Shipments':
      return (
        <ShipmentsRoute
          {...common}
          {...listLive}
          key={params.statusTab ?? 'All'}
          initialTab={params.statusTab}
          scopeLabel={pickedLabel}
          onOpenFilters={filtersFor('Shipments')}
          onSelectShipment={openShipment}
          onStartReceiving={startReceiving}
        />
      );
    case 'ShipmentDetail':
    case 'ShipmentProduct':
    case 'ShipmentTimeline':
      return params.shipmentId === undefined ? (
        <ShipmentsRoute {...common} {...live} onSelectShipment={openShipment} onStartReceiving={startReceiving} />
      ) : (
        <ShipmentDetailRoute
          {...common}
          {...live}
          purchaseOrderId={params.shipmentId}
          view={current.screen === 'ShipmentProduct' ? 'product' : current.screen === 'ShipmentTimeline' ? 'timeline' : 'main'}
          onOpenProduct={() => navigate('ShipmentProduct', { shipmentId: params.shipmentId })}
          onOpenTimeline={() => navigate('ShipmentTimeline', { shipmentId: params.shipmentId })}
          onStartReceiving={startReceiving}
        />
      );
    case 'ReceivingActivity':
      return (
        <DashboardListRoute
          {...common}
          {...listLive}
          kind="activity"
          scopeLabel={pickedLabel}
          onSelectRecord={(receiptId) => navigate('HistoryDetail', { receiptId })}
          onSelectShipment={openShipment}
        />
      );
    case 'PendingQueue':
      return (
        <DashboardListRoute
          {...common}
          {...listLive}
          kind="queue"
          scopeLabel={pickedLabel}
          onSelectRecord={(receiptId) => navigate('HistoryDetail', { receiptId })}
          onSelectShipment={openShipment}
        />
      );
    case 'History':
      return (
        <HistoryRoute
          {...common}
          {...listLive}
          filter={params.historyFilter ?? 'All'}
          onChangeFilter={(historyFilter) => setParams({ historyFilter })}
          scopeLabel={pickedLabel}
          onOpenFilters={filtersFor('History')}
          onSelectRecord={(receiptId) => navigate('HistoryDetail', { receiptId })}
        />
      );
    case 'HistoryDetail':
    case 'ReceiptActivity':
      return (
        <HistoryDetailRoute
          {...common}
          {...live}
          view={current.screen === 'ReceiptActivity' ? 'activity' : 'main'}
          receiptId={params.receiptId}
          onNavigateTimeline={() => navigate('ReceiptActivity', { receiptId: params.receiptId })}
          onNavigateShipment={openShipment}
          onNavigateBatch={onViewBatch}
          onTakeAction={(purchaseOrderId) => openWizard('quality_check', purchaseOrderId)}
        />
      );
    case 'QualityIssues':
      return (
        // The dashboard's warehouse pick carries over, so the list matches its Awaiting QC tile.
        <QualityIssuesRoute {...common} {...listLive} onSelectIssue={openIssue} onOpenOperationalIssues={onOpenOperationalIssues} />
      );
    case 'Wizard':
      return params.shipmentId === undefined ? (
        <ShipmentsRoute {...common} {...live} onSelectShipment={openShipment} onStartReceiving={startReceiving} />
      ) : (
        <WizardRoute
          {...common}
          {...live}
          key={params.shipmentId}
          purchaseOrderId={params.shipmentId}
          initialStep={params.wizardStep ?? 'start_receiving'}
          receiverName={receiverName}
          onFinish={() => backTo(finishTo)}
          onBackToShipments={() => backTo('Shipments')}
          onViewBatch={onViewBatch}
          onViewReceipt={(receiptId) => navigate('HistoryDetail', { receiptId })}
          onViewHistory={() => navigate('History')}
        />
      );
    case 'Dashboard':
    case 'StorageAssignment':
    default:
      return (
        <DashboardRoute
          {...common}
          {...listLive}
          onTabChange={onTabChange}
          warehouseOptions={mainView ? warehouseOptions : undefined}
          selectedWarehouseId={picked.filterWarehouseId}
          onSelectWarehouse={mainView ? (filterWarehouseId) => setParams({ filterWarehouseId }) : undefined}
          unreadNotifications={unreadNotifications}
          onOpenNotifications={onOpenNotifications}
          onOpenShipments={(statusTab) => navigate('Shipments', { statusTab, ...picked })}
          onOpenHistory={(historyFilter) => navigate('History', { historyFilter, ...picked })}
          onOpenQualityIssues={() => navigate('QualityIssues', picked)}
          onSelectIssue={openIssue}
          onSelectRecord={(receiptId) => navigate('HistoryDetail', { receiptId })}
          onStartReceiving={() => navigate('Shipments', { statusTab: 'All', ...picked })}
          onOpenActivity={mainView ? () => navigate('ReceivingActivity', picked) : undefined}
          onOpenPendingQueue={mainView ? () => navigate('PendingQueue', picked) : undefined}
          onOpenTransferReceiving={transferReceiving}
        />
      );
  }
}

// ─── Route containers: each fetches its own data ────────────────────────────

interface RouteBase {
  scope: WarehouseScope;
  can: PermissionCheck;
  onBack: () => void;
  /** The warehouse every request sends (receivingWarehouseFilter). */
  warehouseId: string | undefined;
  /** Names each row's warehouse (the scope's own, or GET /warehouses for Main). */
  naming: WarehouseNaming;
}

function DashboardRoute({
  warehouseId,
  naming,
  ...props
}: RouteBase & Omit<React.ComponentProps<typeof ReceivingDashboardScreen>, 'scope' | 'can' | 'onBack'>) {
  const live = useReceivingDashboard(warehouseId, naming);
  return (
    <ReceivingDashboardScreen
      {...props}
      shipments={live.shipments}
      records={live.records}
      issues={live.issues}
      complete={live.complete}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
      onRefresh={live.refresh}
      isRefreshing={live.isRefreshing}
    />
  );
}

function ShipmentsRoute({
  warehouseId,
  naming,
  ...props
}: RouteBase & {
  initialTab?: React.ComponentProps<typeof IncomingShipmentsScreen>['initialTab'];
  scopeLabel?: string | undefined;
  onOpenFilters?: (() => void) | undefined;
  onSelectShipment: (purchaseOrderId: string) => void;
  onStartReceiving?: ((shipment: IncomingShipment, resume: boolean) => void) | undefined;
}) {
  const list = useShipmentList(warehouseId, naming);
  return (
    <IncomingShipmentsScreen
      {...props}
      shipments={list.items}
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

function ShipmentDetailRoute({
  warehouseId,
  naming,
  purchaseOrderId,
  ...props
}: RouteBase & {
  purchaseOrderId: string;
  view: React.ComponentProps<typeof ShipmentDetailScreen>['view'];
  onOpenProduct: () => void;
  onOpenTimeline: () => void;
  onStartReceiving: (shipment: IncomingShipment, resume: boolean) => void;
}) {
  const live = usePurchaseOrder(warehouseId, purchaseOrderId, naming);
  return (
    <ShipmentDetailScreen
      {...props}
      shipment={live.shipment}
      records={live.records}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
      onRefresh={live.refresh}
      isRefreshing={live.isRefreshing}
    />
  );
}

/** The pill lives in the route params, so Search & Filters can open on it and set it. */
function HistoryRoute({
  warehouseId,
  naming,
  ...props
}: RouteBase & {
  filter: HistoryFilter;
  onChangeFilter: (filter: HistoryFilter) => void;
  scopeLabel?: string | undefined;
  onOpenFilters?: (() => void) | undefined;
  onSelectRecord: (receiptId: string) => void;
}) {
  const list = useReceiptHistory(warehouseId, HISTORY_FILTER_STATUS[props.filter], naming);
  return (
    <ReceivingHistoryScreen
      {...props}
      records={list.items}
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

function HistoryDetailRoute({
  warehouseId,
  naming,
  receiptId,
  onNavigateShipment,
  onNavigateBatch,
  onTakeAction,
  ...props
}: RouteBase & {
  view: 'main' | 'activity';
  receiptId: string | undefined;
  onNavigateTimeline: () => void;
  onNavigateShipment: (purchaseOrderId: string) => void;
  onNavigateBatch?: ((batchId: string) => void) | undefined;
  onTakeAction: (purchaseOrderId: string) => void;
}) {
  const live = useReceipt(warehouseId, receiptId, naming);
  const rec = live.record;
  // BR-106: the assigned grade is the batch's; GET /admin/batches/{id} needs inventory.batch.view.
  const batch = useReceiptBatch(warehouseId, rec?.batchId, props.can(RECEIVING_CODES.batchView));
  return (
    <ReceivingHistoryDetailScreen
      {...props}
      record={rec}
      batch={batch.batch}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
      onRefresh={live.refresh}
      isRefreshing={live.isRefreshing}
      onNavigateShipment={rec === undefined ? undefined : () => onNavigateShipment(rec.purchaseOrderId)}
      onNavigateBatch={onNavigateBatch}
      onTakeAction={rec === undefined ? undefined : () => onTakeAction(rec.purchaseOrderId)}
    />
  );
}

/** The dashboard's Receiving Activity and Pending Queue: the dashboard's two lists, for its warehouse. */
function DashboardListRoute({
  warehouseId,
  naming,
  kind,
  onSelectRecord,
  onSelectShipment,
  ...props
}: RouteBase & {
  kind: 'activity' | 'queue';
  scopeLabel?: string | undefined;
  onSelectRecord: (receiptId: string) => void;
  onSelectShipment: (purchaseOrderId: string) => void;
}) {
  const live = useReceivingDashboard(warehouseId, naming);
  const state = {
    ...props,
    complete: live.complete,
    isLoading: live.isLoading,
    error: live.error,
    onRetry: live.refresh,
    onRefresh: live.refresh,
    isRefreshing: live.isRefreshing,
  };
  return kind === 'activity' ? (
    <ReceivingActivityScreen {...state} records={live.records} onSelectRecord={onSelectRecord} />
  ) : (
    <PendingQueueScreen {...state} shipments={live.shipments} onSelectShipment={onSelectShipment} />
  );
}

function QualityIssuesRoute({
  warehouseId,
  naming,
  ...props
}: RouteBase & { onSelectIssue: (issue: QualityIssue) => void; onOpenOperationalIssues?: (() => void) | undefined }) {
  const live = useReceivingDashboard(warehouseId, naming);
  return (
    <QualityIssuesScreen
      {...props}
      issues={live.issues}
      records={live.records}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
      onRefresh={live.refresh}
      isRefreshing={live.isRefreshing}
    />
  );
}

function WizardRoute({
  warehouseId,
  naming,
  purchaseOrderId,
  ...props
}: RouteBase & {
  purchaseOrderId: string;
  initialStep: ReceivingWizardStep;
  receiverName?: string | undefined;
  onFinish: () => void;
  onBackToShipments: () => void;
  onViewBatch?: ((batchId: string) => void) | undefined;
  onViewReceipt: (receiptId: string) => void;
  onViewHistory: () => void;
}) {
  const order = usePurchaseOrder(warehouseId, purchaseOrderId, naming);
  const writes = useReceivingWrites();
  // The order as it was when the wizard opened. A submit refetches the order
  // (its new receipt then shows as pending); the wizard must keep its own state
  // rather than remount on that, so the first loaded order is kept.
  const opened = useRef<{ shipment: IncomingShipment; pendingReceipt: GoodsReceiptDto | undefined } | null>(null);
  if (opened.current === null && order.shipment !== undefined) {
    opened.current = { shipment: order.shipment, pendingReceipt: order.pendingReceipt };
  }
  const locations = useStorageLocations(warehouseId ?? opened.current?.shipment.warehouseId);

  if (opened.current === null) {
    return (
      <View style={styles.screen}>
        {order.isLoading ? <AdminLoadingState /> : <AdminErrorState error={order.error} onRetry={order.refresh} />}
      </View>
    );
  }
  const { shipment, pendingReceipt } = opened.current;
  // The order is kept as first loaded, but the Main warehouse list may load
  // after it: name the destination now rather than from the frozen copy.
  const to = warehouseNameFor(shipment.warehouseId, naming) ?? shipment.to;
  return (
    <GoodsReceivingWizardScreen
      {...props}
      // A receipt awaiting QC is completed, never received again.
      initialStep={pendingReceipt !== undefined ? 'quality_check' : props.initialStep}
      shipment={to === shipment.to ? shipment : { ...shipment, to }}
      naming={naming}
      pendingReceipt={pendingReceipt}
      storageLocations={locations.options}
      storageLocationsLoading={locations.isLoading}
      writes={writes}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: adminColors.canvas },
});
