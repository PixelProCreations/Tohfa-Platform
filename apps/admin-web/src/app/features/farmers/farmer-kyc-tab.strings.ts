/**
 * UI string catalogue for the Farmer Details → KYC tab and its document dialog (SA-M3-S05).
 *
 * Per root CLAUDE.md §2.7 user-facing strings do not live in components. The admin console has no
 * i18n framework yet, so — like the other farmer catalogues — this file is the single source of
 * truth until one exists.
 */
export const FARMER_KYC_STRINGS = {
  // ---------- Generic ----------
  LOADING: 'Loading…',
  DASH: '—',
  NOT_AVAILABLE_YET: 'Not available yet',
  NOT_PERMITTED: 'You do not have permission for this action',
  NOT_IN_API: 'Not returned by the API yet',
  RETRY: 'Retry',
  UNIT_ACRES: ' acres',

  // ---------- KYC Verification card ----------
  KYC_TITLE: 'KYC Verification',
  KYC_SUBTITLE: "View and manage the farmer's KYC documents and bank details.",
  DOCUMENTS_NO_ACCESS: 'You do not have permission to view this farmer’s documents.',
  DOCUMENTS_LOAD_ERROR: 'The farmer’s documents could not be loaded.',
  FARMER_LOAD_ERROR: 'The farmer’s profile could not be loaded.',

  SECTION_IDENTITY: 'Identity proof',
  SECTION_LAND: 'Land ownership proof',
  SECTION_BANK: 'Bank details',
  EXPAND: 'Expand',
  COLLAPSE: 'Collapse',

  // Document status pills — docs/openapi.yaml AdminFarmerDocument.verificationStatus.
  STATUS_VERIFIED: 'Verified',
  STATUS_PENDING: 'Pending',
  STATUS_REJECTED: 'Rejected',
  STATUS_NOT_SUBMITTED: 'Not submitted',
  STATUS_NOT_ADDED: 'Not added',

  IDENTITY_EMPTY: 'No identity proof has been uploaded for this farmer.',
  LAND_EMPTY: 'No land ownership proof has been uploaded for this farmer.',

  // Field labels (tab).
  DOCUMENT_TYPE: 'Document type',
  DOCUMENT_NUMBER: 'Document number',
  UPLOADED_DOCUMENT: 'Uploaded document',
  PROOF_TYPE: 'Proof type',
  SURVEY_NUMBER: 'Survey number',
  DOCUMENT_REFERENCE: 'Document reference',
  LAND_AREA: 'Land area',
  VILLAGE: 'Village',
  ZONE: 'Zone',
  SUBMITTED_ON: 'Submitted on',
  VERIFIED_ON: 'Verified on',
  REVIEWED_ON: 'Reviewed on',
  VERIFIED_BY: 'Verified by',
  REVIEWED_BY: 'Reviewed by',
  VERIFICATION_NOTE: 'Verification note',
  REJECT_REASON: 'Reject reason',

  // Field labels (dialog, title case per the design).
  DLG_DOCUMENT_TYPE: 'Document Type',
  DLG_DOCUMENT_NUMBER: 'Document Number',
  DLG_PROOF_TYPE: 'Proof Type',
  DLG_SURVEY_NUMBER: 'Survey Number',
  DLG_DOCUMENT_REFERENCE: 'Document Reference',
  DLG_LAND_AREA: 'Land Area',
  DLG_VILLAGE: 'Village',
  DLG_ZONE: 'Zone',
  DLG_SUBMITTED_ON: 'Submitted On',
  DLG_VERIFIED_ON: 'Verified On',
  DLG_REVIEWED_ON: 'Reviewed On',
  DLG_VERIFIED_BY: 'Verified By',
  DLG_REVIEWED_BY: 'Reviewed By',
  DLG_VERIFICATION_NOTE: 'Verification Note',
  DLG_REJECT_REASON: 'Reject Reason',
  DLG_VERIFICATION_DETAILS: 'Verification Details',
  DLG_DOCUMENT_DETAILS: 'Document Details',

  // AdminFarmerDocument carries `docType` only — the application's step-4 `docSubType`
  // (AADHAAR, PATTA_CHITTA, …) and the original file name are not returned for an approved farmer.
  DOC_TYPE_ID_PROOF: 'ID proof',
  DOC_TYPE_FARM_DOC: 'Farm / land document',
  SUBTYPE_NOT_IN_API: 'The specific document type (e.g. Aadhaar, Patta / Chitta) is not returned by the API yet',
  FILE_NAME_NOT_IN_API: 'The original file name is not returned by the API yet',
  AADHAAR_FROM_PROFILE: 'Last four Aadhaar digits from the farmer profile; the full number is never stored',
  NOTE_NOT_IN_API: 'A verification note is not recorded by the API yet',
  REVIEWER_ID_HINT: 'Reviewer user ID; the reviewer’s name is not returned by the API yet',
  LAND_FROM_PRIMARY: 'From the farmer’s primary land location',
  OPEN_DOCUMENT: 'Open document',

  BTN_VIEW: 'View',
  BTN_DOWNLOAD: 'Download',
  BTN_REJECT: 'Reject',
  BTN_CLOSE: 'Close',
  BTN_DOWNLOAD_DOCUMENT: 'Download Document',
  BTN_VIEW_FULLSCREEN: 'View Fullscreen',
  // There is no reject endpoint for an approved farmer's document: docs/openapi.yaml has only
  // POST /admin/farmers/{id}/documents/{docId}/verify (application documents are reviewed elsewhere).
  REJECT_NOT_IN_API: 'Not available yet — the API has no endpoint to reject an approved farmer’s document',
  DOCUMENT_NO_FILE: 'No file is available for this document',
  DOCUMENT_URL_ERROR: 'A fresh link to the document could not be obtained. Please try again.',
  DOCUMENT_GONE: 'This document is no longer available.',

  // ---------- Bank details ----------
  BANK_NO_ACCESS: 'You do not have permission to view this farmer’s bank details.',
  BANK_LOAD_ERROR: 'Bank details could not be loaded.',
  BANK_EMPTY: 'No bank account has been added.',
  ACCOUNT_HOLDER: 'Account holder',
  BANK_NAME: 'Bank',
  BRANCH: 'Branch',
  IFSC: 'IFSC',
  ACCOUNT_NUMBER: 'Account number',
  DEFAULT_DESTINATION: 'Default',
  ADDED_ON: 'Added on',

  // ---------- UPI IDs ----------
  UPI_TITLE: 'UPI IDs',
  UPI_EMPTY: 'No UPI ID has been added.',
  UPI_NO_ACCESS: 'You do not have permission to view this farmer’s UPI IDs.',
  UPI_LOAD_ERROR: 'UPI IDs could not be loaded.',
  UPI_UNVERIFIED: 'Unverified',

  // ---------- Payout history ----------
  PAYOUTS_TITLE: 'Payout history (preview)',
  PAYOUTS_EMPTY: 'No payouts yet.',
  PAYOUTS_NO_ACCESS: 'You do not have permission to view payouts.',
  PAYOUTS_LOAD_ERROR: 'Payouts could not be loaded.',
  PAYOUT_DESTINATION_NOT_IN_API: 'The payout destination is not returned by the payout list API yet',
  // docs/openapi.yaml PayoutStatus.
  PAYOUT_STATUS: {
    REQUESTED: 'Requested',
    PENDING_APPROVAL: 'Pending approval',
    APPROVED: 'Approved',
    PROCESSING: 'Processing',
    PAID: 'Paid',
    FAILED: 'Failed',
    REVERSED: 'Reversed',
  } as Record<string, string>,

  // ---------- Dialog ----------
  DIALOG_IDENTITY_TITLE: 'Identity Proof',
  DIALOG_LAND_TITLE: 'Land Ownership Proof',
  PREVIEW_UNSUPPORTED: 'This file type cannot be previewed here. Use Download Document to open it.',
  PREVIEW_LABEL: 'Document preview',

  RUPEE: '₹',
  /** "**4821" — the API returns the last four digits only (BR-53a). */
  maskedLast4: (last4: string) => `**${last4}`,
  maskedAccount: (last4: string) => `XXXX XXXX ${last4}`,
  maskedAadhaar: (last4: string) => `XXXX XXXX ${last4}`,
  reviewerId: (id: string) => `Admin ${id.slice(0, 8)}`,
  farmerLine: (name: string, code: string) => `Farmer: ${name} · ${code}`,
  fileMeta: (kind: string, size: string | null) => (size !== null ? `${kind}, ${size}` : kind),
  fileMetaDot: (kind: string, size: string | null) => (size !== null ? `${kind} · ${size}` : kind),
  payoutTo: (destination: string) => `To ${destination}`,
} as const;
