import {
  BlobSASPermissions,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { LOCAL_UPLOADS_DIR } from '../paths.js';

export interface SignedUploadTarget {
  uploadUrl: string;
  fileUrl: string;
  storageKey: string;
  method: 'PUT' | 'POST';
  headers: Record<string, string>;
  expiresAt: string;
  resumable: boolean;
}

export interface GenerateUploadOptions {
  key: string;
  contentType: string;
  sizeBytes: number;
  expiresInMinutes?: number;
  purpose: string;
}

export interface BlobStorage {
  generateUploadTarget(options: GenerateUploadOptions): Promise<SignedUploadTarget>;
  generateReadUrl(key: string, expiresInMinutes?: number): Promise<string>;
  getPublicUrl(key: string): string;
  /**
   * The inverse of `getPublicUrl`: the storage key when `url` is THIS storage's
   * permanent URL for a key, else null (another host, another path, an empty
   * key, a `..` segment). Query and fragment are ignored. Used to turn a
   * client-supplied `documentUrl` back into a key that can be signed (BR-142);
   * it proves only where the URL points, never whose file it is.
   */
  storageKeyFromUrl(url: string): string | null;
  upload(key: string, data: Buffer, contentType: string): Promise<string>;
  download(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
}

/**
 * A storage whose files THIS API serves itself (dev/test only), at
 * `GET /storage/<key>?expires=..&sig=..` (storage.routes.ts). A real provider
 * (Azure) verifies its own SAS and never implements this.
 */
export interface LocallyServedBlobStorage extends BlobStorage {
  /** True only for an unexpired `expires` and the signature this storage minted for exactly `key` + `expires`. */
  verifyReadSignature(key: string, expires: string, sig: string): boolean;
}

export function isLocallyServed(storage: BlobStorage): storage is LocallyServedBlobStorage {
  return typeof (storage as Partial<LocallyServedBlobStorage>).verifyReadSignature === 'function';
}

/** Recovers a key from `<prefix><key>[?query][#fragment]`; null for anything else (BR-142d). */
function keyAfterPrefix(url: string, prefix: string): string | null {
  if (!url.startsWith(prefix)) return null;
  const key = url.slice(prefix.length).split(/[?#]/, 1)[0] ?? '';
  if (key.length === 0) return null;
  const segments = key.split('/');
  if (segments.some((s) => s === '' || s === '.' || s === '..' || s.includes('\\'))) return null;
  return key;
}

/**
 * The local stand-in for a provider's read SAS (BR-142d). Before this, a local
 * read URL was `/storage/<key>?expires=<iso>` -- an expiry nothing checked and
 * no route served -- so a certificate's View button always 404ed in dev. The
 * HMAC binds the key and the expiry, so the URL cannot be re-pointed at
 * another file or extended; `blob-read` separates it from every other HMAC
 * made with the same secret.
 */
function localReadSignature(secret: string, key: string, expires: string): string {
  return createHmac('sha256', secret).update(`blob-read\n${key}\n${expires}`).digest('hex');
}

function verifyLocalReadSignature(secret: string, key: string, expires: string, sig: string): boolean {
  const expiresAt = Date.parse(expires);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;
  if (!/^[0-9a-f]{64}$/.test(sig)) return false;
  const expected = Buffer.from(localReadSignature(secret, key, expires), 'hex');
  return timingSafeEqual(expected, Buffer.from(sig, 'hex'));
}

function localReadUrl(baseUrl: string, secret: string, key: string, expiresInMinutes: number): string {
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();
  const sig = localReadSignature(secret, key, expiresAt);
  return `${baseUrl}/storage/${key}?expires=${encodeURIComponent(expiresAt)}&sig=${sig}`;
}

export class InMemoryBlobStorage implements LocallyServedBlobStorage {
  private readonly store = new Map<string, { data: Buffer; contentType: string }>();
  private readonly baseUrl: string;
  private readonly signingSecret: string;

  constructor(baseUrl = 'http://localhost:3000', signingSecret = config.JWT_SECRET) {
    this.baseUrl = baseUrl;
    this.signingSecret = signingSecret;
  }

  async generateUploadTarget(options: GenerateUploadOptions): Promise<SignedUploadTarget> {
    const expiresAt = new Date(Date.now() + (options.expiresInMinutes ?? 15) * 60 * 1000).toISOString();
    return {
      uploadUrl: `${this.baseUrl}/v1/uploads/mock/${options.key}`,
      fileUrl: this.getPublicUrl(options.key),
      storageKey: options.key,
      method: 'PUT',
      headers: {
        'Content-Type': options.contentType,
        'x-ms-blob-type': 'BlockBlob',
      },
      expiresAt,
      resumable: false,
    };
  }

  getPublicUrl(key: string): string {
    return `${this.baseUrl}/storage/${key}`;
  }

  storageKeyFromUrl(url: string): string | null {
    return keyAfterPrefix(url, `${this.baseUrl}/storage/`);
  }

  async generateReadUrl(key: string, expiresInMinutes = 15): Promise<string> {
    return localReadUrl(this.baseUrl, this.signingSecret, key, expiresInMinutes);
  }

  verifyReadSignature(key: string, expires: string, sig: string): boolean {
    return verifyLocalReadSignature(this.signingSecret, key, expires, sig);
  }

  async upload(key: string, data: Buffer, contentType: string): Promise<string> {
    this.store.set(key, { data, contentType });
    return this.getPublicUrl(key);
  }

  async download(key: string): Promise<Buffer | null> {
    return this.store.get(key)?.data ?? null;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

/**
 * Disk-backed stand-in for blob storage in local dev.
 *
 * `InMemoryBlobStorage` above stores bytes in a JS `Map`, which is wiped on
 * every restart of the dev API process (tsx --watch reloads on every save,
 * same as a real crash/redeploy would) -- a farmer's "successfully" uploaded
 * registration document would silently vanish. Writing to real files under
 * `LOCAL_UPLOADS_DIR` survives that restart the same way a real Azure blob
 * would, without needing Azure credentials in local dev. Only the dev
 * fallback changes; staging/production always use `AzureBlobStorage` the
 * moment `AZURE_STORAGE_CONNECTION_STRING` is set.
 */
export class LocalDiskBlobStorage implements LocallyServedBlobStorage {
  private readonly baseUrl: string;
  private readonly rootDir: string;
  private readonly signingSecret: string;

  constructor(baseUrl = 'http://localhost:3000', rootDir = LOCAL_UPLOADS_DIR, signingSecret = config.JWT_SECRET) {
    this.baseUrl = baseUrl;
    this.rootDir = path.resolve(rootDir);
    this.signingSecret = signingSecret;
  }

  /**
   * Resolves `key` to an absolute path under `rootDir`, refusing anything
   * that would resolve outside of it (e.g. a `..`-laden key). Keys are
   * server-generated UUIDs today (see uploads.service.ts's `signUploadForOwner`),
   * never attacker-controlled, but this is what stores farmer document bytes
   * on disk, so it does not lean on that invariant alone.
   */
  private resolvePath(key: string): string {
    const resolved = path.resolve(this.rootDir, key);
    const rootPrefix = this.rootDir.endsWith(path.sep) ? this.rootDir : `${this.rootDir}${path.sep}`;
    if (resolved !== this.rootDir && !resolved.startsWith(rootPrefix)) {
      throw new Error(`Refusing to store blob outside of the local upload root: ${key}`);
    }
    return resolved;
  }

  async generateUploadTarget(options: GenerateUploadOptions): Promise<SignedUploadTarget> {
    const expiresAt = new Date(Date.now() + (options.expiresInMinutes ?? 15) * 60 * 1000).toISOString();
    return {
      uploadUrl: `${this.baseUrl}/v1/uploads/mock/${options.key}`,
      fileUrl: this.getPublicUrl(options.key),
      storageKey: options.key,
      method: 'PUT',
      headers: {
        'Content-Type': options.contentType,
        'x-ms-blob-type': 'BlockBlob',
      },
      expiresAt,
      resumable: false,
    };
  }

  getPublicUrl(key: string): string {
    return `${this.baseUrl}/storage/${key}`;
  }

  storageKeyFromUrl(url: string): string | null {
    return keyAfterPrefix(url, `${this.baseUrl}/storage/`);
  }

  async generateReadUrl(key: string, expiresInMinutes = 15): Promise<string> {
    return localReadUrl(this.baseUrl, this.signingSecret, key, expiresInMinutes);
  }

  verifyReadSignature(key: string, expires: string, sig: string): boolean {
    return verifyLocalReadSignature(this.signingSecret, key, expires, sig);
  }

  async upload(key: string, data: Buffer, _contentType: string): Promise<string> {
    const fullPath = this.resolvePath(key);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, data);
    return this.getPublicUrl(key);
  }

  async download(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.resolvePath(key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await rm(this.resolvePath(key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }
}

export class AzureBlobStorage implements BlobStorage {
  private readonly client: BlobServiceClient;
  private readonly containerName: string;

  constructor(connectionString: string, containerName = config.AZURE_BLOB_CONTAINER) {
    this.client = BlobServiceClient.fromConnectionString(connectionString);
    this.containerName = containerName;
  }

  async generateUploadTarget(options: GenerateUploadOptions): Promise<SignedUploadTarget> {
    const containerClient = this.client.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(options.key);

    const expiresOn = new Date(Date.now() + (options.expiresInMinutes ?? 15) * 60 * 1000);
    const permissions = BlobSASPermissions.parse('w'); // write-only permission

    // Derive SAS from connection string credentials
    const sasToken = await this.generateSasToken(options.key, permissions, expiresOn);
    const uploadUrl = `${blockBlobClient.url}?${sasToken}`;
    const fileUrl = this.getPublicUrl(options.key);

    return {
      uploadUrl,
      fileUrl,
      storageKey: options.key,
      method: 'PUT',
      headers: {
        'Content-Type': options.contentType,
        'x-ms-blob-type': 'BlockBlob',
      },
      expiresAt: expiresOn.toISOString(),
      resumable: false,
    };
  }

  getPublicUrl(key: string): string {
    const containerClient = this.client.getContainerClient(this.containerName);
    return containerClient.getBlockBlobClient(key).url;
  }

  storageKeyFromUrl(url: string): string | null {
    const containerUrl = this.client.getContainerClient(this.containerName).url.replace(/\/+$/, '');
    const key = keyAfterPrefix(url, `${containerUrl}/`);
    if (key === null) return null;
    try {
      // The SDK percent-encodes each path segment of a blob URL.
      // Re-checked after decoding, so an encoded `..` is refused too.
      return keyAfterPrefix(decodeURIComponent(key), '');
    } catch {
      return null;
    }
  }

  async generateReadUrl(key: string, expiresInMinutes = 15): Promise<string> {
    const containerClient = this.client.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(key);
    const expiresOn = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    const permissions = BlobSASPermissions.parse('r');
    const sasToken = await this.generateSasToken(key, permissions, expiresOn);
    return sasToken ? `${blockBlobClient.url}?${sasToken}` : blockBlobClient.url;
  }

  async upload(key: string, data: Buffer, contentType: string): Promise<string> {
    const containerClient = this.client.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(key);
    await blockBlobClient.upload(data, data.length, {
      blobHTTPHeaders: { blobContentType: contentType },
    });
    return blockBlobClient.url;
  }

  async download(key: string): Promise<Buffer | null> {
    const containerClient = this.client.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(key);
    try {
      const downloadResponse = await blockBlobClient.downloadToBuffer();
      return downloadResponse;
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    const containerClient = this.client.getContainerClient(this.containerName);
    await containerClient.deleteBlob(key);
  }

  private async generateSasToken(
    blobName: string,
    permissions: BlobSASPermissions,
    expiresOn: Date,
  ): Promise<string> {
    if (this.client.credential instanceof StorageSharedKeyCredential) {
      return generateBlobSASQueryParameters(
        {
          containerName: this.containerName,
          blobName,
          permissions,
          expiresOn,
        },
        this.client.credential,
      ).toString();
    }
    return '';
  }
}

export function createBlobStorage(): BlobStorage {
  if (config.AZURE_STORAGE_CONNECTION_STRING.length > 0 && !config.isTest) {
    return new AzureBlobStorage(
      config.AZURE_STORAGE_CONNECTION_STRING,
      config.AZURE_BLOB_CONTAINER,
    );
  }
  // Disk-backed, not in-memory: see LocalDiskBlobStorage's docblock above --
  // this is the instance that survives a dev server restart.
  return new LocalDiskBlobStorage();
}

export const defaultBlobStorage = createBlobStorage();
