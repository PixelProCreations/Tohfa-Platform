import { describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, IDS, newId } from '../../test/factories.js';
import type {
  CropInputCursor,
  CropInputRecord,
  CropInputsRepo,
} from './crop-inputs.repo.js';
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
        costInr: data.costInr ?? null,
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
      if ('costInr' in patch) rec.costInr = patch.costInr ?? null;
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

describe('Crop Inputs (BR-56)', () => {
  it('BR-56a rejects non-positive quantity with VALIDATION_FAILED', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    await expect(
      service.createCropInput(scope, CROP_A, {
        inputType: 'FERTILIZER',
        inputName: 'Urea',
        appliedOn: todayIst(),
        quantity: 0,
        unit: 'KG',
      }),
    ).rejects.toThrowError(AppError);

    await expect(
      service.createCropInput(scope, CROP_A, {
        inputType: 'FERTILIZER',
        inputName: 'Urea',
        appliedOn: todayIst(),
        quantity: -5,
        unit: 'KG',
      }),
    ).rejects.toThrowError(AppError);
  });

  it('BR-56b rejects appliedOn date in the future with VALIDATION_FAILED', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    const futureDate = addDays(todayIst(), 2);
    await expect(
      service.createCropInput(scope, CROP_A, {
        inputType: 'MANURE',
        inputName: 'Compost',
        appliedOn: futureDate,
        quantity: 50,
        unit: 'KG',
      }),
    ).rejects.toThrowError(AppError);
  });

  it('BR-56c rejects NPK percentages out of 0-100 range with VALIDATION_FAILED', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    await expect(
      service.createCropInput(scope, CROP_A, {
        inputType: 'FERTILIZER',
        inputName: 'NPK Mix',
        appliedOn: todayIst(),
        quantity: 10,
        unit: 'KG',
        nitrogenPct: 105,
      }),
    ).rejects.toThrowError(AppError);

    await expect(
      service.createCropInput(scope, CROP_A, {
        inputType: 'FERTILIZER',
        inputName: 'NPK Mix',
        appliedOn: todayIst(),
        quantity: 10,
        unit: 'KG',
        phosphorusPct: -2,
      }),
    ).rejects.toThrowError(AppError);
  });

  it('BR-56d ensures cross-farmer access returns 404 NOT_FOUND (BR-36)', async () => {
    const { service } = createTestContext();
    const scopeA = farmerScope(FARMER_A);
    const scopeB = farmerScope(FARMER_B);

    const input = await service.createCropInput(scopeA, CROP_A, {
      inputType: 'BIO_INPUT',
      inputName: 'Neem Cake',
      appliedOn: todayIst(),
      quantity: 20,
      unit: 'KG',
    });

    // Farmer B cannot access input under Crop A
    await expect(service.getCropInput(scopeB, CROP_A, input.id)).rejects.toThrowError(AppError);

    // Farmer B cannot list inputs for Crop A
    await expect(service.listCropInputs(scopeB, CROP_A, { limit: 20 })).rejects.toThrowError(AppError);

    // Farmer B cannot update input under Crop A
    await expect(
      service.updateCropInput(scopeB, CROP_A, input.id, {
        inputName: 'Hacked Input',
      }),
    ).rejects.toThrowError(AppError);

    // Farmer B cannot delete input under Crop A
    await expect(service.deleteCropInput(scopeB, CROP_A, input.id)).rejects.toThrowError(AppError);
  });

  it('BR-56e soft-delete removes input from lists and single get', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    const input = await service.createCropInput(scope, CROP_A, {
      inputType: 'FERTILIZER',
      inputName: 'DAP',
      appliedOn: todayIst(),
      quantity: 25,
      unit: 'KG',
    });

    const listBefore = await service.listCropInputs(scope, CROP_A, { limit: 10 });
    expect(listBefore.items.some((i) => i.id === input.id)).toBe(true);

    await service.deleteCropInput(scope, CROP_A, input.id);

    const listAfter = await service.listCropInputs(scope, CROP_A, { limit: 10 });
    expect(listAfter.items.some((i) => i.id === input.id)).toBe(false);

    await expect(service.getCropInput(scope, CROP_A, input.id)).rejects.toThrowError(AppError);
  });

  it('BR-56f calculates accurate cumulative NPK nutrient contribution', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    // 100 KG fertilizer with 20% N, 10% P, 5% K
    await service.createCropInput(scope, CROP_A, {
      inputType: 'FERTILIZER',
      inputName: 'NPK 20-10-5',
      appliedOn: todayIst(),
      quantity: 100,
      unit: 'KG',
      nitrogenPct: 20,
      phosphorusPct: 10,
      potassiumPct: 5,
      costInr: 1200,
    });

    // 1 BAG (50 KG) with 46% N (Urea)
    await service.createCropInput(scope, CROP_A, {
      inputType: 'FERTILIZER',
      inputName: 'Urea 46%',
      appliedOn: todayIst(),
      quantity: 1,
      unit: 'BAG',
      nitrogenPct: 46,
      phosphorusPct: 0,
      potassiumPct: 0,
      costInr: 300,
    });

    const contribution = await service.getNpkContribution(scope, CROP_A);

    // Total quantity = 100 KG + (1 bag * 50 kg) = 150 KG
    expect(contribution.totalQuantityKg).toBe(150);
    // Total Nitrogen = (100 * 0.20) + (50 * 0.46) = 20 + 23 = 43 KG
    expect(contribution.totalNitrogenKg).toBe(43);
    // Total Phosphorus = (100 * 0.10) + 0 = 10 KG
    expect(contribution.totalPhosphorusKg).toBe(10);
    // Total Potassium = (100 * 0.05) + 0 = 5 KG
    expect(contribution.totalPotassiumKg).toBe(5);
    // Total Cost = 1200 + 300 = 1500 INR
    expect(contribution.totalCostInr).toBe(1500);
    expect(contribution.totalInputsCount).toBe(2);
  });

  it('BR-56g locks farmer row and writes audit logs on create, update, delete (BR-35)', async () => {
    const { service, state, audits } = createTestContext();
    const scope = farmerScope(FARMER_A);

    const created = await service.createCropInput(scope, CROP_A, {
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

    const updated = await service.updateCropInput(scope, CROP_A, created.id, {
      quantity: 8,
    });
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
