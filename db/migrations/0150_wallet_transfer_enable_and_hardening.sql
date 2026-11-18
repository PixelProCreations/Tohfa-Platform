-- =============================================================================
-- 0150_wallet_transfer_enable_and_hardening.sql
-- BR-150: turn customer-to-customer wallet transfers ON (product-owner decision, 2026-11-17) and
-- seed the hardening limits that ship with it.
--
-- The flag stays in system_config so operations can switch the feature off again without a deploy.
-- Per-transfer limits from 0111 (min 10.00, max 2000.00, 5000.00 per day) are unchanged.
-- New keys (implementer defaults; KYC tier / AML policy is still open with the client, see BR-150):
--   wallet_transfer.max_per_month      money string, total sent per Asia/Kolkata calendar month
--   wallet_transfer.max_daily_count    number of transfers a sender may make per Asia/Kolkata day
--   wallet_transfer.lookup_per_hour    recipient lookups per customer per rolling hour
--   wallet_transfer.lookup_ip_per_hour recipient lookups per client IP per rolling hour
-- WALLET_DEBITED: in-app notification for the sender (the recipient already gets WALLET_CREDITED).
-- =============================================================================

-- +migrate Up

UPDATE system_config
   SET value = 'true'::jsonb,
       description = 'BR-150: feature flag for customer-to-customer wallet transfers. ON since 0150 (product-owner decision); set to false to switch the feature off without a deploy.',
       updated_at = now()
 WHERE key = 'wallet_transfer.enabled';

-- DO NOTHING, not DO UPDATE: re-running must never overwrite a value an admin has since changed.
INSERT INTO system_config (key, value, data_type, description) VALUES
    ('wallet_transfer.max_per_month',
     '"20000.00"'::jsonb, 'string',
     'BR-150: most a sender may transfer out per Asia/Kolkata calendar month, across all transfers. Implementer default, KYC/AML policy pending.'),
    ('wallet_transfer.max_daily_count',
     '10'::jsonb, 'number',
     'BR-150: most transfers a sender may make per Asia/Kolkata calendar day. Implementer default.'),
    ('wallet_transfer.lookup_per_hour',
     '10'::jsonb, 'number',
     'BR-150: recipient lookups allowed per customer per rolling hour (lookup reveals whether a mobile is a customer).'),
    ('wallet_transfer.lookup_ip_per_hour',
     '30'::jsonb, 'number',
     'BR-150: recipient lookups allowed per client IP per rolling hour.')
ON CONFLICT (key) DO NOTHING;

INSERT INTO notification_templates (code, channel, locale, subject, body_template, is_active) VALUES
    ('WALLET_DEBITED', 'IN_APP', 'en', 'Money sent',
     '₹{{amount}} sent from your wallet (Ref: {{reference}}). Current balance: ₹{{balance}}.', true),
    ('WALLET_DEBITED', 'IN_APP', 'ta', 'பணம் அனுப்பப்பட்டது',
     'உங்கள் வாலட்டிலிருந்து ₹{{amount}} அனுப்பப்பட்டது (குறிப்பு: {{reference}}). இருப்பு: ₹{{balance}}.', true)
ON CONFLICT (code, channel, locale) DO NOTHING;

-- +migrate Down

-- Templates already referenced by a sent notification are kept (FK); only unused ones go.
DELETE FROM notification_templates t
 WHERE t.code = 'WALLET_DEBITED'
   AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.template_id = t.id);
DELETE FROM system_config
 WHERE key IN ('wallet_transfer.max_per_month', 'wallet_transfer.max_daily_count',
               'wallet_transfer.lookup_per_hour', 'wallet_transfer.lookup_ip_per_hour');
UPDATE system_config
   SET value = 'false'::jsonb,
       description = 'BR-150: feature flag for customer-to-customer wallet transfers. Default OFF: a new product decision with AML/KYC implications that needs client sign-off before it is turned on.',
       updated_at = now()
 WHERE key = 'wallet_transfer.enabled';
