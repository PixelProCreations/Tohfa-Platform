/**
 * The real attachment flow for AnimalDetailScreen's record modals, replacing a
 * button that "attached" a hard-coded vaccine_receipt.jpg. Same pick + sign +
 * upload sequence as soil tests (UploadNewSoilTestScreen) and pest photos
 * (api/pest.ts uploadPestPhoto): DocumentPicker -> POST /uploads/sign ->
 * uploadWithResume, and the returned `uploads` row id is sent as the record's
 * `attachmentUploadId` (the server checks the caller owns it, BR-136c).
 *
 * Purpose: there is no livestock-specific UploadPurpose on the server, so the
 * generic FARMER_DOCUMENT purpose is used (reported as a spec gap).
 */
import DocumentPicker from '../../../native/documentPicker';
import { signUpload } from '../../../api/registration';
import { uploadWithResume } from '../../../api/uploader';

export interface PickedAttachment {
  uri: string;
  name: string;
  contentType: 'application/pdf' | 'image/jpeg' | 'image/png';
  sizeBytes: number | null;
}

/** The modals' own hint says "max 10 MB" (the server allows up to 25 MiB). */
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

export type PickOutcome =
  | { kind: 'picked'; file: PickedAttachment }
  | { kind: 'cancelled' }
  | { kind: 'tooLarge' }
  | { kind: 'failed'; error: unknown };

function contentTypeFor(name: string, type: string | null | undefined): PickedAttachment['contentType'] {
  const lower = name.toLowerCase();
  if (type === 'application/pdf' || lower.endsWith('.pdf')) return 'application/pdf';
  if (type === 'image/png' || lower.endsWith('.png')) return 'image/png';
  return 'image/jpeg';
}

export async function pickAnimalAttachment(): Promise<PickOutcome> {
  try {
    const picked = await DocumentPicker.pickSingle({
      type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
      copyTo: 'cachesDirectory',
    });
    const sizeBytes = typeof picked.size === 'number' ? picked.size : null;
    if (sizeBytes !== null && sizeBytes > ATTACHMENT_MAX_BYTES) return { kind: 'tooLarge' };
    const name = picked.name ?? 'attachment';
    return {
      kind: 'picked',
      file: { uri: picked.fileCopyUri ?? picked.uri, name, contentType: contentTypeFor(name, picked.type), sizeBytes },
    };
  } catch (err) {
    if (DocumentPicker.isCancel(err)) return { kind: 'cancelled' };
    return { kind: 'failed', error: err };
  }
}

/** Uploads a picked file and returns the `uploads` row id to send as `attachmentUploadId`. */
export async function uploadAnimalAttachment(file: PickedAttachment): Promise<string> {
  const response = await fetch(file.uri);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length > ATTACHMENT_MAX_BYTES) throw new Error('attachment too large');
  const signed = await signUpload({
    purpose: 'FARMER_DOCUMENT',
    fileName: file.name,
    contentType: file.contentType,
    sizeBytes: bytes.length,
  });
  await uploadWithResume({
    uploadUrl: signed.uploadUrl,
    fileUrl: signed.fileUrl,
    resumable: signed.resumable ?? false,
    data: bytes,
    contentType: file.contentType,
    headers: signed.headers,
    method: signed.method,
  });
  return signed.id;
}

/** "240 KB" / "1.2 MB" for the attachment card; null size shows nothing. */
export function attachmentSizeParts(sizeBytes: number | null): { value: string; unit: 'KB' | 'MB' } | null {
  if (sizeBytes === null) return null;
  if (sizeBytes < 1024 * 1024) return { value: String(Math.max(1, Math.round(sizeBytes / 1024))), unit: 'KB' };
  return { value: (sizeBytes / (1024 * 1024)).toFixed(1), unit: 'MB' };
}
