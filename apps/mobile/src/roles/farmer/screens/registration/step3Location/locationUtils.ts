import {
  generateLocationId,
  type FarmLocationData,
} from '../../../storage/registrationDraft';
import {
  isValidLatitudeText,
  isValidLongitudeText,
  type LngLat,
  type ManualRowIssue,
} from '../manualPoints';
import type { TranslationKey } from '../../../../../i18n/farmer';

export interface MapboxFeature {
  id: string;
  text: string;
  place_name: string;
  center: [number, number];
  context?: Array<{
    id: string;
    text: string;
  }>;
}

/**
 * A TOHFA farmer runs ONE farming operation whose land sits in several physical places. What
 * repeats is therefore a land LOCATION -- a labelled parcel with its own acreage and its own
 * boundary -- and each one is captured here, whole, on this screen.
 *
 * A location is self-contained: it carries its own `label`, `areaAcres` and `fmbPolygon`, so
 * there is nothing to correlate back to step 2 (which now describes the operation, not a list of
 * farms). If a `farmId` match between the two steps ever reappears here, the model has drifted.
 *
 * Total land area is deliberately not held anywhere -- it is the sum of these parcels' `areaAcres`
 * and is derived wherever it is displayed.
 */
export function makeBlankLocation(): FarmLocationData {
  return { id: generateLocationId(), label: '', areaAcres: 0 };
}

/** The outer ring of a location's saved boundary, or an empty ring when it has none. */
export function ringOf(location: FarmLocationData | undefined): number[][] {
  const ring = location?.fmbPolygon?.coordinates?.[0];
  return Array.isArray(ring) ? ring : [];
}

/**
 * The saved parcel's own manually-typed position, if it has one and no ring -- used only for the
 * map's mount-time camera centre. A ring always wins (its centroid lives in these same two fields
 * but is not manual data), mirroring the seeding rules in `manualSeedOf` (./manualPoints.ts).
 */
export function savedManualPinOf(location: FarmLocationData | undefined): LngLat | null {
  if (ringOf(location).length > 0) return null;
  if (location?.latitude === undefined || location?.longitude === undefined) return null;
  return isValidLatitudeText(String(location.latitude)) && isValidLongitudeText(String(location.longitude))
    ? [location.longitude, location.latitude]
    : null;
}

/** i18n key for one manual point row's own inline problem (see `manualRowIssue`). */
export const MANUAL_ROW_ISSUE_KEY: Record<ManualRowIssue, TranslationKey> = {
  incomplete: 'farmer.registration.step3.bothCoordinates',
  latitudeRange: 'farmer.registration.step3.latitudeRange',
  longitudeRange: 'farmer.registration.step3.longitudeRange',
};

/** Coordinates written back into manual rows from a dragged vertex: ~0.1 m, more than GPS gives. */
export const MANUAL_COORD_DECIMALS = 6;
export function formatManualCoord(value: number): string {
  return String(Number(value.toFixed(MANUAL_COORD_DECIMALS)));
}

/**
 * How far, and how much more horizontal than vertical, a drag on the bottom card must travel
 * before the swipe-between-locations gesture (see `swipeResponder` below) claims it. Both guard
 * against the same failure: a plain tap (near-zero movement either way) or an accidental small
 * wobble must still reach the Edit/Delete Boundary buttons or a manual-entry field underneath,
 * not be swallowed as a page change.
 */
export const SWIPE_MIN_DISTANCE = 48; // logical px -- comfortably past a stray touch, short of a full drag
export const SWIPE_DIRECTION_RATIO = 1.5; // |dx| must beat |dy| by this much before it reads as horizontal

/**
 * `validation.ts` keys every per-location error by the parcel's POSITION -- `locations.2.label`,
 * `locations.2.areaAcres`, `locations.2.coordinates`. These helpers are the only places that
 * knowledge lives, so an error can be routed to the parcel it is actually about instead of being
 * shown against whichever one happens to be on screen. The trailing dot matters: without it
 * `locations.1.` would also claim `locations.10.label`.
 */
export function hasErrorsFor(errors: Record<string, string>, index: number): boolean {
  const prefix = `locations.${index}.`;
  return Object.keys(errors).some((key) => key.startsWith(prefix));
}

/**
 * Whether the parcel at `index` has a problem with one of the two fields that live in the
 * location-details popup (name, area) -- as opposed to only a positioning problem, which is fixed
 * on the map, not in the popup.
 */
export function hasDetailsErrorsFor(errors: Record<string, string>, index: number): boolean {
  return Boolean(errors[`locations.${index}.label`] || errors[`locations.${index}.areaAcres`]);
}

export function firstIndexWithErrors(errors: Record<string, string>, count: number): number {
  for (let i = 0; i < count; i += 1) {
    if (hasErrorsFor(errors, i)) return i;
  }
  return -1;
}

/**
 * Keeps digits and at most one decimal point, so "1.2.3" cannot be typed and then silently
 * truncated to 1.2 by parseFloat further on.
 */
export function sanitizeAcresText(text: string): string {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
}
