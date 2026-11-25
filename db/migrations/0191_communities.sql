-- =============================================================================
-- 0191_communities.sql
-- BR-59s: Communities backend (Antigravity Brief 01).
--
-- A community works like a WhatsApp Community: a top-level container holding
-- many learning groups.
--
--   - A community has many groups. A group belongs to at most one community,
--     or may stand alone (community_id IS NULL).
--   - Members belong to groups. Community membership is derived dynamically
--     through group membership (learning_group_memberships).
--
-- ON DELETE:
--   * learning_groups.community_id -> SET NULL.
--     Deleting a community must NEVER cascade-delete its constituent learning groups;
--     the groups and their memberships, history, and discussions detach and become
--     standalone groups.
--   * communities.created_by -> SET NULL.
--     Removing a user row preserves historical community entities created by them.
-- =============================================================================

-- +migrate Up

CREATE TABLE communities (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text        NOT NULL,
    description text,
    category    text        NOT NULL,
    rules       text,
    is_archived boolean     NOT NULL DEFAULT false,
    archived_at timestamptz,
    created_by  uuid        REFERENCES users (id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    deleted_at  timestamptz
);

CREATE INDEX idx_communities_category ON communities (category) WHERE deleted_at IS NULL;
CREATE INDEX idx_communities_archived ON communities (is_archived) WHERE deleted_at IS NULL;
CREATE INDEX idx_communities_created_at ON communities (created_at DESC) WHERE deleted_at IS NULL;

COMMENT ON TABLE communities IS
    'Antigravity Brief 01 / BR-59s: WhatsApp-style community container holding learning groups.';

ALTER TABLE learning_groups
    ADD COLUMN community_id uuid REFERENCES communities (id) ON DELETE SET NULL;

CREATE INDEX idx_learning_groups_community_id ON learning_groups (community_id);

-- +migrate Down

ALTER TABLE learning_groups DROP COLUMN IF EXISTS community_id;
DROP TABLE IF EXISTS communities;
