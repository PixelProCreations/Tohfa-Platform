import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { TextInputInstance } from 'react-native';
import { ModalSafeArea } from '@tohfa/mobile-ui';
import { useTheme } from '../../../theme';
import { t } from '../../../../../i18n/farmer';
import { styles } from './styles';
import { sanitizeAcresText } from './locationUtils';
import {
  AREA_ACRES_INPUT_MAX_LENGTH,
  LOCATION_LABEL_MAX_LENGTH,
  validateAreaAcres,
  validateLocationLabel,
} from '../locationInputRules';
import { errorMessage } from '../../../utils/validation';

interface DetailsModalProps {
  visible: boolean;
  activeIndex: number;
  count: number;
  draftLabel: string;
  draftAreaAcresText: string;
  labelError: string | undefined;
  areaError: string | undefined;
  areaInputRef: React.RefObject<TextInputInstance>;
  onChangeLabel: (text: string) => void;
  onChangeArea: (text: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

/**
 * Location-details popup: the active parcel's name and area. Same RN `Modal` treatment as
 * Step4Documents' picker (transparent, fade, Android back = dismiss); @tohfa/mobile-ui has
 * no shared dialog to reuse. The scrim is deliberately NOT tap-to-dismiss: this holds typed
 * input, and a stray tap outside the card should not throw it away.
 */
export const DetailsModal: React.FC<DetailsModalProps> = ({
  visible,
  activeIndex,
  count,
  draftLabel,
  draftAreaAcresText,
  labelError,
  areaError,
  areaInputRef,
  onChangeLabel,
  onChangeArea,
  onCancel,
  onSave,
}) => {
  const { colors } = useTheme();
  // Per-field errors appear after that field is left, or after a Save attempt. The parent's own
  // errors (from Next / Add Location) are shown until the farmer edits the field they are about.
  const [touched, setTouched] = useState({ label: false, area: false });
  const [dirty, setDirty] = useState({ label: false, area: false });
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    if (visible) {
      setTouched({ label: false, area: false });
      setDirty({ label: false, area: false });
      setSubmitted(false);
    }
  }, [visible]);
  const localLabelError = errorMessage(validateLocationLabel(draftLabel), t);
  const localAreaError = errorMessage(validateAreaAcres(draftAreaAcresText), t);
  const shownLabelError =
    (touched.label || submitted ? localLabelError : undefined) ?? (dirty.label ? undefined : labelError);
  const shownAreaError =
    (touched.area || submitted ? localAreaError : undefined) ?? (dirty.area ? undefined : areaError);
  const handleSave = () => {
    setSubmitted(true);
    if (localLabelError || localAreaError) return;
    onSave();
  };
  const inputColors = {
    borderColor: colors.borderLight,
    color: colors.textDark,
    backgroundColor: colors.white,
  };
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onCancel}
    >
      <ModalSafeArea style={styles.modalSafeRoot}>
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalScrim} pointerEvents="none" />
        <View style={styles.detailsCard}>
          <Text style={[styles.detailsTitle, { color: colors.textDark }]}>
            {t('farmer.registration.step3.locationDetailsTitle')}
          </Text>
          <Text style={[styles.detailsSubtitle, { color: colors.textSubtle }]}>
            {t('farmer.registration.step3.locationDetailsSubtitle', {
              index: activeIndex + 1,
              count,
            })}
          </Text>

          <Text style={[styles.fieldLabel, styles.detailsFieldLabel, { color: colors.textBody }]}>
            {t('farmer.registration.step3.locationNameLabel')}{' '}
            <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <TextInput
            style={[styles.fieldInput, inputColors, shownLabelError ? styles.inputError : null]}
            value={draftLabel}
            onChangeText={(text) => {
              setDirty((d) => ({ ...d, label: true }));
              onChangeLabel(text);
            }}
            onBlur={() => setTouched((v) => ({ ...v, label: true }))}
            maxLength={LOCATION_LABEL_MAX_LENGTH}
            placeholder={t('farmer.registration.step3.locationNamePlaceholder')}
            placeholderTextColor={colors.textPlaceholder}
            autoFocus={true}
            returnKeyType="next"
            onSubmitEditing={() => areaInputRef.current?.focus()}
            testID="step3-location-name-input"
          />
          {shownLabelError ? <Text style={styles.fieldErrorText}>{shownLabelError}</Text> : null}

          <Text style={[styles.fieldLabel, styles.detailsFieldLabel, { color: colors.textBody }]}>
            {t('farmer.registration.step3.areaAcresLabel')}{' '}
            <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <TextInput
            ref={areaInputRef}
            style={[styles.fieldInput, inputColors, shownAreaError ? styles.inputError : null]}
            value={draftAreaAcresText}
            onChangeText={(text) => {
              setDirty((d) => ({ ...d, area: true }));
              onChangeArea(sanitizeAcresText(text));
            }}
            onBlur={() => setTouched((v) => ({ ...v, area: true }))}
            onSubmitEditing={handleSave}
            maxLength={AREA_ACRES_INPUT_MAX_LENGTH}
            keyboardType="decimal-pad"
            placeholder={t('farmer.registration.step3.areaAcresPlaceholder')}
            placeholderTextColor={colors.textPlaceholder}
            testID="step3-location-area-input"
          />
          {shownAreaError ? <Text style={styles.fieldErrorText}>{shownAreaError}</Text> : null}

          <View style={styles.detailsActions}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.detailsActionBtn,
                styles.backButton,
                { borderColor: colors.brandGreen, backgroundColor: colors.white },
              ]}
              onPress={onCancel}
              testID="step3-location-details-cancel"
            >
              <Text style={[styles.footerBtnText, { color: colors.brandGreen }]}>
                {t('farmer.common.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.detailsActionBtn,
                styles.nextButton,
                { backgroundColor: colors.brandGreen },
              ]}
              onPress={handleSave}
              testID="step3-location-details-save"
            >
              <Text style={[styles.footerBtnText, { color: colors.white }]}>
                {t('farmer.common.save')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      </ModalSafeArea>
    </Modal>
  );
};
