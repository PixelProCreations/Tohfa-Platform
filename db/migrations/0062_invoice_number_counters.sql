-- =============================================================================
-- 0062_invoice_number_counters.sql
-- SWA Module 6; BR-87 (the invoice is issued inside the sale transaction).
--
-- invoicesRepo.generateInvoiceNumber (apps/api/src/modules/invoices/invoices.repo.ts) numbers an
-- invoice as count(*) + 1 over the fiscal year. Two concurrent transactions read the same count
-- and produce the same number; the second then dies on invoices.invoice_number UNIQUE. At a busy
-- counter that is a failed sale. This migration adds a row-locked counter instead.
--
-- Format (unchanged): TOH/<fiscal_year>/<series>/<seq>, seq zero-padded to at least 6 digits,
--   fiscal_year 'YYYY-YY' (calculateCurrentFiscalYear in invoices.service.ts, e.g. '2026-27'),
--   series by invoice_type: SALE_RETAIL=R, SALE_B2B=B, PURCHASE_FARMER=PF, PAYOUT=PO,
--   SUBSCRIPTION=SUB.
--
-- next_invoice_number(series, fiscal_year):
--   INSERT ... ON CONFLICT DO UPDATE takes a row lock on (fiscal_year, series) that is held until
--   the CALLER's transaction ends. A concurrent caller for the same series waits, then sees the
--   committed value; if the first caller rolls back, its increment rolls back too. So numbers are
--   unique and gap-free per (fiscal_year, series) as long as the call is made in the same
--   transaction as the invoices INSERT.
--
-- The counter is per series, whereas the old count(*) was per fiscal year across all series.
-- The series is part of the number, so per-series counters cannot collide with each other. The
-- counters are seeded below from the highest existing sequence per (fiscal_year, series), so the
-- first number issued is above every number already in invoices.
--
-- NOTE: the service code is NOT switched over in this migration. Until it is, the old count(*)+1
-- path keeps running and can still collide (with itself, and with counter-issued numbers).
-- =============================================================================

-- +migrate Up

CREATE TABLE invoice_number_counters (
    fiscal_year  text        NOT NULL CHECK (fiscal_year ~ '^[0-9]{4}-[0-9]{2}$'),
    series       text        NOT NULL CHECK (series IN ('R', 'B', 'PF', 'PO', 'SUB')),
    last_value   bigint      NOT NULL CHECK (last_value >= 0),
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz,
    CONSTRAINT invoice_number_counters_pkey PRIMARY KEY (fiscal_year, series)
);

COMMENT ON TABLE invoice_number_counters IS
    'Gap-free invoice sequence per (fiscal_year, series). Only next_invoice_number() writes it; '
    'never UPDATE it by hand (a lowered last_value re-issues an existing invoice number).';

-- Seed from what already exists so the first counter-issued number cannot collide.
INSERT INTO invoice_number_counters (fiscal_year, series, last_value)
SELECT m[1], m[2], max(m[3]::bigint)
FROM (
    SELECT regexp_match(invoice_number, '^TOH/([0-9]{4}-[0-9]{2})/(R|B|PF|PO|SUB)/([0-9]+)$') AS m
    FROM invoices
) parsed
WHERE m IS NOT NULL
GROUP BY m[1], m[2];

CREATE FUNCTION next_invoice_number(p_series text, p_fiscal_year text) RETURNS text
LANGUAGE sql VOLATILE AS $fn$
    INSERT INTO invoice_number_counters AS c (fiscal_year, series, last_value)
    VALUES (p_fiscal_year, p_series, 1)
    ON CONFLICT (fiscal_year, series)
        DO UPDATE SET last_value = c.last_value + 1
    RETURNING 'TOH/' || c.fiscal_year || '/' || c.series || '/'
              || lpad(c.last_value::text, greatest(6, length(c.last_value::text)), '0');
$fn$;

COMMENT ON FUNCTION next_invoice_number(text, text) IS
    'Returns the next invoice number TOH/<fiscal_year>/<series>/<seq> (seq padded to >= 6 digits). '
    'Call it in the SAME transaction as the invoices INSERT: the counter row stays locked until '
    'that transaction ends, and a rollback returns the number. Series: R, B, PF, PO, SUB.';

SELECT app_attach_updated_at_triggers();

-- +migrate Down

DROP FUNCTION IF EXISTS next_invoice_number(text, text);
DROP TABLE IF EXISTS invoice_number_counters;
