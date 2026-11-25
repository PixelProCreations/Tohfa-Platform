/**
 * Pure logic for the Accounts & Finance hub (no react-native import, so
 * plain-Node vitest covers it).
 *
 * WHY the figures are mostly dashes: owner decision 2026-11-11 was to port the
 * design now and show '—' for every figure without a real backend source. The
 * only finance figures the API returns today are the revenue and expense
 * report totals (GET /admin/finance/reports/revenue and /expenses, BR-63).
 * There is no endpoint for farmer purchase value, outstanding dues, wallet
 * liability, pending payouts, refunds or a net summary, so those stay dashes
 * rather than being derived from something that is not quite the same figure.
 *
 * WHY tiles need a callback AND a code: the host owns navigation (it may not
 * have a destination for a tile yet), and the code decides what is worth
 * rendering (root CLAUDE.md 2.1: the server still authorises every call).
 * A missing `can` denies everything.
 */
import type { Paise } from '@tohfa/shared-types';
import type { Can } from '../../permissions/can';
import type { TranslationKey } from '../../i18n';
import { formatPaise } from '../../money/paise';
import type { FinanceReportTotals } from '../warehouse/finance-expenses/mappers';
import { addDays, type ReportRange } from '../warehouse/finance-expenses/reportRanges';

/** What each Go-to tile and header action opens. The host passes only what it can open. */
export interface FinanceHubActions {
  /** Purchase & Sales: the wired sales-direct SalesFlow. */
  onOpenSales?: (() => void) | undefined;
  /** Dues & Payouts: no destination yet (design screen is fixture-only). */
  onOpenDuesPayouts?: (() => void) | undefined;
  /** Sales Income & Revenue: FinanceFlow initialScreen 'Revenue'. */
  onOpenSalesIncome?: (() => void) | undefined;
  /** Expenses: FinanceFlow initialScreen 'Expenses'. */
  onOpenExpenses?: (() => void) | undefined;
  /** Customer Wallet: the wired wallet-cashtopup WalletFlow. */
  onOpenWallet?: (() => void) | undefined;
  /** Create or View Invoice: no destination yet (design invoices hub is fixture-only). */
  onOpenInvoices?: (() => void) | undefined;
  /** Review Returns: the wired returns-rma ReturnsFlow. */
  onOpenReturns?: (() => void) | undefined;
  /** History: FinanceFlow initialScreen 'FinanceHistory' is the nearest wired screen. */
  onOpenTransactionHistory?: (() => void) | undefined;
  /** Report & Export: no destination yet (design report archive is fixture-only). */
  onOpenReports?: (() => void) | undefined;
}

export type FinanceHubTileId =
  | 'purchaseSales'
  | 'duesPayouts'
  | 'salesIncome'
  | 'expenses'
  | 'customerWallet'
  | 'invoices'
  | 'reviewReturns'
  | 'transactionHistory'
  | 'reportExport';

export interface FinanceHubTileDef {
  id: FinanceHubTileId;
  callback: keyof FinanceHubActions;
  /** docs/rbac.json codes; holding any one of them is enough. */
  codes: readonly string[];
  labelKey: TranslationKey;
  /**
   * When true the tile always renders when RBAC passes, even without a callback.
   * The screen shows a "Not available yet" toast on press when the callback is absent.
   * When false (the default) the tile is hidden without a callback.
   */
  alwaysShow?: boolean;
}

/** The design's Go-to grid, in the design's order. */
export const FINANCE_HUB_TILES: readonly FinanceHubTileDef[] = [
  { id: 'purchaseSales', callback: 'onOpenSales', codes: ['sales.history.view'], labelKey: 'financeHub.tile.purchaseSales' },
  // duesPayouts: no backend destination yet; always rendered (owner rule: design elements are always visible),
  // shows "Not available yet" toast when pressed without a callback.
  { id: 'duesPayouts', callback: 'onOpenDuesPayouts', codes: ['payout.dues.view'], labelKey: 'financeHub.tile.duesPayouts', alwaysShow: true },
  { id: 'salesIncome', callback: 'onOpenSalesIncome', codes: ['finance.sales_income.view'], labelKey: 'financeHub.tile.salesIncome' },
  { id: 'expenses', callback: 'onOpenExpenses', codes: ['finance.expense.log'], labelKey: 'financeHub.tile.expenses' },
  { id: 'customerWallet', callback: 'onOpenWallet', codes: ['wallet.cash_topup.process'], labelKey: 'financeHub.tile.customerWallet' },
  { id: 'invoices', callback: 'onOpenInvoices', codes: ['invoice.view_own'], labelKey: 'financeHub.tile.invoices' },
  { id: 'reviewReturns', callback: 'onOpenReturns', codes: ['rma.request.process'], labelKey: 'financeHub.tile.reviewReturns' },
  {
    id: 'transactionHistory',
    callback: 'onOpenTransactionHistory',
    // Same any-of pair FinanceFlow uses for its FinanceHistory route.
    codes: ['finance.sales_income.view', 'finance.expense.log'],
    labelKey: 'financeHub.tile.transactionHistory',
  },
  // reportExport: no backend destination yet; always rendered (owner rule), toast without callback.
  { id: 'reportExport', callback: 'onOpenReports', codes: ['report.export.file'], labelKey: 'financeHub.tile.reportExport', alwaysShow: true },
];

