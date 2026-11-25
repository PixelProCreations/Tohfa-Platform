/**
 * TohfaHomeScreen (screens/tohfa-home/): the Tohfa Admin Home tab ported from
 * the design (origin/tofhafarmfin-rbac TohfaAdminDashboardScreen, Home tab).
 *
 * Owner decision 2026-11-11: no summary endpoint exists yet, so every figure
 * renders '—' and every list renders an empty state; the only real value is
 * the signed-in user's name from the `user` prop.
 *
 * Owner decision 2026-11-11 (copy the design exactly): every design control
 * is present. A control shows when `can` grants its docs/rbac.json code (or
 * always, when it has no code); pressing calls its callback prop, or with no
 * callback shows the "Not available yet" note and calls nothing. Plus the
 * source guard.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import type { Can } from '../permissions/can';

vi.mock('react-native', () => ({
  Alert: { alert: vi.fn() },
  Modal: 'Modal',
  TextInput: 'TextInput',
  Platform: { OS: 'ios', select: (o: Record<string, unknown>) => o['ios'] ?? o['default'] },
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, absoluteFill: {} },
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Defs: 'Defs',
  Line: 'Line',
  LinearGradient: 'LinearGradient',
  Path: 'Path',
  Rect: 'Rect',
  Stop: 'Stop',
}));
vi.mock('@tohfa/mobile-ui', () => ({ ScreenStatusBar: 'ScreenStatusBar', SafeAreaView: 'SafeAreaView' }));

afterEach(() => vi.clearAllMocks());

import { Alert } from 'react-native';
import { TohfaHomeScreen, type TohfaHomeScreenProps } from '../screens/tohfa-home/TohfaHomeScreen';
import {
  TOHFA_HOME_CONTROLS,
  TOHFA_KPI_CARDS,
  TOHFA_QUICK_ACTIONS,
  type TohfaHomeCallback,
  type TohfaHomeControl,
} from '../screens/tohfa-home/tohfaHomeLogic';
import { OverviewDashboardCard } from '../components';
import { en, t } from '../i18n';

const ADMIN = path.join(__dirname, '..');
const HOME = path.join(ADMIN, 'screens/tohfa-home');
const CATALOGUE_PATH = path.join(ADMIN, 'i18n/tohfaHome.en.json');
const CATALOGUE: Record<string, string> = fs.existsSync(CATALOGUE_PATH)
  ? (JSON.parse(fs.readFileSync(CATALOGUE_PATH, 'utf8')) as Record<string, string>)
  : {};
const DASH = '—';
const NOW = new Date('2026-11-11T04:30:00Z');

function mount(props: Partial<TohfaHomeScreenProps>) {
  const full = { now: NOW, ...props } as TohfaHomeScreenProps;
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<TohfaHomeScreen {...full} />);
  });
  return tree;
}

function allText(tree: renderer.ReactTestRenderer): string {
  return tree.root
    .findAll((n) => (n.type as unknown) === 'Text')
    .map((n) => [n.props.children].flat().join(''))
    .join('|');
}

function byTestId(tree: renderer.ReactTestRenderer, id: string) {
  return tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === id);
}

function kpiCards(tree: renderer.ReactTestRenderer) {
  return tree.root.findAllByType(OverviewDashboardCard);
}

/** The card for a KPI id, expanding the grid first when it is past the fold. */
function kpiCard(tree: renderer.ReactTestRenderer, id: string) {
  const def = TOHFA_KPI_CARDS.find((d) => d.id === id)!;
  const find = () => kpiCards(tree).find((c) => c.props.title === t(def.titleKey));
  if (!find()) act(() => byTestId(tree, 'home.kpi.toggle')[0]!.props.onPress());
  return find()!;
}

/** The pressable nodes for a control: none when hidden (buttons) or not pressable (KPI cards). */
function pressables(tree: renderer.ReactTestRenderer, control: TohfaHomeControl) {
  if (control.kind === 'kpi') {
    const card = kpiCard(tree, control.testID);
    return card.props.onPress ? [card] : [];
  }
  return byTestId(tree, control.testID);
}

/** Every callback prop the screen takes, each a fresh spy. */
function allCallbacks(): Record<TohfaHomeCallback, ReturnType<typeof vi.fn>> {
  const out = {} as Record<TohfaHomeCallback, ReturnType<typeof vi.fn>>;
  for (const c of TOHFA_HOME_CONTROLS) out[c.callback] = vi.fn();
  return out;
}

const allowAll: Can = (code) => code.length > 0;

