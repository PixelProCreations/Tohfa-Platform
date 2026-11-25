/**
 * Pure facts the application review screen displays beyond the documents:
 * the two land areas and the variance between them, the farming-type chips,
 * the per-location summary, and how far the applicant got through the five
 * steps. No React, so plain-Node vitest covers it
 * (tests/applications_detail_fields.test.tsx); the sections only render what
 * it returns.
 *
 * Why these live here and not in the sections: every one of them is a
 * judgement the screen must not improvise. The design computes its variance
 * from two hard-coded demo acreages and always draws a verdict; here the
 * verdict exists only when both real numbers do.
 */
import type { ApplicationDetailView } from '../../../api/farmerTypes';

/**
 * The percentage difference between the area the farmer stated and the area
 * the FMB sketch actually covers, above which the variance is called out for
 * surveyor confirmation.
 *
 * SPEC GAP: this threshold is NOT in `system_config` (db/seed/001_reference.sql
 * has no key for it), not in docs/rules.md and not in rbac.json, so it is not
 * a mirrored business value. 5 is the figure the 2026-11-19 design itself
 * prints ("within acceptable margin (±5%)"), kept here in one typed place
 * rather than inline in a component (root CLAUDE.md §2.7). It is presentation
 * only: nothing on this screen is gated on it, and no server rule uses it.
 * Replace it with the configured value as soon as one exists.
 */
export const AREA_VARIANCE_TOLERANCE_PERCENT = 5;

/** The step count the design numbers its sections against ("Step 3 of 5"). */
export const APPLICATION_STEP_COUNT = 5;

