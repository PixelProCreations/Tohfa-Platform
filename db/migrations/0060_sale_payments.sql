-- =============================================================================
-- 0060_sale_payments.sql
-- SWA Module 6, owner decision D6; BR-86, BR-88, BR-94.
--
-- One row per payment taken against a DIRECT/MARKET sale (an `orders` row).
--   * CASH and WALLET are server-confirmed at create (status CONFIRMED in the same transaction).
--   * UPI goes through the existing gateway: inserted PENDING, flipped to CONFIRMED by
--     POST /v1/admin/sales/{saleId}/payments/upi/confirm, which is when upi_txn_ref is known.
--   * CARD is a manual reference entry: card_ref is mandatory.
--   * CASH records what was handed over: amount_received >= amount and change_given is exactly
--     the difference (BR-94). The service computes it in integer paise; the CHECK is the backstop.
--
-- method reuses the payment_method enum (0001), which already holds WALLET, UPI, CARD and CASH, so
-- no enum value is added. NETBANKING is in that enum but is not a counter method, so it is
-- excluded by sale_payments_method_chk.
--
-- Amounts are numeric(12,2) rupees like every other money column (orders.total_amount, ...); the
-- API exposes them as the Money branded string, never a float.
--
-- idempotency_key is NOT NULL UNIQUE: every money-moving sale write carries an Idempotency-Key
-- (CLAUDE.md 2.4, BR-88), and a replay must find this row rather than insert a second one.
--
-- sale_payments is NOT a ledger: a UPI row moves PENDING -> CONFIRMED | FAILED in place. The
-- money itself is evidenced by wallet_transactions (WALLET) and the gateway record (UPI).
-- =============================================================================

-- +migrate Up

CREATE TABLE sale_payments (
    id               uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id         uuid           NOT NULL REFERENCES orders (id) ON DELETE RESTRICT,
    method           payment_method NOT NULL,
    amount           numeric(12,2)  NOT NULL CHECK (amount >= 0),
    amount_received  numeric(12,2)  CHECK (amount_received IS NULL OR amount_received >= 0),
    change_given     numeric(12,2)  CHECK (change_given IS NULL OR change_given >= 0),
    upi_txn_ref      text           CHECK (upi_txn_ref IS NULL OR (btrim(upi_txn_ref) <> '' AND char_length(upi_txn_ref) <= 120)),
    card_ref         text           CHECK (card_ref IS NULL OR (btrim(card_ref) <> '' AND char_length(card_ref) <= 120)),
    status           text           NOT NULL DEFAULT 'PENDING'
                                    CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED')),
    idempotency_key  text           NOT NULL CHECK (btrim(idempotency_key) <> ''),
    created_by       uuid           NOT NULL REFERENCES users (id),
    created_at       timestamptz    NOT NULL DEFAULT now(),
    confirmed_at     timestamptz,
    updated_at       timestamptz,

    CONSTRAINT uq_sale_payments_idempotency_key UNIQUE (idempotency_key),
    CONSTRAINT sale_payments_method_chk
        CHECK (method IN ('CASH', 'UPI', 'CARD', 'WALLET')),
    -- confirmed_at is set exactly when the payment is CONFIRMED.
    CONSTRAINT sale_payments_confirmed_at_chk
        CHECK ((status = 'CONFIRMED') = (confirmed_at IS NOT NULL)),
    -- BR-94: CASH records the tender and the change; nothing else does.
    CONSTRAINT sale_payments_cash_tender_chk
        CHECK (method <> 'CASH'
               OR (amount_received IS NOT NULL
                   AND amount_received >= amount
                   AND change_given IS NOT NULL
                   AND change_given = amount_received - amount)),
    CONSTRAINT sale_payments_tender_only_cash_chk
        CHECK (method = 'CASH' OR (amount_received IS NULL AND change_given IS NULL)),
    -- BR-94: CARD is a manual reference entry, so the reference is mandatory.
    CONSTRAINT sale_payments_card_ref_chk
        CHECK ((method = 'CARD') = (card_ref IS NOT NULL)),
    -- UPI: the gateway reference may only appear on a UPI row, and a confirmed UPI row must carry it.
    CONSTRAINT sale_payments_upi_ref_only_upi_chk
        CHECK (method = 'UPI' OR upi_txn_ref IS NULL),
    CONSTRAINT sale_payments_upi_confirmed_ref_chk
        CHECK (method <> 'UPI' OR status <> 'CONFIRMED' OR upi_txn_ref IS NOT NULL),
    -- Only UPI waits on an external party. CASH, WALLET and CARD are never left PENDING.
    CONSTRAINT sale_payments_pending_only_upi_chk
        CHECK (status <> 'PENDING' OR method = 'UPI')
);

CREATE INDEX idx_sale_payments_order_id   ON sale_payments (order_id);
CREATE INDEX idx_sale_payments_created_by ON sale_payments (created_by);
CREATE INDEX idx_sale_payments_pending    ON sale_payments (created_at) WHERE status = 'PENDING';

COMMENT ON TABLE sale_payments IS
    'BR-94: payments taken against a DIRECT/MARKET sale. CASH/WALLET confirmed at create; UPI '
    'PENDING until the gateway confirm; CARD requires card_ref. BR-88: idempotency_key makes a '
    'replayed create find this row instead of moving money twice. BR-86: a walk-in order can '
    'never carry a WALLET payment (trg_sale_payments_walk_in_no_wallet).';

-- BR-86 backstop across tables: orders_walk_in_no_wallet_chk (0059) covers orders.payment_method,
-- but a WALLET sale_payments row could still be attached to a walk-in order. A CHECK cannot look at
-- another table, so a row trigger does it.
CREATE FUNCTION app_sale_payments_walk_in_no_wallet() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
    IF NEW.method = 'WALLET' AND EXISTS (
        SELECT 1 FROM orders o WHERE o.id = NEW.order_id AND o.customer_id IS NULL
    ) THEN
        RAISE EXCEPTION 'BR-86: a walk-in order cannot be paid by WALLET (order %)', NEW.order_id
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END
$fn$;

CREATE TRIGGER trg_sale_payments_walk_in_no_wallet
    BEFORE INSERT OR UPDATE OF method, order_id ON sale_payments
    FOR EACH ROW EXECUTE FUNCTION app_sale_payments_walk_in_no_wallet();

SELECT app_attach_updated_at_triggers();

-- +migrate Down

DROP TABLE IF EXISTS sale_payments;
DROP FUNCTION IF EXISTS app_sale_payments_walk_in_no_wallet();
