import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  initializeCropMilestones,
  listCropMilestones,
  listCropMilestoneTemplates,
  updateCropMilestone,
  type CropMilestoneResponse,
  type CropMilestonesListResponse,
  type CropMilestoneTemplateResponse,
} from '../api/crops';
import { ApiError, setAccessToken } from '../../../shell/api/client';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' },
  });
}

describe('Farmer crop milestones API client (BR-57)', () => {
  const farmCropId = '50000000-0000-4000-8000-000000000001';
  const milestoneId = '60000000-0000-4000-8000-000000000001';

  beforeEach(() => {
    vi.restoreAllMocks();
    setAccessToken('token-farmer-test');
  });

  afterEach(() => {
    setAccessToken(null);
  });

  it('BR-57b: listCropMilestones calls GET /farmers/me/crops/:farmCropId/milestones', async () => {
    let capturedUrl = '';
    const mockItem: CropMilestoneResponse = {
      id: milestoneId,
      farmerId: 'farmer-1',
      farmCropId,
      templateId: 'tmpl-1',
      stageCode: 'STAGE_SOWING',
      stageName: 'Sowing & Germination',
      sequenceOrder: 1,
      status: 'COMPLETED',
      targetDate: '2026-07-10',
      completedOn: '2026-07-10',
      notes: 'Germination rate 95%',
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-10T00:00:00.000Z',
    };
    const mockResponse: CropMilestonesListResponse = {
      items: [mockItem],
      totalCount: 6,
      completedCount: 1,
      progressPct: 17,
    };

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      capturedUrl = String(input);
      return jsonResponse(mockResponse);
    }) as typeof fetch;

    const result = await listCropMilestones(farmCropId);

    expect(capturedUrl).toContain(`/v1/farmers/me/crops/${farmCropId}/milestones`);
    expect(result.totalCount).toBe(6);
    expect(result.completedCount).toBe(1);
    expect(result.progressPct).toBe(17);
    expect(result.items[0]?.stageCode).toBe('STAGE_SOWING');
    expect(result.items[0]?.status).toBe('COMPLETED');
  });

  it('BR-57c: updateCropMilestone calls PATCH /farmers/me/crops/:farmCropId/milestones/:id with body', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody = '';

    const mockUpdated: CropMilestoneResponse = {
      id: milestoneId,
      farmerId: 'farmer-1',
      farmCropId,
      templateId: 'tmpl-1',
      stageCode: 'STAGE_VEGETATIVE',
      stageName: 'Vegetative Growth',
      sequenceOrder: 2,
      status: 'COMPLETED',
      targetDate: '2026-07-25',
      completedOn: '2026-07-25',
      notes: null,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-25T00:00:00.000Z',
    };

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? 'GET';
      capturedBody = String(init?.body ?? '');
      return jsonResponse(mockUpdated);
    }) as typeof fetch;

    const result = await updateCropMilestone(farmCropId, milestoneId, {
      status: 'COMPLETED',
    });

    expect(capturedUrl).toContain(`/v1/farmers/me/crops/${farmCropId}/milestones/${milestoneId}`);
    expect(capturedMethod).toBe('PATCH');
    expect(JSON.parse(capturedBody)).toEqual({ status: 'COMPLETED' });
    expect(result.status).toBe('COMPLETED');
    expect(result.stageCode).toBe('STAGE_VEGETATIVE');
  });

  it('BR-57b: listCropMilestoneTemplates calls GET /farmers/me/crop-milestone-templates', async () => {
    let capturedUrl = '';
    const mockTemplates: CropMilestoneTemplateResponse[] = [
      {
        id: 'tmpl-1',
        cropMasterId: null,
        stageCode: 'STAGE_SOWING',
        stageName: 'Sowing & Germination',
        description: 'Seed emergence and cotyledon unfolding',
        sequenceOrder: 1,
        expectedDaysAfterPlanting: 7,
      },
    ];

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      capturedUrl = String(input);
      return jsonResponse(mockTemplates);
    }) as typeof fetch;

    const result = await listCropMilestoneTemplates();

    expect(capturedUrl).toContain('/v1/farmers/me/crop-milestone-templates');
    expect(result).toHaveLength(1);
    expect(result[0]?.stageCode).toBe('STAGE_SOWING');
    expect(result[0]?.description).toContain('Seed emergence');
  });

  it('BR-57b: initializeCropMilestones calls POST /farmers/me/crops/:farmCropId/milestones/initialize', async () => {
    let capturedUrl = '';
    let capturedMethod = '';

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? 'GET';
      return jsonResponse({
        items: [],
        totalCount: 6,
        completedCount: 0,
        progressPct: 0,
      });
    }) as typeof fetch;

    const result = await initializeCropMilestones(farmCropId);

    expect(capturedUrl).toContain(`/v1/farmers/me/crops/${farmCropId}/milestones/initialize`);
    expect(capturedMethod).toBe('POST');
    expect(result.totalCount).toBe(6);
    expect(result.progressPct).toBe(0);
  });

  it('propagates API errors properly as ApiError', async () => {
    global.fetch = vi.fn(async () =>
      jsonResponse(
        { type: 'about:blank', title: 'Farm crop not found', status: 404, code: 'NOT_FOUND' },
        404,
      ),
    ) as typeof fetch;

    await expect(listCropMilestones(farmCropId)).rejects.toThrow(ApiError);
  });
});
