/**
 * Live data for the inventory area. Thin wrappers over the admin hooks
 * (../../../api/hooks.ts); every decision lives in ./mappers.ts or the API
 * module, which are tested.
 *
 * Every hook takes the warehouseId to send, which the flow computes once with
 * inventoryWarehouseFilter (a Sub scope is always its own warehouse, BR-30). It
 * is part of every query key, so one warehouse's rows never answer another's.
 *
 * Stock totals need every batch and every allocation row, not one page, so
 * those two queries walk the cursor to the end (collectPages). The page cap is
 * a guard against a looping cursor, not a business limit; when it trips the
 * result says `complete: false` and the screens say the totals may be partial.
 * The batch walk is shared by the dashboard, stock list, product detail, low
 * stock and the ledger (which names its batches from it).
 */
import { useCallback, useMemo } from 'react';
import { listAlerts, type AlertItemDto } from '../../../api/alerts';
import { useAdminQuery, useCursorList, type CursorList } from '../../../api/hooks';
import {
  getBatch,
  listAllocations,
  listBatches,
  listStockLedger,
  type AllocationDto,
  type Grade,
  type StockLedgerEntryDto,
} from '../../../api/inventory';
import { adminKeys } from '../../../api/queryKeys';
import { collectPages } from '../../../../../shell/api/pagination';
import {
  aggregateStockByProduct,
  allocatedByProduct,
  buildAllocationDashboard,
  cropNamesOf,
  lowStockKeysOf,
  toBatchRow,
  toLowStockRow,
  toStockMovementRow,
} from './mappers';
import type { AllocationDashboard, BatchRow, LowStockRow, StockMovementRow, StockSummary } from './types';

const INVENTORY = 'inventory';
const ALERTS = 'alerts';
/** The largest page the spec allows (LimitParam), so a walk needs the fewest calls. */
const WALK_PAGE_LIMIT = 100;
/** Guard against a server cursor that never ends; not a business limit. */
const WALK_MAX_PAGES = 50;

/** What a data screen needs to pick an AsyncState and to refresh. */
export interface LiveQueryState {
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
  isRefreshing: boolean;
}

interface Walked<T> {
  items: T[];
  complete: boolean;
}

function queryState(query: {
  isPending: boolean;
  error: unknown;
  refetch: () => unknown;
  isRefetching: boolean;
}): LiveQueryState {
  return {
    isLoading: query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
    isRefreshing: query.isRefetching,
  };
}

/** Every batch in the warehouse (any status), as UI rows. */
export function useAllBatches(warehouseId: string | undefined): LiveQueryState & Walked<BatchRow> {
  const query = useAdminQuery(adminKeys.scoped(INVENTORY, warehouseId, { resource: 'batches', walk: 'all' }), async (signal) => {
    const walked = await collectPages(
      (cursor) => listBatches({ cursor, limit: WALK_PAGE_LIMIT, warehouseId }, signal),
      WALK_MAX_PAGES,
    );
    return { items: walked.items.map(toBatchRow), complete: walked.complete };
  });
  return { ...queryState(query), items: query.data?.items ?? [], complete: query.data?.complete ?? true };
}

/** Every allocation row in the warehouse. */
export function useAllAllocations(warehouseId: string | undefined): LiveQueryState & Walked<AllocationDto> {
  const query = useAdminQuery(adminKeys.scoped(INVENTORY, warehouseId, { resource: 'allocations', walk: 'all' }), (signal) =>
    collectPages((cursor) => listAllocations({ cursor, limit: WALK_PAGE_LIMIT, warehouseId }, signal), WALK_MAX_PAGES),
  );
  return { ...queryState(query), items: query.data?.items ?? [], complete: query.data?.complete ?? true };
}

/** The server's LOW_STOCK alerts for the warehouse (alerts module, BR-77), every page. */
export function useLowStockAlerts(warehouseId: string | undefined): LiveQueryState & Walked<AlertItemDto> {
  const query = useAdminQuery(adminKeys.scoped(ALERTS, warehouseId, { type: 'LOW_STOCK', walk: 'all' }), (signal) =>
    collectPages(
      (cursor) => listAlerts({ type: 'LOW_STOCK', warehouseId, cursor, limit: WALK_PAGE_LIMIT }, signal),
      WALK_MAX_PAGES,
    ),
  );
  return { ...queryState(query), items: query.data?.items ?? [], complete: query.data?.complete ?? true };
}

export interface LiveStockSummary extends LiveQueryState {
  summary: StockSummary;
  /** All allocated grams of the warehouse; null until the allocations load (or when they fail). */
  allocatedGrams: number | null;
  /** Number of LOW_STOCK alerts; null until the alerts load (or when they fail). */
  lowStockCount: number | null;
  /** False when a walk stopped early or a quantity could not be read. */
  complete: boolean;
}

/**
 * Stock per product with the Allocated figure and the low-stock flag. The
 * screen's state follows the batches (the core of every figure); allocations
 * and alerts fill in as they arrive and are refreshed together.
 */
