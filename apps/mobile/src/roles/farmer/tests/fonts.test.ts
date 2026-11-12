import { describe, it, expect } from 'vitest';
import { tokens } from '@tohfa/design-tokens';
import { applyPoppins, flattenStyle, poppinsFamilyForWeight } from '../theme/fonts';

describe('poppinsFamilyForWeight', () => {
  it('reads family names from the design tokens', () => {
    expect(tokens.fontFamily).toEqual({
      regular: 'Poppins-Regular',
      medium: 'Poppins-Medium',
      semibold: 'Poppins-SemiBold',
      bold: 'Poppins-Bold',
      extrabold: 'Poppins-ExtraBold',
    });
  });

  it('maps undefined, null and normal to Regular', () => {
    expect(poppinsFamilyForWeight(undefined)).toBe(tokens.fontFamily.regular);
    expect(poppinsFamilyForWeight(null)).toBe(tokens.fontFamily.regular);
    expect(poppinsFamilyForWeight('normal')).toBe(tokens.fontFamily.regular);
  });

  it('maps weights <= 400 to Regular', () => {
    for (const w of ['100', '200', '300', '400', 100, 400]) {
      expect(poppinsFamilyForWeight(w)).toBe(tokens.fontFamily.regular);
    }
  });

  it('maps 500 to Medium, 600 to SemiBold', () => {
    expect(poppinsFamilyForWeight('500')).toBe(tokens.fontFamily.medium);
    expect(poppinsFamilyForWeight(500)).toBe(tokens.fontFamily.medium);
    expect(poppinsFamilyForWeight('600')).toBe(tokens.fontFamily.semibold);
    expect(poppinsFamilyForWeight(600)).toBe(tokens.fontFamily.semibold);
  });

  it('maps 700 and bold to Bold', () => {
    expect(poppinsFamilyForWeight('700')).toBe(tokens.fontFamily.bold);
    expect(poppinsFamilyForWeight(700)).toBe(tokens.fontFamily.bold);
    expect(poppinsFamilyForWeight('bold')).toBe(tokens.fontFamily.bold);
  });

  it('maps weights >= 800 to ExtraBold', () => {
    for (const w of ['800', '900', 800, 900]) {
      expect(poppinsFamilyForWeight(w)).toBe(tokens.fontFamily.extrabold);
    }
  });

  it('falls back to Regular for unparseable input', () => {
    expect(poppinsFamilyForWeight('abc')).toBe(tokens.fontFamily.regular);
  });
});

describe('applyPoppins', () => {
  it('flattens nested/falsy style arrays, later entries winning', () => {
    expect(flattenStyle([{ a: 1, b: 1 }, false, [null, { b: 2 }]])).toEqual({ a: 1, b: 2 });
  });

  it('sets the family from fontWeight and strips fontWeight', () => {
    expect(applyPoppins([{ fontSize: 12 }, { fontWeight: '600' }])).toEqual({
      fontSize: 12,
      fontFamily: tokens.fontFamily.semibold,
    });
  });

  it('uses Regular when there is no style at all', () => {
    expect(applyPoppins(undefined)).toEqual({ fontFamily: tokens.fontFamily.regular });
  });

  it('never overrides an explicit fontFamily (icon fonts) and keeps its weight', () => {
    const style = { fontFamily: 'MaterialSymbolsOutlined', fontWeight: '700' };
    expect(applyPoppins(style)).toEqual(style);
  });
});
