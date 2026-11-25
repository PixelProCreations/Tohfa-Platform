/**
 * W2 (brief 07 P1 #1, #3, #5, #7 and the P2 returns statuses): the money and
 * returns actions that used to report success with no server request now go
 * through the API, and only report success after a 2xx.
 *
 *   WalletDeductionFlow        POST /admin/wallets/{customerId}/deduct      wallet.manual_credit_debit (Idempotency-Key)
 *   FarmerPayoutDetailScreen   POST /admin/payouts/{id}/approve              payout.approve_above_10k (BR-31, BR-72)
 *   SalesReturnsRefundsScreen  POST /admin/returns/{id}/refund/wallet        rma.refund.wallet_process (BR-61d)
 *                              POST /admin/returns/{id}/reject               rma.refund.approve (BR-61)
 *   ReturnsRmaRefundsScreen    GET  /admin/returns (all six statuses mapped)
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type * as ReturnsApi from '../api/returns';
import type * as PayoutsApi from '../api/payouts';
import type * as WalletApi from '../api/wallet';
import { ApiError } from '../../../shell/api/client';

vi.mock('react-native', async () => {
  const R = await import('react');
  type FlatListProps = { data: unknown[]; renderItem: (a: { item: unknown; index: number }) => React.ReactNode; keyExtractor?: (i: unknown, n: number) => string };
  return {
    ActivityIndicator: 'ActivityIndicator',
    Alert: { alert: vi.fn() },
    FlatList: ({ data, renderItem, keyExtractor }: FlatListProps) =>
      R.createElement(
        'FlatList',
        null,
        data.map((item, index) => R.createElement(R.Fragment, { key: keyExtractor ? keyExtractor(item, index) : String(index) }, renderItem({ item, index }))),
      ),
    KeyboardAvoidingView: 'KeyboardAvoidingView',
    Linking: { openURL: vi.fn() },
    Modal: 'Modal',
    Platform: { OS: 'android', select: (o: Record<string, unknown>) => o['android'] ?? o['default'] },
    SafeAreaView: 'SafeAreaView',
    ScrollView: 'ScrollView',
    StatusBar: 'StatusBar',
    StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, absoluteFill: {} },
    Text: 'Text',
    TextInput: 'TextInput',
    TouchableOpacity: 'TouchableOpacity',
    View: 'View',
  };
});
vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Path: 'Path', Rect: 'Rect', Line: 'Line', Ellipse: 'Ellipse', G: 'G', Polyline: 'Polyline' }));
vi.mock('@tohfa/mobile-ui', () => ({ Icon: 'Icon', SafeAreaView: 'SafeAreaView', ScreenStatusBar: 'ScreenStatusBar' }));

const api = vi.hoisted(() => ({
  deductCustomerWallet: vi.fn(),
  approvePayout: vi.fn(),
  listReturns: vi.fn(),
  getReturn: vi.fn(),
  getReturnHistory: vi.fn(),
  refundReturnToWallet: vi.fn(),
  rejectReturn: vi.fn(),
}));
vi.mock('../api/wallet', async (importOriginal) => ({
  ...(await importOriginal<typeof WalletApi>()),
  deductCustomerWallet: api.deductCustomerWallet,
}));
vi.mock('../api/payouts', async (importOriginal) => ({
  ...(await importOriginal<typeof PayoutsApi>()),
  approvePayout: api.approvePayout,
}));
vi.mock('../api/returns', async (importOriginal) => ({
  ...(await importOriginal<typeof ReturnsApi>()),
  listReturns: api.listReturns,
  getReturn: api.getReturn,
  getReturnHistory: api.getReturnHistory,
  refundReturnToWallet: api.refundReturnToWallet,
  rejectReturn: api.rejectReturn,
}));

import { Alert } from 'react-native';
import { deductReasonText, WalletDeductionFlow } from '../screens/finance/WalletDeductionFlow';
import { DEDUCT_REASON_MAX_LENGTH } from '../api/wallet';
import { FarmerPayoutDetailScreen } from '../screens/farmers/FarmerPayoutDetailScreen';
import { SalesReturnsRefundsScreen, salesReturnView } from '../screens/sales/SalesReturnsRefundsScreen';
import { ReturnsRmaRefundsScreen, financeReturnView } from '../screens/finance/ReturnsRmaRefundsScreen';
import { makeCan } from '../permissions/can';
import { t } from '../i18n';
import { REJECT_REASON_MAX_LENGTH, type ReturnStatus } from '../api/returns';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const CUSTOMER_ID = '8b1f2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
const PAYOUT_ID = '3c4d5e6f-7081-4923-8a45-6b7c8d9e0f12';
const ALL_STATUSES: readonly ReturnStatus[] = ['PENDING', 'INSPECTED', 'APPROVED', 'REJECTED', 'REFUND_PENDING_BANK', 'REFUNDED'];
const noop = () => undefined;
const alertMock = vi.mocked(Alert.alert);

function textOf(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(textOf);
  return (node.children ?? []).flatMap(textOf);
}
const allText = (tree: renderer.ReactTestRenderer) => textOf(tree.toJSON()).join('\n');
const byId = (tree: renderer.ReactTestRenderer, id: string) =>
  tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === id);
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
  const node = byId(tree, id)[0];
  if (node === undefined) throw new Error(`no element with testID ${id}`);
  await act(async () => node.props.onPress());
  await flush();
};
const type = async (tree: renderer.ReactTestRenderer, id: string, text: string) => {
  await act(async () => byId(tree, id)[0]!.props.onChangeText(text));
  await flush();
};
/** Presses the confirm button (index `i`) of the last Alert shown. */
const confirmLastAlert = async (i = 1) => {
  const buttons = alertMock.mock.calls[alertMock.mock.calls.length - 1]![2]!;
  await act(async () => buttons[i]!.onPress!());
  await flush();
};
const apiError = (code: string, status: number) => new ApiError({ type: 'about:blank', title: code, status, code: code as never });
const returnRow = (id: string, status: ReturnStatus) => ({
  id,
  orderId: '11111111-2222-4333-8444-555555555555',
  customerId: CUSTOMER_ID,
  warehouseId: '00000000-0000-4000-8000-0000000000a1',
  status,
  reason: 'Produce damaged in transit',
  note: null,
  createdAt: '2026-11-20T04:30:00.000Z',
});
const rid = (n: number) => `0000000${n}-aaaa-4bbb-8ccc-dddddddddddd`;

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset();
  alertMock.mockReset();
});

