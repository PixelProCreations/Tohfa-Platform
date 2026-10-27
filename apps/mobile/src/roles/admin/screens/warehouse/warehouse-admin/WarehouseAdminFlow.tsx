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
import React, { useEffect, useMemo, useState } from 'react';
import { useFlowBack } from '../useFlowBack';

import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { listAllSubAdmins } from '../../../api/subAdmins';
import { istDay } from '../../../utils/datetime';
import { ProfileFlow } from '../profile-settings';
import { StorageFlow } from '../storage-ops';
import { ManageSubWarehouseAdminsScreen } from './ManageSubWarehouseAdminsScreen';
import { nearFullFromAlerts, toSubWarehouseAdminItem, toWarehouseAdminRow } from './mappers';
import { WarehouseCityDetailScreen } from './WarehouseCityDetailScreen';
import { WAREHOUSE_ADMIN_CODES } from './WarehouseAdminParts';
import { WarehouseOverviewScreen } from './WarehouseOverviewScreen';
import { WarehousePerformanceScreen } from '../storage-ops/WarehousePerformanceScreen';
import { WarehouseCapacitySummaryScreen } from './WarehouseCapacitySummaryScreen';
import { useWarehouseNetwork } from './useWarehouseNetwork';
import type { PermissionCheck, WarehouseAdminRoute, WarehouseAdminRouteParams, WarehouseScope } from './types';
import type { SubWarehouseAdminItem, WarehouseAdminRow } from './types';

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


const NO_WH_ROWS: readonly WarehouseAdminRow[] = [];
const NO_SUB_ADMINS: readonly SubWarehouseAdminItem[] = [];

export interface WarehouseAdminFlowProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  initialScreen?: WarehouseAdminRoute | undefined;
  initialParams?: WarehouseAdminRouteParams | undefined;
  /** Leave the module (pressed back on its first screen). */
  onBack: () => void;
  /** Host screens the flow does not own. */
  onNavigateComparison?: (() => void) | undefined;
  onManageWarehouses?: (() => void) | undefined;
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
  onManageWarehouses,
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

  // Live warehouse data shared with WarehouseOverviewScreen via TanStack Query cache.
  // The Overview also calls useWarehouseNetwork; both share the same cache keys so
  // only one HTTP request is made (TanStack Query deduplication).
  const canAllView = can(WAREHOUSE_ADMIN_CODES.allView);
  const today = istDay(new Date());
  const net = useWarehouseNetwork({ can, enabled: canAllView, warehouseId: undefined, today });

  // Map to WarehouseAdminRow[] — used by WarehouseCityDetailScreen and ManageSubWarehouseAdminsScreen.
  const warehouseRows = useMemo((): readonly WarehouseAdminRow[] => {
    if (!net.capacitiesQuery.data) return NO_WH_ROWS;
    return net.warehouses.map((wh) => {
      const cap = net.capacitiesQuery.data!.get(wh.id);
      if (!cap) return null;
      const nearFull = nearFullFromAlerts(net.alertsQuery.data?.items, wh.id);
      return toWarehouseAdminRow(wh, cap, nearFull);
    }).filter((r): r is WarehouseAdminRow => r !== null);
  }, [net.warehouses, net.capacitiesQuery.data, net.alertsQuery.data]);

  // Live sub-admin list (gated on admin.sub_wh_admin.create; Main-only per docs/rbac.json).
  const canSwaCreate = can(WAREHOUSE_ADMIN_CODES.swaCreate);
  const subAdminsQuery = useAdminQuery(
    adminKeys.scoped('subAdmins', undefined, { resource: 'all' }),
    (signal) => listAllSubAdmins({}, signal),
    { enabled: canSwaCreate },
  );
  const subAdmins = useMemo(
    () => (subAdminsQuery.data ? subAdminsQuery.data.map(toSubWarehouseAdminItem) : NO_SUB_ADMINS),
    [subAdminsQuery.data],
  );

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
          onManageWarehouses={onManageWarehouses ?? (() => navigate('ManageSubWarehouseAdmins'))}
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
          warehouses={warehouseRows.length > 0 ? warehouseRows : undefined}
          onOpenDocuments={(warehouseId) => navigate('WarehouseDocuments', { warehouseId })}
          onOpenSettings={openSettings}
          onOpenCapacity={openCapacity}
        />
      );
    case 'ManageSubWarehouseAdmins':
      return (
        <ManageSubWarehouseAdminsScreen
          scope={scope}
          can={can}
          onBack={back}
          admins={subAdmins.length > 0 ? subAdmins : undefined}
          warehouses={warehouseRows.length > 0 ? warehouseRows : undefined}
        />
      );
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
        <WarehouseCapacitySummaryScreen
          scope={scope}
          can={can}
          onBack={back}
        />
      );
    case 'WarehousePerformance':
      return (
        <WarehousePerformanceScreen
          scope={scope}
          can={can}
          onBack={back}
        />
      );
    default:
      return null;
  }
}
