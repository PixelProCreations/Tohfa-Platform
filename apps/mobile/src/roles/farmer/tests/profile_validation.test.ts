import { describe, expect, it } from 'vitest';
import { firstInvalidField, validateFields } from '../utils/validation';
import {
  FARM_RULES,
  PERSONAL_DETAILS_RULES,
  PERSONAL_RULES,
  ZONE_EDIT_RULES,
  ZONE_RULES,
  parseDobInput,
  passwordRules,
  positiveDecimal,
} from '../screens/profile/profileValidation';
import { buildFarmUpdate, draftFromFarm } from '../screens/profile/editFarmForm';
import { LEARNING_MESSAGE_MAX_LENGTH, messageError } from '../screens/learning/learningValidation';
import type { Farm } from '../api/farms';

const keyOf = (e: { key: string } | undefined) => e?.key;

describe('profile validation: personal details', () => {
  const ok = { fullName: 'Ravi Kumar', dob: '14 Mar 1985', yearsInOrganic: '12', farmName: 'Green Acres', location: 'Coonoor' };

  it('accepts a complete valid modal form and a blank optional one', () => {
    expect(validateFields(ok, PERSONAL_RULES)).toEqual({});
    expect(validateFields({ ...ok, dob: '', yearsInOrganic: '', farmName: '', location: '' }, PERSONAL_RULES)).toEqual({});
  });

  it('requires a name of 2..120 letters', () => {
    expect(keyOf(validateFields({ ...ok, fullName: '' }, PERSONAL_RULES).fullName)).toBe('farmer.validation.required');
    expect(keyOf(validateFields({ ...ok, fullName: 'A' }, PERSONAL_RULES).fullName)).toBe('farmer.validation.tooShort');
    expect(keyOf(validateFields({ ...ok, fullName: 'R2D2' }, PERSONAL_RULES).fullName)).toBe('farmer.validation.nameInvalid');
    expect(keyOf(validateFields({ ...ok, fullName: 'a'.repeat(121) }, PERSONAL_RULES).fullName)).toBe('farmer.validation.tooLong');
  });

  it('bounds experience to the API whole-number range 0..90', () => {
    expect(validateFields({ ...ok, yearsInOrganic: '90' }, PERSONAL_RULES).yearsInOrganic).toBeUndefined();
    expect(keyOf(validateFields({ ...ok, yearsInOrganic: '91' }, PERSONAL_RULES).yearsInOrganic)).toBe('farmer.validation.numberTooLarge');
    expect(keyOf(validateFields({ ...ok, yearsInOrganic: '-1' }, PERSONAL_RULES).yearsInOrganic)).toBe('farmer.validation.negativeNotAllowed');
    expect(keyOf(validateFields({ ...ok, yearsInOrganic: '2.5' }, PERSONAL_RULES).yearsInOrganic)).toBe('farmer.validation.integerInvalid');
  });

  it('rejects a DOB that is not a real past date', () => {
    expect(parseDobInput('31 Feb 1980')).toBeNull();
    expect(parseDobInput('29 Feb 2000')).toBe('2000-02-29');
    expect(validateFields({ ...ok, dob: '31 Feb 1980' }, PERSONAL_RULES).dob).toBeDefined();
    expect(validateFields({ ...ok, dob: '1 Jan 2999' }, PERSONAL_RULES).dob).toBeDefined();
    expect(validateFields({ ...ok, dob: 'yesterday' }, PERSONAL_RULES).dob).toBeDefined();
  });

  it('caps address at 300 and gender to the API enum shorthand', () => {
    const base = { fullName: 'Ravi', dob: '', gender: 'Male', address: 'x'.repeat(300), yearsInOrganic: '' };
    expect(validateFields(base, PERSONAL_DETAILS_RULES)).toEqual({});
    expect(validateFields({ ...base, address: 'x'.repeat(301) }, PERSONAL_DETAILS_RULES).address).toBeDefined();
    expect(validateFields({ ...base, gender: 'robot' }, PERSONAL_DETAILS_RULES).gender).toBeDefined();
    expect(validateFields({ ...base, gender: 'f' }, PERSONAL_DETAILS_RULES).gender).toBeUndefined();
  });
});

