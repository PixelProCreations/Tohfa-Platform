/**
 * UI string catalogue for the Farmer Details → Verification & Compliance tab and its three
 * dialogs (Mark as Unverified, Block Listings, Remove Record).
 *
 * Per root CLAUDE.md §2.7 user-facing strings do not live in components. The admin console has no
 * i18n framework yet, so — like the other farmer catalogues — this file is the single source of
 * truth until one exists.
 */
export const FARMER_VERIFICATION_STRINGS = {
  // ---------- Tab heading ----------
  TITLE: 'Verification & Compliance',
  SUBTITLE: "Manage the farmer's organic certifications, verification status and related actions.",

  // ---------- Status ----------
  STATUS_LABEL: { VERIFIED: 'Verified', EXPIRED: 'Expired', UNVERIFIED: 'Unverified' } as const,
  CURRENTLY_LABEL: { VERIFIED: 'Currently Verified', EXPIRED: 'Expired', UNVERIFIED: 'Unverified' } as const,
  LISTING_STATUS_LABEL: { ACTIVE: 'Active', BLOCKED: 'Blocked' } as const,

  // ---------- Certification cards ----------
  certLine: (certNo: string, issuer: string): string => `Cert. no. ${certNo} · Issued by ${issuer}`,
  verifiedLine: (expires: string, verified: string, by: string): string => `Expires ${expires} · Verified ${verified} by ${by}`,
  expiredLine: (expired: string, lastVerified: string): string => `Expired ${expired} · Last verified ${lastVerified}`,
  lastVerifiedLine: (expires: string, lastVerified: string): string => `Expires ${expires} · Last verified ${lastVerified}`,
  unverifiedLine: (expires: string, reason: string): string => `Expires ${expires} · Marked unverified: ${reason}`,
  BLOCKED_BANNER: 'Listings under this certification are blocked until it is renewed and re-verified.',
  BTN_VERIFY_PORTAL: 'Verify on Issuer Portal',
  BTN_MARK_UNVERIFIED: 'Mark Unverified',
  BTN_BLOCK_LISTINGS: 'Block Listings',
  listingsBlocked: (n: number): string => (n === 1 ? '1 listing blocked' : `${n} listings blocked`),
  NO_RECORDS: 'No certification records on file.',

  // ---------- Verify on Issuer Portal card ----------
  PORTAL_TITLE: 'Verify on Issuer Portal',
  PORTAL_LABEL: 'Issuing body portal',
  portalLinkLabel: (host: string, cert: string): string => `${host} — issuing body portal for ${cert}`,
  PORTAL_HELP:
    "Opens the issuing body's own lookup in a new tab. The record here is only marked verified or unverified after you confirm it there — nothing is fetched automatically.",

  // ---------- Correct or remove a record card ----------
  CORRECT_TITLE: 'Correct or remove a record',
  REASON: 'Reason',
  BTN_CORRECT: 'Correct Record',
  BTN_REMOVE: 'Remove Record',

  // ---------- Shared dialog ----------
  BTN_CLOSE: 'Close',
  BTN_CANCEL: 'Cancel',
  CERTIFICATE_NO: 'Certificate No.',
  ISSUED_BY: 'Issued By',
  ISSUE_DATE: 'Issue Date',
  EXPIRY_DATE: 'Expiry Date',
  LAST_VERIFIED_ON: 'Last Verified On',
  VERIFIED_BY: 'Verified By',
  REMARKS: 'Remarks',
  REMARKS_OPTIONAL: 'Remarks (Optional)',
  counter: (n: number, max: number): string => `${n} / ${max}`,
  counterAria: (n: number, max: number): string => `${n} of ${max} characters used`,

  // ---------- Mark as Unverified dialog ----------
  UNVERIFY_TITLE: 'Mark as Unverified',
  unverifySubtitle: (cert: string): string => `Update the verification status for ${cert} certification.`,
  UNVERIFY_REASON: 'Reason for Marking as Unverified',
  UNVERIFY_REASONS: [
    { code: 'EXPIRED', label: 'Certificate expired' },
    { code: 'INVALID_NUMBER', label: 'Invalid / incorrect certificate number' },
    { code: 'DOCUMENT_UNCLEAR', label: 'Document not clear or incomplete' },
    { code: 'PORTAL_MISMATCH', label: 'Details mismatch with issuer portal' },
    { code: 'OTHER', label: 'Other (specify)' },
  ] as const,
  UNVERIFY_REMARKS_PLACEHOLDER: 'Enter details about the verification issue...',
  UNVERIFY_WARN_TITLE: 'This action will change the certification status to Unverified.',
  UNVERIFY_WARN_BODY: 'Listings under this certification will be blocked until it is renewed and re-verified.',
  BTN_CONFIRM_UNVERIFY: 'Mark as Unverified',

  // ---------- Block Listings dialog ----------
  BLOCK_TITLE: 'Block Listings',
  blockSubtitle: (cert: string): string => `Block all active produce listings under the selected certification (${cert}).`,
  BLOCK_WHAT_TITLE: 'What will be blocked?',
  BLOCK_WHAT_BODY:
    'All active produce listings tagged with this certification will be deactivated and will not be visible to customers until the certification is renewed and re-verified.',
  LISTINGS_TITLE: 'Listings to be Blocked',
  listingsCount: (n: number): string => (n === 1 ? '1 listing' : `${n} listings`),
  COL_LISTING_ID: 'Listing ID',
  COL_PRODUCT: 'Product',
  COL_CATEGORY: 'Category',
  COL_STOCK: 'Stock',
  COL_STATUS: 'Status',
  SELECT_ALL: 'Select all active listings',
  selectListing: (id: string, product: string): string => `Select ${id} ${product}`,
  stockKg: (n: number): string => `${n} kg`,
  NO_LISTINGS: 'No produce listings are tagged with this certification.',
  BLOCK_REASON: 'Reason for Blocking',
  BLOCK_REASONS: [
    { code: 'CERT_EXPIRED', label: 'Certification expired' },
    { code: 'CERT_UNVERIFIED', label: 'Certification unverified' },
    { code: 'COMPLIANCE_REVIEW', label: 'Under compliance review' },
    { code: 'OTHER', label: 'Other' },
  ] as const,
  blockRemarksPlaceholder: (expiry: string): string => `Add a note (e.g., Certification expired on ${expiry})...`,
  BTN_CONFIRM_BLOCK: 'Block Listings',

  // ---------- Remove Record dialog ----------
  REMOVE_TITLE: 'Remove Record',
  REMOVE_SUBTITLE: "Select the certification record to permanently remove from the farmer's profile.",
  SELECT_RECORD: 'Select Certification Record',
  recordOption: (name: string, certNo: string, status: string): string => `${name} — ${certNo} (${status})`,
  recordsAvailable: (names: readonly string[]): string => {
    const list = names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
    return names.length === 1 ? `1 certification record available: ${list}` : `${names.length} certification records available: ${list}`;
  },
  REMOVE_REASON: 'Reason for Removing',
  SELECT_REASON_PLACEHOLDER: 'Select a reason',
  REMOVE_REASONS: [
    { code: 'INVALID_RECORD', label: 'Incorrect / invalid record' },
    { code: 'DUPLICATE', label: 'Duplicate record' },
    { code: 'REVOKED', label: 'Certificate revoked by issuer' },
    { code: 'FARMER_REQUEST', label: 'Removed at farmer request' },
    { code: 'OTHER', label: 'Other' },
  ] as const,
  REMOVE_REMARKS_PLACEHOLDER: 'Explain why this record is being removed...',
  REMOVE_WARN_TITLE: 'This action will permanently remove the selected certification record.',
  REMOVE_WARN_OTHERS: 'The other certification record will remain unchanged.',
  REMOVE_WARN_OTHERS_PLURAL: 'The other certification records will remain unchanged.',
  REMOVE_WARN_HISTORY: "The selected record will no longer appear in the farmer's verification history.",
  BTN_CONFIRM_REMOVE: 'Remove Selected Record',
} as const;

/** Remarks fields in all three dialogs share the design's 250-character limit. */
export const VERIFICATION_REMARKS_MAX = 250;
