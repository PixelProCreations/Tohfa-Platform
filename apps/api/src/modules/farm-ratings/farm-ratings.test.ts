/**
 * Farm rating tests (BR-04, BR-06).
 *
 * PRODUCT DECISION 2026-10-01: the farm rating comes from completed INTERNAL
 * audits only. There is no manual write path any more — the old
 * `PUT /admin/farmers/{id}/rating` tests (incremental DRAFT scoring, the
 * Farmer-Admin OWN_ZONE_ONLY edit predicate, notes) were removed with the
 * route because the rule they asserted no longer exists. Every rule that still
 * holds (BR-06a range, BR-06b categories, BR-06 direct sum, BR-04a/b tiers) is
 * asserted here against `recordAuditRating`, the one remaining write.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import type { Executor } from '../../db/pool.js';
import { pool } from '../../db/pool.js';
import { loadRbac } from '../../rbac/loadRbac.js';
import { aScope, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import { createFarmRatingsService, farmRatingsService, type AuditRatingInput } from './farm-ratings.service.js';
import {
  farmRatingsRepo,
  type ActiveCategoryRow,
  type CreateAuditRatingData,
  type FarmerZoneRow,
  type FarmRatingsRepo,
  type LatestRatingRow,
  type RatingScoreInput,
} from './farm-ratings.repo.js';
import { farmRatingResponse } from './farm-ratings.schema.js';

const ZONE_NORTH = IDS.zoneNorth;
const ZONE_SOUTH = '20000000-0000-4000-8000-000000000002';
const FARMER_ID = IDS.farmer;
const FARM_ID = '50000000-0000-4000-8000-000000000001';
const ADMIN = IDS.userSuperAdmin;

// BR-06 (LOCKED): exactly 10 named categories, each worth 10 points, summed
// directly (no multiplier) to a 0-100 total_score.
const ACTIVE_CATEGORIES: ActiveCategoryRow[] = [
  'CERTIFICATION',
  'SOIL_LAND',
  'FARMING_PRACTICES',
  'ENVIRONMENTAL',
  'PRODUCE_QUALITY',
  'TRACEABILITY',
  'SOCIAL_LABOR',
  'FINANCIAL',
  'MARKET_RELATIONS',
  'INNOVATION',
].map((code, index) => ({ id: `cat-${code}`, code, sortOrder: index + 1 }));

const SCORES_67 = [8, 7, 9, 6, 7, 8, 6, 5, 6, 5]; // direct sum 67

function auditInput(overrides: Partial<AuditRatingInput> = {}, values: number[] = SCORES_67): AuditRatingInput {
  return {
    auditId: newId(),
    farmerId: FARMER_ID,
    farmId: FARM_ID,
    zoneId: ZONE_NORTH,
    fiscalYear: '2026-27',
    quarter: 3,
    scores: ACTIVE_CATEGORIES.map((category, index) => ({
      categoryCode: category.code,
      score: values[index]!,
      remarks: index === 0 ? 'PGS certificate on file' : null,
    })),
    ratedBy: ADMIN,
    actorRole: RoleCode.SUPER_ADMIN,
    ...overrides,
  };
}

interface StoredRating extends CreateAuditRatingData {
  id: string;
  status: LatestRatingRow['status'];
  ratedAt: Date | null;
  seq: number;
  scores: Map<string, RatingScoreInput>;
}

interface FakeRatings {
  repo: FarmRatingsRepo;
  ratings: StoredRating[];
  tierLookups: number[];
  cacheWrites: Array<{ farmerId: string; overallRating: number; tierCode: string | null }>;
  writeTxs: Executor[];
}

/**
 * Stateful fake: every rating ever created is kept (history), and
 * findLatestRating returns the most recently CREATED one, mirroring the real
 * `ORDER BY created_at DESC`.
 */
