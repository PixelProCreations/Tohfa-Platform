import type { Executor } from '../../db/pool.js';
import { MICRO_TS_SQL } from '../../http/microTimestamp.js';
import { CURSOR_TAGS, encodeKeysetCursor, requireKeysetCursor } from '../../http/keysetCursor.js';

export type ApplicationStatus =
  | 'SUBMITTED'
  | 'DOCS_REVIEW'
  | 'FARM_VERIFICATION'
  | 'AUDIT'
  | 'APPROVED'
  | 'REJECTED';

export interface FarmerApplicationRow {
  id: string;
  mobile: string;
  full_name: string;
  preferred_locale: 'en' | 'ta';
  status: ApplicationStatus;
  is_draft: boolean;
  current_step: number;
  completed_steps: number[];
  step1_personal: Record<string, unknown>;
  step2_farm_details: Record<string, unknown>;
  step3_location: Record<string, unknown>;
  step4_documents: Record<string, unknown>;
  user_id: string | null;
  farmer_id: string | null;
  zone_id: string | null;
  submitted_at: Date | null;
  created_at: Date;
  updated_at: Date | null;
  tohfa_farmer_id?: string | null;
  decided_at?: Date | null;
  decided_by?: string | null;
  rejection_reason?: string | null;
  info_request?: string | null;
  is_info_requested?: boolean;
}

export interface StatusHistoryRow {
  id: string;
  application_id: string;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  actor_id: string | null;
  note: string | null;
  created_at: Date;
}

export interface FarmerProfileRow {
  id: string;
  user_id: string;
  tohfa_farmer_id: string;
  full_name: string;
  mobile: string;
  preferred_locale: 'en' | 'ta';
  zone_id: string | null;
  zone_name: string | null;
  farming_experience_years: number | null;
  address_line1: string | null;
  village: string | null;
  taluk: string | null;
  district: string;
  aadhaar_last4: string | null;
  kyc_status: string;
  application_status: ApplicationStatus;
  overall_rating: number | null;
  rating_tier_code: string | null;
  is_market_blocked: boolean;
  market_block_reason: string | null;
  /**
   * `farmers.dob` is a DATE. It is selected as `dob::text` (YYYY-MM-DD) rather than
   * left to the pg driver, which would parse it into a local-midnight JS Date -- and
   * `.toISOString()` of that under IST is the previous calendar day.
   */
  dob: string | null;
  /** Mirrors the `farmers.gender` CHECK constraint (0003_farmers_and_farms.sql). */
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'UNDISCLOSED' | null;
  created_at: Date;
}

export interface ListAdminApplicationsOptions {
  status?:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'DOCS_REVIEW'
    | 'FARM_VERIFICATION'
    | 'AUDIT'
    | 'INFO_REQUESTED'
    | 'APPROVED'
    | 'REJECTED'
    | undefined;
  zoneId?: string | undefined;
  hasZone?: boolean | undefined;
  zoneIds?: string[] | undefined;
  submittedAfter?: string | undefined;
  q?: string | undefined;
  pendingOnly?: boolean | undefined;
  limit: number;
  cursor?: string | undefined;
}

