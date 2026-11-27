/**
 * UI-only placeholder data for inspection steps 7–12 (designs 85–90) — replace with API when these
 * screens are integrated. Nothing here is fetched or sent.
 *
 * The audit itself (farmer, farm, zone, dates) always comes from `mockAuditById(id)` in audit.mock.ts;
 * this file only holds what that record does not: select options, the existing-evidence rows, the
 * per-audit farm count / previous score, and the local upload constraints.
 *
 * Sources, per list (root CLAUDE.md §1 — where the spec has no enum, the list is a SPECIFICATION GAP
 * and is marked "design-implied"; it must be added to docs/openapi.yaml before integration):
 *
 * - Step 7 checklist sections (Farm Documentation, Organic Practices, Crop Management, Input Usage):
 *   design 85. No checklist schema exists in docs/openapi.yaml or db/migrations/0027_audits.sql.
 * - Step 7 Inspection Result: design-implied. Neither the API nor apps/mobile has a checklist result.
 * - Existing evidence (FMB Sketch, POS Organic Certificate): design 86. The API equivalent is the
 *   farmer's documents (`GET /admin/farmers/{id}/documents`, schema AdminFarmerDocument).
 * - Step 8 Evidence Category: docs/openapi.yaml AdminFarmerDocument.docType
 *   (ID_PROOF, ADDRESS_PROOF, FARM_DOC, CERTIFICATE, BANK_PROOF, PHOTO), most relevant first.
 * - Step 8 Evidence Verification Status: AdminFarmerDocument.verificationStatus
 *   (UNVERIFIED, VERIFIED, REJECTED).
 * - Step 8 Related Inspection Section: AUDIT_INSPECTION_SECTIONS 1–7 (design 78), the sections that
 *   precede this step.
 * - Step 8 Follow-up Recommendation and Missing Document Reason: design-implied.
 * - Step 8 Observation / Recommendation Notes max lengths: AuditFindingCreate.description /
 *   correctiveAction (maxLength 2000) — the closest existing fields.
 * - Step 9 Overall Assessment, Recommendation: design-implied. Follow-up Required: yes / no.
 * - Steps 10/11 Remarks max length 500: design 88/89 counter "0/500".
 * - Farm count (design 88/89 "Farms 3") and previous overall (design 90 "Previous overall: 68 / 100"):
 *   not on AuditDetailRecord, so kept per audit id here; other audits show "—" / nothing.
 * - Rating card order (design 90, row by row): Certification | Soil & Land, Produce Quality |
 *   Farming Practices, Social & Labor | Environmental, Market Relations | Traceability,
 *   Financial | Innovation. The codes are docs/openapi.yaml RatingCategoryCode.
 * - Score scale 1–10: design 90 draws buttons 1–10. The API accepts 0–10 (AuditCategoryScore.score,
 *   BR-06a); a 0 score cannot be entered on this design.
 * - Upload constraints (PDF / JPG / PNG, max 10 MB): designs 86, 88, 89. Integrated screens must take
 *   the real limits from `POST /uploads/sign` (purpose AUDIT_REPORT), not from here.
 */
import { AUDIT_INSPECTION_SECTIONS } from './audit.mock';
import type { AuditRatingCategoryCode } from './audit.types';
import { AUDIT_STEP_7_STRINGS as S7 } from './audit-step-7-practices.strings';
import { AUDIT_STEP_8_STRINGS as S8 } from './audit-step-8-documents.strings';
import { AUDIT_STEP_9_STRINGS as S9 } from './audit-step-9-assessment.strings';

/** Audit opened when a step route has no `:id` (designs 85–90 all show this audit). */
export const AUDIT_STEP_DEFAULT_ID = 'AUD-2026-0042';

/** One option of a native <select> or a search-select datalist. */
export interface AuditSelectOption {
  readonly value: string;
  readonly label: string;
}

// ---------------------------------------------------------------- Step 7

export type AuditPracticeSectionKey =
  | 'FARM_DOCUMENTATION'
  | 'ORGANIC_PRACTICES'
  | 'CROP_MANAGEMENT'
  | 'INPUT_USAGE';

export interface AuditPracticeSection {
  readonly key: AuditPracticeSectionKey;
  /** Header text as drawn (upper-case). */
  readonly title: string;
  /** Title-case name for errors and aria-labels. */
  readonly name: string;
  /** Material Symbols name. */
  readonly icon: string;
}