function createFakeRatings(overrides: Partial<FarmRatingsRepo> = {}): FakeRatings {
  const ratings: StoredRating[] = [];
  const tierLookups: number[] = [];
  const cacheWrites: FakeRatings['cacheWrites'] = [];
  const writeTxs: Executor[] = [];
  let seq = 0;

  const latestFor = (farmerId: string): StoredRating | undefined =>
    ratings.filter((r) => r.farmerId === farmerId).sort((a, b) => b.seq - a.seq)[0];

  const repo: FarmRatingsRepo = {
    findFarmerZone: async (_tx, farmerId): Promise<FarmerZoneRow | null> =>
      farmerId === FARMER_ID ? { id: FARMER_ID, zoneId: ZONE_NORTH } : null,
    findFarmerForView: async (_tx, farmerId, scope) => {
      if (farmerId !== FARMER_ID) return null;
      if (scope.roleCode === RoleCode.FARMER_ADMIN && !scope.zoneIds.includes(ZONE_NORTH)) return null;
      return { id: FARMER_ID, zoneId: ZONE_NORTH };
    },
    findActiveCategories: async () => ACTIVE_CATEGORIES,
    findLatestRating: async (_tx, farmerId): Promise<LatestRatingRow | null> => {
      const latest = latestFor(farmerId);
      if (latest === undefined) return null;
      return {
        id: latest.id,
        periodLabel: latest.periodLabel,
        status: latest.status,
        totalScore: latest.totalScore,
        tierCode: latest.tierCode,
        ratedAt: latest.ratedAt,
        sourceAuditId: latest.sourceAuditId,
      };
    },
    findScoresForRating: async (_tx, ratingId) => {
      const rating = ratings.find((r) => r.id === ratingId);
      return new Map([...(rating?.scores.values() ?? [])].map((s) => [s.categoryId, s.score] as const));
    },
    insertAuditRating: async (tx, data) => {
      writeTxs.push(tx);
      if (ratings.some((r) => r.sourceAuditId === data.sourceAuditId)) {
        throw Object.assign(new Error('duplicate key'), { code: '23505', constraint: 'uq_farm_ratings_source_audit' });
      }
      seq += 1;
      const id = newId();
      ratings.push({ ...data, id, status: 'COMPLETE', ratedAt: new Date(), seq, scores: new Map() });
      return id;
    },
    insertScores: async (tx, ratingId, scores) => {
      writeTxs.push(tx);
      const rating = ratings.find((r) => r.id === ratingId)!;
      for (const score of scores) {
        if (rating.scores.has(score.categoryId)) throw new Error('fake: duplicate score row');
        rating.scores.set(score.categoryId, { ...score });
      }
    },
    updateFarmerRatingCache: async (tx, farmerId, overallRating, tierCode) => {
      writeTxs.push(tx);
      cacheWrites.push({ farmerId, overallRating, tierCode });
    },
    resolveTierForScore: async (_tx, score) => {
      tierLookups.push(score);
      if (score < 50) return 'POOR';
      if (score < 70) return 'MODERATE';
      if (score < 85) return 'GOOD';
      return 'EXCELLENT';
    },
    ...overrides,
  };
  return { repo, ratings, tierLookups, cacheWrites, writeTxs };
}

/** A transaction client that records every statement it is handed. */
function recordingTx(): { tx: Executor; sql: string[] } {
  const sql: string[] = [];
  const tx = {
    query: async (text: string) => {
      sql.push(text);
      return { rows: [{ id: 'audit-log-id' }], rowCount: 1 };
    },
  } as unknown as Executor;
  return { tx, sql };
}

const noSqlDb = {
  query: async () => {
    throw new Error('the farm-ratings service must not issue SQL outside its repo');
  },
} as unknown as Executor;

function serviceWith(fake: FakeRatings) {
  return createFarmRatingsService(fake.repo, noSqlDb);
}

