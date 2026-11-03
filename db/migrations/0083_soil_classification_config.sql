-- =============================================================================
-- 0083_soil_classification_config.sql
-- BR-40: Soil classification bands in system_config.
-- Required keys:
--   soil.classification.organic_carbon
--   soil.classification.ph
--   soil.classification.ec
--   soil.classification.tds
--   soil.classification.nitrogen
--   soil.classification.phosphorus
--   soil.classification.potassium
-- Each value is a json object with {low, high, belowLabel, insideLabel, aboveLabel}.
-- =============================================================================

-- +migrate Up
INSERT INTO system_config (key, value, data_type, description) VALUES
    ('soil.classification.organic_carbon',
     '{"low": 0.51, "high": 0.75, "belowLabel": "Low", "insideLabel": "Medium", "aboveLabel": "High"}'::jsonb,
     'json',
     'BR-40: Organic Carbon classification band (%): <0.51 is Low, 0.51-0.75 is Medium, >0.75 is High.'),

    ('soil.classification.ph',
     '{"low": 6.0, "high": 7.5, "belowLabel": "Acidic", "insideLabel": "Good", "aboveLabel": "Alkaline"}'::jsonb,
     'json',
     'BR-40: pH classification band: <6.0 is Acidic, 6.0-7.5 is Good, >7.5 is Alkaline.'),

    ('soil.classification.ec',
     '{"low": 0.0, "high": 1.0, "belowLabel": "Good", "insideLabel": "Good", "aboveLabel": "High"}'::jsonb,
     'json',
     'BR-40: Electrical Conductivity (EC in dS/m) classification band: <=1.0 is Good, >1.0 is High.'),

    ('soil.classification.tds',
     '{"low": 0, "high": 500, "belowLabel": "Good", "insideLabel": "Good", "aboveLabel": "High"}'::jsonb,
     'json',
     'BR-40: Total Dissolved Solids (TDS in ppm) classification band: <=500 is Good, >500 is High.'),

    ('soil.classification.nitrogen',
     '{"low": 280, "high": 560, "belowLabel": "Low", "insideLabel": "Good", "aboveLabel": "High"}'::jsonb,
     'json',
     'BR-40: Available Nitrogen (N in kg/ha) classification band: <280 is Low, 280-560 is Good, >560 is High.'),

    ('soil.classification.phosphorus',
     '{"low": 10, "high": 25, "belowLabel": "Low", "insideLabel": "Good", "aboveLabel": "High"}'::jsonb,
     'json',
     'BR-40: Available Phosphorus (P in kg/ha) classification band: <10 is Low, 10-25 is Good, >25 is High.'),

    ('soil.classification.potassium',
     '{"low": 110, "high": 280, "belowLabel": "Low", "insideLabel": "Good", "aboveLabel": "High"}'::jsonb,
     'json',
     'BR-40: Available Potassium (K in kg/ha) classification band: <110 is Low, 110-280 is Good, >280 is High.')
ON CONFLICT (key) DO NOTHING;

-- +migrate Down
DELETE FROM system_config WHERE key IN (
    'soil.classification.organic_carbon',
    'soil.classification.ph',
    'soil.classification.ec',
    'soil.classification.tds',
    'soil.classification.nitrogen',
    'soil.classification.phosphorus',
    'soil.classification.potassium'
);

