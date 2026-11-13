import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import type { ScrollViewInstance } from 'react-native';
import { useTheme, authPalette as P } from '../../theme';
import { Icon, ModalSafeArea } from '@tohfa/mobile-ui';
import { BackButtonIcon } from '../../assets/icons/AssetIcons';
import {
  ID_PROOF_SUB_TYPES,
  FARM_DOC_SUB_TYPES,
  type Step4DocumentsData,
} from '../../storage/registrationDraft';
import { t } from '../../../../i18n/farmer';
import { s4 } from './step4Documents/i18n';
import { styles, HIT_SLOP_8 } from './step4Documents/styles';
import { DocUploadRow } from './step4Documents/DocUploadRow';
import { pickAndUpload } from './step4Documents/pickAndUpload';
import { makeEmptyDoc, type DocState, type SubTypeRowKind } from './step4Documents/types';

interface Step4Props {
  /** The application this step belongs to -- documents are signed and uploaded against it via
   * the registration-scoped `POST /farmers/applications/:id/uploads/sign`, since the applicant
   * has no account (and therefore no Bearer token) yet at this point in the flow. */
  applicationId: string;
  initialData?: Step4DocumentsData | undefined;
  onSave: (data: Step4DocumentsData) => void;
  onBack: () => void;
}

export const Step4Documents: React.FC<Step4Props> = ({ applicationId, initialData, onSave, onBack }) => {
  const theme = useTheme();
  const { colors } = theme;
  const scrollRef = useRef<ScrollViewInstance>(null);

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
      ? s4('pickerIdTitle')
      : subTypePickerFor === 'FARM_DOC'
        ? s4('pickerFarmTitle')
        : '';
  const subTypePickerSelected = subTypePickerFor === 'ID_PROOF' ? idProofSubType : farmDocSubType;

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
      errors.idProof = s4('errIdUpload');
    } else if (!idProofSubType) {
      // Defensive only -- the type picker gates the upload action itself (see DocUploadRow),
      // so a fresh upload can never reach here without a sub-type already set. This
      // catches a draft restored from before this field existed: the file is real, but there
      // is nothing to show a FARM_VERIFICATION reviewer which document it is. The fix is right
      // on this row (the "Change" affordance under it opens the same picker), so this is a
      // resolvable prompt, not a dead end.
      errors.idProof = s4('errIdType');
    }
    if (!farmDoc.fileUrl) {
      errors.farmDoc = s4('errFarmUpload');
    } else if (!farmDocSubType) {
      errors.farmDoc = s4('errFarmType');
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

  const anyUploading = idProof.uploading || farmDoc.uploading || certDoc.uploading;

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
            <BackButtonIcon size={20} />
          </TouchableOpacity>
          <View style={styles.headerTitleCol}>
            <Text style={[styles.headerTitle, { color: colors.textDark }]}>{t('farmer.registration.step4')}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSubtle }]}>{s4('stepOf')}</Text>
          </View>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={[styles.skipText, { color: colors.brandGreen }]}>{t('farmer.registration.step4.skip')}</Text>
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
          label={s4('idProofLabel')}
          required
          hint={s4('fileHint')}
          doc={idProof}
          fieldError={fieldErrors.idProof}
          colors={colors}
          subType={idProofSubType}
          onSelectType={() => setSubTypePickerFor('ID_PROOF')}
          onPress={() => {
            clearFieldError('idProof');
            pickAndUpload(applicationId, 'ID_PROOF', setIdProof);
          }}
          onRemove={() => setIdProof(makeEmptyDoc())}
        />

        {/* Farm Documents */}
        <DocUploadRow
          label={s4('farmDocLabel')}
          required
          hint={s4('fileHint')}
          doc={farmDoc}
          fieldError={fieldErrors.farmDoc}
          colors={colors}
          subType={farmDocSubType}
          onSelectType={() => setSubTypePickerFor('FARM_DOC')}
          onPress={() => {
            clearFieldError('farmDoc');
            pickAndUpload(applicationId, 'FARM_DOC', setFarmDoc);
          }}
          onRemove={() => setFarmDoc(makeEmptyDoc())}
        />

        {/* Certification (optional) */}
        <DocUploadRow
          label={t('farmer.registration.step4.certTitle')}
          required={false}
          hint={s4('certHintOptional')}
          doc={certDoc}
          colors={colors}
          onPress={() => pickAndUpload(applicationId, 'CERTIFICATE', setCertDoc)}
          onRemove={() => setCertDoc(makeEmptyDoc())}
        />

        <View style={styles.infoBox}>
          <View style={styles.infoIconContainer}>
            <Icon name="info" size={20} color={P.twBlue800} />
          </View>
          <Text style={styles.infoBoxText}>{t('farmer.registration.step4.certInfo')}</Text>
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.footer, { borderTopColor: colors.borderDivider, backgroundColor: colors.white }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.footerBtn, styles.backButton, { borderColor: colors.brandGreen, backgroundColor: colors.white }]}
          onPress={onBack}
        >
          <Text style={[styles.footerBtnText, { color: colors.brandGreen }]}>{t('farmer.registration.back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.footerBtn, styles.nextButton, {
            backgroundColor: colors.brandGreen,
            opacity: anyUploading ? 0.6 : 1,
          }]}
          onPress={handleContinue}
          disabled={anyUploading}
        >
          <Text style={[styles.footerBtnText, { color: colors.white }]}>{t('farmer.registration.step2.nextButton')}</Text>
        </TouchableOpacity>
      </View>

      {/* Document-type picker -- shared by the ID Proof and Farm Documents rows */}
      <Modal
        visible={subTypePickerFor !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setSubTypePickerFor(null)}
      >
        <ModalSafeArea style={styles.modalSafeRoot}>
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
                hitSlop={HIT_SLOP_8}
                style={styles.pickerCloseBtn}
              >
                <Icon name="close" size={20} color={colors.textSubtle} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
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
        </ModalSafeArea>
      </Modal>
    </View>
  );
};
