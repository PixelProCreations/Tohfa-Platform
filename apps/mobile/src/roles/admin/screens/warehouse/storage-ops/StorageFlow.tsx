/**
 * In-module navigator for the warehouse storage-ops screens, part A (design
 * module M4).
 *
 *   Material Handling -> Material Detail -> Add Material (Add Stock)
 *                     -> Add Material (Add Material / Receive)
 *   Storage Location (detail)            (host: View Stock, product rows)
 *   Storage Location Assignment          (host: confirmed location)
 *   Warehouse Capacity                   (host: history, Manage Capacity Limits)
 *   Warehouse Performance (Main)         (host: warehouse, operations log, staff)
 *   Operational Issues -> Issue Detail
 *                      -> Report an Issue (operational) -> Request Submitted
 *   Report an Issue (support, from Help & Support) -> Request Submitted
 *
 * Report an Issue and Request Submitted need `support.ticket.create_own`
 * (neither warehouse admin role holds it today, SPEC_GAPS W4v-2).
 *
 * The screens used to be stitched three times (App.tsx keys, the Sub shell's
 * show* flags and Main's whSubView branches), none of which passed `scope` /
 * `can`. This flow owns the stack, so every step gets the viewer's scope and
 * `can`. Hops that leave the module (warehouse activity, Inventory & Stock,
 * the receiving flow) go to the host.
 *
 * Gates: Add Material needs `inventory.material_handling.manage` and
 * Warehouse Performance needs `warehouse.all.view`; navigate() refuses them
 * without the code and the screens render a not-available note if opened
 * directly. The other routes are view-only and gate their actions inside.
 *
 * Route keys are the old App.tsx keys without the 'SubWarehouse' prefix.
 */
import React, { useEffect, useState } from 'react';

import { AddMaterialScreen } from './AddMaterialScreen';
import { MATERIALS } from './fixtures';
import { IssueSubmittedScreen } from './IssueSubmittedScreen';
import { MaterialDetailScreen } from './MaterialDetailScreen';
import { MaterialHandlingScreen } from './MaterialHandlingScreen';
import { OperationalIssueDetailScreen } from './OperationalIssueDetailScreen';
import { OperationalIssuesScreen } from './OperationalIssuesScreen';
import { ReportIssueScreen } from './ReportIssueScreen';
import { StorageLocationAssignmentScreen } from './StorageLocationAssignmentScreen';
import { StorageLocationDetailScreen } from './StorageLocationDetailScreen';
import { STORAGE_CODES } from './StorageParts';
import { WarehouseCapacityScreen } from './WarehouseCapacityScreen';
import { WarehousePerformanceScreen } from './WarehousePerformanceScreen';
import type { PermissionCheck, StorageRoute, StorageRouteParams, WarehouseScope, WarehouseTab } from './types';

interface StorageStackEntry {
  screen: StorageRoute;
  params?: StorageRouteParams | undefined;
}

/** The code each gated route needs; routes not listed are ungated (view-only). */
const ROUTE_CODE: Partial<Record<StorageRoute, string>> = {
  AddMaterial: STORAGE_CODES.materialManage,
  Performance: STORAGE_CODES.allWarehousesView,
  // Neither warehouse admin role holds it today (SPEC_GAPS W4v-2): unreachable.
  ReportIssue: STORAGE_CODES.issueReport,
  IssueSubmitted: STORAGE_CODES.issueReport,
};

/** True when `can` allows opening `route`. */
export function canOpenStorageRoute(route: StorageRoute, can: PermissionCheck): boolean {
  const code = ROUTE_CODE[route];
  return code === undefined || can(code);
}

export interface StorageFlowProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  initialScreen?: StorageRoute | undefined;
  initialParams?: StorageRouteParams | undefined;
  /** Leave the module (pressed back on its first screen). */
  onBack: () => void;
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
  /** Material movement / capacity history (warehouse activity, storage-ops part B). */
  onViewActivity?: (() => void) | undefined;
  /** Storage location View Stock: Inventory & Stock (inventory.batch.view). */
  onViewStock?: (() => void) | undefined;
  /** Storage location stored-stock row: that product in Inventory & Stock. */
  onViewProductDetail?: ((product: string) => void) | undefined;
  /** Storage Location Assignment confirmed (inventory.batch.assign); the host finishes receiving. */
  onConfirmAssignment?: ((locationId: string) => void) | undefined;
  /** Capacity "Manage Capacity Limits" (Warehouse Settings); the screen also needs warehouse.capacity.set. */
  onManageCapacity?: (() => void) | undefined;
  /** Performance warehouse card (by display name, as the Main shell keys warehouses). */
  onSelectWarehouse?: ((warehouseName: string) => void) | undefined;
  onViewOperationsHistory?: (() => void) | undefined;
  /** Performance "All Staff" (warehouse roster / attendance). */
  onViewStaffAttendance?: (() => void) | undefined;
  /**
   * Request Submitted "Back to Settings" on the support path (the form was
   * opened from Help & Support). Defaults to leaving the module.
   */
  onSupportRequestDone?: (() => void) | undefined;
}

