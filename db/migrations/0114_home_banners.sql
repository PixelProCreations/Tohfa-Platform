-- =============================================================================
-- 0114_home_banners.sql
-- BR-152: admin-managed hero banners for the customer home (GET /catalog/home `heroBanners`).
--
-- A banner points at nothing (NONE), a category, a catalog product (crop_master id: the catalog
-- product id IS the crop id) or a URL. The target columns must agree with target_type, and an
-- optional active window bounds when it shows. Soft-deleted (deleted_at) so the audit trail's
-- entity id keeps resolving. Every write is audit-logged by the service in the same transaction.
-- =============================================================================

-- +migrate Up

CREATE TABLE home_banners (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title               text        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
    image_url           text        NOT NULL CHECK (char_length(image_url) BETWEEN 1 AND 2048),
    target_type         text        NOT NULL DEFAULT 'NONE'
                                    CHECK (target_type IN ('NONE', 'CATEGORY', 'PRODUCT', 'URL')),
    target_category_id  uuid        REFERENCES categories (id),
    target_product_id   uuid        REFERENCES crop_master (id),
    target_url          text        CHECK (target_url IS NULL OR char_length(target_url) BETWEEN 1 AND 2048),
    sort_order          integer     NOT NULL DEFAULT 0,
    starts_at           timestamptz,
    ends_at             timestamptz,
    is_active           boolean     NOT NULL DEFAULT true,
    created_by          uuid        REFERENCES users (id),
    updated_by          uuid        REFERENCES users (id),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz,
    deleted_at          timestamptz,
    CONSTRAINT home_banners_target_chk CHECK (
        (target_type = 'NONE'     AND target_category_id IS NULL AND target_product_id IS NULL AND target_url IS NULL) OR
        (target_type = 'CATEGORY' AND target_category_id IS NOT NULL AND target_product_id IS NULL AND target_url IS NULL) OR
        (target_type = 'PRODUCT'  AND target_product_id IS NOT NULL AND target_category_id IS NULL AND target_url IS NULL) OR
        (target_type = 'URL'      AND target_url IS NOT NULL AND target_category_id IS NULL AND target_product_id IS NULL)
    ),
    CONSTRAINT home_banners_window_chk CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX idx_home_banners_live ON home_banners (sort_order, created_at)
    WHERE deleted_at IS NULL AND is_active;

COMMENT ON TABLE home_banners IS
    'BR-152: customer home hero banners. Shown when is_active, not deleted and now() is inside [starts_at, ends_at). Admin writes are audit-logged (catalog.banner.*).';

-- +migrate Down

DROP TABLE IF EXISTS home_banners;
