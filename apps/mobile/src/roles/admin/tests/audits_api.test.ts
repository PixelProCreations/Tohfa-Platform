/**
 * roles/admin/api/audits.ts: what goes on the wire for the admin audit routes
 * (docs/openapi.yaml tag Audits). The shell client is mocked (same pattern as
 * api_invoices.test.ts), so these tests pin path, method, query and body.
 *
 * The spec defines no Idempotency-Key and no If-Match for any audit write
 * (none moves money), so the tests assert none is sent; the bulk reschedule's
 * replay guard is the per-item `expectedScheduledFor` in the body.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    request: vi.fn(async () => ({ items: [], page: { nextCursor: null, hasMore: false } })),
    getAccessToken: vi.fn(() => 'token-admin'),
    refreshAuthTokens: vi.fn(async () => null),
  };
});

import { ApiError, request } from '../../../shell/api/client';
import {
  bulkRescheduleAudits,
  cancelAudit,
  clearAuditRedFlag,
  completeAudit,
  createAudit,
  createAuditFinding,
  getAudit,
  getAuditCompliance,
  getAuditReportUrl,
  listAudits,
  redFlagAudit,
  setAuditScores,
  startAudit,
  updateAudit,
  updateAuditFinding,
  updateAuditTierThresholds,
} from '../api/audits';
import { ADMIN_REQUEST_TIMEOUT_MS } from '../api/http';

const requestMock = vi.mocked(request);
const AUDIT = '11111111-1111-4111-8111-111111111111';
const FINDING = '22222222-2222-4222-8222-222222222222';
const FARMER = '33333333-3333-4333-8333-333333333333';
const ZONE = '44444444-4444-4444-8444-444444444444';
const GET = { method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS };
const realFetch = global.fetch;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  global.fetch = realFetch;
});

function lastCall(): [string, Record<string, unknown>] {
  const call = requestMock.mock.calls.at(-1);
  if (call === undefined) throw new Error('request() was not called');
  return [call[0], call[1] as Record<string, unknown>];
}

function expectWrite(path: string, method: string, body: unknown): void {
  expect(lastCall()).toEqual([path, { method, body, timeoutMs: ADMIN_REQUEST_TIMEOUT_MS }]);
}

describe('listAudits', () => {
  it('GETs /admin/audits with no query by default', async () => {
    await listAudits();
    expect(requestMock).toHaveBeenCalledWith('/admin/audits', GET);
  });

  it('sends every documented filter, statuses comma-separated, booleans as true/false', async () => {
    await listAudits({
      farmerId: FARMER,
      zoneId: ZONE,
      status: ['SCHEDULED', 'IN_PROGRESS'],
      type: 'EXTERNAL',
      fiscalYear: '2026-27',
      quarter: 3,
      scheduledFrom: '2026-10-01T00:00:00Z',
      scheduledTo: '2026-12-31T23:59:59Z',
      redFlagged: false,
      overdue: true,
      hasOpenMajorFindings: true,
      sort: 'scheduledFor',
      cursor: 'c-1',
      limit: 50,
    });
    expect(lastCall()[0]).toBe(
      `/admin/audits?farmerId=${FARMER}&zoneId=${ZONE}&status=SCHEDULED%2CIN_PROGRESS&type=EXTERNAL` +
        '&fiscalYear=2026-27&quarter=3&scheduledFrom=2026-10-01T00%3A00%3A00Z&scheduledTo=2026-12-31T23%3A59%3A59Z' +
        '&redFlagged=false&overdue=true&hasOpenMajorFindings=true&sort=scheduledFor&cursor=c-1&limit=50',
    );
  });

  it('drops an empty status list instead of sending status=', async () => {
    await listAudits({ status: [], overdue: true });
    expect(lastCall()[0]).toBe('/admin/audits?overdue=true');
  });
});

describe('getAuditCompliance', () => {
  it('GETs /admin/audits/compliance with its filters', async () => {
    await getAuditCompliance({ fiscalYear: '2026-27', zoneId: ZONE, complianceStatus: 'NON_COMPLIANT', limit: 20 });
    expect(lastCall()).toEqual([
      `/admin/audits/compliance?fiscalYear=2026-27&zoneId=${ZONE}&complianceStatus=NON_COMPLIANT&limit=20`,
      GET,
    ]);
  });

  it('sends no query by default (server picks the current fiscal year)', async () => {
    await getAuditCompliance();
    expect(lastCall()).toEqual(['/admin/audits/compliance', GET]);
  });
});

describe('writes', () => {
  it('createAudit POSTs AuditCreate as given, with no Idempotency-Key', async () => {
    const body = {
      farmerId: FARMER,
      auditType: 'EXTERNAL' as const,
      scheduledFor: '2026-11-05T04:30:00Z',
      externalAgencyName: 'PGS Regional Council',
    };
    await createAudit(body);
    expectWrite('/admin/audits', 'POST', body);
    expect(lastCall()[1]).not.toHaveProperty('idempotencyKey');
  });

  it('setAuditScores PUTs the score sheet to /scores', async () => {
    const body = {
      scores: [
        { categoryCode: 'CERTIFICATION' as const, score: 8 },
        { categoryCode: 'SOIL_LAND' as const, score: 7, remarks: 'r' },
      ],
      summary: 's',
    };
    await setAuditScores(AUDIT, body);
    expectWrite(`/admin/audits/${AUDIT}/scores`, 'PUT', body);
  });

  it('bulkRescheduleAudits sends the body guard (expectedScheduledFor), not a header', async () => {
    const body = { items: [{ auditId: AUDIT, expectedScheduledFor: '2026-10-14T04:30:00Z' }], shiftDays: 7, reason: 'Rain' };
    await bulkRescheduleAudits(body);
    expectWrite('/admin/audits/bulk-reschedule', 'POST', body);
    expect(lastCall()[1]).not.toHaveProperty('idempotencyKey');
  });

  it('routes every transition to its documented path and method', async () => {
    await updateAudit(AUDIT, { scheduledFor: '2026-11-06T04:30:00Z', reason: 'x' });
    expectWrite(`/admin/audits/${AUDIT}`, 'PATCH', { scheduledFor: '2026-11-06T04:30:00Z', reason: 'x' });
    await cancelAudit(AUDIT, { reason: 'abc' });
    expectWrite(`/admin/audits/${AUDIT}/cancel`, 'POST', { reason: 'abc' });
    await startAudit(AUDIT);
    expectWrite(`/admin/audits/${AUDIT}/start`, 'POST', {});
    await completeAudit(AUDIT, { summary: 'done' });
    expectWrite(`/admin/audits/${AUDIT}/complete`, 'POST', { summary: 'done' });
    await createAuditFinding(AUDIT, { severity: 'MAJOR', description: 'abc' });
    expectWrite(`/admin/audits/${AUDIT}/findings`, 'POST', { severity: 'MAJOR', description: 'abc' });
    await updateAuditFinding(AUDIT, FINDING, { resolved: true, resolutionNote: 'ok' });
    expectWrite(`/admin/audits/${AUDIT}/findings/${FINDING}`, 'PATCH', { resolved: true, resolutionNote: 'ok' });
    await redFlagAudit(AUDIT, { reason: 'abc' });
    expectWrite(`/admin/audits/${AUDIT}/red-flag`, 'POST', { reason: 'abc' });
    await clearAuditRedFlag(AUDIT);
    expectWrite(`/admin/audits/${AUDIT}/clear-red-flag`, 'POST', {});
    const tiers = {
      tiers: [
        { code: 'POOR' as const, minScore: 0, maxScore: 40 },
        { code: 'MODERATE' as const, minScore: 40, maxScore: 60 },
        { code: 'GOOD' as const, minScore: 60, maxScore: 80 },
        { code: 'EXCELLENT' as const, minScore: 80, maxScore: null },
      ],
    };
    await updateAuditTierThresholds(tiers);
    expectWrite('/admin/audit-tier-thresholds', 'PATCH', tiers);
  });

  it('getAudit encodes the id as one path segment', async () => {
    await getAudit('a/b?c');
    expect(lastCall()).toEqual(['/admin/audits/a%2Fb%3Fc', GET]);
  });
});

describe('getAuditReportUrl', () => {
  it('asks for redirect=true with the bearer token and returns the signed URL it landed on', async () => {
    const signed = `http://localhost:3000/v1/admin/audits/${AUDIT}/report?token=t&expires=1`;
    let requested = '';
    let headers: Record<string, string> = {};
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      requested = String(input);
      headers = (init?.headers ?? {}) as Record<string, string>;
      const res = new Response('%PDF', { status: 200 });
      Object.defineProperty(res, 'url', { value: signed });
      return res;
    }) as typeof fetch;

    await expect(getAuditReportUrl(AUDIT, 'agency')).resolves.toBe(signed);
    expect(requested).toMatch(new RegExp(`/admin/audits/${AUDIT}/report\\?variant=agency&redirect=true$`));
    expect(headers['Authorization']).toBe('Bearer token-admin');
  });

  it('fails (never a token-less link) when the server streamed the file instead of redirecting', async () => {
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const res = new Response('%PDF', { status: 200 });
      Object.defineProperty(res, 'url', { value: String(input) });
      return res;
    }) as typeof fetch;
    await expect(getAuditReportUrl(AUDIT)).rejects.toBeInstanceOf(ApiError);
  });
});
