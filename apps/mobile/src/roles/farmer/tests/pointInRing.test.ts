import { describe, expect, it } from 'vitest';
// Imported by relative path on purpose, like overlayLabel.test.ts: @tohfa/mobile-ui's index pulls in
// React Native and the Mapbox SDK, which plain-Node vitest cannot load. pointInRing.ts is React-free.
import {
  containmentRingOf,
  isPointInRing,
  ringFitsWithin,
  type RingPoint,
} from '../../../../../../packages/mobile-ui/src/pointInRing';

// A ~100 m square near Ooty, open (no closing repeat).
const SQUARE: RingPoint[] = [
  [76.7, 11.4],
  [76.701, 11.4],
  [76.701, 11.401],
  [76.7, 11.401],
];
const CLOSED_SQUARE: RingPoint[] = [...SQUARE, SQUARE[0]!];

// A concave "L": the square above with its top-right quarter cut away.
const L_SHAPE: RingPoint[] = [
  [76.7, 11.4],
  [76.701, 11.4],
  [76.701, 11.4005],
  [76.7005, 11.4005],
  [76.7005, 11.401],
  [76.7, 11.401],
];

describe('pointInRing: isPointInRing', () => {
  it('accepts a point well inside, for an open or a closed ring', () => {
    for (const ring of [SQUARE, CLOSED_SQUARE]) {
      expect(isPointInRing([76.7005, 11.4005], ring)).toBe(true);
    }
  });

  it('rejects a point outside, on every side', () => {
    for (const pt of [
      [76.6995, 11.4005],
      [76.7015, 11.4005],
      [76.7005, 11.3995],
      [76.7005, 11.4015],
      [76.71, 11.41],
    ] as RingPoint[]) {
      expect(isPointInRing(pt, SQUARE)).toBe(false);
    }
  });

  it('counts a point exactly on an edge or a vertex as inside', () => {
    expect(isPointInRing([76.7005, 11.4], SQUARE)).toBe(true); // bottom edge
    expect(isPointInRing([76.701, 11.4007], SQUARE)).toBe(true); // right edge
    expect(isPointInRing([76.7, 11.4], SQUARE)).toBe(true); // a vertex
    expect(isPointInRing([76.701, 11.401], CLOSED_SQUARE)).toBe(true); // the closing vertex
  });

  it('tolerates a sub-decimetre float/rounding wobble just outside an edge, but not a real overshoot', () => {
    // 1e-7 deg is ~1 cm -- the size of error a 6-decimal rounding of a dragged vertex can introduce.
    expect(isPointInRing([76.7005, 11.4 - 1e-7], SQUARE)).toBe(true);
    // 1e-5 deg is ~1 m outside: clearly over the line.
    expect(isPointInRing([76.7005, 11.4 - 1e-5], SQUARE)).toBe(false);
  });

  it('handles a concave ring: the cut-away notch is outside', () => {
    expect(isPointInRing([76.70025, 11.40075], L_SHAPE)).toBe(true); // upper-left arm
    expect(isPointInRing([76.70075, 11.40025], L_SHAPE)).toBe(true); // lower-right arm
    expect(isPointInRing([76.70075, 11.40075], L_SHAPE)).toBe(false); // the notch
  });

  it('a degenerate ring (fewer than 3 distinct vertices, or collinear) contains nothing', () => {
    expect(isPointInRing([76.7, 11.4], [])).toBe(false);
    expect(isPointInRing([76.7, 11.4], [[76.7, 11.4]])).toBe(false);
    expect(isPointInRing([76.7005, 11.4], [[76.7, 11.4], [76.701, 11.4]])).toBe(false);
    expect(
      isPointInRing([76.7005, 11.4], [[76.7, 11.4], [76.701, 11.4], [76.7, 11.4]]),
    ).toBe(false);
    expect(
      isPointInRing([76.7005, 11.4], [[76.7, 11.4], [76.7005, 11.4], [76.701, 11.4]]),
    ).toBe(false);
  });

  it('a non-finite point is never inside', () => {
    expect(isPointInRing([Number.NaN, 11.4005], SQUARE)).toBe(false);
    expect(isPointInRing([76.7005, Number.POSITIVE_INFINITY], SQUARE)).toBe(false);
  });
});

describe('pointInRing: containmentRingOf', () => {
  it('is null for no ring, an empty ring, or a degenerate one -- "no constraint"', () => {
    expect(containmentRingOf(undefined)).toBeNull();
    expect(containmentRingOf(null)).toBeNull();
    expect(containmentRingOf([])).toBeNull();
    expect(containmentRingOf([[76.7, 11.4], [76.701, 11.4], [76.7, 11.4]])).toBeNull();
    expect(containmentRingOf([[76.7, 11.4], [76.7005, 11.4], [76.701, 11.4]])).toBeNull();
  });

  it('returns the usable ring, open, without a closing repeat', () => {
    expect(containmentRingOf(CLOSED_SQUARE)).toEqual(SQUARE);
    expect(containmentRingOf(SQUARE)).toEqual(SQUARE);
  });
});

describe('pointInRing: ringFitsWithin', () => {
  it('is true when every vertex is inside or on the edge', () => {
    const inner: RingPoint[] = [
      [76.7002, 11.4002],
      [76.7008, 11.4002],
      [76.701, 11.4008], // on the right edge
    ];
    expect(ringFitsWithin(inner, SQUARE)).toBe(true);
    expect(ringFitsWithin([...inner, inner[0]!], CLOSED_SQUARE)).toBe(true);
  });

  it('is false as soon as one vertex is outside', () => {
    expect(
      ringFitsWithin(
        [
          [76.7002, 11.4002],
          [76.7008, 11.4002],
          [76.702, 11.4008],
        ],
        SQUARE,
      ),
    ).toBe(false);
  });
});
