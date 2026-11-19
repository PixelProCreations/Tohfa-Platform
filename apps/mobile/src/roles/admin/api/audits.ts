/**
 * Farm audits as an admin runs them (docs/openapi.yaml tag Audits):
 *
 *   GET   /admin/audits                              audit.view              (BR-03, BR-04, BR-36)
 *   POST  /admin/audits                              audit.schedule          (BR-03)
 *   GET   /admin/audits/compliance                   audit.view              (BR-03, BR-05)
 *   POST  /admin/audits/bulk-reschedule              audit.schedule          (BR-03)
 *   GET   /admin/audits/{id}                         audit.view              (BR-04, BR-06)
 *   PATCH /admin/audits/{id}                         audit.schedule          (BR-03)
 *   POST  /admin/audits/{id}/cancel                  audit.schedule          (BR-03)
 *   POST  /admin/audits/{id}/start                   audit.conduct
 *   PUT   /admin/audits/{id}/scores                  audit.score.categories  (BR-06)
 *   POST  /admin/audits/{id}/findings                audit.findings.log      (BR-05)
 *   PATCH /admin/audits/{id}/findings/{findingId}    audit.findings.log      (BR-05)
 *   POST  /admin/audits/{id}/complete                audit.conduct           (BR-04, BR-05, BR-06)
 *   POST  /admin/audits/{id}/red-flag                audit.red_flag.manage   (BR-05)
 *   POST  /admin/audits/{id}/clear-red-flag          audit.red_flag.manage   (BR-05)
 *   GET   /admin/audits/{id}/report                  audit.report.generate   (BR-04, BR-06)
 *   GET   /admin/audit-tier-thresholds               audit.tier.configure_thresholds (BR-04, BR-147)
 *   PATCH /admin/audit-tier-thresholds               audit.tier.configure_thresholds (BR-04, BR-111)
 *
 * Scope is the server's: a Farmer Admin sees only audits of farmers in their
 * own zone(s); anything else is absent from lists and 404 on a detail, never
 * 403. No route takes a warehouseId, so this module never sends one.
 *
 * Headers: the spec defines no Idempotency-Key and no If-Match / version for
 * any audit write (none moves money, root CLAUDE.md 2.4). The one replay hazard,
 * a bulk `shiftDays` applied twice, is guarded by the per-item
 * `expectedScheduledFor` in the BODY, not a header.
 *
 * The tier thresholds read and write the same store as the farm rating tiers
 * (one scale, BR-04): GET /admin/audit-tier-thresholds returns exactly the body
 * of GET /admin/rating-tiers, only the permission differs. Both carry
 * audit.tier.configure_thresholds, so a screen that cannot configure must not
 * ask for the read either (BR-147b: it is a 403, not an empty result).
 *
 * The report is not JSON: 200 is the PDF bytes, `redirect=true` is a 302 to a
 * 5-minute signed URL. A viewer opened through Linking never sends the bearer
 * token, so getAuditReportUrl asks for the redirect itself and returns where it
 * landed, like getInvoiceDownloadUrl (./invoices.ts). The farmer copy of this
 * pattern lives in roles/farmer, which the cross-role guard keeps out of reach.
 *
 * Wire types are duplicated from the spec here rather than shared with
 * roles/farmer/api/audits.ts, for the same cross-role reason. No UI imports.
 */
import type { ErrorCode, GenericProblemCode, Problem } from '@tohfa/shared-types';
import { ApiError, NetworkError, getAccessToken, refreshAuthTokens, resolveUrl } from '../../../shell/api/client';
import type { Page, PageMeta } from '../../../shell/api/pagination';
import { ADMIN_REQUEST_TIMEOUT_MS, adminGet, adminPatch, adminPost, adminPut } from './http';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** docs/openapi.yaml AuditType. */
export type AuditType = 'INTERNAL' | 'EXTERNAL';

/** docs/openapi.yaml AuditStatus: SCHEDULED -> IN_PROGRESS -> COMPLETED; SCHEDULED or IN_PROGRESS -> CANCELLED. */
export type AuditStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

