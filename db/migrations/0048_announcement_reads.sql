-- =============================================================================
-- 0048_announcement_reads.sql
-- Per-user read state for announcements (BR-65).
--
-- `announcements` (0008) is one row for many readers, so "has this user read
-- it" cannot live on that row. One row here means "this user has read this
-- announcement"; absence means unread. Deliberately NOT append-only: it is a
-- read-marker cache, not a ledger, and cascades away with the announcement.
-- =============================================================================

-- +migrate Up

CREATE TABLE announcement_reads (
    announcement_id uuid        NOT NULL REFERENCES announcements (id) ON DELETE CASCADE,
    user_id         uuid        NOT NULL REFERENCES users (id),
    read_at         timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (announcement_id, user_id)
);

CREATE INDEX idx_announcement_reads_user_id ON announcement_reads (user_id);

COMMENT ON TABLE announcement_reads IS
    'BR-65: which users have read which announcements. Absence of a row means unread.';

-- +migrate Down

DROP TABLE IF EXISTS announcement_reads;
