-- =============================================================================
-- 0061_sale_attempts.sql
-- SWA Module 6; BR-87.
--
-- A failed DIRECT/MARKET sale rolls back everything it touched (payment, order, items, SALE stock
-- ledger rows, invoice, audit) as one transaction, so nothing of it survives in those tables. This
-- table is the evidence that it was attempted: the service writes one row OUTSIDE the rolled-back
-- transaction, naming the warehouse, the actor and why it failed.
--
-- APPEND-ONLY (BR-35, BR-37), through the same app_make_append_only() guard as stock_ledger and
-- audit_log: UPDATE, DELETE and TRUNCATE raise.
--
-- payload is diagnostic context (requested lines, quoted vs current price/stock, payment method).
-- It must NEVER contain a full mobile number, card number, UPI reference or any farm identity
-- (BR-16, BR-92): the service builds it from an allow-list.
-- =============================================================================

-- +migrate Up

CREATE TABLE sale_attempts (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id  uuid        NOT NULL REFERENCES warehouses (id),
    actor_id      uuid        NOT NULL REFERENCES users (id),
    reason_code   text        NOT NULL CHECK (btrim(reason_code) <> '' AND char_length(reason_code) <= 80),
    payload       jsonb       NOT NULL DEFAULT '{}'::jsonb,
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sale_attempts_warehouse_created ON sale_attempts (warehouse_id, created_at DESC);
CREATE INDEX idx_sale_attempts_actor_id          ON sale_attempts (actor_id);

COMMENT ON TABLE sale_attempts IS
    'APPEND-ONLY. BR-87: one row per DIRECT/MARKET sale that failed and was rolled back. '
    'reason_code is the domain ErrorCode (e.g. SALE_STOCK_CHANGED). payload is allow-listed '
    'diagnostics: no full mobile, card or UPI reference, no farm identity (BR-16, BR-92).';

SELECT app_make_append_only('sale_attempts');

-- +migrate Down
-- DROP TABLE is not blocked by the append-only triggers (they guard UPDATE/DELETE/TRUNCATE) and
-- takes them with it.

DROP TABLE IF EXISTS sale_attempts;
