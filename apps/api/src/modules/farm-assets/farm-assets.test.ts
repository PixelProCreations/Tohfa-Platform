/**
 * Farm assets tests.
 *
 *  1. SERVICE tests against a stateful in-memory fake repo. The fake honours
 *     the same contract as the real repo (ownership derived via
 *     farms.farmer_id, `next_service_due_on` computed the same way the real
 *     GENERATED column is: COALESCE(last_serviced_on, purchased_on) +
 *     service_interval_days), so the tests assert what the service asks for
 *     AND what the caller gets back.
 *  2. Computed status/dueNote tests — the point of this module's read-time
 *     computation (db/migrations/0025's header comment) — using dates
 *     expressed as an offset from "today" so the tests are not flaky as time
 *     passes.
 *  3. RBAC sanity checks against the real docs/rbac.json.
 *  4. ONE integration block against a real pool, soft-skipped when the
 *     farm_assets migration has not run, proving the repo SQL (and the
 *     generated column) parses against 0025.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Request, Response } from 'express';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { loadRbac } from '../../rbac/loadRbac.js';
import { requirePermission, type ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, anActor, aFarmer, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import type {
  CreateFarmAssetData,
  FarmAssetRecord,
  FarmAssetsRepo,
  ListFarmAssetsArgs,
  UpdateFarmAssetPatch,
} from './farm-assets.repo.js';
import type { CreateFarmAssetBody } from './farm-assets.schema.js';
import {
  computeAssetStatus,
  createFarmAssetsAdminService,
  createFarmAssetsService,
  type TransactionRunner,
} from './farm-assets.service.js';

// ---------------------------------------------------------------------------
// Date helpers — offsets from "today" (Asia/Kolkata), so status tests never
// go stale. Mirrors farm-assets.service.ts's own IST day-count arithmetic.
// ---------------------------------------------------------------------------

function todayIst(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function offsetFromToday(days: number): string {
  return addDays(todayIst(), days);
}

const DUE_SOON_DAYS = 14; // matches the fake's getAssetServiceDueSoonDays and the real system_config default.

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FARMER_A = IDS.farmer;
const FARMER_B = '30000000-0000-4000-8000-000000000002';
const FARM_A = '60000000-0000-4000-8000-00000000000a';
const FARM_B = '60000000-0000-4000-8000-00000000000b';

function farmerScope(farmerId: string, permission = 'farmer.assets.view_own'): ResolvedScope {
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
  permission: 'admin.assets.view_all',
  roleCode: RoleCode.TOHFA_ADMIN,
  userId: IDS.userTohfaAdmin,
});

interface StoredFarmAsset {
  id: string;
  farmId: string;
  category: 'TOOL' | 'EQUIPMENT' | 'MACHINERY';
  name: string;
  makeModel: string | null;
  fuelType: string | null;
  coverageAreaAcres: number | null;
  purchasedOn: string | null;
  costPaise: number | null;
  serviceIntervalDays: number | null;
  lastServicedOn: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

function computeNextServiceDueOn(stored: StoredFarmAsset): string | null {
  const base = stored.lastServicedOn ?? stored.purchasedOn;
  if (base === null || stored.serviceIntervalDays === null) return null;
  return addDays(base, stored.serviceIntervalDays);
}

/**
 * Stateful fake. Mirrors the real repo's ownership derivation
 * (farms.farmer_id) and the real `next_service_due_on` GENERATED column
 * (computed the same way on every read), so a test against this fake proves
 * the same thing a test against the real database would.
 */
