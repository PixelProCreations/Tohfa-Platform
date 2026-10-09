import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool, type Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import { getTodayKolkata } from '../certifications/certifications.service.js';
import { treePlantingsRepo } from './tree-plantings.repo.js';
import type { TreePlantingCursor, TreePlantingRecord, TreePlantingsRepo } from './tree-plantings.repo.js';
import { createTreePlantingBody, updateTreePlantingBody } from './tree-plantings.schema.js';
import { createTreePlantingsService } from './tree-plantings.service.js';

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const FARMER_A = IDS.farmer;
const FARMER_B = '30000000-0000-4000-8000-000000000002';
const FARM_A1 = '60000000-0000-4000-8000-00000000000a';
const FARM_A2 = '60000000-0000-4000-8000-00000000000b';
const FARM_B = '60000000-0000-4000-8000-00000000000c';
const PLOT_A1 = '70000000-0000-4000-8000-00000000000a';
const PLOT_A2 = '70000000-0000-4000-8000-00000000000b';
const PLOT_B = '70000000-0000-4000-8000-00000000000c';

function farmerScope(farmerId: string): ResolvedScope {
  return aScope({
    level: ScopeLevel.OWN,
    farmerId,
    userId: newId(),
    roleCode: RoleCode.FARMER,
    permission: 'farmer.tree_planting.manage_own',
  });
}

interface FakeDbState {
  plantings: Map<string, TreePlantingRecord & { deletedAt: string | null }>;
  audits: unknown[][];
  lockedFarmers: string[];
}

