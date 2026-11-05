import express from 'express';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { parseMoney, RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { signAccessToken } from '../../auth/jwt.js';
import type { Executor } from '../../db/pool.js';
import { errorHandler, notFoundHandler } from '../../http/errorHandler.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import type { IdempotencyStore } from '../../http/idempotency.js';
import { aScope, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import { createInMemoryIdempotencyStore } from '../../test/idempotencyStore.js';
import type {
  CropInputCursor,
  CropInputRecord,
  CropInputsRepo,
  FarmCropInputCursor,
  FarmCropInputFilters,
  FarmCropInputRecord,
} from './crop-inputs.repo.js';
import { cropInputsRouter } from './crop-inputs.routes.js';
import {
  createCropInputBody,
  listFarmCropInputsQuery,
  updateCropInputBody,
} from './crop-inputs.schema.js';
import { createCropInputsService, cropInputsService } from './crop-inputs.service.js';

function todayIst(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const FARMER_A = IDS.farmer;
const FARMER_B = '30000000-0000-4000-8000-000000000002';
const CROP_A = '50000000-0000-4000-8000-000000000001';
const CROP_B = '50000000-0000-4000-8000-000000000002';
/** A second crop of FARMER_A that has already been HARVESTED (no longer active). */
const CROP_A_HARVESTED = '50000000-0000-4000-8000-000000000003';

/** Display names the fake repo joins on, standing in for crop_master.name / plots.name. */
const FAKE_CROP_PLOT: Record<string, { cropName: string; plotName: string }> = {
  [CROP_A]: { cropName: 'Carrot', plotName: 'North Terrace' },
  [CROP_B]: { cropName: 'Beans', plotName: 'B Plot' },
  [CROP_A_HARVESTED]: { cropName: 'Cabbage', plotName: 'South Terrace' },
};

/** Tuple comparison (appliedOn, createdAt, id), descending: positive when `a` sorts AFTER `b`. */
function compareNewestFirst(
  a: { appliedOn: string; createdAt: string; id: string },
  b: { appliedOn: string; createdAt: string; id: string },
): number {
  if (a.appliedOn !== b.appliedOn) return b.appliedOn.localeCompare(a.appliedOn);
  if (a.createdAt !== b.createdAt) return b.createdAt.localeCompare(a.createdAt);
  return b.id.localeCompare(a.id);
}

function farmerScope(farmerId: string, permission = 'farmer.crop_input.manage_own'): ResolvedScope {
  return aScope({
    level: ScopeLevel.OWN,
    farmerId,
    userId: newId(),
    roleCode: RoleCode.FARMER,
    permission,
  });
}

interface FakeDbState {
  inputs: Map<string, CropInputRecord & { deletedAt: string | null }>;
  audits: unknown[][];
  lockedFarmers: string[];
  /** Every call to listFarmerCropInputs, so a test can see what the service asked the repo for. */
  farmListCalls: Array<{ farmerId: string; filters: FarmCropInputFilters; limit: number; cursor: FarmCropInputCursor | undefined }>;
}

function createFakeRepo(state: FakeDbState): CropInputsRepo {
  return {
    async lockFarmer(_db, farmerId) {
      state.lockedFarmers.push(farmerId);
    },

    async checkFarmCropBelongsToFarmer(_db, farmerId, farmCropId) {
      return (farmerId === FARMER_A && (farmCropId === CROP_A || farmCropId === CROP_A_HARVESTED)) ||
             (farmerId === FARMER_B && farmCropId === CROP_B);
    },

    async listFarmerCropInputs(_db, farmerId, filters, limit, cursor) {
      state.farmListCalls.push({ farmerId, filters: { ...filters }, limit, cursor });
      const all: FarmCropInputRecord[] = Array.from(state.inputs.values())
        .filter((r) => r.farmerId === farmerId && r.deletedAt === null)
        .filter((r) => filters.inputType === undefined || r.inputType === filters.inputType)
        .filter((r) => filters.from === undefined || r.appliedOn >= filters.from)
        .filter((r) => filters.to === undefined || r.appliedOn <= filters.to)
        .map(({ deletedAt: _deletedAt, ...r }) => ({
          ...r,
          cropName: FAKE_CROP_PLOT[r.farmCropId]?.cropName ?? '?',
          plotName: FAKE_CROP_PLOT[r.farmCropId]?.plotName ?? '?',
        }))
        .sort(compareNewestFirst);
      const after = cursor ? all.filter((r) => compareNewestFirst(r, cursor) > 0) : all;
      const hasMore = after.length > limit;
      const items = hasMore ? after.slice(0, limit) : after;
      const last = items[items.length - 1];
      const next: FarmCropInputCursor | null =
        hasMore && last ? { appliedOn: last.appliedOn, createdAt: last.createdAt, id: last.id } : null;
      return { items, next };
    },

    async findCropInputById(_db, farmerId, farmCropId, id) {
      const rec = state.inputs.get(id);
      if (!rec || rec.farmerId !== farmerId || rec.farmCropId !== farmCropId || rec.deletedAt !== null) {
        return null;
      }
      return { ...rec };
    },

    async listCropInputs(_db, farmerId, farmCropId, limit, cursor) {
      const all = Array.from(state.inputs.values())
        .filter((r) => r.farmerId === farmerId && r.farmCropId === farmCropId && r.deletedAt === null)
        .sort((a, b) => {
          if (a.createdAt !== b.createdAt) {
            return b.createdAt.localeCompare(a.createdAt);
          }
          return b.id.localeCompare(a.id);
        });

      let filtered = all;
      if (cursor) {
        filtered = all.filter((r) => {
          if (r.createdAt === cursor.createdAt) {
            return r.id < cursor.id;
          }
          return r.createdAt < cursor.createdAt;
        });
      }

      const hasMore = filtered.length > limit;
      const items = (hasMore ? filtered.slice(0, limit) : filtered).map((r) => ({ ...r }));
      let next: CropInputCursor | null = null;
      if (hasMore && items.length > 0) {
        const last = items[items.length - 1];
        if (last) {
          next = { createdAt: last.createdAt, id: last.id };
        }
      }

      return { items, next };
    },

    async createCropInput(_db, farmerId, farmCropId, data) {
      const id = newId();
      const rec: CropInputRecord & { deletedAt: string | null } = {
        id,
        farmerId,
        farmCropId,
        inputType: data.inputType,
        inputName: data.inputName,
        appliedOn: data.appliedOn,
        quantity: data.quantity,
        unit: data.unit,
        nitrogenPct: data.nitrogenPct ?? null,
        phosphorusPct: data.phosphorusPct ?? null,
        potassiumPct: data.potassiumPct ?? null,
        applicationMethod: data.applicationMethod ?? null,
        costInr: data.costInr === undefined ? null : parseMoney(data.costInr),
        notes: data.notes ?? null,
        purpose: data.purpose ?? null,
        targetPest: data.targetPest ?? null,
        appliedBy: data.appliedBy ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        deletedAt: null,
      };
      state.inputs.set(id, rec);
      return { ...rec };
    },

    async updateCropInput(_db, farmerId, farmCropId, id, patch) {
      const rec = state.inputs.get(id);
      if (!rec || rec.farmerId !== farmerId || rec.farmCropId !== farmCropId || rec.deletedAt !== null) {
        return null;
      }
      if (patch.inputType !== undefined) rec.inputType = patch.inputType;
      if (patch.inputName !== undefined) rec.inputName = patch.inputName;
      if (patch.appliedOn !== undefined) rec.appliedOn = patch.appliedOn;
      if (patch.quantity !== undefined) rec.quantity = patch.quantity;
      if (patch.unit !== undefined) rec.unit = patch.unit;
      if ('nitrogenPct' in patch) rec.nitrogenPct = patch.nitrogenPct ?? null;
      if ('phosphorusPct' in patch) rec.phosphorusPct = patch.phosphorusPct ?? null;
      if ('potassiumPct' in patch) rec.potassiumPct = patch.potassiumPct ?? null;
      if ('applicationMethod' in patch) rec.applicationMethod = patch.applicationMethod ?? null;
      if ('costInr' in patch) rec.costInr = patch.costInr === null || patch.costInr === undefined ? null : parseMoney(patch.costInr);
      if ('notes' in patch) rec.notes = patch.notes ?? null;
      if ('purpose' in patch) rec.purpose = patch.purpose ?? null;
      if ('targetPest' in patch) rec.targetPest = patch.targetPest ?? null;
      if ('appliedBy' in patch) rec.appliedBy = patch.appliedBy ?? null;
      rec.updatedAt = new Date().toISOString();
      return { ...rec };
    },

    async softDeleteCropInput(_db, farmerId, farmCropId, id) {
      const rec = state.inputs.get(id);
      if (!rec || rec.farmerId !== farmerId || rec.farmCropId !== farmCropId || rec.deletedAt !== null) {
        return false;
      }
      rec.deletedAt = new Date().toISOString();
      return true;
    },

    async getAllActiveInputsForCrop(_db, farmerId, farmCropId) {
      return Array.from(state.inputs.values())
        .filter((r) => r.farmerId === farmerId && r.farmCropId === farmCropId && r.deletedAt === null)
        .map((r) => ({ ...r }));
    },
  };
}

function createTestContext(idempotency: IdempotencyStore = createInMemoryIdempotencyStore()) {
  const state: FakeDbState = {
    inputs: new Map(),
    audits: [],
    lockedFarmers: [],
    farmListCalls: [],
  };
  const repo = createFakeRepo(state);
  const fakeTx: Executor = {
    query: async (_sql: string, params?: unknown[]) => {
      state.audits.push(params ?? []);
      return { rows: [{ id: newId() }], rowCount: 1 } as never;
    },
  };
  const service = createCropInputsService({
    repo,
    db: fakeTx,
    runTx: async (fn) => fn(fakeTx),
    idempotency,
  });

  return { state, repo, service, audits: state.audits, idempotency };
}

const VALID_BODY = {
  inputType: 'FERTILIZER',
  inputName: 'Urea',
  quantity: 10,
  unit: 'KG',
} as const;

async function expectAppError(promise: Promise<unknown>, code: string, status: number): Promise<void> {
  await expect(promise).rejects.toMatchObject({ name: 'AppError', code, status });
}

describe('Crop Inputs (BR-56)', () => {
  it('BR-56a: rejects non-positive quantity with 422 VALIDATION_FAILED', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    for (const quantity of [0, -5]) {
      await expectAppError(
        service.createCropInput(scope, CROP_A, { ...VALID_BODY, appliedOn: todayIst(), quantity }),
        'VALIDATION_FAILED',
        422,
      );
    }
  });

  it('BR-56a: a quantity above the numeric(10,2) column limit is a 422 at the schema, not a 500 from Postgres', () => {
    const base = { ...VALID_BODY, appliedOn: todayIst() };
    expect(createCropInputBody.safeParse({ ...base, quantity: 99_999_999.99 }).success).toBe(true);
    expect(createCropInputBody.safeParse({ ...base, quantity: 100_000_000 }).success).toBe(false);
    expect(updateCropInputBody.safeParse({ quantity: 100_000_000 }).success).toBe(false);
  });

  it('BR-56b: rejects appliedOn in the future with 422 VALIDATION_FAILED', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    await expectAppError(
      service.createCropInput(scope, CROP_A, { ...VALID_BODY, appliedOn: addDays(todayIst(), 2) }),
      'VALIDATION_FAILED',
      422,
    );
  });

  it('BR-56b: appliedOn must be a real calendar date, so 2026-02-30 is a 422 at the schema, not a 500 from Postgres', () => {
    const base = { ...VALID_BODY };
    expect(createCropInputBody.safeParse({ ...base, appliedOn: '2026-02-28' }).success).toBe(true);
    expect(createCropInputBody.safeParse({ ...base, appliedOn: '2026-02-30' }).success).toBe(false);
    expect(createCropInputBody.safeParse({ ...base, appliedOn: '2026-13-01' }).success).toBe(false);
    expect(updateCropInputBody.safeParse({ appliedOn: '2026-02-30' }).success).toBe(false);
  });

  it('BR-56c: rejects NPK percentages outside 0-100 with 422 VALIDATION_FAILED', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    await expectAppError(
      service.createCropInput(scope, CROP_A, { ...VALID_BODY, appliedOn: todayIst(), nitrogenPct: 105 }),
      'VALIDATION_FAILED',
      422,
    );
    await expectAppError(
      service.createCropInput(scope, CROP_A, { ...VALID_BODY, appliedOn: todayIst(), phosphorusPct: -2 }),
      'VALIDATION_FAILED',
      422,
    );
  });

  it('BR-56c: rejects N+P+K above 100 percent with 422 VALIDATION_FAILED, on create and on update', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    await expectAppError(
      service.createCropInput(scope, CROP_A, {
        ...VALID_BODY,
        appliedOn: todayIst(),
        nitrogenPct: 60,
        phosphorusPct: 30,
        potassiumPct: 11,
      }),
      'VALIDATION_FAILED',
      422,
    );

    // 100 exactly is allowed.
    const created = await service.createCropInput(scope, CROP_A, {
      ...VALID_BODY,
      appliedOn: todayIst(),
      nitrogenPct: 60,
      phosphorusPct: 30,
      potassiumPct: 10,
    });

    // An update that touches only one percentage must be checked against the stored other two.
    await expectAppError(
      service.updateCropInput(scope, CROP_A, created.id, { nitrogenPct: 61 }),
      'VALIDATION_FAILED',
      422,
    );
    // Lowering one percentage makes room for another in the same patch.
    const updated = await service.updateCropInput(scope, CROP_A, created.id, {
      nitrogenPct: 50,
      potassiumPct: 20,
    });
    expect(updated.nitrogenPct).toBe(50);
    expect(updated.potassiumPct).toBe(20);
  });

  it('BR-56d: cross-farmer access returns 404 NOT_FOUND on every operation (BR-36)', async () => {
    const { service } = createTestContext();
    const scopeA = farmerScope(FARMER_A);
    const scopeB = farmerScope(FARMER_B);

    const input = await service.createCropInput(scopeA, CROP_A, {
      ...VALID_BODY,
      inputType: 'BIO_INPUT',
      inputName: 'Neem Cake',
      appliedOn: todayIst(),
    });

    await expectAppError(service.getCropInput(scopeB, CROP_A, input.id), 'NOT_FOUND', 404);
    await expectAppError(service.listCropInputs(scopeB, CROP_A, { limit: 20 }), 'NOT_FOUND', 404);
    await expectAppError(service.getNpkContribution(scopeB, CROP_A), 'NOT_FOUND', 404);
    await expectAppError(
      service.createCropInput(scopeB, CROP_A, { ...VALID_BODY, appliedOn: todayIst() }),
      'NOT_FOUND',
      404,
    );
    await expectAppError(
      service.updateCropInput(scopeB, CROP_A, input.id, { inputName: 'Hacked Input' }),
      'NOT_FOUND',
      404,
    );
    await expectAppError(service.deleteCropInput(scopeB, CROP_A, input.id), 'NOT_FOUND', 404);
  });

  it('BR-56e: soft-delete removes input from lists and single get', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    const input = await service.createCropInput(scope, CROP_A, {
      ...VALID_BODY,
      inputName: 'DAP',
      appliedOn: todayIst(),
      quantity: 25,
    });

    const listBefore = await service.listCropInputs(scope, CROP_A, { limit: 10 });
    expect(listBefore.items.some((i) => i.id === input.id)).toBe(true);

    await service.deleteCropInput(scope, CROP_A, input.id);

    const listAfter = await service.listCropInputs(scope, CROP_A, { limit: 10 });
    expect(listAfter.items.some((i) => i.id === input.id)).toBe(false);

    await expectAppError(service.getCropInput(scope, CROP_A, input.id), 'NOT_FOUND', 404);
  });

  it('BR-56f: calculates accurate cumulative NPK nutrient contribution', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    // 100 KG fertilizer with 20% N, 10% P, 5% K
    await service.createCropInput(scope, CROP_A, {
      ...VALID_BODY,
      inputName: 'NPK 20-10-5',
      appliedOn: todayIst(),
      quantity: 100,
      nitrogenPct: 20,
      phosphorusPct: 10,
      potassiumPct: 5,
      costInr: '1200.00',
    });

    // 1 BAG (50 KG) with 46% N (Urea)
    await service.createCropInput(scope, CROP_A, {
      ...VALID_BODY,
      inputName: 'Urea 46%',
      appliedOn: todayIst(),
      quantity: 1,
      unit: 'BAG',
      nitrogenPct: 46,
      phosphorusPct: 0,
      potassiumPct: 0,
      costInr: '300',
    });

    const contribution = await service.getNpkContribution(scope, CROP_A);

    // Total quantity = 100 KG + (1 bag * 50 kg) = 150 KG
    expect(contribution.totalQuantityKg).toBe(150);
    // Total Nitrogen = (100 * 0.20) + (50 * 0.46) = 20 + 23 = 43 KG
    expect(contribution.totalNitrogenKg).toBe(43);
    expect(contribution.totalPhosphorusKg).toBe(10);
    expect(contribution.totalPotassiumKg).toBe(5);
    expect(contribution.totalCostInr).toBe('1500.00');
    expect(contribution.totalInputsCount).toBe(2);
  });

  it('BR-56f: totalCostInr is summed in integer paise, so 0.10 + 0.20 is exactly 0.30 and 1.00 + 19.99 + 0.01 carries no drift', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);
    const add = (costInr: string) =>
      service.createCropInput(scope, CROP_A, { ...VALID_BODY, appliedOn: todayIst(), costInr });

    await add('0.10');
    await add('0.20');
    // Float arithmetic gives 0.30000000000000004 here.
    expect((await service.getNpkContribution(scope, CROP_A)).totalCostInr).toBe('0.30');

    for (let i = 0; i < 7; i += 1) await add('0.10');
    expect((await service.getNpkContribution(scope, CROP_A)).totalCostInr).toBe('1.00');

    await add('19.99');
    await add('0.01');
    expect((await service.getNpkContribution(scope, CROP_A)).totalCostInr).toBe('21.00');
  });

  it('BR-56f: a cost is a decimal string with at most 2 decimals and at most 8 integer digits, never a JSON number', () => {
    const base = { ...VALID_BODY, appliedOn: todayIst() };
    const ok = (costInr: unknown) => createCropInputBody.safeParse({ ...base, costInr }).success;

    expect(ok('0')).toBe(true);
    expect(ok('1200.5')).toBe(true);
    expect(ok('99999999.99')).toBe(true);
    // numeric(10,2) holds 8 integer digits: one more is a 22003 from Postgres (a 500) if it gets through.
    expect(ok('100000000.00')).toBe(false);
    expect(ok('1.005')).toBe(false);
    expect(ok('-1')).toBe(false);
    expect(ok(12.5)).toBe(false);
    expect(ok('1e3')).toBe(false);
    expect(updateCropInputBody.safeParse({ costInr: null }).success).toBe(true);
    expect(updateCropInputBody.safeParse({ costInr: 12.5 }).success).toBe(false);
  });

  it('BR-56g: locks farmer row and writes audit logs on create, update, delete (BR-35)', async () => {
    const { service, state, audits } = createTestContext();
    const scope = farmerScope(FARMER_A);

    const created = await service.createCropInput(scope, CROP_A, {
      ...VALID_BODY,
      inputType: 'BIO_INPUT',
      inputName: 'Panchagavya',
      appliedOn: todayIst(),
      quantity: 5,
      unit: 'LITRE',
    });
    expect(state.lockedFarmers).toContain(FARMER_A);
    expect(audits.length).toBe(1);
    expect(audits[0]?.[3]).toBe('crop_input.create');
    expect(audits[0]?.[4]).toBe('crop_input');
    expect(audits[0]?.[5]).toBe(created.id);

    const updated = await service.updateCropInput(scope, CROP_A, created.id, { quantity: 8 });
    expect(updated.quantity).toBe(8);
    expect(audits.length).toBe(2);
    expect(audits[1]?.[3]).toBe('crop_input.update');
    expect(audits[1]?.[4]).toBe('crop_input');

    await service.deleteCropInput(scope, CROP_A, created.id);
    expect(audits.length).toBe(3);
    expect(audits[2]?.[3]).toBe('crop_input.delete');
    expect(audits[2]?.[4]).toBe('crop_input');
  });
});

