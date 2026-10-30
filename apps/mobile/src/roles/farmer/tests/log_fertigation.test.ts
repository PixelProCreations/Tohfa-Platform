import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createCropInput,
  deleteCropInput,
  getCropInput,
  updateCropInput,
  type CreateCropInputRequest,
  type CropInputResponse,
  type UpdateCropInputRequest,
} from '../api/crops';
import { ApiError, setAccessToken } from '../../../shell/api/client';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' },
  });
}

describe('Farmer Crop Inputs API Client (BR-56 & Fertigation Logging)', () => {
  const farmCropId = '77777777-8888-4444-9999-000000000001';
  const inputId = '55555555-4444-3333-2222-111111111111';

  beforeEach(() => {
    vi.restoreAllMocks();
    setAccessToken('token-fertigation-test');
  });

  afterEach(() => {
    setAccessToken(null);
  });

  it('BR-56: createCropInput sends POST /farmers/me/crops/:farmCropId/inputs with proper body', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody: unknown = null;

    const requestBody: CreateCropInputRequest = {
      inputType: 'MANURE',
      inputName: 'Vermicompost',
      appliedOn: '2026-07-31',
      quantity: 60,
      unit: 'KG',
      costInr: '720.00',
      nitrogenPct: 2.0,
      phosphorusPct: 1.0,
      potassiumPct: 1.5,
      applicationMethod: 'Drench',
      notes: 'Dosage: 2 kg per plant | PHI: 0 days',
    };

    const mockResponse: CropInputResponse = {
      id: inputId,
      farmerId: 'farmer-uuid',
      farmCropId,
      inputType: 'MANURE',
      inputName: 'Vermicompost',
      appliedOn: '2026-07-31',
      quantity: 60,
      unit: 'KG',
      costInr: '720.00',
      nitrogenPct: 2.0,
      phosphorusPct: 1.0,
      potassiumPct: 1.5,
      applicationMethod: 'Drench',
      notes: 'Dosage: 2 kg per plant | PHI: 0 days',
      createdAt: '2026-07-31T05:30:00.000Z',
      updatedAt: null,
    };

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? 'GET';
      capturedBody = init?.body ? JSON.parse(String(init.body)) : null;
      return jsonResponse(mockResponse, 201);
    }) as typeof fetch;

    const result = await createCropInput(farmCropId, requestBody);

    expect(capturedUrl).toContain(`/v1/farmers/me/crops/${farmCropId}/inputs`);
    expect(capturedMethod).toBe('POST');
    expect(capturedBody).toEqual(requestBody);
    expect(result.id).toBe(inputId);
    expect(result.inputName).toBe('Vermicompost');
    expect(result.quantity).toBe(60);
    expect(result.costInr).toBe('720.00');
  });

  it('BR-56: getCropInput sends GET /farmers/me/crops/:farmCropId/inputs/:id', async () => {
    let capturedUrl = '';
    const mockResponse: CropInputResponse = {
      id: inputId,
      farmerId: 'farmer-uuid',
      farmCropId,
      inputType: 'BIO_INPUT',
      inputName: 'Jeevamrutha',
      appliedOn: '2026-07-31',
      quantity: 50,
      unit: 'LITRE',
      costInr: '400.00',
      nitrogenPct: 1.5,
      phosphorusPct: 0.5,
      potassiumPct: 1.0,
      applicationMethod: 'Drench',
      notes: null,
      createdAt: '2026-07-31T05:30:00.000Z',
      updatedAt: null,
    };

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      capturedUrl = String(input);
      return jsonResponse(mockResponse);
    }) as typeof fetch;

    const result = await getCropInput(farmCropId, inputId);

    expect(capturedUrl).toContain(`/v1/farmers/me/crops/${farmCropId}/inputs/${inputId}`);
    expect(result.inputName).toBe('Jeevamrutha');
    expect(result.unit).toBe('LITRE');
  });

  it('BR-56: updateCropInput sends PATCH /farmers/me/crops/:farmCropId/inputs/:id', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody: unknown = null;

    const patchBody: UpdateCropInputRequest = {
      quantity: 80,
      costInr: '960.00',
    };

    const mockResponse: CropInputResponse = {
      id: inputId,
      farmerId: 'farmer-uuid',
      farmCropId,
      inputType: 'MANURE',
      inputName: 'Vermicompost',
      appliedOn: '2026-07-31',
      quantity: 80,
      unit: 'KG',
      costInr: '960.00',
      nitrogenPct: 2.0,
      phosphorusPct: 1.0,
      potassiumPct: 1.5,
      applicationMethod: 'Drench',
      notes: null,
      createdAt: '2026-07-31T05:30:00.000Z',
      updatedAt: '2026-07-31T06:00:00.000Z',
    };

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? 'GET';
      capturedBody = init?.body ? JSON.parse(String(init.body)) : null;
      return jsonResponse(mockResponse);
    }) as typeof fetch;

    const result = await updateCropInput(farmCropId, inputId, patchBody);

    expect(capturedUrl).toContain(`/v1/farmers/me/crops/${farmCropId}/inputs/${inputId}`);
    expect(capturedMethod).toBe('PATCH');
    expect(capturedBody).toEqual(patchBody);
    expect(result.quantity).toBe(80);
    expect(result.costInr).toBe('960.00');
  });

  it('BR-56: deleteCropInput sends DELETE /farmers/me/crops/:farmCropId/inputs/:id', async () => {
    let capturedUrl = '';
    let capturedMethod = '';

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? 'GET';
      return new Response(null, { status: 204 });
    }) as typeof fetch;

    await deleteCropInput(farmCropId, inputId);

    expect(capturedUrl).toContain(`/v1/farmers/me/crops/${farmCropId}/inputs/${inputId}`);
    expect(capturedMethod).toBe('DELETE');
  });

  it('rejects with ApiError on validation failure', async () => {
    global.fetch = vi.fn(async () =>
      jsonResponse(
        {
          type: 'about:blank',
          title: 'Validation Failed',
          status: 422,
          code: 'VALIDATION_FAILED',
          detail: 'quantity must be greater than 0.',
        },
        422,
      ),
    ) as typeof fetch;

    const error = await createCropInput(farmCropId, {
      inputType: 'MANURE',
      inputName: 'Vermicompost',
      appliedOn: '2026-07-31',
      quantity: 0,
      unit: 'KG',
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).problem.status).toBe(422);
    expect((error as ApiError).problem.code).toBe('VALIDATION_FAILED');
    expect((error as ApiError).problem.detail).toBe('quantity must be greater than 0.');
  });
});
