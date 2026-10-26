/**
 * Read compositions the Main Warehouse dashboard (D01-D05) needs on top of
 * the existing admin API modules. Nothing here talks to a new endpoint:
 *
 *   getWarehouseCapacities      GET /warehouses/{id}/capacity per id          (warehouse.own.view, BR-66)
 *   getOpenIssueCounts          GET /warehouses/{id}/issues?status=&pageSize=1 `total`
 *                               for OPEN and IN_PROGRESS per warehouse          (warehouse.issue.view, BR-103)
 *   getRecentActivityPages      GET /warehouses/{id}/activity first page each   (warehouse.activity.view, BR-104)
 *   getWarehousePerformances    GET /warehouses/{id}/performance?from&to each   (warehouse.all.view, BR-80)
 *   getGoodsReceiptsOnDay       GET /admin/goods-receipts, newest first, until the day is passed
 *   getOpenPurchaseOrders       GET /admin/purchase-orders ISSUED + PARTIALLY_RECEIVED, every page
 *   countOrdersWithStatus       GET /admin/orders?status=, every page (the list carries no total)
 *   countGoodsReceiptsWithStatus GET /admin/goods-receipts?status=, every page
 *   getActiveAlerts             GET /admin/alerts?state=active, every page      (alert.own.view, BR-77)
 *   getActiveBatches            GET /admin/batches?status=ACTIVE, every page
 *   getUnreadNotificationCount  GET /notifications?limit=1 `unreadCount`        (BR-65)
 *
 * WHY counts come from a list `total` where one exists and from a whole walk
 * where it does not: counting the rows of one page would silently cap the
 * figure at the page size. A walk stopped by the page cap says so
 * (`complete: false`) and the screen marks the figure as "at least".
 *
 * Any failed read fails the whole call, so a screen never shows a partial sum
 * as if it were the total. getWarehouseCapacities and getOpenIssueCounts are
 * the same code as the Dev lineage's dashboardFeeds.ts (PR #139). No UI imports.
 */
import type { CollectedPages, Page } from '../../../shell/api/pagination';
import { isOnIstDay } from '../utils/datetime';
import { listAlerts, type AlertItemDto } from './alerts';
import { listBatches, type BatchDto } from './inventory';
import { listNotifications } from './notifications';
import { listAdminOrders, type OrderListStatusFilter } from './orders';
import { listGoodsReceipts, listPurchaseOrders, type GoodsReceiptDto, type GoodsReceiptStatus, type PurchaseOrderDto } from './receiving';
import { listWarehouseActivity, type WarehouseActivityEventDto } from './warehouseActivity';
import { listWarehouseIssues, type IssueStatusCode } from './warehouseIssues';
import { getWarehousePerformance, type WarehousePerformanceDto } from './warehouseOps';
import { getWarehouseCapacity, type WarehouseCapacityDto } from './warehouses';

/** Issues still needing work; RESOLVED and CLOSED are done. */
const OPEN_ISSUE_STATUSES: readonly IssueStatusCode[] = ['OPEN', 'IN_PROGRESS'];

/** The API's largest `limit` for the cursor-paged lists read here. */
export const DASHBOARD_PAGE_LIMIT = 100;
/**
 * Pages read per list before giving up: a technical bound on one dashboard
 * load (10 x 100 rows), not a business threshold. Hitting it makes the result
 * `complete: false`, which the screen shows as "N+".
 */
export const DASHBOARD_MAX_PAGES = 10;

/** A count read by walking a list; `exact` is false when the page cap stopped the walk. */
export interface WalkedCount {
  count: number;
  exact: boolean;
}

/**
 * Follows `nextCursor` until the last page, the cap, or `isDone(pageItems)`.
 * A failed page rejects the whole walk.
 */
async function walk<T>(
  fetchPage: (cursor: string | undefined) => Promise<Page<T>>,
  isDone?: (pageItems: readonly T[]) => boolean,
): Promise<CollectedPages<T>> {
  const items: T[] = [];
  let cursor: string | undefined;
  for (let n = 0; n < DASHBOARD_MAX_PAGES; n += 1) {
    const page = await fetchPage(cursor);
    items.push(...page.items);
    if (isDone?.(page.items) === true || !page.page.hasMore || page.page.nextCursor === null) {
      return { items, complete: true };
    }
    cursor = page.page.nextCursor;
  }
  return { items, complete: false };
}

/** Capacity of each warehouse, keyed by its uuid. Any failure fails the whole call (one error state). */
export async function getWarehouseCapacities(
  warehouseIds: readonly string[],
  signal?: AbortSignal,
): Promise<Map<string, WarehouseCapacityDto>> {
  const unique = [...new Set(warehouseIds)];
  const rows = await Promise.all(unique.map((id) => getWarehouseCapacity(id, signal)));
  return new Map(rows.map((row, index) => [unique[index] ?? row.warehouseId, row]));
}

/**
 * Open plus in-progress issues per warehouse, keyed by uuid, each from the
 * list's exact `total` (a 1-row page per status, so the figure is not capped at
 * a page size).
 */
