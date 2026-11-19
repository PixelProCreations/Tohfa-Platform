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
          />,
        ),
      );
    });

    const texts = tree.root
      .findAllByType('Text' as React.ElementType)
      .map((t) => [t.props.children].flat().join(''));

    expect(texts).toContain('Market & Pricing Overview');
    expect(texts.some((t) => t.includes('pricing records'))).toBe(true);
    expect(texts.some((t) => t.includes('Tomato'))).toBe(true);
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
