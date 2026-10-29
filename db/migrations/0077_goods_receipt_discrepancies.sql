-- =============================================================================
-- 0077_goods_receipt_discrepancies.sql
-- BR-121: persisted damage / mismatch reports on a goods receipt.
--
-- One row per report: what kind (type), what was expected, what actually arrived, a status and an
-- optional note, who reported it and when. Nothing here touches stock, the receipt, its quality
-- check or the purchase order (BR-106 unchanged).
--
--   1. warehouse_id is the receipt's warehouse, kept for warehouse-scoped reads and audit. It is
--      copied from the receipt by the inserting SQL and pinned to it by a composite foreign key on
--      (goods_receipt_id, warehouse_id), so a report can never sit in another warehouse than its
--      receipt. That needs UNIQUE (id, warehouse_id) on goods_receipts, which `id` alone already
--      implies, so it costs one index and rejects nothing that exists.
--
--   2. type and status are CHECK-constrained columns rather than reference tables, the same pattern
--      as quality_checks.rejection_reason_code (0076): the sets are part of the HTTP contract
--      (docs/openapi.yaml GoodsReceiptDiscrepancyType / GoodsReceiptDiscrepancyStatus) and of the Zod
--      schema. Both sets are UNCONFIRMED; status is OPEN only because no resolve step exists yet
--      (a specification gap, BR-121). Changing either is a new migration that replaces the CHECK.
--
--   3. expected / actual are bounded, non-blank text (the API trims before storing); note is
--      optional and bounded. The bounds are UNCONFIRMED.
--
--   4. No updated_at and no update path: rows are created OPEN and nothing changes them yet.
-- =============================================================================

-- +migrate Up

ALTER TABLE goods_receipts
    ADD CONSTRAINT uq_goods_receipts_id_warehouse UNIQUE (id, warehouse_id);

CREATE TABLE goods_receipt_discrepancies (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    goods_receipt_id  uuid        NOT NULL,
    warehouse_id      uuid        NOT NULL REFERENCES warehouses (id),
    type              text        NOT NULL,
    expected          text        NOT NULL,
    actual            text        NOT NULL,
    status            text        NOT NULL DEFAULT 'OPEN',
    note              text,
    created_by        uuid        NOT NULL REFERENCES users (id),
    created_at        timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT goods_receipt_discrepancies_receipt_fk
        FOREIGN KEY (goods_receipt_id, warehouse_id)
        REFERENCES goods_receipts (id, warehouse_id) ON DELETE RESTRICT,
    CONSTRAINT goods_receipt_discrepancies_type_chk
        CHECK (type IN ('QUANTITY', 'QUALITY', 'CROP_MISMATCH', 'DAMAGE', 'OTHER')),
    CONSTRAINT goods_receipt_discrepancies_status_chk
        CHECK (status IN ('OPEN')),
    CONSTRAINT goods_receipt_discrepancies_expected_chk
        CHECK (char_length(btrim(expected)) BETWEEN 1 AND 200),
    CONSTRAINT goods_receipt_discrepancies_actual_chk
        CHECK (char_length(btrim(actual)) BETWEEN 1 AND 200),
    CONSTRAINT goods_receipt_discrepancies_note_chk
        CHECK (note IS NULL OR char_length(btrim(note)) BETWEEN 1 AND 500)
);

-- The list read: one receipt's reports, newest first, keyset on (created_at, id).
CREATE INDEX idx_goods_receipt_discrepancies_receipt
    ON goods_receipt_discrepancies (goods_receipt_id, created_at DESC, id DESC);
CREATE INDEX idx_goods_receipt_discrepancies_warehouse
    ON goods_receipt_discrepancies (warehouse_id, created_at DESC);
CREATE INDEX idx_goods_receipt_discrepancies_created_by
    ON goods_receipt_discrepancies (created_by);

COMMENT ON TABLE goods_receipt_discrepancies IS
    'BR-121: damage / mismatch reports on a goods receipt. Created OPEN; no resolve path yet. '
    'Never changes stock, the receipt or its quality check.';
COMMENT ON COLUMN goods_receipt_discrepancies.warehouse_id IS
    'BR-121: the receipt''s warehouse, copied by the server and pinned by the composite foreign key.';

-- +migrate Down

DROP TABLE IF EXISTS goods_receipt_discrepancies;

ALTER TABLE goods_receipts DROP CONSTRAINT IF EXISTS uq_goods_receipts_id_warehouse;
