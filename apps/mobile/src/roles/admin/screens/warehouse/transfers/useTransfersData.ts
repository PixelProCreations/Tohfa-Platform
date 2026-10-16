/**
 * Live data for the inter-warehouse transfer screens. Thin TanStack Query
 * wrappers over roles/admin/api/transfers.ts; every decision (scope params,
 * mapping, paging, request bodies) lives in ./mappers.ts, which is tested.
 *
 * Keys are adminKeys.scoped('transfers', warehouseId, ...), so one warehouse's
 * rows never answer another warehouse's query (BR-30). Every write invalidates
 * the whole 'transfers' module (lists, counts, details) and 'inventory' (a
 * dispatch or a receipt moves stock).
 */
import { useCallback, useMemo } from 'react';
import { useInfiniteQuery, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import { useAdminMutation, useAdminQuery, useCursorList, type CursorList } from '../../../api/hooks';
import { listBatches, type BatchDto } from '../../../api/inventory';
import { adminKeys } from '../../../api/queryKeys';
import {
  approveWarehouseTransfer,
  cancelWarehouseTransfer,
  createWarehouseTransfer,
  getWarehouseTransfer,
  listWarehouseTransfers,
  receiveWarehouseTransfer,
  type WarehouseTransferCancel,
  type WarehouseTransferCreate,
  type WarehouseTransferReceive,
  type WarehouseTransferStatus,
  type WarehouseTransferSummaryDto,
} from '../../../api/transfers';
import type { OffsetPage } from '../../../../../shell/api/pagination';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import {
  makeWarehouseNameOf,
  nextOffsetPage,
  toTransferBatchOptions,
  toTransferDetail,
  toTransferListItem,
  TRANSFER_CODES,
  transferListScopeParams,
  type TransferBatchOption,
  type WarehouseNameOf,
} from './mappers';
import type { PermissionCheck, TransferDetailView, TransferListItem, WarehouseScope } from './types';

export const TRANSFERS_MODULE = 'transfers';
const INVENTORY_MODULE = 'inventory';
/** A page of the list; the spec allows up to 100. */
const LIST_PAGE_SIZE = 20;
/** Batches per page in the initiate picker (the spec's LimitParam max). */
const BATCH_PAGE_LIMIT = 100;

const WRITE_INVALIDATES: readonly QueryKey[] = [adminKeys.module(TRANSFERS_MODULE), adminKeys.module(INVENTORY_MODULE)];

/**
 * Warehouse names for the viewer. Main reads GET /warehouses (warehouse.all.view);
 * Sub does not hold it and is never sent there (it would 403), so it names only
 * its own warehouse.
 */
export function useTransferWarehouses(scope: WarehouseScope, can: PermissionCheck) {
  const list = useWarehouseOptions({ enabled: can(TRANSFER_CODES.warehouseList) });
  const nameOf = useMemo<WarehouseNameOf>(() => makeWarehouseNameOf(scope, list.options), [scope, list.options]);
  return { ...list, nameOf };
}

export interface TransferListState {
  items: TransferListItem[];
  total: number;
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
  isRefreshing: boolean;
  hasMore: boolean;
  loadMore: () => void;
}

/** One status (or every status) of the scope's transfers, page by page. */
export function useTransferList(
  scope: WarehouseScope,
  status: WarehouseTransferStatus | undefined,
  nameOf: WarehouseNameOf,
): TransferListState {
  const scopeParams = transferListScopeParams(scope);
  const key = adminKeys.scoped(TRANSFERS_MODULE, scope.warehouseId, { resource: 'list', status: status ?? 'ALL', ...scopeParams });
  const query = useInfiniteQuery<
    OffsetPage<WarehouseTransferSummaryDto>,
    Error,
    InfiniteData<OffsetPage<WarehouseTransferSummaryDto>, number>,
    QueryKey,
    number
  >({
    queryKey: key,
    queryFn: ({ pageParam, signal }) =>
      listWarehouseTransfers({ ...scopeParams, status, page: pageParam, pageSize: LIST_PAGE_SIZE }, signal),
    initialPageParam: 1,
    getNextPageParam: nextOffsetPage,
  });
  const items = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => page.items.map((dto) => toTransferListItem(dto, nameOf))),
    [query.data, nameOf],
  );
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

