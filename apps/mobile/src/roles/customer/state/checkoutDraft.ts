/**
 * Cart -> Checkout hand-off. The cart screen writes what the customer picked
 * (fulfilment, warehouse, address, date, slot); checkout reads it, quotes it
 * and places the order. No totals live here: the quote is the only source.
 *
 * `notice` carries a one-shot message back to the cart (e.g. checkout hit a
 * 409 STOCK_UNAVAILABLE and sent the customer back to fix quantities).
 */
import { useSyncExternalStore } from 'react';
import type { CheckoutInput, DeliverySlot, FulfillmentType } from '../api/orders';

export interface CheckoutDraft {
  fulfillmentType: FulfillmentType;
  /** Pickup point id = warehouse id (stock is per warehouse). */
  warehouseId: string;
  deliveryAddressId?: string | null | undefined;
  deliveryDate?: string | undefined;
  deliverySlot?: DeliverySlot | undefined;
  notes?: string | undefined;
}

interface DraftState {
  draft: CheckoutDraft | null;
  /** One-shot banner for the cart screen. */
  notice: string | null;
  /** Server said home delivery is disabled (501): offer pickup only. */
  homeDeliveryDisabled: boolean;
}

let state: DraftState = { draft: null, notice: null, homeDeliveryDisabled: false };
const listeners = new Set<() => void>();

function emit(next: Partial<DraftState>): void {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export const checkoutDraftStore = {
  get: (): DraftState => state,
  setDraft: (draft: CheckoutDraft | null): void => emit({ draft }),
  patchDraft: (patch: Partial<CheckoutDraft>): void =>
    emit({ draft: state.draft ? { ...state.draft, ...patch } : null }),
  setNotice: (notice: string | null): void => emit({ notice }),
  setHomeDeliveryDisabled: (homeDeliveryDisabled: boolean): void => emit({ homeDeliveryDisabled }),
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  /** Test helper. */
  reset: (): void => emit({ draft: null, notice: null, homeDeliveryDisabled: false }),
};

export function useCheckoutDraftState(): DraftState {
  return useSyncExternalStore(checkoutDraftStore.subscribe, checkoutDraftStore.get, checkoutDraftStore.get);
}

/** The draft as a (possibly incomplete) checkout input; quoted as WALLET, the screen sets the chosen method at checkout. */
export function draftToInput(draft: CheckoutDraft | null): Partial<CheckoutInput> | null {
  if (!draft) return null;
  if (draft.fulfillmentType === 'WAREHOUSE_PICKUP') {
    return {
      fulfillmentType: 'WAREHOUSE_PICKUP',
      warehouseId: draft.warehouseId,
      paymentMethod: 'WALLET',
      notes: draft.notes,
    };
  }
  return { ...draft, paymentMethod: 'WALLET' };
}