/** docs/openapi.yaml AuditFindingSeverity. */
export type AuditFindingSeverity = 'MAJOR' | 'MINOR' | 'OBSERVATION';

/** docs/openapi.yaml AuditTier (non-null part); resolved at read time from rating_tier_config (BR-04a). */
export type AuditTier = 'POOR' | 'MODERATE' | 'GOOD' | 'EXCELLENT';

/** docs/openapi.yaml AuditComplianceStatus (BR-03b). */
export type AuditComplianceStatus = 'COMPLIANT' | 'PENDING' | 'NON_COMPLIANT';

/** docs/openapi.yaml RatingCategoryCode: the 10 seeded rating_categories (BR-06); names come from i18n. */
export type RatingCategoryCode =
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

/** docs/openapi.yaml TierBand.code / TierBandInput.code. */
export type TierBandCode = AuditTier;

/** The `sort` query of GET /admin/audits: ascending for the calendar, descending (server default) for history. */
export type AuditSort = 'scheduledFor' | '-scheduledFor';

/** The `variant` query of the report: the TOHFA-rendered PDF, or the uploaded agency file. */
export type AuditReportVariant = 'generated' | 'agency';

/** AuditBulkRescheduleResult.results[].outcome. */
export type AuditBulkRescheduleOutcome = 'RESCHEDULED' | 'FAILED';

/** AuditBulkRescheduleResult.results[].code (present when FAILED). */
export type AuditBulkRescheduleFailureCode = 'NOT_FOUND' | 'INVALID_STATE_TRANSITION' | 'AUDIT_QUARTER_TAKEN' | 'CONFLICT';

// ---------------------------------------------------------------------------
// Response DTOs
// ---------------------------------------------------------------------------

/** docs/openapi.yaml AuditFindingCounts: computed at read time; `openMajor` = unresolved MAJOR findings. */
export interface AuditFindingCountsDto {
  major: number;
  minor: number;
  observation: number;
  openMajor: number;
}

/** docs/openapi.yaml AuditSummary: one row of the list / calendar / farmer history. Every key always present. */
export interface AuditSummaryDto {
  id: string;
  farmerId: string;
  /** Human code, e.g. TOHFA-F-2026-0234; never a key. */
  tohfaFarmerId: string;
  farmerName: string;
  farmId: string | null;
  farmName: string | null;
  /** The zone the audit was scheduled in (snapshot). */
  zoneId: string | null;
  zoneName: string | null;
  /** FiscalYear, e.g. `2026-27`; derived server-side from scheduledFor. */
  fiscalYear: string;
  /** 1-4. */
  quarter: number;
  auditType: AuditType;
  status: AuditStatus;
  scheduledFor: string;
  startedAt: string | null;
  completedAt: string | null;
  auditorUserId: string | null;
  auditorName: string | null;
  /** EXTERNAL audits only. */
  externalAgencyName: string | null;
  /** 0-100, direct sum of the 10 category scores; null until COMPLETED. */
  totalScore: number | null;
  /** Always 100. */
  maxScore: number;
  /** Null until COMPLETED. */
  tier: AuditTier | null;
  /** BR-05a: persisted on completion; 0 before. */
  majorViolationsCount: number;
  findingCounts: AuditFindingCountsDto;
  /** BR-05b: set only by an explicit admin action. */
  redFlagged: boolean;
}

/** docs/openapi.yaml AuditReportUpload: download it with variant=agency. */
export interface AuditReportUploadDto {
  uploadId: string;
  mimeType: string;
  sizeBytes: number;
}

/** docs/openapi.yaml AuditCategoryScore: always 10, in rating_categories order; a null score is incomplete, not zero (BR-06). */
export interface AuditCategoryScoreDto {
  categoryCode: RatingCategoryCode;
  /** 0-10, or null when not yet scored. */
  score: number | null;
  /** Always 10. */
  maxScore: number;
  /** Optional in the spec (not in `required`). */
  remarks?: string | null;
}

