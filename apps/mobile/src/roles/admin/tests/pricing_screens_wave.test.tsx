/**
 * Unit tests for the Market & Pricing screens:
 *   1. MarketPricingOverviewScreen
 *   2. EditRetailPriceScreen
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { makeCan } from '../permissions/can';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: vi.fn() },
  Modal: 'Modal',
  Platform: { OS: 'android', select: (o: Record<string, unknown>) => o['android'] ?? o['default'] },
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, absoluteFill: {}, absoluteFillObject: {} },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));

vi.mock('@tohfa/mobile-ui', () => ({
  ScreenStatusBar: 'ScreenStatusBar',
}));

vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Line: 'Line',
  Path: 'Path',
}));

const mockApi = vi.hoisted(() => ({
  listRetailPrices: vi.fn(),
  createRetailPrice: vi.fn(),
}));

vi.mock('../api/pricing', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    listRetailPrices: mockApi.listRetailPrices,
    createRetailPrice: mockApi.createRetailPrice,
  };
});

import {
  MarketPricingOverviewScreen,
  EditRetailPriceScreen,
  type PricingRecordItem,
} from '../screens/pricing';

/**
 * Records a caller hands the screen explicitly (the `records` prop). This is
 * the screen's one legitimate injection point; it is NOT a stand-in for a
 * server result. The screen used to fall back to a fabricated
 * INITIAL_PRICING_RECORDS list whenever the live query came back empty, and
 * these tests asserted that fabrication ("Tomato"), so they were asserting a
 * bug. They now pass the rows in, and `renders the real empty state…` below
 * pins what an empty server result actually does.
 */
const suppliedRecords: PricingRecordItem[] = [
  {
    id: 'rec-1',
    cropId: 'crop-okra',
    product: 'Okra Live',
    grade: 'Grade 1',
    category: 'Vegetables',
    badge: 'Compliant',
    ceiling: '₹61.25/kg',
    retailPrice: '₹58.00/kg',
    difference: 'Difference ₹3.25 below',
    updatedAt: '2026-11-02 00:00',
    pricingUnit: '₹/kg',
  },
];

function withQuery(ui: React.ReactElement): React.ReactElement {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

describe('MarketPricingOverviewScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header, title, search input, count, and records list', () => {
    const can = makeCan(['pricing.retail_price.view', 'pricing.fair_price.view']);
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        withQuery(
          <MarketPricingOverviewScreen
            can={can}
            onBack={vi.fn()}
            onEditRetailPrice={vi.fn()}
            onViewBreakdown={vi.fn()}
            records={suppliedRecords}
          />,
        ),
      );
    });

    const texts = tree.root
      .findAllByType('Text' as React.ElementType)
      .map((t) => [t.props.children].flat().join(''));

    expect(texts).toContain('Market & Pricing Overview');
    expect(texts.some((t) => t.includes('pricing records'))).toBe(true);
    // The supplied record, not a fixture. Before this change the assertion
    // read `expect(texts.some((t) => t.includes('Tomato'))).toBe(true)`, which
    // only passed because the screen fabricated five records when the query
    // returned nothing.
    expect(texts.some((t) => t.includes('Okra Live'))).toBe(true);
    expect(texts.some((t) => t.includes('Tomato'))).toBe(false);
  });

  it('allows clicking Edit Retail Price when holding pricing.retail_price.set', () => {
    const can = makeCan(['pricing.retail_price.view', 'pricing.retail_price.set']);
    const onEditRetailPrice = vi.fn();
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        withQuery(
          <MarketPricingOverviewScreen
            can={can}
            onBack={vi.fn()}
            onEditRetailPrice={onEditRetailPrice}
            onViewBreakdown={vi.fn()}
            records={suppliedRecords}
          />,
        ),
      );
    });

    const touchables = tree.root.findAllByType('TouchableOpacity' as React.ElementType);
    const editBtn = touchables.find((t) => {
      const childTexts = t.findAllByType('Text' as React.ElementType).map((c) => [c.props.children].flat().join(''));
      return childTexts.includes('Edit Retail Price');
    });

    expect(editBtn?.props.disabled).toBe(false);
    act(() => {
      editBtn?.props.onPress();
    });
    expect(onEditRetailPrice).toHaveBeenCalled();
  });

  it('disables Edit Retail Price when lacking pricing.retail_price.set', () => {
    const can = makeCan(['pricing.retail_price.view']); // no .set
    const onEditRetailPrice = vi.fn();
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        withQuery(
          <MarketPricingOverviewScreen
            can={can}
            onBack={vi.fn()}
            onEditRetailPrice={onEditRetailPrice}
            onViewBreakdown={vi.fn()}
            records={suppliedRecords}
          />,
        ),
      );
    });

    const touchables = tree.root.findAllByType('TouchableOpacity' as React.ElementType);
    const editBtn = touchables.find((t) => {
      const childTexts = t.findAllByType('Text' as React.ElementType).map((c) => [c.props.children].flat().join(''));
      return childTexts.includes('Edit Retail Price');
    });

    expect(editBtn?.props.disabled).toBe(true);
  });

  it('opens details modal when View Details is pressed', () => {
    const can = makeCan(['pricing.retail_price.view']);
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        withQuery(
          <MarketPricingOverviewScreen
            can={can}
            onBack={vi.fn()}
            onEditRetailPrice={vi.fn()}
            onViewBreakdown={vi.fn()}
            records={suppliedRecords}
          />,
        ),
      );
    });

    const touchables = tree.root.findAllByType('TouchableOpacity' as React.ElementType);
    const detailsBtn = touchables.find((t) => {
      const childTexts = t.findAllByType('Text' as React.ElementType).map((c) => [c.props.children].flat().join(''));
      return childTexts.includes('View Details');
    });

    act(() => {
      detailsBtn?.props.onPress();
    });

    const texts = tree.root
      .findAllByType('Text' as React.ElementType)
      .map((t) => [t.props.children].flat().join(''));
    expect(texts).toContain('Pricing details');
  });
});

