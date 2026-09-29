/**
 * soil.schema — Zod request/response schemas for a farmer's soil diary
 * (FR-F06): lab test records, amendments, moisture/erosion observations and
 * the crop rotation plan, all scoped to a single plot. Shapes mirror
 * docs/openapi.yaml exactly.
 *
 * `.strict()` on request bodies: an unexpected field is a client bug and we
 * would rather fail loudly than silently ignore it (same convention as
 * farms.schema.ts).
 */
import { z } from 'zod';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

export const farmOnlyParams = z
  .object({
    farmId: z.string().uuid('farm id must be a UUID'),
  })
  .strict();
export type FarmOnlyParams = z.infer<typeof farmOnlyParams>;

export const farmPlotParams = z
  .object({
    farmId: z.string().uuid('farm id must be a UUID'),
    plotId: z.string().uuid('plot id must be a UUID'),
  })
  .strict();
export type FarmPlotParams = z.infer<typeof farmPlotParams>;

export const soilTestIdParams = farmPlotParams.extend({
  testId: z.string().uuid('test id must be a UUID'),
});
export type SoilTestIdParams = z.infer<typeof soilTestIdParams>;

export const soilAmendmentIdParams = farmPlotParams.extend({
  amendmentId: z.string().uuid('amendment id must be a UUID'),
});
export type SoilAmendmentIdParams = z.infer<typeof soilAmendmentIdParams>;

export const exportSoilReportQuery = z
  .object({
    period: z.enum(['3 months', '6 months', 'All time']).default('6 months'),
    include: z.string().optional(),
    plotId: z.string().uuid().optional(),
    token: z.string().optional(),
    expires: z.coerce.number().optional(),
    redirect: z.coerce.boolean().optional(),
  })
  .strict();
export type ExportSoilReportQuery = z.infer<typeof exportSoilReportQuery>;

export const exportSoilReportResponse = z.object({
  downloadUrl: z.string(),
  fileName: z.string(),
  expiresAt: z.number(),
});
export type ExportSoilReportResponse = z.infer<typeof exportSoilReportResponse>;

// ---------------------------------------------------------------------------
// soil_test_records
// ---------------------------------------------------------------------------

/** Farmer/lab-selected, mobile-constrained (db/migrations/0021 comment). */
const limeStatusSchema = z.enum(['Harmless', 'Slight', 'Moderate', 'Severe']);

/** POST /farms/{farmId}/plots/{plotId}/soil-tests */
export const createSoilTestBody = z
  .object({
    testDate: dateSchema,
    nextDueDate: dateSchema,
    organicCarbonPct: z.number().min(0).max(100),
    ph: z.number().min(0).max(14),
    ecDsPerM: z.number().min(0),
    tdsPpm: z.number().int().min(0).optional(),
    nitrogenKgPerHa: z.number().min(0).optional(),
    phosphorusKgPerHa: z.number().min(0).optional(),
    potassiumKgPerHa: z.number().min(0).optional(),
    limeStatus: limeStatusSchema.optional(),
    /** Must reference an upload the caller owns — validated in the service, not just trusted (BR-36 spirit). */
    labReportUploadId: z.string().uuid().optional(),
  })
  .strict();
export type CreateSoilTestBody = z.infer<typeof createSoilTestBody>;

/** GET .../soil-tests/health-summary query — no params today; all three metrics return together. */
export const soilHealthSummaryQuery = z.object({}).strict();
export type SoilHealthSummaryQuery = z.infer<typeof soilHealthSummaryQuery>;

