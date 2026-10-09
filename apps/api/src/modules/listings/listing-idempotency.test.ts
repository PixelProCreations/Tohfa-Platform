/**
 * BR-61: farmer-facing listing writes are idempotent (Idempotency-Key).
 *
 * Two halves:
 *   1. Unit tests: ListingsService against a mocked repo + in-memory key store.
 *   2. Real-database tests (gated on DATABASE_URL, like golden-thread.e2e): the
 *      service and the HTTP router against real Postgres, including the
 *      concurrency and rollback properties only a database can prove. They COMMIT
 *      rows (a rolled-back single client cannot race), so run them against a
 *      throwaway / CI database, never a shared one.
 *
 * Counter-offer accept / reject / counter replays are in counter-offers.test.ts
 * (unit) and in the database block below (real SQL).
 */
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import type { Actor } from '../../auth/requireAuth.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { createInMemoryIdempotencyStore } from '../../test/idempotencyStore.js';
import { databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import { CounterOffersService } from './counter-offers.service.js';
import type { ListingRow } from './listings.repo.js';
import { getTodayKolkata, ListingsService } from './listings.service.js';

const FARMER_ID = '00000000-0000-0000-0000-000000000010';
const USER_ID = '00000000-0000-0000-0000-000000000001';
const LISTING_ID = '11111111-1111-1111-1111-111111111111';

const actor: Actor = {
  userId: USER_ID,
  roles: [{ code: RoleCode.FARMER }],
  farmerId: FARMER_ID,
  customerId: null,
};
const scope: ResolvedScope = {
  level: ScopeLevel.OWN,
  permission: 'listing.create_own',
  roleCode: RoleCode.FARMER,
  warehouseIds: [],
  zoneIds: [],
  farmerId: FARMER_ID,
  userId: USER_ID,
};

const sampleListing: ListingRow = {
  id: LISTING_ID,
  listingNumber: 'LST-2026-0001',
  farmerId: FARMER_ID,
  farmId: null,
  farmCropId: null,
  cropId: '22222222-2222-2222-2222-222222222222',
  cropName: 'Carrot',
  grade: 'GRADE_1',
  quantityKg: '250.000',
  askingPricePerKg: '50.00',
  ceilingPricePerKg: '52.00',
  finalPricePerKg: null,
  finalQuantityKg: null,
  fairPriceId: '33333333-3333-3333-3333-333333333333',
  status: 'PENDING_APPROVAL',
  availableFrom: null,
  photos: [],
  certificationBadges: [],
  version: 1,
  approvedBy: null,
  approvedAt: null,
  rejectedBy: null,
  rejectedAt: null,
  rejectionReason: null,
  createdAt: '2026-08-27T10:00:00.000Z',
  updatedAt: null,
};

const body = {
  cropId: '22222222-2222-2222-2222-222222222222',
  grade: 'GRADE_1' as const,
  quantityKg: '250.000',
  askingPricePerKg: '50.00',
};

function unitService() {
  const calls = { insertListing: 0, withdrawListing: 0 };
  const repo = {
    findFarmerById: async () => ({ id: FARMER_ID, userId: USER_ID, isMarketBlocked: false }),
    findFarmerByUserId: async () => ({ id: FARMER_ID, userId: USER_ID, isMarketBlocked: false }),
    getListingCertEligibility: async () => ({
      eligible: true,
      qualifyingBadges: [],
      pendingCert: null,
      expiredCert: null,
    }),
    getSystemConfig: async () => false,
    countActiveListings: async () => 0,
    findEffectiveFairPrice: async () => ({
      id: '33333333-3333-3333-3333-333333333333',
      ceilingPrice: '52.00',
      effectiveFrom: '2026-01-01',
      effectiveTo: null,
    }),
    generateListingNumber: async () => 'LST-2026-0001',
    insertListing: async () => {
      calls.insertListing += 1;
      return { ...sampleListing, id: newId() };
    },
    findListingById: async () => sampleListing,
    withdrawListing: async () => {
      calls.withdrawListing += 1;
      return { ...sampleListing, status: 'WITHDRAWN', version: 2 };
    },
  };
  const store = createInMemoryIdempotencyStore();
  const service = new ListingsService(
    repo as unknown as ListingsService['repo'],
    async (fn) => fn({} as Executor),
    pool,
    store,
  );
  return { service, calls, store };
}

/** What a client sees: the JSON the route sends (a replay is read back from jsonb, so Dates are already ISO strings). */
const wire = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

const rejectsWith = async (promise: Promise<unknown>, code: string, status: number): Promise<void> => {
  await expect(promise).rejects.toSatisfy((err: unknown) => {
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).code).toBe(code);
    expect((err as AppError).status).toBe(status);
    return true;
  });
};

