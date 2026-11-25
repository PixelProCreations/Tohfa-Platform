/**
 * Live data for the market day schedule. Thin wrapper over ./hooks.ts; the
 * decisions live in ./marketDay.ts and ./warehouseList.ts, which are tested
 * (hooks cannot be rendered in this app's plain-Node vitest).
 *
 * Two separate reads, as ./marketDay.ts explains:
 *   - useMarketDayVenues: GET /warehouses (warehouse.all.view), the recurring
 *     venue flags. There is no write for those: no endpoint toggles
 *     `is_market_day_venue`, so no screen may pretend to.
 *   - useMarketDaySchedule / useCreateMarketDay / useUpdateMarketDay:
 *     GET, POST and PATCH /admin/market-days (market.schedule.manage, BR-162),
 *     the dated schedule.
 *
 * Every hook takes `{ enabled }` so a screen can skip a request that would be
 * a 403. The server still decides (root CLAUDE.md 2.1); `enabled` only avoids
 * the round trip.
 *
 * No Idempotency-Key: the spec declares none on these routes (they move no
 * money), unlike the pricing writes in ./pricingHooks.ts.
 */
import { useMemo } from 'react';
import { useAdminMutation, useAdminQuery, type AdminQueryOptions } from './hooks';
import {
  createMarketDay,
  listMarketDays,
  patchMarketDay,
  toMarketDayVenues,
  type ListMarketDaysParams,
  type MarketDayCreateBody,
  type MarketDayDto,
  type MarketDayPatchBody,
  type MarketDayVenueView,
} from './marketDay';
import { adminKeys, marketDayKeys, MARKET_DAY_MODULE } from './queryKeys';
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
  const query = useAdminQuery<WarehouseDto[]>(marketDayKeys.venues(), (signal) => listAllWarehouses({}, signal), { enabled });
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

// ---------------------------------------------------------------------------
// The dated schedule: /admin/market-days (market.schedule.manage, BR-162)
// ---------------------------------------------------------------------------

export interface MarketDayScheduleList {
  /** The rows the server sent, in its order. Not paged: the route answers a plain array. */
  days: MarketDayDto[];
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
}

/**
 * market.schedule.manage: the scheduled market days, optionally narrowed to
 * one warehouse and a date range. With `enabled: false` nothing is fetched.
 */
export function useMarketDaySchedule(
  warehouseId: string | undefined,
  filters: ListMarketDaysParams = {},
  options: AdminQueryOptions = {},
): MarketDayScheduleList {
  const enabled = options.enabled ?? true;
  const query = useAdminQuery<MarketDayDto[]>(
    marketDayKeys.schedule(warehouseId, filters),
    (signal) => listMarketDays(filters, signal),
    { enabled },
  );
  const days = useMemo(() => query.data ?? [], [query.data]);
  return {
    days,
    isLoading: enabled && query.isLoading,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
  };
}

export interface LiveMarketDayWrite<TVariables> {
  /** Runs the write; `onDone` fires only after the server stored it. Ignored while one is in flight. */
  run: (variables: TVariables, onDone?: (result: MarketDayDto) => void) => void;
  isPending: boolean;
  /** The last failure, for adminErrorKey: FORBIDDEN, NOT_FOUND, VALIDATION_FAILED. */
  error: unknown;
  /** Call once the edit is done (or abandoned), so the next one starts clean. */
  finish: () => void;
}

function notPermitted(): Promise<never> {
  return Promise.reject(new Error('Market day schedule write is not enabled for this caller.'));
}

function useMarketDayWrite<TVariables>(
  send: (variables: TVariables) => Promise<MarketDayDto>,
  enabled: boolean,
): LiveMarketDayWrite<TVariables> {
  const mutation = useAdminMutation<TVariables, MarketDayDto>({
    mutationFn: (variables) => (enabled ? send(variables) : notPermitted()),
    // Both resources of the module: a new or changed dated row can change what
    // a venue list means to the reader, and the two share one cache prefix.
    invalidates: [adminKeys.module(MARKET_DAY_MODULE)],
  });
  const { mutate, isPending, error, reset } = mutation;
  return useMemo(
    () => ({
      run: (variables: TVariables, onDone?: (result: MarketDayDto) => void) => {
        if (isPending) return;
        if (onDone === undefined) mutate(variables);
        else mutate(variables, { onSuccess: (result) => onDone(result) });
      },
      isPending,
      error,
      finish: () => reset(),
    }),
    [mutate, isPending, error, reset],
  );
}

/** POST /admin/market-days (market.schedule.manage). A success refetches the module. */
export function useCreateMarketDay(options: AdminQueryOptions = {}): LiveMarketDayWrite<MarketDayCreateBody> {
  return useMarketDayWrite<MarketDayCreateBody>(createMarketDay, options.enabled ?? true);
}

export interface MarketDayUpdate {
  id: string;
  patch: MarketDayPatchBody;
}

/** PATCH /admin/market-days/{id} (market.schedule.manage). A success refetches the module. */
export function useUpdateMarketDay(options: AdminQueryOptions = {}): LiveMarketDayWrite<MarketDayUpdate> {
  return useMarketDayWrite<MarketDayUpdate>(({ id, patch }) => patchMarketDay(id, patch), options.enabled ?? true);
}