function createFakeRepo() {
  const farms = new Map<string, string>([
    [FARM_A, FARMER_A],
    [FARM_B, FARMER_B],
  ]);
  const assets = new Map<string, StoredFarmAsset>();

  const calls = {
    listFarmAssetsArgs: [] as ListFarmAssetsArgs[],
  };

  const toRecord = (a: StoredFarmAsset): FarmAssetRecord => ({
    id: a.id,
    farmId: a.farmId,
    category: a.category,
    name: a.name,
    makeModel: a.makeModel,
    fuelType: a.fuelType,
    coverageAreaAcres: a.coverageAreaAcres,
    purchasedOn: a.purchasedOn,
    costPaise: a.costPaise,
    serviceIntervalDays: a.serviceIntervalDays,
    lastServicedOn: a.lastServicedOn,
    nextServiceDueOn: computeNextServiceDueOn(a),
    notes: a.notes,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt === null ? null : a.updatedAt.toISOString(),
  });

  const findOwned = (farmerId: string, assetId: string): StoredFarmAsset | null => {
    const a = assets.get(assetId);
    if (a === undefined) return null;
    return farms.get(a.farmId) === farmerId ? a : null;
  };

  const repo: FarmAssetsRepo = {
    async isFarmOwnedByFarmer(_db, farmId, farmerId) {
      return farms.get(farmId) === farmerId;
    },

    async createFarmAsset(_db, data: CreateFarmAssetData) {
      const id = newId();
      assets.set(id, {
        id,
        farmId: data.farmId,
        category: data.category,
        name: data.name,
        makeModel: data.makeModel ?? null,
        fuelType: data.fuelType ?? null,
        coverageAreaAcres: data.coverageAreaAcres ?? null,
        purchasedOn: data.purchasedOn ?? null,
        costPaise: data.costPaise ?? null,
        serviceIntervalDays: data.serviceIntervalDays,
        lastServicedOn: data.lastServicedOn ?? null,
        notes: data.notes ?? null,
        createdAt: new Date(),
        updatedAt: null,
      });
      return id;
    },

    async findFarmAsset(_db, farmerId, assetId) {
      const a = findOwned(farmerId, assetId);
      return a === null ? null : toRecord(a);
    },

    async listFarmAssets(_db, args) {
      calls.listFarmAssetsArgs.push(args);
      const threshold = args.dueWithinDays !== undefined ? offsetFromToday(args.dueWithinDays) : null;
      const items = [...assets.values()]
        .filter((a) => farms.get(a.farmId) === args.farmerId)
        .filter((a) => args.category === undefined || a.category === args.category)
        .filter((a) => {
          if (threshold === null) return true;
          const due = computeNextServiceDueOn(a);
          return due !== null && due <= threshold;
        })
        .map(toRecord);
      return { items, next: null };
    },

    async updateFarmAsset(_db, farmerId, assetId, patch: UpdateFarmAssetPatch) {
      const a = findOwned(farmerId, assetId);
      if (a === null) return false;
      if (patch.name !== undefined) a.name = patch.name;
      if (patch.makeModel !== undefined) a.makeModel = patch.makeModel;
      if (patch.fuelType !== undefined) a.fuelType = patch.fuelType;
      if (patch.coverageAreaAcres !== undefined) a.coverageAreaAcres = patch.coverageAreaAcres;
      if (patch.purchasedOn !== undefined) a.purchasedOn = patch.purchasedOn;
      if (patch.costPaise !== undefined) a.costPaise = patch.costPaise;
      if (patch.serviceIntervalDays !== undefined) a.serviceIntervalDays = patch.serviceIntervalDays;
      if (patch.lastServicedOn !== undefined) a.lastServicedOn = patch.lastServicedOn;
      if (patch.notes !== undefined) a.notes = patch.notes;
      a.updatedAt = new Date();
      return true;
    },

    async softDeleteFarmAsset(_db, farmerId, assetId) {
      const a = findOwned(farmerId, assetId);
      if (a === null) return false;
      assets.delete(assetId);
      return true;
    },

    async getAssetServiceDueSoonDays(_db) {
      return DUE_SOON_DAYS;
    },
  };

  return { repo, assets, farms, calls };
}

const noopDb: Executor = {
  query: async () => {
    throw new Error('the fake repo should never reach the database');
  },
};

function setup() {
  const fake = createFakeRepo();
  const runTx: TransactionRunner = async (fn) => fn(noopDb);
  const service = createFarmAssetsService({ repo: fake.repo, db: noopDb, runTx });
  const admin = createFarmAssetsAdminService({ repo: fake.repo, db: noopDb });
  return { ...fake, service, admin };
}

