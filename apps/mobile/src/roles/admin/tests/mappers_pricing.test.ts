/**
 * roles/admin/api/pricingMappers.ts: the /fair-prices and /retail-prices DTOs
 * -> the Market & Pricing view-models.
 *
 * The fixtures below are realistic API bodies (pricing.service.ts
 * mapFairPriceResponse / mapRetailPriceResponse) and live ONLY in this file.
 * What the API does not send stays null in the view-model, never a demo value.
 * Money stays a string; every comparison goes through integer paise
 * (root CLAUDE.md 2.2).
 */
import { describe, expect, it } from 'vitest';
import type { FairPriceDto, RetailPriceDto } from '../api/pricing';
import {
  buildRetailPriceBody,
  ceilingWindowStatus,
  compareToCeiling,
  formatPrice,
  retailDraftCheck,
  toCeilingHistory,
  toFairPriceRow,
  toMarkupBreakdown,
  toPricingMoney,
  toRetailPriceRow,
  todayInIndia,
} from '../api/pricingMappers';
import { ceilingCompliancePercent, derivePricingHomeKpis, recentCeilingChanges, recentChangeCutoff } from '../api/pricingMappers';
import { PRICING_HOME_KPIS_UNAVAILABLE } from '../api/pricingTypes';

const CROP = '11112222-3333-4444-5555-666677778888';
const SA = '77777777-7777-4777-8777-777777777777';
const TODAY = '2026-11-10';

const ceiling: FairPriceDto = {
  id: 'aa11bb22-cc33-4d44-8e55-9f6677889900',
  cropId: CROP,
  cropName: 'Carrot',
  grade: 'GRADE_1',
  ceilingPrice: '48.00',
  frequency: 'WEEKLY',
  effectiveFrom: '2026-11-03',
  effectiveTo: null,
  setBy: SA,
  notes: 'Monsoon supply dip',
};

const retail: RetailPriceDto = {
  id: 'bb22cc33-dd44-4e55-8f66-a07788990011',
  cropId: CROP,
  cropName: 'Carrot',
  grade: 'GRADE_1',
  price: '45.50',
  ceilingPrice: '48.00',
  markupPct: 32.7,
  gstInclusive: true,
  effectiveFrom: '2026-11-04',
  effectiveTo: null,
};

describe('Money rules', () => {
  it('a price like "120.00" stays the exact string, never a number', () => {
    const row = toFairPriceRow({ ...ceiling, ceilingPrice: '120.00' }, TODAY);
    expect(row.ceilingPrice).toBe('120.00');
    expect(typeof row.ceilingPrice).toBe('string');
  });

  it('toPricingMoney normalises a well-formed amount and refuses anything else', () => {
    expect(toPricingMoney('120')).toBe('120.00');
    expect(toPricingMoney('0.1')).toBe('0.10');
    expect(toPricingMoney('1.005')).toBeNull();
    expect(toPricingMoney('abc')).toBeNull();
    expect(toPricingMoney(120)).toBeNull();
    expect(toPricingMoney(null)).toBeNull();
  });

  it('BR-09: the ceiling comparison uses integer paise (0.10 + 0.20 against a 0.30 ceiling is AT the ceiling)', () => {
    // As floats 0.1 + 0.2 = 0.30000000000000004 would read as "above".
    const draft = retailDraftCheck('0.30', toPricingMoney('0.30'));
    expect(draft).toEqual({ kind: 'checked', proposed: '0.30', comparison: { position: 'at', differencePaise: 0, difference: '0.00' } });
  });

  it('BR-09: compareToCeiling reports below / at / above with the absolute difference', () => {
    expect(compareToCeiling(toPricingMoney('45.50'), toPricingMoney('48.00'))).toEqual({
      position: 'below',
      differencePaise: 250,
      difference: '2.50',
    });
    expect(compareToCeiling(toPricingMoney('48.00'), toPricingMoney('48'))).toEqual({ position: 'at', differencePaise: 0, difference: '0.00' });
    expect(compareToCeiling(toPricingMoney('500.50'), toPricingMoney('320.25'))).toEqual({
      position: 'above',
      differencePaise: 18025,
      difference: '180.25',
    });
  });

  it('compareToCeiling is null when either side is unknown', () => {
    expect(compareToCeiling(null, toPricingMoney('48.00'))).toBeNull();
    expect(compareToCeiling(toPricingMoney('48.00'), null)).toBeNull();
  });

  it('formatPrice uses the admin money format and keeps null as null', () => {
    expect(formatPrice(toPricingMoney('1250.50'))).toBe('₹1,250.50');
    expect(formatPrice(toPricingMoney('60.00'))).toBe('₹60');
    expect(formatPrice(null)).toBeNull();
  });
});

