/**
 * Which farm Profile's "Farm & FMB" card previews on its map, and what the map is given.
 *
 * A farmer can have several farms (one per registration Step 3 location), and the boundary they
 * drew in FMB Sketch can live on ANY of them -- `isPrimary` is not even guaranteed to be set on
 * one. The card used to preview only the primary-or-first farm, so an account whose first farm had
 * no boundary and no centroid showed an empty box even though its second farm had a boundary.
 * Preference order, most informative first:
 *   1. a farm with a drawn boundary (the primary one if it has one);
 *   2. a farm with a stored location/centroid (again primary first);
 *   3. the primary-or-first farm, centred on the default region.
 * The default region is passed explicitly rather than letting FarmBoundaryMap fall back to device
 * GPS: a passive preview on the Profile screen must not raise a location-permission prompt.
 */
import { FARM_MAP_FALLBACK_CENTER } from '@tohfa/mobile-ui';
import type { Farm } from '../../api/farms';
import { calculatePolygonMetrics } from '../../utils/geo';

/** [longitude, latitude] -- GeoJSON order, the same as FarmBoundaryMap's `LngLat`. */
export type PreviewLngLat = [number, number];

export interface FarmMapPreview {
  /** The farm being previewed, or null when the farmer has no farms at all. */
  farm: Farm | null;
  /** The farm's saved ring as stored (open or closed), or null when it has no usable boundary. */
  polygon: PreviewLngLat[] | null;
  /** Camera centre. Always set: the default region when the farm has no known location. */
  center: PreviewLngLat;
  /** False when `center` is only the default region, not a position on this farmer's land. */
  hasLocation: boolean;
  /** Distinct boundary vertices (a closing vertex that repeats the first is not counted). */
  fmbPointCount: number;
}

function isLngLat(point: unknown): point is PreviewLngLat {
  return (
    Array.isArray(point) &&
    point.length >= 2 &&
    typeof point[0] === 'number' &&
    typeof point[1] === 'number' &&
    Number.isFinite(point[0]) &&
    Number.isFinite(point[1])
  );
}

/** The farm's outer ring as stored, or [] when it is missing or malformed. */
function outerRing(farm: Farm): PreviewLngLat[] {
  const ring = farm.boundary?.coordinates?.[0];
  if (!Array.isArray(ring) || !ring.every(isLngLat)) return [];
  return ring.map((point) => [point[0]!, point[1]!] as PreviewLngLat);
}

function openVertexCount(ring: PreviewLngLat[]): number {
  if (ring.length < 2) return ring.length;
  const first = ring[0]!;
  const last = ring[ring.length - 1]!;
  return first[0] === last[0] && first[1] === last[1] ? ring.length - 1 : ring.length;
}

/** A ring needs 3 distinct vertices to be a shape; anything less is treated as no boundary. */
function usableRing(farm: Farm): PreviewLngLat[] | null {
  const ring = outerRing(farm);
  return openVertexCount(ring) >= 3 ? ring : null;
}

function storedCentroid(farm: Farm): PreviewLngLat | null {
  return farm.centroidLng != null && farm.centroidLat != null ? [farm.centroidLng, farm.centroidLat] : null;
}

/** Primary farm first, otherwise the API's own order (primary, then oldest -- farms.repo.ts). */
function primaryFirst(farms: Farm[]): Farm[] {
  return [...farms.filter((f) => f.isPrimary), ...farms.filter((f) => !f.isPrimary)];
}

/**
 * The farm the preview shows (preference order in the header comment). Exported so FMB Sketch --
 * which the preview's Edit button opens -- lands on the SAME farm: it used to open the
 * primary-or-first farm, so a boundary saved on any other farm showed on Profile but FMB Sketch
 * opened empty.
 */
export function pickPreviewFarm(farms: Farm[]): Farm | null {
  const ordered = primaryFirst(farms);
  return (
    ordered.find((f) => usableRing(f) !== null) ??
    ordered.find((f) => storedCentroid(f) !== null) ??
    ordered[0] ??
    null
  );
}

// ---- Camera target for ONE farm (FMB Sketch's farm list / Edit farm) ------------------------------

/**
 * Camera zoom for a farm that has only a stored location (no drawn boundary): the zoom Step 3 flies
 * to when the farmer picks a searched place, so a location-only farm opens the way Step 3 left it.
 */
export const FARM_LOCATION_ZOOM = 16;

