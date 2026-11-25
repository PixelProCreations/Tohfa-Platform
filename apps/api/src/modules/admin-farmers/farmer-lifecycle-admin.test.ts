/**
 * Farmer Account Disable Cascading (BR-238 — D8) & Subscription Extend/Waive (BR-239 — D9).
 */
import type { Server } from 'node:http';
import request from 'supertest';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { RoleCode } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool } from '../../db/pool.js';
import { describeIfDatabase, newId } from '../../test/factories.js';

function randomMobile(): string {
  return `+918${Math.floor(100000000 + Math.random() * 899999999)}`;
}

describeIfDatabase('Farmer account disable cascade & subscription actions (BR-238, BR-239)', () => {
  let server: Server;
  let ready = false;

  const zoneId = newId();
  const superAdminId = newId();
  const tohfaAdminId = newId();
  const farmerAdminId = newId();
  const farmerUserId = newId();
  const farmerId = newId();
  let actualCropId = newId();
  const fairPriceId = newId();

  const token = (userId: string, roleCode: RoleCode, extra: { zoneId?: string; farmerId?: string } = {}) =>
    signAccessToken({
      sub: userId,
      roles: [{ code: roleCode, ...(extra.zoneId ? { zoneId: extra.zoneId } : {}) }],
      farmerId: extra.farmerId ?? null,
      customerId: null,
    });

  beforeAll(async () => {
    try {
      await pool.query('SELECT 1 FROM farmer_subscriptions LIMIT 0');
      await pool.query('SELECT 1 FROM payouts LIMIT 0');
      const col = await pool.query<{ n: number }>(
        `SELECT COUNT(*)::int AS n FROM information_schema.columns
          WHERE table_name = 'payouts' AND column_name = 'rejected_by'`,
      );
      if ((col.rows[0]?.n ?? 0) === 0) return;
      ready = true;
    } catch {
      return;
    }

    const app = createApp();
    server = app.listen(0);

    await pool.query(`INSERT INTO zones (id, code, name, is_active) VALUES ($1, $2, 'Lifecycle Zone', true)`, [
      zoneId,
      `ZL-${zoneId.slice(0, 6)}`,
    ]);

    const addUser = async (id: string, name: string, userType: 'ADMIN' | 'FARMER') => {
      await pool.query(
        `INSERT INTO users (id, full_name, mobile, user_type, status) VALUES ($1, $2, $3, $4, 'ACTIVE')`,
        [id, name, randomMobile(), userType],
      );
    };

    await addUser(superAdminId, 'SA Lifecycle', 'ADMIN');
    await addUser(tohfaAdminId, 'TA Lifecycle', 'ADMIN');
    await addUser(farmerAdminId, 'FA Lifecycle', 'ADMIN');
    await addUser(farmerUserId, 'Farmer Lifecycle', 'FARMER');

    await pool.query(
      `INSERT INTO farmers (id, user_id, tohfa_farmer_id, zone_id, kyc_status, application_status, is_market_blocked)
       VALUES ($1, $2, $3, $4, 'VERIFIED', 'APPROVED', false)`,
      [farmerId, farmerUserId, `TF-${farmerId.slice(0, 6)}`, zoneId],
    );

    const catRes = await pool.query<{ id: string }>(`SELECT id FROM categories ORDER BY created_at LIMIT 1`);
    const categoryId = catRes.rows[0]?.id ?? newId();
    if (catRes.rows.length === 0) {
      await pool.query(`INSERT INTO categories (id, slug, name, sort_order) VALUES ($1, $2, 'Test Cat', 99)`, [
        categoryId,
        `cat-${categoryId.slice(0, 6)}`,
      ]);
    }

    const cmRes = await pool.query<{ id: string }>(
      `SELECT id FROM crop_master WHERE deleted_at IS NULL AND is_active = true LIMIT 1`,
    );
    if (cmRes.rows[0]) {
      actualCropId = cmRes.rows[0].id;
    } else {
      await pool.query(
        `INSERT INTO crop_master (id, code, slug, name, category_id, default_unit, is_active)
         VALUES ($1, $2, $3, 'Test Tomato', $4, 'kg', true)`,
        [actualCropId, `CRP-${actualCropId.slice(0, 4)}`, `tomato-${actualCropId.slice(0, 6)}`, categoryId],
      );
    }

    const fpRes = await pool.query<{ id: string }>(
      `SELECT id FROM fair_prices WHERE crop_id = $1 AND grade = 'GRADE_1' LIMIT 1`,
      [actualCropId],
    );
    if (!fpRes.rows[0]) {
      await pool.query(
        `INSERT INTO fair_prices (id, crop_id, grade, ceiling_price, effective_from, set_by)
         VALUES ($1, $2, 'GRADE_1', 120.00, '2026-01-01', $3)`,
        [fairPriceId, actualCropId, superAdminId],
      );
    }
    const activeFairPriceId = fpRes.rows[0]?.id ?? fairPriceId;
    (globalThis as Record<string, unknown>)['__lifecycle_fp_id'] = activeFairPriceId;
  });

  afterAll(async () => {
    if (!ready) return;
    try {
      await pool.query(`DELETE FROM farmer_subscriptions WHERE farmer_id = $1`, [farmerId]);
      await pool.query(`DELETE FROM payouts WHERE farmer_id = $1`, [farmerId]);
      await pool.query(`DELETE FROM produce_listings WHERE farmer_id = $1`, [farmerId]);
      await pool.query(`DELETE FROM certifications WHERE farmer_id = $1`, [farmerId]);
    } finally {
      server?.close();
    }
  });

  it('BR-238: disabling a farmer cascades to pending listings, counter-offers, & payouts and blocks new ones; reactivation restores access', async (ctx) => {
    if (!ready) return ctx.skip();

    const saToken = token(superAdminId, RoleCode.SUPER_ADMIN);
    const farmerToken = token(farmerUserId, RoleCode.FARMER, { farmerId });

    // Seed verified certificate so listing eligibility passes while active
    await pool.query(
      `INSERT INTO certifications (farmer_id, cert_type, cert_number, issuing_body, issued_on, expires_on, verification_status, verified_by, verified_at)
       VALUES ($1, 'PGS', $2, 'PGS India', '2026-01-01', '2028-12-31', 'VERIFIED', $3, now())`,
      [farmerId, `PGS-${newId().slice(0, 6)}`, superAdminId],
    );

    const pendingListingId = newId();
    const acceptedListingId = newId();
    const activeFairPriceId = ((globalThis as Record<string, unknown>)['__lifecycle_fp_id'] as string) ?? fairPriceId;
    await pool.query(
      `INSERT INTO produce_listings (id, listing_number, farmer_id, crop_id, grade, quantity_kg, price_per_kg, fair_price_id, status)
       VALUES
         ($1, $2, $5, $6, 'GRADE_1', 50, 80.00, $7, 'PENDING_APPROVAL'),
         ($3, $4, $5, $6, 'GRADE_1', 40, 80.00, $7, 'ACCEPTED')`,
      [pendingListingId, `LST-${pendingListingId.slice(0, 6)}`, acceptedListingId, `LST-${acceptedListingId.slice(0, 6)}`, farmerId, actualCropId, activeFairPriceId],
    );

    const pendingOfferId = newId();
    await pool.query(
      `INSERT INTO counter_offers (id, listing_id, round, actor, actor_user_id, price_per_kg, quantity_kg, status, expires_at)
       VALUES ($1, $2, 1, 'ADMIN', $3, 75.00, 50, 'PENDING', now() + interval '24 hours')`,
      [pendingOfferId, pendingListingId, superAdminId],
    );

    const pendingPayoutId = newId();
    const paidPayoutId = newId();
    await pool.query(
      `INSERT INTO payouts (id, payout_number, farmer_id, amount, mode, status, initiated_by)
       VALUES
         ($1, $2, $5, 1000.00, 'IMPS', 'PENDING_APPROVAL', $6),
         ($3, $4, $5, 500.00, 'IMPS', 'PAID', $6)`,
      [pendingPayoutId, `PAY-${pendingPayoutId.slice(0, 6)}`, paidPayoutId, `PAY-${paidPayoutId.slice(0, 6)}`, farmerId, superAdminId],
    );

    // Disable farmer account
    const disableRes = await request(server)
      .post(`/v1/admin/farmers/${farmerId}/status`)
      .set('Authorization', `Bearer ${saToken}`)
      .send({ action: 'DISABLE', reason: 'Policy violation audit hold' });
    expect(disableRes.status).toBe(200);
    expect(disableRes.body.accountStatus).toBe('DISABLED');
    expect(disableRes.body.isMarketBlocked).toBe(true);

    // Verify cascaded updates in DB
    const lRows = await pool.query<{ id: string; status: string }>(
      `SELECT id, status FROM produce_listings WHERE id IN ($1, $2)`,
      [pendingListingId, acceptedListingId],
    );
    expect(lRows.rows.find((r) => r.id === pendingListingId)?.status).toBe('REJECTED');
    expect(lRows.rows.find((r) => r.id === acceptedListingId)?.status).toBe('ACCEPTED');

    const coRow = await pool.query<{ status: string }>(`SELECT status FROM counter_offers WHERE id = $1`, [pendingOfferId]);
    expect(coRow.rows[0]?.status).toBe('REJECTED');

    const pRows = await pool.query<{ id: string; status: string; rejected_by: string | null }>(
      `SELECT id, status, rejected_by FROM payouts WHERE id IN ($1, $2)`,
      [pendingPayoutId, paidPayoutId],
    );
    expect(pRows.rows.find((r) => r.id === pendingPayoutId)).toMatchObject({
      status: 'REJECTED',
      rejected_by: superAdminId,
    });
    expect(pRows.rows.find((r) => r.id === paidPayoutId)?.status).toBe('PAID');

    // Disabled farmer cannot create a new listing -> 403
    const blockedListing = await request(server)
      .post('/v1/listings')
      .set('Authorization', `Bearer ${farmerToken}`)
      .set('Idempotency-Key', newId())
      .send({ cropId: actualCropId, grade: 'GRADE_1', quantityKg: '25.000', askingPricePerKg: '40.00' });
    expect(blockedListing.status).toBe(403);

    // Reactivate farmer account
    const activateRes = await request(server)
      .post(`/v1/admin/farmers/${farmerId}/status`)
      .set('Authorization', `Bearer ${saToken}`)
      .send({ action: 'ACTIVATE', reason: 'Compliance verified' });
    expect(activateRes.status).toBe(200);
    expect(activateRes.body.accountStatus).toBe('ACTIVE');
    expect(activateRes.body.isMarketBlocked).toBe(false);

    // Reactivated farmer can create listing again
    const allowedListing = await request(server)
      .post('/v1/listings')
      .set('Authorization', `Bearer ${farmerToken}`)
      .set('Idempotency-Key', newId())
      .send({ cropId: actualCropId, grade: 'GRADE_1', quantityKg: '25.000', askingPricePerKg: '40.00' });
    expect(allowedListing.status).toBe(201);
  });

  it('BR-239: TOHFA_ADMIN & SUPER_ADMIN can extend and waive farmer subscription; FARMER_ADMIN is 403; audit_log written', async (ctx) => {
    if (!ready) return ctx.skip();

    const taToken = token(tohfaAdminId, RoleCode.TOHFA_ADMIN);
    const saToken = token(superAdminId, RoleCode.SUPER_ADMIN);
    const faToken = token(farmerAdminId, RoleCode.FARMER_ADMIN, { zoneId });

    // FARMER_ADMIN cannot extend or waive -> 403
    const faExt = await request(server)
      .post(`/v1/admin/farmers/${farmerId}/subscription/extend`)
      .set('Authorization', `Bearer ${faToken}`)
      .send({ months: 3, reason: 'Goodwill extension' });
    expect(faExt.status).toBe(403);

    const faWaive = await request(server)
      .post(`/v1/admin/farmers/${farmerId}/subscription/waive`)
      .set('Authorization', `Bearer ${faToken}`)
      .send({ months: 12, reason: 'FPO subsidy' });
    expect(faWaive.status).toBe(403);

    // TOHFA_ADMIN waives fee -> 200 & status WAIVED
    const waiveRes = await request(server)
      .post(`/v1/admin/farmers/${farmerId}/subscription/waive`)
      .set('Authorization', `Bearer ${taToken}`)
      .send({ tier: 'PAID', months: 6, reason: 'Onboarding grant for FPO farmer' });
    expect(waiveRes.status).toBe(200);
    expect(waiveRes.body.current).toMatchObject({ tier: 'PAID', status: 'WAIVED' });

    const prevEnd = waiveRes.body.current.periodEnd as string;

    // SUPER_ADMIN extends -> 200 & periodEnd extended beyond prevEnd
    const extendRes = await request(server)
      .post(`/v1/admin/farmers/${farmerId}/subscription/extend`)
      .set('Authorization', `Bearer ${saToken}`)
      .send({ months: 3, reason: 'Seasonal extension' });
    expect(extendRes.status).toBe(200);
    expect(extendRes.body.current.periodEnd > prevEnd).toBe(true);

    const auditRes = await pool.query<{ action_code: string }>(
      `SELECT action_code FROM audit_log
        WHERE entity_type = 'farmer_subscription' AND actor_id IN ($1, $2)
        ORDER BY created_at ASC`,
      [tohfaAdminId, superAdminId],
    );
    expect(auditRes.rows.map((r) => r.action_code)).toEqual(['farmer.subscription.waive', 'farmer.subscription.extend']);
  });
});
