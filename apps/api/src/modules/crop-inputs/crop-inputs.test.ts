import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { parseMoney, RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import type {
  CropInputCursor,
  CropInputRecord,
  CropInputsRepo,
} from './crop-inputs.repo.js';
import { createCropInputBody, updateCropInputBody } from './crop-inputs.schema.js';
import { createCropInputsService } from './crop-inputs.service.js';

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
}

function createFakeRepo(state: FakeDbState): CropInputsRepo {
  return {
    async lockFarmer(_db, farmerId) {
      state.lockedFarmers.push(farmerId);
    },

    async checkFarmCropBelongsToFarmer(_db, farmerId, farmCropId) {
      return (farmerId === FARMER_A && farmCropId === CROP_A) ||
             (farmerId === FARMER_B && farmCropId === CROP_B);
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

function createTestContext() {
  const state: FakeDbState = {
    inputs: new Map(),
    audits: [],
    lockedFarmers: [],
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
  });

  return { state, repo, service, audits: state.audits };
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
});
