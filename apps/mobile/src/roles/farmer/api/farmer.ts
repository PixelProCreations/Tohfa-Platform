import { api, ApiError } from '../../../shell/api/client';
import { signUpload } from './registration';
import { uploadWithResume } from './uploader';

export interface FarmerProfile {
  id: string;
  tohfaFarmerId: string;
  fullName: string;
  mobile: string;
  aadhaarLast4: string | null;
  dob?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  farmingExperienceYears?: number | null;
  address?: string | null;
  zoneId?: string | null;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  overallRating?: number | null;
  ratingTier?: 'POOR' | 'MODERATE' | 'GOOD' | 'EXCELLENT' | null;
  subscriptionTier: 'FREE' | 'PAID';
  subscriptionValidTo?: string | null;
  isMarketBlocked: boolean;
  marketBlockReason?: string | null;
  preferredLocale?: 'ta' | 'en';
}

export interface FarmerProfileUpdate {
  fullName?: string | undefined;
  dob?: string | undefined;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | undefined;
  farmingExperienceYears?: number | undefined;
  address?: string | undefined;
  preferredLocale?: 'ta' | 'en' | undefined;
}


export interface Certification {
  id: string;
  certType: 'PGS' | 'NPOP' | 'OTHER';
  /** The farmer's own name for the certification; non-null only when `certType` is OTHER. */
  customTypeName?: string | null;
  certNumber: string;
  issuingBody: string;
  issuedOn: string;
  expiresOn: string;
  documentUrl?: string | null;
  verificationStatus: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  daysToExpiry: number;
  blocksListings: boolean;
}

export interface CertificationCreate {
  certType: 'PGS' | 'NPOP' | 'OTHER';
  /** Required (trimmed, 1-80) when `certType` is OTHER; absent for PGS / NPOP. */
  customTypeName?: string | undefined;
  certNumber: string;
  issuingBody: string;
  issuedOn: string;
  expiresOn: string;
  documentUrl?: string | undefined;
}

/**
 * PATCH /farmers/me/certifications/{id} body: any subset of the editable
 * fields, at least one. Moving away from OTHER sends `customTypeName: null`.
 */
export interface CertificationUpdate {
  certType?: 'PGS' | 'NPOP' | 'OTHER' | undefined;
  customTypeName?: string | null | undefined;
  certNumber?: string | undefined;
  issuingBody?: string | undefined;
  issuedOn?: string | undefined;
  expiresOn?: string | undefined;
  documentUrl?: string | undefined;
}

export interface SystemConfig {
  certExpiryWarningDays: number;
  /**
   * BR-48: an already-expired certificate may be recorded only if it expired at
   * most this many days ago (system_config.cert_expiry_max_past_days). The Add
   * Certification form pre-checks with it; the server enforces it.
   */
  certExpiryMaxPastDays: number;
  /**
   * BR-48: expiresOn may be at most this many days after today
   * (system_config.cert_expiry_max_future_days, default 730 = 2 years).
   */
  certExpiryMaxFutureDays: number;
}

/**
 * Used only when GET /config/farmer cannot be read, or omits / garbles a value.
 * They match the seeded system_config rows and the server's own fallbacks. The
 * server enforces with its live values regardless, so a stale fallback can make
 * the app's pre-check differ from the server, never bypass it.
 */
export const FALLBACK_CERT_EXPIRY_WARNING_DAYS = 30;
export const FALLBACK_CERT_EXPIRY_MAX_PAST_DAYS = 365;
export const FALLBACK_CERT_EXPIRY_MAX_FUTURE_DAYS = 730;

export type FarmRatingCategoryCode =
  | 'CERTIFICATION'
  | 'SOIL_LAND'
  | 'FARMING_PRACTICES'
  | 'ENVIRONMENTAL'
  | 'PRODUCE_QUALITY'
  | 'TRACEABILITY'
  | 'SOCIAL_LABOR'
  | 'FINANCIAL'
  | 'MARKET_RELATIONS'
  | 'INNOVATION';

export type FarmRatingTier = 'POOR' | 'MODERATE' | 'GOOD' | 'EXCELLENT';

export interface FarmRatingModule {
  categoryCode: FarmRatingCategoryCode;
  score: number | null;
  maxScore: number;
}

export interface FarmRating {
  farmerId: string;
  periodLabel: string;
  status: 'DRAFT' | 'COMPLETE';
  modules: FarmRatingModule[];
  overallRating: number | null;
  ratingTier: FarmRatingTier | null;
  ratedAt: string | null;
}

