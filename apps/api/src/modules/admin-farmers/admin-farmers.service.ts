/**
 * Admin farmer directory and profile (BR-108).
 *
 * SCOPE. Every read goes through `farmerScopeFilter`, a WHERE fragment, so a farmer outside the
 * caller's scope is absent from a list and is the same NOT_FOUND as a missing farmer on a
 * single-farmer route (root CLAUDE.md 2.1: a 403 would confirm the farmer exists). Which column
 * confines a scope is decided by the WINNING role's `scopeDimension` in docs/rbac.json, never by a
 * role name:
 *   - `zone_id`     (FARMER_ADMIN)  -> the farmer's CURRENT zone, `f.zone_id` (same as farm ratings)
 *   - `farmer_id`   (FARMER)        -> its own farmer row only. Since the 2026-10-23 rbac.json
 *     tightening FARMER holds `none` on `farmer.profile.edit` and `farmer.subscription.view_tier_limits`;
 *     only `farmer.document.view` (`own`) still lets a farmer reach this module (its own documents).
 *   - `null`/`warehouse_id` (SUPER, TOHFA, MAIN / SUB) -> `warehouseScopeFilter` on the zone's
 *     warehouse: `all`, and MAIN's restricted grant with no warehouse, see every farmer; SUB sees
 *     farmers whose zone belongs to its warehouse (a farmer with no zone matches no warehouse).
 *   - anything else fails closed.
 * docs/rbac.json attaches NO `OWN_ZONE_ONLY` predicate to these codes; the Farmer Admin's zone
 * confinement is its scope dimension (rbac.json scopeFilters, `scopedWhere`).
 *
 * LOCKED FIELDS (BR-33). `mobile`, `aadhaarLast4` and `aadhaar` need `farmer.profile.edit_locked_field`
 * (resolved by the route and passed in as `lockedFieldScope`). Without it the request is refused
 * FIELD_LOCKED BEFORE anything is read or written, so nothing in it is applied. The full Aadhaar
 * number is never stored (Decision 8), so `aadhaar` is refused even for a SUPER_ADMIN.
 *
 * VERIFY IS IDEMPOTENT (BR-108 item 5). The document row is locked FOR UPDATE; an already VERIFIED
 * document is returned unchanged with no write and no audit row, so a double click or a retry
 * records one verification by the first admin.
 */
import { changedFields, writeAuditLog } from '../../audit/auditLog.js';
import type { Executor } from '../../db/pool.js';
import { pool, withTransaction } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { loadRbac } from '../../rbac/loadRbac.js';
import { scopedWhere, type ResolvedScope, type ScopedWhere } from '../../rbac/requirePermission.js';
import { warehouseScopeFilter } from '../../rbac/warehouseScope.js';
import { defaultBlobStorage, type BlobStorage } from '../../storage/blobStorage.js';
import {
  adminFarmersRepo,
  type AdminFarmersRepo,
  type FarmerDocumentRow,
  type FarmerPatch,
  type FarmerProfileRow,
  type UserPatch,
} from './admin-farmers.repo.js';
import {
  LOCKED_FIELDS,
  lockedAadhaarLast4Schema,
  lockedMobileSchema,
  type AdminFarmerDetail,
  type AdminFarmerDocument,
  type AdminFarmerDocumentListResponse,
  type AdminFarmerListResponse,
  type AdminFarmerPayoutDestinationListResponse,
  type AdminFarmerSubscription,
  type ListAdminFarmersQuery,
  type UpdateAdminFarmerBody,
} from './admin-farmers.schema.js';

/** BR-54c: a signed read URL lives for this long (same lifetime as the farmer's own documents). */
const READ_URL_TTL_MINUTES = 15;

/** Postgres unique_violation (a mobile already used by another live user). */
const UNIQUE_VIOLATION = '23505';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface AdminFarmersServiceDeps {
  repo: AdminFarmersRepo;
  db: Executor;
  transaction: TransactionRunner;
  storage: BlobStorage;
}