describe('ceiling window status', () => {
  it('an open window that started on or before today is current', () => {
    expect(ceilingWindowStatus('2026-11-03', null, TODAY)).toBe('current');
    expect(ceilingWindowStatus(TODAY, null, TODAY)).toBe('current');
    expect(ceilingWindowStatus('2026-11-01', TODAY, TODAY)).toBe('current');
  });

  it('a window starting after today is scheduled', () => {
    expect(ceilingWindowStatus('2026-11-11', null, TODAY)).toBe('scheduled');
  });

  it('a window closed before today is historical', () => {
    expect(ceilingWindowStatus('2026-10-01', '2026-11-09', TODAY)).toBe('historical');
  });

  it('todayInIndia is the calendar date in Asia/Kolkata (UTC+05:30, no DST)', () => {
    expect(todayInIndia(new Date('2026-11-09T18:29:59.000Z'))).toBe('2026-11-09');
    expect(todayInIndia(new Date('2026-11-09T18:30:00.000Z'))).toBe('2026-11-10');
  });
});

describe('toFairPriceRow', () => {
  it('BR-08: copies the ceiling as the server sent it and leaves design-only fields null', () => {
    expect(toFairPriceRow(ceiling, TODAY)).toEqual({
      id: ceiling.id,
      cropId: CROP,
      cropName: 'Carrot',
      grade: 'GRADE_1',
      ceilingPrice: '48.00',
      frequency: 'WEEKLY',
      effectiveFrom: '2026-11-03',
      effectiveTo: null,
      windowStatus: 'current',
      setById: SA,
      notes: 'Monsoon supply dip',
      category: null,
      setByName: null,
      lastUpdatedAt: null,
      recentChanges: null,
      hasRetailPrice: null,
    });
  });

  it('BR-08: shows the stored frequency, never a literal; a missing one is null', () => {
    expect(toFairPriceRow({ ...ceiling, frequency: 'DAILY' }, TODAY).frequency).toBe('DAILY');
    const { frequency: _f, ...withoutFrequency } = ceiling;
    expect(toFairPriceRow(withoutFrequency, TODAY).frequency).toBeNull();
  });

  it('optional spec fields that are absent become null', () => {
    const minimal: FairPriceDto = { id: 'x', cropId: CROP, grade: 'GRADE_2', ceilingPrice: '30.00', effectiveFrom: '2026-11-01' };
    const row = toFairPriceRow(minimal, TODAY);
    expect(row).toMatchObject({ cropName: null, effectiveTo: null, setById: null, notes: null, frequency: null });
  });

  it('is an allow-list: a field a future server adds does not reach the view-model', () => {
    const extra = { ...ceiling, farmerId: 'leak', internalCost: '10.00' } as FairPriceDto;
    const row = toFairPriceRow(extra, TODAY) as unknown as Record<string, unknown>;
    expect(row['farmerId']).toBeUndefined();
    expect(row['internalCost']).toBeUndefined();
  });

  it('a malformed ceiling becomes null rather than a guessed number', () => {
    expect(toFairPriceRow({ ...ceiling, ceilingPrice: '48.005' }, TODAY).ceilingPrice).toBeNull();
  });
});

