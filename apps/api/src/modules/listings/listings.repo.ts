import type { Executor } from '../../db/pool.js';
import type { UpdateListingBody } from './listings.schema.js';

export interface ListingRow {
  id: string;
  listingNumber: string;
  farmerId: string;
  farmId: string | null;
  farmCropId: string | null;
  cropId: string;
  cropName: string;
  grade: 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT';
  quantityKg: string;
  askingPricePerKg: string;
  ceilingPricePerKg: string;
  finalPricePerKg: string | null;
  finalQuantityKg: string | null;
  fairPriceId: string;
  status: string;
  availableFrom: string | null;
  photos: string[];
  certificationBadges: unknown[];
  version: number;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string | null;
  counterRoundsUsed?: number;
  activeCounterOffer?: {
    id: string;
    listingId: string;
    round: number;
    offeredBy: 'ADMIN' | 'FARMER';
    pricePerKg: string;
    quantityKg: string;
    message: string | null;
    status: string;
    expiresAt: string;
  } | null;
}

export interface ListingRollup {
  pendingCount: number;
  pendingKg: string;
  acceptedCount: number;
  acceptedKg: string;
  withdrawnCount: number;
}

export interface FarmerProfileRow {
  id: string;
  userId: string;
  isMarketBlocked: boolean;
}

export interface CertBadge {
  certType: string;
  certNumber: string;
  issuingBody: string;
  issuedOn: string;
  expiresOn: string;
}

/** See listingsRepo.getListingCertEligibility. */
export interface ListingCertEligibility {
  /** True iff the farmer holds at least one VERIFIED, unexpired PGS/NPOP certificate. */
  eligible: boolean;
  /** Exactly those qualifying certificates; frozen onto the listing as badges. */
  qualifyingBadges: CertBadge[];
  /** Newest unexpired PGS/NPOP certificate still awaiting admin verification, if any. */
  pendingCert: { certType: string; certNumber: string } | null;
  /** The most recently expired PGS/NPOP certificate (any verification status), if any. */
  expiredCert: { certType: string; certNumber: string; expiresOn: string } | null;
}

export interface FairPriceLookup {
  id: string;
  ceilingPrice: string;
  effectiveFrom: string;
  effectiveTo: string | null;
}

/**
 * timestamptz -> ISO-8601 UTC ("2026-10-05T07:42:36.490Z"), the `format:
 * date-time` docs/openapi.yaml promises. node-postgres parses timestamptz into
 * a Date, so the columns are selected raw and serialized here, the same way
 * _example/warehouses.repo.ts does it. Never `::text` a timestamptz for the
 * wire: Postgres's own form ("2026-10-05 07:42:36.490266+00") is not RFC 3339
 * and React Native's Hermes engine parses it as NaN.
 *
 * `date` columns (available_from) are the opposite case and stay `::text`:
 * pg would turn them into a Date at LOCAL midnight, which can shift the day.
 */
function isoOrNull(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}

