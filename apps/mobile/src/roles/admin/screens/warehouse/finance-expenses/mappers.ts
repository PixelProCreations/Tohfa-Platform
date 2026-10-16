/**
 * Mappers from the finance DTOs (api/finance.ts, which mirrors
 * apps/api/src/modules/finance/*.schema.ts) to the screens' types
 * (BR-62, BR-63, BR-74, BR-75).
 *
 * Money becomes integer paise at this boundary (root CLAUDE.md 2.2) and every
 * label is an i18n key (2.7). Every API enum goes through a record with a
 * fallback, so a value the client does not know yet still renders.
 *
 * Pure: no react-native import, so plain-Node vitest covers all of it.
 */
import { fromPaise, parseMoney, toPaise, type Paise } from '@tohfa/shared-types';
import type {
  CashCloseCreateDto,
  CashCloseDto,
  DailyCashSummaryDto,
  ExpenseCategoryDto,
  ExpenseCreateDto,
  ExpenseDto,
  ExpensePaymentMethod,
  ExpenseStatus,
  ExpenseVoucherDto,
  FinanceExpenseReportDto,
  FinanceRevenueDetailDto,
  FinanceRevenueItemDto,
  FinanceRevenueReportDto,
  RevenueChannel,
  RevenuePaymentMethod,
} from '../../../api/finance';
import { t, type TranslationKey } from '../../../i18n';
import { formatPaise, parseRupeesToPaise } from '../../../money/paise';
import { formatAdminDate, formatAdminDay } from '../../../utils/datetime';
import type {
  ExpenseCategoryItem,
  ExpenseRecord,
  RevenueDetail,
  RevenueRecord,
  VoucherRecord,
  WarehouseScope,
} from './types';

/** Asia/Kolkata is UTC+05:30 all year. */
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** `value` when it is a uuid, else undefined (old fixture ids such as 'WH-OOTY' never reach the server). */
export function uuidOrUndefined(value: string | null | undefined): string | undefined {
  return typeof value === 'string' && UUID_RE.test(value) ? value : undefined;
}

/** A signed API money string ("-500.00" for a short close) as integer paise. */
export function parseSignedMoneyToPaise(val: string | number): Paise {
  const str = String(val).replace(/₹/g, '').replace(/,/g, '').trim();
  const negative = str.startsWith('-');
  const absStr = negative ? str.slice(1).trim() : str;
  const paise = toPaise(parseMoney(absStr || '0'));
  return negative ? -paise : paise;
}

/** Integer paise as the API's decimal string ("2400.50"); never through a float. */
export function paiseToMoneyString(paise: Paise): string {
  return fromPaise(paise);
}

const EXPENSE_STATUS_KEY: Readonly<Record<ExpenseStatus, TranslationKey>> = {
  RECORDED: 'finance.expense.status.RECORDED',
  APPROVED: 'finance.expense.status.APPROVED',
  REJECTED: 'finance.expense.status.REJECTED',
};

export function expenseStatusLabel(status: ExpenseStatus): string {
  return t(EXPENSE_STATUS_KEY[status] ?? 'finance.expense.status.RECORDED');
}

const EXPENSE_PAYMENT_KEY: Readonly<Record<ExpensePaymentMethod, TranslationKey>> = {
  CASH: 'finance.paymentMethod.CASH',
  UPI: 'finance.paymentMethod.UPI',
  BANK: 'finance.paymentMethod.BANK',
};

/** '' for a legacy row with no payment method (recorded before migration 0047). */
export function expensePaymentMethodLabel(method: ExpensePaymentMethod | null): string {
  if (method === null) return '';
  const key = EXPENSE_PAYMENT_KEY[method];
  return key === undefined ? method : t(key);
}

/** The payment methods the add-expense form offers, in order (ExpenseCreate.paymentMethod). */
export const EXPENSE_PAYMENT_METHODS: readonly ExpensePaymentMethod[] = ['CASH', 'UPI', 'BANK'];

const REVENUE_PAYMENT_KEY: Readonly<Record<RevenuePaymentMethod, TranslationKey>> = {
  WALLET: 'finance.paymentMethod.WALLET',
  UPI: 'finance.paymentMethod.UPI',
  CARD: 'finance.paymentMethod.CARD',
  NETBANKING: 'finance.paymentMethod.NETBANKING',
  CASH: 'finance.paymentMethod.CASH',
};

export function revenuePaymentMethodLabel(method: RevenuePaymentMethod): string {
  const key = REVENUE_PAYMENT_KEY[method];
  return key === undefined ? method : t(key);
}

const CHANNEL_KEY: Readonly<Record<RevenueChannel, TranslationKey>> = {
  ONLINE: 'finance.channel.ONLINE',
  MARKET: 'finance.channel.MARKET',
  HORECA: 'finance.channel.HORECA',
  B2B: 'finance.channel.B2B',
};

