/**
 * Audit Management tests. Written BEFORE the implementation (root CLAUDE.md
 * §2.6). Rule tests carry their docs/rules.md id.
 *
 *   1. Pure fiscal-period helpers (BR-03a derivation in Asia/Kolkata).
 *   2. Service unit tests against a stateful in-memory fake repo. The fake
 *      enforces the BR-03a partial unique index the way Postgres does (a
 *      23505 on uq_audits_farmer_fy_quarter), so the service's error mapping
 *      is exercised, not assumed.
 *   3. Route-level tests through createApp() with real requireAuth /
 *      requirePermission wiring (service or repo spied, no database).
 *   4. Integration tests against a real, migrated database (DATABASE_URL),
 *      soft-skipped when the `audits` table does not exist.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { AuditEntry } from '../../audit/auditLog.js';
import { signAccessToken } from '../../auth/jwt.js';
import { createApp } from '../../app.js';
import { pool, type Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import { farmRatingsRepo } from '../farm-ratings/farm-ratings.repo.js';
import { farmRatingsService, type AuditRatingInput } from '../farm-ratings/farm-ratings.service.js';
import {
  auditsRepo,
  type ActiveCategoryRow,
  type AuditAccess,
  type AuditRow,
  type AuditsRepo,
  type ComplianceFarmerRow,
  type FindingRow,
  type UploadRef,
} from './audits.repo.js';
import {
  auditCreateBody,
  auditDetail,
  farmerAuditDetail,
  farmerAuditSummary,
  type AuditFindingCreateBody,
  type AuditScoresBody,
  type ReportQuery,
} from './audits.schema.js';
import {
  auditsService,
  complianceStatusFor,
  createAuditsService,
  fiscalPeriodOf,
  isFiscalYearClosed,
  type AuditsService,
} from './audits.service.js';
import { renderAuditReportPdf, type AuditReportPdfInput } from './pdf/audit-report-pdf.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ZONE_NORTH: string = IDS.zoneNorth;
const ZONE_SOUTH = '20000000-0000-4000-8000-000000000002';
const FARMER_A: string = IDS.farmer;
const FARMER_B = '30000000-0000-4000-8000-000000000002';
const FARMER_C = '30000000-0000-4000-8000-000000000003';
const FARM_A = '50000000-0000-4000-8000-000000000001';
const FARM_B = '50000000-0000-4000-8000-000000000002';
const AUDITOR = '00000000-0000-4000-8000-0000000000aa';
const ADMIN = IDS.userSuperAdmin;

/** 1 Oct 2026, 11:30 IST: fiscal year 2026-27, Q3. */
const NOW = new Date('2026-10-01T06:00:00Z');

const CATEGORIES: ActiveCategoryRow[] = [
  'CERTIFICATION',
  'SOIL_LAND',
  'FARMING_PRACTICES',
  'ENVIRONMENTAL',
  'PRODUCE_QUALITY',
  'TRACEABILITY',
  'SOCIAL_LABOR',
  'FINANCIAL',
  'MARKET_RELATIONS',
  'INNOVATION',
].map((code, index) => ({ id: `cat-${code}`, code, sortOrder: index + 1 }));

const scoresFrom = (values: number[]): AuditScoresBody['scores'] =>
  CATEGORIES.map((category, index) => ({
    categoryCode: category.code as AuditScoresBody['scores'][number]['categoryCode'],
    score: values[index]!,
  }));

const ALL_SEVENS = scoresFrom([7, 7, 7, 7, 7, 7, 7, 7, 7, 7]); // 70

// ---------------------------------------------------------------------------
// Scopes
// ---------------------------------------------------------------------------

const adminScope = (permission: string): ResolvedScope =>
  aScope({ level: ScopeLevel.ALL, permission, roleCode: RoleCode.SUPER_ADMIN, userId: ADMIN });

const farmerAdminScope = (
  permission: string,
  zoneIds: string[] = [ZONE_NORTH],
  predicate: string | undefined = 'OWN_ZONE_ONLY',
): ResolvedScope =>
  aScope({
    level: ScopeLevel.CONDITIONAL,
    permission,
    roleCode: RoleCode.FARMER_ADMIN,
    zoneIds,
    userId: IDS.userFarmerAdmin,
    ...(predicate === undefined ? {} : { predicate }),
  });

const farmerScope = (farmerId: string, permission = 'audit.view'): ResolvedScope =>
  aScope({ level: ScopeLevel.OWN, permission, roleCode: RoleCode.FARMER, farmerId, userId: IDS.userFarmer });

// ---------------------------------------------------------------------------
// Stateful fake repo
// ---------------------------------------------------------------------------

interface StoredAudit extends Omit<AuditRow, 'findingCounts' | 'farmerZoneId' | 'scheduledForCursor'> {
  farmId: string | null;
}

interface StoredFinding extends Omit<FindingRow, 'resolvedByName'> {
  resolvedBy: string | null;
}

interface FakeWorld {
  repo: AuditsRepo;
  audits: Map<string, StoredAudit>;
  scores: Map<string, Map<string, { score: number; remarks: string | null }>>;
  findings: Map<string, StoredFinding>;
  uploads: Map<string, UploadRef>;
  /** Executor each mutating repo call received. */
  writeTxs: Executor[];
}

const FARMERS: Record<string, { zoneId: string | null; name: string; tohfaId: string }> = {
  [FARMER_A]: { zoneId: ZONE_NORTH, name: 'Farmer A', tohfaId: 'TOHFA-F-A' },
  [FARMER_B]: { zoneId: ZONE_SOUTH, name: 'Farmer B', tohfaId: 'TOHFA-F-B' },
  [FARMER_C]: { zoneId: ZONE_NORTH, name: 'Farmer C', tohfaId: 'TOHFA-F-C' },
};
const FARMS: Record<string, string> = { [FARM_A]: FARMER_A, [FARM_B]: FARMER_B };

function quarterTaken(): Error {
  return Object.assign(new Error('duplicate key value violates unique constraint "uq_audits_farmer_fy_quarter"'), {
    code: '23505',
    constraint: 'uq_audits_farmer_fy_quarter',
  });
}

/** Interprets the ScopedWhere the service hands over: TRUE, FALSE, zone list, farmer id. */
function visible(access: AuditAccess, audit: StoredAudit): boolean {
  if (access.farmerId !== undefined && audit.farmerId !== access.farmerId) return false;
  const { sql, params } = access.scope;
  if (sql === 'TRUE') return true;
  if (sql === 'FALSE') return false;
  const zone = FARMERS[audit.farmerId]?.zoneId ?? null;
  for (const param of params) {
    if (Array.isArray(param) && !(param as string[]).includes(zone ?? '')) return false;
    if (typeof param === 'string' && audit.farmerId !== param) return false;
  }
  return true;
}

function createFakeWorld(): FakeWorld {
  const audits = new Map<string, StoredAudit>();
  const scores = new Map<string, Map<string, { score: number; remarks: string | null }>>();
  const findings = new Map<string, StoredFinding>();
  const uploads = new Map<string, UploadRef>();
  const writeTxs: Executor[] = [];

  const assertQuarterFree = (farmerId: string, fiscalYear: string, quarter: number, exceptId?: string): void => {
    for (const audit of audits.values()) {
      if (
        audit.id !== exceptId &&
        audit.status !== 'CANCELLED' &&
        audit.farmerId === farmerId &&
        audit.fiscalYear === fiscalYear &&
        audit.quarter === quarter
      ) {
        throw quarterTaken();
      }
    }
  };

  const toRow = (audit: StoredAudit): AuditRow => {
    const own = [...findings.values()].filter((f) => f.auditId === audit.id);
    return {
      ...structuredClone(audit),
      farmerZoneId: FARMERS[audit.farmerId]?.zoneId ?? null,
      scheduledForCursor: audit.scheduledFor.toISOString(),
      findingCounts: {
        major: own.filter((f) => f.severity === 'MAJOR').length,
        minor: own.filter((f) => f.severity === 'MINOR').length,
        observation: own.filter((f) => f.severity === 'OBSERVATION').length,
        openMajor: own.filter((f) => f.severity === 'MAJOR' && f.resolvedAt === null).length,
      },
    };
  };

  const toFinding = (finding: StoredFinding): FindingRow => {
    const { resolvedBy, ...rest } = finding;
    return { ...rest, resolvedByName: resolvedBy === null ? null : `User ${resolvedBy}` };
  };

  const mutate = (tx: Executor, id: string): StoredAudit => {
    writeTxs.push(tx);
    const audit = audits.get(id);
    if (audit === undefined) throw new Error(`fake: no audit ${id}`);
    audit.updatedAt = new Date();
    return audit;
  };

  const completedIn = (farmerId: string, fiscalYear: string): number =>
    [...audits.values()].filter(
      (a) => a.farmerId === farmerId && a.fiscalYear === fiscalYear && a.status === 'COMPLETED',
    ).length;

  const repo: AuditsRepo = {
    findActiveCategories: async () => CATEGORIES,
    findFarmer: async (_tx, farmerId) => {
      const farmer = FARMERS[farmerId];
      return farmer === undefined ? null : { id: farmerId, zoneId: farmer.zoneId };
    },
    farmBelongsToFarmer: async (_tx, farmId, farmerId) => FARMS[farmId] === farmerId,
    userExists: async (_tx, userId) => [ADMIN, AUDITOR, IDS.userTohfaAdmin].includes(userId),
    findUploadByStorageKey: async (_tx, key) => uploads.get(key) ?? null,

    insertAudit: async (tx, data) => {
      writeTxs.push(tx);
      assertQuarterFree(data.farmerId, data.fiscalYear, data.quarter);
      const id = newId();
      const farmer = FARMERS[data.farmerId]!;
      audits.set(id, {
        id,
        farmerId: data.farmerId,
        tohfaFarmerId: farmer.tohfaId,
        farmerName: farmer.name,
        farmId: data.farmId,
        farmName: data.farmId === null ? null : `Farm ${data.farmId.slice(-1)}`,
        zoneId: data.zoneId,
        zoneName: data.zoneId === null ? null : 'Zone',
        fiscalYear: data.fiscalYear,
        quarter: data.quarter,
        auditType: data.auditType,
        status: 'SCHEDULED',
        scheduledFor: data.scheduledFor,
        startedAt: null,
        completedAt: null,
        auditorUserId: data.auditorUserId,
        auditorName: data.auditorUserId === null ? null : 'Auditor',
        externalAgencyName: data.externalAgencyName,
        reportUpload: null,
        summary: null,
        totalScore: null,
        majorViolationsCount: 0,
        redFlagged: false,
        redFlagReason: null,
        redFlaggedAt: null,
        redFlaggedByName: null,
        cancelledReason: null,
        cancelledAt: null,
        createdByName: 'Admin',
        createdAt: new Date(),
        updatedAt: null,
      });
      return id;
    },
    findAudit: async (_tx, id, access) => {
      const audit = audits.get(id);
      return audit === undefined || !visible(access, audit) ? null : toRow(audit);
    },
    listAudits: async (_tx, args) => {
      const rows = [...audits.values()]
        .filter((a) => visible(args.access, a))
        .filter((a) => args.statuses === undefined || args.statuses.includes(a.status))
        .filter((a) => args.fiscalYear === undefined || a.fiscalYear === args.fiscalYear)
        .filter((a) => args.type === undefined || a.auditType === args.type)
        .filter((a) => args.redFlagged === undefined || a.redFlagged === args.redFlagged)
        .sort((x, y) =>
          args.direction === 'asc'
            ? x.scheduledFor.getTime() - y.scheduledFor.getTime()
            : y.scheduledFor.getTime() - x.scheduledFor.getTime(),
        )
        .slice(0, args.limit)
        .map(toRow);
      return { rows, next: null };
    },
    findCategoryScores: async (_tx, auditId) =>
      [...(scores.get(auditId) ?? new Map()).entries()].map(([categoryId, value]) => ({
        categoryId,
        score: value.score,
        remarks: value.remarks,
      })),
    findFindings: async (_tx, auditId) =>
      [...findings.values()].filter((f) => f.auditId === auditId).map(toFinding),
    findFinding: async (_tx, auditId, findingId) => {
      const finding = findings.get(findingId);
      return finding === undefined || finding.auditId !== auditId ? null : toFinding(finding);
    },
    countMajorFindings: async (_tx, auditId) =>
      [...findings.values()].filter((f) => f.auditId === auditId && f.severity === 'MAJOR').length,

    updateSchedule: async (tx, id, patch) => {
      const audit = audits.get(id)!;
      if (patch.fiscalYear !== undefined && patch.quarter !== undefined) {
        assertQuarterFree(audit.farmerId, patch.fiscalYear, patch.quarter, id);
      }
      const target = mutate(tx, id);
      if (patch.scheduledFor !== undefined) target.scheduledFor = patch.scheduledFor;
      if (patch.fiscalYear !== undefined) target.fiscalYear = patch.fiscalYear;
      if (patch.quarter !== undefined) target.quarter = patch.quarter;
      if (patch.farmId !== undefined) target.farmId = patch.farmId;
      if (patch.auditorUserId !== undefined) target.auditorUserId = patch.auditorUserId;
      if (patch.externalAgencyName !== undefined) target.externalAgencyName = patch.externalAgencyName;
    },
    markStarted: async (tx, id, auditorUserId) => {
      const audit = mutate(tx, id);
      audit.status = 'IN_PROGRESS';
      audit.startedAt = new Date();
      if (auditorUserId !== null) audit.auditorUserId = auditorUserId;
    },
    upsertScores: async (tx, auditId, input) => {
      writeTxs.push(tx);
      const sheet = scores.get(auditId) ?? new Map<string, { score: number; remarks: string | null }>();
      for (const score of input) sheet.set(score.categoryId, { score: score.score, remarks: score.remarks });
      scores.set(auditId, sheet);
    },
    updateSummaryAndReport: async (tx, id, data) => {
      const audit = mutate(tx, id);
      if (data.summary !== undefined) audit.summary = data.summary;
      if (data.reportUploadId !== undefined) {
        const upload = [...uploads.values()].find((u) => u.id === data.reportUploadId)!;
        audit.reportUpload = {
          uploadId: upload.id,
          storageKey: upload.storageKey,
          mimeType: upload.mimeType,
          sizeBytes: upload.sizeBytes,
        };
      }
    },
    markCompleted: async (tx, id, data) => {
      const audit = mutate(tx, id);
      audit.status = 'COMPLETED';
      audit.completedAt = new Date();
      audit.totalScore = data.totalScore;
      audit.majorViolationsCount = data.majorViolationsCount;
    },
    markCancelled: async (tx, id, data) => {
      const audit = mutate(tx, id);
      audit.status = 'CANCELLED';
      audit.cancelledAt = new Date();
      audit.cancelledReason = data.reason;
    },
    setRedFlag: async (tx, id, data) => {
      const audit = mutate(tx, id);
      audit.redFlagged = true;
      audit.redFlagReason = data.reason;
      audit.redFlaggedAt = new Date();
      audit.redFlaggedByName = 'Admin';
    },
    clearRedFlag: async (tx, id) => {
      const audit = mutate(tx, id);
      audit.redFlagged = false;
      audit.redFlagReason = null;
      audit.redFlaggedAt = null;
      audit.redFlaggedByName = null;
    },
    insertFinding: async (tx, data) => {
      writeTxs.push(tx);
      const id = newId();
      findings.set(id, {
        id,
        auditId: data.auditId,
        severity: data.severity,
        categoryId: data.categoryId,
        categoryCode: CATEGORIES.find((c) => c.id === data.categoryId)?.code ?? null,
        description: data.description,
        correctiveAction: data.correctiveAction,
        dueDate: data.dueDate,
        resolvedAt: null,
        resolvedBy: null,
        resolutionNote: null,
        createdAt: new Date(),
      });
      return id;
    },
    updateFinding: async (tx, findingId, patch) => {
      writeTxs.push(tx);
      const finding = findings.get(findingId)!;
      if (patch.severity !== undefined) finding.severity = patch.severity;
      if (patch.categoryId !== undefined) {
        finding.categoryId = patch.categoryId;
        finding.categoryCode = CATEGORIES.find((c) => c.id === patch.categoryId)?.code ?? null;
      }
      if (patch.description !== undefined) finding.description = patch.description;
      if (patch.correctiveAction !== undefined) finding.correctiveAction = patch.correctiveAction;
      if (patch.dueDate !== undefined) finding.dueDate = patch.dueDate;
      if (patch.resolutionNote !== undefined) finding.resolutionNote = patch.resolutionNote;
      if (patch.resolvedBy !== undefined) {
        finding.resolvedBy = patch.resolvedBy;
        finding.resolvedAt = patch.resolvedBy === null ? null : new Date();
      }
    },

    complianceCounts: async (_tx, args) => {
      const population = Object.entries(FARMERS).filter(([, f]) =>
        args.scope.sql === 'TRUE' ? true : args.scope.params.some((p) => Array.isArray(p) && p.includes(f.zoneId)),
      );
      return {
        farmersInScope: population.length,
        farmersAtRequired: population.filter(([id]) => completedIn(id, args.fiscalYear) >= args.requiredCount)
          .length,
        overdueAudits: 0,
        farmersWithoutCurrentQuarterAudit: 0,
        redFlaggedAudits: 0,
        redFlaggedFarmers: 0,
        openMajorFindings: 0,
        scheduledThisQuarter: 0,
      };
    },
    complianceFarmers: async (_tx, args) => {
      const rows: ComplianceFarmerRow[] = Object.entries(FARMERS)
        .filter(([, f]) =>
          args.scope.sql === 'TRUE' ? true : args.scope.params.some((p) => Array.isArray(p) && p.includes(f.zoneId)),
        )
        .map(([id, f]) => ({
          farmerId: id,
          tohfaFarmerId: f.tohfaId,
          farmerName: f.name,
          zoneId: f.zoneId,
          zoneName: null,
          completedCount: completedIn(id, args.fiscalYear),
          redFlaggedAuditCount: 0,
          openMajorFindingCount: 0,
          currentQuarterAudit: null,
        }))
        .filter((row) => {
          switch (args.completed.kind) {
            case 'all':
              return true;
            case 'none':
              return false;
            case 'atLeast':
              return row.completedCount >= args.completed.value;
            case 'below':
              return row.completedCount < args.completed.value;
          }
        });
      return { rows, next: null };
    },
    findReportContext: async () => ({
      farmVillage: 'Kotagiri',
      farmTaluk: 'Kotagiri',
      farmDistrict: 'The Nilgiris',
      categoryNames: Object.fromEntries(CATEGORIES.map((c) => [c.code, c.code.toLowerCase()])),
    }),
  };

  return { repo, audits, scores, findings, uploads, writeTxs };
}

