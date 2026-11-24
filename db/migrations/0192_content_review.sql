-- =============================================================================
-- 0192_content_review.sql
-- BR-59t: Content review workflow (Antigravity Brief 02).
--
-- Review state and published state are two independent axes:
--   - An administrator submits content for review to the Super Admin.
--   - Content may be published immediately without waiting for review.
--   - Content can be published and pending review at the same time.
--   - Rejecting content does NOT unpublish it.
--   - Rejection can be followed by resubmission.
--
-- Columns added to learning_articles, learning_videos, learning_trainings,
-- and learning_groups:
--   * review_status: NOT_SUBMITTED | PENDING_REVIEW | APPROVED | REJECTED
--   * submitted_for_review_at: timestamp when submitted for review
--   * reviewed_by: reviewer user UUID (Super Admin)
--   * reviewed_at: timestamp when review decision was recorded
--   * review_note: optional note / comments from the reviewer
-- =============================================================================

-- +migrate Up

ALTER TABLE learning_articles
    ADD COLUMN review_status text NOT NULL DEFAULT 'NOT_SUBMITTED' CHECK (review_status IN ('NOT_SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED')),
    ADD COLUMN submitted_for_review_at timestamptz,
    ADD COLUMN reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN reviewed_at timestamptz,
    ADD COLUMN review_note text;

CREATE INDEX idx_learning_articles_review_status ON learning_articles (review_status);

ALTER TABLE learning_videos
    ADD COLUMN review_status text NOT NULL DEFAULT 'NOT_SUBMITTED' CHECK (review_status IN ('NOT_SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED')),
    ADD COLUMN submitted_for_review_at timestamptz,
    ADD COLUMN reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN reviewed_at timestamptz,
    ADD COLUMN review_note text;

CREATE INDEX idx_learning_videos_review_status ON learning_videos (review_status);

ALTER TABLE learning_trainings
    ADD COLUMN review_status text NOT NULL DEFAULT 'NOT_SUBMITTED' CHECK (review_status IN ('NOT_SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED')),
    ADD COLUMN submitted_for_review_at timestamptz,
    ADD COLUMN reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN reviewed_at timestamptz,
    ADD COLUMN review_note text;

CREATE INDEX idx_learning_trainings_review_status ON learning_trainings (review_status);

ALTER TABLE learning_groups
    ADD COLUMN review_status text NOT NULL DEFAULT 'NOT_SUBMITTED' CHECK (review_status IN ('NOT_SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED')),
    ADD COLUMN submitted_for_review_at timestamptz,
    ADD COLUMN reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN reviewed_at timestamptz,
    ADD COLUMN review_note text;

CREATE INDEX idx_learning_groups_review_status ON learning_groups (review_status);

-- +migrate Down

DROP INDEX IF EXISTS idx_learning_groups_review_status;
ALTER TABLE learning_groups
    DROP COLUMN IF EXISTS review_note,
    DROP COLUMN IF EXISTS reviewed_at,
    DROP COLUMN IF EXISTS reviewed_by,
    DROP COLUMN IF EXISTS submitted_for_review_at,
    DROP COLUMN IF EXISTS review_status;

DROP INDEX IF EXISTS idx_learning_trainings_review_status;
ALTER TABLE learning_trainings
    DROP COLUMN IF EXISTS review_note,
    DROP COLUMN IF EXISTS reviewed_at,
    DROP COLUMN IF EXISTS reviewed_by,
    DROP COLUMN IF EXISTS submitted_for_review_at,
    DROP COLUMN IF EXISTS review_status;

DROP INDEX IF EXISTS idx_learning_videos_review_status;
ALTER TABLE learning_videos
    DROP COLUMN IF EXISTS review_note,
    DROP COLUMN IF EXISTS reviewed_at,
    DROP COLUMN IF EXISTS reviewed_by,
    DROP COLUMN IF EXISTS submitted_for_review_at,
    DROP COLUMN IF EXISTS review_status;

DROP INDEX IF EXISTS idx_learning_articles_review_status;
ALTER TABLE learning_articles
    DROP COLUMN IF EXISTS review_note,
    DROP COLUMN IF EXISTS reviewed_at,
    DROP COLUMN IF EXISTS reviewed_by,
    DROP COLUMN IF EXISTS submitted_for_review_at,
    DROP COLUMN IF EXISTS review_status;
