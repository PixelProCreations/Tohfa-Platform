-- =============================================================================
-- 0071_stock_adjustment_decisions.sql
-- Completes the stock_adjustments (BR-37) and stock_verifications (BR-107) models of 0005,
-- which had tables but no endpoint until now.
--
--   * stock_adjustments: a REJECTED adjustment had nowhere to record who rejected it, when or
--     why (approved_by/approved_at are the APPROVER's pair and must not be reused for a
--     rejection). The rejecter, like the approver, is never the creator (BR-37a).
--   * A decided adjustment (APPROVED or REJECTED) is frozen: the ledger row an approval wrote is
--     evidence, so the row that points at it must not be edited afterwards.
--   * stock_verifications: one verification raises at most one adjustment.
-- No business threshold is introduced, so nothing is seeded into system_config.
-- =============================================================================

-- +migrate Up

ALTER TABLE stock_adjustments
    ADD COLUMN rejected_by      uuid        REFERENCES users (id),
    ADD COLUMN rejected_at      timestamptz,
    ADD COLUMN rejection_reason text        CHECK (rejection_reason IS NULL OR char_length(rejection_reason) BETWEEN 1 AND 500),
    ADD CONSTRAINT stock_adjustments_rejected_pair_chk
        CHECK ((rejected_by IS NULL) = (rejected_at IS NULL)),
    -- BR-37a, as for approval: the person who raised the adjustment does not decide it.
    ADD CONSTRAINT stock_adjustments_no_self_rejection_chk
        CHECK (rejected_by IS NULL OR rejected_by <> created_by),
    ADD CONSTRAINT stock_adjustments_rejected_only_when_rejected_chk
        CHECK (rejected_by IS NULL OR status = 'REJECTED'),
    ADD CONSTRAINT stock_adjustments_approved_only_when_approved_chk
        CHECK (approved_by IS NULL OR status = 'APPROVED'),
    -- BR-37b: an APPROVED adjustment always names the ledger row that moved the stock.
    ADD CONSTRAINT stock_adjustments_approved_has_ledger_chk
        CHECK (status <> 'APPROVED' OR (ledger_entry_id IS NOT NULL AND approved_by IS NOT NULL));

CREATE INDEX idx_stock_adjustments_rejected_by ON stock_adjustments (rejected_by);
CREATE INDEX idx_stock_adjustments_warehouse_created ON stock_adjustments (warehouse_id, created_at DESC, id DESC);

-- A decided adjustment is evidence: once APPROVED or REJECTED, no column may change.
CREATE OR REPLACE FUNCTION app_stock_adjustments_frozen_when_decided() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
    IF OLD.status <> 'PENDING' THEN
        RAISE EXCEPTION 'stock adjustment % is % and can no longer change', OLD.id, OLD.status
            USING ERRCODE = '23514', HINT = 'code: INVALID_STATE_TRANSITION';
    END IF;
    RETURN NEW;
END
$fn$;

CREATE TRIGGER trg_stock_adjustments_frozen_when_decided
    BEFORE UPDATE ON stock_adjustments
    FOR EACH ROW EXECUTE FUNCTION app_stock_adjustments_frozen_when_decided();

-- BR-107: one verification raises at most one adjustment, and one adjustment answers at most one
-- verification.
CREATE UNIQUE INDEX uq_stock_verifications_adjustment_id
    ON stock_verifications (adjustment_id) WHERE adjustment_id IS NOT NULL;
CREATE INDEX idx_stock_verifications_warehouse_verified
    ON stock_verifications (warehouse_id, verified_at DESC, id DESC);

COMMENT ON COLUMN stock_adjustments.rejected_by IS
    'BR-37a: who rejected a PENDING adjustment; never its creator (CHECK).';
COMMENT ON COLUMN stock_verifications.adjustment_id IS
    'BR-107: the COUNT_CORRECTION stock adjustment raised for this variance. The variance never '
    'edits the ledger itself; the adjustment does, once someone else approves it (BR-37).';

-- +migrate Down

DROP INDEX IF EXISTS idx_stock_verifications_warehouse_verified;
DROP INDEX IF EXISTS uq_stock_verifications_adjustment_id;
DROP TRIGGER IF EXISTS trg_stock_adjustments_frozen_when_decided ON stock_adjustments;
DROP FUNCTION IF EXISTS app_stock_adjustments_frozen_when_decided();
DROP INDEX IF EXISTS idx_stock_adjustments_warehouse_created;
DROP INDEX IF EXISTS idx_stock_adjustments_rejected_by;
ALTER TABLE stock_adjustments
    DROP CONSTRAINT IF EXISTS stock_adjustments_approved_has_ledger_chk,
    DROP CONSTRAINT IF EXISTS stock_adjustments_approved_only_when_approved_chk,
    DROP CONSTRAINT IF EXISTS stock_adjustments_rejected_only_when_rejected_chk,
    DROP CONSTRAINT IF EXISTS stock_adjustments_no_self_rejection_chk,
    DROP CONSTRAINT IF EXISTS stock_adjustments_rejected_pair_chk,
    DROP COLUMN IF EXISTS rejection_reason,
    DROP COLUMN IF EXISTS rejected_at,
    DROP COLUMN IF EXISTS rejected_by;
