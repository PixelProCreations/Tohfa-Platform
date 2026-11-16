-- =============================================================================
-- 0088_geographic_zones.sql
-- BR-19: Canonical geographic_zones view joining zone_taluks and zones
-- =============================================================================

-- +migrate Up
CREATE OR REPLACE VIEW geographic_zones AS
SELECT zt.id, zt.district, zt.taluk, zt.zone_id, z.code AS zone_code, z.name AS zone_name, z.is_active
FROM zone_taluks zt
JOIN zones z ON z.id = zt.zone_id;

COMMENT ON VIEW geographic_zones IS 'BR-19: Districts to taluks to zones geographic mapping.';

-- +migrate Down
DROP VIEW IF EXISTS geographic_zones;

