/**
 * SWA Module 6 (Direct / Market sales), READ side.
 *
 * BR-96 = the dashboard counts only PAID + PICKED_UP + completed DIRECT/MARKET sales, by the
 *         Asia/Kolkata day of completed_at, confined to the scope.
 * BR-90 = no farm identity at any depth of a sale read (allow-list serializer).
 * BR-92 = walk-in and customer mobiles are masked in sale reads.
 * BR-30 = a Sub Warehouse Admin sees only its warehouse; another warehouse's sale is 404.
 * BR-85 = permission matrix on the read routes (BR-85c); Horeca/B2B are read-only (BR-85h).
 * BR-95 = the market-day view reads the LIVE_MARKET allocation.
 *
 * Three layers, as in finance.test.ts:
 *   1. schema tests (no I/O),
 *   2. service tests against a fake repo (no database),
 *   3. `describeIfDatabase` tests that run every repo query against a migrated Postgres inside a
 *      rolled-back transaction, plus real-HTTP tests through a local express app that mounts
 *      `salesReadRouter` exactly as app.ts should (`/v1/admin/sales`).
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Server } from 'node:http';
import { RoleCode, ScopeLevel, type Money } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import type {
  AllocationRow,
  ChannelOrderRecord,
  OrderCursor,
  SaleDetailRecord,
  SaleListFilters,
  SaleListRecord,
  SalesReadRepo,
} from './sales-read.repo.js';
import {
  channelOrderListItemResponse,
  listSalesQuery,
  marketDayQuery,
  saleListItemResponse,
  saleResponse,
  salesMarketDayResponse,
  salesSummaryQuery,
  salesSummaryResponse,
} from './sales-read.schema.js';
import { createSalesReadService, maskMobile } from './sales-read.service.js';

const WH_A = '10000000-0000-4000-8000-0000000000a1';
const WH_B = '10000000-0000-4000-8000-0000000000b2';
const SUB_USER = '00000000-0000-4000-8000-0000000000a1';
const CROP = '30000000-0000-4000-8000-000000000001';
const SALE_ID = '20000000-0000-4000-8000-000000000001';
const CUSTOMER_ID = '40000000-0000-4000-8000-000000000001';

const m = (value: string): Money => value as Money;

const subScope = (permission = 'sales.history.view', warehouseIds: string[] = [WH_A]): ResolvedScope =>
  aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds, permission, userId: SUB_USER });
const mainOwn = (permission = 'sales.history.view'): ResolvedScope =>
  aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.MAIN_WH_ADMIN, warehouseIds: [], permission, userId: SUB_USER });
const tohfaAll = (permission = 'sales.history.view'): ResolvedScope =>
  aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.TOHFA_ADMIN, warehouseIds: [], permission, userId: SUB_USER });

/** Any key that could carry a farm identity (BR-90, BR-16), matched case-insensitively. */
const FARM_IDENTITY_KEY = /farm|village|gps|fmb|latitude|longitude|^lat$|^lng$|batch|source/i;

function farmIdentityKeys(value: unknown, path = '$'): string[] {
  if (Array.isArray(value)) return value.flatMap((item, i) => farmIdentityKeys(item, `${path}[${i}]`));
  if (value !== null && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => [
      ...(FARM_IDENTITY_KEY.test(key) ? [`${path}.${key}`] : []),
      ...farmIdentityKeys(child, `${path}.${key}`),
    ]);
  }
  return [];
}

/**
 * BR-92a: every run of five consecutive digits of a stored mobile that appears anywhere in the JSON.
 * A masked mobile shows at most its last four, so the result must be empty.
 */
function mobileFragments(value: unknown, mobiles: string[]): string[] {
  const json = JSON.stringify(value);
  return mobiles.flatMap((mobile) => {
    const digits = mobile.replace(/[^0-9]/g, '');
    const windows = Array.from({ length: Math.max(digits.length - 4, 0) }, (_, i) => digits.slice(i, i + 5));
    return windows.filter((w) => json.includes(w));
  });
}
const WALK_IN_MOBILE = '+919876543210';
const CUSTOMER_MOBILE = '+919812345678';

// ---------------------------------------------------------------------------
// Records the fake repo returns. Each carries internal keys a careless serializer would leak.
// ---------------------------------------------------------------------------
function listRecord(overrides: Partial<SaleListRecord> = {}): SaleListRecord {
  const record = {
    id: SALE_ID,
    orderNumber: 'SALE-0001',
    channel: 'DIRECT',
    status: 'PICKED_UP',
    paymentStatus: 'PAID',
    paymentMethod: 'CASH',
    warehouseId: WH_A,
    buyer: {
      customerId: null,
      customerCode: null,
      customerName: null,
      customerMobile: null,
      walkInName: 'Counter Walk-in',
      walkInMobile: '+919876543210',
      // An internal field that must never reach the response.
      sourceFarmerId: 'farmer-should-not-leak',
    },
    itemCount: 1,
    total: m('118.00'),
    invoiceNumber: 'TOH/26-27/000001',
    placedAt: '2026-10-11T04:00:00.000Z',
    completedAt: '2026-10-11T04:00:01.000Z',
    farmerId: 'farmer-should-not-leak',
    ...overrides,
  };
  return record as SaleListRecord;
}

function detailRecord(overrides: Partial<SaleDetailRecord> = {}): SaleDetailRecord {
  const record = {
    ...listRecord(),
    subtotal: m('100.00'),
    gst: m('18.00'),
    invoiceId: '50000000-0000-4000-8000-000000000001',
    items: [
      {
        productId: CROP,
        name: 'Carrot',
        grade: 'GRADE_1',
        qtyKg: '1.500',
        unitPrice: m('66.67'),
        lineTotal: m('100.00'),
        batchId: 'batch-should-not-leak',
        sourceFarmerId: 'farmer-should-not-leak',
        farmName: 'Green Acres',
      },
    ],
    payments: [
      {
        method: 'CASH',
        status: 'CONFIRMED',
        amount: m('118.00'),
        amountReceived: m('200.00'),
        changeGiven: m('82.00'),
        cardRef: null,
        upiTxnRef: null,
        confirmedAt: '2026-10-11T04:00:01.000Z',
        createdAt: '2026-10-11T04:00:01.000Z',
      },
    ],
    timeline: [{ fromStatus: null, toStatus: 'PICKED_UP', at: '2026-10-11T04:00:01.000Z', changedByNote: 'internal' }],
    ...overrides,
  };
  return record as SaleDetailRecord;
}

interface FakeRepo extends SalesReadRepo {
  calls: { listSales: Array<{ filters: SaleListFilters; limit: number; cursor: OrderCursor | undefined }> };
}

function fakeRepo(overrides: Partial<SalesReadRepo> = {}): FakeRepo {
  const calls: FakeRepo['calls'] = { listSales: [] };
  const base: SalesReadRepo = {
    getReportMaxRangeDays: vi.fn(async () => 366),
    warehouseVisible: vi.fn(async (_db, scope, id) => scope.warehouseIds.length === 0 || scope.warehouseIds.includes(id)),
    totalsByChannel: vi.fn(async () => []),
    totalsByMethod: vi.fn(async () => []),
    needsAttention: vi.fn(async () => ({ paymentPending: 0, stockIssues: 0, failedSales: 0, invoiceIssues: 0 })),
    listSales: vi.fn(async (_db, _scope, filters, limit, cursor) => {
      calls.listSales.push({ filters, limit, cursor });
      return { items: [listRecord()], next: null };
    }),
    findSale: vi.fn(async () => detailRecord()),
    marketAllocation: vi.fn(async () => []),
    listChannelOrders: vi.fn(async () => ({ items: [], next: null })),
  };
  return Object.assign(base, overrides, { calls });
}

