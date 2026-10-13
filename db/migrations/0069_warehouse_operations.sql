-- =============================================================================
-- 0069_warehouse_operations.sql
-- Four warehouse-operations features, all DERIVED rules (no requirement document or screen):
--   * BR-102 inter-warehouse transfers: completes the stock_transfers model of 0005 (BR-26);
--   * BR-103 warehouse operational issues (+ an append-only comment thread);
--   * BR-104 the warehouse activity feed: READ-ONLY, a UNION over existing tables, so it has
--     NO table of its own here (see docs/rules.md BR-104 for why);
--   * BR-105 warehouse documents (licences, FSSAI, fire safety, lease, insurance ...).
-- Business thresholds live in system_config (CLAUDE.md 2.7), seeded below with DO NOTHING so a
-- re-run never overwrites a value an admin has since changed.
-- =============================================================================

-- +migrate Up

-- -----------------------------------------------------------------------------
-- BR-102: stock_transfers / stock_transfer_items (tables from 0005, no endpoint until now)
-- -----------------------------------------------------------------------------
-- The 0005 status list had no "waiting for the high-value approver" state. DRAFT and APPROVED
-- stay legal so the CHECK never rejects a row an earlier build could have written; the
-- service never writes them.
ALTER TABLE stock_transfers DROP CONSTRAINT IF EXISTS stock_transfers_status_check;
ALTER TABLE stock_transfers
    ADD CONSTRAINT stock_transfers_status_check
        CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'));

ALTER TABLE stock_transfers
    ADD COLUMN total_value_paise  bigint      NOT NULL DEFAULT 0 CHECK (total_value_paise >= 0),
    ADD COLUMN has_unvalued_lines boolean     NOT NULL DEFAULT false,
    ADD COLUMN requires_approval  boolean     NOT NULL DEFAULT false,
    ADD COLUMN has_discrepancy    boolean     NOT NULL DEFAULT false,
    ADD COLUMN receipt_note       text        CHECK (receipt_note IS NULL OR char_length(receipt_note) <= 1000),
    ADD COLUMN cancelled_by       uuid        REFERENCES users (id),
    ADD COLUMN cancelled_at       timestamptz,
    ADD COLUMN cancel_reason      text        CHECK (cancel_reason IS NULL OR char_length(cancel_reason) <= 500),
    -- BR-102: the approver of a high-value transfer is never its initiator (as BR-37a for adjustments).
    ADD CONSTRAINT stock_transfers_no_self_approval_chk
        CHECK (approved_by IS NULL OR approved_by <> initiated_by),
    ADD CONSTRAINT stock_transfers_approved_pair_chk
        CHECK ((approved_by IS NULL) = (approved_at IS NULL)),
    ADD CONSTRAINT stock_transfers_cancelled_pair_chk
        CHECK ((cancelled_by IS NULL) = (cancelled_at IS NULL)),
    ADD CONSTRAINT stock_transfers_received_pair_chk
        CHECK ((received_by IS NULL) = (received_at IS NULL));

CREATE INDEX idx_stock_transfers_cancelled_by ON stock_transfers (cancelled_by);
CREATE INDEX idx_stock_transfers_status       ON stock_transfers (status, created_at DESC);
CREATE INDEX idx_stock_transfers_from_created ON stock_transfers (from_warehouse_id, created_at DESC);
CREATE INDEX idx_stock_transfers_to_created   ON stock_transfers (to_warehouse_id, created_at DESC);

ALTER TABLE stock_transfer_items
    -- Snapshot of the source batch's cost at creation, so the transfer value never drifts.
    ADD COLUMN cost_per_kg       numeric(12,2) CHECK (cost_per_kg IS NULL OR cost_per_kg >= 0),
    ADD COLUMN line_value_paise  bigint        CHECK (line_value_paise IS NULL OR line_value_paise >= 0),
    -- The batch created in the destination warehouse when the line is received with qty > 0.
    ADD COLUMN dest_batch_id     uuid          REFERENCES inventory_batches (id),
    ADD CONSTRAINT stock_transfer_items_no_over_receipt_chk
        CHECK (qty_received IS NULL OR qty_received <= qty_sent);

CREATE INDEX idx_stock_transfer_items_dest_batch ON stock_transfer_items (dest_batch_id);

-- TRF-000001, ... : unique under concurrency, never reused.
CREATE SEQUENCE IF NOT EXISTS stock_transfer_number_seq START WITH 1 INCREMENT BY 1;
ALTER SEQUENCE stock_transfer_number_seq OWNED BY stock_transfers.transfer_number;

