/**
 * Strings for inspection step 8, "Documents & Findings" (design 86). Shared shell labels come from
 * audit.strings.ts. Note the overview (design 78) calls this section "Documents & Evidence"; the step
 * screen's own title is "Documents & Findings" as drawn.
 */
export const AUDIT_STEP_8_STRINGS = {
  TITLE: 'Documents & Findings',
  STEP_PILL: 'Step 8 of 10',

  CARD_EXISTING: 'Existing documents & evidence',
  CARD_ADD: 'Add evidence',
  CARD_FILE: 'Evidence file & verification',
  CARD_SUMMARY: 'Evidence Summary',

  ON_FILE: 'On file',
  VIEW: 'View',
  DOWNLOAD: 'Download',
  viewAria: (doc: string): string => `View ${doc} (not available in this demo)`,
  downloadAria: (doc: string): string => `Download ${doc} (not available in this demo)`,

  LABEL_CATEGORY: 'Evidence Category',
  LABEL_SECTION: 'Related Inspection Section',
  LABEL_OBSERVATION: 'Observation',
  LABEL_FOLLOW_UP: 'Follow-up Recommendation',
  LABEL_RECOMMENDATION_NOTES: 'Recommendation Notes (optional)',
  LABEL_FILE: 'Evidence File',
  LABEL_VERIFICATION: 'Evidence Verification Status',
  LABEL_MISSING_REASON: 'Missing Document Reason',
  LABEL_NOTES: 'Notes',

  PLACEHOLDER_SELECT: 'Select…',
  PLACEHOLDER_OBSERVATION: 'Enter observation…',
  PLACEHOLDER_RECOMMENDATION_NOTES: 'Enter recommendation notes…',
  PLACEHOLDER_NOTES: 'Enter notes…',

  DROP_TITLE: 'Upload file',
  DROP_HINT: 'Drag and drop a file here, or click to browse',
  DROP_FORMATS: 'Supported formats: PDF, JPG, PNG (Max 10 MB)',
  REMOVE_FILE: 'Remove file',

  summaryCount: (n: number): string => `${n} file(s) added in this step`,
  SUMMARY_EMPTY: 'No files uploaded yet',
  summaryPill: (n: number): string => `${n} file${n === 1 ? '' : 's'} attached`,
  REMOVE_EVIDENCE: 'Remove',
  removeEvidenceAria: (category: string, section: string): string =>
    `Remove evidence: ${category}, ${section}`,
  NO_FILE: 'No file attached',

  ADD_EVIDENCE: 'Add Evidence',
  EVIDENCE_ADDED: 'Evidence added to this step (demo — not stored).',
  EVIDENCE_REMOVED: 'Evidence removed.',

  // ---------- Evidence categories (docs/openapi.yaml AdminFarmerDocument.docType) ----------
  CATEGORY_FARM_DOC: 'Farm document',
  CATEGORY_CERTIFICATE: 'Certificate',
  CATEGORY_PHOTO: 'Photo',
  CATEGORY_ID_PROOF: 'ID proof',
  CATEGORY_ADDRESS_PROOF: 'Address proof',
  CATEGORY_BANK_PROOF: 'Bank proof',

  // ---------- Verification status (AdminFarmerDocument.verificationStatus) ----------
  VERIFICATION_UNVERIFIED: 'Unverified',
  VERIFICATION_VERIFIED: 'Verified',
  VERIFICATION_REJECTED: 'Rejected',

  // ---------- Follow-up recommendation (design-implied) ----------
  FOLLOW_UP_NONE: 'No follow-up needed',
  FOLLOW_UP_CORRECTIVE_ACTION: 'Corrective action required',
  FOLLOW_UP_RESUBMIT_DOCUMENT: 'Resubmit document',
  FOLLOW_UP_RE_INSPECTION: 'Re-inspection required',
  FOLLOW_UP_ESCALATE: 'Escalate to TOHFA Admin',

  // ---------- Missing document reason (design-implied) ----------
  MISSING_NONE: 'Not applicable — all documents on file',
  MISSING_NOT_ISSUED: 'Not yet issued',
  MISSING_UNDER_RENEWAL: 'Under renewal',
  MISSING_LOST_DAMAGED: 'Lost or damaged',
  MISSING_NOT_PROVIDED: 'Farmer did not provide',

  ERROR_CATEGORY_REQUIRED: 'Select an evidence category.',
  ERROR_SECTION_REQUIRED: 'Choose the related inspection section from the list.',
  ERROR_OBSERVATION_REQUIRED: 'Enter an observation.',
  ERROR_MISSING_REASON_REQUIRED: 'Select a missing document reason.',
  addErrorSummary: (n: number): string =>
    `Cannot add evidence: ${n} required field${n === 1 ? ' is' : 's are'} missing.`,
  saveErrorSummary: (n: number): string =>
    `${n} required field${n === 1 ? ' is' : 's are'} missing. Fix the highlighted field${n === 1 ? '' : 's'} to continue.`,
} as const;
