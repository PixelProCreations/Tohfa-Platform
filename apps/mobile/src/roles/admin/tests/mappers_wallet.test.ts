import { describe, expect, it } from 'vitest';
import { ApiError, NetworkError } from '../../../shell/api/client';
import { WALLET_TRANSACTION_TYPES, type WalletTransactionDto } from '../api/wallet';
import { CASH_TOPUP_CAP_PAISE } from '../config/businessThresholds';
import { isTranslationKey } from '../i18n';
import {
  FISCAL_TAG_MAX_LENGTH,
  FISCAL_TAG_MIN_LENGTH,
  REMARKS_MAX_LENGTH,
  buildCashTopupBody,
  cashTopupErrorKey,
  cashTopupIdempotencyFingerprint,
  cashTopupInvalidationKeys,
  emptyCashTopupForm,
  toCashTopupResult,
  validateCashTopupForm,
  walletTxnTypeLabelKey,
  type CashTopupForm,
} from '../screens/warehouse/wallet/mappers';

const WAREHOUSE = '3f1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a01';
const CUSTOMER = '6f0c2d1e-1111-4222-8333-944455556666';

function form(over: Partial<CashTopupForm> = {}): CashTopupForm {
  return { ...emptyCashTopupForm(), amountText: '500', fiscalTag: 'COON-0001', ...over };
}

function problem(code: string, status: number): ApiError {
  return new ApiError({ type: 'about:blank', title: code, status, code } as never);
}

