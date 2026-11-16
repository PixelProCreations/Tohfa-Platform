/**
 * Pure display and body-building helpers for the Audit Schedule & Assignment
 * list and the Schedule Audit form. No React, no hooks: plain-Node vitest
 * covers everything here (tests/audits_schedule_logic.test.ts).
 *
 * Dates: every date the admin types or reads is an Asia/Kolkata calendar
 * date, because the server derives the fiscal quarter from `scheduledFor` in
 * IST (BR-03). IST has no daylight saving, so a fixed +05:30 offset is exact.
 */
import type {
  AuditCreateBody,
  AuditDetailDto,
  AuditStatus,
  AuditSummaryDto,
  AuditType,
  AuditUpdateBody,
} from '../../api/audits';
import { t, type TranslationKey } from '../../i18n';
import { formatAdminDay, formatAdminTime } from '../../utils/datetime';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import type catalogue from '../../i18n/auditsSchedule.en.json';
import type { AuditListFilters } from './useAuditsData';

/** A key of this screen pair's own catalogue (i18n/auditsSchedule.en.json). */
export type AuditsScheduleKey = keyof typeof catalogue;

/**
 * t() for this catalogue. The keys are checked against the JSON above; the
 * widening to TranslationKey only bridges the time before the catalogue is
 * registered in i18n/index.ts (an unregistered key renders as itself).
 */
export function ts(key: AuditsScheduleKey, params?: Record<string, string | number>): string {
  const wide: string = key;
  return t(wide as TranslationKey, params);
}

const IST_OFFSET = '+05:30';
const IST_OFFSET_MS = 330 * 60 * 1000;

// ---------------------------------------------------------------------------
// List rows
// ---------------------------------------------------------------------------

/** The badge a row shows. `pastDue` is a live audit whose scheduledFor has passed. */
export type AuditScheduleStatus = 'scheduled' | 'inProgress' | 'completed' | 'pastDue' | 'cancelled';

/** The statuses the schedule list asks the server for (no cancelled rows). */
export const SCHEDULE_LIST_STATUSES: readonly AuditStatus[] = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'];

/** What every row callback receives: the real audit id plus the row as drawn. */
export interface AuditScheduleRow {
  /** The API id of the audit (never a display code). */
  id: string;
  audit: AuditSummaryDto;
  status: AuditScheduleStatus;
  /** Human audit code: the API has none, so always the no-value dash. */
  code: string;
  farmerName: string;
  farmLocation: string;
  zone: string;
  typeLabel: string;
  dateStr: string;
  auditor: string;
  /** COMPLETED rows are view only. */
  isViewOnly: boolean;
  /** PATCH /admin/audits/{id} accepts SCHEDULED audits only. */
  isEditable: boolean;
  /** Cancel accepts SCHEDULED or IN_PROGRESS. */
  isCancellable: boolean;
}

export function scheduleStatus(audit: Pick<AuditSummaryDto, 'status' | 'scheduledFor'>, now: Date): AuditScheduleStatus {
  switch (audit.status) {
    case 'COMPLETED':
      return 'completed';
    case 'CANCELLED':
      return 'cancelled';
    case 'SCHEDULED':
    case 'IN_PROGRESS': {
      const at = Date.parse(audit.scheduledFor);
      if (!Number.isNaN(at) && at < now.getTime()) return 'pastDue';
      return audit.status === 'SCHEDULED' ? 'scheduled' : 'inProgress';
    }
  }
}

export const STATUS_LABEL_KEY: Record<AuditScheduleStatus, AuditsScheduleKey> = {
  scheduled: 'admin.audits.schedule.status.scheduled',
  inProgress: 'admin.audits.schedule.status.inProgress',
  completed: 'admin.audits.schedule.status.completed',
  pastDue: 'admin.audits.schedule.status.pastDue',
  cancelled: 'admin.audits.schedule.status.cancelled',
};

/** The design's badge colours: completed success, past due danger, scheduled info, otherwise warning. */
export type BadgeTone = 'success' | 'danger' | 'info' | 'warning';

export function statusTone(status: AuditScheduleStatus): BadgeTone {
  if (status === 'completed') return 'success';
  if (status === 'pastDue' || status === 'cancelled') return 'danger';
  if (status === 'scheduled') return 'info';
  return 'warning';
}

export function auditTypeLabel(type: AuditType): string {
  return ts(type === 'INTERNAL' ? 'admin.audits.schedule.type.INTERNAL' : 'admin.audits.schedule.type.EXTERNAL');
}

function orDash(value: string | null | undefined): string {
  return value === null || value === undefined || value.trim() === '' ? ADMIN_NO_VALUE : value;
}

