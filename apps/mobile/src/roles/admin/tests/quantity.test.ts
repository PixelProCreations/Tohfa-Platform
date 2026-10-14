/**
 * Weights as integer grams. The API sends and accepts `Quantity` as a kg
 * decimal string with up to 3 places (docs/openapi.yaml components.schemas
 * .Quantity); the app converts it to whole grams once, at the boundary, so no
 * sum or comparison ever touches a float.
 */
import { describe, expect, it } from 'vitest';
import { formatKg, gramsToKgString, parseKgToGrams } from '../money/quantity';

describe('parseKgToGrams', () => {
  it('parses whole and decimal kg into whole grams', () => {
    expect(parseKgToGrams('12.345')).toBe(12345);
    expect(parseKgToGrams('12')).toBe(12000);
    expect(parseKgToGrams('12.5')).toBe(12500);
    expect(parseKgToGrams('0.001')).toBe(1);
    expect(parseKgToGrams('250.000')).toBe(250000);
    expect(parseKgToGrams('0')).toBe(0);
  });

  it('accepts surrounding spaces and grouping commas as typed', () => {
    expect(parseKgToGrams(' 1,250.5 ')).toBe(1250500);
  });

  it('accepts a signed API Quantity (stock ledger deltas)', () => {
    expect(parseKgToGrams('-1.500')).toBe(-1500);
  });

  it('gives null for garbage, more than 3 decimals or an empty string', () => {
    for (const bad of ['', ' ', 'abc', '12.3456', '1.2.3', '.5', '5.', '12kg', '1e3', 'NaN', '--1', '+1', '1234567890']) {
      expect({ bad, grams: parseKgToGrams(bad) }).toEqual({ bad, grams: null });
    }
  });

  it('does not drift the way float maths would', () => {
    // 0.1 + 0.2 kg as floats is 0.30000000000000004; in grams it is exact.
    const a = parseKgToGrams('0.1');
    const b = parseKgToGrams('0.2');
    expect(a !== null && b !== null ? a + b : null).toBe(300);
    expect(parseKgToGrams('1.005')).toBe(1005);
    expect(parseKgToGrams('4.35')).toBe(4350);
    expect(parseKgToGrams('999999999.999')).toBe(999999999999);
  });
});

describe('gramsToKgString', () => {
  it('writes the API Quantity form with exactly 3 decimals', () => {
    expect(gramsToKgString(12345)).toBe('12.345');
    expect(gramsToKgString(12000)).toBe('12.000');
    expect(gramsToKgString(1)).toBe('0.001');
    expect(gramsToKgString(0)).toBe('0.000');
    expect(gramsToKgString(-1500)).toBe('-1.500');
  });

  it('round-trips through parseKgToGrams', () => {
    for (const g of [0, 1, 999, 1000, 12345, 4350, 1250500, 999999999999, -1]) {
      expect(parseKgToGrams(gramsToKgString(g))).toBe(g);
    }
  });

  it('rejects a non-integer gram count instead of rounding it', () => {
    expect(() => gramsToKgString(1.5)).toThrow();
    expect(() => gramsToKgString(Number.NaN)).toThrow();
  });
});

describe('formatKg', () => {
  it('matches the existing screens: Indian grouping, trailing zeros dropped, " kg"', () => {
    expect(formatKg(1250000)).toBe('1,250 kg');
    expect(formatKg(420000)).toBe('420 kg');
    expect(formatKg(12345)).toBe('12.345 kg');
    expect(formatKg(12350)).toBe('12.35 kg');
    expect(formatKg(12500)).toBe('12.5 kg');
    expect(formatKg(0)).toBe('0 kg');
    expect(formatKg(1234567000)).toBe('12,34,567 kg');
  });

  it('shows a negative weight with a leading minus', () => {
    expect(formatKg(-1500)).toBe('-1.5 kg');
  });
});
