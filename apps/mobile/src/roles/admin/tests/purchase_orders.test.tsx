/**
 * PurchaseOrdersFlow (screens/purchase-orders/) rendered against mocked
 * purchaseOrdersHooks: live rows only (never the design's fixture POs), the
 * loading / error / empty states, scroll paging, the design's filter page
 * mapped onto the API's params (chips the API cannot serve stay, marked not
 * available), search as `q`, the detail from GET /admin/purchase-orders/{id},
 * the history view, and access by `purchase.order.view` only (a missing can
 * denies, with no request).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { act } from 'react-test-renderer';
import type { Can } from '../permissions/can';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  BackHandler: { addEventListener: () => ({ remove: () => undefined }) },
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
  usePurchaseOrderList: vi.fn(),
  usePurchaseOrderDetail: vi.fn(),
}));
vi.mock('../api/purchaseOrdersHooks', () => hooks);

import { PurchaseOrdersFlow } from '../screens/purchase-orders';
import { ConfirmPurchaseTermsScreen } from '../screens/purchase-orders/ConfirmPurchaseTermsScreen';
import type { PurchaseOrderDetailRowDto, PurchaseOrderListItemDto } from '../api/purchaseOrders';
import { makeCan } from '../permissions/can';
import { en } from '../i18n';
import { allText, byTestId, cursorList, mount, press, textIn, typeInto } from './pricingCeiling_renderHelpers';

const VIEW = 'purchase.order.view';
const viewer = makeCan([VIEW]);

/** Names, ids and amounts from the design branch's SAMPLE_ORDERS / SAMPLE_HISTORY; none may render. */
const DESIGN_SAMPLES = [
  'PO-2026-00124',
  'PO-2026-00119',
  'PO-2026-00108',
  'PO-2026-00097',
  'LST-00452',
  'Ramesh Kumar',
  'Selvi',
  'Carrot',
  'Beans',
  'Tomato',
  'FR-00241',
  'Coonoor',
  '₹2,250',
  '₹1,350',
  '₹2,500',
  '₹45/kg',
  '₹50/kg',
  '28 Sep',
];

function row(over: Partial<PurchaseOrderListItemDto> = {}): PurchaseOrderListItemDto {
  return {
    id: 'po-uuid-1',
    poNumber: 'PO-LIVE-000777',
    farmerId: 'f-uuid',
    listingId: 'l-uuid-1',
    warehouseId: 'wh-1',
    cropId: 'c-uuid',
    grade: 'GRADE_1',
    quantityKg: '12.345' as PurchaseOrderListItemDto['quantityKg'],
    pricePerKg: '41.50' as PurchaseOrderListItemDto['pricePerKg'],
    totalAmount: '512.32' as PurchaseOrderListItemDto['totalAmount'],
    status: 'ISSUED',
    expectedDeliveryDate: null,
    issuedAt: '2026-11-02T04:30:00.000Z',
    farmerName: 'Live Farmer Arun',
    cropName: 'Okra Live',
    ...over,
  };
}

function detail(over: Partial<PurchaseOrderDetailRowDto> = {}): PurchaseOrderDetailRowDto {
  return { ...row(), tohfaFarmerId: 'TF-LIVE-9', goodsReceipts: [], ...over } as PurchaseOrderDetailRowDto;
}

function detailQuery(over: { data?: PurchaseOrderDetailRowDto; isLoading?: boolean; error?: unknown } = {}) {
  return { data: over.data, isLoading: over.isLoading ?? false, error: over.error ?? null, refresh: vi.fn() };
}

function lastListCall(): unknown[] {
  const calls = hooks.usePurchaseOrderList.mock.calls;
  expect(calls.length).toBeGreaterThan(0);
  return calls[calls.length - 1]!;
}

const LIVE = [
  row(),
  row({ id: 'po-uuid-2', poNumber: 'PO-LIVE-000778', status: 'RECEIVED', farmerName: 'Live Farmer Bala', cropName: 'Brinjal Live', totalAmount: '3175.00' as never, quantityKg: '50.000' as never }),
];

beforeEach(() => {
  for (const h of Object.values(hooks)) h.mockReset();
  hooks.usePurchaseOrderList.mockReturnValue(cursorList<PurchaseOrderListItemDto>());
  hooks.usePurchaseOrderDetail.mockReturnValue(detailQuery());
});

