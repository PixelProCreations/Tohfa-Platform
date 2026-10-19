/**
 * The sample data still left in storage-ops: the Help & Support request form
 * (support mode of ReportIssueScreen, owned by profile-settings).
 * Operational issues, warehouse activity, storage locations, capacity,
 * performance and the operations hub are live (./useStorageData.ts) and read
 * nothing from here.
 */
import { WALLET_WAREHOUSES, warehouseNameOf } from '../wallet-cashtopup/fixtures';
import type { ReportIssueMode, WarehouseScope } from './types';

/** The four warehouses (seed 001). */
export const STORAGE_WAREHOUSES: readonly WarehouseScope[] = WALLET_WAREHOUSES;

/** Display name of a warehouse id (falls back to the id). */
export const storageWarehouseName = warehouseNameOf;

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
