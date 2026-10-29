/**
 * Wallet & cash top-up decisions (screens/warehouse/wallet-cashtopup/mappers.ts),
 * kept pure so plain-Node vitest covers them. Named with the rule they guard
 * (docs/rules.md BR-18, BR-19, BR-30, BR-74, BR-91i; root CLAUDE.md 2.2 / 2.4).
 */
import { describe, expect, it } from 'vitest';
import type { Money, Paise } from '@tohfa/shared-types';
import { ApiError, NetworkError } from '../../../shell/api/client';
import { createIdempotencyKeyCache } from '../../../shell/api/idempotency';
import { bodyFingerprint } from '../api/hookHelpers';
import type { WalletTransactionDto } from '../api/customers';
import type { SystemCashFiguresDto } from '../api/finance';
import {
  buildCashTopupRequest,
  cashTopupErrorKey,
  cashTopupLookupQuery,
  dailyCashView,
  dailySummaryGate,
  formatWalletMoney,
  isUuid,
  mapWalletTransactionDtoToHistoryRow,
  mapWalletTransactionDtoToRecord,
  moneyToPaise,
  submitCashTopup,
  toDailyCashFigures,
  walletCustomerFromSearch,
} from '../screens/warehouse/wallet-cashtopup/mappers';
import type { CashTopUpDraft } from '../screens/warehouse/wallet-cashtopup/types';

const CUSTOMER_UUID = '6f1c2a8e-3b4d-4e5f-8a9b-0c1d2e3f4a5b';
const WAREHOUSE_UUID = '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
const OTHER_WAREHOUSE_UUID = '1b2c3d4e-5f6a-4b7c-9d8e-0f1a2b3c4d5e';
const ADMIN_UUID = '9e8d7c6b-5a4f-4e3d-8c2b-1a0f9e8d7c6b';

function draft(overrides: Partial<CashTopUpDraft> = {}): CashTopUpDraft {
  return {
    customerName: 'Ravi Kumar',
    customerCode: 'CUS-001245',
    customerId: CUSTOMER_UUID,
    currentBalancePaise: 450_000,
    topUpAmountPaise: 150_050,
    warehouseId: WAREHOUSE_UUID,
    warehouseName: 'Ooty',
    channel: 'Cash',
    fiscalCashTag: '  FTAG-2026-0042 ',
    ...overrides,
  };
}

function problem(status: number, code: string): ApiError {
  return new ApiError({ type: 'about:blank', title: code, status, code } as ConstructorParameters<typeof ApiError>[0]);
}

describe('cash top-up confirm gate', () => {
  it('BR-18: cash top-up confirm is blocked unless customerId and warehouseId are UUIDs', () => {
    // The customer code is a display field, never a path id (it used to be the fallback -> 422).
    expect(buildCashTopupRequest(draft({ customerId: undefined }), {})).toEqual({ ok: false, reason: 'customer' });
    expect(buildCashTopupRequest(draft({ customerId: 'CUS-001245' }), {})).toEqual({ ok: false, reason: 'customer' });
    // An empty warehouse used to be sent as '' (-> 422); a fixture code is not a uuid either.
    expect(buildCashTopupRequest(draft({ warehouseId: undefined }), {})).toEqual({ ok: false, reason: 'warehouse' });
    expect(buildCashTopupRequest(draft({ warehouseId: '' }), {})).toEqual({ ok: false, reason: 'warehouse' });
    expect(buildCashTopupRequest(draft({ warehouseId: 'WH-OOTY' }), {})).toEqual({ ok: false, reason: 'warehouse' });
  });

  it('BR-18: the fiscal cash tag is required (trimmed) and sent as typed, never invented', () => {
    expect(buildCashTopupRequest(draft({ fiscalCashTag: '   ' }), {})).toEqual({ ok: false, reason: 'tag' });
    expect(buildCashTopupRequest(draft({ fiscalCashTag: undefined }), {})).toEqual({ ok: false, reason: 'tag' });
  });

  it('BR-18: a valid draft becomes exactly the CashTopupCreate body, amount from integer paise', () => {
    const result = buildCashTopupRequest(draft(), {});
    expect(result).toEqual({
      ok: true,
      customerId: CUSTOMER_UUID,
      body: { amount: '1500.50', warehouseId: WAREHOUSE_UUID, fiscalCashTag: 'FTAG-2026-0042' },
    });
  });

  it('BR-30: a Sub scope always tops up at its own warehouse, whatever the draft carries', () => {
    const result = buildCashTopupRequest(draft({ warehouseId: OTHER_WAREHOUSE_UUID }), { warehouseId: WAREHOUSE_UUID });
    expect(result.ok && result.body.warehouseId).toBe(WAREHOUSE_UUID);
  });

  it('BR-19: a non-positive amount is blocked, but the client holds no cap: Rs 10,000.01 is sent and the server decides', () => {
    expect(buildCashTopupRequest(draft({ topUpAmountPaise: 0 }), {})).toEqual({ ok: false, reason: 'amount' });
    expect(buildCashTopupRequest(draft({ topUpAmountPaise: -100 }), {})).toEqual({ ok: false, reason: 'amount' });
    const above = buildCashTopupRequest(draft({ topUpAmountPaise: 1_000_001 }), {});
    expect(above.ok && above.body.amount).toBe('10000.01');
  });
});

