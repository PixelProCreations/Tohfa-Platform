/**
 * In-module navigator for the Main warehouse-admin screens.
 *
 *   Warehouse Overview -> Warehouse City Detail -> Documents / Settings / Capacity /
 *                                                 Staff / Manage Sub Warehouse Admins
 *   Warehouse Overview -> Settings / Capacity / Performance (-> City Detail)
 *   Warehouse Overview -> Manage Sub Warehouse Admins
 *
 * Settings, Documents, Capacity and Performance are not re-implemented: they
 * open the existing shared ProfileFlow / StorageFlow routes, so their own
 * gates apply. Comparison, the Performance hand-offs (operations history,
 * staff attendance) and City Detail's Open Inventory / Open Operations go back
 * to the host, which owns those screens; the last two carry the warehouse uuid
 * so the host opens them on it (BR-30).
 *
 * Capacity always opens on the warehouse it was asked about (City Detail, a
 * card's Capacity action) and Manage Capacity Limits on the one the capacity
 * screen shows; only the overview's Capacity Summary tile, which has no
 * warehouse, leaves the pick to StorageFlow (./routes.ts).
 *
 * Gates: Overview, City Detail and Performance need `warehouse.all.view`;
 * Manage SWAs needs `admin.sub_wh_admin.create`; Settings needs
 * `warehouse.capacity.set`. navigate() refuses a route without its code and
 * each screen renders a not-available note if opened directly.
 */
import React, { useEffect, useState } from 'react';
import { useFlowBack } from '../useFlowBack';

import { ProfileFlow } from '../profile-settings';
import { StaffFlow } from '../staff-attendance';
import { StorageFlow } from '../storage-ops';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import { warehouseIdForName } from './mappers';
import { capacityEntryOf } from './routes';
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
  Staff: WAREHOUSE_ADMIN_CODES.staffView,
  Attendance: WAREHOUSE_ADMIN_CODES.attendanceView,
};

/** True when `can` allows opening `route`. */
export function canOpenWarehouseAdminRoute(route: WarehouseAdminRoute, can: PermissionCheck): boolean {
  const code = ROUTE_CODE[route];
  return code === undefined || can(code);
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
  /** Warehouse Management header bell (design M15-01): the host's notifications. */
  onOpenNotifications?: (() => void) | undefined;
  /** City Detail "Open Inventory": the host's Inventory tab on this warehouse. */
  onOpenInventory?: ((warehouseId: string) => void) | undefined;
  /** City Detail "Open Operations": the host's Operations hub on this warehouse. */
  onOpenOperations?: ((warehouseId: string) => void) | undefined;
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
  onOpenNotifications,
  onOpenInventory,
  onOpenOperations,
}: WarehouseAdminFlowProps) {
  const [stack, setStack] = useState<WarehouseAdminStackEntry[]>(() => [{ screen: initialScreen, params: initialParams }]);
  // Live warehouses (GET /warehouses), to turn a name the Performance screen hands back into a server uuid.
  const warehouses = useWarehouseOptions({ enabled: can(WAREHOUSE_ADMIN_CODES.allView) });

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

  // Hardware back pops this flow's stack; at its root the host's listener handles it.
  useFlowBack(() => {
    if (stack.length <= 1) return false;
    back();
    return true;
  });

  const openDetail = (warehouseId: string) => navigate('WarehouseCityDetail', { warehouseId });
  const openSettings = (warehouseId: string) => navigate('WarehouseSettings', { warehouseId });
  const openCapacity = (warehouseId?: string) => navigate('WarehouseCapacity', { warehouseId });

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
          onNavigateStaff={() => navigate('Staff')}
          onOpenNotifications={onOpenNotifications}
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
          onOpenStaff={(warehouseId) => navigate('Staff', { warehouseId })}
          onOpenSubAdmins={canOpenWarehouseAdminRoute('ManageSubWarehouseAdmins', can) ? () => navigate('ManageSubWarehouseAdmins') : undefined}
          onOpenInventory={onOpenInventory}
          onOpenOperations={onOpenOperations}
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
    case 'WarehouseCapacity': {
      const entry = capacityEntryOf(params.warehouseId);
      return (
        <StorageFlow
          scope={scope}
          can={can}
          initialScreen={entry.initialScreen}
          initialParams={entry.initialParams}
          onBack={back}
          onManageCapacity={(warehouseId) => navigate('WarehouseSettings', { warehouseId })}
        />
      );
    }
    case 'WarehousePerformance':
      return (
        <StorageFlow
          scope={scope}
          can={can}
          initialScreen="Performance"
          onBack={back}
          onSelectWarehouse={(name) => {
            const id = warehouseIdForName(warehouses.options, name);
            if (id !== undefined) openDetail(id);
          }}
          onViewOperationsHistory={onViewOperationsHistory}
          onViewStaffAttendance={onViewStaffAttendance ?? (() => navigate('Attendance'))}
        />
      );
    case 'Staff':
      return (
        <StaffFlow
          scope={params.warehouseId ? { ...scope, warehouseId: params.warehouseId } : scope}
          can={can}
          initialScreen="Staff"
          onBack={back}
        />
      );
    case 'Attendance':
      return (
        <StaffFlow
          scope={params.warehouseId ? { ...scope, warehouseId: params.warehouseId } : scope}
          can={can}
          initialScreen="Attendance"
          onBack={back}
        />
      );
    default:
      return null;
  }
}
