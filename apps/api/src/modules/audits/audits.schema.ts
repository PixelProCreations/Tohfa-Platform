/**
 * Audit Management (admin module 5) — Zod schemas. Every shape here mirrors a
 * schema in docs/openapi.yaml (tag `Audits`); keep them in step.
 *
 * Ground truth for the table shapes is db/migrations/0027_audits.sql. Two
 * deliberate validation splits, both copied from farm-ratings.schema.ts:
 *
 *  - `score` is checked for integer-ness only. A zod failure always surfaces
 *    as the generic VALIDATION_FAILED, but BR-06a names SCORE_OUT_OF_RANGE, so
 *    the range check lives in the service.
 *  - `fiscalYear`/`quarter` are never accepted from a client: the service
 *    derives them from `scheduledFor` in Asia/Kolkata (BR-03).
 */
import { z } from 'zod';

export const auditTypes = ['INTERNAL', 'EXTERNAL'] as const;
export type AuditType = (typeof auditTypes)[number];

export const auditStatuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
export type AuditStatus = (typeof auditStatuses)[number];

export const findingSeverities = ['MAJOR', 'MINOR', 'OBSERVATION'] as const;
export type FindingSeverity = (typeof findingSeverities)[number];

export const auditTiers = ['POOR', 'MODERATE', 'GOOD', 'EXCELLENT'] as const;
export type AuditTier = (typeof auditTiers)[number];

export const complianceStatuses = ['COMPLIANT', 'PENDING', 'NON_COMPLIANT'] as const;
export type ComplianceStatus = (typeof complianceStatuses)[number];

/** The 10 seeded `rating_categories` (BR-06), as the spec's RatingCategoryCode enum. */
export const ratingCategoryCodes = [
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
] as const;
export type RatingCategoryCode = (typeof ratingCategoryCodes)[number];

export const reportVariants = ['generated', 'agency'] as const;
export type ReportVariant = (typeof reportVariants)[number];

const fiscalYearSchema = z.string().regex(/^[0-9]{4}-[0-9]{2}$/, 'fiscalYear must look like 2026-27');
const isoDateTime = z.string().datetime({ offset: true, message: 'must be an ISO-8601 date-time' });
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date (YYYY-MM-DD)');
const booleanQuery = z.enum(['true', 'false']).transform((value) => value === 'true');
const cursorSchema = z.string().max(512);
const limitSchema = z.coerce.number().int().min(1).max(100).default(20);
const sortSchema = z.enum(['scheduledFor', '-scheduledFor']).default('-scheduledFor');

/** `status=SCHEDULED,IN_PROGRESS` -> ['SCHEDULED', 'IN_PROGRESS']; unknown values fail validation. */
const statusListSchema = z
  .string()
  .min(1)
  .transform((raw) => raw.split(',').map((part) => part.trim()))
  .pipe(z.array(z.enum(auditStatuses)).min(1));

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export const auditIdParams = z.object({ id: z.string().uuid('audit id must be a UUID') }).strict();
export type AuditIdParams = z.infer<typeof auditIdParams>;

export const auditFindingParams = z
  .object({
    id: z.string().uuid('audit id must be a UUID'),
    findingId: z.string().uuid('finding id must be a UUID'),
  })
  .strict();
export type AuditFindingParams = z.infer<typeof auditFindingParams>;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** GET /v1/admin/audits */
export const listAuditsQuery = z
  .object({
    cursor: cursorSchema.optional(),
    limit: limitSchema,
    farmerId: z.string().uuid().optional(),
    zoneId: z.string().uuid().optional(),
    status: statusListSchema.optional(),
    type: z.enum(auditTypes).optional(),
    fiscalYear: fiscalYearSchema.optional(),
    quarter: z.coerce.number().int().min(1).max(4).optional(),
    scheduledFrom: isoDateTime.optional(),
    scheduledTo: isoDateTime.optional(),
    redFlagged: booleanQuery.optional(),
    overdue: booleanQuery.optional(),
    hasOpenMajorFindings: booleanQuery.optional(),
    sort: sortSchema,
  })
  .strict();
export type ListAuditsQuery = z.infer<typeof listAuditsQuery>;

/** GET /v1/farmers/me/audits */
export const listMyAuditsQuery = z
  .object({
    cursor: cursorSchema.optional(),
    limit: limitSchema,
    fiscalYear: fiscalYearSchema.optional(),
    status: statusListSchema.optional(),
    type: z.enum(auditTypes).optional(),
    sort: sortSchema,
  })
  .strict();
export type ListMyAuditsQuery = z.infer<typeof listMyAuditsQuery>;

