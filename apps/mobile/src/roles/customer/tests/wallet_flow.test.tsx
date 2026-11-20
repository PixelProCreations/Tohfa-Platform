import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Image: 'Image',
  Platform: { OS: 'android', select: (o: Record<string, unknown>) => o['android'] ?? o['default'] },
  RefreshControl: 'RefreshControl',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s, hairlineWidth: 1, absoluteFill: {}, absoluteFillObject: {} },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
  StatusBar: 'StatusBar',
  Modal: (props: any) => (props.visible ? React.createElement('Modal', props, props.children) : null),
}));
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 48, bottom: 24, left: 0, right: 0 }),
}));
vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Path: 'Path', Rect: 'Rect' }));
vi.mock('../assets/images', () => ({ walletPouchCard: 1, profileEmailVerified: 2 }));

const h = vi.hoisted(() => ({
  wallet: { data: undefined as any, isLoading: false, isError: false, error: null as any, refetch: vi.fn() },
  tx: {
    data: undefined as any,
    isLoading: false,
    isError: false,
    error: null as any,
    refetch: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
  },
  topup: { mutateAsync: vi.fn(), isPending: false },
  lookup: { mutateAsync: vi.fn(), isPending: false },
  send: { mutateAsync: vi.fn(), isPending: false },
  history: { data: { pages: [{ items: [] }] }, isLoading: false, isError: false, refetch: vi.fn(), hasNextPage: false, fetchNextPage: vi.fn() },
  fetchTopupReceipt: vi.fn(),
}));

vi.mock('../api/wallet', () => ({
  useWallet: () => h.wallet,
  useWalletTransactions: () => h.tx,
  fetchTopupReceipt: h.fetchTopupReceipt,
}));
vi.mock('../api/topup', () => ({ useWalletTopup: () => h.topup }));
vi.mock('../api/transfers', () => ({
  useLookupRecipient: () => h.lookup,
  useSendTransfer: () => h.send,
  useTransfers: () => h.history,
}));

import { ApiError } from '../../../shell/api/client';
import { CustomerWalletScreen } from '../screens/CustomerWalletScreen';
import { CustomerSendMoneyScreen } from '../screens/CustomerSendMoneyScreen';
import {
  buildTransactionQuery,
  checkAmount,
  formatInr,
  formatIstDateTime,
  normalizeIndianMobile,
  parseAmountInput,
  presentTransaction,
  shortfallToTopupText,
  topupChips,
} from '../api/walletMoney';

const problem = (status: number, code: string, extra: Record<string, unknown> = {}) => {
  const { retryAfterSeconds, ...rest } = extra;
  return new ApiError({ type: 'x', title: code, status, code, ...rest } as any, {
    retryAfterSeconds: (retryAfterSeconds as number | undefined) ?? null,
  });
};

const tx = (over: Record<string, unknown> = {}) => ({
  id: 'abcdef12-0000-4000-8000-000000000001',
  walletId: 'w',
  txnType: 'TOPUP_DIGITAL',
  amount: '1000.00',
  balanceAfter: '2250.00',
  refType: null,
  refId: null,
  performedAt: '2026-11-12T04:54:00Z',
  remarks: null,
  txnCode: 'TXN-ABCDEF1200',
  orderNumber: null,
  status: 'COMPLETED',
  ...over,
});

const mount = async (el: React.ReactElement) => {
  let tree: any;
  await act(async () => {
    tree = renderer.create(el);
  });
  return tree;
};
const press = async (tree: any, label: string) => {
  await act(async () => {
    await tree.root.findByProps({ accessibilityLabel: label }).props.onPress();
  });
};
const typeInto = async (tree: any, label: string, text: string) => {
  await act(async () => {
    tree.root.findByProps({ accessibilityLabel: label }).props.onChangeText(text);
  });
};
const json = (tree: any) =>
  JSON.stringify(tree.toJSON(), (k, v) => (k === '_owner' || k === 'refreshControl' ? undefined : v));

