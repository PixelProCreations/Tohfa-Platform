import { writeAuditLog } from '../../audit/auditLog.js';
import type { Actor } from '../../auth/requireAuth.js';
import { pool, withTransaction } from '../../db/pool.js';
import { eventBus } from '../../events/bus.js';
import { AppError } from '../../http/problem.js';
import type { SignedUploadTarget } from '../../storage/blobStorage.js';
import { uploadsService, type UploadsService } from '../uploads/uploads.service.js';
import type { SignUploadBody } from '../uploads/uploads.schema.js';
import { calculatePolygonMetrics } from './geo.utils.js';
import {
  farmerApplicationsRepo,
  type ApplicationStatus,
  type FarmerApplicationRow,
  type FarmerApplicationsRepo,
} from './farmer-applications.repo.js';
import type {
  ApproveApplicationBody,
  CreateFarmerApplicationBody,
  ListAdminApplicationsQuery,
  RejectApplicationBody,
  RequestInfoApplicationBody,
  UpdateFarmerProfileBody,
} from './farmer-applications.schema.js';

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

const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  SUBMITTED: ['DOCS_REVIEW', 'REJECTED'],
  DOCS_REVIEW: ['FARM_VERIFICATION', 'REJECTED'],
  FARM_VERIFICATION: ['AUDIT', 'REJECTED'],
  AUDIT: ['APPROVED', 'REJECTED'],
  APPROVED: [],
  REJECTED: [],
};

export function isValidTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

function mapApplicationResponse(row: FarmerApplicationRow) {
  return {
    id: row.id,
    mobile: row.mobile,
    fullName: row.full_name,
    preferredLocale: row.preferred_locale,
    status: row.status,
    isDraft: row.is_draft,
    currentStep: row.current_step,
    completedSteps: row.completed_steps,
    step1Personal: row.step1_personal,
    step2FarmDetails: row.step2_farm_details,
    step3Location: row.step3_location,
    step4Documents: row.step4_documents,
    submittedAt: row.submitted_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
  };
}

export interface FarmerApplicationsService {
  createDraft(input: CreateFarmerApplicationBody, actor?: Actor | undefined): Promise<unknown>;
  updateStep(actor: Actor | undefined, id: string, step: number, payload: unknown): Promise<unknown>;
  requestDocumentUploadUrl(id: string, body: SignUploadBody): Promise<SignedUploadTarget>;
  submitApplication(actor: Actor | undefined, id: string): Promise<unknown>;
  getStatusTimeline(actor: Actor | undefined, id: string): Promise<unknown>;
  transitionStatus(
    actor: Actor,
    id: string,
    toStatus: ApplicationStatus,
    note?: string | undefined,
  ): Promise<unknown>;
  getMyProfile(actor: Actor): Promise<unknown>;
  updateMyProfile(actor: Actor, body: UpdateFarmerProfileBody): Promise<unknown>;
  listAdminApplications(actor: Actor, query: ListAdminApplicationsQuery): Promise<unknown>;
  getAdminApplication(actor: Actor, id: string): Promise<unknown>;
  approveApplication(actor: Actor, id: string, body: ApproveApplicationBody): Promise<unknown>;
  rejectApplication(actor: Actor, id: string, body: RejectApplicationBody): Promise<unknown>;
  requestInfoApplication(actor: Actor, id: string, body: RequestInfoApplicationBody): Promise<unknown>;
}

