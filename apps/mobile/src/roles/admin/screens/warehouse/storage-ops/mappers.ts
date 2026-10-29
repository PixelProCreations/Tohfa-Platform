/**
 * Pure mapper functions for the storage-ops area.
 *
 * Maps API DTOs → screen types (StorageLocationItem).
 * No React. No network. No business logic beyond presentation.
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
    currentKg: dto.usedKg != null ? parseFloat(dto.usedKg) : 0,
  };
}