const adminView = aScope({ level: ScopeLevel.ALL, permission: 'farmer.rating.view', roleCode: RoleCode.SUPER_ADMIN });
const farmerView = aScope({
  level: ScopeLevel.OWN,
  permission: 'farmer.rating.view',
  roleCode: RoleCode.FARMER,
  farmerId: FARMER_ID,
  userId: IDS.userFarmer,
});

describe('FarmRatingsService (Unit)', () => {
  it('never-rated farmer: GET returns all 10 categories with score null, status DRAFT, no source', async () => {
    const service = serviceWith(createFakeRatings());
    const result = await service.getAdminRating(adminView, FARMER_ID);
    expect(result.modules).toHaveLength(10);
    expect(result.modules.every((m) => m.score === null && m.maxScore === 10)).toBe(true);
    expect(result.status).toBe('DRAFT');
    expect(result.overallRating).toBeNull();
    expect(result.ratingTier).toBeNull();
    expect(result.ratedAt).toBeNull();
    expect(result.source).toBeNull();
    expect(result.sourceAuditId).toBeNull();
    expect(result.modules[0]!.categoryCode).toBe('CERTIFICATION');
    expect((result.modules[0] as Record<string, unknown>)['name']).toBeUndefined();
    expect(() => farmRatingResponse.parse(result)).not.toThrow();
  });

  it('BR-06c: recordAuditRating creates a COMPLETE rating with the audit\'s 10 scores, direct-sum total and config tier, linked to the audit', async () => {
    const fake = createFakeRatings();
    const service = serviceWith(fake);
    const { tx, sql } = recordingTx();
    const input = auditInput();

    const result = await service.recordAuditRating(tx, input);

    expect(fake.ratings).toHaveLength(1);
    const stored = fake.ratings[0]!;
    expect(stored).toMatchObject({
      farmerId: FARMER_ID,
      farmId: FARM_ID,
      zoneId: ZONE_NORTH,
      periodLabel: '2026-27 Q3',
      totalScore: 67, // direct sum, no multiplier (BR-06)
      tierCode: 'MODERATE',
      ratedBy: ADMIN,
      sourceAuditId: input.auditId,
      status: 'COMPLETE',
    });
    expect(stored.scores.size).toBe(10);
    expect(stored.scores.get('cat-CERTIFICATION')).toEqual({
      categoryId: 'cat-CERTIFICATION',
      score: 8,
      scoredBy: ADMIN,
      remarks: 'PGS certificate on file',
    });
    expect(stored.scores.get('cat-SOIL_LAND')!.remarks).toBeNull();
    // BR-04a: the tier was looked up for exactly this total, not computed inline.
    expect(fake.tierLookups).toEqual([67]);
    // Farmer-facing cache follows the newest rating, in the same transaction.
    expect(fake.cacheWrites).toEqual([{ farmerId: FARMER_ID, overallRating: 67, tierCode: 'MODERATE' }]);
    expect(fake.writeTxs.every((written) => written === tx)).toBe(true);
    // audit_log row through the SAME transaction client.
    expect(sql.filter((text) => text.includes('INSERT INTO audit_log'))).toHaveLength(1);

    expect(result).toMatchObject({
      status: 'COMPLETE',
      overallRating: 67,
      ratingTier: 'MODERATE',
      periodLabel: '2026-27 Q3',
      source: 'AUDIT',
      sourceAuditId: input.auditId,
    });
    expect(() => farmRatingResponse.parse(result)).not.toThrow();
  });

  it('BR-04a: changing rating_tier_config changes which tier the same audit total maps to', async () => {
    const fake = createFakeRatings({ resolveTierForScore: async () => 'EXCELLENT' });
    const result = await serviceWith(fake).recordAuditRating(recordingTx().tx, auditInput());
    expect(result.overallRating).toBe(67);
    expect(result.ratingTier).toBe('EXCELLENT');
  });

  it('BR-04b: audit-derived totals 0/49/50/69/70/84/85/100 map to POOR/POOR/MODERATE/MODERATE/GOOD/GOOD/EXCELLENT/EXCELLENT', async () => {
    const cases: Array<[number[], number, string]> = [
      [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 0, 'POOR'],
      [[5, 5, 5, 5, 5, 5, 5, 5, 5, 4], 49, 'POOR'],
      [[5, 5, 5, 5, 5, 5, 5, 5, 5, 5], 50, 'MODERATE'],
      [[7, 7, 7, 7, 7, 7, 7, 7, 7, 6], 69, 'MODERATE'],
      [[7, 7, 7, 7, 7, 7, 7, 7, 7, 7], 70, 'GOOD'],
      [[9, 9, 9, 9, 8, 8, 8, 8, 8, 8], 84, 'GOOD'],
      [[9, 9, 9, 9, 9, 8, 8, 8, 8, 8], 85, 'EXCELLENT'],
      [[10, 10, 10, 10, 10, 10, 10, 10, 10, 10], 100, 'EXCELLENT'],
    ];
    for (const [values, total, tier] of cases) {
      const result = await serviceWith(createFakeRatings()).recordAuditRating(recordingTx().tx, auditInput({}, values));
      expect([result.overallRating, result.ratingTier]).toEqual([total, tier]);
    }
  });

  it('BR-06a: a category score of 11 (or -1) is refused with SCORE_OUT_OF_RANGE and nothing is written', async () => {
    for (const bad of [11, -1]) {
      const fake = createFakeRatings();
      const values = [...SCORES_67];
      values[3] = bad;
      await expect(serviceWith(fake).recordAuditRating(recordingTx().tx, auditInput({}, values))).rejects.toMatchObject({
        code: 'SCORE_OUT_OF_RANGE',
        status: 422,
      });
      expect(fake.ratings).toHaveLength(0);
    }
  });

  it('BR-06b: an unknown category, a duplicated category or a missing category is refused (422) and nothing is written', async () => {
    const unknown = auditInput();
    unknown.scores[9] = { categoryCode: 'NOT_A_REAL_CATEGORY', score: 5, remarks: null };
    const duplicate = auditInput();
    duplicate.scores[9] = { categoryCode: 'CERTIFICATION', score: 5, remarks: null };
    const missing = auditInput();
    missing.scores.pop(); // 9 of 10 — incomplete, never counted as zero (BR-06)

    for (const input of [unknown, duplicate, missing]) {
      const fake = createFakeRatings();
      await expect(serviceWith(fake).recordAuditRating(recordingTx().tx, input)).rejects.toMatchObject({
        code: 'VALIDATION_FAILED',
        status: 422,
      });
      expect(fake.ratings).toHaveLength(0);
    }
  });

  it('BR-06f: a second audit-derived rating becomes the current one and leaves the previous rating and its scores unchanged', async () => {
    const fake = createFakeRatings();
    const service = serviceWith(fake);
    const first = auditInput({ quarter: 2 });
    await service.recordAuditRating(recordingTx().tx, first);
    const snapshot = structuredClone(fake.ratings[0]!);

    const second = auditInput({ quarter: 3 }, [9, 9, 9, 9, 9, 9, 9, 9, 9, 9]);
    const latest = await service.recordAuditRating(recordingTx().tx, second);

    expect(fake.ratings).toHaveLength(2);
    expect(fake.ratings[0]).toEqual(snapshot); // history untouched
    expect(latest).toMatchObject({ overallRating: 90, ratingTier: 'EXCELLENT', sourceAuditId: second.auditId });
    const current = await service.getMyRating(farmerView);
    expect(current).toMatchObject({ periodLabel: '2026-27 Q3', overallRating: 90, sourceAuditId: second.auditId });
  });

  it('BR-06: the same audit can never produce two ratings (unique source_audit_id surfaces as 409 CONFLICT)', async () => {
    const fake = createFakeRatings();
    const service = serviceWith(fake);
    const input = auditInput();
    await service.recordAuditRating(recordingTx().tx, input);
    await expect(service.recordAuditRating(recordingTx().tx, input)).rejects.toMatchObject({
      code: 'CONFLICT',
      status: 409,
    });
    expect(fake.ratings).toHaveLength(1);
  });

  it('legacy rows: a rating with no source audit reads back as source MANUAL', async () => {
    const fake = createFakeRatings({
      findLatestRating: async () => ({
        id: 'legacy',
        periodLabel: 'CYCLE-1',
        status: 'COMPLETE',
        totalScore: 83,
        tierCode: 'GOOD',
        ratedAt: new Date('2026-09-20T00:00:00Z'),
        sourceAuditId: null,
      }),
    });
    const result = await serviceWith(fake).getAdminRating(adminView, FARMER_ID);
    expect(result).toMatchObject({ periodLabel: 'CYCLE-1', overallRating: 83, source: 'MANUAL', sourceAuditId: null });
  });

  it('BR-06e: docs/rbac.json carries no farm-rating write permission (farmer.rating.edit removed)', () => {
    const codes = loadRbac()
      .document.permissions.map((permission) => permission.code)
      .filter((code) => code.startsWith('farmer.rating.'));
    expect(codes.sort()).toEqual(['farmer.rating.configure_tiers', 'farmer.rating.view']);
  });

  it('BR-06e: the service exposes no manual write (setRating is gone)', () => {
    const service = serviceWith(createFakeRatings());
    expect('setRating' in service).toBe(false);
    expect(Object.keys(service).sort()).toEqual(['getAdminRating', 'getMyRating', 'recordAuditRating']);
  });

  it('a farmer with no farmer profile gets 404 from GET /me (defensive)', async () => {
    const service = serviceWith(createFakeRatings({ findFarmerZone: async () => null }));
    const noFarmerScope = aScope({
      level: ScopeLevel.OWN,
      permission: 'farmer.rating.view',
      roleCode: RoleCode.FARMER,
      farmerId: 'ghost-farmer',
    });
    await expect(service.getMyRating(noFarmerScope)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
  });

  it('cross-zone admin GET returns 404, never 403 (root CLAUDE.md §2.1)', async () => {
    const service = serviceWith(createFakeRatings());
    const scopeOutsideZone = aScope({
      level: ScopeLevel.VIEW,
      permission: 'farmer.rating.view',
      roleCode: RoleCode.FARMER_ADMIN,
      zoneIds: [ZONE_SOUTH],
    });
    await expect(service.getAdminRating(scopeOutsideZone, FARMER_ID)).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    });
  });
});

