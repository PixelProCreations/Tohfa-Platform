/**
 * Error -> admin i18n key.
 *
 * Screens never show `problem.detail` or `error.message` directly (that text
 * is English and server-authored) and never branch on message text; they
 * render `t(adminErrorKey(err))`. Codes are from
 * packages/shared-types/src/errors.ts. A code without a dedicated string falls
 * back to the generic key rather than leaking a raw code to the user.
 */
import { ApiError, NetworkError } from '../../../shell/api/client';
import { AdminTimeoutError } from './http';
import type { TranslationKey } from '../i18n';

const CODE_KEYS = {
  BAD_REQUEST: 'admin.errors.BAD_REQUEST',
  VALIDATION_FAILED: 'admin.errors.VALIDATION_FAILED',
  UNAUTHENTICATED: 'admin.errors.UNAUTHENTICATED',
  FORBIDDEN: 'admin.errors.FORBIDDEN',
  NOT_FOUND: 'admin.errors.NOT_FOUND',
  CONFLICT: 'admin.errors.CONFLICT',
  RATE_LIMITED: 'admin.errors.RATE_LIMITED',
  INTERNAL: 'admin.errors.INTERNAL',
  IDEMPOTENCY_KEY_REUSED: 'admin.errors.IDEMPOTENCY_KEY_REUSED',
  INVALID_STATE_TRANSITION: 'admin.errors.INVALID_STATE_TRANSITION',
  WAREHOUSE_SCOPE_VIOLATION: 'admin.errors.WAREHOUSE_SCOPE_VIOLATION',
  WAREHOUSE_REQUIRED: 'admin.errors.WAREHOUSE_REQUIRED',
  CASH_LIMIT_EXCEEDED: 'admin.errors.CASH_LIMIT_EXCEEDED',
  FISCAL_TAG_REQUIRED: 'admin.errors.FISCAL_TAG_REQUIRED',
  WALLET_INSUFFICIENT: 'admin.errors.WALLET_INSUFFICIENT',
  STOCK_UNAVAILABLE: 'admin.errors.STOCK_UNAVAILABLE',
  DUAL_APPROVAL_REQUIRED: 'admin.errors.DUAL_APPROVAL_REQUIRED',
  SAME_ACTOR_APPROVAL: 'admin.errors.SAME_ACTOR_APPROVAL',
  FIELD_LOCKED: 'admin.errors.FIELD_LOCKED',
} as const satisfies Record<string, TranslationKey>;

const GENERIC: TranslationKey = 'admin.errors.generic';
const NETWORK: TranslationKey = 'admin.errors.network';
const TIMEOUT: TranslationKey = 'admin.errors.timeout';

/** Every key adminErrorKey can return — the catalogue test checks them all. */
export const ADMIN_ERROR_KEYS: readonly TranslationKey[] = [
  ...Object.values(CODE_KEYS),
  GENERIC,
  NETWORK,
  TIMEOUT,
];

export function adminErrorKey(error: unknown): TranslationKey {
  if (error instanceof AdminTimeoutError) return TIMEOUT;
  if (error instanceof NetworkError) return NETWORK;
  if (error instanceof ApiError) {
    const code = error.problem.code as string;
    return Object.prototype.hasOwnProperty.call(CODE_KEYS, code)
      ? CODE_KEYS[code as keyof typeof CODE_KEYS]
      : GENERIC;
  }
  return GENERIC;
}
