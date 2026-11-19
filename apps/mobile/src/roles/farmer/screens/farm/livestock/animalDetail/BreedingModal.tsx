import { ScreenStatusBar as StatusBar } from '@tohfa/mobile-ui';
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
import {
  createBreedingRecord,
  type AnimalGender,
  type BreedingRecordType,
} from '../../../../api/livestock';
import {
  INPUT_MAX_LENGTH,
  BREEDING_METHOD_OPTIONS,
  BREEDING_RECORD_TYPE_OPTIONS,
  DELIVERY_TYPE_OPTIONS,
  EXAMINATION_METHOD_OPTIONS,
  GESTATION_UNIT_OPTIONS,
  INSEMINATION_TYPE_OPTIONS,
  PREGNANCY_CHECK_TYPE_OPTIONS,
  PREGNANCY_RESULT_OPTIONS,
  WEIGHT_UNIT_OPTIONS,
  buildCalvingBody,
  buildHeatBody,
  buildInseminationBody,
  buildPregnancyCheckBody,
  optionLabel,
  optionValues,
  parseFormDate,
} from '../animalRecordForms';

import { type PagedRecords } from '../useAnimalRecords';
import { styles } from './styles';
import {
  GreenBackArrowIcon,
  FormCalendarIcon,
  FormChevronDownIcon,
  FormCloseIcon,
  FormPlusIcon,
  FormClockIcon,
  AttachmentPaperclipIcon,
  ReceiptDocIcon,
  FormCheckmarkIcon,
  PlusCircleOutlineIcon,
  PeopleGroupIcon,
} from '../../../../assets/icons/AssetIcons';
import {
  FormErrors,
  ModalAnimalCard,
  type AttachmentState,
  type RecordModalContext,
} from './shared';
import { useFields } from './useFields';
import { type AnimalDetailProps } from '../AnimalDetailScreen';

/** Add Breeding Record form state (heat, insemination, pregnancy check, calving). */
export function useBreedingForm() {
  return useFields({
    isAddBreedingModalVisible: false,
    breedingRecordType: 'HEAT' as BreedingRecordType,
    isBreedingRecordTypeDropdownOpen: false,

    // Heat cycle fields
    heatRecordDate: '',
    breedingMethod: 'ARTIFICIAL_INSEMINATION' as string,
    isBreedingMethodDropdownOpen: false,
    sireBull: '',
    isSireBullDropdownOpen: false,
    semenStrawRef: '',
    heatTechnician: '',
    observedHeatSigns: '',

    // Insemination fields
    insemDate: '',
    insemTime: '',
    insemType: 'ARTIFICIAL' as string,
    insemLocation: '',
    insemTechnician: '',
    insemObservedHeatSigns: '',

    // Pregnancy check fields
    pregnancyDate: '',
    checkType: 'ROUTINE' as string,
    pregnancyResult: 'POSITIVE' as string,
    isPregnancyResultDropdownOpen: false,
    examMethod: 'ULTRASOUND' as string,
    isExamMethodDropdownOpen: false,
    pregnancyLocation: '',
    pregnancyGestationUnit: 'MONTHS' as string,
    isGestationUnitDropdownOpen: false,
    expectedDeliveryDate: '',
    nextCheckDate: '',
    pregnancyFindings: '',

    // Calving fields
    calvingDate: '',
    calvingTime: '',
    calvingOutcome: 'LIVE_BIRTH' as string,
    noOfOffspring: '1',
    deliveryType: 'NORMAL' as string,
    isDeliveryTypeDropdownOpen: false,
    calvingFindings: '',
    offspringName: '',
    offspringGender: 'FEMALE' as AnimalGender,
    birthWeight: '',
    birthWeightUnit: 'KG' as string,
    isBirthWeightUnitDropdownOpen: false,

    // Breeding shared attachment
    breedingAttachment: null as AttachmentState,
    breedingErrors: [] as string[],
  });
}

export type BreedingForm = ReturnType<typeof useBreedingForm>;

export interface BreedingModalProps {
  form: BreedingForm;
  ctx: RecordModalContext;
  breedingList: Pick<PagedRecords<unknown>, 'refresh'>;
  canAddBreeding: boolean;
  SIRE_BULL_OPTIONS: string[];
  SIRE_EXTERNAL: string;
  openRegisterOffspring: (calvingIso: string | undefined, gender: AnimalGender | null) => void;
  onNavigateToRegisterOffspring: AnimalDetailProps['onNavigateToRegisterOffspring'];
}

