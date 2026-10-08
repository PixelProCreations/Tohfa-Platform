import { describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, IDS, newId } from '../../test/factories.js';
import type {
  TreePlantingCursor,
  TreePlantingRecord,
  TreePlantingsRepo,
} from './tree-plantings.repo.js';
import { createTreePlantingsService } from './tree-plantings.service.js';

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
const FARM_A = '60000000-0000-4000-8000-00000000000a';
const PLOT_A = '70000000-0000-4000-8000-00000000000a';

function farmerScope(farmerId: string, permission = 'farmer.tree_planting.manage_own'): ResolvedScope {
  return aScope({
    level: ScopeLevel.OWN,
    farmerId,
    userId: newId(),
    roleCode: RoleCode.FARMER,
    permission,
  });
}

interface FakeDbState {
  plantings: Map<string, TreePlantingRecord & { deletedAt: string | null }>;
  audits: unknown[][];
  lockedFarmers: string[];
}

function createFakeRepo(state: FakeDbState): TreePlantingsRepo {
  return {
    async lockFarmer(_db, farmerId) {
      state.lockedFarmers.push(farmerId);
    },

    async findTreePlantingById(_db, farmerId, id) {
      const rec = state.plantings.get(id);
      if (!rec || rec.farmerId !== farmerId || rec.deletedAt !== null) {
        return null;
      }
      return { ...rec };
    },

    async listTreePlantings(_db, farmerId, limit, cursor) {
      const all = Array.from(state.plantings.values())
        .filter((r) => r.farmerId === farmerId && r.deletedAt === null)
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
      let next: TreePlantingCursor | null = null;
      if (hasMore && items.length > 0) {
        const last = items[items.length - 1];
        if (last) {
          next = { createdAt: last.createdAt, id: last.id };
        }
      }

      return { items, next };
    },

    async createTreePlanting(_db, farmerId, data) {
      const id = newId();
      const rec: TreePlantingRecord & { deletedAt: string | null } = {
        id,
        farmerId,
        farmId: data.farmId ?? null,
        plotId: data.plotId ?? null,
        speciesName: data.speciesName,
        treeCount: data.treeCount,
        plantedOn: data.plantedOn ?? null,
        zoneName: data.zoneName ?? null,
        purpose: data.purpose ?? null,
        notes: data.notes ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        deletedAt: null,
      };
      state.plantings.set(id, rec);
      return { ...rec };
    },

    async updateTreePlanting(_db, farmerId, id, patch) {
      const rec = state.plantings.get(id);
      if (!rec || rec.farmerId !== farmerId || rec.deletedAt !== null) {
        return null;
      }
      if ('farmId' in patch) rec.farmId = patch.farmId ?? null;
      if ('plotId' in patch) rec.plotId = patch.plotId ?? null;
      if ('speciesName' in patch && patch.speciesName !== undefined) rec.speciesName = patch.speciesName;
      if ('treeCount' in patch && patch.treeCount !== undefined) rec.treeCount = patch.treeCount;
      if ('plantedOn' in patch) rec.plantedOn = patch.plantedOn ?? null;
      if ('zoneName' in patch) rec.zoneName = patch.zoneName ?? null;
      if ('purpose' in patch) rec.purpose = patch.purpose ?? null;
      if ('notes' in patch) rec.notes = patch.notes ?? null;
      rec.updatedAt = new Date().toISOString();
      return { ...rec };
    },

    async softDeleteTreePlanting(_db, farmerId, id) {
      const rec = state.plantings.get(id);
      if (!rec || rec.farmerId !== farmerId || rec.deletedAt !== null) {
        return false;
      }
      rec.deletedAt = new Date().toISOString();
      return true;
    },

    async checkFarmBelongsToFarmer(_db, farmerId, farmId) {
      return farmId === FARM_A && farmerId === FARMER_A;
    },

    async checkPlotBelongsToFarmer(_db, farmerId, plotId) {
      return plotId === PLOT_A && farmerId === FARMER_A;
    },
  };
}

