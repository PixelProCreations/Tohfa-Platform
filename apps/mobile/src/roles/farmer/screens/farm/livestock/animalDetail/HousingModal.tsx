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
import { authPalette as P, colors } from '../../../../theme';
import { t } from '../../../../../../i18n/farmer';
import { createHousingRecord } from '../../../../api/livestock';
import {
  INPUT_MAX_LENGTH,
  HOUSING_TYPE_OPTIONS,
  SPACE_UNIT_OPTIONS,
  buildHousingRecordBody,
  optionLabel,
  optionValues,
} from '../animalRecordForms';

import { type PagedRecords } from '../useAnimalRecords';
import { styles } from './styles';
import {
  GreenBackArrowIcon,
  FormCalendarIcon,
  FormChevronDownIcon,
  FormCloseIcon,
  FormPlusIcon,
  AttachmentPaperclipIcon,
  ReceiptDocIcon,
  FormCheckmarkIcon,
  PlusCircleOutlineIcon,
} from '../../../../assets/icons/AssetIcons';
import {
  FormErrors,
  ModalAnimalCard,
  type AttachmentState,
  type RecordModalContext,
} from './shared';
import { useFields } from './useFields';

/** Add Housing Details form state. */
export function useHousingForm() {
  return useFields({
    isAddHousingModalVisible: false,
    housingType: 'BARN' as string,
    isHousingTypeDropdownOpen: false,
    housingBarnName: '',
    housingLocation: '',
    indoorSpace: '',
    indoorSpaceUnit: 'SQ_FT' as string,
    isIndoorSpaceUnitDropdownOpen: false,
    outdoorSpace: '',
    outdoorSpaceUnit: 'SQ_FT' as string,
    isOutdoorSpaceUnitDropdownOpen: false,
    housingStartDate: '',
    housingNotes: '',
    housingAttachment: null as AttachmentState,
    housingErrors: [] as string[],
  });
}

export type HousingForm = ReturnType<typeof useHousingForm>;

export interface HousingModalProps {
  form: HousingForm;
  ctx: RecordModalContext;
  housingList: Pick<PagedRecords<unknown>, 'refresh'>;
}

