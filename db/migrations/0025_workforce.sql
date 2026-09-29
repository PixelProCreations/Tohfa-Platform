-- =============================================================================
-- 0025_workforce.sql
--
-- Farm Workforce (worker roster, daily attendance, payroll): backend for the
-- six farmer-app mobile mockups this stage wires up for real. This migration
-- is DB schema only -- stage 1 of 3, following the exact structural
-- precedent of 0021_soil_management.sql/0023_pest_management.sql: every
-- farmer-owned table's authorization is a single permission,
-- `farmer.workforce.manage_own` (docs/rbac.json), a new "Farm Workforce"
-- module distinct from the existing "Workforce & Staff" module (admin
-- account management -- SUPER_ADMIN/TOHFA_ADMIN creating other admin
-- accounts, docs/rbac.json ~line 2034), which has nothing to do with this
-- feature.
--
-- FARM-SCOPED, NOT PLOT-SCOPED. Every other farmer-owned diary in this repo
-- (soil, pest) FKs to `plots.id` because those records describe conditions
-- on one sub-division of land. Workers are different: a worker is hired by
-- the farm as a whole and moves between plots/zones over the course of a
-- day or a season, so `workers.farm_id` FKs directly to `farms.id`
-- (0003_farmers_and_farms.sql). `worker_attendance.farm_crop_id` is an
-- OPTIONAL link to the specific planting (`farm_crops`, 0004, itself
-- plot-scoped) a day of work went toward, so the crop-hours-summary report
-- can attribute labor cost to a crop without forcing every attendance row
-- to pick one.
--
-- BR-41 boundary (docs/rules.md): gross/net pay is NEVER a stored column on
-- any table below. `workers.pay_rate_paise` and `worker_attendance
-- .hours_worked` are the only inputs; every payroll figure an API response
-- returns (workforce/summary, workforce/payroll-summary,
-- workforce/crop-hours-summary) is computed at read time by one shared
-- server-side function over these raw rows plus `worker_advances` and
-- `worker_payouts`, the same "compute at read time, never store" discipline
-- BR-40 already establishes for soil classification labels.
--
-- BR-38 boundary (root CLAUDE.md; docs/rules.md "Open contradictions" row
-- 2): `worker_attendance` and `worker_payouts` are written exclusively by a
-- farmer acting through the mobile app (marking a worker present, running
-- payroll for a period). No scheduled job in this feature computes or
-- inserts an attendance or payout row -- there is no auto-attendance, no
-- auto-payroll-run, no system-generated payslip. `worker_advances` is the
-- same: an insert-only log of what a farmer handed a worker in cash, typed
-- in by the farmer, never inferred.
--
-- Money columns are integer paise (`*_paise`), matching root CLAUDE.md
-- §2.2 -- never a float -- and the convention `pest`'s `interval_days`/
-- `phi_days` set for small server-validated integers: `pay_rate_paise` and
-- `amount_paise` are CHECKed positive at the database level, not only in
-- the service layer.
--
-- Soft-delete via `deleted_at` on `workers` only, matching `farms`/`plots`'
-- own convention: a worker can be removed from the active roster, but
-- attendance/advance/payout history referencing them must survive for
-- payroll audit trail, so the FK is left CASCADE-free of any hard delete
-- path -- nothing in the application ever issues `DELETE FROM workers`.
-- `worker_attendance`/`worker_advances`/`worker_payouts` have no
-- `deleted_at` of their own: they are per-day/per-event rows a farmer edits
-- forward (a correction is a new row or an UPDATE), not soft-deletable
-- entities in their own right -- matching `soil_test_records`/
-- `pest_detections`, which also have no `deleted_at`.
--
-- id_proof_upload_id/photo_upload_id reference `uploads(id)`
-- (0008_platform.sql) via the new UploadPurpose.WORKER_ID_PROOF /
-- WORKER_PHOTO values added alongside this migration
-- (apps/api/src/modules/uploads/uploads.schema.ts, docs/openapi.yaml
-- SignUploadRequest.purpose) -- the same pattern `lab_report_upload_id`
-- uses for UploadPurpose.SOIL_TEST_REPORT in 0021.
-- =============================================================================

-- +migrate Up

-- -----------------------------------------------------------------------------
-- workers — farm-scoped worker roster
-- -----------------------------------------------------------------------------
CREATE TABLE workers (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id             uuid        NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
    name                text        NOT NULL,
    role_title          text,
    date_of_birth       date,
    gender              text,
    id_proof_upload_id  uuid        REFERENCES uploads (id),
    photo_upload_id     uuid        REFERENCES uploads (id),
    bank_account_no     text,
    ifsc_code           text,
    upi_id              text,
    pay_type            text        NOT NULL,
    pay_rate_paise      integer     NOT NULL CHECK (pay_rate_paise > 0),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz,
    deleted_at          timestamptz
);

CREATE INDEX idx_workers_farm_id ON workers (farm_id);

COMMENT ON TABLE workers IS
    'Farm workforce roster. Farm-scoped (farm_id), NOT plot-scoped -- a '
    'worker is hired by the farm as a whole and moves between plots over '
    'the course of a day/season (see file header). Soft-delete via '
    'deleted_at, matching farms/plots: attendance/advance/payout history '
    'referencing a worker must survive removal from the active roster for '
    'the payroll audit trail, so there is no hard-delete path.';
COMMENT ON COLUMN workers.pay_type IS
    'Farmer-selected value (daily/monthly). Free text, mobile-constrained, '
    'no CHECK, same option-list-column pattern as plots.sun_exposure (see '
    '0020) and soil_test_records.lime_status (see 0021).';