afterEach(() => {
  vi.useRealTimers();
});

describe('access: purchase.order.view, fail closed', () => {
  it('a missing can denies: not-available, no request', async () => {
    const tree = await mount(<PurchaseOrdersFlow can={undefined as unknown as Can} onBack={() => undefined} />);
    expect(allText(tree)).toContain(en['purchaseOrders.notAvailable.title']);
    expect(hooks.usePurchaseOrderList).not.toHaveBeenCalled();
  });

  it('a can without the code denies, even with other purchase codes', async () => {
    const tree = await mount(<PurchaseOrdersFlow can={makeCan(['purchase.order.create'])} onBack={() => undefined} />);
    expect(allText(tree)).toContain(en['purchaseOrders.notAvailable.title']);
    expect(hooks.usePurchaseOrderList).not.toHaveBeenCalled();
  });

  it('with the code: the list hook is asked for this warehouse, no filters, enabled', async () => {
    await mount(<PurchaseOrdersFlow can={viewer} onBack={() => undefined} warehouseId="wh-1" />);
    const [warehouseId, filters, options] = lastListCall();
    expect(warehouseId).toBe('wh-1');
    expect(filters).toEqual({});
    expect(options).toEqual({ enabled: true });
  });
});

describe('list: live rows and states', () => {
  it('renders each live row (PO number, status, farmer · produce, quantity, total) and no design fixture', async () => {
    hooks.usePurchaseOrderList.mockReturnValue(cursorList({ items: LIVE }));
    const tree = await mount(<PurchaseOrdersFlow can={viewer} onBack={() => undefined} />);
    const card = textIn(byTestId(tree, 'purchaseOrders.card.po-uuid-1')[0]!);
    expect(card).toContain('PO-LIVE-000777');
    expect(card).toContain(en['purchaseOrders.status.ISSUED']);
    expect(card).toContain(`Live Farmer Arun · Okra Live, ${en['purchaseOrders.grade.GRADE_1']}`);
    expect(card).toContain('12.345 kg');
    expect(card).toContain('₹512.32');
    const second = textIn(byTestId(tree, 'purchaseOrders.card.po-uuid-2')[0]!);
    expect(second).toContain(en['purchaseOrders.status.RECEIVED']);
    expect(second).toContain('₹3,175');
    expect(second).not.toContain('₹3,175.00');
    expect(second).toContain('50 kg');
    const text = allText(tree);
    for (const sample of DESIGN_SAMPLES) expect(text, sample).not.toContain(sample);
  });

  it('loading, error (with retry), empty', async () => {
    hooks.usePurchaseOrderList.mockReturnValue(cursorList({ isLoading: true }));
    let tree = await mount(<PurchaseOrdersFlow can={viewer} onBack={() => undefined} />);
    expect(allText(tree)).toContain(en['async.loading']);

    const errored = cursorList({ error: new Error('boom') });
    hooks.usePurchaseOrderList.mockReturnValue(errored);
    tree = await mount(<PurchaseOrdersFlow can={viewer} onBack={() => undefined} />);
    expect(allText(tree)).toContain(en['async.error.title']);
    const retry = tree.root.findAll((n) => n.props.accessibilityLabel === en['async.retry'] || (n.type as unknown) === 'TouchableOpacity' && textIn(n).includes(en['async.retry']));
    expect(retry.length).toBeGreaterThan(0);
    await act(async () => {
      (retry[0]!.props.onPress as () => void)();
    });
    expect(errored.refresh).toHaveBeenCalled();

    hooks.usePurchaseOrderList.mockReturnValue(cursorList());
    tree = await mount(<PurchaseOrdersFlow can={viewer} onBack={() => undefined} />);
    expect(allText(tree)).toContain(en['purchaseOrders.empty']);
  });

  it('paging: scrolling near the end loads more when the server has more; not otherwise', async () => {
    const more = cursorList({ items: LIVE, hasMore: true });
    hooks.usePurchaseOrderList.mockReturnValue(more);
    const tree = await mount(<PurchaseOrdersFlow can={viewer} onBack={() => undefined} />);
    const [scroll] = byTestId(tree, 'purchaseOrders.scroll');
    const event = (y: number) => ({ nativeEvent: { layoutMeasurement: { height: 600 }, contentOffset: { y }, contentSize: { height: 2000 } } });
    await act(async () => {
      (scroll!.props.onScroll as (e: unknown) => void)(event(100));
    });
    expect(more.loadMore).not.toHaveBeenCalled();
    await act(async () => {
      (scroll!.props.onScroll as (e: unknown) => void)(event(1390));
    });
    expect(more.loadMore).toHaveBeenCalledTimes(1);

    const done = cursorList({ items: LIVE, hasMore: false });
    hooks.usePurchaseOrderList.mockReturnValue(done);
    const tree2 = await mount(<PurchaseOrdersFlow can={viewer} onBack={() => undefined} />);
    await act(async () => {
      (byTestId(tree2, 'purchaseOrders.scroll')[0]!.props.onScroll as (e: unknown) => void)(event(1390));
    });
    expect(done.loadMore).not.toHaveBeenCalled();
  });

  it('search goes to the API as q (debounced)', async () => {
    vi.useFakeTimers();
    const tree = await mount(<PurchaseOrdersFlow can={viewer} onBack={() => undefined} />);
    await typeInto(tree, 'purchaseOrders.search', '  arun ');
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    expect(lastListCall()[1]).toEqual({ q: 'arun' });
  });
});

