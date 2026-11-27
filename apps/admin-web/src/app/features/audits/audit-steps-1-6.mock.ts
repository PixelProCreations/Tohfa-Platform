/**
 * UI-only placeholder data for inspection steps 1–6 (designs 79–84) — replace with API when these
 * screens are integrated. Nothing here is fetched or sent.
 *
 * The audit itself (farmer, farm, phone, address, GPS, area) comes from `mockAuditById()` in
 * audit.mock.ts. This file adds what those screens show beyond the audit record (profile extras such
 * as the FMB sketch and certifications) and the option lists of every select.
 *
 * Option lists: `value` is the real API / DB enum value where one exists; where docs/openapi.yaml and
 * the migrations define none, the list is the one implied by the design (plausible values, value =
 * an UPPER_SNAKE code invented here). Every list states its source. None of the audit-specific
 * verification answers (contact verification, FMB availability, boundary checks, …) exist in the API
 * yet: docs/openapi.yaml models an audit's checklist only as `AuditScore` / `AuditFinding`
 * (db/migrations/0027_audits.sql), so these sections are a SPECIFICATION GAP to be added to the spec
 * before integration (root CLAUDE.md §1).
 *
 * Option labels are kept with the lists (not in a strings catalogue) because, when integrated, they
 * come from the server together with their values.
 */
import type { AuditStepOption } from './audit-step-1-6-shared';

// ---------------------------------------------------------------------------------------------------
// Shared verification outcomes
// ---------------------------------------------------------------------------------------------------

/** Design-implied (designs 79, 80, 81, 84 "… Verification" selects). No API enum. */
export const AUDIT_STEP_VERIFICATION_OPTIONS: readonly AuditStepOption[] = [
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'NOT_VERIFIED', label: 'Not verified' },
  { value: 'NEEDS_CORRECTION', label: 'Needs correction' },
];

/** Design-implied availability answers (designs 80, 81, 83). No API enum. */
export const AUDIT_STEP_AVAILABILITY_OPTIONS: readonly AuditStepOption[] = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'PARTIALLY_AVAILABLE', label: 'Partially available' },
  { value: 'NOT_AVAILABLE', label: 'Not available' },
];

// ---------------------------------------------------------------------------------------------------
// Step 1 — Farmer Contact Verification (design 79)
// ---------------------------------------------------------------------------------------------------

/** Design-implied. (The platform's own channels — SMS / push / email — are notification settings, not a field contact method.) */
export const AUDIT_STEP1_CONTACT_METHOD_OPTIONS: readonly AuditStepOption[] = [
  { value: 'PHONE_CALL', label: 'Phone call' },
  { value: 'SMS', label: 'SMS' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'IN_PERSON', label: 'In person' },
];

/** "Contact Verification Status *" — AUDIT_STEP_VERIFICATION_OPTIONS (design-implied). */
export const AUDIT_STEP1_CONTACT_STATUS_OPTIONS = AUDIT_STEP_VERIFICATION_OPTIONS;

// ---------------------------------------------------------------------------------------------------
// Step 2 — FMB & Land Verification (design 80)
// ---------------------------------------------------------------------------------------------------

/** "FMB Document Available *" — design-implied. */
export const AUDIT_STEP2_FMB_AVAILABLE_OPTIONS = AUDIT_STEP_AVAILABILITY_OPTIONS;

/** Design-implied. */
export const AUDIT_STEP2_LEGIBILITY_OPTIONS: readonly AuditStepOption[] = [
  { value: 'CLEAR', label: 'Clear' },
  { value: 'PARTIALLY_LEGIBLE', label: 'Partially legible' },
  { value: 'ILLEGIBLE', label: 'Illegible' },
];

/** Design-implied. */
export const AUDIT_STEP2_BOUNDARY_OPTIONS: readonly AuditStepOption[] = [
  { value: 'MATCHES_FMB', label: 'Matches FMB sketch' },
  { value: 'MINOR_DEVIATION', label: 'Minor deviation' },
  { value: 'MAJOR_DEVIATION', label: 'Major deviation' },
  { value: 'NOT_VERIFIED', label: 'Not verified' },
];

