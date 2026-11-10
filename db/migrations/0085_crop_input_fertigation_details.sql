-- =============================================================================
-- 0085_crop_input_fertigation_details.sql
-- Crop inputs: a FERTIGATION input type (BR-56j) and the purpose / target pest /
-- applied-by details the farmer app already collects (BR-56k).
--
-- Numbered 0085, not 0084: 0084 is taken by a parallel branch (PR-4).
--
-- Rows logged as fertigation before this migration were stored as OTHER. They are
-- deliberately NOT rewritten: an OTHER row cannot be told apart from a genuine
-- "other" input with certainty, and rewriting would change history the farmer saw.
-- OTHER remains a valid type.
-- =============================================================================

-- +migrate Up
ALTER TABLE crop_inputs DROP CONSTRAINT IF EXISTS crop_inputs_input_type_check;
ALTER TABLE crop_inputs ADD CONSTRAINT crop_inputs_input_type_check
    CHECK (input_type IN ('FERTILIZER', 'MANURE', 'BIO_INPUT', 'PESTICIDE', 'FERTIGATION', 'OTHER'));

-- Free text (BR-56k): the app sends a stable option code or the farmer's own words.
-- applied_by is free text by owner default: no worker reference is required.
ALTER TABLE crop_inputs
    ADD COLUMN purpose     text CHECK (purpose IS NULL OR char_length(purpose) BETWEEN 1 AND 100),
    ADD COLUMN target_pest text CHECK (target_pest IS NULL OR char_length(target_pest) BETWEEN 1 AND 200),
    ADD COLUMN applied_by  text CHECK (applied_by IS NULL OR char_length(applied_by) BETWEEN 1 AND 200);

COMMENT ON COLUMN crop_inputs.purpose IS 'BR-56k: why the input was applied (free text; app sends a stable option code)';
COMMENT ON COLUMN crop_inputs.target_pest IS 'BR-56k: pest or disease targeted (free text; app sends a stable option code)';
COMMENT ON COLUMN crop_inputs.applied_by IS 'BR-56k: who applied it, free text (owner default; no worker FK)';

-- +migrate Down
ALTER TABLE crop_inputs
    DROP COLUMN IF EXISTS applied_by,
    DROP COLUMN IF EXISTS target_pest,
    DROP COLUMN IF EXISTS purpose;

-- FERTIGATION rows cannot survive the old CHECK; fold them back into OTHER, which
-- is what they were stored as before this migration.
UPDATE crop_inputs SET input_type = 'OTHER' WHERE input_type = 'FERTIGATION';
ALTER TABLE crop_inputs DROP CONSTRAINT IF EXISTS crop_inputs_input_type_check;
ALTER TABLE crop_inputs ADD CONSTRAINT crop_inputs_input_type_check
    CHECK (input_type IN ('FERTILIZER', 'MANURE', 'BIO_INPUT', 'PESTICIDE', 'OTHER'));
