/**
 * REFERENCE PATTERN — copy this structure for every new module. See CLAUDE.md.
 *
 * Two layers of test, always:
 *
 *  1. SERVICE tests with a fake repo. Fast, no I/O, and they are where the
 *     business rules and the scope behaviour are actually asserted. Assert on
 *     the SQL fragment the service hands the repo — that fragment IS the
 *     security boundary, so it deserves a direct assertion.
 *
 *  2. Integration tests against a real pool (database-gated). Every query in
 *     the repo is exercised for real: a mocked repo cannot catch a SQL bug.
 *     Rows are inserted inside a transaction that is always rolled back.
 *
 * BR-66 (warehouse module) test contract:
 *   BR-66a  a Sub Warehouse Admin reads only its own warehouse (404 otherwise)
 *   BR-66b  capacity is derived read-only from ACTIVE batches
 *   BR-66c  capacity changes need `warehouse.capacity.set`
 *   BR-66d  capacity changes are audited in the same transaction
 *   BR-66e  capacity changes never touch inventory
 */
import type { Express } from 'express';
import request from 'supertest';
import type pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { AppError } from '../../http/problem.js';
import type { Executor } from '../../db/pool.js';
import { createWarehousesService } from './warehouses.service.js';
import type {
  CapacityRow,
  ListArgs,
  ListResult,
  WarehousesRepo,
} from './warehouses.repo.js';
import {
  updateCapacityBody,
  type ListWarehousesQuery,
  type WarehouseCapacityResponse,
  type WarehouseDetail,
} from './warehouses.schema.js';
import type { ScopedWhere } from '../../rbac/requirePermission.js';
import {
  IDS,
  aScope,
  aWarehouse,
  databaseReady,
  describeIfDatabase,
  newId,
} from '../../test/factories.js';

/** The fixture factory predates the detail fields; extend it, never duplicate it. */
function aDetail(overrides: Partial<WarehouseDetail> = {}): WarehouseDetail {
  return {
    ...aWarehouse(),
    capacityKg: '50000.000',
    address: 'Ooty Main Bazaar Road',
    pincode: '643001',
    latitude: 11.4102,
    longitude: 76.695,
    contactPhone: null,
    operatingHours: null,
    isMarketDayVenue: false,
    marketDayOfWeek: null,
    ...overrides,
  };
}

function aCapacity(overrides: Partial<WarehouseCapacityResponse> = {}): WarehouseCapacityResponse {
  return {
    warehouseId: IDS.warehouseOoty,
    capacityKg: '50000.000',
    usedKg: '12500.000',
    availableKg: '37500.000',
    utilizationPercent: 25,
    ...overrides,
  };
}

interface RecordingRepo extends WarehousesRepo {
  lastList: ListArgs | null;
  lastFindScope: ScopedWhere | null;
  lastCapacityScope: ScopedWhere | null;
  lockedFor: string[];
  stored: Map<string, string | null>;
}

/** Records what the service asked for, so the test can assert on the filter. */
function fakeRepo(rows: WarehouseDetail[]): RecordingRepo {
  const repo: RecordingRepo = {
    lastList: null,
    lastFindScope: null,
    lastCapacityScope: null,
    lockedFor: [],
    stored: new Map(rows.map((row) => [row.id, row.capacityKg])),
    async list(_db: Executor, args: ListArgs): Promise<ListResult> {
      repo.lastList = args;
      return { items: rows, total: rows.length };
    },
    async findById(
      _db: Executor,
      id: string,
      scope: ScopedWhere,
    ): Promise<WarehouseDetail | null> {
      repo.lastFindScope = scope;
      return rows.find((row) => row.id === id) ?? null;
    },
    async findCapacity(
      _db: Executor,
      id: string,
      scope: ScopedWhere,
    ): Promise<WarehouseCapacityResponse | null> {
      repo.lastCapacityScope = scope;
      const capacity = repo.stored.get(id);
      if (capacity === undefined) return null;
      return aCapacity({ warehouseId: id, capacityKg: capacity });
    },
    async lockCapacity(_db: Executor, id: string, scope: ScopedWhere): Promise<CapacityRow | null> {
      repo.lastCapacityScope = scope;
      repo.lockedFor.push(id);
      const capacity = repo.stored.get(id);
      return capacity === undefined ? null : { capacityKg: capacity };
    },
    async setCapacity(_db: Executor, id: string, capacityKg: string): Promise<string> {
      repo.stored.set(id, capacityKg);
      return capacityKg;
    },
  };
  return repo;
}

const noopDb: Executor = {
  query: async () => {
    throw new Error('the fake repo should never reach the database');
  },
};

interface RecordedQuery {
  sql: string;
  params: unknown[];
}

