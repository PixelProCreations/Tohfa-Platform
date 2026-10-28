/**
 * Admin farmer directory and profile (BR-108): SQL only.
 *
 * Every read that can reach a farmer of another zone/warehouse takes the caller's scope as a
 * `ScopedWhere` fragment built by the service (numbered from $1) and ANDs it into the WHERE clause,
 * so an out-of-scope farmer is simply not returned. This file decides nothing about who may see
 * what. The sub-resource reads (land, certificates, documents, payout destinations, subscription)
 * take a farmer id the service has already proven visible.
 *
 * The rating tier is resolved IN SQL from `rating_tier_config` (BR-04a) so the directory can filter
 * and page on it. `TIER_JOIN` is the same lookup as `farmRatingsRepo.resolveTierForScore`: the config
 * generation with the latest `effective_from` that is not in the future, then the band
 * `min_score <= score < max_score` (open-ended when `max_score` is null), first by `sort_order`.
 */
import type { Executor } from '../../db/pool.js';
import { CURSOR_TAGS, encodeKeysetCursor, requireKeysetCursor } from '../../http/keysetCursor.js';
import { MICRO_TS_SQL } from '../../http/microTimestamp.js';
import type { ScopedWhere } from '../../rbac/requirePermission.js';
import { LISTING_QUALIFYING_CERT_TYPES } from '../certifications/certifications.schema.js';
import type {
  AdminFarmerCertificationSummary,
  AdminFarmerFilters,
  AdminFarmerLandLocation,
  AdminFarmerListItem,
  AdminFarmerPayoutDestination,
  AdminFarmerSubscription,
} from './admin-farmers.schema.js';

const TIER_JOIN = `
  LEFT JOIN LATERAL (
    SELECT t.tier_code, t.label
      FROM rating_tier_config t
     WHERE f.overall_rating IS NOT NULL
       AND t.effective_from = (SELECT MAX(effective_from) FROM rating_tier_config WHERE effective_from <= CURRENT_DATE)
       AND f.overall_rating >= t.min_score
       AND (t.max_score IS NULL OR f.overall_rating < t.max_score)
     ORDER BY t.sort_order
     LIMIT 1
  ) rt ON true`;

/** Joins every farmer read needs: the login user, the zone (scope + display) and the tier. */
const FARMER_FROM = `
  FROM farmers f
  JOIN users u ON u.id = f.user_id AND u.deleted_at IS NULL
  LEFT JOIN zones z ON z.id = f.zone_id
  ${TIER_JOIN}`;

interface FarmerBaseRow {
  id: string;
  user_id: string;
  tohfa_farmer_id: string;
  full_name: string;
  mobile: string;
  account_status: string;
  application_status: string;
  kyc_status: string;
  zone_id: string | null;
  zone_code: string | null;
  zone_name: string | null;
  overall_rating: string | null;
  tier_code: string | null;
  tier_label: string | null;
  is_market_blocked: boolean;
  created_at: Date;
}

const BASE_COLUMNS = `
  f.id, f.user_id, f.tohfa_farmer_id, u.full_name, u.mobile, u.status AS account_status,
  f.application_status::text AS application_status, f.kyc_status::text AS kyc_status,
  z.id AS zone_id, z.code AS zone_code, z.name AS zone_name,
  f.overall_rating::text AS overall_rating, rt.tier_code, rt.label AS tier_label,
  f.is_market_blocked, f.created_at`;

/** Profile fields as stored. `aadhaarLast4` is the only Aadhaar value this module ever reads. */
export interface FarmerProfileRow {
  id: string;
  userId: string;
  tohfaFarmerId: string;
  fullName: string;
  mobile: string;
  email: string | null;
  accountStatus: string;
  applicationStatus: string;
  kycStatus: string;
  zone: { id: string; code: string; name: string } | null;
  aadhaarLast4: string | null;
  dob: string | null;
  gender: string | null;
  farmingExperienceYears: number | null;
  addressLine1: string | null;
  addressLine2: string | null;
  village: string | null;
  taluk: string | null;
  district: string;
  pincode: string | null;
  isMarketBlocked: boolean;
  marketBlockReason: string | null;
  overallRating: number | null;
  ratingTier: { code: string; label: string } | null;
  approvedAt: Date | null;
  createdAt: Date;
}

