import { changedFields, writeAuditLog } from '../../audit/auditLog.js';
import type { Actor } from '../../auth/requireAuth.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import {
  certificationsRepo,
  type CertificationRow,
  type CertificationsRepo,
} from './certifications.repo.js';
import {
  LISTING_QUALIFYING_CERT_TYPES,
  certificationCreateSchema,
  isCalendarDate,
  type CertificationCreate,
  type CertificationUpdate,
  type AdminListCertificationsQuery,
  type ListCertificationsQuery,
  type UnverifyCertificationBody,
  type VerifyCertificationBody,
} from './certifications.schema.js';

/** Today's calendar date in Asia/Kolkata, as YYYY-MM-DD. */
export function getTodayKolkata(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Shift a YYYY-MM-DD calendar date by whole days (negative = earlier). */
function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Calculates days to expiry relative to the current date in Asia/Kolkata timezone.
 * Returns negative if expired.
 */
export function getDaysToExpiry(expiresOnStr: string): number {
  const today = new Date(`${getTodayKolkata()}T00:00:00Z`);
  const expiry = new Date(`${expiresOnStr}T00:00:00Z`);

  const diffMs = expiry.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/** BR-48 expiry windows, both counts of calendar days from system_config. */
export interface CertExpiryWindows {
  /** cert_expiry_max_past_days: how long ago expiresOn may lie. */
  maxPastDays: number;
  /** cert_expiry_max_future_days: how far ahead expiresOn may lie. */
  maxFutureDays: number;
}

/**
 * BR-48: the date checks that depend on "today", which is why they are here and
 * not in the Zod schema (that one already guarantees both are real calendar
 * dates with issuedOn < expiresOn). Returns field errors keyed like the
 * validate() middleware's (`body.<field>`), so the farmer app can show them
 * against the right input; empty when the dates are acceptable. A date that
 * is not a real calendar date is skipped here — the schema reports it.
 *
 * - issuedOn must not be after today.
 * - expiresOn may already have passed (a lapsed certificate may be recorded),
 *   but not by more than `maxPastDays` days (BR-48a).
 * - expiresOn may not lie more than `maxFutureDays` days ahead (BR-48h).
 */
export function certificationDateErrors(
  dates: { issuedOn: string; expiresOn: string },
  today: string,
  windows: CertExpiryWindows,
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  if (isCalendarDate(dates.issuedOn) && dates.issuedOn > today) {
    errors['body.issuedOn'] = [`Must not be in the future (today is ${today}).`];
  }

  if (isCalendarDate(dates.expiresOn)) {
    const earliestExpiresOn = addDays(today, -windows.maxPastDays);
    const latestExpiresOn = addDays(today, windows.maxFutureDays);
    if (dates.expiresOn < earliestExpiresOn) {
      errors['body.expiresOn'] = [
        `Must be on or after ${earliestExpiresOn}: a certificate that expired more than ${windows.maxPastDays} days ago cannot be recorded.`,
      ];
    } else if (dates.expiresOn > latestExpiresOn) {
      errors['body.expiresOn'] = [
        `Must be on or before ${latestExpiresOn}: a certificate cannot expire more than ${windows.maxFutureDays} days from today.`,
      ];
    }
  }

  return errors;
}

/**
 * BR-48 in full, for POST and for PATCH's merged result (BR-49c): the static
 * schema checks plus the today-dependent ones, every failing field reported at
 * once, keyed `body.<field>`. `data` is the parsed (trimmed) input, or null
 * when anything failed.
 */
export function validateCertificationInput(
  input: unknown,
  today: string,
  windows: CertExpiryWindows,
): { data: CertificationCreate | null; errors: Record<string, string[]> } {
  const errors: Record<string, string[]> = {};
  const add = (key: string, messages: string[]) => {
    errors[key] = [...(errors[key] ?? []), ...messages];
  };

  const parsed = certificationCreateSchema.safeParse(input);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      add(['body', ...issue.path].join('.'), [issue.message]);
    }
  }

  const raw = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>;
  if (typeof raw['issuedOn'] === 'string' && typeof raw['expiresOn'] === 'string') {
    const dateErrors = certificationDateErrors(
      { issuedOn: raw['issuedOn'], expiresOn: raw['expiresOn'] },
      today,
      windows,
    );
    // One message per field: a field the schema already rejected (e.g.
    // expiresOn not after issuedOn) is not reported a second time.
    for (const [key, messages] of Object.entries(dateErrors)) {
      if (errors[key] === undefined) add(key, messages);
    }
  }

  const ok = parsed.success && Object.keys(errors).length === 0;
  return { data: ok ? parsed.data : null, errors };
}

