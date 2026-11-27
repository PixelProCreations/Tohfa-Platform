/**
 * UI-only placeholder data for Audit Details & Farmer Records — FULL RECORD layout (design 94).
 * Replace with API when this screen is integrated.
 *
 * Which layout an audit gets (decided in AuditDetailComponent via `auditDetailUsesFullLayout`):
 * - status UPCOMING (design 76) or an id no mock knows → the existing upcoming layout;
 * - every other status of a known audit → this full-record layout.
 *
 * Header and "Audit Information" come from `mockAuditById(id)` (audit.mock.ts) so every audit screen
 * shows the same audit. Everything else on design 94 comes from this file:
 * - AUD-2026-0034: design 94, verbatim.
 * - Every other known, non-upcoming id: a record generated from `mockAuditById(id)` (farmer, zone,
 *   plots, schedule, auditor) with no certification, documents, evidence, previous audits, corrective
 *   actions or activity, and every category "Not scored" (BR-06: null, never 0) — the same state
 *   audit-findings.mock.ts gives every audit. Those generated values are NOT from a design.
 *
 * Sources when integrated (docs/openapi.yaml): audit / overview → `GET /admin/audits/{id}`; farmer →
 * `GET /admin/farmers/{id}`; documents → `GET /admin/farmers/{id}/documents`; certification →
 * `GET /admin/certifications?farmerId=`; previous audits → `GET /admin/audits?farmerId=`; category
 * scores → `AuditDetail.categoryScores`. Quarter, upcoming audit, external organisation, notes,
 * supporting evidence, corrective-action review, red flag and the activity feed have no endpoint or
 * column yet (db/migrations/0027_audits.sql) — design values, a specification gap.
 *
 * Known design-94 inconsistencies, reproduced as drawn (flag to design, do not "fix" silently):
 * - Header / Audit Information pill says "Scheduled" (scheduled 28 Oct 2026, 10:00) while Overview
 *   says Status "Cancelled", Schedule "16 Oct 2026, 10:00" and the activity feed's latest entry is
 *   "Cancelled".
 * - Audit Information names the farmer "Meena · FMR-00177" on plot PLT-00177-1, but the Farmer card
 *   shows "Ramesh Kumar · FMR-00124" and Farm & Land lists plots PT-00124-1 / PT-00124-2 (different
 *   farmer, different "PT-" prefix).
 * - Red flag shows "Minor Findings 1, Major Findings 0" while every previous audit lists a major
 *   finding; these counts have no visible source on the screen and are kept as drawn.
 * - The corrective action CA-2026-0001 belongs to AUD-2026-0001 (a previous audit), not this one.
 * - Overview "Upcoming audit 27 Oct 2027" while each previous audit says "Audit completion: Not
 *   scheduled."
 * - The activity remark "hivhish" is placeholder text in the design, kept verbatim.
 */
import {
  AUDIT_RATING_CATEGORIES,
  AUDIT_CALENDAR_EVENTS,
  AUDIT_LIST_MOCK,
  AUDIT_REFERENCE_DATE,
  mockAuditById,
} from './audit.mock';
import type { AuditRatingCategoryCode, AuditTone, AuditType, AuditUiStatus } from './audit.types';

/** The audit design 94 draws. */
export const AUDIT_DETAIL_FULL_DESIGN_ID = 'AUD-2026-0034';

/**
 * Local red-flag (design 95 dialog): who the Red flag card says took the action, and the fixed
 * timestamp it shows — the module's reference date at 10:00 (UTC wall-clock), never the real clock.
 * When integrated, both come from the server's red-flag record (no endpoint yet — spec gap).
 */
export const AUDIT_RED_FLAG_DEMO_ACTOR = 'TOHFA Admin';
export const AUDIT_RED_FLAG_DEMO_AT = `${AUDIT_REFERENCE_DATE}T10:00:00Z`;

