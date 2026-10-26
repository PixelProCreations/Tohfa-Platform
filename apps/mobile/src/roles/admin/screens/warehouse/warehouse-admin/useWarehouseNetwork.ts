/**
 * The Main admin's network reads shared by the Home dashboard (D01, D04, D05)
 * and the Warehouse Overview (D02): the live warehouse list, each covered
 * warehouse's capacity, the active alerts, the open issue counts and today's
 * goods receipts. Both screens call this hook with the same keys, so TanStack
 * Query answers the second from the first one's cache instead of refetching.
 *
 * A thin wrapper on purpose (hooks cannot run in this app's plain-Node
 * vitest): every decision is in api/dashboardFeeds.ts and
 * screens/dashboard/mappers_mainDashboard.ts, which are tested. Each read is
 * enabled only with its own docs/rbac.json code (MAIN_DASHBOARD_CODES); the
 * server authorises it again (root CLAUDE.md 2.1).
 */
import { useMemo } from 'react';
import {
  getActiveAlerts,
  getGoodsReceiptsOnDay,
  getOpenIssueCounts,
  getWarehouseCapacities,
} from '../../../api/dashboardFeeds';
import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { listWarehouses, type WarehouseDto } from '../../../api/warehouses';
import { coveredWarehouseIds, dashboardAccess } from '../../dashboard/mappers_mainDashboard';

/** The live warehouse list's key; the warehouse activity screen reads the same one. */
export const NETWORK_WAREHOUSES_KEY = adminKeys.scoped('warehouses', undefined, { pageSize: 100, isActive: true });

const NO_WAREHOUSES: readonly WarehouseDto[] = [];

export interface WarehouseNetworkOptions {
  can: (code: string) => boolean;
  /** False until the caller holds warehouse.all.view (or the screen is not shown). */
  enabled: boolean;
  /** A live warehouse uuid, or undefined for every warehouse. */
  warehouseId: string | undefined;
  /** The IST day ("YYYY-MM-DD") for today's receipts. */
  today: string;
}

export function useWarehouseNetwork({ can, enabled, warehouseId, today }: WarehouseNetworkOptions) {
  const access = dashboardAccess(can);

  // GET /warehouses (warehouse.all.view): the API's own isActive filter, no seed-code list.
  const warehousesQuery = useAdminQuery(NETWORK_WAREHOUSES_KEY, (signal) => listWarehouses({ isActive: true, pageSize: 100 }, signal), {
    enabled,
  });
  const warehouses = warehousesQuery.data?.items ?? NO_WAREHOUSES;
  const listed = warehousesQuery.data !== undefined;
  const coveredIds = useMemo(() => coveredWarehouseIds(warehouses, warehouseId), [warehouses, warehouseId]);
  const idsKey = coveredIds.join(',');

  // GET /warehouses/{id}/capacity per covered warehouse (BR-66): stock in use and utilization, as the server derives them.
  const capacitiesQuery = useAdminQuery(
    adminKeys.scoped('warehouses', warehouseId, { resource: 'capacity', ids: idsKey }),
    (signal) => getWarehouseCapacities(coveredIds, signal),
    { enabled: enabled && listed && access.capacity },
  );

  // GET /admin/alerts?state=active, every page (BR-77): the caller's own active alerts.
  const alertsQuery = useAdminQuery(
    adminKeys.scoped('alerts', warehouseId, { resource: 'list', state: 'active' }),
    (signal) => getActiveAlerts(warehouseId, signal),
    { enabled: enabled && access.alerts },
  );

  // GET /warehouses/{id}/issues totals (BR-103): what staff reported, not the alerts.
  const issuesQuery = useAdminQuery(
    adminKeys.scoped('warehouseIssues', warehouseId, { resource: 'open-count', ids: idsKey }),
    (signal) => getOpenIssueCounts(coveredIds, signal),
    { enabled: enabled && listed && access.issues },
  );

  // GET /admin/goods-receipts for the IST day.
  const receiptsTodayQuery = useAdminQuery(
    adminKeys.scoped('receiving', warehouseId, { resource: 'grn-day', day: today }),
    (signal) => getGoodsReceiptsOnDay(warehouseId, today, signal),
    { enabled: enabled && access.receipts },
  );

  return { access, warehousesQuery, warehouses, coveredIds, capacitiesQuery, alertsQuery, issuesQuery, receiptsTodayQuery };
}
