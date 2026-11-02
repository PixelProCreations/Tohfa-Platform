/**
 * BR-131 (owner request 2026-10-27, "Group D" D6a): GET /warehouses/{id}/capacity carries
 * `thresholdPercent`, the `system_config.alert_capacity_utilization_percent` value read through the
 * alerts' own reader (`tasksAlertsRepo.getAlertThresholds`, BR-77f), never a constant. A missing or
 * unusable value is null, exactly when the CAPACITY_NEAR_FULL alert is not raised.
 *
 * The SQL half runs in rolled-back transactions (the config row is restored by the rollback).
 */
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type pg from 'pg';
import request from 'supertest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { aScope, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import type { WarehousesRepo } from './warehouses.repo.js';
import type { WarehouseCapacityResponse } from './warehouses.schema.js';
import { createWarehousesService } from './warehouses.service.js';

const CAPACITY_KEYS = ['availableKg', 'capacityKg', 'thresholdPercent', 'usedKg', 'utilizationPercent', 'warehouseId'];

const noopDb: Executor = {
  query: async () => {
    throw new Error('the stub repo should never reach the database');
  },
};

function stubRepo(threshold: number | null, known: string[]): WarehousesRepo & { thresholdReads: number } {
  const capacity = (id: string): WarehouseCapacityResponse => ({
    warehouseId: id, capacityKg: '1000.000', usedKg: '950.000', availableKg: '50.000', utilizationPercent: 95,
  });
  const repo = {
    thresholdReads: 0,
    async list() { return { items: [], total: 0 }; },
    async findById() { return null; },
    async findCapacity(_db: Executor, id: string) { return known.includes(id) ? capacity(id) : null; },
    async lockCapacity(_db: Executor, id: string) { return known.includes(id) ? { capacityKg: '1000.000' } : null; },
    async setCapacity(_db: Executor, _id: string, kg: string) { return kg; },
    async capacityThresholdPercent() {
      repo.thresholdReads += 1;
      return threshold;
    },
  };
  return repo as unknown as WarehousesRepo & { thresholdReads: number };
}

// The pool is closed ONCE, after every describe in this file: a describe that closed it would leave
// the next one unable to reach the database.
afterAll(async () => {
  if (process.env['DATABASE_URL'] === undefined) return;
  const [{ closePool }, { closeRedis }] = await Promise.all([import('../../db/pool.js'), import('../../redis.js')]);
  await Promise.allSettled([closePool(), closeRedis()]);
});

describe('warehouse capacity threshold (stub repo) — BR-131', () => {
  it('BR-131a: GET and the PATCH response carry the repo threshold with the capacity; null stays null', async () => {
    const repo = stubRepo(90, [IDS.warehouseOoty]);
    const tx = { query: async () => ({ rows: [{ id: newId() }], rowCount: 1 }) } as unknown as Executor;
    const service = createWarehousesService({ repo, db: noopDb, transaction: (fn) => fn(tx) });
    expect(await service.getCapacity(aScope(), IDS.warehouseOoty)).toEqual({
      warehouseId: IDS.warehouseOoty, capacityKg: '1000.000', usedKg: '950.000', availableKg: '50.000', utilizationPercent: 95, thresholdPercent: 90,
    });
    const patched = await service.setCapacity(aScope({ permission: 'warehouse.capacity.set' }), IDS.warehouseOoty, { capacityKg: '1000.000' });
    expect(patched.thresholdPercent).toBe(90);

    const unset = createWarehousesService({ repo: stubRepo(null, [IDS.warehouseOoty]), db: noopDb });
    expect((await unset.getCapacity(aScope(), IDS.warehouseOoty)).thresholdPercent).toBeNull();
  });

  it('BR-131a: out of scope is still 404 NOT_FOUND and reads no threshold', async () => {
    const repo = stubRepo(90, []);
    const service = createWarehousesService({ repo, db: noopDb });
    const error = await service.getCapacity(aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [IDS.warehouseOoty] }), IDS.warehouseCoonoor).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).status).toBe(404);
    expect(repo.thresholdReads).toBe(0);
  });
});

