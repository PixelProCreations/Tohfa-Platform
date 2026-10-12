-- =============================================================================
-- 0068_sale_upi_cancel_refund.sql
-- SWA Module 6 (Direct / Market sales), BR-94g and BR-94i: an unpaid UPI sale can be cancelled,
-- expires, and a captured UPI payment whose sale cannot be fulfilled is refunded or owed.
--
-- Before this migration a pending UPI sale had no way out: if its confirm failed (for example the
-- held stock was written off, 409 SALE_STOCK_CHANGED) after the customer's money was captured, the
-- sale stayed PENDING_PAYMENT for ever and its hold kept reducing what every other sale could draw.
--
-- 1. sale_payments gains two states for a UPI payment that was captured but whose sale is cancelled:
--      REFUND_DUE - the money must go back; nobody has sent it yet (manual mode, or an automatic
--                   refund that failed or whose outcome is unknown). A person settles it.
--      REFUNDED   - the gateway accepted the refund (refund_ref = the gateway's refund id).
--    Both require the UPI reference, so the payment being refunded is always identifiable; the
--    partial unique index of 0067 keeps applying, so a refunded reference can never confirm a
--    different sale either. FAILED (already allowed) is a payment that never arrived.
--    sale_payments is NOT a ledger (0060): a UPI row moves PENDING -> CONFIRMED | FAILED |
--    REFUND_DUE -> REFUNDED in place, guarded by the service (WHERE status = <expected>).
--
-- 2. orders.payment_status gains REFUND_DUE (REFUNDED and FAILED already exist), so a cancelled
--    sale shows whether money is owed back.
--
-- 3. Two system_config keys, read by the sales service through the system_config accessor
--    (CLAUDE.md 2.7: no business threshold in a service):
--      sales.upi_pending_expiry_minutes - JSON null = auto-expiry DISABLED. Deliberately unset:
--        the business has not given a window, and expiring too early would cancel sales whose
--        money is still on its way. The expiry job is a no-op until an admin sets a positive
--        whole number of minutes.
--      sales.upi_refund_mode - 'manual' (default: no automatic money movement; a captured payment
--        on an unfulfillable sale is marked REFUND_DUE for a person) or 'auto' (the service asks
--        the gateway to refund once). Any other value is treated as 'manual'.
--    Both defaults are pending business confirmation (docs/rules.md BR-94i).
-- =============================================================================

-- +migrate Up

ALTER TABLE sale_payments DROP CONSTRAINT sale_payments_status_check;
ALTER TABLE sale_payments ADD CONSTRAINT sale_payments_status_check
    CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED', 'REFUND_DUE', 'REFUNDED'));

ALTER TABLE sale_payments
    ADD COLUMN refund_ref  text CHECK (refund_ref IS NULL OR (btrim(refund_ref) <> '' AND char_length(refund_ref) <= 120)),
    ADD COLUMN refunded_at timestamptz;

ALTER TABLE sale_payments
    -- BR-94i: only a captured UPI payment can be owed back or refunded, and it names the payment.
    ADD CONSTRAINT sale_payments_refund_upi_chk
        CHECK (status NOT IN ('REFUND_DUE', 'REFUNDED') OR (method = 'UPI' AND upi_txn_ref IS NOT NULL)),
    -- refunded_at is set exactly when the payment is REFUNDED.
    ADD CONSTRAINT sale_payments_refunded_at_chk
        CHECK ((status = 'REFUNDED') = (refunded_at IS NOT NULL)),
    -- A gateway refund id only appears on a REFUNDED row (a manual refund may have none).
    ADD CONSTRAINT sale_payments_refund_ref_chk
        CHECK (refund_ref IS NULL OR status = 'REFUNDED');

COMMENT ON COLUMN sale_payments.refund_ref IS
    'BR-94i: the gateway refund id of an automatic refund (REFUNDED). Null for a manual refund.';
COMMENT ON COLUMN sale_payments.refunded_at IS
    'BR-94i: when the refund was accepted; set exactly when status = REFUNDED.';

ALTER TABLE orders DROP CONSTRAINT orders_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check
    CHECK (payment_status IN ('PENDING', 'PAID', 'PARTIALLY_PAID', 'REFUNDED', 'FAILED', 'REFUND_DUE'));

-- DO NOTHING, not DO UPDATE: re-running must never overwrite a value an admin has since changed.
INSERT INTO system_config (key, value, data_type, description) VALUES
    ('sales.upi_pending_expiry_minutes',
     'null'::jsonb, 'number',
     'BR-94i: minutes after which an unconfirmed UPI DIRECT/MARKET sale is expired by the sale-upi-expiry-sweep job (its hold released; a captured payment is refunded or marked REFUND_DUE, never silently cancelled). null = auto-expiry DISABLED. Intentionally unset pending business confirmation; set a positive whole number to enable. The sales service reads this key -- it is NOT a literal in the service.'),
    ('sales.upi_refund_mode',
     '"manual"'::jsonb, 'string',
     'BR-94i: what happens to a captured UPI payment whose sale is cancelled. manual (default, pending business confirmation) = mark REFUND_DUE for a person, no automatic money movement; auto = ask the payment gateway to refund once (a failure leaves REFUND_DUE). Any other value is treated as manual. The sales service reads this key -- it is NOT a literal in the service.')
ON CONFLICT (key) DO NOTHING;

-- +migrate Down

DELETE FROM system_config WHERE key IN ('sales.upi_pending_expiry_minutes', 'sales.upi_refund_mode');

-- Fails on purpose if a sale already uses REFUND_DUE / REFUNDED: those rows record money owed or
-- returned and need a human decision before the states can be removed.
ALTER TABLE orders DROP CONSTRAINT orders_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check
    CHECK (payment_status IN ('PENDING', 'PAID', 'PARTIALLY_PAID', 'REFUNDED', 'FAILED'));

ALTER TABLE sale_payments
    DROP CONSTRAINT IF EXISTS sale_payments_refund_ref_chk,
    DROP CONSTRAINT IF EXISTS sale_payments_refunded_at_chk,
    DROP CONSTRAINT IF EXISTS sale_payments_refund_upi_chk;
ALTER TABLE sale_payments
    DROP COLUMN IF EXISTS refunded_at,
    DROP COLUMN IF EXISTS refund_ref;
ALTER TABLE sale_payments DROP CONSTRAINT sale_payments_status_check;
ALTER TABLE sale_payments ADD CONSTRAINT sale_payments_status_check
    CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED'));
