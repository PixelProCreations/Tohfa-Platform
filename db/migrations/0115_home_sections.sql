-- =============================================================================
-- 0115_home_sections.sql
-- BR-152: admin-curated product rails on the customer home (GET /catalog/home `sections`).
--
-- A section shows either a category's sellable products (CATEGORY) or a hand-picked ordered list
-- of catalog product ids (PRODUCTS, crop_master ids), at most max_items. Items are resolved at
-- read time through the farm-anonymous catalog serializer (BR-16), so an unsellable product simply
-- drops out. Same lifecycle and audit rules as home_banners (0114).
-- =============================================================================

-- +migrate Up

CREATE TABLE home_sections (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title               text        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
    subtitle            text        CHECK (subtitle IS NULL OR char_length(subtitle) BETWEEN 1 AND 200),
    target_type         text        NOT NULL CHECK (target_type IN ('CATEGORY', 'PRODUCTS')),
    target_category_id  uuid        REFERENCES categories (id),
    product_ids         uuid[]      NOT NULL DEFAULT '{}',
    max_items           integer     NOT NULL DEFAULT 10 CHECK (max_items BETWEEN 1 AND 50),
    sort_order          integer     NOT NULL DEFAULT 0,
    starts_at           timestamptz,
    ends_at             timestamptz,
    is_active           boolean     NOT NULL DEFAULT true,
    created_by          uuid        REFERENCES users (id),
    updated_by          uuid        REFERENCES users (id),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz,
    deleted_at          timestamptz,
    CONSTRAINT home_sections_target_chk CHECK (
        (target_type = 'CATEGORY' AND target_category_id IS NOT NULL AND cardinality(product_ids) = 0) OR
        (target_type = 'PRODUCTS' AND target_category_id IS NULL AND cardinality(product_ids) BETWEEN 1 AND 50)
    ),
    CONSTRAINT home_sections_window_chk CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX idx_home_sections_live ON home_sections (sort_order, created_at)
    WHERE deleted_at IS NULL AND is_active;

COMMENT ON TABLE home_sections IS
    'BR-152: curated customer home rails (category or hand-picked products). Items are serialized farm-anonymously at read time. Admin writes are audit-logged (catalog.home_section.*).';

-- +migrate Down

DROP TABLE IF EXISTS home_sections;
