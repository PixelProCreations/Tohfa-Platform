/**
 * Mock Home-tab data until the API carries it. Rows are keyed by the seeded
 * warehouse ids (seed 001_reference.sql) so a Sub scope sees only its own
 * rows and Main sees all; warehouse names come from WALLET_WAREHOUSES, never
 * from a screen. No endpoint in docs/openapi.yaml serves these lists yet.
 */
import { HOME_CODES } from './HomeParts';
import type { AttentionItem, TaskRecord, WarehouseTodayCounts } from './types';

/**
 * Warehouse tasks (was INITIAL_TASKS in SubWarehouseTaskActionCenterScreen plus
 * the QC task written into SubWarehouseTaskDetailScreen). Sub sees only its
 * own warehouse's tasks.
 */
export const TASKS: readonly TaskRecord[] = [
  {
    id: 'TSK-001',
    warehouseId: 'WH-COON',
    referenceId: 'GR-00245',
    title: 'QC Follow-up',
    description: 'Review receiving exception for GR-00245.',
    dueTime: 'Due Today · 12:30 PM',
    dueToday: true,
    dueDate: '25 Sep 2026 · 12:30 PM',
    priority: 'HIGH',
    status: 'Pending',
    type: 'Goods Receipt',
    assignedTo: 'Ramesh Kumar',
    mine: true,
    createdOn: '24 Sep 2026 · 10:15 AM',
    opens: 'TaskDetail',
  },
  {
    id: 'TSK-002',
    warehouseId: 'WH-COON',
    referenceId: 'ORD-10284',
    title: 'Pickup Order',
    description: 'Prepare order for customer pickup.',
    dueTime: 'Due Today · 02:00 PM',
    dueToday: true,
    dueDate: '25 Sep 2026 · 02:00 PM',
    priority: 'MEDIUM',
    status: 'Pending',
    type: 'Customer Order',
    assignedTo: 'Suresh',
    mine: false,
    createdOn: '25 Sep 2026 · 08:40 AM',
    opens: 'OrderDetail',
  },
];

/**
 * Today's counts per seeded warehouse for the single-warehouse snapshot (was
 * 8 receipts / 24 orders / 7 pending written into SubWarehouseOverviewScreen
 * for Coonoor). Stock comes from warehouse-admin WAREHOUSE_ADMIN_ROWS.
 */
export const WAREHOUSE_TODAY_COUNTS: Readonly<Record<string, WarehouseTodayCounts>> = {
  'WH-OOTY': { receipts: 11, ordersToday: 31, pendingFulfilment: 9 },
  'WH-COON': { receipts: 8, ordersToday: 24, pendingFulfilment: 7 },
  'WH-KOTA': { receipts: 5, ordersToday: 15, pendingFulfilment: 4 },
  'WH-GUDA': { receipts: 6, ordersToday: 18, pendingFulfilment: 5 },
};

/**
 * Sales & order resolution queue for the shared NeedsAttentionScreen (seeded
 * from the deleted Sub-only Needs Attention screen's rows, all Coonoor; both
 * shells now open it through HomeFlow). 'Approve & Issue Invoice'
 * needs invoice.generate; 'Edit Tax Details' needs invoice.gst.generate, which
 * no warehouse role holds, so it is hidden for both shells.
 */
export const NEEDS_ATTENTION_ITEMS: readonly AttentionItem[] = [
  {
    id: 'SALE-00248',
    warehouseId: 'WH-COON',
    category: 'payment_pending',
    title: 'Payment Pending',
    customer: 'Suresh Kumar · 3 Items',
    channel: 'Direct Sale',
    amount: '₹1,200',
    time: 'Today · 4:15 PM',
    note: 'Customer took items; cashier awaiting cash collection / UPI confirmation.',
    primaryAction: { label: 'Collect Cash' },
    secondaryAction: { label: 'Send UPI Link' },
  },
  {
    id: 'SALE-00249',
    warehouseId: 'WH-COON',
    category: 'payment_pending',
    title: 'Payment Pending',
    customer: 'Hotel Nilgiri Grand · 12 Crates',
    channel: 'HORECA Sale',
    amount: '₹3,400',
    time: 'Today · 10:30 AM',
    note: 'Produce delivered to kitchen; credit invoice awaiting signoff.',
    primaryAction: { label: 'Record Bank Transfer' },
    secondaryAction: { label: 'Send Reminder' },
  },
  {
    id: 'SALE-00250',
    warehouseId: 'WH-COON',
    category: 'stock_issue',
    title: 'Stock Discrepancy',
    customer: 'Green Mart · 50 kg Carrot',
    channel: 'Market Day Sale',
    amount: '₹2,100',
    time: 'Today · 1:45 PM',
    note: 'Batch #CRT-104 is short by 10 kg due to sorting spoilage in sorting area.',
    primaryAction: { label: 'Reallocate from Batch #CRT-105' },
    secondaryAction: { label: 'Adjust Qty to 40 kg' },
  },
  {
    id: 'SALE-00245',
    warehouseId: 'WH-COON',
    category: 'failed_sale',
    title: 'Payment Failed',
    customer: 'Ramesh G · 1 Item',
    channel: 'Direct Sale',
    amount: '₹850',
    time: 'Today · 11:15 AM',
    note: 'UPI gateway timed out after customer QR scan at checkout terminal.',
    primaryAction: { label: 'Retry Payment' },
    secondaryAction: { label: 'Switch to Cash' },
  },
  {
    id: 'INV-2026-089',
    warehouseId: 'WH-COON',
    category: 'invoice_issue',
    title: 'Invoice Review Needed',
    customer: 'Nilgiri Organic Spices Co.',
    channel: 'B2B Sale',
    amount: '₹4,800',
    time: 'Today · 9:00 AM',
    note: 'GSTIN validation mismatch on buyer profile. Reverse charge check required.',
    primaryAction: { label: 'Approve & Issue Invoice', code: HOME_CODES.invoiceGenerate },
    secondaryAction: { label: 'Edit Tax Details', code: HOME_CODES.gstGenerate, hideWithoutCode: true },
  },
];