/**
 * BR-06: the 10 farm-rating categories, in the fixed order the server always
 * returns them in (also the display order). `nameKey` is a farmer i18n key
 * but deliberately typed `string`, not `TranslationKey` -- this module has no
 * dependency on `i18n/farmer`, the same reason `evalMarketBlock`'s
 * `messageKey` above is untyped. Callers do `t(nameKey as TranslationKey)`.
 */
export const FARM_RATING_CATEGORIES: ReadonlyArray<{
  code: FarmRatingCategoryCode;
  nameKey: string;
}> = [
  { code: 'CERTIFICATION', nameKey: 'farmer.profile.rating.cat.certification' },
  { code: 'SOIL_LAND', nameKey: 'farmer.profile.rating.cat.soil' },
  { code: 'FARMING_PRACTICES', nameKey: 'farmer.profile.rating.cat.practices' },
  { code: 'ENVIRONMENTAL', nameKey: 'farmer.profile.rating.cat.environment' },
  { code: 'PRODUCE_QUALITY', nameKey: 'farmer.profile.rating.cat.yield' },
  { code: 'TRACEABILITY', nameKey: 'farmer.profile.rating.cat.traceability' },
  { code: 'SOCIAL_LABOR', nameKey: 'farmer.profile.rating.cat.social' },
  { code: 'FINANCIAL', nameKey: 'farmer.profile.rating.cat.financial' },
  { code: 'MARKET_RELATIONS', nameKey: 'farmer.profile.rating.cat.market' },
  { code: 'INNOVATION', nameKey: 'farmer.profile.rating.cat.innovation' },
];

/**
 * BR-06 tier bands (POOR &lt;50, MODERATE 50-69, GOOD 70-84, EXCELLENT 85+) are
 * computed server-side against `overallRating` -- this only maps the tier
 * code the server already returns to a label key, it does not re-derive it.
 */
export const FARM_RATING_TIER_LABEL_KEY: Record<FarmRatingTier, string> = {
  POOR: 'farmer.profile.rating.tier.poor',
  MODERATE: 'farmer.profile.rating.tier.moderate',
  GOOD: 'farmer.profile.rating.tier.good',
  EXCELLENT: 'farmer.profile.rating.tier.excellent',
};

export interface FarmRatingModuleView {
  categoryCode: FarmRatingCategoryCode;
  nameKey: string;
  score: number | null;
  maxScore: number;
  isRated: boolean;
}

export interface FarmRatingView {
  /** False when the farmer has never been rated (overallRating is null). A DRAFT
   * rating with some modules scored and others not is still `isRated: true` here --
   * each module's own `isRated` flag is what drives that row's empty state. */
  isRated: boolean;
  overallRating: number | null;
  ratingTier: FarmRatingTier | null;
  tierLabelKey: string | null;
  ratedAt: string | null;
  /** Always exactly the 10 canonical categories, in order, even if the server
   * response omitted one -- a missing module is treated the same as a null score. */
  modules: FarmRatingModuleView[];
}

/**
 * Pure mapping from the wire shape to what the three farmer-facing surfaces
 * (Profile summary card, Dashboard mini-card, FarmRatingsScreen detail) need
 * to render, including the "never rated" and "partially scored" empty states.
 * Kept here (not in a screen) so it has one, independently-testable
 * implementation instead of three copies.
 */
export function deriveFarmRatingView(rating: FarmRating | null | undefined): FarmRatingView {
  const modules: FarmRatingModuleView[] = FARM_RATING_CATEGORIES.map(({ code, nameKey }) => {
    const found = rating?.modules.find((m) => m.categoryCode === code);
    const score = found?.score ?? null;
    return {
      categoryCode: code,
      nameKey,
      score,
      maxScore: found?.maxScore ?? 10,
      isRated: score !== null,
    };
  });

  const ratingTier = rating?.ratingTier ?? null;
  return {
    isRated: (rating?.overallRating ?? null) !== null,
    overallRating: rating?.overallRating ?? null,
    ratingTier,
    tierLabelKey: ratingTier ? FARM_RATING_TIER_LABEL_KEY[ratingTier] : null,
    ratedAt: rating?.ratedAt ?? null,
    modules,
  };
}

/**
 * BR-33: Masks Aadhaar number to display only the last 4 digits.
 */
export function maskAadhaar(last4: string | null | undefined): string {
  if (!last4) return '—';
  return `•••• •••• ${last4}`;
}