const db = {} as Executor;
/** 2026-10-11 10:00 IST. */
const NOON_ISH = new Date('2026-10-11T04:30:00.000Z');
const serviceWith = (repo: SalesReadRepo, now: Date = NOON_ISH) => createSalesReadService({ repo, db, now: () => now });

async function expectAppError(promise: Promise<unknown>, code: string): Promise<AppError> {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(AppError);
  expect((error as AppError).code).toBe(code);
  return error as AppError;
}

// ===========================================================================
// 1. Schemas
// ===========================================================================
describe('sales-read schemas', () => {
  it('BR-96: the summary query needs real dates with from <= to, a UUID warehouse, and is strict', () => {
    expect(salesSummaryQuery.safeParse({}).success).toBe(true);
    expect(salesSummaryQuery.safeParse({ from: '2026-10-01', to: '2026-10-11' }).success).toBe(true);
    expect(salesSummaryQuery.safeParse({ from: '2026-10-12', to: '2026-10-11' }).success).toBe(false);
    expect(salesSummaryQuery.safeParse({ from: '2026-02-30' }).success).toBe(false);
    expect(salesSummaryQuery.safeParse({ warehouseId: 'nope' }).success).toBe(false);
    expect(salesSummaryQuery.safeParse({ channel: 'DIRECT' }).success).toBe(false);
  });

  it('BR-85: the history query accepts only the sale channels and methods, bounds limit and q, and is strict', () => {
    expect(listSalesQuery.parse({}).limit).toBe(20);
    expect(listSalesQuery.safeParse({ channel: 'MARKET', paymentMethod: 'UPI', status: 'PENDING_PAYMENT' }).success).toBe(true);
    expect(listSalesQuery.safeParse({ channel: 'ONLINE' }).success).toBe(false);
    expect(listSalesQuery.safeParse({ channel: 'HORECA' }).success).toBe(false);
    expect(listSalesQuery.safeParse({ paymentMethod: 'NETBANKING' }).success).toBe(false);
    expect(listSalesQuery.safeParse({ limit: '101' }).success).toBe(false);
    expect(listSalesQuery.safeParse({ limit: '0' }).success).toBe(false);
    expect(listSalesQuery.safeParse({ q: 'x'.repeat(61) }).success).toBe(false);
    expect(listSalesQuery.safeParse({ farmerId: newId() }).success).toBe(false);
    expect(marketDayQuery.safeParse({ date: '2026-13-01' }).success).toBe(false);
  });
});

// ===========================================================================
// 2. Service, against a fake repo
// ===========================================================================
describe('sales-read service: summary (BR-96)', () => {
  it('BR-96d: from/to default to the Asia/Kolkata day of now, not the UTC day', async () => {
    const before = fakeRepo();
    // 2026-10-10 23:59:59 IST
    await serviceWith(before, new Date('2026-10-10T18:29:59.000Z')).summary(subScope('sales.dashboard.view'), {});
    expect(vi.mocked(before.totalsByChannel).mock.calls[0]?.[2]).toEqual({ from: '2026-10-10', to: '2026-10-10' });

    const after = fakeRepo();
    // 2026-10-11 00:00:00 IST, still 2026-10-10 in UTC
    const result = await serviceWith(after, new Date('2026-10-10T18:30:00.000Z')).summary(subScope('sales.dashboard.view'), {});
    expect(vi.mocked(after.totalsByChannel).mock.calls[0]?.[2]).toEqual({ from: '2026-10-11', to: '2026-10-11' });
    expect(result.from).toBe('2026-10-11');
    expect(result.to).toBe('2026-10-11');
  });

  it('BR-96: revenue is the exact paise sum (0.10 + 0.20 = 0.30), and both channels and all four methods are present', async () => {
    const repo = fakeRepo({
      totalsByChannel: vi.fn(async () => [
        { channel: 'DIRECT' as const, count: 1, revenue: m('0.10') },
        { channel: 'MARKET' as const, count: 1, revenue: m('0.20') },
      ]),
      totalsByMethod: vi.fn(async () => [
        { method: 'CASH' as const, count: 1, revenue: m('0.10') },
        { method: 'UPI' as const, count: 1, revenue: m('0.20') },
      ]),
    });
    const result = await serviceWith(repo).summary(subScope('sales.dashboard.view'), {});
    expect(salesSummaryResponse.parse(result)).toEqual(result);
    expect(result.count).toBe(2);
    expect(result.revenue).toBe('0.30');
    expect(result.byChannel).toEqual([
      { channel: 'DIRECT', count: 1, revenue: '0.10' },
      { channel: 'MARKET', count: 1, revenue: '0.20' },
    ]);
    expect(result.byPaymentMethod).toEqual([
      { method: 'CASH', count: 1, revenue: '0.10' },
      { method: 'UPI', count: 1, revenue: '0.20' },
      { method: 'CARD', count: 0, revenue: '0.00' },
      { method: 'WALLET', count: 0, revenue: '0.00' },
    ]);
  });

  it('BR-96e: a Sub admin is confined to its warehouse; another warehouseId is 404 (never 403) and reads nothing', async () => {
    const repo = fakeRepo();
    const own = await serviceWith(repo).summary(subScope('sales.dashboard.view'), {});
    expect(own.warehouseId).toBe(WH_A);

    const other = fakeRepo();
    await expectAppError(serviceWith(other).summary(subScope('sales.dashboard.view'), { warehouseId: WH_B }), 'NOT_FOUND');
    expect(other.totalsByChannel).not.toHaveBeenCalled();
    expect(other.needsAttention).not.toHaveBeenCalled();
  });

  it('BR-96e: MAIN_WH_ADMIN (own, no warehouse) and TOHFA_ADMIN see every warehouse (warehouseId null) and may narrow to one', async () => {
    const repo = fakeRepo();
    expect((await serviceWith(repo).summary(mainOwn('sales.dashboard.view'), {})).warehouseId).toBeNull();
    expect((await serviceWith(repo).summary(tohfaAll('sales.dashboard.view'), { warehouseId: WH_B })).warehouseId).toBe(WH_B);
    expect(vi.mocked(repo.totalsByChannel).mock.calls[1]?.[3]).toEqual({ warehouseId: WH_B });

    const unknown = fakeRepo({ warehouseVisible: vi.fn(async () => false) });
    await expectAppError(serviceWith(unknown).summary(tohfaAll('sales.dashboard.view'), { warehouseId: WH_B }), 'NOT_FOUND');
  });

  it('BR-96: a span above system_config report_max_range_days is 422; exactly the cap is accepted', async () => {
    const repo = fakeRepo();
    await serviceWith(repo).summary(subScope('sales.dashboard.view'), { from: '2025-01-01', to: '2026-01-02' }); // 366 days
    await expectAppError(
      serviceWith(repo).summary(subScope('sales.dashboard.view'), { from: '2025-01-01', to: '2026-01-03' }),
      'VALIDATION_FAILED',
    );
  });

  it('BR-96b: the needs-attention counts (pending payment, stock issues, failed attempts, invoice issues) come from the repo for the same window and scope', async () => {
    const repo = fakeRepo({
      needsAttention: vi.fn(async () => ({ paymentPending: 3, stockIssues: 1, failedSales: 2, invoiceIssues: 4 })),
    });
    const scope = subScope('sales.dashboard.view');
    const result = await serviceWith(repo).summary(scope, { from: '2026-10-01', to: '2026-10-11' });
    expect(result.needsAttention).toEqual({ paymentPending: 3, stockIssues: 1, failedSales: 2, invoiceIssues: 4 });
    expect(vi.mocked(repo.needsAttention).mock.calls[0]?.slice(1)).toEqual([scope, { from: '2026-10-01', to: '2026-10-11' }, {}]);
  });
});

