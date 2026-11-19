-- Migration 0092: Batch 7 orders and returns parity fields
-- Links warehouse issues to orders, and adds extended RMA inspection and customer evidence fields.

-- +migrate Up

ALTER TABLE warehouse_issues
    ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES orders (id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS order_line_ids jsonb;

CREATE INDEX IF NOT EXISTS idx_warehouse_issues_order_id ON warehouse_issues (order_id) WHERE order_id IS NOT NULL;

ALTER TABLE return_requests
    ADD COLUMN IF NOT EXISTS issue_category text,
    ADD COLUMN IF NOT EXISTS issue_ticket text,
    ADD COLUMN IF NOT EXISTS requested_resolution text,
    ADD COLUMN IF NOT EXISTS customer_evidence text[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS inspection_notes text,
    ADD COLUMN IF NOT EXISTS inspection_photos text[] NOT NULL DEFAULT '{}';

-- +migrate Down

ALTER TABLE return_requests
    DROP COLUMN IF EXISTS inspection_photos,
    DROP COLUMN IF EXISTS inspection_notes,
    DROP COLUMN IF EXISTS customer_evidence,
    DROP COLUMN IF EXISTS requested_resolution,
    DROP COLUMN IF EXISTS issue_ticket,
    DROP COLUMN IF EXISTS issue_category;

DROP INDEX IF EXISTS idx_warehouse_issues_order_id;

ALTER TABLE warehouse_issues
    DROP COLUMN IF EXISTS order_line_ids,
    DROP COLUMN IF EXISTS order_id;
