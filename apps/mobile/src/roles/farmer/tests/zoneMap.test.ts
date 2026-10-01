import { describe, expect, it } from 'vitest';
import { en } from '../../../i18n/farmer';
import { classifyManualPoints, makeManualRow } from '../screens/registration/manualPoints';
import {
  EXPOSURE_OPTIONS,
  FARM_OUTLINE_COLOR,
  IRRIGATION_OPTIONS,
  SOIL_OPTIONS,
  ZONE_COLORS,
  ZONE_AREA_TOLERANCE_ACRES,
  boundaryPointCount,
  buildZoneMapOverlays,
  centerOfRing,
  checkZoneAreaBudget,
  committedZoneRing,
  containManualShape,
  editingZoneIndex,
  farmMapCenter,
  isZoneAreaOverAllocated,
  manualRowOutsideFarm,
  optionLabelKey,
  outerRingOf,
  polygonFromRing,
  resolveZoneAreaAcres,
  ringOutsideFarm,
  sameRing,
  zoneBoundaryPositioning,
  zoneContainmentRing,
  zoneColorFor,
  zoneLetterFor,
  type LngLat,
  type ZoneBoundaryInputs,
} from '../screens/profile/zoneMap';

// A ~100 m square near Ooty, open (no closing repeat).
const SQUARE: LngLat[] = [
  [76.7, 11.4],
  [76.701, 11.4],
  [76.701, 11.401],
  [76.7, 11.401],
];

describe('zoneMap: stored polygon -> map ring', () => {
  it('returns the outer ring of a closed polygon as clean pairs', () => {
    const ring = outerRingOf({ type: 'Polygon', coordinates: [[...SQUARE, SQUARE[0]!]] });
    expect(ring).toHaveLength(5);
    expect(ring[0]).toEqual([76.7, 11.4]);
  });

  it('treats null, malformed and degenerate shapes as "no boundary" instead of throwing', () => {
    expect(outerRingOf(null)).toEqual([]);
    expect(outerRingOf(undefined)).toEqual([]);
    expect(outerRingOf({ type: 'Polygon', coordinates: [] })).toEqual([]);
    // Two distinct points plus a closing repeat is not a polygon.
    expect(
      outerRingOf({ type: 'Polygon', coordinates: [[SQUARE[0]!, SQUARE[1]!, SQUARE[0]!]] }),
    ).toEqual([]);
    // Non-numeric vertices are dropped, and what is left is judged on its own.
    expect(
      outerRingOf({
        type: 'Polygon',
        coordinates: [[SQUARE[0]!, [Number.NaN, 1], SQUARE[1]!, SQUARE[2]!]],
      }),
    ).toHaveLength(3);
  });
});

describe('zoneMap: camera start', () => {
  it('centres on the drawn farm boundary first', () => {
    const center = farmMapCenter({
      boundary: { type: 'Polygon', coordinates: [SQUARE] },
      centroidLat: 1,
      centroidLng: 2,
    });
    expect(center![0]).toBeCloseTo(76.7005, 6);
    expect(center![1]).toBeCloseTo(11.4005, 6);
  });

  it('falls back to the stored centroid, then to null (device GPS) -- never a made-up point', () => {
    expect(farmMapCenter({ boundary: null, centroidLat: 11.3, centroidLng: 76.6 })).toEqual([
      76.6, 11.3,
    ]);
    expect(farmMapCenter({ boundary: null, centroidLat: null, centroidLng: null })).toBeNull();
    expect(farmMapCenter(null)).toBeNull();
  });

  it('has no centre for a ring that is not a polygon', () => {
    expect(centerOfRing(SQUARE.slice(0, 2))).toBeNull();
  });
});

