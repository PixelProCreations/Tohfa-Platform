-- =============================================================================
-- 0053_storage_locations.sql
-- Storage locations of a warehouse (BR-79): the named places stock is kept in
-- (cold storage, dry storage, bulk storage, staging area ...).
--
-- The designed Storage Info screen lists, per location: name, code, type,
-- Active/Inactive and capacity. Those are the columns here and nothing more:
--   * location_type is FREE TEXT (at most 40 characters), not an enum: the four
--     labels in the design are example data and the screens say the hierarchy
--     "reflects this warehouse's actual configuration, not hard-coded".
--   * no zone / rack / shelf columns: the design does not fix that hierarchy.
--   * `current stock` is NOT stored here: it would be a second source of truth
--     for the stock ledger.
--
-- inventory_batches.storage_location (0005) is a free-text label (max 40 chars,
-- set at goods receipt). It is deliberately NOT linked to this table: batches
-- already carry arbitrary text, so a foreign key or a validation would either
-- fail on existing rows or change the goods-receipt contract. A later story can
-- link them once the owner decides how existing labels map to locations.
-- =============================================================================

-- +migrate Up

CREATE TABLE storage_locations (
    id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id   uuid          NOT NULL REFERENCES warehouses (id),
    code           text          NOT NULL CHECK (btrim(code) <> '' AND char_length(code) <= 40),
    name           text          NOT NULL CHECK (btrim(name) <> '' AND char_length(name) <= 120),
    location_type  text          CHECK (location_type IS NULL OR (btrim(location_type) <> '' AND char_length(location_type) <= 40)),
    capacity_kg    numeric(12,3) CHECK (capacity_kg IS NULL OR capacity_kg > 0),
    is_active      boolean       NOT NULL DEFAULT true,
    created_at     timestamptz   NOT NULL DEFAULT now(),
    updated_at     timestamptz,
    deleted_at     timestamptz
);

-- A code names one location within one warehouse, case-insensitively, among live rows.
CREATE UNIQUE INDEX uq_storage_locations_code
    ON storage_locations (warehouse_id, lower(code)) WHERE deleted_at IS NULL;
CREATE INDEX idx_storage_locations_warehouse_id ON storage_locations (warehouse_id);

COMMENT ON TABLE storage_locations IS
    'BR-79: the storage locations of one warehouse. Scoped by warehouse_id (BR-30): a '
    'Sub Warehouse Admin never sees another warehouse''s rows. Deactivating sets '
    'is_active = false; rows are never deleted. Not linked to inventory_batches.storage_location '
    '(free text), see the header of 0053.';
COMMENT ON COLUMN storage_locations.capacity_kg IS
    'Optional capacity of this one location, in kg. Display-only: no stock movement is checked '
    'against it and it is not reconciled with warehouses.capacity_kg.';

-- +migrate Down

DROP TABLE IF EXISTS storage_locations;