function round(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

/**
 * The area the FMB sketches actually cover: the sum of every location's
 * `calculatedAreaAcres`. Null when no location carries one — a partial sum
 * would silently understate the farm and make a variance look real.
 */
export function fmbAreaAcres(app: ApplicationDetailView): number | null {
  const values = app.locations.map((l) => l.calculatedAreaAcres).filter((v): v is number => typeof v === 'number');
  if (values.length === 0) return null;
  return round(
    values.reduce((sum, v) => sum + v, 0),
    4,
  );
}

export interface AreaVarianceView {
  /** What the applicant entered in step 2. */
  statedAcres: number;
  /** What the step 3 sketches cover. */
  fmbAcres: number;
  /** stated − FMB, signed, to two decimals. */
  diffAcres: number;
  /** |diff| as a percentage of the FMB area, to one decimal. */
  percent: number;
  withinTolerance: boolean;
}

/**
 * The variance between the two areas, or null when there is nothing to state:
 * either figure missing, the two equal, or an FMB area of zero (no percentage
 * can be taken against it). A null means the screen draws no warning at all
 * and dashes whichever figure is absent.
 */
export function areaVariance(app: ApplicationDetailView): AreaVarianceView | null {
  const statedAcres = app.farming.statedAreaAcres;
  const fmbAcres = fmbAreaAcres(app);
  if (typeof statedAcres !== 'number' || fmbAcres === null || fmbAcres <= 0) return null;
  const diffAcres = round(statedAcres - fmbAcres, 2);
  if (diffAcres === 0) return null;
  const percent = round((Math.abs(statedAcres - fmbAcres) / fmbAcres) * 100, 1);
  return { statedAcres, fmbAcres, diffAcres, percent, withinTolerance: percent <= AREA_VARIANCE_TOLERANCE_PERCENT };
}

export interface LocationSummaryView {
  locationCount: number;
  /** How many of them have an FMB boundary drawn. */
  boundaryCount: number;
  fmbAcres: number | null;
}

export function locationSummary(app: ApplicationDetailView): LocationSummaryView {
  return {
    locationCount: app.locations.length,
    boundaryCount: app.locations.filter((l) => l.hasBoundary).length,
    fmbAcres: fmbAreaAcres(app),
  };
}

export type FarmingTypeKey = 'natural' | 'organic' | 'bioDynamic' | 'others';

export interface FarmingTypeChipView {
  key: FarmingTypeKey;
  selected: boolean;
}

/** How a stored value is matched to a chip: case, spaces and hyphens ignored. */
const FARMING_TYPE_MATCH: Record<FarmingTypeKey, readonly string[]> = {
  natural: ['natural'],
  organic: ['organic'],
  bioDynamic: ['biodynamic'],
  others: ['others', 'other'],
};

const FARMING_TYPE_ORDER: readonly FarmingTypeKey[] = ['natural', 'organic', 'bioDynamic', 'others'];

/**
 * The design's four read-only chips, with the applicant's stored answer
 * selected. A stored value none of them names selects nothing: the chips are
 * a display of the answer, so guessing which chip "really" means it would be
 * putting words in the applicant's mouth. The section shows the raw value in
 * its own row alongside, so an unmatched answer is still visible.
 */
export function farmingTypeChips(typeOfFarming: string | null): FarmingTypeChipView[] {
  const normalized = (typeOfFarming ?? '').toLowerCase().replace(/[\s_-]/g, '');
  return FARMING_TYPE_ORDER.map((key) => ({
    key,
    selected: normalized !== '' && FARMING_TYPE_MATCH[key].includes(normalized),
  }));
}

export type StepState = 'done' | 'current' | 'pending';

/** Where a step stands, from the application's own completedSteps / currentStep. */
export function stepState(app: ApplicationDetailView, step: number): StepState {
  if (app.completedSteps.includes(step)) return 'done';
  if (app.currentStep === step) return 'current';
  return 'pending';
}

// ---------------------------------------------------------------------------
// The boundary map (03)
// ---------------------------------------------------------------------------

export type Ring = [number, number][];

/** Every drawn FMB ring of the application, [lng, lat] pairs, in location order. */
export function fmbRings(app: ApplicationDetailView): Ring[] {
  return app.locations.map((l) => l.fmbRing ?? null).filter((r): r is Ring => r !== null && r.length >= 3);
}

/** A ring's vertex count with the closing point (if repeated) not counted twice: the design's "(5 pts)". */
export function ringPointCount(ring: Ring): number {
  const first = ring[0];
  const last = ring[ring.length - 1];
  const closed = first !== undefined && last !== undefined && ring.length > 1 && first[0] === last[0] && first[1] === last[1];
  return closed ? ring.length - 1 : ring.length;
}

/** The mean of a ring's vertices, [lng, lat]: where a preview map is centred. */
export function ringCenter(ring: Ring): [number, number] {
  const n = ringPointCount(ring);
  let lng = 0;
  let lat = 0;
  for (let i = 0; i < n; i += 1) {
    lng += ring[i]![0];
    lat += ring[i]![1];
  }
  return [lng / n, lat / n];
}

/**
 * Projects rings into a width x height drawing box with `pad` on every side,
 * keeping their real shape: longitude is scaled by cos(latitude) so a square
 * plot stays square, and the whole set is fitted and centred. Pure, so the
 * offline fallback draws the applicant's own boundary rather than a picture.
 */
export function projectRings(rings: readonly Ring[], width: number, height: number, pad: number): Ring[] {
  const all = rings.flat();
  if (all.length === 0) return [];
  const meanLat = all.reduce((s, p) => s + p[1], 0) / all.length;
  const kx = Math.cos((meanLat * Math.PI) / 180);
  const xs = all.map((p) => p[0] * kx);
  const ys = all.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const innerW = width - 2 * pad;
  const innerH = height - 2 * pad;
  const scale = spanX === 0 && spanY === 0 ? 0 : Math.min(spanX === 0 ? Infinity : innerW / spanX, spanY === 0 ? Infinity : innerH / spanY);
  const offX = pad + (innerW - spanX * scale) / 2;
  const offY = pad + (innerH - spanY * scale) / 2;
  // Screen y grows downwards while latitude grows northwards.
  return rings.map((ring) => ring.map(([lng, lat]) => [offX + (lng * kx - minX) * scale, offY + (maxY - lat) * scale] as [number, number]));
}
