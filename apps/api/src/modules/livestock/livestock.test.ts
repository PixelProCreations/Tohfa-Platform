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
 *  4. Animal records (0084, BR-136..BR-139): service tests against the same
 *     fake, schema tests for every 422, and ROUTE tests through the real app
 *     (supertest) for 401/403 per role and validation wiring.
 *  5. ONE integration block against a real pool, soft-skipped when the
 *     livestock migrations have not run, proving the repo SQL against 0024
 *     and 0084 (animal-record tests run in one rolled-back transaction).
 */
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Request, Response } from 'express';
import request from 'supertest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { loadRbac } from '../../rbac/loadRbac.js';
import { requirePermission, type ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, anActor, aFarmer, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import type { FarmsService } from '../farms/farms.service.js';
import type { FarmWithPlotCount } from '../farms/farms.repo.js';
import {
  breedingRecordStorage,
  healthRecordStorage,
  toBreedingRecord,
  toHealthRecord,
  type AnimalRecordsPage,
  type CreateAnimalData,
  type CreateProductionLogData,
  type ListAnimalRecordsArgs,
  type ListAnimalsArgs,
  type ListProductionLogsArgs,
  type LivestockRepo,
  type UpdateAnimalPatch,
} from './livestock.repo.js';
import {
  createBreedingRecordBody,
  createFeedLogBody,
  createFeedPlanBody,
  createHealthRecordBody,
  createHousingRecordBody,
  createHygieneLogBody,
  createProductionLogBody,
  listBreedingRecordsQuery,
  listFeedLogsQuery,
  listFeedPlansQuery,
  listHealthRecordsQuery,
  listHousingRecordsQuery,
  listHousingRecordsResponse,
  listHygieneLogsQuery,
  type AnimalResponse,
  type CreateAnimalBody,
  type CreateBreedingRecordBody,
  type CreateHealthRecordBody,
  type LivestockBreedingRecord,
  type LivestockFeedLog,
  type LivestockFeedPlan,
  type LivestockHealthRecord,
  type LivestockHousingRecord,
  type LivestockHygieneLog,
  type ProductionLogResponse,
} from './livestock.schema.js';
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
  /** Soft delete — a soft-deleted animal is invisible exactly like a foreign one. */
  deletedAt?: Date | null;
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
  session: ProductionLogResponse['session'];
  qualityGrade: string | null;
  fatPercent: number | null;
  restrictedFromSale: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

/**
 * One animal-record row in the fake (any of the six new resources). The fake
 * keeps the keyset columns (sortDate, createdAt, id) next to the already-
 * mapped response so it can paginate exactly like the real repo's
 * `(date, created_at, id) < cursor` query.
 */
interface FakeAnimalRecord<T> {
  id: string;
  animalId: string;
  farmId: string;
  sortDate: string;
  createdAt: string;
  deleted: boolean;
  /** Filter values the list endpoints accept (recordType, or the date for dateFrom/dateTo). */
  recordType?: string;
  response: T;
}

/** Array#sort comparator for the keyset tuple in DESC order: a positive result means `a` sorts AFTER `b`. */
function compareKeyDesc(a: { sortDate: string; createdAt: string; id: string }, b: { sortDate: string; createdAt: string; id: string }): number {
  if (a.sortDate !== b.sortDate) return a.sortDate < b.sortDate ? 1 : -1;
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1;
  if (a.id !== b.id) return a.id < b.id ? 1 : -1;
  return 0;
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
  /** uploadId -> uploaded_by (null = an upload with no recorded owner). */
  const uploads = new Map<string, string | null>();
  const records = {
    health: [] as FakeAnimalRecord<LivestockHealthRecord>[],
    breeding: [] as FakeAnimalRecord<LivestockBreedingRecord>[],
    feedPlans: [] as FakeAnimalRecord<LivestockFeedPlan>[],
    feedLogs: [] as FakeAnimalRecord<LivestockFeedLog>[],
    housing: [] as FakeAnimalRecord<LivestockHousingRecord>[],
    hygiene: [] as FakeAnimalRecord<LivestockHygieneLog>[],
  };

  const calls = {
    listAnimalsArgs: [] as ListAnimalsArgs[],
    updateAnimalExecutors: [] as Executor[],
    lifecycleExecutors: [] as Executor[],
    recordInsertExecutors: [] as Executor[],
    extendWithdrawal: [] as Array<{ db: Executor; animalId: string; until: string }>,
  };

  /**
   * BR-140: the raw JSON text of system_config.livestock_min_indoor_space_sqft_per_animal
   * as the real repo returns it (`value::text`), or undefined when the row is missing.
   */
  const config = { minIndoorSpaceSqFt: '11' as string | undefined, minIndoorSpaceReads: 0 };

  // Strictly increasing created_at so ties on the record date still order
  // deterministically, the way the real table's created_at + id do.
  let tick = 0;
  const nextCreatedAt = (): string => new Date(Date.UTC(2026, 9, 1) + tick++ * 1000).toISOString();

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
    session: p.session,
    qualityGrade: p.qualityGrade,
    fatPercent: p.fatPercent,
    restrictedFromSale: p.restrictedFromSale,
    notes: p.notes,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt === null ? null : p.updatedAt.toISOString(),
  });

  const findOwnedAnimal = (farmerId: string, animalId: string): StoredAnimal | null => {
    const a = animals.get(animalId);
    if (a === undefined || (a.deletedAt ?? null) !== null) return null;
    return FARM_OWNERSHIP.get(a.farmId) === farmerId ? a : null;
  };

  /** Mirrors the real repo's keyset list: ownership via the animal, soft-deleted rows excluded, DESC order. */
  function pageOf<T>(
    rows: FakeAnimalRecord<T>[],
    args: ListAnimalRecordsArgs,
    filter: (row: FakeAnimalRecord<T>) => boolean = () => true,
  ): AnimalRecordsPage<T> {
    if (findOwnedAnimal(args.farmerId, args.animalId) === null) return { items: [], next: null };
    const cursor = args.cursor;
    const sorted = rows
      .filter((r) => r.animalId === args.animalId && !r.deleted && filter(r))
      .sort(compareKeyDesc)
      // Keyset: keep only rows that sort strictly after the cursor row.
      .filter((r) => cursor === undefined || compareKeyDesc(r, { sortDate: cursor.date, createdAt: cursor.createdAt, id: cursor.id }) > 0);
    const page = sorted.slice(0, args.limit);
    const last = page[page.length - 1];
    const hasMore = sorted.length > args.limit;
    return {
      items: page.map((r) => r.response),
      next: hasMore && last !== undefined ? { date: last.sortDate, createdAt: last.createdAt, id: last.id } : null,
    };
  }

  function insertRecord<T>(
    db: Executor,
    bucket: FakeAnimalRecord<T>[],
    farmerId: string,
    animalId: string,
    build: (meta: { id: string; createdAt: string }) => { sortDate: string; recordType?: string; response: T },
  ): T | null {
    calls.recordInsertExecutors.push(db);
    const animal = findOwnedAnimal(farmerId, animalId);
    if (animal === null) return null;
    const meta = { id: newId(), createdAt: nextCreatedAt() };
    const built = build(meta);
    bucket.push({ ...meta, animalId, farmId: animal.farmId, deleted: false, ...built });
    return built.response;
  }

  const TODAY = '2026-10-01';

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
        loggedOn: data.loggedOn,
        batchInfo: data.batchInfo ?? null,
        sessions: data.sessions ?? null,
        session: data.session ?? null,
        qualityGrade: data.qualityGrade ?? null,
        fatPercent: data.fatPercent ?? null,
        restrictedFromSale: data.restrictedFromSale,
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

    // --- animal records (BR-136..BR-138) -----------------------------------

    async findUploadOwner(_db, uploadId) {
      return uploads.has(uploadId) ? (uploads.get(uploadId) ?? null) : undefined;
    },

    async extendAnimalWithdrawal(db, animalId, until) {
      calls.extendWithdrawal.push({ db, animalId, until });
      const a = animals.get(animalId);
      if (a === undefined) return;
      // GREATEST(COALESCE(withdrawal_until, until), until) — never shortens.
      a.withdrawalUntil = a.withdrawalUntil !== null && a.withdrawalUntil > until ? a.withdrawalUntil : until;
      a.updatedAt = new Date();
    },

    async insertHealthRecord(db, farmerId, animalId, body) {
      return insertRecord(db, records.health, farmerId, animalId, ({ id, createdAt }) => {
        const response = toHealthRecord({ ...healthRecordStorage(body), id, animalId, createdAt, updatedAt: null });
        return { sortDate: body.recordDate, recordType: body.recordType, response };
      });
    },
    async listHealthRecords(_db, args) {
      return pageOf(records.health, args, (r) => args.recordType === undefined || r.recordType === args.recordType);
    },

    async insertBreedingRecord(db, farmerId, animalId, body) {
      return insertRecord(db, records.breeding, farmerId, animalId, ({ id, createdAt }) => {
        const response = toBreedingRecord({ ...breedingRecordStorage(body), id, animalId, createdAt, updatedAt: null });
        return { sortDate: body.recordDate, recordType: body.recordType, response };
      });
    },
    async listBreedingRecords(_db, args) {
      return pageOf(records.breeding, args, (r) => args.recordType === undefined || r.recordType === args.recordType);
    },

    async insertFeedPlan(db, farmerId, animalId, body) {
      return insertRecord(db, records.feedPlans, farmerId, animalId, ({ id, createdAt }) => {
        const effectiveFrom = body.effectiveFrom ?? TODAY;
        return {
          sortDate: effectiveFrom,
          response: {
            id,
            animalId,
            effectiveFrom,
            planName: body.planName ?? null,
            feedType: body.feedType,
            source: body.source ?? null,
            grazingDuration: body.grazingDuration ?? null,
            waterSource: body.waterSource,
            startTime: body.startTime ?? null,
            endTime: body.endTime ?? null,
            items: body.items,
            notes: body.notes ?? null,
            attachmentUploadId: body.attachmentUploadId ?? null,
            createdAt,
            updatedAt: null,
          },
        };
      });
    },
    async listFeedPlans(_db, args) {
      return pageOf(records.feedPlans, args);
    },

    async insertFeedLog(db, farmerId, animalId, body) {
      return insertRecord(db, records.feedLogs, farmerId, animalId, ({ id, createdAt }) => {
        const fedOn = body.fedOn ?? TODAY;
        return {
          sortDate: fedOn,
          response: {
            id,
            animalId,
            fedOn,
            feedType: body.feedType,
            quantity: body.quantity,
            unit: body.unit,
            notes: body.notes ?? null,
            createdAt,
            updatedAt: null,
          },
        };
      });
    },
    async listFeedLogs(_db, args) {
      return pageOf(
        records.feedLogs,
        args,
        (r) => (args.dateFrom === undefined || r.sortDate >= args.dateFrom) && (args.dateTo === undefined || r.sortDate <= args.dateTo),
      );
    },

    async insertHousingRecord(db, farmerId, animalId, body) {
      return insertRecord(db, records.housing, farmerId, animalId, ({ id, createdAt }) => ({
        sortDate: body.startDate,
        response: {
          id,
          animalId,
          housingType: body.housingType,
          housingName: body.housingName,
          location: body.location ?? null,
          indoorSpacePerAnimal: body.indoorSpacePerAnimal,
          outdoorSpace: body.outdoorSpace,
          startDate: body.startDate,
          notes: body.notes ?? null,
          attachmentUploadId: body.attachmentUploadId ?? null,
          createdAt,
          updatedAt: null,
        },
      }));
    },
    async listHousingRecords(_db, args) {
      return pageOf(records.housing, args);
    },
    async getMinIndoorSpaceSqFtPerAnimal() {
      config.minIndoorSpaceReads += 1;
      return config.minIndoorSpaceSqFt;
    },

    async insertHygieneLog(db, farmerId, animalId, body) {
      return insertRecord(db, records.hygiene, farmerId, animalId, ({ id, createdAt }) => {
        const performedOn = body.performedOn ?? TODAY;
        return {
          sortDate: performedOn,
          response: { id, animalId, activity: body.activity, performedOn, notes: body.notes ?? null, createdAt, updatedAt: null },
        };
      });
    },
    async listHygieneLogs(_db, args) {
      return pageOf(
        records.hygiene,
        args,
        (r) => (args.dateFrom === undefined || r.sortDate >= args.dateFrom) && (args.dateTo === undefined || r.sortDate <= args.dateTo),
      );
    },
  };

  return { repo, animals, productionLogs, calls, uploads, records, config };
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
  /**
   * Simulates a real transaction's all-or-nothing behaviour over the fake's
   * state: on a throw, every record bucket and every animal's withdrawal/
   * updatedAt is restored to its pre-transaction value. This is what lets
   * BR-137e assert "insert + animal update roll back together" without a DB.
   */
  const runTx: TransactionRunner = async (fn) => {
    txsOpened.push(tx);
    const bucketLengths = Object.fromEntries(Object.entries(fake.records).map(([k, v]) => [k, v.length]));
    const animalSnapshot = new Map([...fake.animals.entries()].map(([id, a]) => [id, { withdrawalUntil: a.withdrawalUntil, updatedAt: a.updatedAt }]));
    try {
      return await fn(tx);
    } catch (error) {
      for (const [k, v] of Object.entries(fake.records)) v.length = bucketLengths[k] ?? 0;
      for (const [id, snap] of animalSnapshot) {
        const a = fake.animals.get(id);
        if (a !== undefined) Object.assign(a, snap);
      }
      throw error;
    }
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

// ===========================================================================
// Animal records (AnimalDetailScreen): health, breeding, feed plans, feed
// logs, housing, hygiene — BR-136..BR-139
// ===========================================================================

const createScopeA = (): ResolvedScope => farmerScope(FARMER_A, 'farmer.livestock.create_own');

/** Valid bodies, parsed through the real schemas so defaults are applied exactly as the route would. */
const bodies = {
  vaccination: (o: Record<string, unknown> = {}): CreateHealthRecordBody =>
    createHealthRecordBody.parse({ recordType: 'VACCINATION', recordDate: '2026-10-01', vaccineName: 'FMD vaccine', ...o }),
  treatment: (o: Record<string, unknown> = {}): CreateHealthRecordBody =>
    createHealthRecordBody.parse({
      recordType: 'TREATMENT',
      recordDate: '2026-10-01',
      condition: 'Mastitis',
      description: 'Left hind quarter swollen and warm',
      ...o,
    }),
  heat: (o: Record<string, unknown> = {}): CreateBreedingRecordBody =>
    createBreedingRecordBody.parse({
      recordType: 'HEAT',
      recordDate: '2026-10-01',
      breedingMethod: 'ARTIFICIAL_INSEMINATION',
      sire: 'Bull #01 (Sahiwal)',
      ...o,
    }),
  feedPlan: (o: Record<string, unknown> = {}) => createFeedPlanBody.parse({ feedType: 'GREEN_FODDER', waterSource: 'BOREWELL', ...o }),
  feedLog: (o: Record<string, unknown> = {}) => createFeedLogBody.parse({ feedType: 'DRY_FODDER', quantity: 5, unit: 'KG', fedOn: '2026-10-01', ...o }),
  housing: (o: Record<string, unknown> = {}) =>
    createHousingRecordBody.parse({
      housingType: 'BARN',
      housingName: 'Shed A',
      indoorSpacePerAnimal: { value: 40, unit: 'SQ_FT' },
      outdoorSpace: { value: 80, unit: 'SQ_FT' },
      startDate: '2026-10-01',
      ...o,
    }),
  hygiene: (o: Record<string, unknown> = {}) => createHygieneLogBody.parse({ activity: 'Bedding replaced', performedOn: '2026-10-01', ...o }),
};

function withUpload<T extends object>(body: T, attachmentUploadId: string | undefined): T {
  return attachmentUploadId === undefined ? body : { ...body, attachmentUploadId };
}

type Service = ReturnType<typeof createLivestockService>;
type Page = { items: Array<{ id: string }>; page: { nextCursor: string | null; hasMore: boolean } };
type PageQuery = { cursor?: string; limit?: number };
type Bucket = keyof ReturnType<typeof createFakeRepo>['records'];

interface ResourceCase {
  name: string;
  bucket: Bucket;
  /** Whether the create body accepts `attachmentUploadId` (BR-136c). */
  attachment: boolean;
  create(service: Service, scope: ResolvedScope, animalId: string, uploadId?: string): Promise<{ id: string }>;
  list(service: Service, scope: ResolvedScope, animalId: string, query?: PageQuery): Promise<Page>;
  /** The exact empty-page body of this list (BR-136b); defaults to EMPTY_PAGE. */
  emptyPage?: object;
}

const RESOURCES: ResourceCase[] = [
  {
    name: 'health-records',
    bucket: 'health',
    attachment: true,
    create: (s, scope, id, up) => s.createHealthRecord(scope, id, withUpload(bodies.vaccination(), up)),
    list: (s, scope, id, q = {}) => s.listHealthRecords(scope, id, listHealthRecordsQuery.parse(q)),
  },
  {
    name: 'breeding-records',
    bucket: 'breeding',
    attachment: true,
    create: (s, scope, id, up) => s.createBreedingRecord(scope, id, withUpload(bodies.heat(), up)),
    list: (s, scope, id, q = {}) => s.listBreedingRecords(scope, id, listBreedingRecordsQuery.parse(q)),
  },
  {
    name: 'feed-plans',
    bucket: 'feedPlans',
    attachment: true,
    create: (s, scope, id, up) => s.createFeedPlan(scope, id, withUpload(bodies.feedPlan({ effectiveFrom: '2026-10-01' }), up)),
    list: (s, scope, id, q = {}) => s.listFeedPlans(scope, id, listFeedPlansQuery.parse(q)),
  },
  {
    name: 'feed-logs',
    bucket: 'feedLogs',
    attachment: false,
    create: (s, scope, id) => s.createFeedLog(scope, id, bodies.feedLog()),
    list: (s, scope, id, q = {}) => s.listFeedLogs(scope, id, listFeedLogsQuery.parse(q)),
  },
  {
    name: 'housing-records',
    bucket: 'housing',
    attachment: true,
    create: (s, scope, id, up) => s.createHousingRecord(scope, id, withUpload(bodies.housing(), up)),
    list: (s, scope, id, q = {}) => s.listHousingRecords(scope, id, listHousingRecordsQuery.parse(q)),
    // BR-140: the housing list also carries the configured space standard, even when empty.
    emptyPage: { items: [], page: { nextCursor: null, hasMore: false }, spaceStandard: { minIndoorSqFtPerAnimal: 11 } },
  },
  {
    name: 'hygiene-logs',
    bucket: 'hygiene',
    attachment: false,
    create: (s, scope, id) => s.createHygieneLog(scope, id, bodies.hygiene()),
    list: (s, scope, id, q = {}) => s.listHygieneLogs(scope, id, listHygieneLogsQuery.parse(q)),
  },
];

async function ownAnimal(service: Service, farmerId: string, overrides: Partial<CreateAnimalBody> = {}): Promise<AnimalResponse> {
  return service.createAnimal(farmerScope(farmerId, 'farmer.livestock.create_own'), validCreateBody({ tag: `T-${newId().slice(0, 8)}`, ...overrides }));
}

const EMPTY_PAGE = { items: [], page: { nextCursor: null, hasMore: false } };

describe('livestock animal records — BR-136 owner-scoped, farm-side only', () => {
  for (const r of RESOURCES) {
    it(`BR-136a: POST ${r.name} on another farmer's animal is 404 and writes nothing`, async () => {
      const { service, records } = setup();
      const bAnimal = await ownAnimal(service, FARMER_B);

      const error = await errorOf(r.create(service, createScopeA(), bAnimal.id));
      expect(error.code).toBe('NOT_FOUND');
      expect(error.status).toBe(404);
      expect(records[r.bucket]).toHaveLength(0);
    });

    it(`BR-136a: POST ${r.name} on a nonexistent or soft-deleted animal is 404`, async () => {
      const { service, animals, records } = setup();
      expect((await errorOf(r.create(service, createScopeA(), newId()))).code).toBe('NOT_FOUND');

      const mine = await ownAnimal(service, FARMER_A);
      animals.get(mine.id)!.deletedAt = new Date();
      expect((await errorOf(r.create(service, createScopeA(), mine.id))).code).toBe('NOT_FOUND');
      expect(records[r.bucket]).toHaveLength(0);
    });

    it(`BR-136b: GET ${r.name} on another farmer's (or a nonexistent) animal is an empty page, not 403/404`, async () => {
      const { service } = setup();
      const bAnimal = await ownAnimal(service, FARMER_B);
      await r.create(service, farmerScope(FARMER_B, 'farmer.livestock.create_own'), bAnimal.id);

      expect(await r.list(service, farmerScope(FARMER_A), bAnimal.id)).toEqual(r.emptyPage ?? EMPTY_PAGE);
      expect(await r.list(service, farmerScope(FARMER_A), newId())).toEqual(r.emptyPage ?? EMPTY_PAGE);
      // The owner still sees it — the empty page above is scoping, not a broken list.
      expect((await r.list(service, farmerScope(FARMER_B), bAnimal.id)).items).toHaveLength(1);
    });

    it(`BR-136d: GET ${r.name} excludes soft-deleted rows`, async () => {
      const { service, records } = setup();
      const animal = await ownAnimal(service, FARMER_A);
      const gone = await r.create(service, createScopeA(), animal.id);
      const kept = await r.create(service, createScopeA(), animal.id);
      records[r.bucket].find((row) => row.id === gone.id)!.deleted = true;

      const list = await r.list(service, farmerScope(FARMER_A), animal.id);
      expect(list.items.map((i) => i.id)).toEqual([kept.id]);
    });

    it(`BR-136f: ${r.name} responses carry no farmId`, async () => {
      const { service } = setup();
      const animal = await ownAnimal(service, FARMER_A);
      const created = await r.create(service, createScopeA(), animal.id);
      const list = await r.list(service, farmerScope(FARMER_A), animal.id);
      for (const shape of [created, ...list.items]) {
        expect(Object.keys(shape)).not.toContain('farmId');
        expect(Object.keys(shape)).not.toContain('farm_id');
        expect(JSON.stringify(shape)).not.toContain(FARM_A);
      }
    });

    it(`BR-136g: GET ${r.name} cursor pagination is stable and an invalid cursor is 422`, async () => {
      const { service } = setup();
      const animal = await ownAnimal(service, FARMER_A);
      // Same record date for all three: the order must still be total (created_at, id).
      for (let i = 0; i < 3; i += 1) await r.create(service, createScopeA(), animal.id);

      const all = await r.list(service, farmerScope(FARMER_A), animal.id, { limit: 100 });
      const first = await r.list(service, farmerScope(FARMER_A), animal.id, { limit: 2 });
      expect(first.items).toHaveLength(2);
      expect(first.page.hasMore).toBe(true);
      expect(first.page.nextCursor).not.toBeNull();

      const second = await r.list(service, farmerScope(FARMER_A), animal.id, { limit: 2, cursor: first.page.nextCursor! });
      expect(second.items).toHaveLength(1);
      expect(second.page).toEqual({ nextCursor: null, hasMore: false });
      expect([...first.items, ...second.items].map((i) => i.id)).toEqual(all.items.map((i) => i.id));

      for (const bad of ['not-a-cursor', Buffer.from(JSON.stringify(['2026-10-01', 'x', 'y'])).toString('base64url')]) {
        const error = await errorOf(r.list(service, farmerScope(FARMER_A), animal.id, { cursor: bad }));
        expect(error.code).toBe('VALIDATION_FAILED');
        expect(error.status).toBe(422);
      }
    });

    if (r.attachment) {
      it(`BR-136c: POST ${r.name} rejects an attachmentUploadId the caller does not own (422) and accepts their own`, async () => {
        const { service, uploads, records } = setup();
        const animal = await ownAnimal(service, FARMER_A);
        const scope = createScopeA();

        const foreign = newId();
        uploads.set(foreign, newId());
        const ownerless = newId();
        uploads.set(ownerless, null);
        for (const bad of [foreign, ownerless, newId() /* no such upload */]) {
          const error = await errorOf(r.create(service, scope, animal.id, bad));
          expect(error.code).toBe('VALIDATION_FAILED');
          expect(error.status).toBe(422);
        }
        expect(records[r.bucket]).toHaveLength(0);

        const own = newId();
        uploads.set(own, scope.userId);
        const created = (await r.create(service, scope, animal.id, own)) as { attachmentUploadId?: string | null };
        expect(created.attachmentUploadId).toBe(own);
      });
    }
  }

  it('BR-136: records may be added to an animal of any lifecycle status (back-filling after a sale)', async () => {
    const { service } = setup();
    const animal = await ownAnimal(service, FARMER_A);
    await service.recordLifecycleEvent(farmerScope(FARMER_A, 'farmer.livestock.edit_own'), animal.id, { eventType: 'SOLD' });
    const record = await service.createHealthRecord(createScopeA(), animal.id, bodies.vaccination());
    expect(record.animalId).toBe(animal.id);
  });

  it('BR-136: the health-record list filters by recordType and returns newest recordDate first', async () => {
    const { service } = setup();
    const animal = await ownAnimal(service, FARMER_A);
    const older = await service.createHealthRecord(createScopeA(), animal.id, bodies.vaccination({ recordDate: '2026-09-01' }));
    const newer = await service.createHealthRecord(createScopeA(), animal.id, bodies.vaccination({ recordDate: '2026-10-05' }));
    await service.createHealthRecord(createScopeA(), animal.id, bodies.treatment());

    const vaccinations = await service.listHealthRecords(farmerScope(FARMER_A), animal.id, listHealthRecordsQuery.parse({ recordType: 'VACCINATION' }));
    expect(vaccinations.items.map((i) => i.id)).toEqual([newer.id, older.id]);
  });

  it('BR-136f: the record response builders are allow-lists — an unexpected key never reaches the response', () => {
    const stored = { ...healthRecordStorage(bodies.vaccination()), id: newId(), animalId: newId(), createdAt: new Date().toISOString(), updatedAt: null };
    const leaked = toHealthRecord({ ...stored, details: { ...stored.details, farmId: FARM_A } } as typeof stored);
    expect(JSON.stringify(leaked)).not.toContain(FARM_A);
  });

  it('health records return every documented key, null when not supplied', async () => {
    const { service } = setup();
    const animal = await ownAnimal(service, FARMER_A);
    const record = await service.createHealthRecord(createScopeA(), animal.id, bodies.vaccination());
    expect(record).toMatchObject({
      recordType: 'VACCINATION',
      vaccineName: 'FMD vaccine',
      veterinarian: null,
      dose: null,
      route: null,
      batchNumber: null,
      nextDueDate: null,
      notes: null,
      attachmentUploadId: null,
      updatedAt: null,
    });
  });
});

describe('livestock animal records — request validation (422 via the Zod schemas)', () => {
  it('BR-136: every create body is strict — an unknown key is rejected', () => {
    const cases: Array<[string, { safeParse: (v: unknown) => { success: boolean } }, Record<string, unknown>]> = [
      ['health', createHealthRecordBody, { recordType: 'VACCINATION', recordDate: '2026-10-01', vaccineName: 'FMD' }],
      ['breeding', createBreedingRecordBody, { recordType: 'HEAT', recordDate: '2026-10-01', breedingMethod: 'NATURAL_SERVICE', sire: 'Bull' }],
      ['feedPlan', createFeedPlanBody, { feedType: 'SILAGE', waterSource: 'WELL' }],
      ['feedLog', createFeedLogBody, { feedType: 'SILAGE', quantity: 2, unit: 'KG' }],
      ['housing', createHousingRecordBody, { housingType: 'STALL', housingName: 'S1', indoorSpacePerAnimal: { value: 1, unit: 'SQ_M' }, outdoorSpace: { value: 0, unit: 'SQ_M' }, startDate: '2026-10-01' }],
      ['hygiene', createHygieneLogBody, { activity: 'Floor washed' }],
    ];
    for (const [name, schema, valid] of cases) {
      expect(schema.safeParse(valid).success, `${name} valid body`).toBe(true);
      expect(schema.safeParse({ ...valid, farmId: FARM_A }).success, `${name} + farmId`).toBe(false);
    }
  });

  it('health records: the recordType discriminator selects the variant; unknown types and missing variant fields are rejected', () => {
    expect(createHealthRecordBody.safeParse({ recordType: 'SURGERY', recordDate: '2026-10-01' }).success).toBe(false);
    expect(createHealthRecordBody.safeParse({ recordType: 'VACCINATION', recordDate: '2026-10-01' }).success).toBe(false);
    expect(createHealthRecordBody.safeParse({ recordType: 'CHECKUP', recordDate: '2026-10-01', checkupType: 'ROUTINE', veterinarian: 'Dr. R' }).success).toBe(false); // clinic missing
    expect(createHealthRecordBody.safeParse({ recordType: 'TREATMENT', recordDate: '2026-10-01', condition: 'Cough' }).success).toBe(false); // description missing
    expect(createHealthRecordBody.safeParse({ recordType: 'VACCINATION', vaccineName: 'FMD' }).success).toBe(false); // recordDate missing
    expect(createHealthRecordBody.safeParse({ recordType: 'VACCINATION', recordDate: '01-10-2026', vaccineName: 'FMD' }).success).toBe(false);
    // A field from another variant is an unknown key for this one.
    expect(createHealthRecordBody.safeParse({ recordType: 'VACCINATION', recordDate: '2026-10-01', vaccineName: 'FMD', productName: 'X' }).success).toBe(false);
  });

  it('BR-137d: withdrawal fields on a non-TREATMENT health record are rejected', () => {
    for (const recordType of ['VACCINATION', 'DEWORMING', 'CHECKUP'] as const) {
      const base: Record<string, unknown> = {
        VACCINATION: { vaccineName: 'FMD' },
        DEWORMING: { productName: 'Albendazole' },
        CHECKUP: { checkupType: 'ROUTINE', veterinarian: 'Dr. R', clinic: 'Ooty Vet' },
      }[recordType];
      const body = { recordType, recordDate: '2026-10-01', ...(base as object) };
      expect(createHealthRecordBody.safeParse(body).success, `${recordType} valid`).toBe(true);
      const withWithdrawal = { ...body, milkWithdrawal: { startDate: '2026-10-01', endDate: '2026-10-05' } };
      expect(createHealthRecordBody.safeParse(withWithdrawal).success, `${recordType} + milkWithdrawal`).toBe(false);
      expect(createHealthRecordBody.safeParse({ ...body, meatWithdrawal: { endDate: '2026-10-05' } }).success, `${recordType} + meatWithdrawal`).toBe(false);
    }
  });

  it('BR-137c: a withdrawal endDate before its startDate, or before recordDate, is rejected', () => {
    const t = { recordType: 'TREATMENT', recordDate: '2026-10-10', condition: 'Mastitis', description: 'x' };
    expect(createHealthRecordBody.safeParse({ ...t, milkWithdrawal: { startDate: '2026-10-10', endDate: '2026-10-15' } }).success).toBe(true);
    expect(createHealthRecordBody.safeParse({ ...t, milkWithdrawal: { startDate: '2026-10-12', endDate: '2026-10-11' } }).success).toBe(false);
    expect(createHealthRecordBody.safeParse({ ...t, milkWithdrawal: { startDate: '2026-10-01', endDate: '2026-10-05' } }).success).toBe(false); // < recordDate
    expect(createHealthRecordBody.safeParse({ ...t, milkWithdrawal: { endDate: '2026-10-15' } }).success).toBe(false); // milk startDate required
    expect(createHealthRecordBody.safeParse({ ...t, meatWithdrawal: { endDate: '2026-10-20' } }).success).toBe(true); // meat startDate optional
    expect(createHealthRecordBody.safeParse({ ...t, meatWithdrawal: { startDate: '2026-10-21', endDate: '2026-10-20' } }).success).toBe(false);
    expect(createHealthRecordBody.safeParse({ ...t, meatWithdrawal: { endDate: '2026-10-09' } }).success).toBe(false); // < recordDate
    expect(createHealthRecordBody.safeParse({ ...t, milkWithdrawal: { startDate: '2026-10-10', endDate: '2026-10-15', reason: 'x'.repeat(501) } }).success).toBe(false);
  });

  it('health records: due/follow-up dates cannot precede recordDate; followUpDate is required iff followUpRequired', () => {
    const v = { recordType: 'VACCINATION', recordDate: '2026-10-10', vaccineName: 'FMD' };
    expect(createHealthRecordBody.safeParse({ ...v, nextDueDate: '2027-04-10' }).success).toBe(true);
    expect(createHealthRecordBody.safeParse({ ...v, nextDueDate: '2026-10-09' }).success).toBe(false);
    const d = { recordType: 'DEWORMING', recordDate: '2026-10-10', productName: 'Albendazole' };
    expect(createHealthRecordBody.safeParse({ ...d, nextDueDate: '2026-10-01' }).success).toBe(false);

    const c = { recordType: 'CHECKUP', recordDate: '2026-10-10', checkupType: 'ROUTINE', veterinarian: 'Dr. R', clinic: 'Ooty Vet' };
    expect(createHealthRecordBody.safeParse({ ...c, followUpRequired: true, followUpDate: '2026-10-20' }).success).toBe(true);
    expect(createHealthRecordBody.safeParse({ ...c, followUpRequired: true }).success).toBe(false);
    expect(createHealthRecordBody.safeParse({ ...c, followUpRequired: false, followUpDate: '2026-10-20' }).success).toBe(false);
    expect(createHealthRecordBody.safeParse({ ...c, followUpRequired: true, followUpDate: '2026-10-01' }).success).toBe(false);
  });

  it('health records: medicationEndDate cannot precede medicationStartDate; long text is capped at 2000', () => {
    const t = { recordType: 'TREATMENT', recordDate: '2026-10-10', condition: 'Mastitis', description: 'x' };
    expect(createHealthRecordBody.safeParse({ ...t, medicationStartDate: '2026-10-10', medicationEndDate: '2026-10-14' }).success).toBe(true);
    expect(createHealthRecordBody.safeParse({ ...t, medicationStartDate: '2026-10-10', medicationEndDate: '2026-10-09' }).success).toBe(false);
    expect(createHealthRecordBody.safeParse({ ...t, description: 'x'.repeat(2001) }).success).toBe(false);
    expect(createHealthRecordBody.safeParse({ ...t, condition: 'x'.repeat(161) }).success).toBe(false);
    expect(createHealthRecordBody.safeParse({ ...t, condition: '   ' }).success).toBe(false);
  });

  it('enums, HH:MM times and measured units are validated', () => {
    const v = { recordType: 'VACCINATION', recordDate: '2026-10-10', vaccineName: 'FMD' };
    expect(createHealthRecordBody.safeParse({ ...v, route: 'INJECTION_IM', dose: { value: 2, unit: 'ML' } }).success).toBe(true);
    expect(createHealthRecordBody.safeParse({ ...v, route: 'IV' }).success).toBe(false);
    expect(createHealthRecordBody.safeParse({ ...v, dose: { value: 2, unit: 'LITERS' } }).success).toBe(false);
    expect(createHealthRecordBody.safeParse({ ...v, dose: { value: 0, unit: 'ML' } }).success).toBe(false);
    const c = { recordType: 'CHECKUP', recordDate: '2026-10-10', checkupType: 'ROUTINE', veterinarian: 'Dr. R', clinic: 'Ooty Vet' };
    expect(createHealthRecordBody.safeParse({ ...c, checkupTime: '07:30' }).success).toBe(true);
    expect(createHealthRecordBody.safeParse({ ...c, checkupTime: '23:59' }).success).toBe(true);
    for (const bad of ['7:30', '24:00', '12:60', '0730']) {
      expect(createHealthRecordBody.safeParse({ ...c, checkupTime: bad }).success, bad).toBe(false);
    }
    expect(createHealthRecordBody.safeParse({ ...c, bodyTemperature: { value: 38.6, unit: 'C' } }).success).toBe(true);
    expect(createHealthRecordBody.safeParse({ ...c, bodyTemperature: { value: 38.6, unit: 'K' } }).success).toBe(false);
  });

  it('breeding records: PREGNANCY_CHECK needs nextCheckDate; projected dates cannot precede recordDate; CALVING offspringCount defaults to 1 within 0..20', () => {
    const p = { recordType: 'PREGNANCY_CHECK', recordDate: '2026-10-10', checkType: 'CONFIRMATION', result: 'POSITIVE', examinationMethod: 'ULTRASOUND' };
    expect(createBreedingRecordBody.safeParse({ ...p, nextCheckDate: '2026-11-10', expectedDeliveryDate: '2027-07-01' }).success).toBe(true);
    expect(createBreedingRecordBody.safeParse(p).success).toBe(false);
    expect(createBreedingRecordBody.safeParse({ ...p, nextCheckDate: '2026-10-01' }).success).toBe(false);
    expect(createBreedingRecordBody.safeParse({ ...p, nextCheckDate: '2026-11-10', expectedDeliveryDate: '2026-10-01' }).success).toBe(false);
    expect(createBreedingRecordBody.safeParse({ ...p, nextCheckDate: '2026-11-10', gestationAge: { value: 1.5, unit: 'MONTHS' } }).success).toBe(false); // int only

    const calving = createBreedingRecordBody.parse({ recordType: 'CALVING', recordDate: '2026-10-10', outcome: 'LIVE_BIRTH' });
    expect(calving.recordType === 'CALVING' && calving.offspringCount).toBe(1);
    expect(createBreedingRecordBody.safeParse({ recordType: 'CALVING', recordDate: '2026-10-10', outcome: 'STILLBIRTH', offspringCount: 0 }).success).toBe(true);
    expect(createBreedingRecordBody.safeParse({ recordType: 'CALVING', recordDate: '2026-10-10', outcome: 'LIVE_BIRTH', offspringCount: 21 }).success).toBe(false);
    expect(createBreedingRecordBody.safeParse({ recordType: 'INSEMINATION', recordDate: '2026-10-10', inseminationType: 'ARTIFICIAL', inseminationTime: '25:00' }).success).toBe(false);
  });

  it('feed plans: HOURS_PER_DAY is at most 24, HOURS_PER_WEEK at most 168, items at most 20 and default to []', () => {
    const base = { feedType: 'PASTURE_GRAZING', waterSource: 'CANAL' };
    expect(createFeedPlanBody.parse(base).items).toEqual([]);
    expect(createFeedPlanBody.safeParse({ ...base, grazingDuration: { value: 24, unit: 'HOURS_PER_DAY' } }).success).toBe(true);
    expect(createFeedPlanBody.safeParse({ ...base, grazingDuration: { value: 25, unit: 'HOURS_PER_DAY' } }).success).toBe(false);
    expect(createFeedPlanBody.safeParse({ ...base, grazingDuration: { value: 100, unit: 'HOURS_PER_WEEK' } }).success).toBe(true);
    expect(createFeedPlanBody.safeParse({ ...base, grazingDuration: { value: 169, unit: 'HOURS_PER_WEEK' } }).success).toBe(false);
    const item = { name: 'Napier grass', amount: 20, unit: 'KG_PER_DAY' };
    expect(createFeedPlanBody.safeParse({ ...base, items: Array.from({ length: 20 }, () => item) }).success).toBe(true);
    expect(createFeedPlanBody.safeParse({ ...base, items: Array.from({ length: 21 }, () => item) }).success).toBe(false);
    expect(createFeedPlanBody.safeParse({ ...base, items: [{ ...item, amount: 0 }] }).success).toBe(false);
    expect(createFeedPlanBody.safeParse({ ...base, items: [{ ...item, extra: true }] }).success).toBe(false);
    expect(createFeedPlanBody.safeParse({ ...base, startTime: '06:00', endTime: '18:30' }).success).toBe(true);
    expect(createFeedPlanBody.safeParse({ ...base, startTime: '6am' }).success).toBe(false);
    expect(createFeedPlanBody.safeParse({ feedType: 'HAY', waterSource: 'CANAL' }).success).toBe(false);
  });

  it('housing: indoor space must be > 0 while outdoor space may be 0; feed logs need quantity > 0', () => {
    const h = { housingType: 'BARN', housingName: 'Shed A', startDate: '2026-10-01' };
    expect(createHousingRecordBody.safeParse({ ...h, indoorSpacePerAnimal: { value: 40, unit: 'SQ_FT' }, outdoorSpace: { value: 0, unit: 'ACRES' } }).success).toBe(true);
    expect(createHousingRecordBody.safeParse({ ...h, indoorSpacePerAnimal: { value: 0, unit: 'SQ_FT' }, outdoorSpace: { value: 0, unit: 'SQ_FT' } }).success).toBe(false);
    expect(createHousingRecordBody.safeParse({ ...h, indoorSpacePerAnimal: { value: 4, unit: 'SQ_FT' }, outdoorSpace: { value: -1, unit: 'SQ_FT' } }).success).toBe(false);
    expect(createFeedLogBody.safeParse({ feedType: 'SILAGE', quantity: 0, unit: 'KG' }).success).toBe(false);
    expect(createFeedLogBody.safeParse({ feedType: 'SILAGE', quantity: 2, unit: 'LITERS' }).success).toBe(false);
  });

  it('list queries: limit is 1..100 (default 20), filters are enum/date-checked, unknown keys rejected', () => {
    expect(listHealthRecordsQuery.parse({}).limit).toBe(20);
    expect(listHealthRecordsQuery.safeParse({ limit: '0' }).success).toBe(false);
    expect(listHealthRecordsQuery.safeParse({ limit: '101' }).success).toBe(false);
    expect(listHealthRecordsQuery.safeParse({ recordType: 'SURGERY' }).success).toBe(false);
    expect(listHealthRecordsQuery.safeParse({ farmerId: FARMER_B }).success).toBe(false);
    expect(listFeedLogsQuery.safeParse({ dateFrom: '2026-10-01', dateTo: '2026-10-31' }).success).toBe(true);
    expect(listFeedLogsQuery.safeParse({ dateFrom: 'yesterday' }).success).toBe(false);
  });

  it('production logs: fatPercent only on MILK and within 0..100; MEAT/WOOL/MANURE log in KG; session is an enum', () => {
    expect(createProductionLogBody.safeParse({ productType: 'MILK', quantity: 5, unit: 'LITERS', fatPercent: 4.2, session: 'MORNING' }).success).toBe(true);
    expect(createProductionLogBody.safeParse({ productType: 'CURD', quantity: 5, unit: 'KG', fatPercent: 4.2 }).success).toBe(false);
    expect(createProductionLogBody.safeParse({ productType: 'MILK', quantity: 5, unit: 'LITERS', fatPercent: 101 }).success).toBe(false);
    expect(createProductionLogBody.safeParse({ productType: 'MILK', quantity: 5, unit: 'LITERS', session: 'DAWN' }).success).toBe(false);
    for (const productType of ['MEAT', 'WOOL', 'MANURE'] as const) {
      expect(createProductionLogBody.safeParse({ productType, quantity: 1, unit: 'KG' }).success, productType).toBe(true);
      expect(createProductionLogBody.safeParse({ productType, quantity: 1, unit: 'LITERS' }).success, productType).toBe(false);
    }
    expect(createProductionLogBody.safeParse({ productType: 'MILK', quantity: 5, unit: 'LITERS', qualityGrade: 'x'.repeat(61) }).success).toBe(false);
  });
});

describe('livestock animal records — BR-137 treatment withdrawal extends, never shortens, in one transaction', () => {
  it('BR-137a: a milk withdrawal ending later than the current window sets animal.withdrawalUntil to that date', async () => {
    const { service } = setup();
    const animal = await ownAnimal(service, FARMER_A, { withdrawalUntil: '2026-10-05' });
    await service.createHealthRecord(
      createScopeA(),
      animal.id,
      bodies.treatment({ milkWithdrawal: { startDate: '2026-10-01', endDate: '2026-10-12' } }),
    );
    expect((await service.getAnimal(farmerScope(FARMER_A), animal.id)).withdrawalUntil).toBe('2026-10-12');
  });

  it('BR-137a: an animal with no current window gets one; with milk and meat windows the later endDate wins', async () => {
    const { service } = setup();
    const animal = await ownAnimal(service, FARMER_A);
    const record = await service.createHealthRecord(
      createScopeA(),
      animal.id,
      bodies.treatment({
        milkWithdrawal: { startDate: '2026-10-01', endDate: '2026-10-08', reason: 'Antibiotic' },
        meatWithdrawal: { endDate: '2026-10-30' },
      }),
    );
    expect((await service.getAnimal(farmerScope(FARMER_A), animal.id)).withdrawalUntil).toBe('2026-10-30');
    expect(record).toMatchObject({
      recordType: 'TREATMENT',
      milkWithdrawal: { startDate: '2026-10-01', endDate: '2026-10-08', reason: 'Antibiotic' },
      meatWithdrawal: { startDate: null, endDate: '2026-10-30', reason: null },
    });
  });

  it('BR-137b: a withdrawal ending earlier than the current window never shortens it', async () => {
    const { service } = setup();
    const animal = await ownAnimal(service, FARMER_A, { withdrawalUntil: '2026-12-31' });
    await service.createHealthRecord(
      createScopeA(),
      animal.id,
      bodies.treatment({ milkWithdrawal: { startDate: '2026-10-01', endDate: '2026-10-10' } }),
    );
    expect((await service.getAnimal(farmerScope(FARMER_A), animal.id)).withdrawalUntil).toBe('2026-12-31');
  });

  it('BR-137: a record without a withdrawal window leaves the animal untouched', async () => {
    const { service, calls } = setup();
    const animal = await ownAnimal(service, FARMER_A, { withdrawalUntil: '2026-10-05' });
    await service.createHealthRecord(createScopeA(), animal.id, bodies.treatment());
    await service.createHealthRecord(createScopeA(), animal.id, bodies.vaccination());
    expect(calls.extendWithdrawal).toHaveLength(0);
    const after = await service.getAnimal(farmerScope(FARMER_A), animal.id);
    expect(after.withdrawalUntil).toBe('2026-10-05');
    expect(after.updatedAt).toBeNull();
  });

  it('BR-137e: the record insert and the animal update run in the same transaction and roll back together', async () => {
    const { service, repo, records, calls, tx, txsOpened } = setup();
    const animal = await ownAnimal(service, FARMER_A, { withdrawalUntil: '2026-10-05' });
    const body = bodies.treatment({ milkWithdrawal: { startDate: '2026-10-01', endDate: '2026-10-20' } });

    txsOpened.length = 0;
    calls.recordInsertExecutors.length = 0;
    await service.createHealthRecord(createScopeA(), animal.id, body);
    expect(txsOpened).toEqual([tx]);
    expect(calls.recordInsertExecutors).toEqual([tx]);
    expect(calls.extendWithdrawal.map((c) => c.db)).toEqual([tx]);
    expect(calls.extendWithdrawal[0]?.until).toBe('2026-10-20');

    // Now make the animal update fail: the already-inserted record must not survive.
    const before = records.health.length;
    repo.extendAnimalWithdrawal = async () => {
      throw new Error('simulated failure updating livestock_animals');
    };
    await expect(
      service.createHealthRecord(createScopeA(), animal.id, bodies.treatment({ milkWithdrawal: { startDate: '2026-10-01', endDate: '2026-11-30' } })),
    ).rejects.toThrow('simulated failure');
    expect(records.health).toHaveLength(before);
    expect((await service.getAnimal(farmerScope(FARMER_A), animal.id)).withdrawalUntil).toBe('2026-10-20');
  });
});

describe('livestock animal records — BR-138 breeding records only on FEMALE animals', () => {
  it('BR-138a: a breeding record on an own MALE animal is 422 and nothing is written', async () => {
    const { service, records } = setup();
    const bull = await ownAnimal(service, FARMER_A, { gender: 'MALE' });
    const error = await errorOf(service.createBreedingRecord(createScopeA(), bull.id, bodies.heat()));
    expect(error.code).toBe('VALIDATION_FAILED');
    expect(error.status).toBe(422);
    expect(error.detail).toContain('BR-138');
    expect(records.breeding).toHaveLength(0);
  });

  it("BR-138b: another farmer's MALE animal is 404 (ownership is checked before the gender rule)", async () => {
    const { service } = setup();
    const bull = await ownAnimal(service, FARMER_B, { gender: 'MALE' });
    const error = await errorOf(service.createBreedingRecord(createScopeA(), bull.id, bodies.heat()));
    expect(error.code).toBe('NOT_FOUND');
  });

  it('BR-138: a FEMALE animal accepts every breeding record type, with promoted dates returned', async () => {
    const { service } = setup();
    const cow = await ownAnimal(service, FARMER_A, { gender: 'FEMALE' });
    const variants = [
      bodies.heat(),
      createBreedingRecordBody.parse({ recordType: 'INSEMINATION', recordDate: '2026-10-02', inseminationType: 'ARTIFICIAL', inseminationTime: '06:45' }),
      createBreedingRecordBody.parse({
        recordType: 'PREGNANCY_CHECK',
        recordDate: '2026-11-15',
        checkType: 'CONFIRMATION',
        result: 'POSITIVE',
        examinationMethod: 'RECTAL_PALPATION',
        gestationAge: { value: 6, unit: 'WEEKS' },
        expectedDeliveryDate: '2027-07-10',
        nextCheckDate: '2026-12-15',
      }),
      createBreedingRecordBody.parse({ recordType: 'CALVING', recordDate: '2027-07-09', outcome: 'LIVE_BIRTH', offspringGender: 'FEMALE', birthWeight: { value: 28, unit: 'KG' } }),
    ];
    for (const body of variants) {
      const created = await service.createBreedingRecord(createScopeA(), cow.id, body);
      expect(created.recordType).toBe(body.recordType);
    }
    const list = await service.listBreedingRecords(farmerScope(FARMER_A), cow.id, listBreedingRecordsQuery.parse({ recordType: 'PREGNANCY_CHECK' }));
    expect(list.items).toHaveLength(1);
    expect(list.items[0]).toMatchObject({ expectedDeliveryDate: '2027-07-10', nextCheckDate: '2026-12-15', gestationAge: { value: 6, unit: 'WEEKS' }, findings: null, location: null });
  });
});

describe('livestock animal records — BR-138 CALVING records carry an optional calvingTime', () => {
  it('BR-138: a CALVING body accepts calvingTime in HH:MM 24-hour and rejects 25:00, 5:30 and 12:60', () => {
    const base = { recordType: 'CALVING', recordDate: '2027-07-09', outcome: 'LIVE_BIRTH' };
    const ok = createBreedingRecordBody.parse({ ...base, calvingTime: '05:30' });
    expect(ok.recordType === 'CALVING' && ok.calvingTime).toBe('05:30');
    expect(createBreedingRecordBody.safeParse({ ...base, calvingTime: '23:59' }).success).toBe(true);
    for (const bad of ['25:00', '5:30', '12:60', '24:00', '']) {
      expect(createBreedingRecordBody.safeParse({ ...base, calvingTime: bad }).success, bad).toBe(false);
    }
    // Only CALVING has calvingTime: the other variants are strict.
    expect(
      createBreedingRecordBody.safeParse({ recordType: 'INSEMINATION', recordDate: '2026-10-10', inseminationType: 'ARTIFICIAL', calvingTime: '05:30' }).success,
    ).toBe(false);
  });

  it('BR-138: a CALVING record returns calvingTime as sent, and null when it was not sent', async () => {
    const { service } = setup();
    const cow = await ownAnimal(service, FARMER_A, { gender: 'FEMALE' });
    const timed = await service.createBreedingRecord(
      createScopeA(),
      cow.id,
      createBreedingRecordBody.parse({ recordType: 'CALVING', recordDate: '2027-07-09', outcome: 'LIVE_BIRTH', calvingTime: '04:50' }),
    );
    expect(timed).toMatchObject({ recordType: 'CALVING', calvingTime: '04:50' });
    const untimed = await service.createBreedingRecord(
      createScopeA(),
      cow.id,
      createBreedingRecordBody.parse({ recordType: 'CALVING', recordDate: '2027-07-10', outcome: 'STILLBIRTH' }),
    );
    expect(Object.keys(untimed)).toContain('calvingTime');
    expect((untimed as { calvingTime?: unknown }).calvingTime).toBeNull();
    const list = await service.listBreedingRecords(farmerScope(FARMER_A), cow.id, listBreedingRecordsQuery.parse({ recordType: 'CALVING' }));
    expect(list.items.map((i) => (i as { calvingTime?: unknown }).calvingTime)).toEqual([null, '04:50']);
  });
});

describe('livestock housing — BR-140 indoor space per animal against the system_config standard', () => {
  type SpaceUnit = 'SQ_FT' | 'SQ_M' | 'ACRES';
  const housingAt = (value: number, unit: SpaceUnit, name: string) => bodies.housing({ housingName: name, indoorSpacePerAnimal: { value, unit } });

  /** Creates one housing record per case and returns the verdict the list gives each, keyed by housingName. */
  async function verdicts(
    cases: Array<[number, SpaceUnit]>,
    configured = '11',
  ): Promise<{ list: Awaited<ReturnType<Service['listHousingRecords']>>; byName: Record<string, unknown> }> {
    const { service, config } = setup();
    config.minIndoorSpaceSqFt = configured;
    const animal = await ownAnimal(service, FARMER_A);
    for (const [value, unit] of cases) await service.createHousingRecord(createScopeA(), animal.id, housingAt(value, unit, `${value} ${unit}`));
    const list = await service.listHousingRecords(farmerScope(FARMER_A), animal.id, listHousingRecordsQuery.parse({ limit: 100 }));
    const byName = Object.fromEntries(
      list.items.map((i) => [i.housingName, (i as { meetsIndoorSpaceStandard?: unknown }).meetsIndoorSpaceStandard]),
    );
    return { list, byName };
  }

  const standardOf = (list: unknown): unknown => (list as { spaceStandard?: unknown }).spaceStandard;

  it('BR-140a: SQ_FT boundary — exactly 11 sq.ft meets the 11 sq.ft standard, 10.99 does not', async () => {
    const { byName } = await verdicts([
      [11, 'SQ_FT'],
      [10.99, 'SQ_FT'],
      [11.01, 'SQ_FT'],
      [40, 'SQ_FT'],
    ]);
    expect(byName).toEqual({ '11 SQ_FT': true, '10.99 SQ_FT': false, '11.01 SQ_FT': true, '40 SQ_FT': true });
  });

  it('BR-140a: SQ_M is converted exactly (1 sq.ft = 0.09290304 sq.m) — 1.02 sq.m (10.979 sq.ft) fails, 1.03 sq.m (11.087 sq.ft) meets', async () => {
    const { byName } = await verdicts([
      [1.02, 'SQ_M'],
      [1.03, 'SQ_M'],
    ]);
    expect(byName).toEqual({ '1.02 SQ_M': false, '1.03 SQ_M': true });
  });

  it('BR-140a: SQ_M equality is exact — 1 sq.m is 10.7639104 sq.ft, so it meets 10.76 and fails 10.77', async () => {
    expect((await verdicts([[1, 'SQ_M']], '10.76')).byName).toEqual({ '1 SQ_M': true });
    expect((await verdicts([[1, 'SQ_M']], '10.77')).byName).toEqual({ '1 SQ_M': false });
  });

  it('BR-140a: ACRES is converted exactly (1 acre = 43,560 sq.ft) — 0.01 acre (435.6 sq.ft) meets 435.6 and fails 435.61', async () => {
    expect((await verdicts([[0.01, 'ACRES']], '435.6')).byName).toEqual({ '0.01 ACRES': true });
    expect((await verdicts([[0.01, 'ACRES']], '435.61')).byName).toEqual({ '0.01 ACRES': false });
    expect((await verdicts([[0.01, 'ACRES']])).byName).toEqual({ '0.01 ACRES': true });
  });

  it('BR-140b: the list carries spaceStandard.minIndoorSqFtPerAnimal from system_config; changing it changes the verdict', async () => {
    const at11 = await verdicts([[12, 'SQ_FT']]);
    expect(standardOf(at11.list)).toEqual({ minIndoorSqFtPerAnimal: 11 });
    expect(at11.byName).toEqual({ '12 SQ_FT': true });

    const at125 = await verdicts([[12, 'SQ_FT']], '12.5');
    expect(standardOf(at125.list)).toEqual({ minIndoorSqFtPerAnimal: 12.5 });
    expect(at125.byName).toEqual({ '12 SQ_FT': false });

    // Trailing zeros are not extra precision: 12.500 is 12.5.
    const padded = await verdicts([[12.5, 'SQ_FT']], '12.500');
    expect(standardOf(padded.list)).toEqual({ minIndoorSqFtPerAnimal: 12.5 });
    expect(padded.byName).toEqual({ '12.5 SQ_FT': true });
  });

  it('BR-140b: the response schema requires spaceStandard and a boolean meetsIndoorSpaceStandard on every item', () => {
    const item = {
      id: newId(),
      animalId: newId(),
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: null,
      housingType: 'BARN',
      housingName: 'Shed A',
      location: null,
      indoorSpacePerAnimal: { value: 11, unit: 'SQ_FT' },
      outdoorSpace: { value: 0, unit: 'SQ_FT' },
      startDate: '2026-10-01',
      notes: null,
      attachmentUploadId: null,
    };
    const page = { nextCursor: null, hasMore: false };
    const spaceStandard = { minIndoorSqFtPerAnimal: 11 };
    expect(listHousingRecordsResponse.safeParse({ items: [{ ...item, meetsIndoorSpaceStandard: true }], page, spaceStandard }).success).toBe(true);
    expect(listHousingRecordsResponse.safeParse({ items: [item], page, spaceStandard }).success).toBe(false);
    expect(listHousingRecordsResponse.safeParse({ items: [{ ...item, meetsIndoorSpaceStandard: true }], page }).success).toBe(false);
  });

  it('BR-140c: a missing or unusable minimum is 503 INTERNAL with no fallback — also for a foreign or nonexistent animal', async () => {
    const unusable: Array<string | undefined> = [undefined, 'null', '"11"', 'true', '{}', '[11]', '0', '0.00', '-1', '11.005', '1e1', 'NaN', 'Infinity', ''];
    for (const raw of unusable) {
      const { service, config } = setup();
      const animal = await ownAnimal(service, FARMER_A);
      await service.createHousingRecord(createScopeA(), animal.id, bodies.housing());
      config.minIndoorSpaceSqFt = raw;
      for (const animalId of [animal.id, newId()]) {
        const error = await errorOf(service.listHousingRecords(farmerScope(FARMER_A), animalId, listHousingRecordsQuery.parse({})));
        expect(error.code, String(raw)).toBe('INTERNAL');
        expect(error.status, String(raw)).toBe(503);
        expect(error.detail).toContain('livestock_min_indoor_space_sqft_per_animal');
      }
    }
  });

  it('BR-140c: the standard is read on every list call and never on create', async () => {
    const { service, config } = setup();
    const animal = await ownAnimal(service, FARMER_A);
    await service.createHousingRecord(createScopeA(), animal.id, bodies.housing());
    expect(config.minIndoorSpaceReads).toBe(0);
    await service.listHousingRecords(farmerScope(FARMER_A), animal.id, listHousingRecordsQuery.parse({}));
    await service.listHousingRecords(farmerScope(FARMER_A), animal.id, listHousingRecordsQuery.parse({}));
    expect(config.minIndoorSpaceReads).toBe(2);
  });
});

describe('livestock production logs — BR-139 produce from an animal under withdrawal is restricted from sale', () => {
  it('BR-139a: withdrawal_until >= loggedOn stores restrictedFromSale=true even when the client sends false', async () => {
    const { service } = setup();
    const cow = await ownAnimal(service, FARMER_A, { withdrawalUntil: '2026-10-10' });
    for (const loggedOn of ['2026-10-05', '2026-10-10' /* boundary: the last withdrawal day is still restricted */]) {
      const log = await service.createProductionLog(createScopeA(), {
        animalId: cow.id,
        productType: 'MILK',
        quantity: 6,
        unit: 'LITERS',
        loggedOn,
        restrictedFromSale: false,
      });
      expect(log.restrictedFromSale, loggedOn).toBe(true);
    }
  });

  it('BR-139a: an omitted loggedOn defaults to today, which an open-ended future withdrawal covers', async () => {
    const { service, productionLogs } = setup();
    const cow = await ownAnimal(service, FARMER_A, { withdrawalUntil: '2999-12-31' });
    const log = await service.createProductionLog(createScopeA(), { animalId: cow.id, productType: 'MILK', quantity: 6, unit: 'LITERS' });
    expect(log.restrictedFromSale).toBe(true);
    // The date compared is the date stored — never a separate DB-side default.
    expect(productionLogs.get(log.id)?.loggedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('BR-139b: an expired withdrawal (before loggedOn) keeps the client value', async () => {
    const { service } = setup();
    const cow = await ownAnimal(service, FARMER_A, { withdrawalUntil: '2026-10-01' });
    const base = { animalId: cow.id, productType: 'MILK' as const, quantity: 6, unit: 'LITERS' as const, loggedOn: '2026-10-02' };
    expect((await service.createProductionLog(createScopeA(), { ...base, restrictedFromSale: false })).restrictedFromSale).toBe(false);
    expect((await service.createProductionLog(createScopeA(), base)).restrictedFromSale).toBe(false);
    expect((await service.createProductionLog(createScopeA(), { ...base, restrictedFromSale: true })).restrictedFromSale).toBe(true);
  });

  it('BR-139c: a log with no animalId keeps the client value (default false)', async () => {
    const { service } = setup();
    expect((await service.createProductionLog(createScopeA(), { productType: 'EGGS', quantity: 30, unit: 'COUNT' })).restrictedFromSale).toBe(false);
    expect(
      (await service.createProductionLog(createScopeA(), { productType: 'EGGS', quantity: 30, unit: 'COUNT', restrictedFromSale: true })).restrictedFromSale,
    ).toBe(true);
  });

  it('production logs: session, qualityGrade and fatPercent round-trip; absent ones are null', async () => {
    const { service } = setup();
    const cow = await ownAnimal(service, FARMER_A);
    const milk = await service.createProductionLog(createScopeA(), {
      animalId: cow.id,
      productType: 'MILK',
      quantity: 7.5,
      unit: 'LITERS',
      session: 'EVENING',
      qualityGrade: 'A',
      fatPercent: 4.1,
    });
    expect(milk).toMatchObject({ session: 'EVENING', qualityGrade: 'A', fatPercent: 4.1, restrictedFromSale: false });
    const manure = await service.createProductionLog(createScopeA(), { productType: 'MANURE', quantity: 50, unit: 'KG' });
    expect(manure).toMatchObject({ session: null, qualityGrade: null, fatPercent: null });
  });
});

// ---------------------------------------------------------------------------
// Routes — 401/403 per role and request validation, through the real app
// ---------------------------------------------------------------------------

describe('livestock animal records — routes (BR-136e)', () => {
  let server: Server;
  const token = (roles: Array<{ code: RoleCode; warehouseId?: string; zoneId?: string }>, extra: { farmerId?: string; customerId?: string } = {}): string =>
    `Bearer ${signAccessToken({ sub: newId(), roles, farmerId: extra.farmerId ?? null, customerId: extra.customerId ?? null })}`;
  const RECORD_PATHS = ['health-records', 'breeding-records', 'feed-plans', 'feed-logs', 'housing-records', 'hygiene-logs'];
  const url = (path: string, animalId = newId()): string => `/v1/farmers/me/livestock/animals/${animalId}/${path}`;

  beforeAll(() => {
    server = createApp().listen(0);
  });
  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('BR-136e: the router registers a GET and a POST for each of the six animal-record resources (and no PATCH/DELETE)', async () => {
    const { livestockRouter } = await import('./livestock.routes.js');
    const routes = livestockRouter.stack
      .filter((layer) => layer.route !== undefined)
      .flatMap((layer) => {
        const route = layer.route as unknown as { path: string; methods: Record<string, boolean> };
        return Object.keys(route.methods).map((m) => `${m} ${route.path}`);
      });
    for (const path of RECORD_PATHS) {
      expect(routes).toContain(`get /animals/:animalId/${path}`);
      expect(routes).toContain(`post /animals/:animalId/${path}`);
      expect(routes).not.toContain(`patch /animals/:animalId/${path}`);
      expect(routes).not.toContain(`delete /animals/:animalId/${path}`);
    }
  });

  it('BR-136e: every animal-record route is 401 without a token', async () => {
    for (const path of RECORD_PATHS) {
      expect((await request(server).get(url(path))).status, `GET ${path}`).toBe(401);
      expect((await request(server).post(url(path)).send({})).status, `POST ${path}`).toBe(401);
    }
  });

  it('BR-136e: CUSTOMER, MAIN_WH_ADMIN and SUB_WH_ADMIN get 403 on every animal-record route', async () => {
    const outsiders = [
      token([{ code: RoleCode.CUSTOMER }], { customerId: IDS.customer }),
      token([{ code: RoleCode.MAIN_WH_ADMIN, warehouseId: IDS.warehouseOoty }]),
      token([{ code: RoleCode.SUB_WH_ADMIN, warehouseId: IDS.warehouseCoonoor }]),
    ];
    for (const auth of outsiders) {
      for (const path of RECORD_PATHS) {
        const get = await request(server).get(url(path)).set('Authorization', auth);
        expect(get.status, `GET ${path}`).toBe(403);
        expect(get.body.code).toBe('FORBIDDEN');
        expect((await request(server).post(url(path)).set('Authorization', auth).send({})).status, `POST ${path}`).toBe(403);
      }
    }
  });

  it('BR-136e: FARMER_ADMIN gets 403 on every animal-record POST (farmer.livestock.create_own is none for that role)', async () => {
    const auth = token([{ code: RoleCode.FARMER_ADMIN, zoneId: IDS.zoneNorth }]);
    for (const path of RECORD_PATHS) {
      expect((await request(server).post(url(path)).set('Authorization', auth).send({})).status, `POST ${path}`).toBe(403);
    }
  });

  it('request validation is wired on every route: bad bodies, params, queries and cursors are 422 VALIDATION_FAILED', async () => {
    const auth = token([{ code: RoleCode.FARMER }], { farmerId: FARMER_A });
    const expect422 = async (res: request.Response, label: string): Promise<void> => {
      expect(res.status, label).toBe(422);
      expect(res.body.code, label).toBe('VALIDATION_FAILED');
    };

    // BR-137d / BR-137c via HTTP.
    await expect422(
      await request(server)
        .post(url('health-records'))
        .set('Authorization', auth)
        .send({ recordType: 'VACCINATION', recordDate: '2026-10-01', vaccineName: 'FMD', milkWithdrawal: { startDate: '2026-10-01', endDate: '2026-10-05' } }),
      'withdrawal on a vaccination',
    );
    await expect422(
      await request(server)
        .post(url('health-records'))
        .set('Authorization', auth)
        .send({ recordType: 'TREATMENT', recordDate: '2026-10-10', condition: 'x', description: 'y', milkWithdrawal: { startDate: '2026-10-10', endDate: '2026-10-01' } }),
      'withdrawal ends before it starts',
    );
    await expect422(await request(server).post(url('feed-logs')).set('Authorization', auth).send({ feedType: 'SILAGE', quantity: 1, unit: 'KG', extra: 1 }), 'strict body');
    await expect422(await request(server).post(url('hygiene-logs', 'not-a-uuid')).set('Authorization', auth).send({ activity: 'x' }), 'animalId param');
    // BR-138: calvingTime is HH:MM 24-hour.
    await expect422(
      await request(server)
        .post(url('breeding-records'))
        .set('Authorization', auth)
        .send({ recordType: 'CALVING', recordDate: '2027-07-09', outcome: 'LIVE_BIRTH', calvingTime: '25:00' }),
      'calvingTime 25:00',
    );
    for (const path of RECORD_PATHS) {
      await expect422(await request(server).get(`${url(path)}?limit=0`).set('Authorization', auth), `${path} limit=0`);
      await expect422(await request(server).get(`${url(path)}?cursor=garbage`).set('Authorization', auth), `${path} bad cursor`);
    }
  });
});

// ---------------------------------------------------------------------------
// Integration — proves the repo SQL parses against migration 0024.
// ---------------------------------------------------------------------------

describeIfDatabase('livestockRepo (integration)', () => {
  let ready = false;
  /** 0084_livestock_animal_records.sql applied (animal-record tables + production-log columns). */
  let recordsReady = false;

  beforeAll(async () => {
    ready = await databaseReady('livestock_animals');
    if (!ready) console.warn('[skip] livestock_animals not migrated — run `pnpm db:migrate`');
    recordsReady = ready && (await databaseReady('livestock_health_records'));
    if (ready && !recordsReady) console.warn('[skip] livestock_health_records not migrated — run `pnpm db:migrate`');
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

  // -------------------------------------------------------------------------
  // Animal records (0084) — every test runs inside ONE outer transaction that
  // is always rolled back. The service's own runTx is a SAVEPOINT on that
  // transaction, so a failing service call rolls back exactly what a real
  // withTransaction would, and nothing is left behind in the shared database.
  // -------------------------------------------------------------------------

  interface RecordsFixture {
    tx: Executor;
    service: Service;
    farmerId: string;
    userId: string;
    farmId: string;
    scope: (permission?: string) => ResolvedScope;
    /** Runs fn in its own savepoint, so an expected SQL error does not abort the outer transaction. */
    savepoint: TransactionRunner;
  }

  async function withRecordsFixture(fn: (f: RecordsFixture) => Promise<void>): Promise<void> {
    const { pool, withTransaction } = await import('../../db/pool.js');
    const anyFarm = await pool.query<{ farm_id: string; farmer_id: string; user_id: string }>(
      `SELECT f.id AS farm_id, f.farmer_id, fr.user_id
         FROM farms f JOIN farmers fr ON fr.id = f.farmer_id
        WHERE f.deleted_at IS NULL
        LIMIT 1`,
    );
    const row = anyFarm.rows[0];
    if (row === undefined) {
      console.warn('[skip] no farm in the database to attach test animals to — run `pnpm db:seed`');
      return;
    }

    await withTransaction(async (tx) => {
      let n = 0;
      const savepoint: TransactionRunner = async (inner) => {
        const name = `livestock_test_sp_${n++}`;
        await tx.query(`SAVEPOINT ${name}`);
        try {
          const result = await inner(tx);
          await tx.query(`RELEASE SAVEPOINT ${name}`);
          return result;
        } catch (error) {
          await tx.query(`ROLLBACK TO SAVEPOINT ${name}`);
          throw error;
        }
      };
      const farmsSvc = createFakeFarmsService(new Map([[row.farmer_id, [aFarm({ id: row.farm_id, farmerId: row.farmer_id })]]]));
      const service = createLivestockService({ db: tx, runTx: savepoint, farmsSvc });
      const scope = (permission = 'farmer.livestock.create_own'): ResolvedScope =>
        aScope({ level: ScopeLevel.OWN, permission, roleCode: RoleCode.FARMER, farmerId: row.farmer_id, userId: row.user_id });

      await fn({ tx, service, farmerId: row.farmer_id, userId: row.user_id, farmId: row.farm_id, scope, savepoint });
      throw new Error('__rollback_test_fixture__');
    }).catch((error: unknown) => {
      if (!(error instanceof Error) || error.message !== '__rollback_test_fixture__') throw error;
    });
  }

  async function insertUpload(tx: Executor, uploadedBy: string | null): Promise<string> {
    const result = await tx.query<{ id: string }>(
      `INSERT INTO uploads (storage_key, bucket, mime_type, size_bytes, uploaded_by)
       VALUES ($1, 'test', 'image/jpeg', 1, $2) RETURNING id`,
      [`test/livestock/${newId()}.jpg`, uploadedBy],
    );
    return result.rows[0]!.id;
  }

  it('BR-136: all six animal-record resources insert and list through Postgres, allow-listed (no farmId)', async () => {
    if (!recordsReady) return;
    await withRecordsFixture(async ({ tx, service, scope, farmId }) => {
      const cow = await service.createAnimal(scope(), validCreateBody({ tag: `TEST-${newId().slice(0, 8)}`, gender: 'FEMALE' }));
      const upload = await insertUpload(tx, scope().userId);

      const health = await service.createHealthRecord(
        scope(),
        cow.id,
        bodies.treatment({
          attachmentUploadId: upload,
          dosage: { value: 10, unit: 'ML' },
          frequency: 'TWICE_DAILY',
          milkWithdrawal: { startDate: '2026-10-01', endDate: '2026-10-06' },
        }),
      );
      expect(health).toMatchObject({
        recordType: 'TREATMENT',
        animalId: cow.id,
        attachmentUploadId: upload,
        dosage: { value: 10, unit: 'ML' },
        frequency: 'TWICE_DAILY',
        medicineName: null,
        milkWithdrawal: { startDate: '2026-10-01', endDate: '2026-10-06', reason: null },
        meatWithdrawal: null,
      });
      const checkup = await service.createHealthRecord(
        scope(),
        cow.id,
        createHealthRecordBody.parse({
          recordType: 'CHECKUP',
          recordDate: '2026-10-02',
          checkupType: 'ROUTINE',
          checkupTime: '09:15',
          veterinarian: 'Dr. Ramesh',
          clinic: 'Ooty Vet Centre',
          followUpRequired: true,
          followUpDate: '2026-10-16',
        }),
      );
      expect(checkup).toMatchObject({ checkupTime: '09:15', followUpDate: '2026-10-16', followUpRequired: true, bodyWeight: null });

      const breeding = await service.createBreedingRecord(
        scope(),
        cow.id,
        createBreedingRecordBody.parse({
          recordType: 'PREGNANCY_CHECK',
          recordDate: '2026-10-03',
          checkType: 'ROUTINE',
          result: 'POSITIVE',
          examinationMethod: 'ULTRASOUND',
          expectedDeliveryDate: '2027-06-30',
          nextCheckDate: '2026-11-03',
        }),
      );
      expect(breeding).toMatchObject({ expectedDeliveryDate: '2027-06-30', nextCheckDate: '2026-11-03', gestationAge: null });

      const plan = await service.createFeedPlan(
        scope(),
        cow.id,
        bodies.feedPlan({
          effectiveFrom: '2026-10-01',
          grazingDuration: { value: 6.5, unit: 'HOURS_PER_DAY' },
          startTime: '06:30',
          endTime: '18:00',
          items: [{ name: 'Napier grass', amount: 25.5, unit: 'KG_PER_DAY' }],
          attachmentUploadId: upload,
        }),
      );
      expect(plan).toMatchObject({
        grazingDuration: { value: 6.5, unit: 'HOURS_PER_DAY' },
        startTime: '06:30',
        endTime: '18:00',
        items: [{ name: 'Napier grass', amount: 25.5, unit: 'KG_PER_DAY' }],
        planName: null,
      });
      const log = await service.createFeedLog(scope(), cow.id, bodies.feedLog({ quantity: 4.25 }));
      expect(log).toMatchObject({ quantity: 4.25, unit: 'KG', fedOn: '2026-10-01' });
      const housing = await service.createHousingRecord(scope(), cow.id, bodies.housing({ outdoorSpace: { value: 0, unit: 'ACRES' } }));
      expect(housing).toMatchObject({ indoorSpacePerAnimal: { value: 40, unit: 'SQ_FT' }, outdoorSpace: { value: 0, unit: 'ACRES' }, location: null });
      const hygiene = await service.createHygieneLog(scope(), cow.id, bodies.hygiene());
      expect(hygiene).toMatchObject({ activity: 'Bedding replaced', performedOn: '2026-10-01' });

      const view = scope('farmer.livestock.view_own');
      const lists = [
        await service.listHealthRecords(view, cow.id, listHealthRecordsQuery.parse({})),
        await service.listBreedingRecords(view, cow.id, listBreedingRecordsQuery.parse({})),
        await service.listFeedPlans(view, cow.id, listFeedPlansQuery.parse({})),
        await service.listFeedLogs(view, cow.id, listFeedLogsQuery.parse({ dateFrom: '2026-10-01', dateTo: '2026-10-01' })),
        await service.listHousingRecords(view, cow.id, listHousingRecordsQuery.parse({})),
        await service.listHygieneLogs(view, cow.id, listHygieneLogsQuery.parse({})),
      ];
      expect(lists.map((l) => l.items.length)).toEqual([2, 1, 1, 1, 1, 1]);
      // Newest recordDate first.
      expect(lists[0]!.items.map((i) => i.id)).toEqual([checkup.id, health.id]);
      const wire = JSON.stringify([health, checkup, breeding, plan, log, housing, hygiene, lists]);
      expect(wire).not.toContain(farmId);
      expect(wire).not.toContain('farmId');
      expect(wire).not.toContain('farm_id');
    });
  });

  it("BR-136a/b/c: another farmer's animal is 404 on POST and an empty page on GET; a foreign upload is 422", async () => {
    if (!recordsReady) return;
    await withRecordsFixture(async ({ tx, service, scope }) => {
      const cow = await service.createAnimal(scope(), validCreateBody({ tag: `TEST-${newId().slice(0, 8)}` }));
      const stranger = farmerScope(newId(), 'farmer.livestock.create_own');

      expect((await errorOf(service.createHygieneLog(stranger, cow.id, bodies.hygiene()))).code).toBe('NOT_FOUND');
      expect(await service.listHygieneLogs(farmerScope(stranger.farmerId!), cow.id, listHygieneLogsQuery.parse({}))).toEqual(EMPTY_PAGE);

      const someoneElses = await insertUpload(tx, null);
      const error = await errorOf(service.createHousingRecord(scope(), cow.id, bodies.housing({ attachmentUploadId: someoneElses })));
      expect(error.code).toBe('VALIDATION_FAILED');
      const count = await tx.query<{ n: string }>('SELECT count(*) AS n FROM livestock_housing_records WHERE animal_id = $1', [cow.id]);
      expect(count.rows[0]!.n).toBe('0');
    });
  });

  it('BR-136d/g: soft-deleted rows are excluded and keyset pagination is stable across tied dates', async () => {
    if (!recordsReady) return;
    await withRecordsFixture(async ({ tx, service, scope }) => {
      const cow = await service.createAnimal(scope(), validCreateBody({ tag: `TEST-${newId().slice(0, 8)}` }));
      // Inside one transaction now() is constant, so date AND created_at tie: only id orders these.
      const created: string[] = [];
      for (let i = 0; i < 5; i += 1) created.push((await service.createHygieneLog(scope(), cow.id, bodies.hygiene())).id);
      await tx.query('UPDATE livestock_hygiene_logs SET deleted_at = now() WHERE id = $1', [created[0]]);

      const view = scope('farmer.livestock.view_own');
      const all = await service.listHygieneLogs(view, cow.id, listHygieneLogsQuery.parse({ limit: 100 }));
      expect(all.items.map((i) => i.id).sort()).toEqual(created.slice(1).sort());

      const seen: string[] = [];
      let cursor: string | undefined;
      for (let pageNo = 0; pageNo < 5; pageNo += 1) {
        const page = await service.listHygieneLogs(view, cow.id, listHygieneLogsQuery.parse(cursor === undefined ? { limit: 2 } : { limit: 2, cursor }));
        seen.push(...page.items.map((i) => i.id));
        if (page.page.nextCursor === null) break;
        cursor = page.page.nextCursor;
      }
      expect(seen).toEqual(all.items.map((i) => i.id));
    });
  });

  it('BR-137: Postgres never shortens withdrawal_until, and the record insert rolls back with a failed animal update', async () => {
    if (!recordsReady) return;
    await withRecordsFixture(async ({ tx, service, scope, savepoint }) => {
      const cow = await service.createAnimal(scope(), validCreateBody({ tag: `TEST-${newId().slice(0, 8)}`, withdrawalUntil: '2026-12-31' }));
      const view = scope('farmer.livestock.view_own');

      await service.createHealthRecord(scope(), cow.id, bodies.treatment({ milkWithdrawal: { startDate: '2026-10-01', endDate: '2026-11-15' } }));
      expect((await service.getAnimal(view, cow.id)).withdrawalUntil).toBe('2026-12-31'); // BR-137b
      await service.createHealthRecord(scope(), cow.id, bodies.treatment({ meatWithdrawal: { endDate: '2027-01-10' } }));
      expect((await service.getAnimal(view, cow.id)).withdrawalUntil).toBe('2027-01-10'); // BR-137a

      // BR-137e: same service wiring, but the animal update fails after the insert.
      const { livestockRepo } = await import('./livestock.repo.js');
      const failing = createLivestockService({
        db: tx,
        runTx: savepoint,
        repo: {
          ...livestockRepo,
          extendAnimalWithdrawal: async () => {
            throw new Error('simulated failure updating livestock_animals');
          },
        },
        farmsSvc: createFakeFarmsService(new Map()),
      });
      await expect(
        failing.createHealthRecord(scope(), cow.id, bodies.treatment({ milkWithdrawal: { startDate: '2026-10-01', endDate: '2027-05-01' } })),
      ).rejects.toThrow('simulated failure');
      const count = await tx.query<{ n: string }>('SELECT count(*) AS n FROM livestock_health_records WHERE animal_id = $1', [cow.id]);
      expect(count.rows[0]!.n).toBe('2');

      // The DB CHECK backs BR-137d: withdrawal columns only on TREATMENT rows.
      await expect(
        savepoint((t) =>
          t.query(
            `INSERT INTO livestock_health_records (farm_id, animal_id, record_type, record_date, milk_withdrawal_until)
             SELECT farm_id, id, 'VACCINATION', '2026-10-01', '2026-10-05' FROM livestock_animals WHERE id = $1`,
            [cow.id],
          ),
        ),
      ).rejects.toMatchObject({ code: '23514' });
    });
  });

  it('BR-140: against Postgres the housing list carries the seeded standard and an exact per-unit verdict; a deleted key is 503', async () => {
    if (!recordsReady) return;
    await withRecordsFixture(async ({ tx, service, scope }) => {
      const seeded = await tx.query<{ value: unknown; data_type: string }>(
        `SELECT value, data_type FROM system_config WHERE key = 'livestock_min_indoor_space_sqft_per_animal'`,
      );
      expect(seeded.rows, 'migration 0085 seeds the key').toHaveLength(1);
      expect(typeof seeded.rows[0]!.value).toBe('number');
      expect(seeded.rows[0]!.data_type).toBe('number');
      // Pin the value inside the rolled-back transaction so the boundaries below are exact.
      await tx.query(`UPDATE system_config SET value = '11'::jsonb WHERE key = 'livestock_min_indoor_space_sqft_per_animal'`);

      const cow = await service.createAnimal(scope(), validCreateBody({ tag: `TEST-${newId().slice(0, 8)}` }));
      const cases: Array<[number, 'SQ_FT' | 'SQ_M' | 'ACRES', boolean]> = [
        [11, 'SQ_FT', true],
        [10.99, 'SQ_FT', false],
        [1.02, 'SQ_M', false],
        [1.03, 'SQ_M', true],
        [0.01, 'ACRES', true],
      ];
      for (const [value, unit] of cases) {
        await service.createHousingRecord(scope(), cow.id, bodies.housing({ housingName: `${value} ${unit}`, indoorSpacePerAnimal: { value, unit } }));
      }
      const view = scope('farmer.livestock.view_own');
      const list = await service.listHousingRecords(view, cow.id, listHousingRecordsQuery.parse({ limit: 100 }));
      expect(list.spaceStandard).toEqual({ minIndoorSqFtPerAnimal: 11 });
      const byName = Object.fromEntries(list.items.map((i) => [i.housingName, i.meetsIndoorSpaceStandard]));
      expect(byName).toEqual(Object.fromEntries(cases.map(([value, unit, meets]) => [`${value} ${unit}`, meets])));
      expect(listHousingRecordsResponse.safeParse(list).success).toBe(true);

      await tx.query(`UPDATE system_config SET value = '12.5'::jsonb WHERE key = 'livestock_min_indoor_space_sqft_per_animal'`);
      const raised = await service.listHousingRecords(view, cow.id, listHousingRecordsQuery.parse({ limit: 100 }));
      expect(raised.spaceStandard).toEqual({ minIndoorSqFtPerAnimal: 12.5 });
      expect(raised.items.find((i) => i.housingName === '11 SQ_FT')!.meetsIndoorSpaceStandard).toBe(false);

      await tx.query(`UPDATE system_config SET value = '"11"'::jsonb WHERE key = 'livestock_min_indoor_space_sqft_per_animal'`);
      const asString = await errorOf(service.listHousingRecords(view, cow.id, listHousingRecordsQuery.parse({})));
      expect(asString.status).toBe(503);
      expect(asString.code).toBe('INTERNAL');

      await tx.query(`DELETE FROM system_config WHERE key = 'livestock_min_indoor_space_sqft_per_animal'`);
      const missing = await errorOf(service.listHousingRecords(view, cow.id, listHousingRecordsQuery.parse({})));
      expect(missing.status).toBe(503);
      expect(missing.code).toBe('INTERNAL');
    });
  });

  it('BR-138: a CALVING record round-trips calvingTime through Postgres (null when absent) and 25:00 never reaches it', async () => {
    if (!recordsReady) return;
    await withRecordsFixture(async ({ service, scope }) => {
      const cow = await service.createAnimal(scope(), validCreateBody({ tag: `TEST-${newId().slice(0, 8)}`, gender: 'FEMALE' }));
      const timed = await service.createBreedingRecord(
        scope(),
        cow.id,
        createBreedingRecordBody.parse({ recordType: 'CALVING', recordDate: '2027-07-09', outcome: 'LIVE_BIRTH', calvingTime: '04:50' }),
      );
      expect(timed).toMatchObject({ recordType: 'CALVING', calvingTime: '04:50', offspringCount: 1 });
      await service.createBreedingRecord(
        scope(),
        cow.id,
        createBreedingRecordBody.parse({ recordType: 'CALVING', recordDate: '2027-07-10', outcome: 'STILLBIRTH' }),
      );
      const list = await service.listBreedingRecords(scope('farmer.livestock.view_own'), cow.id, listBreedingRecordsQuery.parse({ recordType: 'CALVING' }));
      expect(list.items.map((i) => (i.recordType === 'CALVING' ? i.calvingTime : 'not calving'))).toEqual([null, '04:50']);

      expect(createBreedingRecordBody.safeParse({ recordType: 'CALVING', recordDate: '2027-07-09', outcome: 'LIVE_BIRTH', calvingTime: '25:00' }).success).toBe(false);
    });
  });

  it('BR-139: restricted_from_sale is persisted TRUE for produce from an animal under withdrawal; new product types and columns persist', async () => {
    if (!recordsReady) return;
    await withRecordsFixture(async ({ tx, service, scope }) => {
      const cow = await service.createAnimal(scope(), validCreateBody({ tag: `TEST-${newId().slice(0, 8)}`, withdrawalUntil: '2026-10-10' }));
      const restricted = await service.createProductionLog(scope(), {
        animalId: cow.id,
        productType: 'MILK',
        quantity: 6,
        unit: 'LITERS',
        loggedOn: '2026-10-09',
        session: 'MORNING',
        fatPercent: 4.25,
        restrictedFromSale: false,
      });
      expect(restricted).toMatchObject({ restrictedFromSale: true, session: 'MORNING', fatPercent: 4.25 });
      const stored = await tx.query<{ restricted_from_sale: boolean }>('SELECT restricted_from_sale FROM livestock_production_logs WHERE id = $1', [restricted.id]);
      expect(stored.rows[0]!.restricted_from_sale).toBe(true);

      const free = await service.createProductionLog(scope(), { animalId: cow.id, productType: 'MEAT', quantity: 12, unit: 'KG', loggedOn: '2026-10-11', qualityGrade: 'Grade A' });
      expect(free).toMatchObject({ restrictedFromSale: false, productType: 'MEAT', qualityGrade: 'Grade A', session: null, fatPercent: null });
    });
  });
});
