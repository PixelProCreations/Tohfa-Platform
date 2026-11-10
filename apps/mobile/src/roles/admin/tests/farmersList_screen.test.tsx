/**
 * Farmers list screen (Module 1, phase 2B), rendered with react-test-renderer
 * against mocked farmer hooks (the hooks themselves are covered by
 * api_farmers / api_farmerApplications / queryKeys_farmers). Pins: live rows
 * only (never fixtures), the loading / error / empty states, the hook params
 * every search and filter sends, the fail-closed permission gates, server-side
 * zone scoping (BR-108a), the Disabled label and cursor paging.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance, type ReactTestRendererJSON } from 'react-test-renderer';
import type { ApplicationRowView, FarmerRowView } from '../api/farmerTypes';

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

vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Line: 'Line',
  Path: 'Path',
  Rect: 'Rect',
}));

vi.mock('@tohfa/mobile-ui', () => ({ ScreenStatusBar: 'ScreenStatusBar', SafeAreaView: 'SafeAreaView' }));

const hooks = vi.hoisted(() => ({
  useFarmerList: vi.fn(),
  useApplicationList: vi.fn(),
}));
vi.mock('../api/farmerHooks', () => hooks);

import { AdminAllFarmersScreen } from '../screens/farmers/AdminAllFarmersScreen';
import { SEARCH_DEBOUNCE_MS } from '../screens/farmers/list/farmersListLogic';
import { makeCan, type Can } from '../permissions/can';
import { en } from '../i18n';

// ─── Data ────────────────────────────────────────────────────────────────────

function farmerRow(over: Partial<FarmerRowView> = {}): FarmerRowView {
  return {
    id: 'f-1',
    farmerCode: 'TOHFA-F-2026-0001',
    name: 'Arun Kumar',
    initials: 'AK',
    mobile: '9876500001',
    zoneId: 'z-1',
    zoneName: 'Zone One',
    status: 'active',
    accountStatus: 'ACTIVE',
    applicationStatus: 'APPROVED',
    kycStatus: 'VERIFIED',
    overallRating: 78,
    ratingTierCode: 'GOOD',
    ratingTierLabel: 'Good',
    landLocationCount: 1,
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
    village: 'Ketti',
    district: 'Nilgiris',
    farmingType: 'Organic',
    primaryCrops: ['Carrot'],
    statedAreaAcres: 2,
    locationCount: 1,
    boundaryCount: 1,
    documentCount: 3,
    aadhaarLast4: '1234',
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

interface ListOver<T> {
  items?: T[];
  hasMore?: boolean;
  isLoading?: boolean;
  error?: unknown;
}

function cursorList<T>(over: ListOver<T> = {}) {
  return {
    items: over.items ?? [],
    firstPage: undefined,
    loadMore: vi.fn(),
    hasMore: over.hasMore ?? false,
    isLoading: over.isLoading ?? false,
    error: over.error ?? null,
    refresh: vi.fn(),
    isRefreshing: false,
  };
}

const VIEW_ALL = 'farmer.profile.view_all';
const LIST_PENDING = 'farmer.application.list_pending';
const viewer = makeCan([VIEW_ALL]);
const reviewer = makeCan([VIEW_ALL, LIST_PENDING]);

// ─── Rendering helpers ───────────────────────────────────────────────────────

function textOf(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(textOf);
  return (node.children ?? []).flatMap(textOf);
}

function allText(tree: renderer.ReactTestRenderer): string {
  return textOf(tree.toJSON()).join('\n');
}

async function mount(element: React.ReactElement): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(element);
  });
  return tree;
}

/** A host node of the mocked react-native component `name` (the mock renders them as strings). */
function isHost(n: ReactTestInstance, name: string): boolean {
  return (n.type as unknown) === name;
}

function byTestId(tree: renderer.ReactTestRenderer, id: string): ReactTestInstance[] {
  return tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === id);
}

