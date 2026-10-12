-- =============================================================================
-- 0055_help_support_admin_notification_categories.sql
-- BR-82: Settings & Profile remainder (Module 16).
--
--  1. `help_articles`: admin-managed Help & Support content (FAQ entries).
--     Plain text only; NOTHING is seeded. An article is invisible to readers
--     until it is published.
--  2. `system_config` keys for the Help & Support contact channels. Seeded
--     with a JSON null on purpose: this migration must never invent a phone
--     number or an e-mail address. An administrator fills them in.
--  3. `notification_preferences.category` CHECK widened ADDITIVELY with the
--     admin notification categories shown on the admin Notification Settings
--     screen. The five original categories and the sparse "no row = enabled"
--     rule (0032) are untouched.
-- =============================================================================

-- +migrate Up

CREATE TABLE help_articles (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category     text        NOT NULL CHECK (char_length(category) BETWEEN 1 AND 60),
    locale       text        NOT NULL CHECK (locale IN ('en', 'ta')),
    title        text        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
    body         text        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
    sort_order   integer     NOT NULL DEFAULT 0 CHECK (sort_order BETWEEN 0 AND 100000),
    is_published boolean     NOT NULL DEFAULT false,
    created_by   uuid        REFERENCES users (id),
    updated_by   uuid        REFERENCES users (id),
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz
);

CREATE INDEX idx_help_articles_reader
    ON help_articles (locale, category, sort_order, id)
    WHERE is_published;
CREATE INDEX idx_help_articles_created_by ON help_articles (created_by);
CREATE INDEX idx_help_articles_updated_by ON help_articles (updated_by);

COMMENT ON TABLE help_articles IS
    'BR-82: admin-managed Help & Support FAQ content, plain text. Readers only ever see is_published rows. Nothing is seeded.';

SELECT app_attach_updated_at_triggers();

-- DO NOTHING, not DO UPDATE: re-running must never overwrite a value an admin
-- has since set. The JSON null means "not configured".
INSERT INTO system_config (key, value, data_type, description) VALUES
    ('help.contact.phone',
     'null'::jsonb, 'string',
     'BR-82: Help & Support helpline phone number shown to admins. JSON null = not configured (the API then returns phone: null). Set through PATCH /v1/admin/help/contact.'),
    ('help.contact.email',
     'null'::jsonb, 'string',
     'BR-82: Help & Support e-mail address shown to admins. JSON null = not configured (the API then returns email: null). Set through PATCH /v1/admin/help/contact.')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE notification_preferences DROP CONSTRAINT notification_preferences_category_check;
ALTER TABLE notification_preferences ADD CONSTRAINT notification_preferences_category_check CHECK (category IN (
    'WEATHER', 'FARM', 'MARKETING', 'PAYROLL', 'COMMUNITY',
    'IN_APP_MASTER',
    'GOODS_RECEIVING', 'INVENTORY_ALERTS', 'WAREHOUSE_OPERATIONS', 'TASK_ALERTS', 'EXCEPTION_ALERTS',
    'ORDER_CONFIRMED', 'ORDER_DISPATCHED', 'ORDER_DELIVERED',
    'WALLET_CREDITED', 'PAYOUT_RELEASED',
    'SYSTEM_MESSAGES', 'MAINTENANCE_MESSAGES', 'SECURITY_ALERTS'
));

-- +migrate Down

-- The admin categories cannot survive the narrower constraint.
DELETE FROM notification_preferences
 WHERE category NOT IN ('WEATHER', 'FARM', 'MARKETING', 'PAYROLL', 'COMMUNITY');
ALTER TABLE notification_preferences DROP CONSTRAINT notification_preferences_category_check;
ALTER TABLE notification_preferences ADD CONSTRAINT notification_preferences_category_check
    CHECK (category IN ('WEATHER', 'FARM', 'MARKETING', 'PAYROLL', 'COMMUNITY'));

DELETE FROM system_config WHERE key IN ('help.contact.phone', 'help.contact.email');

DROP TABLE IF EXISTS help_articles;
