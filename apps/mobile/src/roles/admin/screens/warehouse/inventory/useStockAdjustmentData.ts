/**
 * Live data for the stock count (BR-106) and stock adjustment (BR-37)
 * screens. Thin TanStack Query wrappers over roles/admin/api/stockAdjustments.ts
 * and stockVerifications.ts; every decision lives in ./adjustmentMappers.ts,
 * which is tested.
 *
 * Keys are adminKeys.scoped(module, warehouseId, ...) with the warehouse the
 * flow computed (inventoryWarehouseFilter: a Sub scope is always its own,
 * BR-30), so one warehouse's rows never answer another's. Every write
 * invalidates both modules and 'inventory': an approval moves stock, and a
 * raised count changes the count's status.
 */
import { useCallback, useMemo } from 'react';
import { useInfiniteQuery, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import { useAdminMutation, useAdminQuery, useCursorList } from '../../../api/hooks';
import { listBatches, type BatchDto } from '../../../api/inventory';
import { adminKeys } from '../../../api/queryKeys';
import {
  approveStockAdjustment,
  createStockAdjustment,
  getStockAdjustment,
  listStockAdjustments,
  rejectStockAdjustment,
  type StockAdjustmentCreate,
  type StockAdjustmentDto,
  type StockAdjustmentReject,
  type StockAdjustmentStatus,
} from '../../../api/stockAdjustments';
import {
  createStockVerification,
  getStockVerification,
  listStockVerifications,
  raiseVerificationAdjustment,
  type StockVerificationCreate,
  type StockVerificationDto,
} from '../../../api/stockVerifications';
import type { OffsetPage } from '../../../../../shell/api/pagination';
import { nextPageNumber, toAdjustmentView, toVerificationView, type AdjustmentView, type VerificationView } from './adjustmentMappers';
import { cropNamesOf, toBatchRow } from './mappers';
import type { BatchRow } from './types';
import { useAllBatches } from './useInventoryData';

export const ADJUSTMENTS_MODULE = 'stock-adjustments';
export const VERIFICATIONS_MODULE = 'stock-verifications';
const INVENTORY_MODULE = 'inventory';
/** A page of a list; the server allows up to 100. */
const LIST_PAGE_SIZE = 20;
/** Batches per page in a picker (the spec's LimitParam max). */
const BATCH_PAGE_LIMIT = 100;

const WRITE_INVALIDATES: readonly QueryKey[] = [
  adminKeys.module(ADJUSTMENTS_MODULE),
  adminKeys.module(VERIFICATIONS_MODULE),
  adminKeys.module(INVENTORY_MODULE),
];

export interface OffsetListState<T> {
  items: T[];
  total: number;
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
  isRefreshing: boolean;
  hasMore: boolean;
  loadMore: () => void;
}

/** One offset-paged list, mapped. */
function useOffsetList<D, V>(
  key: QueryKey,
  fetchPage: (page: number, signal: AbortSignal) => Promise<OffsetPage<D>>,
  map: (dto: D) => V,
): OffsetListState<V> {
  const query = useInfiniteQuery<OffsetPage<D>, Error, InfiniteData<OffsetPage<D>, number>, QueryKey, number>({
    queryKey: key,
    queryFn: ({ pageParam, signal }) => fetchPage(pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: nextPageNumber,
  });
  const items = useMemo(() => (query.data?.pages ?? []).flatMap((page) => page.items.map(map)), [query.data, map]);
  return {
    items,
    total: query.data?.pages[0]?.total ?? 0,
    isLoading: query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    hasMore: query.hasNextPage,
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
    },
  };
}

/** cropId -> name from the warehouse's batches (adjustments and counts carry no crop name). */
export function useCropNames(warehouseId: string | undefined): ReadonlyMap<string, string> {
  const batches = useAllBatches(warehouseId);
  return useMemo(() => cropNamesOf(batches.items), [batches.items]);
}

/** The scope's adjustments in `status` (or every status), newest first, page by page. */
export function useAdjustmentList(
  warehouseId: string | undefined,
  status: StockAdjustmentStatus | undefined,
): OffsetListState<AdjustmentView> {
  const cropNames = useCropNames(warehouseId);
  const map = useCallback((dto: StockAdjustmentDto) => toAdjustmentView(dto, new Date(), cropNames), [cropNames]);
  return useOffsetList(
    adminKeys.scoped(ADJUSTMENTS_MODULE, warehouseId, { resource: 'list', status: status ?? 'ALL' }),
    (page, signal) => listStockAdjustments({ warehouseId, status, page, pageSize: LIST_PAGE_SIZE }, signal),
    map,
  );
}

export interface DetailState<T> {
  item: T | undefined;
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
}

/** One adjustment; a 404 (unknown or outside the scope) is an error, never a 403. */
export function useAdjustmentDetail(warehouseId: string | undefined, id: string | undefined): DetailState<AdjustmentView> {
  const cropNames = useCropNames(warehouseId);
  const query = useAdminQuery(
    adminKeys.scoped(ADJUSTMENTS_MODULE, warehouseId, { resource: 'detail', id: id ?? '' }),
    (signal) => getStockAdjustment(id ?? '', signal),
    { enabled: id !== undefined },
  );
  const item = useMemo(
    () => (query.data === undefined ? undefined : toAdjustmentView(query.data, new Date(), cropNames)),
    [query.data, cropNames],
  );
  return {
    item,
    isLoading: id !== undefined && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
  };
}

/** The scope's counts, newest first; `hasVariance` true narrows to counts that found a difference. */
export function useVerificationList(
  warehouseId: string | undefined,
  hasVariance: boolean | undefined,
): OffsetListState<VerificationView> {
  const cropNames = useCropNames(warehouseId);
  const map = useCallback((dto: StockVerificationDto) => toVerificationView(dto, new Date(), cropNames), [cropNames]);
  return useOffsetList(
    adminKeys.scoped(VERIFICATIONS_MODULE, warehouseId, { resource: 'list', hasVariance: hasVariance ?? null }),
    (page, signal) => listStockVerifications({ warehouseId, hasVariance, page, pageSize: LIST_PAGE_SIZE }, signal),
    map,
  );
}

/** One count; a 404 (unknown or outside the scope) is an error. */
export function useVerificationDetail(warehouseId: string | undefined, id: string | undefined): DetailState<VerificationView> {
  const cropNames = useCropNames(warehouseId);
  const query = useAdminQuery(
    adminKeys.scoped(VERIFICATIONS_MODULE, warehouseId, { resource: 'detail', id: id ?? '' }),
    (signal) => getStockVerification(id ?? '', signal),
    { enabled: id !== undefined },
  );
  const item = useMemo(
    () => (query.data === undefined ? undefined : toVerificationView(query.data, new Date(), cropNames)),
    [query.data, cropNames],
  );
  return {
    item,
    isLoading: id !== undefined && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
  };
}

/** The warehouse's ACTIVE batches for a picker, page by page. */
export function useActiveBatchOptions(warehouseId: string | undefined) {
  const map = useCallback((dto: BatchDto): BatchRow => toBatchRow(dto), []);
  return useCursorList(
    adminKeys.scoped(INVENTORY_MODULE, warehouseId, { resource: 'stock-batch-picker', status: 'ACTIVE' }),
    (cursor, signal) => listBatches({ cursor, limit: BATCH_PAGE_LIMIT, warehouseId, status: 'ACTIVE' }, signal),
    map,
  );
}

export function useCreateAdjustmentMutation() {
  return useAdminMutation({
    mutationFn: ({ body, idempotencyKey }: { body: StockAdjustmentCreate; idempotencyKey: string }) =>
      createStockAdjustment(body, idempotencyKey),
    invalidates: WRITE_INVALIDATES,
  });
}

export function useApproveAdjustmentMutation() {
  return useAdminMutation({
    mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) => approveStockAdjustment(id, idempotencyKey),
    invalidates: WRITE_INVALIDATES,
  });
}

export function useRejectAdjustmentMutation() {
  return useAdminMutation({
    mutationFn: ({ id, body }: { id: string; body: StockAdjustmentReject }) => rejectStockAdjustment(id, body),
    invalidates: WRITE_INVALIDATES,
  });
}

export function useCreateVerificationMutation() {
  return useAdminMutation({
    mutationFn: ({ body, idempotencyKey }: { body: StockVerificationCreate; idempotencyKey: string }) =>
      createStockVerification(body, idempotencyKey),
    invalidates: WRITE_INVALIDATES,
  });
}

export function useRaiseAdjustmentMutation() {
  return useAdminMutation({
    mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
      raiseVerificationAdjustment(id, {}, idempotencyKey),
    invalidates: WRITE_INVALIDATES,
  });
}
