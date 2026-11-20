/**
 * Customer server cart (docs/openapi.yaml `Cart`, BR-12/BR-22/BR-203):
 *   GET /cart, PUT /cart (replace everything, re-reserves, restarts the 24h lock),
 *   POST /cart/items (adds or INCREMENTS one line), DELETE /cart (204).
 * There is no per-line PATCH/DELETE: a quantity change or a removal is a PUT of
 * the whole cart. Quantities are kg decimal strings (`qtyKg`), money is `Money`.
 *
 * Errors are never swallowed here (a 401 must reach the session flow, a 5xx the
 * error UI). 409 STOCK_UNAVAILABLE / INSUFFICIENT_ALLOCATION / CART_LOCK_EXPIRED
 * surface as ApiError; screens map them with mapProblem().
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Money } from '@tohfa/shared-types';
import { api, getAccessToken } from '../../../shell/api/client';
import type { CertificationType, SellableGrade } from './catalog';
import { multiplyMoney, qtyToGrams, sumMoney, type Quantity } from '../utils/money';

export type CartStatus = 'ACTIVE' | 'LOCKED' | 'CONVERTED' | 'EXPIRED';
export type CartLineAvailability = 'OK' | 'LOW_STOCK' | 'UNAVAILABLE';

export interface CartLine {
  id: string;
  productId: string;
  name: string;
  grade: SellableGrade;
  qtyKg: Quantity;
  /** Per kg. */
  unitPrice: Money;
  lineTotal: Money;
  certificationBadges?: CertificationType[];
  /** BR-203: UNAVAILABLE = checkout would be 409; LOW_STOCK = little further stock. */
  availability: CartLineAvailability;
  /** The most this line could hold right now (stepper max). */
  availableKg: Quantity;
}
/** @deprecated old name. */
export type CartItem = CartLine;

export interface Cart {
  id: string;
  warehouseId?: string | null;
  status: CartStatus;
  items: CartLine[];
  subtotal: Money;
  lockedAt?: string | null;
  /** Locked + 24 h (BR-22); null while the cart is not locked. */
  lockExpiresAt?: string | null;
}
/** @deprecated old name. */
export type CartResponse = Cart;

/** docs/openapi.yaml `CartItemCreate`. */
export interface CartItemInput {
  productId: string;
  grade: SellableGrade;
  qtyKg: Quantity;
}

export interface CartReplaceInput {
  warehouseId?: string | null | undefined;
  items: CartItemInput[];
}

export const cartQueryKeys = {
  cart: ['cart'] as const,
};

/** `${productId}:${grade}` of a cart line. */
export function cartLineKey(line: { productId: string; grade: string }): string {
  return `${line.productId}:${line.grade}`;
}

/** The PUT body lines of a cart as it stands. */
export function cartToPutItems(cart: Pick<Cart, 'items'>): CartItemInput[] {
  return cart.items.map((l) => ({ productId: l.productId, grade: l.grade, qtyKg: l.qtyKg }));
}

export function fetchCart(signal?: AbortSignal): Promise<Cart> {
  return api.get<Cart>('/cart', signal);
}

export function addCartItem(input: CartItemInput): Promise<Cart> {
  return api.post<Cart>('/cart/items', { productId: input.productId, grade: input.grade, qtyKg: input.qtyKg });
}

export function replaceCart(input: CartReplaceInput): Promise<Cart> {
  const body: Record<string, unknown> = { items: input.items };
  if (input.warehouseId) body['warehouseId'] = input.warehouseId;
  return api.put<Cart>('/cart', body);
}

export function clearCart(): Promise<void> {
  return api.delete<void>('/cart');
}

/** CART_LOCK_EXPIRED recovery: PUT the current lines again (re-reserves, restarts the lock). */
export function reReserveCart(cart: Cart, warehouseId?: string | null): Promise<Cart> {
  return replaceCart({ warehouseId: warehouseId ?? cart.warehouseId ?? undefined, items: cartToPutItems(cart) });
}

/** Number of lines in the cart (the cart bar count). */
export function cartLineCount(cart: Cart | null | undefined): number {
  return cart?.items.length ?? 0;
}

/**
 * Optimistic cart after setting the line `key` to `qtyKg` (zero removes it).
 * Totals are recomputed client-side (integer paise) only until the server answers.
 */
export function withLineQty(cart: Cart, key: string, qtyKg: Quantity): Cart {
  const items = cart.items
    .map((l) => (cartLineKey(l) === key ? { ...l, qtyKg, lineTotal: multiplyMoney(l.unitPrice, qtyKg) } : l))
    .filter((l) => (qtyToGrams(l.qtyKg) ?? 0) > 0);
  return { ...cart, items, subtotal: sumMoney(items.map((l) => l.lineTotal)) };
}

export const useCart = () =>
  useQuery({
    queryKey: cartQueryKeys.cart,
    queryFn: ({ signal }) => fetchCart(signal),
    enabled: !!getAccessToken(),
    staleTime: 15_000,
  });

/** POST /cart/items (increments an existing line). The returned cart replaces the cache. */
export const useAddToCart = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CartItemInput) => addCartItem(input),
    onSuccess: (cart) => {
      qc.setQueryData(cartQueryKeys.cart, cart);
    },
  });
};

/**
 * PUT /cart with an optimistic cache write. On error the previous cart is
 * restored and the cart refetched (409 = the server refused the new state).
 * `optimistic` (optional) is the cart to show while the request is in flight.
 */
export const useReplaceCart = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CartReplaceInput & { optimistic?: Cart }) =>
      replaceCart({ warehouseId: input.warehouseId, items: input.items }),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: cartQueryKeys.cart });
      const previous = qc.getQueryData<Cart>(cartQueryKeys.cart);
      if (input.optimistic) qc.setQueryData(cartQueryKeys.cart, input.optimistic);
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous !== undefined) qc.setQueryData(cartQueryKeys.cart, ctx.previous);
      void qc.invalidateQueries({ queryKey: cartQueryKeys.cart });
    },
    onSuccess: (cart) => {
      qc.setQueryData(cartQueryKeys.cart, cart);
    },
  });
};
/** @deprecated old name. */
export const useUpdateCart = useReplaceCart;

export const useClearCart = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => clearCart(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: cartQueryKeys.cart });
    },
  });
};
