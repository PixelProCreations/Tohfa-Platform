import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import type {
  CropMilestoneRecord,
  CropMilestoneTemplateRecord,
  CropMilestonesRepo,
  FarmCropBasicInfo,
} from './crop-milestones.repo.js';
import { updateMilestoneBody } from './crop-milestones.schema.js';
import { createCropMilestonesService } from './crop-milestones.service.js';

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
const CROP_LATE = '50000000-0000-4000-8000-000000000003';
const MASTER_CROP = '40000000-0000-4000-8000-000000000001';

function farmerScope(farmerId: string, permission = 'farmer.crop_milestone.manage_own'): ResolvedScope {
  return aScope({
    level: ScopeLevel.OWN,
    farmerId,
    userId: newId(),
    roleCode: RoleCode.FARMER,
    permission,
  });
}

interface FakeDbState {
  milestones: Map<string, CropMilestoneRecord>;
  templates: CropMilestoneTemplateRecord[];
  audits: unknown[][];
  lockedFarmers: string[];
}

function createFakeRepo(state: FakeDbState): CropMilestonesRepo {
  return {
    async lockFarmer(_db, farmerId) {
      state.lockedFarmers.push(farmerId);
    },

    async getFarmCropBasicInfo(_db, farmerId, farmCropId): Promise<FarmCropBasicInfo | null> {
      if (farmerId === FARMER_A && farmCropId === CROP_A) {
        return { id: CROP_A, cropId: MASTER_CROP, plantedOn: '2026-09-01' };
      }
      if (farmerId === FARMER_A && farmCropId === CROP_LATE) {
        return { id: CROP_LATE, cropId: MASTER_CROP, plantedOn: '9999-12-31' };
      }
      if (farmerId === FARMER_B && farmCropId === CROP_B) {
        return { id: CROP_B, cropId: MASTER_CROP, plantedOn: '2026-09-15' };
      }
      return null;
    },

    async listMilestonesForCrop(_db, farmerId, farmCropId) {
      return Array.from(state.milestones.values())
        .filter((m) => m.farmerId === farmerId && m.farmCropId === farmCropId)
        .sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    },

    async findMilestoneById(_db, farmerId, farmCropId, id) {
      const m = state.milestones.get(id);
      if (!m || m.farmerId !== farmerId || m.farmCropId !== farmCropId) {
        return null;
      }
      return { ...m };
    },

    async updateMilestone(_db, farmerId, farmCropId, id, patch) {
      const m = state.milestones.get(id);
      if (!m || m.farmerId !== farmerId || m.farmCropId !== farmCropId) {
        return null;
      }
      if (patch.status !== undefined) m.status = patch.status;
      if ('completedOn' in patch) m.completedOn = patch.completedOn ?? null;
      if ('targetDate' in patch) m.targetDate = patch.targetDate ?? null;
      if ('notes' in patch) m.notes = patch.notes ?? null;
      m.updatedAt = new Date().toISOString();
      return { ...m };
    },

    async listTemplates(_db, cropMasterId) {
      return state.templates.filter(
        (t) => t.cropMasterId === null || (cropMasterId !== undefined && t.cropMasterId === cropMasterId),
      );
    },

    async insertMilestones(_db, milestones) {
      const results: CropMilestoneRecord[] = [];
      for (const item of milestones) {
        const exists = Array.from(state.milestones.values()).some(
          (m) => m.farmCropId === item.farmCropId && m.stageCode === item.stageCode,
        );
        if (exists) continue;
        const id = newId();
        const rec: CropMilestoneRecord = {
          id,
          farmerId: item.farmerId,
          farmCropId: item.farmCropId,
          templateId: item.templateId,
          stageCode: item.stageCode,
          stageName: item.stageName,
          sequenceOrder: item.sequenceOrder,
          status: 'PENDING',
          targetDate: item.targetDate,
          completedOn: null,
          notes: null,
          createdAt: new Date().toISOString(),
          updatedAt: null,
        };
        state.milestones.set(id, rec);
        results.push(rec);
      }
      return results;
    },
  };
}