/**
 * BR-33: Masks Mobile number to hide all but country code and last 3 digits.
 */
export function maskMobile(mobile: string | null | undefined): string {
  if (!mobile) return '—';
  if (mobile.length <= 5) return mobile;
  const prefix = mobile.slice(0, 3);
  const suffix = mobile.slice(-3);
  return `${prefix} ••••• ••${suffix}`;
}

/**
 * Evaluates certificate warning based on server-provided daysToExpiry and threshold.
 * Threshold is derived from system config or API, never hardcoded in the component (CLAUDE.md §2.7).
 */
export function evalCertificateWarning(
  daysToExpiry: number,
  thresholdDays: number = 30,
): { isWarning: boolean; isExpired: boolean; daysRemaining: number } {
  const isExpired = daysToExpiry < 0;
  const isWarning = isExpired || daysToExpiry <= thresholdDays;
  return {
    isWarning,
    isExpired,
    daysRemaining: daysToExpiry,
  };
}

/**
 * BR-02: the certificate types that can qualify a farmer to list -- the mobile
 * mirror of the server's LISTING_QUALIFYING_CERT_TYPES
 * (apps/api/src/modules/certifications/certifications.schema.ts). OTHER is a
 * real record (listed, may be verified) but never counts for listing.
 */
export const LISTING_QUALIFYING_CERT_TYPES: ReadonlyArray<Certification['certType']> = ['PGS', 'NPOP'];

export type CertSummary =
  | { kind: 'none' }
  | { kind: 'valid'; days: number }
  | { kind: 'expiring'; days: number }
  | { kind: 'pending' }
  /** `days` since expiry, positive. */
  | { kind: 'expired'; days: number }
  | { kind: 'rejected' };

/**
 * BR-01/BR-02: the ONE farmer-level certification status. A farmer may list
 * produce when they hold at least one VERIFIED, unexpired certificate; any
 * other expired / pending / rejected certificate must never block them. The
 * dashboard certification card and the market-access banner both render from
 * this function (the banner via `evalMarketBlock`), so they cannot disagree.
 *
 * Only PGS / NPOP certificates are considered (BR-02h, BR-02i): an OTHER
 * certificate never makes a farmer valid and is never named as pending or
 * expired, exactly like the server's listing gate, so a farmer holding only
 * OTHER certificates is `none` (CERT_MISSING). The certifications list screen
 * still shows OTHER certificates; only this eligibility summary drops them.
 *
 * Priority: best unexpired VERIFIED (furthest expiry) -> valid / expiring;
 * else any unexpired UNVERIFIED -> pending; else the latest expired -> expired;
 * else rejected; no certificates -> none. Inputs are the server-computed
 * `verificationStatus` + `daysToExpiry` (never the device clock); enforcement
 * itself is server-side, this is display only. `warningThresholdDays` comes
 * from system_config.
 */
export function summarizeCertifications(
  certs: readonly Certification[],
  warningThresholdDays: number,
): CertSummary {
  const qualifying = certs.filter((c) => LISTING_QUALIFYING_CERT_TYPES.includes(c.certType));
  if (qualifying.length === 0) return { kind: 'none' };
  const unexpired = qualifying.filter((c) => c.daysToExpiry >= 0);

  const bestVerified = unexpired
    .filter((c) => c.verificationStatus === 'VERIFIED')
    .sort((a, b) => b.daysToExpiry - a.daysToExpiry)[0];
  if (bestVerified !== undefined) {
    const warning = evalCertificateWarning(bestVerified.daysToExpiry, warningThresholdDays);
    return { kind: warning.isWarning ? 'expiring' : 'valid', days: bestVerified.daysToExpiry };
  }

  if (unexpired.some((c) => c.verificationStatus === 'UNVERIFIED')) return { kind: 'pending' };

  const latestExpired = qualifying
    .filter((c) => c.daysToExpiry < 0)
    .sort((a, b) => b.daysToExpiry - a.daysToExpiry)[0];
  if (latestExpired !== undefined) return { kind: 'expired', days: 0 - latestExpired.daysToExpiry };

  return { kind: 'rejected' };
}

export interface MarketBlockState {
  isBlocked: boolean;
  /**
   * Server error-code vocabulary: the code `POST /listings` refuses with
   * (CERT_EXPIRED / CERT_UNVERIFIED / CERT_MISSING), or the profile's own
   * `marketBlockReason` for a non-certificate block. CERT_MISSING covers both
   * "no certificate" and "only rejected ones"; `titleKey` tells them apart.
   */
  reason: string | null;
  /** Untyped on purpose (no dependency on i18n/farmer); callers cast to TranslationKey. */
  titleKey: string | null;
  messageKey: string | null;
}