describe('validateCashTopupForm — amount (BR-19)', () => {
  it('parses the amount to integer paise, never a float', () => {
    const r = validateCashTopupForm(form({ amountText: ' 1234.50 ' }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.amountPaise).toBe(123450);
  });

  it('rejects empty, malformed, negative, zero and 3-decimal amounts', () => {
    for (const amountText of ['', '  ', 'abc', '-5', '0', '0.00', '10.555', '1e3']) {
      const r = validateCashTopupForm(form({ amountText }));
      expect(r.ok, amountText).toBe(false);
      if (!r.ok) expect(r.errors.amount, amountText).toBe('admin.wallet.topup.errors.amountInvalid');
    }
  });

  it('BR-19: Rs 10,000.00 exactly is accepted (the cap is inclusive)', () => {
    const r = validateCashTopupForm(form({ amountText: '10000.00' }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.amountPaise).toBe(CASH_TOPUP_CAP_PAISE);
  });

  it('BR-19: Rs 10,000.01 is refused before submit with the cap message', () => {
    const r = validateCashTopupForm(form({ amountText: '10000.01' }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.amount).toBe('admin.wallet.topup.errors.amountAboveCap');
  });
});

describe('validateCashTopupForm — fiscal cash tag (BR-18)', () => {
  it('BR-18: a missing or blank fiscal cash tag is refused (FISCAL_TAG_REQUIRED copy)', () => {
    for (const fiscalTag of ['', '   ']) {
      const r = validateCashTopupForm(form({ fiscalTag }));
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errors.fiscalTag).toBe('admin.errors.FISCAL_TAG_REQUIRED');
    }
  });

  it('BR-18: the tag length follows CashTopupCreate.fiscalCashTag (minLength 3, maxLength 60), measured after trimming', () => {
    expect(FISCAL_TAG_MIN_LENGTH).toBe(3);
    expect(FISCAL_TAG_MAX_LENGTH).toBe(60);
    const short = validateCashTopupForm(form({ fiscalTag: ' AB ' }));
    expect(short.ok).toBe(false);
    if (!short.ok) expect(short.errors.fiscalTag).toBe('admin.wallet.topup.errors.fiscalTagTooShort');
    expect(validateCashTopupForm(form({ fiscalTag: 'ABC' })).ok).toBe(true);
    expect(validateCashTopupForm(form({ fiscalTag: 'A'.repeat(60) })).ok).toBe(true);
    const long = validateCashTopupForm(form({ fiscalTag: 'A'.repeat(61) }));
    expect(long.ok).toBe(false);
    if (!long.ok) expect(long.errors.fiscalTag).toBe('admin.wallet.topup.errors.fiscalTagTooLong');
  });

  it('remarks are optional and bounded by CashTopupCreate.remarks maxLength 300', () => {
    expect(REMARKS_MAX_LENGTH).toBe(300);
    expect(validateCashTopupForm(form({ remarks: 'x'.repeat(300) })).ok).toBe(true);
    const r = validateCashTopupForm(form({ remarks: 'x'.repeat(301) }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.remarks).toBe('admin.wallet.topup.errors.remarksTooLong');
  });

  it('reports every invalid field at once', () => {
    const r = validateCashTopupForm(form({ amountText: '', fiscalTag: '' }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['amount', 'fiscalTag']);
  });
});

describe('buildCashTopupBody', () => {
  it('BR-30: carries the scope warehouse, the amount as a Money string from paise, and the trimmed tag', () => {
    const r = validateCashTopupForm(form({ amountText: '1234.5', fiscalTag: '  COON-7  ', remarks: '' }));
    if (!r.ok) throw new Error('expected valid');
    expect(buildCashTopupBody(r.value, WAREHOUSE)).toEqual({
      amount: '1234.50',
      warehouseId: WAREHOUSE,
      fiscalCashTag: 'COON-7',
    });
  });

  it('includes trimmed remarks only when non-blank', () => {
    const r = validateCashTopupForm(form({ remarks: '  counter 2 ' }));
    if (!r.ok) throw new Error('expected valid');
    expect(buildCashTopupBody(r.value, WAREHOUSE).remarks).toBe('counter 2');
  });

  it('the idempotency fingerprint includes the customer (the path), so another customer never replays this key', () => {
    const r = validateCashTopupForm(form());
    if (!r.ok) throw new Error('expected valid');
    const b = buildCashTopupBody(r.value, WAREHOUSE);
    expect(cashTopupIdempotencyFingerprint(CUSTOMER, b)).toEqual({ customerId: CUSTOMER, ...b });
  });
});

describe('cashTopupInvalidationKeys', () => {
  it('invalidates wallet, customers and daily-summary under the scope warehouse only', () => {
    expect(cashTopupInvalidationKeys(WAREHOUSE)).toEqual([
      ['admin', 'wh', WAREHOUSE, 'wallet'],
      ['admin', 'wh', WAREHOUSE, 'customers'],
      ['admin', 'wh', WAREHOUSE, 'dailySummary'],
    ]);
  });
});

describe('toCashTopupResult', () => {
  const dto: WalletTransactionDto = {
    id: '9e8d7c6b-5a49-4382-8716-a5b4c3d2e1f0',
    walletId: '1a2b3c4d-5e6f-4708-8192-a3b4c5d6e7f8',
    txnType: 'TOPUP_CASH',
    amount: '5000.00',
    balanceAfter: '6250.50',
    refType: 'TOPUP',
    refId: '2b3c4d5e-6f70-4812-8934-5a6b7c8d9e0f',
    fiscalCashTag: 'COON-0001',
    warehouseId: WAREHOUSE,
    performedBy: null,
    performedAt: '2026-10-13T10:15:00.000Z',
    remarks: null,
  };

  it('BR-18: shows the server ledger row id and amounts in paise (the client never asserts the credit)', () => {
    expect(toCashTopupResult(dto)).toEqual({
      transactionId: dto.id,
      topupId: dto.refId,
      amountPaise: 500000,
      balanceAfterPaise: 625050,
      fiscalCashTag: 'COON-0001',
      performedAt: dto.performedAt,
      txnTypeKey: 'admin.wallet.txnType.TOPUP_CASH',
    });
  });

  it('throws on a malformed server amount instead of rounding it', () => {
    expect(() => toCashTopupResult({ ...dto, amount: '50.005' })).toThrow();
  });
});

describe('walletTxnTypeLabelKey', () => {
  it('maps every WalletTransactionType to a catalogue key, and an unknown one to a fallback', () => {
    for (const type of WALLET_TRANSACTION_TYPES) {
      expect(isTranslationKey(walletTxnTypeLabelKey(type)), type).toBe(true);
    }
    expect(walletTxnTypeLabelKey('SOMETHING_NEW')).toBe('admin.wallet.txnType.unknown');
  });
});

describe('cashTopupErrorKey', () => {
  it('BR-19: 422 CASH_LIMIT_EXCEEDED from the server (the enforcement) has its own copy', () => {
    expect(cashTopupErrorKey(problem('CASH_LIMIT_EXCEEDED', 422))).toBe('admin.errors.CASH_LIMIT_EXCEEDED');
  });

  it('BR-18: 422 FISCAL_TAG_REQUIRED has its own copy', () => {
    expect(cashTopupErrorKey(problem('FISCAL_TAG_REQUIRED', 422))).toBe('admin.errors.FISCAL_TAG_REQUIRED');
  });

  it('409 CONFLICT (fiscal tag already used — possibly this same top-up already went through) warns to check before retrying', () => {
    expect(cashTopupErrorKey(problem('CONFLICT', 409))).toBe('admin.wallet.topup.errors.CONFLICT');
  });

  it('404 says the customer wallet was not found, not a generic record', () => {
    expect(cashTopupErrorKey(problem('NOT_FOUND', 404))).toBe('admin.wallet.topup.errors.NOT_FOUND');
  });

  it('network/timeout errors warn that the top-up may have gone through (retry reuses the key)', () => {
    expect(cashTopupErrorKey(new NetworkError('offline'))).toBe('admin.wallet.topup.errors.uncertain');
  });

  it('every key it can return exists in the catalogue', () => {
    for (const e of [
      problem('CASH_LIMIT_EXCEEDED', 422),
      problem('CONFLICT', 409),
      problem('NOT_FOUND', 404),
      problem('WAREHOUSE_SCOPE_VIOLATION', 403),
      problem('WHATEVER', 500),
      new NetworkError('x'),
      new Error('x'),
    ]) {
      expect(isTranslationKey(cashTopupErrorKey(e))).toBe(true);
    }
  });
});
