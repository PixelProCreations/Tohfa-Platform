/**
 * adminErrorKey: turns whatever an admin API call threw into an i18n key, so a
 * screen never shows a raw server `detail` or an English string of its own.
 * A `meta.reason` (e.g. CONFLICT + UPI_TXN_REF_REUSED) is more specific than
 * the code, so it wins when the catalogue has a string for it.
 */
import { describe, expect, it } from 'vitest';
import { errorCodeValues, GenericProblemCode, type Problem } from '@tohfa/shared-types';
import { ApiError, NetworkError } from '../../../shell/api/client';
import { adminErrorKey } from '../api/errors';
import en from '../i18n/en.json';

const catalogue = en as Record<string, string>;

function problem(code: string, meta?: Record<string, unknown>): ApiError {
  const p = { type: 'about:blank', title: 'x', status: 409, code, ...(meta ? { meta } : {}) } as Problem;
  return new ApiError(p);
}

describe('adminErrorKey', () => {
  it('every domain ErrorCode in shared-types has an admin.error key in en.json', () => {
    const missing = errorCodeValues.filter((code) => catalogue[`admin.error.${code}`] === undefined);
    expect(missing).toEqual([]);
  });

  it('every generic problem code has an admin.error key in en.json', () => {
    const missing = Object.values(GenericProblemCode).filter((code) => catalogue[`admin.error.${code}`] === undefined);
    expect(missing).toEqual([]);
  });

  it('maps an ApiError code to admin.error.<CODE>', () => {
    expect(adminErrorKey(problem('STOCK_UNAVAILABLE'))).toBe('admin.error.STOCK_UNAVAILABLE');
    expect(adminErrorKey(problem('NOT_FOUND'))).toBe('admin.error.NOT_FOUND');
  });

  it('prefers a known meta.reason over the code', () => {
    expect(adminErrorKey(problem('CONFLICT', { reason: 'UPI_TXN_REF_REUSED' }))).toBe(
      'admin.error.reason.UPI_TXN_REF_REUSED',
    );
  });

  it('ignores an unknown meta.reason and falls back to the code', () => {
    expect(adminErrorKey(problem('CONFLICT', { reason: 'SOMETHING_NEW' }))).toBe('admin.error.CONFLICT');
    expect(adminErrorKey(problem('CONFLICT', { reason: 42 }))).toBe('admin.error.CONFLICT');
  });

  it('falls back to generic for a code the catalogue does not know', () => {
    expect(adminErrorKey(problem('BRAND_NEW_CODE'))).toBe('admin.error.generic');
  });

  it('maps a NetworkError to admin.error.network', () => {
    expect(adminErrorKey(new NetworkError(new Error('offline')))).toBe('admin.error.network');
  });

  it('maps anything else to admin.error.generic', () => {
    for (const other of [new Error('boom'), 'oops', null, undefined, { code: 'STOCK_UNAVAILABLE' }]) {
      expect(adminErrorKey(other)).toBe('admin.error.generic');
    }
  });

  it('network and generic have strings in en.json', () => {
    expect(catalogue['admin.error.network']).toBeTruthy();
    expect(catalogue['admin.error.generic']).toBeTruthy();
  });
});
