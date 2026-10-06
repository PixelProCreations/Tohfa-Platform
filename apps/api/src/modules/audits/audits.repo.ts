/**
 * Audit Management — SQL only. Every function takes an Executor so the service
 * can compose calls inside one transaction.
 *
 * ALIASES ARE PART OF THE CONTRACT. The service builds the visibility filter
 * with scopedWhere(scope, { zoneColumn: 'f.zone_id' }) (a Farmer Admin sees the
 * farmer's CURRENT zone, as farm-ratings.repo.ts does) or
 * { farmerColumn: 'a.farmer_id' } (a farmer's own rows), so every query that
 * applies an AuditAccess aliases `audits a` and `farmers f`.
 *
 * NOTHING HERE WRITES OUTSIDE audits / audit_category_scores / audit_findings.
 * Audit results change nothing automatically (BR-05b, BR-38): no farmers,
 * farm_ratings, certifications or payouts write exists in this file on purpose.
 */
import type { Executor } from '../../db/pool.js';
import type { ScopedWhere } from '../../rbac/requirePermission.js';
import { farmRatingsRepo, type ActiveCategoryRow } from '../farm-ratings/farm-ratings.repo.js';
import { uploadsRepo } from '../uploads/uploads.repo.js';
import type { AuditFindingCounts, AuditStatus, AuditType, FindingSeverity } from './audits.schema.js';

export type { ActiveCategoryRow };

export interface AuditReportUploadRow {
  uploadId: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
}

/** One audit joined to its farmer/farm/zone/user names and finding counts. */
export interface AuditRow {
  id: string;
  farmerId: string;
  tohfaFarmerId: string;
  farmerName: string;
  /** The farmer's CURRENT zone (scoping), not the audit's snapshot. */
  farmerZoneId: string | null;
  farmId: string | null;
  farmName: string | null;
  zoneId: string | null;
  zoneName: string | null;
  fiscalYear: string;
  quarter: number;
  auditType: AuditType;
  status: AuditStatus;
  scheduledFor: Date;
  /** Microsecond-exact UTC text of scheduled_for, for keyset cursors. */
  scheduledForCursor: string;
  startedAt: Date | null;
  completedAt: Date | null;
  auditorUserId: string | null;
  auditorName: string | null;
  externalAgencyName: string | null;
  reportUpload: AuditReportUploadRow | null;
  summary: string | null;
  totalScore: number | null;
  majorViolationsCount: number;
  redFlagged: boolean;
  redFlagReason: string | null;
  redFlaggedAt: Date | null;
  redFlaggedByName: string | null;
  cancelledReason: string | null;
  cancelledAt: Date | null;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date | null;
  findingCounts: AuditFindingCounts;
}

export interface CategoryScoreRow {
  categoryId: string;
  score: number;
  remarks: string | null;
}

export interface FindingRow {
  id: string;
  auditId: string;
  severity: FindingSeverity;
  categoryId: string | null;
  categoryCode: string | null;
  description: string;
  correctiveAction: string | null;
  dueDate: string | null;
  resolvedAt: Date | null;
  resolvedByName: string | null;
  resolutionNote: string | null;
  createdAt: Date;
}

export interface UploadRef {
  id: string;
  storageKey: string;
  uploadedBy: string | null;
  mimeType: string;
  sizeBytes: number;
}

/** Row visibility handed to the repo. The SERVICE decides it; the repo applies it. */
export interface AuditAccess {
  /** From scopedWhere(scope, { zoneColumn: 'f.zone_id' } or { farmerColumn: 'a.farmer_id' }). */
  scope: ScopedWhere;
  /** Farmer-own endpoints also pin the farmer explicitly (belt and braces). */
  farmerId?: string | undefined;
}

export interface InsertAuditData {
  farmerId: string;
  farmId: string | null;
  zoneId: string | null;
  fiscalYear: string;
  quarter: number;
  auditType: AuditType;
  scheduledFor: Date;
  auditorUserId: string | null;
  externalAgencyName: string | null;
  createdBy: string;
}

/** Only the keys present are written. */
export interface SchedulePatch {
  scheduledFor?: Date;
  fiscalYear?: string;
  quarter?: number;
  farmId?: string | null;
  auditorUserId?: string | null;
  externalAgencyName?: string | null;
}

export interface ScoreInput {
  categoryId: string;
  score: number;
  remarks: string | null;
  scoredBy: string;
}

export interface InsertFindingData {
  auditId: string;
  categoryId: string | null;
  severity: FindingSeverity;
  description: string;
  correctiveAction: string | null;
  dueDate: string | null;
  createdBy: string;
}

