/**
 * Validation rules for the farm assets / workforce / diary / soil-note forms.
 * Pure rule sets only (no rendering); limits are the docs/openapi.yaml ones.
 */
import { describe, it, expect } from 'vitest';
import { validateFields, hasErrors } from '../utils/validation';
import { equipmentRules, machineryRules, toolRules } from '../screens/farm/assets/assetFormRules';
import { WORKER_RULES, WORKER_VALIDATION_MESSAGES } from '../screens/farm/workforce/addWorker/workerRules';
import { hoursError } from '../screens/farm/workforce/attendanceHours';
import { diaryEntryRules, workerFieldError } from '../screens/farm/diary/diaryRules';
import { AMENDMENT_RULES, EROSION_RULES } from '../screens/farm/soilFormRules';

describe('farm asset forms', () => {
  it('requires name and service interval for a tool', () => {
    const errors = validateFields({ name: '', serviceInterval: '' }, toolRules());
    expect(errors.name?.key).toBe('farmer.validation.required');
    expect(errors.serviceInterval?.key).toBe('farmer.validation.required');
  });

  it('accepts a whole-number interval above zero and rejects 0, decimals and text', () => {
    const rules = toolRules();
    const ok = (v: string) => !hasErrors(validateFields({ name: 'Shears', serviceInterval: v }, rules));
    expect(ok('90')).toBe(true);
    expect(ok('0')).toBe(false);
    expect(ok('1.5')).toBe(false);
    expect(ok('abc')).toBe(false);
    expect(ok('-3')).toBe(false);
  });

  it('caps the interval at the parameter passed in', () => {
    const rules = toolRules({ maxIntervalDays: 365 });
    expect(hasErrors(validateFields({ name: 'a', serviceInterval: '366' }, rules))).toBe(true);
    expect(hasErrors(validateFields({ name: 'a', serviceInterval: '365' }, rules))).toBe(false);
  });

  it('enforces the 160 / 160 / 80 character limits on name, make/model and fuel type', () => {
    const errors = validateFields(
      { name: 'x'.repeat(161), makeModel: 'x'.repeat(161), fuelType: 'x'.repeat(81), serviceInterval: '30' },
      machineryRules(),
    );
    expect(Object.keys(errors).sort()).toEqual(['fuelType', 'makeModel', 'name']);
  });

  it('treats coverage area as optional, non-negative with at most 2 decimals', () => {
    const rules = equipmentRules();
    const check = (v: string) => validateFields({ name: 'Kit', coverageArea: v, serviceInterval: '30' }, rules).coverageArea;
    expect(check('')).toBeUndefined();
    expect(check('2.5')).toBeUndefined();
    expect(check('-1')).toBeDefined();
    expect(check('2.555')).toBeDefined();
    expect(check('two')).toBeDefined();
  });
});

describe('add worker form', () => {
  const base = { name: 'Murugan', accountNo: '', ifsc: '', upiId: '', wageAmount: '450' };

  it('accepts a minimal valid worker', () => {
    expect(hasErrors(validateFields(base, WORKER_RULES))).toBe(false);
  });

  it('requires name and wage, and rejects a zero or malformed wage', () => {
    expect(validateFields({ ...base, name: ' ' }, WORKER_RULES).name?.key).toBe('farmer.validation.required');
    expect(validateFields({ ...base, wageAmount: '' }, WORKER_RULES).wageAmount?.key).toBe('farmer.validation.required');
    expect(validateFields({ ...base, wageAmount: '0' }, WORKER_RULES).wageAmount).toBeDefined();
    expect(validateFields({ ...base, wageAmount: '450.555' }, WORKER_RULES).wageAmount).toBeDefined();
    expect(validateFields({ ...base, wageAmount: '12abc' }, WORKER_RULES).wageAmount).toBeDefined();
  });

  it('validates the optional bank fields only when filled in', () => {
    expect(validateFields({ ...base, ifsc: 'SBIN0001234' }, WORKER_RULES).ifsc).toBeUndefined();
    expect(validateFields({ ...base, ifsc: 'sbin0001234' }, WORKER_RULES).ifsc).toBeUndefined();
    expect(validateFields({ ...base, ifsc: 'SBIN1001234' }, WORKER_RULES).ifsc?.key).toBe(WORKER_VALIDATION_MESSAGES.ifscInvalid);
    expect(validateFields({ ...base, upiId: 'raju@okbank' }, WORKER_RULES).upiId).toBeUndefined();
    expect(validateFields({ ...base, upiId: 'raju-at-bank' }, WORKER_RULES).upiId?.key).toBe(WORKER_VALIDATION_MESSAGES.upiInvalid);
    expect(validateFields({ ...base, accountNo: '0012345678901' }, WORKER_RULES).accountNo).toBeUndefined();
    expect(validateFields({ ...base, accountNo: '12 34' }, WORKER_RULES).accountNo?.key).toBe(WORKER_VALIDATION_MESSAGES.accountInvalid);
  });

  it('enforces the API length limits (name 200, account 40, IFSC 20, UPI 120)', () => {
    const errors = validateFields(
      { name: 'a'.repeat(201), accountNo: '1'.repeat(41), ifsc: 'A'.repeat(21), upiId: `${'a'.repeat(120)}@bank`, wageAmount: '1' },
      WORKER_RULES,
    );
    expect(Object.keys(errors).sort()).toEqual(['accountNo', 'ifsc', 'name', 'upiId']);
  });
});

