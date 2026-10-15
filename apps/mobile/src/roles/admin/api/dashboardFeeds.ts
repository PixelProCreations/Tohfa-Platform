/**
 * Small read compositions the warehouse Home / dashboard screens need on top
 * of the existing admin API modules. Nothing here talks to a new endpoint:
 *
 *   getTransferStatusCounts   GET /warehouse-transfers?status=<s>&pageSize=1, once per
 *                             status, reading `total` (transfer.inter_warehouse.view;
 *                             Sub = transfers touching its own warehouse, BR-30)
 *   getWarehouseCapacities    GET /warehouses/{id}/capacity for each id (warehouse.own.view)
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
