/**
 * Mock warehouse-admin data until the API carries it. Rows are keyed by the
 * four seeded warehouse ids (seed 001_reference.sql); names come from
 * WALLET_WAREHOUSES, never from a screen. Figures merge the old Warehouse
 * Overview, Manage Warehouses, Warehouse Management hub, Warehouse List and
 * Warehouse Detail mocks (which disagreed with each other).
 */
import { WALLET_WAREHOUSES, warehouseNameOf } from '../wallet-cashtopup/fixtures';
import type { SubWarehouseAdminItem, WarehouseAdminRow, WarehouseScope } from './types';

/** The four seeded warehouses. */
export const ADMIN_WAREHOUSES: readonly WarehouseScope[] = WALLET_WAREHOUSES;

/** Display name of a warehouse id ('Ooty Warehouse'). */
export const adminWarehouseName = warehouseNameOf;

/** Short label without the ' Warehouse' suffix ('Gudalur Market'). */
export function adminWarehouseLabel(warehouseId: string): string {
  return warehouseNameOf(warehouseId).replace(/ Warehouse$/, '');
}

export const WAREHOUSE_ADMIN_ROWS: readonly WarehouseAdminRow[] = [
  {
    warehouseId: 'WH-OOTY',
    code: 'WH-OOT-001',
    city: 'Ooty, Nilgiris',
    kind: 'Main Warehouse',
    address: 'Charing Cross, Ooty, Nilgiris - 643001',
    status: 'Active',
    stockKg: 3420,
    capacityKg: 4200,
    receiptsTodayKg: 420,
    pendingOrders: 86,
    openIssues: 2,
    staffCount: 12,
    lowStockTrigger: '25%',
    operatingHours: '6:00 AM – 6:00 PM',
    swaId: 'SWA-001',
  },
  {
    warehouseId: 'WH-COON',
    code: 'WH-COO-001',
    city: 'Coonoor, Nilgiris',
    kind: 'Sub Warehouse',
    address: '14 Market Road, Coonoor, Tamil Nadu 643101',
    status: 'Active',
    stockKg: 3180,
    capacityKg: 4700,
    receiptsTodayKg: 380,
    pendingOrders: 92,
    openIssues: 3,
    staffCount: 15,
    lowStockTrigger: '20%',
    operatingHours: '6:00 AM – 6:00 PM',
    swaId: 'SWA-002',
  },
  {
    warehouseId: 'WH-KOTA',
    code: 'WH-KOT-001',
    city: 'Kotagiri, Nilgiris',
    kind: 'Sub Warehouse',
    address: 'Kotagiri Market Road, Kotagiri, Nilgiris - 643217',
    status: 'Active',
    stockKg: 2940,
    capacityKg: 4000,
    receiptsTodayKg: 310,
    pendingOrders: 64,
    openIssues: 1,
    staffCount: 8,
    lowStockTrigger: '25%',
    operatingHours: '6:00 AM – 6:00 PM',
    swaId: 'SWA-003',
  },
  {
    warehouseId: 'WH-GUDA',
    code: 'WH-GUD-001',
    city: 'Gudalur, Nilgiris',
    kind: 'Sub Warehouse',
    address: 'Gudalur Market, Gudalur, Nilgiris - 643212',
    status: 'Near Capacity',
    stockKg: 3300,
    capacityKg: 4050,
    receiptsTodayKg: 360,
    pendingOrders: 70,
    openIssues: 1,
    staffCount: 6,
    lowStockTrigger: '20%',
    operatingHours: '7:00 AM – 5:00 PM',
  },
];

export const SUB_WAREHOUSE_ADMINS: readonly SubWarehouseAdminItem[] = [
  {
    id: 'SWA-001',
    name: 'Arun',
    warehouseId: 'WH-OOTY',
    status: 'Active',
    responsibilities: ['Goods Receiving', 'Inventory', 'Orders', 'Sales', 'Finance'],
  },
  {
    id: 'SWA-002',
    name: 'Karthik Kumar',
    warehouseId: 'WH-COON',
    status: 'Active',
    responsibilities: ['Goods Receiving', 'Inventory', 'Orders', 'Sales', 'Finance'],
  },
  {
    id: 'SWA-003',
    name: 'Manoj',
    warehouseId: 'WH-KOTA',
    status: 'Pending',
    responsibilities: ['Goods Receiving', 'Inventory', 'Orders'],
  },
];

/** Name of the SWA assigned to a warehouse row, or undefined when unassigned. */
export function swaNameOf(row: WarehouseAdminRow, admins: readonly SubWarehouseAdminItem[] = SUB_WAREHOUSE_ADMINS): string | undefined {
  return admins.find((a) => a.id === row.swaId)?.name;
}
