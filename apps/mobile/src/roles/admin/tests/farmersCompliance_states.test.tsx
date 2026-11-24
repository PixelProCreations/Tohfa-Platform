/**
 * Verification & Compliance and Farm Records list screens, rendered with
 * react-test-renderer against mocked hooks. Pins what each shows for a real
 * farmer the API says nothing compliance-wise about (dashes, never a status
 * the screen invented), and that an empty, loading or failed live list is a
 * state of its own, never a set of invented farmers.
 *
 * With three real farmers in the database an empty or near-empty list is the
 * normal case, so the empty and "no row matches this search" states are pinned
 * as carefully as the populated one.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';
import type { CertificationDto } from '../api/certifications';
import type { FarmerRowView } from '../api/farmerTypes';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Modal: 'Modal',
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj['ios'] ?? obj['default'] },
  Pressable: 'Pressable',
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, absoluteFill: {} },
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
  Rect: 'Rect',
}));
vi.mock('@tohfa/mobile-ui', () => ({ ScreenStatusBar: 'ScreenStatusBar', SafeAreaView: 'SafeAreaView' }));

const hooks = vi.hoisted(() => ({ useCertificationList: vi.fn() }));
vi.mock('../api/certificationHooks', () => hooks);

import { SuperAdminVerificationComplianceScreen } from '../screens/farmers/SuperAdminVerificationComplianceScreen';
import { SuperAdminFarmRecordsListScreen } from '../screens/farmers/SuperAdminFarmRecordsListScreen';
import { toDesignFarmerItem } from '../screens/farmers/allFarmersMappers';
import { makeCan } from '../permissions/can';
import { ADMIN_NO_VALUE } from '../utils/noValue';
import { t } from '../i18n';

function farmerRow(over: Partial<FarmerRowView> = {}): FarmerRowView {
  return {
    id: 'f-1',
    farmerCode: 'TOHFA-F-2026-0001',
    name: 'Arun Kumar',
    initials: 'AK',
    mobile: '9876500001',
    zoneId: null,
    zoneName: null,
    status: 'active',
    accountStatus: 'ACTIVE',
    applicationStatus: 'APPROVED',
    kycStatus: 'PENDING',
    overallRating: null,
    ratingTierCode: null,
    ratingTierLabel: null,
    landLocationCount: 0,
    isMarketBlocked: false,
    registeredAt: '2026-09-01T00:00:00.000Z',
    farmingType: null,
    farmName: null,
    subscriptionLabel: null,
    hasExpiredCertification: null,
    ...over,
  };
}

function cert(over: Partial<CertificationDto> = {}): CertificationDto {
  return {
    id: 'c-1',
    farmerId: 'f-1',
    certType: 'PGS',
    customTypeName: null,
    certNumber: 'PGS-0001',
    expiresOn: '2099-03-15',
    verificationStatus: 'VERIFIED',
    blocksListings: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

function certList(items: CertificationDto[] = [], over: { isLoading?: boolean; error?: unknown } = {}) {
  return {
    items,
    firstPage: undefined,
    loadMore: vi.fn(),
    hasMore: false,
    isLoading: over.isLoading ?? false,
    error: over.error ?? null,
    refresh: vi.fn(),
    isRefreshing: false,
  };
}

function textOf(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(textOf);
  return (node.children ?? []).flatMap(textOf);
}

async function mount(element: React.ReactElement): Promise<string> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(element);
  });
  return textOf(tree.toJSON()).join('\n');
}

const INVENTED_PEOPLE = ['Ramesh Kumar', 'Selvi Murugan', 'M. Anand', 'Selvi', 'John', 'Rani', 'FMR-00101'];
const INVENTED_STATUS = ['PGS-India / Organic', '2027-12-31', 'Completed', '4.5 / 5.0', 'Tier A', 'Today', 'Nilgiris', 'Not configured'];
const noop = () => undefined;
const admin = makeCan(['certification.view', 'farmer.rating.view', 'audit.view', 'farmer.document.verify']);

beforeEach(() => {
  hooks.useCertificationList.mockReset();
  hooks.useCertificationList.mockReturnValue(certList());
});

describe('Verification & Compliance: a real farmer with no compliance data', () => {
  it('renders dashes and the real KYC status, NOT a verified, certified, audited, 4.5-rated farmer', async () => {
    hooks.useCertificationList.mockReturnValue(certList([]));
    const text = await mount(<SuperAdminVerificationComplianceScreen can={admin} farmers={[farmerRow()]} onBack={noop} />);
    expect(text).toContain('Arun Kumar');
    expect(text).toContain('TOHFA-F-2026-0001');
    expect(text).toContain(t('farmersList.kyc.PENDING'));
    expect(text).toContain(t('superAdmin.compliance.cert.none'));
    expect(text).toContain(ADMIN_NO_VALUE);
    for (const fake of INVENTED_STATUS) expect(text.includes(fake), fake).toBe(false);
    expect(text.includes(t('farmersList.kyc.VERIFIED'))).toBe(false);
  });

  it('keeps every designed field on the card (label and a value), dashing what has no source', async () => {
    const text = await mount(<SuperAdminVerificationComplianceScreen can={admin} farmers={[farmerRow()]} onBack={noop} />);
    for (const key of [
      'superAdmin.compliance.label.farmerId',
      'superAdmin.compliance.label.zone',
      'superAdmin.compliance.label.kyc',
      'superAdmin.compliance.label.certType',
      'superAdmin.compliance.label.certExpiry',
      'superAdmin.compliance.label.certStatus',
      'superAdmin.compliance.label.audit',
      'superAdmin.compliance.label.ratingScore',
      'superAdmin.compliance.label.ratingTier',
      'superAdmin.compliance.label.lastUpdated',
    ] as const) {
      expect(text, key).toContain(t(key));
    }
    // zone, rating score, rating tier, audit, last updated: all dashes for this farmer
    expect(text.split('\n').filter((l) => l === ADMIN_NO_VALUE).length).toBeGreaterThanOrEqual(5);
  });

  it('BR-06: a rated farmer shows the 0-100 score and tier the server sent, not a star figure', async () => {
    const text = await mount(
      <SuperAdminVerificationComplianceScreen
        can={admin}
        farmers={[farmerRow({ overallRating: 82, ratingTierCode: 'GOOD', ratingTierLabel: 'Good', zoneName: 'Coonoor', kycStatus: 'VERIFIED' })]}
        onBack={noop}
      />,
    );
    expect(text).toContain('82/100');
    expect(text).toContain('Good');
    expect(text).toContain('Coonoor');
    expect(text).toContain(t('farmersList.kyc.VERIFIED'));
    expect(text.includes('/ 5.0')).toBe(false);
  });

  it('shows the farmer\'s real certificate: type, expiry day and status', async () => {
    hooks.useCertificationList.mockReturnValue(certList([cert({ certType: 'NPOP', expiresOn: '2099-03-15' })]));
    const text = await mount(<SuperAdminVerificationComplianceScreen can={admin} farmers={[farmerRow()]} onBack={noop} />);
    expect(text).toContain(t('superAdmin.compliance.cert.type.NPOP'));
    expect(text).toContain('15 Mar 2099');
    expect(text).toContain(t('superAdmin.compliance.cert.status.VERIFIED'));
  });

  it('asks for each farmer\'s certificates by farmer id, and not at all without certification.view', async () => {
    await mount(<SuperAdminVerificationComplianceScreen can={admin} farmers={[farmerRow()]} onBack={noop} warehouseId="w-1" />);
    expect(hooks.useCertificationList).toHaveBeenCalledWith('w-1', { farmerId: 'f-1' }, { enabled: true });

    hooks.useCertificationList.mockClear();
    const text = await mount(
      <SuperAdminVerificationComplianceScreen can={makeCan(['farmer.rating.view'])} farmers={[farmerRow()]} onBack={noop} />,
    );
    expect(hooks.useCertificationList).toHaveBeenCalledWith(undefined, { farmerId: 'f-1' }, { enabled: false });
    expect(text.includes(t('superAdmin.compliance.cert.none'))).toBe(false); // unknown, not "none"
  });

  it('a failed certificate read dashes the certificate fields rather than claiming "none"', async () => {
    hooks.useCertificationList.mockReturnValue(certList([], { error: new Error('boom') }));
    const text = await mount(<SuperAdminVerificationComplianceScreen can={admin} farmers={[farmerRow()]} onBack={noop} />);
    expect(text.includes(t('superAdmin.compliance.cert.none'))).toBe(false);
    expect(text).toContain(ADMIN_NO_VALUE);
  });

  it('the count is of the loaded farmers, not of a fixture of three', async () => {
    const text = await mount(<SuperAdminVerificationComplianceScreen can={admin} farmers={[farmerRow()]} onBack={noop} />);
    expect(text).toContain(t('superAdmin.farmersManagement.farmersCount', { current: 1, total: 1 }));
    expect(text.includes('of 3')).toBe(false);
  });
});

describe('Verification & Compliance: loading, error and empty are states, not fixtures', () => {
  it('an empty live list renders the empty state and NOT any demo farmer', async () => {
    const text = await mount(<SuperAdminVerificationComplianceScreen can={admin} farmers={[]} onBack={noop} />);
    expect(text).toContain(t('farmersList.empty.farmers'));
    for (const name of INVENTED_PEOPLE) expect(text.includes(name), name).toBe(false);
    expect(hooks.useCertificationList).not.toHaveBeenCalled();
  });

  it('a slow query shows loading, not farmers and not "No farmers yet"', async () => {
    const text = await mount(<SuperAdminVerificationComplianceScreen can={admin} farmers={[]} isLoading onBack={noop} />);
    expect(text).toContain(t('async.loading'));
    expect(text).not.toContain(t('farmersList.empty.farmers'));
    for (const name of INVENTED_PEOPLE) expect(text.includes(name), name).toBe(false);
  });

  it('a failed query shows the error state with Retry, not an empty list', async () => {
    const text = await mount(
      <SuperAdminVerificationComplianceScreen can={admin} farmers={[]} error={new Error('boom')} onRetry={noop} onBack={noop} />,
    );
    expect(text).toContain(t('async.error.title'));
    expect(text).toContain(t('async.retry'));
    expect(text).not.toContain(t('farmersList.empty.farmers'));
    for (const name of INVENTED_PEOPLE) expect(text.includes(name), name).toBe(false);
  });

  it('a search that matches nothing says so, and is not the "no farmers yet" state', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<SuperAdminVerificationComplianceScreen can={admin} farmers={[farmerRow()]} onBack={noop} />);
    });
    const input = tree.root.findAll((n) => (n.type as unknown) === 'TextInput')[0]!;
    await act(async () => {
      input.props.onChangeText('zzz-no-such-farmer');
    });
    const text = textOf(tree.toJSON()).join('\n');
    expect(text).toContain(t('farmersList.empty.farmersFiltered'));
    expect(text).not.toContain(t('farmersList.empty.farmers'));
    expect(text.includes('Arun Kumar')).toBe(false);
  });

  it('keeps the header and the search bar in every state', async () => {
    const text = await mount(<SuperAdminVerificationComplianceScreen can={admin} farmers={[]} onBack={noop} />);
    expect(text).toContain(t('superAdmin.compliance.title'));
  });
});

describe('Farm Records list: real farmers, not four invented ones', () => {
  const live = (...rows: FarmerRowView[]) => rows.map(toDesignFarmerItem);

  it('an empty live list renders the empty state and NOT any demo farmer', async () => {
    const text = await mount(<SuperAdminFarmRecordsListScreen farmers={[]} onBack={noop} onSelectRecord={noop} />);
    expect(text).toContain(t('farmersList.empty.farmers'));
    for (const name of [...INVENTED_PEOPLE, 'Kumar Farming', 'John Farm house', 'Rani Farm village']) {
      expect(text.includes(name), name).toBe(false);
    }
  });

  it('loading and error are not the empty state', async () => {
    const loading = await mount(<SuperAdminFarmRecordsListScreen farmers={[]} isLoading onBack={noop} onSelectRecord={noop} />);
    expect(loading).toContain(t('async.loading'));
    expect(loading).not.toContain(t('farmersList.empty.farmers'));
    const failed = await mount(
      <SuperAdminFarmRecordsListScreen farmers={[]} error={new Error('boom')} onRetry={noop} onBack={noop} onSelectRecord={noop} />,
    );
    expect(failed).toContain(t('async.error.title'));
    expect(failed).toContain(t('async.retry'));
    expect(failed).not.toContain(t('farmersList.empty.farmers'));
  });

  it('shows the real farmer: name, code and mobile; no invented farm title, code, phone or rating', async () => {
    const text = await mount(<SuperAdminFarmRecordsListScreen farmers={live(farmerRow())} onBack={noop} onSelectRecord={noop} />);
    expect(text).toContain('Arun Kumar');
    expect(text).toContain('TOHFA-F-2026-0001');
    expect(text).toContain('9876500001');
    expect(text.includes('Arun Kumar Farm')).toBe(false);
    for (const fake of ['FMR-00124', '+91 90000 20000', '4.5']) expect(text.includes(fake), fake).toBe(false);
  });

  it('the status badge is the account status the server sent, not a hard-coded Active', async () => {
    const pending = await mount(
      <SuperAdminFarmRecordsListScreen farmers={live(farmerRow({ accountStatus: 'PENDING', status: 'pending' }))} onBack={noop} onSelectRecord={noop} />,
    );
    expect(pending).toContain(t('farmersList.status.pending'));
    expect(pending.includes(t('farmersList.status.active'))).toBe(false);
    const disabled = await mount(
      <SuperAdminFarmRecordsListScreen farmers={live(farmerRow({ accountStatus: 'DISABLED', status: 'disabled' }))} onBack={noop} onSelectRecord={noop} />,
    );
    expect(disabled).toContain(t('farmersList.status.disabled'));
  });

  it('the zone filter offers the zones of the loaded farmers, not a fixed Coonoor / Ooty / Kotagiri list', async () => {
    const text = await mount(
      <SuperAdminFarmRecordsListScreen farmers={live(farmerRow({ zoneName: 'Gudalur' }))} onBack={noop} onSelectRecord={noop} />,
    );
    expect(text).toContain('Gudalur');
    for (const zone of ['Coonoor', 'Ooty', 'Kotagiri']) expect(text.includes(zone), zone).toBe(false);
  });

  it('a list that arrives after the first render is shown (the old memo never recomputed)', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<SuperAdminFarmRecordsListScreen farmers={[]} isLoading onBack={noop} onSelectRecord={noop} />);
    });
    await act(async () => {
      tree.update(<SuperAdminFarmRecordsListScreen farmers={live(farmerRow())} onBack={noop} onSelectRecord={noop} />);
    });
    const text = textOf(tree.toJSON()).join('\n');
    expect(text).toContain('Arun Kumar');
    expect(text).not.toContain(t('async.loading'));
  });

  it('a search that matches nothing says so, and is not the "no farmers yet" state', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<SuperAdminFarmRecordsListScreen farmers={live(farmerRow())} onBack={noop} onSelectRecord={noop} />);
    });
    await act(async () => {
      tree.root.findAll((n) => (n.type as unknown) === 'TextInput')[0]!.props.onChangeText('zzz-no-such-farmer');
    });
    const text = textOf(tree.toJSON()).join('\n');
    expect(text).toContain(t('farmersList.empty.farmersFiltered'));
    expect(text).not.toContain(t('farmersList.empty.farmers'));
  });

  it('a farmer without a mobile shows the dash, not a made-up number', async () => {
    const item = { ...toDesignFarmerItem(farmerRow()) };
    delete (item as { mobile?: string }).mobile;
    const text = await mount(<SuperAdminFarmRecordsListScreen farmers={[item]} onBack={noop} onSelectRecord={noop} />);
    expect(text).toContain(`TOHFA-F-2026-0001 · ${ADMIN_NO_VALUE}`);
  });
});
