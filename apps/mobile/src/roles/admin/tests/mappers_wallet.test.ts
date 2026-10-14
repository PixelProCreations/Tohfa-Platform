/**
 * screens/warehouse/wallet-cashtopup/mappers.ts: the cash top-up form, its
 * request body, the Idempotency-Key per logical top-up, the counter lookup and
 * the error copy.
 *
 * BR-19: the amount is integer paise from the moment it is typed, and the cap
 * (config/businessThresholds, mirroring system_config.cash_topup_cap) is
 * inclusive: exactly the cap passes, one paisa more fails. UX only; the
 * server's 422 CASH_LIMIT_EXCEEDED is the enforcement.
 * BR-18: the fiscal cash tag is required, and its trimmed length follows
 * docs/openapi.yaml CashTopupCreate.fiscalCashTag (3..60).
 *
 * Two server limitations are degraded around, not fixed here:
 *  (a) the BR-91 lookup scope can miss a legitimate first-time customer, so
 *      "no match" says how to proceed instead of "does not exist";
 *  (b) a replayed top-up (same key, same body) answers 409 CONFLICT instead of
 *      the original 201, so a 409 (and an unknown outcome) says "check the
 *      wallet balance before retrying".
 */
import { describe, expect, it } from 'vitest';
import type { Money } from '@tohfa/shared-types';
import { ApiError, NetworkError } from '../../../shell/api/client';
import { createIdempotencyKeyCache } from '../../../shell/api/idempotency';
import { bodyFingerprint } from '../api/hookHelpers';
import type { CashTopupCreate, SaleCustomerMatchDto, WalletTransactionDto } from '../api/wallet';
import { CASH_TOPUP_CAP_PAISE } from '../config/businessThresholds';
import { t } from '../i18n';
import {
  FISCAL_TAG_MAX_LENGTH,
  FISCAL_TAG_MIN_LENGTH,
  LOOKUP_NO_MATCH_KEY,
  TOP_UP_PRESETS_PAISE,
  buildCashTopupBody,
  cashTopupErrorKey,
  cashTopupFingerprint,
  customerLookupQuery,
  customerLookupView,
  isTopUpOutcomeUnknown,
  parseTopUpAmount,
  submitCashTopup,
  toTopUpCustomer,
  toTopUpReceipt,
  topUpCustomerFromWallet,
  topUpWarehouseId,
  validateFiscalTag,
  walletCustomerOf,
} from '../screens/warehouse/wallet-cashtopup/mappers';

const WAREHOUSE = '11111111-1111-4111-8111-111111111111';
const CUSTOMER = '22222222-2222-4222-8222-222222222222';
const OTHER_CUSTOMER = '44444444-4444-4444-8444-444444444444';

function problem(code: string, status: number): ApiError {
  return new ApiError({ type: 'about:blank', title: code, status, code } as never);
}

function body(over: { amountPaise?: number; fiscalCashTag?: string } = {}): CashTopupCreate {
  return buildCashTopupBody({ amountPaise: 200_000, fiscalCashTag: 'COON-0001', warehouseId: WAREHOUSE, ...over });
}

// ─── BR-19: amount ───────────────────────────────────────────────────────────

describe('parseTopUpAmount (BR-19)', () => {
  it('turns typed rupees into exact integer paise', () => {
    expect(parseTopUpAmount('1234.50')).toEqual({ ok: true, paise: 123_450 });
    expect(parseTopUpAmount(' 2,000 ')).toEqual({ ok: true, paise: 200_000 });
    expect(parseTopUpAmount('0.01')).toEqual({ ok: true, paise: 1 });
  });

  it('BR-19: accepts exactly the cap', () => {
    expect(CASH_TOPUP_CAP_PAISE).toBe(1_000_000);
    expect(parseTopUpAmount('10000')).toEqual({ ok: true, paise: CASH_TOPUP_CAP_PAISE });
    expect(parseTopUpAmount('10000.00')).toEqual({ ok: true, paise: CASH_TOPUP_CAP_PAISE });
  });

  it('BR-19: rejects a top-up one paisa above the cash cap', () => {
    const r = parseTopUpAmount('10000.01');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKey).toBe('wallet.topup.error.aboveCap');
  });

  it('BR-19: rejects zero, negative, empty, garbage and 3-decimal amounts', () => {
    for (const text of ['0', '0.00', '-5', '', '   ', 'abc', '10.555', '1e3', '.5']) {
      const r = parseTopUpAmount(text);
      expect(r.ok, text).toBe(false);
      if (!r.ok) expect(r.errorKey, text).toBe('wallet.topup.error.amountInvalid');
    }
  });

  it('BR-19: the cap message shows the cap from config, not a literal', () => {
    expect(t('wallet.topup.error.aboveCap', { cap: '₹10,000' })).toContain('₹10,000');
  });

  it('the design presets are whole rupees in paise, all within the cap', () => {
    for (const p of TOP_UP_PRESETS_PAISE) {
      expect(Number.isSafeInteger(p)).toBe(true);
      expect(p % 100).toBe(0);
      expect(p).toBeLessThanOrEqual(CASH_TOPUP_CAP_PAISE);
    }
  });
});

