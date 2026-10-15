/**
 * SWA Module 7 (Customers) - unit tests, no database.
 *
 *   1. policy: access resolution from the scope (BR-91), mobile masking (BR-92), the farmer-identity
 *      redactor (BR-97), opaque keyset cursors,
 *   2. service against a stub repo: masking by scope (BR-92), 404-not-403 (BR-91c), the read-only
 *      wallet (BR-93), support-thread redaction and the reply (BR-97), the active window (BR-98),
 *      allow-list serializers (BR-90),
 *   3. routes: the route table (BR-93a, BR-93f) and the permission matrix through a real Express
 *      stack with a stub service (BR-91a, BR-93b, BR-97d).
 *
 * The PostgreSQL behaviour of the same rules (the visibility predicate, the ledger sum, the
 * keyset, the audit row) is in customers.db.test.ts.
 */
import { describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { errorHandler, notFoundHandler } from '../../http/errorHandler.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, IDS, newId } from '../../test/factories.js';
import {
  buildRedactor,
  customerAccess,
  decodeNameKey,
  decodeTimeKey,
  encodeNameKey,
  encodeTimeKey,
  maskMobile,
  REDACTED,
} from './customers.policy.js';
import type { CustomerRow, CustomersRepo, MessageRow, TicketRow } from './customers.repo.js';
import { createCustomersRouter, customersRouter } from './customers.routes.js';
import {
  adminCustomerDetailSchema,
  adminCustomerIssueSchema,
  adminCustomerListResponseSchema,
  adminCustomerOrderSchema,
  adminCustomerPurchaseSchema,
  adminCustomerSupportMessageSchema,
  adminCustomerSupportTicketDetailSchema,
  adminCustomerSupportTicketSchema,
  adminCustomerWalletSummarySchema,
} from './customers.schema.js';
import { createCustomersService, type CustomersService } from './customers.service.js';

// ===========================================================================
// Fixtures
// ===========================================================================
const OOTY = IDS.warehouseOoty;
const MOBILE = '+919876543210';

const subOoty = (permission = 'customer.list.view'): ResolvedScope =>
  aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [OOTY], permission, userId: IDS.userSubWhAdmin });
const mainNoWarehouse = (permission = 'customer.list.view'): ResolvedScope =>
  aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.MAIN_WH_ADMIN, warehouseIds: [], permission });
const superAll = (permission = 'customer.list.view'): ResolvedScope => aScope({ permission });

function aCustomerRow(overrides: Partial<CustomerRow> = {}): CustomerRow {
  return {
    id: IDS.customer,
    customerCode: 'CUST-0001',
    customerType: 'RETAIL',
    businessName: null,
    preferredWarehouseId: OOTY,
    fullName: 'Lakshmi Narayan',
    mobile: MOBILE,
    email: 'lakshmi@example.com',
    totalOrders: 3,
    lifetimeValue: '1820.5',
    lastOrderAt: '2026-09-01T10:00:00.000Z',
    lastActivityAt: '2026-09-01T10:00:00.000Z',
    isActive: true,
    isNew: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const TICKET_ID = '50000000-0000-4000-8000-000000000001';

function aTicketRow(overrides: Partial<TicketRow> = {}): TicketRow {
  return {
    id: TICKET_ID,
    ticketNumber: 'TKT-2026-00001',
    orderId: null,
    category: 'QUALITY',
    subject: 'Carrots were soft',
    description: 'The carrots from my last order were soft.',
    status: 'OPEN',
    priority: 'NORMAL',
    resolvedAt: null,
    createdAt: '2026-09-02T10:00:00.000Z',
    updatedAt: '2026-09-02T10:00:00.000Z',
    cursorTs: '2026-09-02T10:00:00.000000Z',
    ...overrides,
  };
}

function aMessage(overrides: Partial<MessageRow> = {}): MessageRow {
  return {
    id: newId(),
    ticketId: TICKET_ID,
    senderUserId: newId(),
    senderRole: 'CUSTOMER',
    body: 'Please help',
    isInternal: false,
    attachmentKey: null,
    createdAt: '2026-09-02T10:05:00.000Z',
    ...overrides,
  };
}

const FARMER_ID = '30000000-0000-4000-8000-0000000000aa';
const IDENTITY = {
  terms: [FARMER_ID, 'TOHFA-F-0042', 'Green Valley Farm', 'Ithalar'],
  personNames: ['Ramesh Kumar'],
};

/** A stub repo: every method is a vi.fn with a harmless default; tests override what they need. */
function stubRepo(overrides: Partial<CustomersRepo> = {}): CustomersRepo {
  return {
    readActiveWindowDays: vi.fn(async () => 90),
    listCustomers: vi.fn(async () => ({ rows: [aCustomerRow()], hasMore: false })),
    summarize: vi.fn(async () => ({ total: 1, active: 1, new: 0 })),
    findCustomer: vi.fn(async () => aCustomerRow()),
    isVisible: vi.fn(async () => true),
    listAddresses: vi.fn(async () => [
      { id: newId(), label: 'HOME', line1: '12 Charing Cross', line2: null, city: 'Ooty', state: 'Tamil Nadu', pincode: '643001', isDefault: true },
    ]),
    listPurchases: vi.fn(async () => ({ rows: [], hasMore: false })),
    listOrders: vi.fn(async () => ({ rows: [], hasMore: false })),
    findWallet: vi.fn(async () => ({
      walletId: newId(),
      status: 'ACTIVE',
      currency: 'INR',
      ledgerBalance: '150',
      transactionCount: 2,
      lastTransactionAt: '2026-09-01T10:00:00.000Z',
    })),
    listWalletTransactions: vi.fn(async () => ({ rows: [], hasMore: false })),
    findWalletTransaction: vi.fn(async () => null),
    listIssues: vi.fn(async () => ({ rows: [], hasMore: false })),
    listTickets: vi.fn(async () => ({ rows: [aTicketRow()], hasMore: false })),
    findTicket: vi.fn(async () => aTicketRow()),
    listMessages: vi.fn(async () => []),
    farmerIdentityTerms: vi.fn(async () => IDENTITY),
    customerContact: vi.fn(async () => ({ mobile: MOBILE, email: 'lakshmi@example.com' })),
    insertMessage: vi.fn(async () => ({ id: newId(), createdAt: '2026-09-03T10:00:00.000Z' })),
    ...overrides,
  };
}

/** A fake Executor that records every statement, so the audit insert can be asserted. */
function recordingExecutor(): Executor & { statements: string[] } {
  const statements: string[] = [];
  return {
    statements,
    query: (async (sql: string) => {
      statements.push(sql);
      return { rows: [{ id: newId() }], rowCount: 1 };
    }) as unknown as Executor['query'],
  } as Executor & { statements: string[] };
}

function service(repo: CustomersRepo, extra: { tx?: Executor; log?: (m: string, c: Record<string, unknown>) => void } = {}) {
  const tx = extra.tx ?? recordingExecutor();
  return createCustomersService({
    repo,
    db: tx,
    transaction: async (fn) => fn(tx),
    ...(extra.log === undefined ? {} : { log: extra.log }),
  });
}

async function rejection(promise: Promise<unknown>): Promise<AppError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    return error as AppError;
  }
  throw new Error('expected a rejection');
}

