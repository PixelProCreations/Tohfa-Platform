/**
 * Regression test for the Android-emulator localhost fallback added to
 * `uploadWithResume` (apps/mobile/src/roles/farmer/api/uploader.ts).
 *
 * Bug this guards against: a signed upload URL from POST /uploads/sign can
 * legitimately say `http://localhost:3000/...` in dev (see
 * apps/api/src/storage/blobStorage.ts's LocalDiskBlobStorage docblock). On an
 * Android emulator, `localhost` means the emulator itself, not the dev
 * machine running the API, so the raw byte PUT this function issues fails
 * with RN's generic "Network request failed" -- even though
 * shell/api/client.ts's request() already has a working `10.0.2.2` fallback
 * for JSON calls, because uploader.ts's fetch never went through
 * request() at all.
 *
 * This file overrides the global `react-native` mock (src/tests/setup.ts,
 * which defaults Platform.OS to 'ios') with Platform.OS: 'android', since
 * that override is what this fallback is conditioned on. Only `Platform` is
 * stubbed because uploader.ts (via shell/api/client.ts) is the only bit of
 * the module graph this test exercises, and that graph imports nothing else
 * from 'react-native'.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('react-native', () => ({
  Platform: { OS: 'android', select: (obj: Record<string, unknown>) => obj.android ?? obj.default },
}));

import { uploadWithResume, resetAllUploadSessions } from '../api/uploader';

describe('uploadWithResume: Android emulator localhost fallback', () => {
  beforeEach(() => {
    resetAllUploadSessions();
    vi.restoreAllMocks();
  });

  it('retries a chunk against 10.0.2.2 when the signed localhost URL fails at the network layer, and reuses it for later chunks without re-attempting localhost', async () => {
    const calls: string[] = [];

    global.fetch = vi.fn(async (url: RequestInfo | URL) => {
      const urlStr = String(url);
      calls.push(urlStr);
      if (urlStr.includes('localhost')) {
        // Simulate RN's fetch throwing at the network layer -- not an HTTP
        // error response -- exactly what an unreachable localhost produces
        // on an Android emulator.
        throw new TypeError('Network request failed');
      }
      if (urlStr.includes('10.0.2.2')) {
        return new Response(null, { status: 200 });
      }
      throw new Error(`Unexpected URL in test: ${urlStr}`);
    });

    // Two chunks: chunkSize smaller than the payload, so the loop runs twice
    // and we can assert the second chunk skips the localhost attempt.
    const data = new Uint8Array(20).fill(1);
    const result = await uploadWithResume({
      uploadUrl: 'http://localhost:3000/uploads/blob/abc',
      fileUrl: 'http://localhost:3000/uploads/blob/abc',
      data,
      contentType: 'application/octet-stream',
      chunkSize: 10,
    });

    expect(result.totalBytes).toBe(20);

    const localhostAttempts = calls.filter((c) => c.includes('localhost'));
    const fallbackAttempts = calls.filter((c) => c.includes('10.0.2.2'));

    // Exactly one localhost attempt across the whole call (the first chunk's
    // first try) -- the second chunk must go straight to 10.0.2.2.
    expect(localhostAttempts).toHaveLength(1);
    expect(fallbackAttempts).toHaveLength(2);
  });

  it('propagates the original error when the fallback also fails, without looping', async () => {
    global.fetch = vi.fn(async (url: RequestInfo | URL) => {
      throw new TypeError(`Network request failed: ${String(url)}`);
    });

    await expect(
      uploadWithResume({
        uploadUrl: 'http://localhost:3000/uploads/blob/def',
        fileUrl: 'http://localhost:3000/uploads/blob/def',
        data: new Uint8Array(5),
        contentType: 'application/octet-stream',
      }),
    ).rejects.toThrow('Network request failed');

    expect(global.fetch).toHaveBeenCalledTimes(2); // localhost, then 10.0.2.2 -- no further retries
  });

  it('does not touch non-localhost signed URLs (e.g. real Azure targets in prod)', async () => {
    global.fetch = vi.fn(async () => new Response(null, { status: 200 }));

    await uploadWithResume({
      uploadUrl: 'https://tohfaprod.blob.core.windows.net/uploads/abc?sig=xyz',
      fileUrl: 'https://tohfaprod.blob.core.windows.net/uploads/abc',
      data: new Uint8Array(5),
      contentType: 'application/octet-stream',
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
