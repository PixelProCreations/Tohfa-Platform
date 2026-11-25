/**
 * CreateAdminAccountScreen (Super Admin > Admins) is wired to the server.
 * It used to alert "Account Updated" / "Status Updated" and show a made-up
 * temporary password without calling anything. Pins, with react-test-renderer
 * against mocked API modules:
 *   - Create calls POST /admin/accounts (SA / TA) or POST /admin/sub-warehouse-admins (SW)
 *     with E.164 mobile, and shows the credentials modal only after the call resolved;
 *   - a failed create shows the error and never the success modal or onSuccess;
 *   - Disable calls POST /admin/accounts/{id}/disable after confirmation; a failure
 *     never raises "Account Disabled";
 *   - there is no update / re-enable route, so Save Changes and Reactivate are
 *     drawn but disabled and send nothing;
 *   - a role the caller has no `admin.*.create` code for is not offered, and FA
 *     (needs a zone the app cannot list) is not sent.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: vi.fn() },
  BackHandler: { addEventListener: vi.fn(() => ({ remove: () => undefined })) },
  Modal: 'Modal',
  Platform: { OS: 'ios', select: (o: Record<string, unknown>) => o['ios'] ?? o['default'] },
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, absoluteFill: {} },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Path: 'Path', Rect: 'Rect' }));
vi.mock('@tohfa/mobile-ui', () => ({ ScreenStatusBar: 'ScreenStatusBar', SafeAreaView: 'SafeAreaView' }));

const api = vi.hoisted(() => ({
  createAdminAccount: vi.fn(),
  disableAdminAccount: vi.fn(),
  createSubAdmin: vi.fn(),
}));
vi.mock('../api/adminAccounts', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  createAdminAccount: api.createAdminAccount,
  disableAdminAccount: api.disableAdminAccount,
}));
vi.mock('../api/subAdmins', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  createSubAdmin: api.createSubAdmin,
}));

const SUB_WH = '22222222-2222-4222-8222-222222222222';
vi.mock('../screens/warehouse/shared/useWarehouseOptions', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useWarehouseOptions: () => ({
    options: [
      { warehouseId: SUB_WH, warehouseName: 'Coonoor Sub', warehouseCode: 'WH-COON', type: 'SUB', city: null, isActive: true },
    ],
    isLoading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

import { Alert } from 'react-native';
import { CreateAdminAccountScreen, type AdminAccountData } from '../screens/dashboard/CreateAdminAccountScreen';
import { ApiError } from '../../../shell/api/client';
import { makeCan } from '../permissions/can';
import { t } from '../i18n';

const USER_ID = '33333333-3333-4333-8333-333333333333';
const TARGET_ID = '44444444-4444-4444-8444-444444444444';
const SUPER = makeCan([
  'admin.super_admin.create',
  'admin.tohfa_admin.create',
  'admin.farmer_admin.create',
  'admin.main_wh_admin.create',
  'admin.sub_wh_admin.create',
  'admin.account.disable',
  'warehouse.all.view',
]);
// TOHFA_ADMIN-like: FA and SW only, conditional disable.
const TOHFA = makeCan(['admin.farmer_admin.create', 'admin.sub_wh_admin.create', 'admin.account.disable', 'warehouse.all.view']);

const alertMock = vi.mocked(Alert.alert);

function problem(code: string, status: number): ApiError {
  return new ApiError({ type: 'about:blank', title: code, status, code, correlationId: 'c' } as never);
}

function mount(props: Partial<React.ComponentProps<typeof CreateAdminAccountScreen>> = {}): renderer.ReactTestRenderer {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <QueryClientProvider client={client}>
        <CreateAdminAccountScreen can={SUPER} onBack={vi.fn()} {...props} />
      </QueryClientProvider>,
    );
  });
  return tree;
}

function textOf(node: ReactTestInstance): string[] {
  return node.findAll((n) => String(n.type) === 'Text').flatMap((n) => {
    const c = n.props['children'] as unknown;
    return typeof c === 'string' ? [c] : Array.isArray(c) ? [c.filter((x) => typeof x === 'string').join('')] : [];
  });
}

/** The innermost TouchableOpacity that has `label` as a Text. */
function button(tree: renderer.ReactTestRenderer, label: string): ReactTestInstance {
  const hits = tree.root
    .findAll((n) => String(n.type) === 'TouchableOpacity' && textOf(n).includes(label))
    .filter((n) => n.findAll((c) => c !== n && String(c.type) === 'TouchableOpacity').length === 0);
  expect(hits.length, `button "${label}"`).toBeGreaterThan(0);
  return hits[0]!;
}

