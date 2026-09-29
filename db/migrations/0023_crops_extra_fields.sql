-- =============================================================================
-- 0023_crops_extra_fields.sql
--
-- The mobile app's "New Crop" screen (apps/mobile/src/roles/farmer/screens/
-- farm/NewCropScreen.tsx) already collects seed variety/company/quantity/cost
-- and an expected grade for a planting, but 0004_produce_pricing_marketing.sql
-- never gave farm_crops columns for them — real farm-record detail worth
-- keeping, not scope creep. All six columns are nullable, the same way
-- farm_crops.notes already is: optional detail layered on the required core
-- fields (plot_id, crop_id, status), not a second source of truth for
-- anything this table already tracks.
--
-- seed_cost_paise is integer paise, never numeric/decimal — root CLAUDE.md
-- §2.2, money is never a float — the same choice
-- 0022_farm_diary_workforce.sql made for diary_entry_workers.wage_rate_paise.
--
-- Also adds BR-46 (a plot cannot have two crops simultaneously in status
-- GROWING): a physical-reality constraint, enforced at the database level
-- with a partial unique index, the same pattern
-- 0004_produce_pricing_marketing.sql's uq_fair_prices_open_window uses for
-- BR-08's "at most one open ceiling window" rule. farm_crops already has
-- deleted_at (0004), so the index excludes soft-deleted rows the same way
-- every other live-row lookup on this table already does.
-- =============================================================================

-- +migrate Up

ALTER TABLE farm_crops ADD COLUMN seed_variety text;
ALTER TABLE farm_crops ADD COLUMN seed_company text;
ALTER TABLE farm_crops ADD COLUMN seed_quantity numeric(10,3) CHECK (seed_quantity IS NULL OR seed_quantity >= 0);
ALTER TABLE farm_crops ADD COLUMN seed_quantity_unit text CHECK (seed_quantity_unit IS NULL OR seed_quantity_unit IN ('grams', 'kg', 'packets', 'units'));
ALTER TABLE farm_crops ADD COLUMN seed_cost_paise integer CHECK (seed_cost_paise IS NULL OR seed_cost_paise >= 0);
ALTER TABLE farm_crops ADD COLUMN expected_grade text CHECK (expected_grade IS NULL OR expected_grade IN ('GRADE_A', 'GRADE_B', 'GRADE_C'));

COMMENT ON COLUMN farm_crops.seed_cost_paise IS
    'Integer paise, not rupees — root CLAUDE.md section 2.2, money is never '
    'a float. Deliberately an integer column, not numeric/decimal.';

-- -----------------------------------------------------------------------------
-- BR-46 — a plot cannot have two crops simultaneously in status GROWING
-- -----------------------------------------------------------------------------
CREATE UNIQUE INDEX uq_farm_crops_one_growing_per_plot
    ON farm_crops (plot_id) WHERE status = 'GROWING' AND deleted_at IS NULL;

COMMENT ON INDEX uq_farm_crops_one_growing_per_plot IS
    'BR-46: a plot is one physical patch of ground and cannot be growing two '
    'plantings at once. Enforced here, not only in application code, so a '
    'race between two concurrent create-crop requests on the same plot '
    'cannot both win.';

-- +migrate Down

DROP INDEX IF EXISTS uq_farm_crops_one_growing_per_plot;

ALTER TABLE farm_crops DROP COLUMN IF EXISTS expected_grade;
ALTER TABLE farm_crops DROP COLUMN IF EXISTS seed_cost_paise;
ALTER TABLE farm_crops DROP COLUMN IF EXISTS seed_quantity_unit;
ALTER TABLE farm_crops DROP COLUMN IF EXISTS seed_quantity;
ALTER TABLE farm_crops DROP COLUMN IF EXISTS seed_company;
ALTER TABLE farm_crops DROP COLUMN IF EXISTS seed_variety;
