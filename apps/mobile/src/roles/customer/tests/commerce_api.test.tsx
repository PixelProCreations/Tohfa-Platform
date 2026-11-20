/**
 * Flow B data layer: request shapes match docs/openapi.yaml, optimistic caches
 * roll back, idempotency keys are stable per checkout attempt.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Problem } from '@tohfa/shared-types';
import * as client from '../../../shell/api/client';
import { ApiError } from '../../../shell/api/client';
import { buildProductsQuery, fetchProducts } from '../api/catalog';
import { withLineQty, type Cart } from '../api/cart';
import {
  checkoutFingerprint,
  isCheckoutInputComplete,
  isReturnEligible,
  isReviewEligible,
  orderIdempotencyKeys,
  placeOrder,
  toCheckoutBody,
  trackingInterval,
  type CheckoutInput,
} from '../api/orders';
import { fetchOrderReview, toReviewBody } from '../api/reviews';
import { toReturnBody } from '../api/returns';
import { getInvoiceDownloadUrl } from '../api/invoices';
import { useToggleWishlist, wishlistQueryKeys, type WishlistResponse } from '../api/wishlist';
import { defaultPickupPoint, type PickupPoint } from '../api/pickup';

function problem(status: number, code: string, extra: Record<string, unknown> = {}): ApiError {
  return new ApiError({ type: 'about:blank', title: code, status, code, ...extra } as unknown as Problem);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('catalog requests', () => {
  it('sends only the strict allow-list keys', () => {
    const qs = buildProductsQuery({ categoryId: 'c1', sort: 'just_arrived', limit: 20 }, 'CUR');
    expect(qs).toContain('categoryId=c1');
    expect(qs).toContain('sort=just_arrived');
    expect(qs).toContain('cursor=CUR');
    expect(qs).not.toMatch(/sortBy|page=/);
  });

  it('fetchProducts hits /catalog/products with the cursor', async () => {
    const get = vi.spyOn(client.api, 'get').mockResolvedValue({ items: [], page: { nextCursor: null, hasMore: false } });
    await fetchProducts({ grade: 'GRADE_2' }, 'abc');
    expect(get.mock.calls[0]?.[0]).toBe('/catalog/products?cursor=abc&grade=GRADE_2');
  });
});

describe('checkout body + idempotency', () => {
  const pickup: CheckoutInput = { fulfillmentType: 'WAREHOUSE_PICKUP', warehouseId: 'w1', paymentMethod: 'WALLET' };
  const delivery: CheckoutInput = {
    fulfillmentType: 'HOME_DELIVERY',
    warehouseId: 'w1',
    deliveryAddressId: 'a1',
    deliveryDate: '2026-11-18',
    deliverySlot: 'MORNING_8_12',
    paymentMethod: 'WALLET',
  };

  it('pickup omits delivery fields; payment is always WALLET', () => {
    expect(toCheckoutBody({ ...pickup, deliverySlot: 'EVENING_4_8' })).toEqual({
      fulfillmentType: 'WAREHOUSE_PICKUP',
      warehouseId: 'w1',
      paymentMethod: 'WALLET',
    });
    expect(toCheckoutBody(delivery)).toMatchObject({ deliveryAddressId: 'a1', deliveryDate: '2026-11-18', deliverySlot: 'MORNING_8_12' });
  });

  it('delivery needs address, date and slot', () => {
    expect(isCheckoutInputComplete(pickup)).toBe(true);
    expect(isCheckoutInputComplete({ ...delivery, deliverySlot: undefined })).toBe(false);
    expect(isCheckoutInputComplete(delivery)).toBe(true);
  });

  it('same payload replays the same Idempotency-Key, a changed one gets a new key', async () => {
    orderIdempotencyKeys.reset();
    const k1 = orderIdempotencyKeys.keyFor(checkoutFingerprint(delivery));
    const k2 = orderIdempotencyKeys.keyFor(checkoutFingerprint({ ...delivery }));
    expect(k2).toBe(k1);
    const k3 = orderIdempotencyKeys.keyFor(checkoutFingerprint({ ...delivery, deliverySlot: 'EVENING_4_8' }));
    expect(k3).not.toBe(k1);

    const post = vi.spyOn(client.api, 'post').mockRejectedValueOnce(problem(402, 'WALLET_INSUFFICIENT')).mockResolvedValueOnce({ id: 'o1' });
    await expect(placeOrder(delivery, k3)).rejects.toBeInstanceOf(ApiError);
    await placeOrder(delivery, k3);
    expect(post.mock.calls[0]?.[2]).toBe(k3);
    expect(post.mock.calls[1]?.[2]).toBe(k3);
    expect(post.mock.calls[0]?.[0]).toBe('/orders');
  });
});

describe('order status helpers', () => {
  it('tracking polls with backoff and stops on terminal', () => {
    expect(trackingInterval('CONFIRMED', 0)).toBe(5000);
    expect(trackingInterval('CONFIRMED', 1)).toBe(10000);
    expect(trackingInterval('PACKED', 9)).toBe(30000);
    expect(trackingInterval('DELIVERED', 0)).toBe(false);
    expect(trackingInterval('PICKED_UP', 0)).toBe(false);
    expect(trackingInterval('CANCELLED', 0)).toBe(false);
  });

  it('review/return eligibility', () => {
    expect(isReviewEligible('DELIVERED')).toBe(true);
    expect(isReviewEligible('PICKED_UP')).toBe(true);
    expect(isReviewEligible('PACKED')).toBe(false);
    expect(isReturnEligible('CANCELLED')).toBe(false);
  });
});

describe('cart optimistic helper', () => {
  const cart = {
    id: 'c',
    status: 'ACTIVE',
    subtotal: '345.00',
    items: [
      { id: 'l1', productId: 'p1', name: 'Carrot', grade: 'GRADE_1', qtyKg: '1.000', unitPrice: '69.00', lineTotal: '69.00', availability: 'OK', availableKg: '10.000' },
      { id: 'l2', productId: 'p2', name: 'Beans', grade: 'GRADE_2', qtyKg: '2.000', unitPrice: '138.00', lineTotal: '276.00', availability: 'OK', availableKg: '10.000' },
    ],
  } as unknown as Cart;
  it('recomputes the line and subtotal in paise', () => {
    const next = withLineQty(cart, 'p1:GRADE_1', '1.500');
    expect(next.items[0]?.lineTotal).toBe('103.50');
    expect(next.subtotal).toBe('379.50');
  });
  it('zero removes the line', () => {
    expect(withLineQty(cart, 'p2:GRADE_2', '0.000').items).toHaveLength(1);
  });
});

describe('review + return bodies', () => {
  it('review: unique enum tags, empty comments omitted', () => {
    expect(
      toReviewBody({
        rating: 4,
        tags: ['FRESHNESS', 'FRESHNESS', 'BOGUS' as never],
        comment: '  ',
        items: [{ orderItemId: 'oi1', rating: 5, comment: '' }],
      }),
    ).toEqual({ rating: 4, tags: ['FRESHNESS'], items: [{ orderItemId: 'oi1', rating: 5 }] });
  });

  it('return: photos capped at 5, note trimmed', () => {
    const body = toReturnBody({
      reason: 'Spoiled',
      items: [{ orderItemId: 'oi1', qty: '1.000' }],
      note: ' moldy ',
      photoUploadIds: ['1', '2', '3', '4', '5', '6'],
    });
    expect(body).toEqual({ reason: 'Spoiled', items: [{ orderItemId: 'oi1', qty: '1.000' }], note: 'moldy', photoUploadIds: ['1', '2', '3', '4', '5'] });
  });

  it('GET review 404 means no review yet', async () => {
    vi.spyOn(client.api, 'get').mockRejectedValue(problem(404, 'NOT_FOUND'));
    await expect(fetchOrderReview('o1')).resolves.toBeNull();
  });
});

describe('invoice download', () => {
  it('returns the followed signed link', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200, url: 'https://cdn/x.pdf?token=t&expires=1', json: async () => ({}) });
    await expect(getInvoiceDownloadUrl('inv1', fetchImpl)).resolves.toBe('https://cdn/x.pdf?token=t&expires=1');
    expect(String(fetchImpl.mock.calls[0]?.[0])).toContain('/v1/invoices/inv1/download?redirect=true');
  });
  it('maps a 404 to ApiError', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      url: '',
      json: async () => ({ type: 'x', title: 'Not found', status: 404, code: 'NOT_FOUND' }),
    });
    await expect(getInvoiceDownloadUrl('inv1', fetchImpl)).rejects.toMatchObject({ status: 404 });
  });
});

describe('pickup preselection', () => {
  const pts = [
    { id: 'a', name: 'Ooty', isNearest: false },
    { id: 'b', name: 'Coonoor', isNearest: true },
  ] as PickupPoint[];
  it('prefers the given id, then the nearest', () => {
    expect(defaultPickupPoint(pts, 'a')?.id).toBe('a');
    expect(defaultPickupPoint(pts, null)?.id).toBe('b');
    expect(defaultPickupPoint([], null)).toBeNull();
  });
});

describe('wishlist toggle', () => {
  let qc: QueryClient;
  let toggle: ReturnType<typeof useToggleWishlist> | null = null;
  function Harness() {
    toggle = useToggleWishlist();
    return null;
  }
  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    qc.setQueryData<WishlistResponse>(wishlistQueryKeys.wishlist, { items: [] });
    act(() => {
      renderer.create(
        <QueryClientProvider client={qc}>
          <Harness />
        </QueryClientProvider>,
      );
    });
  });

  it('adds optimistically and rolls back on error', async () => {
    let reject: (e: unknown) => void = () => undefined;
    vi.spyOn(client.api, 'post').mockReturnValue(new Promise((_r, j) => (reject = j)));
    vi.spyOn(client.api, 'get').mockResolvedValue({ items: [] });
    let p: Promise<unknown> | undefined;
    await act(async () => {
      p = toggle!.mutateAsync({ productId: 'p1', grade: 'GRADE_1', add: true, name: 'Carrot' }).catch(() => undefined);
      await Promise.resolve();
    });
    expect(qc.getQueryData<WishlistResponse>(wishlistQueryKeys.wishlist)?.items.map((i) => i.productId)).toEqual(['p1']);
    await act(async () => {
      reject(problem(500, 'INTERNAL'));
      await p;
    });
    expect(qc.getQueryData<WishlistResponse>(wishlistQueryKeys.wishlist)?.items).toEqual([]);
  });

  it('removes with DELETE ?grade=', async () => {
    const del = vi.spyOn(client.api, 'delete').mockResolvedValue(undefined);
    vi.spyOn(client.api, 'get').mockResolvedValue({ items: [] });
    await act(async () => {
      await toggle!.mutateAsync({ productId: 'p1', grade: 'GRADE_2', add: false });
    });
    expect(del.mock.calls[0]?.[0]).toBe('/wishlist/p1?grade=GRADE_2');
  });
});
