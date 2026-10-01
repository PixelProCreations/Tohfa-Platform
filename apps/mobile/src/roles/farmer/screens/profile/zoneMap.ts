/**
 * Pure logic behind the Zones map (ZonesScreen.tsx) and its inline zone boundary editor
 * (useZoneBoundaryEditor.ts): turning a farm's / zone's stored GeoJSON into map rings, choosing
 * where the camera starts, the per-zone colour + letter scheme, which overlays the map shows, which
 * ring a half-edited zone would commit, and what a drawn boundary becomes on save.
 *
 * Deliberately imports no React / React Native -- the same constraint as
 * ../registration/manualPoints.ts -- so every rule here is unit-tested in this app's plain-Node
 * vitest setup (tests/zoneMap.test.ts).
 */
// Note: pointInRing is re-exported from the package index, so this can now go through the public
// export instead of a deep src/ import. It is the SAME test FarmBoundaryMap's `containWithin` applies,
// so a typed corner and a tapped one are judged alike.
import { containmentRingOf, isPointInRing, ringFitsWithin } from '@tohfa/mobile-ui';
import type { TranslationKey } from '../../../../i18n/farmer';
import type { Farm, GeoPolygon } from '../../api/farms';
import { authPalette as P } from '../../theme';
import { calculatePolygonMetrics } from '../../utils/geo';
import {
  manualRowIssue,
  type BoundaryOrigin,
  type ManualPointRow,
  type ManualShape,
  type ParcelPositioning,
} from '../registration/manualPoints';

/** [longitude, latitude] -- GeoJSON order, the same as FarmBoundaryMap's own `LngLat`. */
export type LngLat = [number, number];

function samePoint(a: LngLat, b: LngLat): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

/** Number of distinct vertices in a ring, ignoring a closing repeat of the first point. */
function vertexCount(ring: LngLat[]): number {
  if (ring.length >= 2 && samePoint(ring[0]!, ring[ring.length - 1]!)) return ring.length - 1;
  return ring.length;
}

/**
 * The outer ring of a stored polygon as clean [lng, lat] pairs, or `[]` when there is no usable
 * shape (null, malformed, or fewer than 3 distinct vertices). Never throws on bad data: a zone
 * saved by an older client with a broken ring must still leave the rest of the map working.
 */
export function outerRingOf(polygon: GeoPolygon | null | undefined): LngLat[] {
  const ring = polygon?.coordinates?.[0];
  if (!Array.isArray(ring)) return [];
  const points = ring
    .filter(
      (pt) =>
        Array.isArray(pt) && pt.length >= 2 && Number.isFinite(pt[0]) && Number.isFinite(pt[1]),
    )
    .map((pt) => [pt[0]!, pt[1]!] as LngLat);
  return vertexCount(points) >= 3 ? points : [];
}

/** Centroid of a ring as [lng, lat], or null when the ring is not a polygon. */
export function centerOfRing(ring: LngLat[]): LngLat | null {
  if (vertexCount(ring) < 3) return null;
  const { centroid } = calculatePolygonMetrics(ring);
  return [centroid.longitude, centroid.latitude];
}

/**
 * Where a farm's map should open: its drawn boundary's centroid, else the farm's stored centroid,
 * else `null` -- which tells FarmBoundaryMap to use the device's GPS position. Never a made-up
 * fallback coordinate.
 */
export function farmMapCenter(
  farm: Pick<Farm, 'boundary' | 'centroidLat' | 'centroidLng'> | null | undefined,
): LngLat | null {
  if (!farm) return null;
  const fromBoundary = centerOfRing(outerRingOf(farm.boundary));
  if (fromBoundary) return fromBoundary;
  const { centroidLat, centroidLng } = farm;
  if (
    typeof centroidLat === 'number' &&
    typeof centroidLng === 'number' &&
    Number.isFinite(centroidLat) &&
    Number.isFinite(centroidLng)
  ) {
    return [centroidLng, centroidLat];
  }
  return null;
}

