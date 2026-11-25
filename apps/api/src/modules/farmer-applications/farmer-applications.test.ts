import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { PoolClient } from 'pg';
import { createApp } from '../../app.js';
import type * as PoolModule from '../../db/pool.js';
import { RoleCode } from '@tohfa/shared-types';
import type { IdempotencyStore } from '../../http/idempotency.js';
import { AppError } from '../../http/problem.js';
import type { UploadsService } from '../uploads/uploads.service.js';
import type { SignUploadResponse } from '../uploads/uploads.schema.js';
import { aScope, anActor, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import { ensureStandardUsers, requireDatabaseTables } from '../../test/dbFixtures.js';
import { markApplicationReviewedForApproval } from '../../test/applicationReview.js';
import { purgeFarmerApplicationsByIds } from '../../test/committedFixtureCleanup.js';
import {
  applicationDocuments,
  fmbFingerprintOf,
  locationIdOf,
  type ApplicationReviewRow,
} from './farmer-applications.review.js';
import { calculatePolygonMetrics } from './geo.utils.js';
import {
  createFarmerApplicationsService,
  isValidTransition,
} from './farmer-applications.service.js';

/** An Idempotency-Key store that never touches the (recording) transaction. */
function inMemoryIdempotency(): IdempotencyStore {
  return { claim: async () => ({ claimed: true }), complete: async () => undefined };
}

/** Admin scope for the service-level approval tests: SA/TA hold `all` (docs/rbac.json). */
const ALL_SCOPE = aScope({ permission: 'farmer.application.approve' });

/**
 * BR-214: approval requires FARM_VERIFICATION, ID_PROOF + FARM_DOC present and VERIFIED, and
 * every location's FMB VERIFIED. The approval tests in this file are about what approval WRITES,
 * not about those gates (application-review.test.ts is), so their applications carry the two
 * required documents and the mocked repo reports every current document and boundary VERIFIED.
 */
const REVIEW_READY_DOCUMENTS = {
  documents: [
    { docType: 'ID_PROOF', fileUrl: 'https://example.com/id.pdf' },
    { docType: 'FARM_DOC', fileUrl: 'https://example.com/farm.pdf' },
  ],
};

function verifiedReviewsFor(app: FarmerApplicationRow | null): ApplicationReviewRow[] {
  if (app === null) return [];
  const at = new Date('2026-11-25T00:00:00Z');
  const base = { application_id: app.id, decision: 'VERIFIED' as const, reason: null, reviewed_by: IDS.userSuperAdmin, created_at: at };
  const rows: ApplicationReviewRow[] = applicationDocuments(app.step4_documents, []).map((d, i) => ({
    ...base,
    id: `doc-review-${i}`,
    subject_type: 'DOCUMENT' as const,
    subject_key: d.documentKey,
    content_fingerprint: d.documentKey,
  }));
  const listed = (app.step3_location as Record<string, unknown> | null)?.['locations'];
  (Array.isArray(listed) ? listed : []).forEach((entry, index) => {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) return;
    const location = entry as Record<string, unknown>;
    rows.push({
      ...base,
      id: `fmb-review-${index}`,
      subject_type: 'FMB',
      subject_key: locationIdOf(location, index),
      content_fingerprint: fmbFingerprintOf(location),
    });
  });
  return rows;
}

/**
 * Integration counterpart: records the reviews the review endpoints would and moves the
 * application to FARM_VERIFICATION, so an approval test reaches the code it is about.
 */
async function readyForApproval(appId: string): Promise<void> {
  const { pool } = await import('../../db/pool.js');
  await ensureStandardUsers(pool, 'userSuperAdmin');
  await markApplicationReviewedForApproval(pool, appId, IDS.userSuperAdmin);
}
import type {
  FarmerApplicationRow,
  FarmerApplicationsRepo,
  FarmerProfileRow,
  StatusHistoryRow,
} from './farmer-applications.repo.js';

/**
 * `approveApplication` writes the `farms` rows with raw `tx.query`, not through the
 * repo, so a mocked repo cannot observe them — the boundary columns would be
 * untestable without intercepting the transaction itself.
 *
 * This intercepts `withTransaction` ONLY while a test opts in by setting
 * `capture.tx`, and otherwise delegates to the real implementation. DATABASE_URL
 * is set for this suite, so the `describeIfDatabase` block further down really
 * connects to Postgres; a blanket replacement would silently neuter it. `pool`
 * itself is never replaced, for the same reason.
 */
const capture = vi.hoisted(() => ({
  tx: null as null | { query: (sql: string, params?: unknown[]) => Promise<unknown> },
}));

vi.mock('../../db/pool.js', async (importOriginal) => {
  const actual = await importOriginal<typeof PoolModule>();
  return {
    ...actual,
    withTransaction: async <T>(fn: (tx: PoolClient) => Promise<T>): Promise<T> =>
      capture.tx === null ? actual.withTransaction(fn) : fn(capture.tx as unknown as PoolClient),
  };
});

interface RecordedQuery {
  sql: string;
  params: unknown[];
}

interface RecordingTx {
  queries: RecordedQuery[];
  query: (sql: string, params?: unknown[]) => Promise<unknown>;
}

function recordingTx(): RecordingTx {
  const queries: RecordedQuery[] = [];
  return {
    queries,
    // Every statement in approveApplication that uses RETURNING expects a row with
    // an `id` (the farmers insert, and writeAuditLog, which throws without one).
    query: async (sql: string, params: unknown[] = []) => {
      queries.push({ sql, params });
      return { rows: [{ id: '30000000-0000-4000-8000-0000000000aa' }], rowCount: 1 };
    },
  };
}

/** The `INSERT INTO farms` statements, in the order approveApplication issued them. */
function farmInserts(tx: RecordingTx): RecordedQuery[] {
  return tx.queries.filter((q) => q.sql.includes('INSERT INTO farms'));
}

/** Locate a farms insert by its `name` parameter, never by array position. */
function farmInsertNamed(tx: RecordingTx, name: string): RecordedQuery {
  const found = farmInserts(tx).find((q) => q.params[1] === name);
  if (found === undefined) {
    throw new Error(`no INSERT INTO farms was recorded for "${name}"`);
  }
  return found;
}

/**
 * The single `INSERT INTO farmers` statement. "INSERT INTO farms" is not a prefix of
 * it (`farmers` diverges at the 5th character), so the two matchers cannot collide.
 */
function farmerInsert(tx: RecordingTx): RecordedQuery {
  const found = tx.queries.find((q) => q.sql.includes('INSERT INTO farmers'));
  if (found === undefined) {
    throw new Error('no INSERT INTO farmers was recorded');
  }
  return found;
}

/**
 * `farming_experience_years` is the 4th bound parameter of that insert. Asserting the
 * parameter itself — rather than merely that the statement ran — is the whole point:
 * the regression this guards wrote a hard 0 into the column for every farmer.
 */
const FARMER_EXPERIENCE_PARAM_INDEX = 3;

function mockFarmerApplicationsRepo(
  initialApp?: Partial<FarmerApplicationRow>,
  profileOverrides?: Partial<FarmerProfileRow>,
): FarmerApplicationsRepo {
  let appState: FarmerApplicationRow | null = initialApp
    ? ({
        id: initialApp.id ?? '11111111-1111-1111-1111-111111111111',
        mobile: initialApp.mobile ?? '+919812345678',
        full_name: initialApp.full_name ?? 'Murugan S',
        preferred_locale: initialApp.preferred_locale ?? 'en',
        status: initialApp.status ?? 'SUBMITTED',
        is_draft: initialApp.is_draft ?? (initialApp.status && initialApp.status !== 'SUBMITTED' ? false : true),
        current_step: initialApp.current_step ?? 1,
        completed_steps: initialApp.completed_steps ?? [],
        step1_personal: initialApp.step1_personal ?? {},
        step2_farm_details: initialApp.step2_farm_details ?? {},
        step3_location: initialApp.step3_location ?? {},
        step4_documents: initialApp.step4_documents ?? {},
        user_id: initialApp.user_id ?? '00000000-0000-0000-0000-000000000002',
        farmer_id: initialApp.farmer_id ?? null,
        submitted_at: initialApp.submitted_at ?? null,
        created_at: new Date(),
        updated_at: null,
      } as FarmerApplicationRow)
    : null;

  const history: StatusHistoryRow[] = [];

  const mockProfile: FarmerProfileRow = {
    id: IDS.farmer,
    user_id: '00000000-0000-0000-0000-000000000002',
    tohfa_farmer_id: 'TOHFA-F-2026-0001',
    full_name: 'Murugan S',
    mobile: '+919812345678',
    preferred_locale: 'ta',
    zone_id: IDS.zoneNorth,
    zone_name: 'Ooty North',
    farming_experience_years: 15,
    address_line1: '12 Organic Valley',
    village: 'Ithalar',
    taluk: 'Ooty',
    district: 'The Nilgiris',
    aadhaar_last4: '4321',
    kyc_status: 'VERIFIED',
    application_status: 'APPROVED',
    overall_rating: 4.8,
    rating_tier_code: null,
    is_market_blocked: false,
    market_block_reason: null,
    dob: null,
    gender: null,
    created_at: new Date(),
    ...profileOverrides,
  };

  return {
    createApplication: async (_db, params) => {
      appState = {
        id: '11111111-1111-1111-1111-111111111111',
        mobile: params.mobile,
        full_name: params.fullName,
        preferred_locale: params.preferredLocale,
        status: 'SUBMITTED',
        is_draft: true,
        current_step: 1,
        completed_steps: [],
        step1_personal: {},
        step2_farm_details: {},
        step3_location: {},
        step4_documents: {},
        user_id: params.userId ?? null,
        farmer_id: null,
        zone_id: null,
        submitted_at: null,
        created_at: new Date(),
        updated_at: null,
      };
      return appState;
    },
    findById: async (_db, id) => {
      if (appState && appState.id === id) return appState;
      return null;
    },
    findByIdForUpdate: async (_db, id) => {
      if (appState && appState.id === id) return appState;
      return null;
    },
    findLiveByMobile: async (_db, mobile) => {
      if (appState && appState.mobile === mobile && appState.status !== 'APPROVED' && appState.status !== 'REJECTED') {
        return appState;
      }
      return null;
    },
    findZoneByTaluk: async () => null,
    isZoneActive: async () => true,
    updateStepData: async (_db, id, step, stepData, completedSteps) => {
      if (appState && appState.id === id) {
        if (step === 1) appState.step1_personal = stepData;
        if (step === 2) appState.step2_farm_details = stepData;
        if (step === 3) appState.step3_location = stepData;
        if (step === 4) appState.step4_documents = stepData;
        appState.completed_steps = completedSteps;
        return appState;
      }
      return null;
    },
    transitionStatus: async (_db, id, fromStatus, toStatus, _actorId, _note, zoneId) => {
      if (appState && appState.id === id) {
        appState.status = toStatus;
        if (zoneId !== undefined) {
          appState.zone_id = zoneId;
        }
        if (toStatus === 'DOCS_REVIEW') {
          appState.is_draft = false;
          appState.submitted_at = new Date();
        }
        history.push({
          id: '22222222-2222-2222-2222-222222222222',
          application_id: id,
          from_status: fromStatus,
          to_status: toStatus,
          actor_id: null,
          note: null,
          created_at: new Date(),
          event_type: 'TRANSITION',
          reason_code: null,
          requested_items: null,
        });
        return appState;
      }
      throw new Error('Application not found');
    },
    insertNote: async (_db, row) => {
      const entry: StatusHistoryRow = {
        id: '22222222-2222-2222-2222-222222222223',
        application_id: row.applicationId,
        from_status: row.status,
        to_status: row.status,
        actor_id: row.actorId,
        note: row.note,
        created_at: new Date(),
        event_type: 'NOTE',
        reason_code: null,
        requested_items: null,
      };
      history.push(entry);
      return entry;
    },
    listReviews: async () => verifiedReviewsFor(appState),
    insertReview: async () => {
      throw new Error('the legacy suite does not record reviews; see application-review.test.ts');
    },
    findApplicationUploads: async () => [],
    insertFarmerDocument: async () => ({ id: '30000000-0000-4000-8000-0000000000dd' }),
    getStatusHistory: async () => history,
    listAdminApplications: async () => ({
      items: appState ? [appState] : [],
      nextCursor: null,
      hasMore: false,
    }),
    findFarmerByUserId: async () => mockProfile,
    findFarmerById: async () => mockProfile,
    updateFarmerProfile: async () => mockProfile,
    allocateNextTohfaFarmerId: async () => 'TOHFA-F-2026-0002',
    // BR-135 is tested in farmer-applications.role-exclusivity.test.ts; these applicants hold no admin role.
    findApplicantLiveRoles: async () => [],
  };
}

