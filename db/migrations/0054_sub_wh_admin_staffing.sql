-- =============================================================================
-- 0054_sub_wh_admin_staffing.sql
-- Sub Warehouse Admin staffing (BR-81).
--
--   * sub_wh_admin_code_seq: numbers the admin code ('SWA-001' ...) the designed
--     Manage Sub Warehouse Admins screen shows next to each admin.
--   * system_config.sub_wh_admin_max_per_warehouse: the most live Sub Warehouse
--     Admin assignments one warehouse may hold. 5 is the figure BR-25 / Assumption 1
--     states ("5 admins including standby"). UNCONFIRMED INTERPRETATION: whether
--     that 5 is per warehouse or for the whole platform (4 warehouses + 1 standby)
--     is not stated; the per-warehouse reading is the less restrictive one, and the
--     owner can change the value (or the meaning) without a deploy.
-- =============================================================================

-- +migrate Up

CREATE SEQUENCE sub_wh_admin_code_seq;

-- DO NOTHING, not DO UPDATE: re-running must never overwrite a value an admin has changed.
INSERT INTO system_config (key, value, data_type, description) VALUES
    ('sub_wh_admin_max_per_warehouse',
     '5'::jsonb, 'number',
     'BR-81: the most live Sub Warehouse Admin assignments (standby included) one warehouse may hold. POST /v1/admin/sub-warehouse-admins answers 409 CONFLICT when the warehouse already holds this many. 5 is the figure in BR-25 / Assumption 1; reading it per warehouse rather than for the platform is an unconfirmed interpretation. The service reads this key (fallback 5 when the row is missing or not a positive integer): it is NOT a literal in the service.')
ON CONFLICT (key) DO NOTHING;

-- +migrate Down

DELETE FROM system_config WHERE key = 'sub_wh_admin_max_per_warehouse';
DROP SEQUENCE IF EXISTS sub_wh_admin_code_seq;
