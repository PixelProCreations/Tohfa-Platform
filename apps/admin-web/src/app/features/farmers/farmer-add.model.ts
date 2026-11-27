/**
 * Draft model for Add Farmer Profile (SA-M3-S02d).
 *
 * A "plot / zone" on this screen is one entry of the farmer application's step-3 `locations[]`
 * (apps/api farmer-applications.schema.ts `locationSchema`): a client-generated `id`, a `label`, a
 * stated `areaAcres`, an optional GPS pin (`latitude`/`longitude`) and an optional FMB boundary
 * (`fmbPolygon`, a GeoJSON Polygon whose ring is closed and holds `[lng, lat]` positions).
 * `soilType` is the plot attribute stored as `plots.soil_type` once the farm exists.
 *
 * Nothing here is sent to the API: POST /v1/admin/farmers has no land-location field (spec gap,
 * see the component header). Keeping the exact application shape means the draft can be posted
 * unchanged once such an endpoint exists.
 */

/** `[lng, lat]`, the GeoJSON position order the application uses. */
export type LngLat = [number, number];

export interface FmbPolygon {
  type: 'Polygon';
  coordinates: LngLat[][];
}

export interface DraftPlot {
  /** `P-01`, `P-02`, … — step-3 `id` is a free client string (1–100 chars). */
  id: string;
  /** Step-3 `label`, 1–120 characters. */
  label: string;
  /** Step-3 `areaAcres`, > 0 and < 10,000,000. */
  areaAcres: number;
  soilType: string | null;
  latitude: number | null;
  longitude: number | null;
  fmbPolygon: FmbPolygon | null;
}

/** Limits from the application's step-3 schema. */
export const PLOT_LIMITS = {
  labelMax: 120,
  maxAcres: 10_000_000,
  notesMax: 500,
  minBoundaryPoints: 3,
} as const;

/** The next id in sequence. Ids are never reused after a delete, so a deleted plot's id stays retired. */
export function nextPlotId(issued: number): string {
  return `P-${String(issued + 1).padStart(2, '0')}`;
}

/** The open ring (first position not repeated) of a plot's boundary, or `[]`. */
export function openRing(plot: DraftPlot): LngLat[] {
  const ring = plot.fmbPolygon?.coordinates[0] ?? [];
  if (ring.length > 1) {
    const [first, last] = [ring[0]!, ring[ring.length - 1]!];
    if (first[0] === last[0] && first[1] === last[1]) return ring.slice(0, -1);
  }
  return ring;
}

/** A closed GeoJSON polygon from three or more open-ring points (the API requires first === last). */
export function closedPolygon(points: readonly LngLat[]): FmbPolygon {
  const first = points[0]!;
  return { type: 'Polygon', coordinates: [[...points, [first[0], first[1]]]] };
}

/** Vertex average; good enough for a label anchor and for the step-3 centroid pin. */
export function centroidOf(points: readonly LngLat[]): LngLat {
  const sum = points.reduce<LngLat>((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]);
  return [sum[0] / points.length, sum[1] / points.length];
}

/** A step-3 location counts as positioned (the submit gate) when it has a boundary or a pin. */
export function isPositioned(plot: DraftPlot): boolean {
  return plot.fmbPolygon !== null || (plot.latitude !== null && plot.longitude !== null);
}

/** Acres with two decimals, the way the design shows them. */
export function formatAcres(value: number): string {
  return value.toFixed(2);
}

/** Spreadsheet-style point letters: A … Z, AA, AB, … */
export function pointLabel(index: number): string {
  let n = index;
  let label = '';
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}
