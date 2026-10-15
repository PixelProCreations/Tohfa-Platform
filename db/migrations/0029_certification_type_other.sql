-- =============================================================================
-- 0029_certification_type_other.sql
-- Add the missing 'OTHER' value to certification_type.
--
-- docs/openapi.yaml's CertificationType enum documents PGS | NPOP | OTHER, the
-- API's Zod schema accepts OTHER, and the farmer app's certificate-type picker
-- offers it (Jaivik Bharat, USDA Organic, EU Organic, ... with the scheme named
-- in issuing_body). The enum created in 0001_extensions_and_enums.sql only has
-- PGS and NPOP, so every farmer POST with certType OTHER has been failing at the
-- database with "invalid input value for enum certification_type: OTHER". The
-- OpenAPI spec is the ground truth (root CLAUDE.md §1), so the database is what
-- is wrong — add the value it was missing.
--
-- OTHER is recordable, viewable and verifiable by an admin, but it does NOT
-- qualify a farmer to list (BR-02: only a verified, unexpired PGS or NPOP
-- certificate does). That is enforced where eligibility is decided —
-- certifications.repo recomputeFarmerMarketBlock and listings.repo
-- getListingCertEligibility both filter cert_type IN ('PGS', 'NPOP') — not
-- here; nothing in this migration uses the new value, which matters because a
-- value added by ALTER TYPE ... ADD VALUE cannot be used until the migrator's
-- transaction commits.
-- =============================================================================

-- +migrate Up
ALTER TYPE certification_type ADD VALUE IF NOT EXISTS 'OTHER' AFTER 'NPOP';

COMMENT ON TYPE certification_type IS
    'PGS, NPOP or OTHER (any other organic scheme, named in issuing_body). Only a '
    'verified, unexpired PGS or NPOP certificate qualifies a farmer to list (BR-02); '
    'OTHER is recorded and may be verified, but never lifts the market block.';

-- +migrate Down
-- PostgreSQL does not support removing an enum value in place (same as
-- 0015_order_dispatch_status.sql). The OTHER value stays in certification_type
-- after a rollback, and any certifications rows already recorded as OTHER are
-- left untouched. Only the type comment is reverted.
COMMENT ON TYPE certification_type IS NULL;
