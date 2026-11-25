-- =============================================================================
-- 0201_application_review.sql
-- Admin review of farmer applications: per-document and per-location (FMB) decisions, a
-- structured history (notes, reject reason codes, requested-info checklists) that cannot be
-- rewritten, and `OTHER` documents carried into farmer_documents on approval.
-- BR-214, BR-215, BR-216, BR-217, BR-218, BR-219.
-- =============================================================================

-- +migrate Up

-- -----------------------------------------------------------------------------
-- 1. farmer_application_status_history: structured columns
-- -----------------------------------------------------------------------------
-- event_type     TRANSITION (status changed) or NOTE (a review note; from_status = to_status).
-- reason_code    reject reason code (BR-218), previously only inside the note text "[CODE] ...".
-- requested_items the request-info checklist (BR-217), previously not stored at all.
ALTER TABLE farmer_application_status_history
    ADD COLUMN event_type      text   NOT NULL DEFAULT 'TRANSITION',
    ADD COLUMN reason_code     text,
    ADD COLUMN requested_items text[];

ALTER TABLE farmer_application_status_history
    ADD CONSTRAINT fash_event_type_chk CHECK (event_type IN ('TRANSITION', 'NOTE')),
    ADD CONSTRAINT fash_note_is_not_a_move_chk
        CHECK (event_type <> 'NOTE' OR from_status = to_status),
    ADD CONSTRAINT fash_reason_code_chk CHECK (
        reason_code IS NULL OR reason_code IN
            ('DOCUMENTS_INVALID', 'LAND_NOT_VERIFIED', 'DUPLICATE_APPLICANT', 'OUTSIDE_SERVICE_AREA', 'OTHER')),
    ADD CONSTRAINT fash_requested_items_chk CHECK (
        requested_items IS NULL OR (
            cardinality(requested_items) > 0 AND
            requested_items <@ ARRAY['FMB_SKETCH', 'AADHAAR', 'PATTA_CHITTA', 'BANK_DETAILS',
                                     'CERTIFICATE', 'OTHER']::text[]));

-- Backfill, while the table is still writable:
-- (a) reason codes of past rejections, from the "[CODE] reason" note the service wrote.
UPDATE farmer_application_status_history
   SET reason_code = substring(note FROM '^\[([A-Z_]+)\]')
 WHERE to_status = 'REJECTED'
   AND substring(note FROM '^\[([A-Z_]+)\]') IN
       ('DOCUMENTS_INVALID', 'LAND_NOT_VERIFIED', 'DUPLICATE_APPLICANT', 'OUTSIDE_SERVICE_AREA', 'OTHER');

-- (b) applications that are CURRENTLY "info requested" under the old derivation (live, not a
-- draft, newest history note starts "More info requested:") get the stored status and one
-- history row recording the move, so nothing a reviewer sees today changes meaning. The old
-- request never stored a checklist, so the row says OTHER; its message is the old note's text.
WITH open_requests AS (
    SELECT fa.id, fa.status, last_hist.actor_id, last_hist.note, last_hist.created_at
      FROM farmer_applications fa
      JOIN LATERAL (
            SELECT actor_id, note, created_at
              FROM farmer_application_status_history h
             WHERE h.application_id = fa.id
             ORDER BY h.created_at DESC
             LIMIT 1
      ) last_hist ON true
     WHERE fa.is_draft = false
       AND fa.deleted_at IS NULL
       AND fa.status NOT IN ('APPROVED', 'REJECTED')
       AND last_hist.note LIKE 'More info requested:%'
), moved AS (
    UPDATE farmer_applications fa
       SET status = 'INFO_REQUESTED', updated_at = now()
      FROM open_requests o
     WHERE fa.id = o.id
    RETURNING fa.id
)
INSERT INTO farmer_application_status_history
       (application_id, from_status, to_status, actor_id, note, created_at, event_type, requested_items)
