/**
 * Live data for the storage ops screens.
 *
 * Storage locations use offset pagination (not cursor), so we load the first
 * page via useAdminQuery rather than useCursorList. pageSize=100 covers all
 * locations for a single warehouse in practice; the screen's own client-side
 * filter handles sub-lists.
 *
 * BR-30: Sub scope sends its own warehouseId; Main sends the scope's id (if a
 * specific warehouse was selected) or undefined (in which case the query is
 * disabled — WarehouseCapacityScreen is per-warehouse).
 */
import { useCallback, useMemo } from 'react';
import { listStorageLocations } from '../../../api/warehouses';
import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { toStorageLocationItem } from './mappers';
import type { StorageLocationItem, PermissionCheck, WarehouseScope } from './types';

export { StorageLocationItem };

/** RBAC code that gates reading storage location detail / list (batch view). */
export const STORAGE_LOCATION_VIEW_CODE = 'inventory.batch.view';

/** First-page load of storage locations for the given warehouse. */
export function useStorageLocations(
  scope: WarehouseScope,
  can: PermissionCheck,
): {
  locations: readonly StorageLocationItem[] | undefined;
  isLoading: boolean;
  error: unknown;
} {
  const warehouseId = scope.warehouseId;
  const enabled = can(STORAGE_LOCATION_VIEW_CODE) && warehouseId !== undefined;

  const query = useAdminQuery(
    adminKeys.scoped('storageLocations', warehouseId, { resource: 'list', page: 1 }),
    (signal) =>
      listStorageLocations(
        warehouseId!,
        // Load up to 100 locations; a single warehouse rarely exceeds this.
        { pageSize: 100, isActive: undefined },
        signal,
      ),
    { enabled },
  );

  const locations = useMemo(
    () =>
      query.data ? query.data.items.map(toStorageLocationItem) : undefined,
    [query.data],
  );

  return {
    locations,
    isLoading: query.isLoading,
    error: query.error,
  };
}
