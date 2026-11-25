import { writeAuditLog } from '../../audit/auditLog.js';
import type { Actor } from '../../auth/requireAuth.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { eventBus } from '../../events/bus.js';
import {
  beginIdempotent,
  idempotencyStore as defaultIdempotencyStore,
  requireIdempotencyKey,
  type IdempotencyStore,
} from '../../http/idempotency.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { defaultBlobStorage, type BlobStorage } from '../../storage/blobStorage.js';
import { assertMayGrantRole, farmerRoleCode } from '../../rbac/roleExclusivity.js';
import { uploadsService, type UploadsService } from '../uploads/uploads.service.js';
import type { SignUploadBody, SignUploadResponse } from '../uploads/uploads.schema.js';
import { calculatePolygonMetrics } from './geo.utils.js';
import {
  farmerApplicationsRepo,
  type ApplicationStatus,
  type FarmerApplicationRow,
  type FarmerApplicationsRepo,
  type StatusHistoryRow,
} from './farmer-applications.repo.js';
import { locationHasPosition, step3LocationSchema } from './farmer-applications.schema.js';
import type {
  AddApplicationNoteBody,
  AdvanceApplicationBody,
  ApproveApplicationBody,
  CreateFarmerApplicationBody,
  ListAdminApplicationsQuery,
  RejectApplicationBody,
  RequestInfoApplicationBody,
  ReviewDecisionBody,
  UpdateFarmerProfileBody,
} from './farmer-applications.schema.js';
import {
  applicationDocuments,
  applicationLocations,
  documentGateBlockers,
  fmbFingerprintOf,
  fmbGateBlockers,
  locationIdOf,
  REQUIRED_DOCUMENT_TYPES,
  type ApplicationDocumentView,
  type ApplicationLocationView,
  type ReviewBlocker,
} from './farmer-applications.review.js';

const VALID_GENDERS = new Set(['MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED']);

/**
 * Step1Personal.tsx's gender picker sends 'Male' | 'Female' | 'Other', but
 * `farmers.gender`'s CHECK constraint (and step1PersonalSchema's own enum) only
 * accepts the uppercase set (db/migrations/0003_farmers_and_farms.sql). Normalises
 * case and falls back to null for anything unrecognised rather than letting a bad
 * value reach the INSERT and trip the CHECK constraint -- approval must degrade
 * quietly here, the same posture the rest of this function already takes for
 * missing/malformed step data.
 */
function normalizeGenderForInsert(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const upper = raw.trim().toUpperCase();
  return VALID_GENDERS.has(upper) ? upper : null;
}

const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

/**
 * `farmers.pincode`'s CHECK constraint requires `^[1-9][0-9]{5}$` -- no leading
 * zero, matching how real Indian PIN codes are structured. Defensive guard on the
 * INSERT itself: mobile-side validation (Step1Personal.tsx / validation.ts) is
 * tightened to the same regex, but an in-flight draft saved before that fix could
 * still carry a leading-zero value, and this must not throw and block approval.
 */
function normalizePincodeForInsert(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return PINCODE_REGEX.test(trimmed) ? trimmed : null;
}

/**
 * Step 1's DatePicker (and the free-text field beside it) stores dob as
 * "DD / MM / YYYY" (Step1Personal.tsx, `format="DD / MM / YYYY"`), not the ISO
 * `YYYY-MM-DD` step1PersonalSchema.dob expects -- but that schema is never actually
 * enforced on this write path (see updateStep's step===1 branch). Parses the
 * farmer-facing format defensively, tolerating stray whitespace around the
 * slashes, and rejects calendar-invalid dates (e.g. 31/02/2000) rather than
 * letting them silently roll into the next month. Also accepts an already-ISO
 * value, since that is what the documented contract promises. Returns null for
 * anything missing or unparseable -- never throws, so a malformed legacy value
 * degrades quietly instead of blocking approval.
 */
function parseDobForInsert(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const match = trimmed.match(/^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/);
  if (match === null) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealCalendarDate =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!isRealCalendarDate) return null;

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
}

/**
 * BR-214 / BR-217 (owner decisions 2026-11-25). The admin flow is
 * draft(SUBMITTED) -> DOCS_REVIEW -> FARM_VERIFICATION -> APPROVED, with INFO_REQUESTED as a
 * side trip back to the applicant and REJECTED from any live stage. AUDIT stays in the database
 * enum but is OUT of this flow: nothing enters it and nothing leaves it (a legacy row in AUDIT
 * can only be read and annotated until the audit work defines its exits). The edges are the
 * shape of the flow; the evidence each forward edge needs is the gate in
 * farmer-applications.review.ts.
 */
const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  SUBMITTED: ['DOCS_REVIEW', 'REJECTED'],
  DOCS_REVIEW: ['FARM_VERIFICATION', 'INFO_REQUESTED', 'REJECTED'],
  FARM_VERIFICATION: ['APPROVED', 'INFO_REQUESTED', 'REJECTED'],
  INFO_REQUESTED: ['DOCS_REVIEW', 'REJECTED'],
  AUDIT: [],
  APPROVED: [],
  REJECTED: [],
};

/** Stages in which an admin reviews documents and FMB boundaries (BR-215, BR-216). */
const REVIEWABLE_STATUSES: readonly ApplicationStatus[] = ['DOCS_REVIEW', 'FARM_VERIFICATION'];

export function isValidTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface ReviewHistoryItem {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  actorId: string | null;
  note: string | null;
  createdAt: string;
  /** BR-218: TRANSITION or NOTE. */
  eventType: 'TRANSITION' | 'NOTE';
  reasonCode: string | null;
  requestedItems: string[] | null;
}

function toReviewHistoryItem(h: StatusHistoryRow): ReviewHistoryItem {
  return {
    id: h.id,
    fromStatus: h.from_status,
    toStatus: h.to_status,
    actorId: h.actor_id,
    note: h.note,
    createdAt: h.created_at.toISOString(),
    eventType: h.event_type ?? 'TRANSITION',
    reasonCode: h.reason_code ?? null,
    requestedItems: h.requested_items ?? null,
  };
}

/** Kept verbatim from the pre-0200 note text so a client showing `infoRequest` reads the same. */
const INFO_REQUEST_PREFIX = 'More info requested: ';