export type AuditFullCertificationStatus = 'ACTIVE' | 'EXPIRED';
export type AuditFullVerificationStatus = 'VERIFIED' | 'PENDING' | 'REJECTED';
export type AuditFullDocumentKind = 'IDENTITY_PROOF' | 'LAND_OWNERSHIP_PROOF' | 'SOIL_REPORT';
/** Where a listed document lives. Design 94 only shows "Farmer record". */
export type AuditFullDocumentSource = 'FARMER_RECORD';
export type AuditFullEvidenceKind = 'FMB_SKETCH' | 'CERTIFICATE';
export type AuditCorrectiveActionStatus = 'OPEN' | 'CLOSED';
export type AuditCorrectiveReviewOutcome = 'ACCEPTED' | 'REJECTED';

export interface AuditFullOverview {
  /** ISO 8601, UTC wall-clock. */
  readonly scheduledAt: string;
  readonly durationMinutes: number | null;
  readonly type: AuditType;
  readonly purpose: string | null;
  readonly status: AuditUiStatus;
  readonly leadAuditor: string;
  /** YYYY-MM-DD or null. */
  readonly upcomingAuditOn: string | null;
  readonly externalOrganization: string | null;
  readonly notes: string | null;
}

export interface AuditFullFarmer {
  readonly name: string;
  readonly code: string;
  readonly farmingType: string | null;
  readonly zone: string;
  /** YYYY-MM-DD or null. */
  readonly registeredOn: string | null;
  /** Already masked / display-formatted, or null. */
  readonly contact: string | null;
}

export interface AuditFullCertification {
  /** "PGS Organic". */
  readonly type: string;
  readonly status: AuditFullCertificationStatus;
  /** YYYY-MM-DD. */
  readonly certifiedOn: string;
  /** YYYY-MM-DD. */
  readonly expiresOn: string;
  readonly documentRef: string;
  readonly verification: AuditFullVerificationStatus;
}

export interface AuditFullDocument {
  readonly source: AuditFullDocumentSource;
  readonly kind: AuditFullDocumentKind;
}

export interface AuditFullPlot {
  readonly id: string;
  /** Acres as a display string ("0.5") or null. */
  readonly areaAcres: string | null;
}

export interface AuditFullFarm {
  readonly location: string;
  /** File name of the FMB sketch, or null when none is on file. */
  readonly fmbSketchFile: string | null;
  readonly plots: readonly AuditFullPlot[];
}

export interface AuditFullPreviousAudit {
  readonly id: string;
  readonly type: AuditType;
  /** YYYY-MM-DD. */
  readonly date: string;
  readonly majorFindings: number;
  readonly minorFindings: number;
  /** 0–100, or null when the design shows no score. */
  readonly totalScore: number | null;
  /** YYYY-MM-DD of the follow-up audit, or null ("Not scheduled."). */
  readonly completionAuditOn: string | null;
}

export interface AuditFullEvidence {
  readonly kind: AuditFullEvidenceKind;
  readonly onFile: boolean;
}

export interface AuditFullCategoryScore {
  readonly code: AuditRatingCategoryCode;
  /** null = not scored (BR-06), never 0. */
  readonly score: number | null;
}

export interface AuditFullCorrectiveAction {
  readonly id: string;
  readonly status: AuditCorrectiveActionStatus;
  readonly auditId: string;
  readonly findingId: string;
  /** Free text as entered ("produce quality"). */
  readonly correction: string;
  readonly responsible: string;
  /** YYYY-MM-DD. */
  readonly dueOn: string;
  readonly completionEvidence: string | null;
  readonly reviewOutcome: AuditCorrectiveReviewOutcome | null;
  /** YYYY-MM-DD or null. */
  readonly closedOn: string | null;
}

export interface AuditFullRedFlag {
  readonly flagged: boolean;
  readonly reason: string | null;
  readonly actionBy: string | null;
  /** ISO 8601, UTC wall-clock, or null. */
  readonly at: string | null;
  readonly minorFindings: number;
  readonly majorFindings: number;
}

export interface AuditFullActivity {
  /** ISO 8601, UTC wall-clock. */
  readonly at: string;
  readonly actor: string;
  /** The status the audit moved to. */
  readonly status: AuditUiStatus;
  /** Free-text remark as entered, or null. */
  readonly remark: string | null;
  /** For a scheduling entry: the ISO date-time it was scheduled for. */
  readonly scheduledFor: string | null;
}

