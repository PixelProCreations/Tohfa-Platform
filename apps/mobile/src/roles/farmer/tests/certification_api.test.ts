/**
 * Farmer certification API client (api/farmer.ts): create, edit (PATCH) and
 * delete, against a mocked fetch. Plain Node, no React.
 *
 * Contract under test (docs/openapi.yaml, apps/api/src/modules/certifications):
 *   POST   /v1/farmers/me/certifications        -> 201 Certification | 422 errors map
 *   PATCH  /v1/farmers/me/certifications/{id}   -> 200 Certification | 404 | 422   (BR-49)
 *   DELETE /v1/farmers/me/certifications/{id}   -> 204 No Content    | 404         (BR-50)
 * The client never answers for the server: a failed request throws and nothing
 * is recorded locally as saved.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  clearCertificationsCache,
  createCertification,
  deleteCertification,
  getCachedCertifications,
  getMyCertifications,
  updateCertification,
  uploadCertificateDocument,
  type Certification,
} from '../api/farmer';
import { ApiError, NetworkError, setAccessToken } from '../../../shell/api/client';
import { resetAllUploadSessions } from '../api/uploader';
import { certificationErrorKind } from '../screens/certifications/certificationForm';

interface Recorded {
  url: string;
  method: string;
  body: unknown;
}

function certification(overrides: Partial<Certification> = {}): Certification {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    certType: 'PGS',
    customTypeName: null,
    certNumber: 'PGS-1',
    issuingBody: 'Council',
    issuedOn: '2025-01-01',
    expiresOn: '2027-01-01',
    documentUrl: null,
    verificationStatus: 'UNVERIFIED',
    daysToExpiry: 300,
    blocksListings: true,
    ...overrides,
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function problem(status: number, code: string, extra: Record<string, unknown> = {}): Response {
  return new Response(
    JSON.stringify({ type: 'about:blank', title: 'Problem', status, code, ...extra }),
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

function record(responder: (call: Recorded) => Response | Promise<Response>): Recorded[] {
  const calls: Recorded[] = [];
  global.fetch = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const call: Recorded = {
      url: String(url),
      method: init?.method ?? 'GET',
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : init?.body,
    };
    calls.push(call);
    return responder(call);
  }) as typeof fetch;
  return calls;
}

const ID = '11111111-1111-4111-8111-111111111111';

describe('createCertification', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setAccessToken('token-farmer-a');
  });
  afterEach(() => setAccessToken(null));

  it('BR-48i: sends customTypeName for OTHER, exactly as given, to POST /v1/farmers/me/certifications', async () => {
    const calls = record(() =>
      json(certification({ certType: 'OTHER', customTypeName: 'Fair Trade', blocksListings: true }), 201),
    );
    const created = await createCertification({
      certType: 'OTHER',
      customTypeName: 'Fair Trade',
      certNumber: 'FT-1',
      issuingBody: 'Fairtrade International',
      issuedOn: '2025-01-01',
      expiresOn: '2027-01-01',
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.method).toBe('POST');
    expect(calls[0]!.url).toContain('/v1/farmers/me/certifications');
    expect(calls[0]!.body).toMatchObject({ certType: 'OTHER', customTypeName: 'Fair Trade' });
    expect(created.customTypeName).toBe('Fair Trade');
  });

  it('BR-48i: a PGS request carries no customTypeName key at all', async () => {
    const calls = record(() => json(certification(), 201));
    await createCertification({
      certType: 'PGS',
      certNumber: 'PGS-1',
      issuingBody: 'Council',
      issuedOn: '2025-01-01',
      expiresOn: '2027-01-01',
    });
    expect(calls[0]!.body).not.toHaveProperty('customTypeName');
  });

  it('BR-02: when the server cannot be reached it throws -- no certificate is fabricated or kept locally', async () => {
    global.fetch = vi.fn(async () => {
      throw new TypeError('Network request failed');
    }) as typeof fetch;

    await expect(
      createCertification({
        certType: 'PGS',
        certNumber: 'PGS-OFFLINE-1',
        issuingBody: 'Council',
        issuedOn: '2025-01-01',
        expiresOn: '2027-01-01',
      }),
    ).rejects.toBeInstanceOf(NetworkError);

    // Nothing was recorded as saved: the redisplay cache has no such row.
    expect(getCachedCertifications().some((c) => c.certNumber === 'PGS-OFFLINE-1')).toBe(false);
  });

  it('BR-48: a server 422 propagates as an ApiError carrying the errors map', async () => {
    const errors = { 'body.customTypeName': ['Required'], 'body.expiresOn': ['Too far in the future'] };
    record(() => problem(422, 'VALIDATION_FAILED', { errors }));
    const attempt = createCertification({
      certType: 'OTHER',
      certNumber: 'X',
      issuingBody: 'Y',
      issuedOn: '2025-01-01',
      expiresOn: '2030-01-01',
    });
    await expect(attempt).rejects.toBeInstanceOf(ApiError);
    await attempt.catch((err: unknown) => expect((err as ApiError).problem.errors).toEqual(errors));
  });
});

describe('updateCertification (PATCH)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setAccessToken('token-farmer-a');
  });
  afterEach(() => setAccessToken(null));

  it('BR-49: PATCHes /v1/farmers/me/certifications/{id} with exactly the fields given and returns the updated certificate', async () => {
    const calls = record(() => json(certification({ certNumber: 'PGS-2', verificationStatus: 'UNVERIFIED' })));
    const updated = await updateCertification(ID, { certNumber: 'PGS-2' });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.method).toBe('PATCH');
    expect(calls[0]!.url).toContain(`/v1/farmers/me/certifications/${ID}`);
    expect(calls[0]!.body).toEqual({ certNumber: 'PGS-2' });
    expect(updated.certNumber).toBe('PGS-2');
  });

  it('BR-49: the returned status is what the caller sees -- a previously VERIFIED certificate comes back UNVERIFIED', async () => {
    record(() => json(certification({ expiresOn: '2027-06-01', verificationStatus: 'UNVERIFIED', blocksListings: true })));
    const updated = await updateCertification(ID, { expiresOn: '2027-06-01' });
    expect(updated.verificationStatus).toBe('UNVERIFIED');
  });

  it('BR-49: sends customTypeName: null when moving away from OTHER (explicit null, not omitted)', async () => {
    const calls = record(() => json(certification({ certType: 'NPOP' })));
    await updateCertification(ID, { certType: 'NPOP', customTypeName: null });
    expect(calls[0]!.body).toEqual({ certType: 'NPOP', customTypeName: null });
  });

  it('BR-49: a 404 propagates as an ApiError (unknown, not yours, or already deleted)', async () => {
    record(() => problem(404, 'NOT_FOUND'));
    const attempt = updateCertification(ID, { certNumber: 'X' });
    await expect(attempt).rejects.toBeInstanceOf(ApiError);
    await attempt.catch((err: unknown) => expect((err as ApiError).problem.status).toBe(404));
  });

  it('BR-48: a 422 propagates with its errors map', async () => {
    const errors = { 'body.expiresOn': ['Must be on or before 2028-04-05'] };
    record(() => problem(422, 'VALIDATION_FAILED', { errors }));
    const attempt = updateCertification(ID, { expiresOn: '2030-01-01' });
    await expect(attempt).rejects.toBeInstanceOf(ApiError);
    await attempt.catch((err: unknown) => expect((err as ApiError).problem.errors).toEqual(errors));
  });

  it('a network failure propagates as a NetworkError', async () => {
    global.fetch = vi.fn(async () => {
      throw new TypeError('Network request failed');
    }) as typeof fetch;
    await expect(updateCertification(ID, { certNumber: 'X' })).rejects.toBeInstanceOf(NetworkError);
  });
});

describe('deleteCertification (DELETE)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setAccessToken('token-farmer-a');
  });
  afterEach(() => setAccessToken(null));

  it('BR-50: DELETEs /v1/farmers/me/certifications/{id} and resolves on 204 No Content (no body to parse)', async () => {
    const calls = record(() => new Response(null, { status: 204 }));
    await expect(deleteCertification(ID)).resolves.toBeUndefined();
    expect(calls).toHaveLength(1);
    expect(calls[0]!.method).toBe('DELETE');
    expect(calls[0]!.url).toContain(`/v1/farmers/me/certifications/${ID}`);
    expect(calls[0]!.body).toBeUndefined();
  });

  it('BR-50: a 404 (unknown / not yours / already deleted) propagates as an ApiError', async () => {
    record(() => problem(404, 'NOT_FOUND'));
    const attempt = deleteCertification(ID);
    await expect(attempt).rejects.toBeInstanceOf(ApiError);
    await attempt.catch((err: unknown) => expect((err as ApiError).problem.status).toBe(404));
  });

  it('BR-50: a deleted certificate no longer comes back from the redisplay cache', async () => {
    // Load a list through the cache and delete one row: the cache the screens
    // redisplay from must not resurrect the deleted certificate.
    const keep = certification({ id: '22222222-2222-4222-8222-222222222222', certNumber: 'KEEP' });
    const gone = certification({ certNumber: 'GONE' });
    record(() => json({ items: [keep, gone], page: { nextCursor: null, hasMore: false } }));
    await getMyCertifications();

    record(() => new Response(null, { status: 204 }));
    await deleteCertification(gone.id);

    expect(getCachedCertifications().map((c) => c.certNumber)).toEqual(['KEEP']);
  });

  it('BR-49: an edited certificate replaces its cached copy (so a stale VERIFIED row is not shown)', async () => {
    const verified = certification({ verificationStatus: 'VERIFIED', blocksListings: false });
    record(() => json({ items: [verified], page: { nextCursor: null, hasMore: false } }));
    await getMyCertifications();

    record(() => json(certification({ certNumber: 'PGS-9', verificationStatus: 'UNVERIFIED', blocksListings: true })));
    await updateCertification(verified.id, { certNumber: 'PGS-9' });

    const items = getCachedCertifications();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ certNumber: 'PGS-9', verificationStatus: 'UNVERIFIED' });
  });
});

describe('uploadCertificateDocument', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetAllUploadSessions();
    setAccessToken('token-farmer-a');
  });
  afterEach(() => setAccessToken(null));

  it('signs a CERTIFICATE upload through POST /v1/uploads/sign, PUTs the bytes, and returns the signed fileUrl for documentUrl', async () => {
    const calls: Recorded[] = [];
    global.fetch = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const u = String(url);
      calls.push({
        url: u,
        method: init?.method ?? 'GET',
        body: typeof init?.body === 'string' ? JSON.parse(init.body) : init?.body,
      });
      if (u.startsWith('file://')) return new Response(new Uint8Array([1, 2, 3, 4]));
      if (u.endsWith('/v1/uploads/sign')) {
        return json(
          {
            uploadUrl: 'https://blob.example/up/abc',
            fileUrl: 'https://blob.example/files/abc.pdf',
            storageKey: 'abc',
            method: 'PUT',
            headers: { 'x-ms-blob-type': 'BlockBlob' },
            expiresAt: '2026-10-05T10:00:00.000Z',
            resumable: false,
          },
          201,
        );
      }
      return new Response(null, { status: 201 });
    }) as typeof fetch;

    const result = await uploadCertificateDocument({
      uri: 'file:///cache/cert.pdf',
      fileName: 'cert.pdf',
      contentType: 'application/pdf',
    });

    expect(result).toEqual({ fileUrl: 'https://blob.example/files/abc.pdf' });
    const sign = calls.find((c) => c.url.endsWith('/v1/uploads/sign'))!;
    expect(sign.method).toBe('POST');
    expect(sign.body).toEqual({ purpose: 'CERTIFICATE', fileName: 'cert.pdf', contentType: 'application/pdf', sizeBytes: 4 });
    const put = calls.find((c) => c.url === 'https://blob.example/up/abc')!;
    expect(put.method).toBe('PUT');
  });

  it('an upload failure throws instead of attaching anything', async () => {
    global.fetch = vi.fn(async (url: RequestInfo | URL) => {
      if (String(url).startsWith('file://')) return new Response(new Uint8Array([1]));
      return problem(500, 'INTERNAL');
    }) as typeof fetch;
    await expect(
      uploadCertificateDocument({ uri: 'file:///cache/cert.pdf', fileName: 'cert.pdf', contentType: 'application/pdf' }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

describe('getMyCertifications: real server data only, failures surface (no demo certificates)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearCertificationsCache();
    setAccessToken('token-farmer-a');
  });
  afterEach(() => setAccessToken(null));

  it('BR-02: the certificate cache is empty at start -- no fabricated certificates', async () => {
    vi.resetModules();
    const fresh = await import('../api/farmer');
    expect(fresh.getCachedCertifications()).toEqual([]);
  });

  it('BR-02: an API failure throws an ApiError instead of returning demo certificates', async () => {
    record(() => problem(500, 'INTERNAL'));
    const attempt = getMyCertifications();
    await expect(attempt).rejects.toBeInstanceOf(ApiError);
    await attempt.catch((err: unknown) => expect((err as ApiError).problem.status).toBe(500));
    expect(getCachedCertifications()).toEqual([]);
  });

  it('BR-02: an unreachable network throws a NetworkError instead of returning demo certificates', async () => {
    global.fetch = vi.fn(async () => {
      throw new TypeError('Network request failed');
    }) as typeof fetch;
    await expect(getMyCertifications()).rejects.toBeInstanceOf(NetworkError);
    expect(getCachedCertifications()).toEqual([]);
  });

  it('BR-02: a failure after a good load keeps the cache but the call still throws', async () => {
    const cert = certification({ certNumber: 'REAL-1' });
    record(() => json({ items: [cert], page: { nextCursor: null, hasMore: false } }));
    expect((await getMyCertifications()).items).toEqual([cert]);
    expect(getCachedCertifications()).toEqual([cert]);

    record(() => problem(503, 'UNAVAILABLE'));
    await expect(getMyCertifications()).rejects.toBeInstanceOf(ApiError);
    expect(getCachedCertifications()).toEqual([cert]);
  });

  it('a farmer with no certificates gets an empty list (an empty state, not demo data)', async () => {
    record(() => json({ items: [], page: { nextCursor: null, hasMore: false } }));
    const res = await getMyCertifications();
    expect(res.items).toEqual([]);
    expect(getCachedCertifications()).toEqual([]);
  });

  it('a malformed 200 body (no items array) is an error, not an empty or demo list', async () => {
    record(() => json({ unexpected: true }));
    await expect(getMyCertifications()).rejects.toBeInstanceOf(Error);
    expect(getCachedCertifications()).toEqual([]);
  });

  it('a malformed 200 body throws a typed ApiError (not a plain Error) that the screens classify as "other"', async () => {
    for (const body of [{ unexpected: true }, null, { items: 'nope' }]) {
      record(() => json(body));
      const err = await getMyCertifications().then(
        () => null,
        (e: unknown) => e,
      );
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).is('INTERNAL')).toBe(true);
      // CertificationsScreen hands this to ErrorState / certificationErrorKind; it must not
      // be mistaken for an offline or a not-found condition.
      expect(certificationErrorKind(err)).toBe('other');
      expect((err as Error).name).toBe('ApiError');
    }
    expect(getCachedCertifications()).toEqual([]);
  });

  it('BR-02: a malformed 200 after a good load leaves the cached list untouched', async () => {
    const cert = certification({ certNumber: 'REAL-2' });
    record(() => json({ items: [cert], page: { nextCursor: null, hasMore: false } }));
    await getMyCertifications();
    record(() => json({ unexpected: true }));
    await expect(getMyCertifications()).rejects.toBeInstanceOf(ApiError);
    expect(getCachedCertifications()).toEqual([cert]);
  });

  it('a mutation made before any list was loaded does not turn into a partial cached list', async () => {
    record(() => json(certification({ certNumber: 'FRESH' }), 201));
    await createCertification({
      certType: 'PGS',
      certNumber: 'FRESH',
      issuingBody: 'Council',
      issuedOn: '2025-01-01',
      expiresOn: '2027-01-01',
    });
    expect(getCachedCertifications()).toEqual([]);
  });

  it('only a complete first page is cached: a list with more pages, or a later page, never replaces the cache with a fragment', async () => {
    const a = certification({ certNumber: 'A' });
    record(() => json({ items: [a], page: { nextCursor: 'c2', hasMore: true } }));
    await getMyCertifications();
    expect(getCachedCertifications()).toEqual([]);

    record(() => json({ items: [a], page: { nextCursor: null, hasMore: false } }));
    await getMyCertifications();
    expect(getCachedCertifications()).toEqual([a]);

    record(() => json({ items: [certification({ certNumber: 'P2' })], page: { nextCursor: null, hasMore: false } }));
    await getMyCertifications('c2');
    expect(getCachedCertifications()).toEqual([a]);
  });

  it('the cache is cleared on demand (sign-out) and a returned copy cannot mutate it', async () => {
    const a = certification({ certNumber: 'A' });
    record(() => json({ items: [a], page: { nextCursor: null, hasMore: false } }));
    await getMyCertifications();
    getCachedCertifications().pop();
    expect(getCachedCertifications()).toEqual([a]);
    clearCertificationsCache();
    expect(getCachedCertifications()).toEqual([]);
  });
});

describe('api/farmer.ts source: no fabricated certificates remain', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../api/farmer.ts'), 'utf8');

  it('contains no demo certificate ids, demo storage URLs or DEFAULT_CERTIFICATIONS', () => {
    expect(source).not.toContain('storage.tohfa.in');
    expect(source).not.toContain('cert-pgs-001');
    expect(source).not.toContain('cert-npop-002');
    expect(source).not.toContain('DEFAULT_CERTIFICATIONS');
  });

  it('the certification screens do not reference demo data either', () => {
    for (const file of [
      '../screens/certifications/CertificationsScreen.tsx',
      '../screens/profile/ProfileScreen.tsx',
    ]) {
      const text = fs.readFileSync(path.resolve(__dirname, file), 'utf8');
      expect(text, file).not.toContain('DEFAULT_CERTIFICATIONS');
      expect(text, file).not.toContain('cert-pgs-001');
      expect(text, file).not.toContain("t('error.generic')");
    }
  });
});
