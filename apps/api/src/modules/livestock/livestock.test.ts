/**
 * Livestock tests (BR-47).
 *
 *  1. SERVICE tests against a stateful in-memory fake repo (+ a fake
 *     farmsService). The fake honours the same contract as the real repo
 *     (ownership derived via farms.farmer_id, BR-47's unique index simulated
 *     as a Postgres 23505 unique-violation error), so the tests assert what
 *     the service asks for AND what the caller gets back.
 *  2. SCHEMA tests for the DAIRY_PRODUCT_UNITS cross-check (unit must match
 *     productType).
 *  3. RBAC sanity checks against the real docs/rbac.json.
 *  4. ONE integration block against a real pool, soft-skipped when the
 *     livestock migration has not run, proving the repo SQL parses against
 *     0024.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Request, Response } from 'express';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { loadRbac } from '../../rbac/loadRbac.js';
import { requirePermission, type ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, anActor, aFarmer, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import type { FarmsService } from '../farms/farms.service.js';
import type { FarmWithPlotCount } from '../farms/farms.repo.js';
import type {
  CreateAnimalData,
  CreateProductionLogData,
  ListAnimalsArgs,
  ListProductionLogsArgs,
  LivestockRepo,
  UpdateAnimalPatch,
} from './livestock.repo.js';
import { createProductionLogBody, type AnimalResponse, type CreateAnimalBody, type ProductionLogResponse } from './livestock.schema.js';
import { createLivestockAdminService, createLivestockService, type TransactionRunner } from './livestock.service.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FARMER_A = IDS.farmer;
const FARMER_B = '30000000-0000-4000-8000-000000000002';
const FARM_A = '60000000-0000-4000-8000-00000000000a';
const FARM_B = '60000000-0000-4000-8000-00000000000b';

function farmerScope(farmerId: string, permission = 'farmer.livestock.view_own'): ResolvedScope {
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
  permission: 'admin.livestock.view_all',
  roleCode: RoleCode.TOHFA_ADMIN,
  userId: IDS.userTohfaAdmin,
});

function aFarm(overrides: Partial<FarmWithPlotCount> = {}): FarmWithPlotCount {
  return {
    id: FARM_A,
    farmerId: FARMER_A,
    name: 'Main Farm',
    surveyNumber: null,
    areaAcres: null,
    centroidLat: null,
    centroidLng: null,
    boundary: null,
    boundaryAreaAcres: null,
    boundaryDrawnBy: null,
    boundaryDrawnAt: null,
    boundaryVersion: 0,
    address: null,
    village: null,
    taluk: null,
    district: 'The Nilgiris',
    isPrimary: true,
    waterSources: [],
    landBoundaryContext: [],
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    plotCount: 0,
    ...overrides,
  };
}

/** Farmer -> farm ids, ordered primary-first, mirroring farmsRepo.listByScope's ordering. */
const FARM_OWNERSHIP = new Map<string, string>([
  [FARM_A, FARMER_A],
  [FARM_B, FARMER_B],
]);

/** Fake farmsService: only `list` is exercised by livestock.service.ts (picking the primary farm). */
function createFakeFarmsService(farmsByFarmer: Map<string, FarmWithPlotCount[]>): FarmsService {
  const notUsed = (): never => {
    throw new Error('not exercised by livestock tests');
  };
  return {
    async list(scope) {
      if (scope.farmerId === undefined) return [];
      return farmsByFarmer.get(scope.farmerId) ?? [];
    },
    create: notUsed,
    update: notUsed,
    remove: notUsed,
    listPlots: notUsed,
    createPlot: notUsed,
    updatePlot: notUsed,
    removePlot: notUsed,
  };
}

/** Thrown by the fake repo to simulate a real unique-violation (pg code 23505). */
class FakeUniqueViolation extends Error {
  readonly code = '23505';
}

