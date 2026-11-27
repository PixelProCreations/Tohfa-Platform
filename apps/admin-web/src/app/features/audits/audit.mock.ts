/**
 * UI-only placeholder data — replace with API when this screen is integrated.
 *
 * One mock for the whole Audit Management module (designs 74–90), so every screen shows the same
 * audits. Nothing here is fetched or sent. When integrated, the list / calendar come from
 * `GET /admin/audits` (listAudits), a single audit from `GET /admin/audits/{id}`, and scores /
 * findings from `PUT /admin/audits/{id}/scores` and `/findings` — see docs/openapi.yaml.
 *
 * Sources (per value):
 * - Audit types INTERNAL / EXTERNAL and statuses SCHEDULED / IN_PROGRESS / COMPLETED / CANCELLED:
 *   docs/openapi.yaml `AuditType`, `AuditStatus`; db/migrations/0027_audits.sql. Pending Review,
 *   Overdue, Upcoming and "Post scheduled date" are design-only (see audit.types.ts).
 * - Zones: db/seed/005_zones.sql (Ooty, Coonoor, Kotagiri, Gudalur).
 * - Auditors: designs 74–78 (S. Mohan, R. Devi, Priya Nair, Suresh Kumar, External Agency). The API
 *   has `auditorUserId` (internal) or `externalAgencyName` (external); there is no auditor list
 *   endpoint, so these names are design placeholders.
 * - Audit rows: design 75 (all ten rows verbatim). Calendar day 9: design 74 verbatim. Other calendar
 *   days only show dots in design 74, so their audits are invented here to give each dot a row.
 * - Detail records AUD-2026-0042 / 0058 / 0034: designs 76–79 and 90.
 * - The 12 inspection sections: design 78 (titles also in apps/mobile/src/roles/admin/i18n/
 *   auditsInspectionOverview.en.json, which differs in sections 8–9 — the design wins here).
 * - Rating categories: docs/openapi.yaml `RatingCategoryCode`; labels from apps/mobile/src/roles/
 *   admin/i18n/farmerDetail.en.json; short labels from design 77. Max 10 each (BR-04, BR-06).
 * - Severities: docs/openapi.yaml `AuditFindingSeverity`. Tier bands: db/seed/001_reference.sql
 *   rating_tier_config (BR-04b) — integrated screens must read them from config, not from here.
 *
 * Known design inconsistencies, reproduced as designed (flag to design, do not "fix" silently):
 * - AUD-2026-0042 is "Ramesh Kumar · Ooty Farm 01, Ooty, S. Mohan" in design 75 but "Ramesh Organic
 *   Farm, Coonoor, Suresh Kumar" in designs 78–90. The list row keeps design 75; the detail record
 *   (mockAuditById) keeps 78–90.
 * - AUD-2026-0058 is "Kavitha · Kavitha Farm" in design 75 but "Arun Kumar · Arun Organic Farm" in
 *   design 76. Same split as above.
 * - Design 74 lists AUD-2026-0053 (scheduled 15 Oct) and AUD-2026-0052 (scheduled 8 Oct) under the
 *   selected day 09 Oct 2026.
 * - Design 74 shows "Zone A" / "Zone C" where design 75 shows zone names. Zone letters for the
 *   invented rows follow A = Coonoor, B = Ooty, C = Kotagiri, D = Gudalur (an assumption).
 */
import { AUDIT_STRINGS as S } from './audit.strings';
import type {
  AuditAuditor,
  AuditCalendarEvent,
  AuditDetailRecord,
  AuditInspectionSection,
  AuditListRow,
  AuditRatingCategory,
  AuditTierBand,
  AuditType,
  AuditUiStatus,
  AuditZone,
} from './audit.types';

/**
 * "Today" for the whole module: the latest "Last Updated" in design 75. A fixed constant so every
 * placeholder renders the same regardless of the real clock — never use `new Date()` in these screens.
 */
export const AUDIT_REFERENCE_DATE = '2026-10-22';

/** Month and day the dashboard calendar opens on (design 74: October 2026, day 9 selected). */
export const AUDIT_DASHBOARD_INITIAL_YEAR = 2026;
/** 0-based (9 = October). */
export const AUDIT_DASHBOARD_INITIAL_MONTH0 = 9;
export const AUDIT_DASHBOARD_INITIAL_DAY = '2026-10-09';

