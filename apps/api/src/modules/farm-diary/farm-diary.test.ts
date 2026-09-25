/**
 * Farm Diary tests (BR-40..BR-45).
 *
 *  1. SERVICE tests against a stateful in-memory fake repo. The fake honours
 *     the same contract as the real repo (owner id in every entry query,
 *     deleted_at excluded, is_active respected), so the tests assert what the
 *     service asks for AND what the caller gets back.
 *  2. RBAC tests against the real docs/rbac.json (BR-41a, BR-45a).
 *  3. ONE integration block against a real pool, soft-skipped when the diary
 *     tables are not migrated, proving the repo SQL parses against 0020/0021.
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
  AttachPhotoData,
  CreateEntryData,
  FarmDiaryRepo,
  ListEntriesArgs,
  UpdateEntryPatch,
  WorkerRowInput,
} from './farm-diary.repo.js';
import {
  createDiaryEntryBody,
  type CreateDiaryEntryBody,
  type DiaryCategoryResponse,
  type DiaryEntryResponse,
  type DiarySubActivityResponse,
} from './farm-diary.schema.js';
import { createDiaryTaxonomyAdminService, createFarmDiaryService, type TransactionRunner } from './farm-diary.service.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FARMER_A = IDS.farmer;
const FARMER_B = '30000000-0000-4000-8000-000000000002';
const PLOT_A = '50000000-0000-4000-8000-00000000000a';
const PLOT_A_NO_CROP = '50000000-0000-4000-8000-0000000000a2';
const PLOT_B = '50000000-0000-4000-8000-00000000000b';
const CROP_A = '60000000-0000-4000-8000-00000000000a';
const CROP_A_PLANNED = '60000000-0000-4000-8000-0000000000a2';
const CROP_B = '60000000-0000-4000-8000-00000000000b';

function farmerScope(farmerId: string, permission = 'farmer.diary.view_own'): ResolvedScope {
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
  permission: 'admin.diary_taxonomy.manage',
  roleCode: RoleCode.TOHFA_ADMIN,
  userId: IDS.userTohfaAdmin,
});

interface StoredEntry {
  id: string;
  farmerId: string;
  data: CreateEntryData;
  activityOn: string;
  deletedAt: Date | null;
  updatedAt: Date | null;
}

interface StoredWorker extends WorkerRowInput {
  id: string;
  entryId: string;
}

interface StoredPhoto extends AttachPhotoData {
  id: string;
  entryId: string;
  createdAt: Date;
}

/**
 * Stateful fake. Mirrors the real repo's WHERE clauses: every entry-level
 * method filters by the farmerId it is handed and excludes soft-deleted rows.
 */
