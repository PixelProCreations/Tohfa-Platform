/**
 * Admin application review flow — the database half of BR-214 .. BR-219.
 *
 * Part 1 runs inside one transaction per test that is always rolled back: the append-only
 * triggers, the CHECK constraints and the repo SQL (the zone-wipe fix, structured history).
 * Part 2 drives the real HTTP stack end to end; it has to commit (the service opens its own
 * transactions), so it removes exactly the rows it created in afterAll.
 *
 * Gated on DATABASE_URL like every other integration test; never run against anything but a
 * `_test` database (src/test/dbSafety.ts enforces that before any pool exists).
 */
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Pool, PoolClient } from 'pg';
import { createApp } from '../../app.js';
import { describeIfDatabase, IDS } from '../../test/factories.js';
import { ensureStandardUsers, requireDatabaseTables } from '../../test/dbFixtures.js';
import { purgeFarmerApplicationsByIds } from '../../test/committedFixtureCleanup.js';
import { defaultBlobStorage } from '../../storage/blobStorage.js';
import { farmerApplicationsRepo } from './farmer-applications.repo.js';
import { documentKeyOf } from './farmer-applications.review.js';

const POLYGON = {
  type: 'Polygon',
  coordinates: [
    [
      [76.6948, 11.41],
      [76.6953, 11.41],
      [76.6953, 11.4105],
      [76.6948, 11.4105],
      [76.6948, 11.41],
    ],
  ],
};

function uniqueMobile(): string {
  return `+9197${String(Date.now()).slice(-6)}${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`;
}

