/**
 * Crops tests (BR-46).
 *
 *  1. SERVICE tests against a stateful in-memory fake repo. The fake honours
 *     the same contract as the real repo (ownership derived via plots ->
 *     farms.farmer_id, BR-46's partial unique index simulated as a Postgres
 *     23505 unique-violation error), so the tests assert what the service
 *     asks for AND what the caller gets back.
 *  2. RBAC sanity checks against the real docs/rbac.json.
 *  3. ONE integration block against a real pool, soft-skipped when the crops
 *     migration has not run, proving the repo SQL parses against 0004/0023.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Request, Response } from 'express';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { loadRbac } from '../../rbac/loadRbac.js';
import { requirePermission, type ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, anActor, aFarmer, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import { insertCrop, insertFarmerWithPlot, requireDatabaseTables } from '../../test/dbFixtures.js';
import type {
  CreateFarmCropData,
  CropsRepo,
  ListFarmCropsArgs,
  UpdateCropMasterPatch,
  UpdateFarmCropPatch,
} from './crops.repo.js';
import type { CreateFarmCropBody, CropMasterResponse, FarmCropResponse } from './crops.schema.js';
import { createCropsService, createCropTaxonomyAdminService, type TransactionRunner } from './crops.service.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FARMER_A = IDS.farmer;
const FARMER_B = '30000000-0000-4000-8000-000000000002';
const PLOT_A = '50000000-0000-4000-8000-00000000000a';
const PLOT_B = '50000000-0000-4000-8000-00000000000b';
const CROP_MASTER_CARROT = '70000000-0000-4000-8000-00000000000a';
const CROP_MASTER_TOMATO = '70000000-0000-4000-8000-00000000000b';
const CATEGORY_ID = '80000000-0000-4000-8000-000000000001';

function farmerScope(farmerId: string, permission = 'farmer.crops.view_own'): ResolvedScope {
  return aScope({
    level: ScopeLevel.OWN,
    permission,
    roleCode: RoleCode.FARMER,
    farmerId,
    userId: newId(),
  });
}

const adminScope: ResolvedScope = aScope({
  level: ScopeLevel.ALL,
  permission: 'admin.crop_taxonomy.manage',
  roleCode: RoleCode.TOHFA_ADMIN,
  userId: IDS.userTohfaAdmin,
});

interface StoredFarmCrop {
  id: string;
  plotId: string;
  cropMasterId: string;
  status: 'PLANNED' | 'GROWING' | 'HARVESTED' | 'FAILED';
  plantedOn: string | null;
  expectedHarvestOn: string | null;
  actualHarvestOn: string | null;
  expectedYieldKg: number | null;
  actualYieldKg: number | null;
  seedVariety: string | null;
  seedCompany: string | null;
  seedQuantity: number | null;
  seedQuantityUnit: string | null;
  seedCostPaise: number | null;
  expectedGrade: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

/** Thrown by the fake repo to simulate the real `uq_farm_crops_one_growing_per_plot` unique-violation (pg code 23505). */
class FakeUniqueViolation extends Error {
  readonly code = '23505';
}

/**
 * Stateful fake. Mirrors the real repo's ownership derivation (plots ->
 * farms.farmer_id) and BR-46's partial unique index (one live GROWING crop
 * per plot), so a test against this fake proves the same thing a test
 * against the real database would.
 */
