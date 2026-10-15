-- =============================================================================
-- 0021_soil_management.sql
--
-- Soil diary for a plot (FR-F06): the farmer app's "Soil Management" screens
-- record lab test results, amendments applied, ad-hoc moisture/erosion
-- observations and a crop rotation plan, all scoped to a single plot (a farm
-- subdivision — see `plots` in 0003_farmers_and_farms.sql). Every table below
-- FKs to `plots.id`, never to the unrelated `zones` table (0003, line ~13),
-- which is an admin RBAC geography grouping with nothing to do with farm
-- subdivisions.
--
-- Authorization for all five tables is the single permission
-- `farmer.soil.manage_own` in docs/rbac.json, following the same
-- one-permission-covers-several-tables pattern `farmer.farm.manage_own`
-- already uses for farms + plots: a soil record is only ever reached through
-- a plot on a farm the actor owns, so there is no separate view/edit split
-- per table.
--
-- Option-list columns (lime_status, moisture level, erosion risk_level,
-- rotation status) are modelled as free `text`, NOT CHECK-constrained enums.
-- This repeats the philosophy 0020_farm_context_and_zones.sql documents for
-- plots.sun_exposure/irrigation_type: the mobile UI constrains which values
-- it sends, and a DB CHECK would only have to be kept in lockstep with that
-- mobile option list for no server-side benefit. The one thing that IS
-- server-enforced is the numeric-to-label *classification* built on top of
-- these raw readings (organic_carbon_pct, ph, ec_ds_per_m, ...) — see BR-40
-- in docs/rules.md, which requires that classification to come from
-- system_config via one shared function, never a client literal.
--
-- lab_report_upload_id references `uploads(id)` (0008_platform.sql) via the
-- new UploadPurpose.SOIL_TEST_REPORT value added alongside this migration.
-- =============================================================================

-- +migrate Up

-- -----------------------------------------------------------------------------
-- soil_test_records — lab test results for a plot, BR-40's raw inputs
-- -----------------------------------------------------------------------------
CREATE TABLE soil_test_records (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id              uuid        NOT NULL REFERENCES plots (id) ON DELETE CASCADE,
    test_date            date        NOT NULL,
    next_due_date        date        NOT NULL,
    organic_carbon_pct   numeric(5,2) NOT NULL,
    ph                   numeric(3,1) NOT NULL,
    ec_ds_per_m          numeric(5,2) NOT NULL,
    tds_ppm              integer,
    nitrogen_kg_per_ha   numeric(6,2),
    phosphorus_kg_per_ha numeric(6,2),
    potassium_kg_per_ha  numeric(6,2),
    lime_status          text,
    lab_report_upload_id uuid REFERENCES uploads (id),
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz
);

CREATE INDEX idx_soil_test_records_plot_id ON soil_test_records (plot_id);

COMMENT ON TABLE soil_test_records IS
    'Lab soil test results for a plot (FR-F06 soil diary). organic_carbon_pct, '
    'ph, ec_ds_per_m, tds_ppm, nitrogen/phosphorus/potassium_kg_per_ha are the '
    'raw readings BR-40 classifies into labels via system_config bands -- this '
    'table stores the numbers, never the label.';
COMMENT ON COLUMN soil_test_records.lime_status IS
    'Farmer/lab-selected value (Harmless/Slight/Moderate/Severe). Free text, '
    'mobile-constrained, same pattern as plots.sun_exposure (see 0020).';
COMMENT ON COLUMN soil_test_records.lab_report_upload_id IS
    'Optional scanned/PDF lab report, uploaded with '
    'UploadPurpose.SOIL_TEST_REPORT.';

-- -----------------------------------------------------------------------------
-- soil_amendments — inputs applied to a plot (compost, lime, etc.)
-- -----------------------------------------------------------------------------
CREATE TABLE soil_amendments (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id        uuid        NOT NULL REFERENCES plots (id) ON DELETE CASCADE,
    amendment_type text        NOT NULL,
    quantity_kg    numeric(8,2) NOT NULL,
    applied_date   date        NOT NULL,
    notes          text,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz
);

