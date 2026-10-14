/**
 * Returns & Issues (RMA) — service unit tests. See CLAUDE.md.
 *
 * BR-61's invariant ("a return is refunded at most once, only after
 * approval") is a state-machine guarantee, so the fake repo here is
 * STATEFUL — a small in-memory store the fake mutates exactly like Postgres
 * would, rather than a fixed canned response. That is what lets a test drive
 * a return through inspect -> approve -> refund and then replay the refund
 * call to prove it does not double-credit.
 *
 * Integration test (`describeIfDatabase`) proves the SQL parses against a
 * migrated schema; it soft-skips with no reachable database.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { RoleCode, ScopeLevel, type Money } from '@tohfa/shared-types';
import { AppError } from '../../http/problem.js';
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import type { WalletMoveInput, WalletService } from '../wallet/wallet.service.js';
import type { WalletTransactionResponse } from '../wallet/wallet.schema.js';
import { createReturnRequestsService } from './returnRequests.service.js';
import type {
  InsertReturnRequestItemInput,
  ListArgs,
  ListResult,
  OrderForReturn,
  OrderItemForReturn,
  ReturnRequestsRepo,
  ReturnSummaryRowShape,
} from './returnRequests.repo.js';
import type {
  InspectReturnItem,
  ReturnRequestItemResponse,
  ReturnRequestResponse,
  ReturnStatus,
  ReturnStatusHistoryEntryResponse,
} from './returnRequests.schema.js';
import { aScope, anActor, databaseReady, describeIfDatabase, newId } from '../../test/factories.js';

const WH_OOTY = '10000000-0000-4000-8000-000000000001';
const WH_COONOOR = '10000000-0000-4000-8000-000000000002';
const CUSTOMER_ID = '40000000-0000-4000-8000-000000000001';
const ORDER_ID = '50000000-0000-4000-8000-000000000001';
const ORDER_ITEM_ID = '60000000-0000-4000-8000-000000000001';
const RETURN_ID = '70000000-0000-4000-8000-000000000001';

/**
 * The only thing the service ever sends straight to `db`/`tx` (rather than
 * through the repo) is the audit-log write, via `writeAuditLog`. Everything
 * else must go through the fake repo, so this stub answers exactly that one
 * query and throws on anything else — a service that started writing its own
 * SQL would fail these tests immediately.
 */
const noopDb: Executor = {
  query: async (sql: string) => {
    if (sql.includes('INSERT INTO audit_log')) {
      return { rows: [{ id: 'audit-fake-id' }] } as never;
    }
    throw new Error(`the fake repo should never reach the database directly: ${sql}`);
  },
};
const mockRunTx = async <T>(fn: (tx: Executor) => Promise<T>): Promise<T> => fn(noopDb);

/** One in-memory return, mutated by the fake repo exactly like a real UPDATE would. */
interface FakeReturn {
  id: string;
  orderId: string;
  customerId: string;
  warehouseId: string;
  status: ReturnStatus;
  reason: string;
  note: string | null;
  items: ReturnRequestItemResponse[];
  history: ReturnStatusHistoryEntryResponse[];
  createdAt: Date;
  updatedAt: Date | null;
}

