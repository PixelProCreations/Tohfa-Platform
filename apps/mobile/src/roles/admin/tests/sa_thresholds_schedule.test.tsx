/**
 * Super Admin threshold + market-schedule screens (ported from
 * origin/Superadmin-main): ComplianceTierThresholdsScreen, AlertThresholdsScreen,
 * ScheduleMarketOpenCloseScreen. No backend source exists for any of them (no
 * list/read endpoint for alert thresholds, no schedule endpoint), so these tests
 * pin: every piece of design chrome renders, none of the design's fixture
 * strings do, unsourced values show the dash, and the permission / host-callback
 * gating of the actions.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance } from 'react-test-renderer';

vi.mock('react-native', () => ({
  Alert: { alert: vi.fn() },
  Modal: 'Modal',
  Platform: { OS: 'android', select: (o: Record<string, unknown>) => o['android'] ?? o['default'] },
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, absoluteFill: {} },
  Switch: 'Switch',
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Ellipse: 'Ellipse',
  Line: 'Line',
  Path: 'Path',
  Rect: 'Rect',
}));

import {
  ComplianceTierThresholdsScreen,
  type AlertThresholdData,
} from '../screens/dashboard/ComplianceTierThresholdsScreen';
import { AlertThresholdsScreen, type AlertThresholdItem } from '../screens/dashboard/AlertThresholdsScreen';
import {
  ScheduleMarketOpenCloseScreen,
  type MarketScheduleData,
} from '../screens/dashboard/ScheduleMarketOpenCloseScreen';
import { makeCan } from '../permissions/can';
import { en, t } from '../i18n';
import { ADMIN_NO_VALUE } from '../utils/noValue';

const ADMIN = path.join(__dirname, '..');
const NONE = makeCan([]);
const ALERT_CFG = makeCan(['alert.threshold.configure']);
const TIER_CFG = makeCan(['audit.tier.configure_thresholds']);
const MARKET = makeCan(['sales.market_day.view']);

function textOf(node: ReactTestInstance | string): string {
  if (typeof node === 'string') return node;
  return node.children.map(textOf).join('');
}
const allTexts = (tree: renderer.ReactTestRenderer): string[] =>
  tree.root.findAll((n) => String(n.type) === 'Text').map((n) => textOf(n));
const allText = (tree: renderer.ReactTestRenderer) => allTexts(tree).join('\n');

function button(tree: renderer.ReactTestRenderer, label: string): ReactTestInstance {
  const hits = tree.root.findAll((n) => String(n.type) === 'TouchableOpacity' && textOf(n) === label);
  expect(hits.length, `button "${label}"`).toBeGreaterThan(0);
  return hits[0]!;
}
async function tap(tree: renderer.ReactTestRenderer, label: string) {
  const b = button(tree, label);
  await act(async () => {
    b.props.onPress();
  });
}
const enabled = (b: ReactTestInstance) => b.props.disabled !== true;

function mountTree(el: React.ReactElement) {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(el);
  });
  return tree;
}

const FIXTURE_STRINGS = ['Low Stock Alert', 'Get alerted', 'Demo Super Admin', 'Effective 15 Oct 2026', 'Reason Good for farmer'];

describe('ComplianceTierThresholdsScreen', () => {
  const mount = (over: Partial<React.ComponentProps<typeof ComplianceTierThresholdsScreen>> = {}) =>
    mountTree(<ComplianceTierThresholdsScreen can={ALERT_CFG} onBack={() => undefined} {...over} />);

  it('renders every design section, field, option list, role and both action buttons', () => {
    const text = allText(mount());
    for (const key of [
      'saThresholds.compliance.title',
      'saThresholds.section.basic',
      'saThresholds.section.trigger',
      'saThresholds.section.notify',
      'saThresholds.section.status',
      'saThresholds.field.name',
      'saThresholds.field.description',
      'saThresholds.field.category',
      'saThresholds.field.condition',
      'saThresholds.field.value',
      'saThresholds.field.appliesTo',
      'saThresholds.field.notifyTo',
      'saThresholds.applies.all',
      'saThresholds.applies.specific',
      'saThresholds.status.active',
      'saThresholds.action.cancel',
      'saThresholds.action.save',
      'saThresholds.category.auditCompliance',
      'saThresholds.category.systemIntegration',
      'saThresholds.condition.auditBelow',
      'saThresholds.unit.percent',
      'saThresholds.role.tohfaAdmins',
      'saThresholds.role.farmer',
    ] as const) {
      expect(text, key).toContain(t(key));
    }
    expect(text).toContain(t('saThresholds.counter', { count: 0, max: 250 }));
  });

  it('opens empty: none of the design fixture text, and unchosen pickers show the dash', () => {
    const tree = mount();
    const text = allText(tree);
    for (const s of FIXTURE_STRINGS) expect(text).not.toContain(s);
    // category, condition, value, unit
    expect(allTexts(tree).filter((x) => x === ADMIN_NO_VALUE).length).toBe(4);
  });

  it('Save is drawn but disabled when empty, without a permission, and without onSave', async () => {
    const full: AlertThresholdData = {
      name: 'N', description: 'D', category: 'Stock', condition: 'Aging days exceed', thresholdValue: '25',
      thresholdUnit: 'Days', appliesTo: 'all', notifyRoles: ['Farmer'], isActive: true,
    };
    const save = t('saThresholds.action.save');
    expect(enabled(button(mount({ onSave: vi.fn() }), save))).toBe(false);
    expect(enabled(button(mount({ can: NONE, initialData: full, onSave: vi.fn() }), save))).toBe(false);
    expect(enabled(button(mount({ initialData: full }), save))).toBe(false);
  });

  it('Save hands the form to the host with either threshold permission, then goes back', async () => {
    const full: AlertThresholdData = {
      id: 'x1', name: 'N', description: 'D', category: 'Stock', condition: 'Aging days exceed', thresholdValue: '25',
      thresholdUnit: 'Days', appliesTo: 'specific', notifyRoles: ['Farmer'], isActive: false,
    };
    for (const can of [ALERT_CFG, TIER_CFG]) {
      const onSave = vi.fn();
      const onBack = vi.fn();
      const tree = mount({ can, initialData: full, onSave, onBack });
      await tap(tree, t('saThresholds.action.save'));
      expect(onSave).toHaveBeenCalledWith(full);
      expect(onBack).toHaveBeenCalled();
    }
  });

  it('picking from the menus fills the pickers', async () => {
    const onSave = vi.fn();
    const tree = mount({ onSave });
    act(() => {
      tree.root.findByProps({ placeholder: t('saThresholds.placeholder.name') }).props.onChangeText('Rule');
      tree.root.findByProps({ placeholder: t('saThresholds.placeholder.description') }).props.onChangeText('Why');
    });
    // The menu items live in the (always rendered under the mock) modals: first match is the picker menu item.
    await tap(tree, t('saThresholds.category.stockAging'));
    await tap(tree, t('saThresholds.condition.stockGt'));
    await tap(tree, '500');
    await tap(tree, t('saThresholds.unit.liters'));
    await tap(tree, t('saThresholds.role.customer'));
    await tap(tree, t('saThresholds.action.save'));
    expect(onSave).toHaveBeenCalledWith({
      name: 'Rule', description: 'Why', category: 'Stock Aging', condition: 'Stock is greater than',
      thresholdValue: '500', thresholdUnit: 'Liters', appliesTo: 'all', notifyRoles: ['Customer'], isActive: true,
    });
  });
});

describe('AlertThresholdsScreen', () => {
  const item = (over: Partial<AlertThresholdItem> = {}): AlertThresholdItem => ({
    id: 'a1', title: 'Rule A', scoreOrCondition: 'Cond A', reason: 'Because A', updatedMeta: 'Meta A',
    isActive: true, category: 'Stock', ...over,
  });
  const mount = (over: Partial<React.ComponentProps<typeof AlertThresholdsScreen>> = {}) =>
    mountTree(
      <AlertThresholdsScreen
        can={ALERT_CFG}
        onBack={() => undefined}
        onAddThreshold={() => undefined}
        onEditThreshold={() => undefined}
        {...over}
      />,
    );

  it('with no data: the chrome (title, search, filter, count, + Add tiers) and the empty state, no fixtures', () => {
    const tree = mount();
    const text = allText(tree);
    expect(text).toContain(t('saThresholds.list.title'));
    expect(text).toContain(t('saThresholds.list.count', { shown: 0, total: 0 }));
    expect(text).toContain(t('saThresholds.list.empty'));
    expect(text).toContain(t('saThresholds.list.add'));
    expect(tree.root.findAll((n) => String(n.type) === 'TextInput').length).toBe(1);
    expect(tree.root.findAll((n) => n.props.accessibilityLabel === t('saThresholds.list.filter')).length).toBeGreaterThan(0);
    for (const s of [...FIXTURE_STRINGS, 'Audit', 'Warehouse Capacity Limit']) expect(text).not.toContain(s);
  });

  it('"+ Add tiers" needs a threshold permission and calls the host', async () => {
    const onAdd = vi.fn();
    expect(enabled(button(mount({ can: NONE }), t('saThresholds.list.add')))).toBe(false);
    const tree = mount({ onAddThreshold: onAdd, can: TIER_CFG });
    await tap(tree, t('saThresholds.list.add'));
    expect(onAdd).toHaveBeenCalled();
  });

  it('lists host thresholds, searches them, toggles status and edits', async () => {
    const onToggle = vi.fn();
    const onEdit = vi.fn();
    const tree = mount({
      thresholds: [item(), item({ id: 'a2', title: 'Rule B', scoreOrCondition: 'Cond B', isActive: false })],
      onToggleActive: onToggle,
      onEditThreshold: onEdit,
    });
    const text = allText(tree);
    expect(text).toContain(t('saThresholds.list.count', { shown: 2, total: 2 }));
    expect(text).toContain('Rule A');
    expect(text).toContain(t('saThresholds.status.inactive'));

    await tap(tree, t('saThresholds.list.deactivate'));
    expect(onToggle).toHaveBeenCalledWith('a1', false);
    await tap(tree, t('saThresholds.list.activate'));
    expect(onToggle).toHaveBeenCalledWith('a2', true);

    await tap(tree, t('saThresholds.list.edit'));
    expect(onEdit).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'a1', name: 'Rule A', category: 'Stock', thresholdValue: '', notifyRoles: [] }),
    );

    act(() => {
      tree.root.findAll((n) => String(n.type) === 'TextInput')[0]!.props.onChangeText('rule b');
    });
    const after = allText(tree);
    expect(after).toContain(t('saThresholds.list.count', { shown: 1, total: 2 }));
    expect(after).not.toContain('Rule A');
  });

  it('Deactivate needs a permission and a host callback; Edit needs a permission', () => {
    const list = [item()];
    expect(enabled(button(mount({ thresholds: list, can: NONE, onToggleActive: vi.fn() }), t('saThresholds.list.deactivate')))).toBe(false);
    expect(enabled(button(mount({ thresholds: list }), t('saThresholds.list.deactivate')))).toBe(false);
    expect(enabled(button(mount({ thresholds: list, can: NONE }), t('saThresholds.list.edit')))).toBe(false);
    expect(enabled(button(mount({ thresholds: list }), t('saThresholds.list.edit')))).toBe(true);
  });
});

describe('ScheduleMarketOpenCloseScreen', () => {
  const mount = (over: Partial<React.ComponentProps<typeof ScheduleMarketOpenCloseScreen>> = {}) =>
    mountTree(<ScheduleMarketOpenCloseScreen can={MARKET} onBack={() => undefined} {...over} />);

  it('renders the whole form, the summary card and both buttons; date and time are the dash, not fixtures', () => {
    const tree = mount();
    const text = allText(tree);
    for (const key of [
      'saSchedule.title', 'saSchedule.scheduleOpen', 'saSchedule.scheduleClose', 'saSchedule.infoOpen',
      'saSchedule.openDate', 'saSchedule.openTime', 'saSchedule.repeat', 'saSchedule.optional',
      'saSchedule.summary', 'saSchedule.action', 'saSchedule.date', 'saSchedule.time', 'saSchedule.cancel',
      'saSchedule.submitOpen', 'saSchedule.selectTime', 'saSchedule.selectDate',
      'saSchedule.repeat.oneTime',
    ] as const) {
      expect(text, key).toContain(t(key));
    }
    expect(allTexts(tree)).toContain(t('saSchedule.summaryValue', { value: ADMIN_NO_VALUE }));
    // date + time inputs and their summary lines: four dashes.
    expect(allTexts(tree).filter((x) => x === ADMIN_NO_VALUE || x === t('saSchedule.summaryValue', { value: ADMIN_NO_VALUE })).length).toBe(4);
    for (const s of ['15 Oct 2026', '14 Oct 2026']) expect(allTexts(tree).filter((x) => x.includes(s))).toEqual([]);
  });

  it('offers the next seven days and hourly 06:00 to 22:00 slots', () => {
    const tree = mount();
    const modalOptions = tree.root
      .findAll((n) => String(n.type) === 'Modal')
      .map((m) => m.findAll((n) => String(n.type) === 'TouchableOpacity' && n.props.activeOpacity === 0.7).map((n) => textOf(n)));
    expect(modalOptions[0]!.length).toBe(17);
    expect(modalOptions[0]![0]).toBe('06:00 AM');
    expect(modalOptions[0]![16]).toBe('10:00 PM');
    expect(modalOptions[1]!.length).toBe(7);
  });

  it('switching to Schedule Close changes the labels, banner, action and submit', async () => {
    const tree = mount();
    await tap(tree, t('saSchedule.scheduleClose'));
    const text = allText(tree);
    for (const key of ['saSchedule.infoClose', 'saSchedule.closeDate', 'saSchedule.closeTime', 'saSchedule.actionClose'] as const) {
      expect(text, key).toContain(t(key).replace(/^/, ''));
    }
    expect(text).toContain(t('saSchedule.submitClose'));
  });

  it('submit is drawn but disabled without a date and time, without the permission, and without onSave', async () => {
    const submit = t('saSchedule.submitOpen');
    const withDateTime = { initialDate: '16 Nov 2026', initialTime: '09:00 AM' };
    // Both Schedule Open labels exist (tab and submit): the submit is the last one.
    const submitBtn = (tree: renderer.ReactTestRenderer) =>
      tree.root.findAll((n) => String(n.type) === 'TouchableOpacity' && textOf(n) === submit).at(-1)!;
    expect(enabled(submitBtn(mount({ onSave: vi.fn() })))).toBe(false);
    expect(enabled(submitBtn(mount({ ...withDateTime, can: NONE, onSave: vi.fn() })))).toBe(false);
    expect(enabled(submitBtn(mount(withDateTime)))).toBe(false);
    expect(enabled(submitBtn(mount({ ...withDateTime, onSave: vi.fn() })))).toBe(true);
  });

  it('choosing a date, time and repeat, then submitting, hands them to the host', async () => {
    const onSave = vi.fn();
    const onBack = vi.fn();
    const tree = mount({ onSave, onBack });
    const dateOption = tree.root
      .findAll((n) => String(n.type) === 'Modal')[1]!
      .findAll((n) => String(n.type) === 'TouchableOpacity' && n.props.activeOpacity === 0.7)[0]!;
    await act(async () => dateOption.props.onPress());
    await tap(tree, '08:00 AM');
    await tap(tree, t('saSchedule.repeat.oneTime'));
    await tap(tree, t('saSchedule.repeat.weekly'));
    const submit = tree.root.findAll((n) => String(n.type) === 'TouchableOpacity' && textOf(n) === t('saSchedule.submitOpen')).at(-1)!;
    await act(async () => submit.props.onPress());
    const arg = onSave.mock.calls[0]![0] as MarketScheduleData;
    expect(arg.mode).toBe('open');
    expect(arg.time).toBe('08:00 AM');
    expect(arg.repeat).toBe('Weekly');
    expect(arg.date).toMatch(/^\d{1,2} [A-Z][a-z]{2} \d{4}$/);
    expect(onBack).toHaveBeenCalled();
  });
});

describe('source guards', () => {
  const dir = path.join(ADMIN, 'screens/dashboard');
  const files = [
    'ComplianceTierThresholdsScreen.tsx',
    'complianceTierThresholdsStyles.ts',
    'thresholdOptions.ts',
    'AlertThresholdsScreen.tsx',
    'ScheduleMarketOpenCloseScreen.tsx',
    'scheduleMarketStyles.ts',
  ];
  for (const f of files) {
    it(`${f}: no hex/rgba, numeric fontSize, fontFamily, any, mobile-ui import or role string; <= 800 lines`, () => {
      const src = fs.readFileSync(path.join(dir, f), 'utf8');
      expect(src).not.toMatch(/['"`]#[0-9A-Fa-f]{3,8}['"`]/);
      expect(src).not.toMatch(/rgba?\s*\(/);
      expect(src).not.toMatch(/fontSize\s*:\s*\d/);
      expect(src).not.toMatch(/fontFamily/);
      expect(src).not.toMatch(/\bas any\b/);
      expect(src).not.toMatch(/@tohfa\/mobile-ui/);
      expect(src).not.toMatch(/SUPER_ADMIN|TOHFA_ADMIN/);
      expect(src.split('\n').length).toBeLessThanOrEqual(800);
    });
  }

  it('every threshold / schedule t() key exists in the catalogue and is registered', () => {
    const used = new Set<string>();
    for (const f of files) {
      const src = fs.readFileSync(path.join(dir, f), 'utf8');
      for (const m of src.matchAll(/['"`](sa(?:Thresholds|Schedule)\.[A-Za-z.]+)['"`]/g)) used.add(m[1]!);
    }
    expect(used.size).toBeGreaterThan(50);
    for (const k of used) expect(Object.prototype.hasOwnProperty.call(en, k), k).toBe(true);
  });

  it('the screens check only permission codes that exist in docs/rbac.json', () => {
    const rbac = JSON.parse(fs.readFileSync(path.join(ADMIN, '../../../../../docs/rbac.json'), 'utf8')) as {
      permissions: { code: string }[];
    };
    const codes = new Set(rbac.permissions.map((p) => p.code));
    for (const c of ['alert.threshold.configure', 'audit.tier.configure_thresholds', 'sales.market_day.view']) {
      expect(codes.has(c), c).toBe(true);
    }
    expect(codes.has('market.schedule.manage')).toBe(false);
  });
});
