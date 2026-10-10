/**
 * Shared types for the warehouse-admin screens (Main Warehouse Admin managing
 * all four warehouses and their Sub Warehouse Admins).
 *
 * All three screens are Main-only (FINAL_LIST 155-157): Warehouse Overview and
 * Warehouse City Detail need `warehouse.all.view` (MAIN all, SUB none); Manage
 * Sub Warehouse Admins needs `admin.sub_wh_admin.create` (MAIN all, SUB none).
 * `scope` is still passed (the Main scope, warehouseId undefined = all four
 * warehouses, owner decision) so the screens follow the area pattern; `can`
 * only decides what to render, the server enforces every action again
 * (CLAUDE.md 2.1). There is no Add Warehouse: BR-23 fixes four warehouses and
 * no create endpoint or code exists (SPEC_GAPS W4x-1).
 */
export type {
  PermissionCheck,
  WarehouseNavigate,
  WarehouseScope,
  WarehouseScreenBaseProps,
  WarehouseTab,
} from '../finance-expenses/types';

export type WarehouseAdminStatus = 'Active' | 'Near Capacity';

/** One warehouse as the Main admin manages it (mock; GET /warehouses returns only id/code/name/type/city/capacityKg). */
export interface WarehouseAdminRow {
  warehouseId: string;
  /** Display code, e.g. 'WH-OOT-001'. */
  code: string;
  city: string;
  kind: 'Main Warehouse' | 'Sub Warehouse';
  address: string;
  /** Demo status held as warehouse data (no capacity-alert key, SPEC_GAPS W4u-3). */
  status: WarehouseAdminStatus;
  stockKg: number;
  capacityKg: number;
  receiptsTodayKg: number;
  pendingOrders: number;
  openIssues: number;
  staffCount: number;
  /** Per-warehouse low-stock trigger shown on the management card (warehouse data, not a threshold in code). */
  lowStockTrigger: string;
  operatingHours: string;
  /** Assigned Sub Warehouse Admin id; undefined = unassigned. */
  swaId?: string | undefined;
}

/** One Sub Warehouse Admin account (mock; no SWA list endpoint is wired here). */
export interface SubWarehouseAdminItem {
  id: string;
  name: string;
  warehouseId: string;
  status: 'Active' | 'Pending';
  responsibilities: readonly string[];
}

/** Screens of the warehouse-admin flow. */
export type WarehouseAdminRoute =
  | 'WarehouseOverview'
  | 'WarehouseCityDetail'
  | 'ManageSubWarehouseAdmins'
  | 'WarehouseDocuments'
  | 'WarehouseSettings'
  | 'WarehouseCapacity'
  | 'WarehousePerformance';

export interface WarehouseAdminRouteParams {
  warehouseId?: string | undefined;
}
