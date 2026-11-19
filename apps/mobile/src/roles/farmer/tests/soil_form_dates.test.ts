import { describe, it, expect } from 'vitest';
import { validateFields } from '../utils/validation';
import { AMENDMENT_FORM_RULES, EROSION_FORM_RULES } from '../screens/farm/soilFormRules';

const base = { amendmentType: 'Compost', quantityKg: '10', notes: '' };
const amendDate = (appliedDate: string) =>
  validateFields({ ...base, appliedDate }, AMENDMENT_FORM_RULES).appliedDate;
const erosionDate = (logDate: string) =>
  validateFields({ logDate, practiceNotes: '' }, EROSION_FORM_RULES).logDate;

describe('soil form date rules (DD/MM/YY)', () => {
  it.each([amendDate, erosionDate])('requires a date', (check) => {
    expect(check('')).toBeDefined();
    expect(check('   ')).toBeDefined();
  });

  it.each([amendDate, erosionDate])('rejects non-dates and impossible calendar dates', (check) => {
    expect(check('abc')).toBeDefined();
    expect(check('31/02/24')).toBeDefined();
    expect(check('32/01/24')).toBeDefined();
    expect(check('01/13/24')).toBeDefined();
  });

  it.each([amendDate, erosionDate])('rejects future dates and accepts past ones', (check) => {
    expect(check('01/01/99')).toBeDefined();
    expect(check('1/2/24')).toBeUndefined();
    expect(check('15/03/2024')).toBeUndefined();
  });

  it('keeps the existing amendment rules active', () => {
    const e = validateFields({ ...base, quantityKg: '0', appliedDate: '1/2/24' }, AMENDMENT_FORM_RULES);
    expect(e.quantityKg).toBeDefined();
    expect(e.appliedDate).toBeUndefined();
  });
});
