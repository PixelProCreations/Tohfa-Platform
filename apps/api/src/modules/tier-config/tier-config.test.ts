/**
 * Tier threshold configuration (BR-04, BR-111), with BR-35 (audit row in the same transaction).
 *
 * The band values below are TEST FIXTURES, not the business thresholds: the live values are the
 * seeded rows of rating_tier_config (db/seed/001_reference.sql) and whatever a Super Admin sets.
 *
 * Layers:
 *  1. service against a fake repo (validation, no-op, audit image, carried-forward labels)
 *  2. request schema
 *  3. the router: SUPER_ADMIN only on both routes
 *  4. PostgreSQL: the real repo inside a rolled-back transaction (generations, BR-04a)
 */
import type { Server } from 'node:http';
import type pg from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import { farmRatingsRepo } from '../farm-ratings/farm-ratings.repo.js';
import { tierConfigRepo, type Generation, type NewTierRow, type TierConfigRepo } from './tier-config.repo.js';
import { tierConfigRouter } from './tier-config.routes.js';
import { tierBandsBody, tierBandsGeneration, type TierBandsBody } from './tier-config.schema.js';
import { createTierConfigService } from './tier-config.service.js';

const RATING = 'farmer.rating.configure_tiers';
const AUDIT = 'audit.tier.configure_thresholds';
const sa = (permission: string = RATING, userId: string = IDS.userSuperAdmin): ResolvedScope =>
  aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUPER_ADMIN, permission, userId });

/** Fixture bands: [POOR, MODERATE, GOOD, EXCELLENT] boundaries. */
function bands(b1: number, b2: number, b3: number, overrides: Partial<Record<number, Partial<TierBandsBody['tiers'][number]>>> = {}): TierBandsBody {
  const tiers: TierBandsBody['tiers'] = [
    { code: 'POOR', minScore: 0, maxScore: b1 },
    { code: 'MODERATE', minScore: b1, maxScore: b2 },
    { code: 'GOOD', minScore: b2, maxScore: b3 },
    { code: 'EXCELLENT', minScore: b3, maxScore: null },
  ];
  return { tiers: tiers.map((t, i) => ({ ...t, ...(overrides[i] ?? {}) })) };
}

function currentFixture(): Generation {
  return {
    effectiveFrom: '2026-09-17',
    tiers: [
      { code: 'POOR', label: 'Poor', minScore: 0, maxScore: 40, colorHex: '#000001', sortOrder: 1 },
      { code: 'MODERATE', label: 'Moderate', minScore: 40, maxScore: 60, colorHex: '#000002', sortOrder: 2 },
      { code: 'GOOD', label: 'Good', minScore: 60, maxScore: 80, colorHex: '#000003', sortOrder: 3 },
      { code: 'EXCELLENT', label: 'Excellent', minScore: 80, maxScore: null, colorHex: null, sortOrder: 4 },
    ],
  };
}

function fakeRepo(initial: Generation = currentFixture()): { repo: TierConfigRepo; writes: NewTierRow[][]; events: string[] } {
  const writes: NewTierRow[][] = [];
  const events: string[] = [];
  let current = initial;
  const repo: TierConfigRepo = {
    async lock() {
      events.push('lock');
    },
    async currentGeneration() {
      events.push('read');
      return current;
    },
    async writeTodaysGeneration(_db, rows) {
      events.push('write');
      writes.push(rows);
      current = { effectiveFrom: '2026-10-23', tiers: rows.map((r) => ({ ...r })) };
    },
  };
  return { repo, writes, events };
}

interface RecordedQuery {
  sql: string;
  params: unknown[];
}

function serviceWith(repo: TierConfigRepo, log: RecordedQuery[] = []) {
  const tx = {
    async query(sql: string, params: unknown[] = []) {
      log.push({ sql, params });
      return { rows: [{ id: newId() }], rowCount: 1 } as never;
    },
  } as Executor;
  return createTierConfigService({ repo, transaction: async (fn) => fn(tx) });
}

