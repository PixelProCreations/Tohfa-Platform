/**
 * Every read the Inventory & Warehouse overview (M10-S01) makes, as thin
 * TanStack Query wrappers. No decisions here (hooks are not rendered in this
 * app's plain-Node vitest); the screen test mocks this module and
 * ./warehouseOverviewLogic.ts holds the mapping.
 *
 *   GET /warehouses                          warehouse.all.view   (the list, filter chips)
 *   GET /admin/inventory/overview            inventory.batch.view (BR-116: available kg, counts)
 *   GET /warehouses/{id}/capacity            warehouse.own.view   (per card, BR-66)
 *   GET /warehouse-transfers?status&pageSize=1  transfer.inter_warehouse.view (BR-102)
 *
 * Capacity and open transfers are one query per warehouse, so one failed
 * warehouse marks only its own card failed (the design's "failed to load").
 * Transfer figures read the list's exact `total` from a 1-row page, never a
 * count of rows (which a page size would cap).
 */
import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { useAdminQuery } from '../../api/hooks';
import { adminKeys } from '../../api/queryKeys';
import { getInventoryOverview, type InventoryOverviewDto } from '../../api/inventoryOverview';
import { listWarehouseTransfers } from '../../api/transfers';
import { listAllWarehouses } from '../../api/warehouseList';
import { getWarehouseCapacity, type WarehouseCapacityDto, type WarehouseDto } from '../../api/warehouses';
import type { Fetched } from './warehouseOverviewLogic';

export type { Fetched } from './warehouseOverviewLogic';

const MODULE = 'warehouseOverview';

export interface WarehouseOverviewData {
  warehouses: { data: WarehouseDto[] | undefined; isLoading: boolean; error: unknown; refresh: () => void };
  overview: Fetched<InventoryOverviewDto>;
  networkInTransit: Fetched<number>;
  capacityById: Record<string, Fetched<WarehouseCapacityDto>>;
  openTransfersById: Record<string, Fetched<number>>;
  /** Refetch every figure query (KPI and per-card). */
  refreshFigures: () => void;
}

export interface WarehouseOverviewDataOptions {
  /** warehouse.all.view; false fetches nothing. */
  enabled: boolean;
  overview: boolean;
  capacity: boolean;
  transfers: boolean;
}

function fetched<T>(enabled: boolean, q: Pick<UseQueryResult<T>, 'data' | 'isPending' | 'isError'>): Fetched<T> {
  if (!enabled) return { status: 'off' };
  if (q.data !== undefined) return { status: 'ok', data: q.data };
  if (q.isError) return { status: 'failed' };
  return { status: 'loading' };
}

async function openTransferTotal(warehouseId: string, signal: AbortSignal): Promise<number> {
  const [pending, inTransit] = await Promise.all([
    listWarehouseTransfers({ status: 'PENDING_APPROVAL', warehouseId, page: 1, pageSize: 1 }, signal),
    listWarehouseTransfers({ status: 'IN_TRANSIT', warehouseId, page: 1, pageSize: 1 }, signal),
  ]);
  return pending.total + inTransit.total;
}

export function useWarehouseOverviewData(opts: WarehouseOverviewDataOptions): WarehouseOverviewData {
  const listQuery = useAdminQuery(adminKeys.scoped(MODULE, undefined, { resource: 'warehouses' }), (signal) => listAllWarehouses({}, signal), {
    enabled: opts.enabled,
  });
  const ids = (listQuery.data ?? []).map((w) => w.id);

  const overviewOn = opts.enabled && opts.overview;
  const overviewQuery = useAdminQuery(adminKeys.scoped(MODULE, undefined, { resource: 'overview' }), (signal) => getInventoryOverview(signal), {
    enabled: overviewOn,
  });

  const transfersOn = opts.enabled && opts.transfers;
  const inTransitQuery = useAdminQuery(
    adminKeys.scoped(MODULE, undefined, { resource: 'inTransit' }),
    (signal) => listWarehouseTransfers({ status: 'IN_TRANSIT', page: 1, pageSize: 1 }, signal).then((p) => p.total),
    { enabled: transfersOn },
  );

  const capacityOn = opts.enabled && opts.capacity;
  const capacityQueries = useQueries({
    queries: ids.map((id) => ({
      queryKey: adminKeys.scoped(MODULE, id, { resource: 'capacity' }),
      queryFn: ({ signal }: { signal: AbortSignal }) => getWarehouseCapacity(id, signal),
      enabled: capacityOn,
    })),
  });
  const transferQueries = useQueries({
    queries: ids.map((id) => ({
      queryKey: adminKeys.scoped(MODULE, id, { resource: 'openTransfers' }),
      queryFn: ({ signal }: { signal: AbortSignal }) => openTransferTotal(id, signal),
      enabled: transfersOn,
    })),
  });

  const capacityById: Record<string, Fetched<WarehouseCapacityDto>> = {};
  const openTransfersById: Record<string, Fetched<number>> = {};
  ids.forEach((id, i) => {
    const cap = capacityQueries[i];
    const tr = transferQueries[i];
    if (cap) capacityById[id] = fetched(capacityOn, cap);
    if (tr) openTransfersById[id] = fetched(transfersOn, tr);
  });

  return {
    warehouses: {
      data: listQuery.data,
      isLoading: opts.enabled && listQuery.isPending,
      error: listQuery.error,
      refresh: () => {
        void listQuery.refetch();
      },
    },
    overview: fetched(overviewOn, overviewQuery),
    networkInTransit: fetched(transfersOn, inTransitQuery),
    capacityById,
    openTransfersById,
    refreshFigures: () => {
      if (overviewOn) void overviewQuery.refetch();
      if (transfersOn) void inTransitQuery.refetch();
      for (const q of capacityOn ? capacityQueries : []) void q.refetch();
      for (const q of transfersOn ? transferQueries : []) void q.refetch();
    },
  };
}
