-- =============================================================================
-- 0058_orders_walk_in_direct_channel.sql
-- SWA Module 6 (Direct / Market sales), owner decisions D2 and D4; BR-85, BR-86.
--
--   * orders.channel gains 'DIRECT' (an at-counter sale at a sub-warehouse). The column is
--     `text` with an inline CHECK (0006), not an enum, so the value is added by replacing that
--     CHECK; the Down can restore it exactly.
--   * Walk-in buyers: orders.customer_id becomes nullable and two columns name a walk-in instead.
--     Exactly one identity per order: a customer_id XOR a walk_in_name (BR-86).
--   * A walk-in has no wallet, so a walk-in order can never be payment_method WALLET (BR-86,
--     WALKIN_WALLET_NOT_ALLOWED in the service; this CHECK is the database backstop).
--   * Only DIRECT and MARKET sales may be walk-ins. ONLINE (and the 501-only HORECA/B2B) always
--     names a customer: the customer app is the only way an ONLINE order is placed.
--
-- Things that assumed orders.customer_id NOT NULL (audited across db/migrations 0001..0057):
--   * No view, function, trigger or RLS policy reads orders.customer_id.
--   * idx_orders_customer_id (customer_id, placed_at DESC) is a plain btree; NULLs are indexed and
--     harmless.
--   * return_requests.customer_id is NOT NULL (0046). A return is raised from the customer app, so
--     a walk-in order cannot have one; that table is deliberately left unchanged.
--   * invoices.customer_id is already nullable (0007): a walk-in sale's retail invoice simply
--     carries no customer_id.
--   * orders.payment_method defaults to 'WALLET'. A walk-in insert MUST name its method; relying on
--     the default fails orders_walk_in_no_wallet_chk, which is the intended loud failure.
--
-- walk_in_mobile uses the same E.164 pattern as users_mobile_e164_chk (0002), so a walk-in mobile
-- and a registered customer's mobile can be compared directly (customer lookup by mobile).
-- =============================================================================

-- +migrate Up

ALTER TABLE orders DROP CONSTRAINT orders_channel_check;
ALTER TABLE orders ADD CONSTRAINT orders_channel_check
    CHECK (channel IN ('ONLINE', 'MARKET', 'HORECA', 'B2B', 'DIRECT'));

ALTER TABLE orders ALTER COLUMN customer_id DROP NOT NULL;

ALTER TABLE orders
    ADD COLUMN walk_in_name   text,
    ADD COLUMN walk_in_mobile text;

ALTER TABLE orders
    ADD CONSTRAINT orders_walk_in_name_chk
        CHECK (walk_in_name IS NULL OR (btrim(walk_in_name) <> '' AND char_length(walk_in_name) <= 120)),
    ADD CONSTRAINT orders_walk_in_mobile_e164_chk
        CHECK (walk_in_mobile IS NULL OR walk_in_mobile ~ '^\+[1-9][0-9]{7,14}$'),
    -- BR-86: exactly one identity. Both set and neither set are both rejected.
    ADD CONSTRAINT orders_one_identity_chk
        CHECK ((customer_id IS NOT NULL) <> (walk_in_name IS NOT NULL)),
    -- A mobile without a walk-in name would be an orphan identity fragment.
    ADD CONSTRAINT orders_walk_in_mobile_needs_name_chk
        CHECK (walk_in_mobile IS NULL OR walk_in_name IS NOT NULL),
    -- BR-86: a walk-in has no wallet.
    ADD CONSTRAINT orders_walk_in_no_wallet_chk
        CHECK (walk_in_name IS NULL OR payment_method <> 'WALLET'),
    -- Only an at-counter (DIRECT) or market-day (MARKET) sale can be anonymous.
    ADD CONSTRAINT orders_walk_in_channel_chk
        CHECK (walk_in_name IS NULL OR channel IN ('DIRECT', 'MARKET'));

COMMENT ON COLUMN orders.customer_id IS
    'BR-86: NULL only for a walk-in DIRECT/MARKET sale, in which case walk_in_name is set '
    '(orders_one_identity_chk). Every ONLINE order names a customer.';
COMMENT ON COLUMN orders.walk_in_name IS
    'BR-86: the name a walk-in buyer gave at the counter. Set iff customer_id is NULL. PII.';
COMMENT ON COLUMN orders.walk_in_mobile IS
    'BR-86: optional E.164 mobile of a walk-in buyer; only allowed when walk_in_name is set. PII: '
    'never logged, never copied into an audit image, masked for own-scope readers (BR-92).';

-- +migrate Down
-- Fails loudly (by design) if any walk-in or DIRECT order exists: deleting sales to make a
-- rollback succeed would destroy financial records. Resolve those rows by hand first.

ALTER TABLE orders
    DROP CONSTRAINT IF EXISTS orders_walk_in_channel_chk,
    DROP CONSTRAINT IF EXISTS orders_walk_in_no_wallet_chk,
    DROP CONSTRAINT IF EXISTS orders_walk_in_mobile_needs_name_chk,
    DROP CONSTRAINT IF EXISTS orders_one_identity_chk,
    DROP CONSTRAINT IF EXISTS orders_walk_in_mobile_e164_chk,
    DROP CONSTRAINT IF EXISTS orders_walk_in_name_chk;

ALTER TABLE orders
    DROP COLUMN IF EXISTS walk_in_mobile,
    DROP COLUMN IF EXISTS walk_in_name;

COMMENT ON COLUMN orders.customer_id IS NULL;

ALTER TABLE orders ALTER COLUMN customer_id SET NOT NULL;

ALTER TABLE orders DROP CONSTRAINT orders_channel_check;
ALTER TABLE orders ADD CONSTRAINT orders_channel_check
    CHECK (channel IN ('ONLINE', 'MARKET', 'HORECA', 'B2B'));