COMMENT ON TABLE stock_transfers IS
    'BR-26 / BR-102: inter-warehouse movement. Only SUPER_ADMIN and MAIN_WH_ADMIN initiate. '
    'PENDING_APPROVAL (value >= system_config.transfer_high_value_threshold_paise, or any line '
    'without a cost) -> IN_TRANSIT (TRANSFER_OUT ledger rows written in the same transaction) -> '
    'RECEIVED (TRANSFER_IN rows into new destination batches); CANCELLED only before dispatch. '
    'Quantities move ONLY through stock_ledger; nothing here is a balance.';

-- -----------------------------------------------------------------------------
-- BR-103: warehouse_issues + warehouse_issue_comments (append-only)
-- -----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS warehouse_issue_number_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE warehouse_issues (
    id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_number     text        NOT NULL UNIQUE,
    warehouse_id     uuid        NOT NULL REFERENCES warehouses (id),
    category         text        NOT NULL
                                 CHECK (category IN ('EQUIPMENT', 'STORAGE', 'QUALITY', 'SAFETY', 'STAFFING', 'OTHER')),
    severity         text        NOT NULL
                                 CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    title            text        NOT NULL CHECK (btrim(title) <> '' AND char_length(title) <= 160),
    description      text        CHECK (description IS NULL OR (btrim(description) <> '' AND char_length(description) <= 4000)),
    status           text        NOT NULL DEFAULT 'OPEN'
                                 CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    reported_by      uuid        NOT NULL REFERENCES users (id),
    assigned_to      uuid        REFERENCES users (id),
    resolution_note  text        CHECK (resolution_note IS NULL OR (btrim(resolution_note) <> '' AND char_length(resolution_note) <= 2000)),
    resolved_by      uuid        REFERENCES users (id),
    resolved_at      timestamptz,
    closed_at        timestamptz,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz,
    -- BR-103: a resolved or closed issue always says how it was resolved.
    CONSTRAINT warehouse_issues_resolution_chk
        CHECK (status NOT IN ('RESOLVED', 'CLOSED') OR (resolution_note IS NOT NULL AND resolved_at IS NOT NULL)),
    CONSTRAINT warehouse_issues_closed_chk
        CHECK ((status = 'CLOSED') = (closed_at IS NOT NULL))
);

ALTER SEQUENCE warehouse_issue_number_seq OWNED BY warehouse_issues.issue_number;

CREATE INDEX idx_warehouse_issues_warehouse   ON warehouse_issues (warehouse_id, created_at DESC);
CREATE INDEX idx_warehouse_issues_open        ON warehouse_issues (warehouse_id, severity) WHERE status IN ('OPEN', 'IN_PROGRESS');
CREATE INDEX idx_warehouse_issues_reported_by ON warehouse_issues (reported_by);
CREATE INDEX idx_warehouse_issues_assigned_to ON warehouse_issues (assigned_to);
CREATE INDEX idx_warehouse_issues_resolved_by ON warehouse_issues (resolved_by);

COMMENT ON TABLE warehouse_issues IS
    'BR-103: operational issues of one warehouse (equipment, storage, quality, safety, staffing). '
    'Warehouse-scoped (BR-30). Status moves only along the transitions in docs/rules.md BR-103; '
    'rows are never deleted. Audit images carry ids, category, severity and status only, never '
    'the free text.';

