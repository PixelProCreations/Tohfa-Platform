-- =============================================================================
-- 0040_calendar_range_config.sql
-- BR-58a: the widest from/to span GET /v1/farmers/me/calendar accepts is a
-- system_config value, not a literal in the schema (CLAUDE.md section 2.7).
-- =============================================================================

-- +migrate Up
-- DO NOTHING, not DO UPDATE: re-running must never overwrite a value an admin
-- has since changed.
INSERT INTO system_config (key, value, data_type, description) VALUES
    ('calendar_max_range_days',
     '366'::jsonb, 'number',
     'BR-58a: the widest span, in days, between `to` and `from` that GET /v1/farmers/me/calendar accepts. With 366, a `to` exactly 366 days after `from` is accepted and 367 days is 422 VALIDATION_FAILED on query.to. 366 is the one-year bound stated in BR-58a. calendar.service.ts reads this key through calendarRepo.getCalendarMaxRangeDays (fallback 366 when the row is missing or not a non-negative integer) -- it is NOT a literal in the schema or service.')
ON CONFLICT (key) DO NOTHING;

-- +migrate Down
DELETE FROM system_config WHERE key = 'calendar_max_range_days';
