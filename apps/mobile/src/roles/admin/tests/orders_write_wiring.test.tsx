/**
 * Cancel Order (M5S17), Order Issue (M5S16) and Dispatch (M5S14) used to move
 * to their success step without calling the server. They are now wired to
 *   POST /admin/orders/{id}/cancel     order.cancel            (BR-35, BR-151)
 *   POST /admin/orders/{id}/issues     warehouse.issue.manage  (BR-35, BR-152)
 *   POST /admin/orders/{id}/dispatch   order.dispatch          (BR-21, BR-118)
 * through the same LiveOrderAction Packing and Pickup use (useOrdersData.ts).
 *
 * The screens are rendered over a fake LiveOrderAction whose `run` records the
 * body and its `onDone`: the success step must appear only when the test calls
 * `onDone` (the real hook calls it on a 2xx and never on a failure). A second
 * group pins the endpoint each action posts to, with its Idempotency-Key, by
 * mocking the shell client underneath the real api functions.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance, type ReactTestRendererJSON } from 'react-test-renderer';
import type { Problem } from '@tohfa/shared-types';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: vi.fn() },
  BackHandler: { addEventListener: () => ({ remove: () => undefined }) },
  Image: 'Image',
  Modal: 'Modal',
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj['ios'] ?? obj['default'] },
  RefreshControl: 'RefreshControl',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Path: 'Path', Rect: 'Rect' }));
vi.mock('@tohfa/mobile-ui', () => ({ Icon: 'Icon', SafeAreaView: 'SafeAreaView', ScreenStatusBar: 'ScreenStatusBar' }));
vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return { ...actual, request: vi.fn(async () => ({})) };
});

import { ApiError, request } from '../../../shell/api/client';
import { ADMIN_REQUEST_TIMEOUT_MS } from '../api/http';
import type { AdminOrderDetailDto } from '../api/orders';
import { t } from '../i18n';
import { CancelOrderScreen } from '../screens/warehouse/orders/CancelOrderScreen';
import { DispatchScreen } from '../screens/warehouse/orders/DispatchScreen';
import { OrderIssueScreen, buildIssueBody, issueTypeCode } from '../screens/warehouse/orders/OrderIssueScreen';
import { toOrderDetail } from '../screens/warehouse/orders/mappers';
import type { LiveOrderAction } from '../screens/warehouse/orders/useOrdersData';
import { postFor } from '../screens/warehouse/orders/useOrdersData';

const requestMock = vi.mocked(request);

const ORDER = '22222222-2222-4222-8222-222222222222';
const WH = '11111111-1111-4111-8111-111111111111';
const PARTNER = '55555555-5555-4555-8555-555555555555';
const SCOPE = {};
const NOW = new Date('2026-10-13T06:30:00Z');

function dto(overrides: Partial<AdminOrderDetailDto> = {}): AdminOrderDetailDto {
  return {
    id: ORDER,
    orderNumber: 'TOH-2026-0084412',
    channel: 'ONLINE',
    status: 'PACKED',
    fulfilmentType: 'DELIVERY',
    paymentMethod: 'WALLET',
    paymentStatus: 'PAID',
    warehouse: { id: WH, name: 'Coonoor' },
    buyer: { kind: 'CUSTOMER', customerId: null, customerCode: null, name: 'Meena S.', mobileMasked: '******3210' },
    items: [
      {
        productId: '44444444-4444-4444-8444-444444444444',
        name: 'Carrot',
        grade: 'GRADE_1',
        qtyKg: '0.125',
        unitPrice: '40.00',
        gstRate: '0.00',
        gstAmount: '0.00',
        lineTotal: '5.00',
      },
    ],
    totals: { subtotal: '5.00', deliveryFee: '0.00', discount: '0.00', gst: '0.00', total: '5.00' },
    invoice: null,
    fulfilment: { deliveryDate: null, deliverySlot: null, otpRequired: true, otpVerifiedAt: null },
    timeline: [],
    placedAt: '2026-10-13T04:35:00Z',
    packedAt: '2026-10-13T05:00:00Z',
    completedAt: null,
    cancelledAt: null,
    ...overrides,
  } as AdminOrderDetailDto;
}
const view = (overrides: Partial<AdminOrderDetailDto> = {}) => toOrderDetail(dto(overrides), NOW);

type Body = Record<string, unknown>;
interface FakeAction extends LiveOrderAction<Body> {
  run: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
}
function fakeAction(): FakeAction {
  return { run: vi.fn(), reset: vi.fn(), isPending: false, error: null };
}
const lastDone = (action: FakeAction): ((result?: unknown) => void) => {
  const call = action.run.mock.calls[action.run.mock.calls.length - 1];
  expect(call, 'the screen never called run').toBeDefined();
  return call![1] as (result?: unknown) => void;
};

const allow = (codes: readonly string[]) => (code: string) => codes.includes(code);
const problem = (status: number, code: string) => new ApiError({ type: 'about:blank', title: 'x', status, code } as Problem);

function texts(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(texts);
  return (node.children ?? []).flatMap(texts);
}
const allText = (tree: renderer.ReactTestRenderer) => texts(tree.toJSON()).join('\n');
const byTestId = (tree: renderer.ReactTestRenderer, id: string): ReactTestInstance[] =>
  tree.root.findAll((n) => typeof n.type === 'string' && n.props['testID'] === id);
function press(tree: renderer.ReactTestRenderer, id: string) {
  const nodes = byTestId(tree, id);
  expect(nodes, `no element with testID ${id}`).toHaveLength(1);
  act(() => {
    (nodes[0]!.props['onPress'] as () => void)();
  });
}
function mountElement(element: React.ReactElement) {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  return tree;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Cancel Order ────────────────────────────────────────────────────────────

describe('CancelOrderScreen: POST /admin/orders/{id}/cancel (BR-35, order.cancel)', () => {
  const REASON_KEY = 'orders.cancel.reason.customerRequested';
  function mountCancel(cancel: FakeAction, props: Partial<React.ComponentProps<typeof CancelOrderScreen>> = {}) {
    return mountElement(
      <CancelOrderScreen scope={SCOPE} can={allow(['order.cancel'])} onBack={vi.fn()} order={view({ status: 'CONFIRMED' })} cancel={cancel} {...props} />,
    );
  }
  function toConfirm(tree: renderer.ReactTestRenderer) {
    press(tree, REASON_KEY);
    press(tree, 'orders.cancel.open');
  }

  it('BR-35: Cancel Order calls the cancel action with the reason the admin picked', () => {
    const cancel = fakeAction();
    const tree = mountCancel(cancel);
    toConfirm(tree);
    expect(cancel.run).not.toHaveBeenCalled();
    press(tree, 'orders.cancel.submit');
    expect(cancel.run).toHaveBeenCalledTimes(1);
    expect(cancel.run.mock.calls[0]![0]).toEqual({ reason: t(REASON_KEY) });
  });

  it('BR-35: the cancelled step appears only after the call lands, never before', () => {
    const cancel = fakeAction();
    const tree = mountCancel(cancel);
    toConfirm(tree);
    press(tree, 'orders.cancel.submit');
    expect(allText(tree)).not.toContain(t('orders.cancel.cancelledTitle'));
    act(() => lastDone(cancel)(undefined));
    expect(allText(tree)).toContain(t('orders.cancel.cancelledTitle'));
  });

  it('BR-35: a failed cancel stays on the confirm step with the error, and never shows "Order Cancelled"', () => {
    const cancel = fakeAction();
    const tree = mountCancel(cancel);
    toConfirm(tree);
    press(tree, 'orders.cancel.submit');
    // The real hook never calls onDone on a failure; it sets `error`.
    cancel.error = problem(409, 'INVALID_STATE_TRANSITION');
    act(() => {
      tree.update(
        <CancelOrderScreen scope={SCOPE} can={allow(['order.cancel'])} onBack={vi.fn()} order={view({ status: 'CONFIRMED' })} cancel={cancel} />,
      );
    });
    const text = allText(tree);
    expect(text).not.toContain(t('orders.cancel.cancelledTitle'));
    expect(text).toContain(t('orders.cancel.confirmTitle'));
    expect(text).toContain(t('admin.error.INVALID_STATE_TRANSITION'));
    expect(byTestId(tree, 'orders.cancel.submit')).toHaveLength(1);
  });

  it('BR-35: while the call is pending the button is disabled and says Saving', () => {
    const cancel = fakeAction();
    const tree = mountCancel(cancel);
    toConfirm(tree);
    cancel.isPending = true;
    act(() => {
      tree.update(<CancelOrderScreen scope={SCOPE} can={allow(['order.cancel'])} onBack={vi.fn()} order={view({ status: 'CONFIRMED' })} cancel={cancel} />);
    });
    expect(byTestId(tree, 'orders.cancel.submit')[0]!.props['disabled']).toBe(true);
    expect(allText(tree)).toContain(t('orders.action.saving'));
  });

  it('without order.cancel there is no Cancel Order button, so nothing can be sent', () => {
    const cancel = fakeAction();
    const tree = mountCancel(cancel, { can: allow([]) });
    expect(byTestId(tree, 'orders.cancel.open')).toHaveLength(0);
    expect(byTestId(tree, 'orders.cancel.submit')).toHaveLength(0);
  });

  it('a reason is required: the form button is disabled until one is picked', () => {
    const cancel = fakeAction();
    const tree = mountCancel(cancel);
    expect(byTestId(tree, 'orders.cancel.open')[0]!.props['disabled']).toBe(true);
  });

  it('a deep link to the cancelled step for an order that is not cancelled does not claim a cancellation', () => {
    const tree = mountCancel(fakeAction(), { initialStep: 'cancelled' });
    expect(allText(tree)).not.toContain(t('orders.cancel.cancelledTitle'));
  });

  it('an order the server already shows CANCELLED may open on the cancelled step', () => {
    const tree = mountCancel(fakeAction(), { initialStep: 'cancelled', order: view({ status: 'CANCELLED' }) });
    expect(allText(tree)).toContain(t('orders.cancel.cancelledTitle'));
  });

  it('the file no longer claims there is no cancel endpoint', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const source = require('node:fs').readFileSync(require('node:path').join(__dirname, '../screens/warehouse/orders/CancelOrderScreen.tsx'), 'utf8') as string;
    expect(source).not.toMatch(/no cancel endpoint/i);
  });
});

// ─── Order Issue ─────────────────────────────────────────────────────────────

describe('OrderIssueScreen: POST /admin/orders/{id}/issues (BR-35, BR-152, warehouse.issue.manage)', () => {
  function mountIssue(report: FakeAction, props: Partial<React.ComponentProps<typeof OrderIssueScreen>> = {}) {
    return mountElement(
      <OrderIssueScreen scope={SCOPE} can={allow(['warehouse.issue.manage'])} onBack={vi.fn()} order={view()} report={report} {...props} />,
    );
  }
  function type(tree: renderer.ReactTestRenderer, text: string) {
    act(() => {
      (byTestId(tree, 'orders.issue.description')[0]!.props['onChangeText'] as (v: string) => void)(text);
    });
  }

  it('BR-152: Submit Issue calls the report action with the issue type code and the description', () => {
    const report = fakeAction();
    const tree = mountIssue(report);
    type(tree, '  Damaged crates on arrival  ');
    press(tree, 'orders.issue.submit');
    expect(report.run).toHaveBeenCalledTimes(1);
    expect(report.run.mock.calls[0]![0]).toEqual({ issueType: 'quality', description: 'Damaged crates on arrival' });
  });

  it('BR-152: the submitted step appears only after the call lands, and shows the issue the server created', () => {
    const report = fakeAction();
    const tree = mountIssue(report);
    type(tree, 'Damaged crates on arrival');
    press(tree, 'orders.issue.submit');
    expect(allText(tree)).not.toContain(t('orders.issue.submittedTitle'));
    act(() => lastDone(report)({ id: '66666666-6666-4666-8666-666666666666', issueNumber: 'ISS-2026-0042', status: 'OPEN' }));
    const text = allText(tree);
    expect(text).toContain(t('orders.issue.submittedTitle'));
    expect(text).toContain('ISS-2026-0042');
    expect(text).toContain('OPEN');
  });

  it('BR-152: a failed submit stays on the form with the error and never shows "Issue Submitted"', () => {
    const report = fakeAction();
    const tree = mountIssue(report);
    type(tree, 'Damaged crates on arrival');
    press(tree, 'orders.issue.submit');
    report.error = problem(403, 'FORBIDDEN');
    act(() => {
      tree.update(<OrderIssueScreen scope={SCOPE} can={allow(['warehouse.issue.manage'])} onBack={vi.fn()} order={view()} report={report} />);
    });
    const text = allText(tree);
    expect(text).not.toContain(t('orders.issue.submittedTitle'));
    expect(text).toContain(t('admin.error.FORBIDDEN'));
    expect(byTestId(tree, 'orders.issue.submit')).toHaveLength(1);
  });

  it('a description is required: nothing is sent while it is empty', () => {
    const report = fakeAction();
    const tree = mountIssue(report);
    expect(byTestId(tree, 'orders.issue.submit')[0]!.props['disabled']).toBe(true);
    type(tree, '   ');
    expect(byTestId(tree, 'orders.issue.submit')[0]!.props['disabled']).toBe(true);
    expect(report.run).not.toHaveBeenCalled();
  });

  it('without warehouse.issue.manage there is no Submit Issue button', () => {
    const tree = mountIssue(fakeAction(), { can: allow([]) });
    expect(byTestId(tree, 'orders.issue.submit')).toHaveLength(0);
  });

  it('a bare deep link to the submitted step (no issue id) does not claim a submission', () => {
    const tree = mountIssue(fakeAction(), { initialStep: 'submitted' });
    expect(allText(tree)).not.toContain(t('orders.issue.submittedTitle'));
  });

  it('a deep link carrying a real issue id may open the submitted step', () => {
    const tree = mountIssue(fakeAction(), { initialStep: 'submitted', issueId: 'ISS-2026-0007' });
    const text = allText(tree);
    expect(text).toContain(t('orders.issue.submittedTitle'));
    expect(text).toContain('ISS-2026-0007');
  });

  it('buildIssueBody: type code is locale-free; item and quantity travel as description lines; capped at 4000', () => {
    expect(issueTypeCode('orders.issue.type.damaged')).toBe('damaged');
    expect(buildIssueBody({ issueType: 'orders.issue.type.late', description: '   ', affectedItemLabel: undefined, affectedQty: '' })).toBeNull();
    const body = buildIssueBody({ issueType: 'orders.issue.type.late', description: 'Late', affectedItemLabel: 'Carrot', affectedQty: ' 2 KG ' });
    expect(body).toEqual({
      issueType: 'late',
      description: ['Late', t('orders.issue.sent.item', { item: 'Carrot' }), t('orders.issue.sent.qty', { qty: '2 KG' })].join('\n'),
    });
    expect(buildIssueBody({ issueType: 'orders.issue.type.late', description: 'x'.repeat(5000), affectedItemLabel: undefined, affectedQty: '' })!.description).toHaveLength(4000);
  });
});

// ─── Dispatch ────────────────────────────────────────────────────────────────

describe('DispatchScreen: POST /admin/orders/{id}/dispatch (BR-21, BR-118, order.dispatch)', () => {
  const partnerList = {
    partners: [{ id: PARTNER, name: 'Nilgiri Express', phone: '9876500000', vehicleRef: 'TN43AB1234', isActive: true, createdAt: '2026-11-01T00:00:00Z' }],
  };
  function mountDispatch(dispatch: FakeAction, props: Partial<React.ComponentProps<typeof DispatchScreen>> = {}) {
    return mountElement(
      <DispatchScreen scope={SCOPE} can={allow(['order.dispatch'])} onBack={vi.fn()} order={view()} dispatch={dispatch} partnerList={partnerList} {...props} />,
    );
  }
  function toConfirm(tree: renderer.ReactTestRenderer) {
    press(tree, 'orders.dispatch.partnerPicker');
    press(tree, `orders.dispatch.partner.${PARTNER}`);
    press(tree, 'orders.dispatch.open');
  }

  it('BR-21: Confirm Dispatch calls the dispatch action with the delivery partner and NO slot', () => {
    const dispatch = fakeAction();
    const tree = mountDispatch(dispatch);
    toConfirm(tree);
    expect(dispatch.run).not.toHaveBeenCalled();
    press(tree, 'orders.dispatch.submit');
    expect(dispatch.run).toHaveBeenCalledTimes(1);
    const body = dispatch.run.mock.calls[0]![0] as Body;
    expect(body).toEqual({ deliveryPartnerId: PARTNER });
    expect(body).not.toHaveProperty('slot');
  });

  it('BR-21: the dispatched step appears only after the call lands, with the status the server returned', () => {
    const dispatch = fakeAction();
    const tree = mountDispatch(dispatch);
    toConfirm(tree);
    press(tree, 'orders.dispatch.submit');
    expect(allText(tree)).not.toContain(t('orders.dispatch.dispatchedTitle'));
    act(() => lastDone(dispatch)({ id: ORDER, status: 'OUT_FOR_DELIVERY' }));
    const text = allText(tree);
    expect(text).toContain(t('orders.dispatch.dispatchedTitle'));
    expect(text).toContain(t('orders.status.outForDelivery'));
  });

  it('BR-21: a failed dispatch stays on the confirm step with the error and never shows "Order Dispatched"', () => {
    const dispatch = fakeAction();
    const tree = mountDispatch(dispatch);
    toConfirm(tree);
    press(tree, 'orders.dispatch.submit');
    dispatch.error = problem(409, 'INVALID_STATE_TRANSITION');
    act(() => {
      tree.update(
        <DispatchScreen scope={SCOPE} can={allow(['order.dispatch'])} onBack={vi.fn()} order={view()} dispatch={dispatch} partnerList={partnerList} />,
      );
    });
    const text = allText(tree);
    expect(text).not.toContain(t('orders.dispatch.dispatchedTitle'));
    expect(text).toContain(t('orders.dispatch.confirmPrompt'));
    expect(text).toContain(t('admin.error.INVALID_STATE_TRANSITION'));
  });

  it('a delivery partner is required: Confirm Dispatch is disabled until one is picked', () => {
    const tree = mountDispatch(fakeAction());
    expect(byTestId(tree, 'orders.dispatch.open')[0]!.props['disabled']).toBe(true);
  });

  it('without order.dispatch neither Confirm Dispatch button renders', () => {
    const tree = mountDispatch(fakeAction(), { can: allow([]) });
    expect(byTestId(tree, 'orders.dispatch.open')).toHaveLength(0);
    expect(byTestId(tree, 'orders.dispatch.submit')).toHaveLength(0);
  });

  it('a deep link to the dispatched step for an order that is not dispatched does not claim a dispatch', () => {
    const tree = mountDispatch(fakeAction(), { initialStep: 'dispatched' });
    expect(allText(tree)).not.toContain(t('orders.dispatch.dispatchedTitle'));
  });

  it('a deep link to the confirm step with no partner picked opens the partner step instead', () => {
    const dispatch = fakeAction();
    const tree = mountDispatch(dispatch, { initialStep: 'confirm' });
    expect(byTestId(tree, 'orders.dispatch.submit')).toHaveLength(0);
    expect(dispatch.run).not.toHaveBeenCalled();
  });
});

// ─── The endpoints the three actions post to ─────────────────────────────────

describe('postFor: each action reaches its endpoint with an Idempotency-Key', () => {
  it('BR-35: cancel -> POST /admin/orders/{id}/cancel with {reason}', async () => {
    await postFor('cancel', ORDER, { reason: 'Customer requested cancellation' }, 'key-cancel-1');
    expect(requestMock).toHaveBeenCalledWith(`/admin/orders/${ORDER}/cancel`, {
      method: 'POST',
      body: { reason: 'Customer requested cancellation' },
      idempotencyKey: 'key-cancel-1',
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
  });

  it('BR-152: reportIssue -> POST /admin/orders/{id}/issues with {issueType, description}', async () => {
    await postFor('reportIssue', ORDER, { issueType: 'quality', description: 'Damaged crates' }, 'key-issue-1');
    expect(requestMock).toHaveBeenCalledWith(`/admin/orders/${ORDER}/issues`, {
      method: 'POST',
      body: { issueType: 'quality', description: 'Damaged crates' },
      idempotencyKey: 'key-issue-1',
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
  });

  it('BR-21: dispatch -> POST /admin/orders/{id}/dispatch with {deliveryPartnerId} and no slot', async () => {
    await postFor('dispatch', ORDER, { deliveryPartnerId: PARTNER }, 'key-dispatch-1');
    expect(requestMock).toHaveBeenCalledWith(`/admin/orders/${ORDER}/dispatch`, {
      method: 'POST',
      body: { deliveryPartnerId: PARTNER },
      idempotencyKey: 'key-dispatch-1',
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
  });
});