function createFakeRepo() {
  const plots = new Map<string, string>([
    [PLOT_A, FARMER_A],
    [PLOT_B, FARMER_B],
  ]);
  const cropMaster = new Map<string, CropMasterResponse>([
    [
      CROP_MASTER_CARROT,
      {
        id: CROP_MASTER_CARROT,
        slug: 'carrot',
        name: 'Carrot',
        nameTa: null,
        categoryId: CATEGORY_ID,
        botanicalName: null,
        defaultUnit: 'kg',
        seasonMonths: null,
        shelfLifeDays: null,
        iconKey: null,
        isActive: true,
      },
    ],
    [
      CROP_MASTER_TOMATO,
      {
        id: CROP_MASTER_TOMATO,
        slug: 'tomato',
        name: 'Tomato',
        nameTa: null,
        categoryId: CATEGORY_ID,
        botanicalName: null,
        defaultUnit: 'kg',
        seasonMonths: null,
        shelfLifeDays: null,
        iconKey: null,
        isActive: true,
      },
    ],
  ]);
  const crops = new Map<string, StoredFarmCrop>();

  const calls = {
    listFarmCropsArgs: [] as ListFarmCropsArgs[],
    updateFarmCropExecutors: [] as Executor[],
  };

  const toResponse = (c: StoredFarmCrop): FarmCropResponse => {
    const cm = cropMaster.get(c.cropMasterId)!;
    return {
      id: c.id,
      plotId: c.plotId,
      cropMasterId: c.cropMasterId,
      cropName: cm.name,
      cropNameTa: cm.nameTa,
      cropIconKey: cm.iconKey,
      status: c.status,
      plantedOn: c.plantedOn,
      expectedHarvestOn: c.expectedHarvestOn,
      actualHarvestOn: c.actualHarvestOn,
      expectedYieldKg: c.expectedYieldKg,
      actualYieldKg: c.actualYieldKg,
      seedVariety: c.seedVariety,
      seedCompany: c.seedCompany,
      seedQuantity: c.seedQuantity,
      seedQuantityUnit: c.seedQuantityUnit as FarmCropResponse['seedQuantityUnit'],
      seedCostPaise: c.seedCostPaise,
      expectedGrade: c.expectedGrade as FarmCropResponse['expectedGrade'],
      notes: c.notes,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt === null ? null : c.updatedAt.toISOString(),
    };
  };

  const findOwned = (farmerId: string, farmCropId: string): StoredFarmCrop | null => {
    const c = crops.get(farmCropId);
    if (c === undefined) return null;
    return plots.get(c.plotId) === farmerId ? c : null;
  };

  const repo: CropsRepo = {
    async isPlotOwnedByFarmer(_db, plotId, farmerId) {
      return plots.get(plotId) === farmerId;
    },

    async createFarmCrop(_db, data: CreateFarmCropData) {
      const id = newId();
      crops.set(id, {
        id,
        plotId: data.plotId,
        cropMasterId: data.cropMasterId,
        status: 'PLANNED',
        plantedOn: data.plantedOn ?? null,
        expectedHarvestOn: data.expectedHarvestOn ?? null,
        actualHarvestOn: null,
        expectedYieldKg: data.expectedYieldKg ?? null,
        actualYieldKg: null,
        seedVariety: data.seedVariety ?? null,
        seedCompany: data.seedCompany ?? null,
        seedQuantity: data.seedQuantity ?? null,
        seedQuantityUnit: data.seedQuantityUnit ?? null,
        seedCostPaise: data.seedCostPaise ?? null,
        expectedGrade: data.expectedGrade ?? null,
        notes: data.notes ?? null,
        createdAt: new Date(),
        updatedAt: null,
      });
      return id;
    },

    async findFarmCrop(_db, farmerId, farmCropId) {
      const c = findOwned(farmerId, farmCropId);
      return c === null ? null : toResponse(c);
    },

    async listFarmCrops(_db, args) {
      calls.listFarmCropsArgs.push(args);
      const items = [...crops.values()]
        .filter((c) => c.plotId === args.plotId)
        .filter((c) => args.status === undefined || c.status === args.status)
        .map(toResponse);
      return { items, next: null };
    },

    async updateFarmCrop(db, farmerId, farmCropId, patch: UpdateFarmCropPatch) {
      calls.updateFarmCropExecutors.push(db);
      const c = findOwned(farmerId, farmCropId);
      if (c === null) return false;

      // BR-46: the real partial unique index only fires when the row's FINAL
      // status is GROWING. Simulate that exactly: another live crop on the
      // same plot already GROWING blocks this one from becoming GROWING too.
      if (patch.status === 'GROWING') {
        const conflict = [...crops.values()].some(
          (other) => other.id !== c.id && other.plotId === c.plotId && other.status === 'GROWING',
        );
        if (conflict) throw new FakeUniqueViolation('duplicate key value violates unique constraint');
      }

      if (patch.status !== undefined) c.status = patch.status;
      if (patch.plantedOn !== undefined) c.plantedOn = patch.plantedOn;
      if (patch.expectedHarvestOn !== undefined) c.expectedHarvestOn = patch.expectedHarvestOn;
      if (patch.actualHarvestOn !== undefined) c.actualHarvestOn = patch.actualHarvestOn;
      if (patch.expectedYieldKg !== undefined) c.expectedYieldKg = patch.expectedYieldKg;
      if (patch.actualYieldKg !== undefined) c.actualYieldKg = patch.actualYieldKg;
      if (patch.seedVariety !== undefined) c.seedVariety = patch.seedVariety;
      if (patch.seedCompany !== undefined) c.seedCompany = patch.seedCompany;
      if (patch.seedQuantity !== undefined) c.seedQuantity = patch.seedQuantity;
      if (patch.seedQuantityUnit !== undefined) c.seedQuantityUnit = patch.seedQuantityUnit;
      if (patch.seedCostPaise !== undefined) c.seedCostPaise = patch.seedCostPaise;
      if (patch.expectedGrade !== undefined) c.expectedGrade = patch.expectedGrade;
      if (patch.notes !== undefined) c.notes = patch.notes;
      c.updatedAt = new Date();
      return true;
    },

    async getPlotRotationHistory(_db, plotId) {
      return [...crops.values()]
        .filter((c) => c.plotId === plotId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((c) => ({
          farmCropId: c.id,
          cropName: cropMaster.get(c.cropMasterId)!.name,
          cropIconKey: cropMaster.get(c.cropMasterId)!.iconKey,
          plantedOn: c.plantedOn,
          actualHarvestOn: c.actualHarvestOn,
          status: c.status,
        }));
    },

    async listCropMaster(_db, activeOnly) {
      return [...cropMaster.values()].filter((c) => !activeOnly || c.isActive);
    },

    async findCropMaster(_db, id) {
      const c = cropMaster.get(id);
      return c === undefined ? null : { ...c };
    },

    async findCropMasterBySlug(_db, slug) {
      const c = [...cropMaster.values()].find((x) => x.slug === slug);
      return c === undefined ? null : { ...c };
    },

    async createCropMaster(_db, data) {
      const c: CropMasterResponse = {
        id: newId(),
        slug: data.slug,
        name: data.name,
        nameTa: data.nameTa ?? null,
        categoryId: data.categoryId,
        botanicalName: data.botanicalName ?? null,
        defaultUnit: data.defaultUnit,
        seasonMonths: data.seasonMonths ?? null,
        shelfLifeDays: data.shelfLifeDays ?? null,
        iconKey: data.iconKey ?? null,
        isActive: true,
      };
      cropMaster.set(c.id, c);
      return { ...c };
    },

    async updateCropMaster(_db, id, patch: UpdateCropMasterPatch) {
      const c = cropMaster.get(id);
      if (c === undefined) return null;
      const next = { ...c };
      if (patch.name !== undefined) next.name = patch.name;
      if (patch.nameTa !== undefined) next.nameTa = patch.nameTa;
      if (patch.categoryId !== undefined) next.categoryId = patch.categoryId;
      if (patch.botanicalName !== undefined) next.botanicalName = patch.botanicalName;
      if (patch.seasonMonths !== undefined) next.seasonMonths = patch.seasonMonths;
      if (patch.shelfLifeDays !== undefined) next.shelfLifeDays = patch.shelfLifeDays;
      if (patch.iconKey !== undefined) next.iconKey = patch.iconKey;
      if (patch.isActive !== undefined) next.isActive = patch.isActive;
      cropMaster.set(id, next);
      return { ...next };
    },
  };

  return { repo, crops, cropMaster, calls };
}

/** A transaction client that records every SQL string sent through it. */
function recordingTx(): Executor & { sql: string[] } {
  const sql: string[] = [];
  return {
    sql,
    query: (async (text: string) => {
      sql.push(text);
      return { rows: [{ id: newId() }], rowCount: 1 };
    }) as unknown as Executor['query'],
  };
}

const noopDb: Executor = {
  query: async () => {
    throw new Error('the fake repo should never reach the database');
  },
};

function setup() {
  const fake = createFakeRepo();
  const tx = recordingTx();
  const txsOpened: Executor[] = [];
  const runTx: TransactionRunner = async (fn) => {
    txsOpened.push(tx);
    return fn(tx);
  };
  const service = createCropsService({ repo: fake.repo, db: noopDb, runTx });
  const admin = createCropTaxonomyAdminService({ repo: fake.repo, runTx });
  return { ...fake, tx, txsOpened, service, admin };
}

function validCreateBody(overrides: Partial<CreateFarmCropBody> = {}): CreateFarmCropBody {
  return {
    cropMasterId: CROP_MASTER_CARROT,
    ...overrides,
  };
}

async function errorOf(promise: Promise<unknown>): Promise<AppError> {
  const error = await promise.then(
    () => {
      throw new Error('expected the call to reject');
    },
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(AppError);
  return error as AppError;
}

// ---------------------------------------------------------------------------
// Ownership — plots -> farms.farmer_id, foreign rows are NOT_FOUND/empty
// ---------------------------------------------------------------------------

describe('crops — ownership (plots -> farms.farmer_id)', () => {
  it("creating a crop on another farmer's plot is NOT_FOUND, not 403", async () => {
    const { service } = setup();
    const error = await errorOf(
      service.createFarmCrop(farmerScope(FARMER_A, 'farmer.crops.create_own'), PLOT_B, validCreateBody()),
    );
    expect(error.code).toBe('NOT_FOUND');
    expect(error.status).toBe(404);
  });

  it("a guessed farmCropId belonging to another farmer is NOT_FOUND on get and update", async () => {
    const { service } = setup();
    const bCrop = await service.createFarmCrop(farmerScope(FARMER_B, 'farmer.crops.create_own'), PLOT_B, validCreateBody());

    const getError = await errorOf(service.getFarmCrop(farmerScope(FARMER_A), bCrop.id));
    expect(getError.code).toBe('NOT_FOUND');
    expect(getError.status).toBe(404);

    const patchError = await errorOf(
      service.updateFarmCrop(farmerScope(FARMER_A, 'farmer.crops.edit_own'), bCrop.id, { notes: 'hijacked' }),
    );
    expect(patchError.code).toBe('NOT_FOUND');
    expect(patchError.status).toBe(404);
  });

  it("listing another farmer's plot returns an empty page, never 403/404", async () => {
    const { service, calls } = setup();
    await service.createFarmCrop(farmerScope(FARMER_B, 'farmer.crops.create_own'), PLOT_B, validCreateBody());

    const list = await service.listFarmCrops(farmerScope(FARMER_A), PLOT_B, { limit: 20 });
    expect(list.items).toEqual([]);
    expect(list.page).toEqual({ nextCursor: null, hasMore: false });
    // The repo is never even queried for a plot the caller does not own.
    expect(calls.listFarmCropsArgs).toHaveLength(0);
  });

  it('an unknown cropMasterId is rejected with NOT_FOUND', async () => {
    const { service } = setup();
    const error = await errorOf(
      service.createFarmCrop(farmerScope(FARMER_A, 'farmer.crops.create_own'), PLOT_A, validCreateBody({ cropMasterId: newId() })),
    );
    expect(error.code).toBe('NOT_FOUND');
  });

  it('an actor with no farmer profile gets NOT_FOUND on /me endpoints (all-scope admins included)', async () => {
    const { service } = setup();
    const error = await errorOf(
      service.listFarmCrops(aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUPER_ADMIN }), PLOT_A, { limit: 20 }),
    );
    expect(error.code).toBe('NOT_FOUND');
  });

  it('new crops are created in status PLANNED, never client-settable at create time', async () => {
    const { service } = setup();
    const created = await service.createFarmCrop(farmerScope(FARMER_A, 'farmer.crops.create_own'), PLOT_A, validCreateBody());
    expect(created.status).toBe('PLANNED');
  });
});