/** Wire representation of one soil test record. Keep aligned with docs/openapi.yaml `SoilTestRecord`. */
export const soilTestRecordResponse = z.object({
  id: z.string().uuid(),
  plotId: z.string().uuid(),
  testDate: z.string(),
  nextDueDate: z.string(),
  organicCarbonPct: z.number(),
  ph: z.number(),
  ecDsPerM: z.number(),
  tdsPpm: z.number().int().nullable(),
  nitrogenKgPerHa: z.number().nullable(),
  phosphorusKgPerHa: z.number().nullable(),
  potassiumKgPerHa: z.number().nullable(),
  limeStatus: z.string().nullable(),
  labReportUploadId: z.string().uuid().nullable(),
  // BR-40: every one of these is computed by the single classifySoilMetric()
  // function from system_config bands, never a client literal or a per-route
  // copy of the thresholds. Null exactly when the underlying reading is null.
  organicCarbonLabel: z.string(),
  phLabel: z.string(),
  ecLabel: z.string(),
  tdsLabel: z.string().nullable(),
  nitrogenLabel: z.string().nullable(),
  phosphorusLabel: z.string().nullable(),
  potassiumLabel: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type SoilTestRecordResponse = z.infer<typeof soilTestRecordResponse>;

export const listSoilTestsResponse = z.object({
  items: z.array(soilTestRecordResponse),
});
export type ListSoilTestsResponse = z.infer<typeof listSoilTestsResponse>;

const trendDirectionSchema = z.enum(['improving', 'declining', 'flat']).nullable();

/**
 * `currentValue` is nullable too (not just `previousValue`) so the "no test
 * records yet" and "tds_ppm was never recorded on any record" cases both
 * collapse to the same all-null shape, rather than needing a second nullable
 * wrapper around the whole metric object.
 */
const healthSummaryMetricResponse = z.object({
  currentValue: z.number().nullable(),
  previousValue: z.number().nullable(),
  deltaValue: z.number().nullable(),
  trendDirection: trendDirectionSchema,
  chartPoints: z.array(z.object({ month: z.string(), value: z.number() })),
});
export type HealthSummaryMetricResponse = z.infer<typeof healthSummaryMetricResponse>;

/**
 * GET .../soil-tests/health-summary returns all three tracked metrics in one
 * call (ph, organicCarbon, tds) rather than accepting a `metric` query param —
 * the mobile tracker screen renders all three together, so one round trip
 * avoids three. Pure arithmetic (BR-38 boundary: no advisory text here).
 */
export const soilHealthSummaryResponse = z.object({
  ph: healthSummaryMetricResponse,
  organicCarbon: healthSummaryMetricResponse,
  tds: healthSummaryMetricResponse,
});
export type SoilHealthSummaryResponse = z.infer<typeof soilHealthSummaryResponse>;

// ---------------------------------------------------------------------------
// soil_amendments
// ---------------------------------------------------------------------------

export const createSoilAmendmentBody = z
  .object({
    amendmentType: z.string().trim().min(1).max(120),
    quantityKg: z.number().positive(),
    appliedDate: dateSchema,
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();
export type CreateSoilAmendmentBody = z.infer<typeof createSoilAmendmentBody>;

export const updateSoilAmendmentBody = z
  .object({
    amendmentType: z.string().trim().min(1).max(120).optional(),
    quantityKg: z.number().positive().optional(),
    appliedDate: dateSchema.optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .strict();
export type UpdateSoilAmendmentBody = z.infer<typeof updateSoilAmendmentBody>;

export const soilAmendmentResponse = z.object({
  id: z.string().uuid(),
  plotId: z.string().uuid(),
  amendmentType: z.string(),
  quantityKg: z.number(),
  appliedDate: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type SoilAmendmentResponse = z.infer<typeof soilAmendmentResponse>;

export const listSoilAmendmentsResponse = z.object({
  items: z.array(soilAmendmentResponse),
});
export type ListSoilAmendmentsResponse = z.infer<typeof listSoilAmendmentsResponse>;

// ---------------------------------------------------------------------------
// soil_moisture_observations
// ---------------------------------------------------------------------------

const moistureLevelSchema = z.enum(['Dry', 'Moist', 'Wet']);

export const createSoilMoistureBody = z
  .object({
    level: moistureLevelSchema,
    /** Defaults to now() server-side when omitted. */
    observedAt: z.string().datetime().optional(),
  })
  .strict();
export type CreateSoilMoistureBody = z.infer<typeof createSoilMoistureBody>;

export const soilMoistureResponse = z.object({
  id: z.string().uuid(),
  plotId: z.string().uuid(),
  level: z.string(),
  observedAt: z.string(),
  observedBy: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type SoilMoistureResponse = z.infer<typeof soilMoistureResponse>;

export const listSoilMoistureResponse = z.object({
  items: z.array(soilMoistureResponse),
});
export type ListSoilMoistureResponse = z.infer<typeof listSoilMoistureResponse>;

// ---------------------------------------------------------------------------
// erosion_conservation_notes
// ---------------------------------------------------------------------------

const erosionRiskLevelSchema = z.enum(['Low Risk', 'Moderate Risk', 'High Risk']);

/**
 * `riskLevel` is a farmer self-assessment, never a server-computed risk model
 * — wiring this to weather/GIS data is exactly the automated-risk-indicator
 * territory BR-38 blocks pending client resolution.
 */
export const createErosionNoteBody = z
  .object({
    riskLevel: erosionRiskLevelSchema,
    practiceNotes: z.string().trim().max(2000).optional(),
    /** Defaults to now() server-side when omitted. */
    loggedAt: z.string().datetime().optional(),
  })
  .strict();
export type CreateErosionNoteBody = z.infer<typeof createErosionNoteBody>;

export const erosionNoteResponse = z.object({
  id: z.string().uuid(),
  plotId: z.string().uuid(),
  riskLevel: z.string(),
  practiceNotes: z.string().nullable(),
  loggedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type ErosionNoteResponse = z.infer<typeof erosionNoteResponse>;

export const listErosionNotesResponse = z.object({
  items: z.array(erosionNoteResponse),
});
export type ListErosionNotesResponse = z.infer<typeof listErosionNotesResponse>;

// ---------------------------------------------------------------------------
// crop_rotation_entries + cover_crop_windows
// ---------------------------------------------------------------------------

/** Farmer-selected, mobile-constrained (db/migrations/0021 comment). */
const cropRotationStatusSchema = z.enum(['CURRENT', 'NEXT', 'PLANNED']);

const cropRotationEntryInput = z
  .object({
    sequenceOrder: z.number().int().min(1),
    cropName: z.string().trim().min(1).max(120),
    plannedDate: dateSchema.optional(),
    status: cropRotationStatusSchema,
  })
  .strict();
export type CropRotationEntryInput = z.infer<typeof cropRotationEntryInput>;

/**
 * PUT /farms/{farmId}/plots/{plotId}/crop-rotation replaces the farmer's
 * whole ordered plan in one call (delete-then-insert). 100% farmer-entered
 * planning, never system-suggested (BR-38 boundary).
 */
export const putCropRotationBody = z
  .object({
    sequence: z.array(cropRotationEntryInput),
  })
  .strict()
  .superRefine((body, ctx) => {
    const seen = new Set<number>();
    for (const entry of body.sequence) {
      if (seen.has(entry.sequenceOrder)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['sequence'],
          message: `sequenceOrder ${entry.sequenceOrder} is repeated; each entry must have a distinct order.`,
        });
        break;
      }
      seen.add(entry.sequenceOrder);
    }
  });
export type PutCropRotationBody = z.infer<typeof putCropRotationBody>;

export const cropRotationEntryResponse = z.object({
  id: z.string().uuid(),
  plotId: z.string().uuid(),
  sequenceOrder: z.number().int(),
  cropName: z.string(),
  plannedDate: z.string().nullable(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type CropRotationEntryResponse = z.infer<typeof cropRotationEntryResponse>;

export const coverCropWindowResponse = z.object({
  id: z.string().uuid(),
  plotId: z.string().uuid(),
  coverCropType: z.string(),
  windowStart: z.string(),
  windowEnd: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type CoverCropWindowResponse = z.infer<typeof coverCropWindowResponse>;

export const cropRotationGetResponse = z.object({
  sequence: z.array(cropRotationEntryResponse),
  coverCropWindow: coverCropWindowResponse.nullable(),
});
export type CropRotationGetResponse = z.infer<typeof cropRotationGetResponse>;

/** POST /farms/{farmId}/plots/{plotId}/cover-crop-windows */
export const createCoverCropWindowBody = z
  .object({
    coverCropType: z.string().trim().min(1).max(120),
    windowStart: dateSchema,
    windowEnd: dateSchema,
  })
  .strict()
  .refine((body) => body.windowEnd >= body.windowStart, {
    message: 'windowEnd must be on or after windowStart',
    path: ['windowEnd'],
  });
export type CreateCoverCropWindowBody = z.infer<typeof createCoverCropWindowBody>;
