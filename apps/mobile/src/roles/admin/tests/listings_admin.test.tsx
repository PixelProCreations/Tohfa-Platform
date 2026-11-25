/**
 * ListingsFlow (Tohfa "Produce list" / Listing Approval Queue), rendered with
 * react-test-renderer against mocked hooks (api/listingsHooks.ts). Pins:
 * live rows only (never the design's MOCK_LISTINGS), loading / error / empty,
 * paging on scroll, each action only behind its own rbac.json code, a missing
 * `can` denying everything, approve / reject / counter sent once and the
 * success toast shown only after the server answered, server errors through
 * adminErrorKey, the reject reason fields the spec requires, BR-29 routed-away
 * rows read-only, and a source guard over the new files.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import React from 'react';
import { act } from 'react-test-renderer';
import type { Money } from '@tohfa/shared-types';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  BackHandler: { addEventListener: vi.fn(() => ({ remove: () => undefined })) },
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Modal: 'Modal',
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj['ios'] ?? obj['default'] },
  Pressable: 'Pressable',
  RefreshControl: 'RefreshControl',
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, hairlineWidth: 1 },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Line: 'Line', Path: 'Path', Rect: 'Rect' }));
vi.mock('@tohfa/mobile-ui', () => ({ ScreenStatusBar: 'ScreenStatusBar', SafeAreaView: 'SafeAreaView', Icon: 'Icon' }));
vi.mock('../components/TohfaToast', () => ({
  TohfaToast: ({ toast }: { toast: { title: string; message: string } | null }) =>
    toast === null ? null : React.createElement('Text', { testID: 'toast' }, `${toast.title}|${toast.message}`),
}));

const hooks = vi.hoisted(() => ({
  useListingQueue: vi.fn(),
  useApproveListing: vi.fn(),
  useRejectListing: vi.fn(),
  useSendCounterOffer: vi.fn(),
}));
vi.mock('../api/listingsHooks', () => hooks);

import { ApiError } from '../../../shell/api/client';
import type { ListingQueueRow } from '../api/listings';
import { t } from '../i18n';
import { makeCan, type Can } from '../permissions/can';
import { ListingsFlow } from '../screens/listings/ListingsFlow';
import { allText, byTestId, cursorList, mount, press, typeInto } from './pricingCeiling_renderHelpers';

const WAREHOUSE = '3f1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a01';
const VIEW = 'listing.queue.view_pending';
const ALL: Can = makeCan([VIEW, 'listing.approve', 'listing.reject', 'listing.counter_offer.send']);

function row(over: Partial<ListingQueueRow> = {}): ListingQueueRow {
  return {
    id: 'L-live-1',
    cropName: 'Kohlrabi',
    quantityKg: '12.500',
    askingPrice: '41.50' as Money,
    ceilingPrice: '44.00' as Money,
    farmerName: 'Live Farmer',
    farmerCode: 'TF-LIVE-1',
    grade: 'GRADE_2',
    status: 'PENDING_APPROVAL',
    routedAway: false,
    ...over,
  };
}

interface WriteMock {
  run: ReturnType<typeof vi.fn>;
  isPending: boolean;
  error: unknown;
  finish: ReturnType<typeof vi.fn>;
}
let approve: WriteMock;
let reject: WriteMock;
let counter: WriteMock;

function write(): WriteMock {
  return { run: vi.fn(), isPending: false, error: null, finish: vi.fn() };
}

function queue(over: Parameters<typeof cursorList<ListingQueueRow>>[0] = {}) {
  hooks.useListingQueue.mockReturnValue(cursorList<ListingQueueRow>(over));
}

/** `arguments.length` keeps an explicit undefined (no can / no warehouse) from falling back to the defaults. */
function flow(...args: [can?: Can | undefined, warehouseId?: string | undefined, onBack?: () => void]) {
  const can = args.length >= 1 ? args[0] : ALL;
  const warehouseId = args.length >= 2 ? args[1] : WAREHOUSE;
  const onBack = args[2] ?? vi.fn();
  return mount(<ListingsFlow can={can as Can} onBack={onBack} warehouseId={warehouseId} />);
}

function queueEnabled(): boolean | undefined {
  const call = hooks.useListingQueue.mock.calls.at(-1);
  return (call?.[1] as { enabled?: boolean } | undefined)?.enabled;
}

