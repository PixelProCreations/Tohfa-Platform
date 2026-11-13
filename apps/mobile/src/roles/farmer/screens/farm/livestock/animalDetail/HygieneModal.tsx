import React from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { authPalette as P } from '../../../../theme';
import { t } from '../../../../../../i18n/farmer';
import { createHygieneLog } from '../../../../api/livestock';
import { INPUT_MAX_LENGTH, buildHygieneLogBody } from '../animalRecordForms';
import { localTodayIso } from '../animalRecordView';
import { type PagedRecords } from '../useAnimalRecords';
import { styles } from './styles';
import {
  GreenBackArrowIcon,
  FormCalendarIcon,
  FormCheckmarkIcon,
} from '../../../../assets/icons/AssetIcons';
import { FormErrors, type RecordModalContext } from './shared';
import { useFields } from './useFields';

/** Hygiene log form state. */
export function useHygieneForm() {
  return useFields({
    isAddHygieneModalVisible: false,
    hygieneActivity: '',
    hygieneDate: '',
    hygieneNotes: '',
    hygieneErrors: [] as string[],
  });
}

export type HygieneForm = ReturnType<typeof useHygieneForm>;

/** Resets the form and opens the modal (moved unchanged from the screen). */
export function openHygieneModal({
  setHygieneActivity,
  setHygieneDate,
  setHygieneNotes,
  setHygieneErrors,
  setIsAddHygieneModalVisible,
}: HygieneForm): void {
  setHygieneActivity('');
  setHygieneDate(localTodayIso());
  setHygieneNotes('');
  setHygieneErrors([]);
  setIsAddHygieneModalVisible(true);
}

export interface HygieneModalProps {
  form: HygieneForm;
  ctx: RecordModalContext;
  hygieneList: Pick<PagedRecords<unknown>, 'refresh'>;
}

/** Add hygiene log modal (POST .../hygiene-logs). */
export function HygieneModal({ form, ctx, hygieneList }: HygieneModalProps): React.JSX.Element {
  const {
    isAddHygieneModalVisible,
    setIsAddHygieneModalVisible,
    hygieneActivity,
    setHygieneActivity,
    hygieneDate,
    setHygieneDate,
    hygieneNotes,
    setHygieneNotes,
    hygieneErrors,
    setHygieneErrors,
  } = form;
  const { animalId, saving, displayName, submitRecord } = ctx;

  const handleSaveHygieneLog = async (): Promise<void> => {
    if (!animalId || saving) return;
    const saved = await submitRecord(
      buildHygieneLogBody({
        activity: hygieneActivity,
        performedOn: hygieneDate,
        notes: hygieneNotes,
      }),
      setHygieneErrors,
      null,
      (body) => createHygieneLog(animalId, body),
    );
    if (!saved) return;
    hygieneList.refresh();
    setIsAddHygieneModalVisible(false);
    Alert.alert(
      t('farmer.livestock.detail.common.savedTitle'),
      t('farmer.livestock.detail.housing.hygieneSavedBody', { name: displayName }),
    );
  };

  return (
    <Modal
      visible={isAddHygieneModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setIsAddHygieneModalVisible(false)}
    >
      <SafeAreaView style={styles.modalSafeArea}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalBackBtn}
            onPress={() => setIsAddHygieneModalVisible(false)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.livestock.detail.a11y.back')}
          >
            <GreenBackArrowIcon size={24} color={P.deepGreen} />
          </TouchableOpacity>
          <Text style={styles.modalHeaderTitle}>
            {t('farmer.livestock.detail.housing.addHygiene')}
          </Text>
        </View>

        <ScrollView
          style={styles.modalScrollView}
          contentContainerStyle={styles.modalScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Activity * */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              {t('farmer.livestock.detail.field.activity')}{' '}
              <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TextInput
              style={styles.formTextInput}
              value={hygieneActivity}
              testID="hygieneForm.activity"
              onChangeText={setHygieneActivity}
              placeholder={t('farmer.livestock.detail.hygieneForm.activityPlaceholder')}
              placeholderTextColor={P.twGray400}
              maxLength={INPUT_MAX_LENGTH.short}
            />
          </View>

          {/* Date performed * */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              {t('farmer.livestock.detail.field.performedOn')}{' '}
              <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.formInputContainer}>
              <FormCalendarIcon size={18} color={P.twGray500} />
              <TextInput
                style={styles.formInputWithIcon}
                value={hygieneDate}
                testID="hygieneForm.date"
                onChangeText={setHygieneDate}
                placeholder={t('farmer.livestock.detail.common.datePlaceholder')}
                placeholderTextColor={P.twGray400}
                maxLength={INPUT_MAX_LENGTH.date}
              />
            </View>
          </View>

          {/* Notes */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.notes')}</Text>
            <TextInput
              style={styles.formNotesInput}
              value={hygieneNotes}
              testID="hygieneForm.notes"
              onChangeText={setHygieneNotes}
              placeholderTextColor={P.twGray400}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={INPUT_MAX_LENGTH.long}
            />
          </View>

          <FormErrors errors={hygieneErrors} testID="hygieneForm.errors" />

          <View style={styles.modalActionButtonsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setIsAddHygieneModalVisible(false)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.common.cancel')}
              testID="hygieneForm.cancel"
            >
              <Text style={styles.cancelBtnText}>{t('farmer.livestock.detail.common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnBusy]}
              onPress={() => void handleSaveHygieneLog()}
              disabled={saving}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ disabled: saving, busy: saving }}
              accessibilityLabel={t('farmer.livestock.detail.common.save')}
              testID="hygieneForm.save"
            >
              <View style={styles.saveBtnRow}>
                <FormCheckmarkIcon size={18} color={P.white} />
                <Text style={styles.saveBtnText}>
                  {saving
                    ? t('farmer.livestock.detail.common.saving')
                    : t('farmer.livestock.detail.common.save')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
