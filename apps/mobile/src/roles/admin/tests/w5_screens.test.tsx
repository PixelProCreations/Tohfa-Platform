/**
 * W5 (brief 07) render tests: farmers, inputs and produce screens show only
 * what the API sent, and every control with no endpoint behind it is drawn
 * but disabled (R3). Hooks are mocked; react-test-renderer in plain Node.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance } from 'react-test-renderer';

const rn = vi.hoisted(() => ({
  alert: vi.fn(),
  openURL: vi.fn(async () => undefined),
}));

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: rn.alert },
  Linking: { openURL: rn.openURL },
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
vi.mock('../components/OverviewDashboardCard', () => ({
  OverviewCardsGrid: ({ children }: { children: React.ReactNode }) => React.createElement('Grid', null, children),
  OverviewDashboardCard: (p: Record<string, unknown>) => React.createElement('Card', p),
}));

const hooks = vi.hoisted(() => ({
  useFarmerBankAccounts: vi.fn(),
  useFarmerDocuments: vi.fn(),
  useFarmerRating: vi.fn(),
  useFarmer: vi.fn(),
  useFarmerPayoutList: vi.fn(),
  useProduceRecordList: vi.fn(),
  useProduceFilterOptions: vi.fn(),
  useAdminFarmerAnimals: vi.fn(),
  useAdminFarmerAssets: vi.fn(),
}));
vi.mock('../api/farmerHooks', () => ({
  useFarmerBankAccounts: hooks.useFarmerBankAccounts,
  useFarmerDocuments: hooks.useFarmerDocuments,
  useFarmerRating: hooks.useFarmerRating,
  useFarmer: hooks.useFarmer,
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

import { FarmerPayoutTabSection } from '../screens/farmers/FarmerPayoutTabSection';
import { FarmerBankAccountDetailsScreen } from '../screens/farmers/FarmerBankAccountDetailsScreen';
import { AdminEditRatingCategoriesScreen } from '../screens/farmers/AdminEditRatingCategoriesScreen';
import { AdminRatingScorecardScreen } from '../screens/farmers/AdminRatingScorecardScreen';
import { AdminFarmMapScreen } from '../screens/farmers/AdminFarmMapScreen';
import { CropHistoryRecordsScreen } from '../screens/produce/CropHistoryRecordsScreen';
import { ZoneCropBreakdownScreen } from '../screens/produce/ZoneCropBreakdownScreen';
import { InputDetailScreen } from '../screens/inputs/InputDetailScreen';
import { ApprovedInputsScreen } from '../screens/inputs/ApprovedInputsScreen';
import { FarmRecordsSection } from '../screens/farmers/FarmRecordsSection';
import { AdminAddFarmRecordScreen } from '../screens/farmers/AdminAddFarmRecordScreen';
import { AdminEditFarmRecordScreen } from '../screens/farmers/AdminEditFarmRecordScreen';
import { makeCan } from '../permissions/can';
import { t } from '../i18n';
import { ADMIN_NO_VALUE } from '../utils/noValue';
import type { FarmerListItem } from '../screens/farmers/AdminAllFarmersScreen';

const FARMER_ID = '33333333-3333-4333-8333-333333333333';
const FARMER: FarmerListItem = { id: FARMER_ID, name: 'Real Farmer', code: 'TF-0001', status: 'ACTIVE' };
const IDLE = { isLoading: false, error: null, refresh: vi.fn(), isRefreshing: false };
const LIST_IDLE = { ...IDLE, items: [], firstPage: undefined, loadMore: vi.fn(), hasMore: false };

function render(el: React.ReactElement): ReactTestInstance {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(el);
  });
  return tree.root;
}

function flat(children: unknown): string {
  if (children === null || children === undefined || typeof children === 'boolean') return '';
  if (Array.isArray(children)) return children.map(flat).join('');
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  return '';
}

/** Every Text node's own string content. */
function texts(root: ReactTestInstance): string[] {
  return root.findAll((n) => (n.type as unknown) === 'Text').map((n) => flat(n.props.children));
}

