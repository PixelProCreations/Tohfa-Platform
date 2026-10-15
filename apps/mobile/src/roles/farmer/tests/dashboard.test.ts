/**
 * Farmer Dashboard live widgets: the pure view helpers the dashboard renders
 * from (screens/dashboard/dashboardWidgets.ts) and the two list loaders it
 * calls (api/crops.ts `listAllActiveFarmCrops`, api/farmer.ts
 * `listAllMyCertifications`). Plain Node, no React -- same constraint as
 * audits.test.ts / listings.test.ts (see this app's CLAUDE.md "Testing").
 *
 * BR-01/BR-02 (certificate validity / verification) are enforced
 * SERVER-SIDE; the certification summary here only mirrors the server's
 * `verificationStatus` + `daysToExpiry` for display, so those tests are
 * named with the rule ID and assert only the client mirror.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  auditCountdown,
  cropCardView,
  DASHBOARD_CROP_PREVIEW_LIMIT,
  istDayDiff,
  selectCropPreview,
  selectNextAudit,
  soonestPendingCounterOffers,
  summarizeCertifications,
  UPCOMING_AUDIT_STATUSES,
} from '../screens/dashboard/dashboardWidgets';
import { listMyAudits, type FarmerAuditSummary } from '../api/audits';
import {
  ACTIVE_FARM_CROP_STATUSES,
  listAllActiveFarmCrops,
  type FarmCropResponse,
  type PlotFarmCrop,
} from '../api/crops';
import { evalMarketBlock, listAllMyCertifications, type Certification } from '../api/farmer';
import type { CounterOffer, Listing } from '../api/listings';
import type { DiaryPlot } from '../api/farmDiary';
import { ApiError, setAccessToken } from '../../../shell/api/client';
import { en } from '../../../i18n/farmer';
import ta from '../../../i18n/farmer.ta.json';

// 2026-10-05 11:30 IST
const NOW = new Date('2026-10-05T06:00:00.000Z');

function audit(overrides: Partial<FarmerAuditSummary> = {}): FarmerAuditSummary {
  return {
    id: 'a-1',
    farmId: null,
    farmName: null,
    fiscalYear: '2026-27',
    quarter: 3,
    auditType: 'EXTERNAL',
    status: 'SCHEDULED',
    scheduledFor: '2026-10-17T04:30:00.000Z',
    startedAt: null,
    completedAt: null,
    auditorName: null,
    externalAgencyName: 'PGS Regional Council',
    totalScore: null,
    maxScore: 100,
    tier: null,
    majorViolationsCount: 0,
    findingCounts: { major: 0, minor: 0, observation: 0, openMajor: 0 },
    ...overrides,
  };
}

function plot(overrides: Partial<DiaryPlot> = {}): DiaryPlot {
  return { id: 'plot-1', name: 'Zone A', areaAcres: 1.5, ...overrides };
}

function crop(overrides: Partial<FarmCropResponse> = {}): FarmCropResponse {
  return {
    id: 'crop-1',
    plotId: 'plot-1',
    cropMasterId: 'cm-tomato',
    cropName: 'Tomato',
    cropNameTa: null,
    cropIconKey: 'tomato',
    status: 'GROWING',
    plantedOn: '2026-08-21',
    expectedHarvestOn: '2026-11-04',
    actualHarvestOn: null,
    expectedYieldKg: null,
    actualYieldKg: null,
    seedVariety: null,
    seedCompany: null,
    seedQuantity: null,
    seedQuantityUnit: null,
    seedCostPaise: null,
    expectedGrade: null,
    notes: null,
    createdAt: '2026-08-21T04:30:00.000Z',
    updatedAt: null,
    ...overrides,
  };
}

function entry(c: Partial<FarmCropResponse> = {}, p: Partial<DiaryPlot> = {}): PlotFarmCrop {
  return { crop: crop(c), plot: plot(p) };
}

function cert(overrides: Partial<Certification> = {}): Certification {
  return {
    id: 'cert-1',
    certType: 'PGS',
    certNumber: 'PGS-TN-1',
    issuingBody: 'PGS Council',
    issuedOn: '2026-01-01',
    expiresOn: '2027-01-01',
    verificationStatus: 'VERIFIED',
    daysToExpiry: 88,
    blocksListings: false,
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' },
  });
}

const emptyPage = { items: [], page: { nextCursor: null, hasMore: false } };

// ---------------------------------------------------------------------------
// Audit mini-card
// ---------------------------------------------------------------------------

describe('Dashboard: next audit mini-card', () => {
  it('asks the server only for SCHEDULED / IN_PROGRESS audits', () => {
    expect([...UPCOMING_AUDIT_STATUSES].sort()).toEqual(['IN_PROGRESS', 'SCHEDULED']);
  });

  it('selectNextAudit() is null when nothing is upcoming (empty, or only COMPLETED / CANCELLED)', () => {
    expect(selectNextAudit([])).toBeNull();
    expect(
      selectNextAudit([
        audit({ id: 'done', status: 'COMPLETED', completedAt: '2026-08-05T07:00:00.000Z', totalScore: 80, tier: 'GOOD' }),
        audit({ id: 'off', status: 'CANCELLED' }),
      ]),
    ).toBeNull();
  });

  it('selectNextAudit() picks the earliest SCHEDULED audit, including a Postgres-text timestamp', () => {
    const next = selectNextAudit([
      audit({ id: 'later', scheduledFor: '2026-12-01T04:30:00.000Z' }),
      audit({ id: 'soonest', scheduledFor: '2026-10-17 04:30:00+00' }),
      audit({ id: 'done', status: 'COMPLETED', scheduledFor: '2026-08-05T04:30:00.000Z' }),
    ]);
    expect(next?.id).toBe('soonest');
  });

  it('selectNextAudit() prefers an audit already IN_PROGRESS over a scheduled one', () => {
    const next = selectNextAudit([
      audit({ id: 'scheduled', scheduledFor: '2026-10-10T04:30:00.000Z' }),
      audit({ id: 'running', status: 'IN_PROGRESS', scheduledFor: '2026-10-20T04:30:00.000Z', auditType: 'INTERNAL' }),
    ]);
    expect(next?.id).toBe('running');
  });

  it('selectNextAudit() sorts an unparseable scheduledFor last instead of first', () => {
    const next = selectNextAudit([
      audit({ id: 'garbage', scheduledFor: 'not-a-date' }),
      audit({ id: 'real', scheduledFor: '2026-11-01T04:30:00.000Z' }),
    ]);
    expect(next?.id).toBe('real');
  });

  it('istDayDiff() counts IST calendar days, not 24-hour blocks', () => {
    expect(istDayDiff('2026-10-05T18:00:00.000Z', NOW)).toBe(0); // 23:30 IST same day
    expect(istDayDiff('2026-10-05T18:30:00.000Z', NOW)).toBe(1); // 00:00 IST next day
    expect(istDayDiff('2026-10-17T04:30:00.000Z', NOW)).toBe(12);
    expect(istDayDiff('2026-10-17', NOW)).toBe(12); // date-only values are calendar dates
    expect(istDayDiff('2026-10-01 07:42:36.490266+00', NOW)).toBe(-4);
    expect(istDayDiff('garbage', NOW)).toBeNull();
  });

  it('auditCountdown() shows a real countdown to the next audit', () => {
    expect(auditCountdown(null, NOW)).toEqual({ kind: 'none' });
    expect(auditCountdown(audit({ status: 'IN_PROGRESS', scheduledFor: '2026-10-01T04:30:00.000Z' }), NOW)).toEqual({
      kind: 'inProgress',
    });
    expect(auditCountdown(audit({ scheduledFor: '2026-10-05T10:00:00.000Z' }), NOW)).toEqual({ kind: 'today' });
    expect(auditCountdown(audit({ scheduledFor: '2026-10-06T04:30:00.000Z' }), NOW)).toEqual({ kind: 'tomorrow' });
    expect(auditCountdown(audit({ scheduledFor: '2026-10-17T04:30:00.000Z' }), NOW)).toEqual({ kind: 'inDays', days: 12 });
  });

  it('auditCountdown() shows the date (not a negative countdown) for a scheduled audit whose day has passed', () => {
    expect(auditCountdown(audit({ scheduledFor: '2026-10-01T04:30:00.000Z' }), NOW)).toEqual({
      kind: 'past',
      day: 1,
      monthIndex: 9,
    });
    expect(auditCountdown(audit({ scheduledFor: 'garbage' }), NOW)).toEqual({ kind: 'unknown' });
  });

  it('listMyAudits() with the dashboard query asks for upcoming audits, soonest first', async () => {
    setAccessToken('token-farmer-a');
    let url = '';
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      url = String(input);
      return jsonResponse(emptyPage);
    }) as typeof fetch;

    await listMyAudits({ status: [...UPCOMING_AUDIT_STATUSES], sort: 'scheduledFor', limit: 100 });

    expect(url).toContain('/v1/farmers/me/audits?');
    expect(url).toMatch(/status=(SCHEDULED%2CIN_PROGRESS|IN_PROGRESS%2CSCHEDULED)/);
    expect(url).toContain('sort=scheduledFor');
    setAccessToken(null);
  });
});

// ---------------------------------------------------------------------------
// Active crops
// ---------------------------------------------------------------------------

describe('Dashboard: active crops (GET /farmers/me/diary/plots + /plots/{id}/crops)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setAccessToken('token-farmer-a');
  });
  afterEach(() => setAccessToken(null));

  it('active means GROWING or PLANNED -- never HARVESTED / FAILED', () => {
    expect([...ACTIVE_FARM_CROP_STATUSES].sort()).toEqual(['GROWING', 'PLANNED']);
  });

  it('listAllActiveFarmCrops() queries every plot by status only, walks the cursor, and de-duplicates', async () => {
    const urls: string[] = [];
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      if (url.includes('/diary/plots')) {
        return jsonResponse({ items: [plot({ id: 'p1', name: 'Zone A' }), plot({ id: 'p2', name: 'Zone B' })] });
      }
      if (url.includes('/plots/p1/crops') && url.includes('status=GROWING')) {
        if (!url.includes('cursor=')) {
          return jsonResponse({ items: [crop({ id: 'c1', plotId: 'p1' })], page: { nextCursor: 'next-1', hasMore: true } });
        }
        return jsonResponse({ items: [crop({ id: 'c2', plotId: 'p1', cropName: 'Carrot' })], page: { nextCursor: null, hasMore: false } });
      }
      if (url.includes('/plots/p2/crops') && url.includes('status=PLANNED')) {
        return jsonResponse({
          items: [crop({ id: 'c3', plotId: 'p2', status: 'PLANNED' }), crop({ id: 'c1', plotId: 'p1' })],
          page: { nextCursor: null, hasMore: false },
        });
      }
      return jsonResponse(emptyPage);
    }) as typeof fetch;

    const result = await listAllActiveFarmCrops();

    const cropUrls = urls.filter((u) => u.includes('/crops'));
    expect(cropUrls.length).toBe(5); // 2 plots x 2 statuses + 1 extra page
    expect(cropUrls.every((u) => /status=(GROWING|PLANNED)/.test(u))).toBe(true);
    expect(cropUrls.some((u) => u.includes('cursor=next-1'))).toBe(true);
    expect(result.items.map((e) => e.crop.id).sort()).toEqual(['c1', 'c2', 'c3']);
    expect(result.items.find((e) => e.crop.id === 'c3')?.plot.name).toBe('Zone B');
    expect(result.plots.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(result.complete).toBe(true);
  });

  it('listAllActiveFarmCrops() reports an incomplete result instead of silently truncating a looping cursor', async () => {
    let n = 0;
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/diary/plots')) return jsonResponse({ items: [plot({ id: 'p1' })] });
      if (url.includes('status=GROWING')) {
        n += 1;
        return jsonResponse({ items: [crop({ id: `loop-${n}` })], page: { nextCursor: `c-${n}`, hasMore: true } });
      }
      return jsonResponse(emptyPage);
    }) as typeof fetch;

    const result = await listAllActiveFarmCrops();
    expect(result.complete).toBe(false);
    expect(n).toBeLessThanOrEqual(20);
    expect(result.items.length).toBe(n);
  });

  it('listAllActiveFarmCrops() forwards the abort signal and rejects when the plots call fails', async () => {
    const controller = new AbortController();
    let seenSignal: AbortSignal | undefined;
    global.fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      seenSignal = init?.signal ?? undefined;
      return jsonResponse({ type: 'about:blank', title: 'Boom', status: 500, code: 'INTERNAL' }, 500);
    }) as typeof fetch;

    await expect(listAllActiveFarmCrops(controller.signal)).rejects.toBeInstanceOf(ApiError);
    expect(seenSignal).toBe(controller.signal);
  });

  it('selectCropPreview() shows GROWING before PLANNED, soonest harvest first, and counts the rest truthfully', () => {
    const items = [
      entry({ id: 'planned', status: 'PLANNED', plantedOn: null, expectedHarvestOn: '2026-10-20' }),
      entry({ id: 'no-date', status: 'GROWING', expectedHarvestOn: null }),
      entry({ id: 'late', status: 'GROWING', expectedHarvestOn: '2026-12-30' }),
      entry({ id: 'soon', status: 'GROWING', expectedHarvestOn: '2026-10-08' }),
    ];
    const preview = selectCropPreview({ plots: [plot()], items, complete: true }, 3);
    expect(preview.shown.map((e) => e.crop.id)).toEqual(['soon', 'late', 'no-date']);
    expect(preview.total).toBe(4);
    expect(preview.hiddenCount).toBe(1);
    expect(preview.totalIsExact).toBe(true);

    const partial = selectCropPreview({ plots: [plot()], items, complete: false }, 3);
    expect(partial.totalIsExact).toBe(false);
  });

  it('selectCropPreview() handles fewer crops than the preview size, and none', () => {
    expect(DASHBOARD_CROP_PREVIEW_LIMIT).toBeGreaterThan(0);
    const one = selectCropPreview({ plots: [plot()], items: [entry()], complete: true }, 3);
    expect(one.shown.length).toBe(1);
    expect(one.hiddenCount).toBe(0);
    const none = selectCropPreview({ plots: [], items: [], complete: true }, 3);
    expect(none.shown).toEqual([]);
    expect(none.total).toBe(0);
  });

  it('cropCardView() derives age, harvest countdown and progress only from real dates', () => {
    const view = cropCardView(entry(), NOW);
    expect(view.name).toBe('Tomato');
    expect(view.plotName).toBe('Zone A');
    expect(view.daysOld).toBe(45); // 21 Aug -> 5 Oct
    expect(view.daysToHarvest).toBe(30); // 5 Oct -> 4 Nov
    expect(view.progressPercent).toBe(60); // 45 of 75 days
    expect(view.status).toBe('GROWING');
  });

  it('cropCardView() leaves age / progress unknown (null) rather than inventing them', () => {
    const planned = cropCardView(entry({ status: 'PLANNED', plantedOn: null, expectedHarvestOn: null }), NOW);
    expect(planned.daysOld).toBeNull();
    expect(planned.daysToHarvest).toBeNull();
    expect(planned.progressPercent).toBeNull();

    const growingNoHarvest = cropCardView(entry({ expectedHarvestOn: null }), NOW);
    expect(growingNoHarvest.daysOld).toBe(45);
    expect(growingNoHarvest.progressPercent).toBeNull();

    const notYetPlanted = cropCardView(entry({ status: 'PLANNED', plantedOn: '2026-10-15', expectedHarvestOn: '2027-01-15' }), NOW);
    expect(notYetPlanted.daysOld).toBeNull(); // planting date still in the future
    expect(notYetPlanted.progressPercent).toBe(0);

    const overdue = cropCardView(entry({ expectedHarvestOn: '2026-10-01' }), NOW);
    expect(overdue.daysToHarvest).toBe(-4);
    expect(overdue.progressPercent).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Certification card
// ---------------------------------------------------------------------------

describe('Dashboard: certification card (GET /farmers/me/certifications)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setAccessToken('token-farmer-a');
  });
  afterEach(() => setAccessToken(null));

  it('summarizeCertifications() has a real empty state', () => {
    expect(summarizeCertifications([], 30)).toEqual({ kind: 'none' });
  });

  it('BR-01: a verified, unexpired certificate is valid; within the configured warning window it is expiring', () => {
    expect(summarizeCertifications([cert({ daysToExpiry: 88 })], 30)).toEqual({ kind: 'valid', days: 88 });
    expect(summarizeCertifications([cert({ daysToExpiry: 30 })], 30)).toEqual({ kind: 'expiring', days: 30 });
    expect(summarizeCertifications([cert({ daysToExpiry: 31 })], 30)).toEqual({ kind: 'valid', days: 31 });
    // The window comes from system_config, not a constant.
    expect(summarizeCertifications([cert({ daysToExpiry: 31 })], 45)).toEqual({ kind: 'expiring', days: 31 });
    expect(summarizeCertifications([cert({ daysToExpiry: 0 })], 30)).toEqual({ kind: 'expiring', days: 0 });
  });

  it('BR-01: the certificate that keeps the farmer certified wins over an expired one', () => {
    const summary = summarizeCertifications(
      [
        cert({ id: 'old', daysToExpiry: -40, blocksListings: true }),
        cert({ id: 'short', certType: 'NPOP', daysToExpiry: 12 }),
        cert({ id: 'long', daysToExpiry: 200 }),
      ],
      30,
    );
    expect(summary).toEqual({ kind: 'valid', days: 200 });
  });

  it('BR-01: only expired certificates -> expired, by the most recent one', () => {
    const summary = summarizeCertifications(
      [cert({ id: 'a', daysToExpiry: -90, blocksListings: true }), cert({ id: 'b', daysToExpiry: -3, blocksListings: true })],
      30,
    );
    expect(summary).toEqual({ kind: 'expired', days: 3 });
  });

  it('BR-02: an unverified, unexpired certificate is pending -- never shown as valid', () => {
    expect(
      summarizeCertifications([cert({ verificationStatus: 'UNVERIFIED', daysToExpiry: 300, blocksListings: true })], 30),
    ).toEqual({ kind: 'pending' });
    expect(
      summarizeCertifications(
        [
          cert({ id: 'expired', daysToExpiry: -5, blocksListings: true }),
          cert({ id: 'new', verificationStatus: 'UNVERIFIED', daysToExpiry: 300, blocksListings: true }),
        ],
        30,
      ),
    ).toEqual({ kind: 'pending' });
  });

  it('BR-02: only rejected certificates -> rejected', () => {
    expect(
      summarizeCertifications([cert({ verificationStatus: 'REJECTED', daysToExpiry: 300, blocksListings: true })], 30),
    ).toEqual({ kind: 'rejected' });
  });

  // BR-02h / BR-02i: OTHER may be recorded (and verified) but never counts for
  // listing, so the farmer-level summary ignores it entirely -- it neither
  // makes a farmer valid nor names pending / expired as the way back.
  it('BR-02i: a farmer holding only OTHER certificates (verified, pending, expired or rejected) -> none', () => {
    for (const other of [
      cert({ certType: 'OTHER', daysToExpiry: 200, blocksListings: true }),
      cert({ certType: 'OTHER', verificationStatus: 'UNVERIFIED', daysToExpiry: 300, blocksListings: true }),
      cert({ certType: 'OTHER', daysToExpiry: -4, blocksListings: true }),
      cert({ certType: 'OTHER', verificationStatus: 'REJECTED', daysToExpiry: 300, blocksListings: true }),
    ]) {
      expect(summarizeCertifications([other], 30), `${other.verificationStatus} ${other.daysToExpiry}`).toEqual({ kind: 'none' });
    }
  });

  it('BR-02i: OTHER next to PGS / NPOP is ignored -- the PGS / NPOP certificates alone decide', () => {
    const otherVerified = cert({ id: 'other', certType: 'OTHER', daysToExpiry: 400, blocksListings: true });
    const otherPending = cert({ id: 'other-p', certType: 'OTHER', verificationStatus: 'UNVERIFIED', daysToExpiry: 400, blocksListings: true });
    // A valid PGS certificate is still valid, with ITS days, not the OTHER's.
    expect(summarizeCertifications([otherVerified, cert({ daysToExpiry: 88 })], 30)).toEqual({ kind: 'valid', days: 88 });
    // A verified OTHER does not rescue an expired NPOP.
    expect(
      summarizeCertifications([otherVerified, cert({ certType: 'NPOP', daysToExpiry: -6, blocksListings: true })], 30),
    ).toEqual({ kind: 'expired', days: 6 });
    // A pending OTHER is not "pending" for an expired PGS farmer.
    expect(summarizeCertifications([otherPending, cert({ daysToExpiry: -6, blocksListings: true })], 30)).toEqual({
      kind: 'expired',
      days: 6,
    });
    // OTHER pending + PGS pending -> pending (the PGS one).
    expect(
      summarizeCertifications(
        [otherPending, cert({ verificationStatus: 'UNVERIFIED', daysToExpiry: 300, blocksListings: true })],
        30,
      ),
    ).toEqual({ kind: 'pending' });
    // A verified OTHER next to a rejected PGS -> rejected.
    expect(
      summarizeCertifications([otherVerified, cert({ verificationStatus: 'REJECTED', daysToExpiry: 300, blocksListings: true })], 30),
    ).toEqual({ kind: 'rejected' });
  });

  it('listAllMyCertifications() walks the cursor and returns [] for a farmer with none', async () => {
    const urls: string[] = [];
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      if (!url.includes('cursor=')) {
        return jsonResponse({ items: [cert({ id: 'one' })], page: { nextCursor: 'c2', hasMore: true } });
      }
      return jsonResponse({ items: [cert({ id: 'two' })], page: { nextCursor: null, hasMore: false } });
    }) as typeof fetch;

    const items = await listAllMyCertifications();
    expect(items.map((c) => c.id)).toEqual(['one', 'two']);
    expect(urls[0]).toContain('/v1/farmers/me/certifications');

    global.fetch = vi.fn(async () => jsonResponse(emptyPage)) as typeof fetch;
    expect(await listAllMyCertifications()).toEqual([]);
  });

  it('listAllMyCertifications() surfaces a failure instead of falling back to demo certificates', async () => {
    global.fetch = vi.fn(async () =>
      jsonResponse({ type: 'about:blank', title: 'Boom', status: 500, code: 'INTERNAL' }, 500),
    ) as typeof fetch;
    await expect(listAllMyCertifications()).rejects.toBeInstanceOf(ApiError);
  });
});

// ---------------------------------------------------------------------------
// Market-access banner (api/farmer.ts evalMarketBlock) vs certification card
// ---------------------------------------------------------------------------

describe('Dashboard: market-access banner follows the certification card', () => {
  const WARN = 30;
  const valid = cert({ id: 'valid', daysToExpiry: 200 });
  const expired = cert({ id: 'expired', daysToExpiry: -10, blocksListings: true });
  const pending = cert({ id: 'pending', verificationStatus: 'UNVERIFIED', daysToExpiry: 300, blocksListings: true });
  const rejected = cert({ id: 'rejected', verificationStatus: 'REJECTED', daysToExpiry: 300, blocksListings: true });

  it('BR-01: a valid certificate plus an expired one does not block', () => {
    expect(evalMarketBlock({}, [valid, expired]).isBlocked).toBe(false);
    expect(summarizeCertifications([valid, expired], WARN).kind).toBe('valid');
  });

  it('BR-02: a valid certificate plus a pending one does not block', () => {
    expect(evalMarketBlock({}, [valid, pending]).isBlocked).toBe(false);
    expect(summarizeCertifications([valid, pending], WARN).kind).toBe('valid');
  });

  it('BR-01: a valid certificate overrides a stale server-side cert block on the profile once certs are loaded', () => {
    const stale = { isMarketBlocked: true, marketBlockReason: 'CERT_EXPIRED' };
    expect(evalMarketBlock(stale, [valid, expired]).isBlocked).toBe(false);
  });

  it('BR-01: only expired certificates -> blocked, CERT_EXPIRED', () => {
    const state = evalMarketBlock({}, [expired]);
    expect(state).toMatchObject({
      isBlocked: true,
      reason: 'CERT_EXPIRED',
      titleKey: 'farmer.dashboard.banner.certExpiredTitle',
      messageKey: 'farmer.dashboard.banner.certExpiredMessage',
    });
  });

  it('BR-02: only pending certificates -> blocked, CERT_UNVERIFIED', () => {
    const state = evalMarketBlock({}, [pending]);
    expect(state).toMatchObject({
      isBlocked: true,
      reason: 'CERT_UNVERIFIED',
      titleKey: 'farmer.dashboard.banner.certPendingTitle',
      messageKey: 'farmer.dashboard.banner.certPendingMessage',
    });
  });

  it('BR-02: expired plus pending (no valid) -> pending, matching the card', () => {
    expect(evalMarketBlock({}, [expired, pending]).reason).toBe('CERT_UNVERIFIED');
    expect(summarizeCertifications([expired, pending], WARN).kind).toBe('pending');
  });

  // The server refuses both with CERT_MISSING (docs/rules.md BR-02f / BR-02g);
  // the banner names the state and offers the way back (add a certificate).
  // Previously neither showed a banner -- changed on purpose, 2026-10-05.
  it('BR-02: no certificates -> blocked, CERT_MISSING, "No certificate added" banner', () => {
    expect(summarizeCertifications([], WARN).kind).toBe('none');
    expect(evalMarketBlock({}, [])).toMatchObject({
      isBlocked: true,
      reason: 'CERT_MISSING',
      titleKey: 'farmer.dashboard.banner.certMissingTitle',
      messageKey: 'farmer.dashboard.banner.certMissingMessage',
    });
  });

  it('BR-02: only rejected certificates -> blocked, CERT_MISSING, "Certificate rejected" banner', () => {
    expect(summarizeCertifications([rejected], WARN).kind).toBe('rejected');
    expect(evalMarketBlock({}, [rejected])).toMatchObject({
      isBlocked: true,
      reason: 'CERT_MISSING',
      titleKey: 'farmer.dashboard.banner.certRejectedTitle',
      messageKey: 'farmer.dashboard.banner.certRejectedMessage',
    });
  });

  it('BR-02: a valid certificate plus a rejected one does not block', () => {
    expect(evalMarketBlock({}, [valid, rejected]).isBlocked).toBe(false);
    expect(summarizeCertifications([valid, rejected], WARN).kind).toBe('valid');
  });

  it('BR-02: once certificates are loaded, "none" / "rejected" win over a generic server profile block', () => {
    // The server's market_block_reason is a sentence, not a code; with the
    // certificate list loaded, the banner names the real certificate state.
    const serverBlocked = { isMarketBlocked: true, marketBlockReason: 'No organic certifications uploaded (BR-01, BR-02)' };
    expect(evalMarketBlock(serverBlocked, []).titleKey).toBe('farmer.dashboard.banner.certMissingTitle');
    expect(evalMarketBlock(serverBlocked, [rejected]).titleKey).toBe('farmer.dashboard.banner.certRejectedTitle');
  });

  it('BR-01: while certificates are unloaded the profile flag stands in; a non-certificate block always shows', () => {
    expect(evalMarketBlock({ isMarketBlocked: true, marketBlockReason: 'CERT_EXPIRED' }, undefined).reason).toBe('CERT_EXPIRED');
    expect(evalMarketBlock({ isMarketBlocked: true, marketBlockReason: 'CERT_UNVERIFIED' }, undefined).reason).toBe('CERT_UNVERIFIED');
    expect(evalMarketBlock({ isMarketBlocked: false }, undefined).isBlocked).toBe(false);
    expect(evalMarketBlock({ isMarketBlocked: true, marketBlockReason: 'KYC_PENDING' }, [valid]).isBlocked).toBe(true);
    expect(evalMarketBlock({ isMarketBlocked: true, marketBlockReason: 'KYC_PENDING' }, undefined).isBlocked).toBe(true);
  });

  const otherVerified = cert({ id: 'other-verified', certType: 'OTHER', daysToExpiry: 200, blocksListings: true });
  const otherPending = cert({
    id: 'other-pending',
    certType: 'OTHER',
    verificationStatus: 'UNVERIFIED',
    daysToExpiry: 300,
    blocksListings: true,
  });
  const otherExpired = cert({ id: 'other-expired', certType: 'OTHER', daysToExpiry: -2, blocksListings: true });
  const otherRejected = cert({
    id: 'other-rejected',
    certType: 'OTHER',
    verificationStatus: 'REJECTED',
    daysToExpiry: 300,
    blocksListings: true,
  });

  // Mirrors the server's BR-02i cases (listings.test.ts): the banner reason is
  // the code POST /listings refuses with for the same certificates.
  it('BR-02i: with OTHER certificates the banner shows the code the server listing gate returns', () => {
    const table: Array<{ name: string; certs: Certification[]; reason: string | null; titleKey: string | null }> = [
      { name: 'OTHER unverified only', certs: [otherPending], reason: 'CERT_MISSING', titleKey: 'farmer.dashboard.banner.certMissingTitle' },
      { name: 'OTHER verified only', certs: [otherVerified], reason: 'CERT_MISSING', titleKey: 'farmer.dashboard.banner.certMissingTitle' },
      { name: 'OTHER expired only', certs: [otherExpired], reason: 'CERT_MISSING', titleKey: 'farmer.dashboard.banner.certMissingTitle' },
      { name: 'OTHER rejected only', certs: [otherRejected], reason: 'CERT_MISSING', titleKey: 'farmer.dashboard.banner.certMissingTitle' },
      { name: 'OTHER (all states)', certs: [otherVerified, otherPending, otherExpired, otherRejected], reason: 'CERT_MISSING', titleKey: 'farmer.dashboard.banner.certMissingTitle' },
      { name: 'OTHER + valid PGS', certs: [otherPending, valid], reason: null, titleKey: null },
      { name: 'OTHER unverified + PGS unverified', certs: [otherPending, pending], reason: 'CERT_UNVERIFIED', titleKey: 'farmer.dashboard.banner.certPendingTitle' },
      { name: 'OTHER unverified + PGS expired', certs: [otherPending, expired], reason: 'CERT_EXPIRED', titleKey: 'farmer.dashboard.banner.certExpiredTitle' },
      { name: 'OTHER verified + PGS expired', certs: [otherVerified, expired], reason: 'CERT_EXPIRED', titleKey: 'farmer.dashboard.banner.certExpiredTitle' },
      { name: 'OTHER verified + PGS rejected', certs: [otherVerified, rejected], reason: 'CERT_MISSING', titleKey: 'farmer.dashboard.banner.certRejectedTitle' },
    ];
    for (const row of table) {
      const banner = evalMarketBlock({}, row.certs);
      expect(banner.reason, row.name).toBe(row.reason);
      expect(banner.titleKey, row.name).toBe(row.titleKey);
      expect(banner.isBlocked, row.name).toBe(row.reason !== null);
      // Even a stale profile flag saying "not blocked" does not hide it once certs are loaded.
      expect(evalMarketBlock({ isMarketBlocked: false }, row.certs).reason, `${row.name} (profile unblocked)`).toBe(row.reason);
    }
  });

  it('BR-01/BR-02: banner and card agree for every scenario (same cert list fed to both)', () => {
    const scenarios: Array<{ name: string; certs: Certification[] }> = [
      { name: 'none', certs: [] },
      { name: 'valid', certs: [valid] },
      { name: 'expiring', certs: [cert({ daysToExpiry: 5 })] },
      { name: 'valid+expired', certs: [valid, expired] },
      { name: 'valid+pending', certs: [valid, pending] },
      { name: 'valid+expired+pending+rejected', certs: [expired, pending, rejected, valid] },
      { name: 'expired', certs: [expired] },
      { name: 'pending', certs: [pending] },
      { name: 'expired+pending', certs: [expired, pending] },
      { name: 'rejected', certs: [rejected] },
      { name: 'rejected+expired', certs: [rejected, expired] },
      { name: 'pending+rejected', certs: [pending, rejected] },
      { name: 'other-verified', certs: [otherVerified] },
      { name: 'other-pending', certs: [otherPending] },
      { name: 'other-expired', certs: [otherExpired] },
      { name: 'other-rejected', certs: [otherRejected] },
      { name: 'other-verified+valid', certs: [otherVerified, valid] },
      { name: 'other-pending+pending', certs: [otherPending, pending] },
      { name: 'other-pending+expired', certs: [otherPending, expired] },
      { name: 'other-verified+expired', certs: [otherVerified, expired] },
      { name: 'other-verified+rejected', certs: [otherVerified, rejected] },
    ];
    // Reason = the code the server's listing gate refuses with (BR-02).
    const reasonFor: Record<string, string | null> = {
      none: 'CERT_MISSING', valid: null, expiring: null, rejected: 'CERT_MISSING', pending: 'CERT_UNVERIFIED', expired: 'CERT_EXPIRED',
    };
    const titleFor: Record<string, string | null> = {
      none: 'farmer.dashboard.banner.certMissingTitle',
      valid: null,
      expiring: null,
      rejected: 'farmer.dashboard.banner.certRejectedTitle',
      pending: 'farmer.dashboard.banner.certPendingTitle',
      expired: 'farmer.dashboard.banner.certExpiredTitle',
    };
    for (const { name, certs } of scenarios) {
      const card = summarizeCertifications(certs, WARN);
      const banner = evalMarketBlock({}, certs);
      expect(banner.reason, name).toBe(reasonFor[card.kind]);
      expect(banner.titleKey, name).toBe(titleFor[card.kind]);
      expect(banner.isBlocked, name).toBe(reasonFor[card.kind] !== null);
      // Input order never changes the answer.
      expect(evalMarketBlock({}, [...certs].reverse()).reason, `${name} reversed`).toBe(banner.reason);
      expect(evalMarketBlock({}, [...certs].reverse()).titleKey, `${name} reversed`).toBe(banner.titleKey);
    }
  });

  it('BR-02: the banner for "none" and "rejected" agrees with the certification card', () => {
    expect(summarizeCertifications([], WARN).kind).toBe('none');
    expect(evalMarketBlock({}, []).titleKey).toBe('farmer.dashboard.banner.certMissingTitle');
    for (const certs of [[rejected], [rejected, cert({ id: 'rejected-2', verificationStatus: 'REJECTED', daysToExpiry: 30 })]]) {
      expect(summarizeCertifications(certs, WARN).kind).toBe('rejected');
      expect(evalMarketBlock({}, certs).titleKey).toBe('farmer.dashboard.banner.certRejectedTitle');
    }
  });

  it('banner title and message are distinct, and neither repeats "Market Access Blocked:"', () => {
    const enCatalogue = en as Record<string, string>;
    const taCatalogue = ta as Record<string, string>;
    for (const catalogue of [enCatalogue, taCatalogue]) {
      for (const state of ['certExpired', 'certPending', 'certMissing', 'certRejected']) {
        const title = catalogue[`farmer.dashboard.banner.${state}Title`];
        const message = catalogue[`farmer.dashboard.banner.${state}Message`];
        expect(title, state).toBeTruthy();
        expect(message, state).toBeTruthy();
        expect(message, state).not.toBe(title);
        expect(message, state).not.toContain(title);
      }
      // The generic (non-certificate) block: title and message rendered together.
      const blockedTitle = catalogue['farmer.dashboard.banner.marketBlockedTitle'];
      const blockedMessage = catalogue['farmer.dashboard.banner.marketBlocked'];
      expect(blockedTitle).toBeTruthy();
      expect(blockedMessage).toBeTruthy();
      expect(blockedMessage).not.toContain(blockedTitle);
    }
    expect(enCatalogue['farmer.dashboard.banner.marketBlocked']).not.toContain('Market Access Blocked');
    expect(enCatalogue['farmer.dashboard.banner.certExpiredTitle']).toBe('Certificate expired');
    expect(enCatalogue['farmer.dashboard.banner.certPendingTitle']).toBe('Certificate pending verification');
    expect(enCatalogue['farmer.dashboard.banner.certMissingTitle']).toBe('No certificate added');
    expect(enCatalogue['farmer.dashboard.banner.certMissingMessage']).toBe('Add a verified PGS or NPOP certificate to list produce.');
    expect(enCatalogue['farmer.dashboard.banner.certRejectedTitle']).toBe('Certificate rejected');
    expect(enCatalogue['farmer.dashboard.banner.certRejectedMessage']).toBe(
      'Your certificate was rejected. Add a new one to list produce.',
    );
    expect(enCatalogue['farmer.dashboard.banner.addCertAction']).toBe('Add certificate');
  });
});

// ---------------------------------------------------------------------------
// Counter-offer alert: server timestamp parsing (Hermes)
// ---------------------------------------------------------------------------

function offer(overrides: Partial<CounterOffer> = {}): CounterOffer {
  return {
    id: 'offer-1',
    listingId: 'listing-1',
    round: 1,
    offeredBy: 'ADMIN',
    pricePerKg: '34.00',
    quantityKg: '150.000',
    message: null,
    status: 'PENDING',
    expiresAt: '2026-10-06T06:00:00.000Z',
    ...overrides,
  };
}

function listing(id: string, activeCounterOffer: CounterOffer | null): Listing {
  return {
    id,
    listingNumber: `LST-${id}`,
    farmerId: 'farmer-1',
    farmId: null,
    cropId: 'crop-tomato',
    cropName: 'Tomato',
    grade: 'GRADE_1',
    quantityKg: '150.000',
    askingPricePerKg: '40.00',
    ceilingPricePerKg: '45.00',
    finalPricePerKg: null,
    finalQuantityKg: null,
    status: 'COUNTER_OFFERED',
    availableFrom: null,
    photos: [],
    activeCounterOffer,
    rejectionReason: null,
    version: 1,
    createdAt: '2026-10-01T06:00:00.000Z',
    updatedAt: null,
  };
}

describe('Dashboard: counter-offer alert ordering', () => {
  it('soonestPendingCounterOffers() orders Postgres-text expiries correctly and keeps only PENDING offers', () => {
    const sorted = soonestPendingCounterOffers([
      listing('later', offer({ id: 'o1', expiresAt: '2026-10-06 07:42:36.490266+00' })),
      listing('lapsed', offer({ id: 'o2', status: 'LAPSED', expiresAt: '2026-10-05 07:00:00+00' })),
      listing('sooner', offer({ id: 'o3', expiresAt: '2026-10-05 13:12:36+05:30' })),
      listing('none', null),
      listing('garbage', offer({ id: 'o4', expiresAt: 'not-a-time' })),
    ]);
    expect(sorted.map((l) => l.id)).toEqual(['sooner', 'later', 'garbage']);
  });
});

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------

describe('Dashboard: i18n', () => {
  const NEW_KEYS = [
    'farmer.dashboard.header.auditToday',
    'farmer.dashboard.header.auditTomorrow',
    'farmer.dashboard.header.auditNone',
    'farmer.dashboard.header.auditDate',
    'farmer.dashboard.header.certExpiring',
    'farmer.dashboard.header.certExpired',
    'farmer.dashboard.header.certPending',
    'farmer.dashboard.menu.certifications',
    'farmer.dashboard.menu.certificationsRenewalTomorrow',
    'farmer.dashboard.menu.certificationsRenewalToday',
    'farmer.dashboard.menu.certificationsExpired',
    'farmer.dashboard.menu.cropCountOne',
    'farmer.dashboard.menu.cropCount',
    'farmer.dashboard.menu.cropCountPartial',
    'farmer.dashboard.menu.cropCountNone',
    'farmer.dashboard.crops.plotLine',
    'farmer.dashboard.crops.loadError',
    'farmer.dashboard.banner.renewAction',
    'farmer.dashboard.banner.certExpiredTitle',
    'farmer.dashboard.banner.certExpiredMessage',
    'farmer.dashboard.banner.certPendingTitle',
    'farmer.dashboard.banner.certPendingMessage',
    'farmer.dashboard.banner.certExpiringTitle',
    // BR-02: no certificate / only rejected ones (server CERT_MISSING).
    'farmer.dashboard.banner.certMissingTitle',
    'farmer.dashboard.banner.certMissingMessage',
    'farmer.dashboard.banner.certRejectedTitle',
    'farmer.dashboard.banner.certRejectedMessage',
    'farmer.dashboard.banner.addCertAction',
    // Reworded so it no longer repeats its title's "Market Access Blocked:".
    'farmer.dashboard.banner.marketBlocked',
  ];

  // Existing keys the dashboard now renders instead of adding duplicates.
  const REUSED_KEYS = [
    'farmer.dashboard.header.auditLabel',
    'farmer.dashboard.header.auditDue',
    'farmer.dashboard.header.certLabel',
    'farmer.dashboard.header.certValid',
    'farmer.dashboard.header.certNone',
    'farmer.dashboard.menu.cropManagement',
    'farmer.dashboard.menu.profileSubtitle',
    'farmer.dashboard.menu.profileSubtitleNone',
    'farmer.dashboard.crops.title',
    'farmer.dashboard.crops.viewAll',
    'farmer.audits.status.inProgress',
    'farmer.certifications.status.UNVERIFIED',
    'farmer.certifications.status.REJECTED',
    'farmer.certifications.daysLeft',
    'farmer.crops.activeCrops.emptyTitle',
    'farmer.crops.activeCrops.statusHarvestIn',
    'farmer.crops.activeCrops.statusOverdue',
    'farmer.crops.activeCrops.statusPlanned',
    'farmer.crops.activeCrops.statusGrowingNoDate',
  ];

  it('every new or reused dashboard key exists in English and Tamil', () => {
    const enCatalogue = en as Record<string, string>;
    const taCatalogue = ta as Record<string, string>;
    for (const key of [...NEW_KEYS, ...REUSED_KEYS]) {
      expect(enCatalogue[key], key).toBeTruthy();
      expect(taCatalogue[key], key).toBeTruthy();
    }
  });

  it('Tamil strings are translated, not copies of the English', () => {
    const enCatalogue = en as Record<string, string>;
    const taCatalogue = ta as Record<string, string>;
    const placeholderOnly = new Set(['farmer.dashboard.header.auditDate']);
    for (const key of NEW_KEYS.filter((k) => !placeholderOnly.has(k))) {
      expect(taCatalogue[key], key).not.toBe(enCatalogue[key]);
    }
  });
});
