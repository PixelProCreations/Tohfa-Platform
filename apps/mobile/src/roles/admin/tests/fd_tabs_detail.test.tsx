/**
 * Farmer Detail: the design's "Farmer Records" and "Payout" tabs
 * (origin/Superadmin-main AdminFarmerDetailScreen tabs 10 and 11), restored
 * on live data. Hooks are mocked; react-test-renderer in plain Node.
 *
 * The two sections render for real (their own reads and gates are under
 * test here, through the detail screen); the payout detail and bank details
 * screens are stubbed so the props the detail hands them can be read.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance } from 'react-test-renderer';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: vi.fn() },
  BackHandler: { addEventListener: () => ({ remove: () => undefined }) },
  Linking: { openURL: vi.fn() },
  Modal: 'Modal',
  Platform: { OS: 'ios', select: (o: Record<string, unknown>) => o['ios'] ?? o['default'] },
  Pressable: 'Pressable',
  RefreshControl: 'RefreshControl',
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, absoluteFill: {}, hairlineWidth: 1 },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({
  default: 'Svg', Circle: 'Circle', Ellipse: 'Ellipse', G: 'G', Line: 'Line', Path: 'Path', Rect: 'Rect', Polyline: 'Polyline', Polygon: 'Polygon',
}));
vi.mock('@tohfa/mobile-ui', () => ({ ScreenStatusBar: 'ScreenStatusBar', SafeAreaView: 'SafeAreaView', Icon: 'Icon' }));

const hooks = vi.hoisted(() => ({
  useFarmer: vi.fn(),
  useFarmerBankAccounts: vi.fn(),
  useFarmerDocuments: vi.fn(),
  useFarmerRating: vi.fn(),
  useFarmerSubscription: vi.fn(),
  useVerifyFarmerDocument: vi.fn(),
  useFarmerPayoutList: vi.fn(),
  useProduceRecordList: vi.fn(),
  useProduceFilterOptions: vi.fn(),
  useAdminFarmerAnimals: vi.fn(),
  useAdminFarmerAssets: vi.fn(),
}));
vi.mock('../api/farmerHooks', () => ({
  useFarmer: hooks.useFarmer,
  useFarmerBankAccounts: hooks.useFarmerBankAccounts,
  useFarmerDocuments: hooks.useFarmerDocuments,
  useFarmerRating: hooks.useFarmerRating,
  useFarmerSubscription: hooks.useFarmerSubscription,
  useVerifyFarmerDocument: hooks.useVerifyFarmerDocument,
}));
vi.mock('../api/w5FarmerPayouts', () => ({ useFarmerPayoutList: hooks.useFarmerPayoutList }));
vi.mock('../api/w5FarmRecords', () => ({
  useAdminFarmerAnimals: hooks.useAdminFarmerAnimals,
  useAdminFarmerAssets: hooks.useAdminFarmerAssets,
}));
vi.mock('../api/produceHooks', () => ({
  useProduceRecordList: hooks.useProduceRecordList,
  useProduceFilterOptions: hooks.useProduceFilterOptions,
}));

function stub(name: string) {
  return (props: Record<string, unknown>) => React.createElement(name, props);
}
vi.mock('../screens/farmers/AdminEditFarmerScreen', () => ({ AdminEditFarmerScreen: stub('EditFarmer') }));
vi.mock('../screens/farmers/FarmerPayoutDetailScreen', () => ({ FarmerPayoutDetailScreen: stub('PayoutDetail') }));
vi.mock('../screens/farmers/FarmerBankAccountDetailsScreen', () => ({ FarmerBankAccountDetailsScreen: stub('BankDetails') }));

import { AdminFarmerDetailScreen } from '../screens/farmers/AdminFarmerDetailScreen';
import { FARMER_DETAIL_TABS, detailTabLabel } from '../screens/farmers/detail/model';
import type { FarmerDetailView } from '../api/farmerTypes';
import { makeCan } from '../permissions/can';
import { t } from '../i18n';

const FARMER_UUID = '33333333-3333-4333-8333-333333333333';
const FARMER_CODE = 'TOHFA-F-2026-0042';
const PAYOUT_UUID = '99999999-9999-4999-8999-999999999999';
const IDLE = { isLoading: false, error: null, refresh: vi.fn(), isRefreshing: false };
const LIST_IDLE = { ...IDLE, items: [], firstPage: undefined, loadMore: vi.fn(), hasMore: false };

/** The design's tab bar (Superadmin-main), minus 'Compliance', which this branch dropped before this change. */
const DESIGN_TABS = ['Personal', 'Farm & land', 'Soil', 'Product listing', 'KYC', 'Ratings', 'Subscription', 'Audit', 'Farmer Records', 'Payout', 'History'];

