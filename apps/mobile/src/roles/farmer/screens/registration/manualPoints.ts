/**
 * Pure logic behind registration Step 3's manual point entry (Step3Location.tsx): the list of
 * typed latitude/longitude rows a farmer uses when they cannot draw a boundary on the map (no GPS
 * lock, tree cover, an older handset), and what those rows are allowed to become on the saved
 * parcel.
 *
 * Deliberately imports no React / React Native -- only `calculatePolygonMetrics` and draft types --
 * so every rule here is unit-tested in this app's plain-Node vitest setup
 * (tests/step3ManualPoints.test.ts). Keep it that way: anything that needs the map or a component
 * belongs in the screen, not here.
 */
import type { FarmLocationData } from '../../storage/registrationDraft';
import { calculatePolygonMetrics } from '../../utils/geo';

/** [longitude, latitude] -- GeoJSON order, the same as FarmBoundaryMap's own `LngLat`. */
export type LngLat = [number, number];

/** One typed point. Text, not numbers: a half-typed "11." is not a number yet. */
export interface ManualPointRow {
  id: string;
  latText: string;
  lngText: string;
}

/**
 * Where the active parcel's boundary came from. It matters once a boundary exists: a manual one's
 * rows are its source of truth (so a vertex drag must be written back into them, and reopening the
 * panel must not wipe it), whereas a tap-drawn one has no rows at all.
 */
export type BoundaryOrigin = 'map' | 'manual';

/** How a parcel is positioned -- the three states the on-screen badge and chip dots show. */
export type ParcelPositioning = 'drawn' | 'manual' | 'none';

/**
 * What the typed rows currently amount to. Only `point` and `polygon` are ever committed to the
 * parcel; every other kind leaves it un-positioned, which is exactly what `validation.ts`'s
 * existing `locations.N.coordinates` check already catches -- so it needs no change for this path.
 */
export type ManualShape =
  | { kind: 'empty' }
  | { kind: 'invalid' }
  | { kind: 'point'; point: LngLat }
  | { kind: 'tooFew'; points: LngLat[] }
  | { kind: 'noArea'; points: LngLat[] }
  | { kind: 'polygon'; points: LngLat[]; ring: LngLat[]; areaSquareMeters: number };

/** A single row's own problem, for inline messaging under it. `null` = blank or fine. */
export type ManualRowIssue = 'incomplete' | 'latitudeRange' | 'longitudeRange';

/** Server-matching bounds -- see `farmLocationItemSchema` in apps/api's farmer-applications
 * schema (`z.number().min(-90).max(90)` / `.min(-180).max(180)`). Validated here too so nothing
 * the UI accepts gets a 400 back from the API. */
export function isValidLatitudeText(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed === '') return false;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= -90 && value <= 90;
}
export function isValidLongitudeText(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed === '') return false;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

let rowSequence = 0;

/**
 * A new row with its own id. The id is only a stable React key / edit target within this screen
 * session -- it is never persisted (the saved parcel stores coordinates, not rows).
 */
export function makeManualRow(latText = '', lngText = ''): ManualPointRow {
  rowSequence += 1;
  return { id: `manual-point-${rowSequence}`, latText, lngText };
}

function isBlankRow(row: ManualPointRow): boolean {
  return row.latText.trim() === '' && row.lngText.trim() === '';
}

export function manualRowIssue(row: ManualPointRow): ManualRowIssue | null {
  const latFilled = row.latText.trim() !== '';
  const lngFilled = row.lngText.trim() !== '';
  if (!latFilled && !lngFilled) return null;
  // A range problem is the more specific message, so it wins over "fill in the other half".
  if (latFilled && !isValidLatitudeText(row.latText)) return 'latitudeRange';
  if (lngFilled && !isValidLongitudeText(row.lngText)) return 'longitudeRange';
  if (latFilled !== lngFilled) return 'incomplete';
  return null;
}

// Local copies of FarmBoundaryMap.tsx's ring helpers. That file pulls in React Native and the
// Mapbox SDK, so it cannot be imported from a plain-Node test; these three are small and stable
// enough that duplicating them is cheaper than splitting the package.
function ringsEqual(a: LngLat, b: LngLat): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

/** GeoJSON polygons must close (first point === last point); vertex lists here are kept open. */
function closeRing(points: LngLat[]): LngLat[] {
  if (points.length < 3) return points;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return ringsEqual(first, last) ? points : [...points, first];
}

function openRing(points: LngLat[]): LngLat[] {
  if (points.length < 2) return points;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return ringsEqual(first, last) ? points.slice(0, -1) : points;
}

