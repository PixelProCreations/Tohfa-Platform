-- =============================================================================
-- 0073_farmer_admin_multi_zone.sql
-- Farmer Admin zones (BR-113, owner decision 2026-10-23): a Farmer Admin may hold
-- several zones, one live user_roles row per zone (the auth path already collects
-- every live row's zone_id into the token).
--
-- uq_user_roles_active (0002) keys a live assignment on (user, role, warehouse) only,
-- so a second live FARMER_ADMIN row for another zone collided with the first. It now
-- also keys on zone_id: still one live row per (user, role, warehouse, zone).
--
-- Down: restores the 0002 index. It FAILS while any user holds two live FARMER_ADMIN
-- zones; end the extra assignments first.
-- =============================================================================

-- +migrate Up

DROP INDEX IF EXISTS uq_user_roles_active;

CREATE UNIQUE INDEX uq_user_roles_active
    ON user_roles (user_id, role_id,
                   COALESCE(warehouse_id, '00000000-0000-0000-0000-000000000000'::uuid),
                   COALESCE(zone_id, '00000000-0000-0000-0000-000000000000'::uuid))
    WHERE valid_to IS NULL;

-- +migrate Down

DROP INDEX IF EXISTS uq_user_roles_active;

CREATE UNIQUE INDEX uq_user_roles_active
    ON user_roles (user_id, role_id,
                   COALESCE(warehouse_id, '00000000-0000-0000-0000-000000000000'::uuid))
    WHERE valid_to IS NULL;
