/**
 * Shared types for the warehouse notifications & alerts screens (design module
 * M13, plus the M1-S06 notification detail reached from the dashboard bell).
 *
 * Six screens used to describe one notification three ways: the props-driven
 * WarehouseNotificationsScreen (`WarehouseNotification`: shipment / quality /
 * mismatch / inventory / success), the rewritten Sub list (`NotificationItem`:
 * quality / order / inventory / wallet / returns / system, with an action
 * label) and the Main list + detail (`NotificationType`: goods / wallet /
 * order / stock). System Messages and Message History had the same row shape
 * again (`SystemMessageItem`, `HistoryMessageItem`). They are one item with one
 * category union now; messages are the 'system' and 'message' categories, not
 * separate screens.
 *
 * As in the other warehouse areas, the role difference is carried by `scope`
 * (warehouseId undefined = all warehouses, the Main view) and `can` (a
 * docs/rbac.json code check that only decides what to render; the server
 * enforces every action again, CLAUDE.md 2.1). A notification list is the
 * signed-in admin's OWN notifications (notification.own.*), so it has no
 * warehouse selector; the approval / exception alerts are warehouse records
 * and do (Main only).
 */
import type { AdminTone } from '../../../theme';

export type {
  PermissionCheck,
  WarehouseNavigate,
  WarehouseScope,
  WarehouseScreenBaseProps,
  WarehouseTab,
} from '../finance-expenses/types';

/**
 * What a notification is about. The union of the three legacy unions:
 *   shipment  expected / arriving shipment            (WH 'shipment')
 *   received  goods receipt completed                 (WH 'success', Main 'goods')
 *   quality   QC pending / flagged                    (WH + Sub 'quality')
 *   mismatch  receiving discrepancy / handling record (WH 'mismatch')
 *   inventory low stock                               (WH + Sub 'inventory', Main 'stock')
 *   order     order to pack / confirmed               (Sub + Main 'order')
 *   wallet    wallet credited / cash top-up           (Sub + Main 'wallet')
 *   returns   return request                          (Sub 'returns')
 *   system    maintenance / system update             (Sub 'system', System Messages)
 *   message   process / transfer / policy notice      (Message History)
 */
export type NotificationCategory =
  | 'shipment'
  | 'received'
  | 'quality'
  | 'mismatch'
  | 'inventory'
  | 'order'
  | 'wallet'
  | 'returns'
  | 'system'
  | 'message';

/**
 * Where a notification's action button leads (the Sub list's 'Review' / 'View
 * Stock' / 'View Order' / 'View Wallet' / 'View Return' CTAs and the detail's
 * 'View Receiving' / 'View Wallet Report'). Each target lives outside this
 * module, so the flow hands it to the host (`onOpenTarget`); it is offered
 * only when the target screen's own rbac code passes (canOpenTarget).
 */
export type NotificationTarget = 'ReviewReceiving' | 'Receiving' | 'Stock' | 'Orders' | 'Wallet' | 'Returns';

/** Status pair a notification tag pill is drawn in (the admin theme's tones). */
export type NotificationTagTone = AdminTone;

/** One notification of the signed-in admin. */
export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  /** Display time, e.g. '10m ago' or '25 Sep 2026 · 08:00 PM'. */
  timestamp: string;
  isRead: boolean;
  /**
   * Status tag pill under the message ('Awaiting QC', 'To Pack', 'Low Stock').
   * Absent = the category's default tag (NotificationParts tagOf).
   */
  tag?: string | undefined;
  /** Tone of the tag pill; absent = the category's tone (CATEGORY_TONE). */
  tagTone?: NotificationTagTone | undefined;
  /** Record the notification refers to (GR-1024, ORD-10245, TOP-002845). */
  reference?: string | undefined;
  /** Date shown on the detail screen (Main detail design). */
  date?: string | undefined;
  /** Action button target; none for plain messages. */
  target?: NotificationTarget | undefined;
}

/** Filter tabs of the notifications list (category groups plus Unread). */
export type NotificationFilter =
  | 'All'
  | 'Unread'
  | 'Receiving'
  | 'Quality'
  | 'Orders'
  | 'Inventory'
  | 'Finance'
  | 'Returns'
  | 'System'
  | 'Messages';

/** Where an approval / exception alert's "Open record" link leads (outside this module). */
export type AlertRecordTarget = 'ExpenseRecord' | 'GoodsReceipt' | 'LowStock' | 'Transfer';

/**
 * One approval / exception alert (M13-S03). The Sub screen's AlertItem and the
 * Main Alerts & Action Center's inline rows, folded together. Rows carry a
 * warehouse so a Sub scope sees only its own and Main can pick one.
 */
export interface ApprovalAlertItem {
  id: string;
  kind: 'approval' | 'exception';
  title: string;
  reference: string;
  /** Detail line ('Expected 500 kg · Received 460 kg · Status Open'). */
  detail: string;
  timestamp: string;
  critical: boolean;
  isRead: boolean;
  status: 'open' | 'resolved';
  warehouseId?: string | undefined;
  warehouseName?: string | undefined;
  /** Related record; absent = nothing to open (e.g. an escalation note). */
  record?: AlertRecordTarget | undefined;
}

/** Routes of NotificationsFlow. The old App.tsx keys map onto these (NOTIFICATIONS_ROUTE_ENTRY). */
export type NotificationsRoute = 'Notifications' | 'NotificationDetail' | 'ApprovalAlerts';

/** Params a NotificationsFlow route can carry. */
export interface NotificationsRouteParams {
  /** The notification a detail screen shows. */
  notification?: NotificationItem | undefined;
  /** Filter tab the list opens on (System Messages / Message History keys open 'System' / 'Messages'). */
  filter?: NotificationFilter | undefined;
}