describe('MarketPricingOverviewScreen: an empty server result is an empty state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the real empty state and NO priced record rows when the server returns nothing', async () => {
    mockApi.listRetailPrices.mockResolvedValue({ items: [], page: { nextCursor: null, hasMore: false } });
    const can = makeCan(['pricing.retail_price.view', 'pricing.retail_price.set']);
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        withQuery(
          <MarketPricingOverviewScreen
            can={can}
            onBack={vi.fn()}
            onEditRetailPrice={vi.fn()}
            onViewBreakdown={vi.fn()}
          />,
        ),
      );
    });

    // Let the resolved query settle before reading the rendered state.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const texts = tree.root
      .findAllByType('Text' as React.ElementType)
      .map((t) => [t.props.children].flat().join(''));

    expect(texts).toContain('No pricing records');
    // Not one row of the fabricated list, and not one row action.
    for (const sample of ['Tomato', 'Beans', 'Cabbage', 'Compliant', 'Action required', 'Over ceiling', 'Ceiling \u20b9']) {
      expect(texts.some((t) => t.includes(sample)), sample).toBe(false);
    }
    expect(texts.some((t) => t.includes('View Details'))).toBe(false);
    expect(texts.some((t) => t.includes('pricing records') && /\d/.test(t))).toBe(false);
  });

  it('shows loading, not "no records", while the request is still in flight', async () => {
    let release: (value: unknown) => void = () => {};
    mockApi.listRetailPrices.mockReturnValue(new Promise((resolve) => { release = resolve; }));
    const can = makeCan(['pricing.retail_price.view']);
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        withQuery(
          <MarketPricingOverviewScreen
            can={can}
            onBack={vi.fn()}
            onEditRetailPrice={vi.fn()}
            onViewBreakdown={vi.fn()}
          />,
        ),
      );
    });

    const texts = tree.root
      .findAllByType('Text' as React.ElementType)
      .map((t) => [t.props.children].flat().join(''));
    expect(texts.some((t) => t.includes('No pricing records'))).toBe(false);
    expect(tree.root.findAllByType('ActivityIndicator' as React.ElementType).length).toBeGreaterThan(0);

    await act(async () => {
      release({ items: [], page: { nextCursor: null, hasMore: false } });
    });
  });
});