export interface FarmerApplicationsRepo {
  createApplication(
    db: Executor,
    params: {
      mobile: string;
      fullName: string;
      preferredLocale: 'en' | 'ta';
      userId?: string | undefined;
    },
  ): Promise<FarmerApplicationRow>;
  findById(db: Executor, id: string): Promise<FarmerApplicationRow | null>;
  findByIdForUpdate(db: Executor, id: string): Promise<FarmerApplicationRow | null>;
  findLiveByMobile(db: Executor, mobile: string): Promise<FarmerApplicationRow | null>;
  findZoneByTaluk(db: Executor, taluk: string, district?: string | null): Promise<{ id: string; code: string; name: string } | null>;
  isZoneActive(db: Executor, zoneId: string): Promise<boolean>;
  updateStepData(
    db: Executor,
    id: string,
    step: number,
    stepData: Record<string, unknown>,
    completedSteps: number[],
  ): Promise<FarmerApplicationRow | null>;
  transitionStatus(
    db: Executor,
    id: string,
    fromStatus: ApplicationStatus | null,
    toStatus: ApplicationStatus,
    actorId?: string | undefined,
    note?: string | undefined,
    zoneId?: string | null | undefined,
  ): Promise<FarmerApplicationRow>;
  listAdminApplications(
    db: Executor,
    options: ListAdminApplicationsOptions,
  ): Promise<{ items: FarmerApplicationRow[]; nextCursor: string | null; hasMore: boolean }>;
  getStatusHistory(db: Executor, applicationId: string): Promise<StatusHistoryRow[]>;
  findFarmerByUserId(db: Executor, userId: string): Promise<FarmerProfileRow | null>;
  findFarmerById(db: Executor, farmerId: string): Promise<FarmerProfileRow | null>;
  updateFarmerProfile(
    db: Executor,
    farmerId: string,
    updates: {
      fullName?: string | undefined;
      farmingExperienceYears?: number | undefined;
      addressLine1?: string | undefined;
      preferredLocale?: 'en' | 'ta' | undefined;
    },
  ): Promise<FarmerProfileRow | null>;
  allocateNextTohfaFarmerId(db: Executor, year: number): Promise<string>;
  /**
   * BR-135: live role codes of the account approval will make a farmer: `userId` when the
   * application has one, otherwise the live (not soft-deleted) user holding `mobile`. Empty when
   * there is no such account yet.
   */
  findApplicantLiveRoles(db: Executor, lookup: { userId: string | null; mobile: string }): Promise<string[]>;
}

const APPLICATION_SELECT = `
  fa.id, fa.mobile, fa.full_name, fa.preferred_locale, fa.status, fa.is_draft,
  fa.current_step, fa.completed_steps, fa.step1_personal, fa.step2_farm_details,
  fa.step3_location, fa.step4_documents, fa.user_id, fa.farmer_id, fa.zone_id, fa.submitted_at,
  fa.created_at, fa.updated_at,
  f.tohfa_farmer_id,
  dec.created_at AS decided_at,
  dec.actor_id AS decided_by,
  CASE WHEN fa.status = 'REJECTED' THEN dec.note ELSE NULL END AS rejection_reason,
  info.note AS info_request,
  CASE WHEN fa.status NOT IN ('APPROVED', 'REJECTED') AND NOT fa.is_draft AND last_hist.note LIKE 'More info requested:%' THEN true ELSE false END AS is_info_requested
`;

const APPLICATION_JOINS = `
  LEFT JOIN farmers f ON f.id = fa.farmer_id
  LEFT JOIN LATERAL (
    SELECT created_at, actor_id, note
      FROM farmer_application_status_history
     WHERE application_id = fa.id AND to_status IN ('APPROVED', 'REJECTED')
     ORDER BY created_at DESC LIMIT 1
  ) dec ON true
  LEFT JOIN LATERAL (
    SELECT note
      FROM farmer_application_status_history
     WHERE application_id = fa.id AND note LIKE 'More info requested:%'
     ORDER BY created_at DESC LIMIT 1
  ) info ON true
  LEFT JOIN LATERAL (
    SELECT note
      FROM farmer_application_status_history
     WHERE application_id = fa.id
     ORDER BY created_at DESC LIMIT 1
  ) last_hist ON true
`;

