/**
 * Mock data for the storage-ops screens until material / storage-location /
 * capacity endpoints exist (none in docs/openapi.yaml today). Rows carry the
 * seeded warehouse ids (seed 001_reference.sql) so a Sub scope filters to its
 * own warehouse while the Main scope sees all four; warehouse names are looked
 * up from STORAGE_WAREHOUSES, never written into a screen.
 *
 * Storage locations themselves come from profile-settings STORAGE_LOCATIONS
 * (the Storage Information list opens these detail screens), so both screens
 * describe the same locations.
 */
import { STORAGE_LOCATIONS } from '../profile-settings/warehouseFixtures';
import { WALLET_WAREHOUSES, warehouseNameOf } from '../wallet-cashtopup/fixtures';
import type {
  ActivityItem,
  AttentionItem,
  IssueSeverity,
  LocationLayout,
  LocationStockItem,
  MaterialDaySummary,
  MaterialHistoryEntry,
  MaterialItem,
  MaterialOption,
  OperationalIssue,
  OperationsSummary,
  PerformanceKpi,
  ReportIssueMode,
  StorageLocationItem,
  TodayMetrics,
  TopPerformer,
  WarehousePerformanceRow,
  WarehouseScope,
} from './types';

/** The four warehouses (seed 001). */
export const STORAGE_WAREHOUSES: readonly WarehouseScope[] = WALLET_WAREHOUSES;

/** Display name of a warehouse id (falls back to the id). */
export const storageWarehouseName = warehouseNameOf;

export { STORAGE_LOCATIONS };

export const MATERIALS: readonly MaterialItem[] = [
  { id: 'MAT-0021', name: 'Packaging Box', code: 'MAT-0021', category: 'Packaging', unit: 'Units', warehouseId: 'WH-COON', storageLocation: 'Material Storage Area', current: 120, reserved: 20, status: 'Available', lastUpdated: 'Today, 10:30 AM' },
  { id: 'MAT-0034', name: 'Crates', code: 'MAT-0034', category: 'Storage Containers', unit: 'Units', warehouseId: 'WH-COON', storageLocation: 'Material Storage Area', current: 8, reserved: 0, status: 'Low Stock', lastUpdated: 'Today, 9:15 AM' },
  { id: 'MAT-0041', name: 'Labels', code: 'MAT-0041', category: 'Packaging', unit: 'Units', warehouseId: 'WH-COON', storageLocation: 'Material Storage Area', current: 340, reserved: 40, status: 'Available', lastUpdated: 'Yesterday' },
  { id: 'MAT-0105', name: 'Packaging Box', code: 'MAT-0105', category: 'Packaging', unit: 'Units', warehouseId: 'WH-OOTY', storageLocation: 'Dry Storage B', current: 260, reserved: 30, status: 'Available', lastUpdated: 'Today, 8:40 AM' },
  { id: 'MAT-0112', name: 'Pallets', code: 'MAT-0112', category: 'Handling Equipment', unit: 'Units', warehouseId: 'WH-OOTY', storageLocation: 'Dry Storage B', current: 0, reserved: 0, status: 'Out of Stock', lastUpdated: 'Yesterday' },
  { id: 'MAT-0207', name: 'Sealing Tape', code: 'MAT-0207', category: 'Consumables', unit: 'Rolls', warehouseId: 'WH-KOTA', storageLocation: 'Dry Storage B', current: 6, reserved: 2, status: 'Low Stock', lastUpdated: 'Today, 11:05 AM' },
  { id: 'MAT-0301', name: 'Crates', code: 'MAT-0301', category: 'Storage Containers', unit: 'Units', warehouseId: 'WH-GUDA', storageLocation: 'Dry Storage A', current: 75, reserved: 10, status: 'Available', lastUpdated: 'Today, 7:50 AM' },
];

export const MATERIAL_HISTORY: readonly MaterialHistoryEntry[] = [
  { id: 'mh-1', materialId: 'MAT-0021', kind: 'Issued', quantity: 20, detail: 'Reason: Order Fulfillment', by: 'Suresh · SWA', at: '24 Sep, 09:50 AM' },
  { id: 'mh-2', materialId: 'MAT-0021', kind: 'Received', quantity: 50, detail: 'From Main Warehouse', by: 'Suresh · SWA', at: '22 Sep, 11:10 AM' },
  { id: 'mh-3', materialId: 'MAT-0034', kind: 'Issued', quantity: 12, detail: 'Reason: Dispatch Packing', by: 'Suresh · SWA', at: '24 Sep, 08:30 AM' },
  { id: 'mh-4', materialId: 'MAT-0105', kind: 'Received', quantity: 100, detail: 'From Supplier', by: 'Ravi · SWA', at: '23 Sep, 04:15 PM' },
];