SELECT o.id, o.status, 'INFO_REQUESTED', o.actor_id,
       btrim(substring(o.note FROM length('More info requested:') + 1)),
       o.created_at + interval '1 microsecond', 'TRANSITION', ARRAY['OTHER']
  FROM open_requests o
  JOIN moved m ON m.id = o.id;

-- -----------------------------------------------------------------------------
-- 2. Append-only history, and RESTRICT instead of CASCADE
-- -----------------------------------------------------------------------------
-- The table was commented "append-only" in 0009 but nothing enforced it. A review trail that a
-- bug or a hand-run UPDATE can rewrite is not a trail (BR-218, same invariant as audit_log and
-- order_status_history).
--
-- ON DELETE CASCADE -> RESTRICT. Applications are soft-deleted (`deleted_at`); nothing in the
-- application deletes them physically. With the append-only trigger, a CASCADE from a physical
-- delete would be refused anyway, but by a trigger message about "UPDATE/DELETE on an
-- append-only table" that hides the real cause. RESTRICT says it at the point of the mistake:
-- an application with a review trail cannot be hard-deleted. (Test cleanup removes both under
-- session_replication_role = replica, which is how every other append-only table is cleaned.)
ALTER TABLE farmer_application_status_history
    DROP CONSTRAINT farmer_application_status_history_application_id_fkey,
    ADD CONSTRAINT farmer_application_status_history_application_id_fkey
        FOREIGN KEY (application_id) REFERENCES farmer_applications (id) ON DELETE RESTRICT;

SELECT app_make_append_only('farmer_application_status_history');

-- -----------------------------------------------------------------------------
-- 3. farmer_application_reviews — document (BR-215) and FMB (BR-216) decisions
-- -----------------------------------------------------------------------------
-- WHY THIS SHAPE, and not ids written into step4_documents / step3_location:
--
-- * The applicant owns the step JSON. The app re-sends the WHOLE documents / locations array on
--   every save, and the step schemas are `.strict()`: injecting server ids into that JSON would
--   either be dropped on the next save or make the app's own payload a 422. Review state written
--   into the applicant's JSON would also be overwritten by the applicant.
-- * So a decision lives here, keyed by something DERIVED from the content it judged:
--     DOCUMENT  subject_key = first 32 hex of sha256(docType || '|' || fileUrl)
--               (the same value is the API's `documentKey`)
--     FMB       subject_key = the location's own step-3 `id` (client-generated, stable across
--               saves), content_fingerprint = sha256 of the canonical {fmbPolygon, areaAcres}
--   A decision applies only while the content still matches. When the applicant replaces a file
--   (new URL) or redraws a boundary, the current content has no matching decision and reads as
--   PENDING — "re-upload resets the review" needs no code path that someone could forget.
-- * Append-only, latest row wins: a reviewer may overturn a decision, but the earlier decision
--   (who verified a document that was later rejected) is never lost. Same ledger rule as
--   audit_log; the current state is a read-time projection.
-- * ON DELETE RESTRICT for the same reason as the history above.
CREATE TABLE farmer_application_reviews (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id      uuid        NOT NULL REFERENCES farmer_applications (id) ON DELETE RESTRICT,
    subject_type        text        NOT NULL CHECK (subject_type IN ('DOCUMENT', 'FMB')),
    subject_key         text        NOT NULL CHECK (length(subject_key) BETWEEN 1 AND 100),
    content_fingerprint text        NOT NULL CHECK (length(content_fingerprint) BETWEEN 1 AND 128),
    decision            text        NOT NULL CHECK (decision IN ('VERIFIED', 'REJECTED')),
    reason              text,
    reviewed_by         uuid        NOT NULL REFERENCES users (id),
    created_at          timestamptz NOT NULL DEFAULT now(),
    -- BR-215/BR-216: a rejection always says why; a verification carries no reason.
    CONSTRAINT farmer_application_reviews_reason_chk CHECK (
        (decision = 'REJECTED' AND reason IS NOT NULL AND length(btrim(reason)) >= 5)
        OR (decision = 'VERIFIED' AND reason IS NULL))
);