/** Every key at every depth of a JSON value. */
function allKeys(value: unknown, into: Set<string> = new Set()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => allKeys(v, into));
  else if (value !== null && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      into.add(k);
      allKeys(v, into);
    }
  }
  return into;
}

const FARMER_IDENTITY_KEYS = ['farmerId', 'farmer_id', 'farmerName', 'farmName', 'farmId', 'village', 'gps', 'lat', 'lng', 'latitude', 'longitude', 'fmb', 'batchId', 'batch_id', 'batchCode', 'sourceFarmerId'];

/** BR-92a: no run of more than four consecutive digits of the stored number anywhere. */
function leaksMobile(value: unknown, mobile: string): boolean {
  const digits = mobile.replace(/\D/g, '');
  const json = JSON.stringify(value);
  for (let i = 0; i + 5 <= digits.length; i += 1) {
    if (json.includes(digits.slice(i, i + 5))) return true;
  }
  return false;
}

// ===========================================================================
// 1. Policy
// ===========================================================================
describe('customers policy', () => {
  it('BR-91: an own-scope Sub Warehouse Admin is confined to its warehouse; scope all is not; a Main admin with no warehouse sees all four; an owner-scoped actor sees nothing', () => {
    expect(customerAccess(subOoty())).toEqual({ warehouseIds: [OOTY], denyAll: false, masked: true });
    expect(customerAccess(superAll())).toEqual({ warehouseIds: null, denyAll: false, masked: false });
    expect(customerAccess(mainNoWarehouse())).toEqual({ warehouseIds: null, denyAll: false, masked: true });
    expect(customerAccess(aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.CUSTOMER, customerId: IDS.customer })).denyAll).toBe(true);
  });

  it('BR-92d: masking is chosen by the resolved scope level, not the role: TOHFA_ADMIN granted `own` is masked, SUB_WH_ADMIN granted `all` is not', () => {
    expect(customerAccess(aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.TOHFA_ADMIN })).masked).toBe(true);
    expect(customerAccess(aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [OOTY] })).masked).toBe(false);
  });

  it('BR-92b: the masked mobile is `*` for every character but the last four digits', () => {
    expect(maskMobile('+919876543210')).toBe('*********3210');
    expect(maskMobile('+919876543210')).toHaveLength('+919876543210'.length);
    expect(maskMobile('+919876543210')).toMatch(/^\*+[0-9]{0,4}$/);
  });

  it('BR-92e: a mobile of four characters or fewer is masked fully, without error', () => {
    expect(maskMobile('123')).toBe('***');
    expect(maskMobile('1234')).toBe('****');
    expect(maskMobile('')).toMatch(/^\*+$/);
  });

  it('BR-97: the redactor removes farmer id, code, farm name, village, the full farmer name and its parts, and GPS pairs, case-insensitively', () => {
    const r = buildRedactor(IDENTITY.terms, IDENTITY.personNames);
    const text = `Batch from ramesh kumar (${FARMER_ID}, TOHFA-F-0042) at GREEN VALLEY FARM, Ithalar, 11.410200, 76.695000. Ramesh said sorry.`;
    const out = r.redact(text);
    expect(out.changed).toBe(true);
    for (const leaked of ['ramesh', 'Ramesh', FARMER_ID, 'TOHFA-F-0042', 'GREEN VALLEY', 'Ithalar', '11.410200', '76.695000']) {
      expect(out.text).not.toContain(leaked);
    }
    expect(out.text).toContain(REDACTED);
    expect(r.matches(text)).toBe(true);
  });

  it('BR-97: text without a farmer identity is left alone; a farm-name word on its own ("farm") is not treated as an identity', () => {
    const r = buildRedactor(IDENTITY.terms, IDENTITY.personNames);
    const text = 'Your refund for the farm-fresh carrots is on its way.';
    expect(r.redact(text)).toEqual({ text, changed: false });
    expect(r.matches(text)).toBe(false);
  });

  it('BR-97: terms shorter than three characters are ignored and regex metacharacters in a term are literal', () => {
    const r = buildRedactor(['ab', 'A.B (x)'], []);
    expect(r.matches('ab cd')).toBe(false);
    expect(r.matches('AxB yes')).toBe(false);
    expect(r.redact('see A.B (x) now').text).toBe(`see ${REDACTED} now`);
  });

  it('cursors are opaque round-trips; a tampered cursor is a 422 VALIDATION_FAILED', () => {
    const name = { name: 'Lakshmi', id: IDS.customer };
    expect(decodeNameKey(encodeNameKey(name))).toEqual(name);
    const time = { ts: '2026-09-01T10:00:00.123456Z', id: IDS.customer };
    expect(decodeTimeKey(encodeTimeKey(time))).toEqual(time);
    for (const bad of ['not-base64!', encodeNameKey({ name: 'x', id: 'not-a-uuid' }), Buffer.from('["x"]').toString('base64url')]) {
      expect(() => decodeNameKey(bad)).toThrowError(AppError);
    }
    expect(() => decodeTimeKey(encodeNameKey(name))).toThrowError(AppError);
  });

  it('BR-93: a time cursor carrying an impossible timestamp (month 99, 30 February, hour 24) is a 422 VALIDATION_FAILED, never a 500 from the cast', () => {
    for (const ts of ['2026-99-99T00:00:00.000000Z', '2026-02-30T10:00:00.000000Z', '2026-09-01T24:00:00.000000Z', '2026-09-01T10:60:00.000000Z']) {
      let caught: unknown;
      try {
        decodeTimeKey(encodeTimeKey({ ts, id: IDS.customer }));
      } catch (error) {
        caught = error;
      }
      expect(caught, ts).toBeInstanceOf(AppError);
      expect((caught as AppError).status, ts).toBe(422);
    }
    // A real leap day is fine.
    expect(decodeTimeKey(encodeTimeKey({ ts: '2028-02-29T23:59:59.999999Z', id: IDS.customer })).ts).toBe('2028-02-29T23:59:59.999999Z');
  });

  it('BR-16: a farmer mobile given to the redactor as a phone is redacted however it is written (with or without +91, spaces or dashes)', () => {
    const r = buildRedactor(IDENTITY.terms, IDENTITY.personNames, { phones: ['+919443322110'] });
    for (const text of ['call 9443322110', 'call +91 94433 22110', 'call 94433-22110', 'call +919443322110']) {
      const out = r.redact(text);
      expect(out.changed, text).toBe(true);
      expect(leaksMobile(out.text, '+919443322110'), text).toBe(false);
      expect(r.matches(text), text).toBe(true);
    }
    // Four digits of it are not an identity (BR-92a allows at most four), and other numbers are left alone.
    expect(r.redact('order total 2110 rupees, ticket 12345').changed).toBe(false);
  });
});

