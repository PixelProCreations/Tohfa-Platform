/**
 * Application review (AdminApplicationDetailScreen), rendered with
 * react-test-renderer over mocked Phase 1 hooks: what the reviewer sees comes
 * from the application the API returned, never the design's fixture text; the
 * Approve/Reject bar shows only to an admin who can actually decide; Approve
 * moves the screen to its in-place Approved state only after the server agreed.
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
import type { ApplicationDetailView } from '../api/farmerTypes';
import { t } from '../i18n';
import { AdminApplicationDetailScreen } from '../screens/registration/AdminApplicationDetailScreen';

const APP_ID = '0b9c7a52-3f7e-4b55-9a51-6f2b1f0c1a01';
const ALL_CODES = [
  'farmer.application.list_pending',
  'farmer.application.view',
  'farmer.application.approve',
  'farmer.application.reject',
];
const allow = (codes: readonly string[]) => (c: string) => codes.includes(c);

/** Text the team design hard-codes; none of it may ever render. */
const DESIGN_FIXTURE_TEXT = [
  'Sathish Kumar',
  'APP-2026-0101',
  '1.8 acres',
  '2.0 acre',
  '+91 99801 00100',
  'Thottam Street',
  'Ooty, zone A',
  'Demo plot',
  '05 Oct 2026',
  '10 Oct 2026',
  'fmb-0101.pdf',
  'kyc-doc-1.pdf',
  'PLT-00124-1',
  'Carrot, Cabbage',
  'Organic practices declaration submitted',
  'All requirements met',
  'Waiting on document verification',
  'Muthukumar',
  '98XXX',
  'M3-S03b',
  'Approval is blocked',
  'proposed list, to confirm',
];

function detail(over: Partial<ApplicationDetailView> = {}): ApplicationDetailView {
  return {
    id: APP_ID,
    status: 'SUBMITTED',
    isDecided: false,
    isDraft: false,
    currentStep: 5,
    completedSteps: [1, 2, 3, 4],
    submittedAt: '2026-11-02T05:00:00Z',
    createdAt: '2026-11-01T05:00:00Z',
    applicant: {
      name: 'Revathi Selvam',
      mobile: '9876512345',
      dob: '1985-04-02',
      gender: 'Female',
      aadhaarLast4: '4821',
      preferredLocale: 'ta',
      address: {
        line1: '12 Market Road',
        line2: null,
        text: null,
        village: 'Ketti',
        taluk: 'Coonoor',
        district: 'Nilgiris',
        pincode: '643215',
      },
    },
    farming: {
      farmName: 'Selvam Farm',
      typeOfFarming: 'Natural',
      experienceYears: 6,
      statedAreaAcres: 3.5,
      statedNumberOfFarms: 1,
      waterSource: 'Well',
      primaryCrops: ['Beans', 'Potato'],
    },
    locations: [
      {
        id: 'loc-1',
        label: 'North field',
        areaAcres: 3.5,
        calculatedAreaAcres: null,
        village: 'Ketti',
        taluk: 'Coonoor',
        district: 'Nilgiris',
        hasBoundary: true,
        gps: null,
      },
    ],
    documents: [{ docType: 'ID_PROOF', docSubType: 'Aadhaar', fileName: 'aadhaar-revathi.jpg', fileUrl: 'https://files.example/a.jpg' }],
    tohfaFarmerId: null,
    decidedAt: null,
    rejectionReason: null,
    infoRequest: null,
    zoneId: null,
    applicationCode: null,
    reviewHistory: null,
    documentVerification: null,
    declaration: null,
    ...over,
  };
}

interface LiveState {
  application: ApplicationDetailView | undefined;
  isLoading: boolean;
  error: unknown;
}

interface DecisionState {
  run: ReturnType<typeof vi.fn>;
  finish: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
  isPending: boolean;
  error: unknown;
}

let live: LiveState;
let approve: DecisionState;
let reject: DecisionState;

