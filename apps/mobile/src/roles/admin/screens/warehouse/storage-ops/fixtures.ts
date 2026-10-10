/**
 * Mock data for the storage-ops screens until material / storage-location /
 * capacity endpoints exist (none in docs/openapi.yaml today). Rows carry the
 * seeded warehouse ids (seed 001_reference.sql) so a Sub scope filters to its
 * own warehouse while the Main scope sees all four; warehouse names are looked
 * up from STORAGE_WAREHOUSES, never written into a screen.
 *
 * Storage locations themselves come from profile-settings STORAGE_LOCATIONS
 * (the Storage Information list opens these detail screens), so both screens
 * describe the same locations.
 */
import { STORAGE_LOCATIONS } from '../profile-settings/warehouseFixtures';
import { WALLET_WAREHOUSES, warehouseNameOf } from '../wallet-cashtopup/fixtures';
import type {
  LocationLayout,
  LocationStockItem,
  MaterialDaySummary,
  MaterialHistoryEntry,
  MaterialItem,
  MaterialOption,
  PerformanceKpi,
  StorageLocationItem,
  TopPerformer,
  WarehousePerformanceRow,
  WarehouseScope,
} from './types';

/** The four warehouses (seed 001). */
export const STORAGE_WAREHOUSES: readonly WarehouseScope[] = WALLET_WAREHOUSES;

/** Display name of a warehouse id (falls back to the id). */
export const storageWarehouseName = warehouseNameOf;

export { STORAGE_LOCATIONS };

export const MATERIALS: readonly MaterialItem[] = [
  { id: 'MAT-0021', name: 'Packaging Box', code: 'MAT-0021', category: 'Packaging', unit: 'Units', warehouseId: 'WH-COON', storageLocation: 'Material Storage Area', current: 120, reserved: 20, status: 'Available', lastUpdated: 'Today, 10:30 AM' },
  { id: 'MAT-0034', name: 'Crates', code: 'MAT-0034', category: 'Storage Containers', unit: 'Units', warehouseId: 'WH-COON', storageLocation: 'Material Storage Area', current: 8, reserved: 0, status: 'Low Stock', lastUpdated: 'Today, 9:15 AM' },
  { id: 'MAT-0041', name: 'Labels', code: 'MAT-0041', category: 'Packaging', unit: 'Units', warehouseId: 'WH-COON', storageLocation: 'Material Storage Area', current: 340, reserved: 40, status: 'Available', lastUpdated: 'Yesterday' },
  { id: 'MAT-0105', name: 'Packaging Box', code: 'MAT-0105', category: 'Packaging', unit: 'Units', warehouseId: 'WH-OOTY', storageLocation: 'Dry Storage B', current: 260, reserved: 30, status: 'Available', lastUpdated: 'Today, 8:40 AM' },
  { id: 'MAT-0112', name: 'Pallets', code: 'MAT-0112', category: 'Handling Equipment', unit: 'Units', warehouseId: 'WH-OOTY', storageLocation: 'Dry Storage B', current: 0, reserved: 0, status: 'Out of Stock', lastUpdated: 'Yesterday' },
  { id: 'MAT-0207', name: 'Sealing Tape', code: 'MAT-0207', category: 'Consumables', unit: 'Rolls', warehouseId: 'WH-KOTA', storageLocation: 'Dry Storage B', current: 6, reserved: 2, status: 'Low Stock', lastUpdated: 'Today, 11:05 AM' },
  { id: 'MAT-0301', name: 'Crates', code: 'MAT-0301', category: 'Storage Containers', unit: 'Units', warehouseId: 'WH-GUDA', storageLocation: 'Dry Storage A', current: 75, reserved: 10, status: 'Available', lastUpdated: 'Today, 7:50 AM' },
];

export const MATERIAL_HISTORY: readonly MaterialHistoryEntry[] = [
  { id: 'mh-1', materialId: 'MAT-0021', kind: 'Issued', quantity: 20, detail: 'Reason: Order Fulfillment', by: 'Suresh · SWA', at: '24 Sep, 09:50 AM' },
  { id: 'mh-2', materialId: 'MAT-0021', kind: 'Received', quantity: 50, detail: 'From Main Warehouse', by: 'Suresh · SWA', at: '22 Sep, 11:10 AM' },
  { id: 'mh-3', materialId: 'MAT-0034', kind: 'Issued', quantity: 12, detail: 'Reason: Dispatch Packing', by: 'Suresh · SWA', at: '24 Sep, 08:30 AM' },
  { id: 'mh-4', materialId: 'MAT-0105', kind: 'Received', quantity: 100, detail: 'From Supplier', by: 'Ravi · SWA', at: '23 Sep, 04:15 PM' },
];

/** Today's issued / received counts per warehouse (demo). */
export const MATERIAL_DAY_SUMMARY: readonly MaterialDaySummary[] = [
  { warehouseId: 'WH-COON', issuedToday: 18, receivedToday: 12 },
  { warehouseId: 'WH-OOTY', issuedToday: 24, receivedToday: 30 },
  { warehouseId: 'WH-KOTA', issuedToday: 6, receivedToday: 4 },
  { warehouseId: 'WH-GUDA', issuedToday: 9, receivedToday: 5 },
];