export const AUDIT_ZONES: readonly AuditZone[] = ['Ooty', 'Coonoor', 'Kotagiri', 'Gudalur'];

export const AUDIT_TYPES: readonly AuditType[] = ['INTERNAL', 'EXTERNAL'];

export const AUDIT_AUDITORS: readonly AuditAuditor[] = [
  { id: 'aud-usr-1', name: 'S. Mohan', external: false },
  { id: 'aud-usr-2', name: 'R. Devi', external: false },
  { id: 'aud-usr-3', name: 'Priya Nair', external: false },
  { id: 'aud-usr-4', name: 'Suresh Kumar', external: false },
  { id: 'aud-ext-1', name: 'External Agency', external: true },
];

/** Statuses offered by list filters, in the design's pill order. */
export const AUDIT_FILTER_STATUSES: readonly AuditUiStatus[] = [
  'SCHEDULED',
  'IN_PROGRESS',
  'PENDING_REVIEW',
  'COMPLETED',
  'OVERDUE',
];

/** Module-wide KPI values on the dashboard (design 74). Not derivable from the rows below. */
export const AUDIT_DASHBOARD_KPI_VALUES = {
  upcoming: 6,
  inProgress: 1,
  pendingReview: 2,
  completed: 32,
  correctiveActionsOpen: 17,
  complianceAlerts: 5,
} as const;

/** Unread notification count on the dashboard bell (design 74). */
export const AUDIT_NOTIFICATION_COUNT = 3;

/** Rows per page on the schedule list (design 75 shows 10 of 10). */
export const AUDIT_LIST_PAGE_SIZE = 10;

/** Design 75, verbatim. */
export const AUDIT_LIST_MOCK: readonly AuditListRow[] = [
  { id: 'AUD-2026-0042', farmerName: 'Ramesh Kumar', farmName: 'Ooty Farm 01', zone: 'Ooty', type: 'INTERNAL', scheduledAt: '2026-10-15T10:00:00Z', auditorName: 'S. Mohan', status: 'IN_PROGRESS', updatedOn: '2026-10-15' },
  { id: 'AUD-2026-0053', farmerName: 'Selvi', farmName: 'Selvi Village Farm', zone: 'Coonoor', type: 'INTERNAL', scheduledAt: '2026-10-15T10:00:00Z', auditorName: 'S. Mohan', status: 'SCHEDULED', updatedOn: '2026-10-02' },
  { id: 'AUD-2026-0049', farmerName: 'Meena', farmName: 'Meena Farm', zone: 'Coonoor', type: 'INTERNAL', scheduledAt: '2026-09-24T09:30:00Z', auditorName: 'S. Mohan', status: 'COMPLETED', updatedOn: '2026-09-24' },
  { id: 'AUD-2026-0052', farmerName: 'Vijay', farmName: 'Kotagiri Farm', zone: 'Kotagiri', type: 'EXTERNAL', scheduledAt: '2026-10-08T09:30:00Z', auditorName: 'External Agency', status: 'OVERDUE', updatedOn: '2026-10-08' },
  { id: 'AUD-2026-0054', farmerName: 'Lakshmi', farmName: 'Lakshmi Farm House', zone: 'Coonoor', type: 'INTERNAL', scheduledAt: '2026-10-15T11:00:00Z', auditorName: 'R. Devi', status: 'SCHEDULED', updatedOn: '2026-10-10' },
  { id: 'AUD-2026-0055', farmerName: 'Anun', farmName: 'Green Valley Farm', zone: 'Ooty', type: 'INTERNAL', scheduledAt: '2026-10-19T10:30:00Z', auditorName: 'R. Devi', status: 'PENDING_REVIEW', updatedOn: '2026-10-19' },
  { id: 'AUD-2026-0056', farmerName: 'Priya', farmName: 'Hillview Farm', zone: 'Kotagiri', type: 'EXTERNAL', scheduledAt: '2026-10-20T14:00:00Z', auditorName: 'External Agency', status: 'SCHEDULED', updatedOn: '2026-10-12' },
  { id: 'AUD-2026-0057', farmerName: 'Ganesan', farmName: 'Ganesan Organic Farm', zone: 'Gudalur', type: 'INTERNAL', scheduledAt: '2026-10-12T09:00:00Z', auditorName: 'S. Mohan', status: 'OVERDUE', updatedOn: '2026-10-12' },
  { id: 'AUD-2026-0058', farmerName: 'Kavitha', farmName: 'Kavitha Farm', zone: 'Ooty', type: 'INTERNAL', scheduledAt: '2026-10-21T10:00:00Z', auditorName: 'R. Devi', status: 'IN_PROGRESS', updatedOn: '2026-10-21' },
  { id: 'AUD-2026-0059', farmerName: 'Senthil', farmName: 'Senthil Farm', zone: 'Gudalur', type: 'INTERNAL', scheduledAt: '2026-10-22T11:30:00Z', auditorName: 'S. Mohan', status: 'COMPLETED', updatedOn: '2026-10-22' },
];

