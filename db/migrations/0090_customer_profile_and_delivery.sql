-- =============================================================================
-- 0090_customer_profile_and_delivery.sql
-- Customer app backend (2026-11-16):
--   * BR-160 customer self-service profile: age, gender, harvest preferences,
--     photo, verified email, account deletion (anonymisation) markers;
--     email-change OTP challenges.
--   * BR-161 home delivery is enabled (owner decision 2026-11-16: pickup AND
--     home delivery). The flag lives in system_config, never in code.
-- Ledgers (wallet_transactions, orders, order_status_history, audit_log) are
-- not touched: deleting an account anonymises the person, not the money trail.
-- =============================================================================

-- +migrate Up

ALTER TABLE customers
    ADD COLUMN age                  smallint
        CONSTRAINT customers_age_chk CHECK (age IS NULL OR age BETWEEN 13 AND 120),
    ADD COLUMN gender               text
        CONSTRAINT customers_gender_chk
        CHECK (gender IS NULL OR gender IN ('FEMALE', 'MALE', 'OTHER', 'PREFER_NOT_TO_SAY')),
    ADD COLUMN harvest_preferences  text[]      NOT NULL DEFAULT '{}',
    ADD COLUMN photo_key            text,
    ADD COLUMN email_verified_at    timestamptz,
    ADD COLUMN anonymised_at        timestamptz;

COMMENT ON COLUMN customers.harvest_preferences IS
    'BR-160: free-form produce/category preferences the customer picked in the app (max 20, each <= 50 chars, enforced by the API).';
COMMENT ON COLUMN customers.anonymised_at IS
    'BR-160: set when the customer deleted their account. PII on users/customers is blanked; orders and wallet ledger rows stay.';

CREATE TABLE customer_email_verifications (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id   uuid        NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
    email         text        NOT NULL,
    code_hash     text        NOT NULL,
    attempts      smallint    NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    max_attempts  smallint    NOT NULL CHECK (max_attempts > 0),
    expires_at    timestamptz NOT NULL,
    consumed_at   timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_email_verifications_live
    ON customer_email_verifications (customer_id, created_at DESC)
    WHERE consumed_at IS NULL;

COMMENT ON TABLE customer_email_verifications IS
    'BR-160: one row per email-change OTP sent. Only the SHA-256 of the code is stored. '
    'Attempts are capped by system_config.otp_max_attempts; lifetime by email_otp_ttl_minutes.';

-- DO NOTHING: re-running must never overwrite a value an admin has since changed.
INSERT INTO system_config (key, value, data_type, description) VALUES
    ('home_delivery_enabled',
     'true'::jsonb, 'boolean',
     'BR-161: home delivery is offered at checkout alongside warehouse pickup (owner decision 2026-11-16). false turns DELIVERY checkouts into 501 without a redeploy.'),
    ('email_otp_ttl_minutes',
     '10'::jsonb, 'number',
     'BR-160: minutes an email-change OTP stays valid. UNCONFIRMED implementer default.')
ON CONFLICT (key) DO NOTHING;

-- +migrate Down
DELETE FROM system_config WHERE key IN ('home_delivery_enabled', 'email_otp_ttl_minutes');
DROP TABLE IF EXISTS customer_email_verifications;
ALTER TABLE customers
    DROP COLUMN IF EXISTS anonymised_at,
    DROP COLUMN IF EXISTS email_verified_at,
    DROP COLUMN IF EXISTS photo_key,
    DROP COLUMN IF EXISTS harvest_preferences,
    DROP COLUMN IF EXISTS gender,
    DROP COLUMN IF EXISTS age;
