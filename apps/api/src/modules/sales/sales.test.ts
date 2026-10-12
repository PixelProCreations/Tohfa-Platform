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
import type { SaleRecord, SalesRepo } from './sales.repo.js';
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
    lockSale: async () => null,
    findSaleHeader: async () => null,
    saleItems: async () => [],
    completeOrder: record('completeOrder'),
    confirmPayment: record('confirmPayment'),
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
});
