/**
 * Farmer Detail: every decision the 9-tab screen makes, as pure functions so
 * plain-Node vitest covers them (../../../tests/farmerDetail_model.test.ts).
 * The components in this folder only draw what these return.
 *
 * Access is code-only and FAILS CLOSED: no `can` means no permission, and
 * without `farmer.profile.view_all` nothing else is granted and no query is
 * given an id, so nothing is fetched. Scope (BR-108a) is server-side: a farmer
 * outside the caller's scope is a 404, shown as "not found"; nothing here
 * filters by zone or role.
 *
 * Values come from the Phase 1 view-models (api/farmerTypes.ts). A field the
 * API does not send renders as the i18n dash, never as design fixture text.
 * Location GPS/centroid is never copied into a card (only "has boundary").
 *
 * DESIGN-ONLY actions (Disable, Deactivate, plot/soil Verify, Flag a
 * discrepancy, Request a correction, Edit Rating Save) have no endpoint yet.
 * designActionReducer models their modals: confirming only raises the
 * not-available notice; it holds no farmer data, so it cannot change any
 * displayed state.
 */
import { ApiError } from '../../../../../shell/api/client';
import type { AdminFarmerKycStatus, FarmerDocumentType } from '../../../api/farmers';
import type {
  FarmerAddressView,
  FarmerCertificationView,
  FarmerDetailView,
  FarmerDocumentView,
  FarmerRatingView,
  FarmerSubscriptionView,
  FarmerUiStatus,
  PayoutDestinationView,
} from '../../../api/farmerTypes';
import { hasKey, t, type TranslationKey } from '../../../i18n';
import type { Can } from '../../../permissions/can';
import type { AdminTone } from '../../../theme';
import { formatAdminDay } from '../../../utils/datetime';

// ---------------------------------------------------------------------------
// Access
// ---------------------------------------------------------------------------

/** The docs/rbac.json codes this screen checks. */
export const FARMER_DETAIL_CODES = {
  view: 'farmer.profile.view_all',
  edit: 'farmer.profile.edit',
  editLockedField: 'farmer.profile.edit_locked_field',
  disable: 'farmer.account.disable',
  deactivate: 'farmer.account.deactivate',
  documentView: 'farmer.document.view',
  documentVerify: 'farmer.document.verify',
  bankAccountView: 'farmer.bank_account.view',
  ratingView: 'farmer.rating.view',
  ratingEdit: 'farmer.rating.edit',
  subscriptionView: 'farmer.subscription.view_tier_limits',
} as const;

/**
 * Codes NOT in docs/rbac.json yet. Nobody holds them, so their controls stay
 * hidden until the owner defines them: `farmer.rating.edit` (Phase 3 adds it,
 * SUPER/TOHFA) and `farmer.account.deactivate` (owner to define Deactivate).
 */
export const PENDING_RBAC_CODES = [FARMER_DETAIL_CODES.ratingEdit, FARMER_DETAIL_CODES.deactivate] as const;

export interface FarmerDetailAccess {
  canView: boolean;
  canEdit: boolean;
  canEditLockedFields: boolean;
  canDisable: boolean;
  canDeactivate: boolean;
  canViewDocuments: boolean;
  canVerifyDocuments: boolean;
  canViewBankAccounts: boolean;
  canViewRating: boolean;
  canEditRating: boolean;
  canViewSubscription: boolean;
  /** Plot/soil Verify, Flag, Request correction: DESIGN-ONLY, shown to whoever may view the page. */
  canUseRecordDesignActions: boolean;
}

