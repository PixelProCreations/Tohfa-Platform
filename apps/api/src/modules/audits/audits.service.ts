/**
 * Audit Management service — all business logic for the quarterly farm audit.
 *
 * Contract: docs/openapi.yaml (tag Audits), db/migrations/0027_audits.sql,
 * docs/rules.md BR-03 / BR-04 / BR-05 / BR-06 / BR-36.
 *
 * STATE MACHINE (409 INVALID_STATE_TRANSITION on anything else):
 *   SCHEDULED --start--> IN_PROGRESS --complete--> COMPLETED
 *   SCHEDULED | IN_PROGRESS --cancel--> CANCELLED
 *   SCHEDULED: PATCH / bulk reschedule.  IN_PROGRESS: scores, findings.
 *   COMPLETED: only red-flag / clear-red-flag and finding resolution.
 *
 * ONE AUTOMATIC EFFECT: THE FARM RATING (product decision 2026-10-01, BR-06c).
 * Completing an INTERNAL audit creates a new COMPLETE farm rating from the
 * audit's 10 category scores, through farm-ratings.service.ts
 * recordAuditRating, in the SAME transaction as the COMPLETED transition — if
 * the rating cannot be written, the audit is not completed (BR-06g). EXTERNAL
 * audits create no rating (BR-06d). Nothing else is derived (BR-05b, BR-38):
 * no certification, payout, market block or red flag change, and red-flag,
 * cancel and reschedule never touch the rating. The audits repo itself has no
 * method that writes outside the audit tables.
 *
 * VISIBILITY. Admin reads filter on the farmer's current zone via
 * scopedWhere(scope, { zoneColumn: 'f.zone_id' }); that fragment is FALSE for a
 * farmer (own scope, no zone), so a farmer calling an admin endpoint sees an
 * empty list / 404 rather than the admin shape with its red-flag fields.
 * Farmer endpoints pin `a.farmer_id` to the caller's own farmer id (BR-36).
 * Cross-scope reads are 404 / empty, never 403.
 */
import crypto from 'node:crypto';
import { writeAuditLog } from '../../audit/auditLog.js';
import { config } from '../../config.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { assertPredicate, scopedWhere, type ResolvedScope } from '../../rbac/requirePermission.js';
import { defaultBlobStorage, type BlobStorage } from '../../storage/blobStorage.js';
import { farmRatingsRepo } from '../farm-ratings/farm-ratings.repo.js';
import { farmRatingsService, type AuditRatingInput } from '../farm-ratings/farm-ratings.service.js';
import { UploadPurpose } from '../uploads/uploads.schema.js';
import {
  auditsRepo,
  type AuditAccess,
  type AuditCursor,
  type AuditRow,
  type AuditsRepo,
  type CategoryScoreRow,
  type ComplianceFarmerCursor,
  type CompletedCountFilter,
  type FindingPatch,
  type FindingRow,
  type SchedulePatch,
} from './audits.repo.js';
import {
  auditTiers,
  bulkRescheduleFailureCodes,
  type Audit,
  type AuditBulkRescheduleBody,
  type AuditBulkRescheduleResult,
  type AuditCancelBody,
  type AuditCategoryScore,
  type AuditClearRedFlagBody,
  type AuditComplianceSummary,
  type AuditCompleteBody,
  type AuditCreateBody,
  type AuditDetail,
  type AuditFinding,
  type AuditFindingCreateBody,
  type AuditFindingUpdateBody,
  type AuditRedFlagBody,
  type AuditScoresBody,
  type AuditStartBody,
  type AuditStatus,
  type AuditSummary,
  type AuditTier,
  type AuditUpdateBody,
  type BulkRescheduleFailureCode,
  type ComplianceQuery,
  type ComplianceStatus,
  type FarmerAuditDetail,
  type FarmerAuditFinding,
  type FarmerAuditSummary,
  type ListAuditsQuery,
  type ListMyAuditsQuery,
  type Paged,
  type RatingCategoryCode,
  type ReportQuery,
  type ReportVariant,
} from './audits.schema.js';
import { renderAuditReportPdf, type AuditReportPdfInput } from './pdf/audit-report-pdf.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;
export type ReportAudience = 'admin' | 'farmer';

export interface ReportFile {
  kind: 'file';
  contentType: string;
  fileName: string;
  body: Buffer;
}
export type ReportResult = ReportFile | { kind: 'redirect'; url: string };

export interface AuditsServiceDeps {
  repo?: AuditsRepo;
  runTx?: TransactionRunner;
  db?: Executor;
  /** BR-04a: tier bands come from rating_tier_config via the farm-ratings lookup. */
  resolveTier?: (tx: Executor, score: number) => Promise<string | null>;
  writeAudit?: typeof writeAuditLog;
  /** BR-06c: turns a completed INTERNAL audit into a farm rating, on the caller's transaction. */
  recordRating?: (tx: Executor, input: AuditRatingInput) => Promise<unknown>;
  storage?: Pick<BlobStorage, 'download'>;
  renderPdf?: (input: AuditReportPdfInput) => Promise<Buffer>;
  now?: () => Date;
  signingSecret?: string;
}

export interface AuditsService {
  list(scope: ResolvedScope, query: ListAuditsQuery): Promise<Paged<AuditSummary>>;
  schedule(scope: ResolvedScope, body: AuditCreateBody): Promise<AuditDetail>;
  compliance(scope: ResolvedScope, query: ComplianceQuery): Promise<AuditComplianceSummary>;
  bulkReschedule(scope: ResolvedScope, body: AuditBulkRescheduleBody): Promise<AuditBulkRescheduleResult>;
  get(scope: ResolvedScope, id: string): Promise<AuditDetail>;
  update(scope: ResolvedScope, id: string, body: AuditUpdateBody): Promise<AuditDetail>;
  cancel(scope: ResolvedScope, id: string, body: AuditCancelBody): Promise<AuditDetail>;
  start(scope: ResolvedScope, id: string, body: AuditStartBody): Promise<AuditDetail>;
  setScores(scope: ResolvedScope, id: string, body: AuditScoresBody): Promise<AuditDetail>;
  createFinding(scope: ResolvedScope, id: string, body: AuditFindingCreateBody): Promise<AuditFinding>;
  updateFinding(
    scope: ResolvedScope,
    id: string,
    findingId: string,
    body: AuditFindingUpdateBody,
  ): Promise<AuditFinding>;
  complete(scope: ResolvedScope, id: string, body: AuditCompleteBody): Promise<AuditDetail>;
  redFlag(scope: ResolvedScope, id: string, body: AuditRedFlagBody): Promise<AuditDetail>;
  clearRedFlag(scope: ResolvedScope, id: string, body: AuditClearRedFlagBody): Promise<AuditDetail>;
  getReport(scope: ResolvedScope, id: string, query: ReportQuery): Promise<ReportResult>;
  listMine(scope: ResolvedScope, query: ListMyAuditsQuery): Promise<Paged<FarmerAuditSummary>>;
  getMine(scope: ResolvedScope, id: string): Promise<FarmerAuditDetail>;
  getMyReport(scope: ResolvedScope, id: string, query: ReportQuery): Promise<ReportResult>;
  getSignedReport(audience: ReportAudience, id: string, query: ReportQuery): Promise<ReportFile>;
}