beforeEach(() => {
  for (const fn of Object.values(hooks)) fn.mockReset();
  approve = write();
  reject = write();
  counter = write();
  hooks.useApproveListing.mockImplementation(() => approve);
  hooks.useRejectListing.mockImplementation(() => reject);
  hooks.useSendCounterOffer.mockImplementation(() => counter);
  queue({ items: [row()] });
});

describe('queue card: BR-07d ceiling awareness (display only)', () => {
  it('BR-07d: a row asking above its ceiling is marked, and the actions are untouched', async () => {
    queue({ items: [row({ askingPrice: '48.00' as Money, ceilingPrice: '44.00' as Money })] });
    const tree = await flow();
    expect(allText(tree)).toContain(t('listingsAdmin.card.aboveCeiling'));
    // Still approvable / counterable: BR-07 is the server's to enforce.
    expect(byTestId(tree, 'listingsAdmin.approve.L-live-1')[0]!.props.disabled).toBe(false);
    expect(byTestId(tree, 'listingsAdmin.counter.L-live-1')[0]!.props.disabled).toBe(false);
  });

  it('BR-07d: a row at or below its ceiling is not marked', async () => {
    queue({ items: [row({ askingPrice: '44.00' as Money, ceilingPrice: '44.00' as Money })] });
    const tree = await flow();
    expect(allText(tree)).not.toContain(t('listingsAdmin.card.aboveCeiling'));
  });

  it('BR-07d: no ceiling from the server claims nothing either way', async () => {
    queue({ items: [row({ ceilingPrice: null })] });
    const tree = await flow();
    const text = allText(tree);
    expect(text).not.toContain(t('listingsAdmin.card.aboveCeiling'));
    expect(text).toContain(t('listingsAdmin.card.ceiling', { price: t('listingsAdmin.noValue') }));
  });
});

describe('queue: live rows only', () => {
  it('renders the live row and none of the design fixtures', async () => {
    const tree = await flow();
    const text = allText(tree);
    expect(text).toContain('Kohlrabi');
    expect(text).toContain('Live Farmer');
    expect(text).toContain('TF-LIVE-1');
    expect(text).toContain('₹41.50');
    expect(text).toContain('₹44');
    for (const fixture of ['Vijay Anand', 'Kavitha M.', 'Ravi Kumar', 'Lakshmi R.', 'Carrots', 'Beetroot', 'TOHFA-F-00234', '₹40/kg']) {
      expect(text).not.toContain(fixture);
    }
    expect(text).toContain(t('listingsAdmin.title'));
  });

  it('asks for the pending queue with the warehouse for the cache key', async () => {
    await flow();
    const call = hooks.useListingQueue.mock.calls.at(-1)!;
    expect(call[0]).toBe(WAREHOUSE);
    expect(queueEnabled()).toBe(true);
  });

  it('shows the dash for values the API did not send', async () => {
    queue({ items: [row({ ceilingPrice: null, farmerName: null, farmerCode: null })] });
    const tree = await flow();
    expect(allText(tree)).toContain(t('listingsAdmin.noValue'));
  });

  it('loading, error (via adminErrorKey) and empty states', async () => {
    queue({ isLoading: true });
    let tree = await flow();
    expect(allText(tree)).toContain(t('listingsAdmin.state.loading'));

    queue({ error: new ApiError({ type: 'about:blank', title: 'x', status: 403, code: 'FORBIDDEN' as never }) });
    tree = await flow();
    expect(allText(tree)).toContain(t('admin.error.FORBIDDEN'));

    queue({ items: [] });
    tree = await flow();
    expect(allText(tree)).toContain(t('listingsAdmin.state.empty'));
  });

  it('pages: scrolling near the end loads more only when more exists', async () => {
    const list = cursorList<ListingQueueRow>({ items: [row()], hasMore: true });
    hooks.useListingQueue.mockReturnValue(list);
    const tree = await flow();
    const [scroll] = byTestId(tree, 'listingsAdmin.scroll');
    const event = { nativeEvent: { layoutMeasurement: { height: 600 }, contentOffset: { y: 500 }, contentSize: { height: 1150 } } };
    await act(async () => {
      (scroll!.props.onScroll as (e: unknown) => void)(event);
    });
    expect(list.loadMore).toHaveBeenCalledTimes(1);
  });

  it('grade tabs filter the loaded rows', async () => {
    queue({ items: [row({ id: 'a', cropName: 'Alpha', grade: 'GRADE_1' }), row({ id: 'b', cropName: 'Beta', grade: 'GRADE_3' })] });
    const tree = await flow();
    await press(tree, 'listingsAdmin.tab.GRADE_3');
    const text = allText(tree);
    expect(text).toContain('Beta');
    expect(text).not.toContain('Alpha');
  });
});

