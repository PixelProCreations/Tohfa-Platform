/**
 * Customer self-service profile (BR-160) — SQL only. Every statement is keyed on
 * the caller's own customer id; a soft-deleted customer matches nothing.
 */
import type { Executor } from '../../db/pool.js';
import type { CustomerProfileRecord, GstDetailsBody, UpdateProfileBody } from './customer-profile.schema.js';

export interface EmailChallenge {
  id: string;
  email: string;
  codeHash: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
}

export interface CustomerProfileRepo {
  findProfile(db: Executor, customerId: string): Promise<CustomerProfileRecord | null>;
  updateProfile(db: Executor, customerId: string, patch: UpdateProfileBody): Promise<void>;
  updateGstDetails(db: Executor, customerId: string, body: GstDetailsBody): Promise<void>;
  /** True when another LIVE user already holds this email (uq_users_email_live). */
  emailTakenByOther(db: Executor, customerId: string, email: string): Promise<boolean>;
  configValue(db: Executor, key: string): Promise<unknown>;
  insertEmailChallenge(
    db: Executor,
    row: { customerId: string; email: string; codeHash: string; maxAttempts: number; expiresAt: Date },
  ): Promise<void>;
  /** Creation times of challenges sent to this customer since `since` (resend cooldown / hourly cap). */
  recentEmailChallengeTimes(db: Executor, customerId: string, since: Date): Promise<Date[]>;
  /** Latest unconsumed challenge, row-locked. */
  lockLatestEmailChallenge(db: Executor, customerId: string): Promise<EmailChallenge | null>;
  incrementEmailChallengeAttempts(db: Executor, id: string): Promise<void>;
  consumeEmailChallenge(db: Executor, id: string): Promise<void>;
  setVerifiedEmail(db: Executor, customerId: string, email: string): Promise<void>;
  /** For account deletion: money still held and orders not yet handed over. */
  deletionBlockers(db: Executor, customerId: string): Promise<{ walletBalance: string; openOrders: number }>;
  anonymise(db: Executor, customerId: string, placeholderMobile: string): Promise<void>;
}

/** Orders that are still moving; a customer cannot vanish from under them. */
const OPEN_ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'CONFIRMED',
  'PACKED',
  'READY_FOR_PICKUP',
  'DISPATCHED',
  'OUT_FOR_DELIVERY',
];

interface ProfileRow extends Omit<CustomerProfileRecord, 'createdAt'> {
  createdAt: Date;
}