// ─── BR-18: fiscal tag ───────────────────────────────────────────────────────

describe('validateFiscalTag (BR-18)', () => {
  it('BR-18: rejects a missing or blank fiscal tag', () => {
    for (const text of ['', '    ']) {
      const r = validateFiscalTag(text);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errorKey).toBe('wallet.topup.error.tagRequired');
    }
  });

  it('BR-18: rejects a fiscal tag shorter than 3 characters (after trimming)', () => {
    expect(FISCAL_TAG_MIN_LENGTH).toBe(3);
    const r = validateFiscalTag('  AB  ');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKey).toBe('wallet.topup.error.tagTooShort');
  });

  it('BR-18: rejects a fiscal tag longer than 60 characters', () => {
    expect(FISCAL_TAG_MAX_LENGTH).toBe(60);
    const r = validateFiscalTag('A'.repeat(61));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKey).toBe('wallet.topup.error.tagTooLong');
  });

  it('BR-18: accepts 3 and 60 characters, and sends the trimmed tag', () => {
    expect(validateFiscalTag('ABC')).toEqual({ ok: true, tag: 'ABC' });
    expect(validateFiscalTag('A'.repeat(60))).toEqual({ ok: true, tag: 'A'.repeat(60) });
    expect(validateFiscalTag('  OOTY-0042 ')).toEqual({ ok: true, tag: 'OOTY-0042' });
  });
});

// ─── Warehouse (BR-30) and body ──────────────────────────────────────────────

describe('topUpWarehouseId (BR-30)', () => {
  it('a Sub scope is always its own warehouse uuid, whatever was selected', () => {
    expect(topUpWarehouseId({ warehouseId: WAREHOUSE }, OTHER_CUSTOMER)).toBe(WAREHOUSE);
  });

  it('the all-warehouses scope needs a selected warehouse uuid; a sample code is not one', () => {
    expect(topUpWarehouseId({}, WAREHOUSE)).toBe(WAREHOUSE);
    expect(topUpWarehouseId({}, 'WH-OOTY')).toBeNull();
    expect(topUpWarehouseId({}, undefined)).toBeNull();
  });
});

describe('buildCashTopupBody', () => {
  it('BR-19: the amount is the openapi Money decimal string of the exact paise', () => {
    expect(buildCashTopupBody({ amountPaise: 123_456, fiscalCashTag: 'TAG-1', warehouseId: WAREHOUSE })).toEqual({
      amount: '1234.56',
      warehouseId: WAREHOUSE,
      fiscalCashTag: 'TAG-1',
    });
    expect(buildCashTopupBody({ amountPaise: CASH_TOPUP_CAP_PAISE, fiscalCashTag: 'TAG-1', warehouseId: WAREHOUSE }).amount).toBe('10000.00');
    expect(buildCashTopupBody({ amountPaise: 1, fiscalCashTag: 'TAG-1', warehouseId: WAREHOUSE }).amount).toBe('0.01');
  });
});

// ─── Idempotency (root CLAUDE.md 2.4) ────────────────────────────────────────

