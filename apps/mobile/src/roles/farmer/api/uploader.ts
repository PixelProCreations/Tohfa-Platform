/**
 * Resumable file upload manager for TOHFA Farmer Mobile (S-46).
 * Honours the `resumable` flag from POST /uploads/sign.
 * A killed or interrupted upload resumes from the last uploaded offset instead of restarting from zero.
 */

export interface UploadOptions {
  uploadUrl: string;
  fileUrl: string;
  resumable?: boolean | undefined;
  data: Uint8Array | string;
  contentType: string;
  chunkSize?: number | undefined;
  onProgress?: ((progressPct: number, uploadedBytes: number, totalBytes: number) => void) | undefined;
  abortSignal?: AbortSignal | undefined;
  /**
   * Extra headers the presigned target requires -- e.g. a real Azure block-blob
   * upload needs `x-ms-blob-type: BlockBlob`, which `SignedUploadTarget.headers`
   * (apps/api/src/storage/blobStorage.ts) already carries but this function used to
   * ignore, hardcoding only Content-Type. Merged on top of the headers this function
   * builds itself; Content-Range for a resumable chunk is still added afterwards so
   * it can never be shadowed by a caller-supplied value.
   */
  headers?: Record<string, string> | undefined;
  /**
   * The HTTP method the presigned target expects. `SignedUploadTarget.method` is
   * typed as `'PUT' | 'POST'`, though every signer in this codebase issues 'PUT'
   * today -- defaults to 'PUT' to match that, and stays overridable in case a future
   * signer varies it.
   */
  method?: string | undefined;
}

export interface UploadResult {
  fileUrl: string;
  totalBytes: number;
  resumed: boolean;
  resumedFromByte: number;
}

export interface UploadSessionState {
  uploadUrl: string;
  totalBytes: number;
  uploadedBytes: number;
  resumable: boolean;
  lastUpdated: number;
}

// In-memory / session store for tracking upload progress across retries
const uploadSessions = new Map<string, UploadSessionState>();

export function getUploadSession(uploadUrl: string): UploadSessionState | undefined {
  return uploadSessions.get(uploadUrl);
}

export function clearUploadSession(uploadUrl: string): void {
  uploadSessions.delete(uploadUrl);
}

export function resetAllUploadSessions(): void {
  uploadSessions.clear();
}

/**
 * Uploads a file or buffer to the signed target, resuming from the last offset if resumable.
 */
export async function uploadWithResume(options: UploadOptions): Promise<UploadResult> {
  const {
    uploadUrl,
    fileUrl,
    resumable = false,
    data,
    contentType,
    chunkSize = 64 * 1024, // 64 KB chunks
    onProgress,
    abortSignal,
  } = options;

  const totalBytes = typeof data === 'string' ? new TextEncoder().encode(data).length : data.length;

  let session = uploadSessions.get(uploadUrl);
  const isResumeEligible = resumable && session !== undefined && session.uploadedBytes > 0 && session.uploadedBytes < totalBytes;

  const startOffset = isResumeEligible && session ? session.uploadedBytes : 0;
  const resumed = startOffset > 0;

  if (!session) {
    session = {
      uploadUrl,
      totalBytes,
      uploadedBytes: startOffset,
      resumable,
      lastUpdated: Date.now(),
    };
    uploadSessions.set(uploadUrl, session);
  }

  // Convert string or Uint8Array to sliceable bytes
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;

  let currentOffset = startOffset;

  while (currentOffset < totalBytes) {
    if (abortSignal?.aborted) {
      throw new Error('Upload aborted by user');
    }

    const nextOffset = Math.min(currentOffset + chunkSize, totalBytes);
    const chunk = bytes.slice(currentOffset, nextOffset);

    // Build headers for chunk upload. Caller-supplied headers (e.g. the presigned
    // target's `x-ms-blob-type: BlockBlob`) are merged in first so they are never
    // silently dropped; Content-Range is then always added/overwritten afterwards so
    // a resumable chunk's own protocol header can never be shadowed by a caller value.
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      ...options.headers,
    };

    if (resumable) {
      headers['Content-Range'] = `bytes ${currentOffset}-${nextOffset - 1}/${totalBytes}`;
    }

    try {
      const res = await fetch(uploadUrl, {
        method: options.method ?? 'PUT',
        headers,
        body: chunk,
        signal: abortSignal,
      });

      if (!res.ok) {
        throw new Error(`Upload chunk failed with status ${res.status}`);
      }

      currentOffset = nextOffset;
      session.uploadedBytes = currentOffset;
      session.lastUpdated = Date.now();

      const progressPct = Math.round((currentOffset / totalBytes) * 100);
      onProgress?.(progressPct, currentOffset, totalBytes);
    } catch (err) {
      // Keep session progress intact for subsequent resume if resumable
      if (!resumable) {
        session.uploadedBytes = 0;
      }
      throw err;
    }
  }

  // Upload complete — clean up session
  uploadSessions.delete(uploadUrl);

  return {
    fileUrl,
    totalBytes,
    resumed,
    resumedFromByte: startOffset,
  };
}