// ---------------------------------------------------------------------------
// Routes — real requireAuth + requirePermission wiring, repo spied, no DB.
// ---------------------------------------------------------------------------
describe('Farm rating routes (BR-06e)', () => {
  const app = createApp();
  const superAdmin = signAccessToken({
    sub: IDS.userSuperAdmin,
    roles: [{ code: 'SUPER_ADMIN' }] as never,
    farmerId: null,
    customerId: null,
  });
  const farmerAdminSouth = signAccessToken({
    sub: IDS.userFarmerAdmin,
    roles: [{ code: 'FARMER_ADMIN', zoneId: ZONE_SOUTH }] as never,
    farmerId: null,
    customerId: null,
  });
  const farmer = signAccessToken({
    sub: IDS.userFarmer,
    roles: [{ code: 'FARMER' }] as never,
    farmerId: FARMER_ID,
    customerId: null,
  });
  const body = { modules: [{ categoryCode: 'CERTIFICATION', score: 8 }] };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('BR-06e: PUT /admin/farmers/{id}/rating no longer exists (404 for every caller, never reaches a write)', async () => {
    for (const token of [superAdmin, farmerAdminSouth, farmer]) {
      const res = await request(app)
        .put(`/v1/admin/farmers/${FARMER_ID}/rating`)
        .set('Authorization', `Bearer ${token}`)
        .send(body);
      expect([404, 405]).toContain(res.status);
      expect(res.body.code).toBe('NOT_FOUND');
    }
  });

  it('BR-06e: the admin read still works for a Super Admin and is zone-scoped for a Farmer Admin (404 outside the zone)', async () => {
    const fake = createFakeRatings();
    vi.spyOn(farmRatingsRepo, 'findFarmerForView').mockImplementation(fake.repo.findFarmerForView);
    vi.spyOn(farmRatingsRepo, 'findActiveCategories').mockImplementation(fake.repo.findActiveCategories);
    vi.spyOn(farmRatingsRepo, 'findLatestRating').mockResolvedValue({
      id: 'r1',
      periodLabel: '2026-27 Q2',
      status: 'COMPLETE',
      totalScore: 74,
      tierCode: 'GOOD',
      ratedAt: new Date('2026-09-30T06:00:00Z'),
      sourceAuditId: '70000000-0000-4000-8000-000000000001',
    });
    vi.spyOn(farmRatingsRepo, 'findScoresForRating').mockResolvedValue(new Map());

    const ok = await request(app).get(`/v1/admin/farmers/${FARMER_ID}/rating`).set('Authorization', `Bearer ${superAdmin}`);
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ overallRating: 74, ratingTier: 'GOOD', source: 'AUDIT' });

    const outOfZone = await request(app)
      .get(`/v1/admin/farmers/${FARMER_ID}/rating`)
      .set('Authorization', `Bearer ${farmerAdminSouth}`);
    expect(outOfZone.status).toBe(404);
  });

  it('BR-06e: GET /farmers/me/rating reads the caller\'s own rating only', async () => {
    const spy = vi.spyOn(farmRatingsService, 'getMyRating').mockResolvedValue({} as never);
    const res = await request(app).get('/v1/farmers/me/rating').set('Authorization', `Bearer ${farmer}`);
    expect(res.status).toBe(200);
    expect(spy.mock.calls[0]![0].farmerId).toBe(FARMER_ID);
  });
});

