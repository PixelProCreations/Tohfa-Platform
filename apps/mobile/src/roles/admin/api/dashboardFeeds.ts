/**
 * Small read compositions the warehouse Home / dashboard screens need on top
 * of the existing admin API modules. Nothing here talks to a new endpoint:
 *
 *   getTransferStatusCounts   GET /warehouse-transfers?status=<s>&pageSize=1, once per
 *                             status, reading `total` (transfer.inter_warehouse.view;
 *                             Sub = transfers touching its own warehouse, BR-30)
 *   getWarehouseCapacities    GET /warehouses/{id}/capacity for each id (warehouse.own.view)
 *   getOpenIssueCounts        GET /warehouses/{id}/issues?status=<s>&pageSize=1, reading `total`
 *                             for OPEN and IN_PROGRESS per warehouse (warehouse.issue.view, BR-103)
 *
 * WHY counts come from `total` and not from a page of rows: the transfer list
 * pages by number and reports the full match count, so one tiny page per
 * status is exact, while counting rows of one page would silently cap the
 * figure at the page size.
 *
 * The transfer list client is ./transfers.ts (another area owns it); this file
 * only composes it. No UI imports.
 */
import { listWarehouseTransfers, WAREHOUSE_TRANSFER_STATUSES, type WarehouseTransferStatus } from './transfers';
import { getWarehouseCapacity, type WarehouseCapacityDto } from './warehouses';
import { listWarehouseIssues, type IssueStatusCode } from './warehouseIssues';

/** Issues still needing work; RESOLVED and CLOSED are done. */
const OPEN_ISSUE_STATUSES: readonly IssueStatusCode[] = ['OPEN', 'IN_PROGRESS'];

/** Number of transfers per status, every status present (0 when none). */
export type TransferStatusCounts = Record<WarehouseTransferStatus, number>;

/**
 * Exact transfer totals per status. `warehouseId` narrows to transfers touching
 * that warehouse (either side); omit it for the caller's whole scope.
 */
export async function getTransferStatusCounts(
  warehouseId?: string | undefined,
  signal?: AbortSignal,
): Promise<TransferStatusCounts> {
  const totals = await Promise.all(
    WAREHOUSE_TRANSFER_STATUSES.map((status) =>
      listWarehouseTransfers({ status, warehouseId, page: 1, pageSize: 1 }, signal).then((page) => page.total),
    ),
  );
  const counts = {} as TransferStatusCounts;
  WAREHOUSE_TRANSFER_STATUSES.forEach((status, index) => {
    counts[status] = totals[index] ?? 0;
  });
  return counts;
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
 * a page size). Any failure fails the whole call: a partial sum is never
 * returned as if it were the total.
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
