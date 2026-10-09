-- =============================================================================
-- 0043_expense_finance.sql
-- Module 11 (Warehouse Finance), backend slice: expense recording and the finance reads.
--
--   * expense_categories: a fixed, read-only list for now (no category-write endpoint exists).
--     Seven names, taken from the design prototype.
--   * expenses: gains the category foreign key, the payment method and the client's
--     Idempotency-Key. `expenses.category` (text) is kept as the name captured at write time,
--     so legacy rows, which have no category_id, still read back.
--   * system_config: finance_report_max_range_days, the widest from/to span the finance report
--     endpoints accept.
--
-- The (warehouse_id, expense_date DESC) index the expense list needs already exists as
-- idx_expenses_warehouse_id (0007_money.sql), so none is added here.
-- =============================================================================

-- +migrate Up

CREATE TABLE expense_categories (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text        NOT NULL CHECK (btrim(name) <> ''),
    is_active   boolean     NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz
);

-- Case-insensitive uniqueness without the citext extension (this database does not install it).
CREATE UNIQUE INDEX uq_expense_categories_name ON expense_categories (lower(name));

COMMENT ON TABLE expense_categories IS
    'Warehouse expense categories (Module 11). Read-only through the API; an inactive category '
    'cannot be used for a new expense but keeps labelling the expenses already recorded against it.';

-- DO NOTHING, not DO UPDATE: re-running must never reactivate or rename a category an admin changed.
INSERT INTO expense_categories (name) VALUES
    ('Transport'),
    ('Loading'),
    ('Unloading'),
    ('Warehouse Operations'),
    ('Maintenance'),
    ('Utilities'),
    ('Other')
ON CONFLICT DO NOTHING;

ALTER TABLE expenses
    ADD COLUMN category_id     uuid REFERENCES expense_categories (id),
    ADD COLUMN payment_method  text CHECK (payment_method IN ('CASH', 'UPI', 'BANK')),
    ADD COLUMN idempotency_key text;

CREATE INDEX idx_expenses_category_id ON expenses (category_id);

-- A NULL key (every legacy row) never collides; a repeated key is a replay of the same POST.
CREATE UNIQUE INDEX uq_expenses_idempotency_key
    ON expenses (idempotency_key)
    WHERE idempotency_key IS NOT NULL;

COMMENT ON COLUMN expenses.category_id IS
    'Foreign key to expense_categories; NULL on rows recorded before 0043, which carry only the text `category`.';
COMMENT ON COLUMN expenses.payment_method IS
    'CASH, UPI or BANK. NULL on rows recorded before 0043.';
COMMENT ON COLUMN expenses.idempotency_key IS
    'The client Idempotency-Key of the POST that recorded the row (unique when present). Never write it from a job.';

SELECT app_attach_updated_at_triggers();

-- DO NOTHING, not DO UPDATE: re-running must never overwrite a value an admin has since changed.
INSERT INTO system_config (key, value, data_type, description) VALUES
    ('finance_report_max_range_days',
     '366'::jsonb, 'number',
     'The widest span, in days, between `to` and `from` that GET /v1/admin/finance/reports/revenue and /reports/expenses accept. With 366, a `to` exactly 366 days after `from` is accepted and 367 days is 422 VALIDATION_FAILED on query.to. The finance repo reads this key (fallback 366 when the row is missing or not a non-negative integer); it is NOT a literal in the schema or service.')
ON CONFLICT (key) DO NOTHING;

-- +migrate Down

DELETE FROM system_config WHERE key = 'finance_report_max_range_days';

DROP INDEX IF EXISTS uq_expenses_idempotency_key;
DROP INDEX IF EXISTS idx_expenses_category_id;

ALTER TABLE expenses
    DROP COLUMN IF EXISTS idempotency_key,
    DROP COLUMN IF EXISTS payment_method,
    DROP COLUMN IF EXISTS category_id;

DROP TABLE IF EXISTS expense_categories;
