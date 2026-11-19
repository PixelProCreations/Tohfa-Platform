/**
 * BankPaymentScreen is the summary a farmer opens first. It used to hardcode "HDFC Bank
 * 4821 / Verified" and "murugan.r@okhdfcbank / Pending Verification" -- someone else's
 * invented details, announced to a screen reader as verified. Both cards must come from the
 * server, badges must follow `isVerified`, and a missing or unloadable destination must say
 * so rather than show a placeholder that looks real. BR-53.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';
import type * as WalletApi from '../api/wallet';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  BackHandler: { addEventListener: () => ({ remove: () => undefined }) },
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj['ios'] ?? obj['default'] },
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s },
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));

vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Line: 'Line',
  Path: 'Path',
  Rect: 'Rect',
}));

vi.mock('@tohfa/mobile-ui', () => ({
  ScreenStatusBar: 'ScreenStatusBar',
  SafeAreaView: 'SafeAreaView',
}));

const api = vi.hoisted(() => ({
  listMyBankAccounts: vi.fn(),
  createMyBankAccount: vi.fn(),
  updateMyBankAccount: vi.fn(),
  getMyUpiPreference: vi.fn(),
  setMyUpiPreference: vi.fn(),
}));
vi.mock('../api/payoutDestinations', () => api);

// Only the network call is mocked: the real formatMoneyAmount must run so the test proves
// the card shows what the formatter produces from the server's string.
const walletApi = vi.hoisted(() => ({ getMyWallet: vi.fn() }));
vi.mock('../api/wallet', async () => ({
  ...(await vi.importActual<typeof WalletApi>('../api/wallet')),
  getMyWallet: walletApi.getMyWallet,
}));

import { ApiError } from '../../../shell/api/client';
import { BankPaymentScreen } from '../screens/payment/BankPaymentScreen';
import { t } from '../../../i18n/farmer';

type Json = ReactTestRendererJSON | ReactTestRendererJSON[] | string | null;
function renderedText(node: Json): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(renderedText);
  return (node.children ?? []).flatMap(renderedText);
}

async function settle(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function mount(): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<BankPaymentScreen onBack={() => undefined} />);
  });
  await settle();
  return tree;
}

function labels(tree: renderer.ReactTestRenderer): string[] {
  return tree.root
    .findAll((n) => typeof n.props.accessibilityLabel === 'string')
    .map((n) => n.props.accessibilityLabel as string);
}

const BANK = {
  id: 'acc-1',
  accountHolderName: 'Lakshmi K',
  accountNumberLast4: '9876',
  ifsc: 'SBIN0000123',
  bankName: 'State Bank of India',
  branchName: 'Coonoor',
  upiVpa: null,
  isVerified: false,
  isDefault: true,
  createdAt: '2026-11-01T00:00:00Z',
};
const UPI = { id: 'upi-1', upiVpa: 'lakshmi@oksbi', isVerified: true, isDefault: false };

function problem(status: number, detail: string): ApiError {
  return new ApiError({ type: 'about:blank', title: 'Error', status, code: 'X', detail } as never);
}

const FABRICATED = ['HDFC', '4821', 'murugan', 'okhdfcbank'];
// The old hardcoded wallet card: a balance and a transaction count nobody fetched.
const FABRICATED_WALLET = ['4,250', '4250', '3 recent transactions'];
const WALLET = {
  id: 'w-1',
  ownerType: 'FARMER',
  balance: '1820.50',
  currency: 'INR',
  status: 'ACTIVE',
  updatedAt: '2026-11-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  walletApi.getMyWallet.mockResolvedValue(WALLET);
});

describe('BankPaymentScreen (BR-53)', () => {
  it('BR-53: reads GET /farmers/me/bank-accounts and /upi and shows what the server returned, with badges from isVerified', async () => {
    api.listMyBankAccounts.mockResolvedValue([BANK]);
    api.getMyUpiPreference.mockResolvedValue(UPI);
    const tree = await mount();
    const text = renderedText(tree.toJSON()).join('\n');

    expect(api.listMyBankAccounts).toHaveBeenCalledTimes(1);
    expect(api.getMyUpiPreference).toHaveBeenCalledTimes(1);
    expect(text).toContain('State Bank of India • • • • 9876');
    expect(text).toContain('lakshmi@oksbi');
    // Bank is unverified, UPI is verified: the badges must not be swapped or fixed.
    expect(text).toContain(t('farmer.payment.status.pending'));
    expect(text).toContain(t('farmer.payment.status.verified'));
    for (const fake of FABRICATED) expect(text).not.toContain(fake);

    const l = labels(tree);
    expect(l).toContain('Bank Account. State Bank of India • • • • 9876. Pending Verification');
    expect(l).toContain('UPI ID. lakshmi@oksbi. Verified');
    for (const fake of FABRICATED) expect(l.join('\n')).not.toContain(fake);
  });

  it('BR-53: shows the default bank account, not just the first one', async () => {
    api.listMyBankAccounts.mockResolvedValue([
      { ...BANK, id: 'a', bankName: 'Canara Bank', accountNumberLast4: '1111', isDefault: false },
      { ...BANK, id: 'b', isDefault: true },
    ]);
    api.getMyUpiPreference.mockResolvedValue(UPI);
    const text = renderedText((await mount()).toJSON()).join('\n');
    expect(text).toContain('State Bank of India • • • • 9876');
    expect(text).not.toContain('Canara');
  });

  it('BR-53: with no bank account and no UPI (404) it shows an honest empty state, not a placeholder or an error', async () => {
    api.listMyBankAccounts.mockResolvedValue([]);
    api.getMyUpiPreference.mockRejectedValue(problem(404, 'No UPI id registered'));
    const tree = await mount();
    const text = renderedText(tree.toJSON()).join('\n');

    expect(text).toContain(t('farmer.payment.summary.bank.empty'));
    expect(text).toContain(t('farmer.payment.summary.upi.empty'));
    expect(text).toContain(t('farmer.payment.status.notAdded'));
    expect(text).not.toContain(t('farmer.payment.status.verified'));
    expect(text).not.toContain(t('farmer.payment.status.pending'));
    expect(text).not.toContain(t('farmer.payment.loadFailed'));
    expect(text).not.toContain('•');
    for (const fake of FABRICATED) expect(text).not.toContain(fake);
    expect(labels(tree)).toContain(
      `UPI ID. ${t('farmer.payment.summary.upi.empty')}. ${t('farmer.payment.status.notAdded')}`,
    );
  });

  it('BR-53: a load failure shows the error and a retry, never invented data, and retry reloads', async () => {
    api.listMyBankAccounts.mockRejectedValue(problem(500, 'Database is down'));
    api.getMyUpiPreference.mockRejectedValue(problem(500, 'Database is down'));
    const tree = await mount();
    const text = renderedText(tree.toJSON()).join('\n');

    expect(text).toContain('Database is down');
    expect(text).toContain(t('farmer.payment.summary.unavailable'));
    expect(text).not.toContain(t('farmer.payment.status.verified'));
    expect(text).not.toContain(t('farmer.payment.status.pending'));
    expect(text).not.toContain('•');
    for (const fake of FABRICATED) expect(text).not.toContain(fake);

    api.listMyBankAccounts.mockResolvedValue([BANK]);
    api.getMyUpiPreference.mockResolvedValue(UPI);
    const retry = tree.root.findAllByProps({ accessibilityLabel: t('farmer.payment.retry') })[0]!;
    await act(async () => {
      retry.props.onPress();
    });
    await settle();
    const after = renderedText(tree.toJSON()).join('\n');
    expect(api.listMyBankAccounts).toHaveBeenCalledTimes(2);
    expect(after).toContain('lakshmi@oksbi');
    expect(after).not.toContain('Database is down');
  });

  it('BR-53: one destination failing does not hide or invent the other', async () => {
    api.listMyBankAccounts.mockRejectedValue(problem(500, 'Database is down'));
    api.getMyUpiPreference.mockResolvedValue(UPI);
    const text = renderedText((await mount()).toJSON()).join('\n');
    expect(text).toContain('lakshmi@oksbi');
    expect(text).toContain(t('farmer.payment.summary.unavailable'));
    for (const fake of FABRICATED) expect(text).not.toContain(fake);
  });

  it('BR-53: shows a loading state, not data, until the server answers', async () => {
    api.listMyBankAccounts.mockReturnValue(new Promise(() => undefined));
    api.getMyUpiPreference.mockReturnValue(new Promise(() => undefined));
    const tree = await mount();
    const text = renderedText(tree.toJSON()).join('\n');
    expect(tree.root.findAllByType('ActivityIndicator' as never).length).toBe(2);
    expect(text).not.toContain(t('farmer.payment.status.verified'));
    expect(text).not.toContain(t('farmer.payment.summary.bank.empty'));
  });

  it('BR-53: the wallet card reads GET /wallets/me and renders the server balance, in both text and screen-reader label', async () => {
    api.listMyBankAccounts.mockResolvedValue([BANK]);
    api.getMyUpiPreference.mockResolvedValue(UPI);
    walletApi.getMyWallet.mockResolvedValue({ ...WALLET, balance: '123456.50' });
    const tree = await mount();
    const text = renderedText(tree.toJSON()).join('\n');

    expect(walletApi.getMyWallet).toHaveBeenCalledTimes(1);
    expect(text).toContain('Balance: ₹1,23,456.50');
    expect(labels(tree)).toContain('Wallet. Balance: ₹1,23,456.50');
    for (const fake of FABRICATED_WALLET) {
      expect(text).not.toContain(fake);
      expect(labels(tree).join('\n')).not.toContain(fake);
    }
  });

  it('BR-53: a real zero balance from the server is shown as zero, and a missing wallet (404) is an empty state, not a number', async () => {
    api.listMyBankAccounts.mockResolvedValue([BANK]);
    api.getMyUpiPreference.mockResolvedValue(UPI);
    walletApi.getMyWallet.mockResolvedValue({ ...WALLET, balance: '0.00' });
    expect(renderedText((await mount()).toJSON()).join('\n')).toContain('Balance: ₹0.00');

    walletApi.getMyWallet.mockRejectedValue(problem(404, 'No wallet'));
    const tree = await mount();
    const text = renderedText(tree.toJSON()).join('\n');
    expect(text).toContain(t('farmer.payment.summary.wallet.empty'));
    expect(text).not.toContain('₹');
    expect(text).not.toContain(t('farmer.payment.loadFailed'));
    expect(labels(tree)).toContain(`Wallet. ${t('farmer.payment.summary.wallet.empty')}`);
  });

  it('BR-53: a wallet failure shows the error and no number, leaves bank and UPI intact, and retry reloads the wallet', async () => {
    api.listMyBankAccounts.mockResolvedValue([BANK]);
    api.getMyUpiPreference.mockResolvedValue(UPI);
    walletApi.getMyWallet.mockRejectedValue(problem(500, 'Ledger is down'));
    const tree = await mount();
    const text = renderedText(tree.toJSON()).join('\n');

    expect(text).toContain('Ledger is down');
    expect(text).toContain(t('farmer.payment.summary.unavailable'));
    expect(text).not.toContain('₹');
    expect(text).not.toContain('Balance');
    for (const fake of FABRICATED_WALLET) expect(text).not.toContain(fake);
    expect(labels(tree)).toContain(`Wallet. ${t('farmer.payment.summary.unavailable')}`);
    // The other cards are unaffected by the wallet failing.
    expect(text).toContain('State Bank of India • • • • 9876');
    expect(text).toContain('lakshmi@oksbi');

    walletApi.getMyWallet.mockResolvedValue(WALLET);
    const retry = tree.root.findAllByProps({ accessibilityLabel: t('farmer.payment.retry') })[0]!;
    await act(async () => {
      retry.props.onPress();
    });
    await settle();
    const after = renderedText(tree.toJSON()).join('\n');
    expect(walletApi.getMyWallet).toHaveBeenCalledTimes(2);
    expect(after).toContain('Balance: ₹1,820.50');
    expect(after).not.toContain('Ledger is down');
  });

  it('BR-53: the wallet card shows a spinner, not a balance, until the server answers, and bank/UPI failing does not hide it', async () => {
    api.listMyBankAccounts.mockRejectedValue(problem(500, 'Database is down'));
    api.getMyUpiPreference.mockRejectedValue(problem(500, 'Database is down'));
    walletApi.getMyWallet.mockReturnValue(new Promise(() => undefined));
    const pending = await mount();
    expect(pending.root.findAllByType('ActivityIndicator' as never).length).toBe(1);
    expect(renderedText(pending.toJSON()).join('\n')).not.toContain('₹');

    walletApi.getMyWallet.mockResolvedValue(WALLET);
    const text = renderedText((await mount()).toJSON()).join('\n');
    expect(text).toContain('Balance: ₹1,820.50');
    expect(text).toContain('Database is down');
  });
});
