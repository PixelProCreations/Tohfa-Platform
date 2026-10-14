/**
 * In-module navigator for the warehouse goods receiving screens, shared by the
 * Main and Sub shells.
 *
 *   Dashboard -> Incoming Shipments -> Shipment Detail -> Goods Receiving wizard
 *             -> Receiving History  -> Receiving History Detail -> Shipment Detail / wizard (resume QC)
 *             -> Quality Issues     -> wizard (resume QC)
 *             -> Start Receiving    -> Incoming Shipments (pick the order to receive)
 *
 * Data is live and owned here (API integration plan, phase 4): each route's
 * container fetches its own data through ./useReceivingData.ts and passes it to
 * the screen. The warehouse every request sends is computed once with
 * receivingWarehouseFilter: a Sub scope always sends its own warehouse uuid
 * (BR-30); the Main view sends none (all warehouses).
 *
 * Route params carry uuids: `shipmentId` is the purchase order id, `receiptId`
 * the goods receipt id. The wizard needs an order: opened without one (an old
 * shell sub-view key), it shows the shipment list to pick one.
 *
 * Not offered, because the API has nothing behind them: Search & Filters (no
 * list takes its facets), the storage location assignment screen (storage-ops
 * sample data; the wizard picks a real storage location itself), the receipt
 * timeline and the discrepancy report. Transfer Receiving is offered only while
 * inter-warehouse transfers have an API (availability.ts).
 *
 * Gates: the lists need inventory.batch.view or inventory.goods_receipt.record
 * (each screen renders a note without them); the wizard route needs
 * inventory.goods_receipt.record (navigate() refuses it, and the wizard gates
 * each step again). The server re-checks every action (CLAUDE.md 2.1).
 */
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { adminColors } from '../../../theme';
import { isAreaAvailable } from '../availability';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { useFlowBack } from '../useFlowBack';

