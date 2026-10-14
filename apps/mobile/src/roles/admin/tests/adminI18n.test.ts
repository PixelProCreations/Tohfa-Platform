/**
 * The admin t(): built on the shared engine in src/i18n/runtime.ts, so it has
 * {{param}} interpolation and a ta -> en fallback like farmer's and
 * customer's, while the catalogue data stays the admin's own JSON.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { getLocale, missingKeys, setLocale, t } from '../i18n';
import en from '../i18n/en.json';

afterEach(() => {
  setLocale('en');
});

describe('admin t()', () => {
  it('keeps the existing warehouseScope keys working', () => {
    expect(t('warehouseScope.loading')).toBe(en['warehouseScope.loading']);
    expect(t('warehouseScope.retry')).toBe(en['warehouseScope.retry']);
  });

  it('replaces {{param}} placeholders', () => {
    expect(t('datetime.minutesAgo', { count: 5 })).toBe('5 minutes ago');
  });

  it('leaves an unknown placeholder as written rather than printing undefined', () => {
    expect(t('datetime.minutesAgo')).toBe('{{count}} minutes ago');
  });

  it('falls back to English for a key with no Tamil string', () => {
    setLocale('ta');
    expect(getLocale()).toBe('ta');
    expect(t('warehouseScope.retry')).toBe(en['warehouseScope.retry']);
  });

  it('reports admin keys still missing a Tamil translation', () => {
    expect(missingKeys('ta')).toContain('warehouseScope.retry');
  });
});
