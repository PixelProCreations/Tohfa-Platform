-- Migration 0096: Backend gaps batch (warehouse staff details, payment methods, admin reports, alert thresholds)
-- Supports Warehouse Staff Details (BR-167), Payment Methods (BR-171), Admin Reports (BR-172),
-- and Alerts Thresholds (BR-174).

-- +migrate Up

-- 1. Warehouse staff bank accounts
CREATE TABLE IF NOT EXISTS warehouse_staff_bank_accounts (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id            uuid        NOT NULL REFERENCES warehouse_staff(id) ON DELETE CASCADE UNIQUE,
    account_holder_name text        NOT NULL CHECK (btrim(account_holder_name) <> ''),
    account_number      text        NOT NULL CHECK (btrim(account_number) <> ''),
    ifsc                text        NOT NULL CHECK (btrim(ifsc) <> ''),
    bank_name           text        NOT NULL CHECK (btrim(bank_name) <> ''),
    branch_name         text        NOT NULL CHECK (btrim(branch_name) <> ''),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wh_staff_bank_accounts_staff ON warehouse_staff_bank_accounts(staff_id);

-- 2. Warehouse staff documents
CREATE TABLE IF NOT EXISTS warehouse_staff_documents (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id        uuid        NOT NULL REFERENCES warehouse_staff(id) ON DELETE CASCADE,
    document_type   text        NOT NULL CHECK (document_type IN ('AADHAAR', 'PAN', 'DRIVING_LICENSE', 'PASSBOOK')),
    document_number text        NOT NULL CHECK (btrim(document_number) <> ''),
    file_url        text        NOT NULL CHECK (btrim(file_url) <> ''),
    created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wh_staff_documents_staff ON warehouse_staff_documents(staff_id);

-- 3. Warehouse staff emergency contacts
CREATE TABLE IF NOT EXISTS warehouse_staff_emergency_contacts (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id     uuid        NOT NULL REFERENCES warehouse_staff(id) ON DELETE CASCADE UNIQUE,
    name         text        NOT NULL CHECK (btrim(name) <> ''),
    relationship text        NOT NULL CHECK (btrim(relationship) <> ''),
    mobile       text        NOT NULL CHECK (btrim(mobile) <> ''),
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wh_staff_emergency_contacts_staff ON warehouse_staff_emergency_contacts(staff_id);

-- 4. Payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    type        text        NOT NULL CHECK (type IN ('CASH', 'UPI', 'BANK_TRANSFER', 'CARD')),
    label       text        NOT NULL CHECK (btrim(label) <> ''),
    is_default  boolean     NOT NULL DEFAULT false,
    config      jsonb       NOT NULL DEFAULT '{}',
    is_active   boolean     NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_methods_one_default ON payment_methods (is_default) WHERE is_default = true;

-- 5. Admin saved reports
CREATE TABLE IF NOT EXISTS admin_reports (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    type         text        NOT NULL,
    title        text        NOT NULL CHECK (btrim(title) <> ''),
    warehouse_id uuid        REFERENCES warehouses(id) ON DELETE SET NULL,
    from_date    date,
    to_date      date,
    generated_at timestamptz NOT NULL DEFAULT now(),
    generated_by uuid        REFERENCES users(id) ON DELETE SET NULL,
    summary      jsonb       NOT NULL DEFAULT '{}',
    rows         jsonb       NOT NULL DEFAULT '[]'
);
CREATE INDEX IF NOT EXISTS idx_admin_reports_type ON admin_reports(type);
CREATE INDEX IF NOT EXISTS idx_admin_reports_warehouse ON admin_reports(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_admin_reports_generated ON admin_reports(generated_at DESC);

-- 6. Alerts threshold configuration in system_config
INSERT INTO system_config (key, value, data_type, description)
VALUES
    ('alert_threshold_stock_pct', '15', 'number', 'Low stock alert threshold percentage'),
    ('alert_threshold_audit_overdue_days', '7', 'number', 'Days after which an incomplete audit triggers an overdue alert')
ON CONFLICT (key) DO NOTHING;

-- +migrate Down

DELETE FROM system_config WHERE key IN ('alert_threshold_stock_pct', 'alert_threshold_audit_overdue_days');
DROP TABLE IF EXISTS admin_reports;
DROP TABLE IF EXISTS payment_methods;
DROP TABLE IF EXISTS warehouse_staff_emergency_contacts;
DROP TABLE IF EXISTS warehouse_staff_documents;
DROP TABLE IF EXISTS warehouse_staff_bank_accounts;
