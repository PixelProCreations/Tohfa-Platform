/**
 * Pure DTO -> view mappers and money helpers for the warehouse finance screens
 * (no react-native import, so vitest runs them in plain Node).
 *
 * Money (root CLAUDE.md 2.2): the API sends decimal Money strings; they become
 * exact integer paise here and are only ever summed / subtracted as integers.
 * A value that is not a Money string becomes `null` and renders as '—', never
 * as 0: a silent 0 would make a broken figure look like a real one.
 */
import { MoneyError, parseMoney, toPaise, type Paise } from '@tohfa/shared-types';
import { formatPaise } from '../../../money/paise';
import type {
  ExpenseCategoryDto,
  ExpenseDto,
  ExpenseStatus,
  ExpenseVoucherDto,
  FinanceRevenueDetailDto,
  FinanceRevenueItemDto,
  RevenueChannel,
} from '../../../api/finance';
import type {
  ExpenseCategoryItem,
  ExpenseRecord,
  RevenueDetail,
  RevenueRecord,
  VoucherRecord,
} from './types';

/** What every screen shows for a figure or text the API did not provide. */
export const DASH = '—';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export function formatCalendarDate(yyyyMmDd: string): string {
  const parts = yyyyMmDd.split('-');
  if (parts.length !== 3) return yyyyMmDd;
  const year = parts[0];
  const monthIdx = parseInt(parts[1] ?? '1', 10) - 1;
  const month = MONTHS[monthIdx] ?? parts[1];
  const day = (parts[2] ?? '01').padStart(2, '0');
  return `${day} ${month} ${year}`;
}

// ─── Money ───────────────────────────────────────────────────────────────────

/** Exact integer paise of an API Money string; null for null / empty / malformed. */
export function paiseFromMoney(amount: string | null | undefined): Paise | null {
  if (amount === undefined || amount === null || amount.trim() === '') return null;
  try {
    return toPaise(parseMoney(amount));
  } catch (e) {
    if (e instanceof MoneyError) return null;
    throw e;
  }
}

/** '₹2,400.50' / '₹1,84,430' / '-₹1,200', or '—' for an unknown figure. */
export function formatPaiseOrDash(paise: Paise | null | undefined): string {
  return paise === null || paise === undefined ? DASH : formatPaise(paise);
}

/** formatPaiseOrDash of an API Money string. */
export function formatMoneyOrDash(amount: string | null | undefined): string {
  return formatPaiseOrDash(paiseFromMoney(amount));
}

/** Integer sum; null if any input is unknown (a partial sum would be a wrong figure). */
export function sumPaise(values: readonly (Paise | null)[]): Paise | null {
  let total = 0;
  for (const v of values) {
    if (v === null) return null;
    total += v;
  }
  return total;
}

export function subtractPaise(a: Paise | null, b: Paise | null): Paise | null {
  return a === null || b === null ? null : a - b;
}

/**
 * Display-only average, floored to the paisa with integer arithmetic (no
 * float division, no Math.round on money). Null for no rows.
 */
export function averagePaise(total: Paise | null, count: number): Paise | null {
  if (total === null || !Number.isSafeInteger(count) || count <= 0) return null;
  const remainder = total % count;
  const floored = (total - remainder) / count;
  return remainder < 0 ? floored - 1 : floored;
}

/** A free-text field the API may leave null (vendor, description). */
export function textOrDash(text: string | null | undefined): string {
  return text === null || text === undefined || text.trim() === '' ? DASH : text;
}

// ─── Revenue ─────────────────────────────────────────────────────────────────

/**
 * The hub's three revenue buckets. MARKET (market day, BR-95) and DIRECT
 * (at-counter, BR-85) are the warehouse's own sales; ONLINE is customer
 * orders; HORECA and B2B are the "other channels".
 */
export function revenueCategoryOf(channel: RevenueChannel): RevenueRecord['category'] {
  switch (channel) {
    case 'ONLINE':
      return 'Orders';
    case 'MARKET':
    case 'DIRECT':
      return 'Direct Sales';
    default:
      return 'Other';
  }
}

export interface RevenueBreakdown {
  directPaise: Paise | null;
  ordersPaise: Paise | null;
  otherPaise: Paise | null;
  totalPaise: Paise | null;
}

