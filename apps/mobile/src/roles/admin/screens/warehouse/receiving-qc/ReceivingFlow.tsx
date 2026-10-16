/**
 * In-module navigator for the warehouse goods receiving screens, shared by the
 * Main and Sub shells.
 *
 *   Dashboard -> Incoming Shipments -> Search & Filters (facets back to the list)
 *                                   -> Shipment Detail -> Goods Receiving wizard
 *             -> Receiving History  -> Receiving History Detail -> wizard / shipment
 *             -> Quality Issues     -> wizard step / shipment / Operational Issues (host)
 *             -> Start Receiving    -> wizard
 *   wizard Batch & Storage -> Storage Location Assignment (storage-ops)
 *
 * The Sub shell drew these views inline (receivingSubView) and the Main shell
 * stitched seven standalone screens with its own sub-view keys; neither passed
 * `scope` / `can` to the lists. The flow owns the stack, so every step gets the
 * viewer's scope and `can`. `receivingRouteFor` maps the shells' old sub-view
 * keys onto routes so every key keeps working.
 *
 * Gates: the lists need inventory.batch.view or inventory.goods_receipt.record
 * (each screen renders a note without them); the wizard route needs
 * inventory.goods_receipt.record (navigate() refuses it, and the wizard gates
 * each step again). The server re-checks every action (CLAUDE.md 2.1).
 */
import React, { useEffect, useState } from 'react';
import { useFlowBack } from '../useFlowBack';

import { BatchListScreen } from '../inventory/BatchListScreen';
import { StorageFlow } from '../storage-ops';
import { EMPTY_RECEIVING_FILTERS, findReceivingRecord, findShipment, isMainScope, recordsInScope, shipmentsInScope } from './fixtures';
import { GoodsReceivingWizardScreen } from './GoodsReceivingWizardScreen';
import { TransferReceivingScreen, TransferDetailScreen } from '../transfers';
import { IncomingShipmentsScreen, PendingQueueScreen, ReceivingActivityScreen } from './IncomingShipmentsScreen';
import { QualityIssuesScreen } from './QualityIssuesScreen';
import { ReceivingDashboardScreen } from './ReceivingDashboardScreen';
import { ReceivingHistoryDetailScreen } from './ReceivingHistoryDetailScreen';
import { ReceivingHistoryScreen } from './ReceivingHistoryScreen';
import { RECEIVING_CODES } from './ReceivingParts';
import { ReceivingSearchFiltersScreen } from './ReceivingSearchFiltersScreen';
import { ShipmentDetailScreen } from './ShipmentDetailScreen';
import type {
  IncomingShipment,
  PermissionCheck,
  QualityIssue,
  ReceivingFilters,
  ReceivingRoute,
  ReceivingRouteParams,
  ReceivingWizardStep,
  WarehouseScope,
  WarehouseTab,
} from './types';

interface ReceivingStackEntry {
  screen: ReceivingRoute;
  params?: ReceivingRouteParams | undefined;
}

/** Old shell sub-view keys (Sub receivingSubView, Main receivingSubView / whSubView) -> route. */
const SUB_VIEW_ROUTE: Record<string, ReceivingStackEntry> = {
  overview: { screen: 'Dashboard' },
  dashboard: { screen: 'Dashboard' },
  incoming_goods_ops: { screen: 'Dashboard' },
  incoming_shipments: { screen: 'Shipments' },
  search_filters: { screen: 'SearchFilters' },
  shipment_detail: { screen: 'ShipmentDetail' },
  receiving_history: { screen: 'History' },
  receiving_history_detail: { screen: 'HistoryDetail' },
  quality_issues_ops: { screen: 'QualityIssues' },
  storage_location_assignment: { screen: 'StorageAssignment' },
  start_receiving: { screen: 'Wizard', params: { wizardStep: 'start_receiving' } },
  quantity_verification: { screen: 'Wizard', params: { wizardStep: 'quantity_verification' } },
  quality_check: { screen: 'Wizard', params: { wizardStep: 'quality_check' } },
  grade_product_verification: { screen: 'Wizard', params: { wizardStep: 'grade_verification' } },
  damage_mismatch_report: { screen: 'Wizard', params: { wizardStep: 'damage_mismatch' } },
  acceptance_decision: { screen: 'Wizard', params: { wizardStep: 'receiving_decision' } },
  partial_acceptance: { screen: 'Wizard', params: { wizardStep: 'partial_acceptance' } },
  goods_receipt_summary: { screen: 'Wizard', params: { wizardStep: 'receipt_summary' } },
  batch_assignment: { screen: 'Wizard', params: { wizardStep: 'batch_assignment' } },
  receiving_activity: { screen: 'ActivityTimeline' },
  pending_queue: { screen: 'PendingQueue' },
};

