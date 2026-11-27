/**
 * UI string catalogue for Audit Management → Audit Details & Farmer Records (design 76). Shared audit
 * strings (statuses, types, months) live in audit.strings.ts. Per root CLAUDE.md §2.7 strings do not
 * live in components.
 *
 * The two tab labels and the footer buttons are reused by the findings screen (design 77) so both
 * screens always name the tabs identically.
 */
export const AUDIT_DETAIL_STRINGS = {
  TITLE: 'Audit Details & Farmer Records',
  HEADER_META_REGION: 'Audit at a glance',
  META_FARMER: 'Farmer',
  META_FARM: 'Farm',
  META_SCHEDULED: 'Scheduled',
  META_AUDIT_TYPE: 'Audit type',

  // ---------- Tabs (also used by design 77) ----------
  TABS_LABEL: 'Audit views',
  TAB_DETAILS: 'Details & Farmer Records',
  TAB_FINDINGS: 'Inspection & Findings',

  // ---------- Audit Information ----------
  CARD_AUDIT_INFO: 'Audit Information',
  AUDIT_ID: 'Audit ID',
  STATUS: 'Status',
  AUDIT_TYPE: 'Audit type',
  SCHEDULED_DATE: 'Scheduled date',
  ASSIGNED_AUDITOR: 'Assigned auditor',
  AUDIT_PURPOSE: 'Audit purpose',
  DURATION: 'Duration',
  SUPPORTING_PARTICIPANTS: 'Supporting participants',
  LAST_UPDATED: 'Last updated',
  /** "24 Nov 2026, 11:30 · Demo TOHFA Admin" */
  lastUpdated: (when: string, by: string | null): string => (by === null ? when : `${when} · ${by}`),

  // ---------- Farmer Profile ----------
  CARD_FARMER_PROFILE: 'Farmer Profile',
  FARMER_NAME: 'Name',
  FARMER_ID: 'Farmer ID',
  FARMING_TYPE: 'Farming type',
  ZONE: 'Zone',
  REGISTERED: 'Registered',
  CONTACT: 'Contact',
  PROFILE_STATUS: 'Profile status',
  PROFILE_ACTIVE: 'Active',
  PROFILE_PENDING: 'Pending',
  PROFILE_DISABLED: 'Disabled',
  OPEN_FARMER_PROFILE: 'Open farmer profile',

  // ---------- Certifications / Previous audits ----------
  CARD_CERTIFICATIONS: 'Certifications',
  CERTIFICATIONS_EMPTY: 'No certification records submitted.',
  CERTIFICATIONS_EMPTY_HINT: 'Certification verification will be completed during the audit.',
  CERT_VALID_UNTIL: 'Valid until',
  CARD_PREVIOUS_AUDITS: 'Previous Audits',
  PREVIOUS_EMPTY: 'No previous audits.',
  PREVIOUS_EMPTY_HINT: "This is the farmer's first audit.",
  previousScore: (score: number): string => `${score} / 100`,

  // ---------- Farm & Land ----------
  CARD_FARM_LAND: 'Farm & Land',
  FARM_NAME: 'Farm name',
  FARM_LOCATION: 'Farm location',
  FARM_AREA: 'Farm area',
  acres: (a: string): string => `${a} acres`,
  PLOT_COUNT: 'Plot count',
  PLOT_IDS: 'Plot IDs',
  FMB_SKETCH: 'FMB sketch',
  LAND_OWNERSHIP_PROOF: 'Land ownership proof',

  // ---------- Documents ----------
  CARD_DOCUMENTS: 'Documents',
  DOC_IDENTITY_PROOF: 'Identity proof',
  DOC_ADDRESS_PROOF: 'Address proof',
  DOC_LAND_OWNERSHIP_PROOF: 'Land ownership proof',
  DOC_FMB_SKETCH: 'FMB sketch',
  DOC_SOIL_REPORT: 'Soil report',

  // ---------- Record statuses ----------
  RECORD_SUBMITTED: 'Submitted',
  RECORD_NOT_SUBMITTED: 'Not submitted',

  // ---------- Pre-audit checklist ----------
  CARD_CHECKLIST: 'Pre-audit Checklist / Readiness',
  CHECK_FARMER_PROFILE: 'Farmer profile',
  CHECK_FARM_DETAILS: 'Farm details',
  CHECK_FMB_SKETCH: 'FMB sketch',
  CHECK_LAND_OWNERSHIP_PROOF: 'Land ownership proof',
  CHECK_CERTIFICATIONS: 'Certifications',
  CHECK_SOIL_REPORT: 'Soil report',

  // ---------- Activity timeline ----------
  CARD_TIMELINE: 'Activity Timeline',
  TIMELINE_EMPTY: 'No activity recorded yet.',
  EVENT_FARMER_REGISTERED: 'Farmer registered',
  EVENT_FARMER_REGISTERED_DESC: 'New farmer account created in TOHFA.',
  EVENT_FARM_PROFILE_CREATED: 'Farm profile created',
  EVENT_FARM_PROFILE_CREATED_DESC: 'Farm and land details added by the farmer.',
  EVENT_AUDIT_SCHEDULED: 'Audit scheduled',
  eventAuditScheduledDesc: (by: string, when: string): string => `Audit scheduled by ${by} for ${when}.`,

  // ---------- Footer (also used by design 77) ----------
  FOOTER_LABEL: 'Audit actions',
  EDIT_SCHEDULE: 'Edit audit schedule',
  START_AUDIT: 'Start Audit',
} as const;
