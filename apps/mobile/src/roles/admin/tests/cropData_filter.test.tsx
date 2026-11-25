/**
 * Crop Data: the category filter lives in the search bar's filter button (a
 * bottom sheet), not in a chip row on the page. Rendered with
 * react-test-renderer against mocked produce hooks. Pins: the button is a real
 * accessible button that opens the sheet; options are the FETCHED categories
 * (a category with no design label shows its own name); choosing a category
 * filters the list; Reset returns to All; the active filter stays visible
 * without opening the sheet; the loading / empty states are untouched.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance, type ReactTestRendererJSON } from 'react-test-renderer';

vi.mock('react-native', async () => {
  const R = await import('react');
  return {
    Alert: { alert: () => undefined },
    // A real Modal renders nothing while hidden; mirror that so "opens the sheet" is observable.
    Modal: ({ visible, children, testID }: { visible?: boolean; children?: React.ReactNode; testID?: string }) =>
      visible ? R.createElement('Modal', { visible, testID }, children) : null,
    Pressable: 'Pressable',
    SafeAreaView: 'SafeAreaView',
    ScrollView: 'ScrollView',
    StatusBar: 'StatusBar',
    StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s },
    Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj['ios'] ?? obj['default'] },
    Dimensions: { get: () => ({ width: 360, height: 800 }) },
    Text: 'Text',
    TextInput: 'TextInput',
    TouchableOpacity: 'TouchableOpacity',
    View: 'View',
  };
});
vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Ellipse: 'Ellipse',
  Line: 'Line',
  Path: 'Path',
  Rect: 'Rect',
}));
vi.mock('@tohfa/mobile-ui', () => ({ ScreenStatusBar: 'ScreenStatusBar', SafeAreaView: 'SafeAreaView' }));

const hooks = vi.hoisted(() => ({
  useCatalogCategories: vi.fn(),
  useCreateCropMaster: vi.fn(),
  useCropMasterList: vi.fn(),
  useDeletePlatformEvent: vi.fn(),
  usePlatformEventList: vi.fn(),
  useUpdateCropMaster: vi.fn(),
}));
vi.mock('../api/produceHooks', () => hooks);

import { CropDataScreen } from '../screens/produce/CropDataScreen';
import { makeCan } from '../permissions/can';
import { en } from '../i18n';

const can = makeCan(['admin.crop_taxonomy.manage']);
const mutation = { mutate: vi.fn(), isPending: false };

function crop(id: string, name: string, categoryId: string) {
  return {
    id,
    slug: name.toLowerCase(),
    name,
    nameTa: null,
    categoryId,
    botanicalName: null,
    defaultUnit: 'kg',
    seasonMonths: null,
    shelfLifeDays: null,
    iconKey: null,
    isActive: true,
  };
}

const CROPS = [crop('k-1', 'Tomato', 'c-veg'), crop('k-2', 'Mango', 'c-fruit'), crop('k-3', 'Lentil', 'c-pulse')];
// No 'spices' category on purpose: the sheet must not invent one. 'Pulses' has no design label.
const CATEGORIES = [
  { id: 'c-veg', name: 'Vegetables', slug: 'vegetables' },
  { id: 'c-fruit', name: 'Fruits', slug: 'fruits' },
  { id: 'c-pulse', name: 'Pulses', slug: 'pulses' },
];

function textOf(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(textOf);
  return (node.children ?? []).flatMap(textOf);
}
const allText = (tree: renderer.ReactTestRenderer) => textOf(tree.toJSON()).join('\n');

function instanceText(node: ReactTestInstance): string {
  return node
    .findAll((n) => (n.type as unknown) === 'Text')
    .flatMap((n) => n.children.filter((c): c is string => typeof c === 'string'))
    .join('\n');
}

function byTestId(tree: renderer.ReactTestRenderer, id: string): ReactTestInstance[] {
  return tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === id);
}
async function press(tree: renderer.ReactTestRenderer, id: string): Promise<void> {
  const [node] = byTestId(tree, id);
  expect(node, `no pressable with testID ${id}`).toBeDefined();
  await act(async () => {
    (node!.props.onPress as () => void)();
  });
}
async function mount(): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(
      <CropDataScreen
        can={can}
        onBack={() => undefined}
        onNavigateToAddActivity={() => undefined}
        onNavigateToCreateEvent={() => undefined}
      />,
    );
  });
  return tree;
}

const FILTER_BUTTON = 'cropData.filterButton';
const SHEET = 'cropData.filterSheet';

beforeEach(() => {
  hooks.useCropMasterList.mockReturnValue({ data: { items: CROPS, total: 3 }, isLoading: false, isError: false });
  hooks.useCatalogCategories.mockReturnValue({ data: { items: CATEGORIES }, isLoading: false, isError: false });
  hooks.usePlatformEventList.mockReturnValue({ data: undefined, isLoading: false, isError: false });
  hooks.useUpdateCropMaster.mockReturnValue(mutation);
  hooks.useCreateCropMaster.mockReturnValue(mutation);
  hooks.useDeletePlatformEvent.mockReturnValue(mutation);
});

describe('Crop Data category filter', () => {
  it('no longer draws the static category chip row on the page', async () => {
    const tree = await mount();
    // A chip is a Text holding just its label; a crop row's subtitle joins several strings.
    const standalone = tree.root
      .findAll((n) => (n.type as unknown) === 'Text')
      .map((n) => n.children.join(''));
    for (const label of [
      en['produce.filters.all'],
      en['produce.category.Vegetable'],
      en['produce.category.Fruit'],
      en['produce.category.Spice'],
    ]) {
      expect(standalone).not.toContain(label);
    }
    expect(byTestId(tree, SHEET)).toHaveLength(0);
  });

  it('the filter icon is an accessible button that opens the filter sheet', async () => {
    const tree = await mount();
    const [button] = byTestId(tree, FILTER_BUTTON);
    expect(button).toBeDefined();
    expect(button!.props.accessibilityRole).toBe('button');
    expect(button!.props.accessibilityLabel).toBe(en['produce.cropData.filter.button']);
    expect(byTestId(tree, SHEET)).toHaveLength(0);
    await press(tree, FILTER_BUTTON);
    expect(byTestId(tree, SHEET)).toHaveLength(1);
  });

  it('options come from the fetched categories: all of them, a name for one with no design label, none invented', async () => {
    const tree = await mount();
    await press(tree, FILTER_BUTTON);
    expect(byTestId(tree, 'cropData.categoryChip.c-veg')).toHaveLength(1);
    expect(byTestId(tree, 'cropData.categoryChip.c-fruit')).toHaveLength(1);
    expect(byTestId(tree, 'cropData.categoryChip.c-pulse')).toHaveLength(1);
    const sheetText = instanceText(byTestId(tree, SHEET)[0]!);
    expect(sheetText).toContain('Pulses');
    expect(sheetText).toContain(en['produce.category.Fruit']);
    expect(sheetText).not.toContain(en['produce.category.Spice']);
  });

  it('choosing a category filters the list and closes back to the page', async () => {
    const tree = await mount();
    expect(allText(tree)).toContain('tomato');
    await press(tree, FILTER_BUTTON);
    await press(tree, 'cropData.categoryChip.c-fruit');
    await press(tree, 'cropData.filterApply');
    expect(byTestId(tree, SHEET)).toHaveLength(0);
    const text = allText(tree);
    expect(text).toContain('mango');
    expect(text).not.toContain('tomato');
    expect(text).not.toContain('lentil');
  });

  it('the active filter is visible on the page without opening the sheet', async () => {
    const tree = await mount();
    expect(byTestId(tree, 'cropData.activeFilter')).toHaveLength(0);
    await press(tree, FILTER_BUTTON);
    await press(tree, 'cropData.categoryChip.c-fruit');
    await press(tree, 'cropData.filterApply');
    const [summary] = byTestId(tree, 'cropData.activeFilter');
    expect(summary).toBeDefined();
    expect(instanceText(summary!)).toContain(en['produce.category.Fruit']);
    expect(byTestId(tree, FILTER_BUTTON)[0]!.props.accessibilityState).toEqual({ selected: true });
  });

  it('Reset clears the category back to All', async () => {
    const tree = await mount();
    await press(tree, FILTER_BUTTON);
    await press(tree, 'cropData.categoryChip.c-fruit');
    await press(tree, 'cropData.filterReset');
    expect(byTestId(tree, SHEET)).toHaveLength(0);
    expect(byTestId(tree, 'cropData.activeFilter')).toHaveLength(0);
    const text = allText(tree);
    expect(text).toContain('tomato');
    expect(text).toContain('mango');
    expect(text).toContain('lentil');
  });

  it('while the categories load the sheet offers only All and says so; the crop list still renders', async () => {
    hooks.useCatalogCategories.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const tree = await mount();
    expect(allText(tree)).toContain('tomato');
    await press(tree, FILTER_BUTTON);
    expect(allText(tree)).toContain(en['produce.cropData.filter.loading']);
    expect(byTestId(tree, 'cropData.categoryChip.c-veg')).toHaveLength(0);
    expect(byTestId(tree, 'cropData.categoryChip.all')).toHaveLength(1);
  });

  it('when the categories fail to load the sheet says so instead of showing a made-up list', async () => {
    hooks.useCatalogCategories.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    const tree = await mount();
    await press(tree, FILTER_BUTTON);
    expect(allText(tree)).toContain(en['produce.cropData.filter.unavailable']);
    expect(byTestId(tree, 'cropData.categoryChip.c-veg')).toHaveLength(0);
  });
});