export function createFarmerApplicationsService(
  repo: FarmerApplicationsRepo = farmerApplicationsRepo,
  // Injectable so unit tests can substitute a mocked uploads service instead of hitting the
  // real blob storage + `uploads` table (see orders.service.ts's `walletSvc` for the same
  // cross-module DI pattern). Only the one method this service actually calls is required.
  uploadsSvc: Pick<UploadsService, 'signUploadForOwner'> = uploadsService,
): FarmerApplicationsService {
  return {
    async createDraft(input, actor) {
      const existing = await repo.findLiveByMobile(pool, input.mobile);
      if (existing !== null) {
        throw new AppError('CONFLICT', {
          status: 409,
          detail: 'An active non-terminal application already exists for this mobile number.',
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
        // own acreage and boundary. The route does not Zod-validate the body, so
        // this normalises whatever arrives into one canonical stored shape: the
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

      // Cross-step validation
      const docs = (app.step4_documents as { documents?: Array<{ docType: string }> })?.documents ?? [];
      const docTypes = docs.map((d) => d.docType);

      const hasIdProof = docTypes.includes('ID_PROOF');
      const hasFarmDoc = docTypes.includes('FARM_DOC');

      if (!hasIdProof || !hasFarmDoc) {
        throw new AppError('VALIDATION_FAILED', {
          status: 422,
          detail: 'Mandatory documents missing: ID_PROOF and FARM_DOC are required for submission.',
          meta: {
            missingDocuments: [
              ...(!hasIdProof ? ['ID_PROOF'] : []),
              ...(!hasFarmDoc ? ['FARM_DOC'] : []),
            ],
          },
        });
      }

      if (!isValidTransition(app.status, 'DOCS_REVIEW')) {
        throw new AppError('INVALID_STATE_TRANSITION', {
          status: 422,
          detail: `Cannot transition application from ${app.status} to DOCS_REVIEW.`,
        });
      }

      const updated = await repo.transitionStatus(
        pool,
        id,
        app.status,
        'DOCS_REVIEW',
        actor?.userId,
        'Submitted by applicant',
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
        steps: history.map((h) => ({
          status: h.to_status,
          reachedAt: h.created_at.toISOString(),
          note: h.note,
        })),
      };
    },

    async transitionStatus(actor, id, toStatus, note) {
      const app = await repo.findById(pool, id);
      if (app === null) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }

      if (!isValidTransition(app.status, toStatus)) {
        throw new AppError('INVALID_STATE_TRANSITION', {
          status: 422,
          detail: `Illegal transition from ${app.status} to ${toStatus}.`,
        });
      }

      const updated = await repo.transitionStatus(pool, id, app.status, toStatus, actor.userId, note);
      return mapApplicationResponse(updated);
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
        createdAt: updated.created_at.toISOString(),
      };
    },

    async listAdminApplications(_actor, query) {
      const { items, nextCursor, hasMore } = await repo.listAdminApplications(pool, query);
      return {
        items: items.map(mapApplicationResponse),
        page: { nextCursor, hasMore },
      };
    },

    async getAdminApplication(_actor, id) {
      const app = await repo.findById(pool, id);
      if (app === null) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }
      return mapApplicationResponse(app);
    },

    async approveApplication(actor, id, body) {
      const app = await repo.findById(pool, id);
      if (app === null) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }

      if (app.status === 'APPROVED') {
        throw new AppError('CONFLICT', {
          status: 409,
          detail: 'Application is already approved.',
        });
      }

      const result = await withTransaction(async (tx) => {
        const year = new Date().getFullYear();
        const tohfaFarmerId = await repo.allocateNextTohfaFarmerId(tx, year);

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

        const personal = (app.step1_personal as Record<string, unknown>) ?? {};
        const farmDetails = (app.step2_farm_details as Record<string, unknown>) ?? {};

        // Experience is collected in step 2 (the farming operation), which is the only
        // screen that actually asks for it. The step-1 read is a fallback for
        // applications that were already in flight when it moved, where the value may
        // still sit in `step1_personal.farmingExperienceYears`.
        const experienceYears =
          farmDetails['experienceYears'] ?? personal['farmingExperienceYears'] ?? 0;

        // dob/gender/pincode are genuinely collected in step 1 (real inputs on
        // Step1Personal.tsx) but were previously read nowhere on approval, silently
        // dropping data the farmer actually provided even though `farmers` has real
        // columns for all three. Each is normalised/validated defensively here
        // (never thrown on) because none of this JSONB was ever schema-validated on
        // the write path -- see updateStep's step===1 branch.
        const dob = parseDobForInsert(personal['dob']);
        const gender = normalizeGenderForInsert(personal['gender']);
        const pincode = normalizePincodeForInsert(personal['pincode']);

        // NOTE: `step2FarmDetails.totalAreaAcres` is deliberately NOT persisted onto a
        // farmer or farm column. It is the farmer's stated total holding and stays in
        // the step-2 JSONB as a claim; `farms.area_acres` below keeps coming from each
        // location's own measured `areaAcres`. Collapsing the two would erase the
        // claim-vs-ground discrepancy that FARM_VERIFICATION exists to look at.
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
             tohfa_farmer_id = EXCLUDED.tohfa_farmer_id
           RETURNING id`,
          [
            userId,
            tohfaFarmerId,
            body.zoneId ?? null,
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

        // One farms row per land location captured in step 3. There is a single
        // farming operation per farmer (its type of farming and years of experience
        // live in step 2) — what varies per row is the parcel, so each location is
        // self-contained and nothing is correlated across steps.
        // An application with no step-3 data therefore creates no farms rows; that
        // degrades quietly rather than failing an otherwise valid approval.
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

          // centroid_lat/centroid_lng are gated independently of hasBoundary:
          // farmLocationItemSchema allows latitude/longitude without an fmbPolygon
          // (manual entry, gpsCaptured: false) and allows either coordinate alone.
          // `farms_centroid_pair_chk` (db/migrations/0003_farmers_and_farms.sql)
          // rejects a row where exactly one of the pair is set, so both must be
          // present together or neither is written.
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

        const updated = await repo.transitionStatus(
          tx,
          id,
          app.status,
          'APPROVED',
          actor.userId,
          body.note ?? 'Approved by admin',
        );

        await tx.query(
          `UPDATE farmer_applications SET farmer_id = $1, user_id = $2 WHERE id = $3`,
          [farmerId, userId, id],
        );

        await writeAuditLog(tx, {
          actorId: actor.userId,
          ...(actor.roles[0]?.code ? { actorRole: actor.roles[0].code } : {}),
          actionCode: 'farmer.application.approve',
          entityType: 'farmer_application',
          entityId: id,
          before: { status: app.status },
          after: { status: 'APPROVED', tohfaFarmerId, farmerId },
          changedFields: ['status', 'farmer_id'],
        });

        return { updated, tohfaFarmerId, userId };
      });

      await eventBus.publish('farmer.application.approved', {
        userId: result.userId,
        applicationId: id,
        tohfaFarmerId: result.tohfaFarmerId,
      });

      return mapApplicationResponse(result.updated);
    },

    async rejectApplication(actor, id, body) {
      const app = await repo.findById(pool, id);
      if (app === null) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }

      if (app.status === 'REJECTED') {
        throw new AppError('CONFLICT', {
          status: 409,
          detail: 'Application is already rejected.',
        });
      }

      const updated = await withTransaction(async (tx) => {
        const res = await repo.transitionStatus(
          tx,
          id,
          app.status,
          'REJECTED',
          actor.userId,
          `[${body.reasonCode}] ${body.reason}`,
        );

        await writeAuditLog(tx, {
          actorId: actor.userId,
          ...(actor.roles[0]?.code ? { actorRole: actor.roles[0].code } : {}),
          actionCode: 'farmer.application.reject',
          entityType: 'farmer_application',
          entityId: id,
          before: { status: app.status },
          after: { status: 'REJECTED', reasonCode: body.reasonCode, reason: body.reason },
          changedFields: ['status'],
        });

        return res;
      });

      if (app.user_id) {
        await eventBus.publish('farmer.application.rejected', {
          userId: app.user_id,
          applicationId: id,
          reason: body.reason,
        });
      }

      return mapApplicationResponse(updated);
    },

    async requestInfoApplication(actor, id, body) {
      const app = await repo.findById(pool, id);
      if (app === null) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }

      const updated = await withTransaction(async (tx) => {
        const res = await repo.transitionStatus(
          tx,
          id,
          app.status,
          'DOCS_REVIEW',
          actor.userId,
          `More info requested: ${body.message}`,
        );

        if (body.requiredSteps && body.requiredSteps.length > 0) {
          const remainingSteps = app.completed_steps.filter(
            (s) => !body.requiredSteps!.includes(s),
          );
          await tx.query(
            `UPDATE farmer_applications SET completed_steps = $1 WHERE id = $2`,
            [remainingSteps, id],
          );
        }

        await writeAuditLog(tx, {
          actorId: actor.userId,
          ...(actor.roles[0]?.code ? { actorRole: actor.roles[0].code } : {}),
          actionCode: 'farmer.application.request_info',
          entityType: 'farmer_application',
          entityId: id,
          before: { status: app.status },
          after: { status: 'DOCS_REVIEW', message: body.message, requiredSteps: body.requiredSteps },
          changedFields: ['status'],
        });

        return res;
      });

      if (app.user_id) {
        await eventBus.publish('farmer.application.info_requested', {
          userId: app.user_id,
          applicationId: id,
          steps: body.requiredSteps ?? [4],
          message: body.message,
        });
      }

      return mapApplicationResponse(updated);
    },
  };
}

export const farmerApplicationsService = createFarmerApplicationsService();
