/**
 * Typed API client for the farmer's own audits (FarmerAuditSummary /
 * FarmerAuditDetail in docs/openapi.yaml, tag `Audits`):
 *
 *   GET /farmers/me/audits               -> listMyAudits / listAllMyAudits
 *   GET /farmers/me/audits/{id}          -> getMyAudit
 *   GET /farmers/me/audits/{id}/report   -> getMyAuditReportUrl
 *
 * Field names match the spec verbatim. The farmer schemas are an allow-list on
 * the server (BR-36): there is deliberately no red-flag, creator or farmerId
 * field here, and scores/findings are only populated once an audit is
 * COMPLETED. Ownership is enforced server-side; another farmer's audit id is a
 * plain 404, which this client surfaces as an ApiError with status 404.
 *
 * The pure view helpers at the bottom (no React, no i18n import) are what the
 * two audit screens render from, so they can be unit-tested in plain Node --
 * same reason `deriveFarmRatingView` lives in api/farmer.ts. i18n keys are
 * typed `string` here; callers do `t(key as TranslationKey)`.
 */
import {
  api,
  ApiError,
  getAccessToken,
  NetworkError,
  refreshAuthTokens,
  resolveUrl,
} from '../../../shell/api/client';
import type { Problem } from '@tohfa/shared-types';
import { FARM_RATING_TIER_LABEL_KEY, type FarmRatingCategoryCode } from './farmer';

// ---------------------------------------------------------------------------
// Wire types
// ---------------------------------------------------------------------------

export type AuditType = 'INTERNAL' | 'EXTERNAL';
export type AuditStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type AuditFindingSeverity = 'MAJOR' | 'MINOR' | 'OBSERVATION';
/** Resolved server-side from rating_tier_config (BR-04a); null until COMPLETED. */
export type AuditTier = 'POOR' | 'MODERATE' | 'GOOD' | 'EXCELLENT';

export interface AuditFindingCounts {
  major: number;
  minor: number;
  observation: number;
  openMajor: number;
}

export interface FarmerAuditSummary {
  id: string;
  farmId: string | null;
  farmName: string | null;
  fiscalYear: string;
  quarter: number;
  auditType: AuditType;
  status: AuditStatus;
  scheduledFor: string;
  startedAt: string | null;
  completedAt: string | null;
  auditorName: string | null;
  externalAgencyName: string | null;
  /** 0-100, the direct sum of the 10 category scores. Null until COMPLETED. */
  totalScore: number | null;
  maxScore: number;
  tier: AuditTier | null;
  majorViolationsCount: number;
  findingCounts: AuditFindingCounts;
}

export interface AuditCategoryScore {
  categoryCode: FarmRatingCategoryCode;
  score: number | null;
  maxScore: number;
  remarks?: string | null;
}

export interface AuditFinding {
  id: string;
  auditId: string;
  severity: AuditFindingSeverity;
  categoryCode: FarmRatingCategoryCode | null;
  description: string;
  correctiveAction: string | null;
  dueDate: string | null;
  resolvedAt: string | null;
  resolutionNote?: string | null;
  createdAt: string;
}

export interface FarmerAuditDetail extends FarmerAuditSummary {
  summary: string | null;
  hasAgencyReport: boolean;
  cancelledReason: string | null;
  categoryScores: AuditCategoryScore[];
  findings: AuditFinding[];
}

export interface ListMyAuditsQuery {
  fiscalYear?: string;
  /** One or more statuses; sent comma-separated. */
  status?: AuditStatus[];
  type?: AuditType;
  sort?: 'scheduledFor' | '-scheduledFor';
  cursor?: string;
  limit?: number;
}

export interface ListMyAuditsResult {
  items: FarmerAuditSummary[];
  page: { nextCursor: string | null; hasMore: boolean };
}

export type AuditReportVariant = 'generated' | 'agency';

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------


export async function listMyAudits(
  query: ListMyAuditsQuery = {},
  signal?: AbortSignal,
): Promise<ListMyAuditsResult> {
  const params = new URLSearchParams();
  if (query.fiscalYear !== undefined) params.append('fiscalYear', query.fiscalYear);
  if (query.status !== undefined && query.status.length > 0) params.append('status', query.status.join(','));
  if (query.type !== undefined) params.append('type', query.type);
  if (query.sort !== undefined) params.append('sort', query.sort);
  if (query.cursor !== undefined) params.append('cursor', query.cursor);
  if (query.limit !== undefined) params.append('limit', query.limit.toString());

  const queryStr = params.toString();
  return api.get<ListMyAuditsResult>(`/farmers/me/audits${queryStr ? `?${queryStr}` : ''}`, signal);
}

/**
 * A farmer has at most one audit per quarter (BR-03a), so their whole history
 * is small. The overview screen needs all of it at once (per-tab lists, "done
 * this year", latest tier), so this walks the cursor to the end. The page cap
 * is a guard against a server bug looping the cursor, not a business limit.
 */