function validCreateBody(overrides: Partial<CreateFarmAssetBody> = {}): CreateFarmAssetBody {
  return {
    farmId: FARM_A,
    category: 'TOOL',
    name: 'Pruning Shears',
    serviceIntervalDays: 90,
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
// Ownership — farms.farmer_id, foreign rows are NOT_FOUND
// ---------------------------------------------------------------------------

describe('farm-assets — ownership (farms.farmer_id)', () => {
  it("registering an asset on another farmer's farm is NOT_FOUND, not 403", async () => {
    const { service } = setup();
    const error = await errorOf(
      service.createFarmAsset(farmerScope(FARMER_A, 'farmer.assets.create_own'), validCreateBody({ farmId: FARM_B })),
    );
    expect(error.code).toBe('NOT_FOUND');
    expect(error.status).toBe(404);
  });

  it("a guessed assetId belonging to another farmer is NOT_FOUND on get, update and delete", async () => {
    const { service } = setup();
    const bAsset = await service.createFarmAsset(
      farmerScope(FARMER_B, 'farmer.assets.create_own'),
      validCreateBody({ farmId: FARM_B }),
    );

    const getError = await errorOf(service.getFarmAsset(farmerScope(FARMER_A), bAsset.id));
    expect(getError.code).toBe('NOT_FOUND');
    expect(getError.status).toBe(404);

    const patchError = await errorOf(
      service.updateFarmAsset(farmerScope(FARMER_A, 'farmer.assets.edit_own'), bAsset.id, { notes: 'hijacked' }),
    );
    expect(patchError.code).toBe('NOT_FOUND');

    const deleteError = await errorOf(service.deleteFarmAsset(farmerScope(FARMER_A, 'farmer.assets.edit_own'), bAsset.id));
    expect(deleteError.code).toBe('NOT_FOUND');
  });

  it("a farmer's asset list never includes another farmer's assets", async () => {
    const { service } = setup();
    await service.createFarmAsset(farmerScope(FARMER_A, 'farmer.assets.create_own'), validCreateBody());
    await service.createFarmAsset(farmerScope(FARMER_B, 'farmer.assets.create_own'), validCreateBody({ farmId: FARM_B }));

    const list = await service.listFarmAssets(farmerScope(FARMER_A), { limit: 20 });
    expect(list.items).toHaveLength(1);
  });

  it('an actor with no farmer profile gets NOT_FOUND on /me endpoints (all-scope admins included)', async () => {
    const { service } = setup();
    const error = await errorOf(
      service.listFarmAssets(aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUPER_ADMIN }), { limit: 20 }),
    );
    expect(error.code).toBe('NOT_FOUND');
  });
});

// ---------------------------------------------------------------------------
// Computed status/dueNote — never stored, always derived from nextServiceDueOn
// ---------------------------------------------------------------------------