/** Today's issued / received counts per warehouse (demo). */
export const MATERIAL_DAY_SUMMARY: readonly MaterialDaySummary[] = [
  { warehouseId: 'WH-COON', issuedToday: 18, receivedToday: 12 },
  { warehouseId: 'WH-OOTY', issuedToday: 24, receivedToday: 30 },
  { warehouseId: 'WH-KOTA', issuedToday: 6, receivedToday: 4 },
  { warehouseId: 'WH-GUDA', issuedToday: 9, receivedToday: 5 },
];

export const MATERIAL_OPTIONS: readonly MaterialOption[] = [
  { name: 'Packaging Box', category: 'Packaging' },
  { name: 'Crates', category: 'Storage Containers' },
  { name: 'Labels', category: 'Packaging' },
  { name: 'Pallets', category: 'Handling Equipment' },
  { name: 'Sealing Tape', category: 'Consumables' },
];

/** Product lots per storage location (Location Usage / Stored Stock). */
export const LOCATION_STOCK: readonly LocationStockItem[] = [
  { id: 'ls-1', locationId: 'CS-A01', product: 'Carrot', quantityKg: 420 },
  { id: 'ls-2', locationId: 'CS-A01', product: 'Cabbage', quantityKg: 320 },
  { id: 'ls-3', locationId: 'CS-A01', product: 'Beans', quantityKg: 210 },
  { id: 'ls-4', locationId: 'DS-B01', product: 'Potato', quantityKg: 900 },
  { id: 'ls-5', locationId: 'CS-C01', product: 'Tomato G1', quantityKg: 140 },
  { id: 'ls-6', locationId: 'CS-C01', product: 'Carrot G1', quantityKg: 80 },
  { id: 'ls-7', locationId: 'OCS-A01', product: 'Tomato G1', quantityKg: 640 },
  { id: 'ls-8', locationId: 'KCS-A01', product: 'Beans', quantityKg: 300 },
  { id: 'ls-9', locationId: 'GDS-A01', product: 'Onion', quantityKg: 700 },
];

/** Section / rack / shelf of the locations that have one (Main's Location Information card). */
export const LOCATION_LAYOUT: readonly LocationLayout[] = [
  { locationId: 'CS-A01', section: 'A', rackShelf: '02 / 03' },
  { locationId: 'DS-B01', section: 'B', rackShelf: '01 / 02' },
  { locationId: 'CS-C01', section: 'C', rackShelf: '01 / 01' },
  { locationId: 'OCS-A01', section: 'A', rackShelf: '01 / 02' },
];

/**
 * Occupancy share at which a location shows the "nearing its configured
 * capacity" alert, per warehouse. Demo data standing in for the warehouse
 * record, not a screen constant: no system_config key or endpoint exists for it
 * (SPEC_GAPS W4u-3). A warehouse without an entry shows no alert.
 */
const CAPACITY_ALERT_PERCENT: Readonly<Record<string, number>> = {
  'WH-COON': 80,
  'WH-OOTY': 90,
  'WH-KOTA': 90,
  'WH-GUDA': 85,
};

export function capacityAlertPercentOf(warehouseId: string): number | undefined {
  return CAPACITY_ALERT_PERCENT[warehouseId];
}

/** Locations visible to a scope (Main: all, or the selected warehouse; Sub: its own). */
export function locationsInScope(
  scope: WarehouseScope,
  selectedWarehouseId?: string | undefined,
  locations: readonly StorageLocationItem[] = STORAGE_LOCATIONS,
): StorageLocationItem[] {
  const warehouseId = scope.warehouseId ?? selectedWarehouseId;
  return locations.filter((l) => warehouseId === undefined || l.warehouseId === warehouseId);
}

