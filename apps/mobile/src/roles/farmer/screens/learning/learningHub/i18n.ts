import { t, type TranslationKey } from '../../../../../i18n/farmer';

/**
 * Translate a `farmer.learningHub.*` key.
 *
 * `TranslationKey` is derived from farmer.en.json, so a key added through a
 * fragment that has not been merged yet would not typecheck. The cast lives
 * here, in one place; once merged it can be tightened with no call-site change.
 */
export function lh(suffix: string, params?: Record<string, string | number>): string {
  return t(`farmer.learningHub.${suffix}` as TranslationKey, params);
}
