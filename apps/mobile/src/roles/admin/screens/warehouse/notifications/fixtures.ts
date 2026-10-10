/**
 * Mock notification and alert rows for the warehouse notifications area.
 *
 * No notification or alert endpoint is wired on the device yet (SPEC_GAPS
 * W4k-1), so these stand in for GET /notifications (own) and the warehouse
 * alert queue. They are the rows of the absorbed screens, deduplicated: the
 * Sub list's six items, the Sub shell's four receiving notifications, the two
 * System Messages and the three Message History notices (Sub view), and the
 * Main shell's / Main list's rows (Main view). Warehouse names live in the
 * data, never in a screen.
 */
import { WALLET_WAREHOUSES, warehouseNameOf } from '../wallet-cashtopup/fixtures';
import type { ApprovalAlertItem, NotificationItem, WarehouseScope } from './types';

/** Warehouses for the Main alerts selector (seed 001, shared with the wallet / finance areas). */
export const NOTIFICATION_WAREHOUSES: readonly WarehouseScope[] = WALLET_WAREHOUSES;

/**
 * A Sub Warehouse admin's own notifications (receiving, orders, stock, wallet,
 * returns, messages). Ordered and read-state as in the original Sub design:
 * All (13), Unread (2), Receiving (1), Quality (2), Orders (1), ... Rows without
 * a `tag` show their category's default pill (NotificationParts DEFAULT_TAG).
 */
export const SUB_NOTIFICATIONS: readonly NotificationItem[] = [
  {
    id: 'n1',
    category: 'quality',
    title: 'GR-1024 Arrived — Pending QC',
    message: 'Tomato · Grade 1 (145 KG) arrived at intake bay. Inspection pending.',
    timestamp: '10m ago',
    isRead: false,
    tag: 'Awaiting QC',
    reference: 'GR-1024',
    date: '25 Sep 2026',
    target: 'ReviewReceiving',
  },
  {
    id: 'n2',
    category: 'order',
    title: 'New Order',
    message: 'Order #ORD-10245 requires packing.',
    timestamp: '5m ago',
    isRead: false,
    tag: 'To Pack',
    reference: 'ORD-10245',
    date: '25 Sep 2026',
    target: 'Orders',
  },
  {
    id: 'n3',
    category: 'shipment',
    title: 'New Expected Shipment Today',
    message: 'GR-1025: Carrot · Grade 1 (120 KG) scheduled for arrival from Main Warehouse.',
    timestamp: '35m ago',
    isRead: true,
    tag: 'Expected',
    reference: 'GR-1025',
    date: '25 Sep 2026',
    target: 'Receiving',
  },
  {
    id: 'n4',
    category: 'inventory',
    title: 'Low Stock Alert — Tomato Grade 1',
    message: 'Current inventory is 18 KG, falling below the safe threshold of 25 KG.',
    timestamp: '1h ago',
    isRead: true,
    tag: 'Low Stock',
    reference: 'Tomato Grade 1',
    date: '25 Sep 2026',
    target: 'Stock',
  },
  {
    id: 'n5',
    category: 'wallet',
    title: 'Cash Top-Up Completed',
    message: '₹2,000 credited to customer wallet.',
    timestamp: 'Today · 11:42 AM',
    isRead: true,
    tag: 'Wallet',
    reference: 'TOP-002845',
    date: '25 Sep 2026',
    target: 'Wallet',
  },
  {
    id: 'n6',
    category: 'mismatch',
    title: 'Handling Record Pending',
    message: '5 KG of damaged goods rejected on GR-1022 requires recorded disposal.',
    timestamp: '3h ago',
    isRead: true,
    tag: 'Handling Action',
    reference: 'GR-1022',
    date: '25 Sep 2026',
    target: 'Receiving',
  },
  {
    id: 'n7',
    category: 'returns',
    title: 'New Return Request',
    message: 'Customer reported damaged item on ORD-20260921-006.',
    timestamp: 'Yesterday, 2:30 PM',
    isRead: true,
    tag: 'Return',
    reference: 'ORD-20260921-006',
    date: '24 Sep 2026',
    target: 'Returns',
  },
  {
    id: 'MSG-01',
    category: 'system',
    title: 'System Maintenance',
    message: 'Scheduled system maintenance may temporarily affect warehouse operations.',
    timestamp: '25 Sep 2026 · 08:00 PM',
    isRead: true,
    date: '25 Sep 2026',
  },
  {
    id: 'MSG-02',
    category: 'system',
    title: 'System Update',
    message: 'A new TOHFA system update is available.',
    timestamp: '24 Sep 2026 · 09:15 AM',
    isRead: true,
    date: '24 Sep 2026',
  },
  {
    id: 'MSG-03',
    category: 'system',
    title: 'System Message',
    message: 'Warehouse capacity report available for review by MWA.',
    timestamp: '2 days ago',
    isRead: true,
    date: '23 Sep 2026',
  },
  {
    id: 'HIST-03',
    category: 'message',
    title: 'New Receiving Process',
    message: 'Updated receiving process guidelines are now available for all warehouse staff.',
    timestamp: '22 Sep 2026',
    isRead: true,
    date: '22 Sep 2026',
  },
  {
    id: 'HIST-04',
    category: 'message',
    title: 'Stock Transfer Notice',
    message: 'New stock transfer request #TR-00412 pending approval.',
    timestamp: '20 Sep 2026 · 02:30 PM',
    isRead: true,
    reference: 'TR-00412',
    date: '20 Sep 2026',
  },
  {
    id: 'HIST-05',
    category: 'message',
    title: 'Policy Update',
    message: 'Warehouse hygiene and pest management SOP revised.',
    timestamp: '18 Sep 2026',
    isRead: true,
    date: '18 Sep 2026',
  },
];

