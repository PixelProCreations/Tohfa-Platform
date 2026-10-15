/**
 * Where a read-only overlay's `label` badge sits on the map (see `FarmBoundaryMapOverlay.label`).
 *
 * Deliberately React-free and import-free: FarmBoundaryMap.tsx pulls in React Native and the Mapbox
 * SDK, which cannot load in apps/mobile's plain-Node vitest setup, so the one piece of maths behind
 * the labels lives here where it can be unit-tested on its own
 * (apps/mobile/src/roles/farmer/tests/overlayLabel.test.ts imports this file directly).
 */

/** [longitude, latitude] -- structurally identical to FarmBoundaryMap's own `LngLat`. */
export type OverlayLabelPoint = [number, number];

/**
 * Below this (in squared degrees, after translating the ring to its first vertex) a ring is treated
 * as having no area. The smallest real zone worth labelling -- a few metres a side -- is ~1e-9 deg^2,
 * several orders of magnitude above this, so it only catches genuinely collinear / degenerate rings.
 */
const DEGENERATE_AREA = 1e-14;

function samePoint(a: OverlayLabelPoint, b: OverlayLabelPoint): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

/**
 * The label position for a ring ([[lng, lat], ...], open or closed): its area-weighted (shoelace)
 * centroid, which -- unlike a plain vertex average -- is not dragged towards whichever side of the
 * shape happens to have more vertices. Planar maths on lng/lat is fine at farm scale, where the
 * distortion across one zone is far below a label's width.
 *
 * Falls back to the vertex average when the signed area is ~0 (collinear points), and returns
 * `null` for fewer than 3 distinct vertices -- the same "not a polygon" cut-off FarmBoundaryMap
 * applies before it draws an overlay at all. A closing repeat of the first vertex is ignored, and
 * non-finite coordinates are dropped rather than poisoning the sum with NaN.
 */
export function ringLabelPosition(ring: readonly OverlayLabelPoint[]): OverlayLabelPoint | null {
  const points = ring.filter(
    (pt) => Array.isArray(pt) && Number.isFinite(pt[0]) && Number.isFinite(pt[1]),
  );
  if (points.length >= 2 && samePoint(points[0]!, points[points.length - 1]!)) points.pop();

  const distinct: OverlayLabelPoint[] = [];
  for (const pt of points) {
    if (!distinct.some((seen) => samePoint(seen, pt))) distinct.push(pt);
  }
  if (distinct.length < 3) return null;

  // Translate to the first vertex before summing: raw lng/lat cross products (~76 * 11) would
  // swamp the tiny differences that make up a farm-sized area in floating point.
  const [originLng, originLat] = points[0]!;
  let twiceArea = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]!;
    const b = points[(i + 1) % points.length]!;
    const ax = a[0] - originLng;
    const ay = a[1] - originLat;
    const bx = b[0] - originLng;
    const by = b[1] - originLat;
    const cross = ax * by - bx * ay;
    twiceArea += cross;
    cx += (ax + bx) * cross;
    cy += (ay + by) * cross;
  }

  if (Math.abs(twiceArea / 2) < DEGENERATE_AREA) {
    const sum = distinct.reduce<[number, number]>((acc, pt) => [acc[0] + pt[0], acc[1] + pt[1]], [0, 0]);
    return [sum[0] / distinct.length, sum[1] / distinct.length];
  }

  // Centroid = (1 / 6A) * sum, with A = twiceArea / 2  ->  1 / (3 * twiceArea).
  return [originLng + cx / (3 * twiceArea), originLat + cy / (3 * twiceArea)];
}