export interface AdminFarmersService {
  list(scope: ResolvedScope, query: ListAdminFarmersQuery): Promise<AdminFarmerListResponse>;
  get(scope: ResolvedScope, farmerId: string): Promise<AdminFarmerDetail>;
  update(
    scope: ResolvedScope,
    lockedFieldScope: ResolvedScope | null,
    farmerId: string,
    body: UpdateAdminFarmerBody,
  ): Promise<AdminFarmerDetail>;
  listDocuments(scope: ResolvedScope, farmerId: string): Promise<AdminFarmerDocumentListResponse>;
  verifyDocument(scope: ResolvedScope, farmerId: string, documentId: string): Promise<AdminFarmerDocument>;
  listBankAccounts(scope: ResolvedScope, farmerId: string): Promise<AdminFarmerPayoutDestinationListResponse>;
  getSubscription(scope: ResolvedScope, farmerId: string): Promise<AdminFarmerSubscription>;
}

/** The single place a scope becomes SQL for this module. Columns: `f` farmers, `z` zones. */
export function farmerScopeFilter(scope: ResolvedScope): ScopedWhere {
  const dimension = loadRbac().rolesByCode.get(scope.roleCode)?.scopeDimension;
  if (dimension === 'zone_id') return scopedWhere(scope, { zoneColumn: 'f.zone_id' });
  if (dimension === 'farmer_id') return scopedWhere(scope, { farmerColumn: 'f.id' });
  return warehouseScopeFilter(scope, 'z.warehouse_id');
}

function notFound(farmerId: string): AppError {
  return new AppError('NOT_FOUND', { detail: `No farmer with id "${farmerId}" is visible to you.` });
}

/** The editable profile image used for the diff and the audit row. Aadhaar is last 4 only. */
function profileImage(profile: FarmerProfileRow): Record<string, unknown> {
  return {
    fullName: profile.fullName,
    email: profile.email,
    mobile: profile.mobile,
    aadhaarLast4: profile.aadhaarLast4,
    dob: profile.dob,
    gender: profile.gender,
    farmingExperienceYears: profile.farmingExperienceYears,
    addressLine1: profile.addressLine1,
    addressLine2: profile.addressLine2,
    village: profile.village,
    taluk: profile.taluk,
    district: profile.district,
    pincode: profile.pincode,
  };
}

const USER_FIELDS = ['fullName', 'email', 'mobile'] as const;
const FARMER_FIELDS = [
  'dob',
  'gender',
  'farmingExperienceYears',
  'addressLine1',
  'addressLine2',
  'village',
  'taluk',
  'district',
  'pincode',
  'aadhaarLast4',
] as const;

function lockedValueError(field: string, message: string): AppError {
  return new AppError('VALIDATION_FAILED', { detail: 'One or more fields are invalid.', errors: { [`body.${field}`]: [message] } });
}

/**
 * The requested values, with the locked ones validated. Called only after the FIELD_LOCKED check,
 * i.e. for a caller allowed to change them.
 */
function requestedValues(body: UpdateAdminFarmerBody): Record<string, unknown> {
  const { mobile, aadhaarLast4, aadhaar, ...rest } = body;
  if (aadhaar !== undefined) {
    throw lockedValueError('aadhaar', 'The full Aadhaar number is never stored; send aadhaarLast4.');
  }
  const values: Record<string, unknown> = { ...rest };
  if (mobile !== undefined) {
    const parsed = lockedMobileSchema.safeParse(mobile);
    if (!parsed.success) throw lockedValueError('mobile', parsed.error.issues[0]?.message ?? 'Invalid mobile.');
    values['mobile'] = parsed.data;
  }
  if (aadhaarLast4 !== undefined) {
    const parsed = lockedAadhaarLast4Schema.safeParse(aadhaarLast4);
    if (!parsed.success) throw lockedValueError('aadhaarLast4', parsed.error.issues[0]?.message ?? 'Invalid aadhaarLast4.');
    values['aadhaarLast4'] = parsed.data;
  }
  return values;
}