function createFakeRepo() {
  const categories = new Map<string, DiaryCategoryResponse>([
    ['land_prep', { key: 'land_prep', name: 'Land Preparation', nameTa: null, iconKey: null, sortOrder: 1, isActive: true }],
    ['sowing', { key: 'sowing', name: 'Sowing / Planting', nameTa: null, iconKey: null, sortOrder: 2, isActive: true }],
  ]);
  const subs = new Map<string, DiarySubActivityResponse>([
    ['land_prep.ploughing', { key: 'land_prep.ploughing', categoryKey: 'land_prep', name: 'Ploughing', nameTa: null, sortOrder: 1, isActive: true }],
    ['land_prep.levelling', { key: 'land_prep.levelling', categoryKey: 'land_prep', name: 'Levelling', nameTa: null, sortOrder: 2, isActive: true }],
    ['sowing.direct_seeding', { key: 'sowing.direct_seeding', categoryKey: 'sowing', name: 'Direct seeding', nameTa: null, sortOrder: 1, isActive: true }],
  ]);
  const plots = new Map<string, string>([
    [PLOT_A, FARMER_A],
    [PLOT_A_NO_CROP, FARMER_A],
    [PLOT_B, FARMER_B],
  ]);
  const crops = [
    { id: CROP_A, plotId: PLOT_A, status: 'GROWING' },
    { id: CROP_A_PLANNED, plotId: PLOT_A_NO_CROP, status: 'PLANNED' },
    { id: CROP_B, plotId: PLOT_B, status: 'GROWING' },
  ];
  const entries = new Map<string, StoredEntry>();
  let workers: StoredWorker[] = [];
  let photos: StoredPhoto[] = [];

  const calls = {
    listEntriesArgs: [] as ListEntriesArgs[],
    findEntryFarmerIds: [] as string[],
    replaceWorkersExecutors: [] as Executor[],
  };

  const live = (farmerId: string, entryId: string): StoredEntry | null => {
    const e = entries.get(entryId);
    return e !== undefined && e.farmerId === farmerId && e.deletedAt === null ? e : null;
  };

  const toResponse = (e: StoredEntry): DiaryEntryResponse => {
    const ws = workers.filter((w) => w.entryId === e.id);
    return {
      id: e.id,
      plotId: e.data.plotId,
      farmCropId: e.data.farmCropId,
      categoryKey: e.data.categoryKey,
      subActivityKey: e.data.subActivityKey,
      minutes: e.data.minutes,
      notes: e.data.notes,
      activityOn: e.activityOn,
      loggedAt: new Date().toISOString(),
      totalLabourCostPaise: Math.round(ws.reduce((sum, w) => sum + w.hoursWorked * w.wageRatePaise, 0)),
      createdAt: new Date().toISOString(),
      updatedAt: e.updatedAt === null ? null : e.updatedAt.toISOString(),
      activityFields: e.data.activityFields,
      voiceNoteKey: e.data.voiceNoteKey,
      voiceNoteDurationS: e.data.voiceNoteDurationS,
      workers: ws.map((w) => ({
        id: w.id,
        name: w.name,
        role: w.role,
        hoursWorked: w.hoursWorked,
        wageRatePaise: w.wageRatePaise,
        paymentStatus: w.paymentStatus,
      })),
      photos: photos
        .filter((p) => p.entryId === e.id)
        .map((p) => ({ id: p.id, storageKey: p.storageKey, mimeType: p.mimeType, sizeBytes: p.sizeBytes, createdAt: p.createdAt.toISOString() })),
    };
  };

  const repo: FarmDiaryRepo = {
    async listActiveTaxonomy() {
      const activeCats = [...categories.values()].filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
      const activeKeys = new Set(activeCats.map((c) => c.key));
      return {
        categories: activeCats,
        subActivities: [...subs.values()].filter((s) => s.isActive && activeKeys.has(s.categoryKey)),
      };
    },
    async isActiveSubActivityOfCategory(_db, categoryKey, subActivityKey) {
      const s = subs.get(subActivityKey);
      const c = categories.get(categoryKey);
      return s !== undefined && c !== undefined && s.categoryKey === categoryKey && s.isActive && c.isActive;
    },
    async isPlotOwnedByFarmer(_db, plotId, farmerId) {
      return plots.get(plotId) === farmerId;
    },
    async findGrowingCropOnPlot(_db, plotId, farmCropId) {
      const found = crops.find(
        (c) => c.plotId === plotId && c.status === 'GROWING' && (farmCropId === undefined || c.id === farmCropId),
      );
      return found?.id ?? null;
    },
    async createEntry(_db, data) {
      const id = newId();
      entries.set(id, {
        id,
        farmerId: data.farmerId,
        data: { ...data },
        activityOn: data.activityOn ?? '2026-09-24',
        deletedAt: null,
        updatedAt: null,
      });
      return id;
    },
    async replaceWorkers(db, entryId, ws) {
      calls.replaceWorkersExecutors.push(db);
      workers = workers.filter((w) => w.entryId !== entryId);
      for (const w of ws) workers.push({ ...w, id: newId(), entryId });
    },
    async findEntry(_db, farmerId, entryId) {
      calls.findEntryFarmerIds.push(farmerId);
      const e = live(farmerId, entryId);
      return e === null ? null : toResponse(e);
    },
    async listEntries(_db, args) {
      calls.listEntriesArgs.push(args);
      const items = [...entries.values()]
        .filter((e) => e.farmerId === args.farmerId && e.deletedAt === null)
        .filter((e) => args.plotId === undefined || e.data.plotId === args.plotId)
        .filter((e) => args.date === undefined || e.activityOn === args.date)
        .map((e) => {
          const r = toResponse(e);
          return {
            id: r.id,
            plotId: r.plotId,
            farmCropId: r.farmCropId,
            categoryKey: r.categoryKey,
            subActivityKey: r.subActivityKey,
            minutes: r.minutes,
            notes: r.notes,
            activityOn: r.activityOn,
            loggedAt: r.loggedAt,
            totalLabourCostPaise: r.totalLabourCostPaise,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
            workerCount: r.workers.length,
            photoCount: r.photos.length,
          };
        });
      return { items, next: null };
    },
    async calendarDays(_db, farmerId, monthStart) {
      const month = monthStart.slice(0, 7);
      const counts = new Map<string, number>();
      for (const e of entries.values()) {
        if (e.farmerId !== farmerId || e.deletedAt !== null || !e.activityOn.startsWith(month)) continue;
        counts.set(e.activityOn, (counts.get(e.activityOn) ?? 0) + 1);
      }
      return [...counts.entries()].sort().map(([date, entryCount]) => ({ date, entryCount }));
    },
    async updateEntry(_db, farmerId, entryId, patch: UpdateEntryPatch) {
      const e = live(farmerId, entryId);
      if (e === null) return false;
      if (patch.categoryKey !== undefined) e.data.categoryKey = patch.categoryKey;
      if (patch.subActivityKey !== undefined) e.data.subActivityKey = patch.subActivityKey;
      if (patch.minutes !== undefined) e.data.minutes = patch.minutes;
      if (patch.notes !== undefined) e.data.notes = patch.notes;
      if (patch.activityOn !== undefined) e.activityOn = patch.activityOn;
      e.updatedAt = new Date();
      return true;
    },
    async softDeleteEntry(_db, farmerId, entryId) {
      const e = live(farmerId, entryId);
      if (e === null) return false;
      e.deletedAt = new Date();
      return true;
    },
    async addPhoto(_db, entryId, photo) {
      const stored: StoredPhoto = { ...photo, id: newId(), entryId, createdAt: new Date() };
      photos.push(stored);
      return { id: stored.id, storageKey: stored.storageKey, mimeType: stored.mimeType, sizeBytes: stored.sizeBytes, createdAt: stored.createdAt.toISOString() };
    },
    async deletePhoto(_db, farmerId, entryId, photoId) {
      const e = live(farmerId, entryId);
      const before = photos.length;
      if (e !== null) photos = photos.filter((p) => !(p.id === photoId && p.entryId === entryId));
      return photos.length < before;
    },
    async findCategory(_db, key) {
      const c = categories.get(key);
      return c === undefined ? null : { ...c };
    },
    async createCategory(_db, data) {
      const c: DiaryCategoryResponse = {
        key: data.key,
        name: data.name,
        nameTa: data.nameTa ?? null,
        iconKey: data.iconKey ?? null,
        sortOrder: data.sortOrder,
        isActive: true,
      };
      categories.set(c.key, c);
      return { ...c };
    },
    async updateCategory(_db, key, patch) {
      const c = categories.get(key);
      if (c === undefined) return null;
      const next = { ...c };
      if (patch.name !== undefined) next.name = patch.name;
      if (patch.nameTa !== undefined) next.nameTa = patch.nameTa;
      if (patch.iconKey !== undefined) next.iconKey = patch.iconKey;
      if (patch.sortOrder !== undefined) next.sortOrder = patch.sortOrder;
      if (patch.isActive !== undefined) next.isActive = patch.isActive;
      categories.set(key, next);
      return { ...next };
    },
    async findSubActivity(_db, key) {
      const s = subs.get(key);
      return s === undefined ? null : { ...s };
    },
    async createSubActivity(_db, categoryKey, data) {
      const s: DiarySubActivityResponse = {
        key: data.key,
        categoryKey,
        name: data.name,
        nameTa: data.nameTa ?? null,
        sortOrder: data.sortOrder,
        isActive: true,
      };
      subs.set(s.key, s);
      return { ...s };
    },
    async updateSubActivity(_db, key, patch) {
      const s = subs.get(key);
      if (s === undefined) return null;
      const next = { ...s };
      if (patch.name !== undefined) next.name = patch.name;
      if (patch.nameTa !== undefined) next.nameTa = patch.nameTa;
      if (patch.sortOrder !== undefined) next.sortOrder = patch.sortOrder;
      if (patch.isActive !== undefined) next.isActive = patch.isActive;
      subs.set(key, next);
      return { ...next };
    },
  };

  return { repo, entries, calls, getWorkers: () => workers };
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
  const service = createFarmDiaryService({ repo: fake.repo, db: noopDb, runTx });
  const admin = createDiaryTaxonomyAdminService({ repo: fake.repo, runTx });
  return { ...fake, tx, txsOpened, service, admin };
}