/**
 * October 2026 calendar (design 74). Day 9 is verbatim; the other days carry invented audits so each
 * designed dot has a row (blue = Scheduled, amber = In Progress, grey check = Completed).
 */
export const AUDIT_CALENDAR_EVENTS: readonly AuditCalendarEvent[] = [
  { date: '2026-10-01', auditId: 'AUD-2026-0043', farmerName: 'Kumar', farmerCode: 'FMR-00125', farmLabel: 'Ooty farm', zoneLabel: 'Zone B', type: 'INTERNAL', scheduledAt: '2026-10-01T10:00:00Z', auditorName: 'R. Devi', status: 'SCHEDULED' },
  { date: '2026-10-01', auditId: 'AUD-2026-0044', farmerName: 'John', farmerCode: 'FMR-00126', farmLabel: 'Kotagiri farm', zoneLabel: 'Zone C', type: 'INTERNAL', scheduledAt: '2026-10-01T14:00:00Z', auditorName: 'S. Mohan', status: 'IN_PROGRESS' },
  { date: '2026-10-03', auditId: 'AUD-2026-0045', farmerName: 'Rani', farmerCode: 'FMR-00127', farmLabel: 'Gudalur farm', zoneLabel: 'Zone D', type: 'INTERNAL', scheduledAt: '2026-10-03T09:30:00Z', auditorName: 'Priya Nair', status: 'SCHEDULED' },
  { date: '2026-10-06', auditId: 'AUD-2026-0046', farmerName: 'Velu', farmerCode: 'FMR-00128', farmLabel: 'Ooty farm', zoneLabel: 'Zone B', type: 'INTERNAL', scheduledAt: '2026-10-06T10:00:00Z', auditorName: 'R. Devi', status: 'SCHEDULED' },
  { date: '2026-10-06', auditId: 'AUD-2026-0047', farmerName: 'Shanthi', farmerCode: 'FMR-00129', farmLabel: 'Coonoor farm', zoneLabel: 'Zone A', type: 'EXTERNAL', scheduledAt: '2026-10-06T11:30:00Z', auditorName: 'External agency', status: 'SCHEDULED' },
  { date: '2026-10-07', auditId: 'AUD-2026-0048', farmerName: 'Murugan', farmerCode: 'FMR-00130', farmLabel: 'Kotagiri farm', zoneLabel: 'Zone C', type: 'INTERNAL', scheduledAt: '2026-10-07T10:00:00Z', auditorName: 'S. Mohan', status: 'IN_PROGRESS' },
  // Design 74, verbatim.
  { date: '2026-10-09', auditId: 'AUD-2026-0053', farmerName: 'Selvi', farmerCode: 'FMR-00131', farmLabel: 'Coonoor farm', zoneLabel: 'Zone A', type: 'INTERNAL', scheduledAt: '2026-10-15T10:00:00Z', auditorName: 'S. Mohan', status: 'SCHEDULED' },
  { date: '2026-10-09', auditId: 'AUD-2026-0052', farmerName: 'Vijay', farmerCode: 'FMR-00152', farmLabel: 'Kotagiri farm', zoneLabel: 'Zone C', type: 'EXTERNAL', scheduledAt: '2026-10-08T09:30:00Z', auditorName: 'External agency', status: 'POST_SCHEDULED_DATE' },
  { date: '2026-10-14', auditId: 'AUD-2026-0050', farmerName: 'Anand', farmerCode: 'FMR-00132', farmLabel: 'Ooty farm', zoneLabel: 'Zone B', type: 'INTERNAL', scheduledAt: '2026-10-14T09:00:00Z', auditorName: 'R. Devi', status: 'IN_PROGRESS' },
  { date: '2026-10-20', auditId: 'AUD-2026-0051', farmerName: 'Devi', farmerCode: 'FMR-00133', farmLabel: 'Coonoor farm', zoneLabel: 'Zone A', type: 'INTERNAL', scheduledAt: '2026-10-20T10:00:00Z', auditorName: 'S. Mohan', status: 'COMPLETED' },
  { date: '2026-10-21', auditId: 'AUD-2026-0060', farmerName: 'Priya', farmerCode: 'FMR-00134', farmLabel: 'Gudalur farm', zoneLabel: 'Zone D', type: 'INTERNAL', scheduledAt: '2026-10-21T11:00:00Z', auditorName: 'Priya Nair', status: 'COMPLETED' },
  { date: '2026-10-31', auditId: 'AUD-2026-0061', farmerName: 'Ganesan', farmerCode: 'FMR-00135', farmLabel: 'Gudalur farm', zoneLabel: 'Zone D', type: 'INTERNAL', scheduledAt: '2026-10-31T10:00:00Z', auditorName: 'S. Mohan', status: 'COMPLETED' },
];

