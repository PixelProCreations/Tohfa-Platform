/**
 * Farmer Admin shell, Home tab (screens/dashboard/FarmerAdminDashboardScreen.tsx):
 * the greeting, the four KPI cards, "Needs Your Attention", "Farmer Product
 * Listings" and "Recent Farmer Admin Activity".
 *
 * Contract (same as the Super Admin home, sa_home_dashboard.test.tsx):
 *   - the greeting shows the /auth/me name, never a placeholder person;
 *   - a card with an endpoint shows the server value; one page is never a total;
 *   - a card with no endpoint is ADMIN_NO_VALUE and still renders;
 *   - a read the role may not make is never fired;
 *   - no design fixture (names, crops, zone) renders as if it were real.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type * as ListingsModule from '../api/listings';

const h = vi.hoisted(() => {
  const stub = (name: string) => {
    const C = (_props: Record<string, unknown>) => null;
    C.displayName = name;
    return C;
  };
  return { stub, fetchMe: vi.fn(), alert: vi.fn(), listAdminListings: vi.fn() };
});

vi.mock('react-native', () => ({
  Alert: { alert: h.alert },
  ActivityIndicator: 'ActivityIndicator',
  BackHandler: { addEventListener: vi.fn(() => ({ remove: () => undefined })) },
  Modal: 'Modal',
  Platform: { OS: 'android', select: (o: Record<string, unknown>) => o['android'] ?? o['default'] },
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, absoluteFill: {}, hairlineWidth: 1 },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Line: 'Line', Path: 'Path', Rect: 'Rect' }));
vi.mock('@tohfa/mobile-ui', () => ({ ScreenStatusBar: 'ScreenStatusBar', SafeAreaView: 'SafeAreaView' }));
vi.mock('../../farmer/api/auth', () => ({ fetchMe: h.fetchMe }));
vi.mock('../api/listings', async (importOriginal) => ({
  ...(await importOriginal<typeof ListingsModule>()),
  listAdminListings: h.listAdminListings,
}));

vi.mock('../screens/farmers/FarmersFlow', () => ({ FarmersFlow: h.stub('FarmersFlow') }));
vi.mock('../screens/warehouse/notifications/NotificationsFlow', () => ({ NotificationsFlow: h.stub('NotificationsFlow') }));
vi.mock('../screens/more/AdminMoreMenuScreen', () => ({ AdminMoreMenuScreen: h.stub('AdminMoreMenuScreen') }));
vi.mock('../screens/warehouse/profile-settings', () => ({ ProfileFlow: h.stub('ProfileFlow') }));
vi.mock('../screens/produce', () => ({ ProduceControlFlow: h.stub('ProduceControlFlow') }));
vi.mock('../screens/audits/AuditManagementFlow', () => ({ AuditManagementFlow: h.stub('AuditManagementFlow') }));
vi.mock('../screens/pricing/PricingFlow', () => ({ PricingFlow: h.stub('PricingFlow') }));
vi.mock('../screens/inputs', () => ({ InputsPestManagementFlow: h.stub('InputsPestManagementFlow') }));

import { FarmerAdminDashboardScreen } from '../screens/dashboard/FarmerAdminDashboardScreen';
import { OverviewDashboardCard } from '../components/OverviewDashboardCard';
import { AdminErrorState } from '../screens/warehouse/shared/AsyncStates';
import {
  farmerInitial,
  farmerPendingText,
  groupListingsByFarmer,
  listingSummaryText,
} from '../screens/dashboard/superAdminHomeFigures';
import { ADMIN_NO_VALUE } from '../utils/noValue';
import { en, t } from '../i18n';

const GRANTS = ['listing.queue.view_pending', 'farmer.profile.view_all'];
const FIXTURES = ['Suresh', 'Ramesh', 'Kumar', 'Tomato —', 'Green Beans', 'Coonoor', 'Nilgiris', 'Listing approved'];

function textOf(node: unknown): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('\n');
  return textOf((node as { children?: unknown }).children);
}
const allText = (tree: renderer.ReactTestRenderer) => textOf(tree.toJSON());

function cards(tree: renderer.ReactTestRenderer): Record<string, { value: string; subtitle: string }> {
  const out: Record<string, { value: string; subtitle: string }> = {};
  for (const c of tree.root.findAllByType(OverviewDashboardCard)) {
    out[String(c.props.title)] = { value: String(c.props.value), subtitle: String(c.props.subtitle) };
  }
  return out;
}

async function flush() {
  for (let i = 0; i < 8; i += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

async function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(
      <QueryClientProvider client={client}>
        <FarmerAdminDashboardScreen onSignOut={() => undefined} />
      </QueryClientProvider>,
    );
  });
  await flush();
  return tree;
}

function signedIn(fullName: string, permissions: readonly string[] = GRANTS) {
  h.fetchMe.mockResolvedValue({ id: 'u1', fullName, roles: [{ code: 'FARMER_ADMIN' }], permissions });
}

function listingDto(id: string, farmerName: string | null, cropName = 'Carrot') {
  return {
    id,
    cropId: 'c1',
    cropName,
    grade: 'GRADE_1',
    quantityKg: '40',
    askingPricePerKg: '30.00',
    status: 'PENDING_APPROVAL',
    createdAt: '2026-11-20T04:00:00.000Z',
    farmerName,
  };
}

function queue(items: unknown[], hasMore = false) {
  h.listAdminListings.mockResolvedValue({ items, page: { nextCursor: hasMore ? 'n' : null, hasMore } });
}

beforeEach(() => {
  signedIn('Lakshmi Devi');
  queue([listingDto('l1', 'Anitha'), listingDto('l2', 'Babu', 'Beans'), listingDto('l3', 'Anitha', 'Leek')]);
});
afterEach(() => vi.clearAllMocks());

describe('Farmer Admin home: greeting', () => {
  it('shows the /auth/me name, never a placeholder person', async () => {
    const tree = await mount();
    const text = allText(tree);
    expect(text).toContain(t('homeDashboards.fa.greeting', { name: 'Lakshmi Devi' }));
    expect(text).not.toContain('Suresh');
  });

  it('shows the loading text before /auth/me answers and the dash when it fails', async () => {
    h.fetchMe.mockReturnValue(new Promise(() => undefined));
    let tree = await mount();
    expect(allText(tree)).toContain(t('homeDashboards.fa.greeting', { name: t('async.loading') }));
    h.fetchMe.mockRejectedValue(new Error('offline'));
    tree = await mount();
    expect(allText(tree)).toContain(t('homeDashboards.fa.greeting', { name: ADMIN_NO_VALUE }));
  });
});

describe('Farmer Admin home: KPI cards', () => {
  it('Pending listings is the exact queue count when the whole queue is loaded', async () => {
    const tree = await mount();
    expect(cards(tree)['Pending listings']?.value).toBe('3');
    const [params] = h.listAdminListings.mock.calls[0] as [{ status: string }];
    expect(params.status).toBe('PENDING_APPROVAL');
  });

  it('Pending listings is the dash when more pages exist: one page is not a total', async () => {
    queue([listingDto('l1', 'Anitha')], true);
    const tree = await mount();
    expect(cards(tree)['Pending listings']?.value).toBe(ADMIN_NO_VALUE);
  });

  it('without listing.queue.view_pending nothing is fetched and the card is the dash', async () => {
    signedIn('Lakshmi Devi', []);
    const tree = await mount();
    expect(h.listAdminListings).not.toHaveBeenCalled();
    expect(cards(tree)['Pending listings']?.value).toBe(ADMIN_NO_VALUE);
  });

  it('the three cards with no source, and every subtitle, are the dash; all four cards render', async () => {
    const tree = await mount();
    const all = cards(tree);
    expect(Object.keys(all)).toHaveLength(4);
    for (const title of ["Today's reviews", 'Pending audit support', 'Open disputes']) {
      expect(all[title]?.value).toBe(ADMIN_NO_VALUE);
    }
    for (const card of Object.values(all)) expect(card.subtitle).toBe(ADMIN_NO_VALUE);
  });
});

describe('Farmer Admin home: listings and attention come from the queue, never fixtures', () => {
  it('groups the loaded queue by farmer with exact counts', async () => {
    const tree = await mount();
    const text = allText(tree);
    expect(text).toContain(t('homeDashboards.fa.listings.summary', { pending: '3', farmers: '2' }));
    expect(text).toContain('Anitha');
    expect(text).toContain('Babu');
    expect(text).toContain(t('homeDashboards.fa.listings.farmerPending', { count: '2' }));
  });

  it('a partial queue dashes the counts but still lists the loaded rows', async () => {
    queue([listingDto('l1', 'Anitha')], true);
    const tree = await mount();
    const text = allText(tree);
    expect(text).toContain(t('homeDashboards.fa.listings.summary', { pending: ADMIN_NO_VALUE, farmers: ADMIN_NO_VALUE }));
    expect(text).toContain(t('homeDashboards.fa.listings.farmerPending', { count: ADMIN_NO_VALUE }));
    expect(text).toContain('Anitha');
  });

  it('a failed read shows the error state, never "no listings"', async () => {
    h.listAdminListings.mockRejectedValue(new Error('down'));
    const tree = await mount();
    expect(tree.root.findAllByType(AdminErrorState).length).toBeGreaterThan(0);
    expect(allText(tree)).not.toContain(t('homeDashboards.fa.listings.empty'));
  });

  it('an empty complete queue says so', async () => {
    queue([]);
    const tree = await mount();
    expect(allText(tree)).toContain(t('homeDashboards.fa.listings.empty'));
    expect(cards(tree)['Pending listings']?.value).toBe('0');
  });

  it('the listing attention card shows the newest real listing', async () => {
    const tree = await mount();
    const text = allText(tree);
    expect(text).toContain(t('homeDashboards.fa.attention.listingTitle', { crop: 'Carrot', grade: t('listingsAdmin.grade.GRADE_1') }));
    expect(text).toContain('Farmer: Anitha');
  });

  it('no design fixture renders (names, crops, zone, invented activity)', async () => {
    const tree = await mount();
    const text = allText(tree);
    for (const fake of FIXTURES) expect(text).not.toContain(fake);
  });

  it('helpers never invent a count or a name', () => {
    const rows = [
      { id: 'a', farmerName: 'Anitha' },
      { id: 'b', farmerName: null },
    ];
    expect(groupListingsByFarmer(rows).map((g) => g.farmer)).toEqual(['Anitha', ADMIN_NO_VALUE]);
    expect(listingSummaryText(rows, null)).toBe(
      t('homeDashboards.fa.listings.summary', { pending: ADMIN_NO_VALUE, farmers: ADMIN_NO_VALUE }),
    );
    expect(farmerPendingText(2, false)).toBe(t('homeDashboards.fa.listings.farmerPending', { count: ADMIN_NO_VALUE }));
    expect(farmerInitial(ADMIN_NO_VALUE)).toBe(ADMIN_NO_VALUE);
    expect(farmerInitial('anitha')).toBe('A');
  });
});

describe('Farmer Admin home: source guard', () => {
  const FILE = path.resolve(__dirname, '../screens/dashboard/FarmerAdminDashboardScreen.tsx');
  const src = fs.readFileSync(FILE, 'utf8');

  it('carries no fixture person, crop or zone, and no inline dash', () => {
    for (const fake of FIXTURES) expect(src).not.toContain(fake);
    expect(src).not.toMatch(/'—'|"—"|>[^<{]*—[^<{]*</);
  });

  it('never compares a role string', () => {
    expect(src).not.toMatch(/roleCode\s*===|=== 'FARMER_ADMIN'|user\?\.\s*roles/);
  });

  it('every homeDashboards key it uses has an English string', () => {
    const missing = [...src.matchAll(/'(homeDashboards\.[A-Za-z0-9_.]+)'/g)].map((m) => m[1]!).filter((k) => !(k in en));
    expect(missing).toEqual([]);
  });
});