describe('one Idempotency-Key per logical top-up', () => {
  /** What useIdempotencyKey().keyFor does, with a counting generator. */
  function keyRing() {
    let n = 0;
    const cache = createIdempotencyKeyCache(() => `key-${++n}`);
    return { keyFor: (b: unknown) => cache.keyFor(bodyFingerprint(b)), reset: () => cache.reset() };
  }

  it('a retry of the same body for the same customer reuses its key', () => {
    const ring = keyRing();
    const first = ring.keyFor(cashTopupFingerprint(CUSTOMER, body()));
    expect(ring.keyFor(cashTopupFingerprint(CUSTOMER, body()))).toBe(first);
  });

  it('a changed amount, tag or customer gets a fresh key', () => {
    const ring = keyRing();
    const first = ring.keyFor(cashTopupFingerprint(CUSTOMER, body()));
    const amount = ring.keyFor(cashTopupFingerprint(CUSTOMER, body({ amountPaise: 200_001 })));
    expect(amount).not.toBe(first);
    const tag = ring.keyFor(cashTopupFingerprint(CUSTOMER, body({ fiscalCashTag: 'COON-0002' })));
    expect(tag).not.toBe(amount);
    const customer = ring.keyFor(cashTopupFingerprint(OTHER_CUSTOMER, body({ fiscalCashTag: 'COON-0002' })));
    expect(customer).not.toBe(tag);
  });

  it('submitCashTopup sends the same key on a retry of the same body, and a new one for a changed body', async () => {
    const ring = keyRing();
    const sent: { customerId: string; body: CashTopupCreate; key: string }[] = [];
    let fail = true;
    const post = async (customerId: string, b: CashTopupCreate, key: string) => {
      sent.push({ customerId, body: b, key });
      if (fail) throw new NetworkError(new Error('timeout'));
      return {} as WalletTransactionDto;
    };
    await expect(submitCashTopup({ customerId: CUSTOMER, body: body() }, { keyFor: ring.keyFor, post })).rejects.toBeInstanceOf(NetworkError);
    fail = false;
    await submitCashTopup({ customerId: CUSTOMER, body: body() }, { keyFor: ring.keyFor, post });
    await submitCashTopup({ customerId: CUSTOMER, body: body({ fiscalCashTag: 'COON-0002' }) }, { keyFor: ring.keyFor, post });
    expect(sent[0]?.key).toBe('key-1');
    expect(sent[1]?.key).toBe('key-1');
    expect(sent[2]?.key).toBe('key-2');
    expect(sent[0]?.customerId).toBe(CUSTOMER);
  });
});

// ─── Lookup ──────────────────────────────────────────────────────────────────

describe('customerLookupQuery', () => {
  it('a full mobile number is the exact `mobile` match', () => {
    expect(customerLookupQuery('9876543210')).toEqual({ mobile: '9876543210' });
    expect(customerLookupQuery('+91 98765 43210')).toEqual({ mobile: '+919876543210' });
  });

  it('anything else of 2..100 characters is `q` (name, code or 4+ mobile digits)', () => {
    expect(customerLookupQuery('  ravi ')).toEqual({ q: 'ravi' });
    expect(customerLookupQuery('CUS-00291')).toEqual({ q: 'CUS-00291' });
    expect(customerLookupQuery('3210')).toEqual({ q: '3210' });
    expect(customerLookupQuery('x'.repeat(150))).toEqual({ q: 'x'.repeat(100) });
  });

  it('nothing is sent for fewer than 2 characters (the server answers 422)', () => {
    expect(customerLookupQuery('')).toBeNull();
    expect(customerLookupQuery(' a ')).toBeNull();
  });
});

describe('customerLookupView', () => {
  it('known server limitation (a), BR-91 lookup scoping: an empty result is "no match", worded with what to do next', () => {
    expect(customerLookupView({ hasQuery: true, isLoading: false, error: null, itemCount: 0 })).toBe('noMatch');
    const message = t(LOOKUP_NO_MATCH_KEY);
    expect(message).toMatch(/place an order here first/i);
    expect(message).toMatch(/check the number/i);
    expect(message).not.toMatch(/does not exist/i);
  });

  it('idle before a query, then loading, error and ready', () => {
    expect(customerLookupView({ hasQuery: false, isLoading: false, error: null, itemCount: 0 })).toBe('idle');
    expect(customerLookupView({ hasQuery: true, isLoading: true, error: null, itemCount: 0 })).toBe('loading');
    expect(customerLookupView({ hasQuery: true, isLoading: false, error: new Error('x'), itemCount: 0 })).toBe('error');
    expect(customerLookupView({ hasQuery: true, isLoading: false, error: null, itemCount: 2 })).toBe('ready');
  });
});