export const listingsRepo = {
  async findFarmerByUserId(db: Executor, userId: string): Promise<FarmerProfileRow | null> {
    const res = await db.query<FarmerProfileRow>(
      `SELECT id, user_id AS "userId", is_market_blocked AS "isMarketBlocked"
       FROM farmers
       WHERE user_id = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [userId],
    );
    return res.rows[0] ?? null;
  },

  async findFarmerById(db: Executor, farmerId: string): Promise<FarmerProfileRow | null> {
    const res = await db.query<FarmerProfileRow>(
      `SELECT id, user_id AS "userId", is_market_blocked AS "isMarketBlocked"
       FROM farmers
       WHERE id = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [farmerId],
    );
    return res.rows[0] ?? null;
  },

  /**
   * BR-01 / BR-02: may this farmer list? One query, evaluated for the FARMER,
   * not per certificate. A farmer is eligible iff at least one certificate is
   * VERIFIED, not expired, and of a qualifying type (PGS or NPOP). Any number of
   * other expired, UNVERIFIED or REJECTED certificates alongside it change nothing.
   *
   * `qualifyingTypes` is certifications.schema LISTING_QUALIFYING_CERT_TYPES,
   * passed in by the service and bound as $3 so this SQL holds no second copy
   * of the list. Every row of another type (OTHER) is filtered out up front, so
   * it can neither qualify nor be named as the pending or expired certificate:
   * verifying or renewing an OTHER certificate would not let the farmer list,
   * so an OTHER-only farmer gets CERT_MISSING (BR-02h, BR-02i).
   *
   * "Expired" means `expires_on < today`, where `today` is the caller's
   * Asia/Kolkata calendar date (getTodayKolkata). A certificate is therefore
   * still valid ON its expiry date, which is the same convention as
   * certifications.service getDaysToExpiry (< 0 is expired) and
   * certifications.repo recomputeFarmerMarketBlock (expires_on >= IST today).
   * It is passed in rather than read from CURRENT_DATE, which follows the
   * session time zone, not India's.
   *
   * pendingCert / expiredCert only matter when the farmer is NOT eligible: the
   * service uses them to pick CERT_UNVERIFIED vs CERT_EXPIRED (vs CERT_MISSING
   * when both are null: no PGS/NPOP certificate, or only unexpired REJECTED ones) and
   * to name the certificate in the problem detail. Dates are `::text` so a `date` never
   * becomes a JS Date at local midnight (see the note on isoOrNull above).
   */
  async getListingCertEligibility(
    db: Executor,
    farmerId: string,
    today: string,
    qualifyingTypes: readonly string[],
  ): Promise<ListingCertEligibility> {
    const res = await db.query<{
      eligible: boolean;
      qualifying_badges: CertBadge[];
      pending_cert: ListingCertEligibility['pendingCert'];
      expired_cert: ListingCertEligibility['expiredCert'];
    }>(
      `SELECT
         COALESCE(bool_or(c.qualifies), false) AS eligible,
         COALESCE(
           jsonb_agg(
             jsonb_build_object(
               'certType', c.cert_type, 'certNumber', c.cert_number,
               'issuingBody', c.issuing_body,
               'issuedOn', c.issued_on::text, 'expiresOn', c.expires_on::text)
             ORDER BY c.expires_on DESC, c.cert_number
           ) FILTER (WHERE c.qualifies),
           '[]'::jsonb
         ) AS qualifying_badges,
         (jsonb_agg(
            jsonb_build_object('certType', c.cert_type, 'certNumber', c.cert_number)
            ORDER BY c.created_at DESC
          ) FILTER (WHERE c.verification_status = 'UNVERIFIED' AND NOT c.expired)) -> 0 AS pending_cert,
         (jsonb_agg(
            jsonb_build_object('certType', c.cert_type, 'certNumber', c.cert_number,
                               'expiresOn', c.expires_on::text)
            ORDER BY c.expires_on DESC
          ) FILTER (WHERE c.expired)) -> 0 AS expired_cert
       FROM (
         SELECT cert_type, cert_number, issuing_body, issued_on, expires_on,
                verification_status, created_at,
                expires_on < $2::date AS expired,
                (verification_status = 'VERIFIED'
                 AND expires_on >= $2::date) AS qualifies
           FROM certifications
          WHERE farmer_id = $1 AND deleted_at IS NULL
            AND cert_type = ANY($3::certification_type[])
       ) c`,
      [farmerId, today, qualifyingTypes],
    );

    // An aggregate with no GROUP BY always returns exactly one row.
    const row = res.rows[0];
    return {
      eligible: row?.eligible === true,
      qualifyingBadges: row?.qualifying_badges ?? [],
      pendingCert: row?.pending_cert ?? null,
      expiredCert: row?.expired_cert ?? null,
    };
  },

  async getSystemConfig(db: Executor, key: string): Promise<unknown | null> {
    const res = await db.query<{ value: unknown }>(
      `SELECT value FROM system_config WHERE key = $1 LIMIT 1`,
      [key],
    );
    return res.rows[0]?.value ?? null;
  },

  async countActiveListings(db: Executor, farmerId: string): Promise<number> {
    const res = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM produce_listings
       WHERE farmer_id = $1
         AND status IN ('PENDING_APPROVAL', 'COUNTER_OFFERED', 'ACCEPTED')
         AND deleted_at IS NULL`,
      [farmerId],
    );
    return parseInt(res.rows[0]?.count ?? '0', 10);
  },

  async findEffectiveFairPrice(
    db: Executor,
    cropId: string,
    grade: string,
    effectiveDate: string,
  ): Promise<FairPriceLookup | null> {
    const res = await db.query<{
      id: string;
      ceiling_price: string;
      effective_from: string;
      effective_to: string | null;
    }>(
      `SELECT id, ceiling_price::text, effective_from::text, effective_to::text
       FROM fair_prices
       WHERE crop_id = $1
         AND grade = $2
         AND effective_from <= $3::date
         AND (effective_to IS NULL OR effective_to >= $3::date)
       ORDER BY effective_from DESC
       LIMIT 1`,
      [cropId, grade, effectiveDate],
    );

    if (!res.rows[0]) return null;
    return {
      id: res.rows[0].id,
      ceilingPrice: res.rows[0].ceiling_price,
      effectiveFrom: res.rows[0].effective_from.slice(0, 10),
      effectiveTo: res.rows[0].effective_to ? res.rows[0].effective_to.slice(0, 10) : null,
    };
  },

  /**
   * BR-71: next `LST-YYYY-NNNN`. MUST be called inside the transaction that
   * inserts the listing: the transaction-scoped advisory lock below is held
   * until that transaction commits or rolls back, so the next caller reads
   * the committed row and cannot choose the same number.
   *
   * Why a lock and the highest existing suffix, not COUNT(*)+1 (two
   * concurrent creates read the same count and one hit the unique
   * `listing_number` constraint as a 500; a gap left by a deleted row, or a
   * number written by a seed or import, would also be reused or collide) and
   * not a sequence (the number restarts every calendar year, which a single
   * sequence cannot do without a per-year table that still drifts from rows
   * inserted by hand). The lock is taken last, after every row lock the
   * create holds, so it cannot take part in a lock cycle. Creating a listing
   * is a farmer-paced action; serialising the few statements that follow the
   * lock costs nothing measurable.
   */
  async generateListingNumber(db: Executor): Promise<string> {
    const year = new Date().getFullYear();
    await db.query(`SELECT pg_advisory_xact_lock(hashtextextended('produce_listings.listing_number', 0))`);
    const res = await db.query<{ max_seq: string }>(
      `SELECT COALESCE(MAX(substring(listing_number FROM '^LST-' || $1::text || '-([0-9]+)$')::bigint), 0)::text AS max_seq
         FROM produce_listings
        WHERE listing_number LIKE $2`,
      [String(year), `LST-${year}-%`],
    );
    const nextSeq = parseInt(res.rows[0]?.max_seq ?? '0', 10) + 1;
    return `LST-${year}-${String(nextSeq).padStart(4, '0')}`;
  },

  async insertListing(
    db: Executor,
    data: {
      listingNumber: string;
      farmerId: string;
      farmId?: string | undefined;
      cropId: string;
      grade: string;
      quantityKg: string;
      askingPricePerKg: string;
      fairPriceId: string;
      availableFrom?: string | undefined;
      photos?: string[] | undefined;
      certificationBadges: CertBadge[];
    },
  ): Promise<ListingRow> {
    const res = await db.query<{
      id: string;
      listing_number: string;
      farmer_id: string;
      farm_id: string | null;
      farm_crop_id: string | null;
      crop_id: string;
      crop_name: string;
      grade: 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT';
      quantity_kg: string;
      price_per_kg: string;
      ceiling_price: string;
      final_price_per_kg: string | null;
      final_quantity_kg: string | null;
      fair_price_id: string;
      status: string;
      available_from: string | null;
      photo_keys: string[] | null;
      certification_badges: unknown[];
      version: number;
      approved_by: string | null;
      approved_at: Date | null;
      rejected_by: string | null;
      rejected_at: Date | null;
      rejection_reason: string | null;
      created_at: Date;
      updated_at: Date | null;
    }>(
      `WITH ins AS (
         INSERT INTO produce_listings (
           listing_number, farmer_id, farm_id, crop_id, grade,
           quantity_kg, price_per_kg, fair_price_id, status,
           available_from, photo_keys, certification_badges, version
         ) VALUES (
           $1, $2, $3, $4, $5,
           $6, $7, $8, 'PENDING_APPROVAL',
           $9, $10, $11::jsonb, 1
         )
         RETURNING *
       )
       SELECT ins.id, ins.listing_number, ins.farmer_id, ins.farm_id, ins.farm_crop_id,
              ins.crop_id, cm.name AS crop_name, ins.grade, ins.quantity_kg::text,
              ins.price_per_kg::text, fp.ceiling_price::text AS ceiling_price,
              ins.final_price_per_kg::text, ins.final_quantity_kg::text,
              ins.fair_price_id, ins.status, ins.available_from::text,
              ins.photo_keys, ins.certification_badges, ins.version,
              ins.approved_by, ins.approved_at, ins.rejected_by,
              ins.rejected_at, ins.rejection_reason,
              ins.created_at, ins.updated_at
       FROM ins
       JOIN crop_master cm ON cm.id = ins.crop_id
       JOIN fair_prices fp ON fp.id = ins.fair_price_id`,
      [
        data.listingNumber,
        data.farmerId,
        data.farmId ?? null,
        data.cropId,
        data.grade,
        data.quantityKg,
        data.askingPricePerKg,
        data.fairPriceId,
        data.availableFrom ?? null,
        data.photos ?? null,
        JSON.stringify(data.certificationBadges),
      ],
    );

    const row = res.rows[0]!;
    return {
      id: row.id,
      listingNumber: row.listing_number,
      farmerId: row.farmer_id,
      farmId: row.farm_id,
      farmCropId: row.farm_crop_id,
      cropId: row.crop_id,
      cropName: row.crop_name,
      grade: row.grade,
      quantityKg: row.quantity_kg,
      askingPricePerKg: row.price_per_kg,
      ceilingPricePerKg: row.ceiling_price,
      finalPricePerKg: row.final_price_per_kg,
      finalQuantityKg: row.final_quantity_kg,
      fairPriceId: row.fair_price_id,
      status: row.status,
      availableFrom: row.available_from ? row.available_from.slice(0, 10) : null,
      photos: row.photo_keys ?? [],
      certificationBadges: (row.certification_badges as unknown[]) ?? [],
      version: row.version,
      approvedBy: row.approved_by,
      approvedAt: isoOrNull(row.approved_at),
      rejectedBy: row.rejected_by,
      rejectedAt: isoOrNull(row.rejected_at),
      rejectionReason: row.rejection_reason,
      createdAt: row.created_at.toISOString(),
      updatedAt: isoOrNull(row.updated_at),
    };
  },

  async findListingById(db: Executor, id: string): Promise<ListingRow | null> {
    const res = await db.query<{
      id: string;
      listing_number: string;
      farmer_id: string;
      farm_id: string | null;
      farm_crop_id: string | null;
      crop_id: string;
      crop_name: string;
      grade: 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT';
      quantity_kg: string;
      price_per_kg: string;
      ceiling_price: string;
      final_price_per_kg: string | null;
      final_quantity_kg: string | null;
      fair_price_id: string;
      status: string;
      available_from: string | null;
      photo_keys: string[] | null;
      certification_badges: unknown[];
      version: number;
      approved_by: string | null;
      approved_at: Date | null;
      rejected_by: string | null;
      rejected_at: Date | null;
      rejection_reason: string | null;
      created_at: Date;
      updated_at: Date | null;
    }>(
      `SELECT pl.id, pl.listing_number, pl.farmer_id, pl.farm_id, pl.farm_crop_id,
              pl.crop_id, cm.name AS crop_name, pl.grade, pl.quantity_kg::text,
              pl.price_per_kg::text, fp.ceiling_price::text AS ceiling_price,
              pl.final_price_per_kg::text, pl.final_quantity_kg::text,
              pl.fair_price_id, pl.status, pl.available_from::text,
              pl.photo_keys, pl.certification_badges, pl.version,
              pl.approved_by, pl.approved_at, pl.rejected_by,
              pl.rejected_at, pl.rejection_reason,
              pl.created_at, pl.updated_at
       FROM produce_listings pl
       JOIN crop_master cm ON cm.id = pl.crop_id
       JOIN fair_prices fp ON fp.id = pl.fair_price_id
       WHERE pl.id = $1 AND pl.deleted_at IS NULL`,
      [id],
    );

    if (!res.rows[0]) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      listingNumber: row.listing_number,
      farmerId: row.farmer_id,
      farmId: row.farm_id,
      farmCropId: row.farm_crop_id,
      cropId: row.crop_id,
      cropName: row.crop_name,
      grade: row.grade,
      quantityKg: row.quantity_kg,
      askingPricePerKg: row.price_per_kg,
      ceilingPricePerKg: row.ceiling_price,
      finalPricePerKg: row.final_price_per_kg,
      finalQuantityKg: row.final_quantity_kg,
      fairPriceId: row.fair_price_id,
      status: row.status,
      availableFrom: row.available_from ? row.available_from.slice(0, 10) : null,
      photos: row.photo_keys ?? [],
      certificationBadges: (row.certification_badges as unknown[]) ?? [],
      version: row.version,
      approvedBy: row.approved_by,
      approvedAt: isoOrNull(row.approved_at),
      rejectedBy: row.rejected_by,
      rejectedAt: isoOrNull(row.rejected_at),
      rejectionReason: row.rejection_reason,
      createdAt: row.created_at.toISOString(),
      updatedAt: isoOrNull(row.updated_at),
    };
  },

  async listFarmerListings(
    db: Executor,
    farmerId: string,
    filters: {
      status?: string | undefined;
      cursor?: string | undefined;
      limit: number;
    },
  ): Promise<{ items: ListingRow[]; nextCursor: string | null; hasMore: boolean }> {
    const conditions = ['pl.farmer_id = $1', 'pl.deleted_at IS NULL'];
    const values: unknown[] = [farmerId];
    let idx = 2;

    if (filters.status) {
      conditions.push(`pl.status = $${idx}`);
      values.push(filters.status);
      idx++;
    }

    if (filters.cursor) {
      conditions.push(`pl.created_at < $${idx}`);
      values.push(filters.cursor);
      idx++;
    }

    values.push(filters.limit + 1);

    const res = await db.query<{
      id: string;
      listing_number: string;
      farmer_id: string;
      farm_id: string | null;
      farm_crop_id: string | null;
      crop_id: string;
      crop_name: string;
      grade: 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT';
      quantity_kg: string;
      price_per_kg: string;
      ceiling_price: string;
      final_price_per_kg: string | null;
      final_quantity_kg: string | null;
      fair_price_id: string;
      status: string;
      available_from: string | null;
      photo_keys: string[] | null;
      certification_badges: unknown[];
      version: number;
      approved_by: string | null;
      approved_at: Date | null;
      rejected_by: string | null;
      rejected_at: Date | null;
      rejection_reason: string | null;
      created_at: Date;
      updated_at: Date | null;
      cursor_created_at: string;
      counter_rounds_used: number;
      active_offer_id: string | null;
      active_offer_round: number | null;
      active_offer_offered_by: 'ADMIN' | 'FARMER' | null;
      active_offer_price: string | null;
      active_offer_qty: string | null;
      active_offer_msg: string | null;
      active_offer_status: string | null;
      active_offer_expires_at: Date | null;
    }>(
      // cursor_created_at keeps the full MICROSECOND precision of created_at:
      // a JS Date (and so toISOString) stops at milliseconds, and a truncated
      // cursor would skip rows created later within the same millisecond as the
      // last row of a page. ISO-8601 UTC with no '+', so it survives a query
      // string unencoded. Opaque to clients per PageMeta.
      `SELECT pl.id, pl.listing_number, pl.farmer_id, pl.farm_id, pl.farm_crop_id,
              pl.crop_id, cm.name AS crop_name, pl.grade, pl.quantity_kg::text,
              pl.price_per_kg::text, fp.ceiling_price::text AS ceiling_price,
              pl.final_price_per_kg::text, pl.final_quantity_kg::text,
              pl.fair_price_id, pl.status, pl.available_from::text,
              pl.photo_keys, pl.certification_badges, pl.version,
              pl.approved_by, pl.approved_at, pl.rejected_by,
              pl.rejected_at, pl.rejection_reason,
              pl.created_at, pl.updated_at,
              to_char(pl.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_created_at,
              (SELECT COUNT(*)::int FROM counter_offers WHERE listing_id = pl.id AND actor = 'FARMER') AS counter_rounds_used,
              co.id AS active_offer_id,
              co.round AS active_offer_round,
              co.actor AS active_offer_offered_by,
              co.price_per_kg::text AS active_offer_price,
              co.quantity_kg::text AS active_offer_qty,
              co.message AS active_offer_msg,
              co.status AS active_offer_status,
              co.expires_at AS active_offer_expires_at
       FROM produce_listings pl
       JOIN crop_master cm ON cm.id = pl.crop_id
       JOIN fair_prices fp ON fp.id = pl.fair_price_id
       LEFT JOIN counter_offers co ON co.listing_id = pl.id AND co.status = 'PENDING'
       WHERE ${conditions.join(' AND ')}
       ORDER BY pl.created_at DESC
       LIMIT $${idx}`,
      values,
    );

    const hasMore = res.rows.length > filters.limit;
    const rawItems = hasMore ? res.rows.slice(0, filters.limit) : res.rows;
    const nextCursor = hasMore && rawItems.length > 0 ? rawItems[rawItems.length - 1]!.cursor_created_at : null;

    const items: ListingRow[] = rawItems.map((row) => ({
      id: row.id,
      listingNumber: row.listing_number,
      farmerId: row.farmer_id,
      farmId: row.farm_id,
      farmCropId: row.farm_crop_id,
      cropId: row.crop_id,
      cropName: row.crop_name,
      grade: row.grade,
      quantityKg: row.quantity_kg,
      askingPricePerKg: row.price_per_kg,
      ceilingPricePerKg: row.ceiling_price,
      finalPricePerKg: row.final_price_per_kg,
      finalQuantityKg: row.final_quantity_kg,
      fairPriceId: row.fair_price_id,
      status: row.status,
      availableFrom: row.available_from ? row.available_from.slice(0, 10) : null,
      photos: row.photo_keys ?? [],
      certificationBadges: (row.certification_badges as unknown[]) ?? [],
      version: row.version,
      approvedBy: row.approved_by,
      approvedAt: isoOrNull(row.approved_at),
      rejectedBy: row.rejected_by,
      rejectedAt: isoOrNull(row.rejected_at),
      rejectionReason: row.rejection_reason,
      createdAt: row.created_at.toISOString(),
      updatedAt: isoOrNull(row.updated_at),
      counterRoundsUsed: row.counter_rounds_used ?? 0,
      activeCounterOffer: row.active_offer_id
        ? {
            id: row.active_offer_id,
            listingId: row.id,
            round: row.active_offer_round ?? 1,
            offeredBy: row.active_offer_offered_by ?? 'ADMIN',
            pricePerKg: row.active_offer_price ?? '0.00',
            quantityKg: row.active_offer_qty ?? '0.000',
            message: row.active_offer_msg,
            status: row.active_offer_status ?? 'PENDING',
            expiresAt: isoOrNull(row.active_offer_expires_at) ?? '',
          }
        : null,
    }));

    return { items, nextCursor, hasMore };
  },

  async getRollupSummary(db: Executor, farmerId: string): Promise<ListingRollup> {
    const res = await db.query<{
      pending_count: string;
      pending_kg: string;
      accepted_count: string;
      accepted_kg: string;
      withdrawn_count: string;
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'PENDING_APPROVAL')::text AS pending_count,
         COALESCE(SUM(quantity_kg) FILTER (WHERE status = 'PENDING_APPROVAL'), 0)::text AS pending_kg,
         COUNT(*) FILTER (WHERE status = 'ACCEPTED')::text AS accepted_count,
         COALESCE(SUM(quantity_kg) FILTER (WHERE status = 'ACCEPTED'), 0)::text AS accepted_kg,
         COUNT(*) FILTER (WHERE status = 'WITHDRAWN')::text AS withdrawn_count
       FROM produce_listings
       WHERE farmer_id = $1 AND deleted_at IS NULL`,
      [farmerId],
    );

    const r = res.rows[0];
    return {
      pendingCount: parseInt(r?.pending_count ?? '0', 10),
      pendingKg: r?.pending_kg ?? '0',
      acceptedCount: parseInt(r?.accepted_count ?? '0', 10),
      acceptedKg: r?.accepted_kg ?? '0',
      withdrawnCount: parseInt(r?.withdrawn_count ?? '0', 10),
    };
  },

  async updateListing(
    db: Executor,
    id: string,
    version: number,
    data: UpdateListingBody,
  ): Promise<ListingRow | null> {
    const setClauses = ['updated_at = now()', 'version = version + 1'];
    const values: unknown[] = [id, version];
    let idx = 3;

    if (data.quantityKg !== undefined) {
      setClauses.push(`quantity_kg = $${idx}`);
      values.push(data.quantityKg);
      idx++;
    }

    if (data.askingPricePerKg !== undefined) {
      setClauses.push(`price_per_kg = $${idx}`);
      values.push(data.askingPricePerKg);
      idx++;
    }

    if (data.availableFrom !== undefined) {
      setClauses.push(`available_from = $${idx}`);
      values.push(data.availableFrom);
      idx++;
    }

    if (data.photos !== undefined) {
      setClauses.push(`photo_keys = $${idx}`);
      values.push(data.photos);
      idx++;
    }

    const res = await db.query<{ id: string }>(
      `UPDATE produce_listings
       SET ${setClauses.join(', ')}
       WHERE id = $1 AND version = $2 AND status = 'PENDING_APPROVAL' AND deleted_at IS NULL
       RETURNING id`,
      values,
    );

    if (res.rowCount === 0) return null;
    return this.findListingById(db, id);
  },

  async withdrawListing(
    db: Executor,
    id: string,
    version: number,
  ): Promise<ListingRow | null> {
    const res = await db.query<{ id: string }>(
      `UPDATE produce_listings
       SET status = 'WITHDRAWN', updated_at = now(), version = version + 1
       WHERE id = $1 AND version = $2 AND status = 'PENDING_APPROVAL' AND deleted_at IS NULL
       RETURNING id`,
      [id, version],
    );

    if (res.rowCount === 0) return null;
    return this.findListingById(db, id);
  },
};
