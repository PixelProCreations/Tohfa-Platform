-- =============================================================================
-- 0200_application_info_requested_status.sql
-- BR-217: "request more information" becomes a STORED farmer-application status.
--
-- Until now INFO_REQUESTED was derived on read from the text of the newest history note
-- (`note LIKE 'More info requested:%'`), and the request itself moved the row to DOCS_REVIEW.
-- A status that lives in free text breaks the first time anyone words a note differently, and
-- it cannot be indexed, filtered or constrained.
--
-- Its own migration because a value added by ALTER TYPE ... ADD VALUE cannot be used until the
-- migrator's transaction commits (the runner wraps each file in one transaction; same reasoning
-- as 0029 and 0110). 0201 is the first file that uses the new value.
--
-- AUDIT stays in the enum untouched: the 2026-11-25 owner decision takes it out of the
-- application flow (BR-214) without removing the value.
-- =============================================================================

-- +migrate Up
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'INFO_REQUESTED';

-- +migrate Down
-- PostgreSQL cannot remove an enum value in place (as 0015, 0029, 0110). 0201's Down moves any
-- INFO_REQUESTED row back to DOCS_REVIEW before this runs, so the value is left unused.
SELECT 1;
