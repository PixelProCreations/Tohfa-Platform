/**
 * Mock data for the wallet & cash top-up screens until the wallet / top-up
 * read APIs are wired. Rows carry the seeded warehouse ids (seed
 * 001_reference.sql) so a Sub scope filters to its own warehouse while the
 * Main scope sees all four; warehouse names are looked up from
 * WALLET_WAREHOUSES instead of being written into each row or screen.
 *
 * The BR-19 cash top-up cap is NOT here: it lives in config/businessThresholds
 * (mirroring system_config.cash_topup_cap) and the screens read it from there.
 */
import type {
  AttentionIssue,
  CashLedgerEntry,
  ResolvedWalletCustomer,
  TopUpHistoryRow,
  WalletTransactionRecord,
  WarehouseScope,
} from './types';

/** The four warehouses (seed 001). Main's wallet grants cover all of them. */
export const WALLET_WAREHOUSES: readonly WarehouseScope[] = [
  { warehouseId: 'WH-OOTY', warehouseName: 'Ooty Warehouse' },
  { warehouseId: 'WH-COON', warehouseName: 'Coonoor Warehouse' },
  { warehouseId: 'WH-KOTA', warehouseName: 'Kotagiri Warehouse' },
  { warehouseId: 'WH-GUDA', warehouseName: 'Gudalur Market Warehouse' },
];

/** Display name of a warehouse id (falls back to the id). */
export function warehouseNameOf(warehouseId: string | undefined): string {
  if (warehouseId === undefined) return '';
  return WALLET_WAREHOUSES.find((w) => w.warehouseId === warehouseId)?.warehouseName ?? warehouseId;
}

/** Customer shown when a wallet screen is opened without one (demo). */
export const SAMPLE_WALLET_CUSTOMER: ResolvedWalletCustomer = {
  name: 'Ravi Kumar',
  id: 'CUS-001245',
  mobile: '+91 98765 43210',
  balance: '₹4,500.00',
  totalCredited: '₹25,000',
  totalUsed: '₹20,500',
};

/** Pre-filled fiscal cash tag of the demo top-up. */
export const SAMPLE_FISCAL_TAG = 'FC-20260925-0012';
export const SAMPLE_TRANSACTION_ID = 'WT-20260925-001245';
export const SAMPLE_DATE = '25 Sep 2026';
export const SAMPLE_TIME = '10:42 AM';

/** Who processed a demo top-up: the Sub twin said SWA, the Main twin MWA. */
export function sampleProcessedBy(scope: WarehouseScope): string {
  return scope.warehouseId === undefined ? 'MWA – Suresh' : 'SWA – Suresh';
}

/** Preset top-up amounts (whole rupees). "Config-driven" in the design; mock until system_config exposes them. */
export const TOP_UP_PRESETS: readonly number[] = [500, 1000, 2000, 5000];

/** Recent movements on the demo customer's wallet. */
export const CUSTOMER_WALLET_TRANSACTIONS: readonly WalletTransactionRecord[] = [
  {
    transactionId: 'WT-20260925-001245',
    type: 'Cash Top-Up',
    amount: '₹2,000',
    previousBalance: '₹2,500',
    newBalance: '₹4,500',
    dateTime: 'Today, 10:42 AM',
    status: 'Completed',
    warehouseId: 'WH-COON',
    processedBy: 'SWA – Suresh',
    referenceId: 'FC-20260925-0012',
  },
  {
    transactionId: 'WT-20260924-001198',
    type: 'Purchase',
    amount: '-₹750',
    previousBalance: '₹5,250',
    newBalance: '₹4,500',
    dateTime: 'Yesterday, 4:20 PM',
    status: 'Completed',
    warehouseId: 'WH-COON',
    processedBy: 'POS Terminal',
    referenceId: 'ORD-20260924-8831',
  },
  {
    transactionId: 'WT-20260920-001150',
    type: 'Cash Top-Up',
    amount: '₹1,500',
    previousBalance: '₹1,000',
    newBalance: '₹2,500',
    dateTime: '20 Sep, 11:30 AM',
    status: 'Completed',
    warehouseId: 'WH-OOTY',
    processedBy: 'MWA – Suresh',
    referenceId: 'FC-20260920-0044',
  },
];

