-- Migration 0094: Customer creation fields and code sequence (BR-160)

-- +migrate Up

CREATE SEQUENCE IF NOT EXISTS customer_code_seq;

ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS business_type text NULL;

-- +migrate Down

ALTER TABLE customers
    DROP COLUMN IF EXISTS business_type;

DROP SEQUENCE IF EXISTS customer_code_seq;
