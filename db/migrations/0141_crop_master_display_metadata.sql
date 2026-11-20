-- =============================================================================
-- 0141_crop_master_display_metadata.sql
-- BR-181: admin-managed, display-only product metadata on crop_master (the catalog product id IS
-- the crop id). Shown on GET /v1/catalog/products[/{id}]. Nothing here changes pricing, stock or
-- ordering: orders stay in kg, order discount stays 0, and none of it identifies a farm (BR-16).
-- shelf_life_days already exists (0004).
-- =============================================================================

-- +migrate Up

ALTER TABLE crop_master
    ADD COLUMN taste_notes      text CHECK (taste_notes IS NULL OR char_length(taste_notes) BETWEEN 1 AND 300),
    ADD COLUMN harvest_season   text CHECK (harvest_season IS NULL OR char_length(harvest_season) BETWEEN 1 AND 80),
    ADD COLUMN origin_region    text CHECK (origin_region IS NULL OR char_length(origin_region) BETWEEN 1 AND 80),
    ADD COLUMN farming_type     text CHECK (farming_type IS NULL OR farming_type IN ('ORGANIC', 'NATURAL', 'CONVENTIONAL')),
    ADD COLUMN pack_size        numeric(10,3) CHECK (pack_size IS NULL OR pack_size > 0),
    ADD COLUMN pack_unit        text CHECK (pack_unit IS NULL OR pack_unit IN ('KG', 'G', 'PIECE', 'BUNCH', 'DOZEN', 'PACK')),
    ADD COLUMN compare_at_price numeric(12,2) CHECK (compare_at_price IS NULL OR compare_at_price > 0),
    ADD COLUMN is_coming_soon   boolean NOT NULL DEFAULT false,
    ADD COLUMN coming_tomorrow  boolean NOT NULL DEFAULT false,
    ADD COLUMN is_unsalable     boolean NOT NULL DEFAULT false,
    ADD CONSTRAINT crop_master_pack_pair_chk CHECK ((pack_size IS NULL) = (pack_unit IS NULL));

COMMENT ON COLUMN crop_master.origin_region IS
    'BR-181/BR-16: generic region only (e.g. Nilgiris). Never a farm, farmer or village name.';
COMMENT ON COLUMN crop_master.compare_at_price IS
    'BR-181: MRP in rupees (same scale as retail price). Display only; the order discount stays 0.';

-- +migrate Down

ALTER TABLE crop_master
    DROP CONSTRAINT IF EXISTS crop_master_pack_pair_chk,
    DROP COLUMN IF EXISTS is_unsalable,
    DROP COLUMN IF EXISTS coming_tomorrow,
    DROP COLUMN IF EXISTS is_coming_soon,
    DROP COLUMN IF EXISTS compare_at_price,
    DROP COLUMN IF EXISTS pack_unit,
    DROP COLUMN IF EXISTS pack_size,
    DROP COLUMN IF EXISTS farming_type,
    DROP COLUMN IF EXISTS origin_region,
    DROP COLUMN IF EXISTS harvest_season,
    DROP COLUMN IF EXISTS taste_notes;
