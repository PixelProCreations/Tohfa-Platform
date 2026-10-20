/**
 * Design samples. Kept for:
 *  - WALLET_WAREHOUSES / warehouseNameOf: sales-direct, staff-attendance,
 *    storage-ops, receiving-qc, reports and finance-expenses fixtures, and
 *    the two sample screens below.
 *  - CUSTOMER_WALLET_TRANSACTIONS: customers/CustomerSearchScreen's sample
 *    (non-live) wallet.
 *  - TOP_UP_HISTORY and ATTENTION_ISSUES (with sampleProcessedBy): Top-Up
 *    History and Wallet Needs Attention. No endpoint lists cash top-up rows
 *    or feeds wallet issues, and by the owner decision of 2026-10-14 nothing
 *    is hidden for having no API, so those two screens stay reachable on this
 *    sample until one exists.
 * The live wallet flow (hub, wizard, customer wallet, transaction detail)
 * imports nothing from here (tests/cash_topup_wiring.test.ts pins that). The
 * ids are seed codes, not uuids, so none of this can ever reach the API.
 *
 * The BR-19 cash top-up cap is NOT here: it lives in config/businessThresholds
 * (mirroring system_config.cash_topup_cap).
 */
import type { AttentionIssue, TopUpHistoryRow, WalletTransactionRecord, WarehouseScope } from './types';

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

/** Who processed a demo top-up: the Sub twin said SWA, the Main twin MWA. */
export function sampleProcessedBy(scope: WarehouseScope): string {
  return scope.warehouseId === undefined ? 'MWA – Suresh' : 'SWA – Suresh';
}

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