export function revenueChannelLabel(channel: RevenueChannel): string {
  const key = CHANNEL_KEY[channel];
  return key === undefined ? channel : t(key);
}

/** The channels the revenue list can filter by (GET /admin/finance/revenue `channel`). */
export const REVENUE_CHANNELS: readonly RevenueChannel[] = ['ONLINE', 'MARKET', 'HORECA', 'B2B'];

export function mapExpenseRecord(dto: ExpenseDto): ExpenseRecord {
  return {
    id: dto.id,
    categoryName: dto.category,
    description: dto.description,
    vendor: dto.vendor,
    amountPaise: parseSignedMoneyToPaise(dto.amount),
    expenseDate: dto.expenseDate,
    dateLabel: formatAdminDay(dto.expenseDate),
    paymentMethod: dto.paymentMethod,
    paymentMethodLabel: expensePaymentMethodLabel(dto.paymentMethod),
    status: dto.status,
    statusLabel: expenseStatusLabel(dto.status),
    warehouseId: dto.warehouseId,
    recordedBy: dto.recordedBy,
    createdAt: dto.createdAt,
  };
}

export function mapExpenseCategory(dto: ExpenseCategoryDto): ExpenseCategoryItem {
  return { id: dto.id, name: dto.name };
}

export function mapRevenueRecord(dto: FinanceRevenueItemDto, now: Date = new Date()): RevenueRecord {
  return {
    id: dto.orderId,
    channel: dto.channel,
    channelLabel: revenueChannelLabel(dto.channel),
    paymentMethod: dto.paymentMethod,
    paymentMethodLabel: revenuePaymentMethodLabel(dto.paymentMethod),
    amountPaise: parseSignedMoneyToPaise(dto.totalAmount),
    gstPaise: parseSignedMoneyToPaise(dto.gstAmount),
    completedAt: dto.completedAt,
    dateLabel: formatAdminDate(dto.completedAt, now),
    warehouseId: dto.warehouseId,
  };
}

export function mapRevenueDetail(dto: FinanceRevenueDetailDto, now: Date = new Date()): RevenueDetail {
  return {
    ...mapRevenueRecord(dto, now),
    invoiceNumber: dto.invoiceNumber,
    invoiceStatus: dto.invoiceStatus,
    paymentStatus: dto.paymentStatus,
    orderStatus: dto.status,
    placedAt: dto.placedAt,
  };
}

export function mapExpenseVoucher(dto: ExpenseVoucherDto): VoucherRecord {
  return {
    voucherNumber: dto.voucherNumber,
    expenseId: dto.expenseId,
    warehouseName: dto.warehouse?.name ?? null,
    warehouseCode: dto.warehouse?.code ?? null,
    categoryName: dto.category,
    amountPaise: parseSignedMoneyToPaise(dto.amount),
    expenseDate: dto.expenseDate,
    dateLabel: formatAdminDay(dto.expenseDate),
    paymentMethodLabel: expensePaymentMethodLabel(dto.paymentMethod),
    vendor: dto.vendor,
    description: dto.description,
    statusLabel: expenseStatusLabel(dto.status),
    recordedByName: dto.recordedBy.name,
  };
}

export interface CashCloseMapped {
  id: string;
  warehouseId: string;
  date: string;
  openingCashPaise: Paise;
  openingFrom: string | null;
  cashSalesPaise: Paise;
  cashTopUpsPaise: Paise;
  cashExpensesPaise: Paise;
  expectedClosingPaise: Paise;
  countedCashPaise: Paise;
  /** countedCash - expectedClosing; negative = short. Never judged against a tolerance (BR-74). */
  differencePaise: Paise;
  note: string | null;
  closedBy: string;
  createdAt: string;
}

export function mapCashClose(dto: CashCloseDto): CashCloseMapped {
  return {
    id: dto.id,
    warehouseId: dto.warehouseId,
    date: dto.date,
    openingCashPaise: parseSignedMoneyToPaise(dto.openingCash),
    openingFrom: dto.openingFrom,
    cashSalesPaise: parseSignedMoneyToPaise(dto.cashSales),
    cashTopUpsPaise: parseSignedMoneyToPaise(dto.cashTopUps),
    cashExpensesPaise: parseSignedMoneyToPaise(dto.cashExpenses),
    expectedClosingPaise: parseSignedMoneyToPaise(dto.expectedClosing),
    countedCashPaise: parseSignedMoneyToPaise(dto.countedCash),
    differencePaise: parseSignedMoneyToPaise(dto.difference),
    note: dto.note,
    closedBy: dto.closedBy,
    createdAt: dto.createdAt,
  };
}

