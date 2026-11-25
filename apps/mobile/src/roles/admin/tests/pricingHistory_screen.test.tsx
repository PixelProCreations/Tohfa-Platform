/**
 * Price history screen (Market & Pricing phase 2A) against a mocked
 * useFairPriceHistory. The API has history for ONE crop only (cropId
 * required), so: opened without a crop it shows the neutral "pick a crop"
 * state and never mounts the history hook; opened from a ceiling row it lists
 * that crop's ceiling windows with previous -> new values in paise. The
 * counter-offer section has no backend and is an empty state. Fields the API
 * lacks (changed by, reason, recorded, validation, audit ref) show the dash.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { act } from 'react-test-renderer';
import type { CeilingHistoryRowView } from '../api/pricingTypes';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  BackHandler: { addEventListener: () => ({ remove: () => undefined }) },
  Modal: 'Modal',
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj['ios'] ?? obj['default'] },
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

vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Line: 'Line',
  Path: 'Path',
  Rect: 'Rect',
}));

vi.mock('@tohfa/mobile-ui', () => ({ ScreenStatusBar: 'ScreenStatusBar', SafeAreaView: 'SafeAreaView' }));

const hooks = vi.hoisted(() => ({
  useFairPriceList: vi.fn(),
  useFairPriceHistory: vi.fn(),
  useRetailPriceList: vi.fn(),
  useCreateRetailPrice: vi.fn(),
}));
vi.mock('../api/pricingHooks', () => hooks);

import { PriceHistoryScreen } from '../screens/dashboard/PriceHistoryScreen';
import { toCeilingHistory } from '../api/pricingMappers';
import { makeCan } from '../permissions/can';
import { en } from '../i18n';
import { DESIGN_SAMPLES, TODAY, allText, byTestId, cursorList, fairDto, mount, press } from './pricingCeiling_renderHelpers';

const FAIR = 'pricing.fair_price.view';
const viewer = makeCan([FAIR]);
const crop = { cropId: 'crop-okra', cropName: 'Okra Live', grade: 'GRADE_1' as const };

function historyRows(): CeilingHistoryRowView[] {
  return toCeilingHistory(
    [
      fairDto({ id: 'h-3', ceilingPrice: '0.30', effectiveFrom: '2026-11-01', effectiveTo: null }),
      fairDto({ id: 'h-2', ceilingPrice: '0.20', effectiveFrom: '2026-10-01', effectiveTo: '2026-10-31' }),
      fairDto({ id: 'h-1', ceilingPrice: '0.10', effectiveFrom: '2026-09-01', effectiveTo: '2026-09-30' }),
    ],
    TODAY,
  );
}

function lastHistoryCall(): unknown[] {
  const calls = hooks.useFairPriceHistory.mock.calls;
  expect(calls.length).toBeGreaterThan(0);
  return calls[calls.length - 1]!;
}

beforeEach(() => {
  for (const h of Object.values(hooks)) h.mockReset();
  hooks.useFairPriceList.mockReturnValue(cursorList());
  hooks.useFairPriceHistory.mockReturnValue(cursorList<CeilingHistoryRowView>());
  hooks.useRetailPriceList.mockReturnValue(cursorList());
});

describe('price history: no crop, no request', () => {
  it('opened without a crop (the old host mounts): the pick-a-crop state and no history hook', async () => {
    const tree = await mount(<PriceHistoryScreen onBack={() => undefined} can={viewer} itemName="Carrots" category="Vegetables" currentPrice={42} />);
    const text = allText(tree);
    expect(text).toContain(en['pricingCeiling.history.pickCrop.title']);
    expect(text).not.toContain('Carrots');
    expect(hooks.useFairPriceHistory).not.toHaveBeenCalled();
  });

  it('without pricing.fair_price.view: not-available and no hook, even with a crop', async () => {
    const tree = await mount(<PriceHistoryScreen onBack={() => undefined} can={makeCan(['pricing.retail_price.view'])} crop={crop} />);
    expect(allText(tree)).toContain(en['pricingCeiling.notAvailable.title']);
    expect(hooks.useFairPriceHistory).not.toHaveBeenCalled();
  });

  it('a missing can denies', async () => {
    const tree = await mount(<PriceHistoryScreen onBack={() => undefined} crop={crop} />);
    expect(allText(tree)).toContain(en['pricingCeiling.notAvailable.title']);
    expect(hooks.useFairPriceHistory).not.toHaveBeenCalled();
  });
});

describe('price history: one crop from the ceiling list', () => {
  it('asks the hook for that crop and grade, enabled', async () => {
    await mount(<PriceHistoryScreen onBack={() => undefined} can={viewer} crop={crop} warehouseId="wh-1" />);
    const [warehouseId, cropId, filters, options] = lastHistoryCall();
    expect(warehouseId).toBe('wh-1');
    expect(cropId).toBe('crop-okra');
    expect(filters).toEqual({ grade: 'GRADE_1' });
    expect(options).toEqual({ enabled: true });
  });

  it('renders each window with previous -> new values as Money strings (paise), newest first', async () => {
    hooks.useFairPriceHistory.mockReturnValue(cursorList({ items: historyRows() }));
    const tree = await mount(<PriceHistoryScreen onBack={() => undefined} can={viewer} crop={crop} />);
    const text = allText(tree);
    expect(text).toContain(`Okra Live · ${en['pricingCeiling.grade.GRADE_1']} · ${en['pricingCeiling.history.priceType.FAIR_PRICE_CEILING']}`);
    expect(text).toContain('₹0.20/kg → ₹0.30/kg');
    expect(text).toContain('₹0.10/kg → ₹0.20/kg');
    // The oldest loaded window has no loaded predecessor: the dash, never a guess.
    expect(text).toContain('— → ₹0.10/kg');
    expect(byTestId(tree, 'pricingHistory.card.h-3')).toHaveLength(1);
  });

  it('the details sheet shows the dash for every field the API lacks', async () => {
    hooks.useFairPriceHistory.mockReturnValue(cursorList({ items: historyRows() }));
    const tree = await mount(<PriceHistoryScreen onBack={() => undefined} can={viewer} crop={crop} />);
    await press(tree, 'pricingHistory.card.h-3');
    const text = allText(tree);
    for (const key of [
      'pricingCeiling.history.details.changeReason',
      'pricingCeiling.history.details.changedBy',
      'pricingCeiling.history.details.recorded',
      'pricingCeiling.history.details.validation',
      'pricingCeiling.history.details.auditRef',
    ] as const) {
      expect(text, key).toContain(en[key]);
    }
    expect(text).toContain('—');
    expect(text).not.toContain('user-uuid-1');
    expect(text).toContain(en['pricingCeiling.history.details.lockNotice']);
  });

  it('loading, error with Retry, empty', async () => {
    hooks.useFairPriceHistory.mockReturnValue(cursorList({ isLoading: true }));
    let tree = await mount(<PriceHistoryScreen onBack={() => undefined} can={viewer} crop={crop} />);
    expect(allText(tree)).toContain(en['async.loading']);

    const failing = cursorList({ error: new Error('boom') });
    hooks.useFairPriceHistory.mockReturnValue(failing);
    tree = await mount(<PriceHistoryScreen onBack={() => undefined} can={viewer} crop={crop} />);
    expect(allText(tree)).toContain(en['async.error.title']);
    const retry = tree.root
      .findAll((n) => (n.type as unknown) === 'TouchableOpacity')
      .find((n) => n.findAll((c) => (c.type as unknown) === 'Text' && c.props.children === en['async.retry']).length > 0);
    await act(async () => {
      (retry!.props.onPress as () => void)();
    });
    expect(failing.refresh).toHaveBeenCalled();

    hooks.useFairPriceHistory.mockReturnValue(cursorList());
    tree = await mount(<PriceHistoryScreen onBack={() => undefined} can={viewer} crop={crop} />);
    expect(allText(tree)).toContain(en['pricingCeiling.history.empty']);
  });

  it('Load more pages on', async () => {
    const list = cursorList({ items: historyRows(), hasMore: true });
    hooks.useFairPriceHistory.mockReturnValue(list);
    const tree = await mount(<PriceHistoryScreen onBack={() => undefined} can={viewer} crop={crop} />);
    await press(tree, 'pricingHistory.loadMore');
    expect(list.loadMore).toHaveBeenCalledTimes(1);
  });

  it('the grade filter reaches the hook (All drops the grade)', async () => {
    const tree = await mount(<PriceHistoryScreen onBack={() => undefined} can={viewer} crop={crop} />);
    await press(tree, 'pricingHistory.filterButton');
    await press(tree, 'pricingCeiling.filter.gradeBox');
    await press(tree, 'pricingCeiling.filter.grade.ALL');
    await press(tree, 'pricingCeiling.filter.apply');
    expect(lastHistoryCall()[2]).toEqual({});
  });
});

describe('price history: counter-offers and design samples', () => {
  it('the counter-offer section is an empty state (no backend)', async () => {
    const tree = await mount(<PriceHistoryScreen onBack={() => undefined} can={viewer} crop={crop} />);
    const text = allText(tree);
    expect(text).toContain(en['pricingCeiling.history.counterOffers.title']);
    expect(text).toContain(en['pricingCeiling.history.counterOffers.empty']);
  });

  it('never renders a design fixture or sample', async () => {
    hooks.useFairPriceHistory.mockReturnValue(cursorList({ items: historyRows() }));
    const tree = await mount(<PriceHistoryScreen onBack={() => undefined} can={viewer} crop={crop} />);
    await press(tree, 'pricingHistory.card.h-2');
    const text = allText(tree);
    for (const s of DESIGN_SAMPLES) expect(text, s).not.toContain(s);
  });

  it('back calls onBack', async () => {
    const onBack = vi.fn();
    const tree = await mount(<PriceHistoryScreen onBack={onBack} can={viewer} />);
    await press(tree, 'pricingCeiling.back');
    expect(onBack).toHaveBeenCalled();
  });
});
