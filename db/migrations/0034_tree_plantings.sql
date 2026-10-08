-- =============================================================================
-- 0034_tree_plantings.sql
-- Tree and perennial plantings per farmer/farm/plot (BR-55)
-- =============================================================================

-- +migrate Up
CREATE TABLE tree_plantings (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id     uuid NOT NULL REFERENCES farmers (id) ON DELETE CASCADE,
    farm_id       uuid REFERENCES farms (id) ON DELETE SET NULL,
    plot_id       uuid REFERENCES plots (id) ON DELETE SET NULL,
    species_name  text NOT NULL,
    tree_count    integer NOT NULL CHECK (tree_count > 0),
    planted_on    date,
    zone_name     text,
    purpose       text,
    notes         text,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz,
    deleted_at    timestamptz
);

CREATE INDEX idx_tree_plantings_farmer_id ON tree_plantings (farmer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tree_plantings_farm_id ON tree_plantings (farm_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tree_plantings_plot_id ON tree_plantings (plot_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE tree_plantings IS 'Tree and perennial plantings per farmer/farm/plot (BR-55)';

SELECT app_attach_updated_at_triggers();

-- +migrate Down
DROP TABLE IF EXISTS tree_plantings;
