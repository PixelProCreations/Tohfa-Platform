import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createKeychainMock } from '../../../tests/mocks/keychainMock';

// api/farmer.ts -> api/client.ts -> storage/tokenStorage.ts imports react-native-keychain, whose
// real module transitively requires('react-native') (Flow syntax, unparseable outside Metro).
// Same mock and reason as farm_rating.test.ts.
vi.mock('react-native-keychain', () => createKeychainMock());

import {
  createCertification,
  getMyCertifications,
  getSystemConfig,
  type Certification,
} from '../api/farmer';
import { ApiError, NetworkError, setAccessToken } from '../../../shell/api/client';

const problem500 = {
  type: 'about:blank',
  title: 'Internal Server Error',
  status: 500,
  code: 'INTERNAL',
};

function respond(status: number, body: unknown): typeof fetch {
  return vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  ) as unknown as typeof fetch;
}

const realCert: Certification = {
  id: 'cert-real-1',
  certType: 'PGS',
  certNumber: 'PGS-TN-REAL-1',
  issuingBody: 'Real Body',
  issuedOn: '2026-01-01',
  expiresOn: '2027-01-01',
  documentUrl: null,
  verificationStatus: 'UNVERIFIED',
  verifiedAt: null,
  verifiedBy: null,
  daysToExpiry: 200,
  blocksListings: true,
};

describe('Farmer certifications API: failures propagate, nothing is fabricated', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setAccessToken(null);
  });

  describe('getMyCertifications()', () => {
    it('returns the server list unchanged on success', async () => {
      const body = { items: [realCert], page: { nextCursor: null, hasMore: false } };
      global.fetch = respond(200, body);
      await expect(getMyCertifications()).resolves.toEqual(body);
    });

    it('returns an empty server list as empty (no demo certificates substituted)', async () => {
      const body = { items: [], page: { nextCursor: null, hasMore: false } };
      global.fetch = respond(200, body);
      const res = await getMyCertifications();
      expect(res.items).toEqual([]);
    });

    it('rejects with ApiError when the server returns 500', async () => {
      global.fetch = respond(500, problem500);
      await expect(getMyCertifications()).rejects.toBeInstanceOf(ApiError);
    });

    it('rejects with NetworkError when the network is unreachable', async () => {
      global.fetch = vi.fn(async () => {
        throw new TypeError('Network request failed');
      }) as unknown as typeof fetch;
      await expect(getMyCertifications()).rejects.toBeInstanceOf(NetworkError);
    });

    it('does not serve a previously-fetched list after a later failure', async () => {
      global.fetch = respond(200, { items: [realCert], page: { nextCursor: null, hasMore: false } });
      await getMyCertifications();
      global.fetch = respond(500, problem500);
      await expect(getMyCertifications()).rejects.toBeInstanceOf(ApiError);
    });
  });

  describe('createCertification()', () => {
    const input = {
      certType: 'NPOP' as const,
      certNumber: 'NPOP-1',
      issuingBody: 'Body',
      issuedOn: '2026-01-01',
      expiresOn: '2027-01-01',
    };

    it('POSTs to /farmers/me/certifications and returns the stored record', async () => {
      let url = '';
      let method = '';
      global.fetch = vi.fn(async (u: RequestInfo | URL, o?: RequestInit) => {
        url = String(u);
        method = o?.method ?? 'GET';
        return new Response(JSON.stringify(realCert), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }) as unknown as typeof fetch;
      await expect(createCertification(input)).resolves.toEqual(realCert);
      expect(url).toContain('/farmers/me/certifications');
      expect(method).toBe('POST');
    });

    it('rejects (never returns a locally fabricated certificate) when the server fails', async () => {
      global.fetch = respond(500, problem500);
      await expect(createCertification(input)).rejects.toBeInstanceOf(ApiError);
    });

    it('rejects when the network is unreachable', async () => {
      global.fetch = vi.fn(async () => {
        throw new TypeError('Network request failed');
      }) as unknown as typeof fetch;
      await expect(createCertification(input)).rejects.toBeInstanceOf(NetworkError);
    });
  });

  describe('getSystemConfig()', () => {
    it('requests GET /v1/config/farmer and returns the server value', async () => {
      let url = '';
      global.fetch = vi.fn(async (u: RequestInfo | URL) => {
        url = String(u);
        return new Response(JSON.stringify({ certExpiryWarningDays: 45 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }) as unknown as typeof fetch;
      // Each value falls back on its own: only the warning window came from
      // the server, so the two BR-48 windows take their documented defaults.
      await expect(getSystemConfig()).resolves.toEqual({
        certExpiryWarningDays: 45,
        certExpiryMaxPastDays: 365,
        certExpiryMaxFutureDays: 730,
      });
      expect(url).toContain('/v1/config/farmer');
    });

    it('falls back to the documented windows (30 / 365 / 730) and logs a warning when the lookup fails', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      global.fetch = respond(500, problem500);
      await expect(getSystemConfig()).resolves.toEqual({
        certExpiryWarningDays: 30,
        certExpiryMaxPastDays: 365,
        certExpiryMaxFutureDays: 730,
      });
      expect(warn).toHaveBeenCalled();
    });
  });
});
