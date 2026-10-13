/**
 * Role-scoped i18n catalog for the admin screens.
 *
 * This is deliberately NOT the merged runtime in src/i18n/runtime.ts (see
 * apps/mobile/CLAUDE.md "Known transitional state"): nothing imports that
 * yet, and admin keeps its catalogue in its own JSON so its strings never
 * reach another role's import graph. Per root CLAUDE.md §2.7 no admin screen
 * hard-codes a user-facing string; every one is a key here.
 *
 * `{name}` placeholders are replaced from `params`; a placeholder with no
 * matching param is left as-is so a missing value is visible in review rather
 * than silently blank.
 */
import en from './en.json';

export type TranslationKey = keyof typeof en;
export type TranslationParams = Readonly<Record<string, string | number>>;

export function t(key: TranslationKey, params?: TranslationParams): string {
  const template: string = en[key];
  if (params === undefined) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

export function isTranslationKey(key: string): key is TranslationKey {
  return Object.prototype.hasOwnProperty.call(en, key);
}