const auditInserts = (log: RecordedQuery[]): RecordedQuery[] => log.filter((q) => /INSERT INTO audit_log/.test(q.sql));

async function caught(promise: Promise<unknown>): Promise<AppError> {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(AppError);
  return error as AppError;
}

// ---------------------------------------------------------------------------
// 1. Service
// ---------------------------------------------------------------------------
describe('tier config: validation (BR-111a)', () => {
  const swap = (body: TierBandsBody, i: number, j: number): TierBandsBody => {
    const tiers = [...body.tiers];
    [tiers[i], tiers[j]] = [tiers[j]!, tiers[i]!];
    return { tiers };
  };

  it.each<[string, TierBandsBody, string]>([
    ['a gap between bands', bands(50, 70, 85, { 1: { minScore: 51 } }), 'body.tiers.0.maxScore'],
    ['an overlap between bands', bands(50, 70, 85, { 2: { minScore: 65 } }), 'body.tiers.1.maxScore'],
    ['a first band not starting at 0', bands(50, 70, 85, { 0: { minScore: 5 } }), 'body.tiers.0.minScore'],
    ['a bounded last band (scores above it have no tier)', bands(50, 70, 85, { 3: { maxScore: 100 } }), 'body.tiers.3.maxScore'],
    ['an unbounded band before the last', bands(50, 70, 85, { 1: { maxScore: null } }), 'body.tiers.1.maxScore'],
    ['an empty band (min = max)', bands(50, 50, 85), 'body.tiers.1.maxScore'],
    ['a reversed band (min > max)', bands(70, 50, 85, { 1: { minScore: 70 }, 2: { minScore: 50 } }), 'body.tiers.1.maxScore'],
    ['tiers out of order', swap(bands(50, 70, 85), 1, 2), 'body.tiers.1.code'],
    ['a duplicated tier', bands(50, 70, 85, { 2: { code: 'MODERATE' } }), 'body.tiers.2.code'],
    ['more than two decimals', bands(50.125, 70, 85, { 1: { minScore: 50.125 } }), 'body.tiers.0.maxScore'],
  ])('BR-111a: %s is 422 VALIDATION_FAILED, names the field, and writes nothing', async (_label, body, field) => {
    const { repo, writes } = fakeRepo();
    const log: RecordedQuery[] = [];
    const error = await caught(serviceWith(repo, log).replaceTiers(sa(), body));
    expect(error.code).toBe('VALIDATION_FAILED');
    expect(error.status).toBe(422);
    expect(Object.keys(error.errors ?? {})).toContain(field);
    expect(writes).toEqual([]);
    expect(auditInserts(log)).toEqual([]);
  });

  it('BR-111a: a missing label with no current generation to carry it from is 422 (no label is invented)', async () => {
    const { repo, writes } = fakeRepo({ effectiveFrom: null, tiers: [] });
    const error = await caught(serviceWith(repo).replaceTiers(sa(), bands(50, 70, 85, { 0: { label: 'Low' } })));
    expect(error.code).toBe('VALIDATION_FAILED');
    expect(Object.keys(error.errors ?? {})).toEqual(['body.tiers.1.label', 'body.tiers.2.label', 'body.tiers.3.label']);
    expect(writes).toEqual([]);
  });
});

