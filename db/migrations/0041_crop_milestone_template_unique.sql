-- =============================================================================
-- 0041_crop_milestone_template_unique.sql
-- BR-57: one universal template per stage_code.
-- UNIQUE (crop_master_id, stage_code) in 0036 does not de-duplicate universal
-- templates, because crop_master_id IS NULL and NULLs never compare equal. A
-- second seed run, or a hand-written insert, could therefore create two
-- 'STAGE_SOWING' templates, and auto-initialisation would hand the farmer both.
-- =============================================================================

-- +migrate Up
CREATE UNIQUE INDEX uq_crop_milestone_template_universal
    ON crop_milestone_templates (stage_code)
    WHERE crop_master_id IS NULL;

-- +migrate Down
DROP INDEX IF EXISTS uq_crop_milestone_template_universal;