const PAYOUT_ROW = {
  id: PAYOUT_UUID,
  payoutNumber: 'PO-REAL-17',
  farmerId: FARMER_UUID,
  farmerName: 'Lakshmi Devi',
  amount: '10800.00',
  status: 'PENDING_APPROVAL',
  requestedAt: '2026-11-20T04:30:00.000Z',
  requestedBy: 'someone',
};

function farmer(): FarmerDetailView {
  return {
    id: FARMER_UUID,
    farmerCode: FARMER_CODE,
    name: 'Lakshmi Devi',
    initials: 'LD',
    mobile: '+919000000042',
    email: null,
    status: 'active',
    accountStatus: 'ACTIVE',
    applicationStatus: 'APPROVED',
    kycStatus: 'VERIFIED',
    zoneId: 'z-1',
    zoneName: 'Kotagiri',
    aadhaarLast4: '4321',
    dob: null,
    gender: null,
    farmingExperienceYears: null,
    address: { line1: null, line2: null, village: 'Kil Kotagiri', taluk: null, district: 'Nilgiris', pincode: null },
    isMarketBlocked: false,
    marketBlockReason: null,
    landLocations: [],
    certification: { total: 0, verifiedCurrent: 0, verifiedExpired: 0, unverified: 0, rejected: 0, expired: 0, qualifying: 0, nextQualifyingExpiry: null },
    overallRating: null,
    ratingTierCode: null,
    ratingTierLabel: null,
    registeredAt: '2026-01-10T04:30:00Z',
    approvedAt: null,
    farmingType: null,
    farmProfile: null,
    lifecycle: null,
    lastAuditAt: null,
  } as FarmerDetailView;
}

function render(el: React.ReactElement): { root: ReactTestInstance; tree: renderer.ReactTestRenderer } {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(el);
  });
  return { root: tree.root, tree };
}

function flat(children: unknown): string {
  if (children === null || children === undefined || typeof children === 'boolean') return '';
  if (Array.isArray(children)) return children.map(flat).join('');
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  return '';
}

function allText(root: ReactTestInstance): string {
  return root
    .findAll((n) => (n.type as unknown) === 'Text')
    .map((n) => flat(n.props.children))
    .join('\n');
}

function tabs(root: ReactTestInstance): ReactTestInstance[] {
  return root.findAll((n) => (n.type as unknown) === 'TouchableOpacity' && n.props.accessibilityRole === 'tab');
}

function tabLabels(root: ReactTestInstance): string[] {
  return tabs(root).map((n) => flat(n.findByType('Text' as never).props.children));
}

function pressTab(root: ReactTestInstance, label: string): void {
  const tab = tabs(root).find((n) => flat(n.findByType('Text' as never).props.children) === label);
  if (tab === undefined) throw new Error(`no tab "${label}"`);
  act(() => {
    tab.props.onPress();
  });
}

/** The innermost touchable whose subtree has a Text equal to `label`. */
function button(root: ReactTestInstance, label: string): ReactTestInstance {
  const found = root
    .findAll((n) => (n.type as unknown) === 'TouchableOpacity')
    .filter((n) => n.findAll((c) => (c.type as unknown) === 'Text' && flat(c.props.children) === label).length > 0)
    .filter((n) => n.findAll((c) => c !== n && (c.type as unknown) === 'TouchableOpacity').length === 0);
  if (found.length === 0) throw new Error(`no button "${label}"`);
  return found[0]!;
}

/** The touchable around the payout account card (it holds the card title). */
function bankCard(root: ReactTestInstance): ReactTestInstance {
  const title = t('wiringFarmers.payouts.accountTitle');
  const found = root
    .findAll((n) => (n.type as unknown) === 'TouchableOpacity')
    .filter((n) => n.findAll((c) => (c.type as unknown) === 'Text' && flat(c.props.children) === title).length > 0);
  if (found.length === 0) throw new Error('no payout account card');
  return found[found.length - 1]!;
}

const ALL_CODES = [
  'farmer.profile.view_all',
  'payout.view',
  'farmer.bank_account.view',
  'produce.calendar.view_consolidated',
  'admin.livestock.view_all',
  'admin.assets.view_all',
];

