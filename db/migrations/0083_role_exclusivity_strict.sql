-- =============================================================================
-- 0083_role_exclusivity_strict.sql
-- BR-135 (owner rule 2026-11-03, final): a user holds exactly one role, except that FARMER,
-- FARMER_ADMIN and CUSTOMER form one group whose members may be held together in any combination.
-- SUPER_ADMIN, TOHFA_ADMIN, MAIN_WH_ADMIN and SUB_WH_ADMIN are held alone (no second role of any
-- kind, no farmers row). A live `farmers` row (deleted_at IS NULL) counts as holding FARMER.
--
-- This replaces the bodies of 0082's trigger functions (0082 only kept the four admins away from
-- FARMER/CUSTOMER and left admin + admin unrestricted). The triggers themselves are unchanged:
-- trg_user_roles_br135_guard (BEFORE INSERT ON user_roles) and trg_farmers_br135_guard (BEFORE
-- INSERT OR UPDATE OF deleted_at ON farmers). The service layer refuses first
-- (apps/api/src/rbac/roleExclusivity.ts); these triggers are the last line of defence.
--
-- THE GROUP LIST is a copy of docs/rbac.json `allowedRoleCombinations`. It lives in ONE function,
-- app_br135_allowed_groups(), so there is one place to change; roleExclusivity.db.test.ts fails
-- when it drifts from rbac.json. 0082's helpers app_br135_role_kind / app_br135_held_role held the
-- old lists and are dropped here so no stale copy remains.
--
-- WHAT IS CHECKED: only NEW writes. Existing rows (old dev databases where multirole@ holds
-- TOHFA_ADMIN + FARMER_ADMIN, or an admin still carries FARMER) are neither touched nor validated.
-- Re-inserting a role the user already holds live is not a new grant and is not checked (a seed
-- re-run with ON CONFLICT DO NOTHING must keep working on an old database); neither is a second
-- live farmers row for a user who already has one. Ended role rows (valid_to <= now()) and
-- soft-deleted farmers rows count as not held.
-- =============================================================================

-- +migrate Up

-- docs/rbac.json `allowedRoleCombinations`: one row per (group, role). Keep in step with that file.
CREATE OR REPLACE FUNCTION app_br135_allowed_groups()
RETURNS TABLE (group_no int, role_code text)
LANGUAGE sql IMMUTABLE AS $fn$
    VALUES
        (1, 'FARMER'),
        (1, 'FARMER_ADMIN'),
        (1, 'CUSTOMER')
$fn$;

COMMENT ON FUNCTION app_br135_allowed_groups() IS
    'BR-135: copy of docs/rbac.json allowedRoleCombinations. Any subset of one group may be held '
    'together; every other role is held alone.';

-- True when one account may hold all of p_codes: zero or one distinct role, or roles that all
-- belong to ONE group of app_br135_allowed_groups(). Mirrors isAllowedRoleSet in loadRbac.ts.
CREATE OR REPLACE FUNCTION app_br135_is_allowed_role_set(p_codes text[]) RETURNS boolean
LANGUAGE sql IMMUTABLE AS $fn$
    WITH codes AS (
        SELECT DISTINCT c FROM unnest(p_codes) AS c WHERE c IS NOT NULL
    )
    SELECT (SELECT count(*) FROM codes) <= 1
        OR EXISTS (
            SELECT 1
              FROM (SELECT DISTINCT g.group_no FROM app_br135_allowed_groups() g) grp
             WHERE NOT EXISTS (
                SELECT 1 FROM codes
                 WHERE codes.c NOT IN (
                    SELECT a.role_code FROM app_br135_allowed_groups() a WHERE a.group_no = grp.group_no
                 )
             )
        )
$fn$;