function validBody(overrides: Partial<CreateDiaryEntryBody> = {}): CreateDiaryEntryBody {
  return {
    plotId: PLOT_A,
    categoryKey: 'land_prep',
    subActivityKey: 'land_prep.ploughing',
    minutes: 90,
    activityFields: {},
    workers: [],
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
// BR-40 — own data only
// ---------------------------------------------------------------------------

describe('farm diary — BR-40 own-data only', () => {
  it("BR-40a: farmer A never sees farmer B's entry via list, calendar, plot filter or a guessed id", async () => {
    const { service, calls } = setup();
    const bEntry = await service.createEntry(farmerScope(FARMER_B, 'farmer.diary.create_own'), validBody({ plotId: PLOT_B, activityOn: '2026-09-10' }));
    const aEntry = await service.createEntry(farmerScope(FARMER_A, 'farmer.diary.create_own'), validBody({ activityOn: '2026-09-11' }));
    const scopeA = farmerScope(FARMER_A);

    const list = await service.listEntries(scopeA, { limit: 20 });
    expect(list.items.map((e) => e.id)).toEqual([aEntry.id]);

    // Passing B's plot id explicitly yields an empty list, not an error.
    const byBPlot = await service.listEntries(scopeA, { plotId: PLOT_B, limit: 20 });
    expect(byBPlot.items).toEqual([]);

    // The owner handed to the repo is always the caller's own farmer id.
    expect(calls.listEntriesArgs.every((a) => a.farmerId === FARMER_A)).toBe(true);

    const calendar = await service.getCalendar(scopeA, { month: '2026-09' });
    expect(calendar.days).toEqual([{ date: '2026-09-11', entryCount: 1 }]);

    // A guessed id is indistinguishable from a missing one: 404, never 403.
    const error = await errorOf(service.getEntry(scopeA, bEntry.id));
    expect(error.code).toBe('NOT_FOUND');
    expect(error.status).toBe(404);

    // And a client cannot smuggle a farmerId in: the body schema is strict.
    const smuggled = createDiaryEntryBody.safeParse({ ...validBody(), farmerId: FARMER_B });
    expect(smuggled.success).toBe(false);
  });

  it("BR-40a: creating an entry on another farmer's plot is NOT_FOUND, not 403", async () => {
    const { service } = setup();
    const error = await errorOf(service.createEntry(farmerScope(FARMER_A, 'farmer.diary.create_own'), validBody({ plotId: PLOT_B })));
    expect(error.code).toBe('NOT_FOUND');
    expect(error.status).toBe(404);
  });

  it('an actor with no farmer profile gets NOT_FOUND on /me endpoints (all-scope admins included)', async () => {
    const { service } = setup();
    const error = await errorOf(service.listEntries(aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUPER_ADMIN }), { limit: 20 }));
    expect(error.code).toBe('NOT_FOUND');
  });
});

