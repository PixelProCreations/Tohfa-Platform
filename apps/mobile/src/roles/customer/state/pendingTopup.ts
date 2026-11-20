/**
 * A wallet top-up whose outcome the app does not know yet, persisted so it
 * survives the app being killed mid-payment.
 *
 * Lifecycle:
 *   - `startWalletTopup` saves `{topupId, createdAt}` once the server intent
 *     exists and right before the Razorpay sheet opens (so a kill inside the
 *     sheet is covered), and clears it on every known outcome (success,
 *     failed, cancelled). A `pending` outcome leaves it in place.
 *   - `resumePendingTopup()` (app launch + Wallet screen mount) polls
 *     `GET /wallets/me/topups/{id}` with backoff until SUCCESS/FAILED, a 404
 *     (not this user's top-up, e.g. another account signed in), or 30 minutes
 *     after `createdAt` -- then clears it. A terminal result is kept as a
 *     one-shot `resolved` notice for the Wallet screen.
 *   - Logout clears it.
 *
 * Plain AsyncStorage, not the Keychain: a top-up id is not a secret (it is
 * useless without the owner's access token), same tier reasoning as
 * roles/farmer/storage/registrationDraft.ts. The wallet is never credited
 * client-side; this only decides what the UI may honestly say.
 */
import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Money } from '@tohfa/shared-types';
import { ApiError } from '../../../shell/api/client';
import { fetchTopupReceipt, type TopupReceipt } from '../api/wallet';

export const PENDING_TOPUP_STORAGE_KEY = 'TOHFA_CUSTOMER_PENDING_TOPUP_V1';
/** Stop polling (and drop the banner) this long after the top-up was created. */
export const PENDING_TOPUP_TTL_MS = 30 * 60 * 1000;

export interface PendingTopup {
  topupId: string;
  /** Epoch ms on this device when the intent was created. */
  createdAt: number;
  amount?: Money;
}

export interface PendingTopupState {
  pending: PendingTopup | null;
  /** One-shot: the terminal receipt a resumed poll found. Cleared by `dismissResolvedTopup`. */
  resolved: TopupReceipt | null;
}

let state: PendingTopupState = { pending: null, resolved: null };
const listeners = new Set<() => void>();