export function StorageFlow({
  scope,
  can,
  initialScreen = 'MaterialHandling',
  initialParams,
  onBack,
  onTabChange,
  onViewActivity,
  onViewStock,
  onViewProductDetail,
  onConfirmAssignment,
  onManageCapacity,
  onSelectWarehouse,
  onViewOperationsHistory,
  onViewStaffAttendance,
  onSupportRequestDone,
}: StorageFlowProps) {
  const [stack, setStack] = useState<StorageStackEntry[]>(() => [{ screen: initialScreen, params: initialParams }]);

  // A host that re-targets the open module restarts the stack, as the other
  // area flows do. Keyed on the param values, not the object, so a host that
  // builds the params inline does not reset it on every render.
  const presetKey = [
    initialParams?.materialId,
    initialParams?.locationId,
    initialParams?.batchId,
    initialParams?.productName,
    initialParams?.quantity,
    initialParams?.warehouseId,
    initialParams?.issueId,
    initialParams?.reportMode,
    initialParams?.issueCategory,
    initialParams?.submittedId,
  ].join('|');
  useEffect(() => {
    setStack([{ screen: initialScreen, params: initialParams }]);
    // initialParams is read through presetKey on purpose (see above).
  }, [initialScreen, presetKey]);

  const current = stack[stack.length - 1] ?? { screen: initialScreen, params: initialParams };
  const params: StorageRouteParams = current.params ?? {};

  const navigate = (screen: StorageRoute, nextParams?: StorageRouteParams) => {
    if (!canOpenStorageRoute(screen, can)) return;
    setStack((prev) => [...prev, { screen, params: nextParams }]);
  };
  const back = () => {
    if (stack.length > 1) setStack((prev) => prev.slice(0, -1));
    else onBack();
  };
  /** Pop back to the nearest `screen` on the stack, or restart the stack on it. */
  const backTo = (screen: StorageRoute) => {
    setStack((prev) => {
      const index = prev.map((e) => e.screen).lastIndexOf(screen);
      return index >= 0 ? prev.slice(0, index + 1) : [{ screen }];
    });
  };

  const common = { scope, can, onBack: back, onTabChange };

  switch (current.screen) {
    case 'MaterialHandling':
      return (
        <MaterialHandlingScreen
          {...common}
          onSelectMaterial={(materialId) => navigate('MaterialDetail', { materialId })}
          onAddMaterial={() => navigate('AddMaterial')}
          onReceiveMaterial={() => navigate('AddMaterial')}
          onIssueMaterial={(materialId) => navigate('MaterialDetail', { materialId })}
          onViewHistory={onViewActivity}
        />
      );
    case 'MaterialDetail':
      return (
        <MaterialDetailScreen
          {...common}
          materialId={params.materialId}
          onAddStock={() => navigate('AddMaterial', { materialId: params.materialId })}
        />
      );
    case 'AddMaterial':
      return (
        <AddMaterialScreen
          {...common}
          initialMaterialName={MATERIALS.find((m) => m.id === params.materialId)?.name}
          onSave={back}
        />
      );
    case 'StorageLocationDetail':
      return (
        <StorageLocationDetailScreen
          {...common}
          locationId={params.locationId}
          onViewStock={onViewStock}
          onViewProductDetail={onViewProductDetail}
        />
      );
    case 'StorageLocationAssignment':
      return (
        <StorageLocationAssignmentScreen
          {...common}
          batchId={params.batchId}
          productName={params.productName}
          quantity={params.quantity}
          warehouseId={params.warehouseId}
          onConfirmAssignment={onConfirmAssignment}
        />
      );
    case 'Capacity':
      return <WarehouseCapacityScreen {...common} onViewHistory={onViewActivity} onManageCapacity={onManageCapacity} />;
    case 'Performance':
      return (
        <WarehousePerformanceScreen
          {...common}
          onSelectWarehouse={onSelectWarehouse}
          onViewOperationsHistory={onViewOperationsHistory}
          onViewStaffAttendance={onViewStaffAttendance}
        />
      );
    case 'OperationalIssues':
      return (
        <OperationalIssuesScreen
          {...common}
          onSelectIssue={(issueId) => navigate('OperationalIssueDetail', { issueId })}
          onReportIssue={() => navigate('ReportIssue', { reportMode: 'operational' })}
        />
      );
    case 'OperationalIssueDetail':
      return <OperationalIssueDetailScreen {...common} issueId={params.issueId} />;
    case 'ReportIssue':
      return (
        <ReportIssueScreen
          {...common}
          mode={params.reportMode}
          initialCategory={params.issueCategory}
          onSubmit={(submittedId) => navigate('IssueSubmitted', { reportMode: params.reportMode, submittedId })}
        />
      );
    case 'IssueSubmitted':
      return (
        <IssueSubmittedScreen
          {...common}
          mode={params.reportMode}
          submittedId={params.submittedId}
          onDone={() => {
            if (params.reportMode === 'operational') backTo('OperationalIssues');
            else (onSupportRequestDone ?? onBack)();
          }}
        />
      );
    default:
      return null;
  }
}
