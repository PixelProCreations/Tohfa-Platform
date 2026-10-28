-- =============================================================================
-- 0080_transfer_receipt_details.sql
-- BR-126: what the destination records when it receives an inter-warehouse transfer (BR-102).
--
--   1. stock_transfers.receipt_number: the transfer goods receipt number `TGR-<year>-<6 digits>`,
--      from stock_transfer_receipt_number_seq, the GRN-/BATCH- pattern (0012, 0070): one counter
--      across years, never reset, UNIQUE. Set in the same statement that marks the transfer
--      RECEIVED; a RECEIVED transfer always has one and no other status does
--      (stock_transfers_receipt_number_chk). Transfers already RECEIVED are numbered here, in
--      received_at order, with the Asia/Kolkata year of their receipt.
--
--   2. stock_transfer_items, per received line (all optional in the request, all NULL until the line
--      is received):
--        damaged_qty / spoiled_qty   parts of the SHORTFALL (qty_sent - qty_received): goods that
--                                    arrived damaged or spoiled and were therefore not received into
--                                    stock. stock_transfer_items_breakdown_chk keeps
--                                    damaged + spoiled <= qty_sent - qty_received (and both 0 before
--                                    the line is received), so the quantity credited to the
--                                    destination (qty_received, one TRANSFER_IN row) is exactly what
--                                    it was before this migration. The BR-120 guard. NOT NULL
--                                    DEFAULT 0, so every existing line, and a receipt written without
--                                    them, satisfies it; the API reads them as null until received.
--        condition                   the BR-120 level set (EXCELLENT ... UNACCEPTABLE).
--        actual_grade / actual_crop_id
--                                    what the destination judged it to be. STORED ONLY: the
--                                    destination batch keeps the source batch's crop and grade
--                                    (UNCONFIRMED, BR-126).
--        storage_location_id / storage_location
--                                    where the line was put; copied to the destination batch (BR-125).
--
-- Nothing here writes stock_ledger or a balance column (CLAUDE.md 2.3).
-- =============================================================================

-- +migrate Up

CREATE SEQUENCE IF NOT EXISTS stock_transfer_receipt_number_seq START WITH 1 INCREMENT BY 1;

ALTER TABLE stock_transfers
    ADD COLUMN receipt_number text;

ALTER SEQUENCE stock_transfer_receipt_number_seq OWNED BY stock_transfers.receipt_number;

-- Number the transfers that are already received, oldest receipt first (row_number, not nextval in
-- an UPDATE, so the order is guaranteed), then move the counter past the last number issued.
WITH ordered AS (
    SELECT id, row_number() OVER (ORDER BY received_at NULLS FIRST, id) AS rn
      FROM stock_transfers
     WHERE status = 'RECEIVED' AND receipt_number IS NULL
)
UPDATE stock_transfers t
   SET receipt_number = 'TGR-' || to_char(COALESCE(t.received_at, t.created_at) AT TIME ZONE 'Asia/Kolkata', 'YYYY')
                        || '-' || lpad(o.rn::text, 6, '0')
  FROM ordered o
 WHERE t.id = o.id;

DO $$
DECLARE
    v_max_used bigint;
BEGIN
    SELECT max((regexp_match(receipt_number, '^TGR-[0-9]{4}-([0-9]+)$'))[1]::bigint)
      INTO v_max_used
      FROM stock_transfers;
    IF v_max_used IS NOT NULL AND v_max_used >= 1 THEN
        PERFORM setval('stock_transfer_receipt_number_seq', v_max_used, true);
    END IF;
END
$$;

ALTER TABLE stock_transfers
    ADD CONSTRAINT uq_stock_transfers_receipt_number UNIQUE (receipt_number),
    ADD CONSTRAINT stock_transfers_receipt_number_chk
        CHECK ((status = 'RECEIVED') = (receipt_number IS NOT NULL));

COMMENT ON COLUMN stock_transfers.receipt_number IS
    'BR-126: transfer goods receipt number TGR-<year>-<6 digits> (stock_transfer_receipt_number_seq), set '
    'when the destination receives the transfer; NULL before.';
