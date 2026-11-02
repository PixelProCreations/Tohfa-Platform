-- =============================================================================
-- 0075_promotion_requests_comment.sql
-- Comment-only: 0074's table comment said no create/list/reject endpoint existed.
-- POST/GET /admin/promotions, GET /admin/promotions/{id} and
-- POST /admin/promotions/{id}/reject now exist (BR-117). 0074 is not edited (it may
-- already be applied); no structural change here.
-- =============================================================================

-- +migrate Up

COMMENT ON TABLE promotion_requests IS
    'BR-114, BR-117: admin promotion requests. Created via POST /admin/promotions, '
    'listed via GET /admin/promotions, approved or rejected by SUPER_ADMIN '
    '(admin.promotion.approve).';

-- +migrate Down

COMMENT ON TABLE promotion_requests IS
    'BR-114: admin promotion requests. Approved by SUPER_ADMIN (admin.promotion.approve). '
    'No create/list/reject endpoint exists yet.';