export interface DailyCashSummaryMapped {
  date: string;
  warehouseId: string;
  openingCashPaise: Paise;
  openingFrom: string | null;
  cashSalesPaise: Paise;
  cashTopUpsPaise: Paise;
  cashExpensesPaise: Paise;
  expectedClosingPaise: Paise;
  closed: CashCloseMapped | null;
}

/**
 * BR-74: the day's figures are read from `system` (docs/openapi.yaml
 * DailyCashSummary.system = SystemCashFigures), the server's computation as it
 * stands now. They are never recomputed or typed in on the client.
 */
export function mapDailyCashSummary(dto: DailyCashSummaryDto): DailyCashSummaryMapped {
  const system = dto.system;
  return {
    date: dto.date,
    warehouseId: dto.warehouseId,
    openingCashPaise: parseSignedMoneyToPaise(system.openingCash),
    openingFrom: system.openingFrom,
    cashSalesPaise: parseSignedMoneyToPaise(system.cashSales),
    cashTopUpsPaise: parseSignedMoneyToPaise(system.cashTopUps),
    cashExpensesPaise: parseSignedMoneyToPaise(system.cashExpenses),
    expectedClosingPaise: parseSignedMoneyToPaise(system.expectedClosing),
    closed: dto.closed ? mapCashClose(dto.closed) : null,
  };
}

/** The add-expense form as typed. */
export interface ExpenseFormInput {
  categoryId: string | undefined;
  /** Decimal rupees as typed, e.g. "2,400.50". */
  amountText: string;
  /** YYYY-MM-DD. */
  expenseDate: string;
  paymentMethod: ExpensePaymentMethod | undefined;
  vendor: string;
  description: string;
  /** Required for a Main admin (not assigned to a warehouse); a Sub admin's is its scope. */
  warehouseId: string | undefined;
}

export type ExpenseFormError = 'category' | 'amount' | 'date' | 'paymentMethod' | 'warehouse';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The ExpenseCreate body (strict on the server) from the form, or the fields
 * that are missing. Amount is converted to paise and back to the API's
 * decimal string, so "2,400.5" goes out as "2400.50" and no float is involved.
 */
export function buildExpenseCreateBody(
  form: ExpenseFormInput,
  scope: WarehouseScope,
): { ok: true; body: ExpenseCreateDto } | { ok: false; errors: ExpenseFormError[] } {
  const errors: ExpenseFormError[] = [];
  const categoryId = uuidOrUndefined(form.categoryId);
  if (categoryId === undefined) errors.push('category');
  const amountPaise = parseRupeesToPaise(form.amountText);
  if (amountPaise === null || amountPaise <= 0) errors.push('amount');
  if (!ISO_DATE_RE.test(form.expenseDate)) errors.push('date');
  if (form.paymentMethod === undefined) errors.push('paymentMethod');
  const warehouseId = financeWarehouseFilter(scope, form.warehouseId);
  if (warehouseId === undefined) errors.push('warehouse');
  if (errors.length > 0 || categoryId === undefined || amountPaise === null || form.paymentMethod === undefined) {
    return { ok: false, errors };
  }
  const vendor = form.vendor.trim();
  const description = form.description.trim();
  return {
    ok: true,
    body: {
      categoryId,
      expenseDate: form.expenseDate,
      amount: paiseToMoneyString(amountPaise),
      paymentMethod: form.paymentMethod,
      ...(vendor === '' ? {} : { vendor }),
      ...(description === '' ? {} : { description }),
      ...(warehouseId === undefined ? {} : { warehouseId }),
    },
  };
}

/** The cash close as typed: counted cash in decimal rupees and an optional reason. */
export interface CashCloseFormInput {
  date: string;
  countedText: string;
  note: string;
  warehouseId: string | undefined;
}

/**
 * BR-74: the CashCloseCreate body, or null when the count does not parse or
 * there is no warehouse. Zero is a valid count (an empty till); the
 * difference is never judged against a tolerance, so a short or over count is
 * still submitted.
 */
export function buildCashCloseBody(form: CashCloseFormInput, scope: WarehouseScope): CashCloseCreateDto | null {
  const counted = parseRupeesToPaise(form.countedText);
  if (counted === null || counted < 0) return null;
  const warehouseId = financeWarehouseFilter(scope, form.warehouseId);
  if (warehouseId === undefined) return null;
  const note = form.note.trim();
  return {
    date: form.date,
    warehouseId,
    countedCash: paiseToMoneyString(counted),
    ...(note === '' ? {} : { note }),
  };
}

