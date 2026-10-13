/**
 * SWA Module 6 (Direct / Market sales), write side: unit tests (no database).
 *
 * Pure arithmetic (BR-94b, BR-95e, BR-98), request schemas (BR-86e, BR-94c, BR-95g), and the service
 * against a mocked repo and a recording transaction (BR-85e, BR-85f, BR-85g, BR-86c, BR-87b,
 * BR-87e, BR-88a, BR-89c, BR-89f, BR-90b, BR-98d, BR-98i). The database properties (atomic
 * rollback, row locks, gap-free invoice numbers, wallet ledger) are proven in sales.db.test.ts.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { fromPaise, parseMoney, RoleCode, ScopeLevel, type Money } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { logger } from '../../logger.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { createInMemoryIdempotencyStore } from '../../test/idempotencyStore.js';
import { newId } from '../../test/factories.js';
import {
  amountForGramsPaise,
  computeTotals,
  drawFefo,
  formatRate,
  gramsToKg,
  gstPaise,
  kgToGrams,
  maskMobile,
  parseRateBasisPoints,
  splitLineAcrossDraws,
} from './sales.math.js';
import type { SaleHeaderRow, SaleRecord, SalesRepo } from './sales.repo.js';
import {
  customerLookupQuery,
  listSaleProductsQuery,
  saleCreateBody,
  saleProductResponse,
  saleQuoteResponse,
  saleResponse,
  type SaleCreateBody,
} from './sales.schema.js';
import { createSalesService, toSale, type SalesServiceDeps } from './sales.service.js';

const OOTY = '10000000-0000-4000-8000-0000000000a1';
const COONOOR = '10000000-0000-4000-8000-0000000000a2';
const PRODUCT = '50000000-0000-4000-8000-000000000001';
const BATCH_A = '60000000-0000-4000-8000-000000000001';
const BATCH_B = '60000000-0000-4000-8000-000000000002';
const CUSTOMER = '40000000-0000-4000-8000-0000000000c1';
const USER = '00000000-0000-4000-8000-0000000000aa';

function subScope(warehouseId = OOTY, permission = 'sales.sale.create'): ResolvedScope {
  return { level: ScopeLevel.OWN, permission, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [warehouseId], zoneIds: [], userId: USER };
}

async function failure(promise: Promise<unknown>): Promise<AppError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof AppError) return error;
    throw error;
  }
  throw new Error('expected an AppError, but the call succeeded');
}

// ===========================================================================
// 1. Arithmetic (no I/O)
// ===========================================================================
describe('sale arithmetic', () => {
  it('BR-98a: with retail_gst_rate_percent = 0 the total equals the subtotal exactly and gst is 0', () => {
    const totals = computeTotals([{ unitPrice: parseMoney('45.50'), grams: 1250 }], 0);
    expect(totals).toEqual({ lineTotals: ['56.88'], subtotal: '56.88', gst: '0.00', total: '56.88' });
  });

  it('BR-98b: at 5% GST, 1999 paise -> 100 (99.95 half up), 1990 -> 100 (99.5 half up), 1989 -> 99; all integers', () => {
    expect(gstPaise(1999, 500)).toBe(100);
    expect(gstPaise(1990, 500)).toBe(100);
    expect(gstPaise(1989, 500)).toBe(99);
    const totals = computeTotals([{ unitPrice: fromPaise(1999), grams: 1000 }], 500);
    expect(totals.total).toBe('20.99');
  });

  it('BR-98c: GST is per invoice: two lines of 1010 paise at 5% give 101 (from 2020), not 102 (per-line half up)', () => {
    const totals = computeTotals(
      [
        { unitPrice: fromPaise(1010), grams: 1000 },
        { unitPrice: fromPaise(1010), grams: 1000 },
      ],
      500,
    );
    expect(totals.gst).toBe('1.01');
    expect(totals.total).toBe('21.21');
  });

  it('BR-98e: property: total = subtotal + gst in integer paise; lines sum to the subtotal; every Money is a 2-decimal string', () => {
    let seed = 42;
    const rand = (n: number): number => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed % n;
    };
    for (let run = 0; run < 500; run += 1) {
      const lines = Array.from({ length: 1 + rand(6) }, () => ({ unitPrice: fromPaise(1 + rand(500_000)), grams: 1 + rand(250_000) }));
      const rate = rand(2_800);
      const totals = computeTotals(lines, rate);
      const toP = (m: string): number => Number(m.replace('.', ''));
      expect(toP(totals.total)).toBe(toP(totals.subtotal) + toP(totals.gst));
      expect(totals.lineTotals.reduce((acc, m) => acc + toP(m), 0)).toBe(toP(totals.subtotal));
      for (const m of [...totals.lineTotals, totals.subtotal, totals.gst, totals.total]) expect(m).toMatch(/^\d+\.\d{2}$/);
    }
  });

  it('BR-94b: CASH change is exact integer paise: total 12345, received 20000 -> 7655', () => {
    expect(fromPaise(20000 - 12345)).toBe('76.55');
  });

  it('weights are integer grams: "1.25" -> 1250 -> "1.250"; a price for grams rounds half up to the paisa', () => {
    expect(kgToGrams('1.25')).toBe(1250);
    expect(kgToGrams('0.001')).toBe(1);
    expect(gramsToKg(1250)).toBe('1.250');
    expect(amountForGramsPaise(4550, 1250)).toBe(5688); // 56.875 -> 56.88
    // grams x paise exceeds 2^53 here; the BigInt path still gives the exact paisa.
    expect(amountForGramsPaise(999_999_999, 999_999_999)).toBe(999_999_998_000_000);
  });

  it('BR-98d (rate parsing): the rate is parsed from the config value without floats; malformed values are rejected', () => {
    expect(parseRateBasisPoints(0)).toBe(0);
    expect(parseRateBasisPoints(5)).toBe(500);
    expect(parseRateBasisPoints(2.5)).toBe(250);
    expect(parseRateBasisPoints('12.34')).toBe(1234);
    expect(parseRateBasisPoints('5.00')).toBe(500);
    for (const bad of [-1, 100, '1.234', 'abc', null, true, Number.NaN]) expect(parseRateBasisPoints(bad)).toBeNull();
    expect(formatRate(500)).toBe('5');
    expect(formatRate(250)).toBe('2.5');
    expect(formatRate(1234)).toBe('12.34');
    expect(formatRate(0)).toBe('0');
  });

  it('BR-95e: FEFO takes the first batch first and spans into the next; the parts sum to the line exactly', () => {
    const draws = drawFefo(
      [
        { batchId: BATCH_A, allocationId: null, sellableGrams: 400 },
        { batchId: BATCH_B, allocationId: null, sellableGrams: 1000 },
      ],
      1000,
    );
    expect(draws).toEqual([
      { batchId: BATCH_A, allocationId: null, grams: 400 },
      { batchId: BATCH_B, allocationId: null, grams: 600 },
    ]);
    const parts = splitLineAcrossDraws(parseMoney('33.33'), draws!);
    expect(parts.reduce((acc, m) => acc + Number(m.replace('.', '')), 0)).toBe(amountForGramsPaise(3333, 1000));
    expect(drawFefo([{ batchId: BATCH_A, allocationId: null, sellableGrams: 999 }], 1000)).toBeNull();
  });

  it('BR-92b / BR-92e: a mobile is masked to * plus its last four digits; four characters or fewer are masked fully', () => {
    expect(maskMobile('+919876543210')).toBe('*********3210');
    expect(maskMobile('1234')).toBe('****');
    expect(maskMobile('12')).toBe('**');
  });
});

// ===========================================================================
// 2. Request schemas (no I/O)
// ===========================================================================
const ITEM = { productId: PRODUCT, grade: 'GRADE_1', qtyKg: '1.000' };
const cashBody = (overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> => ({
  channel: 'DIRECT',
  walkIn: { name: 'Counter Buyer' },
  items: [ITEM],
  expectedTotal: '45.50',
  payment: { method: 'CASH', amountReceived: '50.00' },
  ...overrides,
});

describe('sale request schemas', () => {
  it('BR-86e: a body with both a customer and a walk-in, or with neither, is refused (422)', () => {
    expect(saleCreateBody.safeParse(cashBody()).success).toBe(true);
    expect(saleCreateBody.safeParse(cashBody({ customer: { customerId: CUSTOMER } })).success).toBe(false);
    const neither = cashBody();
    delete neither['walkIn'];
    expect(saleCreateBody.safeParse(neither).success).toBe(false);
  });

  it('BR-94c: CARD without a reference, or with a blank one, is refused; CASH needs amountReceived', () => {
    expect(saleCreateBody.safeParse(cashBody({ payment: { method: 'CARD' } })).success).toBe(false);
    expect(saleCreateBody.safeParse(cashBody({ payment: { method: 'CARD', cardRef: '   ' } })).success).toBe(false);
    expect(saleCreateBody.safeParse(cashBody({ payment: { method: 'CARD', cardRef: 'POS-778' } })).success).toBe(true);
    expect(saleCreateBody.safeParse(cashBody({ payment: { method: 'CASH' } })).success).toBe(false);
  });

  it('BR-89d: the body cannot carry a unit price or a line total (strict), and money/quantities are strings only', () => {
    expect(saleCreateBody.safeParse(cashBody({ items: [{ ...ITEM, unitPrice: '1.00' }] })).success).toBe(false);
    expect(saleCreateBody.safeParse(cashBody({ total: '1.00' })).success).toBe(false);
    expect(saleCreateBody.safeParse(cashBody({ expectedTotal: 45.5 })).success).toBe(false);
    expect(saleCreateBody.safeParse(cashBody({ items: [{ ...ITEM, qtyKg: '0.000' }] })).success).toBe(false);
    expect(saleCreateBody.safeParse(cashBody({ items: [ITEM, ITEM] })).success).toBe(false);
  });

  it('BR-95g: GET /sales/products accepts only DIRECT or MARKET; HORECA, B2B or anything else is 422, not an empty list', () => {
    expect(listSaleProductsQuery.safeParse({ channel: 'DIRECT' }).success).toBe(true);
    expect(listSaleProductsQuery.safeParse({ channel: 'MARKET' }).success).toBe(true);
    for (const channel of ['HORECA', 'B2B', 'ONLINE', 'direct', undefined]) {
      expect(listSaleProductsQuery.safeParse({ channel }).success, String(channel)).toBe(false);
    }
  });

  it('customer lookup takes exactly one of mobile, code or q', () => {
    expect(customerLookupQuery.safeParse({ mobile: '9876543210' }).success).toBe(true);
    expect(customerLookupQuery.safeParse({ code: 'CUST-1' }).success).toBe(true);
    expect(customerLookupQuery.safeParse({ q: 'ra' }).success).toBe(true);
    expect(customerLookupQuery.safeParse({}).success).toBe(false);
    expect(customerLookupQuery.safeParse({ mobile: '9876543210', code: 'CUST-1' }).success).toBe(false);
  });
});

// ===========================================================================
// 3. Service against a mocked repo
// ===========================================================================
interface Harness {
  deps: Partial<SalesServiceDeps>;
  repo: SalesRepo;
  attempts: Array<{ reasonCode: string; payload: Record<string, unknown>; viaTx: boolean }>;
  writes: string[];
  txCount: () => number;
  afterCommit: ReturnType<typeof vi.fn>;
}

function harness(options: { gst?: unknown; available?: string; price?: Money | null; commitFails?: boolean } = {}): Harness {
  const attempts: Harness['attempts'] = [];
  const writes: string[] = [];
  let transactions = 0;
  const poolDb: Executor = { query: (async () => ({ rows: [], rowCount: 0 })) as unknown as Executor['query'] };
  // Every statement on the transaction "returns a row with an id" (the audit insert needs one).
  const txDb: Executor = { query: (async () => ({ rows: [{ id: newId() }], rowCount: 1 })) as unknown as Executor['query'] };

  const record = (name: string) => async (): Promise<void> => {
    writes.push(name);
  };
  const repo: SalesRepo = {
    configValue: async () => ('gst' in options ? options.gst : 0),
    activeWarehouseExists: async () => true,
    listProducts: async () => [],
    findActiveProduct: async (_db, id) => ({ id, name: 'Carrot' }),
    warehouseStocksProduct: async () => true,
    activePrice: async () => (options.price === undefined ? parseMoney('45.50') : options.price),
    lockStock: record('lockStock'),
    sellableBatches: async () => [{ batchId: BATCH_A, allocationId: null, sellableQtyKg: options.available ?? '10.000' }],
    lookupCustomers: async () => [],
    findCustomerForSale: async (_db, id) => ({ id, customerCode: 'CUST-1', name: 'A Customer', mobile: '+919876543210' }),
    nextSaleNumber: async () => 'TOH-2026-000001',
    insertOrder: async () => {
      writes.push('insertOrder');
      return newId();
    },
    insertOrderItem: record('insertOrderItem'),
    insertStatusHistory: record('insertStatusHistory'),
    insertPayment: async () => {
      writes.push('insertPayment');
      return newId();
    },
    insertSaleLedger: record('insertSaleLedger'),
    consumeAllocation: record('consumeAllocation'),
    // Like the real repo, lockSale is findSaleHeader read under a row lock: a test that stubs the
    // header stubs what the transaction sees once it holds the lock, unless it overrides lockSale.
    lockSale: async (db, saleId, visible) => repo.findSaleHeader(db, saleId, visible),
    findSaleHeader: async () => null,
    saleItems: async () => [],
    completeOrder: record('completeOrder'),
    confirmPayment: record('confirmPayment'),
    recordPendingUpiRef: record('recordPendingUpiRef'),
    // BR-94l: the conditional UPDATEs report whether they changed the row; default "it did".
    cancelSale: async () => {
      writes.push('cancelSale');
      return true;
    },
    settlePayment: async () => {
      writes.push('settlePayment');
      return true;
    },
    markRefunded: async () => true,
    listExpiredPendingUpi: async () => [],
    loadSale: async (_db, id) => fakeRecord(id),
    insertAttempt: async (db, attempt) => {
      attempts.push({ reasonCode: attempt.reasonCode, payload: attempt.payload, viaTx: db === txDb });
    },
  };
  const afterCommit = vi.fn();
  return {
    repo,
    attempts,
    writes,
    txCount: () => transactions,
    afterCommit,
    deps: {
      repo,
      db: poolDb,
      runTx: async (fn) => {
        transactions += 1;
        const result = await fn(txDb);
        if (options.commitFails === true) throw new Error('COMMIT failed: connection lost');
        return result;
      },
      idempotency: createInMemoryIdempotencyStore(),
      wallet: { move: vi.fn(async () => ({}) as never) },
      invoices: { issue: vi.fn(async () => ({}) as never) },
      verifyUpi: async () => true,
      afterCommit,
    },
  };
}

function fakeRecord(id: string, extra: Record<string, unknown> = {}): SaleRecord {
  return {
    id,
    orderNumber: 'TOH-2026-000001',
    channel: 'DIRECT',
    status: 'PICKED_UP',
    paymentStatus: 'PAID',
    warehouseId: OOTY,
    customerId: null,
    customerCode: null,
    customerName: null,
    customerMobile: null,
    walkInName: 'Counter Buyer',
    walkInMobile: '+919812345678',
    subtotal: parseMoney('45.50'),
    gstAmount: parseMoney('0.00'),
    totalAmount: parseMoney('45.50'),
    createdAt: new Date('2026-10-11T05:00:00Z'),
    completedAt: new Date('2026-10-11T05:00:00Z'),
    items: [
      {
        productId: PRODUCT,
        name: 'Carrot',
        grade: 'GRADE_1',
        qtyKg: '1.000',
        unitPrice: parseMoney('45.50'),
        lineTotal: parseMoney('45.50'),
        gstRatePercent: '0.00',
        batchId: BATCH_A,
        allocationId: null,
        ...extra,
      },
    ],
    payment: {
      method: 'CASH',
      status: 'CONFIRMED',
      amount: parseMoney('45.50'),
      amountReceived: parseMoney('50.00'),
      changeGiven: parseMoney('4.50'),
      cardRef: null,
      upiTxnRef: null,
      confirmedAt: new Date('2026-10-11T05:00:00Z'),
    },
    invoiceId: newId(),
    invoiceNumber: 'TOH/2026-27/R/000001',
  };
}

const validBody = (overrides: Partial<SaleCreateBody> = {}): SaleCreateBody =>
  saleCreateBody.parse({ ...cashBody(), ...overrides });

describe('salesService (mocked repo)', () => {
  it('BR-85e: HORECA and B2B are refused 501 SALE_CHANNEL_NOT_SUPPORTED before any transaction or write', async () => {
    for (const channel of ['HORECA', 'B2B'] as const) {
      const h = harness();
      const service = createSalesService(h.deps);
      const error = await failure(service.create(subScope(), subScope(OOTY, 'payment.record'), 'k1', validBody({ channel })));
      expect(error.code).toBe('SALE_CHANNEL_NOT_SUPPORTED');
      expect(error.status).toBe(501);
      expect(h.txCount()).toBe(0);
      expect(h.writes).toEqual([]);
      expect(h.attempts).toEqual([]);
      expect((await failure(service.quote(subScope(), { channel, items: validBody().items }))).status).toBe(501);
    }
  });

  it('BR-85g: a caller with sales.sale.create but without payment.record is refused 403 before any write', async () => {
    const h = harness();
    const error = await failure(createSalesService(h.deps).create(subScope(), null, 'k1', validBody()));
    expect(error.code).toBe('FORBIDDEN');
    expect(error.status).toBe(403);
    expect(h.txCount()).toBe(0);
    expect(h.writes).toEqual([]);
  });

  it('BR-88a: POST /sales without an Idempotency-Key is 422 and writes nothing', async () => {
    for (const key of [undefined, '', '   ']) {
      const h = harness();
      const error = await failure(createSalesService(h.deps).create(subScope(), subScope(), key, validBody()));
      expect(error.code).toBe('VALIDATION_FAILED');
      expect(error.status).toBe(422);
      expect(h.txCount()).toBe(0);
      expect(h.writes).toEqual([]);
    }
  });

  it('BR-85f: a Sub admin naming another warehouse is 404 (never 403) and nothing is written', async () => {
    const h = harness();
    const error = await failure(createSalesService(h.deps).create(subScope(), subScope(), 'k1', validBody({ warehouseId: COONOOR })));
    expect(error.status).toBe(404);
    expect(h.writes).toEqual([]);
  });

  it('BR-86c / BR-87b: a walk-in paying by WALLET is 422 WALKIN_WALLET_NOT_ALLOWED; one sale_attempts row is written outside the transaction, without PII', async () => {
    const h = harness();
    const body = validBody({ walkIn: { name: 'Ravi', mobile: '+919812345678' }, payment: { method: 'WALLET' } });
    const error = await failure(createSalesService(h.deps).create(subScope(), subScope(), 'k1', body));
    expect(error.code).toBe('WALKIN_WALLET_NOT_ALLOWED');
    expect(error.status).toBe(422);
    expect(h.writes).toEqual([]);
    expect(h.attempts).toHaveLength(1);
    expect(h.attempts[0]!.reasonCode).toBe('WALKIN_WALLET_NOT_ALLOWED');
    expect(h.attempts[0]!.viaTx).toBe(false);
    const payload = JSON.stringify(h.attempts[0]!.payload);
    expect(payload).not.toContain('9812345678');
    expect(payload).not.toContain('Ravi');
    expect(h.attempts[0]!.payload).toHaveProperty('traceId');
  });

  it('BR-89c: a total that differs from expectedTotal is 409 SALE_PRICE_CHANGED with the fresh total; no order is written', async () => {
    const h = harness({ price: parseMoney('46.00') });
    const error = await failure(createSalesService(h.deps).create(subScope(), subScope(), 'k1', validBody()));
    expect(error.code).toBe('SALE_PRICE_CHANGED');
    expect(error.meta).toMatchObject({ expectedTotal: '45.50', currentTotal: '46.00' });
    expect(h.writes).not.toContain('insertOrder');
    expect(h.attempts.map((a) => a.reasonCode)).toEqual(['SALE_PRICE_CHANGED']);
  });

  it('BR-89b (unit): stock below the requested quantity is 409 SALE_STOCK_CHANGED with requested and available quantities', async () => {
    const h = harness({ available: '0.400' });
    const error = await failure(createSalesService(h.deps).create(subScope(), subScope(), 'k1', validBody()));
    expect(error.code).toBe('SALE_STOCK_CHANGED');
    expect(error.meta).toEqual({ lines: [{ productId: PRODUCT, grade: 'GRADE_1', requestedQtyKg: '1.000', availableQtyKg: '0.400' }] });
    expect(h.writes).toEqual(['lockStock']);
  });

  it('BR-94a: CASH below the total is 422 PAYMENT_AMOUNT_INSUFFICIENT and writes nothing but the attempt', async () => {
    const h = harness();
    const error = await failure(
      createSalesService(h.deps).create(subScope(), subScope(), 'k1', validBody({ payment: { method: 'CASH', amountReceived: '45.49' } })),
    );
    expect(error.code).toBe('PAYMENT_AMOUNT_INSUFFICIENT');
    expect(h.writes).not.toContain('insertOrder');
    expect(h.attempts.map((a) => a.reasonCode)).toEqual(['PAYMENT_AMOUNT_INSUFFICIENT']);
  });

  it('price: a product with neither a retail price nor a fair price ceiling is refused, never priced at a made-up default', async () => {
    const h = harness({ price: null });
    const error = await failure(createSalesService(h.deps).quote(subScope(), { channel: 'DIRECT', items: validBody().items }));
    expect(error.code).toBe('CONFLICT');
    expect(error.meta).toMatchObject({ reason: 'PRICE_NOT_SET' });
  });

  it('BR-89f: a quote opens no transaction, takes no lock and writes nothing (not even a sale_attempts row)', async () => {
    const h = harness();
    const quote = await createSalesService(h.deps).quote(subScope(), { channel: 'DIRECT', items: validBody().items });
    expect(saleQuoteResponse.safeParse(quote).success).toBe(true);
    expect(quote.totals).toEqual({ subtotal: '45.50', gst: '0.00', total: '45.50', changeGiven: null });
    expect(h.txCount()).toBe(0);
    expect(h.writes).toEqual([]);
    expect(h.attempts).toEqual([]);
  });

  it('BR-98d: the GST rate comes from system_config (a changed value changes the next quote); no literal rate in the service', async () => {
    const five = await createSalesService(harness({ gst: 5 }).deps).quote(subScope(), { channel: 'DIRECT', items: validBody().items });
    expect(five.gstRatePercent).toBe('5');
    expect(five.totals).toMatchObject({ subtotal: '45.50', gst: '2.28', total: '47.78' });
    const source = readFileSync(fileURLToPath(new URL('./sales.service.ts', import.meta.url)), 'utf8');
    expect(source).not.toMatch(/gstRate(Percent)?\s*[:=]\s*\d/);
    expect(source).not.toMatch(/\b(0\.05|0\.18|0\.12)\b/);
  });

  it('BR-98i: a missing system_config row falls back to 0 and is logged, not a 500', async () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
    try {
      const quote = await createSalesService(harness({ gst: undefined }).deps).quote(subScope(), { channel: 'DIRECT', items: validBody().items });
      expect(quote.gstRatePercent).toBe('0');
      expect(quote.totals.gst).toBe('0.00');
      expect(warn).toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('BR-87e: when COMMIT fails no post-commit hook runs and the caller gets the error, never a success body', async () => {
    const h = harness({ commitFails: true });
    await expect(createSalesService(h.deps).create(subScope(), subScope(), 'k1', validBody())).rejects.toThrow('COMMIT failed');
    expect(h.afterCommit).not.toHaveBeenCalled();
    expect(h.attempts.map((a) => a.reasonCode)).toEqual(['INTERNAL']);

    const ok = harness();
    const result = await createSalesService(ok.deps).create(subScope(), subScope(), 'k1', validBody());
    expect(ok.afterCommit).toHaveBeenCalledTimes(1);
    expect(ok.afterCommit).toHaveBeenCalledWith(result.sale);
  });

  it('BR-87d (unit): the sale writes order, items, history, payment, ledger and invoice in one transaction and replays without a second write', async () => {
    const h = harness();
    const service = createSalesService(h.deps);
    const first = await service.create(subScope(), subScope(), 'k1', validBody());
    expect(h.txCount()).toBe(1);
    expect(h.writes).toEqual(['lockStock', 'insertOrder', 'insertOrderItem', 'insertStatusHistory', 'insertPayment', 'insertSaleLedger']);
    expect(h.deps.invoices!.issue).toHaveBeenCalledTimes(1);
    const replay = await service.create(subScope(), subScope(), 'k1', validBody());
    expect(replay.replayed).toBe(true);
    expect(replay.sale).toEqual(first.sale);
    expect(h.writes).toHaveLength(6);
  });

  it('BR-90b: the sale serializer is an allow-list: internal fields on the record never reach the response', () => {
    const record = fakeRecord(newId(), { sourceFarmerId: newId(), farmName: 'Green Acres', batchCode: 'TF-123' });
    (record as unknown as Record<string, unknown>)['sourceFarmerId'] = newId();
    const sale = toSale(record);
    expect(saleResponse.safeParse(sale).success).toBe(true);
    expect(Object.keys(sale).sort()).toEqual(
      ['buyer', 'channel', 'completedAt', 'createdAt', 'id', 'invoiceId', 'invoiceNumber', 'items', 'payment', 'paymentStatus', 'saleNumber', 'status', 'totals', 'warehouseId'].sort(),
    );
    expect(Object.keys(sale.items[0]!).sort()).toEqual(['grade', 'lineTotal', 'name', 'productId', 'qtyKg', 'unitPrice']);
    expect(JSON.stringify(sale)).not.toMatch(/sourceFarmerId|farmName|Green Acres|batchId|9812345678/);
    expect(sale.buyer.mobileMasked).toBe('*********5678');
  });

  it('BR-90b (products): a product row with extra internal fields is serialized to the documented key set only', async () => {
    const h = harness();
    h.repo.listProducts = async () => [
      {
        productId: PRODUCT,
        name: 'Carrot',
        categoryId: newId(),
        grade: 'GRADE_1',
        unitPrice: parseMoney('45.50'),
        availableQtyKg: '12.5',
        batchCode: 'B-OOTY-1',
        storageLocation: 'Cold room 1',
        sourceFarmerId: newId(),
      } as never,
    ];
    const page = await createSalesService(h.deps).listProducts(subScope(), { channel: 'DIRECT', limit: 20 });
    expect(page.items).toHaveLength(1);
    expect(saleProductResponse.safeParse(page.items[0]).success).toBe(true);
    expect(page.items[0]!.availableQtyKg).toBe('12.500');
    expect(JSON.stringify(page)).not.toContain('sourceFarmerId');
  });

  /** A pending UPI DIRECT sale header at Ooty, for the confirm path. */
  function pendingUpiHeader(id: string): SaleHeaderRow {
    return {
      id,
      warehouseId: OOTY,
      channel: 'DIRECT',
      status: 'PENDING_PAYMENT',
      paymentStatus: 'PENDING',
      customerId: null,
      totalAmount: parseMoney('45.50'),
      gstAmount: parseMoney('0.00'),
      paymentId: newId(),
      paymentMethod: 'UPI',
      paymentStatusDetail: 'PENDING',
      upiTxnRef: null,
    };
  }

  function upiHarness(saleId: string): Harness {
    const h = harness();
    h.repo.findSaleHeader = async () => pendingUpiHeader(saleId);
    h.repo.lockSale = async () => pendingUpiHeader(saleId);
    h.repo.saleItems = async () => fakeRecord(saleId).items;
    return h;
  }

  it('BR-94: a UPI reference that already confirmed another sale is refused 409 CONFLICT (UPI_TXN_REF_ALREADY_USED), never a 500', async () => {
    const saleId = newId();
    const h = upiHarness(saleId);
    // What PostgreSQL raises on the partial unique index of migration 0067.
    h.repo.confirmPayment = async () => {
      throw Object.assign(new Error('duplicate key value violates unique constraint "uq_sale_payments_upi_txn_ref"'), {
        code: '23505',
        constraint: 'uq_sale_payments_upi_txn_ref',
      });
    };
    const error = await failure(createSalesService(h.deps).confirmUpi(subScope(OOTY, 'payment.record'), saleId, 'k-upi', { upiTxnRef: 'pay_dup_1' }));
    expect(error.status).toBe(409);
    expect(error.code).toBe('CONFLICT');
    expect(error.meta).toMatchObject({ reason: 'UPI_TXN_REF_ALREADY_USED' });
    expect(h.afterCommit).not.toHaveBeenCalled();
    expect(h.attempts.map((a) => a.reasonCode)).toEqual(['CONFLICT']);
    expect(JSON.stringify(h.attempts)).not.toContain('pay_dup_1');
  });

  it('BR-94e: a stock-ledger CHECK violation without the INSUFFICIENT_STOCK hint during the UPI confirm is 409 SALE_STOCK_CHANGED, not a 500', async () => {
    const saleId = newId();
    const h = upiHarness(saleId);
    // trg_stock_ledger_balance raises 23514 with no hint when the order's warehouse no longer
    // matches the batch's (for example after the order was moved to another warehouse).
    h.repo.insertSaleLedger = async () => {
      throw Object.assign(new Error('stock_ledger.warehouse_id does not match batch warehouse'), { code: '23514' });
    };
    const error = await failure(createSalesService(h.deps).confirmUpi(subScope(OOTY, 'payment.record'), saleId, 'k-upi', { upiTxnRef: 'pay_ok_1' }));
    expect(error.status).toBe(409);
    expect(error.code).toBe('SALE_STOCK_CHANGED');
  });

  it('BR-88h: a sale key replayed after the 24 h idempotency retention (its sale_payments row still exists) is 409 IDEMPOTENCY_KEY_REUSED, never a 500', async () => {
    const h = harness();
    h.repo.insertPayment = async () => {
      throw Object.assign(new Error('duplicate key value violates unique constraint "uq_sale_payments_idempotency_key"'), {
        code: '23505',
        constraint: 'uq_sale_payments_idempotency_key',
      });
    };
    const error = await failure(createSalesService(h.deps).create(subScope(), subScope(OOTY, 'payment.record'), 'k-old', validBody()));
    expect(error.status).toBe(409);
    expect(error.code).toBe('IDEMPOTENCY_KEY_REUSED');
    expect(h.afterCommit).not.toHaveBeenCalled();
  });

  it('BR-94g: acting on an unconfirmed UPI sale throws 409 PAYMENT_PENDING', async () => {
    const saleId = newId();
    const h = upiHarness(saleId);
    const service = createSalesService(h.deps);

    const error = await failure(service.requirePaid(subScope(OOTY), saleId));
    expect(error.status).toBe(409);
    expect(error.code).toBe('PAYMENT_PENDING');
  });

  it('BR-94i: stock conflict during confirm cancels the sale, marks REFUND_DUE, and throws 409 SALE_STOCK_CHANGED with reason UPI_REFUND_DUE', async () => {
    const saleId = newId();
    const h = upiHarness(saleId);
    let cancelCalled = false;
    let paymentSettledStatus: string | null = null;

    h.repo.insertSaleLedger = async () => {
      throw Object.assign(new Error('insufficient available stock'), { code: '23514' });
    };
    h.repo.cancelSale = async (_db, id, args) => {
      expect(id).toBe(saleId);
      expect(args.paymentStatus).toBe('REFUND_DUE');
      cancelCalled = true;
      return true;
    };
    h.repo.settlePayment = async (_db, _id, status) => {
      paymentSettledStatus = status;
      return true;
    };

    const service = createSalesService(h.deps);
    const error = await failure(service.confirmUpi(subScope(OOTY, 'payment.record'), saleId, 'k-upi', { upiTxnRef: 'pay_stock_fail' }));

    expect(error.status).toBe(409);
    expect(error.code).toBe('SALE_STOCK_CHANGED');
    expect(error.meta).toMatchObject({ reason: 'UPI_REFUND_DUE', refundStatus: 'REFUND_DUE' });
    expect(cancelCalled).toBe(true);
    expect(paymentSettledStatus).toBe('REFUND_DUE');
  });

  it('BR-94i: stock conflict during confirm with sales.upi_refund_mode auto triggers gateway refund and marks payment REFUNDED', async () => {
    const saleId = newId();
    const h = upiHarness(saleId);
    let markedRefunded = false;
    const mockRefund = vi.fn(async () => ({ refundId: 'rfnd_gw_123', status: 'processed' }));

    h.repo.configValue = async (_db, key) => (key === 'sales.upi_refund_mode' ? 'auto' : undefined);
    h.repo.insertSaleLedger = async () => {
      throw Object.assign(new Error('insufficient stock'), { code: '23514' });
    };
    h.repo.markRefunded = async (_db, _id, refundRef) => {
      expect(refundRef).toBe('rfnd_gw_123');
      markedRefunded = true;
      return true;
    };

    h.deps.gateway = {
      provider: 'mock',
      createOrder: vi.fn(),
      verifyWebhookSignature: vi.fn(),
      parseEvent: vi.fn(),
      refundPayment: mockRefund,
    };

    const service = createSalesService(h.deps);
    const error = await failure(service.confirmUpi(subScope(OOTY, 'payment.record'), saleId, 'k-upi', { upiTxnRef: 'pay_auto_refund' }));

    expect(error.status).toBe(409);
    expect(error.code).toBe('SALE_STOCK_CHANGED');
    expect(error.meta).toMatchObject({ reason: 'UPI_REFUND_DUE', refundStatus: 'REFUNDED' });
    expect(mockRefund).toHaveBeenCalledWith(expect.objectContaining({ gatewayPaymentId: 'pay_auto_refund' }));
    expect(markedRefunded).toBe(true);
  });

  it('BR-94i: cancelling an unpaid pending UPI sale marks CANCELLED and FAILED, and replay is idempotent', async () => {
    const saleId = newId();
    const h = upiHarness(saleId);
    let cancelled = false;
    let paymentStatus: string | null = null;

    h.repo.cancelSale = async (_db, id, args) => {
      expect(id).toBe(saleId);
      expect(args.paymentStatus).toBe('FAILED');
      cancelled = true;
      return true;
    };
    h.repo.settlePayment = async (_db, _id, status) => {
      paymentStatus = status;
      return true;
    };
    h.repo.loadSale = async (_db, id) => {
      const rec = fakeRecord(id);
      rec.status = 'CANCELLED';
      rec.paymentStatus = 'FAILED';
      if (rec.payment) rec.payment.status = 'FAILED';
      return rec;
    };

    const service = createSalesService(h.deps);
    const result1 = await service.cancel(subScope(OOTY), saleId, 'k-cancel-1', { reason: 'Customer walked away' });
    expect(result1.status).toBe('CANCELLED');
    expect(result1.paymentStatus).toBe('FAILED');
    expect(cancelled).toBe(true);
    expect(paymentStatus).toBe('FAILED');

    // Idempotent replay
    const result2 = await service.cancel(subScope(OOTY), saleId, 'k-cancel-1', { reason: 'Customer walked away' });
    expect(result2.status).toBe('CANCELLED');
  });

  it('BR-94i: cancelling a sale that is already picked up or paid throws 409 CONFLICT', async () => {
    const saleId = newId();
    const h = harness();
    h.repo.findSaleHeader = async () => ({
      ...pendingUpiHeader(saleId),
      status: 'PICKED_UP',
      paymentStatus: 'PAID',
      paymentStatusDetail: 'CONFIRMED',
    });

    const service = createSalesService(h.deps);
    const error = await failure(service.cancel(subScope(OOTY), saleId, 'k-cancel-2'));
    expect(error.status).toBe(409);
    expect(error.code).toBe('CONFLICT');
  });

  it('BR-94i: expirePendingUpi skips when config is null/disabled, and cancels expired sales when configured', async () => {
    const saleId = newId();
    const h = upiHarness(saleId);
    let cancelCalled = false;

    h.repo.cancelSale = async () => {
      cancelCalled = true;
      return true;
    };

    // When config is null (default)
    h.repo.configValue = async () => null;
    const service1 = createSalesService(h.deps);
    const res1 = await service1.expirePendingUpi();
    expect(res1.expiredCount).toBe(0);
    expect(cancelCalled).toBe(false);

    // When config is set to 15 minutes
    h.repo.configValue = async () => 15;
    h.repo.listExpiredPendingUpi = async () => [
      {
        saleId,
        warehouseId: OOTY,
        paymentId: 'pay_expired_1',
        upiTxnRef: null,
        totalAmount: parseMoney('45.50'),
      },
    ];

    const service2 = createSalesService(h.deps);
    const res2 = await service2.expirePendingUpi();
    expect(res2.expiredCount).toBe(1);
    expect(cancelCalled).toBe(true);
  });
});

