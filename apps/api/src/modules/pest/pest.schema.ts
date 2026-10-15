/**
 * pest.schema — Zod request/response schemas for Pest Management (FR-F07):
 * the global pest reference library, admin-authored weather risk notes, and a
 * farmer's own per-plot detections, treatment logs and treatment reminders,
 * plus a farm-wide read-only analytics summary. Shapes mirror
 * docs/openapi.yaml exactly (the "Pest Management" tag, the Pest* and
 * WeatherRiskNote component schemas).
 *
 * `.strict()` on request bodies: an unexpected field is a client bug and we
 * would rather fail loudly than silently ignore it (same convention as
 * soil.schema.ts / farms.schema.ts). This is also what keeps server-owned
 * columns (`resolvedAt`, `completedAt`) out of client control — a body that
 * tries to set them is rejected, never trusted.
 */
import { z } from 'zod';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

/** Farmer-selected, mobile-constrained values (db/migrations/0023 column comments). */
const pestCategorySchema = z.enum(['Disease', 'Pest', 'Weed', 'Deficiency']);
const severitySchema = z.enum(['High', 'Medium', 'Low']);
const detectionStatusSchema = z.enum(['Ongoing', 'Resolved', 'Recurring']);
const reminderStatusSchema = z.enum(['Upcoming', 'Completed']);
const repeatIntervalSchema = z.enum(['ONE_TIME', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']);

// ---------------------------------------------------------------------------
// path params
// ---------------------------------------------------------------------------

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

export const pestDetectionIdParams = farmPlotParams.extend({
  detectionId: z.string().uuid('detection id must be a UUID'),
});
export type PestDetectionIdParams = z.infer<typeof pestDetectionIdParams>;

export const pestReminderIdParams = farmPlotParams.extend({
  reminderId: z.string().uuid('reminder id must be a UUID'),
});
export type PestReminderIdParams = z.infer<typeof pestReminderIdParams>;

export const pestLibraryIdParams = z
  .object({
    pestLibraryId: z.string().uuid('pest library id must be a UUID'),
  })
  .strict();
export type PestLibraryIdParams = z.infer<typeof pestLibraryIdParams>;

// ---------------------------------------------------------------------------
// pest_library (global reference catalog)
// ---------------------------------------------------------------------------

/** GET /pest-library query. */
export const listPestLibraryQuery = z
  .object({
    /** Case-insensitive substring match against name and scientificName. */
    q: z.string().trim().min(1).max(120).optional(),
    /** Case-insensitive exact match against one element of the crops array. */
    crop: z.string().trim().min(1).max(60).optional(),
  })
  .strict();
export type ListPestLibraryQuery = z.infer<typeof listPestLibraryQuery>;

/** Keep aligned with docs/openapi.yaml `PestLibraryEntry`. */
export const pestLibraryEntryResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  scientificName: z.string().nullable(),
  category: z.string(),
  riskLevel: z.string(),
  crops: z.array(z.string()),
  season: z.string().nullable(),
  symptoms: z.array(z.string()),
  organicTreatments: z.array(z.string()),
  prevention: z.array(z.string()),
  recommendedTreatment: z.string().nullable(),
  intervalDays: z.number().int().nullable(),
  phiDays: z.number().int().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type PestLibraryEntryResponse = z.infer<typeof pestLibraryEntryResponse>;

// ---------------------------------------------------------------------------
// weather_risk_notes (admin-authored, region-scoped static content)
// ---------------------------------------------------------------------------

/** Keep aligned with docs/openapi.yaml `WeatherRiskNote`. */
export const weatherRiskNoteResponse = z.object({
  id: z.string().uuid(),
  region: z.string(),
  note: z.string(),
  riskLevel: z.string().nullable(),
  validFrom: z.string().nullable(),
  validUntil: z.string().nullable(),
  createdBy: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type WeatherRiskNoteResponse = z.infer<typeof weatherRiskNoteResponse>;

// ---------------------------------------------------------------------------
// pest_detections
// ---------------------------------------------------------------------------

/** POST /farms/{farmId}/plots/{plotId}/pest-detections — docs/openapi.yaml `PestDetectionCreate`. */
export const createPestDetectionBody = z
  .object({
    farmCropId: z.string().uuid().optional(),
    pestLibraryId: z.string().uuid().optional(),
    pestName: z.string().trim().min(1).max(120),
    scientificName: z.string().trim().max(160).optional(),
    /** Free-text crop label from the mobile app's Crop/Zone picker — not a farm_crops FK. */
    cropLabel: z.string().trim().max(160).optional(),
    severity: severitySchema,
    detectedOn: dateSchema,
    notes: z.string().trim().max(2000).optional(),
    /** Must reference an upload the caller owns — validated in the service, not just trusted. */
    photoUploadId: z.string().uuid().optional(),
  })
  .strict();
export type CreatePestDetectionBody = z.infer<typeof createPestDetectionBody>;

/** PATCH .../pest-detections/{detectionId} — docs/openapi.yaml `PestDetectionUpdate`. */
export const updatePestDetectionBody = z
  .object({
    status: detectionStatusSchema.optional(),
    resolutionEffective: z.boolean().nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .strict();
export type UpdatePestDetectionBody = z.infer<typeof updatePestDetectionBody>;

/** Keep aligned with docs/openapi.yaml `PestDetection`. */
export const pestDetectionResponse = z.object({
  id: z.string().uuid(),
  plotId: z.string().uuid(),
  farmCropId: z.string().uuid().nullable(),
  pestLibraryId: z.string().uuid().nullable(),
  pestName: z.string(),
  scientificName: z.string().nullable(),
  cropLabel: z.string().nullable(),
  severity: z.string(),
  status: z.string(),
  detectedOn: z.string(),
  notes: z.string().nullable(),
  photoUploadId: z.string().uuid().nullable(),
  resolvedAt: z.string().nullable(),
  resolutionEffective: z.boolean().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type PestDetectionResponse = z.infer<typeof pestDetectionResponse>;

// ---------------------------------------------------------------------------
// pest_treatment_logs
// ---------------------------------------------------------------------------

/** POST .../pest-treatment-logs — docs/openapi.yaml `PestTreatmentLogCreate`. */
export const createPestTreatmentLogBody = z
  .object({
    farmCropId: z.string().uuid().optional(),
    detectionId: z.string().uuid().optional(),
    pestLibraryId: z.string().uuid().optional(),
    pestName: z.string().trim().min(1).max(120),
    category: pestCategorySchema,
    severity: severitySchema,
    treatment: z.string().trim().min(1).max(200),
    intervalDays: z.number().int().min(0).optional(),
    phiDays: z.number().int().min(0).optional(),
    appliedOn: dateSchema,
    nextApplicationDate: dateSchema.optional(),
    /** Must reference an upload the caller owns — validated in the service, not just trusted. */
    photoUploadId: z.string().uuid().optional(),
  })
  .strict();
export type CreatePestTreatmentLogBody = z.infer<typeof createPestTreatmentLogBody>;

/** Keep aligned with docs/openapi.yaml `PestTreatmentLog`. */
export const pestTreatmentLogResponse = z.object({
  id: z.string().uuid(),
  plotId: z.string().uuid(),
  farmCropId: z.string().uuid().nullable(),
  detectionId: z.string().uuid().nullable(),
  pestLibraryId: z.string().uuid().nullable(),
  pestName: z.string(),
  category: z.string(),
  severity: z.string(),
  treatment: z.string(),
  intervalDays: z.number().int().nullable(),
  phiDays: z.number().int().nullable(),
  appliedOn: z.string(),
  nextApplicationDate: z.string().nullable(),
  photoUploadId: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type PestTreatmentLogResponse = z.infer<typeof pestTreatmentLogResponse>;

// ---------------------------------------------------------------------------
// pest_treatment_reminders
// ---------------------------------------------------------------------------

/** POST .../pest-treatment-reminders — docs/openapi.yaml `PestTreatmentReminderCreate`. */
export const createPestTreatmentReminderBody = z
  .object({
    detectionId: z.string().uuid().optional(),
    title: z.string().trim().min(1).max(160),
    targetPest: z.string().trim().max(120).optional(),
    dueDate: dateSchema,
    repeatInterval: repeatIntervalSchema.default('ONE_TIME'),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();
export type CreatePestTreatmentReminderBody = z.infer<typeof createPestTreatmentReminderBody>;

/**
 * PATCH .../pest-treatment-reminders/{reminderId} — docs/openapi.yaml
 * `PestTreatmentReminderUpdate`. No `completedAt` field: the server stamps it
 * when `status` becomes `Completed`, and `.strict()` rejects a client value.
 */
export const updatePestTreatmentReminderBody = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    dueDate: dateSchema.optional(),
    status: reminderStatusSchema.optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .strict();
export type UpdatePestTreatmentReminderBody = z.infer<typeof updatePestTreatmentReminderBody>;

/** Keep aligned with docs/openapi.yaml `PestTreatmentReminder`. */
export const pestTreatmentReminderResponse = z.object({
  id: z.string().uuid(),
  plotId: z.string().uuid(),
  detectionId: z.string().uuid().nullable(),
  title: z.string(),
  targetPest: z.string().nullable(),
  dueDate: z.string(),
  repeatInterval: z.string(),
  status: z.string(),
  completedAt: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type PestTreatmentReminderResponse = z.infer<typeof pestTreatmentReminderResponse>;

// ---------------------------------------------------------------------------
// pest analytics (read-only aggregate)
// ---------------------------------------------------------------------------

/** Keep aligned with docs/openapi.yaml `PestAnalyticsSummary`. */
export const pestAnalyticsSummaryResponse = z.object({
  detectionsBySeason: z.array(z.object({ season: z.string(), count: z.number().int().min(0) })),
  mostAffectedCrops: z.array(z.object({ crop: z.string(), count: z.number().int().min(0) })),
  treatmentEffectiveness: z.array(
    z.object({
      treatment: z.string(),
      timesUsed: z.number().int().min(0),
      timesEffective: z.number().int().min(0),
    }),
  ),
});
export type PestAnalyticsSummaryResponse = z.infer<typeof pestAnalyticsSummaryResponse>;
