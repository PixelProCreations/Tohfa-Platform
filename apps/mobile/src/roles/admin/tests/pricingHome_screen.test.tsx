/**
 * Market & Pricing home (phase 2A): ONE layout for every admin (the design's
 * Tohfa layout plus the FA-only parts that fit), each section shown only for
 * its read code. Pins: every KPI is the dash (no KPI endpoint), the alerts and
 * recently-updated feeds are empty states (no API), the overview rows come
 * from useRetailPriceList with the retail-vs-ceiling badge done in paise
 * (BR-09), Market Day / Listing Approval rows are gone, there is no
 * Update / Bulk action, and a caller with neither read code sees the neutral
 * not-available state with no request.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import type { RetailPriceRowView } from '../api/pricingTypes';

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

import { MarketPricingHomeScreen } from '../screens/dashboard/MarketPricingHomeScreen';
import { toRetailPriceRow } from '../api/pricingMappers';
import { makeCan } from '../permissions/can';
import { en } from '../i18n';
import { DESIGN_SAMPLES, allText, byTestId, cursorList, mount, press, retailDto, textIn } from './pricingCeiling_renderHelpers';

const FAIR = 'pricing.fair_price.view';
const RETAIL = 'pricing.retail_price.view';
const both = makeCan([FAIR, RETAIL]);
const superAdmin = makeCan([FAIR, RETAIL, 'pricing.fair_price.set', 'pricing.fair_price.bulk_update', 'pricing.retail_price.set']);

function retailRows(): RetailPriceRowView[] {
  return [
    toRetailPriceRow(retailDto({ id: 'rp-1', price: '0.30', ceilingPrice: '0.30' })),
    toRetailPriceRow(retailDto({ id: 'rp-2', cropName: 'Leek Live', grade: 'GRADE_2', price: '0.31', ceilingPrice: '0.30' })),
  ];
}

function retailEnabled(): boolean[] {
  return hooks.useRetailPriceList.mock.calls.map((c) => (c[2] as { enabled?: boolean } | undefined)?.enabled === true);
}

beforeEach(() => {
  for (const h of Object.values(hooks)) h.mockReset();
  hooks.useFairPriceList.mockReturnValue(cursorList());
  hooks.useFairPriceHistory.mockReturnValue(cursorList());
  hooks.useRetailPriceList.mockReturnValue(cursorList<RetailPriceRowView>());
});

describe('pricing home: KPIs and unavailable feeds', () => {
  it('every KPI card shows the dash, never a design number', async () => {
    const tree = await mount(<MarketPricingHomeScreen onBack={() => undefined} can={both} />);
    // The shared OverviewDashboardCard instances (composite nodes carrying value + title).
    const kpis = tree.root.findAll((n) => typeof n.type === 'function' && 'value' in n.props && 'title' in n.props);
    expect(kpis.length).toBe(7);
    for (const k of kpis) expect(k.props.value).toBe('—');
    const titles = kpis.map((k) => k.props.title);
    expect(titles).toContain(en['pricingCeiling.home.kpi.pendingPriceUpdates']);
    expect(titles).toContain(en['pricingCeiling.home.kpi.activeFairPrices']);
  });

  it('alerts and recently-updated are empty states (no API feed)', async () => {
    const tree = await mount(<MarketPricingHomeScreen onBack={() => undefined} can={both} />);
    const text = allText(tree);
    expect(text).toContain(en['pricingCeiling.home.alerts.title']);
    expect(text).toContain(en['pricingCeiling.home.alerts.empty']);
    expect(text).toContain(en['pricingCeiling.home.recent.title']);
    expect(text).toContain(en['pricingCeiling.home.recent.empty']);
  });

  it('never renders a design fixture or sample', async () => {
    hooks.useRetailPriceList.mockReturnValue(cursorList({ items: retailRows() }));
    const tree = await mount(<MarketPricingHomeScreen onBack={() => undefined} can={both} />);
    const text = allText(tree);
    for (const s of DESIGN_SAMPLES) expect(text, s).not.toContain(s);
  });
});

describe('pricing home: overview rows from the retail list (BR-09)', () => {
  it("BR-09: a '0.30' retail at a '0.30' ceiling is within; '0.31' is over by ₹0.01", async () => {
    hooks.useRetailPriceList.mockReturnValue(cursorList({ items: retailRows() }));
    const tree = await mount(<MarketPricingHomeScreen onBack={() => undefined} can={both} />);
    const within = textIn(byTestId(tree, 'pricingHome.overview.rp-1')[0]!);
    expect(within).toContain(en['pricingCeiling.compare.within']);
    const over = textIn(byTestId(tree, 'pricingHome.overview.rp-2')[0]!);
    expect(over).toContain(en['pricingCeiling.compare.over']);
    expect(over).toContain('+₹0.01');
    expect(over).toContain(`Leek Live · ${en['pricingCeiling.grade.GRADE_2']}`);
  });

  it('overview loading / error / empty', async () => {
    hooks.useRetailPriceList.mockReturnValue(cursorList({ isLoading: true }));
    let tree = await mount(<MarketPricingHomeScreen onBack={() => undefined} can={both} />);
    expect(allText(tree)).toContain(en['async.loading']);
    hooks.useRetailPriceList.mockReturnValue(cursorList({ error: new Error('x') }));
    tree = await mount(<MarketPricingHomeScreen onBack={() => undefined} can={both} />);
    expect(allText(tree)).toContain(en['async.error.title']);
    hooks.useRetailPriceList.mockReturnValue(cursorList());
    tree = await mount(<MarketPricingHomeScreen onBack={() => undefined} can={both} />);
    expect(allText(tree)).toContain(en['pricingCeiling.home.overview.empty']);
  });
});

describe('pricing home: permissions fail closed', () => {
  it('a missing can (the old host mounts) shows not-available and requests nothing', async () => {
    const tree = await mount(
      <MarketPricingHomeScreen onBack={() => undefined} onNavigateToFairPrice={() => undefined} onNavigateToMarketDay={() => undefined} onNavigateToListingApproval={() => undefined} />,
    );
    expect(allText(tree)).toContain(en['pricingCeiling.notAvailable.title']);
    expect(retailEnabled().some(Boolean)).toBe(false);
  });

  it('fair-only: no retail request, no retail sections or tiles', async () => {
    const tree = await mount(<MarketPricingHomeScreen onBack={() => undefined} can={makeCan([FAIR])} />);
    expect(retailEnabled().some(Boolean)).toBe(false);
    const text = allText(tree);
    expect(text).not.toContain(en['pricingCeiling.home.alerts.title']);
    expect(text).not.toContain(en['pricingCeiling.home.overview.title']);
    expect(byTestId(tree, 'pricingHome.quick.retail')).toHaveLength(0);
    expect(byTestId(tree, 'pricingHome.quick.fairPrices')).toHaveLength(1);
    expect(text).not.toContain(en['pricingCeiling.home.kpi.withRetailPrices']);
  });

  it('retail-only: no fair-price tiles, the retail list is enabled', async () => {
    const tree = await mount(<MarketPricingHomeScreen onBack={() => undefined} can={makeCan([RETAIL])} />);
    expect(retailEnabled().some(Boolean)).toBe(true);
    expect(byTestId(tree, 'pricingHome.quick.fairPrices')).toHaveLength(0);
    expect(byTestId(tree, 'pricingHome.quick.retail')).toHaveLength(1);
    expect(byTestId(tree, 'pricingHome.viewHistory')).toHaveLength(0);
  });
});

describe('pricing home: navigation and removed rows', () => {
  it('owner decision: no Market Day Schedule or Listing Approval Queue row', async () => {
    const onMarketDay = vi.fn();
    const onListing = vi.fn();
    const tree = await mount(
      <MarketPricingHomeScreen onBack={() => undefined} can={superAdmin} onNavigateToMarketDay={onMarketDay} onNavigateToListingApproval={onListing} />,
    );
    const text = allText(tree);
    expect(text).not.toMatch(/market day|listing approval/i);
    for (const node of tree.root.findAll((n) => (n.type as unknown) === 'TouchableOpacity')) {
      (node.props.onPress as (() => void) | undefined)?.();
    }
    expect(onMarketDay).not.toHaveBeenCalled();
    expect(onListing).not.toHaveBeenCalled();
  });

  it('owner decision: no Update / Bulk / Manage action, even for a Super Admin', async () => {
    const tree = await mount(<MarketPricingHomeScreen onBack={() => undefined} can={superAdmin} />);
    expect(allText(tree)).not.toMatch(/update a price|bulk|manage retail|edit retail/i);
  });

  it('quick actions and View History call the host', async () => {
    const onFair = vi.fn();
    const onRetail = vi.fn();
    const onCategories = vi.fn();
    const onHistory = vi.fn();
    const tree = await mount(
      <MarketPricingHomeScreen
        onBack={() => undefined}
        can={both}
        onNavigateToFairPrice={onFair}
        onNavigateToRetailPricing={onRetail}
        onNavigateToCategories={onCategories}
        onNavigateToPriceHistory={onHistory}
      />,
    );
    await press(tree, 'pricingHome.quick.fairPrices');
    await press(tree, 'pricingHome.quick.retail');
    await press(tree, 'pricingHome.quick.categories');
    await press(tree, 'pricingHome.quick.history');
    await press(tree, 'pricingHome.viewHistory');
    expect(onFair).toHaveBeenCalledTimes(1);
    expect(onRetail).toHaveBeenCalledTimes(1);
    expect(onCategories).toHaveBeenCalledTimes(1);
    expect(onHistory).toHaveBeenCalledTimes(2);
  });

  it('back calls onBack', async () => {
    const onBack = vi.fn();
    const tree = await mount(<MarketPricingHomeScreen onBack={onBack} can={both} />);
    await press(tree, 'pricingCeiling.back');
    expect(onBack).toHaveBeenCalled();
  });
});
