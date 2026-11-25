/**
 * A gateway-paid order (UPI / CARD / NETBANKING) whose payment outcome the app
 * does not know yet, persisted so it survives the app being killed inside the
 * Razorpay sheet (BR-220 / BR-222). Same shape and reasoning as
 * ./pendingTopup.ts.
 *
 * Lifecycle:
 *   - `startOrderPayment` (../api/orderPayment) saves `{orderId, gatewayOrderId,
 *     createdAt, expiresAt}` once the server returned the PENDING_PAYMENT order
 *     and right before the sheet opens; it clears the record once the server
 *     reports a terminal status (CONFIRMED / CANCELLED), or the customer
 *     cancels the order. SDK cancel / failure and an unconfirmed poll leave it
 *     in place (the order is still awaiting payment server-side).
 *   - `resumePendingOrderPayment()` polls `GET /orders/{id}` with backoff until
 *     the status leaves PENDING_PAYMENT, a 404/403 (not this user's order), or
 *     the payment window (+ grace for the server's expiry sweep) has passed.
 *     A terminal order is kept as a one-shot `resolved` notice.
 *   - Logout clears it.
 *
 * The order is never confirmed client-side (BR-224): this only decides what
 * the UI may honestly say.
 */
import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Money } from '@tohfa/shared-types';
import { ApiError } from '../../../shell/api/client';
import { fetchOrder, type Order } from '../api/orders';

export const PENDING_ORDER_PAYMENT_STORAGE_KEY = 'TOHFA_CUSTOMER_PENDING_ORDER_PAYMENT_V1';
/** Fallback window when the server sent no `expiresAt` (it defaults to 15 min). */
export const PENDING_ORDER_PAYMENT_TTL_MS = 30 * 60 * 1000;
/** Keep polling this long past `expiresAt`: the expiry sweep runs every minute. */
export const PENDING_ORDER_PAYMENT_GRACE_MS = 3 * 60 * 1000;

export interface PendingOrderPayment {
  orderId: string;
  gatewayOrderId: string;
  /** Epoch ms on this device when the pending order was created. */
  createdAt: number;
  /** Server `payment.expiresAt` (ISO). */
  expiresAt?: string;
  amount?: Money;
}

export interface PendingOrderPaymentState {
  pending: PendingOrderPayment | null;
  /** One-shot: the terminal order a resumed poll found. Cleared by `dismissResolvedOrderPayment`. */
  resolved: Order | null;
}

let state: PendingOrderPaymentState = { pending: null, resolved: null };
const listeners = new Set<() => void>();
let inFlight: { orderId: string; promise: Promise<Order | null> } | null = null;