export const PERFORMANCE_KPIS: readonly PerformanceKpi[] = [
  { id: 'sla', label: 'DISPATCH SLA', value: '98.6%', badge: '↑ 1.4%', badgeTone: 'success', sub: 'Target: 95.0% on-time' },
  { id: 'putaway', label: 'AVG PUTAWAY', value: '38 min', badge: '↓ 6 min', badgeTone: 'success', sub: 'Target: < 45 mins' },
  { id: 'accuracy', label: 'ACCURACY', value: '99.4%', badge: 'Active', badgeTone: 'brandSoft', sub: '2 discrepancies / 340' },
  { id: 'efficiency', label: 'EFFICIENCY', value: '82%', badge: 'Optimal', badgeTone: 'brandSoft', sub: '14,200 kg active stock' },
];

export const WAREHOUSE_PERFORMANCE: readonly WarehousePerformanceRow[] = [
  { warehouseId: 'WH-KOTA', slaRate: '99.2%', inbound: '1,420 kg', outbound: '1,280 kg', openIssues: 0, utilizationPercent: 82, tone: 'success' },
  { warehouseId: 'WH-OOTY', slaRate: '97.8%', inbound: '980 kg', outbound: '940 kg', openIssues: 1, utilizationPercent: 75, tone: 'warning' },
  { warehouseId: 'WH-COON', slaRate: '98.5%', inbound: '1,120 kg', outbound: '1,090 kg', openIssues: 0, utilizationPercent: 88, tone: 'success' },
];

export const TOP_PERFORMERS: readonly TopPerformer[] = [
  { id: 'tp-1', name: 'Manoj Kumar', role: 'SWA Lead', warehouseId: 'WH-KOTA', taskCount: '24 Receipts Verified', score: '99.8%' },
  { id: 'tp-2', name: 'Arun P', role: 'SWA Dispatch', warehouseId: 'WH-OOTY', taskCount: '86 Orders Packed', score: '99.2%' },
  { id: 'tp-3', name: 'Priya S', role: 'SWA Inventory', warehouseId: 'WH-COON', taskCount: '32 Rack Transfers', score: '98.9%' },
];

/** The demo batch Storage Location Assignment opens on when the host passes none. */
export const DEMO_ASSIGNMENT_BATCH = { batchId: 'BAT-00512', productName: 'Tomato · Grade 2', quantity: '445 KG' } as const;

// ─── Part B: operational issues and the report-issue form ────────────────────

/** Operational issues (no issue endpoint in docs/openapi.yaml; SPEC_GAPS W4v-1). */
export const OPERATIONAL_ISSUES: readonly OperationalIssue[] = [
  { id: 'ISS-0029', warehouseId: 'WH-COON', title: 'Quality / Quantity issue reported', type: 'Order Fulfillment', area: 'Orders Fulfillment · ORD-1018', location: 'Packing Station 1', status: 'Open', severity: 'Medium', description: 'Customer order ORD-1018 packed short by 2 KG of Tomato Grade 1; recount requested before dispatch.', reportedBy: 'Suresh · SWA', reportedDate: 'Today', reportedAt: 'Today · Just now', evidenceCount: 1 },
  { id: 'ISS-0028', warehouseId: 'WH-COON', title: 'Cold storage maintenance required', type: 'Maintenance Required', area: 'Cold Storage · Section A', location: 'Cold Storage · Section A · Rack A-03', status: 'Open', severity: 'High', description: 'Cooling unit in Section A running above target temperature; needs technician inspection before more stock is stored there.', reportedBy: 'Suresh · SWA', reportedDate: '24 Sep 2026', reportedAt: '24 Sep · 11:20 AM', evidenceCount: 2 },
  { id: 'ISS-0027', warehouseId: 'WH-COON', title: 'Weighing scale calibration drift', type: 'Equipment / Facility', area: 'Receiving Bay 2', location: 'Receiving Bay 2', status: 'In Progress', severity: 'Medium', description: 'Bay 2 scale reads 0.4 KG heavy against the test weight; technician booked.', reportedBy: 'Suresh · SWA', reportedDate: '23 Sep 2026', reportedAt: '23 Sep · 04:10 PM', evidenceCount: 1 },
  { id: 'ISS-0025', warehouseId: 'WH-COON', title: 'Crate shortage at dispatch', type: 'Packaging / Material', area: 'Dispatch Area', location: 'Dispatch Area', status: 'Resolved', severity: 'Low', description: 'Ran out of crates for the evening dispatch; 40 crates transferred from Main Warehouse.', reportedBy: 'Suresh · SWA', reportedDate: '20 Sep 2026', reportedAt: '20 Sep · 06:05 PM', resolvedBy: 'Ravi · SWA', resolvedAt: '21 Sep · 09:30 AM', evidenceCount: 0 },
  { id: 'ISS-0031', warehouseId: 'WH-OOTY', title: 'Dock door sensor fault', type: 'Equipment / Facility', area: 'Loading Dock 1', location: 'Loading Dock 1', status: 'In Progress', severity: 'Medium', description: 'Dock 1 door does not register closed; manual lock in use until the sensor is replaced.', reportedBy: 'Arun · SWA', reportedDate: '25 Sep 2026', reportedAt: '25 Sep · 08:45 AM', evidenceCount: 1 },
  { id: 'ISS-0030', warehouseId: 'WH-KOTA', title: 'Stock count variance in dry storage', type: 'Stock Discrepancy', area: 'Dry Storage A', location: 'Dry Storage A · Rack 04', status: 'Open', severity: 'High', description: 'Beans count 12 KG below system balance after the morning cycle count.', reportedBy: 'Manoj · SWA', reportedDate: '25 Sep 2026', reportedAt: '25 Sep · 10:15 AM', evidenceCount: 0 },
];