import { GoodsReceivingWizardScreen } from './GoodsReceivingWizardScreen';
import { IncomingShipmentsScreen } from './IncomingShipmentsScreen';
import { HISTORY_FILTER_STATUS, receivingWarehouseFilter } from './mappers';
import { QualityIssuesScreen } from './QualityIssuesScreen';
import { ReceivingDashboardScreen } from './ReceivingDashboardScreen';
import { ReceivingHistoryDetailScreen } from './ReceivingHistoryDetailScreen';
import { ReceivingHistoryScreen } from './ReceivingHistoryScreen';
import { RECEIVING_CODES } from './ReceivingParts';
import { ShipmentDetailScreen } from './ShipmentDetailScreen';
import type {
  HistoryFilter,
  IncomingShipment,
  PermissionCheck,
  QualityIssue,
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
 * and search keys open screens that are not offered, so they open the dashboard.
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
  /** Not offered: the API has no receipt timeline. Kept so hosts compile unchanged. */
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

  /** BR-30: a Sub scope always sends its own warehouse uuid. */
  const warehouseId = receivingWarehouseFilter(scope, undefined);
  const warehouseName = scope.warehouseName;
  const common = { scope, can, onBack: back };
  const live = { warehouseId, warehouseName };
  const openWizard = (wizardStep: ReceivingWizardStep, purchaseOrderId: string) =>
    navigate('Wizard', { wizardStep, shipmentId: purchaseOrderId });
  const openIssue = (issue: QualityIssue) => openWizard('quality_check', issue.purchaseOrderId);
  const openShipment = (purchaseOrderId: string) => navigate('ShipmentDetail', { shipmentId: purchaseOrderId });
  const transferReceiving = isAreaAvailable('interWarehouseTransfers', can) ? onOpenTransferReceiving : undefined;

  switch (current.screen) {
    case 'Shipments':
    case 'SearchFilters':
      return (
        <ShipmentsRoute
          {...common}
          {...live}
          key={params.statusTab ?? 'All'}
          initialTab={params.statusTab}
          onSelectShipment={openShipment}
        />
      );
    case 'ShipmentDetail':
      return params.shipmentId === undefined ? (
        <ShipmentsRoute {...common} {...live} onSelectShipment={openShipment} />
      ) : (
        <ShipmentDetailRoute
          {...common}
          {...live}
          purchaseOrderId={params.shipmentId}
          onStartReceiving={(s, resume) => openWizard(resume ? 'quality_check' : 'start_receiving', s.purchaseOrderId)}
        />
      );
    case 'History':
      return (
        <HistoryRoute
          {...common}
          {...live}
          key={params.historyFilter ?? 'All'}
          initialFilter={params.historyFilter ?? 'All'}
          onSelectRecord={(receiptId) => navigate('HistoryDetail', { receiptId })}
        />
      );
    case 'HistoryDetail':
      return (
        <HistoryDetailRoute
          {...common}
          {...live}
          receiptId={params.receiptId}
          onNavigateShipment={openShipment}
          onNavigateBatch={onViewBatch}
          onTakeAction={(purchaseOrderId) => openWizard('quality_check', purchaseOrderId)}
        />
      );
    case 'QualityIssues':
      return (
        <QualityIssuesRoute {...common} {...live} onSelectIssue={openIssue} onOpenOperationalIssues={onOpenOperationalIssues} />
      );
    case 'Wizard':
      return params.shipmentId === undefined ? (
        <ShipmentsRoute {...common} {...live} onSelectShipment={openShipment} />
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
          {...live}
          onTabChange={onTabChange}
          unreadNotifications={unreadNotifications}
          onOpenNotifications={onOpenNotifications}
          onOpenShipments={(statusTab) => navigate('Shipments', { statusTab })}
          onOpenHistory={(historyFilter) => navigate('History', { historyFilter })}
          onOpenQualityIssues={() => navigate('QualityIssues')}
          onSelectIssue={openIssue}
          onSelectRecord={(receiptId) => navigate('HistoryDetail', { receiptId })}
          onStartReceiving={() => navigate('Shipments', { statusTab: 'All' })}
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
  warehouseName: string | undefined;
}

function DashboardRoute({
  warehouseId,
  warehouseName,
  ...props
}: RouteBase & Omit<React.ComponentProps<typeof ReceivingDashboardScreen>, 'scope' | 'can' | 'onBack'>) {
  const live = useReceivingDashboard(warehouseId, warehouseName);
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
  warehouseName,
  ...props
}: RouteBase & {
  initialTab?: React.ComponentProps<typeof IncomingShipmentsScreen>['initialTab'];
  onSelectShipment: (purchaseOrderId: string) => void;
}) {
  const list = useShipmentList(warehouseId, warehouseName);
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
  warehouseName,
  purchaseOrderId,
  ...props
}: RouteBase & { purchaseOrderId: string; onStartReceiving: (shipment: IncomingShipment, resume: boolean) => void }) {
  const live = usePurchaseOrder(warehouseId, purchaseOrderId, warehouseName);
  return (
    <ShipmentDetailScreen
      {...props}
      shipment={live.shipment}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
      onRefresh={live.refresh}
      isRefreshing={live.isRefreshing}
    />
  );
}

function HistoryRoute({
  warehouseId,
  warehouseName,
  initialFilter,
  ...props
}: RouteBase & { initialFilter: HistoryFilter; onSelectRecord: (receiptId: string) => void }) {
  const [filter, setFilter] = useState<HistoryFilter>(initialFilter);
  const list = useReceiptHistory(warehouseId, HISTORY_FILTER_STATUS[filter], warehouseName);
  return (
    <ReceivingHistoryScreen
      {...props}
      filter={filter}
      onChangeFilter={setFilter}
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
  warehouseName,
  receiptId,
  onNavigateShipment,
  onNavigateBatch,
  onTakeAction,
  ...props
}: RouteBase & {
  receiptId: string | undefined;
  onNavigateShipment: (purchaseOrderId: string) => void;
  onNavigateBatch?: ((batchId: string) => void) | undefined;
  onTakeAction: (purchaseOrderId: string) => void;
}) {
  const live = useReceipt(warehouseId, receiptId, warehouseName);
  const rec = live.record;
  return (
    <ReceivingHistoryDetailScreen
      {...props}
      record={rec}
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

function QualityIssuesRoute({
  warehouseId,
  warehouseName,
  ...props
}: RouteBase & { onSelectIssue: (issue: QualityIssue) => void; onOpenOperationalIssues?: (() => void) | undefined }) {
  const live = useReceivingDashboard(warehouseId, warehouseName);
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
  warehouseName,
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
  const order = usePurchaseOrder(warehouseId, purchaseOrderId, warehouseName);
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
  return (
    <GoodsReceivingWizardScreen
      {...props}
      // A receipt awaiting QC is completed, never received again.
      initialStep={pendingReceipt !== undefined ? 'quality_check' : props.initialStep}
      shipment={shipment}
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