describe('TohfaHomeScreen: figures', () => {
  it("renders '—' for every unsourced KPI figure and summary row", () => {
    const tree = mount({ can: allowAll, ...allCallbacks() });
    const cards = kpiCards(tree);
    expect(cards.length).toBe(6);
    for (const c of cards) expect(c.props.value).toBe(DASH);
    const values = tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === 'home.summary.value');
    expect(values.length).toBeGreaterThanOrEqual(14);
    for (const v of values) expect([v.props.children].flat().join('')).toBe(DASH);
    expect(allText(tree)).toContain(DASH);
  });

  it('shows the i18n empty states for the attention, warehouse and activity lists', () => {
    const text = allText(mount({ can: allowAll }));
    expect(text).toContain(CATALOGUE['tohfaHome.attention.empty']);
    expect(text).toContain(CATALOGUE['tohfaHome.warehouse.empty']);
    expect(text).toContain(CATALOGUE['tohfaHome.activity.empty']);
  });

  it('never shows the design fixture values', () => {
    const text = allText(mount({ can: allowAll, ...allCallbacks(), user: { fullName: 'Meena Raghavan' } }));
    for (const fixture of [
      '₹3,33,660',
      '₹1,51,740',
      '20 / 24',
      'Ramesh Kumar',
      'Selvi',
      'Priya Nair',
      'AUD-2026-0051',
      'APP-2026-0108',
      '1290 KG',
      'Coonoor',
      'Kotagiri',
      'Thursday, 24 September 2026',
      '13 Oct 2026',
      '09:30',
      '▼ 27%',
      'Rajesh Kumar',
      'Placed 3',
    ]) {
      expect(text, fixture).not.toContain(fixture);
    }
  });

  it("greets the user by the user prop's real first name, and with no name shows no fallback name", () => {
    expect(allText(mount({ user: { fullName: 'Meena Raghavan' } }))).toContain('Meena');
    const anonymous = allText(mount({ user: null }));
    expect(anonymous).toContain(CATALOGUE['tohfaHome.greeting.anonymous']);
    expect(anonymous).not.toMatch(/Rajesh|Admin,|, Admin/);
  });

  it("shows today's IST date from the clock, not a design date", () => {
    const text = allText(mount({}));
    expect(text).toContain('11 Nov 2026');
    expect(text).toContain(CATALOGUE['tohfaHome.weekday.3']);
  });
});

const alertSpy = () => vi.mocked(Alert.alert);
const gated = TOHFA_HOME_CONTROLS.filter((c) => c.code !== undefined);
const ungated = TOHFA_HOME_CONTROLS.filter((c) => c.code === undefined);

/** The design's quick actions, in its order, minus "Add Warehouse" (owner decision, BR-23b). */
const DESIGN_QUICK_ACTIONS = [
  'Review farmer applications',
  'Open audit calendar',
  'Create Staff',
  'Receive Goods',
  'Produce list',
  'Transfer Stock',
  'Manage retail prices',
  'Cash Top-Up',
  'Purchases and payouts',
  'Sales and invoices',
  'Create HORECA & B2B Order',
];

