/**
 * AdminMoreMenuScreen (screens/more/): renders the permission-gated rows,
 * calls the host's handlers, confirms logout, and the source guard (no role
 * strings, no hex, no numeric fontSize, no fixtures, files <= 800 lines,
 * every t() key exists in moreMenu.en.json, mobile-ui wrappers).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Alert } from 'react-native';
import type { Can } from '../permissions/can';

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
vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Path: 'Path',
  Rect: 'Rect',
  Line: 'Line',
}));
vi.mock('@tohfa/mobile-ui', () => ({ ScreenStatusBar: 'ScreenStatusBar', SafeAreaView: 'SafeAreaView' }));

afterEach(() => vi.clearAllMocks());

import { BackHandler } from 'react-native';
import { AdminMoreMenuScreen, type MoreRowId } from '../screens/more/AdminMoreMenuScreen';
import { en } from '../i18n';

const ADMIN = path.join(__dirname, '..');
const MORE = path.join(ADMIN, 'screens/more');
const CATALOGUE = JSON.parse(fs.readFileSync(path.join(ADMIN, 'i18n/moreMenu.en.json'), 'utf8')) as Record<string, string>;

type Props = React.ComponentProps<typeof AdminMoreMenuScreen>;

function mount(props: Partial<Props> & { can?: Can }) {
  const full = {
    onBack: vi.fn(),
    handlers: {},
    onLogout: vi.fn(),
    ...props,
  } as Props;
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<AdminMoreMenuScreen {...full} />);
  });
  return { tree, props: full };
}

function textsOf(node: renderer.ReactTestInstance): string {
  return node
    .findAllByType('Text' as never)
    .map((n) => [n.props.children].flat().join(''))
    .join('|');
}

function rowLabels(tree: renderer.ReactTestRenderer): string[] {
  return tree.root
    .findAll((n) => (n.type as unknown) === 'TouchableOpacity' && n.props.testID?.startsWith?.('moreMenu.row.'))
    .map((n) => textsOf(n));
}

function pressRow(tree: renderer.ReactTestRenderer, id: MoreRowId) {
  const row = tree.root.findAll((n) => (n.type as unknown) === 'TouchableOpacity' && n.props.testID === `moreMenu.row.${id}`)[0];
  if (!row) throw new Error(`row ${id} not rendered`);
  act(() => row.props.onPress());
}

const allowAll: Can = (code) => code.length > 0;

describe('AdminMoreMenuScreen', () => {
  it('renders the More title', () => {
    const { tree } = mount({ can: allowAll });
    expect(textsOf(tree.root)).toContain(en['moreMenu.title' as keyof typeof en]);
  });

  it('without can shows only Settings & Profile and Logout', () => {
    const handlers = { farmers: vi.fn(), pricing: vi.fn(), settings: vi.fn() };
    const { tree } = mount({ handlers });
    expect(rowLabels(tree)).toEqual([CATALOGUE['moreMenu.row.settings'], CATALOGUE['moreMenu.row.logout']]);
  });

  it('shows a gated row with its code (no handler needed), in the design label', () => {
    // No handler passed — row still shows and toasts "Not available yet" on press
    const { tree } = mount({ can: (c) => c === 'pricing.fair_price.view', handlers: {} });
    expect(rowLabels(tree)).toContain(CATALOGUE['moreMenu.row.pricing']);
    expect(CATALOGUE['moreMenu.row.pricing']).toBe('Market & Pricing');
  });

  it('pressing a row with no handler toasts "Not available yet"', () => {
    const alertMock = vi.mocked(Alert.alert);
    const { tree } = mount({ can: (c) => c === 'pricing.fair_price.view', handlers: {} });
    pressRow(tree, 'pricing');
    expect(alertMock).toHaveBeenCalledTimes(1);
    // The title comes from tohfaHome.en.json 'tohfaHome.notAvailable.title'
    expect(alertMock.mock.calls[0]?.[0]).toBe('Not available yet');
  });

  it('hiddenRows hides a row that has code', () => {
    const { tree } = mount({ can: allowAll, handlers: { pricing: vi.fn(), farmers: vi.fn() }, hiddenRows: ['pricing'] });
    expect(rowLabels(tree)).not.toContain(CATALOGUE['moreMenu.row.pricing']);
    expect(rowLabels(tree)).toContain(CATALOGUE['moreMenu.row.farmers']);
  });

  it('switch_role appears only with canSwitchRole', () => {
    const handlers = { switch_role: vi.fn() };
    expect(rowLabels(mount({ can: allowAll, handlers }).tree)).not.toContain(CATALOGUE['moreMenu.row.switch_role']);
    expect(rowLabels(mount({ can: allowAll, handlers, canSwitchRole: true }).tree)).toContain(CATALOGUE['moreMenu.row.switch_role']);
  });

  it('pressing a row calls its handler', () => {
    const handlers = { farmers: vi.fn(), settings: vi.fn() };
    const { tree } = mount({ can: allowAll, handlers });
    pressRow(tree, 'farmers');
    expect(handlers.farmers).toHaveBeenCalledTimes(1);
    pressRow(tree, 'settings');
    expect(handlers.settings).toHaveBeenCalledTimes(1);
  });

  it('logout asks for confirmation, then calls onLogout only on confirm', () => {
    const { tree, props } = mount({ can: allowAll });
    pressRow(tree, 'logout');
    expect(props.onLogout).not.toHaveBeenCalled();
    const alertMock = vi.mocked(Alert.alert);
    expect(alertMock).toHaveBeenCalledTimes(1);
    const [title, message, buttons] = alertMock.mock.calls[0]!;
    expect(title).toBe(CATALOGUE['moreMenu.logout.confirmTitle']);
    expect(message).toBe(CATALOGUE['moreMenu.logout.confirmMessage']);
    const confirm = buttons?.find((b) => b.style === 'destructive');
    const cancel = buttons?.find((b) => b.style === 'cancel');
    expect(cancel?.text).toBe(CATALOGUE['moreMenu.logout.cancel']);
    expect(confirm?.text).toBe(CATALOGUE['moreMenu.logout.confirm']);
    act(() => confirm?.onPress?.());
    expect(props.onLogout).toHaveBeenCalledTimes(1);
  });

  it('the back arrow and the Android hardware back both call onBack', () => {
    const { tree, props } = mount({ can: allowAll });
    const back = tree.root.findAll((n) => (n.type as unknown) === 'TouchableOpacity' && n.props.testID === 'moreMenu.back')[0];
    act(() => back?.props.onPress());
    expect(props.onBack).toHaveBeenCalledTimes(1);
    const add = vi.mocked(BackHandler.addEventListener);
    expect(add).toHaveBeenCalledWith('hardwareBackPress', expect.any(Function));
    const listener = add.mock.calls[0]![1] as () => boolean;
    expect(listener()).toBe(true);
    expect(props.onBack).toHaveBeenCalledTimes(2);
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
const FILES = fs.existsSync(MORE)
  ? fs
      .readdirSync(MORE)
      .filter((n) => /\.tsx?$/.test(n))
      .map((n) => path.join(MORE, n))
  : [];

describe('more menu: source guard', () => {
  it('the folder exists with the screen and the row logic; every file <= 800 lines', () => {
    const names = FILES.map((f) => path.basename(f));
    expect(names).toContain('AdminMoreMenuScreen.tsx');
    expect(names).toContain('moreMenuRows.ts');
    for (const f of FILES) expect(read(f).split('\n').length, f).toBeLessThanOrEqual(800);
  });

  it('no role strings, role props, or fail-open permission checks', () => {
    for (const f of FILES) {
      const src = code(read(f));
      expect(src, f).not.toMatch(/SUPER_ADMIN|TOHFA_ADMIN|FARMER_ADMIN|MAIN_WH_ADMIN|SUB_WH_ADMIN/);
      expect(src, f).not.toMatch(/\brole\s*(===|!==)/);
      expect(src, f).not.toMatch(/\brole\??\s*:/);
      expect(src, f).not.toMatch(/isFarmerAdmin|isTohfaAdmin/);
      expect(src, f).not.toMatch(/\|\|\s*!user/);
      expect(src, f).not.toMatch(/=>\s*true\b/);
      expect(src, f).not.toMatch(/as any/);
    }
  });

  it('no raw colour, numeric fontSize or fontFamily', () => {
    for (const f of FILES) {
      const src = code(read(f));
      expect(src, f).not.toMatch(/(['"`])#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3,4})\1/);
      expect(src, f).not.toMatch(/\brgba?\s*\(/);
      expect(src, f).not.toMatch(/fontSize\s*:\s*[0-9]/);
      expect(src, f).not.toMatch(/fontFamily\s*:/);
    }
  });

  it('no fixture data and no raw English between JSX tags', () => {
    for (const f of FILES) {
      const src = code(read(f));
      expect(src, f).not.toMatch(/MOCK_|FIXTURE|SAMPLE_|INITIAL_/);
      expect(src, f).not.toMatch(/onItemSelect|onSelectOption/);
      if (f.endsWith('.tsx')) expect(src, f).not.toMatch(/>\s*[A-Z][a-z]+(?: [A-Za-z&]+)*\s*</);
    }
  });

  it('every t() key is a moreMenu.* key present in moreMenu.en.json; ta is {}', () => {
    const used = new Set<string>();
    for (const f of FILES) for (const m of code(read(f)).matchAll(/'(moreMenu\.[A-Za-z0-9_.]+)'/g)) used.add(m[1]!);
    expect(used.size).toBeGreaterThan(15);
    for (const key of used) expect(CATALOGUE[key], key).toBeTruthy();
    for (const key of Object.keys(CATALOGUE)) expect(key).toMatch(/^moreMenu\./);
    expect((en as Record<string, string>)['moreMenu.title']).toBe(CATALOGUE['moreMenu.title']);
    expect(JSON.parse(read(path.join(ADMIN, 'i18n/moreMenu.ta.json')))).toEqual({});
  });

  it("uses mobile-ui's SafeAreaView and ScreenStatusBar, never the react-native ones", () => {
    const screen = code(read(path.join(MORE, 'AdminMoreMenuScreen.tsx')));
    expect(screen).toMatch(/import \{[^}]*SafeAreaView[^}]*\} from '@tohfa\/mobile-ui'/);
    expect(screen).toMatch(/import \{[^}]*ScreenStatusBar[^}]*\} from '@tohfa\/mobile-ui'/);
    for (const f of FILES) expect(code(read(f)), f).not.toMatch(/import \{[^}]*\b(SafeAreaView|StatusBar)\b[^}]*\} from 'react-native'/);
  });
});
