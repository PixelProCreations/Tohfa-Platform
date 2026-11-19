/**
 * Profile's "Farm & FMB" card must show a real map, not an empty grey box. Reported on a device:
 * an account whose FIRST farm has no boundary and no centroid, but whose SECOND farm has a drawn
 * boundary, saw "No farm boundary yet. Tap to draw it." and "FMB PTS –" with no map at all.
 *
 * These tests pin: the preview shows whichever farm actually has a boundary; a farm with only a
 * location (or none at all) still gets a map, with the "tap to draw" hint laid over it; the map is
 * non-interactive (it must not fight the page scroll); and the old placeholder survives as the
 * fallback when the map cannot render (no Mapbox token/SDK, or the map style fails to load).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance, type ReactTestRendererJSON } from 'react-test-renderer';
import { createKeychainMock } from '../../../tests/mocks/keychainMock';
import type * as FarmerApiModule from '../api/farmer';
import type * as AuditsApiModule from '../api/audits';

vi.mock('react-native-keychain', () => createKeychainMock());

vi.mock('react-native', () => ({
  Image: 'Image',
  Modal: 'Modal',
  Platform: { OS: 'android', select: (obj: Record<string, unknown>) => obj['android'] ?? obj['default'] },
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  Share: { share: () => Promise.resolve() },
  StyleSheet: {
    create: (s: Record<string, unknown>) => s,
    absoluteFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    absoluteFillObject: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    hairlineWidth: 1,
  },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));

vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Path: 'Path' }));

const mapAvailability = vi.hoisted(() => ({ available: true }));
vi.mock('@tohfa/mobile-ui', () => ({
  ErrorState: 'ErrorState',
  FARM_MAP_FALLBACK_CENTER: [76.6932, 11.4064],
  FarmBoundaryMap: 'FarmBoundaryMap',
  Icon: 'Icon',
  isFarmMapAvailable: () => mapAvailability.available,
  ScreenStatusBar: 'ScreenStatusBar',
  ModalSafeArea: 'ModalSafeArea',
  appAlert: () => undefined,
  Skeleton: 'Skeleton',
}));

vi.mock('../assets/farmer-kumar.jpg', () => ({ default: 1 }));

const farmsApi = vi.hoisted(() => ({ getFarms: vi.fn(), getPlots: vi.fn(), updateFarm: vi.fn() }));
vi.mock('../api/farms', () => farmsApi);
vi.mock('../api/soil', () => ({ listSoilTests: vi.fn().mockResolvedValue([]) }));
vi.mock('../api/auth', () => ({ logout: vi.fn() }));
vi.mock('../api/farmer', async (importOriginal) => ({
  ...(await importOriginal<typeof FarmerApiModule>()),
  getCachedCertifications: () => [],
  getMyCertifications: vi.fn().mockResolvedValue({ items: [] }),
  getMyFarmerProfile: vi.fn().mockResolvedValue(null),
  getMyFarmRating: vi.fn().mockRejectedValue(new Error('offline')),
  getSystemConfig: vi.fn().mockResolvedValue({ certExpiryWarningDays: 30 }),
  updateMyFarmerProfile: vi.fn(),
}));
vi.mock('../api/audits', async (importOriginal) => ({
  ...(await importOriginal<typeof AuditsApiModule>()),
  listAllMyAudits: vi.fn().mockResolvedValue([]),
}));

import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { t } from '../../../i18n/farmer';

// Closed triangle, [lng, lat].
const TRIANGLE = [
  [76.7, 11.4],
  [76.701, 11.4],
  [76.7005, 11.401],
  [76.7, 11.4],
];

function farm(overrides: Record<string, unknown>) {
  return {
    id: 'farm',
    name: 'Farm',
    isPrimary: false,
    areaAcres: null,
    boundary: null,
    boundaryAreaAcres: null,
    boundaryVersion: 0,
    centroidLat: null,
    centroidLng: null,
    district: 'The Nilgiris',
    village: null,
    waterSources: [],
    landBoundaryContext: [],
    plotCount: 0,
    updatedAt: null,
    ...overrides,
  };
}

function renderedText(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(renderedText);
  return (node.children ?? []).flatMap(renderedText);
}

async function mount(onNavigateToFMBSketch = vi.fn()): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<ProfileScreen onNavigateToFMBSketch={onNavigateToFMBSketch} />);
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return tree;
}

function previewCard(tree: renderer.ReactTestRenderer): ReactTestInstance {
  return tree.root.find(
    (node) => node.props.testID === 'profile-fmb-map-preview' && typeof node.props.onPress === 'function',
  );
}

/** The mocked host components above are plain strings ('Text', 'FarmBoundaryMap'), which React's
 * `ElementType` typing does not admit -- compare through `unknown`. */
function isHost(node: ReactTestInstance, name: string): boolean {
  return (node.type as unknown) === name;
}

function previewText(tree: renderer.ReactTestRenderer): string {
  const card = previewCard(tree);
  return card
    .findAll((node) => isHost(node, 'Text'))
    .flatMap((node) => node.children.filter((c): c is string => typeof c === 'string'))
    .join(' ');
}

function previewMaps(tree: renderer.ReactTestRenderer): ReactTestInstance[] {
  return previewCard(tree).findAll((node) => isHost(node, 'FarmBoundaryMap'));
}