/** Design 85, in grid order (row by row). */
export const AUDIT_PRACTICE_SECTIONS: readonly AuditPracticeSection[] = [
  { key: 'FARM_DOCUMENTATION', title: S7.SECTION_FARM_DOCUMENTATION, name: S7.SECTION_FARM_DOCUMENTATION_NAME, icon: 'description' },
  { key: 'ORGANIC_PRACTICES', title: S7.SECTION_ORGANIC_PRACTICES, name: S7.SECTION_ORGANIC_PRACTICES_NAME, icon: 'eco' },
  { key: 'CROP_MANAGEMENT', title: S7.SECTION_CROP_MANAGEMENT, name: S7.SECTION_CROP_MANAGEMENT_NAME, icon: 'grass' },
  { key: 'INPUT_USAGE', title: S7.SECTION_INPUT_USAGE, name: S7.SECTION_INPUT_USAGE_NAME, icon: 'science' },
];

/** Design-implied (no checklist result enum exists in the spec). */
export const AUDIT_INSPECTION_RESULT_OPTIONS: readonly AuditSelectOption[] = [
  { value: 'COMPLIANT', label: S7.RESULT_COMPLIANT },
  { value: 'PARTIALLY_COMPLIANT', label: S7.RESULT_PARTIALLY_COMPLIANT },
  { value: 'NON_COMPLIANT', label: S7.RESULT_NON_COMPLIANT },
  { value: 'NOT_APPLICABLE', label: S7.RESULT_NOT_APPLICABLE },
];

// ---------------------------------------------------------------- Existing evidence (steps 7, 8)

export interface AuditExistingDocument {
  readonly id: string;
  readonly name: string;
  /** AdminFarmerDocument.docType. */
  readonly docType: 'FARM_DOC' | 'CERTIFICATE';
}

/** Design 86 rows, verbatim. Also the options of step 7's "Evidence (existing)" search-select. */
export const AUDIT_EXISTING_DOCUMENTS: readonly AuditExistingDocument[] = [
  { id: 'doc-fmb-sketch', name: 'FMB Sketch', docType: 'FARM_DOC' },
  { id: 'doc-pos-certificate', name: 'POS Organic Certificate', docType: 'CERTIFICATE' },
];

// ---------------------------------------------------------------- Step 8

/** AdminFarmerDocument.docType. */
export const AUDIT_EVIDENCE_CATEGORY_OPTIONS: readonly AuditSelectOption[] = [
  { value: 'FARM_DOC', label: S8.CATEGORY_FARM_DOC },
  { value: 'CERTIFICATE', label: S8.CATEGORY_CERTIFICATE },
  { value: 'PHOTO', label: S8.CATEGORY_PHOTO },
  { value: 'ID_PROOF', label: S8.CATEGORY_ID_PROOF },
  { value: 'ADDRESS_PROOF', label: S8.CATEGORY_ADDRESS_PROOF },
  { value: 'BANK_PROOF', label: S8.CATEGORY_BANK_PROOF },
];

/** AdminFarmerDocument.verificationStatus. */
export const AUDIT_EVIDENCE_VERIFICATION_OPTIONS: readonly AuditSelectOption[] = [
  { value: 'UNVERIFIED', label: S8.VERIFICATION_UNVERIFIED },
  { value: 'VERIFIED', label: S8.VERIFICATION_VERIFIED },
  { value: 'REJECTED', label: S8.VERIFICATION_REJECTED },
];

/** Inspection sections 1–7 (design 78) — value is the step number. */
export const AUDIT_RELATED_SECTION_OPTIONS: readonly AuditSelectOption[] = AUDIT_INSPECTION_SECTIONS.filter(
  (s) => s.step <= 7,
).map((s) => ({ value: String(s.step), label: s.title }));

/** Design-implied. */
export const AUDIT_FOLLOW_UP_RECOMMENDATION_OPTIONS: readonly AuditSelectOption[] = [
  { value: 'NONE', label: S8.FOLLOW_UP_NONE },
  { value: 'CORRECTIVE_ACTION', label: S8.FOLLOW_UP_CORRECTIVE_ACTION },
  { value: 'RESUBMIT_DOCUMENT', label: S8.FOLLOW_UP_RESUBMIT_DOCUMENT },
  { value: 'RE_INSPECTION', label: S8.FOLLOW_UP_RE_INSPECTION },
  { value: 'ESCALATE', label: S8.FOLLOW_UP_ESCALATE },
];

/** Design-implied. "Not applicable" exists because the field is required even when nothing is missing. */
export const AUDIT_MISSING_DOCUMENT_REASON_OPTIONS: readonly AuditSelectOption[] = [
  { value: 'NONE_MISSING', label: S8.MISSING_NONE },
  { value: 'NOT_YET_ISSUED', label: S8.MISSING_NOT_ISSUED },
  { value: 'UNDER_RENEWAL', label: S8.MISSING_UNDER_RENEWAL },
  { value: 'LOST_OR_DAMAGED', label: S8.MISSING_LOST_DAMAGED },
  { value: 'NOT_PROVIDED', label: S8.MISSING_NOT_PROVIDED },
];

/** AuditFindingCreate.description / correctiveAction maxLength. */
export const AUDIT_OBSERVATION_MAX_LENGTH = 2000;

