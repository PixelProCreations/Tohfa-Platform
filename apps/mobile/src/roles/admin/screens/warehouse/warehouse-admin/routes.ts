/**
 * How WarehouseAdminFlow hands a route to the shared StorageFlow. Pure, so
 * plain-Node vitest covers it (tests/warehouse_management_m15.test.ts).
 *
 * Why it exists: the Capacity route used to open StorageFlow with no warehouse,
 * so from Coonoor's detail it showed the first active warehouse (Ooty).
 * StorageFlow preselects the Main pick from `initialParams.warehouseId`.
 */
import type { StorageRoute, StorageRouteParams } from '../storage-ops/types';

export interface StorageEntry {
  initialScreen: StorageRoute;
  initialParams: StorageRouteParams | undefined;
}

/** Storage Capacity on `warehouseId`; without one the flow's own default pick applies. */
export function capacityEntryOf(warehouseId: string | undefined): StorageEntry {
  return { initialScreen: 'Capacity', initialParams: warehouseId === undefined ? undefined : { warehouseId } };
}