function buildFakeRepo(options: {
  returns?: FakeReturn[];
  order?: OrderForReturn;
  orderItems?: OrderItemForReturn[];
}): ReturnRequestsRepo {
  const store = new Map<string, FakeReturn>();
  for (const r of options.returns ?? []) store.set(r.id, r);
  const order = options.order ?? {
    id: ORDER_ID,
    customerId: CUSTOMER_ID,
    warehouseId: WH_OOTY,
    status: 'DELIVERED',
  };
  const orderItems = options.orderItems ?? [
    { id: ORDER_ITEM_ID, qtyKg: '5.000', unitPrice: '40.00', status: 'DELIVERED' },
  ];

  function visible(scope: ResolvedScope, r: FakeReturn): boolean {
    if (scope.level === ScopeLevel.ALL || scope.level === ScopeLevel.CONDITIONAL) return true;
    if (scope.customerId !== undefined) return r.customerId === scope.customerId;
    if (scope.warehouseIds.length > 0) return scope.warehouseIds.includes(r.warehouseId);
    return false;
  }

  function toSummaryShape(r: FakeReturn): ReturnSummaryRowShape {
    return {
      id: r.id,
      orderId: r.orderId,
      customerId: r.customerId,
      status: r.status,
      reason: r.reason,
      note: r.note,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  function toResponse(r: FakeReturn): ReturnRequestResponse {
    return {
      id: r.id,
      orderId: r.orderId,
      customerId: r.customerId,
      warehouseId: r.warehouseId,
      status: r.status,
      reason: r.reason,
      note: r.note,
      items: r.items,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt === null ? null : r.updatedAt.toISOString(),
    };
  }

  return {
    async findOrderForReturn(_db, orderId) {
      return orderId === order.id ? order : null;
    },
    async findOrderItemsByIds(_db, orderId, orderItemIds) {
      if (orderId !== order.id) return [];
      return orderItems.filter((oi) => orderItemIds.includes(oi.id));
    },
    async insertReturnRequest(_db, input) {
      const r: FakeReturn = {
        id: RETURN_ID,
        orderId: input.orderId,
        customerId: input.customerId,
        warehouseId: order.warehouseId,
        status: 'PENDING',
        reason: input.reason,
        note: input.note,
        items: [],
        history: [],
        createdAt: new Date('2026-10-01T00:00:00Z'),
        updatedAt: null,
      };
      store.set(r.id, r);
      return toSummaryShape(r);
    },
    async insertReturnRequestItems(_db, returnRequestId, items: InsertReturnRequestItemInput[]) {
      const r = store.get(returnRequestId);
      if (r === undefined) throw new Error('unknown return in fake repo');
      const built = items.map((item, idx) => ({
        id: `item-${idx}`,
        orderItemId: item.orderItemId,
        requestedQty: item.requestedQty,
        acceptedQty: null,
        damagedQty: null,
        condition: null,
      }));
      r.items = built;
      return built;
    },
    async insertStatusHistory(_db, input) {
      const r = store.get(input.returnRequestId);
      if (r === undefined) return;
      r.history.push({
        id: `hist-${r.history.length}`,
        returnRequestId: input.returnRequestId,
        fromStatus: input.fromStatus,
        toStatus: input.toStatus,
        changedBy: input.changedBy,
        note: input.note ?? null,
        createdAt: new Date().toISOString(),
      });
    },
    async findById(_db, id, scope) {
      const r = store.get(id);
      if (r === undefined || !visible(scope, r)) return null;
      return toResponse(r);
    },
    async findRawById(_db, id) {
      const r = store.get(id);
      return r === undefined ? null : toSummaryShape(r);
    },
    async list(_db, _args: ListArgs): Promise<ListResult> {
      return { items: [...store.values()].map(toResponse), nextCursor: null, hasMore: false };
    },
    async updateStatus(_db, id, status) {
      const r = store.get(id);
      if (r === undefined) return;
      r.status = status;
      r.updatedAt = new Date();
    },
    async updateStatusIfCurrent(_db, id, expectedCurrent, newStatus) {
      const r = store.get(id);
      if (r === undefined || r.status !== expectedCurrent) return false;
      r.status = newStatus;
      r.updatedAt = new Date();
      return true;
    },
    async updateInspectionItems(_db, returnRequestId, items: InspectReturnItem[]) {
      const r = store.get(returnRequestId);
      if (r === undefined) return;
      r.items = r.items.map((existing) => {
        const match = items.find((i) => i.orderItemId === existing.orderItemId);
        if (match === undefined) return existing;
        return {
          ...existing,
          acceptedQty: match.acceptedQty,
          damagedQty: match.damagedQty,
          condition: match.condition,
        };
      });
    },
    async markOrderItemsReturned() {
      // No-op in the fake: order_items live outside this module's table set.
    },
    async getItems(_db, returnRequestId) {
      return store.get(returnRequestId)?.items ?? [];
    },
    async getHistory(_db, returnRequestId) {
      return store.get(returnRequestId)?.history ?? [];
    },
    async sumAcceptedAmount(_db, returnRequestId) {
      const r = store.get(returnRequestId);
      if (r === undefined) return '0.00';
      const total = r.items.reduce((sum, item) => {
        const qty = Number(item.acceptedQty ?? '0');
        return sum + qty * 40; // matches the fixture unitPrice '40.00'
      }, 0);
      return total.toFixed(2);
    },
  };
}

function aReturn(overrides: Partial<FakeReturn> = {}): FakeReturn {
  return {
    id: RETURN_ID,
    orderId: ORDER_ID,
    customerId: CUSTOMER_ID,
    warehouseId: WH_OOTY,
    status: 'PENDING',
    reason: 'Produce arrived spoiled',
    note: null,
    items: [
      {
        id: 'item-0',
        orderItemId: ORDER_ITEM_ID,
        requestedQty: '5.000',
        acceptedQty: null,
        damagedQty: null,
        condition: null,
      },
    ],
    history: [],
    createdAt: new Date('2026-10-01T00:00:00Z'),
    updatedAt: null,
    ...overrides,
  };
}

const adminActor = anActor({ roles: [{ code: RoleCode.TOHFA_ADMIN }] });
const adminScope: ResolvedScope = aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.TOHFA_ADMIN });

