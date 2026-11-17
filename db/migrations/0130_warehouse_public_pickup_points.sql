-- =============================================================================
-- 0130_warehouse_public_pickup_points.sql
-- BR-170: public pickup points. Opening hours (operating_hours), lat/lng and contact_phone already
-- exist on warehouses; what is missing is an explicit "customer-visible" flag and a PUBLIC phone
-- (contact_phone is the internal staff contact and is never exposed to customers).
-- =============================================================================

-- +migrate Up
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS public_phone text
    CHECK (public_phone IS NULL OR public_phone ~ '^\+[1-9][0-9]{7,14}$');

-- The four BR-23 sites are customer pickup points.
UPDATE warehouses SET is_public = true
 WHERE code IN ('WH-OOTY', 'WH-COON', 'WH-KOTA', 'WH-GUDA');

COMMENT ON COLUMN warehouses.is_public IS 'BR-170: true = listed on the public GET /pickup-points.';
COMMENT ON COLUMN warehouses.public_phone IS 'BR-170: customer-facing phone (E.164). Distinct from contact_phone.';

-- +migrate Down
ALTER TABLE warehouses DROP COLUMN IF EXISTS public_phone;
ALTER TABLE warehouses DROP COLUMN IF EXISTS is_public;
