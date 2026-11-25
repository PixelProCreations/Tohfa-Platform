-- =============================================================================
-- dev_demo_applications.sql
--
-- DEV ONLY: Idempotent, transactional script to populate realistic admin
-- application-review states (document verification, FMB polygons & verification,
-- status transitions, INFO_REQUESTED item checklist + message, and review notes)
-- on the three seeded demo applications:
--   - Lakshmi Narayan / Lakshmi Narayanan -> INFO_REQUESTED (mixed docs & FMB)
--   - Suresh Gowda                        -> DOCS_REVIEW    (mixed docs & rejected FMB)
--   - Ramesh Patel                        -> FARM_VERIFICATION (all docs verified, 1 FMB pending)
--
-- Matched by applicant `full_name`. Append-only tables (`farmer_application_reviews`
-- and `farmer_application_status_history`) are only inserted when no matching
-- entry exists yet, making repeated executions safe and idempotent.
-- DO NOT run in production.
-- =============================================================================

BEGIN;

DO $$
DECLARE
    v_reviewer_id uuid;
    v_app RECORD;

    v_doc_id_url    text := 'https://storage.tohfa.in/docs/demo_id_proof.pdf';
    v_doc_farm_url  text := 'https://storage.tohfa.in/docs/demo_patta_chitta.pdf';
    v_doc_cert_url  text := 'https://storage.tohfa.in/docs/demo_pgs_cert.pdf';

    v_id_key        text;
    v_farm_key      text;
    v_cert_key      text;

    v_poly1         jsonb := '{"type":"Polygon","coordinates":[[[76.69,11.41],[76.71,11.41],[76.71,11.43],[76.69,11.43],[76.69,11.41]]]}'::jsonb;
    v_poly2         jsonb := '{"type":"Polygon","coordinates":[[[76.71,11.42],[76.73,11.42],[76.73,11.44],[76.71,11.44],[76.71,11.42]]]}'::jsonb;
    v_fmb1_fp       text;
    v_fmb2_fp       text;
    v_loc1_id       text;
    v_loc2_id       text;
    v_area1         numeric := 2.1;
    v_area2         numeric := 1.4;
