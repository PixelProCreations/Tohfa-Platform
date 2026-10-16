/**
 * Daily cash close (DailyCashScreen) on the finance foundation mappers.
 *
 * Replaces tests/cashMath.test.ts: the screen no longer computes the expected
 * closing (the server does, BR-74), so the old rupee-fixture maths is gone.
 * What remains on the client is the preview difference and the
 * CashCloseCreate body; the cases here complement tests/mappers_finance.test.ts.
 */
import { describe, expect, it } from 'vitest';
import { buildCashCloseBody, cashDifferencePaise, formatSignedPaise } from '../screens/warehouse/finance-expenses/mappers';

const OWN = '22222222-2222-4222-8222-222222222222';
const OTHER = '55555555-5555-4555-8555-555555555555';
const SUB = { warehouseId: OWN };
const MAIN = {};
const DATE = '2026-10-13';

describe('daily cash close', () => {
  describe('BR-74: preview difference (display only, never judged against a tolerance)', () => {
    it('BR-74: a short count is negative', () => {
      expect(cashDifferencePaise('21,980', 2208000)).toBe(-10000);
    });

    it('BR-74: an over count is positive', () => {
      expect(cashDifferencePaise('22,080.01', 2208000)).toBe(1);
    });

    it('BR-74: an exact count is zero', () => {
      expect(cashDifferencePaise('₹22,080.00', 2208000)).toBe(0);
    });

    it('BR-74: an unparseable count gives no preview', () => {
      for (const bad of ['abc', '-5', '1.005', '12..3', ' ']) {
        expect(cashDifferencePaise(bad, 2208000)).toBeNull();
      }
    });

    it('BR-74: the signed difference renders with its sign', () => {
      expect(formatSignedPaise(-10000)).toMatch(/^-/);
      expect(formatSignedPaise(10000)).not.toMatch(/^-/);
    });
  });

  describe('BR-74: CashCloseCreate body', () => {
    it('BR-74: zero is a valid count (an empty till)', () => {
      expect(buildCashCloseBody({ date: DATE, countedText: '0.00', note: '', warehouseId: undefined }, SUB)).toEqual({
        date: DATE,
        warehouseId: OWN,
        countedCash: '0.00',
      });
    });

    it('BR-74: a negative or garbage count builds no body', () => {
      for (const bad of ['-1', 'twenty', '', '1,2.3.4', '10.123']) {
        expect(buildCashCloseBody({ date: DATE, countedText: bad, note: '', warehouseId: undefined }, SUB)).toBeNull();
      }
    });

    it('BR-74: the amount goes out as the exact decimal string, no float', () => {
      expect(buildCashCloseBody({ date: DATE, countedText: '21,980.5', note: '', warehouseId: undefined }, SUB)?.countedCash).toBe(
        '21980.50',
      );
      expect(buildCashCloseBody({ date: DATE, countedText: '0.1', note: '', warehouseId: undefined }, SUB)?.countedCash).toBe('0.10');
    });

    it('BR-74 / BR-30: a Sub admin is pinned to its own warehouse even with a different pick', () => {
      expect(buildCashCloseBody({ date: DATE, countedText: '10', note: '', warehouseId: OTHER }, SUB)?.warehouseId).toBe(OWN);
    });

    it('BR-74: a Main admin without a pick builds no body (the API requires the warehouse)', () => {
      expect(buildCashCloseBody({ date: DATE, countedText: '10', note: '', warehouseId: undefined }, MAIN)).toBeNull();
      expect(buildCashCloseBody({ date: DATE, countedText: '10', note: '', warehouseId: OTHER }, MAIN)?.warehouseId).toBe(OTHER);
    });

    it('BR-74: the note is trimmed, and omitted when blank', () => {
      expect(buildCashCloseBody({ date: DATE, countedText: '10', note: '  drawer short  ', warehouseId: undefined }, SUB)?.note).toBe(
        'drawer short',
      );
      const blank = buildCashCloseBody({ date: DATE, countedText: '10', note: '   ', warehouseId: undefined }, SUB);
      expect(blank).not.toBeNull();
      expect(blank && 'note' in blank).toBe(false);
    });
  });
});
