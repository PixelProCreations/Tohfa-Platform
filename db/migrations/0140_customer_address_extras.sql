-- =============================================================================
-- 0140_customer_address_extras.sql
-- BR-180: customer address landmark, contact phone, nearest pickup point; label
-- values HOME / OFFICE / OTHER (legacy WORK is migrated to OFFICE).
-- =============================================================================

-- +migrate Up

ALTER TABLE customer_addresses
    ADD COLUMN landmark                text CHECK (landmark IS NULL OR char_length(landmark) <= 200),
    ADD COLUMN contact_phone           text CHECK (contact_phone IS NULL OR contact_phone ~ '^\+?[0-9]{10,15}$'),
    ADD COLUMN nearest_pickup_point_id uuid REFERENCES warehouses (id);

UPDATE customer_addresses SET label = 'OFFICE' WHERE label = 'WORK';

-- +migrate Down

ALTER TABLE customer_addresses
    DROP COLUMN IF EXISTS nearest_pickup_point_id,
    DROP COLUMN IF EXISTS contact_phone,
    DROP COLUMN IF EXISTS landmark;
