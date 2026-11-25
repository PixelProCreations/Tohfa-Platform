-- =============================================================================
-- 0202_pest_admin_review.sql
-- Admin triage and review columns on farmer-reported pest_detections (BR-223).
-- =============================================================================

-- +migrate Up
ALTER TABLE pest_detections
    ADD COLUMN admin_recommended_treatment text,
    ADD COLUMN admin_review_note           text,
    ADD COLUMN reviewed_by                 uuid REFERENCES users (id),
    ADD COLUMN reviewed_at                 timestamptz;

CREATE INDEX idx_pest_detections_status_detected
    ON pest_detections (status, detected_on DESC, id DESC);

-- +migrate Down
DROP INDEX IF EXISTS idx_pest_detections_status_detected;

ALTER TABLE pest_detections
    DROP COLUMN IF EXISTS reviewed_at,
    DROP COLUMN IF EXISTS reviewed_by,
    DROP COLUMN IF EXISTS admin_review_note,
    DROP COLUMN IF EXISTS admin_recommended_treatment;