/** "Farm Location Verification" — AUDIT_STEP_VERIFICATION_OPTIONS (design-implied). */
export const AUDIT_STEP2_LOCATION_OPTIONS = AUDIT_STEP_VERIFICATION_OPTIONS;

/** Design-implied. */
export const AUDIT_STEP2_PLOT_MAPPING_OPTIONS: readonly AuditStepOption[] = [
  { value: 'MAPPED', label: 'Mapped' },
  { value: 'PARTIALLY_MAPPED', label: 'Partially mapped' },
  { value: 'NOT_MAPPED', label: 'Not mapped' },
];

/**
 * Design-implied. (The farm's `landBoundaryContext` in apps/api/src/modules/farms/farms.schema.ts is
 * a free option list describing neighbours, not a verification outcome.)
 */
export const AUDIT_STEP2_LAND_BOUNDARY_OPTIONS: readonly AuditStepOption[] = [
  { value: 'CLEARLY_MARKED', label: 'Clearly marked' },
  { value: 'PARTIALLY_MARKED', label: 'Partially marked' },
  { value: 'NOT_MARKED', label: 'Not marked' },
  { value: 'DISPUTED', label: 'Disputed' },
];

// ---------------------------------------------------------------------------------------------------
// Step 3 — Farm Details Verification (design 81)
// ---------------------------------------------------------------------------------------------------

/** docs/openapi.yaml `farmingType: enum [ORGANIC, NATURAL, CONVENTIONAL]` (db 0141 crop master). */
export const AUDIT_STEP3_FARMING_TYPE_OPTIONS: readonly AuditStepOption[] = [
  { value: 'ORGANIC', label: 'Organic' },
  { value: 'NATURAL', label: 'Natural' },
  { value: 'CONVENTIONAL', label: 'Conventional' },
];

/**
 * Placeholder Nilgiris crops. The real list is the crop master (`GET /crops`); its rows are data,
 * so a few representative names stand in here.
 */
export const AUDIT_STEP3_CROP_OPTIONS: readonly AuditStepOption[] = [
  { value: 'CARROT', label: 'Carrot' },
  { value: 'CABBAGE', label: 'Cabbage' },
  { value: 'POTATO', label: 'Potato' },
  { value: 'BEANS', label: 'Beans' },
  { value: 'CAULIFLOWER', label: 'Cauliflower' },
  { value: 'GARLIC', label: 'Garlic' },
  { value: 'TEA', label: 'Tea' },
];

/**
 * Plot irrigation types — the mobile option list `farmer.zones.irrigation.*` (apps/mobile/src/i18n/
 * farmer.en.json). The DB column `plots.irrigation_type` is free text by design
 * (db/migrations/0020_farm_context_and_zones.sql), so the values are the mobile keys upper-cased.
 */
export const AUDIT_STEP3_IRRIGATION_OPTIONS: readonly AuditStepOption[] = [
  { value: 'DRIP', label: 'Drip' },
  { value: 'SPRINKLER', label: 'Sprinkler' },
  { value: 'FLOOD', label: 'Flood' },
  { value: 'RAINFED', label: 'Rainfed' },
  { value: 'FURROW', label: 'Furrow' },
];

/** "Farm Records Availability" — design-implied. */
export const AUDIT_STEP3_RECORDS_OPTIONS = AUDIT_STEP_AVAILABILITY_OPTIONS;

/** "Farm Details Verification *" — design-implied. */
export const AUDIT_STEP3_DETAILS_VERIFICATION_OPTIONS = AUDIT_STEP_VERIFICATION_OPTIONS;

// ---------------------------------------------------------------------------------------------------
// Water sources (steps 3 and 6)
// ---------------------------------------------------------------------------------------------------

/**
 * docs/openapi.yaml `waterSource: enum [BOREWELL, WELL, CANAL, PIPED_WATER, POND_RIVER,
 * RAINWATER_STORAGE]` (db/migrations/0084_livestock_animal_records.sql); labels from apps/mobile
 * `farmer.livestock.detail.waterSource.*`. (A farm's own `waterSources` is a free option list.)
 */