// ─── WalletDeductionFlow ─────────────────────────────────────────────────────

describe('WalletDeductionFlow is wired to POST /admin/wallets/{customerId}/deduct', () => {
  const tx = { id: 'tx-1', walletId: 'w-1', txnType: 'ADJUSTMENT', amount: '-500.00', balanceAfter: '1500.00', refType: null, refId: null, fiscalCashTag: null, warehouseId: null, performedBy: null, performedAt: '2026-11-25T05:00:00.000Z', remarks: null };
  const flow = (extra: Partial<React.ComponentProps<typeof WalletDeductionFlow>> = {}) => (
    <WalletDeductionFlow
      customer={{ id: CUSTOMER_ID, name: 'Anitha K.' }}
      can={makeCan(['wallet.manual_credit_debit'])}
      onBack={noop}
      onSuccess={noop}
      {...extra}
    />
  );
  /** Walk amount -> fiscal tag -> confirm, then press Confirm Deduction. */
  async function deduct(tree: renderer.ReactTestRenderer) {
    await press(tree, 'walletDeduct.preset.500');
    await type(tree, 'walletDeduct.fiscalTag', 'FC-20261125-001');
    await press(tree, 'walletDeduct.confirmCheckbox');
    await press(tree, 'walletDeduct.review');
    await press(tree, 'walletDeduct.toConfirm');
    await press(tree, 'walletDeduct.confirm');
  }

  it('sends the deduction with Money "500.00", a reason and an Idempotency-Key, then reports success', async () => {
    api.deductCustomerWallet.mockResolvedValue(tx);
    const tree = await mount(flow());
    await deduct(tree);
    expect(api.deductCustomerWallet).toHaveBeenCalledTimes(1);
    const [id, body, key] = api.deductCustomerWallet.mock.calls[0]!;
    expect(id).toBe(CUSTOMER_ID);
    expect(body.amount).toBe('500.00');
    // Owner decision 2026-11-25: the fiscal cash tag is folded into the reason as "<TAG>: <reason>".
    expect(body.reason).toBe('FC-20261125-001: Wallet Correction');
    expect(typeof key).toBe('string');
    expect(String(key).length).toBeGreaterThan(0);
    expect(alertMock).toHaveBeenCalledTimes(1);
    expect(alertMock.mock.calls[0]![0]).toBe(t('wiringPayouts.walletDeduct.done.title'));
    expect(alertMock.mock.calls[0]![1]).toContain('₹1,500');
  });

  it('a rejected deduction shows the error and no success', async () => {
    api.deductCustomerWallet.mockRejectedValue(apiError('WALLET_INSUFFICIENT', 409));
    const tree = await mount(flow());
    await deduct(tree);
    expect(api.deductCustomerWallet).toHaveBeenCalledTimes(1);
    expect(alertMock).not.toHaveBeenCalled();
    expect(byId(tree, 'walletDeduct.error').length).toBe(1);
    expect(allText(tree)).toContain(t('admin.error.WALLET_INSUFFICIENT'));
    expect(allText(tree)).not.toContain('Deduction Successful');
  });

  it('a retry after a failure reuses the SAME Idempotency-Key', async () => {
    api.deductCustomerWallet.mockRejectedValueOnce(apiError('INTERNAL', 500)).mockResolvedValueOnce(tx);
    const tree = await mount(flow());
    await deduct(tree);
    await press(tree, 'walletDeduct.confirm');
    expect(api.deductCustomerWallet).toHaveBeenCalledTimes(2);
    expect(api.deductCustomerWallet.mock.calls[1]![2]).toBe(api.deductCustomerWallet.mock.calls[0]![2]);
    expect(alertMock).toHaveBeenCalledTimes(1);
  });

  it('without a real customer id (as FinanceManagementFlow mounts it) Confirm is disabled and nothing is sent', async () => {
    const tree = await mount(flow({ customer: undefined }));
    await press(tree, 'walletDeduct.preset.500');
    await type(tree, 'walletDeduct.fiscalTag', 'FC-20261125-001');
    await press(tree, 'walletDeduct.confirmCheckbox');
    await press(tree, 'walletDeduct.review');
    await press(tree, 'walletDeduct.toConfirm');
    expect(byId(tree, 'walletDeduct.confirm')[0]!.props.disabled).toBe(true);
    await press(tree, 'walletDeduct.confirm');
    expect(api.deductCustomerWallet).not.toHaveBeenCalled();
    expect(alertMock).not.toHaveBeenCalled();
  });

  it('without wallet.manual_credit_debit Confirm is disabled', async () => {
    const tree = await mount(flow({ can: makeCan([]) }));
    await press(tree, 'walletDeduct.preset.500');
    await type(tree, 'walletDeduct.fiscalTag', 'FC-20261125-001');
    await press(tree, 'walletDeduct.confirmCheckbox');
    await press(tree, 'walletDeduct.review');
    await press(tree, 'walletDeduct.toConfirm');
    expect(byId(tree, 'walletDeduct.confirm')[0]!.props.disabled).toBe(true);
  });

  it('a blank tag sends the reason alone; the description is appended after the category', async () => {
    api.deductCustomerWallet.mockResolvedValue(tx);
    const tree = await mount(flow());
    await press(tree, 'walletDeduct.preset.500');
    await type(tree, 'walletDeduct.description', 'Damaged item adjustment');
    await press(tree, 'walletDeduct.confirmCheckbox');
    // Step 1 insists on a tag; type it, then clear it on the tag step to send without one.
    await type(tree, 'walletDeduct.fiscalTag', 'FC-ADJUSTMENT');
    await press(tree, 'walletDeduct.review');
    expect(deductReasonText('  ', 'Wallet Correction', 'Damaged item adjustment')).toBe('Wallet Correction: Damaged item adjustment');
    await press(tree, 'walletDeduct.toConfirm');
    await press(tree, 'walletDeduct.confirm');
    expect(api.deductCustomerWallet.mock.calls[0]![1].reason).toBe('FC-ADJUSTMENT: Wallet Correction: Damaged item adjustment');
  });

  it('the Idempotency-Key covers the combined reason: another tag is another key', async () => {
    api.deductCustomerWallet.mockRejectedValue(apiError('INTERNAL', 500));
    const tree = await mount(flow());
    await deduct(tree);
    await press(tree, 'walletDeduct.backFromConfirm');
    await type(tree, 'walletDeduct.fiscalTagReview', 'FC-20261125-002');
    await press(tree, 'walletDeduct.toConfirm');
    await press(tree, 'walletDeduct.confirm');
    expect(api.deductCustomerWallet).toHaveBeenCalledTimes(2);
    expect(api.deductCustomerWallet.mock.calls[1]![1].reason).toBe('FC-20261125-002: Wallet Correction');
    expect(api.deductCustomerWallet.mock.calls[1]![2]).not.toBe(api.deductCustomerWallet.mock.calls[0]![2]);
  });

  it(`a combined reason over ${DEDUCT_REASON_MAX_LENGTH} characters blocks Confirm with an inline error (never truncated)`, async () => {
    const tree = await mount(flow());
    await press(tree, 'walletDeduct.preset.500');
    await type(tree, 'walletDeduct.fiscalTag', 'T'.repeat(60));
    await type(tree, 'walletDeduct.description', 'd'.repeat(250));
    await press(tree, 'walletDeduct.confirmCheckbox');
    await press(tree, 'walletDeduct.review');
    await press(tree, 'walletDeduct.toConfirm');
    expect(byId(tree, 'walletDeduct.confirm')[0]!.props.disabled).toBe(true);
    expect(byId(tree, 'walletDeduct.reasonTooLong').length).toBe(1);
    await press(tree, 'walletDeduct.confirm');
    expect(api.deductCustomerWallet).not.toHaveBeenCalled();
  });

  it('starts with no pre-filled amount, tag, reason text or confirmation', async () => {
    const tree = await mount(flow());
    expect(byId(tree, 'walletDeduct.fiscalTag')[0]!.props.value).toBe('');
    const text = allText(tree);
    expect(text).not.toContain('500.00');
    expect(text).not.toContain('Demo TOHFA Admin');
  });
});