describe('sales-read service: history and detail', () => {
  it('BR-92e: maskMobile keeps only the last four digits, masks a short value fully, and passes null through', () => {
    expect(maskMobile('+919876543210')).toBe('*********3210');
    expect(maskMobile('1234')).toBe('****');
    expect(maskMobile('12')).toBe('**');
    expect(maskMobile(null)).toBeNull();
  });

  it('BR-92: walk-in and customer mobiles are masked in history for own AND all scopes (no full mobile in a sale response)', async () => {
    const customer = listRecord({
      id: newId(),
      buyer: {
        customerId: CUSTOMER_ID,
        customerCode: 'CUST-0001',
        customerName: 'Registered Buyer',
        customerMobile: '+919812345678',
        walkInName: null,
        walkInMobile: null,
      },
    });
    for (const scope of [subScope(), tohfaAll()]) {
      const repo = fakeRepo({ listSales: vi.fn(async () => ({ items: [listRecord(), customer], next: null })) });
      const result = await serviceWith(repo).list(scope, listSalesQuery.parse({}));
      expect(mobileFragments(result.items, [WALK_IN_MOBILE, CUSTOMER_MOBILE])).toEqual([]);
      expect(result.items[0]?.buyer).toEqual({
        kind: 'WALK_IN',
        customerId: null,
        customerCode: null,
        name: 'Counter Walk-in',
        mobileMasked: '*********3210',
      });
      expect(result.items[1]?.buyer).toEqual({
        kind: 'CUSTOMER',
        customerId: CUSTOMER_ID,
        customerCode: 'CUST-0001',
        name: 'Registered Buyer',
        mobileMasked: '*********5678',
      });
    }
  });

  it('BR-90b: a history row is serialized to exactly the documented SaleListItem key set; internal keys never appear', async () => {
    const result = await serviceWith(fakeRepo()).list(subScope(), listSalesQuery.parse({}));
    const item = result.items[0]!;
    expect(saleListItemResponse.parse(item)).toEqual(item);
    expect(Object.keys(item).sort()).toEqual(
      ['buyer', 'channel', 'completedAt', 'createdAt', 'id', 'invoiceNumber', 'itemCount', 'paymentMethod', 'paymentStatus', 'saleNumber', 'status', 'total', 'warehouseId'],
    );
    expect(farmIdentityKeys(result)).toEqual([]);
  });

  it('BR-90a: the sale detail carries no farm identity key at any depth and matches the documented Sale key set', async () => {
    const result = await serviceWith(fakeRepo()).get(subScope(), SALE_ID);
    expect(saleResponse.parse(result)).toEqual(result);
    expect(farmIdentityKeys(result)).toEqual([]);
    expect(mobileFragments(result, [WALK_IN_MOBILE])).toEqual([]);
    expect(Object.keys(result.items[0]!).sort()).toEqual(['grade', 'lineTotal', 'name', 'productId', 'qtyKg', 'unitPrice']);
    expect(result.totals).toEqual({ subtotal: '100.00', gst: '18.00', total: '118.00', changeGiven: '82.00' });
    expect(result.payment).toEqual({
      method: 'CASH',
      status: 'CONFIRMED',
      amount: '118.00',
      amountReceived: '200.00',
      cardRef: null,
      upiTxnRef: null,
      confirmedAt: '2026-10-11T04:00:01.000Z',
    });
    expect(result.timeline).toEqual([{ fromStatus: null, toStatus: 'PICKED_UP', at: '2026-10-11T04:00:01.000Z' }]);
    expect(result.invoiceNumber).toBe('TOH/26-27/000001');
  });

  it('BR-94: the detail shows the confirmed payment over an earlier failed one, and a pending UPI sale with no change', async () => {
    const failedThenConfirmed = detailRecord({
      paymentMethod: 'UPI',
      payments: [
        { method: 'UPI', status: 'FAILED', amount: m('118.00'), amountReceived: null, changeGiven: null, cardRef: null, upiTxnRef: null, confirmedAt: null, createdAt: '2026-10-11T04:00:00.000Z' },
        { method: 'UPI', status: 'CONFIRMED', amount: m('118.00'), amountReceived: null, changeGiven: null, cardRef: null, upiTxnRef: 'UPI-REF-9', confirmedAt: '2026-10-11T04:05:00.000Z', createdAt: '2026-10-11T04:04:00.000Z' },
      ],
    });
    const confirmed = await serviceWith(fakeRepo({ findSale: vi.fn(async () => failedThenConfirmed) })).get(subScope(), SALE_ID);
    expect(confirmed.payment.status).toBe('CONFIRMED');
    expect(confirmed.payment.upiTxnRef).toBe('UPI-REF-9');
    expect(confirmed.totals.changeGiven).toBeNull();

    const pending = detailRecord({
      status: 'PENDING_PAYMENT',
      paymentStatus: 'PENDING',
      paymentMethod: 'UPI',
      completedAt: null,
      invoiceNumber: null,
      invoiceId: null,
      payments: [],
    });
    const result = await serviceWith(fakeRepo({ findSale: vi.fn(async () => pending) })).get(subScope(), SALE_ID);
    expect(saleResponse.parse(result)).toEqual(result);
    expect(result.payment).toEqual({
      method: 'UPI',
      status: 'PENDING',
      amount: '118.00',
      amountReceived: null,
      cardRef: null,
      upiTxnRef: null,
      confirmedAt: null,
    });
  });

  it('BR-30b: a sale outside the scope and an unknown id give the same 404 NOT_FOUND, never 403', async () => {
    const repo = fakeRepo({ findSale: vi.fn(async () => null) });
    const outOfScope = await expectAppError(serviceWith(repo).get(subScope(), SALE_ID), 'NOT_FOUND');
    const unknown = await expectAppError(serviceWith(repo).get(subScope(), SALE_ID), 'NOT_FOUND');
    expect(outOfScope.status).toBe(404);
    expect(outOfScope.message).toBe(unknown.message);
  });

  it('BR-96c: history defaults to the Asia/Kolkata day; a q or customerId search with no dates is not date-bounded', async () => {
    const repo = fakeRepo();
    const service = serviceWith(repo);
    await service.list(subScope(), listSalesQuery.parse({}));
    await service.list(subScope(), listSalesQuery.parse({ q: 'SALE-0001' }));
    await service.list(subScope(), listSalesQuery.parse({ customerId: CUSTOMER_ID }));
    await service.list(subScope(), listSalesQuery.parse({ to: '2026-10-05' }));
    await service.list(subScope(), listSalesQuery.parse({ from: '2026-10-01' }));
    const filters = repo.calls.listSales.map((c) => c.filters);
    expect([filters[0]?.from, filters[0]?.to]).toEqual(['2026-10-11', '2026-10-11']);
    expect([filters[1]?.from, filters[1]?.to, filters[1]?.q]).toEqual([undefined, undefined, 'SALE-0001']);
    expect([filters[2]?.from, filters[2]?.to, filters[2]?.customerId]).toEqual([undefined, undefined, CUSTOMER_ID]);
    expect([filters[3]?.from, filters[3]?.to]).toEqual(['2026-10-05', '2026-10-05']);
    expect([filters[4]?.from, filters[4]?.to]).toEqual(['2026-10-01', '2026-10-11']);
    // `from` in the future with no `to` would be an inverted range.
    await expectAppError(service.list(subScope(), listSalesQuery.parse({ from: '2026-10-12' })), 'VALIDATION_FAILED');
  });

  it('BR-63a pattern: the next cursor round-trips to the repo, and a foreign or forged cursor is 422', async () => {
    const next: OrderCursor = { placedAt: '2026-10-11T04:00:00.123456Z', id: SALE_ID };
    const repo = fakeRepo({
      listSales: vi.fn(async (_db, _scope, filters, limit, cursor) => {
        repo.calls.listSales.push({ filters, limit, cursor });
        return { items: [listRecord()], next };
      }),
    });
    const service = serviceWith(repo);
    const first = await service.list(subScope(), listSalesQuery.parse({ limit: '1' }));
    expect(first.page.hasMore).toBe(true);
    await service.list(subScope(), listSalesQuery.parse({ limit: '1', cursor: first.page.nextCursor! }));
    expect(repo.calls.listSales[1]?.cursor).toEqual(next);
    expect(repo.calls.listSales[1]?.limit).toBe(1);

    const forged = Buffer.from(JSON.stringify(['yesterday', 'not-a-uuid']), 'utf8').toString('base64url');
    await expectAppError(service.list(subScope(), listSalesQuery.parse({ cursor: forged })), 'VALIDATION_FAILED');
    await expectAppError(service.list(subScope(), listSalesQuery.parse({ cursor: 'garbage' })), 'VALIDATION_FAILED');
  });
});

