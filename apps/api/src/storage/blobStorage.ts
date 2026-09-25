import {
  BlobSASPermissions,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { LOCAL_UPLOADS_DIR } from '../paths.js';

export interface SignedUploadTarget {
  uploadUrl: string;
  fileUrl: string;
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
  getPublicUrl(key: string): string;
  upload(key: string, data: Buffer, contentType: string): Promise<string>;
  download(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
}

export class InMemoryBlobStorage implements BlobStorage {
  private readonly store = new Map<string, { data: Buffer; contentType: string }>();
  private readonly baseUrl: string;

  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async generateUploadTarget(options: GenerateUploadOptions): Promise<SignedUploadTarget> {
    const expiresAt = new Date(Date.now() + (options.expiresInMinutes ?? 15) * 60 * 1000).toISOString();
    return {
      uploadUrl: `${this.baseUrl}/v1/uploads/mock/${options.key}`,
      fileUrl: this.getPublicUrl(options.key),
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
export class LocalDiskBlobStorage implements BlobStorage {
  private readonly baseUrl: string;
  private readonly rootDir: string;

  constructor(baseUrl = 'http://localhost:3000', rootDir = LOCAL_UPLOADS_DIR) {
    this.baseUrl = baseUrl;
    this.rootDir = path.resolve(rootDir);
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
