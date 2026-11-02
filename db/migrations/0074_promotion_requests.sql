-- =============================================================================
-- 0074_promotion_requests.sql
-- Admin promotion requests (BR-114; owner decision 2026-10-23: create the table).
-- docs/rbac.json `admin.promotion.approve` (SUPER_ADMIN only) approves "a warehouse
-- admin promotion"; no requirement describes the workflow, so this is the smallest
-- design that lets an approval be recorded once:
--
--   * one row per request: target, from_role -> to_role, who asked, why;
--   * status PENDING -> APPROVED | REJECTED, with who decided, when and a note;
--   * both roles are admin roles, and to_role is strictly higher (numerically lower
--     level) than from_role. The levels mirror roles.hierarchy_level / docs/rbac.json
--     (SUPER 1, TOHFA 2, FARMER_ADMIN 3, MAIN 3, SUB 4) because a CHECK cannot read
--     another table;
--   * UNCONFIRMED DEFAULT: to_role is SUPER_ADMIN, TOHFA_ADMIN or MAIN_WH_ADMIN only.
--     A FARMER_ADMIN needs a zone and a SUB_WH_ADMIN a warehouse, which a request
--     does not carry;
--   * a target has at most one PENDING request;
--   * nobody decides their own promotion.
-- No create/list/reject endpoint exists yet (no permission code for them).
-- No business threshold is introduced, so nothing is seeded into system_config.
-- =============================================================================

-- +migrate Up

CREATE TABLE promotion_requests (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    target_user_id  uuid        NOT NULL REFERENCES users (id),
    from_role       text        NOT NULL,
    to_role         text        NOT NULL,
    requested_by    uuid        NOT NULL REFERENCES users (id),
    reason          text,
    status          text        NOT NULL DEFAULT 'PENDING',
    decided_by      uuid        REFERENCES users (id),
    decided_at      timestamptz,
    decision_note   text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz,

    CONSTRAINT promotion_requests_status_chk
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CONSTRAINT promotion_requests_from_role_chk
        CHECK (from_role IN ('SUPER_ADMIN', 'TOHFA_ADMIN', 'FARMER_ADMIN', 'MAIN_WH_ADMIN', 'SUB_WH_ADMIN')),
    CONSTRAINT promotion_requests_to_role_chk
        CHECK (to_role IN ('SUPER_ADMIN', 'TOHFA_ADMIN', 'MAIN_WH_ADMIN')),
    CONSTRAINT promotion_requests_upward_chk
        CHECK ((CASE to_role WHEN 'SUPER_ADMIN' THEN 1 WHEN 'TOHFA_ADMIN' THEN 2 WHEN 'MAIN_WH_ADMIN' THEN 3 END)
             < (CASE from_role WHEN 'SUPER_ADMIN' THEN 1 WHEN 'TOHFA_ADMIN' THEN 2 WHEN 'FARMER_ADMIN' THEN 3
                               WHEN 'MAIN_WH_ADMIN' THEN 3 WHEN 'SUB_WH_ADMIN' THEN 4 END)),
    CONSTRAINT promotion_requests_reason_len_chk
        CHECK (reason IS NULL OR char_length(reason) BETWEEN 1 AND 500),
    CONSTRAINT promotion_requests_note_len_chk
        CHECK (decision_note IS NULL OR char_length(decision_note) BETWEEN 1 AND 500),
    -- A decided request names who decided and when; a pending one names neither.
    CONSTRAINT promotion_requests_decided_pair_chk
        CHECK ((status = 'PENDING') = (decided_by IS NULL) AND (decided_by IS NULL) = (decided_at IS NULL)),
    CONSTRAINT promotion_requests_no_self_decision_chk
        CHECK (decided_by IS NULL OR decided_by <> target_user_id)
);

-- At most one PENDING request per target.
CREATE UNIQUE INDEX uq_promotion_requests_one_pending
    ON promotion_requests (target_user_id) WHERE status = 'PENDING';

CREATE INDEX idx_promotion_requests_requested_by ON promotion_requests (requested_by);
CREATE INDEX idx_promotion_requests_decided_by   ON promotion_requests (decided_by);

COMMENT ON TABLE promotion_requests IS
    'BR-114: admin promotion requests. Approved by SUPER_ADMIN (admin.promotion.approve). '
    'No create/list/reject endpoint exists yet.';

-- +migrate Down

DROP TABLE IF EXISTS promotion_requests;
