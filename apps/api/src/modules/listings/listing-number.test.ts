/**
 * BR-71: a listing number is unique under concurrency and never reused.
 *
 * Real-database tests (gated on DATABASE_URL). They COMMIT rows (a rolled-back
 * single client cannot race), so run them against a throwaway / CI database.
 */
import request from 'supertest';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import type { Actor } from '../../auth/requireAuth.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool, withTransaction } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import { listingsRepo } from './listings.repo.js';
import { getTodayKolkata, ListingsService } from './listings.service.js';

const FORMAT = /^LST-(\d{4})-(\d{4,})$/;

interface Fixture {
  userId: string;
  farmerId: string;
  actor: Actor;
  scope: ResolvedScope;
  token: string;
}

describeIfDatabase('BR-71: listing numbers (real database)', () => {
  // One listening server for all requests: supertest(app) opens a server per call, and 20 at once can reset.
  const server = createApp().listen(0);
  const service = new ListingsService();
  const year = new Date().getFullYear();
  let cropId: string;
  let adminUserId: string;
  const createdUsers: string[] = [];
  const createdFarmers: string[] = [];
  const plantedNumbers: string[] = [];

  async function makeFarmer(): Promise<Fixture> {
    const userId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'Listing Number Farmer', 'FARMER', 'ACTIVE')`,
      [userId, `+9198${Math.floor(10000000 + Math.random() * 89999999)}`],
    );
    const farmerId = newId();
    await pool.query(`INSERT INTO farmers (id, user_id, tohfa_farmer_id, is_market_blocked) VALUES ($1, $2, $3, false)`, [
      farmerId,
      userId,
      `TOHFA-LNUM-${farmerId.slice(0, 8)}`,
    ]);
    await pool.query(
      `INSERT INTO certifications
         (farmer_id, cert_type, cert_number, issuing_body, issued_on, expires_on,
          verification_status, verified_by, verified_at)
       VALUES ($1, 'PGS', $2, 'Test Body', $3::date - 30, $3::date + 365, 'VERIFIED', $4, now())`,
      [farmerId, `PGS/LNUM/${farmerId}`, getTodayKolkata(), adminUserId],
    );
    createdUsers.push(userId);
    createdFarmers.push(farmerId);
    const actor: Actor = { userId, roles: [{ code: RoleCode.FARMER }], farmerId, customerId: null };
    return {
      userId,
      farmerId,
      actor,
      scope: {
        level: ScopeLevel.OWN,
        permission: 'listing.create_own',
        roleCode: RoleCode.FARMER,
        warehouseIds: [],
        zoneIds: [],
        farmerId,
        userId,
      },
      token: signAccessToken({ sub: userId, roles: [{ code: RoleCode.FARMER }], farmerId, customerId: null }),
    };
  }

  const listingBody = () => ({ cropId, grade: 'GRADE_1' as const, quantityKg: '100.000', askingPricePerKg: '50.00' });

  /** Open every pooled connection first so the parallel creates really start together. */
  const warmPool = async (): Promise<void> => {
    await Promise.all(Array.from({ length: 8 }, () => pool.query('SELECT pg_sleep(0.05)')));
  };

  const suffix = (n: string): number => Number(FORMAT.exec(n)![2]);

  beforeAll(async () => {
    if (!(await databaseReady('produce_listings'))) {
      throw new Error('database is not migrated (needs produce_listings): run `pnpm db:migrate`');
    }
    adminUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'Listing Number Admin', 'ADMIN', 'ACTIVE')`,
      [adminUserId, `+9197${Math.floor(10000000 + Math.random() * 89999999)}`],
    );
    createdUsers.push(adminUserId);
    const category = await pool.query<{ id: string }>('SELECT id FROM categories LIMIT 1');
    cropId = newId();
    await pool.query(`INSERT INTO crop_master (id, slug, name, category_id) VALUES ($1, $2, 'Listing Number Crop', $3)`, [
      cropId,
      `lnum-crop-${cropId}`,
      category.rows[0]!.id,
    ]);
    await pool.query(
      `INSERT INTO fair_prices (crop_id, grade, ceiling_price, effective_from, set_by) VALUES ($1, 'GRADE_1', '52.00', '2020-01-01', $2)`,
      [cropId, adminUserId],
    );
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    for (const farmerId of createdFarmers) {
      await pool.query(`DELETE FROM produce_listings WHERE farmer_id = $1`, [farmerId]).catch(() => undefined);
    }
    for (const n of plantedNumbers) {
      await pool.query(`DELETE FROM produce_listings WHERE listing_number = $1`, [n]).catch(() => undefined);
    }
    for (const userId of createdUsers) {
      await pool.query(`DELETE FROM idempotency_keys WHERE actor_user_id = $1`, [userId]).catch(() => undefined);
    }
    const { closePool } = await import('../../db/pool.js');
    await closePool();
  });

  it('BR-71a: 20 parallel creates by 20 different farmers all succeed with 20 distinct numbers in the existing format', async () => {
    const farmers = await Promise.all(Array.from({ length: 20 }, () => makeFarmer()));
    await warmPool();
    const settled = await Promise.allSettled(
      farmers.map((f) => service.createListing(f.actor, f.scope, listingBody(), newId())),
    );
    const failures = settled.filter((s) => s.status === 'rejected');
    expect(failures.map((s) => (s as PromiseRejectedResult).reason)).toEqual([]);
    const numbers = settled.map((s) => (s as PromiseFulfilledResult<{ listingNumber: string }>).value.listingNumber);
    expect(new Set(numbers).size).toBe(20);
    for (const n of numbers) expect(n).toMatch(new RegExp(`^LST-${year}-\\d{4,}$`));
  });

  it('BR-71a: 20 parallel creates through the real router are all 201 with distinct numbers (no 500)', async () => {
    const farmers = await Promise.all(Array.from({ length: 20 }, () => makeFarmer()));
    await warmPool();
    const responses = await Promise.all(
      farmers.map((f) =>
        request(server)
          .post('/v1/listings')
          .set('Authorization', `Bearer ${f.token}`)
          .set('Idempotency-Key', newId())
          .send(listingBody()),
      ),
    );
    expect(responses.map((r) => r.status)).toEqual(Array(20).fill(201));
    const numbers = responses.map((r) => r.body.listingNumber as string);
    expect(new Set(numbers).size).toBe(20);
    for (const n of numbers) expect(n).toMatch(FORMAT);
  });

  it('BR-71b: the next number follows the highest existing number of the year, so a gap or a deleted row never causes reuse', async () => {
    const f = await makeFarmer();
    const planted = `LST-${year}-${String(7000 + Math.floor(Math.random() * 1000))}`;
    plantedNumbers.push(planted);
    await pool.query(
      `INSERT INTO produce_listings (listing_number, farmer_id, crop_id, grade, quantity_kg, price_per_kg, fair_price_id, status)
       SELECT $1, $2, $3, 'GRADE_1', '10.000', '50.00', fp.id, 'PENDING_APPROVAL'
         FROM fair_prices fp WHERE fp.crop_id = $3 LIMIT 1`,
      [planted, f.farmerId, cropId],
    );
    // COUNT(*)+1 would answer a small number here and collide later; the max suffix answers planted + 1.
    const next = await withTransaction((tx) => listingsRepo.generateListingNumber(tx));
    expect(next).toBe(`LST-${year}-${String(suffix(planted) + 1).padStart(4, '0')}`);
  });

  it('BR-71b: numbers from another year do not move this year\'s counter, and the format keeps 4-digit zero padding', async () => {
    const f = await makeFarmer();
    const other = `LST-${year - 1}-9999`;
    plantedNumbers.push(other);
    await pool.query(
      `INSERT INTO produce_listings (listing_number, farmer_id, crop_id, grade, quantity_kg, price_per_kg, fair_price_id, status)
       SELECT $1, $2, $3, 'GRADE_1', '10.000', '50.00', fp.id, 'PENDING_APPROVAL'
         FROM fair_prices fp WHERE fp.crop_id = $3 LIMIT 1`,
      [other, f.farmerId, cropId],
    );
    const maxThisYear = await pool.query<{ n: string }>(
      `SELECT COALESCE(MAX(substring(listing_number FROM '^LST-${year}-([0-9]+)$')::int), 0)::text AS n FROM produce_listings`,
    );
    const next = await withTransaction((tx) => listingsRepo.generateListingNumber(tx));
    expect(next).toBe(`LST-${year}-${String(Number(maxThisYear.rows[0]!.n) + 1).padStart(4, '0')}`);
  });

  it('BR-71a: a refused create (price above ceiling) does not disturb numbering: the next create succeeds', async () => {
    const f = await makeFarmer();
    await expect(
      service.createListing(f.actor, f.scope, { ...listingBody(), askingPricePerKg: '999.00' }, newId()),
    ).rejects.toMatchObject({ code: 'PRICE_ABOVE_CEILING' });
    const ok = await service.createListing(f.actor, f.scope, listingBody(), newId());
    expect(ok.listingNumber).toMatch(FORMAT);
  });
});
