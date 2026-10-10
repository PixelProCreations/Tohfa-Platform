/** Types for the shared warehouse More menu. */

/** One row of the More menu. `id` is also the key the permission gate in MoreScreen looks up. */
export interface MoreOptionItem {
  id: string;
  title: string;
  subtitle: string;
  iconType:
    | 'orders'
    | 'sales'
    | 'customers'
    | 'wallet'
    | 'billing'
    | 'returns'
    | 'finance'
    | 'reports'
    | 'notifications'
    | 'staff'
    | 'attendance'
    | 'profile'
    | 'settings'
    | 'warehouse_operations'
    | 'help';
}

/** A titled card of More menu rows. */
export interface OptionGroup {
  id: string;
  title: string;
  items: MoreOptionItem[];
}

export type {
  PermissionCheck,
  WarehouseNavigate,
  WarehouseScope,
  WarehouseScreenBaseProps,
  WarehouseTab,
} from '../finance-expenses/types';

/**
 * Screens of HomeFlow (the Home-tab screens the shells used to stitch with
 * show* flags or sub-view keys). Quick Actions and Stock & Transfer are
 * Main-only (`warehouse.all.view`).
 */
export type HomeRoute = 'QuickActions' | 'StockAndTransfer';

/**
 * Screens HomeFlow does not own; the host opens them (shell sub-view, tab or
 * App key). Each one keeps its own gate there.
 */
export type HomeTarget =
  | 'TransferList'
  | 'InitiateTransfer'
  | 'ReceivingDashboard'
  | 'WarehouseOverview'
  | 'Inventory'
  | 'LowStock'
  | 'CreateSwa'
  | 'Reports'
  | 'WarehouseTargets'
  | 'Escalations';

/** Params a HomeFlow route can carry. */
export interface HomeRouteParams {
  /** Reserved for routes that open on one record. */
  id?: string | undefined;
}
