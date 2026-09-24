import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import DocumentPicker, { type DocumentPickerResponse } from 'react-native-document-picker';
import { useTheme, authPalette as P } from '../../theme';
import { Icon } from '@tohfa/mobile-ui';
import {
  ID_PROOF_SUB_TYPES,
  FARM_DOC_SUB_TYPES,
  type Step4DocumentsData,
} from '../../storage/registrationDraft';
import { signApplicationUpload } from '../../api/registration';
import { uploadWithResume } from '../../api/uploader';

/** Which of the two gated rows a sub-type picker/selection belongs to. Certification has no
 * sub-type picker (out of scope -- see Step4Documents' module docs). */
type SubTypeRowKind = 'ID_PROOF' | 'FARM_DOC';

interface Step4Props {
  /** The application this step belongs to -- documents are signed and uploaded against it via
   * the registration-scoped `POST /farmers/applications/:id/uploads/sign`, since the applicant
   * has no account (and therefore no Bearer token) yet at this point in the flow. */
  applicationId: string;
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

export const Step4Documents: React.FC<Step4Props> = ({ applicationId, initialData, onSave, onBack }) => {
  const theme = useTheme();
  const { colors } = theme;
  const scrollRef = useRef<ScrollView>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

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

  // Which specific document each gated row is -- e.g. "Aadhaar Card" for ID Proof, "Patta" for
  // Farm Documents. Restored from the draft so re-entering the step doesn't force a re-pick.
  // Certification has no sub-type (out of scope), so it gets no state here.
  const [idProofSubType, setIdProofSubType] = useState<string | undefined>(
    () => initialData?.documents?.find((d) => d.docType === 'ID_PROOF')?.docSubType,
  );
  const [farmDocSubType, setFarmDocSubType] = useState<string | undefined>(
    () => initialData?.documents?.find((d) => d.docType === 'FARM_DOC')?.docSubType,
  );

  // Which row's sub-type picker modal is open, if any. A single shared modal (rather than one
  // per row) since only one can be open at a time and the two option lists render identically.
  const [subTypePickerFor, setSubTypePickerFor] = useState<SubTypeRowKind | null>(null);

  function handleSelectSubType(value: string) {
    if (subTypePickerFor === 'ID_PROOF') {
      setIdProofSubType(value);
      clearFieldError('idProof');
    } else if (subTypePickerFor === 'FARM_DOC') {
      setFarmDocSubType(value);
      clearFieldError('farmDoc');
    }
    setSubTypePickerFor(null);
  }

  const subTypePickerOptions: readonly string[] =
    subTypePickerFor === 'ID_PROOF'
      ? ID_PROOF_SUB_TYPES
      : subTypePickerFor === 'FARM_DOC'
        ? FARM_DOC_SUB_TYPES
        : [];
  const subTypePickerTitle =
    subTypePickerFor === 'ID_PROOF'
      ? 'Select ID Proof Type'
      : subTypePickerFor === 'FARM_DOC'
        ? 'Select Farm Document Type'
        : '';
  const subTypePickerSelected = subTypePickerFor === 'ID_PROOF' ? idProofSubType : farmDocSubType;

  /** Pick a file and immediately upload it to the CDN via the presigned URL. */
  async function handlePickAndUpload(
    docType: DocType,
    setter: React.Dispatch<React.SetStateAction<DocState>>,
  ) {
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
        setter((s) => ({ ...s, error: 'Could not open file picker.' }));
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

      // 2. Get presigned upload URL from the API. No account exists yet at this point in
      // registration, so this goes through the application-scoped, auth-free sibling of
      // signUpload rather than signUpload itself (which requires a Bearer token).
      const signed = await signApplicationUpload(applicationId, {
        purpose: docType === 'CERTIFICATE' ? 'CERTIFICATE' : 'FARMER_DOCUMENT',
        fileName: picked.name ?? `${docType.toLowerCase()}.pdf`,
        contentType: picked.type ?? 'application/octet-stream',
        sizeBytes: bytes.length,
      });

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
        docSubType: idProofSubType,
      });
    }
    if (farmDoc.fileUrl) {
      documents.push({
        docType: 'FARM_DOC',
        fileUrl: farmDoc.fileUrl,
        fileName: farmDoc.file?.name ?? 'farm_doc.pdf',
        docSubType: farmDocSubType,
      });
    }
    if (certDoc.fileUrl) {
      documents.push({
        docType: 'CERTIFICATE',
        fileUrl: certDoc.fileUrl,
        fileName: certDoc.file?.name ?? 'certificate.pdf',
      });
    }

    const errors: Record<string, string> = {};
    if (!idProof.fileUrl) {
      errors.idProof = 'Please upload a valid ID proof.';
    } else if (!idProofSubType) {
      // Defensive only -- the type picker gates the upload action itself (see DocUploadRow
      // below), so a fresh upload can never reach here without a sub-type already set. This
      // catches a draft restored from before this field existed: the file is real, but there
      // is nothing to show a FARM_VERIFICATION reviewer which document it is. The fix is right
      // on this row (the "Change" affordance under it opens the same picker), so this is a
      // resolvable prompt, not a dead end.
      errors.idProof = 'Please select the ID proof type.';
    }
    if (!farmDoc.fileUrl) {
      errors.farmDoc = 'Please upload a valid farm document.';
    } else if (!farmDocSubType) {
      errors.farmDoc = 'Please select the farm document type.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setFieldErrors({});
    onSave({ documents });
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

      <ScrollView ref={scrollRef} style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* ID Proof */}
        <DocUploadRow
          label="ID Proof"
          required
          hint="PDF or image file"
          doc={idProof}
          fieldError={fieldErrors.idProof}
          colors={colors}
          subType={idProofSubType}
          onSelectType={() => setSubTypePickerFor('ID_PROOF')}
          onPress={() => {
            clearFieldError('idProof');
            handlePickAndUpload('ID_PROOF', setIdProof);
          }}
          onRemove={() => setIdProof(makeEmptyDoc())}
        />

        {/* Farm Documents */}
        <DocUploadRow
          label="Farm Documents"
          required
          hint="PDF or image file"
          doc={farmDoc}
          fieldError={fieldErrors.farmDoc}
          colors={colors}
          subType={farmDocSubType}
          onSelectType={() => setSubTypePickerFor('FARM_DOC')}
          onPress={() => {
            clearFieldError('farmDoc');
            handlePickAndUpload('FARM_DOC', setFarmDoc);
          }}
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
          <View style={styles.infoIconContainer}>
            <Icon name="info" size={20} color={P.twBlue800} />
          </View>
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

      {/* Document-type picker -- shared by the ID Proof and Farm Documents rows */}
      <Modal
        visible={subTypePickerFor !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSubTypePickerFor(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setSubTypePickerFor(null)}
        >
          <View style={[styles.pickerModalContent, { backgroundColor: colors.white }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.textDark }]}>{subTypePickerTitle}</Text>
              <TouchableOpacity
                onPress={() => setSubTypePickerFor(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.pickerCloseBtn}
              >
                <Icon name="close" size={20} color={colors.textSubtle} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 360 }}>
              {subTypePickerOptions.map((option) => {
                const selected = subTypePickerSelected === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.pickerOption, selected ? { backgroundColor: colors.brandGreenLight } : null]}
                    onPress={() => handleSelectSubType(option)}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        { color: selected ? colors.brandGreen : colors.textDark, fontWeight: selected ? '700' : '500' },
                      ]}
                    >
                      {option}
                    </Text>
                    {selected ? (
                      <Icon name="check" size={18} color={colors.brandGreen} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ─── Sub-component: single document upload row ────────────────────────────────

interface DocUploadRowProps {
  label: string;
  required: boolean;
  hint: string;
  doc: DocState;
  fieldError?: string | undefined;
  colors: ReturnType<typeof useTheme>['colors'];
  onPress: () => void;
  onRemove: () => void;
  /**
   * Present only for the gated rows (ID Proof, Farm Documents). Its presence -- not `subType`'s
   * value -- is what turns on the "pick a type before upload" behaviour below; Certification
   * passes neither prop and renders exactly as it did before this feature.
   */
  onSelectType?: (() => void) | undefined;
  /** The document sub-type currently chosen for this row, if any (e.g. "Aadhaar Card"). */
  subType?: string | undefined;
}

function DocUploadRow({
  label,
  required,
  hint,
  doc,
  fieldError,
  colors,
  onPress,
  onRemove,
  onSelectType,
  subType,
}: DocUploadRowProps) {
  const isUploaded = !!doc.fileUrl;
  const isUploading = doc.uploading;
  const isGated = !!onSelectType;
  const needsTypeSelection = isGated && !subType;

  if (isUploaded) {
    return (
      <View
        style={[
          styles.docCard,
          {
            backgroundColor: colors.white,
            borderColor: colors.brandGreen,
            borderWidth: 1.5,
          },
        ]}
      >
        <View style={styles.uploadedRow}>
          <View style={[styles.uploadedCheckCircle, { backgroundColor: colors.brandGreenLight }]}>
            <Icon name="check" size={20} color={colors.brandGreen} />
          </View>
          <View style={styles.uploadedInfo}>
            <View style={styles.titleRow}>
              <Text style={[styles.docCardTitle, { color: colors.textDark }]}>
                {label}
              </Text>
              {required ? <Text style={{ color: colors.requiredRed, fontWeight: '700' }}> *</Text> : null}
            </View>

            {isGated && subType ? (
              <View style={[styles.uploadedBadge, { backgroundColor: colors.brandGreenLight }]}>
                <Text style={[styles.uploadedBadgeText, { color: colors.brandGreen }]}>
                  {subType}
                </Text>
              </View>
            ) : null}

            <Text style={[styles.uploadedFileName, { color: colors.textSubtle }]} numberOfLines={1}>
              {doc.file?.name ?? 'Document uploaded'} · <Text style={{ color: colors.brandGreen, fontWeight: '700' }}>✓ Saved</Text>
            </Text>
          </View>

          <TouchableOpacity
            onPress={onRemove}
            style={[styles.removeButton, { backgroundColor: colors.borderSoft }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`Remove uploaded ${label}`}
          >
            <Icon name="close" size={18} color={colors.textSubtle} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isUploading) {
    return (
      <View
        style={[
          styles.docCard,
          {
            backgroundColor: colors.white,
            borderColor: colors.brandGreen,
            borderWidth: 1.5,
          },
        ]}
      >
        <View style={styles.uploadingHeader}>
          <ActivityIndicator size="small" color={colors.brandGreen} />
          <Text style={[styles.uploadingTitle, { color: colors.textDark }]}>
            Uploading {subType || label}… {doc.progress}%
          </Text>
        </View>
        <View style={[styles.progressBarTrack, { backgroundColor: colors.borderMedium }]}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${doc.progress}%` as any, backgroundColor: colors.brandGreen },
            ]}
          />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.docCard,
        {
          backgroundColor: colors.white,
          borderColor: fieldError ? colors.requiredRed : colors.borderLight,
        },
      ]}
    >
      {/* 1. Header: Document Title & Type Selector Pill */}
      <View style={styles.docCardHeader}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={styles.titleRow}>
            <Text style={[styles.docCardTitle, { color: colors.textDark }]}>
              {label}
            </Text>
            {required ? (
              <Text style={{ color: colors.requiredRed, fontWeight: '700' }}> *</Text>
            ) : (
              <Text style={[styles.optionalBadge, { color: colors.textSubtle }]}> (Optional)</Text>
            )}
          </View>
          <Text style={[styles.docCardHint, { color: colors.textSubtle }]}>
            {hint}
          </Text>
        </View>

        {isGated ? (
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.subTypePill,
              subType
                ? { backgroundColor: colors.brandGreenLight, borderColor: colors.brandGreen }
                : { backgroundColor: P.amber50, borderColor: P.amber200 },
            ]}
            onPress={onSelectType}
            accessibilityRole="button"
            accessibilityLabel={`Select document type for ${label}`}
          >
            <Text
              style={[
                styles.subTypePillText,
                { color: subType ? colors.brandGreen : P.amberDeep },
              ]}
              numberOfLines={1}
            >
              {subType ? subType : 'Choose Type'}
            </Text>
            <Icon
              name="expand_more"
              size={16}
              color={subType ? colors.brandGreen : P.amberDeep}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* 2. Upload Zone */}
      <TouchableOpacity
        activeOpacity={0.75}
        style={[
          styles.uploadZone,
          {
            borderColor: colors.borderMedium,
            backgroundColor: colors.bgLight,
          },
        ]}
        onPress={needsTypeSelection ? onSelectType : onPress}
        accessibilityRole="button"
        accessibilityLabel={`Upload ${subType || label}`}
      >
        <View style={[styles.uploadIconCircle, { backgroundColor: colors.brandGreenLight }]}>
          <Icon
            name="upload"
            size={22}
            color={colors.brandGreen}
          />
        </View>

        <Text style={[styles.uploadPromptText, { color: colors.textDark }]}>
          {needsTypeSelection
            ? 'Tap to select document type'
            : subType
            ? `Tap to upload ${subType}`
            : 'Tap to upload file'}
        </Text>
        <Text style={[styles.uploadFormatText, { color: colors.textSubtle }]}>
          PDF, JPG or PNG (up to 10MB)
        </Text>
      </TouchableOpacity>

      {/* Errors */}
      {doc.error ? (
        <Text style={[styles.uploadErrorText, { color: colors.requiredRed, marginTop: 8 }]}>
          {doc.error}
        </Text>
      ) : null}
      {fieldError ? (
        <Text style={[styles.uploadErrorText, { color: colors.requiredRed, marginTop: 8 }]}>
          {fieldError}
        </Text>
      ) : null}
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 },

  // Card styles
  docCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  docCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  optionalBadge: {
    fontSize: 12,
  },
  docCardHint: {
    fontSize: 12,
    marginTop: 2,
  },
  subTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 2,
  },
  subTypePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  uploadZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  uploadPromptText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
    textAlign: 'center',
  },
  uploadFormatText: {
    fontSize: 12,
    textAlign: 'center',
  },
  uploadErrorText: {
    fontSize: 12,
    marginLeft: 2,
  },

  // Uploaded state
  uploadedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  uploadedCheckCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedInfo: {
    flex: 1,
  },
  uploadedBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 3,
    marginBottom: 3,
  },
  uploadedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  uploadedFileName: {
    fontSize: 13,
    marginTop: 2,
  },
  removeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Uploading state
  uploadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  uploadingTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 5,
    borderRadius: 3,
  },

  // Info banner
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: P.noticeBg,
    borderWidth: 1,
    borderColor: P.noticeBorder,
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
    marginBottom: 16,
    gap: 12,
  },
  infoIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: P.blue50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: P.noticeText,
    lineHeight: 18,
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
  },
  footerBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    borderWidth: 1.5,
  },
  nextButton: {
    borderWidth: 0,
  },
  footerBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Picker modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModalContent: {
    borderRadius: 18,
    width: '90%',
    maxWidth: 400,
    maxHeight: '75%',
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 10,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: P.border,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  pickerCloseBtn: {
    padding: 4,
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginVertical: 2,
  },
  pickerOptionText: {
    fontSize: 15,
  },
});
