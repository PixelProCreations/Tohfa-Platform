/**
 * screens/warehouse/orders/mappers.ts and ./orderActions.ts: the order queue
 * and the admin order detail -> the order UI types, the task counts, the next
 * action an order offers, and the retry-safe pack / mark-ready / OTP writes.
 *
 * Money is integer paise end to end (the API's Money strings go through
 * @tohfa/shared-types parseMoney/toPaise) and weights are integer grams
 * (parseKgToGrams), so no float ever touches either.
 *
 * Two status enums: docs/openapi.yaml gives the list (OrderSummary) the
 * 6-value OrderStatus and the detail (AdminOrderDetail) a 10-value enum. Both
 * tables are exhaustive over their spec enum, and the list falls back to the
 * detail table because the server sends the stored status (READY_FOR_PICKUP,
 * PENDING_PAYMENT, ...) on the list too (spec gap). The list says
 * HOME_DELIVERY / WAREHOUSE_PICKUP and the detail DELIVERY / PICKUP;
 * normalizeFulfilment makes them compare equal.
 *
 * Why the retry tests matter: the server ignores the Idempotency-Key on pack,
 * dispatch and verify-otp (server gap). After a write whose outcome is unknown
 * the app re-reads the order and treats the write as done when the status has
 * already moved, so a retry never packs, readies or hands over twice.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, NetworkError } from '../../../shell/api/client';
import type { AdminOrderDetailDto, AdminOrderStatus, OrderDto, OrderStatus, OrderSummaryDto } from '../api/orders';
import { hasKey, t } from '../i18n';
import {
  DETAIL_STATUS_TABLE,
  LIST_STATUS_TABLE,
  actionLanded,
  detailStatusOf,
  listStatusOf,
  moneyToPaise,
  nextOrderAction,
  normalizeFulfilment,
  orderIdParam,
  orderStatusLabelKey,
  orderTaskCounts,
  otpAttemptsLeft,
  toOrderDetail,
  toOrderListRow,
} from '../screens/warehouse/orders/mappers';
import { performOrderAction, type OrderActionDeps } from '../screens/warehouse/orders/orderActions';
import type { OrderUiStatus } from '../screens/warehouse/orders/types';

const WH = '11111111-1111-4111-8111-111111111111';
const ORDER = '22222222-2222-4222-8222-222222222222';
const CUSTOMER = '55555555-5555-4555-8555-555555555555';
const CROP = '66666666-6666-4666-8666-666666666666';
const NOW = new Date('2026-10-13T06:30:00Z'); // 12:00 IST

/** docs/openapi.yaml components.schemas.OrderStatus (the list). */
const SPEC_LIST_STATUSES: readonly OrderStatus[] = ['CONFIRMED', 'PACKED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
/** docs/openapi.yaml AdminOrderDetail.status (the detail). */
const SPEC_DETAIL_STATUSES: readonly AdminOrderStatus[] = [
  'PENDING_PAYMENT',
  'CONFIRMED',
  'PACKED',
  'DISPATCHED',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'PICKED_UP',
  'CANCELLED',
  'RETURNED',
];

const SUMMARY: OrderSummaryDto = {
  id: ORDER,
  orderNumber: 'TOH-2026-0084412',
  status: 'CONFIRMED',
  channel: 'ONLINE',
  fulfillmentType: 'WAREHOUSE_PICKUP',
  warehouseId: WH,
  itemCount: 3,
  totalAmount: '950.50' as never,
  paymentStatus: 'PAID',
  deliveryDate: null,
  placedAt: '2026-10-13T04:35:00Z', // 10:05 IST
};

function detail(overrides: Partial<AdminOrderDetailDto> = {}): AdminOrderDetailDto {
  return {
    id: ORDER,
    orderNumber: 'TOH-2026-0084412',
    channel: 'ONLINE',
    status: 'CONFIRMED',
    fulfilmentType: 'PICKUP',
    paymentMethod: 'WALLET',
    paymentStatus: 'PAID',
    warehouse: { id: WH, name: 'Coonoor' },
    buyer: { kind: 'CUSTOMER', customerId: CUSTOMER, customerCode: 'CUST-0001', name: 'Meena S.', mobileMasked: '******3210' },
    items: [
      {
        productId: CROP,
        name: 'Carrot',
        grade: 'GRADE_1',
        qtyKg: '0.125',
        unitPrice: '0.10' as never,
        gstRate: '5.00',
        gstAmount: '0.00' as never,
        lineTotal: '47.53' as never,
      },
      {
        productId: CROP,
        name: 'Beans',
        grade: 'GRADE_2',
        qtyKg: '2.000',
        unitPrice: '451.49' as never,
        gstRate: '0.00',
        gstAmount: '0.00' as never,
        lineTotal: '902.97' as never,
      },
    ],
    totals: {
      subtotal: '950.50' as never,
      deliveryFee: '0.00' as never,
      discount: '0.00' as never,
      gst: '0.00' as never,
      total: '950.50' as never,
    },
    invoice: null,
    fulfilment: { deliveryDate: null, deliverySlot: null, otpRequired: true, otpVerifiedAt: null },
    timeline: [
      { fromStatus: null, toStatus: 'CONFIRMED', at: '2026-10-13T04:35:00Z' },
      // A warehouse reassignment writes a same-status row; it is not a status change.
      { fromStatus: 'CONFIRMED', toStatus: 'CONFIRMED', at: '2026-10-13T04:40:00Z' },
      { fromStatus: 'CONFIRMED', toStatus: 'PACKED', at: '2026-10-13T05:00:00Z' },
    ],
    placedAt: '2026-10-13T04:35:00Z',
    packedAt: null,
    completedAt: null,
    cancelledAt: null,
    ...overrides,
  };
}

describe('status tables', () => {
  it('the list table is exhaustive over the spec OrderStatus enum', () => {
    expect(Object.keys(LIST_STATUS_TABLE).sort()).toEqual([...SPEC_LIST_STATUSES].sort());
  });

  it('the detail table is exhaustive over the spec AdminOrderDetail.status enum', () => {
    expect(Object.keys(DETAIL_STATUS_TABLE).sort()).toEqual([...SPEC_DETAIL_STATUSES].sort());
  });

  it('every UI status either table yields has a label', () => {
    const uiStatuses = new Set<OrderUiStatus>([...Object.values(LIST_STATUS_TABLE), ...Object.values(DETAIL_STATUS_TABLE), 'unknown']);
    for (const ui of uiStatuses) expect({ ui, known: hasKey(orderStatusLabelKey(ui)) }).toEqual({ ui, known: true });
  });

  it('the list falls back to the detail table for a stored status outside its spec enum, then to unknown', () => {
    expect(listStatusOf('CONFIRMED')).toBe('confirmed');
    expect(listStatusOf('READY_FOR_PICKUP')).toBe('readyForPickup');
    expect(listStatusOf('PENDING_PAYMENT')).toBe('pendingPayment');
    expect(listStatusOf('SOMETHING_NEW')).toBe('unknown');
    expect(detailStatusOf('PICKED_UP')).toBe('pickedUp');
    expect(detailStatusOf('')).toBe('unknown');
  });
});

describe('normalizeFulfilment', () => {
  it('HOME_DELIVERY (list) and DELIVERY (detail) compare equal', () => {
    expect(normalizeFulfilment('HOME_DELIVERY')).toBe('delivery');
    expect(normalizeFulfilment('HOME_DELIVERY')).toBe(normalizeFulfilment('DELIVERY'));
  });

  it('WAREHOUSE_PICKUP (list) and PICKUP (detail) compare equal', () => {
    expect(normalizeFulfilment('WAREHOUSE_PICKUP')).toBe('pickup');
    expect(normalizeFulfilment('WAREHOUSE_PICKUP')).toBe(normalizeFulfilment('PICKUP'));
  });

  it('anything else is unknown, never guessed', () => {
    expect(normalizeFulfilment(undefined)).toBe('unknown');
    expect(normalizeFulfilment('COURIER')).toBe('unknown');
  });
});

describe('moneyToPaise', () => {
  it('reads Money strings as exact integer paise', () => {
    expect(moneyToPaise('950.50')).toBe(95050);
    expect(moneyToPaise('0.10')).toBe(10);
    expect(moneyToPaise('47.53')).toBe(4753);
  });

  it('is null for an absent or malformed amount, never 0', () => {
    expect(moneyToPaise(undefined)).toBeNull();
    expect(moneyToPaise('abc')).toBeNull();
  });
});

describe('toOrderListRow', () => {
  it('shows the order number and item count (the list carries no customer name)', () => {
    const row = toOrderListRow(SUMMARY, NOW);
    expect(row.id).toBe(ORDER);
    expect(row.orderNumber).toBe('TOH-2026-0084412');
    expect(row.itemCount).toBe(3);
    expect(row.totalPaise).toBe(95050);
    expect(row.status).toBe('confirmed');
    expect(row.fulfilment).toBe('pickup');
    expect(row.placedLabel).toBe(t('datetime.dayAndTime', { day: t('datetime.today'), time: '10:05 AM' }));
    expect(Object.keys(row)).not.toContain('customer');
  });

  it('an absent item count is shown as no value, never as 0 items', () => {
    const { itemCount: _omit, ...rest } = SUMMARY;
    const row = toOrderListRow(rest, NOW);
    expect(row.itemCount).toBeNull();
    expect(row.itemsLabel).toBe(t('orders.noValue'));
  });
});

describe('toOrderDetail', () => {
  it('turns lines and totals into grams and paise', () => {
    const view = toOrderDetail(detail(), NOW);
    expect(view.lines.map((l) => l.qtyGrams)).toEqual([125, 2000]);
    expect(view.lines.map((l) => l.lineTotalPaise)).toEqual([4753, 90297]);
    expect(view.totalGrams).toBe(2125);
    expect(view.totals.totalPaise).toBe(95050);
    expect(view.totals.subtotalPaise).toBe(95050);
    expect(view.itemCount).toBe(2);
  });

  it('shows the buyer name and the masked mobile as sent (BR-92)', () => {
    const view = toOrderDetail(detail(), NOW);
    expect(view.buyerName).toBe('Meena S.');
    expect(view.buyerMobileMasked).toBe('******3210');
    expect(toOrderDetail(detail({ buyer: { ...detail().buyer, mobileMasked: null } }), NOW).buyerMobileMasked).toBeNull();
  });

  it('the timeline is oldest first, status changes only', () => {
    const view = toOrderDetail(detail(), NOW);
    expect(view.timeline.map((e) => e.status)).toEqual(['confirmed', 'packed']);
  });

  it('normalises the detail fulfilment the same way as the list', () => {
    expect(toOrderDetail(detail({ fulfilmentType: 'DELIVERY' }), NOW).fulfilment).toBe(normalizeFulfilment('HOME_DELIVERY'));
    expect(toOrderDetail(detail(), NOW).fulfilment).toBe(normalizeFulfilment('WAREHOUSE_PICKUP'));
  });

  it('BR-99: reads no OTP and no farm field, even when the record carries them', () => {
    const leaky = {
      ...detail(),
      deliveryOtp: '4821',
      deliveryOtpHash: 'hash-0f1e2d',
      otpAttempts: 2,
      farmerId: '77777777-7777-4777-8777-777777777777',
      farmName: 'Green Acres Estate',
      village: 'Kil Kotagiri',
      gps: '11.4,76.7',
      items: detail().items.map((i) => ({ ...i, sourceFarmerId: '88888888-8888-4888-8888-888888888888', batchCode: 'BATCH-XYZ-9' })),
    } as unknown as AdminOrderDetailDto;
    const view = toOrderDetail(leaky, NOW);
    const json = JSON.stringify(view);
    for (const secret of ['4821', 'hash-0f1e2d', '77777777-7777', 'Green Acres', 'Kil Kotagiri', '11.4,76.7', '88888888-8888', 'BATCH-XYZ-9']) {
      expect({ secret, leaked: json.includes(secret) }).toEqual({ secret, leaked: false });
    }
    const keys = JSON.stringify(Object.keys(view)) + JSON.stringify(view.lines.flatMap((l) => Object.keys(l)));
    expect(keys).not.toMatch(/farm|batch|gps|village/i);
    expect(Object.keys(view).filter((k) => /otp/i.test(k)).sort()).toEqual(['otpRequired', 'otpVerifiedLabel']);
  });
});

describe('orderTaskCounts', () => {
  it('reads the three order task types; a missing type counts 0', () => {
    expect(orderTaskCounts({ open: 5, byType: { ORDER_PACK: 3, ORDER_PICKUP_OTP: 2, GOODS_RECEIPT_QC: 4 } })).toEqual({
      toPack: 3,
      toMarkReady: 0,
      awaitingPickup: 2,
    });
  });

  it('is null before the summary loads, so the screen shows no value rather than 0', () => {
    expect(orderTaskCounts(undefined)).toBeNull();
  });
});

describe('orderIdParam', () => {
  it('passes a uuid and drops a sample order code (not an order the API can look up)', () => {
    expect(orderIdParam({ orderId: ORDER })).toBe(ORDER);
    expect(orderIdParam({ orderId: 'ORD-1024' })).toBeUndefined();
    expect(orderIdParam(null)).toBeUndefined();
  });
});

describe('nextOrderAction', () => {
  const all = () => true;
  const none = () => false;

  it('CONFIRMED -> pack, with order.mark_packed', () => {
    expect(nextOrderAction(toOrderDetail(detail(), NOW), all)).toEqual({ kind: 'pack', screen: 'M5S07', step: 'packing' });
    expect(nextOrderAction(toOrderDetail(detail(), NOW), none)).toBeNull();
  });

  it('PACKED pickup -> mark ready, with order.dispatch; a PACKED delivery order offers nothing (delivery is not enabled)', () => {
    expect(nextOrderAction(toOrderDetail(detail({ status: 'PACKED' }), NOW), all)).toEqual({ kind: 'markReady', screen: 'M5S07', step: 'confirm' });
    expect(nextOrderAction(toOrderDetail(detail({ status: 'PACKED', fulfilmentType: 'DELIVERY' }), NOW), all)).toBeNull();
  });

  it('READY_FOR_PICKUP -> verify the pickup OTP, with order.pickup_otp.verify', () => {
    expect(nextOrderAction(toOrderDetail(detail({ status: 'READY_FOR_PICKUP' }), NOW), all)).toEqual({
      kind: 'verifyPickup',
      screen: 'M5S11',
      step: 'verify',
    });
    expect(nextOrderAction(toOrderDetail(detail({ status: 'PICKED_UP' }), NOW), all)).toBeNull();
  });
});

describe('otpAttemptsLeft', () => {
  it('reads meta.remainingAttempts from OTP_INVALID', () => {
    const err = new ApiError({ type: 'about:blank', title: 'x', status: 422, code: 'OTP_INVALID', meta: { remainingAttempts: 2 } });
    expect(otpAttemptsLeft(err)).toBe(2);
    expect(otpAttemptsLeft(new Error('x'))).toBeNull();
  });
});

// ─── Retry safety ────────────────────────────────────────────────────────────

describe('actionLanded (a status that has already moved counts as done)', () => {
  it('pack has landed once the order is PACKED or beyond', () => {
    expect(actionLanded('pack', 'CONFIRMED')).toBe(false);
    for (const s of ['PACKED', 'READY_FOR_PICKUP', 'DISPATCHED', 'PICKED_UP', 'DELIVERED']) expect(actionLanded('pack', s)).toBe(true);
  });

  it('mark ready has landed once the order is READY_FOR_PICKUP or beyond', () => {
    expect(actionLanded('markReady', 'PACKED')).toBe(false);
    expect(actionLanded('markReady', 'READY_FOR_PICKUP')).toBe(true);
    expect(actionLanded('markReady', 'PICKED_UP')).toBe(true);
  });

  it('the OTP handover has landed once the order is PICKED_UP or DELIVERED', () => {
    expect(actionLanded('verifyOtp', 'READY_FOR_PICKUP')).toBe(false);
    expect(actionLanded('verifyOtp', 'PICKED_UP')).toBe(true);
    expect(actionLanded('verifyOtp', 'DELIVERED')).toBe(true);
  });

  it('a cancelled or unknown order is never "done"', () => {
    for (const action of ['pack', 'markReady', 'verifyOtp'] as const) {
      expect(actionLanded(action, 'CANCELLED')).toBe(false);
      expect(actionLanded(action, 'SOMETHING_NEW')).toBe(false);
    }
  });
});

describe('performOrderAction', () => {
  const packed = { id: ORDER, status: 'PACKED' } as unknown as OrderDto;
  let post: ReturnType<typeof vi.fn<OrderActionDeps['post']>>;
  let currentStatus: ReturnType<typeof vi.fn<OrderActionDeps['currentStatus']>>;

  beforeEach(() => {
    post = vi.fn<OrderActionDeps['post']>();
    currentStatus = vi.fn<OrderActionDeps['currentStatus']>();
  });

  const deps = (): OrderActionDeps => ({ post, currentStatus });

  it('posts once and is done on success', async () => {
    post.mockResolvedValueOnce(packed);
    const out = await performOrderAction({ unknown: false }, 'pack', deps());
    expect(out.kind).toBe('done');
    expect(post).toHaveBeenCalledTimes(1);
    expect(currentStatus).not.toHaveBeenCalled();
  });

  it('after a timeout, re-reads the order and treats a moved status as done (no second post)', async () => {
    post.mockRejectedValueOnce(new NetworkError(new Error('timeout')));
    currentStatus.mockResolvedValueOnce('PACKED');
    const out = await performOrderAction({ unknown: false }, 'pack', deps());
    expect(out.kind).toBe('done');
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('after a timeout with the status unmoved, fails and re-checks before the next post', async () => {
    post.mockRejectedValueOnce(new NetworkError(new Error('timeout')));
    currentStatus.mockResolvedValueOnce('CONFIRMED');
    const first = await performOrderAction({ unknown: false }, 'pack', deps());
    expect(first).toMatchObject({ kind: 'failed', state: { unknown: true } });

    currentStatus.mockResolvedValueOnce('PACKED'); // the first post landed late
    const second = await performOrderAction(first.state, 'pack', deps());
    expect(second.kind).toBe('done');
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('when the re-read itself fails, nothing is posted and the outcome stays unknown', async () => {
    currentStatus.mockRejectedValueOnce(new NetworkError(new Error('offline')));
    const out = await performOrderAction({ unknown: true }, 'markReady', deps());
    expect(out).toMatchObject({ kind: 'failed', stage: 'verify', state: { unknown: true } });
    expect(post).not.toHaveBeenCalled();
  });

  it('a 409 INVALID_STATE_TRANSITION whose order already moved (a replay) is done', async () => {
    post.mockRejectedValueOnce(new ApiError({ type: 'about:blank', title: 'x', status: 409, code: 'INVALID_STATE_TRANSITION' }));
    currentStatus.mockResolvedValueOnce('PICKED_UP');
    const out = await performOrderAction({ unknown: false }, 'verifyOtp', deps());
    expect(out.kind).toBe('done');
  });

  it('BR-20: a wrong OTP is a plain failure (no re-read, no retry of its own)', async () => {
    const wrong = new ApiError({ type: 'about:blank', title: 'x', status: 422, code: 'OTP_INVALID', meta: { remainingAttempts: 1 } });
    post.mockRejectedValueOnce(wrong);
    const out = await performOrderAction({ unknown: false }, 'verifyOtp', deps());
    expect(out).toMatchObject({ kind: 'failed', stage: 'post', error: wrong, state: { unknown: false } });
    expect(currentStatus).not.toHaveBeenCalled();
    expect(post).toHaveBeenCalledTimes(1);
  });
});