/**
 * `Plot` has no colour field on the backend, so a zone's colour is derived from its position in
 * the farm's zone list -- which the API returns in creation order (`ORDER BY p.created_at ASC`,
 * farms.repo.ts). That makes the colour stable for a zone across visits, and lets the inline editor
 * preview a NEW zone in exactly the colour it will get once saved (`zones.length` -- see
 * `editingZoneIndex`).
 */
export const ZONE_COLORS: readonly string[] = [
  P.deepGreen,
  P.orange900,
  P.deepPurple400,
  P.red600,
  P.brown400,
  P.blue700,
];

/** The farm's own outline, drawn dashed and unfilled behind every zone. */
export const FARM_OUTLINE_COLOR: string = P.yellow500;

export function zoneColorFor(index: number): string {
  const slot = ((index % ZONE_COLORS.length) + ZONE_COLORS.length) % ZONE_COLORS.length;
  return ZONE_COLORS[slot]!;
}

/** A, B, ... Z, then A2, B2, ... -- a short badge that stays unique however many zones a farm has. */
export function zoneLetterFor(index: number): string {
  const safe = Math.max(0, Math.floor(index));
  const letter = String.fromCharCode(65 + (safe % 26));
  const cycle = Math.floor(safe / 26);
  return cycle === 0 ? letter : `${letter}${cycle + 1}`;
}

/** A closed GeoJSON polygon for a drawn ring, or null when it is not a polygon yet. */
export function polygonFromRing(ring: LngLat[]): GeoPolygon | null {
  if (vertexCount(ring) < 3) return null;
  const pairs = ring.map(([lng, lat]) => [lng, lat]);
  const first = ring[0]!;
  const last = ring[ring.length - 1]!;
  const closed = samePoint(first, last) ? pairs : [...pairs, [first[0], first[1]]];
  return { type: 'Polygon', coordinates: [closed] };
}

/**
 * A choice for one of a zone's descriptive fields. `value` is what is stored and sent to the API
 * (existing rows already hold these exact English strings, so they are data, not copy); `labelKey`
 * is what the farmer reads.
 */
export interface ZoneOption {
  value: string;
  labelKey: TranslationKey;
}

export const SOIL_OPTIONS: readonly ZoneOption[] = [
  { value: 'Red soil', labelKey: 'farmer.zones.soil.redSoil' },
  { value: 'Loamy', labelKey: 'farmer.zones.soil.loamy' },
  { value: 'Sandy', labelKey: 'farmer.zones.soil.sandy' },
  { value: 'Clay', labelKey: 'farmer.zones.soil.clay' },
  { value: 'Black soil', labelKey: 'farmer.zones.soil.blackSoil' },
  { value: 'Alluvial', labelKey: 'farmer.zones.soil.alluvial' },
];

export const EXPOSURE_OPTIONS: readonly ZoneOption[] = [
  { value: 'Full sun', labelKey: 'farmer.zones.exposure.fullSun' },
  { value: 'Partial', labelKey: 'farmer.zones.exposure.partial' },
  { value: 'Shade', labelKey: 'farmer.zones.exposure.shade' },
];

export const IRRIGATION_OPTIONS: readonly ZoneOption[] = [
  { value: 'Drip', labelKey: 'farmer.zones.irrigation.drip' },
  { value: 'Sprinkler', labelKey: 'farmer.zones.irrigation.sprinkler' },
  { value: 'Flood', labelKey: 'farmer.zones.irrigation.flood' },
  { value: 'Rainfed', labelKey: 'farmer.zones.irrigation.rainfed' },
  { value: 'Furrow', labelKey: 'farmer.zones.irrigation.furrow' },
];

/**
 * The label key for a stored value, or null when the value is not one of the known options (e.g.
 * free text saved by another client) -- the caller then shows the stored value as-is rather than
 * hiding real data behind a blank.
 */
export function optionLabelKey(
  options: readonly ZoneOption[],
  value: string | null | undefined,
): TranslationKey | null {
  if (!value) return null;
  return options.find((option) => option.value === value)?.labelKey ?? null;
}