/**
 * Fit-to-boundary limits. Mapbox's camera is Web Mercator with 512-dp tiles; a ring is fitted so
 * its bounding box spans about FIT_TARGET_DP on its longer side -- comfortably inside FMB Sketch's
 * map panel (full width x 360 dp) with room for the floating controls. Clamped so a tiny ring does
 * not zoom past usable satellite imagery and a huge/misdrawn one still shows a recognisable area.
 */
const MAPBOX_TILE_DP = 512;
const FIT_TARGET_DP = 220;
const FIT_MIN_ZOOM = 10;
const FIT_MAX_ZOOM = 18;

function mercatorY(latitude: number): number {
  const rad = (latitude * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + rad / 2));
}

/**
 * The camera zoom at which `ring`'s bounding box fits the map panel (see FIT_* above).
 * FarmBoundaryMap has no fit-bounds method -- only `initialZoom` and `flyTo(center, zoom)` -- so the
 * fit is computed here and handed to it as a zoom level.
 */
export function fitZoomForRing(ring: PreviewLngLat[]): number {
  if (ring.length === 0) return FARM_LOCATION_ZOOM;
  const lngs = ring.map((p) => p[0]);
  const lats = ring.map((p) => p[1]);
  const lngSpan = Math.max(...lngs) - Math.min(...lngs);
  const ySpan = Math.abs(mercatorY(Math.max(...lats)) - mercatorY(Math.min(...lats)));
  const zoomFor = (worldFraction: number) =>
    worldFraction > 0 ? Math.log2(FIT_TARGET_DP / (worldFraction * MAPBOX_TILE_DP)) : FIT_MAX_ZOOM;
  const zoom = Math.min(zoomFor(lngSpan / 360), zoomFor(ySpan / (2 * Math.PI)));
  return Math.max(FIT_MIN_ZOOM, Math.min(FIT_MAX_ZOOM, Math.round(zoom * 10) / 10));
}

export interface FarmMapTarget {
  /** What the farm can be shown by: its boundary, only its stored location, or nothing at all. */
  kind: 'boundary' | 'location' | 'none';
  /** The saved ring as stored, or null when it has no usable boundary. */
  polygon: PreviewLngLat[] | null;
  /**
   * Camera centre, or null when the farm has no known position. Deliberately NOT the default
   * region: FMB Sketch is an editor, so with null FarmBoundaryMap uses the device's own GPS (as
   * Step 3 does) and the screen says plainly that this farm has no location yet.
   */
  center: PreviewLngLat | null;
  zoom: number;
}

/**
 * Where the map should look for one specific farm -- what FMB Sketch uses when the farmer taps a
 * farm in "Your farms" or opens Edit farm. Same "ring centroid before stored centroid" order as the
 * preview above and Step3Location.tsx's `mapInitialCenter`.
 */
export function buildFarmMapTarget(farm: Farm | null | undefined): FarmMapTarget {
  const polygon = farm ? usableRing(farm) : null;
  if (polygon) {
    const { centroid } = calculatePolygonMetrics(polygon);
    return {
      kind: 'boundary',
      polygon,
      center: [centroid.longitude, centroid.latitude],
      zoom: fitZoomForRing(polygon),
    };
  }
  const center = farm ? storedCentroid(farm) : null;
  if (center) {
    return { kind: 'location', polygon: null, center, zoom: FARM_LOCATION_ZOOM };
  }
  return { kind: 'none', polygon: null, center: null, zoom: FARM_LOCATION_ZOOM };
}

export function buildFarmMapPreview(farms: Farm[]): FarmMapPreview {
  const picked = pickPreviewFarm(farms);

  const withBoundary = picked && usableRing(picked) !== null ? picked : null;
  if (withBoundary) {
    const polygon = usableRing(withBoundary)!;
    // The ring's OWN centroid, not the stored centroidLat/Lng: the stored pair is not updated
    // when a boundary is redrawn in FMB Sketch, so it can drift away from the shape it labels
    // (same order as FMBSketchScreen's `mapInitialCenter`).
    const { centroid } = calculatePolygonMetrics(polygon);
    return {
      farm: withBoundary,
      polygon,
      center: [centroid.longitude, centroid.latitude],
      hasLocation: true,
      fmbPointCount: openVertexCount(polygon),
    };
  }

  const withLocation = picked && storedCentroid(picked) !== null ? picked : null;
  if (withLocation) {
    return {
      farm: withLocation,
      polygon: null,
      center: storedCentroid(withLocation)!,
      hasLocation: true,
      fmbPointCount: 0,
    };
  }

  return {
    farm: picked,
    polygon: null,
    center: FARM_MAP_FALLBACK_CENTER,
    hasLocation: false,
    fmbPointCount: 0,
  };
}