// ---------------------------------------------------------------------------
// BR-56i..k: idempotent create, the FERTIGATION type, purpose / target pest / applied-by
// ---------------------------------------------------------------------------

describe('Crop input create is idempotent when an Idempotency-Key is sent (BR-56i)', () => {
  it('BR-56i: replaying a key with the same body creates one row and one audit entry, and returns the original', async () => {
    const { service, state, audits } = createTestContext();
    const scope = farmerScope(FARMER_A);
    const body = { ...VALID_BODY, appliedOn: todayIst() };

    const first = await service.createCropInput(scope, CROP_A, body, 'key-1');
    const replay = await service.createCropInput(scope, CROP_A, { ...body }, 'key-1');

    expect(replay).toEqual(first);
    expect(state.inputs.size).toBe(1);
    expect(audits.filter((a) => a[3] === 'crop_input.create')).toHaveLength(1);
  });

  it('BR-56i: the same key with a different body or a different crop is 409 IDEMPOTENCY_KEY_REUSED and writes nothing', async () => {
    const { service, state } = createTestContext();
    const scope = farmerScope(FARMER_A);
    const body = { ...VALID_BODY, appliedOn: todayIst() };
    await service.createCropInput(scope, CROP_A, body, 'key-1');

    await expectAppError(service.createCropInput(scope, CROP_A, { ...body, quantity: 11 }, 'key-1'), 'IDEMPOTENCY_KEY_REUSED', 409);
    await expectAppError(service.createCropInput(scope, CROP_A_HARVESTED, body, 'key-1'), 'IDEMPOTENCY_KEY_REUSED', 409);
    expect(state.inputs.size).toBe(1);
  });

  it('BR-56i: without a key (or with a blank one) every call creates a row, as before, and no key is claimed', async () => {
    const { service, state, idempotency } = createTestContext();
    const scope = farmerScope(FARMER_A);
    const body = { ...VALID_BODY, appliedOn: todayIst() };

    await service.createCropInput(scope, CROP_A, body);
    await service.createCropInput(scope, CROP_A, body, undefined);
    await service.createCropInput(scope, CROP_A, body, '   ');

    expect(state.inputs.size).toBe(3);
    expect((idempotency as ReturnType<typeof createInMemoryIdempotencyStore>).size()).toBe(0);
  });

  it('BR-56i: keys are scoped to the acting user, so another farmer reusing the string creates their own row', async () => {
    const { service, state } = createTestContext();
    const body = { ...VALID_BODY, appliedOn: todayIst() };

    await service.createCropInput(farmerScope(FARMER_A), CROP_A, body, 'shared-key');
    await service.createCropInput(farmerScope(FARMER_B), CROP_B, body, 'shared-key');

    expect(state.inputs.size).toBe(2);
  });

  it('BR-56i: a key over 255 characters is 422 VALIDATION_FAILED before anything is written', async () => {
    const { service, state } = createTestContext();
    await expectAppError(
      service.createCropInput(farmerScope(FARMER_A), CROP_A, { ...VALID_BODY, appliedOn: todayIst() }, 'k'.repeat(256)),
      'VALIDATION_FAILED',
      422,
    );
    expect(state.inputs.size).toBe(0);
  });

  describe('route', () => {
    const app = express();
    app.use(express.json());
    app.use('/v1/farmers/me', cropInputsRouter);
    app.use(notFoundHandler);
    app.use(errorHandler);
    const auth = `Bearer ${signAccessToken({ sub: newId(), roles: [{ code: RoleCode.FARMER }], farmerId: FARMER_A, customerId: null })}`;

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('BR-56i: POST passes the Idempotency-Key header to the service, and omits it when absent', async () => {
      const spy = vi.spyOn(cropInputsService, 'createCropInput').mockResolvedValue({} as never);
      const body = { ...VALID_BODY, appliedOn: todayIst() };

      const withKey = await request(app)
        .post(`/v1/farmers/me/crops/${CROP_A}/inputs`)
        .set('Authorization', auth)
        .set('Idempotency-Key', 'abc-123')
        .send(body);
      expect(withKey.status).toBe(201);
      expect(spy.mock.calls[0]?.[3]).toBe('abc-123');

      const withoutKey = await request(app)
        .post(`/v1/farmers/me/crops/${CROP_A}/inputs`)
        .set('Authorization', auth)
        .send(body);
      expect(withoutKey.status).toBe(201);
      expect(spy.mock.calls[1]?.[3]).toBeUndefined();
    });
  });
});

