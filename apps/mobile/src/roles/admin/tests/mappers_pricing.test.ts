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
  it('every KPI the design shows is unavailable from the API (null, never a demo number)', () => {
    for (const value of Object.values(PRICING_HOME_KPIS_UNAVAILABLE)) expect(value).toBeNull();
  });
});