/** Only the keys present are written. `resolvedBy: null` clears the resolution. */
export interface FindingPatch {
  severity?: FindingSeverity;
  categoryId?: string | null;
  description?: string;
  correctiveAction?: string | null;
  dueDate?: string | null;
  /** Set: stamp resolved_at = now() and resolved_by. null: clear both. */
  resolvedBy?: string | null;
  resolutionNote?: string | null;
}

export interface AuditCursor {
  scheduledFor: string;
  id: string;
}

export interface ListAuditsArgs {
  access: AuditAccess;
  zoneId?: string | undefined;
  statuses?: AuditStatus[] | undefined;
  type?: AuditType | undefined;
  fiscalYear?: string | undefined;
  quarter?: number | undefined;
  scheduledFrom?: string | undefined;
  scheduledTo?: string | undefined;
  redFlagged?: boolean | undefined;
  overdue?: boolean | undefined;
  hasOpenMajorFindings?: boolean | undefined;
  /** Clock for `overdue`, injected so the service stays testable. */
  now: Date;
  direction: 'asc' | 'desc';
  cursor?: AuditCursor | undefined;
  limit: number;
}

export interface ComplianceScopeArgs {
  fiscalYear: string;
  /** Null unless `fiscalYear` is the current one. */
  currentQuarter: number | null;
  now: Date;
  /** scopedWhere(scope, { zoneColumn: 'f.zone_id' }) */
  scope: ScopedWhere;
  zoneId?: string | undefined;
}

export interface ComplianceCountsRow {
  farmersInScope: number;
  /** Farmers with at least `requiredCount` COMPLETED audits in the fiscal year. */
  farmersAtRequired: number;
  overdueAudits: number;
  farmersWithoutCurrentQuarterAudit: number;
  redFlaggedAudits: number;
  redFlaggedFarmers: number;
  openMajorFindings: number;
  scheduledThisQuarter: number;
}

/** completedCount filter the service derives from a complianceStatus filter. */
export type CompletedCountFilter =
  | { kind: 'all' }
  | { kind: 'none' }
  | { kind: 'atLeast'; value: number }
  | { kind: 'below'; value: number };

export interface ComplianceFarmerCursor {
  tohfaFarmerId: string;
  id: string;
}

export interface ComplianceFarmerRow {
  farmerId: string;
  tohfaFarmerId: string;
  farmerName: string;
  zoneId: string | null;
  zoneName: string | null;
  completedCount: number;
  redFlaggedAuditCount: number;
  openMajorFindingCount: number;
  currentQuarterAudit: { auditId: string; status: AuditStatus; scheduledFor: Date } | null;
}

export interface ComplianceFarmersArgs extends ComplianceScopeArgs {
  completed: CompletedCountFilter;
  cursor?: ComplianceFarmerCursor | undefined;
  limit: number;
}

export interface ReportContextRow {
  farmVillage: string | null;
  farmTaluk: string | null;
  farmDistrict: string | null;
  /** rating_categories.code -> name, for the PDF only (clients use i18n). */
  categoryNames: Record<string, string>;
}

export interface AuditsRepo {
  findActiveCategories(tx: Executor): Promise<ActiveCategoryRow[]>;
  findFarmer(tx: Executor, farmerId: string): Promise<{ id: string; zoneId: string | null } | null>;
  farmBelongsToFarmer(tx: Executor, farmId: string, farmerId: string): Promise<boolean>;
  userExists(tx: Executor, userId: string): Promise<boolean>;
  findUploadByStorageKey(tx: Executor, storageKey: string): Promise<UploadRef | null>;

  insertAudit(tx: Executor, data: InsertAuditData): Promise<string>;
  /** Scope-filtered. `forUpdate` row-locks the audit for a state transition. */
  findAudit(tx: Executor, id: string, access: AuditAccess, options?: { forUpdate?: boolean }): Promise<AuditRow | null>;
  listAudits(tx: Executor, args: ListAuditsArgs): Promise<{ rows: AuditRow[]; next: AuditCursor | null }>;
  findCategoryScores(tx: Executor, auditId: string): Promise<CategoryScoreRow[]>;
  findFindings(tx: Executor, auditId: string): Promise<FindingRow[]>;
  findFinding(tx: Executor, auditId: string, findingId: string): Promise<FindingRow | null>;
  countMajorFindings(tx: Executor, auditId: string): Promise<number>;

  updateSchedule(tx: Executor, id: string, patch: SchedulePatch): Promise<void>;
  markStarted(tx: Executor, id: string, auditorUserId: string | null): Promise<void>;
  upsertScores(tx: Executor, auditId: string, scores: ScoreInput[]): Promise<void>;
  updateSummaryAndReport(
    tx: Executor,
    id: string,
    data: { summary?: string | undefined; reportUploadId?: string | undefined },
  ): Promise<void>;
  markCompleted(tx: Executor, id: string, data: { totalScore: number; majorViolationsCount: number }): Promise<void>;
  markCancelled(tx: Executor, id: string, data: { reason: string; cancelledBy: string }): Promise<void>;
  setRedFlag(tx: Executor, id: string, data: { reason: string; flaggedBy: string }): Promise<void>;
  clearRedFlag(tx: Executor, id: string): Promise<void>;
  insertFinding(tx: Executor, data: InsertFindingData): Promise<string>;
  updateFinding(tx: Executor, findingId: string, patch: FindingPatch): Promise<void>;