describeIfDatabase('warehouse capacity threshold (PostgreSQL, rolled back) — BR-131', () => {
  let ready = false;
  let pool: pg.Pool;
  let ootyId = '';

  beforeAll(async () => {
    ready = await databaseReady('system_config');
    if (!ready) return;
    ({ pool } = await import('../../db/pool.js'));
    ootyId = (await pool.query<{ id: string }>(`SELECT id FROM warehouses WHERE code = 'WH-OOTY'`)).rows[0]!.id;
  });

  async function inRollback(fn: (tx: pg.PoolClient) => Promise<void>): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await fn(client);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  }

  const setConfig = async (tx: Executor, value: string | null): Promise<void> => {
    if (value === null) await tx.query(`DELETE FROM system_config WHERE key = 'alert_capacity_utilization_percent'`);
    else {
      await tx.query(
        `INSERT INTO system_config (key, value) VALUES ('alert_capacity_utilization_percent', $1::jsonb)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [value],
      );
    }
  };

  it('BR-131b: the configured value, as the alerts reader sees it; missing or unusable is null; no capacity still carries it', async (ctx) => {
    if (!ready) return ctx.skip();
    const { tasksAlertsRepo } = await import('../tasks-alerts/tasks-alerts.repo.js');
    await inRollback(async (tx) => {
      const service = createWarehousesService({ db: tx, transaction: (fn) => fn(tx) });
      await setConfig(tx, '90');
      expect((await service.getCapacity(aScope(), ootyId)).thresholdPercent).toBe(90);
      await setConfig(tx, '95.5');
      const capacity = await service.getCapacity(aScope(), ootyId);
      expect(capacity.thresholdPercent).toBe(95.5);
      expect(String(capacity.thresholdPercent)).toBe((await tasksAlertsRepo.getAlertThresholds(tx)).capacityPercent);

      for (const bad of [null, '-1', '101', '"90"', 'null']) {
        await setConfig(tx, bad);
        expect((await service.getCapacity(aScope(), ootyId)).thresholdPercent, `config ${String(bad)}`).toBeNull();
        expect((await tasksAlertsRepo.getAlertThresholds(tx)).capacityPercent, `alerts ${String(bad)}`).toBeNull();
      }

      await setConfig(tx, '80');
      const bare = newId();
      await tx.query(`INSERT INTO warehouses (id, code, name, type) VALUES ($1, $2, 'BR-131 no capacity', 'SUB')`, [bare, `WH-T131-${bare.slice(0, 6)}`]);
      expect(await service.getCapacity(aScope(), bare)).toEqual({
        warehouseId: bare, capacityKg: null, usedKg: '0.000', availableKg: null, utilizationPercent: null, thresholdPercent: 80,
      });
    });
  });
});

describeIfDatabase('GET /v1/warehouses/{id}/capacity (real router) — BR-131', () => {
  let ready = false;
  let server: Server;
  let ootyId = '';
  let token = '';

  beforeAll(async () => {
    ready = await databaseReady('system_config');
    if (!ready) return;
    const [{ createApp }, { signAccessToken }, { pool }] = await Promise.all([
      import('../../app.js'),
      import('../../auth/jwt.js'),
      import('../../db/pool.js'),
    ]);
    ootyId = (await pool.query<{ id: string }>(`SELECT id FROM warehouses WHERE code = 'WH-OOTY'`)).rows[0]!.id;
    token = signAccessToken({ sub: IDS.userSuperAdmin, roles: [{ code: RoleCode.MAIN_WH_ADMIN }], farmerId: null, customerId: null });
    server = createApp().listen(0);
  }, 60_000);

  afterAll(async () => {
    if (!ready) return;
    if (server !== undefined) await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('BR-131c: the capacity payload key set is the documented one, thresholdPercent included, as the configured number', async (ctx) => {
    if (!ready) return ctx.skip();
    const { pool } = await import('../../db/pool.js');
    const { tasksAlertsRepo } = await import('../tasks-alerts/tasks-alerts.repo.js');
    const res = await request(server).get(`/v1/warehouses/${ootyId}/capacity`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(CAPACITY_KEYS);
    const configured = (await tasksAlertsRepo.getAlertThresholds(pool)).capacityPercent;
    expect(res.body.thresholdPercent).toBe(configured === null ? null : Number(configured));
  });
});