async function press(btn: ReactTestInstance): Promise<void> {
  await act(async () => {
    (btn.props['onPress'] as () => void)();
  });
  await flush();
}

/** TanStack batches observer notifications on a timer; let it fire. */
async function flush(): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 5));
  });
}

function type(tree: renderer.ReactTestRenderer, index: 0 | 1, value: string) {
  const inputs = tree.root.findAll((n) => String(n.type) === 'TextInput');
  act(() => (inputs[index]!.props['onChangeText'] as (v: string) => void)(value));
}

function allText(tree: renderer.ReactTestRenderer): string {
  return textOf(tree.root).join(' | ');
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Create: reaches the server, success only after a 2xx', () => {
  it('POSTs the role, trimmed name and E.164 mobile to /admin/accounts, then shows the real admin code', async () => {
    api.createAdminAccount.mockResolvedValue({ userId: USER_ID, adminCode: 'ADM-007', fullName: 'Meena V', role: 'TOHFA_ADMIN', status: 'ACTIVE', zoneIds: [], assignedAt: 'x' });
    const onSuccess = vi.fn();
    const tree = mount({ onSuccess });
    await press(button(tree, 'TA'));
    type(tree, 0, '  Meena V ');
    type(tree, 1, '98765 43210');
    await press(button(tree, 'Create Account'));

    expect(api.createAdminAccount).toHaveBeenCalledTimes(1);
    expect(api.createAdminAccount).toHaveBeenCalledWith({ role: 'TOHFA_ADMIN', fullName: 'Meena V', mobile: '+919876543210' });
    expect(api.createSubAdmin).not.toHaveBeenCalled();
    expect(allText(tree)).toContain('ADM-007');
    // No invented credential is ever shown.
    expect(allText(tree)).not.toMatch(/Tohfa@|Temporary Password/);
    const modal = tree.root.findAll((n) => String(n.type) === 'Modal').find((m) => m.props['visible'] === true);
    expect(modal).toBeDefined();
    // The host is told only when the user leaves the modal, with the server's id.
    expect(onSuccess).not.toHaveBeenCalled();
    await press(button(tree, 'Done & Return'));
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ id: USER_ID, role: 'TA', status: 'ACTIVE' }));
  });

  it('SW is created through POST /admin/sub-warehouse-admins with the chosen warehouse uuid', async () => {
    api.createSubAdmin.mockResolvedValue({ userId: USER_ID, adminCode: 'ADM-008', fullName: 'Ravi', status: 'ACTIVE', warehouseId: SUB_WH, assignedAt: 'x' });
    const tree = mount();
    await press(button(tree, 'SW'));
    type(tree, 0, 'Ravi');
    type(tree, 1, '9876543210');
    await press(button(tree, 'Select a sub-warehouse'));
    await press(button(tree, 'Coonoor Sub'));
    await press(button(tree, 'Create Account'));
    expect(api.createSubAdmin).toHaveBeenCalledWith({ fullName: 'Ravi', mobile: '+919876543210', warehouseId: SUB_WH });
    expect(api.createAdminAccount).not.toHaveBeenCalled();
    expect(allText(tree)).toContain('ADM-008');
  });

  it('does NOT report success when the create fails: shows the error, no credentials modal, no onSuccess', async () => {
    api.createAdminAccount.mockRejectedValue(problem('CONFLICT', 409));
    const onSuccess = vi.fn();
    const tree = mount({ onSuccess });
    await press(button(tree, 'TA'));
    type(tree, 0, 'Meena V');
    type(tree, 1, '9876543210');
    await press(button(tree, 'Create Account'));

    expect(api.createAdminAccount).toHaveBeenCalledTimes(1);
    expect(allText(tree)).toContain(t('adminAccount.error.conflict'));
    const open = tree.root.findAll((n) => String(n.type) === 'Modal' && n.props['visible'] === true);
    expect(open).toHaveLength(0);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(alertMock).not.toHaveBeenCalled();
  });

  it('a network failure also shows an error and no success', async () => {
    api.createAdminAccount.mockRejectedValue(new Error('boom'));
    const tree = mount();
    await press(button(tree, 'TA'));
    type(tree, 0, 'Meena V');
    type(tree, 1, '9876543210');
    await press(button(tree, 'Create Account'));
    expect(allText(tree)).toContain(t('admin.error.generic'));
    expect(tree.root.findAll((n) => String(n.type) === 'Modal' && n.props['visible'] === true)).toHaveLength(0);
  });

  it('a short mobile number is refused locally and nothing is sent', async () => {
    const tree = mount();
    await press(button(tree, 'TA'));
    type(tree, 0, 'Meena V');
    type(tree, 1, '12345');
    await press(button(tree, 'Create Account'));
    expect(api.createAdminAccount).not.toHaveBeenCalled();
    expect(alertMock).toHaveBeenCalledWith(t('adminAccount.validation.title'), t('adminAccount.validation.mobile'));
  });
});

