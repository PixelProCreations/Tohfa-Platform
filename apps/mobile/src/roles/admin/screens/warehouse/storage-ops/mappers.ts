/**
 * Pure mapper functions for the storage-ops area.
 *
 * Maps API DTOs → screen types (StorageLocationItem).
 * No React. No network. No business logic beyond presentation.
 *
 * Spec-gap: StorageLocationDto has no per-location stock or currentKg.
 * The batch table's storage_location is free text; a per-location used-kg
 * figure needs an aggregation query not yet exposed (SPEC_GAPS W4u-3).
 * We map currentKg = 0 until that endpoint exists.
 *
 * Spec-gap: locationType is free text, not an enum. We normalize to the four
 * StorageType values by case-insensitive match, falling back to 'Dry Storage'.
 */
import type { StorageLocationDto } from '../../../api/warehouses';
import type { StorageLocationItem, StorageType } from './types';

const STORAGE_TYPE_MAP: ReadonlyMap<string, StorageType> = new Map([
  ['cold storage', 'Cold Storage'],
  ['dry storage', 'Dry Storage'],
  ['bulk storage', 'Bulk Storage'],
  ['staging area', 'Staging Area'],
]);

/**
 * Normalizes a free-text locationType string to one of the four StorageType
 * values used by the screens. Falls back to 'Dry Storage' for unknown text or
 * null (spec gap: no enum constraint on the API field).
 */
export function storageTypeOf(locationType: string | null | undefined): StorageType {
  if (!locationType) return 'Dry Storage';
  const normalized = locationType.trim().toLowerCase();
  return STORAGE_TYPE_MAP.get(normalized) ?? 'Dry Storage';
}

/**
 * Maps a StorageLocationDto from GET /warehouses/{id}/storage-locations
 * to a StorageLocationItem used by WarehouseCapacityScreen and
 * StorageLocationDetailScreen.
 *
 * currentKg is always 0: there is no per-location stock endpoint (SPEC_GAPS
 * W4u-3). The value comes from inventory_batches.storage_location free-text
 * joins that are not yet aggregated and exposed by the API.
 */
export function toStorageLocationItem(dto: StorageLocationDto): StorageLocationItem {
  return {
    id: dto.id,
    warehouseId: dto.warehouseId,
    code: dto.code,
    name: dto.name,
    type: storageTypeOf(dto.locationType),
    status: dto.isActive ? 'Active' : 'Inactive',
    capacityKg: dto.capacityKg !== null ? parseFloat(dto.capacityKg) : 0,
    // Spec-gap W4u-3: no per-location stock endpoint exists.
    currentKg: 0,
  };
}