/** Stands in for a transaction client: records every statement it is asked to run. */
function recordingTx(): { tx: Executor; queries: RecordedQuery[] } {
  const queries: RecordedQuery[] = [];
  const tx: Executor = {
    query: (async (sql: string, params: unknown[] = []) => {
      queries.push({ sql, params });
      return { rows: [{ id: newId() }], rowCount: 1 };
    }) as Executor['query'],
  };
  return { tx, queries };
}

const baseFilters: ListWarehousesQuery = { page: 1, pageSize: 20 };

describe('warehousesService.list', () => {
  it('returns a paginated envelope built from the repo result', async () => {
    const repo = fakeRepo([
      aDetail(),
      aDetail({ id: IDS.warehouseCoonoor, code: 'WH-COON' }),
    ]);
    const service = createWarehousesService({ repo, db: noopDb });

    const result = await service.list(aScope(), baseFilters);

    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.items.map((w) => w.code)).toEqual(['WH-OOTY', 'WH-COON']);
  });

  it('applies no SQL restriction for an "all" scope', async () => {
    const repo = fakeRepo([]);
    const service = createWarehousesService({ repo, db: noopDb });

    await service.list(aScope({ level: ScopeLevel.ALL }), baseFilters);

    expect(repo.lastList?.scope.sql).toBe('TRUE');
    expect(repo.lastList?.scope.params).toEqual([]);
  });

  it('confines a Sub Warehouse Admin to their assigned warehouse ids', async () => {
    const repo = fakeRepo([]);
    const service = createWarehousesService({ repo, db: noopDb });

    await service.list(
      aScope({
        level: ScopeLevel.OWN,
        roleCode: RoleCode.SUB_WH_ADMIN,
        warehouseIds: [IDS.warehouseOoty],
      }),
      baseFilters,
    );

    expect(repo.lastList?.scope.sql).toContain('w.id = ANY($1::uuid[])');
    expect(repo.lastList?.scope.params).toEqual([[IDS.warehouseOoty]]);
  });

  it('fails closed when a restricted scope produces no usable filter', async () => {
    const repo = fakeRepo([]);
    const service = createWarehousesService({ repo, db: noopDb });

    // `own` scope with nothing to scope BY must not read every row.
    await service.list(
      aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [] }),
      baseFilters,
    );

    expect(repo.lastList?.scope.sql).toBe('FALSE');
  });
});

describe('warehousesService.getById', () => {
  it('returns the warehouse when it is visible', async () => {
    const repo = fakeRepo([aDetail()]);
    const service = createWarehousesService({ repo, db: noopDb });

    const warehouse = await service.getById(aScope(), IDS.warehouseOoty);

    expect(warehouse.code).toBe('WH-OOTY');
  });

  it('raises NOT_FOUND — not FORBIDDEN — for a row outside the scope', async () => {
    const repo = fakeRepo([aDetail()]);
    const service = createWarehousesService({ repo, db: noopDb });

    await expect(service.getById(aScope(), IDS.warehouseCoonoor)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });

    // Explicitly: leaking 403 here would confirm the row exists.
    const error = await service.getById(aScope(), IDS.warehouseCoonoor).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).status).toBe(404);
  });

  it('numbers the scope placeholders after the id parameter', async () => {
    const repo = fakeRepo([aDetail()]);
    const service = createWarehousesService({ repo, db: noopDb });

    await service.getById(
      aScope({
        level: ScopeLevel.OWN,
        roleCode: RoleCode.SUB_WH_ADMIN,
        warehouseIds: [IDS.warehouseOoty],
      }),
      IDS.warehouseOoty,
    );

    // $1 is the id, so the scope fragment must start at $2.
    expect(repo.lastFindScope?.sql).toContain('$2');
  });
});

describe('warehousesService.getCapacity', () => {
  it('BR-66b: returns the repo derivation for a visible warehouse', async () => {
    const repo = fakeRepo([aDetail()]);
    const service = createWarehousesService({ repo, db: noopDb });

    const capacity = await service.getCapacity(aScope(), IDS.warehouseOoty);

    expect(capacity.warehouseId).toBe(IDS.warehouseOoty);
    expect(capacity.capacityKg).toBe('50000.000');
  });

  it('BR-66a: raises NOT_FOUND (404, never 403) for a warehouse outside the scope', async () => {
    const repo = fakeRepo([]);
    const service = createWarehousesService({ repo, db: noopDb });

    const error = await service.getCapacity(aScope(), IDS.warehouseCoonoor).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).status).toBe(404);
    expect((error as AppError).code).toBe('NOT_FOUND');
  });

  it('BR-66a: narrows a Sub Warehouse Admin to its own warehouse, numbered after the id', async () => {
    const repo = fakeRepo([aDetail()]);
    const service = createWarehousesService({ repo, db: noopDb });

    await service.getCapacity(
      aScope({
        level: ScopeLevel.OWN,
        roleCode: RoleCode.SUB_WH_ADMIN,
        warehouseIds: [IDS.warehouseOoty],
      }),
      IDS.warehouseOoty,
    );

    expect(repo.lastCapacityScope?.sql).toContain('w.id = ANY($2::uuid[])');
    expect(repo.lastCapacityScope?.params).toEqual([[IDS.warehouseOoty]]);
  });
});