describe('cash top-up submit', () => {
  it('BR-18d: a retry of the same top-up reuses its Idempotency-Key, a changed body gets a new one, reset starts fresh', async () => {
    const cache = createIdempotencyKeyCache();
    const keyFor = (fp: unknown) => cache.keyFor(bodyFingerprint(fp));
    const sent: string[] = [];
    const post = (_c: string, _b: unknown, key: string) => {
      sent.push(key);
      return Promise.resolve({} as WalletTransactionDto);
    };
    const req = buildCashTopupRequest(draft(), {});
    if (!req.ok) throw new Error('expected a sendable draft');

    await submitCashTopup(req, { keyFor, post });
    await submitCashTopup(req, { keyFor, post });
    expect(sent[0]).toBe(sent[1]);
    expect(sent[0]).not.toBe('');

    const edited = buildCashTopupRequest(draft({ topUpAmountPaise: 200_000 }), {});
    if (!edited.ok) throw new Error('expected a sendable draft');
    await submitCashTopup(edited, { keyFor, post });
    expect(sent[2]).not.toBe(sent[0]);

    // The same body for another customer is another top-up.
    await submitCashTopup({ ...req, customerId: '7f1c2a8e-3b4d-4e5f-8a9b-0c1d2e3f4a5b' }, { keyFor, post });
    expect(sent[3]).not.toBe(sent[0]);

    cache.reset();
    await submitCashTopup(req, { keyFor, post });
    expect(sent[4]).not.toBe(sent[0]);
  });

  it('BR-19: 422 CASH_LIMIT_EXCEEDED shows the server-side cap message', () => {
    expect(cashTopupErrorKey(problem(422, 'CASH_LIMIT_EXCEEDED'))).toBe('admin.error.CASH_LIMIT_EXCEEDED');
  });

  it('BR-18d: 409 CONFLICT under a new key means the fiscal tag is already used', () => {
    expect(cashTopupErrorKey(problem(409, 'CONFLICT'))).toBe('wallet.topup.error.tagUsed');
    expect(cashTopupErrorKey(problem(422, 'FISCAL_TAG_REQUIRED'))).toBe('admin.error.FISCAL_TAG_REQUIRED');
    expect(cashTopupErrorKey(problem(409, 'IDEMPOTENCY_KEY_REUSED'))).toBe('admin.error.IDEMPOTENCY_KEY_REUSED');
  });

  it('BR-18d: no answer means the top-up may have landed; retrying sends the same key, so it credits once', () => {
    expect(cashTopupErrorKey(new NetworkError('offline'))).toBe('wallet.topup.error.noAnswer');
    expect(cashTopupErrorKey(problem(503, 'INTERNAL'))).toBe('wallet.topup.error.noAnswer');
  });
});

describe('money keeps every paisa', () => {
  it('CLAUDE.md 2.2: Money strings become exact paise; null or garbage is unknown, never 0', () => {
    expect(moneyToPaise('1234.56' as Money)).toBe(123_456);
    expect(moneyToPaise('-750.00')).toBe(-75_000);
    expect(moneyToPaise(null)).toBeNull();
    expect(moneyToPaise('')).toBeNull();
    expect(moneyToPaise('abc')).toBeNull();
  });

  it('CLAUDE.md 2.2: display keeps paise (no Math.floor), unknown is "—" not "₹0"', () => {
    expect(formatWalletMoney('1234.56')).toBe('₹1,234.56');
    expect(formatWalletMoney('2000.00')).toBe('₹2,000');
    expect(formatWalletMoney('-750.00')).toBe('-₹750');
    expect(formatWalletMoney(undefined)).toBe('—');
    expect(formatWalletMoney('not money')).toBe('—');
  });

  it('BR-74: daily cash figures keep every paisa (no Math.floor to rupees)', () => {
    const system: SystemCashFiguresDto = {
      openingCash: '1000.25',
      cashSales: '499.99',
      cashTopUps: '2000.50',
      cashExpenses: '10.01',
      expectedClosing: '3490.73',
    } as SystemCashFiguresDto;
    expect(toDailyCashFigures(system)).toEqual({
      openingCash: 100_025,
      directSales: 49_999,
      cashTopUps: 200_050,
      expenses: 1_001,
      expectedClosing: 349_073,
    });
  });
});