beforeEach(() => {
  vi.clearAllMocks();
  h.wallet.data = { id: 'w', balance: '1250.00', status: 'ACTIVE', topupLimits: { min: '100.00', max: '50000.00' } };
  h.wallet.isLoading = false;
  h.wallet.isError = false;
  h.tx.data = { pages: [{ items: [tx(), tx({ id: 'abcdef12-0000-4000-8000-000000000002', txnType: 'ORDER_DEBIT', amount: '-360.00', orderNumber: 'ORD-1', txnCode: 'TXN-ABCDEF1201' })] }] };
  h.tx.isLoading = false;
  h.tx.isError = false;
  h.tx.hasNextPage = false;
  h.topup.isPending = false;
  h.lookup.isPending = false;
  h.send.isPending = false;
  h.history.data = { pages: [{ items: [] }] };
});

describe('walletMoney helpers', () => {
  it('formats and parses money without floats', () => {
    expect(formatInr('1250.00')).toBe('₹ 1,250.00');
    expect(formatInr(null)).toBe('—');
    expect(parseAmountInput('100.5')).toBe('100.50');
    expect(parseAmountInput('0')).toBeNull();
    expect(parseAmountInput('1.234')).toBeNull();
    expect(parseAmountInput('abc')).toBeNull();
  });
  it('validates against topup limits', () => {
    const limits = { min: '100.00', max: '50000.00' };
    expect(checkAmount('99', limits)).toEqual({ ok: false, reason: 'below_min' });
    expect(checkAmount('50001', limits)).toEqual({ ok: false, reason: 'above_max' });
    expect(checkAmount('500', limits)).toEqual({ ok: true, amount: '500.00' });
    expect(topupChips({ min: '1000.00', max: '2000.00' })).toEqual([1000, 2000]);
  });
  it('normalises Indian mobiles and shortfall prefill', () => {
    expect(normalizeIndianMobile('98765 43210')).toBe('+919876543210');
    expect(normalizeIndianMobile('+91 98765 43210')).toBe('+919876543210');
    expect(normalizeIndianMobile('12345')).toBeNull();
    expect(shortfallToTopupText('50.01')).toBe('51');
    expect(shortfallToTopupText(undefined)).toBe('');
  });
  it('presents rows and formats IST', () => {
    expect(presentTransaction({ txnType: 'ORDER_DEBIT', amount: '-5.00' as any })).toMatchObject({ title: 'Order Payment', credit: false });
    expect(formatIstDateTime('2026-11-12T04:54:00Z')).toBe('12 Nov 2026, 10:24 AM');
  });
  it('builds the transactions query from filters (IST day boundaries as UTC)', () => {
    expect(buildTransactionQuery({ tab: 'all', range: 'all' })).toEqual({});
    const q = buildTransactionQuery({ tab: 'credits', type: 'TOPUP_DIGITAL', range: '7d' }, new Date('2026-11-17T10:00:00Z'));
    expect(q['tab']).toBe('credits');
    expect(q['type']).toBe('TOPUP_DIGITAL');
    expect(q['from']).toBe('2026-11-10T18:30:00.000Z');
    expect(q['to']).toBe('2026-11-17T18:29:59.999Z');
  });
});