// ===========================================================================
// 2. Service with a stub repo
// ===========================================================================
describe('customers service: list and detail (BR-91, BR-92, BR-98)', () => {
  it('BR-92a: an own-scope list item carries piiMasked, the masked mobile, name and code, and NO mobile or email key', async () => {
    const res = await service(stubRepo()).list(subOoty(), { limit: 20 });
    expect(adminCustomerListResponseSchema.parse(res)).toEqual(res);
    const [item] = res.items;
    expect(item).toMatchObject({ piiMasked: true, mobileMasked: '*********3210', name: 'Lakshmi Narayan', customerCode: 'CUST-0001' });
    expect(item).not.toHaveProperty('mobile');
    expect(item).not.toHaveProperty('email');
    expect(leaksMobile(res, MOBILE)).toBe(false);
    expect(JSON.stringify(res)).not.toContain('lakshmi@example.com');
  });

  it('BR-92c: an all-scope list item carries the full mobile and email', async () => {
    const res = await service(stubRepo()).list(superAll(), { limit: 20 });
    expect(res.items[0]).toMatchObject({ piiMasked: false, mobile: MOBILE, email: 'lakshmi@example.com', mobileMasked: '*********3210' });
  });

  it('BR-91: the list hands the repo the resolved access (confined + masked for own) and returns the repo summary', async () => {
    const repo = stubRepo({ summarize: vi.fn(async () => ({ total: 7, active: 4, new: 2 })) });
    const res = await service(repo).list(subOoty(), { limit: 20, q: 'lak', status: 'ACTIVE' });
    expect(repo.listCustomers).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ access: { warehouseIds: [OOTY], denyAll: false, masked: true }, q: 'lak', status: 'ACTIVE', limit: 20, windowDays: 90 }),
    );
    expect(repo.summarize).toHaveBeenCalledWith(expect.anything(), { warehouseIds: [OOTY], denyAll: false, masked: true }, 90);
    expect(res.summary).toEqual({ total: 7, active: 4, new: 2 });
  });

  it('list pagination: hasMore yields an opaque nextCursor naming the last row; the cursor is decoded for the next call', async () => {
    const rows = [aCustomerRow({ id: newId(), fullName: 'A' }), aCustomerRow({ id: newId(), fullName: 'B' })];
    const repo = stubRepo({ listCustomers: vi.fn(async () => ({ rows, hasMore: true })) });
    const svc = service(repo);
    const first = await svc.list(superAll(), { limit: 2 });
    expect(first.page.hasMore).toBe(true);
    expect(decodeNameKey(first.page.nextCursor!)).toEqual({ name: 'B', id: rows[1]!.id });
    await svc.list(superAll(), { limit: 2, cursor: first.page.nextCursor! });
    expect(repo.listCustomers).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ after: { name: 'B', id: rows[1]!.id } }));
    const last = await service(stubRepo()).list(superAll(), { limit: 20 });
    expect(last.page).toEqual({ nextCursor: null, hasMore: false });
  });

  it('BR-98f: the active window comes from system_config (a configured 30 is what the repo receives)', async () => {
    const repo = stubRepo({ readActiveWindowDays: vi.fn(async () => 30) });
    await service(repo).list(superAll(), { limit: 20 });
    expect(repo.listCustomers).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ windowDays: 30 }));
  });

  it('BR-98i: a missing active_customer_window_days falls back to the documented 90 and logs it, rather than failing', async () => {
    const log = vi.fn();
    const repo = stubRepo({ readActiveWindowDays: vi.fn(async () => null) });
    await service(repo, { log }).list(superAll(), { limit: 20 });
    expect(repo.listCustomers).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ windowDays: 90 }));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('active_customer_window_days'), expect.objectContaining({ fallback: 90 }));
  });

  it('BR-92a: an own-scope detail has name, masked mobile, code and aggregates only: no mobile, email or addresses (and the addresses are never read)', async () => {
    const repo = stubRepo();
    const res = await service(repo).get(subOoty('customer.detail.view'), IDS.customer);
    expect(adminCustomerDetailSchema.parse(res)).toEqual(res);
    expect(res).toMatchObject({ piiMasked: true, mobileMasked: '*********3210', lifetimeValue: '1820.50', walletBalance: '150.00' });
    for (const key of ['mobile', 'email', 'addresses']) expect(res).not.toHaveProperty(key);
    expect(repo.listAddresses).not.toHaveBeenCalled();
    expect(leaksMobile(res, MOBILE)).toBe(false);
  });

  it('BR-92c: an all-scope detail has the mobile, email and addresses', async () => {
    const res = await service(stubRepo()).get(superAll('customer.detail.view'), IDS.customer);
    expect(res).toMatchObject({ piiMasked: false, mobile: MOBILE, email: 'lakshmi@example.com' });
    expect(res.addresses).toHaveLength(1);
  });

  it('BR-91c: an invisible or nonexistent customer is 404 NOT_FOUND (never 403) with a body that does not depend on which', async () => {
    const repo = stubRepo({ findCustomer: vi.fn(async () => null) });
    const a = await rejection(service(repo).get(subOoty('customer.detail.view'), newId()));
    const b = await rejection(service(repo).get(subOoty('customer.detail.view'), newId()));
    expect(a.status).toBe(404);
    expect(a.code).toBe('NOT_FOUND');
    expect(a.detail).toBe(b.detail);
  });
});

