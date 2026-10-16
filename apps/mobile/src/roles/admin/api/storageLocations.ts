/**
 * Storage locations of a warehouse beyond the list read in ./warehouses.ts
 * (docs/openapi.yaml, BR-79):
 *   GET   /warehouses/{id}/storage-locations/{locationId}  inventory.batch.view              (Sub = own)
 *   POST  /warehouses/{id}/storage-locations               warehouse.storage_location.manage (Sub = none)
 *   PATCH /warehouses/{id}/storage-locations/{locationId}  warehouse.storage_location.manage (Sub = none)
 *
 * The list (`listStorageLocations`) and the `StorageLocationDto` shape live in
 * ./warehouses.ts and are reused here, not redefined.
 *
 * A location has a code, a name, a free-text type, an optional capacity (a kg
 * decimal STRING, never a number) and an active flag. It has no rack / shelf /
 * bin layout and no stock of its own: `inventory_batches.storage_location` is
 * free text the receiving flow fills with the location's code, so any per-
 * location stock a screen shows is derived from the batches, not from here.
 *
 * The code is immutable (absent from PATCH). Request bodies are strict on the
 * server; only the documented fields are sent. No Idempotency-Key: nothing here
 * moves money. No UI imports.
 */
import type { GenericProblemCode } from '@tohfa/shared-types';
import { adminGet, adminPatch, adminPost } from './http';
import type { StorageLocationDto } from './warehouses';

export type { StorageLocationDto } from './warehouses';

export interface CreateStorageLocationBody {
  /** 1-40 chars, unique in the warehouse. */
  code: string;
  /** 1-120 chars. */
  name: string;
  /** Free text, 1-40 chars. */
  locationType?: string | null | undefined;
  /** A positive kg decimal string, at most 3 decimals. */
  capacityKg?: string | null | undefined;
}

/** At least one field. The code cannot change. */
export interface UpdateStorageLocationBody {
  name?: string | undefined;
  locationType?: string | null | undefined;
  capacityKg?: string | null | undefined;
  isActive?: boolean | undefined;
}

/** 401, 403, 404, 409 (duplicate code), 422, 500. */
export const ERROR_CODES: readonly GenericProblemCode[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'VALIDATION_FAILED',
  'INTERNAL',
];

function locationsPath(warehouseId: string): string {
  return `/warehouses/${encodeURIComponent(warehouseId)}/storage-locations`;
}

/** One location; 404 for a location (or warehouse) outside the caller's scope. */
export function getStorageLocation(warehouseId: string, locationId: string, signal?: AbortSignal): Promise<StorageLocationDto> {
  return adminGet<StorageLocationDto>(`${locationsPath(warehouseId)}/${encodeURIComponent(locationId)}`, undefined, signal);
}

export function createStorageLocation(warehouseId: string, body: CreateStorageLocationBody): Promise<StorageLocationDto> {
  return adminPost<StorageLocationDto>(locationsPath(warehouseId), {
    code: body.code,
    name: body.name,
    locationType: body.locationType,
    capacityKg: body.capacityKg,
  });
}

export function updateStorageLocation(
  warehouseId: string,
  locationId: string,
  body: UpdateStorageLocationBody,
): Promise<StorageLocationDto> {
  return adminPatch<StorageLocationDto>(`${locationsPath(warehouseId)}/${encodeURIComponent(locationId)}`, {
    name: body.name,
    locationType: body.locationType,
    capacityKg: body.capacityKg,
    isActive: body.isActive,
  });
}