describe('Create: only roles the caller may grant, and only what the server can accept', () => {
  it('a caller without admin.super_admin.create cannot pick SA: it is disabled and nothing is sent', async () => {
    const tree = mount({ can: TOHFA });
    const sa = button(tree, 'SA');
    expect(sa.props['accessibilityState']).toMatchObject({ disabled: true });
    await press(sa);
    expect(alertMock).toHaveBeenCalledWith(t('adminAccount.restricted.title'), t('adminAccount.restricted.body'));
    expect(button(tree, 'TA').props['accessibilityState']).toMatchObject({ disabled: true });
    expect(button(tree, 'FA').props['accessibilityState']).toMatchObject({ disabled: false });
  });

  it('with no permissions at all (fail closed) no role is available and Create is disabled', () => {
    const tree = mount({ can: makeCan([]) });
    for (const r of ['SA', 'TA', 'FA', 'SW']) {
      expect(button(tree, r).props['accessibilityState']).toMatchObject({ disabled: true });
    }
    expect(button(tree, 'Create Account').props['disabled']).toBe(true);
  });

  it('FA needs a zone the app cannot list: Create stays visible but disabled, with the reason, and sends nothing', async () => {
    const tree = mount({ can: SUPER });
    await press(button(tree, 'FA'));
    const create = button(tree, 'Create Account');
    expect(create.props['disabled']).toBe(true);
    expect(allText(tree)).toContain(t('adminAccount.create.zoneUnavailable'));
    type(tree, 0, 'Meena V');
    type(tree, 1, '9876543210');
    await press(create);
    expect(api.createAdminAccount).not.toHaveBeenCalled();
  });
});

const EXISTING: AdminAccountData = { id: TARGET_ID, fullName: 'Prakash Velu', mobile: '9843055122', role: 'SW', warehouse: 'Coonoor Sub', status: 'ACTIVE' };

