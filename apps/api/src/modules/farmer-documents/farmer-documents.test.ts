import { describe, expect, it } from 'vitest';
import { RoleCode } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { pool } from '../../db/pool.js';
import { anActor, aRole, describeIfDatabase, IDS } from '../../test/factories.js';
import { InMemoryBlobStorage } from '../../storage/blobStorage.js';
import { createFarmerDocumentsService } from './farmer-documents.service.js';
import type {
  FarmerApplicationRecord,
  FarmerDocumentsRepo,
  FarmerRecord,
} from './farmer-documents.repo.js';

const FARMER_ID = '33333333-3333-4000-8000-333333333333';
const USER_ID = IDS.userFarmer;

function aFarmerActor(userId: string = USER_ID) {
  return anActor({
    userId,
    roles: [aRole(RoleCode.FARMER)],
    farmerId: FARMER_ID,
  });
}

function mockFarmer(overrides: Partial<FarmerRecord> = {}): FarmerRecord {
  return {
    id: FARMER_ID,
    userId: USER_ID,
    tohfaFarmerId: 'TOHFA-F-2026-0001',
    fullName: 'Murugan Selvam',
    aadhaarLast4: '4821',
    kycStatus: 'VERIFIED',
    ...overrides,
  };
}

function mockApplication(overrides: Partial<FarmerApplicationRecord> = {}): FarmerApplicationRecord {
  return {
    id: 'app-1',
    userId: USER_ID,
    farmerId: FARMER_ID,
    status: 'APPROVED',
    step1Personal: {
      aadhaarNumber: '999988884821',
      fullName: 'Murugan Selvam',
    },
    step4Documents: {
      documents: [
        {
          docType: 'ID_PROOF',
          fileUrl: 'http://localhost:3000/storage/farmer_documents/aadhaar_doc.pdf',
          fileName: 'aadhaar_doc.pdf',
          docSubType: 'Aadhaar Card',
        },
        {
          docType: 'FARM_DOC',
          fileUrl: 'http://localhost:3000/storage/farmer_documents/patta_map.pdf',
          fileName: 'patta_map.pdf',
          docSubType: 'Land Patta / FMB Map',
        },
      ],
    },
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: null,
    ...overrides,
  };
}

