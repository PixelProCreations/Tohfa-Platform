/**
 * Live data for Zone Management. Thin wrappers over ./hooks.ts; requests and
 * types live in ./zones.ts, keys in ./queryKeys.ts, every decision in
 * screens/zones/zonesLogic.ts (hooks cannot be rendered in this app's
 * plain-Node vitest, so anything with a branch is tested there).
 *
 * Per-zone farmer COUNTS are not fetched here: the screen reuses
 * useFarmerSummary (./farmerHooks.ts), the same read AdminAllFarmersScreen uses.
 *
 * Every hook takes `{ enabled }` so a view that does not need a read does not
 * send it; the server still decides access (root CLAUDE.md 2.1).
 */
import { useEffect } from 'react';
import { useFarmerList, type FarmerListFilters } from './farmerHooks';
import type { FarmerRowView } from './farmerTypes';
import { useAdminQuery, type AdminQueryOptions } from './hooks';
import { zoneKeys } from './queryKeys';
import { getAdminZone, listAdminZones, type AdminZoneDetailDto, type AdminZoneListItemDto } from './zones';
import { listAllWarehouses } from './warehouseList';
import type { WarehouseDto } from './warehouses';

export interface LiveRead {
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
  isRefreshing: boolean;
}

function readState(query: { isPending: boolean; error: unknown; refetch: () => unknown; isRefetching: boolean }, enabled: boolean): LiveRead {
  return {
    isLoading: enabled && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
    isRefreshing: query.isRefetching,
  };
}

export interface LiveZones extends LiveRead {
  /** Every zone, active and inactive; undefined before the first answer. An empty array is a genuine empty list. */
  zones: AdminZoneListItemDto[] | undefined;
}

/** GET /admin/zones?status=ALL (zone.view). */
export function useAdminZones(options: AdminQueryOptions = {}): LiveZones {
  const enabled = options.enabled ?? true;
  const query = useAdminQuery<AdminZoneListItemDto[]>(zoneKeys.list('ALL'), (signal) => listAdminZones({ status: 'ALL' }, signal), { enabled });
  return { ...readState(query, enabled), zones: query.data };
}

export interface LiveZone extends LiveRead {
  zone: AdminZoneDetailDto | undefined;
}

/** GET /admin/zones/{id}: adds the manager. Without an id nothing is fetched. */
export function useAdminZone(zoneId: string | undefined, options: AdminQueryOptions = {}): LiveZone {
  const enabled = zoneId !== undefined && zoneId !== '' && (options.enabled ?? true);
  const query = useAdminQuery<AdminZoneDetailDto>(zoneKeys.detail(zoneId), (signal) => getAdminZone(zoneId ?? '', signal), { enabled });
  return { ...readState(query, enabled), zone: query.data };
}

export interface LiveZoneWarehouses extends LiveRead {
  warehouses: WarehouseDto[] | undefined;
}

/** GET /warehouses (warehouse.all.view), for a zone's warehouse code and type. */
export function useZoneWarehouses(options: AdminQueryOptions = {}): LiveZoneWarehouses {
  const enabled = options.enabled ?? true;
  const query = useAdminQuery<WarehouseDto[]>(zoneKeys.warehouses(), (signal) => listAllWarehouses({}, signal), { enabled });
  return { ...readState(query, enabled), warehouses: query.data };
}

export interface LiveFarmersAllPages {
  items: FarmerRowView[];
  /** True once the first page is in and no further page remains: the only state in which a count over `items` is honest. */
  allPagesLoaded: boolean;
  hasMore: boolean;
  loadMore: () => void;
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
  isRefreshing: boolean;
}

/**
 * GET /admin/farmers (farmer.profile.view_all), following the cursor until the
 * last page. `filters.zoneId` narrows it to a zone. The follow-on loads are an
 * effect over the same query the farmer list uses, so a screen that also
 * shows a "Show more" button shares one cache.
 */
export function useFarmersAllPages(filters: FarmerListFilters, options: AdminQueryOptions = {}): LiveFarmersAllPages {
  const enabled = options.enabled ?? true;
  const list = useFarmerList(undefined, filters, { enabled });
  const { hasMore, loadMore, error } = list;
  const failed = error !== null && error !== undefined;
  useEffect(() => {
    if (enabled && hasMore && !failed) loadMore();
  }, [enabled, hasMore, failed, loadMore, list.items.length]);
  return {
    items: list.items,
    allPagesLoaded: enabled && list.firstPage !== undefined && !hasMore,
    hasMore,
    loadMore,
    isLoading: list.isLoading,
    error,
    refresh: list.refresh,
    isRefreshing: list.isRefreshing,
  };
}