-- The roles a user holds now: live role codes (except the row p_exclude_id) plus FARMER when the
-- user has a live farmers row.
CREATE OR REPLACE FUNCTION app_br135_current_roles(p_user_id uuid, p_exclude_id uuid) RETURNS text[]
LANGUAGE sql STABLE AS $fn$
    SELECT coalesce(array_agg(DISTINCT code ORDER BY code), ARRAY[]::text[])
      FROM (
        SELECT r.code
          FROM user_roles ur
          JOIN roles r ON r.id = ur.role_id
         WHERE ur.user_id = p_user_id
           AND ur.id IS DISTINCT FROM p_exclude_id
           AND (ur.valid_to IS NULL OR ur.valid_to > now())
        UNION
        -- A live farmers row is the FARMER role (BR-135); keep this code equal to rbac.json's
        -- farmer_id-scoped role.
        SELECT 'FARMER'
         WHERE EXISTS (SELECT 1 FROM farmers f WHERE f.user_id = p_user_id AND f.deleted_at IS NULL)
      ) held(code)
$fn$;

CREATE OR REPLACE FUNCTION app_user_roles_br135_guard() RETURNS trigger
LANGUAGE plpgsql AS $fn$
DECLARE
    v_code text;
    v_held text[];
BEGIN
    -- An ended row grants nothing.
    IF NEW.valid_to IS NOT NULL AND NEW.valid_to <= now() THEN
        RETURN NEW;
    END IF;

    -- Resolve from role_id: some writers leave role_code to trg_user_roles_scope_guard, which
    -- fires after this trigger (alphabetical order).
    SELECT code INTO v_code FROM roles WHERE id = NEW.role_id;
    IF v_code IS NULL THEN
        RETURN NEW;
    END IF;

    -- Already held live: a repeated insert (another zone, a seed re-run), not a new grant.
    IF EXISTS (
        SELECT 1 FROM user_roles ur
         WHERE ur.user_id = NEW.user_id AND ur.role_id = NEW.role_id
           AND (ur.valid_to IS NULL OR ur.valid_to > now())
    ) THEN
        RETURN NEW;
    END IF;

    v_held := app_br135_current_roles(NEW.user_id, NEW.id);
    IF NOT app_br135_is_allowed_role_set(v_held || v_code) THEN
        RAISE EXCEPTION 'BR-135: user % cannot hold % together with %', NEW.user_id, v_code, array_to_string(v_held, ', ')
            USING ERRCODE = '23514', HINT = 'code: CONFLICT';
    END IF;

    RETURN NEW;
END
$fn$;

CREATE OR REPLACE FUNCTION app_farmers_br135_guard() RETURNS trigger
LANGUAGE plpgsql AS $fn$
DECLARE
    v_held text[];
BEGIN
    -- A soft-deleted row is no farmer; on UPDATE only a restore (deleted_at -> NULL) is a new farmer.
    IF NEW.deleted_at IS NOT NULL THEN
        RETURN NEW;
    END IF;
    IF TG_OP = 'UPDATE' AND OLD.deleted_at IS NULL THEN
        RETURN NEW;
    END IF;

    -- The user is already a farmer through another live farmers row: not a new grant.
    IF EXISTS (
        SELECT 1 FROM farmers f
         WHERE f.user_id = NEW.user_id AND f.deleted_at IS NULL AND f.id IS DISTINCT FROM NEW.id
    ) THEN
        RETURN NEW;
    END IF;

    v_held := app_br135_current_roles(NEW.user_id, NULL);
    IF NOT app_br135_is_allowed_role_set(v_held || 'FARMER'::text) THEN
        RAISE EXCEPTION 'BR-135: user % holds % and cannot also be a farmer', NEW.user_id, array_to_string(v_held, ', ')
            USING ERRCODE = '23514', HINT = 'code: CONFLICT';
    END IF;

    RETURN NEW;
END
$fn$;

DROP FUNCTION IF EXISTS app_br135_held_role(uuid, text, uuid);
DROP FUNCTION IF EXISTS app_br135_role_kind(text);

-- +migrate Down

-- Restore 0082's helpers and trigger function bodies exactly, then drop 0083's functions.

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

DROP FUNCTION IF EXISTS app_br135_current_roles(uuid, uuid);
DROP FUNCTION IF EXISTS app_br135_is_allowed_role_set(text[]);
DROP FUNCTION IF EXISTS app_br135_allowed_groups();
