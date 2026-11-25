-- =============================================================================
-- 0203_payout_reject_enum.sql
-- D2: Add 'REJECTED' to payout_status enum so pending payouts can be rejected
-- and their linked payout_items / dues released cleanly.
-- Own migration file because ALTER TYPE ... ADD VALUE cannot be used in the
-- same transaction as DDL/DML referencing the new enum value.
-- =============================================================================

-- +migrate Up
ALTER TYPE payout_status ADD VALUE IF NOT EXISTS 'REJECTED';

-- +migrate Down
-- PostgreSQL cannot remove an enum value in place (same pattern as 0200).
-- 0204's Down resets any REJECTED rows back to PENDING_APPROVAL before this runs.
SELECT 1;