async function press(tree: renderer.ReactTestRenderer, id: string): Promise<void> {
  const [node] = byTestId(tree, id);
  expect(node, `no pressable with testID ${id}`).toBeDefined();
  await act(async () => {
    (node!.props.onPress as () => void)();
  });
}

function lastFarmerFilters(): Record<string, unknown> {
  const calls = hooks.useFarmerList.mock.calls;
  expect(calls.length).toBeGreaterThan(0);
  return calls[calls.length - 1]![1] as Record<string, unknown>;
}

function applicationListEnabled(): boolean[] {
  return hooks.useApplicationList.mock.calls.map((c) => (c[2] as { enabled?: boolean } | undefined)?.enabled === true);
}

beforeEach(() => {
  hooks.useFarmerList.mockReset();
  hooks.useApplicationList.mockReset();
  hooks.useFarmerList.mockReturnValue(cursorList<FarmerRowView>());
  hooks.useApplicationList.mockReturnValue(cursorList<ApplicationRowView>());
});

afterEach(() => {
  vi.useRealTimers();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('farmers list: live rows and async states', () => {
  it('renders the rows the hook returns', async () => {
    hooks.useFarmerList.mockReturnValue(
      cursorList({ items: [farmerRow(), farmerRow({ id: 'f-2', name: 'Bala Murugan', farmerCode: 'TOHFA-F-2026-0002' })] }),
    );
    const tree = await mount(<AdminAllFarmersScreen can={viewer} />);
    const text = allText(tree);
    expect(text).toContain('Arun Kumar');
    expect(text).toContain('Bala Murugan');
    expect(text).toContain('TOHFA-F-2026-0002 · Zone One');
    expect(text).toContain('78/100');
    expect(byTestId(tree, 'farmersList.farmerCard.f-2')).toHaveLength(1);
  });

  it('shows the shared loading state while the first page loads', async () => {
    hooks.useFarmerList.mockReturnValue(cursorList({ isLoading: true }));
    const tree = await mount(<AdminAllFarmersScreen can={viewer} />);
    expect(allText(tree)).toContain(en['async.loading']);
  });

  it('shows the shared error state with a Retry that refetches', async () => {
    const list = cursorList({ error: new Error('boom') });
    hooks.useFarmerList.mockReturnValue(list);
    const tree = await mount(<AdminAllFarmersScreen can={viewer} />);
    expect(allText(tree)).toContain(en['async.error.title']);
    const retry = tree.root
      .findAll((n) => isHost(n, 'TouchableOpacity'))
      .find((n) => n.findAll((c) => isHost(c, 'Text') && c.props.children === en['async.retry']).length > 0);
    expect(retry).toBeDefined();
    await act(async () => {
      (retry!.props.onPress as () => void)();
    });
    expect(list.refresh).toHaveBeenCalled();
  });

  it('shows the empty state for an empty result', async () => {
    const tree = await mount(<AdminAllFarmersScreen can={viewer} />);
    expect(allText(tree)).toContain(en['farmersList.empty.farmers']);
  });

  it('never renders a fixture or design sample row', async () => {
    const tree = await mount(<AdminAllFarmersScreen can={reviewer} />);
    const text = allText(tree);
    // The names of the former DEMO_ALL_FARMERS rows (removed in phase 3A) stay pinned here.
    const samples = ['Vijay Anand', 'Ramasamy S.', 'Kavitha M.', 'Selvi N.', 'Ramesh Kumar', 'Sathish Kumar', 'Nagaraj S', 'APP-2026', 'FR-00124'];
    for (const s of samples) expect(text).not.toContain(s);
  });

  it('pull to refresh calls the list refresh', async () => {
    const list = cursorList({ items: [farmerRow()] });
    hooks.useFarmerList.mockReturnValue(list);
    const tree = await mount(<AdminAllFarmersScreen can={viewer} />);
    const [scroll] = tree.root.findAll((n) => isHost(n, 'ScrollView'));
    const control = scroll?.props.refreshControl as React.ReactElement<{ onRefresh: () => void }> | undefined;
    expect(control).toBeDefined();
    await act(async () => {
      control!.props.onRefresh();
    });
    expect(list.refresh).toHaveBeenCalled();
  });

  it('pages on with Load more while the server says there is more, and hides it at the end', async () => {
    const list = cursorList({ items: [farmerRow()], hasMore: true });
    hooks.useFarmerList.mockReturnValue(list);
    const tree = await mount(<AdminAllFarmersScreen can={viewer} />);
    await press(tree, 'farmersList.loadMore');
    expect(list.loadMore).toHaveBeenCalledTimes(1);

    hooks.useFarmerList.mockReturnValue(cursorList({ items: [farmerRow()], hasMore: false }));
    const done = await mount(<AdminAllFarmersScreen can={viewer} />);
    expect(byTestId(done, 'farmersList.loadMore')).toHaveLength(0);
  });

  it('the four KPI cards show the placeholder, never a number', async () => {
    const tree = await mount(<AdminAllFarmersScreen can={viewer} />);
    const cards = tree.root.findAll((n) => typeof n.type === 'function' && n.props.title !== undefined && n.props.value !== undefined);
    expect(cards).toHaveLength(4);
    for (const c of cards) expect(c.props.value).toBe(en['farmersList.noValue']);
  });
});

describe('farmers list: search and filters reach the hook', () => {
  it('starts with no filter', async () => {
    await mount(<AdminAllFarmersScreen can={viewer} warehouseId="wh-1" />);
    const calls = hooks.useFarmerList.mock.calls;
    expect(calls[calls.length - 1]![0]).toBe('wh-1');
    expect(lastFarmerFilters()).toEqual({ q: undefined, status: undefined, zoneId: undefined, ratingTier: undefined });
  });

  it('the search box sends a trimmed q after the typing debounce', async () => {
    vi.useFakeTimers();
    const tree = await mount(<AdminAllFarmersScreen can={viewer} />);
    const [input] = byTestId(tree, 'farmersList.search');
    await act(async () => {
      (input!.props.onChangeText as (s: string) => void)('  arun ');
    });
    expect(lastFarmerFilters().q).toBeUndefined();
    await act(async () => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });
    expect(lastFarmerFilters().q).toBe('arun');
  });

  it('status and rating tier chips send the API values', async () => {
    const tree = await mount(<AdminAllFarmersScreen can={viewer} />);
    await press(tree, 'farmersList.filterButton');
    await press(tree, 'farmersList.chip.status.DISABLED');
    expect(lastFarmerFilters().status).toBe('DISABLED');
    await press(tree, 'farmersList.chip.tier.EXCELLENT');
    expect(lastFarmerFilters().ratingTier).toBe('EXCELLENT');
    await press(tree, 'farmersList.chip.status.ALL');
    expect(lastFarmerFilters().status).toBeUndefined();
  });

  it('zone chips are built from the loaded zones and send the zone id', async () => {
    hooks.useFarmerList.mockReturnValue(
      cursorList({
        items: [farmerRow({ id: '1', zoneId: 'z-a', zoneName: 'Alpha' }), farmerRow({ id: '2', zoneId: 'z-b', zoneName: 'Beta' })],
      }),
    );
    const tree = await mount(<AdminAllFarmersScreen can={viewer} />);
    await press(tree, 'farmersList.filterButton');
    expect(byTestId(tree, 'farmersList.chip.zone.z-a')).toHaveLength(1);
    await press(tree, 'farmersList.chip.zone.z-b');
    expect(lastFarmerFilters().zoneId).toBe('z-b');
  });

  it('the zone group is hidden when fewer than two zones are loaded (no static zone list)', async () => {
    hooks.useFarmerList.mockReturnValue(cursorList({ items: [farmerRow({ zoneId: 'z-a', zoneName: 'Alpha' })] }));
    const tree = await mount(<AdminAllFarmersScreen can={viewer} />);
    await press(tree, 'farmersList.filterButton');
    expect(tree.root.findAll((n) => typeof n.props.testID === 'string' && n.props.testID.startsWith('farmersList.chip.zone.'))).toHaveLength(0);
    for (const staticZone of ['Coonoor', 'Ooty', 'Kotagiri']) expect(allText(tree)).not.toContain(staticZone);
  });
});

describe('farmers list: zone scoping is the server\'s (BR-108a)', () => {
  it('BR-108a: farmers from several zones are all shown, unfiltered, whatever the warehouse id says', async () => {
    hooks.useFarmerList.mockReturnValue(
      cursorList({
        items: [
          farmerRow({ id: '1', name: 'Farmer In Coonoor', zoneId: 'z-c', zoneName: 'Coonoor' }),
          farmerRow({ id: '2', name: 'Farmer In Ooty', zoneId: 'z-o', zoneName: 'Ooty' }),
          farmerRow({ id: '3', name: 'Farmer In Kotagiri', zoneId: 'z-k', zoneName: 'Kotagiri' }),
        ],
      }),
    );
    const tree = await mount(<AdminAllFarmersScreen can={viewer} warehouseId="sub-coonoor-wh" />);
    const text = allText(tree);
    expect(text).toContain('Farmer In Coonoor');
    expect(text).toContain('Farmer In Ooty');
    expect(text).toContain('Farmer In Kotagiri');
    expect(lastFarmerFilters().zoneId).toBeUndefined();
  });
});

describe('farmers list: labels', () => {
  it('a disabled farmer shows Disabled, never Pending', async () => {
    hooks.useFarmerList.mockReturnValue(
      cursorList({ items: [farmerRow({ id: 'd-1', status: 'disabled', accountStatus: 'DISABLED' })] }),
    );
    const tree = await mount(<AdminAllFarmersScreen can={viewer} />);
    const [card] = byTestId(tree, 'farmersList.farmerCard.d-1');
    const cardText = card!.findAll((n) => isHost(n, 'Text')).flatMap((n) => n.children.filter((c) => typeof c === 'string'));
    expect(cardText).toContain('Disabled');
    expect(cardText).not.toContain('Pending');
  });

  it('tapping a card hands the host the real farmer id (legacy item) and the row', async () => {
    const onSelectFarmer = vi.fn();
    hooks.useFarmerList.mockReturnValue(cursorList({ items: [farmerRow({ id: 'uuid-9' })] }));
    const tree = await mount(<AdminAllFarmersScreen can={viewer} onSelectFarmer={onSelectFarmer} />);
    await press(tree, 'farmersList.farmerCard.uuid-9');
    expect(onSelectFarmer).toHaveBeenCalledTimes(1);
    expect(onSelectFarmer.mock.calls[0]![0].id).toBe('uuid-9');
    expect(onSelectFarmer.mock.calls[0]![1].id).toBe('uuid-9');
  });
});

describe('farmers list: access (fail closed)', () => {
  it('without farmer.profile.view_all: a not-available state and no API call', async () => {
    const tree = await mount(<AdminAllFarmersScreen can={makeCan([LIST_PENDING])} />);
    expect(allText(tree)).toContain(en['farmersList.notAvailable.title']);
    expect(hooks.useFarmerList).not.toHaveBeenCalled();
    expect(applicationListEnabled().some(Boolean)).toBe(false);
  });

  it('a missing `can` denies: not-available state, no API call', async () => {
    const tree = await mount(<AdminAllFarmersScreen />);
    expect(allText(tree)).toContain(en['farmersList.notAvailable.title']);
    expect(hooks.useFarmerList).not.toHaveBeenCalled();
    expect(applicationListEnabled().some(Boolean)).toBe(false);
  });

  it('a `can` that throws nothing but grants nothing also denies', async () => {
    const none: Can = () => false;
    const tree = await mount(<AdminAllFarmersScreen can={none} />);
    expect(allText(tree)).toContain(en['farmersList.notAvailable.title']);
    expect(hooks.useFarmerList).not.toHaveBeenCalled();
  });
});

describe('applications tab', () => {
  it('without list_pending: no tab toggle, and initialTab="applications" renders no application content', async () => {
    hooks.useApplicationList.mockReturnValue(cursorList({ items: [applicationRow()] }));
    const tree = await mount(<AdminAllFarmersScreen can={viewer} initialTab="applications" />);
    expect(byTestId(tree, 'farmersList.tab.applications')).toHaveLength(0);
    expect(byTestId(tree, 'farmersList.applicationCard.a-1')).toHaveLength(0);
    expect(allText(tree)).not.toContain('Meena Raj');
    expect(applicationListEnabled().some(Boolean)).toBe(false);
    // The farmers list is what renders instead.
    expect(allText(tree)).toContain(en['farmersList.empty.farmers']);
  });

  it('with list_pending: the tab shows the live applications and a tap opens the review', async () => {
    const onReviewApplication = vi.fn();
    hooks.useApplicationList.mockReturnValue(cursorList({ items: [applicationRow()] }));
    const tree = await mount(<AdminAllFarmersScreen can={reviewer} onReviewApplication={onReviewApplication} />);
    expect(byTestId(tree, 'farmersList.tab.applications')).toHaveLength(1);
    await press(tree, 'farmersList.tab.applications');
    expect(applicationListEnabled().some(Boolean)).toBe(true);
    const text = allText(tree);
    expect(text).toContain('Meena Raj');
    expect(text).toContain(en['farmersList.applications.status.SUBMITTED']);
    await press(tree, 'farmersList.applicationCard.a-1');
    expect(onReviewApplication).toHaveBeenCalledWith(expect.objectContaining({ id: 'a-1' }));
  });

  it('the Pending application KPI opens the applications tab only for a caller with list_pending', async () => {
    hooks.useApplicationList.mockReturnValue(cursorList({ items: [applicationRow()] }));
    const pendingCard = (tree: renderer.ReactTestRenderer) =>
      tree.root.find((n) => typeof n.type === 'function' && n.props.title === en['farmersList.kpi.pending'] && n.props.value !== undefined);

    const tree = await mount(<AdminAllFarmersScreen can={reviewer} />);
    await act(async () => {
      (pendingCard(tree).props.onPress as () => void)();
    });
    expect(allText(tree)).toContain('Meena Raj');

    const denied = await mount(<AdminAllFarmersScreen can={viewer} />);
    expect(pendingCard(denied).props.onPress).toBeUndefined();
  });

  it('shows the applications loading, error and empty states', async () => {
    hooks.useApplicationList.mockReturnValue(cursorList({ isLoading: true }));
    const loading = await mount(<AdminAllFarmersScreen can={reviewer} initialTab="applications" />);
    expect(allText(loading)).toContain(en['async.loading']);

    hooks.useApplicationList.mockReturnValue(cursorList({ error: new Error('x') }));
    const failed = await mount(<AdminAllFarmersScreen can={reviewer} initialTab="applications" />);
    expect(allText(failed)).toContain(en['async.error.title']);

    hooks.useApplicationList.mockReturnValue(cursorList());
    const empty = await mount(<AdminAllFarmersScreen can={reviewer} initialTab="applications" />);
    expect(allText(empty)).toContain(en['farmersList.empty.applications']);
  });

  it('pages applications on with Load more', async () => {
    const list = cursorList({ items: [applicationRow()], hasMore: true });
    hooks.useApplicationList.mockReturnValue(list);
    const tree = await mount(<AdminAllFarmersScreen can={reviewer} initialTab="applications" />);
    await press(tree, 'farmersList.loadMore');
    expect(list.loadMore).toHaveBeenCalledTimes(1);
  });
});
