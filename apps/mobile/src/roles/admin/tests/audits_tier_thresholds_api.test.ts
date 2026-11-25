/**
 * roles/admin/api/audits.ts: the read side of /admin/audit-tier-thresholds
 * (docs/openapi.yaml `getAuditTierThresholds`). The shell client is mocked, as
 * in audits_api.test.ts, so this pins path, method and that no query is sent.
 *
 * BR-147a: the GET answers with the generation of rating_tier_config now in
 * effect — four contiguous bands covering 0-100.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    request: vi.fn(async () => ({ effectiveFrom: '2026-04-01', tiers: [] })),
    getAccessToken: vi.fn(() => 'token-admin'),
    refreshAuthTokens: vi.fn(async () => null),
  };
});

import { request } from '../../../shell/api/client';
import { getAuditTierThresholds } from '../api/audits';
import { ADMIN_REQUEST_TIMEOUT_MS } from '../api/http';

const requestMock = vi.mocked(request);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getAuditTierThresholds', () => {
  it('BR-147a: GETs /admin/audit-tier-thresholds with no query and no write header', async () => {
    await getAuditTierThresholds();
    expect(requestMock).toHaveBeenCalledWith('/admin/audit-tier-thresholds', {
      method: 'GET',
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
  });

  it('BR-147a: returns the generation body unmapped', async () => {
    const generation = {
      effectiveFrom: '2026-04-01',
      tiers: [
        { code: 'POOR', label: 'Poor', minScore: 0, maxScore: 40, sortOrder: 1 },
        { code: 'MODERATE', label: 'Moderate', minScore: 40, maxScore: 60, sortOrder: 2 },
        { code: 'GOOD', label: 'Good', minScore: 60, maxScore: 80, sortOrder: 3 },
        { code: 'EXCELLENT', label: 'Excellent', minScore: 80, maxScore: null, sortOrder: 4 },
      ],
    };
    requestMock.mockResolvedValueOnce(generation);
    await expect(getAuditTierThresholds()).resolves.toEqual(generation);
  });
});
