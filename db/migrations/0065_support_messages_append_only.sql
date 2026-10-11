-- =============================================================================
-- 0065_support_messages_append_only.sql
-- SWA Module 7 (Customers), BR-97: a support thread is appended to, never edited.
--
-- 0008_platform.sql created support_messages with an updated_at column and the generic
-- touch-updated_at trigger, so a message could be rewritten after the customer had read it (or a
-- farmer identity removed from the record after the fact, hiding a BR-16 breach). BR-97 says a
-- reply is a ledger-style append, never an edit of earlier messages. No code path updates or
-- deletes a support message: the only writer is customers.repo.ts insertMessage (INSERT). The
-- table therefore gets the same database-level guard as the other ledgers (app_make_append_only:
-- statement-level UPDATE/DELETE/TRUNCATE triggers plus the tohfa_app REVOKE), and the touch
-- trigger, which can no longer fire, is dropped. The updated_at column is kept (always NULL from
-- now on) so that this migration removes no data and stays reversible.
--
-- Consequence: hard-deleting a support ticket (ON DELETE CASCADE) or its customer now fails while
-- the ticket has messages. Nothing in the application hard-deletes either (customers are
-- soft-deleted); test cleanup uses session_replication_role = replica, as for the other ledgers.
-- =============================================================================

-- +migrate Up

DROP TRIGGER IF EXISTS trg_support_messages_touch_updated_at ON support_messages;

SELECT app_make_append_only('support_messages');

COMMENT ON TABLE support_messages IS
    'APPEND-ONLY (BR-97, BR-35): thread messages. A reply is a new row; no message is ever '
    'updated or deleted. is_internal marks admin-only notes that BR-16 keeps out of the '
    'customer-facing thread. updated_at is unused since 0065 (always NULL).';

-- +migrate Down

DROP TRIGGER IF EXISTS trg_support_messages_append_only ON support_messages;
DROP TRIGGER IF EXISTS trg_support_messages_no_truncate ON support_messages;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'tohfa_app') THEN
        GRANT UPDATE, DELETE, TRUNCATE ON public.support_messages TO tohfa_app;
    END IF;
END
$$;

CREATE TRIGGER trg_support_messages_touch_updated_at
    BEFORE UPDATE ON support_messages
    FOR EACH ROW EXECUTE FUNCTION app_touch_updated_at();

COMMENT ON TABLE support_messages IS
    'Thread messages. is_internal marks admin-only notes that BR-16 keeps out of '
    'the customer-facing thread.';