/** Help & Support request categories (support mode). */
export const SUPPORT_CATEGORIES: readonly string[] = [
  'Getting Started',
  'Warehouse Operations',
  'Orders',
  'Inventory',
  'Billing',
  'Wallet',
  'Reports',
  'Account & Security',
  'Other',
];

/** The specific issues offered for each support category. */
export const SUPPORT_SPECIFIC_ISSUES: Readonly<Record<string, readonly string[]>> = {
  'Getting Started': ['App Navigation & Walkthrough Help', 'Warehouse Role & Permissions Setup', 'Warehouse Facility Assignment Error', 'Initial Barcode Scanner Pairing', 'Other Getting Started Issue'],
  'Warehouse Operations': ['Staff Shift & Attendance Logging Issue', 'Expense Entry / Receipt Upload Failure', 'Weighing Scale / Scanner Malfunction', 'Crate & Staging Bay Capacity Full', 'Cold Storage Temperature Alert', 'Facility Maintenance Request', 'Other Operations Issue'],
  Orders: ['Order Dispatch Delay', 'Barcode Mismatch on Order Crates', 'Customer Cancelled Order Handover', 'Damaged Goods in Order Packing', 'Wrong Product Items in Dispatch Batch', 'Customer Pickup Verification Issue', 'Other Order Issue'],
  Inventory: ['Physical Stock Count Discrepancy', 'Damaged / Spoilt Produce Inbound Batch', 'Produce Weight / Moisture Grade Discrepancy', 'Bin Tag Barcode Printing Failure', 'Storage Zone Capacity Exceeded', 'Stock Reconciliation Error', 'Other Inventory Issue'],
  Billing: ['Unable to Generate GST Invoice', 'Incorrect Tax / HSN Rate Calculation', 'Credit Note Issuance Failure', 'Thermal Receipt Printer Connection Error', 'Customer Invoice PDF Download Issue', 'Other Billing Issue'],
  Wallet: ['Customer Cash Top-Up Confirmation Pending', 'Wallet Balance Deduction Discrepancy', 'Customer Refund Request Failed', 'Daily Cash Summary Ledger Mismatch', 'Customer Wallet PIN Reset Assistance', 'Other Wallet Issue'],
  Reports: ['Sales Report Excel Export Failure', 'Produce Shrinkage / Wastage Data Inaccurate', 'Financial Expense Ledger Missing Entries', 'Daily Shift Audit Summary Discrepancy', 'Other Reports Issue'],
  'Account & Security': ['Password Reset / Change Failure', 'Suspicious Login Session Detected', 'Device Authorization / Auto-Logout Error', 'Biometric / PIN Verification Failure', 'Other Security Concern'],
  Other: ['App Performance / Lag Issue', 'Network Offline Sync Delay', 'Feature Suggestion', 'General Inquiry'],
};

/** Reference-id placeholder per support category. */
export const SUPPORT_REFERENCE_HINT: Readonly<Record<string, string>> = {
  Orders: 'e.g. ORD-2026-00452',
  Inventory: 'e.g. BATCH-2026-0891',
  Billing: 'e.g. INV-GST-2026-0012',
  Wallet: 'e.g. WAL-TOP-9921',
  'Warehouse Operations': 'e.g. EXP-2026-0041',
};

