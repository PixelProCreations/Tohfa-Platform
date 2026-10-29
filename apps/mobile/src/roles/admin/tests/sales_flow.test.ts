/**
 * The counter sale flow's decisions (sales-direct/saleFlow.ts and salesQuery.ts)
 * and what goes on the wire for the sales endpoints (api/sales.ts). Plain-Node
 * vitest; the shell client is mocked so the request paths are pinned exactly.
 *
 * Every rule-bearing test is named with its docs/rules.md id:
 *   BR-85 who may sell, BR-86 one buyer identity / no walk-in wallet,
 *   BR-88 one Idempotency-Key per sale intent, BR-89 the server's quote is the
 *   only total, BR-94 payment method rules, BR-95 products per channel,
 *   BR-98 integer paise.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    request: vi.fn(async () => ({ items: [], page: { nextCursor: null, hasMore: false } })),
  };
});

import { ApiError, request } from '../../../shell/api/client';
import { createIdempotencyKeyCache } from '../../../shell/api/idempotency';
import { bodyFingerprint } from '../api/hookHelpers';
import {
  cancelSale,
  confirmSaleUpiPayment,
  createSale,
  listSaleProducts,
  listSales,
  lookupSaleCustomer,
  type SaleDto,
  type SaleQuoteDto,
} from '../api/sales';
import {
  availablePaymentMethods,
  buildCreateSaleBody,
  buildQuoteRequest,
  canCreateSale,
  cashChangePaise,
  customerLookupParams,
  quoteMatchesCart,
  saleConflictFromError,
  submitSale,
  upiConfirmBody,
  type CartLine,
  type SaleBuyer,
} from '../screens/warehouse/sales-direct/saleFlow';
import { DEFAULT_SALES_FILTERS, salesDateRange, toListSalesParams } from '../screens/warehouse/sales-direct/salesQuery';

const requestMock = vi.mocked(request);
const lastCall = () => requestMock.mock.calls.at(-1) as unknown as [string, Record<string, unknown>];

const P1 = '5f0c3b1a-2222-4333-8444-555566667777';
const P2 = '6a1d4c2b-3333-4444-8555-666677778888';
const WH = '7e57d00d-0000-4000-8000-000000000001';
const CUSTOMER = 'c0ffee00-1111-4222-8333-444455556666';
const SALE = '9c1d2e3f-4a5b-4c6d-8e7f-aabbccddeeff';

const CART: CartLine[] = [
  { key: `${P1}|GRADE_1`, productId: P1, name: 'Tomato', grade: 'GRADE_1', qtyGrams: 2000, unitPrice: '100.10' },
  { key: `${P2}|GRADE_2`, productId: P2, name: 'Carrot', grade: 'GRADE_2', qtyGrams: 1500, unitPrice: '60.00' },
];

const QUOTE: SaleQuoteDto = {
  channel: 'DIRECT',
  lines: [
    { productId: P1, name: 'Tomato', grade: 'GRADE_1', qtyKg: '2.000', unitPrice: '100.10', lineTotal: '200.20' },
    { productId: P2, name: 'Carrot', grade: 'GRADE_2', qtyKg: '1.500', unitPrice: '60.00', lineTotal: '90.00' },
  ],
  totals: { subtotal: '290.20', gst: '14.51', total: '304.71', changeGiven: null },
  gstRatePercent: '5',
  quotedAt: '2026-10-29T05:00:00.000Z',
};

const CUSTOMER_BUYER: SaleBuyer = { kind: 'CUSTOMER', customerId: CUSTOMER, name: 'Ravi', code: 'CUS-100', walletBalance: '500.00' };
const WALK_IN: SaleBuyer = { kind: 'WALK_IN', name: '  Walk-in Kumar  ' };

beforeEach(() => requestMock.mockClear());

// ─── who may sell ─────────────────────────────────────────────────────────────

describe('canCreateSale', () => {
  it('BR-85: a Main Warehouse Admin (sales.sale.create none) is never offered New Sale', () => {
    const mainCan = (code: string) => ['sales.history.view', 'sales.dashboard.view', 'sales.channel.manage'].includes(code);
    expect(canCreateSale(mainCan)).toBe(false);
  });

  it('BR-85g: selling also needs payment.record (the server refuses before any write without it)', () => {
    expect(canCreateSale((c) => c === 'sales.sale.create')).toBe(false);
    expect(canCreateSale((c) => c === 'sales.sale.create' || c === 'payment.record')).toBe(true);
  });

  it('BR-85: sales.channel.manage alone is not the create permission', () => {
    expect(canCreateSale((c) => c === 'sales.channel.manage')).toBe(false);
  });
});

// ─── quote ────────────────────────────────────────────────────────────────────

describe('buildQuoteRequest / quoteMatchesCart', () => {
  it('BR-98: sends kg quantities as exact strings from integer grams, no price', () => {
    const body = buildQuoteRequest('DIRECT', CART, undefined);
    expect(body).toEqual({
      channel: 'DIRECT',
      items: [
        { productId: P1, grade: 'GRADE_1', qtyKg: '2.000' },
        { productId: P2, grade: 'GRADE_2', qtyKg: '1.500' },
      ],
    });
    expect(JSON.stringify(body)).not.toContain('unitPrice');
  });

  it('names the warehouse only when the caller sells for one (an all-scope actor)', () => {
    expect(buildQuoteRequest('MARKET', CART, WH).warehouseId).toBe(WH);
  });

  it('BR-89: a quote is only usable for the exact cart it priced', () => {
    expect(quoteMatchesCart(QUOTE, CART)).toBe(true);
    expect(quoteMatchesCart(QUOTE, [CART[0]!])).toBe(false);
    expect(quoteMatchesCart(QUOTE, [{ ...CART[0]!, qtyGrams: 2500 }, CART[1]!])).toBe(false);
    expect(quoteMatchesCart({ ...QUOTE, channel: 'MARKET' }, CART, 'DIRECT')).toBe(false);
  });
});

// ─── create body ──────────────────────────────────────────────────────────────

describe('buildCreateSaleBody', () => {
  it('BR-89: expectedTotal is the server quote total, never a client sum', () => {
    const r = buildCreateSaleBody({ channel: 'DIRECT', buyer: CUSTOMER_BUYER, cart: CART, quote: QUOTE, payment: { method: 'UPI' } });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.body.expectedTotal).toBe('304.71');
    expect(r.body.items).toEqual(buildQuoteRequest('DIRECT', CART, undefined).items);
  });

  it('BR-89: refuses to build a sale from a quote for a different cart', () => {
    const r = buildCreateSaleBody({ channel: 'DIRECT', buyer: CUSTOMER_BUYER, cart: [CART[0]!], quote: QUOTE, payment: { method: 'UPI' } });
    expect(r).toEqual({ ok: false, errorKey: 'salesDirect.error.quoteStale' });
  });

  it('BR-86: exactly one buyer identity: a customer sends only customer, a walk-in only walkIn', () => {
    const c = buildCreateSaleBody({ channel: 'DIRECT', buyer: CUSTOMER_BUYER, cart: CART, quote: QUOTE, payment: { method: 'WALLET' } });
    expect(c.ok && c.body.customer).toEqual({ customerId: CUSTOMER });
    expect(c.ok && c.body.walkIn).toBeUndefined();
    const w = buildCreateSaleBody({ channel: 'DIRECT', buyer: WALK_IN, cart: CART, quote: QUOTE, payment: { method: 'UPI' } });
    expect(w.ok && w.body.walkIn).toEqual({ name: 'Walk-in Kumar' });
    expect(w.ok && w.body.customer).toBeUndefined();
  });

  it('BR-86: a walk-in cannot pay by wallet', () => {
    const r = buildCreateSaleBody({ channel: 'DIRECT', buyer: WALK_IN, cart: CART, quote: QUOTE, payment: { method: 'WALLET' } });
    expect(r).toEqual({ ok: false, errorKey: 'admin.error.WALKIN_WALLET_NOT_ALLOWED' });
    expect(availablePaymentMethods(WALK_IN)).not.toContain('WALLET');
    expect(availablePaymentMethods(CUSTOMER_BUYER)).toContain('WALLET');
  });

  it('BR-86: a walk-in needs a non-blank name (no invented walk-in customer id)', () => {
    const r = buildCreateSaleBody({ channel: 'DIRECT', buyer: { kind: 'WALK_IN', name: '   ' }, cart: CART, quote: QUOTE, payment: { method: 'UPI' } });
    expect(r).toEqual({ ok: false, errorKey: 'salesDirect.walkIn.nameRequired' });
  });

  it('BR-94: CASH sends the tender as Money; below the total is refused before sending', () => {
    const ok = buildCreateSaleBody({ channel: 'DIRECT', buyer: WALK_IN, cart: CART, quote: QUOTE, payment: { method: 'CASH', cashReceived: '500' } });
    expect(ok.ok && ok.body.payment).toEqual({ method: 'CASH', amountReceived: '500.00' });
    const short = buildCreateSaleBody({ channel: 'DIRECT', buyer: WALK_IN, cart: CART, quote: QUOTE, payment: { method: 'CASH', cashReceived: '304.70' } });
    expect(short).toEqual({ ok: false, errorKey: 'admin.error.PAYMENT_AMOUNT_INSUFFICIENT' });
    const junk = buildCreateSaleBody({ channel: 'DIRECT', buyer: WALK_IN, cart: CART, quote: QUOTE, payment: { method: 'CASH', cashReceived: '3.0.0' } });
    expect(junk).toEqual({ ok: false, errorKey: 'salesDirect.payment.cashInvalid' });
  });

  it('BR-94: CARD needs a non-blank reference; non-CASH methods never send amountReceived', () => {
    const blank = buildCreateSaleBody({ channel: 'DIRECT', buyer: WALK_IN, cart: CART, quote: QUOTE, payment: { method: 'CARD', cardRef: '  ' } });
    expect(blank).toEqual({ ok: false, errorKey: 'salesDirect.payment.cardRefRequired' });
    const card = buildCreateSaleBody({ channel: 'DIRECT', buyer: WALK_IN, cart: CART, quote: QUOTE, payment: { method: 'CARD', cardRef: ' APPR-77 ', cashReceived: '999' } });
    expect(card.ok && card.body.payment).toEqual({ method: 'CARD', cardRef: 'APPR-77' });
  });
});

describe('cashChangePaise', () => {
  it('BR-94b: change is exact integer paise (12 345 total, 20 000 received -> 7 655)', () => {
    expect(cashChangePaise('123.45', '200')).toBe(7655);
    expect(cashChangePaise('304.71', '304.71')).toBe(0);
  });

  it('BR-94a: short or unparseable tender has no change', () => {
    expect(cashChangePaise('304.71', '300')).toBeNull();
    expect(cashChangePaise('304.71', '')).toBeNull();
    expect(cashChangePaise('304.71', 'abc')).toBeNull();
  });
});

describe('upiConfirmBody', () => {
  it('BR-94: the UPI confirm needs a non-blank transaction reference', () => {
    expect(upiConfirmBody('  ')).toEqual({ ok: false, errorKey: 'salesDirect.payment.upiRefRequired' });
    expect(upiConfirmBody(' 4123ABC ')).toEqual({ ok: true, body: { upiTxnRef: '4123ABC' } });
  });
});

// ─── idempotency ──────────────────────────────────────────────────────────────

describe('submitSale', () => {
  const sale = { id: SALE } as SaleDto;

  it('BR-88: a retry of the same sale replays the same Idempotency-Key', async () => {
    let n = 0;
    const cache = createIdempotencyKeyCache(() => `key-${++n}`);
    const keys = { keyFor: (b: unknown) => cache.keyFor(bodyFingerprint(b)) };
    const send = vi.fn(async (_body: unknown, _key: string) => sale);
    const r = buildCreateSaleBody({ channel: 'DIRECT', buyer: CUSTOMER_BUYER, cart: CART, quote: QUOTE, payment: { method: 'UPI' } });
    if (!r.ok) throw new Error('body');
    await submitSale(r.body, keys, send);
    await submitSale({ ...r.body }, keys, send);
    expect(send.mock.calls[0]?.[1]).toBe('key-1');
    expect(send.mock.calls[1]?.[1]).toBe('key-1');
  });

  it('BR-88: a re-quoted total is a new sale intent and gets a new key (no 409 key reuse)', async () => {
    let n = 0;
    const cache = createIdempotencyKeyCache(() => `key-${++n}`);
    const keys = { keyFor: (b: unknown) => cache.keyFor(bodyFingerprint(b)) };
    const send = vi.fn(async (_body: unknown, _key: string) => sale);
    const r = buildCreateSaleBody({ channel: 'DIRECT', buyer: CUSTOMER_BUYER, cart: CART, quote: QUOTE, payment: { method: 'UPI' } });
    if (!r.ok) throw new Error('body');
    await submitSale(r.body, keys, send);
    await submitSale({ ...r.body, expectedTotal: '310.00' }, keys, send);
    expect(send.mock.calls[1]?.[1]).toBe('key-2');
  });

  it('BR-88: createSale sends the key as the Idempotency-Key header', async () => {
    const r = buildCreateSaleBody({ channel: 'DIRECT', buyer: CUSTOMER_BUYER, cart: CART, quote: QUOTE, payment: { method: 'UPI' } });
    if (!r.ok) throw new Error('body');
    await createSale(r.body, 'k-123');
    const [path, init] = lastCall();
    expect(path).toBe('/admin/sales');
    expect(init['idempotencyKey']).toBe('k-123');
    expect(init['method']).toBe('POST');
  });
});

// ─── conflicts ────────────────────────────────────────────────────────────────

describe('saleConflictFromError', () => {
  const problem = (code: string, meta?: Record<string, unknown>) =>
    new ApiError({ type: 'about:blank', title: code, status: 409, code: code as never, ...(meta !== undefined ? { meta } : {}) });

  it('BR-89: SALE_PRICE_CHANGED carries the fresh server quote to re-confirm', () => {
    const fresh = { ...QUOTE, totals: { ...QUOTE.totals, total: '310.00' } };
    expect(saleConflictFromError(problem('SALE_PRICE_CHANGED', { quote: fresh }))).toEqual({ kind: 'price', quote: fresh });
  });

  it('BR-89: SALE_STOCK_CHANGED carries the short lines', () => {
    const lines = [{ productId: P1, grade: 'GRADE_1', requestedQtyKg: '2.000', availableQtyKg: '1.000' }];
    expect(saleConflictFromError(problem('SALE_STOCK_CHANGED', { lines }))).toEqual({ kind: 'stock', lines });
  });

  it('anything else is not a re-quote conflict', () => {
    expect(saleConflictFromError(problem('CONFLICT'))).toBeNull();
    expect(saleConflictFromError(new Error('x'))).toBeNull();
  });
});

// ─── wire ─────────────────────────────────────────────────────────────────────

describe('api/sales.ts wire', () => {
  it('BR-95: the product list always sends the channel (the server requires it)', async () => {
    await listSaleProducts({ channel: 'DIRECT' });
    expect(lastCall()[0]).toBe('/admin/sales/products?channel=DIRECT');
    await listSaleProducts({ channel: 'MARKET', warehouseId: WH });
    expect(lastCall()[0]).toBe(`/admin/sales/products?channel=MARKET&warehouseId=${WH}`);
  });

  it('BR-30: the sales list never sends warehouseId (strict query, the server applies the scope)', async () => {
    await listSales({ from: '2026-10-23', to: '2026-10-29', paymentStatus: 'PAID' });
    expect(lastCall()[0]).toBe('/admin/sales?paymentStatus=PAID&from=2026-10-23&to=2026-10-29');
    expect(lastCall()[0]).not.toContain('warehouseId');
  });

  it('BR-92g: the customer lookup sends exactly one of mobile / code / q', async () => {
    await lookupSaleCustomer({ q: 'ravi' });
    expect(lastCall()[0]).toBe('/admin/sales/customers/lookup?q=ravi');
    expect(customerLookupParams('9876543210')).toEqual({ mobile: '9876543210' });
    expect(customerLookupParams('CUS-100')).toEqual({ q: 'CUS-100' });
    expect(customerLookupParams(' ra ')).toEqual({ q: 'ra' });
    expect(customerLookupParams('r')).toBeNull();
  });

  it('BR-88: UPI confirm and cancel send their Idempotency-Key', async () => {
    await confirmSaleUpiPayment(SALE, { upiTxnRef: 'R1' }, 'k-upi');
    expect(lastCall()[0]).toBe(`/admin/sales/${SALE}/payments/upi/confirm`);
    expect(lastCall()[1]['idempotencyKey']).toBe('k-upi');
    await cancelSale(SALE, {}, 'k-cancel');
    expect(lastCall()[0]).toBe(`/admin/sales/${SALE}/cancel`);
    expect(lastCall()[1]['idempotencyKey']).toBe('k-cancel');
  });
});

// ─── history query ────────────────────────────────────────────────────────────

describe('salesQuery', () => {
  // 2026-10-29 03:00 IST
  const NOW = new Date('2026-10-28T21:30:00.000Z');

  it('date presets are Asia/Kolkata days', () => {
    expect(salesDateRange('TODAY', NOW)).toEqual({ from: '2026-10-29', to: '2026-10-29' });
    expect(salesDateRange('YESTERDAY', NOW)).toEqual({ from: '2026-10-28', to: '2026-10-28' });
    expect(salesDateRange('LAST_7_DAYS', NOW)).toEqual({ from: '2026-10-23', to: '2026-10-29' });
  });

  it('the "Paid" filter is a payment-status filter sent to the server, not a sale-status match', () => {
    const p = toListSalesParams({ ...DEFAULT_SALES_FILTERS, paymentStatus: 'PAID' }, NOW);
    expect(p.paymentStatus).toBe('PAID');
    expect(p.status).toBeUndefined();
  });

  it('maps status, channel and search; ALL sends nothing; never a warehouseId', () => {
    const p = toListSalesParams(
      { ...DEFAULT_SALES_FILTERS, status: 'CANCELLED', channel: 'MARKET', searchQuery: '  SAL-12 ', warehouseId: WH },
      NOW,
    );
    expect(p).toEqual({ status: 'CANCELLED', channel: 'MARKET', q: 'SAL-12', from: '2026-10-29', to: '2026-10-29' });
    const all = toListSalesParams(DEFAULT_SALES_FILTERS, NOW);
    expect(all).toEqual({ from: '2026-10-29', to: '2026-10-29' });
  });
});