describe('farm-assets — computed status (OK/DUE_SOON/OVERDUE)', () => {
  it('a next_service_due_on in the past yields OVERDUE', () => {
    const { status, dueNote } = computeAssetStatus(offsetFromToday(-5), DUE_SOON_DAYS);
    expect(status).toBe('OVERDUE');
    expect(dueNote).toBe('5 days overdue');
  });

  it('a next_service_due_on within the DUE_SOON window yields DUE_SOON', () => {
    const { status, dueNote } = computeAssetStatus(offsetFromToday(5), DUE_SOON_DAYS);
    expect(status).toBe('DUE_SOON');
    expect(dueNote).toBe('5 days away');
  });

  it('a next_service_due_on exactly at the DUE_SOON boundary yields DUE_SOON', () => {
    const { status } = computeAssetStatus(offsetFromToday(DUE_SOON_DAYS), DUE_SOON_DAYS);
    expect(status).toBe('DUE_SOON');
  });

  it('a next_service_due_on one day past the DUE_SOON boundary yields OK', () => {
    const { status } = computeAssetStatus(offsetFromToday(DUE_SOON_DAYS + 1), DUE_SOON_DAYS);
    expect(status).toBe('OK');
  });

  it('a far-future next_service_due_on yields OK', () => {
    const { status, dueNote } = computeAssetStatus(offsetFromToday(60), DUE_SOON_DAYS);
    expect(status).toBe('OK');
    expect(dueNote).toBe('60 days away');
  });

  it('a null next_service_due_on (no purchasedOn/lastServicedOn to count from) yields OK with a null dueNote', () => {
    const { status, dueNote } = computeAssetStatus(null, DUE_SOON_DAYS);
    expect(status).toBe('OK');
    expect(dueNote).toBeNull();
  });

  it('due today yields DUE_SOON with dueNote "Due today"', () => {
    const { status, dueNote } = computeAssetStatus(offsetFromToday(0), DUE_SOON_DAYS);
    expect(status).toBe('DUE_SOON');
    expect(dueNote).toBe('Due today');
  });

  it('the service computes nextServiceDueOn from purchasedOn + serviceIntervalDays when never serviced', async () => {
    const { service } = setup();
    const purchasedOn = offsetFromToday(-100);
    const created = await service.createFarmAsset(
      farmerScope(FARMER_A, 'farmer.assets.create_own'),
      validCreateBody({ purchasedOn, serviceIntervalDays: 90 }),
    );
    expect(created.nextServiceDueOn).toBe(addDays(purchasedOn, 90));
    expect(created.status).toBe('OVERDUE'); // 100 days since purchase > 90-day interval
  });

  it('recording a service (lastServicedOn) recomputes nextServiceDueOn from the new date, not the purchase date', async () => {
    const { service } = setup();
    // Purchase-based due date would be 400-90=310 days overdue by now.
    const purchasedOn = offsetFromToday(-400);
    const created = await service.createFarmAsset(
      farmerScope(FARMER_A, 'farmer.assets.create_own'),
      validCreateBody({ purchasedOn, serviceIntervalDays: 90 }),
    );
    expect(created.status).toBe('OVERDUE');

    // Recording a service 10 days ago moves the due date to 80 days from now
    // (comfortably OK) — proof the recompute uses lastServicedOn, not the
    // stale purchasedOn.
    const servicedOn = offsetFromToday(-10);
    const updated = await service.updateFarmAsset(farmerScope(FARMER_A, 'farmer.assets.edit_own'), created.id, {
      lastServicedOn: servicedOn,
    });
    expect(updated.nextServiceDueOn).toBe(addDays(servicedOn, 90));
    expect(updated.status).toBe('OK');
  });

  it('dueOnly=true returns DUE_SOON/OVERDUE rows only, matching FarmInventoryScreen.tsx\'s combined "due" count', async () => {
    const { service } = setup();
    const createScope = farmerScope(FARMER_A, 'farmer.assets.create_own');

    const overdue = await service.createFarmAsset(
      createScope,
      validCreateBody({ name: 'Overdue tool', purchasedOn: offsetFromToday(-100), serviceIntervalDays: 30 }),
    );
    const dueSoon = await service.createFarmAsset(
      createScope,
      validCreateBody({ name: 'Due soon tool', purchasedOn: offsetFromToday(-25), serviceIntervalDays: 30 }),
    );
    const ok = await service.createFarmAsset(
      createScope,
      validCreateBody({ name: 'Fine tool', purchasedOn: offsetFromToday(-5), serviceIntervalDays: 90 }),
    );

    expect(overdue.status).toBe('OVERDUE');
    expect(dueSoon.status).toBe('DUE_SOON');
    expect(ok.status).toBe('OK');

    const dueOnly = await service.listFarmAssets(farmerScope(FARMER_A), { limit: 20, dueOnly: true });
    expect(dueOnly.items.map((i) => i.name).sort()).toEqual(['Due soon tool', 'Overdue tool']);

    const all = await service.listFarmAssets(farmerScope(FARMER_A), { limit: 20 });
    expect(all.items).toHaveLength(3);
  });

  it('category filters the list', async () => {
    const { service } = setup();
    const createScope = farmerScope(FARMER_A, 'farmer.assets.create_own');
    await service.createFarmAsset(createScope, validCreateBody({ category: 'TOOL', name: 'Sickle' }));
    await service.createFarmAsset(
      createScope,
      validCreateBody({ category: 'MACHINERY', name: 'Power Tiller', fuelType: 'Diesel' }),
    );

    const list = await service.listFarmAssets(farmerScope(FARMER_A), { limit: 20, category: 'MACHINERY' });
    expect(list.items.map((i) => i.name)).toEqual(['Power Tiller']);
  });
});

// ---------------------------------------------------------------------------
// farmId/category are not editable
// ---------------------------------------------------------------------------

