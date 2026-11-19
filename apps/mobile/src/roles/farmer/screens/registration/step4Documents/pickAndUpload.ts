import type React from 'react';
import DocumentPicker, { type DocumentPickerResponse } from '../../../native/documentPicker';
import {
  signApplicationUpload,
  createFarmerApplication,
  saveFarmerApplicationStep,
} from '../../../api/registration';
import { useRegistrationDraftStore } from '../../../storage/registrationDraft';
import { ApiError } from '../../../../../shell/api/client';
import { uploadWithResume } from '../../../api/uploader';
import { s4 } from './i18n';
import type { DocType, DocState } from './types';

/** Pick a file and immediately upload it to the CDN via the presigned URL. */
export async function pickAndUpload(
  applicationId: string,
  docType: DocType,
  setter: React.Dispatch<React.SetStateAction<DocState>>,
): Promise<void> {
  let picked: DocumentPickerResponse;
  try {
    picked = await DocumentPicker.pickSingle({
      type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
      // Android hands back a `content://` URI, which `fetch()` cannot read on-device --
      // its native networking layer only speaks http(s), so attempting to fetch it fails
      // outright with "Failed to construct 'Response': status 0" (no HTTP semantics ever
      // apply). `copyTo` makes the picker copy the file into the app's own cache dir and
      // expose a real `file://` path via `fileCopyUri`, which `fetch()` can read normally.
      copyTo: 'cachesDirectory',
    });
  } catch (err) {
    if (!DocumentPicker.isCancel(err)) {
      setter((s) => ({ ...s, error: s4('errPicker') }));
    }
    return;
  }

  setter((s) => ({ ...s, file: picked, uploading: true, progress: 0, error: null }));

  try {
    // 1. Read file bytes first -- needed for the upload in step 3 either way, and the
    // server's signUploadBody schema requires an exact sizeBytes (max 25 MiB), which
    // `picked.size` can't be trusted for (react-native-document-picker types it as
    // `number | null`). Using the real byte length here is both simpler than a null
    // fallback and strictly more accurate than picker-reported metadata.
    const fileResp = await fetch(picked.fileCopyUri ?? picked.uri);
    const buffer = await fileResp.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const signBody = {
      purpose: docType === 'CERTIFICATE' ? ('CERTIFICATE' as const) : ('FARMER_DOCUMENT' as const),
      fileName: picked.name ?? `${docType.toLowerCase()}.pdf`,
      contentType: picked.type ?? 'application/octet-stream',
      sizeBytes: bytes.length,
    };

    // 2. Get presigned upload URL from the API. No account exists yet at this point in
    // registration, so this goes through the application-scoped, auth-free sibling of
    // signUpload rather than signUpload itself (which requires a Bearer token).
    let signed;
    try {
      signed = await signApplicationUpload(applicationId, signBody);
    } catch (signErr) {
      if (signErr instanceof ApiError && signErr.is('NOT_FOUND')) {
        // If the application doesn't exist on server (e.g. dev database was reset), try to re-create it from store
        const draftStore = useRegistrationDraftStore.getState();
        const s1 = draftStore.draft.step1;
        if (s1?.mobile && s1?.fullName) {
          const newApp = await createFarmerApplication({
            mobile: s1.mobile,
            fullName: s1.fullName,
            preferredLocale: 'en',
          });
          if (newApp?.id) {
            draftStore.setApplicationId(newApp.id);
            if (draftStore.draft.step1) await saveFarmerApplicationStep(newApp.id, 1, draftStore.draft.step1).catch(() => {});
            if (draftStore.draft.step2) await saveFarmerApplicationStep(newApp.id, 2, draftStore.draft.step2).catch(() => {});
            if (draftStore.draft.step3) await saveFarmerApplicationStep(newApp.id, 3, draftStore.draft.step3).catch(() => {});
            signed = await signApplicationUpload(newApp.id, signBody);
          } else {
            throw signErr;
          }
        } else {
          throw signErr;
        }
      } else {
        throw signErr;
      }
    }

    // 3. Upload with resumable support + progress tracking. `signed.headers`
    // (e.g. Azure's required `x-ms-blob-type: BlockBlob`) and `signed.method`
    // must be forwarded -- a real Azure block-blob upload fails without that
    // header, and uploadWithResume previously had no way to accept either.
    const result = await uploadWithResume({
      uploadUrl: signed.uploadUrl,
      fileUrl: signed.fileUrl,
      resumable: signed.resumable ?? false,
      data: bytes,
      contentType: picked.type ?? 'application/octet-stream',
      headers: signed.headers,
      method: signed.method,
      onProgress: (pct) => {
        setter((s) => ({ ...s, progress: pct }));
      },
    });

    setter((s) => ({
      ...s,
      uploading: false,
      progress: 100,
      fileUrl: result.fileUrl,
      error: null,
    }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : s4('errUploadFailed');
    setter((s) => ({ ...s, uploading: false, progress: 0, error: msg }));
  }
}
