import { writeAuditLog, type AuditActorType } from '../../audit/auditLog.js';
import type { Executor } from '../../db/pool.js';
import {
  LISTING_QUALIFYING_CERT_TYPES,
  type CertificationType,
  type VerificationStatus,
} from './certifications.schema.js';

export interface CertificationRow {
  id: string;
  farmer_id: string;
  farm_id: string | null;
  cert_type: CertificationType;
  /** BR-48i: the scheme an OTHER certificate belongs to; NULL for PGS/NPOP. */
  custom_type_name: string | null;
  cert_number: string;
  issuing_body: string;
  issued_on: string;
  expires_on: string;
  document_id: string | null;
  document_url: string | null;
  verification_status: VerificationStatus;
  verified_by: string | null;
  verified_at: Date | null;
  verification_notes: string | null;
  portal_checked_url: string | null;
  created_at: Date;
  updated_at: Date | null;
}

export interface CreateCertificationParams {
  farmerId: string;
  certType: CertificationType;
  customTypeName: string | null;
  certNumber: string;
  issuingBody: string;
  issuedOn: string;
  expiresOn: string;
  documentUrl?: string | undefined;
  documentId?: string | undefined;
}

/**
 * The full set of farmer-editable values after a PATCH has been merged onto the
 * stored row and validated (BR-49c). `documentUrl` is only present when the
 * PATCH replaces the document; otherwise the current document is kept.
 */
export interface UpdateCertificationParams {
  certType: CertificationType;
  customTypeName: string | null;
  certNumber: string;
  issuingBody: string;
  issuedOn: string;
  expiresOn: string;
  documentUrl?: string | undefined;
}

/**
 * Every certification read returns the same columns, with the document's
 * storage key as document_url. `c` must alias certifications (or a CTE over
 * its RETURNING *) and `fd` the LEFT JOINed farmer_documents row. One list, so
 * a new column such as custom_type_name cannot be missed by one query.
 */
const CERT_COLUMNS = `
  c.id, c.farmer_id, c.farm_id, c.cert_type, c.custom_type_name, c.cert_number,
  c.issuing_body, c.issued_on::text AS issued_on, c.expires_on::text AS expires_on,
  c.document_id, fd.storage_key AS document_url, c.verification_status,
  c.verified_by, c.verified_at, c.verification_notes, c.portal_checked_url,
  c.created_at, c.updated_at`;

/**
 * Records a certificate document as a farmer_documents row, exactly as
 * createCertification always has, and returns its id. Used by create and by
 * a PATCH that replaces the document (BR-49): the old document row is kept,
 * only the certificate's document_id moves.
 */
async function insertCertificateDocument(
  db: Executor,
  farmerId: string,
  documentUrl: string,
): Promise<string | null> {
  const docResult = await db.query<{ id: string }>(
    `INSERT INTO farmer_documents (farmer_id, doc_type, storage_key, mime_type, verification_status)
     VALUES ($1, 'CERTIFICATE', $2, 'application/pdf', 'UNVERIFIED')
     RETURNING id`,
    [farmerId, documentUrl],
  );
  return docResult.rows[0]?.id ?? null;
}

/**
 * Reads a system_config number that is a count of calendar days. A fractional
 * or negative value has no meaning as one, so it falls back like a missing row.
 */
async function readDaysConfig(db: Executor, key: string, fallback: number): Promise<number> {
  const res = await db.query<{ value: unknown }>(
    `SELECT value FROM system_config WHERE key = $1 LIMIT 1`,
    [key],
  );
  const val = res.rows[0]?.value;
  const parsed =
    typeof val === 'number' ? val : typeof val === 'string' && val.trim() !== '' ? Number(val) : NaN;
  if (Number.isInteger(parsed) && parsed >= 0) return parsed;
  return fallback;
}

export interface RecomputeResult {
  farmerId: string;
  isMarketBlocked: boolean;
  marketBlockReason: string | null;
  changed: boolean;
}

