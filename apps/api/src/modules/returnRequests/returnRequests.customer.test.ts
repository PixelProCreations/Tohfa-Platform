/**
 * Customer-initiated returns (BR-155) — service and route-gate unit tests.
 *
 * A customer files a return through the SAME `POST /orders/{orderId}/returns` path staff use,
 * gated by `requireAnyPermission([rma.request.process, rma.request.create_own])`, and reads their
 * own returns through `GET /returns/me[/{id}]` on `rma.request.view_own`. These tests pin:
 *  - own-scope: another customer's order / return is the same 404 as an unknown id (BR-36);
 *  - the order must be DELIVERED or PICKED_UP;
 *  - the requested qty never exceeds ordered minus already-returned (non-rejected) qty;
 *  - the audit row is written inside the transaction, under the customer's permission code;
 *  - the customer serializer is an allow-list (no warehouse, no inspection internals, no farm data).
 */
import { describe, expect, it } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { AppError } from '../../http/problem.js';
import type { Executor } from '../../db/pool.js';
import { requireAnyPermission, type ResolvedScope } from '../../rbac/requirePermission.js';
import { createReturnRequestsService } from './returnRequests.service.js';
import { FILE_RETURN_PERMISSIONS } from './returnRequests.routes.js';
import type {
  CustomerListArgs,
  OrderForReturn,
  OrderItemForReturn,
  ReturnRequestsRepo,
  ReturnSummaryRowShape,
} from './returnRequests.repo.js';
import type { ReturnRequestResponse, ReturnSummaryResponse } from './returnRequests.schema.js';
import { aScope, anActor } from '../../test/factories.js';

const WH = '10000000-0000-4000-8000-000000000001';
const CUSTOMER_A = '40000000-0000-4000-8000-00000000000a';
const CUSTOMER_B = '40000000-0000-4000-8000-00000000000b';
const USER_A = '30000000-0000-4000-8000-00000000000a';
const ORDER_ID = '50000000-0000-4000-8000-000000000001';
const ORDER_ITEM_ID = '60000000-0000-4000-8000-000000000001';
const RETURN_A = '70000000-0000-4000-8000-00000000000a';
const RETURN_B = '70000000-0000-4000-8000-00000000000b';

interface Recorder {
  auditActions: string[];
  inTx: boolean;
  auditOutsideTx: number;
  inserted: number;
}

function makeDb(rec: Recorder): { db: Executor; runTx: <T>(fn: (tx: Executor) => Promise<T>) => Promise<T> } {
  const db: Executor = {
    query: async (sql: string, params?: unknown[]) => {
      if (sql.includes('INSERT INTO audit_log')) {
        if (!rec.inTx) rec.auditOutsideTx += 1;
        // writeAuditLog passes the action code as one of its params; record every string param.
        rec.auditActions.push(...(params ?? []).filter((p): p is string => typeof p === 'string'));
        return { rows: [{ id: 'audit-fake-id' }] } as never;
      }
      throw new Error(`unexpected direct SQL in a unit test: ${sql}`);
    },
  };
  const runTx = async <T>(fn: (tx: Executor) => Promise<T>): Promise<T> => {
    rec.inTx = true;
    try {
      return await fn(db);
    } finally {
      rec.inTx = false;
    }
  };
  return { db, runTx };
}

function summary(id: string, customerId: string): ReturnSummaryResponse {
  return {
    photos: [],
    id,
    orderId: ORDER_ID,
    customerId,
    warehouseId: WH,
    status: 'INSPECTED',
    reason: 'Spoiled',
    note: null,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: null,
  };
}

function detail(id: string, customerId: string): ReturnRequestResponse {
  return {
    ...summary(id, customerId),
    items: [
      {
        id: 'item-0',
        orderItemId: ORDER_ITEM_ID,
        requestedQty: '2.000',
        acceptedQty: '1.500',
        damagedQty: '0.500',
        condition: 'DAMAGED',
      },
    ],
  };
}