describe('warehousesService.setCapacity', () => {
  const setScope = aScope({ permission: 'warehouse.capacity.set', roleCode: RoleCode.MAIN_WH_ADMIN });

  it('BR-66d: writes one audit row on the transaction client with before/after images of capacityKg only', async () => {
    const repo = fakeRepo([aDetail({ capacityKg: '30000.000' })]);
    const { tx, queries } = recordingTx();
    const service = createWarehousesService({
      repo,
      db: noopDb,
      transaction: (fn) => fn(tx),
    });

    await service.setCapacity(setScope, IDS.warehouseOoty, { capacityKg: '45000.500' });

    const audits = queries.filter((q) => q.sql.includes('INSERT INTO audit_log'));
    expect(audits).toHaveLength(1);
    const params = audits[0]?.params ?? [];
    expect(params[2]).toBe(RoleCode.MAIN_WH_ADMIN);
    expect(params[3]).toBe('warehouse.capacity.set');
    expect(params[4]).toBe('warehouse');
    expect(params[5]).toBe(IDS.warehouseOoty);
    expect(params[6]).toBe(IDS.warehouseOoty);
    expect(JSON.parse(String(params[8]))).toEqual({ capacityKg: '30000.000' });
    expect(JSON.parse(String(params[9]))).toEqual({ capacityKg: '45000.500' });
    expect(params[10]).toEqual(['capacityKg']);
  });

  it('BR-66d: an unknown warehouse is NOT_FOUND and writes no audit row and no update', async () => {
    const repo = fakeRepo([]);
    const { tx, queries } = recordingTx();
    const service = createWarehousesService({ repo, db: noopDb, transaction: (fn) => fn(tx) });

    await expect(
      service.setCapacity(setScope, IDS.warehouseCoonoor, { capacityKg: '100.000' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });

    expect(queries).toHaveLength(0);
    expect(repo.stored.size).toBe(0);
  });

  it('BR-66e: returns the updated capacity payload', async () => {
    const repo = fakeRepo([aDetail({ capacityKg: '30000.000' })]);
    const { tx } = recordingTx();
    const service = createWarehousesService({ repo, db: noopDb, transaction: (fn) => fn(tx) });

    const result = await service.setCapacity(setScope, IDS.warehouseOoty, {
      capacityKg: '45000.500',
    });

    expect(result.capacityKg).toBe('45000.500');
  });
});

describe('updateCapacityBody', () => {
  it.each([
    ['a decimal string', '45000.500'],
    ['an integer string', '1'],
    ['the largest value numeric(12,3) holds', '999999999.999'],
  ])('BR-66c: accepts %s', (_label, capacityKg) => {
    expect(updateCapacityBody.safeParse({ capacityKg }).success).toBe(true);
  });

  it.each([
    ['zero', '0'],
    ['zero with decimals', '0.000'],
    ['a negative value', '-5'],
    ['a JSON number instead of a decimal string', 12.5],
    ['more than 3 decimals', '1.2345'],
    ['more than numeric(12,3) can hold', '1000000000'],
    ['an exponent form', '1e3'],
    ['an empty string', ''],
    ['whitespace-padded input', ' 5 '],
    ['null', null],
  ])('BR-66c: rejects %s', (_label, capacityKg) => {
    expect(updateCapacityBody.safeParse({ capacityKg }).success).toBe(false);
  });

  it('BR-66c: rejects a missing capacityKg and unknown fields (strict body)', () => {
    expect(updateCapacityBody.safeParse({}).success).toBe(false);
    expect(updateCapacityBody.safeParse({ capacityKg: '5', isActive: false }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Database-gated. Every query the module owns runs against real Postgres.
// ---------------------------------------------------------------------------

function sole<T>(rows: T[]): T {
  const [row, ...rest] = rows;
  if (row === undefined || rest.length > 0) {
    throw new Error(`expected exactly one row, got ${rows.length}`);
  }
  return row;
}

describeIfDatabase('warehouses (PostgreSQL)', () => {
  let ready = false;
  let app: Express;
  let pool: pg.Pool;
  const ids = new Map<string, string>();

  const idOf = (code: string): string => {
    const id = ids.get(code);
    if (id === undefined) throw new Error(`warehouse ${code} is not seeded`);
    return id;
  };

  const subScope = (warehouseId: string): ReturnType<typeof aScope> =>
    aScope({
      level: ScopeLevel.OWN,
      roleCode: RoleCode.SUB_WH_ADMIN,
      permission: 'warehouse.own.view',
      warehouseIds: [warehouseId],
    });

  const tokenFor = (roles: Array<{ code: RoleCode; warehouseId?: string }>, sub: string): string =>
    signAccessToken({ sub, roles, farmerId: null, customerId: null });

  /** Runs `fn` on a client inside a transaction that is ALWAYS rolled back. */
  async function inRollback<T>(fn: (tx: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      return await fn(client);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  }

  /** A fresh warehouse + user + farmer + crop, all inside the caller's rolled-back tx. */
  async function seedBase(
    tx: pg.PoolClient,
    capacityKg: string,
  ): Promise<{ warehouseId: string; userId: string; farmerId: string; cropId: string }> {
    const rand = Math.floor(100000 + Math.random() * 900000);
    const warehouseId = newId();
    const userId = newId();
    const farmerUserId = newId();
    const farmerId = newId();
    const cropId = newId();
    await tx.query(
      `INSERT INTO warehouses (id, code, name, type, capacity_kg)
       VALUES ($1, $2, 'Capacity Test WH', 'SUB', $3)`,
      [warehouseId, `WH-T-${rand}`, capacityKg],
    );
    await tx.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status)
       VALUES ($1, $2, 'Capacity Admin', 'ADMIN', 'ACTIVE'),
              ($3, $4, 'Capacity Farmer', 'FARMER', 'ACTIVE')`,
      [userId, `+919811${rand}`, farmerUserId, `+919822${rand}`],
    );
    await tx.query(
      `INSERT INTO farmers (id, user_id, tohfa_farmer_id, application_status)
       VALUES ($1, $2, $3, 'APPROVED')`,
      [farmerId, farmerUserId, `FARM-${rand}`],
    );
    const category = sole(
      (await tx.query<{ id: string }>('SELECT id FROM categories LIMIT 1')).rows,
    );
    await tx.query(
      `INSERT INTO crop_master (id, category_id, slug, name) VALUES ($1, $2, $3, $4)`,
      [cropId, category.id, `crop-wh-${rand}`, `Capacity Carrot ${rand}`],
    );
    return { warehouseId, userId, farmerId, cropId };
  }

  async function seedBatch(
    tx: pg.PoolClient,
    base: { farmerId: string; cropId: string },
    warehouseId: string,
    qty: string,
    status: string,
  ): Promise<string> {
    const id = newId();
    await tx.query(
      `INSERT INTO inventory_batches
         (id, batch_code, warehouse_id, crop_id, grade, source_farmer_id,
          qty_received, qty_available, status)
       VALUES ($1, $2, $3, $4, 'GRADE_1', $5, $6, $6, $7)`,
      [id, `B-${id}`, warehouseId, base.cropId, base.farmerId, qty, status],
    );
    return id;
  }

  /** Service bound to the rolled-back transaction, for both reads and writes. */
  const serviceOn = (tx: pg.PoolClient): ReturnType<typeof createWarehousesService> =>
    createWarehousesService({ db: tx, transaction: (fn) => fn(tx) });

  beforeAll(async () => {
    ready = await databaseReady('warehouses');
    // A configured-but-unreachable database must fail loudly, not pass vacuously.
    expect(ready, 'DATABASE_URL is set but the `warehouses` table is not reachable').toBe(true);
    ({ pool } = await import('../../db/pool.js'));
    app = createApp();
    const seeded = await pool.query<{ id: string; code: string }>(
      `SELECT id, code FROM warehouses WHERE code IN ('WH-OOTY','WH-COON','WH-KOTA','WH-GUDA')`,
    );
    for (const row of seeded.rows) ids.set(row.code, row.id);
    expect(ids.size).toBe(4);
  });

  afterAll(async () => {
    const [{ closePool }, { closeRedis }] = await Promise.all([
      import('../../db/pool.js'),
      import('../../redis.js'),
    ]);
    await Promise.allSettled([closePool(), closeRedis()]);
  });

  it('runs the real list query against Postgres and returns the detail fields', async () => {
    const result = await createWarehousesService({ db: pool }).list(aScope(), { ...baseFilters, pageSize: 100 });

    const ooty = result.items.find((w) => w.code === 'WH-OOTY');
    expect(ooty).toMatchObject({
      id: idOf('WH-OOTY'),
      type: 'MAIN',
      capacityKg: '50000.000',
      city: 'Udhagamandalam',
      pincode: '643001',
      isMarketDayVenue: false,
      marketDayOfWeek: null,
      isActive: true,
    });
    expect(typeof ooty?.latitude).toBe('number');
    expect(typeof ooty?.longitude).toBe('number');
    expect(ooty).toHaveProperty('address');
    expect(ooty).toHaveProperty('contactPhone');
    expect(ooty).toHaveProperty('operatingHours');
    const guda = result.items.find((w) => w.code === 'WH-GUDA');
    expect(guda).toMatchObject({ isMarketDayVenue: true, marketDayOfWeek: 6 });
  });

  describe('BR-66a: a Sub Warehouse Admin reads only its own warehouse', () => {
    it('BR-66a: Sub reads its own warehouse and gets NOT_FOUND for each of the other three', async () => {
      const service = createWarehousesService({ db: pool });
      const own = idOf('WH-COON');

      const found = await service.getById(subScope(own), own);
      expect(found.code).toBe('WH-COON');

      for (const code of ['WH-OOTY', 'WH-KOTA', 'WH-GUDA']) {
        const error = await service.getById(subScope(own), idOf(code)).catch((e: unknown) => e);
        expect(error, code).toBeInstanceOf(AppError);
        expect((error as AppError).status, code).toBe(404);
        expect((error as AppError).code, code).toBe('NOT_FOUND');
      }
    });

    it('BR-66a: Main/Super/Tohfa scope (all) reads all four warehouses', async () => {
      const service = createWarehousesService({ db: pool });

      for (const code of ['WH-OOTY', 'WH-COON', 'WH-KOTA', 'WH-GUDA']) {
        const found = await service.getById(aScope({ permission: 'warehouse.own.view' }), idOf(code));
        expect(found.code).toBe(code);
      }
    });

    it('BR-66a: an unknown id is the same 404 as an out-of-scope id, with no existence hint', async () => {
      const service = createWarehousesService({ db: pool });
      const own = idOf('WH-COON');
      const other = idOf('WH-OOTY');
      const unknown = newId();

      const outOfScope = (await service.getById(subScope(own), other).catch((e: unknown) => e)) as AppError;
      const missing = (await service.getById(subScope(own), unknown).catch((e: unknown) => e)) as AppError;

      expect(outOfScope.status).toBe(404);
      expect(missing.status).toBe(404);
      // Identical apart from the id the caller itself supplied.
      expect(outOfScope.message.replace(other, '<id>')).toBe(missing.message.replace(unknown, '<id>'));
      expect(String(outOfScope.message)).not.toMatch(/ooty|exists|forbidden/i);
    });

    it('BR-66a: Sub capacity reads follow the same rule (own 200, others 404)', async () => {
      const service = createWarehousesService({ db: pool });
      const own = idOf('WH-COON');

      const capacity = await service.getCapacity(subScope(own), own);
      expect(capacity.warehouseId).toBe(own);
      for (const code of ['WH-OOTY', 'WH-KOTA', 'WH-GUDA']) {
        await expect(service.getCapacity(subScope(own), idOf(code)), code).rejects.toMatchObject({
          status: 404,
          code: 'NOT_FOUND',
        });
      }
    });

    it('BR-66a: through the real router a Sub token gets 200 for its own id and 404 problem+json for another', async () => {
      const token = tokenFor(
        [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: idOf('WH-COON') }],
        IDS.userSubWhAdmin,
      );

      const own = await request(app)
        .get(`/v1/warehouses/${idOf('WH-COON')}`)
        .set('Authorization', `Bearer ${token}`);
      expect(own.status).toBe(200);
      expect(own.body).toMatchObject({ code: 'WH-COON', capacityKg: '30000.000' });

      const other = await request(app)
        .get(`/v1/warehouses/${idOf('WH-OOTY')}`)
        .set('Authorization', `Bearer ${token}`);
      expect(other.status).toBe(404);
      expect(other.headers['content-type']).toContain('application/problem+json');
      expect(other.body).toMatchObject({ code: 'NOT_FOUND', status: 404 });
      expect(JSON.stringify(other.body)).not.toContain('Ooty');

      const ownCapacity = await request(app)
        .get(`/v1/warehouses/${idOf('WH-COON')}/capacity`)
        .set('Authorization', `Bearer ${token}`);
      expect(ownCapacity.status).toBe(200);

      const otherCapacity = await request(app)
        .get(`/v1/warehouses/${idOf('WH-KOTA')}/capacity`)
        .set('Authorization', `Bearer ${token}`);
      expect(otherCapacity.status).toBe(404);
    });

    it('BR-66a: through the real router the Sub list is 403 (no warehouse.all.view) and Main lists all four', async () => {
      const sub = await request(app)
        .get('/v1/warehouses')
        .set(
          'Authorization',
          `Bearer ${tokenFor([{ code: RoleCode.SUB_WH_ADMIN, warehouseId: idOf('WH-COON') }], IDS.userSubWhAdmin)}`,
        );
      expect(sub.status).toBe(403);
      expect(sub.body.meta).toMatchObject({ permission: 'warehouse.all.view' });

      const main = await request(app)
        .get('/v1/warehouses?pageSize=100')
        .set('Authorization', `Bearer ${tokenFor([{ code: RoleCode.MAIN_WH_ADMIN }], IDS.userSuperAdmin)}`);
      expect(main.status).toBe(200);
      const codes = (main.body.items as Array<{ code: string }>).map((w) => w.code);
      expect(codes).toEqual(expect.arrayContaining(['WH-OOTY', 'WH-COON', 'WH-KOTA', 'WH-GUDA']));
    });

    it('BR-66a: a Sub token with no assigned warehouse is rejected by the middleware, not shown everything', async () => {
      const res = await request(app)
        .get(`/v1/warehouses/${idOf('WH-OOTY')}`)
        .set('Authorization', `Bearer ${tokenFor([{ code: RoleCode.SUB_WH_ADMIN }], IDS.userSubWhAdmin)}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('WAREHOUSE_SCOPE_VIOLATION');
    });

    it.each([
      ['FARMER', [{ code: RoleCode.FARMER }]],
      ['CUSTOMER', [{ code: RoleCode.CUSTOMER }]],
      ['FARMER_ADMIN', [{ code: RoleCode.FARMER_ADMIN }]],
    ])('BR-66a: %s gets 403 on the detail and capacity reads', async (_name, roles) => {
      const token = tokenFor(roles, IDS.userFarmer);
      for (const path of [`/v1/warehouses/${idOf('WH-OOTY')}`, `/v1/warehouses/${idOf('WH-OOTY')}/capacity`]) {
        const res = await request(app).get(path).set('Authorization', `Bearer ${token}`);
        expect(res.status, path).toBe(403);
        expect(res.body.code, path).toBe('FORBIDDEN');
      }
    });

    it('BR-66a: anonymous callers get 401 on every warehouse route', async () => {
      const id = idOf('WH-OOTY');
      const calls = [
        request(app).get(`/v1/warehouses/${id}`),
        request(app).get(`/v1/warehouses/${id}/capacity`),
        request(app).patch(`/v1/warehouses/${id}/capacity`).send({ capacityKg: '10' }),
      ];
      for (const call of calls) {
        const res = await call;
        expect(res.status).toBe(401);
        expect(res.body.code).toBe('UNAUTHENTICATED');
      }
    });
  });

  describe('BR-66b: capacity is derived read-only from ACTIVE batches', () => {
    it('BR-66b: used is the SUM of ACTIVE qty_available of that warehouse only; other statuses and other warehouses are excluded', async () => {
      await inRollback(async (tx) => {
        const base = await seedBase(tx, '10000.000');
        await seedBatch(tx, base, base.warehouseId, '2500.125', 'ACTIVE');
        await seedBatch(tx, base, base.warehouseId, '1000.000', 'ACTIVE');
        await seedBatch(tx, base, base.warehouseId, '4000.250', 'EXPIRED');
        await seedBatch(tx, base, base.warehouseId, '50.000', 'WRITTEN_OFF');
        await seedBatch(tx, base, base.warehouseId, '30.000', 'DEPLETED');
        // Stock in ANOTHER warehouse must not leak into this one's total.
        await seedBatch(tx, base, idOf('WH-COON'), '999.000', 'ACTIVE');

        const capacity = await serviceOn(tx).getCapacity(aScope(), base.warehouseId);

        expect(capacity).toEqual({
          warehouseId: base.warehouseId,
          capacityKg: '10000.000',
          usedKg: '3500.125',
          availableKg: '6499.875',
          utilizationPercent: 35,
        });
      });
    });

    it('BR-66b: utilizationPercent is rounded to 2 decimals as a JSON number', async () => {
      await inRollback(async (tx) => {
        const base = await seedBase(tx, '30000.000');
        await seedBatch(tx, base, base.warehouseId, '1000.000', 'ACTIVE');

        const capacity = await serviceOn(tx).getCapacity(aScope(), base.warehouseId);

        // 1000 / 30000 * 100 = 3.3333... -> 3.33
        expect(capacity.utilizationPercent).toBe(3.33);
        expect(typeof capacity.utilizationPercent).toBe('number');
      });
    });

    it('BR-66b: over capacity is returned as stored arithmetic, not clamped', async () => {
      await inRollback(async (tx) => {
        const base = await seedBase(tx, '2000.000');
        await seedBatch(tx, base, base.warehouseId, '2500.125', 'ACTIVE');
        await seedBatch(tx, base, base.warehouseId, '1000.000', 'ACTIVE');

        const capacity = await serviceOn(tx).getCapacity(aScope(), base.warehouseId);

        expect(capacity.usedKg).toBe('3500.125');
        expect(capacity.availableKg).toBe('-1500.125');
        // 3500.125 / 2000 * 100 = 175.00625 -> 175.01
        expect(capacity.utilizationPercent).toBe(175.01);
      });
    });

    it('BR-66b: a warehouse with no ACTIVE batches has used 0.000 and the whole capacity available', async () => {
      await inRollback(async (tx) => {
        const base = await seedBase(tx, '10000.000');
        await seedBatch(tx, base, base.warehouseId, '70.000', 'DEPLETED');

        const capacity = await serviceOn(tx).getCapacity(aScope(), base.warehouseId);

        expect(capacity).toEqual({
          warehouseId: base.warehouseId,
          capacityKg: '10000.000',
          usedKg: '0.000',
          availableKg: '10000.000',
          utilizationPercent: 0,
        });
      });
    });

    it('BR-66b: through the real router GET /capacity returns the payload shape for a Main admin', async () => {
      const res = await request(app)
        .get(`/v1/warehouses/${idOf('WH-OOTY')}/capacity`)
        .set('Authorization', `Bearer ${tokenFor([{ code: RoleCode.MAIN_WH_ADMIN }], IDS.userSuperAdmin)}`);

      expect(res.status).toBe(200);
      expect(Object.keys(res.body).sort()).toEqual(
        ['availableKg', 'capacityKg', 'usedKg', 'utilizationPercent', 'warehouseId'],
      );
      expect(res.body.warehouseId).toBe(idOf('WH-OOTY'));
      expect(res.body.capacityKg).toBe('50000.000');
      expect(res.body.usedKg).toMatch(/^\d+\.\d{3}$/);
    });
  });

  describe('BR-66c / BR-66d / BR-66e: PATCH capacity', () => {
    const mainScope = aScope({ permission: 'warehouse.capacity.set', roleCode: RoleCode.MAIN_WH_ADMIN });

    it('BR-66d: writes exactly one audit row in the same transaction with masked before/after images, and the new value reads back', async () => {
      await inRollback(async (tx) => {
        const base = await seedBase(tx, '30000.000');
        const service = serviceOn(tx);

        const updated = await service.setCapacity(
          { ...mainScope, userId: base.userId },
          base.warehouseId,
          { capacityKg: '45000.5' },
        );

        expect(updated.capacityKg).toBe('45000.500');
        const readBack = await service.getCapacity(aScope(), base.warehouseId);
        expect(readBack.capacityKg).toBe('45000.500');
        const detail = await service.getById(aScope(), base.warehouseId);
        expect(detail.capacityKg).toBe('45000.500');

        const audits = (
          await tx.query<{
            action_code: string;
            actor_id: string;
            actor_role: string;
            entity_type: string;
            warehouse_id: string;
            outcome: string;
            before: Record<string, unknown>;
            after: Record<string, unknown>;
            changed_fields: string[];
          }>(
            `SELECT action_code, actor_id, actor_role, entity_type, warehouse_id, outcome,
                    before, after, changed_fields
               FROM audit_log WHERE entity_id = $1`,
            [base.warehouseId],
          )
        ).rows;
        const audit = sole(audits);
        expect(audit).toMatchObject({
          action_code: 'warehouse.capacity.set',
          actor_id: base.userId,
          actor_role: RoleCode.MAIN_WH_ADMIN,
          entity_type: 'warehouse',
          warehouse_id: base.warehouseId,
          outcome: 'ALLOWED',
          changed_fields: ['capacityKg'],
        });
        // Images carry the changed field only — no name, address, coordinates or phone.
        expect(audit.before).toEqual({ capacityKg: '30000.000' });
        expect(audit.after).toEqual({ capacityKg: '45000.500' });
      });
    });

    it('BR-66d: an unknown warehouse id is a 404 NOT_FOUND and writes no audit row', async () => {
      await inRollback(async (tx) => {
        const unknown = newId();
        await expect(
          serviceOn(tx).setCapacity(mainScope, unknown, { capacityKg: '100.000' }),
        ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });

        const count = sole(
          (await tx.query<{ n: string }>(
            `SELECT count(*)::text AS n FROM audit_log WHERE entity_id = $1`,
            [unknown],
          )).rows,
        );
        expect(count.n).toBe('0');
      });
    });

    it('BR-66e: changing capacity never touches inventory (batches and ledger unchanged), even when stock now exceeds capacity', async () => {
      await inRollback(async (tx) => {
        const base = await seedBase(tx, '10000.000');
        await seedBatch(tx, base, base.warehouseId, '2500.125', 'ACTIVE');
        const snapshot = async (): Promise<string> => {
          const batches = await tx.query(
            `SELECT id, qty_received::text, qty_available::text, status
               FROM inventory_batches WHERE warehouse_id = $1 ORDER BY id`,
            [base.warehouseId],
          );
          const ledger = await tx.query(
            `SELECT count(*)::text AS n FROM stock_ledger WHERE warehouse_id = $1`,
            [base.warehouseId],
          );
          return JSON.stringify([batches.rows, ledger.rows]);
        };
        const before = await snapshot();

        // Documented as NOT validated against current stock: 100 kg < 2500.125 kg held.
        const updated = await serviceOn(tx).setCapacity(
          { ...mainScope, userId: base.userId },
          base.warehouseId,
          { capacityKg: '100.000' },
        );

        expect(await snapshot()).toBe(before);
        expect(updated.usedKg).toBe('2500.125');
        expect(updated.availableKg).toBe('-2400.125');
      });
    });

    it('BR-66c: through the real router a Sub Warehouse Admin PATCH is 403 and changes nothing', async () => {
      const coon = idOf('WH-COON');
      const res = await request(app)
        .patch(`/v1/warehouses/${coon}/capacity`)
        .set(
          'Authorization',
          `Bearer ${tokenFor([{ code: RoleCode.SUB_WH_ADMIN, warehouseId: coon }], IDS.userSubWhAdmin)}`,
        )
        .send({ capacityKg: '1.000' });

      expect(res.status).toBe(403);
      expect(res.body.meta).toMatchObject({ permission: 'warehouse.capacity.set' });
      const row = sole(
        (await pool.query<{ capacity_kg: string }>(
          'SELECT capacity_kg FROM warehouses WHERE id = $1',
          [coon],
        )).rows,
      );
      expect(row.capacity_kg).toBe('30000.000');
    });

    it.each([
      ['FARMER', [{ code: RoleCode.FARMER }]],
      ['CUSTOMER', [{ code: RoleCode.CUSTOMER }]],
    ])('BR-66c: through the real router %s PATCH is 403', async (_name, roles) => {
      const res = await request(app)
        .patch(`/v1/warehouses/${idOf('WH-COON')}/capacity`)
        .set('Authorization', `Bearer ${tokenFor(roles, IDS.userFarmer)}`)
        .send({ capacityKg: '1.000' });
      expect(res.status).toBe(403);
    });

    it.each([
      ['zero', { capacityKg: '0' }],
      ['negative', { capacityKg: '-1' }],
      ['a JSON number', { capacityKg: 100 }],
      ['four decimals', { capacityKg: '1.0001' }],
      ['ten integer digits', { capacityKg: '1000000000' }],
      ['an empty body', {}],
      ['an unknown field', { capacityKg: '5', name: 'x' }],
    ])('BR-66c: through the real router a bad body (%s) is 422 VALIDATION_FAILED', async (_name, body) => {
      const res = await request(app)
        .patch(`/v1/warehouses/${idOf('WH-COON')}/capacity`)
        .set('Authorization', `Bearer ${tokenFor([{ code: RoleCode.SUPER_ADMIN }], IDS.userSuperAdmin)}`)
        .send(body);
      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    });

    it('BR-66c: through the real router a malformed id is 422 and an unknown id is 404 with no audit row', async () => {
      const token = tokenFor([{ code: RoleCode.SUPER_ADMIN }], IDS.userSuperAdmin);

      const malformed = await request(app)
        .patch('/v1/warehouses/not-a-uuid/capacity')
        .set('Authorization', `Bearer ${token}`)
        .send({ capacityKg: '5' });
      expect(malformed.status).toBe(422);

      const unknown = newId();
      const missing = await request(app)
        .patch(`/v1/warehouses/${unknown}/capacity`)
        .set('Authorization', `Bearer ${token}`)
        .send({ capacityKg: '5' });
      expect(missing.status).toBe(404);
      expect(missing.body.code).toBe('NOT_FOUND');
      const audits = sole(
        (await pool.query<{ n: string }>(
          `SELECT count(*)::text AS n FROM audit_log WHERE entity_id = $1`,
          [unknown],
        )).rows,
      );
      expect(audits.n).toBe('0');
    });
  });
});