describe('EditRetailPriceScreen', () => {
  const sampleRecord: PricingRecordItem = {
    id: 'pr-tomato-1',
    product: 'Tomato',
    grade: 'Grade 1',
    category: 'Vegetables',
    badge: 'Compliant',
    ceiling: '₹60.00/kg',
    retailPrice: '₹55.00/kg',
    difference: 'Difference ₹5.00 below',
    updatedAt: '2026-10-11 10:00',
    pricingUnit: '₹/kg',
  };

  it('renders product details, ceiling, inputs, and comparison card', () => {
    const can = makeCan(['pricing.retail_price.set']);
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        withQuery(
          <EditRetailPriceScreen
            can={can}
            onBack={vi.fn()}
            record={sampleRecord}
          />,
        ),
      );
    });

    const texts = tree.root
      .findAllByType('Text' as React.ElementType)
      .map((t) => [t.props.children].flat().join(''));

    expect(texts).toContain('Edit retail price');
    expect(texts).toContain('Retails price');
    expect(texts).toContain('Tomato');
    expect(texts).toContain('₹60.00/kg');
    expect(texts).toContain('Current retail price');
    expect(texts).toContain('Proposed retail price');
    expect(texts).toContain('Applicable ceiling');
  });

  it('updates live proposed price and difference when typing', () => {
    const can = makeCan(['pricing.retail_price.set']);
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        withQuery(
          <EditRetailPriceScreen
            can={can}
            onBack={vi.fn()}
            record={sampleRecord}
          />,
        ),
      );
    });

    const inputs = tree.root.findAllByType('TextInput' as React.ElementType);
    const priceInput = inputs[0];
    expect(priceInput).toBeDefined();

    act(() => {
      priceInput?.props.onChangeText('50');
    });

    const texts = tree.root
      .findAllByType('Text' as React.ElementType)
      .map((t) => [t.props.children].flat().join(''));

    expect(texts).toContain('₹50.00/kg');
    expect(texts).toContain('₹10.00'); // 60 - 50 = 10
    expect(texts).toContain('Proposed retail price is within the applicable ceiling.');
  });

  it('detects over-ceiling proposed price', () => {
    const can = makeCan(['pricing.retail_price.set']);
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        withQuery(
          <EditRetailPriceScreen
            can={can}
            onBack={vi.fn()}
            record={sampleRecord}
          />,
        ),
      );
    });

    const inputs = tree.root.findAllByType('TextInput' as React.ElementType);
    const priceInput = inputs[0];
    expect(priceInput).toBeDefined();

    act(() => {
      priceInput?.props.onChangeText('75');
    });

    const texts = tree.root
      .findAllByType('Text' as React.ElementType)
      .map((t) => [t.props.children].flat().join(''));

    expect(texts).toContain('₹75.00/kg');
    expect(texts).toContain('-₹15.00');
    expect(texts).toContain('Proposed retail price is above the applicable ceiling.');
  });

  it('disables save button when lacking pricing.retail_price.set', () => {
    const can = makeCan(['pricing.retail_price.view']); // no .set
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        withQuery(
          <EditRetailPriceScreen
            can={can}
            onBack={vi.fn()}
            record={sampleRecord}
          />,
        ),
      );
    });

    const touchables = tree.root.findAllByType('TouchableOpacity' as React.ElementType);
    const saveBtn = touchables.find((t) => {
      const childTexts = t.findAllByType('Text' as React.ElementType).map((c) => [c.props.children].flat().join(''));
      return childTexts.some((c) => c.includes('Save Retail Price'));
    });

    expect(saveBtn?.props.disabled).toBe(true);
  });
});

