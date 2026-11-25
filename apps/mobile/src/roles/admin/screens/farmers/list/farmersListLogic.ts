/**
 * Every decision of the farmers list (Farmers | Applications), kept pure so
 * plain-Node vitest covers it (tests/farmersList_logic.test.ts). The
 * components in this folder only draw what these functions return.
 *
 * Access is fail-closed: no `can` means no permission. The whole screen needs
 * `farmer.profile.view_all`; the Applications tab additionally needs
 * `farmer.application.list_pending` (docs/rbac.json). Both are re-checked by
 * the server; this only decides what is worth rendering and fetching.
 *
 * Scope is the server's (BR-108a): the list returns exactly the farmers the
 * caller may see, so nothing here filters rows by zone, warehouse or any
 * other text. The zone chips are built from the zones present in the loaded
 * rows because there is no admin zones endpoint; they send a zone id, which
 * the server applies inside the caller's scope.
 */
import type { AdminFarmerAccountStatus, RatingTierCode } from '../../../api/farmers';
import type { ApplicationStatus } from '../../../api/farmerApplications';
import type { FarmerListFilters } from '../../../api/farmerHooks';
import type { ApplicationRowView, FarmerRowView, FarmerUiStatus } from '../../../api/farmerTypes';
import { t, type TranslationKey } from '../../../i18n';
import type { Can } from '../../../permissions/can';
import { formatAdminDay } from '../../../utils/datetime';
import type { FarmerListItem } from './legacyFarmerListItem';

/**
 * How long the list waits after the last keystroke before it sends `q`. A
 * typing debounce for the request, not a business threshold (same value as
 * the customers list).
 */
export const SEARCH_DEBOUNCE_MS = 300;

/** The server rejects a longer `q` (admin-farmers.schema.ts, FARMER_SEARCH_MAX). */
export { FARMER_SEARCH_MAX } from '../../../api/farmers';

// ─── Access ──────────────────────────────────────────────────────────────────

const VIEW_FARMERS = 'farmer.profile.view_all';
const LIST_APPLICATIONS = 'farmer.application.list_pending';

export type FarmersMainTab = 'farmers' | 'applications';

export interface FarmersListAccess {
  /** farmer.profile.view_all: the screen and its data at all. */
  canViewFarmers: boolean;
  /** farmer.application.list_pending, and only on top of canViewFarmers. */
  canViewApplications: boolean;
}

export function farmersListAccess(can: Can | undefined): FarmersListAccess {
  if (can === undefined) return { canViewFarmers: false, canViewApplications: false };
  const canViewFarmers = can(VIEW_FARMERS);
  return { canViewFarmers, canViewApplications: canViewFarmers && can(LIST_APPLICATIONS) };
}