describe('access: one code per action, missing can denies', () => {
  it('without the queue code nothing is fetched and the not-allowed state shows', async () => {
    const tree = await flow(makeCan(['listing.approve']));
    expect(queueEnabled()).toBe(false);
    expect(allText(tree)).toContain(t('listingsAdmin.state.noAccess'));
  });

  it('a missing can denies everything', async () => {
    const tree = await flow(undefined);
    expect(queueEnabled()).toBe(false);
    expect(byTestId(tree, 'listingsAdmin.approve.L-live-1')).toHaveLength(0);
    expect(allText(tree)).toContain(t('listingsAdmin.state.noAccess'));
  });

  it.each([
    ['listing.approve', 'approve'],
    ['listing.reject', 'reject'],
    ['listing.counter_offer.send', 'counter'],
  ])('%s shows only the %s button', async (code, button) => {
    const tree = await flow(makeCan([VIEW, code]));
    for (const b of ['approve', 'reject', 'counter']) {
      expect(byTestId(tree, `listingsAdmin.${b}.L-live-1`).length > 0, b).toBe(b === button);
    }
  });

  it('BR-29: a routed-away row is read-only', async () => {
    queue({ items: [row({ routedAway: true })] });
    const tree = await flow();
    for (const b of ['approve', 'reject', 'counter']) expect(byTestId(tree, `listingsAdmin.${b}.L-live-1`)).toHaveLength(0);
  });
});

describe('approve', () => {
  it('sends once with the destination warehouse; the toast waits for the server', async () => {
    const tree = await flow();
    await press(tree, 'listingsAdmin.approve.L-live-1');
    expect(approve.run).toHaveBeenCalledTimes(1);
    expect(approve.run.mock.calls[0]![0]).toBe('L-live-1');
    expect(approve.run.mock.calls[0]![1]).toEqual({ warehouseId: WAREHOUSE });
    expect(byTestId(tree, 'toast')).toHaveLength(0);
    await act(async () => {
      (approve.run.mock.calls[0]![2] as (r: unknown) => void)({});
    });
    expect(allText(tree)).toContain(t('listingsAdmin.toast.approved.title'));
  });

  it('without a destination warehouse the button is disabled and nothing is sent', async () => {
    const tree = await flow(ALL, undefined);
    const [btn] = byTestId(tree, 'listingsAdmin.approve.L-live-1');
    expect(btn!.props.disabled).toBe(true);
    await press(tree, 'listingsAdmin.approve.L-live-1');
    expect(approve.run).not.toHaveBeenCalled();
  });

  it('BR-29: a server refusal shows the admin error and no toast', async () => {
    approve.error = new ApiError({ type: 'about:blank', title: 'x', status: 403, code: 'SELF_APPROVAL_FORBIDDEN' as never });
    const tree = await flow();
    expect(allText(tree)).toContain(t('admin.error.SELF_APPROVAL_FORBIDDEN'));
    expect(byTestId(tree, 'toast')).toHaveLength(0);
  });
});

describe('reject', () => {
  it('requires a reason code and a reason before anything is sent', async () => {
    const tree = await flow();
    await press(tree, 'listingsAdmin.reject.L-live-1');
    await press(tree, 'listingsAdmin.rejectSheet.confirm');
    expect(reject.run).not.toHaveBeenCalled();
    expect(allText(tree)).toContain(t('listingsAdmin.reject.codeRequired'));
    expect(allText(tree)).toContain(t('listingsAdmin.reject.reasonRequired', { min: 5 }));
  });

  it('sends once with reasonCode and reason; toast only after the server answered', async () => {
    const tree = await flow();
    await press(tree, 'listingsAdmin.reject.L-live-1');
    await press(tree, 'listingsAdmin.rejectSheet.code.NO_DEMAND');
    await typeInto(tree, 'listingsAdmin.rejectSheet.reason', 'No buyers this week');
    await press(tree, 'listingsAdmin.rejectSheet.confirm');
    expect(reject.run).toHaveBeenCalledTimes(1);
    expect(reject.run.mock.calls[0]![0]).toBe('L-live-1');
    expect(reject.run.mock.calls[0]![1]).toEqual({ reasonCode: 'NO_DEMAND', reason: 'No buyers this week' });
    expect(byTestId(tree, 'toast')).toHaveLength(0);
    await act(async () => {
      (reject.run.mock.calls[0]![2] as (r: unknown) => void)({});
    });
    expect(allText(tree)).toContain(t('listingsAdmin.toast.rejected.title'));
  });

  it('shows the server error in the sheet', async () => {
    reject.error = new ApiError({ type: 'about:blank', title: 'x', status: 409, code: 'LISTING_NOT_PENDING' as never });
    const tree = await flow();
    await press(tree, 'listingsAdmin.reject.L-live-1');
    expect(allText(tree)).toContain(t('admin.error.LISTING_NOT_PENDING'));
  });
});