describe('zoneMap: per-zone colour and letter', () => {
  it('cycles the palette by list position, so a new zone can be previewed in its final colour', () => {
    expect(zoneColorFor(0)).toBe(ZONE_COLORS[0]);
    expect(zoneColorFor(ZONE_COLORS.length)).toBe(ZONE_COLORS[0]);
    expect(zoneColorFor(ZONE_COLORS.length + 1)).toBe(ZONE_COLORS[1]);
  });

  it('keeps badges unique past 26 zones', () => {
    expect(zoneLetterFor(0)).toBe('A');
    expect(zoneLetterFor(25)).toBe('Z');
    expect(zoneLetterFor(26)).toBe('A2');
    expect(zoneLetterFor(27)).toBe('B2');
  });
});

describe('zoneMap: drawn ring -> saved polygon', () => {
  it('closes an open ring into a GeoJSON Polygon', () => {
    const polygon = polygonFromRing(SQUARE);
    expect(polygon?.type).toBe('Polygon');
    const ring = polygon!.coordinates[0]!;
    expect(ring).toHaveLength(5);
    expect(ring[4]).toEqual(ring[0]);
  });

  it('does not double-close an already closed ring', () => {
    expect(polygonFromRing([...SQUARE, SQUARE[0]!])!.coordinates[0]).toHaveLength(5);
  });

  it('returns null for fewer than 3 distinct vertices', () => {
    expect(polygonFromRing([])).toBeNull();
    expect(polygonFromRing(SQUARE.slice(0, 2))).toBeNull();
    expect(polygonFromRing([SQUARE[0]!, SQUARE[1]!, SQUARE[0]!])).toBeNull();
  });
});

describe('zoneMap: area to send', () => {
  it('prefers the typed figure', () => {
    expect(resolveZoneAreaAcres('0.55', 1.2)).toEqual({ ok: true, areaAcres: 0.55 });
  });

  it('uses the mapped area when the field is blank, and sends nothing when there is none', () => {
    expect(resolveZoneAreaAcres('  ', 1.2)).toEqual({ ok: true, areaAcres: 1.2 });
    expect(resolveZoneAreaAcres('', 0)).toEqual({ ok: true, areaAcres: undefined });
  });

  it('rejects zero, negatives and non-numbers (the API requires a positive area)', () => {
    expect(resolveZoneAreaAcres('0', 1)).toEqual({ ok: false });
    expect(resolveZoneAreaAcres('-2', 1)).toEqual({ ok: false });
    expect(resolveZoneAreaAcres('abc', 1)).toEqual({ ok: false });
  });
});

// No docs/rules.md BR-xx rule governs cross-zone area totals (confirmed: rules.md has no entry
// for it), so these are plain descriptive names rather than a BR-xx id -- see root CLAUDE.md
// §2.6, which only requires that naming for a rule actually tracked there.
describe('zoneMap: a zone\'s area vs. the farm\'s own total', () => {
  it('allows a zone whose area fits within the farm\'s remaining budget', () => {
    const result = checkZoneAreaBudget({ farmTotalAcres: 4.77, otherZonesAcres: 3, zoneAcres: 1.5 });
    expect(result).toEqual({ ok: true });
  });

  it('blocks a zone whose area would push the farm\'s total over its own size, with the exact numbers in the result', () => {
    const result = checkZoneAreaBudget({ farmTotalAcres: 4.77, otherZonesAcres: 12, zoneAcres: 1.5 });
    expect(result).toEqual({
      ok: false,
      zoneAcres: 1.5,
      wouldBeAcres: 13.5,
      farmTotalAcres: 4.77,
    });
  });

  it('a near-exact fit within the floating-point tolerance is not blocked', () => {
    // 4.77 total, other zones already at 3.77, this zone resolves to 1.005 ac -- 0.005 ac over an
    // exact fit, well inside the 0.01 ac tolerance.
    const atTolerance = checkZoneAreaBudget({ farmTotalAcres: 4.77, otherZonesAcres: 3.77, zoneAcres: 1.005 });
    expect(atTolerance).toEqual({ ok: true });
    // Just past the tolerance is still blocked -- the check has a real edge, not an unbounded one.
    const pastTolerance = checkZoneAreaBudget({
      farmTotalAcres: 4.77,
      otherZonesAcres: 3.77,
      zoneAcres: 1 + ZONE_AREA_TOLERANCE_ACRES + 0.001,
    });
    expect(pastTolerance.ok).toBe(false);
  });

  it('a farm with no known total area (no boundary, no typed figure) never blocks', () => {
    expect(checkZoneAreaBudget({ farmTotalAcres: 0, otherZonesAcres: 100, zoneAcres: 50 })).toEqual({ ok: true });
    // A negative/garbage total is treated the same as "unknown", never as a ceiling of 0.
    expect(checkZoneAreaBudget({ farmTotalAcres: -1, otherZonesAcres: 100, zoneAcres: 50 })).toEqual({ ok: true });
  });

  it('flags a farm whose zones already add up to more than its own size, for the read-only warning', () => {
    expect(isZoneAreaOverAllocated(4.77, 13.5)).toBe(true);
    expect(isZoneAreaOverAllocated(4.77, 4.0)).toBe(false);
    // Exactly at the ceiling, and within tolerance of it, are not "over".
    expect(isZoneAreaOverAllocated(4.77, 4.77)).toBe(false);
    expect(isZoneAreaOverAllocated(4.77, 4.77 + ZONE_AREA_TOLERANCE_ACRES)).toBe(false);
    // No known total: nothing to be "over".
    expect(isZoneAreaOverAllocated(0, 13.5)).toBe(false);
  });
});

