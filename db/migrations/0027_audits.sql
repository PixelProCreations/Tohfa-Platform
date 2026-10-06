-- =============================================================================
-- 0027_audits.sql
--
-- Audit Management (admin module 5): the quarterly farm audit (BR-03), its
-- 10-category score sheet (BR-06 categories, reused), its findings, and the
-- manual red flag (BR-05). Nothing audit-shaped existed before this migration:
-- 0001..0026 define only `audit_actor_type` and `audit_log`, which are the
-- SYSTEM audit trail (BR-35), a different concept from a farm audit. The
-- `audit.*` permission codes in docs/rbac.json predate this table.
--
-- Three tables:
--   audits                  one row per scheduled/conducted audit
--   audit_category_scores   one row per (audit, rating category), 0-10
--   audit_findings          violations/observations logged against an audit
--
-- SCORING (product decision 2026-10-01). An audit is scored on the SAME ten
-- seeded `rating_categories` as the farm rating, 0-10 each, summed directly to
-- a 0-100 `total_score`. The tier (POOR/MODERATE/GOOD/EXCELLENT) is NOT stored
-- here: it is resolved at read time from `rating_tier_config` (BR-04a), so
-- changing the config changes the tier a stored score maps to, with no backfill.
--
-- NO DERIVATION (BR-05, BR-38). An audit result changes nothing automatically —
-- not farmers.overall_rating, not certification, not payouts. There is
-- deliberately NO trigger in this file. `major_violations_count` is written by
-- the completion path (BR-05a); `red_flagged` is written ONLY by the explicit
-- admin red-flag / clear actions (BR-05b), never derived from the count —
-- BR-05 is CONTESTED (the source rule reads backwards) and stays deferred.
--
-- FISCAL YEAR / QUARTER. Indian fiscal year, April-March, labelled '2026-27'
-- (same format as invoices.service.ts calculateCurrentFiscalYear). Q1 = Apr-Jun,
-- Q2 = Jul-Sep, Q3 = Oct-Dec, Q4 = Jan-Mar. The API derives both columns from
-- `scheduled_for` in Asia/Kolkata on schedule and on every reschedule; they are
-- stored (not generated) so the BR-03a unique index can use them.
--
-- ZONE. `zone_id` is a snapshot of farmers.zone_id at scheduling time, the same
-- choice farm_ratings.zone_id made (0003). FARMER_ADMIN read scoping filters on
-- the farmer's CURRENT zone (farmers.zone_id), exactly as farm-ratings.repo.ts
-- does; this column is the historical "which zone was this audit run in".
-- =============================================================================

-- +migrate Up

CREATE TYPE audit_type AS ENUM (
    'INTERNAL',   -- conducted by a TOHFA admin (auditor_user_id)
    'EXTERNAL'    -- an outside agency visited; an admin records its report
);

CREATE TYPE audit_status AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);

CREATE TYPE finding_severity AS ENUM (
    'MAJOR',        -- counted into audits.major_violations_count (BR-05a)
    'MINOR',
    'OBSERVATION'
);