const MAX_PAGES = 20;
const PAGE_SIZE = 100; // LimitParam maximum in docs/openapi.yaml

export async function listAllMyAudits(signal?: AbortSignal): Promise<FarmerAuditSummary[]> {
  const all: FarmerAuditSummary[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < MAX_PAGES; i += 1) {
    const page = await listMyAudits(
      { limit: PAGE_SIZE, ...(cursor === undefined ? {} : { cursor }) },
      signal,
    );
    all.push(...page.items);
    if (!page.page.hasMore || page.page.nextCursor === null) break;
    cursor = page.page.nextCursor;
  }
  return all;
}

export async function getMyAudit(auditId: string, signal?: AbortSignal): Promise<FarmerAuditDetail> {
  return api.get<FarmerAuditDetail>(`/farmers/me/audits/${encodeURIComponent(auditId)}`, signal);
}

/**
 * Resolves the report PDF to a short-lived signed URL the OS can open.
 *
 * Why not just `Linking.openURL(reportEndpoint)`: the report endpoint needs the
 * farmer's bearer token, and a browser / PDF viewer opened by Linking never
 * sends it. So we call the endpoint ourselves with `redirect=true` (the spec's
 * 302-to-signed-URL mode, same as invoices), let fetch follow the 302, and
 * hand the final `response.url` -- the signed URL, valid 5 minutes -- to
 * Linking. The body is never read; the request is aborted once headers arrive.
 *
 * Errors follow the shared client: problem+json -> ApiError (404 for another
 * farmer's audit, 409 INVALID_STATE_TRANSITION before COMPLETED), transport
 * failure -> NetworkError. A 401 gets one silent refresh-and-retry, like
 * `request()` does.
 */
export async function getMyAuditReportUrl(
  auditId: string,
  variant: AuditReportVariant = 'generated',
): Promise<string> {
  const path = `/farmers/me/audits/${encodeURIComponent(auditId)}/report?variant=${variant}&redirect=true`;
  const requestUrl = resolveUrl(path);

  const attempt = async (): Promise<Response> => {
    const headers: Record<string, string> = { Accept: 'application/pdf, application/problem+json' };
    const token = getAccessToken();
    if (token !== null) headers['Authorization'] = `Bearer ${token}`;
    try {
      return await fetch(requestUrl, { method: 'GET', headers });
    } catch (error) {
      throw new NetworkError(error);
    }
  };

  let response = await attempt();
  if (response.status === 401) {
    const refreshed = await refreshAuthTokens();
    if (refreshed !== null) response = await attempt();
  }

  if (!response.ok) {
    throw new ApiError(await readProblem(response));
  }

  const finalUrl = response.url;
  // Drop the PDF body: we only wanted where the redirect landed.
  void response.body?.cancel().catch(() => undefined);

  if (!finalUrl || finalUrl === requestUrl) {
    // The server answered 200 with the PDF itself instead of redirecting.
    // There is no file-viewer dependency in this app to render bytes, so
    // this is reported as a failure the screen can show, not swallowed.
    throw new ApiError({
      type: 'about:blank',
      title: 'Report link unavailable',
      status: response.status,
      code: 'INTERNAL',
    } as Problem);
  }
  return finalUrl;
}

async function readProblem(response: Response): Promise<Problem> {
  try {
    const payload: unknown = await response.json();
    if (typeof payload === 'object' && payload !== null && 'code' in payload && 'status' in payload && 'title' in payload) {
      return payload as Problem;
    }
  } catch {
    // fall through to the generic problem below
  }
  return {
    type: 'about:blank',
    title: 'Request failed',
    status: response.status,
    code: response.status === 404 ? 'NOT_FOUND' : 'INTERNAL',
  } as Problem;
}

/** True when an error from getMyAudit / getMyAuditReportUrl means "not yours or not there" (BR-36a/b). */
export function isAuditNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.problem.status === 404;
}

// ---------------------------------------------------------------------------
// Pure view helpers
// ---------------------------------------------------------------------------

/**
 * BR-03: one audit per fiscal quarter. The 4 is the number of quarters in a
 * fiscal year, not a tunable threshold (docs/rules.md BR-03 implementation
 * notes), so it is a structural constant rather than a system_config read.
 */
export const QUARTERS_PER_FISCAL_YEAR = 4;

/** Asia/Kolkata is a fixed UTC+05:30 with no DST, so a plain offset is exact. */
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export interface IstDateParts {
  day: number;
  /** 0 = January */
  monthIndex: number;
  year: number;
  hour: number;
  minute: number;
}