/** Top-up history rows (Sub's four Coonoor rows plus the Main twin's Ooty row). */
export const TOP_UP_HISTORY: readonly TopUpHistoryRow[] = [
  {
    id: 'WT-20260925-001245',
    customerName: 'Ravi Kumar',
    customerId: 'CUS-001245',
    fiscalTag: 'FC-20260925-0012',
    amount: '₹2,000',
    date: '25 Sep 2026',
    time: '10:42 AM',
    status: 'Completed',
    warehouseId: 'WH-COON',
  },
  {
    id: 'WT-20260925-001238',
    customerName: 'Priya Stores',
    customerId: 'CUS-00152',
    fiscalTag: 'FC-20260925-0009',
    amount: '₹1,000',
    date: '25 Sep 2026',
    time: '09:15 AM',
    status: 'Pending',
    warehouseId: 'WH-COON',
  },
  {
    id: 'WT-20260925-001231',
    customerName: 'Rajesh Kumar',
    customerId: 'CUS-00291',
    fiscalTag: 'OOTY-2026-09-25-0042',
    amount: '₹2,000',
    date: '25 Sep 2026',
    time: '09:02 AM',
    status: 'Completed',
    warehouseId: 'WH-OOTY',
  },
  {
    id: 'WT-20260925-001220',
    customerName: 'Anand Kumar',
    customerId: 'CUS-00188',
    fiscalTag: 'FC-20260925-0004',
    amount: '₹5,000',
    date: '25 Sep 2026',
    time: '08:30 AM',
    status: 'Completed',
    warehouseId: 'WH-COON',
  },
  {
    id: 'WT-20260924-001198',
    customerName: 'Mani Fresh Produce',
    customerId: 'CUS-00094',
    fiscalTag: 'FC-20260924-0021',
    amount: '₹3,500',
    date: '24 Sep 2026',
    time: '05:10 PM',
    status: 'Completed',
    warehouseId: 'WH-COON',
  },
];

