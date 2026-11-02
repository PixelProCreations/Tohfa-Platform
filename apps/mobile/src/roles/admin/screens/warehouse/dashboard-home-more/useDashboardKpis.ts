/**
 * Live reads behind the Main / Sub warehouse dashboard KPIs. Thin TanStack
 * Query wrappers over existing admin API modules; every decision lives in
 * ./mappers_dashboardKpis.ts, which is tested. No new endpoint is called:
 *
 *   GET /warehouses/{id}/performance   warehouse.all.view (Main only, BR-80)
 *   GET /admin/sales/summary           sales.dashboard.view (BR-96)
 *   GET /warehouses/{id}/issues        warehouse.issue.view (BR-103), `total` per status
 *   GET /warehouses/{id}/activity      warehouse.activity.view (BR-104), first page per warehouse
 *
 * Keys follow adminKeys.scoped(module, warehouseId, params); the sales key is
 * the one the Sub dashboard already used, so both share the cache.
 */
import { useMemo } from 'react';
import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { getSalesSummary } from '../../../api/sales';
import { listWarehouseActivity } from '../../../api/warehouseActivity';
import { listWarehouseIssues, type IssueStatusCode } from '../../../api/warehouseIssues';
import { getWarehousePerformance } from '../../../api/warehouseOps';
import { receiptsByWarehouse } from '../warehouse-admin/overviewFigures';
import { sumPerformance } from './mappers_dashboardKpis';

const DASHBOARD = 'dashboardHome';
/** Issues still needing work; RESOLVED and CLOSED are done. */
const OPEN_ISSUE_STATUSES: readonly IssueStatusCode[] = ['OPEN', 'IN_PROGRESS'];

function idsKey(ids: readonly string[]): string {
  return [...ids].sort().join(',');
}

/**
 * Performance summed over `warehouseIds` for one inclusive IST range, plus each
 * warehouse's own receipt count (the Warehouse Overview cards) from the same
 * responses, so the per-warehouse figure costs no extra request.
 */
export function useWarehousesPerformance(warehouseIds: readonly string[], range: { from: string; to: string }, enabled: boolean) {
  const query = useAdminQuery(
    adminKeys.scoped(DASHBOARD, undefined, { resource: 'performance-sum', ids: idsKey(warehouseIds), from: range.from, to: range.to }),
    async (signal) => {
      const rows = await Promise.all(warehouseIds.map((id) => getWarehousePerformance(id, range, signal)));
      return { ...sumPerformance(rows), receiptsByWarehouse: receiptsByWarehouse(rows) };
    },
    { enabled: enabled && warehouseIds.length > 0 },
  );
  return query;
}

/** The sales summary for one warehouse (or the caller's whole scope when undefined). */
export function useDashboardSalesSummary(warehouseId: string | undefined, range: { from: string; to: string }, enabled: boolean) {
  return useAdminQuery(
    adminKeys.scoped('sales', warehouseId, { resource: 'summary', from: range.from, to: range.to }),
    (signal) => getSalesSummary({ warehouseId, from: range.from, to: range.to }, signal),
    { enabled },
  );
}

/** Open + in-progress issues over `warehouseIds`, from each list's exact `total`. */
export function useOpenIssueCount(warehouseIds: readonly string[], enabled: boolean) {
  return useAdminQuery(
    adminKeys.scoped('warehouseIssues', undefined, { resource: 'open-count', ids: idsKey(warehouseIds) }),
    async (signal) => {
      const totals = await Promise.all(
        warehouseIds.flatMap((id) =>
          OPEN_ISSUE_STATUSES.map((status) => listWarehouseIssues(id, { status, page: 1, pageSize: 1 }, signal).then((p) => p.total)),
        ),
      );
      return totals.reduce((sum, n) => sum + n, 0);
    },
    { enabled: enabled && warehouseIds.length > 0 },
  );
}

/** The first activity page of each warehouse, for a merged "newest first" list. */
export function useRecentActivityPages(warehouseIds: readonly string[], limit: number, enabled: boolean) {
  const query = useAdminQuery(
    adminKeys.scoped('warehouseActivity', undefined, { resource: 'recent-merged', ids: idsKey(warehouseIds), limit }),
    (signal) =>
      Promise.all(
        warehouseIds.map((id) => listWarehouseActivity(id, { limit }, signal).then((page) => ({ warehouseId: id, items: page.items }))),
      ),
    { enabled: enabled && warehouseIds.length > 0 },
  );
  const pages = useMemo(() => query.data ?? [], [query.data]);
  return { ...query, pages };
}