describe('customers service: sub-resources (BR-91, BR-90, BR-93)', () => {
  const invisible = () => stubRepo({ isVisible: vi.fn(async () => false) });
  const page = { limit: 20 };

  it('BR-91c: every sub-resource of an out-of-scope customer is the same 404 as the profile, and the sub-resource is never read', async () => {
    const repo = invisible();
    const svc = service(repo);
    const profile = await rejection(service(stubRepo({ findCustomer: vi.fn(async () => null) })).get(subOoty(), IDS.customer));
    const calls: Array<() => Promise<unknown>> = [
      () => svc.listPurchases(subOoty(), IDS.customer, page),
      () => svc.listOrders(subOoty(), IDS.customer, page),
      () => svc.getWallet(subOoty(), IDS.customer),
      () => svc.listWalletTransactions(subOoty(), IDS.customer, page),
      () => svc.getWalletTransaction(subOoty(), IDS.customer, newId()),
      () => svc.listIssues(subOoty(), IDS.customer, page),
      () => svc.listSupportTickets(subOoty(), IDS.customer, page),
      () => svc.getSupportTicket(subOoty(), IDS.customer, TICKET_ID),
      () => svc.reply(superAll('support.ticket.respond'), subOoty('customer.support_history.view'), IDS.customer, TICKET_ID, { message: 'Hello' }),
    ];
    for (const call of calls) {
      const error = await rejection(call());
      expect(error.status).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.detail).toBe(profile.detail);
    }
    for (const read of ['listPurchases', 'listOrders', 'findWallet', 'listWalletTransactions', 'findWalletTransaction', 'listIssues', 'listTickets', 'findTicket', 'insertMessage'] as const) {
      expect(repo[read]).not.toHaveBeenCalled();
    }
  });

  it('BR-91g: purchases, orders and issues pass the confined access to the repo for an own actor', async () => {
    const repo = stubRepo();
    const svc = service(repo);
    await svc.listPurchases(subOoty(), IDS.customer, page);
    await svc.listOrders(subOoty(), IDS.customer, page);
    await svc.listIssues(subOoty(), IDS.customer, page);
    for (const fn of [repo.listPurchases, repo.listOrders, repo.listIssues]) {
      expect(fn).toHaveBeenCalledWith(expect.anything(), IDS.customer, expect.objectContaining({ access: expect.objectContaining({ warehouseIds: [OOTY] }) }));
    }
  });

  it('BR-90b: purchase, order and issue rows are serialized through an allow-list: internal fields on the repo row (batch, farmer) never reach the response', async () => {
    const orderId = newId();
    const purchase = {
      orderId, orderNumber: 'ORD-1', channel: 'DIRECT', warehouseId: OOTY, itemId: newId(), productId: newId(), productName: 'Carrot',
      grade: 'GRADE_1', qtyKg: '2.500', unitPrice: '40', lineTotal: '100.00', purchasedAt: '2026-09-01T10:00:00.000Z', cursorTs: '2026-09-01T10:00:00.000000Z',
      batchId: newId(), farmerId: FARMER_ID, farmName: 'Green Valley Farm',
    };
    const order = {
      id: orderId, orderNumber: 'ORD-1', channel: 'DIRECT', status: 'PICKED_UP', paymentStatus: 'PAID', paymentMethod: 'CASH', warehouseId: OOTY,
      itemCount: 1, totalAmount: '100', invoiceNumber: 'R/2026-27/000001', placedAt: '2026-09-01T10:00:00.000Z', completedAt: '2026-09-01T10:00:00.000Z',
      cursorTs: '2026-09-01T10:00:00.000000Z', walkInMobile: '+919999988888', farmerId: FARMER_ID,
    };
    const issue = {
      id: newId(), orderId, orderNumber: 'ORD-1', status: 'REFUNDED', reason: 'Soft', refundAmount: '40.5', createdAt: '2026-09-02T10:00:00.000Z',
      resolvedAt: '2026-09-03T10:00:00.000Z', cursorTs: '2026-09-02T10:00:00.000000Z', note: 'from Ramesh Kumar', farmerId: FARMER_ID,
    };
    const repo = stubRepo({
      listPurchases: vi.fn(async () => ({ rows: [purchase], hasMore: false })) as unknown as CustomersRepo['listPurchases'],
      listOrders: vi.fn(async () => ({ rows: [order], hasMore: false })) as unknown as CustomersRepo['listOrders'],
      listIssues: vi.fn(async () => ({ rows: [issue], hasMore: false })) as unknown as CustomersRepo['listIssues'],
    });
    const svc = service(repo);
    const p = await svc.listPurchases(subOoty(), IDS.customer, page);
    const o = await svc.listOrders(subOoty(), IDS.customer, page);
    const i = await svc.listIssues(subOoty(), IDS.customer, page);
    expect(Object.keys(p.items[0]!).sort()).toEqual(
      ['orderId', 'orderNumber', 'channel', 'warehouseId', 'productId', 'productName', 'grade', 'qtyKg', 'unitPrice', 'lineTotal', 'purchasedAt'].sort(),
    );
    expect(Object.keys(o.items[0]!).sort()).toEqual(
      ['id', 'orderNumber', 'channel', 'status', 'paymentStatus', 'paymentMethod', 'warehouseId', 'itemCount', 'totalAmount', 'invoiceNumber', 'placedAt', 'completedAt'].sort(),
    );
    expect(Object.keys(i.items[0]!).sort()).toEqual(
      ['id', 'kind', 'reference', 'orderId', 'orderNumber', 'status', 'reason', 'refundAmount', 'createdAt', 'resolvedAt'].sort(),
    );
    expect(adminCustomerPurchaseSchema.parse(p.items[0])).toEqual(p.items[0]);
    expect(adminCustomerOrderSchema.parse(o.items[0])).toEqual(o.items[0]);
    expect(adminCustomerIssueSchema.parse(i.items[0])).toEqual(i.items[0]);
    expect(p.items[0]).toMatchObject({ unitPrice: '40.00', lineTotal: '100.00' });
    expect(i.items[0]).toMatchObject({ kind: 'RETURN', refundAmount: '40.50' });
    // `reference` is derived (return_requests has no number column): `RET-` + the first 8 hex
    // characters of the id, upper-cased. Pinned here because openapi and rules document it.
    expect(i.items[0]!.reference).toBe(`RET-${issue.id.slice(0, 8).toUpperCase()}`);
    expect(i.items[0]!.reference).toMatch(/^RET-[0-9A-F]{8}$/);
    for (const res of [p, o, i]) {
      const keys = allKeys(res);
      for (const k of FARMER_IDENTITY_KEYS) expect(keys.has(k), k).toBe(false);
      expect(JSON.stringify(res)).not.toContain('Ramesh');
    }
  });

  it('BR-91h: refundAmount is ABSENT until an inspection accepted a quantity; resolvedAt is passed through as null while open', async () => {
    const open = {
      id: '7a1b2c3d-0000-4000-8000-000000000001', orderId: newId(), orderNumber: 'ORD-2', status: 'PENDING', reason: null, refundAmount: null,
      createdAt: '2026-09-02T10:00:00.000Z', resolvedAt: null, cursorTs: '2026-09-02T10:00:00.000000Z',
    };
    const repo = stubRepo({ listIssues: vi.fn(async () => ({ rows: [open], hasMore: false })) as unknown as CustomersRepo['listIssues'] });
    const res = await service(repo).listIssues(subOoty('customer.issues.view'), IDS.customer, page);
    expect(adminCustomerIssueSchema.parse(res.items[0])).toEqual(res.items[0]);
    expect(res.items[0]).not.toHaveProperty('refundAmount');
    expect(res.items[0]).toMatchObject({ reference: 'RET-7A1B2C3D', resolvedAt: null, reason: null });
  });

  it('BR-93e: the wallet summary balance is the ledger sum as a 2-decimal Money string (no float)', async () => {
    const res = await service(stubRepo()).getWallet(subOoty('customer.wallet.view'), IDS.customer);
    expect(adminCustomerWalletSummarySchema.parse(res)).toEqual(res);
    expect(res.balance).toBe('150.00');
    expect(typeof res.balance).toBe('string');
    expect(res.customerId).toBe(IDS.customer);
  });

  it('BR-93: a visible customer with no wallet is 404, not an invented zero wallet', async () => {
    const error = await rejection(service(stubRepo({ findWallet: vi.fn(async () => null) })).getWallet(subOoty(), IDS.customer));
    expect(error.status).toBe(404);
  });

  it("BR-93c: an out-of-scope customer's wallet, transactions and a transaction detail are 404 NOT_FOUND, never 403, and the wallet is never read", async () => {
    const repo = stubRepo({ isVisible: vi.fn(async () => false) });
    const svc = service(repo);
    for (const call of [
      () => svc.getWallet(subOoty('customer.wallet.view'), IDS.customer),
      () => svc.listWalletTransactions(subOoty('customer.wallet.view'), IDS.customer, { limit: 20 }),
      () => svc.getWalletTransaction(subOoty('customer.wallet.view'), IDS.customer, newId()),
    ]) {
      const error = await rejection(call());
      expect(error.status).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    }
    expect(repo.findWallet).not.toHaveBeenCalled();
    expect(repo.listWalletTransactions).not.toHaveBeenCalled();
    expect(repo.findWalletTransaction).not.toHaveBeenCalled();
  });

  it('BR-93d: a transaction id that is not on this customer\'s wallet is 404', async () => {
    const repo = stubRepo({ findWalletTransaction: vi.fn(async () => null) });
    const error = await rejection(service(repo).getWalletTransaction(subOoty('customer.wallet.view'), IDS.customer, newId()));
    expect(error.status).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
  });
});