export function farmerDetailAccess(can: Can | undefined): FarmerDetailAccess {
  const has = (code: string): boolean => can !== undefined && can(code) === true;
  const canView = has(FARMER_DETAIL_CODES.view);
  const viewAnd = (code: string): boolean => canView && has(code);
  const canEdit = viewAnd(FARMER_DETAIL_CODES.edit);
  const canViewDocuments = viewAnd(FARMER_DETAIL_CODES.documentView);
  return {
    canView,
    canEdit,
    canEditLockedFields: canEdit && has(FARMER_DETAIL_CODES.editLockedField),
    canDisable: viewAnd(FARMER_DETAIL_CODES.disable),
    canDeactivate: viewAnd(FARMER_DETAIL_CODES.deactivate),
    canViewDocuments,
    canVerifyDocuments: canViewDocuments && has(FARMER_DETAIL_CODES.documentVerify),
    canViewBankAccounts: viewAnd(FARMER_DETAIL_CODES.bankAccountView),
    canViewRating: viewAnd(FARMER_DETAIL_CODES.ratingView),
    canEditRating: viewAnd(FARMER_DETAIL_CODES.ratingEdit),
    canViewSubscription: viewAnd(FARMER_DETAIL_CODES.subscriptionView),
    canUseRecordDesignActions: canView,
  };
}

export interface FarmerDetailFetchIds {
  farmer: string | undefined;
  documents: string | undefined;
  bankAccounts: string | undefined;
  subscription: string | undefined;
  rating: string | undefined;
}

/** The id each hook gets; undefined disables that query, so nothing is fetched without the code. */
export function farmerDetailFetchIds(access: FarmerDetailAccess, farmerId: string | undefined): FarmerDetailFetchIds {
  const when = (granted: boolean): string | undefined => (granted ? farmerId : undefined);
  return {
    farmer: when(access.canView),
    documents: when(access.canViewDocuments),
    bankAccounts: when(access.canViewBankAccounts),
    subscription: when(access.canViewSubscription),
    rating: when(access.canViewRating),
  };
}

// ---------------------------------------------------------------------------
// View state and tabs
// ---------------------------------------------------------------------------

export type FarmerDetailViewState = 'denied' | 'loading' | 'notFound' | 'error' | 'ready';

/** A 404: the farmer is missing or outside the caller's scope (BR-108a). */
export function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.is('NOT_FOUND');
}

export function farmerDetailViewState(input: {
  canView: boolean;
  hasFarmerId: boolean;
  isLoading: boolean;
  error: unknown;
  hasFarmer: boolean;
}): FarmerDetailViewState {
  if (!input.canView) return 'denied';
  if (!input.hasFarmerId) return 'notFound';
  // A profile already on screen wins over a failed refresh.
  if (input.hasFarmer) return 'ready';
  if (input.isLoading) return 'loading';
  if (isNotFoundError(input.error)) return 'notFound';
  if (input.error !== null && input.error !== undefined) return 'error';
  return 'loading';
}

/** The design's 9 tabs, in order. */
export const FARMER_DETAIL_TABS = [
  'Personal',
  'Farm & land',
  'Soil',
  'Product listing',
  'KYC',
  'Ratings',
  'Subscription',
  'Audit',
  'History',
] as const;

export type FarmerDetailTab = (typeof FARMER_DETAIL_TABS)[number];

/** Every tab name a caller may pass: the 9 design tabs plus Dev's 'Overview' and 'Farm' (App.tsx keeps them). */
export type FarmerDetailTabType = FarmerDetailTab | 'Overview' | 'Farm';

export function normalizeDetailTab(tab: FarmerDetailTabType | undefined): FarmerDetailTab {
  if (tab === undefined || tab === 'Overview') return 'Personal';
  if (tab === 'Farm') return 'Farm & land';
  return tab;
}

export function detailTabLabel(tab: FarmerDetailTab): string {
  return t(`farmerDetail.tab.${tab}`);
}

// ---------------------------------------------------------------------------
// Shared value helpers
// ---------------------------------------------------------------------------

export function noValue(): string {
  return t('farmerDetail.noValue');
}

function orDash(value: string | null | undefined): string {
  if (value === null || value === undefined) return noValue();
  const trimmed = value.trim();
  return trimmed === '' ? noValue() : trimmed;
}

