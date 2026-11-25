-- =============================================================================
-- 0190_learning_content_crops.sql
-- BR-59r: Learning Hub articles and videos can be tagged with zero or more crops
-- from the crop taxonomy (crop_master), so the admin "Related crops" chip
-- selector stores a real reference instead of a discarded free-text label and a
-- future farmer-facing "content for the crops I grow" filter can join cleanly.
--
-- SHAPE: a join table per content type, not a uuid[] column on the content row.
--   * Referential integrity: a uuid[] cannot carry a foreign key, so a crop id
--     that never existed, or one left behind by a crop that was removed, would
--     sit in the array forever and surface to the app as a chip with no name.
--   * Join cost: `WHERE crop_id = ANY($1)` over an indexed join table is an
--     ordinary index scan; the array equivalent needs a GIN index and a
--     containment operator, which every reader would have to remember to use.
--   * It matches how this schema already models crop references everywhere else
--     (farm_crops, fair_prices, inventory_batches): a column REFERENCES
--     crop_master (id).
--
-- ON DELETE:
--   * article_id / video_id -> CASCADE. A tag has no meaning without the content
--     row it tags, and admin deletes of learning content are hard deletes
--     (BR-59, "Open owner items"). This mirrors learning_training_enrollments
--     and learning_group_memberships, which cascade from their parent.
--   * crop_id -> RESTRICT. crop_master is reference data that is retired by
--     setting deleted_at / is_active, never by DELETE; every other crop_master
--     FK in this schema is written bare (NO ACTION), which blocks the same way.
--     RESTRICT is spelled out here so the intent is on the page: a hard delete
--     of a crop that content still points at must fail loudly rather than
--     silently un-tag published articles.
-- =============================================================================

-- +migrate Up

CREATE TABLE learning_article_crops (
    article_id uuid        NOT NULL REFERENCES learning_articles (id) ON DELETE CASCADE,
    crop_id    uuid        NOT NULL REFERENCES crop_master (id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (article_id, crop_id)
);

-- The PK covers "the crops of this article". This index covers the reverse,
-- which is what a farmer-facing "articles for crop X" filter would need.
CREATE INDEX idx_learning_article_crops_crop ON learning_article_crops (crop_id);

COMMENT ON TABLE learning_article_crops IS
    'BR-59r: crops a learning article is about. Replace-in-full on update: the '
    'admin PATCH sends the complete cropIds set, or omits it to leave the tags alone.';

CREATE TABLE learning_video_crops (
    video_id   uuid        NOT NULL REFERENCES learning_videos (id) ON DELETE CASCADE,
    crop_id    uuid        NOT NULL REFERENCES crop_master (id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (video_id, crop_id)
);

CREATE INDEX idx_learning_video_crops_crop ON learning_video_crops (crop_id);

COMMENT ON TABLE learning_video_crops IS
    'BR-59r: crops a learning video is about. Same replace-in-full contract as '
    'learning_article_crops.';

-- +migrate Down

DROP TABLE learning_video_crops;
DROP TABLE learning_article_crops;
