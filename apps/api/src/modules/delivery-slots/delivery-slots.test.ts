/**
 * BR-201: delivery slot availability (GET /v1/delivery-slots) and the SLOT_FULL refusal.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool, type Executor } from '../../db/pool.js';
import { databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import { todayInKolkata } from '../orders/orders.pricing.js';
import { createDeliverySlotsService, describeSlot, slotStart } from './delivery-slots.service.js';
import type { DeliverySlotsRepo, SlotRow } from './delivery-slots.repo.js';

const db = {} as Executor;

function fakeRepo(rows: SlotRow[], opts: { warehouse?: boolean; cutoff?: unknown } = {}): DeliverySlotsRepo {
  return {
    async warehouseExists() { return opts.warehouse ?? true; },
    async listSlots() { return rows; },
    async getSlot(_db, _wh, _date, slot) { return rows.find((r) => r.slot === slot) ?? null; },
    async getCutoffMinutesRaw() { return opts.cutoff ?? 120; },
  };
}

describe('BR-201: delivery slot availability', () => {
  it('BR-201a: slot start and cutoff are Asia/Kolkata times', () => {
    expect(slotStart('2026-11-20', 'MORNING_8_12').toISOString()).toBe('2026-11-20T02:30:00.000Z');
    const view = describeSlot('2026-11-20', 'EVENING_4_8', null, 120, new Date('2026-11-20T00:00:00Z'));
    // 16:00 IST = 10:30Z; cutoff 120 min earlier = 08:30Z.
    expect(view.cutoff).toBe('2026-11-20T08:30:00.000Z');
    expect(view.cutoffPassed).toBe(false);
  });

  it('BR-201b: capacity, booked and available come from the slot row; full and switched-off slots are not bookable', () => {
    const now = new Date('2026-11-19T00:00:00Z');
    const full = describeSlot('2026-11-20', 'MORNING_8_12', { slot: 'MORNING_8_12', capacity: 5, booked: 5, isActive: true }, 120, now);
    expect(full).toMatchObject({ capacity: 5, booked: 5, available: 0, bookable: false });
    const off = describeSlot('2026-11-20', 'MORNING_8_12', { slot: 'MORNING_8_12', capacity: 5, booked: 1, isActive: false }, 120, now);
    expect(off).toMatchObject({ available: 4, isActive: false, bookable: false });
    const open = describeSlot('2026-11-20', 'MORNING_8_12', { slot: 'MORNING_8_12', capacity: 5, booked: 2, isActive: true }, 120, now);
    expect(open).toMatchObject({ available: 3, bookable: true });
  });

  it('BR-201c: a slot with no capacity row is uncapped (capacity and available null) and bookable, as checkout books it', () => {
    const view = describeSlot('2026-11-20', 'AFTERNOON_12_4', null, 120, new Date('2026-11-19T00:00:00Z'));
    expect(view).toMatchObject({ capacity: null, booked: 0, available: null, bookable: true, isActive: true });
  });

  it('BR-201d: the cutoff is informational: cutoffPassed is reported, bookable only reflects capacity', () => {
    const view = describeSlot('2026-11-20', 'MORNING_8_12', null, 120, new Date('2026-11-20T01:00:00Z'));
    expect(view.cutoffPassed).toBe(true);
  });

  it('BR-201e: the list always has the three slots in order, with labels', async () => {
    const svc = createDeliverySlotsService({ repo: fakeRepo([{ slot: 'EVENING_4_8', capacity: 3, booked: 1, isActive: true }]), db });
    const res = await svc.listSlots({ warehouseId: newId(), date: '2999-01-01' });
    expect(res.items.map((s) => s.slot)).toEqual(['MORNING_8_12', 'AFTERNOON_12_4', 'EVENING_4_8']);
    expect(res.items[2]).toMatchObject({ capacity: 3, booked: 1, available: 2, label: expect.any(String) });
  });

  it('BR-201f: unknown warehouse is 404; a past date is 422', async () => {
    const missing = createDeliverySlotsService({ repo: fakeRepo([], { warehouse: false }), db });
    await expect(missing.listSlots({ warehouseId: newId(), date: '2999-01-01' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    const svc = createDeliverySlotsService({ repo: fakeRepo([]), db });
    await expect(svc.listSlots({ warehouseId: newId(), date: '2000-01-01' })).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('BR-201g: an invalid cutoff config fails closed to the documented default', async () => {
    const svc = createDeliverySlotsService({ repo: fakeRepo([], { cutoff: 'abc' }), db });
    const res = await svc.listSlots({ warehouseId: newId(), date: '2999-01-01' });
    // default 120 minutes before 08:00 IST = 00:30Z on that day
    expect(res.items[0]!.cutoff).toBe('2999-01-01T00:30:00.000Z');
  });
});

describeIfDatabase('BR-201: GET /v1/delivery-slots (integration)', () => {
  const app = createApp();
  let ready = false;
  let token = '';
  let warehouseId = '';
  const date = '2999-06-01';

  beforeAll(async () => {
    ready = await databaseReady('delivery-slots');
    if (!ready) return;
    warehouseId = newId();
    const rand = Math.floor(100000 + Math.random() * 900000);
    await pool.query(
      `INSERT INTO warehouses (id, code, name, type, address, city, pincode)
       VALUES ($1, $2, 'Slot WH', 'MAIN', '1 Rd', 'Ooty', '643001')`,
      [warehouseId, `WH-SLOT-${rand}`],
    );
    await pool.query(
      `INSERT INTO delivery_slots (warehouse_id, slot_date, slot, capacity_orders, booked_orders, is_active)
       VALUES ($1, $2, 'MORNING_8_12', 2, 2, true), ($1, $2, 'AFTERNOON_12_4', 4, 1, true)`,
      [warehouseId, date],
    );
    const userId = newId();
    const customerId = newId();
    await pool.query(`INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'Slot C', 'CUSTOMER', 'ACTIVE')`, [userId, `+919855${rand}`]);
    await pool.query(`INSERT INTO customers (id, user_id, customer_code) VALUES ($1, $2, $3)`, [customerId, userId, `CUST-SLOT-${rand}`]);
    token = signAccessToken({ sub: userId, roles: [{ code: 'CUSTOMER' }], farmerId: null, customerId });
  });

  it('BR-201: a customer reads per-slot capacity, booked and available', async () => {
    if (!ready) return;
    const res = await request(app)
      .get(`/v1/delivery-slots?warehouseId=${warehouseId}&date=${date}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(3);
    expect(res.body.items[0]).toMatchObject({ slot: 'MORNING_8_12', capacity: 2, booked: 2, available: 0, bookable: false });
    expect(res.body.items[1]).toMatchObject({ slot: 'AFTERNOON_12_4', capacity: 4, booked: 1, available: 3, bookable: true });
    expect(res.body.items[2]).toMatchObject({ slot: 'EVENING_4_8', capacity: null, available: null, bookable: true });
  });

  it('BR-201: past date is 422 and anonymous is 401', async () => {
    if (!ready) return;
    const past = await request(app)
      .get(`/v1/delivery-slots?warehouseId=${warehouseId}&date=2000-01-01`)
      .set('Authorization', `Bearer ${token}`);
    expect(past.status).toBe(422);
    const anon = await request(app).get(`/v1/delivery-slots?warehouseId=${warehouseId}&date=${todayInKolkata()}`);
    expect(anon.status).toBe(401);
  });
});