/** docs/openapi.yaml AuditFinding. */
export interface AuditFindingDto {
  id: string;
  auditId: string;
  severity: AuditFindingSeverity;
  categoryCode: RatingCategoryCode | null;
  description: string;
  correctiveAction: string | null;
  /** YYYY-MM-DD. */
  dueDate: string | null;
  resolvedAt: string | null;
  /** Optional in the spec; admin views only. */
  resolvedByName?: string | null;
  /** Optional in the spec. */
  resolutionNote?: string | null;
  createdAt: string;
}

/** docs/openapi.yaml Audit: the full admin record without its score sheet and findings. */
export interface AuditDto extends AuditSummaryDto {
  /** Auditor's overall remarks. */
  summary: string | null;
  reportUpload: AuditReportUploadDto | null;
  redFlagReason: string | null;
  redFlaggedAt: string | null;
  redFlaggedByName: string | null;
  cancelledReason: string | null;
  cancelledAt: string | null;
  createdByName: string;
  createdAt: string;
  updatedAt: string | null;
}

/** docs/openapi.yaml AuditDetail: the record plus its 10-category score sheet and findings. */
export interface AuditDetailDto extends AuditDto {
  categoryScores: AuditCategoryScoreDto[];
  findings: AuditFindingDto[];
}

/** docs/openapi.yaml AuditComplianceFarmer.currentQuarterAudit (non-null part). */
export interface AuditComplianceCurrentQuarterAuditDto {
  auditId: string;
  status: AuditStatus;
  scheduledFor: string;
  /** SCHEDULED/IN_PROGRESS with scheduledFor in the past. */
  overdue: boolean;
}

/** docs/openapi.yaml AuditComplianceFarmer: one row of the compliance farmers page. */
export interface AuditComplianceFarmerDto {
  farmerId: string;
  tohfaFarmerId: string;
  farmerName: string;
  zoneId: string | null;
  zoneName: string | null;
  /** 0-4. */
  completedCount: number;
  /** Always 4: one per fiscal quarter (BR-03). */
  requiredCount: number;
  complianceStatus: AuditComplianceStatus;
  /** Null for a past fiscal year or when the farmer has no live audit this quarter. */
  currentQuarterAudit: AuditComplianceCurrentQuarterAuditDto | null;
  redFlaggedAuditCount: number;
  openMajorFindingCount: number;
}

/** docs/openapi.yaml AuditComplianceSummary.counts: over the whole in-scope population, never one page. */
export interface AuditComplianceCountsDto {
  farmersInScope: number;
  compliant: number;
  pending: number;
  nonCompliant: number;
  /** SCHEDULED/IN_PROGRESS audits in this fiscal year with scheduledFor in the past. */
  overdueAudits: number;
  /** 0 for a past fiscal year. */
  farmersWithoutCurrentQuarterAudit: number;
  redFlaggedAudits: number;
  redFlaggedFarmers: number;
  openMajorFindings: number;
  scheduledThisQuarter: number;
}

/**
 * docs/openapi.yaml AuditComplianceSummary: the counts plus ONE cursor page of
 * farmers, so it is itself a Page<AuditComplianceFarmerDto> (`items` is named
 * `farmers` on the wire, hence no `extends Page`).
 */
export interface AuditComplianceSummaryDto {
  fiscalYear: string;
  /** True once 31 March of the fiscal year has passed (Asia/Kolkata). */
  isFiscalYearClosed: boolean;
  /** 1-4; null unless fiscalYear is the current one. */
  currentQuarter: number | null;
  /** YYYY-MM-DD, last day of the current quarter. */
  currentQuarterEndsOn: string | null;
  asOf: string;
  counts: AuditComplianceCountsDto;
  farmers: AuditComplianceFarmerDto[];
  page: PageMeta;
}

