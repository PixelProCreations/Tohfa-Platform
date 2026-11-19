import { describe, expect, it } from 'vitest';
import { validateFields } from '../utils/validation';
import { PLANTING_RULES } from '../screens/farm/crops/plantingValidation';
import { FERTIGATION_RULES } from '../screens/farm/crops/fertigationValidation';
import { INPUT_APPLIED_RULES } from '../screens/farm/crops/inputAppliedValidation';
import { NEW_CROP_RULES, newCropFieldValues } from '../screens/farm/crops/newCrop/validation';
import { PEST_TREATMENT_RULES } from '../screens/farm/pest/logPestTreatment/validation';
import { REPORT_DETECTION_RULES } from '../screens/farm/pest/pestManagement/reportValidation';
import { REMINDER_RULES } from '../screens/farm/pest/treatmentSchedule/reminderValidation';
import { soilTestRules, NEXT_DUE_BEFORE_TEST_KEY } from '../screens/farm/soil/uploadSoilTest/validation';
import { soilIsoDate } from '../screens/farm/soilForms/dateValidation';

const keys = (errors: object): string[] => Object.keys(errors).sort();

describe('planting forms', () => {
  const ok = { species: 'Silver Oak', treeCount: '12', zone: '', purpose: '' };
  it('accepts a valid planting', () => {
    expect(validateFields(ok, PLANTING_RULES)).toEqual({});
  });
  it('requires species and a whole tree count of at least 1', () => {
    expect(keys(validateFields({ ...ok, species: '  ', treeCount: '' }, PLANTING_RULES))).toEqual(['species', 'treeCount']);
    expect(keys(validateFields({ ...ok, treeCount: '2.5' }, PLANTING_RULES))).toEqual(['treeCount']);
    expect(keys(validateFields({ ...ok, treeCount: '0' }, PLANTING_RULES))).toEqual(['treeCount']);
    expect(keys(validateFields({ ...ok, treeCount: '2147483648' }, PLANTING_RULES))).toEqual(['treeCount']);
  });
  it('enforces the openapi length limits', () => {
    expect(keys(validateFields({ ...ok, species: 'a'.repeat(201) }, PLANTING_RULES))).toEqual(['species']);
    expect(keys(validateFields({ ...ok, zone: 'a'.repeat(201) }, PLANTING_RULES))).toEqual(['zone']);
    expect(keys(validateFields({ ...ok, purpose: 'a'.repeat(501) }, PLANTING_RULES))).toEqual(['purpose']);
  });
});

describe('fertigation quantity and PHI', () => {
  it('requires a positive quantity with at most 2 decimals and 8 integer digits', () => {
    const run = (quantity: string, phiDays = '') => validateFields({ quantity, phiDays }, FERTIGATION_RULES);
    expect(run('60')).toEqual({});
    expect(run('0.5')).toEqual({});
    expect(keys(run(''))).toEqual(['quantity']);
    expect(keys(run('0'))).toEqual(['quantity']);
    expect(keys(run('1.234'))).toEqual(['quantity']);
    expect(keys(run('123456789'))).toEqual(['quantity']);
    expect(keys(run('-1'))).toEqual(['quantity']);
    expect(keys(run('1e3'))).toEqual(['quantity']);
  });
  it('allows blank PHI and rejects fractions or negatives', () => {
    const run = (phiDays: string) => validateFields({ quantity: '1', phiDays }, FERTIGATION_RULES);
    expect(run('')).toEqual({});
    expect(run('7')).toEqual({});
    expect(keys(run('7.5'))).toEqual(['phiDays']);
    expect(keys(run('-2'))).toEqual(['phiDays']);
  });
});

describe('add input applied', () => {
  const ok = { productName: 'Jeevamrutham', quantity: '200', dateTime: '17 Sep 2026, 09:20 AM', notes: '' };
  it('accepts valid input and flags each broken field', () => {
    expect(validateFields(ok, INPUT_APPLIED_RULES)).toEqual({});
    expect(keys(validateFields({ ...ok, productName: '', quantity: 'abc', dateTime: '' }, INPUT_APPLIED_RULES))).toEqual([
      'dateTime',
      'productName',
      'quantity',
    ]);
    expect(keys(validateFields({ ...ok, notes: 'x'.repeat(2001) }, INPUT_APPLIED_RULES))).toEqual(['notes']);
  });
});