export interface FarmerDocumentRow {
  id: string;
  farmerId: string;
  docType: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number | null;
  isMandatory: boolean;
  verificationStatus: string;
  verifiedBy: string | null;
  verifiedAt: Date | null;
  rejectReason: string | null;
  createdAt: Date;
}

/** Columns of `users` the profile edit may write. */
export interface UserPatch {
  fullName?: string;
  email?: string | null;
  mobile?: string;
}

/** Columns of `farmers` the profile edit may write. */
export interface FarmerPatch {
  dob?: string | null;
  gender?: string | null;
  farmingExperienceYears?: number | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  village?: string | null;
  taluk?: string | null;
  district?: string;
  pincode?: string | null;
  aadhaarLast4?: string;
}

export interface ListArgs {
  filters: AdminFarmerFilters;
  /** Scope fragment from the service, numbered from $1. */
  scope: ScopedWhere;
  limit: number;
  cursor?: string | undefined;
}

export interface ListResult {
  items: AdminFarmerListItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface AdminFarmersRepo {
  list(db: Executor, args: ListArgs): Promise<ListResult>;
  /** The farmer's profile if it exists, is live and is inside `scope`; null otherwise. */
  findProfile(db: Executor, farmerId: string, scope: ScopedWhere): Promise<FarmerProfileRow | null>;
  /** True when the farmer exists, is live and is inside `scope`. */
  isVisible(db: Executor, farmerId: string, scope: ScopedWhere): Promise<boolean>;
  /** Row-locks the farmer and its user for an edit (FOR UPDATE), inside `scope`. */
  lockFarmer(db: Executor, farmerId: string, scope: ScopedWhere): Promise<boolean>;
  findLandLocations(db: Executor, farmerId: string): Promise<AdminFarmerLandLocation[]>;
  findCertificationSummary(db: Executor, farmerId: string): Promise<AdminFarmerCertificationSummary>;
  updateUser(db: Executor, userId: string, patch: UserPatch): Promise<void>;
  updateFarmer(db: Executor, farmerId: string, patch: FarmerPatch): Promise<void>;
  listDocuments(db: Executor, farmerId: string): Promise<FarmerDocumentRow[]>;
  /** The farmer's live document, row-locked for the verification decision; null if not the farmer's. */
  findDocumentForUpdate(db: Executor, farmerId: string, documentId: string): Promise<FarmerDocumentRow | null>;
  markDocumentVerified(db: Executor, documentId: string, verifiedBy: string): Promise<FarmerDocumentRow>;
  listPayoutDestinations(db: Executor, farmerId: string): Promise<AdminFarmerPayoutDestination[]>;
  findCurrentSubscription(db: Executor, farmerId: string): Promise<AdminFarmerSubscription['current']>;
  /** `system_config.value` (parsed JSON) for `key`, or undefined when no row exists. */
  getConfig(db: Executor, key: string): Promise<unknown>;
}

/** Shift a `scopedWhere` fragment so its placeholders start at `startIndex`. */
function renumber(scope: ScopedWhere, startIndex: number): ScopedWhere {
  if (scope.params.length === 0) return { ...scope, nextIndex: startIndex };
  let next = startIndex;
  const sql = scope.sql.replace(/\$(\d+)/g, () => `$${next++}`);
  return { sql, params: scope.params, nextIndex: next };
}

/** `%`, `_` and `\` in user input are literals, not wildcards. */
function likePattern(value: string): string {
  return `%${value.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

const toNumber = (value: string | number | null): number | null => (value === null ? null : Number(value));

function zoneOf(row: FarmerBaseRow): FarmerProfileRow['zone'] {
  return row.zone_id === null ? null : { id: row.zone_id, code: row.zone_code ?? '', name: row.zone_name ?? '' };
}

function tierOf(row: FarmerBaseRow): FarmerProfileRow['ratingTier'] {
  return row.tier_code === null ? null : { code: row.tier_code, label: row.tier_label ?? row.tier_code };
}

function toListItem(row: FarmerBaseRow & { land_location_count: number }): AdminFarmerListItem {
  return {
    id: row.id,
    tohfaFarmerId: row.tohfa_farmer_id,
    fullName: row.full_name,
    mobile: row.mobile,
    accountStatus: row.account_status as AdminFarmerListItem['accountStatus'],
    applicationStatus: row.application_status as AdminFarmerListItem['applicationStatus'],
    kycStatus: row.kyc_status as AdminFarmerListItem['kycStatus'],
    zone: zoneOf(row),
    overallRating: toNumber(row.overall_rating),
    ratingTier: tierOf(row) as AdminFarmerListItem['ratingTier'],
    landLocationCount: row.land_location_count,
    isMarketBlocked: row.is_market_blocked,
    createdAt: row.created_at.toISOString(),
  };
}

const DOCUMENT_COLUMNS = `
  id, farmer_id, doc_type, storage_key, mime_type, size_bytes::text AS size_bytes, is_mandatory,
  verification_status::text AS verification_status, verified_by, verified_at, reject_reason, created_at`;

interface DocumentDbRow {
  id: string;
  farmer_id: string;
  doc_type: string;
  storage_key: string;
  mime_type: string;
  size_bytes: string | null;
  is_mandatory: boolean;
  verification_status: string;
  verified_by: string | null;
  verified_at: Date | null;
  reject_reason: string | null;
  created_at: Date;
}

function toDocument(row: DocumentDbRow): FarmerDocumentRow {
  return {
    id: row.id,
    farmerId: row.farmer_id,
    docType: row.doc_type,
    storageKey: row.storage_key,
    mimeType: row.mime_type,
    sizeBytes: toNumber(row.size_bytes),
    isMandatory: row.is_mandatory,
    verificationStatus: row.verification_status,
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
    rejectReason: row.reject_reason,
    createdAt: row.created_at,
  };
}

/** Patch key -> column. Only these columns can ever be written by the profile edit. */
const USER_COLUMNS: Record<keyof UserPatch, string> = { fullName: 'full_name', email: 'email', mobile: 'mobile' };
const FARMER_COLUMNS: Record<keyof FarmerPatch, string> = {
  dob: 'dob',
  gender: 'gender',
  farmingExperienceYears: 'farming_experience_years',
  addressLine1: 'address_line1',
  addressLine2: 'address_line2',
  village: 'village',
  taluk: 'taluk',
  district: 'district',
  pincode: 'pincode',
  aadhaarLast4: 'aadhaar_last4',
};

async function updateColumns(
  db: Executor,
  table: 'users' | 'farmers',
  id: string,
  patch: Record<string, unknown>,
  columns: Record<string, string>,
): Promise<void> {
  const params: unknown[] = [id];
  const sets: string[] = [];
  for (const [key, value] of Object.entries(patch)) {
    const column = columns[key];
    if (column === undefined || value === undefined) continue;
    params.push(value);
    sets.push(`${column} = $${params.length}`);
  }
  if (sets.length === 0) return;
  await db.query(`UPDATE ${table} SET ${sets.join(', ')}, updated_at = now() WHERE id = $1`, params);
}

export const adminFarmersRepo: AdminFarmersRepo = {
  async list(db, { filters, scope, limit, cursor }) {
    const scoped = renumber(scope, 1);
    const params: unknown[] = [...scoped.params];
    const conditions = ['f.deleted_at IS NULL', scoped.sql];

    if (filters.q !== undefined) {
      params.push(likePattern(filters.q));
      conditions.push(`(u.full_name ILIKE $${params.length} ESCAPE '\\' OR u.mobile ILIKE $${params.length} ESCAPE '\\')`);
    }
    if (filters.status !== undefined) {
      params.push(filters.status);
      conditions.push(`u.status = $${params.length}`);
    }
    if (filters.zoneId !== undefined) {
      params.push(filters.zoneId);
      conditions.push(`f.zone_id = $${params.length}::uuid`);
    }
    if (filters.ratingTier !== undefined) {
      params.push(filters.ratingTier);
      conditions.push(`rt.tier_code = $${params.length}`);
    }
    if (cursor !== undefined && cursor.length > 0) {
      // Keyset on (created_at, id), matching the ORDER BY (http/keysetCursor.ts).
      const after = requireKeysetCursor(CURSOR_TAGS.adminFarmers, cursor);
      params.push(after.ts, after.id);
      conditions.push(`(f.created_at, f.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
    }
    params.push(limit + 1);

    const result = await db.query<FarmerBaseRow & { land_location_count: number; cursor_ts: string }>(
      `SELECT ${BASE_COLUMNS},
              (SELECT count(*)::int FROM farms fm WHERE fm.farmer_id = f.id AND fm.deleted_at IS NULL) AS land_location_count,
              ${MICRO_TS_SQL('f.created_at')} AS cursor_ts
         ${FARMER_FROM}
        WHERE ${conditions.join(' AND ')}
        ORDER BY f.created_at DESC, f.id DESC
        LIMIT $${params.length}`,
      params,
    );

    const hasMore = result.rows.length > limit;
    const rows = hasMore ? result.rows.slice(0, limit) : result.rows;
    const last = rows[rows.length - 1];
    const nextCursor =
      hasMore && last !== undefined ? encodeKeysetCursor(CURSOR_TAGS.adminFarmers, { ts: last.cursor_ts, id: last.id }) : null;
    return { items: rows.map(toListItem), nextCursor, hasMore };
  },

