import type { DocumentPickerResponse } from '../../../native/documentPicker';

/** Which of the two gated rows a sub-type picker/selection belongs to. Certification has no
 * sub-type picker (out of scope -- see Step4Documents' module docs). */
export type SubTypeRowKind = 'ID_PROOF' | 'FARM_DOC';

export type DocType = 'ID_PROOF' | 'FARM_DOC' | 'CERTIFICATE';

export interface DocState {
  file: DocumentPickerResponse | null;
  fileUrl: string | null; // real CDN URL after upload
  uploading: boolean;
  progress: number; // 0-100
  error: string | null;
}

export function makeEmptyDoc(): DocState {
  return { file: null, fileUrl: null, uploading: false, progress: 0, error: null };
}
