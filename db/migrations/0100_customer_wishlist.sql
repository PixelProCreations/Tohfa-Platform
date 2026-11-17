-- =============================================================================
-- 0100_customer_wishlist.sql
-- Customer wishlist: a customer saves a catalog product (crop + grade) to come back to.
--
-- A wishlist row stores ONLY the (crop, grade) the catalog already exposes as a product
-- (BR-16: no farm, batch or farmer reference). Price and availability are never stored; they
-- are read from the catalog at request time. UNIQUE (customer_id, crop_id, grade) is what
-- makes "add" idempotent.
-- =============================================================================

-- +migrate Up

CREATE TABLE wishlist_items (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id  uuid          NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
    crop_id      uuid          NOT NULL REFERENCES crop_master (id) ON DELETE CASCADE,
    grade        produce_grade NOT NULL,
    created_at   timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT wishlist_items_grade_sellable_chk CHECK (grade IN ('GRADE_1', 'GRADE_2', 'GRADE_3')),
    CONSTRAINT wishlist_items_unique_product UNIQUE (customer_id, crop_id, grade)
);

CREATE INDEX idx_wishlist_items_customer ON wishlist_items (customer_id, created_at DESC, id DESC);
CREATE INDEX idx_wishlist_items_crop     ON wishlist_items (crop_id);

COMMENT ON TABLE wishlist_items IS
    'A customer''s saved catalog products (crop + grade). No price, stock or farm data is stored: the catalog allow-list serializer supplies them at read time (BR-16).';

-- +migrate Down

DROP TABLE IF EXISTS wishlist_items;
