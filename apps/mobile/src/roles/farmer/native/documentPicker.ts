/**
 * Adapter over `@react-native-documents/picker` that keeps the small slice of
 * the old `react-native-document-picker` API the farmer screens use:
 * `pickSingle({ type, copyTo })`, `isCancel(err)` and `types`.
 *
 * Why an adapter rather than rewriting every call site: the old package
 * (react-native-document-picker@9.3.1, deprecated and renamed upstream) does
 * not compile against React Native 0.88 -- its Android module imports
 * `com.facebook.react.bridge.GuardedResultAsyncTask`, which RN removed. The
 * renamed package splits "pick" and "copy into app storage" into two calls
 * (`pick()` + `keepLocalCopy()`), so this file recombines them in one place
 * instead of repeating that dance in ten screens.
 *
 * `copyTo` matters here: several screens `fetch()` the picked file to upload
 * it, and Android hands back a `content://` URI. Those screens read
 * `fileCopyUri ?? uri`, exactly as before. A failed copy leaves `fileCopyUri`
 * null rather than throwing -- the same contract the old package had (it
 * reported the failure in `copyError` and left `fileCopyUri` null).
 */
import {
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
  pick,
  types,
} from '@react-native-documents/picker';

export interface DocumentPickerResponse {
  uri: string;
  name: string | null;
  type: string | null;
  size: number | null;
  /** Local `file://` copy, set only when `copyTo` was requested and the copy succeeded. */
  fileCopyUri: string | null;
}

export interface PickSingleOptions {
  type: string[];
  copyTo?: 'cachesDirectory' | 'documentDirectory';
}

/** Last path segment of a URI -- the copy needs a file name even when the provider gave none. */
function fileNameFromUri(uri: string): string {
  const segments = uri.split('/');
  return decodeURIComponent(segments[segments.length - 1] ?? uri);
}

export async function pickSingle(options: PickSingleOptions): Promise<DocumentPickerResponse> {
  const [file] = await pick({ type: options.type, allowMultiSelection: false });

  let fileCopyUri: string | null = null;
  if (options.copyTo !== undefined) {
    const [copy] = await keepLocalCopy({
      files: [{ uri: file.uri, fileName: file.name ?? fileNameFromUri(file.uri) }],
      destination: options.copyTo,
    });
    if (copy.status === 'success') {
      fileCopyUri = copy.localUri;
    }
  }

  return {
    uri: file.uri,
    name: file.name,
    type: file.type,
    size: file.size,
    fileCopyUri,
  };
}

/** True when the user dismissed the picker without choosing a file. */
export function isCancel(err: unknown): boolean {
  return isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED;
}

const DocumentPicker = { pickSingle, isCancel, types };

export default DocumentPicker;
