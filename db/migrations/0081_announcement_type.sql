-- =============================================================================
-- 0081_announcement_type.sql
-- BR-134: the kind of an announcement, shown on the system-message reads (BR-65).
--
--   announcements.type  NOT NULL DEFAULT 'GENERAL', CHECK in (GENERAL, MAINTENANCE, ALERT,
--                       PROMOTION). UNCONFIRMED value set: implementer proposal, the owner has
--                       not defined the kinds (owner decision 2026-10-27 only to add the column).
--
-- The default does the backfill: every existing row reads GENERAL, and every insert that does not
-- name a type (seeds, tests, any code path) keeps working unchanged. Informational only: the
-- visibility rule (BR-65) does not read it.
-- =============================================================================

-- +migrate Up

ALTER TABLE announcements
    ADD COLUMN type text NOT NULL DEFAULT 'GENERAL';

ALTER TABLE announcements
    ADD CONSTRAINT announcements_type_chk
        CHECK (type IN ('GENERAL', 'MAINTENANCE', 'ALERT', 'PROMOTION'));

-- +migrate Down

ALTER TABLE announcements
    DROP CONSTRAINT IF EXISTS announcements_type_chk,
    DROP COLUMN IF EXISTS type;
