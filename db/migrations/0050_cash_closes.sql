-- =============================================================================
-- 0050_cash_closes.sql
-- Module 11 (Warehouse Finance), BR-74: the daily cash close and reconciliation.
--
-- One row = one warehouse's day, closed. The design's Daily Cash Summary screen has the admin
-- count the physical cash and submit "Cash Reconciliation": expected cash, actual physical cash,
-- the difference and a reason. This table stores exactly that, together with the system figures
-- the expected cash was computed from, so the row stays explainable after the underlying orders,
-- top-ups and expenses move on.
--
--   expected_closing = opening_cash + cash_sales + cash_top_ups - cash_expenses
--   difference       = counted_cash - expected_closing        (negative = cash is short)
--
-- The day is an Asia/Kolkata calendar day. The system figures are computed by the API at close
-- time from existing data (nothing here is typed in by the admin except counted_cash and note).
--
-- APPEND-ONLY (app_make_append_only, like the stock and wallet ledgers): a close is evidence of
-- a count. UNIQUE (warehouse_id, close_date) means a second close of the same day is refused.
-- UNCONFIRMED: how a mistaken close is corrected is not defined by the design; until the owner
-- decides, the row cannot be changed or replaced.
--
-- No tolerance or maximum difference is stored or enforced: the design shows none.
-- =============================================================================

-- +migrate Up

CREATE TABLE cash_closes (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id    uuid          NOT NULL REFERENCES warehouses (id),
    close_date      date          NOT NULL,
    opening_cash    numeric(12,2) NOT NULL,
    -- The date of the earlier close whose counted cash became opening_cash; NULL = no earlier close, opening 0.
    opening_from    date,
    cash_sales      numeric(12,2) NOT NULL CHECK (cash_sales >= 0),
    cash_top_ups    numeric(12,2) NOT NULL CHECK (cash_top_ups >= 0),
    cash_expenses   numeric(12,2) NOT NULL CHECK (cash_expenses >= 0),
    expected_closing numeric(12,2) NOT NULL,
    counted_cash    numeric(12,2) NOT NULL CHECK (counted_cash >= 0),
    difference      numeric(12,2) NOT NULL,
    note            text,
    closed_by       uuid          NOT NULL REFERENCES users (id),
    created_at      timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT uq_cash_closes_warehouse_date UNIQUE (warehouse_id, close_date),
    CONSTRAINT cash_closes_expected_chk
        CHECK (expected_closing = opening_cash + cash_sales + cash_top_ups - cash_expenses),
    CONSTRAINT cash_closes_difference_chk
        CHECK (difference = counted_cash - expected_closing),
    CONSTRAINT cash_closes_opening_from_chk
        CHECK (opening_from IS NULL OR opening_from < close_date),
    CONSTRAINT cash_closes_note_not_blank_chk
        CHECK (note IS NULL OR btrim(note) <> '')
);

CREATE INDEX idx_cash_closes_closed_by ON cash_closes (closed_by);
-- The list is newest-first per warehouse; the unique index above already serves lookups by (warehouse, date).
CREATE INDEX idx_cash_closes_date ON cash_closes (close_date DESC, created_at DESC, id DESC);

COMMENT ON TABLE cash_closes IS
    'APPEND-ONLY (BR-74): one closed day of one warehouse: the system figures, the counted cash, '
    'the difference, a note and who closed it. A close is never updated or deleted.';
COMMENT ON COLUMN cash_closes.opening_cash IS
    'The counted_cash of the latest earlier close of the same warehouse, 0 when there is none (BR-74).';
COMMENT ON COLUMN cash_closes.difference IS 'counted_cash - expected_closing. Negative means the cash is short. Not judged against any tolerance.';

SELECT app_make_append_only('cash_closes');

-- +migrate Down

DROP TABLE IF EXISTS cash_closes;