// ---------------------------------------------------------------------------
// Fiscal period (BR-03). Indian fiscal year April-March, label '2026-27',
// Q1 Apr-Jun ... Q4 Jan-Mar, always computed in Asia/Kolkata — NOT the
// server's local zone (invoices.service.ts's calculateCurrentFiscalYear uses
// local time; a server in UTC would put 1 Apr 00:30 IST in the old year).
// ---------------------------------------------------------------------------

const INDIA_TIME_ZONE = 'Asia/Kolkata';
/** IST has had a fixed +05:30 offset and no DST since 1945. */
const INDIA_UTC_OFFSET = '+05:30';

/**
 * BR-03 (LOCKED): one audit per fiscal quarter, so a fiscal year holds four.
 * This is the number of quarters, not a tunable business threshold — the
 * one-per-quarter half is enforced by uq_audits_farmer_fy_quarter
 * (docs/rules.md BR-03 implementation notes).
 */
const QUARTERS_PER_FISCAL_YEAR = 4;

/** docs/openapi.yaml: the signed report URL is "valid for 5 minutes", as for invoices. */
const SIGNED_LINK_TTL_MS = 5 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_CATEGORY_SCORE = 10;
const MAX_TOTAL_SCORE = 100;

/** Key prefix the uploads module issues for purpose AUDIT_REPORT (`<purpose lowercased>/<uuid><ext>`). */
const AUDIT_REPORT_KEY_PREFIX = `${UploadPurpose.AUDIT_REPORT.toLowerCase()}/`;

const QUARTER_END: Record<number, { month: string; day: string; nextYear: boolean }> = {
  1: { month: '06', day: '30', nextYear: false },
  2: { month: '09', day: '30', nextYear: false },
  3: { month: '12', day: '31', nextYear: false },
  4: { month: '03', day: '31', nextYear: true },
};

export function fiscalPeriodOf(instant: Date): { fiscalYear: string; quarter: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: INDIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(instant);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const startYear = month >= 4 ? year : year - 1;
  const quarter = month >= 4 ? Math.floor((month - 4) / 3) + 1 : 4;
  return { fiscalYear: fiscalYearLabel(startYear), quarter };
}

function fiscalYearLabel(startYear: number): string {
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}

/** '2026-27' -> 2026. Throws 422 for a label whose halves do not follow on. */
function fiscalYearStart(fiscalYear: string): number {
  const startYear = Number(fiscalYear.slice(0, 4));
  if (!/^\d{4}-\d{2}$/.test(fiscalYear) || fiscalYearLabel(startYear) !== fiscalYear) {
    throw new AppError('VALIDATION_FAILED', {
      detail: `"${fiscalYear}" is not a fiscal year label (expected e.g. 2026-27).`,
      errors: { 'query.fiscalYear': ['must be consecutive years, e.g. 2026-27'] },
    });
  }
  return startYear;
}

/** True from 1 April 00:00 IST of the year after the fiscal year starts. */
export function isFiscalYearClosed(fiscalYear: string, now: Date): boolean {
  const closesAt = new Date(`${fiscalYearStart(fiscalYear) + 1}-04-01T00:00:00${INDIA_UTC_OFFSET}`);
  return now.getTime() >= closesAt.getTime();
}

function quarterEndsOn(fiscalYear: string, quarter: number): string {
  const end = QUARTER_END[quarter]!;
  const year = fiscalYearStart(fiscalYear) + (end.nextYear ? 1 : 0);
  return `${year}-${end.month}-${end.day}`;
}

/**
 * BR-03b. Four COMPLETED audits is compliant at any time. Short of four is
 * PENDING while the fiscal year is still open and NON_COMPLIANT once it has
 * closed — never silently passed (orchestrator decision 2026-10-01).
 */
export function complianceStatusFor(completedCount: number, fiscalYearClosed: boolean): ComplianceStatus {
  if (completedCount >= QUARTERS_PER_FISCAL_YEAR) return 'COMPLIANT';
  return fiscalYearClosed ? 'NON_COMPLIANT' : 'PENDING';
}

/** The completedCount filter that implements a complianceStatus filter. */
function completedFilterFor(status: ComplianceStatus | undefined, closed: boolean): CompletedCountFilter {
  switch (status) {
    case undefined:
      return { kind: 'all' };
    case 'COMPLIANT':
      return { kind: 'atLeast', value: QUARTERS_PER_FISCAL_YEAR };
    case 'PENDING':
      return closed ? { kind: 'none' } : { kind: 'below', value: QUARTERS_PER_FISCAL_YEAR };
    case 'NON_COMPLIANT':
      return closed ? { kind: 'below', value: QUARTERS_PER_FISCAL_YEAR } : { kind: 'none' };
  }
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const iso = (date: Date | null): string | null => (date === null ? null : date.toISOString());

function notFound(id: string): AppError {
  // 404 for "missing" and "outside your scope" alike: a 403 would confirm
  // that the row exists (root CLAUDE.md §2.1).
  return new AppError('NOT_FOUND', { detail: `No audit with id "${id}" is visible to you.` });
}

function invalidState(status: AuditStatus, action: string): AppError {
  return new AppError('INVALID_STATE_TRANSITION', {
    detail: `Cannot ${action} an audit that is ${status}.`,
    meta: { status, action },
  });
}

function fieldError(field: string, message: string): AppError {
  return new AppError('VALIDATION_FAILED', { detail: message, errors: { [field]: [message] } });
}

function isQuarterTakenError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const pgError = error as { code?: unknown; constraint?: unknown };
  return pgError.code === '23505' && pgError.constraint === 'uq_audits_farmer_fy_quarter';
}

/** BR-03a: the database's partial unique index is the arbiter; map its violation. */
function quarterTaken(fiscalYear: string, quarter: number): AppError {
  return new AppError('AUDIT_QUARTER_TAKEN', {
    detail: `This farmer already has an audit in ${fiscalYear} Q${quarter}.`,
    meta: { fiscalYear, quarter },
  });
}

function asTier(code: string | null): AuditTier | null {
  return code !== null && (auditTiers as readonly string[]).includes(code) ? (code as AuditTier) : null;
}

function encodeCursor(values: string[]): string {
  return Buffer.from(JSON.stringify(values), 'utf8').toString('base64url');
}

function decodeCursor(raw: string | undefined, validate: (values: unknown[]) => boolean): unknown[] | undefined {
  if (raw === undefined || raw.length === 0) return undefined;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (Array.isArray(parsed) && validate(parsed)) return parsed;
  } catch {
    // fall through
  }
  throw new AppError('BAD_REQUEST', { detail: 'cursor is not valid; pass back page.nextCursor unchanged.' });
}