function decision(): DecisionState {
  return { run: vi.fn(), finish: vi.fn(), reset: vi.fn(), isPending: false, error: null };
}

function problem(code: string, status: number, meta?: Record<string, unknown>): ApiError {
  return new ApiError({ type: 'about:blank', title: 'x', status, code, ...(meta ? { meta } : {}) } as Problem);
}

beforeEach(() => {
  vi.clearAllMocks();
  live = { application: detail(), isLoading: false, error: null };
  approve = decision();
  reject = decision();
  hooks.useApplication.mockImplementation(() => ({ ...live, refresh: vi.fn(), isRefreshing: false }));
  hooks.useApproveApplication.mockImplementation(() => approve);
  hooks.useRejectApplication.mockImplementation(() => reject);
});

function texts(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(texts);
  const own = typeof node.props['placeholder'] === 'string' ? [node.props['placeholder'] as string] : [];
  return [...own, ...(node.children ?? []).flatMap(texts)];
}

function allText(tree: renderer.ReactTestRenderer): string {
  return texts(tree.toJSON()).join('\n');
}

function byTestId(tree: renderer.ReactTestRenderer, id: string): ReactTestInstance[] {
  return tree.root.findAll((n) => typeof n.type === 'string' && n.props['testID'] === id);
}

function mount(props: Partial<React.ComponentProps<typeof AdminApplicationDetailScreen>> = {}): renderer.ReactTestRenderer {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <AdminApplicationDetailScreen applicationId={APP_ID} can={allow(ALL_CODES)} onBack={vi.fn()} {...props} />,
    );
  });
  return tree;
}

/** The buttons of the n-th Alert.alert call (the confirmation pop-ups). */
function alertButtons(n = 0): { text: string; style?: string; onPress?: () => void }[] {
  return vi.mocked(Alert.alert).mock.calls[n]![2] as { text: string; style?: string; onPress?: () => void }[];
}

/** Press Approve in the action bar, then the confirmation's Approve button. */
function pressApproveAndConfirm(tree: renderer.ReactTestRenderer) {
  act(() => {
    (byTestId(tree, 'farmerApps.approve')[0]!.props['onPress'] as () => void)();
  });
  const confirm = alertButtons().find((b) => b.text === t('farmerApps.approveConfirm.confirm'))!;
  act(() => confirm.onPress?.());
}

function rerender(tree: renderer.ReactTestRenderer, props: Partial<React.ComponentProps<typeof AdminApplicationDetailScreen>> = {}) {
  act(() => {
    tree.update(<AdminApplicationDetailScreen applicationId={APP_ID} can={allow(ALL_CODES)} onBack={vi.fn()} {...props} />);
  });
}

