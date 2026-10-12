/**
 * Turns whatever an admin API call threw into an i18n key, so a screen shows a
 * message worded for warehouse staff and never the server's `detail` (which is
 * written for developers) or an English string of its own.
 *
 * Order, most specific first:
 *   1. ApiError with a `meta.reason` the catalogue knows -> admin.error.reason.<REASON>
 *      (e.g. CONFLICT + UPI_TXN_REF_REUSED says more than CONFLICT alone);
 *   2. ApiError with a code the catalogue knows          -> admin.error.<CODE>;
 *   3. NetworkError                                       -> admin.error.network;
 *   4. anything else, including a code added on the server
 *      before the app knows it                            -> admin.error.generic.
 *
 * The test (../tests/api_errors.test.ts) checks every ErrorCode and generic
 * code in @tohfa/shared-types has a string, so step 4 only catches codes the
 * shared types do not list yet.
 */
import { ApiError, NetworkError } from '../../../shell/api/client';
import { hasKey, type TranslationKey } from '../i18n';

export const ADMIN_ERROR_GENERIC = 'admin.error.generic' satisfies TranslationKey;
export const ADMIN_ERROR_NETWORK = 'admin.error.network' satisfies TranslationKey;

export function adminErrorKey(err: unknown): TranslationKey {
  if (err instanceof ApiError) {
    const reason = err.problem.meta?.['reason'];
    if (typeof reason === 'string') {
      const reasonKey = `admin.error.reason.${reason}`;
      if (hasKey(reasonKey)) return reasonKey;
    }
    const codeKey = `admin.error.${err.problem.code}`;
    if (hasKey(codeKey)) return codeKey;
    return ADMIN_ERROR_GENERIC;
  }
  if (err instanceof NetworkError) return ADMIN_ERROR_NETWORK;
  return ADMIN_ERROR_GENERIC;
}