/** One item of docs/openapi.yaml AuditBulkRescheduleResult.results. */
export interface AuditBulkRescheduleItemResultDto {
  auditId: string;
  outcome: AuditBulkRescheduleOutcome;
  /** Present when FAILED. */
  code?: AuditBulkRescheduleFailureCode;
  detail?: string;
  /** Present when RESCHEDULED. */
  audit?: AuditSummaryDto;
}

/** docs/openapi.yaml AuditBulkRescheduleResult: the batch may partially succeed. */
export interface AuditBulkRescheduleResultDto {
  rescheduledCount: number;
  failedCount: number;
  results: AuditBulkRescheduleItemResultDto[];
}

/** docs/openapi.yaml TierBand. */
export interface TierBandDto {
  code: TierBandCode;
  label: string;
  /** Inclusive. */
  minScore: number;
  /** Exclusive; null = unbounded. */
  maxScore: number | null;
  sortOrder: number;
}

/** docs/openapi.yaml TierBandsGeneration: the generation now in effect. */
export interface TierBandsGenerationDto {
  /** YYYY-MM-DD. */
  effectiveFrom: string;
  tiers: TierBandDto[];
}

// ---------------------------------------------------------------------------
// Request bodies and params
// ---------------------------------------------------------------------------

/** docs/openapi.yaml AuditCreate. fiscalYear/quarter are derived server-side and never sent. */
export interface AuditCreateBody {
  farmerId: string;
  /** Must belong to the farmer. */
  farmId?: string;
  auditType: AuditType;
  scheduledFor: string;
  /** INTERNAL only; may be assigned later. */
  auditorUserId?: string;
  /** EXTERNAL requires it, INTERNAL forbids it; 2-200 characters. */
  externalAgencyName?: string;
}

/** docs/openapi.yaml AuditUpdate: SCHEDULED audits only, at least one field besides `reason`. */
export interface AuditUpdateBody {
  scheduledFor?: string;
  farmId?: string | null;
  /** INTERNAL only. */
  auditorUserId?: string | null;
  /** EXTERNAL only; 2-200 characters. */
  externalAgencyName?: string;
  /** Recorded in the audit_log row; up to 500 characters. */
  reason?: string;
}

/** Body of POST /admin/audits/{id}/cancel and /red-flag: 3-500 characters. */
export interface AuditReasonBody {
  reason: string;
}

/** Body of POST /admin/audits/{id}/start (optional). */
export interface AuditStartBody {
  /** Required by then for an INTERNAL audit with no auditor yet. */
  auditorUserId?: string;
}

/** Body of POST /admin/audits/{id}/clear-red-flag (optional). */
export interface AuditClearRedFlagBody {
  /** Up to 500 characters. */
  note?: string;
}

/** One item of docs/openapi.yaml AuditScoresUpdate.scores. */
export interface AuditScoreInput {
  categoryCode: RatingCategoryCode;
  /** Integer; outside 0-10 is 422 SCORE_OUT_OF_RANGE (BR-06a). */
  score: number;
  /** Up to 1000 characters. */
  remarks?: string;
}

/** docs/openapi.yaml AuditScoresUpdate: 1-10 scores, upserted. */
export interface AuditScoresBody {
  scores: AuditScoreInput[];
  /** Up to 4000 characters. */
  summary?: string;
  /** storageKey from POST /uploads/sign with purpose AUDIT_REPORT. */
  reportStorageKey?: string;
}

/** docs/openapi.yaml AuditCompleteRequest (optional body). */
export interface AuditCompleteBody {
  summary?: string;
  reportStorageKey?: string;
}

/** docs/openapi.yaml AuditFindingCreate. */
export interface AuditFindingCreateBody {
  severity: AuditFindingSeverity;
  categoryCode?: RatingCategoryCode;
  /** 3-2000 characters. */
  description: string;
  correctiveAction?: string;
  /** YYYY-MM-DD. */
  dueDate?: string;
}

/** docs/openapi.yaml AuditFindingUpdate: after COMPLETED only `resolved: true` and `resolutionNote`. */
export interface AuditFindingUpdateBody {
  severity?: AuditFindingSeverity;
  categoryCode?: RatingCategoryCode | null;
  description?: string;
  correctiveAction?: string | null;
  dueDate?: string | null;
  resolved?: boolean;
  resolutionNote?: string;
}

