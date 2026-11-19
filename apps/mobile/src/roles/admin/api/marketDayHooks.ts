/**
 * Live data for the market day schedule. Thin wrapper over ./hooks.ts; the
 * decisions live in ./marketDay.ts and ./warehouseList.ts, which are tested
 * (hooks cannot be rendered in this app's plain-Node vitest).
 *
 * Reads GET /warehouses (warehouse.all.view) and keeps the market day venues.
 * See ./marketDay.ts for why that is the only live source there is, and what
 * the design shows that the API does not carry.
 *
 * There is no write hook here on purpose: no endpoint creates a market day or
 * toggles a venue, so no screen may pretend to.
 */
import { useMemo } from 'react';
import { useAdminQuery, type AdminQueryOptions } from './hooks';
import { toMarketDayVenues, type MarketDayVenueView } from './marketDay';
import { adminKeys, MARKET_DAY_MODULE } from './queryKeys';
import { listAllWarehouses } from './warehouseList';
import type { WarehouseDto } from './warehouses';

export interface MarketDayVenueList {
  venues: MarketDayVenueView[];
  /** Every warehouse the caller may see, for the Add screen's picker. */
  warehouses: WarehouseDto[];
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
}

/**
 * warehouse.all.view: the warehouses flagged as market day venues. With
 * `enabled: false` nothing is fetched (a caller without the code would get a
 * 403); the server still decides (root CLAUDE.md 2.1).
 */
export function useMarketDayVenues(options: AdminQueryOptions = {}): MarketDayVenueList {
  const enabled = options.enabled ?? true;
  const query = useAdminQuery<WarehouseDto[]>(
    adminKeys.scoped(MARKET_DAY_MODULE, undefined, { resource: 'venues' }),
    (signal) => listAllWarehouses({}, signal),
    { enabled },
  );
  const rows = useMemo(() => query.data ?? [], [query.data]);
  const venues = useMemo(() => toMarketDayVenues(rows), [rows]);
  return {
    venues,
    warehouses: rows,
    isLoading: enabled && query.isLoading,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
  };
}