function failValidation(errors: Record<string, string[]>): never {
  throw new AppError('VALIDATION_FAILED', {
    detail: 'One or more fields are invalid.',
    errors,
  });
}

/**
 * BR-48j: uq_certifications_number allows one live certificate per certType +
 * certNumber across ALL farmers (migration 0003; deleted rows are excluded, so
 * a number freed by BR-50's soft delete can be used again).
 */
const CERT_NUMBER_UNIQUE_INDEX = 'uq_certifications_number';

/**
 * The same words whoever holds the number. Telling a farmer "another farmer
 * already has this number" would let anyone probe which certificate numbers
 * are on record, so the farmer's own duplicate and someone else's read alike,
 * and nothing from the database (the number, the holder) is passed along.
 */
const CERT_NUMBER_UNAVAILABLE_MESSAGE =
  "This certificate number can't be used. Check the number and try again.";

/**
 * True for the unique violation (23505) that uq_certifications_number raises,
 * and for nothing else: another index's violation or another error code is
 * a different fault and must not be reported as a certNumber problem.
 */
function isCertNumberTaken(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const pgError = error as { code?: unknown; constraint?: unknown };
  return pgError.code === '23505' && pgError.constraint === CERT_NUMBER_UNIQUE_INDEX;
}

/**
 * Runs the INSERT or UPDATE that can collide on uq_certifications_number and
 * turns that collision into BR-48j's field error. The index is the arbiter,
 * not a read beforehand: two farmers sending the same number at once both pass
 * any SELECT, and only the database sees the second INSERT collide with the
 * first one's uncommitted row. The violation has already aborted the
 * transaction, so the error is rethrown for the runner to roll back — and the
 * pg error is deliberately not attached as `cause`, because its detail names
 * the number.
 */
async function writeCertNumber<T>(write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (error) {
    if (isCertNumberTaken(error)) {
      failValidation({ 'body.certNumber': [CERT_NUMBER_UNAVAILABLE_MESSAGE] });
    }
    throw error;
  }
}

/** What the audit trail records about a certificate (BR-35). */
function auditSnapshot(row: CertificationRow): Record<string, unknown> {
  return {
    certType: row.cert_type,
    customTypeName: row.custom_type_name,
    certNumber: row.cert_number,
    issuingBody: row.issuing_body,
    issuedOn: row.issued_on,
    expiresOn: row.expires_on,
    documentUrl: row.document_url,
    verificationStatus: row.verification_status,
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at?.toISOString() ?? null,
    verificationNotes: row.verification_notes,
    portalCheckedUrl: row.portal_checked_url,
  };
}

function mapCertificationResponse(row: CertificationRow) {
  const daysToExpiry = getDaysToExpiry(row.expires_on);
  // Per certificate only: "this certificate does not qualify on its own" —
  // unverified, expired, or of a type that never qualifies (OTHER, BR-02).
  const blocksListings =
    row.verification_status !== 'VERIFIED' ||
    daysToExpiry < 0 ||
    !LISTING_QUALIFYING_CERT_TYPES.includes(row.cert_type);

  return {
    id: row.id,
    farmerId: row.farmer_id,
    certType: row.cert_type,
    customTypeName: row.custom_type_name,
    certNumber: row.cert_number,
    issuingBody: row.issuing_body,
    issuedOn: row.issued_on,
    expiresOn: row.expires_on,
    documentUrl: row.document_url,
    verificationStatus: row.verification_status,
    verifiedAt: row.verified_at?.toISOString() ?? null,
    verifiedBy: row.verified_by,
    verificationNotes: row.verification_notes,
    portalCheckedUrl: row.portal_checked_url,
    daysToExpiry,
    blocksListings,
    createdAt: row.created_at.toISOString(),
  };
}

