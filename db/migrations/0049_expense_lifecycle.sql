-- =============================================================================
-- 0049_expense_lifecycle.sql
-- Module 11 (Warehouse Finance), BR-73: the expense decision lifecycle.
--
--   RECORDED --approve--> APPROVED     (someone OTHER than the recorder)
--   RECORDED --reject---> REJECTED     (someone OTHER than the recorder, with a reason)
--   RECORDED --cancel---> CANCELLED    (the recorder only)
--
-- UNCONFIRMED DEFAULT (owner approval pending): the design prototypes define no approval stage
-- for the warehouse roles, so this lifecycle is the smallest safe reading of the schema that
-- already exists (`status`, `approved_by`, `expenses_no_self_approval_chk`).
--
--   * status gains CANCELLED.
--   * decided_by / decided_at / decision_reason record WHO decided, WHEN and (for a rejection)
--     WHY, for all three decisions. approved_by / approved_at (0007) are also filled on an
--     approval so the pre-existing columns and CHECK keep meaning what they always meant.
--   * A guard trigger makes the money-bearing fields immutable after recording, and makes
--     APPROVED / REJECTED / CANCELLED rows immutable altogether. The guard fires on UPDATE only:
--     an INSERT of a non-RECORDED row (legacy data, fixtures) is not this trigger's business, and
--     no endpoint can create one.
--   * No hard delete is offered by the API; the table is deliberately NOT made append-only,
--     because RECORDED rows legitimately change state once.
-- =============================================================================

-- +migrate Up

ALTER TABLE expenses DROP CONSTRAINT expenses_status_check;
ALTER TABLE expenses
    ADD CONSTRAINT expenses_status_check
        CHECK (status IN ('RECORDED', 'APPROVED', 'REJECTED', 'CANCELLED'));

ALTER TABLE expenses
    ADD COLUMN decided_by      uuid REFERENCES users (id),
    ADD COLUMN decided_at      timestamptz,
    ADD COLUMN decision_reason text;

CREATE INDEX idx_expenses_decided_by ON expenses (decided_by);

-- Separation of duties for the new columns, same rule as expenses_no_self_approval_chk:
-- approving or rejecting your own expense is impossible, cancelling someone else's is too.
-- NOT VALID: rows that predate this migration are not re-checked (none can have decided_by).
ALTER TABLE expenses
    ADD CONSTRAINT expenses_decision_separation_chk
        CHECK (
            decided_by IS NULL
            OR (status IN ('APPROVED', 'REJECTED') AND decided_by <> recorded_by)
            OR (status = 'CANCELLED' AND decided_by = recorded_by)
        ) NOT VALID,
    ADD CONSTRAINT expenses_rejection_needs_reason_chk
        CHECK (decided_by IS NULL OR status <> 'REJECTED' OR btrim(coalesce(decision_reason, '')) <> '') NOT VALID;

COMMENT ON COLUMN expenses.decided_by IS
    'BR-73: the user who approved, rejected or cancelled the expense. Never the recorder for approve/reject; always the recorder for cancel.';
COMMENT ON COLUMN expenses.decided_at IS 'BR-73: when the decision was taken.';
COMMENT ON COLUMN expenses.decision_reason IS 'BR-73: the short reason given with a rejection. NULL for approve and cancel.';

CREATE OR REPLACE FUNCTION app_expense_immutable_guard() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
    -- The money-bearing and identifying fields never change after recording, in any status.
    IF NEW.amount          IS DISTINCT FROM OLD.amount
    OR NEW.expense_date    IS DISTINCT FROM OLD.expense_date
    OR NEW.warehouse_id    IS DISTINCT FROM OLD.warehouse_id
    OR NEW.category        IS DISTINCT FROM OLD.category
    OR NEW.category_id     IS DISTINCT FROM OLD.category_id
    OR NEW.payment_method  IS DISTINCT FROM OLD.payment_method
    OR NEW.recorded_by     IS DISTINCT FROM OLD.recorded_by
    OR NEW.idempotency_key IS DISTINCT FROM OLD.idempotency_key
    OR NEW.created_at      IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'expenses.% is immutable after recording (BR-73)', OLD.id
            USING ERRCODE = '23514';
    END IF;

    -- A decided expense is final: nothing about it changes again.
    IF OLD.status <> 'RECORDED' THEN
        RAISE EXCEPTION 'expense % is % and can no longer be changed (BR-73)', OLD.id, OLD.status
            USING ERRCODE = '23514';
    END IF;

    -- A RECORDED expense may only stay RECORDED or take one of the three decisions, and a decision
    -- must say who took it.
    IF NEW.status <> 'RECORDED' AND (NEW.decided_by IS NULL OR NEW.decided_at IS NULL) THEN
        RAISE EXCEPTION 'expense % cannot leave RECORDED without decided_by and decided_at (BR-73)', OLD.id
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END
$fn$;

CREATE TRIGGER trg_expenses_immutable_guard
    BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION app_expense_immutable_guard();

-- +migrate Down

DROP TRIGGER IF EXISTS trg_expenses_immutable_guard ON expenses;
DROP FUNCTION IF EXISTS app_expense_immutable_guard();

ALTER TABLE expenses
    DROP CONSTRAINT IF EXISTS expenses_rejection_needs_reason_chk,
    DROP CONSTRAINT IF EXISTS expenses_decision_separation_chk;
DROP INDEX IF EXISTS idx_expenses_decided_by;

-- CANCELLED has no place in the old CHECK. Lossy by necessity: a cancelled expense reads as
-- REJECTED after a rollback, and the decision columns below are dropped.
UPDATE expenses SET status = 'REJECTED' WHERE status = 'CANCELLED';

ALTER TABLE expenses
    DROP COLUMN IF EXISTS decision_reason,
    DROP COLUMN IF EXISTS decided_at,
    DROP COLUMN IF EXISTS decided_by;

ALTER TABLE expenses DROP CONSTRAINT expenses_status_check;
ALTER TABLE expenses
    ADD CONSTRAINT expenses_status_check CHECK (status IN ('RECORDED', 'APPROVED', 'REJECTED'));
