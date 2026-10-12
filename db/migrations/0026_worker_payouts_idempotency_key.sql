-- =============================================================================
-- 0026_worker_payouts_idempotency_key.sql
--
-- Farm Workforce, stage 2 (API module). Closes a gap in 0025_workforce.sql:
-- docs/openapi.yaml `createMyWorkerPayout` requires an `Idempotency-Key`
-- header and promises (components/parameters/IdempotencyKeyHeader) that
-- "replaying the same key with an identical body returns the original
-- response; replaying it with a different body returns 409
-- IDEMPOTENCY_KEY_REUSED". Honouring that needs the key persisted next to
-- the row it created -- the same mechanism wallet_transactions.idempotency_key
-- (0007_money.sql) and the orders checkout path already use in this repo.
-- 0025 had no column to hold it, so the API could only have faked replay
-- semantics off the (worker, period) natural key, which cannot distinguish
-- "same request retried" from "a second, different payout for the period".
--
-- A new migration rather than an edit to 0025, per root CLAUDE.md §7: never
-- modify a migration that may already have run.
--
-- Nullable only so this applies cleanly to a dev database that already holds
-- worker_payouts rows from before this column existed; the API always sets
-- it (workforce.service.ts#createPayout). UNIQUE is table-wide, like
-- wallet_transactions.idempotency_key: keys are client-generated UUIDv4s.
-- =============================================================================

-- +migrate Up

ALTER TABLE worker_payouts ADD COLUMN idempotency_key text;

ALTER TABLE worker_payouts
    ADD CONSTRAINT uq_worker_payouts_idempotency_key UNIQUE (idempotency_key);

COMMENT ON COLUMN worker_payouts.idempotency_key IS
    'The Idempotency-Key header of the request that created this payout '
    '(docs/openapi.yaml createMyWorkerPayout). A replay with the same key '
    'and identical body returns this row; a different body is 409 '
    'IDEMPOTENCY_KEY_REUSED. Defense in depth alongside '
    'uq_worker_payouts_worker_period.';

-- +migrate Down

ALTER TABLE worker_payouts DROP CONSTRAINT IF EXISTS uq_worker_payouts_idempotency_key;
ALTER TABLE worker_payouts DROP COLUMN IF EXISTS idempotency_key;
