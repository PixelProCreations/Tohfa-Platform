-- =============================================================================
-- 0207_warehouses_market_control.sql
-- D13: Per-warehouse market open/close toggle + optional open/close times and
-- automated schedules (ScheduleMarketOpenCloseScreen). Default is_market_open=true
-- so existing checkout tests remain non-breaking until toggled closed.
-- =============================================================================

-- +migrate Up
ALTER TABLE warehouses
  ADD COLUMN IF NOT EXISTS is_market_open           boolean     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS market_open_time         text,
  ADD COLUMN IF NOT EXISTS market_close_time        text,
  ADD COLUMN IF NOT EXISTS market_status_reason     text,
  ADD COLUMN IF NOT EXISTS market_status_updated_by uuid        REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS market_status_updated_at timestamptz;

CREATE TABLE IF NOT EXISTS market_open_close_schedules (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id  uuid        NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  mode          text        NOT NULL CHECK (mode IN ('OPEN', 'CLOSE')),
  schedule_date date        NOT NULL,
  schedule_time text        NOT NULL CHECK (schedule_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  repeat_rule   text        NOT NULL DEFAULT 'ONE_TIME'
    CHECK (repeat_rule IN ('ONE_TIME', 'DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM')),
  is_active     boolean     NOT NULL DEFAULT true,
  notes         text,
  created_by    uuid        REFERENCES users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

CREATE INDEX IF NOT EXISTS idx_market_open_close_wh
  ON market_open_close_schedules (warehouse_id, schedule_date) WHERE deleted_at IS NULL;

-- +migrate Down
DROP TABLE IF EXISTS market_open_close_schedules;

ALTER TABLE warehouses
  DROP COLUMN IF EXISTS market_status_updated_at,
  DROP COLUMN IF EXISTS market_status_updated_by,
  DROP COLUMN IF EXISTS market_status_reason,
  DROP COLUMN IF EXISTS market_close_time,
  DROP COLUMN IF EXISTS market_open_time,
  DROP COLUMN IF EXISTS is_market_open;