describe('zoneMap: option labels', () => {
  it('every option label key exists in the English catalogue', () => {
    for (const option of [...SOIL_OPTIONS, ...EXPOSURE_OPTIONS, ...IRRIGATION_OPTIONS]) {
      expect(en[option.labelKey]).toBeTruthy();
    }
  });

  it('maps a stored value to its label key, and an unknown value to null (shown as-is)', () => {
    expect(optionLabelKey(SOIL_OPTIONS, 'Clay')).toBe('farmer.zones.soil.clay');
    expect(optionLabelKey(SOIL_OPTIONS, 'Laterite')).toBeNull();
    expect(optionLabelKey(SOIL_OPTIONS, null)).toBeNull();
  });
});

// ---- Inline editor derivations ----------------------------------------------------------------

const CLOSED_SQUARE: LngLat[] = [...SQUARE, SQUARE[0]!];
// A different, smaller typed outline, so tests can tell which ring won.
const TYPED_ROWS = [
  makeManualRow('11.41', '76.71'),
  makeManualRow('11.41', '76.7105'),
  makeManualRow('11.4105', '76.7105'),
];

function inputs(overrides: Partial<ZoneBoundaryInputs>): ZoneBoundaryInputs {
  return {
    coords: [],
    manualEntryOpen: false,
    boundaryOrigin: 'map',
    manualShape: classifyManualPoints([makeManualRow()]),
    ...overrides,
  };
}

describe('zoneMap: which ring a zone under edit commits', () => {
  it('commits the map boundary when nothing was typed', () => {
    const state = inputs({ coords: CLOSED_SQUARE });
    expect(committedZoneRing(state)).toEqual(CLOSED_SQUARE);
    expect(zoneBoundaryPositioning(state)).toBe('drawn');
  });

  it('commits nothing for 1-2 stray drawn vertices', () => {
    const state = inputs({ coords: SQUARE.slice(0, 2) });
    expect(committedZoneRing(state)).toEqual([]);
    expect(zoneBoundaryPositioning(state)).toBe('none');
  });

  it('lets a typed outline win while the panel is open, even before it reaches the map', () => {
    const manualShape = classifyManualPoints(TYPED_ROWS);
    const state = inputs({ coords: [], manualEntryOpen: true, manualShape });
    expect(manualShape.kind).toBe('polygon');
    expect(committedZoneRing(state)).toEqual(manualShape.kind === 'polygon' ? manualShape.ring : null);
    expect(zoneBoundaryPositioning(state)).toBe('manual');
  });

  it('keeps a typed outline authoritative after the panel closes (origin "manual")', () => {
    const manualShape = classifyManualPoints(TYPED_ROWS);
    const state = inputs({ coords: CLOSED_SQUARE, boundaryOrigin: 'manual', manualShape });
    expect(zoneBoundaryPositioning(state)).toBe('manual');
    expect(committedZoneRing(state)).not.toEqual(CLOSED_SQUARE);
  });

  it('hands authority back to the map once a boundary is drawn there (origin "map", panel closed)', () => {
    const state = inputs({ coords: CLOSED_SQUARE, manualShape: classifyManualPoints(TYPED_ROWS) });
    expect(committedZoneRing(state)).toEqual(CLOSED_SQUARE);
    expect(zoneBoundaryPositioning(state)).toBe('drawn');
  });

  it('never commits a lone typed point as a zone shape', () => {
    const state = inputs({ manualEntryOpen: true, manualShape: classifyManualPoints([makeManualRow('11.4', '76.7')]) });
    expect(committedZoneRing(state)).toEqual([]);
    expect(zoneBoundaryPositioning(state)).toBe('none');
  });

  it('counts placed vertices without the closing repeat', () => {
    expect(boundaryPointCount([])).toBe(0);
    expect(boundaryPointCount(SQUARE.slice(0, 1))).toBe(1);
    expect(boundaryPointCount(SQUARE.slice(0, 2))).toBe(2);
    expect(boundaryPointCount(CLOSED_SQUARE)).toBe(4);
  });
});

