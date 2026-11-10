/**
 * Shared Farmers flow, fail-closed (Module 1 phase 3A): the REAL list screen
 * under the flow with mocked farmer hooks. A caller without
 * farmer.profile.view_all sees the not-available state and no hook is given
 * an id or enabled, whichever host mounted the flow. Scoping of what a
 * permitted caller sees is server-side (BR-108a) and not decided here.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  BackHandler: { addEventListener: () => ({ remove: () => undefined }) },
  Modal: 'Modal',
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj['ios'] ?? obj['default'] },
  RefreshControl: 'RefreshControl',
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Line: 'Line', Path: 'Path', Rect: 'Rect' }));
vi.mock('@tohfa/mobile-ui', () => ({ ScreenStatusBar: 'ScreenStatusBar', SafeAreaView: 'SafeAreaView' }));

const hooks = vi.hoisted(() => ({
  useFarmerList: vi.fn(),
  useApplicationList: vi.fn(),
  useFarmer: vi.fn(),
  useApplication: vi.fn(),
}));
vi.mock('../api/farmerHooks', () => hooks);

// Screens off the root are not rendered in these tests; stubbed so their imports stay out.
function stub(name: string) {
  return (props: Record<string, unknown>) => React.createElement(name, props);
}
vi.mock('../screens/farmers/AdminFarmerDetailScreen', () => ({ AdminFarmerDetailScreen: stub('FarmerDetail') }));
vi.mock('../screens/farmers/AdminEditFarmerScreen', () => ({ AdminEditFarmerScreen: stub('EditFarmer') }));
vi.mock('../screens/farmers/AdminFarmMapScreen', () => ({ AdminFarmMapScreen: stub('FarmMap') }));
vi.mock('../screens/farmers/AdminRatingScorecardScreen', () => ({ AdminRatingScorecardScreen: stub('Scorecard') }));
vi.mock('../screens/certifications/AdminKycReviewScreen', () => ({ AdminKycReviewScreen: stub('KycReview') }));
vi.mock('../screens/certifications/AdminCertVerificationScreen', () => ({ AdminCertVerificationScreen: stub('CertVerification') }));
vi.mock('../screens/certifications/AdminComplianceTiersScreen', () => ({ AdminComplianceTiersScreen: stub('ComplianceTiers') }));
vi.mock('../screens/registration/AdminPendingApplicationsScreen', () => ({ AdminPendingApplicationsScreen: stub('PendingApps') }));
vi.mock('../screens/registration/AdminApplicationDetailScreen', () => ({ AdminApplicationDetailScreen: stub('ApplicationDetail') }));
vi.mock('../screens/registration/AdminApplicationRejectScreen', () => ({ AdminApplicationRejectScreen: stub('ApplicationReject') }));
// The flow root's toast host (animated) is not under test here; farmersFlow_screen.test.tsx covers it.
vi.mock('../components/TohfaToast', () => ({ TohfaToast: stub('Toast') }));

import { FarmersFlow } from '../screens/farmers/FarmersFlow';
import { makeCan } from '../permissions/can';
import { en } from '../i18n';

function textOf(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(textOf);
  return (node.children ?? []).flatMap(textOf);
}

async function mount(element: React.ReactElement): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(element);
  });
  return tree;
}

function emptyList() {
  return { items: [], firstPage: undefined, loadMore: vi.fn(), hasMore: false, isLoading: false, error: null, refresh: vi.fn(), isRefreshing: false };
}

beforeEach(() => {
  for (const h of Object.values(hooks)) h.mockReset();
  hooks.useFarmerList.mockReturnValue(emptyList());
  hooks.useApplicationList.mockReturnValue(emptyList());
});

describe('FarmersFlow: fail closed', () => {
  it.each([
    ['an empty grant list (permissions not loaded yet)', makeCan([])],
    ['a grant list without farmer.profile.view_all', makeCan(['farmer.rating.view', 'farmer.application.list_pending'])],
  ])('%s renders not-available and calls no hook', async (_label, can) => {
    const tree = await mount(<FarmersFlow can={can} onBack={vi.fn()} warehouseId="wh-1" />);
    const text = textOf(tree.toJSON()).join('\n');
    expect(text).toContain(en['farmersList.notAvailable.title']);
    expect(hooks.useFarmerList).not.toHaveBeenCalled();
    expect(hooks.useApplicationList).not.toHaveBeenCalled();
    expect(hooks.useFarmer).not.toHaveBeenCalled();
    expect(hooks.useApplication).not.toHaveBeenCalled();
  });

  it('with farmer.profile.view_all the live list is mounted (the server scopes the rows, BR-108a)', async () => {
    await mount(<FarmersFlow can={makeCan(['farmer.profile.view_all'])} onBack={vi.fn()} />);
    expect(hooks.useFarmerList).toHaveBeenCalled();
  });
});