describe('AdminApplicationDetailScreen: data comes from the API', () => {
  it('renders the hook data and never the design fixture text', () => {
    const tree = mount();
    const text = allText(tree);
    expect(text).toContain('Revathi Selvam');
    expect(text).toContain('9876512345');
    expect(text).toContain('Natural');
    expect(text).toContain('Beans, Potato');
    expect(text).toContain(t('farmerApps.doc.type.ID_PROOF'));
    for (const fixture of DESIGN_FIXTURE_TEXT) expect(text, `rendered fixture "${fixture}"`).not.toContain(fixture);
  });

  it('fetches by the id of the item the host passes (the legacy `application` prop), not its display fields', () => {
    const tree = mount({
      applicationId: undefined,
      application: { id: APP_ID, name: 'Muthukumar S.', initials: 'MS', location: 'Kotagiri', appliedTime: 'x', badgeLabel: 'Docs OK', badgeType: 'green' },
    });
    expect(hooks.useApplication).toHaveBeenCalledWith(undefined, APP_ID);
    expect(allText(tree)).not.toContain('Muthukumar');
    expect(allText(tree)).not.toContain('Kotagiri');
  });

  it('BR-33b: shows the Aadhaar as its last 4 digits only', () => {
    const text = allText(mount());
    expect(text).toContain('XXXX XXXX 4821');
    expect(text).not.toMatch(/\d{12}/);
  });

  it('fields the API cannot supply render as "not available", not as demo values', () => {
    live.application = detail({ status: 'APPROVED', isDecided: true });
    const tree = mount();
    const dash = t('farmerApps.notAvailable');
    // Zone, Application ID, Approved date, Declaration and the requirement statuses.
    expect(texts(tree.toJSON()).filter((s) => s === dash).length).toBeGreaterThanOrEqual(5);
    expect(allText(tree)).toContain(t('farmerApps.decision.noHistory'));
  });

  it('shows loading, then the mapped error with Retry, then not-found for a 404', () => {
    live = { application: undefined, isLoading: true, error: null };
    const tree = mount();
    expect(allText(tree)).toContain(t('async.loading'));

    live = { application: undefined, isLoading: false, error: problem('FORBIDDEN', 403) };
    rerender(tree);
    expect(allText(tree)).toContain(t('async.error.title'));
    expect(allText(tree)).toContain(t('admin.error.FORBIDDEN'));
    expect(allText(tree)).toContain(t('async.retry'));

    live = { application: undefined, isLoading: false, error: problem('NOT_FOUND', 404) };
    rerender(tree);
    expect(allText(tree)).toContain(t('farmerApps.detail.notFound'));
  });

  it('never renders the M3-S03b spec caption, in either state', () => {
    expect(allText(mount())).not.toContain('M3-S03b');
    live.application = detail({ status: 'APPROVED', isDecided: true });
    expect(allText(mount())).not.toContain('M3-S03b');
  });

  it('does not port the cosmetic "approval blocked" banner (BR-69 is enforced by the server)', () => {
    live.application = detail({ locations: [], documents: [] });
    const text = allText(mount());
    expect(text).not.toContain('blocked');
    expect(byTestId(mount(), 'farmerApps.approve')).toHaveLength(1);
  });
});

describe('AdminApplicationDetailScreen: access (fail closed)', () => {
  it('without `can` it denies and makes no API call', () => {
    const tree = mount({ can: undefined });
    expect(allText(tree)).toContain(t('farmerApps.detail.denied'));
    expect(hooks.useApplication).toHaveBeenCalledWith(undefined, undefined);
    expect(byTestId(tree, 'farmerApps.approve')).toHaveLength(0);
  });

  it('without farmer.application.view it denies and makes no API call', () => {
    const tree = mount({ can: allow(['farmer.application.approve', 'farmer.application.reject']) });
    expect(allText(tree)).toContain(t('farmerApps.detail.denied'));
    expect(hooks.useApplication).toHaveBeenCalledWith(undefined, undefined);
  });

  it('a Farmer-Admin-like `can` (approve at view level, no reject) sees neither Approve nor Reject', () => {
    const tree = mount({ can: allow(['farmer.application.list_pending', 'farmer.application.view', 'farmer.application.approve']) });
    expect(byTestId(tree, 'farmerApps.approve')).toHaveLength(0);
    expect(byTestId(tree, 'farmerApps.reject')).toHaveLength(0);
    expect(allText(tree)).toContain(t('farmerApps.action.readOnly'));
    expect(allText(tree)).toContain('Revathi Selvam');
  });

  it('reject without approve shows neither button either', () => {
    const tree = mount({ can: allow(['farmer.application.view', 'farmer.application.reject']) });
    expect(byTestId(tree, 'farmerApps.approve')).toHaveLength(0);
    expect(byTestId(tree, 'farmerApps.reject')).toHaveLength(0);
  });

  it('holding both decision codes shows Approve and Reject', () => {
    const tree = mount();
    expect(byTestId(tree, 'farmerApps.approve')).toHaveLength(1);
    expect(byTestId(tree, 'farmerApps.reject')).toHaveLength(1);
  });
});

