-- =============================================================================
-- 005_zones.sql
-- Reference seed for the 4 Nilgiris warehouse zones and their taluk mappings (BR-143).
-- =============================================================================

-- 1. Ensure the 4 canonical zones exist, linked to their respective warehouses
INSERT INTO zones (code, name, warehouse_id, is_active)
SELECT 'ZONE-OOTY', 'Ooty Zone', id, true
FROM warehouses WHERE code = 'WH-OOTY'
ON CONFLICT (code) DO UPDATE SET warehouse_id = EXCLUDED.warehouse_id, is_active = true;

INSERT INTO zones (code, name, warehouse_id, is_active)
SELECT 'ZONE-COON', 'Coonoor Zone', id, true
FROM warehouses WHERE code = 'WH-COON'
ON CONFLICT (code) DO UPDATE SET warehouse_id = EXCLUDED.warehouse_id, is_active = true;

INSERT INTO zones (code, name, warehouse_id, is_active)
SELECT 'ZONE-KOTA', 'Kotagiri Zone', id, true
FROM warehouses WHERE code = 'WH-KOTA'
ON CONFLICT (code) DO UPDATE SET warehouse_id = EXCLUDED.warehouse_id, is_active = true;

INSERT INTO zones (code, name, warehouse_id, is_active)
SELECT 'ZONE-GUDA', 'Gudalur Zone', id, true
FROM warehouses WHERE code = 'WH-GUDA'
ON CONFLICT (code) DO UPDATE SET warehouse_id = EXCLUDED.warehouse_id, is_active = true;

-- Deactivate legacy demo zone if present to replace it with canonical warehouse-backed zones
UPDATE zones SET is_active = false WHERE code = 'ZONE-DEMO-01';

-- 2. Populate taluk-to-zone mappings (district 'The Nilgiris')
-- Ooty zone: Udhagamandalam, Ooty (alias), Kundah
-- Coonoor zone: Coonoor
-- Kotagiri zone: Kotagiri
-- Gudalur zone: Gudalur, Pandalur

INSERT INTO zone_taluks (zone_id, taluk, district)
SELECT z.id, t.taluk, 'The Nilgiris'
FROM (
    VALUES
        ('ZONE-OOTY', 'Udhagamandalam'),
        ('ZONE-OOTY', 'Ooty'),
        ('ZONE-OOTY', 'Kundah'),
        ('ZONE-COON', 'Coonoor'),
        ('ZONE-KOTA', 'Kotagiri'),
        ('ZONE-GUDA', 'Gudalur'),
        ('ZONE-GUDA', 'Pandalur')
) AS t(zone_code, taluk)
JOIN zones z ON z.code = t.zone_code
ON CONFLICT (district, lower(taluk)) DO UPDATE SET zone_id = EXCLUDED.zone_id;
