-- =============================================================================
-- 0037_platform_events.sql
-- Platform events and announcements for the Tohfa calendar (BR-58)
-- =============================================================================

-- +migrate Up
CREATE TABLE platform_events (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title            text NOT NULL,
    description      text,
    event_type       text NOT NULL CHECK (event_type IN ('WORKSHOP', 'TRAINING', 'COMMUNITY_MEET', 'MARKET_DAY', 'OTHER')),
    event_date       date NOT NULL,
    start_time       text,
    end_time         text,
    location_name    text,
    target_audience  text NOT NULL DEFAULT 'ALL' CHECK (target_audience IN ('ALL', 'FARMER', 'CUSTOMER')),
    is_published     boolean NOT NULL DEFAULT true,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz,
    deleted_at       timestamptz
);

CREATE INDEX idx_platform_events_date ON platform_events (event_date) WHERE deleted_at IS NULL AND is_published = true;
CREATE INDEX idx_platform_events_audience ON platform_events (target_audience) WHERE deleted_at IS NULL;

COMMENT ON TABLE platform_events IS 'Platform events, workshops and calendar notices (BR-58)';

SELECT app_attach_updated_at_triggers();

-- +migrate Down
DROP TABLE IF EXISTS platform_events;