function buildRepo(options: {
  order?: Partial<OrderForReturn>;
  orderItems?: OrderItemForReturn[];
  alreadyReturned?: Record<string, string>;
  rec: Recorder;
}): ReturnRequestsRepo & { lastCustomerListArgs?: CustomerListArgs } {
  const order: OrderForReturn = {
    id: ORDER_ID,
    customerId: CUSTOMER_A,
    warehouseId: WH,
    status: 'DELIVERED',
    ...options.order,
  };
  const orderItems = options.orderItems ?? [
    { id: ORDER_ITEM_ID, qtyKg: '5.000', unitPrice: '40.00', status: 'DELIVERED' },
  ];
  const all = [detail(RETURN_A, CUSTOMER_A), detail(RETURN_B, CUSTOMER_B)];
  const unused = async (): Promise<never> => {
    throw new Error('not used in this test');
  };

  const repo: ReturnRequestsRepo & { lastCustomerListArgs?: CustomerListArgs } = {
    async findOrderForReturn(_db, orderId) {
      return orderId === order.id ? order : null;
    },
    async findOrderItemsByIds(_db, orderId, ids) {
      return orderId === order.id ? orderItems.filter((oi) => ids.includes(oi.id)) : [];
    },
    async sumAlreadyReturnedQty() {
      return options.alreadyReturned ?? {};
    },
    async insertReturnRequest(_db, input): Promise<ReturnSummaryRowShape> {
      options.rec.inserted += 1;
      return {
        id: RETURN_A,
        orderId: input.orderId,
        customerId: input.customerId,
        status: 'PENDING',
        reason: input.reason,
        note: input.note,
        createdAt: new Date('2026-11-16T00:00:00Z'),
        updatedAt: null,
      };
    },
    async insertReturnRequestItems(_db, _id, items) {
      return items.map((item, idx) => ({
        id: `item-${idx}`,
        orderItemId: item.orderItemId,
        requestedQty: item.requestedQty,
        acceptedQty: null,
        damagedQty: null,
        condition: null,
      }));
    },
    async insertStatusHistory() {},
    findById: unused,
    findRawById: unused,
    list: unused,
    async listForCustomer(_db, args) {
      repo.lastCustomerListArgs = args;
      const items = all.filter((r) => r.customerId === args.customerId);
      return { items, nextCursor: null, hasMore: false };
    },
    async findByIdForCustomer(_db, id, customerId) {
      return all.find((r) => r.id === id && r.customerId === customerId) ?? null;
    },
    updateStatus: unused,
    updateStatusIfCurrent: unused,
    updateInspectionItems: unused,
    markOrderItemsReturned: unused,
    getItems: unused,
    getHistory: unused,
    sumAcceptedAmount: unused,
  };
  return repo;
}

const customerActor = anActor({ userId: USER_A, roles: [{ code: RoleCode.CUSTOMER }], customerId: CUSTOMER_A });
const createScope: ResolvedScope = aScope({
  level: ScopeLevel.OWN,
  permission: 'rma.request.create_own',
  roleCode: RoleCode.CUSTOMER,
  userId: USER_A,
  customerId: CUSTOMER_A,
});
const viewScope: ResolvedScope = { ...createScope, permission: 'rma.request.view_own' };
const body = { reason: 'Produce arrived spoiled', items: [{ orderItemId: ORDER_ITEM_ID, qty: '2.000' }] };

function setup(options: Omit<Parameters<typeof buildRepo>[0], 'rec'> = {}) {
  const rec: Recorder = { auditActions: [], inTx: false, auditOutsideTx: 0, inserted: 0 };
  const repo = buildRepo({ ...options, rec });
  const { db, runTx } = makeDb(rec);
  return { rec, repo, service: createReturnRequestsService({ repo, db, runTx }) };
}

const FORBIDDEN_KEYS = ['warehouseId', 'customerId', 'farmerId', 'farmId', 'batchId', 'damagedQty', 'condition', 'changedBy'];

