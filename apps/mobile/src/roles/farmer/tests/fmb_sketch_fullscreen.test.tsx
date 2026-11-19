/**
 * FMB Sketch's Draw-tab map now carries registration Step 3's map controls (Search pill + overlay,
 * zoom stepper, action pills) plus a full-screen toggle. These tests pin the parts a refactor could
 * quietly break: full screen hides the screen's chrome and brings it back, it does NOT remount the
 * map (which would drop an unfinished drawing), Android back leaves full screen first, and the
 * Search pill opens and closes Step 3's search overlay.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';

const backHandlers = vi.hoisted(() => [] as Array<() => boolean>);

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  BackHandler: {
    addEventListener: (_event: string, handler: () => boolean) => {
      backHandlers.push(handler);
      return {
        remove: () => {
          const index = backHandlers.indexOf(handler);
          if (index >= 0) backHandlers.splice(index, 1);
        },
      };
    },
  },
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
import { t } from '../../../i18n/farmer';

function renderedText(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(renderedText);
  return (node.children ?? []).flatMap(renderedText);
}

let mapMounts = 0;

async function mount(): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(
      <FMBSketchScreen
        onNavigateBack={() => undefined}
        onNavigateToFieldContext={() => undefined}
        onNavigateToZones={() => undefined}
      />,
      {
        // Every mount of the map host element asks for a fresh node; counting them is how the test
        // sees a remount.
        createNodeMock: (element) => {
          if (element.type === 'FarmBoundaryMap') {
            mapMounts += 1;
            return { locateMe: vi.fn(), zoomIn: vi.fn(), zoomOut: vi.fn(), flyTo: vi.fn() };
          }
          return null;
        },
      },
    );
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return tree;
}

function text(tree: renderer.ReactTestRenderer): string {
  return renderedText(tree.toJSON() as ReactTestRendererJSON).join(' ');
}

function press(tree: renderer.ReactTestRenderer, testID: string) {
  const target = tree.root.find((node) => node.props.testID === testID && typeof node.props.onPress === 'function');
  act(() => {
    target.props.onPress();
  });
}

function hasTestID(tree: renderer.ReactTestRenderer, testID: string): boolean {
  return tree.root.findAll((node) => node.props.testID === testID).length > 0;
}

describe('FMB Sketch map: Step 3 controls and full screen', () => {
  beforeEach(() => {
    mapMounts = 0;
    backHandlers.length = 0;
    farmsApi.getFarms.mockResolvedValue([
      { id: 'farm-1', name: 'Hill plot', isPrimary: true, boundary: null, centroidLat: null, centroidLng: null },
    ]);
  });

  it('full screen hides the header, tabs, farm list and footer, and the toggle brings them back', async () => {
    const tree = await mount();
    expect(text(tree)).toContain('FMB Sketch');
    expect(text(tree)).toContain('Save FMB');
    expect(text(tree)).toContain('Hill plot');

    press(tree, 'fmb-sketch-fullscreen-toggle');
    const fullscreen = text(tree);
    expect(fullscreen).not.toContain('FMB Sketch');
    expect(fullscreen).not.toContain('Draw on Map');
    expect(fullscreen).not.toContain('Hill plot');
    expect(fullscreen).not.toContain('Save FMB');
    expect(hasTestID(tree, 'fmb-sketch-farm-boundary-map')).toBe(true);
    const toggle = tree.root.find((node) => node.props.testID === 'fmb-sketch-fullscreen-toggle' && node.props.onPress);
    expect(toggle.props.accessibilityLabel).toBe(t('farmer.map.fullscreenExitA11y'));

    press(tree, 'fmb-sketch-fullscreen-toggle');
    expect(text(tree)).toContain('FMB Sketch');
    expect(text(tree)).toContain('Save FMB');
    expect(text(tree)).toContain('Hill plot');
  });

  it('entering and leaving full screen does not remount the map (an unfinished drawing survives)', async () => {
    const tree = await mount();
    const mountsBefore = mapMounts;
    expect(mountsBefore).toBe(1);

    press(tree, 'fmb-sketch-fullscreen-toggle');
    press(tree, 'fmb-sketch-fullscreen-toggle');
    expect(mapMounts).toBe(mountsBefore);
  });

  it('Android back leaves full screen instead of leaving the screen', async () => {
    const tree = await mount();
    expect(backHandlers).toHaveLength(0);

    press(tree, 'fmb-sketch-fullscreen-toggle');
    expect(backHandlers).toHaveLength(1);

    let handled = false;
    act(() => {
      handled = backHandlers[backHandlers.length - 1]!();
    });
    expect(handled).toBe(true);
    expect(text(tree)).toContain('FMB Sketch');
    expect(backHandlers).toHaveLength(0);
  });

  it('the Search pill opens the Step 3 search overlay, and Cancel closes it', async () => {
    const tree = await mount();
    expect(hasTestID(tree, 'map-search-input')).toBe(false);
    expect(text(tree)).toContain(t('farmer.map.search'));

    press(tree, 'fmb-sketch-search-open');
    expect(hasTestID(tree, 'map-search-input')).toBe(true);
    // The overlay takes the top of the map, as on Step 3: the pills are hidden while it is open.
    expect(hasTestID(tree, 'fmb-sketch-search-open')).toBe(false);

    press(tree, 'map-search-cancel');
    expect(hasTestID(tree, 'map-search-input')).toBe(false);
    expect(hasTestID(tree, 'fmb-sketch-search-open')).toBe(true);
  });
});