describe('listing idempotency (unit)', () => {
  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['blank', '   '],
  ])('BR-61a: createListing with a %s Idempotency-Key is 422 VALIDATION_FAILED and inserts nothing', async (_n, key) => {
    const { service, calls } = unitService();
    await rejectsWith(service.createListing(actor, scope, body, key), 'VALIDATION_FAILED', 422);
    expect(calls.insertListing).toBe(0);
  });

  it('BR-61a: the 422 for a missing key names the header and never echoes a value', async () => {
    const { service } = unitService();
    const err = (await service.createListing(actor, scope, body, undefined).catch((e: unknown) => e)) as AppError;
    expect(err.errors).toEqual({ 'header.Idempotency-Key': [expect.any(String)] });
  });

  it('BR-61a: withdrawListing without a key is 422 and does not withdraw', async () => {
    const { service, calls } = unitService();
    await rejectsWith(service.withdrawListing(actor, scope, LISTING_ID, 1, undefined), 'VALIDATION_FAILED', 422);
    expect(calls.withdrawListing).toBe(0);
  });

  it('BR-61b: replaying the same key with the same body returns the original listing and inserts once', async () => {
    const { service, calls } = unitService();
    const first = await service.createListing(actor, scope, body, 'key-1');
    const second = await service.createListing(actor, scope, { ...body }, 'key-1');
    expect(wire(second)).toEqual(wire(first));
    expect(calls.insertListing).toBe(1);
  });

  it('BR-61b: replaying a withdraw returns the original result instead of LISTING_NOT_PENDING', async () => {
    const { service, calls } = unitService();
    const first = await service.withdrawListing(actor, scope, LISTING_ID, 1, 'w-1');
    const second = await service.withdrawListing(actor, scope, LISTING_ID, 1, 'w-1');
    expect(wire(second)).toEqual(wire(first));
    expect(calls.withdrawListing).toBe(1);
  });

  it('BR-61c: the same key with a different body is 409 IDEMPOTENCY_KEY_REUSED and inserts nothing more', async () => {
    const { service, calls } = unitService();
    await service.createListing(actor, scope, body, 'key-2');
    await rejectsWith(
      service.createListing(actor, scope, { ...body, quantityKg: '251.000' }, 'key-2'),
      'IDEMPOTENCY_KEY_REUSED',
      409,
    );
    expect(calls.insertListing).toBe(1);
  });

  it('BR-61c: the same key on a different operation is 409 IDEMPOTENCY_KEY_REUSED', async () => {
    const { service, calls } = unitService();
    await service.createListing(actor, scope, body, 'key-3');
    await rejectsWith(service.withdrawListing(actor, scope, LISTING_ID, 1, 'key-3'), 'IDEMPOTENCY_KEY_REUSED', 409);
    expect(calls.withdrawListing).toBe(0);
  });

  it('BR-61e: two farmers using the same key string do not collide', async () => {
    const { service, calls } = unitService();
    const other: Actor = { ...actor, userId: '00000000-0000-0000-0000-000000000002' };
    const otherScope: ResolvedScope = { ...scope, userId: other.userId };
    const a = await service.createListing(actor, scope, body, 'shared-key');
    const b = await service.createListing(other, otherScope, body, 'shared-key');
    expect(a.id).not.toBe(b.id);
    expect(calls.insertListing).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Real database
// ---------------------------------------------------------------------------

interface Fixture {
  userId: string;
  farmerId: string;
  actor: Actor;
  scope: ResolvedScope;
  token: string;
}

describeIfDatabase('listing idempotency (real database)', () => {
  let ready = false;
  const app = createApp();
  const service = new ListingsService();
  const counterOffers = new CounterOffersService();
  let cropId: string;
  let adminUserId: string;
  const createdUsers: string[] = [];
  const createdFarmers: string[] = [];

  async function makeFarmer(): Promise<Fixture> {
    const userId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'Idempotency Test Farmer', 'FARMER', 'ACTIVE')`,
      [userId, `+9198${Math.floor(10000000 + Math.random() * 89999999)}`],
    );
    const farmerId = newId();
    await pool.query(`INSERT INTO farmers (id, user_id, tohfa_farmer_id, is_market_blocked) VALUES ($1, $2, $3, false)`, [
      farmerId,
      userId,
      `TOHFA-IDEM-${farmerId.slice(0, 8)}`,
    ]);
    await pool.query(
      `INSERT INTO certifications
         (farmer_id, cert_type, cert_number, issuing_body, issued_on, expires_on,
          verification_status, verified_by, verified_at)
       VALUES ($1, 'PGS', $2, 'Test Body', $3::date - 30, $3::date + 365, 'VERIFIED', $4, now())`,
      [farmerId, `PGS/IDEM/${farmerId}`, getTodayKolkata(), adminUserId],
    );
    createdUsers.push(userId);
    createdFarmers.push(farmerId);
    const a: Actor = { userId, roles: [{ code: RoleCode.FARMER }], farmerId, customerId: null };
    return {
      userId,
      farmerId,
      actor: a,
      scope: { ...scope, userId, farmerId },
      token: signAccessToken({ sub: userId, roles: [{ code: RoleCode.FARMER }], farmerId, customerId: null }),
    };
  }

  const listingCount = async (farmerId: string): Promise<number> =>
    Number(
      (await pool.query<{ n: string }>(`SELECT count(*)::text AS n FROM produce_listings WHERE farmer_id = $1`, [farmerId]))
        .rows[0]!.n,
    );
  const keyRows = async (userId: string): Promise<number> =>
    Number(
      (await pool.query<{ n: string }>(`SELECT count(*)::text AS n FROM idempotency_keys WHERE actor_user_id = $1`, [userId]))
        .rows[0]!.n,
    );

  beforeAll(async () => {
    ready = (await databaseReady('produce_listings')) && (await databaseReady('idempotency_keys'));
    if (!ready) throw new Error('database is not migrated (needs produce_listings and idempotency_keys): run `pnpm db:migrate`');
    adminUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'Idempotency Test Admin', 'ADMIN', 'ACTIVE')`,
      [adminUserId, `+9197${Math.floor(10000000 + Math.random() * 89999999)}`],
    );
    createdUsers.push(adminUserId);
    const category = await pool.query<{ id: string }>('SELECT id FROM categories LIMIT 1');
    cropId = newId();
    await pool.query(`INSERT INTO crop_master (id, slug, name, category_id) VALUES ($1, $2, 'Idempotency Test Crop', $3)`, [
      cropId,
      `idem-crop-${cropId}`,
      category.rows[0]!.id,
    ]);
    await pool.query(
      `INSERT INTO fair_prices (crop_id, grade, ceiling_price, effective_from, set_by) VALUES ($1, 'GRADE_1', '52.00', '2020-01-01', $2)`,
      [cropId, adminUserId],
    );
  });

  afterAll(async () => {
    // Best effort: audit_log is append-only and may pin users; a throwaway DB is the contract.
    for (const farmerId of createdFarmers) {
      await pool.query(`DELETE FROM produce_listings WHERE farmer_id = $1`, [farmerId]).catch(() => undefined);
    }
    for (const userId of createdUsers) {
      await pool.query(`DELETE FROM idempotency_keys WHERE actor_user_id = $1`, [userId]).catch(() => undefined);
    }
  });

  /** Open every pooled connection first, so the parallel requests really start together instead of one finishing while the others still connect. */
  const warmPool = async (): Promise<void> => {
    await Promise.all(Array.from({ length: 4 }, () => pool.query('SELECT pg_sleep(0.05)')));
  };

  const listingBody = () => ({ cropId, grade: 'GRADE_1' as const, quantityKg: '100.000', askingPricePerKg: '50.00' });

  it('BR-61a: a missing or blank key creates no listing and no key row', async () => {
    const f = await makeFarmer();
    for (const key of [undefined, '', '   ']) {
      await rejectsWith(service.createListing(f.actor, f.scope, listingBody(), key), 'VALIDATION_FAILED', 422);
    }
    expect(await listingCount(f.farmerId)).toBe(0);
    expect(await keyRows(f.userId)).toBe(0);
  });

  it('BR-61b: the first call creates; a replay returns the same listing and creates no second row', async () => {
    const f = await makeFarmer();
    const key = newId();
    const first = await service.createListing(f.actor, f.scope, listingBody(), key);
    const replay = await service.createListing(f.actor, f.scope, listingBody(), key);
    expect(wire(replay)).toEqual(wire(first));
    expect(await listingCount(f.farmerId)).toBe(1);
    expect(await keyRows(f.userId)).toBe(1);
  });

  it('BR-61c: the same key with a different payload is 409 IDEMPOTENCY_KEY_REUSED and creates nothing', async () => {
    const f = await makeFarmer();
    const key = newId();
    await service.createListing(f.actor, f.scope, listingBody(), key);
    await rejectsWith(
      service.createListing(f.actor, f.scope, { ...listingBody(), quantityKg: '101.000' }, key),
      'IDEMPOTENCY_KEY_REUSED',
      409,
    );
    expect(await listingCount(f.farmerId)).toBe(1);
  });

  it('BR-61d: five parallel requests with one key create exactly one listing and all return it', async () => {
    const f = await makeFarmer();
    const key = newId();
    await warmPool();
    const results = await Promise.all(
      Array.from({ length: 5 }, () => service.createListing(f.actor, f.scope, listingBody(), key)),
    );
    expect(new Set(results.map((r) => r.id)).size).toBe(1);
    expect(await listingCount(f.farmerId)).toBe(1);
    expect(await keyRows(f.userId)).toBe(1);
  });

  it('BR-61e: different farmers using the same key string each get their own listing', async () => {
    const a = await makeFarmer();
    const b = await makeFarmer();
    const key = newId();
    const ra = await service.createListing(a.actor, a.scope, listingBody(), key);
    const rb = await service.createListing(b.actor, b.scope, listingBody(), key);
    expect(ra.id).not.toBe(rb.id);
    expect(ra.farmerId).toBe(a.farmerId);
    expect(rb.farmerId).toBe(b.farmerId);
    expect(await listingCount(a.farmerId)).toBe(1);
    expect(await listingCount(b.farmerId)).toBe(1);
  });

  it('BR-61f: a refused attempt is not recorded; the same key works once the cause is fixed', async () => {
    const f = await makeFarmer();
    const key = newId();
    await rejectsWith(
      service.createListing(f.actor, f.scope, { ...listingBody(), askingPricePerKg: '999.00' }, key),
      'PRICE_ABOVE_CEILING',
      422,
    );
    expect(await keyRows(f.userId)).toBe(0);
    const ok = await service.createListing(f.actor, f.scope, listingBody(), key);
    expect(ok.status).toBe('PENDING_APPROVAL');
    expect(await listingCount(f.farmerId)).toBe(1);
  });

  it('BR-61g: a key older than 24 hours is released and can be used for a new request', async () => {
    const f = await makeFarmer();
    const key = newId();
    const first = await service.createListing(f.actor, f.scope, listingBody(), key);
    await pool.query(`UPDATE idempotency_keys SET created_at = now() - interval '25 hours' WHERE actor_user_id = $1`, [f.userId]);
    const second = await service.createListing(f.actor, f.scope, { ...listingBody(), quantityKg: '7.000' }, key);
    expect(second.id).not.toBe(first.id);
    expect(await listingCount(f.farmerId)).toBe(2);
  });

  it('BR-61b: a withdraw replay returns the original body even though the listing is no longer pending', async () => {
    const f = await makeFarmer();
    const created = await service.createListing(f.actor, f.scope, listingBody(), newId());
    const key = newId();
    const first = await service.withdrawListing(f.actor, f.scope, created.id, undefined, key);
    expect(first.status).toBe('WITHDRAWN');
    const replay = await service.withdrawListing(f.actor, f.scope, created.id, undefined, key);
    expect(wire(replay)).toEqual(wire(first));
    // Without the key the same call is a state error, which is the point of the key.
    await rejectsWith(service.withdrawListing(f.actor, f.scope, created.id, undefined, newId()), 'LISTING_NOT_PENDING', 409);
  });

  it('BR-61d: five parallel withdraws with one key all succeed with the same body', async () => {
    const f = await makeFarmer();
    const created = await service.createListing(f.actor, f.scope, listingBody(), newId());
    const key = newId();
    await warmPool();
    const results = await Promise.all(
      Array.from({ length: 5 }, () => service.withdrawListing(f.actor, f.scope, created.id, undefined, key)),
    );
    expect(results.every((r) => r.status === 'WITHDRAWN' && r.version === results[0]!.version)).toBe(true);
  });

  // ---- counter-offer responses (real SQL) --------------------------------

  async function listingWithAdminOffer(f: Fixture): Promise<{ listingId: string; offerId: string }> {
    const listingId = newId();
    await pool.query(
      `INSERT INTO produce_listings (id, listing_number, farmer_id, crop_id, grade, quantity_kg, price_per_kg, fair_price_id, status)
       SELECT $1, $2, $3, $4, 'GRADE_1', '100.000', '50.00', fp.id, 'COUNTER_OFFERED'
         FROM fair_prices fp WHERE fp.crop_id = $4 LIMIT 1`,
      [listingId, `LST-IDEM-${listingId.slice(0, 8)}`, f.farmerId, cropId],
    );
    const offerId = newId();
    await pool.query(
      `INSERT INTO counter_offers (id, listing_id, round, actor, actor_user_id, price_per_kg, quantity_kg, status, expires_at)
       VALUES ($1, $2, 1, 'ADMIN', $3, '40.00', '80.000', 'PENDING', now() + interval '24 hours')`,
      [offerId, listingId, adminUserId],
    );
    return { listingId, offerId };
  }
  const respondAudits = async (offerId: string): Promise<number> =>
    Number(
      (
        await pool.query<{ n: string }>(
          `SELECT count(*)::text AS n FROM audit_log WHERE action_code = 'listing.counter_offer.respond' AND entity_id = $1`,
          [offerId],
        )
      ).rows[0]!.n,
    );

  it('BR-61b: an accept replay returns the original listing and writes no second audit row', async () => {
    const f = await makeFarmer();
    const { listingId, offerId } = await listingWithAdminOffer(f);
    const key = newId();
    const first = await counterOffers.respondAccept(f.actor, f.scope, listingId, offerId, key);
    const replay = await counterOffers.respondAccept(f.actor, f.scope, listingId, offerId, key);
    expect(wire(replay)).toEqual(wire(first));
    expect(await respondAudits(offerId)).toBe(1);
  });

  it('BR-61d: five parallel accepts with one key write exactly one audit row and all return the listing', async () => {
    const f = await makeFarmer();
    const { listingId, offerId } = await listingWithAdminOffer(f);
    const key = newId();
    await warmPool();
    const results = await Promise.all(
      Array.from({ length: 5 }, () => counterOffers.respondAccept(f.actor, f.scope, listingId, offerId, key)),
    );
    expect(results.every((r) => r.status === 'ACCEPTED')).toBe(true);
    expect(await respondAudits(offerId)).toBe(1);
  });

  it('BR-61b: a counter replay opens exactly one new round and returns it again', async () => {
    const f = await makeFarmer();
    const { listingId, offerId } = await listingWithAdminOffer(f);
    const key = newId();
    const reqBody = { pricePerKg: '45.00', quantityKg: '90.000' };
    const first = await counterOffers.respondCounter(f.actor, f.scope, listingId, offerId, reqBody, key);
    const replay = await counterOffers.respondCounter(f.actor, f.scope, listingId, offerId, reqBody, key);
    expect(wire(replay)).toEqual(wire(first));
    const rounds = await pool.query<{ n: string }>(`SELECT count(*)::text AS n FROM counter_offers WHERE listing_id = $1`, [listingId]);
    expect(rounds.rows[0]!.n).toBe('2');
    await rejectsWith(
      counterOffers.respondCounter(f.actor, f.scope, listingId, offerId, { pricePerKg: '46.00', quantityKg: '90.000' }, key),
      'IDEMPOTENCY_KEY_REUSED',
      409,
    );
  });

  it('BR-61b: a reject replay returns the original offer and writes no second audit row', async () => {
    const f = await makeFarmer();
    const { listingId, offerId } = await listingWithAdminOffer(f);
    const key = newId();
    const first = await counterOffers.respondReject(f.actor, f.scope, listingId, offerId, 'too low', key);
    const replay = await counterOffers.respondReject(f.actor, f.scope, listingId, offerId, 'too low', key);
    expect(wire(replay)).toEqual(wire(first));
    expect(await respondAudits(offerId)).toBe(1);
  });

  // ---- through the real router -------------------------------------------

  it('BR-61a: POST /v1/listings without the header is 422 problem+json naming the header', async () => {
    const f = await makeFarmer();
    const res = await request(app).post('/v1/listings').set('Authorization', `Bearer ${f.token}`).send(listingBody());
    expect(res.status).toBe(422);
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(Object.keys(res.body.errors)).toEqual(['header.Idempotency-Key']);
    expect(await listingCount(f.farmerId)).toBe(0);
  });

  it('BR-61b/61c: over HTTP a replay is the same 201 body, and a changed body under the key is 409', async () => {
    const f = await makeFarmer();
    const key = newId();
    const post = (b: object) =>
      request(app).post('/v1/listings').set('Authorization', `Bearer ${f.token}`).set('Idempotency-Key', key).send(b);
    const first = await post(listingBody());
    expect(first.status).toBe(201);
    const replay = await post(listingBody());
    expect(replay.status).toBe(201);
    expect(replay.body).toEqual(first.body);
    const clash = await post({ ...listingBody(), quantityKg: '55.000' });
    expect(clash.status).toBe(409);
    expect(clash.body.code).toBe('IDEMPOTENCY_KEY_REUSED');
    expect(await listingCount(f.farmerId)).toBe(1);
  });

  it('BR-61a/61b: over HTTP the withdraw and the three counter-offer responses require the header and replay', async () => {
    const f = await makeFarmer();
    const auth = { Authorization: `Bearer ${f.token}` };
    const created = await request(app).post('/v1/listings').set(auth).set('Idempotency-Key', newId()).send(listingBody());
    const listingId = created.body.id as string;

    const noKey = await request(app).post(`/v1/listings/${listingId}/withdraw`).set(auth).send({});
    expect(noKey.status).toBe(422);
    const wKey = newId();
    const w1 = await request(app).post(`/v1/listings/${listingId}/withdraw`).set(auth).set('Idempotency-Key', wKey).send({});
    const w2 = await request(app).post(`/v1/listings/${listingId}/withdraw`).set(auth).set('Idempotency-Key', wKey).send({});
    expect([w1.status, w2.status]).toEqual([200, 200]);
    expect(w2.body).toEqual(w1.body);

    const { listingId: l2, offerId } = await listingWithAdminOffer(f);
    const base = `/v1/listings/${l2}/counter-offers/${offerId}`;
    for (const verb of ['accept', 'reject', 'counter']) {
      const res = await request(app).post(`${base}/${verb}`).set(auth).send({ pricePerKg: '45.00', quantityKg: '90.000' });
      expect(res.status, `${verb} without header`).toBe(422);
    }
    const aKey = newId();
    const a1 = await request(app).post(`${base}/accept`).set(auth).set('Idempotency-Key', aKey).send({});
    const a2 = await request(app).post(`${base}/accept`).set(auth).set('Idempotency-Key', aKey).send({});
    expect([a1.status, a2.status]).toEqual([200, 200]);
    expect(a2.body).toEqual(a1.body);
    expect(await respondAudits(offerId)).toBe(1);
  });
});