describe('tier config: the write (BR-111b, BR-111c, BR-35)', () => {
  it('BR-111b: a valid body writes all four tiers in order, carrying labels and colours forward unless a label is given', async () => {
    const { repo, writes, events } = fakeRepo();
    const result = await serviceWith(repo).replaceTiers(sa(), bands(45, 65.5, 90, { 3: { label: 'Outstanding' } }));
    expect(events.slice(0, 2)).toEqual(['lock', 'read']);
    expect(writes).toEqual([
      [
        { code: 'POOR', label: 'Poor', minScore: 0, maxScore: 45, colorHex: '#000001', sortOrder: 1 },
        { code: 'MODERATE', label: 'Moderate', minScore: 45, maxScore: 65.5, colorHex: '#000002', sortOrder: 2 },
        { code: 'GOOD', label: 'Good', minScore: 65.5, maxScore: 90, colorHex: '#000003', sortOrder: 3 },
        { code: 'EXCELLENT', label: 'Outstanding', minScore: 90, maxScore: null, colorHex: null, sortOrder: 4 },
      ],
    ]);
    expect(tierBandsGeneration.parse(result)).toEqual(result);
    expect(result.effectiveFrom).toBe('2026-10-23');
    expect(result.tiers.map((t) => [t.code, t.minScore, t.maxScore])).toEqual([
      ['POOR', 0, 45],
      ['MODERATE', 45, 65.5],
      ['GOOD', 65.5, 90],
      ['EXCELLENT', 90, null],
    ]);
  });

  it('BR-111a: a last band starting exactly at 100 is valid (100 still maps to a tier)', async () => {
    const { repo, writes } = fakeRepo();
    await serviceWith(repo).replaceTiers(sa(), bands(50, 70, 100));
    expect(writes).toHaveLength(1);
  });

  it('BR-111c: a real change writes one audit row whose action code is the endpoint\'s permission, with before/after bands', async () => {
    for (const permission of [RATING, AUDIT]) {
      const { repo } = fakeRepo();
      const log: RecordedQuery[] = [];
      await serviceWith(repo, log).replaceTiers(sa(permission), bands(50, 70, 85));
      const inserts = auditInserts(log);
      expect(inserts, permission).toHaveLength(1);
      const params = inserts[0]!.params;
      expect(params[0]).toBe(IDS.userSuperAdmin);
      expect(params[3]).toBe(permission);
      expect(params[4]).toBe('rating_tier_config');
      expect(params[5]).toBeNull();
      expect(JSON.parse(params[8] as string)).toEqual({
        effectiveFrom: '2026-09-17',
        tiers: [
          { code: 'POOR', label: 'Poor', minScore: 0, maxScore: 40 },
          { code: 'MODERATE', label: 'Moderate', minScore: 40, maxScore: 60 },
          { code: 'GOOD', label: 'Good', minScore: 60, maxScore: 80 },
          { code: 'EXCELLENT', label: 'Excellent', minScore: 80, maxScore: null },
        ],
      });
      expect(JSON.parse(params[9] as string)).toMatchObject({
        effectiveFrom: '2026-10-23',
        tiers: [
          { code: 'POOR', minScore: 0, maxScore: 50 },
          { code: 'MODERATE', minScore: 50, maxScore: 70 },
          { code: 'GOOD', minScore: 70, maxScore: 85 },
          { code: 'EXCELLENT', minScore: 85, maxScore: null },
        ],
      });
    }
  });

  it('BR-111c: bands identical to the current generation are a no-op: no write, no audit row, the current generation returned', async () => {
    const { repo, writes } = fakeRepo();
    const log: RecordedQuery[] = [];
    const result = await serviceWith(repo, log).replaceTiers(sa(), bands(40, 60, 80));
    expect(writes).toEqual([]);
    expect(auditInserts(log)).toEqual([]);
    expect(result.effectiveFrom).toBe('2026-09-17');
  });
});

