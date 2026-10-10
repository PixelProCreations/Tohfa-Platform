/**
 * In-module navigator for the Main warehouse-admin screens.
 *
 *   Warehouse Overview -> Warehouse City Detail -> Documents / Settings / Capacity
 *   Warehouse Overview -> Settings / Capacity / Performance (-> City Detail)
 *   Warehouse Overview -> Manage Sub Warehouse Admins
 *
 * Settings, Documents, Capacity and Performance are not re-implemented: they
 * open the existing shared ProfileFlow / StorageFlow routes, so their own
 * gates apply. Comparison and the Performance hand-offs (operations history,
 * staff attendance) go back to the host, which owns those screens.
 *
 * Gates: Overview, City Detail and Performance need `warehouse.all.view`;
 * Manage SWAs needs `admin.sub_wh_admin.create`; Settings needs
 * `warehouse.capacity.set`. navigate() refuses a route without its code and
 * each screen renders a not-available note if opened directly.
 */
import React, { useEffect, useState } from 'react';

import { ProfileFlow } from '../profile-settings';
import { StorageFlow } from '../storage-ops';
import { ADMIN_WAREHOUSES } from './fixtures';
import { ManageSubWarehouseAdminsScreen } from './ManageSubWarehouseAdminsScreen';
import { WarehouseCityDetailScreen } from './WarehouseCityDetailScreen';
import { WAREHOUSE_ADMIN_CODES } from './WarehouseAdminParts';
import { WarehouseOverviewScreen } from './WarehouseOverviewScreen';
import type { PermissionCheck, WarehouseAdminRoute, WarehouseAdminRouteParams, WarehouseScope } from './types';

interface WarehouseAdminStackEntry {
  screen: WarehouseAdminRoute;
  params?: WarehouseAdminRouteParams | undefined;
}

const ROUTE_CODE: Partial<Record<WarehouseAdminRoute, string>> = {
  WarehouseOverview: WAREHOUSE_ADMIN_CODES.allView,
  WarehouseCityDetail: WAREHOUSE_ADMIN_CODES.allView,
  WarehousePerformance: WAREHOUSE_ADMIN_CODES.allView,
  ManageSubWarehouseAdmins: WAREHOUSE_ADMIN_CODES.swaCreate,
  WarehouseSettings: WAREHOUSE_ADMIN_CODES.capacitySet,
};

/** True when `can` allows opening `route`. */
export function canOpenWarehouseAdminRoute(route: WarehouseAdminRoute, can: PermissionCheck): boolean {
  const code = ROUTE_CODE[route];
  return code === undefined || can(code);
}

/** Seeded warehouse id for a display name ('Ooty Warehouse' / 'Ooty'), as StorageFlow hands names back. */
function warehouseIdForName(name: string): string | undefined {
  const key = name.replace(/ Warehouse$/, '').toLowerCase();
  return ADMIN_WAREHOUSES.find((w) => (w.warehouseName ?? '').toLowerCase().startsWith(key))?.warehouseId;
}

export interface WarehouseAdminFlowProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  initialScreen?: WarehouseAdminRoute | undefined;
  initialParams?: WarehouseAdminRouteParams | undefined;
  /** Leave the module (pressed back on its first screen). */
  onBack: () => void;
  /** Host screens the flow does not own. */
  onNavigateComparison?: (() => void) | undefined;
  onViewOperationsHistory?: (() => void) | undefined;
  onViewStaffAttendance?: (() => void) | undefined;
}

export function WarehouseAdminFlow({
  scope,
  can,
  initialScreen = 'WarehouseOverview',
  initialParams,
  onBack,
  onNavigateComparison,
  onViewOperationsHistory,
  onViewStaffAttendance,
}: WarehouseAdminFlowProps) {
  const [stack, setStack] = useState<WarehouseAdminStackEntry[]>(() => [{ screen: initialScreen, params: initialParams }]);

  // A host that re-targets the open module restarts the stack (keyed on the value).
  const presetKey = initialParams?.warehouseId ?? '';
  useEffect(() => {
    setStack([{ screen: initialScreen, params: initialParams }]);
    // initialParams is read through presetKey on purpose (see above).
  }, [initialScreen, presetKey]);

  const current = stack[stack.length - 1] ?? { screen: initialScreen, params: initialParams };
  const params: WarehouseAdminRouteParams = current.params ?? {};

  const navigate = (screen: WarehouseAdminRoute, nextParams?: WarehouseAdminRouteParams) => {
    if (!canOpenWarehouseAdminRoute(screen, can)) return;
    setStack((prev) => [...prev, { screen, params: nextParams }]);
  };
  const back = () => {
    if (stack.length > 1) setStack((prev) => prev.slice(0, -1));
    else onBack();
  };

  const openDetail = (warehouseId: string) => navigate('WarehouseCityDetail', { warehouseId });
  const openSettings = (warehouseId: string) => navigate('WarehouseSettings', { warehouseId });
  const openCapacity = () => navigate('WarehouseCapacity');

  switch (current.screen) {
    case 'WarehouseOverview':
      return (
        <WarehouseOverviewScreen
          scope={scope}
          can={can}
          onBack={back}
          onSelectWarehouse={openDetail}
          onOpenSettings={openSettings}
          onNavigateComparison={onNavigateComparison}
          onNavigatePerformance={() => navigate('WarehousePerformance')}
          onNavigateCapacitySummary={openCapacity}
          onManageSubWarehouseAdmins={() => navigate('ManageSubWarehouseAdmins')}
        />
      );
    case 'WarehouseCityDetail':
      return (
        <WarehouseCityDetailScreen
          scope={scope}
          can={can}
          onBack={back}
          warehouseId={params.warehouseId}
          onOpenDocuments={(warehouseId) => navigate('WarehouseDocuments', { warehouseId })}
          onOpenSettings={openSettings}
          onOpenCapacity={openCapacity}
        />
      );
    case 'ManageSubWarehouseAdmins':
      return <ManageSubWarehouseAdminsScreen scope={scope} can={can} onBack={back} />;
    case 'WarehouseDocuments':
      // The absorbed MainWarehouseDetail rendered the shared Documents screen; it opens on this warehouse.
      return (
        <ProfileFlow scope={scope} can={can} initialScreen="Documents" initialWarehouseId={params.warehouseId} onBack={back} />
      );
    case 'WarehouseSettings':
      return (
        <ProfileFlow scope={scope} can={can} initialScreen="WarehouseSettings" initialWarehouseId={params.warehouseId} onBack={back} />
      );
    case 'WarehouseCapacity':
      return (
        <StorageFlow
          scope={scope}
          can={can}
          initialScreen="Capacity"
          onBack={back}
          onManageCapacity={() => navigate('WarehouseSettings')}
        />
      );
    case 'WarehousePerformance':
      return (
        <StorageFlow
          scope={scope}
          can={can}
          initialScreen="Performance"
          onBack={back}
          onSelectWarehouse={(name) => {
            const id = warehouseIdForName(name);
            if (id !== undefined) openDetail(id);
          }}
          onViewOperationsHistory={onViewOperationsHistory}
          onViewStaffAttendance={onViewStaffAttendance}
        />
      );
    default:
      return null;
  }
}
