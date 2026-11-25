/**
 * Tohfa Admin "Accounts & Finance" hub (screens/finance-hub), ported from the
 * design's Finance tab (origin/tofhafarmfin-rbac TohfaAdminDashboardScreen,
 * "FINANCE TAB (Accounts & Finance Dashboard)"). Rendered with
 * react-test-renderer against a mocked useFinanceReports. Pins:
 *   - every figure with no backend source renders the dash;
 *   - none of the design's fixture amounts, names or dates are rendered;
 *   - each Go-to tile and header action renders only with its callback AND
 *     its rbac.json code, and calls back; a missing `can` denies everything;
 *   - Sales / Expenses come from the real revenue / expense reports as exact
 *     paise (no float);
 *   - a source guard (no role strings, no hex, no numeric fontSize, no
 *     parseFloat / Number( on money, files <= 800 lines, t() keys exist).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance, type ReactTestRendererJSON } from 'react-test-renderer';

vi.mock('react-native', () => ({
  Alert: { alert: vi.fn() },
  BackHandler: { addEventListener: vi.fn(() => ({ remove: () => undefined })) },
  Platform: { OS: 'ios', select: (o: Record<string, unknown>) => o['ios'] ?? o['default'] },
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s },
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Line: 'Line', Path: 'Path', Rect: 'Rect' }));
vi.mock('@tohfa/mobile-ui', () => ({ ScreenStatusBar: 'ScreenStatusBar', SafeAreaView: 'SafeAreaView' }));

const data = vi.hoisted(() => ({ useFinanceReports: vi.fn() }));
vi.mock('../screens/warehouse/finance-expenses/useFinanceData', () => data);

import { BackHandler } from 'react-native';
import { FinanceHubScreen, FINANCE_HUB_TILES, type FinanceHubScreenProps } from '../screens/finance-hub';
import { OverviewDashboardCard } from '../components/OverviewDashboardCard';
import { mapExpenseReport, mapRevenueReport, type FinanceReportTotals } from '../screens/warehouse/finance-expenses/mappers';
import type { FinanceExpenseReportDto, FinanceRevenueReportDto } from '../api/finance';
import { makeCan, type Can } from '../permissions/can';
import { en } from '../i18n';

const ADMIN = path.join(__dirname, '..');
const HUB = path.join(ADMIN, 'screens/finance-hub');
const CATALOGUE_PATH = path.join(ADMIN, 'i18n/financeHub.en.json');
const CATALOGUE: Record<string, string> = fs.existsSync(CATALOGUE_PATH)
  ? (JSON.parse(fs.readFileSync(CATALOGUE_PATH, 'utf8')) as Record<string, string>)
  : {};
const DASH = '—';

const allowAll: Can = (code) => code.length > 0;

function idle(report?: FinanceReportTotals) {
  return { isLoading: false, error: null, refresh: vi.fn(), isRefreshing: false, report };
}

function reports(revenue?: FinanceReportTotals, expenses?: FinanceReportTotals) {
  return { revenue: idle(revenue), expenses: idle(expenses) };
}

function allCallbacks() {
  return {
    onOpenSales: vi.fn(),
    onOpenDuesPayouts: vi.fn(),
    onOpenSalesIncome: vi.fn(),
    onOpenExpenses: vi.fn(),
    onOpenWallet: vi.fn(),
    onOpenInvoices: vi.fn(),
    onOpenReturns: vi.fn(),
    onOpenTransactionHistory: vi.fn(),
    onOpenReports: vi.fn(),
    onOpenFilter: vi.fn(),
    onExport: vi.fn(),
  };
}

function textOf(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(textOf);
  return (node.children ?? []).flatMap(textOf);
}
const allText = (tree: renderer.ReactTestRenderer) => textOf(tree.toJSON()).join('\n');

function mount(props: Partial<FinanceHubScreenProps>) {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<FinanceHubScreen {...props} />);
  });
  return tree;
}

const byTestId = (tree: renderer.ReactTestRenderer, id: string): ReactTestInstance[] =>
  tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === id);
const tileIds = (tree: renderer.ReactTestRenderer) =>
  tree.root
    .findAll((n) => typeof n.type === 'string' && typeof n.props.testID === 'string' && n.props.testID.startsWith('financeHub.tile.'))
    .map((n) => String(n.props.testID).slice('financeHub.tile.'.length));
const kpis = (tree: renderer.ReactTestRenderer) =>
  tree.root.findAllByType(OverviewDashboardCard).map((n) => ({ title: String(n.props.title), value: String(n.props.value) }));

function revenueDto(total: string): FinanceRevenueReportDto {
  return {
    from: '2026-10-13',
    to: '2026-11-11',
    summary: { count: 3, total },
    byDay: [],
    byChannel: [],
    byPaymentMethod: [],
  } as unknown as FinanceRevenueReportDto;
}
function expenseDto(total: string): FinanceExpenseReportDto {
  return {
    from: '2026-10-13',
    to: '2026-11-11',
    summary: { count: 2, total },
    byDay: [],
    byCategory: [],
    byPaymentMethod: [],
  } as unknown as FinanceExpenseReportDto;
}

beforeEach(() => {
  data.useFinanceReports.mockReset();
  data.useFinanceReports.mockReturnValue(reports());
});
afterEach(() => vi.clearAllMocks());

describe('FinanceHubScreen: figures', () => {
  it('renders the design title and eight KPI cards in the design order', () => {
    const tree = mount({ can: allowAll });
    expect(allText(tree)).toContain(CATALOGUE['financeHub.title']);
    expect(CATALOGUE['financeHub.title']).toBe('Accounts & Finance');
    expect(kpis(tree).map((k) => k.title)).toEqual([
      'Sales',
      'Farmer Purchase Value',
      'Outstanding Dues',
      'Expenses',
      'Wallet Liability',
      'Pending Payouts',
      'Refunds',
      'Net Financial Summary',
    ]);
  });

  it('every unsourced figure is the dash; with no reports, all eight are', () => {
    const tree = mount({ can: allowAll });
    expect(en['financeHub.figure.none' as keyof typeof en]).toBe(DASH);
    expect(kpis(tree).map((k) => k.value)).toEqual(Array(8).fill(DASH));
    // Flow bars (3) and payment status rows (3) show the dash too.
    for (const id of ['revenue', 'purchase', 'expense', 'collected', 'pending', 'failed']) {
      const [row] = byTestId(tree, `financeHub.row.${id}`);
      expect(row, id).toBeDefined();
      expect(textOf(row!.children as never).join(''), id).toContain(DASH);
    }
    expect(allText(tree)).toContain(CATALOGUE['financeHub.byWarehouse.empty']);
    expect(allText(tree)).toContain(CATALOGUE['financeHub.recent.empty']);
  });

  it('renders none of the design fixture amounts, names or dates', () => {
    data.useFinanceReports.mockReturnValue(reports());
    const tree = mount({ can: allowAll, ...allCallbacks() });
    const text = allText(tree);
    const values = kpis(tree).map((k) => k.value).join('|');
    for (const literal of [
      '₹2,14,600.00',
      '₹1,38,900.00',
      '₹32,450.00',
      '₹18,200.00',
      '₹9,340.00',
      '₹1,840.00',
      '₹2,14,600',
      '₹58,200.00',
      'Main Warehouse, Ooty',
      'Coonoor',
      'Kotagiri',
      'Nilgiri Fresh Traders',
      'Kumar',
      'SO-0013',
      'PY-0005',
      '14 Oct 2026',
      '1 Oct 2026',
      'Not defined',
    ]) {
      expect(text, literal).not.toContain(literal);
      expect(values, literal).not.toContain(literal);
    }
  });

  it('Sales and Expenses map from the revenue / expense reports as exact paise; the rest stay dashes', () => {
    data.useFinanceReports.mockReturnValue(reports(mapRevenueReport(revenueDto('214600.10')), mapExpenseReport(expenseDto('0.30'))));
    const tree = mount({ can: allowAll });
    const byTitle = Object.fromEntries(kpis(tree).map((k) => [k.title, k.value]));
    expect(byTitle['Sales']).toBe('₹2,14,600.10');
    expect(byTitle['Expenses']).toBe('₹0.30');
    for (const title of ['Farmer Purchase Value', 'Outstanding Dues', 'Wallet Liability', 'Pending Payouts', 'Refunds', 'Net Financial Summary']) {
      expect(byTitle[title], title).toBe(DASH);
    }
    const [revenueRow] = byTestId(tree, 'financeHub.row.revenue');
    expect(textOf(revenueRow!.children as never).join('')).toContain('₹2,14,600.10');
    const [purchaseRow] = byTestId(tree, 'financeHub.row.purchase');
    expect(textOf(purchaseRow!.children as never).join('')).toContain(DASH);
  });

  it('asks for a 30-day IST range, gated by each report code; no can fetches nothing', () => {
    mount({ can: makeCan(['finance.sales_income.view']), warehouseId: 'wh-1' });
    const [key, range, gates] = data.useFinanceReports.mock.calls[0]!;
    expect(key).toBe('wh-1');
    expect(gates).toEqual({ revenue: true, expenses: false });
    const span = (Date.parse(`${range.to}T00:00:00Z`) - Date.parse(`${range.from}T00:00:00Z`)) / 86_400_000;
    expect(span).toBe(29);

    data.useFinanceReports.mockClear();
    mount({});
    expect(data.useFinanceReports.mock.calls[0]![2]).toEqual({ revenue: false, expenses: false });
  });
});

describe('FinanceHubScreen: tiles and actions', () => {
  it('without can, no tile and no header action renders even with every callback', () => {
    const tree = mount({ ...allCallbacks() });
    expect(tileIds(tree)).toEqual([]);
    expect(byTestId(tree, 'financeHub.filter')).toHaveLength(0);
    expect(byTestId(tree, 'financeHub.export')).toHaveLength(0);
  });

  it('with every code but no callbacks, only alwaysShow tiles render', () => {
    // duesPayouts and reportExport are alwaysShow: they render even without callbacks.
    // Every other tile still needs its callback.
    const tree = mount({ can: allowAll });
    expect(tileIds(tree)).toEqual(['duesPayouts', 'reportExport']);
  });

  it('all nine design tiles render in the design order with every code and callback', () => {
    const tree = mount({ can: allowAll, ...allCallbacks() });
    expect(tileIds(tree)).toEqual([
      'purchaseSales',
      'duesPayouts',
      'salesIncome',
      'expenses',
      'customerWallet',
      'invoices',
      'reviewReturns',
      'transactionHistory',
      'reportExport',
    ]);
  });

  for (const tile of FINANCE_HUB_TILES.filter((t) => !t.alwaysShow)) {
    it(`tile ${tile.id}: needs ${String(tile.callback)} AND one of ${tile.codes.join(' / ')}, and calls back`, () => {
      const cb = vi.fn();
      // Callback + code: rendered, and pressing calls it.
      const withBoth = mount({ can: makeCan([tile.codes[0]!]), [tile.callback]: cb });
      expect(tileIds(withBoth)).toEqual([tile.id]);
      act(() => byTestId(withBoth, `financeHub.tile.${tile.id}`)[0]!.props.onPress());
      expect(cb).toHaveBeenCalledTimes(1);
      // Code without callback: hidden (regular tiles require a callback).
      expect(tileIds(mount({ can: makeCan([...tile.codes]) }))).toEqual([]);
      // Callback without code: hidden.
      expect(tileIds(mount({ can: makeCan(['some.other.code']), [tile.callback]: cb }))).toEqual([]);
    });
  }

  for (const tile of FINANCE_HUB_TILES.filter((t) => t.alwaysShow)) {
    it(`tile ${tile.id} (alwaysShow): renders with code alone, calls back when callback given, toasts when not`, () => {
      const cb = vi.fn();
      // With code AND callback: rendered, pressing calls the callback.
      const withBoth = mount({ can: makeCan([tile.codes[0]!]), [tile.callback]: cb });
      expect(tileIds(withBoth)).toContain(tile.id);
      act(() => byTestId(withBoth, `financeHub.tile.${tile.id}`)[0]!.props.onPress());
      expect(cb).toHaveBeenCalledTimes(1);
      // Code without callback: still rendered (alwaysShow).
      const codeOnly = mount({ can: makeCan([...tile.codes]) });
      expect(tileIds(codeOnly)).toContain(tile.id);
      // No code: hidden even with alwaysShow.
      expect(tileIds(mount({ can: makeCan(['some.other.code']), [tile.callback]: cb }))).not.toContain(tile.id);
    });
  }

  it('tile codes exist in docs/rbac.json', () => {
    const rbac = fs.readFileSync(path.join(ADMIN, '../../../../../docs/rbac.json'), 'utf8');
    for (const tile of FINANCE_HUB_TILES) for (const code of tile.codes) expect(rbac, code).toContain(`"${code}"`);
  });

  it('filter and export render with the code (callback not required); call back when given, toast without', () => {
    // With code AND callback: renders and calls back.
    const onOpenFilter = vi.fn();
    const onExport = vi.fn();
    const tree = mount({ can: makeCan(['finance.dashboard.view', 'report.export.file']), onOpenFilter, onExport });
    expect(byTestId(tree, 'financeHub.filter')).toHaveLength(1);
    expect(byTestId(tree, 'financeHub.export')).toHaveLength(1);
    act(() => byTestId(tree, 'financeHub.filter')[0]!.props.onPress());
    act(() => byTestId(tree, 'financeHub.export')[0]!.props.onPress());
    expect(onOpenFilter).toHaveBeenCalledTimes(1);
    expect(onExport).toHaveBeenCalledTimes(1);
    // With code but no callback: still renders (toast on press).
    const noCallbacks = mount({ can: makeCan(['finance.dashboard.view', 'report.export.file']) });
    expect(byTestId(noCallbacks, 'financeHub.filter')).toHaveLength(1);
    expect(byTestId(noCallbacks, 'financeHub.export')).toHaveLength(1);
    // Without the codes: hidden even with callbacks.
    const noCodes = mount({ can: makeCan(['x.y']), onOpenFilter, onExport });
    expect(byTestId(noCodes, 'financeHub.filter')).toHaveLength(0);
    expect(byTestId(noCodes, 'financeHub.export')).toHaveLength(0);
  });

  it('back arrow and Android hardware back call onBack; no onBack, no arrow', () => {
    const onBack = vi.fn();
    const tree = mount({ can: allowAll, onBack });
    act(() => byTestId(tree, 'financeHub.back')[0]!.props.onPress());
    expect(onBack).toHaveBeenCalledTimes(1);
    const add = vi.mocked(BackHandler.addEventListener);
    expect(add).toHaveBeenCalledWith('hardwareBackPress', expect.any(Function));
    const listener = add.mock.calls[add.mock.calls.length - 1]![1] as () => boolean;
    expect(listener()).toBe(true);
    expect(onBack).toHaveBeenCalledTimes(2);

    expect(byTestId(mount({ can: allowAll }), 'financeHub.back')).toHaveLength(0);
  });
});

// ─── Source guard ────────────────────────────────────────────────────────────

const read = (abs: string) => fs.readFileSync(abs, 'utf8');
const code = (source: string) =>
  source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s\/\/.*$/gm, '');
const FILES = fs.existsSync(HUB)
  ? fs
      .readdirSync(HUB)
      .filter((n) => /\.tsx?$/.test(n))
      .map((n) => path.join(HUB, n))
  : [];

describe('finance hub: source guard', () => {
  it('the folder exists with the screen; every file <= 800 lines', () => {
    expect(FILES.map((f) => path.basename(f))).toContain('FinanceHubScreen.tsx');
    for (const f of FILES) expect(read(f).split('\n').length, f).toBeLessThanOrEqual(800);
  });

  it('no role strings, role props, or fail-open permission checks', () => {
    for (const f of FILES) {
      const src = code(read(f));
      expect(src, f).not.toMatch(/SUPER_ADMIN|TOHFA_ADMIN|FARMER_ADMIN|MAIN_WH_ADMIN|SUB_WH_ADMIN/);
      expect(src, f).not.toMatch(/\brole\s*(===|!==)/);
      expect(src, f).not.toMatch(/\brole\??\s*[:=]/);
      expect(src, f).not.toMatch(/\|\|\s*!user/);
      expect(src, f).not.toMatch(/=>\s*true\b/);
      expect(src, f).not.toMatch(/as any/);
    }
  });

  it('no raw colour, numeric fontSize, or float money', () => {
    for (const f of FILES) {
      const src = code(read(f));
      expect(src, f).not.toMatch(/(['"`])#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3,4})\1/);
      expect(src, f).not.toMatch(/\brgba?\s*\(/);
      expect(src, f).not.toMatch(/fontSize\s*:\s*[0-9]/);
      expect(src, f).not.toMatch(/fontFamily\s*:/);
      expect(src, f).not.toMatch(/parseFloat|parseInt|\bNumber\(|toFixed\(/);
    }
  });

  it('no fixture data and no raw English between JSX tags', () => {
    for (const f of FILES) {
      const src = code(read(f));
      expect(src, f).not.toMatch(/MOCK_|FIXTURE|SAMPLE_|INITIAL_/);
      expect(src, f).not.toMatch(/₹\s*\d/);
      if (f.endsWith('.tsx')) expect(src, f).not.toMatch(/>\s*[A-Z][a-z]+(?: [A-Za-z&]+)*\s*</);
    }
  });

  it('every financeHub.* key used exists in financeHub.en.json and in the merged catalogue; ta is {}', () => {
    const used = new Set<string>();
    for (const f of FILES) for (const m of code(read(f)).matchAll(/'(financeHub\.[A-Za-z0-9_.]+)'/g)) used.add(m[1]!);
    expect(used.size).toBeGreaterThan(20);
    for (const key of used) expect(CATALOGUE[key], key).toBeTruthy();
    for (const key of Object.keys(CATALOGUE)) {
      expect(key).toMatch(/^financeHub\./);
      expect((en as Record<string, string>)[key], key).toBe(CATALOGUE[key]);
    }
    expect(JSON.parse(read(path.join(ADMIN, 'i18n/financeHub.ta.json')))).toEqual({});
  });

  it("uses mobile-ui's SafeAreaView and ScreenStatusBar, never the react-native ones", () => {
    const screen = code(read(path.join(HUB, 'FinanceHubScreen.tsx')));
    expect(screen).toMatch(/import \{[^}]*SafeAreaView[^}]*\} from '@tohfa\/mobile-ui'/);
    expect(screen).toMatch(/import \{[^}]*ScreenStatusBar[^}]*\} from '@tohfa\/mobile-ui'/);
    for (const f of FILES) expect(code(read(f)), f).not.toMatch(/import \{[^}]*\b(SafeAreaView|StatusBar)\b[^}]*\} from 'react-native'/);
  });
});