describe('toCeilingHistory', () => {
  const older: FairPriceDto = {
    ...ceiling,
    id: 'older',
    ceilingPrice: '44.00',
    effectiveFrom: '2026-10-20',
    effectiveTo: '2026-11-02',
    notes: null,
  };
  const otherGrade: FairPriceDto = { ...ceiling, id: 'g2', grade: 'GRADE_2', ceilingPrice: '38.00', effectiveFrom: '2026-10-25' };

  it('BR-08: newest first, each row knows the ceiling it replaced for the same crop and grade', () => {
    const rows = toCeilingHistory([ceiling, otherGrade, older], TODAY);
    expect(rows.map((r) => [r.id, r.newCeiling, r.previousCeiling])).toEqual([
      [ceiling.id, '48.00', '44.00'],
      ['g2', '38.00', null],
      ['older', '44.00', null],
    ]);
  });

  it('the oldest loaded row has no previous value (it may be on a later page), never a guess', () => {
    const rows = toCeilingHistory([older], TODAY);
    expect(rows[0]?.previousCeiling).toBeNull();
  });

  it('carries the window status and leaves audit-only fields null', () => {
    const rows = toCeilingHistory([ceiling, older], TODAY);
    expect(rows[1]).toMatchObject({ windowStatus: 'historical', priceType: 'FAIR_PRICE_CEILING' });
    expect(rows[0]).toMatchObject({
      setById: SA,
      notes: 'Monsoon supply dip',
      changedByName: null,
      recordedAt: null,
      validation: null,
      auditRef: null,
    });
  });
});

describe('toRetailPriceRow', () => {
  it('BR-09: copies the retail row and compares it with its ceiling in paise', () => {
    expect(toRetailPriceRow(retail)).toEqual({
      id: retail.id,
      cropId: CROP,
      cropName: 'Carrot',
      grade: 'GRADE_1',
      retailPrice: '45.50',
      ceilingPrice: '48.00',
      markupPct: 32.7,
      gstInclusive: true,
      effectiveFrom: '2026-11-04',
      effectiveTo: null,
      ceilingComparison: { position: 'below', differencePaise: 250, difference: '2.50' },
      category: null,
      reviewStatus: null,
      actionNote: null,
    });
  });

  it('without a ceiling in the response there is no comparison (no invented status)', () => {
    const { ceilingPrice: _c, ...noCeiling } = retail;
    const row = toRetailPriceRow(noCeiling);
    expect(row.ceilingPrice).toBeNull();
    expect(row.ceilingComparison).toBeNull();
  });

  it('a null markup stays null', () => {
    expect(toRetailPriceRow({ ...retail, markupPct: null }).markupPct).toBeNull();
  });
});

describe('toMarkupBreakdown', () => {
  it('shows only what the API has: retail, ceiling, markup %; the cost model is null', () => {
    expect(toMarkupBreakdown(retail)).toEqual({
      cropName: 'Carrot',
      grade: 'GRADE_1',
      retailPrice: '45.50',
      ceilingPrice: '48.00',
      markupPct: 32.7,
      ceilingComparison: { position: 'below', differencePaise: 250, difference: '2.50' },
      purchasePrice: null,
      expenses: null,
      customerDiscount: null,
      finalCustomerPrice: null,
    });
  });
});

describe('retail price edit drawer', () => {
  it('BR-09: a typed price above the ceiling is flagged above (display only; the server decides)', () => {
    expect(retailDraftCheck('₹60.50', toPricingMoney('60.00'))).toEqual({
      kind: 'checked',
      proposed: '60.50',
      comparison: { position: 'above', differencePaise: 50, difference: '0.50' },
    });
  });

  it('empty, garbage and unknown-ceiling inputs are told apart', () => {
    expect(retailDraftCheck('   ', toPricingMoney('60.00'))).toEqual({ kind: 'empty' });
    expect(retailDraftCheck('12.345', toPricingMoney('60.00'))).toEqual({ kind: 'invalid' });
    expect(retailDraftCheck('-5', toPricingMoney('60.00'))).toEqual({ kind: 'invalid' });
    expect(retailDraftCheck('55', null)).toEqual({ kind: 'noCeiling', proposed: '55.00' });
  });

  it('buildRetailPriceBody sends the price as a 2-dp Money string and omits unset optionals', () => {
    expect(buildRetailPriceBody({ cropId: CROP, grade: 'GRADE_1', priceInput: '55.5', effectiveFrom: '2026-11-11' })).toEqual({
      cropId: CROP,
      grade: 'GRADE_1',
      price: '55.50',
      effectiveFrom: '2026-11-11',
    });
  });

  it('buildRetailPriceBody passes markupPct and gstInclusive through when given', () => {
    expect(
      buildRetailPriceBody({ cropId: CROP, grade: 'GRADE_2', priceInput: '40', effectiveFrom: TODAY, markupPct: 10, gstInclusive: false }),
    ).toEqual({ cropId: CROP, grade: 'GRADE_2', price: '40.00', effectiveFrom: TODAY, markupPct: 10, gstInclusive: false });
  });

  it('buildRetailPriceBody refuses a zero, garbage or sub-paise price (null: nothing to send)', () => {
    for (const priceInput of ['0', '0.00', 'abc', '1.005', '']) {
      expect(buildRetailPriceBody({ cropId: CROP, grade: 'GRADE_1', priceInput, effectiveFrom: TODAY })).toBeNull();
    }
  });
});

