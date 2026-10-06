/**
 * Static guard: every literal `t('...')` key used by the auth screens (and the other
 * screens that fall back to the shared `error.generic` key) must resolve in BOTH locales.
 *
 * The farmer `t()` (src/i18n/farmer.ts) serves the shared `errors.*.json` bucket merged
 * with `farmer.*.json`, so a key is "present" when it is in either file for that locale.
 * A key missing from a locale would render as raw key text on screen.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import errorsEn from '../../../i18n/errors.en.json';
import errorsTa from '../../../i18n/errors.ta.json';
import farmerEn from '../../../i18n/farmer.en.json';
import farmerTa from '../../../i18n/farmer.ta.json';

const en: Record<string, string> = { ...errorsEn, ...farmerEn };
const ta: Record<string, string> = { ...errorsTa, ...farmerTa };

const AUTH_SCREENS = [
  '../screens/auth/LoginScreen.tsx',
  '../screens/auth/ForgotPasswordScreen.tsx',
  '../screens/auth/ResetPasswordScreen.tsx',
];

// Other screens that use the same shared fallback key.
const ERROR_GENERIC_USERS = [
  ...AUTH_SCREENS,
  '../screens/profile/FarmRatingsScreen.tsx',
  '../screens/profile/PersonalDetailsScreen.tsx',
];

/** Literal keys passed straight to t('...') / t("...") (dynamic keys are not statically checkable). */
function literalKeys(source: string): string[] {
  return [...source.matchAll(/\bt\(\s*(['"])([A-Za-z0-9_.-]+)\1/g)].map((m) => m[2]!);
}

function read(file: string): string {
  return fs.readFileSync(path.resolve(__dirname, file), 'utf8');
}

describe('auth screens: every literal t() key exists in en and ta', () => {
  it.each(AUTH_SCREENS)('%s', (file) => {
    const keys = [...new Set(literalKeys(read(file)))];
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(en[key], `en ${key}`).toBeTruthy();
      expect(ta[key], `ta ${key}`).toBeTruthy();
    }
  });
});

describe('error.generic (shared fallback message)', () => {
  it('is defined, non-empty and translated (not the English text) in the farmer catalogue', () => {
    expect(en['error.generic']).toBeTruthy();
    expect(ta['error.generic']).toBeTruthy();
    expect(ta['error.generic']).not.toBe(en['error.generic']);
  });

  it.each(ERROR_GENERIC_USERS)('%s uses a key that resolves in both locales', (file) => {
    const keys = literalKeys(read(file)).filter((k) => k === 'error.generic');
    expect(keys.length).toBeGreaterThan(0);
  });
});