describe('Farmer Applications & BR-33/BR-36 Test Contracts', () => {
  // Interception is opt-in and must never leak: the PostgreSQL block below has to
  // see the real `withTransaction`.
  afterEach(() => {
    capture.tx = null;
  });

  describe('State Machine Transitions', () => {
    // BR-214 (owner decisions 2026-11-25): AUDIT is out of the flow; approval is from
    // FARM_VERIFICATION; INFO_REQUESTED is a stored side trip (BR-217).
    it('allows legal forward transitions and rejects illegal skips', () => {
      expect(isValidTransition('SUBMITTED', 'DOCS_REVIEW')).toBe(true);
      expect(isValidTransition('DOCS_REVIEW', 'FARM_VERIFICATION')).toBe(true);
      expect(isValidTransition('FARM_VERIFICATION', 'APPROVED')).toBe(true);
      expect(isValidTransition('DOCS_REVIEW', 'INFO_REQUESTED')).toBe(true);
      expect(isValidTransition('FARM_VERIFICATION', 'INFO_REQUESTED')).toBe(true);
      expect(isValidTransition('INFO_REQUESTED', 'DOCS_REVIEW')).toBe(true);

      // Rejection is possible from any live stage of the flow
      expect(isValidTransition('SUBMITTED', 'REJECTED')).toBe(true);
      expect(isValidTransition('DOCS_REVIEW', 'REJECTED')).toBe(true);
      expect(isValidTransition('FARM_VERIFICATION', 'REJECTED')).toBe(true);
      expect(isValidTransition('INFO_REQUESTED', 'REJECTED')).toBe(true);

      // Illegal skips and rollbacks, and nothing in or out of AUDIT
      expect(isValidTransition('SUBMITTED', 'APPROVED')).toBe(false);
      expect(isValidTransition('DOCS_REVIEW', 'APPROVED')).toBe(false);
      expect(isValidTransition('FARM_VERIFICATION', 'AUDIT')).toBe(false);
      expect(isValidTransition('AUDIT', 'APPROVED')).toBe(false);
      expect(isValidTransition('AUDIT', 'REJECTED')).toBe(false);
      expect(isValidTransition('APPROVED', 'SUBMITTED')).toBe(false);
      expect(isValidTransition('REJECTED', 'APPROVED')).toBe(false);
    });

    it('throws INVALID_STATE_TRANSITION on illegal state transition attempt', async () => {
      const repo = mockFarmerApplicationsRepo({
        id: '11111111-1111-1111-1111-111111111111',
        status: 'SUBMITTED',
      });
      const service = createFarmerApplicationsService(repo);
      const actor = anActor({ userId: IDS.userSuperAdmin });

      // A draft (SUBMITTED, is_draft) cannot be approved: only FARM_VERIFICATION can.
      capture.tx = recordingTx();
      await expect(
        service.approveApplication(actor, ALL_SCOPE, '11111111-1111-1111-1111-111111111111', {}, newId()),
      ).rejects.toThrow(expect.objectContaining({ code: 'INVALID_STATE_TRANSITION' }));
    });
  });

  describe('BR-33: Locked Fields & Masked Aadhaar', () => {
    it('BR-33: farmer cannot update locked mobile or Aadhaar fields', async () => {
      const repo = mockFarmerApplicationsRepo();
      const service = createFarmerApplicationsService(repo);
      const actor = anActor({ userId: '00000000-0000-0000-0000-000000000002' });

      // Attempt to patch mobile
      await expect(
        service.updateMyProfile(actor, {
          mobile: '+919999999999',
          fullName: 'Hacker Name',
        }),
      ).rejects.toThrow(expect.objectContaining({ code: 'FIELD_LOCKED' }));

      // Attempt to patch aadhaar
      await expect(
        service.updateMyProfile(actor, {
          aadhaar: '123456789012',
        }),
      ).rejects.toThrow(expect.objectContaining({ code: 'FIELD_LOCKED' }));
    });

    it('BR-33: farmer profile response returns masked aadhaar_last4 only, never raw 12-digit number', async () => {
      const repo = mockFarmerApplicationsRepo();
      const service = createFarmerApplicationsService(repo);
      const actor = anActor({ userId: '00000000-0000-0000-0000-000000000002' });

      const profile = (await service.getMyProfile(actor)) as Record<string, unknown>;
      expect(profile).toHaveProperty('aadhaarLast4', '4321');
      expect(profile).not.toHaveProperty('aadhaar');
      expect(profile).not.toHaveProperty('aadhaarNumber');
      expect(profile).not.toHaveProperty('aadhaar_token');
    });

    it('BR-33b: updateStep strips a full aadhaarNumber from the step-1 payload before it is ever persisted, regardless of what the client sends', async () => {
      // db/migrations/0003_farmers_and_farms.sql's column comments are explicit:
      // the full Aadhaar number is never stored, in any column, in any document
      // row, in any log. This is the server-side half of that guarantee -- it must
      // hold even if a client (current or future) sends the full number, since
      // updateStep's step===1 branch spreads the payload verbatim with no schema
      // enforcement.
      const repo = mockFarmerApplicationsRepo({
        id: '11111111-1111-1111-1111-111111111111',
        user_id: '00000000-0000-0000-0000-000000000002',
        status: 'SUBMITTED',
      });
      const service = createFarmerApplicationsService(repo);
      const actor = anActor({ userId: '00000000-0000-0000-0000-000000000002' });

      const updated = (await service.updateStep(actor, '11111111-1111-1111-1111-111111111111', 1, {
        fullName: 'Devika R',
        aadhaarNumber: '234567890123',
        aadhaarLast4: '0123',
      })) as { step1Personal: Record<string, unknown> };

      expect(updated.step1Personal).not.toHaveProperty('aadhaarNumber');
      expect(JSON.stringify(updated.step1Personal)).not.toContain('234567890123');
      // The rest of the payload -- including the field this bug's fix must NOT
      // touch -- survives untouched.
      expect(updated.step1Personal['aadhaarLast4']).toBe('0123');
      expect(updated.step1Personal['fullName']).toBe('Devika R');
    });
  });

  describe('BR-36: Own-Data Scoping', () => {
    it('BR-36: accessing another farmer application returns 404 NOT_FOUND, not 403', async () => {
      const repo = mockFarmerApplicationsRepo({
        id: '11111111-1111-1111-1111-111111111111',
        user_id: '00000000-0000-0000-0000-000000000002', // Belongs to Farmer 2
      });
      const service = createFarmerApplicationsService(repo);

      // Farmer 9 attempts to read Farmer 2's application
      const attackerActor = anActor({
        userId: '00000000-0000-0000-0000-000000000009',
        roles: [{ code: RoleCode.FARMER }],
      });

      await expect(
        service.getStatusTimeline(attackerActor, '11111111-1111-1111-1111-111111111111'),
      ).rejects.toThrow(expect.objectContaining({ code: 'NOT_FOUND' }));

      await expect(
        service.updateStep(attackerActor, '11111111-1111-1111-1111-111111111111', 1, {
          fullName: 'Malicious Update',
        }),
      ).rejects.toThrow(expect.objectContaining({ code: 'NOT_FOUND' }));
    });
  });

  describe('Recovering a lost draft (GET /farmers/applications/:id, and CONFLICT meta)', () => {
    const APP_ID = '11111111-1111-1111-1111-111111111111';
    const OWNER_USER_ID = '00000000-0000-0000-0000-000000000002';

    it('createDraft rejects a duplicate live mobile number with meta carrying the existing application\'s id, status and currentStep', async () => {
      // A farmer who lost their local draft (reinstalled app, cleared storage, new
      // device) hits this 409 when they try to start over. The whole point of this
      // fix is that the response now tells them where the original application is.
      const repo = mockFarmerApplicationsRepo({
        id: APP_ID,
        mobile: '+919812345678',
        status: 'DOCS_REVIEW',
        current_step: 3,
      });
      const service = createFarmerApplicationsService(repo);

      const err = await service
        .createDraft({ mobile: '+919812345678', fullName: 'Someone Else', preferredLocale: 'en' })
        .catch((e: unknown) => e);

      expect(err).toBeInstanceOf(AppError);
      const appError = err as AppError;
      expect(appError.code).toBe('CONFLICT');
      expect(appError.status).toBe(409);
      // camelCase, matching mapApplicationResponse's own field names for the same
      // underlying columns -- not invented spellings.
      expect(appError.meta).toEqual({
        applicationId: APP_ID,
        status: 'DOCS_REVIEW',
        currentStep: 3,
      });
    });

    it('getFullDraft returns the same full shape createDraft returns, with the real step data populated', async () => {
      const repo = mockFarmerApplicationsRepo({
        id: APP_ID,
        user_id: OWNER_USER_ID,
        status: 'SUBMITTED',
        step1_personal: { fullName: 'Murugan S', village: 'Ithalar' },
        step2_farm_details: { farmName: 'Great Earth Organic', experienceYears: 12 },
      });
      const service = createFarmerApplicationsService(repo);
      const actor = anActor({ userId: OWNER_USER_ID });

      const result = (await service.getFullDraft(actor, APP_ID)) as Record<string, unknown>;

      // The bare-resource fetch is not a placeholder/empty shell -- it carries the
      // real step data already saved, exactly what mapApplicationResponse produces.
      expect(result).toMatchObject({
        id: APP_ID,
        status: 'SUBMITTED',
        step1Personal: { fullName: 'Murugan S', village: 'Ithalar' },
        step2FarmDetails: { farmName: 'Great Earth Organic', experienceYears: 12 },
      });
    });

    it('getFullDraft returns NOT_FOUND for a nonexistent application id', async () => {
      const repo = mockFarmerApplicationsRepo(); // no app created
      const service = createFarmerApplicationsService(repo);

      await expect(
        service.getFullDraft(undefined, '99999999-9999-9999-9999-999999999999'),
      ).rejects.toThrow(expect.objectContaining({ code: 'NOT_FOUND' }));
    });

    it('BR-36: getFullDraft returns NOT_FOUND (never 403) when the caller is authenticated as a different farmer', async () => {
      const repo = mockFarmerApplicationsRepo({
        id: APP_ID,
        user_id: OWNER_USER_ID, // belongs to a different farmer
      });
      const service = createFarmerApplicationsService(repo);

      const attackerActor = anActor({
        userId: '00000000-0000-0000-0000-000000000009',
        roles: [{ code: RoleCode.FARMER }],
      });

      const err = await service.getFullDraft(attackerActor, APP_ID).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).code).toBe('NOT_FOUND');
      expect((err as AppError).status).toBe(404);
    });

    it('an admin (SUPER_ADMIN/TOHFA_ADMIN) can still getFullDraft an application owned by someone else', async () => {
      const repo = mockFarmerApplicationsRepo({
        id: APP_ID,
        user_id: OWNER_USER_ID,
      });
      const service = createFarmerApplicationsService(repo);
      const adminActor = anActor({ userId: IDS.userSuperAdmin, roles: [{ code: RoleCode.SUPER_ADMIN }] });

      await expect(service.getFullDraft(adminActor, APP_ID)).resolves.toMatchObject({ id: APP_ID });
    });
  });

  describe('Registration-scoped upload signing (POST /applications/:id/uploads/sign)', () => {
    const APP_ID = '11111111-1111-1111-1111-111111111111';
    const SIGN_BODY = {
      purpose: 'FARMER_DOCUMENT' as const,
      contentType: 'application/pdf' as const,
      sizeBytes: 1000,
    };

    /** Records every call so a test can assert what ownership was forwarded, without ever
     * touching real blob storage or the `uploads` table -- this method's own mechanics are
     * covered separately in uploads.test.ts. */
    function mockUploadsSvc(): Pick<UploadsService, 'signUploadForOwner'> & {
      calls: Array<{ ownership: unknown; body: unknown }>;
    } {
      const calls: Array<{ ownership: unknown; body: unknown }> = [];
      const target: SignUploadResponse = {
        id: '22222222-2222-2222-2222-222222222222',
        uploadUrl: 'http://localhost:3000/v1/uploads/mock/farmer_document/abc.pdf',
        fileUrl: 'http://localhost:3000/v1/uploads/mock/farmer_document/abc.pdf',
        storageKey: 'farmer_document/abc.pdf',
        method: 'PUT',
        headers: {},
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        resumable: false,
      };
      return {
        calls,
        signUploadForOwner: async (ownership, body) => {
          calls.push({ ownership, body });
          return target;
        },
      };
    }

    it('returns a signed upload target for a live application, with no Actor involved at all', async () => {
      const repo = mockFarmerApplicationsRepo({ id: APP_ID, status: 'SUBMITTED' });
      const uploadsSvc = mockUploadsSvc();
      const service = createFarmerApplicationsService(repo, uploadsSvc);

      const result = await service.requestDocumentUploadUrl(APP_ID, SIGN_BODY);

      expect(result).toHaveProperty('uploadUrl');
      expect(result).toHaveProperty('fileUrl');
      expect(uploadsSvc.calls).toHaveLength(1);
      // The upload is recorded against the APPLICATION, never a user -- there is no user yet.
      expect(uploadsSvc.calls[0]!.ownership).toEqual({
        entityType: 'farmer_application',
        entityId: APP_ID,
        isPublic: false,
      });
      expect(uploadsSvc.calls[0]!.body).toEqual(SIGN_BODY);
    });

    it.each(['DOCS_REVIEW', 'FARM_VERIFICATION', 'AUDIT'] as const)(
      'also succeeds for the non-SUBMITTED live status %s',
      async (status) => {
        const repo = mockFarmerApplicationsRepo({ id: APP_ID, status });
        const uploadsSvc = mockUploadsSvc();
        const service = createFarmerApplicationsService(repo, uploadsSvc);

        await expect(service.requestDocumentUploadUrl(APP_ID, SIGN_BODY)).resolves.toHaveProperty(
          'uploadUrl',
        );
        expect(uploadsSvc.calls).toHaveLength(1);
      },
    );

    it.each(['APPROVED', 'REJECTED'] as const)(
      'rejects a terminal %s application as NOT_FOUND, and never signs an upload for it',
      async (status) => {
        const repo = mockFarmerApplicationsRepo({ id: APP_ID, status });
        const uploadsSvc = mockUploadsSvc();
        const service = createFarmerApplicationsService(repo, uploadsSvc);

        await expect(service.requestDocumentUploadUrl(APP_ID, SIGN_BODY)).rejects.toThrow(
          expect.objectContaining({ code: 'NOT_FOUND' }),
        );
        // The status check happens before any storage interaction -- a terminal
        // application can never mint a real upload URL through this endpoint.
        expect(uploadsSvc.calls).toHaveLength(0);
      },
    );

    it('rejects a nonexistent application id as NOT_FOUND, identical in shape to a terminal one', async () => {
      const repo = mockFarmerApplicationsRepo({ id: APP_ID, status: 'APPROVED' });
      const uploadsSvc = mockUploadsSvc();
      const service = createFarmerApplicationsService(repo, uploadsSvc);

      const terminal = await service
        .requestDocumentUploadUrl(APP_ID, SIGN_BODY)
        .catch((err: unknown) => err);
      const missing = await service
        .requestDocumentUploadUrl('99999999-9999-9999-9999-999999999999', SIGN_BODY)
        .catch((err: unknown) => err);

      expect(terminal).toBeInstanceOf(AppError);
      expect(missing).toBeInstanceOf(AppError);
      const terminalErr = terminal as AppError;
      const missingErr = missing as AppError;

      // Same code, same HTTP status, same detail text -- an outside caller cannot tell
      // "exists but terminal" from "never existed" apart by the response shape, which is
      // the whole point of this module's BR-36-style enumeration prevention.
      expect(terminalErr.code).toBe('NOT_FOUND');
      expect(missingErr.code).toBe('NOT_FOUND');
      expect(terminalErr.status).toBe(missingErr.status);
      expect(terminalErr.detail).toBe(missingErr.detail);
      expect(uploadsSvc.calls).toHaveLength(0);
    });
  });

  describe('5-Step Draft & Submit Validation', () => {
    it('refuses submit if mandatory ID_PROOF or FARM_DOC is missing', async () => {
      const repo = mockFarmerApplicationsRepo({
        id: '11111111-1111-1111-1111-111111111111',
        user_id: '00000000-0000-0000-0000-000000000002',
        step4_documents: {
          documents: [
            // Only CERTIFICATE is attached (optional) — missing mandatory ID_PROOF and FARM_DOC
            { docType: 'CERTIFICATE', fileUrl: 'https://blob.storage/cert.pdf' },
          ],
        },
      });
      const service = createFarmerApplicationsService(repo);
      const actor = anActor({ userId: '00000000-0000-0000-0000-000000000002' });

      await expect(
        service.submitApplication(actor, '11111111-1111-1111-1111-111111111111'),
      ).rejects.toThrow(expect.objectContaining({ code: 'VALIDATION_FAILED' }));
    });

    it('submits successfully when ID_PROOF and FARM_DOC are provided and a located farm exists (BR-69)', async () => {
      const repo = mockFarmerApplicationsRepo({
        id: '11111111-1111-1111-1111-111111111111',
        user_id: '00000000-0000-0000-0000-000000000002',
        status: 'SUBMITTED',
        step3_location: {
          locations: [{ id: 'loc-a', label: 'Home plot', areaAcres: 2, latitude: 11.41, longitude: 76.69 }],
        },
        step4_documents: {
          documents: [
            { docType: 'ID_PROOF', fileUrl: 'https://blob.storage/aadhaar.pdf' },
            { docType: 'FARM_DOC', fileUrl: 'https://blob.storage/patta.pdf' },
          ],
        },
      });
      const service = createFarmerApplicationsService(repo);
      const actor = anActor({ userId: '00000000-0000-0000-0000-000000000002' });

      const submitted = (await service.submitApplication(
        actor,
        '11111111-1111-1111-1111-111111111111',
      )) as Record<string, unknown>;

      expect(submitted.status).toBe('DOCS_REVIEW');
      expect(submitted.isDraft).toBe(false);
    });

    it('a repeat submit on an application already past SUBMITTED (is_draft: false) returns the current state instead of throwing INVALID_STATE_TRANSITION, and a third call is identical -- proves true idempotency, not just "works once more"', async () => {
      // Simulates the real failure this fix addresses: the first submit already
      // succeeded server-side (status flipped SUBMITTED -> DOCS_REVIEW, is_draft
      // flipped false) but the client never saw the response -- e.g. a dropped
      // connection or a server restart mid-request -- and retries the exact same
      // call. Without the fix, `isValidTransition('DOCS_REVIEW', 'DOCS_REVIEW')`
      // is false and every retry hits INVALID_STATE_TRANSITION forever.
      const repo = mockFarmerApplicationsRepo({
        id: '11111111-1111-1111-1111-111111111111',
        user_id: '00000000-0000-0000-0000-000000000002',
        status: 'DOCS_REVIEW',
        is_draft: false,
        // Deliberately no mandatory documents -- the short-circuit must return
        // before the document check runs at all for a repeat call.
        step4_documents: {},
      });
      const service = createFarmerApplicationsService(repo);
      const actor = anActor({ userId: '00000000-0000-0000-0000-000000000002' });
      const APP_ID = '11111111-1111-1111-1111-111111111111';

      const second = (await service.submitApplication(actor, APP_ID)) as Record<string, unknown>;
      expect(second.status).toBe('DOCS_REVIEW');
      expect(second.isDraft).toBe(false);

      const third = (await service.submitApplication(actor, APP_ID)) as Record<string, unknown>;
      expect(third).toEqual(second);
    });

    it('a repeat submit on an APPROVED application also succeeds (returns the current state) rather than throwing -- is_draft is false for every terminal status alike, and the mobile client\'s success handler just navigates to whatever status comes back', async () => {
      const repo = mockFarmerApplicationsRepo({
        id: '11111111-1111-1111-1111-111111111111',
        user_id: '00000000-0000-0000-0000-000000000002',
        status: 'APPROVED',
        is_draft: false,
        step4_documents: {},
      });
      const service = createFarmerApplicationsService(repo);
      const actor = anActor({ userId: '00000000-0000-0000-0000-000000000002' });

      const result = (await service.submitApplication(
        actor,
        '11111111-1111-1111-1111-111111111111',
      )) as Record<string, unknown>;

      expect(result.status).toBe('APPROVED');
      expect(result.isDraft).toBe(false);
    });
  });

  describe('Land locations & GPS boundaries (step 3)', () => {
    const APP_ID = '11111111-1111-1111-1111-111111111111';
    const FARMER_USER_ID = '00000000-0000-0000-0000-000000000002';

    // Two plots of deliberately different size: the wide one spans twice the
    // longitude of the small one, so their areas cannot coincide by accident.
    const SMALL_PLOT_RING = [
      [76.6948, 11.41],
      [76.6953, 11.41],
      [76.6953, 11.4105],
      [76.6948, 11.4105],
      [76.6948, 11.41],
    ];
    const WIDE_PLOT_RING = [
      [76.71, 11.42],
      [76.712, 11.42],
      [76.712, 11.4205],
      [76.71, 11.4205],
      [76.71, 11.42],
    ];
    const SMALL_PLOT = { type: 'Polygon' as const, coordinates: [SMALL_PLOT_RING] };
    const WIDE_PLOT = { type: 'Polygon' as const, coordinates: [WIDE_PLOT_RING] };

    type Step3Response = {
      step3Location: { locations: Array<Record<string, unknown>> };
    };

    it('step 2 stores one singular farming operation, not an array of farms', async () => {
      const repo = mockFarmerApplicationsRepo({
        id: APP_ID,
        user_id: FARMER_USER_ID,
        status: 'SUBMITTED',
      });
      const service = createFarmerApplicationsService(repo);
      const actor = anActor({ userId: FARMER_USER_ID });

      const updated = (await service.updateStep(actor, APP_ID, 2, {
        farmName: 'Great Earth Organic',
        typeOfFarming: 'Mixed vegetables',
        experienceYears: 12,
        totalAreaAcres: 3,
        numberOfFarms: 2,
        waterSource: 'Borewell',
        primaryCrops: ['Carrot', 'Cabbage'],
      })) as { step2FarmDetails: Record<string, unknown> };

      expect(updated.step2FarmDetails).toEqual({
        farmName: 'Great Earth Organic',
        typeOfFarming: 'Mixed vegetables',
        experienceYears: 12,
        totalAreaAcres: 3,
        numberOfFarms: 2,
        waterSource: 'Borewell',
        primaryCrops: ['Carrot', 'Cabbage'],
      });
      // There is ONE farming operation per farmer: nothing may re-wrap it into a
      // per-farm array. Its name, experience, the stated total holding and the stated
      // plot count are each asked once, here. `numberOfFarms` is a claim about that
      // operation -- it is emphatically not a list of farms, and not a length taken from
      // step 3.
      expect(updated.step2FarmDetails['farms']).toBeUndefined();
      expect(updated.step2FarmDetails['farmName']).toBe('Great Earth Organic');
      expect(updated.step2FarmDetails['experienceYears']).toBe(12);
      expect(updated.step2FarmDetails['totalAreaAcres']).toBe(3);
      expect(updated.step2FarmDetails['numberOfFarms']).toBe(2);
    });

    it('step 2 farmName names the operation and never becomes a farm row name on approval', async () => {
      // `farmName` is the operation's identity ("Great Earth Organic"); each step-3 location
      // carries its own `label`, and it is the label that becomes a `farms` row's name. The two
      // are stored side by side and neither is derived from the other -- an implementation that
      // used `farmName` per farm would name every parcel of a three-plot holding identically.
      const repo = mockFarmerApplicationsRepo({
        id: APP_ID,
        user_id: FARMER_USER_ID,
        status: 'SUBMITTED',
        step3_location: {
          locations: [
            { id: 'loc-a', label: 'Home plot', areaAcres: 1.5 },
            { id: 'loc-b', label: 'River plot', areaAcres: 0.6 },
          ],
        },
      });
      const service = createFarmerApplicationsService(repo);
      const actor = anActor({ userId: FARMER_USER_ID });

      const updated = (await service.updateStep(actor, APP_ID, 2, {
        farmName: 'Great Earth Organic',
        typeOfFarming: 'Mixed vegetables',
      })) as {
        step2FarmDetails: Record<string, unknown>;
        step3Location: { locations: Array<Record<string, unknown>> };
      };

      // Stored verbatim in the step-2 JSONB, and nowhere else.
      expect(updated.step2FarmDetails['farmName']).toBe('Great Earth Organic');
      // The parcels keep their own labels; saving the operation's name did not overwrite,
      // rename or re-label any of them.
      expect(updated.step3Location.locations.map((l) => l['label'])).toEqual([
        'Home plot',
        'River plot',
      ]);
    });

    it('step 2 keeps the stated totalAreaAcres even when it disagrees with the step-3 parcel sum', async () => {
      const repo = mockFarmerApplicationsRepo({
        id: APP_ID,
        user_id: FARMER_USER_ID,
        status: 'SUBMITTED',
        // Parcels already captured and summing to 2.1 acres...
        step3_location: {
          locations: [
            { id: 'loc-a', label: 'Home plot', areaAcres: 1.5 },
            { id: 'loc-b', label: 'Hill parcel', areaAcres: 0.6 },
          ],
        },
      });
      const service = createFarmerApplicationsService(repo);
      const actor = anActor({ userId: FARMER_USER_ID });

      // ...while the farmer states 3 acres across 4 plots off their patta/chitta records.
      const updated = (await service.updateStep(actor, APP_ID, 2, {
        typeOfFarming: 'Mixed vegetables',
        totalAreaAcres: 3,
        numberOfFarms: 4,
      })) as { step2FarmDetails: Record<string, unknown> };

      // The stated claim survives verbatim. A server that "helpfully" reconciled it to
      // the 2.1-acre parcel sum would destroy the very discrepancy FARM_VERIFICATION
      // is meant to notice, so this asserts the claim, not the sum.
      expect(updated.step2FarmDetails['totalAreaAcres']).toBe(3);
      // And the mismatch is never treated as a submission blocker.
      expect(updated.step2FarmDetails['totalAreaAcresError']).toBeUndefined();
    });

    it('step 2 keeps the stated numberOfFarms even when it disagrees with the step-3 location count', async () => {
      const repo = mockFarmerApplicationsRepo({
        id: APP_ID,
        user_id: FARMER_USER_ID,
        status: 'SUBMITTED',
        // Two parcels marked on the ground...
        step3_location: {
          locations: [
            { id: 'loc-a', label: 'Home plot', areaAcres: 1.5 },
            { id: 'loc-b', label: 'Hill parcel', areaAcres: 0.6 },
          ],
        },
      });
      const service = createFarmerApplicationsService(repo);
      const actor = anActor({ userId: FARMER_USER_ID });

      // ...while the farmer's land records say they hold 5 separate plots.
      const updated = (await service.updateStep(actor, APP_ID, 2, {
        typeOfFarming: 'Mixed vegetables',
        numberOfFarms: 5,
      })) as { step2FarmDetails: Record<string, unknown> };

      // DO NOT "FIX" THIS BY DERIVING THE COUNT FROM `locations.length`. The claim is
      // what the farmer said; the locations are what they marked. Collapsing the two
      // makes the gap mathematically invisible and leaves FARM_VERIFICATION nothing to
      // notice — three unmarked plots is exactly the case that stage exists for.
      expect(updated.step2FarmDetails['numberOfFarms']).toBe(5);
      // And the mismatch is never treated as a submission blocker.
      expect(updated.step2FarmDetails['numberOfFarmsError']).toBeUndefined();
    });

    it('step 3 computes area metrics independently for each land location', async () => {
      const repo = mockFarmerApplicationsRepo({
        id: APP_ID,
        user_id: FARMER_USER_ID,
        status: 'SUBMITTED',
      });
      const service = createFarmerApplicationsService(repo);
      const actor = anActor({ userId: FARMER_USER_ID });

      const payload = {
        locations: [
          {
            id: 'loc-a',
            label: 'Home plot',
            areaAcres: 2.5,
            gpsCaptured: true,
            latitude: 11.4102,
            longitude: 76.695,
            fmbPolygon: SMALL_PLOT,
          },
          {
            id: 'loc-b',
            label: 'Hill parcel',
            areaAcres: 1.25,
            gpsCaptured: true,
            latitude: 11.4202,
            longitude: 76.711,
            fmbPolygon: WIDE_PLOT,
          },
        ],
      };

      const updated = (await service.updateStep(actor, APP_ID, 3, payload)) as Step3Response;
      const locations = updated.step3Location.locations;

      expect(locations).toHaveLength(2);
      expect(locations[0]!['label']).toBe('Home plot');
      expect(locations[1]!['label']).toBe('Hill parcel');
      // Each location is self-contained: no cross-step correlation key survives.
      expect(locations[0]!['farmId']).toBeUndefined();

      for (const entry of locations) {
        const ring = (entry['fmbPolygon'] as { coordinates: number[][][] }).coordinates[0]!;
        const expected = calculatePolygonMetrics(ring);
        expect(typeof entry['calculatedAreaAcres']).toBe('number');
        expect(typeof entry['calculatedAreaHectares']).toBe('number');
        // Derived from this entry's own ring, not a number copied out of a run.
        expect(entry['calculatedAreaAcres']).toBe(expected.areaAcres);
        expect(entry['calculatedAreaHectares']).toBe(expected.areaHectares);
      }

      // The regression guard: an implementation computing one area for the whole
      // application would have written the same value onto both locations.
      expect(locations[0]!['calculatedAreaAcres']).not.toBe(locations[1]!['calculatedAreaAcres']);
      expect(locations[0]!['calculatedAreaHectares']).not.toBe(
        locations[1]!['calculatedAreaHectares'],
      );
    });

    it('step 3 normalises a payload that is not a list of locations to an empty list', async () => {
      // The route validates only the URL params and passes `req.body` through, so a
      // malformed body really can reach the service. It must land in the canonical
      // shape without throwing — the per-location area pass iterates `locations`
      // unconditionally, so that key always has to be an array.
      //
      // A flat single-boundary object (the pre-reshape step-3 model) is deliberately
      // NOT wrapped into `locations: [payload]`: nothing sends that shape now, and
      // wrapping it would invent a parcel with no id, label or areaAcres that
      // approveApplication would go on to write as a farms row.
      const repo = mockFarmerApplicationsRepo({
        id: APP_ID,
        user_id: FARMER_USER_ID,
        status: 'SUBMITTED',
      });
      const service = createFarmerApplicationsService(repo);
      const actor = anActor({ userId: FARMER_USER_ID });

      const flat = (await service.updateStep(actor, APP_ID, 3, {
        gpsCaptured: true,
        latitude: 11.4102,
        longitude: 76.695,
        fmbPolygon: SMALL_PLOT,
      })) as Step3Response;
      expect(flat.step3Location.locations).toEqual([]);

      const empty = (await service.updateStep(actor, APP_ID, 3, null)) as Step3Response;
      expect(empty.step3Location.locations).toEqual([]);

      // A bare top-level array is still accepted as the list itself.
      const bare = (await service.updateStep(actor, APP_ID, 3, [
        { id: 'loc-a', label: 'Home plot', areaAcres: 2.5, fmbPolygon: SMALL_PLOT },
      ])) as Step3Response;
      expect(bare.step3Location.locations).toHaveLength(1);
      expect(bare.step3Location.locations[0]!['label']).toBe('Home plot');
    });

    it('approval writes one farms row per land location, each carrying its own boundary', async () => {
      const repo = mockFarmerApplicationsRepo({
        id: APP_ID,
        user_id: FARMER_USER_ID,
        status: 'FARM_VERIFICATION',
        step4_documents: REVIEW_READY_DOCUMENTS,
        step1_personal: { village: 'Ithalar', district: 'The Nilgiris' },
        step2_farm_details: {
          // The name of the operation as a whole. The two parcels below have their own
          // labels, and it is those that become the farms rows' names.
          farmName: 'Great Earth Organic',
          typeOfFarming: 'Mixed vegetables',
          experienceYears: 12,
          // Deliberately unequal to the parcel sum below (2.5 + 1.25 = 3.75): the
          // stated claim must not leak into any farms row's area_acres.
          totalAreaAcres: 10,
          // Likewise unequal to the two locations below. How many farms rows approval
          // writes comes from step 3, never from this stated claim.
          numberOfFarms: 5,
          waterSource: 'Borewell',
        },
        step3_location: {
          locations: [
            {
              id: 'loc-a',
              label: 'Upper Slope',
              areaAcres: 2.5,
              fmbPolygon: SMALL_PLOT,
              calculatedAreaAcres: 2.468,
              latitude: 11.4102,
              longitude: 76.695,
            },
            {
              id: 'loc-b',
              label: 'Lower Field',
              areaAcres: 1.25,
              fmbPolygon: WIDE_PLOT,
              calculatedAreaAcres: 1.234,
              latitude: 11.4202,
              longitude: 76.711,
            },
          ],
        },
      });
      const service = createFarmerApplicationsService(repo);
      const actor = anActor({ userId: IDS.userSuperAdmin });

      const tx = recordingTx();
      capture.tx = tx;
      await service.approveApplication(actor, ALL_SCOPE, APP_ID, {}, newId());

      expect(farmInserts(tx)).toHaveLength(2);

      // Located by label, so a row landing under the wrong name fails here.
      const upper = farmInsertNamed(tx, 'Upper Slope');
      const lower = farmInsertNamed(tx, 'Lower Field');

      // A refactor that quietly drops the boundary write must fail here, not in production.
      expect(upper.sql).toContain('ST_GeomFromGeoJSON');
      expect(upper.sql).toContain('boundary_drawn_at');

      // area_acres comes from the location's own farmer-stated acreage.
      expect(upper.params[2]).toBe(2.5);
      expect(JSON.parse(upper.params[6] as string)).toEqual(SMALL_PLOT);
      expect(upper.params[7]).toBe(2.468);
      expect(upper.params[8]).toBe(FARMER_USER_ID);
      expect(upper.params[9]).toBe(11.4102);
      expect(upper.params[10]).toBe(76.695);
      expect(upper.params[5]).toBe(true);

      expect(lower.params[2]).toBe(1.25);
      expect(JSON.parse(lower.params[6] as string)).toEqual(WIDE_PLOT);
      expect(lower.params[7]).toBe(1.234);
      expect(lower.params[8]).toBe(FARMER_USER_ID);
      expect(lower.params[9]).toBe(11.4202);
      expect(lower.params[10]).toBe(76.711);
      // uq_farms_primary is partial-unique on farmer_id WHERE is_primary.
      expect(lower.params[5]).toBe(false);

      // Cross-check: the two rows did not receive the same (or swapped) polygon.
      expect(upper.params[6]).not.toBe(lower.params[6]);

      // village/district still come from step 1, not from the location.
      expect(upper.params[3]).toBe('Ithalar');
      expect(upper.params[4]).toBe('The Nilgiris');

      // The farmer's stated 10-acre total is a claim held in step 2; it must never be
      // written onto a parcel, whose acreage is the measured figure.
      for (const insert of farmInserts(tx)) {
        expect(insert.params[2]).not.toBe(10);
      }

      // Same for the stated plot count: step 2 claims 5, step 3 marks 2, and exactly 2
      // farms rows are written. An implementation that trusted `numberOfFarms` would have
      // produced 5 rows, three of them describing land nobody ever located.
      expect(farmInserts(tx)).toHaveLength(2);

      // And the operation's own name stays in step 2. Every farms row is named after its
      // own location's label; an implementation that reached for `farmName` instead would
      // have written "Great Earth Organic" onto both parcels, leaving a verifier two
      // identically-named farms and no way to tell them apart.
      for (const insert of farmInserts(tx)) {
        expect(insert.params[1]).not.toBe('Great Earth Organic');
      }
    });

    it('BR-69c: approval is refused with 422 and writes nothing when step 3 was never captured', async () => {
      const repo = mockFarmerApplicationsRepo({
        id: APP_ID,
        user_id: FARMER_USER_ID,
        status: 'FARM_VERIFICATION',
        step4_documents: REVIEW_READY_DOCUMENTS,
        step2_farm_details: { typeOfFarming: 'Mixed vegetables' },
        step3_location: {},
      });
      // The Idempotency-Key claim is an INSERT in the same transaction and rolls back with the
      // refusal in production; the recording tx never rolls back, so it is kept in memory here and
      // "not one statement ran" keeps meaning exactly what it did.
      const service = createFarmerApplicationsService(repo, undefined, { idempotency: inMemoryIdempotency() });
      const actor = anActor({ userId: IDS.userSuperAdmin });

      const tx = recordingTx();
      capture.tx = tx;
      await expect(service.approveApplication(actor, ALL_SCOPE, APP_ID, {}, newId())).rejects.toMatchObject({
        code: 'VALIDATION_FAILED',
        status: 422,
      });

      // Not one statement ran: no tohfa id allocated, no user, farmer, farm or audit row.
      expect(tx.queries).toHaveLength(0);
    });

    it('BR-69c: approval is refused with 422 and writes nothing when the locations array is empty, or holds only non-objects', async () => {
      for (const step3 of [{ locations: [] }, { locations: [null, 'x', 3, []] }, { locations: 'x' }]) {
        const repo = mockFarmerApplicationsRepo({
          id: APP_ID,
          user_id: FARMER_USER_ID,
          status: 'FARM_VERIFICATION',
        step4_documents: REVIEW_READY_DOCUMENTS,
          step3_location: step3,
        });
        // The Idempotency-Key claim is an INSERT in the same transaction and rolls back with the
      // refusal in production; the recording tx never rolls back, so it is kept in memory here and
      // "not one statement ran" keeps meaning exactly what it did.
      const service = createFarmerApplicationsService(repo, undefined, { idempotency: inMemoryIdempotency() });
        const actor = anActor({ userId: IDS.userSuperAdmin });

        const tx = recordingTx();
        capture.tx = tx;
        await expect(service.approveApplication(actor, ALL_SCOPE, APP_ID, {}, newId())).rejects.toMatchObject({
          code: 'VALIDATION_FAILED',
          status: 422,
        });
        expect(tx.queries).toHaveLength(0);
        capture.tx = null;
      }
    });

    it('approval leaves an unsurveyed location null without poisoning the location that has a boundary', async () => {
      const repo = mockFarmerApplicationsRepo({
        id: APP_ID,
        user_id: FARMER_USER_ID,
        status: 'FARM_VERIFICATION',
        step4_documents: REVIEW_READY_DOCUMENTS,
        step3_location: {
          locations: [
            { id: 'loc-a', label: 'Unsurveyed Patch', areaAcres: 0.5 },
            {
              id: 'loc-b',
              label: 'Lower Field',
              areaAcres: 1.25,
              fmbPolygon: WIDE_PLOT,
              calculatedAreaAcres: 1.234,
              latitude: 11.4202,
              longitude: 76.711,
            },
          ],
        },
      });
      const service = createFarmerApplicationsService(repo);
      const actor = anActor({ userId: IDS.userSuperAdmin });

      const tx = recordingTx();
      capture.tx = tx;
      await service.approveApplication(actor, ALL_SCOPE, APP_ID, {}, newId());

      expect(farmInserts(tx)).toHaveLength(2);

      const unsurveyed = farmInsertNamed(tx, 'Unsurveyed Patch');
      expect(unsurveyed.params.slice(6, 11)).toEqual([null, null, null, null, null]);
      // The row is still created, with the farmer's stated acreage.
      expect(unsurveyed.params[2]).toBe(0.5);

      const surveyed = farmInsertNamed(tx, 'Lower Field');
      expect(JSON.parse(surveyed.params[6] as string)).toEqual(WIDE_PLOT);
      expect(surveyed.params[7]).toBe(1.234);
      expect(surveyed.params[8]).toBe(FARMER_USER_ID);
      expect(surveyed.params[9]).toBe(11.4202);
      expect(surveyed.params[10]).toBe(76.711);
    });

    it('approval writes null centroid columns rather than violating farms_centroid_pair_chk when only one coordinate is present', async () => {
      const repo = mockFarmerApplicationsRepo({
        id: APP_ID,
        user_id: FARMER_USER_ID,
        status: 'FARM_VERIFICATION',
        step4_documents: REVIEW_READY_DOCUMENTS,
        step3_location: {
          // fmbPolygon is present (so the boundary itself is written) but only
          // latitude was captured — farmLocationItemSchema allows this even
          // though db/migrations/0003_farmers_and_farms.sql's
          // farms_centroid_pair_chk requires both or neither.
          locations: [
            {
              id: 'loc-a',
              label: 'Half-Surveyed Plot',
              areaAcres: 1,
              fmbPolygon: SMALL_PLOT,
              calculatedAreaAcres: 2.468,
              latitude: 11.4102,
              // longitude intentionally omitted
            },
          ],
        },
      });
      const service = createFarmerApplicationsService(repo);
      const actor = anActor({ userId: IDS.userSuperAdmin });

      const tx = recordingTx();
      capture.tx = tx;
      await expect(service.approveApplication(actor, ALL_SCOPE, APP_ID, {}, newId())).resolves.toBeDefined();

      const insert = farmInsertNamed(tx, 'Half-Surveyed Plot');
      // The boundary polygon itself is still written...
      expect(JSON.parse(insert.params[6] as string)).toEqual(SMALL_PLOT);
      expect(insert.params[7]).toBe(2.468);
      // ...but centroid_lat/centroid_lng (params[9], params[10]) are both null,
      // never a lone value that would trip the CHECK constraint.
      expect(insert.params[9]).toBeNull();
      expect(insert.params[10]).toBeNull();
    });
  });

  /**
   * Regression guard. Experience was briefly removed from step 2 on the mistaken
   * belief that step 1 collected it; step 1 has no such input, so nothing populated
   * `step1_personal.farmingExperienceYears` and every approved farmer was written with
   * `farming_experience_years = 0`. These assert the bound parameter, because an
   * assertion that the INSERT merely ran would have passed throughout that bug.
   */
  describe('Farming experience reaches farmers.farming_experience_years', () => {
    const APP_ID = '11111111-1111-1111-1111-111111111111';
    const FARMER_USER_ID = '00000000-0000-0000-0000-000000000002';

    async function approveAndReadExperience(
      step1Personal: Record<string, unknown>,
      step2FarmDetails: Record<string, unknown>,
    ): Promise<unknown> {
      const repo = mockFarmerApplicationsRepo({
        id: APP_ID,
        user_id: FARMER_USER_ID,
        status: 'FARM_VERIFICATION',
        step4_documents: REVIEW_READY_DOCUMENTS,
        step1_personal: step1Personal,
        step2_farm_details: step2FarmDetails,
        step3_location: { locations: [{ id: 'loc-a', label: 'Plot', areaAcres: 1, latitude: 11.41, longitude: 76.69 }] },
      });
      const service = createFarmerApplicationsService(repo);
      const actor = anActor({ userId: IDS.userSuperAdmin });

      const tx = recordingTx();
      capture.tx = tx;
      await service.approveApplication(actor, ALL_SCOPE, APP_ID, {}, newId());

      return farmerInsert(tx).params[FARMER_EXPERIENCE_PARAM_INDEX];
    }

    it('writes the step-2 experienceYears into the farmers row', async () => {
      const experience = await approveAndReadExperience(
        { village: 'Ithalar' },
        { typeOfFarming: 'Mixed vegetables', experienceYears: 17, totalAreaAcres: 3 },
      );

      // 17, not 0: the value the farmer actually typed has to survive approval.
      expect(experience).toBe(17);
    });

    it('prefers the step-2 experienceYears over a stale step-1 value', async () => {
      const experience = await approveAndReadExperience(
        { farmingExperienceYears: 4 },
        { experienceYears: 17 },
      );

      // Step 2 is where the screen collects it, so it wins outright.
      expect(experience).toBe(17);
    });

    it('falls back to the step-1 farmingExperienceYears for applications already in flight', async () => {
      const experience = await approveAndReadExperience(
        { farmingExperienceYears: 9 },
        { typeOfFarming: 'Tea' },
      );

      expect(experience).toBe(9);
    });

    it('defaults to 0 only when neither step carries an experience figure', async () => {
      const experience = await approveAndReadExperience({}, { typeOfFarming: 'Tea' });

      expect(experience).toBe(0);
    });

    it('treats a genuine zero as a value, not as absent', async () => {
      // `?? 0` must not be reachable here: a first-year farmer stating 0 is data.
      const experience = await approveAndReadExperience(
        { farmingExperienceYears: 30 },
        { experienceYears: 0 },
      );

      expect(experience).toBe(0);
    });

    it('does not persist the stated totalAreaAcres onto the farmers row', async () => {
      const repo = mockFarmerApplicationsRepo({
        id: APP_ID,
        user_id: FARMER_USER_ID,
        status: 'FARM_VERIFICATION',
        step4_documents: REVIEW_READY_DOCUMENTS,
        step2_farm_details: { experienceYears: 5, totalAreaAcres: 7.5 },
        step3_location: { locations: [{ id: 'loc-a', label: 'Plot', areaAcres: 1, latitude: 11.41, longitude: 76.69 }] },
      });
      const service = createFarmerApplicationsService(repo);
      const actor = anActor({ userId: IDS.userSuperAdmin });

      const tx = recordingTx();
      capture.tx = tx;
      await service.approveApplication(actor, ALL_SCOPE, APP_ID, {}, newId());

      const insert = farmerInsert(tx);
      // The stated total stays a claim in the step-2 JSONB. Promoting it to a column
      // would invite it being reconciled with the parcels and silently losing the gap.
      expect(insert.sql).not.toContain('total_area_acres');
      expect(insert.params).not.toContain(7.5);
    });
  });

  /**
   * Regression guard for Bug 2: dob/gender/pincode are genuinely collected in step 1
   * but were read nowhere on approval, silently dropping data the farmer actually
   * provided even though `farmers` has real columns for all three. These assert the
   * bound parameters directly (not just that the INSERT ran), and specifically that
   * a missing/malformed value degrades to NULL rather than throwing and blocking an
   * otherwise-valid approval on a bad legacy value.
   */
  describe('dob/gender/pincode reach the farmers row at approval (Bug 2)', () => {
    const APP_ID = '11111111-1111-1111-1111-111111111111';
    const FARMER_USER_ID = '00000000-0000-0000-0000-000000000002';

    // Appended after aadhaar_last4 (index 8) in the farmers INSERT's column/param
    // list -- see approveApplication's `INSERT INTO farmers` statement.
    const FARMER_DOB_PARAM_INDEX = 9;
    const FARMER_GENDER_PARAM_INDEX = 10;
    const FARMER_PINCODE_PARAM_INDEX = 11;

    async function approveAndReadFarmerParams(
      step1Personal: Record<string, unknown>,
    ): Promise<unknown[]> {
      const repo = mockFarmerApplicationsRepo({
        id: APP_ID,
        user_id: FARMER_USER_ID,
        status: 'FARM_VERIFICATION',
        step4_documents: REVIEW_READY_DOCUMENTS,
        step1_personal: step1Personal,
        step3_location: { locations: [{ id: 'loc-a', label: 'Plot', areaAcres: 1, latitude: 11.41, longitude: 76.69 }] },
      });
      const service = createFarmerApplicationsService(repo);
      const actor = anActor({ userId: IDS.userSuperAdmin });

      const tx = recordingTx();
      capture.tx = tx;
      await service.approveApplication(actor, ALL_SCOPE, APP_ID, {}, newId());

      return farmerInsert(tx).params;
    }

    it('converts the mobile client shapes (DD / MM / YYYY dob, Title-case gender) onto the farmers row', async () => {
      const params = await approveAndReadFarmerParams({
        dob: '21 / 05 / 1990',
        gender: 'Male',
        pincode: '643217',
      });

      expect(params[FARMER_DOB_PARAM_INDEX]).toBe('1990-05-21');
      expect(params[FARMER_GENDER_PARAM_INDEX]).toBe('MALE');
      expect(params[FARMER_PINCODE_PARAM_INDEX]).toBe('643217');
    });

    it('tolerates stray whitespace around the DD / MM / YYYY slashes', async () => {
      const params = await approveAndReadFarmerParams({ dob: '5/6/1985' });
      expect(params[FARMER_DOB_PARAM_INDEX]).toBe('1985-06-05');
    });

    it('accepts an already-ISO dob unchanged', async () => {
      const params = await approveAndReadFarmerParams({ dob: '1990-05-21' });
      expect(params[FARMER_DOB_PARAM_INDEX]).toBe('1990-05-21');
    });

    it('accepts UNDISCLOSED and normalises whatever case the client sent', async () => {
      const params = await approveAndReadFarmerParams({ gender: 'undisclosed' });
      expect(params[FARMER_GENDER_PARAM_INDEX]).toBe('UNDISCLOSED');
    });

    it('writes NULL for a missing or malformed gender rather than tripping the CHECK constraint', async () => {
      const missing = await approveAndReadFarmerParams({});
      expect(missing[FARMER_GENDER_PARAM_INDEX]).toBeNull();

      const malformed = await approveAndReadFarmerParams({ gender: 'Alien' });
      expect(malformed[FARMER_GENDER_PARAM_INDEX]).toBeNull();
    });

    it('writes NULL for a missing or unparseable dob, and never throws -- approval must still succeed', async () => {
      const missing = await approveAndReadFarmerParams({});
      expect(missing[FARMER_DOB_PARAM_INDEX]).toBeNull();

      const garbage = await approveAndReadFarmerParams({ dob: 'not a date' });
      expect(garbage[FARMER_DOB_PARAM_INDEX]).toBeNull();

      // 31 February does not exist -- must not silently roll into March.
      const invalidCalendarDate = await approveAndReadFarmerParams({ dob: '31 / 02 / 2000' });
      expect(invalidCalendarDate[FARMER_DOB_PARAM_INDEX]).toBeNull();

      // The whole point: a malformed dob/gender/pincode together must not throw and
      // block an otherwise-valid approval.
      await expect(
        approveAndReadFarmerParams({
          dob: 'not a date',
          gender: 'not a gender',
          pincode: '012345',
        }),
      ).resolves.toBeDefined();
    });

    it('writes NULL for a missing or leading-zero pincode rather than tripping the CHECK constraint', async () => {
      const missing = await approveAndReadFarmerParams({});
      expect(missing[FARMER_PINCODE_PARAM_INDEX]).toBeNull();

      // farmers.pincode's CHECK is `^[1-9][0-9]{5}$` -- no leading zero.
      const leadingZero = await approveAndReadFarmerParams({ pincode: '012345' });
      expect(leadingZero[FARMER_PINCODE_PARAM_INDEX]).toBeNull();
    });

    /**
     * When a farmers row already exists for the applicant's user (pre-created, or left
     * from an earlier flow), the INSERT takes its ON CONFLICT (user_id) branch. That branch
     * used to set only the status columns, so every step-1 value was silently dropped and
     * the farmer's profile showed "Not provided" for data they had typed. The branch must
     * fill each data column that is still NULL, and never overwrite one that has a value.
     */
    it('BR-69h: the existing-row branch fills only missing step-1 columns via COALESCE and never overwrites', async () => {
      const repo = mockFarmerApplicationsRepo({
        id: APP_ID,
        user_id: FARMER_USER_ID,
        status: 'FARM_VERIFICATION',
        step4_documents: REVIEW_READY_DOCUMENTS,
        step1_personal: { dob: '08 / 10 / 2003', gender: 'Male', pincode: '643217' },
        step3_location: { locations: [{ id: 'loc-a', label: 'Plot', areaAcres: 1, latitude: 11.41, longitude: 76.69 }] },
      });
      const service = createFarmerApplicationsService(repo);
      const tx = recordingTx();
      capture.tx = tx;
      await service.approveApplication(anActor({ userId: IDS.userSuperAdmin }), ALL_SCOPE, APP_ID, {}, newId());

      const sql = farmerInsert(tx).sql.replace(/\s+/g, ' ');
      const conflictClause = sql.slice(sql.indexOf('ON CONFLICT (user_id) DO UPDATE SET'));
      for (const col of [
        'zone_id',
        'farming_experience_years',
        'address_line1',
        'village',
        'taluk',
        'district',
        'aadhaar_last4',
        'dob',
        'gender',
        'pincode',
      ]) {
        expect(conflictClause, col).toContain(`${col} = COALESCE(farmers.${col}, EXCLUDED.${col})`);
        // A bare `col = EXCLUDED.col` would overwrite a value the farmer already has.
        expect(conflictClause, col).not.toMatch(new RegExp(`\\b${col} = EXCLUDED\\.${col}\\b`));
      }
      // Status columns keep their existing behaviour.
      expect(conflictClause).toContain("application_status = 'APPROVED'");
      expect(conflictClause).toContain("kyc_status = 'VERIFIED'");
      expect(conflictClause).toContain('tohfa_farmer_id = EXCLUDED.tohfa_farmer_id');
    });
  });

  describe('HTTP Route Integration (Schema Validation)', () => {
    const app = createApp();
    const server = app.listen(0);

    afterAll(async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    });

    it('POST /v1/farmers/applications rejects invalid mobile format', async () => {
      const res = await request(server)
        .post('/v1/farmers/applications')
        .send({
          mobile: '9812345678', // Missing + prefix
          fullName: 'Murugan S',
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    });

    it('PATCH /v1/farmers/applications/:id/steps/99 rejects invalid step number with 422', async () => {
      const res = await request(server)
        .patch('/v1/farmers/applications/11111111-1111-1111-1111-111111111111/steps/99')
        .send({});

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    });

    it('GET /v1/admin/farmer-applications requires authentication', async () => {
      const res = await request(server).get('/v1/admin/farmer-applications');
      expect(res.status).toBe(401);
    });

    it('POST /v1/farmers/applications/:id/uploads/sign rejects an invalid body with 422, WITHOUT an Authorization header', async () => {
      // No `.set('Authorization', ...)` anywhere in this test -- reaching request
      // validation (rather than a 401) with no Bearer token at all is the point:
      // it proves the route is wired with optionalAuth, not requireAuth.
      const res = await request(server)
        .post('/v1/farmers/applications/11111111-1111-1111-1111-111111111111/uploads/sign')
        .send({
          purpose: 'NOT_A_REAL_PURPOSE',
          contentType: 'application/pdf',
          sizeBytes: 1000,
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    });

    it('POST /v1/farmers/applications/:id/uploads/sign rejects a non-UUID id with 422, unauthenticated', async () => {
      const res = await request(server)
        .post('/v1/farmers/applications/not-a-uuid/uploads/sign')
        .send({
          purpose: 'FARMER_DOCUMENT',
          contentType: 'application/pdf',
          sizeBytes: 1000,
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    });

    it('GET /v1/farmers/applications/:id rejects a non-UUID id with 422, unauthenticated (same optionalAuth wiring as /status)', async () => {
      const res = await request(server).get('/v1/farmers/applications/not-a-uuid');

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    });

    it('POST /v1/admin/farmer-applications/:id/reject requires reasonCode and min length reason', async () => {
      const adminToken = (await import('../../auth/jwt.js')).signAccessToken({
        sub: IDS.userSuperAdmin,
        roles: [{ code: 'SUPER_ADMIN' }],
        farmerId: null,
        customerId: null,
      });

      const res = await request(server)
        .post('/v1/admin/farmer-applications/11111111-1111-1111-1111-111111111111/reject')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reasonCode: 'INVALID_ENUM',
          reason: 'bad',
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    });
  });

  // docs/openapi.yaml's FarmerProfile has always declared `dob` and `gender`, and approval
  // has always copied them from step1_personal into farmers.dob / farmers.gender -- but
  // the read path never SELECTed them, so GET /v1/farmers/me silently dropped both. No
  // BR-xx rule governs these fields; these are plain contract tests for that read path.
  describe('Farmer profile: dob and gender', () => {
    const farmerUserId = '00000000-0000-0000-0000-000000000002';

    it('getMyProfile returns dob as a YYYY-MM-DD date and gender when the farmers row has them', async () => {
      const repo = mockFarmerApplicationsRepo(undefined, { dob: '1990-05-21', gender: 'FEMALE' });
      const service = createFarmerApplicationsService(repo);

      const profile = (await service.getMyProfile(anActor({ userId: farmerUserId }))) as Record<string, unknown>;

      expect(profile['dob']).toBe('1990-05-21');
      expect(profile['gender']).toBe('FEMALE');
    });

    it('getMyProfile returns dob: null and gender: null for a farmer row that predates them', async () => {
      const repo = mockFarmerApplicationsRepo(undefined, { dob: null, gender: null });
      const service = createFarmerApplicationsService(repo);

      const profile = (await service.getMyProfile(anActor({ userId: farmerUserId }))) as Record<string, unknown>;

      // Present-and-null, not absent: FarmerProfile declares both as nullable.
      expect(profile).toHaveProperty('dob', null);
      expect(profile).toHaveProperty('gender', null);
    });

    it('updateMyProfile returns dob and gender too, since PATCH /farmers/me responds with the same FarmerProfile schema', async () => {
      const repo = mockFarmerApplicationsRepo(undefined, { dob: '1984-11-02', gender: 'MALE' });
      const service = createFarmerApplicationsService(repo);

      const updated = (await service.updateMyProfile(anActor({ userId: farmerUserId }), {
        fullName: 'Murugan Selvam',
      })) as Record<string, unknown>;

      expect(updated['dob']).toBe('1984-11-02');
      expect(updated['gender']).toBe('MALE');
    });

    it('findFarmerByUserId and findFarmerById both SELECT farmers.dob (as text, never a timezone-shifted Date) and farmers.gender', async () => {
      // The pg driver parses DATE into a local-midnight JS Date; under IST, a
      // `.toISOString().slice(0, 10)` of that value is the PREVIOUS day. Casting to
      // text in SQL (the convention livestock and farm-diary already use) avoids it.
      const { farmerApplicationsRepo } = await import('./farmer-applications.repo.js');
      const sqls: string[] = [];
      const executor = {
        query: async (sql: string) => {
          sqls.push(sql);
          return { rows: [], rowCount: 0 };
        },
      } as unknown as PoolClient;

      await farmerApplicationsRepo.findFarmerByUserId(executor, farmerUserId);
      await farmerApplicationsRepo.findFarmerById(executor, IDS.farmer);

      expect(sqls).toHaveLength(2);
      for (const sql of sqls) {
        expect(sql).toMatch(/f\.dob::text AS dob/);
        expect(sql).toMatch(/f\.gender\b/);
      }
    });
  });

  describeIfDatabase('Integration against PostgreSQL', () => {
    const app = createApp();
    const server = app.listen(0);

    afterAll(async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    });

    beforeAll(async () => {
      // These tests stamp IDS.userSuperAdmin (approve -> audit_log.actor_id) and IDS.userFarmer
      // (farmer_applications.user_id) into FK columns. Those users used to exist only because
      // golden-thread.e2e had committed them; create them here (idempotent, never UPDATEs).
      if (await requireDatabaseTables('farmer_applications', 'users')) {
        const { pool } = await import('../../db/pool.js');
        await ensureStandardUsers(pool, 'userSuperAdmin', 'userFarmer');
      }
    });

    const uniqueMobile = `+9198${Date.now().toString().slice(-8)}`;

    it('creates draft, updates steps, and checks duplicate live constraint', async (ctx) => {
      if (!(await requireDatabaseTables('farmer_applications'))) return ctx.skip();

      // 1. Create Draft
      const createRes = await request(server)
        .post('/v1/farmers/applications')
        .send({
          mobile: uniqueMobile,
          fullName: 'Palanisamy K',
          preferredLocale: 'ta',
        });

      expect(createRes.status).toBe(201);
      const appId = createRes.body.id;
      expect(appId).toBeDefined();

      // 2. Reject duplicate live application for same mobile
      const dupRes = await request(server)
        .post('/v1/farmers/applications')
        .send({
          mobile: uniqueMobile,
          fullName: 'Palanisamy K Duplicate',
        });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.code).toBe('CONFLICT');

      // 3. Save Step 3 Location — one self-contained parcel per land location
      const step3Res = await request(server)
        .patch(`/v1/farmers/applications/${appId}/steps/3`)
        .send({
          locations: [
            {
              id: 'loc-a',
              label: 'Home plot',
              areaAcres: 2.5,
              gpsCaptured: true,
              latitude: 11.4102,
              longitude: 76.695,
              village: 'Ithalar',
              taluk: 'Ooty',
              district: 'The Nilgiris',
              fmbPolygon: {
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
              },
            },
          ],
        });

      expect(step3Res.status).toBe(200);
      expect(step3Res.body.completedSteps).toContain(3);
    });

    it('the 409 CONFLICT on a duplicate mobile carries meta.applicationId matching the first draft, and GET /v1/farmers/applications/:id recovers its real saved step data', async (ctx) => {
      if (!(await requireDatabaseTables('farmer_applications'))) return ctx.skip();

      const mobile = `+9195${Date.now().toString().slice(-8)}`;

      // 1. Create the first (real) draft.
      const createRes = await request(server)
        .post('/v1/farmers/applications')
        .send({ mobile, fullName: 'Lost Draft Farmer', preferredLocale: 'ta' });
      expect(createRes.status).toBe(201);
      const appId = createRes.body.id as string;

      // 2. Save real step 1 and step 2 data -- what this farmer actually typed in,
      // not a placeholder -- so the recovery fetch below has something real to prove.
      const step1Res = await request(server)
        .patch(`/v1/farmers/applications/${appId}/steps/1`)
        .send({ fullName: 'Lost Draft Farmer', village: 'Kotagiri', district: 'The Nilgiris' });
      expect(step1Res.status).toBe(200);

      const step2Res = await request(server)
        .patch(`/v1/farmers/applications/${appId}/steps/2`)
        .send({ farmName: 'Recovered Farm', typeOfFarming: 'Tea', experienceYears: 6 });
      expect(step2Res.status).toBe(200);

      // 3. Simulate the farmer losing their local draft (reinstall/new device) and
      // trying to start a fresh registration with the same mobile number.
      const dupRes = await request(server)
        .post('/v1/farmers/applications')
        .send({ mobile, fullName: 'Lost Draft Farmer Retry' });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.code).toBe('CONFLICT');
      // This is the whole point of the fix: the farmer is no longer stuck. The
      // conflict response itself carries the id of their real, existing draft.
      expect(dupRes.body.meta).toMatchObject({ applicationId: appId });
      expect(dupRes.body.meta.status).toBeDefined();
      expect(dupRes.body.meta.currentStep).toBeDefined();

      // 4. Use that recovered id to fetch the FULL draft -- not the lightweight
      // /status timeline -- and confirm it is the real data, not an empty shell.
      const draftRes = await request(server).get(`/v1/farmers/applications/${appId}`);

      expect(draftRes.status).toBe(200);
      expect(draftRes.body.id).toBe(appId);
      expect(draftRes.body.step1Personal).toMatchObject({
        fullName: 'Lost Draft Farmer',
        village: 'Kotagiri',
        district: 'The Nilgiris',
      });
      expect(draftRes.body.step2FarmDetails).toMatchObject({
        farmName: 'Recovered Farm',
        typeOfFarming: 'Tea',
        experienceYears: 6,
      });
    });

    it('GET /v1/farmers/applications/:id returns 404 for a real id belonging to a different authenticated farmer', async (ctx) => {
      if (!(await requireDatabaseTables('farmer_applications'))) return ctx.skip();

      const mobile = `+9193${Date.now().toString().slice(-8)}`;
      const createRes = await request(server)
        .post('/v1/farmers/applications')
        .send({ mobile, fullName: 'Owner Farmer' });
      const appId = createRes.body.id as string;

      // Attach this real application to a farmer user id via the repo directly
      // (approveApplication's own_user linkage is exercised elsewhere; here we only
      // need a real user_id set on the row so BR-36 ownership scoping is in play).
      const { pool } = await import('../../db/pool.js');
      await pool.query('UPDATE farmer_applications SET user_id = $1 WHERE id = $2', [
        IDS.userFarmer,
        appId,
      ]);

      const attackerToken = (await import('../../auth/jwt.js')).signAccessToken({
        sub: '00000000-0000-0000-0000-000000000009',
        roles: [{ code: 'FARMER' }],
        farmerId: null,
        customerId: null,
      });

      const res = await request(server)
        .get(`/v1/farmers/applications/${appId}`)
        .set('Authorization', `Bearer ${attackerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });

    it('POST /v1/farmers/applications/:id/uploads/sign succeeds with NO Authorization header and records uploaded_by NULL / entity_type+entity_id on the real uploads row', async (ctx) => {
      if (!(await requireDatabaseTables('farmer_applications', 'uploads'))) return ctx.skip();

      const mobile = `+9197${Date.now().toString().slice(-8)}`;
      const createRes = await request(server)
        .post('/v1/farmers/applications')
        .send({ mobile, fullName: 'Kumaresan V' });
      expect(createRes.status).toBe(201);
      const appId = createRes.body.id as string;
      // A fresh draft is SUBMITTED (db/migrations/0009's default), which is live/non-terminal.
      expect(createRes.body.status).toBe('SUBMITTED');

      // No `.set('Authorization', ...)` -- this is the entire bug this endpoint fixes: a
      // brand-new applicant has no account, and therefore no Bearer token, at Step 4.
      const signRes = await request(server)
        .post(`/v1/farmers/applications/${appId}/uploads/sign`)
        .send({
          purpose: 'FARMER_DOCUMENT',
          contentType: 'application/pdf',
          sizeBytes: 123456,
          fileName: 'patta.pdf',
        });

      expect(signRes.status).toBe(201);
      // Same SignedUploadTarget shape the authenticated POST /uploads/sign returns, so the
      // mobile client's existing response handling needs no changes.
      expect(signRes.body).toHaveProperty('uploadUrl');
      expect(signRes.body).toHaveProperty('fileUrl');
      expect(signRes.body).toHaveProperty('method', 'PUT');
      expect(signRes.body).toHaveProperty('expiresAt');
      expect(signRes.body).toHaveProperty('resumable');

      const { pool } = await import('../../db/pool.js');
      const row = await pool.query<{
        uploaded_by: string | null;
        entity_type: string | null;
        entity_id: string | null;
        is_public: boolean;
      }>(
        `SELECT uploaded_by, entity_type, entity_id, is_public
           FROM uploads
          WHERE entity_id = $1
          ORDER BY created_at DESC
          LIMIT 1`,
        [appId],
      );

      expect(row.rows).toHaveLength(1);
      // The three facts this whole feature exists to get right, read back from the real table:
      expect(row.rows[0]!.uploaded_by).toBeNull();
      expect(row.rows[0]!.entity_type).toBe('farmer_application');
      expect(row.rows[0]!.entity_id).toBe(appId);
      // Registration documents (ID proofs, farm docs, certificates) are never public assets.
      expect(row.rows[0]!.is_public).toBe(false);
    });

    it('POST /v1/farmers/applications/:id/uploads/sign rejects a terminal-status application exactly like a nonexistent one', async (ctx) => {
      if (!(await requireDatabaseTables('farmer_applications', 'uploads'))) return ctx.skip();

      const mobile = `+9196${Date.now().toString().slice(-8)}`;
      const createRes = await request(server)
        .post('/v1/farmers/applications')
        .send({ mobile, fullName: 'Selvi R' });
      const appId = createRes.body.id as string;

      // Force the application straight to REJECTED via the repo directly, bypassing the
      // admin-auth'd /reject endpoint -- this test only cares about the sign endpoint's own
      // terminal-status check against a REAL row, not the admin reject flow.
      const { farmerApplicationsRepo } = await import('./farmer-applications.repo.js');
      const { pool } = await import('../../db/pool.js');
      await farmerApplicationsRepo.transitionStatus(pool, appId, 'SUBMITTED', 'REJECTED');

      const terminalRes = await request(server)
        .post(`/v1/farmers/applications/${appId}/uploads/sign`)
        .send({ purpose: 'FARMER_DOCUMENT', contentType: 'application/pdf', sizeBytes: 1000 });

      const missingRes = await request(server)
        .post('/v1/farmers/applications/99999999-9999-9999-9999-999999999999/uploads/sign')
        .send({ purpose: 'FARMER_DOCUMENT', contentType: 'application/pdf', sizeBytes: 1000 });

      expect(terminalRes.status).toBe(404);
      expect(missingRes.status).toBe(404);
      expect(terminalRes.body.code).toBe('NOT_FOUND');
      expect(missingRes.body.code).toBe('NOT_FOUND');
      // Identical shape end to end (over real HTTP, against a real row) -- a caller cannot
      // tell "exists but terminal" from "never existed" apart.
      expect(terminalRes.body.detail).toBe(missingRes.body.detail);

      // And no upload row was ever written for the rejected application. (Unconditional now:
      // the `uploads` table is required at the top of this test instead of being silently skipped.)
      const row = await pool.query('SELECT 1 FROM uploads WHERE entity_id = $1', [appId]);
      expect(row.rowCount).toBe(0);
    });

    it('Bug 1 & Bug 2 end-to-end: approval writes dob/gender/pincode correctly and the full Aadhaar never reaches storage or any response', async (ctx) => {
      if (!(await requireDatabaseTables('farmer_applications', 'farmers'))) return ctx.skip();

      const mobile = `+9194${Date.now().toString().slice(-8)}`;
      // A syntactically-real-shaped 12-digit number -- not a real Aadhaar -- sent on
      // the wire exactly as a client that had regressed (or an attacker probing the
      // route directly) would send it. The server, not client good behaviour, is
      // what this test proves.
      const fullAadhaar = '234567890123';
      const expectedLast4 = fullAadhaar.slice(-4);

      // 1. Create draft
      const createRes = await request(server)
        .post('/v1/farmers/applications')
        .send({ mobile, fullName: 'Devika R' });
      expect(createRes.status).toBe(201);
      const appId = createRes.body.id as string;

      // 2. Save Step 1 with a full Aadhaar, dob (mobile's "DD / MM / YYYY" shape),
      // gender (mobile's Title-case shape) and a valid pincode.
      const step1Res = await request(server)
        .patch(`/v1/farmers/applications/${appId}/steps/1`)
        .send({
          fullName: 'Devika R',
          dob: '21 / 05 / 1990',
          gender: 'Female',
          aadhaarNumber: fullAadhaar,
          aadhaarLast4: expectedLast4,
          addressLine1: '4 Tea Estate Road',
          village: 'Kotagiri',
          taluk: 'Kotagiri',
          district: 'The Nilgiris',
          pincode: '643217',
        });
      expect(step1Res.status).toBe(200);
      // The strip happens on save, not just on approval -- confirmed on the
      // step-save response itself.
      expect(step1Res.body.step1Personal).not.toHaveProperty('aadhaarNumber');
      expect(JSON.stringify(step1Res.body)).not.toContain(fullAadhaar);

      // 3. Save Step 2 (the one farming operation) and Step 3 (one land location),
      // so approval has a realistic farms row to write too.
      const step2Res = await request(server)
        .patch(`/v1/farmers/applications/${appId}/steps/2`)
        .send({
          farmName: 'Blue Hills Organic',
          typeOfFarming: 'Mixed vegetables',
          experienceYears: 8,
          totalAreaAcres: 2,
          numberOfFarms: 1,
        });
      expect(step2Res.status).toBe(200);

      const step3Res = await request(server)
        .patch(`/v1/farmers/applications/${appId}/steps/3`)
        .send({
          locations: [
            {
              id: 'loc-a',
              label: 'Home plot',
              areaAcres: 2,
              gpsCaptured: true,
              latitude: 11.42,
              longitude: 76.7,
            },
          ],
        });
      expect(step3Res.status).toBe(200);

      const step4Res = await request(server)
        .patch(`/v1/farmers/applications/${appId}/steps/4`)
        .send({
          documents: [
            { docType: 'ID_PROOF', fileUrl: 'https://example.com/id.pdf' },
            { docType: 'FARM_DOC', fileUrl: 'https://example.com/farm.pdf' },
          ],
        });
      expect(step4Res.status).toBe(200);
      const submitRes = await request(server).post(`/v1/farmers/applications/${appId}/submit`);
      expect(submitRes.status).toBe(200);

      // 4. Approve as SUPER_ADMIN
      const adminToken = (await import('../../auth/jwt.js')).signAccessToken({
        sub: IDS.userSuperAdmin,
        roles: [{ code: 'SUPER_ADMIN' }],
        farmerId: null,
        customerId: null,
      });

      await readyForApproval(appId);
      const approveRes = await request(server)
        .post(`/v1/admin/farmer-applications/${appId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({});
      expect(approveRes.status).toBe(200);
      // The approval response is fed from the same step1_personal JSONB -- must
      // never carry the full number either.
      expect(JSON.stringify(approveRes.body)).not.toContain(fullAadhaar);

      // 5. Read the real farmers row back directly, independent of anything the API
      // chose to serialize -- the single most convincing proof this fix works.
      const { pool } = await import('../../db/pool.js');
      const row = await pool.query<{
        dob: string | null;
        gender: string | null;
        pincode: string | null;
        aadhaar_last4: string | null;
        aadhaar_token: string | null;
      }>(
        `SELECT f.dob::text AS dob, f.gender, f.pincode, f.aadhaar_last4, f.aadhaar_token
           FROM farmers f
           JOIN users u ON u.id = f.user_id
          WHERE u.mobile = $1`,
        [mobile],
      );

      expect(row.rows).toHaveLength(1);
      const farmerRow = row.rows[0]!;
      expect(farmerRow.dob).toBe('1990-05-21');
      expect(farmerRow.gender).toBe('FEMALE');
      expect(farmerRow.pincode).toBe('643217');
      expect(farmerRow.aadhaar_last4).toBe(expectedLast4);
      // Never written -- nothing in this codebase populates aadhaar_token, and it
      // must stay that way until a real KYC/tokenisation provider is integrated.
      expect(farmerRow.aadhaar_token).toBeNull();
      // No column on the real row holds anything resembling the full 12-digit
      // number -- confirms the strip actually happened, not just that a specific
      // column was left empty.
      expect(Object.values(farmerRow).join('|')).not.toContain(fullAadhaar);

      // 6. And the admin detail endpoint -- what a human reviewer actually sees --
      // must not surface it either.
      const detailRes = await request(server)
        .get(`/v1/admin/farmer-applications/${appId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(detailRes.status).toBe(200);
      expect(detailRes.body.step1Personal).not.toHaveProperty('aadhaarNumber');
      expect(JSON.stringify(detailRes.body)).not.toContain(fullAadhaar);
    });

    /**
     * Drives a fresh application through approval over HTTP and returns a FARMER access
     * token for the farmer it created, so GET /v1/farmers/me can be exercised against a
     * real farmers row end to end.
     */
    async function approveFreshFarmer(step1: Record<string, unknown>): Promise<{ farmerToken: string }> {
      const { signAccessToken } = await import('../../auth/jwt.js');
      const { pool } = await import('../../db/pool.js');
      const mobile = `+9193${Date.now().toString().slice(-8)}`;

      const createRes = await request(server)
        .post('/v1/farmers/applications')
        .send({ mobile, fullName: 'Kavitha M' });
      expect(createRes.status).toBe(201);
      const appId = createRes.body.id as string;

      const step1Res = await request(server)
        .patch(`/v1/farmers/applications/${appId}/steps/1`)
        .send({ fullName: 'Kavitha M', district: 'The Nilgiris', taluk: 'Ooty', ...step1 });
      expect(step1Res.status).toBe(200);

      const step2Res = await request(server)
        .patch(`/v1/farmers/applications/${appId}/steps/2`)
        .send({ farmName: 'Misty Ridge', typeOfFarming: 'Vegetables', experienceYears: 3, totalAreaAcres: 1, numberOfFarms: 1 });
      expect(step2Res.status).toBe(200);

      const step3Res = await request(server)
        .patch(`/v1/farmers/applications/${appId}/steps/3`)
        .send({ locations: [{ id: 'loc-a', label: 'Plot', areaAcres: 1, gpsCaptured: true, latitude: 11.41, longitude: 76.69 }] });
      expect(step3Res.status).toBe(200);

      const step4Res = await request(server)
        .patch(`/v1/farmers/applications/${appId}/steps/4`)
        .send({
          documents: [
            { docType: 'ID_PROOF', fileUrl: 'https://example.com/id.pdf' },
            { docType: 'FARM_DOC', fileUrl: 'https://example.com/farm.pdf' },
          ],
        });
      expect(step4Res.status).toBe(200);
      const submitRes = await request(server).post(`/v1/farmers/applications/${appId}/submit`);
      expect(submitRes.status).toBe(200);

      const adminToken = signAccessToken({
        sub: IDS.userSuperAdmin,
        roles: [{ code: 'SUPER_ADMIN' }],
        farmerId: null,
        customerId: null,
      });
      await readyForApproval(appId);
      const approveRes = await request(server)
        .post(`/v1/admin/farmer-applications/${appId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({});
      expect(approveRes.status).toBe(200);

      const farmer = await pool.query<{ id: string; user_id: string }>(
        `SELECT f.id, f.user_id FROM farmers f JOIN users u ON u.id = f.user_id WHERE u.mobile = $1`,
        [mobile],
      );
      expect(farmer.rows).toHaveLength(1);
      const { id: farmerId, user_id: userId } = farmer.rows[0]!;

      return {
        farmerToken: signAccessToken({
          sub: userId,
          roles: [{ code: 'FARMER' }],
          farmerId,
          customerId: null,
        }),
      };
    }

    it('GET /v1/farmers/me returns the dob and gender that approval copied into the farmers row', async (ctx) => {
      if (!(await requireDatabaseTables('farmer_applications', 'farmers'))) return ctx.skip();

      const { farmerToken } = await approveFreshFarmer({ dob: '21 / 05 / 1990', gender: 'Female' });

      const meRes = await request(server).get('/v1/farmers/me').set('Authorization', `Bearer ${farmerToken}`);

      expect(meRes.status).toBe(200);
      // Exactly the stored calendar date -- no timezone shift to 1990-05-20.
      expect(meRes.body.dob).toBe('1990-05-21');
      expect(meRes.body.gender).toBe('FEMALE');
    });

    it('GET /v1/farmers/me returns dob: null and gender: null when registration never captured them', async (ctx) => {
      if (!(await requireDatabaseTables('farmer_applications', 'farmers'))) return ctx.skip();

      const { farmerToken } = await approveFreshFarmer({});

      const meRes = await request(server).get('/v1/farmers/me').set('Authorization', `Bearer ${farmerToken}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body).toHaveProperty('dob', null);
      expect(meRes.body).toHaveProperty('gender', null);
    });

    // ---------------------------------------------------------------------------
    // BR-143: Zone derivation from taluk and application zone scoping
    // ---------------------------------------------------------------------------

    describe('BR-143: Zone derivation from taluk and application zone scoping', () => {
    const app = createApp();
    const server = app.listen(0);

    afterAll(async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    });
    const zones: Record<string, string> = {};
    let adminToken: string;
    let ootyFarmerAdminToken: string;
    let ootyFarmerAdminUserId: string;

    beforeAll(async () => {
      const { pool } = await import('../../db/pool.js');
      const { signAccessToken } = await import('../../auth/jwt.js');

      const zRes = await pool.query<{ id: string; code: string }>(
        `SELECT id, code FROM zones WHERE code IN ('ZONE-OOTY', 'ZONE-COON', 'ZONE-KOTA', 'ZONE-GUDA')`,
      );
      for (const row of zRes.rows) {
        zones[row.code] = row.id;
      }

      adminToken = signAccessToken({
        sub: IDS.userSuperAdmin,
        roles: [{ code: 'SUPER_ADMIN' }],
        farmerId: null,
        customerId: null,
      });

      ootyFarmerAdminUserId = newId();
      await pool.query(
        `INSERT INTO users (id, mobile, full_name, user_type, status)
         VALUES ($1, $2, 'Ooty FA BR143', 'ADMIN', 'ACTIVE') ON CONFLICT DO NOTHING`,
        [ootyFarmerAdminUserId, `+9191${Date.now().toString().slice(-8)}`],
      );
      await pool.query(
        `INSERT INTO user_roles (user_id, role_id, role_code, zone_id)
         VALUES ($1, (SELECT id FROM roles WHERE code = 'FARMER_ADMIN'), 'FARMER_ADMIN', $2)
         ON CONFLICT DO NOTHING`,
        [ootyFarmerAdminUserId, zones['ZONE-OOTY']],
      );
      ootyFarmerAdminToken = signAccessToken({
        sub: ootyFarmerAdminUserId,
        roles: [{ code: 'FARMER_ADMIN', zoneId: zones['ZONE-OOTY'] }],
        farmerId: null,
        customerId: null,
      });
    });

    async function createAndFillApplication(taluk: string): Promise<string> {
      const mobile = `+9195${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 9)}`;
      const createRes = await request(server)
        .post('/v1/farmers/applications')
        .send({ mobile, fullName: `Farmer ${taluk}` });
      const appId = createRes.body.id as string;

      await request(server)
        .patch(`/v1/farmers/applications/${appId}/steps/1`)
        .send({
          fullName: `Farmer ${taluk}`,
          addressLine1: 'Test Farm Road',
          village: 'Test Village',
          taluk,
          district: 'The Nilgiris',
          pincode: '643001',
        });

      await request(server)
        .patch(`/v1/farmers/applications/${appId}/steps/2`)
        .send({
          farmName: 'Green Farm',
          typeOfFarming: 'Vegetables',
          experienceYears: 5,
          totalAreaAcres: 2,
          numberOfFarms: 1,
        });

      await request(server)
        .patch(`/v1/farmers/applications/${appId}/steps/3`)
        .send({
          locations: [
            {
              id: 'loc-1',
              label: 'Main Farm',
              areaAcres: 2,
              gpsCaptured: true,
              latitude: 11.41,
              longitude: 76.69,
            },
          ],
        });

      await request(server)
        .patch(`/v1/farmers/applications/${appId}/steps/4`)
        .send({
          documents: [
            { docType: 'ID_PROOF', fileUrl: 'https://example.com/id.pdf' },
            { docType: 'FARM_DOC', fileUrl: 'https://example.com/farm.pdf' },
          ],
        });

      return appId;
    }

    it('BR-143: All 6 Nilgiris taluks (+ alias) derive zone on submit case-insensitively, unmapped leaves zone_id null', async () => {
      const mappings: Array<[string, string | null]> = [
        ['Ooty', zones['ZONE-OOTY']!],
        ['uDhAgAmAnDaLaM', zones['ZONE-OOTY']!],
        ['kUnDaH', zones['ZONE-OOTY']!],
        ['cOoNoOr', zones['ZONE-COON']!],
        ['kOtAgIrI', zones['ZONE-KOTA']!],
        ['gUdAlUr', zones['ZONE-GUDA']!],
        ['pAnDaLuR', zones['ZONE-GUDA']!],
        ['UnmappedTalukXYZ', null],
      ];

      for (const [taluk, expectedZoneId] of mappings) {
        const appId = await createAndFillApplication(taluk);
        const submitRes = await request(server).post(`/v1/farmers/applications/${appId}/submit`);
        expect(submitRes.status).toBe(200);
        expect(submitRes.body.zoneId).toBe(expectedZoneId);
      }
    });

    it('BR-143: Specific mappings Kundah -> Ooty and Pandalur -> Gudalur resolve correctly', async () => {
      const kundahAppId = await createAndFillApplication('Kundah');
      const kundahRes = await request(server).post(`/v1/farmers/applications/${kundahAppId}/submit`);
      expect(kundahRes.status).toBe(200);
      expect(kundahRes.body.zoneId).toBe(zones['ZONE-OOTY']);

      const pandalurAppId = await createAndFillApplication('Pandalur');
      const pandalurRes = await request(server).post(`/v1/farmers/applications/${pandalurAppId}/submit`);
      expect(pandalurRes.status).toBe(200);
      expect(pandalurRes.body.zoneId).toBe(zones['ZONE-GUDA']);
    });

    it('BR-143: Farmer explicit zone choice in Step 1 beats taluk auto-derivation', async () => {
      // Kotagiri taluk would naturally derive to ZONE-KOTA.
      // Farmer explicitly picks ZONE-COON in step 1.
      const mobile = `+9195${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 9)}`;
      const createRes = await request(server)
        .post('/v1/farmers/applications')
        .send({ mobile, fullName: 'Explicit Choice Farmer' });
      const appId = createRes.body.id as string;
      await request(server)
        .patch(`/v1/farmers/applications/${appId}/steps/1`)
        .send({
          fullName: 'Explicit Choice Farmer',
          mobile,
          dob: '1985-05-15',
          gender: 'Female',
          aadhaarLast4: '4321',
          addressLine1: 'Kotagiri Road',
          village: 'Kotagiri',
          taluk: 'Kotagiri',
          district: 'The Nilgiris',
          pincode: '643217',
          zoneId: zones['ZONE-COON'],
        });
      await request(server)
        .patch(`/v1/farmers/applications/${appId}/steps/2`)
        .send({
          farmName: 'Cooperative Farm',
          typeOfFarming: 'Organic Tea',
          experienceYears: 10,
          totalAreaAcres: 5.0,
          numberOfFarms: 1,
          waterSource: 'Rainfed',
          primaryCrops: ['tea'],
        });
      await request(server)
        .patch(`/v1/farmers/applications/${appId}/steps/3`)
        .send({
          locations: [
            {
              id: 'loc-1',
              label: 'Main Parcel',
              areaAcres: 5.0,
              gpsCaptured: true,
              latitude: 11.41,
              longitude: 76.69,
              village: 'Kotagiri',
              taluk: 'Kotagiri',
              district: 'The Nilgiris',
            },
          ],
        });
      await request(server)
        .patch(`/v1/farmers/applications/${appId}/steps/4`)
        .send({
          documents: [
            { docType: 'ID_PROOF', fileUrl: 'https://example.com/id.pdf' },
            { docType: 'FARM_DOC', fileUrl: 'https://example.com/farm.pdf' },
          ],
        });

      const submitRes = await request(server).post(`/v1/farmers/applications/${appId}/submit`);
      expect(submitRes.status).toBe(200);
      // Farmer's explicit choice ZONE-COON wins over Kotagiri taluk's ZONE-KOTA
      expect(submitRes.body.zoneId).toBe(zones['ZONE-COON']);
    });

    it('BR-143: Two mapping sources (zone_taluks and geographic_zones view) cannot disagree', async () => {
      const { pool } = await import('../../db/pool.js');
      const baseRes = await pool.query<{ count: string }>(
        `SELECT count(*) FROM zone_taluks zt
          LEFT JOIN geographic_zones gz ON gz.id = zt.id
         WHERE gz.id IS NULL OR gz.zone_id != zt.zone_id OR lower(gz.taluk) != lower(zt.taluk)`,
      );
      expect(Number(baseRes.rows[0]?.count ?? 0)).toBe(0);
    });

    it('BR-143: Approval with no body zoneId uses derived zone and writes onto farmers.zone_id', async () => {
      const appId = await createAndFillApplication('Kotagiri');
      await request(server).post(`/v1/farmers/applications/${appId}/submit`);

      await readyForApproval(appId);
      const approveRes = await request(server)
        .post(`/v1/admin/farmer-applications/${appId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({});

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.zoneId).toBe(zones['ZONE-KOTA']);

      const { pool } = await import('../../db/pool.js');
      const fRes = await pool.query<{ zone_id: string }>(
        'SELECT zone_id FROM farmers WHERE user_id = (SELECT user_id FROM farmer_applications WHERE id = $1)',
        [appId],
      );
      expect(fRes.rows[0]!.zone_id).toBe(zones['ZONE-KOTA']);
    });

    it('BR-143: Explicit body zoneId overrides derived zone on approval', async () => {
      const appId = await createAndFillApplication('Kotagiri');
      await request(server).post(`/v1/farmers/applications/${appId}/submit`);

      await readyForApproval(appId);
      const approveRes = await request(server)
        .post(`/v1/admin/farmer-applications/${appId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({ zoneId: zones['ZONE-COON'] });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.zoneId).toBe(zones['ZONE-COON']);

      const { pool } = await import('../../db/pool.js');
      const fRes = await pool.query<{ zone_id: string }>(
        'SELECT zone_id FROM farmers WHERE user_id = (SELECT user_id FROM farmer_applications WHERE id = $1)',
        [appId],
      );
      expect(fRes.rows[0]!.zone_id).toBe(zones['ZONE-COON']);
    });

    it('BR-143: Explicit unknown zoneId on approval returns 422', async () => {
      const appId = await createAndFillApplication('Kotagiri');
      await request(server).post(`/v1/farmers/applications/${appId}/submit`);

      await readyForApproval(appId);
      const approveRes = await request(server)
        .post(`/v1/admin/farmer-applications/${appId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({ zoneId: '00000000-0000-0000-0000-000000000000' });

      expect(approveRes.status).toBe(422);
    });

    it('BR-19: zone derives from taluk, throws ZONE_NOT_FOUND when unmapped', async () => {
      const appId = await createAndFillApplication('UnmappedTalukXYZ');
      const submitRes = await request(server).post(`/v1/farmers/applications/${appId}/submit`);
      expect(submitRes.status).toBe(200);

      await readyForApproval(appId);
      const approveRes = await request(server)
        .post(`/v1/admin/farmer-applications/${appId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({});

      expect(approveRes.status).toBe(422);
      expect(approveRes.body.code).toBe('ZONE_NOT_FOUND');
    });

    it('BR-143: Unmapped taluk on submit leaves zone_id null; approval without override returns 422 ZONE_NOT_FOUND with no farmer row created', async () => {
      const appId = await createAndFillApplication('UnmappedTalukXYZ');
      const submitRes = await request(server).post(`/v1/farmers/applications/${appId}/submit`);
      expect(submitRes.status).toBe(200);
      expect(submitRes.body.zoneId).toBeNull();

      await readyForApproval(appId);
      const approveRes = await request(server)
        .post(`/v1/admin/farmer-applications/${appId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({});

      expect(approveRes.status).toBe(422);
      expect(approveRes.body.code).toBe('ZONE_NOT_FOUND');
      expect(approveRes.body.detail).toContain("Farmer address taluk 'UnmappedTalukXYZ' cannot be mapped to a zone. Please provide zoneId in the approval request.");

      const { pool } = await import('../../db/pool.js');
      const fRes = await pool.query(
        'SELECT 1 FROM farmers WHERE user_id = (SELECT user_id FROM farmer_applications WHERE id = $1)',
        [appId],
      );
      expect(fRes.rowCount).toBe(0);
    });

    it('BR-143: Scoped list and detail: Farmer Admin in Ooty cannot see Coonoor application; unmapped visible only to all scope (Super/Tohfa Admin)', async () => {
      const ootyAppId = await createAndFillApplication('Ooty');
      await request(server).post(`/v1/farmers/applications/${ootyAppId}/submit`);

      const coonAppId = await createAndFillApplication('Coonoor');
      await request(server).post(`/v1/farmers/applications/${coonAppId}/submit`);

      const unmappedAppId = await createAndFillApplication('UnmappedTalukXYZ');
      await request(server).post(`/v1/farmers/applications/${unmappedAppId}/submit`);

      // 1. Farmer Admin in Ooty lists applications
      const ootyListRes = await request(server)
        .get('/v1/admin/farmer-applications')
        .set('Authorization', `Bearer ${ootyFarmerAdminToken}`);

      expect(ootyListRes.status).toBe(200);
      const ootyIds = ootyListRes.body.items.map((i: { id: string }) => i.id);
      expect(ootyIds).toContain(ootyAppId);
      expect(ootyIds).not.toContain(coonAppId);
      expect(ootyIds).not.toContain(unmappedAppId);

      // 2. Farmer Admin in Ooty GET /:id
      const ootyGetOoty = await request(server)
        .get(`/v1/admin/farmer-applications/${ootyAppId}`)
        .set('Authorization', `Bearer ${ootyFarmerAdminToken}`);
      expect(ootyGetOoty.status).toBe(200);

      const ootyGetCoon = await request(server)
        .get(`/v1/admin/farmer-applications/${coonAppId}`)
        .set('Authorization', `Bearer ${ootyFarmerAdminToken}`);
      expect(ootyGetCoon.status).toBe(404);

      const ootyGetUnmapped = await request(server)
        .get(`/v1/admin/farmer-applications/${unmappedAppId}`)
        .set('Authorization', `Bearer ${ootyFarmerAdminToken}`);
      expect(ootyGetUnmapped.status).toBe(404);

      // 3. Super Admin sees all three and can filter by hasZone=false
      const saListRes = await request(server)
        .get('/v1/admin/farmer-applications?limit=100')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(saListRes.status).toBe(200);
      const saIds = saListRes.body.items.map((i: { id: string }) => i.id);
      expect(saIds).toContain(ootyAppId);
      expect(saIds).toContain(coonAppId);
      expect(saIds).toContain(unmappedAppId);

      // 4. hasZone=false surfaces only unassigned applications
      const unassignedRes = await request(server)
        .get('/v1/admin/farmer-applications?hasZone=false')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(unassignedRes.status).toBe(200);
      const unassignedIds = unassignedRes.body.items.map((i: { id: string }) => i.id);
      expect(unassignedIds).toContain(unmappedAppId);
      expect(unassignedIds).not.toContain(ootyAppId);
      expect(unassignedIds).not.toContain(coonAppId);
    });
  });

  describe('BR-146: Farmer application lifecycle integrity, concurrency guards, keyset pagination, and response parity', () => {
    const app = createApp();
    const server = app.listen(0);
    const testAppIds: string[] = [];

    afterAll(async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      if (testAppIds.length > 0) {
        // History and review rows are append-only (BR-218): cleaned under replica mode.
        const { pool } = await import('../../db/pool.js');
        await purgeFarmerApplicationsByIds(pool, testAppIds);
      }
    });

    let adminToken: string;
    const zones: Record<string, string> = {};

    beforeAll(async () => {
      const { pool } = await import('../../db/pool.js');
      const { signAccessToken } = await import('../../auth/jwt.js');

      const zRes = await pool.query<{ id: string; code: string }>(
        `SELECT id, code FROM zones WHERE code IN ('ZONE-OOTY', 'ZONE-COON', 'ZONE-KOTA')`,
      );
      for (const row of zRes.rows) {
        zones[row.code] = row.id;
      }

      adminToken = signAccessToken({
        sub: IDS.userSuperAdmin,
        roles: [{ code: 'SUPER_ADMIN' }],
        farmerId: null,
        customerId: null,
      });
    });

    async function createFreshDraft(name: string = 'Test Farmer'): Promise<{ appId: string; mobile: string }> {
      const mobile = `+9197${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 9)}`;
      const res = await request(server)
        .post('/v1/farmers/applications')
        .send({ mobile, fullName: name });
      expect(res.status).toBe(201);
      const appId = res.body.id as string;
      testAppIds.push(appId);
      await request(server)
        .patch(`/v1/farmers/applications/${appId}/steps/1`)
        .send({ fullName: name, village: 'Kodanad', taluk: 'Kotagiri', district: 'The Nilgiris', pincode: '643217' });
      await request(server)
        .patch(`/v1/farmers/applications/${appId}/steps/2`)
        .send({ farmName: 'Hill View', typeOfFarming: 'Vegetables', experienceYears: 4, totalAreaAcres: 3, numberOfFarms: 1 });
      await request(server)
        .patch(`/v1/farmers/applications/${appId}/steps/3`)
        .send({ locations: [{ id: 'loc-1', label: 'Plot 1', areaAcres: 3, gpsCaptured: true, latitude: 11.42, longitude: 76.71 }] });
      await request(server)
        .patch(`/v1/farmers/applications/${appId}/steps/4`)
        .send({
          documents: [
            { docType: 'ID_PROOF', fileUrl: 'https://example.com/id.pdf' },
            { docType: 'FARM_DOC', fileUrl: 'https://example.com/farm.pdf' },
          ],
        });
      return { appId, mobile };
    }

    async function createAndSubmitApp(name: string = 'Submitted Farmer'): Promise<{ appId: string; mobile: string }> {
      const { appId, mobile } = await createFreshDraft(name);
      const submitRes = await request(server).post(`/v1/farmers/applications/${appId}/submit`);
      expect(submitRes.status).toBe(200);
      return { appId, mobile };
    }

    it('BR-146a: Draft applications return 409 INVALID_STATE_TRANSITION on approve, reject, or request-info', async () => {
      const { appId } = await createFreshDraft('Draft Only Farmer');

      // Approve draft
      const approveRes = await request(server)
        .post(`/v1/admin/farmer-applications/${appId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({});
      expect(approveRes.status).toBe(409);
      expect(approveRes.body.code).toBe('INVALID_STATE_TRANSITION');

      // Reject draft
      const rejectRes = await request(server)
        .post(`/v1/admin/farmer-applications/${appId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({ reasonCode: 'OTHER', reason: 'Rejecting draft application' });
      expect(rejectRes.status).toBe(409);
      expect(rejectRes.body.code).toBe('INVALID_STATE_TRANSITION');

      // Request info on draft
      const infoRes = await request(server)
        .post(`/v1/admin/farmer-applications/${appId}/request-info`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({ items: ['OTHER'], message: 'Need more information on draft' });
      expect(infoRes.status).toBe(409);
      expect(infoRes.body.code).toBe('INVALID_STATE_TRANSITION');
    });

    it('BR-146b: Terminal applications cannot be transitioned or re-decided', async () => {
      // Test REJECTED terminal application
      const { appId: rejAppId } = await createAndSubmitApp('Rejection Test Farmer');
      const rejectRes = await request(server)
        .post(`/v1/admin/farmer-applications/${rejAppId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({ reasonCode: 'DOCUMENTS_INVALID', reason: 'Documents are unreadable.' });
      expect(rejectRes.status).toBe(200);

      // Approve rejected application -> 409 INVALID_STATE_TRANSITION
      const rejApproveRes = await request(server)
        .post(`/v1/admin/farmer-applications/${rejAppId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({});
      expect(rejApproveRes.status).toBe(409);
      expect(rejApproveRes.body.code).toBe('INVALID_STATE_TRANSITION');

      // Reject already rejected application -> 409 CONFLICT
      const rejAgainRes = await request(server)
        .post(`/v1/admin/farmer-applications/${rejAppId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({ reasonCode: 'DOCUMENTS_INVALID', reason: 'Documents are unreadable again.' });
      expect(rejAgainRes.status).toBe(409);
      expect(rejAgainRes.body.code).toBe('CONFLICT');

      // Request info on rejected application -> 409 INVALID_STATE_TRANSITION
      const rejInfoRes = await request(server)
        .post(`/v1/admin/farmer-applications/${rejAppId}/request-info`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({ items: ['OTHER'], message: 'Please clarify rejection' });
      expect(rejInfoRes.status).toBe(409);
      expect(rejInfoRes.body.code).toBe('INVALID_STATE_TRANSITION');

      // Test APPROVED terminal application
      const { appId: appAppId } = await createAndSubmitApp('Approval Test Farmer');
      await readyForApproval(appAppId);
      const approveRes = await request(server)
        .post(`/v1/admin/farmer-applications/${appAppId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({});
      expect(approveRes.status).toBe(200);

      // Approve already approved application -> 409 CONFLICT
      const appAgainRes = await request(server)
        .post(`/v1/admin/farmer-applications/${appAppId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({});
      expect(appAgainRes.status).toBe(409);
      expect(appAgainRes.body.code).toBe('CONFLICT');

      // Reject approved application -> 409 INVALID_STATE_TRANSITION
      const appRejectRes = await request(server)
        .post(`/v1/admin/farmer-applications/${appAppId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({ reasonCode: 'OTHER', reason: 'Cannot reject approved farmer' });
      expect(appRejectRes.status).toBe(409);
      expect(appRejectRes.body.code).toBe('INVALID_STATE_TRANSITION');

      // Request info on approved application -> 409 INVALID_STATE_TRANSITION
      const appInfoRes = await request(server)
        .post(`/v1/admin/farmer-applications/${appAppId}/request-info`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({ items: ['OTHER'], message: 'Cannot request info on approved farmer' });
      expect(appInfoRes.status).toBe(409);
      expect(appInfoRes.body.code).toBe('INVALID_STATE_TRANSITION');
    });

    it('BR-146c: Concurrency-safe approval: two simultaneous approves yield 1 farmer, 1 TOHFA ID, 1 audit row', async () => {
      const { appId, mobile } = await createAndSubmitApp('Concurrent Farmer');

      await readyForApproval(appId);
      const [res1, res2] = await Promise.all([
        request(server)
          .post(`/v1/admin/farmer-applications/${appId}/approve`)
          .set('Authorization', `Bearer ${adminToken}`)
          .set('Idempotency-Key', randomUUID())
          .send({}),
        request(server)
          .post(`/v1/admin/farmer-applications/${appId}/approve`)
          .set('Authorization', `Bearer ${adminToken}`)
          .set('Idempotency-Key', randomUUID())
          .send({}),
      ]);

      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([200, 409]);

      const { pool } = await import('../../db/pool.js');
      const farmerRows = await pool.query(
        `SELECT f.id, f.tohfa_farmer_id FROM farmers f JOIN users u ON u.id = f.user_id WHERE u.mobile = $1`,
        [mobile],
      );
      expect(farmerRows.rows).toHaveLength(1);

      const auditRows = await pool.query(
        `SELECT id FROM audit_log WHERE action_code = 'farmer.application.approve' AND entity_id = $1`,
        [appId],
      );
      expect(auditRows.rows).toHaveLength(1);
    });

    it('BR-146d: Keyset cursor pagination on (created_at, id) across >= 3 pages sharing timestamps', async () => {
      const { pool } = await import('../../db/pool.js');
      const fixedTs = new Date('2026-11-13T10:00:00.000Z');
      const appIds: string[] = [];

      for (let i = 0; i < 5; i++) {
        const mobile = `+9196${Date.now().toString().slice(-8)}${i}`;
        const res = await pool.query<{ id: string }>(
          `INSERT INTO farmer_applications (mobile, full_name, preferred_locale, status, is_draft, created_at, submitted_at, zone_id)
           VALUES ($1, $2, 'en', 'DOCS_REVIEW', false, $3, $3, $4)
           RETURNING id`,
          [mobile, `Pagination Farmer ${i}`, fixedTs, zones['ZONE-KOTA']],
        );
        appIds.push(res.rows[0]!.id);
        testAppIds.push(res.rows[0]!.id);
      }

      // Page 1 with limit = 2
      const p1Res = await request(server)
        .get(`/v1/admin/farmer-applications?limit=2&zoneId=${zones['ZONE-KOTA']}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(p1Res.status).toBe(200);
      expect(p1Res.body.items).toHaveLength(2);
      expect(p1Res.body.page.hasMore).toBe(true);
      expect(p1Res.body.page.nextCursor).toBeDefined();

      // Page 2 with limit = 2
      const p2Res = await request(server)
        .get(`/v1/admin/farmer-applications?limit=2&zoneId=${zones['ZONE-KOTA']}&cursor=${encodeURIComponent(p1Res.body.page.nextCursor)}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(p2Res.status).toBe(200);
      expect(p2Res.body.items).toHaveLength(2);
      expect(p2Res.body.page.hasMore).toBe(true);
      expect(p2Res.body.page.nextCursor).toBeDefined();

      // Page 3 with limit = 2
      const p3Res = await request(server)
        .get(`/v1/admin/farmer-applications?limit=2&zoneId=${zones['ZONE-KOTA']}&cursor=${encodeURIComponent(p2Res.body.page.nextCursor)}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(p3Res.status).toBe(200);
      expect(p3Res.body.items.length).toBeGreaterThanOrEqual(1);

      // Verify all IDs across all pages are strictly distinct (no overlap)
      const allIds = [
        ...p1Res.body.items.map((i: { id: string }) => i.id),
        ...p2Res.body.items.map((i: { id: string }) => i.id),
        ...p3Res.body.items.map((i: { id: string }) => i.id),
      ];
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });

    it('BR-146e: List filters: zoneId, q (name and mobile), pendingOnly, status enum (DRAFT, INFO_REQUESTED), excludes drafts by default', async () => {
      const uniqueSuffix = Date.now().toString().slice(-6);
      const uniqueName = `Draft Uniq${uniqueSuffix}`;
      const { appId: draftId } = await createFreshDraft(uniqueName);
      const { appId: subId, mobile: subMobile } = await createAndSubmitApp('Submitted FilterFarmer');

      // Request info on another application
      const { appId: infoId } = await createAndSubmitApp('InfoRequested FilterFarmer');
      const reqInfoRes = await request(server)
        .post(`/v1/admin/farmer-applications/${infoId}/request-info`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({ items: ['OTHER'], message: 'Need updated land documents' });
      expect(reqInfoRes.status).toBe(200);

      // 1. By default, drafts are excluded
      const defaultListRes = await request(server)
        .get('/v1/admin/farmer-applications?limit=100')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(defaultListRes.status).toBe(200);
      const defaultIds = defaultListRes.body.items.map((i: { id: string }) => i.id);
      expect(defaultIds).not.toContain(draftId);
      expect(defaultIds).toContain(subId);

      // 2. Querying status=DRAFT returns drafts
      const draftListRes = await request(server)
        .get('/v1/admin/farmer-applications?status=DRAFT&limit=100')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(draftListRes.status).toBe(200);
      const draftIds = draftListRes.body.items.map((i: { id: string }) => i.id);
      expect(draftIds).toContain(draftId);

      // 3. Querying status=INFO_REQUESTED returns the info requested application
      const infoListRes = await request(server)
        .get('/v1/admin/farmer-applications?status=INFO_REQUESTED&limit=100')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(infoListRes.status).toBe(200);
      const infoIds = infoListRes.body.items.map((i: { id: string }) => i.id);
      expect(infoIds).toContain(infoId);

      // 4. Querying q filters by name
      const qNameRes = await request(server)
        .get(`/v1/admin/farmer-applications?q=Uniq${uniqueSuffix}&status=DRAFT`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(qNameRes.status).toBe(200);
      expect(qNameRes.body.items).toHaveLength(1);
      expect(qNameRes.body.items[0].id).toBe(draftId);

      // 5. Querying q filters by mobile
      const qMobileRes = await request(server)
        .get(`/v1/admin/farmer-applications?q=${encodeURIComponent(subMobile.slice(-6))}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(qMobileRes.status).toBe(200);
      const qMobileIds = qMobileRes.body.items.map((i: { id: string }) => i.id);
      expect(qMobileIds).toContain(subId);

      // 6. pendingOnly=true returns non-terminal active applications
      const pendingRes = await request(server)
        .get('/v1/admin/farmer-applications?pendingOnly=true&limit=100')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(pendingRes.status).toBe(200);
      const pendingIds = pendingRes.body.items.map((i: { id: string }) => i.id);
      expect(pendingIds).toContain(subId);
      expect(pendingIds).toContain(infoId);
      expect(pendingIds).not.toContain(draftId);
    });

    it('BR-146f: Rejection reason validation: requires reasonCode and reason (5-500 chars)', async () => {
      const { appId } = await createAndSubmitApp('Reject Reason Test');

      // Missing reasonCode
      const noCodeRes = await request(server)
        .post(`/v1/admin/farmer-applications/${appId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({ reason: 'Some valid reason here' });
      expect(noCodeRes.status).toBe(422);

      // Invalid reasonCode
      const badCodeRes = await request(server)
        .post(`/v1/admin/farmer-applications/${appId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({ reasonCode: 'NOT_A_VALID_CODE', reason: 'Some valid reason here' });
      expect(badCodeRes.status).toBe(422);

      // Missing reason
      const noReasonRes = await request(server)
        .post(`/v1/admin/farmer-applications/${appId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({ reasonCode: 'DOCUMENTS_INVALID' });
      expect(noReasonRes.status).toBe(422);

      // Reason too short (< 5 chars)
      const shortReasonRes = await request(server)
        .post(`/v1/admin/farmer-applications/${appId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({ reasonCode: 'DOCUMENTS_INVALID', reason: 'Bad' });
      expect(shortReasonRes.status).toBe(422);

      // Valid reject
      const validRes = await request(server)
        .post(`/v1/admin/farmer-applications/${appId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({ reasonCode: 'DOCUMENTS_INVALID', reason: 'Survey number mismatch on patta.' });
      expect(validRes.status).toBe(200);
      expect(validRes.body.status).toBe('REJECTED');
    });

    it('BR-146g: Application detail and summary responses include OpenAPI parity fields and review history', async () => {
      const { appId } = await createAndSubmitApp('Parity Test Farmer');

      // Check GET /v1/admin/farmer-applications (summary)
      const listRes = await request(server)
        .get(`/v1/admin/farmer-applications?q=Parity+Test`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.items.length).toBeGreaterThanOrEqual(1);
      const summary = listRes.body.items.find((i: { id: string }) => i.id === appId);
      expect(summary).toBeDefined();
      expect(summary).toHaveProperty('village');
      expect(summary).toHaveProperty('areaAcres');
      expect(summary).toHaveProperty('slaDueAt');
      expect(summary).toHaveProperty('documentsComplete');
      expect(summary.village).toBe('Kodanad');
      expect(summary.areaAcres).toBe(3);
      expect(summary.documentsComplete).toBe(true);

      // Check GET /v1/admin/farmer-applications/:id (detail)
      const detailRes = await request(server)
        .get(`/v1/admin/farmer-applications/${appId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(detailRes.status).toBe(200);
      const detail = detailRes.body;
      expect(detail).toHaveProperty('zoneId');
      expect(detail).toHaveProperty('tohfaFarmerId');
      expect(detail).toHaveProperty('decidedAt');
      expect(detail).toHaveProperty('decidedBy');
      expect(detail).toHaveProperty('rejectionReason');
      expect(detail).toHaveProperty('infoRequest');
      expect(detail).toHaveProperty('reviewHistory');
      expect(Array.isArray(detail.reviewHistory)).toBe(true);
      expect(detail.reviewHistory.length).toBeGreaterThanOrEqual(1); // includes submission transition
    });
  });

    it('BR-69h: approval onto a pre-existing farmers row fills its NULL step-1 columns and keeps the values it already had', async (ctx) => {
      if (!(await requireDatabaseTables('farmer_applications', 'farmers', 'users'))) return ctx.skip();

      const { pool } = await import('../../db/pool.js');
      const { signAccessToken } = await import('../../auth/jwt.js');
      const suffix = Date.now().toString().slice(-8);
      const mobile = `+9192${suffix}`;

      // The pre-existing state that triggered the bug: a users row for the applicant's
      // mobile and a farmers row for it with NULL dob/gender/pincode/address, but a
      // village it already holds (which must survive).
      const user = await pool.query<{ id: string }>(
        `INSERT INTO users (mobile, full_name, preferred_locale, user_type, status)
         VALUES ($1, 'Arun K', 'en', 'FARMER', 'ACTIVE') RETURNING id`,
        [mobile],
      );
      const userId = user.rows[0]!.id;
      await pool.query(
        `INSERT INTO farmers (user_id, tohfa_farmer_id, village)
         VALUES ($1, $2, 'Existing Village')`,
        [userId, `TOHFA-F-TEST-${suffix}`],
      );

      const createRes = await request(app)
        .post('/v1/farmers/applications')
        .send({ mobile, fullName: 'Arun K' });
      expect(createRes.status).toBe(201);
      const appId = createRes.body.id as string;

      expect(
        (
          await request(app)
            .patch(`/v1/farmers/applications/${appId}/steps/1`)
            .send({
              fullName: 'Arun K',
              dob: '08 / 10 / 2003',
              gender: 'Male',
              pincode: '643217',
              addressLine1: '7 Hill Road',
              village: 'Application Village',
              taluk: 'Kotagiri',
              district: 'The Nilgiris',
            })
        ).status,
      ).toBe(200);
      expect(
        (
          await request(app)
            .patch(`/v1/farmers/applications/${appId}/steps/3`)
            .send({ locations: [{ id: 'loc-a', label: 'Plot', areaAcres: 1, gpsCaptured: true, latitude: 11.41, longitude: 76.69 }] })
        ).status,
      ).toBe(200);
      expect(
        (
          await request(app)
            .patch(`/v1/farmers/applications/${appId}/steps/4`)
            .send({
              documents: [
                { docType: 'ID_PROOF', fileUrl: 'https://example.com/id.pdf' },
                { docType: 'FARM_DOC', fileUrl: 'https://example.com/farm.pdf' },
              ],
            })
        ).status,
      ).toBe(200);
      const submitRes = await request(app).post(`/v1/farmers/applications/${appId}/submit`);
      expect(submitRes.status).toBe(200);

      const adminToken = signAccessToken({
        sub: IDS.userSuperAdmin,
        roles: [{ code: 'SUPER_ADMIN' }],
        farmerId: null,
        customerId: null,
      });
      await readyForApproval(appId);
      const approveRes = await request(app)
        .post(`/v1/admin/farmer-applications/${appId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', randomUUID())
        .send({});
      expect(approveRes.status).toBe(200);

      const row = await pool.query<{
        dob: string | null;
        gender: string | null;
        pincode: string | null;
        address_line1: string | null;
        village: string | null;
        taluk: string | null;
        application_status: string;
      }>(
        `SELECT dob::text AS dob, gender, pincode, address_line1, village, taluk, application_status
           FROM farmers WHERE user_id = $1`,
        [userId],
      );
      expect(row.rows).toHaveLength(1);
      const farmer = row.rows[0]!;
      expect(farmer.dob).toBe('2003-10-08');
      expect(farmer.gender).toBe('MALE');
      expect(farmer.pincode).toBe('643217');
      expect(farmer.address_line1).toBe('7 Hill Road');
      expect(farmer.taluk).toBe('Kotagiri');
      // Never overwrite a value the farmer row already holds.
      expect(farmer.village).toBe('Existing Village');
      expect(farmer.application_status).toBe('APPROVED');
    });
  });
});
