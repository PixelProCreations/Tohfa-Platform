/**
 * farms.schema — Zod request/response schemas for a farmer's own land
 * locations (`farms`) and their zones (`plots`, "zones" in the farm diary —
 * see db/migrations/0003_farmers_and_farms.sql). Shapes mirror
 * docs/openapi.yaml exactly.
 *
 * `.strict()` on request bodies: an unexpected field is a client bug and we
 * would rather fail loudly than silently ignore it.
 */
import { z } from 'zod';

/**
 * GeoJSON Polygon, WGS84 (SRID 4326) — matches the `boundary` geography
 * column on both `farms` and `plots`. Mirrors the `fmbPolygon` shape in
 * farmer-applications.schema.ts so the two land-boundary capture paths speak
 * the same wire format.
 */
export const geoJsonPolygonSchema = z
  .object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.array(z.number()))),
  })
  .strict();
export type GeoJsonPolygon = z.infer<typeof geoJsonPolygonSchema>;

export const farmIdParams = z
  .object({
    farmId: z.string().uuid('farm id must be a UUID'),
  })
  .strict();
export type FarmIdParams = z.infer<typeof farmIdParams>;

export const farmPlotParams = z
  .object({
    farmId: z.string().uuid('farm id must be a UUID'),
    plotId: z.string().uuid('plot id must be a UUID'),
  })
  .strict();
export type FarmPlotParams = z.infer<typeof farmPlotParams>;

const nameSchema = z.string().trim().min(1, 'name is required').max(120);
const placeSchema = z.string().trim().min(1).max(120);
/** Free-text, mobile-constrained option (water source / boundary context / sun exposure). */
const optionSchema = z.string().trim().min(1).max(60);

/** POST /farms */
export const createFarmBody = z
  .object({
    name: nameSchema,
    areaAcres: z.number().positive().optional(),
    boundary: geoJsonPolygonSchema.optional(),
    village: placeSchema.optional(),
    taluk: placeSchema.optional(),
    district: placeSchema.optional(),
  })
  .strict();
export type CreateFarmBody = z.infer<typeof createFarmBody>;

/**
 * PATCH /farms/{farmId}. Every field is optional — only the keys the client
 * actually sends are changed. `boundary` is nullable on top of optional so
 * the service can tell "not supplied" apart from "supplied as null to clear
 * it" (see farms.service.ts#update).
 */
export const updateFarmBody = z
  .object({
    name: nameSchema.optional(),
    areaAcres: z.number().positive().optional(),
    boundary: geoJsonPolygonSchema.nullable().optional(),
    /** Server-derived acreage of `boundary`, named to match Step3Location.tsx / farmer-applications.schema.ts. */
    calculatedAreaAcres: z.number().nonnegative().optional(),
    village: placeSchema.optional(),
    taluk: placeSchema.optional(),
    district: placeSchema.optional(),
    waterSources: z.array(optionSchema).optional(),
    landBoundaryContext: z.array(optionSchema).optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .strict();
export type UpdateFarmBody = z.infer<typeof updateFarmBody>;

/** POST /farms/{farmId}/plots */
export const createPlotBody = z
  .object({
    name: nameSchema,
    areaAcres: z.number().positive().optional(),
    soilType: optionSchema.optional(),
    sunExposure: optionSchema.optional(),
    irrigationType: optionSchema.optional(),
  })
  .strict();
export type CreatePlotBody = z.infer<typeof createPlotBody>;

/** PATCH /farms/{farmId}/plots/{plotId} */
export const updatePlotBody = z
  .object({
    name: nameSchema.optional(),
    areaAcres: z.number().positive().optional(),
    soilType: optionSchema.optional(),
    sunExposure: optionSchema.optional(),
    irrigationType: optionSchema.optional(),
  })
  .strict();
export type UpdatePlotBody = z.infer<typeof updatePlotBody>;

/** Wire representation of one farm. Keep aligned with docs/openapi.yaml `Farm`. */
export const farmResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  surveyNumber: z.string().nullable(),
  areaAcres: z.number().nullable(),
  centroidLat: z.number().nullable(),
  centroidLng: z.number().nullable(),
  boundary: geoJsonPolygonSchema.nullable(),
  boundaryAreaAcres: z.number().nullable(),
  boundaryDrawnBy: z.string().uuid().nullable(),
  boundaryDrawnAt: z.string().nullable(),
  boundaryVersion: z.number().int(),
  address: z.string().nullable(),
  village: z.string().nullable(),
  taluk: z.string().nullable(),
  district: z.string(),
  isPrimary: z.boolean(),
  waterSources: z.array(z.string()),
  landBoundaryContext: z.array(z.string()),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type FarmResponse = z.infer<typeof farmResponse>;

/** GET /farms list item — the farm plus how many zones are drawn under it. */
export const farmListItemResponse = farmResponse.extend({
  plotCount: z.number().int(),
});
export type FarmListItemResponse = z.infer<typeof farmListItemResponse>;

export const listFarmsResponse = z.object({
  items: z.array(farmListItemResponse),
});
export type ListFarmsResponse = z.infer<typeof listFarmsResponse>;

/** Wire representation of one zone. Keep aligned with docs/openapi.yaml `Plot`. */
export const plotResponse = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  name: z.string(),
  areaAcres: z.number().nullable(),
  soilType: z.string().nullable(),
  sunExposure: z.string().nullable(),
  irrigationType: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type PlotResponse = z.infer<typeof plotResponse>;

export const listPlotsResponse = z.object({
  items: z.array(plotResponse),
});
export type ListPlotsResponse = z.infer<typeof listPlotsResponse>;