describe('AdminApplicationDetailScreen: Request More Info is dropped', () => {
  it('renders no Request More Info entry and never calls onRequestMoreInfo', () => {
    const onRequestMoreInfo = vi.fn();
    const tree = mount({ onRequestMoreInfo });
    expect(allText(tree)).not.toMatch(/request (more )?info/i);
    expect(tree.root.findAll((n) => typeof n.props['testID'] === 'string' && /request/i.test(n.props['testID'] as string))).toHaveLength(0);
    expect(onRequestMoreInfo).not.toHaveBeenCalled();
  });
});

describe('AdminApplicationDetailScreen: Approve (in-place Approved state)', () => {
  it('Approve calls the hook once, shows Approved only after success, and releases the idempotency key', () => {
    const onApproved = vi.fn();
    const tree = mount({ onApproved });
    expect(allText(tree)).not.toContain(t('farmerApps.status.APPROVED'));

    // Approve now goes through the confirmation pop-up (owner request): press its confirm.
    pressApproveAndConfirm(tree);
    expect(approve.run).toHaveBeenCalledTimes(1);
    expect(approve.run.mock.calls[0]![0]).toEqual({});
    // Not approved yet: the server has not answered.
    expect(allText(tree)).not.toContain(t('farmerApps.status.APPROVED'));
    expect(approve.finish).not.toHaveBeenCalled();

    const onDone = approve.run.mock.calls[0]![1] as (dto: unknown) => void;
    act(() => onDone({ id: APP_ID, status: 'APPROVED' }));

    expect(allText(tree)).toContain(t('farmerApps.status.APPROVED'));
    expect(byTestId(tree, 'farmerApps.approve')).toHaveLength(0);
    expect(byTestId(tree, 'farmerApps.reject')).toHaveLength(0);
    expect(approve.finish).toHaveBeenCalledTimes(1);
    expect(onApproved).toHaveBeenCalledTimes(1);
  });

  it('BR-69: an approval refused for zero farm locations shows the mapped message and no Approved state', () => {
    const tree = mount();
    pressApproveAndConfirm(tree);
    expect(approve.run).toHaveBeenCalledTimes(1);
    approve.error = problem('VALIDATION_FAILED', 422, { missingSteps: [3] });
    rerender(tree);
    const text = allText(tree);
    expect(text).toContain(t('farmerApps.error.noLocations'));
    expect(text).not.toContain(t('farmerApps.status.APPROVED'));
    // The key is kept so a retry replays the same decision.
    expect(approve.finish).not.toHaveBeenCalled();
    expect(byTestId(tree, 'farmerApps.approve')).toHaveLength(1);
  });

  it('Approve asks for confirmation first: no approval call until the confirm button is pressed', () => {
    const onApproved = vi.fn();
    const tree = mount({ onApproved });
    act(() => {
      (byTestId(tree, 'farmerApps.approve')[0]!.props['onPress'] as () => void)();
    });
    expect(Alert.alert).toHaveBeenCalledTimes(1);
    const [title, message] = vi.mocked(Alert.alert).mock.calls[0]!;
    expect(title).toBe(t('farmerApps.approveConfirm.title'));
    expect(message).toBe(t('farmerApps.approveConfirm.message', { name: 'Revathi Selvam' }));
    expect(approve.run).not.toHaveBeenCalled();
    expect(onApproved).not.toHaveBeenCalled();
    expect(allText(tree)).not.toContain(t('farmerApps.status.APPROVED'));

    const confirm = alertButtons().find((b) => b.text === t('farmerApps.approveConfirm.confirm'))!;
    expect(confirm.style).not.toBe('cancel');
    act(() => confirm.onPress?.());
    expect(approve.run).toHaveBeenCalledTimes(1);
    // Still only after the server answers.
    expect(onApproved).not.toHaveBeenCalled();
  });

  it('Cancel on the approve confirmation does nothing', () => {
    const onApproved = vi.fn();
    const tree = mount({ onApproved });
    act(() => {
      (byTestId(tree, 'farmerApps.approve')[0]!.props['onPress'] as () => void)();
    });
    const cancel = alertButtons().find((b) => b.text === t('farmerApps.approveConfirm.cancel'))!;
    expect(cancel.style).toBe('cancel');
    act(() => cancel.onPress?.());
    expect(approve.run).not.toHaveBeenCalled();
    expect(approve.finish).not.toHaveBeenCalled();
    expect(onApproved).not.toHaveBeenCalled();
    expect(byTestId(tree, 'farmerApps.approve')).toHaveLength(1);
  });

  it('a failed approval never reports success to the host (no onApproved, so no toast)', () => {
    const onApproved = vi.fn();
    const tree = mount({ onApproved });
    pressApproveAndConfirm(tree);
    approve.error = problem('CONFLICT', 409);
    rerender(tree, { onApproved });
    expect(onApproved).not.toHaveBeenCalled();
    expect(approve.finish).not.toHaveBeenCalled();
    expect(allText(tree)).not.toContain(t('farmerApps.status.APPROVED'));
  });

  it('a 403 from the server is shown through the admin error mapping', () => {
    approve.error = problem('FORBIDDEN', 403);
    expect(allText(mount())).toContain(t('admin.error.FORBIDDEN'));
  });

  it('while the approval is in flight the button cannot be pressed again', () => {
    approve.isPending = true;
    const tree = mount();
    const button = byTestId(tree, 'farmerApps.approve')[0]!;
    expect(button.props['disabled']).toBe(true);
    expect(allText(tree)).toContain(t('farmerApps.action.approving'));
  });

  it('an application the server already shows as APPROVED renders the Approved state with no action bar', () => {
    live.application = detail({ status: 'APPROVED', isDecided: true });
    const tree = mount();
    expect(allText(tree)).toContain(t('farmerApps.status.APPROVED'));
    expect(byTestId(tree, 'farmerApps.approve')).toHaveLength(0);
  });
});