/** Counted minus expected, in paise; null while the count does not parse. Display only: the server computes the stored one. */
export function cashDifferencePaise(countedText: string, expectedClosingPaise: Paise): Paise | null {
  const counted = parseRupeesToPaise(countedText);
  return counted === null ? null : counted - expectedClosingPaise;
}

/** Totals of the finance reports, in paise (BR-63). */
export interface FinanceReportTotals {
  from: string;
  to: string;
  totalPaise: Paise;
  count: number;
  byDay: { date: string; totalPaise: Paise; count: number }[];
  /** Channel (revenue) or category (expense) rows, label already translated. */
  byGroup: { label: string; totalPaise: Paise; count: number }[];
  byPaymentMethod: { label: string; totalPaise: Paise; count: number }[];
}

export function mapRevenueReport(dto: FinanceRevenueReportDto): FinanceReportTotals {
  return {
    from: dto.from,
    to: dto.to,
    totalPaise: parseSignedMoneyToPaise(dto.summary.total),
    count: dto.summary.count,
    byDay: dto.byDay.map((d) => ({ date: d.date, totalPaise: parseSignedMoneyToPaise(d.total), count: d.count })),
    byGroup: dto.byChannel.map((c) => ({
      label: revenueChannelLabel(c.channel),
      totalPaise: parseSignedMoneyToPaise(c.total),
      count: c.count,
    })),
    byPaymentMethod: dto.byPaymentMethod.map((p) => ({
      label: revenuePaymentMethodLabel(p.paymentMethod),
      totalPaise: parseSignedMoneyToPaise(p.total),
      count: p.count,
    })),
  };
}

export function mapExpenseReport(dto: FinanceExpenseReportDto): FinanceReportTotals {
  return {
    from: dto.from,
    to: dto.to,
    totalPaise: parseSignedMoneyToPaise(dto.summary.total),
    count: dto.summary.count,
    byDay: dto.byDay.map((d) => ({ date: d.date, totalPaise: parseSignedMoneyToPaise(d.total), count: d.count })),
    byGroup: dto.byCategory.map((c) => ({
      label: c.category,
      totalPaise: parseSignedMoneyToPaise(c.total),
      count: c.count,
    })),
    byPaymentMethod: dto.byPaymentMethod.map((p) => ({
      label: p.paymentMethod === null ? t('finance.paymentMethod.none') : expensePaymentMethodLabel(p.paymentMethod),
      totalPaise: parseSignedMoneyToPaise(p.total),
      count: p.count,
    })),
  };
}

/** One row of the combined history: built only from real revenue and expense rows. */
export interface FinanceHistoryRow {
  kind: 'revenue' | 'expense';
  /** Order uuid (revenue) or expense uuid (expense). */
  id: string;
  title: string;
  /** Revenue positive, expense negative, integer paise. */
  signedPaise: Paise;
  /** Sort key: completedAt (revenue) or createdAt (expense). */
  at: string;
  dateLabel: string;
}

/** Newest first; an expense counts as money out (negative). */
export function mergeFinanceHistory(revenue: readonly RevenueRecord[], expenses: readonly ExpenseRecord[]): FinanceHistoryRow[] {
  const rows: FinanceHistoryRow[] = [
    ...revenue.map((r) => ({
      kind: 'revenue' as const,
      id: r.id,
      title: r.channelLabel,
      signedPaise: r.amountPaise,
      at: r.completedAt,
      dateLabel: r.dateLabel,
    })),
    ...expenses.map((e) => ({
      kind: 'expense' as const,
      id: e.id,
      title: e.categoryName,
      signedPaise: -e.amountPaise,
      at: e.createdAt,
      dateLabel: e.dateLabel,
    })),
  ];
  return rows.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

/** "₹2,400.50" for a paise amount; a signed one gets its sign in front. */
export function formatSignedPaise(paise: Paise): string {
  return paise < 0 ? `-${formatPaise(-paise)}` : formatPaise(paise);
}

/** Today's IST calendar date as YYYY-MM-DD (the server's day boundary, BR-74). */
export function istToday(now: Date = new Date()): string {
  // Same fixed offset as utils/datetime.ts (IST has no daylight saving); not a business threshold.
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** The first day of `today`'s month (YYYY-MM-DD), for month-to-date report ranges. */
export function monthStart(today: string): string {
  return `${today.slice(0, 8)}01`;
}

/**
 * BR-30: a Sub Warehouse Admin is pinned to scope.warehouseId. A Main admin
 * may pick a warehouse (a uuid from GET /warehouses) or none (all); a pick
 * that is not a uuid (an old fixture id) is dropped, never sent.
 */
export function financeWarehouseFilter(scope: WarehouseScope, selectedWarehouseId?: string): string | undefined {
  if (scope.warehouseId) {
    return scope.warehouseId;
  }
  return uuidOrUndefined(selectedWarehouseId);
}
