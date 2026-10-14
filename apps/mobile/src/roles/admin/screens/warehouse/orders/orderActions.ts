/**
 * Pack, mark ready (POST .../dispatch) and the pickup OTP handover, made safe
 * to retry.
 *
 * WHY this is more than one call: docs/openapi.yaml asks for an
 * Idempotency-Key on all three writes and the app sends one, but the server
 * ignores it today (server gap). A write that times out may still have been
 * applied, and a blind retry would then hit a 409 (or, for a delivery order,
 * move it again). So:
 *  - after a write whose outcome is unknown (timeout, network, 5xx) the order
 *    is re-read at once, and a status that has already moved past the action
 *    (actionLanded) counts as done;
 *  - when that re-read fails too, the outcome stays unknown, and the next
 *    attempt re-reads first and posts only if the status has not moved;
 *  - a 409 INVALID_STATE_TRANSITION is also re-read: it is what a replay of a
 *    write that already landed returns;
 *  - any other refusal (OTP_INVALID, OTP_LOCKED, 403, 404) is a plain failure,
 *    shown to the admin; nothing is retried behind their back, so a wrong OTP
 *    is never sent twice.
 *
 * Pure apart from the injected calls (`deps`), so plain-Node vitest drives
 * every path (../../../tests/mappers_orders.test.ts). The screen holds the
 * state between attempts and passes calls that carry its Idempotency-Key.
 */
import { ApiError } from '../../../../../shell/api/client';
import type { OrderDto } from '../../../api/orders';
import { isOutcomeUnknown } from '../receiving-qc/mappers';
import { actionLanded } from './mappers';
import type { OrderAction } from './types';

export interface OrderActionState {
  /** The last attempt failed in a way that may still have written it. */
  unknown: boolean;
}

export const INITIAL_ORDER_ACTION_STATE: OrderActionState = { unknown: false };

export interface OrderActionDeps {
  /** The write itself, with the screen's Idempotency-Key. */
  post: () => Promise<OrderDto>;
  /** The order's stored status, re-read from GET /admin/orders/{orderId}. */
  currentStatus: () => Promise<string>;
}

export type OrderActionStage = 'post' | 'verify';

export type OrderActionOutcome =
  | { kind: 'done'; state: OrderActionState }
  | { kind: 'failed'; state: OrderActionState; stage: OrderActionStage; error: unknown };

function isStateConflict(error: unknown): boolean {
  return error instanceof ApiError && error.problem.code === 'INVALID_STATE_TRANSITION';
}

export async function performOrderAction(
  initial: OrderActionState,
  action: OrderAction,
  deps: OrderActionDeps,
): Promise<OrderActionOutcome> {
  if (initial.unknown) {
    let status: string;
    try {
      status = await deps.currentStatus();
    } catch (error) {
      // Still unknown: posting now could apply the action twice.
      return { kind: 'failed', state: initial, stage: 'verify', error };
    }
    if (actionLanded(action, status)) return { kind: 'done', state: INITIAL_ORDER_ACTION_STATE };
  }

  try {
    await deps.post();
    return { kind: 'done', state: INITIAL_ORDER_ACTION_STATE };
  } catch (error) {
    const unknown = isOutcomeUnknown(error);
    if (!unknown && !isStateConflict(error)) {
      return { kind: 'failed', state: INITIAL_ORDER_ACTION_STATE, stage: 'post', error };
    }
    try {
      const status = await deps.currentStatus();
      if (actionLanded(action, status)) return { kind: 'done', state: INITIAL_ORDER_ACTION_STATE };
    } catch {
      // The re-read failed as well; the outcome stays as unknown as the write's.
    }
    return { kind: 'failed', state: { unknown }, stage: 'post', error };
  }
}