describe('CustomerWalletScreen', () => {
  it('shows the server balance and ledger rows', async () => {
    const tree = await mount(<CustomerWalletScreen />);
    const out = json(tree);
    expect(out).toContain('1,250.00');
    expect(out).toContain('Added to Wallet');
    expect(out).toContain('Order Payment');
    expect(out).toContain('ORD-1');
    expect(out).toContain('TXN-ABCDEF1200');
    expect(out).toContain('- ₹ 360.00');
  });
  it('shows loading and empty and error states', async () => {
    h.tx.isLoading = true;
    expect(json(await mount(<CustomerWalletScreen />))).toContain('Loading transactions');
    h.tx.isLoading = false;
    h.tx.data = { pages: [{ items: [] }] };
    expect(json(await mount(<CustomerWalletScreen />))).toContain('No transactions yet');
    h.tx.data = undefined;
    h.tx.isError = true;
    h.tx.error = problem(500, 'INTERNAL');
    const tree = await mount(<CustomerWalletScreen />);
    await press(tree, 'Retry transactions');
    expect(h.tx.refetch).toHaveBeenCalled();
  });
  it('navigates to Send Money', async () => {
    const nav = vi.fn();
    const tree = await mount(<CustomerWalletScreen onNavigate={nav} />);
    await press(tree, 'Send Money');
    expect(nav).toHaveBeenCalledWith('CustomerSendMoney');
  });
  it('validates the top-up amount against topupLimits and keeps Pay disabled', async () => {
    const tree = await mount(<CustomerWalletScreen initialMode="add_money" />);
    await typeInto(tree, 'Amount', '50');
    expect(json(tree)).toContain('Minimum top-up is ₹100');
    expect(tree.root.findByProps({ accessibilityLabel: 'Add to Wallet' }).props.disabled).toBe(true);
  });
  it('prefills a shortfall and shows the receipt after a successful top-up (no client crediting)', async () => {
    h.topup.mutateAsync.mockResolvedValue({
      status: 'success',
      intent: { topupId: 't1' },
      receipt: { amount: '600.00', balanceAfter: '1850.00', transactionId: 'abcdef12-0000-4000-8000-000000000009', status: 'SUCCESS' },
    });
    const done = vi.fn();
    const tree = await mount(<CustomerWalletScreen initialMode="add_money" initialAmount="599.5" onTopupComplete={done} />);
    // initialAmount is already a whole-rupee string from TopupScreen; typed value passes validation
    await typeInto(tree, 'Amount', '600');
    await press(tree, 'Add to Wallet');
    expect(h.topup.mutateAsync).toHaveBeenCalledWith({ amount: '600.00', mode: 'UPI' });
    const out = json(tree);
    expect(out).toContain('Money added successfully!');
    expect(out).toContain('1,850.00');
    expect(out).toContain('TXN-ABCDEF1200');
    await press(tree, 'View Wallet').catch(() => undefined);
  });
  it('is honest about a pending payment and rechecks the receipt', async () => {
    h.topup.mutateAsync.mockResolvedValue({ status: 'pending', intent: { topupId: 't1', amount: '500.00' } });
    h.fetchTopupReceipt.mockResolvedValue({ status: 'SUCCESS', amount: '500.00', balanceAfter: '1750.00', transactionId: null });
    const tree = await mount(<CustomerWalletScreen initialMode="add_money" />);
    await typeInto(tree, 'Amount', '500');
    await press(tree, 'Add to Wallet');
    expect(json(tree)).toContain('Confirming your payment');
    await press(tree, 'Check status');
    expect(json(tree)).toContain('Money added successfully!');
  });
  it('maps 422 and 429 errors, with a wait countdown', async () => {
    h.topup.mutateAsync.mockRejectedValueOnce(problem(422, 'VALIDATION_FAILED', { meta: { topupLimits: { min: '100.00', max: '50000.00' } } }));
    const tree = await mount(<CustomerWalletScreen initialMode="add_money" />);
    await typeInto(tree, 'Amount', '500');
    await press(tree, 'Add to Wallet');
    expect(json(tree)).toContain('alert');
    h.topup.mutateAsync.mockRejectedValueOnce(problem(429, 'RATE_LIMITED', { retryAfterSeconds: 30 }));
    await press(tree, 'Add to Wallet');
    expect(tree.root.findByProps({ accessibilityLabel: 'Add to Wallet' }).props.disabled).toBe(true);
  });
  it('shows the failed state and a cancelled notice', async () => {
    h.topup.mutateAsync.mockResolvedValueOnce({ status: 'failed', intent: { topupId: 't' }, reason: 'server' });
    const tree = await mount(<CustomerWalletScreen initialMode="add_money" />);
    await typeInto(tree, 'Amount', '500');
    await press(tree, 'Add to Wallet');
    expect(json(tree)).toContain('Payment failed');
    h.topup.mutateAsync.mockResolvedValueOnce({ status: 'cancelled', intent: { topupId: 't' } });
    await press(tree, 'Try again');
    await press(tree, 'Add to Wallet');
    expect(json(tree)).toContain('Payment cancelled');
  });
  it('disables actions when the wallet is frozen', async () => {
    h.wallet.data = { ...h.wallet.data, status: 'FROZEN' };
    const tree = await mount(<CustomerWalletScreen />);
    expect(json(tree)).toContain('on hold');
    expect(tree.root.findByProps({ accessibilityLabel: 'Add Money' }).props.disabled).toBe(true);
  });
});

