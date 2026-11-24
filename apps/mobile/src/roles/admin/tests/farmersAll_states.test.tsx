/**
 * Farmers Management screen (the design port, AdminAllFarmersScreen), rendered
 * with react-test-renderer against mocked farmer hooks. Pins what the screen
 * shows for a real farmer the API says nothing compliance-wise about (dashes,
 * never "KYC Verified" / "Active · Paid" / 4.5), and that an empty, loading or
 * failed live list is a state of its own, never a set of invented farmers.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';
import type { ApplicationRowView, FarmerRowView } from '../api/farmerTypes';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Modal: 'Modal',
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj['ios'] ?? obj['default'] },
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s },
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
vi.mock('../components/OverviewDashboardCard', () => ({
  OverviewDashboardCard: 'OverviewDashboardCard',
  OverviewCardsGrid: 'OverviewCardsGrid',
}));

const hooks = vi.hoisted(() => ({
  useFarmerSummary: vi.fn(),
  useFarmerList: vi.fn(),
  useApplicationList: vi.fn(),
}));
vi.mock('../api/farmerHooks', () => hooks);

import { AdminAllFarmersScreen } from '../screens/farmers/AdminAllFarmersScreen';
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
    status: 'pending',
    accountStatus: 'PENDING',
    applicationStatus: 'SUBMITTED',
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

function applicationRow(over: Partial<ApplicationRowView> = {}): ApplicationRowView {
  return {
    id: 'a-1',
    name: 'Meena Raj',
    initials: 'MR',
    mobile: '9876500009',
    status: 'SUBMITTED',
    isDraft: false,
    village: null,
    district: null,
    farmingType: null,
    primaryCrops: [],
    statedAreaAcres: null,
    locationCount: 0,
    boundaryCount: 0,
    documentCount: 0,
    aadhaarLast4: null,
    submittedAt: '2026-10-05T06:00:00.000Z',
    createdAt: '2026-10-01T06:00:00.000Z',
    zoneId: null,
    slaDueAt: null,
    documentsComplete: null,
    applicationCode: null,
    kycStatus: null,
    ...over,
  };
}

function cursorList<T>(over: { items?: T[]; isLoading?: boolean; error?: unknown } = {}) {
  return {
    items: over.items ?? [],
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

const INVENTED_FARMERS = ['Ramesh Kumar', 'Selvi', 'Kumar', 'Rani'];
const INVENTED_STATUS = ['KYC Verified', 'Active · Paid', 'XXXX XXXX 4321', '4.5', '4.6', '3.0', 'Organic', 'Natural'];

beforeEach(() => {
  hooks.useFarmerSummary.mockReset();
  hooks.useFarmerList.mockReset();
  hooks.useApplicationList.mockReset();
  hooks.useFarmerSummary.mockReturnValue({ summary: undefined });
  hooks.useFarmerList.mockReturnValue(cursorList<FarmerRowView>());
  hooks.useApplicationList.mockReturnValue(cursorList<ApplicationRowView>());
});

const admin = makeCan(['farmer.profile.view_all', 'farmer.application.list_pending']);

describe('Farmers Management list: a real farmer with no compliance data', () => {
  it('renders dashes, NOT KYC Verified / Active · Paid / 4.5 / Organic', async () => {
    hooks.useFarmerList.mockReturnValue(cursorList({ items: [farmerRow()] }));
    const text = await mount(<AdminAllFarmersScreen can={admin} role="SUPER_ADMIN" />);
    expect(text).toContain('Arun Kumar');
    expect(text).toContain(t('farmersList.kyc.PENDING'));
    expect(text).toContain(ADMIN_NO_VALUE);
    for (const fake of INVENTED_STATUS) expect(text.includes(fake), fake).toBe(false);
  });

  it('BR-06: a rated farmer shows the 0-100 score the server sent, not a star figure', async () => {
    hooks.useFarmerList.mockReturnValue(
      cursorList({ items: [farmerRow({ overallRating: 82, accountStatus: 'ACTIVE', status: 'active', kycStatus: 'VERIFIED' })] }),
    );
    const text = await mount(<AdminAllFarmersScreen can={admin} role="SUPER_ADMIN" />);
    expect(text).toContain(t('farmersList.card.ratingValue', { score: 82 }));
    expect(text).toContain(t('farmersList.kyc.VERIFIED'));
  });

  it('the Farmer Admin layout dashes the rating and farming type too', async () => {
    hooks.useFarmerList.mockReturnValue(cursorList({ items: [farmerRow()] }));
    const text = await mount(<AdminAllFarmersScreen can={admin} role="FARMER_ADMIN" />);
    for (const fake of INVENTED_STATUS) expect(text.includes(fake), fake).toBe(false);
    expect(text).toContain(ADMIN_NO_VALUE);
  });
});

describe('Farmers Management list: loading, error and empty are states, not fixtures', () => {
  it('an empty live list renders the empty state and NOT any demo farmer', async () => {
    const text = await mount(<AdminAllFarmersScreen can={admin} role="SUPER_ADMIN" />);
    expect(text).toContain(t('farmersList.empty.farmers'));
    for (const name of INVENTED_FARMERS) expect(text.includes(name), name).toBe(false);
  });

  it('an empty live applications list renders the empty state and NOT any demo applicant', async () => {
    const text = await mount(<AdminAllFarmersScreen can={admin} role="SUPER_ADMIN" initialTab="applications" />);
    expect(text).toContain(t('farmersList.empty.applications'));
    for (const name of INVENTED_FARMERS) expect(text.includes(name), name).toBe(false);
  });

  it('a slow query shows loading, not farmers and not "0 farmers"', async () => {
    hooks.useFarmerList.mockReturnValue(cursorList<FarmerRowView>({ isLoading: true }));
    const text = await mount(<AdminAllFarmersScreen can={admin} role="SUPER_ADMIN" />);
    expect(text).toContain(t('async.loading'));
    expect(text).not.toContain(t('farmersList.empty.farmers'));
    expect(text.includes('0 farmers')).toBe(false);
    for (const name of INVENTED_FARMERS) expect(text.includes(name), name).toBe(false);
  });

  it('a failed query shows the error state with Retry, not an empty list', async () => {
    hooks.useFarmerList.mockReturnValue(cursorList<FarmerRowView>({ error: new Error('boom') }));
    const text = await mount(<AdminAllFarmersScreen can={admin} role="SUPER_ADMIN" />);
    expect(text).toContain(t('async.error.title'));
    expect(text).toContain(t('async.retry'));
    expect(text).not.toContain(t('farmersList.empty.farmers'));
    for (const name of INVENTED_FARMERS) expect(text.includes(name), name).toBe(false);
  });

  it('a real application renders with dashes for what the API did not send', async () => {
    hooks.useApplicationList.mockReturnValue(cursorList({ items: [applicationRow()] }));
    const text = await mount(<AdminAllFarmersScreen can={admin} role="SUPER_ADMIN" initialTab="applications" />);
    expect(text).toContain('Meena Raj');
    expect(text).toContain(ADMIN_NO_VALUE);
    for (const fake of ['APP-2026', 'XXXX XXXX 4321', 'KYC Verified', 'Organic', 'Carrot']) {
      expect(text.includes(fake), fake).toBe(false);
    }
  });
});
