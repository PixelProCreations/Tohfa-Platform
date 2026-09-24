/**
 * One definition of how parcel acreage is compared and rounded, shared by every registration
 * screen that shows the farmer's STATED total beside the parcels they have actually marked --
 * Step 2 while they are typing, Step 5 before they submit.
 *
 * Both screens put the same two numbers in front of the same farmer, so the epsilon and the
 * rounding have to BE the same value, not merely happen to be equal. They used to be two
 * constants under two names (`AREA_MATCH_EPSILON_ACRES` in Step 2,
 * `AREA_COMPARISON_EPSILON_ACRES` in Step 5) plus two separately written rounding helpers; a
 * change to one screen could silently leave the two disagreeing about whether a farmer's figure
 * matches the land they have marked.
 */

/**
 * Purely numerical hygiene: `0.1 + 0.2 !== 0.3`, and summing parcel acreages lands `1.1 + 1.4`
 * on 2.5000000000000004, so a total that is in fact identical can read as a hair off.
 *
 * This is NOT a business tolerance. There is no "acceptable variance" in a farmer's stated
 * holding and nothing here belongs in `system_config`: any real gap between what they stated and
 * what they have marked is shown exactly as it is, is never auto-corrected, and never blocks
 * them. The constant exists only so float arithmetic cannot report a difference that is not
 * really there.
 */
export const AREA_COMPARISON_EPSILON_ACRES = 0.01;

/**
 * Rounds acreage for DISPLAY only -- nothing is ever stored back from a formatted value, and the
 * farmer's own figure is kept verbatim in the draft. Two decimals with trailing zeros trimmed by
 * `Number`: 2.50 -> 2.5, 3.00 -> 3, 2.5000000000000004 -> 2.5.
 */
export function roundAcresForDisplay(areaAcres: number): number {
  return Number(areaAcres.toFixed(2));
}
