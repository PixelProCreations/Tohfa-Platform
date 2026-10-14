-- =============================================================================
-- 0070_inventory_batch_on_qc_accept.sql
-- BR-106: an accepted goods receipt is stocked as exactly one inventory batch.
--
-- inventory_batches itself exists since 0005. This migration adds only what stocking a receipt
-- needs and 0005 does not have:
--
--   1. inventory_batch_number_seq: the `BATCH-<year>-<6 digits>` code counter, the same pattern as
--      purchase_order_number_seq (0011, PO-...) and goods_receipt_number_seq (0012, GRN-...). One
--      counter across years, never reset (inventory_batches.batch_code is UNIQUE). setval only
--      moves it FORWARD past any code of that shape that already exists, as 0065 does for orders.
--
--   2. quality_checks.expiry_on and quality_checks.storage_location: the QC request has always
--      accepted `expiryOn` and `storageLocation` (docs/openapi.yaml QualityCheckCreate) but nothing
--      stored them. When a quality counter-offer defers the batch until the farmer accepts it
--      (BR-106, owner decision 5), the batch is created in a LATER request, so the inspector's
--      values must be on the quality_checks row for that request to read. Both stay NULL when the
--      inspector gave none (owner decision 4: no shelf-life default is derived).
--
--   3. One batch per goods receipt, enforced by the database: the quality check and the farmer's
--      acceptance of a quality counter-offer are two separate requests that may both try to stock
--      the same receipt; the services check first, and this partial unique index is the backstop
--      that makes double-stocking impossible rather than unlikely. Batches not created from a
--      receipt (inter-warehouse transfer destinations, demo seed) have goods_receipt_id NULL and
--      are not constrained.
-- =============================================================================

-- +migrate Up

CREATE SEQUENCE IF NOT EXISTS inventory_batch_number_seq START WITH 1 INCREMENT BY 1;

ALTER SEQUENCE inventory_batch_number_seq OWNED BY inventory_batches.batch_code;

DO $$
DECLARE
    v_max_used bigint;
    v_seq_used bigint;
    v_target   bigint;
BEGIN
    SELECT max((regexp_match(batch_code, '^BATCH-[0-9]{4}-([0-9]+)$'))[1]::bigint)
      INTO v_max_used
      FROM inventory_batches;

    SELECT CASE WHEN is_called THEN last_value ELSE last_value - 1 END
      INTO v_seq_used
      FROM inventory_batch_number_seq;

    v_target := GREATEST(COALESCE(v_max_used, 0), COALESCE(v_seq_used, 0));
    IF v_target >= 1 THEN
        PERFORM setval('inventory_batch_number_seq', v_target, true);
    END IF;
END
$$;

COMMENT ON SEQUENCE inventory_batch_number_seq IS
    'BR-106: counter for BATCH-YYYY-NNNNNN inventory batch codes created from an accepted goods '
    'receipt. Created by 0070; never reset (inventory_batches.batch_code is UNIQUE across years).';

ALTER TABLE quality_checks
    ADD COLUMN expiry_on        date,
    ADD COLUMN storage_location text CHECK (storage_location IS NULL OR char_length(storage_location) <= 40);

COMMENT ON COLUMN quality_checks.expiry_on IS
    'BR-106: the inspector''s optional expiry for the accepted stock, copied to the batch. NULL when '
    'not given; no default is derived.';
COMMENT ON COLUMN quality_checks.storage_location IS
    'BR-106: the inspector''s optional storage location label, copied to the batch.';

CREATE UNIQUE INDEX uq_inventory_batches_goods_receipt_id
    ON inventory_batches (goods_receipt_id)
    WHERE goods_receipt_id IS NOT NULL;

COMMENT ON INDEX uq_inventory_batches_goods_receipt_id IS
    'BR-106: a goods receipt is stocked at most once, whichever request (quality check, or the '
    'farmer accepting a quality counter-offer) gets there first.';

-- +migrate Down

DROP INDEX IF EXISTS uq_inventory_batches_goods_receipt_id;

ALTER TABLE quality_checks
    DROP COLUMN IF EXISTS storage_location,
    DROP COLUMN IF EXISTS expiry_on;

-- Dropping the sequence loses its position; a later re-run of the Up section moves it forward
-- past the highest BATCH-YYYY-NNNNNN code again, so no number is reissued.
DROP SEQUENCE IF EXISTS inventory_batch_number_seq;