describe('customers service: support tickets (BR-97)', () => {
  const internalNamingFarmer = aMessage({ isInternal: true, senderRole: 'SUPER_ADMIN', body: 'Batch came from Ramesh Kumar, Green Valley Farm.' });
  const internalPlain = aMessage({ isInternal: true, senderRole: 'SUPER_ADMIN', body: 'Offer a refund.' });
  const customerMsg = aMessage({ body: 'Was this grown at Green Valley Farm? Ask Ramesh.' });
  const repoWithThread = () => stubRepo({ listMessages: vi.fn(async () => [customerMsg, internalNamingFarmer, internalPlain]) });

  it('BR-97a: for an own actor an internal note naming a farmer is removed and farmer text in other messages is redacted with redacted: true', async () => {
    const res = await service(repoWithThread()).getSupportTicket(subOoty('customer.support_history.view'), IDS.customer, TICKET_ID);
    expect(adminCustomerSupportTicketDetailSchema.parse(res)).toEqual(res);
    expect(res.messages.map((m) => m.id)).toEqual([customerMsg.id, internalPlain.id]);
    expect(res.messages[0]).toMatchObject({ redacted: true, isInternal: false });
    expect(res.messages[0]!.message).not.toMatch(/Ramesh|Green Valley/i);
    expect(res.messages[1]).toMatchObject({ redacted: false, isInternal: true, message: 'Offer a refund.' });
    expect(JSON.stringify(res)).not.toMatch(/Ramesh|Green Valley/i);
  });

  it('BR-97a: the ticket list counts only the messages an own actor would see, and redacts the subject', async () => {
    const repo = stubRepo({
      listTickets: vi.fn(async () => ({ rows: [aTicketRow({ subject: 'Ramesh Kumar carrots' })], hasMore: false })),
      listMessages: vi.fn(async () => [customerMsg, internalNamingFarmer, internalPlain]),
    });
    const own = await service(repo).listSupportTickets(subOoty('customer.support_history.view'), IDS.customer, { limit: 20 });
    expect(adminCustomerSupportTicketSchema.parse(own.items[0])).toEqual(own.items[0]);
    expect(own.items[0]).toMatchObject({ messageCount: 2, categoryCode: 'QUALITY' });
    expect(own.items[0]!.subject).not.toMatch(/Ramesh/);
    const all = await service(repo).listSupportTickets(superAll('customer.support_history.view'), IDS.customer, { limit: 20 });
    expect(all.items[0]).toMatchObject({ messageCount: 3, subject: 'Ramesh Kumar carrots' });
  });

  it('BR-97e: a scope-all actor sees the unredacted internal note (the strip follows the scope, not the role)', async () => {
    const res = await service(repoWithThread()).getSupportTicket(superAll('customer.support_history.view'), IDS.customer, TICKET_ID);
    expect(res.messages).toHaveLength(3);
    expect(res.messages.every((m) => !m.redacted)).toBe(true);
    expect(res.messages[1]!.message).toContain('Ramesh Kumar');
  });

  // The customer's own contact details typed into a ticket: BR-92a allows an own actor at most four
  // consecutive digits of the stored mobile and no e-mail, whatever field they sit in.
  const piiTicket = () =>
    stubRepo({
      listTickets: vi.fn(async () => ({ rows: [aTicketRow({ subject: 'Call me on 9876543210' })], hasMore: false })),
      findTicket: vi.fn(async () =>
        aTicketRow({ subject: 'Call me on 9876543210', description: 'My number is +91 98765 43210, mail Lakshmi@Example.com' }),
      ),
      listMessages: vi.fn(async () => [
        aMessage({ body: 'Reach me at 98765-43210 or lakshmi@example.com' }),
        aMessage({ isInternal: true, senderRole: 'SUPER_ADMIN', body: 'Customer asked to be called on +919876543210.' }),
      ]),
    });

  it('BR-92a: for an own actor no run of more than four consecutive digits of the stored mobile survives in a ticket subject, description or message', async () => {
    const own = await service(piiTicket()).getSupportTicket(subOoty('customer.support_history.view'), IDS.customer, TICKET_ID);
    expect(adminCustomerSupportTicketDetailSchema.parse(own)).toEqual(own);
    expect(leaksMobile(own, MOBILE)).toBe(false);
    // The internal note is redacted, not dropped: it names no farmer.
    expect(own.messages).toHaveLength(2);
    expect(own.messages.every((m) => m.redacted)).toBe(true);
    const list = await service(piiTicket()).listSupportTickets(subOoty('customer.support_history.view'), IDS.customer, { limit: 20 });
    expect(leaksMobile(list, MOBILE)).toBe(false);
    expect(list.items[0]).toMatchObject({ messageCount: 2 });
  });

  it("BR-97g: the customer's stored mobile and e-mail typed into a support ticket are masked for own; scope all sees the stored text", async () => {
    const own = await service(piiTicket()).getSupportTicket(subOoty('customer.support_history.view'), IDS.customer, TICKET_ID);
    expect(JSON.stringify(own).toLowerCase()).not.toContain('lakshmi@example.com');
    expect(leaksMobile(own, MOBILE)).toBe(false);
    expect(own.description).toContain(REDACTED);
    const all = await service(piiTicket()).getSupportTicket(superAll('customer.support_history.view'), IDS.customer, TICKET_ID);
    expect(all.description).toBe('My number is +91 98765 43210, mail Lakshmi@Example.com');
    expect(all.messages[0]!.message).toBe('Reach me at 98765-43210 or lakshmi@example.com');
    expect(all.messages.every((m) => !m.redacted)).toBe(true);
  });

  it('BR-97: the DB ticket status INVESTIGATING is reported as IN_PROGRESS (the openapi enum)', async () => {
    const repo = stubRepo({ findTicket: vi.fn(async () => aTicketRow({ status: 'INVESTIGATING' })) });
    const res = await service(repo).getSupportTicket(superAll(), IDS.customer, TICKET_ID);
    expect(res.status).toBe('IN_PROGRESS');
  });

  it('BR-97: the ticket shape has no closedAt (support_tickets records no close time), a NULL description is "", and categoryCode is one of the support_tickets.category values', async () => {
    const repo = stubRepo({ findTicket: vi.fn(async () => aTicketRow({ description: null, category: 'WRONG_ITEM' })) });
    const res = await service(repo).getSupportTicket(superAll(), IDS.customer, TICKET_ID);
    expect(res).not.toHaveProperty('closedAt');
    expect(res.description).toBe('');
    expect(res.categoryCode).toBe('WRONG_ITEM');
    const listed = await service(stubRepo()).listSupportTickets(superAll(), IDS.customer, { limit: 20 });
    expect(listed.items[0]).not.toHaveProperty('closedAt');
    // The allow-list refuses both a closedAt key and a category outside the DB CHECK list.
    expect(adminCustomerSupportTicketSchema.safeParse({ ...listed.items[0], closedAt: null }).success).toBe(false);
    expect(adminCustomerSupportTicketSchema.safeParse({ ...listed.items[0], categoryCode: 'BILLING' }).success).toBe(false);
  });

  it('BR-91: a ticket that is not this customer\'s is 404', async () => {
    const error = await rejection(service(stubRepo({ findTicket: vi.fn(async () => null) })).getSupportTicket(subOoty(), IDS.customer, TICKET_ID));
    expect(error.status).toBe(404);
  });

  it('BR-97b/BR-97f: a reply is appended (never an edit), returned 201-shaped with ticket and author id, and one ids-only audit row is written on the same transaction', async () => {
    const tx = recordingExecutor();
    const repo = stubRepo();
    const respond = aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [OOTY], permission: 'support.ticket.respond', userId: IDS.userSubWhAdmin });
    const res = await service(repo, { tx }).reply(respond, subOoty('customer.support_history.view'), IDS.customer, TICKET_ID, { message: 'We will replace the carrots.' });
    expect(adminCustomerSupportMessageSchema.parse(res)).toEqual(res);
    expect(res).toMatchObject({ ticketId: TICKET_ID, senderUserId: IDS.userSubWhAdmin, senderRole: 'SUB_WH_ADMIN', isInternal: false, redacted: false, message: 'We will replace the carrots.' });
    expect(repo.insertMessage).toHaveBeenCalledWith(tx, { ticketId: TICKET_ID, senderUserId: IDS.userSubWhAdmin, body: 'We will replace the carrots.', attachmentKey: null });
    expect(repo.findTicket).toHaveBeenCalledWith(tx, IDS.customer, TICKET_ID, true);
    const audits = tx.statements.filter((s) => s.includes('INSERT INTO audit_log'));
    expect(audits).toHaveLength(1);
    expect(tx.statements.some((s) => /UPDATE\s+support_messages/i.test(s))).toBe(false);
  });

  it('BR-97b: the reply uses the customer.support_history.view scope for visibility, even though support.ticket.respond is `all`', async () => {
    const repo = stubRepo({ isVisible: vi.fn(async () => false) });
    const error = await rejection(
      service(repo).reply(superAll('support.ticket.respond'), subOoty('customer.support_history.view'), IDS.customer, TICKET_ID, { message: 'hi' }),
    );
    expect(error.status).toBe(404);
    expect(repo.isVisible).toHaveBeenCalledWith(expect.anything(), IDS.customer, { warehouseIds: [OOTY], denyAll: false, masked: true });
  });

  it('BR-97c: a reply naming a farmer identity for this customer is refused 422 and nothing is stored or audited', async () => {
    for (const message of ['Ramesh Kumar will call you', `Farmer ${FARMER_ID}`, 'It came from green valley farm', 'Plot at 11.410200, 76.695000']) {
      const tx = recordingExecutor();
      const repo = stubRepo();
      const error = await rejection(service(repo, { tx }).reply(superAll('support.ticket.respond'), superAll('customer.support_history.view'), IDS.customer, TICKET_ID, { message }));
      expect(error.status).toBe(422);
      expect(error.code).toBe('VALIDATION_FAILED');
      expect(repo.insertMessage).not.toHaveBeenCalled();
      expect(tx.statements.some((s) => s.includes('audit_log'))).toBe(false);
    }
  });

  it('BR-97i: replying to a CLOSED ticket is 409 CONFLICT', async () => {
    const repo = stubRepo({ findTicket: vi.fn(async () => aTicketRow({ status: 'CLOSED' })) });
    const error = await rejection(service(repo).reply(superAll('support.ticket.respond'), superAll(), IDS.customer, TICKET_ID, { message: 'hi' }));
    expect(error.status).toBe(409);
    expect(error.code).toBe('CONFLICT');
    expect(repo.insertMessage).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 3. Routes
// ===========================================================================
interface Layer {
  route?: { path: string; methods: Record<string, boolean> };
}

function routeTable(): Array<{ path: string; method: string }> {
  const stack = (customersRouter as unknown as { stack: Layer[] }).stack;
  return stack
    .filter((l) => l.route !== undefined)
    .flatMap((l) => Object.keys(l.route!.methods).map((method) => ({ path: l.route!.path, method: method.toUpperCase() })));
}

describe('customers routes: route table', () => {
  it('BR-93f / BR-93a: the router has exactly the documented eleven routes; every wallet path is GET-only and the only write is the support reply', () => {
    expect(routeTable()).toEqual([
      { path: '/', method: 'GET' },
      { path: '/:customerId', method: 'GET' },
      { path: '/:customerId/purchases', method: 'GET' },
      { path: '/:customerId/orders', method: 'GET' },
      { path: '/:customerId/wallet', method: 'GET' },
      { path: '/:customerId/wallet/transactions', method: 'GET' },
      { path: '/:customerId/wallet/transactions/:txnId', method: 'GET' },
      { path: '/:customerId/issues', method: 'GET' },
      { path: '/:customerId/support-tickets', method: 'GET' },
      { path: '/:customerId/support-tickets/:ticketId', method: 'GET' },
      { path: '/:customerId/support-tickets/:ticketId/replies', method: 'POST' },
    ]);
    expect(routeTable().filter((r) => r.path.includes('wallet') && r.method !== 'GET')).toEqual([]);
  });
});

describe('customers routes: permission matrix (real middleware, stub service)', async () => {
  const { signAccessToken } = await import('../../auth/jwt.js');
  const calls: string[] = [];
  const stub = new Proxy({} as CustomersService, {
    get: (_t, name: string) => async () => {
      calls.push(name);
      return { ok: true };
    },
  });
  const app = express();
  app.use(express.json());
  app.use('/v1/admin/customers', createCustomersRouter(stub));
  app.use(notFoundHandler);
  app.use(errorHandler);

  const base = { farmerId: null, customerId: null };
  const token = (roles: Array<{ code: RoleCode; warehouseId?: string; zoneId?: string }>, extra: Partial<{ farmerId: string; customerId: string }> = {}) =>
    `Bearer ${signAccessToken({ sub: newId(), roles, ...base, ...extra })}`;
  const tokens = {
    SUB_WH_ADMIN: token([{ code: RoleCode.SUB_WH_ADMIN, warehouseId: OOTY }]),
    MAIN_WH_ADMIN: token([{ code: RoleCode.MAIN_WH_ADMIN }]),
    TOHFA_ADMIN: token([{ code: RoleCode.TOHFA_ADMIN }]),
    SUPER_ADMIN: token([{ code: RoleCode.SUPER_ADMIN }]),
    FARMER: token([{ code: RoleCode.FARMER }], { farmerId: newId() }),
    FARMER_ADMIN: token([{ code: RoleCode.FARMER_ADMIN, zoneId: newId() }]),
    CUSTOMER: token([{ code: RoleCode.CUSTOMER }], { customerId: newId() }),
  };
  const c = IDS.customer;
  const reads = [
    `/v1/admin/customers`,
    `/v1/admin/customers/${c}`,
    `/v1/admin/customers/${c}/purchases`,
    `/v1/admin/customers/${c}/orders`,
    `/v1/admin/customers/${c}/wallet`,
    `/v1/admin/customers/${c}/wallet/transactions`,
    `/v1/admin/customers/${c}/wallet/transactions/${newId()}`,
    `/v1/admin/customers/${c}/issues`,
    `/v1/admin/customers/${c}/support-tickets`,
    `/v1/admin/customers/${c}/support-tickets/${TICKET_ID}`,
  ];
  const replyPath = `/v1/admin/customers/${c}/support-tickets/${TICKET_ID}/replies`;

  it('BR-91a / BR-93b / BR-97d: every GET is 401 without a token, 403 for FARMER, FARMER_ADMIN and CUSTOMER, 200 for the four admin roles', async () => {
    for (const path of reads) {
      expect((await request(app).get(path)).status, path).toBe(401);
      for (const role of ['FARMER', 'FARMER_ADMIN', 'CUSTOMER'] as const) {
        const res = await request(app).get(path).set('Authorization', tokens[role]);
        expect(res.status, `${role} ${path}`).toBe(403);
        expect(res.body.code).toBe('FORBIDDEN');
      }
      for (const role of ['SUB_WH_ADMIN', 'MAIN_WH_ADMIN', 'TOHFA_ADMIN', 'SUPER_ADMIN'] as const) {
        expect((await request(app).get(path).set('Authorization', tokens[role])).status, `${role} ${path}`).toBe(200);
      }
    }
  });

  it('BR-97d: the reply is 401 without a token, 403 for FARMER, FARMER_ADMIN and CUSTOMER, 201 for the four admin roles; a blank message is 422', async () => {
    expect((await request(app).post(replyPath).send({ message: 'hi' })).status).toBe(401);
    for (const role of ['FARMER', 'FARMER_ADMIN', 'CUSTOMER'] as const) {
      expect((await request(app).post(replyPath).set('Authorization', tokens[role]).send({ message: 'hi' })).status, role).toBe(403);
    }
    for (const role of ['SUB_WH_ADMIN', 'MAIN_WH_ADMIN', 'TOHFA_ADMIN', 'SUPER_ADMIN'] as const) {
      expect((await request(app).post(replyPath).set('Authorization', tokens[role]).send({ message: 'hi' })).status, role).toBe(201);
    }
    const blank = await request(app).post(replyPath).set('Authorization', tokens.SUPER_ADMIN).send({ message: '   ' });
    expect(blank.status).toBe(422);
  });

  it('BR-93a: POST, PUT, PATCH and DELETE on each wallet path are 404 for SUB_WH_ADMIN and reach no service method', async () => {
    const walletPaths = [`/v1/admin/customers/${c}/wallet`, `/v1/admin/customers/${c}/wallet/transactions`, `/v1/admin/customers/${c}/wallet/transactions/${newId()}`];
    calls.length = 0;
    for (const path of walletPaths) {
      for (const verb of ['post', 'put', 'patch', 'delete'] as const) {
        const res = await request(app)[verb](path).set('Authorization', tokens.SUB_WH_ADMIN).send({ amount: '100.00' });
        expect([404, 405], `${verb} ${path}`).toContain(res.status);
      }
    }
    expect(calls).toEqual([]);
  });

  it('BR-92h: q (openapi: trimmed, 1..100 characters): a whitespace-only q or one longer than 100 characters is 422; a padded q reaches the service trimmed', async () => {
    for (const q of ['   ', 'x'.repeat(101)]) {
      const res = await request(app).get('/v1/admin/customers').query({ q }).set('Authorization', tokens.SUPER_ADMIN);
      expect(res.status, JSON.stringify(q)).toBe(422);
    }
    const ok = await request(app).get('/v1/admin/customers').query({ q: `  ${'x'.repeat(100)}  ` }).set('Authorization', tokens.SUPER_ADMIN);
    expect(ok.status).toBe(200);
  });

  it('a malformed customer id is 422, not 404 or 500', async () => {
    const res = await request(app).get('/v1/admin/customers/not-a-uuid').set('Authorization', tokens.SUPER_ADMIN);
    expect(res.status).toBe(422);
  });
});
