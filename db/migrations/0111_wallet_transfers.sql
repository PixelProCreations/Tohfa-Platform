-- =============================================================================
-- 0111_wallet_transfers.sql
-- BR-150: customer-to-customer wallet transfers ("Send money"), behind a feature flag that is OFF.
--
-- wallet_transfers is the business record linking the two ledger rows (TRANSFER_OUT on the sender,
-- TRANSFER_IN on the recipient). It is APPEND-ONLY like the ledger: the row is inserted once, after
-- both ledger rows exist, in the same transaction. Balances still change ONLY through
-- wallet_transactions (trigger-maintained, 0007); nothing here touches wallets.balance.
--
-- system_config: the feature flag defaults to false. Sending money between customers is a new
-- product decision with AML/KYC implications and needs explicit client sign-off before enabling.
-- Limits are money strings (integer paise semantics); the service fails closed when malformed.
-- =============================================================================

-- +migrate Up

CREATE TABLE wallet_transfers (
    id                     uuid PRIMARY KEY,
    sender_customer_id     uuid          NOT NULL REFERENCES customers (id),
    recipient_customer_id  uuid          NOT NULL REFERENCES customers (id),
    sender_wallet_id       uuid          NOT NULL REFERENCES wallets (id),
    recipient_wallet_id    uuid          NOT NULL REFERENCES wallets (id),
    amount                 numeric(12,2) NOT NULL CHECK (amount > 0),
    note                   text          CHECK (note IS NULL OR char_length(note) BETWEEN 1 AND 140),
    debit_txn_id           uuid          NOT NULL UNIQUE REFERENCES wallet_transactions (id),
    credit_txn_id          uuid          NOT NULL UNIQUE REFERENCES wallet_transactions (id),
    created_by             uuid          REFERENCES users (id),
    created_at             timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT wallet_transfers_not_self_chk CHECK (sender_customer_id <> recipient_customer_id),
    CONSTRAINT wallet_transfers_distinct_wallets_chk CHECK (sender_wallet_id <> recipient_wallet_id)
);

CREATE INDEX idx_wallet_transfers_sender    ON wallet_transfers (sender_customer_id, created_at DESC, id DESC);
CREATE INDEX idx_wallet_transfers_recipient ON wallet_transfers (recipient_customer_id, created_at DESC, id DESC);

COMMENT ON TABLE wallet_transfers IS
    'BR-150: APPEND-ONLY record of a customer-to-customer wallet transfer. The money moved through two wallet_transactions rows (TRANSFER_OUT, TRANSFER_IN) referenced here; this row never changes a balance.';

SELECT app_make_append_only('wallet_transfers');

-- DO NOTHING, not DO UPDATE: re-running must never overwrite a value an admin has since changed.
INSERT INTO system_config (key, value, data_type, description) VALUES
    ('wallet_transfer.enabled',
     'false'::jsonb, 'boolean',
     'BR-150: feature flag for customer-to-customer wallet transfers. Default OFF: a new product decision with AML/KYC implications that needs client sign-off before it is turned on.'),
    ('wallet_transfer.min_amount',
     '"10.00"'::jsonb, 'string',
     'BR-150: smallest amount (INR money string) one transfer may move. Implementer default, product decision pending.'),
    ('wallet_transfer.max_per_txn',
     '"2000.00"'::jsonb, 'string',
     'BR-150: largest amount (INR money string) one transfer may move. Implementer default, product decision pending.'),
    ('wallet_transfer.max_daily',
     '"5000.00"'::jsonb, 'string',
     'BR-150: most a sender may transfer out per Asia/Kolkata calendar day, across all transfers. Implementer default, product decision pending.')
ON CONFLICT (key) DO NOTHING;

-- +migrate Down

DELETE FROM system_config
 WHERE key IN ('wallet_transfer.enabled', 'wallet_transfer.min_amount', 'wallet_transfer.max_per_txn', 'wallet_transfer.max_daily');
DROP TABLE IF EXISTS wallet_transfers;
