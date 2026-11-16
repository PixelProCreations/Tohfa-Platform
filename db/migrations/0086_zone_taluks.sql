-- =============================================================================
-- 0086_zone_taluks.sql
-- BR-143: Canonical mapping from Nilgiris district taluks to warehouse zones,
-- and zone_id on farmer_applications for auto-derivation on submission.
-- =============================================================================

-- +migrate Up
CREATE TABLE zone_taluks (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id    uuid NOT NULL REFERENCES zones (id) ON DELETE CASCADE,
    taluk      text NOT NULL,
    district   text NOT NULL DEFAULT 'The Nilgiris',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_zone_taluks_district_taluk ON zone_taluks (district, lower(taluk));
CREATE INDEX idx_zone_taluks_zone_id ON zone_taluks (zone_id);

ALTER TABLE farmer_applications
    ADD COLUMN zone_id uuid REFERENCES zones (id) ON DELETE SET NULL;

CREATE INDEX idx_farmer_applications_zone_id ON farmer_applications (zone_id);

COMMENT ON TABLE zone_taluks IS 'BR-143: Canonical taluk to zone mappings for Nilgiris warehouses.';
COMMENT ON COLUMN farmer_applications.zone_id IS 'BR-143: Auto-derived zone from taluk on submission or admin override.';

-- +migrate Down
DROP INDEX IF EXISTS idx_farmer_applications_zone_id;
ALTER TABLE farmer_applications DROP COLUMN IF EXISTS zone_id;
DROP TABLE IF EXISTS zone_taluks;