export function istDateParts(iso: string): IstDateParts | null {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  const d = new Date(ms + IST_OFFSET_MS);
  return {
    day: d.getUTCDate(),
    monthIndex: d.getUTCMonth(),
    year: d.getUTCFullYear(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

/** Indian fiscal year (April-March) label for a moment, in IST: `2026-27`. */
export function fiscalYearLabel(at: Date): string {
  const parts = istDateParts(at.toISOString());
  if (parts === null) return '';
  const start = parts.monthIndex >= 3 ? parts.year : parts.year - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
}

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;

/** Short month key for the list date box ("Jul"). */
export function shortMonthKey(monthIndex: number): string {
  return `farmer.audits.monthShort.${MONTH_KEYS[monthIndex] ?? 'jan'}`;
}

/** Full month key for headings ("July"); reuses the existing weather month catalogue. */
export function fullMonthKey(monthIndex: number): string {
  return `farmer.weather.month.${MONTH_KEYS[monthIndex] ?? 'jan'}`;
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function tierLabelKey(tier: AuditTier | null): string | null {
  return tier === null ? null : FARM_RATING_TIER_LABEL_KEY[tier];
}

export const AUDIT_STATUS_LABEL_KEY: Record<AuditStatus, string> = {
  SCHEDULED: 'farmer.audits.status.scheduled',
  IN_PROGRESS: 'farmer.audits.status.inProgress',
  COMPLETED: 'farmer.audits.status.completed',
  CANCELLED: 'farmer.audits.status.cancelled',
};

export function isUpcoming(a: Pick<FarmerAuditSummary, 'status'>): boolean {
  return a.status === 'SCHEDULED' || a.status === 'IN_PROGRESS';
}

/**
 * Scores are shown only for a COMPLETED audit with a total -- never for an
 * upcoming, in-progress or cancelled one, even if a field were present.
 */
export function auditScore(a: Pick<FarmerAuditSummary, 'status' | 'totalScore' | 'maxScore'>): {
  score: number;
  max: number;
} | null {
  if (a.status !== 'COMPLETED' || a.totalScore === null) return null;
  return { score: a.totalScore, max: a.maxScore };
}

/** Who conducted it: the agency for EXTERNAL, the TOHFA auditor for INTERNAL. */
export function auditConductedBy(a: Pick<FarmerAuditSummary, 'auditType' | 'externalAgencyName' | 'auditorName'>): string | null {
  return a.auditType === 'EXTERNAL' ? (a.externalAgencyName ?? a.auditorName) : (a.auditorName ?? a.externalAgencyName);
}

/** Date that best describes the audit: completion when done, otherwise the schedule. */
export function auditDisplayDate(a: Pick<FarmerAuditSummary, 'status' | 'completedAt' | 'scheduledFor'>): string {
  return a.status === 'COMPLETED' && a.completedAt !== null ? a.completedAt : a.scheduledFor;
}

/** Gauge needle position: 0 = far left, 1 = far right. Clamped; null score -> 0. */
export function scoreFraction(score: number | null, max: number): number {
  if (score === null || max <= 0) return 0;
  return Math.min(1, Math.max(0, score / max));
}

export interface AuditTypeGroup {
  /** The next SCHEDULED / IN_PROGRESS audit (earliest scheduledFor), shown in the hero card. */
  next: FarmerAuditSummary | null;
  /** Any further upcoming audits after `next`, earliest first. */
  laterUpcoming: FarmerAuditSummary[];
  /** COMPLETED and CANCELLED audits, most recent first. */
  past: FarmerAuditSummary[];
}

export interface AuditsOverview {
  EXTERNAL: AuditTypeGroup;
  INTERNAL: AuditTypeGroup;
  /** COMPLETED audits (either type) in the current fiscal year. */
  doneThisYear: number;
  currentFiscalYear: string;
  /** Tier of the most recently completed audit, either type. */
  latestTier: AuditTier | null;
  isEmpty: boolean;
}

function byTimeAsc(a: string, b: string): number {
  return Date.parse(a) - Date.parse(b);
}

function groupFor(items: FarmerAuditSummary[], type: AuditType): AuditTypeGroup {
  const ofType = items.filter((a) => a.auditType === type);
  const upcoming = ofType.filter(isUpcoming).sort((a, b) => byTimeAsc(a.scheduledFor, b.scheduledFor));
  const past = ofType
    .filter((a) => !isUpcoming(a))
    .sort((a, b) => byTimeAsc(auditDisplayDate(b), auditDisplayDate(a)));
  return { next: upcoming[0] ?? null, laterUpcoming: upcoming.slice(1), past };
}

export function deriveAuditsOverview(items: FarmerAuditSummary[], now: Date = new Date()): AuditsOverview {
  const currentFiscalYear = fiscalYearLabel(now);
  const completed = items
    .filter((a) => a.status === 'COMPLETED')
    .sort((a, b) => byTimeAsc(auditDisplayDate(b), auditDisplayDate(a)));
  return {
    EXTERNAL: groupFor(items, 'EXTERNAL'),
    INTERNAL: groupFor(items, 'INTERNAL'),
    doneThisYear: completed.filter((a) => a.fiscalYear === currentFiscalYear).length,
    currentFiscalYear,
    latestTier: completed[0]?.tier ?? null,
    isEmpty: items.length === 0,
  };
}
