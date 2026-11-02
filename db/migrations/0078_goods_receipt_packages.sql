-- =============================================================================
-- 0078_goods_receipt_packages.sql
-- BR-123: a goods receipt may record how many packages arrived and of what kind.
--
--   1. package_count / package_unit: optional, both or neither (goods_receipts_package_pair_chk).
--      Existing receipts read NULL / NULL and satisfy every constraint.
--   2. package_unit is a CHECK-constrained column rather than a reference table: the set is part of
--      the HTTP contract (docs/openapi.yaml GoodsReceiptPackageUnit) and of the Zod schema, the same
--      pattern as quality_checks.rejection_reason_code (0076). The set and the 1-100000 bound are
--      UNCONFIRMED (BR-123); changing them is a new migration that replaces the constraint.
--   3. Descriptive only: nothing here is a quantity. gross / accepted / rejected, batches and the
--      stock ledger are untouched (BR-106).
-- =============================================================================

-- +migrate Up

ALTER TABLE goods_receipts
    ADD COLUMN package_count integer
        CONSTRAINT goods_receipts_package_count_chk
        CHECK (package_count IS NULL OR package_count BETWEEN 1 AND 100000),
    ADD COLUMN package_unit  text
        CONSTRAINT goods_receipts_package_unit_chk
        CHECK (package_unit IS NULL OR package_unit IN ('CRATE', 'BAG', 'SACK', 'BOX', 'BUNDLE', 'TRAY', 'OTHER')),
    ADD CONSTRAINT goods_receipts_package_pair_chk
        CHECK ((package_count IS NULL) = (package_unit IS NULL));

COMMENT ON COLUMN goods_receipts.package_count IS
    'BR-123: how many packages arrived (UNCONFIRMED bound 1-100000); set exactly when package_unit is. Never a quantity.';
COMMENT ON COLUMN goods_receipts.package_unit IS
    'BR-123: the kind of package counted in package_count (UNCONFIRMED set).';

-- +migrate Down

ALTER TABLE goods_receipts
    DROP CONSTRAINT IF EXISTS goods_receipts_package_pair_chk,
    DROP COLUMN IF EXISTS package_unit,
    DROP COLUMN IF EXISTS package_count;
