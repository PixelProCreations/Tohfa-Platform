import { describe, expect, it } from 'vitest';
// Imported by relative path on purpose: @tohfa/mobile-ui's index pulls in React Native and the
// Mapbox SDK, which plain-Node vitest cannot load. overlayLabel.ts is React-free for this reason.
import { ringLabelPosition, type OverlayLabelPoint } from '../../../../../../packages/mobile-ui/src/overlayLabel';

// A ~100 m square near Ooty, open (no closing repeat).
const SQUARE: OverlayLabelPoint[] = [
  [76.7, 11.4],
  [76.701, 11.4],
  [76.701, 11.401],
  [76.7, 11.401],
];

describe('overlayLabel: ringLabelPosition', () => {
  it('puts the label at the centre of a square, open or closed', () => {
    for (const ring of [SQUARE, [...SQUARE, SQUARE[0]!]]) {
      const pos = ringLabelPosition(ring)!;
      expect(pos[0]).toBeCloseTo(76.7005, 9);
      expect(pos[1]).toBeCloseTo(11.4005, 9);
    }
  });

  it('is independent of winding direction', () => {
    const pos = ringLabelPosition([...SQUARE].reverse())!;
    expect(pos[0]).toBeCloseTo(76.7005, 9);
    expect(pos[1]).toBeCloseTo(11.4005, 9);
  });

  it('weights by area, not by vertex count', () => {
    // The same square with extra vertices crowded along its bottom edge: a vertex average would be
    // dragged down towards them, the area centroid must not move.
    const crowded: OverlayLabelPoint[] = [
      [76.7, 11.4],
      [76.7002, 11.4],
      [76.7004, 11.4],
      [76.7006, 11.4],
      [76.7008, 11.4],
      [76.701, 11.4],
      [76.701, 11.401],
      [76.7, 11.401],
    ];
    const pos = ringLabelPosition(crowded)!;
    expect(pos[1]).toBeCloseTo(11.4005, 9);
    const naiveLat = crowded.reduce((acc, pt) => acc + pt[1], 0) / crowded.length;
    expect(naiveLat).toBeLessThan(11.4004);
  });

  it('falls back to the vertex average for a ring with no area (collinear points)', () => {
    const pos = ringLabelPosition([
      [76.7, 11.4],
      [76.701, 11.4],
      [76.702, 11.4],
    ])!;
    expect(pos[0]).toBeCloseTo(76.701, 9);
    expect(pos[1]).toBeCloseTo(11.4, 9);
  });

  it('returns null for fewer than 3 distinct vertices', () => {
    expect(ringLabelPosition([])).toBeNull();
    expect(ringLabelPosition(SQUARE.slice(0, 2))).toBeNull();
    // Two distinct points plus a closing repeat is not a polygon.
    expect(ringLabelPosition([SQUARE[0]!, SQUARE[1]!, SQUARE[0]!])).toBeNull();
    // Repeats of one point do not count as distinct vertices.
    expect(ringLabelPosition([SQUARE[0]!, SQUARE[0]!, SQUARE[1]!, SQUARE[1]!])).toBeNull();
  });

  it('ignores non-finite coordinates instead of returning NaN', () => {
    const pos = ringLabelPosition([...SQUARE.slice(0, 2), [Number.NaN, 11.4], ...SQUARE.slice(2)])!;
    expect(pos[0]).toBeCloseTo(76.7005, 9);
    expect(pos[1]).toBeCloseTo(11.4005, 9);
  });
});