function createTestContext() {
  const state: FakeDbState = {
    milestones: new Map(),
    templates: [
      {
        id: '10000000-0000-4000-8000-000000000001',
        cropMasterId: null,
        stageCode: 'STAGE_SOWING',
        stageName: 'Sowing & Germination',
        description: 'Seed emergence',
        sequenceOrder: 1,
        expectedDaysAfterPlanting: 7,
      },
      {
        id: '10000000-0000-4000-8000-000000000002',
        cropMasterId: null,
        stageCode: 'STAGE_VEGETATIVE',
        stageName: 'Vegetative Growth',
        description: 'Leaf and shoot growth',
        sequenceOrder: 2,
        expectedDaysAfterPlanting: 30,
      },
      {
        id: '10000000-0000-4000-8000-000000000003',
        cropMasterId: null,
        stageCode: 'STAGE_FLOWERING',
        stageName: 'Flowering',
        description: 'Bud opening',
        sequenceOrder: 3,
        expectedDaysAfterPlanting: 50,
      },
      {
        id: '10000000-0000-4000-8000-000000000004',
        cropMasterId: null,
        stageCode: 'STAGE_HARVEST',
        stageName: 'Harvest',
        description: 'Produce harvest',
        sequenceOrder: 4,
        expectedDaysAfterPlanting: 75,
      },
    ],
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
  const service = createCropMilestonesService({
    repo,
    db: fakeTx,
    runTx: async (fn) => fn(fakeTx),
  });

  return { state, repo, service, audits: state.audits };
}

async function expectAppError(promise: Promise<unknown>, code: string, status: number): Promise<void> {
  await expect(promise).rejects.toMatchObject({ name: 'AppError', code, status });
}

const auditsOf = (audits: unknown[][], actionCode: string) => audits.filter((a) => a[3] === actionCode);

describe('Crop Milestones (BR-57)', () => {
  it('BR-57a: rejects completedOn in the future relative to Asia/Kolkata with 422 VALIDATION_FAILED', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    const list = await service.listMilestones(scope, CROP_A);
    const first = list.items[0]!;
    const futureDate = addDays(todayIst(), 3);

    await expectAppError(
      service.updateMilestone(scope, CROP_A, first.id, { status: 'COMPLETED', completedOn: futureDate }),
      'VALIDATION_FAILED',
      422,
    );
    // The rule is about the date itself, not about the status it arrives with.
    await expectAppError(
      service.updateMilestone(scope, CROP_A, first.id, { completedOn: futureDate }),
      'VALIDATION_FAILED',
      422,
    );
  });

  it('BR-57a: completedOn and targetDate must be real calendar dates, so 2026-02-30 is a 422 at the schema, not a 500 from Postgres', () => {
    expect(updateMilestoneBody.safeParse({ completedOn: '2026-02-28' }).success).toBe(true);
    expect(updateMilestoneBody.safeParse({ completedOn: '2026-02-30' }).success).toBe(false);
    expect(updateMilestoneBody.safeParse({ targetDate: '2026-13-01' }).success).toBe(false);
    expect(updateMilestoneBody.safeParse({ completedOn: null }).success).toBe(true);
  });

  it('BR-57b: auto-initializes milestones from templates with 0% progress on first list', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    const list = await service.listMilestones(scope, CROP_A);
    expect(list.totalCount).toBe(4);
    expect(list.completedCount).toBe(0);
    expect(list.progressPct).toBe(0);
    expect(list.items[0]?.stageCode).toBe('STAGE_SOWING');
    expect(list.items[0]?.targetDate).toBe('2026-09-08'); // 2026-09-01 + 7 days
    expect(list.items[1]?.stageCode).toBe('STAGE_VEGETATIVE');
  });

  it('BR-57b: a planting date so late that a due date passes year 9999 is a 422 VALIDATION_FAILED, not a Postgres 500', async () => {
    const { service, state } = createTestContext();
    const scope = farmerScope(FARMER_A);

    await expectAppError(service.initializeMilestones(scope, CROP_LATE), 'VALIDATION_FAILED', 422);
    await expect(service.initializeMilestones(scope, CROP_LATE)).rejects.toMatchObject({
      detail: 'planting date is too far in the future to schedule milestones',
    });
    expect(state.milestones.size).toBe(0);
  });

  it('BR-57b: a crop with its own templates gets only those; universal templates are the fallback, so sequences cannot collide', async () => {
    const { service, state } = createTestContext();
    const scope = farmerScope(FARMER_A);
    state.templates.push(
      {
        id: '10000000-0000-4000-8000-0000000000a1',
        cropMasterId: MASTER_CROP,
        stageCode: 'STAGE_NURSERY',
        stageName: 'Nursery',
        description: null,
        sequenceOrder: 1,
        expectedDaysAfterPlanting: 10,
      },
      {
        id: '10000000-0000-4000-8000-0000000000a2',
        cropMasterId: MASTER_CROP,
        stageCode: 'STAGE_HARVEST',
        stageName: 'Crop-specific harvest',
        description: null,
        sequenceOrder: 2,
        expectedDaysAfterPlanting: 60,
      },
    );

    const templates = await service.listTemplates(scope, { cropMasterId: MASTER_CROP });
    expect(templates.map((t) => t.stageCode)).toEqual(['STAGE_NURSERY', 'STAGE_HARVEST']);
    expect(templates.every((t) => t.cropMasterId === MASTER_CROP)).toBe(true);

    // Another crop type has no templates of its own and falls back to the universal set.
    const other = await service.listTemplates(scope, { cropMasterId: '40000000-0000-4000-8000-0000000000ff' });
    expect(other.map((t) => t.stageCode)).toEqual([
      'STAGE_SOWING',
      'STAGE_VEGETATIVE',
      'STAGE_FLOWERING',
      'STAGE_HARVEST',
    ]);
    // No crop named: universal only.
    expect((await service.listTemplates(scope, {})).every((t) => t.cropMasterId === null)).toBe(true);

    // Auto-initialisation uses the same selection.
    const list = await service.listMilestones(scope, CROP_A);
    expect(list.items.map((i) => i.stageCode)).toEqual(['STAGE_NURSERY', 'STAGE_HARVEST']);
  });

  it('BR-57c: marking a milestone COMPLETED records the completion date and updates progress', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    const initial = await service.listMilestones(scope, CROP_A);
    const first = initial.items[0]!;
    const second = initial.items[1]!;

    const updatedFirst = await service.updateMilestone(scope, CROP_A, first.id, {
      status: 'COMPLETED',
      completedOn: '2026-09-08',
      notes: 'Germination successful, 95% emergence.',
    });
    expect(updatedFirst.status).toBe('COMPLETED');
    expect(updatedFirst.completedOn).toBe('2026-09-08');

    const afterFirst = await service.listMilestones(scope, CROP_A);
    expect(afterFirst.completedCount).toBe(1);
    expect(afterFirst.progressPct).toBe(25);

    // No date supplied: the server records today (Asia/Kolkata).
    const updatedSecond = await service.updateMilestone(scope, CROP_A, second.id, { status: 'COMPLETED' });
    expect(updatedSecond.completedOn).toBe(todayIst());

    const afterSecond = await service.listMilestones(scope, CROP_A);
    expect(afterSecond.completedCount).toBe(2);
    expect(afterSecond.progressPct).toBe(50);
  });

  it('BR-57c: a milestone moves between PENDING, COMPLETED and SKIPPED, and only COMPLETED counts toward progress', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    const list = await service.listMilestones(scope, CROP_A);
    const milestone = list.items[2]!;

    const skipped = await service.updateMilestone(scope, CROP_A, milestone.id, {
      status: 'SKIPPED',
      notes: 'Skipping flowering stage check due to weather.',
    });
    expect(skipped.status).toBe('SKIPPED');
    expect((await service.listMilestones(scope, CROP_A)).completedCount).toBe(0);

    await service.updateMilestone(scope, CROP_A, milestone.id, { status: 'COMPLETED', completedOn: '2026-09-20' });
    expect((await service.listMilestones(scope, CROP_A)).completedCount).toBe(1);

    const reopened = await service.updateMilestone(scope, CROP_A, milestone.id, { status: 'PENDING' });
    expect(reopened.status).toBe('PENDING');
    expect((await service.listMilestones(scope, CROP_A)).completedCount).toBe(0);
  });

  it('BR-57d: cross-farmer access returns 404 NOT_FOUND on list, initialize and update (BR-36)', async () => {
    const { service } = createTestContext();
    const scopeA = farmerScope(FARMER_A);
    const scopeB = farmerScope(FARMER_B);

    const listA = await service.listMilestones(scopeA, CROP_A);
    const first = listA.items[0]!;

    await expectAppError(service.listMilestones(scopeB, CROP_A), 'NOT_FOUND', 404);
    await expectAppError(service.initializeMilestones(scopeB, CROP_A), 'NOT_FOUND', 404);
    await expectAppError(
      service.updateMilestone(scopeB, CROP_A, first.id, { status: 'COMPLETED' }),
      'NOT_FOUND',
      404,
    );
    // B's own crop, A's milestone id: still invisible.
    await expectAppError(
      service.updateMilestone(scopeB, CROP_B, first.id, { status: 'COMPLETED' }),
      'NOT_FOUND',
      404,
    );
  });

  it('BR-57e: the auto-initialising GET takes the owner lock and writes exactly one audit row, and a repeat GET writes none', async () => {
    const { service, state, audits } = createTestContext();
    const scope = farmerScope(FARMER_A);

    const first = await service.listMilestones(scope, CROP_A);
    expect(first.totalCount).toBe(4);
    expect(state.lockedFarmers).toEqual([FARMER_A]);
    const written = auditsOf(audits, 'crop_milestone.initialize');
    expect(audits.length).toBe(1);
    expect(written.length).toBe(1);
    expect(written[0]?.[5]).toBe(CROP_A);
    // Masked: the image names the crop and the stages, never the farmer id.
    expect(String(written[0]?.[9] ?? written[0]?.[10])).not.toContain(FARMER_A);

    await service.listMilestones(scope, CROP_A);
    expect(audits.length).toBe(1);
    expect(state.lockedFarmers).toEqual([FARMER_A]);
  });

  it('BR-57e: explicit initialize reports created with one audit row when rows were inserted, and not created with no audit otherwise', async () => {
    const { service, audits } = createTestContext();
    const scope = farmerScope(FARMER_A);

    const first = await service.initializeMilestones(scope, CROP_A);
    expect(first.created).toBe(true);
    expect(first.milestones.totalCount).toBe(4);
    expect(auditsOf(audits, 'crop_milestone.initialize').length).toBe(1);

    const again = await service.initializeMilestones(scope, CROP_A);
    expect(again.created).toBe(false);
    expect(again.milestones.totalCount).toBe(4);
    expect(auditsOf(audits, 'crop_milestone.initialize').length).toBe(1);
  });

  it('BR-57e: locks farmer row and writes audit logs on milestone mutations (BR-35)', async () => {
    const { service, state, audits } = createTestContext();
    const scope = farmerScope(FARMER_A);

    const list = await service.listMilestones(scope, CROP_A);
    const milestone = list.items[0]!;
    state.lockedFarmers.length = 0;

    await service.updateMilestone(scope, CROP_A, milestone.id, { status: 'COMPLETED', completedOn: '2026-09-05' });

    expect(state.lockedFarmers).toEqual([FARMER_A]);
    expect(auditsOf(audits, 'crop_milestone.update').length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// PostgreSQL: the SQL itself (owner filter, template selection, unique index)
// ---------------------------------------------------------------------------

class RollbackFixture extends Error {}

describeIfDatabase('Crop Milestones (PostgreSQL)', () => {
  let ready = false;

  beforeAll(async () => {
    ready = await databaseReady('farm_crop_milestones');
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
      [`+9199${stamp.slice(-8)}`, `CM ${label}`],
    );
    const userId = user.rows[0]!.id;
    const farmer = await tx.query<{ id: string }>(
      `INSERT INTO farmers (user_id, tohfa_farmer_id) VALUES ($1, $2) RETURNING id`,
      [userId, `TF-CM-${label}-${stamp}`],
    );
    const farmerId = farmer.rows[0]!.id;
    const farm = await tx.query<{ id: string }>(
      `INSERT INTO farms (farmer_id, name) VALUES ($1, 'CM farm') RETURNING id`,
      [farmerId],
    );
    const plot = await tx.query<{ id: string }>(
      `INSERT INTO plots (farm_id, name) VALUES ($1, 'CM plot') RETURNING id`,
      [farm.rows[0]!.id],
    );
    const crop = await tx.query<{ id: string }>(`SELECT id FROM crop_master ORDER BY slug LIMIT 1`);
    const cropMasterId = crop.rows[0]!.id;
    const farmCrop = await tx.query<{ id: string }>(
      `INSERT INTO farm_crops (plot_id, crop_id, planted_on) VALUES ($1, $2, '2026-01-01') RETURNING id`,
      [plot.rows[0]!.id, cropMasterId],
    );
    return { userId, farmerId, farmCropId: farmCrop.rows[0]!.id, cropMasterId };
  }

  async function serviceFor(tx: Executor) {
    const { cropMilestonesRepo } = await import('./crop-milestones.repo.js');
    return createCropMilestonesService({ repo: cropMilestonesRepo, db: tx, runTx: async (fn) => fn(tx) });
  }

  const scopeOf = (farmerId: string, userId: string): ResolvedScope => {
    const scope = farmerScope(farmerId);
    scope.userId = userId;
    return scope;
  };

  it('BR-57b (PostgreSQL): the database refuses a second universal template for the same stage_code', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      await tx.query('SAVEPOINT dup');
      await expect(
        tx.query(
          `INSERT INTO crop_milestone_templates (crop_master_id, stage_code, stage_name, sequence_order)
           VALUES (NULL, 'STAGE_SOWING', 'Duplicate sowing', 9)`,
        ),
      ).rejects.toMatchObject({ code: '23505' });
      await tx.query('ROLLBACK TO SAVEPOINT dup');

      // A crop-specific template with the same stage_code is still allowed.
      const crop = await tx.query<{ id: string }>(`SELECT id FROM crop_master ORDER BY slug LIMIT 1`);
      await tx.query(
        `INSERT INTO crop_milestone_templates (crop_master_id, stage_code, stage_name, sequence_order)
         VALUES ($1, 'STAGE_SOWING', 'Crop-specific sowing', 1)`,
        [crop.rows[0]!.id],
      );
    });
  });

  it('BR-57b (PostgreSQL): a crop with its own templates is offered only those, other crops get the universal six', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const a = await seedFarmCrop(tx, 'A');
      const service = await serviceFor(tx);
      const scope = scopeOf(a.farmerId, a.userId);

      const before = await service.listTemplates(scope, { cropMasterId: a.cropMasterId });
      expect(before.length).toBe(6);
      expect(before.every((t) => t.cropMasterId === null)).toBe(true);

      await tx.query(
        `INSERT INTO crop_milestone_templates (crop_master_id, stage_code, stage_name, sequence_order, expected_days_after_planting)
         VALUES ($1, 'STAGE_SOWING', 'Crop-specific sowing', 1, 5), ($1, 'STAGE_PICKING', 'Picking', 2, 40)`,
        [a.cropMasterId],
      );
      const after = await service.listTemplates(scope, { cropMasterId: a.cropMasterId });
      expect(after.map((t) => t.stageCode)).toEqual(['STAGE_SOWING', 'STAGE_PICKING']);
      expect(after.every((t) => t.cropMasterId === a.cropMasterId)).toBe(true);

      const universal = await service.listTemplates(scope, {});
      expect(universal.length).toBe(6);

      // And the milestones a farmer is given follow the same choice.
      const milestones = await service.listMilestones(scope, a.farmCropId);
      expect(milestones.items.map((m) => m.stageCode)).toEqual(['STAGE_SOWING', 'STAGE_PICKING']);
      expect(milestones.items[0]?.targetDate).toBe('2026-01-06');
    });
  });

  it('BR-57d (PostgreSQL): the owner filter hides a crop and its milestones from every other farmer', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const a = await seedFarmCrop(tx, 'A');
      const b = await seedFarmCrop(tx, 'B');
      const service = await serviceFor(tx);
      const scopeA = scopeOf(a.farmerId, a.userId);
      const scopeB = scopeOf(b.farmerId, b.userId);

      const listA = await service.listMilestones(scopeA, a.farmCropId);
      const milestoneId = listA.items[0]!.id;

      await expectAppError(service.listMilestones(scopeB, a.farmCropId), 'NOT_FOUND', 404);
      await expectAppError(service.initializeMilestones(scopeB, a.farmCropId), 'NOT_FOUND', 404);
      await expectAppError(
        service.updateMilestone(scopeB, a.farmCropId, milestoneId, { status: 'SKIPPED' }),
        'NOT_FOUND',
        404,
      );
      await expectAppError(
        service.updateMilestone(scopeB, b.farmCropId, milestoneId, { status: 'SKIPPED' }),
        'NOT_FOUND',
        404,
      );

      await tx.query(`UPDATE farm_crops SET deleted_at = now() WHERE id = $1`, [a.farmCropId]);
      await expectAppError(service.listMilestones(scopeA, a.farmCropId), 'NOT_FOUND', 404);
    });
  });

  it('BR-57e (PostgreSQL): the auto-initialising GET writes exactly one masked audit row in the caller\'s transaction, and a repeat writes none', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const a = await seedFarmCrop(tx, 'A');
      const service = await serviceFor(tx);
      const scope = scopeOf(a.farmerId, a.userId);
      const countAudits = async () =>
        (
          await tx.query<{ n: string; after: unknown }>(
            `SELECT count(*)::text AS n, max(after::text)::text AS after
               FROM audit_log WHERE action_code = 'crop_milestone.initialize' AND entity_id = $1`,
            [a.farmCropId],
          )
        ).rows[0]!;

      await service.listMilestones(scope, a.farmCropId);
      const once = await countAudits();
      expect(once.n).toBe('1');
      expect(String(once.after)).not.toContain(a.farmerId);

      await service.listMilestones(scope, a.farmCropId);
      expect((await countAudits()).n).toBe('1');

      const explicit = await service.initializeMilestones(scope, a.farmCropId);
      expect(explicit.created).toBe(false);
      expect((await countAudits()).n).toBe('1');
    });
  });
});