function dayOrDash(iso: string | null | undefined): string {
  if (iso === null || iso === undefined) return noValue();
  return orDash(formatAdminDay(iso));
}

function numberOrDash(value: number | null | undefined): string {
  return value === null || value === undefined ? noValue() : String(value);
}

export interface Badge {
  label: string;
  tone: AdminTone;
}

export interface DetailRow {
  label: string;
  value: string;
  /** Dev's "Locked" pill (mobile, Aadhaar: BR-33). */
  locked?: boolean;
  tone?: AdminTone;
}

// ---------------------------------------------------------------------------
// Header + Personal tab
// ---------------------------------------------------------------------------

const ACCOUNT_BADGES: Readonly<Record<FarmerUiStatus, Badge>> = {
  active: { label: 'farmerDetail.status.active', tone: 'success' },
  pending: { label: 'farmerDetail.status.pending', tone: 'warning' },
  disabled: { label: 'farmerDetail.status.disabled', tone: 'danger' },
  unknown: { label: 'farmerDetail.status.unknown', tone: 'brandSoft' },
};

/** A DISABLED farmer reads "Disabled", never "Pending". */
export function accountBadge(status: FarmerUiStatus): Badge {
  const b = ACCOUNT_BADGES[status];
  return { label: t(b.label as TranslationKey), tone: b.tone };
}

export function kycBadge(status: AdminFarmerKycStatus): Badge {
  if (status === 'VERIFIED') return { label: t('farmerDetail.badge.kycVerified'), tone: 'success' };
  if (status === 'REJECTED') return { label: t('farmerDetail.badge.kycRejected'), tone: 'danger' };
  return { label: t('farmerDetail.badge.kycPending'), tone: 'warning' };
}

/** From the server's certification summary (BR-108c); null when the farmer has none. */
export function certificationBadge(c: FarmerCertificationView): Badge | null {
  if (c.total === 0) return null;
  if (c.expired > 0 || c.verifiedExpired > 0) return { label: t('farmerDetail.badge.certExpired'), tone: 'danger' };
  if (c.verifiedCurrent > 0) return { label: t('farmerDetail.badge.certified'), tone: 'success' };
  return { label: t('farmerDetail.badge.certUnverified'), tone: 'warning' };
}

/** Dev's rating capsule: the API's 0-100 score and the server's tier label (not converted to stars). */
export function ratingTierCapsule(f: Pick<FarmerDetailView, 'overallRating' | 'ratingTierLabel'>): string {
  const score = numberOrDash(f.overallRating);
  return f.ratingTierLabel === null
    ? t('farmerDetail.rating.capsule', { score })
    : t('farmerDetail.rating.capsuleTier', { score, tier: f.ratingTierLabel });
}

export function sinceLabel(f: Pick<FarmerDetailView, 'registeredAt'>): string {
  return t('farmerDetail.badge.since', { date: dayOrDash(f.registeredAt) });
}

/** BR-33b: only ever "XXXX XXXX 1234"; anything that is not exactly four digits is a dash. */
export function maskAadhaar(last4: string | null): string {
  return last4 !== null && /^[0-9]{4}$/.test(last4) ? t('farmerDetail.personal.aadhaarMasked', { last4 }) : noValue();
}

export function addressLabel(a: FarmerAddressView): string {
  const parts = [a.line1, a.line2, a.village, a.taluk, a.district, a.pincode]
    .map((p) => (p === null ? '' : p.trim()))
    .filter((p) => p !== '');
  return parts.length === 0 ? noValue() : parts.join(', ');
}