// ─── FarmerPayoutDetailScreen ────────────────────────────────────────────────

describe('FarmerPayoutDetailScreen Approve is wired to POST /admin/payouts/{id}/approve', () => {
  const payout = { id: PAYOUT_ID, code: 'PO-2026-000871', amount: '18400.00', status: 'PENDING_APPROVAL' };
  const screen = (extra: Partial<React.ComponentProps<typeof FarmerPayoutDetailScreen>> = {}) => (
    <FarmerPayoutDetailScreen payout={payout as never} role="SUPER_ADMIN" can={makeCan(['payout.approve_above_10k'])} onBack={noop} {...extra} />
  );
  const dto = (status: string) => ({ id: PAYOUT_ID, payoutNumber: 'PO-2026-000871', farmerId: 'f-1', amount: '18400.00', status, requiresDualApproval: true });

  it('BR-31: a resolved approval shows success only after the server answered, with the server status', async () => {
    api.approvePayout.mockResolvedValue(dto('APPROVED'));
    const tree = await mount(screen());
    await press(tree, 'payoutDetail.approve');
    expect(api.approvePayout).not.toHaveBeenCalled();
    await confirmLastAlert();
    expect(api.approvePayout).toHaveBeenCalledTimes(1);
    expect(api.approvePayout.mock.calls[0]![0]).toBe(PAYOUT_ID);
    expect(api.approvePayout.mock.calls[0]![1]).toEqual({});
    expect(alertMock).toHaveBeenCalledTimes(2);
    expect(alertMock.mock.calls[1]![0]).toBe(t('wiringPayouts.payoutDetail.done.title'));
    expect(allText(tree)).toContain(t('wiringPayouts.payoutStatus.APPROVED'));
  });

  it('BR-31: a first approval that leaves PENDING_APPROVAL says recorded, not approved', async () => {
    api.approvePayout.mockResolvedValue(dto('PENDING_APPROVAL'));
    const tree = await mount(screen());
    await press(tree, 'payoutDetail.approve');
    await confirmLastAlert();
    expect(alertMock.mock.calls[1]![0]).toBe(t('wiringPayouts.payoutDetail.recorded.title'));
  });

  it('BR-31: a rejected approval shows the error and no success', async () => {
    api.approvePayout.mockRejectedValue(apiError('SAME_ACTOR_APPROVAL', 403));
    const tree = await mount(screen());
    await press(tree, 'payoutDetail.approve');
    await confirmLastAlert();
    expect(api.approvePayout).toHaveBeenCalledTimes(1);
    expect(alertMock).toHaveBeenCalledTimes(1);
    expect(byId(tree, 'payoutDetail.error').length).toBe(1);
    expect(allText(tree)).toContain(t('admin.error.SAME_ACTOR_APPROVAL'));
  });

  it('Reject and Intimate stay disabled (no endpoint); no payout or no permission disables Approve', async () => {
    const sa = await mount(screen());
    expect(byId(sa, 'payoutDetail.reject')[0]!.props.disabled).toBe(true);
    const ta = await mount(screen({ role: 'TOHFA_ADMIN' }));
    expect(byId(ta, 'payoutDetail.intimate')[0]!.props.disabled).toBe(true);
    expect(byId(ta, 'payoutDetail.reject')[0]!.props.disabled).toBe(true);
    const none = await mount(screen({ payout: undefined }));
    expect(byId(none, 'payoutDetail.approve')[0]!.props.disabled).toBe(true);
    const noCode = await mount(screen({ can: makeCan([]) }));
    expect(byId(noCode, 'payoutDetail.approve')[0]!.props.disabled).toBe(true);
  });
});