export type ZoneAreaResolution =
  | { ok: true; areaAcres: number | undefined }
  | { ok: false };

/**
 * The area to send for a zone. The farmer's typed figure wins when there is one (it must be a
 * strictly positive number -- `PlotCreate.areaAcres` in docs/openapi.yaml rejects 0). With the
 * field left blank, the map-measured area of the drawn boundary is used, so a zone that was drawn
 * but not typed still reports a size; a measurement that rounds to 0 is not sent at all.
 */
export function resolveZoneAreaAcres(typedText: string, measuredAcres: number): ZoneAreaResolution {
  const trimmed = typedText.trim();
  if (trimmed === '') {
    return { ok: true, areaAcres: measuredAcres > 0 ? measuredAcres : undefined };
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return { ok: false };
  return { ok: true, areaAcres: parsed };
}

// ---- A zone's area vs. the farm's own total ------------------------------------------------------
// Zones are sub-divisions of ONE farm, so their areas summed can never legitimately exceed the
// farm's own size. Nothing about `resolveZoneAreaAcres` (or the farm/zone API shapes) enforces that
// on its own -- each zone's area is just a free-typed number, or a drawn boundary's measured area,
// with no cross-check -- so this screen adds the check client-side before a save goes through.

/**
 * Tolerance, in acres, for comparing a zone's area against the farm's own total. Area here is
 * never exact -- a farmer's typed figure or a drawn boundary's measured area both carry real
 * rounding -- so a zone that fits the farm almost exactly must not be blocked by noise of a
 * hundredth of an acre.
 */
export const ZONE_AREA_TOLERANCE_ACRES = 0.01;

/** Whether one zone's area fits within the farm's remaining budget, and by how much it does not. */
export type ZoneAreaBudgetCheck =
  | { ok: true }
  | {
      ok: false;
      /** This zone's own resolved area, as it would be saved. */
      zoneAcres: number;
      /** What the farm's total marked area would become if this save went through. */
      wouldBeAcres: number;
      /** The farm's own known total area -- the ceiling that was exceeded. */
      farmTotalAcres: number;
    };

/**
 * Whether saving a zone with `zoneAcres` -- alongside every OTHER zone already on this farm,
 * summing to `otherZonesAcres` -- would push the farm's total marked area over its own known size.
 *
 * `farmTotalAcres` of 0 (or any non-positive value) means the farm has no known total yet --
 * neither a measured boundary nor a farmer-typed figure (see `ZonesScreen`'s own `farmTotalAcres`,
 * which prefers the measured boundary over the typed figure, the same order used here) -- so there
 * is no ceiling to check against and nothing is ever blocked.
 */
export function checkZoneAreaBudget(params: {
  farmTotalAcres: number;
  otherZonesAcres: number;
  zoneAcres: number;
}): ZoneAreaBudgetCheck {
  const { farmTotalAcres, otherZonesAcres, zoneAcres } = params;
  if (!(farmTotalAcres > 0)) return { ok: true };
  const wouldBeAcres = otherZonesAcres + zoneAcres;
  if (wouldBeAcres <= farmTotalAcres + ZONE_AREA_TOLERANCE_ACRES) return { ok: true };
  return { ok: false, zoneAcres, wouldBeAcres, farmTotalAcres };
}

/**
 * Whether a farm's zones ALREADY add up to more than its own known total area -- e.g. the 8 zones
 * on a 4.77-acre farm summing to 13.50 ac that this check did not exist to prevent. Read-only: used
 * to show a warning, never to block the screen (see `ZonesScreen`'s stats row). Same tolerance as
 * `checkZoneAreaBudget`, and the same "no known total" exemption.
 */
export function isZoneAreaOverAllocated(farmTotalAcres: number, totalMarkedAcres: number): boolean {
  return farmTotalAcres > 0 && totalMarkedAcres > farmTotalAcres + ZONE_AREA_TOLERANCE_ACRES;
}

// ---- Inline editor derivations ------------------------------------------------------------------

/** The editor state that decides which ring a zone under edit would be saved with. */
export interface ZoneBoundaryInputs {
  /** The boundary as the map last reported it (closed ring once it has 3+ vertices). */
  coords: LngLat[];
  manualEntryOpen: boolean;
  boundaryOrigin: BoundaryOrigin;
  manualShape: ManualShape;
}

/**
 * The typed outline, when the typed rows are what decides the zone's shape: while the panel is
 * open, or whenever the boundary on the map IS the typed one. A tap-drawn boundary completed while
 * the panel was open collapses it and flips the origin to 'map', handing authority back to the map.
 * A zone is an area, so only a real outline is ever committed from typed rows -- unlike
 * registration Step 3, a lone typed point is not a usable position for a zone.
 */
export function committedManualRingOf(inputs: ZoneBoundaryInputs): LngLat[] | null {
  const isManualAuthoritative = inputs.manualEntryOpen || inputs.boundaryOrigin === 'manual';
  return isManualAuthoritative && inputs.manualShape.kind === 'polygon' ? inputs.manualShape.ring : null;
}

/** The ring that would be saved right now: the typed outline if authoritative, else the map's. */
export function committedZoneRing(inputs: ZoneBoundaryInputs): LngLat[] {
  return committedManualRingOf(inputs) ?? (inputs.coords.length >= 3 ? inputs.coords : []);
}

/** How the zone under edit is positioned, for its badge. */
export function zoneBoundaryPositioning(inputs: ZoneBoundaryInputs): ParcelPositioning {
  if (committedManualRingOf(inputs)) return 'manual';
  return inputs.coords.length >= 3 ? 'drawn' : 'none';
}

/** Vertices placed so far, not counting the closing repeat a finished ring carries. */
export function boundaryPointCount(coords: LngLat[]): number {
  return coords.length >= 3 ? coords.length - 1 : coords.length;
}

/**
 * Whether two rings describe the same outline, ignoring whether either carries a closing repeat --
 * the map reports closed rings, a stored polygon may or may not be. Used to tell whether an edit
 * actually changed a zone's shape before asking the farmer to confirm discarding it.
 */
export function sameRing(a: LngLat[], b: LngLat[]): boolean {
  const open = (ring: LngLat[]): LngLat[] =>
    ring.length >= 2 && samePoint(ring[0]!, ring[ring.length - 1]!) ? ring.slice(0, -1) : ring;
  const oa = open(a);
  const ob = open(b);
  return oa.length === ob.length && oa.every((pt, index) => samePoint(pt, ob[index]!));
}

// ---- Keeping a zone inside its farm -------------------------------------------------------------
// A zone is part of a farm, so none of its corners may land outside the farm's own boundary. The map
// enforces this for taps and drags (FarmBoundaryMap's `containWithin`); these helpers apply the same
// test to typed corners and to a ring that was saved before the rule existed. A point exactly on the
// farm's edge counts as inside (see `isPointInRing`). With no usable farm boundary there is nothing
// to stay within, so every helper here is a no-op -- a zone can only be held in once the farm has
// its own real outline.

/** The farm ring a zone must stay within, or `null` (no constraint) when the farm has no real one. */
export function zoneContainmentRing(farmRing: LngLat[]): LngLat[] | null {
  return containmentRingOf(farmRing);
}

/**
 * Whether one typed corner is a complete, in-range point that falls outside the farm -- for an inline
 * error under that row. A blank, half-typed or out-of-range row is NOT reported here: it already has
 * its own, more basic message (`manualRowIssue`), and only one message is shown per row.
 */
export function manualRowOutsideFarm(row: ManualPointRow, containment: LngLat[] | null): boolean {
  if (!containment) return false;
  if (row.latText.trim() === '' || row.lngText.trim() === '') return false;
  if (manualRowIssue(row) !== null) return false;
  return !isPointInRing([Number(row.lngText.trim()), Number(row.latText.trim())], containment);
}

/** The typed points a classified shape is built from (none for 'empty' / 'invalid'). */
function manualShapePoints(shape: ManualShape): LngLat[] {
  switch (shape.kind) {
    case 'point':
      return [shape.point];
    case 'tooFew':
    case 'noArea':
    case 'polygon':
      return shape.points;
    default:
      return [];
  }
}

/** Whether any typed corner of `shape` falls outside the farm. */
export function manualShapeOutsideFarm(shape: ManualShape, containment: LngLat[] | null): boolean {
  if (!containment) return false;
  return manualShapePoints(shape).some((pt) => !isPointInRing(pt, containment));
}

/**
 * The typed shape as the Zones editor must treat it: unchanged when every corner is inside the farm,
 * otherwise `{ kind: 'invalid' }` -- exactly as if a row were mistyped. That one substitution is what
 * keeps an out-of-farm outline off the map (it is never `setPolygon`'d), out of `committedZoneRing`
 * (so it is never saved), and behind the existing "finish the typed points" save guard, without
 * changing `classifyManualPoints` itself, which registration Step 3 shares and has no farm to stay in.
 */
export function containManualShape(shape: ManualShape, containment: LngLat[] | null): ManualShape {
  return manualShapeOutsideFarm(shape, containment) ? { kind: 'invalid' } : shape;
}

/**
 * Whether a ring that is already a polygon has any vertex outside the farm. The map refuses new
 * out-of-farm taps and drags, so this only catches a zone loaded as it was saved -- before this rule,
 * or before the farm's own boundary was redrawn smaller -- so the editor can say what to fix.
 */
export function ringOutsideFarm(ring: LngLat[], containment: LngLat[] | null): boolean {
  if (!containment || vertexCount(ring) < 3) return false;
  return !ringFitsWithin(ring, containment);
}

/**
 * The list position -- and so the colour (`zoneColorFor`) -- of the zone being edited: an existing
 * zone keeps its own position, a new one lands at the end (plots come back in creation order). An
 * existing id that is no longer in the list is treated like a new zone rather than borrowing slot -1.
 */
export function editingZoneIndex(
  zoneIds: readonly string[],
  target: { kind: 'new' } | { kind: 'existing'; plotId: string },
): number {
  if (target.kind === 'existing') {
    const index = zoneIds.indexOf(target.plotId);
    if (index >= 0) return index;
  }
  return zoneIds.length;
}

/**
 * One read-only map overlay, structurally the same as @tohfa/mobile-ui's `FarmBoundaryMapOverlay`
 * (declared here, not imported, to keep this file free of anything that drags in React Native).
 */
export interface ZoneMapOverlay {
  id: string;
  ring: LngLat[];
  color: string;
  filled?: boolean;
  dashed?: boolean;
  emphasized?: boolean;
  label?: string;
}

/**
 * The Zones map's context overlays: the farm's own edge (dashed, unfilled) first, then every zone
 * that has a shape, coloured and lettered by its position in the FULL list so the map and the zone
 * cards share one key. While a zone is being edited it is left out (`excludeZoneId`) -- it is the
 * map's one editable boundary then, and must not also sit underneath itself as a stale copy -- and
 * every other zone keeps its own colour and letter, because positions are taken before the skip.
 */
export function buildZoneMapOverlays(params: {
  farmRing: LngLat[];
  zones: ReadonlyArray<{ id: string; ring: LngLat[] }>;
  focusedZoneId: string | null;
  excludeZoneId: string | null;
}): ZoneMapOverlay[] {
  const list: ZoneMapOverlay[] = [];
  if (params.farmRing.length > 0) {
    list.push({ id: 'farm', ring: params.farmRing, color: FARM_OUTLINE_COLOR, filled: false, dashed: true });
  }
  params.zones.forEach((zone, index) => {
    if (zone.ring.length === 0 || zone.id === params.excludeZoneId) return;
    list.push({
      id: `zone-${zone.id}`,
      ring: zone.ring,
      color: zoneColorFor(index),
      emphasized: zone.id === params.focusedZoneId,
      label: zoneLetterFor(index),
    });
  });
  return list;
}
