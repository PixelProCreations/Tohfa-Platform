/**
 * TOHFA Calendar ("What the community is growing") used to render a hard-coded
 * CROP_DATA list and literal stat tiles (128 farmers / 42,600 kg / 7 crops).
 * These tests pin the screen to the real BR-136 endpoints:
 *   GET /farmers/community/planting-summary?crop=&month=&region=
 *   GET /farmers/community/planting-filters
 * The k-anonymity itself is enforced server-side (apps/api/src/modules/
 * community-planting/); the client's job is to render exactly what was
 * released — `other` as an unnamed row, an empty slice as an honest empty
 * state that names the server's minGroupSize — and to send the filters.
 *
 * The customer wishlist section has no backend (rules.md BR-136 "Not built");
 * its static rows were invented placeholder figures, so it is hidden and one
 * test pins that none of it renders.
 *
 * Until the owner decides (rules.md open contradiction 34) the server answers
 * 403 to every role, or 503 COMMUNITY_PLANTING_NOT_CONFIGURED without k: the
 * screen must say "not available yet", not show figures or a useless Retry.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import * as fs from 'node:fs';
import * as path from 'node:path';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  BackHandler: { addEventListener: () => ({ remove: () => undefined }) },
  Image: 'Image',
  Modal: 'Modal',
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj['ios'] ?? obj['default'] },
  RefreshControl: 'RefreshControl',
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: {
    create: (s: Record<string, unknown>) => s,
    flatten: (s: unknown) => s,
    // RN 0.88 exports `absoluteFill` (there is no `absoluteFillObject` in its types).
    absoluteFill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  },
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));

vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Path: 'Path',
}));

const apiGet = vi.hoisted(() => vi.fn());
vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, api: { get: apiGet } };
});

import { ApiError } from '../../../shell/api/client';
import { TohfaCalendarScreen } from '../screens/dashboard/TohfaCalendarScreen';
import { t } from '../../../i18n/farmer';
import errorsEn from '../../../i18n/errors.en.json';
import errorsTa from '../../../i18n/errors.ta.json';
import farmerEn from '../../../i18n/farmer.en.json';
import farmerTa from '../../../i18n/farmer.ta.json';

const SUMMARY_PATH = '/farmers/community/planting-summary';
const FILTERS_PATH = '/farmers/community/planting-filters';

const POTATO = '11111111-1111-4111-8111-111111111111';
const CARROT = '22222222-2222-4222-8222-222222222222';

interface SummaryOverrides {
  minGroupSize?: number;
  totals?: { farmers: number | null; totalPlantedKg: number; crops: number };
  byCrop?: Array<{ cropMasterId: string; cropName: string; farmers: number; quantityKg: number }>;
  other?: { farmers: number; quantityKg: number } | null;
}

function summary(overrides: SummaryOverrides = {}): unknown {
  return {
    generatedAt: '2026-11-02T00:00:00.000Z',
    filters: { crop: null, month: null, region: null },
    minGroupSize: overrides.minGroupSize ?? 3,
    totals: overrides.totals ?? { farmers: 57, totalPlantedKg: 20450.5, crops: 2 },
    byCrop: overrides.byCrop ?? [
      { cropMasterId: POTATO, cropName: 'Highland Potato', farmers: 40, quantityKg: 15200 },
      { cropMasterId: CARROT, cropName: 'Ooty Carrot', farmers: 17, quantityKg: 5250.5 },
    ],
    other: overrides.other === undefined ? null : overrides.other,
  };
}

const FILTERS = {
  minGroupSize: 3,
  crops: [
    { cropMasterId: POTATO, cropName: 'Highland Potato' },
    { cropMasterId: CARROT, cropName: 'Ooty Carrot' },
  ],
  months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  regions: ['Coonoor', 'Ooty Taluk'],
};

/** Route the mocked client by path; `summaryResult` may be a value, a rejection or a pending promise. */
function routeApi(summaryResult: () => Promise<unknown>, filtersResult: () => Promise<unknown> = () => Promise.resolve(FILTERS)): void {
  apiGet.mockImplementation((p: string) => {
    if (p.startsWith(FILTERS_PATH)) return filtersResult();
    if (p.startsWith(SUMMARY_PATH)) return summaryResult();
    return Promise.reject(new Error(`unexpected path ${p}`));
  });
}

