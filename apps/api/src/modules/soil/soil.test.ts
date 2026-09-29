/**
 * Two layers of test, always (see apps/api/CLAUDE.md):
 *
 *  1. SCHEMA + SERVICE tests with a fake repo. Fast, no I/O. This is where
 *     BR-40 (classification bands come from system_config, one shared
 *     function, consistent across endpoints) and BR-36 (own-data ownership:
 *     a plot belonging to a different farmer 404s, never 403) are asserted.
 *
 *  2. ONE integration test against a real pool, proving the six tables (five
 *     from 0021 plus cover_crop_windows from 0022) and the seeded
 *     system_config classification bands actually round-trip through
 *     Postgres. Wrapped in a transaction that rolls back, so it leaves no
 *     residue.
 */
import { describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { AppError } from '../../http/problem.js';
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { classifySoilMetric, createSoilService } from './soil.service.js';
import type {
  ClassificationBands,
  CoverCropWindow,
  CropRotationEntry,
  ErosionNote,
  InsertCoverCropWindowParams,
  InsertErosionNoteParams,
  InsertSoilAmendmentParams,
  InsertSoilMoistureParams,
  InsertSoilTestParams,
  OwnedPlotArgs,
  SoilAmendment,
  SoilAmendmentPatch,
  SoilMetricKey,
  SoilMoistureObservation,
  SoilRepo,
  SoilTestRecord,
} from './soil.repo.js';
import {
  createCoverCropWindowBody,
  createErosionNoteBody,
  createSoilAmendmentBody,
  createSoilMoistureBody,
  createSoilTestBody,
  putCropRotationBody,
} from './soil.schema.js';
import { IDS, aScope, databaseReady, describeIfDatabase, newId } from '../../test/factories.js';

// ---------------------------------------------------------------------------
// fixtures
// ---------------------------------------------------------------------------

const FARMER_A = IDS.farmer;
const FARMER_B = newId();
const USER_A = IDS.userFarmer;
const FARM_A = newId();
const PLOT_A = newId();

function farmerScope(overrides: Partial<ResolvedScope> = {}): ResolvedScope {
  return aScope({
    level: ScopeLevel.OWN,
    permission: 'farmer.soil.manage_own',
    roleCode: RoleCode.FARMER,
    userId: USER_A,
    farmerId: FARMER_A,
    ...overrides,
  });
}

/** Mirrors farms.test.ts's helper for a FARMER scope with no farmerId at all. */
function farmerScopeWithoutFarmerId(): ResolvedScope {
  const scope = farmerScope();
  const { farmerId: _farmerId, ...rest } = scope;
  return rest as ResolvedScope;
}

/** Realistic bands matching db/seed/001_reference.sql, for real arithmetic in tests. */
const BANDS: Record<SoilMetricKey, ClassificationBands> = {
  organicCarbon: { low: 0.51, high: 0.75, belowLabel: 'Low', insideLabel: 'Medium', aboveLabel: 'High' },
  ph: { low: 6.0, high: 7.5, belowLabel: 'Acidic', insideLabel: 'Good', aboveLabel: 'Alkaline' },
  ec: { low: 0.0, high: 1.0, belowLabel: 'Good', insideLabel: 'Good', aboveLabel: 'High' },
  tds: { low: 0, high: 500, belowLabel: 'Good', insideLabel: 'Good', aboveLabel: 'High' },
  nitrogen: { low: 280, high: 560, belowLabel: 'Low', insideLabel: 'Good', aboveLabel: 'High' },
  phosphorus: { low: 10, high: 25, belowLabel: 'Low', insideLabel: 'Good', aboveLabel: 'High' },
  potassium: { low: 110, high: 280, belowLabel: 'Low', insideLabel: 'Good', aboveLabel: 'High' },
};

function aSoilTest(overrides: Partial<SoilTestRecord> = {}): SoilTestRecord {
  return {
    id: newId(),
    plotId: PLOT_A,
    testDate: '2026-04-01',
    nextDueDate: '2026-10-01',
    organicCarbonPct: 0.6,
    ph: 6.8,
    ecDsPerM: 0.5,
    tdsPpm: 300,
    nitrogenKgPerHa: 400,
    phosphorusKgPerHa: 18,
    potassiumKgPerHa: 200,
    limeStatus: 'Harmless',
    labReportUploadId: null,
    createdAt: '2026-04-01T06:00:00.000Z',
    updatedAt: null,
    ...overrides,
  };
}

function aSoilAmendment(overrides: Partial<SoilAmendment> = {}): SoilAmendment {
  return {
    id: newId(),
    plotId: PLOT_A,
    amendmentType: 'Compost',
    quantityKg: 50,
    appliedDate: '2026-04-01',
    notes: null,
    createdAt: '2026-04-01T06:00:00.000Z',
    updatedAt: null,
    ...overrides,
  };
}

/** Executor good enough for writeAuditLog's raw INSERT (bypasses the fake repo). */
const auditDb: Executor = {
  query: async () => ({ rows: [{ id: newId() }], rowCount: 1 }) as never,
};

interface FakeRepoOptions {
  /** Plots the fake DB considers to exist, each tagged with its true owning farmer. */
  ownedPlots?: OwnedPlotArgs[];
  /** uploadId -> owning userId (or null for an owner-less upload); absent key = does not exist. */
  uploads?: Map<string, string | null>;
  bands?: Record<SoilMetricKey, ClassificationBands>;
  soilTests?: SoilTestRecord[];
  soilAmendments?: SoilAmendment[];
  soilMoisture?: SoilMoistureObservation[];
  erosionNotes?: ErosionNote[];
  cropRotation?: CropRotationEntry[];
  coverCropWindows?: CoverCropWindow[];
}

interface RepoCalls {
  insertSoilTest: InsertSoilTestParams[];
  insertSoilAmendment: InsertSoilAmendmentParams[];
  updateSoilAmendment: Array<{ plotId: string; id: string; patch: SoilAmendmentPatch }>;
  deleteSoilAmendment: Array<{ plotId: string; id: string }>;
  insertSoilMoisture: InsertSoilMoistureParams[];
  insertErosionNote: InsertErosionNoteParams[];
  replaceCropRotationSequence: number;
  insertCoverCropWindow: InsertCoverCropWindowParams[];
}

function fakeRepo(options: FakeRepoOptions = {}): { repo: SoilRepo; calls: RepoCalls } {
  const ownedPlots = options.ownedPlots ?? [{ farmerId: FARMER_A, farmId: FARM_A, plotId: PLOT_A }];
  const uploads = options.uploads ?? new Map<string, string | null>();
  const bands = options.bands ?? BANDS;
  const soilTests = new Map(options.soilTests?.map((r) => [r.id, r]) ?? []);
  const soilAmendments = new Map(options.soilAmendments?.map((r) => [r.id, r]) ?? []);
  const soilMoisture = [...(options.soilMoisture ?? [])];
  const erosionNotes = [...(options.erosionNotes ?? [])];
  let cropRotation = [...(options.cropRotation ?? [])];
  const coverCropWindows = [...(options.coverCropWindows ?? [])];

  const calls: RepoCalls = {
    insertSoilTest: [],
    insertSoilAmendment: [],
    updateSoilAmendment: [],
    deleteSoilAmendment: [],
    insertSoilMoisture: [],
    insertErosionNote: [],
    replaceCropRotationSequence: 0,
    insertCoverCropWindow: [],
  };

  const repo: SoilRepo = {
    async findOwnedPlotId(_db, args) {
      const match = ownedPlots.find(
        (p) => p.plotId === args.plotId && p.farmId === args.farmId && p.farmerId === args.farmerId,
      );
      return match?.plotId ?? null;
    },

    async findOwnedFarmSummary(_db, farmId, farmerId) {
      const match = ownedPlots.find((p) => p.farmId === farmId && p.farmerId === farmerId);
      if (!match) return null;
      return {
        farmId,
        farmName: 'Green Meadows Farm',
        district: 'The Nilgiris',
        taluk: 'Ooty',
        village: 'Ketti',
        totalAcres: 5.5,
        farmerId,
        farmerName: 'Raman K',
        farmerMobile: '+919876543210',
        tohfaFarmerId: 'TF-2026-001',
      };
    },

    async listPlotsForFarm(_db, farmId) {
      const matches = ownedPlots.filter((p) => p.farmId === farmId);
      return matches.map((p) => ({
        id: p.plotId,
        farmId: p.farmId,
        name: 'Zone A',
        areaAcres: 2.0,
        soilType: 'Loamy',
        sunExposure: 'Full Sun',
        irrigationType: 'Drip',
      }));
    },

    async findUploadOwner(_db, uploadId) {
      if (!uploads.has(uploadId)) return undefined;
      return uploads.get(uploadId) ?? null;
    },

    async getClassificationBands() {
      return bands;
    },

    async listSoilTests(_db, plotId) {
      return [...soilTests.values()]
        .filter((r) => r.plotId === plotId)
        .sort((a, b) => (a.testDate < b.testDate ? 1 : -1));
    },
    async findSoilTestById(_db, plotId, testId) {
      const record = soilTests.get(testId);
      return record !== undefined && record.plotId === plotId ? record : null;
    },
    async insertSoilTest(_db, params) {
      calls.insertSoilTest.push(params);
      const record = aSoilTest({ ...params, id: newId() });
      soilTests.set(record.id, record);
      return record;
    },

    async listSoilAmendments(_db, plotId) {
      return [...soilAmendments.values()].filter((r) => r.plotId === plotId);
    },
    async findSoilAmendmentById(_db, plotId, id) {
      const amendment = soilAmendments.get(id);
      return amendment !== undefined && amendment.plotId === plotId ? amendment : null;
    },
    async insertSoilAmendment(_db, params) {
      calls.insertSoilAmendment.push(params);
      const amendment = aSoilAmendment({ ...params, id: newId(), notes: params.notes });
      soilAmendments.set(amendment.id, amendment);
      return amendment;
    },
    async updateSoilAmendment(_db, plotId, id, patch) {
      calls.updateSoilAmendment.push({ plotId, id, patch });
      const existing = soilAmendments.get(id);
      if (existing === undefined || existing.plotId !== plotId) return null;
      const updated = { ...existing, ...patch };
      soilAmendments.set(id, updated);
      return updated;
    },
    async deleteSoilAmendment(_db, plotId, id) {
      calls.deleteSoilAmendment.push({ plotId, id });
      const existing = soilAmendments.get(id);
      if (existing === undefined || existing.plotId !== plotId) return false;
      soilAmendments.delete(id);
      return true;
    },

    async listSoilMoisture(_db, plotId) {
      return soilMoisture.filter((r) => r.plotId === plotId);
    },
    async insertSoilMoisture(_db, params) {
      calls.insertSoilMoisture.push(params);
      const observation: SoilMoistureObservation = {
        id: newId(),
        plotId: params.plotId,
        level: params.level,
        observedAt: params.observedAt ?? '2026-04-01T06:00:00.000Z',
        observedBy: params.observedBy,
        createdAt: '2026-04-01T06:00:00.000Z',
        updatedAt: null,
      };
      soilMoisture.push(observation);
      return observation;
    },

    async listErosionNotes(_db, plotId) {
      return erosionNotes.filter((r) => r.plotId === plotId);
    },
    async insertErosionNote(_db, params) {
      calls.insertErosionNote.push(params);
      const note: ErosionNote = {
        id: newId(),
        plotId: params.plotId,
        riskLevel: params.riskLevel,
        practiceNotes: params.practiceNotes,
        loggedAt: params.loggedAt ?? '2026-04-01T06:00:00.000Z',
        createdAt: '2026-04-01T06:00:00.000Z',
        updatedAt: null,
      };
      erosionNotes.push(note);
      return note;
    },

    async listCropRotation(_db, plotId) {
      return cropRotation.filter((r) => r.plotId === plotId).sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    },
    async replaceCropRotationSequence(_tx, plotId, entries) {
      calls.replaceCropRotationSequence += 1;
      cropRotation = cropRotation.filter((r) => r.plotId !== plotId);
      const inserted = entries.map((entry) => ({
        id: newId(),
        plotId,
        sequenceOrder: entry.sequenceOrder,
        cropName: entry.cropName,
        plannedDate: entry.plannedDate,
        status: entry.status,
        createdAt: '2026-04-01T06:00:00.000Z',
        updatedAt: null,
      }));
      cropRotation.push(...inserted);
      return [...inserted].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    },

    async findCurrentCoverCropWindow(_db, plotId) {
      const windows = coverCropWindows.filter((w) => w.plotId === plotId);
      return windows[windows.length - 1] ?? null;
    },
    async insertCoverCropWindow(_db, params) {
      calls.insertCoverCropWindow.push(params);
      const window: CoverCropWindow = {
        id: newId(),
        plotId: params.plotId,
        coverCropType: params.coverCropType,
        windowStart: params.windowStart,
        windowEnd: params.windowEnd,
        createdAt: '2026-04-01T06:00:00.000Z',
        updatedAt: null,
      };
      coverCropWindows.push(window);
      return window;
    },
  };

  return { repo, calls };
}

function service(options: FakeRepoOptions = {}) {
  const { repo, calls } = fakeRepo(options);
  const svc = createSoilService({
    repo,
    db: auditDb,
    runTx: async (fn) => fn(auditDb),
  });
  return { svc, calls };
}

// ---------------------------------------------------------------------------
// schema validation
// ---------------------------------------------------------------------------

describe('soil.schema validation', () => {
  it('createSoilTestBody requires the mandatory readings and rejects unknown fields (.strict())', () => {
    expect(createSoilTestBody.safeParse({}).success).toBe(false);
    const valid = {
      testDate: '2026-04-01',
      nextDueDate: '2026-10-01',
      organicCarbonPct: 0.6,
      ph: 6.8,
      ecDsPerM: 0.5,
    };
    expect(createSoilTestBody.safeParse(valid).success).toBe(true);
    expect(createSoilTestBody.safeParse({ ...valid, sneaky: 'x' }).success).toBe(false);
  });

  it('createSoilTestBody rejects an out-of-range pH and a bad date format', () => {
    const base = { organicCarbonPct: 0.6, ph: 6.8, ecDsPerM: 0.5 };
    expect(
      createSoilTestBody.safeParse({ ...base, testDate: '01-04-2026', nextDueDate: '2026-10-01' }).success,
    ).toBe(false);
    expect(
      createSoilTestBody.safeParse({
        ...base,
        ph: 15,
        testDate: '2026-04-01',
        nextDueDate: '2026-10-01',
      }).success,
    ).toBe(false);
  });

  it('createSoilAmendmentBody requires a positive quantity', () => {
    expect(
      createSoilAmendmentBody.safeParse({
        amendmentType: 'Compost',
        quantityKg: 0,
        appliedDate: '2026-04-01',
      }).success,
    ).toBe(false);
  });

  it('createSoilMoistureBody only accepts the mobile-constrained level values', () => {
    expect(createSoilMoistureBody.safeParse({ level: 'Dry' }).success).toBe(true);
    expect(createSoilMoistureBody.safeParse({ level: 'Damp' }).success).toBe(false);
  });

  it('createErosionNoteBody documents risk as a self-assessment enum', () => {
    expect(createErosionNoteBody.safeParse({ riskLevel: 'Moderate Risk' }).success).toBe(true);
    expect(createErosionNoteBody.safeParse({ riskLevel: 'Severe' }).success).toBe(false);
  });

  it('putCropRotationBody rejects a repeated sequenceOrder', () => {
    const result = putCropRotationBody.safeParse({
      sequence: [
        { sequenceOrder: 1, cropName: 'Carrot', status: 'CURRENT' },
        { sequenceOrder: 1, cropName: 'Beans', status: 'NEXT' },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('putCropRotationBody accepts an empty sequence (clearing the plan)', () => {
    expect(putCropRotationBody.safeParse({ sequence: [] }).success).toBe(true);
  });

  it('createCoverCropWindowBody rejects windowEnd before windowStart', () => {
    const result = createCoverCropWindowBody.safeParse({
      coverCropType: 'Sunn hemp',
      windowStart: '2026-06-01',
      windowEnd: '2026-05-01',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// BR-40 — classification bands come from system_config, one shared function
// ---------------------------------------------------------------------------

describe('BR-40 — classifySoilMetric', () => {
  it('BR-40a: below / inside / above band arithmetic', () => {
    expect(classifySoilMetric('ph', 5.9, BANDS.ph)).toBe('Acidic');
    expect(classifySoilMetric('ph', 6.0, BANDS.ph)).toBe('Good'); // inclusive boundary
    expect(classifySoilMetric('ph', 7.0, BANDS.ph)).toBe('Good');
    expect(classifySoilMetric('ph', 7.6, BANDS.ph)).toBe('Alkaline');
  });

  it('BR-40a: the SAME reading produces a DIFFERENT label after a system_config band changes, with no deploy', async () => {
    const record = aSoilTest({ ph: 6.9 });
    const before = await service({ soilTests: [record], bands: BANDS });
    const beforeResult = await before.svc.getSoilTest(farmerScope(), FARM_A, PLOT_A, record.id);
    expect(beforeResult.phLabel).toBe('Good');

    // Same record, same code — only the config value changes (simulating an
    // in-place system_config UPDATE, e.g. narrowing the "Good" ph window).
    const narrowedBands: Record<SoilMetricKey, ClassificationBands> = {
      ...BANDS,
      ph: { ...BANDS.ph, high: 6.5 },
    };
    const after = await service({ soilTests: [record], bands: narrowedBands });
    const afterResult = await after.svc.getSoilTest(farmerScope(), FARM_A, PLOT_A, record.id);
    expect(afterResult.phLabel).toBe('Alkaline');
  });

  it('BR-40b: the same reading produces the same label across list AND detail', async () => {
    const record = aSoilTest({ ph: 8.1, organicCarbonPct: 0.4 });
    const { svc } = service({ soilTests: [record] });

    const [listed] = await svc.listSoilTests(farmerScope(), FARM_A, PLOT_A);
    const detail = await svc.getSoilTest(farmerScope(), FARM_A, PLOT_A, record.id);

    expect(listed?.phLabel).toBe('Alkaline');
    expect(listed?.organicCarbonLabel).toBe('Low');
    expect(detail.phLabel).toBe(listed?.phLabel);
    expect(detail.organicCarbonLabel).toBe(listed?.organicCarbonLabel);
  });

  it('nullable readings (tds/N/P/K) produce a null label instead of classifying null as a number', async () => {
    const record = aSoilTest({ tdsPpm: null, nitrogenKgPerHa: null, phosphorusKgPerHa: null, potassiumKgPerHa: null });
    const { svc } = service({ soilTests: [record] });

    const detail = await svc.getSoilTest(farmerScope(), FARM_A, PLOT_A, record.id);

    expect(detail.tdsLabel).toBeNull();
    expect(detail.nitrogenLabel).toBeNull();
    expect(detail.phosphorusLabel).toBeNull();
    expect(detail.potassiumLabel).toBeNull();
    // ph/organicCarbon/ec are NOT NULL columns, so those are always classified.
    expect(detail.phLabel).not.toBeNull();
  });

  it('throws on malformed bands (low > high) rather than silently misclassifying', () => {
    expect(() => classifySoilMetric('ph', 7, { low: 8, high: 6, belowLabel: 'a', insideLabel: 'b', aboveLabel: 'c' })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// BR-36 — own-data ownership (plot must belong to the caller's own farm)
// ---------------------------------------------------------------------------

describe('BR-36 — plot ownership', () => {
  it('a plot on a farm belonging to another farmer 404s, never 403, and never leaks', async () => {
    const { svc } = service({ ownedPlots: [{ farmerId: FARMER_B, farmId: FARM_A, plotId: PLOT_A }] });

    const error = await svc.listSoilTests(farmerScope(), FARM_A, PLOT_A).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe('NOT_FOUND');
    expect((error as AppError).status).toBe(404);
  });

  it('a plot id that does not exist at all 404s the same way, and no write is attempted', async () => {
    const { svc, calls } = service({ ownedPlots: [] });

    await expect(
      svc.createSoilAmendment(
        farmerScope(),
        FARM_A,
        PLOT_A,
        createSoilAmendmentBody.parse({ amendmentType: 'Lime', quantityKg: 10, appliedDate: '2026-04-01' }),
      ),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(calls.insertSoilAmendment).toHaveLength(0);
  });

  it('an own-scoped FARMER with no farmerId at all 404s rather than querying with an undefined owner', async () => {
    const { svc } = service();
    await expect(svc.listSoilTests(farmerScopeWithoutFarmerId(), FARM_A, PLOT_A)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

// ---------------------------------------------------------------------------
// soil_test_records CRUD + labReportUploadId ownership
// ---------------------------------------------------------------------------

describe('soil tests', () => {
  it('creates a record under the given plot and returns it with classification labels', async () => {
    const { svc, calls } = service();
    const body = createSoilTestBody.parse({
      testDate: '2026-04-01',
      nextDueDate: '2026-10-01',
      organicCarbonPct: 0.9,
      ph: 5.0,
      ecDsPerM: 1.5,
    });

    const record = await svc.createSoilTest(farmerScope(), FARM_A, PLOT_A, body);

    expect(calls.insertSoilTest[0]?.plotId).toBe(PLOT_A);
    expect(record.organicCarbonLabel).toBe('High');
    expect(record.phLabel).toBe('Acidic');
    expect(record.ecLabel).toBe('High');
  });

  it('rejects a labReportUploadId that does not exist', async () => {
    const { svc } = service({ uploads: new Map() });
    const body = createSoilTestBody.parse({
      testDate: '2026-04-01',
      nextDueDate: '2026-10-01',
      organicCarbonPct: 0.6,
      ph: 6.8,
      ecDsPerM: 0.5,
      labReportUploadId: newId(),
    });

    await expect(svc.createSoilTest(farmerScope(), FARM_A, PLOT_A, body)).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      status: 422,
    });
  });

  it('rejects a labReportUploadId owned by someone else', async () => {
    const uploadId = newId();
    const { svc } = service({ uploads: new Map([[uploadId, newId()]]) });
    const body = createSoilTestBody.parse({
      testDate: '2026-04-01',
      nextDueDate: '2026-10-01',
      organicCarbonPct: 0.6,
      ph: 6.8,
      ecDsPerM: 0.5,
      labReportUploadId: uploadId,
    });

    await expect(svc.createSoilTest(farmerScope(), FARM_A, PLOT_A, body)).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      status: 422,
    });
  });

  it('accepts a labReportUploadId owned by the caller', async () => {
    const uploadId = newId();
    const { svc } = service({ uploads: new Map([[uploadId, USER_A]]) });
    const body = createSoilTestBody.parse({
      testDate: '2026-04-01',
      nextDueDate: '2026-10-01',
      organicCarbonPct: 0.6,
      ph: 6.8,
      ecDsPerM: 0.5,
      labReportUploadId: uploadId,
    });

    const record = await svc.createSoilTest(farmerScope(), FARM_A, PLOT_A, body);
    expect(record.labReportUploadId).toBe(uploadId);
  });

  it('getSoilTest 404s for a test id that exists on a different plot', async () => {
    const record = aSoilTest({ plotId: newId() });
    const { svc } = service({ soilTests: [record] });

    await expect(svc.getSoilTest(farmerScope(), FARM_A, PLOT_A, record.id)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('lists newest test_date first', async () => {
    const older = aSoilTest({ testDate: '2026-01-01' });
    const newer = aSoilTest({ testDate: '2026-06-01' });
    const { svc } = service({ soilTests: [older, newer] });

    const items = await svc.listSoilTests(farmerScope(), FARM_A, PLOT_A);
    expect(items.map((r) => r.id)).toEqual([newer.id, older.id]);
  });
});

// ---------------------------------------------------------------------------
// health-summary — pure arithmetic (BR-38 boundary: no advisory text)
// ---------------------------------------------------------------------------

describe('soilService.getSoilHealthSummary', () => {
  it('computes current/previous/delta and a trend from the raw numbers only', async () => {
    const older = aSoilTest({ testDate: '2026-01-01', organicCarbonPct: 0.5, ph: 6.0, tdsPpm: 200 });
    const newer = aSoilTest({ testDate: '2026-04-01', organicCarbonPct: 0.7, ph: 6.0, tdsPpm: 180 });
    const { svc } = service({ soilTests: [older, newer] });

    const summary = await svc.getSoilHealthSummary(farmerScope(), FARM_A, PLOT_A);

    expect(summary.organicCarbon.currentValue).toBe(0.7);
    expect(summary.organicCarbon.previousValue).toBe(0.5);
    expect(summary.organicCarbon.deltaValue).toBeCloseTo(0.2);
    expect(summary.organicCarbon.trendDirection).toBe('improving'); // rose
    expect(summary.tds.trendDirection).toBe('declining'); // fell (180 < 200)
    expect(summary.organicCarbon.chartPoints).toHaveLength(2);
  });

  it('returns an all-null metric when there are no records yet', async () => {
    const { svc } = service({ soilTests: [] });
    const summary = await svc.getSoilHealthSummary(farmerScope(), FARM_A, PLOT_A);
    expect(summary.ph).toEqual({
      currentValue: null,
      previousValue: null,
      deltaValue: null,
      trendDirection: null,
      chartPoints: [],
    });
  });

  it('does not include any advisory/insight text field (BR-38 boundary)', async () => {
    const record = aSoilTest();
    const { svc } = service({ soilTests: [record] });
    const summary = await svc.getSoilHealthSummary(farmerScope(), FARM_A, PLOT_A);
    expect(Object.keys(summary.ph).sort()).toEqual(
      ['chartPoints', 'currentValue', 'deltaValue', 'previousValue', 'trendDirection'].sort(),
    );
  });
});

// ---------------------------------------------------------------------------
// soil_amendments CRUD
// ---------------------------------------------------------------------------

describe('soil amendments', () => {
  it('creates, updates, and deletes an amendment scoped to the plot', async () => {
    const { svc, calls } = service();

    const created = await svc.createSoilAmendment(
      farmerScope(),
      FARM_A,
      PLOT_A,
      createSoilAmendmentBody.parse({ amendmentType: 'Compost', quantityKg: 50, appliedDate: '2026-04-01' }),
    );
    expect(created.plotId).toBe(PLOT_A);

    const updated = await svc.updateSoilAmendment(farmerScope(), FARM_A, PLOT_A, created.id, {
      quantityKg: 75,
    });
    expect(updated.quantityKg).toBe(75);
    expect(calls.updateSoilAmendment[0]?.patch).toEqual({ quantityKg: 75 });

    await svc.removeSoilAmendment(farmerScope(), FARM_A, PLOT_A, created.id);
    expect(calls.deleteSoilAmendment).toEqual([{ plotId: PLOT_A, id: created.id }]);
  });

  it('BR-36: updating an amendment under a foreign plot 404s before any write', async () => {
    const amendment = aSoilAmendment({ plotId: newId() });
    const { svc, calls } = service({ soilAmendments: [amendment] });

    await expect(
      svc.updateSoilAmendment(farmerScope(), FARM_A, PLOT_A, amendment.id, { quantityKg: 1 }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(calls.updateSoilAmendment).toHaveLength(0);
  });

  it('deleting an unknown amendment id 404s', async () => {
    const { svc } = service();
    await expect(svc.removeSoilAmendment(farmerScope(), FARM_A, PLOT_A, newId())).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

// ---------------------------------------------------------------------------
// soil_moisture_observations (list + create only — a log)
// ---------------------------------------------------------------------------

describe('soil moisture observations', () => {
  it('stamps observedBy from the scope, never from the client body', async () => {
    const { svc, calls } = service();
    const observation = await svc.createSoilMoisture(
      farmerScope(),
      FARM_A,
      PLOT_A,
      createSoilMoistureBody.parse({ level: 'Moist' }),
    );

    expect(observation.observedBy).toBe(USER_A);
    expect(calls.insertSoilMoisture[0]?.observedBy).toBe(USER_A);
  });
});

// ---------------------------------------------------------------------------
// erosion_conservation_notes
// ---------------------------------------------------------------------------

describe('erosion conservation notes', () => {
  it('logs a farmer self-assessed risk level and practice notes', async () => {
    const { svc } = service();
    const note = await svc.createErosionNote(
      farmerScope(),
      FARM_A,
      PLOT_A,
      createErosionNoteBody.parse({ riskLevel: 'High Risk', practiceNotes: 'Contour bunding needed' }),
    );
    expect(note.riskLevel).toBe('High Risk');
    expect(note.practiceNotes).toBe('Contour bunding needed');
  });
});

// ---------------------------------------------------------------------------
// crop_rotation_entries + cover_crop_windows
// ---------------------------------------------------------------------------

describe('crop rotation + cover crop windows', () => {
  it('PUT replaces the whole sequence in one call (delete-then-insert)', async () => {
    const existing: CropRotationEntry = {
      id: newId(),
      plotId: PLOT_A,
      sequenceOrder: 1,
      cropName: 'Old crop',
      plannedDate: null,
      status: 'CURRENT',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: null,
    };
    const { svc, calls } = service({ cropRotation: [existing] });

    const result = await svc.putCropRotation(
      farmerScope(),
      FARM_A,
      PLOT_A,
      putCropRotationBody.parse({
        sequence: [
          { sequenceOrder: 1, cropName: 'Carrot', status: 'CURRENT' },
          { sequenceOrder: 2, cropName: 'Beans', status: 'NEXT' },
        ],
      }),
    );

    expect(calls.replaceCropRotationSequence).toBe(1);
    expect(result.sequence.map((e) => e.cropName)).toEqual(['Carrot', 'Beans']);
    expect(result.sequence.every((e) => e.id !== existing.id)).toBe(true);
  });

  it('GET returns the sequence plus the current/most relevant cover crop window', async () => {
    const window: CoverCropWindow = {
      id: newId(),
      plotId: PLOT_A,
      coverCropType: 'Sunn hemp',
      windowStart: '2026-01-01',
      windowEnd: '2026-02-01',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: null,
    };
    const { svc } = service({ coverCropWindows: [window] });

    const result = await svc.getCropRotation(farmerScope(), FARM_A, PLOT_A);
    expect(result.sequence).toEqual([]);
    expect(result.coverCropWindow).toEqual(window);
  });

  it('GET returns null coverCropWindow when none has been logged', async () => {
    const { svc } = service();
    const result = await svc.getCropRotation(farmerScope(), FARM_A, PLOT_A);
    expect(result.coverCropWindow).toBeNull();
  });

  it('creates a cover crop window under the plot', async () => {
    const { svc, calls } = service();
    const window = await svc.createCoverCropWindow(
      farmerScope(),
      FARM_A,
      PLOT_A,
      createCoverCropWindowBody.parse({
        coverCropType: 'Sunn hemp',
        windowStart: '2026-06-01',
        windowEnd: '2026-07-01',
      }),
    );
    expect(window.plotId).toBe(PLOT_A);
    expect(calls.insertCoverCropWindow[0]?.coverCropType).toBe('Sunn hemp');
  });

  it('BR-36: PUT crop-rotation on a foreign plot 404s before any delete/insert', async () => {
    const { svc, calls } = service({ ownedPlots: [{ farmerId: FARMER_B, farmId: FARM_A, plotId: PLOT_A }] });

    await expect(
      svc.putCropRotation(farmerScope(), FARM_A, PLOT_A, putCropRotationBody.parse({ sequence: [] })),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(calls.replaceCropRotationSequence).toBe(0);
  });

  describe('Soil Report PDF Export (FR-F06)', () => {
    it('generates a signed download URL and verifies valid signature correctly', () => {
      const { svc } = service();
      const link = svc.generateSignedDownloadUrl(FARM_A, {
        period: '6 months',
        include: 'tests,amendments,moisture_erosion,rotation',
      });
      expect(link.downloadUrl).toContain(`/v1/farms/${FARM_A}/soil-reports/export`);
      expect(link.fileName).toBe('Soil_Health_Report_6_months.pdf');
      expect(link.expiresAt).toBeGreaterThan(Date.now());

      const urlObj = new URL(`http://localhost${link.downloadUrl}`);
      const token = urlObj.searchParams.get('token')!;
      const expires = Number(urlObj.searchParams.get('expires')!);

      const isValid = svc.verifyDownloadSignature(
        FARM_A,
        { period: '6 months', include: 'tests,amendments,moisture_erosion,rotation' },
        token,
        expires,
      );
      expect(isValid).toBe(true);

      const isInvalid = svc.verifyDownloadSignature(
        FARM_A,
        { period: '3 months', include: 'tests' },
        token,
        expires,
      );
      expect(isInvalid).toBe(false);
    });

    it('renders a real soil report PDF buffer with all requested sections', async () => {
      const { svc } = service({
        soilTests: [aSoilTest({ plotId: PLOT_A, ph: 6.5, testDate: '2026-05-10' })],
        soilAmendments: [aSoilAmendment({ plotId: PLOT_A, amendmentType: 'Farmyard Manure', quantityKg: 50 })],
      });

      const scope = farmerScope({ farmerId: FARMER_A, userId: USER_A });
      const pdfBuffer = await svc.exportSoilReportPdf(scope, FARM_A, {
        period: 'All time',
        include: 'tests,amendments,moisture_erosion,rotation',
      });

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      expect(pdfBuffer.toString('utf8', 0, 5)).toContain('%PDF');
    });
  });
});

// ---------------------------------------------------------------------------
// integration — real Postgres round-trip
// ---------------------------------------------------------------------------

describeIfDatabase('soilService (integration against PostgreSQL)', () => {
  it('creates a soil test with real system_config classification bands, plus one row per other table, under a real plot', async () => {
    const tablesReady = await Promise.all(
      [
        'plots',
        'soil_test_records',
        'soil_amendments',
        'soil_moisture_observations',
        'erosion_conservation_notes',
        'crop_rotation_entries',
        'cover_crop_windows',
      ].map(databaseReady),
    );
    if (tablesReady.some((ready) => !ready)) {
      console.warn(
        '[skip] soil diary tables not reachable — run `docker compose up -d && pnpm db:migrate && pnpm db:seed`',
      );
      return;
    }

    const { pool } = await import('../../db/pool.js');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userId = newId();
      const mobile = `+9198${Math.floor(10000000 + Math.random() * 89999999)}`;
      await client.query(
        `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, $3, 'FARMER', 'ACTIVE')`,
        [userId, mobile, 'Integration Test Farmer'],
      );
      const farmerId = newId();
      await client.query(`INSERT INTO farmers (id, user_id, tohfa_farmer_id) VALUES ($1, $2, $3)`, [
        farmerId,
        userId,
        `TOHFA-TEST-${farmerId.slice(0, 8)}`,
      ]);
      const farmId = newId();
      await client.query(
        `INSERT INTO farms (id, farmer_id, name, district) VALUES ($1, $2, 'Integration Farm', 'The Nilgiris')`,
        [farmId, farmerId],
      );
      const plotId = newId();
      await client.query(`INSERT INTO plots (id, farm_id, name) VALUES ($1, $2, 'Zone A')`, [plotId, farmId]);

      const scope = farmerScope({ farmerId, userId });
      const svc = createSoilService({ db: client, runTx: async (fn) => fn(client) });

      const configRow = await client.query<{ value: unknown }>(
        `SELECT value FROM system_config WHERE key = 'soil.classification.ph'`,
      );
      expect(configRow.rows[0], 'db/seed/001_reference.sql must be applied').toBeDefined();

      const record = await svc.createSoilTest(
        scope,
        farmId,
        plotId,
        createSoilTestBody.parse({
          testDate: '2026-04-01',
          nextDueDate: '2026-10-01',
          organicCarbonPct: 0.6,
          ph: 5.0, // below the seeded 6.0 floor
          ecDsPerM: 0.5,
        }),
      );
      expect(record.phLabel).toBe('Acidic');

      const fetched = await svc.getSoilTest(scope, farmId, plotId, record.id);
      expect(fetched.phLabel).toBe('Acidic'); // BR-40b: same across list/detail

      await svc.createSoilAmendment(
        scope,
        farmId,
        plotId,
        createSoilAmendmentBody.parse({ amendmentType: 'Lime', quantityKg: 20, appliedDate: '2026-04-01' }),
      );
      await svc.createSoilMoisture(scope, farmId, plotId, createSoilMoistureBody.parse({ level: 'Dry' }));
      await svc.createErosionNote(
        scope,
        farmId,
        plotId,
        createErosionNoteBody.parse({ riskLevel: 'Low Risk' }),
      );
      await svc.putCropRotation(
        scope,
        farmId,
        plotId,
        putCropRotationBody.parse({ sequence: [{ sequenceOrder: 1, cropName: 'Carrot', status: 'CURRENT' }] }),
      );
      await svc.createCoverCropWindow(
        scope,
        farmId,
        plotId,
        createCoverCropWindowBody.parse({
          coverCropType: 'Sunn hemp',
          windowStart: '2026-06-01',
          windowEnd: '2026-07-01',
        }),
      );

      const plan = await svc.getCropRotation(scope, farmId, plotId);
      expect(plan.sequence).toHaveLength(1);
      expect(plan.coverCropWindow?.coverCropType).toBe('Sunn hemp');

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });
});