/** Operational issue categories (absorbed Main Report Operational Issue form). */
export const OPERATIONAL_ISSUE_CATEGORIES: readonly string[] = [
  'Storage / Space',
  'Temperature / Cooling',
  'Equipment / Facility',
  'Packaging / Material',
  'Stock Discrepancy',
];

export const ISSUE_SEVERITIES: readonly IssueSeverity[] = ['Low', 'Medium', 'High', 'Critical'];

/** Demo ids the form "returns" until a support / issue endpoint exists. */
export const DEMO_SUBMITTED_ID: Readonly<Record<ReportIssueMode, string>> = {
  support: 'SUP-00246',
  operational: 'ISS-0032',
};

/** Mock attachment names offered by the form's attach dialog. */
export const DEMO_ATTACHMENTS = { document: 'receipt_inv_0048.png', photo: 'photo_damage_crate.jpg' } as const;

// ─── Part B: warehouse activity log ──────────────────────────────────────────

/**
 * Logged warehouse activities (no activity endpoint in docs/openapi.yaml;
 * SPEC_GAPS W4v-4). Merges the rows of the old Sub Warehouse Activity, Today's
 * Operations and Recent Activity screens with Main's Activity Timeline and
 * Operations History rows, each tagged with its warehouse.
 */
export const ACTIVITIES: readonly ActivityItem[] = [
  { id: 'ACT-004820', title: 'Goods Received', category: 'Receiving', module: 'receiving', warehouseId: 'WH-COON', subtitle: 'GRN-00291 · Tomato · Grade 1 · 140 KG', performedBy: 'Suresh · SWA', day: 'Today', when: 'Today · 10:42 AM', timeOfDay: 'morning', status: 'Completed', action: 'GRN-00291 received and verified · Tomato Grade 1 · 140 KG', reference: 'Related GRN GRN-00291', notes: 'Received in good condition from Main Warehouse (Ooty Hub).' },
  { id: 'ACT-004830', title: 'Stock Verification', category: 'Verification', module: 'verification', warehouseId: 'WH-COON', subtitle: 'Tomato · Grade 1 · cycle count', performedBy: 'Suresh · SWA', day: 'Today', when: 'Today · 10:25 AM', timeOfDay: 'morning', status: 'Completed', action: 'Cycle count of Tomato Grade 1 in Cold Storage', reference: 'Verification Log VER-2026-10', notes: 'Variance posted for review.', metrics: { system: '100 KG', counted: '95 KG', variance: '-5 KG' } },
  { id: 'ACT-004831', title: 'Order Packed', category: 'Orders', module: 'orders', warehouseId: 'WH-COON', subtitle: 'ORD-10242 · 3 items', performedBy: 'Suresh · SWA', day: 'Today', when: 'Today · 10:20 AM', timeOfDay: 'morning', status: 'Completed', action: 'Order ORD-10242 packed and staged for pickup', reference: 'Related Order ORD-10242', notes: 'Packed at station 2.' },
  { id: 'ACT-004832', title: 'Cash Top-Up', category: 'Cash', module: 'cash', warehouseId: 'WH-COON', subtitle: '₹2,000 · Customer CUS-1042', performedBy: 'Suresh · SWA', day: 'Today', when: 'Today · 09:55 AM', timeOfDay: 'morning', status: 'Completed', action: 'Cash top-up credited to customer wallet CUS-1042', reference: 'Wallet Top-Up WAL-TOP-9921', notes: 'Receipt printed at the counter.' },
  { id: 'ACT-004821', title: 'Material Handling', category: 'Material Handling', module: 'material_handling', warehouseId: 'WH-COON', subtitle: 'Packaging Box · Issued 20 units', performedBy: 'Suresh · SWA', day: 'Today', when: 'Today · 09:50 AM', timeOfDay: 'morning', status: 'Completed', action: 'Packaging boxes issued for order fulfillment · 20 units', reference: 'Related Order ORD-1018', notes: 'Issued to packing station 1.' },
  { id: 'ACT-004822', title: 'Storage location updated', category: 'Storage', module: 'storage', warehouseId: 'WH-COON', subtitle: 'Rack 02 · Cold Storage · Tomato moved', performedBy: 'Suresh · SWA', day: 'Today', when: 'Today · 09:35 AM', timeOfDay: 'morning', status: 'Completed', action: 'Tomato moved to Cold Storage · Rack 02, Shelf 03', reference: 'Related Batch BAT-COO-00241', notes: 'Relocated to make room for incoming Section B stock.' },
  { id: 'ACT-004833', title: 'QC Completed', category: 'QC', module: 'qc', warehouseId: 'WH-COON', subtitle: 'GR-00123 · Carrot, Grade 1 · Accepted in full', performedBy: 'Suresh · SWA', day: 'Today', when: 'Today · 09:20 AM', timeOfDay: 'morning', status: 'Completed', action: 'Quality check passed for GR-00123 · Carrot Grade 1', reference: 'Related GRN GR-00123', notes: 'Accepted in full.' },
  { id: 'ACT-004823', title: 'Stock Verification', category: 'Verification', module: 'verification', warehouseId: 'WH-COON', subtitle: 'Tomato · Grade 1 · Variance -5 KG detected', performedBy: 'Suresh · SWA', day: 'Today', when: 'Today · 08:20 AM', timeOfDay: 'morning', status: 'Pending', action: 'Physical stock verification conducted · Tomato Grade 1', reference: 'Variance Check VER-2026-09', notes: 'Variance of -5 KG detected during morning cycle count. System: 100 KG, Counted: 95 KG.' },
  { id: 'ACT-004824', title: 'Operational Issue', category: 'Issues', module: 'operational_issue', warehouseId: 'WH-COON', subtitle: 'Cold storage maintenance required', performedBy: 'Suresh · SWA', day: 'Today', when: 'Today · 08:05 AM', timeOfDay: 'morning', status: 'Open', action: 'Cold storage maintenance required in Section A', reference: 'Issue Ticket ISS-0028', notes: 'Cooling unit running above target temperature.' },
  { id: 'ACT-004819', title: 'Goods Received', category: 'Receiving', module: 'receiving', warehouseId: 'WH-COON', subtitle: 'GRN-00290 · Potato · Grade 2 · 220 KG', performedBy: 'Suresh · SWA', day: 'Today', when: 'Today · 07:45 AM', timeOfDay: 'morning', status: 'Completed', action: 'Direct grower shipment accepted and inspected', reference: 'Related GRN GRN-00290', notes: 'Unloaded at Bay 2.' },
  { id: 'ACT-004840', title: 'Goods Received', category: 'Receiving', module: 'receiving', warehouseId: 'WH-KOTA', subtitle: 'GR-04512 · Beans · 300 KG', performedBy: 'Manoj · SWA', day: 'Today', when: 'Today · 09:45 AM', timeOfDay: 'morning', status: 'Completed', action: 'Goods receipt GR-04512 recorded at Kotagiri', reference: 'Related GRN GR-04512', notes: 'Inspected on arrival.' },
  { id: 'ACT-004841', title: 'Order Dispatched', category: 'Orders', module: 'orders', warehouseId: 'WH-OOTY', subtitle: 'ORD-88213 · 6 items', performedBy: 'Arun · SWA', day: 'Today', when: 'Today · 09:12 AM', timeOfDay: 'morning', status: 'Completed', action: 'Order ORD-88213 dispatched from Ooty', reference: 'Related Order ORD-88213', notes: 'Handed over at Dock 1.' },
  { id: 'ACT-004842', title: 'Storage location updated', category: 'Storage', module: 'storage', warehouseId: 'WH-OOTY', subtitle: 'Cold Storage A · Tomato G1 640 KG placed', performedBy: 'Arun · SWA', day: 'Today', when: 'Today · 01:30 PM', timeOfDay: 'afternoon', status: 'Completed', action: 'Tomato Grade 1 put away in Cold Storage A, Rack 01', reference: 'Batch BAT-OOT-00112', notes: 'Put away after QC.' },
  { id: 'ACT-004818', title: 'Stock Verification', category: 'Verification', module: 'verification', warehouseId: 'WH-COON', subtitle: 'Carrot · Grade 1 · Verified count 80 KG', performedBy: 'Suresh · SWA', day: 'Yesterday', when: 'Yesterday · 04:15 PM', timeOfDay: 'afternoon', status: 'Completed', action: 'Physical count matched system balance 100%', reference: 'Verification Log VER-2026-08', notes: 'Rack 02 Shelf 03 verified.' },
  { id: 'ACT-004817', title: 'Storage location updated', category: 'Storage', module: 'storage', warehouseId: 'WH-COON', subtitle: 'Rack 03 · Ambient · Potato 220 KG placed', performedBy: 'Suresh · SWA', day: 'Yesterday', when: 'Yesterday · 02:30 PM', timeOfDay: 'afternoon', status: 'Completed', action: 'Pallet position confirmed in Rack 03 Shelf 01', reference: 'Batch BAT-COO-00238', notes: 'Ambient storage zone allocated.' },
  { id: 'ACT-004790', title: 'Stock Verification', category: 'Verification', module: 'verification', warehouseId: 'WH-COON', subtitle: 'VER-0021 · full cycle count', performedBy: 'Suresh · SWA', day: 'Earlier', when: '28 Sep 2026, 09:30 AM', timeOfDay: 'morning', status: 'Completed', action: 'Stock verification VER-0021 completed', reference: 'Verification Log VER-0021', notes: 'Long-term operations history record.' },
  { id: 'ACT-004781', title: 'Material Issued', category: 'Material Handling', module: 'material_handling', warehouseId: 'WH-COON', subtitle: 'Packaging Box · 20 units', performedBy: 'Suresh · SWA', day: 'Earlier', when: '27 Sep 2026, 04:20 PM', timeOfDay: 'afternoon', status: 'Completed', action: 'Material issued · Packaging Box (20 units)', reference: 'Material MAT-0021', notes: 'Long-term operations history record.' },
];