// ---------------------------------------------------------------------------
// BR-46 — a plot cannot have two crops simultaneously in status GROWING
// ---------------------------------------------------------------------------

describe('crops — BR-46 a plot cannot have two crops simultaneously in status GROWING', () => {
  it('BR-46a: rejects a second GROWING crop on a plot that already has one', async () => {
    const { service } = setup();
    const editScope = farmerScope(FARMER_A, 'farmer.crops.edit_own');

    const first = await service.createFarmCrop(farmerScope(FARMER_A, 'farmer.crops.create_own'), PLOT_A, validCreateBody());
    const second = await service.createFarmCrop(
      farmerScope(FARMER_A, 'farmer.crops.create_own'),
      PLOT_A,
      validCreateBody({ cropMasterId: CROP_MASTER_TOMATO }),
    );

    const started = await service.updateFarmCrop(editScope, first.id, { status: 'GROWING' });
    expect(started.status).toBe('GROWING');

    const error = await errorOf(service.updateFarmCrop(editScope, second.id, { status: 'GROWING' }));
    expect(error.code).toBe('CROP_PLOT_ALREADY_GROWING');
    expect(error.status).toBe(409);

    // The rejected crop's status is unchanged.
    const reread = await service.getFarmCrop(farmerScope(FARMER_A), second.id);
    expect(reread.status).toBe('PLANNED');
  });

  it('BR-46b: the same plot may have any number of PLANNED/HARVESTED/FAILED crops at once', async () => {
    const { service } = setup();
    const createScope = farmerScope(FARMER_A, 'farmer.crops.create_own');
    const editScope = farmerScope(FARMER_A, 'farmer.crops.edit_own');

    const a = await service.createFarmCrop(createScope, PLOT_A, validCreateBody());
    const b = await service.createFarmCrop(createScope, PLOT_A, validCreateBody({ cropMasterId: CROP_MASTER_TOMATO }));
    const c = await service.createFarmCrop(createScope, PLOT_A, validCreateBody());

    await service.updateFarmCrop(editScope, a.id, { status: 'FAILED' });
    await service.updateFarmCrop(editScope, b.id, { status: 'HARVESTED', actualHarvestOn: '2026-09-01' });
    // c stays PLANNED — three non-GROWING crops coexist without conflict.
    const list = await service.listFarmCrops(farmerScope(FARMER_A), PLOT_A, { limit: 20 });
    expect(list.items.map((i) => i.status).sort()).toEqual(['FAILED', 'HARVESTED', 'PLANNED']);
    void c;
  });

  it('BR-46c: ending the existing GROWING crop before transitioning the new one into GROWING succeeds', async () => {
    const { service } = setup();
    const createScope = farmerScope(FARMER_A, 'farmer.crops.create_own');
    const editScope = farmerScope(FARMER_A, 'farmer.crops.edit_own');

    const first = await service.createFarmCrop(createScope, PLOT_A, validCreateBody());
    const second = await service.createFarmCrop(createScope, PLOT_A, validCreateBody({ cropMasterId: CROP_MASTER_TOMATO }));

    await service.updateFarmCrop(editScope, first.id, { status: 'GROWING' });
    // End the first crop's growing cycle...
    await service.updateFarmCrop(editScope, first.id, { status: 'HARVESTED', actualHarvestOn: '2026-09-15' });
    // ...then the second may become GROWING without conflict.
    const started = await service.updateFarmCrop(editScope, second.id, { status: 'GROWING' });
    expect(started.status).toBe('GROWING');
  });
});

