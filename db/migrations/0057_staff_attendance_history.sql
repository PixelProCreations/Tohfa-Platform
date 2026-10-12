-- =============================================================================
-- 0057_staff_attendance_history.sql
-- Module 14 (Warehouse Staff and Attendance), BR-84: the correction trail.
--
-- staff_attendance holds ONE row per staff member per day and a re-mark updates it in place.
-- That would silently lose the earlier value, so a trigger copies every INSERT and every real
-- change into staff_attendance_history, an APPEND-ONLY table (app_make_append_only, BR-35).
-- It is a trigger, not service code, so that no path (a script, a manual fix) can change an
-- attendance row without leaving a history row. An UPDATE that changes nothing writes nothing,
-- so replaying the same mark is safe and leaves no noise.
-- =============================================================================

-- +migrate Up

CREATE TABLE staff_attendance_history (
    id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id  uuid        NOT NULL REFERENCES staff_attendance (id),
    staff_id       uuid        NOT NULL,
    warehouse_id   uuid        NOT NULL,
    work_date      date        NOT NULL,
    action         text        NOT NULL CHECK (action IN ('CREATED', 'UPDATED')),
    from_status    text,
    from_check_in  timestamptz,
    from_check_out timestamptz,
    from_note      text,
    to_status      text        NOT NULL,
    to_check_in    timestamptz,
    to_check_out   timestamptz,
    to_note        text,
    changed_by     uuid        NOT NULL REFERENCES users (id),
    -- clock_timestamp(), not now(): two changes in one transaction must still sort in the order they happened.
    created_at     timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX idx_staff_attendance_history_attendance ON staff_attendance_history (attendance_id, created_at);
CREATE INDEX idx_staff_attendance_history_changed_by ON staff_attendance_history (changed_by);

COMMENT ON TABLE staff_attendance_history IS
    'APPEND-ONLY (BR-35, BR-84): every creation and every real change of a staff_attendance row, '
    'written by trigger trg_staff_attendance_record_history. A correction is a new row.';

CREATE FUNCTION staff_attendance_record_history() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO staff_attendance_history (
            attendance_id, staff_id, warehouse_id, work_date, action,
            to_status, to_check_in, to_check_out, to_note, changed_by)
        VALUES (
            NEW.id, NEW.staff_id, NEW.warehouse_id, NEW.work_date, 'CREATED',
            NEW.status, NEW.check_in, NEW.check_out, NEW.note, NEW.marked_by);
    ELSE
        INSERT INTO staff_attendance_history (
            attendance_id, staff_id, warehouse_id, work_date, action,
            from_status, from_check_in, from_check_out, from_note,
            to_status, to_check_in, to_check_out, to_note, changed_by)
        VALUES (
            NEW.id, NEW.staff_id, NEW.warehouse_id, NEW.work_date, 'UPDATED',
            OLD.status, OLD.check_in, OLD.check_out, OLD.note,
            NEW.status, NEW.check_in, NEW.check_out, NEW.note, NEW.marked_by);
    END IF;
    RETURN NULL;
END
$fn$;

CREATE TRIGGER trg_staff_attendance_record_history_ins
    AFTER INSERT ON staff_attendance
    FOR EACH ROW EXECUTE FUNCTION staff_attendance_record_history();

-- WHEN: an UPDATE that leaves status, times and note as they were is not a change.
CREATE TRIGGER trg_staff_attendance_record_history_upd
    AFTER UPDATE ON staff_attendance
    FOR EACH ROW
    WHEN ((OLD.status, OLD.check_in, OLD.check_out, OLD.note)
          IS DISTINCT FROM (NEW.status, NEW.check_in, NEW.check_out, NEW.note))
    EXECUTE FUNCTION staff_attendance_record_history();

SELECT app_make_append_only('staff_attendance_history');

-- +migrate Down

DROP TRIGGER IF EXISTS trg_staff_attendance_record_history_upd ON staff_attendance;
DROP TRIGGER IF EXISTS trg_staff_attendance_record_history_ins ON staff_attendance;
DROP FUNCTION IF EXISTS staff_attendance_record_history();
DROP TABLE IF EXISTS staff_attendance_history;
