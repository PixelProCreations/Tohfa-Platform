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
 * Amounts in a draft are WHOLE RUPEES (integers: the amount input strips every
 * non-digit), so `* 100` is exact integer paise for BR-19's validator. Display
 * amounts in records are pre-formatted strings from the mock data; nothing here
 * computes money from them (CLAUDE.md 2.2).
 */
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
}

/** A wallet customer with every field filled (demo fallbacks applied). */
export type ResolvedWalletCustomer = { [K in keyof WalletCustomer]-?: string };

/**
 * A cash top-up as it moves through the wizard: Cash Top-Up -> Fiscal Cash Tag
 * -> Confirm. Replaces CashTopUpData / FiscalTagScreenData / ConfirmTopUpDetails.
 */
export interface CashTopUpDraft {
  customerName: string;
  customerCode: string;
  /** Whole rupees. */
  currentBalance: number;
  /** Whole rupees, at most the BR-19 cap (config/businessThresholds). */
  topUpAmount: number;
  /** Warehouse where the cash was collected. */
  warehouseId?: string | undefined;
  warehouseName: string;
  processedBy: string;
  channel: 'Cash';
  fiscalCashTag?: string | undefined;
  dateStr?: string | undefined;
  timeStr?: string | undefined;
}

/**
 * One wallet transaction: a cash top-up (Top-Up Details / Top-Up Successful) or
 * any wallet movement (Transaction Detail). Replaces TopUpDetailsData,
 * TransactionDetailData and TopUpSuccessData.
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

/** Status of a top-up row. */
export type TopUpStatus = 'Completed' | 'Pending' | 'Failed';

/** One row of the top-up history (and the daily summary's top-up list). */
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

/** Needs-attention filter (the hub's KPI tiles open a pre-filtered list). */
export type AttentionCategory = 'all' | 'pending' | 'failed' | 'fiscal' | 'reconciliation';

/** One item on the Needs Attention screen. */
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

/** One line of the daily cash ledger breakdown. */
export interface CashLedgerEntry {
  id: string;
  type: 'Cash In' | 'Cash Out';
  title: string;
  ref: string;
  /** Whole rupees (mock). */
  amount: number;
  time: string;
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
  draft?: Partial<CashTopUpDraft> | undefined;
  transaction?: WalletTransactionRecord | undefined;
  category?: AttentionCategory | undefined;
}