describe('attendance / diary worker hours', () => {
  it('BR-44a: hours must be greater than 0 and at most 24; blank is allowed', () => {
    expect(hoursError('')).toBeNull();
    expect(hoursError('8')).toBeNull();
    expect(hoursError('24')).toBeNull();
    expect(hoursError('7.5')).toBeNull();
    expect(hoursError('0')).not.toBeNull();
    expect(hoursError('0.00')).not.toBeNull();
    expect(hoursError('24.01')).not.toBeNull();
    expect(hoursError('25')).not.toBeNull();
    expect(hoursError('1.234')).not.toBeNull();
    expect(hoursError('abc')?.key).toBe('farmer.validation.decimalInvalid');
  });
});

describe('diary entry step 3', () => {
  const rules = diaryEntryRules(1440);

  it('BR-42c: minutes is required, a whole number from 1 to the bound passed in', () => {
    const check = (m: string) => validateFields({ minutes: m, notes: '' }, rules).minutes;
    expect(check('')).toBeDefined();
    expect(check('0')).toBeDefined();
    expect(check('45')).toBeUndefined();
    expect(check('1440')).toBeUndefined();
    expect(check('1441')).toBeDefined();
    expect(check('4.5')).toBeDefined();
    expect(check('-5')).toBeDefined();
  });

  it('caps notes at 2000 characters', () => {
    expect(validateFields({ minutes: '5', notes: 'n'.repeat(2000) }, rules).notes).toBeUndefined();
    expect(validateFields({ minutes: '5', notes: 'n'.repeat(2001) }, rules).notes).toBeDefined();
  });

  it('BR-44b: worker wage must be a positive rupee amount (string-exact, no float rounding)', () => {
    expect(workerFieldError('wage', '')).toBeNull();
    expect(workerFieldError('wage', '80.50')).toBeNull();
    expect(workerFieldError('wage', '0')).not.toBeNull();
    expect(workerFieldError('wage', '80.505')).not.toBeNull();
    expect(workerFieldError('name', 'x'.repeat(121))).not.toBeNull();
    expect(workerFieldError('name', 'Lakshmi')).toBeNull();
    expect(workerFieldError('hours', '30')).not.toBeNull();
  });
});

describe('soil forms', () => {
  it('requires amendment type and a positive quantity', () => {
    const e = validateFields({ amendmentType: '', quantityKg: '', notes: '' }, AMENDMENT_RULES);
    expect(e.amendmentType).toBeDefined();
    expect(e.quantityKg).toBeDefined();
    const q = (v: string) => validateFields({ amendmentType: 'Compost', quantityKg: v, notes: '' }, AMENDMENT_RULES).quantityKg;
    expect(q('50')).toBeUndefined();
    expect(q('2.5')).toBeUndefined();
    expect(q('0')).toBeDefined();
    expect(q('0.000')).toBeDefined();
    expect(q('-1')).toBeDefined();
    expect(q('5kg')).toBeDefined();
    expect(q('1.2345')).toBeDefined();
  });

  it('caps type at 120 and notes at 2000 characters', () => {
    const e = validateFields({ amendmentType: 'x'.repeat(121), quantityKg: '1', notes: 'n'.repeat(2001) }, AMENDMENT_RULES);
    expect(Object.keys(e).sort()).toEqual(['amendmentType', 'notes']);
    expect(validateFields({ practiceNotes: 'n'.repeat(2001) }, EROSION_RULES).practiceNotes).toBeDefined();
    expect(validateFields({ practiceNotes: '' }, EROSION_RULES).practiceNotes).toBeUndefined();
  });
});
