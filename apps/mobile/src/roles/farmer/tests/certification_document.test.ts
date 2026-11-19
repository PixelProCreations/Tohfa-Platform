import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createKeychainMock } from '../../../tests/mocks/keychainMock';

// api/farmer.ts -> shell/api/client.ts -> tokenStorage imports react-native-keychain (same mock and
// reason as certifications_api.test.ts).
vi.mock('react-native-keychain', () => createKeychainMock());

import { getCertificationDocumentReadUrl } from '../api/farmer';
import { resolveCertificateDocument } from '../screens/certifications/certificateDocument';
import { ApiError, NetworkError, setAccessToken } from '../../../shell/api/client';

const CERT_ID = '0b6f2c1e-1111-4222-8333-444455556666';
const SIGNED = 'http://localhost:3000/storage/certificate/a.pdf?expires=2026-11-11T07%3A15%3A00.000Z&sig=' + 'a'.repeat(64);

function respond(status: number, body: unknown): typeof fetch {
  return vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' },
    }),
  ) as unknown as typeof fetch;
}

const problem = (status: number, code: string) => ({ type: 'about:blank', title: code, status, code });

describe('BR-142f: viewing a certificate fetches a fresh signed read URL', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setAccessToken(null);
  });
  afterEach(() => setAccessToken(null));

  it('BR-142f: getCertificationDocumentReadUrl calls GET /farmers/me/certifications/{id}/document and returns readUrl and expiresAt', async () => {
    const fetchMock = respond(200, { readUrl: SIGNED, expiresAt: '2026-11-11T07:15:00.000Z' });
    global.fetch = fetchMock;

    await expect(getCertificationDocumentReadUrl(CERT_ID)).resolves.toEqual({
      readUrl: SIGNED,
      expiresAt: '2026-11-11T07:15:00.000Z',
    });
    const [url, init] = (fetchMock as unknown as { mock: { calls: [string, RequestInit | undefined][] } }).mock.calls[0]!;
    expect(String(url)).toMatch(new RegExp(`/farmers/me/certifications/${CERT_ID}/document$`));
    expect((init?.method ?? 'GET').toUpperCase()).toBe('GET');
  });

  it('BR-142f: a 200 without a usable http(s) readUrl is an ApiError, never a URL handed to the viewer', async () => {
    for (const body of [{}, { readUrl: '' }, { readUrl: 'javascript:alert(1)', expiresAt: 'x' }, null]) {
      global.fetch = respond(200, body);
      await expect(getCertificationDocumentReadUrl(CERT_ID)).rejects.toBeInstanceOf(ApiError);
    }
  });

  it('BR-142f: each View asks the server again (no cached signed URL)', async () => {
    const fetchMock = respond(200, { readUrl: SIGNED, expiresAt: '2026-11-11T07:15:00.000Z' });
    global.fetch = fetchMock;
    await getCertificationDocumentReadUrl(CERT_ID);
    await getCertificationDocumentReadUrl(CERT_ID);
    expect((fetchMock as unknown as { mock: { calls: unknown[] } }).mock.calls).toHaveLength(2);
  });

  it('BR-142f: resolveCertificateDocument opens the signed URL on success', async () => {
    const outcome = await resolveCertificateDocument(CERT_ID, async () => ({ readUrl: SIGNED, expiresAt: 'x' }));
    expect(outcome).toEqual({ kind: 'open', url: SIGNED });
  });

  it('BR-142f: a 404 (no document, deleted, not yours) resolves to the no-document outcome', async () => {
    global.fetch = respond(404, problem(404, 'NOT_FOUND'));
    const outcome = await resolveCertificateDocument(CERT_ID);
    expect(outcome).toEqual({ kind: 'noDocument' });
  });

  it('BR-142f: a server error or no network resolves to failed, carrying the error but never a URL', async () => {
    global.fetch = respond(500, problem(500, 'INTERNAL'));
    const serverFailure = await resolveCertificateDocument(CERT_ID);
    expect(serverFailure.kind).toBe('failed');
    expect(serverFailure.kind === 'failed' && serverFailure.error).toBeInstanceOf(ApiError);

    global.fetch = vi.fn(async () => {
      throw new TypeError('Network request failed');
    }) as unknown as typeof fetch;
    const offline = await resolveCertificateDocument(CERT_ID);
    expect(offline.kind === 'failed' && offline.error).toBeInstanceOf(NetworkError);
    expect(JSON.stringify(offline)).not.toContain('http');
  });

  it('BR-142f: an aborted request resolves to cancelled, so the screen shows nothing', async () => {
    const controller = new AbortController();
    controller.abort();
    const outcome = await resolveCertificateDocument(
      CERT_ID,
      async () => {
        throw new Error('aborted');
      },
      controller.signal,
    );
    expect(outcome).toEqual({ kind: 'cancelled' });
  });
});