describe('zoneMap: ring comparison for discard-changes', () => {
  it('treats an open and a closed copy of one outline as the same', () => {
    expect(sameRing(SQUARE, CLOSED_SQUARE)).toBe(true);
    expect(sameRing([], [])).toBe(true);
  });

  it('notices a moved vertex or a different vertex count', () => {
    const moved: LngLat[] = [...SQUARE.slice(0, 3), [76.7, 11.402]];
    expect(sameRing(SQUARE, moved)).toBe(false);
    expect(sameRing(SQUARE, SQUARE.slice(0, 3))).toBe(false);
    expect(sameRing(CLOSED_SQUARE, [])).toBe(false);
  });
});

describe('zoneMap: colour of the zone under edit', () => {
  const ids = ['a', 'b', 'c'];

  it('keeps an existing zone at its own list position', () => {
    expect(editingZoneIndex(ids, { kind: 'existing', plotId: 'b' })).toBe(1);
  });

  it('puts a new zone at the end, where it will land once saved', () => {
    expect(editingZoneIndex(ids, { kind: 'new' })).toBe(3);
  });

  it('treats a vanished zone like a new one rather than index -1', () => {
    expect(editingZoneIndex(ids, { kind: 'existing', plotId: 'gone' })).toBe(3);
  });
});

describe('zoneMap: map overlays', () => {
  const zones = [
    { id: 'a', ring: CLOSED_SQUARE },
    { id: 'b', ring: [] as LngLat[] },
    { id: 'c', ring: CLOSED_SQUARE },
  ];

  it('draws the farm first (dashed, unfilled) and every shaped zone lettered by list position', () => {
    const overlays = buildZoneMapOverlays({ farmRing: CLOSED_SQUARE, zones, focusedZoneId: 'c', excludeZoneId: null });
    expect(overlays.map((o) => o.id)).toEqual(['farm', 'zone-a', 'zone-c']);
    expect(overlays[0]).toMatchObject({ color: FARM_OUTLINE_COLOR, filled: false, dashed: true });
    expect(overlays[0]!.label).toBeUndefined();
    // 'c' is third in the list even though 'b' has no shape: colour and letter follow the list.
    expect(overlays[2]).toMatchObject({ color: zoneColorFor(2), label: 'C', emphasized: true });
    expect(overlays[1]).toMatchObject({ color: zoneColorFor(0), label: 'A', emphasized: false });
  });

  it('leaves out the zone under edit and keeps every other zone on its own colour and letter', () => {
    const overlays = buildZoneMapOverlays({ farmRing: [], zones, focusedZoneId: null, excludeZoneId: 'a' });
    expect(overlays.map((o) => o.id)).toEqual(['zone-c']);
    expect(overlays[0]).toMatchObject({ color: zoneColorFor(2), label: 'C', emphasized: false });
  });
});

