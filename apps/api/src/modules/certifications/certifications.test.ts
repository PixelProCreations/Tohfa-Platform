import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { RoleCode } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { anActor, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import type { PoolClient } from 'pg';
import type { Executor } from '../../db/pool.js';
import {
  createCertificationsService,
  getDaysToExpiry,
} from './certifications.service.js';
import {
  MARKET_BLOCK_REASON,
  type CertificationRow,
  type CertificationsRepo,
  type RecomputeResult,
} from './certifications.repo.js';
import {
  certificationCreateSchema,
  certificationUpdateSchema,
  type CertificationCreate,
  type CertificationUpdate,
} from './certifications.schema.js';

function mockCertificationsRepo(initialCert?: Partial<CertificationRow>): CertificationsRepo {
  let certState: CertificationRow | null = initialCert
    ? ({
        id: initialCert.id ?? '33333333-3333-3333-3333-333333333333',
        farmer_id: initialCert.farmer_id ?? IDS.farmer,
        farm_id: initialCert.farm_id ?? null,
        cert_type: initialCert.cert_type ?? 'NPOP',
        custom_type_name: initialCert.custom_type_name ?? null,
        cert_number: initialCert.cert_number ?? 'NPOP/TN/2026/001',
        issuing_body: initialCert.issuing_body ?? 'Organic India Agency',
        issued_on: initialCert.issued_on ?? '2025-01-01',
        expires_on: initialCert.expires_on ?? '2027-01-01',
        document_id: null,
        document_url: initialCert.document_url ?? 'https://storage.tohfa.in/certs/cert1.pdf',
        verification_status: initialCert.verification_status ?? 'UNVERIFIED',
        verified_by: initialCert.verified_by ?? null,
        verified_at: initialCert.verified_at ?? null,
        verification_notes: initialCert.verification_notes ?? null,
        portal_checked_url: initialCert.portal_checked_url ?? null,
        created_at: new Date(),
        updated_at: null,
      } as CertificationRow)
    : null;
  // Soft delete (BR-50): the row stays, it just stops being found.
  let deleted = false;
  const live = () => (certState !== null && !deleted ? certState : null);

  let isMarketBlocked = true;
  let marketBlockReason: string | null = MARKET_BLOCK_REASON.PENDING;

  return {
    createCertification: async (_db, params) => {
      deleted = false;
      certState = {
        id: '33333333-3333-3333-3333-333333333333',
        farmer_id: params.farmerId,
        farm_id: null,
        cert_type: params.certType,
        custom_type_name: params.customTypeName,
        cert_number: params.certNumber,
        issuing_body: params.issuingBody,
        issued_on: params.issuedOn,
        expires_on: params.expiresOn,
        document_id: null,
        document_url: params.documentUrl ?? null,
        verification_status: 'UNVERIFIED',
        verified_by: null,
        verified_at: null,
        verification_notes: null,
        portal_checked_url: null,
        created_at: new Date(),
        updated_at: null,
      };
      return certState;
    },
    // A copy, like findOwnForUpdate: the before image an audit row records must
    // not change when the write that follows mutates the stored row.
    findByIdForUpdate: async (_db, id) => {
      const cert = live();
      if (cert && cert.id === id) return { ...cert };
      return null;
    },
    findOwnForUpdate: async (_db, id, farmerId) => {
      const cert = live();
      if (cert && cert.id === id && cert.farmer_id === farmerId) return { ...cert };
      return null;
    },
    updateCertificationResetVerification: async (_db, id, farmerId, params) => {
      const cert = live();
      if (!cert || cert.id !== id || cert.farmer_id !== farmerId) return null;
      cert.cert_type = params.certType;
      cert.custom_type_name = params.customTypeName;
      cert.cert_number = params.certNumber;
      cert.issuing_body = params.issuingBody;
      cert.issued_on = params.issuedOn;
      cert.expires_on = params.expiresOn;
      if (params.documentUrl !== undefined) cert.document_url = params.documentUrl;
      cert.verification_status = 'UNVERIFIED';
      cert.verified_by = null;
      cert.verified_at = null;
      cert.verification_notes = null;
      cert.portal_checked_url = null;
      cert.updated_at = new Date();
      return { ...cert };
    },
    softDeleteOwn: async (_db, id, farmerId) => {
      const cert = live();
      if (!cert || cert.id !== id || cert.farmer_id !== farmerId) return null;
      deleted = true;
      return { ...cert };
    },
    listByFarmerId: async () => ({
      items: live() ? [live()!] : [],
      nextCursor: null,
      hasMore: false,
    }),
    verifyCertification: async (_db, id, adminUserId, notes, portalUrl) => {
      if (certState && !deleted && certState.id === id) {
        certState.verification_status = 'VERIFIED';
        certState.verified_by = adminUserId;
        certState.verified_at = new Date();
        certState.verification_notes = notes ?? null;
        certState.portal_checked_url = portalUrl ?? null;
        return certState;
      }
      return null;
    },
    unverifyCertification: async (_db, id, adminUserId, reason) => {
      if (certState && !deleted && certState.id === id) {
        certState.verification_status = 'REJECTED';
        certState.verified_by = adminUserId;
        certState.verified_at = new Date();
        certState.verification_notes = reason;
        return certState;
      }
      return null;
    },
    recomputeFarmerMarketBlock: async (_db, farmerId): Promise<RecomputeResult> => {
      const prevBlocked = isMarketBlocked;
      const cert = live();
      if (cert && cert.verification_status === 'VERIFIED') {
        const days = getDaysToExpiry(cert.expires_on);
        if (days >= 0) {
          isMarketBlocked = false;
          marketBlockReason = null;
        } else {
          isMarketBlocked = true;
          marketBlockReason = MARKET_BLOCK_REASON.EXPIRED;
        }
      } else {
        isMarketBlocked = true;
        marketBlockReason = MARKET_BLOCK_REASON.PENDING;
      }
      return {
        farmerId,
        isMarketBlocked,
        marketBlockReason,
        changed: prevBlocked !== isMarketBlocked,
      };
    },
    getAllActiveFarmerIds: async () => [IDS.farmer],
    getCertExpiryWarningDays: async () => 30,
    getCertExpiryMaxPastDays: async () => 365,
    getCertExpiryMaxFutureDays: async () => 730,
    listAllCertifications: async () => ({
      items: live() ? [live()!] : [],
      nextCursor: null,
      hasMore: false,
    }),
    findByIdAdmin: async (_db, id) => {
      const cert = live();
      if (cert && cert.id === id) return cert;
      return null;
    },
  };
}

/**
 * The transaction executor for unit tests over the mock repo. The mock repo
 * ignores its executor, so the only statements that reach this one are
 * writeAuditLog's INSERTs (BR-35): each is answered with a fresh id and not
 * kept. Tests that inspect the audit rows use editHarness instead.
 */
const auditOnlyTx: Executor = {
  query: async () => ({ rows: [{ id: newId() }], rowCount: 1 }) as never,
};
const runInAuditOnlyTx = async <T>(fn: (tx: Executor) => Promise<T>): Promise<T> => fn(auditOnlyTx);

/** Today's Asia/Kolkata date shifted by whole days, for tests on the real clock. */
function kolkataDayOffset(days: number): string {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const CERT_ID = '33333333-3333-3333-3333-333333333333';
const OTHER_FARMER_ID = '44444444-4444-4444-4444-444444444444';

/**
 * BR-48j: the one answer to a certType + certNumber already on record, whoever
 * holds it. Spelled out here rather than imported so the contract is pinned.
 */
const CERT_NUMBER_UNAVAILABLE = "This certificate number can't be used. Check the number and try again.";

/**
 * A service over the mock repo whose transaction executor records what
 * writeAuditLog sends (the mock repo ignores its executor, so every query the
 * executor sees is an audit insert). Counts the writes BR-49/BR-50 care about.
 */
function editHarness(initial?: Partial<CertificationRow>) {
  const repo = mockCertificationsRepo(initial === undefined ? undefined : { id: CERT_ID, ...initial });
  const calls = { update: 0, softDelete: 0, recompute: 0 };
  const audits: unknown[][] = [];
  /** Arguments of each write, so a test can see whose certificate / farmer it touched. */
  const args = {
    update: [] as unknown[][],
    softDelete: [] as unknown[][],
    recompute: [] as unknown[][],
  };

  const realUpdate = repo.updateCertificationResetVerification;
  repo.updateCertificationResetVerification = async (...a) => {
    calls.update += 1;
    args.update.push(a);
    return realUpdate(...a);
  };
  const realSoftDelete = repo.softDeleteOwn;
  repo.softDeleteOwn = async (...a) => {
    calls.softDelete += 1;
    args.softDelete.push(a);
    return realSoftDelete(...a);
  };
  const realRecompute = repo.recomputeFarmerMarketBlock;
  repo.recomputeFarmerMarketBlock = async (...a) => {
    calls.recompute += 1;
    args.recompute.push(a);
    return realRecompute(...a);
  };

  const tx: Executor = {
    query: async (_sql: string, params?: unknown[]) => {
      audits.push(params ?? []);
      return { rows: [{ id: newId() }], rowCount: 1 } as never;
    },
  };
  const service = createCertificationsService(repo, async (fn) => fn(tx));
  return { repo, calls, args, audits, service };
}

/** writeAuditLog's positional parameters: [3] action code, [5] entity id, [8] before, [9] after. */
function auditActionCodes(audits: unknown[][]): unknown[] {
  return audits.map((params) => params[3]);
}

/** One recorded writeAuditLog call, by name (see auditLog.ts INSERT_SQL for the order). */
function auditRow(params: unknown[] | undefined) {
  const p = params ?? [];
  const json = (value: unknown) => (value === null || value === undefined ? null : JSON.parse(String(value)));
  return {
    actorId: p[0],
    actorType: p[1],
    actorRole: p[2],
    actionCode: p[3],
    entityType: p[4],
    entityId: p[5],
    before: json(p[8]) as Record<string, unknown> | null,
    after: json(p[9]) as Record<string, unknown> | null,
    changedFields: p[10] as string[] | null,
  };
}

/** Every key a certificate audit image carries — the certification.update shape (BR-35). */
const CERT_AUDIT_IMAGE_KEYS = [
  'certNumber',
  'certType',
  'customTypeName',
  'documentUrl',
  'expiresOn',
  'issuedOn',
  'issuingBody',
  'portalCheckedUrl',
  'verificationNotes',
  'verificationStatus',
  'verifiedAt',
  'verifiedBy',
];

describe('Certifications & BR-01/BR-02 Test Contracts', () => {
  describe('Asia/Kolkata Date & Expiry Calculations', () => {
    it('accurately computes positive and negative days to expiry', () => {
      const pastDate = '2020-01-01';
      expect(getDaysToExpiry(pastDate)).toBeLessThan(0);

      const futureDate = '2099-12-31';
      expect(getDaysToExpiry(futureDate)).toBeGreaterThan(0);
    });
  });

  describe('BR-01: Expired Certificate Blocks Market Listings', () => {
    it('BR-01a: farmer with a certificate expiring yesterday is market blocked (blocksListings: true)', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]!;
      const repo = mockCertificationsRepo({
        id: '33333333-3333-3333-3333-333333333333',
        expires_on: yesterday,
        verification_status: 'VERIFIED',
      });
      const service = createCertificationsService(repo);
      const actor = anActor({
        userId: IDS.userFarmer,
        roles: [{ code: RoleCode.FARMER }],
        farmerId: IDS.farmer,
      });

      const list = (await service.listMyCertifications(actor, { limit: 10 })) as {
        items: Array<{ blocksListings: boolean; daysToExpiry: number }>;
      };

      expect(list.items[0]?.blocksListings).toBe(true);
      expect(list.items[0]?.daysToExpiry).toBeLessThan(0);

      const recompute = await repo.recomputeFarmerMarketBlock(null as unknown as Executor, IDS.farmer);
      expect(recompute.isMarketBlocked).toBe(true);
      expect(recompute.marketBlockReason).toContain('BR-01');
    });

    it('BR-01b: re-verifying an unexpired certificate clears farmers.is_market_blocked', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]!;
      const repo = mockCertificationsRepo({
        id: '33333333-3333-3333-3333-333333333333',
        expires_on: tomorrow,
        verification_status: 'UNVERIFIED',
      });
      const mockTxRunner = runInAuditOnlyTx;
      const service = createCertificationsService(repo, mockTxRunner);

      // Admin verifies
      const adminActor = anActor({ userId: IDS.userSuperAdmin });
      await service.verifyCertification(adminActor, '33333333-3333-3333-3333-333333333333', {
        portalReference: 'NPOP-PORTAL-OK',
        note: 'Checked official portal',
      });

      const status = await repo.recomputeFarmerMarketBlock(null as unknown as Executor, IDS.farmer);
      expect(status.isMarketBlocked).toBe(false);
      expect(status.marketBlockReason).toBeNull();
    });
  });

  describe('BR-02: Manual Admin Verification & Unverified Block', () => {
    it('BR-02a: farmer with an uploaded but UNVERIFIED certificate remains market blocked', async () => {
      const futureDate = '2028-12-31';
      const repo = mockCertificationsRepo({
        id: '33333333-3333-3333-3333-333333333333',
        expires_on: futureDate,
        verification_status: 'UNVERIFIED',
      });
      const service = createCertificationsService(repo);
      const actor = anActor({
        userId: IDS.userFarmer,
        roles: [{ code: RoleCode.FARMER }],
        farmerId: IDS.farmer,
      });

      const list = (await service.listMyCertifications(actor, { limit: 10 })) as {
        items: Array<{ blocksListings: boolean; verificationStatus: string }>;
      };

      expect(list.items[0]?.verificationStatus).toBe('UNVERIFIED');
      expect(list.items[0]?.blocksListings).toBe(true);

      const recompute = await repo.recomputeFarmerMarketBlock(null as unknown as Executor, IDS.farmer);
      expect(recompute.isMarketBlocked).toBe(true);
      expect(recompute.marketBlockReason).toContain('BR-02');
    });

    it('BR-02b: unverify re-blocks the farmer immediately with reason', async () => {
      const futureDate = '2028-12-31';
      const repo = mockCertificationsRepo({
        id: '33333333-3333-3333-3333-333333333333',
        expires_on: futureDate,
        verification_status: 'VERIFIED',
      });
      const mockTxRunner = runInAuditOnlyTx;
      const service = createCertificationsService(repo, mockTxRunner);

      const adminActor = anActor({ userId: IDS.userSuperAdmin });
      await service.unverifyCertification(adminActor, '33333333-3333-3333-3333-333333333333', {
        reason: 'Certificate revoked by issuing authority for compliance violation',
      });

      const recompute = await repo.recomputeFarmerMarketBlock(null as unknown as Executor, IDS.farmer);
      expect(recompute.isMarketBlocked).toBe(true);
    });
  });

  describe('BR-02h: certificate type OTHER is recordable but never qualifies a farmer to list', () => {
    const farmerActor = () =>
      anActor({ userId: IDS.userFarmer, roles: [{ code: RoleCode.FARMER }], farmerId: IDS.farmer });
    const mockTx = runInAuditOnlyTx;

    async function listedCert(certType: CertificationRow['cert_type']) {
      const repo = mockCertificationsRepo({
        cert_type: certType,
        expires_on: '2099-12-31',
        verification_status: 'VERIFIED',
        verified_by: IDS.userSuperAdmin,
        verified_at: new Date(),
      });
      const service = createCertificationsService(repo);
      const list = (await service.listMyCertifications(farmerActor(), { limit: 10 })) as {
        items: Array<{ certType: string; blocksListings: boolean }>;
      };
      return list.items[0]!;
    }

    it('BR-02h: the request schema accepts certType OTHER (as well as PGS and NPOP)', () => {
      for (const certType of ['PGS', 'NPOP', 'OTHER']) {
        const parsed = certificationCreateSchema.safeParse({
          certType,
          // BR-48i: an OTHER certificate names its scheme; PGS/NPOP send none.
          ...(certType === 'OTHER' ? { customTypeName: 'Jaivik Bharat' } : {}),
          certNumber: 'JAIVIK-2026-001',
          issuingBody: 'Jaivik Bharat',
          issuedOn: '2025-04-01',
          expiresOn: '2027-03-31',
        });
        expect(parsed.success, certType).toBe(true);
      }
    });

    it('BR-02h: an OTHER certificate is created and returned with certType OTHER and blocksListings true', async () => {
      const service = createCertificationsService(mockCertificationsRepo(), mockTx);
      const created = (await service.createCertification(farmerActor(), {
        certType: 'OTHER',
        customTypeName: 'Jaivik Bharat',
        certNumber: 'JAIVIK-2026-001',
        issuingBody: 'Jaivik Bharat',
        issuedOn: kolkataDayOffset(-100),
        expiresOn: kolkataDayOffset(300),
      })) as { certType: string; verificationStatus: string; blocksListings: boolean };

      expect(created.certType).toBe('OTHER');
      expect(created.verificationStatus).toBe('UNVERIFIED');
      expect(created.blocksListings).toBe(true);
    });

    it('BR-02h: blocksListings is true for a VERIFIED, unexpired OTHER certificate — OTHER does not qualify on its own', async () => {
      const cert = await listedCert('OTHER');
      expect(cert.certType).toBe('OTHER');
      expect(cert.blocksListings).toBe(true);
    });

    it('BR-02h: blocksListings is false for a VERIFIED, unexpired PGS certificate and for an NPOP one (control)', async () => {
      expect((await listedCert('PGS')).blocksListings).toBe(false);
      expect((await listedCert('NPOP')).blocksListings).toBe(false);
    });
  });

  describe('BR-48: certificate dates are validated against today (Asia/Kolkata) on entry', () => {
    const farmerActor = () =>
      anActor({ userId: IDS.userFarmer, roles: [{ code: RoleCode.FARMER }], farmerId: IDS.farmer });
    const mockTx = runInAuditOnlyTx;

    function input(overrides: Partial<CertificationCreate>): CertificationCreate {
      return {
        certType: 'PGS',
        certNumber: 'PGS-TN-2026-00871',
        issuingBody: 'PGS Organic India Council',
        issuedOn: '2024-01-01',
        expiresOn: '2027-03-31',
        ...overrides,
      };
    }

    /** Runs a create and reports what happened, counting repo writes. */
    async function attempt(data: CertificationCreate, repo = mockCertificationsRepo()) {
      let writes = 0;
      const realCreate = repo.createCertification;
      repo.createCertification = async (db, params) => {
        writes += 1;
        return realCreate(db, params);
      };
      const service = createCertificationsService(repo, mockTx);
      try {
        const created = (await service.createCertification(farmerActor(), data)) as {
          expiresOn: string;
        };
        return { ok: true as const, created, writes };
      } catch (error) {
        return { ok: false as const, error: error as Record<string, unknown>, writes };
      }
    }

    beforeEach(() => {
      // Fixed clock: 2026-10-05 12:00 in Asia/Kolkata (06:30 UTC).
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-10-05T06:30:00Z'));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('BR-48a: accepts an expiresOn of today', async () => {
      const result = await attempt(input({ issuedOn: '2025-10-05', expiresOn: '2026-10-05' }));
      expect(result.ok).toBe(true);
      expect(result.writes).toBe(1);
    });

    it('BR-48a: accepts an already-expired expiresOn exactly 365 days before today (2025-10-05)', async () => {
      const result = await attempt(input({ issuedOn: '2024-10-05', expiresOn: '2025-10-05' }));
      expect(result.ok).toBe(true);
      expect(result.writes).toBe(1);
    });

    it('BR-48a: rejects an expiresOn 366 days before today (2025-10-04) with 422 VALIDATION_FAILED on body.expiresOn, writing nothing', async () => {
      const result = await attempt(input({ issuedOn: '2024-10-04', expiresOn: '2025-10-04' }));
      expect(result.ok).toBe(false);
      expect(result.writes).toBe(0);
      expect(result.ok ? null : result.error).toMatchObject({
        code: 'VALIDATION_FAILED',
        status: 422,
        errors: { 'body.expiresOn': [expect.stringContaining('2025-10-05')] },
      });
    });

    it('BR-48a: accepts an expiresOn of tomorrow', async () => {
      expect((await attempt(input({ expiresOn: '2026-10-06' }))).ok).toBe(true);
    });

    it('BR-48h: accepts an expiresOn exactly 730 days after today (2028-10-04)', async () => {
      const result = await attempt(input({ expiresOn: '2028-10-04' }));
      expect(result.ok).toBe(true);
      expect(result.writes).toBe(1);
    });

    it('BR-48h: rejects an expiresOn 731 days after today (2028-10-05), and one far in the future, with 422 VALIDATION_FAILED on body.expiresOn, writing nothing', async () => {
      for (const expiresOn of ['2028-10-05', '2099-12-31']) {
        const result = await attempt(input({ expiresOn }));
        expect(result.ok, expiresOn).toBe(false);
        expect(result.writes, expiresOn).toBe(0);
        expect(result.ok ? null : result.error).toMatchObject({
          code: 'VALIDATION_FAILED',
          status: 422,
          errors: { 'body.expiresOn': [expect.stringContaining('2028-10-04')] },
        });
      }
    });

    it('BR-48h: the future window is read from system_config (cert_expiry_max_future_days) — set to 30, the boundary moves to 30 days', async () => {
      const at30 = () => {
        const repo = mockCertificationsRepo();
        repo.getCertExpiryMaxFutureDays = async () => 30;
        return repo;
      };

      // 2026-11-04 is 30 days after 2026-10-05; 2026-11-05 is 31.
      expect((await attempt(input({ expiresOn: '2026-11-04' }), at30())).ok).toBe(true);
      const rejected = await attempt(input({ expiresOn: '2026-11-05' }), at30());
      expect(rejected.ok).toBe(false);
      expect(rejected.ok ? null : rejected.error).toMatchObject({
        code: 'VALIDATION_FAILED',
        errors: { 'body.expiresOn': [expect.stringContaining('2026-11-04')] },
      });

      // The same date is fine under the seeded 730-day window: only the config moved it.
      expect((await attempt(input({ expiresOn: '2026-11-05' }))).ok).toBe(true);
    });

    it('BR-48h: "today" for the future window is the Asia/Kolkata date, not the UTC date', async () => {
      // 19:00 UTC on 2026-10-04 is 00:30 on 2026-10-05 in Asia/Kolkata, so the
      // last allowed date is still 2028-10-04, not 2028-10-03.
      vi.setSystemTime(new Date('2026-10-04T19:00:00Z'));
      expect((await attempt(input({ expiresOn: '2028-10-04' }))).ok).toBe(true);
      expect((await attempt(input({ expiresOn: '2028-10-05' }))).ok).toBe(false);
    });

    it('BR-48i: an OTHER certificate is created with its trimmed customTypeName; a PGS one returns customTypeName null', async () => {
      const other = await attempt(input({ certType: 'OTHER', customTypeName: 'Jaivik Bharat' }));
      expect(other.ok).toBe(true);
      expect(other.ok ? other.created : null).toMatchObject({ certType: 'OTHER', customTypeName: 'Jaivik Bharat' });

      const pgs = await attempt(input({}));
      expect(pgs.ok ? pgs.created : null).toMatchObject({ certType: 'PGS', customTypeName: null });
    });

    it('BR-48i: the service refuses an OTHER certificate without customTypeName, and a PGS one with it, on body.customTypeName, writing nothing', async () => {
      const missing = await attempt(input({ certType: 'OTHER' }));
      expect(missing.writes).toBe(0);
      expect(missing.ok ? null : missing.error).toMatchObject({
        code: 'VALIDATION_FAILED',
        status: 422,
        errors: { 'body.customTypeName': [expect.any(String)] },
      });

      const extra = await attempt(input({ certType: 'NPOP', customTypeName: 'Jaivik Bharat' }));
      expect(extra.writes).toBe(0);
      expect(extra.ok ? null : extra.error).toMatchObject({
        code: 'VALIDATION_FAILED',
        errors: { 'body.customTypeName': [expect.any(String)] },
      });
    });

    it('BR-48b: the window is read from system_config (cert_expiry_max_past_days) — set to 30, the boundary moves to 30 days', async () => {
      const at30 = () => {
        const repo = mockCertificationsRepo();
        repo.getCertExpiryMaxPastDays = async () => 30;
        return repo;
      };

      // 2026-09-05 is 30 days before 2026-10-05; 2026-09-04 is 31.
      expect((await attempt(input({ expiresOn: '2026-09-05' }), at30())).ok).toBe(true);
      const rejected = await attempt(input({ expiresOn: '2026-09-04' }), at30());
      expect(rejected.ok).toBe(false);
      expect(rejected.ok ? null : rejected.error).toMatchObject({
        code: 'VALIDATION_FAILED',
        errors: { 'body.expiresOn': [expect.stringContaining('2026-09-05')] },
      });

      // The same date is fine under the seeded 365-day window: only the config moved it.
      expect((await attempt(input({ expiresOn: '2026-09-04' }))).ok).toBe(true);
    });

    it('BR-48c: "today" is the Asia/Kolkata calendar date, not the UTC date', async () => {
      // 19:00 UTC on 2026-10-04 is 00:30 on 2026-10-05 in Asia/Kolkata.
      vi.setSystemTime(new Date('2026-10-04T19:00:00Z'));

      // 365 days before the UTC date would allow 2025-10-04; Kolkata's "today" does not.
      expect((await attempt(input({ issuedOn: '2024-10-04', expiresOn: '2025-10-04' }))).ok).toBe(false);
      expect((await attempt(input({ issuedOn: '2024-10-05', expiresOn: '2025-10-05' }))).ok).toBe(true);
      // And an issuedOn of 2026-10-05 is today in Kolkata, not the future.
      expect((await attempt(input({ issuedOn: '2026-10-05', expiresOn: '2027-10-05' }))).ok).toBe(true);
    });

    it('BR-48d: rejects an issuedOn in the future (tomorrow) with 422 VALIDATION_FAILED on body.issuedOn, writing nothing', async () => {
      const result = await attempt(input({ issuedOn: '2026-10-06', expiresOn: '2027-10-06' }));
      expect(result.ok).toBe(false);
      expect(result.writes).toBe(0);
      expect(result.ok ? null : result.error).toMatchObject({
        code: 'VALIDATION_FAILED',
        status: 422,
        errors: { 'body.issuedOn': [expect.any(String)] },
      });
    });

    it('BR-48d: accepts an issuedOn of today', async () => {
      expect((await attempt(input({ issuedOn: '2026-10-05', expiresOn: '2027-10-04' }))).ok).toBe(true);
    });

    it('BR-48d: reports both fields when issuedOn is in the future and expiresOn is too old', async () => {
      // Impossible together only because the schema's issuedOn < expiresOn check
      // runs first over HTTP; the service still reports every field it checks.
      const result = await attempt(input({ issuedOn: '2026-10-06', expiresOn: '2020-01-01' }));
      expect(result.ok ? null : result.error).toMatchObject({
        code: 'VALIDATION_FAILED',
        errors: {
          'body.issuedOn': [expect.any(String)],
          'body.expiresOn': [expect.any(String)],
        },
      });
    });
  });

  describe('BR-48: certificate request schema (certificationCreateSchema)', () => {
    const base = {
      certType: 'NPOP',
      certNumber: 'NPOP/TN/2026/44120',
      issuingBody: 'Indian Organic Certification Agency',
      issuedOn: '2026-04-01',
      expiresOn: '2027-03-31',
    };

    function fieldErrors(body: Record<string, unknown>): Record<string, string[] | undefined> {
      const parsed = certificationCreateSchema.safeParse(body);
      if (parsed.success) return {};
      return parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>;
    }

    it('BR-48e: rejects impossible calendar dates', () => {
      for (const bad of ['2026-02-30', '2027-02-29', '2100-02-29', '2026-04-31', '2026-13-01', '2026-00-10', '2026-01-00', '0000-01-01']) {
        expect(fieldErrors({ ...base, issuedOn: '2020-01-01', expiresOn: bad }).expiresOn, bad).toBeDefined();
        expect(fieldErrors({ ...base, issuedOn: bad }).issuedOn, bad).toBeDefined();
      }
    });

    it('BR-48e: accepts real leap days (2028-02-29, 2000-02-29)', () => {
      expect(certificationCreateSchema.safeParse({ ...base, expiresOn: '2028-02-29' }).success).toBe(true);
      expect(certificationCreateSchema.safeParse({ ...base, issuedOn: '2000-02-29' }).success).toBe(true);
    });

    it('BR-48e: rejects date-times, other formats, empty strings and non-strings', () => {
      const bads: unknown[] = ['2027-03-31T00:00:00Z', '2027-03-31 ', '31/03/2027', '2027-3-31', '20270331', '', '   ', 20270331, null, true, {}];
      for (const bad of bads) {
        expect(fieldErrors({ ...base, expiresOn: bad }).expiresOn, JSON.stringify(bad)).toBeDefined();
        expect(fieldErrors({ ...base, issuedOn: bad }).issuedOn, JSON.stringify(bad)).toBeDefined();
      }
    });

    it('BR-48e: issuedOn and expiresOn are both required', () => {
      const { expiresOn: _e, ...noExpiry } = base;
      const { issuedOn: _i, ...noIssue } = base;
      expect(fieldErrors(noExpiry).expiresOn).toBeDefined();
      expect(fieldErrors(noIssue).issuedOn).toBeDefined();
    });

    it('BR-48f: rejects an issuedOn after expiresOn, and one equal to it (the database requires expires_on > issued_on)', () => {
      expect(fieldErrors({ ...base, issuedOn: '2027-04-01', expiresOn: '2027-03-31' }).expiresOn).toBeDefined();
      expect(fieldErrors({ ...base, issuedOn: '2027-03-31', expiresOn: '2027-03-31' }).expiresOn).toBeDefined();
      expect(certificationCreateSchema.safeParse({ ...base, issuedOn: '2027-03-30', expiresOn: '2027-03-31' }).success).toBe(true);
    });

    it('BR-48g: certNumber and issuingBody are trimmed, must be non-empty, and are capped at 80 and 160 characters', () => {
      expect(fieldErrors({ ...base, certNumber: '   ' }).certNumber).toBeDefined();
      expect(fieldErrors({ ...base, issuingBody: '' }).issuingBody).toBeDefined();
      expect(fieldErrors({ ...base, certNumber: 'X'.repeat(81) }).certNumber).toBeDefined();
      expect(fieldErrors({ ...base, issuingBody: 'X'.repeat(161) }).issuingBody).toBeDefined();
      expect(fieldErrors({ ...base, certNumber: 123 }).certNumber).toBeDefined();

      const parsed = certificationCreateSchema.parse({
        ...base,
        certNumber: `  ${'X'.repeat(80)}  `,
        issuingBody: ` ${'Y'.repeat(160)} `,
      });
      expect(parsed.certNumber).toBe('X'.repeat(80));
      expect(parsed.issuingBody).toBe('Y'.repeat(160));
    });

    it('BR-48g: rejects an unknown certType', () => {
      for (const bad of ['ORGANIC', 'PGS_INDIA', 'pgs', '', null]) {
        expect(fieldErrors({ ...base, certType: bad }).certType, String(bad)).toBeDefined();
      }
    });

    it('BR-48i: certType OTHER requires customTypeName — omitted or null is rejected on customTypeName', () => {
      expect(fieldErrors({ ...base, certType: 'OTHER' }).customTypeName).toBeDefined();
      expect(fieldErrors({ ...base, certType: 'OTHER', customTypeName: null }).customTypeName).toBeDefined();
      expect(certificationCreateSchema.safeParse({ ...base, certType: 'OTHER', customTypeName: 'Jaivik Bharat' }).success).toBe(true);
    });

    it('BR-48i: PGS or NPOP with a non-null customTypeName is rejected on customTypeName; null or omitted is accepted', () => {
      for (const certType of ['PGS', 'NPOP']) {
        expect(fieldErrors({ ...base, certType, customTypeName: 'Jaivik Bharat' }).customTypeName, certType).toBeDefined();
        expect(fieldErrors({ ...base, certType, customTypeName: '' }).customTypeName, certType).toBeDefined();
        expect(certificationCreateSchema.safeParse({ ...base, certType, customTypeName: null }).success, certType).toBe(true);
        expect(certificationCreateSchema.safeParse({ ...base, certType }).success, certType).toBe(true);
      }
    });

    it('BR-48i: customTypeName is trimmed and must be 1-80 characters after trimming', () => {
      const other = { ...base, certType: 'OTHER' };
      expect(fieldErrors({ ...other, customTypeName: '' }).customTypeName).toBeDefined();
      expect(fieldErrors({ ...other, customTypeName: '   ' }).customTypeName).toBeDefined();
      expect(fieldErrors({ ...other, customTypeName: 'X'.repeat(81) }).customTypeName).toBeDefined();
      expect(fieldErrors({ ...other, customTypeName: 42 }).customTypeName).toBeDefined();

      const parsed = certificationCreateSchema.parse({ ...other, customTypeName: `  ${'X'.repeat(80)}  ` });
      expect(parsed.customTypeName).toBe('X'.repeat(80));
    });

    it('BR-48i: other fields are still reported alongside a customTypeName error', () => {
      const errors = fieldErrors({ ...base, certType: 'OTHER', certNumber: '   ' });
      expect(errors.customTypeName).toBeDefined();
      expect(errors.certNumber).toBeDefined();
    });
  });

  describe('BR-49: PATCH request schema (certificationUpdateSchema)', () => {
    function fieldErrors(body: unknown): Record<string, string[] | undefined> & { root?: string[] } {
      const parsed = certificationUpdateSchema.safeParse(body);
      if (parsed.success) return {};
      const flat = parsed.error.flatten();
      return { ...(flat.fieldErrors as Record<string, string[] | undefined>), root: flat.formErrors };
    }

    it('BR-49f: an empty body is rejected (at least one field is required)', () => {
      expect(certificationUpdateSchema.safeParse({}).success).toBe(false);
      expect(fieldErrors({}).root?.length).toBeGreaterThan(0);
    });

    it('BR-49f: farmerId, verificationStatus and other unknown keys are stripped, never applied — a body of only those is empty', () => {
      expect(
        certificationUpdateSchema.safeParse({ farmerId: OTHER_FARMER_ID, verificationStatus: 'VERIFIED' }).success,
      ).toBe(false);
      const parsed = certificationUpdateSchema.parse({ certNumber: ' NEW-1 ', farmerId: OTHER_FARMER_ID, verificationStatus: 'VERIFIED' });
      expect(parsed).toEqual({ certNumber: 'NEW-1' });
    });

    it('BR-49f: each field is validated like POST when present; customTypeName alone may be null (to clear it)', () => {
      expect(fieldErrors({ certNumber: '   ' }).certNumber).toBeDefined();
      expect(fieldErrors({ issuingBody: 'X'.repeat(161) }).issuingBody).toBeDefined();
      expect(fieldErrors({ certType: 'ORGANIC' }).certType).toBeDefined();
      expect(fieldErrors({ issuedOn: '2026-02-30' }).issuedOn).toBeDefined();
      expect(fieldErrors({ expiresOn: '2027-03-31T00:00:00Z' }).expiresOn).toBeDefined();
      expect(fieldErrors({ documentUrl: 'not a url' }).documentUrl).toBeDefined();
      expect(fieldErrors({ customTypeName: 'X'.repeat(81) }).customTypeName).toBeDefined();
      for (const field of ['certType', 'certNumber', 'issuingBody', 'issuedOn', 'expiresOn', 'documentUrl']) {
        expect(fieldErrors({ [field]: null })[field], field).toBeDefined();
      }
      expect(certificationUpdateSchema.parse({ customTypeName: null })).toEqual({ customTypeName: null });
      expect(certificationUpdateSchema.parse({ customTypeName: ' Jaivik ' })).toEqual({ customTypeName: 'Jaivik' });
    });
  });

  describe('BR-49: editing a certificate resets its verification (PATCH /farmers/me/certifications/{id})', () => {
    const farmerActor = () =>
      anActor({ userId: IDS.userFarmer, roles: [{ code: RoleCode.FARMER }], farmerId: IDS.farmer });

    // A VERIFIED, unexpired PGS certificate, inside both BR-48 windows.
    const verifiedPgs: Partial<CertificationRow> = {
      cert_type: 'PGS',
      cert_number: 'PGS-TN-2026-00871',
      issuing_body: 'PGS Organic India Council',
      issued_on: '2026-01-10',
      expires_on: '2027-01-09',
      document_url: 'https://cdn.tohfa.in/docs/pgs-2026.pdf',
      verification_status: 'VERIFIED',
      verified_by: IDS.userSuperAdmin,
      verified_at: new Date('2026-02-01T05:00:00Z'),
      verification_notes: 'Checked PGS India portal',
      portal_checked_url: 'https://pgsindia-ncof.gov.in/check/00871',
    };

    type Cert = {
      id: string;
      certType: string;
      customTypeName: string | null;
      certNumber: string;
      issuingBody: string;
      issuedOn: string;
      expiresOn: string;
      documentUrl: string | null;
      verificationStatus: string;
      verifiedAt: string | null;
      verifiedBy: string | null;
      verificationNotes: string | null;
      portalCheckedUrl: string | null;
    };

    async function rejection(promise: Promise<unknown>): Promise<Record<string, unknown>> {
      try {
        await promise;
      } catch (error) {
        return error as Record<string, unknown>;
      }
      throw new Error('expected the call to be rejected');
    }

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-10-05T06:30:00Z'));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('BR-49a: editing the certNumber of a VERIFIED certificate makes it UNVERIFIED, clears verifiedBy/verifiedAt/verificationNotes/portalCheckedUrl, and recomputes the market block in the same transaction', async () => {
      const h = editHarness(verifiedPgs);

      const updated = (await h.service.updateMyCertification(farmerActor(), CERT_ID, {
        certNumber: 'PGS-TN-2026-00872',
      })) as Cert;

      expect(updated).toMatchObject({
        id: CERT_ID,
        certNumber: 'PGS-TN-2026-00872',
        verificationStatus: 'UNVERIFIED',
        verifiedAt: null,
        verifiedBy: null,
        verificationNotes: null,
        portalCheckedUrl: null,
      });
      expect(h.calls.update).toBe(1);
      expect(h.calls.recompute).toBe(1);
      // The farmer's only qualifying certificate is now pending again: blocked.
      const status = await h.repo.recomputeFarmerMarketBlock(null as unknown as Executor, IDS.farmer);
      expect(status.isMarketBlocked).toBe(true);
    });

    it('BR-49a: editing a REJECTED certificate makes it UNVERIFIED and clears the rejection reason and verifier', async () => {
      const h = editHarness({
        ...verifiedPgs,
        verification_status: 'REJECTED',
        verification_notes: 'Number does not match the portal record',
        portal_checked_url: null,
      });

      const updated = (await h.service.updateMyCertification(farmerActor(), CERT_ID, {
        certNumber: 'PGS-TN-2026-00873',
      })) as Cert;

      expect(updated.verificationStatus).toBe('UNVERIFIED');
      expect(updated.verifiedBy).toBeNull();
      expect(updated.verifiedAt).toBeNull();
      expect(updated.verificationNotes).toBeNull();
    });

    it('BR-49a: editing an UNVERIFIED certificate applies the change and leaves it UNVERIFIED', async () => {
      const h = editHarness({
        ...verifiedPgs,
        verification_status: 'UNVERIFIED',
        verified_by: null,
        verified_at: null,
        verification_notes: null,
        portal_checked_url: null,
      });

      const updated = (await h.service.updateMyCertification(farmerActor(), CERT_ID, {
        issuingBody: '  PGS Regional Council, Ooty  ',
      })) as Cert;

      expect(updated.issuingBody).toBe('PGS Regional Council, Ooty');
      expect(updated.verificationStatus).toBe('UNVERIFIED');
      expect(h.calls.update).toBe(1);
      expect(h.calls.recompute).toBe(1);
    });

    it('BR-49a: a change to any one editable field (certType+customTypeName, customTypeName, certNumber, issuingBody, issuedOn, expiresOn, documentUrl) resets verification', async () => {
      const cases: Array<[string, Partial<CertificationRow>, Record<string, unknown>]> = [
        ['certType', verifiedPgs, { certType: 'NPOP' }],
        ['certType to OTHER', verifiedPgs, { certType: 'OTHER', customTypeName: 'Jaivik Bharat' }],
        ['customTypeName', { ...verifiedPgs, cert_type: 'OTHER', custom_type_name: 'Jaivik Bharat' }, { customTypeName: 'USDA Organic' }],
        ['certNumber', verifiedPgs, { certNumber: 'PGS-TN-2026-99999' }],
        ['issuingBody', verifiedPgs, { issuingBody: 'Another Council' }],
        ['issuedOn', verifiedPgs, { issuedOn: '2026-01-11' }],
        ['expiresOn', verifiedPgs, { expiresOn: '2027-01-10' }],
        ['documentUrl', verifiedPgs, { documentUrl: 'https://cdn.tohfa.in/docs/pgs-2026-renewed.pdf' }],
      ];
      for (const [label, initial, patch] of cases) {
        const h = editHarness(initial);
        const updated = (await h.service.updateMyCertification(farmerActor(), CERT_ID, patch)) as Cert;
        expect(updated.verificationStatus, label).toBe('UNVERIFIED');
        expect(updated.verifiedBy, label).toBeNull();
        expect(h.calls.update, label).toBe(1);
        expect(h.calls.recompute, label).toBe(1);
      }
    });

    it('BR-49b: a PATCH whose values all equal the stored ones is a no-op — 200 with the certificate still VERIFIED, nothing written, no recompute, no audit row', async () => {
      const h = editHarness(verifiedPgs);

      const same = (await h.service.updateMyCertification(farmerActor(), CERT_ID, {
        certType: 'PGS',
        customTypeName: null,
        certNumber: '  PGS-TN-2026-00871 ',
        issuingBody: 'PGS Organic India Council',
        issuedOn: '2026-01-10',
        expiresOn: '2027-01-09',
        documentUrl: 'https://cdn.tohfa.in/docs/pgs-2026.pdf',
      })) as Cert;

      expect(same.verificationStatus).toBe('VERIFIED');
      expect(same.verifiedBy).toBe(IDS.userSuperAdmin);
      expect(same.verificationNotes).toBe('Checked PGS India portal');
      expect(h.calls.update).toBe(0);
      expect(h.calls.recompute).toBe(0);
      expect(h.audits).toHaveLength(0);
    });

    it('BR-49c: the merged result is validated like POST — a new expiresOn on or before the stored issuedOn is 422 on body.expiresOn, nothing written', async () => {
      const h = editHarness(verifiedPgs);
      const error = await rejection(
        h.service.updateMyCertification(farmerActor(), CERT_ID, { expiresOn: '2026-01-10' }),
      );
      expect(error).toMatchObject({
        code: 'VALIDATION_FAILED',
        status: 422,
        errors: { 'body.expiresOn': [expect.any(String)] },
      });
      expect(h.calls.update).toBe(0);
      expect(h.calls.recompute).toBe(0);
    });

    it('BR-49c: the merged result must respect both BR-48 windows and the issuedOn-not-in-future rule', async () => {
      const cases: Array<[Record<string, unknown>, string]> = [
        [{ expiresOn: '2028-10-05' }, 'body.expiresOn'], // 731 days ahead
        [{ issuedOn: '2024-01-01', expiresOn: '2025-10-04' }, 'body.expiresOn'], // 366 days ago
        [{ issuedOn: '2026-10-06' }, 'body.issuedOn'], // tomorrow
      ];
      for (const [patch, key] of cases) {
        const h = editHarness(verifiedPgs);
        const error = await rejection(h.service.updateMyCertification(farmerActor(), CERT_ID, patch));
        expect(error, JSON.stringify(patch)).toMatchObject({ code: 'VALIDATION_FAILED', errors: { [key]: [expect.any(String)] } });
        expect(h.calls.update).toBe(0);
      }
      // The boundary itself is accepted: exactly 730 days ahead.
      const ok = editHarness(verifiedPgs);
      const updated = (await ok.service.updateMyCertification(farmerActor(), CERT_ID, { expiresOn: '2028-10-04' })) as Cert;
      expect(updated.expiresOn).toBe('2028-10-04');
    });

    it('BR-49c: changing certType from OTHER to PGS without clearing customTypeName is 422 on body.customTypeName; with customTypeName null it succeeds', async () => {
      const other = { ...verifiedPgs, cert_type: 'OTHER' as const, custom_type_name: 'Jaivik Bharat' };

      const h = editHarness(other);
      const error = await rejection(h.service.updateMyCertification(farmerActor(), CERT_ID, { certType: 'PGS' }));
      expect(error).toMatchObject({ code: 'VALIDATION_FAILED', errors: { 'body.customTypeName': [expect.any(String)] } });
      expect(h.calls.update).toBe(0);

      const ok = editHarness(other);
      const updated = (await ok.service.updateMyCertification(farmerActor(), CERT_ID, {
        certType: 'PGS',
        customTypeName: null,
      })) as Cert;
      expect(updated).toMatchObject({ certType: 'PGS', customTypeName: null, verificationStatus: 'UNVERIFIED' });
    });

    it('BR-49c: changing certType to OTHER without a customTypeName is 422 on body.customTypeName; clearing the name of an OTHER certificate is too', async () => {
      const h = editHarness(verifiedPgs);
      const error = await rejection(h.service.updateMyCertification(farmerActor(), CERT_ID, { certType: 'OTHER' }));
      expect(error).toMatchObject({ code: 'VALIDATION_FAILED', errors: { 'body.customTypeName': [expect.any(String)] } });

      const other = editHarness({ ...verifiedPgs, cert_type: 'OTHER', custom_type_name: 'Jaivik Bharat' });
      const cleared = await rejection(other.service.updateMyCertification(farmerActor(), CERT_ID, { customTypeName: null }));
      expect(cleared).toMatchObject({ code: 'VALIDATION_FAILED', errors: { 'body.customTypeName': [expect.any(String)] } });
      expect(other.calls.update).toBe(0);
    });

    it("BR-49d: another farmer's certificate is 404 NOT_FOUND (never 403), and nothing is written", async () => {
      const h = editHarness({ ...verifiedPgs, farmer_id: OTHER_FARMER_ID });
      const error = await rejection(
        h.service.updateMyCertification(farmerActor(), CERT_ID, { certNumber: 'HIJACK-1' }),
      );
      expect(error).toMatchObject({ code: 'NOT_FOUND', status: 404 });
      expect(h.calls.update).toBe(0);
      expect(h.calls.recompute).toBe(0);
    });

    it('BR-49d: an unknown id and a soft-deleted certificate are 404 NOT_FOUND', async () => {
      const h = editHarness(verifiedPgs);
      expect(
        await rejection(h.service.updateMyCertification(farmerActor(), newId(), { certNumber: 'X-1' })),
      ).toMatchObject({ code: 'NOT_FOUND' });

      await h.service.deleteMyCertification(farmerActor(), CERT_ID);
      expect(
        await rejection(h.service.updateMyCertification(farmerActor(), CERT_ID, { certNumber: 'X-1' })),
      ).toMatchObject({ code: 'NOT_FOUND' });
      expect(h.calls.update).toBe(0);
    });

    it('BR-49e: an edit writes one certification.update audit row recording the verification state before and after', async () => {
      const h = editHarness(verifiedPgs);
      await h.service.updateMyCertification(farmerActor(), CERT_ID, { certNumber: 'PGS-TN-2026-00872' });

      expect(auditActionCodes(h.audits)).toEqual(['certification.update']);
      const [params] = h.audits;
      expect(params?.[5]).toBe(CERT_ID);
      expect(JSON.parse(String(params?.[8]))).toMatchObject({ certNumber: 'PGS-TN-2026-00871', verificationStatus: 'VERIFIED' });
      expect(JSON.parse(String(params?.[9]))).toMatchObject({ certNumber: 'PGS-TN-2026-00872', verificationStatus: 'UNVERIFIED' });
      expect(params?.[10]).toEqual(expect.arrayContaining(['certNumber', 'verificationStatus']));
    });
  });

  describe('BR-48j: a certificate number already on record is a field error, never a 500', () => {
    const farmerActor = () =>
      anActor({ userId: IDS.userFarmer, roles: [{ code: RoleCode.FARMER }], farmerId: IDS.farmer });
    const TAKEN = 'PGS-TN-2026-00871';

    /** What pg throws when uq_certifications_number refuses a row (DatabaseError's fields). */
    function uniqueViolation(constraint = 'uq_certifications_number'): Error {
      return Object.assign(new Error(`duplicate key value violates unique constraint "${constraint}"`), {
        code: '23505',
        constraint,
        table: 'certifications',
        schema: 'public',
        detail: `Key (cert_type, cert_number)=(PGS, ${TAKEN}) already exists.`,
      });
    }

    async function rejection(promise: Promise<unknown>): Promise<Record<string, unknown>> {
      try {
        await promise;
      } catch (error) {
        return error as Record<string, unknown>;
      }
      throw new Error('expected the call to be rejected');
    }

    /** Everything about an error that reaches the client (the problem body) or a log line. */
    function visible(error: Record<string, unknown>) {
      return {
        code: error['code'],
        status: error['status'],
        message: error['message'],
        detail: error['detail'],
        errors: error['errors'],
        meta: error['meta'],
      };
    }

    const create: CertificationCreate = {
      certType: 'PGS',
      certNumber: TAKEN,
      issuingBody: 'PGS Organic India Council',
      issuedOn: '2026-01-10',
      expiresOn: '2027-01-09',
    };

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-10-05T06:30:00Z'));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('BR-48j: POST — a unique violation on uq_certifications_number is 422 VALIDATION_FAILED on body.certNumber alone, with the generic message, and no recompute follows', async () => {
      const h = editHarness();
      h.repo.createCertification = async () => {
        throw uniqueViolation();
      };

      const error = await rejection(h.service.createCertification(farmerActor(), create));

      expect(error).toMatchObject({
        code: 'VALIDATION_FAILED',
        status: 422,
        errors: { 'body.certNumber': [CERT_NUMBER_UNAVAILABLE] },
      });
      expect(Object.keys(error['errors'] as object)).toEqual(['body.certNumber']);
      expect(h.calls.recompute).toBe(0);
    });

    it('BR-48j: PATCH — the same violation while writing the edit is the same 422, and no recompute or audit row follows', async () => {
      const h = editHarness({
        cert_type: 'PGS',
        cert_number: 'PGS-TN-2026-00999',
        issuing_body: 'PGS Organic India Council',
        issued_on: '2026-01-10',
        expires_on: '2027-01-09',
        verification_status: 'VERIFIED',
        verified_by: IDS.userSuperAdmin,
        verified_at: new Date('2026-02-01T05:00:00Z'),
      });
      h.repo.updateCertificationResetVerification = async () => {
        h.calls.update += 1;
        throw uniqueViolation();
      };

      const error = await rejection(h.service.updateMyCertification(farmerActor(), CERT_ID, { certNumber: TAKEN }));

      expect(error).toMatchObject({
        code: 'VALIDATION_FAILED',
        status: 422,
        errors: { 'body.certNumber': [CERT_NUMBER_UNAVAILABLE] },
      });
      expect(Object.keys(error['errors'] as object)).toEqual(['body.certNumber']);
      expect(h.calls.update).toBe(1);
      expect(h.calls.recompute).toBe(0);
      expect(h.audits).toHaveLength(0);
    });

    it('BR-48j: nothing the client or a log sees names the number, a farmer, the index or what the database said', async () => {
      const h = editHarness();
      h.repo.createCertification = async () => {
        throw uniqueViolation();
      };
      const error = await rejection(h.service.createCertification(farmerActor(), create));

      const text = JSON.stringify(visible(error));
      for (const secret of [
        TAKEN,
        IDS.farmer,
        IDS.userFarmer,
        OTHER_FARMER_ID,
        'uq_certifications_number',
        'already exists',
        'duplicate key',
        '23505',
      ]) {
        expect(text, secret).not.toContain(secret);
      }
      expect(text).not.toMatch(/farmer/i);
      expect(error['meta']).toBeUndefined();
      // The pg error is not carried along as the cause, where an error logger
      // or serializer could pick its detail (which holds the number) back up.
      expect((error as { cause?: unknown }).cause).toBeUndefined();
    });

    it('BR-48j: any other database error — another index\'s unique violation, or another error code — passes through untouched, not disguised as a certNumber error', async () => {
      const otherIndex = uniqueViolation('uq_some_other_index');
      const checkViolation = Object.assign(new Error('violates check constraint'), {
        code: '23514',
        constraint: 'uq_certifications_number',
      });

      for (const thrown of [otherIndex, checkViolation]) {
        const post = editHarness();
        post.repo.createCertification = async () => {
          throw thrown;
        };
        expect(await rejection(post.service.createCertification(farmerActor(), create))).toBe(thrown);

        const patch = editHarness({ cert_number: 'PGS-TN-2026-00999', verification_status: 'UNVERIFIED' });
        patch.repo.updateCertificationResetVerification = async () => {
          throw thrown;
        };
        expect(await rejection(patch.service.updateMyCertification(farmerActor(), CERT_ID, { certNumber: TAKEN }))).toBe(
          thrown,
        );
      }
    });
  });

  describe('BR-50: deleting a certificate is a soft delete (DELETE /farmers/me/certifications/{id})', () => {
    const farmerActor = () =>
      anActor({ userId: IDS.userFarmer, roles: [{ code: RoleCode.FARMER }], farmerId: IDS.farmer });
    const verified: Partial<CertificationRow> = {
      cert_type: 'NPOP',
      expires_on: '2099-12-31',
      verification_status: 'VERIFIED',
      verified_by: IDS.userSuperAdmin,
      verified_at: new Date(),
    };

    it("BR-50a: DELETE soft-deletes the farmer's own certificate, recomputes the market block in the same transaction and writes a certification.delete audit row", async () => {
      const h = editHarness(verified);
      // Lifted before: the farmer's only certificate is verified and unexpired.
      expect((await h.repo.recomputeFarmerMarketBlock(null as unknown as Executor, IDS.farmer)).isMarketBlocked).toBe(false);
      h.calls.recompute = 0;

      await expect(h.service.deleteMyCertification(farmerActor(), CERT_ID)).resolves.toBeUndefined();

      expect(h.calls.softDelete).toBe(1);
      expect(h.calls.recompute).toBe(1);
      expect(auditActionCodes(h.audits)).toEqual(['certification.delete']);
      expect(h.audits[0]?.[5]).toBe(CERT_ID);
      // Gone from the farmer list and the admin reads; the farmer is blocked again.
      const list = (await h.service.listMyCertifications(farmerActor(), { limit: 10 })) as { items: unknown[] };
      expect(list.items).toHaveLength(0);
      const adminList = (await h.service.adminListCertifications(anActor(), { limit: 10 })) as { items: unknown[] };
      expect(adminList.items).toHaveLength(0);
      await expect(h.service.adminGetCertification(anActor(), CERT_ID)).rejects.toMatchObject({ code: 'NOT_FOUND' });
      expect((await h.repo.recomputeFarmerMarketBlock(null as unknown as Executor, IDS.farmer)).isMarketBlocked).toBe(true);
    });

    it("BR-50b: another farmer's certificate, an unknown id and an already-deleted certificate are 404 NOT_FOUND, with no recompute", async () => {
      const foreign = editHarness({ ...verified, farmer_id: OTHER_FARMER_ID });
      await expect(foreign.service.deleteMyCertification(farmerActor(), CERT_ID)).rejects.toMatchObject({
        code: 'NOT_FOUND',
        status: 404,
      });
      expect(foreign.calls.recompute).toBe(0);

      const h = editHarness(verified);
      await expect(h.service.deleteMyCertification(farmerActor(), newId())).rejects.toMatchObject({ code: 'NOT_FOUND' });
      await h.service.deleteMyCertification(farmerActor(), CERT_ID);
      await expect(h.service.deleteMyCertification(farmerActor(), CERT_ID)).rejects.toMatchObject({ code: 'NOT_FOUND' });
      expect(h.calls.recompute).toBe(1);
    });

    it('BR-50d: an admin cannot verify or unverify a deleted certificate (404 NOT_FOUND)', async () => {
      const h = editHarness({ ...verified, verification_status: 'UNVERIFIED', verified_by: null, verified_at: null });
      await h.service.deleteMyCertification(farmerActor(), CERT_ID);

      await expect(h.service.verifyCertification(anActor(), CERT_ID, {})).rejects.toMatchObject({ code: 'NOT_FOUND' });
      await expect(
        h.service.unverifyCertification(anActor(), CERT_ID, { reason: 'Revoked by the issuing body' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('BR-35c: recording, verifying and unverifying a certificate are audited in the same transaction', () => {
    const farmerActor = () =>
      anActor({ userId: IDS.userFarmer, roles: [{ code: RoleCode.FARMER }], farmerId: IDS.farmer });
    const adminActor = () => anActor({ userId: IDS.userTohfaAdmin, roles: [{ code: RoleCode.TOHFA_ADMIN }] });

    const pending: Partial<CertificationRow> = {
      cert_type: 'PGS',
      cert_number: 'PGS-TN-2026-00871',
      issuing_body: 'PGS Organic India Council',
      issued_on: '2026-01-10',
      expires_on: '2027-01-09',
      document_url: 'https://cdn.tohfa.in/docs/pgs-2026.pdf',
      verification_status: 'UNVERIFIED',
    };
    const verified: Partial<CertificationRow> = {
      ...pending,
      verification_status: 'VERIFIED',
      verified_by: IDS.userSuperAdmin,
      verified_at: new Date('2026-02-01T05:00:00Z'),
      verification_notes: 'Checked PGS India portal',
      portal_checked_url: 'https://pgsindia-ncof.gov.in/check/00871',
    };

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-10-05T06:30:00Z'));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('BR-35c: a farmer recording a certificate writes one certification.create audit row — the farmer as actor, the new certificate as entity, an after image and no before image', async () => {
      const h = editHarness();
      const created = (await h.service.createCertification(farmerActor(), {
        certType: 'PGS',
        certNumber: 'PGS-TN-2026-00871',
        issuingBody: 'PGS Organic India Council',
        issuedOn: '2026-01-10',
        expiresOn: '2027-01-09',
        documentUrl: 'https://cdn.tohfa.in/docs/pgs-2026.pdf',
      })) as { id: string };

      expect(auditActionCodes(h.audits)).toEqual(['certification.create']);
      const row = auditRow(h.audits[0]);
      expect(row).toMatchObject({
        actorId: IDS.userFarmer,
        actorType: 'USER',
        actorRole: 'FARMER',
        entityType: 'certification',
        entityId: created.id,
        before: null,
      });
      // The certification.update image, nothing more (no farmer id, no secrets).
      expect(Object.keys(row.after ?? {}).sort()).toEqual(CERT_AUDIT_IMAGE_KEYS);
      expect(row.after).toEqual({
        certType: 'PGS',
        customTypeName: null,
        certNumber: 'PGS-TN-2026-00871',
        issuingBody: 'PGS Organic India Council',
        issuedOn: '2026-01-10',
        expiresOn: '2027-01-09',
        documentUrl: 'https://cdn.tohfa.in/docs/pgs-2026.pdf',
        verificationStatus: 'UNVERIFIED',
        verifiedBy: null,
        verifiedAt: null,
        verificationNotes: null,
        portalCheckedUrl: null,
      });
    });

    it('BR-35c: an admin verify writes one certification.verify audit row — the admin as actor, UNVERIFIED before, VERIFIED after with the note and portal reference', async () => {
      const h = editHarness(pending);
      await h.service.verifyCertification(adminActor(), CERT_ID, {
        portalReference: 'https://pgsindia-ncof.gov.in/check/00871',
        note: 'Checked PGS India portal',
      });

      expect(auditActionCodes(h.audits)).toEqual(['certification.verify']);
      const row = auditRow(h.audits[0]);
      expect(row).toMatchObject({
        actorId: IDS.userTohfaAdmin,
        actorRole: 'TOHFA_ADMIN',
        entityType: 'certification',
        entityId: CERT_ID,
      });
      expect(Object.keys(row.before ?? {}).sort()).toEqual(CERT_AUDIT_IMAGE_KEYS);
      expect(Object.keys(row.after ?? {}).sort()).toEqual(CERT_AUDIT_IMAGE_KEYS);
      expect(row.before).toMatchObject({ verificationStatus: 'UNVERIFIED', verifiedBy: null, verificationNotes: null, portalCheckedUrl: null });
      expect(row.after).toMatchObject({
        verificationStatus: 'VERIFIED',
        verifiedBy: IDS.userTohfaAdmin,
        verificationNotes: 'Checked PGS India portal',
        portalCheckedUrl: 'https://pgsindia-ncof.gov.in/check/00871',
      });
      expect(row.changedFields).toEqual(
        expect.arrayContaining(['verificationStatus', 'verifiedBy', 'verifiedAt', 'verificationNotes', 'portalCheckedUrl']),
      );
      expect(h.calls.recompute).toBe(1);
    });

    it('BR-35c: an admin unverify writes one certification.unverify audit row — the admin as actor, VERIFIED before, REJECTED after with the reason', async () => {
      const h = editHarness(verified);
      await h.service.unverifyCertification(adminActor(), CERT_ID, {
        reason: 'Number does not match the portal record',
      });

      expect(auditActionCodes(h.audits)).toEqual(['certification.unverify']);
      const row = auditRow(h.audits[0]);
      expect(row).toMatchObject({ actorId: IDS.userTohfaAdmin, actorRole: 'TOHFA_ADMIN', entityType: 'certification', entityId: CERT_ID });
      expect(row.before).toMatchObject({
        verificationStatus: 'VERIFIED',
        verifiedBy: IDS.userSuperAdmin,
        verificationNotes: 'Checked PGS India portal',
      });
      expect(row.after).toMatchObject({
        verificationStatus: 'REJECTED',
        verifiedBy: IDS.userTohfaAdmin,
        verificationNotes: 'Number does not match the portal record',
      });
      expect(row.changedFields).toEqual(expect.arrayContaining(['verificationStatus', 'verifiedBy', 'verificationNotes']));
    });

    it('BR-35c: a write that is refused leaves no audit row — a create refused by BR-48 or by a number on record, a verify or unverify of an unknown or deleted certificate', async () => {
      const refusedCreate = editHarness();
      await expect(
        refusedCreate.service.createCertification(farmerActor(), {
          certType: 'PGS',
          certNumber: 'PGS-TN-2026-00871',
          issuingBody: 'PGS Organic India Council',
          issuedOn: '2026-01-10',
          expiresOn: '2099-12-31',
        }),
      ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
      expect(refusedCreate.audits).toHaveLength(0);

      const duplicate = editHarness();
      duplicate.repo.createCertification = async () => {
        throw Object.assign(new Error('duplicate key'), { code: '23505', constraint: 'uq_certifications_number' });
      };
      await expect(
        duplicate.service.createCertification(farmerActor(), {
          certType: 'PGS',
          certNumber: 'PGS-TN-2026-00871',
          issuingBody: 'PGS Organic India Council',
          issuedOn: '2026-01-10',
          expiresOn: '2027-01-09',
        }),
      ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
      expect(duplicate.audits).toHaveLength(0);

      const h = editHarness(pending);
      await expect(h.service.verifyCertification(adminActor(), newId(), {})).rejects.toMatchObject({ code: 'NOT_FOUND' });
      await expect(
        h.service.unverifyCertification(adminActor(), newId(), { reason: 'Revoked by the issuing body' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
      await h.service.deleteMyCertification(farmerActor(), CERT_ID);
      const afterDelete = h.audits.length;
      await expect(h.service.verifyCertification(adminActor(), CERT_ID, {})).rejects.toMatchObject({ code: 'NOT_FOUND' });
      expect(h.audits).toHaveLength(afterDelete);
      expect(auditActionCodes(h.audits)).toEqual(['certification.delete']);
    });
  });

  describe("BR-51: TOHFA staff edit or remove any farmer's certificate (PATCH / DELETE /admin/certifications/{id})", () => {
    const adminActor = () => anActor({ userId: IDS.userTohfaAdmin, roles: [{ code: RoleCode.TOHFA_ADMIN }] });
    const farmerActor = () =>
      anActor({ userId: IDS.userFarmer, roles: [{ code: RoleCode.FARMER }], farmerId: IDS.farmer });

    // Another farmer's VERIFIED, unexpired PGS certificate — never the admin's
    // (an admin has no farmer id), so whose block is recomputed is visible.
    const ownersVerifiedPgs: Partial<CertificationRow> = {
      farmer_id: OTHER_FARMER_ID,
      cert_type: 'PGS',
      cert_number: 'PGS-TN-2026-00871',
      issuing_body: 'PGS Organic India Council',
      issued_on: '2026-01-10',
      expires_on: '2027-01-09',
      document_url: 'https://cdn.tohfa.in/docs/pgs-2026.pdf',
      verification_status: 'VERIFIED',
      verified_by: IDS.userSuperAdmin,
      verified_at: new Date('2026-02-01T05:00:00Z'),
      verification_notes: 'Checked PGS India portal',
      portal_checked_url: 'https://pgsindia-ncof.gov.in/check/00871',
    };

    async function rejection(promise: Promise<unknown>): Promise<Record<string, unknown>> {
      try {
        await promise;
      } catch (error) {
        return error as Record<string, unknown>;
      }
      throw new Error('expected the call to be rejected');
    }

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-10-05T06:30:00Z'));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("BR-51a: an admin edit of any farmer's VERIFIED certificate makes it UNVERIFIED, clears every verifier field and recomputes the OWNER's market block, in the same transaction", async () => {
      const h = editHarness(ownersVerifiedPgs);

      const updated = (await h.service.adminUpdateCertification(adminActor(), CERT_ID, {
        certNumber: 'PGS-TN-2026-00872',
      })) as Record<string, unknown>;

      expect(updated).toMatchObject({
        id: CERT_ID,
        farmerId: OTHER_FARMER_ID,
        certNumber: 'PGS-TN-2026-00872',
        verificationStatus: 'UNVERIFIED',
        verifiedAt: null,
        verifiedBy: null,
        verificationNotes: null,
        portalCheckedUrl: null,
      });
      expect(h.calls.update).toBe(1);
      expect(h.calls.recompute).toBe(1);
      // The owner's certificate and the owner's block; the admin is the actor.
      expect(h.args.update[0]?.[1]).toBe(CERT_ID);
      expect(h.args.update[0]?.[2]).toBe(OTHER_FARMER_ID);
      expect(h.args.recompute[0]?.slice(1, 4)).toEqual([OTHER_FARMER_ID, IDS.userTohfaAdmin, 'TOHFA_ADMIN']);
    });

    it('BR-51a: the owner comes from the stored certificate, never the request — a farmerId in the patch is ignored', async () => {
      const h = editHarness(ownersVerifiedPgs);
      await h.service.adminUpdateCertification(adminActor(), CERT_ID, {
        certNumber: 'PGS-TN-2026-00872',
        farmerId: IDS.farmer,
      } as CertificationUpdate);

      expect(h.args.update[0]?.[2]).toBe(OTHER_FARMER_ID);
      expect(h.args.recompute[0]?.[1]).toBe(OTHER_FARMER_ID);
    });

    it("BR-51a: the merged result is validated exactly like a farmer's edit (BR-48, BR-49c) — both expiry windows, issuedOn in the future, date order and the customTypeName coupling are 422 keyed body.<field>, nothing written", async () => {
      const cases: Array<[Partial<CertificationRow>, Record<string, unknown>, string]> = [
        [ownersVerifiedPgs, { expiresOn: '2028-10-05' }, 'body.expiresOn'], // 731 days ahead
        [ownersVerifiedPgs, { issuedOn: '2024-01-01', expiresOn: '2025-10-04' }, 'body.expiresOn'], // 366 days ago
        [ownersVerifiedPgs, { issuedOn: '2026-10-06' }, 'body.issuedOn'], // tomorrow
        [ownersVerifiedPgs, { expiresOn: '2026-01-10' }, 'body.expiresOn'], // not after issuedOn
        [ownersVerifiedPgs, { certType: 'OTHER' }, 'body.customTypeName'], // OTHER needs a name
        [{ ...ownersVerifiedPgs, cert_type: 'OTHER', custom_type_name: 'Jaivik Bharat' }, { certType: 'PGS' }, 'body.customTypeName'],
      ];
      for (const [initial, patch, key] of cases) {
        const h = editHarness(initial);
        const error = await rejection(h.service.adminUpdateCertification(adminActor(), CERT_ID, patch));
        expect(error, JSON.stringify(patch)).toMatchObject({
          code: 'VALIDATION_FAILED',
          status: 422,
          errors: { [key]: [expect.any(String)] },
        });
        expect(h.calls.update, JSON.stringify(patch)).toBe(0);
        expect(h.calls.recompute, JSON.stringify(patch)).toBe(0);
        expect(h.audits, JSON.stringify(patch)).toHaveLength(0);
      }
      // The boundary itself is accepted: exactly 730 days ahead.
      const ok = editHarness(ownersVerifiedPgs);
      const updated = (await ok.service.adminUpdateCertification(adminActor(), CERT_ID, { expiresOn: '2028-10-04' })) as {
        expiresOn: string;
      };
      expect(updated.expiresOn).toBe('2028-10-04');
    });

    it('BR-51a: moving the certificate onto a number already on record is 422 on body.certNumber with the generic message — no recompute, no audit row', async () => {
      const h = editHarness(ownersVerifiedPgs);
      h.repo.updateCertificationResetVerification = async () => {
        h.calls.update += 1;
        throw Object.assign(new Error('duplicate key value violates unique constraint "uq_certifications_number"'), {
          code: '23505',
          constraint: 'uq_certifications_number',
        });
      };

      const error = await rejection(
        h.service.adminUpdateCertification(adminActor(), CERT_ID, { certNumber: 'PGS-TN-2026-00999' }),
      );
      expect(error).toMatchObject({
        code: 'VALIDATION_FAILED',
        status: 422,
        errors: { 'body.certNumber': [CERT_NUMBER_UNAVAILABLE] },
      });
      expect(Object.keys(error['errors'] as object)).toEqual(['body.certNumber']);
      expect(h.calls.recompute).toBe(0);
      expect(h.audits).toHaveLength(0);
    });

    it('BR-51b: an admin PATCH whose values all equal the stored ones is a no-op — still VERIFIED, nothing written, no recompute, no audit row', async () => {
      const h = editHarness(ownersVerifiedPgs);
      const same = (await h.service.adminUpdateCertification(adminActor(), CERT_ID, {
        certType: 'PGS',
        customTypeName: null,
        certNumber: ' PGS-TN-2026-00871 ',
        issuingBody: 'PGS Organic India Council',
        issuedOn: '2026-01-10',
        expiresOn: '2027-01-09',
        documentUrl: 'https://cdn.tohfa.in/docs/pgs-2026.pdf',
      })) as { verificationStatus: string; verifiedBy: string | null };

      expect(same.verificationStatus).toBe('VERIFIED');
      expect(same.verifiedBy).toBe(IDS.userSuperAdmin);
      expect(h.calls.update).toBe(0);
      expect(h.calls.recompute).toBe(0);
      expect(h.audits).toHaveLength(0);
    });

    it("BR-51c: an admin delete soft-deletes any farmer's certificate, recomputes the OWNER's market block in the same transaction, and the certificate leaves every list", async () => {
      const h = editHarness(ownersVerifiedPgs);

      await expect(h.service.adminDeleteCertification(adminActor(), CERT_ID)).resolves.toBeUndefined();

      expect(h.calls.softDelete).toBe(1);
      expect(h.args.softDelete[0]?.slice(1, 3)).toEqual([CERT_ID, OTHER_FARMER_ID]);
      expect(h.calls.recompute).toBe(1);
      expect(h.args.recompute[0]?.slice(1, 4)).toEqual([OTHER_FARMER_ID, IDS.userTohfaAdmin, 'TOHFA_ADMIN']);
      const adminList = (await h.service.adminListCertifications(adminActor(), { limit: 10 })) as { items: unknown[] };
      expect(adminList.items).toHaveLength(0);
      await expect(h.service.adminGetCertification(adminActor(), CERT_ID)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('BR-51d: an unknown id and a soft-deleted certificate are 404 NOT_FOUND for admin PATCH and DELETE, and nothing is written', async () => {
      const h = editHarness(ownersVerifiedPgs);
      await expect(
        h.service.adminUpdateCertification(adminActor(), newId(), { certNumber: 'X-1' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
      await expect(h.service.adminDeleteCertification(adminActor(), newId())).rejects.toMatchObject({
        code: 'NOT_FOUND',
        status: 404,
      });
      expect(h.calls.update).toBe(0);
      expect(h.calls.softDelete).toBe(0);
      expect(h.calls.recompute).toBe(0);
      expect(h.audits).toHaveLength(0);

      await h.service.adminDeleteCertification(adminActor(), CERT_ID);
      const written = { softDelete: h.calls.softDelete, recompute: h.calls.recompute, audits: h.audits.length };
      await expect(
        h.service.adminUpdateCertification(adminActor(), CERT_ID, { certNumber: 'X-1' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
      await expect(h.service.adminDeleteCertification(adminActor(), CERT_ID)).rejects.toMatchObject({ code: 'NOT_FOUND' });
      expect({ softDelete: h.calls.softDelete, recompute: h.calls.recompute, audits: h.audits.length }).toEqual(written);
      expect(h.calls.update).toBe(0);
    });

    it("BR-51d: a farmer's own PATCH and DELETE still cannot reach another farmer's certificate — only the admin paths can", async () => {
      const h = editHarness(ownersVerifiedPgs);
      await expect(
        h.service.updateMyCertification(farmerActor(), CERT_ID, { certNumber: 'HIJACK-1' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
      await expect(h.service.deleteMyCertification(farmerActor(), CERT_ID)).rejects.toMatchObject({ code: 'NOT_FOUND' });
      // softDeleteOwn is itself the ownership filter (it matched nothing); no
      // edit, recompute or audit row followed, and the certificate is still live.
      expect(h.calls.update + h.calls.recompute).toBe(0);
      expect(h.audits).toHaveLength(0);
      await expect(h.service.adminGetCertification(adminActor(), CERT_ID)).resolves.toMatchObject({
        verificationStatus: 'VERIFIED',
      });
    });

    it('BR-51e: an admin edit writes one certification.admin_update row and an admin delete one certification.admin_delete row — the admin as actor, the certificate as entity, before/after images in the certification.update shape', async () => {
      const h = editHarness(ownersVerifiedPgs);
      await h.service.adminUpdateCertification(adminActor(), CERT_ID, { certNumber: 'PGS-TN-2026-00872' });
      await h.service.adminDeleteCertification(adminActor(), CERT_ID);

      expect(auditActionCodes(h.audits)).toEqual(['certification.admin_update', 'certification.admin_delete']);
      const edit = auditRow(h.audits[0]);
      expect(edit).toMatchObject({
        actorId: IDS.userTohfaAdmin,
        actorType: 'USER',
        actorRole: 'TOHFA_ADMIN',
        entityType: 'certification',
        entityId: CERT_ID,
      });
      expect(Object.keys(edit.before ?? {}).sort()).toEqual(CERT_AUDIT_IMAGE_KEYS);
      expect(Object.keys(edit.after ?? {}).sort()).toEqual(CERT_AUDIT_IMAGE_KEYS);
      expect(edit.before).toMatchObject({ certNumber: 'PGS-TN-2026-00871', verificationStatus: 'VERIFIED', verifiedBy: IDS.userSuperAdmin });
      expect(edit.after).toMatchObject({ certNumber: 'PGS-TN-2026-00872', verificationStatus: 'UNVERIFIED', verifiedBy: null });
      expect(edit.changedFields).toEqual(expect.arrayContaining(['certNumber', 'verificationStatus', 'verifiedBy']));

      const removal = auditRow(h.audits[1]);
      expect(removal).toMatchObject({
        actorId: IDS.userTohfaAdmin,
        actorRole: 'TOHFA_ADMIN',
        entityType: 'certification',
        entityId: CERT_ID,
        after: null,
      });
      expect(removal.before).toMatchObject({ certNumber: 'PGS-TN-2026-00872', verificationStatus: 'UNVERIFIED' });
    });
  });

  describe('Admin reads: GET /v1/admin/certifications, GET /v1/admin/certifications/:id', () => {
    it('adminListCertifications returns items with farmerId (admin-only context, BR-16) and page metadata', async () => {
      const repo = mockCertificationsRepo({
        id: '33333333-3333-3333-3333-333333333333',
        farmer_id: IDS.farmer,
        verification_status: 'VERIFIED',
      });
      const service = createCertificationsService(repo);
      const adminActor = anActor({ userId: IDS.userSuperAdmin });

      const result = (await service.adminListCertifications(adminActor, { limit: 20 })) as {
        items: Array<{ id: string; farmerId: string; verificationStatus: string }>;
        page: { nextCursor: string | null; hasMore: boolean };
      };

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.farmerId).toBe(IDS.farmer);
      expect(result.items[0]?.verificationStatus).toBe('VERIFIED');
      expect(result.page).toEqual({ nextCursor: null, hasMore: false });
    });

    it('adminListCertifications passes status and farmerId filters through to the repo', async () => {
      const repo = mockCertificationsRepo();
      let capturedParams: unknown;
      repo.listAllCertifications = async (_db, params) => {
        capturedParams = params;
        return { items: [], nextCursor: null, hasMore: false };
      };
      const service = createCertificationsService(repo);
      const adminActor = anActor({ userId: IDS.userSuperAdmin });

      await service.adminListCertifications(adminActor, {
        limit: 20,
        status: 'UNVERIFIED',
        farmerId: IDS.farmer,
      });

      expect(capturedParams).toEqual({
        limit: 20,
        cursor: undefined,
        status: 'UNVERIFIED',
        farmerId: IDS.farmer,
      });
    });

    it('adminGetCertification returns the mapped certification regardless of which farmer it belongs to', async () => {
      const repo = mockCertificationsRepo({
        id: '33333333-3333-3333-3333-333333333333',
        farmer_id: IDS.farmer,
        verification_status: 'UNVERIFIED',
      });
      const service = createCertificationsService(repo);
      const adminActor = anActor({ userId: IDS.userSuperAdmin });

      const result = (await service.adminGetCertification(
        adminActor,
        '33333333-3333-3333-3333-333333333333',
      )) as { id: string; farmerId: string };

      expect(result.id).toBe('33333333-3333-3333-3333-333333333333');
      expect(result.farmerId).toBe(IDS.farmer);
    });

    it('adminGetCertification throws NOT_FOUND for an unknown id', async () => {
      const repo = mockCertificationsRepo();
      const service = createCertificationsService(repo);
      const adminActor = anActor({ userId: IDS.userSuperAdmin });

      await expect(
        service.adminGetCertification(adminActor, '00000000-0000-0000-0000-000000000000'),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('GET /v1/config/farmer — farmer-facing global config', () => {
    it('BR-48h: returns certExpiryWarningDays, certExpiryMaxPastDays and certExpiryMaxFutureDays from the repo (mocked, no database)', async () => {
      const repo = mockCertificationsRepo();
      const service = createCertificationsService(repo);
      const actor = anActor({
        userId: IDS.userFarmer,
        roles: [{ code: RoleCode.FARMER }],
        farmerId: IDS.farmer,
      });

      const config = await service.getConfig(actor);

      expect(config).toEqual({ certExpiryWarningDays: 30, certExpiryMaxPastDays: 365, certExpiryMaxFutureDays: 730 });
    });

    it('BR-48h: passes through whatever the repo returns, without hard-coding a value in the service', async () => {
      const repo = mockCertificationsRepo();
      repo.getCertExpiryWarningDays = async () => 45;
      repo.getCertExpiryMaxPastDays = async () => 90;
      repo.getCertExpiryMaxFutureDays = async () => 700;
      const service = createCertificationsService(repo);
      const actor = anActor({
        userId: IDS.userFarmer,
        roles: [{ code: RoleCode.FARMER }],
        farmerId: IDS.farmer,
      });

      const config = await service.getConfig(actor);

      expect(config).toEqual({ certExpiryWarningDays: 45, certExpiryMaxPastDays: 90, certExpiryMaxFutureDays: 700 });
    });
  });

  describe('HTTP Route Validation', () => {
    const app = createApp();
    const adminToken = signAccessToken({
      sub: IDS.userSuperAdmin,
      roles: [{ code: 'SUPER_ADMIN' }],
      farmerId: null,
      customerId: null,
    });

    it('POST /v1/farmers/me/certifications rejects invalid date ordering (expiresOn <= issuedOn)', async () => {
      const farmerToken = signAccessToken({
        sub: IDS.userFarmer,
        roles: [{ code: 'FARMER' }],
        farmerId: IDS.farmer,
        customerId: null,
      });

      const res = await request(app)
        .post('/v1/farmers/me/certifications')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          certType: 'PGS',
          certNumber: 'PGS-001',
          issuingBody: 'Agency',
          issuedOn: '2026-01-01',
          expiresOn: '2025-01-01', // Before issuedOn!
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    });

    it('BR-48e: POST /v1/farmers/me/certifications answers an impossible date with 422 VALIDATION_FAILED and a field-level error on body.expiresOn', async () => {
      const farmerToken = signAccessToken({
        sub: IDS.userFarmer,
        roles: [{ code: 'FARMER' }],
        farmerId: IDS.farmer,
        customerId: null,
      });

      const res = await request(app)
        .post('/v1/farmers/me/certifications')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          certType: 'OTHER',
          certNumber: 'JAIVIK-2026-001',
          issuingBody: 'Jaivik Bharat',
          issuedOn: '2026-01-01',
          expiresOn: '2026-02-30',
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
      expect(res.body.errors['body.expiresOn']).toEqual([expect.any(String)]);
      expect(res.body.errors['body.certType']).toBeUndefined();
    });

    it('BR-48g: POST /v1/farmers/me/certifications rejects an unknown certType and a blank certNumber field by field', async () => {
      const farmerToken = signAccessToken({
        sub: IDS.userFarmer,
        roles: [{ code: 'FARMER' }],
        farmerId: IDS.farmer,
        customerId: null,
      });

      const res = await request(app)
        .post('/v1/farmers/me/certifications')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          certType: 'ORGANIC',
          certNumber: '   ',
          issuingBody: 'Agency',
          issuedOn: '2026-01-01',
          expiresOn: '2027-01-01',
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
      expect(res.body.errors['body.certType']).toBeDefined();
      expect(res.body.errors['body.certNumber']).toBeDefined();
    });

    it('BR-48i: POST /v1/farmers/me/certifications answers OTHER without customTypeName, and PGS with one, with 422 on body.customTypeName', async () => {
      const farmerToken = signAccessToken({
        sub: IDS.userFarmer,
        roles: [{ code: 'FARMER' }],
        farmerId: IDS.farmer,
        customerId: null,
      });
      const body = {
        certNumber: 'JAIVIK-2026-001',
        issuingBody: 'Jaivik Bharat',
        issuedOn: '2026-01-01',
        expiresOn: '2027-01-01',
      };

      for (const extra of [{ certType: 'OTHER' }, { certType: 'OTHER', customTypeName: '  ' }, { certType: 'PGS', customTypeName: 'Jaivik Bharat' }]) {
        const res = await request(app)
          .post('/v1/farmers/me/certifications')
          .set('Authorization', `Bearer ${farmerToken}`)
          .send({ ...body, ...extra });

        expect(res.status, JSON.stringify(extra)).toBe(422);
        expect(res.body.code).toBe('VALIDATION_FAILED');
        expect(res.body.errors['body.customTypeName'], JSON.stringify(extra)).toEqual([expect.any(String)]);
      }
    });

    describe('PATCH and DELETE /v1/farmers/me/certifications/:id — wiring (BR-49, BR-50)', () => {
      const certPath = `/v1/farmers/me/certifications/${CERT_ID}`;
      const tokenFor = (role: RoleCode, ids: { farmerId?: string; customerId?: string } = {}) =>
        signAccessToken({
          sub: newId(),
          roles: [{ code: role }],
          farmerId: ids.farmerId ?? null,
          customerId: ids.customerId ?? null,
        });

      it('BR-49f/BR-50: an unauthenticated PATCH or DELETE is 401', async () => {
        expect((await request(app).patch(certPath).send({ certNumber: 'X-1' })).status).toBe(401);
        expect((await request(app).delete(certPath)).status).toBe(401);
      });

      it('BR-49f/BR-50: roles without certification.manage_own (SUPER_ADMIN, TOHFA_ADMIN, CUSTOMER) get 403 on PATCH and DELETE', async () => {
        const tokens = [
          adminToken,
          tokenFor(RoleCode.TOHFA_ADMIN),
          tokenFor(RoleCode.CUSTOMER, { customerId: IDS.customer }),
        ];
        for (const token of tokens) {
          const patch = await request(app)
            .patch(certPath)
            .set('Authorization', `Bearer ${token}`)
            .send({ certNumber: 'X-1' });
          expect(patch.status).toBe(403);
          const del = await request(app).delete(certPath).set('Authorization', `Bearer ${token}`);
          expect(del.status).toBe(403);
        }
      });

      it('BR-49f/BR-50: a malformed id is 422 on params.id for PATCH and DELETE', async () => {
        const farmerToken = tokenFor(RoleCode.FARMER, { farmerId: IDS.farmer });
        const patch = await request(app)
          .patch('/v1/farmers/me/certifications/not-a-uuid')
          .set('Authorization', `Bearer ${farmerToken}`)
          .send({ certNumber: 'X-1' });
        expect(patch.status).toBe(422);
        expect(patch.body.errors['params.id']).toBeDefined();

        const del = await request(app)
          .delete('/v1/farmers/me/certifications/not-a-uuid')
          .set('Authorization', `Bearer ${farmerToken}`);
        expect(del.status).toBe(422);
        expect(del.body.errors['params.id']).toBeDefined();
      });

      it("BR-49f: an empty PATCH body is 422 VALIDATION_FAILED keyed 'body'; a bad field is keyed body.<field>", async () => {
        const farmerToken = tokenFor(RoleCode.FARMER, { farmerId: IDS.farmer });
        const empty = await request(app)
          .patch(certPath)
          .set('Authorization', `Bearer ${farmerToken}`)
          .send({});
        expect(empty.status).toBe(422);
        expect(empty.body.code).toBe('VALIDATION_FAILED');
        expect(empty.body.errors['body']).toEqual([expect.any(String)]);

        const bad = await request(app)
          .patch(certPath)
          .set('Authorization', `Bearer ${farmerToken}`)
          .send({ expiresOn: '2026-02-30', certNumber: '' });
        expect(bad.status).toBe(422);
        expect(bad.body.errors['body.expiresOn']).toBeDefined();
        expect(bad.body.errors['body.certNumber']).toBeDefined();
      });
    });

    describe('PATCH and DELETE /v1/admin/certifications/:id — wiring (BR-51)', () => {
      const adminPath = `/v1/admin/certifications/${CERT_ID}`;
      const tokenFor = (role: RoleCode, ids: { farmerId?: string; customerId?: string } = {}) =>
        signAccessToken({
          sub: newId(),
          roles: [{ code: role }],
          farmerId: ids.farmerId ?? null,
          customerId: ids.customerId ?? null,
        });

      it('BR-51f: an unauthenticated admin PATCH or DELETE is 401', async () => {
        expect((await request(app).patch(adminPath).send({ certNumber: 'X-1' })).status).toBe(401);
        expect((await request(app).delete(adminPath)).status).toBe(401);
      });

      it('BR-51f: roles without certification.manage_any (FARMER_ADMIN, MAIN_WH_ADMIN, SUB_WH_ADMIN, FARMER, CUSTOMER) get 403 on admin PATCH and DELETE — a farmer cannot reach the admin paths', async () => {
        const tokens: Array<[string, string]> = [
          ['FARMER_ADMIN', tokenFor(RoleCode.FARMER_ADMIN)],
          ['MAIN_WH_ADMIN', tokenFor(RoleCode.MAIN_WH_ADMIN)],
          ['SUB_WH_ADMIN', tokenFor(RoleCode.SUB_WH_ADMIN)],
          ['FARMER', tokenFor(RoleCode.FARMER, { farmerId: IDS.farmer })],
          ['CUSTOMER', tokenFor(RoleCode.CUSTOMER, { customerId: IDS.customer })],
        ];
        for (const [role, token] of tokens) {
          const patch = await request(app)
            .patch(adminPath)
            .set('Authorization', `Bearer ${token}`)
            .send({ certNumber: 'X-1' });
          expect(patch.status, role).toBe(403);
          expect(patch.body.code, role).toBe('FORBIDDEN');
          const del = await request(app).delete(adminPath).set('Authorization', `Bearer ${token}`);
          expect(del.status, role).toBe(403);
        }
      });

      it("BR-51f: for SUPER_ADMIN and TOHFA_ADMIN a malformed id is 422 on params.id, an empty PATCH body is 422 keyed 'body' and a bad field is keyed body.<field> — the farmer PATCH's request schema", async () => {
        for (const token of [adminToken, tokenFor(RoleCode.TOHFA_ADMIN)]) {
          const patch = await request(app)
            .patch('/v1/admin/certifications/not-a-uuid')
            .set('Authorization', `Bearer ${token}`)
            .send({ certNumber: 'X-1' });
          expect(patch.status).toBe(422);
          expect(patch.body.errors['params.id']).toBeDefined();

          const del = await request(app)
            .delete('/v1/admin/certifications/not-a-uuid')
            .set('Authorization', `Bearer ${token}`);
          expect(del.status).toBe(422);
          expect(del.body.errors['params.id']).toBeDefined();

          const empty = await request(app).patch(adminPath).set('Authorization', `Bearer ${token}`).send({});
          expect(empty.status).toBe(422);
          expect(empty.body.code).toBe('VALIDATION_FAILED');
          expect(empty.body.errors['body']).toEqual([expect.any(String)]);

          const bad = await request(app)
            .patch(adminPath)
            .set('Authorization', `Bearer ${token}`)
            .send({ expiresOn: '2026-02-30', certNumber: '' });
          expect(bad.status).toBe(422);
          expect(bad.body.errors['body.expiresOn']).toBeDefined();
          expect(bad.body.errors['body.certNumber']).toBeDefined();
        }
      });
    });

    it('GET /v1/admin/certifications rejects a FARMER token with 403 (certification.view grants FARMER none)', async () => {
      const farmerToken = signAccessToken({
        sub: IDS.userFarmer,
        roles: [{ code: 'FARMER' }],
        farmerId: IDS.farmer,
        customerId: null,
      });

      const res = await request(app)
        .get('/v1/admin/certifications')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(403);
    });

    it('GET /v1/admin/certifications/:id rejects an unauthenticated caller with 401', async () => {
      const res = await request(app).get(
        '/v1/admin/certifications/33333333-3333-3333-3333-333333333333',
      );

      expect(res.status).toBe(401);
    });

    it('GET /v1/admin/certifications/:id rejects a malformed id with 422', async () => {
      const res = await request(app)
        .get('/v1/admin/certifications/not-a-uuid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    });

    it('POST /admin/certifications/:id/unverify requires reason with minimum length', async () => {
      const res = await request(app)
        .post('/v1/admin/certifications/33333333-3333-3333-3333-333333333333/unverify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'bad', // Too short (< 5 chars)
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    });
  });

  describeIfDatabase('Integration against PostgreSQL', () => {
    const app = createApp();

    /**
     * Removes a users row a test committed. Guarded on audit_log: once a user
     * has acted, the append-only audit trail (BR-35a) names them as actor and
     * the row must stay — such a test uses the fixed users of
     * withCommittedFarmers instead, which are reused rather than piling up.
     */
    async function deleteCommittedTestUser(userId: string): Promise<void> {
      const { pool } = await import('../../db/pool.js');
      await pool.query(
        `DELETE FROM users u
          WHERE u.id = $1
            AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.actor_id = u.id)`,
        [userId],
      );
    }

    it('database check constraint enforces verified_by for VERIFIED rows', async () => {
      if (!(await databaseReady('certifications'))) return;

      const testAdminId = newId();
      const randMobile = `+919800${Math.floor(100000 + Math.random() * 900000)}`;
      const adminToken = signAccessToken({
        sub: testAdminId,
        roles: [{ code: 'SUPER_ADMIN' }],
        farmerId: null,
        customerId: null,
      });

      const { pool } = await import('../../db/pool.js');
      await pool.query(`
        INSERT INTO users (id, mobile, full_name, user_type, status)
        VALUES ('${testAdminId}', '${randMobile}', 'Super Admin Cert Test', 'ADMIN', 'ACTIVE');
      `);

      try {
        // Validating admin verification route executes correctly
        const res = await request(app)
          .post('/v1/admin/certifications/00000000-0000-0000-0000-000000000001/verify')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            portalReference: 'REF-1234',
          });
        // Either 404 (non-existent id) or 200, but never a 500 constraint crash
        expect([200, 404]).toContain(res.status);
      } finally {
        await deleteCommittedTestUser(testAdminId);
      }
    });

    it('getCertExpiryWarningDays reads the seeded system_config row (30)', async () => {
      if (!(await databaseReady('certifications'))) return;

      const { pool } = await import('../../db/pool.js');
      const { certificationsRepo } = await import('./certifications.repo.js');

      const days = await certificationsRepo.getCertExpiryWarningDays(pool);
      expect(days).toBe(30);
    });

    it('getCertExpiryWarningDays falls back to 30 when the key is absent', async () => {
      if (!(await databaseReady('certifications'))) return;

      const { pool } = await import('../../db/pool.js');
      const { certificationsRepo } = await import('./certifications.repo.js');

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(`DELETE FROM system_config WHERE key = 'cert_expiry_warning_days'`);

        const days = await certificationsRepo.getCertExpiryWarningDays(client);
        expect(days).toBe(30);
      } finally {
        // Never commit the delete — the row is real seed data other tests rely on.
        await client.query('ROLLBACK');
        client.release();
      }
    });

    it('GET /v1/config/farmer round-trips against the real database (30)', async () => {
      if (!(await databaseReady('certifications'))) return;

      const testUserId = newId();
      const randMobile = `+919800${Math.floor(100000 + Math.random() * 900000)}`;
      const { pool } = await import('../../db/pool.js');
      await pool.query(`
        INSERT INTO users (id, mobile, full_name, user_type, status)
        VALUES ('${testUserId}', '${randMobile}', 'Config Test Farmer', 'FARMER', 'ACTIVE');
      `);

      const farmerToken = signAccessToken({
        sub: testUserId,
        roles: [{ code: 'FARMER' }],
        farmerId: null,
        customerId: null,
      });

      try {
        const res = await request(app)
          .get('/v1/config/farmer')
          .set('Authorization', `Bearer ${farmerToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ certExpiryWarningDays: 30, certExpiryMaxPastDays: 365, certExpiryMaxFutureDays: 730 });
      } finally {
        await deleteCommittedTestUser(testUserId);
      }
    });

    it('BR-48h: getCertExpiryMaxFutureDays reads the seeded system_config row (cert_expiry_max_future_days = 730)', async () => {
      if (!(await databaseReady('certifications'))) return;

      const { pool } = await import('../../db/pool.js');
      const { certificationsRepo } = await import('./certifications.repo.js');

      const seeded = await pool.query<{ value: unknown }>(
        `SELECT value FROM system_config WHERE key = 'cert_expiry_max_future_days'`,
      );
      expect(seeded.rows[0]?.value).toBe(730);
      expect(await certificationsRepo.getCertExpiryMaxFutureDays(pool)).toBe(730);
    });

    it('BR-48h: getCertExpiryMaxFutureDays follows an edited system_config value, and falls back to 730 when the value is invalid or the key is absent', async () => {
      if (!(await databaseReady('certifications'))) return;

      const { pool } = await import('../../db/pool.js');
      const { certificationsRepo } = await import('./certifications.repo.js');

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `UPDATE system_config SET value = '700'::jsonb WHERE key = 'cert_expiry_max_future_days'`,
        );
        expect(await certificationsRepo.getCertExpiryMaxFutureDays(client)).toBe(700);

        await client.query(
          `UPDATE system_config SET value = '-1'::jsonb WHERE key = 'cert_expiry_max_future_days'`,
        );
        expect(await certificationsRepo.getCertExpiryMaxFutureDays(client)).toBe(730);

        await client.query(`DELETE FROM system_config WHERE key = 'cert_expiry_max_future_days'`);
        expect(await certificationsRepo.getCertExpiryMaxFutureDays(client)).toBe(730);
      } finally {
        // Never commit — the row is real seed data other tests rely on.
        await client.query('ROLLBACK');
        client.release();
      }
    });

    it('BR-48b: getCertExpiryMaxPastDays reads the seeded system_config row (cert_expiry_max_past_days = 365)', async () => {
      if (!(await databaseReady('certifications'))) return;

      const { pool } = await import('../../db/pool.js');
      const { certificationsRepo } = await import('./certifications.repo.js');

      const seeded = await pool.query<{ value: unknown }>(
        `SELECT value FROM system_config WHERE key = 'cert_expiry_max_past_days'`,
      );
      expect(seeded.rows[0]?.value).toBe(365);
      expect(await certificationsRepo.getCertExpiryMaxPastDays(pool)).toBe(365);
    });

    it('BR-48b: getCertExpiryMaxPastDays follows an edited system_config value, and falls back to 365 when the key is absent', async () => {
      if (!(await databaseReady('certifications'))) return;

      const { pool } = await import('../../db/pool.js');
      const { certificationsRepo } = await import('./certifications.repo.js');

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `UPDATE system_config SET value = '90'::jsonb WHERE key = 'cert_expiry_max_past_days'`,
        );
        expect(await certificationsRepo.getCertExpiryMaxPastDays(client)).toBe(90);

        await client.query(`DELETE FROM system_config WHERE key = 'cert_expiry_max_past_days'`);
        expect(await certificationsRepo.getCertExpiryMaxPastDays(client)).toBe(365);
      } finally {
        // Never commit — the row is real seed data other tests rely on.
        await client.query('ROLLBACK');
        client.release();
      }
    });

    it('BR-02h: an OTHER certificate is persisted (certification_type accepts OTHER), can be verified, and never lifts the market block; a verified PGS one does', async () => {
      if (!(await databaseReady('certifications'))) return;

      const { pool } = await import('../../db/pool.js');
      const { certificationsRepo } = await import('./certifications.repo.js');

      const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
      const shift = (days: number) => {
        const d = new Date(`${today}T00:00:00Z`);
        d.setUTCDate(d.getUTCDate() + days);
        return d.toISOString().slice(0, 10);
      };

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const userId = newId();
        const farmerId = newId();
        await client.query(
          `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, $3, 'FARMER', 'ACTIVE')`,
          [userId, `+9196${Math.floor(10000000 + Math.random() * 89999999)}`, 'Cert OTHER Test Farmer'],
        );
        await client.query(
          `INSERT INTO farmers (id, user_id, tohfa_farmer_id) VALUES ($1, $2, $3)`,
          [farmerId, userId, `TOHFA-TEST-${farmerId.slice(0, 8)}`],
        );

        const service = createCertificationsService(certificationsRepo, async (fn) => fn(client));
        const actor = anActor({ userId, roles: [{ code: RoleCode.FARMER }], farmerId });

        const created = (await service.createCertification(actor, {
          certType: 'OTHER',
          customTypeName: 'Jaivik Bharat',
          certNumber: `JAIVIK/${newId()}`,
          issuingBody: 'Jaivik Bharat',
          issuedOn: shift(-100),
          expiresOn: shift(300),
        })) as { id: string; certType: string; customTypeName: string | null; blocksListings: boolean };
        expect(created.certType).toBe('OTHER');
        expect(created.customTypeName).toBe('Jaivik Bharat');

        const stored = await client.query<{ cert_type: string; custom_type_name: string | null }>(
          `SELECT cert_type::text, custom_type_name FROM certifications WHERE id = $1`,
          [created.id],
        );
        expect(stored.rows[0]?.cert_type).toBe('OTHER');
        expect(stored.rows[0]?.custom_type_name).toBe('Jaivik Bharat');

        // An admin may verify an OTHER certificate; it still does not qualify.
        const verified = (await service.verifyCertification(actor, created.id, {
          note: 'Checked Jaivik Bharat portal',
        })) as { verificationStatus: string; blocksListings: boolean };
        expect(verified.verificationStatus).toBe('VERIFIED');
        expect(verified.blocksListings).toBe(true);

        const afterOther = await client.query<{ is_market_blocked: boolean; market_block_reason: string | null }>(
          `SELECT is_market_blocked, market_block_reason FROM farmers WHERE id = $1`,
          [farmerId],
        );
        expect(afterOther.rows[0]?.is_market_blocked).toBe(true);
        expect(afterOther.rows[0]?.market_block_reason).toContain('BR-02');
        expect(afterOther.rows[0]?.market_block_reason).toContain('OTHER');

        // A verified, unexpired PGS certificate is what lifts it.
        await client.query(
          `INSERT INTO certifications
             (farmer_id, cert_type, cert_number, issuing_body, issued_on, expires_on,
              verification_status, verified_by, verified_at)
           VALUES ($1, 'PGS', $2, 'PGS Organic India Council', $3, $4, 'VERIFIED', $5, now())`,
          [farmerId, `PGS/${newId()}`, shift(-100), shift(300), userId],
        );
        const lifted = await certificationsRepo.recomputeFarmerMarketBlock(client, farmerId, null, 'SYSTEM', 'JOB');
        expect(lifted.isMarketBlocked).toBe(false);
      } finally {
        await client.query('ROLLBACK');
        client.release();
      }
    });

    // ---------------------------------------------------------------------
    // BR-48i / BR-49 / BR-50 against PostgreSQL. Every scenario runs inside one
    // transaction on one client and is rolled back, so the service is built
    // with a runner that hands it that client.
    // ---------------------------------------------------------------------
    interface FarmerWorld {
      client: PoolClient;
      service: ReturnType<typeof createCertificationsService>;
      repo: CertificationsRepo;
      farmerId: string;
      actor: ReturnType<typeof anActor>;
      admin: ReturnType<typeof anActor>;
      /** Creates (and optionally verifies) a certificate for this farmer through the service. */
      addCert(input?: Partial<CertificationCreate>, verify?: boolean): Promise<{ id: string; certNumber: string }>;
      farmerRow(): Promise<{ is_market_blocked: boolean; market_block_reason: string | null }>;
      /** Inserts a second, unrelated farmer (for cross-farmer scenarios). */
      makeFarmer(): Promise<{ userId: string; farmerId: string }>;
      /** Inserts an admin user of its own (not the farmer's) and returns it as an actor. */
      makeAdmin(role?: RoleCode): Promise<ReturnType<typeof anActor>>;
      /** The action codes of every audit_log row about one certificate, sorted. */
      auditCodes(certificationId: string): Promise<string[]>;
    }

    async function inFarmerWorld(fn: (world: FarmerWorld) => Promise<void>): Promise<void> {
      if (!(await databaseReady('certifications'))) return;

      const { pool } = await import('../../db/pool.js');
      const { certificationsRepo } = await import('./certifications.repo.js');

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const makeFarmer = async () => {
          const userId = newId();
          const farmerId = newId();
          await client.query(
            `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, $3, 'FARMER', 'ACTIVE')`,
            [userId, `+9195${Math.floor(10000000 + Math.random() * 89999999)}`, 'Cert Edit/Delete Test Farmer'],
          );
          await client.query(`INSERT INTO farmers (id, user_id, tohfa_farmer_id) VALUES ($1, $2, $3)`, [
            farmerId,
            userId,
            `TOHFA-TEST-${farmerId.slice(0, 8)}`,
          ]);
          return { userId, farmerId };
        };
        const { userId, farmerId } = await makeFarmer();
        // The service's unit of work runs as a savepoint on the scenario's
        // client: released when it returns, rolled back when it throws — the
        // contract withTransaction gives it in production. A statement the
        // database refuses (BR-48j's unique violation) then undoes only that
        // call, instead of aborting the whole scenario's transaction.
        const service = createCertificationsService(certificationsRepo, async (f) => {
          await client.query('SAVEPOINT service_tx');
          try {
            const result = await f(client);
            await client.query('RELEASE SAVEPOINT service_tx');
            return result;
          } catch (error) {
            await client.query('ROLLBACK TO SAVEPOINT service_tx');
            throw error;
          }
        });
        const actor = anActor({ userId, roles: [{ code: RoleCode.FARMER }], farmerId });
        // verified_by must reference a real users row; the farmer's own user is
        // enough for the CHECK and FK, which is all these scenarios need.
        const admin = anActor({ userId, roles: [{ code: RoleCode.SUPER_ADMIN }] });

        const world: FarmerWorld = {
          client,
          service,
          repo: certificationsRepo,
          farmerId,
          actor,
          admin,
          async addCert(input = {}, verify = false) {
            const created = (await service.createCertification(actor, {
              certType: 'PGS',
              certNumber: `PGS/${newId()}`,
              issuingBody: 'PGS Organic India Council',
              issuedOn: kolkataDayOffset(-100),
              expiresOn: kolkataDayOffset(300),
              ...input,
            })) as { id: string; certNumber: string };
            if (verify) await service.verifyCertification(admin, created.id, { note: 'Checked portal' });
            return created;
          },
          async farmerRow() {
            const res = await client.query<{ is_market_blocked: boolean; market_block_reason: string | null }>(
              `SELECT is_market_blocked, market_block_reason FROM farmers WHERE id = $1`,
              [farmerId],
            );
            return res.rows[0]!;
          },
          makeFarmer,
          async makeAdmin(role = RoleCode.TOHFA_ADMIN) {
            const adminUserId = newId();
            await client.query(
              `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, $3, 'ADMIN', 'ACTIVE')`,
              [adminUserId, `+9195${Math.floor(10000000 + Math.random() * 89999999)}`, 'Cert Admin Test User'],
            );
            return anActor({ userId: adminUserId, roles: [{ code: role }] });
          },
          async auditCodes(certificationId) {
            const res = await client.query<{ action_code: string }>(
              `SELECT action_code FROM audit_log WHERE entity_type = 'certification' AND entity_id = $1`,
              [certificationId],
            );
            return res.rows.map((r) => r.action_code).sort();
          },
        };
        await fn(world);
      } finally {
        await client.query('ROLLBACK');
        client.release();
      }
    }

    it('BR-48i (PostgreSQL): the custom_type_name CHECK rejects a name on a PGS row and a blank or over-long name on an OTHER row', async () => {
      await inFarmerWorld(async ({ client, farmerId }) => {
        const insert = (certType: string, name: string | null) =>
          client.query(
            `INSERT INTO certifications (farmer_id, cert_type, custom_type_name, cert_number, issuing_body, issued_on, expires_on)
             VALUES ($1, $2, $3, $4, 'Body', '2026-01-01', '2027-01-01')`,
            [farmerId, certType, name, `CHK/${newId()}`],
          );
        const violates = async (certType: string, name: string | null) => {
          await client.query('SAVEPOINT chk');
          try {
            await insert(certType, name);
            await client.query('RELEASE SAVEPOINT chk');
            return null;
          } catch (error) {
            await client.query('ROLLBACK TO SAVEPOINT chk');
            return (error as { constraint?: string }).constraint ?? 'unknown';
          }
        };

        expect(await violates('PGS', 'Jaivik Bharat')).toBe('certifications_custom_type_name_chk');
        expect(await violates('OTHER', '   ')).toBe('certifications_custom_type_name_chk');
        expect(await violates('OTHER', 'X'.repeat(81))).toBe('certifications_custom_type_name_chk');
        expect(await violates('OTHER', 'Jaivik Bharat')).toBeNull();
        expect(await violates('NPOP', null)).toBeNull();
      });
    });

    it('BR-48i (PostgreSQL): since migration 0031 the CHECK also refuses an OTHER row without a name, on INSERT and on UPDATE — the database no longer relies on the API for that half', async () => {
      await inFarmerWorld(async ({ client, farmerId }) => {
        /** Runs one statement in a savepoint; the violated constraint's name, or null if it was accepted. */
        const violates = async (sql: string, params: unknown[]) => {
          await client.query('SAVEPOINT chk_strict');
          try {
            await client.query(sql, params);
            await client.query('RELEASE SAVEPOINT chk_strict');
            return null;
          } catch (error) {
            await client.query('ROLLBACK TO SAVEPOINT chk_strict');
            return (error as { constraint?: string }).constraint ?? 'unknown';
          }
        };
        const insert = (certType: string, name: string | null) =>
          violates(
            `INSERT INTO certifications (farmer_id, cert_type, custom_type_name, cert_number, issuing_body, issued_on, expires_on)
             VALUES ($1, $2, $3, $4, 'Body', '2026-01-01', '2027-01-01')`,
            [farmerId, certType, name, `CHK/${newId()}`],
          );

        // OTHER without a name: column omitted, and explicitly NULL.
        expect(
          await violates(
            `INSERT INTO certifications (farmer_id, cert_type, cert_number, issuing_body, issued_on, expires_on)
             VALUES ($1, 'OTHER', $2, 'Body', '2026-01-01', '2027-01-01')`,
            [farmerId, `CHK/${newId()}`],
          ),
        ).toBe('certifications_custom_type_name_chk');
        expect(await insert('OTHER', null)).toBe('certifications_custom_type_name_chk');
        // PGS / NPOP with a name, and an OTHER name that is blank or too long, as before.
        expect(await insert('PGS', 'Jaivik Bharat')).toBe('certifications_custom_type_name_chk');
        expect(await insert('NPOP', 'Jaivik Bharat')).toBe('certifications_custom_type_name_chk');
        expect(await insert('OTHER', '   ')).toBe('certifications_custom_type_name_chk');
        expect(await insert('OTHER', 'X'.repeat(81))).toBe('certifications_custom_type_name_chk');
        // The accepted shapes.
        expect(await insert('OTHER', 'X'.repeat(80))).toBeNull();
        expect(await insert('PGS', null)).toBeNull();
        expect(await insert('NPOP', null)).toBeNull();

        // UPDATE is held to the same rule: clearing an OTHER row's name, or
        // switching it to PGS while keeping the name.
        const row = await client.query<{ id: string }>(
          `INSERT INTO certifications (farmer_id, cert_type, custom_type_name, cert_number, issuing_body, issued_on, expires_on)
           VALUES ($1, 'OTHER', 'Jaivik Bharat', $2, 'Body', '2026-01-01', '2027-01-01') RETURNING id`,
          [farmerId, `CHK/${newId()}`],
        );
        const id = row.rows[0]!.id;
        expect(await violates(`UPDATE certifications SET custom_type_name = NULL WHERE id = $1`, [id])).toBe(
          'certifications_custom_type_name_chk',
        );
        expect(await violates(`UPDATE certifications SET cert_type = 'PGS' WHERE id = $1`, [id])).toBe(
          'certifications_custom_type_name_chk',
        );
        expect(
          await violates(`UPDATE certifications SET cert_type = 'PGS', custom_type_name = NULL WHERE id = $1`, [id]),
        ).toBeNull();
      });
    });

    it("BR-49a (PostgreSQL): editing the farmer's only verified PGS certificate resets it to UNVERIFIED, clears every verifier column, re-blocks the farmer and writes the audit rows, all in the caller's transaction", async () => {
      await inFarmerWorld(async ({ client, service, actor, addCert, farmerRow, auditCodes }) => {
        const cert = await addCert({}, true);
        expect((await farmerRow()).is_market_blocked).toBe(false);
        // Recording and verifying the certificate were audited too (BR-35c);
        // what this edit adds is measured against them.
        const auditBefore = await auditCodes(cert.id);

        const updated = (await service.updateMyCertification(actor, cert.id, {
          certNumber: `${cert.certNumber}-R`,
        })) as { certNumber: string; verificationStatus: string; verifiedBy: string | null };
        expect(updated.certNumber).toBe(`${cert.certNumber}-R`);
        expect(updated.verificationStatus).toBe('UNVERIFIED');
        expect(updated.verifiedBy).toBeNull();

        const row = await client.query(
          `SELECT verification_status::text, verified_by, verified_at, verification_notes, portal_checked_url, cert_number
             FROM certifications WHERE id = $1`,
          [cert.id],
        );
        expect(row.rows[0]).toEqual({
          verification_status: 'UNVERIFIED',
          verified_by: null,
          verified_at: null,
          verification_notes: null,
          portal_checked_url: null,
          cert_number: `${cert.certNumber}-R`,
        });

        const farmer = await farmerRow();
        expect(farmer.is_market_blocked).toBe(true);
        expect(farmer.market_block_reason).toContain('pending');

        expect(await auditCodes(cert.id)).toEqual([...auditBefore, 'certification.update'].sort());
      });
    });

    it('BR-49b (PostgreSQL): a PATCH that changes nothing keeps the certificate VERIFIED and the farmer unblocked', async () => {
      await inFarmerWorld(async ({ service, actor, addCert, farmerRow, auditCodes }) => {
        const cert = await addCert({}, true);
        const auditBefore = await auditCodes(cert.id);
        const same = (await service.updateMyCertification(actor, cert.id, {
          certNumber: cert.certNumber,
          certType: 'PGS',
        })) as { verificationStatus: string };
        expect(same.verificationStatus).toBe('VERIFIED');
        expect((await farmerRow()).is_market_blocked).toBe(false);
        // The no-op wrote no audit row of its own.
        expect(await auditCodes(cert.id)).toEqual(auditBefore);
      });
    });

    it("BR-49d (PostgreSQL): another farmer's certificate and a soft-deleted one are 404 NOT_FOUND and stay unchanged", async () => {
      await inFarmerWorld(async (world) => {
        const { client, service, addCert } = world;
        const mine = await addCert({}, true);

        const { userId: otherUserId, farmerId: otherFarmerId } = await world.makeFarmer();
        const intruder = anActor({ userId: otherUserId, roles: [{ code: RoleCode.FARMER }], farmerId: otherFarmerId });

        await expect(service.updateMyCertification(intruder, mine.id, { certNumber: 'HIJACK-1' })).rejects.toMatchObject({
          code: 'NOT_FOUND',
          status: 404,
        });
        await expect(service.deleteMyCertification(intruder, mine.id)).rejects.toMatchObject({ code: 'NOT_FOUND' });

        const after = await client.query(
          `SELECT cert_number, verification_status::text, deleted_at FROM certifications WHERE id = $1`,
          [mine.id],
        );
        expect(after.rows[0]).toEqual({ cert_number: mine.certNumber, verification_status: 'VERIFIED', deleted_at: null });

        await service.deleteMyCertification(world.actor, mine.id);
        await expect(service.updateMyCertification(world.actor, mine.id, { certNumber: 'X-1' })).rejects.toMatchObject({
          code: 'NOT_FOUND',
        });
      });
    });

    it('BR-49 (PostgreSQL): PATCH documentUrl records a new farmer_documents CERTIFICATE row, points the certificate at it and returns it as documentUrl', async () => {
      await inFarmerWorld(async ({ client, service, actor, farmerId, addCert }) => {
        const cert = await addCert({ documentUrl: 'https://cdn.tohfa.in/docs/first.pdf' });
        const updated = (await service.updateMyCertification(actor, cert.id, {
          documentUrl: 'https://cdn.tohfa.in/docs/renewed.pdf',
        })) as { documentUrl: string | null };
        expect(updated.documentUrl).toBe('https://cdn.tohfa.in/docs/renewed.pdf');

        const docs = await client.query<{ storage_key: string }>(
          `SELECT storage_key FROM farmer_documents WHERE farmer_id = $1 AND doc_type = 'CERTIFICATE' ORDER BY created_at, storage_key`,
          [farmerId],
        );
        expect(docs.rows.map((d) => d.storage_key).sort()).toEqual([
          'https://cdn.tohfa.in/docs/first.pdf',
          'https://cdn.tohfa.in/docs/renewed.pdf',
        ]);
        const linked = await client.query<{ storage_key: string }>(
          `SELECT fd.storage_key FROM certifications c JOIN farmer_documents fd ON fd.id = c.document_id WHERE c.id = $1`,
          [cert.id],
        );
        expect(linked.rows[0]?.storage_key).toBe('https://cdn.tohfa.in/docs/renewed.pdf');
      });
    });

    it('BR-50a (PostgreSQL): DELETE keeps the row and its document (deleted_at set) but removes the certificate from the farmer list, admin list and detail, listing eligibility and the market block; verify then 404s', async () => {
      await inFarmerWorld(async ({ client, service, repo, actor, admin, farmerId, addCert, farmerRow, auditCodes }) => {
        const { listingsRepo } = await import('../listings/listings.repo.js');
        const { LISTING_QUALIFYING_CERT_TYPES } = await import('./certifications.schema.js');
        const { getTodayKolkata } = await import('./certifications.service.js');

        const cert = await addCert({ documentUrl: 'https://cdn.tohfa.in/docs/only.pdf' }, true);
        expect((await farmerRow()).is_market_blocked).toBe(false);
        const auditBefore = await auditCodes(cert.id);
        expect(
          (await listingsRepo.getListingCertEligibility(client, farmerId, getTodayKolkata(), LISTING_QUALIFYING_CERT_TYPES)).eligible,
        ).toBe(true);

        await expect(service.deleteMyCertification(actor, cert.id)).resolves.toBeUndefined();

        const row = await client.query<{ deleted_at: Date | null; document_id: string | null }>(
          `SELECT deleted_at, document_id FROM certifications WHERE id = $1`,
          [cert.id],
        );
        expect(row.rows[0]?.deleted_at).toBeInstanceOf(Date);
        expect(row.rows[0]?.document_id).not.toBeNull();
        const doc = await client.query(`SELECT deleted_at FROM farmer_documents WHERE id = $1`, [row.rows[0]?.document_id]);
        expect(doc.rows[0]).toEqual({ deleted_at: null });

        expect((await repo.listByFarmerId(client, farmerId, 20)).items).toHaveLength(0);
        expect((await repo.listAllCertifications(client, { limit: 20, farmerId })).items).toHaveLength(0);
        expect(await repo.findByIdAdmin(client, cert.id)).toBeNull();
        expect(
          (await listingsRepo.getListingCertEligibility(client, farmerId, getTodayKolkata(), LISTING_QUALIFYING_CERT_TYPES)).eligible,
        ).toBe(false);

        const farmer = await farmerRow();
        expect(farmer.is_market_blocked).toBe(true);
        expect(farmer.market_block_reason).toContain('No organic certifications');

        await expect(service.verifyCertification(admin, cert.id, {})).rejects.toMatchObject({ code: 'NOT_FOUND' });
        await expect(
          service.unverifyCertification(admin, cert.id, { reason: 'Revoked by the issuing body' }),
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });

        // One row for the delete; the refused verify/unverify added none.
        expect(await auditCodes(cert.id)).toEqual([...auditBefore, 'certification.delete'].sort());
      });
    });

    it('BR-50b (PostgreSQL): deleting the same certificate twice is 404 NOT_FOUND the second time', async () => {
      await inFarmerWorld(async ({ service, actor, addCert }) => {
        const cert = await addCert();
        await service.deleteMyCertification(actor, cert.id);
        await expect(service.deleteMyCertification(actor, cert.id)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
      });
    });

    it('BR-50c (PostgreSQL): after deleting a certificate the farmer can record the same certType and certNumber again', async () => {
      await inFarmerWorld(async ({ client, service, actor, addCert }) => {
        const first = await addCert({ certType: 'NPOP', certNumber: `NPOP/RE-ADD/${newId()}` });
        await service.deleteMyCertification(actor, first.id);

        const again = await addCert({ certType: 'NPOP', certNumber: first.certNumber });
        expect(again.id).not.toBe(first.id);
        expect(again.certNumber).toBe(first.certNumber);

        const rows = await client.query<{ live: boolean }>(
          `SELECT deleted_at IS NULL AS live FROM certifications WHERE cert_number = $1 ORDER BY created_at`,
          [first.certNumber],
        );
        expect(rows.rows.map((r) => r.live).sort()).toEqual([false, true]);
      });
    });

    it("BR-35c (PostgreSQL): create, verify and unverify each write exactly one audit row naming their actor, in the caller's transaction; a unit of work that rolls back leaves no audit row", async () => {
      await inFarmerWorld(async (world) => {
        const { client, service, repo, actor, auditCodes } = world;
        const admin = await world.makeAdmin(RoleCode.TOHFA_ADMIN);
        const rowsFor = async (certificationId: string, actionCode: string) =>
          (
            await client.query(
              `SELECT actor_id, actor_role, before IS NOT NULL AS has_before, after IS NOT NULL AS has_after
                 FROM audit_log
                WHERE entity_type = 'certification' AND entity_id = $1 AND action_code = $2`,
              [certificationId, actionCode],
            )
          ).rows;
        const input = (certNumber: string): CertificationCreate => ({
          certType: 'PGS',
          certNumber,
          issuingBody: 'PGS Organic India Council',
          issuedOn: kolkataDayOffset(-100),
          expiresOn: kolkataDayOffset(300),
        });

        const created = (await service.createCertification(actor, input(`PGS/AUDIT/${newId()}`))) as { id: string };
        expect(await auditCodes(created.id)).toEqual(['certification.create']);
        expect(await rowsFor(created.id, 'certification.create')).toEqual([
          { actor_id: actor.userId, actor_role: 'FARMER', has_before: false, has_after: true },
        ]);

        await service.verifyCertification(admin, created.id, {
          note: 'Checked PGS India portal',
          portalReference: 'https://pgsindia-ncof.gov.in/check/1',
        });
        expect(await auditCodes(created.id)).toEqual(['certification.create', 'certification.verify']);
        expect(await rowsFor(created.id, 'certification.verify')).toEqual([
          { actor_id: admin.userId, actor_role: 'TOHFA_ADMIN', has_before: true, has_after: true },
        ]);

        await service.unverifyCertification(admin, created.id, { reason: 'Number does not match the portal record' });
        const recorded = ['certification.create', 'certification.unverify', 'certification.verify'];
        expect(await auditCodes(created.id)).toEqual(recorded);
        expect(await rowsFor(created.id, 'certification.unverify')).toEqual([
          { actor_id: admin.userId, actor_role: 'TOHFA_ADMIN', has_before: true, has_after: true },
        ]);

        // A unit of work that fails after the service has written everything —
        // as a failing COMMIT would — takes its audit row with it, because the
        // row was written on the same client inside the same transaction.
        const failsAtCommit = createCertificationsService(repo, async (f) => {
          await client.query('SAVEPOINT fails_at_commit');
          try {
            await f(client);
            throw new Error('simulated commit failure');
          } catch (error) {
            await client.query('ROLLBACK TO SAVEPOINT fails_at_commit');
            throw error;
          }
        });
        const lostNumber = `PGS/LOST/${newId()}`;
        await expect(failsAtCommit.createCertification(actor, input(lostNumber))).rejects.toThrow('simulated commit failure');
        await expect(failsAtCommit.verifyCertification(admin, created.id, {})).rejects.toThrow('simulated commit failure');

        expect((await client.query(`SELECT 1 FROM certifications WHERE cert_number = $1`, [lostNumber])).rowCount).toBe(0);
        const creates = await client.query(
          `SELECT 1 FROM audit_log WHERE action_code = 'certification.create' AND actor_id = $1`,
          [actor.userId],
        );
        expect(creates.rowCount).toBe(1);
        expect(await auditCodes(created.id)).toEqual(recorded);
        const stored = await client.query(`SELECT verification_status::text FROM certifications WHERE id = $1`, [created.id]);
        expect(stored.rows[0]).toEqual({ verification_status: 'REJECTED' });
      });
    });

    it("BR-51a (PostgreSQL): an admin edit of a farmer's only verified PGS certificate resets it to UNVERIFIED, re-blocks that farmer — the owner — and writes one certification.admin_update row naming the admin, all in the caller's transaction", async () => {
      await inFarmerWorld(async (world) => {
        const { client, service, farmerId, addCert, farmerRow, auditCodes } = world;
        const admin = await world.makeAdmin(RoleCode.TOHFA_ADMIN);
        const cert = await addCert({}, true);
        expect((await farmerRow()).is_market_blocked).toBe(false);
        const auditBefore = await auditCodes(cert.id);

        // A farmerId in the body is stripped by the schema; even handed to the
        // service it names nobody — the owner is read from the stored row.
        const updated = (await service.adminUpdateCertification(admin, cert.id, {
          issuingBody: 'PGS Regional Council, Ooty',
          farmerId: newId(),
        } as CertificationUpdate)) as Record<string, unknown>;
        expect(updated).toMatchObject({
          farmerId,
          issuingBody: 'PGS Regional Council, Ooty',
          verificationStatus: 'UNVERIFIED',
          verifiedBy: null,
          verifiedAt: null,
        });

        const row = await client.query(
          `SELECT farmer_id, verification_status::text, verified_by, verified_at, verification_notes, portal_checked_url
             FROM certifications WHERE id = $1`,
          [cert.id],
        );
        expect(row.rows[0]).toEqual({
          farmer_id: farmerId,
          verification_status: 'UNVERIFIED',
          verified_by: null,
          verified_at: null,
          verification_notes: null,
          portal_checked_url: null,
        });

        const farmer = await farmerRow();
        expect(farmer.is_market_blocked).toBe(true);
        expect(farmer.market_block_reason).toContain('pending');
        const block = await client.query<{ actor_id: string }>(
          `SELECT actor_id FROM audit_log
            WHERE entity_type = 'farmer' AND entity_id = $1 AND action_code = 'certification.block_listings'`,
          [farmerId],
        );
        expect(block.rows.map((r) => r.actor_id)).toContain(admin.userId);

        expect(await auditCodes(cert.id)).toEqual([...auditBefore, 'certification.admin_update'].sort());
        const audit = await client.query(
          `SELECT actor_id, actor_role, before->>'verificationStatus' AS before_status,
                  after->>'verificationStatus' AS after_status, after->>'issuingBody' AS after_issuing_body
             FROM audit_log
            WHERE entity_type = 'certification' AND entity_id = $1 AND action_code = 'certification.admin_update'`,
          [cert.id],
        );
        expect(audit.rows).toEqual([
          {
            actor_id: admin.userId,
            actor_role: 'TOHFA_ADMIN',
            before_status: 'VERIFIED',
            after_status: 'UNVERIFIED',
            after_issuing_body: 'PGS Regional Council, Ooty',
          },
        ]);
      });
    });

    it('BR-51a (PostgreSQL): an admin edit onto a certificate number already on record is 422 on body.certNumber and leaves the certificate unchanged and VERIFIED, with no audit row', async () => {
      await inFarmerWorld(async (world) => {
        const { client, service, addCert, auditCodes } = world;
        const admin = await world.makeAdmin(RoleCode.SUPER_ADMIN);
        const mine = await addCert({ certNumber: `PGS/ADMIN-MINE/${newId()}` }, true);
        const taken = await addCert({ certNumber: `PGS/ADMIN-TAKEN/${newId()}` });
        const auditBefore = await auditCodes(mine.id);

        const error = await rejectionOf(service.adminUpdateCertification(admin, mine.id, { certNumber: taken.certNumber }));
        expect(error).toMatchObject(duplicateNumber);
        expect(Object.keys(error['errors'] as object)).toEqual(['body.certNumber']);

        const after = await client.query(
          `SELECT cert_number, verification_status::text FROM certifications WHERE id = $1`,
          [mine.id],
        );
        expect(after.rows[0]).toEqual({ cert_number: mine.certNumber, verification_status: 'VERIFIED' });
        expect(await auditCodes(mine.id)).toEqual(auditBefore);
        expect((await world.farmerRow()).is_market_blocked).toBe(false);
      });
    });

    it("BR-51c (PostgreSQL): an admin delete keeps the row but takes the certificate out of the farmer list, the admin list and detail, listing eligibility and the owner's market block, with one certification.admin_delete row naming the admin", async () => {
      await inFarmerWorld(async (world) => {
        const { client, service, repo, actor, farmerId, addCert, farmerRow, auditCodes } = world;
        const { listingsRepo } = await import('../listings/listings.repo.js');
        const { LISTING_QUALIFYING_CERT_TYPES } = await import('./certifications.schema.js');
        const { getTodayKolkata } = await import('./certifications.service.js');
        const admin = await world.makeAdmin(RoleCode.SUPER_ADMIN);

        const cert = await addCert({ documentUrl: 'https://cdn.tohfa.in/docs/only.pdf' }, true);
        expect((await farmerRow()).is_market_blocked).toBe(false);
        const auditBefore = await auditCodes(cert.id);

        await expect(service.adminDeleteCertification(admin, cert.id)).resolves.toBeUndefined();

        const row = await client.query<{ deleted_at: Date | null; farmer_id: string }>(
          `SELECT deleted_at, farmer_id FROM certifications WHERE id = $1`,
          [cert.id],
        );
        expect(row.rows[0]?.deleted_at).toBeInstanceOf(Date);
        expect(row.rows[0]?.farmer_id).toBe(farmerId);

        const farmerList = (await service.listMyCertifications(actor, { limit: 20 })) as { items: unknown[] };
        expect(farmerList.items).toHaveLength(0);
        expect((await repo.listAllCertifications(client, { limit: 20, farmerId })).items).toHaveLength(0);
        expect(await repo.findByIdAdmin(client, cert.id)).toBeNull();
        expect(
          (await listingsRepo.getListingCertEligibility(client, farmerId, getTodayKolkata(), LISTING_QUALIFYING_CERT_TYPES)).eligible,
        ).toBe(false);
        const farmer = await farmerRow();
        expect(farmer.is_market_blocked).toBe(true);
        expect(farmer.market_block_reason).toContain('No organic certifications');

        expect(await auditCodes(cert.id)).toEqual([...auditBefore, 'certification.admin_delete'].sort());
        const audit = await client.query(
          `SELECT actor_id, actor_role, before->>'verificationStatus' AS before_status, after IS NULL AS no_after
             FROM audit_log
            WHERE entity_type = 'certification' AND entity_id = $1 AND action_code = 'certification.admin_delete'`,
          [cert.id],
        );
        expect(audit.rows).toEqual([
          { actor_id: admin.userId, actor_role: 'SUPER_ADMIN', before_status: 'VERIFIED', no_after: true },
        ]);
      });
    });

    it('BR-51d (PostgreSQL): an unknown id and a soft-deleted certificate are 404 NOT_FOUND for admin PATCH and DELETE and stay unchanged', async () => {
      await inFarmerWorld(async (world) => {
        const { client, service, actor, addCert, auditCodes } = world;
        const admin = await world.makeAdmin(RoleCode.TOHFA_ADMIN);

        await expect(service.adminUpdateCertification(admin, newId(), { certNumber: 'X-1' })).rejects.toMatchObject({
          code: 'NOT_FOUND',
          status: 404,
        });
        await expect(service.adminDeleteCertification(admin, newId())).rejects.toMatchObject({ code: 'NOT_FOUND' });

        const cert = await addCert({ certNumber: `PGS/GONE/${newId()}` });
        await service.deleteMyCertification(actor, cert.id);
        const auditBefore = await auditCodes(cert.id);

        await expect(service.adminUpdateCertification(admin, cert.id, { certNumber: 'X-1' })).rejects.toMatchObject({
          code: 'NOT_FOUND',
        });
        await expect(service.adminDeleteCertification(admin, cert.id)).rejects.toMatchObject({ code: 'NOT_FOUND' });

        const row = await client.query(`SELECT cert_number FROM certifications WHERE id = $1`, [cert.id]);
        expect(row.rows[0]).toEqual({ cert_number: cert.certNumber });
        expect(await auditCodes(cert.id)).toEqual(auditBefore);
      });
    });

    it('BR-02j (PostgreSQL): farmers.market_block_reason names the cause the listing gate gives — pending verification, expired, rejected, OTHER-only or none — whatever else the farmer holds', async () => {
      await inFarmerWorld(async (world) => {
        const { client, repo } = world;
        const { listingsRepo } = await import('../listings/listings.repo.js');
        const { LISTING_QUALIFYING_CERT_TYPES } = await import('./certifications.schema.js');
        const { getTodayKolkata } = await import('./certifications.service.js');
        const today = getTodayKolkata();

        type Seed = { type: 'PGS' | 'NPOP' | 'OTHER'; status: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED'; expiresInDays: number };
        type Gate = 'eligible' | 'CERT_UNVERIFIED' | 'CERT_EXPIRED' | 'CERT_MISSING';
        const scenarios: Array<{
          label: string;
          certs: Seed[];
          gate: Gate;
          reason: keyof typeof MARKET_BLOCK_REASON | null;
          mentions: RegExp | null;
        }> = [
          // The cases the stored reason used to get wrong come first.
          {
            label: 'only an unexpired REJECTED PGS',
            certs: [{ type: 'PGS', status: 'REJECTED', expiresInDays: 200 }],
            gate: 'CERT_MISSING',
            reason: 'REJECTED',
            mentions: /rejected/i,
          },
          {
            label: 'a verified PGS that has expired beside a pending, unexpired NPOP',
            certs: [
              { type: 'PGS', status: 'VERIFIED', expiresInDays: -10 },
              { type: 'NPOP', status: 'UNVERIFIED', expiresInDays: 200 },
            ],
            gate: 'CERT_UNVERIFIED',
            reason: 'PENDING',
            mentions: /pending/i,
          },
          {
            label: 'only an UNVERIFIED PGS that has expired',
            certs: [{ type: 'PGS', status: 'UNVERIFIED', expiresInDays: -10 }],
            gate: 'CERT_EXPIRED',
            reason: 'EXPIRED',
            mentions: /expired/i,
          },
          {
            label: 'an expired REJECTED PGS beside an unexpired REJECTED NPOP',
            certs: [
              { type: 'PGS', status: 'REJECTED', expiresInDays: -10 },
              { type: 'NPOP', status: 'REJECTED', expiresInDays: 200 },
            ],
            gate: 'CERT_EXPIRED',
            reason: 'EXPIRED',
            mentions: /expired/i,
          },
          {
            label: 'an unexpired REJECTED PGS beside a pending, unexpired NPOP',
            certs: [
              { type: 'PGS', status: 'REJECTED', expiresInDays: 200 },
              { type: 'NPOP', status: 'UNVERIFIED', expiresInDays: 100 },
            ],
            gate: 'CERT_UNVERIFIED',
            reason: 'PENDING',
            mentions: /pending/i,
          },
          {
            label: 'a verified PGS that has expired beside a verified, unexpired OTHER',
            certs: [
              { type: 'PGS', status: 'VERIFIED', expiresInDays: -10 },
              { type: 'OTHER', status: 'VERIFIED', expiresInDays: 200 },
            ],
            gate: 'CERT_EXPIRED',
            reason: 'EXPIRED',
            mentions: /expired/i,
          },
          {
            label: 'only a verified, unexpired OTHER',
            certs: [{ type: 'OTHER', status: 'VERIFIED', expiresInDays: 200 }],
            gate: 'CERT_MISSING',
            reason: 'OTHER_ONLY',
            mentions: /OTHER/,
          },
          { label: 'no certificate', certs: [], gate: 'CERT_MISSING', reason: 'NO_CERTIFICATE', mentions: /no organic certifications/i },
          {
            label: 'a verified, unexpired PGS beside an expired NPOP and a rejected one',
            certs: [
              { type: 'PGS', status: 'VERIFIED', expiresInDays: 200 },
              { type: 'NPOP', status: 'VERIFIED', expiresInDays: -10 },
              { type: 'NPOP', status: 'REJECTED', expiresInDays: 100 },
            ],
            gate: 'eligible',
            reason: null,
            mentions: null,
          },
        ];

        for (const s of scenarios) {
          const { userId, farmerId } = await world.makeFarmer();
          for (const c of s.certs) {
            const decided = c.status !== 'UNVERIFIED';
            await client.query(
              `INSERT INTO certifications
                 (farmer_id, cert_type, custom_type_name, cert_number, issuing_body, issued_on, expires_on,
                  verification_status, verified_by, verified_at)
               VALUES ($1, $2, $3, $4, 'Test Issuing Body', $5::date - 400, $5::date + $6::int, $7, $8, $9)`,
              [
                farmerId,
                c.type,
                c.type === 'OTHER' ? 'Jaivik Bharat' : null,
                `${c.type}/REASON/${newId()}`,
                today,
                c.expiresInDays,
                c.status,
                decided ? userId : null,
                decided ? new Date() : null,
              ],
            );
          }

          const result = await repo.recomputeFarmerMarketBlock(client, farmerId, null, 'SYSTEM', 'JOB');
          const eligibility = await listingsRepo.getListingCertEligibility(client, farmerId, today, LISTING_QUALIFYING_CERT_TYPES);
          const gate: Gate = eligibility.eligible
            ? 'eligible'
            : eligibility.pendingCert !== null
              ? 'CERT_UNVERIFIED'
              : eligibility.expiredCert !== null
                ? 'CERT_EXPIRED'
                : 'CERT_MISSING';

          expect(gate, s.label).toBe(s.gate);
          expect(result.isMarketBlocked, s.label).toBe(s.gate !== 'eligible');
          if (s.mentions !== null) expect(result.marketBlockReason, s.label).toMatch(s.mentions);
          const expected = s.reason === null ? null : MARKET_BLOCK_REASON[s.reason];
          expect(result.marketBlockReason, s.label).toBe(expected);
          const stored = await client.query<{ market_block_reason: string | null }>(
            `SELECT market_block_reason FROM farmers WHERE id = $1`,
            [farmerId],
          );
          expect(stored.rows[0]?.market_block_reason, s.label).toBe(expected);
        }
      });
    });

    // ---------------------------------------------------------------------
    // BR-48j against PostgreSQL: uq_certifications_number (cert_type,
    // cert_number) WHERE deleted_at IS NULL spans every farmer.
    // ---------------------------------------------------------------------
    async function rejectionOf(promise: Promise<unknown>): Promise<Record<string, unknown>> {
      try {
        await promise;
      } catch (error) {
        return error as Record<string, unknown>;
      }
      throw new Error('expected the call to be rejected');
    }

    /** The parts of an AppError the client sees (the problem body) or a log line carries. */
    function visibleError(error: Record<string, unknown>) {
      return {
        code: error['code'],
        status: error['status'],
        message: error['message'],
        detail: error['detail'],
        errors: error['errors'],
        meta: error['meta'],
      };
    }

    const duplicateNumber = {
      code: 'VALIDATION_FAILED',
      status: 422,
      errors: { 'body.certNumber': [CERT_NUMBER_UNAVAILABLE] },
    };

    it('BR-48j (PostgreSQL): recording a certType + certNumber the farmer already holds (also padded with spaces) is 422 on body.certNumber and writes nothing; the same number under another certType is not a duplicate', async () => {
      await inFarmerWorld(async ({ client, farmerId, addCert, farmerRow }) => {
        const held = await addCert({ certNumber: `PGS/DUP/${newId()}` }, true);
        const count = async () => {
          const res = await client.query<{ certs: number; docs: number }>(
            `SELECT (SELECT count(*)::int FROM certifications WHERE farmer_id = $1) AS certs,
                    (SELECT count(*)::int FROM farmer_documents WHERE farmer_id = $1) AS docs`,
            [farmerId],
          );
          return res.rows[0]!;
        };
        const before = await count();

        for (const certNumber of [held.certNumber, `  ${held.certNumber} `]) {
          const error = await rejectionOf(addCert({ certNumber, documentUrl: 'https://cdn.tohfa.in/docs/dup.pdf' }));
          expect(error, certNumber).toMatchObject(duplicateNumber);
          expect(Object.keys(error['errors'] as object)).toEqual(['body.certNumber']);
        }

        // Neither the certificate nor the document row it would have recorded.
        expect(await count()).toEqual(before);
        const stored = await client.query(`SELECT verification_status::text FROM certifications WHERE id = $1`, [held.id]);
        expect(stored.rows[0]).toEqual({ verification_status: 'VERIFIED' });
        expect((await farmerRow()).is_market_blocked).toBe(false);

        // The index is (cert_type, cert_number): an NPOP certificate may carry the same number.
        const npop = await addCert({ certType: 'NPOP', certNumber: held.certNumber });
        expect(npop.certNumber).toBe(held.certNumber);
      });
    });

    it("BR-48j (PostgreSQL): a number another farmer holds gets exactly the same 422 as the farmer's own duplicate — nothing in it says who holds it", async () => {
      await inFarmerWorld(async (world) => {
        const { client, service, actor, addCert } = world;
        const held = await addCert({ certNumber: `PGS/HELD/${newId()}` });
        const { userId: otherUserId, farmerId: otherFarmerId } = await world.makeFarmer();
        const otherFarmer = anActor({ userId: otherUserId, roles: [{ code: RoleCode.FARMER }], farmerId: otherFarmerId });

        const input: CertificationCreate = {
          certType: 'PGS',
          certNumber: held.certNumber,
          issuingBody: 'PGS Organic India Council',
          issuedOn: kolkataDayOffset(-30),
          expiresOn: kolkataDayOffset(200),
        };
        const own = await rejectionOf(service.createCertification(actor, input));
        const foreign = await rejectionOf(service.createCertification(otherFarmer, input));

        expect(own).toMatchObject(duplicateNumber);
        expect(visibleError(foreign)).toEqual(visibleError(own));

        const text = JSON.stringify(visibleError(foreign));
        for (const secret of [
          held.certNumber,
          held.id,
          world.farmerId,
          actor.userId,
          `TOHFA-TEST-${world.farmerId.slice(0, 8)}`,
          'Cert Edit/Delete Test Farmer',
          'uq_certifications_number',
          'already exists',
        ]) {
          expect(text, secret).not.toContain(secret);
        }

        const recorded = await client.query(`SELECT 1 FROM certifications WHERE farmer_id = $1`, [otherFarmerId]);
        expect(recorded.rowCount).toBe(0);
      });
    });

    it('BR-48j (PostgreSQL): a PATCH onto a number already on record — by certNumber, or by certType — is 422 on body.certNumber and leaves the certificate unchanged and VERIFIED; keeping its own number is never a conflict', async () => {
      await inFarmerWorld(async (world) => {
        const { client, service, actor, addCert } = world;
        const mine = await addCert({ certNumber: `PGS/MINE/${newId()}` }, true);
        const ownOther = await addCert({ certType: 'NPOP', certNumber: `NPOP/OWN/${newId()}` });

        const { userId: otherUserId, farmerId: otherFarmerId } = await world.makeFarmer();
        const otherFarmer = anActor({ userId: otherUserId, roles: [{ code: RoleCode.FARMER }], farmerId: otherFarmerId });
        const theirs = (await service.createCertification(otherFarmer, {
          certType: 'PGS',
          certNumber: `PGS/THEIRS/${newId()}`,
          issuingBody: 'PGS Organic India Council',
          issuedOn: kolkataDayOffset(-30),
          expiresOn: kolkataDayOffset(200),
        })) as { certNumber: string };
        // Allowed beside mine (another certType), and the target of a certType-only change.
        await service.createCertification(otherFarmer, {
          certType: 'NPOP',
          certNumber: mine.certNumber,
          issuingBody: 'Indian Organic Certification Agency',
          issuedOn: kolkataDayOffset(-30),
          expiresOn: kolkataDayOffset(200),
        });

        const auditBefore = await world.auditCodes(mine.id);
        const patches: Array<[string, CertificationUpdate]> = [
          ["onto the farmer's own other certificate", { certType: 'NPOP', certNumber: ownOther.certNumber }],
          ["onto another farmer's number", { certNumber: theirs.certNumber }],
          ['by changing only certType', { certType: 'NPOP' }],
        ];
        const errors: Array<ReturnType<typeof visibleError>> = [];
        for (const [label, patch] of patches) {
          const error = await rejectionOf(service.updateMyCertification(actor, mine.id, patch));
          expect(error, label).toMatchObject(duplicateNumber);
          errors.push(visibleError(error));
        }
        expect(errors[1]).toEqual(errors[0]);
        expect(errors[2]).toEqual(errors[0]);

        const after = await client.query(
          `SELECT cert_type::text, cert_number, verification_status::text FROM certifications WHERE id = $1`,
          [mine.id],
        );
        expect(after.rows[0]).toEqual({ cert_type: 'PGS', cert_number: mine.certNumber, verification_status: 'VERIFIED' });
        // None of the refused PATCHes left an audit row.
        expect(await world.auditCodes(mine.id)).toEqual(auditBefore);
        expect((await world.farmerRow()).is_market_blocked).toBe(false);

        // Its own current number, sent back with a real change, is not a duplicate.
        const edited = (await service.updateMyCertification(actor, mine.id, {
          certNumber: mine.certNumber,
          issuingBody: 'PGS Regional Council, Ooty',
        })) as { certNumber: string; issuingBody: string; verificationStatus: string };
        expect(edited).toMatchObject({
          certNumber: mine.certNumber,
          issuingBody: 'PGS Regional Council, Ooty',
          verificationStatus: 'UNVERIFIED',
        });
      });
    });

    it('BR-48j (PostgreSQL): a number freed by a soft delete is not a duplicate — another farmer may record it, and a PATCH may move onto it', async () => {
      await inFarmerWorld(async (world) => {
        const { service, actor, addCert } = world;
        const freed = await addCert({ certNumber: `PGS/FREED/${newId()}` });
        await service.deleteMyCertification(actor, freed.id);

        const { userId: otherUserId, farmerId: otherFarmerId } = await world.makeFarmer();
        const otherFarmer = anActor({ userId: otherUserId, roles: [{ code: RoleCode.FARMER }], farmerId: otherFarmerId });
        const recorded = (await service.createCertification(otherFarmer, {
          certType: 'PGS',
          certNumber: freed.certNumber,
          issuingBody: 'PGS Organic India Council',
          issuedOn: kolkataDayOffset(-30),
          expiresOn: kolkataDayOffset(200),
        })) as { certNumber: string };
        expect(recorded.certNumber).toBe(freed.certNumber);

        const second = await addCert({ certNumber: `PGS/SECOND/${newId()}` });
        await service.deleteMyCertification(actor, second.id);
        const third = await addCert({ certNumber: `PGS/THIRD/${newId()}` });
        const moved = (await service.updateMyCertification(actor, third.id, { certNumber: second.certNumber })) as {
          certNumber: string;
        };
        expect(moved.certNumber).toBe(second.certNumber);
      });
    });

    /**
     * The users behind withCommittedFarmers. They are FIXED rows, created on
     * first use and reused by every run, never deleted: once one of them has
     * recorded a certificate, the append-only audit_log (BR-35a) holds a row
     * naming it as actor, so its users row can no longer be removed. Fresh
     * users per run would pile up in the test database; these stay at four.
     */
    const COMMITTED_FARMER_USERS = [
      { id: 'c0de0000-0000-4000-8000-0000000c5e01', mobile: '+919300005101' },
      { id: 'c0de0000-0000-4000-8000-0000000c5e02', mobile: '+919300005102' },
      { id: 'c0de0000-0000-4000-8000-0000000c5e03', mobile: '+919300005103' },
    ] as const;
    const COMMITTED_ADMIN_USER = { id: 'c0de0000-0000-4000-8000-0000000c5ea1', mobile: '+919300005191' } as const;
    /** pg_advisory_lock key: one run at a time may use the fixed users above. */
    const COMMITTED_FIXTURE_LOCK = 4_805_100_051;

    /**
     * Committed farmers for the scenarios that need more than one connection
     * (a race) or the real HTTP stack (which runs its own withTransaction).
     * Each run gets new farmers on the fixed users above (and the fixed admin,
     * for admin requests); the farmers, their certificates and documents are
     * deleted afterwards. A session advisory lock serialises concurrent runs of
     * this file (another process running the suite), which would otherwise
     * share the fixed users; it also clears whatever a crashed run left behind.
     */
    async function withCommittedFarmers(
      count: number,
      fn: (
        farmers: Array<{ userId: string; farmerId: string; actor: ReturnType<typeof anActor> }>,
        adminUserId: string,
      ) => Promise<void>,
    ): Promise<void> {
      if (!(await databaseReady('certifications'))) return;
      if (count > COMMITTED_FARMER_USERS.length) throw new Error(`at most ${COMMITTED_FARMER_USERS.length} committed farmers`);
      const { pool } = await import('../../db/pool.js');

      const users = COMMITTED_FARMER_USERS.slice(0, count);
      const userIds = COMMITTED_FARMER_USERS.map((u) => u.id);
      const farmers = users.map(({ id: userId }) => {
        const farmerId = newId();
        return { userId, farmerId, actor: anActor({ userId, roles: [{ code: RoleCode.FARMER }], farmerId }) };
      });

      // Everything recorded for farmers of the fixed users — this run's, or a
      // crashed run's — goes; the users stay.
      const clearFarmers = async (db: Executor) => {
        const owned = `SELECT id FROM farmers WHERE user_id = ANY($1::uuid[])`;
        await db.query(`DELETE FROM certifications WHERE farmer_id IN (${owned})`, [userIds]);
        await db.query(`DELETE FROM farmer_documents WHERE farmer_id IN (${owned})`, [userIds]);
        await db.query(`DELETE FROM farmers WHERE user_id = ANY($1::uuid[])`, [userIds]);
      };

      const lock = await pool.connect();
      try {
        await lock.query('SELECT pg_advisory_lock($1)', [COMMITTED_FIXTURE_LOCK]);
        try {
          await clearFarmers(lock);
          for (const u of COMMITTED_FARMER_USERS) {
            await lock.query(
              `INSERT INTO users (id, mobile, full_name, user_type, status)
               VALUES ($1, $2, 'Cert Committed Test Farmer', 'FARMER', 'ACTIVE')
               ON CONFLICT DO NOTHING`,
              [u.id, u.mobile],
            );
          }
          await lock.query(
            `INSERT INTO users (id, mobile, full_name, user_type, status)
             VALUES ($1, $2, 'Cert Committed Test Admin', 'ADMIN', 'ACTIVE')
             ON CONFLICT DO NOTHING`,
            [COMMITTED_ADMIN_USER.id, COMMITTED_ADMIN_USER.mobile],
          );
          for (const { userId, farmerId } of farmers) {
            await lock.query(`INSERT INTO farmers (id, user_id, tohfa_farmer_id) VALUES ($1, $2, $3)`, [
              farmerId,
              userId,
              `TOHFA-TEST-${farmerId.slice(0, 8)}`,
            ]);
          }
          await fn(farmers, COMMITTED_ADMIN_USER.id);
        } finally {
          await clearFarmers(lock);
          await lock.query('SELECT pg_advisory_unlock($1)', [COMMITTED_FIXTURE_LOCK]);
        }
      } finally {
        lock.release();
      }
    }

    it('BR-48j (PostgreSQL): two concurrent POSTs of one number on separate connections — the first commits, the second gets the 422 from the unique index, never a 500', async () => {
      await withCommittedFarmers(2, async ([a, b]) => {
        const { pool } = await import('../../db/pool.js');
        const { certificationsRepo } = await import('./certifications.repo.js');
        const firstClient = await pool.connect();
        const secondClient = await pool.connect();

        let signalInserted!: () => void;
        const inserted = new Promise<void>((resolve) => (signalInserted = resolve));
        let releaseCommit!: () => void;
        const commitGate = new Promise<void>((resolve) => (releaseCommit = resolve));

        // The first transaction inserts, then holds its COMMIT until the second
        // INSERT is waiting on its uncommitted index entry — the window no
        // read-before-write check can close.
        const first = createCertificationsService(certificationsRepo, async (fn) => {
          await firstClient.query('BEGIN');
          try {
            const result = await fn(firstClient);
            signalInserted();
            await commitGate;
            await firstClient.query('COMMIT');
            return result;
          } catch (error) {
            await firstClient.query('ROLLBACK');
            throw error;
          }
        });
        const second = createCertificationsService(certificationsRepo, async (fn) => {
          await secondClient.query('BEGIN');
          try {
            const result = await fn(secondClient);
            await secondClient.query('COMMIT');
            return result;
          } catch (error) {
            await secondClient.query('ROLLBACK');
            throw error;
          }
        });

        const input: CertificationCreate = {
          certType: 'PGS',
          certNumber: `PGS/RACE/${newId()}`,
          issuingBody: 'PGS Organic India Council',
          issuedOn: kolkataDayOffset(-30),
          expiresOn: kolkataDayOffset(200),
        };

        type Outcome = { created?: unknown; error?: Record<string, unknown> };
        const settle = (promise: Promise<unknown>): Promise<Outcome> =>
          promise.then(
            (created) => ({ created }),
            (error: unknown) => ({ error: error as Record<string, unknown> }),
          );

        const firstOutcome = settle(first.createCertification(a!.actor, input));
        let secondOutcome: Promise<Outcome> = Promise.resolve({});
        let firstSettled: Outcome;
        let secondSettled: Outcome;
        try {
          await Promise.race([inserted, firstOutcome]);
          const pid = (await secondClient.query<{ pid: number }>('SELECT pg_backend_pid() AS pid')).rows[0]!.pid;
          secondOutcome = settle(second.createCertification(b!.actor, input));

          const deadline = Date.now() + 5_000;
          for (;;) {
            const waiting = await pool.query<{ n: number }>(
              `SELECT count(*)::int AS n FROM pg_locks WHERE pid = $1 AND NOT granted`,
              [pid],
            );
            if (waiting.rows[0]!.n > 0) break;
            if (Date.now() > deadline) throw new Error('the second INSERT never waited on the first transaction');
            await new Promise((resolve) => setTimeout(resolve, 20));
          }
        } finally {
          // Whatever happened above, let both transactions finish and hand the
          // connections back, so a failure here cannot starve later tests.
          releaseCommit();
          firstSettled = await firstOutcome;
          secondSettled = await secondOutcome;
          firstClient.release();
          secondClient.release();
        }

        expect(firstSettled.error).toBeUndefined();
        expect(firstSettled.created).toMatchObject({ certNumber: input.certNumber });
        expect(secondSettled.created).toBeUndefined();
        expect(secondSettled.error).toMatchObject(duplicateNumber);

        const live = await pool.query<{ farmer_id: string }>(
          `SELECT farmer_id FROM certifications WHERE cert_type = 'PGS' AND cert_number = $1 AND deleted_at IS NULL`,
          [input.certNumber],
        );
        expect(live.rows).toEqual([{ farmer_id: a!.farmerId }]);
      });
    });

    it('BR-48j (PostgreSQL): over HTTP a duplicate number is 422 problem+json on body.certNumber, not 500 — the same body for the holder and for another farmer', async () => {
      await withCommittedFarmers(2, async ([holder, other]) => {
        const tokenFor = (f: { userId: string; farmerId: string }) =>
          signAccessToken({ sub: f.userId, roles: [{ code: 'FARMER' }], farmerId: f.farmerId, customerId: null });
        const body = {
          certType: 'NPOP',
          certNumber: `NPOP/HTTP/${newId()}`,
          issuingBody: 'Indian Organic Certification Agency',
          issuedOn: kolkataDayOffset(-30),
          expiresOn: kolkataDayOffset(200),
        };
        const post = (f: { userId: string; farmerId: string }) =>
          request(app).post('/v1/farmers/me/certifications').set('Authorization', `Bearer ${tokenFor(f)}`).send(body);

        expect((await post(holder!)).status).toBe(201);

        const again = await post(holder!);
        const foreign = await post(other!);
        for (const res of [again, foreign]) {
          expect(res.status).toBe(422);
          expect(res.headers['content-type']).toContain('application/problem+json');
          expect(res.body).toMatchObject({ code: 'VALIDATION_FAILED', errors: { 'body.certNumber': [CERT_NUMBER_UNAVAILABLE] } });
        }
        const withoutTrace = ({ traceId: _traceId, ...rest }: Record<string, unknown>) => rest;
        expect(withoutTrace(foreign.body)).toEqual(withoutTrace(again.body));
        expect(JSON.stringify(foreign.body)).not.toContain(body.certNumber);
      });
    });

    it("BR-51 (PostgreSQL): over HTTP a TOHFA_ADMIN token edits a farmer's verified certificate (200, UNVERIFIED, owner re-blocked) and a SUPER_ADMIN token deletes it (204); afterwards both are 404 and the farmer's own list is empty", async () => {
      await withCommittedFarmers(1, async ([owner], adminUserId) => {
        const { pool } = await import('../../db/pool.js');
        const { certificationsRepo } = await import('./certifications.repo.js');
        const adminToken = (role: RoleCode) =>
          signAccessToken({ sub: adminUserId, roles: [{ code: role }], farmerId: null, customerId: null });
        const farmerToken = signAccessToken({
          sub: owner!.userId,
          roles: [{ code: 'FARMER' }],
          farmerId: owner!.farmerId,
          customerId: null,
        });

        const inserted = await pool.query<{ id: string }>(
          `INSERT INTO certifications
             (farmer_id, cert_type, cert_number, issuing_body, issued_on, expires_on,
              verification_status, verified_by, verified_at)
           VALUES ($1, 'PGS', $2, 'PGS Organic India Council', $3, $4, 'VERIFIED', $5, now())
           RETURNING id`,
          [owner!.farmerId, `PGS/HTTP-ADMIN/${newId()}`, kolkataDayOffset(-100), kolkataDayOffset(300), adminUserId],
        );
        const certId = inserted.rows[0]!.id;
        await certificationsRepo.recomputeFarmerMarketBlock(pool, owner!.farmerId, null, 'SYSTEM', 'JOB');
        const blocked = async () =>
          (await pool.query<{ b: boolean }>(`SELECT is_market_blocked AS b FROM farmers WHERE id = $1`, [owner!.farmerId]))
            .rows[0]!.b;
        expect(await blocked()).toBe(false);

        const patched = await request(app)
          .patch(`/v1/admin/certifications/${certId}`)
          .set('Authorization', `Bearer ${adminToken(RoleCode.TOHFA_ADMIN)}`)
          .send({ issuingBody: 'PGS Regional Council, Ooty', farmerId: newId() });
        expect(patched.status).toBe(200);
        expect(patched.body).toMatchObject({
          id: certId,
          farmerId: owner!.farmerId,
          issuingBody: 'PGS Regional Council, Ooty',
          verificationStatus: 'UNVERIFIED',
          verifiedBy: null,
        });
        expect(await blocked()).toBe(true);

        const deleted = await request(app)
          .delete(`/v1/admin/certifications/${certId}`)
          .set('Authorization', `Bearer ${adminToken(RoleCode.SUPER_ADMIN)}`);
        expect(deleted.status).toBe(204);

        const again = await request(app)
          .patch(`/v1/admin/certifications/${certId}`)
          .set('Authorization', `Bearer ${adminToken(RoleCode.SUPER_ADMIN)}`)
          .send({ issuingBody: 'Another Council' });
        expect(again.status).toBe(404);
        expect(
          (await request(app).delete(`/v1/admin/certifications/${certId}`).set('Authorization', `Bearer ${adminToken(RoleCode.TOHFA_ADMIN)}`))
            .status,
        ).toBe(404);

        const ownList = await request(app).get('/v1/farmers/me/certifications').set('Authorization', `Bearer ${farmerToken}`);
        expect(ownList.status).toBe(200);
        expect(ownList.body.items).toEqual([]);

        const audit = await pool.query<{ action_code: string; actor_id: string }>(
          `SELECT action_code, actor_id FROM audit_log WHERE entity_type = 'certification' AND entity_id = $1`,
          [certId],
        );
        expect(audit.rows.map((r) => r.action_code).sort()).toEqual(['certification.admin_delete', 'certification.admin_update']);
        expect(audit.rows.every((r) => r.actor_id === adminUserId)).toBe(true);
      });
    });
  });
});