export interface CertificationsService {
  listMyCertifications(actor: Actor, query: ListCertificationsQuery): Promise<unknown>;
  createCertification(actor: Actor, data: CertificationCreate): Promise<unknown>;
  /** BR-49: PATCH /farmers/me/certifications/{id}. */
  updateMyCertification(actor: Actor, id: string, patch: CertificationUpdate): Promise<unknown>;
  /** BR-50: DELETE /farmers/me/certifications/{id} (soft delete). */
  deleteMyCertification(actor: Actor, id: string): Promise<void>;
  /** BR-51: PATCH /admin/certifications/{id} — BR-49's edit on any farmer's certificate. */
  adminUpdateCertification(actor: Actor, id: string, patch: CertificationUpdate): Promise<unknown>;
  /** BR-51: DELETE /admin/certifications/{id} — BR-50's soft delete on any farmer's certificate. */
  adminDeleteCertification(actor: Actor, id: string): Promise<void>;
  verifyCertification(
    actor: Actor,
    id: string,
    body: VerifyCertificationBody,
  ): Promise<unknown>;
  unverifyCertification(
    actor: Actor,
    id: string,
    body: UnverifyCertificationBody,
  ): Promise<unknown>;
  getConfig(actor: Actor): Promise<{
    certExpiryWarningDays: number;
    certExpiryMaxPastDays: number;
    certExpiryMaxFutureDays: number;
  }>;
  // Admin-facing
  adminListCertifications(actor: Actor, query: AdminListCertificationsQuery): Promise<unknown>;
  adminGetCertification(actor: Actor, id: string): Promise<unknown>;
}

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export function createCertificationsService(
  repo: CertificationsRepo = certificationsRepo,
  runTx: TransactionRunner = withTransaction,
): CertificationsService {
  async function resolveFarmerId(actor: Actor): Promise<string> {
    if (actor.farmerId !== null) return actor.farmerId;

    const result = await pool.query<{ id: string }>(
      `SELECT id FROM farmers WHERE user_id = $1 AND deleted_at IS NULL LIMIT 1`,
      [actor.userId],
    );
    const farmerId = result.rows[0]?.id;
    if (farmerId === undefined) {
      throw new AppError('NOT_FOUND', { detail: 'Farmer profile not found for actor.' });
    }
    return farmerId;
  }

  /** Both BR-48 windows, read from system_config on every request. */
  async function readWindows(db: Executor): Promise<CertExpiryWindows> {
    const maxPastDays = await repo.getCertExpiryMaxPastDays(db);
    const maxFutureDays = await repo.getCertExpiryMaxFutureDays(db);
    return { maxPastDays, maxFutureDays };
  }

  /** The acting role for the audit row, omitted rather than undefined. */
  function actorRole(actor: Actor): { actorRole?: string } {
    const role = actor.roles[0]?.code;
    return role !== undefined ? { actorRole: role } : {};
  }

  /**
   * BR-35: one audit row for a certificate write, on the write's own executor
   * so it commits or rolls back with it. Images are auditSnapshot's — the same
   * shape for every certification.* action code.
   */
  async function auditCertification(
    tx: Executor,
    actor: Actor,
    actionCode: string,
    entityId: string,
    images: { before?: CertificationRow; after?: CertificationRow },
  ): Promise<void> {
    const before = images.before !== undefined ? auditSnapshot(images.before) : undefined;
    const after = images.after !== undefined ? auditSnapshot(images.after) : undefined;
    await writeAuditLog(tx, {
      actorId: actor.userId,
      ...actorRole(actor),
      actionCode,
      entityType: 'certification',
      entityId,
      ...(before !== undefined ? { before } : {}),
      ...(after !== undefined ? { after } : {}),
      ...(before !== undefined && after !== undefined ? { changedFields: changedFields(before, after) } : {}),
    });
  }

  /**
   * BR-49 (the farmer's own certificate) and BR-51 (an admin, any farmer's):
   * one edit, so the two cannot drift apart. `existing` is the row-locked,
   * live certificate the caller is allowed to edit; everything about whose it
   * is — the update's farmer filter, the market block recomputed — comes from
   * that row, never from the request. Returns the stored row unchanged for a
   * no-op (BR-49b), which writes nothing.
   */
  async function editCertification(
    tx: Executor,
    actor: Actor,
    existing: CertificationRow,
    patch: CertificationUpdate,
    actionCode: 'certification.update' | 'certification.admin_update',
  ): Promise<CertificationRow> {
    // BR-49c: the stored row with this patch applied must pass exactly what
    // POST must pass. customTypeName distinguishes "not sent" (keep) from
    // null (clear). The stored document is a storage key, not necessarily a
    // URL, so documentUrl is only validated when this PATCH replaces it.
    const merged = {
      certType: patch.certType ?? existing.cert_type,
      customTypeName:
        patch.customTypeName !== undefined ? patch.customTypeName : existing.custom_type_name,
      certNumber: patch.certNumber ?? existing.cert_number,
      issuingBody: patch.issuingBody ?? existing.issuing_body,
      issuedOn: patch.issuedOn ?? existing.issued_on,
      expiresOn: patch.expiresOn ?? existing.expires_on,
      ...(patch.documentUrl !== undefined ? { documentUrl: patch.documentUrl } : {}),
    };
    const windows = await readWindows(tx);
    const { data: valid, errors } = validateCertificationInput(merged, getTodayKolkata(), windows);
    if (valid === null) failValidation(errors);

    const next = {
      certType: valid.certType,
      customTypeName: valid.customTypeName ?? null,
      certNumber: valid.certNumber,
      issuingBody: valid.issuingBody,
      issuedOn: valid.issuedOn,
      expiresOn: valid.expiresOn,
    };
    const documentChanged =
      valid.documentUrl !== undefined && valid.documentUrl !== existing.document_url;
    const changed =
      documentChanged ||
      next.certType !== existing.cert_type ||
      next.customTypeName !== existing.custom_type_name ||
      next.certNumber !== existing.cert_number ||
      next.issuingBody !== existing.issuing_body ||
      next.issuedOn !== existing.issued_on ||
      next.expiresOn !== existing.expires_on;

    // BR-49b: re-sending the stored values changes nothing, so it must not
    // cost the farmer an admin's verification either.
    if (!changed) return existing;

    // BR-49a: what an admin verified is no longer what is on record, so any
    // real change sends the certificate back for verification — whoever made
    // it (BR-51). BR-48j: a certType or certNumber moved onto another live
    // certificate's is a field error; keeping its own number cannot collide
    // (the UPDATE rewrites the same row) and a no-op never reaches this write.
    const updated = await writeCertNumber(() =>
      repo.updateCertificationResetVerification(tx, existing.id, existing.farmer_id, {
        ...next,
        ...(documentChanged ? { documentUrl: valid.documentUrl } : {}),
      }),
    );
    if (updated === null) {
      throw new AppError('NOT_FOUND', { detail: 'Certification not found.' });
    }

    await repo.recomputeFarmerMarketBlock(tx, existing.farmer_id, actor.userId, actor.roles[0]?.code);

    // BR-35: the before image keeps the verification the edit discarded.
    await auditCertification(tx, actor, actionCode, existing.id, { before: existing, after: updated });

    return updated;
  }

  /**
   * BR-50 (own) and BR-51 (admin): soft-delete the live certificate `id` held
   * by `ownerFarmerId`, recompute that farmer's block, audit. NOT_FOUND when
   * there is no such certificate.
   */
  async function softDeleteCertification(
    tx: Executor,
    actor: Actor,
    id: string,
    ownerFarmerId: string,
    actionCode: 'certification.delete' | 'certification.admin_delete',
  ): Promise<void> {
    const deleted = await repo.softDeleteOwn(tx, id, ownerFarmerId);
    if (deleted === null) {
      throw new AppError('NOT_FOUND', { detail: 'Certification not found.' });
    }

    // The deleted certificate no longer counts, which may block the farmer.
    await repo.recomputeFarmerMarketBlock(tx, deleted.farmer_id, actor.userId, actor.roles[0]?.code);

    await auditCertification(tx, actor, actionCode, id, { before: deleted });
  }

  /** Admin writes (verify, unverify, BR-51): any farmer's live certificate, row-locked, or 404. */
  async function lockAnyCertification(tx: Executor, id: string): Promise<CertificationRow> {
    const existing = await repo.findByIdForUpdate(tx, id);
    if (existing === null) {
      throw new AppError('NOT_FOUND', { detail: 'Certification not found.' });
    }
    return existing;
  }

  return {
    async listMyCertifications(actor, query) {
      const farmerId = await resolveFarmerId(actor);
      const { items, nextCursor, hasMore } = await repo.listByFarmerId(
        pool,
        farmerId,
        query.limit,
        query.cursor,
      );

      return {
        items: items.map(mapCertificationResponse),
        page: { nextCursor, hasMore },
      };
    },

    async createCertification(actor, data) {
      // BR-48: validate against today before anything is written. The windows
      // come from system_config (cert_expiry_max_past_days,
      // cert_expiry_max_future_days), never a literal. The route has already
      // run the schema; running it again here keeps a direct service call
      // (job, script, test) to the same rules, customTypeName included.
      const windows = await readWindows(pool);
      const { data: valid, errors } = validateCertificationInput(data, getTodayKolkata(), windows);
      if (valid === null) failValidation(errors);

      const farmerId = await resolveFarmerId(actor);

      const cert = await runTx(async (tx) => {
        // BR-48j: a certType + certNumber already on record is a field error.
        const created = await writeCertNumber(() =>
          repo.createCertification(tx, {
            farmerId,
            certType: valid.certType,
            customTypeName: valid.customTypeName ?? null,
            certNumber: valid.certNumber,
            issuingBody: valid.issuingBody,
            issuedOn: valid.issuedOn,
            expiresOn: valid.expiresOn,
            documentUrl: valid.documentUrl,
          }),
        );

        // Recompute market block on write (inside same transaction)
        await repo.recomputeFarmerMarketBlock(
          tx,
          farmerId,
          actor.userId,
          actor.roles[0]?.code,
        );

        // BR-35c: the certificate as recorded; there is no before image.
        await auditCertification(tx, actor, 'certification.create', created.id, { after: created });

        return created;
      });

      return mapCertificationResponse(cert);
    },

    async updateMyCertification(actor, id, patch) {
      const farmerId = await resolveFarmerId(actor);

      const cert = await runTx(async (tx) => {
        // BR-36/BR-49d: another farmer's, a deleted or an unknown id all look
        // the same — NOT_FOUND, never FORBIDDEN, so existence does not leak.
        // The row lock keeps a concurrent edit or verify from interleaving
        // between this read and the write below.
        const existing = await repo.findOwnForUpdate(tx, id, farmerId);
        if (existing === null) {
          throw new AppError('NOT_FOUND', { detail: 'Certification not found.' });
        }
        return editCertification(tx, actor, existing, patch, 'certification.update');
      });

      return mapCertificationResponse(cert);
    },

    async deleteMyCertification(actor, id) {
      const farmerId = await resolveFarmerId(actor);

      // BR-50: soft delete of the caller's own live certificate only;
      // anything else is NOT_FOUND (BR-36).
      await runTx((tx) => softDeleteCertification(tx, actor, id, farmerId, 'certification.delete'));
    },

    async adminUpdateCertification(actor, id, patch) {
      // BR-51: any farmer's live certificate; the owner is the row's, so a
      // farmerId the request might carry (the schema strips it anyway) is
      // never consulted. Unknown or deleted → NOT_FOUND.
      const cert = await runTx(async (tx) => {
        const existing = await lockAnyCertification(tx, id);
        return editCertification(tx, actor, existing, patch, 'certification.admin_update');
      });

      return mapCertificationResponse(cert);
    },

    async adminDeleteCertification(actor, id) {
      await runTx(async (tx) => {
        const existing = await lockAnyCertification(tx, id);
        await softDeleteCertification(tx, actor, id, existing.farmer_id, 'certification.admin_delete');
      });
    },

    async verifyCertification(actor, id, body) {
      const cert = await runTx(async (tx) => {
        const existing = await lockAnyCertification(tx, id);

        const verified = await repo.verifyCertification(
          tx,
          id,
          actor.userId,
          body.note,
          body.portalReference,
        );

        if (verified === null) {
          throw new AppError('NOT_FOUND', { detail: 'Certification not found.' });
        }

        // Recompute market block on write (inside same transaction)
        await repo.recomputeFarmerMarketBlock(
          tx,
          existing.farmer_id,
          actor.userId,
          actor.roles[0]?.code,
        );

        // BR-35c: the after image carries the note and portal reference.
        await auditCertification(tx, actor, 'certification.verify', id, { before: existing, after: verified });

        return verified;
      });

      return mapCertificationResponse(cert);
    },

    async unverifyCertification(actor, id, body) {
      const cert = await runTx(async (tx) => {
        const existing = await lockAnyCertification(tx, id);

        const unverified = await repo.unverifyCertification(
          tx,
          id,
          actor.userId,
          body.reason,
        );

        if (unverified === null) {
          throw new AppError('NOT_FOUND', { detail: 'Certification not found.' });
        }

        // Recompute market block on write (inside same transaction)
        await repo.recomputeFarmerMarketBlock(
          tx,
          existing.farmer_id,
          actor.userId,
          actor.roles[0]?.code,
        );

        // BR-35c: the after image carries the reason (verificationNotes).
        await auditCertification(tx, actor, 'certification.unverify', id, { before: existing, after: unverified });

        return unverified;
      });

      return mapCertificationResponse(cert);
    },

    // Global config value — not farmer-specific, so no scoping/resolveFarmerId
    // call is needed. `actor` is accepted only to keep the service's calling
    // convention uniform (see CertificationsService above).
    async getConfig(_actor) {
      const certExpiryWarningDays = await repo.getCertExpiryWarningDays(pool);
      const certExpiryMaxPastDays = await repo.getCertExpiryMaxPastDays(pool);
      const certExpiryMaxFutureDays = await repo.getCertExpiryMaxFutureDays(pool);
      return { certExpiryWarningDays, certExpiryMaxPastDays, certExpiryMaxFutureDays };
    },

    async adminListCertifications(_actor, query) {
      const { items, nextCursor, hasMore } = await repo.listAllCertifications(pool, {
        limit: query.limit,
        cursor: query.cursor,
        status: query.status,
        farmerId: query.farmerId,
      });
      return {
        items: items.map(mapCertificationResponse),
        page: { nextCursor, hasMore },
      };
    },

    async adminGetCertification(_actor, id) {
      const cert = await repo.findByIdAdmin(pool, id);
      if (cert === null) {
        throw new AppError('NOT_FOUND', { detail: 'Certification not found.' });
      }
      return mapCertificationResponse(cert);
    },
  };
}

export const certificationsService = createCertificationsService();
