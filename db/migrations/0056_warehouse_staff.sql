-- =============================================================================
-- 0056_warehouse_staff.sql
-- Module 14 (Warehouse Staff and Attendance), BR-83 and BR-84.
--
--   * warehouse_staff: the floor staff of one warehouse (drivers, loaders, packers ...). They are
--     NOT users: no login, no password, no role. `phone` is PII: the API never logs it and never
--     copies it into an audit image.
--   * staff_attendance: ONE row per staff member per calendar day. A re-mark of the same day
--     updates that row in place; every change is recorded in staff_attendance_history (0057).
--   * system_config: staff_attendance_max_range_days, the widest from/to span the attendance list
--     and summary endpoints accept.
--
-- UNCONFIRMED DEFAULTS (docs/rbac.json and docs/rules.md define no warehouse staff roster; the
-- smallest model that serves the fields the screens show was chosen, owner approval pending):
--   * three attendance statuses PRESENT, ABSENT, LEAVE: the only ones the designed screens show
--     ("Present", "Absent", "On Leave"). "Not Checked In" is the ABSENCE of a row, not a status.
--   * staff_code ('STF-0001' ...): the designed list shows a staff id such as STF-0024.
--   * no payroll, salary or pay-rate column: none is defined for warehouse staff.
-- =============================================================================

-- +migrate Up

CREATE SEQUENCE warehouse_staff_code_seq;

CREATE TABLE warehouse_staff (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_code    text        NOT NULL DEFAULT ('STF-' || lpad(nextval('warehouse_staff_code_seq')::text, 4, '0')),
    warehouse_id  uuid        NOT NULL REFERENCES warehouses (id),
    full_name     text        NOT NULL CHECK (btrim(full_name) <> '' AND char_length(full_name) <= 120),
    designation   text        NOT NULL CHECK (btrim(designation) <> '' AND char_length(designation) <= 80),
    phone         text        CHECK (phone ~ '^\+?[0-9]{10,15}$'),
    joined_on     date        NOT NULL,
    status        text        NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz,
    CONSTRAINT uq_warehouse_staff_code UNIQUE (staff_code),
    -- Lets staff_attendance carry the warehouse and still be forced to agree with the staff row.
    CONSTRAINT uq_warehouse_staff_id_warehouse UNIQUE (id, warehouse_id)
);

CREATE INDEX idx_warehouse_staff_warehouse_status ON warehouse_staff (warehouse_id, status);

COMMENT ON TABLE warehouse_staff IS
    'Floor staff of one warehouse (Module 14, BR-83). Not users: no login. status INACTIVE is the '
    'soft state: the row and its attendance stay for the record, but no new attendance can be marked.';
COMMENT ON COLUMN warehouse_staff.phone IS
    'PII. Never logged, never copied into an audit_log image.';

CREATE TABLE staff_attendance (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id      uuid        NOT NULL,
    warehouse_id  uuid        NOT NULL,
    work_date     date        NOT NULL,
    status        text        NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LEAVE')),
    check_in      timestamptz,
    check_out     timestamptz,
    note          text        CHECK (note IS NULL OR (btrim(note) <> '' AND char_length(note) <= 500)),
    marked_by     uuid        NOT NULL REFERENCES users (id),
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz,
    CONSTRAINT uq_staff_attendance_staff_day UNIQUE (staff_id, work_date),
    -- The warehouse on the attendance row can never disagree with the staff member's warehouse.
    CONSTRAINT fk_staff_attendance_staff FOREIGN KEY (staff_id, warehouse_id)
        REFERENCES warehouse_staff (id, warehouse_id),
    -- Times only make sense for a day the person was present; a check-out needs a check-in.
    CONSTRAINT ck_staff_attendance_times_need_present
        CHECK (status = 'PRESENT' OR (check_in IS NULL AND check_out IS NULL)),
    CONSTRAINT ck_staff_attendance_checkout_needs_checkin
        CHECK (check_out IS NULL OR check_in IS NOT NULL),
    CONSTRAINT ck_staff_attendance_checkout_after_checkin
        CHECK (check_out IS NULL OR check_out >= check_in)
);

CREATE INDEX idx_staff_attendance_warehouse_date ON staff_attendance (warehouse_id, work_date);
CREATE INDEX idx_staff_attendance_marked_by ON staff_attendance (marked_by);

COMMENT ON TABLE staff_attendance IS
    'One row per staff member per calendar day (Asia/Kolkata date), updated in place by a re-mark '
    '(BR-84). Every change is recorded in staff_attendance_history (0057), so nothing is silently lost.';

SELECT app_attach_updated_at_triggers();

-- DO NOTHING, not DO UPDATE: re-running must never overwrite a value an admin has since changed.
INSERT INTO system_config (key, value, data_type, description) VALUES
    ('staff_attendance_max_range_days',
     '366'::jsonb, 'number',
     'BR-84: the widest span, in days, between `to` and `from` that GET /v1/admin/staff-attendance and /v1/admin/staff-attendance/summary accept. With 366, a `to` exactly 366 days after `from` is accepted and 367 days is 422 VALIDATION_FAILED on query.to. UNCONFIRMED default: the owner has not stated a bound. The attendance repo reads this key (fallback 366 when the row is missing or not a non-negative integer); it is NOT a literal in the schema or service.')
ON CONFLICT (key) DO NOTHING;

-- +migrate Down

DELETE FROM system_config WHERE key = 'staff_attendance_max_range_days';

DROP TABLE IF EXISTS staff_attendance;
DROP TABLE IF EXISTS warehouse_staff;
DROP SEQUENCE IF EXISTS warehouse_staff_code_seq;
