-- =============================================================================
-- 0101_order_reviews.sql
-- Customer reviews of a completed order, and of the items on it.
--
--   order_reviews       ONE per order (UNIQUE order_id), overall 1-5, aspect tags, comment.
--   order_review_items  optional per-line 1-5 (+ comment); feeds the product review aggregate.
--
-- Reviews are written once and never edited or deleted by the customer, so there is no update
-- endpoint. The review row carries the customer_id only so the owner can read it back; every
-- customer-facing product read is anonymised (no customer, no farm, no farmer identity: BR-16).
-- Tag vocabulary is an UNCONFIRMED implementer proposal; it deliberately has no farm or farmer
-- aspect.
-- =============================================================================

-- +migrate Up

CREATE TABLE order_reviews (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id     uuid        NOT NULL UNIQUE REFERENCES orders (id) ON DELETE CASCADE,
    customer_id  uuid        NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
    rating       smallint    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    tags         text[]      NOT NULL DEFAULT '{}',
    comment      text        CHECK (comment IS NULL OR char_length(comment) BETWEEN 1 AND 1000),
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz,
    CONSTRAINT order_reviews_tags_chk
        CHECK (tags <@ ARRAY['FRESHNESS', 'QUALITY', 'PACKAGING', 'DELIVERY', 'VALUE_FOR_MONEY',
                             'TASTE', 'SERVICE']::text[])
);

CREATE INDEX idx_order_reviews_customer ON order_reviews (customer_id, created_at DESC);
CREATE INDEX idx_order_reviews_created  ON order_reviews (created_at DESC, id DESC);

CREATE TABLE order_review_items (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id      uuid     NOT NULL REFERENCES order_reviews (id) ON DELETE CASCADE,
    order_item_id  uuid     NOT NULL REFERENCES order_items (id) ON DELETE CASCADE,
    rating         smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment        text     CHECK (comment IS NULL OR char_length(comment) BETWEEN 1 AND 500),
    created_at     timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT order_review_items_unique_line UNIQUE (review_id, order_item_id)
);

CREATE INDEX idx_order_review_items_item ON order_review_items (order_item_id);

COMMENT ON TABLE order_reviews IS
    'One customer review per delivered or picked-up order. Never exposed with customer or farm identity on a product read (BR-16).';

-- Own-table trigger only: the global app_attach_updated_at_triggers() would re-attach the touch trigger
-- that 0066 deliberately dropped from the append-only support_messages, breaking 0066's Down.
CREATE TRIGGER trg_order_reviews_touch_updated_at BEFORE UPDATE ON order_reviews
    FOR EACH ROW EXECUTE FUNCTION app_touch_updated_at();

-- +migrate Down

DROP TABLE IF EXISTS order_review_items;
DROP TABLE IF EXISTS order_reviews;