describe('filter page: the design chips on the API params', () => {
  it('Awaiting Handover sends ISSUED, Completed sends RECEIVED, Clear All resets', async () => {
    const tree = await mount(<PurchaseOrdersFlow can={viewer} onBack={() => undefined} />);
    await press(tree, 'purchaseOrders.filterButton');
    expect(allText(tree)).toContain(en['purchaseOrders.filter.title']);
    await press(tree, 'purchaseOrders.filter.status.AWAITING_HANDOVER');
    await press(tree, 'purchaseOrders.filter.apply');
    expect(lastListCall()[1]).toEqual({ status: 'ISSUED' });

    await press(tree, 'purchaseOrders.filterButton');
    await press(tree, 'purchaseOrders.filter.status.COMPLETED');
    await press(tree, 'purchaseOrders.filter.apply');
    expect(lastListCall()[1]).toEqual({ status: 'RECEIVED' });

    await press(tree, 'purchaseOrders.filterButton');
    await press(tree, 'purchaseOrders.filter.clearAll');
    await press(tree, 'purchaseOrders.filter.apply');
    expect(lastListCall()[1]).toEqual({});
  });

  it('Collection Scheduled and Produce stay, but are marked not available and disabled', async () => {
    const tree = await mount(<PurchaseOrdersFlow can={viewer} onBack={() => undefined} />);
    await press(tree, 'purchaseOrders.filterButton');
    const [scheduled] = byTestId(tree, 'purchaseOrders.filter.status.COLLECTION_SCHEDULED');
    expect(scheduled).toBeDefined();
    expect(scheduled!.props.disabled).toBe(true);
    const text = allText(tree);
    expect(text).toContain(en['purchaseOrders.filter.status.COLLECTION_SCHEDULED']);
    expect(text).toContain(en['purchaseOrders.filter.statusNotAvailable']);
    expect(text).toContain(en['purchaseOrders.filter.produce']);
    expect(text).toContain(en['purchaseOrders.filter.produceNotAvailable']);
  });
});