-- -----------------------------------------------------------------------------
-- audits
-- -----------------------------------------------------------------------------
CREATE TABLE audits (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- RESTRICT, not CASCADE: an audit is compliance history. Farmers are
    -- soft-deleted (farmers.deleted_at), so this never blocks normal flows.
    farmer_id               uuid         NOT NULL REFERENCES farmers (id) ON DELETE RESTRICT,
    farm_id                 uuid         REFERENCES farms (id),
    zone_id                 uuid         REFERENCES zones (id),
    fiscal_year             text         NOT NULL CHECK (fiscal_year ~ '^[0-9]{4}-[0-9]{2}$'),
    quarter                 smallint     NOT NULL CHECK (quarter BETWEEN 1 AND 4),
    audit_type              audit_type   NOT NULL,
    status                  audit_status NOT NULL DEFAULT 'SCHEDULED',
    scheduled_for           timestamptz  NOT NULL,
    started_at              timestamptz,
    completed_at            timestamptz,
    auditor_user_id         uuid         REFERENCES users (id),
    external_agency_name    text,
    report_upload_id        uuid         REFERENCES uploads (id),
    summary                 text,
    total_score             smallint     CHECK (total_score IS NULL OR total_score BETWEEN 0 AND 100),
    major_violations_count  integer      NOT NULL DEFAULT 0 CHECK (major_violations_count >= 0),
    red_flagged             boolean      NOT NULL DEFAULT false,
    red_flag_reason         text,
    red_flagged_by          uuid         REFERENCES users (id),
    red_flagged_at          timestamptz,
    cancelled_reason        text,
    cancelled_by            uuid         REFERENCES users (id),
    cancelled_at            timestamptz,
    created_by              uuid         NOT NULL REFERENCES users (id),
    created_at              timestamptz  NOT NULL DEFAULT now(),
    updated_at              timestamptz,

    -- An external audit is a record of an agency's visit; it must name the agency.
    CONSTRAINT audits_external_agency_chk
        CHECK (audit_type <> 'EXTERNAL'
               OR (external_agency_name IS NOT NULL AND btrim(external_agency_name) <> '')),
    CONSTRAINT audits_internal_no_agency_chk
        CHECK (audit_type <> 'INTERNAL' OR external_agency_name IS NULL),
    -- An internal audit may be scheduled before an auditor is assigned, but
    -- cannot be started or completed without one.
    CONSTRAINT audits_internal_auditor_chk
        CHECK (audit_type <> 'INTERNAL'
               OR status IN ('SCHEDULED', 'CANCELLED')
               OR auditor_user_id IS NOT NULL),
    CONSTRAINT audits_started_chk
        CHECK (status NOT IN ('IN_PROGRESS', 'COMPLETED') OR started_at IS NOT NULL),
    -- BR-06: a COMPLETED audit has its total. The "all 10 categories present"
    -- half of the rule spans rows, so the completion service enforces it
    -- (AUDIT_INCOMPLETE) inside the same transaction that sets this status.
    CONSTRAINT audits_completed_chk
        CHECK ((status = 'COMPLETED') = (completed_at IS NOT NULL)
               AND (status <> 'COMPLETED' OR total_score IS NOT NULL)),
    CONSTRAINT audits_cancelled_chk
        CHECK ((status = 'CANCELLED') = (cancelled_at IS NOT NULL)
               AND (status <> 'CANCELLED'
                    OR (cancelled_reason IS NOT NULL AND cancelled_by IS NOT NULL))),
    -- BR-05b: a red flag always says who raised it and why.
    CONSTRAINT audits_red_flag_chk
        CHECK (red_flagged = false
               OR (red_flag_reason IS NOT NULL AND red_flagged_by IS NOT NULL
                   AND red_flagged_at IS NOT NULL))
);

-- BR-03a: one live audit per (farmer, fiscal year, quarter). PARTIAL on
-- status <> 'CANCELLED' on purpose: cancelling an audit frees its quarter so a
-- replacement can be scheduled, while the cancelled row stays as history. The
-- database, not a check-then-insert in the service, is what makes two
-- concurrent schedule requests unable to both win; the API maps the unique
-- violation to 409 AUDIT_QUARTER_TAKEN.
CREATE UNIQUE INDEX uq_audits_farmer_fy_quarter
    ON audits (farmer_id, fiscal_year, quarter)
    WHERE status <> 'CANCELLED';

COMMENT ON INDEX uq_audits_farmer_fy_quarter IS
    'BR-03a: at most one non-cancelled audit per (farmer, fiscal_year, quarter). '
    'Cancelled audits are excluded so cancelling frees the quarter. Violation -> '
    '409 AUDIT_QUARTER_TAKEN.';

CREATE INDEX idx_audits_farmer_id        ON audits (farmer_id);
CREATE INDEX idx_audits_farm_id          ON audits (farm_id);
CREATE INDEX idx_audits_zone_id          ON audits (zone_id);
CREATE INDEX idx_audits_status           ON audits (status);
CREATE INDEX idx_audits_scheduled_for    ON audits (scheduled_for);
CREATE INDEX idx_audits_fy_quarter       ON audits (fiscal_year, quarter);
CREATE INDEX idx_audits_auditor_user_id  ON audits (auditor_user_id);
CREATE INDEX idx_audits_report_upload_id ON audits (report_upload_id);
CREATE INDEX idx_audits_created_by       ON audits (created_by);
CREATE INDEX idx_audits_red_flagged      ON audits (farmer_id) WHERE red_flagged = true;

COMMENT ON TABLE audits IS
    'Quarterly farm audit (BR-03: four per farmer per April-March fiscal year, one '
    'per quarter, internal and external mixed). State machine SCHEDULED -> '
    'IN_PROGRESS -> COMPLETED, SCHEDULED|IN_PROGRESS -> CANCELLED; reschedule only '
    'while SCHEDULED; scores editable only while IN_PROGRESS; a COMPLETED audit is '
    'immutable except red-flag/clear and resolving findings. Results change '
    'NOTHING automatically (no rating, certification or payout effect).';
