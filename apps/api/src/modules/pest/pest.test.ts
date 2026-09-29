/**
 * Two layers of test, always (see apps/api/CLAUDE.md), mirroring soil.test.ts:
 *
 *  1. SCHEMA + SERVICE tests with a fake repo. Fast, no I/O. This is where
 *     BR-36 (own-data ownership: a plot/farm belonging to a different farmer
 *     404s, never 403, and nothing is written) and the BR-38 boundary (the
 *     server only stamps timestamps / does calendar arithmetic over the
 *     farmer's own inputs — it never invents content) are asserted.
 *
 *  2. describeIfDatabase-gated integration tests against a real pool, one per
 *     resource, proving the five 0023 tables round-trip through Postgres.
 *     Each runs inside a transaction that rolls back, so no residue is left.
 */
import { describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { AppError } from '../../http/problem.js';
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { addDays, bucketBySeason, createPestService } from './pest.service.js';
import type {
  CropCount,
  InsertPestDetectionParams,
  InsertPestTreatmentLogParams,
  InsertPestTreatmentReminderParams,
  MonthCount,
  OwnedPlotArgs,
  PestDetection,
  PestDetectionPatch,
  PestLibraryEntry,
  PestLibraryFilters,
  PestRepo,
  PestTreatmentLog,
  PestTreatmentReminder,
  PestTreatmentReminderPatch,
  TreatmentTally,
  WeatherRiskNote,
} from './pest.repo.js';
import {
  createPestDetectionBody,
  createPestTreatmentLogBody,
  createPestTreatmentReminderBody,
  listPestLibraryQuery,
  updatePestDetectionBody,
  updatePestTreatmentReminderBody,
} from './pest.schema.js';
import { IDS, aScope, databaseReady, describeIfDatabase, newId } from '../../test/factories.js';

// ---------------------------------------------------------------------------
// fixtures
// ---------------------------------------------------------------------------

const FARMER_A = IDS.farmer;
const FARMER_B = newId();
const USER_A = IDS.userFarmer;
const FARM_A = newId();
const PLOT_A = newId();
const OTHER_PLOT = newId();
const FIXED_NOW = '2026-09-29T10:00:00.000Z';

function farmerScope(overrides: Partial<ResolvedScope> = {}): ResolvedScope {
  return aScope({
    level: ScopeLevel.OWN,
    permission: 'farmer.pest.manage_own',
    roleCode: RoleCode.FARMER,
    userId: USER_A,
    farmerId: FARMER_A,
    ...overrides,
  });
}

/** Mirrors soil.test.ts: a FARMER scope with no farmerId at all. */
function farmerScopeWithoutFarmerId(): ResolvedScope {
  const scope = farmerScope();
  const { farmerId: _farmerId, ...rest } = scope;
  return rest as ResolvedScope;
}

function aLibraryEntry(overrides: Partial<PestLibraryEntry> = {}): PestLibraryEntry {
  return {
    id: newId(),
    name: 'Powdery Mildew',
    scientificName: 'Erysiphales',
    category: 'Disease',
    riskLevel: 'Medium',
    crops: ['Beetroot', 'Carrot'],
    season: 'Monsoon',
    symptoms: ['White powdery patches'],
    organicTreatments: ['Wettable Sulphur'],
    prevention: ['Airflow'],
    recommendedTreatment: 'Wettable Sulphur / Trichoderma',
    intervalDays: 12,
    phiDays: 5,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: null,
    ...overrides,
  };
}

function aDetection(overrides: Partial<PestDetection> = {}): PestDetection {
  return {
    id: newId(),
    plotId: PLOT_A,
    farmCropId: null,
    pestLibraryId: null,
    pestName: 'Aphids',
    scientificName: null,
    cropLabel: null,
    severity: 'Medium',
    status: 'Ongoing',
    detectedOn: '2026-09-20',
    notes: null,
    photoUploadId: null,
    resolvedAt: null,
    resolutionEffective: null,
    createdAt: '2026-09-20T06:00:00.000Z',
    updatedAt: null,
    ...overrides,
  };
}

function aReminder(overrides: Partial<PestTreatmentReminder> = {}): PestTreatmentReminder {
  return {
    id: newId(),
    plotId: PLOT_A,
    detectionId: null,
    title: 'Re-check for aphids',
    targetPest: 'Aphids',
    dueDate: '2026-09-28',
    repeatInterval: 'ONE_TIME',
    status: 'Upcoming',
    completedAt: null,
    notes: null,
    createdAt: '2026-09-20T06:00:00.000Z',
    updatedAt: null,
    ...overrides,
  };
}

/** Resolves a patch's 'NOW' sentinel the way `now()` would in SQL. */
function applyTimestamp(value: 'NOW' | null | undefined, current: string | null): string | null {
  if (value === undefined) return current;
  return value === 'NOW' ? FIXED_NOW : null;
}

interface FakeRepoOptions {
  ownedPlots?: OwnedPlotArgs[];
  /** uploadId -> owning userId (or null); absent key = does not exist. */
  uploads?: Map<string, string | null>;
  /** farm_crops rows as { id, plotId }. */
  farmCrops?: Array<{ id: string; plotId: string }>;
  library?: PestLibraryEntry[];
  weatherNotes?: WeatherRiskNote[];
  detections?: PestDetection[];
  reminders?: PestTreatmentReminder[];
  monthCounts?: MonthCount[];
  cropCounts?: CropCount[];
  tallies?: TreatmentTally[];
}

interface RepoCalls {
  insertDetection: InsertPestDetectionParams[];
  updateDetection: Array<{ plotId: string; id: string; patch: PestDetectionPatch }>;
  insertTreatmentLog: InsertPestTreatmentLogParams[];
  insertReminder: InsertPestTreatmentReminderParams[];
  updateReminder: Array<{ plotId: string; id: string; patch: PestTreatmentReminderPatch }>;
  listPestLibrary: PestLibraryFilters[];
  analyticsFarmIds: string[];
}

function fakeRepo(options: FakeRepoOptions = {}): { repo: PestRepo; calls: RepoCalls } {
  const ownedPlots = options.ownedPlots ?? [{ farmerId: FARMER_A, farmId: FARM_A, plotId: PLOT_A }];
  const uploads = options.uploads ?? new Map<string, string | null>();
  const farmCrops = options.farmCrops ?? [];
  const library = options.library ?? [];
  const detections = new Map(options.detections?.map((d) => [d.id, d]) ?? []);
  const reminders = new Map(options.reminders?.map((r) => [r.id, r]) ?? []);
  const logs: PestTreatmentLog[] = [];

  const calls: RepoCalls = {
    insertDetection: [],
    updateDetection: [],
    insertTreatmentLog: [],
    insertReminder: [],
    updateReminder: [],
    listPestLibrary: [],
    analyticsFarmIds: [],
  };

  const repo: PestRepo = {
    async findOwnedPlotId(_db, args) {
      const match = ownedPlots.find(
        (p) => p.plotId === args.plotId && p.farmId === args.farmId && p.farmerId === args.farmerId,
      );
      return match?.plotId ?? null;
    },
    async findOwnedFarmId(_db, args) {
      const match = ownedPlots.find((p) => p.farmId === args.farmId && p.farmerId === args.farmerId);
      return match?.farmId ?? null;
    },
    async findUploadOwner(_db, uploadId) {
      if (!uploads.has(uploadId)) return undefined;
      return uploads.get(uploadId) ?? null;
    },
    async farmCropExistsOnPlot(_db, plotId, farmCropId) {
      return farmCrops.some((fc) => fc.id === farmCropId && fc.plotId === plotId);
    },

    async listPestLibrary(_db, filters) {
      calls.listPestLibrary.push(filters);
      return library;
    },
    async findPestLibraryEntryById(_db, id) {
      return library.find((e) => e.id === id) ?? null;
    },
    async listCurrentWeatherRiskNotes() {
      return options.weatherNotes ?? [];
    },

    async listDetections(_db, plotId) {
      return [...detections.values()].filter((d) => d.plotId === plotId);
    },
    async findDetectionById(_db, plotId, id) {
      const d = detections.get(id);
      return d !== undefined && d.plotId === plotId ? d : null;
    },
    async insertDetection(_db, params) {
      calls.insertDetection.push(params);
      const detection = aDetection({ ...params, id: newId() });
      detections.set(detection.id, detection);
      return detection;
    },
    async updateDetection(_db, plotId, id, patch) {
      calls.updateDetection.push({ plotId, id, patch });
      const existing = detections.get(id);
      if (existing === undefined || existing.plotId !== plotId) return null;
      const updated: PestDetection = {
        ...existing,
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.resolutionEffective !== undefined ? { resolutionEffective: patch.resolutionEffective } : {}),
        ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
        resolvedAt: applyTimestamp(patch.resolvedAt, existing.resolvedAt),
        updatedAt: FIXED_NOW,
      };
      detections.set(id, updated);
      return updated;
    },

    async listTreatmentLogs(_db, plotId) {
      return logs.filter((l) => l.plotId === plotId);
    },
    async insertTreatmentLog(_db, params) {
      calls.insertTreatmentLog.push(params);
      const log: PestTreatmentLog = {
        ...params,
        id: newId(),
        createdAt: FIXED_NOW,
        updatedAt: null,
      };
      logs.push(log);
      return log;
    },

    async listReminders(_db, plotId) {
      return [...reminders.values()].filter((r) => r.plotId === plotId);
    },
    async findReminderById(_db, plotId, id) {
      const r = reminders.get(id);
      return r !== undefined && r.plotId === plotId ? r : null;
    },
    async insertReminder(_db, params) {
      calls.insertReminder.push(params);
      const reminder = aReminder({ ...params, id: newId() });
      reminders.set(reminder.id, reminder);
      return reminder;
    },
    async updateReminder(_db, plotId, id, patch) {
      calls.updateReminder.push({ plotId, id, patch });
      const existing = reminders.get(id);
      if (existing === undefined || existing.plotId !== plotId) return null;
      const updated: PestTreatmentReminder = {
        ...existing,
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.dueDate !== undefined ? { dueDate: patch.dueDate } : {}),
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
        completedAt: applyTimestamp(patch.completedAt, existing.completedAt),
        updatedAt: FIXED_NOW,
      };
      reminders.set(id, updated);
      return updated;
    },

    async countDetectionsByMonth(_db, farmId) {
      calls.analyticsFarmIds.push(farmId);
      return options.monthCounts ?? [];
    },
    async countDetectionsByCrop(_db, farmId) {
      calls.analyticsFarmIds.push(farmId);
      return options.cropCounts ?? [];
    },
    async tallyTreatmentEffectiveness(_db, farmId) {
      calls.analyticsFarmIds.push(farmId);
      return options.tallies ?? [];
    },
  };

  return { repo, calls };
}

