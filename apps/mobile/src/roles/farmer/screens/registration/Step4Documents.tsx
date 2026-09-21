import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';
import { useTheme, authPalette as P } from '../../theme';
import { ErrorState, Icon } from '@tohfa/mobile-ui';
import { validateStep } from './validation';
import type { Step4DocumentsData } from '../../storage/registrationDraft';
import { signUpload } from '../../api/registration';
import { uploadWithResume } from '../../api/uploader';

interface Step4Props {
  initialData?: Step4DocumentsData | undefined;
  onSave: (data: Step4DocumentsData) => void;
  onBack: () => void;
}

type DocType = 'ID_PROOF' | 'FARM_DOC' | 'CERTIFICATE';

interface DocState {
  file: DocumentPickerResponse | null;
  fileUrl: string | null; // real CDN URL after upload
  uploading: boolean;
  progress: number; // 0-100
  error: string | null;
}

function makeEmptyDoc(): DocState {
  return { file: null, fileUrl: null, uploading: false, progress: 0, error: null };
}

export const Step4Documents: React.FC<Step4Props> = ({ initialData, onSave, onBack }) => {
  const theme = useTheme();
  const { colors } = theme;

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Restore already-uploaded URLs from draft so re-entering the step doesn't lose work
  const [idProof, setIdProof] = useState<DocState>(() => {
    const saved = initialData?.documents?.find((d) => d.docType === 'ID_PROOF');
    return saved?.fileUrl && saved.fileUrl !== 'placeholder-not-yet-wired'
      ? { file: null, fileUrl: saved.fileUrl, uploading: false, progress: 100, error: null }
      : makeEmptyDoc();
  });

  const [farmDoc, setFarmDoc] = useState<DocState>(() => {
    const saved = initialData?.documents?.find((d) => d.docType === 'FARM_DOC');
    return saved?.fileUrl && saved.fileUrl !== 'placeholder-not-yet-wired'
      ? { file: null, fileUrl: saved.fileUrl, uploading: false, progress: 100, error: null }
      : makeEmptyDoc();
  });

  const [certDoc, setCertDoc] = useState<DocState>(() => {
    const saved = initialData?.documents?.find((d) => d.docType === 'CERTIFICATE');
    return saved?.fileUrl
      ? { file: null, fileUrl: saved.fileUrl, uploading: false, progress: 100, error: null }
      : makeEmptyDoc();
  });

  /** Pick a file and immediately upload it to the CDN via the presigned URL. */
  async function handlePickAndUpload(
    docType: DocType,
    setter: React.Dispatch<React.SetStateAction<DocState>>,
  ) {
    let picked: DocumentPickerResponse;
    try {
      picked = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
      });
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        setter((s) => ({ ...s, error: 'Could not open file picker.' }));
      }
      return;
    }

    setter((s) => ({ ...s, file: picked, uploading: true, progress: 0, error: null }));

    try {
      // 1. Get presigned upload URL from the API
      const signed = await signUpload({
        purpose: docType === 'CERTIFICATE' ? 'CERTIFICATE' : 'FARMER_DOCUMENT',
        filename: picked.name ?? `${docType.toLowerCase()}.pdf`,
        contentType: picked.type ?? 'application/octet-stream',
      });

      // 2. Read file bytes
      const fileResp = await fetch(picked.uri);
      const buffer = await fileResp.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // 3. Upload with resumable support + progress tracking
      const result = await uploadWithResume({
        uploadUrl: signed.uploadUrl,
        fileUrl: signed.fileUrl,
        resumable: signed.resumable ?? false,
        data: bytes,
        contentType: picked.type ?? 'application/octet-stream',
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
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setter((s) => ({ ...s, uploading: false, progress: 0, error: msg }));
    }
  }

  function handleContinue() {
    const documents: Step4DocumentsData['documents'] = [];

    if (idProof.fileUrl) {
      documents.push({
        docType: 'ID_PROOF',
        fileUrl: idProof.fileUrl,
        fileName: idProof.file?.name ?? 'id_proof.pdf',
      });
    }
    if (farmDoc.fileUrl) {
      documents.push({
        docType: 'FARM_DOC',
        fileUrl: farmDoc.fileUrl,
        fileName: farmDoc.file?.name ?? 'farm_doc.pdf',
      });
    }
    if (certDoc.fileUrl) {
      documents.push({
        docType: 'CERTIFICATE',
        fileUrl: certDoc.fileUrl,
        fileName: certDoc.file?.name ?? 'certificate.pdf',
      });
    }

    const payload: Step4DocumentsData = { documents };
    const validation = validateStep(4, payload);
    if (!validation.valid) {
      setErrorMsg(Object.values(validation.errors)[0] ?? 'Please upload the required documents.');
      return;
    }

    setErrorMsg(null);
    onSave(payload);
  }

  function handleSkip() {
    // Allow skipping only if at least id+farm placeholders exist from initial data
    onSave({ documents: initialData?.documents ?? [] });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgLight }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.borderSoft }]}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.backButtonCircle, { borderColor: colors.borderMedium, backgroundColor: colors.white }]}
            onPress={onBack}
          >
            <Text style={[styles.backButtonArrow, { color: colors.brandGreen }]}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.textDark }]}>Documents</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSubtle }]}>Step 4 of 5</Text>
          </View>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={[styles.skipText, { color: colors.brandGreen }]}>Skip</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.progressRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <View
              key={s}
              style={[styles.progressSegment, { backgroundColor: s <= 4 ? colors.brandGreen : colors.borderMedium }]}
            />
          ))}
        </View>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {errorMsg ? (
          <View style={styles.errorContainer}>
            <ErrorState message={errorMsg} onRetry={() => setErrorMsg(null)} />
          </View>
        ) : null}

        {/* ID Proof */}
        <DocUploadRow
          label="ID Proof"
          required
          hint="Aadhaar card, Voter ID or Passport (PDF / image)"
          doc={idProof}
          colors={colors}
          onPress={() => handlePickAndUpload('ID_PROOF', setIdProof)}
          onRemove={() => setIdProof(makeEmptyDoc())}
        />

        {/* Farm Documents */}
        <DocUploadRow
          label="Farm Documents"
          required
          hint="Land deed, Patta / Chitta or lease agreement (PDF / image)"
          doc={farmDoc}
          colors={colors}
          onPress={() => handlePickAndUpload('FARM_DOC', setFarmDoc)}
          onRemove={() => setFarmDoc(makeEmptyDoc())}
        />

        {/* Certification (optional) */}
        <DocUploadRow
          label="Certification"
          required={false}
          hint="PGS Organic / NPOP certificate (optional)"
          doc={certDoc}
          colors={colors}
          onPress={() => handlePickAndUpload('CERTIFICATE', setCertDoc)}
          onRemove={() => setCertDoc(makeEmptyDoc())}
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>
            Don't have certification yet? No problem — you can still apply. TOHFA can help you get
            certified after approval.
          </Text>
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.footer, { borderTopColor: colors.borderDivider, backgroundColor: colors.white }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.footerBtn, styles.backButton, { borderColor: colors.brandGreen, backgroundColor: colors.white }]}
          onPress={onBack}
        >
          <Text style={[styles.footerBtnText, { color: colors.brandGreen }]}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.footerBtn, styles.nextButton, {
            backgroundColor: colors.brandGreen,
            opacity: (idProof.uploading || farmDoc.uploading || certDoc.uploading) ? 0.6 : 1,
          }]}
          onPress={handleContinue}
          disabled={idProof.uploading || farmDoc.uploading || certDoc.uploading}
        >
          <Text style={[styles.footerBtnText, { color: colors.white }]}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Sub-component: single document upload row ────────────────────────────────