// ===========================================================================
// 4. BR-94l: the stock-conflict cancel + refund path decides on the LOCKED sale row
// ===========================================================================
describe('salesService: UPI confirm stock conflict races (mocked repo)', () => {
  function pendingHeader(id: string, paymentId: string): SaleHeaderRow {
    return {
      id,
      warehouseId: OOTY,
      channel: 'DIRECT',
      status: 'PENDING_PAYMENT',
      paymentStatus: 'PENDING',
      customerId: null,
      totalAmount: parseMoney('45.50'),
      gstAmount: parseMoney('0.00'),
      paymentId,
      paymentMethod: 'UPI',
      paymentStatusDetail: 'PENDING',
      upiTxnRef: null,
    };
  }

  /**
   * A pending UPI sale whose confirm hits a stock conflict, in sales.upi_refund_mode = auto, with
   * every transaction statement recorded per transaction so a test can see what the cancel
   * transaction wrote (status history, audit) and whether the gateway refund was called.
   */
  function raceHarness() {
    const saleId = newId();
    const paymentId = newId();
    const h = harness();
    const statements: string[][] = [];
    const calls: string[] = [];
    h.repo.configValue = async (_db, key) => (key === 'sales.upi_refund_mode' ? 'auto' : undefined);
    h.repo.findSaleHeader = async () => pendingHeader(saleId, paymentId);
    h.repo.lockSale = async () => pendingHeader(saleId, paymentId);
    h.repo.saleItems = async () => fakeRecord(saleId).items;
    h.repo.insertSaleLedger = async () => {
      throw Object.assign(new Error('insufficient available stock'), { code: '23514' });
    };
    h.repo.cancelSale = async () => {
      calls.push('cancelSale');
      return true;
    };
    h.repo.settlePayment = async () => {
      calls.push('settlePayment');
      return true;
    };
    h.repo.insertStatusHistory = async (_db, _id, from, to) => {
      calls.push(`history:${from ?? 'null'}->${to}`);
    };
    h.repo.markRefunded = async () => {
      calls.push('markRefunded');
      return true;
    };
    const refundPayment = vi.fn(async () => ({ refundId: 'rfnd_race_1', status: 'processed' }));
    h.deps.gateway = { provider: 'mock', createOrder: vi.fn(), verifyWebhookSignature: vi.fn(), parseEvent: vi.fn(), refundPayment };
    h.deps.runTx = async (fn) => {
      const log: string[] = [];
      statements.push(log);
      const tx: Executor = {
        query: (async (sql: string) => {
          log.push(sql);
          return { rows: [{ id: newId() }], rowCount: 1 };
        }) as unknown as Executor['query'],
      };
      return fn(tx);
    };
    const audits = (): number => statements.flat().filter((sql) => /INSERT INTO audit_log/i.test(sql)).length;
    const confirm = () => createSalesService(h.deps).confirmUpi(subScope(OOTY, 'payment.record'), saleId, 'k-race', { upiTxnRef: 'pay_race_1' });
    return { h, saleId, paymentId, calls, refundPayment, audits, confirm };
  }

  it('BR-94l: a sale another request confirmed before the cancel transaction locked it is 409 CONFLICT: no cancel, no history, no audit, no refund', async () => {
    const r = raceHarness();
    let lockCalls = 0;
    // First lock: the confirm's own transaction (still pending). Second lock: the cancel
    // transaction, by which time a concurrent confirm committed PICKED_UP / CONFIRMED.
    r.h.repo.lockSale = async () => {
      lockCalls += 1;
      const header = pendingHeader(r.saleId, r.paymentId);
      return lockCalls === 1 ? header : { ...header, status: 'PICKED_UP', paymentStatus: 'PAID', paymentStatusDetail: 'CONFIRMED', upiTxnRef: 'pay_race_1' };
    };
    const error = await failure(r.confirm());
    expect(error.status).toBe(409);
    expect(error.code).toBe('CONFLICT');
    expect(error.meta).toMatchObject({ reason: 'SALE_STATE_CHANGED' });
    expect(lockCalls).toBe(2);
    expect(r.calls).toEqual([]);
    expect(r.audits()).toBe(0);
    expect(r.refundPayment).not.toHaveBeenCalled();
  });

  it('BR-94l: a sale another request already cancelled is 409 CONFLICT and is not refunded a second time', async () => {
    const r = raceHarness();
    let lockCalls = 0;
    r.h.repo.lockSale = async () => {
      lockCalls += 1;
      const header = pendingHeader(r.saleId, r.paymentId);
      return lockCalls === 1 ? header : { ...header, status: 'CANCELLED', paymentStatus: 'REFUND_DUE', paymentStatusDetail: 'REFUND_DUE' };
    };
    const error = await failure(r.confirm());
    expect(error.status).toBe(409);
    expect(r.calls).toEqual([]);
    expect(r.audits()).toBe(0);
    expect(r.refundPayment).not.toHaveBeenCalled();
  });

  it('BR-94l: when the order UPDATE matches no row (cancelSale changed nothing) the cancel is 409 CONFLICT: no history, no audit, no refund', async () => {
    const r = raceHarness();
    r.h.repo.cancelSale = async () => {
      r.calls.push('cancelSale');
      return false;
    };
    const error = await failure(r.confirm());
    expect(error.status).toBe(409);
    expect(error.code).toBe('CONFLICT');
    expect(r.calls).toEqual(['cancelSale']);
    expect(r.audits()).toBe(0);
    expect(r.refundPayment).not.toHaveBeenCalled();
  });

  it('BR-94l: when the payment UPDATE matches no row (settlePayment changed nothing) the cancel is 409 CONFLICT: no history, no audit, no refund', async () => {
    const r = raceHarness();
    r.h.repo.settlePayment = async () => {
      r.calls.push('settlePayment');
      return false;
    };
    const error = await failure(r.confirm());
    expect(error.status).toBe(409);
    expect(error.code).toBe('CONFLICT');
    expect(r.calls).toEqual(['cancelSale', 'settlePayment']);
    expect(r.audits()).toBe(0);
    expect(r.refundPayment).not.toHaveBeenCalled();
  });

  it('BR-94l: the cancel decides on the locked row of the transaction it writes in (lockSale runs on the cancel transaction client)', async () => {
    const r = raceHarness();
    const lockedOn: Executor[] = [];
    const wroteOn: Executor[] = [];
    r.h.repo.lockSale = async (db) => {
      lockedOn.push(db);
      return pendingHeader(r.saleId, r.paymentId);
    };
    r.h.repo.cancelSale = async (db) => {
      wroteOn.push(db);
      return true;
    };
    const error = await failure(r.confirm());
    expect(error.code).toBe('SALE_STOCK_CHANGED');
    expect(lockedOn).toHaveLength(2);
    expect(wroteOn).toHaveLength(1);
    expect(lockedOn[1]).toBe(wroteOn[0]);
  });

  it('BR-94l: the happy path still cancels, writes one history and one cancel audit, refunds once and marks REFUNDED', async () => {
    const r = raceHarness();
    const error = await failure(r.confirm());
    expect(error.code).toBe('SALE_STOCK_CHANGED');
    expect(error.meta).toMatchObject({ reason: 'UPI_REFUND_DUE', refundStatus: 'REFUNDED' });
    expect(r.calls).toEqual(['cancelSale', 'settlePayment', 'history:PENDING_PAYMENT->CANCELLED', 'markRefunded']);
    expect(r.refundPayment).toHaveBeenCalledTimes(1);
    expect(r.audits()).toBe(2);
  });

  it('BR-94l: a refund whose REFUND_DUE row is no longer REFUND_DUE (markRefunded false) is not reported REFUNDED and writes no refund audit row', async () => {
    const r = raceHarness();
    r.h.repo.markRefunded = async () => {
      r.calls.push('markRefunded');
      return false;
    };
    const error = await failure(r.confirm());
    expect(error.code).toBe('SALE_STOCK_CHANGED');
    expect(error.meta).toMatchObject({ refundStatus: 'REFUND_DUE' });
    // Only the cancel transaction's audit row; the refund transaction rolled its row back.
    expect(r.audits()).toBe(1);
  });

  it('BR-94n: a stock conflict whose cancel writes a UPI reference already on another sale is 409 UPI_TXN_REF_ALREADY_USED, never a 500: no history, no audit, no refund', async () => {
    const r = raceHarness();
    // The stock check runs before confirmPayment, so a reused reference first meets the 0067
    // index when the cancel transaction records it on the REFUND_DUE payment.
    r.h.repo.settlePayment = async () => {
      r.calls.push('settlePayment');
      throw Object.assign(new Error('duplicate key value violates unique constraint "uq_sale_payments_upi_txn_ref"'), {
        code: '23505',
        constraint: 'uq_sale_payments_upi_txn_ref',
      });
    };
    const error = await failure(r.confirm());
    expect(error.status).toBe(409);
    expect(error.code).toBe('CONFLICT');
    expect(error.meta).toMatchObject({ reason: 'UPI_TXN_REF_ALREADY_USED' });
    expect(r.calls).toEqual(['cancelSale', 'settlePayment']);
    expect(r.audits()).toBe(0);
    expect(r.refundPayment).not.toHaveBeenCalled();
    expect(r.h.attempts.map((a) => a.reasonCode)).toEqual(['CONFLICT']);
  });

  it('BR-94l: a manual cancel whose order UPDATE matches no row is 409 CONFLICT and writes no history row', async () => {
    const r = raceHarness();
    r.h.repo.cancelSale = async () => {
      r.calls.push('cancelSale');
      return false;
    };
    const error = await failure(createSalesService(r.h.deps).cancel(subScope(OOTY), r.saleId, 'k-manual-race'));
    expect(error.status).toBe(409);
    expect(error.code).toBe('CONFLICT');
    expect(r.calls).toEqual(['cancelSale']);
    expect(r.audits()).toBe(0);
  });
});