// ─── SalesReturnsRefundsScreen ───────────────────────────────────────────────

describe('SalesReturnsRefundsScreen wallet refund and reject are wired to the returns API', () => {
  const codes = makeCan(['rma.request.process', 'rma.refund.approve', 'rma.refund.wallet_process']);
  const list = (...rows: ReturnType<typeof returnRow>[]) => ({ items: rows, page: { nextCursor: null, hasMore: false } });
  const screen = () => <SalesReturnsRefundsScreen onBack={noop} can={codes} />;

  it('BR-61d: an APPROVED return refunds to the wallet with an Idempotency-Key; success only after the server answered', async () => {
    api.listReturns.mockResolvedValue(list(returnRow(rid(1), 'APPROVED')));
    api.refundReturnToWallet.mockResolvedValue({ returnRequest: returnRow(rid(1), 'REFUNDED'), walletTransactionId: 'tx-9', amount: '150.00' });
    const tree = await mount(screen());
    await press(tree, `salesReturns.walletRefund.${rid(1)}`);
    expect(api.refundReturnToWallet).not.toHaveBeenCalled();
    await confirmLastAlert();
    expect(api.refundReturnToWallet).toHaveBeenCalledTimes(1);
    const [id, key] = api.refundReturnToWallet.mock.calls[0]!;
    expect(id).toBe(rid(1));
    expect(String(key).length).toBeGreaterThan(0);
    expect(alertMock).toHaveBeenCalledTimes(2);
    expect(alertMock.mock.calls[1]![0]).toBe(t('wiringPayouts.salesReturns.refund.done.title'));
    expect(alertMock.mock.calls[1]![1]).toContain('₹150');
  });

  it('BR-61d: a rejected wallet refund shows the error and no success', async () => {
    api.listReturns.mockResolvedValue(list(returnRow(rid(1), 'APPROVED')));
    api.refundReturnToWallet.mockRejectedValue(apiError('INVALID_STATE_TRANSITION', 409));
    const tree = await mount(screen());
    await press(tree, `salesReturns.walletRefund.${rid(1)}`);
    await confirmLastAlert();
    expect(alertMock).toHaveBeenCalledTimes(1);
    expect(byId(tree, 'salesReturns.error').length).toBe(1);
    expect(allText(tree)).toContain(t('returns.error.INVALID_STATE_TRANSITION'));
  });

  it('BR-61: Reject opens a reason step; Reject is blocked until a non-blank reason is typed', async () => {
    api.listReturns.mockResolvedValue(list(returnRow(rid(2), 'PENDING')));
    const tree = await mount(screen());
    await press(tree, `salesReturns.reject.${rid(2)}`);
    expect(byId(tree, 'salesReturns.rejectSheet.reason').length).toBe(1);
    expect(byId(tree, 'salesReturns.rejectSheet.confirm')[0]!.props.disabled).toBe(true);
    await press(tree, 'salesReturns.rejectSheet.confirm');
    await type(tree, 'salesReturns.rejectSheet.reason', '    ');
    expect(byId(tree, 'salesReturns.rejectSheet.confirm')[0]!.props.disabled).toBe(true);
    await press(tree, 'salesReturns.rejectSheet.confirm');
    expect(api.rejectReturn).not.toHaveBeenCalled();
    expect(byId(tree, 'salesReturns.rejectSheet.reason')[0]!.props.maxLength).toBe(REJECT_REASON_MAX_LENGTH);
  });

  it('BR-61: the typed reason is what is sent; success only after the server answered', async () => {
    api.listReturns.mockResolvedValue(list(returnRow(rid(2), 'PENDING')));
    let resolve!: (v: unknown) => void;
    api.rejectReturn.mockReturnValue(new Promise((r) => (resolve = r)));
    const tree = await mount(screen());
    expect(byId(tree, `salesReturns.walletRefund.${rid(2)}`)[0]!.props.disabled).toBe(true);
    await press(tree, `salesReturns.reject.${rid(2)}`);
    await type(tree, 'salesReturns.rejectSheet.reason', '  Photo shows the produce was fine at pickup.  ');
    await press(tree, 'salesReturns.rejectSheet.confirm');
    expect(api.rejectReturn).toHaveBeenCalledTimes(1);
    expect(api.rejectReturn.mock.calls[0]![0]).toBe(rid(2));
    expect(api.rejectReturn.mock.calls[0]![1]).toEqual({ reason: 'Photo shows the produce was fine at pickup.' });
    expect(alertMock).not.toHaveBeenCalled();
    await act(async () => resolve(returnRow(rid(2), 'REJECTED')));
    await flush();
    expect(alertMock).toHaveBeenCalledTimes(1);
    expect(alertMock.mock.calls[0]![0]).toBe(t('wiringPayouts.salesReturns.reject.done.title'));
    expect(byId(tree, 'salesReturns.rejectSheet.reason').length).toBe(0);
  });

  it('BR-61: a rejected reject shows the error in the reason step and no success', async () => {
    api.listReturns.mockResolvedValue(list(returnRow(rid(2), 'INSPECTED')));
    api.rejectReturn.mockRejectedValue(apiError('INTERNAL', 500));
    const tree = await mount(screen());
    await press(tree, `salesReturns.reject.${rid(2)}`);
    await type(tree, 'salesReturns.rejectSheet.reason', 'Not eligible for return.');
    await press(tree, 'salesReturns.rejectSheet.confirm');
    expect(api.rejectReturn).toHaveBeenCalledTimes(1);
    expect(alertMock).not.toHaveBeenCalled();
    expect(byId(tree, 'salesReturns.rejectSheet.error').length).toBe(1);
    expect(allText(tree)).toContain(t('admin.error.INTERNAL'));
  });

  it('the bank refund stays disabled (owner decision) and the amount is never invented', async () => {
    api.listReturns.mockResolvedValue(list(returnRow(rid(1), 'APPROVED')));
    const tree = await mount(screen());
    expect(byId(tree, `salesReturns.bankRefund.${rid(1)}`)[0]!.props.disabled).toBe(true);
    expect(allText(tree)).not.toContain('₹0');
  });

  it('a failed list shows the error state, not "No returns"', async () => {
    api.listReturns.mockRejectedValue(apiError('INTERNAL', 500));
    const tree = await mount(screen());
    expect(allText(tree)).not.toContain(t('wiringPayouts.returns.empty.title'));
    expect(allText(tree)).toContain(t('admin.error.INTERNAL'));
  });

  it('maps all six return statuses', async () => {
    expect(ALL_STATUSES.map((s) => salesReturnView(s))).toEqual([
      { open: true, refundable: false, rejectable: true, pillKey: null },
      { open: true, refundable: false, rejectable: true, pillKey: null },
      { open: true, refundable: true, rejectable: false, pillKey: null },
      { open: false, refundable: false, rejectable: false, pillKey: 'wiringPayouts.returnPill.REJECTED' },
      { open: false, refundable: false, rejectable: false, pillKey: 'wiringPayouts.returnPill.REFUND_PENDING_BANK' },
      { open: false, refundable: false, rejectable: false, pillKey: 'wiringPayouts.returnPill.REFUNDED' },
    ]);
    api.listReturns.mockResolvedValue(list(...ALL_STATUSES.map((s, i) => returnRow(rid(i + 1), s))));
    const tree = await mount(screen());
    expect(byId(tree, `salesReturns.pill.${rid(4)}`).length).toBe(1);
    expect(allText(tree)).toContain(t('wiringPayouts.returnPill.REJECTED'));
    expect(allText(tree)).toContain(t('wiringPayouts.returnPill.REFUND_PENDING_BANK'));
    expect(allText(tree)).toContain(t('wiringPayouts.returnPill.REFUNDED'));
    // PENDING / INSPECTED / APPROVED are open: actions, no pill.
    for (const n of [1, 2, 3]) expect(byId(tree, `salesReturns.pill.${rid(n)}`).length).toBe(0);
    expect(allText(tree)).toContain(t('wiringPayouts.salesReturns.subtitle', { count: 3 }));
  });
});