export const customerProfileRepo: CustomerProfileRepo = {
  async findProfile(db, customerId) {
    const res = await db.query<ProfileRow>(
      `SELECT c.id, c.customer_code AS "customerCode", u.full_name AS "fullName", u.mobile,
              u.email, (c.email_verified_at IS NOT NULL AND u.email IS NOT NULL) AS "emailVerified",
              c.age::int AS age, c.gender, c.harvest_preferences AS "harvestPreferences",
              c.photo_key AS "photoKey", c.customer_type AS "customerType",
              c.business_name AS "businessName", c.gstin, c.gst_verified AS "gstVerified",
              c.default_address_id AS "defaultAddressId", u.preferred_locale AS "preferredLocale",
              c.created_at AS "createdAt"
         FROM customers c
         JOIN users u ON u.id = c.user_id
        WHERE c.id = $1 AND c.deleted_at IS NULL`,
      [customerId],
    );
    const row = res.rows[0];
    return row ? { ...row, createdAt: row.createdAt.toISOString() } : null;
  },

  async updateProfile(db, customerId, patch) {
    if (patch.fullName !== undefined || patch.preferredLocale !== undefined) {
      await db.query(
        `UPDATE users SET full_name = COALESCE($2, full_name),
                          preferred_locale = COALESCE($3, preferred_locale), updated_at = now()
          WHERE id = (SELECT user_id FROM customers WHERE id = $1)`,
        [customerId, patch.fullName ?? null, patch.preferredLocale ?? null],
      );
    }
    const sets: string[] = [];
    const params: unknown[] = [customerId];
    const add = (column: string, value: unknown) => {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    };
    if (patch.age !== undefined) add('age', patch.age);
    if (patch.gender !== undefined) add('gender', patch.gender);
    if (patch.harvestPreferences !== undefined) add('harvest_preferences', patch.harvestPreferences);
    if (patch.photoKey !== undefined) add('photo_key', patch.photoKey);
    if (sets.length > 0) {
      await db.query(
        `UPDATE customers SET ${sets.join(', ')}, updated_at = now()
          WHERE id = $1 AND deleted_at IS NULL`,
        params,
      );
    }
  },

  async updateGstDetails(db, customerId, body) {
    // A GSTIN change un-verifies it: verification belongs to the number, not the account.
    await db.query(
      `UPDATE customers
          SET customer_type = $2, business_name = $3,
              gst_verified = CASE WHEN gstin IS NOT DISTINCT FROM $4 THEN gst_verified ELSE false END,
              gstin = $4, updated_at = now()
        WHERE id = $1 AND deleted_at IS NULL`,
      [customerId, body.customerType, body.businessName ?? null, body.gstin ?? null],
    );
  },

  async emailTakenByOther(db, customerId, email) {
    const res = await db.query(
      `SELECT 1 FROM users u
        WHERE lower(u.email) = lower($2) AND u.deleted_at IS NULL
          AND u.id <> (SELECT user_id FROM customers WHERE id = $1)`,
      [customerId, email],
    );
    return (res.rowCount ?? 0) > 0;
  },

  async configValue(db, key) {
    const res = await db.query<{ value: unknown }>(`SELECT value FROM system_config WHERE key = $1`, [key]);
    return res.rows[0]?.value;
  },

  async insertEmailChallenge(db, row) {
    await db.query(
      `INSERT INTO customer_email_verifications (customer_id, email, code_hash, max_attempts, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [row.customerId, row.email, row.codeHash, row.maxAttempts, row.expiresAt],
    );
  },

  async recentEmailChallengeTimes(db, customerId, since) {
    const res = await db.query<{ createdAt: Date }>(
      `SELECT created_at AS "createdAt" FROM customer_email_verifications
        WHERE customer_id = $1 AND created_at > $2`,
      [customerId, since],
    );
    return res.rows.map((r) => r.createdAt);
  },

  async lockLatestEmailChallenge(db, customerId) {
    const res = await db.query<EmailChallenge>(
      `SELECT id, email, code_hash AS "codeHash", attempts, max_attempts AS "maxAttempts",
              expires_at AS "expiresAt"
         FROM customer_email_verifications
        WHERE customer_id = $1 AND consumed_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE`,
      [customerId],
    );
    return res.rows[0] ?? null;
  },

  async incrementEmailChallengeAttempts(db, id) {
    await db.query(`UPDATE customer_email_verifications SET attempts = attempts + 1 WHERE id = $1`, [id]);
  },

  async consumeEmailChallenge(db, id) {
    await db.query(`UPDATE customer_email_verifications SET consumed_at = now() WHERE id = $1`, [id]);
  },

  async setVerifiedEmail(db, customerId, email) {
    await db.query(
      `UPDATE users SET email = $2, updated_at = now()
        WHERE id = (SELECT user_id FROM customers WHERE id = $1)`,
      [customerId, email],
    );
    await db.query(
      `UPDATE customers SET email_verified_at = now(), updated_at = now() WHERE id = $1`,
      [customerId],
    );
  },

  async deletionBlockers(db, customerId) {
    const res = await db.query<{ walletBalance: string; openOrders: number }>(
      `SELECT COALESCE((SELECT SUM(balance) FROM wallets WHERE customer_id = $1), 0)::numeric(12,2)::text
                AS "walletBalance",
              (SELECT COUNT(*)::int FROM orders WHERE customer_id = $1 AND status::text = ANY($2::text[]))
                AS "openOrders"`,
      [customerId, OPEN_ORDER_STATUSES],
    );
    return res.rows[0] ?? { walletBalance: '0.00', openOrders: 0 };
  },

  async anonymise(db, customerId, placeholderMobile) {
    // PII only. orders, wallet_transactions, order_status_history and audit_log are
    // append-only ledgers and keep their rows; they reference ids, not names.
    await db.query(
      `UPDATE users
          SET full_name = 'Deleted customer', email = NULL, mobile = $2, password_hash = NULL,
              status = 'DISABLED', disabled_at = now(), disabled_reason = 'Customer deleted own account',
              deleted_at = now(), updated_at = now()
        WHERE id = (SELECT user_id FROM customers WHERE id = $1)`,
      [customerId, placeholderMobile],
    );
    await db.query(
      `UPDATE customers
          SET customer_type = 'RETAIL', business_name = NULL, gstin = NULL, gst_verified = false,
              age = NULL, gender = NULL, harvest_preferences = '{}', photo_key = NULL,
              email_verified_at = NULL, default_address_id = NULL,
              anonymised_at = now(), deleted_at = now(), updated_at = now()
        WHERE id = $1`,
      [customerId],
    );
    await db.query(
      `UPDATE customer_addresses
          SET line1 = 'deleted', line2 = NULL, district = NULL, lat = NULL, lng = NULL, geom = NULL,
              is_default = false, deleted_at = COALESCE(deleted_at, now()), updated_at = now()
        WHERE customer_id = $1`,
      [customerId],
    );
    await db.query(
      `UPDATE sessions SET revoked_at = now()
        WHERE user_id = (SELECT user_id FROM customers WHERE id = $1) AND revoked_at IS NULL`,
      [customerId],
    );
    await db.query(
      `UPDATE refresh_tokens SET revoked_at = now()
        WHERE user_id = (SELECT user_id FROM customers WHERE id = $1) AND revoked_at IS NULL`,
      [customerId],
    );
  },
};
