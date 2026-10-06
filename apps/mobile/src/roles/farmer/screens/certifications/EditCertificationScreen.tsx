import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import Svg, { Line, Path, Rect, Circle } from 'react-native-svg';
import { DatePicker } from '@tohfa/mobile-ui';
import { t } from '../../../../i18n/farmer';
import { authPalette as P, typography } from '../../theme';
import {
  deleteCertification,
  FALLBACK_CERT_EXPIRY_MAX_FUTURE_DAYS,
  FALLBACK_CERT_EXPIRY_MAX_PAST_DAYS,
  getSystemConfig,
  updateCertification,
  uploadCertificateDocument,
  type Certification,
} from '../../api/farmer';
import {
  buildCertificationPatch,
  CERT_TYPE_LABEL_KEY,
  CERTIFICATION_TYPES,
  certificationDisplayName,
  certificationErrorKind,
  editNeedsReverification,
  isoToDisplayDate,
  pickerDateToIso,
  renderFieldErrors,
  resolveCertificateContentType,
  serverCertificationFieldErrors,
  todayInKolkata,
  validateCertificationForm,
  type CertificationFormField,
  type CertificationFormInput,
} from './certificationForm';

// ─────────────────────────────────────────────
// SVG icons (inline, no extra dep)
// ─────────────────────────────────────────────

function CloseIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6L18 18M18 6L6 18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDown({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LabelAward({ size = 14, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="9" r="6" stroke={color} strokeWidth="2" />
      <Path d="M8.5 14L7 21L12 18.5L17 21L15.5 14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LabelBuilding({ size = 14, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="7" x2="12" y2="7.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="12" y1="11" x2="12" y2="11.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="12" y1="15" x2="12" y2="15.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function LabelCalendar({ size = 14, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="3" x2="8" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="3" x2="16" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function LabelDoc({ size = 14, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="8" x2="16" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PdfGlyph({ size = 22, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5z"
        stroke={color} strokeWidth="2" strokeLinejoin="round"
      />
      <Path d="M14 2v5h5" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M9.5 15.5h5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TrashIcon({ size = 15, color = P.twRed600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon({ size = 16, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12.5L10 17.5L19 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UploadIcon({ size = 20, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 16V5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M7 9L12 4L17 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────

type FieldErrorText = Partial<Record<CertificationFormField, string>>;

interface PickedDocument {
  name: string;
  size: string;
  uri: string;
  contentType: string;
}

interface EditCertificationScreenProps {
  certification: Certification;
  onCancel?: () => void;
  /** Called after the server accepted the edit, with the certificate it returned (BR-49: possibly reset to UNVERIFIED). */
  onSaved?: (updated: Certification) => void;
  /** Called after the certificate was deleted (BR-50), or turned out to be gone already. */
  onDeleted?: (id: string) => void;
}

export function EditCertificationScreen({
  certification,
  onCancel,
  onSaved,
  onDeleted,
}: EditCertificationScreenProps): React.JSX.Element {
  const [certType, setCertType] = useState<Certification['certType']>(certification.certType);
  const [customTypeName, setCustomTypeName] = useState<string>(certification.customTypeName ?? '');
  const [showTypeMenu, setShowTypeMenu] = useState<boolean>(false);
  const [certNumber, setCertNumber] = useState<string>(certification.certNumber);
  const [issuer, setIssuer] = useState<string>(certification.issuingBody);
  const [issuedOn, setIssuedOn] = useState<string>(isoToDisplayDate(certification.issuedOn));
  const [expiresOn, setExpiresOn] = useState<string>(isoToDisplayDate(certification.expiresOn));
  const [showIssuedPicker, setShowIssuedPicker] = useState<boolean>(false);
  const [showExpiresPicker, setShowExpiresPicker] = useState<boolean>(false);
  // A document picked in this session; uploaded on Save. Null = keep the stored one.
  const [newDoc, setNewDoc] = useState<PickedDocument | null>(null);
  const uploadedRef = useRef<{ uri: string; fileUrl: string } | null>(null);

  const [fieldErrors, setFieldErrors] = useState<FieldErrorText>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // Set synchronously: a second tap can land before the re-render disables the buttons.
  const submittingRef = useRef<boolean>(false);

  // BR-48 windows from system_config (GET /config/farmer). The fallbacks only
  // cover the moment before it loads; the server enforces its own values.
  const [maxPastDays, setMaxPastDays] = useState<number>(FALLBACK_CERT_EXPIRY_MAX_PAST_DAYS);
  const [maxFutureDays, setMaxFutureDays] = useState<number>(FALLBACK_CERT_EXPIRY_MAX_FUTURE_DAYS);
  useEffect(() => {
    let cancelled = false;
    void getSystemConfig().then((config) => {
      if (cancelled) return;
      setMaxPastDays(config.certExpiryMaxPastDays);
      setMaxFutureDays(config.certExpiryMaxFutureDays);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const clearFieldError = (field: CertificationFormField) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const formInput = (): CertificationFormInput => ({
    certType,
    customTypeName,
    certNumber,
    issuingBody: issuer,
    issuedOn: pickerDateToIso(issuedOn),
    expiresOn: pickerDateToIso(expiresOn),
  });

  /** The certificate was deleted elsewhere: say so and let the list refresh itself. */
  const showGone = () => {
    Alert.alert(t('farmer.certifications.edit.goneTitle'), t('farmer.certifications.edit.goneBody'), [
      { text: t('farmer.common.ok'), onPress: () => onDeleted?.(certification.id) },
    ]);
  };

  /** A request failed with something other than a field-level 422. */
  const showRequestError = (err: unknown, fallbackBodyKey: 'farmer.certifications.edit.saveFailedBody' | 'farmer.certifications.edit.deleteFailedBody') => {
    const kind = certificationErrorKind(err);
    if (kind === 'notFound') {
      showGone();
      return;
    }
    Alert.alert(
      t('farmer.certifications.add.errorTitle'),
      kind === 'network' ? t('farmer.listings.error.network') : t(fallbackBodyKey),
    );
  };

  /**
   * A 422 with a field `errors` map, shown under the fields. The form is
   * re-checked with freshly fetched config first (the windows may have changed
   * since this screen loaded), so a rule the app can reproduce is shown in the
   * farmer's language; otherwise the server's own message is. False when the
   * error is not one of these, for the generic handling.
   */
  const showServerFieldErrors = async (err: unknown): Promise<boolean> => {
    if (serverCertificationFieldErrors(err, {}) === null) return false;
    const config = await getSystemConfig();
    setMaxPastDays(config.certExpiryMaxPastDays);
    setMaxFutureDays(config.certExpiryMaxFutureDays);
    const recheck = validateCertificationForm(formInput(), {
      today: todayInKolkata(),
      maxPastDays: config.certExpiryMaxPastDays,
      maxFutureDays: config.certExpiryMaxFutureDays,
    });
    const mapped = serverCertificationFieldErrors(err, recheck.ok ? {} : recheck.errors);
    if (mapped === null) return false;
    setFieldErrors(renderFieldErrors(mapped.fields, t));
    if (mapped.other.length > 0) {
      Alert.alert(t('farmer.certifications.add.errorTitle'), mapped.other.join('\n'));
    }
    return true;
  };

  const performDelete = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      await deleteCertification(certification.id);
      onDeleted?.(certification.id);
    } catch (err) {
      showRequestError(err, 'farmer.certifications.edit.deleteFailedBody');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (submittingRef.current) return;
    Alert.alert(
      t('farmer.certifications.edit.deleteConfirmTitle'),
      t('farmer.certifications.edit.deleteConfirmBody', { number: certification.certNumber }),
      [
        { text: t('farmer.common.cancel'), style: 'cancel' },
        {
          text: t('farmer.certifications.edit.delete'),
          style: 'destructive',
          onPress: () => void performDelete(),
        },
      ],
    );
  };

  const handleSave = async () => {
    if (submittingRef.current) return;

    // BR-48 pre-check over the whole form, i.e. the merged result the server
    // validates a PATCH against; the server still decides.
    const checked = validateCertificationForm(formInput(), { today: todayInKolkata(), maxPastDays, maxFutureDays });
    if (!checked.ok) {
      setFieldErrors(renderFieldErrors(checked.errors, t));
      return;
    }
    setFieldErrors({});

    // Nothing changed: no request, just leave the screen.
    if (newDoc === null && Object.keys(buildCertificationPatch(certification, checked.value)).length === 0) {
      onCancel?.();
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      let documentUrl: string | undefined;
      if (newDoc !== null) {
        try {
          let uploaded = uploadedRef.current;
          if (uploaded?.uri !== newDoc.uri) {
            const { fileUrl } = await uploadCertificateDocument({
              uri: newDoc.uri,
              fileName: newDoc.name,
              contentType: newDoc.contentType,
            });
            uploaded = { uri: newDoc.uri, fileUrl };
            uploadedRef.current = uploaded;
          }
          documentUrl = uploaded.fileUrl;
        } catch {
          Alert.alert(t('farmer.certifications.add.errorTitle'), t('farmer.certifications.doc.error.uploadFailed'));
          return;
        }
      }

      const patch = buildCertificationPatch(certification, checked.value, documentUrl);
      const updated = await updateCertification(certification.id, patch);

      // BR-49: the server's answer decides what the farmer is told, not the local guess.
      const reset =
        updated.verificationStatus === 'UNVERIFIED' && certification.verificationStatus !== 'UNVERIFIED';
      Alert.alert(
        t('farmer.certifications.edit.savedTitle'),
        t(reset ? 'farmer.certifications.edit.savedReverifyBody' : 'farmer.certifications.edit.savedBody'),
        [{ text: t('farmer.common.ok'), onPress: () => onSaved?.(updated) }],
      );
    } catch (err) {
      const shown = await showServerFieldErrors(err);
      if (!shown) showRequestError(err, 'farmer.certifications.edit.saveFailedBody');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handlePickDocument = async () => {
    try {
      const picked = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
        copyTo: 'cachesDirectory',
      });
      const name = picked.name ?? t('farmer.certifications.doc.defaultName');
      const contentType = resolveCertificateContentType(name, picked.type);
      if (contentType === null) {
        Alert.alert(t('farmer.certifications.add.errorTitle'), t('farmer.certifications.doc.error.unsupported'));
        return;
      }
      const sizeMB = ((picked.size ?? 1024 * 1024) / (1024 * 1024)).toFixed(1);
      const kind = t(
        contentType === 'application/pdf' ? 'farmer.certifications.doc.kind.pdf' : 'farmer.certifications.doc.kind.image',
      );
      setNewDoc({
        name,
        size: t('farmer.certifications.doc.meta', { size: sizeMB, kind }),
        uri: picked.fileCopyUri ?? picked.uri,
        contentType,
      });
    } catch (err) {
      // A cancel is the farmer's own choice. Anything else is a real failure: say
      // so and change nothing -- never a stand-in document.
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert(t('farmer.certifications.add.errorTitle'), t('farmer.certifications.doc.error.pickFailed'));
      }
    }
  };

  const storedDocName = certification.documentUrl
    ? (certification.documentUrl.split('?')[0]?.split('/').pop() || certification.documentUrl)
    : null;

  return (
    <SafeAreaView style={E.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Header ── */}
      <View style={E.header}>
        <TouchableOpacity
          style={E.closeBtn}
          onPress={onCancel}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.certifications.edit.closeA11y')}
        >
          <CloseIcon />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={E.headerTitle}>{t('farmer.certifications.edit.title')}</Text>
          <Text style={E.headerSub} numberOfLines={1}>
            {t('farmer.certifications.edit.headerSub', {
              type: certificationDisplayName(certification, t),
              date: certification.issuedOn,
            })}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={E.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── BR-49: editing a verified / rejected certificate sends it back for verification ── */}
        {editNeedsReverification(certification.verificationStatus) ? (
          <View style={E.notice}>
            <Text style={E.noticeTxt}>{t('farmer.certifications.edit.reverifyNotice')}</Text>
          </View>
        ) : null}

        {/* ── Certification Type ── */}
        <View style={E.labelRow}>
          <LabelAward />
          <Text style={E.label}>{t('farmer.certifications.add.type')}</Text>
          <Text style={E.required}>*</Text>
        </View>
        <View style={{ position: 'relative' }}>
          <TouchableOpacity
            style={[E.input, fieldErrors.certType ? E.inputError : undefined]}
            activeOpacity={0.8}
            onPress={() => setShowTypeMenu((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.certifications.edit.selectTypeA11y')}
          >
            <Text style={E.inputText}>{t(CERT_TYPE_LABEL_KEY[certType])}</Text>
            <ChevronDown />
          </TouchableOpacity>
          {showTypeMenu ? (
            <View style={E.typeMenu}>
              {CERTIFICATION_TYPES.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={E.typeMenuItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setCertType(opt);
                    clearFieldError('certType');
                    setShowTypeMenu(false);
                  }}
                >
                  <Text style={[E.typeMenuText, certType === opt && { color: P.twGreen700, fontWeight: '700' }]}>
                    {t(CERT_TYPE_LABEL_KEY[opt])}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
        {fieldErrors.certType ? <Text style={E.errorText}>{fieldErrors.certType}</Text> : null}

        {certType === 'OTHER' ? (
          <View style={{ marginTop: 10 }}>
            <TextInput
              style={[E.textInput, fieldErrors.customTypeName ? E.inputError : undefined]}
              value={customTypeName}
              onChangeText={(v) => { setCustomTypeName(v); clearFieldError('customTypeName'); }}
              placeholder={t('farmer.certifications.add.otherNamePlaceholder')}
              placeholderTextColor={P.twGray400}
              accessibilityLabel={t('farmer.certifications.add.otherNamePlaceholder')}
            />
            {fieldErrors.customTypeName ? <Text style={E.errorText}>{fieldErrors.customTypeName}</Text> : null}
          </View>
        ) : null}

        {/* ── Certificate Number ── */}
        <View style={E.labelRow}>
          <LabelDoc />
          <Text style={E.label}>{t('farmer.certifications.add.number')}</Text>
          <Text style={E.required}>*</Text>
        </View>
        <TextInput
          style={[E.textInput, fieldErrors.certNumber ? E.inputError : undefined]}
          value={certNumber}
          onChangeText={(v) => { setCertNumber(v); clearFieldError('certNumber'); }}
          placeholder={t('farmer.certifications.add.number')}
          placeholderTextColor={P.twGray400}
        />
        {fieldErrors.certNumber ? <Text style={E.errorText}>{fieldErrors.certNumber}</Text> : null}

        {/* ── Certifying Body ── */}
        <View style={E.labelRow}>
          <LabelBuilding />
          <Text style={E.label}>{t('farmer.certifications.add.issuer')}</Text>
          <Text style={E.required}>*</Text>
        </View>
        <TextInput
          style={[E.textInput, fieldErrors.issuingBody ? E.inputError : undefined]}
          value={issuer}
          onChangeText={(v) => { setIssuer(v); clearFieldError('issuingBody'); }}
          placeholder={t('farmer.certifications.add.issuer')}
          placeholderTextColor={P.twGray400}
        />
        {fieldErrors.issuingBody ? <Text style={E.errorText}>{fieldErrors.issuingBody}</Text> : null}
        <Text style={E.helper}>{t('farmer.certifications.edit.issuerHelper')}</Text>

        {/* ── Issued On / Expires On ── */}
        <View style={E.datesRow}>
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              style={E.labelRow}
              activeOpacity={0.7}
              onPress={() => setShowIssuedPicker(true)}
            >
              <LabelCalendar />
              <Text style={E.label}>{t('farmer.certifications.add.issueDate')}</Text>
              <Text style={E.required}>*</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[E.dateWrapper, fieldErrors.issuedOn ? E.inputError : undefined]}
              activeOpacity={0.7}
              onPress={() => setShowIssuedPicker(true)}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.certifications.add.certifiedOnA11y')}
            >
              <Text style={[E.dateDisplayText, !issuedOn ? E.datePlaceholder : undefined]}>
                {issuedOn || t('farmer.certifications.add.datePlaceholder')}
              </Text>
              <LabelCalendar size={16} color={P.twGreen600} />
            </TouchableOpacity>
            {fieldErrors.issuedOn ? <Text style={E.errorText}>{fieldErrors.issuedOn}</Text> : null}
          </View>
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              style={E.labelRow}
              activeOpacity={0.7}
              onPress={() => setShowExpiresPicker(true)}
            >
              <LabelCalendar />
              <Text style={E.label}>{t('farmer.certifications.add.expiryDate')}</Text>
              <Text style={E.required}>*</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[E.dateWrapper, fieldErrors.expiresOn ? E.inputError : undefined]}
              activeOpacity={0.7}
              onPress={() => setShowExpiresPicker(true)}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.certifications.add.validUntilA11y')}
            >
              <Text style={[E.dateDisplayText, !expiresOn ? E.datePlaceholder : undefined]}>
                {expiresOn || t('farmer.certifications.add.datePlaceholder')}
              </Text>
              <LabelCalendar size={16} color={P.twGreen600} />
            </TouchableOpacity>
            {fieldErrors.expiresOn ? <Text style={E.errorText}>{fieldErrors.expiresOn}</Text> : null}
          </View>
        </View>

        {/* ── Certificate Document ── */}
        <View style={E.labelRow}>
          <LabelDoc />
          <Text style={E.label}>{t('farmer.certifications.add.doc')}</Text>
        </View>
        {newDoc !== null || storedDocName !== null ? (
          <View style={E.docCard}>
            <View style={E.docIconBox}>
              <PdfGlyph size={20} color={P.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={E.docName} numberOfLines={1}>
                {newDoc !== null ? newDoc.name : storedDocName}
              </Text>
              <Text style={E.docMeta}>
                {newDoc !== null ? newDoc.size : t('farmer.certifications.doc.attached')}
              </Text>
            </View>
            {newDoc !== null ? (
              // Discards the replacement only; the stored document stays as it was.
              <TouchableOpacity
                style={E.docRemoveBtn}
                onPress={() => setNewDoc(null)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.certifications.edit.removeDocA11y')}
              >
                <CloseIcon size={14} color={P.twRed600} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <TouchableOpacity
            style={E.uploadBox}
            activeOpacity={0.75}
            onPress={handlePickDocument}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.certifications.add.doc')}
          >
            <UploadIcon />
            <Text style={E.uploadTxt}>{t('farmer.certifications.edit.uploadPrompt')}</Text>
          </TouchableOpacity>
        )}
        {newDoc === null && storedDocName !== null ? (
          <TouchableOpacity
            style={E.replaceBtn}
            activeOpacity={0.75}
            onPress={handlePickDocument}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.certifications.edit.replaceDoc')}
          >
            <UploadIcon size={16} />
            <Text style={E.uploadTxt}>{t('farmer.certifications.edit.replaceDoc')}</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={E.helper}>{t('farmer.certifications.edit.uploadHelper')}</Text>

        {/* ── Delete ── */}
        <TouchableOpacity
          style={[E.deleteBtn, isSubmitting && { opacity: 0.7 }]}
          activeOpacity={0.75}
          onPress={handleDelete}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.certifications.edit.delete')}
          accessibilityState={{ disabled: isSubmitting }}
        >
          <TrashIcon />
          <Text style={E.deleteTxt}>{t('farmer.certifications.edit.delete')}</Text>
        </TouchableOpacity>

        <View style={{ height: 12 }} />
      </ScrollView>

      {/* ── Footer ── */}
      <View style={E.footer}>
        <TouchableOpacity style={E.cancelBtn} activeOpacity={0.8} onPress={onCancel} disabled={isSubmitting}>
          <Text style={E.cancelTxt}>{t('farmer.common.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[E.saveBtn, isSubmitting && { opacity: 0.7 }]}
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
        >
          <CheckIcon />
          <Text style={E.saveTxt}>{t('farmer.certifications.edit.save')}</Text>
        </TouchableOpacity>
      </View>
      {/* ── Date Pickers ── */}
      <DatePicker
        visible={showIssuedPicker}
        onClose={() => setShowIssuedPicker(false)}
        value={issuedOn}
        title={t('farmer.certifications.add.issuedPickerTitle')}
        format="DD/MM/YYYY"
        maxDate={new Date()}
        onSelect={(_date, formattedDate) => {
          setIssuedOn(formattedDate);
          clearFieldError('issuedOn');
          setShowIssuedPicker(false);
        }}
      />

      <DatePicker
        visible={showExpiresPicker}
        onClose={() => setShowExpiresPicker(false)}
        value={expiresOn}
        title={t('farmer.certifications.add.expiresPickerTitle')}
        format="DD/MM/YYYY"
        onSelect={(_date, formattedDate) => {
          setExpiresOn(formattedDate);
          clearFieldError('expiresOn');
          setShowExpiresPicker(false);
        }}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const E = StyleSheet.create({
  screen: { flex: 1, backgroundColor: P.paleStoneBg },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: P.white,
    borderBottomWidth: 1, borderBottomColor: P.surfaceMuted,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: P.mintTintBg,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: typography.title, fontWeight: '700', color: P.ink },
  headerSub: { fontSize: typography.bodySmall, color: P.twGray500, marginTop: 1 },

  scroll: { paddingHorizontal: 16, paddingTop: 18 },

  labelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 7, marginTop: 4,
  },
  label: { fontSize: typography.body, fontWeight: '700', color: P.twGray700 },
  required: { fontSize: typography.body, fontWeight: '700', color: P.twRed600 },

  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: P.twGray200,
    backgroundColor: P.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  // Standalone TextInput — no flexDirection so typed text is visible
  textInput: {
    borderWidth: 1.5,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    fontSize: typography.body,
    color: P.twGray900,
  },
  inputText: { fontSize: typography.body, color: P.twGray900, flex: 1 },
  helper: { fontSize: typography.caption, color: P.twGray400, marginTop: 6, lineHeight: 15 },
  inputError: { borderColor: P.twRed500 },
  errorText: { fontSize: typography.caption, color: P.twRed600, marginTop: 4 },
  notice: {
    backgroundColor: P.twAmber100,
    borderColor: P.twAmber300,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  noticeTxt: { fontSize: typography.body, color: P.twGray900, lineHeight: 19 },

  typeMenu: {
    position: 'absolute', top: 52, left: 0, right: 0,
    backgroundColor: P.white,
    borderRadius: 12,
    borderWidth: 1, borderColor: P.twGray200,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 10, elevation: 6,
    zIndex: 50,
    overflow: 'hidden',
  },
  typeMenuItem: {
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: P.surfaceMuted,
  },
  typeMenuText: { fontSize: typography.body, color: P.twGray900 },

  datesRow: { flexDirection: 'row', gap: 12 },

  dateInput: { gap: 8 },
  dateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    gap: 8,
  },
  dateDisplayText: {
    flex: 1,
    fontSize: typography.body,
    color: P.twGray900,
    fontWeight: '500',
  },
  datePlaceholder: {
    color: P.twGray400,
    fontWeight: '400',
  },

  docCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: P.twGreen50,
    borderRadius: 14,
    borderWidth: 1.5, borderColor: P.twGreen300,
    padding: 12,
  },
  docIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: P.twGreen600,
    alignItems: 'center', justifyContent: 'center',
  },
  docName: { fontSize: typography.body, fontWeight: '700', color: P.twGray900 },
  docMeta: { fontSize: typography.caption, color: P.twGray500, marginTop: 2 },
  docRemoveBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: P.twRed100,
    alignItems: 'center', justifyContent: 'center',
  },

  uploadBox: {
    alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: P.twGreen300,
    borderStyle: 'dashed',
    borderRadius: 14,
    backgroundColor: P.twGreen50,
    paddingVertical: 24,
  },
  uploadTxt: { fontSize: typography.body, fontWeight: '600', color: P.twGreen700 },
  replaceBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: P.twGreen300, borderStyle: 'dashed',
    borderRadius: 12, backgroundColor: P.twGreen50,
    paddingVertical: 10, marginTop: 10,
  },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: P.twRed300,
    backgroundColor: P.white,
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 20,
  },
  deleteTxt: { fontSize: typography.body, fontWeight: '600', color: P.twRed600 },

  footer: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: P.white,
    borderTopWidth: 1, borderTopColor: P.surfaceMuted,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5, borderColor: P.twGray200,
    backgroundColor: P.white,
    paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelTxt: { fontSize: typography.bodyLarge, fontWeight: '600', color: P.twGray700 },
  saveBtn: {
    flex: 1.4,
    flexDirection: 'row',
    backgroundColor: P.twGreen700,
    paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  saveTxt: { fontSize: typography.bodyLarge, fontWeight: '700', color: P.white },
});