describe('toTopUpCustomer (BR-92)', () => {
  const match: SaleCustomerMatchDto = {
    customerId: CUSTOMER,
    customerCode: 'CUS-00291',
    name: 'Ravi Kumar',
    mobileMasked: '******3210',
    walletBalance: '4500.50' as Money,
  };

  it('keeps the uuid apart from the code, the mobile masked as sent, and the balance in paise', () => {
    expect(toTopUpCustomer(match)).toEqual({
      customerUuid: CUSTOMER,
      code: 'CUS-00291',
      name: 'Ravi Kumar',
      mobileMasked: '******3210',
      balancePaise: 450_050,
    });
  });

  it('a malformed balance is unknown, never a guess', () => {
    expect(toTopUpCustomer({ ...match, walletBalance: 'n/a' as Money }).balancePaise).toBeNull();
  });

  it('round-trips through the wallet route params by uuid; no uuid means no live customer', () => {
    const c = toTopUpCustomer(match);
    expect(topUpCustomerFromWallet(walletCustomerOf(c))).toEqual(c);
    expect(topUpCustomerFromWallet({ name: 'Ravi', id: 'CUS-00291' })).toBeNull();
    expect(topUpCustomerFromWallet(undefined)).toBeNull();
  });
});

// ─── Errors ──────────────────────────────────────────────────────────────────

describe('cashTopupErrorKey', () => {
  it('known server limitation (b): a 409 CONFLICT on the top-up says it may already have gone through', () => {
    const key = cashTopupErrorKey(problem('CONFLICT', 409));
    expect(key).toBe('wallet.topup.error.mayHaveGoneThrough');
    expect(t(key)).toMatch(/may have already gone through/i);
    expect(t(key)).toMatch(/check the wallet balance before retrying/i);
    expect(isTopUpOutcomeUnknown(problem('CONFLICT', 409))).toBe(true);
  });

  it('a timeout or lost connection is an unknown outcome too: check before retrying', () => {
    const err = new NetworkError(new Error('aborted'));
    expect(cashTopupErrorKey(err)).toBe('wallet.topup.error.outcomeUnknown');
    expect(isTopUpOutcomeUnknown(err)).toBe(true);
    expect(isTopUpOutcomeUnknown(problem('INTERNAL', 500))).toBe(true);
  });

  it('a definite refusal defers to the admin error copy (cap, tag, scope)', () => {
    expect(cashTopupErrorKey(problem('CASH_LIMIT_EXCEEDED', 422))).toBe('admin.error.CASH_LIMIT_EXCEEDED');
    expect(cashTopupErrorKey(problem('FISCAL_TAG_REQUIRED', 422))).toBe('admin.error.FISCAL_TAG_REQUIRED');
    expect(cashTopupErrorKey(problem('WAREHOUSE_SCOPE_VIOLATION', 403))).toBe('admin.error.WAREHOUSE_SCOPE_VIOLATION');
    expect(isTopUpOutcomeUnknown(problem('CASH_LIMIT_EXCEEDED', 422))).toBe(false);
  });
});

// ─── Receipt ─────────────────────────────────────────────────────────────────

describe('toTopUpReceipt (BR-18: the server ledger row, not the client draft)', () => {
  const dto: WalletTransactionDto = {
    id: '55555555-5555-4555-8555-555555555555',
    walletId: '66666666-6666-4666-8666-666666666666',
    txnType: 'TOPUP_CASH',
    amount: '2000.00' as Money,
    balanceAfter: '6500.50' as Money,
    refType: 'TOPUP',
    refId: '77777777-7777-4777-8777-777777777777',
    fiscalCashTag: 'COON-0001',
    warehouseId: WAREHOUSE,
    performedBy: '88888888-8888-4888-8888-888888888888',
    performedAt: '2026-10-14T05:12:00.000Z',
    remarks: null,
  };
  const customer = { customerUuid: CUSTOMER, code: 'CUS-00291', name: 'Ravi Kumar', mobileMasked: '******3210', balancePaise: 1 };

  it('shows the server amount, new balance, transaction id and tag; previous balance is exact paise', () => {
    const r = toTopUpReceipt(dto, customer, 'Coonoor');
    expect(r.transactionId).toBe(dto.id);
    expect(r.amount).toBe('₹2,000');
    expect(r.newBalance).toBe('₹6,500.50');
    expect(r.previousBalance).toBe('₹4,500.50');
    expect(r.fiscalCashTag).toBe('COON-0001');
    expect(r.customerName).toBe('Ravi Kumar');
    expect(r.customerId).toBe('CUS-00291');
    expect(r.warehouseName).toBe('Coonoor');
    expect(r.dateTime).not.toBe('');
  });
});
