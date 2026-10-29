-- =============================================================================
-- 0072_admin_account_codes.sql
-- Admin account creation (BR-28, BR-112): POST /admin/accounts creates SUPER_ADMIN,
-- TOHFA_ADMIN, FARMER_ADMIN and MAIN_WH_ADMIN accounts. admin_profiles.admin_code is
-- NOT NULL UNIQUE, and the only generator so far (sub_wh_admin_code_seq, 0054) numbers
-- Sub Warehouse Admins ('SWA-001' ...). This sequence numbers every other admin account
-- ('ADM-001' ...). UNCONFIRMED DEFAULT: one sequence and one prefix for all four roles.
-- No business threshold is introduced, so nothing is seeded into system_config.
-- =============================================================================

-- +migrate Up

CREATE SEQUENCE admin_account_code_seq;

-- +migrate Down

DROP SEQUENCE IF EXISTS admin_account_code_seq;