describe('new crop wizard', () => {
  const base = { seedVariety: '', seedCompany: '', quantityUsed: '', costRs: '', areaAcres: '2.5', expectedQtyKg: '' };
  const run = (patch: Partial<typeof base>) => validateFields(newCropFieldValues({ ...base, ...patch }), NEW_CROP_RULES);
  it('treats every field as optional but shape-checked', () => {
    expect(run({})).toEqual({});
    expect(run({ quantityUsed: '1,250.5', expectedQtyKg: '2,000' })).toEqual({});
    expect(keys(run({ seedVariety: 'x'.repeat(161) }))).toEqual(['seedVariety']);
    expect(keys(run({ seedCompany: 'x'.repeat(161) }))).toEqual(['seedCompany']);
    expect(keys(run({ quantityUsed: '-1', expectedQtyKg: 'abc' }))).toEqual(['expectedQtyKg', 'quantityUsed']);
  });
  it('validates cost as a rupee string with at most 2 decimals (no float)', () => {
    expect(run({ costRs: '250.50' })).toEqual({});
    expect(keys(run({ costRs: '250.505' }))).toEqual(['costRs']);
    expect(keys(run({ costRs: '12345678901' }))).toEqual(['costRs']);
  });
});

describe('pest forms', () => {
  it('log treatment: interval and PHI are optional whole numbers', () => {
    const run = (intervalDays: string, phiDays: string) => validateFields({ intervalDays, phiDays }, PEST_TREATMENT_RULES);
    expect(run('', '')).toEqual({});
    expect(run('12', '5')).toEqual({});
    expect(keys(run('1.5', '-1'))).toEqual(['intervalDays', 'phiDays']);
    expect(keys(run('366', ''))).toEqual(['intervalDays']);
  });
  it('report detection: pest type required (<=120), notes <=2000', () => {
    expect(keys(validateFields({ pestType: ' ', notes: '' }, REPORT_DETECTION_RULES))).toEqual(['pestType']);
    expect(keys(validateFields({ pestType: 'a'.repeat(121), notes: '' }, REPORT_DETECTION_RULES))).toEqual(['pestType']);
    expect(validateFields({ pestType: 'Aphids', notes: 'x'.repeat(2000) }, REPORT_DETECTION_RULES)).toEqual({});
    expect(keys(validateFields({ pestType: 'Aphids', notes: 'x'.repeat(2001) }, REPORT_DETECTION_RULES))).toEqual(['notes']);
  });
  it('reminder: title required (<=160), notes <=2000', () => {
    expect(keys(validateFields({ treatmentName: '', notes: '' }, REMINDER_RULES))).toEqual(['treatmentName']);
    expect(keys(validateFields({ treatmentName: 'a'.repeat(161), notes: '' }, REMINDER_RULES))).toEqual(['treatmentName']);
    expect(validateFields({ treatmentName: 'Neem spray', notes: '' }, REMINDER_RULES)).toEqual({});
  });
});

describe('soil test form', () => {
  const ok = {
    testDate: '01/01/20',
    nextDue: '01/01/21',
    organicCarbon: '0.6',
    ph: '6.5',
    ec: '0.4',
    tds: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
  };
  const run = (patch: Partial<typeof ok>) => {
    const values = { ...ok, ...patch };
    return validateFields(values, soilTestRules(values.testDate));
  };
  it('accepts a valid record', () => {
    expect(run({})).toEqual({});
    expect(run({ tds: '320', nitrogen: '210.5', phosphorus: '12', potassium: '180' })).toEqual({});
  });
  it('enforces the openapi ranges: OC 0..100, pH 0..14, EC >= 0, TDS whole', () => {
    expect(keys(run({ organicCarbon: '100.1' }))).toEqual(['organicCarbon']);
    expect(keys(run({ ph: '14.1' }))).toEqual(['ph']);
    expect(keys(run({ ph: '-1' }))).toEqual(['ph']);
    expect(keys(run({ ec: '-0.1' }))).toEqual(['ec']);
    expect(keys(run({ tds: '12.5' }))).toEqual(['tds']);
    expect(keys(run({ nitrogen: '-5' }))).toEqual(['nitrogen']);
  });
  it('requires the three measured values and both dates', () => {
    expect(keys(run({ organicCarbon: '', ph: '', ec: '', testDate: '', nextDue: '' }))).toEqual([
      'ec',
      'nextDue',
      'organicCarbon',
      'ph',
      'testDate',
    ]);
  });
  it('rejects impossible and future test dates', () => {
    expect(soilIsoDate('31/02/26')).toBeNull();
    expect(soilIsoDate('15/08/26')).toBe('2026-08-15');
    expect(keys(run({ testDate: '31/02/20' }))).toContain('testDate');
    expect(keys(run({ testDate: '01/01/99', nextDue: '01/01/99' }))).toContain('testDate');
  });
  it('rejects a next-due date before the test date with its own message', () => {
    const errors = run({ nextDue: '01/01/19' });
    expect(keys(errors)).toEqual(['nextDue']);
    expect(errors.nextDue?.key).toBe(NEXT_DUE_BEFORE_TEST_KEY);
  });
});