/** "8 Oct 2026, 09:30 AM" in IST, or the dash. */
export function scheduleDateLabel(iso: string): string {
  const day = formatAdminDay(iso);
  if (day === '') return ADMIN_NO_VALUE;
  return ts('admin.audits.schedule.dateTime', { day, time: formatAdminTime(iso) });
}

export function auditorLabel(audit: Pick<AuditSummaryDto, 'auditType' | 'auditorName' | 'externalAgencyName'>): string {
  if (audit.auditType === 'EXTERNAL') {
    return ts('admin.audits.schedule.auditor.external', { name: orDash(audit.externalAgencyName) });
  }
  return ts('admin.audits.schedule.auditor.internal', { name: orDash(audit.auditorName) });
}

export function toScheduleRow(audit: AuditSummaryDto, now: Date): AuditScheduleRow {
  const status = scheduleStatus(audit, now);
  return {
    id: audit.id,
    audit,
    status,
    code: ADMIN_NO_VALUE,
    farmerName: orDash(audit.farmerName),
    farmLocation: orDash(audit.farmName),
    zone: orDash(audit.zoneName),
    typeLabel: auditTypeLabel(audit.auditType),
    dateStr: scheduleDateLabel(audit.scheduledFor),
    auditor: auditorLabel(audit),
    isViewOnly: audit.status === 'COMPLETED',
    isEditable: audit.status === 'SCHEDULED',
    isCancellable: audit.status === 'SCHEDULED' || audit.status === 'IN_PROGRESS',
  };
}

/** The search box: farmer name, TOHFA farmer id, farm, zone, auditor or agency (the design searched code/farmer/farm/auditor). */
export function matchesSearch(audit: AuditSummaryDto, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === '') return true;
  return [audit.farmerName, audit.tohfaFarmerId, audit.farmName, audit.zoneName, audit.auditorName, audit.externalAgencyName].some(
    (v) => v !== null && v.toLowerCase().includes(q),
  );
}

