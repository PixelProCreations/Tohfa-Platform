/**
 * Shared types for the warehouse wallet & cash top-up screens (design module M8,
 * plus the M11-S08 daily cash ledger that is reached from the wallet hub).
 *
 * One set of screens serves both warehouse roles. As in finance-expenses,
 * orders, returns-rma, billing-invoices and customers, the role difference is
 * carried by `scope` (warehouseId undefined = all warehouses, the Main
 * Warehouse view) and `can` (a docs/rbac.json code check that only decides
 * what to render; the server enforces every action again, CLAUDE.md 2.1).
 *
 * wallet.cash_topup.process and wallet.cash_topup.fiscal_tag are `all` for both
 * MAIN_WH_ADMIN and SUB_WH_ADMIN, but a Sub admin collects cash at its own
 * warehouse, so a Sub scope shows only its own rows; Main's grant covers the
 * four warehouses (owner decision 2026-10-09).
 *
 * The Sub screens each declared their own record shape (CashTopUpData,
 * ConfirmTopUpDetails, FiscalTagScreenData, TopUpDetailsData,
 * TransactionDetailData, TopUpSuccessData, CustomerWalletData) and the
 * dashboard barrel re-exported all of them with `export *`. They are folded
 * into the few types below, defined once.
 *
 * Amounts in a cash top-up draft are integer paise (the wizard is live).
 * Display amounts in records are pre-formatted strings, formatted from the
 * server's paise; nothing here computes money from them (CLAUDE.md 2.2).
 *
 * TopUpHistoryRow and AttentionCategory/AttentionIssue type the two sample
 * screens that have no backend (Top-Up History, Wallet Needs Attention); they
 * are kept for them by the owner decision of 2026-10-14. CashLedgerEntry went
 * with the Daily Cash fixture (that screen is live).
 */
import type { Paise } from '@tohfa/shared-types';
import type { TopUpCustomer } from './mappers';

export type {
  PermissionCheck,
  WarehouseNavigate,
  WarehouseScope,
  WarehouseScreenBaseProps,
  WarehouseTab,
} from '../finance-expenses/types';

/** The customer whose wallet is in focus (deep links carry only some fields). */
export interface WalletCustomer {
  name?: string | undefined;
  /** Customer code, e.g. CUS-001245. */
  id?: string | undefined;
  mobile?: string | undefined;
  /** Display balance, e.g. '₹4,500.00'. */
  balance?: string | undefined;
  totalCredited?: string | undefined;
  totalUsed?: string | undefined;
  /**
   * The customer uuid, when known (opened from the live customer screens).
   * With it the wallet reads GET /admin/customers/{id}/wallet (plan phase 6).
   */
  customerUuid?: string | undefined;
  /** The balance in integer paise, when a live read gave one (the counter lookup, plan phase 9). */
  balancePaise?: Paise | undefined;
}

/** A wallet customer with every display field filled (the uuid and paise balance stay optional). */
export type ResolvedWalletCustomer = { [K in Exclude<keyof WalletCustomer, 'customerUuid' | 'balancePaise'>]-?: string } & {
  customerUuid?: string | undefined;
  balancePaise?: Paise | undefined;
};

/**
 * A cash top-up as it moves through the wizard: Cash Top-Up -> Fiscal Cash Tag
 * -> Confirm (plan phase 9, live). Money is integer paise; the customer is the
 * live one (uuid + masked mobile); the warehouse is a uuid (BR-30).
 */
export interface CashTopUpDraft {
  customer: TopUpCustomer;
  /** At most the BR-19 cap (config/businessThresholds); the server enforces it again. */
  amountPaise: Paise;
  /** Warehouse uuid where the cash was collected. */
  warehouseId: string;
  warehouseName: string;
  /** Wallet balance before the top-up, for the preview only; null when unknown. */
  currentBalancePaise: Paise | null;
  /** Set by the Fiscal Cash Tag step (BR-18), trimmed and 3..60 characters. */
  fiscalCashTag?: string | undefined;
}

/**
 * One wallet ledger row as the screens show it: the cash top-up's 201 (Top-Up
 * Successful) or any wallet movement (Transaction Detail).
 */
export interface WalletTransactionRecord {
  transactionId?: string | undefined;
  /** 'Cash Top-Up', 'Purchase', ... */
  type?: string | undefined;
  customerName?: string | undefined;
  customerId?: string | undefined;
  /** Display amount, e.g. '₹2,000' or '-₹750'. */
  amount?: string | undefined;
  previousBalance?: string | undefined;
  newBalance?: string | undefined;
  status?: string | undefined;
  fiscalCashTag?: string | undefined;
  /** Fiscal tag or order reference of a non-top-up movement. */
  referenceId?: string | undefined;
  dateTime?: string | undefined;
  processedBy?: string | undefined;
  createdAt?: string | undefined;
  /** Warehouse that recorded it; a Sub scope sees only its own. */
  warehouseId?: string | undefined;
  warehouseName?: string | undefined;
}

/** Status of a top-up row (sample data: no endpoint lists top-up rows). */
export type TopUpStatus = 'Completed' | 'Pending' | 'Failed';

/** One row of the Top-Up History sample. */
export interface TopUpHistoryRow {
  id: string;
  customerName: string;
  customerId: string;
  fiscalTag: string;
  amount: string;
  date: string;
  time: string;
  status: TopUpStatus;
  warehouseId: string;
}

/** Needs-attention filter (the hub opens the list unfiltered or on one category). */
export type AttentionCategory = 'all' | 'pending' | 'failed' | 'fiscal' | 'reconciliation';

/** One item on the Needs Attention sample. */
export interface AttentionIssue {
  id: string;
  category: Exclude<AttentionCategory, 'all'>;
  badgeLabel: string;
  severity: 'warning' | 'error';
  title: string;
  customer: string;
  customerId: string;
  amount: string;
  time: string;
  description: string;
  diagnostics: string;
  primaryAction: string;
  secondaryAction?: string | undefined;
  warehouseId: string;
}

/** Route keys of WalletFlow (old App.tsx keys without the 'SubWarehouse' / 'Warehouse' prefix). */
export type WalletRoute =
  | 'WalletOperations'
  | 'CustomerSearch'
  | 'CustomerWallet'
  | 'CashTopUp'
  | 'FiscalTag'
  | 'ConfirmCashTopUp'
  | 'TopUpSuccess'
  | 'TopUpDetails'
  | 'TransactionDetail'
  | 'TopUpHistory'
  | 'DailyCashSummary'
  | 'DailyCash'
  | 'WalletAttention';

/** Params carried between wallet routes. */
export interface WalletRouteParams {
  customer?: WalletCustomer | undefined;
  draft?: CashTopUpDraft | undefined;
  /** A live ledger row (the wallet's or the top-up's 201); Transaction Detail shows only what the server sent. */
  transaction?: WalletTransactionRecord | undefined;
  /** Needs Attention opens on this filter (the hub's entry); undefined is 'all'. */
  category?: AttentionCategory | undefined;
}
