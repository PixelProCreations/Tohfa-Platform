import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  auditConductedBy,
  auditScore,
  deriveAuditsOverview,
  fiscalYearLabel,
  getMyAudit,
  getMyAuditReportUrl,
  isAuditNotFound,
  istDateParts,
  listAllMyAudits,
  listMyAudits,
  scoreFraction,
  tierLabelKey,
  type FarmerAuditDetail,
  type FarmerAuditSummary,
} from '../api/audits';
import { ApiError, setAccessToken } from '../../../shell/api/client';
import { en, t, type TranslationKey } from '../../../i18n/farmer';
import ta from '../../../i18n/farmer.ta.json';

function audit(overrides: Partial<FarmerAuditSummary> = {}): FarmerAuditSummary {
  return {
    id: 'a-1',
    farmId: null,
    farmName: null,
    fiscalYear: '2026-27',
    quarter: 2,
    auditType: 'EXTERNAL',
    status: 'COMPLETED',
    scheduledFor: '2026-08-05T04:30:00.000Z',
    startedAt: '2026-08-05T04:30:00.000Z',
    completedAt: '2026-08-05T07:00:00.000Z',
    auditorName: null,
    externalAgencyName: 'PGS Regional Council',
    totalScore: 72,
    maxScore: 100,
    tier: 'GOOD',
    majorViolationsCount: 0,
    findingCounts: { major: 0, minor: 1, observation: 0, openMajor: 0 },
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' },
  });
}

const notFoundProblem = { type: 'about:blank', title: 'Not Found', status: 404, code: 'NOT_FOUND' };

describe('Farmer audits: api client (GET /farmers/me/audits*)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setAccessToken('token-farmer-a');
  });
  afterEach(() => setAccessToken(null));

  it('listMyAudits() calls the farmer-own list with the query encoded', async () => {
    let url = '';
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      url = String(input);
      return jsonResponse({ items: [], page: { nextCursor: null, hasMore: false } });
    }) as typeof fetch;

    await listMyAudits({ type: 'INTERNAL', status: ['SCHEDULED', 'IN_PROGRESS'], limit: 50 });

    expect(url).toContain('/v1/farmers/me/audits?');
    expect(url).toContain('type=INTERNAL');
    expect(url).toContain('status=SCHEDULED%2CIN_PROGRESS');
    expect(url).toContain('limit=50');
  });

  it('listAllMyAudits() handles an empty response as an empty history', async () => {
    global.fetch = vi.fn(async () => jsonResponse({ items: [], page: { nextCursor: null, hasMore: false } })) as typeof fetch;

    const items = await listAllMyAudits();

    expect(items).toEqual([]);
    expect(deriveAuditsOverview(items).isEmpty).toBe(true);
  });

  it('listAllMyAudits() follows the cursor until hasMore is false', async () => {
    const urls: string[] = [];
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return urls.length === 1
        ? jsonResponse({ items: [audit({ id: 'a-1' })], page: { nextCursor: 'c2', hasMore: true } })
        : jsonResponse({ items: [audit({ id: 'a-2' })], page: { nextCursor: null, hasMore: false } });
    }) as typeof fetch;

    const items = await listAllMyAudits();

    expect(items.map((a) => a.id)).toEqual(['a-1', 'a-2']);
    expect(urls[1]).toContain('cursor=c2');
  });

  it("BR-36a (client): a 404 for another farmer's audit surfaces as the not-found state", async () => {
    global.fetch = vi.fn(async () => jsonResponse(notFoundProblem, 404)) as typeof fetch;

    const error = await getMyAudit('farmer-b-audit').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(isAuditNotFound(error)).toBe(true);
  });

  it('a non-404 failure is not treated as not-found (the screen shows error-with-retry instead)', async () => {
    global.fetch = vi.fn(async () =>
      jsonResponse({ type: 'about:blank', title: 'Server error', status: 500, code: 'INTERNAL' }, 500),
    ) as typeof fetch;

    const error = await getMyAudit('a-1').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(isAuditNotFound(error)).toBe(false);
  });

  it('getMyAudit() returns the detail unchanged', async () => {
    const detail: FarmerAuditDetail = {
      ...audit(),
      summary: 'Well kept records.',
      hasAgencyReport: true,
      cancelledReason: null,
      categoryScores: [],
      findings: [],
    };
    global.fetch = vi.fn(async () => jsonResponse(detail)) as typeof fetch;

    await expect(getMyAudit('a-1')).resolves.toEqual(detail);
  });

  describe('getMyAuditReportUrl()', () => {
    it('sends the bearer token with redirect=true and returns the signed URL the redirect landed on', async () => {
      let requested = '';
      let auth = '';
      global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        requested = String(input);
        auth = (init?.headers as Record<string, string>)['Authorization'] ?? '';
        const res = new Response('%PDF-1.4', { status: 200, headers: { 'Content-Type': 'application/pdf' } });
        Object.defineProperty(res, 'url', { value: 'https://files.example/signed/report.pdf?sig=abc' });
        return res;
      }) as typeof fetch;

      const url = await getMyAuditReportUrl('a-1', 'agency');

      expect(requested).toContain('/v1/farmers/me/audits/a-1/report?variant=agency&redirect=true');
      expect(auth).toBe('Bearer token-farmer-a');
      expect(url).toBe('https://files.example/signed/report.pdf?sig=abc');
    });

    it("BR-36b (client): a 404 for another farmer's report PDF surfaces as not-found", async () => {
      global.fetch = vi.fn(async () => jsonResponse(notFoundProblem, 404)) as typeof fetch;

      const error = await getMyAuditReportUrl('farmer-b-audit').catch((e: unknown) => e);

      expect(isAuditNotFound(error)).toBe(true);
    });

    it('fails loudly (not silently) if the server streamed the PDF instead of redirecting', async () => {
      global.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const res = new Response('%PDF-1.4', { status: 200 });
        Object.defineProperty(res, 'url', { value: String(input) });
        return res;
      }) as typeof fetch;

      await expect(getMyAuditReportUrl('a-1')).rejects.toBeInstanceOf(ApiError);
    });
  });
});

