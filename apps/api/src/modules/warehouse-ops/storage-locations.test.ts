/**
 * BR-79: storage locations of a warehouse.
 *
 *  a  reads are warehouse-scoped: a Sub admin sees its own warehouse's locations, any other or unknown
 *     warehouse id is the same 404 (never 403, never an empty list that confirms the id exists)
 *  b  creating: Super/Tohfa/Main only (a Sub admin is 403 by the permission), a code is unique per
 *     warehouse case-insensitively, the body is validated and strict
 *  c  updating and (de)activating: the code is immutable, nothing is ever deleted
 *  d  every change writes ONE audit row in the same transaction with a masked image
 *  e  it never touches inventory_batches, stock_ledger or any other warehouse's rows
 *  f  the service itself refuses a scope that does not cover the warehouse (guard for the day the
 *     Sub grant is flipped to `own`)
 *
 * Layers: schema tests (no I/O), service tests against real Postgres in a rolled-back transaction
 * (EVERY repo query runs), and real-HTTP tests through the real app router.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { aScope, describeIfDatabase, newId } from '../../test/factories.js';
import { requireDatabaseTables } from '../../test/dbFixtures.js';
import {
  createStorageLocationBody,
  listStorageLocationsQuery,
  updateStorageLocationBody,
} from './storage-locations.schema.js';
import { createStorageLocationsService } from './storage-locations.service.js';
import { storageLocationsRepo } from './storage-locations.repo.js';
import {
  inRolledBackTx,
  loadWarehouseIds,
  startHttpHarness,
  type HttpHarness,
  type WarehouseIds,
} from './testkit.js';

const goodBody = { code: 'CS-A01', name: 'Cold Storage A', locationType: 'Cold Storage', capacityKg: '2000' };

// ===========================================================================
// 1. Schemas
// ===========================================================================
describe('storage location schemas', () => {
  it('BR-79b: the create body needs a code and a name, trims them, and is strict', () => {
    expect(createStorageLocationBody.parse({ code: '  cs-a01 ', name: ' Cold A ' })).toEqual({ code: 'cs-a01', name: 'Cold A' });
    for (const bad of [
      {},
      { code: '', name: 'x' },
      { code: '   ', name: 'x' },
      { code: 'c', name: '' },
      { code: 'c'.repeat(41), name: 'x' },
      { code: 'c', name: 'n'.repeat(121) },
      { code: 'c', name: 'x', locationType: '' },
      { code: 'c', name: 'x', locationType: 't'.repeat(41) },
      { code: 'c', name: 'x', warehouseId: newId() },
      { code: 'c', name: 'x', isActive: false },
    ]) {
      expect(createStorageLocationBody.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
    expect(createStorageLocationBody.safeParse({ code: 'c'.repeat(40), name: 'n'.repeat(120), locationType: 't'.repeat(40) }).success).toBe(true);
  });

  it('BR-79b: capacityKg is a positive decimal string with at most 9 integer digits and 3 decimals, or null; never a number', () => {
    for (const capacityKg of ['1', '0.001', '2000', '2000.5', '999999999.999', null]) {
      expect(createStorageLocationBody.safeParse({ ...goodBody, capacityKg }).success, String(capacityKg)).toBe(true);
    }
    for (const capacityKg of ['0', '0.000', '-1', '1e3', '1.0001', '1000000000', ' 5', '', 'abc', 2000, 12.5]) {
      expect(createStorageLocationBody.safeParse({ ...goodBody, capacityKg }).success, String(capacityKg)).toBe(false);
    }
  });

  it('BR-79c: the update body needs at least one field, never accepts the code or the warehouse, and allows null to clear', () => {
    expect(updateStorageLocationBody.safeParse({}).success).toBe(false);
    expect(updateStorageLocationBody.safeParse({ code: 'NEW' }).success).toBe(false);
    expect(updateStorageLocationBody.safeParse({ warehouseId: newId() }).success).toBe(false);
    expect(updateStorageLocationBody.safeParse({ name: '' }).success).toBe(false);
    expect(updateStorageLocationBody.safeParse({ isActive: 'false' }).success).toBe(false);
    expect(updateStorageLocationBody.safeParse({ locationType: null, capacityKg: null }).success).toBe(true);
    expect(updateStorageLocationBody.safeParse({ isActive: false }).success).toBe(true);
  });

  it('BR-79a: the list query is strict, pages at most 100 and filters by isActive', () => {
    expect(listStorageLocationsQuery.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(listStorageLocationsQuery.parse({ isActive: 'false' }).isActive).toBe(false);
    expect(listStorageLocationsQuery.safeParse({ pageSize: '101' }).success).toBe(false);
    expect(listStorageLocationsQuery.safeParse({ isActive: 'yes' }).success).toBe(false);
    expect(listStorageLocationsQuery.safeParse({ warehouseId: newId() }).success).toBe(false);
  });
});

// ===========================================================================
// 2. Service against real Postgres, in a rolled-back transaction
// ===========================================================================
describeIfDatabase('storage locations service (PostgreSQL)', () => {
  let ready = false;
  let wh: WarehouseIds;

  beforeAll(async () => {
    ready = await requireDatabaseTables('storage_locations', 'warehouses');
    if (ready) {
      const { pool } = await import('../../db/pool.js');
      wh = await loadWarehouseIds(pool);
    }
  });

  const manage = (userId: string) =>
    aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, permission: 'warehouse.storage_location.manage', userId });
  const subView = (userId: string, warehouseId: string) =>
    aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [warehouseId], permission: 'inventory.batch.view', userId });

  async function actor(tx: Executor): Promise<string> {
    const user = await tx.query<{ id: string }>(
      `INSERT INTO users (mobile, full_name, user_type, status) VALUES ($1, 'CI storage admin', 'ADMIN', 'ACTIVE') RETURNING id`,
      [`+9197${String(Date.now()).slice(-8)}`],
    );
    return user.rows[0]!.id;
  }
  const service = (tx: Executor) => createStorageLocationsService({ repo: storageLocationsRepo, db: tx, runTx: async (fn) => fn(tx) });

  /** Skips visibly (never silently passes) when no database was configured at all. */
  const dbTest = (name: string, fn: () => Promise<void>) =>
    it(name, async (context) => {
      if (!ready) context.skip();
      await fn();
    });

  dbTest('BR-79a: a Sub admin lists and reads its own warehouse and gets the SAME 404 for another and for an unknown warehouse', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      const svc = service(tx);
      const mine = await svc.create(manage(userId), wh.ooty, { code: 'OWN-1', name: 'Mine' });
      const theirs = await svc.create(manage(userId), wh.coonoor, { code: 'OWN-1', name: 'Theirs' });

      const sub = subView(userId, wh.ooty);
      const list = await svc.list(sub, wh.ooty, { page: 1, pageSize: 20 });
      expect(list.items.map((item) => item.id)).toEqual([mine.id]);
      expect(list.total).toBe(1);
      expect((await svc.get(sub, wh.ooty, mine.id)).name).toBe('Mine');

      const messages = new Set<string>();
      for (const call of [
        () => svc.list(sub, wh.coonoor, { page: 1, pageSize: 20 }),
        () => svc.list(sub, newId(), { page: 1, pageSize: 20 }),
        () => svc.get(sub, wh.coonoor, theirs.id),
        () => svc.get(sub, newId(), theirs.id),
      ]) {
        const error = await call().then(() => null, (e: unknown) => e);
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).status).toBe(404);
        expect((error as AppError).code).toBe('NOT_FOUND');
        messages.add((error as AppError).message.replace(/[0-9a-f-]{36}/g, '<id>'));
      }
      expect(messages.size, 'another and unknown warehouse must be indistinguishable').toBe(1);

      // A Main admin (no warehouse dimension) reads every warehouse.
      const main = aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, permission: 'inventory.batch.view', userId });
      expect((await svc.get(main, wh.coonoor, theirs.id)).name).toBe('Theirs');
      // A location is addressed through ITS warehouse: the right id under the wrong warehouse is 404.
      const crossed = await svc.get(main, wh.ooty, theirs.id).then(() => null, (e: unknown) => e);
      expect((crossed as AppError).status).toBe(404);
    });
  });

  dbTest('BR-79b: a code is unique per warehouse, case-insensitively, and reusable in another warehouse', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      const svc = service(tx);
      await svc.create(manage(userId), wh.ooty, { code: 'Cs-A01', name: 'One' });
      // The duplicate is attempted inside a savepoint: a unique violation aborts the transaction otherwise.
      await tx.query('SAVEPOINT dup');
      const dup = await svc.create(manage(userId), wh.ooty, { code: 'CS-a01', name: 'Two' }).then(() => null, (e: unknown) => e);
      await tx.query('ROLLBACK TO SAVEPOINT dup');
      expect(dup).toBeInstanceOf(AppError);
      expect((dup as AppError).status).toBe(409);
      expect((dup as AppError).code).toBe('CONFLICT');
      const other = await svc.create(manage(userId), wh.coonoor, { code: 'CS-A01', name: 'Other warehouse' });
      expect(other.warehouseId).toBe(wh.coonoor);
    });
  });

  dbTest('BR-79b: creating returns the stored row; an unknown warehouse is 404 and writes no audit row', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      const svc = service(tx);
      const created = await svc.create(manage(userId), wh.ooty, goodBody);
      expect(created).toMatchObject({
        warehouseId: wh.ooty,
        code: 'CS-A01',
        name: 'Cold Storage A',
        locationType: 'Cold Storage',
        capacityKg: '2000.000',
        isActive: true,
        updatedAt: null,
      });
      const before = await tx.query<{ n: string }>(`SELECT count(*)::text AS n FROM audit_log WHERE action_code LIKE 'warehouse.storage_location.%' AND actor_id = $1`, [userId]);
      const missing = await svc.create(manage(userId), newId(), { code: 'X', name: 'X' }).then(() => null, (e: unknown) => e);
      expect((missing as AppError).status).toBe(404);
      const after = await tx.query<{ n: string }>(`SELECT count(*)::text AS n FROM audit_log WHERE action_code LIKE 'warehouse.storage_location.%' AND actor_id = $1`, [userId]);
      expect(after.rows[0]!.n).toBe(before.rows[0]!.n);
    });
  });

  dbTest('BR-79c: update changes only the named fields, can clear type and capacity, never the code; deactivate and reactivate filter the list', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      const svc = service(tx);
      const created = await svc.create(manage(userId), wh.ooty, goodBody);

      const renamed = await svc.update(manage(userId), wh.ooty, created.id, { name: 'Cold Storage A (renovated)' });
      expect(renamed).toMatchObject({ code: 'CS-A01', name: 'Cold Storage A (renovated)', locationType: 'Cold Storage', capacityKg: '2000.000' });
      expect(renamed.updatedAt).not.toBeNull();

      const cleared = await svc.update(manage(userId), wh.ooty, created.id, { locationType: null, capacityKg: null });
      expect(cleared).toMatchObject({ locationType: null, capacityKg: null, name: 'Cold Storage A (renovated)' });

      const off = await svc.update(manage(userId), wh.ooty, created.id, { isActive: false });
      expect(off.isActive).toBe(false);
      const active = await svc.list(manage(userId), wh.ooty, { page: 1, pageSize: 20, isActive: true });
      const inactive = await svc.list(manage(userId), wh.ooty, { page: 1, pageSize: 20, isActive: false });
      expect(active.items.map((item) => item.id)).not.toContain(created.id);
      expect(inactive.items.map((item) => item.id)).toEqual([created.id]);
      // A deactivated row is still readable by id and keeps its code reserved.
      expect((await svc.get(manage(userId), wh.ooty, created.id)).isActive).toBe(false);
      expect((await svc.update(manage(userId), wh.ooty, created.id, { isActive: true })).isActive).toBe(true);

      const unknown = await svc.update(manage(userId), wh.ooty, newId(), { name: 'x' }).then(() => null, (e: unknown) => e);
      expect((unknown as AppError).status).toBe(404);
    });
  });

  dbTest('BR-79a: q matches code, name and type; the list is ordered by code and paged', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      const svc = service(tx);
      await svc.create(manage(userId), wh.kotagiri, { code: 'B-2', name: 'Dry shed', locationType: 'Dry Storage' });
      await svc.create(manage(userId), wh.kotagiri, { code: 'A-1', name: 'Cold room', locationType: 'Cold Storage' });
      await svc.create(manage(userId), wh.kotagiri, { code: 'C-3', name: 'Bulk bay', locationType: 'Bulk Storage' });
      const all = await svc.list(manage(userId), wh.kotagiri, { page: 1, pageSize: 20 });
      expect(all.items.map((item) => item.code)).toEqual(['A-1', 'B-2', 'C-3']);
      const paged = await svc.list(manage(userId), wh.kotagiri, { page: 2, pageSize: 2 });
      expect(paged.items.map((item) => item.code)).toEqual(['C-3']);
      expect(paged.total).toBe(3);
      for (const [q, expected] of [['cold', ['A-1']], ['B-2', ['B-2']], ['bulk', ['C-3']], ['zzz', []]] as const) {
        const found = await svc.list(manage(userId), wh.kotagiri, { page: 1, pageSize: 20, q });
        expect(found.items.map((item) => item.code), q).toEqual(expected);
      }
    });
  });

  dbTest('BR-79d: one audit row per change, in the same transaction, with a masked image (no name) and the real changed field names', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      const svc = service(tx);
      const created = await svc.create(manage(userId), wh.ooty, goodBody);
      await svc.update(manage(userId), wh.ooty, created.id, { name: 'Secret renamed label', capacityKg: '2500', isActive: false });
      // A no-op update changes nothing and therefore audits nothing.
      await svc.update(manage(userId), wh.ooty, created.id, { capacityKg: '2500' });

      const rows = await tx.query<{ action_code: string; entity_id: string; warehouse_id: string; before: unknown; after: unknown; changed_fields: string[] | null }>(
        `SELECT action_code, entity_id::text, warehouse_id::text, before, after, changed_fields
           FROM audit_log WHERE actor_id = $1 AND action_code LIKE 'warehouse.storage_location.%' ORDER BY action_code`,
        [userId],
      );
      // Both rows share one transaction timestamp, so they are told apart by action code, not by time.
      expect(rows.rows.map((row) => row.action_code)).toEqual(['warehouse.storage_location.create', 'warehouse.storage_location.update']);
      const [createRow, updateRow] = rows.rows;
      expect(createRow).toMatchObject({ entity_id: created.id, warehouse_id: wh.ooty, before: null });
      // BR-125 added the tree position (parentId) to the masked image; still no name.
      expect(createRow!.after).toEqual({ code: 'CS-A01', locationType: 'Cold Storage', capacityKg: '2000.000', isActive: true, parentId: null });
      expect(updateRow!.before).toEqual({ code: 'CS-A01', locationType: 'Cold Storage', capacityKg: '2000.000', isActive: true, parentId: null });
      expect(updateRow!.after).toEqual({ code: 'CS-A01', locationType: 'Cold Storage', capacityKg: '2500.000', isActive: false, parentId: null });
      expect([...updateRow!.changed_fields!].sort()).toEqual(['capacityKg', 'isActive', 'name']);
      expect(JSON.stringify(rows.rows)).not.toContain('Secret renamed label');
    });
  });

  dbTest('BR-79d: the audit row rolls back with the change (no audit row survives a rolled-back write)', async () => {
    const { pool } = await import('../../db/pool.js');
    const before = await pool.query<{ n: string }>(`SELECT count(*)::text AS n FROM audit_log WHERE action_code LIKE 'warehouse.storage_location.%'`);
    const stamp = `RB-${Date.now()}`;
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      await service(tx).create(manage(userId), wh.ooty, { code: stamp, name: 'rolled back' });
    });
    const after = await pool.query<{ n: string }>(`SELECT count(*)::text AS n FROM audit_log WHERE action_code LIKE 'warehouse.storage_location.%'`);
    expect(after.rows[0]!.n).toBe(before.rows[0]!.n);
    const left = await pool.query(`SELECT 1 FROM storage_locations WHERE code = $1`, [stamp]);
    expect(left.rowCount).toBe(0);
  });

  dbTest('BR-79e: managing locations never touches inventory_batches, the stock ledger or another warehouse', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      const snapshot = async () =>
        (await tx.query<{ batches: string; ledger: string; locations: string }>(
          `SELECT (SELECT count(*) FROM inventory_batches)::text || ':' || coalesce((SELECT sum(qty_available) FROM inventory_batches)::text, '0') AS batches,
                  (SELECT count(*) FROM stock_ledger)::text AS ledger,
                  (SELECT count(*) FROM storage_locations WHERE warehouse_id <> $1)::text AS locations`,
          [wh.ooty],
        )).rows[0]!;
      const before = await snapshot();
      const svc = service(tx);
      const created = await svc.create(manage(userId), wh.ooty, goodBody);
      await svc.update(manage(userId), wh.ooty, created.id, { isActive: false, capacityKg: null });
      expect(await snapshot()).toEqual(before);
    });
  });

  dbTest('BR-79f: the service refuses a scope that does not cover the warehouse, even for a write', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      const svc = service(tx);
      const created = await svc.create(manage(userId), wh.coonoor, { code: 'F-1', name: 'Coonoor only' });
      // `own` Sub scope for Ooty (what the grant would produce if it were ever flipped from none to own).
      const subOwn = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [wh.ooty], permission: 'warehouse.storage_location.manage', userId });
      for (const call of [
        () => svc.create(subOwn, wh.coonoor, { code: 'F-2', name: 'nope' }),
        () => svc.update(subOwn, wh.coonoor, created.id, { name: 'nope' }),
      ]) {
        const error = await call().then(() => null, (e: unknown) => e);
        expect((error as AppError).status).toBe(404);
      }
      // Even a Sub scope whose level was widened to `all` stays confined to its assigned warehouse.
      const subWide = aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [wh.ooty], permission: 'warehouse.storage_location.manage', userId });
      const wide = await svc.update(subWide, wh.coonoor, created.id, { name: 'nope' }).then(() => null, (e: unknown) => e);
      expect((wide as AppError).status).toBe(404);
      expect((await svc.create(subWide, wh.ooty, { code: 'F-3', name: 'ok' })).warehouseId).toBe(wh.ooty);
    });
  });
});