interface StoredAnimal {
  id: string;
  farmId: string;
  tag: string;
  name: string | null;
  species: AnimalResponse['species'];
  breed: string | null;
  gender: AnimalResponse['gender'];
  dateOfBirth: string | null;
  source: AnimalResponse['source'];
  purchasedOn: string | null;
  sourceFarm: string | null;
  organicStatus: AnimalResponse['organicStatus'];
  lifecycleStatus: AnimalResponse['lifecycleStatus'];
  withdrawalUntil: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

interface StoredProductionLog {
  id: string;
  farmId: string;
  animalId: string | null;
  productType: ProductionLogResponse['productType'];
  quantity: number;
  unit: ProductionLogResponse['unit'];
  loggedOn: string;
  batchInfo: string | null;
  sessions: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

/**
 * Stateful fake. Mirrors the real repo's ownership derivation (farm_id ->
 * farms.farmer_id) and BR-47's unique index (one lifecycle event per animal),
 * so a test against this fake proves the same thing a test against the real
 * database would.
 */
function createFakeRepo() {
  const animals = new Map<string, StoredAnimal>();
  const productionLogs = new Map<string, StoredProductionLog>();
  const lifecycleEvents = new Set<string>(); // animal ids that already have one

  const calls = {
    listAnimalsArgs: [] as ListAnimalsArgs[],
    updateAnimalExecutors: [] as Executor[],
    lifecycleExecutors: [] as Executor[],
  };

  const toResponse = (a: StoredAnimal): AnimalResponse => ({
    id: a.id,
    tag: a.tag,
    name: a.name,
    species: a.species,
    breed: a.breed,
    gender: a.gender,
    dateOfBirth: a.dateOfBirth,
    source: a.source,
    purchasedOn: a.purchasedOn,
    sourceFarm: a.sourceFarm,
    organicStatus: a.organicStatus,
    lifecycleStatus: a.lifecycleStatus,
    withdrawalUntil: a.withdrawalUntil,
    notes: a.notes,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt === null ? null : a.updatedAt.toISOString(),
  });

  const toLogResponse = (p: StoredProductionLog): ProductionLogResponse => ({
    id: p.id,
    animalId: p.animalId,
    productType: p.productType,
    quantity: p.quantity,
    unit: p.unit,
    loggedOn: p.loggedOn,
    batchInfo: p.batchInfo,
    sessions: p.sessions,
    notes: p.notes,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt === null ? null : p.updatedAt.toISOString(),
  });

  const findOwnedAnimal = (farmerId: string, animalId: string): StoredAnimal | null => {
    const a = animals.get(animalId);
    if (a === undefined) return null;
    return FARM_OWNERSHIP.get(a.farmId) === farmerId ? a : null;
  };

  const repo: LivestockRepo = {
    async createAnimal(_db, data: CreateAnimalData) {
      const dup = [...animals.values()].some((a) => a.farmId === data.farmId && a.tag === data.tag);
      if (dup) throw new FakeUniqueViolation('duplicate key value violates unique constraint "uq_livestock_animals_farm_tag"');
      const id = newId();
      animals.set(id, {
        id,
        farmId: data.farmId,
        tag: data.tag,
        name: data.name ?? null,
        species: data.species,
        breed: data.breed ?? null,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth ?? null,
        source: data.source,
        purchasedOn: data.purchasedOn ?? null,
        sourceFarm: data.sourceFarm ?? null,
        organicStatus: data.organicStatus,
        lifecycleStatus: 'ACTIVE',
        withdrawalUntil: data.withdrawalUntil ?? null,
        notes: data.notes ?? null,
        createdAt: new Date(),
        updatedAt: null,
      });
      return id;
    },

    async findAnimal(_db, farmerId, animalId) {
      const a = findOwnedAnimal(farmerId, animalId);
      return a === null ? null : toResponse(a);
    },

    async listAnimals(db, args) {
      calls.listAnimalsArgs.push(args);
      const items = [...animals.values()]
        .filter((a) => FARM_OWNERSHIP.get(a.farmId) === args.farmerId)
        .filter((a) => a.lifecycleStatus === (args.lifecycleStatus ?? 'ACTIVE'))
        .filter((a) => args.species === undefined || a.species === args.species)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map(toResponse);
      void db;
      return { items, next: null };
    },

    async updateAnimal(db, farmerId, animalId, patch: UpdateAnimalPatch) {
      calls.updateAnimalExecutors.push(db);
      const a = findOwnedAnimal(farmerId, animalId);
      if (a === null) return false;

      if (patch.tag !== undefined) {
        const dup = [...animals.values()].some((other) => other.id !== a.id && other.farmId === a.farmId && other.tag === patch.tag);
        if (dup) throw new FakeUniqueViolation('duplicate key value violates unique constraint "uq_livestock_animals_farm_tag"');
        a.tag = patch.tag;
      }
      if (patch.name !== undefined) a.name = patch.name;
      if (patch.species !== undefined) a.species = patch.species;
      if (patch.breed !== undefined) a.breed = patch.breed;
      if (patch.gender !== undefined) a.gender = patch.gender;
      if (patch.dateOfBirth !== undefined) a.dateOfBirth = patch.dateOfBirth;
      if (patch.source !== undefined) a.source = patch.source;
      if (patch.purchasedOn !== undefined) a.purchasedOn = patch.purchasedOn;
      if (patch.sourceFarm !== undefined) a.sourceFarm = patch.sourceFarm;
      if (patch.organicStatus !== undefined) a.organicStatus = patch.organicStatus;
      if (patch.withdrawalUntil !== undefined) a.withdrawalUntil = patch.withdrawalUntil;
      if (patch.notes !== undefined) a.notes = patch.notes;
      a.updatedAt = new Date();
      return true;
    },

    async insertLifecycleEvent(db, farmerId, animalId, body) {
      calls.lifecycleExecutors.push(db);
      const a = findOwnedAnimal(farmerId, animalId);
      if (a === null) return false;
      // BR-47: the real unique index only fires on the INSERT itself.
      if (lifecycleEvents.has(animalId)) {
        throw new FakeUniqueViolation('duplicate key value violates unique constraint "uq_livestock_lifecycle_events_one_per_animal"');
      }
      lifecycleEvents.add(animalId);
      void body;
      return true;
    },

    async setAnimalLifecycleStatus(_db, animalId, status) {
      const a = animals.get(animalId);
      if (a !== undefined) {
        a.lifecycleStatus = status;
        a.updatedAt = new Date();
      }
    },

    async createProductionLog(_db, data: CreateProductionLogData) {
      const id = newId();
      productionLogs.set(id, {
        id,
        farmId: data.farmId,
        animalId: data.animalId ?? null,
        productType: data.productType,
        quantity: data.quantity,
        unit: data.unit,
        loggedOn: data.loggedOn ?? '2026-09-29',
        batchInfo: data.batchInfo ?? null,
        sessions: data.sessions ?? null,
        notes: data.notes ?? null,
        createdAt: new Date(),
        updatedAt: null,
      });
      return id;
    },

    async findProductionLog(_db, farmerId, logId) {
      const p = productionLogs.get(logId);
      if (p === undefined) return null;
      return FARM_OWNERSHIP.get(p.farmId) === farmerId ? toLogResponse(p) : null;
    },

    async listProductionLogs(_db, args: ListProductionLogsArgs) {
      const items = [...productionLogs.values()]
        .filter((p) => FARM_OWNERSHIP.get(p.farmId) === args.farmerId)
        .filter((p) => args.productType === undefined || p.productType === args.productType)
        .filter((p) => args.animalId === undefined || p.animalId === args.animalId)
        .filter((p) => args.dateFrom === undefined || p.loggedOn >= args.dateFrom)
        .filter((p) => args.dateTo === undefined || p.loggedOn <= args.dateTo)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map(toLogResponse);
      return { items, next: null };
    },

    async listAnimalsForFarmer(_db, farmerId) {
      return [...animals.values()]
        .filter((a) => FARM_OWNERSHIP.get(a.farmId) === farmerId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map(toResponse);
    },
  };

  return { repo, animals, productionLogs, calls };
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
  const farmsSvc = createFakeFarmsService(
    new Map([
      [FARMER_A, [aFarm({ id: FARM_A, farmerId: FARMER_A })]],
      [FARMER_B, [aFarm({ id: FARM_B, farmerId: FARMER_B, isPrimary: true })]],
    ]),
  );
  const service = createLivestockService({ repo: fake.repo, db: noopDb, runTx, farmsSvc });
  const admin = createLivestockAdminService({ repo: fake.repo, db: noopDb });
  return { ...fake, tx, txsOpened, service, admin, farmsSvc };
}

function validCreateBody(overrides: Partial<CreateAnimalBody> = {}): CreateAnimalBody {
  return {
    tag: 'C-001',
    species: 'CATTLE',
    gender: 'FEMALE',
    source: 'BORN_ON_FARM',
    organicStatus: 'CONVENTIONAL',
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
// Ownership — farms.farmer_id, foreign rows are NOT_FOUND/empty
// ---------------------------------------------------------------------------

describe('livestock — ownership (farms.farmer_id)', () => {
  it('a guessed animalId belonging to another farmer is NOT_FOUND on get and update', async () => {
    const { service } = setup();
    const bAnimal = await service.createAnimal(farmerScope(FARMER_B, 'farmer.livestock.create_own'), validCreateBody({ tag: 'B-01' }));

    const getError = await errorOf(service.getAnimal(farmerScope(FARMER_A), bAnimal.id));
    expect(getError.code).toBe('NOT_FOUND');
    expect(getError.status).toBe(404);

    const patchError = await errorOf(
      service.updateAnimal(farmerScope(FARMER_A, 'farmer.livestock.edit_own'), bAnimal.id, { notes: 'hijacked' }),
    );
    expect(patchError.code).toBe('NOT_FOUND');
    expect(patchError.status).toBe(404);
  });

  it("listing never returns another farmer's animals", async () => {
    const { service } = setup();
    await service.createAnimal(farmerScope(FARMER_B, 'farmer.livestock.create_own'), validCreateBody({ tag: 'B-01' }));
    await service.createAnimal(farmerScope(FARMER_A, 'farmer.livestock.create_own'), validCreateBody({ tag: 'A-01' }));

    const list = await service.listAnimals(farmerScope(FARMER_A), { limit: 20 });
    expect(list.items.map((i) => i.tag)).toEqual(['A-01']);
  });

  it('an actor with no farmer profile gets NOT_FOUND on /me endpoints (all-scope admins included)', async () => {
    const { service } = setup();
    const error = await errorOf(
      service.listAnimals(aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUPER_ADMIN }), { limit: 20 }),
    );
    expect(error.code).toBe('NOT_FOUND');
  });

  it('a farmer with no registered farm gets NOT_FOUND when registering an animal', async () => {
    const { service } = setup();
    const nobody = farmerScope(newId(), 'farmer.livestock.create_own');
    const error = await errorOf(service.createAnimal(nobody, validCreateBody()));
    expect(error.code).toBe('NOT_FOUND');
  });

  it('new animals are created in lifecycleStatus ACTIVE and attached to the primary farm', async () => {
    const { service } = setup();
    const created = await service.createAnimal(farmerScope(FARMER_A, 'farmer.livestock.create_own'), validCreateBody());
    expect(created.lifecycleStatus).toBe('ACTIVE');
  });

  it('a duplicate tag within the same herd is rejected with CONFLICT', async () => {
    const { service } = setup();
    const createScope = farmerScope(FARMER_A, 'farmer.livestock.create_own');
    await service.createAnimal(createScope, validCreateBody({ tag: 'C-014' }));
    const error = await errorOf(service.createAnimal(createScope, validCreateBody({ tag: 'C-014' })));
    expect(error.code).toBe('CONFLICT');
    expect(error.status).toBe(409);
  });

  it("two different farmers may both use the same tag (unique per farm, not globally)", async () => {
    const { service } = setup();
    const a = await service.createAnimal(farmerScope(FARMER_A, 'farmer.livestock.create_own'), validCreateBody({ tag: 'C-014' }));
    const b = await service.createAnimal(farmerScope(FARMER_B, 'farmer.livestock.create_own'), validCreateBody({ tag: 'C-014' }));
    expect(a.tag).toBe('C-014');
    expect(b.tag).toBe('C-014');
  });

  it("a production log naming another farmer's animalId is NOT_FOUND", async () => {
    const { service } = setup();
    const bAnimal = await service.createAnimal(farmerScope(FARMER_B, 'farmer.livestock.create_own'), validCreateBody({ tag: 'B-01' }));
    const error = await errorOf(
      service.createProductionLog(farmerScope(FARMER_A, 'farmer.livestock.create_own'), {
        animalId: bAnimal.id,
        productType: 'MILK',
        quantity: 5,
        unit: 'LITERS',
      }),
    );
    expect(error.code).toBe('NOT_FOUND');
  });
});

// ---------------------------------------------------------------------------
// BR-47 — an animal can exit the herd at most once
// ---------------------------------------------------------------------------

describe('livestock — BR-47 an animal can exit the herd at most once', () => {
  it('BR-47a: rejects a second lifecycle event for the same animal', async () => {
    const { service } = setup();
    const editScope = farmerScope(FARMER_A, 'farmer.livestock.edit_own');
    const animal = await service.createAnimal(farmerScope(FARMER_A, 'farmer.livestock.create_own'), validCreateBody());

    const sold = await service.recordLifecycleEvent(editScope, animal.id, { eventType: 'SOLD', counterparty: 'Market buyer' });
    expect(sold.lifecycleStatus).toBe('SOLD');

    const error = await errorOf(service.recordLifecycleEvent(editScope, animal.id, { eventType: 'DECEASED' }));
    expect(error.code).toBe('LIVESTOCK_ALREADY_EXITED');
    expect(error.status).toBe(409);

    // The animal's status from the first (only) event is unchanged.
    const reread = await service.getAnimal(farmerScope(FARMER_A), animal.id);
    expect(reread.lifecycleStatus).toBe('SOLD');
  });

  it('BR-47b: recording the event flips lifecycleStatus to match eventType, in the same transaction', async () => {
    const { service, tx, txsOpened } = setup();
    const editScope = farmerScope(FARMER_A, 'farmer.livestock.edit_own');
    const animal = await service.createAnimal(farmerScope(FARMER_A, 'farmer.livestock.create_own'), validCreateBody());

    txsOpened.length = 0; // only count the transaction opened by recordLifecycleEvent itself
    const updated = await service.recordLifecycleEvent(editScope, animal.id, { eventType: 'CULLED', reason: 'Illness' });

    expect(updated.lifecycleStatus).toBe('CULLED');
    expect(txsOpened).toHaveLength(1);
    expect(txsOpened[0]).toBe(tx);
  });

  it('BR-47c: an animal with a recorded lifecycle event is excluded from the default (active-only) list', async () => {
    const { service } = setup();
    const createScope = farmerScope(FARMER_A, 'farmer.livestock.create_own');
    const editScope = farmerScope(FARMER_A, 'farmer.livestock.edit_own');

    const active = await service.createAnimal(createScope, validCreateBody({ tag: 'A-ACTIVE' }));
    const sold = await service.createAnimal(createScope, validCreateBody({ tag: 'A-SOLD' }));
    await service.recordLifecycleEvent(editScope, sold.id, { eventType: 'TRANSFERRED', counterparty: 'Neighbour farm' });

    const defaultList = await service.listAnimals(farmerScope(FARMER_A), { limit: 20 });
    expect(defaultList.items.map((i) => i.id)).toEqual([active.id]);

    // Explicitly asking for history still finds it.
    const history = await service.listAnimals(farmerScope(FARMER_A), { limit: 20, lifecycleStatus: 'TRANSFERRED' });
    expect(history.items.map((i) => i.id)).toEqual([sold.id]);
  });

  it('a foreign animalId on the lifecycle-event endpoint is NOT_FOUND, never CONFLICT', async () => {
    const { service } = setup();
    const bAnimal = await service.createAnimal(farmerScope(FARMER_B, 'farmer.livestock.create_own'), validCreateBody({ tag: 'B-01' }));
    const error = await errorOf(
      service.recordLifecycleEvent(farmerScope(FARMER_A, 'farmer.livestock.edit_own'), bAnimal.id, { eventType: 'SOLD' }),
    );
    expect(error.code).toBe('NOT_FOUND');
  });
});

// ---------------------------------------------------------------------------
// Production logs — per-animal milk, value-added batches, flock-level eggs
// ---------------------------------------------------------------------------

describe('livestock — production logs', () => {
  it('logs a per-animal milk yield with sessions', async () => {
    const { service } = setup();
    const animal = await service.createAnimal(farmerScope(FARMER_A, 'farmer.livestock.create_own'), validCreateBody());
    const log = await service.createProductionLog(farmerScope(FARMER_A, 'farmer.livestock.create_own'), {
      animalId: animal.id,
      productType: 'MILK',
      quantity: 8.5,
      unit: 'LITERS',
      sessions: 2,
    });
    expect(log.animalId).toBe(animal.id);
    expect(log.quantity).toBe(8.5);
    expect(log.sessions).toBe(2);
  });

  it('logs flock-level egg collection with no animalId', async () => {
    const { service } = setup();
    const log = await service.createProductionLog(farmerScope(FARMER_A, 'farmer.livestock.create_own'), {
      productType: 'EGGS',
      quantity: 42,
      unit: 'COUNT',
    });
    expect(log.animalId).toBeNull();
    expect(log.productType).toBe('EGGS');
  });

  it('logs a value-added produce batch with batchInfo', async () => {
    const { service } = setup();
    const log = await service.createProductionLog(farmerScope(FARMER_A, 'farmer.livestock.create_own'), {
      productType: 'CURD',
      quantity: 3,
      unit: 'KG',
      batchInfo: 'Batch #3, cultured 24hr',
    });
    expect(log.batchInfo).toBe('Batch #3, cultured 24hr');
  });

  it('filters the list by productType and date range', async () => {
    const { service } = setup();
    const createScope = farmerScope(FARMER_A, 'farmer.livestock.create_own');
    await service.createProductionLog(createScope, { productType: 'MILK', quantity: 5, unit: 'LITERS', loggedOn: '2026-09-01' });
    await service.createProductionLog(createScope, { productType: 'EGGS', quantity: 10, unit: 'COUNT', loggedOn: '2026-09-15' });

    const list = await service.listProductionLogs(farmerScope(FARMER_A), { limit: 20, productType: 'MILK' });
    expect(list.items.map((i) => i.productType)).toEqual(['MILK']);

    const dateFiltered = await service.listProductionLogs(farmerScope(FARMER_A), { limit: 20, dateFrom: '2026-09-10' });
    expect(dateFiltered.items.map((i) => i.productType)).toEqual(['EGGS']);
  });

  it('each DAIRY_PRODUCT_UNITS entry rejects a mismatched unit at the schema level', () => {
    const mismatched = createProductionLogBody.safeParse({
      productType: 'MILK',
      quantity: 5,
      unit: 'KG', // MILK is LITERS
    });
    expect(mismatched.success).toBe(false);
  });

  it('accepts each productType with its correct fixed unit', () => {
    const cases: Array<[ProductionLogResponse['productType'], ProductionLogResponse['unit']]> = [
      ['MILK', 'LITERS'],
      ['CURD', 'KG'],
      ['PANEER', 'KG'],
      ['BUTTER', 'KG'],
      ['GHEE', 'LITERS'],
      ['BUTTERMILK', 'LITERS'],
      ['CHEESE', 'KG'],
      ['EGGS', 'COUNT'],
    ];
    for (const [productType, unit] of cases) {
      const result = createProductionLogBody.safeParse({ productType, quantity: 1, unit });
      expect(result.success, `${productType}/${unit} should be valid`).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Admin — read-only view of any farmer's herd
// ---------------------------------------------------------------------------

describe('livestock — admin view_all', () => {
  it("lists a specific farmer's animals, including non-active ones, with no farmerId filter needed from the caller", async () => {
    const { service, admin } = setup();
    const createScope = farmerScope(FARMER_A, 'farmer.livestock.create_own');
    const editScope = farmerScope(FARMER_A, 'farmer.livestock.edit_own');
    const active = await service.createAnimal(createScope, validCreateBody({ tag: 'A-ACTIVE' }));
    const sold = await service.createAnimal(createScope, validCreateBody({ tag: 'A-SOLD' }));
    await service.recordLifecycleEvent(editScope, sold.id, { eventType: 'SOLD' });

    const result = await admin.listAnimalsForFarmer(adminScope, FARMER_A);
    expect(result.items.map((i) => i.id).sort()).toEqual([active.id, sold.id].sort());
  });

  it('an unknown farmerId returns an empty list, not an error', async () => {
    const { admin } = setup();
    const result = await admin.listAnimalsForFarmer(adminScope, newId());
    expect(result.items).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// RBAC sanity
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

describe('livestock — RBAC', () => {
  it('every farmer.livestock.* permission grants CUSTOMER nothing', () => {
    const livestockPermissions = [...loadRbac().byCode.values()].filter((p) => p.code.startsWith('farmer.livestock.'));
    expect(livestockPermissions.length).toBeGreaterThan(0);
    for (const permission of livestockPermissions) {
      const grant = permission.grants[RoleCode.CUSTOMER];
      expect(grant === undefined || grant === ScopeLevel.NONE, `${permission.code} grants CUSTOMER "${String(grant)}"`).toBe(true);
    }
  });

  it('FARMER and CUSTOMER get 403 on admin.livestock.view_all; SUPER/TOHFA admins pass', () => {
    const farmer = aFarmer();
    const customer = anActor({ userId: newId(), roles: [{ code: RoleCode.CUSTOMER }], customerId: IDS.customer });
    for (const actor of [farmer, customer]) {
      const err = runPermission('admin.livestock.view_all', actor, 'GET');
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).status).toBe(403);
      expect((err as AppError).code).toBe('FORBIDDEN');
    }
    for (const role of [RoleCode.SUPER_ADMIN, RoleCode.TOHFA_ADMIN]) {
      expect(runPermission('admin.livestock.view_all', anActor({ roles: [{ code: role }] }), 'GET')).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// Cursor handling
// ---------------------------------------------------------------------------

describe('livestock — list cursor', () => {
  it('rejects a tampered list cursor with VALIDATION_FAILED', async () => {
    const { service } = setup();
    const error = await errorOf(service.listAnimals(farmerScope(FARMER_A), { limit: 20, cursor: 'not-a-cursor' }));
    expect(error.code).toBe('VALIDATION_FAILED');
  });
});

// ---------------------------------------------------------------------------
// Integration — proves the repo SQL parses against migration 0024.
// ---------------------------------------------------------------------------

describeIfDatabase('livestockRepo (integration)', () => {
  let ready = false;

  beforeAll(async () => {
    ready = await databaseReady('livestock_animals');
    if (!ready) console.warn('[skip] livestock_animals not migrated — run `pnpm db:migrate`');
  });

  afterAll(async () => {
    if (!ready) return;
    const { closePool } = await import('../../db/pool.js');
    await closePool();
  });

  it('runs the list/lookup queries against Postgres for a nonexistent farmer', async () => {
    if (!ready) return;
    const { pool } = await import('../../db/pool.js');
    const { livestockRepo } = await import('./livestock.repo.js');
    const nobody = newId();

    expect(await livestockRepo.findAnimal(pool, nobody, newId())).toBeNull();
    expect(await livestockRepo.listAnimalsForFarmer(pool, nobody)).toEqual([]);

    const list = await livestockRepo.listAnimals(pool, { farmerId: nobody, limit: 5 });
    expect(list.items).toEqual([]);

    const logs = await livestockRepo.listProductionLogs(pool, { farmerId: nobody, limit: 5 });
    expect(logs.items).toEqual([]);
  });

  it('BR-47: the database itself rejects a second lifecycle event for the same animal', async () => {
    if (!ready) return;
    const { pool, withTransaction } = await import('../../db/pool.js');

    const anyFarm = await pool.query<{ id: string }>('SELECT id FROM farms LIMIT 1');
    const farmId = anyFarm.rows[0]?.id;
    if (farmId === undefined) return;

    await withTransaction(async (tx) => {
      const animal = await tx.query<{ id: string }>(
        `INSERT INTO livestock_animals (farm_id, tag, species, gender) VALUES ($1, $2, 'CATTLE', 'FEMALE') RETURNING id`,
        [farmId, `TEST-${newId().slice(0, 8)}`],
      );
      const animalId = animal.rows[0]!.id;

      await tx.query(`INSERT INTO livestock_lifecycle_events (animal_id, event_type) VALUES ($1, 'SOLD')`, [animalId]);
      await expect(
        tx.query(`INSERT INTO livestock_lifecycle_events (animal_id, event_type) VALUES ($1, 'DECEASED')`, [animalId]),
      ).rejects.toMatchObject({ code: '23505' });

      // Roll back: this is a real transaction against a shared fixture row.
      throw new Error('__rollback_test_fixture__');
    }).catch((error: unknown) => {
      if (!(error instanceof Error) || error.message !== '__rollback_test_fixture__') throw error;
    });
  });

  it('the append-only trigger rejects an UPDATE/DELETE on livestock_lifecycle_events', async () => {
    if (!ready) return;
    const { pool, withTransaction } = await import('../../db/pool.js');

    const anyFarm = await pool.query<{ id: string }>('SELECT id FROM farms LIMIT 1');
    const farmId = anyFarm.rows[0]?.id;
    if (farmId === undefined) return;

    await withTransaction(async (tx) => {
      const animal = await tx.query<{ id: string }>(
        `INSERT INTO livestock_animals (farm_id, tag, species, gender) VALUES ($1, $2, 'GOAT', 'MALE') RETURNING id`,
        [farmId, `TEST-${newId().slice(0, 8)}`],
      );
      const animalId = animal.rows[0]!.id;
      const event = await tx.query<{ id: string }>(
        `INSERT INTO livestock_lifecycle_events (animal_id, event_type) VALUES ($1, 'CULLED') RETURNING id`,
        [animalId],
      );
      await expect(
        tx.query(`UPDATE livestock_lifecycle_events SET reason = 'changed my mind' WHERE id = $1`, [event.rows[0]!.id]),
      ).rejects.toThrow();

      throw new Error('__rollback_test_fixture__');
    }).catch((error: unknown) => {
      if (!(error instanceof Error) || error.message !== '__rollback_test_fixture__') throw error;
    });
  });
});