describe('zoneMap: keeping a zone inside its farm', () => {
  // The farm is SQUARE (~100 m); these are corners inside it, on its edge, and ~100 m east of it.
  const INSIDE_ROW = () => makeManualRow('11.4002', '76.7002');
  const EDGE_ROW = () => makeManualRow('11.4005', '76.701');
  const OUTSIDE_ROW = () => makeManualRow('11.4005', '76.702');

  it('has no containment ring when the farm has no usable boundary', () => {
    expect(zoneContainmentRing([])).toBeNull();
    expect(zoneContainmentRing([[76.7, 11.4], [76.701, 11.4]])).toBeNull();
    expect(zoneContainmentRing(CLOSED_SQUARE)).toEqual(SQUARE);
  });

  it('flags a typed row only when it is a complete, in-range point outside the farm', () => {
    const farm = zoneContainmentRing(CLOSED_SQUARE);
    expect(manualRowOutsideFarm(OUTSIDE_ROW(), farm)).toBe(true);
    expect(manualRowOutsideFarm(INSIDE_ROW(), farm)).toBe(false);
    expect(manualRowOutsideFarm(EDGE_ROW(), farm)).toBe(false); // on the farm's edge is inside
    // Half-typed or out-of-range rows already have their own message; they are not "outside".
    expect(manualRowOutsideFarm(makeManualRow('11.4005', ''), farm)).toBe(false);
    expect(manualRowOutsideFarm(makeManualRow('95', '76.702'), farm)).toBe(false);
    expect(manualRowOutsideFarm(makeManualRow(), farm)).toBe(false);
  });

  it('never flags a typed row when there is no farm boundary to stay within', () => {
    expect(manualRowOutsideFarm(OUTSIDE_ROW(), null)).toBe(false);
  });

  it('turns a typed outline with any corner outside the farm into an unusable shape', () => {
    const farm = zoneContainmentRing(CLOSED_SQUARE);
    const outside = classifyManualPoints([INSIDE_ROW(), makeManualRow('11.4002', '76.7008'), OUTSIDE_ROW()]);
    expect(outside.kind).toBe('polygon');
    expect(containManualShape(outside, farm)).toEqual({ kind: 'invalid' });
    // A lone typed point outside is refused too, not just a full outline.
    expect(containManualShape(classifyManualPoints([OUTSIDE_ROW()]), farm)).toEqual({ kind: 'invalid' });
  });

  it('leaves a typed outline that fits (corners on the edge included) exactly as classified', () => {
    const farm = zoneContainmentRing(CLOSED_SQUARE);
    const fits = classifyManualPoints([INSIDE_ROW(), makeManualRow('11.4002', '76.7008'), EDGE_ROW()]);
    expect(containManualShape(fits, farm)).toBe(fits);
    const empty = classifyManualPoints([makeManualRow()]);
    expect(containManualShape(empty, farm)).toBe(empty);
  });

  it('leaves every shape untouched when the farm has no boundary', () => {
    const outside = classifyManualPoints([INSIDE_ROW(), makeManualRow('11.4002', '76.7008'), OUTSIDE_ROW()]);
    expect(containManualShape(outside, null)).toBe(outside);
  });

  it('tells whether a committed ring (e.g. a zone saved before this rule) pokes out of the farm', () => {
    const farm = zoneContainmentRing(CLOSED_SQUARE);
    const inner: LngLat[] = [
      [76.7002, 11.4002],
      [76.7008, 11.4002],
      [76.7008, 11.4008],
      [76.7002, 11.4002],
    ];
    expect(ringOutsideFarm(inner, farm)).toBe(false);
    expect(ringOutsideFarm([...inner.slice(0, 2), [76.702, 11.4008], inner[0]!], farm)).toBe(true);
    // No ring, or no farm boundary: nothing to flag.
    expect(ringOutsideFarm([], farm)).toBe(false);
    expect(ringOutsideFarm([...inner.slice(0, 2), [76.702, 11.4008], inner[0]!], null)).toBe(false);
  });
});