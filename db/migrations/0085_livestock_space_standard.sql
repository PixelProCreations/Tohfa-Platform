-- =============================================================================
-- 0085_livestock_space_standard.sql
-- BR-140: the minimum indoor space per animal that the livestock housing list compares each
-- housing record against (AnimalDetailScreen housing tab), kept in system_config rather than as
-- a literal in the service (CLAUDE.md section 2.7).
--
-- No DDL for calvingTime (also added with BR-140's change set): like inseminationTime and
-- checkupTime it is a display-only, variant-specific field, so it lives in
-- livestock_breeding_records.details as 0084 prescribes (only fields a rule or query needs are
-- promoted to columns). Its HH:MM format is enforced by the request schema.
-- =============================================================================

-- +migrate Up
-- DO NOTHING, not DO UPDATE: re-running must never overwrite a value an admin has since changed.
INSERT INTO system_config (key, value, data_type, description) VALUES
    ('livestock_min_indoor_space_sqft_per_animal',
     '11'::jsonb, 'number',
     'BR-140: minimum indoor space per animal, in square feet. GET /farmers/me/livestock/animals/{animalId}/housing-records returns it as spaceStandard.minIndoorSqFtPerAnimal and marks each record meetsIndoorSpaceStandard when its indoor space per animal, converted exactly to sq.ft (1 sq.m = 1/0.09290304 sq.ft, 1 acre = 43560 sq.ft), is at least this value. One value for every species: system_config has no per-species keys. Must be a JSON number > 0 with at most two decimal places: a missing or unusable value makes that GET answer 503 (no hard-coded fallback). 11 is DERIVED from the farmer app UI text "≥ 11 sq.ft NPOP minimum" (AnimalDetailScreen) and is UNCONFIRMED: product must confirm the value and whether it should vary by species. The livestock service reads this key -- it is NOT a literal in the schema or service.')
ON CONFLICT (key) DO NOTHING;

-- +migrate Down
DELETE FROM system_config WHERE key = 'livestock_min_indoor_space_sqft_per_animal';
