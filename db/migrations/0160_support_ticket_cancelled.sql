-- =============================================================================
-- 0160_support_ticket_cancelled.sql
-- BR-196: a customer can cancel their own OPEN support ticket. The shared support_tickets status
-- CHECK (0008) gains CANCELLED; the admin side shows it as CANCELLED.
-- =============================================================================

-- +migrate Up
ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_status_check;
ALTER TABLE support_tickets
    ADD CONSTRAINT support_tickets_status_check
    CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED', 'CANCELLED'));

-- +migrate Down
UPDATE support_tickets SET status = 'CLOSED' WHERE status = 'CANCELLED';
ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_status_check;
ALTER TABLE support_tickets
    ADD CONSTRAINT support_tickets_status_check
    CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'));
