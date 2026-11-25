/**
 * Error -> "what to tell the user and what they can do next", role-agnostic.
 *
 * Turns anything a request can throw (`ApiError` carrying an RFC 9457
 * problem, `NetworkError`, a stray `Error`) into a descriptor holding an
 * i18n KEY (from src/i18n/errors.*.json, the shared `error.*` bucket), its
 * interpolation params, and a machine `action` hint for the screen. It never
 * produces display text itself: shell code must not import a role's catalogue
 * (cross-role import guard), so each role translates the key with its own
 * `t()` -- customer: src/roles/customer/api/problem.ts.
 *
 * Branches on `problem.code` only, never on status or message text (the same
 * code can arrive with different statuses, e.g. OTP_INVALID 400 vs 401,
 * WALLET_INSUFFICIENT 402 on transfers vs 422 on checkout).
 */
import { ApiError, NetworkError } from '../api/client';
import { SocialSignInCancelledError, SocialSignInError } from '../auth/socialSignInErrors';

export type ErrorAction =
  /** Show a retry button / let the user try the same thing again. */
  | 'retry'
  /** Wait `retryAfterSeconds` before allowing the action again (countdown). */
  | 'wait'
  /** Offer "Add money" (prefill `params.amount` when known). */
  | 'topup'
  /** Refetch the cart / product and let the user adjust quantities. */
  | 'refresh_cart'
  /** The cart reservation expired: re-reserve (re-submit cart) before checkout. */
  | 're_reserve'
  /** Pick another pickup/delivery slot. */
  | 'choose_slot'
  /** Ask for a new OTP. */
  | 'resend_otp'
  /** Bind `fieldErrors` to the form inputs. */
  | 'fix_fields'
  /** Session is gone: go back to sign-in. */
  | 'sign_in'
  /** Nothing actionable; just show the message. */
  | 'none';

export interface ErrorDescriptor {
  /** Key in the shared `error.*` catalogue (always present in errors.en.json). */
  messageKey: string;
  params: Record<string, string | number>;
  action: ErrorAction;
  /**
   * Problem code, `NETWORK_OFFLINE`/`NETWORK_TIMEOUT` for transport failures,
   * client-only `SOCIAL_SIGN_IN_*` for native Google/Facebook failures, or null.
   */
  code: string | null;
  status: number | null;
  retryAfterSeconds: number | null;
  /** Field -> first message (prefix-stripped) for VALIDATION_FAILED et al. */
  fieldErrors: Record<string, string>;
  /** True when the user aborted (unmount/cancel): screens should show nothing. */
  silent: boolean;
}

/** Codes that have their own `error.<CODE>` key in errors.en.json. */
const KEYED_CODES = new Set<string>([
  'WALLET_INSUFFICIENT',
  'INSUFFICIENT_ALLOCATION',
  'STOCK_UNAVAILABLE',
  'CART_LOCK_EXPIRED',
  'SLOT_FULL',
  'RATE_LIMITED',
  'OTP_INVALID',
  'OTP_EXPIRED',
  'OTP_LOCKED',
  'OTP_RESEND_TOO_SOON',
  'OTP_SMS_DELIVERY_FAILED',
  'OTP_PROVIDER_RATE_LIMITED',
  'OTP_DESTINATION_INVALID',
  'OTP_PROVIDER_UNAVAILABLE',
  'VALIDATION_FAILED',
  'BAD_REQUEST',
  'EMAIL_NOT_CONFIGURED',
  'EMAIL_DELIVERY_FAILED',
  'WALLET_TRANSFER_DISABLED',
  'WALLET_TRANSFER_LIMIT_EXCEEDED',
  'WALLET_TRANSFER_SELF',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'FIELD_LOCKED',
  'CERT_EXPIRED',
  'PRICE_ABOVE_CEILING',
  'COUNTER_OFFER_EXPIRED',
  'PASSWORD_ALREADY_SET',
  'OAUTH_IDENTITY_ALREADY_LINKED',
  'OAUTH_LINK_TOKEN_INVALID',
  'OAUTH_TOKEN_INVALID',
  'INTERNAL',
]);

const ACTION_BY_CODE: Record<string, ErrorAction> = {
  WALLET_INSUFFICIENT: 'topup',
  INSUFFICIENT_ALLOCATION: 'refresh_cart',
  STOCK_UNAVAILABLE: 'refresh_cart',
  CART_LOCK_EXPIRED: 're_reserve',
  SLOT_FULL: 'choose_slot',
  RATE_LIMITED: 'wait',
  OTP_INVALID: 'none',
  OTP_EXPIRED: 'resend_otp',
  OTP_LOCKED: 'resend_otp',
  OTP_RESEND_TOO_SOON: 'wait',
  OTP_SMS_DELIVERY_FAILED: 'retry',
  OTP_PROVIDER_RATE_LIMITED: 'wait',
  OTP_PROVIDER_UNAVAILABLE: 'retry',
  VALIDATION_FAILED: 'fix_fields',
  BAD_REQUEST: 'fix_fields',
  EMAIL_DELIVERY_FAILED: 'retry',
  CONFLICT: 'retry',
  INTERNAL: 'retry',
};