describe('TohfaHomeScreen: design controls', () => {
  it('renders every design quick action in design order, without Add Warehouse', () => {
    const tree = mount({ can: allowAll });
    const tiles = tree.root.findAll((n) => typeof n.type === 'string' && String(n.props.testID ?? '').startsWith('home.action.'));
    expect(tiles.map((n) => n.props.accessibilityLabel)).toEqual(DESIGN_QUICK_ACTIONS);
    expect(TOHFA_QUICK_ACTIONS.map((d) => CATALOGUE[d.labelKey])).toEqual(DESIGN_QUICK_ACTIONS);
    expect(allText(tree)).not.toContain('Add Warehouse');
  });

  it('maps Manage retail prices and Create HORECA & B2B Order to their rbac codes', () => {
    const byId = Object.fromEntries(TOHFA_QUICK_ACTIONS.map((d) => [d.id, d.gate.code]));
    expect(byId['retailPrices']).toBe('pricing.retail_price.view');
    expect(byId['channelOrder']).toBe('sales.sale.create');
  });

  it('renders the search bar, its filter button, the date chip and the refresh button', () => {
    const tree = mount({});
    expect(byTestId(tree, 'home.search.input')).toHaveLength(1);
    expect(byTestId(tree, 'home.search.filter')).toHaveLength(1);
    expect(byTestId(tree, 'home.dateRange')).toHaveLength(1);
    expect(byTestId(tree, 'home.refresh')).toHaveLength(1);
    expect(byTestId(tree, 'home.search.input')[0]!.props.placeholder).toBe(CATALOGUE['tohfaHome.search.placeholder']);
  });

  it('typing in the search bar updates it locally and adds no results', () => {
    const tree = mount({ can: allowAll });
    const before = allText(tree);
    act(() => byTestId(tree, 'home.search.input')[0]!.props.onChangeText('tomato'));
    expect(byTestId(tree, 'home.search.input')[0]!.props.value).toBe('tomato');
    expect(allText(tree)).toBe(before);
  });

  it("the date chip starts at '30 days', its modal lists the design's periods, and picking one updates the chip only", () => {
    const tree = mount({ can: allowAll });
    const chipText = () => [byTestId(tree, 'home.dateRange')[0]!.findByType('Text' as never).props.children].flat().join('');
    const modal = () => tree.root.find((n) => (n.type as unknown) === 'Modal');
    expect(chipText()).toBe('30 days');
    expect(modal().props.visible).toBe(false);
    act(() => byTestId(tree, 'home.dateRange')[0]!.props.onPress());
    expect(modal().props.visible).toBe(true);
    const options = tree.root.findAll((n) => typeof n.type === 'string' && String(n.props.testID ?? '').startsWith('home.dateRange.option.'));
    expect(options.map((o) => [o.findByType('Text' as never).props.children].flat().join(''))).toEqual([
      '7 days',
      '30 days',
      '90 days',
      'This Month',
      'This Quarter',
    ]);
    expect(allText(tree)).toContain(CATALOGUE['tohfaHome.dateRange.title']);
    act(() => byTestId(tree, 'home.dateRange.option.90d')[0]!.props.onPress());
    expect(chipText()).toBe('90 days');
    expect(modal().props.visible).toBe(false);
    for (const c of kpiCards(tree)) expect(c.props.value).toBe(DASH);
    act(() => byTestId(tree, 'home.dateRange')[0]!.props.onPress());
    act(() => byTestId(tree, 'home.dateRange.backdrop')[0]!.props.onPress());
    expect(modal().props.visible).toBe(false);
    expect(chipText()).toBe('90 days');
  });

  it('the bell shows the unread dot only for a real unread count above zero', () => {
    expect(byTestId(mount({ can: allowAll }), 'home.header.unreadDot')).toHaveLength(0);
    expect(byTestId(mount({ can: allowAll, unreadCount: 0 }), 'home.header.unreadDot')).toHaveLength(0);
    expect(byTestId(mount({ can: allowAll, unreadCount: 3 }), 'home.header.unreadDot')).toHaveLength(1);
  });
});

