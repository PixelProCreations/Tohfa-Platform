-- =============================================================================
-- 0020_farm_context_and_zones.sql
--
-- Adds the farm-diary "context" columns the Step 3 (land location) and zone
-- (plot) screens capture on mobile but that 0003_farmers_and_farms.sql never
-- modelled: per-location water sources and boundary-context flags, free-form
-- layout notes, and per-zone sun exposure. All four are nullable/defaulted so
-- the existing approval-time backfill in farmer-applications.service.ts (the
-- INSERT INTO farms around line 647) keeps working unchanged — it never
-- references these columns.
--
-- The option lists themselves ("Borewell", "Rainwater harvesting",
-- "stand_alone", "Full sun", ...) are NOT modelled as DB enums: the mobile UI
-- constrains which values it sends, the same pattern this codebase already
-- uses for ID_PROOF_SUB_TYPES. A CHECK/enum here would have to be kept in
-- lockstep with the mobile option list for no server-side benefit.
-- =============================================================================

-- +migrate Up

ALTER TABLE farms ADD COLUMN water_sources text[] NOT NULL DEFAULT '{}';
ALTER TABLE farms ADD COLUMN land_boundary_context text[] NOT NULL DEFAULT '{}';
ALTER TABLE farms ADD COLUMN notes text;

COMMENT ON COLUMN farms.water_sources IS
    'Farmer-selected water sources for this land location (e.g. Borewell, '
    'Rainwater harvesting). Free text, not a DB enum -- the mobile UI '
    'constrains the option list.';
COMMENT ON COLUMN farms.land_boundary_context IS
    'Farmer-selected boundary-context flags for this land location (e.g. '
    'stand_alone, forest_boundaries, chemical_sprayed). Free text, '
    'mobile-constrained, same pattern as water_sources above.';
COMMENT ON COLUMN farms.notes IS
    'Free-form farm-layout notes captured by the farmer for this location.';

ALTER TABLE plots ADD COLUMN sun_exposure text;

COMMENT ON COLUMN plots.sun_exposure IS
    'Farmer-selected sun exposure for this zone (e.g. Full sun, Partial, '
    'Shade). Free text, mobile-constrained, same pattern as '
    'farms.water_sources.';

-- +migrate Down

ALTER TABLE plots DROP COLUMN IF EXISTS sun_exposure;
ALTER TABLE farms DROP COLUMN IF EXISTS notes;
ALTER TABLE farms DROP COLUMN IF EXISTS land_boundary_context;
ALTER TABLE farms DROP COLUMN IF EXISTS water_sources;