/**
 * BR-02j: what `farmers.market_block_reason` says when a farmer is blocked.
 * Each text names the cause the listing gate (listings.service Gate 1 over
 * listings.repo getListingCertEligibility) would refuse with, so an admin
 * reading the flag and a farmer refused at POST /listings are told the same
 * thing:
 *
 *   PENDING         CERT_UNVERIFIED  an unexpired PGS/NPOP certificate awaits verification
 *   EXPIRED         CERT_EXPIRED     otherwise, a PGS/NPOP certificate has expired
 *   NO_CERTIFICATE  CERT_MISSING     no certificate at all
 *   OTHER_ONLY      CERT_MISSING     only OTHER certificates (BR-02h)
 *   REJECTED        CERT_MISSING     only unexpired, rejected PGS/NPOP certificates
 *
 * Free text, not a code: clients do not branch on it (the farmer app derives
 * its banner from the certificate list), and the first three sentences are
 * unchanged from before BR-02j, so stored values and anything matching them
 * keep working.
 */
export const MARKET_BLOCK_REASON = {
  PENDING: 'Organic certifications are pending manual admin verification (BR-02)',
  EXPIRED: 'Organic certification has expired; a renewed PGS or NPOP certificate is needed (BR-01)',
  NO_CERTIFICATE: 'No organic certifications uploaded (BR-01, BR-02)',
  OTHER_ONLY:
    'Only OTHER certifications on record; listing needs a verified, unexpired PGS or NPOP certificate (BR-02)',
  REJECTED: 'Organic certifications were rejected in admin verification; a verified PGS or NPOP certificate is needed (BR-02)',
} as const;

export interface CertificationsRepo {
  createCertification(db: Executor, params: CreateCertificationParams): Promise<CertificationRow>;
  /**
   * Any farmer's not-deleted certificate, row-locked for the rest of the
   * transaction (admin verify/unverify, BR-51 admin edit/delete): the before
   * image an audit row records is then the row the write replaces. Null for
   * an unknown or deleted id.
   */
  findByIdForUpdate(db: Executor, id: string): Promise<CertificationRow | null>;
  /**
   * BR-36/BR-49d: the caller's own, not-deleted certificate, row-locked for the
   * rest of the transaction. Null for an unknown id, another farmer's
   * certificate or a deleted one — the caller cannot tell which (404).
   */
  findOwnForUpdate(db: Executor, id: string, farmerId: string): Promise<CertificationRow | null>;
  /**
   * BR-49a: writes the merged values AND sends the certificate back for
   * verification (UNVERIFIED, verifier columns cleared). There is deliberately
   * no variant that edits without resetting: the service only calls this when
   * something changed (BR-49b), and every change resets.
   */
  updateCertificationResetVerification(
    db: Executor,
    id: string,
    farmerId: string,
    params: UpdateCertificationParams,
  ): Promise<CertificationRow | null>;
  /**
   * BR-50 / BR-51: sets deleted_at on the live certificate `id` held by
   * `farmerId` — the caller's own (BR-50), or for an admin the owner read from
   * the row (BR-51). Null if there is none.
   */
  softDeleteOwn(db: Executor, id: string, farmerId: string): Promise<CertificationRow | null>;
  listByFarmerId(
    db: Executor,
    farmerId: string,
    limit: number,
    cursor?: string | undefined,
  ): Promise<{ items: CertificationRow[]; nextCursor: string | null; hasMore: boolean }>;
  verifyCertification(
    db: Executor,
    id: string,
    adminUserId: string,
    notes?: string | undefined,
    portalUrl?: string | undefined,
  ): Promise<CertificationRow | null>;
  unverifyCertification(
    db: Executor,
    id: string,
    adminUserId: string,
    reason: string,
  ): Promise<CertificationRow | null>;
  recomputeFarmerMarketBlock(
    db: Executor,
    farmerId: string,
    actorId?: string | null | undefined,
    actorRole?: string | undefined,
    actorType?: AuditActorType | undefined,
  ): Promise<RecomputeResult>;
  getAllActiveFarmerIds(db: Executor): Promise<string[]>;
  getCertExpiryWarningDays(db: Executor): Promise<number>;
  getCertExpiryMaxPastDays(db: Executor): Promise<number>;
  getCertExpiryMaxFutureDays(db: Executor): Promise<number>;
  // Admin-facing reads
  listAllCertifications(
    db: Executor,
    params: {
      limit: number;
      cursor?: string | undefined;
      status?: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED' | undefined;
      farmerId?: string | undefined;
    },
  ): Promise<{ items: CertificationRow[]; nextCursor: string | null; hasMore: boolean }>;
  findByIdAdmin(db: Executor, id: string): Promise<CertificationRow | null>;
}

