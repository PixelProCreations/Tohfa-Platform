-- =============================================================================
-- 0206_approved_inputs_catalog.sql
-- D11: Approved Inputs & Soil Inputs Catalogue matching Admin Inputs screens
-- (ApprovedInputsScreen, InputDetailScreen) and farmer read of APPROVED inputs.
-- =============================================================================

-- +migrate Up
CREATE TABLE IF NOT EXISTS approved_inputs (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code               text        NOT NULL CHECK (btrim(code) <> ''),
  name               text        NOT NULL CHECK (btrim(name) <> ''),
  category           text        NOT NULL CHECK (btrim(category) <> ''),
  subcategory        text,
  farming_type       text,
  manufacturer       text        NOT NULL CHECK (btrim(manufacturer) <> ''),
  registration_id    text,
  composition        text,
  applicable_crops   text[]      NOT NULL DEFAULT '{}',
  dosage             text,
  application_method text,
  status             text        NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('APPROVED', 'PENDING', 'INACTIVE')),
  reference_note     text,
  status_reason      text,
  supporting_docs    jsonb       NOT NULL DEFAULT '[]'::jsonb,
  approved_by        uuid        REFERENCES users(id),
  approved_at        timestamptz,
  created_by         uuid        REFERENCES users(id),
  updated_by         uuid        REFERENCES users(id),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  deleted_at         timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_approved_inputs_code
  ON approved_inputs (lower(code)) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_approved_inputs_status
  ON approved_inputs (status, category) WHERE deleted_at IS NULL;

-- +migrate Down
DROP TABLE IF EXISTS approved_inputs;