describe('sales-read service: market day and channel lists', () => {
  const allocation: AllocationRow = {
    productId: CROP,
    name: 'Carrot',
    grade: 'GRADE_1',
    allocatedQtyKg: '10.000',
    soldQtyKg: '2.500',
    remainingQtyKg: '7.500',
  };

  it('BR-95: the market-day view returns the LIVE_MARKET allocation, the MARKET totals split by method, and that day\'s MARKET sales of venue warehouses', async () => {
    const repo = fakeRepo({
      marketAllocation: vi.fn(async () => [{ ...allocation, sourceFarmerId: 'leak' } as AllocationRow]),
      totalsByMethod: vi.fn(async () => [
        { method: 'CASH' as const, count: 2, revenue: m('0.10') },
        { method: 'UPI' as const, count: 1, revenue: m('0.20') },
      ]),
    });
    const scope = subScope('sales.market_day.view');
    const result = await serviceWith(repo).marketDay(scope, marketDayQuery.parse({ date: '2026-10-09' }));
    expect(salesMarketDayResponse.parse(result)).toEqual(result);
    expect(farmIdentityKeys(result)).toEqual([]);
    expect(result.date).toBe('2026-10-09');
    expect(result.warehouseId).toBe(WH_A);
    expect(result.totals).toEqual({ count: 3, revenue: '0.30' });
    expect(result.byPaymentMethod.find((r) => r.method === 'CASH')).toEqual({ method: 'CASH', count: 2, revenue: '0.10' });
    expect(result.byPaymentMethod.find((r) => r.method === 'CARD')).toEqual({ method: 'CARD', count: 0, revenue: '0.00' });
    expect(result.allocation).toEqual([allocation]);
    expect(vi.mocked(repo.totalsByMethod).mock.calls[0]?.slice(2)).toEqual([
      { from: '2026-10-09', to: '2026-10-09' },
      { channel: 'MARKET', venueOnly: true },
    ]);
    expect(repo.calls.listSales[0]?.filters).toEqual({
      channel: 'MARKET',
      from: '2026-10-09',
      to: '2026-10-09',
      venueOnly: true,
    });
  });

  it('BR-30: the market-day view for another warehouse is 404 for a Sub admin; the date defaults to the Asia/Kolkata day', async () => {
    await expectAppError(
      serviceWith(fakeRepo()).marketDay(subScope('sales.market_day.view'), marketDayQuery.parse({ warehouseId: WH_B })),
      'NOT_FOUND',
    );
    const repo = fakeRepo();
    const result = await serviceWith(repo, new Date('2026-10-10T18:30:00.000Z')).marketDay(
      mainOwn('sales.market_day.view'),
      marketDayQuery.parse({}),
    );
    expect(result.date).toBe('2026-10-11');
    expect(result.warehouseId).toBeNull();
  });

  it('BR-85h: Horeca and B2B rows are serialized to exactly the ChannelOrderListItem key set, for the requested channel only', async () => {
    const row = {
      id: SALE_ID,
      orderNumber: 'ORD-H-1',
      channel: 'HORECA',
      status: 'CONFIRMED',
      paymentStatus: 'PENDING',
      warehouseId: WH_A,
      customerCode: 'CUST-H',
      businessName: 'Hill Cafe',
      itemCount: 3,
      total: m('950.50'),
      placedAt: '2026-10-11T04:00:00.000Z',
      farmerId: 'leak',
    } as ChannelOrderRecord;
    const repo = fakeRepo({ listChannelOrders: vi.fn(async () => ({ items: [row], next: null })) });
    const result = await serviceWith(repo).listChannel(subScope('sales.horeca.view'), 'HORECA', { limit: 20 });
    expect(channelOrderListItemResponse.parse(result.items[0])).toEqual(result.items[0]);
    expect(farmIdentityKeys(result)).toEqual([]);
    expect(result.page).toEqual({ nextCursor: null, hasMore: false });
    expect(vi.mocked(repo.listChannelOrders).mock.calls[0]?.[2]).toBe('HORECA');
  });
});

describe('sales-read routes (wiring)', () => {
  it('BR-85h: /horeca and /b2b declare GET only, and the fixed paths are declared before /:saleId', async () => {
    const { salesReadRouter } = await import('./sales-read.routes.js');
    const routes = (salesReadRouter.stack as unknown as Array<{ route?: { path: string; methods: Record<string, boolean> } }>)
      .filter((layer) => layer.route !== undefined)
      .map((layer) => ({ path: layer.route!.path, methods: Object.keys(layer.route!.methods) }));
    for (const path of ['/horeca', '/b2b', '/summary', '/market-day', '/']) {
      const declared = routes.filter((r) => r.path === path);
      expect(declared.flatMap((r) => r.methods), path).toEqual(['get']);
    }
    const detailIndex = routes.findIndex((r) => r.path.startsWith('/:saleId'));
    for (const path of ['/summary', '/market-day', '/horeca', '/b2b']) {
      expect(routes.findIndex((r) => r.path === path), path).toBeLessThan(detailIndex);
    }
  });
});

// ===========================================================================
// 3. PostgreSQL: every repo query, in a rolled-back transaction
// ===========================================================================
class RollbackFixture extends Error {}