  async findProfile(db, farmerId, scope) {
    const scoped = renumber(scope, 2);
    const result = await db.query<
      FarmerBaseRow & {
        email: string | null;
        aadhaar_last4: string | null;
        dob: string | null;
        gender: string | null;
        farming_experience_years: number | null;
        address_line1: string | null;
        address_line2: string | null;
        village: string | null;
        taluk: string | null;
        district: string;
        pincode: string | null;
        market_block_reason: string | null;
        approved_at: Date | null;
      }
    >(
      `SELECT ${BASE_COLUMNS}, u.email, f.aadhaar_last4, f.dob::text AS dob, f.gender, f.farming_experience_years,
              f.address_line1, f.address_line2, f.village, f.taluk, f.district, f.pincode,
              f.market_block_reason, f.approved_at
         ${FARMER_FROM}
        WHERE f.id = $1 AND f.deleted_at IS NULL AND ${scoped.sql}`,
      [farmerId, ...scoped.params],
    );
    const row = result.rows[0];
    if (row === undefined) return null;
    return {
      id: row.id,
      userId: row.user_id,
      tohfaFarmerId: row.tohfa_farmer_id,
      fullName: row.full_name,
      mobile: row.mobile,
      email: row.email,
      accountStatus: row.account_status,
      applicationStatus: row.application_status,
      kycStatus: row.kyc_status,
      zone: zoneOf(row),
      aadhaarLast4: row.aadhaar_last4,
      dob: row.dob,
      gender: row.gender,
      farmingExperienceYears: row.farming_experience_years,
      addressLine1: row.address_line1,
      addressLine2: row.address_line2,
      village: row.village,
      taluk: row.taluk,
      district: row.district,
      pincode: row.pincode,
      isMarketBlocked: row.is_market_blocked,
      marketBlockReason: row.market_block_reason,
      overallRating: toNumber(row.overall_rating),
      ratingTier: tierOf(row),
      approvedAt: row.approved_at,
      createdAt: row.created_at,
    };
  },