/** GET /v1/admin/audits/compliance */
export const complianceQuery = z
  .object({
    cursor: cursorSchema.optional(),
    limit: limitSchema,
    fiscalYear: fiscalYearSchema.optional(),
    zoneId: z.string().uuid().optional(),
    complianceStatus: z.enum(complianceStatuses).optional(),
  })
  .strict();
export type ComplianceQuery = z.infer<typeof complianceQuery>;

/**
 * GET /v1/admin/audits/:id/report and /v1/farmers/me/audits/:id/report.
 * `token`/`expires` are the short-lived signed link minted by `redirect=true`
 * (the same HMAC scheme as /invoices/{id}/download).
 */
export const reportQuery = z
  .object({
    variant: z.enum(reportVariants).default('generated'),
    redirect: booleanQuery.default('false'),
    token: z.string().max(128).optional(),
    expires: z.coerce.number().int().optional(),
  })
  .strict();
export type ReportQuery = z.infer<typeof reportQuery>;

// ---------------------------------------------------------------------------
// Request bodies
// ---------------------------------------------------------------------------

const agencyName = z.string().trim().min(2).max(200);

/** POST /v1/admin/audits — AuditCreate */
export const auditCreateBody = z
  .object({
    farmerId: z.string().uuid(),
    farmId: z.string().uuid().optional(),
    auditType: z.enum(auditTypes),
    scheduledFor: isoDateTime,
    auditorUserId: z.string().uuid().optional(),
    externalAgencyName: agencyName.optional(),
  })
  .strict();
export type AuditCreateBody = z.infer<typeof auditCreateBody>;

/** PATCH /v1/admin/audits/:id — AuditUpdate */
export const auditUpdateBody = z
  .object({
    scheduledFor: isoDateTime.optional(),
    farmId: z.string().uuid().nullable().optional(),
    auditorUserId: z.string().uuid().nullable().optional(),
    externalAgencyName: agencyName.optional(),
    reason: z.string().max(500).optional(),
  })
  .strict()
  .refine(
    (body) =>
      body.scheduledFor !== undefined ||
      body.farmId !== undefined ||
      body.auditorUserId !== undefined ||
      body.externalAgencyName !== undefined,
    { message: 'At least one field besides reason is required.' },
  );
export type AuditUpdateBody = z.infer<typeof auditUpdateBody>;

/** POST /v1/admin/audits/:id/cancel */
export const auditCancelBody = z.object({ reason: z.string().min(3).max(500) }).strict();
export type AuditCancelBody = z.infer<typeof auditCancelBody>;

/** POST /v1/admin/audits/:id/start (body optional) */
export const auditStartBody = z.object({ auditorUserId: z.string().uuid().optional() }).strict();
export type AuditStartBody = z.infer<typeof auditStartBody>;

const storageKeySchema = z.string().min(1).max(512);

