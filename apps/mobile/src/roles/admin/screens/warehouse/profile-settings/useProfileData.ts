/**
 * Live data for the account and warehouse-profile screens (plan phase 8).
 * Thin wrappers over the admin hooks (../../../api/hooks.ts); every decision
 * lives in ./mappers.ts or the API modules, which are tested.
 *
 * The account routes act on the caller from the token (no user id, no
 * warehouse is sent); the scope's warehouse only keys the cache. The warehouse
 * hooks take the uuid the flow computed with profileWarehouseId (a Sub scope is
 * always its own warehouse, BR-30) and fetch nothing without one.
 *
 * None of these writes declares an Idempotency-Key in docs/openapi.yaml (no
 * money moves; the PATCHes are idempotent by value), so none is sent.
 */
import { useCallback, useMemo } from 'react';
import { keepPreviousData, useInfiniteQuery, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import type { OffsetPage } from '../../../../../shell/api/pagination';
import { useAdminMutation, useAdminQuery } from '../../../api/hooks';
import {
  changeOwnPassword,
  getAdminHelp,
  getMe,
  listAdminNotificationPreferences,
  listMySessions,
  updateAdminNotificationPreference,
  updateMe,
  type AdminLocale,
  type AdminNotificationCategory,
  type ChangePasswordBody,
} from '../../../api/profile';
import { adminKeys } from '../../../api/queryKeys';
import { getWarehouse, getWarehouseCapacity, listStorageLocations, type StorageLocationDto } from '../../../api/warehouses';
import { getLocale } from '../../../i18n';
import {
  nextStoragePage,
  toAccountProfile,
  toCapacityView,
  toHelpView,
  toPreferenceState,
  toSessionRow,
  toStorageLocation,
  toWarehouseProfile,
  type PreferenceState,
} from './mappers';
import type {
  AccountProfileView,
  CapacityView,
  HelpView,
  SessionRowView,
  StorageLocationView,
  WarehouseProfileView,
  WarehouseScope,
} from './types';

const PROFILE = 'profile';
const WAREHOUSE = 'warehouse';

/** Rows of one storage-locations page; the server caps pageSize at 100. */
const STORAGE_PAGE_SIZE = 20;

/** What a data screen needs to pick an AsyncState and to refresh. */
export interface LiveQueryState {
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
  isRefreshing: boolean;
}

function queryState(query: { isPending: boolean; error: unknown; refetch: () => unknown; isRefetching: boolean }): LiveQueryState {
  return {
    isLoading: query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
    isRefreshing: query.isRefetching,
  };
}

export interface LiveWrite<TBody> {
  /** Runs the write; `onDone` fires after it succeeded. */
  run: (body: TBody, onDone?: () => void) => void;
  isPending: boolean;
  /** The last failure; null after a success or reset(). */
  error: unknown;
  reset: () => void;
}

function useWrite<TBody, TResult>(mutationFn: (body: TBody) => Promise<TResult>, invalidates: readonly QueryKey[]): LiveWrite<TBody> {
  const { mutate, isPending, error, reset } = useAdminMutation<TBody, TResult>({ mutationFn, invalidates });
  return useMemo(
    () => ({
      run: (body: TBody, onDone?: () => void) => {
        if (isPending) return;
        if (onDone === undefined) mutate(body);
        else mutate(body, { onSuccess: () => onDone() });
      },
      isPending,
      error,
      reset,
    }),
    [mutate, isPending, error, reset],
  );
}

// ─── Own account ─────────────────────────────────────────────────────────────

export interface LiveAccount extends LiveQueryState {
  profile: AccountProfileView | undefined;
}

/** GET /auth/me as the profile screens show it. */
export function useAccount(scope: WarehouseScope): LiveAccount {
  const query = useAdminQuery(adminKeys.scoped(PROFILE, scope.warehouseId, { resource: 'me' }), (signal) => getMe(signal));
  const profile = useMemo(() => (query.data === undefined ? undefined : toAccountProfile(query.data, scope, new Date())), [query.data, scope]);
  return { ...queryState(query), profile };
}

/** BR-82: the display name. Only fullName is sent (BR-33). */
export function useSaveName(): LiveWrite<string> {
  return useWrite((fullName: string) => updateMe({ fullName }), [adminKeys.module(PROFILE)]);
}

/** BR-82: the preferred language, stored on the account. */
export function useSaveLanguage(): LiveWrite<AdminLocale> {
  return useWrite((preferredLocale: AdminLocale) => updateMe({ preferredLocale }), [adminKeys.module(PROFILE)]);
}

/**
 * Change password. A success revokes every session on the server (this one
 * too); the flow signs out in onDone. Nothing to invalidate: the cache dies
 * with the session.
 */
export function useChangePassword(): LiveWrite<ChangePasswordBody> {
  return useWrite((body: ChangePasswordBody) => changeOwnPassword(body), []);
}

export interface LiveSessions extends LiveQueryState {
  sessions: SessionRowView[];
}

/** BR-67: the caller's own live sessions. */
export function useMySessions(scope: WarehouseScope): LiveSessions {
  const query = useAdminQuery(adminKeys.scoped(PROFILE, scope.warehouseId, { resource: 'sessions' }), (signal) => listMySessions(signal));
  const sessions = useMemo(() => {
    const now = new Date();
    return (query.data ?? []).map((session) => toSessionRow(session, now));
  }, [query.data]);
  return { ...queryState(query), sessions };
}

// ─── Notification preferences (BR-82) ────────────────────────────────────────

export interface LivePreferences extends LiveQueryState {
  preferences: PreferenceState | undefined;
}

export function useNotificationPreferences(scope: WarehouseScope): LivePreferences {
  const query = useAdminQuery(adminKeys.scoped(PROFILE, scope.warehouseId, { resource: 'notificationPreferences' }), (signal) =>
    listAdminNotificationPreferences(signal),
  );
  const preferences = useMemo(() => (query.data === undefined ? undefined : toPreferenceState(query.data)), [query.data]);
  return { ...queryState(query), preferences };
}

export type PreferenceChange = { category: AdminNotificationCategory; enabled: boolean };

/**
 * Saves the changed categories one PATCH each (there is no bulk endpoint), in
 * screen order, stopping at the first failure. The preferences are refetched
 * after a success; the screen refetches after a failure too, so it shows what
 * was actually stored.
 */
export function useSavePreferences(): LiveWrite<readonly PreferenceChange[]> {
  return useWrite(async (changes: readonly PreferenceChange[]) => {
    for (const change of changes) await updateAdminNotificationPreference(change.category, change.enabled);
  }, [adminKeys.module(PROFILE)]);
}

// ─── Help (BR-82) ────────────────────────────────────────────────────────────

export interface LiveHelp extends LiveQueryState {
  help: HelpView | undefined;
}

/** Published help in the admin's current language. */
export function useAdminHelp(scope: WarehouseScope): LiveHelp {
  const locale: AdminLocale = getLocale() === 'ta' ? 'ta' : 'en';
  const query = useAdminQuery(adminKeys.scoped(PROFILE, scope.warehouseId, { resource: 'help', locale }), (signal) =>
    getAdminHelp({ locale }, signal),
  );
  const help = useMemo(() => (query.data === undefined ? undefined : toHelpView(query.data)), [query.data]);
  return { ...queryState(query), help };
}

// ─── Warehouse (BR-30, BR-66) ────────────────────────────────────────────────

export interface LiveWarehouse extends LiveQueryState {
  warehouse: WarehouseProfileView | undefined;
  /** The stored operating hours as sent (./mappers.ts toOperatingWeek reads them). */
  operatingHours: unknown;
}

/** GET /warehouses/{id}; nothing while `warehouseId` is undefined. */
export function useWarehouseProfile(warehouseId: string | undefined): LiveWarehouse {
  const query = useAdminQuery(
    adminKeys.scoped(WAREHOUSE, warehouseId, { resource: 'warehouse' }),
    (signal) => getWarehouse(warehouseId ?? '', signal),
    { enabled: warehouseId !== undefined },
  );
  const warehouse = useMemo(() => (query.data === undefined ? undefined : toWarehouseProfile(query.data)), [query.data]);
  return {
    ...queryState(query),
    isLoading: warehouseId !== undefined && query.isPending,
    warehouse,
    operatingHours: query.data?.operatingHours ?? null,
  };
}

export interface LiveCapacity extends LiveQueryState {
  capacity: CapacityView | undefined;
}

/** GET /warehouses/{id}/capacity (BR-66b); nothing without a warehouse. */
export function useWarehouseCapacity(warehouseId: string | undefined): LiveCapacity {
  const query = useAdminQuery(
    adminKeys.scoped(WAREHOUSE, warehouseId, { resource: 'capacity' }),
    (signal) => getWarehouseCapacity(warehouseId ?? '', signal),
    { enabled: warehouseId !== undefined },
  );
  const capacity = useMemo(() => (query.data === undefined ? undefined : toCapacityView(query.data)), [query.data]);
  return { ...queryState(query), isLoading: warehouseId !== undefined && query.isPending, capacity };
}

export interface StorageFilter {
  /** undefined = every location. */
  isActive?: boolean | undefined;
  /** Free text over code, name or type; sent only when not blank (1..120 characters). */
  q?: string | undefined;
}

export interface LiveStorageLocations extends LiveQueryState {
  locations: StorageLocationView[];
  /** The server's total for the filter; null before the first page. */
  total: number | null;
  loadMore: () => void;
  hasMore: boolean;
}

/** Search text the server accepts: trimmed, at most 120 characters, undefined when blank. */
function searchText(q: string | undefined): string | undefined {
  const trimmed = (q ?? '').trim();
  return trimmed === '' ? undefined : trimmed.slice(0, 120);
}

/**
 * GET /warehouses/{id}/storage-locations, page by page (OffsetPage: the one
 * admin list that pages by number). The previous rows stay on screen while a
 * new filter or search loads, so typing does not blank the list.
 */
export function useStorageLocations(warehouseId: string | undefined, filter: StorageFilter): LiveStorageLocations {
  const q = searchText(filter.q);
  const query = useInfiniteQuery<
    OffsetPage<StorageLocationDto>,
    Error,
    InfiniteData<OffsetPage<StorageLocationDto>, number>,
    QueryKey,
    number
  >({
    queryKey: adminKeys.scoped(WAREHOUSE, warehouseId, { resource: 'storageLocations', isActive: filter.isActive ?? null, q: q ?? null }),
    queryFn: ({ pageParam, signal }) =>
      listStorageLocations(warehouseId ?? '', { page: pageParam, pageSize: STORAGE_PAGE_SIZE, isActive: filter.isActive, q }, signal),
    initialPageParam: 1,
    getNextPageParam: nextStoragePage,
    enabled: warehouseId !== undefined,
    placeholderData: keepPreviousData,
  });
  const locations = useMemo(() => (query.data?.pages ?? []).flatMap((page) => page.items.map(toStorageLocation)), [query.data]);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  return {
    isLoading: warehouseId !== undefined && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    locations,
    total: query.data?.pages[0]?.total ?? null,
    loadMore,
    hasMore: hasNextPage,
  };
}
