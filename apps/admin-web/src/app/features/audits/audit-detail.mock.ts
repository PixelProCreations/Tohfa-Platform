/**
 * UI-only placeholder data for Audit Details & Farmer Records (design 76) — replace with API when this
 * screen is integrated. The audit itself (header, Audit Information, most of Farmer Profile and
 * Farm & Land) comes from `mockAuditById(id)` in audit.mock.ts; this file only adds what that record
 * does not carry: profile status / registration date, certifications, previous audits, documents,
 * the pre-audit checklist and the activity timeline.
 *
 * Sources (per value), following apps/mobile/src/roles/admin/screens/audits/
 * auditDetailsRecordsFormat.ts, which maps the same design onto real endpoints:
 * - Audit fields: `GET /admin/audits/{id}` (docs/openapi.yaml `Audit`). `purpose`, `durationMinutes`
 *   and `supportingParticipants` are design-only (no column in db/migrations/0027_audits.sql).
 * - Farmer profile / registration / zone: `GET /admin/farmers/{id}`. Profile status values follow the
 *   mobile `FarmerUiStatus` (active / pending / disabled) in upper case.
 * - Documents: `GET /admin/farmers/{id}/documents` (`AdminFarmerDocument.docType` = ID_PROOF,
 *   ADDRESS_PROOF, FARM_DOC, CERTIFICATE, BANK_PROOF, PHOTO). Mapping used here: Identity proof =
 *   ID_PROOF, Address proof = ADDRESS_PROOF, Land ownership proof = FARM_DOC. "FMB sketch" and
 *   "Soil report" have no AdminFarmerDocument docType (the application slots LAND_PATTA / SOIL_CARD
 *   exist only on `FarmerDocumentItem`) — design values, a specification gap.
 *   "Submitted" = an uploaded row exists; it is NOT `verificationStatus = VERIFIED`.
 * - Certifications: `GET /admin/certifications?farmerId=` (design 76: none).
 * - Previous audits: `GET /admin/audits?farmerId=` with status COMPLETED (design 76: none).
 * - Pre-audit checklist: no endpoint — design values (a specification gap).
 * - Activity timeline: no activity / status-history endpoint (mobile marks it a GAP) — design values.
 *
 * Known design inconsistency, reproduced as designed: design 76's checklist shows "Certifications —
 * Submitted" while its Certifications card says "No certification records submitted."
 */
import type { AuditTone } from './audit.types';

/** Uploaded / not uploaded. Design 76 only shows "Submitted". */
export type AuditRecordStatus = 'SUBMITTED' | 'NOT_SUBMITTED';

/** Mobile `FarmerUiStatus`, upper-cased. */
export type AuditFarmerProfileStatus = 'ACTIVE' | 'PENDING' | 'DISABLED';

/** Documents listed on design 76 (see the header for the API docType each maps to). */
export type AuditDetailDocumentKind =
  | 'IDENTITY_PROOF'
  | 'ADDRESS_PROOF'
  | 'LAND_OWNERSHIP_PROOF'
  | 'FMB_SKETCH'
  | 'SOIL_REPORT';

export type AuditChecklistKind =
  | 'FARMER_PROFILE'
  | 'FARM_DETAILS'
  | 'FMB_SKETCH'
  | 'LAND_OWNERSHIP_PROOF'
  | 'CERTIFICATIONS'
  | 'SOIL_REPORT';

export type AuditTimelineKind = 'FARMER_REGISTERED' | 'FARM_PROFILE_CREATED' | 'AUDIT_SCHEDULED';

export interface AuditDetailDocument {
  readonly kind: AuditDetailDocumentKind;
  readonly status: AuditRecordStatus;
}

export interface AuditChecklistItem {
  readonly kind: AuditChecklistKind;
  readonly status: AuditRecordStatus;
}

export interface AuditTimelineEntry {
  readonly kind: AuditTimelineKind;
  /** ISO 8601, UTC wall-clock. */
  readonly at: string;
  /** Who performed it (AUDIT_SCHEDULED: the scheduling admin). */
  readonly actor: string | null;
}

export interface AuditCertificationEntry {
  readonly id: string;
  readonly name: string;
  /** YYYY-MM-DD. */
  readonly validUntil: string;
}