// ---------------------------------------------------------------------------
// Crop taxonomy (crop_master) — farmer read, admin manage
// ---------------------------------------------------------------------------

describe('crops — crop_master taxonomy', () => {
  it('the farmer-facing crop-master list excludes inactive crop types', async () => {
    const { service, admin } = setup();
    await admin.update(adminScope, CROP_MASTER_TOMATO, { isActive: false });
    const list = await service.listCropMaster(farmerScope(FARMER_A));
    expect(list.items.map((i) => i.slug)).toEqual(['carrot']);
  });

  it('the admin list includes inactive crop types', async () => {
    const { admin } = setup();
    await admin.update(adminScope, CROP_MASTER_TOMATO, { isActive: false });
    const list = await admin.list(adminScope);
    expect(list.items.map((i) => i.slug).sort()).toEqual(['carrot', 'tomato']);
  });

  it('creating a crop with a duplicate slug returns CONFLICT', async () => {
    const { admin } = setup();
    const error = await errorOf(admin.create(adminScope, { slug: 'carrot', name: 'Carrot again', categoryId: CATEGORY_ID, defaultUnit: 'kg' as const }));
    expect(error.code).toBe('CONFLICT');
    expect(error.status).toBe(409);
  });

  it('every admin crop taxonomy mutation writes exactly one audit_log row on the same transaction client', async () => {
    const mutations: Array<(admin: ReturnType<typeof setup>['admin']) => Promise<unknown>> = [
      (admin) => admin.create(adminScope, { slug: 'cabbage', name: 'Cabbage', categoryId: CATEGORY_ID, defaultUnit: 'kg' as const }),
      (admin) => admin.update(adminScope, CROP_MASTER_CARROT, { name: 'Carrot (Nilgiris)' }),
    ];
    for (const mutate of mutations) {
      const { admin, tx, txsOpened } = setup();
      await mutate(admin);
      expect(txsOpened).toHaveLength(1);
      expect(tx.sql.filter((s) => s.includes('INSERT INTO audit_log'))).toHaveLength(1);
    }
  });

  it('a failed admin mutation writes no audit row', async () => {
    const { admin, tx } = setup();
    expect((await errorOf(admin.update(adminScope, newId(), { name: 'x' }))).code).toBe('NOT_FOUND');
    expect((await errorOf(admin.create(adminScope, { slug: 'carrot', name: 'dup', categoryId: CATEGORY_ID, defaultUnit: 'kg' as const }))).code).toBe('CONFLICT');
    expect(tx.sql.filter((s) => s.includes('INSERT INTO audit_log'))).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// RBAC sanity — farmer.crops.* is never granted to CUSTOMER; admin taxonomy is 403 to FARMER/CUSTOMER
// ---------------------------------------------------------------------------

/** Runs the real requirePermission middleware and returns what it passed to next(). */
function runPermission(code: string, actor: ReturnType<typeof anActor>, method = 'POST'): unknown {
  let passed: unknown = 'not-called';
  const req = { actor, method } as unknown as Request;
  requirePermission(code)(req, {} as Response, (err?: unknown) => {
    passed = err;
  });
  return passed;
}

describe('crops — RBAC', () => {
  it('every farmer.crops.* permission grants CUSTOMER nothing', () => {
    const cropsPermissions = [...loadRbac().byCode.values()].filter((p) => p.code.startsWith('farmer.crops.'));
    expect(cropsPermissions.length).toBeGreaterThan(0);
    for (const permission of cropsPermissions) {
      const grant = permission.grants[RoleCode.CUSTOMER];
      expect(grant === undefined || grant === ScopeLevel.NONE, `${permission.code} grants CUSTOMER "${String(grant)}"`).toBe(true);
    }
  });

  it('FARMER and CUSTOMER get 403 on the admin crop taxonomy permission; SUPER/TOHFA admins pass', () => {
    const farmer = aFarmer();
    const customer = anActor({ userId: newId(), roles: [{ code: RoleCode.CUSTOMER }], customerId: IDS.customer });
    for (const actor of [farmer, customer]) {
      const err = runPermission('admin.crop_taxonomy.manage', actor);
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).status).toBe(403);
      expect((err as AppError).code).toBe('FORBIDDEN');
    }
    for (const role of [RoleCode.SUPER_ADMIN, RoleCode.TOHFA_ADMIN]) {
      expect(runPermission('admin.crop_taxonomy.manage', anActor({ roles: [{ code: role }] }))).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// Cursor handling
// ---------------------------------------------------------------------------

describe('crops — list cursor', () => {
  it('rejects a tampered list cursor with VALIDATION_FAILED', async () => {
    const { service } = setup();
    const error = await errorOf(service.listFarmCrops(farmerScope(FARMER_A), PLOT_A, { limit: 20, cursor: 'not-a-cursor' }));
    expect(error.code).toBe('VALIDATION_FAILED');
  });
});

// ---------------------------------------------------------------------------
// Integration — proves the repo SQL parses against migrations 0004/0023.
// ---------------------------------------------------------------------------

describeIfDatabase('cropsRepo (integration)', () => {
  let ready = false;

  beforeAll(async () => {
    // Throws when a DATABASE_URL is configured but the schema is unreachable/unmigrated.
    ready = await requireDatabaseTables('farm_crops', 'plots', 'crop_master', 'users', 'farmers', 'farms', 'categories');
  });

  afterAll(async () => {
    if (!ready) return;
    const { closePool } = await import('../../db/pool.js');
    await closePool();
  });

  it('runs the crop_master, list, lookup and rotation-history queries against Postgres', async (ctx) => {
    if (!ready) return ctx.skip();
    const { pool } = await import('../../db/pool.js');
    const { cropsRepo } = await import('./crops.repo.js');
    const nobody = newId();

    const activeCropMaster = await cropsRepo.listCropMaster(pool, true);
    expect(activeCropMaster.every((c) => c.isActive)).toBe(true);

    expect(await cropsRepo.isPlotOwnedByFarmer(pool, newId(), nobody)).toBe(false);
    expect(await cropsRepo.findFarmCrop(pool, nobody, newId())).toBeNull();
    expect(await cropsRepo.getPlotRotationHistory(pool, newId())).toEqual([]);

    const list = await cropsRepo.listFarmCrops(pool, {
      plotId: newId(),
      cursor: { createdAt: new Date().toISOString(), id: newId() },
      limit: 5,
    });
    expect(list.items).toEqual([]);
  });

  it("BR-46: the database itself rejects a second live GROWING crop on the same plot", async (ctx) => {
    if (!ready) return ctx.skip();
    const { withTransaction } = await import('../../db/pool.js');
    const { cropsRepo } = await import('./crops.repo.js');

    await withTransaction(async (tx) => {
      // The farmer/farm/plot and the crop type are created INSIDE this transaction (rolled back
      // below). This used to borrow `SELECT id FROM plots LIMIT 1`, which (a) silently passed when
      // the database had no plot and (b) failed when that plot already had a GROWING crop.
      const { plotId } = await insertFarmerWithPlot(tx);
      const cropMasterId = await insertCrop(tx);
      const firstId = await cropsRepo.createFarmCrop(tx, { plotId, cropMasterId });
      const secondId = await cropsRepo.createFarmCrop(tx, { plotId, cropMasterId });
      // Raw SQL here, deliberately bypassing the farmer-scoped updateFarmCrop:
      // this assertion is about the database constraint itself, not the
      // service's ownership derivation (already covered above).
      await tx.query('UPDATE farm_crops SET status = $2 WHERE id = $1', [firstId, 'GROWING']);
      await expect(tx.query('UPDATE farm_crops SET status = $2 WHERE id = $1', [secondId, 'GROWING'])).rejects.toMatchObject({
        code: '23505',
      });
      // Roll back: nothing this test created is left behind.
      throw new Error('__rollback_test_fixture__');
    }).catch((error: unknown) => {
      if (!(error instanceof Error) || error.message !== '__rollback_test_fixture__') throw error;
    });
  });
});
