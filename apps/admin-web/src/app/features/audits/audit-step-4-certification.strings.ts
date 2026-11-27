/** Strings for inspection step 4, Certification Verification (design 82). */
export const AUDIT_STEP4_STRINGS = {
  STEP_PILL: 'Step 4 of 10',
  /** "Active · certified 2026-06-12 · renewal 2027-06-12" */
  certSubline: (status: string, certified: string, renewal: string): string =>
    `${status} · certified ${certified} · renewal ${renewal}`,
  recordedOnProfile: (status: string, certified: string, renewal: string): string =>
    `Recorded on profile: ${status} · certified ${certified} · renewal ${renewal}. The inspection does not declare a certificate valid or expired.`,
  CERT_TYPE: 'Certification Type',
  CERT_STATUS: 'Certification Status',
  CERT_DOCUMENT: 'Certificate Document',
  CERT_DOCUMENT_NONE: 'No certificate document on record.',
  viewDocLabel: (name: string): string => `View ${name} (not available yet)`,
  UPLOAD_CERT: 'Upload Certificate',
  CERTIFIED_DATE: 'Certified Date',
  RENEWAL_DATE: 'Renewal / Expiry Date',
  DOC_VERIFICATION: 'Document Verification',
  VERIFICATION_NOTES: 'Verification Notes',
  errorDocVerification: (cert: string): string => `${cert}: select the document verification outcome.`,
  NO_CERTS_TITLE: 'No certifications on the profile',
  NO_CERTS_HINT: 'Certifications recorded on the farmer profile appear here for verification.',

  SUMMARY_TITLE: 'Verification Summary',
  SUMMARY_COL_CERT: 'Certification',
  SUMMARY_COL_PROFILE: 'Profile (Existing)',
  SUMMARY_COL_STATUS: 'Verification Status',
  /** "Active · 2026-06-12 to 2027-06-12" */
  summaryProfile: (status: string, certified: string, renewal: string): string =>
    `${status} · ${certified} to ${renewal}`,
  NOT_YET_VERIFIED: 'Not Yet Verified',

  NOTE_TITLE: 'Note',
  NOTE_TEXT:
    'Document verification is required for each certification (e.g., PGS Organic, NPOP). Review the uploaded certificate and update the verification status accordingly.',
} as const;