describe('EditRetailPriceScreen with no record (BR-09a)', () => {
  /*
   * BR-09a: a retail price must be at or below the fair-price ceiling in
   * force. The screen used to fall back to a fabricated Tomato record with a
   * ₹60.00/kg ceiling, and to a 6000-paise ceiling when none could be read,
   * so the admin typed a real price and saw it validated against an invented
   * limit. With no ceiling to check against, the screen must not offer the
   * edit at all.
   */
  it('BR-09a: with no record it presents no ceiling to edit against and Save is disabled', () => {
    const can = makeCan(['pricing.retail_price.set']);
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(withQuery(<EditRetailPriceScreen can={can} onBack={vi.fn()} />));
    });

    const texts = tree.root
      .findAllByType('Text' as React.ElementType)
      .map((t) => [t.props.children].flat().join(''));

    // No invented ceiling, no invented record, and no price form at all.
    expect(texts.some((t) => t.includes('₹60.00'))).toBe(false);
    expect(texts.some((t) => t.includes('Tomato'))).toBe(false);
    expect(texts.some((t) => t.includes('Applicable ceiling'))).toBe(false);
    expect(tree.root.findAllByType('TextInput' as React.ElementType).length).toBe(0);
    expect(texts.some((t) => t.includes('cannot be edited'))).toBe(true);

    const [save] = tree.root.findAll(
      (n) => typeof n.type === 'string' && n.props.testID === 'pricing.editRetail.save',
    );
    expect(save).toBeDefined();
    expect(save?.props.disabled).toBe(true);
    expect(save?.props.onPress).toBeUndefined();
  });

  it('BR-09a: a record whose ceiling cannot be read is treated the same way', () => {
    const can = makeCan(['pricing.retail_price.set']);
    const noCeiling: PricingRecordItem = {
      id: 'rec-no-ceiling',
      product: 'Okra Live',
      grade: 'Grade 1',
      category: 'Vegetables',
      badge: 'No retail price',
      ceiling: '\u2014',
      retailPrice: 'none',
      difference: 'Difference not comparable',
      updatedAt: '\u2014',
      pricingUnit: '₹/kg',
    };
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(withQuery(<EditRetailPriceScreen can={can} onBack={vi.fn()} record={noCeiling} />));
    });

    expect(tree.root.findAllByType('TextInput' as React.ElementType).length).toBe(0);
    const [save] = tree.root.findAll(
      (n) => typeof n.type === 'string' && n.props.testID === 'pricing.editRetail.save',
    );
    expect(save?.props.disabled).toBe(true);
  });
});

describe('Source guards for Market & Pricing screens', () => {
  const targetFiles = [
    'MarketPricingOverviewScreen.tsx',
    'EditRetailPriceScreen.tsx',
  ];

  it('asserts no raw hex literals, numeric fontSize, fontFamily, or role literals', () => {
    const dir = path.resolve(__dirname, '../screens/pricing');

    for (const file of targetFiles) {
      const filePath = path.join(dir, file);
      expect(fs.existsSync(filePath), `File should exist: ${file}`).toBe(true);
      const code = fs.readFileSync(filePath, 'utf8');

      // 1. Raw hex colours (#FFF, #123456)
      const hexMatches = code.match(/#[0-9a-fA-F]{3,8}\b/g);
      expect(
        hexMatches,
        `File ${file} contains raw hex colors: ${hexMatches?.join(', ')}`,
      ).toBeNull();

      // 2. Numeric fontSize
      const fontSizeMatches = code.match(/fontSize:\s*\d+/g);
      expect(
        fontSizeMatches,
        `File ${file} contains numeric fontSize: ${fontSizeMatches?.join(', ')}`,
      ).toBeNull();

      // 3. fontFamily
      const fontFamilyMatches = code.match(/fontFamily:\s*['"][^'"]+['"]/g);
      expect(
        fontFamilyMatches,
        `File ${file} contains fontFamily: ${fontFamilyMatches?.join(', ')}`,
      ).toBeNull();

      // 4. Role literals
      const roleLiterals = [
        'SUPER_ADMIN',
        'TOHFA_ADMIN',
        'FARMER_ADMIN',
        'MAIN_WH_ADMIN',
        'SUB_WH_ADMIN',
      ];
      for (const role of roleLiterals) {
        expect(
          code.includes(`'${role}'`) || code.includes(`"${role}"`),
          `File ${file} should not check or hardcode role literal ${role}`,
        ).toBe(false);
      }
    }
  });
});
