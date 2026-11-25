/**
 * Tohfa Admin Inventory & Warehouse overview (M10-S01,
 * screens/operations/WarehouseOverviewScreen), rendered with
 * react-test-renderer against a mocked data hook. Pins: the
 * warehouse.all.view gate (fail closed), warehouses and figures from the API
 * only (no design fixtures), the dash for unsourced figures, quick links only
 * with callback + rbac code and with the right warehouse id, no Add Warehouse
 * control, loading / error / empty states, and a source guard.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import React from 'react';
import renderer, { act, type ReactTestInstance, type ReactTestRendererJSON } from 'react-test-renderer';
import type { InventoryOverviewDto } from '../api/inventoryOverview';
import type { WarehouseCapacityDto, WarehouseDto } from '../api/warehouses';

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

vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Line: 'Line', Path: 'Path', Rect: 'Rect' }));
vi.mock('@tohfa/mobile-ui', () => ({ ScreenStatusBar: 'ScreenStatusBar', SafeAreaView: 'SafeAreaView' }));

const data = vi.hoisted(() => ({ useWarehouseOverviewData: vi.fn() }));
vi.mock('../screens/operations/useWarehouseOverviewData', () => data);

import { WarehouseOverviewScreen } from '../screens/operations';
import type { Fetched, WarehouseOverviewData } from '../screens/operations/useWarehouseOverviewData';
import { makeCan, type Can } from '../permissions/can';
import { en } from '../i18n';

const DASH = en['warehouseOverview.figure.none'];
const WH_A = '11111111-1111-4111-8111-111111111111';
const WH_B = '22222222-2222-4222-8222-222222222222';

function warehouse(over: Partial<WarehouseDto> = {}): WarehouseDto {
  return { id: WH_A, code: 'AA-1', name: 'Alpha Store', type: 'MAIN', isActive: true, createdAt: '2026-01-01T00:00:00Z', ...over };
}

const OVERVIEW: InventoryOverviewDto = {
  warehouses: [
    { warehouseId: WH_A, name: 'Alpha Store', availableQtyKg: '1980.000' },
    { warehouseId: WH_B, name: 'Beta Store', availableQtyKg: '20.000' },
  ],
  nearExpiryBatchCount: 0,
  lowStockCount: 7,
  pendingAdjustmentCount: 0,
  unreconciledVerificationCount: 4,
  varianceUnreconciledVerificationCount: 2,
  thresholds: { nearExpiryDays: 3, lowStockThresholdKg: '10.000' },
};

const ok = <T,>(d: T): Fetched<T> => ({ status: 'ok', data: d });

function state(over: Partial<WarehouseOverviewData> & { list?: WarehouseDto[] | undefined; listLoading?: boolean; listError?: unknown } = {}) {
  const refresh = vi.fn();
  const refreshFigures = vi.fn();
  const base: WarehouseOverviewData = {
    warehouses: {
      data: 'list' in over ? over.list : [warehouse(), warehouse({ id: WH_B, code: 'BB-2', name: 'Beta Store', type: 'SUB' })],
      isLoading: over.listLoading ?? false,
      error: over.listError ?? null,
      refresh,
    },
    overview: over.overview ?? ok(OVERVIEW),
    networkInTransit: over.networkInTransit ?? ok(3),
    capacityById: over.capacityById ?? {
      [WH_A]: ok<WarehouseCapacityDto>({ warehouseId: WH_A, capacityKg: '50000.000', usedKg: '21000.000', availableKg: '29000.000', utilizationPercent: 42 }),
      [WH_B]: { status: 'failed' },
    },
    openTransfersById: over.openTransfersById ?? { [WH_A]: ok(1), [WH_B]: ok(0) },
    refreshFigures,
  };
  return { base, refresh, refreshFigures };
}

const ALL_CODES = [
  'warehouse.all.view',
  'warehouse.own.view',
  'inventory.batch.view',
  'inventory.stock_ledger.view_all',
  'transfer.inter_warehouse.view',
  'inventory.goods_receipt.record',
];
const full = makeCan(ALL_CODES);

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

const byTestId = (tree: renderer.ReactTestRenderer, id: string): ReactTestInstance[] =>
  tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === id);

async function press(tree: renderer.ReactTestRenderer, id: string): Promise<void> {
  const [node] = byTestId(tree, id);
  expect(node, `no pressable with testID ${id}`).toBeDefined();
  await act(async () => {
    (node!.props.onPress as () => void)();
  });
}

function callbacks() {
  return {
    onOpenStockLedger: vi.fn(),
    onOpenStockVerification: vi.fn(),
    onOpenTransfers: vi.fn(),
    onOpenWarehouse: vi.fn(),
  };
}

beforeEach(() => {
  data.useWarehouseOverviewData.mockReset();
  data.useWarehouseOverviewData.mockReturnValue(state().base);
});

describe('warehouse overview: access', () => {
  it('without warehouse.all.view shows not-available and fetches nothing', async () => {
    const tree = await mount(<WarehouseOverviewScreen can={makeCan(['inventory.batch.view'])} />);
    const text = allText(tree);
    expect(text).toContain(en['warehouseOverview.notAvailable.title']);
    expect(text).not.toContain('Alpha Store');
    for (const call of data.useWarehouseOverviewData.mock.calls) expect((call[0] as { enabled: boolean }).enabled).toBe(false);
  });

  it('a missing can denies', async () => {
    const tree = await mount(<WarehouseOverviewScreen can={undefined as unknown as Can} />);
    expect(allText(tree)).toContain(en['warehouseOverview.notAvailable.title']);
  });
});

describe('warehouse overview: live data only', () => {
  it('warehouses come from the API; no design fixture appears', async () => {
    const tree = await mount(<WarehouseOverviewScreen can={full} />);
    const text = allText(tree);
    expect(text).toContain('Alpha Store (AA-1)');
    expect(text).toContain('Beta Store (BB-2)');
    for (const s of ['Coonoor', 'WH-COON', 'WH-MAIN', 'WH-SUB', 'Ooty', 'Kotagiri', 'Sholur', 'Gudalur', '4,810']) expect(text).not.toContain(s);
  });

  it('figures map from the API', async () => {
    const tree = await mount(<WarehouseOverviewScreen can={full} />);
    const text = allText(tree);
    expect(text).toContain('2,000 kg'); // total available, summed in grams
    expect(text).toContain('07'); // low stock
    expect(text).toContain('04'); // unreconciled verifications
    expect(text).toContain('03'); // in transit
    expect(text).toContain('02'); // variance verifications
    expect(text).toContain('50,000 kg');
    expect(text).toContain('42%');
    expect(text).toContain('1,980 kg');
    expect(text).toContain(en['warehouseOverview.card.capacityFailed']);
  });

  it('unsourced figures render the dash', async () => {
    const tree = await mount(<WarehouseOverviewScreen can={full} />);
    const text = allText(tree);
    expect(text).toContain(`${en['warehouseOverview.card.batchesLabel']} ${DASH}`);
    expect(text).toContain(`${en['warehouseOverview.card.productsLabel']} ${DASH}`);
    expect(text).toContain(`${en['warehouseOverview.card.pendingReceiptsLabel']} ${DASH}`);
    expect(text).toContain(`${en['warehouseOverview.card.discrepanciesLabel']} ${DASH}`);
    expect(text).toContain(`${en['warehouseOverview.card.updatedLabel']} ${DASH}`);
    const batchesKpi = tree.root.findAll((n) => typeof n.type !== 'string' && n.props.title === en['warehouseOverview.kpi.batches.title']);
    expect(batchesKpi[0]?.props.value).toBe(DASH);
  });

  it('without inventory.batch.view the overview is not fetched and its figures are the dash', async () => {
    data.useWarehouseOverviewData.mockReturnValue(state({ overview: { status: 'off' } }).base);
    const tree = await mount(<WarehouseOverviewScreen can={makeCan(['warehouse.all.view'])} />);
    const opts = data.useWarehouseOverviewData.mock.calls.at(-1)![0] as Record<string, boolean>;
    expect(opts).toMatchObject({ enabled: true, overview: false, transfers: false, capacity: false });
    const lowKpi = tree.root.findAll((n) => typeof n.type !== 'string' && n.props.title === en['warehouseOverview.kpi.lowStock.title']);
    expect(lowKpi[0]?.props.value).toBe(DASH);
  });
});

describe('warehouse overview: links', () => {
  const LINK_IDS = ['stockLedger', 'transfers'];
  const kpiCard = (tree: renderer.ReactTestRenderer, key: string) => {
    const [card] = tree.root.findAll((n) => typeof n.type !== 'string' && n.props.title === en[key as keyof typeof en]);
    expect(card, `no KPI card ${key}`).toBeDefined();
    return card!;
  };

  it('the design has exactly two tiles, with its labels, in its order', async () => {
    const tree = await mount(<WarehouseOverviewScreen can={full} {...callbacks()} />);
    const tiles = tree.root.findAll((n) => typeof n.type === 'string' && typeof n.props.testID === 'string' && n.props.testID.startsWith('warehouseOverview.link.'));
    expect(tiles.map((n) => n.props.testID)).toEqual(['warehouseOverview.link.stockLedger', 'warehouseOverview.link.transfers']);
    expect(en['warehouseOverview.link.stockLedger']).toBe('Stock Ledger, Batches & Verify');
    expect(en['warehouseOverview.link.transfers']).toBe('Inter-Warehouse Transfers');
    const text = allText(tree);
    expect(text).toContain('Stock Ledger, Batches & Verify');
    expect(text).toContain('Inter-Warehouse Transfers');
    // No split or added tiles: no Stock Verification / Receiving tile or string.
    for (const id of ['verification', 'receiving']) expect(byTestId(tree, `warehouseOverview.link.${id}`)).toHaveLength(0);
    expect(Object.keys(en).filter((k) => k.startsWith('warehouseOverview.link.')).sort()).toEqual([
      'warehouseOverview.link.stockLedger',
      'warehouseOverview.link.transfers',
    ]);
    expect(text).not.toMatch(/Receiving|Stock Verification/);
  });

  it('each quick link appears only with callback + code', async () => {
    const tree = await mount(<WarehouseOverviewScreen can={full} />);
    for (const id of LINK_IDS) expect(byTestId(tree, `warehouseOverview.link.${id}`)).toHaveLength(0);
    const cbs = callbacks();
    const noCodes = await mount(<WarehouseOverviewScreen can={makeCan(['warehouse.all.view'])} {...cbs} />);
    for (const id of LINK_IDS) expect(byTestId(noCodes, `warehouseOverview.link.${id}`)).toHaveLength(0);
    const both = await mount(<WarehouseOverviewScreen can={full} {...cbs} />);
    for (const id of LINK_IDS) expect(byTestId(both, `warehouseOverview.link.${id}`)).toHaveLength(1);
  });

  it('the ledger tile opens with either ledger code; the transfers tile needs transfer.inter_warehouse.view', async () => {
    const cbs = callbacks();
    const ledgerOnly = await mount(<WarehouseOverviewScreen can={makeCan(['warehouse.all.view', 'inventory.stock_ledger.view_all'])} {...cbs} />);
    expect(byTestId(ledgerOnly, 'warehouseOverview.link.stockLedger')).toHaveLength(1);
    expect(byTestId(ledgerOnly, 'warehouseOverview.link.transfers')).toHaveLength(0);
    const batchOnly = await mount(<WarehouseOverviewScreen can={makeCan(['warehouse.all.view', 'inventory.batch.view'])} {...cbs} />);
    expect(byTestId(batchOnly, 'warehouseOverview.link.stockLedger')).toHaveLength(1);
    const transfersOnly = await mount(<WarehouseOverviewScreen can={makeCan(['warehouse.all.view', 'transfer.inter_warehouse.view'])} {...cbs} />);
    expect(byTestId(transfersOnly, 'warehouseOverview.link.stockLedger')).toHaveLength(0);
    expect(byTestId(transfersOnly, 'warehouseOverview.link.transfers')).toHaveLength(1);
  });

  it('links call back with no warehouse id for All, and with the filtered warehouse id', async () => {
    const cbs = callbacks();
    const tree = await mount(<WarehouseOverviewScreen can={full} {...cbs} />);
    await press(tree, 'warehouseOverview.link.stockLedger');
    expect(cbs.onOpenStockLedger).toHaveBeenLastCalledWith(undefined);
    await press(tree, 'warehouseOverview.filterButton');
    await press(tree, `warehouseOverview.filterOption.${WH_B}`);
    expect(byTestId(tree, `warehouseOverview.card.${WH_A}`)).toHaveLength(0);
    expect(byTestId(tree, `warehouseOverview.card.${WH_B}`)).toHaveLength(1);
    await press(tree, 'warehouseOverview.link.stockLedger');
    expect(cbs.onOpenStockLedger).toHaveBeenLastCalledWith(WH_B);
    await press(tree, 'warehouseOverview.link.transfers');
    expect(cbs.onOpenTransfers).toHaveBeenCalledTimes(1);
  });

  it('the design KPI cards open stock verification (Pending Verification, Stock Discrepancies) with the warehouse id; none opens receiving', async () => {
    const cbs = callbacks();
    const tree = await mount(<WarehouseOverviewScreen can={full} {...cbs} />);
    const pending = kpiCard(tree, 'warehouseOverview.kpi.pendingVerification.title');
    expect(pending.props.icon).toBe('receiving');
    const discrepancies = kpiCard(tree, 'warehouseOverview.kpi.discrepancies.title');
    await act(async () => {
      (pending.props.onPress as () => void)();
    });
    expect(cbs.onOpenStockVerification).toHaveBeenLastCalledWith(undefined);
    await press(tree, 'warehouseOverview.filterButton');
    await press(tree, `warehouseOverview.filterOption.${WH_B}`);
    await act(async () => {
      (kpiCard(tree, 'warehouseOverview.kpi.discrepancies.title').props.onPress as () => void)();
    });
    expect(cbs.onOpenStockVerification).toHaveBeenLastCalledWith(WH_B);
    expect(discrepancies.props.onPress).toBeDefined();
    // Gated like the tiles: without the callback, or without inventory.batch.view, the cards are inert.
    const noCb = await mount(<WarehouseOverviewScreen can={full} />);
    expect(kpiCard(noCb, 'warehouseOverview.kpi.pendingVerification.title').props.onPress).toBeUndefined();
    const noCode = await mount(<WarehouseOverviewScreen can={makeCan(['warehouse.all.view'])} {...callbacks()} />);
    expect(kpiCard(noCode, 'warehouseOverview.kpi.pendingVerification.title').props.onPress).toBeUndefined();
  });

  it('a warehouse card opens that warehouse', async () => {
    const cbs = callbacks();
    const tree = await mount(<WarehouseOverviewScreen can={full} {...cbs} />);
    await press(tree, `warehouseOverview.card.${WH_A}`);
    expect(cbs.onOpenWarehouse).toHaveBeenCalledWith(WH_A);
  });

  it('there is no Add Warehouse control and no activate action', async () => {
    const cbs = callbacks();
    const tree = await mount(<WarehouseOverviewScreen can={full} {...cbs} onBack={vi.fn()} />);
    const ids = tree.root.findAll((n) => typeof n.type === 'string' && typeof n.props.testID === 'string').map((n) => n.props.testID as string);
    expect(ids.some((id) => /add|activate|plus/i.test(id))).toBe(false);
    const labels = tree.root.findAll((n) => typeof n.props.accessibilityLabel === 'string').map((n) => n.props.accessibilityLabel as string);
    expect(labels.some((l) => /^add/i.test(l))).toBe(false);
    expect(allText(tree)).not.toMatch(/Active warehouse|Add warehouse/i);
  });

  it('back calls onBack', async () => {
    const onBack = vi.fn();
    const tree = await mount(<WarehouseOverviewScreen can={full} onBack={onBack} />);
    await press(tree, 'warehouseOverview.back');
    expect(onBack).toHaveBeenCalled();
  });
});

describe('warehouse overview: async states', () => {
  it('loading', async () => {
    data.useWarehouseOverviewData.mockReturnValue(state({ list: undefined, listLoading: true }).base);
    const tree = await mount(<WarehouseOverviewScreen can={full} />);
    expect(allText(tree)).toContain(en['async.loading']);
  });

  it('error with a Retry that refetches', async () => {
    const s = state({ list: undefined, listError: new Error('boom') });
    data.useWarehouseOverviewData.mockReturnValue(s.base);
    const tree = await mount(<WarehouseOverviewScreen can={full} />);
    expect(allText(tree)).toContain(en['async.error.title']);
    const retry = tree.root
      .findAll((n) => (n.type as unknown) === 'TouchableOpacity')
      .find((n) => n.findAll((c) => (c.type as unknown) === 'Text' && c.props.children === en['async.retry']).length > 0);
    expect(retry).toBeDefined();
    await act(async () => {
      (retry!.props.onPress as () => void)();
    });
    expect(s.refresh).toHaveBeenCalled();
  });

  it('empty', async () => {
    data.useWarehouseOverviewData.mockReturnValue(state({ list: [] }).base);
    const tree = await mount(<WarehouseOverviewScreen can={full} />);
    expect(allText(tree)).toContain(en['warehouseOverview.empty.title']);
  });

  it('search with no match shows the no-match state', async () => {
    const tree = await mount(<WarehouseOverviewScreen can={full} />);
    const [input] = tree.root.findAll((n) => (n.type as unknown) === 'TextInput');
    await act(async () => {
      (input!.props.onChangeText as (s: string) => void)('zzz');
    });
    expect(allText(tree)).toContain(en['warehouseOverview.empty.noMatch']);
  });
});

// ─── Source guard ────────────────────────────────────────────────────────────

const ADMIN = path.join(__dirname, '..');
const OPS = path.join(ADMIN, 'screens/operations');
const read = (abs: string) => fs.readFileSync(abs, 'utf8');
const code = (source: string) =>
  source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s\/\/.*$/gm, '');
const FILES = fs.existsSync(OPS)
  ? fs
      .readdirSync(OPS)
      .filter((n) => /\.tsx?$/.test(n))
      .map((n) => path.join(OPS, n))
  : [];
const ALL = [...FILES, path.join(ADMIN, 'api/inventoryOverview.ts')];
const rel = (f: string) => path.relative(ADMIN, f);

describe('warehouse overview: source guard', () => {
  it('the folder exists and every file is at most 800 lines', () => {
    expect(FILES.length).toBeGreaterThan(3);
    for (const f of ALL) expect(read(f).split('\n').length, rel(f)).toBeLessThanOrEqual(800);
  });

  it.each(ALL.map(rel))('%s: no role strings, no fail-open can, no hex, no numeric fontSize, no float money, no fixture codes', (file) => {
    const src = code(read(path.join(ADMIN, file)));
    expect(src).not.toMatch(/'(SUPER_ADMIN|TOHFA_ADMIN|FARMER_ADMIN|MAIN_WH_ADMIN|SUB_WH_ADMIN)'/);
    expect(src).not.toMatch(/=>\s*true\b/);
    expect(src).not.toMatch(/\|\|\s*!user/);
    expect(src).not.toMatch(/as any/);
    expect(src).not.toMatch(/(['"`])#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3,4})\1/);
    expect(src).not.toMatch(/\brgba?\s*\(/);
    expect(src).not.toMatch(/fontSize\s*:\s*[0-9]/);
    expect(src).not.toMatch(/parseFloat|parseInt|Number\(|toFixed\(/);
    expect(src).not.toMatch(/WH-(MAIN|SUB|COON|OOTY|GUD)|wh-ooty|Coonoor|Kotagiri|Sholur|Gudalur/);
    expect(src).not.toMatch(/AddWarehouse|onPlusAction/);
  });

  it('tsx files: no raw English between tags; mobile-ui SafeAreaView; Android BackHandler', () => {
    const tsx = FILES.filter((f) => f.endsWith('.tsx'));
    for (const f of tsx) {
      const src = code(read(f));
      expect(src, rel(f)).not.toMatch(/>\s*[A-Z][a-z]+(?: [A-Za-z]+)*\s*</);
      expect(src, rel(f)).not.toMatch(/import \{[^}]*\b(SafeAreaView|StatusBar)\b[^}]*\} from 'react-native'/);
    }
    const all = tsx.map((f) => code(read(f))).join('\n');
    expect(all).toMatch(/import \{[^}]*ScreenStatusBar[^}]*\} from '@tohfa\/mobile-ui'/);
    expect(all).toMatch(/BackHandler\.addEventListener\('hardwareBackPress'/);
  });

  it('every warehouseOverview.* key used exists and the catalogue is prefixed', () => {
    const used = new Set<string>();
    for (const f of ALL) for (const m of read(f).matchAll(/'(warehouseOverview\.[A-Za-z0-9_.]+)'/g)) used.add(m[1]!);
    expect(used.size).toBeGreaterThan(20);
    const catalogue = en as Record<string, string>;
    for (const key of used) if (!key.endsWith('.')) expect(catalogue[key], key).toBeTruthy();
    const own = JSON.parse(read(path.join(ADMIN, 'i18n/warehouseOverview.en.json'))) as Record<string, string>;
    for (const key of Object.keys(own)) expect(key.startsWith('warehouseOverview.'), key).toBe(true);
    expect(JSON.parse(read(path.join(ADMIN, 'i18n/warehouseOverview.ta.json')))).toEqual({});
  });
});