/**
 * Blank rows are ignored (the farmer may add a row before filling it). Any started-but-unusable
 * row makes the whole list `invalid` rather than being silently skipped -- saving the other rows
 * as if that one did not exist would store a boundary the farmer did not type.
 *
 * Duplicates are dropped, compared numerically ("11.40" === "11.4"). That also covers a farmer
 * who types the first corner again at the end to "close" the shape, which is how many people are
 * taught to write down a survey outline.
 */
export function classifyManualPoints(rows: ManualPointRow[]): ManualShape {
  const filled = rows.filter((row) => !isBlankRow(row));
  if (filled.length === 0) return { kind: 'empty' };
  if (filled.some((row) => !isValidLatitudeText(row.latText) || !isValidLongitudeText(row.lngText))) {
    return { kind: 'invalid' };
  }

  const points: LngLat[] = [];
  for (const row of filled) {
    const point: LngLat = [Number(row.lngText.trim()), Number(row.latText.trim())];
    if (!points.some((existing) => ringsEqual(existing, point))) points.push(point);
  }

  if (points.length === 1) return { kind: 'point', point: points[0]! };
  if (points.length === 2) return { kind: 'tooFew', points };

  const ring = closeRing(points);
  // Collinear points enclose nothing; `calculatePolygonMetrics` rounds to 0.01 m^2, so anything it
  // reports as zero is not an outline worth saving.
  const { areaSquareMeters } = calculatePolygonMetrics(ring);
  if (!(areaSquareMeters > 0)) return { kind: 'noArea', points };
  return { kind: 'polygon', points, ring, areaSquareMeters };
}

/** The pin FarmBoundaryMap should show for this shape: only a lone point, which has no polygon. */
export function markerFor(shape: ManualShape): LngLat | null {
  return shape.kind === 'point' ? shape.point : null;
}

/** The outer ring of a location's saved boundary, or an empty ring when it has none. */
function savedRingOf(location: FarmLocationData | undefined): number[][] {
  const ring = location?.fmbPolygon?.coordinates?.[0];
  return Array.isArray(ring) ? ring : [];
}

/**
 * A saved ring is a MANUAL one exactly when `gpsCaptured === false`: every boundary the screen
 * commits sets `gpsCaptured` to whether it was drawn on the map, so no extra field is needed to
 * tell the two apart. A ring with no flag at all (an older draft) predates manual polygons and is
 * therefore tap-drawn.
 */
function isManualRing(location: FarmLocationData | undefined): boolean {
  return savedRingOf(location).length >= 3 && location?.gpsCaptured === false;
}

export interface ManualSeed {
  rows: ManualPointRow[];
  /** Panel starts open exactly when there is manual data to show. */
  entryOpen: boolean;
  origin: BoundaryOrigin;
  markerCoord: LngLat | null;
}

/**
 * The manual-entry state to show when a parcel is opened (screen mount, or any parcel switch).
 *
 * A tap-drawn boundary seeds NOTHING: its centroid lives in the same `latitude`/`longitude` fields
 * a typed point uses, but it is not manual data -- reopening a drawn parcel must not resurrect a
 * manual panel that was never in use, or backfill it with the boundary's own centre.
 */
export function manualSeedOf(location: FarmLocationData | undefined): ManualSeed {
  if (isManualRing(location)) {
    const vertices = openRing(
      savedRingOf(location)
        .filter((pt) => Array.isArray(pt) && pt.length >= 2)
        .map((pt) => [pt[0]!, pt[1]!] as LngLat),
    );
    return {
      rows: vertices.map(([lng, lat]) => makeManualRow(String(lat), String(lng))),
      entryOpen: true,
      origin: 'manual',
      markerCoord: null,
    };
  }
  if (savedRingOf(location).length === 0 && location?.latitude !== undefined && location?.longitude !== undefined) {
    const latText = String(location.latitude);
    const lngText = String(location.longitude);
    const valid = isValidLatitudeText(latText) && isValidLongitudeText(lngText);
    return {
      rows: [makeManualRow(latText, lngText)],
      entryOpen: true,
      origin: 'manual',
      markerCoord: valid ? [location.longitude, location.latitude] : null,
    };
  }
  return { rows: [makeManualRow()], entryOpen: false, origin: 'map', markerCoord: null };
}

/**
 * How an already-committed parcel is positioned -- the same reading `positioningOf` in
 * Step5Review.tsx makes, plus the manual-polygon case (which Step 5 does not distinguish yet).
 * Used for the location chips' status dots, since only the active parcel has live editing state.
 */
export function committedPositioningOf(location: FarmLocationData | undefined): ParcelPositioning {
  if (savedRingOf(location).length >= 3) return isManualRing(location) ? 'manual' : 'drawn';
  if (location?.latitude !== undefined && location?.longitude !== undefined) return 'manual';
  return 'none';
}
