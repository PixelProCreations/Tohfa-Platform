/**
 * Flow B catalog screens against mocked API responses (docs/openapi.yaml shapes):
 * Home rails/cart bar/wishlist, ProductGrid query, ProductDetail grades + add/buy,
 * Search suggestions/recent, Wishlist remove/unavailable.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-native', async () => (await import('./helpers/rnMock')).rnMock());
vi.mock('react-native-svg', async () => (await import('./helpers/rnMock')).svgMock());

import * as client from '../../../shell/api/client';
import { HomeScreen, resolveHomeDeeplink } from '../screens/HomeScreen';
import { ProductGridScreen } from '../screens/ProductGridScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { WishlistScreen } from '../screens/WishlistScreen';
import { treeText } from './helpers/rnMock';

const PRODUCT = {
  id: 'p1', name: 'Carrot', categoryId: 'c1', grade: 'GRADE_1', pricePerKg: '69.00', availableQty: '10.000', unit: 'kg',
  photos: [], certificationBadges: [], warehouseIds: [], tasteNotes: 'Sweet and crunchy', originRegion: 'Nilgiris',
  compareAtPrice: null, discountPercent: null, isComingSoon: false, comingTomorrow: true, isUnsalable: false,
  ratingAverage: 4.5, ratingCount: 3, packSize: null, packUnit: null, farmingType: null, harvestSeason: null, shelfLifeDays: null,
};
const CART = {
  id: 'cart1', warehouseId: 'w1', status: 'ACTIVE', subtotal: '138.00', lockedAt: null, lockExpiresAt: null,
  items: [{ id: 'l1', productId: 'p1', name: 'Carrot', grade: 'GRADE_1', qtyKg: '2.000', unitPrice: '69.00', lineTotal: '138.00', availability: 'OK', availableKg: '10.000' }],
};
const PAGE_END = { nextCursor: null, hasMore: false };

type Routes = Record<string, unknown | ((path: string) => unknown)>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let getSpy: any;
function mockGet(routes: Routes) {
  getSpy = vi.spyOn(client.api, 'get').mockImplementation(async (path: string) => {
    const key = Object.keys(routes)
      .sort((a, b) => b.length - a.length)
      .find((k) => path.startsWith(k));
    if (key === undefined) throw new client.ApiError({ type: 'x', title: 'nf', status: 404, code: 'NOT_FOUND' } as never);
    const v = routes[key];
    return (typeof v === 'function' ? (v as (p: string) => unknown)(path) : v) as never;
  });
}

let qc: QueryClient;
const mounted: renderer.ReactTestRenderer[] = [];
async function render(ui: React.ReactElement) {
  let root!: renderer.ReactTestRenderer;
  await act(async () => {
    root = renderer.create(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
  });
  for (let i = 0; i < 4; i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
  mounted.push(root);
  return root;
}
const byTestId = (root: renderer.ReactTestRenderer, id: string) => root.root.find((n) => n.props.testID === id);
const text = (root: renderer.ReactTestRenderer) => treeText(root.toJSON());

beforeEach(() => {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  client.setAccessToken('token');
});
afterEach(() => {
  mounted.splice(0).forEach((r) => act(() => r.unmount()));
  client.setAccessToken(null);
  vi.restoreAllMocks();
});

describe('Home', () => {
  it('renders server rails, categories and the cart bar from the server cart', async () => {
    mockGet({
      '/catalog/home': {
        heroBanners: [],
        sections: [{ id: 's1', title: 'Leafy greens', subtitle: null, items: [{ ...PRODUCT, id: 'p2', name: 'Spinach', comingTomorrow: false }] }],
        categories: [{ id: 'c1', name: 'Vegetables', slug: 'veg' }],
        featured: [PRODUCT],
        nearestWarehouseId: 'w1',
      },
      '/cart': CART,
      '/wishlist': { items: [] },
      '/customers/me/addresses': { items: [] },
      '/wallets/me': { id: 'w', balance: '500.00', status: 'ACTIVE' },
    });
    const root = await render(<HomeScreen onNavigate={vi.fn()} />);
    const t = text(root);
    expect(t).toContain('Leafy greens');
    expect(t).toContain('Spinach');
    expect(t).toContain('Vegetables');
    expect(t).toContain('Coming tomorrow');
    expect(t).toMatch(/1\s+item\s+in your cart/);
    expect(t).toContain('138.00');
    expect(t).not.toMatch(/Watermelon|Royal|₹1,250/);
  });

  it('shows the empty state when the catalog has nothing', async () => {
    mockGet({ '/catalog/home': { categories: [], featured: [], sections: [], nearestWarehouseId: null }, '/cart': { ...CART, items: [], subtotal: '0.00' }, '/wishlist': { items: [] }, '/customers/me/addresses': { items: [] }, '/wallets/me': { balance: '0.00' } });
    const root = await render(<HomeScreen />);
    expect(byTestId(root, 'home-empty')).toBeTruthy();
    expect(text(root)).not.toContain('in your cart');
  });

  it('parses banner deeplinks', () => {
    expect(resolveHomeDeeplink('/categories/c9')).toEqual({ screen: 'ProductGrid', params: { categoryId: 'c9' } });
    expect(resolveHomeDeeplink('/products/p9')).toEqual({ screen: 'ProductDetail', params: { productId: 'p9' } });
    expect(resolveHomeDeeplink('https://x.y')).toEqual({ url: 'https://x.y' });
    expect(resolveHomeDeeplink(null)).toBeNull();
  });
});

describe('ProductGrid', () => {
  it('requests just_arrived with only allowed keys and keys rows by crop+grade', async () => {
    mockGet({
      '/catalog/products': { items: [PRODUCT, { ...PRODUCT, grade: 'GRADE_2', pricePerKg: '50.00' }], page: PAGE_END },
      '/wishlist': { items: [] },
    });
    const root = await render(<ProductGridScreen sort="just_arrived" />);
    const path = String(getSpy.mock.calls.find((c: unknown[]) => String(c[0]).startsWith('/catalog/products'))?.[0]);
    expect(path).toContain('sort=just_arrived');
    expect(path).not.toMatch(/sortBy|page=/);
    expect(text(root)).toContain('Just arrived');
    expect(text(root)).toContain('50.00');
  });

  it('shows the empty state', async () => {
    mockGet({ '/catalog/products': { items: [], page: PAGE_END }, '/wishlist': { items: [] } });
    const root = await render(<ProductGridScreen categoryId="c1" />);
    expect(text(root)).toContain('No items in this category');
  });
});

describe('ProductDetail', () => {
  const detail = {
    ...PRODUCT,
    variants: [
      { grade: 'GRADE_1', pricePerKg: '69.00', availableKg: '10.000', compareAtPrice: null, discountPercent: null, flags: { isComingSoon: false, comingTomorrow: false, isUnsalable: false } },
      { grade: 'GRADE_2', pricePerKg: '52.00', availableKg: '4.000', compareAtPrice: '60.00', discountPercent: 13, flags: { isComingSoon: false, comingTomorrow: false, isUnsalable: false } },
    ],
  };

  it('switches grade (price + cart payload grade) and Buy now adds then opens checkout', async () => {
    mockGet({
      '/catalog/products/p1/reviews': { summary: { averageRating: '4.5', ratingCount: 2, distribution: { '5': 1, '4': 1 } }, items: [{ id: 'r1', rating: 5, comment: 'Lovely', createdAt: '2026-11-01T00:00:00Z' }], total: 1, page: 1, limit: 20 },
      '/catalog/products/p1': detail,
      '/wishlist': { items: [] },
    });
    const post = vi.spyOn(client.api, 'post').mockResolvedValue(CART as never);
    const onNavigate = vi.fn();
    const root = await render(<ProductDetailScreen productId="p1" onNavigate={onNavigate} />);
    expect(treeText(byTestId(root, 'detail-price').children)).toContain('69.00');
    expect(text(root)).toContain('Lovely');
    expect(text(root)).not.toMatch(/42 Questions|Royal|Farm Verified/);

    await act(async () => byTestId(root, 'grade-GRADE_2').props.onPress());
    expect(treeText(byTestId(root, 'detail-price').children)).toContain('52.00');

    await act(async () => {
      await byTestId(root, 'detail-buy').props.onPress();
    });
    expect(post).toHaveBeenCalledWith('/cart/items', { productId: 'p1', grade: 'GRADE_2', qtyKg: '1.000' });
    expect(onNavigate).toHaveBeenCalledWith('Checkout');
  });

  it('shows "No longer available" on 404', async () => {
    mockGet({});
    const root = await render(<ProductDetailScreen productId="gone" />);
    expect(byTestId(root, 'product-not-found')).toBeTruthy();
  });

  it('maps a 409 STOCK_UNAVAILABLE on add to a message', async () => {
    mockGet({ '/catalog/products/p1/reviews': { summary: { averageRating: null, ratingCount: 0, distribution: {} }, items: [], total: 0, page: 1, limit: 20 }, '/catalog/products/p1': detail, '/wishlist': { items: [] } });
    vi.spyOn(client.api, 'post').mockRejectedValue(new client.ApiError({ type: 'x', title: 'Stock', status: 409, code: 'STOCK_UNAVAILABLE', detail: 'Only 0.5 kg left' } as never));
    const root = await render(<ProductDetailScreen productId="p1" />);
    await act(async () => {
      await byTestId(root, 'detail-add').props.onPress();
    });
    expect(byTestId(root, 'detail-message')).toBeTruthy();
  });
});

describe('Search', () => {
  it('submits, records the recent search and lists results; recent rows can be removed', async () => {
    mockGet({
      '/catalog/search/recent': { items: [{ query: 'beans', searchedAt: '2026-11-01T00:00:00Z' }] },
      '/catalog/search/trending': { queries: [], products: [] },
      '/catalog/search': { items: [PRODUCT], page: PAGE_END },
      '/catalog/categories': { items: [] },
      '/wishlist': { items: [] },
    });
    const post = vi.spyOn(client.api, 'post').mockResolvedValue({ query: 'carrot', searchedAt: 'x' } as never);
    const del = vi.spyOn(client.api, 'delete').mockResolvedValue(undefined as never);
    const root = await render(<SearchScreen />);
    expect(text(root)).toContain('beans');
    await act(async () => byTestId(root, 'recent-remove-beans').props.onPress());
    expect(del).toHaveBeenCalledWith('/catalog/search/recent?q=beans');

    await act(async () => byTestId(root, 'search-input').props.onChangeText('carrot'));
    await act(async () => byTestId(root, 'search-submit').props.onPress());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(post).toHaveBeenCalledWith('/catalog/search/recent', { query: 'carrot' });
    expect(text(root)).toContain('Carrot');
    expect(byTestId(root, 'search-input').props.maxLength).toBe(80);
  });
});

describe('Wishlist', () => {
  it('lists server items, greys unavailable ones and removes optimistically', async () => {
    mockGet({
      '/wishlist': {
        items: [
          { id: 'w1', productId: 'p1', grade: 'GRADE_1', name: 'Carrot', available: true, product: PRODUCT, addedAt: 'x' },
          { id: 'w2', productId: 'p9', grade: 'GRADE_2', name: 'Old beans', available: false, product: null, addedAt: 'x' },
        ],
      },
    });
    const del = vi.spyOn(client.api, 'delete').mockResolvedValue(undefined as never);
    const root = await render(<WishlistScreen />);
    expect(text(root)).toContain('Carrot');
    expect(text(root)).toContain('Currently unavailable');
    expect(text(root)).not.toMatch(/Thyme|Natural Honey/);
    const card = byTestId(root, 'wishlist-item-p1:GRADE_1');
    const heart = card.find((n) => typeof n.props.accessibilityLabel === 'string' && n.props.accessibilityLabel.startsWith('Remove Carrot'));
    await act(async () => heart.props.onPress());
    expect(del).toHaveBeenCalledWith('/wishlist/p1?grade=GRADE_1');
  });
});
