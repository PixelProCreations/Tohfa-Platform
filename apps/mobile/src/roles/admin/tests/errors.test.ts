import { describe, expect, it } from 'vitest';
import { ApiError, NetworkError } from '../../../shell/api/client';
import { AdminTimeoutError } from '../api/http';
import { adminErrorKey, ADMIN_ERROR_KEYS } from '../api/errors';
import en from '../i18n/en.json';

function apiError(code: string, status = 422): ApiError {
  return new ApiError({ type: 'about:blank', title: 't', status, code: code as never });
}

describe('adminErrorKey', () => {
  it('maps domain codes to their own key (branching on code, never message text)', () => {
    expect(adminErrorKey(apiError('CASH_LIMIT_EXCEEDED'))).toBe('admin.errors.CASH_LIMIT_EXCEEDED');
    expect(adminErrorKey(apiError('IDEMPOTENCY_KEY_REUSED', 409))).toBe(
      'admin.errors.IDEMPOTENCY_KEY_REUSED',
    );
  });

  it('BR-30b: NOT_FOUND gets a neutral key (cross-warehouse rows are 404, never 403)', () => {
    expect(adminErrorKey(apiError('NOT_FOUND', 404))).toBe('admin.errors.NOT_FOUND');
  });

  it('falls back to a generic key for unknown codes and non-API errors', () => {
    expect(adminErrorKey(apiError('SOMETHING_NEW'))).toBe('admin.errors.generic');
    expect(adminErrorKey(new Error('x'))).toBe('admin.errors.generic');
    expect(adminErrorKey('x')).toBe('admin.errors.generic');
  });

  it('distinguishes offline from timeout', () => {
    expect(adminErrorKey(new NetworkError(new Error('down')))).toBe('admin.errors.network');
    expect(adminErrorKey(new AdminTimeoutError(1000))).toBe('admin.errors.timeout');
  });

  it('every key it can return exists in the admin catalogue', () => {
    for (const key of ADMIN_ERROR_KEYS) {
      expect(en, key).toHaveProperty([key]);
    }
  });
});
