import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTreePlanting,
  deleteTreePlanting,
  getTreePlanting,
  listTreePlantings,
  updateTreePlanting,
  toTreePlantingItem,
  type CreateTreePlantingRequest,
  type ListTreePlantingsResponse,
  type TreePlantingResponse,
  type UpdateTreePlantingRequest,
} from '../api/treePlantings';
import { ApiError, setAccessToken } from '../../../shell/api/client';
import fs from 'node:fs';
import path from 'node:path';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' },
  });
}

describe('Farmer Tree Plantings API client & UI mapping (BR-55)', () => {
  const plantingId = '80000000-0000-4000-8000-000000000001';

  beforeEach(() => {
    vi.restoreAllMocks();
    setAccessToken('token-farmer-test');
  });

  afterEach(() => {
    setAccessToken(null);
  });

  it('BR-55: listTreePlantings calls GET /farmers/me/tree-plantings with query params', async () => {
    let capturedUrl = '';
    let capturedHeaders: unknown;
    const mockItem: TreePlantingResponse = {
      id: plantingId,
      farmerId: 'farmer-1',
      farmId: 'farm-1',
      plotId: null,
      speciesName: 'Silver Oak',
      treeCount: 12,
      plantedOn: '2020-05-10',
      zoneName: 'Zone A boundary',
      purpose: 'Shade & windbreak',
      notes: null,
      createdAt: '2020-05-10T10:00:00.000Z',
      updatedAt: null,
    };
    const mockResponse: ListTreePlantingsResponse = {
      items: [mockItem],
      page: {
        nextCursor: null,
        hasMore: false,
      },
    };

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedHeaders = init?.headers;
      return jsonResponse(mockResponse);
    }) as typeof fetch;

    const result = await listTreePlantings({ limit: 50, cursor: 'cursor-abc' });

    expect(capturedUrl).toContain('/v1/farmers/me/tree-plantings');
    expect(capturedUrl).toContain('limit=50');
    expect(capturedUrl).toContain('cursor=cursor-abc');
    expect((capturedHeaders as Record<string, string>)?.Authorization).toBe('Bearer token-farmer-test');
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.speciesName).toBe('Silver Oak');
    expect(result.items[0]?.treeCount).toBe(12);
  });

  it('BR-55: getTreePlanting calls GET /farmers/me/tree-plantings/:id', async () => {
    let capturedUrl = '';
    const mockItem: TreePlantingResponse = {
      id: plantingId,
      farmerId: 'farmer-1',
      farmId: 'farm-1',
      plotId: null,
      speciesName: 'Guava',
      treeCount: 4,
      plantedOn: '2021-08-20',
      zoneName: 'Near Zone B',
      purpose: 'Seasonal yield',
      notes: null,
      createdAt: '2021-08-20T10:00:00.000Z',
      updatedAt: null,
    };

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      capturedUrl = String(input);
      return jsonResponse(mockItem);
    }) as typeof fetch;

    const result = await getTreePlanting(plantingId);

    expect(capturedUrl).toContain(`/v1/farmers/me/tree-plantings/${plantingId}`);
    expect(result.id).toBe(plantingId);
    expect(result.speciesName).toBe('Guava');
    expect(result.treeCount).toBe(4);
  });

  it('BR-55a,b: createTreePlanting calls POST /farmers/me/tree-plantings with valid payload', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody = '';
    const requestBody: CreateTreePlantingRequest = {
      speciesName: 'Teak',
      treeCount: 25,
      plantedOn: '2024-01-15',
      zoneName: 'South perimeter',
      purpose: 'Timber & canopy',
    };
    const createdItem: TreePlantingResponse = {
      id: '80000000-0000-4000-8000-000000000002',
      farmerId: 'farmer-1',
      farmId: null,
      plotId: null,
      speciesName: requestBody.speciesName,
      treeCount: requestBody.treeCount,
      plantedOn: requestBody.plantedOn ?? null,
      zoneName: requestBody.zoneName ?? null,
      purpose: requestBody.purpose ?? null,
      notes: null,
      createdAt: '2024-01-15T12:00:00.000Z',
      updatedAt: null,
    };

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? 'GET';
      capturedBody = String(init?.body);
      return jsonResponse(createdItem, 201);
    }) as typeof fetch;

    const result = await createTreePlanting(requestBody);

    expect(capturedUrl).toContain('/v1/farmers/me/tree-plantings');
    expect(capturedMethod).toBe('POST');
    expect(JSON.parse(capturedBody)).toEqual(requestBody);
    expect(result.id).toBe('80000000-0000-4000-8000-000000000002');
    expect(result.speciesName).toBe('Teak');
  });

  it('BR-55: updateTreePlanting calls PATCH /farmers/me/tree-plantings/:id', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody = '';
    const updateBody: UpdateTreePlantingRequest = {
      treeCount: 30,
      notes: 'Planted 5 additional saplings',
    };
    const updatedItem: TreePlantingResponse = {
      id: plantingId,
      farmerId: 'farmer-1',
      farmId: null,
      plotId: null,
      speciesName: 'Teak',
      treeCount: 30,
      plantedOn: '2024-01-15',
      zoneName: 'South perimeter',
      purpose: 'Timber & canopy',
      notes: 'Planted 5 additional saplings',
      createdAt: '2024-01-15T12:00:00.000Z',
      updatedAt: '2026-02-01T12:00:00.000Z',
    };

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? 'GET';
      capturedBody = String(init?.body);
      return jsonResponse(updatedItem);
    }) as typeof fetch;

    const result = await updateTreePlanting(plantingId, updateBody);

    expect(capturedUrl).toContain(`/v1/farmers/me/tree-plantings/${plantingId}`);
    expect(capturedMethod).toBe('PATCH');
    expect(JSON.parse(capturedBody)).toEqual(updateBody);
    expect(result.treeCount).toBe(30);
    expect(result.notes).toBe('Planted 5 additional saplings');
  });

  it('BR-55d: deleteTreePlanting calls DELETE /farmers/me/tree-plantings/:id', async () => {
    let capturedUrl = '';
    let capturedMethod = '';

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? 'GET';
      return new Response(null, { status: 204 });
    }) as typeof fetch;

    await deleteTreePlanting(plantingId);

    expect(capturedUrl).toContain(`/v1/farmers/me/tree-plantings/${plantingId}`);
    expect(capturedMethod).toBe('DELETE');
  });

  it('BR-55c: throws ApiError on 404 NOT_FOUND for cross-farmer or missing planting', async () => {
    global.fetch = vi.fn(async () =>
      jsonResponse(
        {
          type: 'https://api.tohfa.local/errors/not-found',
          title: 'Not Found',
          status: 404,
          detail: 'Tree planting not found',
        },
        404
      )
    ) as typeof fetch;

    await expect(getTreePlanting('non-existent-id')).rejects.toThrow(ApiError);
    await expect(deleteTreePlanting('non-existent-id')).rejects.toThrow(ApiError);
  });

  it('BR-55a,b: throws ApiError on 422 VALIDATION_FAILED for invalid treeCount or future date', async () => {
    global.fetch = vi.fn(async () =>
      jsonResponse(
        {
          type: 'https://api.tohfa.local/errors/validation-failed',
          title: 'Validation Failed',
          status: 422,
          detail: 'treeCount must be greater than 0',
        },
        422
      )
    ) as typeof fetch;

    await expect(createTreePlanting({ speciesName: 'Mango', treeCount: 0 })).rejects.toThrow(ApiError);
  });

  describe('toTreePlantingItem mapping logic', () => {
    it('correctly maps a mature shade tree', () => {
      const maturePlanting: TreePlantingResponse = {
        id: 'tree-mature',
        farmerId: 'farmer-1',
        farmId: 'farm-1',
        plotId: null,
        speciesName: 'Silver Oak',
        treeCount: 12,
        plantedOn: '2019-06-14',
        zoneName: 'Zone A boundary',
        purpose: 'Shade & windbreak',
        notes: null,
        createdAt: '2019-06-14T10:00:00.000Z',
        updatedAt: null,
      };

      const mapped = toTreePlantingItem(maturePlanting);

      expect(mapped.id).toBe('tree-mature');
      expect(mapped.name).toBe('Silver Oak (12 trees)');
      expect(mapped.species).toBe('Silver Oak');
      expect(mapped.treeCount).toBe(12);
      expect(mapped.zoneInfo).toBe('Zone A boundary');
      expect(mapped.status).toBe('Mature');
      expect(mapped.isFruitBearing).toBe(false);
      expect(mapped.hasPruningAlert).toBe(false);
      expect(mapped.ageText).toContain('years old');
      expect(mapped.plantedDate).toContain('Planted');
    });

    it('correctly maps a single young sapling with pruning alert', () => {
      // Planted 1 month ago
      const recentDate = new Date();
      recentDate.setMonth(recentDate.getMonth() - 1);
      const plantedIso = recentDate.toISOString().split('T')[0];

      const youngPlanting: TreePlantingResponse = {
        id: 'tree-young',
        farmerId: 'farmer-1',
        farmId: null,
        plotId: null,
        speciesName: 'Teak Sapling',
        treeCount: 1,
        plantedOn: plantedIso ?? '2026-09-01',
        zoneName: null,
        purpose: 'Timber boundary',
        notes: null,
        createdAt: '2026-09-01T10:00:00.000Z',
        updatedAt: null,
      };

      const mapped = toTreePlantingItem(youngPlanting);

      expect(mapped.name).toBe('Teak Sapling (1 tree)');
      expect(mapped.zoneInfo).toBe('Farm zone');
      expect(mapped.status).toBe('Young');
      expect(mapped.hasPruningAlert).toBe(true);
      expect(mapped.alertText).toBe('Pruning check recommended');
    });

    it('correctly marks fruit-bearing tree based on purpose keywords', () => {
      const fruitPlanting: TreePlantingResponse = {
        id: 'tree-fruit',
        farmerId: 'farmer-1',
        farmId: null,
        plotId: null,
        speciesName: 'Guava',
        treeCount: 4,
        plantedOn: '2021-08-20',
        zoneName: 'Near Zone B',
        purpose: 'Fruit harvest & seasonal yield',
        notes: null,
        createdAt: '2021-08-20T10:00:00.000Z',
        updatedAt: null,
      };

      const mapped = toTreePlantingItem(fruitPlanting);

      expect(mapped.status).toBe('Fruit-bearing');
      expect(mapped.isFruitBearing).toBe(true);
      expect(mapped.purposeText).toBe('Fruit harvest & seasonal yield');
    });

    it('handles planting without plantedOn date gracefully', () => {
      const noDatePlanting: TreePlantingResponse = {
        id: 'tree-nodate',
        farmerId: 'farmer-1',
        farmId: null,
        plotId: null,
        speciesName: 'Banyan',
        treeCount: 2,
        plantedOn: null,
        zoneName: 'Center courtyard',
        purpose: null,
        notes: null,
        createdAt: '2026-01-01T10:00:00.000Z',
        updatedAt: null,
      };

      const mapped = toTreePlantingItem(noDatePlanting);

      expect(mapped.plantedDate).toBe('Planting date not recorded');
      expect(mapped.ageText).toBeUndefined();
      expect(mapped.status).toBe('Mature');
    });
  });

  describe('canDeleteAsset & Screen source checks', () => {
    it('confirms Trees is no longer in CATEGORIES_WITHOUT_DELETE_SUPPORT in RemoveItemScreen', () => {
      const removeItemScreenPath = path.resolve(__dirname, '../screens/farm/assets/RemoveItemScreen.tsx');
      const removeItemContent = fs.readFileSync(removeItemScreenPath, 'utf8');
      expect(removeItemContent).toContain('CATEGORIES_WITHOUT_DELETE_SUPPORT: ReadonlySet<RemoveCategoryType> = new Set<RemoveCategoryType>();');
    });

    it('verifies TreesListScreen is wired to listTreePlantings and handles loading/error states', () => {
      const treesListPath = path.resolve(__dirname, '../screens/farm/assets/TreesListScreen.tsx');
      const treesListContent = fs.readFileSync(treesListPath, 'utf8');
      expect(treesListContent).toContain('listTreePlantings');
      expect(treesListContent).toContain('toTreePlantingItem');
      expect(treesListContent).toContain('Skeleton');
      expect(treesListContent).toContain('ErrorState');
      expect(treesListContent).toContain('RefreshControl');
    });

    it('verifies AddPlantingScreen is wired to createTreePlanting', () => {
      const addPlantingPath = path.resolve(__dirname, '../screens/farm/crops/AddPlantingScreen.tsx');
      const addPlantingContent = fs.readFileSync(addPlantingPath, 'utf8');
      expect(addPlantingContent).toContain('createTreePlanting');
    });

    it('verifies EditPlantingScreen is wired to updateTreePlanting', () => {
      const editPlantingPath = path.resolve(__dirname, '../screens/farm/crops/EditPlantingScreen.tsx');
      const editPlantingContent = fs.readFileSync(editPlantingPath, 'utf8');
      expect(editPlantingContent).toContain('updateTreePlanting');
    });

    it('verifies FarmInventoryScreen is wired to listTreePlantings for live count', () => {
      const farmInventoryPath = path.resolve(__dirname, '../screens/farm/FarmInventoryScreen.tsx');
      const farmInventoryContent = fs.readFileSync(farmInventoryPath, 'utf8');
      expect(farmInventoryContent).toContain('listTreePlantings');
      expect(farmInventoryContent).toContain('treesCategory');
    });
  });
});
