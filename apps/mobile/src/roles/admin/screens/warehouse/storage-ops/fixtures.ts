/**
 * The sample data still left in storage-ops, for the two areas with no live
 * API here: material handling (no endpoint; hidden by ../availability.ts) and
 * the Help & Support request form (support mode of ReportIssueScreen, owned by
 * profile-settings). Operational issues, warehouse activity, storage
 * locations, capacity, performance and the operations hub are live
 * (./useStorageData.ts) and read nothing from here.
 */
import { WALLET_WAREHOUSES, warehouseNameOf } from '../wallet-cashtopup/fixtures';
import type {
  MaterialDaySummary,
  MaterialHistoryEntry,
  MaterialItem,
  MaterialOption,
  ReportIssueMode,
  WarehouseScope,
} from './types';

/** The four warehouses (seed 001). */
export const STORAGE_WAREHOUSES: readonly WarehouseScope[] = WALLET_WAREHOUSES;

/** Display name of a warehouse id (falls back to the id). */
export const storageWarehouseName = warehouseNameOf;

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

// ─── Part B: operational issues and the report-issue form ────────────────────

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

/** Demo ids the form "returns" until a support / issue endpoint exists. */
export const DEMO_SUBMITTED_ID: Readonly<Record<ReportIssueMode, string>> = {
  support: 'SUP-00246',
  operational: 'ISS-0032',
};