export const AUDIT_STEP_WATER_SOURCE_OPTIONS: readonly AuditStepOption[] = [
  { value: 'BOREWELL', label: 'Borewell' },
  { value: 'WELL', label: 'Well' },
  { value: 'CANAL', label: 'Canal' },
  { value: 'PIPED_WATER', label: 'Piped water' },
  { value: 'POND_RIVER', label: 'Pond / river' },
  { value: 'RAINWATER_STORAGE', label: 'Rainwater storage' },
];

// ---------------------------------------------------------------------------------------------------
// Step 4 — Certification Verification (design 82)
// ---------------------------------------------------------------------------------------------------

/**
 * "Certification Status" — design-implied. Deliberately NOT valid / expired: the design's note says
 * "The inspection does not declare a certificate valid or expired" (BR-01 expiry is computed by the
 * nightly sweep, BR-01b), so the auditor only records what was seen against the profile.
 */
export const AUDIT_STEP4_CERT_STATUS_OPTIONS: readonly AuditStepOption[] = [
  { value: 'MATCHES_PROFILE', label: 'Matches profile record' },
  { value: 'DIFFERS_FROM_PROFILE', label: 'Differs from profile record' },
  { value: 'NOT_PRESENTED', label: 'Certificate not presented' },
];

/**
 * "Document Verification *" — db/migrations/0001_extensions_and_enums.sql `verification_status`
 * (UNVERIFIED / VERIFIED / REJECTED), the column `certifications.verification_status` uses. BR-02b: only
 * a named human admin may move a row off UNVERIFIED — here nothing is stored.
 */
export const AUDIT_STEP4_DOC_VERIFICATION_OPTIONS: readonly AuditStepOption[] = [
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'UNVERIFIED', label: 'Unverified' },
  { value: 'REJECTED', label: 'Rejected' },
];

/** One certification on the farmer's profile (db `certifications`: cert_type, issued_on, expires_on). */
export interface AuditStepCertification {
  /** db `certification_type` enum: PGS | NPOP (OTHER added by 0029). */
  readonly certType: 'PGS' | 'NPOP' | 'OTHER';
  /** Display name ("PGS Organic"). */
  readonly label: string;
  /** Profile status as recorded ("Active"). */
  readonly profileStatus: string;
  /** ISO date, `issued_on`. */
  readonly certifiedOn: string;
  /** ISO date, `expires_on`. */
  readonly renewalOn: string;
  /** Name of the certificate document already on file, or null. */
  readonly documentName: string | null;
}

// ---------------------------------------------------------------------------------------------------
// Step 5 — Soil Testing & Soil Report (design 83)
// ---------------------------------------------------------------------------------------------------

/** "Soil Report Availability *" — design-implied (design shows "Available"). */
export const AUDIT_STEP5_REPORT_AVAILABILITY_OPTIONS: readonly AuditStepOption[] = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'PENDING_FROM_LAB', label: 'Pending from laboratory' },
  { value: 'NOT_AVAILABLE', label: 'Not available' },
];

/** "Report Verification Status" — design-implied. */
export const AUDIT_STEP5_REPORT_VERIFICATION_OPTIONS = AUDIT_STEP_VERIFICATION_OPTIONS;

/**
 * Placeholder laboratories. `soil_test_records` (db/migrations/0021_soil_management.sql) stores only
 * the uploaded lab report, not a laboratory list — so there is no source; generic names only.
 */
export const AUDIT_STEP5_LAB_OPTIONS: readonly AuditStepOption[] = [
  { value: 'GOVT_SOIL_LAB_OOTY', label: 'Government soil testing laboratory, Ooty' },
  { value: 'DISTRICT_SOIL_LAB', label: 'District soil testing laboratory, Nilgiris' },
  { value: 'PRIVATE_ACCREDITED_LAB', label: 'Private accredited laboratory' },
  { value: 'MOBILE_SOIL_LAB', label: 'Mobile soil testing van' },
  { value: 'FIELD_TEST_KIT', label: 'On-site field test kit' },
];

// ---------------------------------------------------------------------------------------------------
// Step 6 — Water Sources & Water pH Testing (design 84)
// ---------------------------------------------------------------------------------------------------

