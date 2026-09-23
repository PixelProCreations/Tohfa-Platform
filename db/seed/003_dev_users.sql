-- =============================================================================
-- 003_dev_users.sql — Seed administrative and test users for local development
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
    -- 4. Multi-Role Admin (Has both TOHFA_ADMIN and FARMER_ADMIN)
    (
        '00000000-0000-0000-0000-000000000004',
        '+919800000004',
        'multirole@tohfa.test',
        '$2b$12$IxUFcyqODhx.hqBaTL7uy.JWfoY2BFP2sKst6BCBYv5gV6qLE5pbi',
        'Operations Manager (Multi-Role)',
        'en',
        'ADMIN',
        'ACTIVE'
    ),
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
    -- Multi-Role User (TOHFA_ADMIN)
    (
        '00000000-0000-0000-0000-000000000004',
        (SELECT id FROM roles WHERE code = 'TOHFA_ADMIN'),
        'TOHFA_ADMIN',
        NULL
    ),
    -- Multi-Role User (FARMER_ADMIN)
    (
        '00000000-0000-0000-0000-000000000004',
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
    -- Main Warehouse Admin (FARMER role for mobile access)
    (
        '00000000-0000-0000-0000-000000000005',
        (SELECT id FROM roles WHERE code = 'FARMER'),
        'FARMER',
        NULL
    ),
    -- Sub Warehouse Admin (SUB_WH_ADMIN for WH-COON)
    (
        '00000000-0000-0000-0000-000000000006',
        (SELECT id FROM roles WHERE code = 'SUB_WH_ADMIN'),
        'SUB_WH_ADMIN',
        (SELECT id FROM warehouses WHERE code = 'WH-COON')
    ),
    -- Sub Warehouse Admin (FARMER role for mobile access)
    (
        '00000000-0000-0000-0000-000000000006',
        (SELECT id FROM roles WHERE code = 'FARMER'),
        'FARMER',
        NULL
    ),
    -- Super Admin (FARMER role for mobile access)
    (
        '00000000-0000-0000-0000-000000000001',
        (SELECT id FROM roles WHERE code = 'FARMER'),
        'FARMER',
        NULL
    ),
    -- Tohfa Admin (FARMER role for mobile access)
    (
        '00000000-0000-0000-0000-000000000002',
        (SELECT id FROM roles WHERE code = 'FARMER'),
        'FARMER',
        NULL
    )
ON CONFLICT (user_id, role_id, COALESCE(warehouse_id, '00000000-0000-0000-0000-000000000000'::uuid)) WHERE valid_to IS NULL
DO NOTHING;

-- Seed approved farmer profiles for dev admin users so mobile app operates smoothly
INSERT INTO farmers (
    id, user_id, tohfa_farmer_id, application_status, kyc_status, is_market_blocked, address_line1, district
) VALUES
    (
        '20000000-0000-0000-0001-000000000005',
        '00000000-0000-0000-0000-000000000005',
        'TOHFA-F-0005',
        'APPROVED',
        'VERIFIED',
        false,
        'Ooty Main Bazaar Road, Udhagamandalam',
        'The Nilgiris'
    ),
    (
        '20000000-0000-0000-0001-000000000006',
        '00000000-0000-0000-0000-000000000006',
        'TOHFA-F-0006',
        'APPROVED',
        'VERIFIED',
        false,
        'Mount Road, Coonoor',
        'The Nilgiris'
    ),
    (
        '20000000-0000-0000-0001-000000000002',
        '00000000-0000-0000-0000-000000000002',
        'TOHFA-F-0002',
        'APPROVED',
        'VERIFIED',
        false,
        'Commercial Road, Ooty',
        'The Nilgiris'
    )
ON CONFLICT (user_id) DO UPDATE SET
    application_status = 'APPROVED',
    kyc_status = 'VERIFIED';

