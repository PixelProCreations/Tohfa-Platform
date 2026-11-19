/**
 * FMB Sketch -- "Your farms" selection and Edit farm (sync with registration Step 3).
 *
 * Device report: tapping a farm (e.g. "Farm 1") in the Your farms list did nothing -- the rows were
 * plain Views, so the map never moved to that farm the way Step 3's location chips do, and the
 * Points / Area / Zones metrics stayed on whatever farm the screen opened on. The Edit (pencil)
 * button only renamed the farm; the rest of the farm details the API's PATCH /farms/{farmId}
 * accepts (area, village, taluk, district, notes, boundary) could not be edited from here.
 *
 * Pinned here:
 *   - tapping a farm selects it and remounts the map on THAT farm: its saved boundary fitted to the
 *     view, else its stored location, else an honest "no location yet" notice (never a made-up spot);
 *   - metrics follow the selected farm, and an unsaved drawing is not silently carried across;
 *   - Edit farm opens a full form + the same Step 3 map controls, validates, and saves details and
 *     boundary in one PATCH (or clears the boundary with `boundary: null`);
 *   - a failed save keeps the form open with an error; a failed load offers a retry.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';

const alertMock = vi.hoisted(() => vi.fn());

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
  appAlert: alertMock,
}));

vi.mock('../native/documentPicker', () => ({
  default: { pickSingle: vi.fn(), isCancel: () => true, types: { pdf: 'pdf', images: 'images' } },
}));

const farmsApi = vi.hoisted(() => ({
  createFarm: vi.fn(),
  deleteFarm: vi.fn(),
  getFarms: vi.fn(),
  getPlots: vi.fn(),
  updateFarm: vi.fn(),
}));
vi.mock('../api/farms', () => farmsApi);

// Zones load per selected farm. Outside the zones suite below the load is left pending -- "not
// loaded yet" -- so the Zones metric keeps the farm list's own plotCount these tests were written
// against, and no overlay is drawn.
beforeEach(() => {
  farmsApi.getPlots.mockReset();
  farmsApi.getPlots.mockImplementation(() => new Promise(() => undefined));
});

import { FMBSketchScreen } from '../screens/profile/FMBSketchScreen';
import {
  FARM_LOCATION_ZOOM,
  buildFarmMapTarget,
  fitZoomForRing,
} from '../screens/profile/farmMapPreview';
import { buildZoneMapOverlays, outerRingOf, zoneColorFor, zoneLetterFor } from '../screens/profile/zoneMap';
import type { Farm, Plot } from '../api/farms';
import { calculatePolygonMetrics } from '../utils/geo';
import { t } from '../../../i18n/farmer';

// [lng, lat] closed rings near Ooty.
const RING_A: [number, number][] = [
  [76.6925, 11.406],
  [76.6935, 11.406],
  [76.693, 11.4068],
  [76.6925, 11.406],
];
// A noticeably larger square (4 points) so its fitted zoom is lower than RING_A's.
const RING_B: [number, number][] = [
  [76.7, 11.41],
  [76.71, 11.41],
  [76.71, 11.42],
  [76.7, 11.42],
  [76.7, 11.41],
];

function farm(overrides: Partial<Farm>): Farm {
  return {
    id: 'x',
    name: 'Farm',
    surveyNumber: null,
    areaAcres: null,
    village: null,
    taluk: null,
    district: 'Nilgiris',
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
    plotCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: null,
    ...overrides,
  };
}

const FARM_1 = farm({
  id: 'farm-1',
  name: 'Farm 1',
  isPrimary: true,
  boundary: { type: 'Polygon', coordinates: [RING_A] },
  boundaryAreaAcres: 0.32,
  plotCount: 2,
  village: 'Lovedale',
});
const FARM_2 = farm({
  id: 'farm-2',
  name: 'Farm 2',
  boundary: { type: 'Polygon', coordinates: [RING_B] },
  boundaryAreaAcres: 270,
  plotCount: 5,
});
// Location only (e.g. a Step 3 manual pin) -- no boundary drawn.
const FARM_3 = farm({ id: 'farm-3', name: 'Farm 3', centroidLat: 11.38, centroidLng: 76.75 });
// Neither a boundary nor a stored location.
const FARM_4 = farm({ id: 'farm-4', name: 'Farm 4' });

const FARMS = [FARM_1, FARM_2, FARM_3, FARM_4];

function renderedText(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(renderedText);
  return (node.children ?? []).flatMap(renderedText);
}

function text(tree: renderer.ReactTestRenderer): string {
  return renderedText(tree.toJSON() as ReactTestRendererJSON).join(' ');
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function mount(
  onNavigateToZones: (farmId: string) => void = () => undefined,
): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(
      <FMBSketchScreen
        onNavigateBack={() => undefined}
        onNavigateToFieldContext={() => undefined}
        onNavigateToZones={onNavigateToZones}
      />,
      {
        createNodeMock: (element) =>
          element.type === 'FarmBoundaryMap'
            ? {
                startDrawing: vi.fn(),
                startEditing: vi.fn(),
                finish: vi.fn(),
                undo: vi.fn(),
                clear: vi.fn(),
                locateMe: vi.fn(),
                flyTo: vi.fn(),
                zoomIn: vi.fn(),
                zoomOut: vi.fn(),
              }
            : null,
      },
    );
  });
  await flush();
  return tree;
}

function byTestID(tree: renderer.ReactTestRenderer, testID: string) {
  return tree.root.find((n) => n.props.testID === testID && typeof n.type === 'string');
}

function has(tree: renderer.ReactTestRenderer, testID: string): boolean {
  return tree.root.findAll((n) => n.props.testID === testID && typeof n.type === 'string').length > 0;
}

function mainMap(tree: renderer.ReactTestRenderer) {
  return tree.root.find(
    (n) => n.props.testID === 'fmb-sketch-farm-boundary-map' && (n.type as unknown) === 'FarmBoundaryMap',
  );
}

function sheetMap(tree: renderer.ReactTestRenderer) {
  return tree.root.find(
    (n) => n.props.testID === 'fmb-edit-farm-boundary-map' && (n.type as unknown) === 'FarmBoundaryMap',
  );
}

async function press(tree: renderer.ReactTestRenderer, testID: string) {
  const target = byTestID(tree, testID);
  await act(async () => {
    target.props.onPress();
  });
  await flush();
}

function type(tree: renderer.ReactTestRenderer, testID: string, value: string) {
  const input = byTestID(tree, testID);
  act(() => {
    input.props.onChangeText(value);
  });
}

function metric(tree: renderer.ReactTestRenderer, which: 'points' | 'area' | 'zones'): string {
  const node = byTestID(tree, `fmb-sketch-metric-${which}`);
  return node.children.filter((c): c is string => typeof c === 'string').join('').trim();
}

describe('farm map target (pure)', () => {
  it('a boundary farm targets its own ring, centred on the ring centroid, zoomed to fit', () => {
    const target = buildFarmMapTarget(FARM_1);
    const { centroid } = calculatePolygonMetrics(RING_A);
    expect(target.kind).toBe('boundary');
    expect(target.polygon).toEqual(RING_A);
    expect(target.center).toEqual([centroid.longitude, centroid.latitude]);
    expect(target.zoom).toBe(fitZoomForRing(RING_A));
  });

  it('a bigger boundary fits at a lower zoom than a small one', () => {
    expect(fitZoomForRing(RING_B)).toBeLessThan(fitZoomForRing(RING_A));
  });

  it('a location-only farm targets its stored centroid with no polygon', () => {
    const target = buildFarmMapTarget(FARM_3);
    expect(target).toEqual({ kind: 'location', polygon: null, center: [76.75, 11.38], zoom: FARM_LOCATION_ZOOM });
  });

  it('a farm with neither reports kind "none" and no centre (no invented coordinates)', () => {
    const target = buildFarmMapTarget(FARM_4);
    expect(target.kind).toBe('none');
    expect(target.center).toBeNull();
    expect(target.polygon).toBeNull();
  });
});

describe('FMB Sketch: tapping a farm in Your farms', () => {
  beforeEach(() => {
    alertMock.mockReset();
    farmsApi.getFarms.mockReset();
    farmsApi.updateFarm.mockReset();
    farmsApi.getFarms.mockResolvedValue(FARMS);
  });

  it('selects the tapped farm, loads its boundary, fits the map to it and updates the metrics', async () => {
    const tree = await mount();
    expect(mainMap(tree).props.initialPolygon).toEqual(RING_A);

    await press(tree, 'fmb-sketch-farm-row-farm-2');

    const map = mainMap(tree);
    const target = buildFarmMapTarget(FARM_2);
    expect(map.props.initialPolygon).toEqual(RING_B);
    expect(map.props.initialCenter).toEqual(target.center);
    expect(map.props.initialZoom).toBe(target.zoom);
    expect(byTestID(tree, 'fmb-sketch-farm-row-farm-2').props.accessibilityState).toEqual({ selected: true });
    expect(byTestID(tree, 'fmb-sketch-farm-row-farm-1').props.accessibilityState).toEqual({ selected: false });

    expect(metric(tree, 'points')).toBe('4');
    expect(metric(tree, 'area')).toBe(calculatePolygonMetrics(RING_B).areaAcres.toFixed(2));
    expect(metric(tree, 'zones')).toBe('5');
  });

  it('a farm with only a stored location centres on it, with no polygon and dashed metrics', async () => {
    const tree = await mount();
    await press(tree, 'fmb-sketch-farm-row-farm-3');

    const map = mainMap(tree);
    expect(map.props.initialPolygon).toBeNull();
    expect(map.props.initialCenter).toEqual([76.75, 11.38]);
    expect(map.props.initialZoom).toBe(FARM_LOCATION_ZOOM);
    expect(metric(tree, 'points')).toBe('—');
    expect(metric(tree, 'zones')).toBe('—');
    expect(has(tree, 'fmb-sketch-no-location')).toBe(false);
  });

  it('a farm with neither boundary nor location shows an honest empty-state notice', async () => {
    const tree = await mount();
    expect(has(tree, 'fmb-sketch-no-location')).toBe(false);

    await press(tree, 'fmb-sketch-farm-row-farm-4');

    expect(mainMap(tree).props.initialCenter).toBeNull();
    expect(mainMap(tree).props.initialPolygon).toBeNull();
    expect(has(tree, 'fmb-sketch-no-location')).toBe(true);
    expect(text(tree)).toContain(t('farmer.fmb.noLocation'));
  });

  it('switching farms clears the previous farm drawing (after confirming an unsaved one)', async () => {
    const tree = await mount();
    // Farmer drags a vertex of Farm 1 but does not save.
    const edited: [number, number][] = [[76.69, 11.4], [76.7, 11.4], [76.695, 11.41], [76.69, 11.4]];
    act(() => {
      mainMap(tree).props.onPolygonChange(edited);
    });

    await press(tree, 'fmb-sketch-farm-row-farm-4');
    // Unsaved drawing: asks first, nothing switched yet (Farm 1 still selected, its edit kept).
    expect(alertMock).toHaveBeenCalledTimes(1);
    expect(byTestID(tree, 'fmb-sketch-farm-row-farm-1').props.accessibilityState).toEqual({ selected: true });
    expect(byTestID(tree, 'fmb-sketch-farm-row-farm-4').props.accessibilityState).toEqual({ selected: false });
    expect(mainMap(tree).props.initialPolygon).toEqual(edited);

    const buttons = alertMock.mock.calls[0]![2] as Array<{ text: string; onPress?: () => void }>;
    const discard = buttons.find((b) => b.text === t('farmer.fmb.discardConfirm'))!;
    await act(async () => {
      discard.onPress!();
    });
    await flush();

    expect(mainMap(tree).props.initialPolygon).toBeNull();
    expect(metric(tree, 'points')).toBe('—');
    expect(metric(tree, 'area')).toBe('—');

    // Coming back shows Farm 1's SAVED ring, not the discarded edit.
    await press(tree, 'fmb-sketch-farm-row-farm-1');
    expect(alertMock).toHaveBeenCalledTimes(1);
    expect(mainMap(tree).props.initialPolygon).toEqual(RING_A);
    expect(metric(tree, 'points')).toBe('3');
  });
});

describe('FMB Sketch: Edit farm', () => {
  beforeEach(() => {
    alertMock.mockReset();
    farmsApi.getFarms.mockReset();
    farmsApi.updateFarm.mockReset();
    farmsApi.getFarms.mockResolvedValue(FARMS);
  });

  it('opens a form prefilled with the farm details and its boundary on the Step 3 map controls', async () => {
    const tree = await mount();
    await press(tree, 'fmb-sketch-farm-edit-farm-1');

    expect(byTestID(tree, 'fmb-edit-farm-name').props.value).toBe('Farm 1');
    expect(byTestID(tree, 'fmb-edit-farm-village').props.value).toBe('Lovedale');
    expect(byTestID(tree, 'fmb-edit-farm-district').props.value).toBe('Nilgiris');
    expect(sheetMap(tree).props.initialPolygon).toEqual(RING_A);
    // Same Step 3 controls as the main map.
    expect(has(tree, 'fmb-edit-search-open')).toBe(true);
    expect(has(tree, 'fmb-edit-draw-toggle')).toBe(true);
    // Editing also selects that farm on the main map.
    expect(byTestID(tree, 'fmb-sketch-farm-row-farm-1').props.accessibilityState).toEqual({ selected: true });
  });

  it('saves the edited details and redrawn boundary in one PATCH, then refreshes list and metrics', async () => {
    const redrawn: [number, number][] = [
      [76.69, 11.4],
      [76.7, 11.4],
      [76.7, 11.41],
      [76.69, 11.41],
      [76.69, 11.4],
    ];
    farmsApi.updateFarm.mockImplementation(async (id: string, body: Record<string, unknown>) => ({
      // PATCH returns the plain Farm shape: no plotCount.
      ...FARM_2,
      id,
      name: body['name'],
      areaAcres: body['areaAcres'],
      village: body['village'],
      taluk: body['taluk'],
      district: body['district'],
      notes: body['notes'],
      boundary: body['boundary'],
      boundaryAreaAcres: body['calculatedAreaAcres'],
      plotCount: undefined,
    }));

    const tree = await mount();
    await press(tree, 'fmb-sketch-farm-edit-farm-2');

    type(tree, 'fmb-edit-farm-name', '  Upper Terrace  ');
    type(tree, 'fmb-edit-farm-area', '2.5');
    type(tree, 'fmb-edit-farm-village', 'Kotagiri');
    type(tree, 'fmb-edit-farm-taluk', 'Kotagiri');
    type(tree, 'fmb-edit-farm-notes', 'North slope');
    act(() => {
      sheetMap(tree).props.onPolygonChange(redrawn);
    });

    await press(tree, 'fmb-edit-farm-save');

    expect(farmsApi.updateFarm).toHaveBeenCalledTimes(1);
    expect(farmsApi.updateFarm).toHaveBeenCalledWith('farm-2', {
      name: 'Upper Terrace',
      areaAcres: 2.5,
      village: 'Kotagiri',
      taluk: 'Kotagiri',
      district: 'Nilgiris',
      notes: 'North slope',
      boundary: { type: 'Polygon', coordinates: [redrawn] },
      calculatedAreaAcres: calculatePolygonMetrics(redrawn).areaAcres,
    });

    // Sheet closed, list renamed, main map shows the saved boundary, zones count kept.
    expect(has(tree, 'fmb-edit-farm-save')).toBe(false);
    expect(text(tree)).toContain('Upper Terrace');
    expect(mainMap(tree).props.initialPolygon).toEqual(redrawn);
    expect(metric(tree, 'points')).toBe('4');
    expect(metric(tree, 'zones')).toBe('5');
  });

  it('clearing the boundary in the form sends boundary: null', async () => {
    farmsApi.updateFarm.mockResolvedValue({ ...FARM_1, boundary: null, boundaryAreaAcres: null });
    const tree = await mount();
    await press(tree, 'fmb-sketch-farm-edit-farm-1');

    act(() => {
      sheetMap(tree).props.onPolygonChange([]);
    });
    await press(tree, 'fmb-edit-farm-save');

    expect(farmsApi.updateFarm).toHaveBeenCalledTimes(1);
    const body = farmsApi.updateFarm.mock.calls[0]![1] as Record<string, unknown>;
    expect(body['boundary']).toBeNull();
    expect(body).not.toHaveProperty('calculatedAreaAcres');
  });

  it('an untouched boundary is not re-sent', async () => {
    farmsApi.updateFarm.mockResolvedValue({ ...FARM_1, name: 'Farm One' });
    const tree = await mount();
    await press(tree, 'fmb-sketch-farm-edit-farm-1');
    type(tree, 'fmb-edit-farm-name', 'Farm One');
    await press(tree, 'fmb-edit-farm-save');

    const body = farmsApi.updateFarm.mock.calls[0]![1] as Record<string, unknown>;
    expect(body).not.toHaveProperty('boundary');
    expect(body['name']).toBe('Farm One');
  });

  it('validates: blank name, non-positive area and a 2-point boundary are refused without calling the API', async () => {
    const tree = await mount();
    await press(tree, 'fmb-sketch-farm-edit-farm-1');

    type(tree, 'fmb-edit-farm-name', '   ');
    type(tree, 'fmb-edit-farm-area', '0');
    act(() => {
      sheetMap(tree).props.onPolygonChange([
        [76.69, 11.4],
        [76.7, 11.4],
      ]);
    });
    await press(tree, 'fmb-edit-farm-save');

    expect(farmsApi.updateFarm).not.toHaveBeenCalled();
    expect(text(tree)).toContain(t('farmer.fmb.edit.nameRequired'));
    expect(text(tree)).toContain(t('farmer.fmb.edit.areaInvalid'));
    expect(text(tree)).toContain(t('farmer.fmb.edit.boundaryTooFewPoints'));
    expect(has(tree, 'fmb-edit-farm-save')).toBe(true);
  });

  it('a failed save keeps the form open with an error and the farmer input intact', async () => {
    farmsApi.updateFarm.mockRejectedValue(new Error('network down'));
    const tree = await mount();
    await press(tree, 'fmb-sketch-farm-edit-farm-1');
    type(tree, 'fmb-edit-farm-name', 'Farm One');
    await press(tree, 'fmb-edit-farm-save');

    expect(has(tree, 'fmb-edit-farm-error')).toBe(true);
    expect(byTestID(tree, 'fmb-edit-farm-name').props.value).toBe('Farm One');
    // The list still shows the saved name.
    expect(text(tree)).toContain('Farm 1');
  });
});

describe('FMB Sketch: closing the Edit farm sheet of a just-added farm', () => {
  // "Add another farm" creates the farm on the server BEFORE the sheet opens (so the sheet can
  // PATCH it). Closing that sheet without saving used to leave an empty placeholder "Farm N"
  // behind in Your farms; closing it now removes the placeholder again.
  const CREATED = farm({ id: 'farm-new', name: 'Farm 5' });

  beforeEach(() => {
    alertMock.mockReset();
    farmsApi.getFarms.mockReset();
    farmsApi.updateFarm.mockReset();
    farmsApi.createFarm.mockReset();
    farmsApi.deleteFarm.mockReset();
    farmsApi.getFarms.mockResolvedValue(FARMS);
    farmsApi.createFarm.mockResolvedValue(CREATED);
    farmsApi.deleteFarm.mockResolvedValue(undefined);
  });

  /** Add another farm -> confirm in the alert -> sheet open on the created farm. */
  async function addAnotherFarm(tree: renderer.ReactTestRenderer) {
    await press(tree, 'fmb-sketch-add-farm');
    const buttons = alertMock.mock.calls.at(-1)![2] as Array<{ text: string; onPress?: () => void }>;
    const confirm = buttons.find((b) => b.text === t('farmer.fmb.addConfirm'))!;
    await act(async () => {
      confirm.onPress!();
    });
    await flush();
    expect(farmsApi.createFarm).toHaveBeenCalledTimes(1);
    expect(byTestID(tree, 'fmb-edit-farm-name').props.value).toBe('Farm 5');
    expect(has(tree, 'fmb-sketch-farm-row-farm-new')).toBe(true);
  }

  it('FMB Sketch: closing the sheet of a just-added farm deletes it and falls back to the first farm', async () => {
    const tree = await mount();
    await addAnotherFarm(tree);

    await press(tree, 'fmb-edit-farm-close');

    expect(has(tree, 'fmb-edit-farm-save')).toBe(false);
    expect(farmsApi.deleteFarm).toHaveBeenCalledTimes(1);
    expect(farmsApi.deleteFarm).toHaveBeenCalledWith('farm-new');
    expect(has(tree, 'fmb-sketch-farm-row-farm-new')).toBe(false);
    expect(byTestID(tree, 'fmb-sketch-farm-row-farm-1').props.accessibilityState).toEqual({ selected: true });
    expect(mainMap(tree).props.initialPolygon).toEqual(RING_A);
  });

  it('FMB Sketch: saving the sheet of a just-added farm keeps it and does not delete it', async () => {
    farmsApi.updateFarm.mockImplementation(async (id: string, body: Record<string, unknown>) => ({
      ...CREATED,
      id,
      name: body['name'] ?? CREATED.name,
    }));
    const tree = await mount();
    await addAnotherFarm(tree);

    type(tree, 'fmb-edit-farm-name', 'Lower Terrace');
    await press(tree, 'fmb-edit-farm-save');

    expect(farmsApi.updateFarm).toHaveBeenCalledTimes(1);
    expect(has(tree, 'fmb-edit-farm-save')).toBe(false);
    expect(farmsApi.deleteFarm).not.toHaveBeenCalled();
    expect(has(tree, 'fmb-sketch-farm-row-farm-new')).toBe(true);
    expect(text(tree)).toContain('Lower Terrace');
  });

  it('FMB Sketch: closing the Edit sheet of an existing farm does not delete it', async () => {
    const tree = await mount();
    await press(tree, 'fmb-sketch-farm-edit-farm-2');

    await press(tree, 'fmb-edit-farm-close');

    expect(has(tree, 'fmb-edit-farm-save')).toBe(false);
    expect(farmsApi.deleteFarm).not.toHaveBeenCalled();
    expect(has(tree, 'fmb-sketch-farm-row-farm-2')).toBe(true);
  });

  it('FMB Sketch: a failed placeholder delete still closes the sheet, shows the delete error and keeps the farm', async () => {
    // A non-Error rejection, so formatErrorMessage falls back to the screen's own i18n message
    // (a plain Error would surface its raw .message instead).
    farmsApi.deleteFarm.mockRejectedValue({ status: 0 });
    const tree = await mount();
    await addAnotherFarm(tree);

    await press(tree, 'fmb-edit-farm-close');

    expect(farmsApi.deleteFarm).toHaveBeenCalledWith('farm-new');
    expect(has(tree, 'fmb-edit-farm-save')).toBe(false);
    expect(text(tree)).toContain(t('farmer.fmb.deleteError'));
    expect(has(tree, 'fmb-sketch-farm-row-farm-new')).toBe(true);
  });
});

