/**
 * Module 11 (Warehouse Finance): the derived expense voucher (BR-75), and the proof that expenses
 * have no approval, rejection, cancellation or category-management workflow (BR-62, owner decision
 * 2026-10-11: "follow the rules exactly as they are").
 *
 * Every repo query is run against a migrated Postgres: schema tests (no I/O), service tests inside a
 * transaction that is rolled back, and real-HTTP tests through the real app router.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import type { Server } from 'node:http';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import { expenseVoucherResponse, listExpensesQuery } from './finance.schema.js';
import { createExpenseVoucherService } from './expense-voucher.service.js';
import { expenseVoucherRepo } from './expense-voucher.repo.js';

class RollbackFixture extends Error {}

async function failure(promise: Promise<unknown>): Promise<AppError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof AppError) return error;
    throw error;
  }
  throw new Error('expected the call to fail with an AppError, but it succeeded');
}

/** The exact keys a voucher carries: the recorder, and no authorizer or decision field. */
const VOUCHER_KEYS = [
  'amount',
  'category',
  'description',
  'expenseDate',
  'expenseId',
  'paymentMethod',
  'recordedBy',
  'status',
  'vendor',
  'voucherNumber',
  'voucherType',
  'warehouse',
];

// ===========================================================================
// 1. Schemas (no I/O)
// ===========================================================================
describe('expense voucher schemas', () => {
  it('BR-75a: the voucher number shape is VCH-<yyyymmdd>-<8 upper-case hex>', () => {
    const shape = expenseVoucherResponse.shape.voucherNumber;
    expect(shape.safeParse('VCH-20260925-3F9A07B2').success).toBe(true);
    expect(shape.safeParse('VCH-000821').success).toBe(false);
    expect(shape.safeParse('vch-20260925-3f9a07b2').success).toBe(false);
  });

  it('BR-62: the expense list status filter accepts only the statuses the original CHECK allows; CANCELLED does not exist', () => {
    for (const status of ['RECORDED', 'APPROVED', 'REJECTED']) {
      expect(listExpensesQuery.safeParse({ status }).success, status).toBe(true);
    }
    expect(listExpensesQuery.safeParse({ status: 'CANCELLED' }).success).toBe(false);
    expect(listExpensesQuery.safeParse({ status: 'PENDING' }).success).toBe(false);
  });
});

