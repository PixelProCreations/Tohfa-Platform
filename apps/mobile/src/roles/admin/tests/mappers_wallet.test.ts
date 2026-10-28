import { describe, expect, it } from 'vitest';
import type { Money } from '@tohfa/shared-types';
import type { WalletTransactionDto } from '../api/customers';
import type { SaleCustomerMatchDto } from '../api/wallet';
import {
  mapCustomerLookupMatchToWalletCustomer,
  mapWalletTransactionDtoToHistoryRow,
  mapWalletTransactionDtoToRecord,
} from '../screens/warehouse/wallet-cashtopup/mappers';

describe('wallet-cashtopup mappers', () => {
  it('maps WalletTransactionDto to WalletTransactionRecord with negative rules enforced', () => {
    const dto: WalletTransactionDto = {
      id: 'txn-12345',
      walletId: 'wal-001',
      txnType: 'TOPUP_CASH',
      amount: '2000.00' as Money,
      balanceAfter: '4500.00' as Money,
      refType: null,
      refId: null,
      fiscalCashTag: 'FC-20260925-0012',
      warehouseId: 'WH-COON',
      performedBy: 'SWA - Suresh',
      performedAt: '2026-09-25T05:12:00.000Z',
      remarks: 'Counter cash',
    };

    const record = mapWalletTransactionDtoToRecord(dto, 'Coonoor Warehouse');

    expect(record.transactionId).toBe('txn-12345');
    expect(record.type).toBe('Cash Top-Up');
    expect(record.amount).toContain('2,000');
    expect(record.newBalance).toContain('4,500');
    // Negative rule: wallet transaction status is '—' or hidden
    expect(record.status).toBe('—');
    expect(record.fiscalCashTag).toBe('FC-20260925-0012');
    expect(record.warehouseId).toBe('WH-COON');
    expect(record.warehouseName).toBe('Coonoor Warehouse');
  });

  it('maps WalletTransactionDto to TopUpHistoryRow correctly', () => {
    const dto: WalletTransactionDto = {
      id: 'txn-12345',
      walletId: 'wal-001',
      txnType: 'TOPUP_CASH',
      amount: '1000.00' as Money,
      balanceAfter: '3500.00' as Money,
      refType: null,
      refId: null,
      fiscalCashTag: 'FC-999',
      warehouseId: 'WH-OOTY',
      performedBy: 'MWA - Admin',
      performedAt: '2026-09-25T04:45:00.000Z',
      remarks: null,
    };

    const row = mapWalletTransactionDtoToHistoryRow(dto, 'Ravi Kumar', 'CUS-001245');

    expect(row.id).toBe('txn-12345');
    expect(row.customerName).toBe('Ravi Kumar');
    expect(row.customerId).toBe('CUS-001245');
    expect(row.fiscalTag).toBe('FC-999');
    expect(row.amount).toContain('1,000');
    expect(row.warehouseId).toBe('WH-OOTY');
  });

  it('maps SaleCustomerMatchDto enforcing negative rule (totals are —)', () => {
    const match: SaleCustomerMatchDto = {
      customerId: 'cus-123',
      customerCode: 'CUS-001245',
      name: 'Ravi Kumar',
      mobileMasked: '******4321',
      walletBalance: '4500.00' as Money,
    };

    const walletCustomer = mapCustomerLookupMatchToWalletCustomer(match);

    expect(walletCustomer.name).toBe('Ravi Kumar');
    expect(walletCustomer.id).toBe('CUS-001245');
    expect(walletCustomer.mobile).toBe('******4321');
    expect(walletCustomer.balance).toContain('4,500');
    // Negative rule: wallet totals (credited/used) -> '—'
    expect(walletCustomer.totalCredited).toBe('—');
    expect(walletCustomer.totalUsed).toBe('—');
  });
});
