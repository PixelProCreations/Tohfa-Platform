import { describe, expect, it } from 'vitest';
import { formatPaise, parseRupeesToPaise, rupeesNumberToPaise } from '../money/paise';
import { cartTotalPaise, evaluatePayment, lineTotalPaise } from '../screens/warehouse/sales-direct/salesMath';

describe('rupee input parsing (decimal-safe, CLAUDE.md 2.2)', () => {
  it('accepts whole, one-decimal and two-decimal rupees, with optional symbol and commas', () => {
    expect(parseRupeesToPaise('500')).toBe(50000);
    expect(parseRupeesToPaise('500.5')).toBe(50050);
    expect(parseRupeesToPaise('500.50')).toBe(50050);
    expect(parseRupeesToPaise('₹1,250.25')).toBe(125025);
    expect(parseRupeesToPaise(' 0.10 ')).toBe(10);
  });

  it('rejects garbage, empty input, negatives and more than 2 decimals', () => {
    for (const bad of ['', '   ', 'abc', '12abc', '1.234', '5.', '.5', '-5', '1.2.3', '₹', '1,2,,3x']) {
      expect(parseRupeesToPaise(bad), `input "${bad}"`).toBeNull();
    }
  });

  it('converts a rupee number at the boundary without float drift', () => {
    expect(rupeesNumberToPaise(0.1 + 0.2)).toBe(30);
    expect(rupeesNumberToPaise(33.33)).toBe(3333);
    expect(rupeesNumberToPaise(99.99)).toBe(9999);
  });

  it('formats paise as rupees with Indian grouping and no float', () => {
    expect(formatPaise(18025)).toBe('₹180.25');
    expect(formatPaise(2198050)).toBe('₹21,980.50');
    expect(formatPaise(0)).toBe('₹0');
    expect(formatPaise(30000)).toBe('₹300');
  });
});

describe('cart total from line items (integer paise)', () => {
  it('sums line totals: 3 x 33.33 stays exact at 99.99', () => {
    expect(lineTotalPaise(33.33, 3)).toBe(9999);
    expect(cartTotalPaise([{ pricePerKg: 33.33, quantityKg: 3 }])).toBe(9999);
  });

  it('derives the total from the cart, not a constant (2 kg x 100 + 1 kg x 120 = 320; 2 x 120 + 1 x 140 = 380)', () => {
    expect(cartTotalPaise([{ pricePerKg: 100, quantityKg: 2 }, { pricePerKg: 120, quantityKg: 1 }])).toBe(32000);
    expect(cartTotalPaise([{ pricePerKg: 120, quantityKg: 2 }, { pricePerKg: 140, quantityKg: 1 }])).toBe(38000);
  });

  it('has no 0.1 + 0.2 drift and an empty cart is zero', () => {
    expect(cartTotalPaise([{ pricePerKg: 0.1, quantityKg: 1 }, { pricePerKg: 0.2, quantityKg: 1 }])).toBe(30);
    expect(cartTotalPaise([])).toBe(0);
  });

  it('rounds a fractional-kg line half-up to the paisa (2.5 kg x 33.33 = 83.325 -> 83.33)', () => {
    expect(lineTotalPaise(33.33, 2.5)).toBe(8333);
  });
});

describe('payment evaluation', () => {
  const base = { amountDuePaise: 50000, walletBalancePaise: 0, receivedInput: '' };

  it('BR-17: wallet shortfall blocks confirm and reports the shortfall in paise', () => {
    const r = evaluatePayment({ ...base, method: 'Wallet', walletBalancePaise: 20000 });
    expect(r.canConfirm).toBe(false);
    expect(r.shortfallPaise).toBe(30000);
    expect(r.balanceAfterPaise).toBe(0);
  });

  it('BR-17: wallet exactly equal to the amount due can confirm with nothing left over', () => {
    const r = evaluatePayment({ ...base, method: 'Wallet', walletBalancePaise: 50000 });
    expect(r).toMatchObject({ canConfirm: true, shortfallPaise: 0, balanceAfterPaise: 0 });
  });

  it('BR-17: wallet above the amount due can confirm and shows the remaining balance', () => {
    const r = evaluatePayment({ ...base, method: 'Wallet', walletBalancePaise: 125050 });
    expect(r).toMatchObject({ canConfirm: true, shortfallPaise: 0, balanceAfterPaise: 75050 });
  });

  it('cash: an empty received field shows zero change and cannot confirm', () => {
    const r = evaluatePayment({ ...base, method: 'Cash', receivedInput: '' });
    expect(r.changePaise).toBe(0);
    expect(r.canConfirm).toBe(false);
  });

  it('cash: garbage or 3-decimal received input shows zero change and cannot confirm', () => {
    for (const bad of ['abc', '500.123']) {
      const r = evaluatePayment({ ...base, method: 'Cash', receivedInput: bad });
      expect(r.changePaise).toBe(0);
      expect(r.canConfirm).toBe(false);
    }
  });

  it('cash: received below the amount due cannot confirm and gives no change', () => {
    const r = evaluatePayment({ ...base, method: 'Cash', receivedInput: '499.99' });
    expect(r.canConfirm).toBe(false);
    expect(r.changePaise).toBe(0);
  });

  it('cash: received exactly the amount due can confirm with zero change', () => {
    const r = evaluatePayment({ ...base, method: 'Cash', receivedInput: '500' });
    expect(r).toMatchObject({ canConfirm: true, changePaise: 0 });
  });

  it('cash: 500.50 received against 320.25 due gives exactly 180.25 change', () => {
    const r = evaluatePayment({ ...base, amountDuePaise: 32025, method: 'Cash', receivedInput: '500.50' });
    expect(r).toMatchObject({ canConfirm: true, changePaise: 18025 });
  });

  it('cash: 0.30 received against 0.10 + 0.20 due is exact (no 0.1 + 0.2 drift)', () => {
    const due = cartTotalPaise([{ pricePerKg: 0.1, quantityKg: 1 }, { pricePerKg: 0.2, quantityKg: 1 }]);
    const r = evaluatePayment({ ...base, amountDuePaise: due, method: 'Cash', receivedInput: '0.3' });
    expect(r).toMatchObject({ canConfirm: true, changePaise: 0 });
  });

  it('UPI and Card are not gated by the cash or wallet checks (behaviour unchanged)', () => {
    expect(evaluatePayment({ ...base, method: 'UPI' }).canConfirm).toBe(true);
    expect(evaluatePayment({ ...base, method: 'Card' }).canConfirm).toBe(true);
  });
});
