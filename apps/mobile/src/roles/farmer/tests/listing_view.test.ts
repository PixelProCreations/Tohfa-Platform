import { describe, expect, it } from 'vitest';
import type { FairPriceCeiling, Listing, ListingStatus } from '../api/listings';
import {
  LISTABLE_GRADES,
  computeSaleValue,
  discountPercent,
  formatListingDate,
  formatQuantityKg,
  formatRupees,
  listingStatusDisplay,
  parseQuantityInput,
  parseRupeeInput,
  pickCurrentCeiling,
  summarizeListings,
} from '../screens/listings/listingView';

function listing(overrides: Partial<Listing>): Listing {
  return {
    id: 'l-1',
    listingNumber: 'LST-1',
    farmerId: 'f-1',
    farmId: null,
    cropId: 'c-1',
    cropName: 'Carrot',
    grade: 'GRADE_1',
    quantityKg: '100.000',
    askingPricePerKg: '40.00',
    ceilingPricePerKg: '45.00',
    finalPricePerKg: null,
    finalQuantityKg: null,
    status: 'PENDING_APPROVAL',
    availableFrom: null,
    photos: [],
    rejectionReason: null,
    version: 1,
    createdAt: '2026-07-09T10:00:00.000Z',
    updatedAt: null,
    ...overrides,
  };
}

