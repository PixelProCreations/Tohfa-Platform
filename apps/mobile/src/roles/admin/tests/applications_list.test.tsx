/**
 * Pending Applications (AdminPendingApplicationsScreen) over the mocked Phase 1
 * list hook: gated by farmer.application.list_pending (no request without it),
 * drafts and decided applications never listed, no client-side zone or role
 * filtering (scoping is the server's job), and none of the demo fixtures.
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

import { ApiError } from '../../../shell/api/client';
import type { ApplicationRowView } from '../api/farmerTypes';
import { t } from '../i18n';
import { AdminPendingApplicationsScreen } from '../screens/registration/AdminPendingApplicationsScreen';

const allow = (codes: readonly string[]) => (c: string) => codes.includes(c);
const LIST = allow(['farmer.application.list_pending']);

function row(over: Partial<ApplicationRowView> = {}): ApplicationRowView {
  return {
    id: 'a-1',
    name: 'Revathi Selvam',
    initials: 'RS',
    mobile: '9876512345',
    status: 'SUBMITTED',
    isDraft: false,
    village: 'Ketti',
    district: 'Nilgiris',
    farmingType: null,
    primaryCrops: [],
    statedAreaAcres: null,
    locationCount: 1,
    boundaryCount: 0,
    documentCount: 1,
    aadhaarLast4: '4821',
    submittedAt: '2026-11-02T05:00:00Z',
    createdAt: '2026-11-01T05:00:00Z',
    zoneId: null,
    slaDueAt: null,
    documentsComplete: null,
    applicationCode: null,
    kycStatus: null,
    ...over,
  };
}

interface ListState {
  items: ApplicationRowView[];
  isLoading: boolean;
  error: unknown;
  hasMore: boolean;
  loadMore: ReturnType<typeof vi.fn>;
  refresh: ReturnType<typeof vi.fn>;
}
let list: ListState;

beforeEach(() => {
  vi.clearAllMocks();
  list = { items: [], isLoading: false, error: null, hasMore: false, loadMore: vi.fn(), refresh: vi.fn() };
  hooks.useApplicationList.mockImplementation(() => ({ ...list, firstPage: undefined, isRefreshing: false }));
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

function mount(props: Partial<React.ComponentProps<typeof AdminPendingApplicationsScreen>> = {}) {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<AdminPendingApplicationsScreen can={LIST} onBack={vi.fn()} onSelectApplication={vi.fn()} {...props} />);
  });
  return tree;
}

const DEMO_NAMES = ['Muthukumar', 'Lakshmi R.', 'Velu Kannan', 'Pushpa T.', 'All (9)', 'Docs Complete (6)', 'Awaiting KYC (3)', 'scroll to review all 9'];

describe('AdminPendingApplicationsScreen', () => {
  it('without `can` it is hidden and requests nothing', () => {
    const tree = mount({ can: undefined });
    expect(allText(tree)).toContain(t('farmerApps.list.denied'));
    const options = hooks.useApplicationList.mock.calls.map((c) => c[2] as { enabled?: boolean });
    expect(options.length).toBeGreaterThan(0);
    expect(options.every((o) => o.enabled === false)).toBe(true);
  });

  it('without farmer.application.list_pending it is hidden and requests nothing', () => {
    const tree = mount({ can: allow(['farmer.application.view', 'farmer.application.approve', 'farmer.application.reject']) });
    expect(allText(tree)).toContain(t('farmerApps.list.denied'));
    expect(hooks.useApplicationList.mock.calls.every((c) => (c[2] as { enabled?: boolean }).enabled === false)).toBe(true);
  });

  it('renders the API rows, never the demo fixtures', () => {
    list.items = [row({ id: 'p1', name: 'Revathi Selvam' }), row({ id: 'p2', name: 'Arul Doss', status: 'DOCS_REVIEW' })];
    const tree = mount();
    const text = allText(tree);
    expect(text).toContain('Revathi Selvam');
    expect(text).toContain('Arul Doss');
    for (const demo of DEMO_NAMES) expect(text, `rendered demo "${demo}"`).not.toContain(demo);
  });

  it('drafts and decided applications are never listed as pending', () => {
    list.items = [
      row({ id: 'd1', name: 'Draft Person', status: 'DRAFT', isDraft: true }),
      row({ id: 'd2', name: 'Half Draft', status: 'SUBMITTED', isDraft: true }),
      row({ id: 'ok', name: 'Real Applicant' }),
      row({ id: 'ap', name: 'Approved Person', status: 'APPROVED' }),
      row({ id: 'rj', name: 'Rejected Person', status: 'REJECTED' }),
    ];
    const text = allText(mount());
    expect(text).toContain('Real Applicant');
    for (const hidden of ['Draft Person', 'Half Draft', 'Approved Person', 'Rejected Person']) expect(text).not.toContain(hidden);
  });

  it('no client-side zone or role filtering: every pending row from the server is shown, and no zone is sent', () => {
    list.items = [row({ id: '1', name: 'Zone A Farmer', zoneId: 'z-a' }), row({ id: '2', name: 'Zone B Farmer', zoneId: 'z-b' }), row({ id: '3', name: 'No Zone Farmer' })];
    const tree = mount();
    const text = allText(tree);
    expect(text).toContain('Zone A Farmer');
    expect(text).toContain('Zone B Farmer');
    expect(text).toContain('No Zone Farmer');
    for (const call of hooks.useApplicationList.mock.calls) {
      expect((call[1] as Record<string, unknown>)['zoneId']).toBeUndefined();
    }
    for (const zone of ['Ooty', 'Kotagiri', 'Coonoor']) expect(text).not.toContain(zone);
  });

  it('a status chip asks the server for that status', () => {
    const tree = mount();
    act(() => {
      (byTestId(tree, 'farmerApps.filter.DOCS_REVIEW')[0]!.props['onPress'] as () => void)();
    });
    const last = hooks.useApplicationList.mock.calls.at(-1)!;
    expect(last[1]).toEqual({ status: 'DOCS_REVIEW' });
    expect((last[2] as { enabled?: boolean }).enabled).toBe(true);
  });

  it('tapping a card hands the host an item built from that row', () => {
    const onSelectApplication = vi.fn();
    list.items = [row({ id: 'p9', name: 'Revathi Selvam' })];
    const tree = mount({ onSelectApplication });
    act(() => {
      (byTestId(tree, 'farmerApps.card.p9')[0]!.props['onPress'] as () => void)();
    });
    expect(onSelectApplication).toHaveBeenCalledTimes(1);
    expect(onSelectApplication.mock.calls[0]![0]).toMatchObject({ id: 'p9', name: 'Revathi Selvam' });
  });

  it('BR-33b: no full Aadhaar number is rendered on the list', () => {
    list.items = [row()];
    expect(allText(mount())).not.toMatch(/\d{12}/);
  });

  it('shows loading, the mapped error with Retry, empty, and Load more', () => {
    list.isLoading = true;
    const tree = mount();
    expect(allText(tree)).toContain(t('async.loading'));

    list.isLoading = false;
    list.error = new ApiError({ type: 'about:blank', title: 'x', status: 403, code: 'FORBIDDEN' } as Problem);
    act(() => tree.update(<AdminPendingApplicationsScreen can={LIST} onBack={vi.fn()} onSelectApplication={vi.fn()} />));
    expect(allText(tree)).toContain(t('admin.error.FORBIDDEN'));
    expect(allText(tree)).toContain(t('async.retry'));

    list.error = null;
    act(() => tree.update(<AdminPendingApplicationsScreen can={LIST} onBack={vi.fn()} onSelectApplication={vi.fn()} />));
    expect(allText(tree)).toContain(t('farmerApps.list.empty'));

    list.items = [row()];
    list.hasMore = true;
    act(() => tree.update(<AdminPendingApplicationsScreen can={LIST} onBack={vi.fn()} onSelectApplication={vi.fn()} />));
    act(() => {
      (byTestId(tree, 'farmerApps.loadMore')[0]!.props['onPress'] as () => void)();
    });
    expect(list.loadMore).toHaveBeenCalledTimes(1);
  });
});
