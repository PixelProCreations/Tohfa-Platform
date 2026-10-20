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


/** Screens of the warehouse-admin flow. */
export type WarehouseAdminRoute =
  | 'WarehouseOverview'
  | 'WarehouseCityDetail'
  | 'ManageSubWarehouseAdmins'
  | 'WarehouseDocuments'
  | 'WarehouseSettings'
  | 'WarehouseCapacity'
  | 'WarehousePerformance'
  | 'Staff'
  | 'Attendance';

export interface WarehouseAdminRouteParams {
  warehouseId?: string | undefined;
}
