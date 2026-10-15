-- =============================================================================
-- 0030_certification_custom_type_name.sql
-- certifications.custom_type_name: the scheme an OTHER certificate belongs to.
--
-- 0029 made certType OTHER recordable (Jaivik Bharat, USDA Organic, EU Organic,
-- ...) but left nowhere to say WHICH other scheme it is, short of overloading
-- issuing_body. BR-48 now requires a customTypeName (trimmed, 1-80 characters)
-- whenever certType is OTHER, and forbids one for PGS and NPOP; the API enforces
-- both halves on POST and PATCH /farmers/me/certifications (merged values).
--
-- What this CHECK enforces, and what it deliberately does not:
--   * a PGS or NPOP row carries no custom_type_name (NULL);
--   * a custom_type_name, when present, is 1-80 characters after trimming.
-- It does NOT require custom_type_name to be non-NULL on an OTHER row. The API
-- refuses an OTHER certificate without one on every write path; the database
-- is not the only line of defence for that half because existing integration
-- fixtures (listings.test.ts BR-02i) insert OTHER rows directly without the
-- column, and requiring it here would break them. A follow-up migration can
-- tighten the constraint to
--   (cert_type = 'OTHER') = (custom_type_name IS NOT NULL)
-- once those fixtures name their scheme. Every OTHER row already on record is
-- backfilled below, so that tightening would validate against existing data.
--
-- Not reversible without loss: the Down drops the column and with it every
-- recorded scheme name.
-- =============================================================================

-- +migrate Up
ALTER TABLE certifications ADD COLUMN custom_type_name text;

-- An OTHER certificate recorded before this column existed has no scheme name.
-- 'Other' is a neutral placeholder the farmer can correct with PATCH (which,
-- per BR-49, sends the certificate back for verification).
UPDATE certifications
   SET custom_type_name = 'Other'
 WHERE cert_type = 'OTHER'
   AND custom_type_name IS NULL;

ALTER TABLE certifications
    ADD CONSTRAINT certifications_custom_type_name_chk CHECK (
        CASE
            WHEN cert_type = 'OTHER'
                THEN custom_type_name IS NULL
                     OR char_length(btrim(custom_type_name)) BETWEEN 1 AND 80
            ELSE custom_type_name IS NULL
        END
    );

COMMENT ON COLUMN certifications.custom_type_name IS
    'BR-48: the scheme an OTHER certificate belongs to (e.g. Jaivik Bharat), trimmed, '
    '1-80 characters. Required by the API when cert_type = OTHER; always NULL for PGS '
    'and NPOP (enforced by certifications_custom_type_name_chk).';

-- +migrate Down
ALTER TABLE certifications DROP CONSTRAINT IF EXISTS certifications_custom_type_name_chk;
ALTER TABLE certifications DROP COLUMN IF EXISTS custom_type_name;
