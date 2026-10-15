/**
 * Leftover design samples, kept ONLY for screens outside the wallet area that
 * still import them (other areas' owners remove them as they go live):
 *  - WALLET_WAREHOUSES / warehouseNameOf: sales-direct, staff-attendance,
 *    storage-ops, receiving-qc, reports and finance-expenses fixtures.
 *  - CUSTOMER_WALLET_TRANSACTIONS: customers/CustomerSearchScreen's sample
 *    (non-live) wallet.
 * The wallet flow itself imports nothing from here: every wallet screen is
 * live (tests/cash_topup_wiring.test.ts pins that). The ids are seed codes,
 * not uuids, so none of this can ever reach the API.
 *
 * The BR-19 cash top-up cap is NOT here: it lives in config/businessThresholds
 * (mirroring system_config.cash_topup_cap).
 */
import type { WalletTransactionRecord, WarehouseScope } from './types';

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