describe('Manage (edit): Disable reaches the server, no fabricated success', () => {
  function confirmDisable(): void {
    const call = alertMock.mock.calls.find((c) => c[0] === t('adminAccount.disable.confirmTitle'));
    expect(call, 'confirmation alert').toBeDefined();
    const buttons = call![2] as { text: string; onPress?: () => void }[];
    buttons.find((b) => b.text === t('adminAccount.disable.confirmAction'))!.onPress!();
  }

  it('asks first, then POSTs /admin/accounts/{id}/disable and only then raises "Account Disabled"', async () => {
    api.disableAdminAccount.mockResolvedValue({ id: TARGET_ID, fullName: 'Prakash Velu', status: 'DISABLED', roles: ['SUB_WH_ADMIN'], disabledAt: 'x', disabledBy: USER_ID, disabledReason: null });
    const tree = mount({ initialData: EXISTING });
    await press(button(tree, 'Disable This Account'));
    expect(api.disableAdminAccount).not.toHaveBeenCalled(); // cancel must be possible
    expect(alertMock).not.toHaveBeenCalledWith(t('adminAccount.disable.doneTitle'), expect.anything());
    await act(async () => confirmDisable());
    await flush();
    expect(api.disableAdminAccount).toHaveBeenCalledTimes(1);
    expect(api.disableAdminAccount).toHaveBeenCalledWith(TARGET_ID);
    expect(alertMock).toHaveBeenCalledWith(t('adminAccount.disable.doneTitle'), t('adminAccount.disable.doneBody', { name: 'Prakash Velu' }));
    // The server's status drives the screen: Reactivate has no route, so it is drawn disabled.
    const reactivate = button(tree, 'Reactivate This Account');
    expect(reactivate.props['disabled']).toBe(true);
    expect(allText(tree)).toContain(t('adminAccount.reactivate.unavailable'));
  });

  it('does NOT report "Status Updated" / "Account Disabled" when the disable fails, and the account stays active', async () => {
    api.disableAdminAccount.mockRejectedValue(problem('FORBIDDEN', 403));
    const tree = mount({ initialData: EXISTING });
    await press(button(tree, 'Disable This Account'));
    await act(async () => confirmDisable());
    await flush();
    expect(api.disableAdminAccount).toHaveBeenCalledTimes(1);
    expect(alertMock).not.toHaveBeenCalledWith(t('adminAccount.disable.doneTitle'), expect.anything());
    expect(alertMock).not.toHaveBeenCalledWith('Status Updated', expect.anything());
    expect(allText(tree)).toContain(t('admin.error.FORBIDDEN'));
    expect(textOf(tree.root)).toContain('Disable This Account');
  });

  it('a 409 on disable is the last-Super-Admin message, not the create-conflict one', async () => {
    api.disableAdminAccount.mockRejectedValue(problem('CONFLICT', 409));
    const tree = mount({ initialData: EXISTING });
    await press(button(tree, 'Disable This Account'));
    await act(async () => confirmDisable());
    await flush();
    expect(allText(tree)).toContain(t('adminAccount.error.lastSuperAdmin'));
  });

  it('without admin.account.disable the action stays drawn but disabled, with the reason, and sends nothing', async () => {
    const tree = mount({ initialData: EXISTING, can: makeCan([]) });
    const disable = button(tree, 'Disable This Account');
    expect(disable.props['disabled']).toBe(true);
    expect(allText(tree)).toContain(t('adminAccount.disable.noPermission'));
    await press(disable);
    expect(api.disableAdminAccount).not.toHaveBeenCalled();
  });

  it('Save Changes has no server route: drawn but disabled, never "Account Updated", sends nothing', async () => {
    const tree = mount({ initialData: EXISTING });
    const save = button(tree, 'Save Changes');
    expect(save.props['disabled']).toBe(true);
    expect(allText(tree)).toContain(t('adminAccount.edit.unavailable'));
    await press(save);
    expect(api.createAdminAccount).not.toHaveBeenCalled();
    expect(api.createSubAdmin).not.toHaveBeenCalled();
    expect(alertMock).not.toHaveBeenCalledWith('Account Updated', expect.anything());
  });
});
