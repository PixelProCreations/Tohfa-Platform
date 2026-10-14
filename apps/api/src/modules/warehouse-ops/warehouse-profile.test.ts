/**
 * BR-80 (profile writes): PATCH /v1/warehouses/{id} edits the contact phone and the operating hours
 * of a warehouse, and nothing else.
 *
 *  a  the body is strict: only `contactPhone` and `operatingHours`; name, code, type, city, address,
 *     coordinates, capacity and status are immutable through this endpoint
 *  b  `operatingHours` has ONE strict shape (an unconfirmed default): all seven weekdays, each
 *     `{ closed: true }` or `{ closed: false, open, close }` with HH:MM 24h and open < close
 *  c  permission `warehouse.profile.edit`: Super/Tohfa/Main only; a Sub admin is 403 even for its own warehouse
 *  d  one audit row in the same transaction, masked: changed field names only, never the phone number
 *  e  a change that alters nothing writes nothing; an unknown warehouse is 404 and audits nothing
 *
 * BR-23b (no warehouse create or delete) is asserted here too, against the real router.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { aScope, describeIfDatabase, newId } from '../../test/factories.js';
import { requireDatabaseTables } from '../../test/dbFixtures.js';
import { operatingHoursSchema, updateWarehouseProfileBody } from './warehouse-profile.schema.js';
import { createWarehouseProfileService } from './warehouse-profile.service.js';
import { warehouseProfileRepo } from './warehouse-profile.repo.js';
import { inRolledBackTx, loadWarehouseIds, startHttpHarness, type HttpHarness, type WarehouseIds } from './testkit.js';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const openDay = { closed: false, open: '09:00', close: '18:00' };
const week = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  ...Object.fromEntries(DAYS.map((day) => [day, day === 'sun' ? { closed: true } : openDay])),
  ...overrides,
});

// ===========================================================================
// 1. Schemas
// ===========================================================================
describe('warehouse profile schemas', () => {
  it('BR-80b: accepts a full week of {closed:true} or {closed:false, open, close}', () => {
    expect(operatingHoursSchema.safeParse(week()).success).toBe(true);
    expect(operatingHoursSchema.safeParse(week({ sat: { closed: false, open: '00:00', close: '23:59' } })).success).toBe(true);
  });

  it('BR-80b: rejects a missing weekday, an unknown key, a non-object and an empty object', () => {
    const missing = week();
    delete missing['wed'];
    expect(operatingHoursSchema.safeParse(missing).success).toBe(false);
    expect(operatingHoursSchema.safeParse(week({ holiday: openDay })).success).toBe(false);
    expect(operatingHoursSchema.safeParse(week({ monday: openDay })).success).toBe(false);
    for (const bad of ['09:00-18:00', [], 5, {}]) expect(operatingHoursSchema.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
  });

  it('BR-80b: rejects malformed times, open not before close, and contradictory closed flags', () => {
    for (const day of [
      { closed: false, open: '9:00', close: '18:00' },
      { closed: false, open: '09:00', close: '24:00' },
      { closed: false, open: '09:60', close: '18:00' },
      { closed: false, open: '09:00 ', close: '18:00' },
      { closed: false, open: '18:00', close: '09:00' },
      { closed: false, open: '09:00', close: '09:00' },
      { closed: false, open: '09:00' },
      { closed: false },
      { closed: true, open: '09:00', close: '18:00' },
      { open: '09:00', close: '18:00' },
      { closed: 'false', open: '09:00', close: '18:00' },
      { closed: false, open: '09:00', close: '18:00', note: 'x' },
    ]) {
      expect(operatingHoursSchema.safeParse(week({ tue: day })).success, JSON.stringify(day)).toBe(false);
    }
  });

  it('BR-80a: the body takes contactPhone (E.164 or null) and operatingHours (or null), at least one, and nothing else', () => {
    expect(updateWarehouseProfileBody.safeParse({ contactPhone: '+914232441234' }).success).toBe(true);
    expect(updateWarehouseProfileBody.safeParse({ contactPhone: null }).success).toBe(true);
    expect(updateWarehouseProfileBody.safeParse({ operatingHours: week() }).success).toBe(true);
    expect(updateWarehouseProfileBody.safeParse({ operatingHours: null }).success).toBe(true);
    expect(updateWarehouseProfileBody.safeParse({}).success).toBe(false);
    for (const contactPhone of ['9442188210', '+0123456789', '+91 94421 88210', '+91', '', 'tel:+914232441234', 914232441234]) {
      expect(updateWarehouseProfileBody.safeParse({ contactPhone }).success, String(contactPhone)).toBe(false);
    }
    for (const forbidden of ['name', 'code', 'type', 'city', 'address', 'pincode', 'latitude', 'longitude', 'lat', 'lng', 'capacityKg', 'isActive', 'id', 'isMarketDayVenue', 'marketDayOfWeek']) {
      expect(updateWarehouseProfileBody.safeParse({ contactPhone: '+914232441234', [forbidden]: 'x' }).success, forbidden).toBe(false);
    }
  });
});

// ===========================================================================
// 2. Service against real Postgres, in a rolled-back transaction
// ===========================================================================
describeIfDatabase('warehouse profile service (PostgreSQL)', () => {
  let ready = false;
  let wh: WarehouseIds;

  beforeAll(async () => {
    ready = await requireDatabaseTables('warehouses', 'audit_log');
    if (ready) {
      const { pool } = await import('../../db/pool.js');
      wh = await loadWarehouseIds(pool);
    }
  });

  const dbTest = (name: string, fn: () => Promise<void>) =>
    it(name, async (context) => {
      if (!ready) context.skip();
      await fn();
    });

  const editor = (userId: string) =>
    aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, permission: 'warehouse.profile.edit', userId });
  async function actor(tx: Executor): Promise<string> {
    const user = await tx.query<{ id: string }>(
      `INSERT INTO users (mobile, full_name, user_type, status) VALUES ($1, 'CI profile admin', 'ADMIN', 'ACTIVE') RETURNING id`,
      [`+9196${String(Date.now()).slice(-8)}`],
    );
    return user.rows[0]!.id;
  }
  const service = (tx: Executor) => createWarehouseProfileService({ repo: warehouseProfileRepo, runTx: async (fn) => fn(tx) });
  const auditRows = (tx: Executor, userId: string) =>
    tx.query<{ action_code: string; entity_id: string; warehouse_id: string; before: unknown; after: unknown; changed_fields: string[] | null }>(
      `SELECT action_code, entity_id::text, warehouse_id::text, before, after, changed_fields
         FROM audit_log WHERE actor_id = $1 AND action_code = 'warehouse.profile.edit' ORDER BY action_code`,
      [userId],
    );
  const immutableColumns = async (tx: Executor, id: string) =>
    (await tx.query(
      `SELECT code, name, type, address, city, pincode, lat::text, lng::text, capacity_kg::text, is_active, is_market_day_venue, market_day_of_week
         FROM warehouses WHERE id = $1`,
      [id],
    )).rows[0];

  dbTest('BR-80a: changes only the contact phone and the hours; every other column is untouched', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      const svc = service(tx);
      const before = await immutableColumns(tx, wh.ooty);

      const phone = await svc.update(editor(userId), wh.ooty, { contactPhone: '+914232441234' });
      expect(phone.contactPhone).toBe('+914232441234');
      const hours = await svc.update(editor(userId), wh.ooty, { operatingHours: week() as never });
      expect(hours.operatingHours).toEqual(week());
      expect(hours.contactPhone).toBe('+914232441234');
      expect(await immutableColumns(tx, wh.ooty)).toEqual(before);

      const cleared = await svc.update(editor(userId), wh.ooty, { contactPhone: null, operatingHours: null });
      expect(cleared.contactPhone).toBeNull();
      expect(cleared.operatingHours).toBeNull();
      // The response is the full warehouse detail (same shape as GET /warehouses/{id}).
      expect(cleared).toMatchObject({ id: wh.ooty, code: 'WH-OOTY', name: 'Ooty Warehouse' });
    });
  });

  dbTest('BR-80d: one audit row per change, masked: changed field names only, never the phone number or the hours', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      const svc = service(tx);
      await svc.update(editor(userId), wh.coonoor, { contactPhone: '+914232441234', operatingHours: week() as never });
      await svc.update(editor(userId), wh.coonoor, { contactPhone: '+914232449999' });

      const rows = await tx.query<{ before: unknown; after: unknown; changed_fields: string[] | null; warehouse_id: string; entity_id: string }>(
        `SELECT before, after, changed_fields, warehouse_id::text, entity_id::text
           FROM audit_log WHERE actor_id = $1 AND action_code = 'warehouse.profile.edit' ORDER BY (changed_fields = ARRAY['contactPhone']::text[]), id`,
        [userId],
      );
      expect(rows.rows).toHaveLength(2);
      const [first, second] = rows.rows;
      expect([...first!.changed_fields!].sort()).toEqual(['contactPhone', 'operatingHours']);
      expect(first).toMatchObject({ warehouse_id: wh.coonoor, entity_id: wh.coonoor, before: { contactPhoneSet: false, operatingHoursSet: false }, after: { contactPhoneSet: true, operatingHoursSet: true } });
      // A phone changed from one number to another still shows as changed, without either number.
      expect(second!.changed_fields).toEqual(['contactPhone']);
      expect(JSON.stringify(rows.rows)).not.toMatch(/\+91|09:00|18:00/);
    });
  });

  dbTest('BR-80d: the audit row rolls back with the change', async () => {
    const { pool } = await import('../../db/pool.js');
    const count = async () => (await pool.query<{ n: string }>(`SELECT count(*)::text AS n FROM audit_log WHERE action_code = 'warehouse.profile.edit'`)).rows[0]!.n;
    const before = await count();
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      await service(tx).update(editor(userId), wh.kotagiri, { contactPhone: '+914232441111' });
    });
    expect(await count()).toBe(before);
    const stored = await pool.query<{ contact_phone: string | null }>(`SELECT contact_phone FROM warehouses WHERE id = $1`, [wh.kotagiri]);
    expect(stored.rows[0]!.contact_phone).not.toBe('+914232441111');
  });

  dbTest('BR-80e: a change that alters nothing writes nothing and audits nothing', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      const svc = service(tx);
      await svc.update(editor(userId), wh.gudalur, { contactPhone: '+914232441234', operatingHours: week() as never });
      // A trigger touches updated_at on every UPDATE, so a write is detected by the row's physical
      // version (ctid), which changes whenever the row is rewritten, even inside one transaction.
      const version = async (): Promise<string> =>
        (await tx.query<{ ctid: string }>(`SELECT ctid::text FROM warehouses WHERE id = $1`, [wh.gudalur])).rows[0]!.ctid;
      const written = await version();

      // Same phone, same hours (key order irrelevant): nothing to write.
      const reordered = Object.fromEntries([...DAYS].reverse().map((day) => [day, week()[day]]));
      await svc.update(editor(userId), wh.gudalur, { contactPhone: '+914232441234', operatingHours: reordered as never });
      expect(await version()).toBe(written);
      expect((await auditRows(tx, userId)).rowCount).toBe(1);
    });
  });

  dbTest('BR-80e: an unknown warehouse is 404 and writes no audit row', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      const error = await service(tx).update(editor(userId), newId(), { contactPhone: '+914232441234' }).then(() => null, (e: unknown) => e);
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).status).toBe(404);
      expect((await auditRows(tx, userId)).rowCount).toBe(0);
    });
  });

  dbTest('BR-80c: the service refuses a scope that does not cover the warehouse (guard for a Sub grant flipped to own)', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      const svc = service(tx);
      const subOwn = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [wh.ooty], permission: 'warehouse.profile.edit', userId });
      const other = await svc.update(subOwn, wh.coonoor, { contactPhone: '+914232441234' }).then(() => null, (e: unknown) => e);
      expect((other as AppError).status).toBe(404);
      const unknown = await svc.update(subOwn, newId(), { contactPhone: '+914232441234' }).then(() => null, (e: unknown) => e);
      expect((unknown as AppError).status).toBe(404);
      expect((await svc.update(subOwn, wh.ooty, { contactPhone: '+914232441234' })).contactPhone).toBe('+914232441234');
    });
  });
});

// ===========================================================================
// 3. Real HTTP through the real app router
// ===========================================================================
describeIfDatabase('warehouse profile routes (real app router, PostgreSQL)', () => {
  let ready = false;
  let harness: HttpHarness;
  let originals: Array<{ id: string; contact_phone: string | null; operating_hours: unknown; updated_at: Date | null }> = [];

  beforeAll(async () => {
    ready = await requireDatabaseTables('warehouses', 'audit_log');
    if (!ready) return;
    harness = await startHttpHarness();
    const { pool } = await import('../../db/pool.js');
    originals = (await pool.query(`SELECT id, contact_phone, operating_hours, updated_at FROM warehouses`)).rows;
  });

  afterAll(async () => {
    if (!ready) return;
    const { pool } = await import('../../db/pool.js');
    // This suite commits edits to the seeded warehouses; put the editable columns back.
    for (const original of originals) {
      await pool.query(`UPDATE warehouses SET contact_phone = $2, operating_hours = $3::jsonb, updated_at = $4 WHERE id = $1`, [
        original.id,
        original.contact_phone,
        original.operating_hours === null ? null : JSON.stringify(original.operating_hours),
        original.updated_at,
      ]);
    }
    await harness.stop();
  });

  const dbTest = (name: string, fn: () => Promise<void>) =>
    it(name, async (context) => {
      if (!ready) context.skip();
      await fn();
    });

  dbTest('BR-80c (HTTP): 401 without a token, 403 for FARMER, CUSTOMER, FARMER_ADMIN and for a Sub admin even on its own warehouse', async () => {
    const path = `/v1/warehouses/${harness.warehouse.ooty}`;
    const body = { contactPhone: '+914232440000' };
    expect((await request(harness.server).patch(path).send(body)).status).toBe(401);
    for (const role of ['farmer', 'customer', 'farmerAdmin', 'subOoty', 'subCoonoor'] as const) {
      const res = await request(harness.server).patch(path).set('Authorization', harness.auth(role)).send(body);
      expect(res.status, role).toBe(403);
      expect(res.headers['content-type']).toContain('application/problem+json');
    }
    const { pool } = await import('../../db/pool.js');
    const stored = await pool.query<{ contact_phone: string | null }>(`SELECT contact_phone FROM warehouses WHERE id = $1`, [harness.warehouse.ooty]);
    expect(stored.rows[0]!.contact_phone).not.toBe('+914232440000');
  });

  dbTest('BR-80a/b/c (HTTP): Super, Tohfa and Main edit any warehouse; bad bodies and immutable fields are 422 and change nothing', async () => {
    for (const [role, warehouseId, phone] of [
      ['superAdmin', harness.warehouse.ooty, '+914232440001'],
      ['tohfaAdmin', harness.warehouse.coonoor, '+914232440002'],
      ['main', harness.warehouse.kotagiri, '+914232440003'],
    ] as const) {
      const res = await request(harness.server).patch(`/v1/warehouses/${warehouseId}`).set('Authorization', harness.auth(role)).send({ contactPhone: phone, operatingHours: week() });
      expect(res.status, `${role}: ${JSON.stringify(res.body)}`).toBe(200);
      expect(res.body).toMatchObject({ id: warehouseId, contactPhone: phone, operatingHours: week() });
      const read = await request(harness.server).get(`/v1/warehouses/${warehouseId}`).set('Authorization', harness.auth('main'));
      expect(read.body.contactPhone).toBe(phone);
    }
    const path = `/v1/warehouses/${harness.warehouse.gudalur}`;
    for (const bad of [{}, { name: 'Renamed' }, { code: 'X' }, { type: 'MAIN' }, { city: 'x' }, { address: 'x' }, { latitude: 1 }, { capacityKg: '5' }, { contactPhone: '123' }, { operatingHours: { mon: openDay } }, { contactPhone: '+914232440009', isActive: false }]) {
      const res = await request(harness.server).patch(path).set('Authorization', harness.auth('main')).send(bad);
      expect(res.status, JSON.stringify(bad)).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    }
    const { pool } = await import('../../db/pool.js');
    const stored = await pool.query<{ name: string; contact_phone: string | null }>(`SELECT name, contact_phone FROM warehouses WHERE id = $1`, [harness.warehouse.gudalur]);
    expect(stored.rows[0]!.name).toBe('Gudalur Market Warehouse');
    expect(stored.rows[0]!.contact_phone).not.toBe('+914232440009');

    expect((await request(harness.server).patch(`/v1/warehouses/${newId()}`).set('Authorization', harness.auth('main')).send({ contactPhone: '+914232440009' })).status).toBe(404);
    expect((await request(harness.server).patch('/v1/warehouses/not-a-uuid').set('Authorization', harness.auth('main')).send({ contactPhone: '+914232440009' })).status).toBe(422);
  });

  dbTest('BR-23b: there is no endpoint that creates or deletes a warehouse, for any role', async () => {
    const { pool } = await import('../../db/pool.js');
    const count = async () => (await pool.query<{ n: string }>(`SELECT count(*)::text AS n FROM warehouses`)).rows[0]!.n;
    const before = await count();
    for (const role of ['superAdmin', 'tohfaAdmin', 'main', 'subOoty', 'farmer', 'customer'] as const) {
      const create = await request(harness.server).post('/v1/warehouses').set('Authorization', harness.auth(role)).send({ code: 'WH-NEW', name: 'New', type: 'SUB' });
      expect([404, 405], `POST /v1/warehouses as ${role}`).toContain(create.status);
      for (const path of [`/v1/warehouses/${harness.warehouse.ooty}`, `/v1/warehouses/${newId()}`]) {
        const del = await request(harness.server).delete(path).set('Authorization', harness.auth(role));
        expect([404, 405], `DELETE ${path} as ${role}`).toContain(del.status);
      }
    }
    expect(await count()).toBe(before);
    const stillThere = await request(harness.server).get(`/v1/warehouses/${harness.warehouse.ooty}`).set('Authorization', harness.auth('main'));
    expect(stillThere.status).toBe(200);
  });
});