// ===========================================================================
// 3. Real HTTP through the real app router
// ===========================================================================
describeIfDatabase('storage locations routes (real app router, PostgreSQL)', () => {
  let ready = false;
  let harness: HttpHarness;
  const tag = `CI${Date.now()}`;

  beforeAll(async () => {
    ready = await requireDatabaseTables('storage_locations', 'warehouses');
    if (ready) harness = await startHttpHarness();
  });

  afterAll(async () => {
    if (!ready) return;
    const { pool } = await import('../../db/pool.js');
    await pool.query(`DELETE FROM storage_locations WHERE code LIKE $1`, [`${tag}%`]);
    await harness.stop();
  });

  const dbTest = (name: string, fn: () => Promise<void>) =>
    it(name, async (context) => {
      if (!ready) context.skip();
      await fn();
    });

  const base = (warehouseId: string): string => `/v1/warehouses/${warehouseId}/storage-locations`;

  dbTest('BR-79b (HTTP): every route is 401 without a token; FARMER, CUSTOMER and FARMER_ADMIN are 403 everywhere; a Sub admin is 403 on every write', async () => {
    const id = '99999999-9999-4999-8999-999999999999';
    const routes: Array<{ method: 'get' | 'post' | 'patch'; path: string; body?: object; subAllowed: boolean }> = [
      { method: 'get', path: base(harness.warehouse.ooty), subAllowed: true },
      { method: 'get', path: `${base(harness.warehouse.ooty)}/${id}`, subAllowed: true },
      { method: 'post', path: base(harness.warehouse.ooty), body: { code: `${tag}-X`, name: 'x' }, subAllowed: false },
      { method: 'patch', path: `${base(harness.warehouse.ooty)}/${id}`, body: { name: 'x' }, subAllowed: false },
    ];
    for (const route of routes) {
      const anonymous = await request(harness.server)[route.method](route.path).send(route.body);
      expect(anonymous.status, `${route.method} ${route.path} anonymous`).toBe(401);
      for (const role of ['farmer', 'customer', 'farmerAdmin'] as const) {
        const res = await request(harness.server)[route.method](route.path).set('Authorization', harness.auth(role)).send(route.body);
        expect(res.status, `${route.method} ${route.path} as ${role}: ${JSON.stringify(res.body)}`).toBe(403);
        expect(res.headers['content-type']).toContain('application/problem+json');
      }
      if (!route.subAllowed) {
        const res = await request(harness.server)[route.method](route.path).set('Authorization', harness.auth('subOoty')).send(route.body);
        expect(res.status, `${route.method} ${route.path} as Sub`).toBe(403);
      }
    }
  });

  dbTest('BR-79a/b/c (HTTP): Super, Tohfa and Main create, a Sub admin reads only its own warehouse and gets 404 for another', async () => {
    const codes: Record<string, string> = {};
    for (const [role, warehouseId] of [
      ['superAdmin', harness.warehouse.ooty],
      ['tohfaAdmin', harness.warehouse.coonoor],
      ['main', harness.warehouse.kotagiri],
    ] as const) {
      codes[role] = `${tag}-${role}`;
      const res = await request(harness.server).post(base(warehouseId)).set('Authorization', harness.auth(role)).send({ code: codes[role], name: `by ${role}`, capacityKg: '100.5' });
      expect(res.status, `${role}: ${JSON.stringify(res.body)}`).toBe(201);
      expect(res.body).toMatchObject({ warehouseId, code: codes[role], capacityKg: '100.500', isActive: true });
    }

    const own = await request(harness.server).get(base(harness.warehouse.ooty)).query({ q: tag }).set('Authorization', harness.auth('subOoty'));
    expect(own.status).toBe(200);
    expect(own.body.items.map((item: { code: string }) => item.code)).toEqual([codes['superAdmin']]);
    const oneId = own.body.items[0].id as string;
    expect((await request(harness.server).get(`${base(harness.warehouse.ooty)}/${oneId}`).set('Authorization', harness.auth('subOoty'))).status).toBe(200);

    // Another warehouse, a location addressed through the wrong warehouse and an unknown warehouse: all the same 404.
    const bodies = new Set<string>();
    for (const path of [
      base(harness.warehouse.coonoor),
      `${base(harness.warehouse.coonoor)}/${oneId}`,
      `${base(harness.warehouse.ooty)}/${newId()}`,
      base(newId()),
    ]) {
      const res = await request(harness.server).get(path).set('Authorization', harness.auth('subOoty'));
      expect(res.status, path).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
      bodies.add(JSON.stringify({ status: res.body.status, code: res.body.code, title: res.body.title }));
    }
    expect(bodies.size).toBe(1);

    // Main reads every warehouse; a Sub of Coonoor does not see the Ooty row.
    const all = await request(harness.server).get(base(harness.warehouse.ooty)).query({ q: tag }).set('Authorization', harness.auth('main'));
    expect(all.body.total).toBe(1);
    const coon = await request(harness.server).get(base(harness.warehouse.coonoor)).query({ q: tag }).set('Authorization', harness.auth('subCoonoor'));
    expect(coon.body.items.map((item: { code: string }) => item.code)).toEqual([codes['tohfaAdmin']]);

    // PATCH deactivates; the active filter then hides it.
    const off = await request(harness.server).patch(`${base(harness.warehouse.ooty)}/${oneId}`).set('Authorization', harness.auth('main')).send({ isActive: false });
    expect(off.status).toBe(200);
    expect(off.body.isActive).toBe(false);
    const active = await request(harness.server).get(base(harness.warehouse.ooty)).query({ q: tag, isActive: 'true' }).set('Authorization', harness.auth('subOoty'));
    expect(active.body.items).toEqual([]);
  });

  dbTest('BR-79b (HTTP): a duplicate code is 409, a malformed body is 422 and writes nothing, an unknown warehouse is 404', async () => {
    const code = `${tag}-dup`;
    const first = await request(harness.server).post(base(harness.warehouse.gudalur)).set('Authorization', harness.auth('main')).send({ code, name: 'one' });
    expect(first.status).toBe(201);
    const dup = await request(harness.server).post(base(harness.warehouse.gudalur)).set('Authorization', harness.auth('main')).send({ code: code.toLowerCase(), name: 'two' });
    expect(dup.status).toBe(409);
    expect(dup.body.code).toBe('CONFLICT');

    for (const bad of [{}, { code, name: '' }, { code: `${tag}-bad`, name: 'x', capacityKg: 5 }, { code: `${tag}-bad`, name: 'x', capacityKg: '0' }, { code: `${tag}-bad`, name: 'x', warehouseId: newId() }]) {
      const res = await request(harness.server).post(base(harness.warehouse.gudalur)).set('Authorization', harness.auth('main')).send(bad);
      expect(res.status, JSON.stringify(bad)).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    }
    const { pool } = await import('../../db/pool.js');
    const bad = await pool.query(`SELECT 1 FROM storage_locations WHERE code = $1`, [`${tag}-bad`]);
    expect(bad.rowCount).toBe(0);

    const unknown = await request(harness.server).post(base(newId())).set('Authorization', harness.auth('main')).send({ code: `${tag}-nowh`, name: 'x' });
    expect(unknown.status).toBe(404);
    const notUuid = await request(harness.server).get(base('not-a-uuid')).set('Authorization', harness.auth('main'));
    expect(notUuid.status).toBe(422);
  });

  dbTest('BR-79c (HTTP): the code cannot be edited, an empty PATCH is 422, and there is no DELETE route', async () => {
    const created = await request(harness.server).post(base(harness.warehouse.gudalur)).set('Authorization', harness.auth('main')).send({ code: `${tag}-imm`, name: 'imm' });
    const path = `${base(harness.warehouse.gudalur)}/${created.body.id as string}`;
    expect((await request(harness.server).patch(path).set('Authorization', harness.auth('main')).send({ code: 'OTHER' })).status).toBe(422);
    expect((await request(harness.server).patch(path).set('Authorization', harness.auth('main')).send({})).status).toBe(422);
    const del = await request(harness.server).delete(path).set('Authorization', harness.auth('superAdmin'));
    expect([404, 405]).toContain(del.status);
    const still = await request(harness.server).get(path).set('Authorization', harness.auth('main'));
    expect(still.status).toBe(200);
    expect(still.body.code).toBe(`${tag}-imm`);
  });
});