/** Who owns which farm, and which farm each plot sits on. */
const FARM_OWNER = new Map([
  [FARM_A1, FARMER_A],
  [FARM_A2, FARMER_A],
  [FARM_B, FARMER_B],
]);
const PLOT_PLACEMENT = new Map([
  [PLOT_A1, { farmId: FARM_A1, farmerId: FARMER_A }],
  [PLOT_A2, { farmId: FARM_A2, farmerId: FARMER_A }],
  [PLOT_B, { farmId: FARM_B, farmerId: FARMER_B }],
]);

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
      const last = items[items.length - 1];
      if (hasMore && last) {
        next = { createdAt: last.createdAt, id: last.id };
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
      return FARM_OWNER.get(farmId) === farmerId;
    },

    async checkPlotBelongsToFarmer(_db, farmerId, plotId, farmId) {
      const plot = PLOT_PLACEMENT.get(plotId);
      return plot !== undefined && plot.farmerId === farmerId && (farmId === null || plot.farmId === farmId);
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

const NOT_FOUND = { code: 'NOT_FOUND', status: 404 };
const VALIDATION_FAILED = { code: 'VALIDATION_FAILED', status: 422 };

describe('Tree Plantings (BR-55)', () => {
  it('BR-55a: the request schemas reject treeCount <= 0 or non-integer', () => {
    for (const treeCount of [0, -10, 4.5]) {
      expect(createTreePlantingBody.safeParse({ speciesName: 'Teak', treeCount }).success).toBe(false);
      expect(updateTreePlantingBody.safeParse({ treeCount }).success).toBe(false);
    }
    expect(createTreePlantingBody.safeParse({ speciesName: 'Teak', treeCount: 1 }).success).toBe(true);
  });

  it('BR-55a: POST /v1/farmers/me/tree-plantings answers treeCount 0 with 422 VALIDATION_FAILED', async () => {
    const token = signAccessToken({
      sub: IDS.userFarmer,
      roles: [{ code: 'FARMER' }],
      farmerId: FARMER_A,
      customerId: null,
    });
    const res = await request(createApp())
      .post('/v1/farmers/me/tree-plantings')
      .set('Authorization', `Bearer ${token}`)
      .send({ speciesName: 'Teak', treeCount: 0 });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });

  it('BR-55b: plantedOn must be a real calendar date, not just four-two-two digits', () => {
    for (const plantedOn of ['2026-02-30', '2025-13-01', '2026-00-10', '2026-2-3', 'tomorrow']) {
      expect(createTreePlantingBody.safeParse({ speciesName: 'Teak', treeCount: 1, plantedOn }).success).toBe(false);
      expect(updateTreePlantingBody.safeParse({ plantedOn }).success).toBe(false);
    }
    expect(createTreePlantingBody.safeParse({ speciesName: 'Teak', treeCount: 1, plantedOn: '2024-02-29' }).success).toBe(
      true,
    );
    expect(updateTreePlantingBody.safeParse({ plantedOn: null }).success).toBe(true);
  });

  it('BR-55b: PATCH with an impossible plantedOn is answered 422 VALIDATION_FAILED', async () => {
    const token = signAccessToken({
      sub: IDS.userFarmer,
      roles: [{ code: 'FARMER' }],
      farmerId: FARMER_A,
      customerId: null,
    });
    const res = await request(createApp())
      .patch(`/v1/farmers/me/tree-plantings/${newId()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ plantedOn: '2026-02-30' });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });

  it('BR-55b: rejects plantedOn after today in Asia/Kolkata with 422 VALIDATION_FAILED, accepts today and the past', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);
    const today = getTodayKolkata();

    await expect(
      service.createTreePlanting(scope, { speciesName: 'Mango', treeCount: 15, plantedOn: addDays(today, 1) }),
    ).rejects.toMatchObject(VALIDATION_FAILED);

    const createdToday = await service.createTreePlanting(scope, { speciesName: 'Mango', treeCount: 20, plantedOn: today });
    expect(createdToday.plantedOn).toBe(today);
    const past = addDays(today, -30);
    const createdPast = await service.createTreePlanting(scope, { speciesName: 'Mango', treeCount: 15, plantedOn: past });
    expect(createdPast.plantedOn).toBe(past);

    await expect(
      service.updateTreePlanting(scope, createdToday.id, { plantedOn: addDays(today, 2) }),
    ).rejects.toMatchObject(VALIDATION_FAILED);
  });

  it("BR-55c: another farmer's planting is 404 NOT_FOUND on get, update and delete (BR-36)", async () => {
    const { service } = createTestContext();
    const scopeA = farmerScope(FARMER_A);
    const scopeB = farmerScope(FARMER_B);

    const planting = await service.createTreePlanting(scopeA, { speciesName: 'Silver Oak', treeCount: 50 });

    await expect(service.getTreePlanting(scopeB, planting.id)).rejects.toMatchObject(NOT_FOUND);
    await expect(
      service.updateTreePlanting(scopeB, planting.id, { speciesName: 'Hacked Oak' }),
    ).rejects.toMatchObject(NOT_FOUND);
    await expect(service.deleteTreePlanting(scopeB, planting.id)).rejects.toMatchObject(NOT_FOUND);

    // Nothing changed for the owner.
    expect((await service.getTreePlanting(scopeA, planting.id)).speciesName).toBe('Silver Oak');
  });

  it('BR-55c: a scope without a farmer identity is 403 FORBIDDEN', async () => {
    const { service } = createTestContext();
    const scope = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.FARMER, permission: 'farmer.tree_planting.manage_own' });
    await expect(service.listTreePlantings(scope, { limit: 20 })).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });
  });

  it('BR-55d: soft-delete sets deleted_at and excludes record from list and get', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    const planting = await service.createTreePlanting(scope, { speciesName: 'Neem', treeCount: 10 });

    const beforeDelete = await service.listTreePlantings(scope, { limit: 20 });
    expect(beforeDelete.items.some((i) => i.id === planting.id)).toBe(true);

    await service.deleteTreePlanting(scope, planting.id);

    const afterDelete = await service.listTreePlantings(scope, { limit: 20 });
    expect(afterDelete.items.some((i) => i.id === planting.id)).toBe(false);
    await expect(service.getTreePlanting(scope, planting.id)).rejects.toMatchObject(NOT_FOUND);
  });

  it('BR-55e: mutations lock the farmer row and write an audit entry (BR-35)', async () => {
    const { service, audits, state } = createTestContext();
    const scope = farmerScope(FARMER_A);

    const created = await service.createTreePlanting(scope, { speciesName: 'Sandalwood', treeCount: 5 });
    expect(state.lockedFarmers).toContain(FARMER_A);
    expect(audits.length).toBe(1);
    expect(audits[0]?.[3]).toBe('tree_planting.create');
    expect(audits[0]?.[4]).toBe('tree_planting');
    expect(audits[0]?.[5]).toBe(created.id);

    const updated = await service.updateTreePlanting(scope, created.id, { treeCount: 8 });
    expect(updated.treeCount).toBe(8);
    expect(audits.length).toBe(2);
    expect(audits[1]?.[3]).toBe('tree_planting.update');
    expect(audits[1]?.[5]).toBe(created.id);

    await service.deleteTreePlanting(scope, created.id);
    expect(audits.length).toBe(3);
    expect(audits[2]?.[3]).toBe('tree_planting.delete');
    expect(audits[2]?.[5]).toBe(created.id);
  });

  it("BR-55f: create is 404 NOT_FOUND for another farmer's farm, another farmer's plot, or a plot on a different farm", async () => {
    const { service, state } = createTestContext();
    const scope = farmerScope(FARMER_A);
    const base = { speciesName: 'Teak', treeCount: 3 };

    await expect(service.createTreePlanting(scope, { ...base, farmId: FARM_B })).rejects.toMatchObject(NOT_FOUND);
    await expect(service.createTreePlanting(scope, { ...base, farmId: FARM_A1, plotId: PLOT_B })).rejects.toMatchObject(
      NOT_FOUND,
    );
    await expect(service.createTreePlanting(scope, { ...base, plotId: PLOT_B })).rejects.toMatchObject(NOT_FOUND);
    // The caller's own plot, but on the caller's other farm.
    await expect(service.createTreePlanting(scope, { ...base, farmId: FARM_A1, plotId: PLOT_A2 })).rejects.toMatchObject(
      NOT_FOUND,
    );
    expect(state.plantings.size).toBe(0);

    const ok = await service.createTreePlanting(scope, { ...base, farmId: FARM_A1, plotId: PLOT_A1 });
    expect(ok.plotId).toBe(PLOT_A1);
  });

  it("BR-55f: update is 404 NOT_FOUND for another farmer's plot or farm, and for a farm change that strands the plot", async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);
    const planting = await service.createTreePlanting(scope, {
      speciesName: 'Teak',
      treeCount: 3,
      farmId: FARM_A1,
      plotId: PLOT_A1,
    });

    await expect(service.updateTreePlanting(scope, planting.id, { plotId: PLOT_B })).rejects.toMatchObject(NOT_FOUND);
    await expect(service.updateTreePlanting(scope, planting.id, { farmId: FARM_B })).rejects.toMatchObject(NOT_FOUND);
    await expect(service.updateTreePlanting(scope, planting.id, { plotId: PLOT_A2 })).rejects.toMatchObject(NOT_FOUND);
    // Moving to farm A2 while still pointing at A1's plot would leave the plot on a farm it does not belong to.
    await expect(service.updateTreePlanting(scope, planting.id, { farmId: FARM_A2 })).rejects.toMatchObject(NOT_FOUND);

    const moved = await service.updateTreePlanting(scope, planting.id, { farmId: FARM_A2, plotId: PLOT_A2 });
    expect(moved.farmId).toBe(FARM_A2);
    expect(moved.plotId).toBe(PLOT_A2);

    const cleared = await service.updateTreePlanting(scope, planting.id, { plotId: null });
    expect(cleared.plotId).toBeNull();
  });

  it('BR-55g: paginates with a cursor and limit', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    for (let i = 1; i <= 5; i++) {
      await service.createTreePlanting(scope, { speciesName: `Tree ${i}`, treeCount: i * 2 });
    }

    const page1 = await service.listTreePlantings(scope, { limit: 2 });
    expect(page1.items.length).toBe(2);
    expect(page1.page.hasMore).toBe(true);

    const page2 = await service.listTreePlantings(scope, { limit: 2, cursor: page1.page.nextCursor ?? undefined });
    expect(page2.items.length).toBe(2);
    expect(page2.page.hasMore).toBe(true);

    const page3 = await service.listTreePlantings(scope, { limit: 2, cursor: page2.page.nextCursor ?? undefined });
    expect(page3.items.length).toBe(1);
    expect(page3.page.hasMore).toBe(false);
    expect(page3.page.nextCursor).toBeNull();
  });

  it('BR-55g: a cursor that this endpoint did not issue is 422 VALIDATION_FAILED', async () => {
    const { service } = createTestContext();
    await expect(
      service.listTreePlantings(farmerScope(FARMER_A), { limit: 5, cursor: 'not-a-cursor' }),
    ).rejects.toMatchObject(VALIDATION_FAILED);
  });
});

describeIfDatabase('Tree Plantings integration (PostgreSQL)', () => {
  afterAll(async () => {
    const { closePool } = await import('../../db/pool.js');
    await closePool();
  });

  interface Seeded {
    userId: string;
    farmerId: string;
    farmId: string;
    plotId: string;
    otherFarmId: string;
    otherPlotId: string;
  }

  async function seedFarmer(db: Executor, tag: string): Promise<Seeded> {
    const userId = newId();
    const farmerId = newId();
    const farmId = newId();
    const plotId = newId();
    const otherFarmId = newId();
    const otherPlotId = newId();
    await db.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, $3, 'FARMER', 'ACTIVE')`,
      [userId, `+9195${Math.floor(10000000 + Math.random() * 89999999)}`, `Trees ${tag}`],
    );
    await db.query(`INSERT INTO farmers (id, user_id, tohfa_farmer_id) VALUES ($1, $2, $3)`, [
      farmerId,
      userId,
      `TOHFA-TREE-${farmerId.slice(0, 8)}`,
    ]);
    for (const [fid, pid] of [
      [farmId, plotId],
      [otherFarmId, otherPlotId],
    ] as const) {
      await db.query(`INSERT INTO farms (id, farmer_id, name) VALUES ($1, $2, $3)`, [fid, farmerId, `Farm ${tag} ${fid.slice(0, 4)}`]);
      await db.query(`INSERT INTO plots (id, farm_id, name) VALUES ($1, $2, $3)`, [pid, fid, `Plot ${tag} ${pid.slice(0, 4)}`]);
    }
    return { userId, farmerId, farmId, plotId, otherFarmId, otherPlotId };
  }

  function scopeOf(f: Seeded): ResolvedScope {
    return aScope({
      level: ScopeLevel.OWN,
      farmerId: f.farmerId,
      userId: f.userId,
      roleCode: RoleCode.FARMER,
      permission: 'farmer.tree_planting.manage_own',
    });
  }

  async function withTx<T>(fn: (db: Executor, service: ReturnType<typeof createTreePlantingsService>) => Promise<T>) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const service = createTreePlantingsService({
        repo: treePlantingsRepo,
        db: client,
        runTx: async (run) => run(client),
      });
      return await fn(client, service);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  }

  it("BR-55f: the real SQL checks refuse another farmer's farm/plot and a plot on another farm of the same farmer", async () => {
    await withTx(async (_db, service) => {
      const a = await seedFarmer(_db, 'a');
      const b = await seedFarmer(_db, 'b');
      const scope = scopeOf(a);
      const base = { speciesName: 'Teak', treeCount: 3 };

      await expect(service.createTreePlanting(scope, { ...base, farmId: b.farmId })).rejects.toMatchObject(NOT_FOUND);
      await expect(service.createTreePlanting(scope, { ...base, plotId: b.plotId })).rejects.toMatchObject(NOT_FOUND);
      await expect(
        service.createTreePlanting(scope, { ...base, farmId: a.farmId, plotId: b.plotId }),
      ).rejects.toMatchObject(NOT_FOUND);
      await expect(
        service.createTreePlanting(scope, { ...base, farmId: a.farmId, plotId: a.otherPlotId }),
      ).rejects.toMatchObject(NOT_FOUND);

      const created = await service.createTreePlanting(scope, { ...base, farmId: a.farmId, plotId: a.plotId });
      expect(created.farmId).toBe(a.farmId);
      expect(created.plotId).toBe(a.plotId);

      await expect(service.updateTreePlanting(scope, created.id, { plotId: b.plotId })).rejects.toMatchObject(NOT_FOUND);
      await expect(service.updateTreePlanting(scope, created.id, { farmId: a.otherFarmId })).rejects.toMatchObject(
        NOT_FOUND,
      );
      const moved = await service.updateTreePlanting(scope, created.id, {
        farmId: a.otherFarmId,
        plotId: a.otherPlotId,
      });
      expect(moved.plotId).toBe(a.otherPlotId);
    });
  });

  it('BR-55c: the real owner filter hides farmer A’s planting from farmer B on get, update, delete and list', async () => {
    await withTx(async (db, service) => {
      const a = await seedFarmer(db, 'a');
      const b = await seedFarmer(db, 'b');
      const planting = await service.createTreePlanting(scopeOf(a), { speciesName: 'Oak', treeCount: 4 });

      await expect(service.getTreePlanting(scopeOf(b), planting.id)).rejects.toMatchObject(NOT_FOUND);
      await expect(service.updateTreePlanting(scopeOf(b), planting.id, { treeCount: 99 })).rejects.toMatchObject(NOT_FOUND);
      await expect(service.deleteTreePlanting(scopeOf(b), planting.id)).rejects.toMatchObject(NOT_FOUND);
      expect((await service.listTreePlantings(scopeOf(b), { limit: 20 })).items).toEqual([]);

      const stillThere = await service.getTreePlanting(scopeOf(a), planting.id);
      expect(stillThere.treeCount).toBe(4);
    });
  });

  it('BR-55d: a soft-deleted planting is gone from get and list in the real database', async () => {
    await withTx(async (db, service) => {
      const a = await seedFarmer(db, 'a');
      const planting = await service.createTreePlanting(scopeOf(a), { speciesName: 'Oak', treeCount: 4 });
      await service.deleteTreePlanting(scopeOf(a), planting.id);

      await expect(service.getTreePlanting(scopeOf(a), planting.id)).rejects.toMatchObject(NOT_FOUND);
      expect((await service.listTreePlantings(scopeOf(a), { limit: 20 })).items).toEqual([]);
      const row = await db.query<{ deleted_at: Date | null }>(`SELECT deleted_at FROM tree_plantings WHERE id = $1`, [
        planting.id,
      ]);
      expect(row.rows[0]?.deleted_at).not.toBeNull();
    });
  });

  it('BR-55g: rows created within the same millisecond are neither skipped nor repeated across pages', async () => {
    await withTx(async (db, service) => {
      const a = await seedFarmer(db, 'a');
      const ids: string[] = [];
      // Three rows within one millisecond (microsecond apart), then two with an identical timestamp.
      const stamps = [
        '2026-03-01 10:00:00.123401+00',
        '2026-03-01 10:00:00.123402+00',
        '2026-03-01 10:00:00.123403+00',
        '2026-03-01 10:00:00.123500+00',
        '2026-03-01 10:00:00.123500+00',
      ];
      for (const [index, stamp] of stamps.entries()) {
        const res = await db.query<{ id: string }>(
          `INSERT INTO tree_plantings (farmer_id, species_name, tree_count, created_at)
           VALUES ($1, $2, 1, $3::timestamptz) RETURNING id`,
          [a.farmerId, `Tree ${index}`, stamp],
        );
        ids.push(res.rows[0]!.id);
      }

      for (const limit of [1, 2]) {
        const seen: string[] = [];
        let cursor: string | undefined;
        for (let guard = 0; guard < 10; guard++) {
          const page = await service.listTreePlantings(scopeOf(a), { limit, cursor });
          seen.push(...page.items.map((i) => i.id));
          if (!page.page.hasMore) break;
          cursor = page.page.nextCursor ?? undefined;
        }
        expect(seen.slice().sort()).toEqual(ids.slice().sort());
        expect(new Set(seen).size).toBe(ids.length);
      }
    });
  });
});
