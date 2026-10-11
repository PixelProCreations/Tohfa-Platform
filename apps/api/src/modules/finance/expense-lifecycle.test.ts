/**
 * Module 11 (Warehouse Finance): the expense decision lifecycle, category writes and voucher.
 *
 * BR-73 = expense lifecycle (approve / reject / cancel, immutability, idempotent decisions) and the
 *         expense category writes.
 * BR-75 = the derived expense payment voucher.
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
import {
  createExpenseCategoryBody,
  expenseVoucherResponse,
  listExpensesQuery,
  manageCategoriesQuery,
  rejectExpenseBody,
  updateExpenseCategoryBody,
} from './finance.schema.js';
import { createFinanceService } from './finance.service.js';
import { financeRepo } from './finance.repo.js';
import { createExpenseLifecycleService } from './expense-lifecycle.service.js';
import { expenseLifecycleRepo } from './expense-lifecycle.repo.js';
import { createExpenseCategoriesService } from './expense-categories.service.js';
import { expenseCategoriesRepo } from './expense-categories.repo.js';

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

// ===========================================================================
// 1. Schemas (no I/O)
// ===========================================================================
describe('expense lifecycle schemas', () => {
  it('BR-73a: a rejection needs a non-blank reason of at most 200 characters, and nothing else', () => {
    expect(rejectExpenseBody.safeParse({ reason: 'Receipt missing' }).success).toBe(true);
    expect(rejectExpenseBody.parse({ reason: '  padded  ' }).reason).toBe('padded');
    expect(rejectExpenseBody.safeParse({}).success).toBe(false);
    expect(rejectExpenseBody.safeParse({ reason: '   ' }).success).toBe(false);
    expect(rejectExpenseBody.safeParse({ reason: 'r'.repeat(200) }).success).toBe(true);
    expect(rejectExpenseBody.safeParse({ reason: 'r'.repeat(201) }).success).toBe(false);
    expect(rejectExpenseBody.safeParse({ reason: 'x', status: 'APPROVED' }).success).toBe(false);
  });

  it('BR-73a: the expense list filters by every lifecycle status, including CANCELLED, and rejects an unknown one', () => {
    for (const status of ['RECORDED', 'APPROVED', 'REJECTED', 'CANCELLED']) {
      expect(listExpensesQuery.safeParse({ status }).success, status).toBe(true);
    }
    expect(listExpensesQuery.safeParse({ status: 'PENDING' }).success).toBe(false);
  });

  it('BR-73b: a category name is trimmed, 1 to 80 characters, and an update names at least one field', () => {
    expect(createExpenseCategoryBody.parse({ name: '  Packaging ' }).name).toBe('Packaging');
    expect(createExpenseCategoryBody.safeParse({ name: '   ' }).success).toBe(false);
    expect(createExpenseCategoryBody.safeParse({ name: 'n'.repeat(81) }).success).toBe(false);
    expect(createExpenseCategoryBody.safeParse({ name: 'ok', isActive: true }).success).toBe(false);
    expect(updateExpenseCategoryBody.safeParse({}).success).toBe(false);
    expect(updateExpenseCategoryBody.safeParse({ isActive: false }).success).toBe(true);
    expect(updateExpenseCategoryBody.safeParse({ name: 'Renamed' }).success).toBe(true);
    expect(updateExpenseCategoryBody.safeParse({ isActive: 'no' }).success).toBe(false);
    expect(manageCategoriesQuery.parse({}).status).toBe('ALL');
    expect(manageCategoriesQuery.safeParse({ status: 'DELETED' }).success).toBe(false);
  });

  it('BR-75a: the voucher number shape is VCH-<yyyymmdd>-<8 upper-case hex>', () => {
    const shape = expenseVoucherResponse.shape.voucherNumber;
    expect(shape.safeParse('VCH-20260925-3F9A07B2').success).toBe(true);
    expect(shape.safeParse('VCH-000821').success).toBe(false);
    expect(shape.safeParse('vch-20260925-3f9a07b2').success).toBe(false);
  });
});

// ===========================================================================
// 2. Service + SQL against PostgreSQL (rolled-back transactions)
// ===========================================================================
describeIfDatabase('Expense lifecycle (PostgreSQL)', () => {
  let ready = false;

  beforeAll(async () => {
    ready = await databaseReady('expense_categories');
    if (!ready) throw new Error('the database is configured but expense_categories is missing: run the migrations');
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

  const lifecycle = (tx: Executor) =>
    createExpenseLifecycleService({ repo: expenseLifecycleRepo, db: tx, runTx: async (fn) => fn(tx) });
  const categories = (tx: Executor) =>
    createExpenseCategoriesService({ repo: expenseCategoriesRepo, db: tx, runTx: async (fn) => fn(tx) });
  const finance = (tx: Executor) =>
    createFinanceService({ repo: financeRepo, db: tx, runTx: async (fn) => fn(tx) });

  interface Fixture {
    recorder: string;
    otherSub: string;
    superAdmin: string;
    tohfaAdmin: string;
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
      superAdmin: await newUser(tx, 'CI Approver'),
      tohfaAdmin: await newUser(tx, 'CI Tohfa Admin'),
      ooty: byCode.get('WH-OOTY')!,
      coonoor: byCode.get('WH-COON')!,
      transport: cat.rows[0]!.id,
    };
  }

  const sub = (userId: string, warehouseId: string): ResolvedScope =>
    aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [warehouseId], permission: 'finance.expense.log', userId });
  const mainAll = (userId: string): ResolvedScope =>
    aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, permission: 'finance.expense.log', userId });
  const approver = (userId: string, roleCode: RoleCode = RoleCode.SUPER_ADMIN): ResolvedScope =>
    aScope({ level: ScopeLevel.ALL, roleCode, permission: 'finance.expense.approve', userId });
  const categoryAdmin = (userId: string): ResolvedScope =>
    aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUPER_ADMIN, permission: 'finance.expense_category.manage', userId });

  async function insertExpense(
    tx: Executor,
    f: Fixture,
    o: { warehouseId?: string | null; recordedBy?: string; amount?: string; status?: string; deleted?: boolean; vendor?: string | null } = {},
  ): Promise<string> {
    const result = await tx.query<{ id: string }>(
      `INSERT INTO expenses (warehouse_id, category, category_id, amount, expense_date, payment_method, status, recorded_by, vendor, description, deleted_at)
       VALUES ($1, 'Transport', $2, $3, '2031-03-10', 'CASH', $4, $5, $6, 'Diesel for the truck', CASE WHEN $7::boolean THEN now() END)
       RETURNING id`,
      [
        o.warehouseId === undefined ? f.ooty : o.warehouseId,
        f.transport,
        o.amount ?? '1234.50',
        o.status ?? 'RECORDED',
        o.recordedBy ?? f.recorder,
        o.vendor === undefined ? 'Secret Vendor Pvt' : o.vendor,
        o.deleted ?? false,
      ],
    );
    return result.rows[0]!.id;
  }

  async function auditRows(tx: Executor, entityId: string, actionCode?: string) {
    const result = await tx.query<{
      action_code: string;
      actor_id: string;
      actor_role: string;
      warehouse_id: string | null;
      before: Record<string, unknown> | null;
      after: Record<string, unknown> | null;
    }>(
      `SELECT action_code, actor_id, actor_role, warehouse_id, before, after FROM audit_log
        WHERE entity_id = $1 AND ($2::text IS NULL OR action_code = $2) ORDER BY created_at, id`,
      [entityId, actionCode ?? null],
    );
    return result.rows;
  }

  async function expenseRow(tx: Executor, id: string) {
    const result = await tx.query<{
      status: string;
      amount: string;
      approved_by: string | null;
      approved_at: Date | null;
      decided_by: string | null;
      decided_at: Date | null;
      decision_reason: string | null;
    }>(
      `SELECT status, amount::text, approved_by, approved_at, decided_by, decided_at, decision_reason FROM expenses WHERE id = $1`,
      [id],
    );
    return result.rows[0]!;
  }

  // ----- approve ------------------------------------------------------------
  it('BR-73a (PostgreSQL): SA approves a Sub admin expense; status, approver, time and ONE masked audit row land in the same transaction, money untouched', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const id = await insertExpense(tx, f);
      const result = await lifecycle(tx).approve(approver(f.superAdmin), 'k-approve-1', id);

      expect(result).toMatchObject({
        id,
        status: 'APPROVED',
        amount: '1234.50',
        decidedBy: f.superAdmin,
        decisionReason: null,
        warehouseId: f.ooty,
        recordedBy: f.recorder,
      });
      expect(result.decidedAt).not.toBeNull();

      const row = await expenseRow(tx, id);
      expect(row).toMatchObject({ status: 'APPROVED', amount: '1234.50', approved_by: f.superAdmin, decided_by: f.superAdmin, decision_reason: null });
      expect(row.approved_at).not.toBeNull();
      expect(row.decided_at).not.toBeNull();

      const audits = await auditRows(tx, id);
      expect(audits).toHaveLength(1);
      expect(audits[0]).toMatchObject({ action_code: 'finance.expense.approve', actor_id: f.superAdmin, actor_role: 'SUPER_ADMIN', warehouse_id: f.ooty });
      expect(audits[0]!.before).toEqual({ status: 'RECORDED' });
      expect(Object.keys(audits[0]!.after!).sort()).toEqual(['amount', 'category', 'expenseDate', 'id', 'paymentMethod', 'status', 'warehouseId']);
      expect(audits[0]!.after).toMatchObject({ status: 'APPROVED' });
      expect(JSON.stringify(audits[0])).not.toContain('Secret Vendor');
      expect(JSON.stringify(audits[0])).not.toContain('Diesel');
    });
  });

  it('BR-73a (PostgreSQL): a TOHFA Admin can approve too', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const id = await insertExpense(tx, f);
      const result = await lifecycle(tx).approve(approver(f.tohfaAdmin, RoleCode.TOHFA_ADMIN), 'k-approve-ta', id);
      expect(result.status).toBe('APPROVED');
      expect((await auditRows(tx, id))[0]).toMatchObject({ actor_role: 'TOHFA_ADMIN' });
    });
  });

  // ----- reject -------------------------------------------------------------
  it('BR-73b (PostgreSQL): a rejection stores the reason on the expense, shows it to the reader, and keeps it OUT of the audit row', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const id = await insertExpense(tx, f);
      const result = await lifecycle(tx).reject(approver(f.superAdmin), 'k-reject-1', id, { reason: 'Call 9876543210 receipt missing' });

      expect(result).toMatchObject({ status: 'REJECTED', decidedBy: f.superAdmin, decisionReason: 'Call 9876543210 receipt missing', amount: '1234.50' });
      const row = await expenseRow(tx, id);
      expect(row).toMatchObject({ status: 'REJECTED', approved_by: null, decided_by: f.superAdmin, decision_reason: 'Call 9876543210 receipt missing' });

      const audits = await auditRows(tx, id);
      expect(audits).toHaveLength(1);
      expect(audits[0]!.action_code).toBe('finance.expense.reject');
      expect(JSON.stringify(audits[0])).not.toContain('9876543210');
      expect(JSON.stringify(audits[0])).not.toContain('receipt missing');

      // The reader (the recorder, via the detail read) sees why.
      const seen = await finance(tx).getExpense(sub(f.recorder, f.ooty), id);
      expect(seen.decisionReason).toBe('Call 9876543210 receipt missing');
    });
  });

  it('BR-73b (PostgreSQL): the service refuses a blank reason with 422 and changes nothing', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const id = await insertExpense(tx, f);
      const err = await failure(lifecycle(tx).reject(approver(f.superAdmin), 'k-reject-blank', id, { reason: '   ' }));
      expect(err.code).toBe('VALIDATION_FAILED');
      expect((await expenseRow(tx, id)).status).toBe('RECORDED');
      expect(await auditRows(tx, id)).toHaveLength(0);
    });
  });

  // ----- separation of duties ----------------------------------------------
  it('BR-73c (PostgreSQL): the recorder can never approve or reject their own expense: a clean 403 SELF_APPROVAL_FORBIDDEN, no DB error, nothing written', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const id = await insertExpense(tx, f, { recordedBy: f.superAdmin, warehouseId: f.coonoor });
      const approve = await failure(lifecycle(tx).approve(approver(f.superAdmin), 'k-self-1', id));
      expect(approve.code).toBe('SELF_APPROVAL_FORBIDDEN');
      expect(approve.status).toBe(403);
      const reject = await failure(lifecycle(tx).reject(approver(f.superAdmin), 'k-self-2', id, { reason: 'mine' }));
      expect(reject.code).toBe('SELF_APPROVAL_FORBIDDEN');

      const row = await expenseRow(tx, id);
      expect(row).toMatchObject({ status: 'RECORDED', approved_by: null, decided_by: null });
      expect(await auditRows(tx, id)).toHaveLength(0);
    });
  });

  // ----- finality -----------------------------------------------------------
  it('BR-73d (PostgreSQL): a decided expense is final: any further decision, with a fresh key, is 409 INVALID_STATE_TRANSITION and the row does not change', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = lifecycle(tx);
      const admin = approver(f.superAdmin);

      const approved = await insertExpense(tx, f);
      await svc.approve(admin, 'k-final-a1', approved);
      const before = await expenseRow(tx, approved);
      // Thunks, so the attempts run one after another on the single transaction client.
      for (const attempt of [
        () => svc.approve(admin, 'k-final-a2', approved),
        () => svc.reject(admin, 'k-final-a3', approved, { reason: 'changed my mind' }),
        () => svc.cancel(sub(f.recorder, f.ooty), 'k-final-a4', approved),
      ]) {
        const err = await failure(attempt());
        expect(err.code).toBe('INVALID_STATE_TRANSITION');
        expect(err.status).toBe(409);
      }
      expect(await expenseRow(tx, approved)).toEqual(before);

      const rejected = await insertExpense(tx, f);
      await svc.reject(admin, 'k-final-r1', rejected, { reason: 'no receipt' });
      expect((await failure(svc.approve(admin, 'k-final-r2', rejected))).code).toBe('INVALID_STATE_TRANSITION');
      expect((await failure(svc.cancel(sub(f.recorder, f.ooty), 'k-final-r3', rejected))).code).toBe('INVALID_STATE_TRANSITION');
      expect((await expenseRow(tx, rejected)).status).toBe('REJECTED');

      expect(await auditRows(tx, approved)).toHaveLength(1);
      expect(await auditRows(tx, rejected)).toHaveLength(1);
    });
  });

  // ----- cancel -------------------------------------------------------------
  it('BR-73e (PostgreSQL): the recorder cancels their own RECORDED expense; the row stays (no hard delete), one masked audit row, and it can no longer be approved', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = lifecycle(tx);
      const id = await insertExpense(tx, f);
      const result = await svc.cancel(sub(f.recorder, f.ooty), 'k-cancel-1', id);
      expect(result).toMatchObject({ id, status: 'CANCELLED', decidedBy: f.recorder, decisionReason: null, amount: '1234.50' });

      const row = await expenseRow(tx, id);
      expect(row).toMatchObject({ status: 'CANCELLED', approved_by: null, decided_by: f.recorder });
      const audits = await auditRows(tx, id);
      expect(audits).toHaveLength(1);
      expect(audits[0]).toMatchObject({ action_code: 'finance.expense.cancel', actor_id: f.recorder, actor_role: 'SUB_WH_ADMIN', warehouse_id: f.ooty });
      expect(JSON.stringify(audits[0])).not.toContain('Secret Vendor');

      expect((await failure(svc.approve(approver(f.superAdmin), 'k-cancel-2', id))).code).toBe('INVALID_STATE_TRANSITION');
      // Still readable, with its CANCELLED status.
      expect((await finance(tx).getExpense(sub(f.recorder, f.ooty), id)).status).toBe('CANCELLED');
    });
  });

  it('BR-73e (PostgreSQL): only the recorder cancels: another Sub admin of the same warehouse and a Main admin get 403, a Sub admin of another warehouse gets 404', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = lifecycle(tx);
      const id = await insertExpense(tx, f);

      expect((await failure(svc.cancel(sub(f.otherSub, f.ooty), 'k-c-other', id))).code).toBe('FORBIDDEN');
      expect((await failure(svc.cancel(mainAll(f.otherSub), 'k-c-main', id))).code).toBe('FORBIDDEN');
      const cross = await failure(svc.cancel(sub(f.otherSub, f.coonoor), 'k-c-cross', id));
      expect(cross.code).toBe('NOT_FOUND');
      expect(cross.status).toBe(404);
      expect((await expenseRow(tx, id)).status).toBe('RECORDED');
      expect(await auditRows(tx, id)).toHaveLength(0);
    });
  });

  // ----- scope and existence -----------------------------------------------
  it('BR-73f (PostgreSQL): an unknown id, a soft-deleted row and a malformed-but-unknown id are 404 for every decision', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = lifecycle(tx);
      const deleted = await insertExpense(tx, f, { deleted: true });
      for (const id of [newId(), deleted]) {
        expect((await failure(svc.approve(approver(f.superAdmin), `k-404-a-${id}`, id))).code).toBe('NOT_FOUND');
        expect((await failure(svc.reject(approver(f.superAdmin), `k-404-r-${id}`, id, { reason: 'x' }))).code).toBe('NOT_FOUND');
        expect((await failure(svc.cancel(sub(f.recorder, f.ooty), `k-404-c-${id}`, id))).code).toBe('NOT_FOUND');
      }
    });
  });

  // ----- idempotency --------------------------------------------------------
  it('BR-73g (PostgreSQL): replaying a decision with the same Idempotency-Key returns the original result and writes no second audit row or update', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = lifecycle(tx);
      const id = await insertExpense(tx, f);
      const admin = approver(f.superAdmin);
      const first = await svc.approve(admin, 'k-replay', id);
      const afterFirst = await expenseRow(tx, id);
      const replay = await svc.approve(admin, 'k-replay', id);
      expect(replay).toEqual(first);
      expect(await expenseRow(tx, id)).toEqual(afterFirst);
      expect(await auditRows(tx, id)).toHaveLength(1);

      const rid = await insertExpense(tx, f);
      const rejected = await svc.reject(admin, 'k-replay-r', rid, { reason: 'No receipt' });
      expect(await svc.reject(admin, 'k-replay-r', rid, { reason: 'No receipt' })).toEqual(rejected);
      expect(await auditRows(tx, rid)).toHaveLength(1);

      const cid = await insertExpense(tx, f);
      const cancelled = await svc.cancel(sub(f.recorder, f.ooty), 'k-replay-c', cid);
      expect(await svc.cancel(sub(f.recorder, f.ooty), 'k-replay-c', cid)).toEqual(cancelled);
      expect(await auditRows(tx, cid)).toHaveLength(1);
    });
  });

  it('BR-73g (PostgreSQL): the same key for a different decision, a different reason or a different expense is 409 IDEMPOTENCY_KEY_REUSED; a missing key is 422', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = lifecycle(tx);
      const admin = approver(f.superAdmin);
      const a = await insertExpense(tx, f);
      const b = await insertExpense(tx, f);
      await svc.reject(admin, 'k-reuse', a, { reason: 'Reason one' });

      expect((await failure(svc.approve(admin, 'k-reuse', a))).code).toBe('IDEMPOTENCY_KEY_REUSED');
      expect((await failure(svc.reject(admin, 'k-reuse', a, { reason: 'Reason two' }))).code).toBe('IDEMPOTENCY_KEY_REUSED');
      expect((await failure(svc.reject(admin, 'k-reuse', b, { reason: 'Reason one' }))).code).toBe('IDEMPOTENCY_KEY_REUSED');
      expect((await expenseRow(tx, b)).status).toBe('RECORDED');

      expect((await failure(svc.approve(admin, undefined, b))).code).toBe('VALIDATION_FAILED');
      expect((await failure(svc.approve(admin, '   ', b))).code).toBe('VALIDATION_FAILED');
      expect((await expenseRow(tx, b)).status).toBe('RECORDED');
    });
  });

  // ----- the database guard -------------------------------------------------
  it('BR-73h (PostgreSQL): the database itself refuses to change the money fields, to edit a decided expense, to decide without a decider, or to approve your own', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const id = await insertExpense(tx, f);
      const decided = await insertExpense(tx, f);
      await lifecycle(tx).approve(approver(f.superAdmin), 'k-guard', decided);

      async function rejectedBy(sql: string, params: unknown[], pattern: RegExp): Promise<void> {
        await tx.query('SAVEPOINT guard');
        try {
          await tx.query(sql, params);
          throw new Error(`expected the database to refuse: ${sql}`);
        } catch (error) {
          expect(String((error as Error).message), sql).toMatch(pattern);
        } finally {
          await tx.query('ROLLBACK TO SAVEPOINT guard');
        }
      }

      for (const column of ['amount = 1.00', `expense_date = '2031-03-11'`, `payment_method = 'UPI'`, `category = 'Other'`]) {
        await rejectedBy(`UPDATE expenses SET ${column} WHERE id = $1`, [id], /immutable after recording/);
      }
      await rejectedBy(`UPDATE expenses SET warehouse_id = $2 WHERE id = $1`, [id, f.coonoor], /immutable after recording/);
      await rejectedBy(`UPDATE expenses SET recorded_by = $2 WHERE id = $1`, [id, f.superAdmin], /immutable after recording/);
      await rejectedBy(`UPDATE expenses SET vendor = 'changed' WHERE id = $1`, [decided], /can no longer be changed/);
      await rejectedBy(`UPDATE expenses SET status = 'RECORDED' WHERE id = $1`, [decided], /can no longer be changed/);
      await rejectedBy(`UPDATE expenses SET status = 'APPROVED' WHERE id = $1`, [id], /without decided_by and decided_at/);
      await rejectedBy(
        `UPDATE expenses SET status = 'APPROVED', approved_by = recorded_by, decided_by = recorded_by, decided_at = now() WHERE id = $1`,
        [id],
        /expenses_no_self_approval_chk|expenses_decision_separation_chk/,
      );
      await rejectedBy(
        `UPDATE expenses SET status = 'REJECTED', decided_by = $2, decided_at = now() WHERE id = $1`,
        [id, f.superAdmin],
        /expenses_rejection_needs_reason_chk/,
      );
      await rejectedBy(
        `UPDATE expenses SET status = 'CANCELLED', decided_by = $2, decided_at = now() WHERE id = $1`,
        [id, f.superAdmin],
        /expenses_decision_separation_chk/,
      );
      // The RECORDED row is untouched by every refused statement.
      expect(await expenseRow(tx, id)).toMatchObject({ status: 'RECORDED', amount: '1234.50', decided_by: null });
    });
  });

  // ----- list filtering -----------------------------------------------------
  it('BR-73i (PostgreSQL): the expense list filters by APPROVED, REJECTED and CANCELLED and reports exact totals for each', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = lifecycle(tx);
      const admin = approver(f.superAdmin);
      const approvedId = await insertExpense(tx, f, { amount: '0.10' });
      const rejectedId = await insertExpense(tx, f, { amount: '0.20' });
      const cancelledId = await insertExpense(tx, f, { amount: '0.30' });
      await insertExpense(tx, f, { amount: '5.00' });
      await svc.approve(admin, 'k-list-1', approvedId);
      await svc.reject(admin, 'k-list-2', rejectedId, { reason: 'No' });
      await svc.cancel(sub(f.recorder, f.ooty), 'k-list-3', cancelledId);

      const base = { from: '2031-03-10', to: '2031-03-10', limit: 100 };
      const scope = mainAll(f.recorder);
      const pick = async (status: 'RECORDED' | 'APPROVED' | 'REJECTED' | 'CANCELLED') => {
        const result = await finance(tx).listExpenses(scope, { ...base, status, warehouseId: f.ooty });
        return { ids: result.items.map((i) => i.id), summary: result.summary };
      };
      expect(await pick('APPROVED')).toEqual({ ids: [approvedId], summary: { count: 1, total: '0.10' } });
      expect(await pick('REJECTED')).toEqual({ ids: [rejectedId], summary: { count: 1, total: '0.20' } });
      expect(await pick('CANCELLED')).toEqual({ ids: [cancelledId], summary: { count: 1, total: '0.30' } });
      expect((await pick('RECORDED')).summary).toEqual({ count: 1, total: '5.00' });
    });
  });

  // ----- category writes ----------------------------------------------------
  it('BR-73j (PostgreSQL): create, rename, deactivate and reactivate a category, each with one masked audit row; names are unique case-insensitively', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = categories(tx);
      const admin = categoryAdmin(f.superAdmin);

      const created = await svc.create(admin, { name: 'Packaging' });
      expect(created).toMatchObject({ name: 'Packaging', isActive: true, expenseCount: 0 });
      const createAudit = await auditRows(tx, created.id);
      expect(createAudit).toHaveLength(1);
      expect(createAudit[0]).toMatchObject({ action_code: 'finance.expense_category.manage', actor_id: f.superAdmin });
      expect(createAudit[0]!.after).toEqual({ id: created.id, name: 'Packaging', isActive: true });

      expect((await failure(svc.create(admin, { name: 'packaging' }))).code).toBe('CONFLICT');
      expect((await failure(svc.create(admin, { name: 'TRANSPORT' }))).code).toBe('CONFLICT');

      const renamed = await svc.update(admin, created.id, { name: 'Crates' });
      expect(renamed.name).toBe('Crates');
      expect((await failure(svc.update(admin, created.id, { name: 'transport' }))).code).toBe('CONFLICT');
      // A case-only rename of itself is allowed (the unique key excludes the row itself).
      expect((await svc.update(admin, created.id, { name: 'CRATES' })).name).toBe('CRATES');

      const off = await svc.update(admin, created.id, { isActive: false });
      expect(off.isActive).toBe(false);
      const on = await svc.update(admin, created.id, { isActive: true });
      expect(on.isActive).toBe(true);

      const audits = await auditRows(tx, created.id);
      expect(audits).toHaveLength(5);
      expect(audits.every((a) => a.action_code === 'finance.expense_category.manage')).toBe(true);
      // Audit rows of one transaction share a timestamp, so find the rename by content, not by position.
      const rename = audits.find((a) => (a.after as { name?: string } | null)?.name === 'Crates');
      expect(rename).toMatchObject({ before: { id: created.id, name: 'Packaging', isActive: true }, after: { id: created.id, name: 'Crates', isActive: true } });
      const deactivate = audits.find((a) => (a.after as { isActive?: boolean } | null)?.isActive === false);
      expect(deactivate).toMatchObject({ before: { name: 'CRATES', isActive: true }, after: { name: 'CRATES', isActive: false } });
    });
  });

  it('BR-73j (PostgreSQL): a no-op update changes and audits nothing; an unknown category is 404', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = categories(tx);
      const admin = categoryAdmin(f.superAdmin);
      const created = await svc.create(admin, { name: 'NoOp Category' });
      const same = await svc.update(admin, created.id, { name: 'NoOp Category', isActive: true });
      expect(same).toEqual(created);
      expect(await auditRows(tx, created.id)).toHaveLength(1);
      expect((await failure(svc.update(admin, newId(), { isActive: false }))).code).toBe('NOT_FOUND');
    });
  });

  it('BR-73k (PostgreSQL): a deactivated category is refused on a NEW expense but keeps labelling the old ones; reactivating allows it again', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const cats = categories(tx);
      const fin = finance(tx);
      const admin = categoryAdmin(f.superAdmin);
      const category = await cats.create(admin, { name: 'Seasonal Fees' });
      const body = { categoryId: category.id, expenseDate: '2031-03-10', amount: '10.00', paymentMethod: 'CASH' as const };

      const first = await fin.createExpense(sub(f.recorder, f.ooty), 'k-cat-1', body);
      await cats.update(admin, category.id, { isActive: false });

      const refused = await failure(fin.createExpense(sub(f.recorder, f.ooty), 'k-cat-2', body));
      expect(refused.code).toBe('VALIDATION_FAILED');
      expect(refused.errors).toHaveProperty(['body.categoryId']);

      const old = await fin.getExpense(sub(f.recorder, f.ooty), first.expense.id);
      expect(old.category).toBe('Seasonal Fees');
      expect(old.categoryId).toBe(category.id);

      await cats.update(admin, category.id, { isActive: true });
      const again = await fin.createExpense(sub(f.recorder, f.ooty), 'k-cat-3', body);
      expect(again.replayed).toBe(false);

      const manage = await cats.list({ status: 'ALL' });
      expect(manage.items.find((c) => c.id === category.id)).toMatchObject({ isActive: true, expenseCount: 2 });
    });
  });

  it('BR-73k (PostgreSQL): the management list filters ACTIVE / INACTIVE / ALL and counts expenses per category', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const cats = categories(tx);
      const created = await cats.create(categoryAdmin(f.superAdmin), { name: 'Retired Thing' });
      await cats.update(categoryAdmin(f.superAdmin), created.id, { isActive: false });
      await insertExpense(tx, f);

      const all = await cats.list({ status: 'ALL' });
      const active = await cats.list({ status: 'ACTIVE' });
      const inactive = await cats.list({ status: 'INACTIVE' });
      expect(all.items.some((c) => c.id === created.id)).toBe(true);
      expect(active.items.some((c) => c.id === created.id)).toBe(false);
      expect(inactive.items.map((c) => c.id)).toContain(created.id);
      expect(inactive.items.every((c) => !c.isActive)).toBe(true);
      expect(active.items.every((c) => c.isActive)).toBe(true);
      expect(all.items.find((c) => c.id === f.transport)!.expenseCount).toBeGreaterThanOrEqual(1);
      expect(Object.keys(all.items[0]!).sort()).toEqual(['expenseCount', 'id', 'isActive', 'name']);
    });
  });

  // ----- voucher ------------------------------------------------------------
  it('BR-75a (PostgreSQL): the voucher is derived from the expense: a stable number, the expense fields, the recorder name and the approval state', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = lifecycle(tx);
      const id = await insertExpense(tx, f);

      const open = await svc.getVoucher(sub(f.recorder, f.ooty), id);
      expect(open.voucherNumber).toBe(`VCH-20310310-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`);
      expect(expenseVoucherResponse.safeParse(open).success).toBe(true);
      expect(open).toMatchObject({
        voucherType: 'EXPENSE',
        expenseId: id,
        category: 'Transport',
        amount: '1234.50',
        expenseDate: '2031-03-10',
        paymentMethod: 'CASH',
        vendor: 'Secret Vendor Pvt',
        status: 'RECORDED',
        recordedBy: { id: f.recorder, name: 'CI Recorder' },
        authorizedBy: null,
        decidedAt: null,
        decisionReason: null,
      });
      expect(open.warehouse).toMatchObject({ id: f.ooty, code: 'WH-OOTY' });
      // Read twice: the same document, the same number.
      expect(await svc.getVoucher(sub(f.recorder, f.ooty), id)).toEqual(open);

      await svc.approve(approver(f.superAdmin), 'k-voucher-1', id);
      const approved = await svc.getVoucher(mainAll(f.recorder), id);
      expect(approved.voucherNumber).toBe(open.voucherNumber);
      expect(approved).toMatchObject({ status: 'APPROVED', authorizedBy: { id: f.superAdmin, name: 'CI Approver' } });
      expect(approved.decidedAt).not.toBeNull();
    });
  });

  it('BR-75a (PostgreSQL): a rejected or cancelled expense names no authorizer; a rejected one carries its reason', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = lifecycle(tx);
      const rejected = await insertExpense(tx, f);
      const cancelled = await insertExpense(tx, f);
      await svc.reject(approver(f.superAdmin), 'k-vr-1', rejected, { reason: 'No receipt' });
      await svc.cancel(sub(f.recorder, f.ooty), 'k-vr-2', cancelled);
      expect(await svc.getVoucher(mainAll(f.recorder), rejected)).toMatchObject({ status: 'REJECTED', authorizedBy: null, decisionReason: 'No receipt' });
      expect(await svc.getVoucher(mainAll(f.recorder), cancelled)).toMatchObject({ status: 'CANCELLED', authorizedBy: null, decisionReason: null });
    });
  });

  it('BR-75b (PostgreSQL): the voucher respects warehouse scope: another warehouse and an unknown or deleted expense are 404; Main reads every warehouse', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = lifecycle(tx);
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
});

// ===========================================================================
// 3. Real HTTP through the real app router
// ===========================================================================
describeIfDatabase('Expense lifecycle routes (real app router, PostgreSQL)', () => {
  let ready = false;
  let app: Express;
  let server: Server;
  const tokens: Record<string, string> = {};
  const tag = `ci-g1-${Date.now()}`;
  let coonoorId = '';
  let kotagiriId = '';
  let transportId = '';
  const userIds = {
    superAdmin: '00000000-0000-0000-0000-000000000001',
    sub: '',
    otherSub: '',
    tohfaAdmin: '',
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
    for (const [field, name, offset] of [['sub', 'CI HTTP Sub', 1], ['otherSub', 'CI HTTP Other Sub', 2], ['tohfaAdmin', 'CI HTTP TA', 3]] as const) {
      const row = await pool.query<{ id: string }>(
        `INSERT INTO users (mobile, full_name, user_type, status) VALUES ($1, $2, 'ADMIN', 'ACTIVE') RETURNING id`,
        [`+9196${stamp.slice(-7)}${offset}`, name],
      );
      userIds[field] = row.rows[0]!.id;
    }

    const base = { farmerId: null, customerId: null };
    tokens['sa'] = signAccessToken({ sub: userIds.superAdmin, roles: [{ code: RoleCode.SUPER_ADMIN }], ...base });
    tokens['ta'] = signAccessToken({ sub: userIds.tohfaAdmin, roles: [{ code: RoleCode.TOHFA_ADMIN }], ...base });
    tokens['main'] = signAccessToken({ sub: userIds.otherSub, roles: [{ code: RoleCode.MAIN_WH_ADMIN }], ...base });
    tokens['subCoonoor'] = signAccessToken({ sub: userIds.sub, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: coonoorId }], ...base });
    tokens['otherSubCoonoor'] = signAccessToken({ sub: userIds.otherSub, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: coonoorId }], ...base });
    tokens['subKotagiri'] = signAccessToken({ sub: userIds.otherSub, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: kotagiriId }], ...base });
    tokens['farmer'] = signAccessToken({ sub: userIds.superAdmin, roles: [{ code: RoleCode.FARMER }], farmerId: newId(), customerId: null });
    tokens['customer'] = signAccessToken({ sub: userIds.superAdmin, roles: [{ code: RoleCode.CUSTOMER }], farmerId: null, customerId: newId() });
    tokens['farmerAdmin'] = signAccessToken({ sub: userIds.superAdmin, roles: [{ code: RoleCode.FARMER_ADMIN, zoneId: newId() }], ...base });
  });

  afterAll(async () => {
    if (!ready) return;
    const [{ pool, closePool }, { closeRedis }] = await Promise.all([import('../../db/pool.js'), import('../../redis.js')]);
    // Audit rows are append-only and stay; the rows this suite committed are removed (children first).
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
  const ROUTES: Array<{ method: 'get' | 'post' | 'patch'; path: string; body?: object }> = [
    { method: 'post', path: `/v1/admin/expenses/${ZERO_ID}/approve` },
    { method: 'post', path: `/v1/admin/expenses/${ZERO_ID}/reject`, body: { reason: 'x' } },
    { method: 'post', path: `/v1/admin/expenses/${ZERO_ID}/cancel` },
    { method: 'get', path: `/v1/admin/expenses/${ZERO_ID}/voucher` },
    { method: 'get', path: '/v1/admin/expense-categories/manage' },
    { method: 'post', path: '/v1/admin/expense-categories', body: { name: 'x' } },
    { method: 'patch', path: `/v1/admin/expense-categories/${ZERO_ID}`, body: { isActive: false } },
  ];

  it('BR-73l (HTTP): every new route is 401 without a token and 403 for FARMER, CUSTOMER and FARMER_ADMIN', async () => {
    for (const { method, path, body } of ROUTES) {
      const anonymous = await request(server)[method](path).send(body);
      expect(anonymous.status, `${method} ${path} anonymous`).toBe(401);
      for (const role of ['farmer', 'customer', 'farmerAdmin']) {
        const res = await request(server)[method](path).set('Authorization', auth(role)).set('Idempotency-Key', key('denied')).send(body);
        expect(res.status, `${method} ${path} as ${role}: ${JSON.stringify(res.body)}`).toBe(403);
        expect(res.headers['content-type']).toContain('application/problem+json');
      }
    }
  });

  it('BR-73l (HTTP): approve, reject and the category writes are 403 for SUB_WH_ADMIN and MAIN_WH_ADMIN, while the voucher is open to the Sub admin', async () => {
    const id = await recordAsSub('perm');
    const writes: Array<{ method: 'post' | 'patch'; path: string; body?: object }> = [
      { method: 'post', path: `/v1/admin/expenses/${id}/approve` },
      { method: 'post', path: `/v1/admin/expenses/${id}/reject`, body: { reason: 'x' } },
      { method: 'post', path: '/v1/admin/expense-categories', body: { name: `${tag}-nope` } },
      { method: 'patch', path: `/v1/admin/expense-categories/${ZERO_ID}`, body: { isActive: false } },
    ];
    for (const role of ['subCoonoor', 'main']) {
      for (const { method, path, body } of writes) {
        const res = await request(server)[method](path).set('Authorization', auth(role)).set('Idempotency-Key', key('perm')).send(body);
        expect(res.status, `${method} ${path} as ${role}: ${JSON.stringify(res.body)}`).toBe(403);
      }
      const manage = await request(server).get('/v1/admin/expense-categories/manage').set('Authorization', auth(role));
      expect(manage.status, role).toBe(403);
    }
    const voucher = await request(server).get(`/v1/admin/expenses/${id}/voucher`).set('Authorization', auth('subCoonoor'));
    expect(voucher.status, JSON.stringify(voucher.body)).toBe(200);
    // Nothing was decided by the refused attempts.
    const detail = await request(server).get(`/v1/admin/expenses/${id}`).set('Authorization', auth('subCoonoor'));
    expect(detail.body.status).toBe('RECORDED');
  });

  it('BR-73m (HTTP): SA approves; replay is 200 with the identical body; a second decision is 409; the recorder cannot cancel it any more', async () => {
    const id = await recordAsSub('approve');
    const k = key('approve');
    const first = await request(server).post(`/v1/admin/expenses/${id}/approve`).set('Authorization', auth('sa')).set('Idempotency-Key', k);
    expect(first.status, JSON.stringify(first.body)).toBe(200);
    expect(first.body).toMatchObject({ id, status: 'APPROVED', decidedBy: userIds.superAdmin, amount: '10.00', decisionReason: null });

    const replay = await request(server).post(`/v1/admin/expenses/${id}/approve`).set('Authorization', auth('sa')).set('Idempotency-Key', k);
    expect(replay.status).toBe(200);
    expect(replay.body).toEqual(first.body);

    const reject = await request(server).post(`/v1/admin/expenses/${id}/reject`).set('Authorization', auth('sa')).set('Idempotency-Key', key('late-reject')).send({ reason: 'too late' });
    expect(reject.status).toBe(409);
    expect(reject.body.code).toBe('INVALID_STATE_TRANSITION');
    const cancel = await request(server).post(`/v1/admin/expenses/${id}/cancel`).set('Authorization', auth('subCoonoor')).set('Idempotency-Key', key('late-cancel'));
    expect(cancel.status).toBe(409);
    const reused = await request(server).post(`/v1/admin/expenses/${id}/reject`).set('Authorization', auth('sa')).set('Idempotency-Key', k).send({ reason: 'same key' });
    expect(reused.status).toBe(409);
    expect(reused.body.code).toBe('IDEMPOTENCY_KEY_REUSED');

    const { pool } = await import('../../db/pool.js');
    const audits = await pool.query(`SELECT 1 FROM audit_log WHERE entity_id = $1 AND action_code = 'finance.expense.approve'`, [id]);
    expect(audits.rowCount).toBe(1);
  });

  it('BR-73m (HTTP): a rejection needs a reason (422 without), stores it, and a failed attempt leaves the key usable', async () => {
    const id = await recordAsSub('reject');
    const k = key('reject');
    const noReason = await request(server).post(`/v1/admin/expenses/${id}/reject`).set('Authorization', auth('ta')).set('Idempotency-Key', k).send({});
    expect(noReason.status).toBe(422);
    const blank = await request(server).post(`/v1/admin/expenses/${id}/reject`).set('Authorization', auth('ta')).set('Idempotency-Key', k).send({ reason: '  ' });
    expect(blank.status).toBe(422);
    const extra = await request(server).post(`/v1/admin/expenses/${id}/reject`).set('Authorization', auth('ta')).set('Idempotency-Key', k).send({ reason: 'x', status: 'APPROVED' });
    expect(extra.status).toBe(422);
    const noKey = await request(server).post(`/v1/admin/expenses/${id}/reject`).set('Authorization', auth('ta')).send({ reason: 'Receipt missing' });
    expect(noKey.status).toBe(422);

    // The same key the failed attempts used still works for the real one.
    const ok = await request(server).post(`/v1/admin/expenses/${id}/reject`).set('Authorization', auth('ta')).set('Idempotency-Key', k).send({ reason: 'Receipt missing' });
    expect(ok.status, JSON.stringify(ok.body)).toBe(200);
    expect(ok.body).toMatchObject({ status: 'REJECTED', decisionReason: 'Receipt missing', decidedBy: userIds.tohfaAdmin });

    const detail = await request(server).get(`/v1/admin/expenses/${id}`).set('Authorization', auth('subCoonoor'));
    expect(detail.body).toMatchObject({ status: 'REJECTED', decisionReason: 'Receipt missing' });
    const list = await request(server).get('/v1/admin/expenses').query({ from: '2033-02-05', to: '2033-02-05', status: 'REJECTED' }).set('Authorization', auth('subCoonoor'));
    expect(list.status).toBe(200);
    expect(list.body.items.map((i: { id: string }) => i.id)).toContain(id);
  });

  it('BR-73m (HTTP): the approver who recorded the expense gets 403 SELF_APPROVAL_FORBIDDEN (not a database 500), and the failed attempt leaves its key usable', async () => {
    const created = await request(server).post('/v1/admin/expenses').set('Authorization', auth('sa')).set('Idempotency-Key', key('sa-own')).send({ ...goodBody(), warehouseId: coonoorId });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    const kSelf = key('self-approve');
    const approve = await request(server).post(`/v1/admin/expenses/${created.body.id as string}/approve`).set('Authorization', auth('sa')).set('Idempotency-Key', kSelf);
    expect(approve.status).toBe(403);
    expect(approve.body.code).toBe('SELF_APPROVAL_FORBIDDEN');
    const reject = await request(server).post(`/v1/admin/expenses/${created.body.id as string}/reject`).set('Authorization', auth('sa')).set('Idempotency-Key', key('self-reject')).send({ reason: 'mine' });
    expect(reject.status).toBe(403);
    expect(reject.body.code).toBe('SELF_APPROVAL_FORBIDDEN');

    // The refused request rolled its key claim back: the same key now approves a DIFFERENT expense
    // (a leaked claim would answer 409 IDEMPOTENCY_KEY_REUSED).
    const sub = await recordAsSub('self-key');
    const reuse = await request(server).post(`/v1/admin/expenses/${sub}/approve`).set('Authorization', auth('sa')).set('Idempotency-Key', kSelf);
    expect(reuse.status, JSON.stringify(reuse.body)).toBe(200);

    // A different approver can decide the SA's own expense.
    const other = await request(server).post(`/v1/admin/expenses/${created.body.id as string}/approve`).set('Authorization', auth('ta')).set('Idempotency-Key', key('other'));
    expect(other.status).toBe(200);
  });

  it('BR-73m (HTTP): the recorder cancels (200, replay 200); another Sub admin of the warehouse is 403, a Sub admin of another warehouse is 404, Main is 403', async () => {
    const id = await recordAsSub('cancel');
    for (const [role, status] of [['otherSubCoonoor', 403], ['subKotagiri', 404], ['main', 403]] as const) {
      const res = await request(server).post(`/v1/admin/expenses/${id}/cancel`).set('Authorization', auth(role)).set('Idempotency-Key', key(`c-${role}`));
      expect(res.status, role).toBe(status);
    }
    const k = key('cancel');
    const done = await request(server).post(`/v1/admin/expenses/${id}/cancel`).set('Authorization', auth('subCoonoor')).set('Idempotency-Key', k);
    expect(done.status, JSON.stringify(done.body)).toBe(200);
    expect(done.body).toMatchObject({ status: 'CANCELLED', decidedBy: userIds.sub });
    const replay = await request(server).post(`/v1/admin/expenses/${id}/cancel`).set('Authorization', auth('subCoonoor')).set('Idempotency-Key', k);
    expect(replay.status).toBe(200);
    expect(replay.body).toEqual(done.body);
    const noKey = await request(server).post(`/v1/admin/expenses/${id}/cancel`).set('Authorization', auth('subCoonoor'));
    expect(noKey.status).toBe(422);

    const still = await request(server).get(`/v1/admin/expenses/${id}`).set('Authorization', auth('subCoonoor'));
    expect(still.status).toBe(200);
    expect(still.body.status).toBe('CANCELLED');
  });

  it('BR-73m (HTTP): two simultaneous conflicting decisions on one expense: exactly one wins, the other is 409, and ONE audit row exists; two simultaneous replays of one key both answer the original', async () => {
    const id = await recordAsSub('race');
    const [approve, reject] = await Promise.all([
      request(server).post(`/v1/admin/expenses/${id}/approve`).set('Authorization', auth('sa')).set('Idempotency-Key', key('race-a')),
      request(server).post(`/v1/admin/expenses/${id}/reject`).set('Authorization', auth('ta')).set('Idempotency-Key', key('race-r')).send({ reason: 'racing' }),
    ]);
    expect([approve.status, reject.status].sort()).toEqual([200, 409]);
    const winner = approve.status === 200 ? approve : reject;
    const loser = approve.status === 200 ? reject : approve;
    expect(loser.body.code).toBe('INVALID_STATE_TRANSITION');
    const detail = await request(server).get(`/v1/admin/expenses/${id}`).set('Authorization', auth('subCoonoor'));
    expect(detail.body.status).toBe(winner.body.status);
    const { pool } = await import('../../db/pool.js');
    const audits = await pool.query(`SELECT 1 FROM audit_log WHERE entity_id = $1 AND action_code IN ('finance.expense.approve', 'finance.expense.reject')`, [id]);
    expect(audits.rowCount).toBe(1);

    const other = await recordAsSub('race-replay');
    const k = key('race-same');
    const [first, second] = await Promise.all([
      request(server).post(`/v1/admin/expenses/${other}/approve`).set('Authorization', auth('sa')).set('Idempotency-Key', k),
      request(server).post(`/v1/admin/expenses/${other}/approve`).set('Authorization', auth('sa')).set('Idempotency-Key', k),
    ]);
    expect([first.status, second.status]).toEqual([200, 200]);
    expect(first.body).toEqual(second.body);
    const once = await pool.query(`SELECT 1 FROM audit_log WHERE entity_id = $1 AND action_code = 'finance.expense.approve'`, [other]);
    expect(once.rowCount).toBe(1);
  });

  it('BR-73m (HTTP): a malformed or unknown expense id is 422 / 404', async () => {
    const bad = await request(server).post('/v1/admin/expenses/not-a-uuid/approve').set('Authorization', auth('sa')).set('Idempotency-Key', key('bad'));
    expect(bad.status).toBe(422);
    const unknown = await request(server).post(`/v1/admin/expenses/${ZERO_ID}/approve`).set('Authorization', auth('sa')).set('Idempotency-Key', key('unknown'));
    expect(unknown.status).toBe(404);
  });

  it('BR-75c (HTTP): the voucher answers 200 for the own warehouse and Main, 404 for another warehouse, and carries the derived number', async () => {
    const id = await recordAsSub('voucher');
    const own = await request(server).get(`/v1/admin/expenses/${id}/voucher`).set('Authorization', auth('subCoonoor'));
    expect(own.status, JSON.stringify(own.body)).toBe(200);
    expect(own.body.voucherNumber).toBe(`VCH-20330205-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`);
    expect(own.body).toMatchObject({ voucherType: 'EXPENSE', amount: '10.00', status: 'RECORDED', authorizedBy: null, recordedBy: { id: userIds.sub, name: 'CI HTTP Sub' } });
    expect(expenseVoucherResponse.safeParse(own.body).success).toBe(true);
    expect((await request(server).get(`/v1/admin/expenses/${id}/voucher`).set('Authorization', auth('main'))).status).toBe(200);
    expect((await request(server).get(`/v1/admin/expenses/${id}/voucher`).set('Authorization', auth('subKotagiri'))).status).toBe(404);
    expect((await request(server).get(`/v1/admin/expenses/${ZERO_ID}/voucher`).set('Authorization', auth('sa'))).status).toBe(404);
  });

  it('BR-73n (HTTP): SA creates a category (201), a duplicate is 409, rename and deactivate work, the management list shows it, and the normal list hides it once inactive', async () => {
    const name = `${tag}-Packaging`;
    const created = await request(server).post('/v1/admin/expense-categories').set('Authorization', auth('sa')).send({ name });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    expect(created.body).toMatchObject({ name, isActive: true, expenseCount: 0 });

    const dup = await request(server).post('/v1/admin/expense-categories').set('Authorization', auth('ta')).send({ name: name.toUpperCase() });
    expect(dup.status).toBe(409);
    expect(dup.body.code).toBe('CONFLICT');
    expect((await request(server).post('/v1/admin/expense-categories').set('Authorization', auth('sa')).send({ name: '  ' })).status).toBe(422);
    expect((await request(server).post('/v1/admin/expense-categories').set('Authorization', auth('sa')).send({ name: 'x', extra: 1 })).status).toBe(422);

    const id = created.body.id as string;
    const renamed = await request(server).patch(`/v1/admin/expense-categories/${id}`).set('Authorization', auth('sa')).send({ name: `${tag}-Crates` });
    expect(renamed.status, JSON.stringify(renamed.body)).toBe(200);
    expect(renamed.body.name).toBe(`${tag}-Crates`);
    expect((await request(server).patch(`/v1/admin/expense-categories/${id}`).set('Authorization', auth('sa')).send({})).status).toBe(422);
    expect((await request(server).patch(`/v1/admin/expense-categories/${id}`).set('Authorization', auth('sa')).send({ name: 'transport' })).status).toBe(409);
    expect((await request(server).patch(`/v1/admin/expense-categories/${ZERO_ID}`).set('Authorization', auth('sa')).send({ isActive: false })).status).toBe(404);

    const active = await request(server).get('/v1/admin/expense-categories').set('Authorization', auth('subCoonoor'));
    expect(active.body.items.map((c: { id: string }) => c.id)).toContain(id);
    const off = await request(server).patch(`/v1/admin/expense-categories/${id}`).set('Authorization', auth('ta')).send({ isActive: false });
    expect(off.status).toBe(200);
    expect(off.body.isActive).toBe(false);
    const hidden = await request(server).get('/v1/admin/expense-categories').set('Authorization', auth('subCoonoor'));
    expect(hidden.body.items.map((c: { id: string }) => c.id)).not.toContain(id);
    const refused = await request(server).post('/v1/admin/expenses').set('Authorization', auth('subCoonoor')).set('Idempotency-Key', key('inactive-cat')).send({ ...goodBody(), categoryId: id });
    expect(refused.status).toBe(422);

    const manage = await request(server).get('/v1/admin/expense-categories/manage').query({ status: 'INACTIVE' }).set('Authorization', auth('sa'));
    expect(manage.status, JSON.stringify(manage.body)).toBe(200);
    expect(manage.body.items.map((c: { id: string }) => c.id)).toContain(id);
    expect((await request(server).get('/v1/admin/expense-categories/manage').query({ status: 'BOGUS' }).set('Authorization', auth('sa'))).status).toBe(422);
  });
});