/** Walks up from `node` and reports whether any ancestor inside the card turns touches off. */
function isInsideNonInteractiveWrapper(node: ReactTestInstance): boolean {
  let current: ReactTestInstance | null = node.parent;
  while (current) {
    if (current.props.pointerEvents === 'none') return true;
    if (current.props.testID === 'profile-fmb-map-preview') return false;
    current = current.parent;
  }
  return false;
}

describe('Profile Farm & FMB card: map preview', () => {
  beforeEach(() => {
    mapAvailability.available = true;
    farmsApi.getPlots.mockResolvedValue([]);
  });

  it('shows the boundary of the farm that has one, even when the first farm has none (reported bug)', async () => {
    farmsApi.getFarms.mockResolvedValue([
      farm({ id: 'farm-1', name: 'Farm 1' }),
      farm({ id: 'farm-2', name: 'Farm 2', boundary: { type: 'Polygon', coordinates: [TRIANGLE] }, boundaryAreaAcres: 0.32 }),
      farm({ id: 'farm-3', name: 'Farm 3' }),
    ]);
    const tree = await mount();

    const maps = previewMaps(tree);
    expect(maps).toHaveLength(1);
    const map = maps[0]!;
    expect(map.props.initialPolygon).toEqual(TRIANGLE);
    expect(map.props.initialCenter[0]).toBeCloseTo(76.7005, 4);
    expect(map.props.initialCenter[1]).toBeCloseTo((11.4 + 11.4 + 11.401) / 3, 4);
    expect(map.props.readOnly).toBe(true);
    expect(map.props.gesturesEnabled).toBe(false);
    expect(isInsideNonInteractiveWrapper(map)).toBe(true);

    expect(previewText(tree)).not.toContain(t('farmer.profile.farm.mapEmpty'));
    // FMB PTS now counts the previewed farm's boundary (3 vertices), not the boundary-less first farm.
    const allText = renderedText(tree.toJSON() as ReactTestRendererJSON).join(' ');
    expect(allText).toContain('0.32');
    const fmbPtsLabel = tree.root.findAll(
      (n) => isHost(n, 'Text') && n.children.includes(t('farmer.profile.farm.metric.fmbPts')),
    )[0]!;
    expect(fmbPtsLabel.parent!.findAll((n) => isHost(n, 'Text'))[0]!.children).toEqual(['3']);
  });

  it('with no boundary but a stored location, renders a map centred there with the tap-to-draw hint', async () => {
    farmsApi.getFarms.mockResolvedValue([farm({ id: 'farm-1', isPrimary: true, centroidLat: 11.41, centroidLng: 76.69 })]);
    const onNavigateToFMBSketch = vi.fn();
    const tree = await mount(onNavigateToFMBSketch);

    const maps = previewMaps(tree);
    expect(maps).toHaveLength(1);
    expect(maps[0]!.props.initialCenter).toEqual([76.69, 11.41]);
    expect(maps[0]!.props.initialPolygon).toBeNull();
    expect(maps[0]!.props.markerCoordinate).toEqual([76.69, 11.41]);
    expect(previewText(tree)).toContain(t('farmer.profile.farm.mapEmpty'));

    act(() => {
      previewCard(tree).props.onPress();
    });
    expect(onNavigateToFMBSketch).toHaveBeenCalledTimes(1);
  });

  it('with no boundary and no location at all, still renders a map at the default region with the hint', async () => {
    farmsApi.getFarms.mockResolvedValue([farm({ id: 'farm-1' }), farm({ id: 'farm-2' })]);
    const tree = await mount();

    const maps = previewMaps(tree);
    expect(maps).toHaveLength(1);
    expect(maps[0]!.props.initialCenter).toEqual([76.6932, 11.4064]);
    // No pin: the default region is not the farmer's farm, so nothing may be marked on it.
    expect(maps[0]!.props.markerCoordinate).toBeNull();
    expect(previewText(tree)).toContain(t('farmer.profile.farm.mapEmpty'));
    expect(previewText(tree)).toContain(t('farmer.profile.farm.gpsPending'));
  });

  it('falls back to the placeholder when the map style fails to load, but not for a single tile error', async () => {
    farmsApi.getFarms.mockResolvedValue([
      farm({ id: 'farm-1', isPrimary: true, boundary: { type: 'Polygon', coordinates: [TRIANGLE] } }),
    ]);
    const tree = await mount();
    expect(previewMaps(tree)).toHaveLength(1);

    act(() => {
      previewMaps(tree)[0]!.props.onMapLoadError({ error: 'tile 404', type: 'tile' });
    });
    expect(previewMaps(tree)).toHaveLength(1);

    act(() => {
      previewMaps(tree)[0]!.props.onMapLoadError({ error: 'Unauthorized', type: 'style' });
    });
    expect(previewMaps(tree)).toHaveLength(0);
    expect(previewText(tree)).toContain(t('farmer.profile.farm.mapEmpty'));
  });

  it('shows the placeholder (no map) when the map cannot render at all, e.g. no Mapbox token', async () => {
    mapAvailability.available = false;
    farmsApi.getFarms.mockResolvedValue([
      farm({ id: 'farm-1', isPrimary: true, boundary: { type: 'Polygon', coordinates: [TRIANGLE] } }),
    ]);
    const tree = await mount();
    expect(previewMaps(tree)).toHaveLength(0);
    expect(previewText(tree)).toContain(t('farmer.profile.farm.mapEmpty'));
  });
});
