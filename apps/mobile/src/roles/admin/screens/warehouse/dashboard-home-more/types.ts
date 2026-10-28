/** Types for the shared warehouse More menu and Home screens. */
import type { AlertType } from '../../../api/alerts';
import type { TranslationKey } from '../../../i18n';

/** One row of the More menu. `id` is also the key the permission gate in MoreScreen looks up. */
export interface MoreOptionItem {
  id: string;
  titleKey: TranslationKey;
  subtitleKey: TranslationKey;
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
    | 'warehouse_management'
    | 'help';
}

/** A titled card of More menu rows. */
export interface OptionGroup {
  id: string;
  titleKey: TranslationKey;
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
 * Sales-hub Needs Attention categories the Sales screens still pass. Only
 * 'stock_issue' has an alert source (LOW_STOCK); the others have no endpoint,
 * so NeedsAttentionScreen opens on every alert for them
 * (mappers_dashboardHome.alertFilterFromCategory).
 */
export type AttentionCategory = 'payment_pending' | 'stock_issue' | 'failed_sale' | 'invoice_issue';

/**
 * Screens of HomeFlow (the Home-tab screens the shells used to stitch with
 * show* flags or sub-view keys). Quick Actions and Stock & Transfer are
 * Main-only (`warehouse.all.view`).
 */
export type HomeRoute =
  | 'QuickActions'
  | 'StockAndTransfer'
  | 'NeedsAttention'
  | 'WarehouseSnapshot'
  | 'TaskActionCenter'
  | 'TaskDetail';

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
  | 'Escalations'
  | 'Orders'
  | 'OrderDetail'
  | 'Operations';

/** Params a HomeFlow route can carry. */
export interface HomeRouteParams {
  /** Record a route opens on (a task itemKey). */
  id?: string | undefined;
  /** Needs Attention filter the Sales hub card opened (default 'all'). */
  category?: AttentionFilter | undefined;
}

/** What a host may open Needs Attention on: every alert, one alert type, or an old sales category. */
export type AttentionFilter = 'all' | AttentionCategory | AlertType;