/** Buckets a `byChannel` summary (list summary or report) exactly in paise. */
export function revenueBreakdownOf(
  byChannel: readonly { channel: RevenueChannel; total: string; count?: number }[],
): RevenueBreakdown {
  const bucket = (category: RevenueRecord['category']) =>
    sumPaise(byChannel.filter((c) => revenueCategoryOf(c.channel) === category).map((c) => paiseFromMoney(c.total)));
  const directPaise = bucket('Direct Sales');
  const ordersPaise = bucket('Orders');
  const otherPaise = bucket('Other');
  return { directPaise, ordersPaise, otherPaise, totalPaise: sumPaise([directPaise, ordersPaise, otherPaise]) };
}

export function mapRevenueItemDtoToRecord(dto: FinanceRevenueItemDto): RevenueRecord {
  return {
    id: dto.orderId,
    orderRef: `Order #${dto.orderId}`,
    category: revenueCategoryOf(dto.channel),
    amountPaise: paiseFromMoney(dto.totalAmount),
    paymentMethod: dto.paymentMethod,
    timestamp: dto.placedAt ? formatCalendarDate(dto.placedAt.slice(0, 10)) : DASH,
    status: dto.paymentStatus === 'PAID' ? 'Completed' : dto.paymentStatus === 'REFUNDED' ? 'Refunded' : 'Pending',
    warehouseId: dto.warehouseId,
    warehouseName: undefined,
  };
}

export function mapRevenueDetailDtoToDetail(dto: FinanceRevenueDetailDto): RevenueDetail {
  return {
    revenueId: dto.orderId,
    orderId: dto.orderId,
    invoiceId: dto.invoiceNumber ?? undefined,
    // BR-16: Customer name / details hidden
    customer: '',
    salesChannel: dto.channel,
    quantity: DASH,
    product: DASH,
    finalAmount: formatMoneyOrDash(dto.totalAmount),
    paymentMethod: dto.paymentMethod,
    paymentStatus: dto.paymentStatus,
    transactionDate: dto.placedAt ? formatCalendarDate(dto.placedAt.slice(0, 10)) : DASH,
    warehouseName: undefined,
  };
}

// ─── Expenses ────────────────────────────────────────────────────────────────

/** RECORDED is the only status the API produces (BR-62); the others are legacy rows, labelled as they are. */
export function expenseStatusLabel(status: ExpenseStatus): ExpenseRecord['status'] {
  switch (status) {
    case 'APPROVED':
      return 'Approved';
    case 'REJECTED':
      return 'Rejected';
    default:
      return 'Recorded';
  }
}

/**
 * The expense DTO's `recordedBy` is a bare user UUID; it is deliberately not
 * mapped: a UUID is not a person. The recorder's name comes from the voucher
 * (BR-75, `recordedBy.name`).
 */
export function mapExpenseDtoToRecord(dto: ExpenseDto): ExpenseRecord {
  return {
    id: dto.id,
    categoryRef: dto.category,
    amountPaise: paiseFromMoney(dto.amount),
    timestamp: formatCalendarDate(dto.expenseDate),
    status: expenseStatusLabel(dto.status),
    warehouseId: dto.warehouseId ?? undefined,
    warehouseName: undefined,
  };
}

/** Rows of an expense report's `byCategory`, in the order the API sent them. */
export function expenseCategoryRows(
  byCategory: readonly { category: string; total: string; count?: number }[],
): { label: string; value: string }[] {
  return byCategory.map((row) => ({ label: row.category, value: formatMoneyOrDash(row.total) }));
}

export function mapExpenseCategoryDtoToItem(dto: ExpenseCategoryDto): ExpenseCategoryItem {
  return {
    id: dto.id,
    name: dto.name,
    // GET /admin/expense-categories lists only ACTIVE categories.
    status: 'Active',
    usedCount: null,
  };
}

export function mapExpenseVoucherDtoToRecord(dto: ExpenseVoucherDto): VoucherRecord {
  return {
    id: dto.voucherNumber,
    type: 'Expense',
    title: `Expense Voucher · ${dto.category}`,
    amountPaise: paiseFromMoney(dto.amount),
    referenceId: dto.expenseId,
    date: formatCalendarDate(dto.expenseDate),
    status: 'Recorded',
    warehouseId: dto.warehouse?.id,
    warehouseName: dto.warehouse?.name,
    createdBy: dto.recordedBy.name,
    paymentMethod: dto.paymentMethod ?? DASH,
    notes: dto.description ?? undefined,
  };
}