export const MATERIAL_OPTIONS: readonly MaterialOption[] = [
  { name: 'Packaging Box', category: 'Packaging' },
  { name: 'Crates', category: 'Storage Containers' },
  { name: 'Labels', category: 'Packaging' },
  { name: 'Pallets', category: 'Handling Equipment' },
  { name: 'Sealing Tape', category: 'Consumables' },
];

/** Product lots per storage location (Location Usage / Stored Stock). */
export const LOCATION_STOCK: readonly LocationStockItem[] = [
  { id: 'ls-1', locationId: 'CS-A01', product: 'Carrot', quantityKg: 420 },
  { id: 'ls-2', locationId: 'CS-A01', product: 'Cabbage', quantityKg: 320 },
  { id: 'ls-3', locationId: 'CS-A01', product: 'Beans', quantityKg: 210 },
  { id: 'ls-4', locationId: 'DS-B01', product: 'Potato', quantityKg: 900 },
  { id: 'ls-5', locationId: 'CS-C01', product: 'Tomato G1', quantityKg: 140 },
  { id: 'ls-6', locationId: 'CS-C01', product: 'Carrot G1', quantityKg: 80 },
  { id: 'ls-7', locationId: 'OCS-A01', product: 'Tomato G1', quantityKg: 640 },
  { id: 'ls-8', locationId: 'KCS-A01', product: 'Beans', quantityKg: 300 },
  { id: 'ls-9', locationId: 'GDS-A01', product: 'Onion', quantityKg: 700 },
];

/** Section / rack / shelf of the locations that have one (Main's Location Information card). */
export const LOCATION_LAYOUT: readonly LocationLayout[] = [
  { locationId: 'CS-A01', section: 'A', rackShelf: '02 / 03' },
  { locationId: 'DS-B01', section: 'B', rackShelf: '01 / 02' },
  { locationId: 'CS-C01', section: 'C', rackShelf: '01 / 01' },
  { locationId: 'OCS-A01', section: 'A', rackShelf: '01 / 02' },
];

/**
 * Occupancy share at which a location shows the "nearing its configured
 * capacity" alert, per warehouse. Demo data standing in for the warehouse
 * record, not a screen constant: no system_config key or endpoint exists for it
 * (SPEC_GAPS W4u-3). A warehouse without an entry shows no alert.
 */
const CAPACITY_ALERT_PERCENT: Readonly<Record<string, number>> = {
  'WH-COON': 90,
  'WH-OOTY': 90,
  'WH-KOTA': 90,
  'WH-GUDA': 85,
};

export function capacityAlertPercentOf(warehouseId: string): number | undefined {
  return CAPACITY_ALERT_PERCENT[warehouseId];
}

/** Locations visible to a scope (Main: all, or the selected warehouse; Sub: its own). */
export function locationsInScope(
  scope: WarehouseScope,
  selectedWarehouseId?: string | undefined,
  locations: readonly StorageLocationItem[] = STORAGE_LOCATIONS,
): StorageLocationItem[] {
  const warehouseId = scope.warehouseId ?? selectedWarehouseId;
  return locations.filter((l) => warehouseId === undefined || l.warehouseId === warehouseId);
}

export const PERFORMANCE_KPIS: readonly PerformanceKpi[] = [
  { id: 'sla', label: 'DISPATCH SLA', value: '98.6%', badge: '↑ 1.4%', badgeTone: 'success', sub: 'Target: 95.0% on-time' },
  { id: 'putaway', label: 'AVG PUTAWAY', value: '38 min', badge: '↓ 6 min', badgeTone: 'success', sub: 'Target: < 45 mins' },
  { id: 'accuracy', label: 'ACCURACY', value: '99.4%', badge: 'Active', badgeTone: 'brandSoft', sub: '2 discrepancies / 340' },
  { id: 'efficiency', label: 'EFFICIENCY', value: '82%', badge: 'Optimal', badgeTone: 'brandSoft', sub: '14,200 kg active stock' },
];

export const WAREHOUSE_PERFORMANCE: readonly WarehousePerformanceRow[] = [
  { warehouseId: 'WH-KOTA', slaRate: '99.2%', inbound: '1,420 kg', outbound: '1,280 kg', openIssues: 0, utilizationPercent: 82, tone: 'success' },
  { warehouseId: 'WH-OOTY', slaRate: '97.8%', inbound: '980 kg', outbound: '940 kg', openIssues: 1, utilizationPercent: 75, tone: 'warning' },
  { warehouseId: 'WH-COON', slaRate: '98.5%', inbound: '1,120 kg', outbound: '1,090 kg', openIssues: 0, utilizationPercent: 88, tone: 'success' },
];

export const TOP_PERFORMERS: readonly TopPerformer[] = [
  { id: 'tp-1', name: 'Manoj Kumar', role: 'SWA Lead', warehouseId: 'WH-KOTA', taskCount: '24 Receipts Verified', score: '99.8%' },
  { id: 'tp-2', name: 'Arun P', role: 'SWA Dispatch', warehouseId: 'WH-OOTY', taskCount: '86 Orders Packed', score: '99.2%' },
  { id: 'tp-3', name: 'Priya S', role: 'SWA Inventory', warehouseId: 'WH-COON', taskCount: '32 Rack Transfers', score: '98.9%' },
];