describe('profile validation: farm and zones', () => {
  it('validates acres as an exact positive decimal string', () => {
    expect(validateFields({ acres: '2.5', zones: '3', waterSource: 'Well, Borewell' }, FARM_RULES)).toEqual({});
    for (const bad of ['0', '-1', '1e3', 'abc', '1.2.3']) {
      expect(validateFields({ acres: bad, zones: '', waterSource: '' }, FARM_RULES).acres).toBeDefined();
    }
    expect(positiveDecimal('100')('2.4691358')).toBeNull();
  });

  it('rejects non-integer zone counts and an over-long water source item', () => {
    expect(validateFields({ acres: '', zones: '2.5', waterSource: '' }, FARM_RULES).zones).toBeDefined();
    expect(validateFields({ acres: '', zones: '', waterSource: `Well, ${'x'.repeat(61)}` }, FARM_RULES).waterSource).toBeDefined();
  });

  it('requires a zone name and a positive area (zone details popup)', () => {
    const errors = validateFields({ name: ' ', areaText: '0' }, ZONE_RULES);
    expect(keyOf(errors.name)).toBe('farmer.validation.required');
    expect(errors.areaText).toBeDefined();
    expect(firstInvalidField(errors, ['name', 'areaText'])).toBe('name');
    expect(validateFields({ name: 'North', areaText: '' }, ZONE_RULES)).toEqual({});
  });

  it('keeps a blank zone name allowed in the edit modal, but bounds the crop fields', () => {
    expect(validateFields({ name: '', cropName: '', cropDay: '' }, ZONE_EDIT_RULES)).toEqual({});
    expect(validateFields({ name: 'a', cropName: 'b', cropDay: '1.5' }, ZONE_EDIT_RULES).cropDay).toBeDefined();
  });

  it('rejects exponent-style area in the FMB edit-farm form', () => {
    const farm = { id: 'f1', name: 'Farm', notes: null, areaAcres: 1 } as unknown as Farm;
    const draft = { ...draftFromFarm(farm, []), areaText: '1e3' };
    const result = buildFarmUpdate(farm, draft);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.area).toBe('areaInvalid');
    expect(buildFarmUpdate(farm, { ...draft, areaText: '2.5' }).ok).toBe(true);
  });
});

describe('profile validation: passwords', () => {
  it('requires all, 10..128 chars, and a matching confirmation', () => {
    const rules = passwordRules(() => 'longenough1');
    expect(validateFields({ currentPassword: 'old', newPassword: 'longenough1', confirmPassword: 'longenough1' }, rules)).toEqual({});
    const errors = validateFields({ currentPassword: '', newPassword: 'short', confirmPassword: 'other' }, rules);
    expect(keyOf(errors.currentPassword)).toBe('farmer.validation.required');
    expect(keyOf(errors.newPassword)).toBe('farmer.validation.tooShort');
    expect(keyOf(errors.confirmPassword)).toBe('farmer.validation.passwordMismatch');
    const long = 'x'.repeat(129);
    expect(validateFields({ currentPassword: 'a', newPassword: long, confirmPassword: long }, passwordRules(() => long)).newPassword).toBeDefined();
  });

  it('does not trim passwords: spaces count toward the length', () => {
    const pw = 'ab cd ef gh';
    expect(validateFields({ currentPassword: 'a', newPassword: pw, confirmPassword: pw }, passwordRules(() => pw))).toEqual({});
  });
});

describe('learning input limits', () => {
  it('blocks a blank or over-long comment / post', () => {
    expect(messageError('   ')).not.toBeNull();
    expect(messageError('hello')).toBeNull();
    expect(messageError('x'.repeat(LEARNING_MESSAGE_MAX_LENGTH + 1))).not.toBeNull();
  });
});