COMMENT ON COLUMN audits.total_score IS
    'Direct sum of the 10 audit_category_scores (0-100), set on completion. The '
    'tier is never stored: it is resolved from rating_tier_config at read time (BR-04a).';
COMMENT ON COLUMN audits.major_violations_count IS
    'BR-05a: number of MAJOR audit_findings, persisted (non-nullable) by the '
    'completion path. Never drives red_flagged.';
COMMENT ON COLUMN audits.red_flagged IS
    'BR-05b: set only by an explicit admin action (red-flag / clear-red-flag). '
    'No derivation rule exists — BR-05 is CONTESTED.';
COMMENT ON COLUMN audits.zone_id IS
    'Snapshot of farmers.zone_id when the audit was scheduled (mirrors '
    'farm_ratings.zone_id). FARMER_ADMIN scoping filters on the farmer''s current '
    'zone, as farm-ratings.repo.ts does.';
COMMENT ON COLUMN audits.external_agency_name IS
    'EXTERNAL audits only: the outside agency whose visit this row records. There '
    'is no agency login and no agency role; an admin enters the agency''s report.';
COMMENT ON COLUMN audits.report_upload_id IS
    'Optional uploaded file (typically the external agency''s own report). Not the '
    'generated TOHFA audit PDF, which is rendered on demand.';

-- -----------------------------------------------------------------------------
-- audit_category_scores — BR-06 categories, BR-06a range
-- -----------------------------------------------------------------------------
CREATE TABLE audit_category_scores (
    audit_id     uuid        NOT NULL REFERENCES audits (id) ON DELETE CASCADE,
    category_id  uuid        NOT NULL REFERENCES rating_categories (id),
    score        smallint    NOT NULL CHECK (score BETWEEN 0 AND 10),
    remarks      text,
    scored_by    uuid        NOT NULL REFERENCES users (id),
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz,
    PRIMARY KEY (audit_id, category_id)
);

CREATE INDEX idx_audit_category_scores_category_id ON audit_category_scores (category_id);
CREATE INDEX idx_audit_category_scores_scored_by   ON audit_category_scores (scored_by);

COMMENT ON TABLE audit_category_scores IS
    'One row per (audit, rating category). BR-06a: score is an integer 0-10, '
    'enforced by smallint + CHECK, not only by the service. BR-06b: the FK to the '
    'seeded rating_categories makes an 11th category impossible. A missing row '
    'means "not yet scored" (incomplete), never zero.';

-- -----------------------------------------------------------------------------
-- audit_findings
-- -----------------------------------------------------------------------------
CREATE TABLE audit_findings (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id           uuid             NOT NULL REFERENCES audits (id) ON DELETE CASCADE,
    category_id        uuid             REFERENCES rating_categories (id),
    severity           finding_severity NOT NULL,
    description        text             NOT NULL CHECK (btrim(description) <> ''),
    corrective_action  text,
    due_date           date,
    resolved_at        timestamptz,
    resolved_by        uuid             REFERENCES users (id),
    resolution_note    text,
    created_by         uuid             NOT NULL REFERENCES users (id),
    created_at         timestamptz      NOT NULL DEFAULT now(),
    updated_at         timestamptz,
    CONSTRAINT audit_findings_resolved_pair_chk
        CHECK ((resolved_at IS NULL) = (resolved_by IS NULL))
);

CREATE INDEX idx_audit_findings_audit_id    ON audit_findings (audit_id);
CREATE INDEX idx_audit_findings_category_id ON audit_findings (category_id);
CREATE INDEX idx_audit_findings_resolved_by ON audit_findings (resolved_by);
CREATE INDEX idx_audit_findings_created_by  ON audit_findings (created_by);
-- Drives the compliance view's "unresolved MAJOR findings" count.
CREATE INDEX idx_audit_findings_open_major
    ON audit_findings (audit_id) WHERE severity = 'MAJOR' AND resolved_at IS NULL;

COMMENT ON TABLE audit_findings IS
    'Violations and observations logged against an audit. Findings are added and '
    'edited while the audit is IN_PROGRESS; after COMPLETED only resolution '
    '(resolved_at/resolved_by/resolution_note) may change. MAJOR findings are '
    'counted into audits.major_violations_count on completion (BR-05a).';

SELECT app_attach_updated_at_triggers();

-- +migrate Down

DROP TABLE IF EXISTS audit_findings;
DROP TABLE IF EXISTS audit_category_scores;
DROP TABLE IF EXISTS audits;
DROP TYPE IF EXISTS finding_severity;
DROP TYPE IF EXISTS audit_status;
DROP TYPE IF EXISTS audit_type;