/** One item of docs/openapi.yaml AuditBulkRescheduleRequest.items. */
export interface AuditBulkRescheduleItem {
  auditId: string;
  /** Optimistic-concurrency guard: the item fails with CONFLICT if scheduledFor moved. Makes a shiftDays replay safe. */
  expectedScheduledFor?: string;
}

interface AuditBulkRescheduleBase {
  /** 1-100 items. */
  items: AuditBulkRescheduleItem[];
  /** Recorded in each audit_log row; up to 500 characters. */
  reason?: string;
}

/** docs/openapi.yaml AuditBulkRescheduleRequest: exactly one of newScheduledFor or shiftDays. */
export type AuditBulkRescheduleBody =
  | (AuditBulkRescheduleBase & { newScheduledFor: string; shiftDays?: never })
  | (AuditBulkRescheduleBase & { shiftDays: number; newScheduledFor?: never });

/** docs/openapi.yaml TierBandInput. */
export interface TierBandInput {
  code: TierBandCode;
  /** 1-60 characters. */
  label?: string;
  minScore: number;
  maxScore: number | null;
}

/** docs/openapi.yaml TierBandsRequest: all four tiers, ascending, contiguous, 0-100 (BR-111). */
export interface TierBandsBody {
  tiers: TierBandInput[];
}

/** Every documented query of GET /admin/audits. */
export interface ListAuditsParams {
  farmerId?: string | undefined;
  zoneId?: string | undefined;
  /** Sent comma-separated, e.g. SCHEDULED,IN_PROGRESS. */
  status?: readonly AuditStatus[] | undefined;
  type?: AuditType | undefined;
  fiscalYear?: string | undefined;
  quarter?: number | undefined;
  scheduledFrom?: string | undefined;
  scheduledTo?: string | undefined;
  redFlagged?: boolean | undefined;
  /** SCHEDULED/IN_PROGRESS with scheduledFor in the past. */
  overdue?: boolean | undefined;
  /** At least one unresolved MAJOR finding. */
  hasOpenMajorFindings?: boolean | undefined;
  sort?: AuditSort | undefined;
  cursor?: string | undefined;
  /** Server default 20, max 100. */
  limit?: number | undefined;
}

/** Every documented query of GET /admin/audits/compliance. */
export interface AuditComplianceParams {
  /** Default: the current fiscal year. */
  fiscalYear?: string | undefined;
  zoneId?: string | undefined;
  /** Filters the farmers page only; counts always cover the whole population. */
  complianceStatus?: AuditComplianceStatus | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

/**
 * Problem codes these endpoints document beyond the generic ones:
 * AUDIT_QUARTER_TAKEN (409, BR-03a), INVALID_STATE_TRANSITION (409),
 * SCORE_OUT_OF_RANGE (422, BR-06a), AUDIT_INCOMPLETE (422 on complete, missing
 * category codes in errors[], BR-06).
 */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'BAD_REQUEST',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'VALIDATION_FAILED',
  'INTERNAL',
  'AUDIT_QUARTER_TAKEN',
  'INVALID_STATE_TRANSITION',
  'SCORE_OUT_OF_RANGE',
  'AUDIT_INCOMPLETE',
];

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

const BASE = '/admin/audits';

function auditPath(auditId: string): string {
  return `${BASE}/${encodeURIComponent(auditId)}`;
}

/** Cursor-paged audits; rows outside the caller's zone(s) are absent, never 403. */
export function listAudits(params: ListAuditsParams = {}, signal?: AbortSignal): Promise<Page<AuditSummaryDto>> {
  const status = params.status !== undefined && params.status.length > 0 ? params.status.join(',') : undefined;
  return adminGet<Page<AuditSummaryDto>>(
    BASE,
    {
      farmerId: params.farmerId,
      zoneId: params.zoneId,
      status,
      type: params.type,
      fiscalYear: params.fiscalYear,
      quarter: params.quarter,
      scheduledFrom: params.scheduledFrom,
      scheduledTo: params.scheduledTo,
      redFlagged: params.redFlagged,
      overdue: params.overdue,
      hasOpenMajorFindings: params.hasOpenMajorFindings,
      sort: params.sort,
      cursor: params.cursor,
      limit: params.limit,
    },
    signal,
  );
}