describe('Farmer Profile Documents (BR-54 unit tests)', () => {
  const dummyDb: Executor = {
    query: async () => ({ rows: [], rowCount: 0 } as any),
  };

  it('BR-54a: returns documents with docType, displayName, uploadStatus, and signed readUrl', async () => {
    const storage = new InMemoryBlobStorage('http://localhost:3000');
    const fakeRepo: FarmerDocumentsRepo = {
      findFarmerByUserId: async () => mockFarmer(),
      findLatestApplicationByFarmerIdOrUserId: async () => mockApplication(),
      findFarmerDocuments: async () => [],
      findCertifications: async () => [
        {
          id: 'cert-1',
          farmerId: FARMER_ID,
          certType: 'PGS_ORGANIC',
          customTypeName: 'PGS Scope Certificate',
          certNumber: 'PGS/TN/2026/001',
          documentId: null,
          documentUrl: 'http://localhost:3000/storage/certs/pgs.pdf',
          isVerified: true,
          verifiedAt: new Date('2026-02-01T00:00:00Z'),
          expiresOn: '2027-02-01',
          createdAt: new Date('2026-02-01T00:00:00Z'),
        },
      ],
    };

    const service = createFarmerDocumentsService({ repo: fakeRepo, db: dummyDb, storage });
    const res = await service.getMyDocuments(aFarmerActor());

    expect(res.documents).toHaveLength(4);

    const aadhaar = res.documents.find((d) => d.docType === 'ID_PROOF');
    expect(aadhaar).toBeDefined();
    expect(aadhaar?.displayName).toBe('Aadhaar Card');
    expect(aadhaar?.uploadStatus).toBe('VERIFIED');
    expect(aadhaar?.readUrl).toContain('/storage/farmer_documents/aadhaar_doc.pdf?expires=');
    expect(aadhaar?.documentNumberLast4).toBe('4821');

    const patta = res.documents.find((d) => d.docType === 'LAND_PATTA');
    expect(patta).toBeDefined();
    expect(patta?.displayName).toBe('Land Patta / FMB Map');
    expect(patta?.uploadStatus).toBe('VERIFIED');
    expect(patta?.readUrl).toContain('/storage/farmer_documents/patta_map.pdf?expires=');

    const cert = res.documents.find((d) => d.docType === 'CERTIFICATE');
    expect(cert).toBeDefined();
    expect(cert?.displayName).toBe('PGS Scope Certificate');
    expect(cert?.uploadStatus).toBe('VERIFIED');
    expect(cert?.readUrl).toContain('/storage/certs/pgs.pdf?expires=');

    const soil = res.documents.find((d) => d.docType === 'SOIL_CARD');
    expect(soil).toBeDefined();
    expect(soil?.displayName).toBe('Annual Soil & Water Health Card');
    expect(soil?.uploadStatus).toBe('ACTION_NEEDED');
  });

  it('BR-54b: never returns full Aadhaar number; masks to last 4 digits only', async () => {
    const storage = new InMemoryBlobStorage('http://localhost:3000');
    const fakeRepo: FarmerDocumentsRepo = {
      findFarmerByUserId: async () =>
        mockFarmer({
          aadhaarLast4: null,
        }),
      findLatestApplicationByFarmerIdOrUserId: async () =>
        mockApplication({
          step1Personal: {
            aadhaarNumber: '123456784821', // Full 12 digits
          },
        }),
      findFarmerDocuments: async () => [],
      findCertifications: async () => [],
    };

    const service = createFarmerDocumentsService({ repo: fakeRepo, db: dummyDb, storage });
    const res = await service.getMyDocuments(aFarmerActor());

    const aadhaar = res.documents.find((d) => d.docType === 'ID_PROOF');
    expect(aadhaar?.documentNumberLast4).toBe('4821');

    const jsonString = JSON.stringify(res);
    expect(jsonString).not.toContain('123456784821');
    expect(jsonString).not.toContain('12345678');
  });

  it('BR-54c: signed read URLs have time-limited expiry token attached', async () => {
    const storage = new InMemoryBlobStorage('http://localhost:3000');
    const fakeRepo: FarmerDocumentsRepo = {
      findFarmerByUserId: async () => mockFarmer(),
      findLatestApplicationByFarmerIdOrUserId: async () => mockApplication(),
      findFarmerDocuments: async () => [
        {
          id: 'doc-1',
          farmerId: FARMER_ID,
          docType: 'ID_PROOF',
          storageKey: 'secure_docs/aadhaar.pdf',
          mimeType: 'application/pdf',
          isMandatory: true,
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date(),
          createdAt: new Date(),
        },
      ],
      findCertifications: async () => [],
    };

    const service = createFarmerDocumentsService({ repo: fakeRepo, db: dummyDb, storage });
    const res = await service.getMyDocuments(aFarmerActor());

    const aadhaar = res.documents.find((d) => d.docType === 'ID_PROOF');
    expect(aadhaar?.readUrl).toMatch(/^http:\/\/localhost:3000\/storage\/secure_docs\/aadhaar\.pdf\?expires=/);
  });

  it('BR-54d: accessing documents when farmer profile does not exist returns 404 NOT_FOUND (BR-36)', async () => {
    const fakeRepo: FarmerDocumentsRepo = {
      findFarmerByUserId: async () => null,
      findLatestApplicationByFarmerIdOrUserId: async () => null,
      findFarmerDocuments: async () => [],
      findCertifications: async () => [],
    };

    const service = createFarmerDocumentsService({ repo: fakeRepo, db: dummyDb });
    await expect(service.getMyDocuments(aFarmerActor())).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    });
  });
});

describeIfDatabase('Farmer Profile Documents integration (PostgreSQL)', () => {
  it('queries real farmer_applications and farmer_documents tables', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const res = await client.query(
        `SELECT id, step4_documents FROM farmer_applications LIMIT 1`,
      );
      expect(res.rows).toBeDefined();

      const docRes = await client.query(
        `SELECT id, doc_type, storage_key FROM farmer_documents LIMIT 1`,
      );
      expect(docRes.rows).toBeDefined();
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });
});
