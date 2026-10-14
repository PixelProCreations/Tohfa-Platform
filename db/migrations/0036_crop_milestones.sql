-- =============================================================================
-- 0036_crop_milestones.sql
-- Crop growth stages and milestone tracking per farm_crop (BR-57)
-- =============================================================================

-- +migrate Up
CREATE TABLE crop_milestone_templates (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_master_id              uuid REFERENCES crop_master (id) ON DELETE CASCADE,
    stage_code                  text NOT NULL,
    stage_name                  text NOT NULL,
    description                 text,
    sequence_order              integer NOT NULL DEFAULT 1,
    expected_days_after_planting integer CHECK (expected_days_after_planting IS NULL OR expected_days_after_planting >= 0),
    created_at                  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_crop_milestone_template UNIQUE (crop_master_id, stage_code)
);

CREATE INDEX idx_crop_milestone_templates_crop_id ON crop_milestone_templates (crop_master_id);

CREATE TABLE farm_crop_milestones (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id       uuid NOT NULL REFERENCES farmers (id) ON DELETE CASCADE,
    farm_crop_id    uuid NOT NULL REFERENCES farm_crops (id) ON DELETE CASCADE,
    template_id     uuid REFERENCES crop_milestone_templates (id) ON DELETE SET NULL,
    stage_code      text NOT NULL,
    stage_name      text NOT NULL,
    sequence_order  integer NOT NULL DEFAULT 1,
    status          text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'SKIPPED')),
    target_date     date,
    completed_on    date,
    notes           text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz,
    deleted_at      timestamptz,
    CONSTRAINT uq_farm_crop_milestone_stage UNIQUE (farm_crop_id, stage_code)
);

CREATE INDEX idx_farm_crop_milestones_farmer_id ON farm_crop_milestones (farmer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_farm_crop_milestones_farm_crop_id ON farm_crop_milestones (farm_crop_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE crop_milestone_templates IS 'Reference templates for crop growth stages (BR-57)';
COMMENT ON TABLE farm_crop_milestones IS 'Farmer-tracked crop growth milestones per farm_crop (BR-57)';

SELECT app_attach_updated_at_triggers();

-- Seed standard universal milestone templates (crop_master_id IS NULL)
INSERT INTO crop_milestone_templates (crop_master_id, stage_code, stage_name, description, sequence_order, expected_days_after_planting)
VALUES
    (NULL, 'STAGE_SOWING', 'Sowing & Germination', 'Seed sowing and initial sprout emergence', 1, 7),
    (NULL, 'STAGE_VEGETATIVE', 'Vegetative Growth', 'Stem, branch and foliage leaf development', 2, 30),
    (NULL, 'STAGE_FLOWERING', 'Flowering & Budding', 'Appearance and opening of floral buds', 3, 50),
    (NULL, 'STAGE_FRUITING', 'Fruit & Pod Development', 'Fruit setting and enlargement', 4, 75),
    (NULL, 'STAGE_MATURITY', 'Maturity & Ripening', 'Crop reaches full size, color and maturity', 5, 90),
    (NULL, 'STAGE_HARVEST', 'Harvest Ready', 'Optimal harvest window and produce picking', 6, 105)
ON CONFLICT DO NOTHING;

-- +migrate Down
DROP TABLE IF EXISTS farm_crop_milestones;
DROP TABLE IF EXISTS crop_milestone_templates;