/** Design-implied. */
export const AUDIT_STEP6_USE_PURPOSE_OPTIONS: readonly AuditStepOption[] = [
  { value: 'IRRIGATION', label: 'Irrigation' },
  { value: 'PRODUCE_WASHING', label: 'Produce washing' },
  { value: 'LIVESTOCK', label: 'Livestock' },
  { value: 'DOMESTIC', label: 'Domestic' },
];

/** Design-implied. */
export const AUDIT_STEP6_SOURCE_TYPE_OPTIONS: readonly AuditStepOption[] = [
  { value: 'GROUNDWATER', label: 'Groundwater' },
  { value: 'SURFACE_WATER', label: 'Surface water' },
  { value: 'HARVESTED_RAINWATER', label: 'Harvested rainwater' },
  { value: 'MUNICIPAL_SUPPLY', label: 'Municipal supply' },
];

/** "Water Source Verification" — design-implied. */
export const AUDIT_STEP6_VERIFICATION_OPTIONS = AUDIT_STEP_VERIFICATION_OPTIONS;

/** Design-implied. */
export const AUDIT_STEP6_CONDITION_OPTIONS: readonly AuditStepOption[] = [
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'POOR', label: 'Poor' },
  { value: 'CONTAMINATION_RISK', label: 'Contamination risk' },
];

/** Design-implied (water pH testing methods). */
export const AUDIT_STEP6_TEST_METHOD_OPTIONS: readonly AuditStepOption[] = [
  { value: 'PH_METER', label: 'Digital pH meter' },
  { value: 'PH_STRIPS', label: 'pH test strips' },
  { value: 'LAB_TEST', label: 'Laboratory test' },
];

// ---------------------------------------------------------------------------------------------------
// Per-audit profile extras (what the step screens show beyond AuditDetailRecord)
// ---------------------------------------------------------------------------------------------------

export interface AuditStepProfileExtras {
  /** Farm `surveyNumber` (openapi `Farm.surveyNumber`); null = "Not on record". */
  readonly surveyNumber: string | null;
  /** FMB sketch already on file (design 80), or null. */
  readonly fmbFile: { readonly name: string; readonly sizeBytes: number } | null;
  /** Farming type recorded on the profile ("Organic", design 81), or null. */
  readonly profileFarmingType: string | null;
  /** Plot / zone choices for the search-selects (designs 81, 83). */
  readonly plotOptions: readonly string[];
  readonly certifications: readonly AuditStepCertification[];
}

/** Designs 80–83 for AUD-2026-0042 (Ramesh Kumar). */
const EXTRAS_BY_AUDIT: Readonly<Record<string, AuditStepProfileExtras>> = {
  'AUD-2026-0042': {
    surveyNumber: null,
    // Design 80: "FMB_00124_sketch.pdf (2.4 MB)".
    fmbFile: { name: 'FMB_00124_sketch.pdf', sizeBytes: Math.round(2.4 * 1024 * 1024) },
    profileFarmingType: 'Organic',
    plotOptions: ['Plot 1 · Zone A', 'Plot 2 · Zone B', 'Plot 3 · Zone C'],
    certifications: [
      // Design 82, verbatim dates.
      {
        certType: 'PGS',
        label: 'PGS Organic',
        profileStatus: 'Active',
        certifiedOn: '2026-06-12',
        renewalOn: '2027-06-12',
        documentName: 'PGS Organic Certificate',
      },
      {
        certType: 'NPOP',
        label: 'NPOP',
        profileStatus: 'Certified',
        certifiedOn: '2026-03-01',
        renewalOn: '2027-03-01',
        documentName: null,
      },
    ],
  },
};

/**
 * Profile extras for an audit (a fresh copy). Audits without a dedicated entry get an empty profile:
 * no FMB sketch, no certifications, plots from the audit record.
 */
export function mockAuditStepExtras(auditId: string, plotIds: readonly string[]): AuditStepProfileExtras {
  const known = EXTRAS_BY_AUDIT[auditId];
  if (known !== undefined) {
    return {
      ...known,
      plotOptions: [...known.plotOptions],
      certifications: known.certifications.map((c) => ({ ...c })),
    };
  }
  return {
    surveyNumber: null,
    fmbFile: null,
    profileFarmingType: null,
    plotOptions: [...plotIds],
    certifications: [],
  };
}