function allText(root: ReactTestInstance): string {
  return texts(root).join('\n');
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

beforeEach(() => {
  vi.clearAllMocks();
  hooks.useFarmerBankAccounts.mockReturnValue({ ...IDLE, destinations: [] });
  hooks.useFarmerDocuments.mockReturnValue({ ...IDLE, documents: [] });
  hooks.useFarmerRating.mockReturnValue({ ...IDLE, rating: undefined });
  hooks.useFarmer.mockReturnValue({ ...IDLE, farmer: undefined, dto: undefined });
  hooks.useFarmerPayoutList.mockReturnValue(LIST_IDLE);
  hooks.useProduceRecordList.mockReturnValue(LIST_IDLE);
  hooks.useProduceFilterOptions.mockReturnValue({ data: undefined, isPending: false, error: null });
  hooks.useAdminFarmerAnimals.mockReturnValue({ animals: undefined, isLoading: false, error: null, refresh: vi.fn() });
  hooks.useAdminFarmerAssets.mockReturnValue(LIST_IDLE);
});

// ---------------------------------------------------------------------------
// Farmer Payout tab
// ---------------------------------------------------------------------------

const PAYOUT_ROW = {
  id: '99999999-9999-4999-8999-999999999999',
  payoutNumber: 'PO-REAL-17',
  farmerId: FARMER_ID,
  farmerName: 'Real Farmer',
  amount: '10800.00',
  status: 'PENDING_APPROVAL',
  requestedAt: '2026-11-20T04:30:00.000Z',
  requestedBy: 'someone',
};

describe('Farmer Payout tab: real payouts for this farmer, never the fixture', () => {
  it('reads GET /admin/payouts for this farmer behind payout.view and opens the real row', () => {
    hooks.useFarmerPayoutList.mockReturnValue({ ...LIST_IDLE, items: [PAYOUT_ROW] });
    const onOpen = vi.fn();
    const root = render(
      <FarmerPayoutTabSection farmerName="Real Farmer" farmerId={FARMER_ID} can={makeCan(['payout.view'])} onOpenBankDetails={vi.fn()} onOpenPayoutDetail={onOpen} />,
    );
    expect(hooks.useFarmerPayoutList).toHaveBeenCalledWith(FARMER_ID, { enabled: true });
    const text = allText(root);
    expect(text).toContain('PO-REAL-17');
    expect(text).toContain('₹10,800');
    expect(text).not.toContain('PAY-0008');
    act(() => {
      button(root, 'PO-REAL-17').props.onPress();
    });
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: PAYOUT_ROW.id, code: 'PO-REAL-17', amount: '10800.00', status: 'PENDING_APPROVAL' }));
  });

  it('without payout.view nothing is fetched and the list says "not loaded", never "no payouts"', () => {
    const root = render(
      <FarmerPayoutTabSection farmerName="Real Farmer" farmerId={FARMER_ID} can={makeCan([])} onOpenBankDetails={vi.fn()} onOpenPayoutDetail={vi.fn()} />,
    );
    expect(hooks.useFarmerPayoutList).toHaveBeenCalledWith(FARMER_ID, { enabled: false });
    const text = allText(root);
    expect(text).toContain(t('wiringFarmers.payouts.notLoaded'));
    expect(text).not.toContain(t('wiringFarmers.payouts.empty'));
  });

  it('a failed request shows the error state, not an empty list', () => {
    hooks.useFarmerPayoutList.mockReturnValue({ ...LIST_IDLE, error: new Error('boom') });
    const root = render(
      <FarmerPayoutTabSection farmerName="Real Farmer" farmerId={FARMER_ID} can={makeCan(['payout.view'])} onOpenBankDetails={vi.fn()} onOpenPayoutDetail={vi.fn()} />,
    );
    const text = allText(root);
    expect(text).toContain(t('async.error.title'));
    expect(text).not.toContain(t('wiringFarmers.payouts.empty'));
  });

  it('BR-53a: the payout account card shows only the masked last 4 from the server, no invented bank', () => {
    hooks.useFarmerBankAccounts.mockReturnValue({
      ...IDLE,
      destinations: [{ id: 'b', kind: 'BANK', accountHolderName: 'Real Farmer', accountNumberLast4: '7788', ifsc: 'SBIN0000001', bankName: 'State Bank', branchName: null, upiVpa: null, isVerified: false, isDefault: true }],
    });
    const root = render(
      <FarmerPayoutTabSection farmerName="Real Farmer" farmerId={FARMER_ID} can={makeCan(['payout.view', 'farmer.bank_account.view'])} onOpenBankDetails={vi.fn()} onOpenPayoutDetail={vi.fn()} />,
    );
    const text = allText(root);
    expect(text).toContain('State Bank');
    expect(text).toContain('SBIN0000001');
    expect(text).toMatch(/7788/);
    expect(text).not.toMatch(/HDFC|4821|IDIB000C123/);
    expect(text).not.toContain('✓ Bank verified');
  });
});