const NOT_BLOCKED: MarketBlockState = { isBlocked: false, reason: null, titleKey: null, messageKey: null };

const CERT_EXPIRED_BLOCK: MarketBlockState = {
  isBlocked: true,
  reason: 'CERT_EXPIRED',
  titleKey: 'farmer.dashboard.banner.certExpiredTitle',
  messageKey: 'farmer.dashboard.banner.certExpiredMessage',
};

const CERT_UNVERIFIED_BLOCK: MarketBlockState = {
  isBlocked: true,
  reason: 'CERT_UNVERIFIED',
  titleKey: 'farmer.dashboard.banner.certPendingTitle',
  messageKey: 'farmer.dashboard.banner.certPendingMessage',
};

const CERT_MISSING_BLOCK: MarketBlockState = {
  isBlocked: true,
  reason: 'CERT_MISSING',
  titleKey: 'farmer.dashboard.banner.certMissingTitle',
  messageKey: 'farmer.dashboard.banner.certMissingMessage',
};

const CERT_REJECTED_BLOCK: MarketBlockState = {
  isBlocked: true,
  reason: 'CERT_MISSING',
  titleKey: 'farmer.dashboard.banner.certRejectedTitle',
  messageKey: 'farmer.dashboard.banner.certRejectedMessage',
};

/** Profile reasons that are certificate codes: the loaded list overrides them. */
const CERT_REASON_CODES = new Set(['CERT_EXPIRED', 'CERT_UNVERIFIED', 'CERT_MISSING']);

/**
 * BR-01 & BR-02: market-access banner state, derived from the SAME status as
 * the dashboard certification card (`summarizeCertifications`). Each blocked
 * reason is the code the server's listing gate refuses with.
 *
 *   valid / expiring  -> not blocked (a verified, unexpired certificate exists,
 *                        so other expired/pending/rejected ones never block)
 *   pending           -> blocked, CERT_UNVERIFIED
 *   expired           -> blocked, CERT_EXPIRED
 *   none              -> blocked, CERT_MISSING ("No certificate added"; also
 *                        a farmer holding only OTHER certificates, BR-02i)
 *   rejected          -> blocked, CERT_MISSING ("Certificate rejected")
 *
 * `certs === undefined` means the certificate list has not loaded (or failed):
 * only then does the server's own `profile.isMarketBlocked` stand in. Once the
 * list is loaded it is authoritative for the certificate reasons; a
 * non-certificate profile block (any other `marketBlockReason`) always shows.
 */
export function evalMarketBlock(
  profile: Partial<FarmerProfile>,
  certs?: readonly Certification[],
): MarketBlockState {
  const profileReason = profile.isMarketBlocked ? (profile.marketBlockReason ?? 'BLOCKED') : null;
  const certReasonFromProfile = profileReason !== null && CERT_REASON_CODES.has(profileReason);

  if (certs !== undefined) {
    // The warning threshold only splits valid vs expiring, both unblocked.
    const summary = summarizeCertifications(certs, 0);
    if (summary.kind === 'expired') return CERT_EXPIRED_BLOCK;
    if (summary.kind === 'pending') return CERT_UNVERIFIED_BLOCK;
    if (summary.kind === 'none') return CERT_MISSING_BLOCK;
    if (summary.kind === 'rejected') return CERT_REJECTED_BLOCK;
    if (profileReason !== null && !certReasonFromProfile) return genericBlock(profileReason);
    return NOT_BLOCKED;
  }

  if (profileReason === 'CERT_EXPIRED') return CERT_EXPIRED_BLOCK;
  if (profileReason === 'CERT_UNVERIFIED') return CERT_UNVERIFIED_BLOCK;
  if (profileReason === 'CERT_MISSING') return CERT_MISSING_BLOCK;
  if (profileReason !== null) return genericBlock(profileReason);
  return NOT_BLOCKED;
}

function genericBlock(reason: string): MarketBlockState {
  return {
    isBlocked: true,
    reason,
    titleKey: 'farmer.dashboard.banner.marketBlockedTitle',
    messageKey: 'farmer.dashboard.banner.marketBlocked',
  };
}

/**
 * Fetch own farmer profile.
 * x-permission: farmer.profile.view_own (BR-36)
 */