/** Add Housing Details modal. */
export function HousingModal({ form, ctx, housingList }: HousingModalProps): React.JSX.Element {
  const {
    isAddHousingModalVisible,
    setIsAddHousingModalVisible,
    housingType,
    setHousingType,
    isHousingTypeDropdownOpen,
    setIsHousingTypeDropdownOpen,
    housingBarnName,
    setHousingBarnName,
    housingLocation,
    setHousingLocation,
    indoorSpace,
    setIndoorSpace,
    indoorSpaceUnit,
    setIndoorSpaceUnit,
    isIndoorSpaceUnitDropdownOpen,
    setIsIndoorSpaceUnitDropdownOpen,
    outdoorSpace,
    setOutdoorSpace,
    outdoorSpaceUnit,
    setOutdoorSpaceUnit,
    isOutdoorSpaceUnitDropdownOpen,
    setIsOutdoorSpaceUnitDropdownOpen,
    housingStartDate,
    setHousingStartDate,
    housingNotes,
    setHousingNotes,
    housingAttachment,
    setHousingAttachment,
    housingErrors,
    setHousingErrors,
  } = form;
  const {
    animalId,
    saving,
    displayName,
    summary,
    submitRecord,
    handlePickAttachment,
    attachmentSizeLabel,
  } = ctx;

  const handleSaveHousingDetails = async (): Promise<void> => {
    if (!animalId || saving) return;
    const saved = await submitRecord(
      buildHousingRecordBody({
        housingType,
        housingName: housingBarnName,
        location: housingLocation,
        indoorSpace,
        indoorUnit: indoorSpaceUnit,
        outdoorSpace,
        outdoorUnit: outdoorSpaceUnit,
        startDate: housingStartDate,
        notes: housingNotes,
      }),
      setHousingErrors,
      housingAttachment,
      (body) => createHousingRecord(animalId, body),
    );
    if (!saved) return;
    housingList.refresh();
    setHousingAttachment(null);
    setIsAddHousingModalVisible(false);
    Alert.alert(
      t('farmer.livestock.detail.common.savedTitle'),
      t('farmer.livestock.detail.housing.savedBody', { name: displayName }),
    );
  };

  return (
    <Modal
      visible={isAddHousingModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setIsAddHousingModalVisible(false)}
    >
      <SafeAreaView style={styles.modalSafeArea}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalBackBtn}
            onPress={() => setIsAddHousingModalVisible(false)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.livestock.detail.a11y.back')}
          >
            <GreenBackArrowIcon size={24} color={P.deepGreen} />
          </TouchableOpacity>
          <Text style={styles.modalHeaderTitle}>
            {t('farmer.livestock.detail.housing.addRecord')}
          </Text>
        </View>

        <ScrollView
          style={styles.modalScrollView}
          contentContainerStyle={styles.modalScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Animal Summary Card */}
          <ModalAnimalCard summary={summary} />

          {/* Housing Type * (Dropdown) */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              {t('farmer.livestock.detail.field.housingType')}{' '}
              <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.formDropdownTrigger}
              onPress={() => setIsHousingTypeDropdownOpen(!isHousingTypeDropdownOpen)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.a11y.selectHousingType')}
            >
              <Text style={styles.formDropdownSelectedText}>
                {optionLabel(HOUSING_TYPE_OPTIONS, housingType)}
              </Text>
              <FormChevronDownIcon size={18} color={P.twGray500} />
            </TouchableOpacity>
            {isHousingTypeDropdownOpen && (
              <View style={styles.formDropdownMenu}>
                {optionValues(HOUSING_TYPE_OPTIONS).map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.formDropdownItem,
                      housingType === item && styles.formDropdownItemActive,
                    ]}
                    onPress={() => {
                      setHousingType(item);
                      setIsHousingTypeDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.formDropdownItemText,
                        housingType === item && styles.formDropdownItemTextActive,
                      ]}
                    >
                      {optionLabel(HOUSING_TYPE_OPTIONS, item)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Housing / Barn name * */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              {t('farmer.livestock.detail.housingForm.housingName')}{' '}
              <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TextInput
              style={styles.formTextInput}
              value={housingBarnName}
              testID="housingForm.name"
              onChangeText={setHousingBarnName}
              placeholder=""
              placeholderTextColor={P.twGray400}
              maxLength={INPUT_MAX_LENGTH.short}
            />
          </View>

          {/* Location */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.location')}</Text>
            <TextInput
              style={styles.formTextInput}
              value={housingLocation}
              onChangeText={setHousingLocation}
              placeholder=""
              placeholderTextColor={P.twGray400}
              maxLength={INPUT_MAX_LENGTH.short}
            />
          </View>

          {/* Indoor space per animal * */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              {t('farmer.livestock.detail.field.indoorSpace')}{' '}
              <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.formRowHalf}>
              <View style={styles.flexRatio15}>
                <TextInput
                  style={styles.formTextInput}
                  value={indoorSpace}
                  testID="housingForm.indoorSpace"
                  onChangeText={setIndoorSpace}
                  keyboardType="decimal-pad"
                  placeholder=""
                  placeholderTextColor={P.twGray400}
                  maxLength={INPUT_MAX_LENGTH.decimal}
                />
              </View>
              <View style={styles.flexRatio10}>
                <TouchableOpacity
                  style={styles.formDropdownTrigger}
                  onPress={() => setIsIndoorSpaceUnitDropdownOpen(!isIndoorSpaceUnitDropdownOpen)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.a11y.selectIndoorSpaceUnit')}
                >
                  <Text style={styles.formDropdownSelectedText}>
                    {optionLabel(SPACE_UNIT_OPTIONS, indoorSpaceUnit)}
                  </Text>
                  <FormChevronDownIcon size={18} color={P.twGray500} />
                </TouchableOpacity>
                {isIndoorSpaceUnitDropdownOpen && (
                  <View style={styles.formDropdownMenu}>
                    {optionValues(SPACE_UNIT_OPTIONS).map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.formDropdownItem,
                          indoorSpaceUnit === opt && styles.formDropdownItemActive,
                        ]}
                        onPress={() => {
                          setIndoorSpaceUnit(opt);
                          setIsIndoorSpaceUnitDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.formDropdownItemText,
                            indoorSpaceUnit === opt && styles.formDropdownItemTextActive,
                          ]}
                        >
                          {optionLabel(SPACE_UNIT_OPTIONS, opt)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Outdoor / grazing space * */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              {t('farmer.livestock.detail.housingForm.outdoorSpace')}{' '}
              <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.formRowHalf}>
              <View style={styles.flexRatio15}>
                <TextInput
                  style={styles.formTextInput}
                  value={outdoorSpace}
                  testID="housingForm.outdoorSpace"
                  onChangeText={setOutdoorSpace}
                  keyboardType="decimal-pad"
                  placeholder=""
                  placeholderTextColor={P.twGray400}
                  maxLength={INPUT_MAX_LENGTH.decimal}
                />
              </View>
              <View style={styles.flexRatio10}>
                <TouchableOpacity
                  style={styles.formDropdownTrigger}
                  onPress={() => setIsOutdoorSpaceUnitDropdownOpen(!isOutdoorSpaceUnitDropdownOpen)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.a11y.selectOutdoorSpaceUnit')}
                >
                  <Text style={styles.formDropdownSelectedText}>
                    {optionLabel(SPACE_UNIT_OPTIONS, outdoorSpaceUnit)}
                  </Text>
                  <FormChevronDownIcon size={18} color={P.twGray500} />
                </TouchableOpacity>
                {isOutdoorSpaceUnitDropdownOpen && (
                  <View style={styles.formDropdownMenu}>
                    {optionValues(SPACE_UNIT_OPTIONS).map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.formDropdownItem,
                          outdoorSpaceUnit === opt && styles.formDropdownItemActive,
                        ]}
                        onPress={() => {
                          setOutdoorSpaceUnit(opt);
                          setIsOutdoorSpaceUnitDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.formDropdownItemText,
                            outdoorSpaceUnit === opt && styles.formDropdownItemTextActive,
                          ]}
                        >
                          {optionLabel(SPACE_UNIT_OPTIONS, opt)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Start date * */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              {t('farmer.livestock.detail.field.startDate')}{' '}
              <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.formInputContainer}>
              <FormCalendarIcon size={18} color={P.twGray500} />
              <TextInput
                style={styles.formInputWithIcon}
                value={housingStartDate}
                testID="housingForm.startDate"
                onChangeText={setHousingStartDate}
                placeholder=""
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
              value={housingNotes}
              onChangeText={setHousingNotes}
              placeholder=""
              placeholderTextColor={P.twGray400}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={INPUT_MAX_LENGTH.long}
            />
          </View>

          {/* Attachment Document */}
          <View style={styles.formGroup}>
            <View style={styles.attachmentLabelRow}>
              <AttachmentPaperclipIcon size={16} color={P.twGray600} />
              <Text style={styles.formLabel}>{t('farmer.livestock.detail.attachment.title')}</Text>
            </View>
            <TouchableOpacity
              style={styles.attachmentAddBox}
              onPress={() => void handlePickAttachment(setHousingAttachment, setHousingErrors)}
              testID="housingForm.attach"
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.attachment.add')}
            >
              <View style={styles.attachmentAddBoxInner}>
                <View style={styles.attachmentAddCircleBtn}>
                  <FormPlusIcon size={18} color={colors.brandGreen} />
                </View>
                <View>
                  <Text style={styles.attachmentAddTitle}>
                    {t('farmer.livestock.detail.attachment.add')}
                  </Text>
                  <Text style={styles.attachmentAddSubtitle}>
                    {t('farmer.livestock.detail.attachment.hint')}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {housingAttachment && (
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('farmer.livestock.detail.attachment.label')}</Text>
              <View style={styles.attachmentCard}>
                <View style={styles.attachmentLeft}>
                  <ReceiptDocIcon size={36} />
                  <View style={styles.attachmentMetaCol}>
                    <Text style={styles.attachmentFilename}>{housingAttachment.name}</Text>
                    <Text style={styles.attachmentSize}>
                      {attachmentSizeLabel(housingAttachment)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.attachmentRemoveBtn}
                  onPress={() => setHousingAttachment(null)}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.attachment.remove')}
                >
                  <FormCloseIcon size={16} color={P.twGray600} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* + Add Housing button */}
          <TouchableOpacity
            style={styles.addFeedItemBtn}
            onPress={() => void handleSaveHousingDetails()}
            disabled={saving}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.livestock.detail.housing.addRecord')}
          >
            <PlusCircleOutlineIcon size={18} color={colors.brandGreen} />
            <Text style={styles.addFeedItemBtnText}>
              {t('farmer.livestock.detail.housing.addRecord')}
            </Text>
          </TouchableOpacity>

          <FormErrors errors={housingErrors} testID="housingForm.errors" />

          {/* Form Bottom Action Buttons */}
          <View style={styles.modalActionButtonsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setIsAddHousingModalVisible(false)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.common.cancel')}
            >
              <Text style={styles.cancelBtnText}>{t('farmer.livestock.detail.common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnBusy]}
              onPress={() => void handleSaveHousingDetails()}
              disabled={saving}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ disabled: saving, busy: saving }}
              accessibilityLabel={t('farmer.livestock.detail.common.save')}
              testID="housingForm.save"
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