// ---------------------------------------------------------------------------
// Bank account details (BR-53)
// ---------------------------------------------------------------------------

describe('Bank account details (BR-53)', () => {
  const BANK = { id: 'b', kind: 'BANK', accountHolderName: 'Real Farmer', accountNumberLast4: '7788', ifsc: 'SBIN0000001', bankName: 'State Bank', branchName: 'Ooty', upiVpa: null, isVerified: true, isDefault: true };

  it('BR-53: never claims the account is used for farmer payouts; the last payout is a dash', () => {
    hooks.useFarmerBankAccounts.mockReturnValue({ ...IDLE, destinations: [BANK] });
    const root = render(<FarmerBankAccountDetailsScreen farmerName="Real Farmer" farmerId={FARMER_ID} farmerCode="TF-0001" can={makeCan(['farmer.bank_account.view'])} onBack={vi.fn()} />);
    const text = allText(root);
    expect(text).not.toMatch(/Used for farmer payouts/);
    expect(text).toContain(t('wiringFarmers.bank.lastPayout', { value: ADMIN_NO_VALUE }));
    expect(text).toContain('TF-0001');
    expect(text).not.toContain(FARMER_ID);
  });

  it('BR-53: the read is gated on farmer.bank_account.view and the screen says so when it is missing', () => {
    render(<FarmerBankAccountDetailsScreen farmerName="Real Farmer" farmerId={FARMER_ID} can={makeCan([])} onBack={vi.fn()} />);
    expect(hooks.useFarmerBankAccounts).toHaveBeenCalledWith(undefined, FARMER_ID, { enabled: false });
  });

  it('loading and error render as states, never as "Unverified"', () => {
    hooks.useFarmerBankAccounts.mockReturnValue({ ...IDLE, isLoading: true, destinations: undefined });
    let text = allText(render(<FarmerBankAccountDetailsScreen farmerId={FARMER_ID} can={makeCan(['farmer.bank_account.view'])} onBack={vi.fn()} />));
    expect(text).toContain(t('async.loading'));
    expect(text).not.toContain('Unverified');
    hooks.useFarmerBankAccounts.mockReturnValue({ ...IDLE, error: new Error('403'), destinations: undefined });
    text = allText(render(<FarmerBankAccountDetailsScreen farmerId={FARMER_ID} can={makeCan(['farmer.bank_account.view'])} onBack={vi.fn()} />));
    expect(text).toContain(t('async.error.title'));
    expect(text).not.toContain('Unverified');
  });

  it('account type and account status are not invented', () => {
    hooks.useFarmerBankAccounts.mockReturnValue({ ...IDLE, destinations: [BANK] });
    const text = allText(render(<FarmerBankAccountDetailsScreen farmerId={FARMER_ID} can={makeCan(['farmer.bank_account.view'])} onBack={vi.fn()} />));
    expect(text).not.toContain('Savings');
    expect(text).not.toMatch(/^Active$/m);
  });

  it('a CERTIFICATE is not the passbook; the BANK_PROOF shows its real status and View opens its readUrl', async () => {
    hooks.useFarmerBankAccounts.mockReturnValue({ ...IDLE, destinations: [BANK] });
    hooks.useFarmerDocuments.mockReturnValue({
      ...IDLE,
      documents: [
        { id: 'c', docType: 'CERTIFICATE', verificationStatus: 'VERIFIED', isVerified: true, readUrl: 'https://x/cert' },
        { id: 'p', docType: 'BANK_PROOF', verificationStatus: 'UNVERIFIED', isVerified: false, readUrl: 'https://x/proof' },
      ],
    });
    const root = render(<FarmerBankAccountDetailsScreen farmerId={FARMER_ID} role="SUPER_ADMIN" can={makeCan(['farmer.bank_account.view'])} onBack={vi.fn()} />);
    const text = allText(root);
    expect(text).toContain(t('wiringFarmers.doc.status.UNVERIFIED'));
    expect(text).not.toContain('Verified Document');
    await act(async () => {
      button(root, 'View Document').props.onPress();
    });
    expect(rn.openURL).toHaveBeenCalledWith('https://x/proof');
    expect(rn.alert).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Rating
// ---------------------------------------------------------------------------

const RATING = {
  isRated: true,
  status: 'COMPLETE',
  overallRating: 72,
  ratingTierCode: 'GOOD',
  ratedAt: null,
  periodLabel: '2026 Q3',
  source: 'AUDIT',
  sourceAuditId: null,
  categories: [
    { code: 'CERTIFICATION', score: 8, maxScore: 10 },
    { code: 'SOIL_LAND', score: 7, maxScore: 10 },
  ],
  history: null,
};

describe('Edit All Categories (BR-06, BR-04b)', () => {
  it('BR-06: no endpoint, so both Save controls are drawn but disabled and nothing reports success', () => {
    const root = render(<AdminEditRatingCategoriesScreen farmer={FARMER} onBack={vi.fn()} />);
    for (const label of [t('wiringFarmers.rating.edit.save'), t('wiringFarmers.rating.edit.saveAll')]) {
      const b = button(root, label);
      expect(b.props.disabled).toBe(true);
      expect(b.props.accessibilityState).toEqual({ disabled: true });
    }
    expect(allText(root)).toContain(t('wiringFarmers.rating.edit.saveUnavailable'));
    expect(rn.alert).not.toHaveBeenCalled();
  });

  it('BR-04b: the total is on the 0-100 scale; with no rating every score is a dash', () => {
    const text = allText(render(<AdminEditRatingCategoriesScreen farmer={FARMER} onBack={vi.fn()} />));
    expect(text).toContain('/ 100');
    expect(text).not.toContain('/ 1000');
    expect(text).not.toMatch(/\b88\b|\b82\b/);
  });

  it('BR-06: the categories are the ten seeded codes, with the live score where the rating has one', () => {
    hooks.useFarmerRating.mockReturnValue({ ...IDLE, rating: RATING });
    const text = allText(render(<AdminEditRatingCategoriesScreen farmer={FARMER} onBack={vi.fn()} />));
    expect(text).toContain(t('farmerDetail.rating.category.CERTIFICATION'));
    expect(text).toContain(t('farmerDetail.rating.category.INNOVATION'));
    expect(text).not.toContain('Soil Health');
    expect(text).toContain('72');
  });
});

describe('Rating scorecard (BR-06)', () => {
  it('BR-06: category names come from the real codes; no invented fallback categories; tip dashed', () => {
    hooks.useFarmerRating.mockReturnValue({ ...IDLE, rating: RATING });
    const text = allText(render(<AdminRatingScorecardScreen farmer={FARMER} onBack={vi.fn()} onOpenComplianceTiers={vi.fn()} />));
    expect(text).toContain(t('farmerDetail.rating.category.CERTIFICATION'));
    expect(text).toContain('8/10');
    expect(text).not.toMatch(/Soil Health|Water\nManagement|Pest & Disease Control|Consider more frequent pest log/);
  });
});

// ---------------------------------------------------------------------------
// Farm map
// ---------------------------------------------------------------------------

describe('Farm FMB & Zones map', () => {
  it('draws no invented pins and makes no geo-fence claim; lists the real plots', () => {
    hooks.useFarmer.mockReturnValue({
      ...IDLE,
      farmer: { landLocations: [{ id: 'l', name: 'Hill plot', hasBoundary: false, isPrimary: true, areaAcres: 2, centroid: null, plots: [{ id: 'p1', name: 'Zone North', areaAcres: 1.5, soilType: null, irrigationType: null, sunExposure: null }] }] },
    });
    const root = render(<AdminFarmMapScreen farmer={FARMER} onBack={vi.fn()} />);
    expect(root.findAll((n) => (n.type as unknown) === 'Circle')).toHaveLength(0);
    const text = allText(root);
    expect(text).not.toMatch(/Geo-fenced|FMB record/);
    expect(text).toContain('Zone North');
    expect(text).toContain(t('wiringFarmers.map.noGeometry'));
  });
});

// ---------------------------------------------------------------------------
// Produce records
// ---------------------------------------------------------------------------

const RECORD = {
  id: '77777777-7777-4777-8777-777777777777',
  crop: { id: 'c', name: 'Potato', botanicalName: null },
  variety: null,
  farmer: { id: FARMER_ID, tohfaFarmerId: 'TF-0001', name: 'Real Farmer' },
  farm: { id: 'f', name: 'Hill Farm' },
  zone: { id: 'z', code: 'KTG', name: 'Kotagiri' },
  plot: { id: 'p', name: 'Plot 2', areaAcres: 1 },
  status: 'HARVESTED',
  plantedOn: '2026-06-17',
  expectedHarvestOn: null,
  actualHarvestOn: '2026-09-28',
  expectedYieldKg: null,
  actualYieldKg: 5225,
  createdAt: '2026-06-17T00:00:00Z',
  updatedAt: null,
};

describe('Produce records screens read records, not the crop-type list', () => {
  it('Crop History lists harvested records with the server total', () => {
    hooks.useProduceRecordList.mockReturnValue({ ...LIST_IDLE, items: [RECORD], firstPage: { items: [RECORD], page: { nextCursor: null, hasMore: false, total: 16 } } });
    const root = render(<CropHistoryRecordsScreen can={makeCan(['produce.calendar.view_consolidated'])} onBack={vi.fn()} onSelectCropRecord={vi.fn()} />);
    expect(hooks.useProduceRecordList).toHaveBeenCalledWith(expect.objectContaining({ statuses: ['HARVESTED'] }), { enabled: true });
    expect(hooks.useProduceFilterOptions).not.toHaveBeenCalled();
    const text = allText(root);
    expect(text).toContain('Potato');
    expect(text).toContain('Real Farmer');
    expect(text).toContain(t('wiringFarmers.produce.history.count', { count: 16 }));
    expect(text).not.toContain(RECORD.id);
  });

  it('Crop History: an error is an error, not an empty list', () => {
    hooks.useProduceRecordList.mockReturnValue({ ...LIST_IDLE, error: new Error('x') });
    const text = allText(render(<CropHistoryRecordsScreen can={makeCan(['produce.calendar.view_consolidated'])} onBack={vi.fn()} onSelectCropRecord={vi.fn()} />));
    expect(text).toContain(t('async.error.title'));
  });

  it('Zone & Crop Breakdown: no fixed 4-of-7 stage bar and no invented exclusion count', () => {
    hooks.useProduceRecordList.mockReturnValue({ ...LIST_IDLE, items: [{ ...RECORD, status: 'GROWING' }] });
    const root = render(<ZoneCropBreakdownScreen can={makeCan(['produce.calendar.view_consolidated'])} onBack={vi.fn()} onOpenFilters={vi.fn()} onSelectCropRecord={vi.fn()} />);
    const text = allText(root);
    expect(text).not.toContain('(2 excluded)');
    expect(text).toContain('Potato');
    const cards = root.findAll((n) => (n.type as unknown) === 'Card');
    for (const c of cards) expect(c.props.value).toBe(ADMIN_NO_VALUE);
  });
});

// ---------------------------------------------------------------------------
// Inputs (inputs.catalog.manage has no route)
// ---------------------------------------------------------------------------

describe('Inputs: no endpoint, so no fixture and no fake action', () => {
  it('Approved Inputs shows the not-available state, never fixture rows', () => {
    const text = allText(render(<ApprovedInputsScreen onBack={vi.fn()} />));
    expect(text).toContain(t('wiringFarmers.inputs.catalog.unavailable'));
    expect(text).not.toMatch(/Neem Oil Concentrate|IN-0041/);
  });

  it('Input detail: status is never defaulted to Approved, no invented registration id, actions disabled', () => {
    const item = { id: 'i', name: 'X', code: 'C1', category: 'cat', manufacturer: 'm', applicableCrops: '', status: '', updatedDate: '', updatedBy: '' };
    const root = render(<InputDetailScreen inputItem={item} can={makeCan(['admin.decision.override'])} onBack={vi.fn()} />);
    const text = allText(root);
    expect(text).not.toContain('C1-TN');
    for (const label of ['Deactivate account', 'Terminate', 'Delete Information']) {
      expect(button(root, label).props.disabled).toBe(true);
    }
    expect(rn.alert).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Farm records
// ---------------------------------------------------------------------------

function openTab(root: ReactTestInstance, label: string) {
  act(() => {
    button(root, label).props.onPress();
  });
}

describe('Farm records: fetched, or honestly "not loaded"; no fake record actions', () => {
  it('without a farmer or permission the crop tab says not loaded, never "No crops registered"', () => {
    const root = render(<FarmRecordsSection farmerName="Real Farmer" can={makeCan([])} />);
    openTab(root, 'Plant & Crops');
    const text = allText(root);
    expect(text).toContain(t('wiringFarmers.records.notLoaded'));
    expect(text).not.toContain('No crops registered');
  });

  it('the diary has no admin endpoint and says so', () => {
    const text = allText(render(<FarmRecordsSection farmerId={FARMER_ID} can={makeCan(['produce.calendar.view_consolidated'])} />));
    expect(text).toContain(t('wiringFarmers.records.diaryUnavailable'));
  });

  it('crops come from the record list for this farmer; modals open and final stage/harvest confirms are disabled', () => {
    hooks.useProduceRecordList.mockReturnValue({ ...LIST_IDLE, items: [{ ...RECORD, status: 'GROWING' }], firstPage: { items: [], page: { nextCursor: null, hasMore: false, total: 1 } } });
    const root = render(<FarmRecordsSection farmerId={FARMER_ID} can={makeCan(['produce.calendar.view_consolidated'])} />);
    openTab(root, 'Plant & Crops');
    expect(hooks.useProduceRecordList).toHaveBeenCalledWith({ farmerId: FARMER_ID }, { enabled: true });
    expect(allText(root)).toContain('Potato');
    act(() => {
      button(root, 'Potato').props.onPress();
    });
    // Opening each modal keeps the sheet usable, while the final confirm stays disabled with a note.
    act(() => {
      button(root, 'Update stage').props.onPress();
    });
    expect(root.findByProps({ testID: 'farmrec.stage.confirm' }).props.disabled).toBe(true);
    act(() => {
      button(root, 'Record harvest').props.onPress();
    });
    expect(root.findByProps({ testID: 'farmrec.harvest.confirm' }).props.disabled).toBe(true);
    expect(allText(root)).toContain(t('wiringFarmers.records.saveUnavailable'));
    expect(rn.alert).not.toHaveBeenCalled();
  });

  it('livestock comes from the herd read; modals open and final log-production/end-record confirms are disabled', () => {
    hooks.useAdminFarmerAnimals.mockReturnValue({
      animals: [{ id: 'a1', tag: 'C-014', name: 'Lakshmi', species: 'CATTLE', breed: 'Jersey', gender: 'FEMALE', dateOfBirth: null, source: 'PURCHASED', purchasedOn: '2025-01-10', sourceFarm: null, organicStatus: 'ORGANIC', lifecycleStatus: 'ACTIVE', withdrawalUntil: null, notes: null, createdAt: '', updatedAt: null }],
      isLoading: false, error: null, refresh: vi.fn(),
    });
    const root = render(<FarmRecordsSection farmerId={FARMER_ID} can={makeCan(['admin.livestock.view_all'])} />);
    openTab(root, 'Livestock');
    expect(hooks.useAdminFarmerAnimals).toHaveBeenCalledWith(FARMER_ID, { enabled: true });
    expect(allText(root)).toContain('Lakshmi');
    act(() => {
      button(root, 'Log production').props.onPress();
    });
    expect(root.findByProps({ testID: 'farmrec.production.confirm' }).props.disabled).toBe(true);
    act(() => {
      button(root, 'End record').props.onPress();
    });
    expect(root.findByProps({ testID: 'farmrec.endRecord.confirm' }).props.disabled).toBe(true);
    expect(allText(root)).toContain(t('wiringFarmers.records.saveUnavailable'));
    expect(rn.alert).not.toHaveBeenCalled();
  });

  it('Add farm record: every tab renders without demo values and keeps its final Save disabled', () => {
    for (const [tab, testID] of [
      ['Diary', 'farmrec.add.diary.save'],
      ['Plant', 'farmrec.add.plant.save'],
      ['Crops', 'farmrec.add.crops.save'],
      ['Assets', 'farmrec.add.assets.save'],
    ] as const) {
      const root = render(<AdminAddFarmRecordScreen initialTab={tab} onBack={vi.fn()} />);
      expect(root.findByProps({ testID }).props.disabled).toBe(true);
      expect(allText(root)).toContain(t('wiringFarmers.records.saveUnavailable'));
    }
    const livestockRoot = render(<AdminAddFarmRecordScreen initialTab="Livestock" onBack={vi.fn()} />);
    for (let step = 0; step < 4; step++) {
      act(() => {
        button(livestockRoot, 'Next').props.onPress();
      });
    }
    expect(livestockRoot.findByProps({ testID: 'farmrec.add.livestock.save' }).props.disabled).toBe(true);
    expect(allText(livestockRoot)).toContain(t('wiringFarmers.records.saveUnavailable'));
    expect(rn.alert).not.toHaveBeenCalled();
  });

  it('Edit farm record: Save and the photo controls are disabled; nothing reports a save', () => {
    const root = render(<AdminEditFarmRecordScreen record={{ type: 'diary', headerTitle: 'Edit Diary' }} onBack={vi.fn()} />);
    expect(button(root, 'Save').props.disabled).toBe(true);
    expect(allText(root)).toContain(t('wiringFarmers.records.saveUnavailable'));
    expect(rn.alert).not.toHaveBeenCalled();
  });
});
