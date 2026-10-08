-- =============================================================================
-- 0035_crop_inputs.sql
-- Crop input applications and NPK nutrient tracking per farm_crop (BR-56)
-- =============================================================================

-- +migrate Up
CREATE TABLE crop_inputs (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id           uuid NOT NULL REFERENCES farmers (id) ON DELETE CASCADE,
    farm_crop_id        uuid NOT NULL REFERENCES farm_crops (id) ON DELETE CASCADE,
    input_type          text NOT NULL CHECK (input_type IN ('FERTILIZER', 'MANURE', 'BIO_INPUT', 'PESTICIDE', 'OTHER')),
    input_name          text NOT NULL,
    applied_on          date NOT NULL,
    quantity            numeric(10,2) NOT NULL CHECK (quantity > 0),
    unit                text NOT NULL CHECK (unit IN ('KG', 'LITRE', 'GRAM', 'ML', 'BAG', 'TONNE', 'OTHER')),
    nitrogen_pct        numeric(5,2) CHECK (nitrogen_pct IS NULL OR (nitrogen_pct >= 0 AND nitrogen_pct <= 100)),
    phosphorus_pct      numeric(5,2) CHECK (phosphorus_pct IS NULL OR (phosphorus_pct >= 0 AND phosphorus_pct <= 100)),
    potassium_pct       numeric(5,2) CHECK (potassium_pct IS NULL OR (potassium_pct >= 0 AND potassium_pct <= 100)),
    application_method  text,
    cost_inr            numeric(10,2) CHECK (cost_inr IS NULL OR cost_inr >= 0),
    notes               text,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz,
    deleted_at          timestamptz
);

CREATE INDEX idx_crop_inputs_farmer_id ON crop_inputs (farmer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_crop_inputs_farm_crop_id ON crop_inputs (farm_crop_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_crop_inputs_applied_on ON crop_inputs (applied_on) WHERE deleted_at IS NULL;

COMMENT ON TABLE crop_inputs IS 'Crop input applications and nutrient tracking per farm_crop (BR-56)';

SELECT app_attach_updated_at_triggers();

-- +migrate Down
DROP TABLE IF EXISTS crop_inputs;