const UUID_RE = /^[0-9a-f-]{36}$/i;

function decodeAuditCursor(raw: string | undefined): AuditCursor | undefined {
  const values = decodeCursor(
    raw,
    (v) => v.length === 2 && typeof v[0] === 'string' && !Number.isNaN(Date.parse(v[0])) && typeof v[1] === 'string' && UUID_RE.test(v[1]),
  );
  return values === undefined ? undefined : { scheduledFor: values[0] as string, id: values[1] as string };
}

function decodeFarmerCursor(raw: string | undefined): ComplianceFarmerCursor | undefined {
  const values = decodeCursor(
    raw,
    (v) => v.length === 2 && typeof v[0] === 'string' && typeof v[1] === 'string' && UUID_RE.test(v[1]),
  );
  return values === undefined ? undefined : { tohfaFarmerId: values[0] as string, id: values[1] as string };
}

/** Admin visibility: the farmer's current zone for a Farmer Admin; FALSE for a farmer. */
function adminAccess(scope: ResolvedScope): AuditAccess {
  return { scope: scopedWhere(scope, { zoneColumn: 'f.zone_id' }) };
}

/** Farmer visibility (BR-36): own rows only; null when the caller has no farmer profile. */
function farmerAccess(scope: ResolvedScope): AuditAccess | null {
  if (scope.farmerId === undefined) return null;
  return { scope: scopedWhere(scope, { farmerColumn: 'a.farmer_id' }), farmerId: scope.farmerId };
}