// ---------------------------------------------------------------------------
// Service harness
// ---------------------------------------------------------------------------

/** A tx/db that fails loudly if the service ever issues SQL itself. */
const noSql = (label: string): Executor =>
  ({
    query: async () => {
      throw new Error(`${label}: the audits service must not issue SQL outside its repo`);
    },
  }) as unknown as Executor;

const TX = noSql('tx');
const DB = noSql('db');

/** BR-04: the tier bands are DATA. Mutable here so a test can change "config". */
let tierConfig: Array<{ code: string; min: number; max: number | null }>;
const SEEDED_TIERS = [
  { code: 'POOR', min: 0, max: 50 },
  { code: 'MODERATE', min: 50, max: 70 },
  { code: 'GOOD', min: 70, max: 85 },
  { code: 'EXCELLENT', min: 85, max: null },
];

interface Harness {
  service: AuditsService;
  world: FakeWorld;
  auditLog: Array<{ tx: Executor; entry: AuditEntry }>;
  /** Every call the service made to the farm-rating recorder (BR-06c). */
  ratingCalls: Array<{ tx: Executor; input: AuditRatingInput }>;
  pdfInputs: AuditReportPdfInput[];
  setNow(date: Date): void;
}

function harness(overrides: { writeAuditFails?: boolean; recordRatingFails?: boolean } = {}): Harness {
  const world = createFakeWorld();
  const auditLog: Array<{ tx: Executor; entry: AuditEntry }> = [];
  const ratingCalls: Array<{ tx: Executor; input: AuditRatingInput }> = [];
  const pdfInputs: AuditReportPdfInput[] = [];
  let now = NOW;
  const service = createAuditsService({
    repo: world.repo,
    runTx: async (fn) => fn(TX),
    db: DB,
    resolveTier: async (_tx, score) =>
      tierConfig.find((band) => score >= band.min && (band.max === null || score < band.max))?.code ?? null,
    writeAudit: async (tx, entry) => {
      if (overrides.writeAuditFails === true) throw new Error('audit_log insert failed');
      auditLog.push({ tx, entry });
      return 'audit-log-id';
    },
    recordRating: async (tx, input) => {
      if (overrides.recordRatingFails === true) throw new Error('farm rating insert failed');
      ratingCalls.push({ tx, input: structuredClone(input) });
    },
    storage: { download: async (key) => (key.startsWith('audit_report/') ? Buffer.from('agency-bytes') : null) },
    renderPdf: async (input) => {
      pdfInputs.push(input);
      return Buffer.from('%PDF-1.3 fake');
    },
    now: () => now,
    signingSecret: 'unit-test-signing-secret-that-is-long-enough',
  });
  return {
    service,
    world,
    auditLog,
    ratingCalls,
    pdfInputs,
    setNow: (date) => {
      now = date;
    },
  };
}

const SCHEDULE = adminScope('audit.schedule');
const CONDUCT = adminScope('audit.conduct');
const SCORE = adminScope('audit.score.categories');
const FINDINGS = adminScope('audit.findings.log');
const RED_FLAG = adminScope('audit.red_flag.manage');
const VIEW = adminScope('audit.view');

async function scheduleInternal(
  h: Harness,
  farmerId = FARMER_A,
  scheduledFor = '2026-11-05T04:30:00Z',
): Promise<string> {
  const detail = await h.service.schedule(SCHEDULE, {
    farmerId,
    auditType: 'INTERNAL',
    scheduledFor,
    auditorUserId: AUDITOR,
  });
  return detail.id;
}

async function inProgress(h: Harness, farmerId = FARMER_A, scheduledFor?: string): Promise<string> {
  const id = await scheduleInternal(h, farmerId, scheduledFor);
  await h.service.start(CONDUCT, id, {});
  return id;
}

async function completed(
  h: Harness,
  options: { farmerId?: string; scheduledFor?: string; findings?: AuditFindingCreateBody[]; scores?: number[] } = {},
): Promise<string> {
  const id = await inProgress(h, options.farmerId, options.scheduledFor);
  await h.service.setScores(SCORE, id, {
    scores: options.scores === undefined ? ALL_SEVENS : scoresFrom(options.scores),
  });
  for (const finding of options.findings ?? []) await h.service.createFinding(FINDINGS, id, finding);
  await h.service.complete(CONDUCT, id, {});
  return id;
}

const MAJOR: AuditFindingCreateBody = { severity: 'MAJOR', description: 'Synthetic pesticide drums found.' };
const MINOR: AuditFindingCreateBody = { severity: 'MINOR', description: 'Input register incomplete.' };

beforeEach(() => {
  tierConfig = SEEDED_TIERS.map((band) => ({ ...band }));
});

// ===========================================================================
// 1. Fiscal period (pure)
// ===========================================================================

describe('audits: fiscal period in Asia/Kolkata (BR-03a)', () => {
  it('BR-03a: derives fiscal year 2026-27 / Q4 from a scheduledFor of 15 Feb 2027 IST', () => {
    expect(fiscalPeriodOf(new Date('2027-02-15T10:00:00+05:30'))).toEqual({ fiscalYear: '2026-27', quarter: 4 });
  });

  it('BR-03a: 1 Apr 00:30 IST (= 31 Mar 19:00Z) is Q1 of the NEW fiscal year; 31 Mar 23:59 IST is still Q4', () => {
    expect(fiscalPeriodOf(new Date('2027-03-31T19:00:00Z'))).toEqual({ fiscalYear: '2027-28', quarter: 1 });
    expect(fiscalPeriodOf(new Date('2027-03-31T18:29:00Z'))).toEqual({ fiscalYear: '2026-27', quarter: 4 });
  });

  it('BR-03a: Q1 Apr-Jun, Q2 Jul-Sep, Q3 Oct-Dec, Q4 Jan-Mar (IST boundaries, not UTC)', () => {
    expect(fiscalPeriodOf(new Date('2026-04-01T00:00:00+05:30')).quarter).toBe(1);
    expect(fiscalPeriodOf(new Date('2026-06-30T23:59:00+05:30')).quarter).toBe(1);
    expect(fiscalPeriodOf(new Date('2026-07-01T00:10:00+05:30')).quarter).toBe(2);
    // 30 Sep 19:00Z is 1 Oct 00:30 IST — Q3 in India even though it is still September in UTC.
    expect(fiscalPeriodOf(new Date('2026-09-30T19:00:00Z')).quarter).toBe(3);
    expect(fiscalPeriodOf(new Date('2026-12-31T23:59:00+05:30'))).toEqual({ fiscalYear: '2026-27', quarter: 3 });
    expect(fiscalPeriodOf(new Date('2027-01-01T00:00:00+05:30'))).toEqual({ fiscalYear: '2026-27', quarter: 4 });
  });

  it('BR-03b: a fiscal year closes at 1 Apr 00:00 IST of the following year', () => {
    expect(isFiscalYearClosed('2026-27', new Date('2027-03-31T18:29:59Z'))).toBe(false);
    expect(isFiscalYearClosed('2026-27', new Date('2027-03-31T18:30:00Z'))).toBe(true);
  });

  it('BR-03b: fewer than 4 completed is PENDING while the year is open and NON_COMPLIANT once it has closed; 4 is COMPLIANT', () => {
    expect(complianceStatusFor(3, false)).toBe('PENDING');
    expect(complianceStatusFor(0, false)).toBe('PENDING');
    expect(complianceStatusFor(3, true)).toBe('NON_COMPLIANT');
    expect(complianceStatusFor(4, false)).toBe('COMPLIANT');
    expect(complianceStatusFor(4, true)).toBe('COMPLIANT');
  });
});

