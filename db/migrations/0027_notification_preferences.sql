-- =============================================================================
-- 0027_notification_preferences.sql
-- BR-48: Per-user notification-category preferences (farmer app Settings,
-- screen 73 — Weather alerts, Farm reminders, Marketing updates, Payroll and
-- workforce, Community).
--
-- Sparse by design: NO row for a (user, category) means ENABLED. A row is only
-- written when a user actually flips a toggle, so the default all-on state
-- costs nothing and a category added later is on for everyone without a
-- backfill.
-- =============================================================================

-- +migrate Up
CREATE TABLE notification_preferences (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    category    text NOT NULL CHECK (category IN ('WEATHER', 'FARM', 'MARKETING', 'PAYROLL', 'COMMUNITY')),
    enabled     boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz,
    CONSTRAINT notification_preferences_unique UNIQUE (user_id, category)
);

CREATE INDEX idx_notification_preferences_user_id ON notification_preferences (user_id);

COMMENT ON TABLE notification_preferences IS
    'Sparse per-user notification category opt-outs (BR-48). Missing row = enabled.';

SELECT app_attach_updated_at_triggers();

-- +migrate Down
DROP TABLE IF EXISTS notification_preferences;
