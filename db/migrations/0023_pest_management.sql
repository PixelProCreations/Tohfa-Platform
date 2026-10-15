-- =============================================================================
-- 0023_pest_management.sql
--
-- Pest management for a plot (FR-F07): the farmer app's "Pest Management"
-- screens (Pest Library, Log Pest Treatment, Pest Management/detections) get
-- a real backend. This is stage 1 of 3 for FR-F07 — this migration is DB
-- schema only, following the exact structural precedent of
-- 0021_soil_management.sql/0022_cover_crop_windows.sql (FR-F06's soil
-- diary): every plot-scoped table FKs to `plots.id`, never `zones`, and
-- authorization for all farmer-owned tables is a single permission,
-- `farmer.pest.manage_own` (docs/rbac.json) — a pest record is only ever
-- reached through a plot on a farm the actor owns, same
-- one-permission-covers-several-tables pattern `farmer.soil.manage_own`
-- already uses for the six soil diary tables.
--
-- BR-38 boundary (root CLAUDE.md, docs/rules.md "Open contradictions" row 19
-- — advisory automation for FR-F06/FR-F07 is blocked pending client
-- confirmation): every table below stores what a farmer explicitly entered,
-- or, for `pest_library`/`weather_risk_notes`, static admin-curated
-- reference content. Nothing here is a scheduled job, an auto-generated
-- reminder, an auto-computed risk alert, or an AI/rule-based "suggested
-- treatment" written by the system on a farmer's behalf. In particular:
--   * `pest_treatment_reminders` rows are only ever created by a farmer
--     explicitly logging one (from the mobile UI's "Log Pest Treatment" /
--     reminder screens) — no job scans detections and writes these.
--   * `weather_risk_notes` is admin-authored, region-scoped static content
--     (see PestLibraryScreen's weather banner mock), not a computed risk
--     model wired to a live weather feed.
--   * `pest_library.recommended_treatment`/`interval_days`/`phi_days` are
--     static admin-curated reference fields on the catalog entry itself
--     (seeded content, editable by an admin later), never a per-farmer,
--     per-detection generated suggestion.
--
-- `farm_crop_id` FKs to `farm_crops.id` (db/migrations/0004, nullable) so a
-- detection/treatment log can optionally be tied to the specific planting a
-- farmer is protecting, without requiring one — a farmer may log a pest
-- sighting for a plot before (or without) an associated `farm_crops` row.
--
-- `pest_library` carries a `UNIQUE (name)` constraint that the two source
-- tables in 0021 do not need on their option-list columns: unlike
-- `lime_status`/`level`/`risk_level` (free text, mobile-constrained, no
-- server-side identity), `pest_library` rows ARE a reference catalog with a
-- natural business key, and seeding it idempotently
-- (db/seed/006_pest_library_seed.sql) needs an `ON CONFLICT` target — the
-- same reason `roles.code`/`warehouses.code`/`crop_master.slug` are unique
-- in db/seed/001_reference.sql.
--
-- `photo_upload_id` on detections/treatment logs references `uploads(id)`
-- via the new UploadPurpose.PEST_PHOTO value added alongside this
-- migration (apps/api/src/modules/uploads/uploads.schema.ts,
-- docs/openapi.yaml SignUploadRequest.purpose) — the same pattern
-- `lab_report_upload_id` uses for UploadPurpose.SOIL_TEST_REPORT in 0021.
-- =============================================================================

-- +migrate Up

-- -----------------------------------------------------------------------------
-- pest_library — global reference catalog (NOT plot-scoped), admin-curated
-- -----------------------------------------------------------------------------
CREATE TABLE pest_library (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name                  text        NOT NULL,
    scientific_name       text,
    category              text        NOT NULL,
    risk_level            text        NOT NULL,
    crops                 text[],
    season                text,
    symptoms              text[],
    organic_treatments    text[],
    prevention            text[],
    recommended_treatment text,
    interval_days         integer,
    phi_days              integer,
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz,
    CONSTRAINT uq_pest_library_name UNIQUE (name)
);

COMMENT ON TABLE pest_library IS
    'Global pest/disease/weed/deficiency reference catalog (FR-F07). NOT '
    'plot-scoped -- every farmer reads the same catalog. Static admin-curated '
    'content: recommended_treatment/interval_days/phi_days describe the '
    'catalog entry itself, never a system-generated per-farmer suggestion '
    '(BR-38 boundary, see file header).';
COMMENT ON COLUMN pest_library.category IS
    'Disease/Pest/Weed/Deficiency. Free text, mobile-constrained, same '
    'pattern as plots.sun_exposure (see 0020) and soil_test_records.lime_status '
    '(see 0021) -- not CHECK-constrained so the option list can grow without a '
    'migration.';
COMMENT ON COLUMN pest_library.risk_level IS
    'High/Medium/Low. Free text, mobile-constrained, same pattern as '
    'erosion_conservation_notes.risk_level (see 0021).';

-- -----------------------------------------------------------------------------
-- pest_detections — a farmer-logged pest/disease sighting on a plot
-- -----------------------------------------------------------------------------
CREATE TABLE pest_detections (
    id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id              uuid        NOT NULL REFERENCES plots (id) ON DELETE CASCADE,
    farm_crop_id         uuid        REFERENCES farm_crops (id),
    pest_library_id      uuid        REFERENCES pest_library (id),
    pest_name            text        NOT NULL,
    scientific_name      text,
    severity             text        NOT NULL,
    status               text        NOT NULL DEFAULT 'Ongoing',
    detected_on          date        NOT NULL,
    notes                text,
    photo_upload_id      uuid        REFERENCES uploads (id),
    resolved_at          timestamptz,
    resolution_effective boolean,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz
);

CREATE INDEX idx_pest_detections_plot_id ON pest_detections (plot_id);

COMMENT ON TABLE pest_detections IS
    'A farmer-logged pest/disease sighting on a plot (FR-F07). pest_name and '
    'scientific_name are captured as free text at log time (not just a '
    'pest_library FK) so a farmer can record a sighting the catalog does not '
    'yet cover -- pest_library_id links back to the catalog entry when one '
    'was selected, but stays nullable. Farmer-entered observation only, '
    'never a system-detected/computed alert (BR-38 boundary, see file '
    'header).';
COMMENT ON COLUMN pest_detections.status IS
    'Farmer-selected value (Ongoing/Monitoring/Resolved). Free text, '
    'mobile-constrained, same pattern as crop_rotation_entries.status (see '
    '0021).';
COMMENT ON COLUMN pest_detections.resolution_effective IS
    'Farmer''s own after-the-fact assessment of whether the treatment worked, '
    'set when the farmer marks the detection resolved -- not a server-computed '
    'efficacy score.';

-- -----------------------------------------------------------------------------
-- pest_treatment_logs — a farmer-logged treatment application on a plot
-- -----------------------------------------------------------------------------
CREATE TABLE pest_treatment_logs (
    id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id              uuid        NOT NULL REFERENCES plots (id) ON DELETE CASCADE,
    farm_crop_id         uuid        REFERENCES farm_crops (id),
    detection_id         uuid        REFERENCES pest_detections (id) ON DELETE SET NULL,
    pest_library_id      uuid        REFERENCES pest_library (id),
    pest_name            text        NOT NULL,
    category             text        NOT NULL,
    severity             text        NOT NULL,
    treatment            text        NOT NULL,
    interval_days        integer,
    phi_days             integer,
    applied_on           date        NOT NULL,
    next_application_date date,
    photo_upload_id      uuid        REFERENCES uploads (id),
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz
);

CREATE INDEX idx_pest_treatment_logs_plot_id ON pest_treatment_logs (plot_id);
CREATE INDEX idx_pest_treatment_logs_detection_id ON pest_treatment_logs (detection_id);

COMMENT ON TABLE pest_treatment_logs IS
    'A farmer-logged treatment application (organic spray, biological '
    'control, ...) on a plot, optionally against a specific pest_detections '
    'row (FR-F07). detection_id is ON DELETE SET NULL, not CASCADE: the '
    'treatment history a farmer logged must survive a detection record being '
    'removed. interval_days/phi_days are copied from pest_library at log '
    'time (or entered by hand) so the row is a self-contained record of what '
    'the farmer actually applied, not a live join that changes retroactively '
    'if the catalog entry is later edited. Farmer-entered only -- never a '
    'system-applied treatment (BR-38 boundary, see file header).';
COMMENT ON COLUMN pest_treatment_logs.category IS
    'Disease/Pest/Weed/Deficiency, copied from the selected pest at log time. '
    'Free text, mobile-constrained, same pattern as pest_library.category.';

-- -----------------------------------------------------------------------------
-- pest_treatment_reminders — a farmer-created follow-up reminder for a plot
-- -----------------------------------------------------------------------------
CREATE TABLE pest_treatment_reminders (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id         uuid        NOT NULL REFERENCES plots (id) ON DELETE CASCADE,
    detection_id    uuid        REFERENCES pest_detections (id) ON DELETE SET NULL,
    title           text        NOT NULL,
    target_pest     text,
    due_date        date        NOT NULL,
    repeat_interval text        NOT NULL DEFAULT 'ONE_TIME',
    status          text        NOT NULL DEFAULT 'Upcoming',
    completed_at    timestamptz,
    notes           text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz
);

CREATE INDEX idx_pest_treatment_reminders_plot_id ON pest_treatment_reminders (plot_id);

COMMENT ON TABLE pest_treatment_reminders IS
    'A follow-up reminder a farmer explicitly creates for a plot (e.g. '
    '"re-check for aphids in 7 days"), optionally tied to the '
    'pest_detections row that prompted it (FR-F07). This is a farmer-entered '
    'to-do, not a scheduled job or an automatically generated notification --'
    ' no server process writes rows into this table. Creating this table at '
    'all sits squarely on the BR-38 boundary this feature is scoped to stay '
    'on the manual side of (see file header and docs/rules.md "Open '
    'contradictions" row 19): it stores a reminder the farmer typed, never '
    'one the system invented on their behalf.';
COMMENT ON COLUMN pest_treatment_reminders.repeat_interval IS
    'Farmer-selected value (ONE_TIME/WEEKLY/BIWEEKLY/MONTHLY). Free text, '
    'mobile-constrained, same pattern as pest_library.category.';
COMMENT ON COLUMN pest_treatment_reminders.status IS
    'Farmer-selected/farmer-completed value (Upcoming/Done/Overdue). Free '
    'text, mobile-constrained. "Overdue" is set by the farmer marking it so, '
    'not computed against due_date by a job -- no job in this feature is '
    'permitted to write to this table (BR-38).';

-- -----------------------------------------------------------------------------
-- weather_risk_notes — admin-authored, region-scoped static advisory content
-- -----------------------------------------------------------------------------
CREATE TABLE weather_risk_notes (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    region      text        NOT NULL,
    note        text        NOT NULL,
    risk_level  text,
    valid_from  date,
    valid_until date,
    created_by  uuid        REFERENCES users (id),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz
);

COMMENT ON TABLE weather_risk_notes IS
    'Admin-authored, region-scoped weather/risk advisory note (FR-F07 -- the '
    'Pest Library screen''s weather banner). NOT farmer-owned and NOT plot-'
    'scoped: an admin writes one note per region, and every farmer in that '
    'region reads the same row. This is static hand-typed content, not a '
    'computed risk model wired to a live weather feed or automatically '
    'regenerated -- an admin (not a job) sets note/risk_level/valid_from/'
    'valid_until by hand, same BR-38 boundary as the rest of this migration '
    '(see file header). created_by is nullable because seed-authored rows '
    'have no admin user to attribute.';
COMMENT ON COLUMN weather_risk_notes.risk_level IS
    'Optional High/Medium/Low classification the admin assigns to the note. '
    'Free text, mobile-constrained, same pattern as pest_library.risk_level.';

SELECT app_attach_updated_at_triggers();

-- +migrate Down

DROP TABLE IF EXISTS weather_risk_notes;
DROP TABLE IF EXISTS pest_treatment_reminders;
DROP TABLE IF EXISTS pest_treatment_logs;
DROP TABLE IF EXISTS pest_detections;
DROP TABLE IF EXISTS pest_library;