COMMENT ON SEQUENCE stock_transfer_receipt_number_seq IS
    'BR-126: counter for TGR- transfer goods receipt numbers. Created by 0080; never reset.';

ALTER TABLE stock_transfer_items
    ADD COLUMN damaged_qty         numeric(12,3) NOT NULL DEFAULT 0 CHECK (damaged_qty >= 0),
    ADD COLUMN spoiled_qty         numeric(12,3) NOT NULL DEFAULT 0 CHECK (spoiled_qty >= 0),
    ADD COLUMN condition           text
        CONSTRAINT stock_transfer_items_condition_chk
        CHECK (condition IS NULL OR condition IN ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'UNACCEPTABLE')),
    ADD COLUMN actual_grade        produce_grade,
    ADD COLUMN actual_crop_id      uuid REFERENCES crop_master (id),
    ADD COLUMN storage_location_id uuid REFERENCES storage_locations (id),
    ADD COLUMN storage_location    text
        CHECK (storage_location IS NULL OR (btrim(storage_location) <> '' AND char_length(storage_location) <= 40));

ALTER TABLE stock_transfer_items
    ADD CONSTRAINT stock_transfer_items_breakdown_chk
        CHECK (CASE WHEN qty_received IS NULL THEN damaged_qty = 0 AND spoiled_qty = 0
                    ELSE damaged_qty + spoiled_qty <= qty_sent - qty_received END),
    ADD CONSTRAINT stock_transfer_items_receive_details_chk
        CHECK (qty_received IS NOT NULL
               OR (condition IS NULL AND actual_grade IS NULL AND actual_crop_id IS NULL
                   AND storage_location_id IS NULL AND storage_location IS NULL));

CREATE INDEX idx_stock_transfer_items_storage_location_id
    ON stock_transfer_items (storage_location_id) WHERE storage_location_id IS NOT NULL;

COMMENT ON COLUMN stock_transfer_items.damaged_qty IS
    'BR-126: part of the shortfall (qty_sent - qty_received) that arrived damaged; never stocked.';
COMMENT ON COLUMN stock_transfer_items.spoiled_qty IS
    'BR-126: part of the shortfall (qty_sent - qty_received) that arrived spoiled; never stocked.';
COMMENT ON COLUMN stock_transfer_items.actual_crop_id IS
    'BR-126: the product (crop_master row) the destination says arrived. Stored only: the destination '
    'batch keeps the source batch''s crop (UNCONFIRMED).';
COMMENT ON COLUMN stock_transfer_items.actual_grade IS
    'BR-126: the grade the destination judged the line to be. Stored only: the destination batch keeps '
    'the source batch''s grade (UNCONFIRMED).';

-- +migrate Down

DROP INDEX IF EXISTS idx_stock_transfer_items_storage_location_id;
ALTER TABLE stock_transfer_items
    DROP CONSTRAINT IF EXISTS stock_transfer_items_receive_details_chk,
    DROP CONSTRAINT IF EXISTS stock_transfer_items_breakdown_chk,
    DROP COLUMN IF EXISTS storage_location,
    DROP COLUMN IF EXISTS storage_location_id,
    DROP COLUMN IF EXISTS actual_crop_id,
    DROP COLUMN IF EXISTS actual_grade,
    DROP COLUMN IF EXISTS condition,
    DROP COLUMN IF EXISTS spoiled_qty,
    DROP COLUMN IF EXISTS damaged_qty;

ALTER TABLE stock_transfers
    DROP CONSTRAINT IF EXISTS stock_transfers_receipt_number_chk,
    DROP CONSTRAINT IF EXISTS uq_stock_transfers_receipt_number;

-- Dropping the column drops the sequence it owns; a re-run of the Up section renumbers the
-- received transfers from 1 in received_at order, which reproduces the same numbers.
ALTER TABLE stock_transfers
    DROP COLUMN IF EXISTS receipt_number;
DROP SEQUENCE IF EXISTS stock_transfer_receipt_number_seq;
