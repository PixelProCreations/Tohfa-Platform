-- =============================================================================
-- 0090_crop_taxonomy_fields.sql
-- P0-51: Crop taxonomy screen parity fields (BR-150):
-- 1. code: human-readable crop code (e.g. "CRP-001"), unique, server-generated
-- 2. grade_system: text (preset label metadata, e.g. "Standard Quality System")
-- 3. duration_days: text (e.g. "90 - 120 days")
-- 4. storage_temp: text (e.g. "10°C - 12°C, 85-90% RH")
-- 5. description: text
-- 6. deactivation_reason: text (set when is_active goes false)
-- 7. created_by: uuid FK to users(id) for admin list creator column
-- =============================================================================

-- +migrate Up

ALTER TABLE crop_master
    ADD COLUMN IF NOT EXISTS code text,
    ADD COLUMN IF NOT EXISTS grade_system text,
    ADD COLUMN IF NOT EXISTS duration_days text,
    ADD COLUMN IF NOT EXISTS storage_temp text,
    ADD COLUMN IF NOT EXISTS description text,
    ADD COLUMN IF NOT EXISTS deactivation_reason text,
    ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES users (id);

CREATE INDEX IF NOT EXISTS idx_crop_master_created_by ON crop_master (created_by);

-- Backfill code for any existing rows that have NULL code
WITH numbered AS (
    SELECT id,
           ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn
      FROM crop_master
     WHERE code IS NULL
)
UPDATE crop_master
   SET code = 'CRP-' || CASE WHEN numbered.rn < 1000 THEN lpad(numbered.rn::text, 3, '0') ELSE numbered.rn::text END
  FROM numbered
 WHERE crop_master.id = numbered.id;

ALTER TABLE crop_master
    ALTER COLUMN code SET NOT NULL,
    ADD CONSTRAINT crop_master_code_key UNIQUE (code);

CREATE SEQUENCE IF NOT EXISTS crop_code_seq;

SELECT setval(
    'crop_code_seq',
    GREATEST(
        COALESCE((SELECT MAX(substring(code FROM '^CRP-([0-9]+)$')::bigint) FROM crop_master), 0),
        1
    )
);

CREATE OR REPLACE FUNCTION trg_crop_master_code_default()
RETURNS TRIGGER AS $$
DECLARE
    v_seq bigint;
BEGIN
    IF NEW.code IS NULL THEN
        v_seq := nextval('crop_code_seq');
        NEW.code := 'CRP-' || CASE WHEN v_seq < 1000 THEN lpad(v_seq::text, 3, '0') ELSE v_seq::text END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_crop_master_code_default ON crop_master;
CREATE TRIGGER trg_crop_master_code_default
    BEFORE INSERT ON crop_master
    FOR EACH ROW
    EXECUTE FUNCTION trg_crop_master_code_default();

-- +migrate Down

DROP TRIGGER IF EXISTS trg_crop_master_code_default ON crop_master;
DROP FUNCTION IF EXISTS trg_crop_master_code_default();

ALTER TABLE crop_master
    DROP CONSTRAINT IF EXISTS crop_master_code_key,
    DROP COLUMN IF EXISTS code,
    DROP COLUMN IF EXISTS grade_system,
    DROP COLUMN IF EXISTS duration_days,
    DROP COLUMN IF EXISTS storage_temp,
    DROP COLUMN IF EXISTS description,
    DROP COLUMN IF EXISTS deactivation_reason,
    DROP COLUMN IF EXISTS created_by;

DROP SEQUENCE IF EXISTS crop_code_seq;