export function useStockSummary(warehouseId: string | undefined): LiveStockSummary {
  const batches = useAllBatches(warehouseId);
  const allocations = useAllAllocations(warehouseId);
  const alerts = useLowStockAlerts(warehouseId);
  // A figure that has not loaded (or failed) is shown as "no value", never as 0 kg.
  const allocationsKnown = !allocations.isLoading && allocations.error === null;
  const alertsKnown = !alerts.isLoading && alerts.error === null;
  const summary = useMemo(
    () =>
      aggregateStockByProduct(batches.items, {
        lowStockKeys: lowStockKeysOf(alerts.items),
        allocatedByProduct: allocationsKnown ? allocatedByProduct(allocations.items) : undefined,
      }),
    [batches.items, allocations.items, alerts.items, allocationsKnown],
  );
  const allocatedGrams = useMemo(
    () => (allocationsKnown ? buildAllocationDashboard(allocations.items).totalAllocatedGrams : null),
    [allocations.items, allocationsKnown],
  );
  return {
    isLoading: batches.isLoading,
    error: batches.error,
    refresh: () => {
      batches.refresh();
      allocations.refresh();
      alerts.refresh();
    },
    isRefreshing: batches.isRefreshing || allocations.isRefreshing || alerts.isRefreshing,
    summary,
    allocatedGrams,
    lowStockCount: alertsKnown ? alerts.items.length : null,
    complete: batches.complete && allocations.complete && summary.products.every((p) => p.complete),
  };
}

export interface LiveAllocationDashboard extends LiveQueryState {
  dashboard: AllocationDashboard;
  /** Number of allocation rows behind the totals (0 = nothing allocated yet). */
  rowCount: number;
  complete: boolean;
}

/** The channel allocation dashboard; `cropId` + `grade` narrow it to one product. */
export function useAllocationDashboard(
  warehouseId: string | undefined,
  product?: { cropId: string; grade: string } | undefined,
): LiveAllocationDashboard {
  const allocations = useAllAllocations(warehouseId);
  const cropId = product?.cropId;
  const grade = product?.grade;
  const rows = useMemo(
    () =>
      cropId === undefined
        ? allocations.items
        : allocations.items.filter((row) => row.cropId === cropId && row.grade === grade),
    [allocations.items, cropId, grade],
  );
  const dashboard = useMemo(() => buildAllocationDashboard(rows), [rows]);
  return { ...allocations, dashboard, rowCount: rows.length, complete: allocations.complete };
}

/** The batches of one warehouse, optionally of one product, page by page. */
export function useBatchList(
  warehouseId: string | undefined,
  cropId: string | undefined,
  grade: Grade | undefined,
): CursorList<BatchRow> {
  return useCursorList(
    adminKeys.scoped(INVENTORY, warehouseId, { resource: 'batches', cropId: cropId ?? null, grade: grade ?? null }),
    (cursor, signal) => listBatches({ cursor, warehouseId, cropId, grade }, signal),
    toBatchRow,
  );
}

/** One batch, or nothing while `batchId` is undefined. The server 404s a batch outside the caller's scope. */
export function useBatch(
  warehouseId: string | undefined,
  batchId: string | undefined,
): LiveQueryState & { batch: BatchRow | undefined } {
  const query = useAdminQuery(
    adminKeys.scoped(INVENTORY, warehouseId, { resource: 'batch', batchId: batchId ?? null }),
    async (signal) => toBatchRow(await getBatch(batchId ?? '', signal)),
    { enabled: batchId !== undefined },
  );
  return { ...queryState(query), isLoading: batchId !== undefined && query.isPending, batch: query.data };
}

/**
 * The stock ledger, newest first, page by page; `batchId` narrows it to one
 * batch. Rows name their batch from `batches` when it is loaded.
 */
export function useStockLedger(
  warehouseId: string | undefined,
  batchId: string | undefined,
  batches: readonly BatchRow[],
): CursorList<StockMovementRow> {
  const lookup = useMemo(() => new Map(batches.map((batch) => [batch.id, batch])), [batches]);
  // The clock is read when a page is mapped, so times are fresh after every fetch.
  const map = useCallback((dto: StockLedgerEntryDto) => toStockMovementRow(dto, new Date(), lookup), [lookup]);
  return useCursorList(
    adminKeys.scoped(INVENTORY, warehouseId, { resource: 'stock-ledger', batchId: batchId ?? null }),
    (cursor, signal) => listStockLedger({ cursor, warehouseId, batchId }, signal),
    map,
  );
}

export interface LiveLowStock extends LiveQueryState {
  rows: LowStockRow[];
}

/** The LOW_STOCK alerts as rows, named from the loaded batches. */
export function useLowStockRows(warehouseId: string | undefined): LiveLowStock {
  const alerts = useLowStockAlerts(warehouseId);
  const batches = useAllBatches(warehouseId);
  const rows = useMemo(() => {
    const names = cropNamesOf(batches.items);
    return alerts.items.filter((alert) => alert.type === 'LOW_STOCK').map((alert) => toLowStockRow(alert, names));
  }, [alerts.items, batches.items]);
  return {
    isLoading: alerts.isLoading,
    error: alerts.error,
    refresh: () => {
      alerts.refresh();
      batches.refresh();
    },
    isRefreshing: alerts.isRefreshing,
    rows,
  };
}