export interface AuditFullRecord {
  readonly auditId: string;
  readonly overview: AuditFullOverview;
  readonly farmer: AuditFullFarmer;
  readonly certification: AuditFullCertification | null;
  readonly documents: readonly AuditFullDocument[];
  readonly farm: AuditFullFarm;
  readonly previousAudits: readonly AuditFullPreviousAudit[];
  readonly evidence: readonly AuditFullEvidence[];
  /** Always 10 rows in AUDIT_RATING_CATEGORIES order. */
  readonly categoryScores: readonly AuditFullCategoryScore[];
  readonly correctiveActions: readonly AuditFullCorrectiveAction[];
  readonly redFlag: AuditFullRedFlag;
  readonly activity: readonly AuditFullActivity[];
}

/** Presentation: text tone for the certification / verification values (design 94: red / green). */
export const AUDIT_FULL_CERT_STATUS_TONE: Readonly<Record<AuditFullCertificationStatus, AuditTone>> = {
  ACTIVE: 'success',
  EXPIRED: 'danger',
};

export const AUDIT_FULL_VERIFICATION_TONE: Readonly<Record<AuditFullVerificationStatus, AuditTone>> = {
  VERIFIED: 'success',
  PENDING: 'warning',
  REJECTED: 'danger',
};

export const AUDIT_CORRECTIVE_STATUS_TONE: Readonly<Record<AuditCorrectiveActionStatus, AuditTone>> = {
  OPEN: 'warning',
  CLOSED: 'success',
};

/** Design 94's category scores, in AUDIT_RATING_CATEGORIES order. */
const DESIGN_94_SCORES: Readonly<Record<AuditRatingCategoryCode, number>> = {
  CERTIFICATION: 8,
  SOIL_LAND: 7,
  FARMING_PRACTICES: 8,
  ENVIRONMENTAL: 7,
  PRODUCE_QUALITY: 8,
  TRACEABILITY: 9,
  SOCIAL_LABOR: 7,
  FINANCIAL: 8,
  MARKET_RELATIONS: 8,
  INNOVATION: 8,
};

/** Design 94 (AUD-2026-0034), verbatim — including its inconsistencies (see the header). */
const AUDIT_FULL_RECORDS: readonly AuditFullRecord[] = [
  {
    auditId: AUDIT_DETAIL_FULL_DESIGN_ID,
    overview: {
      scheduledAt: '2026-10-16T10:00:00Z',
      durationMinutes: 120,
      type: 'INTERNAL',
      purpose: 'Quarterly audit',
      status: 'CANCELLED',
      leadAuditor: 'Priya Nair',
      upcomingAuditOn: '2027-10-27',
      externalOrganization: null,
      notes: null,
    },
    farmer: {
      name: 'Ramesh Kumar',
      code: 'FMR-00124',
      farmingType: 'Natural',
      zone: 'Coonoor',
      registeredOn: '2026-01-10',
      contact: '+91 10000 20000',
    },
    certification: {
      type: 'PGS Organic',
      status: 'EXPIRED',
      certifiedOn: '2025-09-24',
      expiresOn: '2026-09-24',
      documentRef: 'CERT-2026-300',
      verification: 'VERIFIED',
    },
    documents: [
      { source: 'FARMER_RECORD', kind: 'IDENTITY_PROOF' },
      { source: 'FARMER_RECORD', kind: 'LAND_OWNERSHIP_PROOF' },
      { source: 'FARMER_RECORD', kind: 'SOIL_REPORT' },
    ],
    farm: {
      location: 'Demo plot, Coonoor',
      fmbSketchFile: 'fmb-sketch-1.pdf',
      plots: [
        { id: 'PT-00124-1', areaAcres: '1' },
        { id: 'PT-00124-2', areaAcres: '0.5' },
      ],
    },
    previousAudits: [
      { id: 'AUD-2026-0003', type: 'EXTERNAL', date: '2026-07-24', majorFindings: 1, minorFindings: 1, totalScore: null, completionAuditOn: null },
      { id: 'AUD-2026-0002', type: 'INTERNAL', date: '2026-04-28', majorFindings: 1, minorFindings: 0, totalScore: 87, completionAuditOn: null },
      { id: 'AUD-2026-0001', type: 'EXTERNAL', date: '2026-01-18', majorFindings: 1, minorFindings: 0, totalScore: null, completionAuditOn: null },
    ],
    evidence: [
      { kind: 'FMB_SKETCH', onFile: true },
      { kind: 'CERTIFICATE', onFile: true },
    ],
    categoryScores: AUDIT_RATING_CATEGORIES.map((c) => ({ code: c.code, score: DESIGN_94_SCORES[c.code] })),
    correctiveActions: [
      {
        id: 'CA-2026-0001',
        status: 'CLOSED',
        auditId: 'AUD-2026-0001',
        findingId: 'FND-2026-0002',
        correction: 'produce quality',
        responsible: 'Ramesh Kumar',
        dueOn: '2026-02-17',
        completionEvidence: 'completion-1.jpeg',
        reviewOutcome: 'ACCEPTED',
        closedOn: '2026-02-14',
      },
    ],
    redFlag: {
      flagged: false,
      reason: null,
      actionBy: 'TOHFA Admin',
      at: '2026-10-14T10:00:00Z',
      minorFindings: 1,
      majorFindings: 0,
    },
    activity: [
      { at: '2026-10-14T10:00:00Z', actor: 'Demo TOHFA Admin', status: 'CANCELLED', remark: 'hivhish', scheduledFor: null },
      { at: '2026-09-28T09:00:00Z', actor: 'Demo TOHFA Admin', status: 'SCHEDULED', remark: null, scheduledFor: '2026-10-16T10:00:00Z' },
    ],
  },
];