describe('detail: from GET /admin/purchase-orders/{id}', () => {
  it('a card opens the detail for that id; live values, dashes for what the API lacks', async () => {
    hooks.usePurchaseOrderList.mockReturnValue(cursorList({ items: LIVE }));
    hooks.usePurchaseOrderDetail.mockReturnValue(detailQuery({ data: detail() }));
    const tree = await mount(<PurchaseOrdersFlow can={viewer} onBack={() => undefined} warehouseId="wh-1" />);
    await press(tree, 'purchaseOrders.card.po-uuid-1');
    const call = hooks.usePurchaseOrderDetail.mock.calls.at(-1)!;
    expect(call).toEqual(['wh-1', 'po-uuid-1', { enabled: true }]);
    const text = allText(tree);
    expect(text).toContain(en['purchaseOrders.detail.title']);
    expect(text).toContain('PO-LIVE-000777');
    expect(text).toContain('Live Farmer Arun');
    expect(text).toContain('TF-LIVE-9');
    expect(text).toContain('₹41.50/kg');
    expect(text).toContain('₹512.32');
    expect(text).toContain('12.345 kg');
    expect(text).toContain(en['purchaseOrders.detail.farmLocation']);
    expect(text).toContain('—');
    for (const sample of DESIGN_SAMPLES) expect(text, sample).not.toContain(sample);
    // View Original Listing stays, disabled: the flow has no listing screen to open.
    const [viewListing] = byTestId(tree, 'purchaseOrders.detail.viewListing');
    expect(viewListing!.props.disabled).toBe(true);
    // Back returns to the list.
    await press(tree, 'purchaseOrders.back');
    expect(allText(tree)).toContain(en['purchaseOrders.title']);
  });

  it('detail error (e.g. 404 out of scope) shows the error state', async () => {
    hooks.usePurchaseOrderList.mockReturnValue(cursorList({ items: LIVE }));
    hooks.usePurchaseOrderDetail.mockReturnValue(detailQuery({ error: new Error('nope') }));
    const tree = await mount(<PurchaseOrdersFlow can={viewer} onBack={() => undefined} />);
    await press(tree, 'purchaseOrders.card.po-uuid-1');
    expect(allText(tree)).toContain(en['async.error.title']);
  });

  it('negotiation toggle keeps both design views; the request and counter rows are dashes', async () => {
    hooks.usePurchaseOrderList.mockReturnValue(cursorList({ items: LIVE }));
    hooks.usePurchaseOrderDetail.mockReturnValue(detailQuery({ data: detail() }));
    const tree = await mount(<PurchaseOrdersFlow can={viewer} onBack={() => undefined} />);
    await press(tree, 'purchaseOrders.card.po-uuid-1');
    expect(allText(tree)).toContain(en['purchaseOrders.detail.originalRequest']);
    await press(tree, 'purchaseOrders.detail.negotiation.direct');
    expect(allText(tree)).toContain(en['purchaseOrders.detail.directApproval']);
  });
});

describe('history view', () => {
  it('opens with the design history header; period chips send from/to; collection date is a dash', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-11T06:30:00.000Z'));
    hooks.usePurchaseOrderList.mockReturnValue(cursorList({ items: LIVE }));
    const tree = await mount(<PurchaseOrdersFlow can={viewer} onBack={() => undefined} initialView="history" />);
    const text = allText(tree);
    expect(text).toContain(en['purchaseOrders.history.title']);
    expect(text).toContain(en['purchaseOrders.history.collectionDate'].replace('{{date}}', '—'));
    await press(tree, 'purchaseOrders.filterButton');
    await press(tree, 'purchaseOrders.filter.period.LAST_7');
    await press(tree, 'purchaseOrders.filter.apply');
    expect(lastListCall()[1]).toEqual({ from: '2026-11-05', to: '2026-11-11' });
  });
});

describe('confirm purchase terms (no write endpoint)', () => {
  it('shows live terms and keeps the confirm button disabled with a not-available note', async () => {
    hooks.usePurchaseOrderDetail.mockReturnValue(detailQuery({ data: detail() }));
    const tree = await mount(<ConfirmPurchaseTermsScreen can={viewer} orderId="po-uuid-1" onBack={() => undefined} />);
    const text = allText(tree);
    expect(text).toContain('Live Farmer Arun');
    expect(text).toContain('₹512.32');
    expect(text).toContain(en['purchaseOrders.confirm.notAvailable']);
    await press(tree, 'purchaseOrders.confirm.acknowledge');
    expect(byTestId(tree, 'purchaseOrders.confirm.submit')[0]!.props.disabled).toBe(true);
  });

  it('denies without the code', async () => {
    const tree = await mount(<ConfirmPurchaseTermsScreen can={makeCan([])} orderId="po-uuid-1" onBack={() => undefined} />);
    expect(allText(tree)).toContain(en['purchaseOrders.notAvailable.title']);
    expect(hooks.usePurchaseOrderDetail).not.toHaveBeenCalled();
  });
});
