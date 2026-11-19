/**
 * Device bug: Profile's "Farm & FMB" card showed a saved boundary (3 FMB pts, 0.32 ac, 2 zones),
 * but tapping Edit opened FMB Sketch EMPTY (Points '—', Area '— ac', Zones '—', no polygon).
 *
 * Both screens read the same GET /farms list. Profile's preview picks the farm that actually has a
 * drawn boundary (farmMapPreview.ts), while FMB Sketch blindly opened the primary-or-first farm --
 * which, for an account whose boundary lives on a non-primary farm, has no boundary at all. FMB
 * Sketch must open on the same farm the Profile preview shows.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  BackHandler: { addEventListener: () => ({ remove: () => undefined }) },
  Keyboard: { dismiss: () => undefined },
  Modal: 'Modal',
  Platform: { OS: 'android', select: (obj: Record<string, unknown>) => obj['android'] ?? obj['default'] },
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));

vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Line: 'Line',
  Path: 'Path',
}));

vi.mock('@tohfa/mobile-ui', () => ({
  FarmBoundaryMap: 'FarmBoundaryMap',
  FARM_MAP_FALLBACK_CENTER: [76.7, 11.4],
  Icon: 'Icon',
  Skeleton: 'Skeleton',
  ScreenStatusBar: 'ScreenStatusBar',
  ModalSafeArea: 'ModalSafeArea',
  appAlert: () => undefined,
}));

vi.mock('../native/documentPicker', () => ({
  default: { pickSingle: vi.fn(), isCancel: () => true, types: { pdf: 'pdf', images: 'images' } },
}));

const farmsApi = vi.hoisted(() => ({
  createFarm: vi.fn(),
  deleteFarm: vi.fn(),
  getFarms: vi.fn(),
  // FMB Sketch loads the selected farm's zones; not under test here, so they never arrive.
  getPlots: vi.fn(() => new Promise(() => undefined)),
  updateFarm: vi.fn(),
}));
vi.mock('../api/farms', () => farmsApi);

import { FMBSketchScreen } from '../screens/profile/FMBSketchScreen';
import { buildFarmMapPreview } from '../screens/profile/farmMapPreview';
import type { Farm } from '../api/farms';
import { calculatePolygonMetrics } from '../utils/geo';

// A closed triangle near Ooty, [lng, lat] -- 3 distinct FMB points.
const RING: [number, number][] = [
  [76.6925, 11.4060],
  [76.6935, 11.4060],
  [76.6930, 11.4068],
  [76.6925, 11.4060],
];

function farm(overrides: Partial<Farm>): Farm {
  return {
    id: 'x',
    name: 'Farm',
    isPrimary: false,
    boundary: null,
    boundaryAreaAcres: null,
    centroidLat: null,
    centroidLng: null,
    plotCount: 0,
    ...overrides,
  } as Farm;
}

// Mirrors the device account: 3 farms, the primary one has NO boundary; the boundary (and the
// 2 zones) live on the second farm.
const FARMS: Farm[] = [
  farm({ id: 'farm-primary', name: 'Home plot', isPrimary: true }),
  farm({
    id: 'farm-boundary',
    name: 'Hill plot',
    boundary: { type: 'Polygon', coordinates: [RING] } as Farm['boundary'],
    boundaryAreaAcres: 0.32,
    plotCount: 2,
  }),
  farm({ id: 'farm-three', name: 'Valley plot' }),
];

/** Only this Text's own direct string children (not a nested unit Text like " ac"). */
function instanceText(node: renderer.ReactTestInstance): string {
  return node.children.filter((c): c is string => typeof c === 'string').join('');
}

async function mount(): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(
      <FMBSketchScreen
        onNavigateBack={() => undefined}
        onNavigateToFieldContext={() => undefined}
        onNavigateToZones={() => undefined}
      />,
      { createNodeMock: () => ({}) },
    );
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return tree;
}

describe('FMB Sketch loads the saved boundary the Profile preview shows', () => {
  beforeEach(() => {
    farmsApi.getFarms.mockResolvedValue(FARMS);
  });

  it('opens on the farm that has the saved boundary, not the boundary-less primary farm', async () => {
    const tree = await mount();
    const map = tree.root.find((n) => n.props.testID === 'fmb-sketch-farm-boundary-map' && (n.type as unknown) === 'FarmBoundaryMap');

    // Same farm, same ring as Profile's preview.
    const preview = buildFarmMapPreview(FARMS);
    expect(preview.farm?.id).toBe('farm-boundary');
    expect(map.props.initialPolygon).toEqual(RING);
    expect(map.props.initialPolygon).toEqual(preview.polygon);
  });

  it('shows the saved point count and the selected farm zone count instead of dashes', async () => {
    const tree = await mount();
    const metricValues = tree.root
      .findAll((n) => (n.type as unknown) === 'Text' && n.props.style?.[0]?.fontWeight === '800')
      .map((n) => instanceText(n).trim());

    const farmsAreaText = calculatePolygonMetrics(RING).areaAcres.toFixed(2);
    // [Points, Area, Zones]
    expect(metricValues[0]).toBe('3');
    expect(metricValues[1]).toBe(farmsAreaText);
    expect(metricValues[2]).toBe('2');
  });
});