describe('TohfaHomeScreen: gated controls', () => {
  it('missing can hides every control that has an rbac code, even with all callbacks passed', () => {
    const tree = mount({ ...allCallbacks() });
    for (const c of gated) expect(pressables(tree, c), c.testID).toHaveLength(0);
    for (const def of TOHFA_KPI_CARDS) {
      if (def.gate.code !== undefined) expect(kpiCard(tree, def.id).props.onPress, def.id).toBeUndefined();
    }
    expect(byTestId(tree, 'home.actions.toggle')).toHaveLength(0);
  });

  it('controls without an rbac code show even with no can', () => {
    const tree = mount({});
    for (const c of ungated) expect(pressables(tree, c).length, c.testID).toBeGreaterThan(0);
  });

  it('with every code granted but no callbacks, every control shows, looks the same, and presses to the note', () => {
    const tree = mount({ can: allowAll });
    for (const c of TOHFA_HOME_CONTROLS) {
      const nodes = pressables(tree, c);
      expect(nodes.length, c.testID).toBeGreaterThan(0);
      expect(nodes[0]!.props.disabled, c.testID).toBeFalsy();
      alertSpy().mockClear();
      act(() => nodes[0]!.props.onPress());
      expect(alertSpy(), c.testID).toHaveBeenCalledTimes(1);
      expect(alertSpy()).toHaveBeenCalledWith(CATALOGUE['tohfaHome.notAvailable.title'], CATALOGUE['tohfaHome.notAvailable.body']);
    }
  });

  for (const control of TOHFA_HOME_CONTROLS) {
    const rule = control.code === undefined ? 'always shows (no rbac code)' : `shows only with ${control.code}`;
    it(`${control.testID} ${rule}; unwired it shows the note, wired it calls ${control.callback}`, () => {
      const spy = vi.fn();
      if (control.code !== undefined) {
        const code = control.code;
        const withoutCode = mount({ can: (c) => c !== code && c.length > 0, [control.callback]: spy });
        expect(pressables(withoutCode, control)).toHaveLength(0);
      }
      const grant: Can = (c) => c === control.code;

      const unwired = mount({ can: grant });
      const unwiredNodes = pressables(unwired, control);
      expect(unwiredNodes.length).toBeGreaterThan(0);
      alertSpy().mockClear();
      act(() => unwiredNodes[0]!.props.onPress());
      expect(alertSpy()).toHaveBeenCalledTimes(1);
      expect(spy).not.toHaveBeenCalled();

      const wired = mount({ can: grant, [control.callback]: spy });
      const nodes = pressables(wired, control);
      expect(nodes.length).toBeGreaterThan(0);
      alertSpy().mockClear();
      act(() => nodes[0]!.props.onPress());
      expect(spy).toHaveBeenCalledTimes(1);
      expect(alertSpy()).not.toHaveBeenCalled();
    });
  }

  it('the KPI toggle reveals the remaining cards', () => {
    const tree = mount({ can: allowAll });
    const toggle = byTestId(tree, 'home.kpi.toggle')[0]!;
    act(() => toggle.props.onPress());
    expect(kpiCards(tree).length).toBe(11);
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
const FILES = fs.existsSync(HOME)
  ? fs
      .readdirSync(HOME)
      .filter((n) => /\.tsx?$/.test(n))
      .map((n) => path.join(HOME, n))
  : [];

describe('tohfa home: source guard', () => {
  it('the folder exists with the screen and its logic; every file <= 800 lines', () => {
    const names = FILES.map((f) => path.basename(f));
    expect(names).toContain('TohfaHomeScreen.tsx');
    expect(names).toContain('tohfaHomeLogic.ts');
    for (const f of FILES) expect(read(f).split('\n').length, f).toBeLessThanOrEqual(800);
  });

  it('no role strings, role props, fail-open checks or fixture constants', () => {
    for (const f of FILES) {
      const src = code(read(f));
      expect(src, f).not.toMatch(/SUPER_ADMIN|TOHFA_ADMIN|FARMER_ADMIN|MAIN_WH_ADMIN|SUB_WH_ADMIN/);
      expect(src, f).not.toMatch(/\brole\s*(===|!==)/);
      expect(src, f).not.toMatch(/\brole\??\s*:/);
      expect(src, f).not.toMatch(/\|\|\s*!user/);
      expect(src, f).not.toMatch(/=>\s*true\b/);
      expect(src, f).not.toMatch(/as any/);
      expect(src, f).not.toMatch(/MOCK_|FIXTURE|SAMPLE_|DEMO_|INITIAL_/);
      expect(src, f).not.toMatch(/fetchMe|Rajesh/);
    }
  });

  it('no raw colour, numeric fontSize, fontFamily, or raw English between JSX tags', () => {
    for (const f of FILES) {
      const src = code(read(f));
      expect(src, f).not.toMatch(/(['"`])#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3,4})\1/);
      expect(src, f).not.toMatch(/\brgba?\s*\(/);
      expect(src, f).not.toMatch(/fontSize\s*:\s*[0-9]/);
      expect(src, f).not.toMatch(/fontFamily\s*:/);
      if (f.endsWith('.tsx')) expect(src, f).not.toMatch(/>\s*[A-Z][a-z]+(?: [A-Za-z&]+)*\s*</);
    }
  });

  it('every t() key is a tohfaHome.* key present in tohfaHome.en.json; ta is {}', () => {
    const used = new Set<string>();
    for (const f of FILES) for (const m of code(read(f)).matchAll(/'(tohfaHome\.[A-Za-z0-9_.]+)'/g)) used.add(m[1]!);
    expect(used.size).toBeGreaterThan(30);
    for (const key of used) expect(CATALOGUE[key], key).toBeTruthy();
    for (const key of Object.keys(CATALOGUE)) expect(key).toMatch(/^tohfaHome\./);
    expect((en as Record<string, string>)['tohfaHome.header.brand']).toBe(CATALOGUE['tohfaHome.header.brand']);
    expect(JSON.parse(read(path.join(ADMIN, 'i18n/tohfaHome.ta.json')))).toEqual({});
  });

  it('every gated control code exists in docs/rbac.json', () => {
    const rbac = read(path.join(ADMIN, '../../../../../docs/rbac.json'));
    for (const c of gated) expect(rbac, c.code).toContain(`"${c.code}"`);
  });

  it("uses mobile-ui's SafeAreaView and ScreenStatusBar, never the react-native ones", () => {
    const screen = code(read(path.join(HOME, 'TohfaHomeScreen.tsx')));
    expect(screen).toMatch(/import \{[^}]*SafeAreaView[^}]*\} from '@tohfa\/mobile-ui'/);
    expect(screen).toMatch(/import \{[^}]*ScreenStatusBar[^}]*\} from '@tohfa\/mobile-ui'/);
    for (const f of FILES) expect(code(read(f)), f).not.toMatch(/import \{[^}]*\b(SafeAreaView|StatusBar)\b[^}]*\} from 'react-native'/);
  });
});
