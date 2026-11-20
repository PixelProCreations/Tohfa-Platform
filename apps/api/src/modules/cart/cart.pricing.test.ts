/**
 * D-01 / root CLAUDE.md 2.2: cart money is integer paise, quantities integer grams, half-up.
 * Property-style: a seeded generator drives many price x qty combos against an independent
 * string/BigInt reference, and every generated cart is priced again by checkout (orders.pricing)
 * to prove the cart subtotal is exactly the order subtotal (cart-to-checkout parity).
 */
import { describe, expect, it } from 'vitest';
import { fromPaise, toPaise, parseMoney, type Money } from '@tohfa/shared-types';
import { computeCheckoutTotals } from '../orders/orders.pricing.js';
import { cartLineTotal, cartSubtotal, qtyGrams } from './cart.pricing.js';

/** Deterministic PRNG (mulberry32) so a failure is reproducible. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const int = (r: () => number, max: number): number => Math.floor(r() * max);

const priceStr = (paise: number): string => `${Math.trunc(paise / 100)}.${String(paise % 100).padStart(2, '0')}`;
const qtyStr = (grams: number): string => `${Math.trunc(grams / 1000)}.${String(grams % 1000).padStart(3, '0')}`;

/**
 * Independent reference: strip the decimal points, multiply as BigInt (5 implied decimals),
 * round half-up to 2 decimals, render. No shared code with the implementation under test.
 */
function referenceLineTotal(price: string, qty: string): string {
  const [pw, pf = ''] = price.split('.');
  const [qw, qf = ''] = qty.split('.');
  const p = BigInt(`${pw}${pf.padEnd(2, '0')}`);
  const q = BigInt(`${qw}${qf.padEnd(3, '0')}`);
  const scaled5 = p * q; // 10^-5 rupees
  const paise = (scaled5 + 500n) / 1000n; // half-up, non-negative
  const s = paise.toString().padStart(3, '0');
  return `${s.slice(0, -2)}.${s.slice(-2)}`;
}

describe('cart.pricing: exact integer-paise line totals (D-01)', () => {
  it.each([
    // [unit price per kg, qty kg, exact half-up line total]
    ['0.15', '0.300', '0.05'], // float 0.3*0.15 = 0.045 -> toFixed "0.04" (the old bug)
    ['0.22', '2.250', '0.50'], // float -> "0.49"
    ['0.50', '0.430', '0.22'], // float -> "0.21"
    ['0.85', '2.900', '2.47'], // float -> "2.46"
    ['33.33', '0.333', '11.10'], // 11.09889
    ['80.00', '1.000', '80.00'],
    ['80', '1.5', '120.00'],
    ['0.01', '0.001', '0.00'], // 0.00001 rounds down
    ['0.01', '0.500', '0.01'], // exactly half a paisa rounds UP
    ['99999.99', '999.999', '99999890.00'], // 99,999,890.000001 -> large total, still exact
    ['12345678.90', '123456.789', '1524157875019.05'], // beyond float's exact cents range
  ])('%s/kg x %s kg = %s', (price, qty, expected) => {
    expect(cartLineTotal(price, qty)).toBe(expected);
    expect(referenceLineTotal(price, qty)).toBe(expected);
  });

  it('0.1 + 0.2 style sums are exact', () => {
    const lines = [cartLineTotal('0.10', '1.000'), cartLineTotal('0.20', '1.000')];
    expect(cartSubtotal(lines)).toBe('0.30');
    expect(cartSubtotal(Array.from({ length: 10 }, () => '0.10'))).toBe('1.00');
  });

  it('property: 5,000 random price x qty combos match the BigInt reference to the paisa', () => {
    const r = rng(0xc0ffee);
    for (let i = 0; i < 5000; i += 1) {
      // Mix small, typical and very large magnitudes.
      const pricePaise = [int(r, 100), int(r, 20_000), int(r, 1_000_000_000)][i % 3]!;
      const grams = [int(r, 1000) + 1, int(r, 50_000) + 1, int(r, 999_999_999) + 1][(i >> 1) % 3]!;
      const price = priceStr(pricePaise);
      const qty = qtyStr(grams);
      const got = cartLineTotal(price, qty);
      expect(got, `${price} x ${qty}`).toBe(referenceLineTotal(price, qty));
      // Always a canonical 2-decimal Money string (response shape unchanged, e.g. "80.00").
      expect(got).toMatch(/^\d+\.\d{2}$/);
    }
  });

  it('qtyGrams parses up to 3 decimals and rejects anything else', () => {
    expect(qtyGrams('1.25')).toBe(1250);
    expect(qtyGrams('0.333')).toBe(333);
    expect(qtyGrams('0.000')).toBe(0);
    expect(qtyGrams('1.2345')).toBeNull();
    expect(qtyGrams('-1')).toBeNull();
    expect(qtyGrams('abc')).toBeNull();
  });
});

describe('cart-to-checkout parity (BR-22 / BR-161)', () => {
  it('property: for 2,000 random carts the checkout subtotal equals the cart subtotal and the total reconciles', () => {
    const r = rng(42);
    for (let i = 0; i < 2000; i += 1) {
      const n = 1 + int(r, 8);
      const lineTotals: Money[] = [];
      let refPaise = 0n;
      for (let k = 0; k < n; k += 1) {
        const price = priceStr(int(r, 50_000) + 1);
        const qty = qtyStr(int(r, 25_000) + 1);
        const line = cartLineTotal(price, qty);
        lineTotals.push(line);
        refPaise += BigInt(toPaise(parseMoney(referenceLineTotal(price, qty))));
      }
      const subtotal = cartSubtotal(lineTotals);
      expect(subtotal).toBe(fromPaise(Number(refPaise)));

      const checkout = computeCheckoutTotals({
        lineTotals, // checkout reads exactly the stored cart line totals
        fulfilment: i % 2 === 0 ? 'DELIVERY' : 'PICKUP',
        deliveryFee: '40.00' as Money,
        freeDeliveryThreshold: '500.00' as Money,
        gstRateBasisPoints: [0, 500, 250, 1800][i % 4]!,
      });
      expect(checkout.subtotal).toBe(subtotal);
      expect(toPaise(checkout.totalAmount)).toBe(
        toPaise(subtotal) + toPaise(checkout.deliveryFee) + toPaise(checkout.gstAmount) - toPaise(checkout.discount),
      );
    }
  });
});
