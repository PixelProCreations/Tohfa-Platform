/**
 * Module 14 (Warehouse Staff and Attendance).
 *
 * BR-83 = the staff roster: one warehouse each, not users, warehouse-scoped (another warehouse's
 *         id is 404), soft deactivation, masked audit rows, staff reads on admin.staff.list_view.
 * BR-84 = daily attendance: one row per staff member per Asia/Kolkata day updated in place, every
 *         change kept (append-only history), future day 422, deactivated staff 409, bulk is
 *         all-or-nothing, exact summary counts, role matrix.
 *
 * Three layers, because mocked-repo tests alone once let SQL on nonexistent columns ship:
 *   1. schema tests (no I/O),
 *   2. service tests that run EVERY repo query against a migrated Postgres inside a transaction
 *      that is rolled back (the service's own transactions become SAVEPOINTs, so a failed bulk
 *      request really does roll its earlier entries back),
 *   3. real-HTTP tests through the real app router (role matrix, status codes, cross-scope 404).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import type { Server } from 'node:http';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import { ensureStandardUsers, insertUser, requireDatabaseTables } from '../../test/dbFixtures.js';
import { warehouseStaffRepo } from './warehouse-staff.repo.js';
import {
  attendanceSummaryQuery,
  bulkAttendanceBody,
  createStaffBody,
  listAttendanceQuery,
  markAttendanceBody,
  updateStaffBody,
} from './warehouse-staff.schema.js';
import { createWarehouseStaffService } from './warehouse-staff.service.js';

// ===========================================================================
// 1. Schemas
// ===========================================================================
const validStaff = { fullName: 'Karthik R', designation: 'Loader', joinedOn: '2026-01-15' };

describe('warehouse staff schemas', () => {
  it('BR-83a: createStaffBody accepts a valid body (phone optional, status defaults to ACTIVE) and rejects blank or over-long names, a bad phone, an impossible date and unknown fields', () => {
    const ok = createStaffBody.parse(validStaff);
    expect(ok.status).toBe('ACTIVE');
    expect(createStaffBody.safeParse({ ...validStaff, phone: '+919876543210' }).success).toBe(true);
    expect(createStaffBody.safeParse({ ...validStaff, phone: '9876543210' }).success).toBe(true);
    for (const bad of [
      { fullName: '   ' },
      { fullName: 'n'.repeat(121) },
      { designation: '' },
      { designation: 'd'.repeat(81) },
      { phone: '12345' },
      { phone: '98765-43210' },
      { phone: '+1234567890123456' },
      { joinedOn: '2026-02-30' },
      { joinedOn: '15-01-2026' },
      { status: 'DELETED' },
      { warehouseId: 'not-a-uuid' },
      { password: 'x' },
      { userId: newId() },
    ]) {
      expect(createStaffBody.safeParse({ ...validStaff, ...bad }).success, JSON.stringify(bad)).toBe(false);
    }
  });

  it('BR-83b: updateStaffBody needs at least one field, allows phone: null to clear it, and is strict', () => {
    expect(updateStaffBody.safeParse({}).success).toBe(false);
    expect(updateStaffBody.safeParse({ phone: null }).success).toBe(true);
    expect(updateStaffBody.safeParse({ status: 'INACTIVE', designation: 'Packer' }).success).toBe(true);
    expect(updateStaffBody.safeParse({ warehouseId: newId() }).success).toBe(false);
    expect(updateStaffBody.safeParse({ staffCode: 'STF-0001' }).success).toBe(false);
  });

  it('BR-84a: markAttendanceBody takes exactly PRESENT, ABSENT and LEAVE; times only for a PRESENT day; check-out needs a check-in and cannot precede it', () => {
    for (const status of ['PRESENT', 'ABSENT', 'LEAVE']) {
      expect(markAttendanceBody.safeParse({ status }).success, status).toBe(true);
    }
    for (const status of ['HALF_DAY', 'present', 'LATE', '']) {
      expect(markAttendanceBody.safeParse({ status }).success, status).toBe(false);
    }
    const inAt = '2026-03-10T09:02:00+05:30';
    const outAt = '2026-03-10T18:10:00+05:30';
    expect(markAttendanceBody.safeParse({ status: 'PRESENT', checkIn: inAt, checkOut: outAt, note: 'on time' }).success).toBe(true);
    expect(markAttendanceBody.safeParse({ status: 'PRESENT', checkIn: inAt, checkOut: inAt }).success).toBe(true);
    expect(markAttendanceBody.safeParse({ status: 'ABSENT', checkIn: inAt }).success).toBe(false);
    expect(markAttendanceBody.safeParse({ status: 'LEAVE', checkOut: outAt }).success).toBe(false);
    expect(markAttendanceBody.safeParse({ status: 'PRESENT', checkOut: outAt }).success).toBe(false);
    expect(markAttendanceBody.safeParse({ status: 'PRESENT', checkIn: outAt, checkOut: inAt }).success).toBe(false);
    expect(markAttendanceBody.safeParse({ status: 'PRESENT', checkIn: '09:02' }).success).toBe(false);
    expect(markAttendanceBody.safeParse({ status: 'PRESENT', note: 'n'.repeat(501) }).success).toBe(false);
    expect(markAttendanceBody.safeParse({ status: 'PRESENT', markedBy: newId() }).success).toBe(false);
  });

  it('BR-84a: bulkAttendanceBody needs 1 to 200 entries and rejects the same staff member twice', () => {
    const a = newId();
    const b = newId();
    expect(bulkAttendanceBody.safeParse({ entries: [] }).success).toBe(false);
    expect(bulkAttendanceBody.safeParse({ entries: [{ staffId: a, status: 'PRESENT' }, { staffId: b, status: 'LEAVE' }] }).success).toBe(true);
    expect(bulkAttendanceBody.safeParse({ entries: [{ staffId: a, status: 'PRESENT' }, { staffId: a, status: 'ABSENT' }] }).success).toBe(false);
    expect(bulkAttendanceBody.safeParse({ entries: Array.from({ length: 200 }, () => ({ staffId: newId(), status: 'PRESENT' })) }).success).toBe(true);
    expect(bulkAttendanceBody.safeParse({ entries: Array.from({ length: 201 }, () => ({ staffId: newId(), status: 'PRESENT' })) }).success).toBe(false);
    expect(bulkAttendanceBody.safeParse({ entries: [{ staffId: 'x', status: 'PRESENT' }] }).success).toBe(false);
  });

  it('BR-84b: the summary query takes a month XOR a from/to pair, with real dates and from <= to; the list query is strict', () => {
    expect(attendanceSummaryQuery.safeParse({ month: '2026-02' }).success).toBe(true);
    expect(attendanceSummaryQuery.safeParse({ from: '2026-02-01', to: '2026-02-28' }).success).toBe(true);
    for (const bad of [
      {},
      { month: '2026-13' },
      { month: '2026-1' },
      { month: '2026-02', from: '2026-02-01', to: '2026-02-28' },
      { from: '2026-02-01' },
      { to: '2026-02-28' },
      { from: '2026-02-30', to: '2026-03-01' },
      { from: '2026-03-02', to: '2026-03-01' },
    ]) {
      expect(attendanceSummaryQuery.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
    expect(listAttendanceQuery.safeParse({ from: '2026-03-02', to: '2026-03-01' }).success).toBe(false);
    expect(listAttendanceQuery.safeParse({ status: 'HALF_DAY' }).success).toBe(false);
    expect(listAttendanceQuery.safeParse({ limit: '101' }).success).toBe(false);
    expect(listAttendanceQuery.safeParse({ bogus: 'x' }).success).toBe(false);
    expect(listAttendanceQuery.parse({}).limit).toBe(20);
  });
});

// ===========================================================================
// 2. Service, against a real database (rolled back)
// ===========================================================================
class RollbackFixture extends Error {}

/** Resolves true when the module-14 tables exist; throws loudly when a configured database lacks them. */
const dbReady = (): Promise<boolean> => requireDatabaseTables('warehouse_staff', 'staff_attendance', 'staff_attendance_history');

/** An `it` that runs only against a migrated database and says so visibly when it cannot. */
function dbIt(name: string, fn: () => Promise<void>): void {
  it(name, async (ctx) => {
    if (!(await dbReady())) return ctx.skip();
    await fn();
  });
}

// 2026-03-10 20:00 UTC is 2026-03-11 01:30 in Asia/Kolkata: "today" for the service is the 11th.
const NOW = new Date('2026-03-10T20:00:00Z');
const TODAY = '2026-03-11';

interface World {
  tx: Executor;
  whA: string;
  whB: string;
  adminId: string;
  svc: ReturnType<typeof createWarehouseStaffService>;
  /** Scopes: a Sub admin of warehouse A / B, a Main admin (no warehouse), the Super Admin. */
  subA: (permission?: string) => ResolvedScope;
  subB: (permission?: string) => ResolvedScope;
  main: (permission?: string) => ResolvedScope;
  sa: (permission?: string) => ResolvedScope;
}