COMMENT ON COLUMN workers.pay_rate_paise IS
    'BR-41a: a positive integer, never a float (root CLAUDE.md §2.2). The '
    'per-day or per-month rate depending on pay_type -- gross/net pay is '
    'computed from this at read time, never stored (BR-41c).';
COMMENT ON COLUMN workers.id_proof_upload_id IS
    'Optional ID proof scan, uploaded with UploadPurpose.WORKER_ID_PROOF.';
COMMENT ON COLUMN workers.photo_upload_id IS
    'Optional worker photo, uploaded with UploadPurpose.WORKER_PHOTO.';

-- -----------------------------------------------------------------------------
-- worker_attendance — one row per worker per day
-- -----------------------------------------------------------------------------
CREATE TABLE worker_attendance (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id     uuid        NOT NULL REFERENCES workers (id) ON DELETE CASCADE,
    farm_crop_id  uuid        REFERENCES farm_crops (id),
    work_date     date        NOT NULL,
    present       boolean     NOT NULL DEFAULT true,
    activity      text,
    hours_worked  numeric(4,2),
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz,
    CONSTRAINT chk_worker_attendance_hours
        CHECK (hours_worked IS NULL OR (hours_worked > 0 AND hours_worked <= 24)),
    CONSTRAINT uq_worker_attendance_worker_date UNIQUE (worker_id, work_date)
);

CREATE INDEX idx_worker_attendance_worker_id ON worker_attendance (worker_id);
CREATE INDEX idx_worker_attendance_farm_crop_id ON worker_attendance (farm_crop_id);

COMMENT ON TABLE worker_attendance IS
    'Daily attendance for a worker, one row per (worker, work_date) -- the '
    'unique constraint is what makes the bulk-upsert endpoint idempotent '
    'per day. farm_crop_id is an OPTIONAL link (0004_produce_pricing_'
    'marketing.sql) to the specific planting a day of work went toward, so '
    'workforce/crop-hours-summary can attribute labor cost to a crop '
    'without forcing every row to pick one (see file header). BR-38 '
    'boundary: written exclusively by a farmer marking attendance through '
    'the mobile app -- no scheduled job ever inserts a row here.';
COMMENT ON COLUMN worker_attendance.hours_worked IS
    'BR-41b: when present, must be in (0, 24] -- CHECKed at the database '
    'level, not only the service layer. Null when the worker was marked '
    'absent or hours were not logged.';
COMMENT ON COLUMN worker_attendance.activity IS
    'Farmer-entered free text describing the day''s work (e.g. "Weeding", '
    '"Harvest"). Free text, mobile-constrained, same option-list-column '
    'pattern as workers.pay_type.';

-- -----------------------------------------------------------------------------
-- worker_advances — insert-only log of cash advances given to a worker
-- -----------------------------------------------------------------------------
CREATE TABLE worker_advances (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id   uuid        NOT NULL REFERENCES workers (id) ON DELETE CASCADE,
    amount_paise integer    NOT NULL CHECK (amount_paise > 0),
    given_on    date        NOT NULL,
    notes       text,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_worker_advances_worker_id ON worker_advances (worker_id);

COMMENT ON TABLE worker_advances IS
    'Cash advance given to a worker, typed in by the farmer at the time '
    '(BR-38 boundary, see file header). Insert-only -- no updated_at, and '
    'nothing in the application ever edits a logged advance; a correction '
    'is a new row. amount_paise is deducted from gross pay when computing '
    'net payable at read time (BR-41c), never subtracted from a stored '
    'balance column.';

-- -----------------------------------------------------------------------------
-- worker_payouts — one payout per worker per pay period
-- -----------------------------------------------------------------------------
CREATE TABLE worker_payouts (
    id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id      uuid        NOT NULL REFERENCES workers (id) ON DELETE CASCADE,
    period_start   date        NOT NULL,
    period_end     date        NOT NULL,
    amount_paise   integer     NOT NULL CHECK (amount_paise > 0),
    payment_method text        NOT NULL,
    paid_at        timestamptz NOT NULL DEFAULT now(),
    notes          text,
    created_at     timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_worker_payouts_worker_period UNIQUE (worker_id, period_start, period_end)
);

CREATE INDEX idx_worker_payouts_worker_id ON worker_payouts (worker_id);

COMMENT ON TABLE worker_payouts IS
    'A payroll payout recorded for a worker for one period, farmer-'
    'initiated only (BR-38 boundary, see file header) -- no scheduled job '
    'ever runs payroll or inserts a row here. The UNIQUE (worker_id, '
    'period_start, period_end) constraint is defense in depth alongside '
    'the API''s Idempotency-Key header: replaying a payout request for the '
    'same worker and period cannot create a second payout row. '
    'amount_paise is the actual amount paid, recorded once computed -- it '
    'is history, not a cache the read-time payroll function depends on '
    '(BR-41c).';
COMMENT ON COLUMN worker_payouts.payment_method IS
    'Farmer-selected value (cash/bank_transfer/upi). Free text, mobile-'
    'constrained, same option-list-column pattern as workers.pay_type.';

SELECT app_attach_updated_at_triggers();

-- +migrate Down

DROP TABLE IF EXISTS worker_payouts;
DROP TABLE IF EXISTS worker_advances;
DROP TABLE IF EXISTS worker_attendance;
DROP TABLE IF EXISTS workers;
