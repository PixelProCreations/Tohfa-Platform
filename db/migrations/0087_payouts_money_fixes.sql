-- =============================================================================
-- 0087_payouts_money_fixes.sql
-- BR-31c / BR-144 / P0-10 / P0-11:
-- 1. Store requires_dual_approval on payouts at insert time from system_config
--    by dropping the GENERATED ALWAYS AS (amount > 10000.00) expression.
-- 2. Create payout_items table linking payouts to goods receipts.
-- =============================================================================

-- +migrate Up
ALTER TABLE payouts ALTER COLUMN requires_dual_approval DROP EXPRESSION;
ALTER TABLE payouts ALTER COLUMN requires_dual_approval SET DEFAULT false;

CREATE TABLE payout_items (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payout_id        uuid NOT NULL REFERENCES payouts (id) ON DELETE CASCADE,
    goods_receipt_id uuid NOT NULL REFERENCES goods_receipts (id) ON DELETE RESTRICT,
    amount           numeric(12,2) NOT NULL CHECK (amount > 0),
    created_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_payout_items_payout_gr UNIQUE (payout_id, goods_receipt_id)
);

CREATE INDEX idx_payout_items_payout_id ON payout_items (payout_id);
CREATE INDEX idx_payout_items_goods_receipt_id ON payout_items (goods_receipt_id);

COMMENT ON TABLE payout_items IS 'BR-144: Settlement linkage between payouts and goods receipts.';

-- +migrate Down
DROP TABLE IF EXISTS payout_items CASCADE;
ALTER TABLE payouts DROP CONSTRAINT IF EXISTS payouts_releaser_not_initiator_chk;
ALTER TABLE payouts DROP COLUMN IF EXISTS requires_dual_approval;
ALTER TABLE payouts ADD COLUMN requires_dual_approval boolean GENERATED ALWAYS AS (amount > 10000.00) STORED;
ALTER TABLE payouts ADD CONSTRAINT payouts_releaser_not_initiator_chk
    CHECK (released_by IS NULL OR requires_dual_approval = false OR released_by <> initiated_by);