/** Schedule an audit (201, the new AuditDetail). 409 AUDIT_QUARTER_TAKEN when the quarter has a live audit (BR-03a). */
export function createAudit(body: AuditCreateBody, signal?: AbortSignal): Promise<AuditDetailDto> {
  return adminPost<AuditDetailDto>(BASE, body, { signal });
}

/** Fiscal-year compliance counts plus one cursor page of farmers (BR-03b). */
export function getAuditCompliance(params: AuditComplianceParams = {}, signal?: AbortSignal): Promise<AuditComplianceSummaryDto> {
  return adminGet<AuditComplianceSummaryDto>(
    `${BASE}/compliance`,
    {
      fiscalYear: params.fiscalYear,
      zoneId: params.zoneId,
      complianceStatus: params.complianceStatus,
      cursor: params.cursor,
      limit: params.limit,
    },
    signal,
  );
}

/** Reschedule several audits; always 200 with a per-item outcome (the batch may partially succeed). */
export function bulkRescheduleAudits(body: AuditBulkRescheduleBody, signal?: AbortSignal): Promise<AuditBulkRescheduleResultDto> {
  return adminPost<AuditBulkRescheduleResultDto>(`${BASE}/bulk-reschedule`, body, { signal });
}

/** One audit with its 10 category scores and findings; 404 outside the caller's scope. */
export function getAudit(auditId: string, signal?: AbortSignal): Promise<AuditDetailDto> {
  return adminGet<AuditDetailDto>(auditPath(auditId), undefined, signal);
}

/** Reschedule / reassign a SCHEDULED audit. auditType cannot change. */
export function updateAudit(auditId: string, body: AuditUpdateBody, signal?: AbortSignal): Promise<AuditDetailDto> {
  return adminPatch<AuditDetailDto>(auditPath(auditId), body, { signal });
}

/** SCHEDULED or IN_PROGRESS -> CANCELLED; frees the quarter (BR-03a). */
export function cancelAudit(auditId: string, body: AuditReasonBody, signal?: AbortSignal): Promise<AuditDetailDto> {
  return adminPost<AuditDetailDto>(`${auditPath(auditId)}/cancel`, body, { signal });
}

/** SCHEDULED -> IN_PROGRESS. The body is optional; an empty object is sent when there is no auditor to assign. */
export function startAudit(auditId: string, body: AuditStartBody = {}, signal?: AbortSignal): Promise<AuditDetailDto> {
  return adminPost<AuditDetailDto>(`${auditPath(auditId)}/start`, body, { signal });
}

/** Upsert 1-10 category scores while IN_PROGRESS (BR-06). */
export function setAuditScores(auditId: string, body: AuditScoresBody, signal?: AbortSignal): Promise<AuditDetailDto> {
  return adminPut<AuditDetailDto>(`${auditPath(auditId)}/scores`, body, { signal });
}

/** Log a finding while IN_PROGRESS (201, the finding). Never red-flags (BR-05b). */
export function createAuditFinding(auditId: string, body: AuditFindingCreateBody, signal?: AbortSignal): Promise<AuditFindingDto> {
  return adminPost<AuditFindingDto>(`${auditPath(auditId)}/findings`, body, { signal });
}

/** Edit (IN_PROGRESS) or resolve (IN_PROGRESS or COMPLETED) a finding. */
export function updateAuditFinding(
  auditId: string,
  findingId: string,
  body: AuditFindingUpdateBody,
  signal?: AbortSignal,
): Promise<AuditFindingDto> {
  return adminPatch<AuditFindingDto>(`${auditPath(auditId)}/findings/${encodeURIComponent(findingId)}`, body, { signal });
}