describe('home dashboard', () => {
  it('the unavailable baseline is all null (never a demo number)', () => {
    for (const value of Object.values(PRICING_HOME_KPIS_UNAVAILABLE)) expect(value).toBeNull();
  });
});

describe('home KPIs counted from the lists (no KPI endpoint)', () => {
  const fair = (over: Partial<FairPriceDto>): FairPriceDto => ({ ...ceiling, ...over });
  const retailRow = (over: Partial<RetailPriceDto>): RetailPriceDto => ({ ...retail, ...over });
  const fairRows = [
    toFairPriceRow(fair({ id: 'f1', cropId: 'crop-a', effectiveFrom: '2026-11-08' }), TODAY),
    // Same crop, a second grade: one product, two ceilings.
    toFairPriceRow(fair({ id: 'f2', cropId: 'crop-a', grade: 'GRADE_2', effectiveFrom: '2026-10-01' }), TODAY),
    toFairPriceRow(fair({ id: 'f3', cropId: 'crop-b', effectiveFrom: '2026-11-04' }), TODAY),
    // Starts tomorrow: scheduled, so not an active ceiling and not a change inside the window.
    toFairPriceRow(fair({ id: 'f4', cropId: 'crop-c', effectiveFrom: '2026-11-11' }), TODAY),
  ];
  const retailRows = [
    toRetailPriceRow(retailRow({ id: 'r1', cropId: 'crop-a', price: '40.00', ceilingPrice: '48.00' })),
    toRetailPriceRow(retailRow({ id: 'r2', cropId: 'crop-a', grade: 'GRADE_2', price: '48.00', ceilingPrice: '48.00' })),
    toRetailPriceRow(retailRow({ id: 'r3', cropId: 'crop-b', price: '50.00', ceilingPrice: '48.00' })),
    // No ceiling sent: it is not counted either way, not assumed compliant.
    toRetailPriceRow(retailRow({ id: 'r4', cropId: 'crop-d', price: '50.00', ceilingPrice: undefined })),
  ];
  const complete = { fair: fairRows, fairComplete: true, retail: retailRows, retailComplete: true, today: TODAY };

  it('counts distinct crops, active windows and the last 7 days from GET /fair-prices', () => {
    const kpis = derivePricingHomeKpis(complete);
    expect(kpis.totalProducts).toBe(3);
    expect(kpis.activeFairPrices).toBe(3);
    // 2026-11-04..2026-11-10 inclusive: f1 and f3; f2 is older, f4 is scheduled.
    expect(recentChangeCutoff(TODAY)).toBe('2026-11-04');
    expect(kpis.recentChanges7d).toBe(2);
  });

  it('counts retail rows and records, and BR-09 compliance over the rows that have a ceiling', () => {
    const kpis = derivePricingHomeKpis(complete);
    expect(kpis.withRetailPrices).toBe(3);
    expect(kpis.retailPriceRecords).toBe(4);
    // r1 below, r2 at, r3 above, r4 has no ceiling and is left out: 2 of 3.
    expect(kpis.ceilingCompliance).toBe(67);
  });

  it('a list that still has a next page counts nothing: the dash, not a first-page total', () => {
    const partial = derivePricingHomeKpis({ ...complete, fairComplete: false, retailComplete: false });
    expect(partial.totalProducts).toBeNull();
    expect(partial.activeFairPrices).toBeNull();
    expect(partial.recentChanges7d).toBeNull();
    expect(partial.withRetailPrices).toBeNull();
    expect(partial.retailPriceRecords).toBeNull();
    expect(partial.ceilingCompliance).toBeNull();
  });

  it('no row with a known ceiling is not 100% compliant, it is unknown', () => {
    const noCeilings = [toRetailPriceRow(retailRow({ id: 'r9', ceilingPrice: undefined }))];
    expect(ceilingCompliancePercent(noCeilings)).toBeNull();
    expect(derivePricingHomeKpis({ ...complete, retail: noCeilings }).ceilingCompliance).toBeNull();
  });

  it('the figures with no API source stay null however complete the lists are', () => {
    const kpis = derivePricingHomeKpis(complete);
    // No "pending" state exists in the pricing schema (undefined business term).
    expect(kpis.pendingPriceUpdates).toBeNull();
    // Categories have no backend at all (owner decision D6).
    expect(kpis.categoriesAndGrades).toBeNull();
    expect(kpis.productCategories).toBeNull();
    // An all-crop change feed would need a per-crop history call.
    expect(kpis.priceUpdates).toBeNull();
  });

  it('an empty list that IS complete counts zero, which is a fact, not a guess', () => {
    const empty = derivePricingHomeKpis({ fair: [], fairComplete: true, retail: [], retailComplete: true, today: TODAY });
    expect(empty.totalProducts).toBe(0);
    expect(empty.retailPriceRecords).toBe(0);
    // ...but a percentage of no rows is still unknown.
    expect(empty.ceilingCompliance).toBeNull();
  });
});

