-- =============================================================================
-- 0079_storage_location_hierarchy.sql
-- BR-125: storage locations form a per-warehouse tree, and an inventory batch is LINKED to the
-- location it was placed in at quality check (BR-106).
--
--   1. storage_locations.parent_id: optional parent in the SAME warehouse. The composite foreign key
--      (parent_id, warehouse_id) -> (id, warehouse_id) makes a cross-warehouse parent impossible in
--      the database, not only in the service. A location is never its own parent (CHECK), and
--      trg_storage_locations_no_cycle refuses any parent chain that loops back (the service checks
--      first; this is the backstop). The trigger takes a per-warehouse advisory transaction lock
--      before walking the chain, so two concurrent re-parentings cannot each pass and together form
--      a cycle.
--
--      The LEVEL is NOT stored: it is derived at read time (root = 0, child = parent + 1) by a
--      recursive query over this table. A stored level would be a second copy that every
--      re-parenting of a subtree must rewrite; derived, it can never disagree with parent_id.
--      The maximum depth is system_config.storage_location_max_depth (seeded 4 tiers, levels 0-3,
--      UNCONFIRMED), enforced by the service when a parent is set.
--
--   2. inventory_batches.storage_location_id and quality_checks.storage_location_id: nullable links
--      to the location, each with a composite foreign key on (storage_location_id, warehouse_id) so a
--      batch can only be placed in a location of its own warehouse. The free-text storage_location
--      columns (0005, 0070) are KEPT and stay readable: old batches carry only text.
--
--   3. Backfill: a batch whose free text matches exactly ONE live location of its own warehouse by
--      name or by code (trimmed, case-insensitive) is linked to it; any other batch (no text, no
--      match, or several candidate locations) is left NULL. The counts are raised as a NOTICE.
--      quality_checks are not backfilled: their text is copied as before when a deferred batch is
--      created (BR-106 item 6), and such a batch is then unlinked like any other old one.
--
-- Nothing here touches stock_ledger or qty_available (CLAUDE.md 2.3).
-- =============================================================================

-- +migrate Up

ALTER TABLE storage_locations
    ADD CONSTRAINT uq_storage_locations_id_warehouse UNIQUE (id, warehouse_id),
    ADD COLUMN parent_id uuid,
    ADD CONSTRAINT storage_locations_parent_fk
        FOREIGN KEY (parent_id, warehouse_id) REFERENCES storage_locations (id, warehouse_id),
    ADD CONSTRAINT storage_locations_not_own_parent_chk
        CHECK (parent_id IS NULL OR parent_id <> id);

CREATE INDEX idx_storage_locations_parent_id ON storage_locations (parent_id) WHERE parent_id IS NOT NULL;

COMMENT ON COLUMN storage_locations.parent_id IS
    'BR-125: the parent location, in the same warehouse (composite FK); NULL for a root. The level is '
    'derived at read time (root 0), never stored. No cycles (trg_storage_locations_no_cycle).';

CREATE OR REPLACE FUNCTION storage_locations_no_cycle() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    v_loops boolean;
BEGIN
    IF NEW.parent_id IS NULL THEN
        RETURN NEW;
    END IF;
    -- Serialise hierarchy changes per warehouse: the walk below then sees every committed change.
    PERFORM pg_advisory_xact_lock(hashtextextended('storage_location_tree:' || NEW.warehouse_id::text, 0));

    WITH RECURSIVE up AS (
        SELECT l.id, l.parent_id, 1 AS depth
          FROM storage_locations l
         WHERE l.id = NEW.parent_id
        UNION ALL
        SELECT p.id, p.parent_id, up.depth + 1
          FROM storage_locations p
          JOIN up ON p.id = up.parent_id
         WHERE up.depth < 10000 AND up.id <> NEW.id
    )
    SELECT EXISTS (SELECT 1 FROM up WHERE up.id = NEW.id) INTO v_loops;

    IF v_loops THEN
        RAISE EXCEPTION 'storage location % cannot be placed under its own descendant %', NEW.id, NEW.parent_id
            USING ERRCODE = '23514', HINT = 'code: STORAGE_LOCATION_CYCLE';
    END IF;
    RETURN NEW;
END
$$;

