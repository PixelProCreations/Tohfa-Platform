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
import { createFeedLog } from '../../../../api/livestock';
import {
  INPUT_MAX_LENGTH,
  buildFeedLogBody,
  FEED_LOG_UNIT_OPTIONS,
  FEED_TYPE_OPTIONS,
  optionLabel,
  optionValues,
} from '../animalRecordForms';

import { localTodayIso } from '../animalRecordView';
import { type PagedRecords } from '../useAnimalRecords';
import { styles } from './styles';
import {
  GreenBackArrowIcon,
  FormCalendarIcon,
  FormChevronDownIcon,
  FormCheckmarkIcon,
} from '../../../../assets/icons/AssetIcons';
import { FormErrors, type RecordModalContext } from './shared';
import { useFields } from './useFields';

/** Daily feed log form state. */
export function useFeedLogForm() {
  return useFields({
    isAddFeedLogModalVisible: false,
    feedLogDate: '',
    feedLogType: 'GREEN_FODDER' as string,
    isFeedLogTypeDropdownOpen: false,
    feedLogQuantity: '',
    feedLogUnit: 'KG' as string,
    isFeedLogUnitDropdownOpen: false,
    feedLogNotes: '',
    feedLogErrors: [] as string[],
  });
}

export type FeedLogForm = ReturnType<typeof useFeedLogForm>;

/** Resets the form and opens the modal (moved unchanged from the screen). */
export function openFeedLogModal({
  setFeedLogDate,
  setFeedLogQuantity,
  setFeedLogNotes,
  setFeedLogErrors,
  setIsAddFeedLogModalVisible,
}: FeedLogForm): void {
  // Pre-filled with today; the farmer can change it (the date is required in the form).
  setFeedLogDate(localTodayIso());
  setFeedLogQuantity('');
  setFeedLogNotes('');
  setFeedLogErrors([]);
  setIsAddFeedLogModalVisible(true);
}

export interface FeedLogModalProps {
  form: FeedLogForm;
  ctx: RecordModalContext;
  feedLogList: Pick<PagedRecords<unknown>, 'refresh'>;
}