async function inRolledBackTx(fn: (world: World) => Promise<void>): Promise<void> {
  const { withTransaction } = await import('../../db/pool.js');
  await withTransaction(async (tx) => {
    const adminId = await insertUser(tx, 'ADMIN', 'CI staff admin');
    const warehouse = async (): Promise<string> => {
      const id = newId();
      await tx.query(`INSERT INTO warehouses (id, code, name) VALUES ($1, $2, 'Fixture Warehouse')`, [id, `WH-G6-${id.slice(0, 8)}`]);
      return id;
    };
    const [whA, whB] = [await warehouse(), await warehouse()];

    // The service's own transaction becomes a savepoint: a throw rolls back only that unit of work.
    let savepoints = 0;
    const runTx = async <T>(work: (executor: Executor) => Promise<T>): Promise<T> => {
      const name = `sp_${(savepoints += 1)}`;
      await tx.query(`SAVEPOINT ${name}`);
      try {
        const result = await work(tx);
        await tx.query(`RELEASE SAVEPOINT ${name}`);
        return result;
      } catch (error) {
        await tx.query(`ROLLBACK TO SAVEPOINT ${name}`);
        throw error;
      }
    };
    const svc = createWarehouseStaffService({ repo: warehouseStaffRepo, db: tx, runTx, now: () => NOW });
    const sub = (warehouseId: string, permission: string): ResolvedScope =>
      aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [warehouseId], permission, userId: adminId });

    await fn({
      tx,
      whA,
      whB,
      adminId,
      svc,
      subA: (permission = 'admin.staff.attendance.mark') => sub(whA, permission),
      subB: (permission = 'admin.staff.attendance.mark') => sub(whB, permission),
      main: (permission = 'admin.staff.manage') =>
        aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.MAIN_WH_ADMIN, permission, userId: adminId }),
      sa: (permission = 'admin.staff.manage') =>
        aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUPER_ADMIN, permission, userId: adminId }),
    });
    throw new RollbackFixture();
  }).catch((error: unknown) => {
    if (!(error instanceof RollbackFixture)) throw error;
  });
}

const addStaff = (w: World, warehouseId: string, fullName: string, extra: { phone?: string; designation?: string } = {}) =>
  w.svc.createStaff(w.main(), { fullName, designation: extra.designation ?? 'Loader', joinedOn: '2026-01-15', status: 'ACTIVE', warehouseId, ...(extra.phone === undefined ? {} : { phone: extra.phone }) });

const auditRows = async (tx: Executor, entityId: string) =>
  (
    await tx.query<{
      action_code: string;
      actor_id: string;
      actor_role: string;
      warehouse_id: string;
      before: Record<string, unknown> | null;
      after: Record<string, unknown> | null;
      changed_fields: string[] | null;
    }>(
      `SELECT action_code, actor_id, actor_role, warehouse_id, before, after, changed_fields
         FROM audit_log WHERE entity_id = $1 ORDER BY created_at, (before IS NOT NULL), action_code`,
      [entityId],
    )
  ).rows;

const count = async (tx: Executor, sql: string, params: unknown[] = []): Promise<number> =>
  Number((await tx.query<{ n: string }>(`SELECT count(*)::text AS n FROM (${sql}) q`, params)).rows[0]!.n);

async function rejects(promise: Promise<unknown>): Promise<AppError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    return error as AppError;
  }
  throw new Error('expected the call to be rejected, but it resolved');
}

