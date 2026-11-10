/**
 * Pure decisions behind the farmer application screens (pending list, review,
 * reject). No React, so plain-Node vitest covers them
 * (tests/applications_logic.test.ts); the screens only pass values through.
 *
 * Access is code-only and fails closed (permissions/can.ts): no `can` means no
 * permission. Deciding needs BOTH farmer.application.approve and
 * farmer.application.reject, because /auth/me drops the grant scope and a
 * Farmer Admin holds approve only at `view` level: an Approve button gated on
 * approve alone would show to them and the server would answer 403. Owner
 * decision #7 (a scope-aware flag on /auth/me) is still open.
 *
 * Scoping of the queue (which zone an admin may review) is the server's job.
 * Nothing here filters by zone text or role.
 */
import { ApiError } from '../../../../../shell/api/client';
import type {
  ApplicationListFilterStatus,
  ApplicationRejectReasonCode,
  ApplicationStatus,
} from '../../../api/farmerApplications';
import { APPLICATION_REJECT_REASON_CODES, REJECT_REASON_MAX, REJECT_REASON_MIN } from '../../../api/farmerApplications';
import { adminErrorKey } from '../../../api/errors';
import type { ApplicationRowView } from '../../../api/farmerTypes';
import { t, type TranslationKey } from '../../../i18n';
import type { Can } from '../../../permissions/can';
import { formatAdminDay } from '../../../utils/datetime';

export const APPLICATION_CODES = {
  listPending: 'farmer.application.list_pending',
  view: 'farmer.application.view',
  approve: 'farmer.application.approve',
  reject: 'farmer.application.reject',
} as const;

export interface ApplicationAccess {
  canList: boolean;
  canView: boolean;
  /** Approve AND reject held (see the header). */
  canDecide: boolean;
}

export function applicationAccess(can: Can | undefined): ApplicationAccess {
  const has = (code: string) => (can === undefined ? false : can(code) === true);
  return {
    canList: has(APPLICATION_CODES.listPending),
    canView: has(APPLICATION_CODES.view),
    canDecide: has(APPLICATION_CODES.approve) && has(APPLICATION_CODES.reject),
  };
}

// ---------------------------------------------------------------------------
// Pending list
// ---------------------------------------------------------------------------

/**
 * The submitted, not-yet-decided statuses the server's list filter accepts
 * (farmer-applications.schema.ts listAdminApplicationsQuery). DRAFT is not
 * accepted as a filter and INFO_REQUESTED is waiting on the applicant, not on
 * a reviewer (the server never sets it today: request-info moves to DOCS_REVIEW).
 */
export const PENDING_REVIEW_STATUSES = ['SUBMITTED', 'DOCS_REVIEW', 'FARM_VERIFICATION', 'AUDIT'] as const satisfies readonly ApplicationListFilterStatus[];
export type PendingReviewStatus = (typeof PENDING_REVIEW_STATUSES)[number];
export type PendingFilter = 'ALL' | PendingReviewStatus;
export const PENDING_FILTERS: readonly PendingFilter[] = ['ALL', ...PENDING_REVIEW_STATUSES];

function isPendingStatus(status: ApplicationStatus): status is PendingReviewStatus {
  return (PENDING_REVIEW_STATUSES as readonly string[]).includes(status);
}

/**
 * With no status the server returns every status, drafts included, so "All"
 * is narrowed here to the pending statuses. A row still flagged as a draft is
 * never pending, whatever its status says.
 */
export function pendingRows<T extends Pick<ApplicationRowView, 'status' | 'isDraft'>>(rows: readonly T[]): T[] {
  return rows.filter((r) => !r.isDraft && isPendingStatus(r.status));
}

/** The `status` query value for a chip; undefined = all (narrowed by pendingRows). */
export function listStatusParam(filter: PendingFilter): PendingReviewStatus | undefined {
  return filter === 'ALL' ? undefined : filter;
}

/** Narrows the loaded rows by what the admin typed: name, mobile or village. Never by zone or role. */
export function searchApplications<T extends Pick<ApplicationRowView, 'name' | 'mobile' | 'village'>>(rows: readonly T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (q === '') return [...rows];
  return rows.filter(
    (r) => r.name.toLowerCase().includes(q) || r.mobile.toLowerCase().includes(q) || (r.village ?? '').toLowerCase().includes(q),
  );
}

