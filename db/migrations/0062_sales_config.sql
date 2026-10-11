-- =============================================================================
-- 0062_sales_config.sql
-- SWA Modules 6 and 7, owner decision D7; BR-98.
-- Two business values the sales and customer screens need, kept in system_config rather than as
-- literals in a service (CLAUDE.md section 2.7).
-- =============================================================================

-- +migrate Up
-- DO NOTHING, not DO UPDATE: re-running must never overwrite a value an admin has since changed.
INSERT INTO system_config (key, value, data_type, description) VALUES
    ('retail_gst_rate_percent',
     '0'::jsonb, 'number',
     'BR-98: the GST rate, in percent, applied to a DIRECT/MARKET retail sale. Owner-approved default 0 (D7). Sale totals are computed in integer paise; this rate is never applied as a float. The sales service reads this key -- it is NOT a literal in the schema or service.'),
    ('active_customer_window_days',
     '90'::jsonb, 'number',
     'BR-98: the look-back window, in days, used to count a customer as active on the customers list summary. Owner-approved default 90 (D7). The customers service reads this key -- it is NOT a literal in the schema or service.')
ON CONFLICT (key) DO NOTHING;

-- +migrate Down
DELETE FROM system_config WHERE key IN ('retail_gst_rate_percent', 'active_customer_window_days');
