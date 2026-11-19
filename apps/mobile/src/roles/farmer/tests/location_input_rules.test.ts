import { describe, expect, it } from 'vitest';
import {
  rowFieldErrors,
  rowsAreValid,
  sanitizeCoordinateText,
  validateAreaAcres,
  validateLatitude,
  validateLocationLabel,
  validateLongitude,
  validateSearchQuery,
} from '../screens/registration/locationInputRules';

const row = (latText: string, lngText: string) => ({ id: 'r', latText, lngText });

describe('location label', () => {
  it('is required', () => expect(validateLocationLabel('  ')?.key).toBe('farmer.validation.required'));
  it('allows 120 characters, rejects 121 (openapi maxLength 120)', () => {
    expect(validateLocationLabel('a'.repeat(120))).toBeNull();
    expect(validateLocationLabel('a'.repeat(121))?.key).toBe('farmer.validation.tooLong');
  });
  it('accepts digits and mixed text', () => expect(validateLocationLabel('North field 2')).toBeNull());
});

describe('area acres', () => {
  it('is required', () => expect(validateAreaAcres('')?.key).toBe('farmer.validation.required'));
  it.each(['2.4', '0.5', '.5', '5.', '100000', '0.0001'])('accepts %s', (v) => expect(validateAreaAcres(v)).toBeNull());
  it.each([
    ['0', 'farmer.validation.numberTooSmall'],
    ['0.00', 'farmer.validation.numberTooSmall'],
    ['100000.01', 'farmer.validation.numberTooLarge'],
    ['1.23456', 'farmer.validation.tooManyDecimals'],
    ['1234567', 'farmer.validation.tooManyDigits'],
    ['1.2.3', 'farmer.validation.decimalInvalid'],
    ['abc', 'farmer.validation.decimalInvalid'],
    ['-1', 'farmer.validation.negativeNotAllowed'],
  ])('rejects %s', (v, key) => expect(validateAreaAcres(v)?.key).toBe(key));
});

describe('search query', () => {
  it('blank is fine', () => expect(validateSearchQuery('')).toBeNull());
  it('one character is too short', () => expect(validateSearchQuery('a')?.key).toBe('farmer.validation.tooShort'));
  it('101 characters is too long', () => expect(validateSearchQuery('a'.repeat(101))?.key).toBe('farmer.validation.tooLong'));
  it('accepts a village name', () => expect(validateSearchQuery('Coonoor')).toBeNull());
});

describe('coordinates', () => {
  it.each(['90', '-90', '11.4102', '+11.4', '11.', '.5', '0'])('latitude accepts %s', (v) =>
    expect(validateLatitude(v)).toBeNull());
  it.each(['90.0001', '-91', '1e1', '0x10', '1.2.3', '--1', '1 2'])('latitude rejects %s', (v) =>
    expect(validateLatitude(v)).not.toBeNull());
  it('longitude range is 180', () => {
    expect(validateLongitude('180')).toBeNull();
    expect(validateLongitude('-180.1')?.key).toBe('farmer.registration.step3.longitudeRange');
  });
  it('sanitize strips letters (no exponent / hex)', () => expect(sanitizeCoordinateText('1e1x')).toBe('11'));
});

describe('row errors', () => {
  it('shows nothing before blur', () => expect(rowFieldErrors(row('200', ''), {})).toEqual({}));
  it('range error after that field is blurred', () =>
    expect(rowFieldErrors(row('200', '76'), { latText: true }).latText?.key).toBe(
      'farmer.registration.step3.latitudeRange'));
  it('"enter both" waits until both fields were left', () => {
    expect(rowFieldErrors(row('11', ''), { latText: true }).lngText).toBeUndefined();
    expect(rowFieldErrors(row('11', ''), { latText: true, lngText: true }).lngText?.key).toBe(
      'farmer.registration.step3.bothCoordinates');
  });
  it('shows everything after submit', () =>
    expect(rowFieldErrors(row('11', ''), {}, true).lngText).toBeDefined());
  it('blank row has no errors even after submit', () => expect(rowFieldErrors(row('', ''), {}, true)).toEqual({}));
  it('rowsAreValid blocks incomplete or out-of-range rows', () => {
    expect(rowsAreValid([row('', ''), row('11', '76')])).toBe(true);
    expect(rowsAreValid([row('11', '')])).toBe(false);
    expect(rowsAreValid([row('91', '76')])).toBe(false);
  });
});
