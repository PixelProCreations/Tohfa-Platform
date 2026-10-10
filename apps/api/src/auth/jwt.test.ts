import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { RoleCode } from '@tohfa/shared-types';
import { config } from '../config.js';
import { AUDIENCE, ISSUER, signAccessToken, signRefreshToken, verifyRefreshToken } from './jwt.js';

describe('refresh token issuing', () => {
  it('two refresh tokens for the same subject and session minted in the same second are different strings', () => {
    const a = signRefreshToken({ sub: 'user-1', jti: 'session-1' });
    const b = signRefreshToken({ sub: 'user-1', jti: 'session-1' });
    expect(a).not.toBe(b);
    expect(verifyRefreshToken(a).jti).toBe('session-1');
    expect(verifyRefreshToken(b).jti).toBe('session-1');
    expect(verifyRefreshToken(a).nonce).not.toBe(verifyRefreshToken(b).nonce);
  });

  it('a refresh token without a nonce (issued before the claim existed) still verifies', () => {
    const legacy = jwt.sign({ sub: 'user-1', typ: 'refresh', jti: 'session-1' }, config.JWT_SECRET, {
      algorithm: 'HS256',
      issuer: ISSUER,
      audience: AUDIENCE,
      expiresIn: '30d',
    });
    expect(verifyRefreshToken(legacy)).toMatchObject({ sub: 'user-1', jti: 'session-1', typ: 'refresh' });
  });

  it('an access token is rejected as a refresh token (typ check)', () => {
    const access = signAccessToken({
      sub: 'user-1',
      roles: [{ code: RoleCode.CUSTOMER }],
      farmerId: null,
      customerId: null,
    });
    expect(() => verifyRefreshToken(access)).toThrow(expect.objectContaining({ code: 'UNAUTHENTICATED' }));
  });
});
