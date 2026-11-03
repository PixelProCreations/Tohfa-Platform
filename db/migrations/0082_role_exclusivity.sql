-- =============================================================================
-- 0082_role_exclusivity.sql
-- BR-135 (owner rule 2026-11-02): only a Farmer Admin may also be a farmer. A user holding
-- SUPER_ADMIN, TOHFA_ADMIN, MAIN_WH_ADMIN or SUB_WH_ADMIN never also holds FARMER or CUSTOMER and
-- never has a live `farmers` row. The service layer refuses this first
-- (apps/api/src/rbac/roleExclusivity.ts); these triggers are the last line of defence.
--
-- THE ROLE LISTS are a copy of docs/rbac.json: the single-role admins are the roles marked
-- `excludesEndUserRoles: true`, the end-user roles are those whose `scopeDimension` is
-- `farmer_id` or `customer_id`. They live in ONE function below so there is one place to change;
-- apps/api/src/rbac/roleExclusivity.db.test.ts fails when they drift from rbac.json.
--
-- WHAT IS CHECKED: only NEW writes. Rows that existed before this migration (old dev databases
-- whose admin users still carry FARMER or a farmers row) are neither touched nor validated, so the
-- migration is safe to run on them. Re-inserting a role the user already holds live is not
-- checked either: that insert is a no-op (`ON CONFLICT DO NOTHING` in the seeds) or a unique
-- violation, and it must not start failing on an old database. A soft-deleted farmers row
-- (deleted_at not null) counts as no farmer. Ended role rows (valid_to <= now()) count as not held.
-- Combinations of two admin roles are not restricted (docs/rules.md, Open contradictions #33).
-- =============================================================================

-- +migrate Up

CREATE OR REPLACE FUNCTION app_br135_role_kind(p_code text) RETURNS text
LANGUAGE sql IMMUTABLE AS $fn$
    SELECT CASE
        -- docs/rbac.json roles with `excludesEndUserRoles: true`
        WHEN p_code IN ('SUPER_ADMIN', 'TOHFA_ADMIN', 'MAIN_WH_ADMIN', 'SUB_WH_ADMIN') THEN 'SINGLE_ROLE_ADMIN'
        -- docs/rbac.json roles scoped to farmer_id / customer_id
        WHEN p_code IN ('FARMER', 'CUSTOMER') THEN 'END_USER'
        ELSE NULL
    END
$fn$;

COMMENT ON FUNCTION app_br135_role_kind(text) IS
    'BR-135: SINGLE_ROLE_ADMIN for the rbac.json roles marked excludesEndUserRoles, END_USER for the '
    'farmer_id / customer_id scoped roles, NULL otherwise (FARMER_ADMIN). Mirrors docs/rbac.json.';

-- The user's live role codes of one kind, excluding the row being written.
CREATE OR REPLACE FUNCTION app_br135_held_role(p_user_id uuid, p_kind text, p_exclude_id uuid)
RETURNS text
LANGUAGE sql STABLE AS $fn$
    SELECT r.code
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = p_user_id
       AND ur.id IS DISTINCT FROM p_exclude_id
       AND (ur.valid_to IS NULL OR ur.valid_to > now())
       AND app_br135_role_kind(r.code) = p_kind
     ORDER BY r.code
     LIMIT 1
$fn$;

CREATE OR REPLACE FUNCTION app_user_roles_br135_guard() RETURNS trigger
LANGUAGE plpgsql AS $fn$
DECLARE
    v_code  text;
    v_kind  text;
    v_other text;
BEGIN
    -- An ended row grants nothing.
    IF NEW.valid_to IS NOT NULL AND NEW.valid_to <= now() THEN
        RETURN NEW;
    END IF;

    -- Resolve from role_id: some writers leave role_code to trg_user_roles_scope_guard.
    SELECT code INTO v_code FROM roles WHERE id = NEW.role_id;
    v_kind := app_br135_role_kind(v_code);
    IF v_kind IS NULL THEN
        RETURN NEW;
    END IF;

    -- Already held live: a repeated insert, not a new grant (see the header).
    IF EXISTS (
        SELECT 1 FROM user_roles ur
         WHERE ur.user_id = NEW.user_id AND ur.role_id = NEW.role_id
           AND (ur.valid_to IS NULL OR ur.valid_to > now())
    ) THEN
        RETURN NEW;
    END IF;

    IF v_kind = 'SINGLE_ROLE_ADMIN' THEN
        v_other := app_br135_held_role(NEW.user_id, 'END_USER', NEW.id);
        IF v_other IS NULL AND EXISTS (
            SELECT 1 FROM farmers f WHERE f.user_id = NEW.user_id AND f.deleted_at IS NULL
        ) THEN
            v_other := 'a farmer (farmers row)';
        END IF;
    ELSE
        v_other := app_br135_held_role(NEW.user_id, 'SINGLE_ROLE_ADMIN', NEW.id);
    END IF;

    IF v_other IS NOT NULL THEN
        RAISE EXCEPTION 'BR-135: user % cannot hold % while also %', NEW.user_id, v_code, v_other
            USING ERRCODE = '23514', HINT = 'code: CONFLICT';
    END IF;

    RETURN NEW;
END
$fn$;

CREATE TRIGGER trg_user_roles_br135_guard
    BEFORE INSERT ON user_roles
    FOR EACH ROW EXECUTE FUNCTION app_user_roles_br135_guard();

CREATE OR REPLACE FUNCTION app_farmers_br135_guard() RETURNS trigger
LANGUAGE plpgsql AS $fn$
DECLARE
    v_admin text;
BEGIN
    -- A soft-deleted row is no farmer; on UPDATE only a restore (deleted_at -> NULL) is a new farmer.
    IF NEW.deleted_at IS NOT NULL THEN
        RETURN NEW;
    END IF;
    IF TG_OP = 'UPDATE' AND OLD.deleted_at IS NULL THEN
        RETURN NEW;
    END IF;

    v_admin := app_br135_held_role(NEW.user_id, 'SINGLE_ROLE_ADMIN', NULL);
    IF v_admin IS NOT NULL THEN
        RAISE EXCEPTION 'BR-135: user % holds % and cannot be a farmer', NEW.user_id, v_admin
            USING ERRCODE = '23514', HINT = 'code: CONFLICT';
    END IF;

    RETURN NEW;
END
$fn$;

CREATE TRIGGER trg_farmers_br135_guard
    BEFORE INSERT OR UPDATE OF deleted_at ON farmers
    FOR EACH ROW EXECUTE FUNCTION app_farmers_br135_guard();

-- +migrate Down

DROP TRIGGER IF EXISTS trg_farmers_br135_guard ON farmers;
DROP FUNCTION IF EXISTS app_farmers_br135_guard();
DROP TRIGGER IF EXISTS trg_user_roles_br135_guard ON user_roles;
DROP FUNCTION IF EXISTS app_user_roles_br135_guard();
DROP FUNCTION IF EXISTS app_br135_held_role(uuid, text, uuid);
DROP FUNCTION IF EXISTS app_br135_role_kind(text);
