-- =============================================================================
-- 0112_customer_recent_searches.sql
-- BR-151: a customer's recent catalog searches (customer app search screen, "Recent searches").
--
-- One row per (customer, normalized query). Re-searching the same text upserts the row (moves it
-- to the top by searched_at and refreshes the display text), so the list never shows duplicates.
-- The per-customer cap is system_config `catalog.recent_searches_max` (0113); the service prunes
-- the oldest rows beyond it after every insert. The trending aggregate (k-anonymous, BR-151) reads
-- this table by normalized_query + searched_at and never returns a customer id.
-- =============================================================================

-- +migrate Up

CREATE TABLE customer_recent_searches (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id       uuid        NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
    query             text        NOT NULL CHECK (char_length(query) BETWEEN 1 AND 80),
    -- lower(trim(query)) with internal whitespace runs collapsed to one space; computed by the
    -- service (normalizeSearchQuery). Only the trim is re-checked here: a lower() check would
    -- depend on the database collation and could reject a value JS lower-cased differently.
    normalized_query  text        NOT NULL CHECK (
                                      char_length(normalized_query) BETWEEN 1 AND 80
                                      AND normalized_query = btrim(normalized_query)
                                  ),
    searched_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT customer_recent_searches_unique_query UNIQUE (customer_id, normalized_query)
);

-- "My recent searches, newest first" and the prune-beyond-N step.
CREATE INDEX idx_customer_recent_searches_customer
    ON customer_recent_searches (customer_id, searched_at DESC, id DESC);

-- Trending: distinct customers per normalized query inside the window.
CREATE INDEX idx_customer_recent_searches_trending
    ON customer_recent_searches (searched_at, normalized_query);

COMMENT ON TABLE customer_recent_searches IS
    'BR-151: per-customer recent catalog searches, capped at system_config catalog.recent_searches_max. Trending reads it only as a k-anonymous aggregate (catalog.trending_min_searchers distinct customers).';

-- +migrate Down

DROP TABLE IF EXISTS customer_recent_searches;
