import { describe, expect, it } from 'vitest';
import type { FarmLocationData } from '../storage/registrationDraft';
import {
  classifyManualPoints,
  committedPositioningOf,
  isValidLatitudeText,
  isValidLongitudeText,
  makeManualRow,
  manualRowIssue,
  manualSeedOf,
  markerFor,
  type ManualPointRow,
} from '../screens/registration/manualPoints';

/**
 * Registration Step 3's manual point entry (Step3Location.tsx). No BR-xx rule governs this -- it
 * is screen behaviour -- but the classification logic decides what a farmer's typed coordinates
 * are allowed to become on the saved parcel, so it is kept pure (manualPoints.ts imports no React
 * Native) precisely so it can be pinned down here in plain Node.
 */

function row(latText: string, lngText: string): ManualPointRow {
  return makeManualRow(latText, lngText);
}

function textsOf(rows: ManualPointRow[]): Array<[string, string]> {
  return rows.map((r) => [r.latText, r.lngText]);
}

// Three corners of a small (~100 m) field near Ooty, plus a fourth to make a quadrilateral.
// Written in canonical `String(Number(x))` form so the round-trip test can compare text exactly.
const A = ['11.4102', '76.695'] as const;
const B = ['11.4102', '76.696'] as const;
const C = ['11.4112', '76.696'] as const;
const D = ['11.4112', '76.695'] as const;

describe('Step 3 manual points: coordinate text validation', () => {
  it('accepts in-range latitude/longitude text and rejects blank, junk and out-of-range', () => {
    expect(isValidLatitudeText(' 11.41 ')).toBe(true);
    expect(isValidLatitudeText('-90')).toBe(true);
    expect(isValidLatitudeText('90.0001')).toBe(false);
    expect(isValidLatitudeText('')).toBe(false);
    expect(isValidLatitudeText('   ')).toBe(false);
    expect(isValidLatitudeText('11.4.1')).toBe(false);
    expect(isValidLongitudeText('180')).toBe(true);
    expect(isValidLongitudeText('-180.5')).toBe(false);
    expect(isValidLongitudeText('abc')).toBe(false);
  });

  it('reports a per-row issue only for a row the farmer has started', () => {
    expect(manualRowIssue(row('', ''))).toBeNull();
    expect(manualRowIssue(row(...A))).toBeNull();
    expect(manualRowIssue(row('11.41', ''))).toBe('incomplete');
    expect(manualRowIssue(row('', '76.69'))).toBe('incomplete');
    expect(manualRowIssue(row('95', '76.69'))).toBe('latitudeRange');
    expect(manualRowIssue(row('11.41', '200'))).toBe('longitudeRange');
  });
});

describe('Step 3 manual points: classifyManualPoints', () => {
  it('is empty when there are no rows or every row is blank', () => {
    expect(classifyManualPoints([]).kind).toBe('empty');
    expect(classifyManualPoints([row('', ''), row('  ', ' ')]).kind).toBe('empty');
  });

  it('is invalid when any non-blank row is half-filled, even alongside good rows', () => {
    const shape = classifyManualPoints([row(...A), row('11.4102', ''), row(...C), row(...D)]);
    expect(shape.kind).toBe('invalid');
  });

  it('is invalid when any row is out of range', () => {
    expect(classifyManualPoints([row('91', '76.69')]).kind).toBe('invalid');
    expect(classifyManualPoints([row(...A), row(...B), row('11.41', '181')]).kind).toBe('invalid');
  });

  it('is a single point (pin semantics) for one filled row, ignoring blank rows around it', () => {
    const shape = classifyManualPoints([row('', ''), row(' 11.4102 ', ' 76.6950 '), row('', '')]);
    expect(shape).toEqual({ kind: 'point', point: [76.695, 11.4102] });
  });

  it('collapses repeated identical points to one, including numerically-equal text', () => {
    const shape = classifyManualPoints([row('11.4102', '76.6950'), row('11.41020', '76.695')]);
    expect(shape.kind).toBe('point');
  });

  it('is tooFew for exactly two distinct points', () => {
    const shape = classifyManualPoints([row(...A), row(...B)]);
    expect(shape.kind).toBe('tooFew');
  });

  it('is tooFew when a third row only repeats an earlier point', () => {
    expect(classifyManualPoints([row(...A), row(...B), row(...A)]).kind).toBe('tooFew');
  });

  it('is noArea for three or more collinear points', () => {
    const shape = classifyManualPoints([
      row('11.4100', '76.6950'),
      row('11.4110', '76.6950'),
      row('11.4120', '76.6950'),
    ]);
    expect(shape.kind).toBe('noArea');
  });

  it('is a polygon for three non-collinear points, with an open vertex list and a closed ring', () => {
    const shape = classifyManualPoints([row(...A), row('', ''), row(...B), row(...C)]);
    expect(shape.kind).toBe('polygon');
    if (shape.kind !== 'polygon') return;
    expect(shape.points).toEqual([
      [76.695, 11.4102],
      [76.696, 11.4102],
      [76.696, 11.4112],
    ]);
    expect(shape.ring).toEqual([...shape.points, shape.points[0]]);
    expect(shape.areaSquareMeters).toBeGreaterThan(0);
  });

  it('drops a typed closing duplicate of the first point rather than counting it as a vertex', () => {
    const shape = classifyManualPoints([row(...A), row(...B), row(...C), row(...D), row(...A)]);
    expect(shape.kind).toBe('polygon');
    if (shape.kind !== 'polygon') return;
    expect(shape.points).toHaveLength(4);
    expect(shape.ring).toHaveLength(5);
    expect(shape.ring[0]).toEqual(shape.ring[4]);
  });
});

