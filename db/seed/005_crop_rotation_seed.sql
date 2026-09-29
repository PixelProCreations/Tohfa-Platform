-- =============================================================================
-- 005_crop_rotation_seed.sql — Seed Distinct Crop Rotation cycles per Zone
--
-- Customizes rotation sequences and cover crop windows realistically based on
-- plot characteristics (Field A, Field B, Greenhouse 1, etc.)
-- =============================================================================

-- 1. Ensure any farms without plots have default zone plots
INSERT INTO plots (id, farm_id, name, area_acres, soil_type, sun_exposure, irrigation_type)
SELECT
    gen_random_uuid(),
    f.id,
    'Field A',
    2.50,
    'Red Sandy Loam',
    'Full Sun',
    'Drip'
FROM farms f
WHERE NOT EXISTS (
    SELECT 1 FROM plots p WHERE p.farm_id = f.id
);

-- 2. Clear old identical rotation sequences to re-seed with rich distinct plans
DELETE FROM crop_rotation_entries;
DELETE FROM cover_crop_windows;

-- 3. Seed Distinct Crop Rotation Sequences per Zone

-- ── ROTATION STEP 1 (CURRENT - Now) ──
INSERT INTO crop_rotation_entries (id, plot_id, sequence_order, crop_name, planned_date, status, created_at)
SELECT
    gen_random_uuid(),
    p.id,
    1,
    CASE
        WHEN p.name ILIKE '%greenhouse%' OR p.name ILIKE '%polyhouse%' OR p.name ILIKE '%zone 3%' THEN 'Cherry Tomatoes'
        WHEN p.name ILIKE '%field b%' OR p.name ILIKE '%zone 2%' THEN 'Cabbage & Broccoli'
        WHEN p.name ILIKE '%field c%' THEN 'Sweet Corn'
        ELSE 'Carrot'
    END,
    CURRENT_DATE - INTERVAL '45 days',
    'CURRENT',
    now() - INTERVAL '45 days'
FROM plots p;

-- ── ROTATION STEP 2 (NEXT - Next) ──
INSERT INTO crop_rotation_entries (id, plot_id, sequence_order, crop_name, planned_date, status, created_at)
SELECT
    gen_random_uuid(),
    p.id,
    2,
    CASE
        WHEN p.name ILIKE '%greenhouse%' OR p.name ILIKE '%polyhouse%' OR p.name ILIKE '%zone 3%' THEN 'English Cucumber'
        WHEN p.name ILIKE '%field b%' OR p.name ILIKE '%zone 2%' THEN 'Beetroot'
        WHEN p.name ILIKE '%field c%' THEN 'Finger Millet (Ragi)'
        ELSE 'Potato'
    END,
    CURRENT_DATE + INTERVAL '45 days',
    'NEXT',
    now() - INTERVAL '45 days'
FROM plots p;

-- ── ROTATION STEP 3 (PLANNED - Then) ──
INSERT INTO crop_rotation_entries (id, plot_id, sequence_order, crop_name, planned_date, status, created_at)
SELECT
    gen_random_uuid(),
    p.id,
    3,
    CASE
        WHEN p.name ILIKE '%greenhouse%' OR p.name ILIKE '%polyhouse%' OR p.name ILIKE '%zone 3%' THEN 'Bell Peppers (Capsicum)'
        WHEN p.name ILIKE '%field b%' OR p.name ILIKE '%zone 2%' THEN 'Cowpea (Green Gram)'
        WHEN p.name ILIKE '%field c%' THEN 'Sunn Hemp'
        ELSE 'French Beans (Legume)'
    END,
    CURRENT_DATE + INTERVAL '135 days',
    'PLANNED',
    now() - INTERVAL '45 days'
FROM plots p;

-- ── ROTATION STEP 4 (PLANNED - Then) ──
INSERT INTO crop_rotation_entries (id, plot_id, sequence_order, crop_name, planned_date, status, created_at)
SELECT
    gen_random_uuid(),
    p.id,
    4,
    CASE
        WHEN p.name ILIKE '%greenhouse%' OR p.name ILIKE '%polyhouse%' OR p.name ILIKE '%zone 3%' THEN 'Bush Beans & Basil'
        WHEN p.name ILIKE '%field b%' OR p.name ILIKE '%zone 2%' THEN 'Sweet Corn / Maize'
        WHEN p.name ILIKE '%field c%' THEN 'Radish'
        ELSE 'Oats & Vetch'
    END,
    CURRENT_DATE + INTERVAL '225 days',
    'PLANNED',
    now() - INTERVAL '45 days'
FROM plots p;

-- 4. Seed Distinct Cover Crop Windows per Zone
INSERT INTO cover_crop_windows (id, plot_id, cover_crop_type, window_start, window_end, created_at)
SELECT
    gen_random_uuid(),
    p.id,
    CASE
        WHEN p.name ILIKE '%greenhouse%' OR p.name ILIKE '%polyhouse%' OR p.name ILIKE '%zone 3%' THEN 'Buckwheat & French Marigold'
        WHEN p.name ILIKE '%field b%' OR p.name ILIKE '%zone 2%' THEN 'Mustard & Crimson Clover'
        WHEN p.name ILIKE '%field c%' THEN 'Cowpea & Barley'
        ELSE 'Sunn hemp & Dhaincha (Sesbania)'
    END,
    CASE
        WHEN p.name ILIKE '%greenhouse%' OR p.name ILIKE '%polyhouse%' OR p.name ILIKE '%zone 3%' THEN CURRENT_DATE + INTERVAL '30 days'
        WHEN p.name ILIKE '%field b%' OR p.name ILIKE '%zone 2%' THEN CURRENT_DATE + INTERVAL '60 days'
        ELSE CURRENT_DATE + INTERVAL '15 days'
    END,
    CASE
        WHEN p.name ILIKE '%greenhouse%' OR p.name ILIKE '%polyhouse%' OR p.name ILIKE '%zone 3%' THEN CURRENT_DATE + INTERVAL '75 days'
        WHEN p.name ILIKE '%field b%' OR p.name ILIKE '%zone 2%' THEN CURRENT_DATE + INTERVAL '105 days'
        ELSE CURRENT_DATE + INTERVAL '60 days'
    END,
    now() - INTERVAL '30 days'
FROM plots p;