/** The tab to draw. 'applications' only for a caller allowed to see it, whatever was asked for. */
export function resolveMainTab(requested: FarmersMainTab | undefined, access: FarmersListAccess): FarmersMainTab {
  return requested === 'applications' && access.canViewApplications ? 'applications' : 'farmers';
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export const ALL = 'ALL';

export type StatusFilterId = typeof ALL | AdminFarmerAccountStatus;
export type TierFilterId = typeof ALL | RatingTierCode;

export interface FilterOption<Id extends string> {
  id: Id;
  labelKey: TranslationKey;
}

/** All plus exactly the API account statuses (admin-farmers.schema.ts ACCOUNT_STATUSES). */
export const STATUS_FILTER_OPTIONS: readonly FilterOption<StatusFilterId>[] = [
  { id: ALL, labelKey: 'farmersList.filter.all' },
  { id: 'ACTIVE', labelKey: 'farmersList.filter.status.ACTIVE' },
  { id: 'PENDING', labelKey: 'farmersList.filter.status.PENDING' },
  { id: 'DISABLED', labelKey: 'farmersList.filter.status.DISABLED' },
];

/** All plus the API tier codes; the score bands stay on the server (BR-04a). */
export const TIER_FILTER_OPTIONS: readonly FilterOption<TierFilterId>[] = [
  { id: ALL, labelKey: 'farmersList.filter.all' },
  { id: 'POOR', labelKey: 'farmersList.filter.tier.POOR' },
  { id: 'MODERATE', labelKey: 'farmersList.filter.tier.MODERATE' },
  { id: 'GOOD', labelKey: 'farmersList.filter.tier.GOOD' },
  { id: 'EXCELLENT', labelKey: 'farmersList.filter.tier.EXCELLENT' },
];

export interface FarmersFilterState {
  /** The debounced search text. */
  q: string;
  status: StatusFilterId;
  /** A zone id, or ALL. */
  zoneId: string;
  tier: TierFilterId;
}

export const INITIAL_FILTERS: Omit<FarmersFilterState, 'q'> = { status: ALL, zoneId: ALL, tier: ALL };

/** The useFarmerList filters: ALL and a blank search become undefined (no filter). */
export function toFarmerListFilters(state: FarmersFilterState): FarmerListFilters {
  const q = state.q.trim();
  return {
    q: q === '' ? undefined : q,
    status: state.status === ALL ? undefined : state.status,
    zoneId: state.zoneId === ALL ? undefined : state.zoneId,
    ratingTier: state.tier === ALL ? undefined : state.tier,
  };
}

export interface ZoneOption {
  id: string;
  name: string;
}

/**
 * The zones seen so far plus those in `rows`, distinct by id, sorted by name.
 * Returns `previous` itself when nothing is new, so a state update is a no-op
 * and a zone stays selectable after a zone filter narrowed the list.
 */
export function mergeZoneOptions(previous: readonly ZoneOption[], rows: readonly FarmerRowView[]): readonly ZoneOption[] {
  const known = new Set(previous.map((z) => z.id));
  const added: ZoneOption[] = [];
  for (const row of rows) {
    if (row.zoneId === null || row.zoneName === null || known.has(row.zoneId)) continue;
    known.add(row.zoneId);
    added.push({ id: row.zoneId, name: row.zoneName });
  }
  if (added.length === 0) return previous;
  return [...previous, ...added].sort((a, b) => a.name.localeCompare(b.name));
}

/** A zone filter with a single zone filters nothing, so the group shows from two. */
export function showZoneFilter(options: readonly ZoneOption[]): boolean {
  return options.length >= 2;
}

// ─── Farmer card ─────────────────────────────────────────────────────────────

export type ListTone = 'success' | 'warning' | 'danger' | 'info' | 'muted';

const FARMER_STATUS_LABEL: Readonly<Record<FarmerUiStatus, TranslationKey>> = {
  active: 'farmersList.status.active',
  pending: 'farmersList.status.pending',
  disabled: 'farmersList.status.disabled',
  unknown: 'farmersList.status.unknown',
};

const FARMER_STATUS_TONE: Readonly<Record<FarmerUiStatus, ListTone>> = {
  active: 'success',
  pending: 'warning',
  disabled: 'danger',
  unknown: 'muted',
};

/** A disabled account reads Disabled. The team design showed it as Pending; that mislabel is not ported. */
export function farmerStatusLabelKey(status: FarmerUiStatus): TranslationKey {
  return FARMER_STATUS_LABEL[status];
}

export function farmerStatusTone(status: FarmerUiStatus): ListTone {
  return FARMER_STATUS_TONE[status];
}

export function noValueText(): string {
  return t('farmersList.noValue');
}

/** BR-06: the 0-100 overall score as the server sent it. The design's 0-5 star figure has no source. */
export function farmerRatingText(row: FarmerRowView): string {
  return row.overallRating === null ? noValueText() : t('farmersList.card.ratingValue', { score: row.overallRating });
}

export function farmerCodeZoneText(row: FarmerRowView): string {
  return t('farmersList.card.codeZone', { code: row.farmerCode, zone: row.zoneName ?? noValueText() });
}

/** The list API sends no farming type. */
export function farmerFarmingText(row: FarmerRowView): string {
  return row.farmingType ?? noValueText();
}

/**
 * The legacy FarmerListItem the existing hosts (App.tsx, the Super/TOHFA
 * dashboards) store for their detail routes. Carries the real id; every
 * field the list API does not send is left out rather than invented. The
 * legacy type only knows ACTIVE / DISABLED, so a PENDING account is passed as
 * ACTIVE here: hosts should use the row (second callback argument) instead.
 */
export function toLegacyFarmerListItem(row: FarmerRowView): FarmerListItem {
  return {
    id: row.id,
    name: row.name,
    code: row.farmerCode,
    initials: row.initials,
    location: row.zoneName ?? '',
    status: row.accountStatus === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
    rating: row.overallRating,
    ...(row.ratingTierLabel === null ? {} : { ratingTier: row.ratingTierLabel }),
    mobile: row.mobile,
  };
}

// ─── KPI cards ───────────────────────────────────────────────────────────────

export interface KpiCardSpec {
  id: 'all' | 'active' | 'pending' | 'inactive';
  titleKey: TranslationKey;
  tone: 'default' | 'success' | 'warning';
  icon: 'users' | 'clipboard' | 'alert';
}

/** The design's four cards, in order. */
export const FARMERS_KPI_CARDS: readonly KpiCardSpec[] = [
  { id: 'all', titleKey: 'farmersList.kpi.all', tone: 'default', icon: 'users' },
  { id: 'active', titleKey: 'farmersList.kpi.active', tone: 'success', icon: 'users' },
  { id: 'pending', titleKey: 'farmersList.kpi.pending', tone: 'warning', icon: 'clipboard' },
  { id: 'inactive', titleKey: 'farmersList.kpi.inactive', tone: 'default', icon: 'alert' },
];

/** No count endpoint exists (owner decision #11 open), so every card shows the placeholder. */
export function kpiValueText(): string {
  return noValueText();
}

// ─── Applications ────────────────────────────────────────────────────────────

const APPLICATION_STATUS_LABEL: Readonly<Record<ApplicationStatus, TranslationKey>> = {
  DRAFT: 'farmersList.applications.status.DRAFT',
  SUBMITTED: 'farmersList.applications.status.SUBMITTED',
  DOCS_REVIEW: 'farmersList.applications.status.DOCS_REVIEW',
  FARM_VERIFICATION: 'farmersList.applications.status.FARM_VERIFICATION',
  AUDIT: 'farmersList.applications.status.AUDIT',
  INFO_REQUESTED: 'farmersList.applications.status.INFO_REQUESTED',
  APPROVED: 'farmersList.applications.status.APPROVED',
  REJECTED: 'farmersList.applications.status.REJECTED',
};

const APPLICATION_STATUS_TONE: Readonly<Record<ApplicationStatus, ListTone>> = {
  DRAFT: 'muted',
  SUBMITTED: 'warning',
  DOCS_REVIEW: 'warning',
  FARM_VERIFICATION: 'warning',
  AUDIT: 'warning',
  INFO_REQUESTED: 'info',
  APPROVED: 'success',
  REJECTED: 'danger',
};

export function applicationStatusLabelKey(status: ApplicationStatus): TranslationKey {
  return APPLICATION_STATUS_LABEL[status];
}

export function applicationStatusTone(status: ApplicationStatus): ListTone {
  return APPLICATION_STATUS_TONE[status];
}

/** "code · location · crops". There is no application code; the location is the applicant's village/district. */
export function applicationSubText(row: ApplicationRowView): string {
  const place = [row.village, row.district].filter((p): p is string => p !== null && p !== '').join(', ');
  return t('farmersList.applications.subLine', {
    code: row.applicationCode ?? noValueText(),
    location: place === '' ? noValueText() : place,
    crops: row.primaryCrops.length === 0 ? noValueText() : row.primaryCrops.join(', '),
  });
}

/** "Submitted <day> · KYC <status>". An application has no KYC status in the API. */
export function applicationDetailText(row: ApplicationRowView): string {
  const day = formatAdminDay(row.submittedAt ?? row.createdAt);
  return t('farmersList.applications.submittedLine', {
    date: day === '' ? noValueText() : day,
    kyc: row.kycStatus ?? noValueText(),
  });
}

/**
 * The applications list API takes no search, so the box filters the rows
 * already loaded (name, mobile, crop). Paging still loads more.
 */
export function filterApplications(rows: readonly ApplicationRowView[], searchText: string): readonly ApplicationRowView[] {
  const q = searchText.trim().toLowerCase();
  if (q === '') return rows;
  return rows.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.mobile.toLowerCase().includes(q) ||
      r.primaryCrops.some((c) => c.toLowerCase().includes(q)),
  );
}
