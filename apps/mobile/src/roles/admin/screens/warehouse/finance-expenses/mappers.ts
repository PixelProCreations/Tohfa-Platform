/**
 * Mappers from finance DTOs to UI types for warehouse screens (BR-62, BR-63, BR-74, BR-75).
 *
 * All money amounts are converted to integer paise immediately (root CLAUDE.md §2.2).
 * Every API enum goes through an exhaustive mapping record with an explicit fallback.
 */
import { parseMoney, toPaise, type Paise } from '@tohfa/shared-types';
import type {
  CashCloseDto,
  DailyCashSummaryDto,
  ExpenseCategoryDto,
  ExpenseDto,
  ExpensePaymentMethod,
  ExpenseStatus,
  ExpenseVoucherDto,
  FinanceRevenueDetailDto,
  FinanceRevenueItemDto,
  RevenueChannel,
  RevenuePaymentMethod,
} from '../../../api/finance';
import { formatPaise } from '../../../money/paise';
import { formatAdminDate, formatAdminDay } from '../../../utils/datetime';
import type {
  ExpenseCategoryItem,
  ExpenseRecord,
  RevenueDetail,
  RevenueRecord,
  VoucherRecord,
  WarehouseScope,
} from './types';

export function parseSignedMoneyToPaise(val: string | number): Paise {
  const str = String(val).replace(/₹/g, '').replace(/,/g, '').trim();
  const negative = str.startsWith('-');
  const absStr = negative ? str.slice(1).trim() : str;
  const paise = toPaise(parseMoney(absStr || '0'));
  return negative ? -paise : paise;
}