// ---------------------------------------------------------------------------
// Integration tests — require a real DB (see apps/api/CLAUDE.md).
//
// These exist specifically to verify farm-ratings.repo.ts's scope-filtering
// SQL, which a mocked-repo unit test cannot exercise: MAIN_WH_ADMIN's
// rbac.json role has scopeDimension: null ("oversees all 4 warehouses"), so a
// naive scopedWhere() call would fail-closed to zero rows for it (see the
// long comment in findFarmerForView). The audit-derived write path is
// exercised end to end in audits.test.ts's integration suite (BR-06c..g),
// where the audit fixtures live.
// ---------------------------------------------------------------------------
describeIfDatabase('FarmRatingsRepo scope filtering (Integration)', () => {
  let ready = false;
  let warehouseOoty: string;
  let warehouseCoonoor: string;
  let zoneAtOoty: string;
  let zoneAtCoonoor: string;
  let farmerAtOoty: string;
  let farmerAtCoonoor: string;

  beforeAll(async () => {
    ready = await databaseReady('farm_ratings');
    if (!ready) return;

    const whRes = await pool.query<{ id: string; code: string }>(
      `SELECT id, code FROM warehouses WHERE code IN ('WH-OOTY', 'WH-COON') ORDER BY code`,
    );
    warehouseCoonoor = whRes.rows.find((r) => r.code === 'WH-COON')!.id;
    warehouseOoty = whRes.rows.find((r) => r.code === 'WH-OOTY')!.id;

    const ts = Date.now();

    const zoneOotyRes = await pool.query<{ id: string }>(
      `INSERT INTO zones (code, name, warehouse_id) VALUES ($1, 'FR Test Zone Ooty', $2) RETURNING id`,
      [`FR-TEST-OOTY-${ts}`, warehouseOoty],
    );
    zoneAtOoty = zoneOotyRes.rows[0]!.id;

    const zoneCoonoorRes = await pool.query<{ id: string }>(
      `INSERT INTO zones (code, name, warehouse_id) VALUES ($1, 'FR Test Zone Coonoor', $2) RETURNING id`,
      [`FR-TEST-COON-${ts}`, warehouseCoonoor],
    );
    zoneAtCoonoor = zoneCoonoorRes.rows[0]!.id;

    for (const [label, zoneId] of [
      ['ooty', zoneAtOoty],
      ['coonoor', zoneAtCoonoor],
    ] as const) {
      const userId = newId();
      await pool.query(
        `INSERT INTO users (id, mobile, full_name, user_type, status)
         VALUES ($1, $2, $3, 'FARMER', 'ACTIVE')`,
        [userId, `+9179${String(ts).slice(-8)}${label === 'ooty' ? '1' : '2'}`, `FR Test Farmer ${label}`],
      );
      const farmerRes = await pool.query<{ id: string }>(
        `INSERT INTO farmers (user_id, tohfa_farmer_id, zone_id) VALUES ($1, $2, $3) RETURNING id`,
        [userId, `TF-FR-${label.toUpperCase()}-${ts}`, zoneId],
      );
      if (label === 'ooty') farmerAtOoty = farmerRes.rows[0]!.id;
      else farmerAtCoonoor = farmerRes.rows[0]!.id;
    }
  });

  afterAll(async () => {
    if (!ready) return;
    await pool.query(`DELETE FROM farmers WHERE id = ANY($1::uuid[])`, [[farmerAtOoty, farmerAtCoonoor]]);
    await pool.query(`DELETE FROM zones WHERE id = ANY($1::uuid[])`, [[zoneAtOoty, zoneAtCoonoor]]);
  });

  it('MAIN_WH_ADMIN (scopeDimension: null) sees farmers in every zone under a "view" grant', async () => {
    if (!ready) return;
    const scope = aScope({
      level: ScopeLevel.VIEW,
      permission: 'farmer.rating.view',
      roleCode: RoleCode.MAIN_WH_ADMIN,
    });
    const ootyRow = await farmRatingsRepo.findFarmerForView(pool, farmerAtOoty, scope);
    const coonoorRow = await farmRatingsRepo.findFarmerForView(pool, farmerAtCoonoor, scope);
    expect(ootyRow).not.toBeNull();
    expect(coonoorRow).not.toBeNull();
  });

  it('SUB_WH_ADMIN sees only farmers whose zone belongs to their own warehouse', async () => {
    if (!ready) return;
    const scope = aScope({
      level: ScopeLevel.VIEW,
      permission: 'farmer.rating.view',
      roleCode: RoleCode.SUB_WH_ADMIN,
      warehouseIds: [warehouseOoty],
    });
    const ownWarehouseRow = await farmRatingsRepo.findFarmerForView(pool, farmerAtOoty, scope);
    const otherWarehouseRow = await farmRatingsRepo.findFarmerForView(pool, farmerAtCoonoor, scope);
    expect(ownWarehouseRow).not.toBeNull();
    expect(otherWarehouseRow).toBeNull();
  });

  it('FARMER_ADMIN sees only farmers in their own zone', async () => {
    if (!ready) return;
    const scope = aScope({
      level: ScopeLevel.VIEW,
      permission: 'farmer.rating.view',
      roleCode: RoleCode.FARMER_ADMIN,
      zoneIds: [zoneAtOoty],
    });
    const ownZoneRow = await farmRatingsRepo.findFarmerForView(pool, farmerAtOoty, scope);
    const otherZoneRow = await farmRatingsRepo.findFarmerForView(pool, farmerAtCoonoor, scope);
    expect(ownZoneRow).not.toBeNull();
    expect(otherZoneRow).toBeNull();
  });
});
