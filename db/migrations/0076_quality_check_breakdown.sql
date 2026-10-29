-- =============================================================================
-- 0076_quality_check_breakdown.sql
-- BR-120: a quality check breaks its rejected quantity into damaged and spoiled, grades each
-- point's condition, records a crop mismatch and a structured rejection reason.
--
-- Nothing here touches stock. The batch a check creates (BR-106) is still `accepted_qty_kg` only;
-- these columns describe the part that was NOT accepted, and the delivered crop, and are read back
-- on the receipt (BR-119).
--
--   1. damaged_qty_kg / spoiled_qty_kg: a breakdown OF rejected_qty_kg, never in addition to it.
--      quality_checks_breakdown_chk keeps their sum within rejected_qty_kg, so with
--      goods_receipts_qty_balance_chk (accepted + rejected <= gross) accepted + damaged + spoiled can
--      never exceed what was received. Existing rows read 0 / 0 and satisfy the CHECK.
--
--   2. rejection_reason_code: a CHECK-constrained column rather than a reference table. The set is
--      part of the HTTP contract (docs/openapi.yaml QcRejectionReasonCode) and of the Zod schema, so
--      a table could not change it without a deploy anyway; this is the same pattern as
--      quality_check_items.parameter (0005). The set is UNCONFIRMED (BR-120); changing it is a new
--      migration that replaces the constraint.
--
--   3. actual_crop_id / crop_mismatch_qty_kg: the crop actually delivered when it is not the purchase
--      order's crop, and the quantity affected. Stored only (BR-120, UNCONFIRMED): the batch keeps the
--      purchase order's crop. Both or neither (quality_checks_crop_mismatch_chk).
--
--   4. quality_check_items.condition: a graded level next to the existing pass/fail (UNCONFIRMED set).
-- =============================================================================

-- +migrate Up

ALTER TABLE quality_checks
    ADD COLUMN damaged_qty_kg        numeric(12,3) NOT NULL DEFAULT 0 CHECK (damaged_qty_kg >= 0),
    ADD COLUMN spoiled_qty_kg        numeric(12,3) NOT NULL DEFAULT 0 CHECK (spoiled_qty_kg >= 0),
    ADD COLUMN rejection_reason_code text
        CONSTRAINT quality_checks_rejection_reason_code_chk
        CHECK (rejection_reason_code IS NULL OR rejection_reason_code IN (
            'BELOW_GRADE', 'PHYSICAL_DAMAGE', 'SPOILAGE', 'PEST_OR_DISEASE',
            'MOISTURE_OUT_OF_RANGE', 'FOREIGN_MATTER', 'WRONG_CROP', 'OTHER')),
    ADD COLUMN actual_crop_id        uuid REFERENCES crop_master (id),
    ADD COLUMN crop_mismatch_qty_kg  numeric(12,3) CHECK (crop_mismatch_qty_kg IS NULL OR crop_mismatch_qty_kg > 0),
    ADD CONSTRAINT quality_checks_breakdown_chk
        CHECK (damaged_qty_kg + spoiled_qty_kg <= rejected_qty_kg),
    ADD CONSTRAINT quality_checks_crop_mismatch_chk
        CHECK ((actual_crop_id IS NULL) = (crop_mismatch_qty_kg IS NULL));

CREATE INDEX idx_quality_checks_actual_crop_id ON quality_checks (actual_crop_id) WHERE actual_crop_id IS NOT NULL;

COMMENT ON COLUMN quality_checks.damaged_qty_kg IS
    'BR-120: the part of rejected_qty_kg that was physically damaged. Never stocked.';
COMMENT ON COLUMN quality_checks.spoiled_qty_kg IS
    'BR-120: the part of rejected_qty_kg that was spoiled. Never stocked.';
COMMENT ON COLUMN quality_checks.rejection_reason_code IS
    'BR-120: structured reason for the rejected quantity (UNCONFIRMED set); the free-text note stays '
    'on goods_receipts.rejection_reason.';
COMMENT ON COLUMN quality_checks.actual_crop_id IS
    'BR-120: the crop actually delivered when it is not the purchase order''s crop. Stored only: the '
    'batch keeps the purchase order''s crop.';
COMMENT ON COLUMN quality_checks.crop_mismatch_qty_kg IS
    'BR-120: the quantity of the mismatched crop; set exactly when actual_crop_id is.';

ALTER TABLE quality_check_items
    ADD COLUMN condition text
        CONSTRAINT quality_check_items_condition_chk
        CHECK (condition IS NULL OR condition IN ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'UNACCEPTABLE'));

COMMENT ON COLUMN quality_check_items.condition IS
    'BR-120: graded condition of the point, best to worst (UNCONFIRMED set); passed stays the pass/fail.';

-- +migrate Down

ALTER TABLE quality_check_items DROP COLUMN IF EXISTS condition;

DROP INDEX IF EXISTS idx_quality_checks_actual_crop_id;

ALTER TABLE quality_checks
    DROP CONSTRAINT IF EXISTS quality_checks_crop_mismatch_chk,
    DROP CONSTRAINT IF EXISTS quality_checks_breakdown_chk,
    DROP COLUMN IF EXISTS crop_mismatch_qty_kg,
    DROP COLUMN IF EXISTS actual_crop_id,
    DROP COLUMN IF EXISTS rejection_reason_code,
    DROP COLUMN IF EXISTS spoiled_qty_kg,
    DROP COLUMN IF EXISTS damaged_qty_kg;