/** A Main Warehouse admin's own notifications (the Main shell list + MainWarehouseNotificationsScreen rows). */
export const MAIN_NOTIFICATIONS: readonly NotificationItem[] = [
  {
    id: 'm1',
    category: 'shipment',
    title: 'New Shipment Arrived',
    message: 'Truck KA-04-1234 arrived at Bay 2 with 500 crates.',
    timestamp: '10m ago',
    isRead: false,
    tag: 'Arrived',
    reference: 'SHP-2026-098',
    date: '25 Sep 2026',
    target: 'Receiving',
  },
  {
    id: 'm2',
    category: 'received',
    title: 'Goods Received',
    message: 'New goods receiving activity is available. Received: 420 kg.',
    timestamp: 'Today · 10:20 AM',
    isRead: false,
    reference: 'GR-00245',
    date: '25 Sep 2026',
    target: 'Receiving',
  },
  {
    id: 'm3',
    category: 'wallet',
    title: 'Wallet Credited',
    message: 'A customer wallet transaction has been completed. Amount: ₹500.',
    timestamp: 'Today · 09:45 AM',
    isRead: false,
    reference: 'TOP-002845',
    date: '25 Sep 2026',
    target: 'Wallet',
  },
  {
    id: 'm4',
    category: 'quality',
    title: 'Quality Alert',
    message: 'Batch B-104 tomato inspection flagged 8% damage.',
    timestamp: '45m ago',
    isRead: false,
    tag: 'QC Flagged',
    reference: 'B-104',
    date: '25 Sep 2026',
    target: 'ReviewReceiving',
  },
  {
    id: 'm5',
    category: 'order',
    title: 'Order Confirmed',
    message: 'Order #ORD-10284 has been confirmed.',
    timestamp: 'Today · 09:20 AM',
    isRead: true,
    reference: 'ORD-10284',
    date: '25 Sep 2026',
    target: 'Orders',
  },
  {
    id: 'm6',
    category: 'inventory',
    title: 'Low Stock Alert',
    message: 'Carrot Grade 1 has reached the configured threshold.',
    timestamp: 'Today · 08:50 AM',
    isRead: true,
    tag: 'Low Stock',
    reference: 'Carrot Grade 1',
    date: '25 Sep 2026',
    target: 'Stock',
  },
];

/** The default list for a scope when the host does not control it (Main = all warehouses). */
export function defaultNotifications(scope: WarehouseScope): readonly NotificationItem[] {
  return scope.warehouseId === undefined ? MAIN_NOTIFICATIONS : SUB_NOTIFICATIONS;
}

function at(warehouseId: string): { warehouseId: string; warehouseName: string } {
  return { warehouseId, warehouseName: warehouseNameOf(warehouseId) };
}

/**
 * Approval / exception alerts across the four warehouses: the Sub screen's two
 * (expense approval, quantity mismatch) and the Main Alerts & Action Center's
 * three (low stock, escalated issue, transfer variance).
 */
export const APPROVAL_ALERTS: readonly ApprovalAlertItem[] = [
  {
    id: 'EXP-001245',
    kind: 'approval',
    title: 'Approval Required — Expense / Operational Record',
    reference: 'Reference EXP-001245',
    detail: 'Action Required: Review',
    timestamp: 'Today · 11:20 AM',
    critical: false,
    isRead: false,
    status: 'open',
    ...at('WH-COON'),
    record: 'ExpenseRecord',
  },
  {
    id: 'GR-00245',
    kind: 'exception',
    title: 'Quantity Mismatch',
    reference: 'GR-00245',
    detail: 'Expected 500 kg · Received 460 kg · Status Open',
    timestamp: '25 Sep · 10:42 AM',
    critical: true,
    isRead: false,
    status: 'open',
    ...at('WH-COON'),
    record: 'GoodsReceipt',
  },
  {
    id: 'ALR-LOWSTOCK-COON',
    kind: 'exception',
    title: 'Stock below target',
    reference: 'Low-stock alert',
    detail: 'Carrot Grade 1 below the configured threshold',
    timestamp: 'Today, 08:20 AM',
    critical: true,
    isRead: false,
    status: 'open',
    ...at('WH-COON'),
    record: 'LowStock',
  },
  {
    id: 'ALR-ESC-OOTY',
    kind: 'exception',
    title: 'SWA issue escalated',
    reference: 'Warehouse-level dispute',
    detail: 'Escalated by the Sub Warehouse admin for review',
    timestamp: 'Today, 07:50 AM',
    critical: false,
    isRead: true,
    status: 'open',
    ...at('WH-OOTY'),
  },
  {
    id: 'TRF-00284',
    kind: 'approval',
    title: 'Follow up: Transfer TRF-00284 variance',
    reference: 'TRF-00284',
    detail: 'Assigned action · Due today',
    timestamp: 'Today',
    critical: false,
    isRead: true,
    status: 'resolved',
    ...at('WH-OOTY'),
    record: 'Transfer',
  },
];