describe('AdminApplicationDetailScreen: Reject', () => {
  it('Reject asks for confirmation, then hands over to the reject screen without claiming a rejection', () => {
    const onReject = vi.fn();
    const tree = mount({ onReject });
    act(() => {
      (byTestId(tree, 'farmerApps.reject')[0]!.props['onPress'] as () => void)();
    });
    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(onReject).not.toHaveBeenCalled();
    const buttons = vi.mocked(Alert.alert).mock.calls[0]![2] as { text: string; onPress?: () => void }[];
    const confirm = buttons.find((b) => b.text === t('farmerApps.rejectConfirm.confirm'))!;
    act(() => confirm.onPress?.());
    expect(onReject).toHaveBeenCalledTimes(1);
    // Only one alert: no "Application Rejected" before any reason is entered.
    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(allText(tree)).not.toContain(t('farmerApps.status.REJECTED'));
    expect(reject.run).not.toHaveBeenCalled();
  });

  it('a REJECTED application from the server shows the rejected state', () => {
    live.application = detail({ status: 'REJECTED', isDecided: true });
    const tree = mount();
    expect(allText(tree)).toContain(t('farmerApps.decision.rejectedTitle'));
    expect(byTestId(tree, 'farmerApps.reject')).toHaveLength(0);
  });
});

describe('AdminApplicationDetailScreen: DESIGN-ONLY controls are visibly unavailable', () => {
  it('Mark verified and Save Progress are disabled and do nothing', () => {
    const tree = mount();
    const controls = [...byTestId(tree, 'farmerApps.markVerified'), ...byTestId(tree, 'farmerApps.saveProgress')];
    expect(controls.length).toBeGreaterThanOrEqual(2);
    for (const c of controls) {
      expect(c.props['disabled']).toBe(true);
      expect(c.props['onPress']).toBeUndefined();
    }
    expect(allText(tree)).toContain(t('farmerApps.doc.verifyUnavailable'));
    expect(allText(tree)).toContain(t('farmerApps.decision.reviewNotesUnavailable'));
  });
});
