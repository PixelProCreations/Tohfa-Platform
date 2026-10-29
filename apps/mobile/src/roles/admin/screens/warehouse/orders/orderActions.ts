/**
 * Pure rules behind the order action screens: which status offers which
 * action, the dispatch body, and how a pickup-code failure is worded. No React,
 * no network, so ../../../tests/orders_actions.test.ts runs it in plain Node.
 *
 * The status checks only decide what the app OFFERS; the server re-checks every
 * transition (409 INVALID_STATE_TRANSITION). They are stricter than the server
 * on purpose: fulfilment.service.ts ALLOWED_TRANSITIONS lets a CONFIRMED order
 * jump to READY_FOR_PICKUP through POST .../dispatch, skipping pack, while
 * docs/openapi.yaml describes dispatch as acting on a packed order. The app
 * follows the spec and never offers that skip (server inconsistency, reported).
 */
import type { TranslationKey } from '../../../i18n';
import { adminErrorKey } from '../../../api/errors';
import { ApiError } from '../../../../../shell/api/client';
import { PickupOtpFormatError, type AdminOrderStatus, type DispatchOrderBody } from '../../../api/orders';

/** docs/rbac.json codes the order screens check; each is what the matching API route requires. */
export const ORDER_PERMISSION_CODES = {
  /** GET /admin/orders and GET /admin/orders/{orderId}. */
  listView: 'order.list.view_all',
  /** POST /admin/orders/{id}/pack. */
  pack: 'order.mark_packed',
  /** POST /admin/orders/{id}/dispatch. */
  dispatch: 'order.dispatch',
  /** POST /admin/orders/{id}/verify-otp. */
  verifyPickup: 'order.pickup_otp.verify',
  /** The Main-only warehouse picker. */
  warehouseList: 'warehouse.all.view',
} as const;

/** Pack is offered for a CONFIRMED order only (the server's own rule for pack). */
export function canPackOrder(status: AdminOrderStatus): boolean {
  return status === 'CONFIRMED';
}

/** Dispatch / Mark Ready is offered for a PACKED order only (see the docblock). */
export function canDispatchOrder(status: AdminOrderStatus): boolean {
  return status === 'PACKED';
}

/** The handover code is checked only once the order waits at the counter (BR-20). */
export function canVerifyPickup(status: AdminOrderStatus): boolean {
  return status === 'READY_FOR_PICKUP';
}

/**
 * docs/openapi.yaml dispatch body `vehicleNumber` maxLength (fulfilment.schema.ts
 * `z.string().max(20)`). A wire-format limit of the API, not a business threshold.
 */
export const VEHICLE_NUMBER_MAX_LENGTH = 20;

export type DispatchBodyResult = { ok: true; body: DispatchOrderBody } | { ok: false };

/**
 * The dispatch body from what the admin typed. There is no delivery-partner
 * endpoint, so nothing but a typed vehicle number is ever sent; blank sends none.
 * Too long is refused here so it never becomes a 422.
 */
export function dispatchBodyFor(vehicleNumberInput: string): DispatchBodyResult {
  const vehicleNumber = vehicleNumberInput.trim();
  if (vehicleNumber === '') return { ok: true, body: {} };
  if (vehicleNumber.length > VEHICLE_NUMBER_MAX_LENGTH) return { ok: false };
  return { ok: true, body: { vehicleNumber } };
}

export interface MessageLine {
  key: TranslationKey;
  params?: Record<string, number>;
}

/**
 * What to show after verify-otp failed. A wrong code (OTP_INVALID) also says how
 * many attempts are left, read from the problem's `meta.remainingAttempts`; a
 * locked code, a malformed code and every other failure (network, wrong status)
 * get their own wording, so a dropped connection is never shown as a wrong code.
 */
export function pickupOtpErrorLines(err: unknown): MessageLine[] {
  if (err instanceof PickupOtpFormatError) return [{ key: 'orders.pickup.formatError' }];
  if (err instanceof ApiError && err.problem.code === 'OTP_INVALID') {
    const remaining = err.problem.meta?.['remainingAttempts'];
    const lines: MessageLine[] = [{ key: 'admin.error.OTP_INVALID' }];
    if (typeof remaining === 'number' && Number.isInteger(remaining) && remaining >= 0) {
      lines.push({ key: 'orders.pickup.attemptsLeft', params: { count: remaining } });
    }
    return lines;
  }
  return [{ key: adminErrorKey(err) }];
}
