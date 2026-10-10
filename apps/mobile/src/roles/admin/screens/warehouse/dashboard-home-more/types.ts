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

/** Categories of the sales & order resolution queue. */
export type AttentionCategory = 'payment_pending' | 'stock_issue' | 'failed_sale' | 'invoice_issue';

/** One resolution action on a queue card. */
export interface AttentionAction {
  label: string;
  /** rbac code the action needs; undefined = no code governs it (SPEC_GAPS W4z-1). */
  code?: string | undefined;
  /** Hide the action without the code instead of drawing it disabled. */
  hideWithoutCode?: boolean | undefined;
}

/** One sales / order issue awaiting resolution (mock; no endpoint yet). */
export interface AttentionItem {
  id: string;
  warehouseId: string;
  category: AttentionCategory;
  title: string;
  customer: string;
  channel: string;
  amount: string;
  time: string;
  note: string;
  primaryAction: AttentionAction;
  secondaryAction?: AttentionAction | undefined;
  resolved?: boolean | undefined;
}

/**
 * Screens of HomeFlow (the Home-tab screens the shells used to stitch with
 * show* flags or sub-view keys). Quick Actions and Stock & Transfer are
 * Main-only (`warehouse.all.view`).
 */
export type HomeRoute = 'QuickActions' | 'StockAndTransfer' | 'NeedsAttention';

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
  /** Record a route opens on (a task id). */
  id?: string | undefined;
  /** Needs Attention filter the Sales hub card opened (default 'all'). */
  category?: AttentionFilter | undefined;
}

/** Needs Attention filter chip: every category, or one. */
export type AttentionFilter = 'all' | AttentionCategory;
