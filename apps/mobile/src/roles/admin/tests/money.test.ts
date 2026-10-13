import { describe, expect, it } from 'vitest';
import { MoneyError } from '@tohfa/shared-types';
import {
  formatPaise,
  paiseToMoney,
  parseRupeesToPaise,
  rupeesNumberToPaise,
  tryParseRupeesToPaise,
} from '../money/paise';
import {
  formatGramsAsKg,
  gramsToKgString,
  parseKgToGrams,
  tryParseKgToGrams,
} from '../money/quantity';

describe('paise', () => {
  it('parses API decimal strings to integer paise without float drift', () => {
    expect(parseRupeesToPaise('1234.50')).toBe(123450);
    expect(parseRupeesToPaise('1.00')).toBe(100);
    expect(parseRupeesToPaise('0.10')).toBe(10);
    expect(parseRupeesToPaise('19.99')).toBe(1999);
    expect(parseRupeesToPaise('-12.5')).toBe(-1250);
    expect(parseRupeesToPaise('10000')).toBe(1000000);
  });

  it('rejects malformed or over-precise strings rather than rounding them', () => {
    expect(() => parseRupeesToPaise('12.345')).toThrow(MoneyError);
    expect(() => parseRupeesToPaise('1,000.00')).toThrow(MoneyError);
    expect(() => parseRupeesToPaise('abc')).toThrow(MoneyError);
    expect(() => parseRupeesToPaise('')).toThrow(MoneyError);
  });

  it('tryParseRupeesToPaise returns null for bad form input instead of throwing', () => {
    expect(tryParseRupeesToPaise(' 250.5 ')).toBe(25050);
    expect(tryParseRupeesToPaise('12.345')).toBeNull();
    expect(tryParseRupeesToPaise('')).toBeNull();
    expect(tryParseRupeesToPaise('-1')).toBeNull();
  });

  it('rupeesNumberToPaise accepts only numbers exact to 2 decimals', () => {
    expect(rupeesNumberToPaise(19.99)).toBe(1999);
    // 0.1 + 0.2 === 0.30000000000000004; it must land on exactly 30 paise.
    expect(rupeesNumberToPaise(0.1 + 0.2)).toBe(30);
    expect(() => rupeesNumberToPaise(1.234)).toThrow(MoneyError);
    expect(() => rupeesNumberToPaise(Number.NaN)).toThrow(MoneyError);
  });

  it('formats paise with the rupee sign and Indian grouping', () => {
    expect(formatPaise(12345678)).toBe('₹1,23,456.78');
    expect(formatPaise(5)).toBe('₹0.05');
    expect(formatPaise(-150)).toBe('-₹1.50');
  });

  it('paiseToMoney produces the wire decimal string', () => {
    expect(paiseToMoney(500000)).toBe('5000.00');
    expect(() => paiseToMoney(1.5)).toThrow(MoneyError);
  });
});

describe('quantity (kg <-> integer grams)', () => {
  it('parses the 3-decimal kg wire format to integer grams', () => {
    expect(parseKgToGrams('12.345')).toBe(12345);
    expect(parseKgToGrams('0.001')).toBe(1);
    expect(parseKgToGrams('5')).toBe(5000);
    expect(parseKgToGrams('-20.250')).toBe(-20250);
  });

  it('rejects more than 3 decimals and junk', () => {
    expect(() => parseKgToGrams('1.2345')).toThrow();
    expect(() => parseKgToGrams('1e3')).toThrow();
    expect(() => parseKgToGrams('')).toThrow();
  });

  it('tryParseKgToGrams is the non-throwing form-input variant', () => {
    expect(tryParseKgToGrams(' 2.5 ')).toBe(2500);
    expect(tryParseKgToGrams('2.5555')).toBeNull();
    expect(tryParseKgToGrams('-1')).toBeNull();
  });

  it('formats grams back to the wire kg string', () => {
    expect(gramsToKgString(12345)).toBe('12.345');
    expect(gramsToKgString(1)).toBe('0.001');
    expect(gramsToKgString(-20250)).toBe('-20.250');
    expect(() => gramsToKgString(1.5)).toThrow();
  });

  it('formatGramsAsKg trims trailing zeros for display', () => {
    expect(formatGramsAsKg(2500)).toBe('2.5');
    expect(formatGramsAsKg(3000)).toBe('3');
    expect(formatGramsAsKg(1)).toBe('0.001');
  });
});
