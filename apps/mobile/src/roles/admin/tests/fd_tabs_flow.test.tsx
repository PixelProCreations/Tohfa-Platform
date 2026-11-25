/**
 * FarmerManagementFlow: the Farmer Detail "Payout" tab's navigation.
 * A payout row opens `payout_detail` with the real payout, the farmer's uuid
 * for the API and the farmer's code for display; the account card opens
 * `payout_bank_details` with the uuid; Back returns to the Payout tab.
 * Every screen below the flow is stubbed so the props it gets can be read.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance } from 'react-test-renderer';

vi.mock('react-native', () => ({
  Platform: { OS: 'ios', select: (o: Record<string, unknown>) => o['ios'] ?? o['default'] },
  StyleSheet: { create: (s: unknown) => s, flatten: (s: unknown) => s },
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('@tohfa/mobile-ui', () => ({ ScreenStatusBar: 'ScreenStatusBar', SafeAreaView: 'SafeAreaView', Icon: 'Icon' }));

const hooks = vi.hoisted(() => ({ useFarmerList: vi.fn() }));
vi.mock('../api/farmerHooks', () => ({ useFarmerList: hooks.useFarmerList }));

function stub(name: string) {
  return (props: Record<string, unknown>) => React.createElement(name, props);
}
vi.mock('../screens/farmers/AdminAllFarmersScreen', () => ({ AdminAllFarmersScreen: stub('AllFarmers') }));
vi.mock('../screens/farmers/allFarmersMappers', () => ({ toDesignFarmerItem: (x: unknown) => x }));
vi.mock('../screens/farmers/AdminFarmerDetailScreen', () => ({ AdminFarmerDetailScreen: stub('FarmerDetail') }));
vi.mock('../screens/farmers/AdminFarmMapScreen', () => ({ AdminFarmMapScreen: stub('FarmMap') }));
vi.mock('../screens/farmers/AdminRatingScorecardScreen', () => ({ AdminRatingScorecardScreen: stub('Scorecard') }));
vi.mock('../screens/farmers/AdminEditRatingCategoriesScreen', () => ({ AdminEditRatingCategoriesScreen: stub('EditCategories') }));
vi.mock('../screens/farmers/AdminEditFarmerScreen', () => ({ AdminEditFarmerScreen: stub('EditFarmer') }));
vi.mock('../screens/certifications/AdminComplianceTiersScreen', () => ({ AdminComplianceTiersScreen: stub('ComplianceTiers') }));
vi.mock('../screens/certifications/AdminCertVerificationScreen', () => ({ AdminCertVerificationScreen: stub('CertVerification') }));
vi.mock('../screens/audits/AuditDetailRecordScreen', () => ({ AuditDetailRecordScreen: stub('AuditRecord') }));
vi.mock('../screens/audits/FarmerAuditHistoryScreen', () => ({ FarmerAuditHistoryScreen: stub('AuditHistory') }));
vi.mock('../screens/registration/AdminApplicationDetailScreen', () => ({ AdminApplicationDetailScreen: stub('ApplicationDetail') }));
vi.mock('../screens/farmers/SuperAdminVerificationComplianceScreen', () => ({ SuperAdminVerificationComplianceScreen: stub('Compliance') }));
vi.mock('../screens/farmers/SuperAdminFarmRecordsListScreen', () => ({ SuperAdminFarmRecordsListScreen: stub('RecordsList') }));
vi.mock('../screens/farmers/FarmerBankAccountDetailsScreen', () => ({ FarmerBankAccountDetailsScreen: stub('BankDetails') }));
vi.mock('../screens/farmers/FarmerPayoutDetailScreen', () => ({ FarmerPayoutDetailScreen: stub('PayoutDetail') }));

import { FarmerManagementFlow } from '../screens/farmers/FarmerManagementFlow';
import type { PayoutDetailItem } from '../screens/farmers/FarmerPayoutDetailScreen';
import { makeCan } from '../permissions/can';

const FARMER_UUID = '33333333-3333-4333-8333-333333333333';
const FARMER_CODE = 'TOHFA-F-2026-0042';
const FARMER = { id: FARMER_UUID, code: FARMER_CODE, name: 'Lakshmi Devi', status: 'ACTIVE' } as never;
const PAYOUT: PayoutDetailItem = {
  id: '99999999-9999-4999-8999-999999999999',
  code: 'PO-REAL-17',
  amount: '10800.00' as never,
  status: 'PENDING_APPROVAL',
  farmerId: FARMER_UUID,
  farmerName: 'Lakshmi Devi',
};

function mount(can = makeCan(['farmer.profile.view_all', 'payout.view'])): { root: ReactTestInstance; can: ReturnType<typeof makeCan> } {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<FarmerManagementFlow can={can} initialSubScreen="farmer_detail" initialFarmer={FARMER} />);
  });
  return { root: tree.root, can };
}

beforeEach(() => {
  vi.clearAllMocks();
  hooks.useFarmerList.mockReturnValue({ items: [], isLoading: false, error: null, refresh: vi.fn(), hasMore: false });
});

describe('FarmerManagementFlow: Payout tab navigation', () => {
  it('a payout row opens payout_detail with the real payout, the uuid for the API, the code for display, and can', () => {
    const { root, can } = mount();
    const detail = root.findByType('FarmerDetail' as never);
    expect(typeof detail.props.onOpenPayoutDetail).toBe('function');
    act(() => {
      (detail.props.onOpenPayoutDetail as (p: PayoutDetailItem) => void)(PAYOUT);
    });
    const screen = root.findByType('PayoutDetail' as never);
    expect(screen.props.payout).toBe(PAYOUT);
    expect(screen.props.farmerId).toBe(FARMER_UUID);
    expect(screen.props.farmerCode).toBe(FARMER_CODE);
    expect(screen.props.can).toBe(can);
  });

  it('Back from the payout detail returns to the farmer detail on the Payout tab', () => {
    const { root } = mount();
    act(() => {
      (root.findByType('FarmerDetail' as never).props.onOpenPayoutDetail as (p: PayoutDetailItem) => void)(PAYOUT);
    });
    act(() => {
      (root.findByType('PayoutDetail' as never).props.onBack as () => void)();
    });
    const detail = root.findByType('FarmerDetail' as never);
    expect(detail.props.initialTab).toBe('Payout');
  });

  it('the payout account card opens payout_bank_details with the uuid (and the code only for display); Back returns to Payout', () => {
    const { root, can } = mount();
    act(() => {
      (root.findByType('FarmerDetail' as never).props.onOpenBankDetails as () => void)();
    });
    const bank = root.findByType('BankDetails' as never);
    expect(bank.props.farmerId).toBe(FARMER_UUID);
    expect(bank.props.farmerCode).toBe(FARMER_CODE);
    expect(bank.props.can).toBe(can);
    act(() => {
      (bank.props.onBack as () => void)();
    });
    expect(root.findByType('FarmerDetail' as never).props.initialTab).toBe('Payout');
  });
});
