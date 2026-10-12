-- =============================================================================
-- 0065_order_number_seq.sql
-- SWA Modules 6 and 7 (foundation). The order number sequence gets an owning migration.
--
-- `order_number_seq` feeds both online order numbers (orders.repo.ts generateOrderNumber) and
-- Direct/Market sale numbers (sales.repo.ts nextSaleNumber): `TOH-<year>-<6 digits>`, one shared
-- counter so the two can never collide on orders.order_number (UNIQUE). Until now no migration
-- created it: each caller ran `CREATE SEQUENCE IF NOT EXISTS order_number_seq` inside its own
-- transaction, which is DDL on the hot path, races on first use (two first transactions can both
-- try to create it), and leaves the schema without the object the code depends on.
--
-- Safe on every existing database:
--   * IF NOT EXISTS keeps a sequence the application already created lazily (and its position);
--   * setval only ever moves the sequence FORWARD, to the highest number already used by an
--     order (`TOH-YYYY-NNNNNN`) or the sequence's own last issued value, whichever is greater, so
--     the next nextval can never reissue a number that exists;
--   * on an empty database nothing is set and the first number is 000001, as before.
-- OWNED BY ties the sequence's life to orders.order_number (dropping the orders table drops it).
--
-- After this migration the two lazy CREATE SEQUENCE statements are redundant and should be removed
-- from orders.repo.ts and sales.repo.ts.
-- =============================================================================

-- +migrate Up

CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1 INCREMENT BY 1;

ALTER SEQUENCE order_number_seq OWNED BY orders.order_number;

DO $$
DECLARE
    v_max_used   bigint;
    v_seq_used   bigint;
    v_target     bigint;
BEGIN
    SELECT max((regexp_match(order_number, '^TOH-[0-9]{4}-([0-9]+)$'))[1]::bigint)
      INTO v_max_used
      FROM orders;

    SELECT CASE WHEN is_called THEN last_value ELSE last_value - 1 END
      INTO v_seq_used
      FROM order_number_seq;

    v_target := GREATEST(COALESCE(v_max_used, 0), COALESCE(v_seq_used, 0));
    IF v_target >= 1 THEN
        PERFORM setval('order_number_seq', v_target, true);
    END IF;
END
$$;

COMMENT ON SEQUENCE order_number_seq IS
    'Shared counter for TOH-YYYY-NNNNNN order and Direct/Market sale numbers (orders.order_number). '
    'Created by 0065; never reset (orders.order_number is UNIQUE across years).';

-- +migrate Down

-- Dropping the sequence loses its position. Only safe on a database being rolled back past the
-- point where orders are numbered; while the lazy CREATE SEQUENCE statements still exist in the
-- repos they would recreate it at 1 and collide with existing order numbers.
DROP SEQUENCE IF EXISTS order_number_seq;