export async function getMyFarmerProfile(): Promise<FarmerProfile> {
  return api.get<FarmerProfile>('/farmers/me');
}

/**
 * Update own profile.
 * Aadhaar and mobile are never included in the payload (BR-33).
 */
export async function updateMyFarmerProfile(data: FarmerProfileUpdate): Promise<FarmerProfile> {
  return api.patch<FarmerProfile>('/farmers/me', data);
}

/**
 * Redisplay cache of the farmer's OWN certificates, filled only from a real
 * server answer (never seeded, never fabricated). `null` = nothing loaded yet.
 * Screens use it to paint instantly while the real request runs; it is never an
 * answer to a failed request. Cleared on sign-out so one farmer's list can
 * never flash for the next account on the same device.
 */
let localCertificationsCache: Certification[] | null = null;

/** A copy of the cached list, or [] when no list has been loaded from the server. */
export function getCachedCertifications(): Certification[] {
  return localCertificationsCache === null ? [] : [...localCertificationsCache];
}

export function clearCertificationsCache(): void {
  localCertificationsCache = null;
}

/**
 * Keeps the cache in step with what the server just confirmed. A mutation made
 * before any list was loaded is ignored: caching it would turn one row into a
 * "complete" list.
 */
function cacheUpsertCertification(cert: Certification): void {
  if (localCertificationsCache === null) return;
  const index = localCertificationsCache.findIndex((c) => c.id === cert.id);
  localCertificationsCache =
    index === -1
      ? [cert, ...localCertificationsCache]
      : localCertificationsCache.map((c) => (c.id === cert.id ? cert : c));
}

function cacheRemoveCertification(id: string): void {
  if (localCertificationsCache === null) return;
  localCertificationsCache = localCertificationsCache.filter((c) => c.id !== id);
}

/**
 * List own PGS/NPOP certifications (one page).
 * x-permission: certification.manage_own (BR-36)
 *
 * Any failure throws -- an ApiError when the server answered, a NetworkError
 * when it could not be reached -- so the screen can show an error state with
 * Retry. A farmer with no certificates gets `items: []`. There is no fallback
 * data: a certificate list that is not the server's is worse than none, because
 * the listing gate (BR-01 / BR-02) is decided on the server's list.
 * The cache is refreshed only from a complete first page (no further pages), so
 * it never holds a fragment of the list.
 */
export async function getMyCertifications(
  cursor?: string,
  limit: number = 20,
  signal?: AbortSignal,
): Promise<{ items: Certification[]; page: { nextCursor: string | null; hasMore: boolean } }> {
  let url = `/farmers/me/certifications?limit=${limit}`;
  if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
  const res = await api.get<{ items: Certification[]; page: { nextCursor: string | null; hasMore: boolean } }>(
    url,
    signal,
  );
  if (res === null || typeof res !== 'object' || !Array.isArray(res.items)) {
    // A 200 whose body is not a certificate page is a server fault, so it is reported as the
    // same typed ApiError the screens already classify (certificationErrorKind -> 'other',
    // ErrorState with Retry), not a bare Error. `status` is the status actually received (200).
    throw new ApiError({
      type: 'about:blank',
      title: 'Unexpected response from GET /farmers/me/certifications',
      status: 200,
      code: 'INTERNAL',
    });
  }
  if (!cursor && res.page?.hasMore !== true) localCertificationsCache = [...res.items];
  return res;
}

const MAX_CERT_PAGES = 20; // guard against a looping cursor, not a business limit
const CERT_PAGE_SIZE = 100; // LimitParam maximum in docs/openapi.yaml

/**
 * Every own certification, walking the cursor -- and, unlike
 * `getMyCertifications` above, walking every page: a failure rejects
 * (ApiError / NetworkError) and a farmer with no certificates gets `[]`. For
 * surfaces such as the Dashboard that need the whole list.
 * x-permission: certification.manage_own (BR-36)
 */
export async function listAllMyCertifications(signal?: AbortSignal): Promise<Certification[]> {
  const all: Certification[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < MAX_CERT_PAGES; i += 1) {
    let url = `/farmers/me/certifications?limit=${CERT_PAGE_SIZE}`;
    if (cursor !== undefined) url += `&cursor=${encodeURIComponent(cursor)}`;
    const page = await api.get<{ items: Certification[]; page: { nextCursor: string | null; hasMore: boolean } }>(
      url,
      signal,
    );
    all.push(...page.items);
    if (!page.page.hasMore || page.page.nextCursor === null) break;
    cursor = page.page.nextCursor;
  }
  return all;
}

