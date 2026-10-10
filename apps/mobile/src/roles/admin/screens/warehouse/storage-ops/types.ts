/**
 * Shared types for the warehouse storage-ops screens, part A (design module
 * M4): material handling, storage location detail / assignment, capacity and
 * (Main only) warehouse performance.
 *
 * One set of screens serves both warehouse roles. As in the other warehouse
 * areas, the role difference is carried by `scope` (warehouseId undefined = all
 * four warehouses, the Main Warehouse view) and `can` (a docs/rbac.json code
 * check that only decides what to render; the server enforces every action
 * again, CLAUDE.md 2.1).
 *
 * Permissions (FINAL_LIST 127, 129-131, 136, 137, 140):
 *   - Materials: `inventory.material_handling.manage` (MAIN all, SUB own) for
 *     Add Material / Add Stock / Receive / Issue. Viewing the list has no code
 *     of its own (read-only without the grant).
 *   - Storage location detail: `inventory.batch.view` for the View Stock link
 *     (approximation; no code covers storage-location master data).
 *   - Storage location assignment: `inventory.batch.assign` (MAIN all, SUB all).
 *   - Capacity: no view code (SPEC_GAPS); the Manage Capacity Limits link needs
 *     `warehouse.capacity.set` (MAIN all, SUB none).
 *   - Performance: `warehouse.all.view` (Main); the staff ranking needs
 *     `warehouse.staff.list_view` (the warehouse roster).
 */
import type { AdminTone } from '../../../theme';

export type {
  PermissionCheck,
  WarehouseNavigate,
  WarehouseScope,
  WarehouseScreenBaseProps,
  WarehouseTab,
} from '../finance-expenses/types';
export type { StorageLocationItem, StorageType } from '../profile-settings/types';

/** Stock state of a material, also the Material Handling filter chips (besides 'All'). */
export type MaterialStatus = 'Available' | 'Low Stock' | 'Out of Stock';

/** Material Handling filter chips. */
export type MaterialFilter = 'All' | MaterialStatus;

/** One warehouse material (packaging, crates, labels...). Mock data until an endpoint exists. */
export interface MaterialItem {
  id: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  warehouseId: string;
  /** Storage location id (profile-settings STORAGE_LOCATIONS) or a free-text area. */
  storageLocation: string;
  current: number;
  reserved: number;
  status: MaterialStatus;
  lastUpdated: string;
}

/** One movement in a material's history (Issued / Received). */
export interface MaterialHistoryEntry {
  id: string;
  materialId: string;
  kind: 'Issued' | 'Received';
  quantity: number;
  detail: string;
  by: string;
  at: string;
}

/** One option of the Add Material picker. */
export interface MaterialOption {
  name: string;
  category: string;
}

/** Today's material movement counts of one warehouse (Material Handling KPI tiles). */
export interface MaterialDaySummary {
  warehouseId: string;
  issuedToday: number;
  receivedToday: number;
}

/** One product lot stored at a storage location (Location Usage / Stored Stock). */
export interface LocationStockItem {
  id: string;
  locationId: string;
  product: string;
  quantityKg: number;
}

/** Location details beyond the profile-settings record (Main's Location Information card). */
export interface LocationLayout {
  locationId: string;
  section: string;
  rackShelf: string;
}

/** Capacity list chip / state of a storage location. */
export type CapacityState = 'Available' | 'Occupied' | 'Unavailable';
export type CapacityFilter = 'All' | CapacityState;

/** One KPI tile of Warehouse Performance (display values; the targets are data, not thresholds). */
export interface PerformanceKpi {
  id: string;
  label: string;
  value: string;
  badge: string;
  badgeTone: AdminTone;
  sub: string;
}

/** One warehouse row of Warehouse Performance. */
export interface WarehousePerformanceRow {
  warehouseId: string;
  slaRate: string;
  inbound: string;
  outbound: string;
  openIssues: number;
  utilizationPercent: number;
  tone: AdminTone;
}

/** One staff member of the Top Performing Staff ranking. */
export interface TopPerformer {
  id: string;
  name: string;
  role: string;
  warehouseId: string;
  taskCount: string;
  score: string;
}

/** Performance period chips. */
export type PerformancePeriod = 'Today' | 'This Week' | 'This Month';

/** Screens of the storage-ops flow (old App.tsx keys without the 'SubWarehouse' prefix). */
export type StorageRoute =
  | 'MaterialHandling'
  | 'MaterialDetail'
  | 'AddMaterial'
  | 'StorageLocationDetail'
  | 'StorageLocationAssignment'
  | 'Capacity'
  | 'Performance';

export interface StorageRouteParams {
  materialId?: string | undefined;
  locationId?: string | undefined;
  /** Storage Location Assignment: the batch being put away. */
  batchId?: string | undefined;
  productName?: string | undefined;
  quantity?: string | undefined;
  /** The batch's warehouse (Main view); a Sub scope always uses its own. */
  warehouseId?: string | undefined;
}