CREATE TABLE warehouse_issue_comments (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id    uuid        NOT NULL REFERENCES warehouse_issues (id),
    author_id   uuid        NOT NULL REFERENCES users (id),
    body        text        NOT NULL CHECK (btrim(body) <> '' AND char_length(body) <= 2000),
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_warehouse_issue_comments_issue  ON warehouse_issue_comments (issue_id, created_at);
CREATE INDEX idx_warehouse_issue_comments_author ON warehouse_issue_comments (author_id);

SELECT app_make_append_only('warehouse_issue_comments');

COMMENT ON TABLE warehouse_issue_comments IS
    'BR-103: APPEND-ONLY comment thread of a warehouse issue. A comment is never edited or deleted.';

-- -----------------------------------------------------------------------------
-- BR-105: warehouse_documents
-- -----------------------------------------------------------------------------
CREATE TABLE warehouse_documents (
    id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id     uuid        NOT NULL REFERENCES warehouses (id),
    doc_type         text        NOT NULL
                                 CHECK (doc_type IN ('LICENSE', 'FSSAI', 'FIRE_SAFETY', 'LEASE', 'INSURANCE', 'OTHER')),
    title            text        NOT NULL CHECK (btrim(title) <> '' AND char_length(title) <= 160),
    document_number  text        CHECK (document_number IS NULL OR (btrim(document_number) <> '' AND char_length(document_number) <= 80)),
    issue_date       date,
    expiry_date      date,
    upload_id        uuid        NOT NULL REFERENCES uploads (id),
    uploaded_by      uuid        NOT NULL REFERENCES users (id),
    archived_at      timestamptz,
    archived_by      uuid        REFERENCES users (id),
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz,
    CONSTRAINT warehouse_documents_dates_chk
        CHECK (issue_date IS NULL OR expiry_date IS NULL OR expiry_date >= issue_date),
    CONSTRAINT warehouse_documents_archived_pair_chk
        CHECK ((archived_at IS NULL) = (archived_by IS NULL))
);

-- One stored file backs at most one live document.
CREATE UNIQUE INDEX uq_warehouse_documents_upload ON warehouse_documents (upload_id) WHERE archived_at IS NULL;
CREATE INDEX idx_warehouse_documents_warehouse   ON warehouse_documents (warehouse_id, created_at DESC);
CREATE INDEX idx_warehouse_documents_expiry      ON warehouse_documents (warehouse_id, expiry_date) WHERE archived_at IS NULL;
CREATE INDEX idx_warehouse_documents_uploaded_by ON warehouse_documents (uploaded_by);
CREATE INDEX idx_warehouse_documents_archived_by ON warehouse_documents (archived_by);

COMMENT ON TABLE warehouse_documents IS
    'BR-105: compliance and property documents of one warehouse. The file is an uploads row '
    '(object storage behind the one adapter); this row is metadata. Status (ACTIVE, EXPIRING_SOON, '
    'EXPIRED, ARCHIVED) is DERIVED at read time from expiry_date, archived_at and '
    'system_config.warehouse_document_expiry_warning_days; it is never stored. Archive, never delete.';

-- -----------------------------------------------------------------------------
-- system_config (CLAUDE.md 2.7)
-- -----------------------------------------------------------------------------
INSERT INTO system_config (key, value, data_type, description) VALUES
    ('transfer_high_value_threshold_paise',
     '5000000'::jsonb, 'number',
     'BR-102: an inter-warehouse transfer whose total value (sum of qty x batch cost, integer paise) is at or above this figure needs transfer.high_value.approve before it is dispatched. Default Rs 50,000 is UNCONFIRMED (rbac.json: "threshold undefined").'),
    ('warehouse_document_expiry_warning_days',
     '30'::jsonb, 'number',
     'BR-105: a warehouse document whose expiry date is within this many days of today (Asia/Kolkata) is EXPIRING_SOON. Default 30 is UNCONFIRMED.')
ON CONFLICT (key) DO NOTHING;

-- +migrate Down

DELETE FROM system_config WHERE key IN ('transfer_high_value_threshold_paise', 'warehouse_document_expiry_warning_days');

DROP TABLE IF EXISTS warehouse_documents;
DROP TABLE IF EXISTS warehouse_issue_comments;
DROP TABLE IF EXISTS warehouse_issues;
DROP SEQUENCE IF EXISTS warehouse_issue_number_seq;

DROP SEQUENCE IF EXISTS stock_transfer_number_seq;
DROP INDEX IF EXISTS idx_stock_transfer_items_dest_batch;
ALTER TABLE stock_transfer_items
    DROP CONSTRAINT IF EXISTS stock_transfer_items_no_over_receipt_chk,
    DROP COLUMN IF EXISTS dest_batch_id,
    DROP COLUMN IF EXISTS line_value_paise,
    DROP COLUMN IF EXISTS cost_per_kg;

DROP INDEX IF EXISTS idx_stock_transfers_to_created;
DROP INDEX IF EXISTS idx_stock_transfers_from_created;
DROP INDEX IF EXISTS idx_stock_transfers_status;
DROP INDEX IF EXISTS idx_stock_transfers_cancelled_by;
ALTER TABLE stock_transfers
    DROP CONSTRAINT IF EXISTS stock_transfers_received_pair_chk,
    DROP CONSTRAINT IF EXISTS stock_transfers_cancelled_pair_chk,
    DROP CONSTRAINT IF EXISTS stock_transfers_approved_pair_chk,
    DROP CONSTRAINT IF EXISTS stock_transfers_no_self_approval_chk,
    DROP COLUMN IF EXISTS cancel_reason,
    DROP COLUMN IF EXISTS cancelled_at,
    DROP COLUMN IF EXISTS cancelled_by,
    DROP COLUMN IF EXISTS receipt_note,
    DROP COLUMN IF EXISTS has_discrepancy,
    DROP COLUMN IF EXISTS requires_approval,
    DROP COLUMN IF EXISTS has_unvalued_lines,
    DROP COLUMN IF EXISTS total_value_paise;
ALTER TABLE stock_transfers DROP CONSTRAINT IF EXISTS stock_transfers_status_check;
ALTER TABLE stock_transfers
    ADD CONSTRAINT stock_transfers_status_check
        CHECK (status IN ('DRAFT', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'));
