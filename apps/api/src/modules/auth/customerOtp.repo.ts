import type { Executor } from '../../db/pool.js';

/**
 * BR-153: the SQL the passwordless customer sign-in needs beyond `AuthRepo`.
 * Kept separate so `AuthRepo` (and every mock of it) is unchanged.
 */
export interface CustomerOtpRepo {
  /**
   * Marks the challenge consumed only if nobody has yet. Returns false when a
   * concurrent verify already claimed it, so one OTP can sign in only once.
   */
  consumeOtpIfUnconsumed(db: Executor, challengeId: string): Promise<boolean>;
  /**
   * Ensures the user has a `customers` row and a CUSTOMER wallet. Idempotent
   * (UNIQUE customers.user_id, UNIQUE wallets.customer_id). Returns the customer id.
   */
  ensureCustomerAndWallet(db: Executor, userId: string): Promise<string>;
  /** BR-190: the onboarding fields that decide `profileComplete`. */
  onboardingFields(
    db: Executor,
    customerId: string,
  ): Promise<{ age: number | null; gender: string | null; harvestPreferences: string[] }>;
}

export const customerOtpRepo: CustomerOtpRepo = {
  async consumeOtpIfUnconsumed(db, challengeId) {
    const result = await db.query<{ id: string }>(
      `UPDATE otp_verifications
          SET consumed_at = now(),
              updated_at = now()
        WHERE id = $1 AND consumed_at IS NULL
        RETURNING id`,
      [challengeId],
    );
    return result.rows.length === 1;
  },

  async ensureCustomerAndWallet(db, userId) {
    await db.query(
      `INSERT INTO customers (user_id, customer_code)
       VALUES ($1, 'CUST-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)))
       ON CONFLICT (user_id) DO NOTHING`,
      [userId],
    );
    const customer = await db.query<{ id: string }>(
      `SELECT id FROM customers WHERE user_id = $1 LIMIT 1`,
      [userId],
    );
    const customerId = customer.rows[0]!.id;
    await db.query(
      `INSERT INTO wallets (owner_type, customer_id, balance, currency, status)
       VALUES ('CUSTOMER', $1, '0.00', 'INR', 'ACTIVE')
       ON CONFLICT (customer_id) WHERE customer_id IS NOT NULL DO NOTHING`,
      [customerId],
    );
    return customerId;
  },

  async onboardingFields(db, customerId) {
    const res = await db.query<{ age: number | null; gender: string | null; harvestPreferences: string[] | null }>(
      `SELECT age::int AS age, gender, harvest_preferences AS "harvestPreferences"
         FROM customers WHERE id = $1`,
      [customerId],
    );
    const row = res.rows[0];
    return { age: row?.age ?? null, gender: row?.gender ?? null, harvestPreferences: row?.harvestPreferences ?? [] };
  },
};
