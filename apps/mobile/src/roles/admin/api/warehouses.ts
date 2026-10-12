/**
 * Warehouse reference data the admin screens read (docs/openapi.yaml tag
 * Inventory):
 *   GET /warehouses/{id}/storage-locations   inventory.batch.view (BR-30, BR-79; Sub = own)
 *
 * Storage locations page by number (`StorageLocationList`: items, page,
 * pageSize, total), not by cursor. A Sub admin asking for another warehouse
 * gets 404, never 403. `inventory_batches.storage_location` is free text and is
 * not linked to these rows, so a screen that records a location sends its code.
 *
 * No UI imports, so the Main Warehouse admin can reuse this module.
 */
import type { OffsetPage } from '../../../shell/api/pagination';
import { adminGet } from './http';

/** docs/openapi.yaml `StorageLocation`. */
export interface StorageLocationDto {
  id: string;
  warehouseId: string;
  code: string;
  name: string;
  /** Free text, not an enum. */
  locationType: string | null;
  /** Display-only capacity, a kg string with 3 decimals. */
  capacityKg: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface ListStorageLocationsParams {
  /** Free text over code, name or type. */
  q?: string | undefined;
  isActive?: boolean | undefined;
  /** From 1. */
  page?: number | undefined;
  /** 1-100, server default 20. */
  pageSize?: number | undefined;
}

export function listStorageLocations(
  warehouseId: string,
  params: ListStorageLocationsParams = {},
  signal?: AbortSignal,
): Promise<OffsetPage<StorageLocationDto>> {
  return adminGet<OffsetPage<StorageLocationDto>>(
    `/warehouses/${encodeURIComponent(warehouseId)}/storage-locations`,
    {
      q: params.q,
      isActive: params.isActive === undefined ? undefined : String(params.isActive),
      page: params.page,
      pageSize: params.pageSize,
    },
    signal,
  );
}
