/**
 * Categories & Grades screen (Market & Pricing phase 2B). Grades are the fixed
 * pricing enum (GRADE_1/2/3/REJECT) with i18n labels; categories, grade
 * descriptions, products and counts have no backend (owner decision D6 open),
 * so they render as an empty state or the '—' placeholder, never the
 * design's fixtures.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance, type ReactTestRendererJSON } from 'react-test-renderer';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  BackHandler: { addEventListener: () => ({ remove: () => undefined }) },
  Modal: 'Modal',
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj['ios'] ?? obj['default'] },
  Pressable: 'Pressable',
  RefreshControl: 'RefreshControl',
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Line: 'Line', Path: 'Path', Rect: 'Rect' }));
vi.mock('@tohfa/mobile-ui', () => ({ ScreenStatusBar: 'ScreenStatusBar', SafeAreaView: 'SafeAreaView' }));

const hooks = vi.hoisted(() => ({
  useRetailPriceList: vi.fn(),
  useCreateRetailPrice: vi.fn(),
  useFairPriceList: vi.fn(),
  useFairPriceHistory: vi.fn(),
}));
vi.mock('../api/pricingHooks', () => hooks);

import { CategoriesGradesScreen } from '../screens/dashboard/CategoriesGradesScreen';
import { makeCan } from '../permissions/can';
import { en } from '../i18n';

const FAIR_VIEW = 'pricing.fair_price.view';
const viewer = makeCan([FAIR_VIEW, 'pricing.retail_price.view']);

function textOf(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(textOf);
  return (node.children ?? []).flatMap(textOf);
}

async function mount(element: React.ReactElement): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(element);
  });
  return tree;
}

const allText = (tree: renderer.ReactTestRenderer) => textOf(tree.toJSON()).join('\n');

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

beforeEach(() => {
  for (const fn of Object.values(hooks)) fn.mockReset();
});

const FIXTURES = ['Vegetables', 'Fruits', 'Spices', 'CAT-01', 'GR-1', 'Premium quality', 'Standard quality', 'Tomato', 'Pricing records 6', 'Apple'];

describe('categories & grades', () => {
  it('opens on categories with an empty state and no fixture category', async () => {
    const tree = await mount(<CategoriesGradesScreen can={viewer} />);
    const text = allText(tree);
    expect(text).toContain(en['pricingRetail.categories.empty.title']);
    for (const f of FIXTURES) expect(text).not.toContain(f);
  });

  it('the Grades tab lists the fixed grade enum with i18n labels and placeholders', async () => {
    const tree = await mount(<CategoriesGradesScreen can={viewer} />);
    await press(tree, 'pricingCategories.tab.grades');
    const text = allText(tree);
    for (const g of ['GRADE_1', 'GRADE_2', 'GRADE_3', 'REJECT'] as const) {
      expect(text).toContain(en[`pricingRetail.grade.${g}`]);
      expect(byTestId(tree, `pricingCategories.grade.${g}`)).toHaveLength(1);
    }
    expect(text).toContain(en['pricingRetail.noValue']);
    for (const f of FIXTURES) expect(text).not.toContain(f);
  });

  it('a grade detail sheet shows the label and placeholders only', async () => {
    const tree = await mount(<CategoriesGradesScreen can={viewer} />);
    await press(tree, 'pricingCategories.tab.grades');
    await press(tree, 'pricingCategories.grade.GRADE_1');
    const text = allText(tree);
    expect(text).toContain(en['pricingRetail.categories.sheet.meaning']);
    expect(text).not.toContain('Quality criteria are not defined');
  });

  it('search narrows the grades', async () => {
    const tree = await mount(<CategoriesGradesScreen can={viewer} />);
    await press(tree, 'pricingCategories.tab.grades');
    const [input] = byTestId(tree, 'pricingCategories.search');
    await act(async () => {
      (input!.props.onChangeText as (v: string) => void)('reject');
    });
    expect(byTestId(tree, 'pricingCategories.grade.REJECT')).toHaveLength(1);
    expect(byTestId(tree, 'pricingCategories.grade.GRADE_1')).toHaveLength(0);
  });

  it('a missing can, or no fair_price.view, shows not-available', async () => {
    expect(allText(await mount(<CategoriesGradesScreen />))).toContain(en['pricingRetail.notAvailable.title']);
    expect(allText(await mount(<CategoriesGradesScreen can={makeCan(['pricing.retail_price.view'])} />))).toContain(
      en['pricingRetail.notAvailable.title'],
    );
  });

  it('calls no pricing hook', async () => {
    await mount(<CategoriesGradesScreen can={viewer} />);
    for (const fn of Object.values(hooks)) expect(fn).toHaveBeenCalledTimes(0);
  });
});
