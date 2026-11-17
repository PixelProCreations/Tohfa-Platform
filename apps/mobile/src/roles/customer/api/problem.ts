/**
 * Customer error UX contract: any thrown request error -> translated message
 * + action hint. Screens do:
 *
 *   } catch (err) {
 *     const e = mapProblem(err);
 *     if (e.silent) return;              // user cancelled / unmounted
 *     setFieldErrors(e.fieldErrors);     // VALIDATION_FAILED
 *     showError(e.message);
 *     if (e.action === 'topup') navigate('Topup', { ... });
 *     if (e.action === 'wait') startCountdown(e.retryAfterSeconds);
 *   }
 *
 * Mapping logic lives in src/shell/errors/describeError.ts (role-agnostic);
 * this file only translates its key with the customer catalogue
 * (src/i18n/customer.ts, which carries the shared `error.*` bucket from
 * src/i18n/errors.{en,ta}.json).
 */
import { describeError, type ErrorDescriptor } from '../../../shell/errors/describeError';
import { t, type TranslationKey } from '../../../i18n/customer';

export type { ErrorAction, ErrorDescriptor } from '../../../shell/errors/describeError';

export interface CustomerProblem extends ErrorDescriptor {
  /** Ready-to-show, localized text. */
  message: string;
}

export function mapProblem(err: unknown): CustomerProblem {
  const descriptor = describeError(err);
  return { ...descriptor, message: t(descriptor.messageKey as TranslationKey, descriptor.params) };
}

/** Just the localized message, for places that only show a toast/inline text. */
export function customerErrorMessage(err: unknown): string {
  return mapProblem(err).message;
}