describe('counter', () => {
  it('BR-10/BR-11: sends once with Money price and quantity; toast only after the server answered', async () => {
    const tree = await flow();
    await press(tree, 'listingsAdmin.counter.L-live-1');
    await typeInto(tree, 'listingsAdmin.counterSheet.price', '33.5');
    await typeInto(tree, 'listingsAdmin.counterSheet.quantity', '75');
    await press(tree, 'listingsAdmin.counterSheet.confirm');
    expect(counter.run).toHaveBeenCalledTimes(1);
    expect(counter.run.mock.calls[0]![1]).toEqual({ pricePerKg: '33.50', quantityKg: '75' });
    expect(byTestId(tree, 'toast')).toHaveLength(0);
    await act(async () => {
      (counter.run.mock.calls[0]![2] as (r: unknown) => void)({});
    });
    expect(allText(tree)).toContain(t('listingsAdmin.toast.counter.title'));
  });

  it('an invalid price sends nothing', async () => {
    const tree = await flow();
    await press(tree, 'listingsAdmin.counter.L-live-1');
    await typeInto(tree, 'listingsAdmin.counterSheet.price', '1.234');
    await typeInto(tree, 'listingsAdmin.counterSheet.quantity', '75');
    await press(tree, 'listingsAdmin.counterSheet.confirm');
    expect(counter.run).not.toHaveBeenCalled();
    expect(allText(tree)).toContain(t('listingsAdmin.counter.priceInvalid'));
  });

  it('BR-07d: the counter sheet shows the fair price ceiling the server sent for the listing', async () => {
    const tree = await flow();
    await press(tree, 'listingsAdmin.counter.L-live-1');
    expect(allText(tree)).toContain(t('listingsAdmin.counter.ceiling', { price: '₹44' }));
  });

  it('BR-07d: a listing with no ceiling from the server shows the dash, never a looked-up guess', async () => {
    queue({ items: [row({ ceilingPrice: null })] });
    const tree = await flow();
    await press(tree, 'listingsAdmin.counter.L-live-1');
    expect(allText(tree)).toContain(t('listingsAdmin.counter.ceiling', { price: t('listingsAdmin.noValue') }));
  });

  it('BR-07d: showing the ceiling does not gate the sheet — a price above it is still sent (the server refuses)', async () => {
    const tree = await flow();
    await press(tree, 'listingsAdmin.counter.L-live-1');
    // 50.00 is above the row's 44.00 ceiling.
    await typeInto(tree, 'listingsAdmin.counterSheet.price', '50');
    await typeInto(tree, 'listingsAdmin.counterSheet.quantity', '75');
    await press(tree, 'listingsAdmin.counterSheet.confirm');
    expect(counter.run).toHaveBeenCalledTimes(1);
    expect(counter.run.mock.calls[0]![1]).toEqual({ pricePerKg: '50.00', quantityKg: '75' });
  });

  it("BR-07d: the server's 422 PRICE_ABOVE_CEILING is shown in the sheet", async () => {
    counter.error = new ApiError({ type: 'about:blank', title: 'x', status: 422, code: 'PRICE_ABOVE_CEILING' as never });
    const tree = await flow();
    await press(tree, 'listingsAdmin.counter.L-live-1');
    expect(allText(tree)).toContain(t('admin.error.PRICE_ABOVE_CEILING'));
  });

  it('BR-11: rounds exhausted shows the admin error', async () => {
    counter.error = new ApiError({ type: 'about:blank', title: 'x', status: 409, code: 'COUNTER_LIMIT_REACHED' as never });
    const tree = await flow();
    await press(tree, 'listingsAdmin.counter.L-live-1');
    expect(allText(tree)).toContain(t('admin.error.COUNTER_LIMIT_REACHED'));
  });
});

