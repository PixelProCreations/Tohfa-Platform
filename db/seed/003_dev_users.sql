-- =============================================================================
-- 003_dev_users.sql — Seed administrative and test users for local development
--
-- DEV ONLY. `pnpm db:seed` skips this file unless SEED_DEV_USERS=true and
-- always refuses it when NODE_ENV=production (SEED_KINDS in
-- apps/api/src/db/runner.ts). NEVER run it against a shared or real database:
-- these are SUPER_ADMIN / admin accounts with a publicly known password.
--
-- All accounts have password: Password@123
-- Hash: $2b$12$IxUFcyqODhx.hqBaTL7uy.JWfoY2BFP2sKst6BCBYv5gV6qLE5pbi
-- =============================================================================

INSERT INTO users (
    id, mobile, email, password_hash, full_name, preferred_locale, user_type, status
)
VALUES
    -- 1. Super Admin
    (
        '00000000-0000-0000-0000-000000000001',
        '+919800000001',
        'superadmin@tohfa.test',
        '$2b$12$IxUFcyqODhx.hqBaTL7uy.JWfoY2BFP2sKst6BCBYv5gV6qLE5pbi',
        'Super Administrator',
        'en',
        'ADMIN',
        'ACTIVE'
    ),
    -- 2. Tohfa Admin
    (
        '00000000-0000-0000-0000-000000000002',
        '+919800000002',
        'admin@tohfa.test',
        '$2b$12$IxUFcyqODhx.hqBaTL7uy.JWfoY2BFP2sKst6BCBYv5gV6qLE5pbi',
        'Tohfa Platform Admin',
        'en',
        'ADMIN',
        'ACTIVE'
    ),
    -- 3. Farmer Admin (Read-only queue reviewer)
    (
        '00000000-0000-0000-0000-000000000003',
        '+919800000003',
        'farmeradmin@tohfa.test',
        '$2b$12$IxUFcyqODhx.hqBaTL7uy.JWfoY2BFP2sKst6BCBYv5gV6qLE5pbi',
        'Farmer Desk Admin',
        'ta',
        'ADMIN',
        'ACTIVE'
    ),
    -- (4. was multirole@tohfa.test, TOHFA_ADMIN + FARMER_ADMIN: removed 2026-11-03, BR-135 forbids
    --  it. The id ...0004 and mobile +919800000004 are left unused.)
    -- 5. Main Warehouse Admin
    (
        '00000000-0000-0000-0000-000000000005',
        '+919800000005',
        'warehouseadmin@tohfa.test',
        '$2b$12$IxUFcyqODhx.hqBaTL7uy.JWfoY2BFP2sKst6BCBYv5gV6qLE5pbi',
        'Main Warehouse Admin',
        'en',
        'ADMIN',
        'ACTIVE'
    ),
    -- 6. Sub Warehouse Admin (Coonoor)
    (
        '00000000-0000-0000-0000-000000000006',
        '+919800000006',
        'subwarehouseadmin@tohfa.test',
        '$2b$12$IxUFcyqODhx.hqBaTL7uy.JWfoY2BFP2sKst6BCBYv5gV6qLE5pbi',
        'Sub Warehouse Admin (Coonoor)',
        'en',
        'ADMIN',
        'ACTIVE'
    )
ON CONFLICT (id) DO UPDATE
    SET mobile = EXCLUDED.mobile,
        password_hash = EXCLUDED.password_hash,
        status = 'ACTIVE',
        user_type = EXCLUDED.user_type,
        full_name = EXCLUDED.full_name;

-- Assign Roles
--
-- BR-135 (owner rule 2026-11-03): every account holds exactly one role, except that FARMER,
-- FARMER_ADMIN and CUSTOMER may be combined (docs/rbac.json `allowedRoleCombinations`). The Super
-- Admin, TOHFA Admin, Main Warehouse Admin and Sub Warehouse Admin accounts hold their one admin
-- role only and have no `farmers` row. (They used to get an extra FARMER role and a farmers row
-- "for mobile access"; the farmerId that put in their token made the warehouse-scoped endpoints
-- answer 404 for subwarehouseadmin@.) Use a farmer account for the farmer app: the demo farmers of
-- 004_demo.js (farmer1@tohfa.demo .. farmer12@tohfa.demo, +919870000001 .. +919870000012,
-- SEED_DEMO=true). The former multirole@ user (TOHFA_ADMIN + FARMER_ADMIN) is gone for the same
-- reason; an old database keeps its rows (migration 0083 never touches existing rows).
INSERT INTO user_roles (user_id, role_id, role_code, warehouse_id)
VALUES
    -- Super Admin
    (
        '00000000-0000-0000-0000-000000000001',
        (SELECT id FROM roles WHERE code = 'SUPER_ADMIN'),
        'SUPER_ADMIN',
        NULL
    ),
    -- Tohfa Admin
    (
        '00000000-0000-0000-0000-000000000002',
        (SELECT id FROM roles WHERE code = 'TOHFA_ADMIN'),
        'TOHFA_ADMIN',
        NULL
    ),
    -- Farmer Admin
    (
        '00000000-0000-0000-0000-000000000003',
        (SELECT id FROM roles WHERE code = 'FARMER_ADMIN'),
        'FARMER_ADMIN',
        NULL
    ),
    -- Main Warehouse Admin (MAIN_WH_ADMIN)
    (
        '00000000-0000-0000-0000-000000000005',
        (SELECT id FROM roles WHERE code = 'MAIN_WH_ADMIN'),
        'MAIN_WH_ADMIN',
        NULL
    ),
    -- Sub Warehouse Admin (SUB_WH_ADMIN for WH-COON)
    (
        '00000000-0000-0000-0000-000000000006',
        (SELECT id FROM roles WHERE code = 'SUB_WH_ADMIN'),
        'SUB_WH_ADMIN',
        (SELECT id FROM warehouses WHERE code = 'WH-COON')
    )
ON CONFLICT (user_id, role_id, COALESCE(warehouse_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(zone_id, '00000000-0000-0000-0000-000000000000'::uuid)) WHERE valid_to IS NULL
DO NOTHING;