describe('FMB Sketch: load error', () => {
  it('shows the load error with a retry that reloads the farms', async () => {
    farmsApi.getFarms.mockReset();
    farmsApi.getFarms.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(FARMS);
    const tree = await mount();
    expect(has(tree, 'fmb-sketch-load-error')).toBe(true);

    await press(tree, 'fmb-sketch-load-retry');
    expect(farmsApi.getFarms).toHaveBeenCalledTimes(2);
    expect(has(tree, 'fmb-sketch-load-error')).toBe(false);
    expect(text(tree)).toContain('Farm 2');
  });
});

describe("FMB Sketch: the selected farm's zones on the map, and Edit zones", () => {
  // Small squares inside RING_A / RING_B. [lng, lat], closed.
  const ZONE_RING_A1: [number, number][] = [
    [76.6927, 11.4061],
    [76.6929, 11.4061],
    [76.6929, 11.4063],
    [76.6927, 11.4063],
    [76.6927, 11.4061],
  ];
  const ZONE_RING_A3: [number, number][] = [
    [76.6931, 11.4061],
    [76.6933, 11.4061],
    [76.6932, 11.4063],
    [76.6931, 11.4061],
  ];
  const ZONE_RING_B1: [number, number][] = [
    [76.701, 11.411],
    [76.705, 11.411],
    [76.705, 11.415],
    [76.701, 11.415],
    [76.701, 11.411],
  ];

  function plot(overrides: Partial<Plot> & { id: string; farmId: string }): Plot {
    return {
      name: overrides.id,
      areaAcres: null,
      soilType: null,
      sunExposure: null,
      irrigationType: null,
      boundary: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: null,
      ...overrides,
    };
  }

  // Farm 1 has three zones (one never drawn) although its list row still says plotCount 2: the
  // loaded list is the real count.
  const FARM_1_ZONES: Plot[] = [
    plot({ id: 'z-a1', farmId: 'farm-1', boundary: { type: 'Polygon', coordinates: [ZONE_RING_A1] } }),
    plot({ id: 'z-a2', farmId: 'farm-1', boundary: null }),
    plot({ id: 'z-a3', farmId: 'farm-1', boundary: { type: 'Polygon', coordinates: [ZONE_RING_A3] } }),
  ];
  const FARM_2_ZONES: Plot[] = [
    plot({ id: 'z-b1', farmId: 'farm-2', boundary: { type: 'Polygon', coordinates: [ZONE_RING_B1] } }),
  ];

  /** What the map should get for a farm's zones: the zone overlays only -- see the screen. */
  function expectedOverlays(zones: Plot[]) {
    return buildZoneMapOverlays({
      farmRing: [],
      zones: zones.map((zone) => ({ id: zone.id, ring: outerRingOf(zone.boundary) })),
      focusedZoneId: null,
      excludeZoneId: null,
    });
  }

  function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((res) => {
      resolve = res;
    });
    return { promise, resolve };
  }

  beforeEach(() => {
    alertMock.mockReset();
    farmsApi.getFarms.mockReset();
    farmsApi.getFarms.mockResolvedValue(FARMS);
    farmsApi.getPlots.mockReset();
    farmsApi.getPlots.mockImplementation(async (farmId: string) =>
      farmId === 'farm-1' ? FARM_1_ZONES : farmId === 'farm-2' ? FARM_2_ZONES : [],
    );
  });

  it("FMB Sketch: the selected farm's zones load and are drawn over its own boundary, lettered and coloured as on Zones", async () => {
    const tree = await mount();

    expect(farmsApi.getPlots).toHaveBeenCalledTimes(1);
    expect(farmsApi.getPlots.mock.calls[0]![0]).toBe('farm-1');
    const map = mainMap(tree);
    // The farm's own boundary is still the map's boundary...
    expect(map.props.initialPolygon).toEqual(RING_A);
    // ...and every DRAWN zone sits on it as a read-only overlay (the undrawn z-a2 has no shape),
    // keeping its list position's colour and letter (z-a3 is C, not B).
    const overlays = map.props.readOnlyOverlays as Array<{ id: string; ring: unknown; color: string; label?: string }>;
    expect(overlays).toEqual(expectedOverlays(FARM_1_ZONES));
    expect(overlays.map((o) => o.id)).toEqual(['zone-z-a1', 'zone-z-a3']);
    expect(overlays[0]!.ring).toEqual(ZONE_RING_A1);
    expect(overlays[1]!.color).toBe(zoneColorFor(2));
    expect(overlays[1]!.label).toBe(zoneLetterFor(2));
    // The Zones tile counts the zones actually loaded for this farm.
    expect(metric(tree, 'zones')).toBe('3');
  });

  it("FMB Sketch: switching farm replaces the overlays with the new farm's zones", async () => {
    const tree = await mount();
    await press(tree, 'fmb-sketch-farm-row-farm-2');

    expect(farmsApi.getPlots.mock.calls.map((c) => c[0])).toEqual(['farm-1', 'farm-2']);
    expect(mainMap(tree).props.initialPolygon).toEqual(RING_B);
    expect(mainMap(tree).props.readOnlyOverlays).toEqual(expectedOverlays(FARM_2_ZONES));
    expect(metric(tree, 'zones')).toBe('1');
  });

  it("FMB Sketch: shows no overlays while a farm's zones load, and ignores a stale slower response", async () => {
    const farm1 = deferred<Plot[]>();
    const farm2 = deferred<Plot[]>();
    farmsApi.getPlots.mockImplementation((farmId: string) => (farmId === 'farm-1' ? farm1.promise : farm2.promise));

    const tree = await mount();
    expect(mainMap(tree).props.readOnlyOverlays).toEqual([]);

    await press(tree, 'fmb-sketch-farm-row-farm-2');
    expect(mainMap(tree).props.readOnlyOverlays).toEqual([]);

    await act(async () => {
      farm2.resolve(FARM_2_ZONES);
    });
    await flush();
    expect(mainMap(tree).props.readOnlyOverlays).toEqual(expectedOverlays(FARM_2_ZONES));

    // Farm 1's request answers last: it must not land Farm 1's zones on Farm 2's map.
    await act(async () => {
      farm1.resolve(FARM_1_ZONES);
    });
    await flush();
    expect(mainMap(tree).props.readOnlyOverlays).toEqual(expectedOverlays(FARM_2_ZONES));
    expect(metric(tree, 'zones')).toBe('1');
  });

  it('FMB Sketch: a failed zone load draws no overlays and does not block the screen', async () => {
    farmsApi.getPlots.mockRejectedValue(new Error('offline'));
    const tree = await mount();

    expect(mainMap(tree).props.readOnlyOverlays).toEqual([]);
    expect(mainMap(tree).props.initialPolygon).toEqual(RING_A);
    expect(has(tree, 'fmb-sketch-load-error')).toBe(false);
    // The tile falls back to the farm list's own count.
    expect(metric(tree, 'zones')).toBe('2');
    // Still fully usable: another farm can be selected and Edit zones is offered for it.
    await press(tree, 'fmb-sketch-farm-row-farm-2');
    expect(byTestID(tree, 'fmb-sketch-farm-row-farm-2').props.accessibilityState).toEqual({ selected: true });
    expect(has(tree, 'fmb-sketch-edit-zones-farm-2')).toBe(true);
  });

  it('FMB Sketch: zones are hidden while the farm boundary is being drawn or edited, and come back after', async () => {
    const tree = await mount();
    expect(mainMap(tree).props.readOnlyOverlays).toEqual(expectedOverlays(FARM_1_ZONES));

    act(() => {
      mainMap(tree).props.onModeChange('edit');
    });
    expect(mainMap(tree).props.readOnlyOverlays).toEqual([]);
    // The boundary itself is untouched by this.
    expect(mainMap(tree).props.initialPolygon).toEqual(RING_A);

    act(() => {
      mainMap(tree).props.onModeChange('view');
    });
    expect(mainMap(tree).props.readOnlyOverlays).toEqual(expectedOverlays(FARM_1_ZONES));

    act(() => {
      mainMap(tree).props.onModeChange('draw');
    });
    expect(mainMap(tree).props.readOnlyOverlays).toEqual([]);
  });

  it('FMB Sketch: Edit zones is offered on the selected farm only and opens Zones for that farm', async () => {
    const onNavigateToZones = vi.fn();
    const tree = await mount(onNavigateToZones);

    expect(has(tree, 'fmb-sketch-edit-zones-farm-1')).toBe(true);
    expect(has(tree, 'fmb-sketch-edit-zones-farm-2')).toBe(false);
    const button = byTestID(tree, 'fmb-sketch-edit-zones-farm-1');
    expect(button.props.accessibilityLabel).toBe(t('farmer.fmb.editZonesA11y', { name: 'Farm 1' }));
    expect(text(tree)).toContain(t('farmer.fmb.editZones'));

    await press(tree, 'fmb-sketch-edit-zones-farm-1');
    expect(onNavigateToZones).toHaveBeenCalledTimes(1);
    expect(onNavigateToZones).toHaveBeenCalledWith('farm-1');

    await press(tree, 'fmb-sketch-farm-row-farm-2');
    expect(has(tree, 'fmb-sketch-edit-zones-farm-1')).toBe(false);
    await press(tree, 'fmb-sketch-edit-zones-farm-2');
    expect(onNavigateToZones).toHaveBeenLastCalledWith('farm-2');
  });

  it('FMB Sketch: Edit zones asks before dropping an unsaved boundary drawing', async () => {
    const onNavigateToZones = vi.fn();
    const tree = await mount(onNavigateToZones);
    const edited: [number, number][] = [[76.69, 11.4], [76.7, 11.4], [76.695, 11.41], [76.69, 11.4]];
    act(() => {
      mainMap(tree).props.onPolygonChange(edited);
    });

    await press(tree, 'fmb-sketch-edit-zones-farm-1');
    expect(alertMock).toHaveBeenCalledTimes(1);
    expect(onNavigateToZones).not.toHaveBeenCalled();

    const buttons = alertMock.mock.calls[0]![2] as Array<{ text: string; onPress?: () => void }>;
    await act(async () => {
      buttons.find((b) => b.text === t('farmer.fmb.discardConfirm'))!.onPress!();
    });
    expect(onNavigateToZones).toHaveBeenCalledWith('farm-1');
  });

  it('FMB Sketch: with no farm there is no Edit zones button, no zone load and no overlay', async () => {
    farmsApi.getFarms.mockResolvedValue([]);
    const tree = await mount();

    expect(has(tree, 'fmb-sketch-no-farms')).toBe(true);
    const editZones = tree.root.findAll(
      (n) => typeof n.props.testID === 'string' && n.props.testID.startsWith('fmb-sketch-edit-zones'),
    );
    expect(editZones).toHaveLength(0);
    expect(farmsApi.getPlots).not.toHaveBeenCalled();
    expect(mainMap(tree).props.readOnlyOverlays).toEqual([]);
  });
});