// ---------------------------------------------------------------------------
// BR-41 — never customer-visible
// ---------------------------------------------------------------------------

describe('farm diary — BR-41 never customer-visible', () => {
  it('BR-41a: every farmer.diary.* permission grants CUSTOMER nothing', () => {
    const diaryPermissions = [...loadRbac().byCode.values()].filter((p) => p.code.startsWith('farmer.diary.'));
    expect(diaryPermissions.length).toBeGreaterThan(0);
    for (const permission of diaryPermissions) {
      const grant = permission.grants[RoleCode.CUSTOMER];
      expect(grant === undefined || grant === ScopeLevel.NONE, `${permission.code} grants CUSTOMER "${String(grant)}"`).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// BR-42 — create-time validation
// ---------------------------------------------------------------------------

describe('farm diary — BR-42 entry validation', () => {
  it('BR-42a: rejects a subActivityKey that does not belong to the categoryKey (422 DIARY_INVALID_SUB_ACTIVITY)', async () => {
    const { service, entries } = setup();
    const error = await errorOf(
      service.createEntry(
        farmerScope(FARMER_A, 'farmer.diary.create_own'),
        validBody({ categoryKey: 'land_prep', subActivityKey: 'sowing.direct_seeding' }),
      ),
    );
    expect(error.code).toBe('DIARY_INVALID_SUB_ACTIVITY');
    expect(error.status).toBe(422);
    expect(entries.size).toBe(0);
  });

  it('BR-42b: rejects a plot with no farm_crops row in status GROWING (422 DIARY_NO_ACTIVE_CROP)', async () => {
    const { service, entries } = setup();
    const error = await errorOf(
      service.createEntry(farmerScope(FARMER_A, 'farmer.diary.create_own'), validBody({ plotId: PLOT_A_NO_CROP })),
    );
    expect(error.code).toBe('DIARY_NO_ACTIVE_CROP');
    expect(error.status).toBe(422);
    expect(entries.size).toBe(0);
  });

  it('BR-42b: attaches the GROWING crop found server-side when the plot has one', async () => {
    const { service } = setup();
    const entry = await service.createEntry(farmerScope(FARMER_A, 'farmer.diary.create_own'), validBody());
    expect(entry.farmCropId).toBe(CROP_A);
  });

  it('BR-42c: rejects missing, zero or negative minutes (422 DIARY_MINUTES_REQUIRED)', async () => {
    const { service, entries } = setup();
    const scope = farmerScope(FARMER_A, 'farmer.diary.create_own');
    const { minutes: _omit, ...withoutMinutes } = validBody();
    for (const body of [withoutMinutes as CreateDiaryEntryBody, validBody({ minutes: 0 }), validBody({ minutes: -15 })]) {
      const error = await errorOf(service.createEntry(scope, body));
      expect(error.code).toBe('DIARY_MINUTES_REQUIRED');
      expect(error.status).toBe(422);
    }
    expect(entries.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// BR-43 — owner-only edit / soft delete
// ---------------------------------------------------------------------------

describe('farm diary — BR-43 owner-only edit and soft delete', () => {
  it("BR-43a: PATCH or DELETE of another farmer's entry is NOT_FOUND (404), never 403, and changes nothing", async () => {
    const { service, entries } = setup();
    const aEntry = await service.createEntry(farmerScope(FARMER_A, 'farmer.diary.create_own'), validBody({ notes: 'original' }));

    const patchError = await errorOf(service.updateEntry(farmerScope(FARMER_B, 'farmer.diary.edit_own'), aEntry.id, { notes: 'hijacked' }));
    expect(patchError.code).toBe('NOT_FOUND');
    expect(patchError.status).toBe(404);

    const deleteError = await errorOf(service.deleteEntry(farmerScope(FARMER_B, 'farmer.diary.delete_own'), aEntry.id));
    expect(deleteError.code).toBe('NOT_FOUND');
    expect(deleteError.status).toBe(404);

    const stored = entries.get(aEntry.id)!;
    expect(stored.data.notes).toBe('original');
    expect(stored.deletedAt).toBeNull();
  });

  it('BR-43b: DELETE sets deleted_at, keeps the row, and hides it from list, calendar and get', async () => {
    const { service, entries } = setup();
    const scope = farmerScope(FARMER_A);
    const entry = await service.createEntry(farmerScope(FARMER_A, 'farmer.diary.create_own'), validBody({ activityOn: '2026-09-05' }));

    await service.deleteEntry(farmerScope(FARMER_A, 'farmer.diary.delete_own'), entry.id);

    const stored = entries.get(entry.id);
    expect(stored).toBeDefined(); // not physically removed
    expect(stored!.deletedAt).toBeInstanceOf(Date);

    expect((await service.listEntries(scope, { limit: 20 })).items).toEqual([]);
    expect((await service.getCalendar(scope, { month: '2026-09' })).days).toEqual([]);
    expect((await errorOf(service.getEntry(scope, entry.id))).code).toBe('NOT_FOUND');

    // A second delete is also NOT_FOUND — the row is gone from the caller's view.
    expect((await errorOf(service.deleteEntry(farmerScope(FARMER_A, 'farmer.diary.delete_own'), entry.id))).code).toBe('NOT_FOUND');
  });

  it('BR-43c: PATCH succeeds no matter how old activity_on is', async () => {
    const { service } = setup();
    const entry = await service.createEntry(farmerScope(FARMER_A, 'farmer.diary.create_own'), validBody({ activityOn: '2019-01-01' }));
    const updated = await service.updateEntry(farmerScope(FARMER_A, 'farmer.diary.edit_own'), entry.id, { notes: 'late correction', minutes: 45 });
    expect(updated.activityOn).toBe('2019-01-01');
    expect(updated.notes).toBe('late correction');
    expect(updated.minutes).toBe(45);
  });
});

// ---------------------------------------------------------------------------
// BR-44 — workforce
// ---------------------------------------------------------------------------

describe('farm diary — BR-44 workforce validation', () => {
  const worker = { name: 'Murugan', hoursWorked: 8, wageRatePaise: 5000, paymentStatus: 'PENDING' as const };

  it('BR-44a: hoursWorked <= 0 or > 24 is rejected with 422 DIARY_WORKER_HOURS_INVALID', async () => {
    const { service, entries } = setup();
    const scope = farmerScope(FARMER_A, 'farmer.diary.create_own');
    for (const hoursWorked of [0, -1, 24.5, 100]) {
      const error = await errorOf(service.createEntry(scope, validBody({ workers: [{ ...worker, hoursWorked }] })));
      expect(error.code).toBe('DIARY_WORKER_HOURS_INVALID');
      expect(error.status).toBe(422);
    }
    expect(entries.size).toBe(0);

    // Boundary: exactly 24 hours is allowed.
    const ok = await service.createEntry(scope, validBody({ workers: [{ ...worker, hoursWorked: 24 }] }));
    expect(ok.workers[0]!.hoursWorked).toBe(24);
  });

  it('BR-44a: the same check applies on PATCH', async () => {
    const { service } = setup();
    const entry = await service.createEntry(farmerScope(FARMER_A, 'farmer.diary.create_own'), validBody());
    const error = await errorOf(
      service.updateEntry(farmerScope(FARMER_A, 'farmer.diary.edit_own'), entry.id, { workers: [{ ...worker, hoursWorked: 25 }] }),
    );
    expect(error.code).toBe('DIARY_WORKER_HOURS_INVALID');
  });

  it('BR-44b: wageRatePaise <= 0 or non-integer is rejected with 422 DIARY_WAGE_RATE_INVALID', async () => {
    const { service, entries } = setup();
    const scope = farmerScope(FARMER_A, 'farmer.diary.create_own');
    for (const wageRatePaise of [0, -500, 250.5, 0.1]) {
      const error = await errorOf(service.createEntry(scope, validBody({ workers: [{ ...worker, wageRatePaise }] })));
      expect(error.code).toBe('DIARY_WAGE_RATE_INVALID');
      expect(error.status).toBe(422);
    }
    expect(entries.size).toBe(0);
  });

  it('BR-44c: updating workers fully replaces the prior set in the same transaction — no orphans', async () => {
    const { service, getWorkers, calls, tx } = setup();
    const entry = await service.createEntry(
      farmerScope(FARMER_A, 'farmer.diary.create_own'),
      validBody({
        workers: [
          { ...worker, name: 'A' },
          { ...worker, name: 'B' },
          { ...worker, name: 'C' },
        ],
      }),
    );
    expect(getWorkers().filter((w) => w.entryId === entry.id)).toHaveLength(3);

    const updated = await service.updateEntry(farmerScope(FARMER_A, 'farmer.diary.edit_own'), entry.id, {
      workers: [{ ...worker, name: 'D', hoursWorked: 1.5, wageRatePaise: 333 }],
    });

    const remaining = getWorkers().filter((w) => w.entryId === entry.id);
    expect(remaining.map((w) => w.name)).toEqual(['D']);
    expect(updated.workers.map((w) => w.name)).toEqual(['D']);
    // Labour cost is computed at read time from the current set (1.5 x 333 = 499.5 -> 500).
    expect(updated.totalLabourCostPaise).toBe(500);
    // Both writes ran on the transaction client, not the pool.
    expect(calls.replaceWorkersExecutors.every((executor) => executor === tx)).toBe(true);

    // Omitting `workers` leaves the set untouched.
    await service.updateEntry(farmerScope(FARMER_A, 'farmer.diary.edit_own'), entry.id, { notes: 'x' });
    expect(getWorkers().filter((w) => w.entryId === entry.id).map((w) => w.name)).toEqual(['D']);
  });
});

// ---------------------------------------------------------------------------
// BR-45 — admin-managed taxonomy
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

describe('farm diary — BR-45 admin-managed taxonomy', () => {
  it('BR-45a: FARMER and CUSTOMER get 403 on the admin taxonomy permission; SUPER/TOHFA admins pass', () => {
    const farmer = aFarmer();
    const customer = anActor({ userId: newId(), roles: [{ code: RoleCode.CUSTOMER }], customerId: IDS.customer });
    for (const actor of [farmer, customer]) {
      for (const method of ['POST', 'PATCH']) {
        const err = runPermission('admin.diary_taxonomy.manage', actor, method);
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).status).toBe(403);
        expect((err as AppError).code).toBe('FORBIDDEN');
      }
    }
    for (const role of [RoleCode.SUPER_ADMIN, RoleCode.TOHFA_ADMIN]) {
      expect(runPermission('admin.diary_taxonomy.manage', anActor({ roles: [{ code: role }] }))).toBeUndefined();
    }
  });

  it('BR-45b: deactivating an in-use sub-activity keeps existing entries intact, hides it from the farmer taxonomy, and BR-42a rejects it for new entries', async () => {
    const { service, admin } = setup();
    const createScope = farmerScope(FARMER_A, 'farmer.diary.create_own');
    const existing = await service.createEntry(createScope, validBody({ subActivityKey: 'land_prep.levelling' }));

    const deactivated = await admin.updateSubActivity(adminScope, 'land_prep.levelling', { isActive: false });
    expect(deactivated.isActive).toBe(false);

    // Existing entry is untouched and still readable — and still editable.
    const reread = await service.getEntry(farmerScope(FARMER_A), existing.id);
    expect(reread.subActivityKey).toBe('land_prep.levelling');
    const edited = await service.updateEntry(farmerScope(FARMER_A, 'farmer.diary.edit_own'), existing.id, { notes: 'still fine' });
    expect(edited.subActivityKey).toBe('land_prep.levelling');

    // Gone from the farmer's taxonomy fetch.
    const taxonomy = await service.getTaxonomy(farmerScope(FARMER_A));
    const landPrep = taxonomy.categories.find((c) => c.key === 'land_prep')!;
    expect(landPrep.subActivities.map((s) => s.key)).toEqual(['land_prep.ploughing']);

    // Rejected for new entries.
    const error = await errorOf(service.createEntry(createScope, validBody({ subActivityKey: 'land_prep.levelling' })));
    expect(error.code).toBe('DIARY_INVALID_SUB_ACTIVITY');

    // Deactivating a whole category removes it and hides its sub-activities too.
    await admin.updateCategory(adminScope, 'sowing', { isActive: false });
    const after = await service.getTaxonomy(farmerScope(FARMER_A));
    expect(after.categories.map((c) => c.key)).toEqual(['land_prep']);
    expect((await errorOf(service.createEntry(createScope, validBody({ categoryKey: 'sowing', subActivityKey: 'sowing.direct_seeding' })))).code).toBe(
      'DIARY_INVALID_SUB_ACTIVITY',
    );
  });

  it('BR-45c: every admin taxonomy mutation writes exactly one audit_log row on the same transaction client', async () => {
    const mutations: Array<(admin: ReturnType<typeof setup>['admin']) => Promise<unknown>> = [
      (admin) => admin.createCategory(adminScope, { key: 'harvest', name: 'Harvest', sortOrder: 9 }),
      (admin) => admin.updateCategory(adminScope, 'land_prep', { name: 'Land prep', isActive: false }),
      (admin) => admin.createSubActivity(adminScope, 'land_prep', { key: 'land_prep.mulching', name: 'Mulching', sortOrder: 3 }),
      (admin) => admin.updateSubActivity(adminScope, 'land_prep.ploughing', { isActive: false }),
    ];

    for (const mutate of mutations) {
      const { admin, tx, txsOpened } = setup();
      await mutate(admin);
      expect(txsOpened).toHaveLength(1);
      const auditInserts = tx.sql.filter((s) => s.includes('INSERT INTO audit_log'));
      expect(auditInserts).toHaveLength(1);
    }
  });

  it('BR-45c: a failed admin mutation writes no audit row', async () => {
    const { admin, tx } = setup();
    expect((await errorOf(admin.updateCategory(adminScope, 'no_such_category', { name: 'x' }))).code).toBe('NOT_FOUND');
    expect((await errorOf(admin.createCategory(adminScope, { key: 'land_prep', name: 'dup', sortOrder: 1 }))).code).toBe('CONFLICT');
    expect(
      (await errorOf(admin.createSubActivity(adminScope, 'land_prep', { key: 'sowing.wrong_parent', name: 'x', sortOrder: 1 }))).code,
    ).toBe('VALIDATION_FAILED');
    expect(tx.sql.filter((s) => s.includes('INSERT INTO audit_log'))).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Photos and stubs
// ---------------------------------------------------------------------------

describe('farm diary — photos and picker stubs', () => {
  it('attaches a DIARY_PHOTO key to an owned entry and refuses a foreign entry or a non-diary key', async () => {
    const { service } = setup();
    const entry = await service.createEntry(farmerScope(FARMER_A, 'farmer.diary.create_own'), validBody());
    const photo = { storageKey: 'diary_photo/abc.jpg', mimeType: 'image/jpeg' as const, sizeBytes: 1024 };

    const attached = await service.attachPhoto(farmerScope(FARMER_A, 'farmer.diary.edit_own'), entry.id, photo);
    expect(attached.storageKey).toBe('diary_photo/abc.jpg');

    expect((await errorOf(service.attachPhoto(farmerScope(FARMER_B, 'farmer.diary.edit_own'), entry.id, photo))).code).toBe('NOT_FOUND');
    expect(
      (await errorOf(service.attachPhoto(farmerScope(FARMER_A, 'farmer.diary.edit_own'), entry.id, { ...photo, storageKey: 'listing_photo/abc.jpg' }))).code,
    ).toBe('VALIDATION_FAILED');

    expect((await errorOf(service.deletePhoto(farmerScope(FARMER_B, 'farmer.diary.edit_own'), entry.id, attached.id))).code).toBe('NOT_FOUND');
    await service.deletePhoto(farmerScope(FARMER_A, 'farmer.diary.edit_own'), entry.id, attached.id);
    expect((await service.getEntry(farmerScope(FARMER_A), entry.id)).photos).toEqual([]);
  });

  it('the plots / active-crops stubs return fixed fixtures (deliberate, pending a plots module)', async () => {
    const { service } = setup();
    const plots = await service.listPlots(farmerScope(FARMER_A));
    expect(plots.items.length).toBeGreaterThanOrEqual(2);
    const crops = await service.listActiveCrops(farmerScope(FARMER_A), plots.items[0]!.id);
    expect(crops.items).toHaveLength(1);
  });

  it('rejects a tampered list cursor with VALIDATION_FAILED', async () => {
    const { service } = setup();
    const error = await errorOf(service.listEntries(farmerScope(FARMER_A), { limit: 20, cursor: 'not-a-cursor' }));
    expect(error.code).toBe('VALIDATION_FAILED');
  });
});

// ---------------------------------------------------------------------------
// Integration — proves the repo SQL parses against migrations 0020/0021.
// ---------------------------------------------------------------------------

describeIfDatabase('farmDiaryRepo (integration)', () => {
  let ready = false;

  beforeAll(async () => {
    ready = (await databaseReady('diary_entries')) && (await databaseReady('diary_entry_workers'));
    if (!ready) console.warn('[skip] diary tables not migrated — run `pnpm db:migrate`');
  });

  afterAll(async () => {
    if (!ready) return;
    const { closePool } = await import('../../db/pool.js');
    await closePool();
  });

  it('runs the taxonomy, list, calendar and lookup queries against Postgres', async () => {
    if (!ready) return;
    const { pool } = await import('../../db/pool.js');
    const { farmDiaryRepo } = await import('./farm-diary.repo.js');
    const nobody = newId();

    const taxonomy = await farmDiaryRepo.listActiveTaxonomy(pool);
    expect(taxonomy.categories.every((c) => c.isActive)).toBe(true);

    const list = await farmDiaryRepo.listEntries(pool, {
      farmerId: nobody,
      monthStart: '2026-09-01',
      cursor: { activityOn: '2026-09-30', loggedAt: new Date().toISOString(), id: newId() },
      limit: 5,
    });
    expect(list.items).toEqual([]);
    expect(await farmDiaryRepo.calendarDays(pool, nobody, '2026-09-01')).toEqual([]);
    expect(await farmDiaryRepo.findEntry(pool, nobody, newId())).toBeNull();
    expect(await farmDiaryRepo.isPlotOwnedByFarmer(pool, newId(), nobody)).toBe(false);
    expect(await farmDiaryRepo.findGrowingCropOnPlot(pool, newId())).toBeNull();
    expect(await farmDiaryRepo.softDeleteEntry(pool, nobody, newId())).toBe(false);
  });
});