  complianceCounts(tx: Executor, args: ComplianceScopeArgs & { requiredCount: number }): Promise<ComplianceCountsRow>;
  complianceFarmers(
    tx: Executor,
    args: ComplianceFarmersArgs,
  ): Promise<{ rows: ComplianceFarmerRow[]; next: ComplianceFarmerCursor | null }>;
  findReportContext(tx: Executor, auditId: string): Promise<ReportContextRow>;
}

/** Shift a scopedWhere fragment so it continues this query's placeholders. */
function renumber(scope: ScopedWhere, startIndex: number): ScopedWhere {
  if (scope.params.length === 0) return { ...scope, nextIndex: startIndex };
  let next = startIndex;
  const sql = scope.sql.replace(/\$(\d+)/g, () => `$${next++}`);
  return { sql, params: scope.params, nextIndex: next };
}

/** Appends the access filter to `params` and returns the SQL condition. */
function accessCondition(access: AuditAccess, params: unknown[]): string {
  const scoped = renumber(access.scope, params.length + 1);
  params.push(...scoped.params);
  const conditions = [scoped.sql];
  if (access.farmerId !== undefined) {
    params.push(access.farmerId);
    conditions.push(`a.farmer_id = $${params.length}::uuid`);
  }
  return conditions.map((c) => `(${c})`).join(' AND ');
}

const AUDIT_FROM = `
  FROM audits a
  JOIN farmers f       ON f.id = a.farmer_id
  JOIN users fu        ON fu.id = f.user_id
  JOIN users cb        ON cb.id = a.created_by
  LEFT JOIN farms fa   ON fa.id = a.farm_id
  LEFT JOIN zones z    ON z.id = a.zone_id
  LEFT JOIN users au   ON au.id = a.auditor_user_id
  LEFT JOIN users rf   ON rf.id = a.red_flagged_by
  LEFT JOIN uploads up ON up.id = a.report_upload_id AND up.deleted_at IS NULL
  LEFT JOIN LATERAL (
    SELECT count(*) FILTER (WHERE af.severity = 'MAJOR')::int                            AS major,
           count(*) FILTER (WHERE af.severity = 'MINOR')::int                            AS minor,
           count(*) FILTER (WHERE af.severity = 'OBSERVATION')::int                      AS observation,
           count(*) FILTER (WHERE af.severity = 'MAJOR' AND af.resolved_at IS NULL)::int AS open_major
      FROM audit_findings af
     WHERE af.audit_id = a.id
  ) fc ON TRUE
`;

const AUDIT_COLUMNS = `
  a.id, a.farmer_id, f.tohfa_farmer_id, fu.full_name AS farmer_name, f.zone_id AS farmer_zone_id,
  a.farm_id, fa.name AS farm_name, a.zone_id, z.name AS zone_name,
  a.fiscal_year, a.quarter, a.audit_type, a.status, a.scheduled_for,
  to_char(a.scheduled_for AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS scheduled_for_cursor,
  a.started_at, a.completed_at, a.auditor_user_id, au.full_name AS auditor_name, a.external_agency_name,
  up.id AS report_upload_id, up.storage_key AS report_storage_key, up.mime_type AS report_mime_type,
  up.size_bytes::text AS report_size_bytes,
  a.summary, a.total_score, a.major_violations_count, a.red_flagged, a.red_flag_reason, a.red_flagged_at,
  rf.full_name AS red_flagged_by_name, a.cancelled_reason, a.cancelled_at, cb.full_name AS created_by_name,
  a.created_at, a.updated_at,
  fc.major, fc.minor, fc.observation, fc.open_major
`;

interface AuditDbRow {
  id: string;
  farmer_id: string;
  tohfa_farmer_id: string;
  farmer_name: string;
  farmer_zone_id: string | null;
  farm_id: string | null;
  farm_name: string | null;
  zone_id: string | null;
  zone_name: string | null;
  fiscal_year: string;
  quarter: number;
  audit_type: AuditType;
  status: AuditStatus;
  scheduled_for: Date;
  scheduled_for_cursor: string;
  started_at: Date | null;
  completed_at: Date | null;
  auditor_user_id: string | null;
  auditor_name: string | null;
  external_agency_name: string | null;
  report_upload_id: string | null;
  report_storage_key: string | null;
  report_mime_type: string | null;
  report_size_bytes: string | null;
  summary: string | null;
  total_score: number | null;
  major_violations_count: number;
  red_flagged: boolean;
  red_flag_reason: string | null;
  red_flagged_at: Date | null;
  red_flagged_by_name: string | null;
  cancelled_reason: string | null;
  cancelled_at: Date | null;
  created_by_name: string;
  created_at: Date;
  updated_at: Date | null;
  major: number;
  minor: number;
  observation: number;
  open_major: number;
}

