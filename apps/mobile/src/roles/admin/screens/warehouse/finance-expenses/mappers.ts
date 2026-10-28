import { parseMoney, toPaise } from '@tohfa/shared-types';
import type {
  ExpenseCategoryDto,
  ExpenseDto,
  ExpenseVoucherDto,
  FinanceRevenueDetailDto,
  FinanceRevenueItemDto,
} from '../../../api/finance';
import type {
  ExpenseCategoryItem,
  ExpenseRecord,
  RevenueDetail,
  RevenueRecord,
  VoucherRecord,
} from './types';

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

export function rupeesFromMoney(amount: string | number | undefined | null): number {
  if (amount === undefined || amount === null || amount === '') return 0;
  try {
    const money = parseMoney(String(amount));
    return Math.round(toPaise(money) / 100);
  } catch {
    const num = Number(amount);
    return isNaN(num) ? 0 : Math.round(num);
  }
}

export function mapExpenseDtoToRecord(dto: ExpenseDto): ExpenseRecord {
  return {
    id: dto.id,
    categoryRef: dto.category,
    amount: rupeesFromMoney(dto.amount),
    timestamp: formatCalendarDate(dto.expenseDate),
    status: dto.status === 'RECORDED' ? 'Recorded' : 'Pending',
    warehouseId: dto.warehouseId ?? undefined,
    warehouseName: undefined,
  };
}

export function mapRevenueItemDtoToRecord(dto: FinanceRevenueItemDto): RevenueRecord {
  const category =
    dto.channel === 'ONLINE' || dto.channel === 'HORECA' || dto.channel === 'B2B'
      ? 'Orders'
      : dto.channel === 'MARKET'
        ? 'Direct Sales'
        : 'Other';

  return {
    id: dto.orderId,
    orderRef: `Order #${dto.orderId}`,
    category,
    amount: rupeesFromMoney(dto.totalAmount),
    paymentMethod: dto.paymentMethod,
    timestamp: dto.placedAt ? formatCalendarDate(dto.placedAt.slice(0, 10)) : '—',
    status: dto.paymentStatus === 'PAID' ? 'Completed' : dto.paymentStatus === 'REFUNDED' ? 'Refunded' : 'Pending',
    warehouseId: dto.warehouseId,
    warehouseName: undefined,
  };
}

export function mapRevenueDetailDtoToDetail(dto: FinanceRevenueDetailDto): RevenueDetail {
  const rawRupees = rupeesFromMoney(dto.totalAmount);
  return {
    revenueId: dto.orderId,
    orderId: dto.orderId,
    invoiceId: dto.invoiceNumber ?? undefined,
    // BR-16: Customer name / details hidden
    customer: '',
    salesChannel: dto.channel,
    quantity: '—',
    product: '—',
    finalAmount: rawRupees.toLocaleString('en-IN'),
    paymentMethod: dto.paymentMethod,
    paymentStatus: dto.paymentStatus,
    transactionDate: dto.placedAt ? formatCalendarDate(dto.placedAt.slice(0, 10)) : '—',
    warehouseName: undefined,
  };
}

export function mapExpenseCategoryDtoToItem(dto: ExpenseCategoryDto): ExpenseCategoryItem {
  return {
    id: dto.id,
    name: dto.name,
    status: 'Active',
    usedCount: 0,
  };
}

export function mapExpenseVoucherDtoToRecord(dto: ExpenseVoucherDto): VoucherRecord {
  return {
    id: dto.voucherNumber,
    type: 'Expense',
    title: `Expense Voucher · ${dto.category}`,
    amount: rupeesFromMoney(dto.amount),
    referenceId: dto.expenseId,
    date: formatCalendarDate(dto.expenseDate),
    status: 'Recorded',
    warehouseId: dto.warehouse?.id,
    warehouseName: dto.warehouse?.name,
    createdBy: dto.recordedBy?.name,
    paymentMethod: dto.paymentMethod ?? '—',
    notes: dto.description ?? undefined,
  };
}