// ===========================================================================
// 2. Service
// ===========================================================================

describe('AuditsService (Unit)', () => {
  describe('scheduling (BR-03a)', () => {
    it('BR-03a: stores the fiscal year and quarter derived from scheduledFor; the client cannot send them', async () => {
      const h = harness();
      const detail = await h.service.schedule(SCHEDULE, {
        farmerId: FARMER_A,
        auditType: 'EXTERNAL',
        scheduledFor: '2027-02-15T04:30:00Z',
        externalAgencyName: 'PGS Regional Council',
      });
      expect(detail).toMatchObject({ fiscalYear: '2026-27', quarter: 4, status: 'SCHEDULED', zoneId: ZONE_NORTH });
      expect(
        auditCreateBody.safeParse({
          farmerId: FARMER_A,
          auditType: 'INTERNAL',
          scheduledFor: '2027-02-15T04:30:00Z',
          fiscalYear: '2030-31',
          quarter: 1,
        }).success,
      ).toBe(false);
    });

    it('BR-03a: rejects a second audit for the same farmer, fiscal year and quarter with 409 AUDIT_QUARTER_TAKEN', async () => {
      const h = harness();
      await scheduleInternal(h, FARMER_A, '2026-11-05T04:30:00Z');
      await expect(scheduleInternal(h, FARMER_A, '2026-12-20T04:30:00Z')).rejects.toMatchObject({
        code: 'AUDIT_QUARTER_TAKEN',
        status: 409,
      });
      // A different quarter, or a different farmer, is fine.
      await expect(scheduleInternal(h, FARMER_A, '2027-01-10T04:30:00Z')).resolves.toBeDefined();
      await expect(scheduleInternal(h, FARMER_C, '2026-11-05T04:30:00Z')).resolves.toBeDefined();
    });

    it('BR-03a: a cancelled audit frees its quarter for a replacement', async () => {
      const h = harness();
      const first = await scheduleInternal(h, FARMER_A, '2026-11-05T04:30:00Z');
      await h.service.cancel(SCHEDULE, first, { reason: 'Farmer unavailable' });
      const replacement = await h.service.schedule(SCHEDULE, {
        farmerId: FARMER_A,
        auditType: 'EXTERNAL',
        scheduledFor: '2026-12-01T04:30:00Z',
        externalAgencyName: 'PGS Regional Council',
      });
      expect(replacement.quarter).toBe(3);
      expect(h.world.audits.get(first)!.status).toBe('CANCELLED');
    });

    it('BR-03a: rescheduling (PATCH) into a quarter that already has a live audit fails with AUDIT_QUARTER_TAKEN', async () => {
      const h = harness();
      await scheduleInternal(h, FARMER_A, '2027-01-10T04:30:00Z'); // Q4
      const q3 = await scheduleInternal(h, FARMER_A, '2026-11-05T04:30:00Z');
      await expect(h.service.update(SCHEDULE, q3, { scheduledFor: '2027-02-01T04:30:00Z' })).rejects.toMatchObject({
        code: 'AUDIT_QUARTER_TAKEN',
        status: 409,
      });
      // Moving within its own quarter re-derives the same slot and is allowed.
      const moved = await h.service.update(SCHEDULE, q3, { scheduledFor: '2026-12-15T04:30:00Z', reason: 'Rain' });
      expect(moved).toMatchObject({ fiscalYear: '2026-27', quarter: 3, scheduledFor: '2026-12-15T04:30:00.000Z' });
    });

    it('EXTERNAL requires an agency name; INTERNAL refuses one (422 VALIDATION_FAILED)', async () => {
      const h = harness();
      await expect(
        h.service.schedule(SCHEDULE, { farmerId: FARMER_A, auditType: 'EXTERNAL', scheduledFor: '2026-11-05T04:30:00Z' }),
      ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
      await expect(
        h.service.schedule(SCHEDULE, {
          farmerId: FARMER_A,
          auditType: 'INTERNAL',
          scheduledFor: '2026-11-05T04:30:00Z',
          externalAgencyName: 'Some Agency',
        }),
      ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
    });

    it('a farm that does not belong to the farmer is refused (422); an unknown farmer is 404', async () => {
      const h = harness();
      await expect(
        h.service.schedule(SCHEDULE, {
          farmerId: FARMER_A,
          farmId: FARM_B,
          auditType: 'INTERNAL',
          scheduledFor: '2026-11-05T04:30:00Z',
        }),
      ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
      await expect(
        h.service.schedule(SCHEDULE, { farmerId: newId(), auditType: 'INTERNAL', scheduledFor: '2026-11-05T04:30:00Z' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
    });
  });

  describe('compliance (BR-03b)', () => {
    it('BR-03b: fewer than 4 completed audits in an open fiscal year is PENDING, 4 is COMPLIANT', async () => {
      const h = harness();
      for (const date of ['2026-04-10', '2026-07-10', '2026-10-10', '2027-01-10']) {
        await completed(h, { farmerId: FARMER_A, scheduledFor: `${date}T04:30:00Z` });
      }
      for (const date of ['2026-04-10', '2026-07-10', '2026-10-10']) {
        await completed(h, { farmerId: FARMER_C, scheduledFor: `${date}T04:30:00Z` });
      }
      const summary = await h.service.compliance(VIEW, { limit: 20, fiscalYear: '2026-27' });
      expect(summary.isFiscalYearClosed).toBe(false);
      expect(summary.currentQuarter).toBe(3);
      const byId = new Map(summary.farmers.map((f) => [f.farmerId, f]));
      expect(byId.get(FARMER_A)).toMatchObject({ completedCount: 4, requiredCount: 4, complianceStatus: 'COMPLIANT' });
      expect(byId.get(FARMER_C)).toMatchObject({ completedCount: 3, complianceStatus: 'PENDING' });
      expect(summary.counts).toMatchObject({ compliant: 1, pending: 2, nonCompliant: 0, farmersInScope: 3 });
    });

    it('BR-03b: a farmer with 3 completed audits after the fiscal year closes is NON_COMPLIANT — never silently passed', async () => {
      const h = harness();
      for (const date of ['2026-04-10', '2026-07-10', '2026-10-10']) {
        await completed(h, { farmerId: FARMER_C, scheduledFor: `${date}T04:30:00Z` });
      }
      h.setNow(new Date('2027-04-05T06:00:00Z'));
      const summary = await h.service.compliance(VIEW, { limit: 20, fiscalYear: '2026-27' });
      expect(summary.isFiscalYearClosed).toBe(true);
      expect(summary.currentQuarter).toBeNull();
      expect(summary.farmers.find((f) => f.farmerId === FARMER_C)).toMatchObject({
        completedCount: 3,
        complianceStatus: 'NON_COMPLIANT',
      });
      expect(summary.counts).toMatchObject({ pending: 0, nonCompliant: 3, compliant: 0 });

      // The PENDING filter on a closed year matches nobody; NON_COMPLIANT matches the shortfall.
      const pending = await h.service.compliance(VIEW, { limit: 20, fiscalYear: '2026-27', complianceStatus: 'PENDING' });
      expect(pending.farmers).toEqual([]);
      const non = await h.service.compliance(VIEW, {
        limit: 20,
        fiscalYear: '2026-27',
        complianceStatus: 'NON_COMPLIANT',
      });
      expect(non.farmers.map((f) => f.complianceStatus)).toEqual(['NON_COMPLIANT', 'NON_COMPLIANT', 'NON_COMPLIANT']);
    });

    it('zone scope: a Farmer Admin compliance view covers only farmers in their zone', async () => {
      const h = harness();
      const summary = await h.service.compliance(farmerAdminScope('audit.view', [ZONE_SOUTH]), { limit: 20 });
      expect(summary.fiscalYear).toBe('2026-27');
      expect(summary.farmers.map((f) => f.farmerId)).toEqual([FARMER_B]);
      expect(summary.counts.farmersInScope).toBe(1);
    });
  });

  describe('tiers (BR-04)', () => {
    it('BR-04a: audit tier is read from rating_tier_config — changing the config changes the tier of a stored score', async () => {
      const h = harness();
      const id = await completed(h); // 70
      expect((await h.service.get(VIEW, id)).tier).toBe('GOOD');
      tierConfig = [
        { code: 'POOR', min: 0, max: 60 },
        { code: 'MODERATE', min: 60, max: 75 },
        { code: 'GOOD', min: 75, max: 90 },
        { code: 'EXCELLENT', min: 90, max: null },
      ];
      const after = await h.service.get(VIEW, id);
      expect(after.totalScore).toBe(70);
      expect(after.tier).toBe('MODERATE');
      expect((await h.service.list(VIEW, { limit: 20, sort: '-scheduledFor' })).items[0]!.tier).toBe('MODERATE');
    });

    it('BR-04b: audit totals 0/49/50/69/70/84/85/100 map to POOR/POOR/MODERATE/MODERATE/GOOD/GOOD/EXCELLENT/EXCELLENT', async () => {
      const cases: Array<[number[], number, string]> = [
        [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 0, 'POOR'],
        [[5, 5, 5, 5, 5, 5, 5, 5, 5, 4], 49, 'POOR'],
        [[5, 5, 5, 5, 5, 5, 5, 5, 5, 5], 50, 'MODERATE'],
        [[7, 7, 7, 7, 7, 7, 7, 7, 7, 6], 69, 'MODERATE'],
        [[7, 7, 7, 7, 7, 7, 7, 7, 7, 7], 70, 'GOOD'],
        [[9, 9, 9, 9, 8, 8, 8, 8, 8, 8], 84, 'GOOD'],
        [[9, 9, 9, 9, 9, 8, 8, 8, 8, 8], 85, 'EXCELLENT'],
        [[10, 10, 10, 10, 10, 10, 10, 10, 10, 10], 100, 'EXCELLENT'],
      ];
      for (const [values, total, tier] of cases) {
        const h = harness();
        const id = await completed(h, { scores: values });
        expect(await h.service.get(VIEW, id)).toMatchObject({ totalScore: total, tier });
      }
    });

    it('BR-04a: an audit that is not COMPLETED has no total and no tier', async () => {
      const h = harness();
      const id = await inProgress(h);
      await h.service.setScores(SCORE, id, { scores: ALL_SEVENS });
      expect(await h.service.get(VIEW, id)).toMatchObject({ totalScore: null, tier: null });
    });
  });

  describe('violations and red flag (BR-05)', () => {
    it('BR-05a: completion persists major_violations_count equal to the number of MAJOR findings (0 when none)', async () => {
      const h = harness();
      const withMajors = await completed(h, { farmerId: FARMER_A, findings: [MAJOR, MAJOR, MINOR] });
      const none = await completed(h, { farmerId: FARMER_C, findings: [MINOR] });
      expect(h.world.audits.get(withMajors)!.majorViolationsCount).toBe(2);
      expect(h.world.audits.get(none)!.majorViolationsCount).toBe(0);
      expect((await h.service.get(VIEW, withMajors)).majorViolationsCount).toBe(2);
    });

    it('BR-05b: completing an audit with MAJOR findings does not set red_flagged', async () => {
      const h = harness();
      const id = await completed(h, { findings: [MAJOR, MAJOR] });
      expect(h.world.audits.get(id)!.redFlagged).toBe(false);
      expect((await h.service.get(VIEW, id)).redFlagged).toBe(false);
    });

    it('BR-05b: red_flagged is set only by POST red-flag and cleared only by POST clear-red-flag', async () => {
      const h = harness();
      const id = await completed(h, { findings: [MAJOR] });
      const flagged = await h.service.redFlag(RED_FLAG, id, { reason: 'Repeated synthetic input use' });
      expect(flagged).toMatchObject({ redFlagged: true, redFlagReason: 'Repeated synthetic input use' });
      await expect(h.service.redFlag(RED_FLAG, id, { reason: 'again' })).rejects.toMatchObject({
        code: 'INVALID_STATE_TRANSITION',
        status: 409,
      });
      const cleared = await h.service.clearRedFlag(RED_FLAG, id, { note: 'Remediated' });
      expect(cleared).toMatchObject({ redFlagged: false, redFlagReason: null, redFlaggedAt: null });
      await expect(h.service.clearRedFlag(RED_FLAG, id, {})).rejects.toMatchObject({
        code: 'INVALID_STATE_TRANSITION',
        status: 409,
      });
    });

    it('BR-05b: red-flag is refused on an audit that is not COMPLETED (409 INVALID_STATE_TRANSITION)', async () => {
      const h = harness();
      const scheduled = await scheduleInternal(h, FARMER_A);
      const running = await inProgress(h, FARMER_C);
      for (const id of [scheduled, running]) {
        await expect(h.service.redFlag(RED_FLAG, id, { reason: 'Too early' })).rejects.toMatchObject({
          code: 'INVALID_STATE_TRANSITION',
          status: 409,
        });
      }
      await h.service.cancel(SCHEDULE, scheduled, { reason: 'Called off' });
      await expect(h.service.redFlag(RED_FLAG, scheduled, { reason: 'Too late' })).rejects.toMatchObject({
        code: 'INVALID_STATE_TRANSITION',
      });
    });
  });

  describe('scores and completeness (BR-06)', () => {
    it('BR-06a: a category score of 11 (or -1) is rejected with 422 SCORE_OUT_OF_RANGE', async () => {
      const h = harness();
      const id = await inProgress(h);
      for (const score of [11, -1]) {
        await expect(
          h.service.setScores(SCORE, id, { scores: [{ categoryCode: 'CERTIFICATION', score }] }),
        ).rejects.toMatchObject({ code: 'SCORE_OUT_OF_RANGE', status: 422 });
      }
      expect(h.world.scores.get(id)).toBeUndefined();
    });

    it('BR-06a: completing with 9 of 10 category scores fails 422 AUDIT_INCOMPLETE listing the missing category — never treated as zero', async () => {
      const h = harness();
      const id = await inProgress(h);
      await h.service.setScores(SCORE, id, { scores: ALL_SEVENS.filter((s) => s.categoryCode !== 'INNOVATION') });
      const error = await h.service.complete(CONDUCT, id, {}).catch((e: unknown) => e);
      expect(error).toMatchObject({ code: 'AUDIT_INCOMPLETE', status: 422 });
      expect(JSON.stringify((error as { errors?: unknown }).errors)).toContain('INNOVATION');
      expect(h.world.audits.get(id)).toMatchObject({ status: 'IN_PROGRESS', totalScore: null });
    });

    it('BR-06: a score sheet can be built up across calls; the detail always lists 10 categories with null for unscored', async () => {
      const h = harness();
      const id = await inProgress(h);
      await h.service.setScores(SCORE, id, { scores: ALL_SEVENS.slice(0, 4) });
      const detail = await h.service.setScores(SCORE, id, { scores: ALL_SEVENS.slice(4, 6) });
      expect(detail.categoryScores).toHaveLength(10);
      expect(detail.categoryScores.filter((s) => s.score === null)).toHaveLength(4);
      expect(detail.categoryScores[0]).toEqual({ categoryCode: 'CERTIFICATION', score: 7, maxScore: 10, remarks: null });
    });

    it('BR-06b: the same category twice in one request is rejected (422 VALIDATION_FAILED)', async () => {
      const h = harness();
      const id = await inProgress(h);
      await expect(
        h.service.setScores(SCORE, id, {
          scores: [
            { categoryCode: 'CERTIFICATION', score: 5 },
            { categoryCode: 'CERTIFICATION', score: 6 },
          ],
        }),
      ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
    });
  });

  describe('farmer own view (BR-36)', () => {
    it('BR-36: a farmer lists only their own audits', async () => {
      const h = harness();
      const own = await scheduleInternal(h, FARMER_A);
      await scheduleInternal(h, FARMER_B);
      const page = await h.service.listMine(farmerScope(FARMER_A), { limit: 20, sort: '-scheduledFor' });
      expect(page.items.map((item) => item.id)).toEqual([own]);
    });

    it('BR-36a: farmer A requesting farmer B\'s audit by id gets 404', async () => {
      const h = harness();
      const other = await completed(h, { farmerId: FARMER_B });
      await expect(h.service.getMine(farmerScope(FARMER_A), other)).rejects.toMatchObject({
        code: 'NOT_FOUND',
        status: 404,
      });
    });

    it('BR-36b: farmer A requesting farmer B\'s audit report PDF gets 404', async () => {
      const h = harness();
      const other = await completed(h, { farmerId: FARMER_B });
      const query: ReportQuery = { variant: 'generated', redirect: false };
      await expect(
        h.service.getMyReport(farmerScope(FARMER_A, 'audit.view'), other, query),
      ).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
      expect(h.pdfInputs).toHaveLength(0);
    });

    it('BR-36: farmer audit responses never include redFlagged/redFlagReason/createdBy (allow-list)', async () => {
      const h = harness();
      const id = await completed(h, { farmerId: FARMER_A, findings: [MAJOR] });
      await h.service.redFlag(RED_FLAG, id, { reason: 'Internal escalation' });
      const detail = await h.service.getMine(farmerScope(FARMER_A), id);
      // .strict() turns any key outside the allow-list into a failure.
      expect(() => farmerAuditDetail.strict().parse(detail)).not.toThrow();
      const serialised = JSON.stringify(detail);
      for (const forbidden of ['redFlag', 'createdBy', 'Internal escalation', 'farmerId', 'resolvedByName']) {
        expect(serialised).not.toContain(forbidden);
      }
      const page = await h.service.listMine(farmerScope(FARMER_A), { limit: 20, sort: '-scheduledFor' });
      expect(() => farmerAuditSummary.strict().parse(page.items[0])).not.toThrow();
    });

    it('BR-36: a farmer sees scores and findings only once the audit is COMPLETED', async () => {
      const h = harness();
      const id = await inProgress(h, FARMER_A);
      await h.service.setScores(SCORE, id, { scores: ALL_SEVENS, summary: 'Draft remarks' });
      await h.service.createFinding(FINDINGS, id, MAJOR);
      const before = await h.service.getMine(farmerScope(FARMER_A), id);
      expect(before.categoryScores.every((s) => s.score === null && s.remarks === null)).toBe(true);
      expect(before.findings).toEqual([]);
      expect(before.findingCounts).toEqual({ major: 0, minor: 0, observation: 0, openMajor: 0 });
      expect(before.summary).toBeNull();

      await h.service.complete(CONDUCT, id, {});
      const after = await h.service.getMine(farmerScope(FARMER_A), id);
      expect(after.categoryScores.every((s) => s.score === 7)).toBe(true);
      expect(after.findings).toHaveLength(1);
      expect(after).toMatchObject({ totalScore: 70, tier: 'GOOD', majorViolationsCount: 1, summary: 'Draft remarks' });
    });

    it('BR-36: the farmer report is limited to their own COMPLETED audits (409 before completion)', async () => {
      const h = harness();
      const id = await inProgress(h, FARMER_A);
      for (const variant of ['generated', 'agency'] as const) {
        await expect(
          h.service.getMyReport(farmerScope(FARMER_A), id, { variant, redirect: false }),
        ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION', status: 409 });
      }
    });

    it('a farmer calling the ADMIN endpoints sees nothing (empty list, 404 by id)', async () => {
      const h = harness();
      const own = await completed(h, { farmerId: FARMER_A });
      const page = await h.service.list(farmerScope(FARMER_A), { limit: 20, sort: '-scheduledFor' });
      expect(page.items).toEqual([]);
      await expect(h.service.get(farmerScope(FARMER_A), own)).rejects.toMatchObject({ code: 'NOT_FOUND' });
      await expect(
        h.service.getReport(farmerScope(FARMER_A), own, { variant: 'generated', redirect: false }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('zone scope (Farmer Admin, OWN_ZONE_ONLY)', () => {
    it('zone scope: a Farmer Admin lists only audits of farmers in their zone; an out-of-zone id is 404, not 403', async () => {
      const h = harness();
      const north = await scheduleInternal(h, FARMER_A);
      const south = await scheduleInternal(h, FARMER_B);
      const fa = farmerAdminScope('audit.view', [ZONE_NORTH]);
      const page = await h.service.list(fa, { limit: 20, sort: '-scheduledFor' });
      expect(page.items.map((item) => item.id)).toEqual([north]);
      await expect(h.service.get(fa, south)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
      expect((await h.service.get(fa, north)).id).toBe(north);
    });

    it('zone scope: the report download is zone-limited for a Farmer Admin (404 outside the zone)', async () => {
      const h = harness();
      const north = await completed(h, { farmerId: FARMER_A });
      const south = await completed(h, { farmerId: FARMER_B });
      const fa = farmerAdminScope('audit.view', [ZONE_NORTH]);
      const query: ReportQuery = { variant: 'generated', redirect: false };
      await expect(h.service.getReport(fa, south, query)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
      const file = await h.service.getReport(fa, north, query);
      expect(file).toMatchObject({ kind: 'file', contentType: 'application/pdf' });
    });

    it('SUPPORT_ONLY: a Farmer Admin cannot start or complete an audit in their own zone (403); outside it, 404', async () => {
      const h = harness();
      const north = await scheduleInternal(h, FARMER_A);
      const south = await scheduleInternal(h, FARMER_B);
      const fa = farmerAdminScope('audit.conduct', [ZONE_NORTH], 'SUPPORT_ONLY');
      await expect(h.service.start(fa, north, {})).rejects.toMatchObject({ status: 403 });
      await expect(h.service.start(fa, south, {})).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
      await h.service.start(CONDUCT, north, {});
      await h.service.setScores(SCORE, north, { scores: ALL_SEVENS });
      await expect(h.service.complete(fa, north, {})).rejects.toMatchObject({ status: 403 });
      expect(h.world.audits.get(north)!.status).toBe('IN_PROGRESS');
    });
  });

  describe('state machine', () => {
    it('state: start only from SCHEDULED; complete only from IN_PROGRESS (409 INVALID_STATE_TRANSITION)', async () => {
      const h = harness();
      const id = await scheduleInternal(h);
      await expect(h.service.complete(CONDUCT, id, {})).rejects.toMatchObject({
        code: 'INVALID_STATE_TRANSITION',
        status: 409,
      });
      await h.service.start(CONDUCT, id, {});
      await expect(h.service.start(CONDUCT, id, {})).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });
      await h.service.setScores(SCORE, id, { scores: ALL_SEVENS });
      await h.service.complete(CONDUCT, id, {});
      await expect(h.service.complete(CONDUCT, id, {})).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });
    });

    it('state: an INTERNAL audit cannot start without an auditor (422 VALIDATION_FAILED); one can be supplied at start', async () => {
      const h = harness();
      const { id } = await h.service.schedule(SCHEDULE, {
        farmerId: FARMER_A,
        auditType: 'INTERNAL',
        scheduledFor: '2026-11-05T04:30:00Z',
      });
      await expect(h.service.start(CONDUCT, id, {})).rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
      const started = await h.service.start(CONDUCT, id, { auditorUserId: AUDITOR });
      expect(started).toMatchObject({ status: 'IN_PROGRESS', auditorUserId: AUDITOR });
    });

    it('state: scores and findings are refused unless IN_PROGRESS (409 INVALID_STATE_TRANSITION)', async () => {
      const h = harness();
      const scheduled = await scheduleInternal(h, FARMER_A);
      const done = await completed(h, { farmerId: FARMER_C });
      for (const id of [scheduled, done]) {
        await expect(h.service.setScores(SCORE, id, { scores: ALL_SEVENS })).rejects.toMatchObject({
          code: 'INVALID_STATE_TRANSITION',
          status: 409,
        });
        await expect(h.service.createFinding(FINDINGS, id, MINOR)).rejects.toMatchObject({
          code: 'INVALID_STATE_TRANSITION',
          status: 409,
        });
      }
    });

    it('state: PATCH reschedule is refused unless SCHEDULED', async () => {
      const h = harness();
      const running = await inProgress(h, FARMER_A);
      await expect(
        h.service.update(SCHEDULE, running, { scheduledFor: '2026-12-01T04:30:00Z' }),
      ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION', status: 409 });
    });

    it('state: cancel is allowed from SCHEDULED and IN_PROGRESS, refused from COMPLETED/CANCELLED', async () => {
      const h = harness();
      const scheduled = await scheduleInternal(h, FARMER_A, '2026-11-05T04:30:00Z');
      const running = await inProgress(h, FARMER_C);
      const done = await completed(h, { farmerId: FARMER_B });
      expect((await h.service.cancel(SCHEDULE, scheduled, { reason: 'No access road' })).status).toBe('CANCELLED');
      expect((await h.service.cancel(SCHEDULE, running, { reason: 'Auditor ill' })).status).toBe('CANCELLED');
      for (const id of [done, scheduled]) {
        await expect(h.service.cancel(SCHEDULE, id, { reason: 'Nope' })).rejects.toMatchObject({
          code: 'INVALID_STATE_TRANSITION',
          status: 409,
        });
      }
    });

    it('state: a COMPLETED audit accepts finding resolution only; other finding edits are 409', async () => {
      const h = harness();
      const id = await inProgress(h);
      const finding = await h.service.createFinding(FINDINGS, id, { ...MAJOR, categoryCode: 'FARMING_PRACTICES' });
      expect(finding).toMatchObject({ severity: 'MAJOR', categoryCode: 'FARMING_PRACTICES', resolvedAt: null });
      // While IN_PROGRESS every field may change.
      expect(
        (await h.service.updateFinding(FINDINGS, id, finding.id, { severity: 'MINOR', dueDate: '2026-12-31' }))
          .severity,
      ).toBe('MINOR');
      await h.service.updateFinding(FINDINGS, id, finding.id, { severity: 'MAJOR' });
      await h.service.setScores(SCORE, id, { scores: ALL_SEVENS });
      await h.service.complete(CONDUCT, id, {});

      await expect(
        h.service.updateFinding(FINDINGS, id, finding.id, { severity: 'MINOR' }),
      ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION', status: 409 });
      await expect(
        h.service.updateFinding(FINDINGS, id, finding.id, { resolved: false }),
      ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION', status: 409 });

      const resolved = await h.service.updateFinding(FINDINGS, id, finding.id, {
        resolved: true,
        resolutionNote: 'Drums removed, verified on revisit',
      });
      expect(resolved.resolvedAt).not.toBeNull();
      expect(resolved.resolutionNote).toBe('Drums removed, verified on revisit');
      // Resolving records the fix; it does not rewrite what was found (BR-05a).
      expect(h.world.audits.get(id)!.majorViolationsCount).toBe(1);
    });

    it('a finding id that belongs to another audit is 404', async () => {
      const h = harness();
      const first = await inProgress(h, FARMER_A);
      const second = await inProgress(h, FARMER_C);
      const finding = await h.service.createFinding(FINDINGS, first, MINOR);
      await expect(
        h.service.updateFinding(FINDINGS, second, finding.id, { description: 'moved' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
    });
  });

  describe('bulk reschedule', () => {
    it('bulk reschedule: partial success — each item reports its own outcome and only successes are applied/logged', async () => {
      const h = harness();
      const ok = await scheduleInternal(h, FARMER_A, '2026-11-05T04:30:00Z');
      const blocked = await scheduleInternal(h, FARMER_C, '2026-11-05T04:30:00Z');
      await scheduleInternal(h, FARMER_C, '2027-01-20T04:30:00Z'); // FARMER_C's Q4 is taken
      const done = await completed(h, { farmerId: FARMER_B });
      const missing = newId();
      h.auditLog.length = 0;

      const result = await h.service.bulkReschedule(SCHEDULE, {
        items: [{ auditId: ok }, { auditId: blocked }, { auditId: done }, { auditId: missing }],
        shiftDays: 76, // 5 Nov 2026 + 76 days = 20 Jan 2027 (Q4)
        reason: 'Heavy rainfall',
      });

      expect(result.rescheduledCount).toBe(1);
      expect(result.failedCount).toBe(3);
      const byId = new Map(result.results.map((r) => [r.auditId, r]));
      expect(byId.get(ok)).toMatchObject({ outcome: 'RESCHEDULED', audit: { quarter: 4, fiscalYear: '2026-27' } });
      expect(byId.get(blocked)).toMatchObject({ outcome: 'FAILED', code: 'AUDIT_QUARTER_TAKEN' });
      expect(byId.get(done)).toMatchObject({ outcome: 'FAILED', code: 'INVALID_STATE_TRANSITION' });
      expect(byId.get(missing)).toMatchObject({ outcome: 'FAILED', code: 'NOT_FOUND' });
      expect(h.world.audits.get(blocked)!.scheduledFor.toISOString()).toBe('2026-11-05T04:30:00.000Z');
      expect(h.auditLog.map((row) => row.entry.actionCode)).toEqual(['audit.reschedule']);
    });

    it('bulk reschedule: the expected-current-date guard makes a resent shiftDays request a no-op (CONFLICT), not a second shift', async () => {
      const h = harness();
      const id = await scheduleInternal(h, FARMER_A, '2026-11-05T04:30:00Z');
      const body = {
        items: [{ auditId: id, expectedScheduledFor: '2026-11-05T04:30:00Z' }],
        shiftDays: 7,
      };
      const first = await h.service.bulkReschedule(SCHEDULE, body);
      expect(first.results[0]).toMatchObject({ outcome: 'RESCHEDULED' });
      const replay = await h.service.bulkReschedule(SCHEDULE, body);
      expect(replay.results[0]).toMatchObject({ outcome: 'FAILED', code: 'CONFLICT' });
      expect(h.world.audits.get(id)!.scheduledFor.toISOString()).toBe('2026-11-12T04:30:00.000Z');
    });

    it('bulk reschedule: an absolute newScheduledFor is applied and re-derives the quarter', async () => {
      const h = harness();
      const id = await scheduleInternal(h, FARMER_A, '2026-11-05T04:30:00Z');
      const result = await h.service.bulkReschedule(SCHEDULE, {
        items: [{ auditId: id }],
        newScheduledFor: '2027-02-02T04:30:00Z',
      });
      expect(result.results[0]).toMatchObject({ outcome: 'RESCHEDULED', audit: { quarter: 4 } });
    });
  });

  describe('agency report upload and PDF report', () => {
    it('attaching an agency report by storage key (purpose AUDIT_REPORT) works and downloads via variant=agency', async () => {
      const h = harness();
      const id = await inProgress(h);
      h.world.uploads.set('audit_report/abc.pdf', {
        id: newId(),
        storageKey: 'audit_report/abc.pdf',
        uploadedBy: ADMIN,
        mimeType: 'application/pdf',
        sizeBytes: 2048,
      });
      const detail = await h.service.setScores(SCORE, id, {
        scores: ALL_SEVENS,
        reportStorageKey: 'audit_report/abc.pdf',
      });
      expect(detail.reportUpload).toMatchObject({ mimeType: 'application/pdf', sizeBytes: 2048 });
      const file = await h.service.getReport(VIEW, id, { variant: 'agency', redirect: false });
      expect(file).toMatchObject({ kind: 'file', contentType: 'application/pdf' });
      expect((file as { body: Buffer }).body.toString()).toBe('agency-bytes');
    });

    it('a storage key from another purpose or another uploader is refused (422)', async () => {
      const h = harness();
      const id = await inProgress(h);
      h.world.uploads.set('diary_photo/x.jpg', {
        id: newId(),
        storageKey: 'diary_photo/x.jpg',
        uploadedBy: ADMIN,
        mimeType: 'image/jpeg',
        sizeBytes: 10,
      });
      h.world.uploads.set('audit_report/theirs.pdf', {
        id: newId(),
        storageKey: 'audit_report/theirs.pdf',
        uploadedBy: AUDITOR,
        mimeType: 'application/pdf',
        sizeBytes: 10,
      });
      for (const key of ['diary_photo/x.jpg', 'audit_report/theirs.pdf', 'audit_report/missing.pdf']) {
        await expect(
          h.service.setScores(SCORE, id, { scores: ALL_SEVENS, reportStorageKey: key }),
        ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
      }
    });

    it('variant=agency with no attached file is 404; the generated report before completion is 409', async () => {
      const h = harness();
      const id = await inProgress(h);
      await expect(h.service.getReport(VIEW, id, { variant: 'agency', redirect: false })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
      await expect(h.service.getReport(VIEW, id, { variant: 'generated', redirect: false })).rejects.toMatchObject({
        code: 'INVALID_STATE_TRANSITION',
        status: 409,
      });
    });

    it('BR-33: the generated report carries scores, total, tier and findings but no Aadhaar or mobile number', async () => {
      const h = harness();
      const id = await completed(h, { findings: [MAJOR] });
      const file = await h.service.getReport(VIEW, id, { variant: 'generated', redirect: false });
      expect(file).toMatchObject({ kind: 'file', contentType: 'application/pdf' });
      const input = h.pdfInputs[0]!;
      expect(input).toMatchObject({ totalScore: 70, maxScore: 100, tier: 'GOOD', majorViolationsCount: 1 });
      expect(input.categories).toHaveLength(10);
      expect(input.findings).toHaveLength(1);
      expect(input.farmLocation).toContain('Kotagiri');
      expect(JSON.stringify(input).toLowerCase()).not.toMatch(/aadhaar|mobile|\+91/);
    });

    it('redirect=true returns a short-lived signed link that serves the file without a session; a tampered token is refused', async () => {
      const h = harness();
      const id = await completed(h, { farmerId: FARMER_A });
      const redirect = await h.service.getMyReport(farmerScope(FARMER_A), id, { variant: 'generated', redirect: true });
      expect(redirect.kind).toBe('redirect');
      const url = new URL((redirect as { url: string }).url, 'http://localhost');
      expect(url.pathname).toBe(`/v1/farmers/me/audits/${id}/report`);
      const token = url.searchParams.get('token')!;
      const expires = Number(url.searchParams.get('expires'));
      const file = await h.service.getSignedReport('farmer', id, { variant: 'generated', redirect: false, token, expires });
      expect(file.contentType).toBe('application/pdf');

      await expect(
        h.service.getSignedReport('admin', id, { variant: 'generated', redirect: false, token, expires }),
      ).rejects.toMatchObject({ status: 403 });
      await expect(
        h.service.getSignedReport('farmer', id, { variant: 'agency', redirect: false, token, expires }),
      ).rejects.toMatchObject({ status: 403 });
      h.setNow(new Date(NOW.getTime() + 6 * 60 * 1000));
      await expect(
        h.service.getSignedReport('farmer', id, { variant: 'generated', redirect: false, token, expires }),
      ).rejects.toMatchObject({ status: 403 });
    });

    it('the real PDF renderer produces a PDF document', async () => {
      const buffer = await renderAuditReportPdf({
        auditId: newId(),
        farmerName: 'Farmer A',
        tohfaFarmerId: 'TOHFA-F-A',
        farmName: 'Hill Farm',
        farmLocation: 'Kotagiri, The Nilgiris',
        zoneName: 'North',
        fiscalYear: '2026-27',
        quarter: 3,
        auditType: 'EXTERNAL',
        auditorName: null,
        externalAgencyName: 'PGS Regional Council',
        scheduledFor: '2026-11-05T04:30:00Z',
        startedAt: '2026-11-05T05:00:00Z',
        completedAt: '2026-11-05T09:00:00Z',
        totalScore: 70,
        maxScore: 100,
        tier: 'GOOD',
        majorViolationsCount: 1,
        summary: 'Good practices overall.',
        categories: CATEGORIES.map((c) => ({ code: c.code, name: c.code, score: 7, maxScore: 10, remarks: null })),
        findings: [
          {
            severity: 'MAJOR',
            categoryName: 'Farming Practices',
            description: 'Synthetic pesticide drums found.',
            correctiveAction: 'Remove and document disposal.',
            dueDate: '2026-12-31',
            resolvedAt: null,
            resolutionNote: null,
          },
        ],
        generatedAt: NOW.toISOString(),
      });
      expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
    });
  });

  describe('audit_log and no automatic effects', () => {
    it('audit_log: every mutation writes exactly one audit_log row through the transaction client', async () => {
      const h = harness();
      const id = await scheduleInternal(h, FARMER_A, '2026-11-05T04:30:00Z');
      await h.service.update(SCHEDULE, id, { scheduledFor: '2026-11-06T04:30:00Z', reason: 'Rain' });
      await h.service.start(CONDUCT, id, {});
      await h.service.setScores(SCORE, id, { scores: ALL_SEVENS });
      const finding = await h.service.createFinding(FINDINGS, id, MAJOR);
      await h.service.updateFinding(FINDINGS, id, finding.id, { correctiveAction: 'Remove drums' });
      await h.service.complete(CONDUCT, id, {});
      await h.service.redFlag(RED_FLAG, id, { reason: 'Escalate' });
      await h.service.clearRedFlag(RED_FLAG, id, {});
      const other = await scheduleInternal(h, FARMER_C, '2026-11-05T04:30:00Z');
      await h.service.bulkReschedule(SCHEDULE, { items: [{ auditId: other }], shiftDays: 1 });
      await h.service.cancel(SCHEDULE, other, { reason: 'Called off' });

      expect(h.auditLog.map((row) => row.entry.actionCode)).toEqual([
        'audit.schedule',
        'audit.reschedule',
        'audit.start',
        'audit.score',
        'audit.finding.create',
        'audit.finding.update',
        'audit.complete',
        'audit.red_flag',
        'audit.red_flag.clear',
        'audit.schedule',
        'audit.reschedule',
        'audit.cancel',
      ]);
      expect(h.auditLog.every((row) => row.tx === TX)).toBe(true);
      expect(h.world.writeTxs.every((tx) => tx === TX)).toBe(true);
      expect(h.auditLog.find((row) => row.entry.actionCode === 'audit.finding.create')!.entry.entityType).toBe(
        'audit_finding',
      );
      expect(h.auditLog.find((row) => row.entry.actionCode === 'audit.complete')!.entry).toMatchObject({
        entityType: 'audit',
        entityId: id,
        actorId: ADMIN,
      });
      // The reschedule reason is preserved in the trail (there is no column for it).
      expect(JSON.stringify(h.auditLog[1]!.entry.after)).toContain('Rain');
    });

    it('audit_log: a failing audit_log write fails the mutation (it runs inside the same transaction)', async () => {
      const h = harness({ writeAuditFails: true });
      await expect(scheduleInternal(h)).rejects.toThrow('audit_log insert failed');
    });

    it('no other derivation: the service issues no SQL of its own — completion touches the audit repo and the farm-rating recorder only', async () => {
      // TX and DB throw on any query, so a direct UPDATE of farmers /
      // certifications / payouts from the service would fail this test. The
      // farm rating (BR-06c, product decision 2026-10-01) is the ONE automatic
      // effect, and it goes through the injected recorder; the integration
      // suite checks the real tables.
      const h = harness();
      const id = await completed(h, { findings: [MAJOR, MAJOR] });
      expect(h.world.audits.get(id)).toMatchObject({ status: 'COMPLETED', redFlagged: false });
      expect(h.ratingCalls).toHaveLength(1);
    });
  });

  describe('farm rating from completed INTERNAL audits (BR-06c..g)', () => {
    async function externalInProgress(h: Harness, farmerId = FARMER_A): Promise<string> {
      const detail = await h.service.schedule(SCHEDULE, {
        farmerId,
        auditType: 'EXTERNAL',
        scheduledFor: '2026-11-05T04:30:00Z',
        externalAgencyName: 'PGS Regional Council',
      });
      await h.service.start(CONDUCT, detail.id, {});
      return detail.id;
    }

    it('BR-06c: completing an INTERNAL audit records a farm rating in the same transaction with the audit\'s 10 scores and remarks', async () => {
      const h = harness();
      const id = await inProgress(h);
      const values = [8, 7, 9, 6, 7, 8, 6, 5, 6, 5]; // 67
      const scores = scoresFrom(values).map((entry, index) =>
        index === 0 ? { ...entry, remarks: 'PGS certificate on file' } : entry,
      );
      await h.service.setScores(SCORE, id, { scores });
      await h.service.complete(CONDUCT, id, {});

      expect(h.ratingCalls).toHaveLength(1);
      const call = h.ratingCalls[0]!;
      expect(call.tx).toBe(TX); // the audit completion's own transaction client
      const audit = h.world.audits.get(id)!;
      expect(call.input).toEqual({
        auditId: id,
        farmerId: FARMER_A,
        farmId: audit.farmId,
        zoneId: audit.zoneId,
        fiscalYear: '2026-27',
        quarter: 3,
        ratedBy: ADMIN,
        actorRole: RoleCode.SUPER_ADMIN,
        scores: CATEGORIES.map((category, index) => ({
          categoryCode: category.code,
          score: values[index],
          remarks: index === 0 ? 'PGS certificate on file' : null,
        })),
      });
      expect(audit.totalScore).toBe(67);
    });

    it('BR-06d: completing an EXTERNAL audit records no farm rating', async () => {
      const h = harness();
      const id = await externalInProgress(h);
      await h.service.setScores(SCORE, id, { scores: ALL_SEVENS });
      const detail = await h.service.complete(CONDUCT, id, {});
      expect(detail.status).toBe('COMPLETED');
      expect(h.ratingCalls).toHaveLength(0);
    });

    it('BR-06d: red-flag, clear, cancel, reschedule and finding resolution never touch the farm rating', async () => {
      const h = harness();
      const id = await completed(h, { findings: [MAJOR] });
      expect(h.ratingCalls).toHaveLength(1);
      const finding = [...h.world.findings.values()].find((f) => f.auditId === id)!;
      await h.service.updateFinding(FINDINGS, id, finding.id, { resolved: true });
      await h.service.redFlag(RED_FLAG, id, { reason: 'Escalate' });
      await h.service.clearRedFlag(RED_FLAG, id, {});
      const other = await scheduleInternal(h, FARMER_C, '2026-11-05T04:30:00Z');
      await h.service.update(SCHEDULE, other, { scheduledFor: '2026-11-06T04:30:00Z', reason: 'Rain' });
      await h.service.bulkReschedule(SCHEDULE, { items: [{ auditId: other }], shiftDays: 1 });
      await h.service.cancel(SCHEDULE, other, { reason: 'Called off' });
      expect(h.ratingCalls).toHaveLength(1);
    });

    it('BR-06c: an audit cannot be completed twice, so it records at most one rating', async () => {
      const h = harness();
      const id = await completed(h);
      await expect(h.service.complete(CONDUCT, id, {})).rejects.toMatchObject({
        code: 'INVALID_STATE_TRANSITION',
        status: 409,
      });
      expect(h.ratingCalls).toHaveLength(1);
    });

    it('BR-06g: when recording the rating fails, completion fails: the audit stays IN_PROGRESS and no audit.complete row is written', async () => {
      const h = harness({ recordRatingFails: true });
      const id = await inProgress(h);
      await h.service.setScores(SCORE, id, { scores: ALL_SEVENS });
      await expect(h.service.complete(CONDUCT, id, {})).rejects.toThrow('farm rating insert failed');
      expect(h.world.audits.get(id)).toMatchObject({ status: 'IN_PROGRESS', totalScore: null, completedAt: null });
      expect(h.auditLog.map((row) => row.entry.actionCode)).not.toContain('audit.complete');
    });

    it('BR-06a: an incomplete sheet still fails AUDIT_INCOMPLETE before any rating is recorded', async () => {
      const h = harness();
      const id = await inProgress(h);
      await h.service.setScores(SCORE, id, { scores: ALL_SEVENS.slice(0, 9) });
      await expect(h.service.complete(CONDUCT, id, {})).rejects.toMatchObject({ code: 'AUDIT_INCOMPLETE' });
      expect(h.ratingCalls).toHaveLength(0);
    });
  });
});

// ===========================================================================
// 3. Routes — real requireAuth + requirePermission wiring, no database
// ===========================================================================

describe('Audits routes (real authorization wiring)', () => {
  const app = createApp();
  const token = (roles: Array<{ code: string; zoneId?: string }>, farmerId: string | null = null): string =>
    signAccessToken({
      sub: farmerId === null ? IDS.userSuperAdmin : IDS.userFarmer,
      roles: roles as never,
      farmerId,
      customerId: null,
    });
  const superAdmin = token([{ code: 'SUPER_ADMIN' }]);
  const farmerAdmin = signAccessToken({
    sub: IDS.userFarmerAdmin,
    roles: [{ code: 'FARMER_ADMIN', zoneId: ZONE_NORTH }] as never,
    farmerId: null,
    customerId: null,
  });
  const farmer = token([{ code: 'FARMER' }], FARMER_A);
  const customer = token([{ code: 'CUSTOMER' }]);
  const warehouse = token([{ code: 'MAIN_WH_ADMIN' }]);
  const someId = '60000000-0000-4000-8000-000000000001';

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('a Farmer Admin cannot schedule (audit.schedule none) or red-flag (audit.red_flag.manage none): 403', async () => {
    const schedule = await request(app)
      .post('/v1/admin/audits')
      .set('Authorization', `Bearer ${farmerAdmin}`)
      .send({ farmerId: FARMER_A, auditType: 'INTERNAL', scheduledFor: '2026-11-05T04:30:00Z' });
    expect(schedule.status).toBe(403);
    const flag = await request(app)
      .post(`/v1/admin/audits/${someId}/red-flag`)
      .set('Authorization', `Bearer ${farmerAdmin}`)
      .send({ reason: 'Escalate' });
    expect(flag.status).toBe(403);
  });

  it('customers and warehouse admins have no audit visibility (403)', async () => {
    expect((await request(app).get('/v1/farmers/me/audits').set('Authorization', `Bearer ${customer}`)).status).toBe(
      403,
    );
    expect((await request(app).get('/v1/admin/audits').set('Authorization', `Bearer ${warehouse}`)).status).toBe(403);
  });

  it('/compliance is routed to the compliance handler, not parsed as an :id', async () => {
    const spy = vi.spyOn(auditsService, 'compliance').mockResolvedValue({ fiscalYear: '2026-27' } as never);
    const res = await request(app).get('/v1/admin/audits/compliance').set('Authorization', `Bearer ${superAdmin}`);
    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('BR-03a: a client-sent fiscalYear/quarter is rejected by the request schema (422)', async () => {
    const res = await request(app)
      .post('/v1/admin/audits')
      .set('Authorization', `Bearer ${superAdmin}`)
      .send({ farmerId: FARMER_A, auditType: 'INTERNAL', scheduledFor: '2026-11-05T04:30:00Z', fiscalYear: '2026-27' });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });

  it('BR-06a: a score of 11 passes the schema (integer) and is refused by the service with SCORE_OUT_OF_RANGE', async () => {
    const res = await request(app)
      .put(`/v1/admin/audits/${someId}/scores`)
      .set('Authorization', `Bearer ${superAdmin}`)
      .send({ scores: [{ categoryCode: 'CERTIFICATION', score: 11 }] });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('SCORE_OUT_OF_RANGE');
  });

  it('SUPPORT_ONLY: a Farmer Admin reaches the service for start (conditional grant) and is refused there with 403', async () => {
    const row = { id: someId, farmerId: FARMER_A, farmerZoneId: ZONE_NORTH, status: 'SCHEDULED' } as AuditRow;
    vi.spyOn(auditsRepo, 'findAudit').mockResolvedValue(row);
    const res = await request(app)
      .post(`/v1/admin/audits/${someId}/start`)
      .set('Authorization', `Bearer ${farmerAdmin}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it('BR-36: a farmer on the ADMIN list passes requirePermission (own) but the query is closed to them (empty result)', async () => {
    const spy = vi.spyOn(auditsRepo, 'listAudits').mockResolvedValue({ rows: [], next: null });
    const res = await request(app).get('/v1/admin/audits').set('Authorization', `Bearer ${farmer}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [], page: { nextCursor: null, hasMore: false } });
    expect(spy.mock.calls[0]![1].access.scope.sql).toBe('FALSE');
  });

  it('signed report link: a token request skips the session but a bad token is 403; no token and no session is 401', async () => {
    const signed = await request(app).get(`/v1/farmers/me/audits/${someId}/report?token=${'0'.repeat(64)}&expires=1`);
    expect(signed.status).toBe(403);
    const anonymous = await request(app).get(`/v1/farmers/me/audits/${someId}/report`);
    expect(anonymous.status).toBe(401);
  });

  it('report routes chain audit.view after audit.report.generate: a customer is refused (403)', async () => {
    const res = await request(app).get(`/v1/admin/audits/${someId}/report`).set('Authorization', `Bearer ${customer}`);
    expect(res.status).toBe(403);
  });

  it('BR-36: the farmer list pins the caller\'s own farmer id', async () => {
    const spy = vi.spyOn(auditsRepo, 'listAudits').mockResolvedValue({ rows: [], next: null });
    const res = await request(app).get('/v1/farmers/me/audits').set('Authorization', `Bearer ${farmer}`);
    expect(res.status).toBe(200);
    expect(spy.mock.calls[0]![1].access.farmerId).toBe(FARMER_A);
  });
});

// ===========================================================================
// 4. Integration — real Postgres with 0027 applied
// ===========================================================================

describeIfDatabase('Audits (Integration)', () => {
  let ready = false;
  const ts = Date.now();
  let zoneNorth: string;
  let zoneSouth: string;
  /** Own zone for farmerRated, so the zone/compliance counts of the other tests are unaffected. */
  let zoneRated: string;
  let farmerNorth: string;
  let farmerSouth: string;
  /** Dedicated to the farm-rating tests (BR-06c..g) so their history is predictable. */
  let farmerRated: string;
  /** Holds a legacy manual rating (BR-06f legacy test). */
  let farmerLegacy: string;
  let farmNorth: string;
  let adminUser: string;
  const userIds: string[] = [];
  const service = createAuditsService();
  /** 0028 applied? (farm_ratings.source_audit_id) — the BR-06c..g tests need it. */
  let ratingLinkReady = false;
  let schedule: ResolvedScope;
  let conduct: ResolvedScope;
  let score: ResolvedScope;
  let findingsScope: ResolvedScope;
  let view: ResolvedScope;

  beforeAll(async () => {
    ready = await databaseReady('audits');
    if (!ready) return;

    const wh = await pool.query<{ id: string }>(`SELECT id FROM warehouses ORDER BY code LIMIT 1`);
    const warehouseId = wh.rows[0]?.id ?? null;
    zoneNorth = (
      await pool.query<{ id: string }>(
        `INSERT INTO zones (code, name, warehouse_id) VALUES ($1, 'AU North', $2) RETURNING id`,
        [`AU-N-${ts}`, warehouseId],
      )
    ).rows[0]!.id;
    zoneSouth = (
      await pool.query<{ id: string }>(
        `INSERT INTO zones (code, name, warehouse_id) VALUES ($1, 'AU South', $2) RETURNING id`,
        [`AU-S-${ts}`, warehouseId],
      )
    ).rows[0]!.id;
    zoneRated = (
      await pool.query<{ id: string }>(
        `INSERT INTO zones (code, name, warehouse_id) VALUES ($1, 'AU Rated', $2) RETURNING id`,
        [`AU-R-${ts}`, warehouseId],
      )
    ).rows[0]!.id;

    adminUser = newId();
    userIds.push(adminUser);
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'AU Admin', 'ADMIN', 'ACTIVE')`,
      [adminUser, `+9178${String(ts).slice(-8)}`],
    );

    const makeFarmer = async (label: string, zoneId: string, digit: string): Promise<string> => {
      const userId = newId();
      userIds.push(userId);
      await pool.query(
        `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, $3, 'FARMER', 'ACTIVE')`,
        [userId, `+9177${String(ts).slice(-7)}${digit}`, `AU Farmer ${label}`],
      );
      return (
        await pool.query<{ id: string }>(
          `INSERT INTO farmers (user_id, tohfa_farmer_id, zone_id, application_status, approved_by, approved_at)
           VALUES ($1, $2, $3, 'APPROVED', $4, now()) RETURNING id`,
          [userId, `TF-AU-${label}-${ts}`, zoneId, adminUser],
        )
      ).rows[0]!.id;
    };
    farmerNorth = await makeFarmer('N', zoneNorth, '1');
    farmerSouth = await makeFarmer('S', zoneSouth, '2');
    farmerRated = await makeFarmer('R', zoneRated, '3');
    farmerLegacy = await makeFarmer('L', zoneRated, '4');
    ratingLinkReady =
      (
        await pool.query<{ present: boolean }>(
          `SELECT EXISTS (SELECT 1 FROM information_schema.columns
                           WHERE table_name = 'farm_ratings' AND column_name = 'source_audit_id') AS present`,
        )
      ).rows[0]?.present === true;
    farmNorth = (
      await pool.query<{ id: string }>(
        `INSERT INTO farms (farmer_id, name, village) VALUES ($1, 'AU Hill Farm', 'Kotagiri') RETURNING id`,
        [farmerNorth],
      )
    ).rows[0]!.id;

    const scopeFor = (permission: string): ResolvedScope =>
      aScope({ level: ScopeLevel.ALL, permission, roleCode: RoleCode.SUPER_ADMIN, userId: adminUser });
    schedule = scopeFor('audit.schedule');
    conduct = scopeFor('audit.conduct');
    score = scopeFor('audit.score.categories');
    findingsScope = scopeFor('audit.findings.log');
    view = scopeFor('audit.view');
  });

  const scopeForRedFlag = (): ResolvedScope =>
    aScope({ level: ScopeLevel.ALL, permission: 'audit.red_flag.manage', roleCode: RoleCode.SUPER_ADMIN, userId: adminUser });

  afterAll(async () => {
    if (!ready) return;
    const farmerIds = [farmerNorth, farmerSouth, farmerRated, farmerLegacy];
    // Ratings first: farm_ratings.source_audit_id references audits (0028).
    await pool.query(`DELETE FROM farm_ratings WHERE farmer_id = ANY($1::uuid[])`, [farmerIds]);
    await pool.query(`DELETE FROM audits WHERE farmer_id = ANY($1::uuid[])`, [farmerIds]);
    await pool.query(`DELETE FROM farms WHERE farmer_id = ANY($1::uuid[])`, [farmerIds]);
    await pool.query(`DELETE FROM farmers WHERE id = ANY($1::uuid[])`, [farmerIds]);
    await pool.query(`DELETE FROM zones WHERE id = ANY($1::uuid[])`, [[zoneNorth, zoneSouth, zoneRated]]);
  });

  const fullSheet = (value: number): AuditScoresBody['scores'] =>
    CATEGORIES.map((c) => ({ categoryCode: c.code as AuditScoresBody['scores'][number]['categoryCode'], score: value }));

  async function runToCompletion(
    farmerId: string,
    scheduledFor: string,
    value: number | AuditScoresBody['scores'],
    findings: AuditFindingCreateBody[] = [],
    via: ReturnType<typeof createAuditsService> = service,
  ): Promise<string> {
    const { id } = await service.schedule(schedule, {
      farmerId,
      auditType: 'INTERNAL',
      scheduledFor,
      auditorUserId: adminUser,
    });
    await service.start(conduct, id, {});
    await service.setScores(score, id, { scores: typeof value === 'number' ? fullSheet(value) : value });
    for (const finding of findings) await service.createFinding(findingsScope, id, finding);
    await via.complete(conduct, id, {});
    return id;
  }

  /** Same as runToCompletion but stops before complete (for the atomicity test). */
  async function runToInProgress(farmerId: string, scheduledFor: string, value: number): Promise<string> {
    const { id } = await service.schedule(schedule, {
      farmerId,
      auditType: 'INTERNAL',
      scheduledFor,
      auditorUserId: adminUser,
    });
    await service.start(conduct, id, {});
    await service.setScores(score, id, { scores: fullSheet(value) });
    return id;
  }

  it('BR-03a: the real partial unique index refuses a second live audit in a quarter (409) and a cancelled one frees it', async () => {
    if (!ready) return;
    const first = await service.schedule(schedule, {
      farmerId: farmerSouth,
      auditType: 'EXTERNAL',
      scheduledFor: '2027-02-10T04:30:00Z',
      externalAgencyName: 'PGS Regional Council',
    });
    expect(first).toMatchObject({ fiscalYear: '2026-27', quarter: 4 });
    await expect(
      service.schedule(schedule, {
        farmerId: farmerSouth,
        auditType: 'INTERNAL',
        scheduledFor: '2027-03-01T04:30:00Z',
      }),
    ).rejects.toMatchObject({ code: 'AUDIT_QUARTER_TAKEN', status: 409 });
    await service.cancel(schedule, first.id, { reason: 'Agency postponed' });
    const replacement = await service.schedule(schedule, {
      farmerId: farmerSouth,
      auditType: 'INTERNAL',
      scheduledFor: '2027-03-01T04:30:00Z',
    });
    expect(replacement.quarter).toBe(4);
  });

  it('BR-04b: real seeded rating_tier_config maps 49/50/69/70/84/85 to POOR/MODERATE/MODERATE/GOOD/GOOD/EXCELLENT', async () => {
    if (!ready) return;
    const expected: Array<[number, string]> = [
      [49, 'POOR'],
      [50, 'MODERATE'],
      [69, 'MODERATE'],
      [70, 'GOOD'],
      [84, 'GOOD'],
      [85, 'EXCELLENT'],
    ];
    for (const [total, tier] of expected) {
      expect(await farmRatingsRepo.resolveTierForScore(pool, total)).toBe(tier);
    }
  });

  it('BR-04a + BR-05a + BR-06c: completion persists total and MAJOR count, tier follows config, market block untouched, one rating added', async () => {
    if (!ready) return;
    const before = await pool.query<{ overall_rating: string | null; rating_tier_code: string | null; blocked: boolean }>(
      `SELECT overall_rating::text, rating_tier_code, is_market_blocked AS blocked FROM farmers WHERE id = $1`,
      [farmerNorth],
    );
    const ratingsBefore = await pool.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM farm_ratings WHERE farmer_id = $1`,
      [farmerNorth],
    );

    const id = await runToCompletion(farmerNorth, '2026-11-05T04:30:00Z', 7, [
      { severity: 'MAJOR', description: 'Synthetic pesticide drums found.' },
      { severity: 'MAJOR', description: 'No buffer zone.' },
      { severity: 'MINOR', description: 'Register incomplete.' },
    ]);
    const stored = await pool.query<{ total_score: number; major_violations_count: number; red_flagged: boolean }>(
      `SELECT total_score, major_violations_count, red_flagged FROM audits WHERE id = $1`,
      [id],
    );
    expect(stored.rows[0]).toEqual({ total_score: 70, major_violations_count: 2, red_flagged: false });
    const detail = await service.get(view, id);
    expect(() => auditDetail.parse(detail)).not.toThrow();
    expect(detail).toMatchObject({ totalScore: 70, tier: 'GOOD', majorViolationsCount: 2, redFlagged: false });

    // BR-04a: a newer config generation changes the tier of the same stored score.
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO rating_tier_config (tier_code, label, min_score, max_score, sort_order, effective_from) VALUES
           ('POOR', 'Poor', 0, 75, 1, CURRENT_DATE), ('MODERATE', 'Moderate', 75, 90, 2, CURRENT_DATE),
           ('GOOD', 'Good', 90, 95, 3, CURRENT_DATE), ('EXCELLENT', 'Excellent', 95, NULL, 4, CURRENT_DATE)
         ON CONFLICT (tier_code, effective_from) DO UPDATE SET min_score = EXCLUDED.min_score, max_score = EXCLUDED.max_score`,
      );
      const inTx = createAuditsService({ db: client, runTx: async (fn) => fn(client) });
      expect((await inTx.get(view, id)).tier).toBe('POOR');
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }

    // Rule change 2026-10-01: an INTERNAL completion now derives the farm
    // rating (BR-06c), so overall_rating / rating_tier_code DO change here.
    // Nothing else may: the market block (and certification / payouts) stay
    // as they were (BR-05b, BR-38).
    const after = await pool.query<{ overall_rating: string | null; rating_tier_code: string | null; blocked: boolean }>(
      `SELECT overall_rating::text, rating_tier_code, is_market_blocked AS blocked FROM farmers WHERE id = $1`,
      [farmerNorth],
    );
    expect(after.rows[0]!.blocked).toBe(before.rows[0]!.blocked);
    expect(after.rows[0]).toMatchObject({ rating_tier_code: 'GOOD' });
    expect(Number(after.rows[0]!.overall_rating)).toBe(70);
    const ratingsAfter = await pool.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM farm_ratings WHERE farmer_id = $1`,
      [farmerNorth],
    );
    expect(Number(ratingsAfter.rows[0]!.n)).toBe(Number(ratingsBefore.rows[0]!.n) + 1);
  });

  // -------------------------------------------------------------------------
  // Farm rating derived from completed INTERNAL audits (product decision
  // 2026-10-01; BR-06c..g). Real tables, real transaction, real tier config.
  // -------------------------------------------------------------------------

  async function ratingRows(farmerId: string): Promise<Array<Record<string, unknown>>> {
    const result = await pool.query(
      `SELECT r.id, r.period_label, r.status, r.total_score::text AS total_score, r.tier_code, r.rated_by,
              r.rated_at, r.created_at, r.farm_id, r.zone_id, r.source_audit_id, r.notes,
              (SELECT json_agg(json_build_object('c', c.code, 's', s.score::text, 'r', s.remarks, 'by', s.scored_by)
                                ORDER BY c.sort_order)
                 FROM farm_rating_scores s JOIN rating_categories c ON c.id = s.category_id
                WHERE s.rating_id = r.id) AS scores
         FROM farm_ratings r
        WHERE r.farmer_id = $1
        ORDER BY r.created_at`,
      [farmerId],
    );
    return result.rows as Array<Record<string, unknown>>;
  }

  it('BR-06c: completing an INTERNAL audit creates a COMPLETE rating with its 10 scores, direct-sum total and config tier, linked by source_audit_id, with an audit_log row in the same transaction', async () => {
    if (!ready || !ratingLinkReady) return;
    const values = [8, 7, 9, 6, 7, 8, 6, 5, 6, 5]; // 67 -> MODERATE
    const sheet = CATEGORIES.map((c, index) => ({
      categoryCode: c.code as AuditScoresBody['scores'][number]['categoryCode'],
      score: values[index]!,
      ...(index === 0 ? { remarks: 'PGS certificate on file' } : {}),
    }));
    const auditId = await runToCompletion(farmerRated, '2026-05-05T04:30:00Z', sheet); // 2026-27 Q1

    const rows = await ratingRows(farmerRated);
    expect(rows).toHaveLength(1);
    const audit = (
      await pool.query<{ farm_id: string | null; zone_id: string | null }>(
        `SELECT farm_id, zone_id FROM audits WHERE id = $1`,
        [auditId],
      )
    ).rows[0]!;
    expect(rows[0]).toMatchObject({
      period_label: '2026-27 Q1',
      status: 'COMPLETE',
      total_score: '67.00',
      tier_code: 'MODERATE',
      rated_by: adminUser,
      source_audit_id: auditId,
      farm_id: audit.farm_id,
      zone_id: audit.zone_id,
    });
    expect(rows[0]!['rated_at']).not.toBeNull();
    const scores = rows[0]!['scores'] as Array<{ c: string; s: string; r: string | null; by: string }>;
    expect(scores).toHaveLength(10);
    expect(scores.map((entry) => Number(entry.s))).toEqual(values);
    expect(scores[0]).toMatchObject({ c: 'CERTIFICATION', r: 'PGS certificate on file', by: adminUser });
    expect(scores.slice(1).every((entry) => entry.r === null && entry.by === adminUser)).toBe(true);

    // Reads: admin (zone-scoped view) and the farmer (own) both see it as AUDIT.
    const admin = await farmRatingsService.getAdminRating(
      aScope({ level: ScopeLevel.ALL, permission: 'farmer.rating.view', roleCode: RoleCode.SUPER_ADMIN }),
      farmerRated,
    );
    expect(admin).toMatchObject({ overallRating: 67, ratingTier: 'MODERATE', source: 'AUDIT', sourceAuditId: auditId });
    const own = await farmRatingsService.getMyRating(
      aScope({ level: ScopeLevel.OWN, permission: 'farmer.rating.view', roleCode: RoleCode.FARMER, farmerId: farmerRated }),
    );
    expect(own).toMatchObject({ overallRating: 67, source: 'AUDIT', periodLabel: '2026-27 Q1' });
    const otherZone = farmRatingsService.getAdminRating(
      aScope({ level: ScopeLevel.VIEW, permission: 'farmer.rating.view', roleCode: RoleCode.FARMER_ADMIN, zoneIds: [zoneSouth] }),
      farmerRated,
    );
    await expect(otherZone).rejects.toMatchObject({ status: 404 });

    // audit_log: the rating row and the completion row share one transaction
    // (Postgres stamps both created_at values with the same transaction time).
    const logs = await pool.query<{ action_code: string; created_at: Date }>(
      `SELECT action_code, created_at FROM audit_log
        WHERE (entity_type = 'farm_rating' AND entity_id = $1) OR (entity_type = 'audit' AND entity_id = $2 AND action_code = 'audit.complete')`,
      [rows[0]!['id'], auditId],
    );
    expect(logs.rows.map((row) => row.action_code).sort()).toEqual(['audit.complete', 'farm_rating.create_from_audit']);
    expect(logs.rows[0]!.created_at.getTime()).toBe(logs.rows[1]!.created_at.getTime());

    // The database, not only the state machine, refuses a second rating for one audit.
    await expect(
      pool.query(
        `INSERT INTO farm_ratings (farmer_id, period_label, status, source_audit_id) VALUES ($1, 'DUP', 'DRAFT', $2)`,
        [farmerRated, auditId],
      ),
    ).rejects.toMatchObject({ code: '23505' });
  });

  it('BR-06d: completing an EXTERNAL audit creates no rating', async () => {
    if (!ready || !ratingLinkReady) return;
    const before = await ratingRows(farmerRated);
    const { id } = await service.schedule(schedule, {
      farmerId: farmerRated,
      auditType: 'EXTERNAL',
      scheduledFor: '2026-08-05T04:30:00Z', // 2026-27 Q2
      externalAgencyName: 'PGS Regional Council',
    });
    await service.start(conduct, id, {});
    await service.setScores(score, id, { scores: fullSheet(9) });
    await service.complete(conduct, id, {});
    await service.redFlag(scopeForRedFlag(), id, { reason: 'Escalate' });
    expect(await ratingRows(farmerRated)).toEqual(before);
  });

  it('BR-06f: a second INTERNAL completion adds a new current rating and leaves the earlier rating rows and scores unchanged', async () => {
    if (!ready || !ratingLinkReady) return;
    const before = await ratingRows(farmerRated);
    expect(before.length).toBeGreaterThanOrEqual(1);
    const cacheBefore = await pool.query(`SELECT overall_rating::text FROM farmers WHERE id = $1`, [farmerRated]);

    const auditId = await runToCompletion(farmerRated, '2026-11-05T04:30:00Z', 9); // 2026-27 Q3, 90
    const after = await ratingRows(farmerRated);
    expect(after).toHaveLength(before.length + 1);
    expect(after.slice(0, before.length)).toEqual(before); // history untouched
    expect(after[after.length - 1]).toMatchObject({ source_audit_id: auditId, total_score: '90.00', tier_code: 'EXCELLENT' });

    const current = await farmRatingsService.getMyRating(
      aScope({ level: ScopeLevel.OWN, permission: 'farmer.rating.view', roleCode: RoleCode.FARMER, farmerId: farmerRated }),
    );
    expect(current).toMatchObject({ periodLabel: '2026-27 Q3', overallRating: 90, ratingTier: 'EXCELLENT', sourceAuditId: auditId });
    const cacheAfter = await pool.query<{ overall_rating: string; rating_tier_code: string }>(
      `SELECT overall_rating::text, rating_tier_code FROM farmers WHERE id = $1`,
      [farmerRated],
    );
    expect(cacheAfter.rows[0]).toEqual({ overall_rating: '90.00', rating_tier_code: 'EXCELLENT' });
    expect(cacheAfter.rows[0]).not.toEqual(cacheBefore.rows[0]);
  });

  it('BR-06f: a legacy manual rating stays in history and reads as MANUAL until an audit-derived rating supersedes it', async () => {
    if (!ready || !ratingLinkReady) return;
    // A legacy row as the removed PUT used to write it: period CYCLE-n, no source audit.
    await pool.query(
      `INSERT INTO farm_ratings (farmer_id, zone_id, period_label, status, total_score, tier_code, rated_by, rated_at)
       VALUES ($1, $2, 'CYCLE-1', 'COMPLETE', 83, 'GOOD', $3, now())`,
      [farmerLegacy, zoneRated, adminUser],
    );
    const sa = aScope({ level: ScopeLevel.ALL, permission: 'farmer.rating.view', roleCode: RoleCode.SUPER_ADMIN });
    expect(await farmRatingsService.getAdminRating(sa, farmerLegacy)).toMatchObject({
      periodLabel: 'CYCLE-1',
      overallRating: 83,
      source: 'MANUAL',
      sourceAuditId: null,
    });
    const legacy = await ratingRows(farmerLegacy);

    const auditId = await runToCompletion(farmerLegacy, '2026-05-05T04:30:00Z', 7); // 2026-27 Q1, 70
    const current = await farmRatingsService.getAdminRating(sa, farmerLegacy);
    expect(current).toMatchObject({ overallRating: 70, ratingTier: 'GOOD', source: 'AUDIT', sourceAuditId: auditId });
    const rows = await ratingRows(farmerLegacy);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual(legacy[0]);
  });

  it('BR-06g: if creating the rating fails, the audit stays IN_PROGRESS and nothing partial is written', async () => {
    if (!ready || !ratingLinkReady) return;
    const auditId = await runToInProgress(farmerRated, '2027-02-05T04:30:00Z', 6); // 2026-27 Q4
    const ratingsBefore = await ratingRows(farmerRated);
    const cacheBefore = await pool.query(`SELECT overall_rating::text, rating_tier_code FROM farmers WHERE id = $1`, [
      farmerRated,
    ]);
    // The real recorder runs (rating + scores + cache + audit_log rows are
    // inserted), then the step after it fails: the whole transaction must roll back.
    const failing = createAuditsService({
      recordRating: async (tx, input) => {
        await farmRatingsService.recordAuditRating(tx, input);
        throw new Error('simulated failure after the rating insert');
      },
    });
    await expect(failing.complete(conduct, auditId, {})).rejects.toThrow('simulated failure');

    const audit = await pool.query<{ status: string; total_score: number | null; completed_at: Date | null }>(
      `SELECT status, total_score, completed_at FROM audits WHERE id = $1`,
      [auditId],
    );
    expect(audit.rows[0]).toEqual({ status: 'IN_PROGRESS', total_score: null, completed_at: null });
    expect(await ratingRows(farmerRated)).toEqual(ratingsBefore);
    const linked = await pool.query(`SELECT 1 FROM farm_ratings WHERE source_audit_id = $1`, [auditId]);
    expect(linked.rowCount).toBe(0);
    const logs = await pool.query(
      `SELECT 1 FROM audit_log WHERE (entity_type = 'audit' AND entity_id = $1 AND action_code = 'audit.complete')
                                 OR (action_code = 'farm_rating.create_from_audit' AND after->>'sourceAuditId' = $1::text)`,
      [auditId],
    );
    expect(logs.rowCount).toBe(0);
    const cacheAfter = await pool.query(`SELECT overall_rating::text, rating_tier_code FROM farmers WHERE id = $1`, [
      farmerRated,
    ]);
    expect(cacheAfter.rows[0]).toEqual(cacheBefore.rows[0]);

    // And once the failure is gone, the same audit completes normally.
    await service.complete(conduct, auditId, {});
    expect((await pool.query(`SELECT 1 FROM farm_ratings WHERE source_audit_id = $1`, [auditId])).rowCount).toBe(1);
  });

  it('BR-06a: completing with a missing category fails AUDIT_INCOMPLETE and leaves no audit.complete row behind', async () => {
    if (!ready) return;
    const { id } = await service.schedule(schedule, {
      farmerId: farmerNorth,
      auditType: 'INTERNAL',
      scheduledFor: '2026-08-05T04:30:00Z',
      auditorUserId: adminUser,
    });
    await service.start(conduct, id, {});
    await service.setScores(score, id, { scores: fullSheet(8).slice(0, 9) });
    await expect(service.complete(conduct, id, {})).rejects.toMatchObject({ code: 'AUDIT_INCOMPLETE', status: 422 });
    const rows = await pool.query<{ action_code: string }>(
      `SELECT action_code FROM audit_log WHERE entity_id = $1 ORDER BY created_at`,
      [id],
    );
    expect(rows.rows.map((r) => r.action_code)).toEqual(['audit.schedule', 'audit.start', 'audit.score']);
  });

  it('audit_log: a mutation that rolls back (quarter taken on reschedule) writes no audit_log row', async () => {
    if (!ready) return;
    const q1 = await service.schedule(schedule, {
      farmerId: farmerNorth,
      auditType: 'INTERNAL',
      scheduledFor: '2026-05-05T04:30:00Z',
    });
    // farmerNorth's Q3 is taken by the BR-05a test above.
    await expect(service.update(schedule, q1.id, { scheduledFor: '2026-12-01T04:30:00Z' })).rejects.toMatchObject({
      code: 'AUDIT_QUARTER_TAKEN',
    });
    const rows = await pool.query<{ action_code: string }>(`SELECT action_code FROM audit_log WHERE entity_id = $1`, [
      q1.id,
    ]);
    expect(rows.rows.map((r) => r.action_code)).toEqual(['audit.schedule']);
  });

  it('zone scope + BR-36: real SQL limits a Farmer Admin to their zone and a farmer to their own audits', async () => {
    if (!ready) return;
    const fa = aScope({
      level: ScopeLevel.CONDITIONAL,
      permission: 'audit.view',
      roleCode: RoleCode.FARMER_ADMIN,
      zoneIds: [zoneNorth],
      userId: adminUser,
      predicate: 'OWN_ZONE_ONLY',
    });
    const list = await service.list(fa, { limit: 100, sort: '-scheduledFor' });
    expect(list.items.length).toBeGreaterThan(0);
    expect(list.items.every((item) => item.farmerId === farmerNorth)).toBe(true);

    const southAudit = await pool.query<{ id: string }>(
      `SELECT id FROM audits WHERE farmer_id = $1 AND status <> 'CANCELLED' LIMIT 1`,
      [farmerSouth],
    );
    const southId = southAudit.rows[0]!.id;
    await expect(service.get(fa, southId)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(service.getReport(fa, southId, { variant: 'agency', redirect: false })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });

    const mine = await service.listMine(
      aScope({ level: ScopeLevel.OWN, permission: 'audit.view', roleCode: RoleCode.FARMER, farmerId: farmerNorth }),
      { limit: 100, sort: '-scheduledFor' },
    );
    expect(mine.items.length).toBeGreaterThan(0);
    await expect(
      service.getMine(
        aScope({ level: ScopeLevel.OWN, permission: 'audit.view', roleCode: RoleCode.FARMER, farmerId: farmerNorth }),
        southId,
      ),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('BR-03b: cancelled and in-progress audits do not count toward the 4 (real compliance SQL)', async () => {
    if (!ready) return;
    const summary = await service.compliance(view, { limit: 100, fiscalYear: '2026-27', zoneId: zoneNorth });
    const north = summary.farmers.find((f) => f.farmerId === farmerNorth)!;
    // farmerNorth: one COMPLETED (Q3), one IN_PROGRESS (Q2), one SCHEDULED (Q1).
    expect(north).toMatchObject({ completedCount: 1, requiredCount: 4, complianceStatus: 'PENDING' });
    expect(summary.counts.farmersInScope).toBe(1);
    expect(summary.counts.redFlaggedAudits).toBe(0);
    expect(summary.counts.openMajorFindings).toBe(2);

    const south = await service.compliance(view, { limit: 100, fiscalYear: '2026-27', zoneId: zoneSouth });
    // farmerSouth: one CANCELLED + one SCHEDULED in Q4 — zero completed.
    expect(south.farmers[0]).toMatchObject({ farmerId: farmerSouth, completedCount: 0 });
  });

  it('report: the generated PDF renders from real data and the farm location comes from the farm row', async () => {
    if (!ready) return;
    const completedAudit = await pool.query<{ id: string }>(
      `SELECT id FROM audits WHERE farmer_id = $1 AND status = 'COMPLETED' LIMIT 1`,
      [farmerNorth],
    );
    await pool.query(`UPDATE audits SET farm_id = $2 WHERE id = $1`, [completedAudit.rows[0]!.id, farmNorth]);
    const file = await service.getReport(view, completedAudit.rows[0]!.id, { variant: 'generated', redirect: false });
    expect(file.kind).toBe('file');
    expect((file as { body: Buffer }).body.subarray(0, 5).toString()).toBe('%PDF-');
  });
});

