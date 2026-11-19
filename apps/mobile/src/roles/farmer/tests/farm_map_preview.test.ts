/**
 * Profile's "Farm & FMB" card shows one farm on its map preview. These tests pin WHICH farm and
 * WHAT the map is given, because the bug they guard against was exactly that: the card always
 * previewed the primary-or-first farm, so a farmer whose drawn boundary lives on their second
 * farm (and whose first farm has no boundary and no centroid) saw an empty grey box and
 * "FMB PTS –" even though a boundary existed.
 */
import { describe, expect, it, vi } from 'vitest';

// The real package index pulls in react-native (Flow syntax, unparseable in plain Node), so it is
// stubbed with just the one shared constant this helper reads.
vi.mock('@tohfa/mobile-ui', () => ({ FARM_MAP_FALLBACK_CENTER: [76.6932, 11.4064] }));

import { FARM_MAP_FALLBACK_CENTER } from '@tohfa/mobile-ui';
import type { Farm } from '../api/farms';
import { buildFarmMapPreview } from '../screens/profile/farmMapPreview';

function farm(overrides: Partial<Farm>): Farm {
  return {
    id: 'farm',
    name: 'Farm',
    surveyNumber: null,
    areaAcres: null,
    village: null,
    taluk: null,
    district: 'The Nilgiris',
    isPrimary: false,
    boundary: null,
    boundaryAreaAcres: null,
    boundaryDrawnBy: null,
    boundaryDrawnAt: null,
    boundaryVersion: 0,
    address: null,
    centroidLat: null,
    centroidLng: null,
    waterSources: [],
    landBoundaryContext: [],
    notes: null,
    createdAt: '2026-11-04T10:51:31.540Z',
    updatedAt: null,
    ...overrides,
  };
}

// A closed triangle, [lng, lat] -- the shape the screenshot's account has on its second farm.
const TRIANGLE: number[][] = [
  [76.7, 11.4],
  [76.701, 11.4],
  [76.7005, 11.401],
  [76.7, 11.4],
];

describe('buildFarmMapPreview', () => {
  it('previews the farm that HAS a boundary when the first farm has none (the reported bug)', () => {
    const preview = buildFarmMapPreview([
      farm({ id: 'farm-1', name: 'Farm 1' }),
      farm({ id: 'farm-2', name: 'Farm 2', boundary: { type: 'Polygon', coordinates: [TRIANGLE] } }),
      farm({ id: 'farm-3', name: 'Farm 3' }),
    ]);

    expect(preview.farm?.id).toBe('farm-2');
    expect(preview.polygon).toEqual(TRIANGLE);
    expect(preview.hasLocation).toBe(true);
    // Centred on the ring's own centroid, in GeoJSON [lng, lat] order (not [lat, lng]).
    expect(preview.center[0]).toBeCloseTo(76.7005, 4);
    expect(preview.center[1]).toBeCloseTo((11.4 + 11.4 + 11.401) / 3, 4);
    // The closing vertex repeats the first, so a closed triangle is 3 FMB points, not 4.
    expect(preview.fmbPointCount).toBe(3);
  });

  it('prefers the primary farm when more than one farm has a boundary', () => {
    const other = TRIANGLE.map(([lng, lat]) => [lng! + 1, lat!]);
    const preview = buildFarmMapPreview([
      farm({ id: 'farm-a', boundary: { type: 'Polygon', coordinates: [other] } }),
      farm({ id: 'farm-p', isPrimary: true, boundary: { type: 'Polygon', coordinates: [TRIANGLE] } }),
    ]);
    expect(preview.farm?.id).toBe('farm-p');
    expect(preview.polygon).toEqual(TRIANGLE);
  });

  it('with no boundary anywhere, centres on a stored farm centroid and draws no polygon', () => {
    const preview = buildFarmMapPreview([
      farm({ id: 'farm-1', isPrimary: true }),
      farm({ id: 'farm-2', centroidLat: 11.41, centroidLng: 76.69 }),
    ]);
    expect(preview.farm?.id).toBe('farm-2');
    expect(preview.polygon).toBeNull();
    expect(preview.center).toEqual([76.69, 11.41]);
    expect(preview.hasLocation).toBe(true);
    expect(preview.fmbPointCount).toBe(0);
  });

  it('with no boundary and no location at all, still gives a map centre (the default region)', () => {
    const preview = buildFarmMapPreview([farm({ id: 'farm-1' }), farm({ id: 'farm-2' })]);
    expect(preview.farm?.id).toBe('farm-1');
    expect(preview.polygon).toBeNull();
    expect(preview.center).toEqual(FARM_MAP_FALLBACK_CENTER);
    expect(preview.hasLocation).toBe(false);
  });

  it('treats a degenerate ring (fewer than 3 distinct vertices) as no boundary', () => {
    const preview = buildFarmMapPreview([
      farm({
        id: 'farm-1',
        boundary: { type: 'Polygon', coordinates: [[[76.7, 11.4], [76.701, 11.4], [76.7, 11.4]]] },
      }),
    ]);
    expect(preview.polygon).toBeNull();
    expect(preview.fmbPointCount).toBe(0);
  });

  it('returns no farm for an empty list, but still a default centre so a map can render', () => {
    const preview = buildFarmMapPreview([]);
    expect(preview.farm).toBeNull();
    expect(preview.center).toEqual(FARM_MAP_FALLBACK_CENTER);
    expect(preview.hasLocation).toBe(false);
  });
});
