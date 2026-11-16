/**
 * Super Admin System Settings & Audit Log flow (screens/dashboard/
 * SystemSettingsFlow.tsx + system-settings/), ported from origin/Superadmin-main.
 * Rendered with react-test-renderer and a real QueryClient against a mocked
 * api/auditLog client. Pins:
 *   - the hub draws the design's five rows, each only with its rbac code;
 *   - the audit log is GET /admin/audit-log only, never without auditlog.view;
 *   - every sub-screen renders its chrome; unsourced values are the dash;
 *   - none of the design's fixture records render anywhere;
 *   - writes with no route are drawn but disabled; host callbacks enable them;
 *   - source guards (tokens only, no role names, t() keys exist, <= 800 lines).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
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

const api = vi.hoisted(() => ({ listAuditLog: vi.fn() }));
vi.mock('../api/auditLog', () => ({ listAuditLog: api.listAuditLog }));

import { Alert } from 'react-native';
import { SystemSettingsFlow, type SystemSettingsFlowProps } from '../screens/dashboard/SystemSettingsFlow';
import { IntegrationDetailView, IntegrationFormScreen } from '../screens/dashboard/system-settings';
import type { AuditLogEntryDto } from '../api/auditLog';
import { makeCan } from '../permissions/can';
import { en, t } from '../i18n';
import { ADMIN_NO_VALUE } from '../utils/noValue';

const ADMIN = path.join(__dirname, '..');
const DIR = path.join(ADMIN, 'screens/dashboard/system-settings');
const HOST = path.join(ADMIN, 'screens/dashboard/SystemSettingsFlow.tsx');

const ALL = makeCan(['system.config.manage', 'auditlog.view', 'auditlog.export', 'system.integration_key.manage', 'system.db_export.raw']);

function entry(over: Partial<AuditLogEntryDto> = {}): AuditLogEntryDto {
  return {
    id: '7f1c2a90-0000-4000-8000-000000000001',
    actorId: 'ab12cd34-0000-4000-8000-000000000009',
    actorType: 'USER',
    actorRole: 'SUPER_ADMIN',
    action: 'payout.approve',
    entityType: 'payout',
    entityId: '99887766-0000-4000-8000-000000000002',
    warehouseId: null,
    outcome: 'ALLOWED',
    before: { status: 'PENDING' },
    after: { status: 'APPROVED' },
    changedFields: ['status'],
    correlationId: null,
    ip: '10.1.2.3',
    at: '2026-11-10T05:54:00.000Z',
    ...over,
  };
}
const PAYOUT = entry();
const CREATED = entry({
  id: '7f1c2a90-0000-4000-8000-000000000002',
  action: 'farmer.create',
  entityType: 'farmer',
  ip: null,
  before: null,
  after: { name: 'Kavya' },
  changedFields: null,
});
const page = (items: AuditLogEntryDto[], hasMore = false) => ({ items, page: { nextCursor: hasMore ? 'c1' : null, hasMore } });

const FIXTURES = [
  'LOG-2026', 'FAR-034', 'Ramesh', '103.82.45.20', 'Chrome', 'Safari', 'Coonoor', 'SA-001', '2,560',
  'Exotel', 'SendGrid', 'RazorpayX', 'ClearTax', 'Google Cloud', 'sk_live', 'rzp_live', 'SG.live',
  'exotel.com', 'tohfa.com/webhooks', '30 Minutes', '2.00', '₹ 10.00', '30 Days Before',
  '01 Oct 2026', '15 Sep 2026', '27 Oct 2026', 'Latency', '48ms',
];

function textOf(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(textOf);
  return (node.children ?? []).flatMap(textOf);
}
const allText = (tree: renderer.ReactTestRenderer) => textOf(tree.toJSON()).join('\n');
const byId = (tree: renderer.ReactTestRenderer, id: string) =>
  tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === id);
const one = (tree: renderer.ReactTestRenderer, id: string) => {
  const nodes = byId(tree, id);
  expect(nodes.length, id).toBeGreaterThan(0);
  return nodes[0]!;
};
const textIn = (tree: renderer.ReactTestRenderer, id: string) =>
  one(tree, id)
    .findAll((n) => (n.type as unknown) === 'Text')
    .flatMap((n) => n.children.filter((c): c is string => typeof c === 'string'))
    .join('');

async function flush() {
  for (let i = 0; i < 5; i += 1) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
}

async function render(el: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<QueryClientProvider client={client}>{el}</QueryClientProvider>);
  });
  await flush();
  return tree;
}
const mount = (props: Partial<SystemSettingsFlowProps> = {}) =>
  render(<SystemSettingsFlow can={ALL} onBack={() => undefined} {...props} />);

async function press(tree: renderer.ReactTestRenderer, id: string) {
  const node = one(tree, id);
  expect(node.props.disabled, `${id} disabled`).not.toBe(true);
  await act(async () => {
    node.props.onPress();
  });
  await flush();
}

beforeEach(() => {
  api.listAuditLog.mockResolvedValue(page([PAYOUT, CREATED]));
});
afterEach(() => vi.clearAllMocks());

describe('hub', () => {
  it('draws the five design rows with every code', async () => {
    const tree = await mount();
    const text = allText(tree);
    expect(text).toContain(t('saSettings.hub.title'));
    for (const id of ['config', 'auditLog', 'exportAuditLog', 'integrationKeys', 'emergencyExport']) one(tree, `saSettings.hub.row.${id}`);
    for (const k of ['config', 'auditLog', 'exportAuditLog', 'integrationKeys', 'emergencyExport'] as const) {
      expect(text).toContain(t(`saSettings.hub.${k}.title`));
    }
    expect(api.listAuditLog).not.toHaveBeenCalled();
  });

  it('gating: a row is drawn only with its rbac code', async () => {
    const tree = await mount({ can: makeCan(['auditlog.view']) });
    expect(byId(tree, 'saSettings.hub.row.auditLog')).toHaveLength(1);
    for (const id of ['config', 'exportAuditLog', 'integrationKeys', 'emergencyExport']) {
      expect(byId(tree, `saSettings.hub.row.${id}`), id).toHaveLength(0);
    }
  });

  it('gating: an initial screen without its code falls back to the hub, with no request', async () => {
    const tree = await mount({ can: makeCan([]), initialScreen: 'audit_logs' });
    one(tree, 'saSettings.hub');
    expect(api.listAuditLog).not.toHaveBeenCalled();
  });

  it('Export Audit Log is disabled without the host callback; with it, CSV exports the applied filters', async () => {
    let tree = await mount();
    expect(one(tree, 'saSettings.hub.row.exportAuditLog').props.disabled).toBe(true);
    const onExportAuditLog = vi.fn();
    tree = await mount({ onExportAuditLog });
    await press(tree, 'saSettings.hub.row.exportAuditLog');
    const buttons = vi.mocked(Alert.alert).mock.calls[0]![2] as { text: string; onPress?: () => void }[];
    buttons.find((b) => b.text === t('saSettings.exportAudit.csv'))!.onPress!();
    expect(onExportAuditLog).toHaveBeenCalledWith('csv', expect.objectContaining({ dateRange: 'all', action: null }));
  });
});

describe('audit log (GET /admin/audit-log, auditlog.view)', () => {
  it('lists the real entries only', async () => {
    const tree = await mount();
    await press(tree, 'saSettings.hub.row.auditLog');
    expect(api.listAuditLog).toHaveBeenCalledTimes(1);
    one(tree, `saSettings.auditLog.row.${PAYOUT.id}`);
    one(tree, `saSettings.auditLog.row.${CREATED.id}`);
    const text = allText(tree);
    expect(text).toContain('payout.approve');
    expect(text).toContain('farmer.create');
    expect(text).toContain('10 Nov 2026, 11:24 AM');
    for (const f of FIXTURES) expect(text).not.toContain(f);
  });

  it('empty page: the empty state inside the design chrome', async () => {
    api.listAuditLog.mockResolvedValue(page([]));
    const tree = await mount({ initialScreen: 'audit_logs' });
    expect(allText(tree)).toContain(t('saSettings.auditLog.emptyTitle'));
    one(tree, 'saSettings.auditLog.clearAll');
    one(tree, 'saSettings.auditLog.openFilter');
  });

  it('menu: all five items drawn; copy/downloads need host callbacks; delete is always disabled (BR-35 append-only)', async () => {
    const tree = await mount({ initialScreen: 'audit_logs' });
    await press(tree, `saSettings.auditLog.row.${PAYOUT.id}.menu`);
    for (const id of ['view', 'copyId', 'downloadJson', 'downloadPdf', 'delete']) one(tree, `saSettings.auditLog.menu.${id}`);
    expect(one(tree, 'saSettings.auditLog.menu.copyId').props.disabled).toBe(true);
    expect(one(tree, 'saSettings.auditLog.menu.downloadJson').props.disabled).toBe(true);
    expect(one(tree, 'saSettings.auditLog.menu.delete').props.disabled).toBe(true);
    await press(tree, 'saSettings.auditLog.menu.view');
    one(tree, 'saSettings.logDetails');
  });

  it('log details: every design row, real values, the dash where the entry has none', async () => {
    const onCopyText = vi.fn();
    const tree = await mount({ initialScreen: 'audit_logs', onCopyText });
    await act(async () => {
      one(tree, `saSettings.auditLog.row.${CREATED.id}`).findAll((n) => (n.type as unknown) === 'TouchableOpacity')[0]!.props.onPress();
    });
    await flush();
    expect(textIn(tree, 'saSettings.logDetails.logId.value')).toBe(CREATED.id);
    expect(textIn(tree, 'saSettings.logDetails.actionType.value')).toBe(t('saSettings.actionKind.create'));
    expect(textIn(tree, 'saSettings.logDetails.module.value')).toBe('farmer');
    expect(textIn(tree, 'saSettings.logDetails.performedBy.value')).toBe('AB12CD34 (Super Admin)');
    expect(textIn(tree, 'saSettings.logDetails.affectedUser.value')).toBe('99887766');
    expect(textIn(tree, 'saSettings.logDetails.ip.value')).toBe(ADMIN_NO_VALUE);
    expect(textIn(tree, 'saSettings.logDetails.device.value')).toBe(ADMIN_NO_VALUE);
    expect(textIn(tree, 'saSettings.logDetails.bullet.name')).toContain('Kavya');
    expect(one(tree, 'saSettings.logDetails.downloadJson').props.disabled).toBe(true);
    expect(one(tree, 'saSettings.logDetails.downloadPdf').props.disabled).toBe(true);
    await press(tree, 'saSettings.logDetails.logId.copy');
    expect(onCopyText).toHaveBeenCalledWith(CREATED.id);
  });

  it('log details: before -> after for a changed field', async () => {
    const tree = await mount({ initialScreen: 'audit_logs' });
    await act(async () => {
      one(tree, `saSettings.auditLog.row.${PAYOUT.id}`).findAll((n) => (n.type as unknown) === 'TouchableOpacity')[0]!.props.onPress();
    });
    await flush();
    expect(textIn(tree, 'saSettings.logDetails.bullet.status')).toContain('PENDING → APPROVED');
    expect(textIn(tree, 'saSettings.logDetails.affectedUser.value')).toBe(ADMIN_NO_VALUE);
  });

  it('filter: chrome, options from the loaded entries, Apply sends the filters', async () => {
    const tree = await mount({ initialScreen: 'audit_logs' });
    await press(tree, 'saSettings.auditLog.openFilter');
    one(tree, 'saSettings.filter');
    expect(one(tree, 'saSettings.filter.userRole').props.disabled).toBe(true);
    await press(tree, 'saSettings.filter.actionType');
    one(tree, 'saSettings.dropdown.option.payout.approve');
    await press(tree, 'saSettings.dropdown.option.payout.approve');
    await press(tree, 'saSettings.filter.dateRange');
    await press(tree, 'saSettings.dropdown.option.today');
    await press(tree, 'saSettings.filter.actions.primary');
    one(tree, 'saSettings.auditLog');
    const params = api.listAuditLog.mock.calls.at(-1)![0] as Record<string, unknown>;
    expect(params.action).toBe('payout.approve');
    expect(typeof params.from).toBe('string');
    for (const f of FIXTURES) expect(allText(tree)).not.toContain(f);
  });
});

describe('screens with no endpoint: full chrome, the dash, disabled writes', () => {
  it('System Configuration', async () => {
    const tree = await mount({ initialScreen: 'config' });
    const text = allText(tree);
    for (const k of ['section.session', 'section.fees', 'section.certificate', 'section.other', 'sessionTimeout', 'platformFee', 'maintenanceMode', 'allowDataExport'] as const) {
      expect(text).toContain(t(`saSettings.config.${k}`));
    }
    for (const id of ['sessionTimeout', 'maxLoginAttempts', 'transactionFee', 'certWarning']) {
      expect(textIn(tree, `saSettings.config.${id}`)).toBe(ADMIN_NO_VALUE);
    }
    expect(one(tree, 'saSettings.config.platformFee').props.value).toBe(ADMIN_NO_VALUE);
    expect(one(tree, 'saSettings.config.actions.primary').props.disabled).toBe(true);
    expect(one(tree, 'saSettings.config.actions.secondary').props.disabled).toBe(true);
    for (const f of FIXTURES) expect(text).not.toContain(f);
  });

  it('Integration Keys list: empty state, + opens Add Integration with Save disabled', async () => {
    const tree = await mount({ initialScreen: 'integration_keys' });
    expect(allText(tree)).toContain(t('saSettings.integrations.emptyTitle'));
    await press(tree, 'saSettings.integrations.add');
    one(tree, 'saSettings.integrationAdd');
    const text = allText(tree);
    for (const k of ['section.basic', 'section.config', 'section.settings', 'section.uses', 'roleAccess'] as const) {
      expect(text).toContain(t(`saSettings.integrationForm.${k}`));
    }
    expect(one(tree, 'saSettings.integrationAdd.actions.primary').props.disabled).toBe(true);
    for (const f of FIXTURES) expect(text).not.toContain(f);
  });

  it('Integration detail with no data: every row is the dash, Test Connection disabled', async () => {
    const tree = await render(<IntegrationDetailView integration={null} onBack={() => undefined} onEdit={() => undefined} />);
    for (const id of ['provider', 'key', 'senderId', 'endpoint', 'createdOn', 'lastUsed']) {
      expect(textIn(tree, `saSettings.integrationDetail.${id}.value`)).toBe(ADMIN_NO_VALUE);
    }
    expect(one(tree, 'saSettings.integrationDetail.test').props.disabled).toBe(true);
    one(tree, 'saSettings.integrationDetail.edit');
  });

  it('Edit Integration with no data: masked key is the dash, Regenerate and Save disabled', async () => {
    const tree = await render(<IntegrationFormScreen mode="edit" integration={null} onBack={() => undefined} />);
    one(tree, 'saSettings.integrationEdit.summary');
    expect(one(tree, 'saSettings.integrationEdit.apiKey').props.value).toBe(ADMIN_NO_VALUE);
    expect(one(tree, 'saSettings.integrationEdit.regenerate').props.disabled).toBe(true);
    expect(one(tree, 'saSettings.integrationEdit.actions.primary').props.disabled).toBe(true);
  });

  it('Emergency Database Export: chrome; Export disabled without the host; with it, a confirmed request', async () => {
    let tree = await mount({ initialScreen: 'emergency_export' });
    expect(allText(tree)).toContain(t('saSettings.export.warning'));
    for (const o of ['full', 'dataOnly', 'includeLogs', 'compress']) one(tree, `saSettings.export.option.${o}`);
    expect(one(tree, 'saSettings.export.submit').props.disabled).toBe(true);

    const onEmergencyExport = vi.fn();
    tree = await mount({ initialScreen: 'emergency_export', onEmergencyExport });
    await press(tree, 'saSettings.export.reason');
    await press(tree, 'saSettings.dropdown.option.audit');
    await press(tree, 'saSettings.export.submit');
    const buttons = vi.mocked(Alert.alert).mock.calls.at(-1)![2] as { onPress?: () => void }[];
    buttons[1]!.onPress!();
    expect(onEmergencyExport).toHaveBeenCalledWith({ reason: 'audit', details: '', options: ['full'] });
  });
});

describe('source guards', () => {
  const files = [HOST, ...fs.readdirSync(DIR).map((f) => path.join(DIR, f))];
  const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  it.each(files)('%s: <= 800 lines, tokens only, no role names, no fixtures, no literal JSX text', (file) => {
    const src = fs.readFileSync(file, 'utf8');
    expect(src.split('\n').length).toBeLessThanOrEqual(800);
    const c = code(src);
    expect(c).not.toMatch(/['"`]#[0-9A-Fa-f]{3,8}['"`]|\brgba?\(/);
    expect(c).not.toMatch(/fontSize:\s*\d|fontFamily/);
    expect(c).not.toMatch(/(padding|margin|gap)[A-Za-z]*:\s*\d/);
    expect(c).not.toMatch(/TOHFA_ADMIN|SUPER_ADMIN|FARMER_ADMIN|MAIN_WH_ADMIN|SUB_WH_ADMIN|\.role\s*===/);
    expect(c).not.toMatch(/INITIAL_|Exotel|sk_live|LOG-2026|Ramesh|@tohfa\/mobile-ui|as any/);
    expect(c).not.toMatch(/>\s*[A-Za-z][A-Za-z ]+\s*<\//);
    expect(c).not.toMatch(/'—'/);
  });

  it('every t() key used exists in the English catalogue', () => {
    for (const file of files) {
      for (const m of fs.readFileSync(file, 'utf8').matchAll(/\bt\('([^']+)'/g)) {
        expect(Object.prototype.hasOwnProperty.call(en, m[1]!), `${file}: ${m[1]}`).toBe(true);
      }
    }
  });

  it('every code the flow checks exists in docs/rbac.json', () => {
    const rbac = JSON.parse(fs.readFileSync(path.resolve(ADMIN, '../../../../../docs/rbac.json'), 'utf8')) as {
      permissions: { code: string }[];
    };
    const codes = new Set(rbac.permissions.map((p) => p.code));
    for (const c of ['system.config.manage', 'auditlog.view', 'auditlog.export', 'system.integration_key.manage', 'system.db_export.raw']) {
      expect(codes.has(c), c).toBe(true);
    }
  });
});
