/**
 * BankAccountScreen and UpiIdScreen used to show "Account Updated" / "UPI ID Saved"
 * without calling the server, and rendered a made-up account ("Murugan R.", HDFC,
 * "murugan.r@okhdfcbank"). A farmer's payout identity must come from the server and a
 * success message must follow a real 2xx. BR-53.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';

const alertSpy = vi.hoisted(() => vi.fn());

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: alertSpy },
  BackHandler: { addEventListener: () => ({ remove: () => undefined }) },
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj['ios'] ?? obj['default'] },
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s },
  Switch: 'Switch',
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));

vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Line: 'Line',
  Path: 'Path',
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

import { ApiError } from '../../../shell/api/client';
import { BankAccountScreen } from '../screens/payment/BankAccountScreen';
import { UpiIdScreen } from '../screens/payment/UpiIdScreen';
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

async function mount(element: React.ReactElement): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(element);
  });
  await settle();
  return tree;
}

type Instance = renderer.ReactTestInstance;
function byLabel(tree: renderer.ReactTestRenderer, label: string): Instance {
  return tree.root.findByProps({ accessibilityLabel: label });
}
function inputByPlaceholder(tree: renderer.ReactTestRenderer, placeholder: string): Instance {
  return tree.root.findByProps({ placeholder });
}
async function press(instance: Instance): Promise<void> {
  await act(async () => {
    instance.props.onPress();
  });
  await settle();
}
function type(instance: Instance, value: string): void {
  act(() => {
    instance.props.onChangeText(value);
  });
}

const ACCOUNT = {
  id: 'acc-1',
  accountHolderName: 'Lakshmi K',
  accountNumberLast4: '9876',
  ifsc: 'SBIN0000123',
  bankName: 'State Bank of India',
  branchName: 'Coonoor',
  upiVpa: null,
  isVerified: true,
  isDefault: true,
  createdAt: '2026-11-01T00:00:00Z',
};

function problem(status: number, code: string, detail: string): ApiError {
  return new ApiError({ type: 'about:blank', title: 'Error', status, code, detail } as never);
}

const FABRICATED = ['Murugan', 'HDFC', 'Ooty Main Branch', '4821', 'murugan.r@okhdfcbank'];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('BankAccountScreen (BR-53)', () => {
  it('BR-53: loads the account from GET /farmers/me/bank-accounts and shows only what the server returned', async () => {
    api.listMyBankAccounts.mockResolvedValue([ACCOUNT]);
    const tree = await mount(<BankAccountScreen onBack={() => undefined} />);
    const text = renderedText(tree.toJSON()).join('\n');

    expect(api.listMyBankAccounts).toHaveBeenCalledTimes(1);
    expect(text).toContain('Lakshmi K');
    expect(text).toContain('State Bank of India');
    expect(text).toContain('9876');
    expect(text).toContain('SBIN0000123');
    for (const fake of FABRICATED) expect(text).not.toContain(fake);
  });

  it('BR-53: shows no invented account and an unavailable edit button when the list call fails', async () => {
    api.listMyBankAccounts.mockRejectedValue(problem(500, 'INTERNAL', 'Database is down'));
    const tree = await mount(<BankAccountScreen onBack={() => undefined} />);
    const text = renderedText(tree.toJSON()).join('\n');

    expect(text).toContain('Database is down');
    for (const fake of FABRICATED) expect(text).not.toContain(fake);
    expect(byLabel(tree, 'Edit bank account details').props.disabled).toBe(true);
  });

  it('BR-53: PATCHes only the changed fields and shows success only after the server answers 2xx', async () => {
    api.listMyBankAccounts.mockResolvedValue([ACCOUNT]);
    api.updateMyBankAccount.mockResolvedValue({ ...ACCOUNT, bankName: 'SBI', isVerified: false });
    const tree = await mount(<BankAccountScreen onBack={() => undefined} />);

    await press(byLabel(tree, 'Edit bank account details'));
    type(inputByPlaceholder(tree, 'Bank name'), 'SBI');
    await press(byLabel(tree, 'Save Changes'));

    expect(api.updateMyBankAccount).toHaveBeenCalledWith('acc-1', { bankName: 'SBI' });
    expect(api.createMyBankAccount).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0]?.[0]).toBe('Account Updated');
    // The screen now shows what the server stored, including the reset verification.
    expect(renderedText(tree.toJSON())).toContain('Pending Verification');
  });

  it('BR-53: POSTs a new account when none exists, with the full number the farmer typed', async () => {
    api.listMyBankAccounts.mockResolvedValue([]);
    api.createMyBankAccount.mockResolvedValue(ACCOUNT);
    const tree = await mount(<BankAccountScreen onBack={() => undefined} />);

    await press(byLabel(tree, 'Edit bank account details'));
    type(inputByPlaceholder(tree, 'Full name as on passbook'), 'Lakshmi K');
    type(inputByPlaceholder(tree, 'Bank name'), 'State Bank of India');
    type(inputByPlaceholder(tree, 'Account number'), '123456789876');
    type(inputByPlaceholder(tree, 'IFSC code'), 'sbin0000123');
    await press(byLabel(tree, 'Save Changes'));

    expect(api.createMyBankAccount).toHaveBeenCalledWith({
      accountHolderName: 'Lakshmi K',
      accountNumber: '123456789876',
      ifsc: 'SBIN0000123',
      bankName: 'State Bank of India',
    });
    expect(alertSpy.mock.calls[0]?.[0]).toBe(t('farmer.payment.bank.addedTitle'));
  });

  it('BR-53: does NOT show success when the save fails, shows the server error and keeps the draft', async () => {
    api.listMyBankAccounts.mockResolvedValue([ACCOUNT]);
    api.updateMyBankAccount.mockRejectedValue(problem(422, 'VALIDATION_FAILED', 'IFSC is not valid'));
    const onSaveSuccess = vi.fn();
    const tree = await mount(<BankAccountScreen onBack={() => undefined} onSaveSuccess={onSaveSuccess} />);

    await press(byLabel(tree, 'Edit bank account details'));
    type(inputByPlaceholder(tree, 'IFSC code'), 'BAD');
    await press(byLabel(tree, 'Save Changes'));

    expect(api.updateMyBankAccount).toHaveBeenCalledTimes(1);
    expect(alertSpy).not.toHaveBeenCalled();
    expect(onSaveSuccess).not.toHaveBeenCalled();
    expect(renderedText(tree.toJSON()).join('\n')).toContain('IFSC is not valid');
    // Still in edit mode, draft intact, the saved value was not overwritten.
    expect(inputByPlaceholder(tree, 'IFSC code').props.value).toBe('BAD');
  });

  it('BR-53: an edit that changes nothing makes no request and shows no success', async () => {
    api.listMyBankAccounts.mockResolvedValue([ACCOUNT]);
    const tree = await mount(<BankAccountScreen onBack={() => undefined} />);

    await press(byLabel(tree, 'Edit bank account details'));
    await press(byLabel(tree, 'Save Changes'));

    expect(api.updateMyBankAccount).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });
});

describe('UpiIdScreen (BR-53)', () => {
  const UPI = { id: 'upi-1', upiVpa: 'lakshmi@oksbi', isVerified: false, isDefault: false };

  it('BR-53: loads the UPI id from GET /farmers/me/upi instead of a made-up one', async () => {
    api.getMyUpiPreference.mockResolvedValue(UPI);
    const tree = await mount(<UpiIdScreen onBack={() => undefined} />);

    expect(api.getMyUpiPreference).toHaveBeenCalledTimes(1);
    expect(inputByPlaceholder(tree, 'e.g. yourname@okhdfcbank').props.value).toBe('lakshmi@oksbi');
    expect(renderedText(tree.toJSON())).toContain('Pending Verification');
    expect(renderedText(tree.toJSON()).join('\n')).not.toContain('murugan');
  });

  it('BR-53: a 404 means no UPI registered yet: empty field, "Not added", not an error', async () => {
    api.getMyUpiPreference.mockRejectedValue(problem(404, 'NOT_FOUND', 'No UPI'));
    const tree = await mount(<UpiIdScreen onBack={() => undefined} />);

    expect(inputByPlaceholder(tree, 'e.g. yourname@okhdfcbank').props.value).toBe('');
    expect(renderedText(tree.toJSON())).toContain(t('farmer.payment.status.notAdded'));
    expect(byLabel(tree, 'Save Changes').props.disabled).toBe(false);
  });

  it('BR-53: PUTs the typed UPI id (isDefault omitted when untouched) and shows success only after 2xx', async () => {
    api.getMyUpiPreference.mockRejectedValue(problem(404, 'NOT_FOUND', 'No UPI'));
    api.setMyUpiPreference.mockResolvedValue({ ...UPI, upiVpa: 'new@okaxis', isDefault: true });
    const onSaveSuccess = vi.fn();
    const tree = await mount(<UpiIdScreen onBack={() => undefined} onSaveSuccess={onSaveSuccess} />);

    type(inputByPlaceholder(tree, 'e.g. yourname@okhdfcbank'), '  new@okaxis ');
    await press(byLabel(tree, 'Save Changes'));

    expect(api.setMyUpiPreference).toHaveBeenCalledWith({ upiVpa: 'new@okaxis' });
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0]?.[0]).toBe('UPI ID Saved');
  });

  it('BR-53: sends isDefault only when the farmer toggled the switch', async () => {
    api.getMyUpiPreference.mockResolvedValue(UPI);
    api.setMyUpiPreference.mockResolvedValue({ ...UPI, isDefault: true });
    const tree = await mount(<UpiIdScreen onBack={() => undefined} />);

    act(() => {
      tree.root.findByType('Switch' as unknown as React.ElementType).props.onValueChange(true);
    });
    await press(byLabel(tree, 'Save Changes'));

    expect(api.setMyUpiPreference).toHaveBeenCalledWith({ upiVpa: 'lakshmi@oksbi', isDefault: true });
  });

  it('BR-53: does NOT show success when the save fails, and shows the server error', async () => {
    api.getMyUpiPreference.mockResolvedValue(UPI);
    api.setMyUpiPreference.mockRejectedValue(problem(422, 'VALIDATION_FAILED', 'UPI ID format is invalid'));
    const onSaveSuccess = vi.fn();
    const tree = await mount(<UpiIdScreen onBack={() => undefined} onSaveSuccess={onSaveSuccess} />);

    type(inputByPlaceholder(tree, 'e.g. yourname@okhdfcbank'), 'not-a-upi');
    await press(byLabel(tree, 'Save Changes'));

    expect(api.setMyUpiPreference).toHaveBeenCalledTimes(1);
    expect(alertSpy).not.toHaveBeenCalled();
    expect(onSaveSuccess).not.toHaveBeenCalled();
    expect(renderedText(tree.toJSON()).join('\n')).toContain('UPI ID format is invalid');
    expect(inputByPlaceholder(tree, 'e.g. yourname@okhdfcbank').props.value).toBe('not-a-upi');
  });

  it('BR-53: an empty UPI id is rejected locally with no request and no success', async () => {
    api.getMyUpiPreference.mockRejectedValue(problem(404, 'NOT_FOUND', 'No UPI'));
    const tree = await mount(<UpiIdScreen onBack={() => undefined} />);

    await press(byLabel(tree, 'Save Changes'));

    expect(api.setMyUpiPreference).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
    expect(renderedText(tree.toJSON())).toContain(t('farmer.payment.upi.required'));
  });

  it('BR-53: a failed load (not 404) disables Save and invents no UPI id', async () => {
    api.getMyUpiPreference.mockRejectedValue(problem(500, 'INTERNAL', 'Upstream failure'));
    const tree = await mount(<UpiIdScreen onBack={() => undefined} />);

    expect(renderedText(tree.toJSON()).join('\n')).toContain('Upstream failure');
    expect(byLabel(tree, 'Save Changes').props.disabled).toBe(true);
    expect(inputByPlaceholder(tree, 'e.g. yourname@okhdfcbank').props.value).toBe('');
  });
});
