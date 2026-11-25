-- =============================================================================
-- 0205_farm_records_admin_behalf.sql
-- D5 / D6: Track when an admin creates or records a farmer's farm record
-- (diary, crops, livestock, farm assets) on their behalf.
-- =============================================================================

-- +migrate Up
ALTER TABLE diary_entries
  ADD COLUMN IF NOT EXISTS created_by_admin_id uuid REFERENCES users(id);

ALTER TABLE farm_crops
  ADD COLUMN IF NOT EXISTS created_by_admin_id uuid REFERENCES users(id);

ALTER TABLE livestock_animals
  ADD COLUMN IF NOT EXISTS created_by_admin_id uuid REFERENCES users(id);

ALTER TABLE livestock_production_logs
  ADD COLUMN IF NOT EXISTS created_by_admin_id uuid REFERENCES users(id);

ALTER TABLE livestock_lifecycle_events
  ADD COLUMN IF NOT EXISTS created_by_admin_id uuid REFERENCES users(id);

ALTER TABLE farm_assets
  ADD COLUMN IF NOT EXISTS created_by_admin_id uuid REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_diary_entries_admin ON diary_entries(created_by_admin_id)
  WHERE created_by_admin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_farm_crops_admin ON farm_crops(created_by_admin_id)
  WHERE created_by_admin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_livestock_animals_admin ON livestock_animals(created_by_admin_id)
  WHERE created_by_admin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_farm_assets_admin ON farm_assets(created_by_admin_id)
  WHERE created_by_admin_id IS NOT NULL;

-- +migrate Down
DROP INDEX IF EXISTS idx_farm_assets_admin;
DROP INDEX IF EXISTS idx_livestock_animals_admin;
DROP INDEX IF EXISTS idx_farm_crops_admin;
DROP INDEX IF EXISTS idx_diary_entries_admin;

ALTER TABLE farm_assets DROP COLUMN IF EXISTS created_by_admin_id;
ALTER TABLE livestock_lifecycle_events DROP COLUMN IF EXISTS created_by_admin_id;
ALTER TABLE livestock_production_logs DROP COLUMN IF EXISTS created_by_admin_id;
ALTER TABLE livestock_animals DROP COLUMN IF EXISTS created_by_admin_id;
ALTER TABLE farm_crops DROP COLUMN IF EXISTS created_by_admin_id;
ALTER TABLE diary_entries DROP COLUMN IF EXISTS created_by_admin_id;