/** The Personal tab table: the design's rows plus Dev's masked Aadhaar row; mobile and Aadhaar locked. */
export function personalRows(f: FarmerDetailView): DetailRow[] {
  return [
    { label: t('farmerDetail.personal.name'), value: orDash(f.name) },
    { label: t('farmerDetail.personal.farmerId'), value: orDash(f.farmerCode) },
    { label: t('farmerDetail.personal.phone'), value: orDash(f.mobile), locked: true },
    { label: t('farmerDetail.personal.aadhaar'), value: maskAadhaar(f.aadhaarLast4), locked: true },
    { label: t('farmerDetail.personal.address'), value: addressLabel(f.address) },
    { label: t('farmerDetail.personal.zone'), value: orDash(f.zoneName) },
    // No API source (farmerTypes: farmingType / farmProfile are null).
    { label: t('farmerDetail.personal.farmingType'), value: noValue() },
    { label: t('farmerDetail.personal.farmProfile'), value: noValue() },
    { label: t('farmerDetail.personal.registered'), value: dayOrDash(f.registeredAt) },
  ];
}

export interface LifecycleEvent {
  time: string;
  label: string;
}

/** The lifecycle API does not exist; the one real event the profile carries is the approval. */
export function lifecycleEvents(f: Pick<FarmerDetailView, 'approvedAt'>): LifecycleEvent[] {
  return f.approvedAt === null ? [] : [{ time: dayOrDash(f.approvedAt), label: t('farmerDetail.lifecycle.approved') }];
}

// ---------------------------------------------------------------------------
// Farm & land / Soil
// ---------------------------------------------------------------------------

export interface PlotLine {
  id: string;
  name: string;
  meta: string;
}

export interface LandLocationCard {
  id: string;
  title: string;
  location: string;
  meta: string;
  /** No API: always the dash. */
  submitted: string;
  hasBoundary: boolean;
  isPrimary: boolean;
  plots: PlotLine[];
}

function acres(value: number | null): string | null {
  return value === null ? null : t('farmerDetail.farm.acres', { value });
}

function joinDot(parts: readonly (string | null)[]): string {
  const kept = parts.filter((p): p is string => p !== null && p.trim() !== '');
  return kept.length === 0 ? noValue() : kept.join(' · ');
}

/** One card per land location (allow-list: never the centroid or any GPS). */
export function landLocationCards(f: Pick<FarmerDetailView, 'landLocations'>): LandLocationCard[] {
  return f.landLocations.map((loc) => ({
    id: loc.id,
    title: orDash(loc.name),
    location: joinDot([loc.village, loc.taluk, loc.district]),
    meta: joinDot([acres(loc.areaAcres), loc.surveyNumber === null ? null : t('farmerDetail.farm.survey', { value: loc.surveyNumber })]),
    submitted: noValue(),
    hasBoundary: loc.hasBoundary,
    isPrimary: loc.isPrimary,
    plots: loc.plots.map((p) => ({
      id: p.id,
      name: orDash(p.name),
      meta: joinDot([acres(p.areaAcres), p.soilType, p.irrigationType, p.sunExposure]),
    })),
  }));
}

/** The soil types the plots carry (the soil records themselves are teammate-owned, no API here). */
export function soilTypesLabel(f: Pick<FarmerDetailView, 'landLocations'>): string {
  const types = new Set<string>();
  for (const loc of f.landLocations) {
    for (const p of loc.plots) if (p.soilType !== null && p.soilType.trim() !== '') types.add(p.soilType.trim());
  }
  return types.size === 0 ? noValue() : [...types].join(', ');
}

// ---------------------------------------------------------------------------
// KYC
// ---------------------------------------------------------------------------

export interface DocumentRow {
  id: string;
  label: string;
  status: string;
  tone: AdminTone;
  canVerify: boolean;
}

const DOC_TONE: Readonly<Record<FarmerDocumentView['verificationStatus'], AdminTone>> = {
  VERIFIED: 'success',
  UNVERIFIED: 'warning',
  REJECTED: 'danger',
};

