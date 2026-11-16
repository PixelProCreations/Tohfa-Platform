/**
 * Markup & pricing breakdown screen (Market & Pricing phase 2B). The owner has
 * not defined the markup formula (decision D5), so only what a RetailPrice
 * carries is real: retail price, ceiling and markupPct. Everything else the
 * design draws (farmer purchase price, freight / loading / unloading, customer
 * discount, final customer price, the demo history) must be the '—'
 * placeholder or an empty state, never the design's numbers.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';
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

import { MarkupPricingBreakdownScreen } from '../screens/dashboard/MarkupPricingBreakdownScreen';
import { compareToCeiling } from '../api/pricingMappers';
import { makeCan } from '../permissions/can';
import { en } from '../i18n';

const DASH = en['pricingRetail.noValue'];
const RETAIL_VIEW = 'pricing.retail_price.view';
const FAIR_VIEW = 'pricing.fair_price.view';
const viewer = makeCan([RETAIL_VIEW, FAIR_VIEW]);

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

function textOf(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(textOf);
  return (node.children ?? []).flatMap(textOf);
}

async function render(element: React.ReactElement): Promise<string[]> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(element);
  });
  return textOf(tree.toJSON());
}

beforeEach(() => {
  for (const fn of Object.values(hooks)) fn.mockReset();
});

describe('markup breakdown: real values only', () => {
  it('shows retail, ceiling and markupPct from the row', async () => {
    const text = (await render(<MarkupPricingBreakdownScreen can={viewer} row={row()} />)).join('\n');
    expect(text).toContain('Kohlrabi');
    expect(text).toContain('₹41.50');
    expect(text).toContain('₹44');
    expect(text).toContain('12.5');
    expect(text).toContain(en['pricingRetail.markup.validation.within']);
  });

  it('every field without a source is the placeholder and no design number appears', async () => {
    const lines = await render(<MarkupPricingBreakdownScreen can={viewer} row={row()} />);
    const text = lines.join('\n');
    for (const fixture of ['₹42.00', '₹80.00', '₹98.00', '₹93.00', '₹5.00', '₹2.00', '₹3.00', '10%', 'Demo', 'Tomato', 'Carrot', '₹52.00']) {
      expect(text).not.toContain(fixture);
    }
    // purchase price x2, cost components, expenses, freight, loading, unloading, discount, final price
    expect(lines.filter((l) => l === DASH).length).toBeGreaterThanOrEqual(9);
    expect(text).toContain(en['pricingRetail.markup.history.empty']);
  });

  it('BR-09: a retail price above its ceiling is shown as above (display only)', async () => {
    const text = (await render(<MarkupPricingBreakdownScreen can={viewer} row={row({ retailPrice: '46.00' as Money })} />)).join('\n');
    expect(text).toContain(en['pricingRetail.markup.validation.above']);
  });

  it('without fair_price.view the ceiling and validation are hidden', async () => {
    const text = (await render(<MarkupPricingBreakdownScreen can={makeCan([RETAIL_VIEW])} row={row()} />)).join('\n');
    expect(text).not.toContain('₹44');
    expect(text).not.toContain(en['pricingRetail.markup.validation.within']);
  });

  it('a missing can, or no retail view code, shows the not-available state', async () => {
    expect((await render(<MarkupPricingBreakdownScreen row={row()} />)).join('\n')).toContain(en['pricingRetail.notAvailable.title']);
    expect((await render(<MarkupPricingBreakdownScreen can={makeCan([FAIR_VIEW])} row={row()} />)).join('\n')).toContain(
      en['pricingRetail.notAvailable.title'],
    );
  });

  it('with no row it shows an empty state, not a sample record', async () => {
    const text = (await render(<MarkupPricingBreakdownScreen can={viewer} />)).join('\n');
    expect(text).toContain(en['pricingRetail.markup.noRow.title']);
    expect(text).not.toContain('Tomato');
  });

  it('calls no pricing hook', async () => {
    await render(<MarkupPricingBreakdownScreen can={viewer} row={row()} />);
    for (const fn of Object.values(hooks)) expect(fn).toHaveBeenCalledTimes(0);
  });
});
