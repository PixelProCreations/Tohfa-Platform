/**
 * roles/admin/api/orders.ts and roles/admin/api/tasks.ts: the warehouse order
 * queue, the admin order detail, pack, mark-ready (POST .../dispatch), the
 * pickup OTP, and the open-task counts (docs/openapi.yaml tags Fulfilment,
 * Platform). The shell client is mocked (same pattern as
 * roles/farmer/tests/admin_auth_api.test.ts), so these tests pin exactly what
 * goes on the wire.
 *
 * Writes: docs/openapi.yaml asks for an Idempotency-Key on pack, dispatch and
 * verify-otp, so each sends one, and the order key ring
 * (createOrderActionKeyRing) reuses a key for the same body and makes a new one
 * for a changed body. The server ignores the key on all three today (server
 * gap); orderActions.ts re-reads the order after an unknown outcome instead
 * (see mappers_orders.test.ts).
 *
 * BR-20: the handover OTP is the customer's 4-digit code. The app checks the
 * format before any request, and never pre-fills or reads one back.
 * BR-30 / BR-101: lists send a warehouseId only when the caller passes one, and
 * the screens pass ordersWarehouseFilter(scope, selected), which pins a Sub
 * scope to its own warehouse uuid whatever was selected.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    request: vi.fn(async () => ({ items: [], page: { nextCursor: null, hasMore: false } })),
  };
});

import { ApiError } from '../../../shell/api/client';
import { request } from '../../../shell/api/client';
import { adminErrorKey } from '../api/errors';
import { ADMIN_REQUEST_TIMEOUT_MS } from '../api/http';
import {
  ERROR_CODES,
  PickupOtpFormatError,
  dispatchOrder,
  getAdminOrder,
  isPickupOtp,
  listAdminOrders,
  packOrder,
  verifyPickupOtp,
} from '../api/orders';
import { ERROR_CODES as TASK_ERROR_CODES, getTaskSummary } from '../api/tasks';
import { hasKey, t } from '../i18n';
import { createOrderActionKeyRing, ordersWarehouseFilter } from '../screens/warehouse/orders/mappers';

const requestMock = vi.mocked(request);

const OWN = '11111111-1111-4111-8111-111111111111';
const FOREIGN = '99999999-9999-4999-8999-999999999999';
const ORDER = '22222222-2222-4222-8222-222222222222';
const OTHER_ORDER = '33333333-3333-4333-8333-333333333333';
const ITEM = '44444444-4444-4444-8444-444444444444';
const SUB_SCOPE = { warehouseId: OWN, warehouseCode: 'WH-COON', warehouseName: 'Coonoor' };
const MAIN_SCOPE = {};

beforeEach(() => {
  vi.clearAllMocks();
});

function lastCall(): [string, Record<string, unknown>] {
  const call = requestMock.mock.calls.at(-1);
  if (call === undefined) throw new Error('request() was not called');
  return [call[0], call[1] as Record<string, unknown>];
}

function problem(code: string, status: number, meta?: Record<string, unknown>): ApiError {
  return new ApiError({ type: 'about:blank', title: code, status, code: code as never, ...(meta ? { meta } : {}) });
}

describe('listAdminOrders', () => {
  it('GETs /admin/orders with no query by default', async () => {
    await listAdminOrders();
    expect(requestMock).toHaveBeenCalledWith('/admin/orders', { method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS });
  });

  it('sends cursor, limit, status, warehouseId, channel and deliveryDate', async () => {
    await listAdminOrders({
      cursor: 'c-1',
      limit: 50,
      status: 'CONFIRMED',
      warehouseId: OWN,
      channel: 'ONLINE',
      deliveryDate: '2026-10-13',
    });
    expect(lastCall()[0]).toBe(
      `/admin/orders?cursor=c-1&limit=50&status=CONFIRMED&warehouseId=${OWN}&channel=ONLINE&deliveryDate=2026-10-13`,
    );
  });

  it('passes the caller signal through', async () => {
    const controller = new AbortController();
    await listAdminOrders({}, controller.signal);
    expect(lastCall()[1]['signal']).toBe(controller.signal);
  });
});

describe('getAdminOrder', () => {
  it('GETs /admin/orders/{orderId}, encoded as one path segment', async () => {
    await getAdminOrder(ORDER);
    expect(requestMock).toHaveBeenCalledWith(`/admin/orders/${ORDER}`, { method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS });
    await getAdminOrder('a/b?c');
    expect(lastCall()[0]).toBe('/admin/orders/a%2Fb%3Fc');
  });
});

describe('packOrder', () => {
  it('POSTs an empty body to /admin/orders/{id}/pack with the Idempotency-Key', async () => {
    await packOrder(ORDER, {}, 'key-pack-1');
    expect(requestMock).toHaveBeenCalledWith(`/admin/orders/${ORDER}/pack`, {
      method: 'POST',
      body: {},
      idempotencyKey: 'key-pack-1',
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
  });

  it('sends packedLines as orderItemId + a kg string, never a number', async () => {
    await packOrder(ORDER, { packedLines: [{ orderItemId: ITEM, fulfilledQtyKg: '1.250' }] }, 'key-pack-2');
    expect(lastCall()[1]['body']).toEqual({ packedLines: [{ orderItemId: ITEM, fulfilledQtyKg: '1.250' }] });
  });
});

describe('dispatchOrder', () => {
  it('POSTs the body to /admin/orders/{id}/dispatch with the Idempotency-Key', async () => {
    await dispatchOrder(ORDER, {}, 'key-dispatch-1');
    expect(requestMock).toHaveBeenCalledWith(`/admin/orders/${ORDER}/dispatch`, {
      method: 'POST',
      body: {},
      idempotencyKey: 'key-dispatch-1',
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
  });

  it('sends vehicleNumber, deliveryPartnerId and expectedArrival as given', async () => {
    const body = { vehicleNumber: 'TN43AB1234', deliveryPartnerId: ITEM, expectedArrival: '2026-10-13T05:30:00Z' };
    await dispatchOrder(ORDER, body, 'key-dispatch-2');
    expect(lastCall()[1]['body']).toEqual(body);
  });
});

describe('verifyPickupOtp (BR-20)', () => {
  it('POSTs {otp} to /admin/orders/{id}/verify-otp with the Idempotency-Key', async () => {
    await verifyPickupOtp(ORDER, { otp: '0427' }, 'key-otp-1');
    expect(requestMock).toHaveBeenCalledWith(`/admin/orders/${ORDER}/verify-otp`, {
      method: 'POST',
      body: { otp: '0427' },
      idempotencyKey: 'key-otp-1',
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
  });

  it('BR-20: refuses anything but exactly 4 digits before any request is made', async () => {
    for (const otp of ['', '123', '12345', '12a4', ' 1234', '1234 ', '١٢٣٤', '12.4', '-123']) {
      await expect(verifyPickupOtp(ORDER, { otp }, 'key-otp-x')).rejects.toBeInstanceOf(PickupOtpFormatError);
    }
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('BR-20: isPickupOtp accepts exactly four ASCII digits, leading zeros included', () => {
    expect(isPickupOtp('0000')).toBe(true);
    expect(isPickupOtp('4821')).toBe(true);
    expect(isPickupOtp('482')).toBe(false);
    expect(isPickupOtp('48210')).toBe(false);
    expect(isPickupOtp('48 1')).toBe(false);
  });

  it('BR-20: OTP_INVALID and OTP_LOCKED map to their own messages, not the generic one', () => {
    expect(adminErrorKey(problem('OTP_INVALID', 422, { remainingAttempts: 2 }))).toBe('admin.error.OTP_INVALID');
    expect(adminErrorKey(problem('OTP_LOCKED', 429))).toBe('admin.error.OTP_LOCKED');
    expect(t(adminErrorKey(problem('OTP_INVALID', 422)))).not.toBe(t('admin.error.generic'));
    expect(t(adminErrorKey(problem('OTP_LOCKED', 429)))).not.toBe(t('admin.error.generic'));
  });
});

describe('getTaskSummary', () => {
  it('GETs /admin/tasks/summary, with warehouseId only when given', async () => {
    await getTaskSummary();
    expect(requestMock).toHaveBeenCalledWith('/admin/tasks/summary', { method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS });
    await getTaskSummary({ warehouseId: OWN });
    expect(lastCall()[0]).toBe(`/admin/tasks/summary?warehouseId=${OWN}`);
  });
});

describe('Idempotency-Key reuse (root CLAUDE.md 2.4)', () => {
  function ring() {
    let n = 0;
    return createOrderActionKeyRing(() => `key-${(n += 1)}`);
  }

  it('reuses the key for the same order, action and body (a retry)', () => {
    const keys = ring();
    const first = keys.keyFor(ORDER, 'verifyOtp', { otp: '1234' });
    expect(keys.keyFor(ORDER, 'verifyOtp', { otp: '1234' })).toBe(first);
  });

  it('makes a new key for a changed body (another OTP typed)', () => {
    const keys = ring();
    const first = keys.keyFor(ORDER, 'verifyOtp', { otp: '1234' });
    expect(keys.keyFor(ORDER, 'verifyOtp', { otp: '1235' })).not.toBe(first);
  });

  it('never shares a key between actions or between orders', () => {
    const keys = ring();
    const pack = keys.keyFor(ORDER, 'pack', {});
    const ready = keys.keyFor(ORDER, 'markReady', {});
    const otherPack = keys.keyFor(OTHER_ORDER, 'pack', {});
    expect(new Set([pack, ready, otherPack]).size).toBe(3);
    expect(keys.keyFor(ORDER, 'pack', {})).toBe(pack);
  });

  it('sends the reused key on the wire for a replayed write', async () => {
    const keys = ring();
    await packOrder(ORDER, {}, keys.keyFor(ORDER, 'pack', {}));
    await packOrder(ORDER, {}, keys.keyFor(ORDER, 'pack', {}));
    const sent = requestMock.mock.calls.map((call) => (call[1] as Record<string, unknown>)['idempotencyKey']);
    expect(sent).toEqual(['key-1', 'key-1']);
  });
});

describe('BR-101 / BR-30: a Sub scope never sends another warehouse', () => {
  it('ordersWarehouseFilter pins a Sub scope to its own uuid whatever was selected', () => {
    expect(ordersWarehouseFilter(SUB_SCOPE, FOREIGN)).toBe(OWN);
    expect(ordersWarehouseFilter(SUB_SCOPE, undefined)).toBe(OWN);
  });

  it('ordersWarehouseFilter passes a Main selection only when it is a warehouse uuid', () => {
    expect(ordersWarehouseFilter(MAIN_SCOPE, FOREIGN)).toBe(FOREIGN);
    expect(ordersWarehouseFilter(MAIN_SCOPE, undefined)).toBeUndefined();
    // A sample code from the old selector is not a warehouse the API knows (422).
    expect(ordersWarehouseFilter(MAIN_SCOPE, 'WH-COON')).toBeUndefined();
  });

  it('the list and the task counts carry only the Sub warehouse', async () => {
    const warehouseId = ordersWarehouseFilter(SUB_SCOPE, FOREIGN);
    await listAdminOrders({ warehouseId, status: 'READY_FOR_PICKUP' });
    await getTaskSummary({ warehouseId });
    for (const [path] of requestMock.mock.calls) {
      expect(path).toContain(`warehouseId=${OWN}`);
      expect(path).not.toContain(FOREIGN);
    }
  });
});

describe('ERROR_CODES', () => {
  it('lists the codes these endpoints document, including the OTP and state codes', () => {
    for (const code of ['NOT_FOUND', 'INVALID_STATE_TRANSITION', 'OTP_INVALID', 'OTP_LOCKED', 'CONFLICT', 'FORBIDDEN']) {
      expect(ERROR_CODES).toContain(code);
    }
  });

  it('every listed code has an admin message', () => {
    for (const code of [...ERROR_CODES, ...TASK_ERROR_CODES]) {
      expect({ code, known: hasKey(`admin.error.${code}`) }).toEqual({ code, known: true });
    }
  });
});