// ---------------------------------------------------------------- Step 9

/** Design-implied. */
export const AUDIT_OVERALL_ASSESSMENT_OPTIONS: readonly AuditSelectOption[] = [
  { value: 'SATISFACTORY', label: S9.OVERALL_SATISFACTORY },
  { value: 'NEEDS_IMPROVEMENT', label: S9.OVERALL_NEEDS_IMPROVEMENT },
  { value: 'UNSATISFACTORY', label: S9.OVERALL_UNSATISFACTORY },
];

/** Design-implied. Red-flagging itself is an explicit admin action elsewhere (BR-05b). */
export const AUDIT_ASSESSMENT_RECOMMENDATION_OPTIONS: readonly AuditSelectOption[] = [
  { value: 'CONTINUE', label: S9.RECOMMEND_CONTINUE },
  { value: 'CORRECTIVE_ACTION_PLAN', label: S9.RECOMMEND_CORRECTIVE_PLAN },
  { value: 'RE_AUDIT', label: S9.RECOMMEND_RE_AUDIT },
  { value: 'RED_FLAG_REVIEW', label: S9.RECOMMEND_RED_FLAG_REVIEW },
];

export const AUDIT_FOLLOW_UP_REQUIRED_OPTIONS: readonly AuditSelectOption[] = [
  { value: 'YES', label: S9.FOLLOW_UP_YES },
  { value: 'NO', label: S9.FOLLOW_UP_NO },
];

// ---------------------------------------------------------------- Steps 10 / 11

/** Design 88/89 "0/500". */
export const AUDIT_REMARKS_MAX_LENGTH = 500;

/** Farm count per audit (design 88/89 "Farms 3"). Not on AuditDetailRecord. */
const AUDIT_FARM_COUNT_BY_ID: Readonly<Record<string, number>> = {
  'AUD-2026-0042': 3,
};

export function mockFarmCount(auditId: string): number | null {
  return AUDIT_FARM_COUNT_BY_ID[auditId] ?? null;
}

/**
 * Design 88/89 "Farmer & Farm Details" shows Farmer ID F-0256 and Total Area 4.25 Acre, which differ
 * from the shared detail record (FMR-00124 / 2.4). Overridden here only so the other screens that read
 * the detail record are unchanged.
 */
const AUDIT_STEP_10_FARM_SUMMARY_BY_ID: Readonly<Record<string, { farmerCode: string; areaAcres: string }>> = {
  'AUD-2026-0042': { farmerCode: 'F-0256', areaAcres: '4.25' },
};

export function mockStep10FarmSummary(auditId: string): { farmerCode: string; areaAcres: string } | null {
  return AUDIT_STEP_10_FARM_SUMMARY_BY_ID[auditId] ?? null;
}

// ---------------------------------------------------------------- Step 12

/** Design 90 "Previous overall: 68 / 100". */
const AUDIT_PREVIOUS_OVERALL_BY_ID: Readonly<Record<string, number>> = {
  'AUD-2026-0042': 68,
};

export function mockPreviousOverall(auditId: string): number | null {
  return AUDIT_PREVIOUS_OVERALL_BY_ID[auditId] ?? null;
}

/** Design 90 card order, row by row (left, right). */
export const AUDIT_RATING_CARD_ORDER: readonly AuditRatingCategoryCode[] = [
  'CERTIFICATION',
  'SOIL_LAND',
  'PRODUCE_QUALITY',
  'FARMING_PRACTICES',
  'SOCIAL_LABOR',
  'ENVIRONMENTAL',
  'MARKET_RELATIONS',
  'TRACEABILITY',
  'FINANCIAL',
  'INNOVATION',
];

/** Design 90 score buttons. */
export const AUDIT_SCORE_SCALE: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** The category that is open when step 12 loads (design 90). */
export const AUDIT_RATING_INITIAL_OPEN: AuditRatingCategoryCode = 'CERTIFICATION';

// ---------------------------------------------------------------- Uploads (steps 7, 8, 10, 11)

export const AUDIT_UPLOAD_ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';
export const AUDIT_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];
const ALLOWED_EXT = ['pdf', 'jpg', 'jpeg', 'png'];

/** Local check only — nothing is uploaded. `null` = acceptable. */
export function auditUploadProblem(file: { readonly name: string; readonly type: string; readonly size: number }): 'TYPE' | 'SIZE' | null {
  const ext = file.name.includes('.') ? (file.name.split('.').pop() ?? '').toLowerCase() : '';
  // Some browsers leave `type` empty for unknown extensions, so the extension is the fallback.
  const typeOk = file.type !== '' ? ALLOWED_MIME.includes(file.type) : ALLOWED_EXT.includes(ext);
  if (!typeOk) return 'TYPE';
  if (file.size > AUDIT_UPLOAD_MAX_BYTES) return 'SIZE';
  return null;
}