// ─── ReturnsRmaRefundsScreen ─────────────────────────────────────────────────

describe('ReturnsRmaRefundsScreen maps the six real return statuses', () => {
  it('labels every status by its meaning; APPROVED is never shown as refunded', async () => {
    expect(ALL_STATUSES.map((s) => financeReturnView(s).labelKey)).toEqual([
      'wiringPayouts.returnStatus.PENDING',
      'wiringPayouts.returnStatus.INSPECTED',
      'wiringPayouts.returnStatus.APPROVED',
      'wiringPayouts.returnStatus.REJECTED',
      'wiringPayouts.returnStatus.REFUND_PENDING_BANK',
      'wiringPayouts.returnStatus.REFUNDED',
    ]);
    expect(financeReturnView('SOMETHING_NEW').labelKey).toBe('wiringPayouts.returnStatus.unknown');
    api.listReturns.mockResolvedValue({ items: ALL_STATUSES.map((s, i) => returnRow(rid(i + 1), s)), page: { nextCursor: null, hasMore: false } });
    const tree = await mount(<ReturnsRmaRefundsScreen onBack={noop} can={makeCan(['rma.request.process'])} />);
    ALL_STATUSES.forEach((s, i) => {
      const node = byId(tree, `returnsRma.status.${rid(i + 1)}`)[0]!;
      expect(textOf(node as never).join('') || node.props.children).toBe(t(financeReturnView(s).labelKey));
    });
    const text = allText(tree);
    expect(text).not.toContain('Approved - Refunded');
    expect(text).not.toContain('Completed');
    // The date is the formatted created label, never '' from split('T').
    expect(text).toContain(t('wiringPayouts.returns.counter', { count: 6, pending: 1 }));
  });

  it('opens the detail from GET /admin/returns/{id}, not from the list row', async () => {
    api.listReturns.mockResolvedValue({ items: [returnRow(rid(1), 'APPROVED')], page: { nextCursor: null, hasMore: false } });
    api.getReturn.mockResolvedValue({ ...returnRow(rid(1), 'APPROVED'), items: [] });
    api.getReturnHistory.mockResolvedValue({ items: [] });
    const tree = await mount(<ReturnsRmaRefundsScreen onBack={noop} can={makeCan(['rma.request.process'])} />);
    await press(tree, `returnsRma.open.${rid(1)}`);
    expect(api.getReturn).toHaveBeenCalledWith(rid(1), expect.anything());
    const text = allText(tree);
    expect(text).toContain(t('wiringPayouts.returnStatus.APPROVED'));
    expect(text).not.toContain('Under Review');
    expect(text).not.toContain('25 Sep 2026');
  });
});