export const certificationsRepo: CertificationsRepo = {
  async createCertification(db, params) {
    let documentId = params.documentId ?? null;

    // If documentUrl is given but no documentId, create farmer_documents row
    if (documentId === null && params.documentUrl !== undefined) {
      documentId = await insertCertificateDocument(db, params.farmerId, params.documentUrl);
    }

    const result = await db.query<CertificationRow>(
      `WITH inserted AS (
         INSERT INTO certifications (
           farmer_id, cert_type, custom_type_name, cert_number, issuing_body,
           issued_on, expires_on, document_id, verification_status
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'UNVERIFIED')
         RETURNING *
       )
       SELECT ${CERT_COLUMNS}
         FROM inserted c
    LEFT JOIN farmer_documents fd ON fd.id = c.document_id`,
      [
        params.farmerId,
        params.certType,
        params.customTypeName,
        params.certNumber,
        params.issuingBody,
        params.issuedOn,
        params.expiresOn,
        documentId,
      ],
    );

    return result.rows[0]!;
  },

  async findByIdForUpdate(db, id) {
    const result = await db.query<CertificationRow>(
      `SELECT ${CERT_COLUMNS}
         FROM certifications c
    LEFT JOIN farmer_documents fd ON fd.id = c.document_id
        WHERE c.id = $1 AND c.deleted_at IS NULL
        LIMIT 1
          FOR UPDATE OF c`,
      [id],
    );
    return result.rows[0] ?? null;
  },

  async findOwnForUpdate(db, id, farmerId) {
    const result = await db.query<CertificationRow>(
      `SELECT ${CERT_COLUMNS}
         FROM certifications c
    LEFT JOIN farmer_documents fd ON fd.id = c.document_id
        WHERE c.id = $1 AND c.farmer_id = $2 AND c.deleted_at IS NULL
        LIMIT 1
          FOR UPDATE OF c`,
      [id, farmerId],
    );
    return result.rows[0] ?? null;
  },

  async updateCertificationResetVerification(db, id, farmerId, params) {
    const documentId =
      params.documentUrl !== undefined
        ? await insertCertificateDocument(db, farmerId, params.documentUrl)
        : null;

    // farmer_id and deleted_at are re-checked here, not only in
    // findOwnForUpdate, so this statement can never touch a row the caller
    // does not own even if it is called on its own.
    const result = await db.query<CertificationRow>(
      `WITH updated AS (
         UPDATE certifications
            SET cert_type           = $3,
                custom_type_name    = $4,
                cert_number         = $5,
                issuing_body        = $6,
                issued_on           = $7,
                expires_on          = $8,
                document_id         = COALESCE($9::uuid, document_id),
                verification_status = 'UNVERIFIED',
                verified_by         = NULL,
                verified_at         = NULL,
                verification_notes  = NULL,
                portal_checked_url  = NULL,
                updated_at          = now()
          WHERE id = $1 AND farmer_id = $2 AND deleted_at IS NULL
          RETURNING *
       )
       SELECT ${CERT_COLUMNS}
         FROM updated c
    LEFT JOIN farmer_documents fd ON fd.id = c.document_id`,
      [
        id,
        farmerId,
        params.certType,
        params.customTypeName,
        params.certNumber,
        params.issuingBody,
        params.issuedOn,
        params.expiresOn,
        documentId,
      ],
    );
    return result.rows[0] ?? null;
  },

  async softDeleteOwn(db, id, farmerId) {
    // The row and its farmer_documents row are kept (history, audit); only
    // deleted_at is set. Every read, the listing gate, recompute and the
    // expiry sweep already filter deleted_at IS NULL, and so does
    // uq_certifications_number, so the same number can be recorded again.
    const result = await db.query<CertificationRow>(
      `WITH deleted AS (
         UPDATE certifications
            SET deleted_at = now(),
                updated_at = now()
          WHERE id = $1 AND farmer_id = $2 AND deleted_at IS NULL
          RETURNING *
       )
       SELECT ${CERT_COLUMNS}
         FROM deleted c
    LEFT JOIN farmer_documents fd ON fd.id = c.document_id`,
      [id, farmerId],
    );
    return result.rows[0] ?? null;
  },

  async listByFarmerId(db, farmerId, limit, cursor) {
    const values: unknown[] = [farmerId, limit + 1];
    let whereCursor = '';

    if (cursor !== undefined && cursor.length > 0) {
      values.push(cursor);
      whereCursor = `AND c.id < $3`;
    }

    const result = await db.query<CertificationRow>(
      `SELECT ${CERT_COLUMNS}
         FROM certifications c
    LEFT JOIN farmer_documents fd ON fd.id = c.document_id
        WHERE c.farmer_id = $1 AND c.deleted_at IS NULL
              ${whereCursor}
        ORDER BY c.created_at DESC, c.id DESC
        LIMIT $2`,
      values,
    );

    const hasMore = result.rows.length > limit;
    const items = hasMore ? result.rows.slice(0, limit) : result.rows;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!.id : null;

    return { items, nextCursor, hasMore };
  },

  async verifyCertification(db, id, adminUserId, notes, portalUrl) {
    // deleted_at IS NULL: a soft-deleted certificate cannot be verified (BR-50).
    const result = await db.query<CertificationRow>(
      `WITH updated AS (
         UPDATE certifications
            SET verification_status = 'VERIFIED',
                verified_by = $2,
                verified_at = now(),
                verification_notes = $3,
                portal_checked_url = $4,
                updated_at = now()
          WHERE id = $1 AND deleted_at IS NULL
          RETURNING *
       )
       SELECT ${CERT_COLUMNS}
         FROM updated c
    LEFT JOIN farmer_documents fd ON fd.id = c.document_id`,
      [id, adminUserId, notes ?? null, portalUrl ?? null],
    );

    return result.rows[0] ?? null;
  },

  async unverifyCertification(db, id, adminUserId, reason) {
    const result = await db.query<CertificationRow>(
      `WITH updated AS (
         UPDATE certifications
            SET verification_status = 'REJECTED',
                verified_by = $2,
                verified_at = now(),
                verification_notes = $3,
                updated_at = now()
          WHERE id = $1 AND deleted_at IS NULL
          RETURNING *
       )
       SELECT ${CERT_COLUMNS}
         FROM updated c
    LEFT JOIN farmer_documents fd ON fd.id = c.document_id`,
      [id, adminUserId, reason],
    );

    return result.rows[0] ?? null;
  },

  /**
   * BR-01, BR-02: Single shared market block recomputation function.
   * Compares certificate expiry against today in Asia/Kolkata timezone.
   */
  async recomputeFarmerMarketBlock(db, farmerId, actorId, actorRole, actorType = 'USER') {
    // 1. Fetch farmer's current state
    const farmerRes = await db.query<{
      is_market_blocked: boolean;
      market_block_reason: string | null;
    }>(
      `SELECT is_market_blocked, market_block_reason
         FROM farmers
        WHERE id = $1
        LIMIT 1`,
      [farmerId],
    );

    const farmer = farmerRes.rows[0];
    if (farmer === undefined) {
      throw new Error(`Farmer ${farmerId} not found for market block recomputation.`);
    }

    // 2. Classify the farmer's live certificates the way the listing gate does
    //    (listings.repo getListingCertEligibility): "expired" is expires_on
    //    before today's Asia/Kolkata date, and only the qualifying types count
    //    toward valid, pending and expired. BR-02: an OTHER certificate is
    //    recorded and may be verified, but never lifts the block nor names
    //    the way back.
    type Counts = {
      valid_count: string;
      pending_count: string;
      expired_count: string;
      total_count: string;
      qualifying_type_count: string;
    };
    const countRes = await db.query<Counts>(
      `SELECT
         COUNT(*) FILTER (WHERE qualifying_type AND verification_status = 'VERIFIED' AND NOT expired) AS valid_count,
         COUNT(*) FILTER (WHERE qualifying_type AND verification_status = 'UNVERIFIED' AND NOT expired) AS pending_count,
         COUNT(*) FILTER (WHERE qualifying_type AND expired) AS expired_count,
         COUNT(*) AS total_count,
         COUNT(*) FILTER (WHERE qualifying_type) AS qualifying_type_count
       FROM (
         SELECT verification_status,
                cert_type = ANY($2::certification_type[]) AS qualifying_type,
                expires_on < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date AS expired
           FROM certifications
          WHERE farmer_id = $1 AND deleted_at IS NULL
       ) c`,
      [farmerId, LISTING_QUALIFYING_CERT_TYPES],
    );

    const count = (key: keyof Counts) => Number(countRes.rows[0]?.[key] ?? '0');

    // BR-02j: the same order as the gate — verification is the way back while
    // an unexpired certificate awaits it, then renewal, then adding one.
    let newIsBlocked = true;
    let newReason: string | null;
    if (count('valid_count') > 0) {
      newIsBlocked = false;
      newReason = null;
    } else if (count('pending_count') > 0) {
      newReason = MARKET_BLOCK_REASON.PENDING;
    } else if (count('expired_count') > 0) {
      newReason = MARKET_BLOCK_REASON.EXPIRED;
    } else if (count('total_count') === 0) {
      newReason = MARKET_BLOCK_REASON.NO_CERTIFICATE;
    } else if (count('qualifying_type_count') === 0) {
      newReason = MARKET_BLOCK_REASON.OTHER_ONLY;
    } else {
      // Every PGS/NPOP certificate left is unexpired and neither VERIFIED (it
      // would qualify) nor UNVERIFIED (it would be pending): all REJECTED.
      newReason = MARKET_BLOCK_REASON.REJECTED;
    }

    const stateChanged = farmer.is_market_blocked !== newIsBlocked;

    // 3. Update farmer if changed or update evaluation timestamp
    await db.query(
      `UPDATE farmers
          SET is_market_blocked = $2,
              market_block_reason = $3,
              market_block_evaluated_at = now(),
              updated_at = now()
        WHERE id = $1`,
      [farmerId, newIsBlocked, newReason],
    );

    // 4. Record in append-only audit trail if state changed
    if (stateChanged) {
      await writeAuditLog(db, {
        actorId: actorId ?? null,
        actorType,
        ...(actorRole !== undefined ? { actorRole } : {}),
        actionCode: newIsBlocked ? 'certification.block_listings' : 'certification.unblock_listings',
        entityType: 'farmer',
        entityId: farmerId,
        before: {
          isMarketBlocked: farmer.is_market_blocked,
          marketBlockReason: farmer.market_block_reason,
        },
        after: {
          isMarketBlocked: newIsBlocked,
          marketBlockReason: newReason,
        },
        changedFields: ['is_market_blocked', 'market_block_reason'],
      });
    }

    return {
      farmerId,
      isMarketBlocked: newIsBlocked,
      marketBlockReason: newReason,
      changed: stateChanged,
    };
  },

  async getAllActiveFarmerIds(db) {
    const result = await db.query<{ id: string }>(
      `SELECT id FROM farmers WHERE deleted_at IS NULL ORDER BY created_at ASC`,
    );
    return result.rows.map((r) => r.id);
  },

  /**
   * Specification gap (see db/seed/001_reference.sql): no source document
   * defines this threshold. 30 is a placeholder pending client confirmation,
   * matching the mobile client's pre-existing hardcoded fallback so behaviour
   * does not silently change for existing users.
   */
  async getCertExpiryWarningDays(db) {
    const res = await db.query<{ value: unknown }>(
      `SELECT value FROM system_config WHERE key = 'cert_expiry_warning_days' LIMIT 1`,
    );
    if (res.rows.length > 0 && res.rows[0]?.value != null) {
      const val = res.rows[0].value;
      if (typeof val === 'number' && Number.isFinite(val)) {
        return val;
      }
      if (typeof val === 'string') {
        const parsed = Number(val);
        if (Number.isFinite(parsed)) return parsed;
      }
    }
    return 30;
  },

  /**
   * BR-48: how many days before today (Asia/Kolkata) a certificate's expiresOn
   * may lie when a farmer records it. Seeded as 365 in db/seed/001_reference.sql
   * (user decision 2026-10-05, "one year maximum"). Same read-and-fall-back shape
   * as getCertExpiryWarningDays; the fallback matches the seeded value so a
   * missing row does not silently change behaviour. A fractional or negative
   * value has no meaning as a count of calendar days, so it also falls back.
   */
  async getCertExpiryMaxPastDays(db) {
    return readDaysConfig(db, 'cert_expiry_max_past_days', 365);
  },

  /**
   * BR-48h: how many days after today (Asia/Kolkata) a certificate's expiresOn
   * may lie. Seeded as 730 (2 years) in db/seed/001_reference.sql (user
   * decision 2026-10-06, raised from 548). Same read-and-fall-back shape as
   * getCertExpiryMaxPastDays; the fallback matches the seeded value.
   */
  async getCertExpiryMaxFutureDays(db) {
    return readDaysConfig(db, 'cert_expiry_max_future_days', 730);
  },

  /**
   * Admin: list all certifications across all farmers.
   * Supports optional filtering by verification_status and farmer_id.
   * Uses cursor-based pagination ordered by created_at DESC, id DESC.
   */
  async listAllCertifications(db, { limit, cursor, status, farmerId }) {
    const conditions: string[] = ['c.deleted_at IS NULL'];
    const values: unknown[] = [];

    if (status !== undefined) {
      values.push(status);
      conditions.push(`c.verification_status = $${values.length}`);
    }

    if (farmerId !== undefined) {
      values.push(farmerId);
      conditions.push(`c.farmer_id = $${values.length}`);
    }

    if (cursor !== undefined && cursor.length > 0) {
      values.push(cursor);
      conditions.push(`c.id < $${values.length}`);
    }

    values.push(limit + 1);
    const limitPlaceholder = `$${values.length}`;

    const where = conditions.join(' AND ');

    const result = await db.query<CertificationRow>(
      `SELECT ${CERT_COLUMNS}
         FROM certifications c
    LEFT JOIN farmer_documents fd ON fd.id = c.document_id
        WHERE ${where}
        ORDER BY c.created_at DESC, c.id DESC
        LIMIT ${limitPlaceholder}`,
      values,
    );

    const hasMore = result.rows.length > limit;
    const items = hasMore ? result.rows.slice(0, limit) : result.rows;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!.id : null;

    return { items, nextCursor, hasMore };
  },

  /**
   * Admin: fetch a single certification by id regardless of farmer scope.
   * Used by the admin detail view; writes lock the row with findByIdForUpdate.
   */
  async findByIdAdmin(db, id) {
    const result = await db.query<CertificationRow>(
      `SELECT ${CERT_COLUMNS}
         FROM certifications c
    LEFT JOIN farmer_documents fd ON fd.id = c.document_id
        WHERE c.id = $1 AND c.deleted_at IS NULL
        LIMIT 1`,
      [id],
    );
    return result.rows[0] ?? null;
  },
};

