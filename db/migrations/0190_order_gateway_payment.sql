-- =============================================================================
-- 0190_order_gateway_payment.sql
-- BR-17 (amended 2026-11-20 by owner decision), BR-213 (gateway-paid order lifecycle),
-- BR-214 (payment verification), BR-215 (payment window, cancel, release, late capture),
-- BR-216 (cash on delivery/shop stays disabled).
--
--  - orders.idempotency_key: the client's Idempotency-Key for POST /orders, so a replay of a
--    gateway-paid order (no wallet debit row to key on) returns the same order. Unique per
--    customer; NULL for orders placed before this column (and for walk-in sales).
--  - orders.payment_expires_at: end of the payment window of a PENDING_PAYMENT order; the
--    order-payment-expiry-sweep job cancels and releases the order after it. NULL for wallet
--    orders (paid at placement) and for orders placed before this column.
--  - payments(gateway_order_id) is unique for ref_type ORDER: one Razorpay order per order, so
--    the webhook and the verify call always resolve the same payments row.
--  - system_config: the payment window and the (disabled) cash-on-delivery switch.
--  - Nothing here touches stock_ledger: a released pending order is a new RELEASE row
--    (BR-37, append-only), written by the service, never an edit.
-- =============================================================================

-- +migrate Up
ALTER TABLE orders
    ADD COLUMN idempotency_key    text,
    ADD COLUMN payment_expires_at timestamptz;

CREATE UNIQUE INDEX uq_orders_customer_idempotency_key
    ON orders (customer_id, idempotency_key)
 WHERE idempotency_key IS NOT NULL;

-- The expiry sweep scans only orders still awaiting payment.
CREATE INDEX idx_orders_payment_expires_at
    ON orders (payment_expires_at)
 WHERE status = 'PENDING_PAYMENT' AND payment_expires_at IS NOT NULL;

CREATE UNIQUE INDEX uq_payments_order_gateway_order_id
    ON payments (gateway_order_id)
 WHERE ref_type = 'ORDER';

COMMENT ON COLUMN orders.idempotency_key IS
    'BR-213: Idempotency-Key of the POST /orders that created this order; a replay with the same key '
    'returns this order (and its gateway order). Unique per customer when set.';
COMMENT ON COLUMN orders.payment_expires_at IS
    'BR-215: end of the payment window of a PENDING_PAYMENT gateway order '
    '(placed_at + system_config.order_payment_window_minutes). NULL for wallet orders.';

COMMENT ON TABLE orders IS
$doc$Customer orders.

BR-15  — channel is NOT NULL and constrained to the four values; Track 1 serves
         ONLINE and returns 501 for the rest rather than mislabelling them.
BR-17  — wallet-first. An order row is only created once the wallet debit has
         succeeded; an insufficient balance is a 402 with a shortfall and NO row.
         Amended 2026-11-20 by owner decision: the wallet is ONE of the payment
         methods. A UPI / CARD / NETBANKING order is created PENDING_PAYMENT /
         payment_status PENDING with a Razorpay order (BR-213) and becomes
         CONFIRMED / PAID only on a server-verified capture (BR-214); an order is
         never CONFIRMED with an unpaid balance. Expiry or customer cancel makes
         it CANCELLED / FAILED and releases stock and slot (BR-215); a capture
         after that is REFUND_DUE (manual refund). CASH stays disabled (BR-216).
BR-20  — delivery_otp_hash holds only a hash. The plaintext OTP is never
         returned to the verifying admin, never logged, never in a payload.
         otp_attempts backs the lockout.
BR-21a — every Track 1 order is fulfilment_type = PICKUP with a warehouse_id.
BR-21b — OUT_FOR_DELIVERY exists in the enum but no endpoint transitions to it.
BR-27  — warehouse_id may be any of the four; there is no home-warehouse rule.
BR-36  — every read is filtered by customer_id; another customer's order is 404.$doc$;

-- DO NOTHING, not DO UPDATE: re-running must never overwrite a value an admin has since changed.
INSERT INTO system_config (key, value, data_type, description) VALUES
    ('order_payment_window_minutes',
     '15'::jsonb, 'number',
     'BR-215: minutes a UPI/CARD/NETBANKING order stays PENDING_PAYMENT before the order-payment-expiry-sweep job cancels it and releases its stock and slot (a capture found at expiry confirms it instead). Owner default 15.'),
    ('cod_enabled',
     'false'::jsonb, 'boolean',
     'BR-216: cash on delivery / cash at shop for online orders. false = POST /orders with paymentMethod CASH is 422 PAYMENT_METHOD_DISABLED. Kept for the future; only the owner enables it.')
ON CONFLICT (key) DO NOTHING;

-- +migrate Down
DELETE FROM system_config WHERE key IN ('order_payment_window_minutes', 'cod_enabled');

COMMENT ON TABLE orders IS
$doc$Customer orders.

BR-15  — channel is NOT NULL and constrained to the four values; Track 1 serves
         ONLINE and returns 501 for the rest rather than mislabelling them.
BR-17  — wallet-first. An order row is only created once the wallet debit has
         succeeded; an insufficient balance is a 402 with a shortfall and NO row.
BR-20  — delivery_otp_hash holds only a hash. The plaintext OTP is never
         returned to the verifying admin, never logged, never in a payload.
         otp_attempts backs the lockout.
BR-21a — every Track 1 order is fulfilment_type = PICKUP with a warehouse_id.
BR-21b — OUT_FOR_DELIVERY exists in the enum but no endpoint transitions to it.
BR-27  — warehouse_id may be any of the four; there is no home-warehouse rule.
BR-36  — every read is filtered by customer_id; another customer's order is 404.$doc$;

DROP INDEX IF EXISTS uq_payments_order_gateway_order_id;
DROP INDEX IF EXISTS idx_orders_payment_expires_at;
DROP INDEX IF EXISTS uq_orders_customer_idempotency_key;
ALTER TABLE orders
    DROP COLUMN IF EXISTS payment_expires_at,
    DROP COLUMN IF EXISTS idempotency_key;
