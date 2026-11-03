-- =============================================================================
-- 0082_community_planting_config.sql
-- BR-135: the minimum distinct-farmer group size for the community planting summary
-- (TOHFA Calendar "What the community is growing"), kept in system_config rather than as a
-- literal in the service (CLAUDE.md section 2.7).
-- =============================================================================

-- +migrate Up
-- DO NOTHING, not DO UPDATE: re-running must never overwrite a value an admin has since changed.
INSERT INTO system_config (key, value, data_type, description) VALUES
    ('community_planting_min_farmers',
     '5'::jsonb, 'number',
     'BR-135: minimum number of DISTINCT farmers a group must have before the community planting summary releases it (k-anonymity). A crop row, the folded Other bucket and a region filter option are each shown only at or above this count; totals cover released groups only. Must be a JSON integer >= 2: a missing or unusable value makes GET /farmers/community/planting-summary and /planting-filters answer 503 (no hard-coded fallback). 5 is an implementer placeholder (UNCONFIRMED): the client must confirm the value. The community-planting service reads this key -- it is NOT a literal in the schema or service.')
ON CONFLICT (key) DO NOTHING;

-- +migrate Down
DELETE FROM system_config WHERE key = 'community_planting_min_farmers';