/** Detail records for the screens after the list (designs 76–90). */
const AUDIT_DETAIL_RECORDS: readonly AuditDetailRecord[] = [
  {
    // Designs 78–90 ("current audit" of the inspection flow).
    id: 'AUD-2026-0042',
    farmerName: 'Ramesh Kumar',
    farmerCode: 'FMR-00124',
    farmName: 'Ramesh Organic Farm',
    farmCode: 'FRM-00124-01',
    plotIds: [],
    zone: 'Coonoor',
    location: 'Coonoor, Nilgiris',
    areaAcres: '2.4',
    gps: '11.3530° N, 76.7959° E',
    phone: '+91 98XXX XX011',
    address: '12, Hill View Road, Coonoor, Nilgiris',
    farmingType: null,
    type: 'INTERNAL',
    status: 'IN_PROGRESS',
    scheduledAt: '2026-10-15T10:00:00Z',
    auditorName: 'Suresh Kumar',
    purpose: null,
    durationMinutes: null,
    supportingParticipants: [],
    lastUpdatedAt: '2026-10-15T10:00:00Z',
    lastUpdatedBy: null,
  },
  {
    // Design 76 (Audit Details & Farmer Records, Upcoming).
    id: 'AUD-2026-0058',
    farmerName: 'Arun Kumar',
    farmerCode: 'FMR-00318',
    farmName: 'Arun Organic Farm',
    farmCode: null,
    plotIds: ['PLT-00318-1', 'PLT-00318-2'],
    zone: 'Kotagiri',
    location: 'Kotagiri, Nilgiris',
    areaAcres: '2.1',
    gps: null,
    phone: '+91 98XXX 44210',
    address: null,
    farmingType: 'Organic',
    type: 'INTERNAL',
    status: 'UPCOMING',
    scheduledAt: '2026-12-02T10:00:00Z',
    auditorName: 'Priya Nair',
    purpose: 'Initial farmer verification',
    durationMinutes: 120,
    supportingParticipants: [],
    lastUpdatedAt: '2026-11-24T11:30:00Z',
    lastUpdatedBy: 'Demo TOHFA Admin',
  },
  {
    // Design 77 (Audit Inspection & Findings, Scheduled).
    id: 'AUD-2026-0034',
    farmerName: 'Meena',
    farmerCode: 'FMR-00177',
    farmName: 'Meena Farm',
    farmCode: null,
    plotIds: ['PLT-00177-1'],
    zone: 'Coonoor',
    location: 'Coonoor, Nilgiris',
    areaAcres: null,
    gps: null,
    phone: null,
    address: null,
    farmingType: null,
    type: 'INTERNAL',
    status: 'SCHEDULED',
    scheduledAt: '2026-10-28T10:00:00Z',
    auditorName: 'Priya Nair',
    purpose: 'Quarterly audit',
    durationMinutes: null,
    supportingParticipants: [],
    lastUpdatedAt: '2026-10-08T09:00:00Z',
    lastUpdatedBy: 'Demo TOHFA Admin',
  },
];