function toAuditRow(row: AuditDbRow): AuditRow {
  return {
    id: row.id,
    farmerId: row.farmer_id,
    tohfaFarmerId: row.tohfa_farmer_id,
    farmerName: row.farmer_name,
    farmerZoneId: row.farmer_zone_id,
    farmId: row.farm_id,
    farmName: row.farm_name,
    zoneId: row.zone_id,
    zoneName: row.zone_name,
    fiscalYear: row.fiscal_year,
    quarter: Number(row.quarter),
    auditType: row.audit_type,
    status: row.status,
    scheduledFor: row.scheduled_for,
    scheduledForCursor: row.scheduled_for_cursor,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    auditorUserId: row.auditor_user_id,
    auditorName: row.auditor_name,
    externalAgencyName: row.external_agency_name,
    reportUpload:
      row.report_upload_id === null
        ? null
        : {
            uploadId: row.report_upload_id,
            storageKey: row.report_storage_key ?? '',
            mimeType: row.report_mime_type ?? 'application/octet-stream',
            sizeBytes: Number(row.report_size_bytes ?? '0'),
          },
    summary: row.summary,
    totalScore: row.total_score === null ? null : Number(row.total_score),
    majorViolationsCount: Number(row.major_violations_count),
    redFlagged: row.red_flagged,
    redFlagReason: row.red_flag_reason,
    redFlaggedAt: row.red_flagged_at,
    redFlaggedByName: row.red_flagged_by_name,
    cancelledReason: row.cancelled_reason,
    cancelledAt: row.cancelled_at,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    findingCounts: {
      major: Number(row.major),
      minor: Number(row.minor),
      observation: Number(row.observation),
      openMajor: Number(row.open_major),
    },
  };
}

interface FindingDbRow {
  id: string;
  audit_id: string;
  severity: FindingSeverity;
  category_id: string | null;
  category_code: string | null;
  description: string;
  corrective_action: string | null;
  due_date: string | null;
  resolved_at: Date | null;
  resolved_by_name: string | null;
  resolution_note: string | null;
  created_at: Date;
}

const FINDING_SELECT = `
  SELECT af.id, af.audit_id, af.severity, af.category_id, rc.code AS category_code, af.description,
         af.corrective_action, to_char(af.due_date, 'YYYY-MM-DD') AS due_date, af.resolved_at,
         ru.full_name AS resolved_by_name, af.resolution_note, af.created_at
    FROM audit_findings af
    LEFT JOIN rating_categories rc ON rc.id = af.category_id
    LEFT JOIN users ru ON ru.id = af.resolved_by
`;

function toFindingRow(row: FindingDbRow): FindingRow {
  return {
    id: row.id,
    auditId: row.audit_id,
    severity: row.severity,
    categoryId: row.category_id,
    categoryCode: row.category_code,
    description: row.description,
    correctiveAction: row.corrective_action,
    dueDate: row.due_date,
    resolvedAt: row.resolved_at,
    resolvedByName: row.resolved_by_name,
    resolutionNote: row.resolution_note,
    createdAt: row.created_at,
  };
}

/**
 * The approved, non-deleted farmers in scope, and their audits in one fiscal
 * year. Shared by both compliance queries so `counts` and the `farmers` page
 * always describe the same population.
 */
function complianceCtes(args: ComplianceScopeArgs, params: unknown[]): string {
  const scoped = renumber(args.scope, params.length + 1);
  params.push(...scoped.params);
  const conditions = ["f.deleted_at IS NULL", "f.application_status = 'APPROVED'", `(${scoped.sql})`];
  if (args.zoneId !== undefined) {
    params.push(args.zoneId);
    conditions.push(`f.zone_id = $${params.length}::uuid`);
  }
  params.push(args.fiscalYear);
  const fyIndex = params.length;
  return `
    WITH pop AS (
      SELECT f.id, f.tohfa_farmer_id, u.full_name AS farmer_name, f.zone_id, z.name AS zone_name
        FROM farmers f
        JOIN users u ON u.id = f.user_id
        LEFT JOIN zones z ON z.id = f.zone_id
       WHERE ${conditions.join(' AND ')}
    ),
    fy AS (
      SELECT a.id, a.farmer_id, a.quarter, a.status, a.scheduled_for, a.red_flagged
        FROM audits a
        JOIN pop ON pop.id = a.farmer_id
       WHERE a.fiscal_year = $${fyIndex}
    )`;
}