/** IN_PROGRESS -> COMPLETED; 422 AUDIT_INCOMPLETE unless all 10 categories are scored (BR-06). */
export function completeAudit(auditId: string, body: AuditCompleteBody = {}, signal?: AbortSignal): Promise<AuditDetailDto> {
  return adminPost<AuditDetailDto>(`${auditPath(auditId)}/complete`, body, { signal });
}

/** Red-flag a COMPLETED audit: the only way redFlagged becomes true (BR-05b). */
export function redFlagAudit(auditId: string, body: AuditReasonBody, signal?: AbortSignal): Promise<AuditDetailDto> {
  return adminPost<AuditDetailDto>(`${auditPath(auditId)}/red-flag`, body, { signal });
}

/** Clear the red flag (BR-05b); 409 when the audit is not flagged. */
export function clearAuditRedFlag(auditId: string, body: AuditClearRedFlagBody = {}, signal?: AbortSignal): Promise<AuditDetailDto> {
  return adminPost<AuditDetailDto>(`${auditPath(auditId)}/clear-red-flag`, body, { signal });
}

/**
 * The tier generation now in effect: four contiguous bands covering 0-100, in
 * POOR, MODERATE, GOOD, EXCELLENT order (BR-147a). Read-only, nothing audited.
 */
export function getAuditTierThresholds(signal?: AbortSignal): Promise<TierBandsGenerationDto> {
  return adminGet<TierBandsGenerationDto>('/admin/audit-tier-thresholds', undefined, signal);
}

/** Replace the tier bands (one scale shared with farm ratings, BR-04/BR-111). Identical bands are a 200 no-op. */
export function updateAuditTierThresholds(body: TierBandsBody, signal?: AbortSignal): Promise<TierBandsGenerationDto> {
  return adminPatch<TierBandsGenerationDto>('/admin/audit-tier-thresholds', body, { signal });
}

/**
 * The report as a short-lived signed URL the OS can open (see the module
 * docblock). 409 INVALID_STATE_TRANSITION before COMPLETED for `generated`,
 * 404 for `agency` with no upload, 404 outside the scope. A 401 gets one
 * silent refresh and retry, as request() does; a transport failure or the
 * timeout is a NetworkError.
 */
export async function getAuditReportUrl(auditId: string, variant: AuditReportVariant = 'generated'): Promise<string> {
  const requestUrl = resolveUrl(`${auditPath(auditId)}/report?variant=${variant}&redirect=true`);

  const attempt = async (): Promise<Response> => {
    const headers: Record<string, string> = { Accept: 'application/pdf, application/problem+json' };
    const token = getAccessToken();
    if (token !== null) headers['Authorization'] = `Bearer ${token}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ADMIN_REQUEST_TIMEOUT_MS);
    try {
      return await fetch(requestUrl, { method: 'GET', headers, signal: controller.signal });
    } catch (error) {
      throw new NetworkError(error);
    } finally {
      clearTimeout(timer);
    }
  };

  let response = await attempt();
  if (response.status === 401) {
    const refreshed = await refreshAuthTokens();
    if (refreshed !== null) response = await attempt();
  }

  if (!response.ok) throw new ApiError(await readProblem(response));

  const finalUrl = response.url;
  // Only where the redirect landed matters; the file bytes are not read.
  void response.body?.cancel().catch(() => undefined);

  if (!finalUrl || finalUrl === requestUrl) {
    // The server streamed the file instead of redirecting. The app has no
    // viewer for raw bytes, so this is a failure the screen shows, never a
    // link that would open without the token.
    throw new ApiError({ type: 'about:blank', title: 'Report link unavailable', status: response.status, code: 'INTERNAL' });
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
    // Not problem+json: fall through to a generic problem for the status.
  }
  return {
    type: 'about:blank',
    title: 'Request failed',
    status: response.status,
    code: response.status === 404 ? 'NOT_FOUND' : 'INTERNAL',
  };
}