describe('Farmer audits: view helpers', () => {
  it('BR-04: maps each server tier to its farmer i18n label (never derived from the score)', () => {
    expect(tierLabelKey('POOR')).toBe('farmer.profile.rating.tier.poor');
    expect(tierLabelKey('MODERATE')).toBe('farmer.profile.rating.tier.moderate');
    expect(tierLabelKey('GOOD')).toBe('farmer.profile.rating.tier.good');
    expect(tierLabelKey('EXCELLENT')).toBe('farmer.profile.rating.tier.excellent');
    expect(tierLabelKey(null)).toBeNull();
    // A score the client might map differently still shows the server's tier.
    expect(tierLabelKey(audit({ totalScore: 95, tier: 'GOOD' }).tier)).toBe('farmer.profile.rating.tier.good');
  });

  it('BR-06: shows the total out of 100 only for a COMPLETED audit', () => {
    expect(auditScore(audit({ totalScore: 72 }))).toEqual({ score: 72, max: 100 });
    expect(auditScore(audit({ status: 'SCHEDULED', totalScore: null, tier: null }))).toBeNull();
    expect(auditScore(audit({ status: 'IN_PROGRESS', totalScore: null, tier: null }))).toBeNull();
    // Defensive: even if a stray total arrived on a non-completed audit, it is not shown.
    expect(auditScore(audit({ status: 'CANCELLED', totalScore: 40 }))).toBeNull();
  });

  it('positions the gauge needle by score / max, clamped', () => {
    expect(scoreFraction(0, 100)).toBe(0);
    expect(scoreFraction(50, 100)).toBe(0.5);
    expect(scoreFraction(100, 100)).toBe(1);
    expect(scoreFraction(120, 100)).toBe(1);
    expect(scoreFraction(null, 100)).toBe(0);
  });

  it('names the agency for EXTERNAL and the TOHFA auditor for INTERNAL', () => {
    expect(auditConductedBy(audit({ auditType: 'EXTERNAL', externalAgencyName: 'PGS', auditorName: null }))).toBe('PGS');
    expect(auditConductedBy(audit({ auditType: 'INTERNAL', externalAgencyName: null, auditorName: 'S. Devaraj' }))).toBe(
      'S. Devaraj',
    );
    expect(auditConductedBy(audit({ externalAgencyName: null, auditorName: null }))).toBeNull();
  });

  it('BR-03: derives the Indian fiscal year in IST (1 Apr 00:30 IST is the new year)', () => {
    expect(fiscalYearLabel(new Date('2027-02-15T06:00:00.000Z'))).toBe('2026-27');
    expect(fiscalYearLabel(new Date('2026-03-31T19:00:00.000Z'))).toBe('2026-27');
    expect(fiscalYearLabel(new Date('2026-03-31T18:00:00.000Z'))).toBe('2025-26');
  });

  it('formats dates in IST, not device-local time', () => {
    expect(istDateParts('2026-08-04T20:00:00.000Z')).toEqual({ day: 5, monthIndex: 7, year: 2026, hour: 1, minute: 30 });
    expect(istDateParts('not-a-date')).toBeNull();
  });

  it('BR-03: splits per type into next upcoming, later upcoming and past, and counts done this fiscal year', () => {
    const items = [
      audit({ id: 'done-q1', quarter: 1, completedAt: '2026-05-10T06:00:00.000Z', tier: 'MODERATE' }),
      audit({ id: 'done-q2', quarter: 2, completedAt: '2026-08-05T07:00:00.000Z', tier: 'EXCELLENT' }),
      audit({ id: 'old', fiscalYear: '2025-26', quarter: 4, completedAt: '2026-02-10T06:00:00.000Z' }),
      audit({
        id: 'q4',
        quarter: 4,
        status: 'SCHEDULED',
        scheduledFor: '2027-02-01T04:30:00.000Z',
        startedAt: null,
        completedAt: null,
        totalScore: null,
        tier: null,
      }),
      audit({
        id: 'q3',
        quarter: 3,
        status: 'IN_PROGRESS',
        scheduledFor: '2026-11-01T04:30:00.000Z',
        completedAt: null,
        totalScore: null,
        tier: null,
      }),
      audit({ id: 'cancelled', status: 'CANCELLED', completedAt: null, totalScore: null, tier: null }),
      audit({
        id: 'internal-1',
        auditType: 'INTERNAL',
        externalAgencyName: null,
        auditorName: 'S. Devaraj',
        completedAt: '2026-04-28T06:00:00.000Z',
        tier: 'GOOD',
      }),
    ];

    const overview = deriveAuditsOverview(items, new Date('2026-09-01T00:00:00.000Z'));

    expect(overview.currentFiscalYear).toBe('2026-27');
    expect(overview.EXTERNAL.next?.id).toBe('q3');
    expect(overview.EXTERNAL.laterUpcoming.map((a) => a.id)).toEqual(['q4']);
    expect(overview.EXTERNAL.past.map((a) => a.id)).toEqual(['done-q2', 'cancelled', 'done-q1', 'old']);
    expect(overview.INTERNAL.next).toBeNull();
    expect(overview.INTERNAL.past.map((a) => a.id)).toEqual(['internal-1']);
    // Cancelled, in-progress and last year's audits do not count toward this year's done total.
    expect(overview.doneThisYear).toBe(3);
    expect(overview.latestTier).toBe('EXCELLENT');
    expect(overview.isEmpty).toBe(false);
  });

  it('every audit i18n key used by the screens exists in both English and Tamil', () => {
    const taKeys = ta as Record<string, string>;
    const keys = Object.keys(en).filter((key) => key.startsWith('farmer.audits.') || key.startsWith('farmer.auditResult.'));
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(taKeys[key], `missing Tamil for ${key}`).toBeTruthy();
    }
    expect(t('farmer.audits.pill.tierScore' as TranslationKey, { tier: 'Good', score: 72, max: 100 })).toBe('Good · 72/100');
  });
});
