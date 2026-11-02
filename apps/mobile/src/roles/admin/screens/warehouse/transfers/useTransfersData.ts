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
import { useCallback, useEffect, useMemo } from 'react';
import { useInfiniteQuery, useQueries, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import { useAdminMutation, useAdminQuery, useCursorList, type CursorList } from '../../../api/hooks';
import { getBatch, listBatches, type BatchDto } from '../../../api/inventory';
import { adminKeys } from '../../../api/queryKeys';
import {
  approveWarehouseTransfer,
  cancelWarehouseTransfer,
  createWarehouseTransfer,
  getWarehouseTransfer,
  listWarehouseTransfers,
  receiveWarehouseTransfer,
  type ListWarehouseTransfersParams,
  type WarehouseTransferCancel,
  type WarehouseTransferCreate,
  type WarehouseTransferReceive,
  type WarehouseTransferStatus,
  type WarehouseTransferSummaryDto,
} from '../../../api/transfers';
import type { OffsetPage } from '../../../../../shell/api/pagination';
import { inboundTransferParams } from '../receiving-qc/incomingTransfers';
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
import { batchFacts, discrepancyTally, TALLY_MAX_PAGES, type BatchFacts, type DiscrepancyTally } from './receiptViews';
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

type TransferPages = InfiniteData<OffsetPage<WarehouseTransferSummaryDto>, number>;

/** One paged GET /warehouse-transfers query, mapped to rows. */
function useTransferPages(
  key: QueryKey,
  params: ListWarehouseTransfersParams,
  nameOf: WarehouseNameOf,
  enabled = true,
): TransferListState {
  const query = useInfiniteQuery<OffsetPage<WarehouseTransferSummaryDto>, Error, TransferPages, QueryKey, number>({
    queryKey: key,
    queryFn: ({ pageParam, signal }) => listWarehouseTransfers({ ...params, page: pageParam, pageSize: LIST_PAGE_SIZE }, signal),
    initialPageParam: 1,
    getNextPageParam: nextOffsetPage,
    enabled,
  });
  const items = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => page.items.map((dto) => toTransferListItem(dto, nameOf))),
    [query.data, nameOf],
  );
  return {
    items,
    total: query.data?.pages[0]?.total ?? 0,
    isLoading: enabled && query.isPending,
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

/** One status (or every status) of the scope's transfers, page by page. */
export function useTransferList(
  scope: WarehouseScope,
  status: WarehouseTransferStatus | undefined,
  nameOf: WarehouseNameOf,
): TransferListState {
  const scopeParams = transferListScopeParams(scope);
  const key = adminKeys.scoped(TRANSFERS_MODULE, scope.warehouseId, { resource: 'list', status: status ?? 'ALL', ...scopeParams });
  return useTransferPages(key, { ...scopeParams, status }, nameOf);
}

/**
 * The transfers awaiting receipt at `warehouseId` (undefined = every
 * warehouse), for Incoming Shipments. The receiving flow passes the warehouse
 * it already computed, so a Sub scope sends its own uuid (BR-30).
 */
export function useInboundTransfers(warehouseId: string | undefined, nameOf: WarehouseNameOf, enabled: boolean): TransferListState {
  const params = inboundTransferParams(warehouseId);
  const key = adminKeys.scoped(TRANSFERS_MODULE, warehouseId, { resource: 'inbound', ...params });
  return useTransferPages(key, params, nameOf, enabled);
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

/** The API maximum page size, so the tally needs as few requests as it can. */
const TALLY_PAGE_SIZE = 100;

export interface TransferDiscrepancyTallyState {
  tally: DiscrepancyTally | undefined;
  isLoading: boolean;
  error: boolean;
}

/**
 * QTY MISMATCH: the scope's RECEIVED transfers flagged hasDiscrepancy. The list
 * takes no discrepancy filter, so the RECEIVED pages are read until every row
 * is in, up to TALLY_MAX_PAGES (receiptViews.ts says what the tile shows then).
 */
export function useTransferDiscrepancyTally(scope: WarehouseScope): TransferDiscrepancyTallyState {
  const scopeParams = transferListScopeParams(scope);
  const query = useInfiniteQuery<OffsetPage<WarehouseTransferSummaryDto>, Error, TransferPages, QueryKey, number>({
    queryKey: adminKeys.scoped(TRANSFERS_MODULE, scope.warehouseId, { resource: 'discrepancy-tally', ...scopeParams }),
    queryFn: ({ pageParam, signal }) =>
      listWarehouseTransfers({ ...scopeParams, status: 'RECEIVED', page: pageParam, pageSize: TALLY_PAGE_SIZE }, signal),
    initialPageParam: 1,
    getNextPageParam: nextOffsetPage,
  });
  const pageCount = query.data?.pages.length ?? 0;
  const more = query.hasNextPage && pageCount < TALLY_MAX_PAGES;
  const { isFetchingNextPage, isError, fetchNextPage } = query;
  useEffect(() => {
    if (more && !isFetchingNextPage && !isError) void fetchNextPage();
  }, [more, isFetchingNextPage, isError, fetchNextPage]);
  const tally = useMemo(() => (query.data === undefined ? undefined : discrepancyTally(query.data.pages)), [query.data]);
  return { tally, isLoading: query.isPending || more, error: query.isError };
}

/**
 * Code and crop name of the batches the scope may read for a transfer
 * (receiptViews.ts transferBatchIdsToRead decides which, BR-30), keyed by
 * batch id. A batch not (yet) read is simply absent: its line keeps the batch
 * code the transfer carries.
 */
export function useTransferBatchFacts(batchIds: readonly string[], warehouseId: string | undefined): ReadonlyMap<string, BatchFacts> {
  return useQueries({
    queries: batchIds.map((id) => ({
      // Its own resource name: other areas cache this batch in other shapes.
      queryKey: adminKeys.scoped(INVENTORY_MODULE, warehouseId, { resource: 'transfer-line-batch', batchId: id }),
      queryFn: ({ signal }: { signal: AbortSignal }) => getBatch(id, signal),
    })),
    // combine is re-run only when a result changes, so the map stays stable between renders.
    combine: (results) => {
      const out = new Map<string, BatchFacts>();
      for (const r of results) if (r.data !== undefined) out.set(r.data.id, batchFacts(r.data));
      return out;
    },
  });
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