// ===========================================================================
// 2. Service + SQL against PostgreSQL (rolled-back transactions)
// ===========================================================================
describeIfDatabase('Expense voucher (PostgreSQL)', () => {
  let ready = false;

  beforeAll(async () => {
    ready = await databaseReady('expense_categories');
    if (!ready) throw new Error('the database is configured but expense_categories is missing: run the migrations');
  });

  // The pool is closed once, by the HTTP suite's afterAll below (both suites share it).

  async function inRolledBackTx(fn: (tx: Executor) => Promise<void>): Promise<void> {
    const { withTransaction } = await import('../../db/pool.js');
    await withTransaction(async (tx) => {
      await fn(tx);
      throw new RollbackFixture();
    }).catch((error: unknown) => {
      if (!(error instanceof RollbackFixture)) throw error;
    });
  }

  const vouchers = (tx: Executor) => createExpenseVoucherService({ repo: expenseVoucherRepo, db: tx });

  interface Fixture {
    recorder: string;
    otherSub: string;
    ooty: string;
    coonoor: string;
    transport: string;
  }

  async function newUser(tx: Executor, name: string): Promise<string> {
    const stamp = `${Date.now()}${Math.floor(Math.random() * 100000)}`;
    const result = await tx.query<{ id: string }>(
      `INSERT INTO users (mobile, full_name, user_type, status) VALUES ($1, $2, 'ADMIN', 'ACTIVE') RETURNING id`,
      [`+9198${stamp.slice(-8)}`, name],
    );
    return result.rows[0]!.id;
  }

  async function seed(tx: Executor): Promise<Fixture> {
    const warehouses = await tx.query<{ id: string; code: string }>(
      `SELECT id, code FROM warehouses WHERE code IN ('WH-OOTY', 'WH-COON')`,
    );
    const byCode = new Map(warehouses.rows.map((w) => [w.code, w.id]));
    const cat = await tx.query<{ id: string }>(`SELECT id FROM expense_categories WHERE name = 'Transport'`);
    return {
      recorder: await newUser(tx, 'CI Recorder'),
      otherSub: await newUser(tx, 'CI Other Sub'),
      ooty: byCode.get('WH-OOTY')!,
      coonoor: byCode.get('WH-COON')!,
      transport: cat.rows[0]!.id,
    };
  }

  const sub = (userId: string, warehouseId: string): ResolvedScope =>
    aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [warehouseId], permission: 'finance.expense.log', userId });
  const mainAll = (userId: string): ResolvedScope =>
    aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, permission: 'finance.expense.log', userId });

  async function insertExpense(
    tx: Executor,
    f: Fixture,
    o: { warehouseId?: string | null; status?: string; deleted?: boolean } = {},
  ): Promise<string> {
    const result = await tx.query<{ id: string }>(
      `INSERT INTO expenses (warehouse_id, category, category_id, amount, expense_date, payment_method, status, recorded_by, vendor, description, deleted_at)
       VALUES ($1, 'Transport', $2, '1234.50', '2031-03-10', 'CASH', $3, $4, 'Secret Vendor Pvt', 'Diesel for the truck', CASE WHEN $5::boolean THEN now() END)
       RETURNING id`,
      [o.warehouseId === undefined ? f.ooty : o.warehouseId, f.transport, o.status ?? 'RECORDED', f.recorder, o.deleted ?? false],
    );
    return result.rows[0]!.id;
  }

  it('BR-75a (PostgreSQL): the voucher is derived from the expense: a stable number, the expense fields and the recorder name, with no authorizer', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = vouchers(tx);
      const id = await insertExpense(tx, f);

      const voucher = await svc.getVoucher(sub(f.recorder, f.ooty), id);
      expect(voucher.voucherNumber).toBe(`VCH-20310310-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`);
      expect(expenseVoucherResponse.safeParse(voucher).success).toBe(true);
      expect(voucher).toMatchObject({
        voucherType: 'EXPENSE',
        expenseId: id,
        category: 'Transport',
        amount: '1234.50',
        expenseDate: '2031-03-10',
        paymentMethod: 'CASH',
        vendor: 'Secret Vendor Pvt',
        description: 'Diesel for the truck',
        status: 'RECORDED',
        recordedBy: { id: f.recorder, name: 'CI Recorder' },
      });
      expect(Object.keys(voucher).sort()).toEqual(VOUCHER_KEYS);
      expect(voucher.warehouse).toMatchObject({ id: f.ooty, code: 'WH-OOTY' });
      // Read twice: the same document, the same number.
      expect(await svc.getVoucher(mainAll(f.recorder), id)).toEqual(voucher);
    });
  });

  it('BR-75a (PostgreSQL): a row carrying a legacy APPROVED status (no endpoint can produce one) still gets a voucher with no authorizer', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const legacy = await insertExpense(tx, f, { status: 'APPROVED' });
      const voucher = await vouchers(tx).getVoucher(mainAll(f.recorder), legacy);
      expect(voucher.status).toBe('APPROVED');
      expect(Object.keys(voucher).sort()).toEqual(VOUCHER_KEYS);
    });
  });

  it('BR-75b (PostgreSQL): the voucher respects warehouse scope: another warehouse and an unknown or deleted expense are 404; Main reads every warehouse', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = vouchers(tx);
      const id = await insertExpense(tx, f);
      const noWarehouse = await insertExpense(tx, f, { warehouseId: null });
      const deleted = await insertExpense(tx, f, { deleted: true });

      const cross = await failure(svc.getVoucher(sub(f.otherSub, f.coonoor), id));
      expect(cross.code).toBe('NOT_FOUND');
      expect(cross.status).toBe(404);
      expect((await failure(svc.getVoucher(sub(f.recorder, f.ooty), noWarehouse))).code).toBe('NOT_FOUND');
      expect((await failure(svc.getVoucher(mainAll(f.recorder), deleted))).code).toBe('NOT_FOUND');
      expect((await failure(svc.getVoucher(mainAll(f.recorder), newId()))).code).toBe('NOT_FOUND');
      expect((await svc.getVoucher(mainAll(f.recorder), id)).warehouse!.id).toBe(f.ooty);
      expect((await svc.getVoucher(mainAll(f.recorder), noWarehouse)).warehouse).toBeNull();
    });
  });

  it('BR-62 (PostgreSQL): expenses carry no decision columns and the status CHECK is the original one, which refuses CANCELLED', async () => {
    await inRolledBackTx(async (tx) => {
      const columns = await tx.query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns
          WHERE table_schema = current_schema() AND table_name = 'expenses'
            AND column_name IN ('decided_by', 'decided_at', 'decision_reason')`,
      );
      expect(columns.rows).toEqual([]);
      const guard = await tx.query(`SELECT 1 FROM pg_trigger WHERE tgname = 'trg_expenses_immutable_guard'`);
      expect(guard.rowCount).toBe(0);

      const f = await seed(tx);
      await tx.query('SAVEPOINT cancelled_status');
      await expect(insertExpense(tx, f, { status: 'CANCELLED' })).rejects.toMatchObject({ code: '23514' });
      await tx.query('ROLLBACK TO SAVEPOINT cancelled_status');
    });
  });
});

// ===========================================================================
// 3. Real HTTP through the real app router
// ===========================================================================
describeIfDatabase('Expense voucher and the absent approval workflow (real app router, PostgreSQL)', () => {
  let ready = false;
  let app: Express;
  let server: Server;
  const tokens: Record<string, string> = {};
  const tag = `ci-vch-${Date.now()}`;
  let coonoorId = '';
  let kotagiriId = '';
  let transportId = '';
  const userIds = {
    superAdmin: '00000000-0000-0000-0000-000000000001',
    sub: '',
    main: '',
  };
  let seq = 0;
  const key = (label: string): string => `${tag}-${label}-${(seq += 1)}`;

  beforeAll(async () => {
    ready = await databaseReady('expense_categories');
    if (!ready) throw new Error('the database is configured but expense_categories is missing: run the migrations');
    const [{ createApp }, { signAccessToken }, { pool }] = await Promise.all([
      import('../../app.js'),
      import('../../auth/jwt.js'),
      import('../../db/pool.js'),
    ]);
    app = createApp();
    server = app.listen(0);
    const wh = await pool.query<{ id: string; code: string }>(`SELECT id, code FROM warehouses WHERE code IN ('WH-COON', 'WH-KOTA')`);
    coonoorId = wh.rows.find((w) => w.code === 'WH-COON')!.id;
    kotagiriId = wh.rows.find((w) => w.code === 'WH-KOTA')!.id;
    transportId = (await pool.query<{ id: string }>(`SELECT id FROM expense_categories WHERE name = 'Transport'`)).rows[0]!.id;

    const stamp = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
    for (const [field, name, offset] of [['sub', 'CI HTTP Sub', 1], ['main', 'CI HTTP Main', 2]] as const) {
      const row = await pool.query<{ id: string }>(
        `INSERT INTO users (mobile, full_name, user_type, status) VALUES ($1, $2, 'ADMIN', 'ACTIVE') RETURNING id`,
        [`+9195${stamp.slice(-7)}${offset}`, name],
      );
      userIds[field] = row.rows[0]!.id;
    }

    const base = { farmerId: null, customerId: null };
    tokens['sa'] = signAccessToken({ sub: userIds.superAdmin, roles: [{ code: RoleCode.SUPER_ADMIN }], ...base });
    tokens['main'] = signAccessToken({ sub: userIds.main, roles: [{ code: RoleCode.MAIN_WH_ADMIN }], ...base });
    tokens['subCoonoor'] = signAccessToken({ sub: userIds.sub, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: coonoorId }], ...base });
    tokens['subKotagiri'] = signAccessToken({ sub: userIds.main, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: kotagiriId }], ...base });
    tokens['farmer'] = signAccessToken({ sub: userIds.superAdmin, roles: [{ code: RoleCode.FARMER }], farmerId: newId(), customerId: null });
    tokens['customer'] = signAccessToken({ sub: userIds.superAdmin, roles: [{ code: RoleCode.CUSTOMER }], farmerId: null, customerId: newId() });
    tokens['farmerAdmin'] = signAccessToken({ sub: userIds.superAdmin, roles: [{ code: RoleCode.FARMER_ADMIN, zoneId: newId() }], ...base });
  });

  afterAll(async () => {
    if (!ready) return;
    const [{ pool, closePool }, { closeRedis }] = await Promise.all([import('../../db/pool.js'), import('../../redis.js')]);
    // Audit rows are append-only and stay; the rows this suite committed are removed.
    await pool.query(`DELETE FROM expenses WHERE idempotency_key LIKE $1`, [`${tag}%`]);
    await pool.query(`DELETE FROM idempotency_keys WHERE idempotency_key LIKE $1`, [`${tag}%`]);
    await pool.query(`DELETE FROM expense_categories WHERE name LIKE $1`, [`${tag}%`]);
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await Promise.allSettled([closePool(), closeRedis()]);
  });

  const auth = (name: string): string => `Bearer ${tokens[name]!}`;
  const goodBody = () => ({ categoryId: transportId, expenseDate: '2033-02-05', amount: '10.00', paymentMethod: 'CASH' });

  /** A RECORDED expense in Coonoor written by the Sub admin through the real endpoint. */
  async function recordAsSub(label: string): Promise<string> {
    const res = await request(server).post('/v1/admin/expenses').set('Authorization', auth('subCoonoor')).set('Idempotency-Key', key(`rec-${label}`)).send(goodBody());
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return res.body.id as string;
  }

  const ZERO_ID = '99999999-9999-4999-8999-999999999999';

  it('BR-75c (HTTP): the voucher route is 401 without a token and 403 for FARMER, CUSTOMER and FARMER_ADMIN', async () => {
    const path = `/v1/admin/expenses/${ZERO_ID}/voucher`;
    expect((await request(server).get(path)).status).toBe(401);
    for (const role of ['farmer', 'customer', 'farmerAdmin']) {
      const res = await request(server).get(path).set('Authorization', auth(role));
      expect(res.status, `${role}: ${JSON.stringify(res.body)}`).toBe(403);
      expect(res.headers['content-type']).toContain('application/problem+json');
    }
  });

  it('BR-75c (HTTP): the voucher answers 200 for the own warehouse and Main, 404 for another warehouse, and carries the derived number', async () => {
    const id = await recordAsSub('voucher');
    const own = await request(server).get(`/v1/admin/expenses/${id}/voucher`).set('Authorization', auth('subCoonoor'));
    expect(own.status, JSON.stringify(own.body)).toBe(200);
    expect(own.body.voucherNumber).toBe(`VCH-20330205-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`);
    expect(own.body).toMatchObject({ voucherType: 'EXPENSE', amount: '10.00', status: 'RECORDED', recordedBy: { id: userIds.sub, name: 'CI HTTP Sub' } });
    expect(Object.keys(own.body as object).sort()).toEqual(VOUCHER_KEYS);
    expect(expenseVoucherResponse.safeParse(own.body).success).toBe(true);
    expect((await request(server).get(`/v1/admin/expenses/${id}/voucher`).set('Authorization', auth('main'))).status).toBe(200);
    expect((await request(server).get(`/v1/admin/expenses/${id}/voucher`).set('Authorization', auth('subKotagiri'))).status).toBe(404);
    expect((await request(server).get(`/v1/admin/expenses/${ZERO_ID}/voucher`).set('Authorization', auth('sa'))).status).toBe(404);
  });

  it('BR-62: there is no approve, reject or cancel route for expenses (404/405 for POST .../approve, /reject, /cancel, and category POST/PATCH)', async () => {
    const { pool } = await import('../../db/pool.js');
    const id = await recordAsSub('no-workflow');
    const name = `${tag}-Packaging`;
    const attempts: Array<{ method: 'get' | 'post' | 'patch'; path: string; body?: object }> = [
      { method: 'post', path: `/v1/admin/expenses/${id}/approve`, body: {} },
      { method: 'post', path: `/v1/admin/expenses/${id}/reject`, body: { reason: 'No receipt' } },
      { method: 'post', path: `/v1/admin/expenses/${id}/cancel`, body: {} },
      { method: 'post', path: '/v1/admin/expense-categories', body: { name } },
      { method: 'patch', path: `/v1/admin/expense-categories/${transportId}`, body: { isActive: false } },
      { method: 'get', path: '/v1/admin/expense-categories/manage' },
    ];
    for (const role of ['main', 'sa']) {
      for (const { method, path, body } of attempts) {
        const res = await request(server)[method](path).set('Authorization', auth(role)).set('Idempotency-Key', key('absent')).send(body);
        expect([404, 405], `${method} ${path} as ${role}: ${res.status} ${JSON.stringify(res.body)}`).toContain(res.status);
        // The router-level fallback, not a resource lookup: no handler ran.
        expect(res.body.detail, `${method} ${path} as ${role}`).toBe('No route matches this path and method.');
      }
    }

    // Nothing changed: the expense is still RECORDED, no category was created, Transport is still active,
    // and no decision or category audit row exists for any of it.
    const detail = await request(server).get(`/v1/admin/expenses/${id}`).set('Authorization', auth('subCoonoor'));
    expect(detail.status).toBe(200);
    expect(detail.body.status).toBe('RECORDED');
    expect((await pool.query(`SELECT 1 FROM expense_categories WHERE lower(name) = lower($1)`, [name])).rowCount).toBe(0);
    expect((await pool.query<{ is_active: boolean }>(`SELECT is_active FROM expense_categories WHERE id = $1`, [transportId])).rows[0]!.is_active).toBe(true);
    const audits = await pool.query(`SELECT 1 FROM audit_log WHERE entity_id = $1 AND action_code <> 'finance.expense.log'`, [id]);
    expect(audits.rowCount).toBe(0);

    // The one category route that remains is the read-only list.
    const list = await request(server).get('/v1/admin/expense-categories').set('Authorization', auth('main'));
    expect(list.status).toBe(200);
    expect(list.body.items.map((c: { id: string }) => c.id)).toContain(transportId);
  });
});
