-- =============================================================================
-- 0028_farm_rating_source_audit.sql
--
-- PRODUCT DECISION (2026-10-01, owner): the farm rating (BR-06) comes from
-- completed INTERNAL audits ONLY. The manual admin write path
-- (PUT /admin/farmers/{id}/rating) is removed; completing an INTERNAL audit
-- creates a new COMPLETE farm_ratings row, in the same transaction, carrying
-- the audit's 10 category scores. EXTERNAL audits create no rating.
--
-- This migration links a rating to the audit it was derived from:
--
--   source_audit_id  NULL     -> a legacy MANUAL rating written by the removed
--                                PUT before this decision (period 'CYCLE-n').
--                                Kept untouched as history.
--                    NOT NULL -> derived from that audit (period '<FY> Q<n>').
--
-- UNIQUE where not null: one audit yields at most one rating. The audit state
-- machine already refuses a second completion; this makes the database refuse
-- it too, even for a caller that bypasses the service.
--
-- ON DELETE RESTRICT, not CASCADE: both rows are compliance history, and
-- audits are never deleted by the application (0027 uses RESTRICT on
-- audits.farmer_id for the same reason).
--
-- Additive only: no existing row is rewritten, no existing column changes.
-- =============================================================================

-- +migrate Up

ALTER TABLE farm_ratings
    ADD COLUMN source_audit_id uuid REFERENCES audits (id) ON DELETE RESTRICT;

CREATE UNIQUE INDEX uq_farm_ratings_source_audit
    ON farm_ratings (source_audit_id)
    WHERE source_audit_id IS NOT NULL;

COMMENT ON COLUMN farm_ratings.source_audit_id IS
    'The completed INTERNAL audit this rating was derived from (product decision '
    '2026-10-01, BR-06). NULL = legacy manual rating from the removed PUT, kept as '
    'history. Unique where not null: one audit, at most one rating.';

COMMENT ON TABLE farm_ratings IS
    'A rating cycle for one farmer. BR-06 (LOCKED): 10 categories x 10 points, '
    'summed directly to a 0-100 total_score — no multiplier. Since 2026-10-01 a '
    'rating is created ONLY by completing an INTERNAL audit (source_audit_id set, '
    'status COMPLETE, period_label ''<fiscal year> Q<quarter>''); legacy manual rows '
    '(source_audit_id NULL, period_label ''CYCLE-n'') are history. The newest row by '
    'created_at is the current rating; older rows are never modified.';

-- +migrate Down

-- Restores the 0018 comment verbatim.
COMMENT ON TABLE farm_ratings IS
    'A rating cycle for one farmer. BR-06 (LOCKED): 10 categories x 10 points, '
    'summed directly to a 0-100 total_score — no multiplier. status stays DRAFT '
    'until all 10 active rating_categories rows have a score for this rating_id; '
    'only then does total_score/tier_code get set and status flip to COMPLETE. '
    'zone_id carries the OWN_ZONE_ONLY predicate for FARMER_ADMIN edits '
    '(farmer.rating.edit). Scores may be submitted incrementally across '
    'multiple PUT calls while DRAFT; once COMPLETE, the next edit starts a new '
    'cycle (new period_label) rather than mutating this row, so every prior '
    'cycle''s scores stay intact — the history mechanism root CLAUDE.md §2.3 '
    'asks ledger-adjacent tables for.';

DROP INDEX IF EXISTS uq_farm_ratings_source_audit;
ALTER TABLE farm_ratings DROP COLUMN IF EXISTS source_audit_id;