// ─── Part B: Warehouse Operations hub ────────────────────────────────────────

/** Operations snapshot per warehouse (demo; summed / averaged for the Main view). */
export const OPERATIONS_SUMMARY: readonly OperationsSummary[] = [
  { warehouseId: 'WH-COON', storageLocations: 18, occupancyPercent: 72, materialItems: 42, staffPresent: 8, staffTotal: 10, activitiesToday: 28, historyRecords: 26, receivingShipments: 3, storageMovements: 5, verificationPending: 2 },
  { warehouseId: 'WH-OOTY', storageLocations: 22, occupancyPercent: 68, materialItems: 38, staffPresent: 7, staffTotal: 9, activitiesToday: 24, historyRecords: 31, receivingShipments: 5, storageMovements: 9, verificationPending: 3 },
  { warehouseId: 'WH-KOTA', storageLocations: 12, occupancyPercent: 61, materialItems: 21, staffPresent: 6, staffTotal: 8, activitiesToday: 14, historyRecords: 15, receivingShipments: 2, storageMovements: 4, verificationPending: 2 },
  { warehouseId: 'WH-GUDA', storageLocations: 10, occupancyPercent: 55, materialItems: 17, staffPresent: 6, staffTotal: 7, activitiesToday: 11, historyRecords: 12, receivingShipments: 2, storageMovements: 3, verificationPending: 1 },
];

