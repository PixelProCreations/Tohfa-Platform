-- =============================================================================
-- 0020_farm_diary.sql
--
-- The Farm Diary: a farmer's day-by-day log of field activity against a plot
-- and an active planting cycle (farm_crops). Two small reference/lookup
-- tables (diary_activity_categories, diary_sub_activities) hold the fixed
-- 12-category / N-sub-activity taxonomy that populates the entry form; the
-- entry itself (diary_entries) and its photo attachments (diary_entry_photos)
-- are the data the farmer actually writes.
--
-- SPECIFICATION GAP: no rule in docs/rules.md and no path in docs/openapi.yaml
-- covers the farm diary as of this migration. This is DB-layer scaffolding
-- only (schema + reference seed) for an upcoming API module; the BR-xx id,
-- the requirePermission code(s), and the openapi paths/schemas still need to
-- be added when that module is built. Flagged per root CLAUDE.md section 1
-- rather than invented here.
-- =============================================================================

-- +migrate Up

-- -----------------------------------------------------------------------------
-- diary_activity_categories — reference: the 12 top-level activity groups
-- -----------------------------------------------------------------------------
CREATE TABLE diary_activity_categories (
    key         text        PRIMARY KEY,
    name        text        NOT NULL,
    name_ta     text,
    icon_key    text,
    sort_order  smallint    NOT NULL
);

COMMENT ON TABLE diary_activity_categories IS
    'Farm diary taxonomy, level 1 (seeded reference data). The 12 activity '
    'groups a diary entry is filed under, e.g. "Land Preparation", "Sowing / '
    'Planting". A diary_entries row can only reference a category that exists '
    'here, via its FK on category_key.';

-- -----------------------------------------------------------------------------
-- diary_sub_activities — reference: the specific activities within a category
-- -----------------------------------------------------------------------------
CREATE TABLE diary_sub_activities (
    key           text        PRIMARY KEY,
    category_key  text        NOT NULL REFERENCES diary_activity_categories (key),
    name          text        NOT NULL,
    name_ta       text,
    sort_order    smallint    NOT NULL
);

CREATE INDEX idx_diary_sub_activities_category_key ON diary_sub_activities (category_key);

COMMENT ON TABLE diary_sub_activities IS
    'Farm diary taxonomy, level 2 (seeded reference data). The specific '
    'activity picked within a category, e.g. category "land_prep" -> '
    'sub-activity "land_prep.ploughing_tilling". Keys are dotted so the sub-'
    'activity name alone shows its parent category without a join.';

-- -----------------------------------------------------------------------------
-- diary_entries — a farmer's logged activity for one day, on one plot/crop
-- -----------------------------------------------------------------------------
CREATE TABLE diary_entries (
    id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id              uuid        NOT NULL REFERENCES farmers (id),
    plot_id                uuid        NOT NULL REFERENCES plots (id),
    farm_crop_id           uuid        NOT NULL REFERENCES farm_crops (id),
    category_key           text        NOT NULL REFERENCES diary_activity_categories (key),
    sub_activity_key       text        NOT NULL REFERENCES diary_sub_activities (key),
    activity_fields        jsonb       NOT NULL DEFAULT '{}'::jsonb,
    minutes                smallint    NOT NULL CHECK (minutes > 0),
    labor_count            smallint    NOT NULL DEFAULT 1 CHECK (labor_count >= 0),
    notes                  text,
    activity_on            date        NOT NULL DEFAULT current_date,
    logged_at              timestamptz NOT NULL DEFAULT now(),
    voice_note_key         text,
    voice_note_duration_s  smallint    CHECK (voice_note_duration_s IS NULL OR voice_note_duration_s > 0),
    created_at             timestamptz NOT NULL DEFAULT now(),
    updated_at             timestamptz,
    deleted_at             timestamptz
);

CREATE INDEX idx_diary_entries_farmer_activity_on ON diary_entries (farmer_id, activity_on);
CREATE INDEX idx_diary_entries_plot_id            ON diary_entries (plot_id);
CREATE INDEX idx_diary_entries_farm_crop_id        ON diary_entries (farm_crop_id);

COMMENT ON TABLE diary_entries IS
    'One logged farm activity. plot_id is the diary''s "Field/Zone" concept — '
    'the sub-division of a farm the activity happened on (see plots in 0003). '
    'farm_crop_id ties the entry to the active planting cycle it belongs to '
    '(see farm_crops in 0004), which is what makes a diary a per-crop-cycle '
    'log rather than a loose per-plot note. The (farmer_id, activity_on) index '
    'drives the day/month calendar view.';
COMMENT ON COLUMN diary_entries.activity_fields IS
    'Free-form structured detail specific to category_key/sub_activity_key '
    '(e.g. quantity harvested, method used) that does not warrant its own '
    'typed column per sub-activity. Validated by the service against the '
    'shape the API module defines for that sub-activity, not by the database.';

-- -----------------------------------------------------------------------------
-- diary_entry_photos — photo attachments on a diary entry
-- -----------------------------------------------------------------------------
CREATE TABLE diary_entry_photos (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    diary_entry_id  uuid        NOT NULL REFERENCES diary_entries (id) ON DELETE CASCADE,
    storage_key     text        NOT NULL,
    mime_type       text        NOT NULL,
    size_bytes      integer     NOT NULL CHECK (size_bytes > 0),
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_diary_entry_photos_diary_entry_id ON diary_entry_photos (diary_entry_id);

COMMENT ON TABLE diary_entry_photos IS
    'Photo attachments on a diary entry. BR-16 applies here exactly as it does '
    'to produce photos: EXIF must be stripped before storage_key is written, so '
    'a diary photo cannot carry farm GPS into any response that reaches a '
    'customer-facing surface.';

SELECT app_attach_updated_at_triggers();

-- +migrate Down

DROP TABLE IF EXISTS diary_entry_photos;
DROP TABLE IF EXISTS diary_entries;
DROP TABLE IF EXISTS diary_sub_activities;
DROP TABLE IF EXISTS diary_activity_categories;
