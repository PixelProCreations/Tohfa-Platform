/**
 * Retail pricing screen (Market & Pricing phase 2B), rendered with
 * react-test-renderer against mocked pricing hooks (the hooks are covered by
 * api_pricing / mappers_pricing / queryKeys_pricing). Pins: live rows only
 * (never the design's fixtures), loading / empty / error, no request and a
 * neutral state without pricing.retail_price.view, a missing `can` denying,
 * the Edit control and drawer ONLY behind pricing.retail_price.set (owner:
 * only Super Admin sets the price), the drawer's live BR-09 check against the
 * row's real ceiling, and Save staying disabled without ever touching
 * useCreateRetailPrice (effectiveFrom rule not decided by the owner).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance, type ReactTestRendererJSON } from 'react-test-renderer';
import type { Money } from '@tohfa/shared-types';
import type { RetailPriceRowView } from '../api/pricingTypes';

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

import { RetailPricingScreen } from '../screens/dashboard/RetailPricingScreen';
import { compareToCeiling } from '../api/pricingMappers';
import { makeCan, type Can } from '../permissions/can';
import { en } from '../i18n';

// ─── Data ────────────────────────────────────────────────────────────────────

function row(over: Partial<RetailPriceRowView> = {}): RetailPriceRowView {
  const retailPrice = ('retailPrice' in over ? over.retailPrice : '41.50') as Money | null;
  const ceilingPrice = ('ceilingPrice' in over ? over.ceilingPrice : '44.00') as Money | null;
  return {
    id: 'rp-1',
    cropId: 'crop-1',
    cropName: 'Kohlrabi',
    grade: 'GRADE_2',
    markupPct: 12.5,
    gstInclusive: true,
    effectiveFrom: '2026-11-02',
    effectiveTo: null,
    category: null,
    reviewStatus: null,
    actionNote: null,
    ...over,
    retailPrice,
    ceilingPrice,
    ceilingComparison: compareToCeiling(retailPrice, ceilingPrice),
  };
}

function cursorList(over: { items?: RetailPriceRowView[]; hasMore?: boolean; isLoading?: boolean; error?: unknown } = {}) {
  return {
    items: over.items ?? [],
    firstPage: undefined,
    loadMore: vi.fn(),
    hasMore: over.hasMore ?? false,
    isLoading: over.isLoading ?? false,
    error: over.error ?? null,
    refresh: vi.fn(),
    isRefreshing: false,
  };
}

const RETAIL_VIEW = 'pricing.retail_price.view';
const FAIR_VIEW = 'pricing.fair_price.view';
const RETAIL_SET = 'pricing.retail_price.set';
/** Tohfa / Farmer Admin / Main WH / Sub WH: view codes only. */
const viewer: Can = makeCan([RETAIL_VIEW, FAIR_VIEW]);
/** Super Admin: the only holder of pricing.retail_price.set. */
const setter: Can = makeCan([RETAIL_VIEW, FAIR_VIEW, RETAIL_SET]);

// ─── Rendering helpers ───────────────────────────────────────────────────────

function textOf(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(textOf);
  return (node.children ?? []).flatMap(textOf);
}

const allText = (tree: renderer.ReactTestRenderer) => textOf(tree.toJSON()).join('\n');

async function mount(element: React.ReactElement): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(element);
  });
  return tree;
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

async function type(tree: renderer.ReactTestRenderer, id: string, value: string): Promise<void> {
  const [node] = byTestId(tree, id);
  expect(node, `no input with testID ${id}`).toBeDefined();
  await act(async () => {
    (node!.props.onChangeText as (v: string) => void)(value);
  });
}

function retailListEnabled(): boolean[] {
  return hooks.useRetailPriceList.mock.calls.map((c) => (c[2] as { enabled?: boolean } | undefined)?.enabled === true);
}