/** Route and params for an old shell sub-view key; unknown keys open the dashboard. */
export function receivingRouteFor(subView: string | undefined): ReceivingStackEntry {
  return (subView !== undefined ? SUB_VIEW_ROUTE[subView] : undefined) ?? { screen: 'Dashboard' };
}

/** True when `can` allows opening `route` (only the wizard routes are gated here). */
export function canOpenReceivingRoute(route: ReceivingRoute, can: PermissionCheck): boolean {
  if (route === 'Wizard' || route === 'StorageAssignment') return can(RECEIVING_CODES.receiptRecord);
  if (route === 'Batches') return can(RECEIVING_CODES.batchView);
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
  /** Main: dashboard Transfer Receiving card (the transfers flow). */
  onOpenTransferReceiving?: (() => void) | undefined;
  /** Damage reports and Quality Issues "View Operational Issues" (storage-ops). */
  onOpenOperationalIssues?: (() => void) | undefined;
  /** Receipt detail "Timeline" (the host's activity timeline). */
  onOpenTimeline?: (() => void) | undefined;
  /** Where a finished receipt lands: the dashboard (default) or Receiving History. */
  finishTo?: 'Dashboard' | 'History' | undefined;
  /** View Batch navigation handler */
  onViewBatch?: ((batchId: string) => void) | undefined;
  /** Reports the currently active route in the receiving flow stack */
  onScreenChange?: ((screen: ReceivingRoute) => void) | undefined;
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
  onOpenTimeline,
  finishTo = 'Dashboard',
  onViewBatch,
  onScreenChange,
}: ReceivingFlowProps) {
  const [stack, setStack] = useState<ReceivingStackEntry[]>(() => [{ screen: initialScreen, params: initialParams }]);
  const [filters, setFilters] = useState<ReceivingFilters>(EMPTY_RECEIVING_FILTERS);

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

  useEffect(() => {
    onScreenChange?.(current.screen);
  }, [current.screen, onScreenChange]);

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

  const common = { scope, can, onBack: back };
  const firstShipment = (): IncomingShipment | undefined => shipmentsInScope(scope)[0];
  const openWizard = (wizardStep: ReceivingWizardStep, shipmentId?: string | undefined) =>
    navigate('Wizard', { wizardStep, shipmentId: shipmentId ?? params.shipmentId ?? firstShipment()?.code });
  const openIssue = (issue: QualityIssue) => {
    if (issue.kind === 'Damage Reported' || issue.id === 'QC-1020') {
      openWizard('damage_mismatch', issue.shipmentCode ?? 'GR-1020');
      return;
    }
    if (issue.target === 'wizard' && issue.wizardStep !== undefined) openWizard(issue.wizardStep, issue.shipmentCode);
    else if (issue.target === 'shipment') navigate('ShipmentDetail', { shipmentId: issue.shipmentCode });
    else onOpenOperationalIssues?.();
  };
  /** A receipt's shipment, by code or by its reference. */
  const shipmentOfReceipt = (id: string | undefined) =>
    shipmentsInScope(scope).find((s) => s.code === id || s.reference === id)?.code;

  switch (current.screen) {
    case 'Dashboard':
      return (
        <ReceivingDashboardScreen
          {...common}
          onTabChange={onTabChange}
          unreadNotifications={unreadNotifications}
          onOpenNotifications={onOpenNotifications}
          onOpenShipments={(statusTab) => navigate('Shipments', { statusTab })}
          onSelectShipment={(shipmentId) => navigate('ShipmentDetail', { shipmentId })}
          onViewIncomingShipments={() => {
            const s = shipmentsInScope(scope).find((x) => x.code === 'SHP-000124') ?? firstShipment();
            navigate('ShipmentDetail', { shipmentId: s?.code ?? 'SHP-000124' });
          }}
          onOpenDamageReport={() => {
            const s = shipmentsInScope(scope).find((x) => x.code === 'SHP-000124') ?? firstShipment();
            openWizard('damage_mismatch', s?.code ?? 'SHP-000124');
          }}
          onOpenReceiptSummary={() => {
            const s = shipmentsInScope(scope).find((x) => x.code === 'SHP-000124') ?? firstShipment();
            openWizard('receipt_summary', s?.code ?? 'SHP-000124');
          }}
          onOpenHistory={(historyFilter) => {
            if (isMainScope(scope)) {
              navigate('HistoryDetail', { receiptId: 'GRN-000842' });
            } else {
              navigate('History', { historyFilter });
            }
          }}
          onOpenQualityIssues={() => navigate('QualityIssues')}
          onSelectIssue={openIssue}
          onSelectRecord={(receiptId) => {
            if (!isMainScope(scope)) {
              navigate('ShipmentDetail', { shipmentId: receiptId });
            } else {
              navigate('HistoryDetail', { receiptId });
            }
          }}
          onShipmentArrived={() => {
            const s = shipmentsInScope(scope).find((x) => x.code === 'SHP-000124') ?? firstShipment();
            navigate('ShipmentDetail', { shipmentId: s?.code ?? 'SHP-000124' });
          }}
          onStartReceiving={() => {
            if (isMainScope(scope)) {
              const s = shipmentsInScope(scope).find((x) => x.code === 'SHP-000124') ?? firstShipment();
              navigate('ShipmentDetail', { shipmentId: s?.code ?? 'SHP-000124' });
            } else {
              openWizard('start_receiving');
            }
          }}
          onOpenTransferReceiving={() => {
            if (onOpenTransferReceiving) {
              onOpenTransferReceiving();
            } else {
              navigate('TransferReceiving');
            }
          }}
          onOpenActivity={() => navigate('ActivityTimeline')}
          onOpenPendingQueue={() => navigate('PendingQueue')}
        />
      );
    case 'Shipments':
      return (
        <IncomingShipmentsScreen
          {...common}
          key={params.statusTab ?? 'All'}
          initialTab={params.statusTab}
          filters={filters}
          onOpenFilters={() => navigate('SearchFilters')}
          onClearFilters={() => setFilters(EMPTY_RECEIVING_FILTERS)}
          onSelectShipment={(shipmentId) => {
            if (shipmentId === 'GR-1021' || shipmentId === 'SHP-000121') {
              openWizard('damage_mismatch', shipmentId);
            } else {
              navigate('ShipmentDetail', { shipmentId });
            }
          }}
          onTabChange={onTabChange}
        />
      );
    case 'SearchFilters':
      return (
        <ReceivingSearchFiltersScreen
          {...common}
          initialFilters={filters}
          onApply={(next) => {
            setFilters(next);
            backTo('Shipments');
          }}
        />
      );
    case 'ShipmentDetail':
      return (
        <ShipmentDetailScreen
          {...common}
          shipmentId={params.shipmentId ?? firstShipment()?.code}
          onStartReceiving={(s, resume) => openWizard(resume ? 'receiving_in_progress' : 'start_receiving', s.code)}
          onViewProductDetail={(s) => openWizard('quantity_verification', s.code)}
          onViewTimeline={(s) => openWizard('receipt_summary', s.code)}
          onSelectStage={(stage, s) => {
            if (stage === 'Storage Assignment') {
              navigate('StorageAssignment', { shipmentId: s.code });
            } else if (stage === 'Batch Assignment') {
              openWizard('batch_assignment', s.code);
            } else if (stage === 'Receipt Completion') {
              openWizard('receipt_confirmation', s.code);
            } else if (stage === 'Decision') {
              openWizard('receiving_decision', s.code);
            } else if (stage === 'Quality Check') {
              openWizard('quality_check', s.code);
            } else if (stage === 'Quantity Verification') {
              openWizard('quantity_verification', s.code);
            } else {
              openWizard('start_receiving', s.code);
            }
          }}
        />
      );
    case 'History':
      return (
        <ReceivingHistoryScreen
          {...common}
          key={params.historyFilter ?? 'All'}
          initialFilter={params.historyFilter}
          onSelectRecord={(receiptId) => navigate('HistoryDetail', { receiptId })}
          onOpenFilters={() => navigate('SearchFilters')}
        />
      );
    case 'HistoryDetail': {
      const record = findReceivingRecord(params.receiptId, recordsInScope(scope));
      const shipmentId = shipmentOfReceipt(record?.shipmentId);
      return (
        <ReceivingHistoryDetailScreen
          {...common}
          receiptId={params.receiptId}
          onNavigateTimeline={onOpenTimeline}
          onNavigateDiscrepancy={() => openWizard('damage_mismatch', shipmentId)}
          onNavigateBatch={() => openWizard('batch_assignment', shipmentId)}
          onNavigateShipment={shipmentId !== undefined ? () => navigate('ShipmentDetail', { shipmentId }) : undefined}
          onTakeAction={() => openWizard('damage_mismatch', shipmentId)}
        />
      );
    }
    case 'QualityIssues':
      return <QualityIssuesScreen {...common} onSelectIssue={openIssue} onOpenOperationalIssues={onOpenOperationalIssues} />;
    case 'Wizard': {
      const shipment = findShipment(scope, params.shipmentId) ?? firstShipment();
      return (
        <GoodsReceivingWizardScreen
          {...common}
          key={`${params.wizardStep ?? 'start_receiving'}-${shipment?.code ?? ''}`}
          initialStep={params.wizardStep ?? 'start_receiving'}
          shipment={shipment}
          receiverName={receiverName}
          onFinish={() => backTo(finishTo)}
          onBackToShipments={() => backTo('Shipments')}
          onOpenStorageLocations={() => navigate('StorageAssignment', { shipmentId: shipment?.code })}
          onViewHistory={() => navigate('History')}
          onOpenInventory={() => onTabChange?.('Inventory')}
          onViewBatch={(batchId) => {
            if (onViewBatch) {
              onViewBatch(batchId);
            } else {
              navigate('Batches', { batchId });
            }
          }}
        />
      );
    }
    case 'StorageAssignment': {
      const shipment = findShipment(scope, params.shipmentId) ?? firstShipment();
      const isSub = !isMainScope(scope);
      return (
        <StorageFlow
          scope={scope}
          can={can}
          initialScreen="StorageLocationAssignment"
          initialParams={{
            warehouseId: shipment?.warehouseId ?? scope.warehouseId,
            batchId: isSub ? 'BAT-00512' : undefined,
            productName: isSub ? 'Tomato · Grade 2' : shipment?.produce,
            quantity: isSub ? '445 KG' : (shipment ? `${shipment.acceptedQty ?? shipment.receivedQty ?? shipment.expectedQty} KG` : undefined),
          }}
          onBack={back}
          onConfirmAssignment={() => {
            if (isSub) {
              openWizard('receipt_confirmation', shipment?.code);
            } else {
              backTo(finishTo);
            }
          }}
        />
      );
    }
    case 'Batches':
      return (
        <BatchListScreen
          scope={scope}
          can={can}
          onBack={back}
        />
      );
    case 'ActivityTimeline':
      return (
        <ReceivingActivityScreen
          onBack={back}
          onSelectStep={(step) => {
            if (step === 'shipment_detail') {
              navigate('ShipmentDetail', { shipmentId: 'SHP-000124' });
            } else if (step === 'storage_assignment') {
              navigate('StorageAssignment', { shipmentId: 'SHP-000124' });
            } else {
              openWizard(step as any, 'SHP-000124');
            }
          }}
        />
      );
    case 'PendingQueue':
      return (
        <PendingQueueScreen
          onBack={back}
          onSelectShipment={(shipmentId) => navigate('ShipmentDetail', { shipmentId })}
        />
      );
    case 'TransferReceiving':
      return (
        <TransferReceivingScreen
          {...common}
          onSelectTransfer={(id) => navigate('TransferDetail', { transferId: id })}
          onStartTransferInspection={(id) => navigate('TransferDetail', { transferId: id })}
        />
      );
    case 'TransferDetail':
      return (
        <TransferDetailScreen
          {...common}
          transferId={params.transferId ?? '00284'}
          onBackToTransfers={back}
        />
      );
    default:
      return null;
  }
}