/** The 12 inspection sections of design 78, all "Not Started" (0 of 12 complete). */
export const AUDIT_INSPECTION_SECTIONS: readonly AuditInspectionSection[] = [
  { step: 1, title: S.SECTION_1, icon: 'contact_phone', requiredFieldsLeft: 1, description: null, status: 'NOT_STARTED' },
  { step: 2, title: S.SECTION_2, icon: 'map', requiredFieldsLeft: 1, description: null, status: 'NOT_STARTED' },
  { step: 3, title: S.SECTION_3, icon: 'agriculture', requiredFieldsLeft: 1, description: null, status: 'NOT_STARTED' },
  { step: 4, title: S.SECTION_4, icon: 'verified', requiredFieldsLeft: 3, description: null, status: 'NOT_STARTED' },
  { step: 5, title: S.SECTION_5, icon: 'science', requiredFieldsLeft: 1, description: null, status: 'NOT_STARTED' },
  { step: 6, title: S.SECTION_6, icon: 'water_drop', requiredFieldsLeft: 1, description: null, status: 'NOT_STARTED' },
  { step: 7, title: S.SECTION_7, icon: 'checklist', requiredFieldsLeft: 4, description: null, status: 'NOT_STARTED' },
  { step: 8, title: S.SECTION_8, icon: 'description', requiredFieldsLeft: null, description: null, status: 'NOT_STARTED' },
  { step: 9, title: S.SECTION_9, icon: 'assignment_ind', requiredFieldsLeft: 1, description: null, status: 'NOT_STARTED' },
  { step: 10, title: S.SECTION_10, icon: 'event', requiredFieldsLeft: 1, description: null, status: 'NOT_STARTED' },
  { step: 11, title: S.SECTION_11, icon: 'add_task', requiredFieldsLeft: null, description: null, status: 'NOT_STARTED' },
  { step: 12, title: S.SECTION_12, icon: 'star', requiredFieldsLeft: null, description: S.SECTION_12_DESCRIPTION, status: 'NOT_STARTED' },
];

/** Total required fields still missing in design 78 ("12 required fields are still missing"). */
export const AUDIT_INSPECTION_REQUIRED_MISSING = 12;

/** The 10 rating categories (docs/openapi.yaml RatingCategoryCode order). */
export const AUDIT_RATING_CATEGORIES: readonly AuditRatingCategory[] = [
  { code: 'CERTIFICATION', label: S.CAT_CERTIFICATION, shortLabel: S.CAT_CERTIFICATION_SHORT, icon: 'verified', maxScore: 10 },
  { code: 'SOIL_LAND', label: S.CAT_SOIL_LAND, shortLabel: S.CAT_SOIL_LAND_SHORT, icon: 'landscape', maxScore: 10 },
  { code: 'FARMING_PRACTICES', label: S.CAT_FARMING_PRACTICES, shortLabel: S.CAT_FARMING_PRACTICES_SHORT, icon: 'agriculture', maxScore: 10 },
  { code: 'ENVIRONMENTAL', label: S.CAT_ENVIRONMENTAL, shortLabel: S.CAT_ENVIRONMENTAL_SHORT, icon: 'eco', maxScore: 10 },
  { code: 'PRODUCE_QUALITY', label: S.CAT_PRODUCE_QUALITY, shortLabel: S.CAT_PRODUCE_QUALITY_SHORT, icon: 'emoji_events', maxScore: 10 },
  { code: 'TRACEABILITY', label: S.CAT_TRACEABILITY, shortLabel: S.CAT_TRACEABILITY_SHORT, icon: 'qr_code_2', maxScore: 10 },
  { code: 'SOCIAL_LABOR', label: S.CAT_SOCIAL_LABOR, shortLabel: S.CAT_SOCIAL_LABOR_SHORT, icon: 'groups', maxScore: 10 },
  { code: 'FINANCIAL', label: S.CAT_FINANCIAL, shortLabel: S.CAT_FINANCIAL_SHORT, icon: 'account_balance', maxScore: 10 },
  { code: 'MARKET_RELATIONS', label: S.CAT_MARKET_RELATIONS, shortLabel: S.CAT_MARKET_RELATIONS_SHORT, icon: 'storefront', maxScore: 10 },
  { code: 'INNOVATION', label: S.CAT_INNOVATION, shortLabel: S.CAT_INNOVATION_SHORT, icon: 'lightbulb', maxScore: 10 },
];