/** Needs-attention items. Crediting is never done here: the fiscal-tag credit is server-side. */
export const ATTENTION_ISSUES: readonly AttentionIssue[] = [
  {
    id: 'TXN-00918',
    category: 'pending',
    badgeLabel: 'Awaiting Verification',
    severity: 'warning',
    title: 'Pending Top-Up Verification',
    customer: 'Kavitha R.',
    customerId: 'CUS-002140',
    amount: '₹1,000.00',
    time: 'Today · 10:15 AM',
    description:
      'Cash was collected at warehouse register #1, but the SMS/webhook verification server did not acknowledge receipt within 180 seconds. Funds have not credited to customer wallet.',
    diagnostics: 'Gateway ACK: Timeout (Code 408) · Ledger entry registered in drawer count.',
    primaryAction: 'Mark Cash Verified & Credit Wallet',
    secondaryAction: 'Refund Cash to Customer',
    warehouseId: 'WH-COON',
  },
  {
    id: 'TXN-00912',
    category: 'failed',
    badgeLabel: 'Failed Top-Up',
    severity: 'error',
    title: 'Top-Up Attempt Failed',
    customer: 'Anand Kumar',
    customerId: 'CUS-00188',
    amount: '₹500.00',
    time: 'Today · 09:20 AM',
    description:
      'Top-up sequence aborted due to cellular connection drop before fiscal registration. No funds were debited or credited.',
    diagnostics: 'Status: Connection Reset · Cash safe: Not collected.',
    primaryAction: 'Retry Top-Up',
    secondaryAction: 'Dismiss Alert',
    warehouseId: 'WH-COON',
  },
  {
    id: 'TXN-00905',
    category: 'fiscal',
    badgeLabel: 'Missing Tag',
    severity: 'warning',
    title: 'Missing Fiscal Cash Tag',
    customer: 'Priya Stores',
    customerId: 'CUS-00152',
    amount: '₹2,100.00',
    time: 'Today · 08:45 AM',
    description:
      'Top-up was completed and customer balance was credited, but Government Fiscal Cash Tag generation timed out. Required before day-end closing.',
    diagnostics: 'Secure Enclave Hash pending sync · Warehouse ID: WH-COON',
    primaryAction: 'Generate & Attach Fiscal Tag',
    secondaryAction: 'Review Transaction',
    warehouseId: 'WH-COON',
  },
  {
    id: 'REC-20260924',
    category: 'reconciliation',
    badgeLabel: 'Discrepancy',
    severity: 'warning',
    title: 'Yesterday Cash Reconciliation Discrepancy',
    customer: 'Drawer Register #1',
    customerId: 'AUD-20260924',
    amount: '- ₹100.00 Variance',
    time: '24 Sep 2026 · Close of Day',
    description:
      'Physical cash count counted ₹18,400.00 vs POS ledger ₹18,500.00. Under-count of ₹100 requires admin acknowledgement and variance reason note.',
    diagnostics: 'Expected: ₹18,500 | Physical: ₹18,400 | Discrepancy: -₹100 (Unresolved)',
    primaryAction: 'Acknowledge & Close Day Variance',
    secondaryAction: 'Open Daily Cash Summary',
    warehouseId: 'WH-COON',
  },
  {
    // Main twin: "Daily cash reconciliation pending" at another warehouse.
    id: 'REC-20260925-OOTY',
    category: 'reconciliation',
    badgeLabel: 'Pending',
    severity: 'warning',
    title: 'Daily Cash Reconciliation Pending',
    customer: 'Drawer Register #1',
    customerId: 'AUD-20260925',
    amount: '₹0.00 Variance',
    time: '25 Sep 2026 · Close of Day',
    description: 'Today’s physical cash count has not been submitted yet.',
    diagnostics: 'Expected: ₹12,300 | Physical: not entered',
    primaryAction: 'Acknowledge & Close Day Variance',
    secondaryAction: 'Open Daily Cash Summary',
    warehouseId: 'WH-OOTY',
  },
];

/** Daily cash ledger lines (Sub twin; the Main twin showed a subset). */
export const CASH_LEDGER: readonly CashLedgerEntry[] = [
  { id: 'TX-01', type: 'Cash In', title: 'Direct Sale', ref: 'Ref: REV-000845', amount: 3450, time: '11:20 AM', warehouseId: 'WH-COON' },
  { id: 'TX-02', type: 'Cash In', title: 'Cash Top-Up', ref: 'Ref: TOP-000512', amount: 5000, time: '2:15 PM', warehouseId: 'WH-COON' },
  { id: 'TX-03', type: 'Cash In', title: 'Market Day Cash Sale', ref: 'Ref: REV-000842', amount: 5050, time: '4:30 PM', warehouseId: 'WH-COON' },
  { id: 'TX-04', type: 'Cash Out', title: 'Transport Expense', ref: 'Ref: EXP-001245', amount: 2400, time: '09:30 AM', warehouseId: 'WH-COON' },
  { id: 'TX-05', type: 'Cash Out', title: 'Loading / Unloading', ref: 'Ref: EXP-001244', amount: 1800, time: '12:45 PM', warehouseId: 'WH-COON' },
  { id: 'TX-06', type: 'Cash Out', title: 'Generator Fuel / Utilities', ref: 'Ref: EXP-001238', amount: 2220, time: '3:00 PM', warehouseId: 'WH-COON' },
];

/** Cash denominations recorded for today's top-ups (daily cash summary). */
export const CASH_BREAKDOWN: readonly { label: string; amount: string }[] = [
  { label: '₹500 × 3', amount: '₹1,500' },
  { label: '₹1,000 × 7', amount: '₹7,000' },
  { label: '₹2,000 × 8', amount: '₹16,000' },
  { label: '₹5,000 × 1', amount: '₹5,000' },
  { label: 'Other × 5', amount: '—' },
];