describe('daily cash summary query', () => {
  it('BR-74: the daily summary query is disabled for a Main admin until a warehouse is selected', () => {
    expect(dailySummaryGate({ scope: {}, selectedWarehouseId: undefined, canView: true })).toEqual({
      enabled: false,
      reason: 'selectWarehouse',
    });
    // A fixture code is not a warehouse the server knows (422 on a non-uuid).
    expect(dailySummaryGate({ scope: {}, selectedWarehouseId: 'WH-OOTY', canView: true })).toEqual({
      enabled: false,
      reason: 'selectWarehouse',
    });
    expect(dailySummaryGate({ scope: {}, selectedWarehouseId: WAREHOUSE_UUID, canView: true })).toEqual({
      enabled: true,
      warehouseId: WAREHOUSE_UUID,
    });
  });

  it('BR-30: a Sub admin always asks for its own warehouse', () => {
    expect(
      dailySummaryGate({ scope: { warehouseId: WAREHOUSE_UUID }, selectedWarehouseId: OTHER_WAREHOUSE_UUID, canView: true }),
    ).toEqual({ enabled: true, warehouseId: WAREHOUSE_UUID });
  });

  it('BR-74: without finance.cash_close.manage nothing is fetched', () => {
    expect(dailySummaryGate({ scope: { warehouseId: WAREHOUSE_UUID }, selectedWarehouseId: undefined, canView: false })).toEqual({
      enabled: false,
      reason: 'forbidden',
    });
  });

  it('BR-74: a failed or loading summary is shown as such, never as ₹0', () => {
    const on = { enabled: true as const, warehouseId: WAREHOUSE_UUID };
    expect(dailyCashView({ gate: on, isLoading: true, error: null, hasData: false })).toBe('loading');
    expect(dailyCashView({ gate: on, isLoading: false, error: problem(422, 'VALIDATION_FAILED'), hasData: false })).toBe('error');
    expect(dailyCashView({ gate: on, isLoading: false, error: null, hasData: true })).toBe('ready');
    expect(dailyCashView({ gate: { enabled: false, reason: 'selectWarehouse' }, isLoading: false, error: null, hasData: false })).toBe(
      'selectWarehouse',
    );
    expect(dailyCashView({ gate: { enabled: false, reason: 'forbidden' }, isLoading: false, error: null, hasData: false })).toBe(
      'forbidden',
    );
  });
});

describe('server rows on screen', () => {
  const cashTopupResponse: WalletTransactionDto = {
    id: '3c4d5e6f-7a8b-4c9d-8e0f-1a2b3c4d5e6f',
    walletId: '4d5e6f7a-8b9c-4d0e-9f1a-2b3c4d5e6f7a',
    txnType: 'TOPUP_CASH',
    amount: '1500.50' as Money,
    balanceAfter: '6000.50' as Money,
    refType: 'TOPUP',
    refId: null,
    // The POST cash-topup response carries neither (wallet.service move()).
    fiscalCashTag: null,
    warehouseId: null,
    performedBy: ADMIN_UUID,
    performedAt: '2026-09-25T05:12:00.000Z',
    remarks: null,
  };

  it('BR-18: the receipt shows the server row: absent fiscal tag / warehouse are "—", a user id is never a name', () => {
    const record = mapWalletTransactionDtoToRecord(cashTopupResponse);
    expect(record.amount).toBe('₹1,500.50');
    expect(record.newBalance).toBe('₹6,000.50');
    // balanceAfter - amount of the same ledger row, in integer paise.
    expect(record.previousBalance).toBe('₹4,500');
    expect(record.fiscalCashTag).toBe('—');
    expect(record.warehouseName).toBe('—');
    expect(record.warehouseId).toBeUndefined();
    expect(record.processedBy).toBe('—');
    expect(JSON.stringify(record)).not.toContain(ADMIN_UUID);
  });

  it('BR-18: a history row never uses the acting admin id as the customer name', () => {
    const row = mapWalletTransactionDtoToHistoryRow(cashTopupResponse);
    expect(row.customerName).toBe('—');
    expect(row.fiscalTag).toBe('—');
    expect(JSON.stringify(row)).not.toContain(ADMIN_UUID);
  });

  it('BR-18: a customer opened from search carries its uuid only when it is one', () => {
    const live = walletCustomerFromSearch({ name: 'Ravi', code: 'CUS-1', id: CUSTOMER_UUID, phone: '******4321', balance: '₹4,500.25' });
    expect(live.customerId).toBe(CUSTOMER_UUID);
    expect(live.id).toBe('CUS-1');
    expect(live.balancePaise).toBe(450_025 as Paise);
    const codeOnly = walletCustomerFromSearch({ name: 'Ravi', code: 'CUS-1', id: 'CUS-1', phone: '—', balance: '₹0' });
    expect(codeOnly.customerId).toBeUndefined();
  });
});

describe('counter lookup', () => {
  it('BR-91i: a full mobile number is the exact mobile match, a code is the code, a partial number asks nothing', () => {
    expect(cashTopupLookupQuery('98765 43210')).toEqual({ mobile: '9876543210' });
    expect(cashTopupLookupQuery('+919876543210')).toEqual({ mobile: '+919876543210' });
    expect(cashTopupLookupQuery('CUS-001245')).toEqual({ code: 'CUS-001245' });
    expect(cashTopupLookupQuery('98765')).toBeNull();
    expect(cashTopupLookupQuery('   ')).toBeNull();
  });
});

describe('uuid', () => {
  it('BR-30: only a real uuid is a server id', () => {
    expect(isUuid(CUSTOMER_UUID)).toBe(true);
    expect(isUuid('WH-OOTY')).toBe(false);
    expect(isUuid('')).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });
});