export function filterLabel(filter: PendingFilter): string {
  return filter === 'ALL' ? t('farmerApps.list.filter.ALL') : statusLabel(filter);
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

export type ApplicationTone = 'success' | 'warning' | 'danger';

export function statusLabel(status: ApplicationStatus): string {
  return t(`farmerApps.status.${status}` satisfies TranslationKey);
}

export function statusTone(status: ApplicationStatus): ApplicationTone {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'danger';
  return 'warning';
}

export function notAvailable(): string {
  return t('farmerApps.notAvailable');
}

/** A value or the "not available" dash. */
export function orDash(value: string | null | undefined): string {
  return value === null || value === undefined || value.trim() === '' ? notAvailable() : value;
}

/** BR-33b: only the last 4 digits ever reach the screen; anything else is not shown. */
export function maskAadhaar(last4: string | null | undefined): string {
  return typeof last4 === 'string' && /^\d{4}$/.test(last4) ? `XXXX XXXX ${last4}` : notAvailable();
}

export function dayOrDash(iso: string | null | undefined): string {
  if (iso === null || iso === undefined) return notAvailable();
  return orDash(formatAdminDay(iso));
}

export function acresLabel(value: number | null | undefined): string {
  return value === null || value === undefined ? notAvailable() : t('farmerApps.acres', { value });
}

const DOC_TYPES = ['ID_PROOF', 'FARM_DOC', 'CERTIFICATE', 'OTHER'] as const;

export function documentTypeLabel(docType: string | null): string {
  const known = DOC_TYPES.find((d) => d === docType);
  return known === undefined ? t('farmerApps.doc.type.unknown') : t(`farmerApps.doc.type.${known}` satisfies TranslationKey);
}

export function rejectReasonLabel(code: ApplicationRejectReasonCode): string {
  return t(`farmerApps.reject.reason.${code}` satisfies TranslationKey);
}

export const REJECT_REASON_CODES: readonly ApplicationRejectReasonCode[] = APPLICATION_REJECT_REASON_CODES;

// ---------------------------------------------------------------------------
// Reject reason (spec: reasonCode + reason 5-500 characters)
// ---------------------------------------------------------------------------

export type RejectReasonProblem = 'tooShort' | 'tooLong';

export function validateRejectReason(text: string): RejectReasonProblem | null {
  const length = text.trim().length;
  if (length < REJECT_REASON_MIN) return 'tooShort';
  if (length > REJECT_REASON_MAX) return 'tooLong';
  return null;
}

export function rejectReasonMessage(problem: RejectReasonProblem): string {
  return problem === 'tooShort'
    ? t('farmerApps.reject.tooShort', { min: REJECT_REASON_MIN })
    : t('farmerApps.reject.tooLong', { max: REJECT_REASON_MAX });
}

export { REJECT_REASON_MAX, REJECT_REASON_MIN };

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/**
 * The server's refusals for an application decision, worded for the admin.
 * Two are specific enough to say more than their code: BR-69 (approval with no
 * farm location: 422 VALIDATION_FAILED, meta.missingSteps [3]) and BR-135 (the
 * applicant's account holds a staff admin role: 409 CONFLICT, meta.rule).
 * Everything else goes through adminErrorKey.
 */
export function applicationErrorKey(err: unknown): TranslationKey {
  if (err instanceof ApiError) {
    const meta = err.problem.meta;
    const missing = meta?.['missingSteps'];
    if (err.problem.code === 'VALIDATION_FAILED' && Array.isArray(missing) && missing.includes(3)) {
      return 'farmerApps.error.noLocations';
    }
    if (err.problem.code === 'CONFLICT' && meta?.['rule'] === 'BR-135') return 'farmerApps.error.adminApplicant';
  }
  return adminErrorKey(err);
}

export function isNotFound(err: unknown): boolean {
  return err instanceof ApiError && err.problem.code === 'NOT_FOUND';
}

// ---------------------------------------------------------------------------
// The host's selected item (roles/farmer/App.tsx keeps one between screens)
// ---------------------------------------------------------------------------

/**
 * What the host stores when a card is tapped. The shape predates the API (the
 * legacy Request-Info screen still reads it); every value here comes from the
 * row. The review and reject screens read only `id` and fetch the rest.
 */
export interface PendingApplicationItem {
  id: string;
  name: string;
  initials: string;
  location: string;
  appliedTime: string;
  badgeLabel: string;
  badgeType: 'green' | 'amber' | 'red';
  phone?: string;
  aadhaar?: string;
  farmSize?: string;
  fmbZones?: string;
  primaryCrops?: string;
  dayCountText?: string;
}

const BADGE_OF_TONE: Record<ApplicationTone, PendingApplicationItem['badgeType']> = {
  success: 'green',
  warning: 'amber',
  danger: 'red',
};

export function submittedLabel(submittedAt: string | null): string {
  if (submittedAt === null) return t('farmerApps.list.notSubmitted');
  const day = formatAdminDay(submittedAt);
  return day === '' ? t('farmerApps.list.notSubmitted') : t('farmerApps.list.submitted', { date: day });
}

export function rowLocation(row: Pick<ApplicationRowView, 'village' | 'district'>): string {
  return row.village ?? row.district ?? '';
}

export function toPendingApplicationItem(row: ApplicationRowView): PendingApplicationItem {
  const item: PendingApplicationItem = {
    id: row.id,
    name: row.name,
    initials: row.initials,
    location: rowLocation(row),
    appliedTime: submittedLabel(row.submittedAt),
    badgeLabel: statusLabel(row.status),
    badgeType: BADGE_OF_TONE[statusTone(row.status)],
    phone: row.mobile,
  };
  if (row.aadhaarLast4 !== null) item.aadhaar = maskAadhaar(row.aadhaarLast4);
  if (row.primaryCrops.length > 0) item.primaryCrops = row.primaryCrops.join(', ');
  return item;
}
