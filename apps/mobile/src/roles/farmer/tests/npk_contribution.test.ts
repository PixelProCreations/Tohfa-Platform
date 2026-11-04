import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getNpkContribution,
  listCropInputs,
  type CropInputResponse,
  type CropNpkContributionResponse,
} from '../api/crops';
import { ApiError, setAccessToken } from '../../../shell/api/client';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' },
  });
}

describe('Farmer NPK contribution & crop inputs API client (BR-56)', () => {
  const farmCropId = '11111111-2222-3333-4444-555555555555';

  beforeEach(() => {
    vi.restoreAllMocks();
    setAccessToken('token-farmer-test');
  });

  afterEach(() => {
    setAccessToken(null);
  });

  it('BR-56f: getNpkContribution calls GET /farmers/me/crops/:farmCropId/npk-contribution', async () => {
    let capturedUrl = '';
    const mockResponse: CropNpkContributionResponse = {
      farmCropId,
      totalInputsCount: 3,
      totalQuantityKg: 93,
      totalNitrogenKg: 16.5,
      totalPhosphorusKg: 12.0,
      totalPotassiumKg: 45.0,
      totalCostInr: '1250.00',
    };

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      capturedUrl = String(input);
      return jsonResponse(mockResponse);
    }) as typeof fetch;

    const result = await getNpkContribution(farmCropId);

    expect(capturedUrl).toContain(`/v1/farmers/me/crops/${farmCropId}/npk-contribution`);
    expect(result.totalNitrogenKg).toBe(16.5);
    expect(result.totalPhosphorusKg).toBe(12.0);
    expect(result.totalPotassiumKg).toBe(45.0);
    expect(result.totalInputsCount).toBe(3);
    expect(result.totalCostInr).toBe('1250.00');
  });

  it('BR-56: listCropInputs calls GET /farmers/me/crops/:farmCropId/inputs with query parameters', async () => {
    let capturedUrl = '';
    const mockInput: CropInputResponse = {
      id: 'input-1',
      farmerId: 'farmer-1',
      farmCropId,
      inputType: 'FERTILIZER',
      inputName: 'Vermicompost',
      appliedOn: '2026-07-12',
      quantity: 60,
      unit: 'KG',
      nitrogenPct: 20,
      phosphorusPct: 10,
      potassiumPct: 5,
      applicationMethod: 'Drench',
      costInr: '450.00',
      notes: 'Applied around root zone',
      createdAt: '2026-07-12T05:30:00.000Z',
      updatedAt: null,
    };

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      capturedUrl = String(input);
      return jsonResponse({
        items: [mockInput],
        page: { nextCursor: null, hasMore: false },
      });
    }) as typeof fetch;

    const result = await listCropInputs(farmCropId, { limit: 10, cursor: 'cur_abc' });

    expect(capturedUrl).toContain(`/v1/farmers/me/crops/${farmCropId}/inputs?`);
    expect(capturedUrl).toContain('cursor=cur_abc');
    expect(capturedUrl).toContain('limit=10');
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.inputName).toBe('Vermicompost');
    expect(result.items[0]?.quantity).toBe(60);
    expect(result.items[0]?.unit).toBe('KG');
  });

  it('propagates API errors properly as ApiError', async () => {
    global.fetch = vi.fn(async () =>
      jsonResponse(
        { type: 'about:blank', title: 'Crop not found', status: 404, code: 'NOT_FOUND' },
        404,
      ),
    ) as typeof fetch;

    const error = await getNpkContribution('unknown-crop-id').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).problem.status).toBe(404);
    expect((error as ApiError).is('NOT_FOUND')).toBe(true);
  });
});
