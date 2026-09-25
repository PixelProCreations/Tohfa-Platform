-- =============================================================================
-- 0021_farm_diary_workforce.sql
--
-- Replaces diary_entries.labor_count (a bare headcount added in 0020) with a
-- proper per-worker labour/wage record, diary_entry_workers. A single
-- smallint could say "3 workers" but not who, for how long, at what rate, or
-- whether they were paid — which is what the farm diary actually needs to
-- capture. Keeping both labor_count and diary_entry_workers around would
-- give the workforce concept two sources of truth that could silently
-- disagree, so labor_count is dropped in the same migration that adds its
-- replacement.
--
-- Also makes the diary activity taxonomy (diary_activity_categories,
-- diary_sub_activities), seeded once in 0020 as fixed reference data,
-- admin-manageable at runtime: an is_active flag lets an admin retire an
-- activity going forward without touching the FK that historical
-- diary_entries rows depend on.
--
-- SPECIFICATION GAP: as with 0020, no BR-xx rule and no openapi path yet
-- cover the farm diary or its workforce detail. This remains DB-layer
-- scaffolding for an upcoming API module; flagged per root CLAUDE.md
-- section 1 rather than invented here.
-- =============================================================================

-- +migrate Up

-- -----------------------------------------------------------------------------
-- diary_entry_workers — per-worker labour/wage detail for a diary entry
-- -----------------------------------------------------------------------------
CREATE TABLE diary_entry_workers (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    diary_entry_id    uuid        NOT NULL REFERENCES diary_entries (id) ON DELETE CASCADE,
    name              text        NOT NULL,
    role              text,
    hours_worked      numeric     NOT NULL CHECK (hours_worked > 0 AND hours_worked <= 24),
    wage_rate_paise   integer     NOT NULL CHECK (wage_rate_paise > 0),
    payment_status    text        NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID')),
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz
);

CREATE INDEX idx_diary_entry_workers_diary_entry_id ON diary_entry_workers (diary_entry_id);

COMMENT ON TABLE diary_entry_workers IS
    'Per-worker labour/wage detail for a diary entry — the replacement for '
    'diary_entries.labor_count (dropped in this migration), which recorded '
    'only a headcount. Total labour cost for an entry is always computed at '
    'query time as SUM(hours_worked * wage_rate_paise), never stored: a '
    'stored total would drift the moment an edit replaces the worker set, '
    'and this table has no column for it on purpose.';
COMMENT ON COLUMN diary_entry_workers.wage_rate_paise IS
    'Integer paise, not rupees — root CLAUDE.md section 2.2, money is never '
    'a float. Deliberately an integer column, not numeric/decimal.';

-- -----------------------------------------------------------------------------
-- diary_activity_categories / diary_sub_activities — admin-manageable taxonomy
-- -----------------------------------------------------------------------------
ALTER TABLE diary_activity_categories ADD COLUMN is_active boolean NOT NULL DEFAULT true;
ALTER TABLE diary_sub_activities      ADD COLUMN is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN diary_activity_categories.is_active IS
    'false retires this category from new selection — excluded from the '
    'farmer-facing taxonomy list and from new-entry validation — but never '
    'hard-deleted: existing diary_entries rows referencing it via '
    'category_key remain valid and readable, which a hard delete would '
    'break via the FK.';
COMMENT ON COLUMN diary_sub_activities.is_active IS
    'false retires this sub-activity from new selection — excluded from the '
    'farmer-facing taxonomy list and from new-entry validation — but never '
    'hard-deleted: existing diary_entries rows referencing it via '
    'sub_activity_key remain valid and readable, which a hard delete would '
    'break via the FK.';

-- -----------------------------------------------------------------------------
-- diary_entries — drop the superseded headcount column
-- -----------------------------------------------------------------------------
ALTER TABLE diary_entries DROP COLUMN labor_count;

SELECT app_attach_updated_at_triggers();

-- +migrate Down

DROP TABLE IF EXISTS diary_entry_workers;

ALTER TABLE diary_sub_activities      DROP COLUMN IF EXISTS is_active;
ALTER TABLE diary_activity_categories DROP COLUMN IF EXISTS is_active;

ALTER TABLE diary_entries ADD COLUMN labor_count smallint NOT NULL DEFAULT 1 CHECK (labor_count >= 0);