function mapApplicationResponse(row: FarmerApplicationRow, reviewHistory?: ReviewHistoryItem[]) {
  // Village from personal details
  const personal = (row.step1_personal as Record<string, unknown>) ?? {};
  const village = (typeof personal['village'] === 'string' ? personal['village'] : null) ?? null;

  // Area acres from step3 location parcels or step 2 totalAreaAcres
  const locObj = (row.step3_location as Record<string, unknown>) ?? {};
  const rawLocations = locObj['locations'];
  let areaAcres: number | null = null;
  if (Array.isArray(rawLocations) && rawLocations.length > 0) {
    areaAcres = rawLocations.reduce((sum: number, loc: unknown) => {
      if (loc && typeof loc === 'object' && typeof (loc as Record<string, unknown>)['areaAcres'] === 'number') {
        return sum + ((loc as Record<string, unknown>)['areaAcres'] as number);
      }
      return sum;
    }, 0);
  } else if (typeof (row.step2_farm_details as Record<string, unknown> | undefined)?.['totalAreaAcres'] === 'number') {
    areaAcres = (row.step2_farm_details as Record<string, unknown>)['totalAreaAcres'] as number;
  }

  // SLA due at (5 days after submission)
  const slaDueAt = row.submitted_at
    ? new Date(row.submitted_at.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  // Documents complete (both ID_PROOF and FARM_DOC)
  const docObj = (row.step4_documents as Record<string, unknown>) ?? {};
  const docList = Array.isArray(docObj['documents'])
    ? (docObj['documents'] as Array<{ docType?: string }>)
    : [];
  const docTypes = docList.map((d) => d.docType);
  const documentsComplete = docTypes.includes('ID_PROOF') && docTypes.includes('FARM_DOC');

  // INFO_REQUESTED is stored since migration 0200 (BR-217); nothing is derived from note text any more.
  const status: string = row.status;
  const infoRequestDetail =
    row.info_requested_at !== null && row.info_requested_at !== undefined
      ? {
          items: row.info_request_items ?? [],
          message: row.info_request_message ?? null,
          requestedAt: row.info_requested_at.toISOString(),
          requestedBy: row.info_requested_by ?? null,
          /** True while the application is still waiting on the applicant for this request. */
          open: row.status === 'INFO_REQUESTED',
        }
      : null;

  return {
    id: row.id,
    mobile: row.mobile,
    fullName: row.full_name,
    preferredLocale: row.preferred_locale,
    status,
    isDraft: row.is_draft,
    currentStep: row.current_step,
    completedSteps: row.completed_steps,
    step1Personal: row.step1_personal,
    step2FarmDetails: row.step2_farm_details,
    step3Location: row.step3_location,
    step4Documents: row.step4_documents,
    data: {
      personal: row.step1_personal,
      farm: row.step2_farm_details,
      location: row.step3_location,
      documents: row.step4_documents,
    },
    zoneId: row.zone_id ?? null,
    village,
    areaAcres,
    applicationCode: `APP-${(row.created_at instanceof Date ? row.created_at : new Date(row.created_at)).getFullYear()}-${row.id.slice(-4).toUpperCase()}`,
    submittedAt: row.submitted_at?.toISOString() ?? null,
    slaDueAt,
    documentsComplete,
    tohfaFarmerId: row.tohfa_farmer_id ?? null,
    decidedAt: row.decided_at?.toISOString() ?? null,
    decidedBy: row.decided_by ?? null,
    rejectionReason: row.rejection_reason ?? null,
    rejectionReasonCode: row.rejection_reason_code ?? null,
    // The newest request ever made (kept after resubmission, as before); `infoRequestDetail.open`
    // says whether it is still outstanding.
    infoRequest:
      infoRequestDetail !== null && infoRequestDetail.message !== null
        ? `${INFO_REQUEST_PREFIX}${infoRequestDetail.message}`
        : null,
    infoRequestDetail,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : typeof row.created_at === 'string'
          ? row.created_at
          : new Date().toISOString(),
    ...(reviewHistory !== undefined ? { reviewHistory } : {}),
  };
}

export interface FarmerApplicationsService {
  createDraft(input: CreateFarmerApplicationBody, actor?: Actor | undefined): Promise<unknown>;
  updateStep(actor: Actor | undefined, id: string, step: number, payload: unknown): Promise<unknown>;
  requestDocumentUploadUrl(id: string, body: SignUploadBody): Promise<SignUploadResponse>;
  submitApplication(actor: Actor | undefined, id: string): Promise<unknown>;
  getStatusTimeline(actor: Actor | undefined, id: string): Promise<unknown>;
  getFullDraft(actor: Actor | undefined, id: string): Promise<unknown>;
  /** BR-217: the applicant answers a request for information (INFO_REQUESTED -> DOCS_REVIEW). */
  resubmitApplication(actor: Actor | undefined, id: string): Promise<unknown>;
  getMyProfile(actor: Actor): Promise<unknown>;
  updateMyProfile(actor: Actor, body: UpdateFarmerProfileBody): Promise<unknown>;
  listAdminApplications(actor: Actor, scope: ResolvedScope, query: ListAdminApplicationsQuery): Promise<unknown>;
  getAdminApplication(actor: Actor, scope: ResolvedScope, id: string): Promise<unknown>;
  // Every admin mutation below takes the resolved scope (an application outside it is 404) and
  // the raw Idempotency-Key header value (required: 422 when missing), BR-214.
  approveApplication(
    actor: Actor,
    scope: ResolvedScope,
    id: string,
    body: ApproveApplicationBody,
    idempotencyKey: string | undefined,
  ): Promise<unknown>;
  rejectApplication(
    actor: Actor,
    scope: ResolvedScope,
    id: string,
    body: RejectApplicationBody,
    idempotencyKey: string | undefined,
  ): Promise<unknown>;
  requestInfoApplication(
    actor: Actor,
    scope: ResolvedScope,
    id: string,
    body: RequestInfoApplicationBody,
    idempotencyKey: string | undefined,
  ): Promise<unknown>;
  advanceApplication(
    actor: Actor,
    scope: ResolvedScope,
    id: string,
    body: AdvanceApplicationBody,
    idempotencyKey: string | undefined,
  ): Promise<unknown>;
  reviewApplicationDocument(
    actor: Actor,
    scope: ResolvedScope,
    id: string,
    documentKey: string,
    body: ReviewDecisionBody,
    idempotencyKey: string | undefined,
  ): Promise<unknown>;
  reviewApplicationFmb(
    actor: Actor,
    scope: ResolvedScope,
    id: string,
    locationId: string,
    body: ReviewDecisionBody,
    idempotencyKey: string | undefined,
  ): Promise<unknown>;
  addApplicationNote(
    actor: Actor,
    scope: ResolvedScope,
    id: string,
    body: AddApplicationNoteBody,
    idempotencyKey: string | undefined,
  ): Promise<unknown>;
}

export interface FarmerApplicationsServiceDeps {
  idempotency?: IdempotencyStore;
  /** Only `getPublicUrl` is used: it proves a step-4 URL is one of this application's uploads (BR-219). */
  storage?: Pick<BlobStorage, 'getPublicUrl'>;
}

/** Cross-scope reads and writes are 404, never 403: a 403 would confirm the application exists. */
function isInScope(scope: ResolvedScope, app: FarmerApplicationRow): boolean {
  if (scope.level === 'all') return true;
  return app.zone_id !== null && scope.zoneIds.includes(app.zone_id);
}

function notFound(): AppError {
  return new AppError('NOT_FOUND', { detail: 'Application not found.' });
}

function withoutQueryOrFragment(url: string): string {
  return url.split(/[?#]/)[0] ?? url;
}

function documentsGateError(blockers: ReviewBlocker[]): AppError {
  return new AppError('APPLICATION_DOCUMENTS_NOT_VERIFIED', {
    status: 409,
    detail:
      'The application documents are not all verified: ID_PROOF and FARM_DOC must be present and VERIFIED, and no document may be REJECTED.',
    meta: { blockers },
  });
}

function fmbGateError(blockers: ReviewBlocker[]): AppError {
  return new AppError('APPLICATION_FMB_NOT_VERIFIED', {
    status: 409,
    detail: 'Every land location must have its FMB boundary VERIFIED before the application can be approved.',
    meta: { blockers },
  });
}

/**
 * BR-69 cross-step completeness, shared by submit and resubmit (BR-217): every problem is
 * collected and reported together, each naming its step.
 */
function assertSubmittable(app: FarmerApplicationRow): void {
  const problems: Array<{ step: number; message: string }> = [];

  // Step 3: at least one land location that says where the land is. Re-validated against the
  // STORED data with the same strict schema the route applies on save, so a row written
  // before BR-69 (or by any other path) cannot reach review with nothing to verify.
  const storedLocations = step3LocationSchema.safeParse(app.step3_location);
  const hasLocatedLand =
    storedLocations.success && storedLocations.data.locations.some(locationHasPosition);
  if (!hasLocatedLand) {
    problems.push({
      step: 3,
      message:
        'Step 3 (Location) is incomplete: at least one farm location with a boundary or GPS position is required.',
    });
  }

  const docs = (app.step4_documents as { documents?: Array<{ docType: string }> })?.documents ?? [];
  const docTypes = docs.map((d) => d.docType);

  const hasIdProof = docTypes.includes('ID_PROOF');
  const hasFarmDoc = docTypes.includes('FARM_DOC');

  if (!hasIdProof || !hasFarmDoc) {
    problems.push({
      step: 4,
      message: 'Mandatory documents missing: ID_PROOF and FARM_DOC are required for submission.',
    });
  }

  if (problems.length > 0) {
    throw new AppError('VALIDATION_FAILED', {
      status: 422,
      detail: problems.map((p) => p.message).join(' '),
      errors: Object.fromEntries(problems.map((p) => [`step${p.step}`, [p.message]])),
      meta: {
        missingSteps: problems.map((p) => p.step),
        ...(!hasIdProof || !hasFarmDoc
          ? {
              missingDocuments: [
                ...(!hasIdProof ? ['ID_PROOF'] : []),
                ...(!hasFarmDoc ? ['FARM_DOC'] : []),
              ],
            }
          : {}),
      },
    });
  }
}

export function createFarmerApplicationsService(
  repo: FarmerApplicationsRepo = farmerApplicationsRepo,
  // Injectable so unit tests can substitute a mocked uploads service instead of hitting the
  // real blob storage + `uploads` table (see orders.service.ts's `walletSvc` for the same
  // cross-module DI pattern). Only the one method this service actually calls is required.
  uploadsSvc: Pick<UploadsService, 'signUploadForOwner'> = uploadsService,
  deps: FarmerApplicationsServiceDeps = {},
): FarmerApplicationsService {
  const idempotency = deps.idempotency ?? defaultIdempotencyStore;
  const storage = deps.storage ?? defaultBlobStorage;

  async function lockApplication(tx: Executor, id: string): Promise<FarmerApplicationRow | null> {
    return (await repo.findByIdForUpdate?.(tx, id)) ?? (await repo.findById(tx, id));
  }

  /** The admin detail: the application, its history, and its documents/locations with review state. */
  async function buildAdminDetail(db: Executor, app: FarmerApplicationRow) {
    const history = await repo.getStatusHistory(db, app.id);
    const reviews = await repo.listReviews(db, app.id);
    const documents: ApplicationDocumentView[] = applicationDocuments(app.step4_documents, reviews);
    const locations: ApplicationLocationView[] = applicationLocations(app.step3_location, reviews);
    const documentBlockers = documentGateBlockers(documents);
    const fmbBlockers = fmbGateBlockers(locations);
    return {
      ...mapApplicationResponse(app, history.map(toReviewHistoryItem)),
      documents,
      locations,
      // The same functions the service enforces with, so the screen can never disagree with the API.
      reviewGates: {
        farmVerification: { met: documentBlockers.length === 0, blockers: documentBlockers },
        approval: {
          met: documentBlockers.length === 0 && fmbBlockers.length === 0,
          blockers: [...documentBlockers, ...fmbBlockers],
        },
      },
    };
  }

  /**
   * The frame every admin review mutation shares: required Idempotency-Key, one transaction,
   * the application row locked, scope applied (404 outside it), the key claimed BEFORE any
   * state check so a retry of a request that already succeeded replays its response instead of
   * failing on the state it produced. `run` does the work and returns the response to store.
   */
  async function adminMutation<T>(
    actor: Actor,
    scope: ResolvedScope,
    id: string,
    rawKey: string | undefined,
    operation: string,
    request: unknown,
    run: (tx: Executor, app: FarmerApplicationRow) => Promise<T>,
  ): Promise<{ result: T; replayed: boolean }> {
    const key = requireIdempotencyKey(rawKey);
    return withTransaction(async (tx) => {
      const app = await lockApplication(tx, id);
      if (app === null || !isInScope(scope, app)) throw notFound();
      const idem = await beginIdempotent<T>(idempotency, tx, {
        actorUserId: actor.userId,
        key,
        operation,
        request: { id, request },
      });
      if (idem.replay) return { result: idem.response, replayed: true };
      const result = await run(tx, app);
      await idem.complete(result);
      return { result, replayed: false };
    });
  }

  function auditActorRole(actor: Actor): { actorRole?: string } {
    return actor.roles[0]?.code ? { actorRole: actor.roles[0].code } : {};
  }

  return {
    async createDraft(input, actor) {
      const existing = await repo.findLiveByMobile(pool, input.mobile);
      if (existing !== null) {
        // A farmer who lost their local draft (reinstalled app, cleared storage, new
        // device) has no way back to it once this 409 fires -- creating a second
        // application is blocked, and until now the response gave them nothing to
        // recover the first one with. `applicationId` lets the client route straight
        // to `GET /farmers/applications/:id`; `status`/`currentStep` let it decide
        // whether to resume the draft or just show "already submitted".
        throw new AppError('CONFLICT', {
          status: 409,
          detail: 'An active non-terminal application already exists for this mobile number.',
          meta: {
            applicationId: existing.id,
            status: existing.status,
            currentStep: existing.current_step,
          },
        });
      }

      const app = await repo.createApplication(pool, {
        mobile: input.mobile,
        fullName: input.fullName,
        preferredLocale: input.preferredLocale,
        userId: actor?.userId,
      });

      return mapApplicationResponse(app);
    },

    async updateStep(actor, id, step, payload) {
      const app = await repo.findById(pool, id);
      if (app === null) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }

      // BR-36: Own-data scoping (other user gets NOT_FOUND to prevent enumeration)
      if (
        actor !== undefined &&
        app.user_id !== null &&
        app.user_id !== actor.userId &&
        !actor.roles.some((r) => r.code === 'SUPER_ADMIN' || r.code === 'TOHFA_ADMIN')
      ) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }

      if (app.status === 'APPROVED' || app.status === 'REJECTED') {
        throw new AppError('CONFLICT', {
          status: 409,
          detail: `Cannot edit an application in ${app.status} status.`,
        });
      }

      let stepData: Record<string, unknown> = {};
      if (step === 1) {
        stepData = payload && typeof payload === 'object' && !Array.isArray(payload) ? { ...(payload as Record<string, unknown>) } : {};
        // BR-33b / Decision 8 (db/migrations/0003_farmers_and_farms.sql column
        // comments): "THE FULL AADHAAR NUMBER IS NEVER STORED IN THIS DATABASE --
        // not in this column, not in aadhaar_token, not in any document row, not in
        // any log" and "no API response may contain an unmasked Aadhaar". This
        // branch spreads the client payload verbatim into step1_personal JSONB with
        // no schema enforcement (see this function's module docs for why steps are
        // not Zod-`.parse()`d here), so a client that sends the full 12-digit
        // `aadhaarNumber` -- current or future, by accident or by regression -- must
        // be stripped explicitly rather than trusted to have already dropped it.
        // step1PersonalSchema (farmer-applications.schema.ts) already declares the
        // correct shape (aadhaarLast4/aadhaarToken only); this is the enforcement of
        // that shape on the one field that matters for compliance. Do not remove
        // this without moving the guarantee somewhere else first.
        delete stepData['aadhaarNumber'];
      } else if (step === 2) {
        // One farming operation per farmer: step 2 is a plain singular object
        // (farmName / typeOfFarming / experienceYears / totalAreaAcres /
        // numberOfFarms / waterSource / primaryCrops), like steps 1 and 5. Spread
        // verbatim — in particular `totalAreaAcres` and `numberOfFarms` are the
        // farmer's stated claims and are never reconciled against the step-3
        // parcels here.
        stepData = payload && typeof payload === 'object' && !Array.isArray(payload) ? { ...(payload as Record<string, unknown>) } : {};
      } else if (step === 3) {
        // Step 3 holds the land LOCATIONS — each a self-contained parcel with its
        // own acreage and boundary. The route validates the body (BR-69), so through
        // HTTP only `{ locations: [>=1 valid entries] }` gets here; this still
        // normalises whatever a direct caller passes into one canonical shape: the
        // invariant the pass below depends on is that `stepData['locations']` is
        // always an array. An unrecognised payload becomes an empty list rather
        // than being wrapped into a location — a single flat object is no longer a
        // step-3 shape any client sends (that was the pre-reshape one-boundary-per-
        // application model), and wrapping one would manufacture a parcel with no
        // id, label or acreage that approval would then turn into a farms row.
        if (Array.isArray(payload)) {
          stepData = { locations: payload };
        } else if (payload && typeof payload === 'object') {
          const p = payload as Record<string, unknown>;
          stepData = Array.isArray(p['locations']) ? { ...p } : { locations: [] };
        } else {
          stepData = { locations: [] };
        }

        // Server recomputes area from the surveyed boundary rather than trusting
        // whatever the client's own (device-side) estimate was — once per location,
        // because each location carries its own boundary.
        stepData['locations'] = (stepData['locations'] as unknown[]).map((entry) => {
          if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
            return entry;
          }
          const location = { ...(entry as Record<string, unknown>) };
          const fmbPolygon = location['fmbPolygon'] as
            | { type: 'Polygon'; coordinates: number[][][] }
            | undefined;
          const exteriorRing = fmbPolygon?.coordinates?.[0];
          if (exteriorRing !== undefined) {
            const metrics = calculatePolygonMetrics(exteriorRing);
            location['calculatedAreaAcres'] = metrics.areaAcres;
            location['calculatedAreaHectares'] = metrics.areaHectares;
          }
          return location;
        });
      } else if (step === 4) {
        if (Array.isArray(payload)) {
          stepData = { documents: payload };
        } else if (payload && typeof payload === 'object') {
          const p = payload as Record<string, unknown>;
          if (Array.isArray(p['documents'])) {
            stepData = { ...p };
          } else {
            stepData = { documents: [p] };
          }
        } else {
          stepData = { documents: [] };
        }
      } else if (step === 5) {
        stepData = payload && typeof payload === 'object' && !Array.isArray(payload) ? { ...(payload as Record<string, unknown>) } : {};
      }

      const completedSet = new Set(app.completed_steps);
      completedSet.add(step);
      const completedSteps = Array.from(completedSet).sort((a, b) => a - b);

      const updated = await repo.updateStepData(pool, id, step, stepData, completedSteps);
      if (updated === null) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }

      return mapApplicationResponse(updated);
    },

    async requestDocumentUploadUrl(id, body) {
      const app = await repo.findById(pool, id);
      if (app === null) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }

      // Same enumeration-prevention shape as updateStep's BR-36 check: a terminal
      // application must be indistinguishable from a nonexistent one to an outside
      // caller, so this throws the identical NOT_FOUND rather than e.g. a 409 that
      // would confirm the id is real. Once APPROVED or REJECTED a real farmer
      // account exists (or never will), and uploads move to the authenticated
      // POST /uploads/sign path -- mirrors the "live application" concept
      // findLiveByMobile already uses (`status NOT IN ('APPROVED', 'REJECTED')`).
      if (app.status === 'APPROVED' || app.status === 'REJECTED') {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }

      // This route is deliberately unauthenticated (see farmer-applications.routes.ts):
      // a brand-new applicant has no account yet, so possession of the application's
      // own unguessable UUID is the credential, not a Bearer token. The upload is
      // therefore recorded against the application row, not a user.
      return uploadsSvc.signUploadForOwner(
        { entityType: 'farmer_application', entityId: id, isPublic: false },
        body,
      );
    },

    async submitApplication(actor, id) {
      const app = await repo.findById(pool, id);
      if (app === null) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }

      // BR-36: Own-data scoping
      if (
        actor !== undefined &&
        app.user_id !== null &&
        app.user_id !== actor.userId &&
        !actor.roles.some((r) => r.code === 'SUPER_ADMIN' || r.code === 'TOHFA_ADMIN')
      ) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }

      // Idempotent by design. `is_draft` flips from true to false exactly once, at
      // the first successful submit, and never reverts -- so it is `false` for
      // EVERY post-submit status (DOCS_REVIEW, FARM_VERIFICATION, AUDIT, APPROVED,
      // REJECTED) and `true` only pre-submission. A repeat call here -- e.g. a
      // client retry after the original response was lost to a dropped connection
      // or a server restart mid-request -- must succeed harmlessly and return the
      // current state, not fail with INVALID_STATE_TRANSITION (DOCS_REVIEW is never
      // a valid transition target from DOCS_REVIEW, so a naive retry would hit that
      // error forever, with the mobile client's local draft never getting cleared
      // and no recovery path). Checking `is_draft` once here is simpler and more
      // robust than special-casing every individual post-submit status. Returning
      // the current (possibly REJECTED) state as a "success" here is intentional,
      // not a bug: the mobile client's existing success handler just navigates to
      // the status screen with whatever state comes back, so a farmer whose
      // application was actually rejected correctly lands on a screen showing
      // that, instead of a confusing generic submit error.
      if (!app.is_draft) {
        return mapApplicationResponse(app);
      }

      // Cross-step validation (BR-69). Every problem is collected and reported together, each
      // naming its step, so the applicant can fix the whole application in one round trip.
      assertSubmittable(app);

      if (!isValidTransition(app.status, 'DOCS_REVIEW')) {
        throw new AppError('INVALID_STATE_TRANSITION', {
          status: 422,
          detail: `Cannot transition application from ${app.status} to DOCS_REVIEW.`,
        });
      }

      // BR-143 / BR-19: Explicit farmer zone choice beats taluk auto-derivation
      const personal = (app.step1_personal as Record<string, unknown>) ?? {};
      const rawZoneId = personal['zoneId'];
      const rawTaluk = personal['taluk'];
      const rawDistrict = personal['district'];
      let derivedZoneId: string | null = null;
      if (typeof rawZoneId === 'string' && rawZoneId.trim().length > 0) {
        const active = await repo.isZoneActive(pool, rawZoneId.trim());
        if (active) {
          derivedZoneId = rawZoneId.trim();
        }
      }
      if (derivedZoneId === null && typeof rawTaluk === 'string' && rawTaluk.trim().length > 0) {
        const districtStr =
          typeof rawDistrict === 'string' && rawDistrict.trim().length > 0 ? rawDistrict.trim() : null;
        const matchedZone = await repo.findZoneByTaluk(pool, rawTaluk.trim(), districtStr);
        if (matchedZone !== null) {
          derivedZoneId = matchedZone.id;
        }
      }

      const updated = await repo.transitionStatus(
        pool,
        id,
        app.status,
        'DOCS_REVIEW',
        actor?.userId,
        'Submitted by applicant',
        derivedZoneId,
      );

      return mapApplicationResponse(updated);
    },

    async getStatusTimeline(actor, id) {
      const app = await repo.findById(pool, id);
      if (app === null) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }

      // BR-36: Own-data scoping
      if (
        actor !== undefined &&
        app.user_id !== null &&
        app.user_id !== actor.userId &&
        !actor.roles.some((r) => r.code === 'SUPER_ADMIN' || r.code === 'TOHFA_ADMIN')
      ) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }

      const history = await repo.getStatusHistory(pool, id);

      const submittedAt = app.submitted_at ?? app.created_at;
      const expectedDecisionBy = new Date(submittedAt.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();

      return {
        applicationId: app.id,
        status: app.status,
        submittedAt: app.submitted_at?.toISOString() ?? null,
        expectedDecisionBy,
        // BR-217: while the application waits on the applicant, the checklist and message are
        // here -- the only channel an applicant without an account (no push) has.
        infoRequest:
          app.status === 'INFO_REQUESTED' && app.info_requested_at !== null && app.info_requested_at !== undefined
            ? {
                items: app.info_request_items ?? [],
                message: app.info_request_message ?? null,
                requestedAt: app.info_requested_at.toISOString(),
              }
            : null,
        // BR-218: review NOTES are the reviewers' working notes, not part of the applicant's
        // timeline; only status moves are shown.
        steps: history
          .filter((h) => (h.event_type ?? 'TRANSITION') === 'TRANSITION')
          .map((h) => ({
            status: h.to_status,
            reachedAt: h.created_at.toISOString(),
            note: h.note,
          })),
      };
    },

    async getFullDraft(actor, id) {
      const app = await repo.findById(pool, id);
      if (app === null) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }

      // BR-36: Own-data scoping (identical to getStatusTimeline's check above) --
      // an outside caller must not be able to tell "belongs to someone else" apart
      // from "does not exist", so both throw the same NOT_FOUND.
      if (
        actor !== undefined &&
        app.user_id !== null &&
        app.user_id !== actor.userId &&
        !actor.roles.some((r) => r.code === 'SUPER_ADMIN' || r.code === 'TOHFA_ADMIN')
      ) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }

      return mapApplicationResponse(app);
    },

    async resubmitApplication(actor, id) {
      const result = await withTransaction(async (tx) => {
        const app = await lockApplication(tx, id);
        if (app === null) throw notFound();

        // BR-36: identical to submit/status -- same possession-of-id model, same NOT_FOUND.
        if (
          actor !== undefined &&
          app.user_id !== null &&
          app.user_id !== actor.userId &&
          !actor.roles.some((r) => r.code === 'SUPER_ADMIN' || r.code === 'TOHFA_ADMIN')
        ) {
          throw notFound();
        }

        if (app.is_draft) {
          throw new AppError('INVALID_STATE_TRANSITION', {
            status: 409,
            detail: 'A draft is submitted, not resubmitted. Use POST /farmers/applications/{id}/submit.',
          });
        }

        // Idempotent by design, like submit: a public caller has no account to scope an
        // Idempotency-Key to, so a retry after a lost response must succeed harmlessly with the
        // current state rather than fail on the state the first call produced.
        if (app.status !== 'INFO_REQUESTED') return { app, moved: false };

        assertSubmittable(app);

        // The zone is kept (transitionStatus only resets it on the draft submit): the applicant
        // answering a request does not re-derive where the farm is.
        const updated = await repo.transitionStatus(
          tx,
          id,
          'INFO_REQUESTED',
          'DOCS_REVIEW',
          actor?.userId,
          'Resubmitted by applicant',
        );
        return { app: (await repo.findById(tx, id)) ?? updated, moved: true };
      });
      return mapApplicationResponse(result.app);
    },

    async getMyProfile(actor) {
      const profile = await repo.findFarmerByUserId(pool, actor.userId);
      if (profile === null) {
        throw new AppError('NOT_FOUND', { detail: 'Farmer profile not found for current actor.' });
      }

      // BR-33b: unmasked Aadhaar is never returned (only aadhaar_last4)
      return {
        id: profile.id,
        userId: profile.user_id,
        tohfaFarmerId: profile.tohfa_farmer_id,
        fullName: profile.full_name,
        mobile: profile.mobile,
        preferredLocale: profile.preferred_locale,
        zoneId: profile.zone_id,
        zoneName: profile.zone_name,
        farmingExperienceYears: profile.farming_experience_years,
        address: profile.address_line1,
        village: profile.village,
        taluk: profile.taluk,
        district: profile.district,
        aadhaarLast4: profile.aadhaar_last4,
        kycStatus: profile.kyc_status,
        applicationStatus: profile.application_status,
        overallRating: profile.overall_rating,
        ratingTier: profile.rating_tier_code,
        isMarketBlocked: profile.is_market_blocked,
        marketBlockReason: profile.market_block_reason,
        // Already YYYY-MM-DD from the repo (dob::text); null for farmers who never supplied it.
        dob: profile.dob,
        gender: profile.gender,
        createdAt: profile.created_at.toISOString(),
      };
    },

    async updateMyProfile(actor, body) {
      // BR-33a: Aadhaar and mobile are locked fields
      if (body.mobile !== undefined || body.aadhaar !== undefined || body.aadhaarNumber !== undefined) {
        throw new AppError('FIELD_LOCKED', {
          status: 403,
          detail: 'Mobile number and Aadhaar are locked fields and cannot be modified by the farmer (BR-33).',
        });
      }

      const profile = await repo.findFarmerByUserId(pool, actor.userId);
      if (profile === null) {
        throw new AppError('NOT_FOUND', { detail: 'Farmer profile not found.' });
      }

      const updated = await repo.updateFarmerProfile(pool, profile.id, {
        fullName: body.fullName,
        farmingExperienceYears: body.farmingExperienceYears,
        addressLine1: body.address,
        preferredLocale: body.preferredLocale,
      });

      if (updated === null) {
        throw new AppError('NOT_FOUND', { detail: 'Failed to update farmer profile.' });
      }

      return {
        id: updated.id,
        userId: updated.user_id,
        tohfaFarmerId: updated.tohfa_farmer_id,
        fullName: updated.full_name,
        mobile: updated.mobile,
        preferredLocale: updated.preferred_locale,
        zoneId: updated.zone_id,
        zoneName: updated.zone_name,
        farmingExperienceYears: updated.farming_experience_years,
        address: updated.address_line1,
        village: updated.village,
        taluk: updated.taluk,
        district: updated.district,
        aadhaarLast4: updated.aadhaar_last4,
        kycStatus: updated.kyc_status,
        applicationStatus: updated.application_status,
        overallRating: updated.overall_rating,
        ratingTier: updated.rating_tier_code,
        isMarketBlocked: updated.is_market_blocked,
        marketBlockReason: updated.market_block_reason,
        dob: updated.dob,
        gender: updated.gender,
        createdAt: updated.created_at.toISOString(),
      };
    },

    async listAdminApplications(_actor, scope, query) {
      let zoneIds: string[] | undefined = undefined;
      if (scope.level !== 'all') {
        if (query.zoneId !== undefined) {
          zoneIds = scope.zoneIds.includes(query.zoneId) ? [query.zoneId] : [];
        } else {
          zoneIds = scope.zoneIds;
        }
      } else if (query.zoneId !== undefined) {
        zoneIds = [query.zoneId];
      }

      const { items, nextCursor, hasMore } = await repo.listAdminApplications(pool, {
        ...query,
        ...(zoneIds !== undefined ? { zoneIds } : {}),
      });
      return {
        items: items.map((r) => mapApplicationResponse(r)),
        page: { nextCursor, hasMore },
      };
    },

    async getAdminApplication(_actor, scope, id) {
      const app = await repo.findById(pool, id);
      if (app === null || !isInScope(scope, app)) throw notFound();
      return buildAdminDetail(pool, app);
    },

    async approveApplication(actor, scope, id, body, idempotencyKey) {
      type ApproveOutcome = {
        response: ReturnType<typeof mapApplicationResponse>;
        event: { userId: string; tohfaFarmerId: string };
      };
      const { result, replayed } = await adminMutation<ApproveOutcome>(
        actor,
        scope,
        id,
        idempotencyKey,
        'farmer.application.approve',
        body,
        async (tx, app) => {
        if (app.is_draft) {
          throw new AppError('INVALID_STATE_TRANSITION', {
            status: 409,
            detail: 'Cannot approve a draft application.',
          });
        }

        if (app.status === 'APPROVED') {
          throw new AppError('CONFLICT', {
            status: 409,
            detail: 'Application is already approved.',
          });
        }

        if (app.status === 'REJECTED') {
          throw new AppError('INVALID_STATE_TRANSITION', {
            status: 409,
            detail: 'Cannot approve a rejected application.',
          });
        }

        // BR-214: approval only from FARM_VERIFICATION (AUDIT is out of this flow).
        if (!isValidTransition(app.status, 'APPROVED')) {
          throw new AppError('INVALID_STATE_TRANSITION', {
            status: 409,
            detail: `An application is approved from FARM_VERIFICATION only (current status: ${app.status}).`,
          });
        }

        // BR-214 gates, re-evaluated inside the locked transaction: a document can have been
        // replaced or re-reviewed since the application advanced. Both gates' blockers are listed.
        const reviews = await repo.listReviews(tx, id);
        const documents = applicationDocuments(app.step4_documents, reviews);
        const documentBlockers = documentGateBlockers(documents);
        const fmbBlockers = fmbGateBlockers(applicationLocations(app.step3_location, reviews));
        if (documentBlockers.length > 0) throw documentsGateError([...documentBlockers, ...fmbBlockers]);
        if (fmbBlockers.length > 0) throw fmbGateError(fmbBlockers);

        // BR-143: resolve zone
        let resolvedZoneId: string | null = null;
        if (body.zoneId !== undefined) {
          const isActive = await repo.isZoneActive(tx, body.zoneId);
          if (!isActive) {
            throw new AppError('VALIDATION_FAILED', {
              status: 422,
              detail: 'The specified zoneId does not exist or is inactive.',
              errors: { 'body.zoneId': ['Invalid or inactive zone.'] },
            });
          }
          resolvedZoneId = body.zoneId;
        } else if (app.zone_id !== null) {
          resolvedZoneId = app.zone_id;
        } else {
          const personal = (app.step1_personal as Record<string, unknown>) ?? {};
          const rawZoneId = personal['zoneId'];
          if (typeof rawZoneId === 'string' && rawZoneId.trim().length > 0) {
            const active = await repo.isZoneActive(tx, rawZoneId.trim());
            if (active) {
              resolvedZoneId = rawZoneId.trim();
            }
          }
          if (resolvedZoneId === null) {
            const rawTaluk = personal['taluk'];
            const rawDistrict = personal['district'];
            if (typeof rawTaluk === 'string' && rawTaluk.trim().length > 0) {
              const districtStr =
                typeof rawDistrict === 'string' && rawDistrict.trim().length > 0 ? rawDistrict.trim() : null;
              const matched = await repo.findZoneByTaluk(tx, rawTaluk.trim(), districtStr);
              if (matched !== null) {
                resolvedZoneId = matched.id;
              }
            }
          }
        }

        if (resolvedZoneId === null) {
          const personal = (app.step1_personal as Record<string, unknown>) ?? {};
          const talukName = (typeof personal['taluk'] === 'string' ? personal['taluk'].trim() : '') || '(missing)';
          throw new AppError('ZONE_NOT_FOUND', {
            status: 422,
            detail: `Farmer address taluk '${talukName}' cannot be mapped to a zone. Please provide zoneId in the approval request.`,
          });
        }

        // BR-69: refuse BEFORE anything is written. A farmer with zero farms is VERIFIED but can
        // list nothing and has no land for FARM_VERIFICATION to have looked at; the QA run that
        // found this had approval succeed on `{"locations":[]}`. The count is of the entries that
        // will actually become `farms` rows below, so the two can never disagree.
        const rawLocationsToApprove =
          ((app.step3_location as Record<string, unknown> | null) ?? {})['locations'];
        const locationsToApprove: unknown[] = Array.isArray(rawLocationsToApprove)
          ? rawLocationsToApprove.filter(
              (l) => l !== null && typeof l === 'object' && !Array.isArray(l),
            )
          : [];
        if (locationsToApprove.length === 0) {
          throw new AppError('VALIDATION_FAILED', {
            status: 422,
            detail:
              'Application has no farm locations (step 3). A farmer cannot be approved with zero farms; request the applicant to complete step 3 or reject the application.',
            errors: { step3: ['At least one farm location is required to approve an application.'] },
            meta: { missingSteps: [3] },
          });
        }

        // BR-135: approval gives the applicant's account FARMER and a farmers row. The resulting
        // role set must be one docs/rbac.json allows: a Farmer Admin or customer may become a
        // farmer, a SUPER_ADMIN, TOHFA_ADMIN, MAIN_WH_ADMIN or SUB_WH_ADMIN may not. Checked before
        // anything is written; migration 0083 is the backstop.
        const applicantRoles = await repo.findApplicantLiveRoles(tx, { userId: app.user_id, mobile: app.mobile });
        assertMayGrantRole({ roles: applicantRoles, hasLiveFarmer: false }, farmerRoleCode());

        let userId = app.user_id;
        if (userId === null) {
          const userRes = await tx.query<{ id: string }>(
            `INSERT INTO users (mobile, full_name, preferred_locale, user_type, status)
             VALUES ($1, $2, $3, 'FARMER', 'ACTIVE')
             ON CONFLICT (mobile) WHERE deleted_at IS NULL DO UPDATE SET full_name = EXCLUDED.full_name
             RETURNING id`,
            [app.mobile, app.full_name, app.preferred_locale],
          );
          userId = userRes.rows[0]!.id;
        }

        await tx.query(
          `INSERT INTO user_roles (user_id, role_id)
           VALUES ($1, (SELECT id FROM roles WHERE code = 'FARMER'))
           ON CONFLICT DO NOTHING`,
          [userId],
        );

        // Concurrency-safe: check if user already has an existing tohfa_farmer_id
        let tohfaFarmerId: string | null = null;
        if (typeof app.tohfa_farmer_id === 'string' && app.tohfa_farmer_id.length > 0) {
          tohfaFarmerId = app.tohfa_farmer_id;
        } else if (userId !== null) {
          const existingFarmer = await tx.query<{ tohfa_farmer_id: string }>(
            `SELECT tohfa_farmer_id FROM farmers WHERE user_id = $1 AND deleted_at IS NULL LIMIT 1`,
            [userId],
          );
          if (
            typeof existingFarmer.rows[0]?.tohfa_farmer_id === 'string' &&
            existingFarmer.rows[0].tohfa_farmer_id.length > 0
          ) {
            tohfaFarmerId = existingFarmer.rows[0].tohfa_farmer_id;
          }
        }
        if (tohfaFarmerId === null) {
          const year = new Date().getFullYear();
          tohfaFarmerId = await repo.allocateNextTohfaFarmerId(tx, year);
        }

        const personal = (app.step1_personal as Record<string, unknown>) ?? {};
        const farmDetails = (app.step2_farm_details as Record<string, unknown>) ?? {};

        const experienceYears =
          farmDetails['experienceYears'] ?? personal['farmingExperienceYears'] ?? 0;
        const dob = parseDobForInsert(personal['dob']);
        const gender = normalizeGenderForInsert(personal['gender']);
        const pincode = normalizePincodeForInsert(personal['pincode']);

        // NOTE: `step2FarmDetails.totalAreaAcres` is deliberately NOT persisted onto a
        // farmer or farm column. It is the farmer's stated total holding and stays in
        // the step-2 JSONB as a claim; `farms.area_acres` below keeps coming from each
        // location's own measured `areaAcres`. Collapsing the two would erase the
        // claim-vs-ground discrepancy that FARM_VERIFICATION exists to look at.
        //
        // BR-69h: a farmers row can already exist for this user (pre-created, or left by an
        // earlier flow). The conflict branch used to set only the status columns, silently
        // dropping every step-1 value, so the farmer's profile read "Not provided" for data
        // they had typed. Each data column is now filled only where it is still NULL --
        // COALESCE(existing, application) -- so a value the row already holds is never
        // overwritten. Status columns keep their original behaviour.
        const farmerRes = await tx.query<{ id: string }>(
          `INSERT INTO farmers (
             user_id, tohfa_farmer_id, zone_id, farming_experience_years,
             address_line1, village, taluk, district, aadhaar_last4,
             dob, gender, pincode,
             kyc_status, application_status, is_market_blocked, market_block_reason
           )
           VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::date, $11, $12,
             'VERIFIED', 'APPROVED', true, 'No organic certifications uploaded (BR-01, BR-02)'
           )
           ON CONFLICT (user_id) DO UPDATE SET
             application_status = 'APPROVED',
             kyc_status = 'VERIFIED',
             tohfa_farmer_id = EXCLUDED.tohfa_farmer_id,
             zone_id = COALESCE(farmers.zone_id, EXCLUDED.zone_id),
             farming_experience_years = COALESCE(farmers.farming_experience_years, EXCLUDED.farming_experience_years),
             address_line1 = COALESCE(farmers.address_line1, EXCLUDED.address_line1),
             village = COALESCE(farmers.village, EXCLUDED.village),
             taluk = COALESCE(farmers.taluk, EXCLUDED.taluk),
             district = COALESCE(farmers.district, EXCLUDED.district),
             aadhaar_last4 = COALESCE(farmers.aadhaar_last4, EXCLUDED.aadhaar_last4),
             dob = COALESCE(farmers.dob, EXCLUDED.dob),
             gender = COALESCE(farmers.gender, EXCLUDED.gender),
             pincode = COALESCE(farmers.pincode, EXCLUDED.pincode)
           RETURNING id`,
          [
            userId,
            tohfaFarmerId,
            resolvedZoneId,
            experienceYears,
            personal['addressLine1'] ?? null,
            personal['village'] ?? null,
            personal['taluk'] ?? null,
            personal['district'] ?? 'The Nilgiris',
            personal['aadhaarLast4'] ?? null,
            dob,
            gender,
            pincode,
          ],
        );
        const farmerId = farmerRes.rows[0]!.id;

        const locationData = (app.step3_location as Record<string, unknown>) ?? {};
        const rawLocations = locationData['locations'];
        const locationList: Array<Record<string, unknown>> = Array.isArray(rawLocations)
          ? (rawLocations.filter(
              (l): l is Record<string, unknown> =>
                l !== null && typeof l === 'object' && !Array.isArray(l),
            ))
          : [];

        for (let i = 0; i < locationList.length; i++) {
          const location = locationList[i]!;
          const fmbPolygon = location['fmbPolygon'] as
            | { type: 'Polygon'; coordinates: number[][][] }
            | undefined;
          const hasBoundary =
            fmbPolygon !== undefined &&
            fmbPolygon !== null &&
            Array.isArray(fmbPolygon.coordinates) &&
            fmbPolygon.coordinates.length > 0;

          const rawLatitude = location['latitude'];
          const rawLongitude = location['longitude'];
          const hasCentroid = typeof rawLatitude === 'number' && typeof rawLongitude === 'number';

          await tx.query(
            `INSERT INTO farms (
               farmer_id, name, area_acres, village, district, is_primary,
               boundary, boundary_area_acres, boundary_drawn_by, boundary_drawn_at,
               centroid_lat, centroid_lng
             )
             VALUES (
               $1, $2, $3, $4, $5, $6,
               CASE WHEN $7::json IS NULL THEN NULL
                    ELSE ST_SetSRID(ST_GeomFromGeoJSON($7::json), 4326)::geography END,
               $8, $9,
               CASE WHEN $7::json IS NULL THEN NULL ELSE now() END,
               $10, $11
             )
             ON CONFLICT DO NOTHING`,
            [
              farmerId,
              location['label'] ?? `${app.full_name}'s Farm`,
              location['areaAcres'] ?? 1.0,
              personal['village'] ?? 'Kodanad',
              personal['district'] ?? 'The Nilgiris',
              i === 0,
              hasBoundary ? JSON.stringify(fmbPolygon) : null,
              hasBoundary ? (location['calculatedAreaAcres'] ?? null) : null,
              hasBoundary ? userId : null,
              hasCentroid ? rawLatitude : null,
              hasCentroid ? rawLongitude : null,
            ],
          );
        }

        // BR-219: carry the application's documents into farmer_documents with their review
        // state. Only a document whose URL is the public URL of an upload recorded against THIS
        // application is copied (the BR-54g proof rule): the storage key, type and size come
        // from that uploads row, never from the client's JSON.
        const uploads = await repo.findApplicationUploads(tx, id);
        const uploadByUrl = new Map(uploads.map((u) => [storage.getPublicUrl(u.storage_key), u]));
        const copiedDocuments: string[] = [];
        const uncopiedDocuments: string[] = [];
        for (const doc of documents) {
          const upload = uploadByUrl.get(withoutQueryOrFragment(doc.fileUrl));
          if (upload === undefined) {
            uncopiedDocuments.push(doc.documentKey);
            continue;
          }
          const reviewed = doc.review.status !== 'PENDING';
          await repo.insertFarmerDocument(tx, {
            farmerId,
            docType: doc.docType,
            storageKey: upload.storage_key,
            mimeType: upload.mime_type,
            sizeBytes: Number(upload.size_bytes),
            isMandatory: (REQUIRED_DOCUMENT_TYPES as readonly string[]).includes(doc.docType),
            verificationStatus: reviewed ? doc.review.status as 'VERIFIED' | 'REJECTED' : 'UNVERIFIED',
            verifiedBy: reviewed ? doc.review.reviewedBy : null,
            verifiedAt: reviewed && doc.review.reviewedAt !== null ? new Date(doc.review.reviewedAt) : null,
            rejectReason: doc.review.status === 'REJECTED' ? doc.review.reason : null,
          });
          copiedDocuments.push(doc.documentKey);
        }

        const updated = await repo.transitionStatus(
          tx,
          id,
          app.status,
          'APPROVED',
          actor.userId,
          body.note ?? 'Approved by admin',
          resolvedZoneId,
        );

        await tx.query(
          `UPDATE farmer_applications SET farmer_id = $1, user_id = $2, zone_id = $3, is_draft = false WHERE id = $4`,
          [farmerId, userId, resolvedZoneId, id],
        );

        await writeAuditLog(tx, {
          actorId: actor.userId,
          ...auditActorRole(actor),
          actionCode: 'farmer.application.approve',
          entityType: 'farmer_application',
          entityId: id,
          before: { status: app.status },
          after: { status: 'APPROVED', tohfaFarmerId, farmerId, copiedDocuments, uncopiedDocuments },
          changedFields: ['status', 'farmer_id', 'zone_id'],
        });

        const reread = (await repo.findById(tx, id)) ?? updated;
        return {
          response: mapApplicationResponse({ ...reread, zone_id: resolvedZoneId, tohfa_farmer_id: tohfaFarmerId }),
          event: { userId, tohfaFarmerId },
        };
        },
      );

      // A replay approved nothing, so it announces nothing.
      if (!replayed) {
        await eventBus.publish('farmer.application.approved', {
          userId: result.event.userId,
          applicationId: id,
          tohfaFarmerId: result.event.tohfaFarmerId,
        });
      }

      return result.response;
    },

    async rejectApplication(actor, scope, id, body, idempotencyKey) {
      type RejectOutcome = { response: ReturnType<typeof mapApplicationResponse>; userId: string | null };
      const { result, replayed } = await adminMutation<RejectOutcome>(
        actor,
        scope,
        id,
        idempotencyKey,
        'farmer.application.reject',
        body,
        async (tx, app) => {
          if (app.is_draft) {
            throw new AppError('INVALID_STATE_TRANSITION', {
              status: 409,
              detail: 'Cannot reject a draft application.',
            });
          }

          if (app.status === 'REJECTED') {
            throw new AppError('CONFLICT', {
              status: 409,
              detail: 'Application is already rejected.',
            });
          }

          if (!isValidTransition(app.status, 'REJECTED')) {
            throw new AppError('INVALID_STATE_TRANSITION', {
              status: 409,
              detail: `Illegal transition from ${app.status} to REJECTED.`,
            });
          }

          // BR-218: the code is stored in its own column; the note text keeps the old
          // "[CODE] reason" form so `rejectionReason` reads as it always has.
          const res = await repo.transitionStatus(
            tx,
            id,
            app.status,
            'REJECTED',
            actor.userId,
            `[${body.reasonCode}] ${body.reason}`,
            undefined,
            { reasonCode: body.reasonCode },
          );

          await writeAuditLog(tx, {
            actorId: actor.userId,
            ...auditActorRole(actor),
            actionCode: 'farmer.application.reject',
            entityType: 'farmer_application',
            entityId: id,
            before: { status: app.status },
            after: { status: 'REJECTED', reasonCode: body.reasonCode, reason: body.reason },
            changedFields: ['status'],
          });

          return { response: mapApplicationResponse((await repo.findById(tx, id)) ?? res), userId: app.user_id };
        },
      );

      if (!replayed && result.userId) {
        await eventBus.publish('farmer.application.rejected', {
          userId: result.userId,
          applicationId: id,
          reason: body.reason,
        });
      }

      return result.response;
    },

    async requestInfoApplication(actor, scope, id, body, idempotencyKey) {
      const items = [...new Set(body.items)];
      type InfoOutcome = { response: ReturnType<typeof mapApplicationResponse>; userId: string | null };
      const { result, replayed } = await adminMutation<InfoOutcome>(
        actor,
        scope,
        id,
        idempotencyKey,
        'farmer.application.request_info',
        body,
        async (tx, app) => {
          if (app.is_draft) {
            throw new AppError('INVALID_STATE_TRANSITION', {
              status: 409,
              detail: 'Cannot request info on a draft application.',
            });
          }

          // BR-217: only from the two review stages.
          if (!isValidTransition(app.status, 'INFO_REQUESTED')) {
            throw new AppError('INVALID_STATE_TRANSITION', {
              status: 409,
              detail: `Cannot request info on an application in ${app.status} status.`,
            });
          }

          // No zone is passed: a request never moves the farm (the old code nulled zone_id here).
          const res = await repo.transitionStatus(
            tx,
            id,
            app.status,
            'INFO_REQUESTED',
            actor.userId,
            body.message,
            undefined,
            { requestedItems: items },
          );

          // The older body field: re-open the named steps so the app walks the applicant through them.
          if (body.requiredSteps && body.requiredSteps.length > 0) {
            const remainingSteps = app.completed_steps.filter((s) => !body.requiredSteps!.includes(s));
            await tx.query(`UPDATE farmer_applications SET completed_steps = $1 WHERE id = $2`, [remainingSteps, id]);
          }

          await writeAuditLog(tx, {
            actorId: actor.userId,
            ...auditActorRole(actor),
            actionCode: 'farmer.application.request_info',
            entityType: 'farmer_application',
            entityId: id,
            before: { status: app.status },
            after: { status: 'INFO_REQUESTED', items, message: body.message, requiredSteps: body.requiredSteps },
            changedFields: ['status'],
          });

          return { response: mapApplicationResponse((await repo.findById(tx, id)) ?? res), userId: app.user_id };
        },
      );

      // BR-217: an applicant with no account yet cannot be notified; the request still stands and
      // is shown on the public status endpoint.
      if (!replayed && result.userId) {
        await eventBus.publish('farmer.application.info_requested', {
          userId: result.userId,
          applicationId: id,
          steps: body.requiredSteps ?? [4],
          items,
          message: body.message,
        });
      }

      return result.response;
    },

    async advanceApplication(actor, scope, id, body, idempotencyKey) {
      const { result } = await adminMutation(
        actor,
        scope,
        id,
        idempotencyKey,
        'farmer.application.advance',
        body,
        async (tx, app) => {
          if (app.is_draft || app.status !== 'DOCS_REVIEW' || !isValidTransition(app.status, body.toStatus)) {
            throw new AppError('INVALID_STATE_TRANSITION', {
              status: 409,
              detail: `An application advances to ${body.toStatus} from DOCS_REVIEW only (current status: ${app.is_draft ? 'DRAFT' : app.status}).`,
            });
          }

          // BR-214 docs gate.
          const reviews = await repo.listReviews(tx, id);
          const blockers = documentGateBlockers(applicationDocuments(app.step4_documents, reviews));
          if (blockers.length > 0) throw documentsGateError(blockers);

          await repo.transitionStatus(tx, id, app.status, body.toStatus, actor.userId, body.note ?? 'Documents verified');

          await writeAuditLog(tx, {
            actorId: actor.userId,
            ...auditActorRole(actor),
            actionCode: 'farmer.application.advance',
            entityType: 'farmer_application',
            entityId: id,
            before: { status: app.status },
            after: { status: body.toStatus, note: body.note ?? null },
            changedFields: ['status'],
          });

          const reread = (await repo.findById(tx, id)) ?? app;
          return buildAdminDetail(tx, reread);
        },
      );
      return result;
    },

    async reviewApplicationDocument(actor, scope, id, documentKey, body, idempotencyKey) {
      const { result } = await adminMutation(
        actor,
        scope,
        id,
        idempotencyKey,
        'farmer.application.verify_document',
        { documentKey, body },
        async (tx, app) => {
          const reviews = await repo.listReviews(tx, id);
          const document = applicationDocuments(app.step4_documents, reviews).find((d) => d.documentKey === documentKey);
          if (document === undefined) {
            throw new AppError('NOT_FOUND', { detail: 'No document with that documentKey on this application.' });
          }
          if (app.is_draft || !REVIEWABLE_STATUSES.includes(app.status)) {
            throw new AppError('INVALID_STATE_TRANSITION', {
              status: 409,
              detail: `Documents are reviewed in DOCS_REVIEW or FARM_VERIFICATION (current status: ${app.is_draft ? 'DRAFT' : app.status}).`,
            });
          }

          await repo.insertReview(tx, {
            applicationId: id,
            subjectType: 'DOCUMENT',
            subjectKey: documentKey,
            // The key is derived from the file, so it is also the fingerprint (BR-215).
            contentFingerprint: documentKey,
            decision: body.decision,
            reason: body.reason ?? null,
            reviewedBy: actor.userId,
          });

          await writeAuditLog(tx, {
            actorId: actor.userId,
            ...auditActorRole(actor),
            actionCode: 'farmer.application.verify_document',
            entityType: 'farmer_application',
            entityId: id,
            before: { documentKey, docType: document.docType, status: document.review.status },
            after: { documentKey, docType: document.docType, status: body.decision, reason: body.reason ?? null },
            changedFields: ['documents'],
          });

          return buildAdminDetail(tx, app);
        },
      );
      return result;
    },

    async reviewApplicationFmb(actor, scope, id, locationId, body, idempotencyKey) {
      const { result } = await adminMutation(
        actor,
        scope,
        id,
        idempotencyKey,
        'farmer.application.verify_fmb',
        { locationId, body },
        async (tx, app) => {
          const rawLocations = (app.step3_location as Record<string, unknown> | null)?.['locations'];
          const list: unknown[] = Array.isArray(rawLocations) ? rawLocations : [];
          let target: Record<string, unknown> | undefined;
          list.forEach((entry, index) => {
            if (target !== undefined || entry === null || typeof entry !== 'object' || Array.isArray(entry)) return;
            if (locationIdOf(entry as Record<string, unknown>, index) === locationId) target = entry as Record<string, unknown>;
          });
          if (target === undefined) {
            throw new AppError('NOT_FOUND', { detail: 'No land location with that id on this application.' });
          }
          if (app.is_draft || !REVIEWABLE_STATUSES.includes(app.status)) {
            throw new AppError('INVALID_STATE_TRANSITION', {
              status: 409,
              detail: `FMB boundaries are reviewed in DOCS_REVIEW or FARM_VERIFICATION (current status: ${app.is_draft ? 'DRAFT' : app.status}).`,
            });
          }

          const before = applicationLocations(app.step3_location, await repo.listReviews(tx, id)).find(
            (l) => l.locationId === locationId,
          );
          await repo.insertReview(tx, {
            applicationId: id,
            subjectType: 'FMB',
            subjectKey: locationId,
            contentFingerprint: fmbFingerprintOf(target),
            decision: body.decision,
            reason: body.reason ?? null,
            reviewedBy: actor.userId,
          });

          await writeAuditLog(tx, {
            actorId: actor.userId,
            ...auditActorRole(actor),
            actionCode: 'farmer.application.verify_fmb',
            entityType: 'farmer_application',
            entityId: id,
            before: { locationId, status: before?.fmbReview.status ?? 'PENDING' },
            after: { locationId, status: body.decision, reason: body.reason ?? null },
            changedFields: ['locations'],
          });

          return buildAdminDetail(tx, app);
        },
      );
      return result;
    },

    async addApplicationNote(actor, scope, id, body, idempotencyKey) {
      const { result } = await adminMutation(
        actor,
        scope,
        id,
        idempotencyKey,
        'farmer.application.add_note',
        body,
        async (tx, app) => {
          // BR-218: any live, submitted stage -- including a legacy AUDIT row, which can be
          // annotated though it cannot move.
          if (app.is_draft || app.status === 'APPROVED' || app.status === 'REJECTED') {
            throw new AppError('INVALID_STATE_TRANSITION', {
              status: 409,
              detail: `Review notes are added to submitted, undecided applications (current status: ${app.is_draft ? 'DRAFT' : app.status}).`,
            });
          }

          const note = await repo.insertNote(tx, {
            applicationId: id,
            status: app.status,
            actorId: actor.userId,
            note: body.note,
          });

          await writeAuditLog(tx, {
            actorId: actor.userId,
            ...auditActorRole(actor),
            actionCode: 'farmer.application.add_note',
            entityType: 'farmer_application',
            entityId: id,
            after: { historyId: note.id, status: app.status, note: body.note },
            changedFields: ['reviewHistory'],
          });

          return buildAdminDetail(tx, app);
        },
      );
      return result;
    },
  };
}

export const farmerApplicationsService = createFarmerApplicationsService();