describe('recentCeilingChanges: the home\'s Recent Price Changes rows', () => {
  const fair = (over: Partial<FairPriceDto>): FairPriceDto => ({ ...ceiling, ...over });
  const row = (id: string, cropId: string, effectiveFrom: string) =>
    toFairPriceRow(fair({ id, cropId, effectiveFrom }), TODAY);

  // Cutoff for TODAY (2026-11-10) is 2026-11-04 (RECENT_CHANGE_WINDOW_DAYS = 7, inclusive).
  const inside = [row('f1', 'crop-a', '2026-11-08'), row('f3', 'crop-b', '2026-11-04'), row('f5', 'crop-e', '2026-11-10')];
  const outside = [
    row('f2', 'crop-a', '2026-11-03'), // one day before the cutoff
    row('f4', 'crop-c', '2026-11-11'), // starts tomorrow: scheduled, not a change yet
  ];

  it('returns only the windows inside the cutoff, newest first', () => {
    const rows = recentCeilingChanges([...outside, ...inside], TODAY, 10);
    expect(rows.map((r) => r.id)).toEqual(['f5', 'f1', 'f3']);
  });

  it('respects the cap', () => {
    expect(recentCeilingChanges([...inside, ...outside], TODAY, 2).map((r) => r.id)).toEqual(['f5', 'f1']);
    expect(recentCeilingChanges(inside, TODAY, 0)).toEqual([]);
  });

  it('returns empty when nothing qualifies, never filler', () => {
    expect(recentCeilingChanges(outside, TODAY, 3)).toEqual([]);
    expect(recentCeilingChanges([], TODAY, 3)).toEqual([]);
  });

  it('carries no previous ceiling to invent a delta from', () => {
    // GET /fair-prices/history needs one cropId, so a previous window for an
    // arbitrary set of crops is not fetchable in one request; the screen
    // renders the previous price and the delta as the dash.
    const rows = recentCeilingChanges(inside, TODAY, 3);
    expect(rows.length).toBe(3);
    for (const r of rows) expect(r.ceilingPrice).not.toBeNull();
    expect(Object.keys(rows[0] ?? {})).not.toContain('previousCeiling');
  });

  it('agrees with the recentChanges7d KPI about which rows count', () => {
    const all = [...inside, ...outside];
    const kpis = derivePricingHomeKpis({ fair: all, fairComplete: true, retail: [], retailComplete: true, today: TODAY });
    expect(recentCeilingChanges(all, TODAY, 100).length).toBe(kpis.recentChanges7d);
  });

  it('does not mutate the list it was given', () => {
    const all = [...outside, ...inside];
    const order = all.map((r) => r.id);
    recentCeilingChanges(all, TODAY, 10);
    expect(all.map((r) => r.id)).toEqual(order);
  });
});