/** Header filter button (design: finance filter sheet). */
export const FINANCE_HUB_FILTER_CODE = 'finance.dashboard.view';
/** Header download button (design: export finance report). */
export const FINANCE_HUB_EXPORT_CODE = 'report.export.file';
/** Gates of the two real report reads (same codes as their API routes). */
export const FINANCE_HUB_REVENUE_CODE = 'finance.sales_income.view';
export const FINANCE_HUB_EXPENSE_CODE = 'finance.expense.log';

/** True only when `can` exists and grants one of `codes`. */
export function canAny(can: Can | undefined, codes: readonly string[]): boolean {
  if (!can) return false;
  return codes.some((code) => can(code));
}

/**
 * Returns the tiles that should render in the Go-to grid.
 *
 * Most tiles require the host to pass their callback AND the caller to hold
 * their RBAC code. `alwaysShow` tiles (duesPayouts, reportExport) render
 * when the RBAC code passes, even without a callback; the screen shows a
 * "Not available yet" toast on press when the callback is absent.
 */
export function visibleFinanceHubTiles(can: Can | undefined, actions: FinanceHubActions): FinanceHubTileDef[] {
  return FINANCE_HUB_TILES.filter((tile) => {
    if (!canAny(can, tile.codes)) return false;
    if (tile.alwaysShow) return true;
    return typeof actions[tile.callback] === 'function';
  });
}

// The design's header reads "Last 30 Days": 30 IST days including today.
const LAST_30_DAYS_BACK = -29;

/** The report range behind the "Last 30 Days" header, `today` being the IST day (YYYY-MM-DD). */
export function financeHubRange(today: string): ReportRange {
  return { from: addDays(today, LAST_30_DAYS_BACK), to: today };
}

export interface FinanceHubSources {
  revenue?: FinanceReportTotals | undefined;
  expenses?: FinanceReportTotals | undefined;
}

export interface FinanceHubFigures {
  sales: string;
  farmerPurchase: string;
  outstandingDues: string;
  expenses: string;
  walletLiability: string;
  pendingPayouts: string;
  refunds: string;
  netSummary: string;
}

function money(report: FinanceReportTotals | undefined, dash: string): string {
  return report ? formatPaise(report.totalPaise) : dash;
}

/** The eight KPI values. Sales is the BR-63 revenue total (the design shows the same figure as Revenue). */
export function financeHubFigures(src: FinanceHubSources, dash: string): FinanceHubFigures {
  return {
    sales: money(src.revenue, dash),
    farmerPurchase: dash,
    outstandingDues: dash,
    expenses: money(src.expenses, dash),
    walletLiability: dash,
    pendingPayouts: dash,
    refunds: dash,
    netSummary: dash,
  };
}

export type FinanceHubBarId = 'revenue' | 'purchase' | 'expense';

export interface FinanceHubBar {
  id: FinanceHubBarId;
  value: string;
  /** 0..100 width of the fill, or null when the row has no source. */
  fillPercent: number | null;
}

const FULL = 100;

/**
 * The "Revenue, expense & purchase" rows. A fill is the row's total relative
 * to the largest sourced total, in whole percent from integer paise (a bar
 * width, not money). Purchase has no source, so it has no fill.
 */
export function financeHubFlowBars(src: FinanceHubSources, dash: string): FinanceHubBar[] {
  const rows: { id: FinanceHubBarId; report: FinanceReportTotals | undefined }[] = [
    { id: 'revenue', report: src.revenue },
    { id: 'purchase', report: undefined },
    { id: 'expense', report: src.expenses },
  ];
  const positive = (p: Paise): number => (p > 0 ? p : 0);
  const max = rows.reduce((m, r) => (r.report ? Math.max(m, positive(r.report.totalPaise)) : m), 0);
  return rows.map(({ id, report }) => ({
    id,
    value: money(report, dash),
    fillPercent: report ? (max > 0 ? Math.round((positive(report.totalPaise) * FULL) / max) : 0) : null,
  }));
}

export type FinanceHubPaymentId = 'collected' | 'pending' | 'failed';

/** Payment status rows: no endpoint returns these counts, so they are labels only. */
export const FINANCE_HUB_PAYMENT_ROWS: readonly FinanceHubPaymentId[] = ['collected', 'pending', 'failed'];