export const farmerApplicationsRepo: FarmerApplicationsRepo = {
  async createApplication(db, params) {
    const result = await db.query<FarmerApplicationRow>(
      `INSERT INTO farmer_applications (mobile, full_name, preferred_locale, user_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, mobile, full_name, preferred_locale, status, is_draft,
                 current_step, completed_steps, step1_personal, step2_farm_details,
                 step3_location, step4_documents, user_id, farmer_id, zone_id, submitted_at,
                 created_at, updated_at`,
      [params.mobile, params.fullName, params.preferredLocale, params.userId ?? null],
    );
    return result.rows[0]!;
  },

  async findById(db, id) {
    const result = await db.query<FarmerApplicationRow>(
      `SELECT ${APPLICATION_SELECT}
         FROM farmer_applications fa
         ${APPLICATION_JOINS}
        WHERE fa.id = $1 AND fa.deleted_at IS NULL
        LIMIT 1`,
      [id],
    );
    return result.rows[0] ?? null;
  },

  async findByIdForUpdate(db, id) {
    const result = await db.query<FarmerApplicationRow>(
      `SELECT ${APPLICATION_SELECT}
         FROM farmer_applications fa
         ${APPLICATION_JOINS}
        WHERE fa.id = $1 AND fa.deleted_at IS NULL
        FOR UPDATE OF fa`,
      [id],
    );
    return result.rows[0] ?? null;
  },

  async findLiveByMobile(db, mobile) {
    const result = await db.query<FarmerApplicationRow>(
      `SELECT ${APPLICATION_SELECT}
         FROM farmer_applications fa
         ${APPLICATION_JOINS}
        WHERE fa.mobile = $1 AND fa.status NOT IN ('APPROVED', 'REJECTED') AND fa.deleted_at IS NULL
        LIMIT 1`,
      [mobile],
    );
    return result.rows[0] ?? null;
  },

  async findZoneByTaluk(db, taluk, district) {
    const trimmedTaluk = taluk.trim();
    const query = district
      ? `SELECT gz.zone_id AS id, gz.zone_code AS code, gz.zone_name AS name
           FROM geographic_zones gz
          WHERE lower(gz.taluk) = lower($1)
            AND lower(gz.district) = lower($2)
            AND gz.is_active = true
          LIMIT 1`
      : `SELECT gz.zone_id AS id, gz.zone_code AS code, gz.zone_name AS name
           FROM geographic_zones gz
          WHERE lower(gz.taluk) = lower($1)
            AND gz.is_active = true
          LIMIT 1`;
    const params = district ? [trimmedTaluk, district.trim()] : [trimmedTaluk];
    const res = await db.query<{ id: string; code: string; name: string }>(query, params);
    return res.rows[0] ?? null;
  },

  async isZoneActive(db, zoneId) {
    const res = await db.query<{ count: string }>(
      `SELECT count(*) FROM zones WHERE id = $1 AND is_active = true`,
      [zoneId],
    );
    return parseInt(res.rows[0]?.count ?? '0', 10) > 0;
  },

  async updateStepData(db, id, step, stepData, completedSteps) {
    const columnMap: Record<number, string> = {
      1: 'step1_personal',
      2: 'step2_farm_details',
      3: 'step3_location',
      4: 'step4_documents',
    };

    const targetColumn = columnMap[step];
    if (targetColumn !== undefined) {
      const result = await db.query<FarmerApplicationRow>(
        `UPDATE farmer_applications
            SET ${targetColumn} = $2::jsonb,
                completed_steps = $3::smallint[],
                current_step = CASE WHEN current_step < $4 THEN $4 ELSE current_step END,
                updated_at = now()
          WHERE id = $1 AND deleted_at IS NULL
          RETURNING id, mobile, full_name, preferred_locale, status, is_draft,
                    current_step, completed_steps, step1_personal, step2_farm_details,
                    step3_location, step4_documents, user_id, farmer_id, zone_id, submitted_at,
                    created_at, updated_at`,
        [id, JSON.stringify(stepData), completedSteps, Math.min(step + 1, 5)],
      );
      return result.rows[0] ?? null;
    }

    const result = await db.query<FarmerApplicationRow>(
      `UPDATE farmer_applications
          SET completed_steps = $2::smallint[],
              updated_at = now()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING id, mobile, full_name, preferred_locale, status, is_draft,
                  current_step, completed_steps, step1_personal, step2_farm_details,
                  step3_location, step4_documents, user_id, farmer_id, zone_id, submitted_at,
                  created_at, updated_at`,
      [id, completedSteps],
    );
    return result.rows[0] ?? null;
  },

  async transitionStatus(db, id, fromStatus, toStatus, actorId, note, zoneId) {
    const isSubmitted = toStatus === 'SUBMITTED' || toStatus === 'DOCS_REVIEW';
    const result = await db.query<FarmerApplicationRow>(
      `UPDATE farmer_applications
          SET status = $2,
              is_draft = CASE WHEN $3 = true THEN false ELSE is_draft END,
              submitted_at = CASE WHEN $3 = true AND submitted_at IS NULL THEN now() ELSE submitted_at END,
              zone_id = CASE WHEN $3 = true THEN $4 ELSE COALESCE($4, zone_id) END,
              updated_at = now()
        WHERE id = $1 AND ($5::text IS NULL OR status = $5::application_status)
        RETURNING id, mobile, full_name, preferred_locale, status, is_draft,
                  current_step, completed_steps, step1_personal, step2_farm_details,
                  step3_location, step4_documents, user_id, farmer_id, zone_id, submitted_at,
                  created_at, updated_at`,
      [id, toStatus, isSubmitted, zoneId ?? null, fromStatus ?? null],
    );

    if (result.rowCount === 0) {
      throw new Error(`CONCURRENT_MODIFICATION: Application ${id} was modified concurrently.`);
    }

    // Record in history log
    await db.query(
      `INSERT INTO farmer_application_status_history (application_id, from_status, to_status, actor_id, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, fromStatus ?? null, toStatus, actorId ?? null, note ?? null],
    );

    return result.rows[0]!;
  },

  async listAdminApplications(db, options) {
    const conditions: string[] = ['fa.deleted_at IS NULL'];
    const values: unknown[] = [];
    let paramIndex = 1;

    // Draft and status filtering
    if (options.status === 'DRAFT') {
      conditions.push('fa.is_draft = true');
    } else if (options.status === 'INFO_REQUESTED') {
      conditions.push(
        `fa.is_draft = false AND fa.status NOT IN ('APPROVED', 'REJECTED') AND (SELECT fash.note FROM farmer_application_status_history fash WHERE fash.application_id = fa.id ORDER BY fash.created_at DESC LIMIT 1) LIKE 'More info requested:%'`,
      );
    } else if (options.status !== undefined) {
      conditions.push(`fa.status = $${paramIndex++}`);
      values.push(options.status);
      conditions.push('fa.is_draft = false');
    } else {
      // By default exclude drafts
      conditions.push('fa.is_draft = false');
    }

    if (options.pendingOnly === true) {
      conditions.push(`fa.status NOT IN ('APPROVED', 'REJECTED') AND fa.is_draft = false`);
    }

    if (options.q !== undefined && options.q.trim().length > 0) {
      const term = `%${options.q.trim()}%`;
      conditions.push(`(fa.full_name ILIKE $${paramIndex} OR fa.mobile ILIKE $${paramIndex})`);
      values.push(term);
      paramIndex++;
    }

    if (options.zoneIds !== undefined) {
      if (options.zoneIds.length === 0) {
        conditions.push('FALSE');
      } else {
        conditions.push(`fa.zone_id = ANY($${paramIndex++}::uuid[])`);
        values.push(options.zoneIds);
      }
    } else if (options.zoneId !== undefined) {
      conditions.push(`fa.zone_id = $${paramIndex++}::uuid`);
      values.push(options.zoneId);
    }
    if (options.hasZone === true) {
      conditions.push('fa.zone_id IS NOT NULL');
    } else if (options.hasZone === false) {
      conditions.push('fa.zone_id IS NULL');
    }
    if (options.submittedAfter !== undefined) {
      conditions.push(`fa.submitted_at >= $${paramIndex++}`);
      values.push(options.submittedAfter);
    }
    if (options.cursor !== undefined && options.cursor.length > 0) {
      const after = requireKeysetCursor(CURSOR_TAGS.farmerApplications, options.cursor);
      conditions.push(`(fa.created_at, fa.id) < ($${paramIndex++}::timestamptz, $${paramIndex++}::uuid)`);
      values.push(after.ts, after.id);
    }

    values.push(options.limit + 1);
    const limitParam = paramIndex;

    const result = await db.query<FarmerApplicationRow & { cursor_ts: string }>(
      `SELECT ${APPLICATION_SELECT},
              ${MICRO_TS_SQL('fa.created_at')} AS cursor_ts
         FROM farmer_applications fa
         ${APPLICATION_JOINS}
        WHERE ${conditions.join(' AND ')}
        ORDER BY fa.created_at DESC, fa.id DESC
        LIMIT $${limitParam}`,
      values,
    );

    const hasMore = result.rows.length > options.limit;
    const items = hasMore ? result.rows.slice(0, options.limit) : result.rows;
    const last = items[items.length - 1];
    const nextCursor =
      hasMore && last !== undefined
        ? encodeKeysetCursor(CURSOR_TAGS.farmerApplications, { ts: last.cursor_ts, id: last.id })
        : null;

    return { items, nextCursor, hasMore };
  },

  async getStatusHistory(db, applicationId) {
    const result = await db.query<StatusHistoryRow>(
      `SELECT id, application_id, from_status, to_status, actor_id, note, created_at
         FROM farmer_application_status_history
        WHERE application_id = $1
        ORDER BY created_at ASC`,
      [applicationId],
    );
    return result.rows;
  },

  async findFarmerByUserId(db, userId) {
    const result = await db.query<FarmerProfileRow>(
      `SELECT f.id, f.user_id, f.tohfa_farmer_id, u.full_name, u.mobile,
              u.preferred_locale, f.zone_id, z.name AS zone_name,
              f.farming_experience_years, f.address_line1, f.village,
              f.taluk, f.district, f.aadhaar_last4, f.kyc_status,
              f.application_status, f.overall_rating, f.rating_tier_code, f.is_market_blocked,
              f.market_block_reason, f.dob::text AS dob, f.gender, f.created_at
         FROM farmers f
         JOIN users u ON u.id = f.user_id
    LEFT JOIN zones z ON z.id = f.zone_id
        WHERE f.user_id = $1 AND f.deleted_at IS NULL
        LIMIT 1`,
      [userId],
    );
    return result.rows[0] ?? null;
  },

  async findFarmerById(db, farmerId) {
    const result = await db.query<FarmerProfileRow>(
      `SELECT f.id, f.user_id, f.tohfa_farmer_id, u.full_name, u.mobile,
              u.preferred_locale, f.zone_id, z.name AS zone_name,
              f.farming_experience_years, f.address_line1, f.village,
              f.taluk, f.district, f.aadhaar_last4, f.kyc_status,
              f.application_status, f.overall_rating, f.rating_tier_code, f.is_market_blocked,
              f.market_block_reason, f.dob::text AS dob, f.gender, f.created_at
         FROM farmers f
         JOIN users u ON u.id = f.user_id
    LEFT JOIN zones z ON z.id = f.zone_id
        WHERE f.id = $1 AND f.deleted_at IS NULL
        LIMIT 1`,
      [farmerId],
    );
    return result.rows[0] ?? null;
  },

  async updateFarmerProfile(db, farmerId, updates) {
    if (updates.fullName !== undefined || updates.preferredLocale !== undefined) {
      await db.query(
        `UPDATE users
            SET full_name = COALESCE($2, full_name),
                preferred_locale = COALESCE($3, preferred_locale),
                updated_at = now()
          WHERE id = (SELECT user_id FROM farmers WHERE id = $1)`,
        [farmerId, updates.fullName ?? null, updates.preferredLocale ?? null],
      );
    }

    const result = await db.query<FarmerProfileRow>(
      `UPDATE farmers
          SET farming_experience_years = COALESCE($2, farming_experience_years),
              address_line1 = COALESCE($3, address_line1),
              updated_at = now()
        WHERE id = $1
        RETURNING id`,
      [farmerId, updates.farmingExperienceYears ?? null, updates.addressLine1 ?? null],
    );

    if (result.rows[0] === undefined) return null;
    return this.findFarmerById(db, farmerId);
  },

  async findApplicantLiveRoles(db, { userId, mobile }) {
    const result = await db.query<{ role_code: string }>(
      `SELECT DISTINCT ur.role_code
         FROM users u
         JOIN user_roles ur ON ur.user_id = u.id
        WHERE u.deleted_at IS NULL
          AND (CASE WHEN $1::uuid IS NULL THEN u.mobile = $2 ELSE u.id = $1::uuid END)
          AND ur.valid_from <= now() AND (ur.valid_to IS NULL OR ur.valid_to > now())
        ORDER BY ur.role_code`,
      [userId, mobile],
    );
    return result.rows.map((row) => row.role_code);
  },

  async allocateNextTohfaFarmerId(db, year) {
    // Transactional allocation using lock to guarantee no collisions
    const prefix = `TOHFA-F-${year}-%`;
    const result = await db.query<{ next_val: string }>(
      `SELECT COALESCE(MAX(NULLIF(regexp_replace(tohfa_farmer_id, '^TOHFA-F-\\d{4}-', ''), '')::integer), 0) + 1 AS next_val
         FROM farmers
        WHERE tohfa_farmer_id LIKE $1`,
      [prefix],
    );

    const nextNumber = Number(result.rows[0]?.next_val ?? '1');
    const padded = String(nextNumber).padStart(4, '0');
    return `TOHFA-F-${year}-${padded}`;
  },
};