export interface AuditPreviousEntry {
  readonly id: string;
  /** YYYY-MM-DD. */
  readonly completedOn: string;
  /** 0–100 (BR-04: 10 categories x 10). */
  readonly totalScore: number;
}

export interface AuditDetailExtras {
  readonly auditId: string;
  readonly profileStatus: AuditFarmerProfileStatus;
  /** YYYY-MM-DD or null. */
  readonly registeredOn: string | null;
  readonly fmbSketch: AuditRecordStatus;
  readonly landOwnershipProof: AuditRecordStatus;
  readonly certifications: readonly AuditCertificationEntry[];
  readonly previousAudits: readonly AuditPreviousEntry[];
  readonly documents: readonly AuditDetailDocument[];
  readonly checklist: readonly AuditChecklistItem[];
  readonly timeline: readonly AuditTimelineEntry[];
}

/** Presentation: record-status pill tone (theme.css badges). */
export const AUDIT_RECORD_STATUS_TONE: Readonly<Record<AuditRecordStatus, AuditTone>> = {
  SUBMITTED: 'success',
  NOT_SUBMITTED: 'neutral',
};

export const AUDIT_PROFILE_STATUS_TONE: Readonly<Record<AuditFarmerProfileStatus, AuditTone>> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  DISABLED: 'neutral',
};

const DOCUMENT_ORDER: readonly AuditDetailDocumentKind[] = [
  'IDENTITY_PROOF',
  'ADDRESS_PROOF',
  'LAND_OWNERSHIP_PROOF',
  'FMB_SKETCH',
  'SOIL_REPORT',
];

const CHECKLIST_ORDER: readonly AuditChecklistKind[] = [
  'FARMER_PROFILE',
  'FARM_DETAILS',
  'FMB_SKETCH',
  'LAND_OWNERSHIP_PROOF',
  'CERTIFICATIONS',
  'SOIL_REPORT',
];

/** Design 76 (AUD-2026-0058, Arun Kumar), verbatim. */
const AUDIT_DETAIL_EXTRAS: readonly AuditDetailExtras[] = [
  {
    auditId: 'AUD-2026-0058',
    profileStatus: 'ACTIVE',
    registeredOn: '2026-11-18',
    fmbSketch: 'SUBMITTED',
    landOwnershipProof: 'SUBMITTED',
    certifications: [],
    previousAudits: [],
    documents: DOCUMENT_ORDER.map((kind) => ({ kind, status: 'SUBMITTED' })),
    checklist: CHECKLIST_ORDER.map((kind) => ({ kind, status: 'SUBMITTED' })),
    timeline: [
      { kind: 'FARMER_REGISTERED', at: '2026-11-18T11:20:00Z', actor: null },
      { kind: 'FARM_PROFILE_CREATED', at: '2026-11-20T09:45:00Z', actor: null },
      { kind: 'AUDIT_SCHEDULED', at: '2026-11-24T11:30:00Z', actor: 'Demo TOHFA Admin' },
    ],
  },
];

/**
 * Extras for an audit id, as a fresh copy. Ids without a dedicated entry get a neutral record
 * (nothing submitted, no history) so the screen never errors — those values are not from a design.
 */
export function mockAuditDetailExtras(auditId: string): AuditDetailExtras {
  const found = AUDIT_DETAIL_EXTRAS.find((e) => e.auditId === auditId);
  if (found !== undefined) {
    return {
      ...found,
      certifications: [...found.certifications],
      previousAudits: [...found.previousAudits],
      documents: [...found.documents],
      checklist: [...found.checklist],
      timeline: [...found.timeline],
    };
  }
  return {
    auditId,
    profileStatus: 'ACTIVE',
    registeredOn: null,
    fmbSketch: 'NOT_SUBMITTED',
    landOwnershipProof: 'NOT_SUBMITTED',
    certifications: [],
    previousAudits: [],
    documents: DOCUMENT_ORDER.map((kind) => ({ kind, status: 'NOT_SUBMITTED' })),
    checklist: CHECKLIST_ORDER.map((kind) => ({ kind, status: 'NOT_SUBMITTED' })),
    timeline: [],
  };
}
