-- =============================================================================
-- 0031_certification_custom_type_name_strict.sql
-- Tighten certifications_custom_type_name_chk to the whole of BR-48i:
--   * an OTHER certificate names its scheme, a PGS or NPOP one never does —
--       (cert_type = 'OTHER') = (custom_type_name IS NOT NULL)
--   * a name, when present, is 1-80 characters after trimming.
--
-- 0030 enforced only the second half and "PGS/NPOP carry no name". It left an
-- OTHER row without a name to the API alone, because the listings BR-02i
-- integration fixtures inserted OTHER rows directly without the column. Those
-- fixtures now name their scheme, so the database can hold the whole rule and
-- an OTHER row written by a script, a fixture or psql cannot slip past it.
--
-- Existing data:
--   * An OTHER row with no name (written around the API since 0030 backfilled
--     them all) gets the same neutral 'Other' placeholder 0030 used; the farmer
--     can correct it with PATCH, which per BR-49 sends the certificate back for
--     verification. The count is reported with RAISE NOTICE.
--   * A PGS/NPOP row with a name, or an OTHER row whose name is blank or over 80
--     characters, cannot exist while 0030's CHECK is in place (it was validated
--     against every row). If one does, this migration stops and reports how
--     many rather than guessing which value is wrong.
--
-- Down restores 0030's weaker CHECK. The 'Other' placeholders written here are
-- valid under it and are kept.
-- =============================================================================

-- +migrate Up
DO $$
DECLARE
    unnamed_other integer;
    named_non_other integer;
    bad_length integer;
BEGIN
    SELECT count(*) INTO named_non_other
      FROM certifications
     WHERE cert_type <> 'OTHER' AND custom_type_name IS NOT NULL;
    SELECT count(*) INTO bad_length
      FROM certifications
     WHERE custom_type_name IS NOT NULL
       AND char_length(btrim(custom_type_name)) NOT BETWEEN 1 AND 80;
    IF named_non_other > 0 OR bad_length > 0 THEN
        RAISE EXCEPTION
            '0031: % PGS/NPOP certification row(s) carry a custom_type_name and % row(s) have a blank or over-80-character one; fix them before tightening certifications_custom_type_name_chk',
            named_non_other, bad_length;
    END IF;

    UPDATE certifications
       SET custom_type_name = 'Other'
     WHERE cert_type = 'OTHER'
       AND custom_type_name IS NULL;
    GET DIAGNOSTICS unnamed_other = ROW_COUNT;
    RAISE NOTICE '0031: backfilled custom_type_name = ''Other'' on % OTHER certification row(s)', unnamed_other;
END
$$;

ALTER TABLE certifications DROP CONSTRAINT IF EXISTS certifications_custom_type_name_chk;

ALTER TABLE certifications
    ADD CONSTRAINT certifications_custom_type_name_chk CHECK (
        (cert_type = 'OTHER') = (custom_type_name IS NOT NULL)
        AND (
            custom_type_name IS NULL
            OR char_length(btrim(custom_type_name)) BETWEEN 1 AND 80
        )
    );

COMMENT ON COLUMN certifications.custom_type_name IS
    'BR-48i: the scheme an OTHER certificate belongs to (e.g. Jaivik Bharat), trimmed, '
    '1-80 characters. Required when cert_type = OTHER and always NULL for PGS and NPOP; '
    'both halves are enforced by certifications_custom_type_name_chk (migration 0031) '
    'as well as by the API.';

-- +migrate Down
ALTER TABLE certifications DROP CONSTRAINT IF EXISTS certifications_custom_type_name_chk;

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
