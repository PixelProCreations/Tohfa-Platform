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
