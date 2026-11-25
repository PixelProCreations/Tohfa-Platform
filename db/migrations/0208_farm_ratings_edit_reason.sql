-- =============================================================================
-- 0208_farm_ratings_edit_reason.sql
-- D7: Persist manual rating edit reason directly on farm_ratings history rows.
-- =============================================================================

-- +migrate Up
ALTER TABLE farm_ratings
  ADD COLUMN IF NOT EXISTS edit_reason text;

-- +migrate Down
ALTER TABLE farm_ratings
  DROP COLUMN IF EXISTS edit_reason;
