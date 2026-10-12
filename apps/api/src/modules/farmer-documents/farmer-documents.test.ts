import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { RoleCode } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool, type Executor } from '../../db/pool.js';
import { InMemoryBlobStorage } from '../../storage/blobStorage.js';
import { anActor, aRole, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import type {
  ApplicationUploadRecord,
  CertificationRecord,
  FarmerApplicationRecord,
  FarmerDocumentRecord,
  FarmerDocumentsRepo,
  FarmerRecord,
} from './farmer-documents.repo.js';
import { farmerDocumentItemSchema, farmerProfileDocumentsResponseSchema } from './farmer-documents.schema.js';
import { createFarmerDocumentsService } from './farmer-documents.service.js';

const BASE_URL = 'http://localhost:3000';
const FARMER_ID = '33333333-3333-4000-8000-333333333333';
const USER_ID = IDS.userFarmer;
const APP_ID = '44444444-4444-4000-8000-444444444444';

const dummyDb: Executor = { query: async () => ({ rows: [], rowCount: 0 }) as never };

function aFarmerActor(userId: string = USER_ID) {
  return anActor({ userId, roles: [aRole(RoleCode.FARMER)], farmerId: FARMER_ID });
}

function publicUrl(key: string): string {
  return `${BASE_URL}/storage/${key}`;
}

function anUpload(storageKey: string): ApplicationUploadRecord {
  return { storageKey, createdAt: new Date('2026-01-02T00:00:00Z') };
}

function aStep4Doc(docType: string, key: string, extra: Record<string, unknown> = {}) {
  return { docType, fileUrl: publicUrl(key), ...extra };
}

function aDocRow(overrides: Partial<FarmerDocumentRecord> = {}): FarmerDocumentRecord {
  return {
    id: newId(),
    docType: 'ID_PROOF',
    storageKey: 'secure_docs/row.pdf',
    verificationStatus: 'UNVERIFIED',
    verifiedAt: null,
    createdAt: new Date('2026-01-03T00:00:00Z'),
    ...overrides,
  };
}

function aCert(overrides: Partial<CertificationRecord> = {}): CertificationRecord {
  return {
    id: newId(),
    certType: 'PGS',
    customTypeName: null,
    verificationStatus: 'UNVERIFIED',
    verifiedAt: null,
    documentStorageKey: null,
    documentUploadedAt: null,
    ...overrides,
  };
}

interface FakeData {
  farmer?: FarmerRecord | null;
  application?: Partial<FarmerApplicationRecord> | null;
  uploads?: ApplicationUploadRecord[];
  documents?: FarmerDocumentRecord[];
  certifications?: CertificationRecord[];
}

function fakeRepo(data: FakeData = {}): FarmerDocumentsRepo {
  const application =
    data.application === null
      ? null
      : { id: APP_ID, step1Personal: null, step4Documents: null, ...data.application };
  return {
    findFarmerByUserId: async () =>
      data.farmer === undefined ? { id: FARMER_ID, aadhaarLast4: '4821' } : data.farmer,
    findLatestApplicationByFarmerIdOrUserId: async () => application,
    findApplicationUploads: async () => data.uploads ?? [],
    findFarmerDocuments: async () => data.documents ?? [],
    findCertifications: async () => data.certifications ?? [],
  };
}

async function run(data: FakeData) {
  const storage = new InMemoryBlobStorage(BASE_URL);
  const service = createFarmerDocumentsService({ repo: fakeRepo(data), db: dummyDb, storage });
  return service.getMyDocuments(aFarmerActor());
}

function slot(res: Awaited<ReturnType<typeof run>>, docType: string) {
  return res.documents.find((d) => d.docType === docType);
}

describe('Farmer Profile Documents (BR-54 unit tests)', () => {
  it('BR-54a: returns the four standard slots with docType, displayName, uploadStatus and a signed readUrl', async () => {
    const res = await run({
      application: {
        step4Documents: {
          documents: [
            aStep4Doc('ID_PROOF', 'applications/aadhaar.pdf', { fileName: 'my-aadhaar.pdf', docSubType: 'Aadhaar Card' }),
            aStep4Doc('FARM_DOC', 'applications/patta.pdf', { docSubType: 'Patta' }),
          ],
        },
      },
      uploads: [anUpload('applications/aadhaar.pdf'), anUpload('applications/patta.pdf')],
      certifications: [
        aCert({
          customTypeName: null,
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date('2026-02-01T00:00:00Z'),
          documentStorageKey: 'certs/pgs.pdf',
          documentUploadedAt: new Date('2026-01-20T00:00:00Z'),
        }),
      ],
    });

    expect(res.documents.map((d) => d.docType)).toEqual(['ID_PROOF', 'LAND_PATTA', 'CERTIFICATE', 'SOIL_CARD']);
    expect(farmerProfileDocumentsResponseSchema.safeParse(res).success).toBe(true);

    const aadhaar = slot(res, 'ID_PROOF');
    expect(aadhaar?.displayName).toBe('Aadhaar Card');
    expect(aadhaar?.uploadStatus).toBe('UPLOADED');
    expect(aadhaar?.readUrl).toContain('/storage/applications/aadhaar.pdf?expires=');
    expect(aadhaar?.fileName).toBe('my-aadhaar.pdf');
    expect(aadhaar?.docSubType).toBe('Aadhaar Card');

    const patta = slot(res, 'LAND_PATTA');
    expect(patta?.displayName).toBe('Land Patta / FMB Map');
    expect(patta?.uploadStatus).toBe('UPLOADED');
    expect(patta?.readUrl).toContain('/storage/applications/patta.pdf?expires=');

    const cert = slot(res, 'CERTIFICATE');
    expect(cert?.displayName).toBe('PGS Scope Certificate');
    expect(cert?.uploadStatus).toBe('VERIFIED');
    expect(cert?.readUrl).toContain('/storage/certs/pgs.pdf?expires=');
    expect(cert?.fileName).toBe('pgs.pdf');
    expect(cert?.docSubType).toBe('PGS');
    expect(cert?.verifiedAt).toBe('2026-02-01T00:00:00.000Z');

    const soil = slot(res, 'SOIL_CARD');
    expect(soil?.displayName).toBe('Annual Soil & Water Health Card');
    expect(soil?.uploadStatus).toBe('ACTION_NEEDED');
    expect(soil?.readUrl).toBeNull();
  });

  it('BR-54b: documentNumberLast4 is the last 4 digits only; a full Aadhaar number never reaches the response', async () => {
    const res = await run({
      farmer: { id: FARMER_ID, aadhaarLast4: '4821' },
      application: { step1Personal: { aadhaarNumber: '123456784821', aadhaar: '123456784821' } },
    });

    expect(slot(res, 'ID_PROOF')?.documentNumberLast4).toBe('4821');
    const json = JSON.stringify(res);
    expect(json).not.toContain('123456784821');
    expect(json).not.toContain('12345678');
    expect(farmerDocumentItemSchema.safeParse({ ...res.documents[0], documentNumberLast4: '123456784821' }).success).toBe(
      false,
    );
  });

  it('BR-54b: with no profile value, the application aadhaarLast4 is used and a legacy full number is ignored', async () => {
    const res = await run({
      farmer: { id: FARMER_ID, aadhaarLast4: null },
      application: { step1Personal: { aadhaarLast4: '9012', aadhaarNumber: '123456781111' } },
    });
    expect(slot(res, 'ID_PROOF')?.documentNumberLast4).toBe('9012');

    const legacyOnly = await run({
      farmer: { id: FARMER_ID, aadhaarLast4: null },
      application: { step1Personal: { aadhaarNumber: '123456781111' } },
    });
    expect(slot(legacyOnly, 'ID_PROOF')?.documentNumberLast4).toBeNull();
    expect(JSON.stringify(legacyOnly)).not.toContain('123456781111');
  });

  it('BR-54c: a stored document is returned as a time-limited signed read URL, never as its stored URL', async () => {
    const res = await run({
      documents: [aDocRow({ docType: 'ID_PROOF', storageKey: 'secure_docs/aadhaar.pdf' })],
    });
    expect(slot(res, 'ID_PROOF')?.readUrl).toMatch(
      /^http:\/\/localhost:3000\/storage\/secure_docs\/aadhaar\.pdf\?expires=/,
    );
  });

  it('BR-54d: a user with no farmer profile gets 404 NOT_FOUND', async () => {
    const service = createFarmerDocumentsService({ repo: fakeRepo({ farmer: null }), db: dummyDb });
    await expect(service.getMyDocuments(aFarmerActor())).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
  });

  it('BR-54f: patta and Aadhaar are never VERIFIED from application status or kyc status alone', async () => {
    const res = await run({
      application: {
        step4Documents: {
          documents: [aStep4Doc('ID_PROOF', 'applications/a.pdf'), aStep4Doc('FARM_DOC', 'applications/p.pdf')],
        },
      },
      uploads: [anUpload('applications/a.pdf'), anUpload('applications/p.pdf')],
    });
    expect(slot(res, 'ID_PROOF')?.uploadStatus).toBe('UPLOADED');
    expect(slot(res, 'LAND_PATTA')?.uploadStatus).toBe('UPLOADED');
    expect(slot(res, 'ID_PROOF')?.verifiedAt).toBeNull();
  });

  it('BR-54f: a document is VERIFIED only when its own farmer_documents row is VERIFIED', async () => {
    const verifiedAt = new Date('2026-03-01T00:00:00Z');
    const res = await run({
      documents: [
        aDocRow({ docType: 'ID_PROOF', storageKey: 'kyc/id.pdf', verificationStatus: 'VERIFIED', verifiedAt }),
        aDocRow({ docType: 'FARM_DOC', storageKey: 'kyc/farm.pdf', verificationStatus: 'UNVERIFIED' }),
      ],
    });
    expect(slot(res, 'ID_PROOF')?.uploadStatus).toBe('VERIFIED');
    expect(slot(res, 'ID_PROOF')?.verifiedAt).toBe(verifiedAt.toISOString());
    expect(slot(res, 'LAND_PATTA')?.uploadStatus).toBe('UPLOADED');
  });

  it('BR-54f: a verified certificate with no uploaded document is PENDING, not VERIFIED', async () => {
    const res = await run({
      certifications: [aCert({ verificationStatus: 'VERIFIED', verifiedAt: new Date('2026-02-01T00:00:00Z') })],
    });
    const cert = slot(res, 'CERTIFICATE');
    expect(cert?.uploadStatus).toBe('PENDING');
    expect(cert?.readUrl).toBeNull();
    expect(cert?.verifiedAt).toBeNull();
  });

  it('BR-54f: file names are real stored values or null, never invented placeholders', async () => {
    const res = await run({
      documents: [aDocRow({ docType: 'ID_PROOF', storageKey: 'kyc/9f1c.pdf' })],
      certifications: [aCert({ documentStorageKey: 'certs/c-77.pdf', documentUploadedAt: new Date() })],
    });
    expect(slot(res, 'ID_PROOF')?.fileName).toBe('9f1c.pdf');
    expect(slot(res, 'CERTIFICATE')?.fileName).toBe('c-77.pdf');
    expect(slot(res, 'LAND_PATTA')?.fileName).toBeNull();
    expect(slot(res, 'SOIL_CARD')?.fileName).toBeNull();
    const json = JSON.stringify(res);
    for (const invented of ['aadhaar.pdf', 'land_patta.pdf', 'soil_card.pdf', 'certificate.pdf']) {
      expect(json).not.toContain(invented);
    }
  });

  it('BR-54f: a farm document row is not assumed to be a soil card because of its storage key', async () => {
    const res = await run({
      documents: [aDocRow({ docType: 'FARM_DOC', storageKey: 'kyc/soil-sample.pdf' })],
    });
    expect(slot(res, 'SOIL_CARD')?.uploadStatus).toBe('ACTION_NEEDED');
    expect(slot(res, 'SOIL_CARD')?.readUrl).toBeNull();
    expect(slot(res, 'LAND_PATTA')?.readUrl).toContain('/storage/kyc/soil-sample.pdf?expires=');
  });

  it("BR-54g: another farmer's storage key planted in step4Documents is never signed", async () => {
    const res = await run({
      application: {
        step4Documents: {
          documents: [
            aStep4Doc('ID_PROOF', 'applications/other-farmers-aadhaar.pdf'),
            aStep4Doc('FARM_DOC', 'applications/mine.pdf'),
          ],
        },
      },
      uploads: [anUpload('applications/mine.pdf')],
    });
    expect(slot(res, 'ID_PROOF')?.readUrl).toBeNull();
    expect(slot(res, 'ID_PROOF')?.uploadStatus).toBe('PENDING');
    expect(slot(res, 'LAND_PATTA')?.readUrl).toContain('/storage/applications/mine.pdf?expires=');
    expect(JSON.stringify(res)).not.toContain('other-farmers-aadhaar');
  });

  it('BR-54g: an arbitrary external URL or a /storage/ path on another host is returned as null, never echoed', async () => {
    const res = await run({
      application: {
        step4Documents: {
          documents: [
            { docType: 'ID_PROOF', fileUrl: 'https://evil.example/steal.pdf' },
            { docType: 'FARM_DOC', fileUrl: 'https://evil.example/storage/applications/mine.pdf' },
          ],
        },
      },
      uploads: [anUpload('applications/mine.pdf')],
    });
    expect(slot(res, 'ID_PROOF')?.readUrl).toBeNull();
    expect(slot(res, 'LAND_PATTA')?.readUrl).toBeNull();
    expect(JSON.stringify(res)).not.toContain('evil.example');
  });

  it('BR-54g: a query string on the stored URL does not defeat the match, and the signed key is the stored one', async () => {
    const res = await run({
      application: {
        step4Documents: {
          documents: [{ docType: 'ID_PROOF', fileUrl: `${publicUrl('applications/a.pdf')}?sv=old-token` }],
        },
      },
      uploads: [anUpload('applications/a.pdf')],
    });
    const url = slot(res, 'ID_PROOF')?.readUrl ?? '';
    expect(url).toContain('/storage/applications/a.pdf?expires=');
    expect(url).not.toContain('old-token');
  });

  it('BR-54g: malformed step4Documents is tolerated and yields no documents beyond the standard slots', async () => {
    const res = await run({
      application: { step4Documents: { documents: [null, 7, { docType: 3 }, { fileUrl: 'x' }] } },
    });
    expect(res.documents).toHaveLength(4);
    expect(res.documents.every((d) => d.readUrl === null)).toBe(true);
  });

  it('BR-54f: further recognised application uploads are listed as UPLOADED, never VERIFIED', async () => {
    const res = await run({
      application: {
        step4Documents: {
          documents: [
            aStep4Doc('FARM_DOC', 'applications/patta.pdf', { docSubType: 'Patta' }),
            aStep4Doc('FARM_DOC', 'applications/chitta.pdf', { docSubType: 'Chitta' }),
          ],
        },
      },
      uploads: [anUpload('applications/patta.pdf'), anUpload('applications/chitta.pdf')],
    });
    expect(res.documents).toHaveLength(5);
    const extra = res.documents[4];
    expect(extra?.docType).toBe('FARM_DOC');
    expect(extra?.displayName).toBe('Chitta');
    expect(extra?.uploadStatus).toBe('UPLOADED');
    expect(extra?.readUrl).toContain('/storage/applications/chitta.pdf?expires=');
  });
});

describe('Farmer Profile Documents HTTP (BR-54e)', () => {
  const app = createApp();

  it('BR-54e: a customer token gets 403 FORBIDDEN from GET /v1/farmers/me/documents', async () => {
    const token = signAccessToken({
      sub: IDS.userSuperAdmin,
      roles: [{ code: 'CUSTOMER' }],
      farmerId: null,
      customerId: IDS.customer,
    });
    const res = await request(app).get('/v1/farmers/me/documents').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('BR-54e: an admin token gets 403 FORBIDDEN, and no token gets 401', async () => {
    const token = signAccessToken({
      sub: IDS.userSuperAdmin,
      roles: [{ code: 'SUPER_ADMIN' }],
      farmerId: null,
      customerId: null,
    });
    const admin = await request(app).get('/v1/farmers/me/documents').set('Authorization', `Bearer ${token}`);
    expect(admin.status).toBe(403);
    const anonymous = await request(app).get('/v1/farmers/me/documents');
    expect(anonymous.status).toBe(401);
  });
});

describeIfDatabase('Farmer Profile Documents integration (PostgreSQL)', () => {
  afterAll(async () => {
    const { closePool } = await import('../../db/pool.js');
    await closePool();
  });

  interface Seeded {
    userId: string;
    farmerId: string;
    applicationId: string;
  }

  async function seedFarmer(db: Executor, tag: string, step4Keys: string[]): Promise<Seeded> {
    const userId = newId();
    const farmerId = newId();
    const applicationId = newId();
    const mobile = `+9198${Math.floor(10000000 + Math.random() * 89999999)}`;
    await db.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, $3, 'FARMER', 'ACTIVE')`,
      [userId, mobile, `Docs Test ${tag}`],
    );
    await db.query(
      `INSERT INTO farmers (id, user_id, tohfa_farmer_id, aadhaar_last4) VALUES ($1, $2, $3, '4821')`,
      [farmerId, userId, `TOHFA-DOC-${farmerId.slice(0, 8)}`],
    );
    const documents = step4Keys.map((key, index) => ({
      docType: index === 0 ? 'ID_PROOF' : 'FARM_DOC',
      fileUrl: `${BASE_URL}/storage/${key}`,
      fileName: `${tag}-${index}.pdf`,
      docSubType: index === 0 ? 'Aadhaar Card' : 'Patta',
    }));
    await db.query(
      `INSERT INTO farmer_applications (id, mobile, full_name, status, is_draft, user_id, farmer_id, step4_documents)
       VALUES ($1, $2, $3, 'APPROVED', false, $4, $5, $6::jsonb)`,
      [applicationId, mobile, `Docs Test ${tag}`, userId, farmerId, JSON.stringify({ documents })],
    );
    for (const key of step4Keys) {
      await db.query(
        `INSERT INTO uploads (storage_key, bucket, mime_type, size_bytes, entity_type, entity_id)
         VALUES ($1, 'test', 'application/pdf', 1024, 'farmer_application', $2)`,
        [key, applicationId],
      );
    }
    return { userId, farmerId, applicationId };
  }

  async function seedVerifiedCertificate(db: Executor, farmer: Seeded, key: string, adminUserId: string) {
    const doc = await db.query<{ id: string }>(
      `INSERT INTO farmer_documents (farmer_id, doc_type, storage_key, mime_type)
       VALUES ($1, 'CERTIFICATE', $2, 'application/pdf') RETURNING id`,
      [farmer.farmerId, key],
    );
    await db.query(
      `INSERT INTO certifications
         (farmer_id, cert_type, cert_number, issuing_body, issued_on, expires_on, document_id,
          verification_status, verified_by, verified_at)
       VALUES ($1, 'PGS', $2, 'PGS Organic India Council', '2026-01-01', '2027-01-01', $3, 'VERIFIED', $4, now())`,
      [farmer.farmerId, `PGS/${newId()}`, doc.rows[0]?.id, adminUserId],
    );
  }

  async function withTx<T>(fn: (client: Executor) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      return await fn(client);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  }

  function serviceOn(db: Executor) {
    return createFarmerDocumentsService({ db, storage: new InMemoryBlobStorage(BASE_URL) });
  }

  it('BR-54a: the real queries run against the real schema and return the farmer’s own documents', async () => {
    await withTx(async (db) => {
      const a = await seedFarmer(db, 'a', [`applications/${newId()}.pdf`, `applications/${newId()}.pdf`]);
      const certKey = `certificate/${newId()}.pdf`;
      await seedVerifiedCertificate(db, a, certKey, a.userId);

      const res = await serviceOn(db).getMyDocuments(anActor({ userId: a.userId, farmerId: a.farmerId, roles: [aRole(RoleCode.FARMER)] }));

      expect(farmerProfileDocumentsResponseSchema.safeParse(res).success).toBe(true);
      expect(res.documents.map((d) => d.docType)).toEqual(['ID_PROOF', 'LAND_PATTA', 'CERTIFICATE', 'SOIL_CARD']);
      expect(slot(res, 'ID_PROOF')?.uploadStatus).toBe('UPLOADED');
      expect(slot(res, 'ID_PROOF')?.documentNumberLast4).toBe('4821');
      expect(slot(res, 'ID_PROOF')?.readUrl).toContain('/storage/applications/');
      expect(slot(res, 'LAND_PATTA')?.readUrl).toContain('/storage/applications/');
      expect(slot(res, 'CERTIFICATE')?.uploadStatus).toBe('VERIFIED');
      expect(slot(res, 'CERTIFICATE')?.readUrl).toContain(`/storage/${certKey}?expires=`);
      expect(slot(res, 'CERTIFICATE')?.docSubType).toBe('PGS');
    });
  });

  it('BR-54d: farmer B never sees farmer A’s documents, and soft-deleted rows are excluded', async () => {
    await withTx(async (db) => {
      const aKey = `applications/${newId()}.pdf`;
      const a = await seedFarmer(db, 'a', [aKey]);
      const b = await seedFarmer(db, 'b', []);
      await seedVerifiedCertificate(db, a, `certificate/${newId()}.pdf`, a.userId);
      await db.query(`UPDATE certifications SET deleted_at = now() WHERE farmer_id = $1`, [a.farmerId]);
      await db.query(`UPDATE farmer_documents SET deleted_at = now() WHERE farmer_id = $1`, [a.farmerId]);

      const asB = await serviceOn(db).getMyDocuments(
        anActor({ userId: b.userId, farmerId: b.farmerId, roles: [aRole(RoleCode.FARMER)] }),
      );
      expect(JSON.stringify(asB)).not.toContain(aKey);
      expect(asB.documents.every((d) => d.readUrl === null)).toBe(true);

      const asA = await serviceOn(db).getMyDocuments(
        anActor({ userId: a.userId, farmerId: a.farmerId, roles: [aRole(RoleCode.FARMER)] }),
      );
      expect(slot(asA, 'ID_PROOF')?.readUrl).toContain(aKey);
      expect(slot(asA, 'CERTIFICATE')?.uploadStatus).toBe('PENDING');
    });
  });

  it('BR-54d: a certificate whose document row was soft-deleted shows no file and is not VERIFIED', async () => {
    await withTx(async (db) => {
      const a = await seedFarmer(db, 'a', []);
      await seedVerifiedCertificate(db, a, `certificate/${newId()}.pdf`, a.userId);
      await db.query(`UPDATE farmer_documents SET deleted_at = now() WHERE farmer_id = $1`, [a.farmerId]);

      const res = await serviceOn(db).getMyDocuments(
        anActor({ userId: a.userId, farmerId: a.farmerId, roles: [aRole(RoleCode.FARMER)] }),
      );
      expect(slot(res, 'CERTIFICATE')?.uploadStatus).toBe('PENDING');
      expect(slot(res, 'CERTIFICATE')?.readUrl).toBeNull();
    });
  });

  it('BR-54g: another farmer’s real upload key planted in this farmer’s step4Documents is not signed', async () => {
    await withTx(async (db) => {
      const bKey = `applications/${newId()}.pdf`;
      await seedFarmer(db, 'b', [bKey]);
      const a = await seedFarmer(db, 'a', [`applications/${newId()}.pdf`]);
      await db.query(`UPDATE farmer_applications SET step4_documents = $1::jsonb WHERE id = $2`, [
        JSON.stringify({ documents: [{ docType: 'ID_PROOF', fileUrl: `${BASE_URL}/storage/${bKey}` }] }),
        a.applicationId,
      ]);

      const asA = await serviceOn(db).getMyDocuments(
        anActor({ userId: a.userId, farmerId: a.farmerId, roles: [aRole(RoleCode.FARMER)] }),
      );
      expect(slot(asA, 'ID_PROOF')?.readUrl).toBeNull();
      expect(JSON.stringify(asA)).not.toContain(bKey);
    });
  });

  it('BR-54d: a user with no farmer profile gets 404 NOT_FOUND from the real query', async () => {
    await withTx(async (db) => {
      const userId = newId();
      await db.query(
        `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'No Profile', 'FARMER', 'ACTIVE')`,
        [userId, `+9197${Math.floor(10000000 + Math.random() * 89999999)}`],
      );
      await expect(
        serviceOn(db).getMyDocuments(anActor({ userId, farmerId: null, roles: [aRole(RoleCode.FARMER)] })),
      ).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
    });
  });

  it('BR-54a: GET /v1/farmers/me/documents answers 200 with the response schema on the real database', async () => {
    const seeded: Seeded[] = [];
    try {
      const a = await seedFarmer(pool, 'http', [`applications/${newId()}.pdf`]);
      seeded.push(a);
      const token = signAccessToken({
        sub: a.userId,
        roles: [{ code: 'FARMER' }],
        farmerId: a.farmerId,
        customerId: null,
      });
      const res = await request(createApp()).get('/v1/farmers/me/documents').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(farmerProfileDocumentsResponseSchema.safeParse(res.body).success).toBe(true);
      expect(res.body.documents[0].docType).toBe('ID_PROOF');
      expect(res.body.documents[0].documentNumberLast4).toBe('4821');
    } finally {
      for (const s of seeded) {
        await pool.query(`DELETE FROM uploads WHERE entity_id = $1`, [s.applicationId]);
        await pool.query(`DELETE FROM farmer_applications WHERE id = $1`, [s.applicationId]);
        await pool.query(`DELETE FROM farmers WHERE id = $1`, [s.farmerId]);
        await pool.query(`DELETE FROM users WHERE id = $1`, [s.userId]);
      }
    }
  });
});