/** Needs Attention cards of the hub (demo). */
export const ATTENTION_ITEMS: readonly AttentionItem[] = [
  { id: 'att-1', warehouseId: 'WH-COON', title: 'Storage Location Issue', detail: 'Rack A-03 requires attention', tone: 'danger', module: 'storage' },
  { id: 'att-2', warehouseId: 'WH-COON', title: 'Material Low', detail: 'Packaging boxes', tone: 'warning', module: 'material_handling' },
  { id: 'att-3', warehouseId: 'WH-COON', title: 'Operational Issue', detail: 'Cold storage maintenance', tone: 'danger', module: 'operational_issue' },
  { id: 'att-4', warehouseId: 'WH-KOTA', title: 'Stock Count Variance', detail: 'Dry Storage A · Beans -12 KG', tone: 'warning', module: 'operational_issue' },
];

/** Today's operation counts per warehouse (demo; summed for the Main view). */
export const TODAY_METRICS: readonly TodayMetrics[] = [
  { warehouseId: 'WH-COON', receiving: 3, storage: 8, verification: 2, materials: 6, issues: 3, staffPresent: 8 },
  { warehouseId: 'WH-OOTY', receiving: 5, storage: 9, verification: 3, materials: 5, issues: 1, staffPresent: 7 },
  { warehouseId: 'WH-KOTA', receiving: 2, storage: 4, verification: 2, materials: 3, issues: 1, staffPresent: 6 },
  { warehouseId: 'WH-GUDA', receiving: 2, storage: 3, verification: 1, materials: 2, issues: 0, staffPresent: 6 },
];