function fakeWalletTxn(id: string, amount: Money): WalletTransactionResponse {
  return {
    id,
    walletId: 'wallet-1',
    txnType: 'ORDER_REFUND',
    amount,
    balanceAfter: amount,
    refType: 'return_request',
    refId: RETURN_ID,
    fiscalCashTag: null,
    warehouseId: null,
    performedBy: null,
    performedAt: new Date().toISOString(),
    remarks: null,
  };
}

/** A wallet fake that mimics the real idempotency-key dedup: same key -> same row, never a second credit. */
function buildFakeWallet(): { svc: WalletService; moveCalls: string[] } {
  const byKey = new Map<string, WalletTransactionResponse>();
  const moveCalls: string[] = [];
  const svc: WalletService = {
    getWalletForActor: vi.fn(),
    listTransactionsForActor: vi.fn(),
    async move(_scope: ResolvedScope, input: WalletMoveInput) {
      moveCalls.push(input.idempotencyKey);
      const existing = byKey.get(input.idempotencyKey);
      if (existing) return existing;
      const txn = fakeWalletTxn(`txn-${byKey.size + 1}`, input.amount);
      byKey.set(input.idempotencyKey, txn);
      return txn;
    },
  } as unknown as WalletService;
  return { svc, moveCalls };
}

