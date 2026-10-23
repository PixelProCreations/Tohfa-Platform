/**
 * How the warehouse-admin screens hand one warehouse to another module: the
 * flow's Capacity route and the Main shell's Operations hub (StorageFlow), and
 * the shell's Inventory tab. Pure, so plain-Node vitest covers it
 * (tests/warehouse_management_m15.test.ts, tests/warehouse_detail_m15_03.test.ts).
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

/**
 * The Operations hub (Warehouse Detail's Open Operations) on `warehouseId`;
 * without one the hub keeps its own pick (the first active warehouse).
 */
export function operationsEntryOf(warehouseId: string | undefined): StorageEntry {
  return { initialScreen: 'Operations', initialParams: warehouseId === undefined ? undefined : { warehouseId } };
}

/** Where Open Inventory lands: the Main shell's Inventory tab, its warehouse filter set to `warehouseId`. */
export interface InventoryEntry {
  tab: 'Inventory';
  filterWarehouseId: string;
}

export function inventoryEntryOf(warehouseId: string): InventoryEntry {
  return { tab: 'Inventory', filterWarehouseId: warehouseId };
}
