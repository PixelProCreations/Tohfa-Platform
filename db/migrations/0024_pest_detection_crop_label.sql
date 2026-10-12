-- =============================================================================
-- 0024_pest_detection_crop_label.sql
--
-- Follow-up to 0023_pest_management.sql: the "Report New Detection" flow in
-- PestManagementScreen.tsx lets a farmer pick a crop from a "Crop/Zone"
-- dropdown (e.g. "Carrot — Nantes, Zone 1") when logging a sighting, and the
-- mock displayed that crop text back on the detection card and detail view.
-- 0023 had no column for it, so the crop text was dropped when this screen
-- was wired to the real backend. This adds it back, rather than editing a
-- migration that has already run (root CLAUDE.md §7) -- same reasoning
-- 0022_cover_crop_windows.sql documents for its own follow-up addition.
--
-- `crop_label` is nullable free text, same "mobile-constrained, no CHECK"
-- convention as `pest_detections.status`/`severity` in 0023: it is exactly
-- what the farmer typed/picked in the Crop/Zone dropdown, not a validated
-- reference to `farm_crops` (the existing nullable `farm_crop_id` column
-- already covers that stronger, structured relationship when a farmer picks
-- a real planting -- this column is the free-text label shown alongside it,
-- same distinction pest_library.category draws between free text and a real
-- FK). Nullable because every detection logged before this migration has no
-- value for it, and the mobile UI itself never required a crop selection to
-- report a sighting.
--
-- Also corrects two column comments 0023 got wrong: it documented
-- `pest_detections.status` as Ongoing/Monitoring/Resolved and
-- `pest_treatment_reminders.status` as Upcoming/Done/Overdue, but the actual
-- enums (docs/openapi.yaml, pest.schema.ts, and the mobile screens they were
-- built from -- PestManagementScreen.tsx's DetectionItem.status,
-- TreatmentScheduleScreen.tsx's TreatmentReminder.status) are
-- Ongoing/Resolved/Recurring and Upcoming/Completed. 0023 had already been
-- applied by the time this was caught, so per CLAUDE.md §7 the fix is a new
-- COMMENT ON COLUMN here rather than editing 0023's already-run content --
-- comments carry no CHECK constraint, so restating them is safe and has no
-- effect on stored data.
-- =============================================================================

-- +migrate Up

ALTER TABLE pest_detections ADD COLUMN crop_label text;

COMMENT ON COLUMN pest_detections.crop_label IS
    'Free-text crop label the farmer picked/typed in the "Crop/Zone" field '
    'when reporting the detection (e.g. "Carrot — Nantes"). Mobile-'
    'constrained, no CHECK, same pattern as pest_detections.status (see '
    '0023) -- not a validated farm_crops reference (farm_crop_id already '
    'covers that). Nullable: detections logged before this migration, and '
    'any future client that omits it, have no value here.';

COMMENT ON COLUMN pest_detections.status IS
    'Farmer-selected value (Ongoing/Resolved/Recurring), matching '
    'PestManagementScreen.tsx''s DetectionItem.status union -- corrects '
    '0023''s comment, which documented Ongoing/Monitoring/Resolved. Free '
    'text, mobile-constrained, same pattern as crop_rotation_entries.status '
    '(see 0021).';

COMMENT ON COLUMN pest_treatment_reminders.status IS
    'Farmer-selected/farmer-completed value (Upcoming/Completed), matching '
    'TreatmentScheduleScreen.tsx''s TreatmentReminder.status union -- '
    'corrects 0023''s comment, which documented Upcoming/Done/Overdue. Free '
    'text, mobile-constrained -- no job in this feature is permitted to '
    'write to this table (BR-38).';

-- +migrate Down

ALTER TABLE pest_detections DROP COLUMN crop_label;

COMMENT ON COLUMN pest_detections.status IS
    'Farmer-selected value (Ongoing/Monitoring/Resolved). Free text, '
    'mobile-constrained, same pattern as crop_rotation_entries.status (see '
    '0021).';

COMMENT ON COLUMN pest_treatment_reminders.status IS
    'Farmer-selected/farmer-completed value (Upcoming/Done/Overdue). Free '
    'text, mobile-constrained. "Overdue" is set by the farmer marking it so, '
    'not computed against due_date by a job -- no job in this feature is '
    'permitted to write to this table (BR-38).';