/**
 * Executor that stands in for writeAuditLog's raw INSERT (bypasses the fake
 * repo) and records the action codes written, so tests can assert the audit
 * row is written on the same tx client as the mutation.
 */
function auditRecorder(): { db: Executor; actionCodes: string[] } {
  const actionCodes: string[] = [];
  const db: Executor = {
    query: (async (_sql: string, params?: unknown[]) => {
      // writeAuditLog's params: [actorId, actorType, actorRole, actionCode, ...]
      if (Array.isArray(params) && typeof params[3] === 'string') actionCodes.push(params[3]);
      return { rows: [{ id: newId() }], rowCount: 1 };
    }) as never,
  };
  return { db, actionCodes };
}

function service(options: FakeRepoOptions = {}) {
  const { repo, calls } = fakeRepo(options);
  const audit = auditRecorder();
  const svc = createPestService({
    repo,
    db: audit.db,
    runTx: async (fn) => fn(audit.db),
  });
  return { svc, calls, audit: audit.actionCodes };
}

async function expectNotFound(promise: Promise<unknown>): Promise<void> {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(AppError);
  expect((error as AppError).code).toBe('NOT_FOUND');
  expect((error as AppError).status).toBe(404);
}

const detectionBody = (overrides: Record<string, unknown> = {}) =>
  createPestDetectionBody.parse({
    pestName: 'Powdery Mildew',
    severity: 'Low',
    detectedOn: '2026-09-20',
    ...overrides,
  });

