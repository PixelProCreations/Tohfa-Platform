/**
 * Point-in-polygon for FarmBoundaryMap's `containWithin` constraint (keeping a zone's vertices inside
 * its farm's boundary) and for the Zones editor's typed-coordinate check, which must agree with it
 * exactly -- a corner the form accepts must never be one the map then refuses, or vice versa.
 *
 * Deliberately React-free and import-free, for the same reason as overlayLabel.ts: FarmBoundaryMap.tsx
 * pulls in React Native and the Mapbox SDK, which cannot load in apps/mobile's plain-Node vitest
 * setup (apps/mobile/src/roles/farmer/tests/pointInRing.test.ts imports this file directly).
 *
 * Planar maths on [lng, lat] is fine at farm scale: across one farm the curvature error is far below
 * a GPS fix's own error.
 */

/** [longitude, latitude] -- structurally identical to FarmBoundaryMap's own `LngLat`. */
export type RingPoint = [number, number];

/**
 * How far outside an edge (in degrees, ~11 cm at the Nilgiris' latitude) a point may sit and still
 * count as ON it. Not a business threshold: it only absorbs floating-point noise and the 6-decimal
 * rounding the Zones editor applies when it writes a dragged vertex back into typed rows (up to
 * 5e-7 deg), so a corner placed exactly on the farm's edge is not refused for a sub-centimetre
 * wobble. Anything a farmer could actually see as "over the line" is far larger than this.
 */
const EDGE_TOLERANCE_DEG = 1e-6;

/** Below this (squared degrees) a ring encloses nothing -- same cut-off as overlayLabel.ts. */
const DEGENERATE_AREA = 1e-14;

function isFinitePoint(pt: unknown): pt is RingPoint {
  return Array.isArray(pt) && Number.isFinite(pt[0]) && Number.isFinite(pt[1]);
}

function samePoint(a: RingPoint, b: RingPoint): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

/** Twice the signed shoelace area, translated to the first vertex for float precision. */
function twiceSignedArea(points: readonly RingPoint[]): number {
  const [ox, oy] = points[0]!;
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]!;
    const b = points[(i + 1) % points.length]!;
    sum += (a[0] - ox) * (b[1] - oy) - (b[0] - ox) * (a[1] - oy);
  }
  return sum;
}

/**
 * The ring as a usable containment boundary -- open (no closing repeat), finite points only -- or
 * `null` when it cannot contain anything: missing, fewer than 3 distinct vertices, or collinear.
 * `null` means "no constraint" to every caller; a farm with no real boundary cannot hold a zone in.
 */
export function containmentRingOf(
  ring: readonly RingPoint[] | null | undefined,
): RingPoint[] | null {
  if (!ring) return null;
  const points = ring.filter(isFinitePoint).map(([lng, lat]) => [lng, lat] as RingPoint);
  if (points.length >= 2 && samePoint(points[0]!, points[points.length - 1]!)) points.pop();
  const distinct: RingPoint[] = [];
  for (const pt of points) {
    if (!distinct.some((seen) => samePoint(seen, pt))) distinct.push(pt);
  }
  if (distinct.length < 3) return null;
  if (Math.abs(twiceSignedArea(points) / 2) < DEGENERATE_AREA) return null;
  return points;
}

/** Squared distance from `p` to segment a-b, all in degrees. */
function squaredDistanceToSegment(p: RingPoint, a: RingPoint, b: RingPoint): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const px = p[0] - a[0];
  const py = p[1] - a[1];
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, (px * dx + py * dy) / lengthSq));
  const ex = px - t * dx;
  const ey = py - t * dy;
  return ex * ex + ey * ey;
}

/**
 * Whether `point` ([lng, lat]) lies inside `ring` ([[lng, lat], ...], open or closed).
 *
 * A point ON the boundary -- on an edge or a vertex, within `EDGE_TOLERANCE_DEG` -- counts as INSIDE:
 * a zone that runs right up to the farm's fence is a normal zone, and a farmer who snaps a corner
 * onto the farm's own corner must not be refused. Everything else is the standard even-odd
 * ray-casting test (a horizontal ray towards +lng, counting edge crossings), which handles concave
 * farms correctly. A degenerate ring (see `containmentRingOf`) contains nothing, and a non-finite
 * point is never inside.
 */
export function isPointInRing(point: RingPoint, ring: readonly RingPoint[]): boolean {
  if (!isFinitePoint(point)) return false;
  const points = containmentRingOf(ring);
  if (!points) return false;

  const toleranceSq = EDGE_TOLERANCE_DEG * EDGE_TOLERANCE_DEG;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]!;
    const b = points[(i + 1) % points.length]!;
    if (squaredDistanceToSegment(point, a, b) <= toleranceSq) return true;
  }

  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const [xi, yi] = points[i]!;
    const [xj, yj] = points[j]!;
    // Half-open in y (yi > y) !== (yj > y), so a ray through a vertex is counted exactly once.
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Whether every vertex of `inner` lies inside (or on) `outer` -- see `isPointInRing`. */
export function ringFitsWithin(inner: readonly RingPoint[], outer: readonly RingPoint[]): boolean {
  return inner.every((pt) => isPointInRing(pt, outer));
}