BEGIN
    SELECT id INTO v_reviewer_id
      FROM users
     WHERE email IN ('superadmin@tohfa.test', 'admin@tohfa.test')
     ORDER BY created_at ASC
     LIMIT 1;

    IF v_reviewer_id IS NULL THEN
        SELECT id INTO v_reviewer_id
          FROM users
         WHERE user_type = 'ADMIN'
         ORDER BY created_at ASC
         LIMIT 1;
    END IF;

    IF v_reviewer_id IS NULL THEN
        RAISE EXCEPTION 'No admin user found in users table to attribute seed reviews.';
    END IF;

    v_id_key   := left(encode(sha256(convert_to('ID_PROOF|'    || v_doc_id_url,   'UTF8')), 'hex'), 32);
    v_farm_key := left(encode(sha256(convert_to('FARM_DOC|'    || v_doc_farm_url, 'UTF8')), 'hex'), 32);
    v_cert_key := left(encode(sha256(convert_to('CERTIFICATE|' || v_doc_cert_url, 'UTF8')), 'hex'), 32);

    -- Canonical key-sorted compact JSON matching fmbFingerprintOf() in farmer-applications.review.ts
    v_fmb1_fp := encode(
        sha256(convert_to(
            '{"areaAcres":2.1,"fmbPolygon":{"coordinates":[[[76.69,11.41],[76.71,11.41],[76.71,11.43],[76.69,11.43],[76.69,11.41]]],"type":"Polygon"}}',
            'UTF8'
        )),
        'hex'
    );
    v_fmb2_fp := encode(
        sha256(convert_to(
            '{"areaAcres":1.4,"fmbPolygon":{"coordinates":[[[76.71,11.42],[76.73,11.42],[76.73,11.44],[76.71,11.44],[76.71,11.42]]],"type":"Polygon"}}',
            'UTF8'
        )),
        'hex'
    );

    -- =========================================================================
    -- 1. Lakshmi Narayan / Lakshmi Narayanan -> INFO_REQUESTED
    -- =========================================================================
    SELECT id, status INTO v_app
      FROM farmer_applications
     WHERE full_name IN ('Lakshmi Narayan', 'Lakshmi Narayanan')
       AND deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1;

    IF FOUND THEN
        v_loc1_id := 'demo-lakshmi-loc-1';
        v_loc2_id := 'demo-lakshmi-loc-2';

        UPDATE farmer_applications
           SET status = 'INFO_REQUESTED',
               is_draft = false,
               current_step = 5,
               completed_steps = ARRAY[1,2,3,4,5]::smallint[],
               submitted_at = COALESCE(submitted_at, now() - interval '3 days'),
               step3_location = jsonb_build_object(
                   'locations', jsonb_build_array(
                       jsonb_build_object(
                           'id', v_loc1_id,
                           'label', 'Coonoor Main Plot',
                           'areaAcres', v_area1,
                           'calculatedAreaAcres', 2.05,
                           'latitude', 11.415,
                           'longitude', 76.695,
                           'gpsCaptured', true,
                           'village', 'Coonoor',
                           'taluk', 'Coonoor',
                           'district', 'The Nilgiris',
                           'fmbPolygon', v_poly1
                       ),
                       jsonb_build_object(
                           'id', v_loc2_id,
                           'label', 'North Ridge Plot',
                           'areaAcres', v_area2,
                           'calculatedAreaAcres', 1.38,
                           'latitude', 11.425,
                           'longitude', 76.715,
                           'gpsCaptured', true,
                           'village', 'Coonoor',
                           'taluk', 'Coonoor',
                           'district', 'The Nilgiris',
                           'fmbPolygon', v_poly2
                       )
                   )
               ),
               step4_documents = jsonb_build_object(
                   'documents', jsonb_build_array(
                       jsonb_build_object('docType', 'ID_PROOF', 'docSubType', 'Aadhaar Card', 'fileName', 'aadhaar_lakshmi.pdf', 'fileUrl', v_doc_id_url),
                       jsonb_build_object('docType', 'FARM_DOC', 'docSubType', 'Patta / Chitta', 'fileName', 'patta_lakshmi.pdf', 'fileUrl', v_doc_farm_url),
                       jsonb_build_object('docType', 'CERTIFICATE', 'docSubType', 'NPOP Organic Certificate', 'fileName', 'npop_lakshmi.pdf', 'fileUrl', v_doc_cert_url)
                   )
               ),
               updated_at = now()
         WHERE id = v_app.id;

        INSERT INTO farmer_application_reviews (application_id, subject_type, subject_key, content_fingerprint, decision, reason, reviewed_by, created_at)
        SELECT v_app.id, 'DOCUMENT', v_id_key, v_id_key, 'VERIFIED', NULL, v_reviewer_id, now() - interval '2 days'
        WHERE NOT EXISTS (
            SELECT 1 FROM farmer_application_reviews r
             WHERE r.application_id = v_app.id AND r.subject_type = 'DOCUMENT' AND r.subject_key = v_id_key AND r.content_fingerprint = v_id_key
        );

        INSERT INTO farmer_application_reviews (application_id, subject_type, subject_key, content_fingerprint, decision, reason, reviewed_by, created_at)
        SELECT v_app.id, 'DOCUMENT', v_farm_key, v_farm_key, 'REJECTED', 'Patta scan cropped; survey number not visible.', v_reviewer_id, now() - interval '2 days' + interval '5 minutes'
        WHERE NOT EXISTS (
            SELECT 1 FROM farmer_application_reviews r
             WHERE r.application_id = v_app.id AND r.subject_type = 'DOCUMENT' AND r.subject_key = v_farm_key AND r.content_fingerprint = v_farm_key
        );

        INSERT INTO farmer_application_reviews (application_id, subject_type, subject_key, content_fingerprint, decision, reason, reviewed_by, created_at)
        SELECT v_app.id, 'FMB', v_loc1_id, v_fmb1_fp, 'VERIFIED', NULL, v_reviewer_id, now() - interval '2 days' + interval '10 minutes'
        WHERE NOT EXISTS (
            SELECT 1 FROM farmer_application_reviews r
             WHERE r.application_id = v_app.id AND r.subject_type = 'FMB' AND r.subject_key = v_loc1_id AND r.content_fingerprint = v_fmb1_fp
        );

        INSERT INTO farmer_application_status_history (application_id, from_status, to_status, actor_id, note, event_type, created_at)
        SELECT v_app.id, 'SUBMITTED', 'DOCS_REVIEW', v_reviewer_id, 'Entered document review queue.', 'TRANSITION', now() - interval '2 days'
        WHERE NOT EXISTS (
            SELECT 1 FROM farmer_application_status_history h
             WHERE h.application_id = v_app.id AND h.event_type = 'TRANSITION' AND h.to_status = 'DOCS_REVIEW' AND COALESCE(h.note, '') = 'Entered document review queue.'
        );

        INSERT INTO farmer_application_status_history (application_id, from_status, to_status, actor_id, note, event_type, created_at)
        SELECT v_app.id, 'DOCS_REVIEW', 'DOCS_REVIEW', v_reviewer_id, 'Aadhaar matches application; Patta needs clearer scan of survey no. 102/1A.', 'NOTE', now() - interval '2 days' + interval '15 minutes'
        WHERE NOT EXISTS (
            SELECT 1 FROM farmer_application_status_history h
             WHERE h.application_id = v_app.id AND h.event_type = 'NOTE' AND h.note = 'Aadhaar matches application; Patta needs clearer scan of survey no. 102/1A.'
        );

        INSERT INTO farmer_application_status_history (application_id, from_status, to_status, actor_id, note, event_type, requested_items, created_at)
        SELECT v_app.id, 'DOCS_REVIEW', 'INFO_REQUESTED', v_reviewer_id,
               'Please upload full Patta/Chitta page showing survey number and verify North Ridge boundary.',
               'TRANSITION', ARRAY['PATTA_CHITTA', 'FMB_SKETCH']::text[], now() - interval '1 day'
        WHERE NOT EXISTS (
            SELECT 1 FROM farmer_application_status_history h
             WHERE h.application_id = v_app.id AND h.event_type = 'TRANSITION' AND h.to_status = 'INFO_REQUESTED'
               AND COALESCE(h.note, '') = 'Please upload full Patta/Chitta page showing survey number and verify North Ridge boundary.'
        );
    END IF;

    -- =========================================================================
    -- 2. Suresh Gowda -> DOCS_REVIEW (mixed docs & rejected FMB)
    -- =========================================================================
    SELECT id, status INTO v_app
      FROM farmer_applications
     WHERE full_name = 'Suresh Gowda'
       AND deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1;

    IF FOUND THEN
        v_loc1_id := 'demo-suresh-loc-1';
        v_loc2_id := 'demo-suresh-loc-2';

        UPDATE farmer_applications
           SET status = 'DOCS_REVIEW',
               is_draft = false,
               current_step = 5,
               completed_steps = ARRAY[1,2,3,4,5]::smallint[],
               submitted_at = COALESCE(submitted_at, now() - interval '4 days'),
               step3_location = jsonb_build_object(
                   'locations', jsonb_build_array(
                       jsonb_build_object(
                           'id', v_loc1_id,
                           'label', 'Ketti Valley Plot',
                           'areaAcres', v_area1,
                           'calculatedAreaAcres', 2.08,
                           'latitude', 11.418,
                           'longitude', 76.702,
                           'gpsCaptured', true,
                           'village', 'Ketti',
                           'taluk', 'Udhagamandalam',
                           'district', 'The Nilgiris',
                           'fmbPolygon', v_poly1
                       ),
                       jsonb_build_object(
                           'id', v_loc2_id,
                           'label', 'Kodanad Slope Plot',
                           'areaAcres', v_area2,
                           'calculatedAreaAcres', 1.35,
                           'latitude', 11.435,
                           'longitude', 76.715,
                           'gpsCaptured', true,
                           'village', 'Kodanad',
                           'taluk', 'Udhagamandalam',
                           'district', 'The Nilgiris',
                           'fmbPolygon', v_poly2
                       )
                   )
               ),
               step4_documents = jsonb_build_object(
                   'documents', jsonb_build_array(
                       jsonb_build_object('docType', 'ID_PROOF', 'docSubType', 'Aadhaar Card', 'fileName', 'aadhaar_suresh.pdf', 'fileUrl', v_doc_id_url),
                       jsonb_build_object('docType', 'FARM_DOC', 'docSubType', 'Patta / Chitta', 'fileName', 'patta_suresh.pdf', 'fileUrl', v_doc_farm_url),
                       jsonb_build_object('docType', 'CERTIFICATE', 'docSubType', 'PGS Organic Certificate', 'fileName', 'pgs_suresh.pdf', 'fileUrl', v_doc_cert_url)
                   )
               ),
               updated_at = now()
         WHERE id = v_app.id;

        INSERT INTO farmer_application_reviews (application_id, subject_type, subject_key, content_fingerprint, decision, reason, reviewed_by, created_at)
        SELECT v_app.id, 'DOCUMENT', v_id_key, v_id_key, 'VERIFIED', NULL, v_reviewer_id, now() - interval '3 days'
        WHERE NOT EXISTS (
            SELECT 1 FROM farmer_application_reviews r
             WHERE r.application_id = v_app.id AND r.subject_type = 'DOCUMENT' AND r.subject_key = v_id_key AND r.content_fingerprint = v_id_key
        );

        INSERT INTO farmer_application_reviews (application_id, subject_type, subject_key, content_fingerprint, decision, reason, reviewed_by, created_at)
        SELECT v_app.id, 'DOCUMENT', v_cert_key, v_cert_key, 'VERIFIED', NULL, v_reviewer_id, now() - interval '3 days' + interval '2 minutes'
        WHERE NOT EXISTS (
            SELECT 1 FROM farmer_application_reviews r
             WHERE r.application_id = v_app.id AND r.subject_type = 'DOCUMENT' AND r.subject_key = v_cert_key AND r.content_fingerprint = v_cert_key
        );

        INSERT INTO farmer_application_reviews (application_id, subject_type, subject_key, content_fingerprint, decision, reason, reviewed_by, created_at)
        SELECT v_app.id, 'FMB', v_loc1_id, v_fmb1_fp, 'VERIFIED', NULL, v_reviewer_id, now() - interval '2 days'
        WHERE NOT EXISTS (
            SELECT 1 FROM farmer_application_reviews r
             WHERE r.application_id = v_app.id AND r.subject_type = 'FMB' AND r.subject_key = v_loc1_id AND r.content_fingerprint = v_fmb1_fp
        );

        INSERT INTO farmer_application_reviews (application_id, subject_type, subject_key, content_fingerprint, decision, reason, reviewed_by, created_at)
        SELECT v_app.id, 'FMB', v_loc2_id, v_fmb2_fp, 'REJECTED', 'Polygon overlaps road reserve on east edge.', v_reviewer_id, now() - interval '2 days' + interval '5 minutes'
        WHERE NOT EXISTS (
            SELECT 1 FROM farmer_application_reviews r
             WHERE r.application_id = v_app.id AND r.subject_type = 'FMB' AND r.subject_key = v_loc2_id AND r.content_fingerprint = v_fmb2_fp
        );

        INSERT INTO farmer_application_status_history (application_id, from_status, to_status, actor_id, note, event_type, created_at)
        SELECT v_app.id, 'SUBMITTED', 'DOCS_REVIEW', v_reviewer_id, 'Assigned for document and FMB review.', 'TRANSITION', now() - interval '3 days'
        WHERE NOT EXISTS (
            SELECT 1 FROM farmer_application_status_history h
             WHERE h.application_id = v_app.id AND h.event_type = 'TRANSITION' AND h.to_status = 'DOCS_REVIEW' AND COALESCE(h.note, '') = 'Assigned for document and FMB review.'
        );

        INSERT INTO farmer_application_status_history (application_id, from_status, to_status, actor_id, note, event_type, created_at)
        SELECT v_app.id, 'DOCS_REVIEW', 'DOCS_REVIEW', v_reviewer_id, 'Awaiting final check on Patta deed before advancing.', 'NOTE', now() - interval '2 days' + interval '10 minutes'
        WHERE NOT EXISTS (
            SELECT 1 FROM farmer_application_status_history h
             WHERE h.application_id = v_app.id AND h.event_type = 'NOTE' AND h.note = 'Awaiting final check on Patta deed before advancing.'
        );
    END IF;

    -- =========================================================================
    -- 3. Ramesh Patel -> FARM_VERIFICATION (all docs verified, 1 FMB verified, 1 pending)
    -- =========================================================================
    SELECT id, status INTO v_app
      FROM farmer_applications
     WHERE full_name = 'Ramesh Patel'
       AND deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1;

    IF FOUND THEN
        v_loc1_id := 'demo-ramesh-loc-1';
        v_loc2_id := 'demo-ramesh-loc-2';

        UPDATE farmer_applications
           SET status = 'FARM_VERIFICATION',
               is_draft = false,
               current_step = 5,
               completed_steps = ARRAY[1,2,3,4,5]::smallint[],
               submitted_at = COALESCE(submitted_at, now() - interval '5 days'),
               step3_location = jsonb_build_object(
                   'locations', jsonb_build_array(
                       jsonb_build_object(
                           'id', v_loc1_id,
                           'label', 'Home Valley Plot',
                           'areaAcres', v_area1,
                           'calculatedAreaAcres', 2.1,
                           'latitude', 11.412,
                           'longitude', 76.698,
                           'gpsCaptured', true,
                           'village', 'Coonoor',
                           'taluk', 'Coonoor',
                           'district', 'The Nilgiris',
                           'fmbPolygon', v_poly1
                       ),
                       jsonb_build_object(
                           'id', v_loc2_id,
                           'label', 'Lower Terrace Plot',
                           'areaAcres', v_area2,
                           'calculatedAreaAcres', 1.4,
                           'latitude', 11.428,
                           'longitude', 76.72,
                           'gpsCaptured', true,
                           'village', 'Coonoor',
                           'taluk', 'Coonoor',
                           'district', 'The Nilgiris',
                           'fmbPolygon', v_poly2
                       )
                   )
               ),
               step4_documents = jsonb_build_object(
                   'documents', jsonb_build_array(
                       jsonb_build_object('docType', 'ID_PROOF', 'docSubType', 'Aadhaar Card', 'fileName', 'aadhaar_ramesh.pdf', 'fileUrl', v_doc_id_url),
                       jsonb_build_object('docType', 'FARM_DOC', 'docSubType', 'Land Deed (Patta/Chitta)', 'fileName', 'patta_ramesh.pdf', 'fileUrl', v_doc_farm_url),
                       jsonb_build_object('docType', 'CERTIFICATE', 'docSubType', 'PGS Organic Certificate', 'fileName', 'pgs_ramesh.pdf', 'fileUrl', v_doc_cert_url)
                   )
               ),
               updated_at = now()
         WHERE id = v_app.id;

        INSERT INTO farmer_application_reviews (application_id, subject_type, subject_key, content_fingerprint, decision, reason, reviewed_by, created_at)
        SELECT v_app.id, 'DOCUMENT', v_id_key, v_id_key, 'VERIFIED', NULL, v_reviewer_id, now() - interval '4 days'
        WHERE NOT EXISTS (
            SELECT 1 FROM farmer_application_reviews r
             WHERE r.application_id = v_app.id AND r.subject_type = 'DOCUMENT' AND r.subject_key = v_id_key AND r.content_fingerprint = v_id_key
        );

        INSERT INTO farmer_application_reviews (application_id, subject_type, subject_key, content_fingerprint, decision, reason, reviewed_by, created_at)
        SELECT v_app.id, 'DOCUMENT', v_farm_key, v_farm_key, 'VERIFIED', NULL, v_reviewer_id, now() - interval '4 days' + interval '2 minutes'
        WHERE NOT EXISTS (
            SELECT 1 FROM farmer_application_reviews r
             WHERE r.application_id = v_app.id AND r.subject_type = 'DOCUMENT' AND r.subject_key = v_farm_key AND r.content_fingerprint = v_farm_key
        );

        INSERT INTO farmer_application_reviews (application_id, subject_type, subject_key, content_fingerprint, decision, reason, reviewed_by, created_at)
        SELECT v_app.id, 'DOCUMENT', v_cert_key, v_cert_key, 'VERIFIED', NULL, v_reviewer_id, now() - interval '4 days' + interval '4 minutes'
        WHERE NOT EXISTS (
            SELECT 1 FROM farmer_application_reviews r
             WHERE r.application_id = v_app.id AND r.subject_type = 'DOCUMENT' AND r.subject_key = v_cert_key AND r.content_fingerprint = v_cert_key
        );

        INSERT INTO farmer_application_reviews (application_id, subject_type, subject_key, content_fingerprint, decision, reason, reviewed_by, created_at)
        SELECT v_app.id, 'FMB', v_loc1_id, v_fmb1_fp, 'VERIFIED', NULL, v_reviewer_id, now() - interval '2 days'
        WHERE NOT EXISTS (
            SELECT 1 FROM farmer_application_reviews r
             WHERE r.application_id = v_app.id AND r.subject_type = 'FMB' AND r.subject_key = v_loc1_id AND r.content_fingerprint = v_fmb1_fp
        );

        INSERT INTO farmer_application_status_history (application_id, from_status, to_status, actor_id, note, event_type, created_at)
        SELECT v_app.id, 'SUBMITTED', 'DOCS_REVIEW', v_reviewer_id, 'Started document verification.', 'TRANSITION', now() - interval '4 days'
        WHERE NOT EXISTS (
            SELECT 1 FROM farmer_application_status_history h
             WHERE h.application_id = v_app.id AND h.event_type = 'TRANSITION' AND h.to_status = 'DOCS_REVIEW' AND COALESCE(h.note, '') = 'Started document verification.'
        );

        INSERT INTO farmer_application_status_history (application_id, from_status, to_status, actor_id, note, event_type, created_at)
        SELECT v_app.id, 'DOCS_REVIEW', 'FARM_VERIFICATION', v_reviewer_id, 'All mandatory KYC and land documents verified.', 'TRANSITION', now() - interval '3 days'
        WHERE NOT EXISTS (
            SELECT 1 FROM farmer_application_status_history h
             WHERE h.application_id = v_app.id AND h.event_type = 'TRANSITION' AND h.to_status = 'FARM_VERIFICATION' AND COALESCE(h.note, '') = 'All mandatory KYC and land documents verified.'
        );

        INSERT INTO farmer_application_status_history (application_id, from_status, to_status, actor_id, note, event_type, created_at)
        SELECT v_app.id, 'FARM_VERIFICATION', 'FARM_VERIFICATION', v_reviewer_id, 'Home Valley Plot boundary confirmed; Lower Terrace Plot pending field check.', 'NOTE', now() - interval '1 day'
        WHERE NOT EXISTS (
            SELECT 1 FROM farmer_application_status_history h
             WHERE h.application_id = v_app.id AND h.event_type = 'NOTE' AND h.note = 'Home Valley Plot boundary confirmed; Lower Terrace Plot pending field check.'
        );
    END IF;
END $$;

COMMIT;
