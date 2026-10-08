-- =============================================================================
-- 0042_returns.sql
-- Returns & Issues (RMA) — BR-61.
--
-- Lifecycle: PENDING -> INSPECTED -> APPROVED -> REFUNDED (wallet, instant)
--                                             -> REFUND_PENDING_BANK (bank,
--                                                manual 2-4 day hand-off to
--                                                SA/TA — see docs/rbac.json
--                                                rma.refund.bank_process and
--                                                the resolved "Process returns
--                                                (RMA) for MW/SW" contradiction
--                                                in docs/rules.md)
--                            -> REJECTED (from PENDING or INSPECTED)
--
-- return_requests carries no warehouse_id of its own — the warehouse a return
-- belongs to is always the warehouse of the order it is against, so every
-- warehouse-scoped query joins to `orders` for that column rather than
-- duplicating it here (see returnRequests.repo.ts).
--
-- No deleted_at: a return is ledger-adjacent evidence of a refund decision,
-- same reasoning as orders/order_items. return_request_status_history is the
-- append-only audit trail of the lifecycle, copying the order_status_history
-- pattern exactly.
-- =============================================================================

-- +migrate Up

CREATE TYPE return_status AS ENUM (
    'PENDING',
    'INSPECTED',
    'APPROVED',
    'REJECTED',
    'REFUND_PENDING_BANK',
    'REFUNDED'
);

CREATE TYPE return_item_condition AS ENUM (
    'GOOD',
    'DAMAGED',
    'SPOILED'
);

-- -----------------------------------------------------------------------------
-- return_requests
-- -----------------------------------------------------------------------------
CREATE TABLE return_requests (
    id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id     uuid          NOT NULL REFERENCES orders (id) ON DELETE RESTRICT,
    customer_id  uuid          NOT NULL REFERENCES customers (id) ON DELETE RESTRICT,
    status       return_status NOT NULL DEFAULT 'PENDING',
    reason       text          NOT NULL CHECK (btrim(reason) <> ''),
    note         text,
    created_at   timestamptz   NOT NULL DEFAULT now(),
    updated_at   timestamptz
);

CREATE INDEX idx_return_requests_order_id    ON return_requests (order_id);
CREATE INDEX idx_return_requests_customer_id ON return_requests (customer_id);
CREATE INDEX idx_return_requests_status      ON return_requests (status);

COMMENT ON TABLE return_requests IS
    'BR-61: the RMA lifecycle. Warehouse scoping for admin queries is derived '
    'from orders.warehouse_id via order_id — this table intentionally has no '
    'warehouse_id column of its own, to avoid a second source of truth for a '
    'fact the order already owns.';

-- -----------------------------------------------------------------------------
-- return_request_items
-- -----------------------------------------------------------------------------
CREATE TABLE return_request_items (
    id                 uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
    return_request_id  uuid    NOT NULL REFERENCES return_requests (id) ON DELETE CASCADE,
    order_item_id       uuid    NOT NULL REFERENCES order_items (id) ON DELETE RESTRICT,
    requested_qty       numeric(12,3) NOT NULL CHECK (requested_qty > 0),
    -- Populated by the inspection step (POST .../inspect); null until then.
    accepted_qty        numeric(12,3) CHECK (accepted_qty IS NULL OR accepted_qty >= 0),
    damaged_qty         numeric(12,3) CHECK (damaged_qty IS NULL OR damaged_qty >= 0),
    condition            return_item_condition,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz,
    CONSTRAINT uq_return_request_items_order_item UNIQUE (return_request_id, order_item_id),
    CONSTRAINT return_request_items_qty_balance_chk
        CHECK (accepted_qty IS NULL OR damaged_qty IS NULL
               OR accepted_qty + damaged_qty <= requested_qty + 0.001)
);

CREATE INDEX idx_return_request_items_return_request_id ON return_request_items (return_request_id);
CREATE INDEX idx_return_request_items_order_item_id     ON return_request_items (order_item_id);

COMMENT ON TABLE return_request_items IS
    'One row per order_item being returned. accepted_qty/damaged_qty/condition '
    'are set by POST /admin/returns/{id}/inspect, never at request creation.';

-- -----------------------------------------------------------------------------
-- return_request_status_history — APPEND ONLY (copies order_status_history,
-- db/migrations/0006_customers_orders.sql)
-- -----------------------------------------------------------------------------
CREATE TABLE return_request_status_history (
    id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    return_request_id   uuid          NOT NULL REFERENCES return_requests (id) ON DELETE CASCADE,
    from_status         return_status,
    to_status           return_status NOT NULL,
    changed_by          uuid          REFERENCES users (id),
    note                text,
    created_at          timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_return_request_status_history_return_request_id
    ON return_request_status_history (return_request_id, created_at);
CREATE INDEX idx_return_request_status_history_changed_by
    ON return_request_status_history (changed_by);

COMMENT ON TABLE return_request_status_history IS
    'APPEND-ONLY, same invariant and same reason as order_status_history '
    '(BR-35, BR-61): the RMA lifecycle as evidence. A correction is a new row.';

SELECT app_make_append_only('return_request_status_history');

SELECT app_attach_updated_at_triggers();

-- +migrate Down

DROP TABLE IF EXISTS return_request_status_history;
DROP TABLE IF EXISTS return_request_items;
DROP TABLE IF EXISTS return_requests;
DROP TYPE IF EXISTS return_item_condition;
DROP TYPE IF EXISTS return_status;