function summaryCalls(): string[] {
  return apiGet.mock.calls.map((c) => c[0] as string).filter((p) => p.startsWith(SUMMARY_PATH));
}

/** Every string rendered anywhere in the tree, in order. */
function renderedText(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(renderedText);
  return (node.children ?? []).flatMap(renderedText);
}

/** Adjacent string children of one <Text> render as separate nodes; join per Text for matching. */
function textOf(tree: renderer.ReactTestRenderer): string {
  return renderedText(tree.toJSON()).join('');
}

async function settle(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function mount(): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(
      <TohfaCalendarScreen onNavigateBack={() => undefined} onNavigateToCropInsight={() => undefined} />,
    );
  });
  await settle();
  return tree;
}

async function press(tree: renderer.ReactTestRenderer, testID: string): Promise<void> {
  const node = tree.root.findByProps({ testID });
  await act(async () => {
    (node.props as { onPress: () => void }).onPress();
  });
  await settle();
}

beforeEach(() => {
  apiGet.mockReset();
});

describe('TohfaCalendarScreen — community planting summary (BR-136)', () => {
  it('shows a loading indicator, and no stat values, while the summary is in flight', async () => {
    routeApi(() => new Promise(() => undefined));
    const tree = await mount();

    expect(tree.root.findAllByProps({ testID: 'tohfaCalendar.loading' }).length).toBe(1);
    const text = textOf(tree);
    // None of the old hard-coded figures render as placeholders.
    expect(text).not.toContain('128');
    expect(text).not.toContain('42,600');
  });

  it('BR-136: maps totals and byCrop from the released summary, not the old hard-coded crop list', async () => {
    routeApi(() => Promise.resolve(summary()));
    const tree = await mount();
    const text = textOf(tree);

    expect(summaryCalls()).toEqual([SUMMARY_PATH]);
    expect(tree.root.findByProps({ testID: 'tohfaCalendar.stat.farmers' }).props.children).toBe('57');
    // The kg value is the first child; the unit is a nested <Text>.
    expect((tree.root.findByProps({ testID: 'tohfaCalendar.stat.totalKg' }).props.children as unknown[])[0]).toBe('20,450.5');
    expect(tree.root.findByProps({ testID: 'tohfaCalendar.stat.crops' }).props.children).toBe('2');

    expect(text).toContain('Highland Potato');
    expect(text).toContain('Ooty Carrot');
    expect(text).not.toContain('Cauliflower');
    expect(text).not.toContain('42,600');

    // Farmers metric: the top crop's bar is full, the other scales client-side.
    const potatoFill = tree.root.findByProps({ testID: `tohfaCalendar.bar.${POTATO}` });
    const carrotFill = tree.root.findByProps({ testID: `tohfaCalendar.bar.${CARROT}` });
    expect(JSON.stringify(potatoFill.props.style)).toContain('"width":"100%"');
    expect(JSON.stringify(carrotFill.props.style)).toContain('"width":"42.5%"');
    expect(tree.root.findByProps({ testID: `tohfaCalendar.value.${POTATO}` }).props.children).toBe('40');

    // Quantity metric: kg values and the bars rescale to quantityKg.
    await press(tree, 'tohfaCalendar.metric.quantity');
    expect(tree.root.findByProps({ testID: `tohfaCalendar.value.${CARROT}` }).props.children).toBe(
      t('farmer.tohfaCalendar.byCrop.quantityValue', { qty: '5,250.5' }),
    );
    const carrotQtyFill = tree.root.findByProps({ testID: `tohfaCalendar.bar.${CARROT}` });
    expect(JSON.stringify(carrotQtyFill.props.style)).toContain('"width":"34.5%"');
  });

  it('BR-136i: renders a released `other` group as one unnamed "Other crops" row with no crop count', async () => {
    routeApi(() =>
      Promise.resolve(
        summary({
          totals: { farmers: 46, totalPlantedKg: 15800, crops: 1 },
          byCrop: [{ cropMasterId: POTATO, cropName: 'Highland Potato', farmers: 40, quantityKg: 15200 }],
          other: { farmers: 6, quantityKg: 600 },
        }),
      ),
    );
    const tree = await mount();

    const otherRow = tree.root.findAllByProps({ testID: 'tohfaCalendar.row.other' });
    expect(otherRow.length).toBe(1);
    const label = t('farmer.tohfaCalendar.byCrop.otherCrops');
    expect(textOf(tree)).toContain(label);
    // The server no longer says how many crops are folded, and the label asks for no count.
    expect(label).not.toMatch(/\{\{|\d/);
    expect(farmerEn['farmer.tohfaCalendar.byCrop.otherCrops']).not.toContain('{{');
    expect(farmerTa['farmer.tohfaCalendar.byCrop.otherCrops']).not.toContain('{{');
    expect(tree.root.findByProps({ testID: 'tohfaCalendar.value.other' }).props.children).toBe('6');
  });

  it('BR-136i: a withheld farmer total (null) renders the withheld marker, never "null" or 0', async () => {
    routeApi(() =>
      Promise.resolve(summary({ totals: { farmers: null, totalPlantedKg: 20450.5, crops: 2 } })),
    );
    const tree = await mount();

    const farmers = tree.root.findByProps({ testID: 'tohfaCalendar.stat.farmers' }).props.children;
    expect(farmers).toBe(t('farmer.tohfaCalendar.stats.withheld'));
    expect(farmerEn['farmer.tohfaCalendar.stats.withheld']).toBeTruthy();
    expect(farmerTa['farmer.tohfaCalendar.stats.withheld']).toBeTruthy();
    expect(textOf(tree)).not.toContain('null');
    // The other tiles still render their released values.
    expect(tree.root.findByProps({ testID: 'tohfaCalendar.stat.crops' }).props.children).toBe('2');
  });

  it('BR-136: shows an empty state naming minGroupSize when nothing was released', async () => {
    routeApi(() =>
      Promise.resolve(
        summary({ minGroupSize: 5, totals: { farmers: 0, totalPlantedKg: 0, crops: 0 }, byCrop: [], other: null }),
      ),
    );
    const tree = await mount();
    const text = textOf(tree);

    expect(text).toContain(t('farmer.tohfaCalendar.empty', { count: 5 }));
    expect(t('farmer.tohfaCalendar.empty', { count: 5 })).toContain('5');
    expect(tree.root.findAllByProps({ testID: 'tohfaCalendar.row.other' }).length).toBe(0);
  });

  it('shows an error with Retry, and Retry refetches the summary', async () => {
    let fail = true;
    routeApi(() => (fail ? Promise.reject(new Error('boom')) : Promise.resolve(summary())));
    const tree = await mount();

    expect(textOf(tree)).toContain(t('farmer.tohfaCalendar.loadError'));
    expect(textOf(tree)).not.toContain('Highland Potato');

    fail = false;
    await press(tree, 'tohfaCalendar.retry');

    expect(summaryCalls().length).toBe(2);
    expect(textOf(tree)).not.toContain(t('farmer.tohfaCalendar.loadError'));
    expect(textOf(tree)).toContain('Highland Potato');
  });

  it('BR-136: a 403 (permission granted to no role yet) shows "not available", no figures and no Retry', async () => {
    routeApi(() =>
      Promise.reject(new ApiError({ type: 'about:blank', title: 'Not permitted', status: 403, code: 'FORBIDDEN' })),
    );
    const tree = await mount();
    const text = textOf(tree);

    expect(tree.root.findAllByProps({ testID: 'tohfaCalendar.unavailable' }).length).toBe(1);
    expect(text).toContain(t('farmer.tohfaCalendar.unavailable'));
    expect(text).not.toContain(t('farmer.tohfaCalendar.loadError'));
    expect(tree.root.findAllByProps({ testID: 'tohfaCalendar.retry' }).length).toBe(0);
    expect(tree.root.findAllByProps({ testID: 'tohfaCalendar.stat.farmers' }).length).toBe(0);
    expect(text).not.toContain('128');
    expect(text).not.toContain('42,600');
  });

  it('BR-136: a 503 COMMUNITY_PLANTING_NOT_CONFIGURED (no threshold set) shows "not available", no Retry', async () => {
    routeApi(() =>
      Promise.reject(
        new ApiError({
          type: 'about:blank',
          title: 'Community planting summary is not configured',
          status: 503,
          code: 'COMMUNITY_PLANTING_NOT_CONFIGURED',
        }),
      ),
    );
    const tree = await mount();

    expect(textOf(tree)).toContain(t('farmer.tohfaCalendar.unavailable'));
    expect(tree.root.findAllByProps({ testID: 'tohfaCalendar.retry' }).length).toBe(0);
  });

  it('BR-136: a 403 on both endpoints hides the filter chips, so no sheet can say the options failed to load', async () => {
    const forbidden = (): Promise<unknown> =>
      Promise.reject(new ApiError({ type: 'about:blank', title: 'Not permitted', status: 403, code: 'FORBIDDEN' }));
    routeApi(forbidden, forbidden);
    const tree = await mount();

    for (const id of ['tohfaCalendar.filter.crop', 'tohfaCalendar.filter.month', 'tohfaCalendar.filter.region']) {
      expect(tree.root.findAllByProps({ testID: id }).length, id).toBe(0);
    }
    expect(tree.root.findAllByType('Modal' as unknown as React.ElementType).length).toBe(0);
    expect(textOf(tree)).not.toContain(t('farmer.tohfaCalendar.filter.loadError'));
    expect(textOf(tree)).toContain(t('farmer.tohfaCalendar.unavailable'));
  });

  it('BR-136: a 503 COMMUNITY_PLANTING_NOT_CONFIGURED from the filters endpoint alone also hides the filter chips', async () => {
    routeApi(
      () => Promise.resolve(summary()),
      () =>
        Promise.reject(
          new ApiError({
            type: 'about:blank',
            title: 'Community planting summary is not configured',
            status: 503,
            code: 'COMMUNITY_PLANTING_NOT_CONFIGURED',
          }),
        ),
    );
    const tree = await mount();

    expect(tree.root.findAllByProps({ testID: 'tohfaCalendar.filter.crop' }).length).toBe(0);
    expect(textOf(tree)).not.toContain(t('farmer.tohfaCalendar.filter.loadError'));
  });

  it('a non-permission failure of the filters endpoint still keeps the chips and shows the load error in the sheet', async () => {
    routeApi(
      () => Promise.resolve(summary()),
      () => Promise.reject(new Error('network down')),
    );
    const tree = await mount();

    await press(tree, 'tohfaCalendar.filter.crop');
    expect(textOf(tree)).toContain(t('farmer.tohfaCalendar.filter.loadError'));
  });

  it('unset filter chips keep the design labels (All crops / Month / Region)', async () => {
    routeApi(() => Promise.resolve(summary()));
    const tree = await mount();
    const chipText = (id: string): unknown =>
      tree.root.findByProps({ testID: id }).findByType('Text' as unknown as React.ElementType).props.children;

    expect(chipText('tohfaCalendar.filter.crop')).toBe('All crops');
    expect(chipText('tohfaCalendar.filter.month')).toBe('Month');
    expect(chipText('tohfaCalendar.filter.region')).toBe('Region');
  });

  it('BR-136: selecting crop, month and region refetches with those query params; "All" clears one', async () => {
    routeApi(() => Promise.resolve(summary()));
    const tree = await mount();
    expect(summaryCalls()).toEqual([SUMMARY_PATH]);

    await press(tree, 'tohfaCalendar.filter.crop');
    await press(tree, `tohfaCalendar.option.${POTATO}`);
    expect(summaryCalls().at(-1)).toBe(`${SUMMARY_PATH}?crop=${POTATO}`);

    await press(tree, 'tohfaCalendar.filter.month');
    // Month labels come from the client's i18n catalogue, not server text.
    expect(textOf(tree)).toContain(t('farmer.weather.month.mar'));
    await press(tree, 'tohfaCalendar.option.3');
    expect(summaryCalls().at(-1)).toBe(`${SUMMARY_PATH}?crop=${POTATO}&month=3`);
    expect(textOf(tree)).toContain(t('farmer.weather.month.mar'));

    await press(tree, 'tohfaCalendar.filter.region');
    await press(tree, 'tohfaCalendar.option.Ooty Taluk');
    expect(summaryCalls().at(-1)).toBe(`${SUMMARY_PATH}?crop=${POTATO}&month=3&region=Ooty%20Taluk`);

    await press(tree, 'tohfaCalendar.filter.crop');
    await press(tree, 'tohfaCalendar.option.all');
    expect(summaryCalls().at(-1)).toBe(`${SUMMARY_PATH}?month=3&region=Ooty%20Taluk`);

    // Filter options were loaded once from the filters endpoint.
    expect(apiGet.mock.calls.filter((c) => c[0] === FILTERS_PATH).length).toBe(1);
  });

  it('pull-to-refresh refetches the summary with the current filters', async () => {
    routeApi(() => Promise.resolve(summary()));
    const tree = await mount();

    // The ScrollView is a host-string stub here, so the RefreshControl element
    // is never mounted; read it from the ScrollView's `refreshControl` prop.
    type RefreshProps = { refreshing: boolean; onRefresh: () => void };
    const refreshProps = (): RefreshProps => {
      const scroll = tree.root.find((n) => n.props.refreshControl !== undefined);
      return (scroll.props.refreshControl as React.ReactElement<RefreshProps>).props;
    };
    expect(refreshProps().refreshing).toBe(false);
    await act(async () => {
      refreshProps().onRefresh();
    });
    await settle();

    expect(summaryCalls()).toEqual([SUMMARY_PATH, SUMMARY_PATH]);
    expect(refreshProps().refreshing).toBe(false);
    // Data stays on screen after a refresh.
    expect(textOf(tree)).toContain('Highland Potato');
  });

  it('BR-136: hides the customer wishlist section, which has no backend, so no invented demand figures reach farmers', async () => {
    routeApi(() => Promise.resolve(summary()));
    const tree = await mount();
    const text = textOf(tree);

    expect(text).not.toContain(t('farmer.tohfaCalendar.wishlist.title'));
    expect(text).not.toContain(t('farmer.tohfaCalendar.wishlist.footnote'));
    // The former static placeholder rows (e.g. "62 customers" / "8,400 kg").
    expect(text).not.toContain(t('farmer.tohfaCalendar.wishlist.customers', { count: 62 }));
    expect(text).not.toContain('8,400 kg');
    expect(tree.root.findAllByType('Image' as unknown as React.ElementType).length).toBe(0);
    // No request is made for wishlist data.
    expect(apiGet.mock.calls.every((c) => [SUMMARY_PATH, FILTERS_PATH].includes(c[0] as string))).toBe(true);
  });
});

describe('TohfaCalendarScreen i18n', () => {
  it('every literal t() key on the screen exists in both en and ta', () => {
    const en: Record<string, string> = { ...errorsEn, ...farmerEn };
    const ta: Record<string, string> = { ...errorsTa, ...farmerTa };
    const source = fs.readFileSync(
      path.resolve(__dirname, '../screens/dashboard/TohfaCalendarScreen.tsx'),
      'utf8',
    );
    const keys = [...new Set([...source.matchAll(/\bt\(\s*(['"])([A-Za-z0-9_.-]+)\1/g)].map((m) => m[2]!))];
    expect(keys.length).toBeGreaterThan(10);
    for (const key of keys) {
      expect(en[key], `en ${key}`).toBeTruthy();
      expect(ta[key], `ta ${key}`).toBeTruthy();
    }
  });
});
