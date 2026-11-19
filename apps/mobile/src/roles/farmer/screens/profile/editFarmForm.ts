/**
 * FMB Sketch's "Edit farm" form: the draft a farmer edits, and how it becomes a PATCH /farms/{farmId}
 * body (docs/openapi.yaml `FarmUpdate`, apps/api/src/modules/farms/farms.schema.ts `updateFarmBody`).
 *
 * Pure (no React) so the validation and the exact body sent are unit-testable on their own.
 *
 * The limits below are the API contract's own field limits (FarmUpdate maxLength / exclusiveMinimum),
 * not business thresholds -- they are mirrored here only so the farmer sees the problem before a
 * round-trip 400.
 *
 * What the API does NOT let this form do (reported as spec gaps, not worked around):
 *   - clear `areaAcres`, `village`, `taluk` or `district` (FarmUpdate has no null for them, and the
 *     place fields require minLength 1) -- a blank field is therefore simply not sent;
 *   - edit `surveyNumber`, `address` or `centroidLat/Lng` (not in FarmUpdate at all).
 */
import type { Farm, GeoPolygon, UpdateFarmInput } from '../../api/farms';
import { calculatePolygonMetrics } from '../../utils/geo';
import { ACRES_MAX as AREA_MAX, positiveDecimal } from './profileValidation';

/** FarmUpdate.name / village / taluk / district maxLength. */
export const NAME_MAX = 120;
export const PLACE_MAX = 120;
/** FarmUpdate.notes maxLength. */
export const NOTES_MAX = 2000;

export type LngLatPair = [number, number];

export interface EditFarmDraft {
  name: string;
  areaText: string;
  village: string;
  taluk: string;
  district: string;
  notes: string;
  /** The boundary ring currently on the form's map (open or closed), [] when cleared. */
  coords: LngLatPair[];
}

export type EditFarmField = 'name' | 'area' | 'village' | 'taluk' | 'district' | 'notes' | 'boundary';

/** i18n key suffixes under `farmer.fmb.edit.*`, so this module stays free of `t()`. */
export type EditFarmErrorKey =
  | 'nameRequired'
  | 'nameTooLong'
  | 'areaInvalid'
  | 'placeTooLong'
  | 'notesTooLong'
  | 'boundaryTooFewPoints';

export type EditFarmErrors = Partial<Record<EditFarmField, EditFarmErrorKey>>;

export type EditFarmResult =
  | { ok: true; body: UpdateFarmInput }
  | { ok: false; errors: EditFarmErrors };

/** The farm's saved outer ring, or [] when it has none. */
export function savedRingOf(farm: Farm | null | undefined): LngLatPair[] {
  const ring = farm?.boundary?.coordinates?.[0];
  return Array.isArray(ring) ? (ring as LngLatPair[]) : [];
}

/** Distinct vertices: a closing vertex that repeats the first is not counted. */
export function openVertexCount(ring: LngLatPair[]): number {
  if (ring.length < 2) return ring.length;
  const first = ring[0]!;
  const last = ring[ring.length - 1]!;
  return first[0] === last[0] && first[1] === last[1] ? ring.length - 1 : ring.length;
}

export function sameRing(a: LngLatPair[], b: LngLatPair[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((p, i) => p[0] === b[i]![0] && p[1] === b[i]![1]);
}

function closedRing(ring: LngLatPair[]): LngLatPair[] {
  return openVertexCount(ring) === ring.length ? [...ring, ring[0]!] : ring;
}

export function draftFromFarm(farm: Farm, coords: LngLatPair[] = savedRingOf(farm)): EditFarmDraft {
  return {
    name: farm.name ?? '',
    areaText: farm.areaAcres != null && farm.areaAcres > 0 ? String(farm.areaAcres) : '',
    village: farm.village ?? '',
    taluk: farm.taluk ?? '',
    district: farm.district ?? '',
    notes: farm.notes ?? '',
    coords,
  };
}

/**
 * Validates the draft and builds the PATCH body. Only a boundary the farmer actually changed is
 * sent: re-sending an unchanged one would bump `boundaryVersion` and re-stamp `boundaryDrawnBy/At`
 * server-side for an edit that never happened.
 */
export function buildFarmUpdate(farm: Farm, draft: EditFarmDraft): EditFarmResult {
  const errors: EditFarmErrors = {};
  const body: UpdateFarmInput = {};

  const name = draft.name.trim();
  if (!name) errors.name = 'nameRequired';
  else if (name.length > NAME_MAX) errors.name = 'nameTooLong';
  else body.name = name;

  const areaText = draft.areaText.trim();
  if (areaText) {
    // The shared decimal rule first: Number() alone accepts "1e3", "0x10" and "Infinity"-like input
    // that is not a plain acreage a farmer meant to type.
    const area = Number(areaText);
    if (positiveDecimal(AREA_MAX)(areaText) !== null || !Number.isFinite(area) || area <= 0) errors.area = 'areaInvalid';
    else body.areaAcres = area;
  }

  for (const field of ['village', 'taluk', 'district'] as const) {
    const value = draft[field].trim();
    if (!value) continue;
    if (value.length > PLACE_MAX) errors[field] = 'placeTooLong';
    else body[field] = value;
  }

  const notes = draft.notes.trim();
  if (notes.length > NOTES_MAX) errors.notes = 'notesTooLong';
  else if (notes) body.notes = notes;
  // An emptied notes box clears saved notes (FarmUpdate.notes is nullable).
  else if (farm.notes) body.notes = null;

  const saved = savedRingOf(farm);
  const points = openVertexCount(draft.coords);
  if (points > 0 && points < 3) {
    errors.boundary = 'boundaryTooFewPoints';
  } else if (points === 0) {
    if (openVertexCount(saved) > 0) body.boundary = null;
  } else if (!sameRing(draft.coords, saved)) {
    const ring = closedRing(draft.coords);
    const polygon: GeoPolygon = { type: 'Polygon', coordinates: [ring] };
    body.boundary = polygon;
    body.calculatedAreaAcres = calculatePolygonMetrics(ring).areaAcres;
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, body };
}

/**
 * PATCH returns the plain `Farm` shape without the list-only `plotCount` (docs/openapi.yaml
 * `FarmListItem`). Replacing the list row with it outright made the Zones metric drop to '—'
 * after every save; keep the list's count unless the response carries one.
 */
export function mergeUpdatedFarm(previous: Farm, updated: Farm): Farm {
  return { ...previous, ...updated, plotCount: updated.plotCount ?? previous.plotCount };
}