describe('FERTIGATION input type (BR-56j)', () => {
  it('BR-56j: FERTIGATION is accepted on create, update and the farm-wide list filter; legacy OTHER still is', async () => {
    expect(createCropInputBody.safeParse({ ...VALID_BODY, inputType: 'FERTIGATION', appliedOn: '2026-01-01' }).success).toBe(true);
    expect(createCropInputBody.safeParse({ ...VALID_BODY, inputType: 'OTHER', appliedOn: '2026-01-01' }).success).toBe(true);
    expect(updateCropInputBody.safeParse({ inputType: 'FERTIGATION' }).success).toBe(true);
    expect(listFarmCropInputsQuery.safeParse({ inputType: 'FERTIGATION' }).success).toBe(true);

    const { service } = createTestContext();
    const created = await service.createCropInput(farmerScope(FARMER_A), CROP_A, {
      ...VALID_BODY,
      inputType: 'FERTIGATION',
      inputName: '19:19:19 via drip',
      appliedOn: todayIst(),
    });
    expect(created.inputType).toBe('FERTIGATION');
  });
});

describe('Purpose, target pest and applied-by are persisted (BR-56k)', () => {
  it('BR-56k: create stores purpose, targetPest and appliedBy; absent ones read back as null', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    const full = await service.createCropInput(scope, CROP_A, {
      ...VALID_BODY,
      inputType: 'PESTICIDE',
      appliedOn: todayIst(),
      purpose: 'PEST_CONTROL',
      targetPest: 'APHIDS',
      appliedBy: 'Self',
    });
    expect(full).toMatchObject({ purpose: 'PEST_CONTROL', targetPest: 'APHIDS', appliedBy: 'Self' });

    const bare = await service.createCropInput(scope, CROP_A, { ...VALID_BODY, appliedOn: todayIst() });
    expect(bare).toMatchObject({ purpose: null, targetPest: null, appliedBy: null });

    const cleared = await service.updateCropInput(scope, CROP_A, full.id, { targetPest: null, appliedBy: 'Muthu' });
    expect(cleared).toMatchObject({ purpose: 'PEST_CONTROL', targetPest: null, appliedBy: 'Muthu' });
  });

  it('BR-56k: the schema trims, caps purpose at 100 and targetPest/appliedBy at 200, and allows null only on PATCH', () => {
    const base = { ...VALID_BODY, appliedOn: '2026-01-01' };
    expect(createCropInputBody.parse({ ...base, appliedBy: '  Self  ' }).appliedBy).toBe('Self');
    expect(createCropInputBody.safeParse({ ...base, purpose: 'p'.repeat(100) }).success).toBe(true);
    expect(createCropInputBody.safeParse({ ...base, purpose: 'p'.repeat(101) }).success).toBe(false);
    expect(createCropInputBody.safeParse({ ...base, targetPest: 't'.repeat(201) }).success).toBe(false);
    expect(createCropInputBody.safeParse({ ...base, appliedBy: 'a'.repeat(201) }).success).toBe(false);
    expect(createCropInputBody.safeParse({ ...base, appliedBy: null }).success).toBe(false);
    expect(updateCropInputBody.safeParse({ purpose: null, targetPest: null, appliedBy: null }).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// BR-56h: GET /farmers/me/crop-inputs — the farm-wide list across all own crops
// ---------------------------------------------------------------------------

function seedInput(
  state: FakeDbState,
  fields: Partial<CropInputRecord> & Pick<CropInputRecord, 'farmerId' | 'farmCropId' | 'appliedOn'>,
): CropInputRecord {
  const rec: CropInputRecord & { deletedAt: string | null } = {
    id: newId(),
    inputType: 'FERTILIZER',
    inputName: 'Urea',
    quantity: 10,
    unit: 'KG',
    nitrogenPct: null,
    phosphorusPct: null,
    potassiumPct: null,
    applicationMethod: null,
    costInr: null,
    notes: null,
    purpose: null,
    targetPest: null,
    appliedBy: null,
    createdAt: '2026-01-01T00:00:00.000000Z',
    updatedAt: null,
    ...fields,
    deletedAt: null,
  };
  state.inputs.set(rec.id, rec);
  return rec;
}

describe('Farm-wide crop input list (BR-56h)', () => {
  it('BR-56h: lists only the caller farmer\'s own inputs, across every own crop including a HARVESTED one, with cropName and plotName', async () => {
    const { service, state } = createTestContext();
    const live = seedInput(state, { farmerId: FARMER_A, farmCropId: CROP_A, appliedOn: '2026-03-02', costInr: parseMoney('120.50') });
    const harvested = seedInput(state, { farmerId: FARMER_A, farmCropId: CROP_A_HARVESTED, appliedOn: '2026-01-15' });
    const other = seedInput(state, { farmerId: FARMER_B, farmCropId: CROP_B, appliedOn: '2026-03-03' });

    const page = await service.listFarmCropInputs(farmerScope(FARMER_A), { limit: 20 });

    expect(page.items.map((i) => i.id)).toEqual([live.id, harvested.id]);
    expect(page.items.some((i) => i.id === other.id)).toBe(false);
    expect(page.items[0]).toMatchObject({
      farmCropId: CROP_A,
      cropName: 'Carrot',
      plotName: 'North Terrace',
      costInr: '120.50',
    });
    expect(page.items[1]).toMatchObject({ farmCropId: CROP_A_HARVESTED, cropName: 'Cabbage', plotName: 'South Terrace' });
    expect(page.page).toEqual({ nextCursor: null, hasMore: false });
    // The farmer id comes from the resolved scope, never from the request.
    expect(state.farmListCalls.map((c) => c.farmerId)).toEqual([FARMER_A]);
  });

  it('BR-56h: newest appliedOn first, ties broken by createdAt then id, and the cursor pages without gaps or repeats', async () => {
    const { service, state } = createTestContext();
    const scope = farmerScope(FARMER_A);
    const sameInstant = '2026-02-10T08:00:00.123456Z';
    const seeded = [
      seedInput(state, { farmerId: FARMER_A, farmCropId: CROP_A, appliedOn: '2026-02-01', createdAt: '2026-02-01T00:00:00.000000Z' }),
      seedInput(state, { farmerId: FARMER_A, farmCropId: CROP_A, appliedOn: '2026-02-10', createdAt: sameInstant }),
      seedInput(state, { farmerId: FARMER_A, farmCropId: CROP_A_HARVESTED, appliedOn: '2026-02-10', createdAt: sameInstant }),
      seedInput(state, { farmerId: FARMER_A, farmCropId: CROP_A, appliedOn: '2026-02-10', createdAt: '2026-02-11T00:00:00.000000Z' }),
      seedInput(state, { farmerId: FARMER_A, farmCropId: CROP_A_HARVESTED, appliedOn: '2026-01-05', createdAt: '2026-03-01T00:00:00.000000Z' }),
    ];
    const expected = [...seeded].sort(compareNewestFirst).map((r) => r.id);

    const seen: string[] = [];
    let cursor: string | undefined;
    let pages = 0;
    do {
      const page = await service.listFarmCropInputs(scope, { limit: 2, ...(cursor ? { cursor } : {}) });
      seen.push(...page.items.map((i) => i.id));
      expect(page.page.hasMore).toBe(page.page.nextCursor !== null);
      cursor = page.page.nextCursor ?? undefined;
      pages += 1;
    } while (cursor !== undefined && pages < 10);

    expect(pages).toBe(3);
    expect(seen).toEqual(expected);
    // appliedOn dominates createdAt: the 2026-01-05 row created last is still last.
    expect(seen[seen.length - 1]).toBe(seeded[4]!.id);
    // The opaque cursor decodes back to exactly the (appliedOn, createdAt, id) the repo returned.
    const second = state.farmListCalls[1]!.cursor!;
    const firstPageLast = expected[1]!;
    expect(second.id).toBe(firstPageLast);
    expect(second.appliedOn).toBe(state.inputs.get(firstPageLast)!.appliedOn);
    expect(second.createdAt).toBe(state.inputs.get(firstPageLast)!.createdAt);
  });

  it('BR-56h: inputType, from and to filter the list (both bounds inclusive)', async () => {
    const { service, state } = createTestContext();
    const scope = farmerScope(FARMER_A);
    const jan = seedInput(state, { farmerId: FARMER_A, farmCropId: CROP_A, appliedOn: '2026-01-31', inputType: 'MANURE' });
    const feb1 = seedInput(state, { farmerId: FARMER_A, farmCropId: CROP_A_HARVESTED, appliedOn: '2026-02-01', inputType: 'PESTICIDE' });
    const feb28 = seedInput(state, { farmerId: FARMER_A, farmCropId: CROP_A, appliedOn: '2026-02-28', inputType: 'MANURE' });
    seedInput(state, { farmerId: FARMER_A, farmCropId: CROP_A, appliedOn: '2026-03-01', inputType: 'MANURE' });

    const feb = await service.listFarmCropInputs(scope, { limit: 20, from: '2026-02-01', to: '2026-02-28' });
    expect(feb.items.map((i) => i.id)).toEqual([feb28.id, feb1.id]);

    const manureToFeb = await service.listFarmCropInputs(scope, { limit: 20, inputType: 'MANURE', to: '2026-02-28' });
    expect(manureToFeb.items.map((i) => i.id)).toEqual([feb28.id, jan.id]);

    expect(state.farmListCalls[1]!.filters).toEqual({ inputType: 'MANURE', to: '2026-02-28' });
  });

  it('BR-56h: a farmer with no inputs (or another farmer\'s only) gets an empty page, not a 403 or 404', async () => {
    const { service, state } = createTestContext();
    seedInput(state, { farmerId: FARMER_A, farmCropId: CROP_A, appliedOn: '2026-02-01' });

    const page = await service.listFarmCropInputs(farmerScope(FARMER_B), { limit: 20 });
    expect(page).toEqual({ items: [], page: { nextCursor: null, hasMore: false } });
  });

  it('BR-56h: a scope with no farmer identity is 403 FORBIDDEN, and a tampered cursor is 422 VALIDATION_FAILED', async () => {
    const { service } = createTestContext();
    const noFarmer = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.FARMER, permission: 'farmer.crop_input.manage_own' });
    await expectAppError(service.listFarmCropInputs(noFarmer, { limit: 20 }), 'FORBIDDEN', 403);

    const scope = farmerScope(FARMER_A);
    for (const cursor of ['not-a-cursor', Buffer.from('["2026-02-30","2026-01-01T00:00:00Z","x"]').toString('base64url')]) {
      await expectAppError(service.listFarmCropInputs(scope, { limit: 20, cursor }), 'VALIDATION_FAILED', 422);
    }
  });

  it('BR-56h: the query is strict: limit 1..100 (default 20), real calendar dates, from <= to, a known inputType, no farmerId', () => {
    const ok = (q: Record<string, unknown>) => listFarmCropInputsQuery.safeParse(q).success;

    expect(listFarmCropInputsQuery.parse({})).toEqual({ limit: 20 });
    expect(ok({ limit: '100', inputType: 'BIO_INPUT', from: '2026-02-01', to: '2026-02-01' })).toBe(true);
    expect(ok({ limit: '0' })).toBe(false);
    expect(ok({ limit: '101' })).toBe(false);
    expect(ok({ from: '2026-02-30' })).toBe(false);
    expect(ok({ to: '2026/02/01' })).toBe(false);
    expect(ok({ from: '2026-03-01', to: '2026-02-01' })).toBe(false);
    expect(ok({ inputType: 'SEED' })).toBe(false);
    expect(ok({ farmerId: FARMER_B })).toBe(false);
  });

  describe('route', () => {
    const app = express();
    app.use('/v1/farmers/me', cropInputsRouter);
    app.use(notFoundHandler);
    app.use(errorHandler);
    const PATH = '/v1/farmers/me/crop-inputs';
    const token = (code: RoleCode, farmerId: string | null = null) =>
      `Bearer ${signAccessToken({ sub: newId(), roles: [{ code }], farmerId, customerId: null })}`;

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('BR-56h: 401 without a token; 403 for CUSTOMER and every admin role (farmer.crop_input.manage_own = none)', async () => {
      const spy = vi.spyOn(cropInputsService, 'listFarmCropInputs');
      expect((await request(app).get(PATH)).status).toBe(401);
      for (const code of [RoleCode.CUSTOMER, RoleCode.SUPER_ADMIN, RoleCode.TOHFA_ADMIN, RoleCode.FARMER_ADMIN]) {
        const res = await request(app).get(PATH).set('Authorization', token(code));
        expect(res.status, code).toBe(403);
        expect(res.body.code).toBe('FORBIDDEN');
      }
      expect(spy).not.toHaveBeenCalled();
    });

    it('BR-56h: a FARMER is served with the farmerId from their own token and the parsed query; a bad query is 422', async () => {
      const body = { items: [], page: { nextCursor: null, hasMore: false } };
      const spy = vi.spyOn(cropInputsService, 'listFarmCropInputs').mockResolvedValue(body);
      const auth = token(RoleCode.FARMER, FARMER_A);

      const res = await request(app)
        .get(`${PATH}?limit=5&inputType=MANURE&from=2026-01-01&to=2026-02-01`)
        .set('Authorization', auth);
      expect(res.status).toBe(200);
      expect(res.body).toEqual(body);
      expect(spy).toHaveBeenCalledTimes(1);
      const [scope, query] = spy.mock.calls[0]!;
      expect(scope.farmerId).toBe(FARMER_A);
      expect(query).toEqual({ limit: 5, inputType: 'MANURE', from: '2026-01-01', to: '2026-02-01' });

      for (const bad of ['limit=101', 'from=2026-02-30', 'inputType=SEED', `farmerId=${FARMER_B}`, 'from=2026-03-01&to=2026-02-01']) {
        const r = await request(app).get(`${PATH}?${bad}`).set('Authorization', auth);
        expect(r.status, bad).toBe(422);
      }
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});

// ---------------------------------------------------------------------------
// PostgreSQL: the SQL itself (owner join, cost as text), not a fake repo
// ---------------------------------------------------------------------------

class RollbackFixture extends Error {}

describeIfDatabase('Crop Inputs (PostgreSQL)', () => {
  let ready = false;

  beforeAll(async () => {
    ready = await databaseReady('crop_inputs');
  });

  afterAll(async () => {
    if (!ready) return;
    const { closePool } = await import('../../db/pool.js');
    await closePool();
  });

  /** Runs `fn` in a real transaction and always rolls it back, so no fixture rows survive. */
  async function inRolledBackTx(fn: (tx: Executor) => Promise<void>): Promise<void> {
    const { withTransaction } = await import('../../db/pool.js');
    await withTransaction(async (tx) => {
      await fn(tx);
      throw new RollbackFixture();
    }).catch((error: unknown) => {
      if (!(error instanceof RollbackFixture)) throw error;
    });
  }

  async function seedFarmCrop(tx: Executor, label: string) {
    const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const user = await tx.query<{ id: string }>(
      `INSERT INTO users (mobile, full_name, user_type, status)
       VALUES ($1, $2, 'FARMER', 'ACTIVE') RETURNING id`,
      [`+9199${stamp.slice(-8)}`, `CI ${label}`],
    );
    const userId = user.rows[0]!.id;
    const farmer = await tx.query<{ id: string }>(
      `INSERT INTO farmers (user_id, tohfa_farmer_id) VALUES ($1, $2) RETURNING id`,
      [userId, `TF-CI-${label}-${stamp}`],
    );
    const farmerId = farmer.rows[0]!.id;
    const farm = await tx.query<{ id: string }>(
      `INSERT INTO farms (farmer_id, name) VALUES ($1, 'CI farm') RETURNING id`,
      [farmerId],
    );
    const plot = await tx.query<{ id: string }>(
      `INSERT INTO plots (farm_id, name) VALUES ($1, 'CI plot') RETURNING id`,
      [farm.rows[0]!.id],
    );
    const farmCrop = await tx.query<{ id: string }>(
      `INSERT INTO farm_crops (plot_id, crop_id, planted_on)
       VALUES ($1, (SELECT id FROM crop_master ORDER BY slug LIMIT 1), '2026-01-01') RETURNING id`,
      [plot.rows[0]!.id],
    );
    return { userId, farmerId, farmCropId: farmCrop.rows[0]!.id, plotId: plot.rows[0]!.id };
  }

  it('BR-56d (PostgreSQL): the owner join finds a crop for its own farmer and for nobody else, live crops only', async () => {
    if (!ready) return;
    const { cropInputsRepo } = await import('./crop-inputs.repo.js');
    await inRolledBackTx(async (tx) => {
      const a = await seedFarmCrop(tx, 'A');
      const b = await seedFarmCrop(tx, 'B');

      expect(await cropInputsRepo.checkFarmCropBelongsToFarmer(tx, a.farmerId, a.farmCropId)).toBe(true);
      expect(await cropInputsRepo.checkFarmCropBelongsToFarmer(tx, b.farmerId, a.farmCropId)).toBe(false);
      expect(await cropInputsRepo.checkFarmCropBelongsToFarmer(tx, a.farmerId, b.farmCropId)).toBe(false);

      await tx.query(`UPDATE farm_crops SET deleted_at = now() WHERE id = $1`, [a.farmCropId]);
      expect(await cropInputsRepo.checkFarmCropBelongsToFarmer(tx, a.farmerId, a.farmCropId)).toBe(false);
    });
  });

  it('BR-56d (PostgreSQL): through the real service and repo, another farmer gets 404 NOT_FOUND and sees no input', async () => {
    if (!ready) return;
    const { cropInputsRepo } = await import('./crop-inputs.repo.js');
    await inRolledBackTx(async (tx) => {
      const a = await seedFarmCrop(tx, 'A');
      const b = await seedFarmCrop(tx, 'B');
      const service = createCropInputsService({ repo: cropInputsRepo, db: tx, runTx: async (fn) => fn(tx) });
      const scopeA = farmerScope(a.farmerId);
      scopeA.userId = a.userId;
      const scopeB = farmerScope(b.farmerId);
      scopeB.userId = b.userId;

      const created = await service.createCropInput(scopeA, a.farmCropId, {
        ...VALID_BODY,
        appliedOn: '2026-01-02',
      });

      await expectAppError(service.getCropInput(scopeB, a.farmCropId, created.id), 'NOT_FOUND', 404);
      await expectAppError(service.listCropInputs(scopeB, a.farmCropId, { limit: 20 }), 'NOT_FOUND', 404);
      // Even with its own crop id, B cannot reach A's input row.
      await expectAppError(service.getCropInput(scopeB, b.farmCropId, created.id), 'NOT_FOUND', 404);
      await expectAppError(service.deleteCropInput(scopeB, b.farmCropId, created.id), 'NOT_FOUND', 404);
    });
  });

  it('BR-56f (PostgreSQL): cost round-trips as a 2dp string and the total is summed in paise', async () => {
    if (!ready) return;
    const { cropInputsRepo } = await import('./crop-inputs.repo.js');
    await inRolledBackTx(async (tx) => {
      const a = await seedFarmCrop(tx, 'A');
      const service = createCropInputsService({ repo: cropInputsRepo, db: tx, runTx: async (fn) => fn(tx) });
      const scope = farmerScope(a.farmerId);
      scope.userId = a.userId;

      const first = await service.createCropInput(scope, a.farmCropId, {
        ...VALID_BODY,
        appliedOn: '2026-01-02',
        costInr: '0.1',
      });
      expect(first.costInr).toBe('0.10');
      await service.createCropInput(scope, a.farmCropId, { ...VALID_BODY, appliedOn: '2026-01-02', costInr: '0.20' });
      await service.createCropInput(scope, a.farmCropId, { ...VALID_BODY, appliedOn: '2026-01-02' });

      const contribution = await service.getNpkContribution(scope, a.farmCropId);
      expect(contribution.totalCostInr).toBe('0.30');
      expect(contribution.totalInputsCount).toBe(3);

      const cleared = await service.updateCropInput(scope, a.farmCropId, first.id, { costInr: null });
      expect(cleared.costInr).toBeNull();
    });
  });

  it('BR-56j/BR-56k (PostgreSQL): FERTIGATION and purpose/targetPest/appliedBy round-trip through the real columns', async () => {
    if (!ready) return;
    const { cropInputsRepo } = await import('./crop-inputs.repo.js');
    await inRolledBackTx(async (tx) => {
      const a = await seedFarmCrop(tx, 'K');
      const service = createCropInputsService({ repo: cropInputsRepo, db: tx, runTx: async (fn) => fn(tx) });
      const scope = farmerScope(a.farmerId);
      scope.userId = a.userId;

      const created = await service.createCropInput(scope, a.farmCropId, {
        ...VALID_BODY,
        inputType: 'FERTIGATION',
        appliedOn: '2026-01-02',
        purpose: 'GROWTH',
        targetPest: 'APHIDS',
        appliedBy: 'Self',
      });
      expect(created).toMatchObject({ inputType: 'FERTIGATION', purpose: 'GROWTH', targetPest: 'APHIDS', appliedBy: 'Self' });

      const read = await service.getCropInput(scope, a.farmCropId, created.id);
      expect(read).toMatchObject({ purpose: 'GROWTH', targetPest: 'APHIDS', appliedBy: 'Self' });

      const patched = await service.updateCropInput(scope, a.farmCropId, created.id, { targetPest: null });
      expect(patched.targetPest).toBeNull();

      const farmWide = await service.listFarmCropInputs(scope, { limit: 20, inputType: 'FERTIGATION' });
      expect(farmWide.items.map((i) => i.id)).toEqual([created.id]);
      expect(farmWide.items[0]).toMatchObject({ purpose: 'GROWTH', appliedBy: 'Self' });
    });
  });

  it('BR-56i (PostgreSQL): a replayed Idempotency-Key against the real idempotency_keys table creates one row', async () => {
    if (!ready) return;
    const { cropInputsRepo } = await import('./crop-inputs.repo.js');
    const { idempotencyStore } = await import('../../http/idempotency.js');
    await inRolledBackTx(async (tx) => {
      const a = await seedFarmCrop(tx, 'I');
      const service = createCropInputsService({
        repo: cropInputsRepo,
        db: tx,
        runTx: async (fn) => fn(tx),
        idempotency: idempotencyStore,
      });
      const scope = farmerScope(a.farmerId);
      scope.userId = a.userId;
      const key = newId();

      const first = await service.createCropInput(scope, a.farmCropId, { ...VALID_BODY, appliedOn: '2026-01-02' }, key);
      const again = await service.createCropInput(scope, a.farmCropId, { ...VALID_BODY, appliedOn: '2026-01-02' }, key);
      expect(again.id).toBe(first.id);

      const page = await service.listCropInputs(scope, a.farmCropId, { limit: 20 });
      expect(page.items).toHaveLength(1);
    });
  });

  /** A second planting on an existing plot (status HARVESTED by default: no longer an active crop). */
  async function addFarmCrop(tx: Executor, plotId: string, status = 'HARVESTED'): Promise<string> {
    const row = await tx.query<{ id: string }>(
      `INSERT INTO farm_crops (plot_id, crop_id, planted_on, actual_harvest_on, status)
       VALUES ($1, (SELECT id FROM crop_master ORDER BY slug LIMIT 1), '2025-06-01', '2025-12-01', $2) RETURNING id`,
      [plotId, status],
    );
    return row.rows[0]!.id;
  }

  /** Inserts directly so created_at can be pinned; inside one transaction now() is constant, which is exactly the tie we want to page across. */
  async function insertInput(
    tx: Executor,
    farmerId: string,
    farmCropId: string,
    appliedOn: string,
    opts: { inputType?: string; createdAt?: string; costInr?: string } = {},
  ): Promise<string> {
    const row = await tx.query<{ id: string }>(
      `INSERT INTO crop_inputs (farmer_id, farm_crop_id, input_type, input_name, applied_on, quantity, unit, cost_inr, created_at)
       VALUES ($1, $2, $3, 'Fixture input', $4, 1, 'KG', $5, COALESCE($6::timestamptz, now())) RETURNING id`,
      [farmerId, farmCropId, opts.inputType ?? 'FERTILIZER', appliedOn, opts.costInr ?? null, opts.createdAt ?? null],
    );
    return row.rows[0]!.id;
  }

  it('BR-56h (PostgreSQL): own rows only, across live and HARVESTED crops, with cropName/plotName, newest first and stable across pages', async () => {
    if (!ready) return;
    const { cropInputsRepo } = await import('./crop-inputs.repo.js');
    await inRolledBackTx(async (tx) => {
      const a = await seedFarmCrop(tx, 'A');
      const b = await seedFarmCrop(tx, 'B');
      const harvestedCropId = await addFarmCrop(tx, a.plotId);
      const service = createCropInputsService({ repo: cropInputsRepo, db: tx, runTx: async (fn) => fn(tx) });
      const scopeA = farmerScope(a.farmerId);
      scopeA.userId = a.userId;

      // Three rows share appliedOn AND created_at (now() in this tx): only the id separates them.
      const tied = [
        await insertInput(tx, a.farmerId, a.farmCropId, '2026-02-10'),
        await insertInput(tx, a.farmerId, harvestedCropId, '2026-02-10'),
        await insertInput(tx, a.farmerId, a.farmCropId, '2026-02-10'),
      ];
      const newerCreated = await insertInput(tx, a.farmerId, a.farmCropId, '2026-02-10', { createdAt: '2099-01-01T00:00:00Z' });
      const oldest = await insertInput(tx, a.farmerId, harvestedCropId, '2025-07-01', { costInr: '0.1' });
      const newest = await insertInput(tx, a.farmerId, a.farmCropId, '2026-03-01');
      const deleted = await insertInput(tx, a.farmerId, a.farmCropId, '2026-03-02');
      await tx.query(`UPDATE crop_inputs SET deleted_at = now() WHERE id = $1`, [deleted]);
      const otherFarmers = await insertInput(tx, b.farmerId, b.farmCropId, '2026-03-05');

      const expected = [newest, newerCreated, ...[...tied].sort().reverse(), oldest];

      const seen: string[] = [];
      const pages: Array<Awaited<ReturnType<typeof service.listFarmCropInputs>>> = [];
      let cursor: string | undefined;
      do {
        const page = await service.listFarmCropInputs(scopeA, { limit: 2, ...(cursor ? { cursor } : {}) });
        pages.push(page);
        seen.push(...page.items.map((i) => i.id));
        cursor = page.page.nextCursor ?? undefined;
      } while (cursor !== undefined && pages.length < 10);

      expect(seen).toEqual(expected);
      expect(pages.map((p) => p.page.hasMore)).toEqual([true, true, false]);
      expect(seen).not.toContain(otherFarmers);
      expect(seen).not.toContain(deleted);

      const all = pages.flatMap((p) => p.items);
      const harvestedRow = all.find((i) => i.id === oldest)!;
      expect(harvestedRow).toMatchObject({
        farmerId: a.farmerId,
        farmCropId: harvestedCropId,
        plotName: 'CI plot',
        appliedOn: '2025-07-01',
        costInr: '0.10',
      });
      expect(typeof harvestedRow.cropName).toBe('string');
      expect(harvestedRow.cropName.length).toBeGreaterThan(0);

      // B, asking the same farm-wide endpoint, sees only its own row: never A's, never a 403.
      const scopeB = farmerScope(b.farmerId);
      expect((await service.listFarmCropInputs(scopeB, { limit: 20 })).items.map((i) => i.id)).toEqual([otherFarmers]);
    });
  });

  it('BR-56h (PostgreSQL): inputType and inclusive from/to filters, and an empty page for a farmer with no inputs', async () => {
    if (!ready) return;
    const { cropInputsRepo } = await import('./crop-inputs.repo.js');
    await inRolledBackTx(async (tx) => {
      const a = await seedFarmCrop(tx, 'A');
      const empty = await seedFarmCrop(tx, 'E');
      const harvestedCropId = await addFarmCrop(tx, a.plotId);
      const service = createCropInputsService({ repo: cropInputsRepo, db: tx, runTx: async (fn) => fn(tx) });
      const scope = farmerScope(a.farmerId);

      const jan31 = await insertInput(tx, a.farmerId, a.farmCropId, '2026-01-31', { inputType: 'MANURE' });
      const feb1 = await insertInput(tx, a.farmerId, harvestedCropId, '2026-02-01', { inputType: 'PESTICIDE' });
      const feb28 = await insertInput(tx, a.farmerId, harvestedCropId, '2026-02-28', { inputType: 'MANURE' });
      await insertInput(tx, a.farmerId, a.farmCropId, '2026-03-01', { inputType: 'MANURE' });

      const ids = async (q: Parameters<typeof service.listFarmCropInputs>[1]) =>
        (await service.listFarmCropInputs(scope, q)).items.map((i) => i.id);

      expect(await ids({ limit: 20, from: '2026-02-01', to: '2026-02-28' })).toEqual([feb28, feb1]);
      expect(await ids({ limit: 20, inputType: 'MANURE', to: '2026-02-28' })).toEqual([feb28, jan31]);
      expect(await ids({ limit: 20, inputType: 'BIO_INPUT' })).toEqual([]);

      expect(await service.listFarmCropInputs(farmerScope(empty.farmerId), { limit: 20 })).toEqual({
        items: [],
        page: { nextCursor: null, hasMore: false },
      });
    });
  });
});
