import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { InMemoryBlobStorage, defaultBlobStorage } from './blobStorage.js';

/** The path + query of a URL minted for the local origin, which supertest requests against the app. */
function pathOf(url: string): string {
  const parsed = new URL(url);
  return `${parsed.pathname}${parsed.search}`;
}

describe('Local blob storage: signed read URLs (dev/test stand-in for a provider SAS)', () => {
  const storage = new InMemoryBlobStorage('http://localhost:3000', 'test-signing-secret-of-enough-length');

  it('BR-142d: storageKeyFromUrl recovers the key from this storage\'s own public URL, query and fragment ignored', () => {
    const key = 'certificate/3f1c2b7a-0000-4000-8000-000000000001.pdf';
    expect(storage.storageKeyFromUrl(storage.getPublicUrl(key))).toBe(key);
    expect(storage.storageKeyFromUrl(`${storage.getPublicUrl(key)}?expires=x#frag`)).toBe(key);
  });

  it('BR-142d: storageKeyFromUrl refuses a URL on another host, outside /storage/, empty or with a traversal segment', () => {
    expect(storage.storageKeyFromUrl('https://evil.example/storage/certificate/a.pdf')).toBeNull();
    expect(storage.storageKeyFromUrl('http://localhost:3000/v1/uploads/mock/certificate/a.pdf')).toBeNull();
    expect(storage.storageKeyFromUrl('http://localhost:3000/storage/')).toBeNull();
    expect(storage.storageKeyFromUrl('http://localhost:3000/storage/../secrets.txt')).toBeNull();
    expect(storage.storageKeyFromUrl('http://localhost:3000/storage/certificate/../../x.pdf')).toBeNull();
    expect(storage.storageKeyFromUrl('certificate/a.pdf')).toBeNull();
  });

  it('BR-142d: a read URL carries an expiry and a signature, and only that exact key + expiry verifies', async () => {
    const key = 'certificate/a.pdf';
    const url = new URL(await storage.generateReadUrl(key, 15));
    const expires = url.searchParams.get('expires') ?? '';
    const sig = url.searchParams.get('sig') ?? '';
    expect(expires).not.toBe('');
    expect(sig).toMatch(/^[0-9a-f]{64}$/);

    expect(storage.verifyReadSignature(key, expires, sig)).toBe(true);
    expect(storage.verifyReadSignature('certificate/b.pdf', expires, sig)).toBe(false);
    expect(storage.verifyReadSignature(key, new Date(Date.now() + 86_400_000).toISOString(), sig)).toBe(false);
    expect(storage.verifyReadSignature(key, expires, sig.replace(/^./, sig[0] === 'a' ? 'b' : 'a'))).toBe(false);
    expect(storage.verifyReadSignature(key, expires, '')).toBe(false);
  });

  it('BR-142d: an expired read URL does not verify', async () => {
    const key = 'certificate/a.pdf';
    const url = new URL(await storage.generateReadUrl(key, -1));
    expect(storage.verifyReadSignature(key, url.searchParams.get('expires') ?? '', url.searchParams.get('sig') ?? '')).toBe(false);
  });

  it('BR-142d: a URL signed with another secret does not verify', async () => {
    const other = new InMemoryBlobStorage('http://localhost:3000', 'a-different-secret-of-enough-length!');
    const url = new URL(await other.generateReadUrl('certificate/a.pdf', 15));
    expect(
      storage.verifyReadSignature('certificate/a.pdf', url.searchParams.get('expires') ?? '', url.searchParams.get('sig') ?? ''),
    ).toBe(false);
  });
});

describe('GET /storage/* (dev/test: serves what PUT /v1/uploads/mock/* stored, only on a valid signed read URL)', () => {
  const app = createApp();
  const pdf = Buffer.from('%PDF-1.4\nbr-142 certificate bytes\n');

  async function putPdf(): Promise<string> {
    const key = `certificate/br142-${Date.now()}-${Math.random().toString(16).slice(2)}.pdf`;
    const put = await request(app).put(`/v1/uploads/mock/${key}`).set('Content-Type', 'application/pdf').send(pdf);
    expect(put.status).toBe(201);
    return key;
  }

  it('BR-142d: a signed read URL returns the stored bytes with the type of the key\'s extension, never cached', async () => {
    const key = await putPdf();
    try {
      const res = await request(app)
        .get(pathOf(await defaultBlobStorage.generateReadUrl(key, 15)))
        .buffer(true)
        .parse((r, cb) => {
          const chunks: Buffer[] = [];
          r.on('data', (c: Buffer) => chunks.push(c));
          r.on('end', () => cb(null, Buffer.concat(chunks)));
        });
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/^application\/pdf/);
      expect(res.headers['cache-control']).toContain('no-store');
      expect((res.body as Buffer).equals(pdf)).toBe(true);
    } finally {
      await defaultBlobStorage.delete(key);
    }
  });

  it('BR-142d: the permanent public URL (no signature), a tampered signature, an expired URL and another key are all 404', async () => {
    const key = await putPdf();
    try {
      const signed = new URL(await defaultBlobStorage.generateReadUrl(key, 15));
      const expires = signed.searchParams.get('expires') ?? '';
      const sig = signed.searchParams.get('sig') ?? '';

      expect((await request(app).get(pathOf(defaultBlobStorage.getPublicUrl(key)))).status).toBe(404);
      expect((await request(app).get(`/storage/${key}?expires=${encodeURIComponent(expires)}`)).status).toBe(404);
      const tampered = sig.replace(/^./, sig[0] === 'a' ? 'b' : 'a');
      expect(
        (await request(app).get(`/storage/${key}?expires=${encodeURIComponent(expires)}&sig=${tampered}`)).status,
      ).toBe(404);
      expect((await request(app).get(pathOf(await defaultBlobStorage.generateReadUrl(key, -1)))).status).toBe(404);
      expect(
        (await request(app).get(`/storage/certificate/other.pdf?expires=${encodeURIComponent(expires)}&sig=${sig}`)).status,
      ).toBe(404);
    } finally {
      await defaultBlobStorage.delete(key);
    }
  });

  it('BR-142d: a validly signed URL for a key with no stored bytes is 404', async () => {
    const res = await request(app).get(
      pathOf(await defaultBlobStorage.generateReadUrl(`certificate/missing-${Date.now()}.pdf`, 15)),
    );
    expect(res.status).toBe(404);
  });

  it('BR-142d: a stored file whose extension is not a known document type is served as an attachment of application/octet-stream', async () => {
    const key = `certificate/br142-${Date.now()}.html`;
    await request(app).put(`/v1/uploads/mock/${key}`).set('Content-Type', 'text/html').send(Buffer.from('<script>x</script>'));
    try {
      const res = await request(app).get(pathOf(await defaultBlobStorage.generateReadUrl(key, 15)));
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/^application\/octet-stream/);
      expect(res.headers['content-disposition']).toMatch(/^attachment/);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    } finally {
      await defaultBlobStorage.delete(key);
    }
  });
});