beforeEach(() => {
  for (const fn of Object.values(hooks)) fn.mockReset();
  hooks.useRetailPriceList.mockReturnValue(cursorList());
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('retail pricing: live rows and async states', () => {
  it('renders the rows the hook returns and none of the design fixtures', async () => {
    hooks.useRetailPriceList.mockReturnValue(
      cursorList({ items: [row(), row({ id: 'rp-2', cropName: 'Turnip', grade: 'GRADE_1', retailPrice: '30.00' as Money })] }),
    );
    const tree = await mount(<RetailPricingScreen can={viewer} />);
    const text = allText(tree);
    expect(text).toContain('Kohlrabi');
    expect(text).toContain('Turnip');
    expect(text).toContain('₹41.50');
    for (const fixture of ['Tomato', 'Carrot', 'Garlic', 'Beans', 'Priya Nair', '₹60.00', 'Action required', 'No retail price', 'Review needed']) {
      expect(text).not.toContain(fixture);
    }
  });

  it('shows the loading, error and empty states', async () => {
    hooks.useRetailPriceList.mockReturnValue(cursorList({ isLoading: true }));
    expect(allText(await mount(<RetailPricingScreen can={viewer} />))).toContain(en['async.loading']);

    hooks.useRetailPriceList.mockReturnValue(cursorList({ error: new Error('boom') }));
    expect(allText(await mount(<RetailPricingScreen can={viewer} />))).toContain(en['async.error.title']);

    hooks.useRetailPriceList.mockReturnValue(cursorList());
    expect(allText(await mount(<RetailPricingScreen can={viewer} />))).toContain(en['pricingRetail.empty.title']);
  });

  it('pages with Load more', async () => {
    const list = cursorList({ items: [row()], hasMore: true });
    hooks.useRetailPriceList.mockReturnValue(list);
    const tree = await mount(<RetailPricingScreen can={viewer} />);
    await press(tree, 'pricingRetail.loadMore');
    expect(list.loadMore).toHaveBeenCalledTimes(1);
  });

  it('fetches with enabled=true for a reader', async () => {
    await mount(<RetailPricingScreen can={viewer} />);
    expect(retailListEnabled().every(Boolean)).toBe(true);
    expect(retailListEnabled().length).toBeGreaterThan(0);
  });

  it('a tapped row opens the breakdown with the live row', async () => {
    hooks.useRetailPriceList.mockReturnValue(cursorList({ items: [row()] }));
    const onSelectBreakdown = vi.fn();
    const tree = await mount(<RetailPricingScreen can={viewer} onSelectBreakdown={onSelectBreakdown} />);
    await press(tree, 'pricingRetail.card.rp-1');
    expect(onSelectBreakdown).toHaveBeenCalledWith(expect.objectContaining({ id: 'rp-1', cropName: 'Kohlrabi' }));
  });

  it('the grade filter is sent to the hook', async () => {
    const tree = await mount(<RetailPricingScreen can={viewer} />);
    await press(tree, 'pricingRetail.filter');
    await press(tree, 'pricingRetail.filter.gradeBox');
    await press(tree, 'pricingRetail.filter.grade.GRADE_3');
    await press(tree, 'pricingRetail.filter.apply');
    const calls = hooks.useRetailPriceList.mock.calls;
    expect(calls[calls.length - 1]![1]).toEqual({ grade: 'GRADE_3' });
  });
});

describe('retail pricing: permission codes, fail closed', () => {
  it('without pricing.retail_price.view: not-available state and no request', async () => {
    const tree = await mount(<RetailPricingScreen can={makeCan([FAIR_VIEW])} />);
    expect(allText(tree)).toContain(en['pricingRetail.notAvailable.title']);
    expect(retailListEnabled().some(Boolean)).toBe(false);
  });

  it('a missing can denies (no request, not-available)', async () => {
    const tree = await mount(<RetailPricingScreen />);
    expect(allText(tree)).toContain(en['pricingRetail.notAvailable.title']);
    expect(retailListEnabled().some(Boolean)).toBe(false);
  });

  it('a Tohfa-like caller with view codes only sees no Edit control and no drawer', async () => {
    hooks.useRetailPriceList.mockReturnValue(cursorList({ items: [row()] }));
    const tree = await mount(<RetailPricingScreen can={viewer} />);
    expect(byTestId(tree, 'pricingRetail.edit.rp-1')).toHaveLength(0);
    expect(byTestId(tree, 'pricingRetail.drawer')).toHaveLength(0);
    expect(allText(tree)).not.toContain(en['pricingRetail.edit.button']);
  });

  it('pricing.retail_price.set shows Edit, which opens the drawer for that row', async () => {
    hooks.useRetailPriceList.mockReturnValue(cursorList({ items: [row()] }));
    const tree = await mount(<RetailPricingScreen can={setter} />);
    expect(byTestId(tree, 'pricingRetail.edit.rp-1')).toHaveLength(1);
    expect(byTestId(tree, 'pricingRetail.drawer')).toHaveLength(0);
    await press(tree, 'pricingRetail.edit.rp-1');
    expect(byTestId(tree, 'pricingRetail.drawer')).toHaveLength(1);
  });

  it('without fair_price.view the ceiling is not shown on the card', async () => {
    hooks.useRetailPriceList.mockReturnValue(cursorList({ items: [row()] }));
    const tree = await mount(<RetailPricingScreen can={makeCan([RETAIL_VIEW])} />);
    expect(allText(tree)).not.toContain('₹44');
    expect(allText(tree)).not.toContain(en['pricingRetail.badge.within']);
  });
});

describe('retail edit drawer (DESIGN-ONLY save)', () => {
  async function openDrawer(r: RetailPriceRowView) {
    hooks.useRetailPriceList.mockReturnValue(cursorList({ items: [r] }));
    const tree = await mount(<RetailPricingScreen can={setter} />);
    await press(tree, `pricingRetail.edit.${r.id}`);
    return tree;
  }

  it('BR-09: a typed price above the row ceiling is flagged above', async () => {
    const tree = await openDrawer(row());
    await type(tree, 'pricingRetail.drawer.input', '45');
    expect(allText(tree)).toContain(en['pricingRetail.drawer.status.above']);
  });

  it('BR-09: "0.10" against the real ceiling "0.30" is within (paise, not floats)', async () => {
    const tree = await openDrawer(row({ retailPrice: '0.20' as Money, ceilingPrice: '0.30' as Money }));
    await type(tree, 'pricingRetail.drawer.input', '0.10');
    const text = allText(tree);
    expect(text).toContain(en['pricingRetail.drawer.status.within']);
    expect(text).toContain('₹0.20');
  });

  it('starts empty, not with the design value 58.00', async () => {
    const tree = await openDrawer(row());
    const [input] = byTestId(tree, 'pricingRetail.drawer.input');
    expect(input!.props.value).toBe('');
    expect(allText(tree)).not.toContain('58.00');
  });

  it('Save is visible but disabled, explains why, and never calls useCreateRetailPrice', async () => {
    const tree = await openDrawer(row());
    await type(tree, 'pricingRetail.drawer.input', '40');
    const [save] = byTestId(tree, 'pricingRetail.drawer.save');
    expect(save).toBeDefined();
    expect(save!.props.disabled).toBe(true);
    expect(save!.props.onPress).toBeUndefined();
    expect(allText(tree)).toContain(en['pricingRetail.drawer.saveUnavailable']);
    expect(hooks.useCreateRetailPrice).toHaveBeenCalledTimes(0);
  });
});