/**
 * Create a new certification starting UNVERIFIED (BR-02).
 *
 * Any failure throws -- an ApiError when the server answered (e.g. a 422 with a
 * field `errors` map, BR-48), a NetworkError when it could not be reached. A
 * certificate is never recorded here unless the server created it: pretending
 * to have saved one while offline would put a certificate on screen that the
 * server, and so the listing gate, has never heard of.
 */
export async function createCertification(data: CertificationCreate): Promise<Certification> {
  const res = await api.post<Certification>('/farmers/me/certifications', data);
  cacheUpsertCertification(res);
  return res;
}

/**
 * Edit a certification (BR-49): sends only the fields in `patch`. The server
 * resets a VERIFIED / REJECTED certificate to UNVERIFIED on any change and
 * returns the updated record, which is what callers should display.
 * x-permission: certification.manage_own
 */
export async function updateCertification(id: string, patch: CertificationUpdate): Promise<Certification> {
  const res = await api.patch<Certification>(`/farmers/me/certifications/${encodeURIComponent(id)}`, patch);
  cacheUpsertCertification(res);
  return res;
}

/**
 * Delete a certification (BR-50: a soft delete on the server, 204 No Content).
 * A 404 means it is already gone (unknown, not yours, or deleted), so it
 * leaves the fallback cache too before the error is rethrown.
 * x-permission: certification.manage_own
 */
export async function deleteCertification(id: string): Promise<void> {
  try {
    await api.delete<void>(`/farmers/me/certifications/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err instanceof ApiError && err.problem.status === 404) cacheRemoveCertification(id);
    throw err;
  }
  cacheRemoveCertification(id);
}

export interface UploadCertificateDocumentInput {
  /** The picker's local file URI (read with fetch, as the soil / pest uploads do). */
  uri: string;
  fileName: string;
  contentType: string;
}

/**
 * Uploads a certificate document through the general upload flow --
 * `POST /uploads/sign` with `purpose: 'CERTIFICATE'`, then a PUT of the bytes to
 * the signed target -- and returns the durable `fileUrl`, which is what
 * `documentUrl` on create / edit takes ("a document previously uploaded through
 * POST /uploads/sign", docs/openapi.yaml createCertification). Throws on any
 * failure so the caller attaches nothing.
 */
export async function uploadCertificateDocument(
  input: UploadCertificateDocumentInput,
): Promise<{ fileUrl: string }> {
  const fileResp = await fetch(input.uri);
  const bytes = new Uint8Array(await fileResp.arrayBuffer());
  const signed = await signUpload({
    purpose: 'CERTIFICATE',
    fileName: input.fileName,
    contentType: input.contentType,
    sizeBytes: bytes.length,
  });
  await uploadWithResume({
    uploadUrl: signed.uploadUrl,
    fileUrl: signed.fileUrl,
    resumable: signed.resumable ?? false,
    data: bytes,
    contentType: input.contentType,
    headers: signed.headers,
    method: signed.method,
  });
  return { fileUrl: signed.fileUrl };
}

function nonNegativeInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : fallback;
}

/**
 * GET /v1/config/farmer -- the farmer-facing system_config values. Never
 * throws: each value falls back on its own (FALLBACK_* above) when the call
 * fails or the value is missing or not a non-negative integer. 0 is a real
 * setting, not "missing".
 */
export async function getSystemConfig(): Promise<SystemConfig> {
  let res: Partial<Record<keyof SystemConfig, unknown>> | null = null;
  try {
    res = await api.get<Partial<Record<keyof SystemConfig, unknown>>>('/config/farmer');
  } catch {
    res = null;
  }
  return {
    certExpiryWarningDays: nonNegativeInteger(res?.certExpiryWarningDays, FALLBACK_CERT_EXPIRY_WARNING_DAYS),
    certExpiryMaxPastDays: nonNegativeInteger(res?.certExpiryMaxPastDays, FALLBACK_CERT_EXPIRY_MAX_PAST_DAYS),
    certExpiryMaxFutureDays: nonNegativeInteger(res?.certExpiryMaxFutureDays, FALLBACK_CERT_EXPIRY_MAX_FUTURE_DAYS),
  };
}

/**
 * Fetch the current farmer's 10-category farm rating (BR-06).
 * x-permission: farmer.rating.view_own
 */
export async function getMyFarmRating(): Promise<FarmRating> {
  return api.get<FarmRating>('/farmers/me/rating');
}