/** BR-04b bands from db/seed/001_reference.sql. Display-only here; integrated screens read config. */
export const AUDIT_TIER_BANDS: readonly AuditTierBand[] = [
  { tier: 'POOR', label: S.TIER_POOR, minScore: 0, maxScore: 49, tone: 'danger' },
  { tier: 'MODERATE', label: S.TIER_MODERATE, minScore: 50, maxScore: 69, tone: 'warning' },
  { tier: 'GOOD', label: S.TIER_GOOD, minScore: 70, maxScore: 84, tone: 'info' },
  { tier: 'EXCELLENT', label: S.TIER_EXCELLENT, minScore: 85, maxScore: 100, tone: 'success' },
];

function copyRecord(r: AuditDetailRecord): AuditDetailRecord {
  return { ...r, plotIds: [...r.plotIds], supportingParticipants: [...r.supportingParticipants] };
}

/** A detail record built from a list row (for list ids that have no dedicated detail record). */
function recordFromRow(row: AuditListRow): AuditDetailRecord {
  return {
    id: row.id,
    farmerName: row.farmerName,
    farmerCode: S.DASH,
    farmName: row.farmName,
    farmCode: null,
    plotIds: [],
    zone: row.zone,
    location: row.zone,
    areaAcres: null,
    gps: null,
    phone: null,
    address: null,
    farmingType: null,
    type: row.type,
    status: row.status,
    scheduledAt: row.scheduledAt,
    auditorName: row.auditorName,
    purpose: null,
    durationMinutes: null,
    supportingParticipants: [],
    lastUpdatedAt: `${row.updatedOn}T00:00:00Z`,
    lastUpdatedBy: null,
  };
}

/** Assumed zone-letter mapping (see the header note on design 74's "Zone A" / "Zone C"). */
const ZONE_BY_LETTER_LABEL: Readonly<Record<string, AuditZone>> = {
  'Zone A': 'Coonoor',
  'Zone B': 'Ooty',
  'Zone C': 'Kotagiri',
  'Zone D': 'Gudalur',
};

/** A calendar event as a detail record (invented dashboard audits). */
function recordFromEvent(e: AuditCalendarEvent): AuditDetailRecord {
  return {
    id: e.auditId,
    farmerName: e.farmerName,
    farmerCode: e.farmerCode,
    farmName: e.farmLabel,
    farmCode: null,
    plotIds: [],
    zone: ZONE_BY_LETTER_LABEL[e.zoneLabel] ?? 'Ooty',
    location: e.zoneLabel,
    areaAcres: null,
    gps: null,
    phone: null,
    address: null,
    farmingType: null,
    type: e.type,
    status: e.status,
    scheduledAt: e.scheduledAt,
    auditorName: e.auditorName,
    purpose: null,
    durationMinutes: null,
    supportingParticipants: [],
    lastUpdatedAt: null,
    lastUpdatedBy: null,
  };
}

/**
 * The audit for a route id, as a fresh COPY (callers may mutate it as local form state).
 * Lookup order: dedicated detail record → schedule-list row → calendar event → generic fallback
 * carrying the requested id, so no screen ever errors on an unknown id.
 */
export function mockAuditById(id: string): AuditDetailRecord {
  const detail = AUDIT_DETAIL_RECORDS.find((r) => r.id === id);
  if (detail !== undefined) return copyRecord(detail);
  const row = AUDIT_LIST_MOCK.find((r) => r.id === id);
  if (row !== undefined) return recordFromRow(row);
  const event = AUDIT_CALENDAR_EVENTS.find((e) => e.auditId === id);
  if (event !== undefined) return recordFromEvent(event);
  return {
    ...recordFromRow({
      id,
      farmerName: S.FALLBACK_FARMER,
      farmName: S.FALLBACK_FARM,
      zone: 'Ooty',
      type: 'INTERNAL',
      scheduledAt: `${AUDIT_REFERENCE_DATE}T10:00:00Z`,
      auditorName: S.DASH,
      status: 'SCHEDULED',
      updatedOn: AUDIT_REFERENCE_DATE,
    }),
  };
}

/** Fresh copies of the 12 sections (for screens that track per-section state locally). */
export function mockInspectionSections(): AuditInspectionSection[] {
  return AUDIT_INSPECTION_SECTIONS.map((s) => ({ ...s }));
}