/** Parse a score bound typed in the filter; '' or not a number is no bound. */
export function parseScoreBound(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

/**
 * Score range filter. GET /admin/audits has no score query, so this runs on
 * the loaded rows only. With a bound set, an audit without a score (not yet
 * completed) does not match.
 */
export function withinScore(audit: Pick<AuditSummaryDto, 'totalScore'>, min: number | null, max: number | null): boolean {
  if (min === null && max === null) return true;
  if (audit.totalScore === null) return false;
  if (min !== null && audit.totalScore < min) return false;
  if (max !== null && audit.totalScore > max) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

/** The filter the design's modal holds. `null` = All. */
export interface ScheduleFilterValues {
  farmerId: string | null;
  zoneId: string | null;
  /** 'FIELD_VISIT' is drawn by the design but has no AuditType, so it is never selectable. */
  type: AuditType | null;
  dateFrom: string;
  dateTo: string;
  minScore: string;
  maxScore: string;
}

export const EMPTY_SCHEDULE_FILTERS: ScheduleFilterValues = {
  farmerId: null,
  zoneId: null,
  type: null,
  dateFrom: '',
  dateTo: '',
  minScore: '',
  maxScore: '',
};

export function isAnyFilterActive(f: ScheduleFilterValues): boolean {
  return (
    f.farmerId !== null ||
    f.zoneId !== null ||
    f.type !== null ||
    f.dateFrom !== '' ||
    f.dateTo !== '' ||
    f.minScore !== '' ||
    f.maxScore !== ''
  );
}

/**
 * "dd-mm-yyyy" or "dd/mm/yyyy" to "YYYY-MM-DD", or null when it is not a real
 * calendar date.
 */
export function parseDayInput(text: string): string | null {
  const m = /^\s*(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\s*$/.exec(text);
  if (m === null) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** The server filters for the applied modal values. Unparseable dates are not sent. */
export function toListFilters(f: ScheduleFilterValues): AuditListFilters {
  const from = parseDayInput(f.dateFrom);
  const to = parseDayInput(f.dateTo);
  return {
    status: SCHEDULE_LIST_STATUSES,
    farmerId: f.farmerId ?? undefined,
    zoneId: f.zoneId ?? undefined,
    type: f.type ?? undefined,
    scheduledFrom: from === null ? undefined : `${from}T00:00:00${IST_OFFSET}`,
    scheduledTo: to === null ? undefined : `${to}T23:59:59${IST_OFFSET}`,
  };
}

export interface FilterOption {
  id: string;
  label: string;
}

/**
 * Farmer and zone options seen in the loaded rows, merged into what was seen
 * before so a chosen option does not vanish once the list is filtered by it.
 * There is no zone list endpoint in the mobile client, and the farmer
 * directory needs another permission, so the rows are the source.
 */
export function mergeOptions(
  previous: { farmers: FilterOption[]; zones: FilterOption[] },
  audits: readonly AuditSummaryDto[],
): { farmers: FilterOption[]; zones: FilterOption[] } {
  const farmers = new Map(previous.farmers.map((o) => [o.id, o]));
  const zones = new Map(previous.zones.map((o) => [o.id, o]));
  for (const a of audits) {
    if (!farmers.has(a.farmerId)) {
      farmers.set(a.farmerId, {
        id: a.farmerId,
        label: ts('admin.audits.schedule.filters.farmerOption', { code: a.tohfaFarmerId, name: a.farmerName }),
      });
    }
    if (a.zoneId !== null && !zones.has(a.zoneId)) zones.set(a.zoneId, { id: a.zoneId, label: orDash(a.zoneName) });
  }
  // Same object when nothing new was seen, so a caller holding it in state does not re-render.
  if (farmers.size === previous.farmers.length && zones.size === previous.zones.length) return previous;
  const byLabel = (x: FilterOption, y: FilterOption) => x.label.localeCompare(y.label);
  return { farmers: [...farmers.values()].sort(byLabel), zones: [...zones.values()].sort(byLabel) };
}

export const CANCEL_REASON_MIN = 3;
export const CANCEL_REASON_MAX = 500;

/** The cancel body's reason rule from docs/openapi.yaml (3-500 characters). */
export function isValidCancelReason(reason: string): boolean {
  const n = reason.trim().length;
  return n >= CANCEL_REASON_MIN && n <= CANCEL_REASON_MAX;
}

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

/** "10:00 AM", "10:00 pm", "14:30" (or the localised AM/PM words) to 24-hour parts. */
export function parseTimeInput(text: string): { hour: number; minute: number } | null {
  const m = /^\s*(\d{1,2})[:.](\d{2})\s*(\S+)?\s*$/.exec(text);
  if (m === null) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2]);
  if (minute > 59) return null;
  const suffix = m[3]?.toLowerCase();
  if (suffix === undefined) {
    if (hour > 23) return null;
    return { hour, minute };
  }
  const am = new Set(['am', t('datetime.am').toLowerCase()]);
  const pm = new Set(['pm', t('datetime.pm').toLowerCase()]);
  if (hour < 1 || hour > 12) return null;
  if (am.has(suffix)) hour = hour === 12 ? 0 : hour;
  else if (pm.has(suffix)) hour = hour === 12 ? 12 : hour + 12;
  else return null;
  return { hour, minute };
}

/** IST "YYYY-MM-DD" + "10:00 AM" to an ISO date-time with the +05:30 offset, or null. */
export function toScheduledFor(dateText: string, timeText: string): string | null {
  const day = parseDayInput(dateText);
  const time = parseTimeInput(timeText);
  if (day === null || time === null) return null;
  return `${day}T${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}:00${IST_OFFSET}`;
}

/** An instant as the form's "DD/MM/YYYY" in IST ('' when not a date). */
export function istDateInput(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return '';
  const d = new Date(ms + IST_OFFSET_MS);
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
}

/** An instant as the form's "hh:mm AM" in IST ('' when not a date). */
export function istTimeInput(iso: string): string {
  return formatAdminTime(iso);
}

/** Everything the form holds; also what "Save Draft" hands to the host. */
export interface ScheduleAuditDraft {
  farmerId: string | null;
  farmerLabel: string;
  farmId: string | null;
  farmLabel: string;
  auditType: AuditType;
  auditorUserId: string | null;
  /** EXTERNAL only. */
  externalAgencyName: string;
  date: string;
  startTime: string;
  /** No API field: kept on the draft only, never sent. */
  duration: string;
}

export const AGENCY_NAME_MIN = 2;
export const AGENCY_NAME_MAX = 200;

export type BodyResult<B> = { ok: true; body: B } | { ok: false; errorKey: AuditsScheduleKey };

/**
 * POST /admin/audits body. fiscalYear/quarter are never sent (server-derived,
 * BR-03). EXTERNAL requires externalAgencyName and never sends an auditor;
 * INTERNAL never sends an agency name.
 */
export function buildCreateBody(draft: ScheduleAuditDraft): BodyResult<AuditCreateBody> {
  if (draft.farmerId === null) return { ok: false, errorKey: 'admin.audits.form.error.farmerRequired' };
  if (parseDayInput(draft.date) === null) return { ok: false, errorKey: 'admin.audits.form.error.dateInvalid' };
  const scheduledFor = toScheduledFor(draft.date, draft.startTime);
  if (scheduledFor === null) return { ok: false, errorKey: 'admin.audits.form.error.timeInvalid' };
  const body: AuditCreateBody = { farmerId: draft.farmerId, auditType: draft.auditType, scheduledFor };
  if (draft.farmId !== null) body.farmId = draft.farmId;
  if (draft.auditType === 'EXTERNAL') {
    const agency = draft.externalAgencyName.trim();
    if (agency.length < AGENCY_NAME_MIN || agency.length > AGENCY_NAME_MAX) {
      return { ok: false, errorKey: 'admin.audits.form.error.agencyInvalid' };
    }
    body.externalAgencyName = agency;
  } else if (draft.auditorUserId !== null) {
    body.auditorUserId = draft.auditorUserId;
  }
  return { ok: true, body };
}

/**
 * PATCH /admin/audits/{id} body with only the fields that changed. auditType
 * and farmer cannot change. `reason` is optional in the spec and the design
 * has no field for it, so none is sent. Nothing changed is an error, because
 * the server rejects a body with no field besides `reason`.
 */
export function buildUpdateBody(original: AuditDetailDto, draft: ScheduleAuditDraft): BodyResult<AuditUpdateBody> {
  if (original.status !== 'SCHEDULED') return { ok: false, errorKey: 'admin.audits.form.error.notEditable' };
  if (parseDayInput(draft.date) === null) return { ok: false, errorKey: 'admin.audits.form.error.dateInvalid' };
  const scheduledFor = toScheduledFor(draft.date, draft.startTime);
  if (scheduledFor === null) return { ok: false, errorKey: 'admin.audits.form.error.timeInvalid' };
  const body: AuditUpdateBody = {};
  if (Date.parse(scheduledFor) !== Date.parse(original.scheduledFor)) body.scheduledFor = scheduledFor;
  if (draft.farmId !== original.farmId) body.farmId = draft.farmId;
  if (original.auditType === 'INTERNAL') {
    if (draft.auditorUserId !== original.auditorUserId) body.auditorUserId = draft.auditorUserId;
  } else {
    const agency = draft.externalAgencyName.trim();
    if (agency !== (original.externalAgencyName ?? '')) {
      if (agency.length < AGENCY_NAME_MIN || agency.length > AGENCY_NAME_MAX) {
        return { ok: false, errorKey: 'admin.audits.form.error.agencyInvalid' };
      }
      body.externalAgencyName = agency;
    }
  }
  if (Object.keys(body).length === 0) return { ok: false, errorKey: 'admin.audits.form.error.noChanges' };
  return { ok: true, body };
}

/** The form prefilled from an audit being edited. */
export function draftFromAudit(audit: AuditDetailDto): ScheduleAuditDraft {
  return {
    farmerId: audit.farmerId,
    farmerLabel: ts('admin.audits.form.farmerOption', { name: audit.farmerName, code: audit.tohfaFarmerId }),
    farmId: audit.farmId,
    farmLabel: audit.farmName === null ? ADMIN_NO_VALUE : farmLabel(audit.farmName, null, audit.zoneName),
    auditType: audit.auditType,
    auditorUserId: audit.auditorUserId,
    externalAgencyName: audit.externalAgencyName ?? '',
    date: istDateInput(audit.scheduledFor),
    startTime: istTimeInput(audit.scheduledFor),
    duration: '',
  };
}

/** A new, empty form: an INTERNAL audit (the design assigns an internal lead auditor). */
export function emptyDraft(): ScheduleAuditDraft {
  return {
    farmerId: null,
    farmerLabel: ADMIN_NO_VALUE,
    farmId: null,
    farmLabel: ADMIN_NO_VALUE,
    auditType: 'INTERNAL',
    auditorUserId: null,
    externalAgencyName: '',
    date: '',
    startTime: '',
    duration: '',
  };
}

/** The design's "Lakshmi Farm house · Coonoor, Zone A". */
export function farmLabel(name: string, place: string | null, zone: string | null): string {
  return ts('admin.audits.form.farmOption', { name, place: orDash(place), zone: orDash(zone) });
}

/** What the "Lead auditor" picker shows for a draft. */
export function auditorFieldValue(audit: AuditDetailDto | undefined, draft: ScheduleAuditDraft): string {
  if (draft.auditType === 'EXTERNAL') return orDash(draft.externalAgencyName);
  if (audit !== undefined && draft.auditorUserId !== null && draft.auditorUserId === audit.auditorUserId) {
    return orDash(audit.auditorName);
  }
  return ADMIN_NO_VALUE;
}