describeIfDatabase('sales-read repo + service (PostgreSQL)', () => {
  let ready = false;

  beforeAll(async () => {
    ready = (await databaseReady('sale_attempts')) && (await databaseReady('sale_payments'));
  });

  async function inRolledBackTx(fn: (tx: Executor) => Promise<void>): Promise<void> {
    const { withTransaction } = await import('../../db/pool.js');
    await withTransaction(async (tx) => {
      await fn(tx);
      throw new RollbackFixture();
    }).catch((error: unknown) => {
      if (!(error instanceof RollbackFixture)) throw error;
    });
  }

  async function serviceOn(tx: Executor, now = new Date('2031-05-10T06:00:00.000Z')) {
    const { salesReadRepo } = await import('./sales-read.repo.js');
    return createSalesReadService({ repo: salesReadRepo, db: tx, now: () => now });
  }

  interface Fixture {
    coonoor: string;
    gudalur: string;
    adminId: string;
    customerId: string;
    cropId: string;
    farmerId: string;
    farmerName: string;
    batchId: string;
    sales: Record<'directCash' | 'marketUpi' | 'pendingUpi' | 'nextDay' | 'online' | 'cancelled' | 'horeca' | 'b2b', string>;
  }

  /**
   * One day, 2031-05-10 IST (far from any other suite's data):
   *  directCash  DIRECT walk-in, CASH, PAID/PICKED_UP, Coonoor, completed 23:59 IST, 0.10, ISSUED invoice
   *  marketUpi   MARKET customer, UPI, PAID/PICKED_UP, Gudalur (venue), 10:30 IST, 0.20, NO invoice
   *  pendingUpi  DIRECT walk-in, UPI PENDING / PENDING_PAYMENT, Coonoor
   *  nextDay     DIRECT walk-in, CASH, completed 2031-05-11 00:01 IST, 5.00
   *  online      ONLINE, PAID/DELIVERED, Coonoor, same day (never in sales reads)
   *  cancelled   DIRECT walk-in, CANCELLED, Coonoor
   *  horeca/b2b  HORECA and B2B orders at Coonoor
   * plus two sale_attempts at Coonoor that day (one SALE_STOCK_CHANGED).
   */
  async function seed(tx: Executor): Promise<Fixture> {
    const { insertCrop, insertFarmerWithPlot, insertUser, randomMobile } = await import('../../test/dbFixtures.js');
    const wh = await tx.query<{ id: string; code: string }>(`SELECT id, code FROM warehouses WHERE code IN ('WH-COON', 'WH-GUDA')`);
    const coonoor = wh.rows.find((w) => w.code === 'WH-COON')!.id;
    const gudalur = wh.rows.find((w) => w.code === 'WH-GUDA')!.id;
    await tx.query(`UPDATE warehouses SET is_market_day_venue = (id = $1) WHERE id IN ($1, $2)`, [gudalur, coonoor]);

    const adminId = await insertUser(tx, 'ADMIN', 'CI sales admin');
    const customerUser = await insertUser(tx, 'CUSTOMER', 'Registered Buyer');
    const customer = await tx.query<{ id: string }>(
      `INSERT INTO customers (user_id, customer_code) VALUES ($1, $2) RETURNING id`,
      [customerUser, `CUST-CI-${newId().slice(0, 8)}`],
    );
    const customerId = customer.rows[0]!.id;
    const bizUser = await insertUser(tx, 'CUSTOMER', 'Hotel Owner');
    const biz = await tx.query<{ id: string }>(
      `INSERT INTO customers (user_id, customer_code, customer_type, business_name) VALUES ($1, $2, 'HORECA', 'Hill Cafe') RETURNING id`,
      [bizUser, `CUST-HB-${newId().slice(0, 8)}`],
    );
    const bizId = biz.rows[0]!.id;

    const cropId = await insertCrop(tx);
    const farmer = await insertFarmerWithPlot(tx);
    const farmerRow = await tx.query<{ full_name: string }>(
      `SELECT u.full_name FROM farmers f JOIN users u ON u.id = f.user_id WHERE f.id = $1`,
      [farmer.farmerId],
    );
    const batch = await tx.query<{ id: string }>(
      `INSERT INTO inventory_batches (batch_code, warehouse_id, crop_id, grade, source_farmer_id, qty_received, expiry_on)
       VALUES ($1, $2, $3, 'GRADE_1', $4, 10, '2031-06-01') RETURNING id`,
      [`B-CI-${newId().slice(0, 8)}`, gudalur, cropId, farmer.farmerId],
    );
    const batchId = batch.rows[0]!.id;
    // The stock is on the shelf through the ledger, as in production: 10 received, 2.5 already sold
    // (the consumed quantity below). Without it qty_available is 0 and the market-day remaining,
    // capped by the shelf (BR-100), would rightly read 0.
    await tx.query(
      `INSERT INTO stock_ledger (batch_id, warehouse_id, movement_type, qty_delta, balance_after, ref_type, remarks)
       VALUES ($1, $2, 'RECEIPT', 7.5, 0, 'TEST', 'fixture receipt net of the 2.5 kg sold')`,
      [batchId, gudalur],
    );
    await tx.query(
      `INSERT INTO allocations (batch_id, warehouse_id, channel, allocated_qty, consumed_qty, reserved_qty)
       VALUES ($1, $2, 'LIVE_MARKET', 10.000, 2.500, 0.500)`,
      [batchId, gudalur],
    );

    async function order(o: {
      warehouseId: string;
      channel: string;
      customerId?: string;
      walkIn?: { name: string; mobile: string | null };
      total: string;
      method: string;
      paymentStatus: string;
      status: string;
      placedAt: string;
      completedAt: string | null;
    }): Promise<string> {
      const result = await tx.query<{ id: string }>(
        `INSERT INTO orders (order_number, customer_id, walk_in_name, walk_in_mobile, warehouse_id, channel,
                             subtotal, gst_amount, total_amount, payment_method, payment_status, status,
                             placed_at, completed_at, cancellation_reason)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $7, $8::payment_method, $9, $10::order_status,
                 $11::timestamptz, $12::timestamptz, CASE WHEN $10 = 'CANCELLED' THEN 'CI fixture' END)
         RETURNING id`,
        [
          `SALE-CI-${newId().slice(0, 13)}`,
          o.customerId ?? null,
          o.walkIn?.name ?? null,
          o.walkIn?.mobile ?? null,
          o.warehouseId,
          o.channel,
          o.total,
          o.method,
          o.paymentStatus,
          o.status,
          o.placedAt,
          o.completedAt,
        ],
      );
      return result.rows[0]!.id;
    }

    const walkIn = { name: 'Counter Walk-in', mobile: '+919876543210' };
    const directCash = await order({
      warehouseId: coonoor, channel: 'DIRECT', walkIn, total: '0.10', method: 'CASH', paymentStatus: 'PAID',
      status: 'PICKED_UP', placedAt: '2031-05-10T18:28:00Z', completedAt: '2031-05-10T18:29:00Z',
    });
    const marketUpi = await order({
      warehouseId: gudalur, channel: 'MARKET', customerId, total: '0.20', method: 'UPI', paymentStatus: 'PAID',
      status: 'PICKED_UP', placedAt: '2031-05-10T05:00:00Z', completedAt: '2031-05-10T05:01:00Z',
    });
    const pendingUpi = await order({
      warehouseId: coonoor, channel: 'DIRECT', walkIn: { name: 'Pending Payer', mobile: null }, total: '7.00',
      method: 'UPI', paymentStatus: 'PENDING', status: 'PENDING_PAYMENT', placedAt: '2031-05-10T06:00:00Z', completedAt: null,
    });
    const nextDay = await order({
      warehouseId: coonoor, channel: 'DIRECT', walkIn, total: '5.00', method: 'CASH', paymentStatus: 'PAID',
      status: 'PICKED_UP', placedAt: '2031-05-10T18:30:30Z', completedAt: '2031-05-10T18:31:00Z',
    });
    const online = await order({
      warehouseId: coonoor, channel: 'ONLINE', customerId, total: '99.00', method: 'WALLET', paymentStatus: 'PAID',
      status: 'DELIVERED', placedAt: '2031-05-10T04:00:00Z', completedAt: '2031-05-10T07:00:00Z',
    });
    const cancelled = await order({
      warehouseId: coonoor, channel: 'DIRECT', walkIn, total: '3.00', method: 'CASH', paymentStatus: 'REFUNDED',
      status: 'CANCELLED', placedAt: '2031-05-10T08:00:00Z', completedAt: null,
    });
    const horeca = await order({
      warehouseId: coonoor, channel: 'HORECA', customerId: bizId, total: '950.50', method: 'UPI', paymentStatus: 'PENDING',
      status: 'CONFIRMED', placedAt: '2031-05-10T09:00:00Z', completedAt: null,
    });
    const b2b = await order({
      warehouseId: coonoor, channel: 'B2B', customerId: bizId, total: '10.00', method: 'UPI', paymentStatus: 'PENDING',
      status: 'CONFIRMED', placedAt: '2031-05-10T09:30:00Z', completedAt: null,
    });

    await tx.query(
      `INSERT INTO order_items (order_id, crop_id, grade, qty_kg, unit_price, line_total, batch_id)
       VALUES ($1, $2, 'GRADE_1', 0.125, 0.80, 0.10, $3), ($4, $2, 'GRADE_1', 0.250, 0.80, 0.20, $3)`,
      [directCash, cropId, batchId, marketUpi],
    );
    await tx.query(
      `INSERT INTO sale_payments (order_id, method, amount, amount_received, change_given, status, idempotency_key, created_by, confirmed_at)
       VALUES ($1, 'CASH', 0.10, 1.00, 0.90, 'CONFIRMED', $3, $4, '2031-05-10T18:29:00Z'),
              ($2, 'UPI', 7.00, NULL, NULL, 'PENDING', $5, $4, NULL)`,
      [directCash, pendingUpi, `ci-${newId()}`, adminId, `ci-${newId()}`],
    );
    await tx.query(
      `INSERT INTO invoices (invoice_number, invoice_type, order_id, fiscal_year, status, total_amount)
       VALUES ($1, 'SALE_RETAIL', $2, '2031-32', 'ISSUED', 0.10)`,
      [`INV-CI-${newId().slice(0, 12)}`, directCash],
    );
    await tx.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note, created_at)
       VALUES ($1, NULL, 'PICKED_UP', $2, $3, '2031-05-10T18:29:00Z')`,
      [directCash, adminId, `sold by ${farmerRow.rows[0]?.full_name ?? 'x'}`],
    );
    await tx.query(
      `INSERT INTO sale_attempts (warehouse_id, actor_id, reason_code, created_at)
       VALUES ($1, $2, 'SALE_STOCK_CHANGED', '2031-05-10T06:00:00Z'),
              ($1, $2, 'WALKIN_WALLET_NOT_ALLOWED', '2031-05-10T07:00:00Z'),
              ($1, $2, 'SALE_STOCK_CHANGED', '2031-05-11T07:00:00Z')`,
      [coonoor, adminId],
    );
    void randomMobile;

    return {
      coonoor,
      gudalur,
      adminId,
      customerId,
      cropId,
      farmerId: farmer.farmerId,
      farmerName: farmerRow.rows[0]?.full_name ?? '',
      batchId,
      sales: { directCash, marketUpi, pendingUpi, nextDay, online, cancelled, horeca, b2b },
    };
  }

  const sub = (warehouseId: string, permission: string): ResolvedScope =>
    aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [warehouseId], permission });
  const DAY = { from: '2031-05-10', to: '2031-05-10' };

  it('BR-96a/b/d/g (PostgreSQL): the summary counts only PAID + PICKED_UP DIRECT/MARKET sales of the Asia/Kolkata day; pending UPI, cancelled, ONLINE and failed attempts are excluded', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const service = await serviceOn(tx);
      const coonoorDay = await service.summary(sub(f.coonoor, 'sales.dashboard.view'), { ...DAY, warehouseId: f.coonoor });
      expect(coonoorDay.count).toBe(1); // directCash only: 23:59 IST on the 10th
      expect(coonoorDay.revenue).toBe('0.10');
      expect(coonoorDay.byChannel).toEqual([
        { channel: 'DIRECT', count: 1, revenue: '0.10' },
        { channel: 'MARKET', count: 0, revenue: '0.00' },
      ]);
      // 00:01 IST on the 11th is the next day.
      const nextDay = await service.summary(sub(f.coonoor, 'sales.dashboard.view'), { from: '2031-05-11', to: '2031-05-11' });
      expect(nextDay.count).toBe(1);
      expect(nextDay.revenue).toBe('5.00');
    });
  });

  it('BR-96e (PostgreSQL): a Sub admin\'s summary excludes other warehouses; MAIN_WH_ADMIN (own) sees all four, with exact sums (0.10 + 0.20 = 0.30)', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const service = await serviceOn(tx);
      const gudalurSub = await service.summary(sub(f.gudalur, 'sales.dashboard.view'), DAY);
      expect(gudalurSub.count).toBe(1);
      expect(gudalurSub.revenue).toBe('0.20');
      await expectAppError(service.summary(sub(f.gudalur, 'sales.dashboard.view'), { ...DAY, warehouseId: f.coonoor }), 'NOT_FOUND');

      const main = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.MAIN_WH_ADMIN, warehouseIds: [], permission: 'sales.dashboard.view' });
      // Narrowed to the two fixture warehouses so other suites' rows cannot skew the sums.
      const both = await Promise.all([
        service.summary(main, { ...DAY, warehouseId: f.coonoor }),
        service.summary(main, { ...DAY, warehouseId: f.gudalur }),
      ]);
      expect(both.map((s) => s.revenue)).toEqual(['0.10', '0.20']);
      const all = await service.summary(main, DAY);
      expect(all.warehouseId).toBeNull();
      expect(all.count).toBeGreaterThanOrEqual(2);
      expect(all.byPaymentMethod.find((r) => r.method === 'UPI')?.count).toBeGreaterThanOrEqual(1);
    });
  });

  it('BR-96b (PostgreSQL): needs attention counts the pending UPI sale, the failed attempts of the day (stock subset) and a completed sale with no ISSUED invoice', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const service = await serviceOn(tx);
      const coonoor = await service.summary(sub(f.coonoor, 'sales.dashboard.view'), DAY);
      expect(coonoor.needsAttention).toEqual({ paymentPending: 1, stockIssues: 1, failedSales: 2, invoiceIssues: 0 });
      const gudalur = await service.summary(sub(f.gudalur, 'sales.dashboard.view'), DAY);
      expect(gudalur.needsAttention).toEqual({ paymentPending: 0, stockIssues: 0, failedSales: 0, invoiceIssues: 1 });
    });
  });

  it('BR-96c (PostgreSQL): the summary equals the PAID + PICKED_UP rows of GET /sales for the same day and scope, in exact paise', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const service = await serviceOn(tx);
      for (const day of ['2031-05-10', '2031-05-11']) {
        const summary = await service.summary(sub(f.coonoor, 'sales.dashboard.view'), { from: day, to: day });
        const page = await service.list(sub(f.coonoor, 'sales.history.view'), listSalesQuery.parse({ from: day, to: day, limit: '100' }));
        const completed = page.items.filter((i) => i.paymentStatus === 'PAID' && i.status === 'PICKED_UP');
        expect(completed.length, day).toBe(summary.count);
        const paise = completed.reduce((sum, i) => sum + Math.round(Number(i.total.replace('.', ''))), 0);
        expect(paise, day).toBe(Number(summary.revenue.replace('.', '')));
      }
    });
  });

  it('BR-30a / BR-92 (PostgreSQL): history is confined to the Sub admin\'s warehouse, never lists ONLINE/HORECA/B2B, masks the walk-in mobile, filters and searches', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const service = await serviceOn(tx);
      const scope = sub(f.coonoor, 'sales.history.view');
      const page = await service.list(scope, listSalesQuery.parse({ ...DAY, limit: '100' }));
      const ids = page.items.map((i) => i.id);
      expect(ids).toEqual(expect.arrayContaining([f.sales.directCash, f.sales.pendingUpi, f.sales.cancelled]));
      for (const absent of [f.sales.marketUpi, f.sales.online, f.sales.horeca, f.sales.b2b, f.sales.nextDay]) {
        expect(ids).not.toContain(absent);
      }
      for (const item of page.items) expect(saleListItemResponse.parse(item)).toEqual(item);
      expect(mobileFragments(page, [WALK_IN_MOBILE])).toEqual([]);
      expect(farmIdentityKeys(page)).toEqual([]);
      const direct = page.items.find((i) => i.id === f.sales.directCash)!;
      expect(direct.buyer).toEqual({ kind: 'WALK_IN', customerId: null, customerCode: null, name: 'Counter Walk-in', mobileMasked: '*********3210' });
      expect(direct.itemCount).toBe(1);
      expect(direct.invoiceNumber).toMatch(/^INV-CI-/);

      const pending = await service.list(scope, listSalesQuery.parse({ ...DAY, paymentStatus: 'PENDING' }));
      expect(pending.items.map((i) => i.id)).toEqual([f.sales.pendingUpi]);
      const cash = await service.list(scope, listSalesQuery.parse({ ...DAY, paymentMethod: 'CASH', status: 'PICKED_UP' }));
      expect(cash.items.map((i) => i.id)).toEqual([f.sales.directCash]);

      // Search: a walk-in name substring and a FULL mobile match; a partial mobile does not.
      const byName = await service.list(scope, listSalesQuery.parse({ q: 'pending pay' }));
      expect(byName.items.map((i) => i.id)).toEqual([f.sales.pendingUpi]);
      const byMobile = await service.list(scope, listSalesQuery.parse({ q: '9876543210' }));
      expect(byMobile.items.map((i) => i.id).sort()).toEqual([f.sales.cancelled, f.sales.directCash, f.sales.nextDay].sort());
      const partial = await service.list(scope, listSalesQuery.parse({ q: '98765' }));
      expect(partial.items).toEqual([]);
      // A Gudalur sale cannot be found by a Coonoor admin, even by its exact number.
      const gudalurNumber = await tx.query<{ order_number: string }>(`SELECT order_number FROM orders WHERE id = $1`, [f.sales.marketUpi]);
      const cross = await service.list(scope, listSalesQuery.parse({ q: gudalurNumber.rows[0]!.order_number }));
      expect(cross.items).toEqual([]);
      // customerId filter, scope still applies.
      const byCustomer = await service.list(sub(f.gudalur, 'sales.history.view'), listSalesQuery.parse({ customerId: f.customerId }));
      expect(byCustomer.items.map((i) => i.id)).toEqual([f.sales.marketUpi]);
      expect(byCustomer.items[0]?.buyer.kind).toBe('CUSTOMER');
    });
  });

  it('BR-63a pattern (PostgreSQL): cursor pagination walks every row once, newest first', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const service = await serviceOn(tx);
      const scope = sub(f.coonoor, 'sales.history.view');
      const all = await service.list(scope, listSalesQuery.parse({ ...DAY, limit: '100' }));
      const walked: string[] = [];
      let cursor: string | undefined;
      do {
        const page = await service.list(scope, listSalesQuery.parse({ ...DAY, limit: '1', ...(cursor ? { cursor } : {}) }));
        walked.push(...page.items.map((i) => i.id));
        cursor = page.page.nextCursor ?? undefined;
      } while (cursor !== undefined);
      expect(walked).toEqual(all.items.map((i) => i.id));
    });
  });

  it('BR-90a / BR-30b (PostgreSQL): the sale detail has items, payment, invoice and timeline with no farm identity at any depth; another warehouse\'s sale is 404', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const service = await serviceOn(tx);
      const sale = await service.get(sub(f.coonoor, 'sales.history.view'), f.sales.directCash);
      expect(saleResponse.parse(sale)).toEqual(sale);
      expect(farmIdentityKeys(sale)).toEqual([]);
      const json = JSON.stringify(sale);
      expect(json).not.toContain(f.farmerId);
      expect(json).not.toContain(f.batchId);
      if (f.farmerName !== '') expect(json).not.toContain(f.farmerName);
      expect(mobileFragments(sale, [WALK_IN_MOBILE])).toEqual([]);
      expect(sale.items).toEqual([
        { productId: f.cropId, name: 'Fixture Crop', grade: 'GRADE_1', qtyKg: '0.125', unitPrice: '0.80', lineTotal: '0.10' },
      ]);
      expect(sale.payment).toEqual({
        method: 'CASH', status: 'CONFIRMED', amount: '0.10', amountReceived: '1.00', cardRef: null, upiTxnRef: null,
        confirmedAt: '2031-05-10T18:29:00.000Z',
      });
      expect(sale.totals.changeGiven).toBe('0.90');
      expect(sale.invoiceId).not.toBeNull();
      expect(sale.timeline).toEqual([{ fromStatus: null, toStatus: 'PICKED_UP', at: '2031-05-10T18:29:00.000Z' }]);

      await expectAppError(service.get(sub(f.coonoor, 'sales.history.view'), f.sales.marketUpi), 'NOT_FOUND');
      await expectAppError(service.get(sub(f.coonoor, 'sales.history.view'), newId()), 'NOT_FOUND');
      // An ONLINE order is not a sale: 404 here even for an all-scope actor.
      const all = aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.TOHFA_ADMIN, warehouseIds: [], permission: 'sales.history.view' });
      await expectAppError(service.get(all, f.sales.online), 'NOT_FOUND');
      expect((await service.get(all, f.sales.marketUpi)).buyer.kind).toBe('CUSTOMER');
    });
  });

  it('BR-95 (PostgreSQL): the market-day view shows the LIVE_MARKET allocation and the MARKET totals of a venue; a non-venue warehouse has none', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const service = await serviceOn(tx);
      const venue = await service.marketDay(sub(f.gudalur, 'sales.market_day.view'), marketDayQuery.parse({ date: '2031-05-10' }));
      expect(salesMarketDayResponse.parse(venue)).toEqual(venue);
      expect(farmIdentityKeys(venue)).toEqual([]);
      expect(venue.allocation).toEqual([
        { productId: f.cropId, name: 'Fixture Crop', grade: 'GRADE_1', allocatedQtyKg: '10.000', soldQtyKg: '2.500', remainingQtyKg: '7.000' },
      ]);
      expect(venue.totals).toEqual({ count: 1, revenue: '0.20' });
      expect(venue.byPaymentMethod.find((r) => r.method === 'UPI')).toEqual({ method: 'UPI', count: 1, revenue: '0.20' });
      expect(venue.byPaymentMethod.find((r) => r.method === 'CASH')).toEqual({ method: 'CASH', count: 0, revenue: '0.00' });
      expect(venue.items.map((i) => i.id)).toEqual([f.sales.marketUpi]);

      const notVenue = await service.marketDay(sub(f.coonoor, 'sales.market_day.view'), marketDayQuery.parse({ date: '2031-05-10' }));
      expect(notVenue.allocation).toEqual([]);
      expect(notVenue.totals).toEqual({ count: 0, revenue: '0.00' });
      expect(notVenue.items).toEqual([]);
    });
  });

  it('BR-85h (PostgreSQL): the Horeca and B2B lists show only that channel, inside the scope, with the documented keys', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const service = await serviceOn(tx);
      const horeca = await service.listChannel(sub(f.coonoor, 'sales.horeca.view'), 'HORECA', { limit: 100 });
      const mine = horeca.items.find((i) => i.id === f.sales.horeca)!;
      expect(channelOrderListItemResponse.parse(mine)).toEqual(mine);
      expect(mine).toMatchObject({ channel: 'HORECA', businessName: 'Hill Cafe', total: '950.50', itemCount: 0 });
      expect(horeca.items.every((i) => i.channel === 'HORECA')).toBe(true);
      const b2b = await service.listChannel(sub(f.coonoor, 'sales.b2b.view'), 'B2B', { limit: 100 });
      expect(b2b.items.map((i) => i.id)).toContain(f.sales.b2b);
      expect(b2b.items.map((i) => i.id)).not.toContain(f.sales.horeca);
      const otherWarehouse = await service.listChannel(sub(f.gudalur, 'sales.horeca.view'), 'HORECA', { limit: 100 });
      expect(otherWarehouse.items.map((i) => i.id)).not.toContain(f.sales.horeca);
    });
  });
});

// ===========================================================================
// 4. Real HTTP through a local express app mounting the router at /v1/admin/sales
// ===========================================================================
describeIfDatabase('sales-read routes (HTTP, PostgreSQL)', () => {
  let ready = false;
  let server: Server;
  const tokens: Record<string, string> = {};
  const seededUserId = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    ready = await databaseReady('sale_attempts');
    if (!ready) return;
    const [{ salesReadRouter }, { signAccessToken }, { pool }, { errorHandler, notFoundHandler }] = await Promise.all([
      import('./sales-read.routes.js'),
      import('../../auth/jwt.js'),
      import('../../db/pool.js'),
      import('../../http/errorHandler.js'),
    ]);
    const app = express();
    app.use(express.json());
    app.use('/v1/admin/sales', salesReadRouter);
    app.use(notFoundHandler);
    app.use(errorHandler);
    server = app.listen(0);
    const wh = await pool.query<{ id: string }>(`SELECT id FROM warehouses WHERE code = 'WH-COON'`);
    const coonoor = wh.rows[0]!.id;
    const base = { farmerId: null, customerId: null };
    tokens['sub'] = signAccessToken({ sub: seededUserId, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: coonoor }], ...base });
    tokens['main'] = signAccessToken({ sub: seededUserId, roles: [{ code: RoleCode.MAIN_WH_ADMIN }], ...base });
    tokens['tohfa'] = signAccessToken({ sub: seededUserId, roles: [{ code: RoleCode.TOHFA_ADMIN }], ...base });
    tokens['super'] = signAccessToken({ sub: seededUserId, roles: [{ code: RoleCode.SUPER_ADMIN }], ...base });
    tokens['farmer'] = signAccessToken({ sub: seededUserId, roles: [{ code: RoleCode.FARMER }], farmerId: newId(), customerId: null });
    tokens['customer'] = signAccessToken({ sub: seededUserId, roles: [{ code: RoleCode.CUSTOMER }], farmerId: null, customerId: newId() });
    tokens['farmerAdmin'] = signAccessToken({ sub: seededUserId, roles: [{ code: RoleCode.FARMER_ADMIN, zoneId: newId() }], ...base });
  });

  afterAll(async () => {
    if (!ready) return;
    const [{ closePool }, { closeRedis }] = await Promise.all([import('../../db/pool.js'), import('../../redis.js')]);
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await Promise.allSettled([closePool(), closeRedis()]);
  });

  const auth = (name: string): string => `Bearer ${tokens[name]!}`;
  const READ_ROUTES = ['/summary', '', '/market-day', '/horeca', '/b2b'].map((p) => `/v1/admin/sales${p}`);

  it('BR-85c / BR-96f (HTTP): every read route is 401 without a token, 403 for FARMER, FARMER_ADMIN and CUSTOMER, and 200 for the four admin roles', async () => {
    if (!ready) return;
    for (const path of READ_ROUTES) {
      expect((await request(server).get(path)).status, path).toBe(401);
      for (const who of ['farmer', 'farmerAdmin', 'customer']) {
        const res = await request(server).get(path).set('Authorization', auth(who));
        expect(res.status, `${who} ${path}`).toBe(403);
        expect(res.headers['content-type']).toContain('application/problem+json');
      }
      for (const who of ['sub', 'main', 'tohfa', 'super']) {
        const res = await request(server).get(path).set('Authorization', auth(who));
        expect(res.status, `${who} ${path}`).toBe(200);
      }
    }
    // The detail route has the same matrix; an unknown id is 404 for the admin roles (BR-30b).
    const detail = `/v1/admin/sales/${newId()}`;
    expect((await request(server).get(detail)).status).toBe(401);
    expect((await request(server).get(detail).set('Authorization', auth('customer'))).status).toBe(403);
    for (const who of ['sub', 'main', 'tohfa', 'super']) {
      const res = await request(server).get(detail).set('Authorization', auth(who));
      expect(res.status, who).toBe(404);
      expect(res.headers['content-type']).toContain('application/problem+json');
    }
  });

  it('BR-85h (HTTP): no mutating verb exists on /horeca and /b2b; a malformed query is a 422 problem', async () => {
    if (!ready) return;
    for (const path of ['/v1/admin/sales/horeca', '/v1/admin/sales/b2b']) {
      for (const method of ['post', 'put', 'patch', 'delete'] as const) {
        const res = await request(server)[method](path).set('Authorization', auth('super')).send({});
        expect([404, 405], `${method} ${path}`).toContain(res.status);
      }
    }
    // A fixed path of the write router (not mounted here) is not taken for a sale id: it falls
    // through to the 404 handler instead of a 422 "saleId must be a UUID".
    const products = await request(server).get('/v1/admin/sales/products').set('Authorization', auth('super'));
    expect(products.status).toBe(404);
    const malformed = await request(server).get(`/v1/admin/sales/${'z'.repeat(36)}`).set('Authorization', auth('super'));
    expect(malformed.status).toBe(404);
    const notUuid = await request(server).get(`/v1/admin/sales/${'a'.repeat(36)}`).set('Authorization', auth('super'));
    expect(notUuid.status).toBe(422);
    const bad = await request(server).get('/v1/admin/sales?channel=ONLINE').set('Authorization', auth('sub'));
    expect(bad.status).toBe(422);
    const badDates = await request(server).get('/v1/admin/sales/summary?from=2026-10-12&to=2026-10-11').set('Authorization', auth('sub'));
    expect(badDates.status).toBe(422);
  });
});