export async function getOpenIssueCounts(
  warehouseIds: readonly string[],
  signal?: AbortSignal,
): Promise<Record<string, number>> {
  const unique = [...new Set(warehouseIds)];
  const perWarehouse = await Promise.all(
    unique.map(async (id) => {
      const totals = await Promise.all(
        OPEN_ISSUE_STATUSES.map((status) => listWarehouseIssues(id, { status, page: 1, pageSize: 1 }, signal).then((page) => page.total)),
      );
      return totals.reduce((sum, n) => sum + n, 0);
    }),
  );
  return Object.fromEntries(unique.map((id, index) => [id, perWarehouse[index] ?? 0]));
}

/** The first activity page (newest first) of each warehouse; the screen merges them. */
export async function getRecentActivityPages(
  warehouseIds: readonly string[],
  limit: number,
  signal?: AbortSignal,
): Promise<{ warehouseId: string; items: WarehouseActivityEventDto[] }[]> {
  const unique = [...new Set(warehouseIds)];
  return Promise.all(
    unique.map(async (warehouseId) => ({
      warehouseId,
      items: (await listWarehouseActivity(warehouseId, { limit }, signal)).items,
    })),
  );
}

/** Each warehouse's server-exact performance over the inclusive IST range. */
export async function getWarehousePerformances(
  warehouseIds: readonly string[],
  range: { from: string; to: string },
  signal?: AbortSignal,
): Promise<WarehousePerformanceDto[]> {
  const unique = [...new Set(warehouseIds)];
  return Promise.all(unique.map((id) => getWarehousePerformance(id, range, signal)));
}

/**
 * The goods receipts received on the IST day `day`. The list is newest first
 * (received_at DESC), so the walk ends at the first page that reaches an
 * earlier day; only that day's receipts are returned.
 */
export async function getGoodsReceiptsOnDay(
  warehouseId: string | undefined,
  day: string,
  signal?: AbortSignal,
): Promise<CollectedPages<GoodsReceiptDto>> {
  const walked = await walk(
    (cursor) => listGoodsReceipts({ cursor, limit: DASHBOARD_PAGE_LIMIT, warehouseId }, signal),
    (page) => page.some((g) => !isOnIstDay(g.receivedAt, day)),
  );
  return { items: walked.items.filter((g) => isOnIstDay(g.receivedAt, day)), complete: walked.complete };
}

/** Purchase orders still expecting goods: ISSUED and PARTIALLY_RECEIVED, every page of each. */
export async function getOpenPurchaseOrders(
  warehouseId: string | undefined,
  signal?: AbortSignal,
): Promise<CollectedPages<PurchaseOrderDto>> {
  const lists = await Promise.all(
    (['ISSUED', 'PARTIALLY_RECEIVED'] as const).map((status) =>
      walk((cursor) => listPurchaseOrders({ cursor, limit: DASHBOARD_PAGE_LIMIT, status, warehouseId }, signal)),
    ),
  );
  return { items: lists.flatMap((l) => l.items), complete: lists.every((l) => l.complete) };
}

/** How many orders are in `status` now (the order list has no total, so every page is read). */
export async function countOrdersWithStatus(
  status: OrderListStatusFilter,
  warehouseId: string | undefined,
  signal?: AbortSignal,
): Promise<WalkedCount> {
  const walked = await walk((cursor) => listAdminOrders({ cursor, limit: DASHBOARD_PAGE_LIMIT, status, warehouseId }, signal));
  return { count: walked.items.length, exact: walked.complete };
}

/** How many goods receipts are in `status` now, every page read. */
export async function countGoodsReceiptsWithStatus(
  status: GoodsReceiptStatus,
  warehouseId: string | undefined,
  signal?: AbortSignal,
): Promise<WalkedCount> {
  const walked = await walk((cursor) => listGoodsReceipts({ cursor, limit: DASHBOARD_PAGE_LIMIT, warehouseId, status }, signal));
  return { count: walked.items.length, exact: walked.complete };
}

/** The caller's active alerts (snoozed and dismissed ones are not in this list, BR-78). */
export function getActiveAlerts(warehouseId: string | undefined, signal?: AbortSignal): Promise<CollectedPages<AlertItemDto>> {
  return walk((cursor) => listAlerts({ warehouseId, state: 'active', cursor, limit: DASHBOARD_PAGE_LIMIT }, signal));
}

/** Every ACTIVE batch (stock on the shelf). */
export function getActiveBatches(warehouseId: string | undefined, signal?: AbortSignal): Promise<CollectedPages<BatchDto>> {
  return walk((cursor) => listBatches({ cursor, limit: DASHBOARD_PAGE_LIMIT, warehouseId, status: 'ACTIVE' }, signal));
}

/** The caller's unread notification total; a value that is not a whole count fails the read. */
export async function getUnreadNotificationCount(signal?: AbortSignal): Promise<number> {
  const list = await listNotifications({ limit: 1 }, signal);
  const n: unknown = list.unreadCount;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 0) throw new Error('unreadCount is not a count');
  return n;
}