function docTypeLabel(type: FarmerDocumentType): string {
  const key = `farmerDetail.kyc.docType.${type}`;
  return hasKey(key) ? t(key) : type;
}

/** Verify only for an unverified document and only with farmer.document.verify. */
export function documentRows(docs: readonly FarmerDocumentView[], access: FarmerDetailAccess): DocumentRow[] {
  return docs.map((d) => ({
    id: d.id,
    label: docTypeLabel(d.docType),
    status: t(`farmerDetail.kyc.status.${d.verificationStatus}`),
    tone: DOC_TONE[d.verificationStatus],
    canVerify: access.canVerifyDocuments && d.verificationStatus === 'UNVERIFIED',
  }));
}

export interface BankRow {
  id: string;
  value: string;
  status: string;
  tone: AdminTone;
}

/** BR-53a: the account number only as its last four digits; a UPI handle is not shown. */
export function bankRows(destinations: readonly PayoutDestinationView[]): BankRow[] {
  return destinations.map((d) => {
    const kind = d.kind === 'BANK' ? t('farmerDetail.kyc.bankKindBANK') : t('farmerDetail.kyc.bankKindUPI');
    const value =
      d.kind === 'BANK' && d.accountNumberLast4 !== null
        ? t('farmerDetail.kyc.bankAccount', { bank: d.bankName ?? kind, last4: d.accountNumberLast4 })
        : orDash(d.kind === 'BANK' ? d.bankName : kind);
    return {
      id: d.id,
      value,
      status: d.isVerified ? t('farmerDetail.kyc.bankVerified') : t('farmerDetail.kyc.bankUnverified'),
      tone: d.isVerified ? 'success' : 'warning',
    };
  });
}

// ---------------------------------------------------------------------------
// Ratings (read-only, BR-06)
// ---------------------------------------------------------------------------

export function ratingHero(r: FarmerRatingView): { score: string; date: string } {
  return {
    score: t('farmerDetail.rating.score', { score: numberOrDash(r.overallRating) }),
    date:
      r.ratedAt === null
        ? t('farmerDetail.rating.notRated')
        : t('farmerDetail.rating.lastRated', { date: dayOrDash(r.ratedAt) }),
  };
}

export function ratingCategoryLabel(code: string): string {
  const key = `farmerDetail.rating.category.${code}`;
  return hasKey(key) ? t(key) : code;
}

export function ratingCategoryRows(r: FarmerRatingView): { code: string; label: string; score: string }[] {
  return r.categories.map((c) => ({
    code: c.code,
    label: ratingCategoryLabel(c.code),
    score: t('farmerDetail.rating.categoryScore', { score: numberOrDash(c.score), max: c.maxScore }),
  }));
}

export function ratingFarmInfo(f: Pick<FarmerDetailView, 'registeredAt' | 'zoneName'>): DetailRow[] {
  const year = /^([0-9]{4})-/.exec(f.registeredAt)?.[1] ?? null;
  return [
    // No farm name / last audit in the API.
    { label: t('farmerDetail.rating.farm'), value: noValue() },
    { label: t('farmerDetail.rating.zone'), value: orDash(f.zoneName) },
    { label: t('farmerDetail.rating.farmerSince'), value: orDash(year) },
    { label: t('farmerDetail.rating.lastAudit'), value: noValue() },
  ];
}

/**
 * DESIGN-ONLY: no endpoint yet, owner decision pending. Rating edit was removed
 * server-side (BR-06e); the owner is reversing it, the backend comes later.
 */
export const EDIT_RATING_SAVE_AVAILABLE = false;

/** The Edit Rating view starts from the API's category scores, never from fixtures. */
export function editRatingDraft(r: FarmerRatingView): Record<string, number | null> {
  return Object.fromEntries(r.categories.map((c) => [c.code, c.score]));
}

// ---------------------------------------------------------------------------
// Subscription / Audit
// ---------------------------------------------------------------------------

