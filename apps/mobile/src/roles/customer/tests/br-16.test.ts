import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-native', async () => (await import('./helpers/rnMock')).rnMock());
vi.mock('react-native-svg', async () => (await import('./helpers/rnMock')).svgMock());

vi.mock('@tohfa/mobile-ui', () => ({
  Card: 'Card',
  Typography: 'Typography',
  Spacing: { m: 16, s: 8, xs: 4 },
  ThemeProvider: 'ThemeProvider',
  Button: 'Button',
  Badge: 'Badge',
  Icon: 'Icon',
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
  }
}));

import { api } from '../../../shell/api/client';
import { HomeScreen } from '../screens/HomeScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { ProductGridScreen } from '../screens/ProductGridScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { SearchScreen } from '../screens/SearchScreen';

const DENYLIST = [
  'farmerId',
  'farmer_id',
  'farmName',
  'farmId',
  'village',
  'taluk',
  'latitude',
  'longitude',
  'gps',
  'fmb',
  'polygon',
];

function walkTreeAndAssertNoIdentity(node: unknown) {
  if (!node) return;
  if (typeof node === 'string') {
    const lower = node.toLowerCase();
    DENYLIST.forEach((term) => {
      expect(lower).not.toContain(term.toLowerCase());
    });
    return;
  }
  if (Array.isArray(node)) {
    node.forEach(walkTreeAndAssertNoIdentity);
    return;
  }
  if (typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    if (obj['props'] && typeof obj['props'] === 'object') {
      Object.values(obj['props'] as Record<string, unknown>).forEach(walkTreeAndAssertNoIdentity);
    }
    if (obj['children'] && Array.isArray(obj['children'])) {
      obj['children'].forEach(walkTreeAndAssertNoIdentity);
    }
  }
}

function walkPayloadAndAssertNoIdentity(payload: unknown) {
  if (!payload) return;
  if (typeof payload === 'string') {
    return;
  }
  if (Array.isArray(payload)) {
    payload.forEach(walkPayloadAndAssertNoIdentity);
    return;
  }
  if (typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    Object.keys(obj).forEach((key) => {
      const lowerKey = key.toLowerCase();
      DENYLIST.forEach((term) => {
        if (lowerKey === term.toLowerCase() || lowerKey.includes(term.toLowerCase())) {
          throw new Error(`API LEAK DETECTED: Payload contains forbidden field "${key}"`);
        }
      });
      walkPayloadAndAssertNoIdentity(obj[key]);
    });
  }
}

const PRODUCT = {
  id: 'p1', name: 'Carrot', categoryId: 'c1', grade: 'GRADE_1', pricePerKg: '69.00', availableQty: '10.000', unit: 'kg',
  photos: [], certificationBadges: ['PGS'], warehouseIds: [], tasteNotes: 'Sweet', originRegion: 'Nilgiris',
  compareAtPrice: '80.00', discountPercent: 13, isComingSoon: false, comingTomorrow: false, isUnsalable: false,
  ratingAverage: 4.5, ratingCount: 3,
};

describe('BR-16: enforces farm-anonymous catalog in customer views', () => {
  let queryClient: QueryClient;
  const mounted: renderer.ReactTestRenderer[] = [];

  beforeEach(() => {
    mounted.splice(0).forEach((r) => renderer.act(() => r.unmount()));
    vi.restoreAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    const r = renderer.create(
      React.createElement(QueryClientProvider, { client: queryClient }, ui)
    );
    mounted.push(r);
    return r;
  };

  it('BR-16: Home screen renders without farm identity and payload is clean', async () => {
    const mockHomePayload = {
      heroBanners: [{ id: '1', imageUrl: 'http://img', title: null, deeplink: null }],
      sections: [{ id: 's1', title: 'Vegetables', subtitle: null, items: [PRODUCT] }],
      categories: [{ id: 'c1', name: 'Veg', slug: 'veg' }],
      featured: [PRODUCT],
      nearestWarehouseId: null,
    };
    
    vi.spyOn(api, 'get').mockImplementation(async (path) => {
      if (path === '/catalog/home') {
        walkPayloadAndAssertNoIdentity(mockHomePayload);
        return mockHomePayload as never;
      }
      return null as never;
    });

    let root!: renderer.ReactTestRenderer;
    await renderer.act(async () => {
      root = renderWithProviders(React.createElement(HomeScreen));
    });
    walkTreeAndAssertNoIdentity(root.toJSON());
  });

  it('BR-16: Categories screen renders without farm identity and payload is clean', async () => {
    const mockCatPayload = { items: [{ id: 'c1', name: 'Veg', slug: 'veg' }] };
    vi.spyOn(api, 'get').mockResolvedValue(mockCatPayload as never);

    let root!: renderer.ReactTestRenderer;
    await renderer.act(async () => {
      root = renderWithProviders(React.createElement(CategoriesScreen));
    });
    walkTreeAndAssertNoIdentity(root.toJSON());
  });

  it('BR-16: Product grid renders without farm identity, payload is clean, and rejects REJECT grade', async () => {
    const mockProdPayload = {
      items: [
        PRODUCT,
        { ...PRODUCT, id: 'p2', name: 'Bad Carrot', grade: 'REJECT' },
      ],
      page: { nextCursor: null, hasMore: false },
    };
    
    vi.spyOn(api, 'get').mockImplementation(async () => {
      walkPayloadAndAssertNoIdentity(mockProdPayload);
      return mockProdPayload as never;
    });

    let root!: renderer.ReactTestRenderer;
    await renderer.act(async () => {
      root = renderWithProviders(React.createElement(ProductGridScreen, { categoryId: 'c1' }));
    });
    const tree = root.toJSON();
    walkTreeAndAssertNoIdentity(tree);
    
    const treeStr = JSON.stringify(tree);
    expect(treeStr).not.toContain('Bad Carrot');
    expect(treeStr).not.toContain('REJECT');
  });

  it('BR-16: Product detail renders without farm identity and payload is clean', async () => {
    const mockDetailPayload = { ...PRODUCT, variants: [] };
    vi.spyOn(api, 'get').mockResolvedValue(mockDetailPayload as never);

    let root!: renderer.ReactTestRenderer;
    await renderer.act(async () => {
      root = renderWithProviders(React.createElement(ProductDetailScreen, { productId: 'p1' }));
    });
    walkTreeAndAssertNoIdentity(root.toJSON());
  });

  it('BR-16: Search screen renders without farm identity and payload is clean', async () => {
    const mockSearchPayload = {
      items: [PRODUCT],
      page: { nextCursor: null, hasMore: false },
    };
    const mockHomePayload = {
      items: [], queries: [], products: [PRODUCT]
    };
    vi.spyOn(api, 'get').mockImplementation(async (path) => {
      if (path.includes('/catalog/search')) return mockSearchPayload as never;
      return mockHomePayload as never;
    });

    let root!: renderer.ReactTestRenderer;
    await renderer.act(async () => {
      root = renderWithProviders(React.createElement(SearchScreen, { initialQuery: 'carrot' }));
    });
    walkTreeAndAssertNoIdentity(root.toJSON());
  });

  it('fails if API leak is present in fixture', async () => {
    const leakyPayload = {
      id: 'p1',
      name: 'Carrot',
      farmerId: 'f123',
    };
    
    expect(() => walkPayloadAndAssertNoIdentity(leakyPayload)).toThrow(/API LEAK DETECTED.*farmerId/i);
  });
});
