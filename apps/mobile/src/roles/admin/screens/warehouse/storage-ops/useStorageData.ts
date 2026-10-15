/**
 * Live data for the storage-ops screens. Thin TanStack Query wrappers; every
 * decision lives in ./mappers.ts or the API modules, which are tested (hooks
 * cannot render in this app's plain-Node vitest).
 *
 * Every hook takes the warehouse uuid the flow resolved with
 * storageWarehouseId (a Sub scope is always its own warehouse, BR-30). It is
 * part of every query key, so one warehouse's rows never answer another's,
 * and with no uuid nothing is fetched.
 *
 * Walks (every storage location, every ACTIVE batch, today's activity) are
 * capped by a page guard against a looping cursor or a total that never comes
 * in; that guard is not a business limit, and a walk that trips it says
 * `complete: false` instead of passing a partial list off as the whole.
 */
import { useCallback, useMemo } from 'react';
import { useInfiniteQuery, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import { useAdminMutation, useAdminQuery, useCursorList, type CursorList } from '../../../api/hooks';
import { listBatches, type BatchDto } from '../../../api/inventory';
import { adminKeys } from '../../../api/queryKeys';
import { createStorageLocation, getStorageLocation, updateStorageLocation, type UpdateStorageLocationBody } from '../../../api/storageLocations';
import { listWarehouseActivity, type WarehouseActivityEventDto } from '../../../api/warehouseActivity';
import {
  addWarehouseIssueComment,
  createWarehouseIssue,
  getWarehouseIssue,
  listWarehouseIssues,
  updateWarehouseIssue,
  type CreateWarehouseIssueBody,
  type IssueStatusCode,
  type UpdateWarehouseIssueBody,
  type WarehouseIssueDto,
} from '../../../api/warehouseIssues';
import { getWarehousePerformance, updateWarehouseCapacity } from '../../../api/warehouseOps';
import { getWarehouseCapacity, listStorageLocations, type StorageLocationDto } from '../../../api/warehouses';
import { collectPages, type OffsetPage } from '../../../../../shell/api/pagination';
import {
  activityFilterTypes,
  activityPresetRange,
  issueFilterStatus,
  nextOffsetPage,
  stockByLocationCode,
  toActivityRow,
  toIssueRow,
  type ActivityFilter,
  type ActivityRow,
  type IssueListFilter,
  type IssueRow,
} from './mappers';

export const STORAGE_OPS = 'storageOps';
const INVENTORY = 'inventory';
/** Module keys of other areas that cache the same warehouse rows (profile-settings, warehouse-admin). */
const WAREHOUSE_ADMIN = 'warehouseAdmin';
/** The largest page the spec allows, so a walk needs the fewest calls. */
const MAX_PAGE = 100;
/** Guards against a cursor / total that never ends; not business limits. */
const LOCATION_MAX_PAGES = 20;
const BATCH_MAX_PAGES = 50;
const TODAY_ACTIVITY_MAX_PAGES = 5;
/** Rows the hub previews; display sizes, not business thresholds. */
const HUB_PREVIEW = 3;

export interface LiveQueryState {
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
  isRefreshing: boolean;
}

function queryState(
  query: { isPending: boolean; error: unknown; refetch: () => unknown; isRefetching: boolean },
  enabled: boolean,
): LiveQueryState {
  return {
    isLoading: enabled && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
    isRefreshing: query.isRefetching,
  };
}

function key(warehouseId: string | undefined, params: Record<string, unknown>): QueryKey {
  return adminKeys.scoped(STORAGE_OPS, warehouseId, params);
}

// ─── Offset-paged list (issues) ──────────────────────────────────────────────

export interface OffsetList<U> extends LiveQueryState {
  items: U[];
  total: number | undefined;
  hasMore: boolean;
  loadMore: () => void;
}

function useOffsetList<T, U>(
  queryKey: QueryKey,
  fetchPage: (page: number, signal: AbortSignal) => Promise<OffsetPage<T>>,
  map: (item: T) => U,
  enabled: boolean,
): OffsetList<U> {
  const query = useInfiniteQuery<OffsetPage<T>, Error, InfiniteData<OffsetPage<T>, number>, QueryKey, number>({
    queryKey,
    queryFn: ({ pageParam, signal }) => fetchPage(pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: nextOffsetPage,
    enabled,
  });
  const items = useMemo(() => (query.data?.pages ?? []).flatMap((p) => p.items.map(map)), [query.data, map]);
  return {
    items,
    total: query.data?.pages[0]?.total,
    hasMore: query.hasNextPage,
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
    },
    isLoading: enabled && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
  };
}

// ─── Operational issues ──────────────────────────────────────────────────────

export function useIssueList(warehouseId: string | undefined, filter: IssueListFilter): OffsetList<IssueRow> {
  const status = issueFilterStatus(filter);
  const map = useCallback((dto: WarehouseIssueDto) => toIssueRow(dto, new Date()), []);
  return useOffsetList(
    key(warehouseId, { resource: 'issues', status: status ?? null }),
    (page, signal) => listWarehouseIssues(warehouseId ?? '', { status, page }, signal),
    map,
    warehouseId !== undefined,
  );
}

export interface IssueCounts extends LiveQueryState {
  counts: Partial<Record<IssueStatusCode, number>>;
}

/** Totals per status from the server (one pageSize=1 request each), never counted from loaded rows. */
export function useIssueCounts(warehouseId: string | undefined, statuses: readonly IssueStatusCode[]): IssueCounts {
  const enabled = warehouseId !== undefined;
  const query = useAdminQuery(
    key(warehouseId, { resource: 'issue-counts', statuses: statuses.join(',') }),
    async (signal) => {
      const entries = await Promise.all(
        statuses.map(async (status) => {
          const page = await listWarehouseIssues(warehouseId ?? '', { status, pageSize: 1 }, signal);
          return [status, page.total] as const;
        }),
      );
      return Object.fromEntries(entries) as Partial<Record<IssueStatusCode, number>>;
    },
    { enabled },
  );
  return { ...queryState(query, enabled), counts: query.data ?? {} };
}

/** The first few issues of one status (hub preview). */
export function useIssuePreview(warehouseId: string | undefined, status: IssueStatusCode) {
  const enabled = warehouseId !== undefined;
  const query = useAdminQuery(
    key(warehouseId, { resource: 'issues-preview', status }),
    (signal) => listWarehouseIssues(warehouseId ?? '', { status, pageSize: HUB_PREVIEW }, signal),
    { enabled },
  );
  const rows = useMemo(() => (query.data?.items ?? []).map((dto) => toIssueRow(dto, new Date())), [query.data]);
  return { ...queryState(query, enabled), rows, total: query.data?.total };
}

export function useIssue(warehouseId: string | undefined, issueId: string | undefined) {
  const enabled = warehouseId !== undefined && issueId !== undefined;
  const query = useAdminQuery(
    key(warehouseId, { resource: 'issue', id: issueId ?? null }),
    (signal) => getWarehouseIssue(warehouseId ?? '', issueId ?? '', signal),
    { enabled },
  );
  return { ...queryState(query, enabled), detail: query.data };
}

const INVALIDATE_STORAGE_OPS = [adminKeys.module(STORAGE_OPS)];

export function useCreateIssue(warehouseId: string | undefined) {
  return useAdminMutation({
    mutationFn: (body: CreateWarehouseIssueBody) => createWarehouseIssue(warehouseId ?? '', body),
    invalidates: INVALIDATE_STORAGE_OPS,
  });
}

export function useUpdateIssue(warehouseId: string | undefined, issueId: string | undefined) {
  return useAdminMutation({
    mutationFn: (body: UpdateWarehouseIssueBody) => updateWarehouseIssue(warehouseId ?? '', issueId ?? '', body),
    invalidates: INVALIDATE_STORAGE_OPS,
  });
}

export function useAddIssueComment(warehouseId: string | undefined, issueId: string | undefined) {
  return useAdminMutation({
    mutationFn: (body: string) => addWarehouseIssueComment(warehouseId ?? '', issueId ?? '', body),
    invalidates: INVALIDATE_STORAGE_OPS,
  });
}

// ─── Warehouse activity ──────────────────────────────────────────────────────

export function useActivityList(
  warehouseId: string | undefined,
  filter: ActivityFilter,
  preset: 'Today' | 'All',
): CursorList<ActivityRow> {
  // The clock is read when the key is built, so "Today" is today's IST date at render.
  const range = activityPresetRange(preset, new Date());
  const types = activityFilterTypes(filter);
  const map = useCallback((event: WarehouseActivityEventDto) => toActivityRow(event, new Date()), []);
  return useCursorList(
    key(warehouseId, { resource: 'activity', types: types?.join(',') ?? null, from: range?.from ?? null, to: range?.to ?? null }),
    (cursor, signal) => listWarehouseActivity(warehouseId ?? '', { types, from: range?.from, to: range?.to, cursor }, signal),
    map,
    { enabled: warehouseId !== undefined },
  );
}

/** Every event of today (IST), counted; the walk is capped (see the file comment). */
export function useTodayActivity(warehouseId: string | undefined) {
  const enabled = warehouseId !== undefined;
  const range = activityPresetRange('Today', new Date());
  const query = useAdminQuery(
    key(warehouseId, { resource: 'activity-today', from: range?.from ?? null }),
    (signal) =>
      collectPages(
        (cursor) => listWarehouseActivity(warehouseId ?? '', { from: range?.from, to: range?.to, cursor, limit: MAX_PAGE }, signal),
        TODAY_ACTIVITY_MAX_PAGES,
      ),
    { enabled },
  );
  const rows = useMemo(() => (query.data?.items ?? []).map((e) => toActivityRow(e, new Date())), [query.data]);
  return { ...queryState(query, enabled), rows, complete: query.data?.complete ?? true };
}

/** The newest few events (hub Recent Activity). */
export function useRecentActivity(warehouseId: string | undefined) {
  const enabled = warehouseId !== undefined;
  const query = useAdminQuery(
    key(warehouseId, { resource: 'activity-recent' }),
    (signal) => listWarehouseActivity(warehouseId ?? '', { limit: HUB_PREVIEW }, signal),
    { enabled },
  );
  const rows = useMemo(() => (query.data?.items ?? []).map((e) => toActivityRow(e, new Date())), [query.data]);
  return { ...queryState(query, enabled), rows };
}

// ─── Storage locations, batches and capacity ─────────────────────────────────

/** Every storage location of the warehouse (active and inactive), page by page. */
export function useStorageLocationList(warehouseId: string | undefined) {
  const enabled = warehouseId !== undefined;
  const query = useAdminQuery(key(warehouseId, { resource: 'storage-locations', walk: 'all' }), async (signal) => {
    const items: StorageLocationDto[] = [];
    for (let page = 1; page <= LOCATION_MAX_PAGES; page += 1) {
      const res = await listStorageLocations(warehouseId ?? '', { page, pageSize: MAX_PAGE }, signal);
      items.push(...res.items);
      if (nextOffsetPage(res) === undefined) return { items, complete: true };
    }
    return { items, complete: false };
  }, { enabled });
  return { ...queryState(query, enabled), items: query.data?.items ?? [], complete: query.data?.complete ?? true };
}

export function useStorageLocation(warehouseId: string | undefined, locationId: string | undefined) {
  const enabled = warehouseId !== undefined && locationId !== undefined;
  const query = useAdminQuery(
    key(warehouseId, { resource: 'storage-location', id: locationId ?? null }),
    (signal) => getStorageLocation(warehouseId ?? '', locationId ?? '', signal),
    { enabled },
  );
  return { ...queryState(query, enabled), location: query.data };
}

/**
 * Every ACTIVE batch of the warehouse (for the per-location stock derivation).
 * Keyed under the inventory module so an inventory write refreshes it too.
 * `enabled: false` for a viewer without inventory.batch.view.
 */
export function useActiveBatches(warehouseId: string | undefined, enabled: boolean) {
  const on = enabled && warehouseId !== undefined;
  const query = useAdminQuery(
    adminKeys.scoped(INVENTORY, warehouseId, { resource: 'batches', status: 'ACTIVE', walk: 'all' }),
    (signal) => collectPages((cursor) => listBatches({ cursor, limit: MAX_PAGE, warehouseId, status: 'ACTIVE' }, signal), BATCH_MAX_PAGES),
    { enabled: on },
  );
  const items: BatchDto[] = query.data?.items ?? [];
  const stockByCode = useMemo(() => (query.data === undefined ? undefined : stockByLocationCode(query.data.items)), [query.data]);
  return { ...queryState(query, on), items, stockByCode, complete: query.data?.complete ?? true };
}

export function useCreateStorageLocation(warehouseId: string | undefined) {
  return useAdminMutation({
    mutationFn: (body: { code: string; name: string; locationType: string | null; capacityKg: string | null }) =>
      createStorageLocation(warehouseId ?? '', body),
    invalidates: [adminKeys.module(STORAGE_OPS), adminKeys.module('receiving'), adminKeys.module('warehouse')],
  });
}

export function useUpdateStorageLocation(warehouseId: string | undefined, locationId: string | undefined) {
  return useAdminMutation({
    mutationFn: (body: UpdateStorageLocationBody) => updateStorageLocation(warehouseId ?? '', locationId ?? '', body),
    invalidates: [adminKeys.module(STORAGE_OPS), adminKeys.module('receiving'), adminKeys.module('warehouse')],
  });
}

export function useCapacity(warehouseId: string | undefined) {
  const enabled = warehouseId !== undefined;
  const query = useAdminQuery(
    key(warehouseId, { resource: 'capacity' }),
    (signal) => getWarehouseCapacity(warehouseId ?? '', signal),
    { enabled },
  );
  return { ...queryState(query, enabled), capacity: query.data };
}

export function useSetCapacity(warehouseId: string | undefined) {
  return useAdminMutation({
    mutationFn: (capacityKg: string) => updateWarehouseCapacity(warehouseId ?? '', capacityKg),
    invalidates: [adminKeys.module(STORAGE_OPS), adminKeys.module('warehouse'), adminKeys.module(WAREHOUSE_ADMIN)],
  });
}

// ─── Performance ─────────────────────────────────────────────────────────────

/** `enabled: false` for a viewer without warehouse.all.view (a Sub admin gets 403). */
export function usePerformance(warehouseId: string | undefined, range: { from: string; to: string }, enabled: boolean) {
  const on = enabled && warehouseId !== undefined;
  const query = useAdminQuery(
    key(warehouseId, { resource: 'performance', from: range.from, to: range.to }),
    (signal) => getWarehousePerformance(warehouseId ?? '', range, signal),
    { enabled: on },
  );
  return { ...queryState(query, on), performance: query.data };
}