/** Token-authorised downloads were scope-checked when the token was minted. */
const SIGNED_LINK_ACCESS: AuditAccess = { scope: { sql: 'TRUE', params: [], nextIndex: 1 } };

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export function createAuditsService(deps: AuditsServiceDeps = {}): AuditsService {
  const repo = deps.repo ?? auditsRepo;
  const runTx: TransactionRunner = deps.runTx ?? withTransaction;
  const db = deps.db ?? pool;
  const resolveTier = deps.resolveTier ?? ((tx: Executor, score: number) => farmRatingsRepo.resolveTierForScore(tx, score));
  const writeAudit = deps.writeAudit ?? writeAuditLog;
  const recordRating =
    deps.recordRating ?? ((tx: Executor, input: AuditRatingInput) => farmRatingsService.recordAuditRating(tx, input));
  const storage = deps.storage ?? defaultBlobStorage;
  const renderPdf = deps.renderPdf ?? renderAuditReportPdf;
  const now = deps.now ?? ((): Date => new Date());
  const signingSecret = deps.signingSecret ?? config.JWT_SECRET;

  /** One tier lookup per distinct score per call (lists repeat scores). */
  function tierResolver(tx: Executor): (row: AuditRow) => Promise<AuditTier | null> {
    const cache = new Map<number, Promise<string | null>>();
    return async (row) => {
      if (row.status !== 'COMPLETED' || row.totalScore === null) return null;
      let pending = cache.get(row.totalScore);
      if (pending === undefined) {
        pending = resolveTier(tx, row.totalScore);
        cache.set(row.totalScore, pending);
      }
      return asTier(await pending);
    };
  }

  function toSummary(row: AuditRow, tier: AuditTier | null): AuditSummary {
    return {
      id: row.id,
      farmerId: row.farmerId,
      tohfaFarmerId: row.tohfaFarmerId,
      farmerName: row.farmerName,
      farmId: row.farmId,
      farmName: row.farmName,
      zoneId: row.zoneId,
      zoneName: row.zoneName,
      fiscalYear: row.fiscalYear,
      quarter: row.quarter,
      auditType: row.auditType,
      status: row.status,
      scheduledFor: row.scheduledFor.toISOString(),
      startedAt: iso(row.startedAt),
      completedAt: iso(row.completedAt),
      auditorUserId: row.auditorUserId,
      auditorName: row.auditorName,
      externalAgencyName: row.externalAgencyName,
      totalScore: row.totalScore,
      maxScore: MAX_TOTAL_SCORE,
      tier,
      majorViolationsCount: row.majorViolationsCount,
      findingCounts: { ...row.findingCounts },
      redFlagged: row.redFlagged,
    };
  }

  function toAudit(row: AuditRow, tier: AuditTier | null): Audit {
    return {
      ...toSummary(row, tier),
      summary: row.summary,
      reportUpload:
        row.reportUpload === null
          ? null
          : { uploadId: row.reportUpload.uploadId, mimeType: row.reportUpload.mimeType, sizeBytes: row.reportUpload.sizeBytes },
      redFlagReason: row.redFlagReason,
      redFlaggedAt: iso(row.redFlaggedAt),
      redFlaggedByName: row.redFlaggedByName,
      cancelledReason: row.cancelledReason,
      cancelledAt: iso(row.cancelledAt),
      createdByName: row.createdByName,
      createdAt: row.createdAt.toISOString(),
      updatedAt: iso(row.updatedAt),
    };
  }

  function toFinding(finding: FindingRow): AuditFinding {
    return {
      id: finding.id,
      auditId: finding.auditId,
      severity: finding.severity,
      categoryCode: finding.categoryCode as RatingCategoryCode | null,
      description: finding.description,
      correctiveAction: finding.correctiveAction,
      dueDate: finding.dueDate,
      resolvedAt: iso(finding.resolvedAt),
      resolvedByName: finding.resolvedByName,
      resolutionNote: finding.resolutionNote,
      createdAt: finding.createdAt.toISOString(),
    };
  }

  /** Allow-list: built key by key, never by spreading the admin shape (BR-36). */
  function toFarmerFinding(finding: FindingRow): FarmerAuditFinding {
    return {
      id: finding.id,
      auditId: finding.auditId,
      severity: finding.severity,
      categoryCode: finding.categoryCode as RatingCategoryCode | null,
      description: finding.description,
      correctiveAction: finding.correctiveAction,
      dueDate: finding.dueDate,
      resolvedAt: iso(finding.resolvedAt),
      resolutionNote: finding.resolutionNote,
      createdAt: finding.createdAt.toISOString(),
    };
  }

  async function categorySheet(
    tx: Executor,
    auditId: string,
  ): Promise<{ sheet: AuditCategoryScore[]; scores: CategoryScoreRow[] }> {
    const categories = await repo.findActiveCategories(tx);
    const scores = await repo.findCategoryScores(tx, auditId);
    const byCategory = new Map(scores.map((score) => [score.categoryId, score] as const));
    const sheet = categories.map((category) => {
      const scored = byCategory.get(category.id);
      return {
        categoryCode: category.code as RatingCategoryCode,
        // A missing row is "not yet scored" — null, never zero (BR-06).
        score: scored?.score ?? null,
        maxScore: MAX_CATEGORY_SCORE as 10,
        remarks: scored?.remarks ?? null,
      };
    });
    return { sheet, scores };
  }

  async function assembleDetail(tx: Executor, row: AuditRow): Promise<AuditDetail> {
    const tier = await tierResolver(tx)(row);
    const { sheet } = await categorySheet(tx, row.id);
    const findings = await repo.findFindings(tx, row.id);
    return { ...toAudit(row, tier), categoryScores: sheet, findings: findings.map(toFinding) };
  }

  /** Farmer allow-list summary. Results stay hidden until COMPLETED. */
  function toFarmerSummary(row: AuditRow, tier: AuditTier | null): FarmerAuditSummary {
    const done = row.status === 'COMPLETED';
    return {
      id: row.id,
      farmId: row.farmId,
      farmName: row.farmName,
      fiscalYear: row.fiscalYear,
      quarter: row.quarter,
      auditType: row.auditType,
      status: row.status,
      scheduledFor: row.scheduledFor.toISOString(),
      startedAt: iso(row.startedAt),
      completedAt: iso(row.completedAt),
      auditorName: row.auditorName,
      externalAgencyName: row.externalAgencyName,
      totalScore: done ? row.totalScore : null,
      maxScore: MAX_TOTAL_SCORE,
      tier: done ? tier : null,
      majorViolationsCount: done ? row.majorViolationsCount : 0,
      findingCounts: done ? { ...row.findingCounts } : { major: 0, minor: 0, observation: 0, openMajor: 0 },
    };
  }

  async function assembleFarmerDetail(tx: Executor, row: AuditRow): Promise<FarmerAuditDetail> {
    const done = row.status === 'COMPLETED';
    const tier = await tierResolver(tx)(row);
    const { sheet } = await categorySheet(tx, row.id);
    const findings = done ? await repo.findFindings(tx, row.id) : [];
    return {
      ...toFarmerSummary(row, tier),
      summary: done ? row.summary : null,
      hasAgencyReport: done && row.reportUpload !== null,
      cancelledReason: row.cancelledReason,
      // A farmer never sees a half-entered score sheet.
      categoryScores: done ? sheet : sheet.map((entry) => ({ ...entry, score: null, remarks: null })),
      findings: findings.map(toFarmerFinding),
    };
  }

  async function log(
    tx: Executor,
    scope: ResolvedScope,
    entry: { actionCode: string; entityType: 'audit' | 'audit_finding'; entityId: string; before?: unknown; after?: unknown },
  ): Promise<void> {
    await writeAudit(tx, {
      actorId: scope.userId,
      actorRole: scope.roleCode,
      actionCode: entry.actionCode,
      entityType: entry.entityType,
      entityId: entry.entityId,
      ...(entry.before === undefined ? {} : { before: entry.before }),
      ...(entry.after === undefined ? {} : { after: entry.after }),
    });
  }

  /** Load + row-lock an audit inside a transaction; 404 when not visible. */
  async function lockAudit(tx: Executor, scope: ResolvedScope, id: string): Promise<AuditRow> {
    const row = await repo.findAudit(tx, id, adminAccess(scope), { forUpdate: true });
    if (row === null) throw notFound(id);
    return row;
  }

  async function reload(tx: Executor, scope: ResolvedScope, id: string): Promise<AuditRow> {
    const row = await repo.findAudit(tx, id, adminAccess(scope));
    if (row === null) throw notFound(id);
    return row;
  }

  /**
   * audit.conduct is `conditional` (SUPPORT_ONLY) for a Farmer Admin. Load the
   * target through the zone-scoped view first (out of zone -> 404), then
   * evaluate the predicate (in zone -> 403), before any transaction opens.
   */
  async function assertCanConduct(scope: ResolvedScope, id: string): Promise<void> {
    const row = await repo.findAudit(db, id, adminAccess(scope));
    if (row === null) throw notFound(id);
    assertPredicate(scope, { zoneId: row.farmerZoneId ?? undefined });
  }

  async function assertAuditor(tx: Executor, userId: string): Promise<void> {
    if (!(await repo.userExists(tx, userId))) {
      throw fieldError('body.auditorUserId', `No active user with id "${userId}".`);
    }
  }

  async function resolveReportUpload(tx: Executor, scope: ResolvedScope, storageKey: string): Promise<string> {
    // Attached by storage key, exactly like farm-diary photos: the key must be
    // one the uploads module issued for purpose AUDIT_REPORT, to this admin.
    const upload = storageKey.startsWith(AUDIT_REPORT_KEY_PREFIX)
      ? await repo.findUploadByStorageKey(tx, storageKey)
      : null;
    if (upload === null || upload.uploadedBy !== scope.userId) {
      throw fieldError(
        'body.reportStorageKey',
        'reportStorageKey must be a storageKey you received from POST /uploads/sign with purpose AUDIT_REPORT.',
      );
    }
    return upload.id;
  }

  async function categoryIdsByCode(tx: Executor): Promise<Map<string, string>> {
    const categories = await repo.findActiveCategories(tx);
    return new Map(categories.map((category) => [category.code, category.id] as const));
  }

  function categoryIdFor(map: Map<string, string>, code: string, field: string): string {
    const id = map.get(code);
    if (id === undefined) throw fieldError(field, `"${code}" is not an active rating category.`);
    return id;
  }

  // ----- reports ----------------------------------------------------------

  function sign(audience: ReportAudience, id: string, variant: ReportVariant, expires: number): string {
    return crypto
      .createHmac('sha256', signingSecret)
      .update(`audit-report:${audience}:${id}:${variant}:${expires}`)
      .digest('hex');
  }

  function signedUrl(audience: ReportAudience, id: string, variant: ReportVariant): string {
    const expires = now().getTime() + SIGNED_LINK_TTL_MS;
    const base = audience === 'admin' ? `/v1/admin/audits/${id}/report` : `/v1/farmers/me/audits/${id}/report`;
    const params = new URLSearchParams({ variant, token: sign(audience, id, variant, expires), expires: String(expires) });
    return `${base}?${params.toString()}`;
  }

  async function renderReportFile(row: AuditRow, variant: ReportVariant): Promise<ReportFile> {
    if (variant === 'agency') {
      const upload = row.reportUpload;
      if (upload === null) {
        throw new AppError('NOT_FOUND', { detail: 'No agency report has been attached to this audit.' });
      }
      const body = await storage.download(upload.storageKey);
      if (body === null) {
        throw new AppError('NOT_FOUND', { detail: 'The attached agency report file is not available.' });
      }
      const extension = upload.storageKey.includes('.') ? upload.storageKey.slice(upload.storageKey.lastIndexOf('.')) : '';
      return { kind: 'file', contentType: upload.mimeType, fileName: `audit-${row.id}-agency-report${extension}`, body };
    }

    if (row.status !== 'COMPLETED') throw invalidState(row.status, 'generate the report of');
    const detail = await assembleDetail(db, row);
    const context = await repo.findReportContext(db, row.id);
    const location = [context.farmVillage, context.farmTaluk, context.farmDistrict].filter(
      (part): part is string => part !== null && part.length > 0,
    );
    const categoryName = (code: string | null): string | null =>
      code === null ? null : (context.categoryNames[code] ?? code);
    const body = await renderPdf({
      auditId: row.id,
      farmerName: row.farmerName,
      tohfaFarmerId: row.tohfaFarmerId,
      farmName: row.farmName,
      farmLocation: location.length === 0 ? null : location.join(', '),
      zoneName: row.zoneName,
      fiscalYear: row.fiscalYear,
      quarter: row.quarter,
      auditType: row.auditType,
      auditorName: row.auditorName,
      externalAgencyName: row.externalAgencyName,
      scheduledFor: detail.scheduledFor,
      startedAt: detail.startedAt,
      completedAt: detail.completedAt,
      totalScore: detail.totalScore,
      maxScore: MAX_TOTAL_SCORE,
      tier: detail.tier,
      majorViolationsCount: detail.majorViolationsCount,
      summary: detail.summary,
      categories: detail.categoryScores.map((entry) => ({
        code: entry.categoryCode,
        name: categoryName(entry.categoryCode) ?? entry.categoryCode,
        score: entry.score,
        maxScore: entry.maxScore,
        remarks: entry.remarks,
      })),
      findings: detail.findings.map((finding) => ({
        severity: finding.severity,
        categoryName: categoryName(finding.categoryCode),
        description: finding.description,
        correctiveAction: finding.correctiveAction,
        dueDate: finding.dueDate,
        resolvedAt: finding.resolvedAt,
        resolutionNote: finding.resolutionNote,
      })),
      generatedAt: now().toISOString(),
    });
    return { kind: 'file', contentType: 'application/pdf', fileName: `audit-report-${row.id}.pdf`, body };
  }

  async function produceReport(audience: ReportAudience, row: AuditRow, query: ReportQuery): Promise<ReportResult> {
    if (query.variant === 'generated' && row.status !== 'COMPLETED') {
      throw invalidState(row.status, 'generate the report of');
    }
    if (query.variant === 'agency' && row.reportUpload === null) {
      throw new AppError('NOT_FOUND', { detail: 'No agency report has been attached to this audit.' });
    }
    if (query.redirect) return { kind: 'redirect', url: signedUrl(audience, row.id, query.variant) };
    return renderReportFile(row, query.variant);
  }

  // ----- bulk reschedule item -------------------------------------------

  async function rescheduleOne(
    scope: ResolvedScope,
    item: AuditBulkRescheduleBody['items'][number],
    body: AuditBulkRescheduleBody,
  ): Promise<AuditSummary> {
    return runTx(async (tx) => {
      const row = await lockAudit(tx, scope, item.auditId);
      if (row.status !== 'SCHEDULED') throw invalidState(row.status, 'reschedule');
      if (
        item.expectedScheduledFor !== undefined &&
        new Date(item.expectedScheduledFor).getTime() !== row.scheduledFor.getTime()
      ) {
        // Optimistic-concurrency guard: what makes a resent shiftDays batch a
        // no-op instead of a second shift.
        throw new AppError('CONFLICT', {
          detail: `Audit is now scheduled for ${row.scheduledFor.toISOString()}, not ${item.expectedScheduledFor}.`,
        });
      }
      const scheduledFor =
        body.newScheduledFor !== undefined
          ? new Date(body.newScheduledFor)
          : new Date(row.scheduledFor.getTime() + (body.shiftDays ?? 0) * DAY_MS);
      const period = fiscalPeriodOf(scheduledFor);
      const tiers = tierResolver(tx);
      const before = toSummary(row, await tiers(row));
      try {
        await repo.updateSchedule(tx, row.id, { scheduledFor, ...period });
      } catch (error) {
        if (isQuarterTakenError(error)) throw quarterTaken(period.fiscalYear, period.quarter);
        throw error;
      }
      const updated = await reload(tx, scope, row.id);
      const after = toSummary(updated, await tiers(updated));
      await log(tx, scope, {
        actionCode: 'audit.reschedule',
        entityType: 'audit',
        entityId: row.id,
        before,
        after: { ...after, rescheduleReason: body.reason ?? null, bulk: true },
      });
      return after;
    });
  }

  return {
    async list(scope, query) {
      const cursor = decodeAuditCursor(query.cursor);
      // A farmerId filter narrows within the caller's scope; it never widens it.
      const access: AuditAccess = { ...adminAccess(scope), farmerId: query.farmerId };
      const { rows, next } = await repo.listAudits(db, {
        access,
        zoneId: query.zoneId,
        statuses: query.status,
        type: query.type,
        fiscalYear: query.fiscalYear,
        quarter: query.quarter,
        scheduledFrom: query.scheduledFrom,
        scheduledTo: query.scheduledTo,
        redFlagged: query.redFlagged,
        overdue: query.overdue,
        hasOpenMajorFindings: query.hasOpenMajorFindings,
        now: now(),
        direction: query.sort === 'scheduledFor' ? 'asc' : 'desc',
        cursor,
        limit: query.limit,
      });
      const tiers = tierResolver(db);
      const items: AuditSummary[] = [];
      for (const row of rows) items.push(toSummary(row, await tiers(row)));
      return {
        items,
        page: { nextCursor: next === null ? null : encodeCursor([next.scheduledFor, next.id]), hasMore: next !== null },
      };
    },

    async schedule(scope, body) {
      if (body.auditType === 'EXTERNAL' && body.externalAgencyName === undefined) {
        throw fieldError('body.externalAgencyName', 'An EXTERNAL audit must name the agency.');
      }
      if (body.auditType === 'INTERNAL' && body.externalAgencyName !== undefined) {
        throw fieldError('body.externalAgencyName', 'Only an EXTERNAL audit has an agency.');
      }
      if (body.auditType === 'EXTERNAL' && body.auditorUserId !== undefined) {
        throw fieldError('body.auditorUserId', 'auditorUserId applies to INTERNAL audits only.');
      }

      const farmer = await repo.findFarmer(db, body.farmerId);
      if (farmer === null) {
        throw new AppError('NOT_FOUND', { detail: `No farmer with id "${body.farmerId}" was found.` });
      }
      if (body.farmId !== undefined && !(await repo.farmBelongsToFarmer(db, body.farmId, body.farmerId))) {
        throw fieldError('body.farmId', 'farmId must be one of this farmer\'s farms.');
      }
      if (body.auditorUserId !== undefined) await assertAuditor(db, body.auditorUserId);

      // BR-03a: derived server-side from scheduledFor in Asia/Kolkata.
      const scheduledFor = new Date(body.scheduledFor);
      const period = fiscalPeriodOf(scheduledFor);

      return runTx(async (tx) => {
        let id: string;
        try {
          id = await repo.insertAudit(tx, {
            farmerId: body.farmerId,
            farmId: body.farmId ?? null,
            // Snapshot of the farmer's zone at scheduling time (0027 comment).
            zoneId: farmer.zoneId,
            fiscalYear: period.fiscalYear,
            quarter: period.quarter,
            auditType: body.auditType,
            scheduledFor,
            auditorUserId: body.auditorUserId ?? null,
            externalAgencyName: body.externalAgencyName ?? null,
            createdBy: scope.userId,
          });
        } catch (error) {
          if (isQuarterTakenError(error)) throw quarterTaken(period.fiscalYear, period.quarter);
          throw error;
        }
        const detail = await assembleDetail(tx, await reload(tx, scope, id));
        await log(tx, scope, { actionCode: 'audit.schedule', entityType: 'audit', entityId: id, after: detail });
        return detail;
      });
    },

    async compliance(scope, query) {
      const asOf = now();
      const current = fiscalPeriodOf(asOf);
      const fiscalYear = query.fiscalYear ?? current.fiscalYear;
      const closed = isFiscalYearClosed(fiscalYear, asOf);
      const currentQuarter = fiscalYear === current.fiscalYear ? current.quarter : null;
      const base = {
        fiscalYear,
        currentQuarter,
        now: asOf,
        scope: scopedWhere(scope, { zoneColumn: 'f.zone_id' }),
        zoneId: query.zoneId,
      };

      const counts = await repo.complianceCounts(db, { ...base, requiredCount: QUARTERS_PER_FISCAL_YEAR });
      const { rows, next } = await repo.complianceFarmers(db, {
        ...base,
        completed: completedFilterFor(query.complianceStatus, closed),
        cursor: decodeFarmerCursor(query.cursor),
        limit: query.limit,
      });
      const shortfall = counts.farmersInScope - counts.farmersAtRequired;

      return {
        fiscalYear,
        isFiscalYearClosed: closed,
        currentQuarter,
        currentQuarterEndsOn: currentQuarter === null ? null : quarterEndsOn(fiscalYear, currentQuarter),
        asOf: asOf.toISOString(),
        counts: {
          farmersInScope: counts.farmersInScope,
          compliant: counts.farmersAtRequired,
          pending: closed ? 0 : shortfall,
          nonCompliant: closed ? shortfall : 0,
          overdueAudits: counts.overdueAudits,
          farmersWithoutCurrentQuarterAudit: counts.farmersWithoutCurrentQuarterAudit,
          redFlaggedAudits: counts.redFlaggedAudits,
          redFlaggedFarmers: counts.redFlaggedFarmers,
          openMajorFindings: counts.openMajorFindings,
          scheduledThisQuarter: counts.scheduledThisQuarter,
        },
        farmers: rows.map((row) => ({
          farmerId: row.farmerId,
          tohfaFarmerId: row.tohfaFarmerId,
          farmerName: row.farmerName,
          zoneId: row.zoneId,
          zoneName: row.zoneName,
          completedCount: row.completedCount,
          requiredCount: QUARTERS_PER_FISCAL_YEAR as 4,
          complianceStatus: complianceStatusFor(row.completedCount, closed),
          currentQuarterAudit:
            row.currentQuarterAudit === null
              ? null
              : {
                  auditId: row.currentQuarterAudit.auditId,
                  status: row.currentQuarterAudit.status,
                  scheduledFor: row.currentQuarterAudit.scheduledFor.toISOString(),
                  overdue:
                    (row.currentQuarterAudit.status === 'SCHEDULED' || row.currentQuarterAudit.status === 'IN_PROGRESS') &&
                    row.currentQuarterAudit.scheduledFor.getTime() < asOf.getTime(),
                },
          redFlaggedAuditCount: row.redFlaggedAuditCount,
          openMajorFindingCount: row.openMajorFindingCount,
        })),
        page: { nextCursor: next === null ? null : encodeCursor([next.tohfaFarmerId, next.id]), hasMore: next !== null },
      };
    },

    async bulkReschedule(scope, body) {
      const results: AuditBulkRescheduleResult['results'] = [];
      // One transaction and one audit_log row per item, so the batch may
      // partially succeed; domain failures are reported per item.
      for (const item of body.items) {
        try {
          const audit = await rescheduleOne(scope, item, body);
          results.push({ auditId: item.auditId, outcome: 'RESCHEDULED', audit });
        } catch (error) {
          if (error instanceof AppError && (bulkRescheduleFailureCodes as readonly string[]).includes(error.code)) {
            results.push({
              auditId: item.auditId,
              outcome: 'FAILED',
              code: error.code as BulkRescheduleFailureCode,
              ...(error.detail === undefined ? {} : { detail: error.detail }),
            });
            continue;
          }
          throw error;
        }
      }
      const rescheduledCount = results.filter((result) => result.outcome === 'RESCHEDULED').length;
      return { rescheduledCount, failedCount: results.length - rescheduledCount, results };
    },

    async get(scope, id) {
      const row = await repo.findAudit(db, id, adminAccess(scope));
      if (row === null) throw notFound(id);
      return assembleDetail(db, row);
    },

    async update(scope, id, body) {
      return runTx(async (tx) => {
        const row = await lockAudit(tx, scope, id);
        if (row.status !== 'SCHEDULED') throw invalidState(row.status, 'reschedule');

        const patch: SchedulePatch = {};
        if (body.scheduledFor !== undefined) {
          patch.scheduledFor = new Date(body.scheduledFor);
          Object.assign(patch, fiscalPeriodOf(patch.scheduledFor));
        }
        if (body.farmId !== undefined) {
          if (body.farmId !== null && !(await repo.farmBelongsToFarmer(tx, body.farmId, row.farmerId))) {
            throw fieldError('body.farmId', 'farmId must be one of this farmer\'s farms.');
          }
          patch.farmId = body.farmId;
        }
        if (body.auditorUserId !== undefined) {
          if (row.auditType === 'EXTERNAL' && body.auditorUserId !== null) {
            throw fieldError('body.auditorUserId', 'auditorUserId applies to INTERNAL audits only.');
          }
          if (body.auditorUserId !== null) await assertAuditor(tx, body.auditorUserId);
          patch.auditorUserId = body.auditorUserId;
        }
        if (body.externalAgencyName !== undefined) {
          if (row.auditType === 'INTERNAL') {
            throw fieldError('body.externalAgencyName', 'Only an EXTERNAL audit has an agency.');
          }
          patch.externalAgencyName = body.externalAgencyName;
        }

        const before = await assembleDetail(tx, row);
        try {
          await repo.updateSchedule(tx, id, patch);
        } catch (error) {
          if (isQuarterTakenError(error) && patch.fiscalYear !== undefined && patch.quarter !== undefined) {
            throw quarterTaken(patch.fiscalYear, patch.quarter);
          }
          throw error;
        }
        const after = await assembleDetail(tx, await reload(tx, scope, id));
        await log(tx, scope, {
          actionCode: 'audit.reschedule',
          entityType: 'audit',
          entityId: id,
          before,
          // There is no column for the reason; the audit trail is its record.
          after: { ...after, rescheduleReason: body.reason ?? null },
        });
        return after;
      });
    },

    async cancel(scope, id, body) {
      return runTx(async (tx) => {
        const row = await lockAudit(tx, scope, id);
        if (row.status !== 'SCHEDULED' && row.status !== 'IN_PROGRESS') throw invalidState(row.status, 'cancel');
        const before = await assembleDetail(tx, row);
        // Cancelling frees the (farmer, fiscal year, quarter) slot: the unique
        // index is partial on status <> 'CANCELLED' (BR-03a).
        await repo.markCancelled(tx, id, { reason: body.reason, cancelledBy: scope.userId });
        const after = await assembleDetail(tx, await reload(tx, scope, id));
        await log(tx, scope, { actionCode: 'audit.cancel', entityType: 'audit', entityId: id, before, after });
        return after;
      });
    },

    async start(scope, id, body) {
      await assertCanConduct(scope, id);
      return runTx(async (tx) => {
        const row = await lockAudit(tx, scope, id);
        if (row.status !== 'SCHEDULED') throw invalidState(row.status, 'start');
        if (body.auditorUserId !== undefined) {
          if (row.auditType === 'EXTERNAL') {
            throw fieldError('body.auditorUserId', 'auditorUserId applies to INTERNAL audits only.');
          }
          await assertAuditor(tx, body.auditorUserId);
        }
        if (row.auditType === 'INTERNAL' && (body.auditorUserId ?? row.auditorUserId) === null) {
          throw fieldError('body.auditorUserId', 'An INTERNAL audit needs an auditor before it can start.');
        }
        const before = await assembleDetail(tx, row);
        await repo.markStarted(tx, id, body.auditorUserId ?? null);
        const after = await assembleDetail(tx, await reload(tx, scope, id));
        await log(tx, scope, { actionCode: 'audit.start', entityType: 'audit', entityId: id, before, after });
        return after;
      });
    },

    async setScores(scope, id, body) {
      // BR-06a before anything touches the database: the schema checks
      // integer-ness only so that this domain code, not VALIDATION_FAILED, is
      // what a client sees for 11 or -1.
      for (const entry of body.scores) {
        if (entry.score < 0 || entry.score > MAX_CATEGORY_SCORE) {
          throw new AppError('SCORE_OUT_OF_RANGE', {
            detail: `Score for "${entry.categoryCode}" must be between 0 and ${MAX_CATEGORY_SCORE} (got ${entry.score}).`,
            meta: { categoryCode: entry.categoryCode, score: entry.score },
          });
        }
      }
      if (new Set(body.scores.map((entry) => entry.categoryCode)).size !== body.scores.length) {
        throw fieldError('body.scores', 'Each category may appear at most once per request.');
      }

      return runTx(async (tx) => {
        const row = await lockAudit(tx, scope, id);
        if (row.status !== 'IN_PROGRESS') throw invalidState(row.status, 'score');
        const categories = await categoryIdsByCode(tx);
        const scores = body.scores.map((entry) => ({
          categoryId: categoryIdFor(categories, entry.categoryCode, 'body.scores'),
          score: entry.score,
          remarks: entry.remarks ?? null,
          scoredBy: scope.userId,
        }));
        const reportUploadId =
          body.reportStorageKey === undefined ? undefined : await resolveReportUpload(tx, scope, body.reportStorageKey);

        const before = await assembleDetail(tx, row);
        await repo.upsertScores(tx, id, scores);
        if (body.summary !== undefined || reportUploadId !== undefined) {
          await repo.updateSummaryAndReport(tx, id, { summary: body.summary, reportUploadId });
        }
        const after = await assembleDetail(tx, await reload(tx, scope, id));
        await log(tx, scope, { actionCode: 'audit.score', entityType: 'audit', entityId: id, before, after });
        return after;
      });
    },

    async createFinding(scope, id, body) {
      return runTx(async (tx) => {
        const row = await lockAudit(tx, scope, id);
        if (row.status !== 'IN_PROGRESS') throw invalidState(row.status, 'log a finding on');
        const categoryId =
          body.categoryCode === undefined
            ? null
            : categoryIdFor(await categoryIdsByCode(tx), body.categoryCode, 'body.categoryCode');
        // Logging a MAJOR finding never red-flags anything (BR-05b).
        const findingId = await repo.insertFinding(tx, {
          auditId: id,
          categoryId,
          severity: body.severity,
          description: body.description,
          correctiveAction: body.correctiveAction ?? null,
          dueDate: body.dueDate ?? null,
          createdBy: scope.userId,
        });
        const finding = await repo.findFinding(tx, id, findingId);
        if (finding === null) throw new Error('inserted finding could not be read back');
        const after = toFinding(finding);
        await log(tx, scope, { actionCode: 'audit.finding.create', entityType: 'audit_finding', entityId: findingId, after });
        return after;
      });
    },

    async updateFinding(scope, id, findingId, body) {
      return runTx(async (tx) => {
        const row = await lockAudit(tx, scope, id);
        const finding = await repo.findFinding(tx, id, findingId);
        if (finding === null) {
          throw new AppError('NOT_FOUND', { detail: `No finding with id "${findingId}" on this audit.` });
        }

        const patch: FindingPatch = {};
        if (row.status === 'IN_PROGRESS') {
          if (body.severity !== undefined) patch.severity = body.severity;
          if (body.categoryCode !== undefined) {
            patch.categoryId =
              body.categoryCode === null
                ? null
                : categoryIdFor(await categoryIdsByCode(tx), body.categoryCode, 'body.categoryCode');
          }
          if (body.description !== undefined) patch.description = body.description;
          if (body.correctiveAction !== undefined) patch.correctiveAction = body.correctiveAction;
          if (body.dueDate !== undefined) patch.dueDate = body.dueDate;
          if (body.resolutionNote !== undefined) patch.resolutionNote = body.resolutionNote;
          if (body.resolved === false) patch.resolvedBy = null;
          if (body.resolved === true && finding.resolvedAt === null) patch.resolvedBy = scope.userId;
        } else if (row.status === 'COMPLETED') {
          // After completion only the resolution may be recorded: what was
          // found (and majorViolationsCount, BR-05a) is history.
          const onlyResolution = Object.keys(body).every((key) => key === 'resolved' || key === 'resolutionNote');
          if (!onlyResolution || body.resolved !== true) {
            throw invalidState(row.status, 'edit a finding (other than resolving it) on');
          }
          if (finding.resolvedAt === null) patch.resolvedBy = scope.userId;
          if (body.resolutionNote !== undefined) patch.resolutionNote = body.resolutionNote;
        } else {
          throw invalidState(row.status, 'edit a finding on');
        }

        const before = toFinding(finding);
        await repo.updateFinding(tx, findingId, patch);
        const updated = await repo.findFinding(tx, id, findingId);
        if (updated === null) throw new Error('updated finding could not be read back');
        const after = toFinding(updated);
        await log(tx, scope, {
          actionCode: 'audit.finding.update',
          entityType: 'audit_finding',
          entityId: findingId,
          before,
          after,
        });
        return after;
      });
    },

    async complete(scope, id, body) {
      await assertCanConduct(scope, id);
      return runTx(async (tx) => {
        const row = await lockAudit(tx, scope, id);
        if (row.status !== 'IN_PROGRESS') throw invalidState(row.status, 'complete');

        // BR-06: all categories scored, or the audit is incomplete — a missing
        // category is never counted as zero.
        const { sheet } = await categorySheet(tx, id);
        const missing = sheet.filter((entry) => entry.score === null).map((entry) => entry.categoryCode);
        if (missing.length > 0) {
          throw new AppError('AUDIT_INCOMPLETE', {
            detail: `Score every category before completing; missing: ${missing.join(', ')}.`,
            errors: { categoryScores: missing.map((code) => `${code} has no score`) },
            meta: { missingCategoryCodes: missing },
          });
        }
        const reportUploadId =
          body.reportStorageKey === undefined ? undefined : await resolveReportUpload(tx, scope, body.reportStorageKey);

        const before = await assembleDetail(tx, row);
        if (body.summary !== undefined || reportUploadId !== undefined) {
          await repo.updateSummaryAndReport(tx, id, { summary: body.summary, reportUploadId });
        }
        // Direct sum (BR-06, no multiplier) and the MAJOR count (BR-05a). The
        // count is recorded, never turned into a red flag (BR-05b).
        const totalScore = sheet.reduce((sum, entry) => sum + (entry.score ?? 0), 0);
        const majorViolationsCount = await repo.countMajorFindings(tx, id);
        // BR-06c/d: only an INTERNAL audit feeds the farm rating. Same `tx`,
        // so a failure here rolls the completion back with it (BR-06g). It
        // runs before markCompleted only so that a failure leaves nothing
        // half-done even for a caller whose runner does not roll back.
        if (row.auditType === 'INTERNAL') {
          await recordRating(tx, {
            auditId: id,
            farmerId: row.farmerId,
            farmId: row.farmId,
            zoneId: row.zoneId,
            fiscalYear: row.fiscalYear,
            quarter: row.quarter,
            scores: sheet.map((entry) => ({
              categoryCode: entry.categoryCode,
              score: entry.score ?? 0, // unreachable: missing scores were refused above
              remarks: entry.remarks,
            })),
            ratedBy: scope.userId,
            actorRole: scope.roleCode,
          });
        }
        await repo.markCompleted(tx, id, { totalScore, majorViolationsCount });
        const after = await assembleDetail(tx, await reload(tx, scope, id));
        await log(tx, scope, { actionCode: 'audit.complete', entityType: 'audit', entityId: id, before, after });
        return after;
      });
    },

    async redFlag(scope, id, body) {
      return runTx(async (tx) => {
        const row = await lockAudit(tx, scope, id);
        // BR-05b: the ONLY way red_flagged becomes true, and only on a
        // COMPLETED audit that is not already flagged.
        if (row.status !== 'COMPLETED' || row.redFlagged) {
          throw invalidState(row.status, row.redFlagged ? 'red-flag an already flagged' : 'red-flag');
        }
        const before = await assembleDetail(tx, row);
        await repo.setRedFlag(tx, id, { reason: body.reason, flaggedBy: scope.userId });
        const after = await assembleDetail(tx, await reload(tx, scope, id));
        await log(tx, scope, { actionCode: 'audit.red_flag', entityType: 'audit', entityId: id, before, after });
        return after;
      });
    },

    async clearRedFlag(scope, id, body) {
      return runTx(async (tx) => {
        const row = await lockAudit(tx, scope, id);
        if (!row.redFlagged) throw invalidState(row.status, 'clear the red flag of an unflagged');
        const before = await assembleDetail(tx, row);
        await repo.clearRedFlag(tx, id);
        const after = await assembleDetail(tx, await reload(tx, scope, id));
        await log(tx, scope, {
          actionCode: 'audit.red_flag.clear',
          entityType: 'audit',
          entityId: id,
          before,
          after: { ...after, note: body.note ?? null },
        });
        return after;
      });
    },

    async getReport(scope, id, query) {
      // `scope` is the audit.view scope (see audits.routes.ts), so a Farmer
      // Admin is zone-limited here exactly as on GET /admin/audits/{id}.
      const row = await repo.findAudit(db, id, adminAccess(scope));
      if (row === null) throw notFound(id);
      return produceReport('admin', row, query);
    },

    async listMine(scope, query) {
      const access = farmerAccess(scope);
      if (access === null) return { items: [], page: { nextCursor: null, hasMore: false } };
      const { rows, next } = await repo.listAudits(db, {
        access,
        statuses: query.status,
        type: query.type,
        fiscalYear: query.fiscalYear,
        now: now(),
        direction: query.sort === 'scheduledFor' ? 'asc' : 'desc',
        cursor: decodeAuditCursor(query.cursor),
        limit: query.limit,
      });
      const tiers = tierResolver(db);
      const items: FarmerAuditSummary[] = [];
      for (const row of rows) items.push(toFarmerSummary(row, await tiers(row)));
      return {
        items,
        page: { nextCursor: next === null ? null : encodeCursor([next.scheduledFor, next.id]), hasMore: next !== null },
      };
    },

    async getMine(scope, id) {
      const access = farmerAccess(scope);
      const row = access === null ? null : await repo.findAudit(db, id, access);
      if (row === null) throw notFound(id);
      return assembleFarmerDetail(db, row);
    },

    async getMyReport(scope, id, query) {
      const access = farmerAccess(scope);
      const row = access === null ? null : await repo.findAudit(db, id, access);
      if (row === null) throw notFound(id);
      // Orchestrator decision 2026-10-01: a farmer's report download (either
      // variant) is limited to their own COMPLETED audits.
      if (row.status !== 'COMPLETED') throw invalidState(row.status, 'download the report of');
      return produceReport('farmer', row, query);
    },

    async getSignedReport(audience, id, query) {
      const { token, expires } = query;
      const valid =
        token !== undefined &&
        expires !== undefined &&
        expires > now().getTime() &&
        token.length === 64 &&
        crypto.timingSafeEqual(Buffer.from(token, 'utf8'), Buffer.from(sign(audience, id, query.variant, expires), 'utf8'));
      if (!valid) throw new AppError('FORBIDDEN', { detail: 'Download link is invalid or has expired.' });

      const row = await repo.findAudit(db, id, SIGNED_LINK_ACCESS);
      if (row === null) throw notFound(id);
      if (audience === 'farmer' && row.status !== 'COMPLETED') throw invalidState(row.status, 'download the report of');
      return renderReportFile(row, query.variant);
    },
  };
}

export const auditsService: AuditsService = createAuditsService();