/** PUT /v1/admin/audits/:id/scores — AuditScoresUpdate */
export const auditScoresBody = z
  .object({
    scores: z
      .array(
        z
          .object({
            categoryCode: z.enum(ratingCategoryCodes),
            score: z.number().int('score must be an integer'),
            remarks: z.string().max(1000).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(10),
    summary: z.string().max(4000).optional(),
    reportStorageKey: storageKeySchema.optional(),
  })
  .strict();
export type AuditScoresBody = z.infer<typeof auditScoresBody>;

/** POST /v1/admin/audits/:id/complete — AuditCompleteRequest (body optional) */
export const auditCompleteBody = z
  .object({
    summary: z.string().max(4000).optional(),
    reportStorageKey: storageKeySchema.optional(),
  })
  .strict();
export type AuditCompleteBody = z.infer<typeof auditCompleteBody>;

/** POST /v1/admin/audits/:id/findings — AuditFindingCreate */
export const auditFindingCreateBody = z
  .object({
    severity: z.enum(findingSeverities),
    categoryCode: z.enum(ratingCategoryCodes).optional(),
    description: z.string().trim().min(3).max(2000),
    correctiveAction: z.string().max(2000).optional(),
    dueDate: isoDate.optional(),
  })
  .strict();
export type AuditFindingCreateBody = z.infer<typeof auditFindingCreateBody>;

/** PATCH /v1/admin/audits/:id/findings/:findingId — AuditFindingUpdate */
export const auditFindingUpdateBody = z
  .object({
    severity: z.enum(findingSeverities).optional(),
    categoryCode: z.enum(ratingCategoryCodes).nullable().optional(),
    description: z.string().trim().min(3).max(2000).optional(),
    correctiveAction: z.string().max(2000).nullable().optional(),
    dueDate: isoDate.nullable().optional(),
    resolved: z.boolean().optional(),
    resolutionNote: z.string().max(2000).optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required.' });
export type AuditFindingUpdateBody = z.infer<typeof auditFindingUpdateBody>;

/** POST /v1/admin/audits/:id/red-flag */
export const auditRedFlagBody = z.object({ reason: z.string().min(3).max(500) }).strict();
export type AuditRedFlagBody = z.infer<typeof auditRedFlagBody>;

/** POST /v1/admin/audits/:id/clear-red-flag (body optional) */
export const auditClearRedFlagBody = z.object({ note: z.string().max(500).optional() }).strict();
export type AuditClearRedFlagBody = z.infer<typeof auditClearRedFlagBody>;

/** POST /v1/admin/audits/bulk-reschedule — AuditBulkRescheduleRequest */
export const auditBulkRescheduleBody = z
  .object({
    items: z
      .array(
        z
          .object({
            auditId: z.string().uuid(),
            expectedScheduledFor: isoDateTime.optional(),
          })
          .strict(),
      )
      .min(1)
      .max(100),
    newScheduledFor: isoDateTime.optional(),
    shiftDays: z
      .number()
      .int()
      .min(-90)
      .max(365)
      .refine((days) => days !== 0, 'shiftDays must not be 0')
      .optional(),
    reason: z.string().max(500).optional(),
  })
  .strict()
  .refine((body) => (body.newScheduledFor === undefined) !== (body.shiftDays === undefined), {
    message: 'Send exactly one of newScheduledFor or shiftDays.',
  });
export type AuditBulkRescheduleBody = z.infer<typeof auditBulkRescheduleBody>;

// ---------------------------------------------------------------------------
// Responses (admin)
// ---------------------------------------------------------------------------

export const auditFindingCounts = z.object({
  major: z.number().int().min(0),
  minor: z.number().int().min(0),
  observation: z.number().int().min(0),
  openMajor: z.number().int().min(0),
});
export type AuditFindingCounts = z.infer<typeof auditFindingCounts>;

export const auditCategoryScore = z.object({
  categoryCode: z.enum(ratingCategoryCodes),
  score: z.number().int().min(0).max(10).nullable(),
  maxScore: z.literal(10),
  remarks: z.string().nullable(),
});
export type AuditCategoryScore = z.infer<typeof auditCategoryScore>;

/** Admin-view finding. The farmer view omits `resolvedByName`. */
export const auditFinding = z.object({
  id: z.string().uuid(),
  auditId: z.string().uuid(),
  severity: z.enum(findingSeverities),
  categoryCode: z.enum(ratingCategoryCodes).nullable(),
  description: z.string(),
  correctiveAction: z.string().nullable(),
  dueDate: z.string().nullable(),
  resolvedAt: z.string().nullable(),
  resolvedByName: z.string().nullable(),
  resolutionNote: z.string().nullable(),
  createdAt: z.string(),
});
export type AuditFinding = z.infer<typeof auditFinding>;

export const farmerAuditFinding = auditFinding.omit({ resolvedByName: true });
export type FarmerAuditFinding = z.infer<typeof farmerAuditFinding>;

export const auditReportUpload = z.object({
  uploadId: z.string().uuid(),
  mimeType: z.string(),
  sizeBytes: z.number().int().min(1),
});

export const auditSummary = z.object({
  id: z.string().uuid(),
  farmerId: z.string().uuid(),
  tohfaFarmerId: z.string(),
  farmerName: z.string(),
  farmId: z.string().uuid().nullable(),
  farmName: z.string().nullable(),
  zoneId: z.string().uuid().nullable(),
  zoneName: z.string().nullable(),
  fiscalYear: z.string(),
  quarter: z.number().int().min(1).max(4),
  auditType: z.enum(auditTypes),
  status: z.enum(auditStatuses),
  scheduledFor: z.string(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  auditorUserId: z.string().uuid().nullable(),
  auditorName: z.string().nullable(),
  externalAgencyName: z.string().nullable(),
  totalScore: z.number().int().min(0).max(100).nullable(),
  maxScore: z.literal(100),
  tier: z.enum(auditTiers).nullable(),
  majorViolationsCount: z.number().int().min(0),
  findingCounts: auditFindingCounts,
  redFlagged: z.boolean(),
});
export type AuditSummary = z.infer<typeof auditSummary>;

export const audit = auditSummary.extend({
  summary: z.string().nullable(),
  reportUpload: auditReportUpload.nullable(),
  redFlagReason: z.string().nullable(),
  redFlaggedAt: z.string().nullable(),
  redFlaggedByName: z.string().nullable(),
  cancelledReason: z.string().nullable(),
  cancelledAt: z.string().nullable(),
  createdByName: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type Audit = z.infer<typeof audit>;

export const auditDetail = audit.extend({
  categoryScores: z.array(auditCategoryScore).length(10),
  findings: z.array(auditFinding),
});
export type AuditDetail = z.infer<typeof auditDetail>;

// ---------------------------------------------------------------------------
// Responses (farmer) — ALLOW-LISTS (BR-36). Red-flag, creator and other
// internal admin fields are absent on purpose: the service builds these
// objects key by key, so a new column on `audits` cannot leak to the app.
// ---------------------------------------------------------------------------

export const farmerAuditSummary = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid().nullable(),
  farmName: z.string().nullable(),
  fiscalYear: z.string(),
  quarter: z.number().int().min(1).max(4),
  auditType: z.enum(auditTypes),
  status: z.enum(auditStatuses),
  scheduledFor: z.string(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  auditorName: z.string().nullable(),
  externalAgencyName: z.string().nullable(),
  totalScore: z.number().int().min(0).max(100).nullable(),
  maxScore: z.literal(100),
  tier: z.enum(auditTiers).nullable(),
  majorViolationsCount: z.number().int().min(0),
  findingCounts: auditFindingCounts,
});
export type FarmerAuditSummary = z.infer<typeof farmerAuditSummary>;

export const farmerAuditDetail = farmerAuditSummary.extend({
  summary: z.string().nullable(),
  hasAgencyReport: z.boolean(),
  cancelledReason: z.string().nullable(),
  categoryScores: z.array(auditCategoryScore).length(10),
  findings: z.array(farmerAuditFinding),
});
export type FarmerAuditDetail = z.infer<typeof farmerAuditDetail>;

export const pageMeta = z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() });
export type PageMeta = z.infer<typeof pageMeta>;

export interface Paged<T> {
  items: T[];
  page: PageMeta;
}

// ---------------------------------------------------------------------------
// Bulk reschedule and compliance responses
// ---------------------------------------------------------------------------

export const bulkRescheduleFailureCodes = [
  'NOT_FOUND',
  'INVALID_STATE_TRANSITION',
  'AUDIT_QUARTER_TAKEN',
  'CONFLICT',
] as const;
export type BulkRescheduleFailureCode = (typeof bulkRescheduleFailureCodes)[number];

export const auditBulkRescheduleResult = z.object({
  rescheduledCount: z.number().int().min(0),
  failedCount: z.number().int().min(0),
  results: z.array(
    z.object({
      auditId: z.string().uuid(),
      outcome: z.enum(['RESCHEDULED', 'FAILED']),
      code: z.enum(bulkRescheduleFailureCodes).optional(),
      detail: z.string().optional(),
      audit: auditSummary.optional(),
    }),
  ),
});
export type AuditBulkRescheduleResult = z.infer<typeof auditBulkRescheduleResult>;

export const auditComplianceFarmer = z.object({
  farmerId: z.string().uuid(),
  tohfaFarmerId: z.string(),
  farmerName: z.string(),
  zoneId: z.string().uuid().nullable(),
  zoneName: z.string().nullable(),
  completedCount: z.number().int().min(0).max(4),
  requiredCount: z.literal(4),
  complianceStatus: z.enum(complianceStatuses),
  currentQuarterAudit: z
    .object({
      auditId: z.string().uuid(),
      status: z.enum(auditStatuses),
      scheduledFor: z.string(),
      overdue: z.boolean(),
    })
    .nullable(),
  redFlaggedAuditCount: z.number().int().min(0),
  openMajorFindingCount: z.number().int().min(0),
});
export type AuditComplianceFarmer = z.infer<typeof auditComplianceFarmer>;

export const auditComplianceSummary = z.object({
  fiscalYear: z.string(),
  isFiscalYearClosed: z.boolean(),
  currentQuarter: z.number().int().min(1).max(4).nullable(),
  currentQuarterEndsOn: z.string().nullable(),
  asOf: z.string(),
  counts: z.object({
    farmersInScope: z.number().int().min(0),
    compliant: z.number().int().min(0),
    pending: z.number().int().min(0),
    nonCompliant: z.number().int().min(0),
    overdueAudits: z.number().int().min(0),
    farmersWithoutCurrentQuarterAudit: z.number().int().min(0),
    redFlaggedAudits: z.number().int().min(0),
    redFlaggedFarmers: z.number().int().min(0),
    openMajorFindings: z.number().int().min(0),
    scheduledThisQuarter: z.number().int().min(0),
  }),
  farmers: z.array(auditComplianceFarmer),
  page: pageMeta,
});
export type AuditComplianceSummary = z.infer<typeof auditComplianceSummary>;