/** Add Breeding Record modal (BR-138: female animals only). */
export function BreedingModal({
  form,
  ctx,
  breedingList,
  canAddBreeding,
  SIRE_BULL_OPTIONS,
  SIRE_EXTERNAL,
  openRegisterOffspring,
  onNavigateToRegisterOffspring,
}: BreedingModalProps): React.JSX.Element {
  const {
    isAddBreedingModalVisible,
    setIsAddBreedingModalVisible,
    breedingRecordType,
    setBreedingRecordType,
    isBreedingRecordTypeDropdownOpen,
    setIsBreedingRecordTypeDropdownOpen,
    heatRecordDate,
    setHeatRecordDate,
    breedingMethod,
    setBreedingMethod,
    isBreedingMethodDropdownOpen,
    setIsBreedingMethodDropdownOpen,
    sireBull,
    setSireBull,
    isSireBullDropdownOpen,
    setIsSireBullDropdownOpen,
    semenStrawRef,
    setSemenStrawRef,
    heatTechnician,
    setHeatTechnician,
    observedHeatSigns,
    setObservedHeatSigns,
    insemDate,
    setInsemDate,
    insemTime,
    setInsemTime,
    insemType,
    setInsemType,
    insemLocation,
    setInsemLocation,
    insemTechnician,
    setInsemTechnician,
    insemObservedHeatSigns,
    setInsemObservedHeatSigns,
    pregnancyDate,
    setPregnancyDate,
    checkType,
    setCheckType,
    pregnancyResult,
    setPregnancyResult,
    isPregnancyResultDropdownOpen,
    setIsPregnancyResultDropdownOpen,
    examMethod,
    setExamMethod,
    isExamMethodDropdownOpen,
    setIsExamMethodDropdownOpen,
    pregnancyLocation,
    setPregnancyLocation,
    pregnancyGestationUnit,
    setPregnancyGestationUnit,
    isGestationUnitDropdownOpen,
    setIsGestationUnitDropdownOpen,
    expectedDeliveryDate,
    setExpectedDeliveryDate,
    nextCheckDate,
    setNextCheckDate,
    pregnancyFindings,
    setPregnancyFindings,
    calvingDate,
    setCalvingDate,
    calvingTime,
    setCalvingTime,
    calvingOutcome,
    setCalvingOutcome,
    noOfOffspring,
    setNoOfOffspring,
    deliveryType,
    setDeliveryType,
    isDeliveryTypeDropdownOpen,
    setIsDeliveryTypeDropdownOpen,
    calvingFindings,
    setCalvingFindings,
    offspringName,
    setOffspringName,
    offspringGender,
    setOffspringGender,
    birthWeight,
    setBirthWeight,
    birthWeightUnit,
    setBirthWeightUnit,
    isBirthWeightUnitDropdownOpen,
    setIsBirthWeightUnitDropdownOpen,
    breedingAttachment,
    setBreedingAttachment,
    breedingErrors,
    setBreedingErrors,
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

  const handleSaveBreedingRecord = async (): Promise<void> => {
    if (!animalId || saving || !canAddBreeding) return;
    const post = (body: Parameters<typeof createBreedingRecord>[1]) =>
      createBreedingRecord(animalId, body);
    let saved: boolean;
    if (breedingRecordType === 'HEAT') {
      saved = await submitRecord(
        buildHeatBody({
          recordDate: heatRecordDate,
          breedingMethod,
          sire: sireBull,
          semenStrawRef,
          technician: heatTechnician,
          heatSigns: observedHeatSigns,
        }),
        setBreedingErrors,
        breedingAttachment,
        post,
      );
    } else if (breedingRecordType === 'INSEMINATION') {
      saved = await submitRecord(
        buildInseminationBody({
          recordDate: insemDate,
          time: insemTime,
          inseminationType: insemType,
          location: insemLocation,
          technician: insemTechnician,
          heatSigns: insemObservedHeatSigns,
        }),
        setBreedingErrors,
        breedingAttachment,
        post,
      );
    } else if (breedingRecordType === 'PREGNANCY_CHECK') {
      saved = await submitRecord(
        buildPregnancyCheckBody({
          recordDate: pregnancyDate,
          checkType,
          result: pregnancyResult,
          examinationMethod: examMethod,
          location: pregnancyLocation,
          expectedDeliveryDate,
          nextCheckDate,
          findings: pregnancyFindings,
        }),
        setBreedingErrors,
        null,
        post,
      );
    } else {
      saved = await submitRecord(
        buildCalvingBody({
          recordDate: calvingDate,
          time: calvingTime,
          outcome: calvingOutcome,
          offspringCount: noOfOffspring,
          deliveryType,
          offspringName,
          offspringGender,
          birthWeight,
          birthWeightUnit,
          findings: calvingFindings,
        }),
        setBreedingErrors,
        null,
        post,
      );
    }
    if (!saved) return;
    breedingList.refresh();
    setBreedingAttachment(null);
    setIsAddBreedingModalVisible(false);
    Alert.alert(
      t('farmer.livestock.detail.common.savedTitle'),
      t('farmer.livestock.detail.breeding.savedBody', { name: displayName }),
    );
  };

  const handleRegisterOffspring = () => {
    const calvingIso = parseFormDate(calvingDate) ?? undefined;
    setIsAddBreedingModalVisible(false);
    openRegisterOffspring(calvingIso, offspringGender);
  };

  return (
    <Modal
      visible={isAddBreedingModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setIsAddBreedingModalVisible(false)}
    >
      <SafeAreaView style={styles.modalSafeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={P.white} />

        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalBackBtn}
            onPress={() => setIsAddBreedingModalVisible(false)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.livestock.detail.a11y.back')}
          >
            <GreenBackArrowIcon size={24} color={P.deepGreen} />
          </TouchableOpacity>
          <Text style={styles.modalHeaderTitle}>
            {t('farmer.livestock.detail.breeding.addRecord')}
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

          {/* Record Type * (Dropdown) */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              {t('farmer.livestock.detail.breedingForm.recordType')}{' '}
              <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.formDropdownTrigger}
              onPress={() => setIsBreedingRecordTypeDropdownOpen(!isBreedingRecordTypeDropdownOpen)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.a11y.selectRecordType')}
            >
              <Text style={styles.formDropdownSelectedText}>
                {optionLabel(BREEDING_RECORD_TYPE_OPTIONS, breedingRecordType)}
              </Text>
              <FormChevronDownIcon size={18} color={P.twGray500} />
            </TouchableOpacity>
            {isBreedingRecordTypeDropdownOpen && (
              <View style={styles.formDropdownMenu}>
                {optionValues(BREEDING_RECORD_TYPE_OPTIONS).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.formDropdownItem,
                      breedingRecordType === type && styles.formDropdownItemActive,
                    ]}
                    onPress={() => {
                      setBreedingRecordType(type);
                      setIsBreedingRecordTypeDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.formDropdownItemText,
                        breedingRecordType === type && styles.formDropdownItemTextActive,
                      ]}
                    >
                      {optionLabel(BREEDING_RECORD_TYPE_OPTIONS, type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* ── Form 1: Heat cycle ── */}
          {breedingRecordType === 'HEAT' && (
            <>
              {/* Record date * */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.field.recordDate')}{' '}
                  <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <View style={styles.formInputContainer}>
                  <FormCalendarIcon size={18} color={P.twGray500} />
                  <TextInput
                    style={styles.formInputWithIcon}
                    value={heatRecordDate}
                    onChangeText={setHeatRecordDate}
                    testID="breedingForm.heatDate"
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                    maxLength={INPUT_MAX_LENGTH.date}
                  />
                </View>
              </View>

              {/* Breeding method * */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.field.breedingMethod')}{' '}
                  <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.formDropdownTrigger}
                  onPress={() => setIsBreedingMethodDropdownOpen(!isBreedingMethodDropdownOpen)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.a11y.selectBreedingMethod')}
                >
                  <Text style={styles.formDropdownSelectedText}>
                    {optionLabel(BREEDING_METHOD_OPTIONS, breedingMethod)}
                  </Text>
                  <FormChevronDownIcon size={18} color={P.twGray500} />
                </TouchableOpacity>
                {isBreedingMethodDropdownOpen && (
                  <View style={styles.formDropdownMenu}>
                    {optionValues(BREEDING_METHOD_OPTIONS).map((bm) => (
                      <TouchableOpacity
                        key={bm}
                        style={[
                          styles.formDropdownItem,
                          breedingMethod === bm && styles.formDropdownItemActive,
                        ]}
                        onPress={() => {
                          setBreedingMethod(bm);
                          setIsBreedingMethodDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.formDropdownItemText,
                            breedingMethod === bm && styles.formDropdownItemTextActive,
                          ]}
                        >
                          {optionLabel(BREEDING_METHOD_OPTIONS, bm)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Sire / Bull * */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.field.sire')}{' '}
                  <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.formDropdownTrigger}
                  onPress={() => setIsSireBullDropdownOpen(!isSireBullDropdownOpen)}
                  testID="breedingForm.sireTrigger"
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.a11y.selectBull')}
                >
                  <Text
                    style={
                      sireBull ? styles.formDropdownSelectedText : styles.formDropdownPlaceholder
                    }
                  >
                    {sireBull || t('farmer.livestock.detail.breedingForm.selectSire')}
                  </Text>
                  <FormChevronDownIcon size={18} color={P.twGray500} />
                </TouchableOpacity>
                {isSireBullDropdownOpen && (
                  <View style={styles.formDropdownMenu}>
                    {SIRE_BULL_OPTIONS.map((bull) => (
                      <TouchableOpacity
                        key={bull}
                        testID={
                          bull === SIRE_EXTERNAL
                            ? 'breedingForm.sireExternal'
                            : `breedingForm.sire:${bull}`
                        }
                        style={[
                          styles.formDropdownItem,
                          sireBull === bull && styles.formDropdownItemActive,
                        ]}
                        onPress={() => {
                          setSireBull(bull);
                          setIsSireBullDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.formDropdownItemText,
                            sireBull === bull && styles.formDropdownItemTextActive,
                          ]}
                        >
                          {bull}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Semen / Straw reference */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.field.semenStrawRef')}
                </Text>
                <TextInput
                  style={styles.formTextInput}
                  value={semenStrawRef}
                  onChangeText={setSemenStrawRef}
                  placeholder=""
                  placeholderTextColor={P.twGray400}
                  maxLength={INPUT_MAX_LENGTH.short}
                />
              </View>

              {/* Technician */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.field.technician')}
                </Text>
                <TextInput
                  style={styles.formTextInput}
                  value={heatTechnician}
                  onChangeText={setHeatTechnician}
                  placeholder=""
                  placeholderTextColor={P.twGray400}
                  maxLength={INPUT_MAX_LENGTH.short}
                />
              </View>

              {/* Observed heat signs */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.heatSigns')}</Text>
                <TextInput
                  style={styles.formNotesInput}
                  value={observedHeatSigns}
                  onChangeText={setObservedHeatSigns}
                  multiline
                  placeholder=""
                  placeholderTextColor={P.twGray400}
                  textAlignVertical="top"
                  maxLength={INPUT_MAX_LENGTH.long}
                />
              </View>

              {/* Attachment Document */}
              <View style={styles.formGroup}>
                <View style={styles.attachmentLabelRow}>
                  <AttachmentPaperclipIcon size={16} color={P.twGray600} />
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.attachment.title')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.attachmentAddBox}
                  onPress={() =>
                    void handlePickAttachment(setBreedingAttachment, setBreedingErrors)
                  }
                  testID="breedingForm.attach"
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

              {breedingAttachment && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.attachment.label')}
                  </Text>
                  <View style={styles.attachmentCard}>
                    <View style={styles.attachmentLeft}>
                      <ReceiptDocIcon size={36} />
                      <View style={styles.attachmentMetaCol}>
                        <Text style={styles.attachmentFilename}>{breedingAttachment.name}</Text>
                        <Text style={styles.attachmentSize}>
                          {attachmentSizeLabel(breedingAttachment)}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.attachmentRemoveBtn}
                      onPress={() => setBreedingAttachment(null)}
                      accessibilityRole="button"
                      accessibilityLabel={t('farmer.livestock.detail.attachment.remove')}
                    >
                      <FormCloseIcon size={16} color={P.twGray600} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}

          {/* ── Form 2: Insemination ── */}
          {breedingRecordType === 'INSEMINATION' && (
            <>
              {/* Insemination date * & Time */}
              <View style={styles.formRowHalf}>
                <View style={[styles.formGroup, styles.flexRatio10]}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.breedingForm.inseminationDate')}{' '}
                    <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <View style={styles.formInputContainer}>
                    <FormCalendarIcon size={18} color={P.twGray500} />
                    <TextInput
                      style={styles.formInputWithIcon}
                      value={insemDate}
                      onChangeText={setInsemDate}
                      placeholder=""
                      placeholderTextColor={P.twGray400}
                      maxLength={INPUT_MAX_LENGTH.date}
                    />
                  </View>
                </View>
                <View style={[styles.formGroup, styles.flexRatio10]}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.breedingForm.time')}
                  </Text>
                  <View style={styles.formInputContainer}>
                    <TextInput
                      style={[styles.formInputWithIcon, styles.flexRatio10]}
                      value={insemTime}
                      onChangeText={setInsemTime}
                      placeholder=""
                      placeholderTextColor={P.twGray400}
                      maxLength={INPUT_MAX_LENGTH.time}
                    />
                    <FormClockIcon size={18} color={P.twGray500} />
                  </View>
                </View>
              </View>

              {/* Insemination type * (Vertical Stacked Radio) */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.breedingForm.inseminationType')}{' '}
                  <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <View style={styles.feedItemsStack}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setInsemType('ARTIFICIAL')}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        insemType === 'ARTIFICIAL' && styles.radioCircleSelected,
                      ]}
                    >
                      {insemType === 'ARTIFICIAL' && <View style={styles.radioInnerDot} />}
                    </View>
                    <Text style={styles.radioLabel}>
                      {optionLabel(INSEMINATION_TYPE_OPTIONS, 'ARTIFICIAL')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setInsemType('NATURAL')}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        insemType === 'NATURAL' && styles.radioCircleSelected,
                      ]}
                    >
                      {insemType === 'NATURAL' && <View style={styles.radioInnerDot} />}
                    </View>
                    <Text style={styles.radioLabel}>
                      {optionLabel(INSEMINATION_TYPE_OPTIONS, 'NATURAL')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Location */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.location')}</Text>
                <TextInput
                  style={styles.formTextInput}
                  value={insemLocation}
                  onChangeText={setInsemLocation}
                  placeholder=""
                  placeholderTextColor={P.twGray400}
                  maxLength={INPUT_MAX_LENGTH.short}
                />
              </View>

              {/* Technician */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.field.technician')}
                </Text>
                <TextInput
                  style={styles.formTextInput}
                  value={insemTechnician}
                  onChangeText={setInsemTechnician}
                  placeholder=""
                  placeholderTextColor={P.twGray400}
                  maxLength={INPUT_MAX_LENGTH.short}
                />
              </View>

              {/* Observed heat signs */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.heatSigns')}</Text>
                <TextInput
                  style={styles.formNotesInput}
                  value={insemObservedHeatSigns}
                  onChangeText={setInsemObservedHeatSigns}
                  multiline
                  placeholder=""
                  placeholderTextColor={P.twGray400}
                  textAlignVertical="top"
                  maxLength={INPUT_MAX_LENGTH.long}
                />
              </View>

              {/* Attachment Document */}
              <View style={styles.formGroup}>
                <View style={styles.attachmentLabelRow}>
                  <AttachmentPaperclipIcon size={16} color={P.twGray600} />
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.attachment.title')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.attachmentAddBox}
                  onPress={() =>
                    void handlePickAttachment(setBreedingAttachment, setBreedingErrors)
                  }
                  testID="breedingForm.attach"
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

              {breedingAttachment && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.attachment.label')}
                  </Text>
                  <View style={styles.attachmentCard}>
                    <View style={styles.attachmentLeft}>
                      <ReceiptDocIcon size={36} />
                      <View style={styles.attachmentMetaCol}>
                        <Text style={styles.attachmentFilename}>{breedingAttachment.name}</Text>
                        <Text style={styles.attachmentSize}>
                          {attachmentSizeLabel(breedingAttachment)}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.attachmentRemoveBtn}
                      onPress={() => setBreedingAttachment(null)}
                      accessibilityRole="button"
                      accessibilityLabel={t('farmer.livestock.detail.attachment.remove')}
                    >
                      <FormCloseIcon size={16} color={P.twGray600} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}

          {/* ── Form 3: Pregnancy check ── */}
          {breedingRecordType === 'PREGNANCY_CHECK' && (
            <>
              {/* Pregnancy date * */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.breedingForm.pregnancyDate')}{' '}
                  <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <View style={styles.formInputContainer}>
                  <FormCalendarIcon size={18} color={P.twGray500} />
                  <TextInput
                    style={styles.formInputWithIcon}
                    value={pregnancyDate}
                    onChangeText={setPregnancyDate}
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                    maxLength={INPUT_MAX_LENGTH.date}
                  />
                </View>
              </View>

              {/* Check type * (Horizontal Radio Row) */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.breedingForm.checkType')}{' '}
                  <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <View style={styles.radioRow}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setCheckType('ROUTINE')}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        checkType === 'ROUTINE' && styles.radioCircleSelected,
                      ]}
                    >
                      {checkType === 'ROUTINE' && <View style={styles.radioInnerDot} />}
                    </View>
                    <Text style={styles.radioLabel}>
                      {optionLabel(PREGNANCY_CHECK_TYPE_OPTIONS, 'ROUTINE')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setCheckType('CONFIRMATION')}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        checkType === 'CONFIRMATION' && styles.radioCircleSelected,
                      ]}
                    >
                      {checkType === 'CONFIRMATION' && <View style={styles.radioInnerDot} />}
                    </View>
                    <Text style={styles.radioLabel}>
                      {optionLabel(PREGNANCY_CHECK_TYPE_OPTIONS, 'CONFIRMATION')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Result * */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.breedingForm.result')}{' '}
                  <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.formDropdownTrigger}
                  onPress={() => setIsPregnancyResultDropdownOpen(!isPregnancyResultDropdownOpen)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.a11y.selectResult')}
                >
                  <Text style={styles.formDropdownSelectedText}>
                    {optionLabel(PREGNANCY_RESULT_OPTIONS, pregnancyResult)}
                  </Text>
                  <FormChevronDownIcon size={18} color={P.twGray500} />
                </TouchableOpacity>
                {isPregnancyResultDropdownOpen && (
                  <View style={styles.formDropdownMenu}>
                    {optionValues(PREGNANCY_RESULT_OPTIONS).map((res) => (
                      <TouchableOpacity
                        key={res}
                        style={[
                          styles.formDropdownItem,
                          pregnancyResult === res && styles.formDropdownItemActive,
                        ]}
                        onPress={() => {
                          setPregnancyResult(res);
                          setIsPregnancyResultDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.formDropdownItemText,
                            pregnancyResult === res && styles.formDropdownItemTextActive,
                          ]}
                        >
                          {optionLabel(PREGNANCY_RESULT_OPTIONS, res)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Examination method * */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.breedingForm.examinationMethod')}{' '}
                  <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.formDropdownTrigger}
                  onPress={() => setIsExamMethodDropdownOpen(!isExamMethodDropdownOpen)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.a11y.selectExaminationMethod')}
                >
                  <Text style={styles.formDropdownSelectedText}>
                    {optionLabel(EXAMINATION_METHOD_OPTIONS, examMethod)}
                  </Text>
                  <FormChevronDownIcon size={18} color={P.twGray500} />
                </TouchableOpacity>
                {isExamMethodDropdownOpen && (
                  <View style={styles.formDropdownMenu}>
                    {optionValues(EXAMINATION_METHOD_OPTIONS).map((em) => (
                      <TouchableOpacity
                        key={em}
                        style={[
                          styles.formDropdownItem,
                          examMethod === em && styles.formDropdownItemActive,
                        ]}
                        onPress={() => {
                          setExamMethod(em);
                          setIsExamMethodDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.formDropdownItemText,
                            examMethod === em && styles.formDropdownItemTextActive,
                          ]}
                        >
                          {optionLabel(EXAMINATION_METHOD_OPTIONS, em)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Location + months dropdown */}
              <View style={styles.formRowHalf}>
                <View style={[styles.formGroup, styles.flexRatio12]}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.field.location')}
                  </Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={pregnancyLocation}
                    onChangeText={setPregnancyLocation}
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                    maxLength={INPUT_MAX_LENGTH.short}
                  />
                </View>
                <View style={[styles.formGroup, styles.flexRatio10]}>
                  <Text style={styles.formLabel}> </Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsGestationUnitDropdownOpen(!isGestationUnitDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectDurationUnit')}
                  >
                    <Text style={styles.formDropdownSelectedText}>
                      {optionLabel(GESTATION_UNIT_OPTIONS, pregnancyGestationUnit)}
                    </Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isGestationUnitDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(GESTATION_UNIT_OPTIONS).map((u) => (
                        <TouchableOpacity
                          key={u}
                          style={[
                            styles.formDropdownItem,
                            pregnancyGestationUnit === u && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setPregnancyGestationUnit(u);
                            setIsGestationUnitDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              pregnancyGestationUnit === u && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(GESTATION_UNIT_OPTIONS, u)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Expected delivery date */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.field.expectedDeliveryDate')}
                </Text>
                <View style={styles.formInputContainer}>
                  <FormCalendarIcon size={18} color={P.twGray500} />
                  <TextInput
                    style={styles.formInputWithIcon}
                    value={expectedDeliveryDate}
                    onChangeText={setExpectedDeliveryDate}
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                    maxLength={INPUT_MAX_LENGTH.date}
                  />
                </View>
              </View>

              {/* Next check date * */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.field.nextCheckDate')}{' '}
                  <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <View style={styles.formInputContainer}>
                  <FormCalendarIcon size={18} color={P.twGray500} />
                  <TextInput
                    style={styles.formInputWithIcon}
                    value={nextCheckDate}
                    onChangeText={setNextCheckDate}
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                    maxLength={INPUT_MAX_LENGTH.date}
                  />
                </View>
              </View>

              {/* Findings / Notes */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.breedingForm.findingsNotes')}
                </Text>
                <TextInput
                  style={styles.formNotesInput}
                  value={pregnancyFindings}
                  onChangeText={setPregnancyFindings}
                  multiline
                  placeholder=""
                  placeholderTextColor={P.twGray400}
                  textAlignVertical="top"
                  maxLength={INPUT_MAX_LENGTH.long}
                />
              </View>
            </>
          )}

          {/* ── Form 4: Calving ── */}
          {breedingRecordType === 'CALVING' && (
            <>
              {/* Calving date * */}
              <View style={styles.formRowHalf}>
                <View style={[styles.formGroup, styles.flexRatio10]}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.breedingForm.calvingDate')}{' '}
                    <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <View style={styles.formInputContainer}>
                    <FormCalendarIcon size={18} color={P.twGray500} />
                    <TextInput
                      style={styles.formInputWithIcon}
                      value={calvingDate}
                      testID="breedingForm.calvingDate"
                      onChangeText={setCalvingDate}
                      placeholder={t('farmer.livestock.detail.common.datePlaceholder')}
                      placeholderTextColor={P.twGray400}
                      maxLength={INPUT_MAX_LENGTH.date}
                    />
                  </View>
                </View>
                {/* Optional calving time, HH:MM 24-hour — sent as calvingTime (same parser as the insemination time) */}
                <View style={[styles.formGroup, styles.flexRatio10]}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.field.calvingTime')}
                  </Text>
                  <View style={styles.formInputContainer}>
                    <TextInput
                      style={[styles.formInputWithIcon, styles.flexRatio10]}
                      value={calvingTime}
                      testID="breedingForm.calvingTime"
                      onChangeText={setCalvingTime}
                      keyboardType="numbers-and-punctuation"
                      placeholder={t('farmer.livestock.detail.common.timePlaceholder')}
                      placeholderTextColor={P.twGray400}
                      maxLength={INPUT_MAX_LENGTH.time}
                    />
                    <FormClockIcon size={18} color={P.twGray500} />
                  </View>
                </View>
              </View>

              {/* Calving Outcome * */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.breedingForm.calvingOutcome')}{' '}
                  <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <View style={styles.radioRow}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setCalvingOutcome('LIVE_BIRTH')}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        calvingOutcome === 'LIVE_BIRTH' && styles.radioCircleSelected,
                      ]}
                    >
                      {calvingOutcome === 'LIVE_BIRTH' && <View style={styles.radioInnerDot} />}
                    </View>
                    <Text style={styles.radioLabel}>
                      {t('farmer.livestock.detail.breedingForm.liveBirth')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setCalvingOutcome('STILLBIRTH')}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        calvingOutcome === 'STILLBIRTH' && styles.radioCircleSelected,
                      ]}
                    >
                      {calvingOutcome === 'STILLBIRTH' && <View style={styles.radioInnerDot} />}
                    </View>
                    <Text style={styles.radioLabel}>
                      {t('farmer.livestock.detail.breedingForm.stillbirth')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setCalvingOutcome('OTHER')}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        calvingOutcome === 'OTHER' && styles.radioCircleSelected,
                      ]}
                    >
                      {calvingOutcome === 'OTHER' && <View style={styles.radioInnerDot} />}
                    </View>
                    <Text style={styles.radioLabel}>
                      {t('farmer.livestock.detail.breedingForm.otherOutcome')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* No of Offspring & Delivery type */}
              <View style={styles.formRowHalf}>
                <View style={[styles.formGroup, styles.flexRatio12]}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.field.offspringCount')}
                  </Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={noOfOffspring}
                    onChangeText={setNoOfOffspring}
                    keyboardType="numeric"
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                    maxLength={INPUT_MAX_LENGTH.count}
                  />
                </View>
                <View style={[styles.formGroup, styles.flexRatio10]}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.breedingForm.deliveryType')}
                  </Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsDeliveryTypeDropdownOpen(!isDeliveryTypeDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectDeliveryType')}
                  >
                    <Text style={styles.formDropdownSelectedText}>
                      {optionLabel(DELIVERY_TYPE_OPTIONS, deliveryType)}
                    </Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isDeliveryTypeDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(DELIVERY_TYPE_OPTIONS).map((dt) => (
                        <TouchableOpacity
                          key={dt}
                          style={[
                            styles.formDropdownItem,
                            deliveryType === dt && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setDeliveryType(dt);
                            setIsDeliveryTypeDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              deliveryType === dt && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(DELIVERY_TYPE_OPTIONS, dt)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Findings / Notes */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.breedingForm.findingsNotes')}
                </Text>
                <TextInput
                  style={styles.formNotesInput}
                  value={calvingFindings}
                  onChangeText={setCalvingFindings}
                  multiline
                  placeholder=""
                  placeholderTextColor={P.twGray400}
                  textAlignVertical="top"
                  maxLength={INPUT_MAX_LENGTH.long}
                />
              </View>

              {/* Section Banner: Additional Details */}
              <View style={styles.sectionBanner}>
                <PeopleGroupIcon size={16} color={colors.brandGreen} />
                <Text style={styles.sectionBannerText}>
                  {t('farmer.livestock.detail.common.additionalDetails')}
                </Text>
              </View>

              {/* Offspring name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.field.offspringName')}
                </Text>
                <TextInput
                  style={styles.formTextInput}
                  value={offspringName}
                  onChangeText={setOffspringName}
                  placeholder=""
                  placeholderTextColor={P.twGray400}
                  maxLength={INPUT_MAX_LENGTH.short}
                />
              </View>

              {/* Offspring gender */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.breedingForm.offspringGender')}
                </Text>
                <View style={styles.radioRow}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setOffspringGender('MALE')}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        offspringGender === 'MALE' && styles.radioCircleSelected,
                      ]}
                    >
                      {offspringGender === 'MALE' && <View style={styles.radioInnerDot} />}
                    </View>
                    <Text style={styles.radioLabel}>
                      {t('farmer.livestock.detail.gender.MALE')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setOffspringGender('FEMALE')}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        offspringGender === 'FEMALE' && styles.radioCircleSelected,
                      ]}
                    >
                      {offspringGender === 'FEMALE' && <View style={styles.radioInnerDot} />}
                    </View>
                    <Text style={styles.radioLabel}>
                      {t('farmer.livestock.detail.gender.FEMALE')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Birth weight + kg dropdown */}
              <View style={styles.formRowHalf}>
                <View style={[styles.formGroup, styles.flexRatio12]}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.field.birthWeight')}
                  </Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={birthWeight}
                    onChangeText={setBirthWeight}
                    keyboardType="decimal-pad"
                    placeholder=""
                    placeholderTextColor={P.twGray400}
                    maxLength={INPUT_MAX_LENGTH.decimal}
                  />
                </View>
                <View style={[styles.formGroup, styles.flexRatio10]}>
                  <Text style={styles.formLabel}> </Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsBirthWeightUnitDropdownOpen(!isBirthWeightUnitDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectBirthWeightUnit')}
                  >
                    <Text style={styles.formDropdownSelectedText}>
                      {optionLabel(WEIGHT_UNIT_OPTIONS, birthWeightUnit)}
                    </Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isBirthWeightUnitDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {optionValues(WEIGHT_UNIT_OPTIONS).map((u) => (
                        <TouchableOpacity
                          key={u}
                          style={[
                            styles.formDropdownItem,
                            birthWeightUnit === u && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setBirthWeightUnit(u);
                            setIsBirthWeightUnitDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              birthWeightUnit === u && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(WEIGHT_UNIT_OPTIONS, u)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Register as New Animal button — opens the real Register Animal form, pre-filled */}
              {onNavigateToRegisterOffspring ? (
                <TouchableOpacity
                  style={styles.addFeedItemBtn}
                  onPress={handleRegisterOffspring}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.breedingForm.registerNewAnimal')}
                >
                  <PlusCircleOutlineIcon size={18} color={colors.brandGreen} />
                  <Text style={styles.addFeedItemBtnText}>
                    {t('farmer.livestock.detail.breedingForm.registerNewAnimal')}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}

          <FormErrors errors={breedingErrors} testID="breedingForm.errors" />

          {/* Form Bottom Action Buttons */}
          <View style={styles.modalActionButtonsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setIsAddBreedingModalVisible(false)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.common.cancel')}
            >
              <Text style={styles.cancelBtnText}>{t('farmer.livestock.detail.common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnBusy]}
              onPress={() => void handleSaveBreedingRecord()}
              disabled={saving}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ disabled: saving, busy: saving }}
              accessibilityLabel={t('farmer.livestock.detail.common.save')}
              testID="breedingForm.save"
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