describe('Listings view helpers: everything derives from real API fields', () => {
  describe('listingStatusDisplay()', () => {
    it('maps all 7 real ListingStatus values to a label and tone', () => {
      const expected: Record<ListingStatus, string> = {
        DRAFT: 'grey',
        PENDING_APPROVAL: 'orange',
        COUNTER_OFFERED: 'purple',
        ACCEPTED: 'green',
        REJECTED: 'red',
        WITHDRAWN: 'grey',
        EXPIRED: 'grey',
      };
      for (const [status, tone] of Object.entries(expected)) {
        const d = listingStatusDisplay(status);
        expect(d.tone).toBe(tone);
        expect(d.label.length).toBeGreaterThan(0);
      }
    });

    it('never labels a listing "Paid" (no payout field exists on Listing)', () => {
      const labels = (['DRAFT', 'PENDING_APPROVAL', 'COUNTER_OFFERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED'] as const)
        .map((s) => listingStatusDisplay(s).label.toLowerCase());
      expect(labels.some((l) => l.includes('paid'))).toBe(false);
    });

    it('falls back to the raw value in grey for an unknown status', () => {
      expect(listingStatusDisplay('SOMETHING_NEW')).toEqual({ label: 'SOMETHING_NEW', tone: 'grey' });
    });
  });

  it('does not offer REJECT as a listable grade (POST /listings refuses it)', () => {
    expect(LISTABLE_GRADES).toEqual(['GRADE_1', 'GRADE_2', 'GRADE_3']);
  });

  describe('parseRupeeInput() / parseQuantityInput()', () => {
    it('normalises valid rupee input to 2-decimal Money', () => {
      expect(parseRupeeInput('38')).toBe('38.00');
      expect(parseRupeeInput(' 38.5 ')).toBe('38.50');
      expect(parseRupeeInput('0.30')).toBe('0.30');
    });

    it('rejects empty, zero, negative, malformed or 3-decimal rupee input', () => {
      for (const bad of ['', '0', '0.00', '-1', 'abc', '38.505', '1e3', '38.']) {
        expect(parseRupeeInput(bad)).toBeNull();
      }
    });

    it('normalises valid quantity input to 3-decimal Quantity', () => {
      expect(parseQuantityInput('120')).toBe('120.000');
      expect(parseQuantityInput('1.5')).toBe('1.500');
    });

    it('rejects empty, zero, malformed or 4-decimal quantity input', () => {
      for (const bad of ['', '0', '0.000', '-5', 'x', '1.2345']) {
        expect(parseQuantityInput(bad)).toBeNull();
      }
    });
  });

  describe('computeSaleValue()', () => {
    it('multiplies on integer paise x grams with no float drift', () => {
      expect(computeSaleValue('38.00', '200.000')).toBe('7600.00');
      // 0.10/kg x 3 kg must be exactly 0.30
      expect(computeSaleValue('0.10', '3.000')).toBe('0.30');
      // 19.99 x 1.005 kg = 20.08995 -> 20.09 (half-up on paise)
      expect(computeSaleValue('19.99', '1.005')).toBe('20.09');
    });

    it('returns null (never a guess) when either side is missing or malformed', () => {
      expect(computeSaleValue(null, '10.000')).toBeNull();
      expect(computeSaleValue('10.00', null)).toBeNull();
      expect(computeSaleValue('ten', '10.000')).toBeNull();
    });
  });

  describe('discountPercent()', () => {
    it('computes the drop from ask to offer on integer paise', () => {
      expect(discountPercent('40.00', '34.00')).toBe(15);
      expect(discountPercent('3.00', '2.00')).toBe(33);
    });

    it('returns null when the offer is not below the ask or input is malformed', () => {
      expect(discountPercent('40.00', '40.00')).toBeNull();
      expect(discountPercent('40.00', '45.00')).toBeNull();
      expect(discountPercent('', '10.00')).toBeNull();
      expect(discountPercent('x', '10.00')).toBeNull();
    });
  });

  describe('summarizeListings()', () => {
    it('counts active and counter-offered listings and sums gross only from ACCEPTED final fields', () => {
      const summary = summarizeListings([
        listing({ id: '1', status: 'PENDING_APPROVAL' }),
        listing({ id: '2', status: 'COUNTER_OFFERED' }),
        listing({ id: '3', status: 'ACCEPTED', finalPricePerKg: '38.00', finalQuantityKg: '200.000' }),
        // ACCEPTED without final fields contributes nothing rather than falling back to asking price
        listing({ id: '4', status: 'ACCEPTED' }),
        listing({ id: '5', status: 'REJECTED', finalPricePerKg: '99.00', finalQuantityKg: '1.000' }),
        listing({ id: '6', status: 'WITHDRAWN' }),
      ]);
      expect(summary.activeCount).toBe(2);
      expect(summary.awaitingResponseCount).toBe(1);
      expect(summary.acceptedGross).toBe('7600.00');
    });

    it('reports null gross (not 0, not invented) when nothing accepted has final fields', () => {
      const summary = summarizeListings([listing({ status: 'ACCEPTED' })]);
      expect(summary.acceptedGross).toBeNull();
      expect(summarizeListings([]).acceptedGross).toBeNull();
    });
  });

  describe('pickCurrentCeiling()', () => {
    const base: FairPriceCeiling = {
      id: 'fp-1',
      cropId: 'c-1',
      grade: 'GRADE_1',
      ceilingPrice: '42.00',
      effectiveFrom: '2026-07-01',
    };

    it('picks the latest effective ceiling for the requested grade', () => {
      const items: FairPriceCeiling[] = [
        base,
        { ...base, id: 'fp-2', effectiveFrom: '2026-07-08', ceilingPrice: '44.00' },
        { ...base, id: 'fp-3', grade: 'GRADE_2', effectiveFrom: '2026-07-09', ceilingPrice: '30.00' },
      ];
      expect(pickCurrentCeiling(items, 'GRADE_1')?.id).toBe('fp-2');
      expect(pickCurrentCeiling(items, 'GRADE_2')?.id).toBe('fp-3');
    });

    it('returns null when no ceiling is published for the grade', () => {
      expect(pickCurrentCeiling([base], 'GRADE_3')).toBeNull();
      expect(pickCurrentCeiling([], 'GRADE_1')).toBeNull();
    });
  });

  describe('display formatting', () => {
    it('formats quantities, rupees and dates', () => {
      expect(formatQuantityKg('250.000')).toBe('250');
      expect(formatQuantityKg('1.500')).toBe('1.5');
      expect(formatRupees('7600.00')).toBe('₹7,600');
      expect(formatRupees('123456.50')).toBe('₹1,23,456.50');
      expect(formatListingDate('2026-07-09T10:00:00.000Z')).toMatch(/^\d{2} Jul 2026$/);
      expect(formatListingDate(null)).toBe('');
      expect(formatListingDate('not-a-date')).toBe('');
    });
  });
});
