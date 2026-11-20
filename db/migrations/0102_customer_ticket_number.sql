-- =============================================================================
-- 0102_customer_ticket_number.sql
-- Customer-raised support tickets (support_tickets, 0008) need a TKT-YYYY-XXXXX number. The column
-- is UNIQUE NOT NULL with no default, so a sequence + helper function mint it in SQL, race-free.
-- Farmer help-desk tickets keep their own TKT-<n> sequence (0039); the two formats cannot collide.
-- =============================================================================

-- +migrate Up

CREATE SEQUENCE customer_ticket_seq START WITH 1;

CREATE OR REPLACE FUNCTION app_next_customer_ticket_number() RETURNS text
LANGUAGE sql AS $fn$
    SELECT 'TKT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('customer_ticket_seq')::text, 5, '0')
$fn$;

-- +migrate Down

DROP FUNCTION IF EXISTS app_next_customer_ticket_number();
DROP SEQUENCE IF EXISTS customer_ticket_seq;