/** How many of the scope's transfers are in `status` (the list's `total`, one row fetched). */
function useTransferCount(scope: WarehouseScope, status: WarehouseTransferStatus) {
  const scopeParams = transferListScopeParams(scope);
  const query = useAdminQuery(
    adminKeys.scoped(TRANSFERS_MODULE, scope.warehouseId, { resource: 'count', status, ...scopeParams }),
    (signal) => listWarehouseTransfers({ ...scopeParams, status, page: 1, pageSize: 1 }, signal),
  );
  return query.data?.total;
}

export type TransferStatusCounts = Record<WarehouseTransferStatus, number | undefined>;

/** The per-status counts of the scope's transfers (undefined until loaded). */
export function useTransferStatusCounts(scope: WarehouseScope): TransferStatusCounts {
  const pending = useTransferCount(scope, 'PENDING_APPROVAL');
  const inTransit = useTransferCount(scope, 'IN_TRANSIT');
  const received = useTransferCount(scope, 'RECEIVED');
  const cancelled = useTransferCount(scope, 'CANCELLED');
  return { PENDING_APPROVAL: pending, IN_TRANSIT: inTransit, RECEIVED: received, CANCELLED: cancelled };
}

export interface TransferDetailState {
  transfer: TransferDetailView | undefined;
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
}

/** One transfer with its lines; a 404 (unknown or outside the scope) is an error, never a 403. */
export function useTransferDetail(scope: WarehouseScope, transferId: string | undefined, nameOf: WarehouseNameOf): TransferDetailState {
  const query = useAdminQuery(
    adminKeys.scoped(TRANSFERS_MODULE, scope.warehouseId, { resource: 'detail', id: transferId ?? '' }),
    (signal) => getWarehouseTransfer(transferId ?? '', signal),
    { enabled: transferId !== undefined },
  );
  const transfer = useMemo(() => (query.data === undefined ? undefined : toTransferDetail(query.data, nameOf)), [query.data, nameOf]);
  return {
    transfer,
    isLoading: transferId !== undefined && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
  };
}

/** The source warehouse's ACTIVE batches for the initiate picker. Disabled until a source is chosen. */
export function useTransferBatchOptions(sourceWarehouseId: string | undefined): CursorList<TransferBatchOption> {
  const map = useCallback((dto: BatchDto) => toTransferBatchOptions([dto])[0] ?? null, []);
  const list = useCursorList(
    adminKeys.scoped(INVENTORY_MODULE, sourceWarehouseId, { resource: 'transfer-batches', status: 'ACTIVE' }),
    (cursor, signal) => listBatches({ cursor, limit: BATCH_PAGE_LIMIT, warehouseId: sourceWarehouseId, status: 'ACTIVE' }, signal),
    map,
    { enabled: sourceWarehouseId !== undefined },
  );
  const items = useMemo(() => list.items.filter((o): o is TransferBatchOption => o !== null), [list.items]);
  return { ...list, items };
}

export function useCreateTransferMutation() {
  return useAdminMutation({
    mutationFn: ({ body, idempotencyKey }: { body: WarehouseTransferCreate; idempotencyKey: string }) =>
      createWarehouseTransfer(body, idempotencyKey),
    invalidates: WRITE_INVALIDATES,
  });
}

export function useApproveTransferMutation() {
  return useAdminMutation({
    mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) => approveWarehouseTransfer(id, idempotencyKey),
    invalidates: WRITE_INVALIDATES,
  });
}

export function useReceiveTransferMutation() {
  return useAdminMutation({
    mutationFn: ({ id, body, idempotencyKey }: { id: string; body: WarehouseTransferReceive; idempotencyKey: string }) =>
      receiveWarehouseTransfer(id, body, idempotencyKey),
    invalidates: WRITE_INVALIDATES,
  });
}

export function useCancelTransferMutation() {
  return useAdminMutation({
    mutationFn: ({ id, body }: { id: string; body: WarehouseTransferCancel }) => cancelWarehouseTransfer(id, body),
    invalidates: WRITE_INVALIDATES,
  });
}