beforeEach(() => {
  vi.clearAllMocks();
  hooks.useFarmer.mockReturnValue({ ...IDLE, farmer: farmer(), dto: undefined });
  hooks.useFarmerBankAccounts.mockReturnValue({ ...IDLE, destinations: [] });
  hooks.useFarmerDocuments.mockReturnValue({ ...IDLE, documents: [] });
  hooks.useFarmerRating.mockReturnValue({ ...IDLE, rating: undefined });
  hooks.useFarmerSubscription.mockReturnValue({ ...IDLE, subscription: undefined });
  hooks.useVerifyFarmerDocument.mockReturnValue({ run: vi.fn(), isPending: false, error: null });
  hooks.useFarmerPayoutList.mockReturnValue(LIST_IDLE);
  hooks.useProduceRecordList.mockReturnValue(LIST_IDLE);
  hooks.useProduceFilterOptions.mockReturnValue({ data: undefined, isPending: false, error: null });
  hooks.useAdminFarmerAnimals.mockReturnValue({ animals: undefined, isLoading: false, error: null, refresh: vi.fn() });
  hooks.useAdminFarmerAssets.mockReturnValue(LIST_IDLE);
});

describe('Farmer Detail tab bar matches the design', () => {
  it('the model lists the design tabs in the design order, with the design labels', () => {
    expect([...FARMER_DETAIL_TABS]).toEqual(DESIGN_TABS);
    expect(FARMER_DETAIL_TABS.map(detailTabLabel)).toEqual(DESIGN_TABS);
  });

  it('the screen draws every design tab, "Farmer Records" then "Payout" between Audit and History', () => {
    const { root } = render(<AdminFarmerDetailScreen farmerId={FARMER_UUID} can={makeCan(ALL_CODES)} onBack={vi.fn()} />);
    expect(tabLabels(root)).toEqual(DESIGN_TABS);
  });

  it('a caller asking for "Farmer Records" lands on Farmer Records (no longer redirected to Audit)', () => {
    const { root } = render(<AdminFarmerDetailScreen farmerId={FARMER_UUID} initialTab="Farmer Records" can={makeCan(ALL_CODES)} onBack={vi.fn()} />);
    const active = tabs(root).filter((n) => n.props.accessibilityState?.selected === true);
    expect(active.map((n) => flat(n.findByType('Text' as never).props.children))).toEqual(['Farmer Records']);
  });
});

describe('Farmer Records tab', () => {
  it('reads this farmer by uuid behind each record code', () => {
    const { root } = render(<AdminFarmerDetailScreen farmerId={FARMER_UUID} can={makeCan(ALL_CODES)} onBack={vi.fn()} />);
    pressTab(root, 'Farmer Records');
    expect(hooks.useProduceRecordList).toHaveBeenCalledWith({ farmerId: FARMER_UUID }, { enabled: true });
    expect(hooks.useAdminFarmerAnimals).toHaveBeenCalledWith(FARMER_UUID, { enabled: true });
    expect(hooks.useAdminFarmerAssets).toHaveBeenCalledWith(FARMER_UUID, { enabled: true });
  });

  it('without the record codes nothing is fetched and the tab says "not loaded", never empty', () => {
    const { root } = render(<AdminFarmerDetailScreen farmerId={FARMER_UUID} can={makeCan(['farmer.profile.view_all'])} onBack={vi.fn()} />);
    pressTab(root, 'Farmer Records');
    for (const call of hooks.useProduceRecordList.mock.calls) expect(call[1]).toEqual({ enabled: false });
    for (const call of hooks.useAdminFarmerAnimals.mock.calls) expect(call[1]).toEqual({ enabled: false });
    for (const call of hooks.useAdminFarmerAssets.mock.calls) expect(call[1]).toEqual({ enabled: false });
    // The section opens on Diary (no admin endpoint); the crop sub-tab is the one a missing code empties.
    expect(allText(root)).toContain(t('wiringFarmers.records.diaryUnavailable'));
    act(() => {
      button(root, 'Plant & Crops').props.onPress();
    });
    expect(allText(root)).toContain(t('wiringFarmers.records.notLoaded'));
  });
});