export function subscriptionRows(s: FarmerSubscriptionView): DetailRow[] {
  return [
    { label: t('farmerDetail.subscription.plan'), value: s.tier === null ? noValue() : t(`farmerDetail.subscription.tier.${s.tier}`) },
    { label: t('farmerDetail.subscription.status'), value: s.status === null ? noValue() : t(`farmerDetail.subscription.state.${s.status}`) },
    { label: t('farmerDetail.subscription.validFrom'), value: dayOrDash(s.periodStart) },
    { label: t('farmerDetail.subscription.validUntil'), value: dayOrDash(s.periodEnd) },
    // No payment-history API.
    { label: t('farmerDetail.subscription.paymentHistory'), value: noValue() },
  ];
}

export function auditRows(f: Pick<FarmerDetailView, 'certification'>): DetailRow[] {
  const c = f.certification;
  const cert: DetailRow =
    c.total === 0
      ? { label: t('farmerDetail.audit.certification'), value: t('farmerDetail.audit.cert.none') }
      : c.expired > 0 || c.verifiedExpired > 0
        ? { label: t('farmerDetail.audit.certification'), value: t('farmerDetail.audit.cert.expired'), tone: 'danger' }
        : c.verifiedCurrent > 0
          ? { label: t('farmerDetail.audit.certification'), value: t('farmerDetail.audit.cert.valid'), tone: 'success' }
          : { label: t('farmerDetail.audit.certification'), value: t('farmerDetail.audit.cert.unverified') };
  return [
    cert,
    { label: t('farmerDetail.audit.expiry'), value: dayOrDash(c.nextQualifyingExpiry) },
    // No audit API in this module.
    { label: t('farmerDetail.audit.latestAudit'), value: noValue() },
    { label: t('farmerDetail.audit.nextAudit'), value: noValue() },
    { label: t('farmerDetail.audit.openActions'), value: noValue() },
  ];
}

// ---------------------------------------------------------------------------
// DESIGN-ONLY action modals
// ---------------------------------------------------------------------------

export type DesignActionKind = 'deactivate' | 'disable' | 'preview' | 'verify' | 'flag' | 'correction';

export interface DesignActionState {
  kind: DesignActionKind | null;
  /** What the modal names in its "Record" row (a land location name, or the farmer). */
  record: string;
  reason: string;
  note: string;
  reasonMissing: boolean;
  /** The not-available notice: the only thing a confirm ever does. */
  notice: boolean;
}

export const DESIGN_ACTION_IDLE: DesignActionState = {
  kind: null,
  record: '',
  reason: '',
  note: '',
  reasonMissing: false,
  notice: false,
};

export type DesignAction =
  | { type: 'open'; kind: DesignActionKind; record: string }
  | { type: 'reason'; value: string }
  | { type: 'note'; value: string }
  | { type: 'confirm' }
  | { type: 'close' };

const REASON_REQUIRED: ReadonlySet<DesignActionKind> = new Set(['deactivate', 'disable', 'flag', 'correction']);

export function designActionNeedsReason(kind: DesignActionKind | null): boolean {
  return kind !== null && REASON_REQUIRED.has(kind);
}

/** DESIGN-ONLY: no endpoint yet, owner decision pending. Confirm never succeeds and never changes data. */
export function designActionReducer(state: DesignActionState, action: DesignAction): DesignActionState {
  switch (action.type) {
    case 'open':
      return { ...DESIGN_ACTION_IDLE, kind: action.kind, record: action.record };
    case 'reason':
      return { ...state, reason: action.value, reasonMissing: false };
    case 'note':
      return { ...state, note: action.value };
    case 'confirm':
      if (designActionNeedsReason(state.kind) && state.reason.trim() === '') {
        return { ...state, reasonMissing: true, notice: false };
      }
      return { ...state, reasonMissing: false, notice: true };
    case 'close':
      return DESIGN_ACTION_IDLE;
  }
}
