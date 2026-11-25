/**
 * Admin application review flow — BR-214 .. BR-219, unit level (mocked repo, mocked transaction,
 * in-memory idempotency store). The database half (append-only triggers, the real SQL, the
 * end-to-end HTTP flow) is application-review.db.test.ts.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PoolClient } from 'pg';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type * as PoolModule from '../../db/pool.js';
import { eventBus } from '../../events/bus.js';
import type { IdempotencyStore } from '../../http/idempotency.js';
import { aScope, anActor, IDS } from '../../test/factories.js';
import type { FarmerApplicationRow, FarmerApplicationsRepo, StatusHistoryRow } from './farmer-applications.repo.js';
import {
  addApplicationNoteBody,
  requestInfoApplicationBody,
  reviewDecisionBody,
} from './farmer-applications.schema.js';
import { createFarmerApplicationsService, isValidTransition } from './farmer-applications.service.js';
import {
  documentKeyOf,
  fmbFingerprintOf,
  type ApplicationReviewRow,
} from './farmer-applications.review.js';

// Every withTransaction in these tests runs against a recording fake: the repo is mocked, and the
// only raw SQL the service still issues in a transaction (approval's farmers/farms inserts, the
// audit row, the idempotency store when not injected) is recorded so it can be asserted.
const capture = vi.hoisted(() => ({ queries: [] as Array<{ sql: string; params: unknown[] }> }));

vi.mock('../../db/pool.js', async (importOriginal) => {
  const actual = await importOriginal<typeof PoolModule>();
  const tx = {
    query: async (sql: string, params: unknown[] = []) => {
      capture.queries.push({ sql, params });
      return { rows: [{ id: '30000000-0000-4000-8000-0000000000aa' }], rowCount: 1 };
    },
  };
  return {
    ...actual,
    withTransaction: async <T>(fn: (client: PoolClient) => Promise<T>): Promise<T> => fn(tx as unknown as PoolClient),
  };
});

const APP_ID = '11111111-1111-4111-8111-111111111111';
const ZONE_ID = IDS.zoneNorth;
const OTHER_ZONE = '20000000-0000-4000-8000-0000000000ff';
const REVIEWER = IDS.userSuperAdmin;
const admin = anActor({ userId: REVIEWER });
const ALL = aScope({ permission: 'farmer.application.view' });

const ID_URL = 'https://files.test/farmer-applications/aadhaar.pdf';
const PATTA_URL = 'https://files.test/farmer-applications/patta.pdf';
const OTHER_URL = 'https://files.test/farmer-applications/photo.jpg';
const STRAY_URL = 'https://elsewhere.test/not-an-upload.pdf';

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
const LOCATION = { id: 'loc-a', label: 'Home plot', areaAcres: 2.5, fmbPolygon: POLYGON, latitude: 11.41, longitude: 76.695 };

const ID_KEY = documentKeyOf('ID_PROOF', ID_URL);
const PATTA_KEY = documentKeyOf('FARM_DOC', PATTA_URL);
const OTHER_KEY = documentKeyOf('OTHER', OTHER_URL);

function anApplication(overrides: Partial<FarmerApplicationRow> = {}): FarmerApplicationRow {
  return {
    id: APP_ID,
    mobile: '+919812300214',
    full_name: 'Review Applicant',
    preferred_locale: 'en',
    status: 'DOCS_REVIEW',
    is_draft: false,
    current_step: 5,
    completed_steps: [1, 2, 3, 4, 5],
    step1_personal: { taluk: 'Ooty', district: 'The Nilgiris' },
    step2_farm_details: {},
    step3_location: { locations: [LOCATION] },
    step4_documents: {
      documents: [
        { docType: 'ID_PROOF', fileUrl: ID_URL, fileName: 'aadhaar.pdf' },
        { docType: 'FARM_DOC', fileUrl: PATTA_URL, fileName: 'patta.pdf' },
      ],
    },
    user_id: IDS.userFarmer,
    farmer_id: null,
    zone_id: ZONE_ID,
    submitted_at: new Date('2026-11-20T00:00:00Z'),
    created_at: new Date('2026-11-19T00:00:00Z'),
    updated_at: null,
    ...overrides,
  };
}

interface Harness {
  repo: FarmerApplicationsRepo;
  app: () => FarmerApplicationRow;
  history: StatusHistoryRow[];
  reviews: ApplicationReviewRow[];
  farmerDocuments: Array<Record<string, unknown>>;
  idempotency: IdempotencyStore;
  service: ReturnType<typeof createFarmerApplicationsService>;
}

function harness(initial: FarmerApplicationRow, uploads: Array<{ storage_key: string; mime_type: string; size_bytes: string }> = []): Harness {
  let app = { ...initial };
  const history: StatusHistoryRow[] = [];
  const reviews: ApplicationReviewRow[] = [];
  const farmerDocuments: Array<Record<string, unknown>> = [];
  let seq = 0;
  const clock = () => new Date(Date.UTC(2026, 10, 25, 0, 0, seq++));

  const repo = {
    findById: async (_db: unknown, id: string) => (id === app.id ? app : null),
    findByIdForUpdate: async (_db: unknown, id: string) => (id === app.id ? app : null),
    isZoneActive: async () => true,
    findZoneByTaluk: async () => null,
    findApplicantLiveRoles: async () => [],
    allocateNextTohfaFarmerId: async () => 'TOHFA-F-2026-0214',
    updateStepData: async (_db: unknown, _id: string, step: number, data: Record<string, unknown>) => {
      if (step === 3) app = { ...app, step3_location: data };
      if (step === 4) app = { ...app, step4_documents: data };
      return app;
    },
    transitionStatus: async (
      _db: unknown,
      id: string,
      from: FarmerApplicationRow['status'] | null,
      to: FarmerApplicationRow['status'],
      actorId?: string,
      note?: string,
      zoneId?: string | null,
      details?: { reasonCode?: string; requestedItems?: string[] },
    ) => {
      if (id !== app.id || (from !== null && app.status !== from)) throw new Error('CONCURRENT_MODIFICATION');
      // Mirrors the fixed SQL: only the draft submit may set (or clear) the zone; every other
      // transition keeps the stored zone unless a value is given.
      const isDraftSubmit = from === 'SUBMITTED' && to === 'DOCS_REVIEW';
      app = {
        ...app,
        status: to,
        is_draft: isDraftSubmit ? false : app.is_draft,
        zone_id: isDraftSubmit ? (zoneId ?? null) : (zoneId ?? app.zone_id),
      };
      history.push({
        id: `h-${history.length}`,
        application_id: id,
        from_status: from,
        to_status: to,
        actor_id: actorId ?? null,
        note: note ?? null,
        created_at: clock(),
        event_type: 'TRANSITION',
        reason_code: details?.reasonCode ?? null,
        requested_items: details?.requestedItems ?? null,
      });
      if (to === 'INFO_REQUESTED') {
        app = {
          ...app,
          info_request_items: details?.requestedItems ?? null,
          info_request_message: note ?? null,
          info_requested_at: history[history.length - 1]!.created_at,
          info_requested_by: actorId ?? null,
        };
      }
      return app;
    },
    insertNote: async (_db: unknown, row: { applicationId: string; status: FarmerApplicationRow['status']; actorId: string; note: string }) => {
      const entry: StatusHistoryRow = {
        id: `h-${history.length}`,
        application_id: row.applicationId,
        from_status: row.status,
        to_status: row.status,
        actor_id: row.actorId,
        note: row.note,
        created_at: clock(),
        event_type: 'NOTE',
        reason_code: null,
        requested_items: null,
      };
      history.push(entry);
      return entry;
    },
    getStatusHistory: async () => history,
    listReviews: async () => reviews,
    insertReview: async (
      _db: unknown,
      row: {
        applicationId: string;
        subjectType: 'DOCUMENT' | 'FMB';
        subjectKey: string;
        contentFingerprint: string;
        decision: 'VERIFIED' | 'REJECTED';
        reason: string | null;
        reviewedBy: string;
      },
    ) => {
      const entry: ApplicationReviewRow = {
        id: `r-${reviews.length}`,
        application_id: row.applicationId,
        subject_type: row.subjectType,
        subject_key: row.subjectKey,
        content_fingerprint: row.contentFingerprint,
        decision: row.decision,
        reason: row.reason,
        reviewed_by: row.reviewedBy,
        created_at: clock(),
      };
      reviews.push(entry);
      return entry;
    },
    findApplicationUploads: async () => uploads,
    insertFarmerDocument: async (_db: unknown, row: Record<string, unknown>) => {
      farmerDocuments.push(row);
      return { id: `fd-${farmerDocuments.length}` };
    },
  } as unknown as FarmerApplicationsRepo;

  // In-memory store with the real contract: a claimed key replays its stored response.
  const keys = new Map<string, { operation: string; requestHash: string; response: unknown }>();
  const idempotency: IdempotencyStore = {
    claim: async (_tx, claim) => {
      const held = keys.get(`${claim.actorUserId}|${claim.key}`);
      if (held !== undefined) return { claimed: false, ...held };
      keys.set(`${claim.actorUserId}|${claim.key}`, { operation: claim.operation, requestHash: claim.requestHash, response: null });
      return { claimed: true };
    },
    complete: async (_tx, actorUserId, key, response) => {
      const held = keys.get(`${actorUserId}|${key}`);
      if (held !== undefined) held.response = JSON.parse(JSON.stringify(response));
    },
  };

  const storage = { getPublicUrl: (key: string) => `https://files.test/${key}` };
  const service = createFarmerApplicationsService(repo, undefined, { idempotency, storage });
  return { repo, app: () => app, history, reviews, farmerDocuments, idempotency, service };
}

let keyCounter = 0;
const key = () => `key-${++keyCounter}`;

async function verifyAll(h: Harness): Promise<void> {
  const detail = (await h.service.getAdminApplication(admin, ALL, APP_ID)) as {
    documents: Array<{ documentKey: string }>;
    locations: Array<{ locationId: string }>;
  };
  for (const doc of detail.documents) {
    await h.service.reviewApplicationDocument(admin, ALL, APP_ID, doc.documentKey, { decision: 'VERIFIED' }, key());
  }
  for (const loc of detail.locations) {
    await h.service.reviewApplicationFmb(admin, ALL, APP_ID, loc.locationId, { decision: 'VERIFIED' }, key());
  }
}

beforeEach(() => {
  capture.queries.length = 0;
});

afterEach(() => {
  vi.restoreAllMocks();
});

function auditRows(): Array<{ sql: string; params: unknown[] }> {
  return capture.queries.filter((q) => q.sql.includes('INSERT INTO audit_log'));
}

describe('BR-214: stage progression and gates', () => {
  it('BR-214a: advance is refused with APPLICATION_DOCUMENTS_NOT_VERIFIED while required documents are pending, and writes nothing', async () => {
    const h = harness(anApplication());
    await expect(
      h.service.advanceApplication(admin, ALL, APP_ID, { toStatus: 'FARM_VERIFICATION' }, key()),
    ).rejects.toMatchObject({
      code: 'APPLICATION_DOCUMENTS_NOT_VERIFIED',
      status: 409,
      meta: {
        blockers: expect.arrayContaining([
          { kind: 'DOCUMENT_PENDING', documentKey: ID_KEY, docType: 'ID_PROOF' },
          { kind: 'DOCUMENT_PENDING', documentKey: PATTA_KEY, docType: 'FARM_DOC' },
        ]),
      },
    });
    expect(h.app().status).toBe('DOCS_REVIEW');
    expect(h.history).toHaveLength(0);
    expect(auditRows()).toHaveLength(0);
  });

  it('BR-214a: advance moves DOCS_REVIEW to FARM_VERIFICATION once ID_PROOF and FARM_DOC are VERIFIED, with one history and one audit row', async () => {
    const h = harness(anApplication());
    await h.service.reviewApplicationDocument(admin, ALL, APP_ID, ID_KEY, { decision: 'VERIFIED' }, key());
    await h.service.reviewApplicationDocument(admin, ALL, APP_ID, PATTA_KEY, { decision: 'VERIFIED' }, key());
    capture.queries.length = 0;

    const res = (await h.service.advanceApplication(admin, ALL, APP_ID, { toStatus: 'FARM_VERIFICATION', note: 'Docs OK' }, key())) as {
      status: string;
    };
    expect(res.status).toBe('FARM_VERIFICATION');
    expect(h.history).toHaveLength(1);
    expect(h.history[0]).toMatchObject({ from_status: 'DOCS_REVIEW', to_status: 'FARM_VERIFICATION', actor_id: REVIEWER, note: 'Docs OK' });
    expect(auditRows()).toHaveLength(1);
    expect(auditRows()[0]!.params).toContain('farmer.application.advance');
  });

  it('BR-214a: a REJECTED document of any type blocks advance, and a missing required type is named', async () => {
    const h = harness(
      anApplication({
        step4_documents: {
          documents: [
            { docType: 'ID_PROOF', fileUrl: ID_URL },
            { docType: 'OTHER', fileUrl: OTHER_URL },
          ],
        },
      }),
    );
    await h.service.reviewApplicationDocument(admin, ALL, APP_ID, ID_KEY, { decision: 'VERIFIED' }, key());
    await h.service.reviewApplicationDocument(admin, ALL, APP_ID, OTHER_KEY, { decision: 'REJECTED', reason: 'Photo is blurred' }, key());

    await expect(
      h.service.advanceApplication(admin, ALL, APP_ID, { toStatus: 'FARM_VERIFICATION' }, key()),
    ).rejects.toMatchObject({
      code: 'APPLICATION_DOCUMENTS_NOT_VERIFIED',
      meta: {
        blockers: expect.arrayContaining([
          { kind: 'MISSING_DOCUMENT_TYPE', docType: 'FARM_DOC' },
          { kind: 'DOCUMENT_REJECTED', documentKey: OTHER_KEY, docType: 'OTHER', reason: 'Photo is blurred' },
        ]),
      },
    });
  });

  it('BR-214a: advance from any stage but DOCS_REVIEW is 409 INVALID_STATE_TRANSITION', async () => {
    for (const status of ['FARM_VERIFICATION', 'INFO_REQUESTED', 'AUDIT', 'APPROVED', 'REJECTED'] as const) {
      const h = harness(anApplication({ status }));
      await expect(
        h.service.advanceApplication(admin, ALL, APP_ID, { toStatus: 'FARM_VERIFICATION' }, key()),
      ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION', status: 409 });
    }
  });

  it('BR-214b: approval from DOCS_REVIEW (even fully verified) or INFO_REQUESTED is 409 INVALID_STATE_TRANSITION', async () => {
    const h = harness(anApplication());
    await verifyAll(h);
    await expect(h.service.approveApplication(admin, ALL, APP_ID, {}, key())).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
      status: 409,
    });
    const h2 = harness(anApplication({ status: 'INFO_REQUESTED' }));
    await expect(h2.service.approveApplication(admin, ALL, APP_ID, {}, key())).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
    });
  });

  it('BR-214c: approval from FARM_VERIFICATION with a pending FMB is 409 APPLICATION_FMB_NOT_VERIFIED and writes nothing', async () => {
    const h = harness(anApplication({ status: 'FARM_VERIFICATION' }));
    await h.service.reviewApplicationDocument(admin, ALL, APP_ID, ID_KEY, { decision: 'VERIFIED' }, key());
    await h.service.reviewApplicationDocument(admin, ALL, APP_ID, PATTA_KEY, { decision: 'VERIFIED' }, key());
    capture.queries.length = 0;

    await expect(h.service.approveApplication(admin, ALL, APP_ID, {}, key())).rejects.toMatchObject({
      code: 'APPLICATION_FMB_NOT_VERIFIED',
      status: 409,
      meta: { blockers: [{ kind: 'FMB_PENDING', locationId: 'loc-a', label: 'Home plot' }] },
    });
    expect(h.app().status).toBe('FARM_VERIFICATION');
    expect(capture.queries.some((q) => q.sql.includes('INSERT INTO farmers'))).toBe(false);
  });

  it('BR-214c: a REJECTED document blocks approval with APPLICATION_DOCUMENTS_NOT_VERIFIED, and the blockers list both gates', async () => {
    const h = harness(anApplication({ status: 'FARM_VERIFICATION' }));
    await h.service.reviewApplicationDocument(admin, ALL, APP_ID, ID_KEY, { decision: 'REJECTED', reason: 'Name does not match' }, key());
    await h.service.reviewApplicationDocument(admin, ALL, APP_ID, PATTA_KEY, { decision: 'VERIFIED' }, key());

    await expect(h.service.approveApplication(admin, ALL, APP_ID, {}, key())).rejects.toMatchObject({
      code: 'APPLICATION_DOCUMENTS_NOT_VERIFIED',
      meta: {
        blockers: expect.arrayContaining([
          expect.objectContaining({ kind: 'DOCUMENT_REJECTED', documentKey: ID_KEY }),
          expect.objectContaining({ kind: 'FMB_PENDING', locationId: 'loc-a' }),
        ]),
      },
    });
  });

  it('BR-214c: approval succeeds from FARM_VERIFICATION once documents and every FMB are VERIFIED', async () => {
    const h = harness(anApplication({ status: 'FARM_VERIFICATION' }));
    await verifyAll(h);
    const res = (await h.service.approveApplication(admin, ALL, APP_ID, { note: 'All checked' }, key())) as { status: string };
    expect(res.status).toBe('APPROVED');
    expect(h.history.at(-1)).toMatchObject({ from_status: 'FARM_VERIFICATION', to_status: 'APPROVED', note: 'All checked' });
  });

  it('BR-214d: no transition enters or leaves AUDIT', async () => {
    for (const from of ['SUBMITTED', 'DOCS_REVIEW', 'FARM_VERIFICATION', 'INFO_REQUESTED', 'APPROVED', 'REJECTED'] as const) {
      expect(isValidTransition(from, 'AUDIT')).toBe(false);
    }
    for (const to of ['SUBMITTED', 'DOCS_REVIEW', 'FARM_VERIFICATION', 'INFO_REQUESTED', 'APPROVED', 'REJECTED'] as const) {
      expect(isValidTransition('AUDIT', to)).toBe(false);
    }
    const h = harness(anApplication({ status: 'AUDIT' }));
    await expect(h.service.approveApplication(admin, ALL, APP_ID, {}, key())).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });
    await expect(
      h.service.rejectApplication(admin, ALL, APP_ID, { reasonCode: 'OTHER', reason: 'Legacy audit row' }, key()),
    ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });
    await expect(
      h.service.requestInfoApplication(admin, ALL, APP_ID, { items: ['OTHER'], message: 'Please send more' }, key()),
    ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });
    expect(h.app().status).toBe('AUDIT');
  });

  it('BR-214e: every review mutation requires an Idempotency-Key (422 VALIDATION_FAILED)', async () => {
    const h = harness(anApplication());
    const calls = [
      () => h.service.advanceApplication(admin, ALL, APP_ID, { toStatus: 'FARM_VERIFICATION' }, undefined),
      () => h.service.reviewApplicationDocument(admin, ALL, APP_ID, ID_KEY, { decision: 'VERIFIED' }, undefined),
      () => h.service.reviewApplicationFmb(admin, ALL, APP_ID, 'loc-a', { decision: 'VERIFIED' }, undefined),
      () => h.service.addApplicationNote(admin, ALL, APP_ID, { note: 'hello' }, '   '),
      () => h.service.approveApplication(admin, ALL, APP_ID, {}, undefined),
      () => h.service.rejectApplication(admin, ALL, APP_ID, { reasonCode: 'OTHER', reason: 'No reason given' }, undefined),
      () => h.service.requestInfoApplication(admin, ALL, APP_ID, { items: ['AADHAAR'], message: 'Re-upload please' }, undefined),
    ];
    for (const call of calls) {
      await expect(call()).rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
    }
    expect(h.history).toHaveLength(0);
    expect(h.reviews).toHaveLength(0);
  });

  it('BR-214e: replaying a key returns the first response and writes no second row; a different body is IDEMPOTENCY_KEY_REUSED', async () => {
    const h = harness(anApplication());
    const k = key();
    const first = await h.service.addApplicationNote(admin, ALL, APP_ID, { note: 'Called the farmer' }, k);
    const replay = await h.service.addApplicationNote(admin, ALL, APP_ID, { note: 'Called the farmer' }, k);
    expect(replay).toEqual(JSON.parse(JSON.stringify(first)));
    expect(h.history.filter((r) => r.event_type === 'NOTE')).toHaveLength(1);
    await expect(
      h.service.addApplicationNote(admin, ALL, APP_ID, { note: 'Something else' }, k),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED', status: 409 });
  });

  it('BR-214f: an admin whose scope does not cover the application zone gets 404 on read and on every mutation', async () => {
    const h = harness(anApplication({ zone_id: OTHER_ZONE }));
    const zoned = aScope({
      level: ScopeLevel.VIEW,
      roleCode: RoleCode.FARMER_ADMIN,
      zoneIds: [ZONE_ID],
      userId: IDS.userFarmerAdmin,
    });
    const calls = [
      () => h.service.getAdminApplication(admin, zoned, APP_ID),
      () => h.service.advanceApplication(admin, zoned, APP_ID, { toStatus: 'FARM_VERIFICATION' }, key()),
      () => h.service.reviewApplicationDocument(admin, zoned, APP_ID, ID_KEY, { decision: 'VERIFIED' }, key()),
      () => h.service.reviewApplicationFmb(admin, zoned, APP_ID, 'loc-a', { decision: 'VERIFIED' }, key()),
      () => h.service.addApplicationNote(admin, zoned, APP_ID, { note: 'x' }, key()),
      () => h.service.approveApplication(admin, zoned, APP_ID, {}, key()),
      () => h.service.rejectApplication(admin, zoned, APP_ID, { reasonCode: 'OTHER', reason: 'Out of scope' }, key()),
      () => h.service.requestInfoApplication(admin, zoned, APP_ID, { items: ['OTHER'], message: 'Out of scope' }, key()),
    ];
    for (const call of calls) {
      await expect(call()).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
    }
  });
});

describe('BR-215: per-document review', () => {
  it('BR-215a: VERIFIED and REJECTED decisions are stored with actor and reason and shown on the detail', async () => {
    const h = harness(anApplication());
    await h.service.reviewApplicationDocument(admin, ALL, APP_ID, ID_KEY, { decision: 'VERIFIED' }, key());
    const detail = (await h.service.reviewApplicationDocument(
      admin,
      ALL,
      APP_ID,
      PATTA_KEY,
      { decision: 'REJECTED', reason: 'Survey number unreadable' },
      key(),
    )) as { documents: Array<{ documentKey: string; required: boolean; review: { status: string; reason: string | null; reviewedBy: string | null } }> };

    expect(h.reviews).toEqual([
      expect.objectContaining({ subject_type: 'DOCUMENT', subject_key: ID_KEY, decision: 'VERIFIED', reason: null, reviewed_by: REVIEWER }),
      expect.objectContaining({ subject_type: 'DOCUMENT', subject_key: PATTA_KEY, decision: 'REJECTED', reason: 'Survey number unreadable' }),
    ]);
    const byKey = new Map(detail.documents.map((d) => [d.documentKey, d]));
    expect(byKey.get(ID_KEY)).toMatchObject({ required: true, review: { status: 'VERIFIED', reviewedBy: REVIEWER } });
    expect(byKey.get(PATTA_KEY)).toMatchObject({ review: { status: 'REJECTED', reason: 'Survey number unreadable' } });
    expect(auditRows()).toHaveLength(2);
  });

  it('BR-215a: REJECTED without a reason, or VERIFIED with one, is refused by the body schema (422)', () => {
    expect(reviewDecisionBody.safeParse({ decision: 'REJECTED' }).success).toBe(false);
    expect(reviewDecisionBody.safeParse({ decision: 'REJECTED', reason: 'no' }).success).toBe(false);
    expect(reviewDecisionBody.safeParse({ decision: 'VERIFIED', reason: 'Looks fine to me' }).success).toBe(false);
    expect(reviewDecisionBody.safeParse({ decision: 'VERIFIED' }).success).toBe(true);
    expect(reviewDecisionBody.safeParse({ decision: 'REJECTED', reason: 'Expired card' }).success).toBe(true);
  });

  it('BR-215b: replacing a document file makes it PENDING again, and the old decision stays', async () => {
    const h = harness(anApplication());
    await h.service.reviewApplicationDocument(admin, ALL, APP_ID, ID_KEY, { decision: 'VERIFIED' }, key());
    const newUrl = 'https://files.test/farmer-applications/aadhaar-v2.pdf';
    await h.repo.updateStepData(undefined as never, APP_ID, 4, {
      documents: [
        { docType: 'ID_PROOF', fileUrl: newUrl },
        { docType: 'FARM_DOC', fileUrl: PATTA_URL },
      ],
    }, [1, 2, 3, 4, 5]);

    const detail = (await h.service.getAdminApplication(admin, ALL, APP_ID)) as {
      documents: Array<{ documentKey: string; docType: string; review: { status: string } }>;
    };
    const idDoc = detail.documents.find((d) => d.docType === 'ID_PROOF')!;
    expect(idDoc.documentKey).toBe(documentKeyOf('ID_PROOF', newUrl));
    expect(idDoc.review.status).toBe('PENDING');
    expect(h.reviews).toHaveLength(1);
  });

  it('BR-215c: review outside DOCS_REVIEW / FARM_VERIFICATION is 409; an unknown documentKey is 404', async () => {
    for (const status of ['INFO_REQUESTED', 'AUDIT', 'APPROVED', 'REJECTED'] as const) {
      const h = harness(anApplication({ status }));
      await expect(
        h.service.reviewApplicationDocument(admin, ALL, APP_ID, ID_KEY, { decision: 'VERIFIED' }, key()),
      ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION', status: 409 });
    }
    const draft = harness(anApplication({ status: 'SUBMITTED', is_draft: true }));
    await expect(
      draft.service.reviewApplicationDocument(admin, ALL, APP_ID, ID_KEY, { decision: 'VERIFIED' }, key()),
    ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });
    const h = harness(anApplication({ status: 'FARM_VERIFICATION' }));
    await expect(
      h.service.reviewApplicationDocument(admin, ALL, APP_ID, 'f'.repeat(32), { decision: 'VERIFIED' }, key()),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
  });
});

describe('BR-216: FMB review per location', () => {
  it('BR-216a: VERIFIED / REJECTED FMB decisions are stored per location and returned with the polygon and areas', async () => {
    const second = { id: 'loc-b', label: 'Lower field', areaAcres: 1.25, latitude: 11.42, longitude: 76.71 };
    const h = harness(anApplication({ step3_location: { locations: [LOCATION, second] } }));
    await h.service.reviewApplicationFmb(admin, ALL, APP_ID, 'loc-a', { decision: 'VERIFIED' }, key());
    const detail = (await h.service.reviewApplicationFmb(
      admin,
      ALL,
      APP_ID,
      'loc-b',
      { decision: 'REJECTED', reason: 'No FMB sketch drawn' },
      key(),
    )) as { locations: Array<Record<string, unknown>> };

    expect(h.reviews[0]).toMatchObject({ subject_type: 'FMB', subject_key: 'loc-a', content_fingerprint: fmbFingerprintOf(LOCATION) });
    expect(detail.locations[0]).toMatchObject({
      locationId: 'loc-a',
      label: 'Home plot',
      areaAcres: 2.5,
      hasBoundary: true,
      fmbPolygon: POLYGON,
      fmbReview: { status: 'VERIFIED', reviewedBy: REVIEWER },
    });
    expect(detail.locations[1]).toMatchObject({
      locationId: 'loc-b',
      hasBoundary: false,
      fmbPolygon: null,
      fmbReview: { status: 'REJECTED', reason: 'No FMB sketch drawn' },
    });
  });

  it('BR-216b: FMB review outside DOCS_REVIEW / FARM_VERIFICATION is 409; an unknown locationId is 404', async () => {
    const h = harness(anApplication({ status: 'INFO_REQUESTED' }));
    await expect(
      h.service.reviewApplicationFmb(admin, ALL, APP_ID, 'loc-a', { decision: 'VERIFIED' }, key()),
    ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION', status: 409 });
    const h2 = harness(anApplication());
    await expect(
      h2.service.reviewApplicationFmb(admin, ALL, APP_ID, 'loc-zzz', { decision: 'VERIFIED' }, key()),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
  });

  it('BR-216c: redrawing a boundary makes the location PENDING again', async () => {
    const h = harness(anApplication());
    await h.service.reviewApplicationFmb(admin, ALL, APP_ID, 'loc-a', { decision: 'VERIFIED' }, key());
    const redrawn = { ...LOCATION, fmbPolygon: { ...POLYGON, coordinates: [[[76.1, 11.1], [76.2, 11.1], [76.2, 11.2], [76.1, 11.1]]] } };
    await h.repo.updateStepData(undefined as never, APP_ID, 3, { locations: [redrawn] }, [1, 2, 3, 4, 5]);
    const detail = (await h.service.getAdminApplication(admin, ALL, APP_ID)) as {
      locations: Array<{ fmbReview: { status: string } }>;
    };
    expect(detail.locations[0]!.fmbReview.status).toBe('PENDING');
  });
});

describe('BR-217: request more information, and resubmission', () => {
  it('BR-217a: request-info stores INFO_REQUESTED with the checklist and message, and keeps the zone', async () => {
    const h = harness(anApplication({ status: 'FARM_VERIFICATION' }));
    const res = (await h.service.requestInfoApplication(
      admin,
      ALL,
      APP_ID,
      { items: ['FMB_SKETCH', 'PATTA_CHITTA', 'FMB_SKETCH'], message: 'Please upload the FMB sketch and patta' },
      key(),
    )) as { status: string; infoRequest: string | null; infoRequestDetail: Record<string, unknown> | null };

    expect(res.status).toBe('INFO_REQUESTED');
    expect(h.app().zone_id).toBe(ZONE_ID);
    expect(h.history.at(-1)).toMatchObject({
      from_status: 'FARM_VERIFICATION',
      to_status: 'INFO_REQUESTED',
      requested_items: ['FMB_SKETCH', 'PATTA_CHITTA'],
      note: 'Please upload the FMB sketch and patta',
    });
    expect(res.infoRequest).toBe('More info requested: Please upload the FMB sketch and patta');
    expect(res.infoRequestDetail).toMatchObject({
      items: ['FMB_SKETCH', 'PATTA_CHITTA'],
      message: 'Please upload the FMB sketch and patta',
      requestedBy: REVIEWER,
      open: true,
    });
  });

  it('BR-217a: request-info is refused outside DOCS_REVIEW / FARM_VERIFICATION, and an empty checklist is 422', async () => {
    for (const status of ['INFO_REQUESTED', 'APPROVED', 'REJECTED', 'AUDIT'] as const) {
      const h = harness(anApplication({ status }));
      await expect(
        h.service.requestInfoApplication(admin, ALL, APP_ID, { items: ['OTHER'], message: 'More please' }, key()),
      ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION', status: 409 });
    }
    expect(requestInfoApplicationBody.safeParse({ items: [], message: 'Something missing' }).success).toBe(false);
    expect(requestInfoApplicationBody.safeParse({ message: 'Something missing' }).success).toBe(false);
    expect(requestInfoApplicationBody.safeParse({ items: ['PASSPORT'], message: 'Something missing' }).success).toBe(false);
  });

  it('BR-217b: the public status endpoint returns INFO_REQUESTED with the requested items and message, and hides review notes', async () => {
    const h = harness(anApplication());
    await h.service.addApplicationNote(admin, ALL, APP_ID, { note: 'Internal: suspicious patta' }, key());
    await h.service.requestInfoApplication(admin, ALL, APP_ID, { items: ['AADHAAR'], message: 'Aadhaar scan is unreadable' }, key());
    const timeline = (await h.service.getStatusTimeline(undefined, APP_ID)) as {
      status: string;
      infoRequest: { items: string[]; message: string; requestedAt: string } | null;
      steps: Array<{ note: string | null }>;
    };
    expect(timeline.status).toBe('INFO_REQUESTED');
    expect(timeline.infoRequest).toMatchObject({ items: ['AADHAAR'], message: 'Aadhaar scan is unreadable' });
    expect(typeof timeline.infoRequest!.requestedAt).toBe('string');
    expect(JSON.stringify(timeline.steps)).not.toContain('Internal: suspicious patta');
  });

  it('BR-217c: resubmit moves INFO_REQUESTED to DOCS_REVIEW, keeps the zone, and a repeat call writes nothing', async () => {
    const h = harness(anApplication({ status: 'INFO_REQUESTED' }));
    const res = (await h.service.resubmitApplication(undefined, APP_ID)) as { status: string };
    expect(res.status).toBe('DOCS_REVIEW');
    expect(h.app().zone_id).toBe(ZONE_ID);
    expect(h.history).toHaveLength(1);
    expect(h.history[0]).toMatchObject({ from_status: 'INFO_REQUESTED', to_status: 'DOCS_REVIEW', actor_id: null });

    const again = (await h.service.resubmitApplication(undefined, APP_ID)) as { status: string };
    expect(again.status).toBe('DOCS_REVIEW');
    expect(h.history).toHaveLength(1);

    const timeline = (await h.service.getStatusTimeline(undefined, APP_ID)) as { infoRequest: unknown };
    expect(timeline.infoRequest).toBeNull();
  });

  it('BR-217c: resubmit of a draft is 409, and it re-runs the submit completeness checks', async () => {
    const draft = harness(anApplication({ status: 'SUBMITTED', is_draft: true }));
    await expect(draft.service.resubmitApplication(undefined, APP_ID)).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
      status: 409,
    });
    const incomplete = harness(anApplication({ status: 'INFO_REQUESTED', step4_documents: { documents: [] } }));
    await expect(incomplete.service.resubmitApplication(undefined, APP_ID)).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      status: 422,
    });
    expect(incomplete.app().status).toBe('INFO_REQUESTED');
  });

  it('BR-217d: an application with no account is asked for info without error and publishes no notification', async () => {
    const publish = vi.spyOn(eventBus, 'publish').mockResolvedValue(undefined);
    const h = harness(anApplication({ user_id: null }));
    const res = (await h.service.requestInfoApplication(admin, ALL, APP_ID, { items: ['BANK_DETAILS'], message: 'Send bank details' }, key())) as {
      status: string;
    };
    expect(res.status).toBe('INFO_REQUESTED');
    expect(publish).not.toHaveBeenCalled();

    const withAccount = harness(anApplication());
    await withAccount.service.requestInfoApplication(admin, ALL, APP_ID, { items: ['BANK_DETAILS'], message: 'Send bank details' }, key());
    expect(publish).toHaveBeenCalledWith(
      'farmer.application.info_requested',
      expect.objectContaining({ userId: IDS.userFarmer, applicationId: APP_ID, items: ['BANK_DETAILS'], message: 'Send bank details' }),
    );
  });
});

describe('BR-218: review notes and structured history', () => {
  it('BR-218a: a note writes one NOTE history row with actor and text and leaves the status unchanged', async () => {
    const h = harness(anApplication({ status: 'FARM_VERIFICATION' }));
    const detail = (await h.service.addApplicationNote(admin, ALL, APP_ID, { note: 'Field visit booked for Monday' }, key())) as {
      status: string;
      reviewHistory: Array<Record<string, unknown>>;
    };
    expect(detail.status).toBe('FARM_VERIFICATION');
    expect(h.history).toEqual([
      expect.objectContaining({
        event_type: 'NOTE',
        from_status: 'FARM_VERIFICATION',
        to_status: 'FARM_VERIFICATION',
        actor_id: REVIEWER,
        note: 'Field visit booked for Monday',
      }),
    ]);
    expect(detail.reviewHistory.at(-1)).toMatchObject({ eventType: 'NOTE', note: 'Field visit booked for Monday', actorId: REVIEWER });
    expect(auditRows()).toHaveLength(1);
  });

  it('BR-218a: a note on a draft or a terminal application is 409, and an empty note is 422', async () => {
    for (const app of [
      anApplication({ status: 'SUBMITTED', is_draft: true }),
      anApplication({ status: 'APPROVED' }),
      anApplication({ status: 'REJECTED' }),
    ]) {
      const h = harness(app);
      await expect(h.service.addApplicationNote(admin, ALL, APP_ID, { note: 'x' }, key())).rejects.toMatchObject({
        code: 'INVALID_STATE_TRANSITION',
        status: 409,
      });
    }
    expect(addApplicationNoteBody.safeParse({ note: '   ' }).success).toBe(false);
  });

  it('BR-218b: reject stores the reasonCode structured as well as in the note text', async () => {
    const h = harness(anApplication({ status: 'FARM_VERIFICATION' }));
    const res = (await h.service.rejectApplication(
      admin,
      ALL,
      APP_ID,
      { reasonCode: 'LAND_NOT_VERIFIED', reason: 'Boundary overlaps forest land' },
      key(),
    )) as { status: string; rejectionReasonCode: string | null };
    expect(res.status).toBe('REJECTED');
    expect(h.history.at(-1)).toMatchObject({
      to_status: 'REJECTED',
      reason_code: 'LAND_NOT_VERIFIED',
      note: '[LAND_NOT_VERIFIED] Boundary overlaps forest land',
    });
  });
});

describe('BR-219: document carry-over on approval', () => {
  it('BR-219a/b: approval copies every recognised document into farmer_documents with its review state; a stray URL is not copied and is named in the audit row', async () => {
    const uploads = [
      { storage_key: 'farmer-applications/aadhaar.pdf', mime_type: 'application/pdf', size_bytes: '1000' },
      { storage_key: 'farmer-applications/patta.pdf', mime_type: 'application/pdf', size_bytes: '2000' },
      { storage_key: 'farmer-applications/photo.jpg', mime_type: 'image/jpeg', size_bytes: '3000' },
    ];
    const h = harness(
      anApplication({
        status: 'FARM_VERIFICATION',
        step4_documents: {
          documents: [
            { docType: 'ID_PROOF', fileUrl: ID_URL },
            { docType: 'FARM_DOC', fileUrl: PATTA_URL },
            { docType: 'OTHER', fileUrl: OTHER_URL },
            { docType: 'CERTIFICATE', fileUrl: STRAY_URL },
          ],
        },
      }),
      uploads,
    );
    await h.service.reviewApplicationDocument(admin, ALL, APP_ID, ID_KEY, { decision: 'VERIFIED' }, key());
    await h.service.reviewApplicationDocument(admin, ALL, APP_ID, PATTA_KEY, { decision: 'VERIFIED' }, key());
    await h.service.reviewApplicationFmb(admin, ALL, APP_ID, 'loc-a', { decision: 'VERIFIED' }, key());
    capture.queries.length = 0;

    await h.service.approveApplication(admin, ALL, APP_ID, {}, key());

    expect(h.farmerDocuments).toHaveLength(3);
    const byType = new Map(h.farmerDocuments.map((d) => [d['docType'], d]));
    expect(byType.get('ID_PROOF')).toMatchObject({
      storageKey: 'farmer-applications/aadhaar.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1000,
      isMandatory: true,
      verificationStatus: 'VERIFIED',
      verifiedBy: REVIEWER,
      rejectReason: null,
    });
    expect(byType.get('ID_PROOF')!['verifiedAt']).toBeInstanceOf(Date);
    expect(byType.get('OTHER')).toMatchObject({
      isMandatory: false,
      verificationStatus: 'UNVERIFIED',
      verifiedBy: null,
      verifiedAt: null,
    });
    expect(byType.has('CERTIFICATE')).toBe(false);

    const approveAudit = auditRows().find((q) => q.params.includes('farmer.application.approve'));
    expect(approveAudit).toBeDefined();
    expect(JSON.stringify(approveAudit!.params)).toContain(documentKeyOf('CERTIFICATE', STRAY_URL));
  });

  it('BR-219a: a REJECTED document never reaches farmer_documents, because approval refuses first (BR-214)', async () => {
    const uploads = [
      { storage_key: 'farmer-applications/aadhaar.pdf', mime_type: 'application/pdf', size_bytes: '1000' },
      { storage_key: 'farmer-applications/patta.pdf', mime_type: 'application/pdf', size_bytes: '2000' },
      { storage_key: 'farmer-applications/photo.jpg', mime_type: 'image/jpeg', size_bytes: '3000' },
    ];
    const h = harness(
      anApplication({
        status: 'FARM_VERIFICATION',
        step4_documents: {
          documents: [
            { docType: 'ID_PROOF', fileUrl: ID_URL },
            { docType: 'FARM_DOC', fileUrl: PATTA_URL },
            { docType: 'OTHER', fileUrl: OTHER_URL },
          ],
        },
      }),
      uploads,
    );
    await h.service.reviewApplicationDocument(admin, ALL, APP_ID, ID_KEY, { decision: 'VERIFIED' }, key());
    await h.service.reviewApplicationDocument(admin, ALL, APP_ID, PATTA_KEY, { decision: 'VERIFIED' }, key());
    await h.service.reviewApplicationDocument(admin, ALL, APP_ID, OTHER_KEY, { decision: 'REJECTED', reason: 'Not a farm photo' }, key());
    await h.service.reviewApplicationFmb(admin, ALL, APP_ID, 'loc-a', { decision: 'VERIFIED' }, key());

    // Approval is refused while any document is REJECTED (BR-214), so nothing is copied.
    await expect(h.service.approveApplication(admin, ALL, APP_ID, {}, key())).rejects.toMatchObject({
      code: 'APPLICATION_DOCUMENTS_NOT_VERIFIED',
    });
    expect(h.farmerDocuments).toHaveLength(0);
  });
});