export const auditsRepo: AuditsRepo = {
  findActiveCategories(tx) {
    // Same live category set as the farm rating (BR-06b); one query, one definition.
    return farmRatingsRepo.findActiveCategories(tx);
  },

  async findFarmer(tx, farmerId) {
    const result = await tx.query<{ id: string; zone_id: string | null }>(
      `SELECT id, zone_id FROM farmers WHERE id = $1 AND deleted_at IS NULL`,
      [farmerId],
    );
    const row = result.rows[0];
    return row === undefined ? null : { id: row.id, zoneId: row.zone_id };
  },

  async farmBelongsToFarmer(tx, farmId, farmerId) {
    const result = await tx.query(
      `SELECT 1 FROM farms WHERE id = $1 AND farmer_id = $2 AND deleted_at IS NULL`,
      [farmId, farmerId],
    );
    return result.rows.length > 0;
  },

  async userExists(tx, userId) {
    const result = await tx.query(
      `SELECT 1 FROM users WHERE id = $1 AND deleted_at IS NULL AND status = 'ACTIVE'`,
      [userId],
    );
    return result.rows.length > 0;
  },

  async findUploadByStorageKey(tx, storageKey) {
    const row = await uploadsRepo.findByKey(tx, storageKey);
    return row === null
      ? null
      : {
          id: row.id,
          storageKey: row.storage_key,
          uploadedBy: row.uploaded_by,
          mimeType: row.mime_type,
          sizeBytes: Number(row.size_bytes),
        };
  },

  async insertAudit(tx, data) {
    const result = await tx.query<{ id: string }>(
      `INSERT INTO audits (farmer_id, farm_id, zone_id, fiscal_year, quarter, audit_type, scheduled_for,
                           auditor_user_id, external_agency_name, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        data.farmerId,
        data.farmId,
        data.zoneId,
        data.fiscalYear,
        data.quarter,
        data.auditType,
        data.scheduledFor,
        data.auditorUserId,
        data.externalAgencyName,
        data.createdBy,
      ],
    );
    return result.rows[0]!.id;
  },

  async findAudit(tx, id, access, options = {}) {
    const params: unknown[] = [id];
    const condition = accessCondition(access, params);
    if (options.forUpdate === true) {
      // Lock first in a plain query: FOR UPDATE does not mix with the
      // aggregate lateral join below. Same filter, so out-of-scope stays 404.
      const locked = await tx.query(
        `SELECT a.id FROM audits a JOIN farmers f ON f.id = a.farmer_id
          WHERE a.id = $1 AND ${condition}
          FOR UPDATE OF a`,
        params,
      );
      if (locked.rows.length === 0) return null;
    }
    const result = await tx.query<AuditDbRow>(
      `SELECT ${AUDIT_COLUMNS} ${AUDIT_FROM} WHERE a.id = $1 AND ${condition}`,
      params,
    );
    const row = result.rows[0];
    return row === undefined ? null : toAuditRow(row);
  },

  async listAudits(tx, args) {
    const params: unknown[] = [];
    const conditions: string[] = [accessCondition(args.access, params)];
    const add = (sql: (index: number) => string, value: unknown): void => {
      params.push(value);
      conditions.push(sql(params.length));
    };
    if (args.zoneId !== undefined) add((i) => `a.zone_id = $${i}::uuid`, args.zoneId);
    if (args.statuses !== undefined) add((i) => `a.status = ANY($${i}::audit_status[])`, args.statuses);
    if (args.type !== undefined) add((i) => `a.audit_type = $${i}::audit_type`, args.type);
    if (args.fiscalYear !== undefined) add((i) => `a.fiscal_year = $${i}`, args.fiscalYear);
    if (args.quarter !== undefined) add((i) => `a.quarter = $${i}::smallint`, args.quarter);
    if (args.scheduledFrom !== undefined) add((i) => `a.scheduled_for >= $${i}::timestamptz`, args.scheduledFrom);
    if (args.scheduledTo !== undefined) add((i) => `a.scheduled_for <= $${i}::timestamptz`, args.scheduledTo);
    if (args.redFlagged !== undefined) add((i) => `a.red_flagged = $${i}::boolean`, args.redFlagged);
    if (args.overdue !== undefined) {
      add(
        (i) =>
          `${args.overdue === true ? '' : 'NOT '}(a.status IN ('SCHEDULED', 'IN_PROGRESS') AND a.scheduled_for < $${i}::timestamptz)`,
        args.now,
      );
    }
    if (args.hasOpenMajorFindings !== undefined) {
      conditions.push(
        `${args.hasOpenMajorFindings ? '' : 'NOT '}EXISTS (
           SELECT 1 FROM audit_findings x
            WHERE x.audit_id = a.id AND x.severity = 'MAJOR' AND x.resolved_at IS NULL)`,
      );
    }
    const comparator = args.direction === 'asc' ? '>' : '<';
    if (args.cursor !== undefined) {
      params.push(args.cursor.scheduledFor, args.cursor.id);
      conditions.push(
        `(a.scheduled_for, a.id) ${comparator} ($${params.length - 1}::timestamptz, $${params.length}::uuid)`,
      );
    }
    const order = args.direction === 'asc' ? 'ASC' : 'DESC';
    params.push(args.limit + 1);
    const result = await tx.query<AuditDbRow>(
      `SELECT ${AUDIT_COLUMNS} ${AUDIT_FROM}
        WHERE ${conditions.join(' AND ')}
        ORDER BY a.scheduled_for ${order}, a.id ${order}
        LIMIT $${params.length}`,
      params,
    );
    const rows = result.rows.slice(0, args.limit).map(toAuditRow);
    const last = rows[rows.length - 1];
    const next =
      result.rows.length > args.limit && last !== undefined
        ? { scheduledFor: last.scheduledForCursor, id: last.id }
        : null;
    return { rows, next };
  },

  async findCategoryScores(tx, auditId) {
    const result = await tx.query<{ category_id: string; score: number; remarks: string | null }>(
      `SELECT category_id, score, remarks FROM audit_category_scores WHERE audit_id = $1`,
      [auditId],
    );
    return result.rows.map((row) => ({ categoryId: row.category_id, score: Number(row.score), remarks: row.remarks }));
  },

  async findFindings(tx, auditId) {
    const result = await tx.query<FindingDbRow>(
      `${FINDING_SELECT} WHERE af.audit_id = $1 ORDER BY af.created_at, af.id`,
      [auditId],
    );
    return result.rows.map(toFindingRow);
  },

  async findFinding(tx, auditId, findingId) {
    const result = await tx.query<FindingDbRow>(`${FINDING_SELECT} WHERE af.audit_id = $1 AND af.id = $2`, [
      auditId,
      findingId,
    ]);
    const row = result.rows[0];
    return row === undefined ? null : toFindingRow(row);
  },

  async countMajorFindings(tx, auditId) {
    const result = await tx.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM audit_findings WHERE audit_id = $1 AND severity = 'MAJOR'`,
      [auditId],
    );
    return Number(result.rows[0]?.n ?? 0);
  },

  async updateSchedule(tx, id, patch) {
    const columns: Array<[keyof SchedulePatch, string]> = [
      ['scheduledFor', 'scheduled_for'],
      ['fiscalYear', 'fiscal_year'],
      ['quarter', 'quarter'],
      ['farmId', 'farm_id'],
      ['auditorUserId', 'auditor_user_id'],
      ['externalAgencyName', 'external_agency_name'],
    ];
    const params: unknown[] = [id];
    const sets: string[] = [];
    for (const [key, column] of columns) {
      if (patch[key] === undefined) continue;
      params.push(patch[key]);
      sets.push(`${column} = $${params.length}`);
    }
    if (sets.length === 0) return;
    await tx.query(`UPDATE audits SET ${sets.join(', ')} WHERE id = $1`, params);
  },

  async markStarted(tx, id, auditorUserId) {
    await tx.query(
      `UPDATE audits
          SET status = 'IN_PROGRESS', started_at = now(), auditor_user_id = COALESCE($2, auditor_user_id)
        WHERE id = $1`,
      [id, auditorUserId],
    );
  },

  async upsertScores(tx, auditId, scores) {
    for (const score of scores) {
      await tx.query(
        `INSERT INTO audit_category_scores (audit_id, category_id, score, remarks, scored_by)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (audit_id, category_id) DO UPDATE SET
           score     = EXCLUDED.score,
           remarks   = COALESCE(EXCLUDED.remarks, audit_category_scores.remarks),
           scored_by = EXCLUDED.scored_by`,
        [auditId, score.categoryId, score.score, score.remarks, score.scoredBy],
      );
    }
  },

  async updateSummaryAndReport(tx, id, data) {
    const params: unknown[] = [id];
    const sets: string[] = [];
    if (data.summary !== undefined) {
      params.push(data.summary);
      sets.push(`summary = $${params.length}`);
    }
    if (data.reportUploadId !== undefined) {
      params.push(data.reportUploadId);
      sets.push(`report_upload_id = $${params.length}`);
    }
    if (sets.length === 0) return;
    await tx.query(`UPDATE audits SET ${sets.join(', ')} WHERE id = $1`, params);
  },

  async markCompleted(tx, id, data) {
    await tx.query(
      `UPDATE audits
          SET status = 'COMPLETED', completed_at = now(), total_score = $2, major_violations_count = $3
        WHERE id = $1`,
      [id, data.totalScore, data.majorViolationsCount],
    );
  },

  async markCancelled(tx, id, data) {
    await tx.query(
      `UPDATE audits
          SET status = 'CANCELLED', cancelled_at = now(), cancelled_reason = $2, cancelled_by = $3
        WHERE id = $1`,
      [id, data.reason, data.cancelledBy],
    );
  },

  async setRedFlag(tx, id, data) {
    await tx.query(
      `UPDATE audits
          SET red_flagged = true, red_flag_reason = $2, red_flagged_by = $3, red_flagged_at = now()
        WHERE id = $1`,
      [id, data.reason, data.flaggedBy],
    );
  },

  async clearRedFlag(tx, id) {
    await tx.query(
      `UPDATE audits
          SET red_flagged = false, red_flag_reason = NULL, red_flagged_by = NULL, red_flagged_at = NULL
        WHERE id = $1`,
      [id],
    );
  },

  async insertFinding(tx, data) {
    const result = await tx.query<{ id: string }>(
      `INSERT INTO audit_findings (audit_id, category_id, severity, description, corrective_action, due_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        data.auditId,
        data.categoryId,
        data.severity,
        data.description,
        data.correctiveAction,
        data.dueDate,
        data.createdBy,
      ],
    );
    return result.rows[0]!.id;
  },

  async updateFinding(tx, findingId, patch) {
    const columns: Array<[keyof FindingPatch, string]> = [
      ['severity', 'severity'],
      ['categoryId', 'category_id'],
      ['description', 'description'],
      ['correctiveAction', 'corrective_action'],
      ['dueDate', 'due_date'],
      ['resolutionNote', 'resolution_note'],
    ];
    const params: unknown[] = [findingId];
    const sets: string[] = [];
    for (const [key, column] of columns) {
      if (patch[key] === undefined) continue;
      params.push(patch[key]);
      sets.push(`${column} = $${params.length}`);
    }
    if (patch.resolvedBy !== undefined) {
      if (patch.resolvedBy === null) {
        sets.push('resolved_at = NULL', 'resolved_by = NULL');
      } else {
        params.push(patch.resolvedBy);
        sets.push('resolved_at = now()', `resolved_by = $${params.length}`);
      }
    }
    if (sets.length === 0) return;
    await tx.query(`UPDATE audit_findings SET ${sets.join(', ')} WHERE id = $1`, params);
  },

  async complianceCounts(tx, args) {
    const params: unknown[] = [];
    const ctes = complianceCtes(args, params);
    params.push(args.requiredCount, args.now, args.currentQuarter);
    const req = params.length - 2;
    const now = params.length - 1;
    const cq = params.length;
    const result = await tx.query<Record<string, number>>(
      `${ctes}
       SELECT
         (SELECT count(*) FROM pop)::int AS farmers_in_scope,
         (SELECT count(*) FROM pop
           WHERE (SELECT count(*) FROM fy WHERE fy.farmer_id = pop.id AND fy.status = 'COMPLETED') >= $${req}::int
         )::int AS farmers_at_required,
         (SELECT count(*) FROM fy
           WHERE fy.status IN ('SCHEDULED', 'IN_PROGRESS') AND fy.scheduled_for < $${now}::timestamptz)::int AS overdue_audits,
         (CASE WHEN $${cq}::smallint IS NULL THEN 0 ELSE
           (SELECT count(*) FROM pop WHERE NOT EXISTS (
              SELECT 1 FROM fy WHERE fy.farmer_id = pop.id AND fy.quarter = $${cq}::smallint AND fy.status <> 'CANCELLED'))
          END)::int AS farmers_without_current_quarter_audit,
         (SELECT count(*) FROM fy WHERE fy.red_flagged)::int AS red_flagged_audits,
         (SELECT count(DISTINCT fy.farmer_id) FROM fy WHERE fy.red_flagged)::int AS red_flagged_farmers,
         (SELECT count(*) FROM audit_findings af JOIN fy ON fy.id = af.audit_id
           WHERE fy.status <> 'CANCELLED' AND af.severity = 'MAJOR' AND af.resolved_at IS NULL)::int AS open_major_findings,
         (CASE WHEN $${cq}::smallint IS NULL THEN 0 ELSE
           (SELECT count(*) FROM fy WHERE fy.quarter = $${cq}::smallint AND fy.status <> 'CANCELLED')
          END)::int AS scheduled_this_quarter`,
      params,
    );
    const row = result.rows[0] ?? {};
    const n = (key: string): number => Number(row[key] ?? 0);
    return {
      farmersInScope: n('farmers_in_scope'),
      farmersAtRequired: n('farmers_at_required'),
      overdueAudits: n('overdue_audits'),
      farmersWithoutCurrentQuarterAudit: n('farmers_without_current_quarter_audit'),
      redFlaggedAudits: n('red_flagged_audits'),
      redFlaggedFarmers: n('red_flagged_farmers'),
      openMajorFindings: n('open_major_findings'),
      scheduledThisQuarter: n('scheduled_this_quarter'),
    };
  },

  async complianceFarmers(tx, args) {
    const params: unknown[] = [];
    const ctes = complianceCtes(args, params);
    params.push(args.currentQuarter);
    const cq = params.length;
    const conditions: string[] = [];
    switch (args.completed.kind) {
      case 'all':
        break;
      case 'none':
        conditions.push('FALSE');
        break;
      case 'atLeast':
        params.push(args.completed.value);
        conditions.push(`per.completed_count >= $${params.length}::int`);
        break;
      case 'below':
        params.push(args.completed.value);
        conditions.push(`per.completed_count < $${params.length}::int`);
        break;
    }
    if (args.cursor !== undefined) {
      params.push(args.cursor.tohfaFarmerId, args.cursor.id);
      conditions.push(`(per.tohfa_farmer_id, per.id) > ($${params.length - 1}, $${params.length}::uuid)`);
    }
    params.push(args.limit + 1);
    const result = await tx.query<{
      id: string;
      tohfa_farmer_id: string;
      farmer_name: string;
      zone_id: string | null;
      zone_name: string | null;
      completed_count: number;
      red_flagged_count: number;
      open_major: number;
      cq_id: string | null;
      cq_status: AuditStatus | null;
      cq_scheduled_for: Date | null;
    }>(
      `${ctes},
       per AS (
         SELECT pop.*,
                (SELECT count(*) FROM fy WHERE fy.farmer_id = pop.id AND fy.status = 'COMPLETED')::int AS completed_count,
                (SELECT count(*) FROM fy WHERE fy.farmer_id = pop.id AND fy.red_flagged)::int AS red_flagged_count,
                (SELECT count(*) FROM audit_findings af JOIN fy ON fy.id = af.audit_id
                  WHERE fy.farmer_id = pop.id AND fy.status <> 'CANCELLED'
                    AND af.severity = 'MAJOR' AND af.resolved_at IS NULL)::int AS open_major
           FROM pop
       )
       SELECT per.*, cq.id AS cq_id, cq.status AS cq_status, cq.scheduled_for AS cq_scheduled_for
         FROM per
         LEFT JOIN LATERAL (
           SELECT fy.id, fy.status, fy.scheduled_for FROM fy
            WHERE fy.farmer_id = per.id AND fy.quarter = $${cq}::smallint AND fy.status <> 'CANCELLED'
            LIMIT 1
         ) cq ON TRUE
        WHERE ${conditions.length === 0 ? 'TRUE' : conditions.join(' AND ')}
        ORDER BY per.tohfa_farmer_id, per.id
        LIMIT $${params.length}`,
      params,
    );
    const rows: ComplianceFarmerRow[] = result.rows.slice(0, args.limit).map((row) => ({
      farmerId: row.id,
      tohfaFarmerId: row.tohfa_farmer_id,
      farmerName: row.farmer_name,
      zoneId: row.zone_id,
      zoneName: row.zone_name,
      completedCount: Number(row.completed_count),
      redFlaggedAuditCount: Number(row.red_flagged_count),
      openMajorFindingCount: Number(row.open_major),
      currentQuarterAudit:
        row.cq_id === null || row.cq_status === null || row.cq_scheduled_for === null
          ? null
          : { auditId: row.cq_id, status: row.cq_status, scheduledFor: row.cq_scheduled_for },
    }));
    const last = rows[rows.length - 1];
    const next =
      result.rows.length > args.limit && last !== undefined
        ? { tohfaFarmerId: last.tohfaFarmerId, id: last.farmerId }
        : null;
    return { rows, next };
  },

  async findReportContext(tx, auditId) {
    const farm = await tx.query<{ village: string | null; taluk: string | null; district: string | null }>(
      `SELECT fa.village, fa.taluk, fa.district
         FROM audits a LEFT JOIN farms fa ON fa.id = a.farm_id
        WHERE a.id = $1`,
      [auditId],
    );
    const names = await tx.query<{ code: string; name: string }>(`SELECT code, name FROM rating_categories`);
    const row = farm.rows[0];
    return {
      farmVillage: row?.village ?? null,
      farmTaluk: row?.taluk ?? null,
      farmDistrict: row?.district ?? null,
      categoryNames: Object.fromEntries(names.rows.map((r) => [r.code, r.name])),
    };
  },
};