function emit(next: Partial<PendingTopupState>): void {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export const pendingTopupStore = {
  get: (): PendingTopupState => state,
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

function parse(raw: string | null): PendingTopup | null {
  if (raw === null) return null;
  try {
    const v = JSON.parse(raw) as Partial<PendingTopup> | null;
    if (v === null || typeof v !== 'object') return null;
    if (typeof v.topupId !== 'string' || v.topupId.length === 0) return null;
    if (typeof v.createdAt !== 'number' || !Number.isFinite(v.createdAt)) return null;
    return typeof v.amount === 'string'
      ? { topupId: v.topupId, createdAt: v.createdAt, amount: v.amount }
      : { topupId: v.topupId, createdAt: v.createdAt };
  } catch {
    return null;
  }
}

export async function savePendingTopup(p: PendingTopup): Promise<void> {
  emit({ pending: p, resolved: null });
  try {
    await AsyncStorage.setItem(PENDING_TOPUP_STORAGE_KEY, JSON.stringify(p));
  } catch {
    // best effort: the in-memory record still drives this session
  }
}

/** Clear the record; with `topupId`, only if it is still the current one. */
export async function clearPendingTopup(topupId?: string): Promise<void> {
  if (topupId !== undefined && state.pending !== null && state.pending.topupId !== topupId) return;
  if (state.pending !== null) emit({ pending: null });
  try {
    if (topupId !== undefined) {
      const stored = parse(await AsyncStorage.getItem(PENDING_TOPUP_STORAGE_KEY));
      if (stored !== null && stored.topupId !== topupId) return;
    }
    await AsyncStorage.removeItem(PENDING_TOPUP_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Logout: drop the record and any notice. */
export async function clearPendingTopupForLogout(): Promise<void> {
  inFlight = null;
  emit({ pending: null, resolved: null });
  try {
    await AsyncStorage.removeItem(PENDING_TOPUP_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Read the persisted record into memory; an expired one is cleared and null returned. */
export async function loadPendingTopup(now: number = Date.now()): Promise<PendingTopup | null> {
  let stored: PendingTopup | null = null;
  try {
    stored = parse(await AsyncStorage.getItem(PENDING_TOPUP_STORAGE_KEY));
  } catch {
    stored = null;
  }
  const current = stored ?? state.pending;
  if (current === null) return null;
  if (now >= current.createdAt + PENDING_TOPUP_TTL_MS) {
    await clearPendingTopup(current.topupId);
    return null;
  }
  if (state.pending?.topupId !== current.topupId) emit({ pending: current });
  return current;
}

export function dismissResolvedTopup(): void {
  if (state.resolved !== null) emit({ resolved: null });
}

export interface ResumeDeps {
  fetchTopupReceipt: (topupId: string) => Promise<TopupReceipt>;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
  initialIntervalMs: number;
  maxIntervalMs: number;
}

const defaultResumeDeps: ResumeDeps = {
  fetchTopupReceipt: (id) => fetchTopupReceipt(id),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now: () => Date.now(),
  initialIntervalMs: 3000,
  maxIntervalMs: 30000,
};

let inFlight: { topupId: string; promise: Promise<TopupReceipt | null> } | null = null;

/**
 * Resume polling the persisted top-up, if any. Resolves with the terminal
 * receipt (SUCCESS/FAILED), or null when there was nothing to poll, it
 * expired, it is not visible to this user (404), or it was cleared/replaced
 * meanwhile. Concurrent callers for the same top-up share one poll loop.
 */
export function resumePendingTopup(overrides: Partial<ResumeDeps> = {}): Promise<TopupReceipt | null> {
  const deps: ResumeDeps = { ...defaultResumeDeps, ...overrides };
  if (inFlight !== null && (state.pending === null || inFlight.topupId === '' || inFlight.topupId === state.pending.topupId)) {
    return inFlight.promise;
  }
  const holder: { topupId: string; promise: Promise<TopupReceipt | null> } = {
    topupId: state.pending?.topupId ?? '',
    promise: Promise.resolve(null),
  };
  const run = async (): Promise<TopupReceipt | null> => {
    const p = await loadPendingTopup(deps.now());
    if (p === null) return null;
    holder.topupId = p.topupId;
    const expiresAt = p.createdAt + PENDING_TOPUP_TTL_MS;
    let interval = deps.initialIntervalMs;
    for (;;) {
      if (state.pending?.topupId !== p.topupId) return null; // cleared or replaced
      try {
        const receipt = await deps.fetchTopupReceipt(p.topupId);
        if (receipt.status !== 'PENDING') {
          if (state.pending?.topupId !== p.topupId) return null;
          await clearPendingTopup(p.topupId);
          emit({ resolved: receipt });
          return receipt;
        }
      } catch (err) {
        if (err instanceof ApiError && (err.status === 404 || err.status === 403)) {
          await clearPendingTopup(p.topupId);
          return null;
        }
        if (err instanceof ApiError && err.status === 401) {
          // session is gone (refresh failed); keep the record for after re-login
          return null;
        }
        // offline / 5xx: keep polling
      }
      const now = deps.now();
      if (now >= expiresAt) {
        await clearPendingTopup(p.topupId);
        return null;
      }
      await deps.sleep(Math.min(interval, Math.max(0, expiresAt - now)));
      interval = Math.min(Math.round(interval * 1.5), deps.maxIntervalMs);
    }
  };
  holder.promise = run().finally(() => {
    if (inFlight === holder) inFlight = null;
  });
  inFlight = holder;
  return holder.promise;
}

export function usePendingTopupState(): PendingTopupState {
  return useSyncExternalStore(pendingTopupStore.subscribe, pendingTopupStore.get, pendingTopupStore.get);
}