describe('Step 3 manual points: markerFor', () => {
  it('pins only a single point; a polygon draws itself and every other shape shows nothing', () => {
    expect(markerFor(classifyManualPoints([row(...A)]))).toEqual([76.695, 11.4102]);
    expect(markerFor(classifyManualPoints([row(...A), row(...B), row(...C)]))).toBeNull();
    expect(markerFor(classifyManualPoints([row(...A), row(...B)]))).toBeNull();
    expect(markerFor(classifyManualPoints([]))).toBeNull();
    expect(markerFor(classifyManualPoints([row('95', '0')]))).toBeNull();
  });
});

describe('Step 3 manual points: manualSeedOf', () => {
  const base: FarmLocationData = { id: 'farm-1', label: 'Home plot', areaAcres: 1 };
  const ring = [
    [76.695, 11.4102],
    [76.696, 11.4102],
    [76.696, 11.4112],
    [76.695, 11.4102],
  ];

  it('seeds one blank row, closed panel, for a parcel with nothing (or no parcel at all)', () => {
    for (const location of [undefined, base]) {
      const seed = manualSeedOf(location);
      expect(textsOf(seed.rows)).toEqual([['', '']]);
      expect(seed.entryOpen).toBe(false);
      expect(seed.origin).toBe('map');
      expect(seed.markerCoord).toBeNull();
    }
  });

  it('seeds nothing from a tap-drawn boundary (gpsCaptured true), so its centroid is never shown as manual input', () => {
    const seed = manualSeedOf({
      ...base,
      gpsCaptured: true,
      latitude: 11.4105,
      longitude: 76.6957,
      fmbPolygon: { type: 'Polygon', coordinates: [ring] },
    });
    expect(textsOf(seed.rows)).toEqual([['', '']]);
    expect(seed.entryOpen).toBe(false);
    expect(seed.origin).toBe('map');
    expect(seed.markerCoord).toBeNull();
  });

  it('treats a ring with no gpsCaptured flag at all (an older draft) as tap-drawn', () => {
    const seed = manualSeedOf({ ...base, fmbPolygon: { type: 'Polygon', coordinates: [ring] } });
    expect(seed.origin).toBe('map');
    expect(textsOf(seed.rows)).toEqual([['', '']]);
  });

  it('seeds one row per vertex (closing point dropped) from a manual polygon (gpsCaptured false)', () => {
    const seed = manualSeedOf({
      ...base,
      gpsCaptured: false,
      latitude: 11.4105,
      longitude: 76.6957,
      fmbPolygon: { type: 'Polygon', coordinates: [ring] },
    });
    expect(textsOf(seed.rows)).toEqual([
      ['11.4102', '76.695'],
      ['11.4102', '76.696'],
      ['11.4112', '76.696'],
    ]);
    expect(seed.entryOpen).toBe(true);
    expect(seed.origin).toBe('manual');
    expect(seed.markerCoord).toBeNull();
  });

  it('seeds a single row and a pin from a manually-typed point with no ring', () => {
    const seed = manualSeedOf({ ...base, gpsCaptured: false, latitude: 11.4102, longitude: 76.695 });
    expect(textsOf(seed.rows)).toEqual([['11.4102', '76.695']]);
    expect(seed.entryOpen).toBe(true);
    expect(seed.origin).toBe('manual');
    expect(seed.markerCoord).toEqual([76.695, 11.4102]);
  });

  it('gives every seeded row a distinct id', () => {
    const seed = manualSeedOf({
      ...base,
      gpsCaptured: false,
      fmbPolygon: { type: 'Polygon', coordinates: [ring] },
    });
    const ids = seed.rows.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Step 3 manual points: committedPositioningOf', () => {
  const base: FarmLocationData = { id: 'farm-1', label: 'Home plot', areaAcres: 1 };
  const ring = [
    [76.695, 11.4102],
    [76.696, 11.4102],
    [76.696, 11.4112],
    [76.695, 11.4102],
  ];

  it('reads drawn / manual / none off a committed parcel', () => {
    expect(committedPositioningOf(undefined)).toBe('none');
    expect(committedPositioningOf(base)).toBe('none');
    expect(
      committedPositioningOf({ ...base, gpsCaptured: true, fmbPolygon: { type: 'Polygon', coordinates: [ring] } }),
    ).toBe('drawn');
    expect(
      committedPositioningOf({ ...base, gpsCaptured: false, fmbPolygon: { type: 'Polygon', coordinates: [ring] } }),
    ).toBe('manual');
    expect(committedPositioningOf({ ...base, latitude: 11.41, longitude: 76.69 })).toBe('manual');
  });
});

describe('Step 3 manual points: polygon round-trip', () => {
  it('rows -> ring -> saved fmbPolygon (gpsCaptured false) -> manualSeedOf rebuilds the same rows', () => {
    const typed = [row(...A), row(...B), row(...C), row(...D)];
    const shape = classifyManualPoints(typed);
    expect(shape.kind).toBe('polygon');
    if (shape.kind !== 'polygon') return;

    // The shape Step3Location's `commitActiveLocation` writes for an authoritative manual polygon.
    const saved: FarmLocationData = {
      id: 'farm-1',
      label: 'Home plot',
      areaAcres: 1,
      gpsCaptured: false,
      fmbPolygon: { type: 'Polygon', coordinates: [shape.ring] },
    };
    const seed = manualSeedOf(saved);
    expect(seed.origin).toBe('manual');
    expect(textsOf(seed.rows)).toEqual(textsOf(typed));
    // And the rebuilt rows classify back to the identical outline.
    const again = classifyManualPoints(seed.rows);
    expect(again).toEqual(shape);
  });
});