CREATE TRIGGER trg_storage_locations_no_cycle
    BEFORE INSERT OR UPDATE OF parent_id, warehouse_id ON storage_locations
    FOR EACH ROW EXECUTE FUNCTION storage_locations_no_cycle();

ALTER TABLE inventory_batches
    ADD COLUMN storage_location_id uuid,
    ADD CONSTRAINT inventory_batches_storage_location_fk
        FOREIGN KEY (storage_location_id, warehouse_id) REFERENCES storage_locations (id, warehouse_id);

CREATE INDEX idx_inventory_batches_storage_location_id
    ON inventory_batches (storage_location_id) WHERE storage_location_id IS NOT NULL;

COMMENT ON COLUMN inventory_batches.storage_location_id IS
    'BR-125: the storage location (same warehouse, composite FK) the batch was placed in at quality '
    'check (BR-106) or transfer receipt (BR-126). NULL when none was named, and for old batches whose '
    'free text did not match exactly one location. storage_location (text) is kept alongside.';

ALTER TABLE quality_checks
    ADD COLUMN storage_location_id uuid,
    ADD CONSTRAINT quality_checks_storage_location_fk
        FOREIGN KEY (storage_location_id, warehouse_id) REFERENCES storage_locations (id, warehouse_id);

COMMENT ON COLUMN quality_checks.storage_location_id IS
    'BR-125: the inspector''s storage location, copied to the batch (BR-106), including a batch deferred '
    'by a quality counter-offer.';

-- Backfill the unambiguous matches only.
DO $$
DECLARE
    v_with_text bigint;
    v_linked    bigint;
BEGIN
    SELECT count(*) INTO v_with_text
      FROM inventory_batches
     WHERE storage_location IS NOT NULL AND btrim(storage_location) <> '';

    WITH candidates AS (
        SELECT b.id AS batch_id, l.id AS location_id
          FROM inventory_batches b
          JOIN storage_locations l
            ON l.warehouse_id = b.warehouse_id
           AND l.deleted_at IS NULL
           AND (lower(btrim(l.name)) = lower(btrim(b.storage_location))
                OR lower(btrim(l.code)) = lower(btrim(b.storage_location)))
         WHERE b.storage_location IS NOT NULL
           AND b.storage_location_id IS NULL
    ),
    unique_match AS (
        SELECT batch_id, min(location_id::text)::uuid AS location_id
          FROM candidates
         GROUP BY batch_id
        HAVING count(DISTINCT location_id) = 1
    )
    UPDATE inventory_batches b
       SET storage_location_id = u.location_id
      FROM unique_match u
     WHERE b.id = u.batch_id;
    GET DIAGNOSTICS v_linked = ROW_COUNT;

    RAISE NOTICE 'BR-125 backfill: % batches carry storage-location text, % linked to exactly one location, % left unlinked',
        v_with_text, v_linked, v_with_text - v_linked;
END
$$;

INSERT INTO system_config (key, value, data_type, description) VALUES
    ('storage_location_max_depth',
     '4'::jsonb, 'number',
     'BR-125: the maximum number of tiers of the storage-location tree of one warehouse (levels 0 to this minus 1; e.g. zone, rack, shelf, bin). Default 4 is UNCONFIRMED.')
ON CONFLICT (key) DO NOTHING;

-- +migrate Down

DELETE FROM system_config WHERE key = 'storage_location_max_depth';

ALTER TABLE quality_checks
    DROP CONSTRAINT IF EXISTS quality_checks_storage_location_fk,
    DROP COLUMN IF EXISTS storage_location_id;

DROP INDEX IF EXISTS idx_inventory_batches_storage_location_id;
ALTER TABLE inventory_batches
    DROP CONSTRAINT IF EXISTS inventory_batches_storage_location_fk,
    DROP COLUMN IF EXISTS storage_location_id;

DROP TRIGGER IF EXISTS trg_storage_locations_no_cycle ON storage_locations;
DROP FUNCTION IF EXISTS storage_locations_no_cycle();

DROP INDEX IF EXISTS idx_storage_locations_parent_id;
ALTER TABLE storage_locations
    DROP CONSTRAINT IF EXISTS storage_locations_not_own_parent_chk,
    DROP CONSTRAINT IF EXISTS storage_locations_parent_fk,
    DROP COLUMN IF EXISTS parent_id,
    DROP CONSTRAINT IF EXISTS uq_storage_locations_id_warehouse;
