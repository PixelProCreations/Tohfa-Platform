/**
 * Temporary typed bridge for the `farmer.addWorkerScreen.*` keys.
 *
 * `t()` is typed by the English catalogue JSON, so keys that live only in the
 * not-yet-merged fragment would not type-check. Once the fragment is merged
 * into farmer.en.json / farmer.ta.json this wrapper can be replaced by `t`.
 */
import { t, type TranslationKey } from '../../../../../../i18n/farmer';

const PREFIX = 'farmer.addWorkerScreen.';

export function aw(key: string, params?: Record<string, string | number>): string {
  return t(`${PREFIX}${key}` as TranslationKey, params);
}

/** Existing shared catalogue keys (Back / Cancel / OK). */
export const common = {
  back: () => t('farmer.common.back'),
  cancel: () => t('farmer.common.cancel'),
  ok: () => t('farmer.common.ok'),
};
