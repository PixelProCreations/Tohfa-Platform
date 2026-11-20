-- =============================================================================
-- 0110_wallet_transfer_txn_types.sql
-- BR-150: customer-to-customer wallet transfers post two ledger rows, one TRANSFER_OUT debit on the
-- sender and one TRANSFER_IN credit on the recipient, in one transaction.
--
-- Its own migration because a value added by ALTER TYPE ... ADD VALUE cannot be used until the
-- migrator's transaction commits (same reasoning as 0029). Nothing here uses the new values.
-- =============================================================================

-- +migrate Up
ALTER TYPE wallet_txn_type ADD VALUE IF NOT EXISTS 'TRANSFER_OUT';
ALTER TYPE wallet_txn_type ADD VALUE IF NOT EXISTS 'TRANSFER_IN';

-- +migrate Down
-- PostgreSQL cannot remove an enum value in place (as 0015 and 0029). TRANSFER_OUT / TRANSFER_IN
-- stay in wallet_txn_type after a rollback; ledger rows that use them are append-only and are
-- never deleted (BR-35), so there is nothing else to revert here.
SELECT 1;
