import { describe, expect, it } from 'vitest';
import { expectedClosingPaise, reconcileCash } from '../screens/warehouse/wallet-cashtopup/cashMath';

describe('daily cash reconciliation (integer paise)', () => {
  it('parses 21980.50 as 2198050 paise, not 2198050 rupees', () => {
    const r = reconcileCash('21980.50', 2198000);
    expect(r.actualPaise).toBe(2198050);
    expect(r.differencePaise).toBe(50);
    expect(r.valid).toBe(true);
  });

  it('parses the pre-filled "21,980" against the fixture expected closing of 22,080 as -100.00', () => {
    const expected = expectedClosingPaise({ openingRupees: 15000, directSalesRupees: 8500, cashTopUpsRupees: 5000, expensesRupees: 6420 });
    expect(expected).toBe(2208000);
    const r = reconcileCash('21,980', expected);
    expect(r).toEqual({ actualPaise: 2198000, differencePaise: -10000, valid: true });
  });

  it('a short count is a negative difference and an exact count is zero', () => {
    expect(reconcileCash('22079.99', 2208000).differencePaise).toBe(-1);
    expect(reconcileCash('22,080.00', 2208000).differencePaise).toBe(0);
  });

  it('garbage, empty and 3-decimal input are invalid and count as zero (as before)', () => {
    for (const bad of ['', 'abc', '21980.505']) {
      const r = reconcileCash(bad, 2208000);
      expect(r.valid, bad).toBe(false);
      expect(r.actualPaise).toBe(0);
      expect(r.differencePaise).toBe(-2208000);
    }
  });

  it('the expected closing sums fixture rupees exactly in paise', () => {
    expect(expectedClosingPaise({ openingRupees: 0.1, directSalesRupees: 0.2, cashTopUpsRupees: 0, expensesRupees: 0 })).toBe(30);
  });
});