describeIfDatabase('Warehouse staff and attendance service (PostgreSQL)', () => {
  // ---- BR-83 ---------------------------------------------------------------
  dbIt('BR-83c: creating staff returns a STF- code and ACTIVE status, makes NO user row, and writes one masked staff.create audit row naming actor, role and warehouse', async () => {
    await inRolledBackTx(async (w) => {
      const users = await count(w.tx, `SELECT 1 FROM users`);
      const staff = await addStaff(w, w.whA, 'Karthik Secret', { phone: '+919876543210', designation: 'Forklift Operator' });
      expect(staff).toMatchObject({ warehouseId: w.whA, fullName: 'Karthik Secret', designation: 'Forklift Operator', phone: '+919876543210', joinedOn: '2026-01-15', status: 'ACTIVE', updatedAt: null });
      expect(staff.staffCode).toMatch(/^STF-\d{4,}$/);
      // Floor staff are not users: no login, no password, no user row.
      expect(await count(w.tx, `SELECT 1 FROM users`)).toBe(users);

      const audits = await auditRows(w.tx, staff.id);
      expect(audits).toHaveLength(1);
      expect(audits[0]).toMatchObject({ action_code: 'staff.create', actor_id: w.adminId, actor_role: RoleCode.MAIN_WH_ADMIN, warehouse_id: w.whA, before: null });
      expect(audits[0]!.after).toEqual({ id: staff.id, staffCode: staff.staffCode, warehouseId: w.whA, status: 'ACTIVE' });
      const raw = JSON.stringify(audits);
      for (const secret of ['Karthik', 'Secret', '9876543210', 'Forklift']) expect(raw).not.toContain(secret);
    });
  });

  dbIt('BR-83d: an actor with no warehouse must name one (422), an unknown warehouse is 422, a confined actor naming another warehouse gets 404, and a confined actor defaults to its own', async () => {
    await inRolledBackTx(async (w) => {
      const noWarehouse = await rejects(w.svc.createStaff(w.main(), { ...validStaffInput(), }));
      expect(noWarehouse.code).toBe('VALIDATION_FAILED');
      const unknown = await rejects(w.svc.createStaff(w.main(), { ...validStaffInput(), warehouseId: newId() }));
      expect(unknown.code).toBe('VALIDATION_FAILED');
      const confinedMain = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.MAIN_WH_ADMIN, warehouseIds: [w.whA], permission: 'admin.staff.manage', userId: w.adminId });
      const other = await rejects(w.svc.createStaff(confinedMain, { ...validStaffInput(), warehouseId: w.whB }));
      expect(other.code).toBe('NOT_FOUND');
      const own = await w.svc.createStaff(confinedMain, validStaffInput());
      expect(own.warehouseId).toBe(w.whA);
      expect(await count(w.tx, `SELECT 1 FROM warehouse_staff WHERE warehouse_id = $1`, [w.whB])).toBe(0);
    });
  });

  dbIt('BR-83e: a Sub admin lists and reads only its own warehouse (another warehouse id is 404), Main and Super Admin see both, and the search escapes LIKE wildcards', async () => {
    await inRolledBackTx(async (w) => {
      const a1 = await addStaff(w, w.whA, 'Anil A');
      const b1 = await addStaff(w, w.whB, 'Bala B');
      await addStaff(w, w.whA, '100% Raju');
      const readA = w.subA('admin.staff.list_view');

      const subList = await w.svc.listStaff(readA, { limit: 50 });
      expect(subList.items.map((s) => s.warehouseId)).toEqual([w.whA, w.whA]);
      expect(subList.items.map((s) => s.id)).toContain(a1.id);
      expect(subList.items.map((s) => s.id)).not.toContain(b1.id);

      expect((await rejects(w.svc.getStaff(readA, b1.id))).code).toBe('NOT_FOUND');
      expect((await w.svc.getStaff(readA, a1.id)).id).toBe(a1.id);
      expect((await rejects(w.svc.listStaff(readA, { limit: 50, warehouseId: w.whB }))).code).toBe('NOT_FOUND');

      for (const scope of [w.main('admin.staff.list_view'), w.sa('admin.staff.list_view')]) {
        const inA = await w.svc.listStaff(scope, { limit: 100, warehouseId: w.whA });
        const inB = await w.svc.listStaff(scope, { limit: 100, warehouseId: w.whB });
        expect(inA.items.map((s) => s.id)).toContain(a1.id);
        expect(inB.items.map((s) => s.id)).toEqual([b1.id]);
        expect((await w.svc.getStaff(scope, b1.id)).warehouseId).toBe(w.whB);
      }

      // "%" is a literal: "100%" must not match every name.
      const pct = await w.svc.listStaff(w.main('admin.staff.list_view'), { limit: 50, warehouseId: w.whA, q: '100%' });
      expect(pct.items.map((s) => s.fullName)).toEqual(['100% Raju']);
      const byCode = await w.svc.listStaff(w.main('admin.staff.list_view'), { limit: 50, q: a1.staffCode.toLowerCase() });
      expect(byCode.items.map((s) => s.id)).toEqual([a1.id]);
    });
  });

  dbIt('BR-83f: the list pages in name order with a cursor, never repeating or skipping a row, and a forged cursor is 422', async () => {
    await inRolledBackTx(async (w) => {
      for (const name of ['Dev', 'Anil', 'Chandra', 'Bala', 'Esha']) await addStaff(w, w.whA, name);
      const scope = w.main('admin.staff.list_view');
      const seen: string[] = [];
      let cursor: string | undefined;
      let pages = 0;
      do {
        const page = await w.svc.listStaff(scope, { limit: 2, warehouseId: w.whA, ...(cursor === undefined ? {} : { cursor }) });
        seen.push(...page.items.map((s) => s.fullName));
        cursor = page.page.nextCursor ?? undefined;
        pages += 1;
      } while (cursor !== undefined);
      expect(seen).toEqual(['Anil', 'Bala', 'Chandra', 'Dev', 'Esha']);
      expect(pages).toBe(3);
      expect((await rejects(w.svc.listStaff(scope, { limit: 2, cursor: 'garbage' }))).code).toBe('VALIDATION_FAILED');
      const forged = Buffer.from(JSON.stringify(['x', 'not-a-uuid']), 'utf8').toString('base64url');
      expect((await rejects(w.svc.listStaff(scope, { limit: 2, cursor: forged }))).code).toBe('VALIDATION_FAILED');
    });
  });

  dbIt('BR-83g: update changes only the given fields (phone null clears), audits field NAMES only with masked images, and replaying the same PATCH writes nothing', async () => {
    await inRolledBackTx(async (w) => {
      const staff = await addStaff(w, w.whA, 'Meena Private', { phone: '+919811122233' });
      const updated = await w.svc.updateStaff(w.main(), staff.id, { designation: 'Packer', phone: '+919899988877' });
      expect(updated).toMatchObject({ designation: 'Packer', phone: '+919899988877', fullName: 'Meena Private', status: 'ACTIVE' });
      expect(updated.updatedAt).not.toBeNull();

      const [, update] = await auditRows(w.tx, staff.id);
      expect(update).toMatchObject({ action_code: 'staff.update', before: { status: 'ACTIVE' }, after: { status: 'ACTIVE' } });
      expect([...update!.changed_fields!].sort()).toEqual(['designation', 'phone']);
      const raw = JSON.stringify(await auditRows(w.tx, staff.id));
      for (const secret of ['Meena', 'Private', '9811122233', '9899988877', 'Packer']) expect(raw).not.toContain(secret);

      // Same PATCH again: no change, no new audit row.
      const replay = await w.svc.updateStaff(w.main(), staff.id, { designation: 'Packer', phone: '+919899988877' });
      expect(replay.updatedAt).toBe(updated.updatedAt);
      expect(await auditRows(w.tx, staff.id)).toHaveLength(2);

      const cleared = await w.svc.updateStaff(w.main(), staff.id, { phone: null });
      expect(cleared.phone).toBeNull();
      expect((await rejects(w.svc.updateStaff(w.main(), newId(), { designation: 'X' }))).code).toBe('NOT_FOUND');
      const confinedB = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.MAIN_WH_ADMIN, warehouseIds: [w.whB], permission: 'admin.staff.manage', userId: w.adminId });
      expect((await rejects(w.svc.updateStaff(confinedB, staff.id, { designation: 'X' }))).code).toBe('NOT_FOUND');
    });
  });

  dbIt('BR-83h: deactivating is soft and idempotent (one audit row), the row stays readable and listed as INACTIVE, other warehouses see 404, and a PATCH can reactivate it', async () => {
    await inRolledBackTx(async (w) => {
      const staff = await addStaff(w, w.whA, 'Ravi Leaving');
      const confinedB = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.MAIN_WH_ADMIN, warehouseIds: [w.whB], permission: 'admin.staff.manage', userId: w.adminId });
      expect((await rejects(w.svc.deactivateStaff(confinedB, staff.id))).code).toBe('NOT_FOUND');
      expect((await w.svc.getStaff(w.main('admin.staff.list_view'), staff.id)).status).toBe('ACTIVE');

      const off = await w.svc.deactivateStaff(w.main(), staff.id);
      expect(off.status).toBe('INACTIVE');
      const again = await w.svc.deactivateStaff(w.main(), staff.id);
      expect(again.status).toBe('INACTIVE');
      const audits = await auditRows(w.tx, staff.id);
      expect(audits.map((a) => a.action_code)).toEqual(['staff.create', 'staff.deactivate']);
      expect(audits[1]).toMatchObject({ before: { status: 'ACTIVE' }, after: { status: 'INACTIVE' }, changed_fields: ['status'] });
      expect(JSON.stringify(audits)).not.toContain('Ravi');

      const read = w.main('admin.staff.list_view');
      expect((await w.svc.getStaff(read, staff.id)).status).toBe('INACTIVE');
      const inactive = await w.svc.listStaff(read, { limit: 50, warehouseId: w.whA, status: 'INACTIVE' });
      expect(inactive.items.map((s) => s.id)).toEqual([staff.id]);
      expect((await w.svc.listStaff(read, { limit: 50, warehouseId: w.whA, status: 'ACTIVE' })).items).toEqual([]);

      const back = await w.svc.updateStaff(w.main(), staff.id, { status: 'ACTIVE' });
      expect(back.status).toBe('ACTIVE');
      expect((await w.svc.markAttendance(w.main('admin.staff.attendance.mark'), staff.id, TODAY, { status: 'PRESENT' })).created).toBe(true);
    });
  });

  dbIt('BR-83i: the database itself rejects a malformed phone, a blank name, an unknown status, an unknown warehouse and a duplicate staff code', async () => {
    await inRolledBackTx(async (w) => {
      const insert = (overrides: Record<string, unknown>) => {
        const row = { warehouse_id: w.whA, full_name: 'Direct', designation: 'Loader', phone: null, joined_on: '2026-01-01', status: 'ACTIVE', staff_code: `STF-X${newId().slice(0, 6)}`, ...overrides };
        return w.tx.query(
          `INSERT INTO warehouse_staff (warehouse_id, full_name, designation, phone, joined_on, status, staff_code) VALUES ($1,$2,$3,$4,$5::date,$6,$7)`,
          [row.warehouse_id, row.full_name, row.designation, row.phone, row.joined_on, row.status, row.staff_code],
        );
      };
      const refused = async (overrides: Record<string, unknown>): Promise<void> => {
        await w.tx.query('SAVEPOINT direct');
        await expect(insert(overrides)).rejects.toThrow();
        await w.tx.query('ROLLBACK TO SAVEPOINT direct');
      };
      await insert({});
      await refused({ phone: 'abc' });
      await refused({ phone: '12345' });
      await refused({ full_name: '  ' });
      await refused({ status: 'DELETED' });
      await refused({ warehouse_id: newId() });
      const existing = await addStaff(w, w.whA, 'Has Code');
      await refused({ staff_code: existing.staffCode });
    });
  });

  // ---- BR-84 ---------------------------------------------------------------
  dbIt('BR-84c: marking creates ONE row, a history CREATED row and one masked audit row; a re-mark updates that row in place (still one row), keeps both values in history and updates marked_by', async () => {
    await inRolledBackTx(async (w) => {
      const staff = await addStaff(w, w.whA, 'Priya Hidden');
      const other = await insertUser(w.tx, 'ADMIN', 'Second admin');
      const first = await w.svc.markAttendance(w.subA(), staff.id, '2026-03-09', { status: 'PRESENT', checkIn: '2026-03-09T09:02:00+05:30', note: 'secret note text' });
      expect(first.created).toBe(true);
      expect(first.attendance).toMatchObject({ staffId: staff.id, staffName: 'Priya Hidden', warehouseId: w.whA, workDate: '2026-03-09', status: 'PRESENT', checkIn: '2026-03-09T03:32:00.000Z', checkOut: null, note: 'secret note text', markedBy: w.adminId, updatedAt: null });

      const correction = await w.svc.markAttendance(
        { ...w.subA(), userId: other },
        staff.id,
        '2026-03-09',
        { status: 'ABSENT' },
      );
      expect(correction.created).toBe(false);
      expect(correction.attendance).toMatchObject({ id: first.attendance.id, status: 'ABSENT', checkIn: null, note: null, markedBy: other });
      expect(correction.attendance.updatedAt).not.toBeNull();
      expect(await count(w.tx, `SELECT 1 FROM staff_attendance WHERE staff_id = $1 AND work_date = '2026-03-09'`, [staff.id])).toBe(1);

      const history = (await w.svc.attendanceHistory(w.subA('admin.staff.attendance.view'), staff.id, '2026-03-09')).items;
      expect(history.map((h) => h.action)).toEqual(['CREATED', 'UPDATED']);
      expect(history[0]).toMatchObject({ fromStatus: null, toStatus: 'PRESENT', toCheckIn: '2026-03-09T03:32:00.000Z', toNote: 'secret note text', changedBy: w.adminId });
      expect(history[1]).toMatchObject({ fromStatus: 'PRESENT', fromCheckIn: '2026-03-09T03:32:00.000Z', fromNote: 'secret note text', toStatus: 'ABSENT', toCheckIn: null, toNote: null, changedBy: other });

      const audits = await auditRows(w.tx, first.attendance.id);
      expect(audits.map((a) => a.action_code)).toEqual(['staff.attendance.mark', 'staff.attendance.mark']);
      expect(audits[0]).toMatchObject({ actor_role: RoleCode.SUB_WH_ADMIN, warehouse_id: w.whA, before: null });
      expect(audits[0]!.after).toEqual({ id: first.attendance.id, staffId: staff.id, warehouseId: w.whA, workDate: '2026-03-09', status: 'PRESENT' });
      expect(audits[1]).toMatchObject({ before: { status: 'PRESENT' }, after: { status: 'ABSENT' } });
      expect([...audits[1]!.changed_fields!].sort()).toEqual(['checkIn', 'note', 'status']);
      const raw = JSON.stringify(audits);
      for (const secret of ['Priya', 'Hidden', 'secret note text']) expect(raw).not.toContain(secret);
    });
  });

  dbIt('BR-84d: replaying the same mark is safe: no update, no new history row, no new audit row, updated_at stays null', async () => {
    await inRolledBackTx(async (w) => {
      const staff = await addStaff(w, w.whA, 'Replay Person');
      const body = { status: 'PRESENT' as const, checkIn: '2026-03-09T09:00:00+05:30', checkOut: '2026-03-09T18:00:00+05:30' };
      const first = await w.svc.markAttendance(w.subA(), staff.id, '2026-03-09', body);
      const replay = await w.svc.markAttendance(w.subA(), staff.id, '2026-03-09', body);
      expect(replay.created).toBe(false);
      expect(replay.attendance).toEqual(first.attendance);
      expect(await count(w.tx, `SELECT 1 FROM staff_attendance_history WHERE attendance_id = $1`, [first.attendance.id])).toBe(1);
      expect(await auditRows(w.tx, first.attendance.id)).toHaveLength(1);
      // A different instant that is the same moment (UTC vs +05:30) is the same value.
      const sameMoment = await w.svc.markAttendance(w.subA(), staff.id, '2026-03-09', { ...body, checkIn: '2026-03-09T03:30:00Z' });
      expect(sameMoment.attendance.updatedAt).toBeNull();
      expect(await count(w.tx, `SELECT 1 FROM staff_attendance_history WHERE attendance_id = $1`, [first.attendance.id])).toBe(1);
    });
  });

  dbIt('BR-84e: the history table is append-only (UPDATE, DELETE and TRUNCATE are refused by the database), and a direct UPDATE of an attendance row still leaves a history row', async () => {
    await inRolledBackTx(async (w) => {
      const staff = await addStaff(w, w.whA, 'Ledger Person');
      const marked = await w.svc.markAttendance(w.subA(), staff.id, '2026-03-09', { status: 'PRESENT' });
      for (const sql of [
        `UPDATE staff_attendance_history SET to_status = 'ABSENT'`,
        `DELETE FROM staff_attendance_history`,
        `TRUNCATE staff_attendance_history`,
      ]) {
        await w.tx.query('SAVEPOINT append_only');
        await expect(w.tx.query(sql), sql).rejects.toThrow();
        await w.tx.query('ROLLBACK TO SAVEPOINT append_only');
      }
      // A hand-written fix cannot skip the trail either.
      await w.tx.query(`UPDATE staff_attendance SET status = 'LEAVE' WHERE id = $1`, [marked.attendance.id]);
      expect(await count(w.tx, `SELECT 1 FROM staff_attendance_history WHERE attendance_id = $1 AND to_status = 'LEAVE' AND from_status = 'PRESENT'`, [marked.attendance.id])).toBe(1);
    });
  });

  dbIt('BR-84f: a future day is 422 and writes nothing; "today" is the Asia/Kolkata date (01:30 on the 11th IST is still the 10th UTC)', async () => {
    await inRolledBackTx(async (w) => {
      const staff = await addStaff(w, w.whA, 'Clock Person');
      const err = await rejects(w.svc.markAttendance(w.subA(), staff.id, '2026-03-12', { status: 'PRESENT' }));
      expect(err.code).toBe('VALIDATION_FAILED');
      expect(await count(w.tx, `SELECT 1 FROM staff_attendance WHERE staff_id = $1`, [staff.id])).toBe(0);
      // Today in Kolkata is accepted although the UTC date is still the 10th.
      expect((await w.svc.markAttendance(w.subA(), staff.id, TODAY, { status: 'PRESENT' })).created).toBe(true);
      expect((await rejects(w.svc.markAttendanceBulk(w.subA(), '2026-03-12', { entries: [{ staffId: staff.id, status: 'LEAVE' }] }))).code).toBe('VALIDATION_FAILED');
      // A date no later than today in the past is fine.
      expect((await w.svc.markAttendance(w.subA(), staff.id, '2020-01-01', { status: 'LEAVE' })).created).toBe(true);
    });
  });

  dbIt('BR-84g: a deactivated staff member cannot be marked (409, nothing written); another warehouse\'s staff is 404 for a Sub admin and markable by Main', async () => {
    await inRolledBackTx(async (w) => {
      const mine = await addStaff(w, w.whA, 'Mine');
      const theirs = await addStaff(w, w.whB, 'Theirs');
      await w.svc.deactivateStaff(w.main(), mine.id);
      const inactive = await rejects(w.svc.markAttendance(w.subA(), mine.id, '2026-03-09', { status: 'PRESENT' }));
      expect(inactive.code).toBe('CONFLICT');
      expect(inactive.status).toBe(409);
      expect(await count(w.tx, `SELECT 1 FROM staff_attendance WHERE staff_id = $1`, [mine.id])).toBe(0);

      const cross = await rejects(w.svc.markAttendance(w.subA(), theirs.id, '2026-03-09', { status: 'PRESENT' }));
      expect(cross.code).toBe('NOT_FOUND');
      expect((await rejects(w.svc.markAttendance(w.subA(), newId(), '2026-03-09', { status: 'PRESENT' }))).code).toBe('NOT_FOUND');
      expect(await count(w.tx, `SELECT 1 FROM staff_attendance WHERE staff_id = $1`, [theirs.id])).toBe(0);
      expect((await w.svc.markAttendance(w.main('admin.staff.attendance.mark'), theirs.id, '2026-03-09', { status: 'ABSENT' })).attendance.warehouseId).toBe(w.whB);
      expect((await w.svc.markAttendance(w.sa('admin.staff.attendance.mark'), theirs.id, '2026-03-08', { status: 'LEAVE' })).created).toBe(true);
    });
  });

  dbIt('BR-84h: the summary arithmetic is exact: a month of marks gives the exact per-status counts, marked = sum, unmarked days are not counted, totals add up across staff', async () => {
    await inRolledBackTx(async (w) => {
      const a = await addStaff(w, w.whA, 'Alpha');
      const b = await addStaff(w, w.whA, 'Bravo');
      const idle = await addStaff(w, w.whA, 'Idle');
      const elsewhere = await addStaff(w, w.whB, 'Elsewhere');
      const day = (n: number): string => `2026-02-${String(n).padStart(2, '0')}`;
      const plan: Array<[string, number, 'PRESENT' | 'ABSENT' | 'LEAVE']> = [];
      for (let d = 1; d <= 17; d += 1) plan.push([a.id, d, 'PRESENT']);
      for (let d = 18; d <= 21; d += 1) plan.push([a.id, d, 'ABSENT']);
      for (let d = 22; d <= 24; d += 1) plan.push([a.id, d, 'LEAVE']);
      for (let d = 1; d <= 5; d += 1) plan.push([b.id, d, 'PRESENT']);
      plan.push([b.id, 6, 'LEAVE'], [b.id, 7, 'ABSENT']);
      plan.push([elsewhere.id, 3, 'PRESENT']);
      // 2026-01-31 and 2026-03-01 sit just outside February and must not be counted.
      plan.push([a.id, 0, 'PRESENT']);
      for (const [staffId, d, status] of plan) {
        const date = d === 0 ? '2026-01-31' : day(d);
        await w.svc.markAttendance(w.main('admin.staff.attendance.mark'), staffId, date, { status });
      }
      await w.svc.markAttendance(w.main('admin.staff.attendance.mark'), a.id, '2026-03-01', { status: 'ABSENT' });

      const view = w.subA('admin.staff.attendance.view');
      const month = await w.svc.attendanceSummary(view, { month: '2026-02' });
      expect(month.from).toBe('2026-02-01');
      expect(month.to).toBe('2026-02-28');
      const by = new Map(month.byStaff.map((s) => [s.staffId, s]));
      expect(by.get(a.id)).toMatchObject({ present: 17, absent: 4, leave: 3, marked: 24 });
      expect(by.get(b.id)).toMatchObject({ present: 5, absent: 1, leave: 1, marked: 7 });
      expect(by.get(idle.id)).toMatchObject({ present: 0, absent: 0, leave: 0, marked: 0 });
      expect(by.has(elsewhere.id)).toBe(false);
      expect(month.totals).toEqual({ present: 22, absent: 5, leave: 4, marked: 31 });
      expect(month.byStaff.map((s) => s.staffName)).toEqual(['Alpha', 'Bravo', 'Idle']);

      const one = await w.svc.attendanceSummary(view, { month: '2026-02', staffId: a.id });
      expect(one.byStaff).toHaveLength(1);
      expect(one.totals).toEqual({ present: 17, absent: 4, leave: 3, marked: 24 });
      const range = await w.svc.attendanceSummary(view, { from: '2026-01-31', to: '2026-03-01', staffId: a.id });
      expect(range.totals).toEqual({ present: 18, absent: 5, leave: 3, marked: 26 });
      const leap = await w.svc.attendanceSummary(w.main('admin.staff.attendance.view'), { month: '2028-02', warehouseId: w.whA });
      expect(leap.to).toBe('2028-02-29');
      // Main sees the other warehouse too.
      const mainB = await w.svc.attendanceSummary(w.main('admin.staff.attendance.view'), { month: '2026-02', warehouseId: w.whB });
      expect(mainB.totals).toEqual({ present: 1, absent: 0, leave: 0, marked: 1 });
      expect(mainB.byStaff.map((s) => s.staffId)).toEqual([elsewhere.id]);

      expect((await rejects(w.svc.attendanceSummary(view, { month: '2026-02', staffId: elsewhere.id }))).code).toBe('NOT_FOUND');
      expect((await rejects(w.svc.attendanceSummary(view, { month: '2026-02', warehouseId: w.whB }))).code).toBe('NOT_FOUND');
    });
  });

  dbIt('BR-84i: the summary and list ranges are capped by system_config staff_attendance_max_range_days (read from the database, not a literal)', async () => {
    await inRolledBackTx(async (w) => {
      const view = w.main('admin.staff.attendance.view');
      const defaults = await w.tx.query<{ value: number }>(`SELECT value FROM system_config WHERE key = 'staff_attendance_max_range_days'`);
      expect(defaults.rows[0]!.value).toBe(366);
      await w.tx.query(`UPDATE system_config SET value = '10'::jsonb WHERE key = 'staff_attendance_max_range_days'`);
      await w.svc.attendanceSummary(view, { from: '2026-02-01', to: '2026-02-11' });
      expect((await rejects(w.svc.attendanceSummary(view, { from: '2026-02-01', to: '2026-02-12' }))).code).toBe('VALIDATION_FAILED');
      await w.svc.listAttendance(view, { from: '2026-02-01', to: '2026-02-11', limit: 20 });
      expect((await rejects(w.svc.listAttendance(view, { from: '2026-02-01', to: '2026-02-12', limit: 20 }))).code).toBe('VALIDATION_FAILED');
      // A month is never subject to the cap.
      await w.svc.attendanceSummary(view, { month: '2026-01' });
    });
  });

  dbIt('BR-84j: a bulk mark is all-or-nothing: a deactivated or unknown staff member in the batch rolls every earlier entry back (rows, history and audit), and a good batch reports created, updated and unchanged', async () => {
    await inRolledBackTx(async (w) => {
      const s1 = await addStaff(w, w.whA, 'Bulk One');
      const s2 = await addStaff(w, w.whA, 'Bulk Two');
      const gone = await addStaff(w, w.whA, 'Bulk Gone');
      const s4 = await addStaff(w, w.whA, 'Bulk Four');
      await w.svc.deactivateStaff(w.main(), gone.id);

      const bad409 = await rejects(
        w.svc.markAttendanceBulk(w.subA(), '2026-03-09', { entries: [{ staffId: s1.id, status: 'PRESENT' }, { staffId: s2.id, status: 'ABSENT' }, { staffId: gone.id, status: 'PRESENT' }] }),
      );
      expect(bad409.code).toBe('CONFLICT');
      const bad404 = await rejects(
        w.svc.markAttendanceBulk(w.subA(), '2026-03-09', { entries: [{ staffId: s1.id, status: 'PRESENT' }, { staffId: newId(), status: 'PRESENT' }] }),
      );
      expect(bad404.code).toBe('NOT_FOUND');
      for (const table of ['staff_attendance', 'staff_attendance_history']) {
        expect(await count(w.tx, `SELECT 1 FROM ${table} WHERE staff_id = ANY($1::uuid[])`, [[s1.id, s2.id]]), table).toBe(0);
      }
      expect(await count(w.tx, `SELECT 1 FROM audit_log WHERE action_code = 'staff.attendance.mark' AND warehouse_id = $1`, [w.whA])).toBe(0);

      await w.svc.markAttendance(w.subA(), s4.id, '2026-03-09', { status: 'ABSENT' });
      const ok = await w.svc.markAttendanceBulk(w.subA(), '2026-03-09', {
        entries: [{ staffId: s1.id, status: 'PRESENT' }, { staffId: s2.id, status: 'LEAVE' }, { staffId: s4.id, status: 'PRESENT' }],
      });
      expect(ok).toMatchObject({ date: '2026-03-09', created: 2, updated: 1, unchanged: 0 });
      expect(ok.items.map((i) => i.status)).toEqual(['PRESENT', 'LEAVE', 'PRESENT']);
      const replay = await w.svc.markAttendanceBulk(w.subA(), '2026-03-09', {
        entries: [{ staffId: s1.id, status: 'PRESENT' }, { staffId: s2.id, status: 'LEAVE' }, { staffId: s4.id, status: 'PRESENT' }],
      });
      expect(replay).toMatchObject({ created: 0, updated: 0, unchanged: 3 });
      expect(await count(w.tx, `SELECT 1 FROM staff_attendance_history WHERE staff_id = ANY($1::uuid[])`, [[s1.id, s2.id, s4.id]])).toBe(4);
    });
  });

  dbIt('BR-84k: the roll call lists the active staff with their mark or null (not marked yet), counts every bucket, keeps a later-deactivated person on the days they have a record, and is confined to the Sub admin\'s warehouse', async () => {
    await inRolledBackTx(async (w) => {
      const p = await addStaff(w, w.whA, 'Roll Present');
      const a = await addStaff(w, w.whA, 'Roll Absent');
      const l = await addStaff(w, w.whA, 'Roll Leave');
      await addStaff(w, w.whA, 'Roll Unmarked');
      const left = await addStaff(w, w.whA, 'Roll Left');
      const leftNever = await addStaff(w, w.whA, 'Roll Never');
      const other = await addStaff(w, w.whB, 'Roll Other');
      const mark = (staffId: string, status: 'PRESENT' | 'ABSENT' | 'LEAVE') => w.svc.markAttendance(w.main('admin.staff.attendance.mark'), staffId, '2026-03-09', { status });
      await mark(p.id, 'PRESENT');
      await mark(a.id, 'ABSENT');
      await mark(l.id, 'LEAVE');
      await mark(left.id, 'PRESENT');
      await w.svc.deactivateStaff(w.main(), left.id);
      await w.svc.deactivateStaff(w.main(), leftNever.id);
      await mark(other.id, 'PRESENT');

      const view = w.subA('admin.staff.attendance.view');
      const roll = await w.svc.rollCall(view, { date: '2026-03-09' });
      expect(roll.date).toBe('2026-03-09');
      expect(roll.items.map((i) => i.staffName)).toEqual(['Roll Absent', 'Roll Leave', 'Roll Left', 'Roll Present', 'Roll Unmarked']);
      expect(roll.items.find((i) => i.staffName === 'Roll Unmarked')!.attendance).toBeNull();
      expect(roll.items.find((i) => i.staffName === 'Roll Present')!.attendance).toMatchObject({ status: 'PRESENT', checkIn: null });
      expect(roll.summary).toEqual({ present: 2, absent: 1, leave: 1, notMarked: 1, total: 5 });

      // The default date is today in Asia/Kolkata, and a day with no marks has everyone not marked.
      const today = await w.svc.rollCall(view, {});
      expect(today.date).toBe(TODAY);
      expect(today.summary).toEqual({ present: 0, absent: 0, leave: 0, notMarked: 4, total: 4 });
      expect((await rejects(w.svc.rollCall(view, { warehouseId: w.whB }))).code).toBe('NOT_FOUND');
      const main = await w.svc.rollCall(w.main('admin.staff.attendance.view'), { date: '2026-03-09', warehouseId: w.whB });
      expect(main.items.map((i) => i.staffName)).toEqual(['Roll Other']);
    });
  });

  dbIt('BR-84l: the attendance list filters by staff, status and date, counts EVERY matching row (not just the page), pages newest day first without repeats, and 404s on another warehouse\'s staff', async () => {
    await inRolledBackTx(async (w) => {
      const s = await addStaff(w, w.whA, 'List Person');
      const t = await addStaff(w, w.whA, 'List Other');
      const theirs = await addStaff(w, w.whB, 'List Elsewhere');
      for (let d = 1; d <= 5; d += 1) {
        await w.svc.markAttendance(w.main('admin.staff.attendance.mark'), s.id, `2026-03-0${d}`, { status: d <= 3 ? 'PRESENT' : 'ABSENT' });
      }
      await w.svc.markAttendance(w.main('admin.staff.attendance.mark'), t.id, '2026-03-03', { status: 'LEAVE' });
      const view = w.subA('admin.staff.attendance.view');

      const first = await w.svc.listAttendance(view, { staffId: s.id, limit: 2 });
      expect(first.items.map((i) => i.workDate)).toEqual(['2026-03-05', '2026-03-04']);
      expect(first.summary).toEqual({ present: 3, absent: 2, leave: 0, total: 5 });
      expect(first.page.hasMore).toBe(true);
      const dates = [...first.items.map((i) => i.workDate)];
      let cursor = first.page.nextCursor;
      while (cursor !== null) {
        const next = await w.svc.listAttendance(view, { staffId: s.id, limit: 2, cursor });
        dates.push(...next.items.map((i) => i.workDate));
        cursor = next.page.nextCursor;
      }
      expect(dates).toEqual(['2026-03-05', '2026-03-04', '2026-03-03', '2026-03-02', '2026-03-01']);

      const day = await w.svc.listAttendance(view, { from: '2026-03-03', to: '2026-03-03', limit: 20 });
      expect(day.items.map((i) => i.staffName).sort()).toEqual(['List Other', 'List Person']);
      expect(day.summary).toEqual({ present: 1, absent: 0, leave: 1, total: 2 });
      expect((await w.svc.listAttendance(view, { status: 'ABSENT', limit: 20 })).items.map((i) => i.workDate)).toEqual(['2026-03-05', '2026-03-04']);
      expect((await rejects(w.svc.listAttendance(view, { staffId: theirs.id, limit: 20 }))).code).toBe('NOT_FOUND');
      expect((await rejects(w.svc.listAttendance(view, { limit: 20, cursor: 'garbage' }))).code).toBe('VALIDATION_FAILED');
      expect((await rejects(w.svc.attendanceHistory(view, theirs.id, '2026-03-03'))).code).toBe('NOT_FOUND');
      expect((await rejects(w.svc.attendanceHistory(view, s.id, '2026-02-01'))).code).toBe('NOT_FOUND');
    });
  });

  dbIt('BR-84m: the database enforces the invariants too: one row per staff per day, times only for PRESENT, check-out after check-in, and an attendance warehouse that matches the staff member\'s', async () => {
    await inRolledBackTx(async (w) => {
      const staff = await addStaff(w, w.whA, 'Constraint Person');
      const insert = (overrides: Record<string, unknown>) => {
        const row = { staff_id: staff.id, warehouse_id: w.whA, work_date: '2026-03-01', status: 'PRESENT', check_in: null, check_out: null, ...overrides };
        return w.tx.query(
          `INSERT INTO staff_attendance (staff_id, warehouse_id, work_date, status, check_in, check_out, marked_by)
           VALUES ($1, $2, $3::date, $4, $5::timestamptz, $6::timestamptz, $7)`,
          [row.staff_id, row.warehouse_id, row.work_date, row.status, row.check_in, row.check_out, w.adminId],
        );
      };
      const refused = async (overrides: Record<string, unknown>): Promise<void> => {
        await w.tx.query('SAVEPOINT direct');
        await expect(insert(overrides), JSON.stringify(overrides)).rejects.toThrow();
        await w.tx.query('ROLLBACK TO SAVEPOINT direct');
      };
      await insert({});
      await refused({});
      await refused({ work_date: '2026-03-02', status: 'HALF_DAY' });
      await refused({ work_date: '2026-03-02', status: 'ABSENT', check_in: '2026-03-02T04:00:00Z' });
      await refused({ work_date: '2026-03-02', check_out: '2026-03-02T04:00:00Z' });
      await refused({ work_date: '2026-03-02', check_in: '2026-03-02T05:00:00Z', check_out: '2026-03-02T04:00:00Z' });
      await refused({ work_date: '2026-03-02', warehouse_id: w.whB });
    });
  });
});