// ─── Source guard over the W2 files ──────────────────────────────────────────

describe('W2 files carry none of the fabrications brief 07 lists', () => {
  const files = [
    'screens/finance/WalletDeductionFlow.tsx',
    'screens/finance/FarmerPayoutDuesScreen.tsx',
    'screens/finance/PurchaseDuesPayoutsScreen.tsx',
    'screens/finance/ReturnsRmaRefundsScreen.tsx',
    'screens/finance/ReturnsRmaDetailScreen.tsx',
    'screens/finance/PayoutProcessingScreen.tsx',
    'screens/sales/SalesReturnsRefundsScreen.tsx',
    'screens/farmers/FarmerPayoutDetailScreen.tsx',
  ];
  const read = (rel: string) => fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8');
  it.each(files)('%s', (rel) => {
    const src = read(rel);
    expect(src).not.toContain("'—'");
    expect(src).not.toMatch(/setTimeout\s*\(/);
    expect(src).not.toMatch(/`(SO|GR|PY|LST|DUE)-\$\{/);
    expect(src).not.toMatch(/parseFloat\(|parseInt\(|Number\(/);
    expect(src).not.toMatch(/\.toFixed\(|\.toLocaleString\(/);
    expect(src).not.toMatch(/>\s*10000\b/);
    expect(src).not.toContain('Deduction Successful');
    expect(src).not.toContain('Bulk Payouts Initiated');
    expect(src).not.toContain('Demo TOHFA Admin');
    expect(src).not.toMatch(/\.split\('T'\)/);
    expect(src).not.toContain('Rejected by TOHFA admin');
  });
});