CREATE INDEX idx_soil_amendments_plot_id ON soil_amendments (plot_id);

COMMENT ON TABLE soil_amendments IS
    'Soil amendments (compost, lime, manure, ...) applied to a plot, logged by '
    'the farmer for the soil diary (FR-F06).';

-- -----------------------------------------------------------------------------
-- soil_moisture_observations — ad-hoc moisture readings for a plot
-- -----------------------------------------------------------------------------
CREATE TABLE soil_moisture_observations (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id      uuid        NOT NULL REFERENCES plots (id) ON DELETE CASCADE,
    level        text        NOT NULL,
    observed_at  timestamptz NOT NULL DEFAULT now(),
    observed_by  uuid        NOT NULL REFERENCES users (id),
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz
);

CREATE INDEX idx_soil_moisture_observations_plot_id ON soil_moisture_observations (plot_id);

COMMENT ON TABLE soil_moisture_observations IS
    'Ad-hoc soil moisture observations for a plot (FR-F06 soil diary).';
COMMENT ON COLUMN soil_moisture_observations.level IS
    'Farmer-selected value (Dry/Moist/Wet). Free text, mobile-constrained, '
    'same pattern as plots.sun_exposure (see 0020).';
COMMENT ON COLUMN soil_moisture_observations.observed_by IS
    'The user (farmer) who logged the observation -- distinct from plot '
    'ownership so a future farm-hand/co-owner role does not require a schema '
    'change here.';

-- -----------------------------------------------------------------------------
-- erosion_conservation_notes — erosion risk + conservation practice log
-- -----------------------------------------------------------------------------
CREATE TABLE erosion_conservation_notes (
    id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id        uuid        NOT NULL REFERENCES plots (id) ON DELETE CASCADE,
    risk_level     text        NOT NULL,
    practice_notes text,
    logged_at      timestamptz NOT NULL DEFAULT now(),
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz
);

CREATE INDEX idx_erosion_conservation_notes_plot_id ON erosion_conservation_notes (plot_id);

COMMENT ON TABLE erosion_conservation_notes IS
    'Erosion risk assessment and conservation practice notes for a plot '
    '(FR-F06 soil diary).';
COMMENT ON COLUMN erosion_conservation_notes.risk_level IS
    'Farmer-selected value (Low Risk/Moderate Risk/High Risk). Free text, '
    'mobile-constrained, same pattern as plots.sun_exposure (see 0020).';

-- -----------------------------------------------------------------------------
-- crop_rotation_entries — planned/current rotation sequence for a plot
-- -----------------------------------------------------------------------------
CREATE TABLE crop_rotation_entries (
    id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id        uuid        NOT NULL REFERENCES plots (id) ON DELETE CASCADE,
    sequence_order integer     NOT NULL,
    crop_name      text        NOT NULL,
    planned_date   date,
    status         text        NOT NULL,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz
);

CREATE INDEX idx_crop_rotation_entries_plot_id ON crop_rotation_entries (plot_id);

COMMENT ON TABLE crop_rotation_entries IS
    'Crop rotation plan for a plot: an ordered sequence of crops with a '
    'current/next/planned status (FR-F06 soil diary).';
COMMENT ON COLUMN crop_rotation_entries.status IS
    'Farmer-selected value (CURRENT/NEXT/PLANNED). Free text, mobile-'
    'constrained, same pattern as plots.sun_exposure (see 0020).';

SELECT app_attach_updated_at_triggers();

-- +migrate Down

DROP TABLE IF EXISTS crop_rotation_entries;
DROP TABLE IF EXISTS erosion_conservation_notes;
DROP TABLE IF EXISTS soil_moisture_observations;
DROP TABLE IF EXISTS soil_amendments;
DROP TABLE IF EXISTS soil_test_records;