function expectNoInternalKeys(value: unknown): void {
  const json = JSON.stringify(value);
  for (const key of FORBIDDEN_KEYS) expect(json, key).not.toContain(`"${key}"`);
}

describe('BR-155: a customer files a return only against their own delivered order', () => {
  it('BR-155a: files a PENDING return on own DELIVERED order, audited in the same transaction', async () => {
    const { rec, service } = setup();
    const result = await service.createReturnRequest(customerActor, createScope, ORDER_ID, body);
    expect(result.status).toBe('PENDING');
    expect(result.items[0]?.orderItemId).toBe(ORDER_ITEM_ID);
    expect(rec.auditActions).toContain('rma.request.create_own');
    expect(rec.auditOutsideTx).toBe(0);
  });

  it('BR-155a: PICKED_UP orders are returnable too', async () => {
    const { service } = setup({ order: { status: 'PICKED_UP' } });
    await expect(service.createReturnRequest(customerActor, createScope, ORDER_ID, body)).resolves.toMatchObject({
      status: 'PENDING',
    });
  });

  it("BR-155b: another customer's order is the same 404 NOT_FOUND as an unknown order, never 403", async () => {
    const { rec, service } = setup({ order: { customerId: CUSTOMER_B } });
    const foreign = await service.createReturnRequest(customerActor, createScope, ORDER_ID, body).catch((e: unknown) => e);
    const unknown = await service
      .createReturnRequest(customerActor, createScope, '50000000-0000-4000-8000-0000000000ff', body)
      .catch((e: unknown) => e);
    expect(foreign).toBeInstanceOf(AppError);
    expect((foreign as AppError).status).toBe(404);
    expect((foreign as AppError).code).toBe('NOT_FOUND');
    expect((unknown as AppError).code).toBe('NOT_FOUND');
    expect(rec.inserted).toBe(0);
  });

  it('BR-155b: a customer scope without a customer id fails closed with 404', async () => {
    const { service } = setup();
    const { customerId: _omit, ...noCustomer } = createScope;
    await expect(service.createReturnRequest(customerActor, noCustomer, ORDER_ID, body)).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    });
  });

  it.each(['PENDING_PAYMENT', 'CONFIRMED', 'PACKED', 'READY_FOR_PICKUP', 'CANCELLED', 'RETURNED'])(
    'BR-155c: an order in %s cannot be returned (409 INVALID_STATE_TRANSITION)',
    async (status) => {
      const { rec, service } = setup({ order: { status } });
      await expect(service.createReturnRequest(customerActor, createScope, ORDER_ID, body)).rejects.toMatchObject({
        code: 'INVALID_STATE_TRANSITION',
        status: 409,
      });
      expect(rec.inserted).toBe(0);
    },
  );

  it('BR-155d: an item that does not belong to the order is 422 VALIDATION_FAILED', async () => {
    const { service } = setup();
    await expect(
      service.createReturnRequest(customerActor, createScope, ORDER_ID, {
        reason: 'x',
        items: [{ orderItemId: '60000000-0000-4000-8000-0000000000ff', qty: '1.000' }],
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('BR-155d: the same order item twice in one request is 422 VALIDATION_FAILED', async () => {
    const { service } = setup();
    await expect(
      service.createReturnRequest(customerActor, createScope, ORDER_ID, {
        reason: 'x',
        items: [
          { orderItemId: ORDER_ITEM_ID, qty: '1.000' },
          { orderItemId: ORDER_ITEM_ID, qty: '1.000' },
        ],
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('BR-155e: qty may not exceed ordered qty minus qty already on non-rejected returns', async () => {
    const { rec, service } = setup({ alreadyReturned: { [ORDER_ITEM_ID]: '4.000' } });
    await expect(
      service.createReturnRequest(customerActor, createScope, ORDER_ID, {
        reason: 'x',
        items: [{ orderItemId: ORDER_ITEM_ID, qty: '1.500' }],
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(rec.inserted).toBe(0);

    // exactly the remainder is fine
    await expect(
      service.createReturnRequest(customerActor, createScope, ORDER_ID, {
        reason: 'x',
        items: [{ orderItemId: ORDER_ITEM_ID, qty: '1.000' }],
      }),
    ).resolves.toMatchObject({ status: 'PENDING' });
  });

  it('BR-155f: the customer response is an allow-list (no warehouse, customer, inspection or farm fields)', async () => {
    const { service } = setup();
    const result = await service.createReturnRequest(customerActor, createScope, ORDER_ID, {
      ...body,
      note: 'two crates moldy',
    });
    expect(Object.keys(result).sort()).toEqual(
      ['createdAt', 'id', 'items', 'note', 'orderId', 'photos', 'reason', 'status', 'updatedAt'].sort(),
    );
    expectNoInternalKeys(result);
  });
});

describe('BR-155: a customer reads only their own returns', () => {
  it('BR-155g: GET /returns/me lists only own returns through the allow-list serializer', async () => {
    const { repo, service } = setup();
    const page = await service.listOwn(viewScope, { limit: 20 });
    expect(page.items.map((r) => r.id)).toEqual([RETURN_A]);
    expect(repo.lastCustomerListArgs?.customerId).toBe(CUSTOMER_A);
    expect(page.page).toEqual({ nextCursor: null, hasMore: false });
    expectNoInternalKeys(page);
  });

  it('BR-155g: a scope without a customer id lists nothing (fail closed)', async () => {
    const { service } = setup();
    const { customerId: _omit, ...noCustomer } = viewScope;
    const page = await service.listOwn(noCustomer, { limit: 20 });
    expect(page.items).toEqual([]);
  });

  it("BR-155h: GET /returns/me/{id} of another customer's return is the same 404 as an unknown id", async () => {
    const { service } = setup();
    const own = await service.getOwn(viewScope, RETURN_A);
    expect(own.id).toBe(RETURN_A);
    expect(own.items[0]).toEqual({ id: 'item-0', orderItemId: ORDER_ITEM_ID, requestedQty: '2.000', acceptedQty: '1.500' });
    expectNoInternalKeys(own);

    const foreign = await service.getOwn(viewScope, RETURN_B).catch((e: unknown) => e);
    const unknown = await service.getOwn(viewScope, '70000000-0000-4000-8000-0000000000ff').catch((e: unknown) => e);
    expect((foreign as AppError).status).toBe(404);
    expect((foreign as AppError).code).toBe('NOT_FOUND');
    expect((unknown as AppError).code).toBe((foreign as AppError).code);
  });
});

describe('BR-155: POST /orders/{orderId}/returns route gate', () => {
  function runGate(actor: ReturnType<typeof anActor>): { error: unknown; scope: ResolvedScope | undefined } {
    const gate = requireAnyPermission(FILE_RETURN_PERMISSIONS);
    const req = { actor, method: 'POST' } as unknown as Request;
    let error: unknown;
    gate(req, {} as Response, ((e?: unknown) => {
      error = e;
    }) as NextFunction);
    return { error, scope: req.scope };
  }

  it('BR-155i: a CUSTOMER is admitted under rma.request.create_own at own scope', () => {
    const { error, scope } = runGate(customerActor);
    expect(error).toBeUndefined();
    expect(scope?.permission).toBe('rma.request.create_own');
    expect(scope?.level).toBe(ScopeLevel.OWN);
    expect(scope?.customerId).toBe(CUSTOMER_A);
  });

  it('BR-155i: staff are admitted under rma.request.process', () => {
    const { error, scope } = runGate(anActor({ roles: [{ code: RoleCode.TOHFA_ADMIN }] }));
    expect(error).toBeUndefined();
    expect(scope?.permission).toBe('rma.request.process');
  });

  it('BR-155i: a FARMER holds neither code and is 403', () => {
    const { error } = runGate(anActor({ roles: [{ code: RoleCode.FARMER }], farmerId: '20000000-0000-4000-8000-000000000001' }));
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).status).toBe(403);
  });
});
