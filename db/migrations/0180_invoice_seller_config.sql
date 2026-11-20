-- BR-211: the invoice seller identity (TOHFA, never the farmer, BR-16b) is configuration, not code.
-- Defaults are EMPTY on purpose: the client must supply the real legal name, GSTIN, registered
-- address and GST state code (UPDATE system_config SET value = to_jsonb('...'::text) WHERE key = ...).
-- +migrate Up
INSERT INTO system_config (key, value, data_type, description) VALUES
    ('invoice_seller_legal_name', '""'::jsonb, 'string',
     'BR-211: TOHFA legal entity name printed as seller on invoices. EMPTY until the client supplies it.'),
    ('invoice_seller_gstin', '""'::jsonb, 'string',
     'BR-211: TOHFA GSTIN printed on invoices. EMPTY until the client supplies the real 15-character GSTIN.'),
    ('invoice_seller_address', '""'::jsonb, 'string',
     'BR-211: TOHFA registered address printed on invoices. EMPTY until the client supplies it.'),
    ('invoice_seller_state_code', '""'::jsonb, 'string',
     'BR-211: two-digit GST state code of the seller (e.g. 33 for Tamil Nadu). EMPTY until the client supplies it.')
ON CONFLICT (key) DO NOTHING;

-- +migrate Down
DELETE FROM system_config
 WHERE key IN ('invoice_seller_legal_name', 'invoice_seller_gstin', 'invoice_seller_address', 'invoice_seller_state_code');