describe('farm-assets — farmId/category are not editable', () => {
  it('updateFarmAssetBody has no farmId or category field', async () => {
    const { updateFarmAssetBody } = await import('./farm-assets.schema.js');
    const parsed = updateFarmAssetBody.safeParse({ farmId: newId(), name: 'x' });
    expect(parsed.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Admin read — /admin/farmers/:farmerId/farm-assets
// ---------------------------------------------------------------------------

describe('farm-assets — admin read', () => {
  it("the admin endpoint lists one farmer's assets across all their farms", async () => {
    const { service, admin } = setup();
    await service.createFarmAsset(farmerScope(FARMER_A, 'farmer.assets.create_own'), validCreateBody({ name: 'A tool' }));
    await service.createFarmAsset(
      farmerScope(FARMER_B, 'farmer.assets.create_own'),
      validCreateBody({ farmId: FARM_B, name: 'B tool' }),
    );

    const forA = await admin.listForFarmer(adminScope, FARMER_A, { limit: 20 });
    expect(forA.items.map((i) => i.name)).toEqual(['A tool']);
  });
});

// ---------------------------------------------------------------------------
// RBAC sanity — farmer.assets.* is never granted to CUSTOMER; admin.assets.view_all is 403 to FARMER/CUSTOMER
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

describe('farm-assets — RBAC', () => {
  it('every farmer.assets.* permission grants CUSTOMER nothing', () => {
    const assetPermissions = [...loadRbac().byCode.values()].filter((p) => p.code.startsWith('farmer.assets.'));
    expect(assetPermissions.length).toBeGreaterThan(0);
    for (const permission of assetPermissions) {
      const grant = permission.grants[RoleCode.CUSTOMER];
      expect(grant === undefined || grant === ScopeLevel.NONE, `${permission.code} grants CUSTOMER "${String(grant)}"`).toBe(true);
    }
  });

  it('FARMER and CUSTOMER get 403 on admin.assets.view_all; SUPER/TOHFA admins pass', () => {
    const farmer = aFarmer();
    const customer = anActor({ userId: newId(), roles: [{ code: RoleCode.CUSTOMER }], customerId: IDS.customer });
    for (const actor of [farmer, customer]) {
      const err = runPermission('admin.assets.view_all', actor);
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).status).toBe(403);
      expect((err as AppError).code).toBe('FORBIDDEN');
    }
    for (const role of [RoleCode.SUPER_ADMIN, RoleCode.TOHFA_ADMIN]) {
      expect(runPermission('admin.assets.view_all', anActor({ roles: [{ code: role }] }))).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// Cursor handling
// ---------------------------------------------------------------------------

describe('farm-assets — list cursor', () => {
  it('rejects a tampered list cursor with VALIDATION_FAILED', async () => {
    const { service } = setup();
    const error = await errorOf(service.listFarmAssets(farmerScope(FARMER_A), { limit: 20, cursor: 'not-a-cursor' }));
    expect(error.code).toBe('VALIDATION_FAILED');
  });
});

// ---------------------------------------------------------------------------
// Integration — proves the repo SQL (and the generated column) parses
// against migration 0025.
// ---------------------------------------------------------------------------

describeIfDatabase('farmAssetsRepo (integration)', () => {
  let ready = false;

  beforeAll(async () => {
    ready = await databaseReady('farm_assets');
    if (!ready) console.warn('[skip] farm_assets not migrated — run `pnpm db:migrate`');
  });

  afterAll(async () => {
    if (!ready) return;
    const { closePool } = await import('../../db/pool.js');
    await closePool();
  });

  it('runs the ownership, list and lookup queries against Postgres, and the generated column computes correctly', async () => {
    if (!ready) return;
    const { pool, withTransaction } = await import('../../db/pool.js');
    const { farmAssetsRepo } = await import('./farm-assets.repo.js');
    const nobody = newId();

    expect(await farmAssetsRepo.isFarmOwnedByFarmer(pool, newId(), nobody)).toBe(false);
    expect(await farmAssetsRepo.findFarmAsset(pool, nobody, newId())).toBeNull();
    const dueSoonDays = await farmAssetsRepo.getAssetServiceDueSoonDays(pool);
    expect(typeof dueSoonDays).toBe('number');

    const anyFarm = await pool.query<{ id: string; farmer_id: string }>('SELECT id, farmer_id FROM farms LIMIT 1');
    const farmId = anyFarm.rows[0]?.id;
    const farmerId = anyFarm.rows[0]?.farmer_id;
    if (farmId === undefined || farmerId === undefined) return; // no seeded farm in this environment

    await withTransaction(async (tx) => {
      const purchasedOn = offsetFromToday(-100);
      const assetId = await farmAssetsRepo.createFarmAsset(tx, {
        farmId,
        category: 'TOOL',
        name: 'Integration test tool',
        purchasedOn,
        serviceIntervalDays: 30,
      });

      const created = await farmAssetsRepo.findFarmAsset(tx, farmerId, assetId);
      expect(created).not.toBeNull();
      // The GENERATED column, computed by Postgres itself, not this repo.
      expect(created?.nextServiceDueOn).toBe(addDays(purchasedOn, 30));

      throw new Error('__rollback_test_fixture__');
    }).catch((error: unknown) => {
      if (!(error instanceof Error) || error.message !== '__rollback_test_fixture__') throw error;
    });
  });
});
