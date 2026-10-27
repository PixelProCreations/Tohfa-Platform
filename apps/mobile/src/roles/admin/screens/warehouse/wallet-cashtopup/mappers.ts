import { parseMoney, toPaise, type Money } from '@tohfa/shared-types';
import type { AdminCustomerDetailDto, WalletTransactionDto } from '../../../api/customers';
import type { SaleCustomerMatchDto } from '../../../api/wallet';
import type { TopUpHistoryRow, WalletCustomer, WalletTransactionRecord } from './types';

export function rupeesFromMoney(m: Money | string | number | null | undefined): string {
  if (m === null || m === undefined || m === '') return '₹0';
  let paise = 0;
  if (typeof m === 'number') {
    paise = m;
  } else {
    try {
      paise = toPaise(parseMoney(String(m)));
    } catch {
      const num = parseFloat(String(m));
      paise = isNaN(num) ? 0 : Math.round(num * 100);
    }
  }
  const isNeg = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = Math.floor(absPaise / 100);
  const formatted = rupees.toLocaleString('en-IN');
  return `${isNeg ? '-' : ''}₹${formatted}`;
}

export function formatIstDate(isoStr: string | null | undefined): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoStr;
  }
}

export function formatIstTime(isoStr: string | null | undefined): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoStr;
  }
}

const TXN_TYPE_LABELS: Record<string, string> = {
  TOPUP_CASH: 'Cash Top-Up',
  TOPUP_DIGITAL: 'Digital Top-Up',
  ORDER_DEBIT: 'Purchase',
  ORDER_REFUND: 'Refund',
  PAYOUT_DEBIT: 'Payout',
  SALE_CREDIT: 'Sale Credit',
  SUBSCRIPTION_DEBIT: 'Subscription',
  ADJUSTMENT: 'Adjustment',
};

/**
 * Maps WalletTransactionDto to WalletTransactionRecord.
 * Enforces negative rule: Wallet totals (credited/used) and transaction status -> '—' or hide row.
 */
export function mapWalletTransactionDtoToRecord(
  dto: WalletTransactionDto,
  warehouseName?: string,
): WalletTransactionRecord {
  const dateStr = formatIstDate(dto.performedAt);
  const timeStr = formatIstTime(dto.performedAt);
  const dateTime = dateStr && timeStr ? `${dateStr}, ${timeStr}` : (dto.performedAt ?? '');

  return {
    transactionId: dto.id,
    type: TXN_TYPE_LABELS[dto.txnType] ?? dto.txnType,
    amount: rupeesFromMoney(dto.amount),
    previousBalance: '—',
    newBalance: rupeesFromMoney(dto.balanceAfter),
    // Negative rule: transaction status -> '—'
    status: '—',
    fiscalCashTag: dto.fiscalCashTag ?? undefined,
    referenceId: dto.fiscalCashTag ?? dto.refId ?? undefined,
    dateTime,
    createdAt: dateTime,
    processedBy: dto.performedBy ?? '—',
    warehouseId: dto.warehouseId ?? undefined,
    warehouseName: warehouseName ?? dto.warehouseId ?? undefined,
  };
}

/**
 * Maps WalletTransactionDto to TopUpHistoryRow.
 */
export function mapWalletTransactionDtoToHistoryRow(
  dto: WalletTransactionDto,
  customerName?: string,
  customerId?: string,
): TopUpHistoryRow {
  return {
    id: dto.id,
    customerName: customerName ?? (dto.performedBy || 'Customer'),
    customerId: customerId ?? dto.walletId,
    fiscalTag: dto.fiscalCashTag ?? '—',
    amount: rupeesFromMoney(dto.amount),
    date: formatIstDate(dto.performedAt),
    time: formatIstTime(dto.performedAt),
    status: 'Completed',
    warehouseId: dto.warehouseId ?? '',
  };
}

/**
 * Maps SaleCustomerMatchDto (from lookupCustomers) to WalletCustomer.
 * Enforces negative rule: Wallet totals (credited/used) -> '—' or hide row.
 */
export function mapCustomerLookupMatchToWalletCustomer(dto: SaleCustomerMatchDto): WalletCustomer {
  return {
    name: dto.name,
    id: dto.customerCode,
    customerId: dto.customerId,
    mobile: dto.mobileMasked,
    balance: rupeesFromMoney(dto.walletBalance),
    // Negative rule: totals -> '—'
    totalCredited: '—',
    totalUsed: '—',
  };
}

/**
 * Maps AdminCustomerDetailDto to WalletCustomer.
 * Enforces negative rule: Wallet totals (credited/used) -> '—' or hide row.
 */
export function mapCustomerDetailToWalletCustomer(dto: AdminCustomerDetailDto): WalletCustomer {
  return {
    name: dto.name,
    id: dto.customerCode,
    customerId: dto.id,
    mobile: dto.mobileMasked,
    balance: rupeesFromMoney(dto.walletBalance),
    // Negative rule: totals -> '—'
    totalCredited: '—',
    totalUsed: '—',
  };
}
