/**
 * Warehouse reference data the admin screens read (docs/openapi.yaml tag
 * Inventory):
 *   GET /warehouses                          warehouse.all.view   (Main only; Sub = none)
 *   GET /warehouses/{id}                     warehouse.own.view   (BR-30, BR-66; Sub = own)
 *   GET /warehouses/{id}/capacity            warehouse.own.view   (BR-30, BR-66; Sub = own)
 *   GET /warehouses/{id}/storage-locations   inventory.batch.view (BR-30, BR-79; Sub = own)
 *
 * Every route takes the warehouse uuid in the path. A Sub Warehouse Admin
 * asking for any other warehouse (or an unknown id) gets the same 404, never
 * 403, so the answer does not confirm the warehouse exists (BR-66). Screens
 * pass scope.warehouseId for a Sub scope, never a picked id (BR-30).
 *
 * Writes are not exported: PATCH /warehouses/{id} (warehouse.profile.edit),
 * PATCH .../capacity (warehouse.capacity.set) and the storage-location writes
 * (warehouse.storage_location.manage) are all `none` for a Sub admin, and the
 * Main admin's settings come in a later phase.
 *
 * The list pages by number too (`WarehouseList`: items, page, pageSize,
 * total; pageSize at most 100). It is the Main admin's warehouse selector and
 * network views; a Sub admin cannot call it.
 *
 * Storage locations page by number (`StorageLocationList`: items, page,
 * pageSize, total), not by cursor. A Sub admin asking for another warehouse
 * gets 404, never 403. `inventory_batches.storage_location` is free text and is
 * not linked to these rows, so a screen that records a location sends its code.
 *
 * No UI imports, so the Main Warehouse admin can reuse this module.
 */
import type { GenericProblemCode } from '@tohfa/shared-types';
import type { OffsetPage } from '../../../shell/api/pagination';
import { adminGet } from './http';

/**
 * docs/openapi.yaml Warehouse. `operatingHours` is the stored JSON passed
 * through unchanged (its read format is not specified; PATCH accepts one
 * shape, see the profile mappers).
 */
export interface WarehouseDto {
  id: string;
  code: string;
  name: string;
  type: 'MAIN' | 'SUB';
  address?: string | null;
  city?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  /** A kg string with 3 decimals, or null when not set. */
  capacityKg?: string | null;
  contactPhone?: string | null;
  operatingHours?: unknown;
  isMarketDayVenue?: boolean;
  marketDayOfWeek?: number | null;
  isActive: boolean;
  createdAt: string;
}

/** docs/openapi.yaml WarehouseCapacity: derived from ACTIVE batches, never clamped (BR-66). */
export interface WarehouseCapacityDto {
  warehouseId: string;
  capacityKg: string | null;
  usedKg: string;
  /** capacityKg - usedKg; negative when over capacity; null without a capacity. */
  availableKg: string | null;
  /** usedKg / capacityKg * 100, 2 decimals; above 100 when over capacity; null without a capacity. */
  utilizationPercent: number | null;
}

/**
 * Every problem code the three warehouse read routes document (401, 403, 404,
 * 422, 500). The list route documents 400 (BAD_REQUEST) instead of 404 and 422;
 * a screen treats an unknown code as a generic failure.
 */
export const ERROR_CODES: readonly GenericProblemCode[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'INTERNAL',
];

function warehousePath(warehouseId: string): string {
  return `/warehouses/${encodeURIComponent(warehouseId)}`;
}

/** One warehouse; 404 for any warehouse outside the caller's scope (BR-66). */
export function getWarehouse(warehouseId: string, signal?: AbortSignal): Promise<WarehouseDto> {
  return adminGet<WarehouseDto>(warehousePath(warehouseId), undefined, signal);
}

/** Capacity and the usage derived from stock (BR-66b). */
export function getWarehouseCapacity(warehouseId: string, signal?: AbortSignal): Promise<WarehouseCapacityDto> {
  return adminGet<WarehouseCapacityDto>(`${warehousePath(warehouseId)}/capacity`, undefined, signal);
}

/** docs/openapi.yaml `StorageLocation`. */
export interface StorageLocationDto {
  id: string;
  warehouseId: string;
  parentId: string | null;
  level: number;
  usedKg: string;
  batchCount: number;
  subtreeUsedKg: string;
  subtreeBatchCount: number;
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
    `${warehousePath(warehouseId)}/storage-locations`,
    {
      q: params.q,
      isActive: params.isActive === undefined ? undefined : String(params.isActive),
      page: params.page,
      pageSize: params.pageSize,
    },
    signal,
  );
}

export interface ListWarehousesParams {
  q?: string | undefined;
  type?: 'MAIN' | 'SUB' | undefined;
  isActive?: boolean | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

/** Every warehouse in the network (GET /warehouses, warehouse.all.view). */
export function listWarehouses(
  params: ListWarehousesParams = {},
  signal?: AbortSignal,
): Promise<OffsetPage<WarehouseDto>> {
  return adminGet<OffsetPage<WarehouseDto>>(
    '/warehouses',
    {
      q: params.q,
      type: params.type,
      isActive: params.isActive === undefined ? undefined : String(params.isActive),
      page: params.page,
      pageSize: params.pageSize,
    },
    signal,
  );
}