function base(partial: Partial<ErrorDescriptor> & Pick<ErrorDescriptor, 'messageKey'>): ErrorDescriptor {
  return {
    params: {},
    action: 'none',
    code: null,
    status: null,
    retryAfterSeconds: null,
    fieldErrors: {},
    silent: false,
    ...partial,
  };
}

function describeSocialSignInError(err: SocialSignInError): ErrorDescriptor {
  const code = `SOCIAL_SIGN_IN_${err.reason}`;
  switch (err.reason) {
    case 'IN_PROGRESS':
      // A second tap while the sheet is already open: the first attempt is
      // still running and will report its own outcome.
      return base({ messageKey: 'error.generic', code, silent: true });
    case 'NETWORK':
      return base({ messageKey: 'error.NETWORK_OFFLINE', code: 'NETWORK_OFFLINE', action: 'retry' });
    case 'PLAY_SERVICES_UNAVAILABLE':
      return base({ messageKey: 'error.SOCIAL_SIGN_IN_PLAY_SERVICES', code });
    case 'DEVELOPER_ERROR':
    case 'NO_ID_TOKEN':
      // App/console misconfiguration: retrying cannot succeed, so no Retry;
      // the message points the user at mobile-number sign-in instead.
      return base({ messageKey: 'error.SOCIAL_SIGN_IN_UNAVAILABLE', code });
    case 'FAILED':
      return base({ messageKey: 'error.SOCIAL_SIGN_IN_FAILED', code, action: 'retry' });
  }
}

export function describeError(err: unknown): ErrorDescriptor {
  if (err instanceof NetworkError) {
    if (err.reason === 'aborted') {
      return base({ messageKey: 'error.generic', code: 'ABORTED', silent: true });
    }
    return base({
      messageKey: err.reason === 'timeout' ? 'error.NETWORK_TIMEOUT' : 'error.NETWORK_OFFLINE',
      code: err.reason === 'timeout' ? 'NETWORK_TIMEOUT' : 'NETWORK_OFFLINE',
      action: 'retry',
    });
  }

  // BR-39 native social sign-in failures never reach the API, so they carry no
  // problem code; without these branches they fell through to error.generic.
  if (err instanceof SocialSignInCancelledError) {
    return base({ messageKey: 'error.generic', code: 'SOCIAL_SIGN_IN_CANCELLED', silent: true });
  }
  if (err instanceof SocialSignInError) {
    return describeSocialSignInError(err);
  }

  if (!(err instanceof ApiError)) {
    return base({ messageKey: 'error.generic', action: 'retry' });
  }

  const code = String(err.problem.code);
  const common = {
    code,
    status: err.status,
    retryAfterSeconds: err.retryAfterSeconds,
    fieldErrors: err.fieldErrors,
  };
  const action: ErrorAction = ACTION_BY_CODE[code] ?? (err.status >= 500 ? 'retry' : 'none');

  // A 401 that reached a screen means the silent refresh already failed (or
  // this was an auth endpoint, where screens branch on OTP_* instead).
  if (code === 'UNAUTHENTICATED' || code === 'UNAUTHORIZED') {
    return base({ ...common, messageKey: 'error.SESSION_EXPIRED', action: 'sign_in' });
  }

  if ((code === 'RATE_LIMITED' || code === 'OTP_RESEND_TOO_SOON') && err.retryAfterSeconds !== null) {
    return base({
      ...common,
      messageKey: `error.${code}.seconds`,
      params: { seconds: err.retryAfterSeconds },
      action: 'wait',
    });
  }

  if (code === 'WALLET_INSUFFICIENT') {
    const details = err.walletShortfall;
    if (details !== null) {
      const params: Record<string, string> = { amount: details.shortfall };
      if (details.balance !== null) params['balance'] = details.balance;
      if (details.required !== null) params['required'] = details.required;
      return base({ ...common, messageKey: 'error.WALLET_INSUFFICIENT.shortfall', params, action: 'topup' });
    }
  }

  if (code === 'VALIDATION_FAILED' && err.topupLimits !== null) {
    return base({
      ...common,
      messageKey: 'error.TOPUP_AMOUNT_OUT_OF_RANGE',
      params: { min: err.topupLimits.min, max: err.topupLimits.max },
      action: 'fix_fields',
    });
  }

  if (KEYED_CODES.has(code)) {
    return base({ ...common, messageKey: `error.${code}`, action });
  }

  if (Object.keys(common.fieldErrors).length > 0) {
    return base({ ...common, messageKey: 'error.VALIDATION_FAILED', action: 'fix_fields' });
  }

  return base({ ...common, messageKey: 'error.generic', action });
}
