-- =============================================================================
-- 0022_cover_crop_windows.sql
--
-- Follow-up to 0021_soil_management.sql: the Crop Rotation screen (FR-F06
-- soil diary) also tracks a cover-crop window -- a date range + cover crop
-- type -- separately from the ordered `crop_rotation_entries` sequence. This
-- table was part of the approved design but was left out of 0021 by
-- oversight; it is added here rather than editing a migration that has
-- already run (root CLAUDE.md §7).
--
-- FKs to `plots.id`, never `zones` -- same reasoning as every table in 0021.
-- Authorization is the same single permission, `farmer.soil.manage_own`
-- (docs/rbac.json): a cover crop window is only ever reached through a plot
-- on a farm the actor owns.
-- =============================================================================

-- +migrate Up

CREATE TABLE cover_crop_windows (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id         uuid        NOT NULL REFERENCES plots (id) ON DELETE CASCADE,
    cover_crop_type text        NOT NULL,
    window_start    date        NOT NULL,
    window_end      date        NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz,
    CONSTRAINT chk_cover_crop_windows_dates CHECK (window_end >= window_start)
);

CREATE INDEX idx_cover_crop_windows_plot_id ON cover_crop_windows (plot_id);

COMMENT ON TABLE cover_crop_windows IS
    'Cover-crop planting window (date range + crop type) for a plot, tracked '
    'alongside but separately from crop_rotation_entries (FR-F06 soil diary, '
    'Crop Rotation screen). 100% farmer-entered planning, never system-'
    'suggested -- same BR-38 boundary as crop_rotation_entries.status.';

SELECT app_attach_updated_at_triggers();

-- +migrate Down

DROP TABLE IF EXISTS cover_crop_windows;
