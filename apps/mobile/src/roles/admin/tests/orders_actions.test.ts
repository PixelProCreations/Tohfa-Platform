/**
 * Pure helpers behind the order action screens (screens/warehouse/orders/orderActions.ts):
 * which status offers which action, the dispatch body, and how a pickup-code
 * failure is worded. Plain-Node vitest; written before the helpers existed.
 */
import { describe, expect, it } from 'vitest';
import { ApiError, NetworkError } from '../../../shell/api/client';
import { PickupOtpFormatError } from '../api/orders';
import {
  canDispatchOrder,
  canPackOrder,
  canVerifyPickup,
  dispatchBodyFor,
  ORDER_PERMISSION_CODES,
  pickupOtpErrorLines,
  VEHICLE_NUMBER_MAX_LENGTH,
} from '../screens/warehouse/orders/orderActions';

function problem(code: string, status: number, meta?: Record<string, unknown>): ApiError {
  return new ApiError({ type: 'about:blank', title: code, status, code: code as never, ...(meta ? { meta } : {}) });
}

describe('order permission codes', () => {
  // 'order.list.view' (the old constant) is not in docs/rbac.json, so the list never loaded.
  it('BR-101: the order list is gated on order.list.view_all, the code GET /admin/orders requires', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const root = path.join(__dirname, '..', '..', '..', '..', '..', '..');
    const rbac = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'rbac.json'), 'utf8')) as {
      permissions: { code: string }[];
    };
    const codes = new Set(rbac.permissions.map((p) => p.code));
    const routes = fs.readFileSync(path.join(root, 'apps', 'api', 'src', 'modules', 'orders', 'fulfilment.routes.ts'), 'utf8');
    expect(ORDER_PERMISSION_CODES.listView).toBe('order.list.view_all');
    for (const code of Object.values(ORDER_PERMISSION_CODES)) {
      expect(codes.has(code)).toBe(true);
    }
    for (const code of [ORDER_PERMISSION_CODES.listView, ORDER_PERMISSION_CODES.pack, ORDER_PERMISSION_CODES.dispatch, ORDER_PERMISSION_CODES.verifyPickup]) {
      expect(routes).toContain(`requirePermission('${code}')`);
    }
  });
});

describe('order action eligibility', () => {
  it('only a CONFIRMED order is offered Pack', () => {
    expect(canPackOrder('CONFIRMED')).toBe(true);
    for (const s of ['PENDING_PAYMENT', 'PACKED', 'READY_FOR_PICKUP', 'PICKED_UP', 'CANCELLED'] as const) {
      expect(canPackOrder(s)).toBe(false);
    }
  });

  // docs/openapi.yaml: dispatch moves a PACKED order on. The server's ALLOWED_TRANSITIONS also
  // lets CONFIRMED jump to READY_FOR_PICKUP (skipping pack); the app must never offer that.
  it('only a PACKED order is offered Dispatch / Mark Ready, never a CONFIRMED one', () => {
    expect(canDispatchOrder('PACKED')).toBe(true);
    expect(canDispatchOrder('CONFIRMED')).toBe(false);
    for (const s of ['PENDING_PAYMENT', 'READY_FOR_PICKUP', 'DISPATCHED', 'PICKED_UP', 'CANCELLED'] as const) {
      expect(canDispatchOrder(s)).toBe(false);
    }
  });

  it('BR-20: only a READY_FOR_PICKUP order is offered the pickup-code check', () => {
    expect(canVerifyPickup('READY_FOR_PICKUP')).toBe(true);
    for (const s of ['CONFIRMED', 'PACKED', 'PICKED_UP', 'CANCELLED'] as const) {
      expect(canVerifyPickup(s)).toBe(false);
    }
  });
});

describe('dispatchBodyFor', () => {
  it('omits the vehicle number when nothing was typed (no fixture partner is ever sent)', () => {
    expect(dispatchBodyFor('')).toEqual({ ok: true, body: {} });
    expect(dispatchBodyFor('   ')).toEqual({ ok: true, body: {} });
  });

  it('sends the trimmed, user-typed vehicle number', () => {
    expect(dispatchBodyFor('  TN 43 AB 1234 ')).toEqual({ ok: true, body: { vehicleNumber: 'TN 43 AB 1234' } });
  });

  it('refuses a vehicle number longer than the API allows, before any request', () => {
    expect(VEHICLE_NUMBER_MAX_LENGTH).toBe(20);
    expect(dispatchBodyFor('X'.repeat(20))).toEqual({ ok: true, body: { vehicleNumber: 'X'.repeat(20) } });
    expect(dispatchBodyFor('X'.repeat(21))).toEqual({ ok: false });
  });
});

describe('pickupOtpErrorLines', () => {
  it('BR-20: a wrong code (422 OTP_INVALID) shows the attempts left from the problem body', () => {
    const lines = pickupOtpErrorLines(problem('OTP_INVALID', 422, { remainingAttempts: 2 }));
    expect(lines).toEqual([
      { key: 'admin.error.OTP_INVALID' },
      { key: 'orders.pickup.attemptsLeft', params: { count: 2 } },
    ]);
  });

  it('BR-20: OTP_INVALID without a usable remainingAttempts shows only the wrong-code line', () => {
    expect(pickupOtpErrorLines(problem('OTP_INVALID', 422))).toEqual([{ key: 'admin.error.OTP_INVALID' }]);
    expect(pickupOtpErrorLines(problem('OTP_INVALID', 422, { remainingAttempts: 'x' }))).toEqual([
      { key: 'admin.error.OTP_INVALID' },
    ]);
  });

  it('BR-20: a locked code (429 OTP_LOCKED) is worded as locked, not as a wrong code', () => {
    expect(pickupOtpErrorLines(problem('OTP_LOCKED', 429))).toEqual([{ key: 'admin.error.OTP_LOCKED' }]);
  });

  it('a code that is not 4 digits is a format error, never sent', () => {
    expect(pickupOtpErrorLines(new PickupOtpFormatError())).toEqual([{ key: 'orders.pickup.formatError' }]);
  });

  it('a network failure or a wrong-status 409 is NOT reported as an incorrect code', () => {
    expect(pickupOtpErrorLines(new NetworkError(new Error('offline')))).toEqual([{ key: 'admin.error.network' }]);
    expect(pickupOtpErrorLines(problem('INVALID_STATE_TRANSITION', 409))).toEqual([
      { key: 'admin.error.INVALID_STATE_TRANSITION' },
    ]);
  });
});