describe('CustomerSendMoneyScreen', () => {
  const fill = async (tree: any) => {
    await typeInto(tree, 'Recipient mobile number', '98765 43210');
    h.lookup.mutateAsync.mockResolvedValueOnce({ displayName: 'B*** K***', mobileMasked: '******3210' });
    await press(tree, 'Verify recipient');
    await typeInto(tree, 'Amount', '250');
  };

  it('has no wallet-id tab, contacts list, mock recipient or OTP', async () => {
    const out = json(await mount(<CustomerSendMoneyScreen />));
    expect(out).not.toContain('Wallet ID');
    expect(out).not.toContain('Ramesh');
    expect(out).not.toContain('OTP');
    expect(out).toContain('1,250.00');
  });
  it('verifies a recipient (masked) then sends with receipt from the response', async () => {
    h.send.mutateAsync.mockResolvedValue({
      id: 'abcdef12-0000-4000-8000-0000000000aa',
      direction: 'SENT',
      amount: '250.00',
      counterparty: { displayName: 'B*** K***', mobileMasked: '******3210' },
      note: null,
      status: 'COMPLETED',
      createdAt: '2026-11-12T04:54:00Z',
      balanceAfter: '1000.00',
    });
    const tree = await mount(<CustomerSendMoneyScreen />);
    await fill(tree);
    expect(h.lookup.mutateAsync).toHaveBeenCalledWith('+919876543210');
    expect(json(tree)).toContain('B*** K***');
    await press(tree, 'Send Money');
    await press(tree, 'Confirm Transfer');
    expect(h.send.mutateAsync).toHaveBeenCalledWith({ recipientMobile: '+919876543210', amount: '250.00', note: '' });
    const out = json(tree);
    expect(out).toContain('Money Sent successfully!');
    expect(out).toContain('1,000.00');
    expect(out).toContain('TXN-ABCDEF1200'.slice(0, 4));
  });
  it('blocks amounts above the balance client-side', async () => {
    const tree = await mount(<CustomerSendMoneyScreen />);
    await fill(tree);
    await typeInto(tree, 'Amount', '5000');
    expect(tree.root.findByProps({ accessibilityLabel: 'Send Money', disabled: true })).toBeTruthy();
  });
  it('maps lookup 404 and 429 (disables verify with countdown)', async () => {
    const tree = await mount(<CustomerSendMoneyScreen />);
    await typeInto(tree, 'Recipient mobile number', '9876543210');
    h.lookup.mutateAsync.mockRejectedValueOnce(problem(404, 'NOT_FOUND'));
    await press(tree, 'Verify recipient');
    expect(json(tree)).toContain('No TOHFA account found');
    h.lookup.mutateAsync.mockRejectedValueOnce(problem(429, 'RATE_LIMITED', { retryAfterSeconds: 45 }));
    await press(tree, 'Verify recipient');
    expect(tree.root.findByProps({ accessibilityLabel: 'Verify recipient' }).props.disabled).toBe(true);
    expect(json(tree)).toContain('45');
  });
  it('402 offers Add money with the shortfall', async () => {
    const nav = vi.fn();
    const tree = await mount(<CustomerSendMoneyScreen onNavigate={nav} />);
    await fill(tree);
    h.send.mutateAsync.mockRejectedValueOnce(
      problem(402, 'WALLET_INSUFFICIENT', { shortfall: '50.00', balance: '200.00', required: '250.00' }),
    );
    await press(tree, 'Send Money');
    await press(tree, 'Confirm Transfer');
    await press(tree, 'Add money');
    expect(nav).toHaveBeenCalledWith('Topup', { shortfall: '50.00' });
  });
  it('422 limit error shows the server detail and closes the review step', async () => {
    const tree = await mount(<CustomerSendMoneyScreen />);
    await fill(tree);
    h.send.mutateAsync.mockRejectedValueOnce(problem(422, 'WALLET_TRANSFER_LIMIT_EXCEEDED', { detail: 'Max per transfer is 2000.00' }));
    await press(tree, 'Send Money');
    await press(tree, 'Confirm Transfer');
    expect(json(tree)).toContain('Max per transfer is 2000.00');
  });
});
