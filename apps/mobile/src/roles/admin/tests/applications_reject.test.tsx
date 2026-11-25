/**
 * Reject Application (AdminApplicationRejectScreen) over mocked Phase 1 hooks:
 * a reason code plus a 5-500 character reason is required before anything is
 * sent, and "Application rejected" appears only after the server agreed (the
 * team design showed it before any reason was entered).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance, type ReactTestRendererJSON } from 'react-test-renderer';
import type { Problem } from '@tohfa/shared-types';

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

const hooks = vi.hoisted(() => ({
  useApplication: vi.fn(),
  useApplicationList: vi.fn(),
  useApproveApplication: vi.fn(),
  useRejectApplication: vi.fn(),
}));
vi.mock('../api/farmerHooks', () => hooks);

import { Alert } from 'react-native';
import { ApiError } from '../../../shell/api/client';
import { t } from '../i18n';
import { AdminApplicationRejectScreen } from '../screens/registration/AdminApplicationRejectScreen';

const APP_ID = '0b9c7a52-3f7e-4b55-9a51-6f2b1f0c1a02';
const DECIDE = ['farmer.application.view', 'farmer.application.approve', 'farmer.application.reject'];
const allow = (codes: readonly string[]) => (c: string) => codes.includes(c);

interface DecisionState {
  run: ReturnType<typeof vi.fn>;
  finish: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
  isPending: boolean;
  error: unknown;
}
let reject: DecisionState;

beforeEach(() => {
  vi.clearAllMocks();
  reject = { run: vi.fn(), finish: vi.fn(), reset: vi.fn(), isPending: false, error: null };
  hooks.useRejectApplication.mockImplementation(() => reject);
  hooks.useApplication.mockImplementation((_wh: unknown, id: string | undefined) => ({
    application:
      id === undefined
        ? undefined
        : {
            id,
            status: 'SUBMITTED',
            applicant: { name: 'Revathi Selvam', mobile: '9876512345', address: { village: 'Ketti', district: 'Nilgiris' } },
          },
    isLoading: false,
    error: null,
    refresh: vi.fn(),
    isRefreshing: false,
  }));
});

function texts(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(texts);
  return (node.children ?? []).flatMap(texts);
}
const allText = (tree: renderer.ReactTestRenderer) => texts(tree.toJSON()).join('\n');
const byTestId = (tree: renderer.ReactTestRenderer, id: string): ReactTestInstance[] =>
  tree.root.findAll((n) => typeof n.type === 'string' && n.props['testID'] === id);

function mount(props: Partial<React.ComponentProps<typeof AdminApplicationRejectScreen>> = {}) {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<AdminApplicationRejectScreen applicationId={APP_ID} can={allow(DECIDE)} onBack={vi.fn()} {...props} />);
  });
  return tree;
}

function type(tree: renderer.ReactTestRenderer, text: string) {
  act(() => {
    (byTestId(tree, 'farmerApps.rejectReason')[0]!.props['onChangeText'] as (v: string) => void)(text);
  });
}

function press(tree: renderer.ReactTestRenderer, id: string) {
  act(() => {
    (byTestId(tree, id)[0]!.props['onPress'] as () => void)();
  });
}

describe('AdminApplicationRejectScreen', () => {
  it('without `can` it denies, loads nothing and cannot reject', () => {
    const tree = mount({ can: undefined });
    expect(allText(tree)).toContain(t('farmerApps.reject.denied'));
    expect(hooks.useApplication).toHaveBeenCalledWith(undefined, undefined);
    expect(byTestId(tree, 'farmerApps.rejectConfirm')).toHaveLength(0);
  });

  it('a Farmer-Admin-like `can` (no reject) cannot reject', () => {
    const tree = mount({ can: allow(['farmer.application.view', 'farmer.application.approve']) });
    expect(allText(tree)).toContain(t('farmerApps.reject.denied'));
    expect(byTestId(tree, 'farmerApps.rejectConfirm')).toHaveLength(0);
  });

  it('shows the applicant from the API, not the legacy item or a fixture', () => {
    const tree = mount({
      applicationId: undefined,
      application: { id: APP_ID, name: 'Muthukumar S.', initials: 'MS', location: 'Kotagiri', appliedTime: 'x', badgeLabel: 'y', badgeType: 'green', phone: '+91 98XXX XX412' },
    });
    const text = allText(tree);
    expect(text).toContain('Revathi Selvam');
    expect(text).not.toContain('Muthukumar');
    expect(text).not.toContain('98XXX');
  });

  it('offers exactly the spec reason codes', () => {
    const tree = mount();
    for (const code of ['DOCUMENTS_INVALID', 'LAND_NOT_VERIFIED', 'DUPLICATE_APPLICANT', 'OUTSIDE_SERVICE_AREA', 'OTHER']) {
      expect(byTestId(tree, `farmerApps.rejectReasonCode.${code}`)).toHaveLength(1);
    }
  });

  it('refuses a reason shorter than 5 characters without calling the API', () => {
    const tree = mount();
    type(tree, ' abc ');
    press(tree, 'farmerApps.rejectConfirm');
    expect(reject.run).not.toHaveBeenCalled();
    expect(allText(tree)).toContain(t('farmerApps.reject.tooShort', { min: 5 }));
  });

  it('refuses a reason longer than 500 characters without calling the API', () => {
    const tree = mount();
    type(tree, 'x'.repeat(501));
    press(tree, 'farmerApps.rejectConfirm');
    expect(reject.run).not.toHaveBeenCalled();
    expect(allText(tree)).toContain(t('farmerApps.reject.tooLong', { max: 500 }));
  });

  it('sends reasonCode + trimmed reason, and shows "rejected" only after the server agreed', () => {
    const onConfirmReject = vi.fn();
    const tree = mount({ onConfirmReject });
    press(tree, 'farmerApps.rejectReasonCode.LAND_NOT_VERIFIED');
    type(tree, '  Survey number does not match the FMB sketch.  ');
    press(tree, 'farmerApps.rejectConfirm');

    expect(reject.run).toHaveBeenCalledTimes(1);
    expect(reject.run.mock.calls[0]![0]).toEqual({
      reasonCode: 'LAND_NOT_VERIFIED',
      reason: 'Survey number does not match the FMB sketch.',
    });
    expect(allText(tree)).not.toContain(t('farmerApps.reject.doneTitle'));
    expect(onConfirmReject).not.toHaveBeenCalled();

    const onDone = reject.run.mock.calls[0]![1] as (dto: unknown) => void;
    act(() => onDone({ id: APP_ID, status: 'REJECTED' }));

    expect(allText(tree)).toContain(t('farmerApps.reject.doneTitle'));
    expect(reject.finish).toHaveBeenCalledTimes(1);
    expect(onConfirmReject).toHaveBeenCalledTimes(1);
    expect(byTestId(tree, 'farmerApps.rejectConfirm')).toHaveLength(0);
  });

  it('a failed reject never reports success to the host (no onConfirmReject, so no toast) and adds no second confirmation', () => {
    const onConfirmReject = vi.fn();
    const tree = mount({ onConfirmReject });
    type(tree, 'Duplicate of an approved farmer.');
    press(tree, 'farmerApps.rejectConfirm');
    // The detail screen already confirmed before opening this screen; Confirm Rejection sends straight away.
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(reject.run).toHaveBeenCalledTimes(1);
    reject.error = new ApiError({ type: 'about:blank', title: 'x', status: 409, code: 'CONFLICT' } as Problem);
    act(() => {
      tree.update(<AdminApplicationRejectScreen applicationId={APP_ID} can={allow(DECIDE)} onBack={vi.fn()} onConfirmReject={onConfirmReject} />);
    });
    expect(onConfirmReject).not.toHaveBeenCalled();
  });

  it('a failed reject shows the mapped error and no rejected state', () => {
    const tree = mount();
    type(tree, 'Duplicate of an approved farmer.');
    press(tree, 'farmerApps.rejectConfirm');
    reject.error = new ApiError({ type: 'about:blank', title: 'x', status: 409, code: 'CONFLICT' } as Problem);
    act(() => {
      tree.update(<AdminApplicationRejectScreen applicationId={APP_ID} can={allow(DECIDE)} onBack={vi.fn()} />);
    });
    expect(allText(tree)).toContain(t('admin.error.CONFLICT'));
    expect(allText(tree)).not.toContain(t('farmerApps.reject.doneTitle'));
    expect(reject.finish).not.toHaveBeenCalled();
  });
});