describeIfDatabase('Application review against PostgreSQL', () => {
  let pool: Pool;
  let ready = false;
  let zoneId: string | null = null;

  beforeAll(async () => {
    ready = await requireDatabaseTables('farmer_applications', 'farmer_application_reviews', 'users');
    if (!ready) return;
    pool = (await import('../../db/pool.js')).pool;
    await ensureStandardUsers(pool, 'userSuperAdmin', 'userFarmer');
    const zone = await pool.query<{ id: string }>(`SELECT id FROM zones WHERE is_active = true ORDER BY code LIMIT 1`);
    zoneId = zone.rows[0]?.id ?? null;
  });

  /** Runs `fn` in a transaction that is always rolled back. */
  async function inRollback(fn: (client: PoolClient) => Promise<void>): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await fn(client);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  }

  async function insertApplication(client: PoolClient, status: string): Promise<string> {
    const res = await client.query<{ id: string }>(
      `INSERT INTO farmer_applications (mobile, full_name, status, is_draft, zone_id)
       VALUES ($1, 'Rollback Applicant', $2::application_status, false, $3) RETURNING id`,
      [uniqueMobile(), status, zoneId],
    );
    return res.rows[0]!.id;
  }

  async function expectRefused(client: PoolClient, sql: string, params: unknown[]): Promise<string> {
    await client.query('SAVEPOINT attempt');
    try {
      await client.query(sql, params);
    } catch (error) {
      await client.query('ROLLBACK TO SAVEPOINT attempt');
      return (error as { code?: string }).code ?? 'unknown';
    }
    throw new Error(`expected the database to refuse: ${sql}`);
  }

  describe('rolled back', () => {
    it('BR-218c: farmer_application_status_history refuses UPDATE and DELETE', async (ctx) => {
      if (!ready) return ctx.skip();
      await inRollback(async (client) => {
        const appId = await insertApplication(client, 'DOCS_REVIEW');
        await farmerApplicationsRepo.insertNote(client, {
          applicationId: appId,
          status: 'DOCS_REVIEW',
          actorId: IDS.userSuperAdmin,
          note: 'Original note',
        });
        expect(
          await expectRefused(client, `UPDATE farmer_application_status_history SET note = 'rewritten' WHERE application_id = $1`, [appId]),
        ).toBe('23514');
        expect(
          await expectRefused(client, `DELETE FROM farmer_application_status_history WHERE application_id = $1`, [appId]),
        ).toBe('23514');
        // ON DELETE RESTRICT: an application with a trail cannot be hard-deleted.
        expect(await expectRefused(client, `DELETE FROM farmer_applications WHERE id = $1`, [appId])).toMatch(/^23/);
      });
    });

    it('BR-215d: farmer_application_reviews refuses UPDATE and DELETE, and a rejection without a reason', async (ctx) => {
      if (!ready) return ctx.skip();
      await inRollback(async (client) => {
        const appId = await insertApplication(client, 'DOCS_REVIEW');
        await farmerApplicationsRepo.insertReview(client, {
          applicationId: appId,
          subjectType: 'DOCUMENT',
          subjectKey: 'a'.repeat(32),
          contentFingerprint: 'a'.repeat(32),
          decision: 'VERIFIED',
          reason: null,
          reviewedBy: IDS.userSuperAdmin,
        });
        expect(
          await expectRefused(client, `UPDATE farmer_application_reviews SET decision = 'REJECTED' WHERE application_id = $1`, [appId]),
        ).toBe('23514');
        expect(await expectRefused(client, `DELETE FROM farmer_application_reviews WHERE application_id = $1`, [appId])).toBe('23514');
        expect(
          await expectRefused(
            client,
            `INSERT INTO farmer_application_reviews (application_id, subject_type, subject_key, content_fingerprint, decision, reviewed_by)
             VALUES ($1, 'FMB', 'loc-a', 'x', 'REJECTED', $2)`,
            [appId, IDS.userSuperAdmin],
          ),
        ).toBe('23514');
        const rows = await farmerApplicationsRepo.listReviews(client, appId);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({ subject_type: 'DOCUMENT', decision: 'VERIFIED', reviewed_by: IDS.userSuperAdmin });
      });
    });

    it('BR-217a/c: request-info stores INFO_REQUESTED with its checklist and keeps the zone; resubmit keeps it too', async (ctx) => {
      if (!ready || zoneId === null) return ctx.skip();
      await inRollback(async (client) => {
        const appId = await insertApplication(client, 'DOCS_REVIEW');
        await farmerApplicationsRepo.transitionStatus(
          client,
          appId,
          'DOCS_REVIEW',
          'INFO_REQUESTED',
          IDS.userSuperAdmin,
          'Upload the FMB sketch',
          undefined,
          { requestedItems: ['FMB_SKETCH', 'PATTA_CHITTA'] },
        );
        const requested = await farmerApplicationsRepo.findById(client, appId);
        expect(requested).toMatchObject({
          status: 'INFO_REQUESTED',
          zone_id: zoneId,
          is_info_requested: true,
          info_request_items: ['FMB_SKETCH', 'PATTA_CHITTA'],
          info_request_message: 'Upload the FMB sketch',
          info_requested_by: IDS.userSuperAdmin,
        });

        await farmerApplicationsRepo.transitionStatus(client, appId, 'INFO_REQUESTED', 'DOCS_REVIEW', undefined, 'Resubmitted by applicant');
        const back = await farmerApplicationsRepo.findById(client, appId);
        expect(back).toMatchObject({ status: 'DOCS_REVIEW', zone_id: zoneId, is_info_requested: false });

        expect(
          await expectRefused(
            client,
            `INSERT INTO farmer_application_status_history (application_id, from_status, to_status, requested_items)
             VALUES ($1, 'DOCS_REVIEW', 'INFO_REQUESTED', ARRAY['PASSPORT'])`,
            [appId],
          ),
        ).toBe('23514');
      });
    });

    it('BR-218b: reject stores reason_code in its own column; history rows carry event_type', async (ctx) => {
      if (!ready) return ctx.skip();
      await inRollback(async (client) => {
        const appId = await insertApplication(client, 'FARM_VERIFICATION');
        await farmerApplicationsRepo.transitionStatus(
          client,
          appId,
          'FARM_VERIFICATION',
          'REJECTED',
          IDS.userSuperAdmin,
          '[LAND_NOT_VERIFIED] Boundary overlaps forest',
          undefined,
          { reasonCode: 'LAND_NOT_VERIFIED' },
        );
        const history = await farmerApplicationsRepo.getStatusHistory(client, appId);
        expect(history.at(-1)).toMatchObject({ to_status: 'REJECTED', reason_code: 'LAND_NOT_VERIFIED', event_type: 'TRANSITION' });
        const row = await farmerApplicationsRepo.findById(client, appId);
        expect(row).toMatchObject({ rejection_reason_code: 'LAND_NOT_VERIFIED' });
      });
    });
  });

  describe('end to end over HTTP (committed, cleaned up)', () => {
    const app = createApp();
    const server = app.listen(0);
    const createdAppIds: string[] = [];
    const createdUploadKeys: string[] = [];
    let token = '';

    beforeAll(async () => {
      token = (await import('../../auth/jwt.js')).signAccessToken({
        sub: IDS.userSuperAdmin,
        roles: [{ code: 'SUPER_ADMIN' }],
        farmerId: null,
        customerId: null,
      });
    });

    afterAll(async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      if (ready && createdAppIds.length > 0) {
        await purgeFarmerApplicationsByIds(pool, createdAppIds, { uploadKeys: createdUploadKeys });
      }
    });

    async function draftReadyForReview(withUploads: boolean): Promise<{ id: string; urls: { id: string; patta: string } }> {
      const mobile = uniqueMobile();
      const created = await request(server).post('/v1/farmers/applications').send({ mobile, fullName: 'Review E2E Farmer' });
      expect(created.status).toBe(201);
      const id = created.body.id as string;
      createdAppIds.push(id);

      const idKey = `farmer-applications/${id}/aadhaar-${randomUUID()}.pdf`;
      const pattaKey = `farmer-applications/${id}/patta-${randomUUID()}.pdf`;
      if (withUploads) {
        for (const [key, size] of [
          [idKey, 1000],
          [pattaKey, 2000],
        ] as const) {
          await pool.query(
            `INSERT INTO uploads (storage_key, bucket, mime_type, size_bytes, entity_type, entity_id, is_public)
             VALUES ($1, 'test', 'application/pdf', $2, 'farmer_application', $3, false)`,
            [key, size, id],
          );
          createdUploadKeys.push(key);
        }
      }
      const urls = { id: defaultBlobStorage.getPublicUrl(idKey), patta: defaultBlobStorage.getPublicUrl(pattaKey) };

      expect((await request(server).patch(`/v1/farmers/applications/${id}/steps/1`).send({ fullName: 'Review E2E Farmer', zoneId })).status).toBe(200);
      expect(
        (
          await request(server)
            .patch(`/v1/farmers/applications/${id}/steps/3`)
            .send({ locations: [{ id: 'loc-a', label: 'Home plot', areaAcres: 2.5, fmbPolygon: POLYGON }] })
        ).status,
      ).toBe(200);
      expect(
        (
          await request(server)
            .patch(`/v1/farmers/applications/${id}/steps/4`)
            .send({
              documents: [
                { docType: 'ID_PROOF', fileUrl: urls.id },
                { docType: 'FARM_DOC', fileUrl: urls.patta },
              ],
            })
        ).status,
      ).toBe(200);
      const submitted = await request(server).post(`/v1/farmers/applications/${id}/submit`);
      expect(submitted.status).toBe(200);
      expect(submitted.body.status).toBe('DOCS_REVIEW');
      return { id, urls };
    }

    const admin = (r: request.Test) => r.set('Authorization', `Bearer ${token}`);

    it('BR-214 / BR-219: review documents, advance, review FMB, approve once, and carry the documents into farmer_documents', async (ctx) => {
      if (!ready || zoneId === null) return ctx.skip();
      const { id, urls } = await draftReadyForReview(true);
      const idDocKey = documentKeyOf('ID_PROOF', urls.id);
      const pattaDocKey = documentKeyOf('FARM_DOC', urls.patta);

      const detail = await admin(request(server).get(`/v1/admin/farmer-applications/${id}`));
      expect(detail.status).toBe(200);
      expect(detail.body.documents.map((d: { documentKey: string }) => d.documentKey).sort()).toEqual([idDocKey, pattaDocKey].sort());
      expect(detail.body.locations[0]).toMatchObject({ locationId: 'loc-a', hasBoundary: true, fmbReview: { status: 'PENDING' } });
      expect(detail.body.reviewGates.farmVerification.met).toBe(false);

      // BR-214a: no advance before the documents are verified.
      const early = await admin(request(server).post(`/v1/admin/farmer-applications/${id}/advance`))
        .set('Idempotency-Key', randomUUID())
        .send({ toStatus: 'FARM_VERIFICATION' });
      expect(early.status).toBe(409);
      expect(early.body.code).toBe('APPLICATION_DOCUMENTS_NOT_VERIFIED');

      for (const key of [idDocKey, pattaDocKey]) {
        const res = await admin(request(server).post(`/v1/admin/farmer-applications/${id}/documents/${key}/review`))
          .set('Idempotency-Key', randomUUID())
          .send({ decision: 'VERIFIED' });
        expect(res.status).toBe(200);
      }

      // BR-214b: approval is not possible from DOCS_REVIEW.
      const tooSoon = await admin(request(server).post(`/v1/admin/farmer-applications/${id}/approve`))
        .set('Idempotency-Key', randomUUID())
        .send({});
      expect(tooSoon.status).toBe(409);
      expect(tooSoon.body.code).toBe('INVALID_STATE_TRANSITION');

      const advanced = await admin(request(server).post(`/v1/admin/farmer-applications/${id}/advance`))
        .set('Idempotency-Key', randomUUID())
        .send({ toStatus: 'FARM_VERIFICATION', note: 'Documents verified' });
      expect(advanced.status).toBe(200);
      expect(advanced.body.status).toBe('FARM_VERIFICATION');

      const noFmb = await admin(request(server).post(`/v1/admin/farmer-applications/${id}/approve`))
        .set('Idempotency-Key', randomUUID())
        .send({});
      expect(noFmb.status).toBe(409);
      expect(noFmb.body.code).toBe('APPLICATION_FMB_NOT_VERIFIED');

      const fmb = await admin(request(server).post(`/v1/admin/farmer-applications/${id}/locations/loc-a/fmb-review`))
        .set('Idempotency-Key', randomUUID())
        .send({ decision: 'VERIFIED' });
      expect(fmb.status).toBe(200);
      expect(fmb.body.reviewGates.approval.met).toBe(true);

      const approveKey = randomUUID();
      const approved = await admin(request(server).post(`/v1/admin/farmer-applications/${id}/approve`))
        .set('Idempotency-Key', approveKey)
        .send({ note: 'All verified' });
      expect(approved.status).toBe(200);
      expect(approved.body.status).toBe('APPROVED');

      // BR-214e: the replay returns the first response and approves nothing twice.
      const replay = await admin(request(server).post(`/v1/admin/farmer-applications/${id}/approve`))
        .set('Idempotency-Key', approveKey)
        .send({ note: 'All verified' });
      expect(replay.status).toBe(200);
      expect(replay.body).toEqual(approved.body);
      const audits = await pool.query(
        `SELECT count(*)::int AS n FROM audit_log WHERE entity_id = $1 AND action_code = 'farmer.application.approve'`,
        [id],
      );
      expect(audits.rows[0].n).toBe(1);

      // BR-219a: both documents carried over, VERIFIED, with the reviewer and time.
      const docs = await pool.query<{ doc_type: string; verification_status: string; verified_by: string | null; verified_at: Date | null; storage_key: string }>(
        `SELECT fd.doc_type, fd.verification_status, fd.verified_by, fd.verified_at, fd.storage_key
           FROM farmer_documents fd JOIN farmer_applications fa ON fa.farmer_id = fd.farmer_id
          WHERE fa.id = $1 ORDER BY fd.doc_type`,
        [id],
      );
      expect(docs.rows).toHaveLength(2);
      for (const row of docs.rows) {
        expect(row.verification_status).toBe('VERIFIED');
        expect(row.verified_by).toBe(IDS.userSuperAdmin);
        expect(row.verified_at).toBeInstanceOf(Date);
      }

      // BR-218: every step is in the history with its actor.
      const history = await pool.query<{ to_status: string; actor_id: string | null; event_type: string }>(
        `SELECT to_status, actor_id, event_type FROM farmer_application_status_history WHERE application_id = $1 ORDER BY created_at`,
        [id],
      );
      expect(history.rows.map((r) => r.to_status)).toEqual(['DOCS_REVIEW', 'FARM_VERIFICATION', 'APPROVED']);
      expect(history.rows.slice(1).every((r) => r.actor_id === IDS.userSuperAdmin)).toBe(true);
    });

    it('BR-217: request-info keeps the zone, the applicant sees the checklist on /status, and resubmits into DOCS_REVIEW', async (ctx) => {
      if (!ready || zoneId === null) return ctx.skip();
      const { id } = await draftReadyForReview(false);

      const asked = await admin(request(server).post(`/v1/admin/farmer-applications/${id}/request-info`))
        .set('Idempotency-Key', randomUUID())
        .send({ items: ['FMB_SKETCH', 'AADHAAR'], message: 'Please upload the FMB sketch and a clear Aadhaar' });
      expect(asked.status).toBe(200);
      expect(asked.body.status).toBe('INFO_REQUESTED');
      expect(asked.body.zoneId).toBe(zoneId);

      const status = await request(server).get(`/v1/farmers/applications/${id}/status`);
      expect(status.status).toBe(200);
      expect(status.body.status).toBe('INFO_REQUESTED');
      expect(status.body.infoRequest).toMatchObject({
        items: ['FMB_SKETCH', 'AADHAAR'],
        message: 'Please upload the FMB sketch and a clear Aadhaar',
      });

      const list = await admin(request(server).get(`/v1/admin/farmer-applications?status=INFO_REQUESTED&q=${encodeURIComponent('Review E2E')}`));
      expect(list.status).toBe(200);
      expect(list.body.items.some((i: { id: string }) => i.id === id)).toBe(true);

      const resubmitted = await request(server).post(`/v1/farmers/applications/${id}/resubmit`);
      expect(resubmitted.status).toBe(200);
      expect(resubmitted.body.status).toBe('DOCS_REVIEW');
      expect(resubmitted.body.zoneId).toBe(zoneId);

      const note = await admin(request(server).post(`/v1/admin/farmer-applications/${id}/notes`))
        .set('Idempotency-Key', randomUUID())
        .send({ note: 'Resubmission received, re-checking Aadhaar' });
      expect(note.status).toBe(200);
      expect(note.body.status).toBe('DOCS_REVIEW');
      expect(note.body.reviewHistory.at(-1)).toMatchObject({ eventType: 'NOTE', actorId: IDS.userSuperAdmin });
    });
  });
});
