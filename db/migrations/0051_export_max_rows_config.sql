-- =============================================================================
-- 0051_export_max_rows_config.sql
-- BR-76: the most data rows a CSV export under GET /v1/admin/exports/{report} may contain is a
-- system_config value, not a literal in the schema or service (CLAUDE.md section 2.7).
-- =============================================================================

-- +migrate Up
-- DO NOTHING, not DO UPDATE: re-running must never overwrite a value an admin has since changed.
INSERT INTO system_config (key, value, data_type, description) VALUES
    ('export_max_rows',
     '50000'::jsonb, 'number',
     'BR-76: the most data rows (the header row is not counted) one CSV export under GET /v1/admin/exports/{report} may contain. An export that would exceed it is 422 VALIDATION_FAILED on query.to asking the caller to narrow the range; it is never truncated. report-exports.repo.ts reads this key (fallback 50000 when the row is missing or not a non-negative integer) -- it is NOT a literal in the schema or service. 50000 is an UNCONFIRMED default, not a client-stated limit.')
ON CONFLICT (key) DO NOTHING;

-- +migrate Down
DELETE FROM system_config WHERE key = 'export_max_rows';
