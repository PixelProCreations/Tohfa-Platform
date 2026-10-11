-- =============================================================================
-- 0064_sales_indexes.sql
-- SWA Modules 6 and 7. Indexes for the reads the new screens make:
--   * sales history / dashboard: one warehouse, one channel, a placed_at range (BR-96);
--   * customer scope for SWA: "has an order at this warehouse" (BR-91, D8);
--   * walk-in lookup by mobile at the counter (BR-86).
-- =============================================================================

-- +migrate Up

CREATE INDEX idx_orders_warehouse_channel_placed ON orders (warehouse_id, channel, placed_at);
CREATE INDEX idx_orders_customer_warehouse       ON orders (customer_id, warehouse_id);
CREATE INDEX idx_orders_walk_in_mobile           ON orders (walk_in_mobile)
    WHERE walk_in_mobile IS NOT NULL;

-- +migrate Down

DROP INDEX IF EXISTS idx_orders_walk_in_mobile;
DROP INDEX IF EXISTS idx_orders_customer_warehouse;
DROP INDEX IF EXISTS idx_orders_warehouse_channel_placed;