describe('back', () => {
  it('the back button leaves the flow', async () => {
    const onBack = vi.fn();
    const tree = await flow(ALL, WAREHOUSE, onBack);
    await press(tree, 'listingsAdmin.back');
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

// ─── Source guard ────────────────────────────────────────────────────────────

const ADMIN = path.join(__dirname, '..');
const DIR = path.join(ADMIN, 'screens/listings');
const read = (abs: string) => fs.readFileSync(abs, 'utf8');
const code = (source: string) =>
  source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s\/\/.*$/gm, '');
const screenFiles = fs.existsSync(DIR)
  ? fs
      .readdirSync(DIR)
      .filter((n) => /\.tsx?$/.test(n))
      .map((n) => path.join(DIR, n))
  : [];
const FILES = [...screenFiles, path.join(ADMIN, 'api/listings.ts'), path.join(ADMIN, 'api/listingsHooks.ts')];
const rel = (f: string) => path.relative(ADMIN, f);

describe('source guard', () => {
  it('the folder exists with a ListingsFlow, every file <= 800 lines', () => {
    expect(fs.existsSync(path.join(DIR, 'ListingsFlow.tsx'))).toBe(true);
    for (const f of FILES) expect(read(f).split('\n').length, rel(f)).toBeLessThanOrEqual(800);
  });

  it.each(FILES.map(rel))('%s: no role strings, no fail-open can, no fixtures, no float money', (file) => {
    const src = code(read(path.join(ADMIN, file)));
    expect(src).not.toMatch(/(SUPER_ADMIN|TOHFA_ADMIN|FARMER_ADMIN|MAIN_WH_ADMIN|SUB_WH_ADMIN)/);
    expect(src).not.toMatch(/\brole\s*(===|!==)/);
    expect(src).not.toMatch(/can\s*\?\s*can\(/);
    expect(src).not.toMatch(/=>\s*true\b/);
    expect(src).not.toMatch(/as any/);
    expect(src).not.toMatch(/MOCK_LISTINGS|Vijay Anand|TOHFA-F-/);
    expect(src).not.toMatch(/parseFloat|toFixed\(|Number\(/);
  });

  it.each(screenFiles.map(rel))('%s: admin theme only (no hex, rgba, numeric fontSize, fontFamily)', (file) => {
    const src = code(read(path.join(ADMIN, file)));
    expect(src).not.toMatch(/(['"`])#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3,4})\1/);
    expect(src).not.toMatch(/\brgba?\s*\(/);
    expect(src).not.toMatch(/fontSize\s*:\s*[0-9]/);
    expect(src).not.toMatch(/fontFamily\s*:/);
  });

  it("uses mobile-ui's SafeAreaView / ScreenStatusBar, never react-native's", () => {
    for (const f of screenFiles) {
      expect(code(read(f)), rel(f)).not.toMatch(/import \{[^}]*\b(SafeAreaView|StatusBar)\b[^}]*\} from 'react-native'/);
    }
    expect(screenFiles.some((f) => /ScreenStatusBar/.test(read(f)))).toBe(true);
  });

  it('no raw English text between JSX tags', () => {
    for (const f of screenFiles.filter((x) => x.endsWith('.tsx'))) {
      expect(code(read(f)), rel(f)).not.toMatch(/>\s*[A-Z][a-z]+(?: [A-Za-z]+)*\s*</);
    }
  });

  it('every t() key used exists and is listingsAdmin.* (or admin.error.*)', () => {
    const catalogue = t as unknown;
    expect(catalogue).toBeTypeOf('function');
    const en = JSON.parse(read(path.join(ADMIN, 'i18n/listingsAdmin.en.json'))) as Record<string, string>;
    const used = new Set<string>();
    for (const f of screenFiles) for (const m of code(read(f)).matchAll(/\bt\(\s*'([A-Za-z0-9_.]+)'/g)) used.add(m[1]!);
    expect(used.size).toBeGreaterThan(15);
    for (const key of used) {
      expect(key, key).toMatch(/^listingsAdmin\./);
      expect(en[key], key).toBeTruthy();
    }
    for (const key of Object.keys(en)) expect(key).toMatch(/^listingsAdmin\./);
    expect(JSON.parse(read(path.join(ADMIN, 'i18n/listingsAdmin.ta.json')))).toEqual({});
  });
});
