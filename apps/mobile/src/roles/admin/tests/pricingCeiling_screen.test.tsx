/**
 * Fair price ceiling screen (Market & Pricing phase 2A), rendered with
 * react-test-renderer against a mocked useFairPriceList (the hook itself is
 * covered by api_pricing / queryKeys_pricing). Pins: live rows only (never the
 * design's fixtures), loading / error / empty / refresh / load more, the
 * fail-closed read gate (no hook call without pricing.fair_price.view), the
 * stored frequency (BR-08), money via the paise formatter, the filters the
 * hook receives, no Update / Bulk action anywhere (owner: view-only), and the
 * History hand-off carrying the row's crop and grade.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { act } from 'react-test-renderer';
import type { FairPriceRowView } from '../api/pricingTypes';

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

import { FairPriceCeilingScreen } from '../screens/dashboard/FairPriceCeilingScreen';
import { toFairPriceRow } from '../api/pricingMappers';
import { makeCan } from '../permissions/can';
import { en } from '../i18n';
import {
  DESIGN_SAMPLES,
  TODAY,
  allText,
  byTestId,
  cursorList,
  fairDto,
  mount,
  press,
  typeInto,
} from './pricingCeiling_renderHelpers';

const FAIR = 'pricing.fair_price.view';
const RETAIL = 'pricing.retail_price.view';
const viewer = makeCan([FAIR]);
const viewerWithRetail = makeCan([FAIR, RETAIL]);
const superAdmin = makeCan([FAIR, RETAIL, 'pricing.fair_price.set', 'pricing.fair_price.bulk_update', 'pricing.retail_price.set']);

function rows(): FairPriceRowView[] {
  return [
    toFairPriceRow(fairDto(), TODAY),
    toFairPriceRow(
      fairDto({ id: 'fp-2', cropId: 'crop-leek', cropName: 'Leek Live', grade: 'GRADE_2', ceilingPrice: '1250.50', frequency: 'DAILY', effectiveFrom: '2026-11-20' }),
      TODAY,
    ),
  ];
}

function lastListCall(): unknown[] {
  const calls = hooks.useFairPriceList.mock.calls;
  expect(calls.length).toBeGreaterThan(0);
  return calls[calls.length - 1]!;
}

beforeEach(() => {
  for (const h of Object.values(hooks)) h.mockReset();
  hooks.useFairPriceList.mockReturnValue(cursorList<FairPriceRowView>());
  hooks.useFairPriceHistory.mockReturnValue(cursorList());
  hooks.useRetailPriceList.mockReturnValue(cursorList());
});

describe('fair price ceilings: live rows and async states', () => {
  it('BR-08: renders the rows the hook returns with ceiling, stored frequency and window status', async () => {
    hooks.useFairPriceList.mockReturnValue(cursorList({ items: rows() }));
    const tree = await mount(<FairPriceCeilingScreen onBack={() => undefined} can={viewer} />);
    const text = allText(tree);
    expect(text).toContain(`Okra Live · ${en['pricingCeiling.grade.GRADE_1']}`);
    expect(text).toContain(`Leek Live · ${en['pricingCeiling.grade.GRADE_2']}`);
    expect(text).toContain('₹61.25/kg');
    expect(text).toContain('₹1,250.50/kg');
    expect(text).toContain(en['pricingCeiling.frequency.DAILY']);
    expect(text).toContain(en['pricingCeiling.status.current']);
    expect(text).toContain(en['pricingCeiling.status.scheduled']);
    expect(byTestId(tree, 'pricingCeiling.card.fp-2')).toHaveLength(1);
  });

  it('BR-08: a DAILY ceiling is never labelled Weekly', async () => {
    hooks.useFairPriceList.mockReturnValue(cursorList({ items: rows() }));
    const tree = await mount(<FairPriceCeilingScreen onBack={() => undefined} can={viewer} />);
    expect(allText(tree)).not.toMatch(/weekly/i);
  });

  it('BR-08: a WEEKLY ceiling shows Weekly from the stored value', async () => {
    hooks.useFairPriceList.mockReturnValue(cursorList({ items: [toFairPriceRow(fairDto({ frequency: 'WEEKLY' }), TODAY)] }));
    const tree = await mount(<FairPriceCeilingScreen onBack={() => undefined} can={viewer} />);
    expect(allText(tree)).toContain(en['pricingCeiling.frequency.WEEKLY']);
  });

  it('shows the shared loading state', async () => {
    hooks.useFairPriceList.mockReturnValue(cursorList({ isLoading: true }));
    const tree = await mount(<FairPriceCeilingScreen onBack={() => undefined} can={viewer} />);
    expect(allText(tree)).toContain(en['async.loading']);
  });

  it('shows the shared error state with a Retry that refetches', async () => {
    const list = cursorList({ error: new Error('boom') });
    hooks.useFairPriceList.mockReturnValue(list);
    const tree = await mount(<FairPriceCeilingScreen onBack={() => undefined} can={viewer} />);
    expect(allText(tree)).toContain(en['async.error.title']);
    const retry = tree.root
      .findAll((n) => (n.type as unknown) === 'TouchableOpacity')
      .find((n) => n.findAll((c) => (c.type as unknown) === 'Text' && c.props.children === en['async.retry']).length > 0);
    expect(retry).toBeDefined();
    await act(async () => {
      (retry!.props.onPress as () => void)();
    });
    expect(list.refresh).toHaveBeenCalled();
  });

  it('shows the empty state for an empty result', async () => {
    const tree = await mount(<FairPriceCeilingScreen onBack={() => undefined} can={viewer} />);
    expect(allText(tree)).toContain(en['pricingCeiling.ceiling.empty']);
  });

  it('never renders a design fixture or sample', async () => {
    hooks.useFairPriceList.mockReturnValue(cursorList({ items: rows() }));
    const tree = await mount(<FairPriceCeilingScreen onBack={() => undefined} can={viewerWithRetail} />);
    await press(tree, 'pricingCeiling.card.fp-1.view');
    const text = allText(tree);
    for (const s of DESIGN_SAMPLES) expect(text, s).not.toContain(s);
  });

  it('pull to refresh and Load more call the list', async () => {
    const list = cursorList({ items: rows(), hasMore: true });
    hooks.useFairPriceList.mockReturnValue(list);
    const tree = await mount(<FairPriceCeilingScreen onBack={() => undefined} can={viewer} />);
    const [scroll] = tree.root.findAll((n) => (n.type as unknown) === 'ScrollView');
    const control = scroll?.props.refreshControl as React.ReactElement<{ onRefresh: () => void }> | undefined;
    expect(control).toBeDefined();
    await act(async () => {
      control!.props.onRefresh();
    });
    expect(list.refresh).toHaveBeenCalled();
    await press(tree, 'pricingCeiling.loadMore');
    expect(list.loadMore).toHaveBeenCalledTimes(1);
  });

  it('hides Load more at the end of the list', async () => {
    hooks.useFairPriceList.mockReturnValue(cursorList({ items: rows(), hasMore: false }));
    const tree = await mount(<FairPriceCeilingScreen onBack={() => undefined} can={viewer} />);
    expect(byTestId(tree, 'pricingCeiling.loadMore')).toHaveLength(0);
  });
});

describe('fair price ceilings: permissions fail closed', () => {
  it('without pricing.fair_price.view: the not-available state and the hook is never called', async () => {
    const tree = await mount(<FairPriceCeilingScreen onBack={() => undefined} can={makeCan([RETAIL])} />);
    expect(allText(tree)).toContain(en['pricingCeiling.notAvailable.title']);
    expect(hooks.useFairPriceList).not.toHaveBeenCalled();
  });

  it('a missing can denies (the old host mount passes none)', async () => {
    const tree = await mount(
      <FairPriceCeilingScreen onBack={() => undefined} onUpdatePrice={() => undefined} onBulkUpdate={() => undefined} onViewHistory={() => undefined} />,
    );
    expect(allText(tree)).toContain(en['pricingCeiling.notAvailable.title']);
    expect(hooks.useFairPriceList).not.toHaveBeenCalled();
  });

  it('the hook gets enabled: true for a viewer', async () => {
    await mount(<FairPriceCeilingScreen onBack={() => undefined} can={viewer} warehouseId="wh-1" />);
    const [warehouseId, , options] = lastListCall();
    expect(warehouseId).toBe('wh-1');
    expect(options).toEqual({ enabled: true });
  });

  it('owner decision: no Update a Price / Bulk Update / edit action, even for a Super Admin', async () => {
    hooks.useFairPriceList.mockReturnValue(cursorList({ items: rows() }));
    const onUpdatePrice = vi.fn();
    const onBulkUpdate = vi.fn();
    const tree = await mount(
      <FairPriceCeilingScreen onBack={() => undefined} can={superAdmin} onUpdatePrice={onUpdatePrice} onBulkUpdate={onBulkUpdate} />,
    );
    await press(tree, 'pricingCeiling.card.fp-1.view');
    const text = allText(tree);
    expect(text).not.toMatch(/update a price|bulk update|bulk price|edit price|set ceiling/i);
    expect(tree.root.findAll((n) => typeof n.props.testID === 'string' && /update|bulk|edit/i.test(n.props.testID as string))).toHaveLength(0);
    // Pressing every pressable never reaches the legacy write handlers.
    // Handlers are collected first: a Close press unmounts the sheet's nodes.
    const handlers = tree.root
      .findAll((n) => (n.type as unknown) === 'TouchableOpacity')
      .map((n) => n.props.onPress as (() => void) | undefined);
    expect(handlers.length).toBeGreaterThan(5);
    for (const handler of handlers) {
      await act(async () => {
        handler?.();
      });
    }
    expect(onUpdatePrice).not.toHaveBeenCalled();
    expect(onBulkUpdate).not.toHaveBeenCalled();
  });
});

describe('fair price ceilings: filters, search and actions', () => {
  it('a grade and an In force on date reach the hook; Reset clears them', async () => {
    const tree = await mount(<FairPriceCeilingScreen onBack={() => undefined} can={viewer} />);
    await press(tree, 'pricingCeiling.filterButton');
    await press(tree, 'pricingCeiling.filter.gradeBox');
    await press(tree, 'pricingCeiling.filter.grade.GRADE_2');
    await typeInto(tree, 'pricingCeiling.filter.date', '05-11-2026');
    await press(tree, 'pricingCeiling.filter.apply');
    expect(lastListCall()[1]).toEqual({ grade: 'GRADE_2', effectiveOn: '2026-11-05' });
    await press(tree, 'pricingCeiling.filterButton');
    await press(tree, 'pricingCeiling.filter.reset');
    expect(lastListCall()[1]).toEqual({});
  });

  it('an invalid date is refused with a message and not sent', async () => {
    const tree = await mount(<FairPriceCeilingScreen onBack={() => undefined} can={viewer} />);
    await press(tree, 'pricingCeiling.filterButton');
    await typeInto(tree, 'pricingCeiling.filter.date', '31-02-2026');
    await press(tree, 'pricingCeiling.filter.apply');
    expect(allText(tree)).toContain(en['pricingCeiling.filter.dateInvalid']);
    expect(lastListCall()[1]).toEqual({});
  });

  it('Category and Records filters have no API source and show the dash', async () => {
    const tree = await mount(<FairPriceCeilingScreen onBack={() => undefined} can={viewer} />);
    await press(tree, 'pricingCeiling.filterButton');
    const text = allText(tree);
    expect(text).toContain(en['pricingCeiling.filter.category']);
    expect(text).toContain(en['pricingCeiling.filter.records']);
    expect(text).toContain(en['pricingCeiling.filter.notAvailable']);
  });

  it('search narrows the loaded rows by crop name', async () => {
    hooks.useFairPriceList.mockReturnValue(cursorList({ items: rows() }));
    const tree = await mount(<FairPriceCeilingScreen onBack={() => undefined} can={viewer} />);
    await typeInto(tree, 'pricingCeiling.search', 'leek');
    expect(byTestId(tree, 'pricingCeiling.card.fp-1')).toHaveLength(0);
    expect(byTestId(tree, 'pricingCeiling.card.fp-2')).toHaveLength(1);
  });

  it('View opens the details sheet; fields without an API source show the dash', async () => {
    hooks.useFairPriceList.mockReturnValue(cursorList({ items: rows() }));
    const tree = await mount(<FairPriceCeilingScreen onBack={() => undefined} can={viewer} />);
    await press(tree, 'pricingCeiling.card.fp-1.view');
    const text = allText(tree);
    expect(text).toContain(en['pricingCeiling.details.category']);
    expect(text).toContain(en['pricingCeiling.details.updatedBy']);
    expect(text).toContain(en['pricingCeiling.details.noEndDate']);
    expect(text).toContain(en['pricingCeiling.details.recentChangesUnavailable']);
    expect(text).toContain('—');
    expect(text).not.toContain('user-uuid-1');
  });

  it('History hands the row crop and grade to the host', async () => {
    hooks.useFairPriceList.mockReturnValue(cursorList({ items: rows() }));
    const onNavigateToHistory = vi.fn();
    const tree = await mount(<FairPriceCeilingScreen onBack={() => undefined} can={viewer} onNavigateToHistory={onNavigateToHistory} />);
    await press(tree, 'pricingCeiling.card.fp-2.history');
    expect(onNavigateToHistory).toHaveBeenCalledWith({ cropId: 'crop-leek', cropName: 'Leek Live', grade: 'GRADE_2' });
  });

  it('Retail Price Management shows only with pricing.retail_price.view and a handler', async () => {
    hooks.useFairPriceList.mockReturnValue(cursorList({ items: rows() }));
    const onRetail = vi.fn();
    const without = await mount(<FairPriceCeilingScreen onBack={() => undefined} can={viewer} onNavigateToRetailPricing={onRetail} />);
    expect(byTestId(without, 'pricingCeiling.card.fp-1.retail')).toHaveLength(0);
    const withCode = await mount(<FairPriceCeilingScreen onBack={() => undefined} can={viewerWithRetail} onNavigateToRetailPricing={onRetail} />);
    await press(withCode, 'pricingCeiling.card.fp-1.retail');
    expect(onRetail).toHaveBeenCalled();
  });

  it('back calls onBack', async () => {
    const onBack = vi.fn();
    const tree = await mount(<FairPriceCeilingScreen onBack={onBack} can={viewer} />);
    await press(tree, 'pricingCeiling.back');
    expect(onBack).toHaveBeenCalled();
  });
});