interface DocUploadRowProps {
  label: string;
  required: boolean;
  hint: string;
  doc: DocState;
  colors: ReturnType<typeof useTheme>['colors'];
  onPress: () => void;
  onRemove: () => void;
}

function DocUploadRow({ label, required, hint, doc, colors, onPress, onRemove }: DocUploadRowProps) {
  const isUploaded = !!doc.fileUrl;
  const isUploading = doc.uploading;

  if (isUploaded) {
    return (
      <View style={[styles.docBox, { borderColor: colors.brandGreen, backgroundColor: colors.brandGreenLight }]}>
        <View style={[styles.checkCircle, { backgroundColor: colors.brandGreen }]}>
          <Icon name="check" size={18} color={P.white} />
        </View>
        <View style={styles.docInfo}>
          <Text style={[styles.docTitle, { color: colors.textDark }]}>
            {label}
            {required ? <Text style={{ color: colors.requiredRed }}> *</Text> : (
              <Text style={{ color: colors.textSubtle, fontWeight: '400' }}> (Optional)</Text>
            )}
          </Text>
          <Text style={[styles.docSub, { color: colors.textSubtle }]}>
            {doc.file?.name ?? 'Uploaded'} · ✓ Saved
          </Text>
        </View>
        <TouchableOpacity onPress={onRemove} style={{ padding: 8 }}>
          <Icon name="close" size={20} color={colors.textSubtle} />
        </TouchableOpacity>
      </View>
    );
  }

  if (isUploading) {
    return (
      <View style={[styles.docBox, { borderColor: colors.borderMedium, backgroundColor: colors.white }]}>
        <ActivityIndicator size="small" color={colors.brandGreen} />
        <View style={styles.docInfo}>
          <Text style={[styles.docTitle, { color: colors.textDark }]}>{label}</Text>
          <Text style={[styles.docSub, { color: colors.textSubtle }]}>
            Uploading… {doc.progress}%
          </Text>
          {/* Progress bar */}
          <View style={[styles.progressBarTrack, { backgroundColor: colors.borderMedium }]}>
            <View
              style={[styles.progressBarFill, { width: `${doc.progress}%` as any, backgroundColor: colors.brandGreen }]}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View>
      {doc.error ? (
        <Text style={[styles.uploadErrorText, { color: colors.requiredRed }]}>{doc.error}</Text>
      ) : null}
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.uploadBox, { borderColor: colors.borderMedium, backgroundColor: P.white }]}
        onPress={onPress}
      >
        <Icon name="upload" size={24} color={P.placeholderGrey} style={styles.uploadIcon} />
        <Text style={[styles.uploadTitle, { color: colors.textDark }]}>
          {label}
          {required ? <Text style={{ color: colors.requiredRed }}> *</Text> : (
            <Text style={{ color: colors.textSubtle, fontWeight: '400' }}> (Optional)</Text>
          )}
        </Text>
        <Text style={[styles.uploadSub, { color: colors.textSubtle }]}>{hint}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backButtonCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  backButtonArrow: { fontSize: 22, fontWeight: '700', marginTop: -2 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSubtitle: { fontSize: 12 },
  skipText: { fontSize: 14, fontWeight: '600' },
  progressRow: { flexDirection: 'row', gap: 6, marginTop: 14 },
  progressSegment: { flex: 1, height: 5, borderRadius: 3 },
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
  errorContainer: { marginBottom: 16 },
  docBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 16, padding: 16, marginBottom: 16, gap: 14 },
  checkCircle: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  docSub: { fontSize: 13 },
  progressBarTrack: { height: 4, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  progressBarFill: { height: 4, borderRadius: 2 },
  uploadBox: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
  uploadIcon: { marginBottom: 8 },
  uploadTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  uploadSub: { fontSize: 13, textAlign: 'center' },
  uploadErrorText: { fontSize: 12, marginBottom: 4, marginLeft: 4 },
  infoBox: { backgroundColor: P.noticeBg, borderWidth: 1, borderColor: P.blueTint2, borderRadius: 8, padding: 16, marginTop: 8 },
  infoBoxText: { fontSize: 13, color: P.blueDeep1, lineHeight: 18 },
  footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24, borderTopWidth: 1, flexDirection: 'row', gap: 12 },
  footerBtn: { flex: 1, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  backButton: { borderWidth: 1.5 },
  nextButton: { borderWidth: 0 },
  footerBtnText: { fontSize: 16, fontWeight: '700' },
});
