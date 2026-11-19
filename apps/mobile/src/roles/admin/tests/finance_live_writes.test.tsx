/**
 * The three finance screens that used to FABRICATE success (an alert with no
 * server call) now write through the API. Pins, per screen:
 *   - it CALLS the endpoint (with the Idempotency-Key the money-moving write needs);
 *   - it shows NO success message until the server answered 2xx, and none at all
 *     when the call fails (the real error is shown instead);
 *   - a retry after a failure replays the SAME key, so money moves once (BR-72);
 *   - it is gated on the rbac code and does nothing without it.
 *
 *   PayoutProcessingScreen            POST /admin/payouts/{id}/approve  payout.approve_above_10k (BR-31, BR-72)
 *   FinanceBusinessOverviewScreen     POST /admin/payouts/{id}/approve  payout.approve_above_10k (BR-31, BR-72)
 *   AddExpenseScreen                  POST /admin/expenses              finance.expense.log       (BR-62)
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type * as PayoutsApi from '../api/payouts';
import type * as FinanceModule from '../api/finance';
import type * as WarehouseListModule from '../api/warehouseList';
import { ApiError } from '../../../shell/api/client';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: vi.fn() },
  BackHandler: { addEventListener: vi.fn(() => ({ remove: () => undefined })) },
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Platform: { OS: 'android', select: (o: Record<string, unknown>) => o['android'] ?? o['default'] },
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, absoluteFill: {} },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Path: 'Path', Rect: 'Rect', Line: 'Line', Ellipse: 'Ellipse' }));
vi.mock('@tohfa/mobile-ui', () => ({ Icon: 'Icon', SafeAreaView: 'SafeAreaView', ScreenStatusBar: 'ScreenStatusBar' }));

const api = vi.hoisted(() => ({
  approvePayout: vi.fn(),
  listPayouts: vi.fn(),
  listPayoutDues: vi.fn(),
  createExpense: vi.fn(),
  listExpenseCategories: vi.fn(),
  listAllWarehouses: vi.fn(),
  getFinanceRevenueReport: vi.fn(),
  getFinanceExpenseReport: vi.fn(),
}));
vi.mock('../api/payouts', async (importOriginal) => ({
  ...(await importOriginal<typeof PayoutsApi>()),
  approvePayout: api.approvePayout,
  listPayouts: api.listPayouts,
}));
vi.mock('../api/payoutDues', () => ({ listPayoutDues: api.listPayoutDues }));
vi.mock('../api/finance', async (importOriginal) => ({
  ...(await importOriginal<typeof FinanceModule>()),
  createExpense: api.createExpense,
  listExpenseCategories: api.listExpenseCategories,
  getFinanceRevenueReport: api.getFinanceRevenueReport,
  getFinanceExpenseReport: api.getFinanceExpenseReport,
}));
vi.mock('../api/warehouseList', async (importOriginal) => ({
  ...(await importOriginal<typeof WarehouseListModule>()),
  listAllWarehouses: api.listAllWarehouses,
}));

import { Alert } from 'react-native';
import { PayoutProcessingScreen } from '../screens/finance/PayoutProcessingScreen';
import { AddExpenseScreen } from '../screens/finance/AddExpenseScreen';
import { FinanceBusinessOverviewScreen } from '../screens/dashboard/FinanceBusinessOverviewScreen';
import { makeCan } from '../permissions/can';
import { t } from '../i18n';

// react-test-renderer + TanStack Query: let act() know it is in a test environment.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const PAYOUT_ID = '3c4d5e6f-7081-4923-8a45-6b7c8d9e0f12';
const CATEGORY_ID = '00000000-0000-4000-8000-0000000000c1';
const WAREHOUSE_ID = '00000000-0000-4000-8000-0000000000a1';
const APPROVE = 'payout.approve_above_10k';
const noop = () => undefined;

function textOf(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(textOf);
  return (node.children ?? []).flatMap(textOf);
}
const allText = (tree: renderer.ReactTestRenderer) => textOf(tree.toJSON()).join('\n');
const byId = (tree: renderer.ReactTestRenderer, id: string) =>
  tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === id);
const alertMock = vi.mocked(Alert.alert);

async function flush() {
  for (let i = 0; i < 6; i += 1) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
}
async function mount(el: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<QueryClientProvider client={client}>{el}</QueryClientProvider>);
  });
  await flush();
  return tree;
}
const press = async (tree: renderer.ReactTestRenderer, id: string) => {
  await act(async () => byId(tree, id)[0]!.props.onPress());
  await flush();
};
const apiError = (code: string, status: number) =>
  new ApiError({ type: 'about:blank', title: code, status, code: code as never });

const payout = (status: string) => ({
  id: PAYOUT_ID,
  payoutNumber: 'PO-2026-000871',
  farmerId: 'f-1',
  amount: '18400.00',
  status,
  requiresDualApproval: true,
});

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset();
  alertMock.mockReset();
  api.listPayouts.mockResolvedValue({ items: [], nextCursor: null, hasMore: false });
  api.listPayoutDues.mockResolvedValue({ items: [], page: { nextCursor: null, hasMore: false }, totals: { totalDue: '0.00', farmerCount: 0 } });
  api.listExpenseCategories.mockResolvedValue({ items: [{ id: CATEGORY_ID, name: 'Packaging Supplies' }] });
  api.listAllWarehouses.mockResolvedValue([{ id: WAREHOUSE_ID, code: 'WH-OOTY', name: 'Ooty Main', type: 'MAIN', isActive: true }]);
});
afterEach(() => {
  vi.useRealTimers();
});

// ─── PayoutProcessingScreen ──────────────────────────────────────────────────

describe('PayoutProcessingScreen is wired to POST /admin/payouts/{id}/approve', () => {
  const screen = (extra: Partial<React.ComponentProps<typeof PayoutProcessingScreen>> = {}) => (
    <PayoutProcessingScreen onBack={noop} payoutId={PAYOUT_ID} can={makeCan([APPROVE])} {...extra} />
  );

  it('BR-31/BR-72: Approve calls the endpoint with the payout id and an Idempotency-Key', async () => {
    api.approvePayout.mockResolvedValue(payout('APPROVED'));
    const tree = await mount(screen());
    await press(tree, 'payoutProcessing.approve');
    expect(api.approvePayout).toHaveBeenCalledTimes(1);
    const [id, body, key] = api.approvePayout.mock.calls[0]!;
    expect(id).toBe(PAYOUT_ID);
    expect(body).toEqual({});
    expect(typeof key).toBe('string');
    expect(String(key).length).toBeGreaterThan(0);
  });

  it('BR-31: no success is shown before the server answers, and the message reads the real response', async () => {
    let resolve!: (v: unknown) => void;
    api.approvePayout.mockReturnValue(new Promise((r) => (resolve = r)));
    const tree = await mount(screen());
    await press(tree, 'payoutProcessing.approve');
    // The old screen showed its success alert after a fixed 800 ms with no call. Nothing may appear while the call is open.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 1000));
    });
    expect(alertMock).not.toHaveBeenCalled();
    expect(allText(tree)).not.toContain('✓ Approved');
    await act(async () => resolve(payout('APPROVED')));
    await flush();
    expect(alertMock).toHaveBeenCalledTimes(1);
    expect(alertMock.mock.calls[0]![0]).toBe(t('payoutProcessing.done.title'));
    expect(alertMock.mock.calls[0]![1]).toContain('₹18,400');
    expect(allText(tree)).toContain('✓ Approved');
  });

  it('BR-31: a first approval that leaves the payout PENDING_APPROVAL says it is recorded, not released', async () => {
    api.approvePayout.mockResolvedValue(payout('PENDING_APPROVAL'));
    const tree = await mount(screen());
    await press(tree, 'payoutProcessing.approve');
    expect(alertMock.mock.calls[0]![0]).toBe(t('payoutProcessing.recorded.title'));
    expect(allText(tree)).not.toContain('✓ Approved');
  });

  it('BR-31: does NOT show success when the call fails (SAME_ACTOR_APPROVAL), and shows the real error', async () => {
    api.approvePayout.mockRejectedValue(apiError('SAME_ACTOR_APPROVAL', 403));
    const tree = await mount(screen());
    await press(tree, 'payoutProcessing.approve');
    expect(api.approvePayout).toHaveBeenCalledTimes(1);
    expect(alertMock).not.toHaveBeenCalled();
    expect(allText(tree)).not.toContain('✓ Approved');
    expect(allText(tree)).toContain(t('admin.error.SAME_ACTOR_APPROVAL'));
    expect(byId(tree, 'payoutProcessing.approve')[0]!.props.disabled).toBe(false);
  });

  it('BR-72: a retry after a failed call replays the same Idempotency-Key', async () => {
    api.approvePayout.mockRejectedValueOnce(apiError('INTERNAL', 500)).mockResolvedValueOnce(payout('APPROVED'));
    const tree = await mount(screen());
    await press(tree, 'payoutProcessing.approve');
    await press(tree, 'payoutProcessing.approve');
    expect(api.approvePayout).toHaveBeenCalledTimes(2);
    expect(api.approvePayout.mock.calls[1]![2]).toBe(api.approvePayout.mock.calls[0]![2]);
    expect(alertMock).toHaveBeenCalledTimes(1);
  });

  it('without a payout id, or without payout.approve_above_10k, Approve is disabled and nothing is sent', async () => {
    const noId = await mount(screen({ payoutId: undefined }));
    expect(byId(noId, 'payoutProcessing.approve')[0]!.props.disabled).toBe(true);
    expect(byId(noId, 'payoutProcessing.noPayout').length).toBe(1);
    await press(noId, 'payoutProcessing.approve');
    const noCode = await mount(screen({ can: makeCan([]) }));
    expect(byId(noCode, 'payoutProcessing.approve')[0]!.props.disabled).toBe(true);
    const noCan = await mount(screen({ can: undefined }));
    expect(byId(noCan, 'payoutProcessing.approve')[0]!.props.disabled).toBe(true);
    await press(noCode, 'payoutProcessing.approve');
    expect(api.approvePayout).not.toHaveBeenCalled();
    expect(alertMock).not.toHaveBeenCalled();
  });
});

// ─── FinanceBusinessOverviewScreen ───────────────────────────────────────────

describe('FinanceBusinessOverviewScreen payout card is wired to POST /admin/payouts/{id}/approve', () => {
  const awaiting = { id: PAYOUT_ID, number: 'PO-2026-000871', farmerName: 'Meena', amount: '18400.00' };
  const screen = (extra: Partial<React.ComponentProps<typeof FinanceBusinessOverviewScreen>> = {}) => (
    <FinanceBusinessOverviewScreen onBack={noop} can={makeCan([APPROVE])} awaitingPayout={awaiting} {...extra} />
  );
  const confirmApprove = async (tree: renderer.ReactTestRenderer) => {
    await press(tree, 'saFinance.approve');
    const buttons = alertMock.mock.calls[0]![2]!;
    await act(async () => buttons[1]!.onPress!());
    await flush();
  };

  it('BR-31/BR-72: confirming Approve calls the endpoint with an Idempotency-Key and then reports the real status', async () => {
    api.approvePayout.mockResolvedValue(payout('APPROVED'));
    const tree = await mount(screen());
    expect(api.approvePayout).not.toHaveBeenCalled();
    await confirmApprove(tree);
    expect(api.approvePayout).toHaveBeenCalledTimes(1);
    const [id, body, key] = api.approvePayout.mock.calls[0]!;
    expect([id, body]).toEqual([PAYOUT_ID, {}]);
    expect(typeof key).toBe('string');
    expect(alertMock).toHaveBeenCalledTimes(2);
    expect(alertMock.mock.calls[1]![0]).toBe(t('saFinance.approve.done.title'));
  });

  it('BR-31: does NOT show success when the call fails, and shows the real error', async () => {
    api.approvePayout.mockRejectedValue(apiError('INVALID_STATE_TRANSITION', 409));
    const tree = await mount(screen());
    await confirmApprove(tree);
    expect(api.approvePayout).toHaveBeenCalledTimes(1);
    // Only the confirm prompt was ever shown; no "approved" alert followed it.
    expect(alertMock).toHaveBeenCalledTimes(1);
    expect(byId(tree, 'saFinance.approveError').length).toBe(1);
    expect(allText(tree)).toContain(t('admin.error.INVALID_STATE_TRANSITION'));
  });

  it('BR-31: a payout still PENDING_APPROVAL after this approval is reported as recorded, not released', async () => {
    api.approvePayout.mockResolvedValue(payout('PENDING_APPROVAL'));
    const tree = await mount(screen());
    await confirmApprove(tree);
    expect(alertMock.mock.calls[1]![0]).toBe(t('saFinance.approve.recorded.title'));
  });

  it('without payout.approve_above_10k the buttons are disabled and nothing is sent', async () => {
    const tree = await mount(screen({ can: makeCan([]) }));
    expect(byId(tree, 'saFinance.approve')[0]!.props.disabled).toBe(true);
    await press(tree, 'saFinance.approve');
    expect(alertMock).not.toHaveBeenCalled();
    expect(api.approvePayout).not.toHaveBeenCalled();
  });

  it('with payout.view and no host payout, the card shows the payout waiting for approval from GET /admin/payouts', async () => {
    api.listPayouts.mockResolvedValue({
      items: [{ id: PAYOUT_ID, payoutNumber: 'PO-2026-000871', farmerId: 'f-1', farmerName: 'Meena', amount: '18400.00', status: 'PENDING_APPROVAL', requestedAt: '2026-11-01T00:00:00Z', requestedBy: 'Ganga' }],
      nextCursor: null,
      hasMore: false,
    });
    const tree = await mount(screen({ can: makeCan([APPROVE, 'payout.view']), awaitingPayout: undefined }));
    expect(api.listPayouts).toHaveBeenCalledWith({ status: 'PENDING_APPROVAL', limit: 1 }, expect.anything());
    expect(allText(tree)).toContain('PO-2026-000871 · Meena');
    expect(byId(tree, 'saFinance.approve')[0]!.props.disabled).toBe(false);
  });

  it('Reject stays disabled without a host callback: the API has no payout reject endpoint', async () => {
    const tree = await mount(screen());
    expect(byId(tree, 'saFinance.reject')[0]!.props.disabled).toBe(true);
  });
});

// ─── AddExpenseScreen ────────────────────────────────────────────────────────

describe('AddExpenseScreen is wired to POST /admin/expenses', () => {
  const CODES = ['finance.expense.log', 'warehouse.all.view'];
  const expense = { id: 'e-1', category: 'Packaging Supplies', amount: '4500.00', status: 'RECORDED' };
  const screen = (extra: Partial<React.ComponentProps<typeof AddExpenseScreen>> = {}) => (
    <AddExpenseScreen onBack={noop} can={makeCan(CODES)} {...extra} />
  );
  const touchables = (tree: renderer.ReactTestRenderer) => tree.root.findAll((n) => (n.type as unknown) === 'TouchableOpacity');
  const chip = async (tree: renderer.ReactTestRenderer, label: string) => {
    const hit = touchables(tree).find((n) => textOf(n.children as never).join('') === label || n.findAll((c) => (c.type as unknown) === 'Text').some((c) => textOf(c.children as never).join('') === label));
    expect(hit, `chip "${label}"`).toBeDefined();
    await act(async () => hit!.props.onPress());
  };
  const fill = async (tree: renderer.ReactTestRenderer) => {
    await chip(tree, 'Packaging Supplies');
    await chip(tree, 'Ooty Main');
    await chip(tree, 'Cash');
    const input = tree.root.findAll((n) => (n.type as unknown) === 'TextInput' && n.props.keyboardType === 'numeric')[0]!;
    await act(async () => input.props.onChangeText('4500'));
  };

  it('BR-62: Submit calls the endpoint with real ids, a decimal-string amount and an Idempotency-Key', async () => {
    api.createExpense.mockResolvedValue(expense);
    const tree = await mount(screen());
    await fill(tree);
    await press(tree, 'addExpense.submit');
    expect(api.createExpense).toHaveBeenCalledTimes(1);
    const [body, key] = api.createExpense.mock.calls[0]!;
    expect(body).toMatchObject({ categoryId: CATEGORY_ID, warehouseId: WAREHOUSE_ID, amount: '4500.00', paymentMethod: 'CASH' });
    expect(typeof key).toBe('string');
    expect(alertMock).toHaveBeenCalledTimes(1);
    expect(alertMock.mock.calls[0]![0]).toBe(t('addExpenseLive.done.title'));
    expect(alertMock.mock.calls[0]![1]).toContain('₹4,500');
  });

  it('BR-62: does NOT show success when the call fails, and shows the real error', async () => {
    api.createExpense.mockRejectedValue(apiError('VALIDATION_FAILED', 422));
    const tree = await mount(screen());
    await fill(tree);
    await press(tree, 'addExpense.submit');
    expect(api.createExpense).toHaveBeenCalledTimes(1);
    expect(alertMock).not.toHaveBeenCalled();
    expect(byId(tree, 'addExpense.error').length).toBe(1);
    expect(allText(tree)).toContain(t('admin.error.VALIDATION_FAILED'));
  });

  it('BR-62: a retry after a failure replays the same Idempotency-Key, so the expense is recorded once', async () => {
    api.createExpense.mockRejectedValueOnce(apiError('INTERNAL', 500)).mockResolvedValueOnce(expense);
    const tree = await mount(screen());
    await fill(tree);
    await press(tree, 'addExpense.submit');
    await press(tree, 'addExpense.submit');
    expect(api.createExpense).toHaveBeenCalledTimes(2);
    expect(api.createExpense.mock.calls[1]![1]).toBe(api.createExpense.mock.calls[0]![1]);
  });

  it('BR-62: an incomplete form is refused locally; no request is made and no success is shown', async () => {
    const tree = await mount(screen());
    await press(tree, 'addExpense.submit');
    expect(api.createExpense).not.toHaveBeenCalled();
    expect(alertMock.mock.calls[0]![0]).toBe('Missing Field');
  });

  it('without finance.expense.log the submit is disabled and nothing is sent', async () => {
    const tree = await mount(screen({ can: makeCan([]) }));
    expect(byId(tree, 'addExpense.submit')[0]!.props.disabled).toBe(true);
    await press(tree, 'addExpense.submit');
    expect(api.createExpense).not.toHaveBeenCalled();
    expect(api.listExpenseCategories).not.toHaveBeenCalled();
  });
});

// ─── Source guards: the fabrication cannot come back ─────────────────────────

describe('the fabricated success is gone from the sources', () => {
  const read = (rel: string) => fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8');
  it('no setTimeout and no hard-coded "dispatched"/"submitted for Super Admin review" success in the finance screens', () => {
    for (const rel of ['screens/finance/PayoutProcessingScreen.tsx', 'screens/finance/AddExpenseScreen.tsx']) {
      const src = read(rel);
      expect(src, rel).not.toMatch(/setTimeout\s*\(/);
      expect(src, rel).not.toContain('Payout dispatched');
      expect(src, rel).not.toContain('submitted for Super Admin review');
      expect(src, rel).not.toContain('Rajesh Kumar');
    }
    expect(read('screens/finance/PayoutProcessingScreen.tsx')).toContain('useApprovePayout');
    expect(read('screens/finance/AddExpenseScreen.tsx')).toContain('useCreateExpenseMutation');
    expect(read('screens/dashboard/FinanceBusinessOverviewScreen.tsx')).toContain('useApprovePayout');
  });
});