/**
 * True when some audit mock knows this id (design 94's audit, a schedule-list row or a calendar
 * event; AUD-2026-0042 / 0058 are list rows too). `mockAuditById` never fails — it fabricates a
 * fallback for unknown ids — so the layout switch needs this to send unknown ids to the default layout.
 */
export function isKnownAuditId(id: string): boolean {
  return (
    AUDIT_FULL_RECORDS.some((r) => r.auditId === id) ||
    AUDIT_LIST_MOCK.some((r) => r.id === id) ||
    AUDIT_CALENDAR_EVENTS.some((e) => e.auditId === id)
  );
}

/** Layout switch: UPCOMING or unknown → upcoming layout (design 76); anything else → design 94. */
export function auditDetailUsesFullLayout(id: string): boolean {
  return isKnownAuditId(id) && mockAuditById(id).status !== 'UPCOMING';
}

/**
 * The full record for an audit id, as a fresh copy. Ids without a design-94 entry get a record
 * generated from `mockAuditById(id)` with empty histories (see the header — not from a design).
 */
export function mockAuditFullRecord(id: string): AuditFullRecord {
  const found = AUDIT_FULL_RECORDS.find((r) => r.auditId === id);
  if (found !== undefined) {
    return {
      ...found,
      documents: [...found.documents],
      farm: { ...found.farm, plots: [...found.farm.plots] },
      previousAudits: [...found.previousAudits],
      evidence: [...found.evidence],
      categoryScores: [...found.categoryScores],
      correctiveActions: [...found.correctiveActions],
      activity: [...found.activity],
    };
  }
  const a = mockAuditById(id);
  return {
    auditId: a.id,
    overview: {
      scheduledAt: a.scheduledAt,
      durationMinutes: a.durationMinutes,
      type: a.type,
      purpose: a.purpose,
      status: a.status,
      leadAuditor: a.auditorName,
      upcomingAuditOn: null,
      externalOrganization: null,
      notes: null,
    },
    farmer: {
      name: a.farmerName,
      code: a.farmerCode,
      farmingType: a.farmingType,
      zone: a.zone,
      registeredOn: null,
      contact: a.phone,
    },
    certification: null,
    documents: [],
    farm: {
      location: a.location,
      fmbSketchFile: null,
      plots: a.plotIds.map((p) => ({ id: p, areaAcres: a.plotIds.length === 1 ? a.areaAcres : null })),
    },
    previousAudits: [],
    evidence: [],
    categoryScores: AUDIT_RATING_CATEGORIES.map((c) => ({ code: c.code, score: null })),
    correctiveActions: [],
    redFlag: {
      flagged: false,
      reason: null,
      actionBy: null,
      at: null,
      minorFindings: 0,
      majorFindings: 0,
    },
    activity: [],
  };
}
