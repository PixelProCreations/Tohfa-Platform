-- =============================================================================
-- 0113_catalog_search_config.sql
-- BR-151: the three business values behind recent searches and trending, kept in system_config
-- rather than as literals in a service (CLAUDE.md section 2.7). The catalog-search service fails
-- closed (INTERNAL) when any of them is missing or not a positive integer.
-- =============================================================================

-- +migrate Up
-- DO NOTHING, not DO UPDATE: re-running must never overwrite a value an admin has since changed.
INSERT INTO system_config (key, value, data_type, description) VALUES
    ('catalog.recent_searches_max',
     '10'::jsonb, 'number',
     'BR-151: how many recent searches each customer keeps; older rows are pruned on every new search. Implementer default 10 (product decision pending).'),
    ('catalog.trending_min_searchers',
     '3'::jsonb, 'number',
     'BR-151: k-anonymity threshold. A query trends only when at least this many DISTINCT customers searched it inside the window. Implementer default 3 (product decision pending).'),
    ('catalog.trending_window_days',
     '7'::jsonb, 'number',
     'BR-151: look-back window, in days, for trending queries and most-ordered products. Implementer default 7 (product decision pending).')
ON CONFLICT (key) DO NOTHING;

-- +migrate Down
DELETE FROM system_config
 WHERE key IN ('catalog.recent_searches_max', 'catalog.trending_min_searchers', 'catalog.trending_window_days');
