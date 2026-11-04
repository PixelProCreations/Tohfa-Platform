/**
 * BR-136 — community planting summary (TOHFA Calendar "What the community is growing").
 *
 * Unit tests drive the service against a fake repo; the route tests run the real middleware
 * chain (requireAuth -> requirePermission -> validate) with a stub service; the PostgreSQL tests
 * run the real SQL inside a rolled-back transaction, isolated by a private crop and a random
 * taluk so seeded or demo data can never change the expected numbers.
 */
import { randomInt } from 'node:crypto';
import express from 'express';
import request from 'supertest';
import type pg from 'pg';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { signAccessToken } from '../../auth/jwt.js';
import type { Executor } from '../../db/pool.js';
import { errorHandler, notFoundHandler } from '../../http/errorHandler.js';
import { AppError } from '../../http/problem.js';
import { loadRbac } from '../../rbac/loadRbac.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { insertCrop, insertFarmerWithPlot, requireDatabaseTables } from '../../test/dbFixtures.js';
import { aScope, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import type {
  CommunityPlantingFilters,
  CommunityPlantingRepo,
  CropFarmerPlantingRow,
  FilterCropRow,
  RegionFarmerCountRow,
} from './community-planting.repo.js';
import { createCommunityPlantingRouter } from './community-planting.routes.js';
import {
  plantingFiltersQuery,
  plantingSummaryQuery,
  type PlantingFiltersResponse,
  type PlantingSummaryResponse,
} from './community-planting.schema.js';
import {
  createCommunityPlantingService,
  type CommunityPlantingService,
} from './community-planting.service.js';

const CARROT = '40000000-0000-4000-8000-000000000001';
const POTATO = '40000000-0000-4000-8000-000000000002';
const BEANS = '40000000-0000-4000-8000-000000000003';
const LEEK = '40000000-0000-4000-8000-000000000004';
const NAMES: Record<string, string> = { [CARROT]: 'Carrot', [POTATO]: 'Potato', [BEANS]: 'French Beans', [LEEK]: 'Leek' };

const SUMMARY_KEYS = ['byCrop', 'filters', 'generatedAt', 'minGroupSize', 'other', 'totals'];
const TOTALS_KEYS = ['crops', 'farmers', 'totalPlantedKg'];
const CROP_ROW_KEYS = ['cropMasterId', 'cropName', 'farmers', 'quantityKg'];
const OTHER_KEYS = ['crops', 'farmers', 'quantityKg'];
const FILTERS_ECHO_KEYS = ['crop', 'month', 'region'];
const FILTERS_RESPONSE_KEYS = ['crops', 'minGroupSize', 'months', 'regions'];

/** One (crop, farmer) row; `kg` is converted to integer grams the way the SQL does. */
function row(cropMasterId: string, farmerKey: number, kg: number): CropFarmerPlantingRow {
  return { cropMasterId, cropName: NAMES[cropMasterId] ?? 'Unknown', farmerKey, quantityGrams: Math.round(kg * 1000) };
}

interface FakeRepoInput {
  minGroupSize?: unknown;
  rows?: CropFarmerPlantingRow[];
  regions?: RegionFarmerCountRow[];
  crops?: FilterCropRow[];
}

function fakeRepo(input: FakeRepoInput = {}) {
  const calls: CommunityPlantingFilters[] = [];
  const repo: CommunityPlantingRepo = {
    getMinGroupSize: vi.fn(async () => ('minGroupSize' in input ? input.minGroupSize : 3)),
    listCropFarmerPlantings: vi.fn(async (_db: Executor, filters: CommunityPlantingFilters) => {
      calls.push(filters);
      return input.rows ?? [];
    }),
    listRegionFarmerCounts: vi.fn(async () => input.regions ?? []),
    listActiveCrops: vi.fn(async () => input.crops ?? []),
  };
  return { repo, calls };
}

function farmerScope(): ResolvedScope {
  return aScope({
    level: ScopeLevel.ALL,
    roleCode: RoleCode.FARMER,
    farmerId: IDS.farmer,
    userId: IDS.userFarmer,
    permission: 'farmer.community.view_planting_summary',
  });
}

const db = {} as Executor;

function serviceWith(input: FakeRepoInput = {}) {
  const { repo, calls } = fakeRepo(input);
  return { service: createCommunityPlantingService({ repo, db }), repo, calls };
}

describe('community planting summary service (BR-136)', () => {
  it('BR-136a: suppresses a crop with fewer than the minimum distinct farmers', async () => {
    const { service } = serviceWith({
      minGroupSize: 3,
      rows: [row(CARROT, 1, 100), row(CARROT, 2, 200), row(CARROT, 3, 300), row(BEANS, 4, 50), row(BEANS, 5, 70)],
    });
    const res = await service.getPlantingSummary(farmerScope(), {});
    expect(res.byCrop).toEqual([{ cropMasterId: CARROT, cropName: 'Carrot', farmers: 3, quantityKg: 600 }]);
    // Two small-crop farmers do not reach 3 together either, so there is no Other bucket.
    expect(res.other).toBeNull();
    expect(res.minGroupSize).toBe(3);
  });

  it('BR-136a: a crop at exactly the minimum is released', async () => {
    const { service } = serviceWith({
      minGroupSize: 2,
      rows: [row(BEANS, 4, 50), row(BEANS, 5, 70)],
    });
    const res = await service.getPlantingSummary(farmerScope(), {});
    expect(res.byCrop).toEqual([{ cropMasterId: BEANS, cropName: 'French Beans', farmers: 2, quantityKg: 120 }]);
  });

  it('BR-136a: folds small crops into Other only when together they reach the minimum', async () => {
    const { service } = serviceWith({
      minGroupSize: 3,
      rows: [
        row(CARROT, 1, 100), row(CARROT, 2, 100), row(CARROT, 3, 100),
        row(BEANS, 4, 10), row(BEANS, 5, 20),
        row(LEEK, 6, 30),
      ],
    });
    const res = await service.getPlantingSummary(farmerScope(), {});
    expect(res.byCrop.map((c) => c.cropMasterId)).toEqual([CARROT]);
    // Other names no crop and carries no crop id: only how many crops, farmers and kg.
    expect(res.other).toEqual({ crops: 2, farmers: 3, quantityKg: 60 });
    expect(res.totals).toEqual({ farmers: 6, totalPlantedKg: 360, crops: 3 });
  });

  it('BR-136b: totals are computed over released groups only, so a suppressed crop cannot be recovered by subtraction', async () => {
    const { service } = serviceWith({
      minGroupSize: 3,
      rows: [row(CARROT, 1, 100), row(CARROT, 2, 200), row(CARROT, 3, 300), row(LEEK, 9, 4321)],
    });
    const res = await service.getPlantingSummary(farmerScope(), {});
    expect(res.totals).toEqual({ farmers: 3, totalPlantedKg: 600, crops: 1 });
    expect(JSON.stringify(res)).not.toContain('4321');
  });

  it('BR-136b: a farmer growing several released crops is counted once in the farmer total', async () => {
    const { service } = serviceWith({
      minGroupSize: 3,
      rows: [
        row(CARROT, 1, 10), row(CARROT, 2, 10), row(CARROT, 3, 10),
        row(POTATO, 1, 20), row(POTATO, 2, 20), row(POTATO, 3, 20), row(POTATO, 4, 20),
        // Other = {1, 7, 8}: farmer 1 is also in the released crops.
        row(BEANS, 1, 5), row(BEANS, 7, 5), row(LEEK, 8, 5),
      ],
    });
    const res = await service.getPlantingSummary(farmerScope(), {});
    expect(res.byCrop.map((c) => [c.cropMasterId, c.farmers])).toEqual([[POTATO, 4], [CARROT, 3]]);
    expect(res.other).toEqual({ crops: 2, farmers: 3, quantityKg: 15 });
    expect(res.totals).toEqual({ farmers: 6, totalPlantedKg: 125, crops: 4 });
  });

  it('BR-136: quantities are summed in integer grams, so 0.1 kg + 0.2 kg is exactly 0.3 kg', async () => {
    const { service } = serviceWith({
      minGroupSize: 2,
      rows: [row(CARROT, 1, 0.1), row(CARROT, 2, 0.2)],
    });
    const res = await service.getPlantingSummary(farmerScope(), {});
    expect(res.byCrop[0]?.quantityKg).toBe(0.3);
    expect(res.totals.totalPlantedKg).toBe(0.3);
  });

  it('BR-136: crops are ordered by farmers, then quantity (both descending), then name', async () => {
    const { service } = serviceWith({
      minGroupSize: 2,
      rows: [
        row(LEEK, 1, 10), row(LEEK, 2, 10),
        row(BEANS, 1, 10), row(BEANS, 2, 10),
        row(POTATO, 1, 50), row(POTATO, 2, 50),
        row(CARROT, 1, 1), row(CARROT, 2, 1), row(CARROT, 3, 1),
      ],
    });
    const res = await service.getPlantingSummary(farmerScope(), {});
    expect(res.byCrop.map((c) => c.cropName)).toEqual(['Carrot', 'Potato', 'French Beans', 'Leek']);
  });

  it('BR-136c: the minimum group size comes from system_config; changing it changes what is released', async () => {
    const rows = [row(CARROT, 1, 1), row(CARROT, 2, 1), row(CARROT, 3, 1), row(CARROT, 4, 1)];
    expect((await serviceWith({ minGroupSize: 4, rows }).service.getPlantingSummary(farmerScope(), {})).byCrop).toHaveLength(1);
    expect((await serviceWith({ minGroupSize: 5, rows }).service.getPlantingSummary(farmerScope(), {})).byCrop).toHaveLength(0);
  });

  it('BR-136c: a missing or unusable threshold is 503 COMMUNITY_PLANTING_NOT_CONFIGURED and no planting data is read (no hidden fallback)', async () => {
    for (const bad of [undefined, null, 0, 1, 2.5, -3, '5', true, { k: 5 }]) {
      const { service, repo } = serviceWith({ minGroupSize: bad });
      const error = await service.getPlantingSummary(farmerScope(), {}).catch((e: unknown) => e);
      expect(error, `value ${JSON.stringify(bad)}`).toBeInstanceOf(AppError);
      expect((error as AppError).status).toBe(503);
      expect((error as AppError).code).toBe('COMMUNITY_PLANTING_NOT_CONFIGURED');
      expect(repo.listCropFarmerPlantings).not.toHaveBeenCalled();

      const filtersError = await service.getPlantingFilters(farmerScope()).catch((e: unknown) => e);
      expect(filtersError).toBeInstanceOf(AppError);
      expect((filtersError as AppError).status).toBe(503);
      expect((filtersError as AppError).code).toBe('COMMUNITY_PLANTING_NOT_CONFIGURED');
      expect(repo.listRegionFarmerCounts).not.toHaveBeenCalled();
      expect(repo.listActiveCrops).not.toHaveBeenCalled();
    }
  });

  it('BR-136d: never returns farmer or farm identifiers, even when the repo row carries them (allow-list serializer)', async () => {
    const leaky = (r: CropFarmerPlantingRow) =>
      ({
        ...r,
        farmerId: '30000000-0000-4000-8000-0000000000ff',
        farmName: 'Secret Estate',
        village: 'Hidden Village',
        plotId: '50000000-0000-4000-8000-0000000000ff',
        centroidLat: 11.4064,
      }) as CropFarmerPlantingRow;
    const { service } = serviceWith({
      minGroupSize: 2,
      rows: [row(CARROT, 1, 10), row(CARROT, 2, 10), row(BEANS, 3, 1), row(LEEK, 4, 1)].map(leaky),
      regions: [{ region: 'Kotagiri', farmers: 9, farmerId: 'x', village: 'Hidden Village' } as RegionFarmerCountRow],
      crops: [{ cropMasterId: CARROT, cropName: 'Carrot', farmName: 'Secret Estate' } as FilterCropRow],
    });

    const res = await service.getPlantingSummary(farmerScope(), {});
    expect(Object.keys(res).sort()).toEqual(SUMMARY_KEYS);
    expect(Object.keys(res.totals).sort()).toEqual(TOTALS_KEYS);
    expect(Object.keys(res.filters).sort()).toEqual(FILTERS_ECHO_KEYS);
    for (const crop of res.byCrop) expect(Object.keys(crop).sort()).toEqual(CROP_ROW_KEYS);
    expect(res.other).not.toBeNull();
    expect(Object.keys(res.other!).sort()).toEqual(OTHER_KEYS);

    const filters = await service.getPlantingFilters(farmerScope());
    expect(Object.keys(filters).sort()).toEqual(FILTERS_RESPONSE_KEYS);
    expect(filters.regions).toEqual(['Kotagiri']);
    expect(filters.crops).toEqual([{ cropMasterId: CARROT, cropName: 'Carrot' }]);

    const wire = JSON.stringify([res, filters]);
    for (const secret of ['farmerId', 'farmName', 'Secret Estate', 'Hidden Village', 'plotId', 'centroidLat', '11.4064', '0000000000ff', 'farmerKey']) {
      expect(wire, secret).not.toContain(secret);
    }
  });

  it('BR-136e: crop, month and region filters reach the repo and are echoed back', async () => {
    const { service, calls } = serviceWith({ minGroupSize: 3 });
    const res = await service.getPlantingSummary(farmerScope(), { crop: CARROT, month: 4, region: 'Kotagiri' });
    expect(calls).toEqual([{ cropId: CARROT, month: 4, region: 'Kotagiri' }]);
    expect(res.filters).toEqual({ crop: CARROT, month: 4, region: 'Kotagiri' });

    const { service: all, calls: allCalls } = serviceWith({ minGroupSize: 3 });
    const unfiltered = await all.getPlantingSummary(farmerScope(), {});
    expect(allCalls).toEqual([{}]);
    expect(unfiltered.filters).toEqual({ crop: null, month: null, region: null });
  });

  it('BR-136: no matching plantings is an empty summary, not an error', async () => {
    const { service } = serviceWith({ minGroupSize: 3, rows: [] });
    const res = await service.getPlantingSummary(farmerScope(), { month: 7 });
    expect(res.totals).toEqual({ farmers: 0, totalPlantedKg: 0, crops: 0 });
    expect(res.byCrop).toEqual([]);
    expect(res.other).toBeNull();
  });

  it('BR-136f: filter options list every month, the active crops, and only regions that reach the minimum', async () => {
    const { service } = serviceWith({
      minGroupSize: 3,
      regions: [
        { region: 'Coonoor', farmers: 3 },
        { region: 'Gudalur', farmers: 2 },
        { region: 'Kotagiri', farmers: 12 },
      ],
      crops: [{ cropMasterId: CARROT, cropName: 'Carrot' }, { cropMasterId: POTATO, cropName: 'Potato' }],
    });
    const res = await service.getPlantingFilters(farmerScope());
    expect(res.months).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(res.regions).toEqual(['Coonoor', 'Kotagiri']);
    expect(res.crops).toEqual([{ cropMasterId: CARROT, cropName: 'Carrot' }, { cropMasterId: POTATO, cropName: 'Potato' }]);
    expect(res.minGroupSize).toBe(3);
  });
});

// ---------------------------------------------------------------------------------------------
// Routes: the real middleware chain with a stub service.
// ---------------------------------------------------------------------------------------------

describe('community planting routes (BR-136g)', () => {
  const summary: PlantingSummaryResponse = {
    generatedAt: '2026-11-02T00:00:00.000Z',
    filters: { crop: null, month: null, region: null },
    minGroupSize: 3,
    totals: { farmers: 0, totalPlantedKg: 0, crops: 0 },
    byCrop: [],
    other: null,
  };
  const filters: PlantingFiltersResponse = { minGroupSize: 3, crops: [], months: [1], regions: [] };
  const seen: unknown[] = [];
  const stub: CommunityPlantingService = {
    getPlantingSummary: async (_scope, query) => {
      seen.push(query);
      return summary;
    },
    getPlantingFilters: async () => filters,
  };
  const app = express();
  app.use('/v1/farmers/community', createCommunityPlantingRouter(stub));
  app.use(notFoundHandler);
  app.use(errorHandler);

  const token = (roles: Array<{ code: RoleCode; warehouseId?: string; zoneId?: string }>, farmerId: string | null = null) =>
    `Bearer ${signAccessToken({ sub: newId(), roles, farmerId, customerId: null })}`;
  const SUMMARY = '/v1/farmers/community/planting-summary';
  const FILTERS = '/v1/farmers/community/planting-filters';

  it('BR-136g: both routes are 401 without a token', async () => {
    for (const path of [SUMMARY, FILTERS]) {
      const res = await request(app).get(path);
      expect(res.status, path).toBe(401);
    }
  });

  it('BR-136g: every role is 403 while farmer.community.view_planting_summary is granted to no role (owner decision pending), and the service is never reached', async () => {
    // The cross-farmer grant conflicts with BR-36 (no cross-user visibility) and is not decided
    // (rules.md open contradiction 34), so docs/rbac.json grants it to nobody. When the owner
    // decides, this test changes together with the grant, deliberately.
    const everyRole = [
      token([{ code: RoleCode.FARMER }], IDS.farmer),
      token([{ code: RoleCode.FARMER_ADMIN, zoneId: IDS.zoneNorth }]),
      token([{ code: RoleCode.TOHFA_ADMIN }]),
      token([{ code: RoleCode.SUPER_ADMIN }]),
      token([{ code: RoleCode.CUSTOMER }]),
      token([{ code: RoleCode.SUB_WH_ADMIN, warehouseId: IDS.warehouseOoty }]),
      token([{ code: RoleCode.MAIN_WH_ADMIN }]),
    ];
    seen.length = 0;
    for (const auth of everyRole) {
      for (const path of [SUMMARY, FILTERS]) {
        const res = await request(app).get(path).set('Authorization', auth);
        expect(res.status, path).toBe(403);
        expect(res.body.code).toBe('FORBIDDEN');
      }
    }
    expect(seen).toEqual([]);
  });

  it('BR-136g: the permission exists in docs/rbac.json and every role\'s grant is none', () => {
    const rbac = loadRbac();
    expect(rbac.document.permissions.some((p) => p.code === 'farmer.community.view_planting_summary')).toBe(true);
    for (const role of Object.values(RoleCode)) {
      expect(rbac.grantFor('farmer.community.view_planting_summary', role), role).toBe(ScopeLevel.NONE);
    }
  });

  it('BR-136g: query parameters are validated by the route schemas (strict, coerced)', () => {
    // The 403 above comes before validation for every role today, so the schemas the router
    // passes to validate() are exercised directly.
    for (const bad of ['month=13', 'month=0', 'month=abc', 'month=4.5', 'crop=not-a-uuid', 'region=', 'farmerId=x']) {
      const query = Object.fromEntries(new URLSearchParams(bad));
      expect(plantingSummaryQuery.safeParse(query).success, bad).toBe(false);
    }
    expect(plantingFiltersQuery.safeParse({ region: 'x' }).success).toBe(false);
    expect(plantingFiltersQuery.safeParse({}).success).toBe(true);

    const ok = plantingSummaryQuery.safeParse({ crop: CARROT, month: '4', region: ' Kotagiri ' });
    expect(ok.success).toBe(true);
    expect(ok.data).toEqual({ crop: CARROT, month: 4, region: 'Kotagiri' });
  });
});

// ---------------------------------------------------------------------------------------------
// PostgreSQL: the real SQL, rolled back.
// ---------------------------------------------------------------------------------------------

describeIfDatabase('community planting summary (PostgreSQL, rolled back) — BR-136', () => {
  let ready = false;
  let pool: pg.Pool;

  beforeAll(async () => {
    ready = await requireDatabaseTables('farm_crops', 'system_config', 'farmers');
    if (!ready) return;
    ({ pool } = await import('../../db/pool.js'));
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

  const letters = (n: number) => Array.from({ length: n }, () => String.fromCharCode(97 + randomInt(0, 26))).join('');

  interface Planting {
    cropId: string;
    status?: 'PLANNED' | 'GROWING' | 'HARVESTED' | 'FAILED';
    plantedOn?: string | null;
    yieldKg?: number | null;
    deleted?: boolean;
  }

  /** An approved (unless told otherwise) farmer with one farm in `taluk`, one plot per planting. */
  async function farmer(
    tx: Executor,
    taluk: string | null,
    plantings: Planting[],
    status: 'APPROVED' | 'SUBMITTED' = 'APPROVED',
  ): Promise<{ farmerId: string; farmId: string }> {
    const fx = await insertFarmerWithPlot(tx);
    await tx.query(`UPDATE farmers SET application_status = $2 WHERE id = $1`, [fx.farmerId, status]);
    await tx.query(`UPDATE farms SET taluk = $2, name = 'BR-136 Secret Farm' WHERE id = $1`, [fx.farmId, taluk]);
    for (const [i, p] of plantings.entries()) {
      const plotId = i === 0 ? fx.plotId : newId();
      if (i > 0) await tx.query(`INSERT INTO plots (id, farm_id, name) VALUES ($1, $2, $3)`, [plotId, fx.farmId, `Plot ${i}`]);
      await tx.query(
        `INSERT INTO farm_crops (plot_id, crop_id, planted_on, expected_yield_kg, status, deleted_at)
         VALUES ($1, $2, $3::date, $4, $5, CASE WHEN $6 THEN now() END)`,
        [plotId, p.cropId, p.plantedOn ?? null, p.yieldKg ?? null, p.status ?? 'GROWING', p.deleted === true],
      );
    }
    return fx;
  }

  const setK = (tx: Executor, k: number) =>
    tx.query(
      `INSERT INTO system_config (key, value, data_type) VALUES ('community_planting_min_farmers', $1::jsonb, 'number')
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [JSON.stringify(k)],
    );

  it('BR-136 (PostgreSQL): counts approved farmers active plantings only, applies k, month and a normalised region, and leaks no identity', async (ctx) => {
    if (!ready) return ctx.skip();
    await inRollback(async (tx) => {
      await setK(tx, 3);
      const cropA = await insertCrop(tx);
      const cropB = await insertCrop(tx);
      const taluk = `Fxt${letters(10)}`; // initcap(lower()) keeps this exact spelling
      const lonely = `Fxt${letters(10)}`;

      const f1 = await farmer(tx, taluk, [
        { cropId: cropA, plantedOn: '2026-04-10', yieldKg: 100.5 },
        { cropId: cropB, status: 'PLANNED', plantedOn: '2026-05-02', yieldKg: 40 },
      ]);
      await farmer(tx, taluk.toLowerCase(), [
        { cropId: cropA, plantedOn: '2026-04-20', yieldKg: 200 },
        { cropId: cropB, status: 'PLANNED', plantedOn: '2026-05-03', yieldKg: 60 },
      ]);
      // Stored with stray spaces and upper case: still the same region.
      await farmer(tx, `  ${taluk.toUpperCase()} `, [{ cropId: cropA, plantedOn: '2025-04-01', yieldKg: 300 }]);
      // Excluded: harvested, failed, soft-deleted planting, and a farmer not yet approved.
      await farmer(tx, taluk, [{ cropId: cropA, status: 'HARVESTED', plantedOn: '2026-04-11', yieldKg: 999 }]);
      await farmer(tx, taluk, [{ cropId: cropA, status: 'FAILED', plantedOn: '2026-04-11', yieldKg: 999 }]);
      await farmer(tx, taluk, [{ cropId: cropA, plantedOn: '2026-04-11', yieldKg: 999, deleted: true }]);
      await farmer(tx, taluk, [{ cropId: cropA, plantedOn: '2026-04-11', yieldKg: 999 }], 'SUBMITTED');
      // A region with a single farmer.
      await farmer(tx, lonely, [{ cropId: cropA, plantedOn: '2026-04-12', yieldKg: 7 }]);

      const service = createCommunityPlantingService({ db: tx });
      const scope = farmerScope();

      // Region filter (asked for in lower case): crop A has 3 farmers, crop B only 2 -> suppressed.
      const region = await service.getPlantingSummary(scope, { region: taluk.toLowerCase() });
      expect(region.byCrop).toEqual([{ cropMasterId: cropA, cropName: 'Fixture Crop', farmers: 3, quantityKg: 600.5 }]);
      expect(region.other).toBeNull();
      expect(region.totals).toEqual({ farmers: 3, totalPlantedKg: 600.5, crops: 1 });
      expect(region.minGroupSize).toBe(3);

      // Month is the month of planted_on, any year: April has crop A (3 farmers, incl. 2025-04-01).
      const april = await service.getPlantingSummary(scope, { region: taluk, month: 4 });
      expect(april.byCrop.map((c) => [c.cropMasterId, c.farmers])).toEqual([[cropA, 3]]);
      const may = await service.getPlantingSummary(scope, { region: taluk, month: 5 });
      expect(may.byCrop).toEqual([]);
      expect(may.totals).toEqual({ farmers: 0, totalPlantedKg: 0, crops: 0 });

      // Crop filter across every region: the lonely farmer joins crop A (4 farmers).
      const byCropA = await service.getPlantingSummary(scope, { crop: cropA });
      expect(byCropA.byCrop).toEqual([{ cropMasterId: cropA, cropName: 'Fixture Crop', farmers: 4, quantityKg: 607.5 }]);

      // Lowering k to 2 releases crop B in the region.
      await setK(tx, 2);
      const k2 = await service.getPlantingSummary(scope, { region: taluk });
      expect(k2.byCrop.map((c) => [c.cropMasterId, c.farmers, c.quantityKg])).toEqual([[cropA, 3, 600.5], [cropB, 2, 100]]);
      await setK(tx, 3);

      // Filter options: the region with 3 farmers is listed, the lonely one is not.
      const options = await service.getPlantingFilters(scope);
      expect(options.regions).toContain(taluk);
      expect(options.regions).not.toContain(lonely);
      expect(options.crops.map((c) => c.cropMasterId)).toEqual(expect.arrayContaining([cropA, cropB]));

      const wire = JSON.stringify([region, april, byCropA, k2, options]);
      expect(wire).not.toContain(f1.farmerId);
      expect(wire).not.toContain(f1.farmId);
      expect(wire).not.toContain('Secret Farm');

      // A missing key is 503, never a silent default.
      await tx.query(`DELETE FROM system_config WHERE key = 'community_planting_min_farmers'`);
      const error = await service.getPlantingSummary(scope, {}).catch((e: unknown) => e);
      expect((error as AppError).status).toBe(503);
      expect((error as AppError).code).toBe('COMMUNITY_PLANTING_NOT_CONFIGURED');
    });
  });

  it('BR-136c (PostgreSQL): no migration or seed ships a guessed threshold, so both endpoints fail closed until the owner sets it', async (ctx) => {
    if (!ready) return ctx.skip();
    // The value is an owner decision (rules.md open contradiction 34). When the owner provides
    // it, a new migration inserts it and this test changes with it.
    const res = await pool.query(`SELECT 1 FROM system_config WHERE key = 'community_planting_min_farmers'`);
    expect(res.rows).toHaveLength(0);

    const service = createCommunityPlantingService();
    for (const call of [() => service.getPlantingSummary(farmerScope(), {}), () => service.getPlantingFilters(farmerScope())]) {
      const error = await call().catch((e: unknown) => e);
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).status).toBe(503);
      expect((error as AppError).code).toBe('COMMUNITY_PLANTING_NOT_CONFIGURED');
    }
  });
});