const EXPENSE_STATUS_MAP: Readonly<Record<ExpenseStatus, ExpenseRecord['status']>> = {
  RECORDED: 'Recorded',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export function mapExpenseStatus(status: ExpenseStatus): ExpenseRecord['status'] {
  return EXPENSE_STATUS_MAP[status] ?? 'Recorded';
}

const EXPENSE_PAYMENT_METHOD_LABELS: Readonly<Record<ExpensePaymentMethod, string>> = {
  CASH: 'Cash',
  UPI: 'UPI',
  BANK: 'Bank Transfer',
};

export function mapExpensePaymentMethod(method: ExpensePaymentMethod): string {
  return EXPENSE_PAYMENT_METHOD_LABELS[method] ?? method;
}

const CHANNEL_CATEGORY_MAP: Readonly<Record<RevenueChannel, RevenueRecord['category']>> = {
  ONLINE: 'Orders',
  DIRECT: 'Direct Sales',
  MARKET: 'Direct Sales',
  HORECA: 'Other',
  B2B: 'Other',
};

const CHANNEL_DISPLAY_NAMES: Readonly<Record<RevenueChannel, string>> = {
  ONLINE: 'Online',
  DIRECT: 'Direct Sales',
  MARKET: 'Market Sale',
  HORECA: 'Horeca Order',
  B2B: 'B2B Sale',
};

const REVENUE_PAYMENT_METHOD_LABELS: Readonly<Record<RevenuePaymentMethod, string>> = {
  WALLET: 'Wallet',
  UPI: 'UPI',
  CARD: 'Card',
  NETBANKING: 'Netbanking',
  CASH: 'Cash',
};

export function mapExpenseRecord(dto: ExpenseDto): ExpenseRecord {
  const amountPaise = parseSignedMoneyToPaise(dto.amount);
  const now = new Date();
  const dateStr = dto.createdAt ? formatAdminDate(dto.createdAt, now) : dto.expenseDate;
  const descriptionPart = dto.description ? ` · ${dto.description}` : '';

  return {
    id: dto.expenseNumber,
    categoryRef: `${dto.categoryName}${descriptionPart}`,
    amount: amountPaise,
    timestamp: dateStr,
    status: mapExpenseStatus(dto.status),
  };
}

export function mapExpenseCategory(dto: ExpenseCategoryDto): ExpenseCategoryItem {
  return {
    id: dto.id,
    name: dto.name,
    status: dto.active ? 'Active' : 'Inactive',
    usedCount: 0,
  };
}

export function mapRevenueRecord(dto: FinanceRevenueItemDto): RevenueRecord {
  const amountPaise = parseSignedMoneyToPaise(dto.amount);
  const now = new Date();
  const dateStr = dto.completedAt ? formatAdminDate(dto.completedAt, now) : '';

  return {
    id: dto.orderNumber,
    orderRef: `${CHANNEL_DISPLAY_NAMES[dto.channel] ?? dto.channel} · ${dto.orderNumber}`,
    category: CHANNEL_CATEGORY_MAP[dto.channel] ?? 'Orders',
    amount: amountPaise,
    paymentMethod: REVENUE_PAYMENT_METHOD_LABELS[dto.paymentMethod] ?? dto.paymentMethod,
    timestamp: dateStr,
    status: 'Completed',
    warehouseId: dto.warehouseId,
    warehouseName: dto.warehouseName,
  };
}

export function mapRevenueDetail(dto: FinanceRevenueDetailDto): RevenueDetail {
  const amountPaise = parseSignedMoneyToPaise(dto.amount);
  const amountDisplay = formatPaise(amountPaise).replace(/^₹/, '');
  const now = new Date();
  const dateStr = dto.completedAt ? formatAdminDate(dto.completedAt, now) : '';

  return {
    revenueId: dto.id,
    orderId: dto.orderNumber,
    invoiceId: dto.invoiceNumber ?? undefined,
    customer: undefined,
    salesChannel: CHANNEL_DISPLAY_NAMES[dto.channel] ?? dto.channel,
    finalAmount: amountDisplay,
    paymentMethod: REVENUE_PAYMENT_METHOD_LABELS[dto.paymentMethod] ?? dto.paymentMethod,
    paymentStatus: 'PAID',
    transactionDate: dateStr,
    warehouseName: dto.warehouseName,
  };
}

export interface CashCloseMapped {
  id: string;
  closeNumber: string;
  warehouseId: string;
  date: string;
  openingCashPaise: Paise;
  cashSalesPaise: Paise;
  cashTopUpsPaise: Paise;
  cashExpensesPaise: Paise;
  expectedClosingPaise: Paise;
  countedCashPaise: Paise;
  differencePaise: Paise;
  note?: string | null | undefined;
  closedBy: string;
  closedByName?: string | undefined;
  closedAt: string;
}

export function mapCashClose(dto: CashCloseDto): CashCloseMapped {
  const openingCashPaise = parseSignedMoneyToPaise(dto.openingCash);
  const cashSalesPaise = parseSignedMoneyToPaise(dto.cashSales);
  const cashTopUpsPaise = parseSignedMoneyToPaise(dto.cashTopUps);
  const cashExpensesPaise = parseSignedMoneyToPaise(dto.cashExpenses);
  const expectedClosingPaise = parseSignedMoneyToPaise(dto.expectedClosing);
  const countedCashPaise = parseSignedMoneyToPaise(dto.countedCash);
  const differencePaise = parseSignedMoneyToPaise(dto.difference);

  return {
    id: dto.id,
    closeNumber: dto.closeNumber,
    warehouseId: dto.warehouseId,
    date: dto.date,
    openingCashPaise,
    cashSalesPaise,
    cashTopUpsPaise,
    cashExpensesPaise,
    expectedClosingPaise,
    countedCashPaise,
    differencePaise,
    note: dto.note,
    closedBy: dto.closedBy,
    closedByName: dto.closedByName,
    closedAt: dto.closedAt,
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

export function mapDailyCashSummary(dto: DailyCashSummaryDto): DailyCashSummaryMapped {
  const openingCashPaise = parseSignedMoneyToPaise(dto.system.openingCash);
  const cashSalesPaise = parseSignedMoneyToPaise(dto.system.cashSales);
  const cashTopUpsPaise = parseSignedMoneyToPaise(dto.system.cashTopUps);
  const cashExpensesPaise = parseSignedMoneyToPaise(dto.system.cashExpenses);
  const expectedClosingPaise = parseSignedMoneyToPaise(dto.system.expectedClosing);

  return {
    date: dto.date,
    warehouseId: dto.warehouseId,
    openingCashPaise,
    openingFrom: dto.system.openingFrom,
    cashSalesPaise,
    cashTopUpsPaise,
    cashExpensesPaise,
    expectedClosingPaise,
    closed: dto.closed ? mapCashClose(dto.closed) : null,
  };
}

export function mapExpenseVoucher(dto: ExpenseVoucherDto): VoucherRecord {
  const amountPaise = parseSignedMoneyToPaise(dto.amount);
  const dateStr = dto.expenseDate ? formatAdminDay(dto.expenseDate) : '';

  return {
    id: dto.voucherNumber,
    type: 'Expense',
    title: `Expense Voucher · ${dto.categoryName}`,
    amount: amountPaise,
    referenceId: dto.expenseNumber,
    date: dateStr,
    status: 'Recorded',
    paymentMethod: mapExpensePaymentMethod(dto.paymentMethod),
    createdBy: dto.recordedByName ?? dto.recordedBy,
    warehouseId: dto.warehouseId,
    warehouseName: dto.warehouseName,
    notes: dto.description,
  };
}

/**
 * BR-30: Sub Warehouse Admin is strictly scoped to scope.warehouseId.
 * Main Warehouse Admin may filter by selected warehouse or view all (undefined).
 */
export function financeWarehouseFilter(scope: WarehouseScope, selectedWarehouseId?: string): string | undefined {
  if (scope.warehouseId) {
    return scope.warehouseId;
  }
  return selectedWarehouseId;
}