function emit(next: Partial<PendingOrderPaymentState>): void {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export const pendingOrderPaymentStore = {
  get: (): PendingOrderPaymentState => state,
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  /** Test helper: forget in-memory state (storage untouched). */
  resetMemory: (): void => {
    inFlight = null;
    emit({ pending: null, resolved: null });
  },
};

function parse(raw: string | null): PendingOrderPayment | null {
  if (raw === null) return null;
  try {
    const v = JSON.parse(raw) as Partial<PendingOrderPayment> | null;
    if (v === null || typeof v !== 'object') return null;
    if (typeof v.orderId !== 'string' || v.orderId.length === 0) return null;
    if (typeof v.gatewayOrderId !== 'string' || v.gatewayOrderId.length === 0) return null;
    if (typeof v.createdAt !== 'number' || !Number.isFinite(v.createdAt)) return null;
    const out: PendingOrderPayment = { orderId: v.orderId, gatewayOrderId: v.gatewayOrderId, createdAt: v.createdAt };
    if (typeof v.expiresAt === 'string') out.expiresAt = v.expiresAt;
    if (typeof v.amount === 'string') out.amount = v.amount;
    return out;
  } catch {
    return null;
  }
}

/** Epoch ms after which polling stops for this record. */
export function pendingOrderPaymentDeadline(p: PendingOrderPayment): number {
  const exp = p.expiresAt !== undefined ? Date.parse(p.expiresAt) : Number.NaN;
  return Number.isFinite(exp) ? exp + PENDING_ORDER_PAYMENT_GRACE_MS : p.createdAt + PENDING_ORDER_PAYMENT_TTL_MS;
}

export async function savePendingOrderPayment(p: PendingOrderPayment): Promise<void> {
  emit({ pending: p, resolved: null });
  try {
    await AsyncStorage.setItem(PENDING_ORDER_PAYMENT_STORAGE_KEY, JSON.stringify(p));
  } catch {
    // best effort: the in-memory record still drives this session
  }
}

/** Clear the record; with `orderId`, only if it is still the current one. */
export async function clearPendingOrderPayment(orderId?: string): Promise<void> {
  if (orderId !== undefined && state.pending !== null && state.pending.orderId !== orderId) return;
  if (state.pending !== null) emit({ pending: null });
  try {
    if (orderId !== undefined) {
      const stored = parse(await AsyncStorage.getItem(PENDING_ORDER_PAYMENT_STORAGE_KEY));
      if (stored !== null && stored.orderId !== orderId) return;
    }
    await AsyncStorage.removeItem(PENDING_ORDER_PAYMENT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Logout: drop the record and any notice. */
export async function clearPendingOrderPaymentForLogout(): Promise<void> {
  inFlight = null;
  emit({ pending: null, resolved: null });
  try {
    await AsyncStorage.removeItem(PENDING_ORDER_PAYMENT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Read the persisted record into memory; an expired one is cleared and null returned. */
export async function loadPendingOrderPayment(now: number = Date.now()): Promise<PendingOrderPayment | null> {
  let stored: PendingOrderPayment | null = null;
  try {
    stored = parse(await AsyncStorage.getItem(PENDING_ORDER_PAYMENT_STORAGE_KEY));
  } catch {
    stored = null;
  }
  const current = stored ?? state.pending;
  if (current === null) return null;
  if (now >= pendingOrderPaymentDeadline(current)) {
    await clearPendingOrderPayment(current.orderId);
    return null;
  }
  if (state.pending?.orderId !== current.orderId) emit({ pending: current });
  return current;
}

export function dismissResolvedOrderPayment(): void {
  if (state.resolved !== null) emit({ resolved: null });
}

export interface ResumeOrderPaymentDeps {
  fetchOrder: (orderId: string) => Promise<Order>;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
  initialIntervalMs: number;
  maxIntervalMs: number;
}

const defaultResumeDeps: ResumeOrderPaymentDeps = {
  fetchOrder: (id) => fetchOrder(id),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now: () => Date.now(),
  initialIntervalMs: 3000,
  maxIntervalMs: 30000,
};

/**
 * Resume polling the persisted pending order, if any. Resolves with the order
 * once it left PENDING_PAYMENT (CONFIRMED, CANCELLED, ...), or null when there
 * was nothing to poll, the window passed, it is not visible to this user, or
 * the record was cleared/replaced meanwhile. Concurrent callers share one loop.
 */
export function resumePendingOrderPayment(overrides: Partial<ResumeOrderPaymentDeps> = {}): Promise<Order | null> {
  const deps: ResumeOrderPaymentDeps = { ...defaultResumeDeps, ...overrides };
  if (inFlight !== null && (state.pending === null || inFlight.orderId === '' || inFlight.orderId === state.pending.orderId)) {
    return inFlight.promise;
  }
  const holder: { orderId: string; promise: Promise<Order | null> } = {
    orderId: state.pending?.orderId ?? '',
    promise: Promise.resolve(null),
  };
  const run = async (): Promise<Order | null> => {
    const p = await loadPendingOrderPayment(deps.now());
    if (p === null) return null;
    holder.orderId = p.orderId;
    const deadline = pendingOrderPaymentDeadline(p);
    let interval = deps.initialIntervalMs;
    for (;;) {
      if (state.pending?.orderId !== p.orderId) return null; // cleared or replaced
      try {
        const order = await deps.fetchOrder(p.orderId);
        if (order.status !== 'PENDING_PAYMENT') {
          if (state.pending?.orderId !== p.orderId) return null;
          await clearPendingOrderPayment(p.orderId);
          emit({ resolved: order });
          return order;
        }
      } catch (err) {
        if (err instanceof ApiError && (err.status === 404 || err.status === 403)) {
          await clearPendingOrderPayment(p.orderId);
          return null;
        }
        if (err instanceof ApiError && err.status === 401) return null; // keep for after re-login
        // offline / 5xx: keep polling
      }
      const now = deps.now();
      if (now >= deadline) {
        await clearPendingOrderPayment(p.orderId);
        return null;
      }
      await deps.sleep(Math.min(interval, Math.max(0, deadline - now)));
      interval = Math.min(Math.round(interval * 1.5), deps.maxIntervalMs);
    }
  };
  holder.promise = run().finally(() => {
    if (inFlight === holder) inFlight = null;
  });
  inFlight = holder;
  return holder.promise;
}

export function usePendingOrderPaymentState(): PendingOrderPaymentState {
  return useSyncExternalStore(pendingOrderPaymentStore.subscribe, pendingOrderPaymentStore.get, pendingOrderPaymentStore.get);
}