/** Add daily feed log modal (POST .../feed-logs). */
export function FeedLogModal({ form, ctx, feedLogList }: FeedLogModalProps): React.JSX.Element {
  const {
    isAddFeedLogModalVisible,
    setIsAddFeedLogModalVisible,
    feedLogDate,
    setFeedLogDate,
    feedLogType,
    setFeedLogType,
    isFeedLogTypeDropdownOpen,
    setIsFeedLogTypeDropdownOpen,
    feedLogQuantity,
    setFeedLogQuantity,
    feedLogUnit,
    setFeedLogUnit,
    isFeedLogUnitDropdownOpen,
    setIsFeedLogUnitDropdownOpen,
    feedLogNotes,
    setFeedLogNotes,
    feedLogErrors,
    setFeedLogErrors,
  } = form;
  const { animalId, saving, displayName, submitRecord } = ctx;

  const handleSaveFeedLog = async (): Promise<void> => {
    if (!animalId || saving) return;
    const saved = await submitRecord(
      buildFeedLogBody({
        fedOn: feedLogDate,
        feedType: feedLogType,
        quantity: feedLogQuantity,
        unit: feedLogUnit,
        notes: feedLogNotes,
      }),
      setFeedLogErrors,
      null,
      (body) => createFeedLog(animalId, body),
    );
    if (!saved) return;
    feedLogList.refresh();
    setIsAddFeedLogModalVisible(false);
    Alert.alert(
      t('farmer.livestock.detail.common.savedTitle'),
      t('farmer.livestock.detail.feed.logSavedBody', { name: displayName }),
    );
  };

  return (
    <Modal
      visible={isAddFeedLogModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setIsAddFeedLogModalVisible(false)}
    >
      <SafeAreaView style={styles.modalSafeArea}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalBackBtn}
            onPress={() => setIsAddFeedLogModalVisible(false)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.livestock.detail.a11y.back')}
          >
            <GreenBackArrowIcon size={24} color={P.deepGreen} />
          </TouchableOpacity>
          <Text style={styles.modalHeaderTitle}>{t('farmer.livestock.detail.feed.addLog')}</Text>
        </View>

        <ScrollView
          style={styles.modalScrollView}
          contentContainerStyle={styles.modalScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Feeding date * */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              {t('farmer.livestock.detail.field.fedOn')}{' '}
              <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.formInputContainer}>
              <FormCalendarIcon size={18} color={P.twGray500} />
              <TextInput
                style={styles.formInputWithIcon}
                value={feedLogDate}
                testID="feedLogForm.date"
                onChangeText={setFeedLogDate}
                placeholder={t('farmer.livestock.detail.common.datePlaceholder')}
                placeholderTextColor={P.twGray400}
                maxLength={INPUT_MAX_LENGTH.date}
              />
            </View>
          </View>

          {/* Feed type * (dropdown of the API enum, translated labels) */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              {t('farmer.livestock.detail.field.feedType')}{' '}
              <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.formDropdownTrigger}
              onPress={() => setIsFeedLogTypeDropdownOpen(!isFeedLogTypeDropdownOpen)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.field.feedType')}
              testID="feedLogForm.feedTypeTrigger"
            >
              <Text style={styles.formDropdownSelectedText}>
                {optionLabel(FEED_TYPE_OPTIONS, feedLogType)}
              </Text>
              <FormChevronDownIcon size={18} color={P.twGray500} />
            </TouchableOpacity>
            {isFeedLogTypeDropdownOpen && (
              <View style={styles.formDropdownMenu}>
                {optionValues(FEED_TYPE_OPTIONS).map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.formDropdownItem,
                      feedLogType === value && styles.formDropdownItemActive,
                    ]}
                    onPress={() => {
                      setFeedLogType(value);
                      setIsFeedLogTypeDropdownOpen(false);
                    }}
                    testID={`feedLogForm.feedType:${value}`}
                  >
                    <Text
                      style={[
                        styles.formDropdownItemText,
                        feedLogType === value && styles.formDropdownItemTextActive,
                      ]}
                    >
                      {optionLabel(FEED_TYPE_OPTIONS, value)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Quantity * + unit * */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              {t('farmer.livestock.detail.field.quantity')}{' '}
              <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.formRowHalf}>
              <View style={styles.formFlexWide}>
                <TextInput
                  style={styles.formTextInput}
                  value={feedLogQuantity}
                  testID="feedLogForm.quantity"
                  onChangeText={setFeedLogQuantity}
                  keyboardType="decimal-pad"
                  placeholderTextColor={P.twGray400}
                  maxLength={INPUT_MAX_LENGTH.decimal}
                />
              </View>
              <View style={styles.formFlexNarrow}>
                <TouchableOpacity
                  style={styles.formDropdownTrigger}
                  onPress={() => setIsFeedLogUnitDropdownOpen(!isFeedLogUnitDropdownOpen)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.field.unit')}
                  testID="feedLogForm.unitTrigger"
                >
                  <Text style={styles.formDropdownSelectedText}>
                    {optionLabel(FEED_LOG_UNIT_OPTIONS, feedLogUnit)}
                  </Text>
                  <FormChevronDownIcon size={18} color={P.twGray500} />
                </TouchableOpacity>
                {isFeedLogUnitDropdownOpen && (
                  <View style={styles.formDropdownMenu}>
                    {optionValues(FEED_LOG_UNIT_OPTIONS).map((value) => (
                      <TouchableOpacity
                        key={value}
                        style={[
                          styles.formDropdownItem,
                          feedLogUnit === value && styles.formDropdownItemActive,
                        ]}
                        onPress={() => {
                          setFeedLogUnit(value);
                          setIsFeedLogUnitDropdownOpen(false);
                        }}
                        testID={`feedLogForm.unit:${value}`}
                      >
                        <Text
                          style={[
                            styles.formDropdownItemText,
                            feedLogUnit === value && styles.formDropdownItemTextActive,
                          ]}
                        >
                          {optionLabel(FEED_LOG_UNIT_OPTIONS, value)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.notes')}</Text>
            <TextInput
              style={styles.formNotesInput}
              value={feedLogNotes}
              testID="feedLogForm.notes"
              onChangeText={setFeedLogNotes}
              placeholderTextColor={P.twGray400}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={INPUT_MAX_LENGTH.long}
            />
          </View>

          <FormErrors errors={feedLogErrors} testID="feedLogForm.errors" />

          <View style={styles.modalActionButtonsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setIsAddFeedLogModalVisible(false)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.common.cancel')}
              testID="feedLogForm.cancel"
            >
              <Text style={styles.cancelBtnText}>{t('farmer.livestock.detail.common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnBusy]}
              onPress={() => void handleSaveFeedLog()}
              disabled={saving}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ disabled: saving, busy: saving }}
              accessibilityLabel={t('farmer.livestock.detail.common.save')}
              testID="feedLogForm.save"
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