describe('Payout tab', () => {
  it("reads this farmer's payouts by uuid behind payout.view; a row tap hands the flow the real payout", () => {
    hooks.useFarmerPayoutList.mockReturnValue({ ...LIST_IDLE, items: [PAYOUT_ROW] });
    const onOpenPayoutDetail = vi.fn();
    const { root } = render(
      <AdminFarmerDetailScreen farmerId={FARMER_UUID} can={makeCan(ALL_CODES)} onBack={vi.fn()} onOpenPayoutDetail={onOpenPayoutDetail} />,
    );
    pressTab(root, 'Payout');
    expect(hooks.useFarmerPayoutList).toHaveBeenCalledWith(FARMER_UUID, { enabled: true });
    act(() => {
      button(root, 'PO-REAL-17').props.onPress();
    });
    expect(onOpenPayoutDetail).toHaveBeenCalledWith(
      expect.objectContaining({ id: PAYOUT_UUID, code: 'PO-REAL-17', amount: '10800.00', status: 'PENDING_APPROVAL' }),
    );
  });

  it('with no flow handler the row opens the payout detail inline (as the design does), with the code not the uuid, and Back returns to Payout', () => {
    hooks.useFarmerPayoutList.mockReturnValue({ ...LIST_IDLE, items: [PAYOUT_ROW] });
    const can = makeCan(ALL_CODES);
    const { root } = render(<AdminFarmerDetailScreen farmerId={FARMER_UUID} can={can} onBack={vi.fn()} />);
    pressTab(root, 'Payout');
    act(() => {
      button(root, 'PO-REAL-17').props.onPress();
    });
    const detail = root.findByType('PayoutDetail' as never);
    expect(detail.props.payout).toEqual(expect.objectContaining({ id: PAYOUT_UUID, code: 'PO-REAL-17' }));
    expect(detail.props.farmerId).toBe(FARMER_UUID);
    expect(detail.props.farmerCode).toBe(FARMER_CODE);
    expect(detail.props.can).toBe(can);
    act(() => {
      (detail.props.onBack as () => void)();
    });
    expect(root.findAllByType('PayoutDetail' as never)).toHaveLength(0);
    const active = tabs(root).filter((n) => n.props.accessibilityState?.selected === true);
    expect(active.map((n) => flat(n.findByType('Text' as never).props.children))).toEqual(['Payout']);
  });

  it('the payout account card opens bank details: through the flow when it handles it, inline with the uuid otherwise', () => {
    const onOpenBankDetails = vi.fn();
    const viaFlow = render(
      <AdminFarmerDetailScreen farmerId={FARMER_UUID} can={makeCan(ALL_CODES)} onBack={vi.fn()} onOpenBankDetails={onOpenBankDetails} />,
    ).root;
    pressTab(viaFlow, 'Payout');
    act(() => {
      bankCard(viaFlow).props.onPress();
    });
    expect(onOpenBankDetails).toHaveBeenCalledTimes(1);

    const can = makeCan(ALL_CODES);
    const inline = render(<AdminFarmerDetailScreen farmerId={FARMER_UUID} can={can} onBack={vi.fn()} />).root;
    pressTab(inline, 'Payout');
    act(() => {
      bankCard(inline).props.onPress();
    });
    const bank = inline.findByType('BankDetails' as never);
    expect(bank.props.farmerId).toBe(FARMER_UUID);
    expect(bank.props.farmerCode).toBe(FARMER_CODE);
    expect(bank.props.can).toBe(can);
  });

  it('without payout.view / farmer.bank_account.view nothing is fetched and the list says "not loaded"', () => {
    const { root } = render(<AdminFarmerDetailScreen farmerId={FARMER_UUID} can={makeCan(['farmer.profile.view_all'])} onBack={vi.fn()} />);
    pressTab(root, 'Payout');
    for (const call of hooks.useFarmerPayoutList.mock.calls) expect(call[1]).toEqual({ enabled: false });
    for (const call of hooks.useFarmerBankAccounts.mock.calls) {
      // The detail shell's own bank read gets no id; the section's read is disabled.
      if (call.length > 2) expect(call[2]).toEqual({ enabled: false });
      else expect(call[1]).toBeUndefined();
    }
    const text = allText(root);
    expect(text).toContain(t('wiringFarmers.payouts.notLoaded'));
    expect(text).not.toContain(t('wiringFarmers.payouts.empty'));
  });

  it('without farmer.profile.view_all no tab renders and no payout or record read is mounted', () => {
    const { root } = render(<AdminFarmerDetailScreen farmerId={FARMER_UUID} can={makeCan(['payout.view'])} onBack={vi.fn()} />);
    expect(tabs(root)).toHaveLength(0);
    expect(hooks.useFarmerPayoutList).not.toHaveBeenCalled();
    expect(hooks.useProduceRecordList).not.toHaveBeenCalled();
  });
});
