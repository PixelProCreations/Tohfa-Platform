/**
 * Admin On-Behalf Farm Records (BR-237 — D5 & D6):
 *  a) Farm Diary: POST/PATCH /v1/admin/farmers/:farmerId/diary/entries
 *  b) Crops: GET/POST /v1/admin/farmers/:farmerId/plots/:plotId/crops, PATCH /v1/admin/farmers/:farmerId/crops/:farmCropId
 *  c) Livestock: POST/PATCH /v1/admin/farmers/:farmerId/livestock/animals, POST lifecycle-events, GET/POST production-logs
 *  d) Farm Assets: POST/PATCH/DELETE /v1/admin/farmers/:farmerId/farm-assets
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
  return `+919${Math.floor(100000000 + Math.random() * 899999999)}`;
}

describeIfDatabase('Admin on-behalf farm records HTTP (BR-237)', () => {
  let server: Server;
  let ready = false;

  const zoneAId = newId();
  const zoneBId = newId();
  const superAdminId = newId();
  const tohfaAdminId = newId();
  const farmerAdminAId = newId();
  const mainWhAdminId = newId();
  const farmerAUserId = newId();
  const farmerAId = newId();
  const farmAId = newId();
  const plotAId = newId();
  const farmerBUserId = newId();
  const farmerBId = newId();
  const farmBId = newId();
  const plotBId = newId();
  let cropMasterId = '';
  let categoryId = '';
  let diaryCategoryKey = '';
  let diarySubActivityKey = '';

  const token = (userId: string, roleCode: RoleCode, extra: { zoneId?: string; farmerId?: string } = {}) =>
    signAccessToken({
      sub: userId,
      roles: [{ code: roleCode, ...(extra.zoneId ? { zoneId: extra.zoneId } : {}) }],
      farmerId: extra.farmerId ?? null,
      customerId: null,
    });

  beforeAll(async () => {
    try {
      await pool.query('SELECT 1 FROM diary_entries LIMIT 0');
      await pool.query('SELECT 1 FROM farm_crops LIMIT 0');
      await pool.query('SELECT 1 FROM livestock_animals LIMIT 0');
      await pool.query('SELECT 1 FROM farm_assets LIMIT 0');
      const colCheck = await pool.query<{ n: number }>(
        `SELECT COUNT(*)::int AS n FROM information_schema.columns
          WHERE table_name = 'diary_entries' AND column_name = 'created_by_admin_id'`,
      );
      if ((colCheck.rows[0]?.n ?? 0) === 0) return;
      ready = true;
    } catch {
      return;
    }

    const app = createApp();
    server = app.listen(0);

    await pool.query(
      `INSERT INTO zones (id, code, name, is_active) VALUES
        ($1, $2, 'Zone A Test', true),
        ($3, $4, 'Zone B Test', true)`,
      [zoneAId, `ZA-${zoneAId.slice(0, 6)}`, zoneBId, `ZB-${zoneBId.slice(0, 6)}`],
    );

    const insertUser = async (id: string, fullName: string, userType: 'ADMIN' | 'FARMER' = 'ADMIN') => {
      await pool.query(
        `INSERT INTO users (id, full_name, mobile, user_type, status) VALUES ($1, $2, $3, $4, 'ACTIVE')`,
        [id, fullName, randomMobile(), userType],
      );
    };

    await insertUser(superAdminId, 'Super Admin One', 'ADMIN');
    await insertUser(tohfaAdminId, 'Tohfa Admin One', 'ADMIN');
    await insertUser(farmerAdminAId, 'Field Agent North', 'ADMIN');
    await insertUser(mainWhAdminId, 'Main WH Admin', 'ADMIN');
    await insertUser(farmerAUserId, 'Farmer Zone A', 'FARMER');
    await insertUser(farmerBUserId, 'Farmer Zone B', 'FARMER');

    await pool.query(
      `INSERT INTO farmers (id, user_id, tohfa_farmer_id, zone_id, kyc_status, application_status) VALUES
        ($1, $2, $3, $4, 'VERIFIED', 'APPROVED'),
        ($5, $6, $7, $8, 'VERIFIED', 'APPROVED')`,
      [
        farmerAId,
        farmerAUserId,
        `TF-${farmerAId.slice(0, 6)}`,
        zoneAId,
        farmerBId,
        farmerBUserId,
        `TF-${farmerBId.slice(0, 6)}`,
        zoneBId,
      ],
    );

    await pool.query(
      `INSERT INTO farms (id, farmer_id, name, district) VALUES
        ($1, $2, 'Farm Alpha', 'The Nilgiris'),
        ($3, $4, 'Farm Beta', 'The Nilgiris')`,
      [farmAId, farmerAId, farmBId, farmerBId],
    );

    await pool.query(
      `INSERT INTO plots (id, farm_id, name, area_acres) VALUES
        ($1, $2, 'Plot One', 2.0),
        ($3, $4, 'Plot Two', 1.5)`,
      [plotAId, farmAId, plotBId, farmBId],
    );

    const catRes = await pool.query<{ id: string }>(`SELECT id FROM categories ORDER BY created_at LIMIT 1`);
    categoryId = catRes.rows[0]?.id ?? newId();
    if (catRes.rows.length === 0) {
      await pool.query(`INSERT INTO categories (id, slug, name, sort_order) VALUES ($1, $2, 'Veg Test', 99)`, [
        categoryId,
        `veg-${categoryId.slice(0, 6)}`,
      ]);
    }

    const cmRes = await pool.query<{ id: string }>(
      `SELECT id FROM crop_master WHERE deleted_at IS NULL AND is_active = true LIMIT 1`,
    );
    if (cmRes.rows[0]) {
      cropMasterId = cmRes.rows[0].id;
    } else {
      cropMasterId = newId();
      await pool.query(
        `INSERT INTO crop_master (id, code, slug, name, category_id, default_unit, is_active)
         VALUES ($1, $2, $3, 'Test Potato', $4, 'KG', true)`,
        [cropMasterId, `CRP-${cropMasterId.slice(0, 4)}`, `potato-${cropMasterId.slice(0, 6)}`, categoryId],
      );
    }

    const subRes = await pool.query<{ category_key: string; key: string }>(
      `SELECT s.category_key, s.key
         FROM diary_sub_activities s
         JOIN diary_activity_categories c ON c.key = s.category_key
        WHERE s.is_active = true AND c.is_active = true
        ORDER BY c.sort_order, s.sort_order
        LIMIT 1`,
    );
    if (subRes.rows[0]) {
      diaryCategoryKey = subRes.rows[0].category_key;
      diarySubActivityKey = subRes.rows[0].key;
    } else {
      diaryCategoryKey = 'land_prep_test';
      diarySubActivityKey = 'land_prep_test.plough';
      await pool.query(
        `INSERT INTO diary_activity_categories (key, name, sort_order, is_active) VALUES ($1, 'Land Prep', 1, true) ON CONFLICT DO NOTHING`,
        [diaryCategoryKey],
      );
      await pool.query(
        `INSERT INTO diary_sub_activities (key, category_key, name, sort_order, is_active) VALUES ($1, $2, 'Ploughing', 1, true) ON CONFLICT DO NOTHING`,
        [diarySubActivityKey, diaryCategoryKey],
      );
    }
  });

  afterAll(async () => {
    if (!ready) return;
    try {
      await pool.query(`DELETE FROM diary_entries WHERE farmer_id IN ($1, $2)`, [farmerAId, farmerBId]);
      await pool.query(`DELETE FROM farm_assets WHERE farm_id IN ($1, $2)`, [farmAId, farmBId]);
      await pool.query(`DELETE FROM livestock_production_logs WHERE farm_id IN ($1, $2)`, [farmAId, farmBId]);
      await pool.query(`DELETE FROM farm_crops WHERE plot_id IN ($1, $2)`, [plotAId, plotBId]);
      await pool.query(`DELETE FROM plots WHERE id IN ($1, $2)`, [plotAId, plotBId]);
      await pool.query(`UPDATE farms SET deleted_at = now() WHERE id IN ($1, $2)`, [farmAId, farmBId]);
      await pool.query(`UPDATE farmers SET deleted_at = now() WHERE id IN ($1, $2)`, [farmerAId, farmerBId]);
    } finally {
      server?.close();
    }
  });

  it('BR-237a (Farm Diary): admin adds & edits entry on behalf with audit_log, zone scoping, and ?addedOnBehalf filter', async (ctx) => {
    if (!ready) return ctx.skip();

    // Ensure a farmer-owned crop exists on plotA
    const farmerToken = token(farmerAUserId, RoleCode.FARMER, { farmerId: farmerAId });
    const ownCropRes = await request(server)
      .post(`/v1/farmers/me/plots/${plotAId}/crops`)
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ cropMasterId, plantedOn: '2026-10-01' });
    expect(ownCropRes.status).toBe(201);
    const farmCropId = ownCropRes.body.id as string;

    const growRes = await request(server)
      .patch(`/v1/farmers/me/crops/${farmCropId}`)
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ status: 'GROWING' });
    expect(growRes.status).toBe(200);

    // RBAC: FARMER and MAIN_WH_ADMIN forbidden (403)
    const deniedFarmer = await request(server)
      .post(`/v1/admin/farmers/${farmerAId}/diary/entries`)
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        plotId: plotAId,
        farmCropId,
        categoryKey: diaryCategoryKey,
        subActivityKey: diarySubActivityKey,
        activityFields: { depthCm: 15, method: 'TRACTOR' },
        minutes: 45,
        activityOn: '2026-10-02',
      });
    expect(deniedFarmer.status).toBe(403);

    const whToken = token(mainWhAdminId, RoleCode.MAIN_WH_ADMIN);
    const deniedWh = await request(server)
      .post(`/v1/admin/farmers/${farmerAId}/diary/entries`)
      .set('Authorization', `Bearer ${whToken}`)
      .send({
        plotId: plotAId,
        farmCropId,
        categoryKey: diaryCategoryKey,
        subActivityKey: diarySubActivityKey,
        activityFields: { depthCm: 15, method: 'TRACTOR' },
        minutes: 45,
        activityOn: '2026-10-02',
      });
    expect(deniedWh.status).toBe(403);

    // FARMER_ADMIN cannot access farmer in Zone B (404)
    const faToken = token(farmerAdminAId, RoleCode.FARMER_ADMIN, { zoneId: zoneAId });
    const outZone = await request(server)
      .post(`/v1/admin/farmers/${farmerBId}/diary/entries`)
      .set('Authorization', `Bearer ${faToken}`)
      .send({
        plotId: plotBId,
        farmCropId,
        categoryKey: 'land_prep',
        subActivityKey: 'land_prep.ploughing',
        activityFields: { depthCm: 15, method: 'TRACTOR' },
        minutes: 45,
        activityOn: '2026-10-02',
      });
    expect(outZone.status).toBe(404);

    // FARMER_ADMIN creates entry for Zone A farmer -> 201 with on-behalf badge
    const createRes = await request(server)
      .post(`/v1/admin/farmers/${farmerAId}/diary/entries`)
      .set('Authorization', `Bearer ${faToken}`)
      .send({
        plotId: plotAId,
        farmCropId,
        categoryKey: diaryCategoryKey,
        subActivityKey: diarySubActivityKey,
        activityFields: { depthCm: 20, method: 'TRACTOR' },
        minutes: 60,
        notes: 'Logged by field agent',
        activityOn: '2026-10-03',
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.createdByAdminId).toBe(farmerAdminAId);
    expect(createRes.body.createdByAdminName).toBe('Field Agent North');
    expect(createRes.body.addedOnBehalf).toBe(true);

    const entryId = createRes.body.id as string;

    // TOHFA_ADMIN edits the entry -> 200 & audit_log rows present
    const taToken = token(tohfaAdminId, RoleCode.TOHFA_ADMIN);
    const patchRes = await request(server)
      .patch(`/v1/admin/farmers/${farmerAId}/diary/entries/${entryId}`)
      .set('Authorization', `Bearer ${taToken}`)
      .send({ notes: 'Adjusted duration', minutes: 75 });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.minutes).toBe(75);
    expect(patchRes.body.addedOnBehalf).toBe(true);

    // Filter by ?addedOnBehalf=true and false on list endpoint
    const ownEntryRes = await request(server)
      .post(`/v1/farmers/me/diary/entries`)
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        plotId: plotAId,
        farmCropId,
        categoryKey: diaryCategoryKey,
        subActivityKey: diarySubActivityKey,
        activityFields: { depthCm: 10, method: 'BULLOCK' },
        minutes: 30,
        activityOn: '2026-10-04',
      });
    expect(ownEntryRes.status).toBe(201);
    expect(ownEntryRes.body.addedOnBehalf).toBe(false);
    expect(ownEntryRes.body.createdByAdminId).toBeNull();

    const adminListTrue = await request(server)
      .get(`/v1/admin/farmers/${farmerAId}/diary/entries?addedOnBehalf=true`)
      .set('Authorization', `Bearer ${taToken}`);
    expect(adminListTrue.status).toBe(200);
    expect(adminListTrue.body.items.map((x: { id: string }) => x.id)).toEqual([entryId]);

    const auditRes = await pool.query<{ action_code: string }>(
      `SELECT action_code FROM audit_log WHERE entity_type = 'diary_entry' AND entity_id = $1 ORDER BY created_at ASC`,
      [entryId],
    );
    expect(auditRes.rows.map((r) => r.action_code)).toEqual(['farmer.diary.admin_create', 'farmer.diary.admin_update']);
  });

  it('BR-237b (Crops): admin adds & edits farmer crops on behalf with audit_log and zone scoping', async (ctx) => {
    if (!ready) return ctx.skip();

    const saToken = token(superAdminId, RoleCode.SUPER_ADMIN);
    const faToken = token(farmerAdminAId, RoleCode.FARMER_ADMIN, { zoneId: zoneAId });

    // Out-of-zone blocked with 404
    const outZone = await request(server)
      .post(`/v1/admin/farmers/${farmerBId}/plots/${plotBId}/crops`)
      .set('Authorization', `Bearer ${faToken}`)
      .send({ cropMasterId, plantedOn: '2026-10-05' });
    expect(outZone.status).toBe(404);

    // SUPER_ADMIN creates PLANNED crop on plotA -> 201
    const createRes = await request(server)
      .post(`/v1/admin/farmers/${farmerAId}/plots/${plotAId}/crops`)
      .set('Authorization', `Bearer ${saToken}`)
      .send({ cropMasterId, expectedHarvestOn: '2027-01-15', expectedYieldKg: 500 });
    expect(createRes.status).toBe(201);
    expect(createRes.body.createdByAdminId).toBe(superAdminId);
    expect(createRes.body.createdByAdminName).toBe('Super Admin One');
    expect(createRes.body.addedOnBehalf).toBe(true);

    const cropId = createRes.body.id as string;

    const patchRes = await request(server)
      .patch(`/v1/admin/farmers/${farmerAId}/crops/${cropId}`)
      .set('Authorization', `Bearer ${faToken}`)
      .send({ notes: 'Verified germination rate' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.notes).toBe('Verified germination rate');

    const auditRes = await pool.query<{ action_code: string }>(
      `SELECT action_code FROM audit_log WHERE entity_type = 'farm_crop' AND entity_id = $1 ORDER BY created_at ASC`,
      [cropId],
    );
    expect(auditRes.rows.map((r) => r.action_code)).toEqual(['farmer.crops.admin_create', 'farmer.crops.admin_update']);
  });

  it('BR-237c (Livestock): admin creates/edits animal, logs production, and records lifecycle event on behalf', async (ctx) => {
    if (!ready) return ctx.skip();

    const taToken = token(tohfaAdminId, RoleCode.TOHFA_ADMIN);
    const faToken = token(farmerAdminAId, RoleCode.FARMER_ADMIN, { zoneId: zoneAId });

    // Create animal
    const animalRes = await request(server)
      .post(`/v1/admin/farmers/${farmerAId}/livestock/animals`)
      .set('Authorization', `Bearer ${faToken}`)
      .send({
        tag: `TAG-${newId().slice(0, 6)}`,
        name: 'Kaveri',
        species: 'CATTLE',
        gender: 'FEMALE',
        source: 'BORN_ON_FARM',
        organicStatus: 'ORGANIC',
      });
    expect(animalRes.status).toBe(201);
    expect(animalRes.body.createdByAdminId).toBe(farmerAdminAId);
    expect(animalRes.body.createdByAdminName).toBe('Field Agent North');
    expect(animalRes.body.addedOnBehalf).toBe(true);
    const animalId = animalRes.body.id as string;

    // Update animal
    const patchAnimal = await request(server)
      .patch(`/v1/admin/farmers/${farmerAId}/livestock/animals/${animalId}`)
      .set('Authorization', `Bearer ${taToken}`)
      .send({ breed: 'Kangayam' });
    expect(patchAnimal.status).toBe(200);
    expect(patchAnimal.body.breed).toBe('Kangayam');

    // Create production log
    const prodRes = await request(server)
      .post(`/v1/admin/farmers/${farmerAId}/livestock/production-logs`)
      .set('Authorization', `Bearer ${faToken}`)
      .send({
        animalId,
        productType: 'MILK',
        quantity: 12.5,
        unit: 'LITERS',
        loggedOn: '2026-10-05',
      });
    expect(prodRes.status).toBe(201);
    expect(prodRes.body.createdByAdminId).toBe(farmerAdminAId);
    expect(prodRes.body.addedOnBehalf).toBe(true);

    // List production logs
    const listProd = await request(server)
      .get(`/v1/admin/farmers/${farmerAId}/livestock/production-logs?addedOnBehalf=true`)
      .set('Authorization', `Bearer ${taToken}`);
    expect(listProd.status).toBe(200);
    expect(listProd.body.items.length).toBeGreaterThanOrEqual(1);

    // Record lifecycle event
    const lcRes = await request(server)
      .post(`/v1/admin/farmers/${farmerAId}/livestock/animals/${animalId}/lifecycle-events`)
      .set('Authorization', `Bearer ${taToken}`)
      .send({ eventType: 'TRANSFERRED', counterparty: 'Sister Farm', reason: 'Breeding loan' });
    expect(lcRes.status).toBe(201);
    expect(lcRes.body.lifecycleStatus).toBe('TRANSFERRED');

    const auditRes = await pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM audit_log WHERE entity_id = ANY($1::uuid[])`,
      [[animalId, prodRes.body.id]],
    );
    expect(auditRes.rows[0]?.n).toBe(4);
  });

  it('BR-237d (Farm Assets): admin creates, updates, and retires farm asset on behalf with audit_log', async (ctx) => {
    if (!ready) return ctx.skip();

    const saToken = token(superAdminId, RoleCode.SUPER_ADMIN);
    const faToken = token(farmerAdminAId, RoleCode.FARMER_ADMIN, { zoneId: zoneAId });

    const createRes = await request(server)
      .post(`/v1/admin/farmers/${farmerAId}/farm-assets`)
      .set('Authorization', `Bearer ${faToken}`)
      .send({
        name: 'Solar Sprayer',
        category: 'MACHINERY',
        purchasedOn: '2026-09-01',
        serviceIntervalDays: 90,
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.createdByAdminId).toBe(farmerAdminAId);
    expect(createRes.body.createdByAdminName).toBe('Field Agent North');
    expect(createRes.body.addedOnBehalf).toBe(true);
    const assetId = createRes.body.id as string;

    const patchRes = await request(server)
      .patch(`/v1/admin/farmers/${farmerAId}/farm-assets/${assetId}`)
      .set('Authorization', `Bearer ${saToken}`)
      .send({ notes: 'Checked nozzle' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.notes).toBe('Checked nozzle');

    const delRes = await request(server)
      .delete(`/v1/admin/farmers/${farmerAId}/farm-assets/${assetId}`)
      .set('Authorization', `Bearer ${saToken}`);
    expect(delRes.status).toBe(204);

    const auditRes = await pool.query<{ action_code: string }>(
      `SELECT action_code FROM audit_log WHERE entity_type = 'farm_asset' AND entity_id = $1 ORDER BY created_at ASC`,
      [assetId],
    );
    expect(auditRes.rows.map((r) => r.action_code)).toEqual([
      'farmer.farm_assets.admin_create',
      'farmer.farm_assets.admin_update',
      'farmer.farm_assets.admin_delete',
    ]);
  });
});