const treatmentBody = (overrides: Record<string, unknown> = {}) =>
  createPestTreatmentLogBody.parse({
    pestName: 'Powdery Mildew',
    category: 'Disease',
    severity: 'Low',
    treatment: 'Wettable Sulphur',
    appliedOn: '2026-09-21',
    ...overrides,
  });

const reminderBody = (overrides: Record<string, unknown> = {}) =>
  createPestTreatmentReminderBody.parse({ title: 'Re-check for aphids', dueDate: '2026-09-28', ...overrides });

// ---------------------------------------------------------------------------
// schema validation
// ---------------------------------------------------------------------------

describe('pest.schema validation', () => {
  it('createPestDetectionBody requires pestName/severity/detectedOn and is .strict()', () => {
    expect(createPestDetectionBody.safeParse({}).success).toBe(false);
    const valid = { pestName: 'Aphids', severity: 'High', detectedOn: '2026-09-20' };
    expect(createPestDetectionBody.safeParse(valid).success).toBe(true);
    expect(createPestDetectionBody.safeParse({ ...valid, status: 'Resolved' }).success).toBe(false);
    expect(createPestDetectionBody.safeParse({ ...valid, severity: 'Severe' }).success).toBe(false);
    expect(createPestDetectionBody.safeParse({ ...valid, detectedOn: '20-09-2026' }).success).toBe(false);
  });

  it('updatePestDetectionBody only accepts the spec status enum and rejects a client resolvedAt', () => {
    expect(updatePestDetectionBody.safeParse({ status: 'Recurring' }).success).toBe(true);
    expect(updatePestDetectionBody.safeParse({ status: 'Closed' }).success).toBe(false);
    expect(updatePestDetectionBody.safeParse({ resolvedAt: FIXED_NOW }).success).toBe(false);
    expect(updatePestDetectionBody.safeParse({ resolutionEffective: null }).success).toBe(true);
  });

  it('createPestTreatmentLogBody requires category from the enum and a non-negative intervalDays', () => {
    const base = { pestName: 'Aphids', severity: 'Low', treatment: 'Neem oil', appliedOn: '2026-09-21' };
    expect(createPestTreatmentLogBody.safeParse({ ...base, category: 'Pest' }).success).toBe(true);
    expect(createPestTreatmentLogBody.safeParse({ ...base, category: 'Insect' }).success).toBe(false);
    expect(createPestTreatmentLogBody.safeParse({ ...base, category: 'Pest', intervalDays: -1 }).success).toBe(false);
  });

  it('createPestTreatmentReminderBody defaults repeatInterval to ONE_TIME', () => {
    const parsed = createPestTreatmentReminderBody.parse({ title: 'Check', dueDate: '2026-09-28' });
    expect(parsed.repeatInterval).toBe('ONE_TIME');
    expect(
      createPestTreatmentReminderBody.safeParse({ title: 'Check', dueDate: '2026-09-28', repeatInterval: 'DAILY' })
        .success,
    ).toBe(false);
  });

  it('updatePestTreatmentReminderBody rejects Overdue and a client completedAt', () => {
    expect(updatePestTreatmentReminderBody.safeParse({ status: 'Completed' }).success).toBe(true);
    expect(updatePestTreatmentReminderBody.safeParse({ status: 'Overdue' }).success).toBe(false);
    expect(updatePestTreatmentReminderBody.safeParse({ completedAt: FIXED_NOW }).success).toBe(false);
  });

  it('listPestLibraryQuery accepts q and crop and rejects unknown params', () => {
    expect(listPestLibraryQuery.safeParse({ q: 'mildew', crop: 'Carrot' }).success).toBe(true);
    expect(listPestLibraryQuery.safeParse({ zone: 'x' }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// pure helpers
// ---------------------------------------------------------------------------

describe('pure helpers', () => {
  it('addDays is plain calendar arithmetic across month and year boundaries', () => {
    expect(addDays('2026-09-21', 12)).toBe('2026-10-03');
    expect(addDays('2026-12-25', 10)).toBe('2027-01-04');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29'); // leap year
    expect(addDays('2026-09-21', 0)).toBe('2026-09-21');
  });

  it('bucketBySeason zero-fills every season and sums months (Jan belongs to Winter)', () => {
    expect(
      bucketBySeason([
        { month: 1, count: 2 },
        { month: 7, count: 3 },
        { month: 8, count: 1 },
        { month: 11, count: 4 },
      ]),
    ).toEqual([
      { season: 'Summer', count: 0 },
      { season: 'Monsoon', count: 4 },
      { season: 'Winter', count: 6 },
    ]);
  });
});

// ---------------------------------------------------------------------------
// BR-36 — own-data ownership (plot/farm must belong to the caller)
// ---------------------------------------------------------------------------

describe('BR-36 — pest data ownership', () => {
  const foreignPlot = { ownedPlots: [{ farmerId: FARMER_B, farmId: FARM_A, plotId: PLOT_A }] };

  it('BR-36: listing detections on another farmer\'s plot 404s, never 403', async () => {
    const { svc } = service({ ...foreignPlot, detections: [aDetection()] });
    await expectNotFound(svc.listDetections(farmerScope(), FARM_A, PLOT_A));
  });

  it('BR-36: creating a detection on another farmer\'s plot 404s and nothing is written', async () => {
    const { svc, calls, audit } = service(foreignPlot);
    await expectNotFound(svc.createDetection(farmerScope(), FARM_A, PLOT_A, detectionBody()));
    expect(calls.insertDetection).toHaveLength(0);
    expect(audit).toHaveLength(0);
  });

  it('BR-36: getting a detection on another farmer\'s plot 404s', async () => {
    const detection = aDetection();
    const { svc } = service({ ...foreignPlot, detections: [detection] });
    await expectNotFound(svc.getDetection(farmerScope(), FARM_A, PLOT_A, detection.id));
  });

  it('BR-36: patching a detection on another farmer\'s plot 404s before any update', async () => {
    const detection = aDetection();
    const { svc, calls, audit } = service({ ...foreignPlot, detections: [detection] });
    await expectNotFound(
      svc.updateDetection(farmerScope(), FARM_A, PLOT_A, detection.id, { status: 'Resolved' }),
    );
    expect(calls.updateDetection).toHaveLength(0);
    expect(audit).toHaveLength(0);
  });

  it('BR-36: a detection id that lives on a different plot 404s even when the path plot is owned', async () => {
    const detection = aDetection({ plotId: OTHER_PLOT });
    const { svc, calls } = service({ detections: [detection] });
    await expectNotFound(svc.getDetection(farmerScope(), FARM_A, PLOT_A, detection.id));
    await expectNotFound(
      svc.updateDetection(farmerScope(), FARM_A, PLOT_A, detection.id, { status: 'Resolved' }),
    );
    expect(calls.updateDetection).toHaveLength(0);
  });

  it('BR-36: treatment logs on another farmer\'s plot 404 for list and create, and nothing is written', async () => {
    const { svc, calls, audit } = service(foreignPlot);
    await expectNotFound(svc.listTreatmentLogs(farmerScope(), FARM_A, PLOT_A));
    await expectNotFound(svc.createTreatmentLog(farmerScope(), FARM_A, PLOT_A, treatmentBody()));
    expect(calls.insertTreatmentLog).toHaveLength(0);
    expect(audit).toHaveLength(0);
  });

  it('BR-36: reminders on another farmer\'s plot 404 for list, create and patch, and nothing is written', async () => {
    const reminder = aReminder();
    const { svc, calls, audit } = service({ ...foreignPlot, reminders: [reminder] });
    await expectNotFound(svc.listReminders(farmerScope(), FARM_A, PLOT_A));
    await expectNotFound(svc.createReminder(farmerScope(), FARM_A, PLOT_A, reminderBody()));
    await expectNotFound(
      svc.updateReminder(farmerScope(), FARM_A, PLOT_A, reminder.id, { status: 'Completed' }),
    );
    expect(calls.insertReminder).toHaveLength(0);
    expect(calls.updateReminder).toHaveLength(0);
    expect(audit).toHaveLength(0);
  });

  it('BR-36: the analytics summary for another farmer\'s farm 404s and runs no aggregate query', async () => {
    const { svc, calls } = service(foreignPlot);
    await expectNotFound(svc.getAnalyticsSummary(farmerScope(), FARM_A));
    expect(calls.analyticsFarmIds).toHaveLength(0);
  });

  it('BR-36: an own-scoped FARMER with no farmerId 404s rather than querying with an undefined owner', async () => {
    const { svc, calls } = service();
    await expectNotFound(svc.listDetections(farmerScopeWithoutFarmerId(), FARM_A, PLOT_A));
    await expectNotFound(svc.getAnalyticsSummary(farmerScopeWithoutFarmerId(), FARM_A));
    expect(calls.analyticsFarmIds).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// pest_library + weather_risk_notes
// ---------------------------------------------------------------------------

describe('pest library + weather risk notes', () => {
  it('passes only the provided filters through to the repo', async () => {
    const { svc, calls } = service({ library: [aLibraryEntry()] });
    await svc.listPestLibrary({ q: 'mildew' });
    await svc.listPestLibrary({});
    expect(calls.listPestLibrary).toEqual([{ q: 'mildew' }, {}]);
  });

  it('getPestLibraryEntry 404s for an unknown id', async () => {
    const { svc } = service({ library: [] });
    await expectNotFound(svc.getPestLibraryEntry(newId()));
  });

  it('listWeatherRiskNotes returns the repo\'s currently-valid notes unchanged', async () => {
    const note: WeatherRiskNote = {
      id: newId(),
      region: 'The Nilgiris',
      note: 'Heavy rain expected — fungal risk',
      riskLevel: 'High',
      validFrom: null,
      validUntil: null,
      createdBy: null,
      createdAt: FIXED_NOW,
      updatedAt: null,
    };
    const { svc } = service({ weatherNotes: [note] });
    expect(await svc.listWeatherRiskNotes()).toEqual([note]);
  });
});

// ---------------------------------------------------------------------------
// pest_detections
// ---------------------------------------------------------------------------

describe('pest detections — create', () => {
  it('creates a detection under the plot and writes an audit row', async () => {
    const { svc, calls, audit } = service();
    const detection = await svc.createDetection(farmerScope(), FARM_A, PLOT_A, detectionBody());
    expect(detection.plotId).toBe(PLOT_A);
    expect(calls.insertDetection[0]?.plotId).toBe(PLOT_A);
    expect(audit).toEqual(['farmer.pest.detection.create']);
  });

  it('rejects a pestLibraryId that does not exist with 422 VALIDATION_FAILED and writes nothing', async () => {
    const { svc, calls } = service({ library: [] });
    await expect(
      svc.createDetection(farmerScope(), FARM_A, PLOT_A, detectionBody({ pestLibraryId: newId() })),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
    expect(calls.insertDetection).toHaveLength(0);
  });

  it('snapshots the catalog scientificName when a library entry is chosen and none was typed', async () => {
    const entry = aLibraryEntry({ scientificName: 'Erysiphales' });
    const { svc, calls } = service({ library: [entry] });
    await svc.createDetection(farmerScope(), FARM_A, PLOT_A, detectionBody({ pestLibraryId: entry.id }));
    expect(calls.insertDetection[0]?.scientificName).toBe('Erysiphales');
    expect(calls.insertDetection[0]?.pestName).toBe('Powdery Mildew');
  });

  it('an explicit client scientificName wins over the catalog value', async () => {
    const entry = aLibraryEntry({ scientificName: 'Erysiphales' });
    const { svc, calls } = service({ library: [entry] });
    await svc.createDetection(
      farmerScope(),
      FARM_A,
      PLOT_A,
      detectionBody({ pestLibraryId: entry.id, scientificName: 'Erysiphe cichoracearum' }),
    );
    expect(calls.insertDetection[0]?.scientificName).toBe('Erysiphe cichoracearum');
  });

  it('rejects a farmCropId that is not a crop on this plot', async () => {
    const farmCropId = newId();
    const { svc, calls } = service({ farmCrops: [{ id: farmCropId, plotId: OTHER_PLOT }] });
    await expect(
      svc.createDetection(farmerScope(), FARM_A, PLOT_A, detectionBody({ farmCropId })),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
    expect(calls.insertDetection).toHaveLength(0);
  });

  it('rejects a photoUploadId that does not exist, or is owned by someone else', async () => {
    const foreignUpload = newId();
    const { svc, calls } = service({ uploads: new Map([[foreignUpload, newId()]]) });
    await expect(
      svc.createDetection(farmerScope(), FARM_A, PLOT_A, detectionBody({ photoUploadId: newId() })),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
    await expect(
      svc.createDetection(farmerScope(), FARM_A, PLOT_A, detectionBody({ photoUploadId: foreignUpload })),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
    expect(calls.insertDetection).toHaveLength(0);
  });

  it('accepts a photoUploadId owned by the caller', async () => {
    const uploadId = newId();
    const { svc } = service({ uploads: new Map([[uploadId, USER_A]]) });
    const detection = await svc.createDetection(
      farmerScope(),
      FARM_A,
      PLOT_A,
      detectionBody({ photoUploadId: uploadId }),
    );
    expect(detection.photoUploadId).toBe(uploadId);
  });

  it('round-trips cropLabel from the Crop/Zone picker onto the created detection', async () => {
    const { svc, calls } = service();
    const detection = await svc.createDetection(
      farmerScope(),
      FARM_A,
      PLOT_A,
      detectionBody({ cropLabel: 'Carrot — Nantes' }),
    );
    expect(calls.insertDetection[0]?.cropLabel).toBe('Carrot — Nantes');
    expect(detection.cropLabel).toBe('Carrot — Nantes');
  });

  it('leaves cropLabel null when the client omits it', async () => {
    const { svc, calls } = service();
    await svc.createDetection(farmerScope(), FARM_A, PLOT_A, detectionBody());
    expect(calls.insertDetection[0]?.cropLabel).toBeNull();
  });
});

describe('pest detections — PATCH status semantics (BR-38: nothing inferred beyond the body)', () => {
  it('status Resolved stamps resolvedAt from the server clock and writes an audit row', async () => {
    const detection = aDetection();
    const { svc, calls, audit } = service({ detections: [detection] });
    const updated = await svc.updateDetection(farmerScope(), FARM_A, PLOT_A, detection.id, {
      status: 'Resolved',
      resolutionEffective: true,
    });
    expect(calls.updateDetection[0]?.patch).toEqual({
      status: 'Resolved',
      resolvedAt: 'NOW',
      resolutionEffective: true,
    });
    expect(updated.resolvedAt).toBe(FIXED_NOW);
    expect(updated.resolutionEffective).toBe(true);
    expect(audit).toEqual(['farmer.pest.detection.update']);
  });

  it('re-sending Resolved on an already-resolved detection does not move resolvedAt', async () => {
    const detection = aDetection({ status: 'Resolved', resolvedAt: '2026-09-01T00:00:00.000Z' });
    const { svc, calls } = service({ detections: [detection] });
    const updated = await svc.updateDetection(farmerScope(), FARM_A, PLOT_A, detection.id, { status: 'Resolved' });
    expect(calls.updateDetection[0]?.patch).not.toHaveProperty('resolvedAt');
    expect(updated.resolvedAt).toBe('2026-09-01T00:00:00.000Z');
  });

  it('reopening (Recurring) clears resolvedAt and resolutionEffective', async () => {
    const detection = aDetection({
      status: 'Resolved',
      resolvedAt: '2026-09-01T00:00:00.000Z',
      resolutionEffective: true,
    });
    const { svc } = service({ detections: [detection] });
    const updated = await svc.updateDetection(farmerScope(), FARM_A, PLOT_A, detection.id, { status: 'Recurring' });
    expect(updated.status).toBe('Recurring');
    expect(updated.resolvedAt).toBeNull();
    expect(updated.resolutionEffective).toBeNull();
  });

  it('resolutionEffective true on a detection that is not Resolved is rejected, not silently resolving it', async () => {
    const detection = aDetection({ status: 'Ongoing' });
    const { svc, calls } = service({ detections: [detection] });
    await expect(
      svc.updateDetection(farmerScope(), FARM_A, PLOT_A, detection.id, { resolutionEffective: true }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
    expect(calls.updateDetection).toHaveLength(0);
  });

  it('resolutionEffective alone on a Resolved detection changes only that field, never status', async () => {
    const detection = aDetection({ status: 'Resolved', resolvedAt: '2026-09-01T00:00:00.000Z' });
    const { svc, calls } = service({ detections: [detection] });
    const updated = await svc.updateDetection(farmerScope(), FARM_A, PLOT_A, detection.id, {
      resolutionEffective: false,
    });
    expect(calls.updateDetection[0]?.patch).toEqual({ resolutionEffective: false });
    expect(updated.status).toBe('Resolved');
    expect(updated.resolvedAt).toBe('2026-09-01T00:00:00.000Z');
  });

  it('a notes-only patch leaves status and resolvedAt untouched; notes: null clears notes', async () => {
    const detection = aDetection({ notes: 'old' });
    const { svc, calls } = service({ detections: [detection] });
    const updated = await svc.updateDetection(farmerScope(), FARM_A, PLOT_A, detection.id, { notes: null });
    expect(calls.updateDetection[0]?.patch).toEqual({ notes: null });
    expect(updated.notes).toBeNull();
    expect(updated.status).toBe('Ongoing');
  });
});

// ---------------------------------------------------------------------------
// pest_treatment_logs
// ---------------------------------------------------------------------------

describe('pest treatment logs', () => {
  it('computes nextApplicationDate = appliedOn + intervalDays when the client omits it', async () => {
    const { svc, calls, audit } = service();
    const log = await svc.createTreatmentLog(
      farmerScope(),
      FARM_A,
      PLOT_A,
      treatmentBody({ appliedOn: '2026-09-21', intervalDays: 12 }),
    );
    expect(calls.insertTreatmentLog[0]?.nextApplicationDate).toBe('2026-10-03');
    expect(log.nextApplicationDate).toBe('2026-10-03');
    expect(audit).toEqual(['farmer.pest.treatment_log.create']);
  });

  it('an explicit client nextApplicationDate wins over the computed one', async () => {
    const { svc, calls } = service();
    await svc.createTreatmentLog(
      farmerScope(),
      FARM_A,
      PLOT_A,
      treatmentBody({ appliedOn: '2026-09-21', intervalDays: 12, nextApplicationDate: '2026-10-10' }),
    );
    expect(calls.insertTreatmentLog[0]?.nextApplicationDate).toBe('2026-10-10');
  });

  it('with no intervalDays and no nextApplicationDate, nothing is invented (null)', async () => {
    const { svc, calls } = service();
    await svc.createTreatmentLog(farmerScope(), FARM_A, PLOT_A, treatmentBody());
    expect(calls.insertTreatmentLog[0]?.nextApplicationDate).toBeNull();
    expect(calls.insertTreatmentLog[0]?.intervalDays).toBeNull();
  });

  it('rejects a detectionId that belongs to a different plot, without writing', async () => {
    const foreign = aDetection({ plotId: OTHER_PLOT });
    const { svc, calls } = service({ detections: [foreign] });
    await expect(
      svc.createTreatmentLog(farmerScope(), FARM_A, PLOT_A, treatmentBody({ detectionId: foreign.id })),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
    expect(calls.insertTreatmentLog).toHaveLength(0);
  });

  it('rejects an unknown pestLibraryId and an upload the caller does not own', async () => {
    const foreignUpload = newId();
    const { svc, calls } = service({ uploads: new Map([[foreignUpload, newId()]]) });
    await expect(
      svc.createTreatmentLog(farmerScope(), FARM_A, PLOT_A, treatmentBody({ pestLibraryId: newId() })),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    await expect(
      svc.createTreatmentLog(farmerScope(), FARM_A, PLOT_A, treatmentBody({ photoUploadId: foreignUpload })),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(calls.insertTreatmentLog).toHaveLength(0);
  });

  it('links a log to a detection on the same plot', async () => {
    const detection = aDetection();
    const { svc } = service({ detections: [detection] });
    const log = await svc.createTreatmentLog(
      farmerScope(),
      FARM_A,
      PLOT_A,
      treatmentBody({ detectionId: detection.id }),
    );
    expect(log.detectionId).toBe(detection.id);
  });
});

// ---------------------------------------------------------------------------
// pest_treatment_reminders
// ---------------------------------------------------------------------------

describe('pest treatment reminders', () => {
  it('creates a farmer-typed reminder and writes an audit row', async () => {
    const { svc, calls, audit } = service();
    const reminder = await svc.createReminder(farmerScope(), FARM_A, PLOT_A, reminderBody());
    expect(reminder.status).toBe('Upcoming');
    expect(calls.insertReminder[0]?.repeatInterval).toBe('ONE_TIME');
    expect(audit).toEqual(['farmer.pest.reminder.create']);
  });

  it('rejects a detectionId on a different plot', async () => {
    const foreign = aDetection({ plotId: OTHER_PLOT });
    const { svc, calls } = service({ detections: [foreign] });
    await expect(
      svc.createReminder(farmerScope(), FARM_A, PLOT_A, reminderBody({ detectionId: foreign.id })),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
    expect(calls.insertReminder).toHaveLength(0);
  });

  it('Completed stamps completedAt from the server clock; re-sending Completed keeps it', async () => {
    const reminder = aReminder();
    const { svc, calls, audit } = service({ reminders: [reminder] });

    const done = await svc.updateReminder(farmerScope(), FARM_A, PLOT_A, reminder.id, { status: 'Completed' });
    expect(calls.updateReminder[0]?.patch).toEqual({ status: 'Completed', completedAt: 'NOW' });
    expect(done.completedAt).toBe(FIXED_NOW);

    await svc.updateReminder(farmerScope(), FARM_A, PLOT_A, reminder.id, { status: 'Completed' });
    expect(calls.updateReminder[1]?.patch).toEqual({ status: 'Completed' });
    expect(audit).toEqual(['farmer.pest.reminder.update', 'farmer.pest.reminder.update']);
  });

  it('reverting to Upcoming clears completedAt', async () => {
    const reminder = aReminder({ status: 'Completed', completedAt: '2026-09-25T00:00:00.000Z' });
    const { svc } = service({ reminders: [reminder] });
    const reverted = await svc.updateReminder(farmerScope(), FARM_A, PLOT_A, reminder.id, { status: 'Upcoming' });
    expect(reverted.status).toBe('Upcoming');
    expect(reverted.completedAt).toBeNull();
  });

  it('a title/dueDate-only patch does not touch status or completedAt', async () => {
    const reminder = aReminder();
    const { svc, calls } = service({ reminders: [reminder] });
    await svc.updateReminder(farmerScope(), FARM_A, PLOT_A, reminder.id, { dueDate: '2026-10-05' });
    expect(calls.updateReminder[0]?.patch).toEqual({ dueDate: '2026-10-05' });
  });

  it('a reminder id on a different plot 404s without writing', async () => {
    const reminder = aReminder({ plotId: OTHER_PLOT });
    const { svc, calls } = service({ reminders: [reminder] });
    await expectNotFound(
      svc.updateReminder(farmerScope(), FARM_A, PLOT_A, reminder.id, { status: 'Completed' }),
    );
    expect(calls.updateReminder).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// analytics summary (BR-38: on-demand read-only aggregation, not advice)
// ---------------------------------------------------------------------------

describe('pest analytics summary', () => {
  it('buckets detections by season and passes crop/treatment aggregates through, all scoped to the farm', async () => {
    const { svc, calls, audit } = service({
      monthCounts: [
        { month: 6, count: 2 },
        { month: 3, count: 1 },
      ],
      cropCounts: [{ crop: 'Carrot', count: 3 }],
      tallies: [{ treatment: 'Neem oil', timesUsed: 4, timesEffective: 3 }],
    });

    const summary = await svc.getAnalyticsSummary(farmerScope(), FARM_A);

    expect(summary).toEqual({
      detectionsBySeason: [
        { season: 'Summer', count: 1 },
        { season: 'Monsoon', count: 2 },
        { season: 'Winter', count: 0 },
      ],
      mostAffectedCrops: [{ crop: 'Carrot', count: 3 }],
      treatmentEffectiveness: [{ treatment: 'Neem oil', timesUsed: 4, timesEffective: 3 }],
    });
    expect(calls.analyticsFarmIds).toEqual([FARM_A, FARM_A, FARM_A]);
    expect(audit).toHaveLength(0); // a read writes nothing
  });
});

// ---------------------------------------------------------------------------
// integration — real Postgres round-trip, one per resource
// ---------------------------------------------------------------------------

const PEST_TABLES = [
  'plots',
  'farm_crops',
  'pest_library',
  'pest_detections',
  'pest_treatment_logs',
  'pest_treatment_reminders',
  'weather_risk_notes',
];

async function pestTablesReady(): Promise<boolean> {
  const ready = await Promise.all(PEST_TABLES.map(databaseReady));
  if (ready.some((r) => !r)) {
    console.warn('[skip] pest tables not reachable — run `docker compose up -d && pnpm db:migrate && pnpm db:seed`');
    return false;
  }
  return true;
}

/**
 * Runs `fn` against a real client inside a transaction that always rolls
 * back, with a freshly-created farmer -> farm -> plot to own the data.
 */
async function withFarmerFixture(
  fn: (ctx: {
    client: Executor;
    scope: ResolvedScope;
    farmId: string;
    plotId: string;
    svc: ReturnType<typeof createPestService>;
  }) => Promise<void>,
): Promise<void> {
  const { pool } = await import('../../db/pool.js');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = newId();
    const mobile = `+9197${Math.floor(10000000 + Math.random() * 89999999)}`;
    await client.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, $3, 'FARMER', 'ACTIVE')`,
      [userId, mobile, 'Pest Integration Farmer'],
    );
    const farmerId = newId();
    await client.query(`INSERT INTO farmers (id, user_id, tohfa_farmer_id) VALUES ($1, $2, $3)`, [
      farmerId,
      userId,
      `TOHFA-PEST-${farmerId.slice(0, 8)}`,
    ]);
    const farmId = newId();
    await client.query(
      `INSERT INTO farms (id, farmer_id, name, district) VALUES ($1, $2, 'Pest Farm', 'The Nilgiris')`,
      [farmId, farmerId],
    );
    const plotId = newId();
    await client.query(`INSERT INTO plots (id, farm_id, name) VALUES ($1, $2, 'Zone A')`, [plotId, farmId]);

    const scope = farmerScope({ farmerId, userId });
    const svc = createPestService({ db: client, runTx: async (inner) => inner(client) });
    await fn({ client, scope, farmId, plotId, svc });
  } finally {
    await client.query('ROLLBACK');
    client.release();
  }
}

describeIfDatabase('pestService (integration against PostgreSQL)', () => {
  it('pest_library + weather_risk_notes: seeded catalog filters by q and crop; only currently-valid notes return', async () => {
    if (!(await pestTablesReady())) return;
    await withFarmerFixture(async ({ client, svc }) => {
      const all = await svc.listPestLibrary({});
      expect(all.length, 'db/seed/006_pest_library_seed.sql must be applied').toBeGreaterThan(0);
      const first = all[0]!;
      const byName = await svc.listPestLibrary({ q: first.name.slice(0, 4).toLowerCase() });
      expect(byName.map((e) => e.id)).toContain(first.id);
      const hostCrop = all.find((e) => e.crops.length > 0)?.crops[0];
      if (hostCrop !== undefined) {
        const byCrop = await svc.listPestLibrary({ crop: hostCrop.toUpperCase() });
        expect(byCrop.every((e) => e.crops.some((c) => c.toLowerCase() === hostCrop.toLowerCase()))).toBe(true);
      }
      expect((await svc.getPestLibraryEntry(first.id)).name).toBe(first.name);

      const current = newId();
      const expired = newId();
      await client.query(
        `INSERT INTO weather_risk_notes (id, region, note, valid_from, valid_until)
         VALUES ($1, 'Test', 'current', CURRENT_DATE - 1, NULL),
                ($2, 'Test', 'expired', NULL, CURRENT_DATE - 1)`,
        [current, expired],
      );
      const ids = (await svc.listWeatherRiskNotes()).map((n) => n.id);
      expect(ids).toContain(current);
      expect(ids).not.toContain(expired);
    });
  });

  it('pest_detections: create -> resolve -> reopen round-trips with DB-stamped resolved_at and an audit row', async () => {
    if (!(await pestTablesReady())) return;
    await withFarmerFixture(async ({ client, scope, farmId, plotId, svc }) => {
      const created = await svc.createDetection(scope, farmId, plotId, detectionBody());
      expect(created.status).toBe('Ongoing');
      expect(created.detectedOn).toBe('2026-09-20');

      const resolved = await svc.updateDetection(scope, farmId, plotId, created.id, {
        status: 'Resolved',
        resolutionEffective: true,
      });
      expect(resolved.resolvedAt).not.toBeNull();
      expect(resolved.resolutionEffective).toBe(true);

      const reopened = await svc.updateDetection(scope, farmId, plotId, created.id, { status: 'Recurring' });
      expect(reopened.resolvedAt).toBeNull();
      expect(reopened.resolutionEffective).toBeNull();

      const audit = await client.query<{ n: number }>(
        `SELECT COUNT(*)::int AS n FROM audit_log WHERE entity_id = $1 AND action_code LIKE 'farmer.pest.detection.%'`,
        [created.id],
      );
      expect(audit.rows[0]?.n).toBe(3);

      // BR-36: another farmer's scope sees a 404 for the same plot.
      await expectNotFound(svc.listDetections(farmerScope({ farmerId: newId() }), farmId, plotId));
    });
  });

  it('pest_treatment_logs: computes next_application_date and persists the detection link', async () => {
    if (!(await pestTablesReady())) return;
    await withFarmerFixture(async ({ scope, farmId, plotId, svc }) => {
      const detection = await svc.createDetection(scope, farmId, plotId, detectionBody());
      const log = await svc.createTreatmentLog(
        scope,
        farmId,
        plotId,
        treatmentBody({ detectionId: detection.id, appliedOn: '2026-09-21', intervalDays: 12, phiDays: 5 }),
      );
      expect(log.nextApplicationDate).toBe('2026-10-03');
      expect(log.intervalDays).toBe(12);
      const listed = await svc.listTreatmentLogs(scope, farmId, plotId);
      expect(listed.map((l) => l.id)).toEqual([log.id]);
    });
  });

  it('pest_treatment_reminders: create -> complete -> revert round-trips completed_at', async () => {
    if (!(await pestTablesReady())) return;
    await withFarmerFixture(async ({ scope, farmId, plotId, svc }) => {
      const reminder = await svc.createReminder(scope, farmId, plotId, reminderBody({ repeatInterval: 'WEEKLY' }));
      expect(reminder.repeatInterval).toBe('WEEKLY');
      const done = await svc.updateReminder(scope, farmId, plotId, reminder.id, { status: 'Completed' });
      expect(done.completedAt).not.toBeNull();
      const reverted = await svc.updateReminder(scope, farmId, plotId, reminder.id, { status: 'Upcoming' });
      expect(reverted.completedAt).toBeNull();
      expect((await svc.listReminders(scope, farmId, plotId)).map((r) => r.id)).toEqual([reminder.id]);
    });
  });

  it('pest analytics: aggregates by season, crop and treatment effectiveness over the farm\'s own rows', async () => {
    if (!(await pestTablesReady())) return;
    await withFarmerFixture(async ({ client, scope, farmId, plotId, svc }) => {
      const crop = await client.query<{ id: string; name: string }>(
        `SELECT id, name FROM crop_master WHERE deleted_at IS NULL ORDER BY name LIMIT 1`,
      );
      const cropRow = crop.rows[0];
      expect(cropRow, 'db/seed/001_reference.sql must seed crop_master').toBeDefined();
      const farmCropId = newId();
      await client.query(`INSERT INTO farm_crops (id, plot_id, crop_id) VALUES ($1, $2, $3)`, [
        farmCropId,
        plotId,
        cropRow!.id,
      ]);

      const monsoon = await svc.createDetection(
        scope,
        farmId,
        plotId,
        detectionBody({ detectedOn: '2026-07-10', farmCropId }),
      );
      await svc.createDetection(scope, farmId, plotId, detectionBody({ detectedOn: '2026-01-05' }));
      await svc.updateDetection(scope, farmId, plotId, monsoon.id, { status: 'Resolved', resolutionEffective: true });
      await svc.createTreatmentLog(scope, farmId, plotId, treatmentBody({ treatment: 'Neem oil', detectionId: monsoon.id }));
      await svc.createTreatmentLog(scope, farmId, plotId, treatmentBody({ treatment: 'Neem oil' }));

      const summary = await svc.getAnalyticsSummary(scope, farmId);
      expect(summary.detectionsBySeason).toEqual([
        { season: 'Summer', count: 0 },
        { season: 'Monsoon', count: 1 },
        { season: 'Winter', count: 1 },
      ]);
      // The untagged January detection is excluded, not bucketed as "Unknown".
      expect(summary.mostAffectedCrops).toEqual([{ crop: cropRow!.name, count: 1 }]);
      expect(summary.treatmentEffectiveness).toEqual([{ treatment: 'Neem oil', timesUsed: 2, timesEffective: 1 }]);
    });
  });
});