function createTestContext() {
  const state: FakeDbState = {
    plantings: new Map(),
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
  const service = createTreePlantingsService({
    repo,
    db: fakeTx,
    runTx: async (fn) => fn(fakeTx),
  });

  return { state, repo, service, audits: state.audits };
}

describe('Tree Plantings (BR-55)', () => {
  it('BR-55a rejects treeCount <= 0 or non-integer with VALIDATION_FAILED', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    await expect(
      service.createTreePlanting(scope, {
        speciesName: 'Teak',
        treeCount: 0,
      }),
    ).rejects.toThrowError(AppError);

    await expect(
      service.createTreePlanting(scope, {
        speciesName: 'Teak',
        treeCount: -10,
      }),
    ).rejects.toThrowError(AppError);

    await expect(
      service.createTreePlanting(scope, {
        speciesName: 'Teak',
        treeCount: 4.5,
      }),
    ).rejects.toThrowError(AppError);
  });

  it('BR-55b rejects plantedOn date in the future with VALIDATION_FAILED', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    const futureDate = addDays(todayIst(), 2);
    await expect(
      service.createTreePlanting(scope, {
        speciesName: 'Mango',
        treeCount: 15,
        plantedOn: futureDate,
      }),
    ).rejects.toThrowError(AppError);

    // Past date and today succeed
    const pastDate = addDays(todayIst(), -30);
    const createdPast = await service.createTreePlanting(scope, {
      speciesName: 'Mango',
      treeCount: 15,
      plantedOn: pastDate,
    });
    expect(createdPast.plantedOn).toBe(pastDate);

    const todayDate = todayIst();
    const createdToday = await service.createTreePlanting(scope, {
      speciesName: 'Mango',
      treeCount: 20,
      plantedOn: todayDate,
    });
    expect(createdToday.plantedOn).toBe(todayDate);
  });

  it("BR-55c ensures cross-farmer access to another farmer's planting returns 404 (BR-36)", async () => {
    const { service } = createTestContext();
    const scopeA = farmerScope(FARMER_A);
    const scopeB = farmerScope(FARMER_B);

    const planting = await service.createTreePlanting(scopeA, {
      speciesName: 'Silver Oak',
      treeCount: 50,
    });

    // Farmer B cannot read Farmer A's planting
    await expect(service.getTreePlanting(scopeB, planting.id)).rejects.toThrowError(AppError);

    // Farmer B cannot update Farmer A's planting
    await expect(
      service.updateTreePlanting(scopeB, planting.id, {
        speciesName: 'Hacked Oak',
      }),
    ).rejects.toThrowError(AppError);

    // Farmer B cannot delete Farmer A's planting
    await expect(service.deleteTreePlanting(scopeB, planting.id)).rejects.toThrowError(AppError);
  });

  it('BR-55d soft-delete sets deleted_at and excludes record from list', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    const planting = await service.createTreePlanting(scope, {
      speciesName: 'Neem',
      treeCount: 10,
    });

    const beforeDelete = await service.listTreePlantings(scope, { limit: 20 });
    expect(beforeDelete.items.some((i) => i.id === planting.id)).toBe(true);

    await service.deleteTreePlanting(scope, planting.id);

    const afterDelete = await service.listTreePlantings(scope, { limit: 20 });
    expect(afterDelete.items.some((i) => i.id === planting.id)).toBe(false);

    // Direct get also 404s
    await expect(service.getTreePlanting(scope, planting.id)).rejects.toThrowError(AppError);
  });

  it('BR-55e records audit log entries and locks farmer row on mutations (BR-35)', async () => {
    const { service, audits, state } = createTestContext();
    const scope = farmerScope(FARMER_A);

    const created = await service.createTreePlanting(scope, {
      speciesName: 'Sandalwood',
      treeCount: 5,
    });
    expect(state.lockedFarmers).toContain(FARMER_A);
    expect(audits.length).toBe(1);
    expect(audits[0]?.[3]).toBe('tree_planting.create');
    expect(audits[0]?.[4]).toBe('tree_planting');
    expect(audits[0]?.[5]).toBe(created.id);

    const updated = await service.updateTreePlanting(scope, created.id, {
      treeCount: 8,
    });
    expect(updated.treeCount).toBe(8);
    expect(audits.length).toBe(2);
    expect(audits[1]?.[3]).toBe('tree_planting.update');
    expect(audits[1]?.[4]).toBe('tree_planting');
    expect(audits[1]?.[5]).toBe(created.id);

    await service.deleteTreePlanting(scope, created.id);
    expect(audits.length).toBe(3);
    expect(audits[2]?.[3]).toBe('tree_planting.delete');
    expect(audits[2]?.[4]).toBe('tree_planting');
    expect(audits[2]?.[5]).toBe(created.id);
  });

  it('paginates tree plantings with cursor and limit', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    for (let i = 1; i <= 5; i++) {
      await service.createTreePlanting(scope, {
        speciesName: `Tree ${i}`,
        treeCount: i * 2,
      });
    }

    const page1 = await service.listTreePlantings(scope, { limit: 2 });
    expect(page1.items.length).toBe(2);
    expect(page1.page.hasMore).toBe(true);
    expect(page1.page.nextCursor).not.toBeNull();

    const page2 = await service.listTreePlantings(scope, {
      limit: 2,
      cursor: page1.page.nextCursor ?? undefined,
    });
    expect(page2.items.length).toBe(2);
    expect(page2.page.hasMore).toBe(true);

    const page3 = await service.listTreePlantings(scope, {
      limit: 2,
      cursor: page2.page.nextCursor ?? undefined,
    });
    expect(page3.items.length).toBe(1);
    expect(page3.page.hasMore).toBe(false);
    expect(page3.page.nextCursor).toBeNull();
  });
});