CREATE INDEX idx_far_subject
    ON farmer_application_reviews (application_id, subject_type, subject_key, created_at DESC);
CREATE INDEX idx_far_reviewed_by ON farmer_application_reviews (reviewed_by);

COMMENT ON TABLE farmer_application_reviews IS
    'Append-only per-document (BR-215) and per-location FMB (BR-216) review decisions on a farmer '
    'application. The latest row whose content_fingerprint matches the current content is the '
    'state; anything else reads as PENDING.';

SELECT app_make_append_only('farmer_application_reviews');

-- -----------------------------------------------------------------------------
-- 4. farmer_documents accepts OTHER (BR-219)
-- -----------------------------------------------------------------------------
-- Approval copies every step-4 document into farmer_documents. Step 4 allows docType OTHER,
-- which this CHECK did not: without it an "other" document would have to be dropped or
-- mislabelled as one of the KYC types.
ALTER TABLE farmer_documents DROP CONSTRAINT farmer_documents_doc_type_check;
ALTER TABLE farmer_documents ADD CONSTRAINT farmer_documents_doc_type_check
    CHECK (doc_type IN ('ID_PROOF', 'ADDRESS_PROOF', 'FARM_DOC', 'CERTIFICATE', 'BANK_PROOF', 'PHOTO', 'OTHER'));

-- +migrate Down

-- farmer_documents: OTHER rows would violate the old CHECK; they are relabelled rather than
-- deleted (a document is evidence).
UPDATE farmer_documents SET doc_type = 'ADDRESS_PROOF' WHERE doc_type = 'OTHER';
ALTER TABLE farmer_documents DROP CONSTRAINT farmer_documents_doc_type_check;
ALTER TABLE farmer_documents ADD CONSTRAINT farmer_documents_doc_type_check
    CHECK (doc_type IN ('ID_PROOF', 'ADDRESS_PROOF', 'FARM_DOC', 'CERTIFICATE', 'BANK_PROOF', 'PHOTO'));

DROP TABLE IF EXISTS farmer_application_reviews;

DROP TRIGGER IF EXISTS trg_farmer_application_status_history_append_only ON farmer_application_status_history;
DROP TRIGGER IF EXISTS trg_farmer_application_status_history_no_truncate ON farmer_application_status_history;

-- INFO_REQUESTED cannot be removed from the enum (0200), so no row may keep it.
UPDATE farmer_applications SET status = 'DOCS_REVIEW' WHERE status = 'INFO_REQUESTED';
DELETE FROM farmer_application_status_history WHERE event_type = 'NOTE';
UPDATE farmer_application_status_history SET to_status = 'DOCS_REVIEW' WHERE to_status = 'INFO_REQUESTED';
UPDATE farmer_application_status_history SET from_status = 'DOCS_REVIEW' WHERE from_status = 'INFO_REQUESTED';

ALTER TABLE farmer_application_status_history
    DROP CONSTRAINT farmer_application_status_history_application_id_fkey,
    ADD CONSTRAINT farmer_application_status_history_application_id_fkey
        FOREIGN KEY (application_id) REFERENCES farmer_applications (id) ON DELETE CASCADE;

ALTER TABLE farmer_application_status_history
    DROP CONSTRAINT IF EXISTS fash_requested_items_chk,
    DROP CONSTRAINT IF EXISTS fash_reason_code_chk,
    DROP CONSTRAINT IF EXISTS fash_note_is_not_a_move_chk,
    DROP CONSTRAINT IF EXISTS fash_event_type_chk,
    DROP COLUMN IF EXISTS requested_items,
    DROP COLUMN IF EXISTS reason_code,
    DROP COLUMN IF EXISTS event_type;