function validStaffInput(): Parameters<ReturnType<typeof createWarehouseStaffService>['createStaff']>[1] {
  return { fullName: 'Input Person', designation: 'Loader', joinedOn: '2026-01-15', status: 'ACTIVE' };
}

// ===========================================================================
// 3. Real app router
// ===========================================================================
describeIfDatabase('Warehouse staff routes (real app router, PostgreSQL)', () => {
  let ready = false;
  /** Skips visibly (never silently passes) when no migrated database is configured. */
  const httpIt = (name: string, fn: () => Promise<void>): void => {
    it(name, async (ctx) => {
      if (!ready) return ctx.skip();
      await fn();
    });
  };
  let app: Express;
  let server: Server;
  const tokens: Record<string, string> = {};
  // A designation no other run uses, so this suite can find and remove exactly its own rows.
  const tag = `ci-g6-${Date.now()}`;
  let coonoorId = '';
  let kotagiriId = '';
  let coonoorStaff = '';
  let kotagiriStaff = '';
  const DAY = '2025-03-10';

  beforeAll(async () => {
    ready = await dbReady();
    if (!ready) return;
    const [{ createApp }, { signAccessToken }, { pool }] = await Promise.all([
      import('../../app.js'),
      import('../../auth/jwt.js'),
      import('../../db/pool.js'),
    ]);
    await ensureStandardUsers(pool, 'userSuperAdmin', 'userSubWhAdmin', 'userTohfaAdmin');
    app = createApp();
    server = app.listen(0);
    const wh = await pool.query<{ id: string; code: string }>(`SELECT id, code FROM warehouses WHERE code IN ('WH-COON', 'WH-KOTA')`);
    coonoorId = wh.rows.find((w) => w.code === 'WH-COON')!.id;
    kotagiriId = wh.rows.find((w) => w.code === 'WH-KOTA')!.id;

    const base = { farmerId: null, customerId: null };
    tokens['subCoonoor'] = signAccessToken({ sub: IDS.userSubWhAdmin, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: coonoorId }], ...base });
    tokens['subKotagiri'] = signAccessToken({ sub: IDS.userSubWhAdmin, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: kotagiriId }], ...base });
    tokens['main'] = signAccessToken({ sub: IDS.userSuperAdmin, roles: [{ code: RoleCode.MAIN_WH_ADMIN }], ...base });
    tokens['superAdmin'] = signAccessToken({ sub: IDS.userSuperAdmin, roles: [{ code: RoleCode.SUPER_ADMIN }], ...base });
    tokens['tohfaAdmin'] = signAccessToken({ sub: IDS.userTohfaAdmin, roles: [{ code: RoleCode.TOHFA_ADMIN }], ...base });
    tokens['farmer'] = signAccessToken({ sub: IDS.userSuperAdmin, roles: [{ code: RoleCode.FARMER }], farmerId: newId(), customerId: null });
    tokens['customer'] = signAccessToken({ sub: IDS.userSuperAdmin, roles: [{ code: RoleCode.CUSTOMER }], farmerId: null, customerId: newId() });
    tokens['farmerAdmin'] = signAccessToken({ sub: IDS.userSuperAdmin, roles: [{ code: RoleCode.FARMER_ADMIN, zoneId: newId() }], ...base });

    const create = async (warehouseId: string, name: string): Promise<string> => {
      const res = await request(server).post('/v1/admin/warehouse-staff').set('Authorization', auth('main')).send({ warehouseId, fullName: name, designation: tag, joinedOn: '2026-01-15' });
      expect(res.status, JSON.stringify(res.body)).toBe(201);
      return res.body.id as string;
    };
    coonoorStaff = await create(coonoorId, `${tag} Coonoor`);
    kotagiriStaff = await create(kotagiriId, `${tag} Kotagiri`);
  });

  afterAll(async () => {
    if (!ready) return;
    const [{ withTransaction, closePool }, { closeRedis }] = await Promise.all([import('../../db/pool.js'), import('../../redis.js')]);
    // The append-only history cannot be deleted through the app role; replica mode lets this CI-only
    // cleanup (superuser test database) remove exactly the rows of this run. Audit rows stay.
    await withTransaction(async (tx) => {
      await tx.query(`SET LOCAL session_replication_role = replica`);
      await tx.query(`DELETE FROM staff_attendance_history WHERE staff_id IN (SELECT id FROM warehouse_staff WHERE designation LIKE $1)`, [`${tag}%`]);
      await tx.query(`DELETE FROM staff_attendance WHERE staff_id IN (SELECT id FROM warehouse_staff WHERE designation LIKE $1)`, [`${tag}%`]);
      await tx.query(`DELETE FROM warehouse_staff WHERE designation LIKE $1`, [`${tag}%`]);
    });
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await Promise.allSettled([closePool(), closeRedis()]);
  });

  const auth = (name: string): string => `Bearer ${tokens[name]!}`;
  const NIL = '99999999-9999-4999-8999-999999999999';
  const markUrl = (staffId: string, date = DAY): string => `/v1/admin/staff-attendance/staff/${staffId}/${date}`;

  type Call = { method: 'get' | 'post' | 'patch' | 'put'; path: () => string; body?: () => object };
  const STAFF_READS: Call[] = [
    { method: 'get', path: () => '/v1/admin/warehouse-staff' },
    { method: 'get', path: () => `/v1/admin/warehouse-staff/${coonoorStaff}` },
  ];
  const STAFF_WRITES: Call[] = [
    { method: 'post', path: () => '/v1/admin/warehouse-staff', body: () => ({ warehouseId: coonoorId, fullName: `${tag} X`, designation: tag, joinedOn: '2026-01-15' }) },
    { method: 'patch', path: () => `/v1/admin/warehouse-staff/${coonoorStaff}`, body: () => ({ designation: tag }) },
    { method: 'post', path: () => `/v1/admin/warehouse-staff/${coonoorStaff}/deactivate` },
  ];
  const ATTENDANCE_READS: Call[] = [
    { method: 'get', path: () => `/v1/admin/staff-attendance/roll-call?date=${DAY}` },
    { method: 'get', path: () => '/v1/admin/staff-attendance?limit=5' },
    { method: 'get', path: () => `/v1/admin/staff-attendance/summary?month=2025-03&staffId=${coonoorStaff}` },
    { method: 'get', path: () => `/v1/admin/staff-attendance/staff/${coonoorStaff}/2025-03-09/history` },
  ];
  const ATTENDANCE_MARKS: Call[] = [
    { method: 'put', path: () => markUrl(coonoorStaff, '2025-03-09'), body: () => ({ status: 'PRESENT' }) },
    { method: 'put', path: () => '/v1/admin/staff-attendance/dates/2025-03-09', body: () => ({ entries: [{ staffId: coonoorStaff, status: 'PRESENT' }] }) },
  ];

  const send = (call: Call, token: string | undefined) => {
    const req = request(server)[call.method](call.path());
    if (token !== undefined) req.set('Authorization', auth(token));
    return call.body === undefined ? req : req.send(call.body());
  };

  httpIt('BR-83j: every route is 401 without a token and 403 for FARMER, CUSTOMER and FARMER_ADMIN, with problem+json', async () => {
    for (const call of [...STAFF_READS, ...STAFF_WRITES, ...ATTENDANCE_READS, ...ATTENDANCE_MARKS]) {
      const anonymous = await send(call, undefined);
      expect(anonymous.status, `${call.method} ${call.path()} anonymous`).toBe(401);
      for (const role of ['farmer', 'customer', 'farmerAdmin']) {
        const res = await send(call, role);
        expect(res.status, `${call.method} ${call.path()} as ${role}: ${JSON.stringify(res.body)}`).toBe(403);
        expect(res.headers['content-type']).toContain('application/problem+json');
      }
    }
  });

  httpIt('BR-83k: the role matrix holds through the real router: Sub is 403 on every roster route (admin.staff.list_view and admin.staff.manage are none for Sub) but may read and mark attendance; Tohfa Admin reads but cannot mark; Main and Super Admin may do everything', async () => {
    for (const call of [...STAFF_READS, ...STAFF_WRITES]) {
      for (const role of ['subCoonoor', 'subKotagiri']) {
        const res = await send(call, role);
        expect(res.status, `${call.method} ${call.path()} as ${role}`).toBe(403);
      }
    }
    // Marks first, so the history route below has a record to read.
    for (const call of ATTENDANCE_MARKS) {
      for (const role of ['subCoonoor', 'main', 'superAdmin']) {
        const res = await send(call, role);
        expect([200, 201], `${call.method} ${call.path()} as ${role}: ${JSON.stringify(res.body)}`).toContain(res.status);
      }
      const ta = await send(call, 'tohfaAdmin');
      expect(ta.status, `${call.method} ${call.path()} as tohfaAdmin`).toBe(403);
    }
    for (const call of ATTENDANCE_READS) {
      for (const role of ['subCoonoor', 'main', 'superAdmin', 'tohfaAdmin']) {
        const res = await send(call, role);
        expect(res.status, `${call.method} ${call.path()} as ${role}: ${JSON.stringify(res.body)}`).toBe(200);
      }
    }
    for (const call of [...STAFF_READS, STAFF_WRITES[1]!]) {
      for (const role of ['main', 'superAdmin', 'tohfaAdmin']) {
        const res = await send(call, role);
        expect(res.status, `${call.method} ${call.path()} as ${role}: ${JSON.stringify(res.body)}`).toBe(200);
      }
    }
  });

  httpIt('BR-83l: staff lifecycle over HTTP: create 201 with a code and ACTIVE, get, list with filters, patch, deactivate (idempotent), and bad input is 422 with nothing written', async () => {
    const created = await request(server).post('/v1/admin/warehouse-staff').set('Authorization', auth('superAdmin')).send({ warehouseId: kotagiriId, fullName: `${tag} Life`, designation: tag, phone: '+919800011122', joinedOn: '2026-02-01' });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    expect(created.body).toMatchObject({ warehouseId: kotagiriId, fullName: `${tag} Life`, phone: '+919800011122', joinedOn: '2026-02-01', status: 'ACTIVE' });
    expect(created.body.staffCode).toMatch(/^STF-\d{4,}$/);
    const id = created.body.id as string;

    const got = await request(server).get(`/v1/admin/warehouse-staff/${id}`).set('Authorization', auth('main'));
    expect(got.status).toBe(200);
    expect(got.body.id).toBe(id);
    const listed = await request(server).get('/v1/admin/warehouse-staff').query({ warehouseId: kotagiriId, q: `${tag} Life` }).set('Authorization', auth('main'));
    expect(listed.status).toBe(200);
    expect(listed.body.items.map((s: { id: string }) => s.id)).toEqual([id]);
    expect(listed.body.page).toEqual({ nextCursor: null, hasMore: false });

    const patched = await request(server).patch(`/v1/admin/warehouse-staff/${id}`).set('Authorization', auth('main')).send({ designation: `${tag} Lead`, phone: null });
    expect(patched.status).toBe(200);
    expect(patched.body).toMatchObject({ designation: `${tag} Lead`, phone: null });
    const off = await request(server).post(`/v1/admin/warehouse-staff/${id}/deactivate`).set('Authorization', auth('main'));
    expect(off.status).toBe(200);
    expect(off.body.status).toBe('INACTIVE');
    expect((await request(server).post(`/v1/admin/warehouse-staff/${id}/deactivate`).set('Authorization', auth('main'))).status).toBe(200);
    const marked = await request(server).put(markUrl(id)).set('Authorization', auth('main')).send({ status: 'PRESENT' });
    expect(marked.status).toBe(409);
    expect(marked.body.code).toBe('CONFLICT');

    const { pool } = await import('../../db/pool.js');
    const before = await pool.query(`SELECT 1 FROM warehouse_staff WHERE designation LIKE $1`, [`${tag}%`]);
    for (const bad of [{ fullName: '' }, { phone: '12' }, { joinedOn: '2026-02-30' }, { status: 'GONE' }, { password: 'x' }, { warehouseId: undefined }]) {
      const res = await request(server).post('/v1/admin/warehouse-staff').set('Authorization', auth('main')).send({ warehouseId: kotagiriId, fullName: `${tag} Bad`, designation: tag, joinedOn: '2026-02-01', ...bad });
      expect(res.status, JSON.stringify(bad)).toBe(422);
    }
    expect((await request(server).patch(`/v1/admin/warehouse-staff/${id}`).set('Authorization', auth('main')).send({})).status).toBe(422);
    expect((await request(server).get('/v1/admin/warehouse-staff/not-a-uuid').set('Authorization', auth('main'))).status).toBe(422);
    expect((await request(server).get(`/v1/admin/warehouse-staff/${NIL}`).set('Authorization', auth('main'))).status).toBe(404);
    expect((await request(server).patch(`/v1/admin/warehouse-staff/${NIL}`).set('Authorization', auth('main')).send({ designation: tag })).status).toBe(404);
    const after = await pool.query(`SELECT 1 FROM warehouse_staff WHERE designation LIKE $1`, [`${tag}%`]);
    expect(after.rowCount).toBe(before.rowCount);
  });

  httpIt('BR-84n: a Sub admin marks its own warehouse (201, then 200 on replay and on correction), and another warehouse\'s staff is 404 on mark, bulk, history and the warehouse/staff filters, while Main reaches both', async () => {
    const created = await request(server).put(markUrl(coonoorStaff)).set('Authorization', auth('subCoonoor')).send({ status: 'PRESENT', checkIn: '2025-03-10T09:02:00+05:30', checkOut: '2025-03-10T18:10:00+05:30', note: 'ok' });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    expect(created.body).toMatchObject({ staffId: coonoorStaff, warehouseId: coonoorId, workDate: DAY, status: 'PRESENT', checkIn: '2025-03-10T03:32:00.000Z', checkOut: '2025-03-10T12:40:00.000Z', note: 'ok' });
    const replay = await request(server).put(markUrl(coonoorStaff)).set('Authorization', auth('subCoonoor')).send({ status: 'PRESENT', checkIn: '2025-03-10T09:02:00+05:30', checkOut: '2025-03-10T18:10:00+05:30', note: 'ok' });
    expect(replay.status).toBe(200);
    expect(replay.body.id).toBe(created.body.id);
    const fix = await request(server).put(markUrl(coonoorStaff)).set('Authorization', auth('subCoonoor')).send({ status: 'LEAVE' });
    expect(fix.status).toBe(200);
    expect(fix.body).toMatchObject({ id: created.body.id, status: 'LEAVE', checkIn: null, note: null });
    const history = await request(server).get(`${markUrl(coonoorStaff)}/history`).set('Authorization', auth('subCoonoor'));
    expect(history.status).toBe(200);
    expect(history.body.items.map((h: { action: string; toStatus: string }) => `${h.action}:${h.toStatus}`)).toEqual(['CREATED:PRESENT', 'UPDATED:LEAVE']);

    for (const other of [
      request(server).put(markUrl(kotagiriStaff)).set('Authorization', auth('subCoonoor')).send({ status: 'PRESENT' }),
      request(server).put('/v1/admin/staff-attendance/dates/2025-03-10').set('Authorization', auth('subCoonoor')).send({ entries: [{ staffId: coonoorStaff, status: 'PRESENT' }, { staffId: kotagiriStaff, status: 'PRESENT' }] }),
      request(server).get(`${markUrl(kotagiriStaff)}/history`).set('Authorization', auth('subCoonoor')),
      request(server).get('/v1/admin/staff-attendance/roll-call').query({ warehouseId: kotagiriId }).set('Authorization', auth('subCoonoor')),
      request(server).get('/v1/admin/staff-attendance').query({ staffId: kotagiriStaff }).set('Authorization', auth('subCoonoor')),
      request(server).get('/v1/admin/staff-attendance').query({ warehouseId: kotagiriId }).set('Authorization', auth('subCoonoor')),
      request(server).get('/v1/admin/staff-attendance/summary').query({ month: '2025-03', staffId: kotagiriStaff }).set('Authorization', auth('subCoonoor')),
    ]) {
      const res = await other;
      expect(res.status, JSON.stringify(res.body)).toBe(404);
    }
    // The bulk request that named the other warehouse's staff changed nothing for the first entry either.
    const bulkAfter = await request(server).get('/v1/admin/staff-attendance').query({ staffId: coonoorStaff, from: DAY, to: DAY }).set('Authorization', auth('subCoonoor'));
    expect(bulkAfter.body.items.map((i: { status: string }) => i.status)).toEqual(['LEAVE']);

    const mainBoth = await request(server).put(markUrl(kotagiriStaff)).set('Authorization', auth('main')).send({ status: 'ABSENT' });
    expect(mainBoth.status).toBe(201);
    const subKotagiriSees = await request(server).get('/v1/admin/staff-attendance').query({ staffId: kotagiriStaff }).set('Authorization', auth('subKotagiri'));
    expect(subKotagiriSees.body.items.map((i: { workDate: string }) => i.workDate)).toEqual([DAY]);
  });

  httpIt('BR-84o: bad attendance input is 422 and writes nothing: HALF_DAY, times on an absent day, a future date, an impossible date, a duplicate in a bulk request, and an invalid cursor or range', async () => {
    const { pool } = await import('../../db/pool.js');
    const rows = async (): Promise<number> => (await pool.query(`SELECT 1 FROM staff_attendance WHERE staff_id = $1`, [coonoorStaff])).rowCount ?? -1;
    const before = await rows();
    const put = (date: string, body: object) => request(server).put(markUrl(coonoorStaff, date)).set('Authorization', auth('subCoonoor')).send(body);
    expect((await put('2025-03-08', { status: 'HALF_DAY' })).status).toBe(422);
    expect((await put('2025-03-08', { status: 'ABSENT', checkIn: '2025-03-08T09:00:00+05:30' })).status).toBe(422);
    expect((await put('2099-01-01', { status: 'PRESENT' })).status).toBe(422);
    expect((await put('2025-02-30', { status: 'PRESENT' })).status).toBe(422);
    expect((await put('2025-03-08', { status: 'PRESENT', staffId: coonoorStaff })).status).toBe(422);
    const bulk = (date: string, entries: object[]) => request(server).put(`/v1/admin/staff-attendance/dates/${date}`).set('Authorization', auth('subCoonoor')).send({ entries });
    expect((await bulk('2025-03-08', [{ staffId: coonoorStaff, status: 'PRESENT' }, { staffId: coonoorStaff, status: 'ABSENT' }])).status).toBe(422);
    expect((await bulk('2099-01-01', [{ staffId: coonoorStaff, status: 'PRESENT' }])).status).toBe(422);
    expect((await bulk('2025-03-08', [])).status).toBe(422);
    expect(await rows()).toBe(before);
    const get = (path: string) => request(server).get(path).set('Authorization', auth('subCoonoor'));
    expect((await get('/v1/admin/staff-attendance?cursor=garbage')).status).toBe(422);
    expect((await get('/v1/admin/staff-attendance?from=2025-03-02&to=2025-03-01')).status).toBe(422);
    expect((await get('/v1/admin/staff-attendance/summary')).status).toBe(422);
    expect((await get('/v1/admin/staff-attendance/summary?month=2025-13')).status).toBe(422);
    expect((await get('/v1/admin/staff-attendance/roll-call?date=2025-02-30')).status).toBe(422);
    expect((await get('/v1/admin/staff-attendance?from=2000-01-01&to=2025-03-01')).status).toBe(422);
  });

  httpIt('BR-84p: bulk, roll call, summary and list answer with their documented shapes for the Sub admin, and a bulk request is applied entirely or not at all', async () => {
    const make = async (warehouseId: string, name: string): Promise<string> => {
      const res = await request(server).post('/v1/admin/warehouse-staff').set('Authorization', auth('main')).send({ warehouseId, fullName: `${tag} ${name}`, designation: tag, joinedOn: '2026-01-15' });
      expect(res.status, JSON.stringify(res.body)).toBe(201);
      return res.body.id as string;
    };
    const mine = await make(coonoorId, 'Shape Coonoor');
    const theirs = await make(kotagiriId, 'Shape Kotagiri');
    const day = '2025-04-04';
    const entries = [{ staffId: mine, status: 'PRESENT', checkIn: '2025-04-04T09:00:00+05:30' }, { staffId: theirs, status: 'LEAVE' }];

    const bulk = await request(server).put(`/v1/admin/staff-attendance/dates/${day}`).set('Authorization', auth('main')).send({ entries });
    expect(bulk.status, JSON.stringify(bulk.body)).toBe(200);
    expect(bulk.body).toMatchObject({ date: day, created: 2, updated: 0, unchanged: 0 });
    expect(bulk.body.items.map((i: { staffId: string }) => i.staffId)).toEqual([mine, theirs]);
    const replay = await request(server).put(`/v1/admin/staff-attendance/dates/${day}`).set('Authorization', auth('main')).send({ entries });
    expect(replay.body).toMatchObject({ created: 0, updated: 0, unchanged: 2 });

    const roll = await request(server).get('/v1/admin/staff-attendance/roll-call').query({ date: day }).set('Authorization', auth('subCoonoor'));
    expect(roll.status).toBe(200);
    expect(roll.body.date).toBe(day);
    const row = roll.body.items.find((i: { staffId: string }) => i.staffId === mine);
    expect(row).toMatchObject({ staffName: `${tag} Shape Coonoor`, designation: tag, warehouseId: coonoorId, staffStatus: 'ACTIVE' });
    expect(row.attendance).toMatchObject({ status: 'PRESENT', checkIn: '2025-04-04T03:30:00.000Z' });
    expect(roll.body.items.some((i: { staffId: string }) => i.staffId === theirs)).toBe(false);
    expect(roll.body.items.every((i: { warehouseId: string }) => i.warehouseId === coonoorId)).toBe(true);
    const s = roll.body.summary;
    expect(s.present + s.absent + s.leave + s.notMarked).toBe(s.total);
    expect(s.total).toBe(roll.body.items.length);

    // Exact month arithmetic for this staff member: PRESENT, ABSENT, LEAVE and the bulk PRESENT above.
    for (const [date, status] of [['2025-04-01', 'PRESENT'], ['2025-04-02', 'ABSENT'], ['2025-04-03', 'LEAVE']]) {
      expect((await request(server).put(markUrl(mine, date!)).set('Authorization', auth('subCoonoor')).send({ status })).status).toBe(201);
    }
    const summary = await request(server).get('/v1/admin/staff-attendance/summary').query({ month: '2025-04', staffId: mine }).set('Authorization', auth('subCoonoor'));
    expect(summary.status).toBe(200);
    expect(summary.body).toMatchObject({ from: '2025-04-01', to: '2025-04-30', totals: { present: 2, absent: 1, leave: 1, marked: 4 } });
    expect(summary.body.byStaff).toHaveLength(1);
    expect(summary.body.byStaff[0]).toMatchObject({ staffId: mine, present: 2, absent: 1, leave: 1, marked: 4 });

    const list = await request(server).get('/v1/admin/staff-attendance').query({ staffId: mine, limit: 3 }).set('Authorization', auth('subCoonoor'));
    expect(list.status).toBe(200);
    expect(list.body.items.map((i: { workDate: string }) => i.workDate)).toEqual(['2025-04-04', '2025-04-03', '2025-04-02']);
    expect(list.body.summary).toEqual({ present: 2, absent: 1, leave: 1, total: 4 });
    expect(list.body.page.hasMore).toBe(true);

    // One bad entry (an unknown staff id) sinks the whole request: the valid first entry changes nothing.
    const sunk = await request(server).put(`/v1/admin/staff-attendance/dates/${day}`).set('Authorization', auth('main')).send({ entries: [{ staffId: mine, status: 'ABSENT' }, { staffId: NIL, status: 'PRESENT' }] });
    expect(sunk.status).toBe(404);
    const unchanged = await request(server).get('/v1/admin/staff-attendance').query({ staffId: mine, from: day, to: day }).set('Authorization', auth('main'));
    expect(unchanged.body.items.map((i: { status: string }) => i.status)).toEqual(['PRESENT']);
  });

  httpIt('BR-83m: the audit rows of the HTTP writes carry ids and statuses only: no name, phone, designation or note anywhere in audit_log for this run\'s staff', async () => {
    const { pool } = await import('../../db/pool.js');
    const audit = await pool.query<{ n: string; leaked: string }>(
      `SELECT count(*)::text AS n,
              count(*) FILTER (WHERE (coalesce(before::text, '') || coalesce(after::text, '')) ~* '(ci-g6|9800011122|"ok")')::text AS leaked
         FROM audit_log
        WHERE entity_id = ANY($1::uuid[])
           OR entity_id IN (SELECT id FROM staff_attendance WHERE staff_id = ANY($1::uuid[]))`,
      [[coonoorStaff, kotagiriStaff]],
    );
    expect(Number(audit.rows[0]!.n)).toBeGreaterThanOrEqual(4);
    expect(audit.rows[0]!.leaked).toBe('0');
  });
});