// ---------------------------------------------------------------------------
// 2. Request schema
// ---------------------------------------------------------------------------
describe('tier config: request schema (BR-111a)', () => {
  it('BR-111a: exactly four tiers of known codes, scores within 0-100, no unknown keys', () => {
    expect(tierBandsBody.safeParse(bands(50, 70, 85)).success).toBe(true);
    expect(tierBandsBody.safeParse({ tiers: bands(50, 70, 85).tiers.slice(0, 3) }).success).toBe(false);
    expect(tierBandsBody.safeParse(bands(50, 70, 85, { 0: { code: 'PLATINUM' as never } })).success).toBe(false);
    expect(tierBandsBody.safeParse(bands(50, 70, 185, { 3: { minScore: 185 } })).success).toBe(false);
    expect(tierBandsBody.safeParse(bands(50, 70, 85, { 0: { minScore: -1 } })).success).toBe(false);
    expect(tierBandsBody.safeParse({ ...bands(50, 70, 85), effectiveFrom: '2027-01-01' }).success).toBe(false);
    expect(tierBandsBody.safeParse(bands(50, 70, 85, { 0: { colorHex: '#FFFFFF' } as never })).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. Router
// ---------------------------------------------------------------------------
describe('tier config router (BR-111d)', () => {
  let server: Server;
  const token = (roles: Array<{ code: RoleCode; warehouseId?: string; zoneId?: string }>, extra: { farmerId?: string; customerId?: string } = {}): string =>
    `Bearer ${signAccessToken({ sub: IDS.userSuperAdmin, roles, farmerId: extra.farmerId ?? null, customerId: extra.customerId ?? null })}`;

  beforeAll(() => {
    server = createApp().listen(0);
  });
  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('BR-111d: the router registers exactly the two PATCH routes', () => {
    const routes = tierConfigRouter.stack
      .filter((layer) => layer.route !== undefined)
      .flatMap((layer) => {
        const route = layer.route as unknown as { path: string; methods: Record<string, boolean> };
        return Object.keys(route.methods).map((m) => `${m} ${route.path}`);
      });
    expect(new Set(routes)).toEqual(new Set(['patch /rating-tiers', 'patch /audit-tier-thresholds']));
  });

  it('BR-111d: both routes are 401 without a token and 403 for every role but SUPER_ADMIN', async () => {
    for (const path of ['/v1/admin/rating-tiers', '/v1/admin/audit-tier-thresholds']) {
      expect((await request(server).patch(path).send(bands(50, 70, 85))).status).toBe(401);
      for (const auth of [
        token([{ code: RoleCode.TOHFA_ADMIN }]),
        token([{ code: RoleCode.FARMER_ADMIN, zoneId: IDS.zoneNorth }]),
        token([{ code: RoleCode.MAIN_WH_ADMIN }]),
        token([{ code: RoleCode.SUB_WH_ADMIN, warehouseId: IDS.warehouseOoty }]),
        token([{ code: RoleCode.FARMER }], { farmerId: IDS.farmer }),
        token([{ code: RoleCode.CUSTOMER }], { customerId: IDS.customer }),
      ]) {
        const res = await request(server).patch(path).set('Authorization', auth).send(bands(50, 70, 85));
        expect(res.status, path).toBe(403);
      }
    }
  });

  it('BR-111d: a malformed body is 422 before any SQL', async () => {
    const res = await request(server)
      .patch('/v1/admin/rating-tiers')
      .set('Authorization', token([{ code: RoleCode.SUPER_ADMIN }]))
      .send({ tiers: [] });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });
});

// ---------------------------------------------------------------------------
// 4. PostgreSQL
// ---------------------------------------------------------------------------
describeIfDatabase('tier config (PostgreSQL, rolled back)', () => {
  let pool: pg.Pool;

  beforeAll(async () => {
    expect(await databaseReady('rating_tier_config'), 'the database is reachable and migrated').toBe(true);
    ({ pool } = await import('../../db/pool.js'));
  });

  async function inRollback<T>(fn: (tx: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      return await fn(client);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  }

  async function anAdmin(tx: pg.PoolClient): Promise<string> {
    const id = newId();
    await tx.query(`INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'Tier Admin', 'ADMIN', 'ACTIVE')`, [
      id,
      `+9192${Math.floor(10_000_000 + Math.random() * 89_999_999)}`,
    ]);
    return id;
  }

  const service = (tx: pg.PoolClient) => createTierConfigService({ repo: tierConfigRepo, transaction: async (fn) => fn(tx) });

  it('BR-111b / BR-04a (PostgreSQL): the new generation is effective today and changes the tier a score maps to; earlier generations are untouched', async () => {
    await inRollback(async (tx) => {
      await tx.query(`DELETE FROM rating_tier_config WHERE effective_from >= CURRENT_DATE`);
      const history = async () =>
        (await tx.query(`SELECT tier_code, label, min_score, max_score, effective_from FROM rating_tier_config WHERE effective_from < CURRENT_DATE ORDER BY effective_from, sort_order`)).rows;
      const before = await history();
      const tierBefore = await farmRatingsRepo.resolveTierForScore(tx, 72);
      const admin = await anAdmin(tx);

      const result = await service(tx).replaceTiers(sa(RATING, admin), bands(30, 50, 60));
      const today = (await tx.query<{ d: string }>(`SELECT to_char(CURRENT_DATE, 'YYYY-MM-DD') AS d`)).rows[0]!.d;
      expect(result.effectiveFrom).toBe(today);
      expect(await farmRatingsRepo.resolveTierForScore(tx, 72)).toBe('EXCELLENT');
      expect(await farmRatingsRepo.resolveTierForScore(tx, 59.99)).toBe('GOOD');
      expect(await farmRatingsRepo.resolveTierForScore(tx, 100)).toBe('EXCELLENT');
      expect(await farmRatingsRepo.resolveTierForScore(tx, 0)).toBe('POOR');
      expect(tierBefore).not.toBe(null);
      expect(await history()).toEqual(before);
      const setBy = await tx.query(`SELECT DISTINCT set_by FROM rating_tier_config WHERE effective_from = CURRENT_DATE`);
      expect(setBy.rows).toEqual([{ set_by: admin }]);
    });
  });

  it('BR-111b / BR-111c (PostgreSQL): a second change the same day replaces today\'s generation; each real change has one audit row; a repeat is a no-op', async () => {
    await inRollback(async (tx) => {
      await tx.query(`DELETE FROM rating_tier_config WHERE effective_from >= CURRENT_DATE`);
      const admin = await anAdmin(tx);
      await service(tx).replaceTiers(sa(RATING, admin), bands(30, 50, 60));
      await service(tx).replaceTiers(sa(AUDIT, admin), bands(20, 40, 95));
      await service(tx).replaceTiers(sa(AUDIT, admin), bands(20, 40, 95));
      const today = await tx.query<{ n: number }>(`SELECT count(*)::int AS n FROM rating_tier_config WHERE effective_from = CURRENT_DATE`);
      expect(today.rows[0]!.n).toBe(4);
      expect(await farmRatingsRepo.resolveTierForScore(tx, 72)).toBe('GOOD');
      const audit = await tx.query<{ action_code: string }>(
        `SELECT action_code FROM audit_log WHERE entity_type = 'rating_tier_config' AND actor_id = $1 ORDER BY created_at, id`,
        [admin],
      );
      expect(audit.rows.map((r) => r.action_code).sort()).toEqual([AUDIT, RATING]);
    });
  });

  it('BR-111a (PostgreSQL): an invalid body leaves the table and the audit log untouched', async () => {
    await inRollback(async (tx) => {
      const admin = await anAdmin(tx);
      const count = async () => (await tx.query<{ n: number }>(`SELECT count(*)::int AS n FROM rating_tier_config`)).rows[0]!.n;
      const before = await count();
      const error = await caught(service(tx).replaceTiers(sa(RATING, admin), bands(50, 70, 85, { 1: { minScore: 49 } })));
      expect(error.code).toBe('VALIDATION_FAILED');
      expect(await count()).toBe(before);
      const audit = await tx.query<{ n: number }>(`SELECT count(*)::int AS n FROM audit_log WHERE actor_id = $1`, [admin]);
      expect(audit.rows[0]!.n).toBe(0);
    });
  });
});