describe('returnRequestsService.createReturnRequest', () => {
  it('creates a PENDING return with an initial status-history row', async () => {
    const repo = buildFakeRepo({});
    const service = createReturnRequestsService({ repo, db: noopDb, runTx: mockRunTx });

    const result = await service.createReturnRequest(adminActor, adminScope, ORDER_ID, {
      reason: 'Produce arrived spoiled',
      items: [{ orderItemId: ORDER_ITEM_ID, qty: '5.000' }],
    });

    expect(result.status).toBe('PENDING');
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.orderItemId).toBe(ORDER_ITEM_ID);
  });

  it('404s — not 403 — for an order outside the caller scope', async () => {
    const repo = buildFakeRepo({});
    const service = createReturnRequestsService({ repo, db: noopDb, runTx: mockRunTx });
    const otherWarehouseScope = aScope({
      level: ScopeLevel.OWN,
      roleCode: RoleCode.SUB_WH_ADMIN,
      warehouseIds: [WH_COONOOR],
    });

    const error = await service
      .createReturnRequest(adminActor, otherWarehouseScope, ORDER_ID, {
        reason: 'Produce arrived spoiled',
        items: [{ orderItemId: ORDER_ITEM_ID, qty: '5.000' }],
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).status).toBe(404);
  });

  it('rejects a quantity greater than what was ordered', async () => {
    const repo = buildFakeRepo({});
    const service = createReturnRequestsService({ repo, db: noopDb, runTx: mockRunTx });

    await expect(
      service.createReturnRequest(adminActor, adminScope, ORDER_ID, {
        reason: 'Produce arrived spoiled',
        items: [{ orderItemId: ORDER_ITEM_ID, qty: '999.000' }],
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });
});

describe('BR-61: a return can only be approved after inspection, and refunded at most once', () => {
  it('BR-61a: approve is rejected when the return has not been inspected', async () => {
    const repo = buildFakeRepo({ returns: [aReturn({ status: 'PENDING' })] });
    const service = createReturnRequestsService({ repo, db: noopDb, runTx: mockRunTx });

    const error = await service.approve(adminActor, adminScope, RETURN_ID).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe('INVALID_STATE_TRANSITION');
    expect((error as AppError).status).toBe(409);
  });

  it('BR-61b: a wallet refund is rejected unless the return is APPROVED', async () => {
    const repo = buildFakeRepo({ returns: [aReturn({ status: 'INSPECTED' })] });
    const service = createReturnRequestsService({ repo, db: noopDb, runTx: mockRunTx });

    const error = await service
      .refundWallet(adminActor, adminScope, RETURN_ID, 'key-1')
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe('INVALID_STATE_TRANSITION');
  });

  it('BR-61c: a bank refund is rejected unless the return is APPROVED', async () => {
    const repo = buildFakeRepo({ returns: [aReturn({ status: 'PENDING' })] });
    const service = createReturnRequestsService({ repo, db: noopDb, runTx: mockRunTx });

    await expect(
      service.refundBank(adminActor, adminScope, RETURN_ID, 'key-1'),
    ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });
  });

  it('BR-61d: an APPROVED return can be refunded via wallet exactly once; replaying the same call credits once', async () => {
    const approvedItems: ReturnRequestItemResponse[] = [
      {
        id: 'item-0',
        orderItemId: ORDER_ITEM_ID,
        requestedQty: '5.000',
        acceptedQty: '5.000',
        damagedQty: '0.000',
        condition: 'GOOD',
      },
    ];
    const repo = buildFakeRepo({ returns: [aReturn({ status: 'APPROVED', items: approvedItems })] });
    const { svc: walletSvc, moveCalls } = buildFakeWallet();
    const service = createReturnRequestsService({ repo, db: noopDb, runTx: mockRunTx, walletSvc });

    const first = await service.refundWallet(adminActor, adminScope, RETURN_ID, 'client-key-1');
    expect(first.returnRequest.status).toBe('REFUNDED');
    expect(first.amount).toBe('200.00');
    expect(first.walletTransactionId).toBeDefined();

    // Replay with a DIFFERENT client header (e.g. the client retried after a
    // timeout with a fresh key) must still land on the SAME wallet ledger key
    // and must NOT move the return, or the money, a second time.
    const replay = await service.refundWallet(adminActor, adminScope, RETURN_ID, 'client-key-2');

    expect(replay.walletTransactionId).toBe(first.walletTransactionId);
    expect(replay.returnRequest.status).toBe('REFUNDED');
    expect(moveCalls).toEqual([moveCalls[0], moveCalls[0]]); // same derived wallet key both times
    expect(new Set(moveCalls).size).toBe(1); // never two distinct ledger keys for one return
  });

  it('BR-61e: a refunded return cannot also be routed to a bank refund', async () => {
    const repo = buildFakeRepo({ returns: [aReturn({ status: 'REFUNDED' })] });
    const service = createReturnRequestsService({ repo, db: noopDb, runTx: mockRunTx });

    await expect(
      service.refundBank(adminActor, adminScope, RETURN_ID, 'key-1'),
    ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });
  });

  it('Idempotency-Key header is required for a wallet refund', async () => {
    const repo = buildFakeRepo({ returns: [aReturn({ status: 'APPROVED' })] });
    const service = createReturnRequestsService({ repo, db: noopDb, runTx: mockRunTx });

    await expect(
      service.refundWallet(adminActor, adminScope, RETURN_ID, undefined),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
  });
});

describe('returnRequestsService.inspect / approve / reject', () => {
  it('moves PENDING -> INSPECTED and records per-item condition', async () => {
    const repo = buildFakeRepo({ returns: [aReturn({ status: 'PENDING' })] });
    const service = createReturnRequestsService({ repo, db: noopDb, runTx: mockRunTx });

    const result = await service.inspect(adminActor, adminScope, RETURN_ID, {
      items: [{ orderItemId: ORDER_ITEM_ID, condition: 'DAMAGED', acceptedQty: '3.000', damagedQty: '2.000' }],
    });

    expect(result.status).toBe('INSPECTED');
    expect(result.items[0]?.condition).toBe('DAMAGED');
    expect(result.items[0]?.acceptedQty).toBe('3.000');
  });

  it('rejects an inspect item that does not belong to the return', async () => {
    const repo = buildFakeRepo({ returns: [aReturn({ status: 'PENDING' })] });
    const service = createReturnRequestsService({ repo, db: noopDb, runTx: mockRunTx });

    await expect(
      service.inspect(adminActor, adminScope, RETURN_ID, {
        items: [{ orderItemId: newId(), condition: 'GOOD', acceptedQty: '1.000', damagedQty: '0.000' }],
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('moves INSPECTED -> APPROVED', async () => {
    const repo = buildFakeRepo({ returns: [aReturn({ status: 'INSPECTED' })] });
    const service = createReturnRequestsService({ repo, db: noopDb, runTx: mockRunTx });

    const result = await service.approve(adminActor, adminScope, RETURN_ID);
    expect(result.status).toBe('APPROVED');
  });

  it('rejects with a required, non-empty reason, from PENDING', async () => {
    const repo = buildFakeRepo({ returns: [aReturn({ status: 'PENDING' })] });
    const service = createReturnRequestsService({ repo, db: noopDb, runTx: mockRunTx });

    const result = await service.reject(adminActor, adminScope, RETURN_ID, { reason: 'Outside return window' });
    expect(result.status).toBe('REJECTED');
  });

  it('cannot reject a return that is already terminal', async () => {
    const repo = buildFakeRepo({ returns: [aReturn({ status: 'REJECTED' })] });
    const service = createReturnRequestsService({ repo, db: noopDb, runTx: mockRunTx });

    await expect(
      service.reject(adminActor, adminScope, RETURN_ID, { reason: 'Outside return window' }),
    ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });
  });
});

describe('returnRequestsService.getById / getHistory — scope', () => {
  it('404s — not 403 — for a return outside the caller warehouse scope', async () => {
    const repo = buildFakeRepo({ returns: [aReturn({ warehouseId: WH_OOTY })] });
    const service = createReturnRequestsService({ repo, db: noopDb, runTx: mockRunTx });
    const otherWarehouseScope = aScope({
      level: ScopeLevel.OWN,
      roleCode: RoleCode.SUB_WH_ADMIN,
      warehouseIds: [WH_COONOOR],
    });

    const error = await service.getById(otherWarehouseScope, RETURN_ID).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).status).toBe(404);

    const historyError = await service.getHistory(otherWarehouseScope, RETURN_ID).catch((e: unknown) => e);
    expect(historyError).toBeInstanceOf(AppError);
    expect((historyError as AppError).status).toBe(404);
  });

  it('returns the status history oldest-first once inspected and approved', async () => {
    const repo = buildFakeRepo({ returns: [aReturn({ status: 'PENDING' })] });
    const service = createReturnRequestsService({ repo, db: noopDb, runTx: mockRunTx });

    await service.inspect(adminActor, adminScope, RETURN_ID, {
      items: [{ orderItemId: ORDER_ITEM_ID, condition: 'GOOD', acceptedQty: '5.000', damagedQty: '0.000' }],
    });
    await service.approve(adminActor, adminScope, RETURN_ID);

    const history = await service.getHistory(adminScope, RETURN_ID);
    expect(history.items.map((h) => h.toStatus)).toEqual(['INSPECTED', 'APPROVED']);
  });
});

describeIfDatabase('returnRequestsService (integration)', () => {
  let ready = false;

  beforeAll(async () => {
    ready = await databaseReady('return_requests');
    if (!ready) {
      console.warn(
        '[skip] no reachable `return_requests` table — run `docker compose up -d && pnpm db:migrate`',
      );
    }
  });

  afterAll(async () => {
    if (!ready) return;
    const { closePool } = await import('../../db/pool.js');
    await closePool();
  });

  it('runs the real list query against Postgres', async () => {
    if (!ready) return;

    const { pool } = await import('../../db/pool.js');
    const service = createReturnRequestsService({ db: pool });

    const result = await service.list(adminScope, { limit: 20 });
    expect(Array.isArray(result.items)).toBe(true);
  });
});
