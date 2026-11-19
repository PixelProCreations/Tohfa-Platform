-- Migration 0093: Delivery partners table and order delivery partner assignment
-- Supports dual fulfilment (BR-21) and delivery partner management (P0-71, P0-73).

-- +migrate Up

CREATE TABLE IF NOT EXISTS delivery_partners (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text        NOT NULL CHECK (btrim(name) <> ''),
    phone       text        NOT NULL CHECK (btrim(phone) <> ''),
    vehicle_ref text,
    is_active   boolean     NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz,
    deleted_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_delivery_partners_active ON delivery_partners (is_active) WHERE deleted_at IS NULL;

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS delivery_partner_id uuid REFERENCES delivery_partners (id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_orders_delivery_partner_id ON orders (delivery_partner_id) WHERE delivery_partner_id IS NOT NULL;

-- +migrate Down

DROP INDEX IF EXISTS idx_orders_delivery_partner_id;

ALTER TABLE orders
    DROP COLUMN IF EXISTS delivery_partner_id;

DROP TABLE IF EXISTS delivery_partners;
