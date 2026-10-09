-- 0045_listing_idempotency.sql
-- Idempotency-Key store for the farmer-facing listing writes (BR-61): create a
-- listing, withdraw it, and accept / reject / counter an admin counter-offer.
--
-- WHY A TABLE AND NOT A COLUMN (the 0007 wallet_transactions / 0026 worker_payouts
-- pattern): those endpoints create exactly one new row, so the key can live on it.
-- Withdraw, accept and reject create no row of their own, so there is nothing to
-- carry the key, and a replay has to return the ORIGINAL response, which a state
-- transition no longer reproduces (a second withdraw is LISTING_NOT_PENDING). One
-- table keyed by (actor, key) serves all five.
--
-- The claim is inserted in the SAME transaction as the business write (INSERT ...
-- ON CONFLICT, never check-then-insert), so a request that fails rolls the claim
-- back with it and the key stays usable, and two concurrent requests with one key
-- serialise on the primary key: the second waits for the first to commit and then
-- replays its stored response.
--
-- Keys are scoped to the acting user: one farmer's key can never collide with, or
-- reveal, another's. docs/openapi.yaml (IdempotencyKeyHeader) says keys are
-- retained 24 hours; a claim older than that is taken over by the next request.
-- No sweep job is part of this migration, so rows older than 24h are inert but not
-- deleted.

-- +migrate Up

CREATE TABLE idempotency_keys (
    -- No FK to users: this is a scoping value, and a claim for a user that does not
    -- exist must fail on the business check that follows, not as a 500 here.
    actor_user_id    uuid        NOT NULL,
    idempotency_key  text        NOT NULL CHECK (length(idempotency_key) BETWEEN 1 AND 255),
    -- What the key was first used for, e.g. 'listing.create'. A key reused for another
    -- operation is IDEMPOTENCY_KEY_REUSED, same as a key reused with another body.
    operation        text        NOT NULL,
    -- sha256 over the operation, the target ids and the parsed request body.
    request_hash     text        NOT NULL,
    -- The JSON body that was returned. NULL only inside the claiming transaction.
    response_body    jsonb,
    created_at       timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (actor_user_id, idempotency_key)
);

CREATE INDEX idx_idempotency_keys_created_at ON idempotency_keys (created_at);

COMMENT ON TABLE idempotency_keys IS
    'Idempotency-Key claims and the response they returned (BR-61). Written in the same transaction as the operation it guards; scoped per user; retained 24 hours.';

-- +migrate Down

DROP TABLE idempotency_keys;