  async isVisible(db, farmerId, scope) {
    const scoped = renumber(scope, 2);
    const result = await db.query(
      `SELECT 1
         FROM farmers f
         JOIN users u ON u.id = f.user_id AND u.deleted_at IS NULL
         LEFT JOIN zones z ON z.id = f.zone_id
        WHERE f.id = $1 AND f.deleted_at IS NULL AND ${scoped.sql}`,
      [farmerId, ...scoped.params],
    );
    return result.rows.length > 0;
  },

  async lockFarmer(db, farmerId, scope) {
    const scoped = renumber(scope, 2);
    // The zone join is only for the scope predicate; it is outer, so it is not locked.
    const result = await db.query(
      `SELECT 1
         FROM farmers f
         JOIN users u ON u.id = f.user_id AND u.deleted_at IS NULL
         LEFT JOIN zones z ON z.id = f.zone_id
        WHERE f.id = $1 AND f.deleted_at IS NULL AND ${scoped.sql}
          FOR UPDATE OF f, u`,
      [farmerId, ...scoped.params],
    );
    return result.rows.length > 0;
  },

  async findLandLocations(db, farmerId) {
    const result = await db.query<{
      id: string;
      name: string;
      survey_number: string | null;
      area_acres: string | null;
      address: string | null;
      village: string | null;
      taluk: string | null;
      district: string;
      centroid_lat: string | null;
      centroid_lng: string | null;
      has_boundary: boolean;
      is_primary: boolean;
      plots: Array<{
        id: string;
        name: string;
        areaAcres: number | null;
        soilType: string | null;
        irrigationType: string | null;
        sunExposure: string | null;
      }>;
    }>(
      `SELECT fm.id, fm.name, fm.survey_number, fm.area_acres::text AS area_acres, fm.address, fm.village,
              fm.taluk, fm.district, fm.centroid_lat::text AS centroid_lat, fm.centroid_lng::text AS centroid_lng,
              fm.boundary IS NOT NULL AS has_boundary, fm.is_primary,
              COALESCE((
                SELECT json_agg(json_build_object(
                         'id', p.id, 'name', p.name, 'areaAcres', p.area_acres, 'soilType', p.soil_type,
                         'irrigationType', p.irrigation_type, 'sunExposure', p.sun_exposure)
                       ORDER BY p.created_at, p.id)
                  FROM plots p
                 WHERE p.farm_id = fm.id AND p.deleted_at IS NULL
              ), '[]'::json) AS plots
         FROM farms fm
        WHERE fm.farmer_id = $1 AND fm.deleted_at IS NULL
        ORDER BY fm.is_primary DESC, fm.created_at, fm.id`,
      [farmerId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      surveyNumber: row.survey_number,
      areaAcres: toNumber(row.area_acres),
      address: row.address,
      village: row.village,
      taluk: row.taluk,
      district: row.district,
      centroid:
        row.centroid_lat === null || row.centroid_lng === null
          ? null
          : { lat: Number(row.centroid_lat), lng: Number(row.centroid_lng) },
      hasBoundary: row.has_boundary,
      isPrimary: row.is_primary,
      plots: row.plots.map((plot) => ({ ...plot, areaAcres: toNumber(plot.areaAcres) })),
    }));
  },

  async findCertificationSummary(db, farmerId) {
    // "Today" is the Asia/Kolkata date, as everywhere certificates are judged (certifications.repo.ts).
    const result = await db.query<{
      total: number;
      verified_current: number;
      verified_expired: number;
      unverified: number;
      rejected: number;
      expired: number;
      qualifying: number;
      next_qualifying_expiry: string | null;
    }>(
      `WITH today AS (SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date AS d)
       SELECT count(*)::int AS total,
              -- VERIFIED is split on expiry so a lapsed verified certificate is never reported as
              -- live (BR-108c). A certificate expiring today is still current, as in BR-02.
              -- expires_on is NOT NULL today; a NULL would be treated as non-expiring.
              count(*) FILTER (WHERE c.verification_status = 'VERIFIED'
                                 AND (c.expires_on IS NULL OR c.expires_on >= today.d))::int AS verified_current,
              count(*) FILTER (WHERE c.verification_status = 'VERIFIED' AND c.expires_on < today.d)::int AS verified_expired,
              count(*) FILTER (WHERE c.verification_status = 'UNVERIFIED')::int AS unverified,
              count(*) FILTER (WHERE c.verification_status = 'REJECTED')::int AS rejected,
              -- Any status: deliberately overlaps the buckets above.
              count(*) FILTER (WHERE c.expires_on < today.d)::int AS expired,
              count(*) FILTER (WHERE c.verification_status = 'VERIFIED' AND c.expires_on >= today.d
                                 AND c.cert_type::text = ANY($2::text[]))::int AS qualifying,
              (min(c.expires_on) FILTER (WHERE c.verification_status = 'VERIFIED' AND c.expires_on >= today.d
                                           AND c.cert_type::text = ANY($2::text[])))::text AS next_qualifying_expiry
         FROM certifications c, today
        WHERE c.farmer_id = $1 AND c.deleted_at IS NULL`,
      [farmerId, LISTING_QUALIFYING_CERT_TYPES],
    );
    const row = result.rows[0]!;
    return {
      total: row.total,
      verified: row.verified_current + row.verified_expired,
      verifiedCurrent: row.verified_current,
      verifiedExpired: row.verified_expired,
      unverified: row.unverified,
      rejected: row.rejected,
      expired: row.expired,
      qualifying: row.qualifying,
      nextQualifyingExpiry: row.next_qualifying_expiry,
    };
  },

  async updateUser(db, userId, patch) {
    await updateColumns(db, 'users', userId, patch as Record<string, unknown>, USER_COLUMNS);
  },

  async updateFarmer(db, farmerId, patch) {
    await updateColumns(db, 'farmers', farmerId, patch as Record<string, unknown>, FARMER_COLUMNS);
  },

  async listDocuments(db, farmerId) {
    const result = await db.query<DocumentDbRow>(
      `SELECT ${DOCUMENT_COLUMNS}
         FROM farmer_documents
        WHERE farmer_id = $1 AND deleted_at IS NULL
        ORDER BY created_at, id`,
      [farmerId],
    );
    return result.rows.map(toDocument);
  },

  async findDocumentForUpdate(db, farmerId, documentId) {
    const result = await db.query<DocumentDbRow>(
      `SELECT ${DOCUMENT_COLUMNS}
         FROM farmer_documents
        WHERE id = $1 AND farmer_id = $2 AND deleted_at IS NULL
          FOR UPDATE`,
      [documentId, farmerId],
    );
    const row = result.rows[0];
    return row === undefined ? null : toDocument(row);
  },

  async markDocumentVerified(db, documentId, verifiedBy) {
    const result = await db.query<DocumentDbRow>(
      `UPDATE farmer_documents
          SET verification_status = 'VERIFIED', verified_by = $2, verified_at = now(), reject_reason = NULL,
              updated_at = now()
        WHERE id = $1
        RETURNING ${DOCUMENT_COLUMNS}`,
      [documentId, verifiedBy],
    );
    return toDocument(result.rows[0]!);
  },

  async listPayoutDestinations(db, farmerId) {
    // account_number_token is deliberately not selected: it never leaves the database (BR-53a).
    const result = await db.query<{
      id: string;
      account_holder_name: string;
      account_number_last4: string | null;
      ifsc: string | null;
      bank_name: string | null;
      branch_name: string | null;
      upi_vpa: string | null;
      is_verified: boolean;
      is_default: boolean;
      created_at: Date;
    }>(
      `SELECT id, account_holder_name, account_number_last4, ifsc, bank_name, branch_name, upi_vpa,
              is_verified, is_default, created_at
         FROM farmer_bank_accounts
        WHERE farmer_id = $1 AND deleted_at IS NULL
        ORDER BY is_default DESC, created_at DESC, id DESC`,
      [farmerId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      kind: row.upi_vpa !== null ? ('UPI' as const) : ('BANK' as const),
      accountHolderName: row.account_holder_name,
      accountNumberLast4: row.account_number_last4,
      ifsc: row.ifsc,
      bankName: row.bank_name,
      branchName: row.branch_name,
      upiVpa: row.upi_vpa,
      isVerified: row.is_verified,
      isDefault: row.is_default,
      createdAt: row.created_at.toISOString(),
    }));
  },

  async findCurrentSubscription(db, farmerId) {
    const result = await db.query<{ tier: string; status: string; period_start: string; period_end: string }>(
      `SELECT tier, status, period_start::text AS period_start, period_end::text AS period_end
         FROM farmer_subscriptions
        WHERE farmer_id = $1
        ORDER BY (status = 'ACTIVE') DESC, period_end DESC, created_at DESC
        LIMIT 1`,
      [farmerId],
    );
    const row = result.rows[0];
    if (row === undefined) return null;
    return {
      tier: row.tier as 'FREE' | 'PAID',
      status: row.status as 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'WAIVED',
      periodStart: row.period_start,
      periodEnd: row.period_end,
    };
  },

  async getConfig(db, key) {
    const result = await db.query<{ value: unknown }>(`SELECT value FROM system_config WHERE key = $1`, [key]);
    return result.rows[0]?.value;
  },
};