export function createAdminFarmersService(deps: Partial<AdminFarmersServiceDeps> = {}): AdminFarmersService {
  const repo = deps.repo ?? adminFarmersRepo;
  const db = deps.db ?? pool;
  const transaction: TransactionRunner = deps.transaction ?? ((fn) => withTransaction(fn));
  const storage = deps.storage ?? defaultBlobStorage;

  async function assemble(executor: Executor, profile: FarmerProfileRow): Promise<AdminFarmerDetail> {
    // Sequential on purpose: `executor` may be a single transaction client.
    const landLocations = await repo.findLandLocations(executor, profile.id);
    const certificationSummary = await repo.findCertificationSummary(executor, profile.id);
    return {
      id: profile.id,
      tohfaFarmerId: profile.tohfaFarmerId,
      fullName: profile.fullName,
      mobile: profile.mobile,
      email: profile.email,
      accountStatus: profile.accountStatus as AdminFarmerDetail['accountStatus'],
      applicationStatus: profile.applicationStatus as AdminFarmerDetail['applicationStatus'],
      kycStatus: profile.kycStatus as AdminFarmerDetail['kycStatus'],
      zone: profile.zone,
      aadhaarLast4: profile.aadhaarLast4,
      dob: profile.dob,
      gender: profile.gender as AdminFarmerDetail['gender'],
      farmingExperienceYears: profile.farmingExperienceYears,
      address: {
        line1: profile.addressLine1,
        line2: profile.addressLine2,
        village: profile.village,
        taluk: profile.taluk,
        district: profile.district,
        pincode: profile.pincode,
      },
      isMarketBlocked: profile.isMarketBlocked,
      marketBlockReason: profile.marketBlockReason,
      landLocations,
      certificationSummary,
      rating: {
        overallRating: profile.overallRating,
        ratingTier: profile.ratingTier as AdminFarmerDetail['rating']['ratingTier'],
      },
      approvedAt: profile.approvedAt === null ? null : profile.approvedAt.toISOString(),
      createdAt: profile.createdAt.toISOString(),
    };
  }

  async function toDocument(row: FarmerDocumentRow): Promise<AdminFarmerDocument> {
    return {
      id: row.id,
      docType: row.docType as AdminFarmerDocument['docType'],
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      isMandatory: row.isMandatory,
      verificationStatus: row.verificationStatus as AdminFarmerDocument['verificationStatus'],
      verifiedBy: row.verifiedBy,
      verifiedAt: row.verifiedAt === null ? null : row.verifiedAt.toISOString(),
      rejectReason: row.rejectReason,
      uploadedAt: row.createdAt.toISOString(),
      readUrl: await storage.generateReadUrl(row.storageKey, READ_URL_TTL_MINUTES),
    };
  }

  /** Verification-state image for the audit row: never the storage key. */
  function documentImage(row: FarmerDocumentRow): Record<string, unknown> {
    return {
      docType: row.docType,
      verificationStatus: row.verificationStatus,
      verifiedBy: row.verifiedBy,
      verifiedAt: row.verifiedAt === null ? null : row.verifiedAt.toISOString(),
      rejectReason: row.rejectReason,
    };
  }

  async function requireVisible(executor: Executor, scope: ResolvedScope, farmerId: string): Promise<void> {
    if (!(await repo.isVisible(executor, farmerId, farmerScopeFilter(scope)))) throw notFound(farmerId);
  }

  return {
    async list(scope, query) {
      const { cursor, limit, ...filters } = query;
      const result = await repo.list(db, { filters, scope: farmerScopeFilter(scope), limit, cursor });
      return { items: result.items, page: { nextCursor: result.nextCursor, hasMore: result.hasMore } };
    },

    async get(scope, farmerId) {
      const profile = await repo.findProfile(db, farmerId, farmerScopeFilter(scope));
      if (profile === null) throw notFound(farmerId);
      return assemble(db, profile);
    },

    async update(scope, lockedFieldScope, farmerId, body) {
      // BR-33a: refused before anything is read or written, so nothing in the request is applied.
      const lockedSent = LOCKED_FIELDS.filter((field) => body[field] !== undefined);
      if (lockedSent.length > 0 && lockedFieldScope === null) {
        throw new AppError('FIELD_LOCKED', {
          detail: 'Aadhaar and mobile may only be changed by a Super Admin.',
          meta: { fields: lockedSent },
        });
      }
      const requested = requestedValues(body);

      return transaction(async (tx) => {
        const filter = farmerScopeFilter(scope);
        if (!(await repo.lockFarmer(tx, farmerId, filter))) throw notFound(farmerId);
        const current = await repo.findProfile(tx, farmerId, filter);
        if (current === null) throw notFound(farmerId);

        const before = profileImage(current);
        const after = { ...before, ...requested };
        const changed = changedFields(before, after);
        if (changed.length === 0) return assemble(tx, current);

        const userPatch: UserPatch = {};
        const farmerPatch: FarmerPatch = {};
        for (const field of changed) {
          if ((USER_FIELDS as readonly string[]).includes(field)) {
            (userPatch as Record<string, unknown>)[field] = after[field];
          } else if ((FARMER_FIELDS as readonly string[]).includes(field)) {
            (farmerPatch as Record<string, unknown>)[field] = after[field];
          }
        }

        try {
          if (Object.keys(userPatch).length > 0) await repo.updateUser(tx, current.userId, userPatch);
          if (Object.keys(farmerPatch).length > 0) await repo.updateFarmer(tx, farmerId, farmerPatch);
        } catch (error) {
          if ((error as { code?: unknown }).code === UNIQUE_VIOLATION) {
            throw new AppError('CONFLICT', { detail: 'That mobile number already belongs to another account.' });
          }
          throw error;
        }

        const updated = await repo.findProfile(tx, farmerId, filter);
        if (updated === null) throw notFound(farmerId);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.profile.edit',
          entityType: 'farmer',
          entityId: farmerId,
          before,
          after: profileImage(updated),
          changedFields: changed,
        });
        return assemble(tx, updated);
      });
    },

    async listDocuments(scope, farmerId) {
      await requireVisible(db, scope, farmerId);
      const rows = await repo.listDocuments(db, farmerId);
      const items = await Promise.all(rows.map(toDocument));
      return { items };
    },

    async verifyDocument(scope, farmerId, documentId) {
      return transaction(async (tx) => {
        // Same order as `update`: the scoped farmer row lock comes first, so the
        // scope is evaluated on a row no one can re-zone or soft-delete until
        // this transaction ends. A non-locking visibility check followed by a
        // lock on the document alone left a window where the farmer could move
        // out of the caller's scope between the check and the verify. A farmer
        // outside the scope is 404, never 403 (BR-108a).
        if (!(await repo.lockFarmer(tx, farmerId, farmerScopeFilter(scope)))) throw notFound(farmerId);
        const current = await repo.findDocumentForUpdate(tx, farmerId, documentId);
        if (current === null) {
          throw new AppError('NOT_FOUND', { detail: `No document with id "${documentId}" for this farmer.` });
        }
        // BR-108: verifying an already VERIFIED document changes nothing and records nothing.
        if (current.verificationStatus === 'VERIFIED') return toDocument(current);

        const verified = await repo.markDocumentVerified(tx, documentId, scope.userId);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.document.verify',
          entityType: 'farmer_document',
          entityId: documentId,
          before: documentImage(current),
          after: documentImage(verified),
          changedFields: changedFields(documentImage(current), documentImage(verified)),
        });
        return toDocument(verified);
      });
    },

    async listBankAccounts(scope, farmerId) {
      // Not audited: BR-35 and BR-53 audit mutations; no rule asks for an audit of this read.
      await requireVisible(db, scope, farmerId);
      return { items: await repo.listPayoutDestinations(db, farmerId) };
    },

    async getSubscription(scope, farmerId) {
      await requireVisible(db, scope, farmerId);
      const current = await repo.findCurrentSubscription(db, farmerId);
      // BR-14b: the gate ships off; only `true` turns it on (the listing gate reads it the same way).
      const gate = await repo.getConfig(db, 'free_tier_limits_enabled');
      const enforced = gate === true || gate === 'true';
      let listingLimit: number | null = null;
      if (enforced) {
        const raw = await repo.getConfig(db, 'free_tier_listing_limit');
        const value = typeof raw === 'string' ? Number(raw) : raw;
        // A missing or malformed value is "not configured", never a default invented here.
        listingLimit = typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;
      }
      return { farmerId, current, freeTierLimits: { enforced, listingLimit } };
    },
  };
}

export const adminFarmersService: AdminFarmersService = createAdminFarmersService();
