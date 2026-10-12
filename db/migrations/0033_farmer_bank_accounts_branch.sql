-- =============================================================================
-- 0033_farmer_bank_accounts_branch.sql
-- Add branch_name to farmer_bank_accounts for mobile profile/payment screens.
-- =============================================================================

-- +migrate Up
ALTER TABLE farmer_bank_accounts
    ADD COLUMN IF NOT EXISTS branch_name text;

COMMENT ON COLUMN farmer_bank_accounts.branch_name IS
    'Optional bank branch name (e.g. "Ooty Main Branch"), collected by the mobile UI.';

-- +migrate Down
ALTER TABLE farmer_bank_accounts
    DROP COLUMN IF EXISTS branch_name;
