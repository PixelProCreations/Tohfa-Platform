import { describe, expect, it } from 'vitest';
import { profileCompleteness } from './customer-profile.completeness.js';

const base = { fullName: 'Asha', age: null, gender: null, harvestPreferences: [] as string[] };

describe('BR-190: profile completeness', () => {
  it('BR-190: the sign-up placeholder name is incomplete and reported as fullName', () => {
    const r = profileCompleteness({ ...base, fullName: 'TOHFA Customer', gender: 'FEMALE' });
    expect(r).toEqual({ profileComplete: false, missingFields: ['fullName'] });
  });
  it('BR-190: a real name with no onboarding field is incomplete', () => {
    const r = profileCompleteness(base);
    expect(r.profileComplete).toBe(false);
    expect(r.missingFields).toEqual(['age', 'gender', 'harvestPreferences']);
  });
  it('BR-190: a real name plus any one onboarding field is complete', () => {
    expect(profileCompleteness({ ...base, harvestPreferences: ['mango'] })).toEqual({ profileComplete: true, missingFields: [] });
    expect(profileCompleteness({ ...base, age: 30 }).profileComplete).toBe(true);
  });
  it('BR-190: a blank name is incomplete', () => {
    expect(profileCompleteness({ ...base, fullName: '  ', age: 30 }).missingFields).toEqual(['fullName']);
  });
});
