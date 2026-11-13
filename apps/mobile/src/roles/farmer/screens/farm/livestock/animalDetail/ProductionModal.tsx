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
import { createProductionLog } from '../../../../api/livestock';
import {
  INPUT_MAX_LENGTH,
  EGG_GRADE_OPTIONS,
  EGG_SESSION_OPTIONS,
  EGG_SHELL_OPTIONS,
  MANURE_COLLECTION_OPTIONS,
  MANURE_COMPOST_OPTIONS,
  MANURE_MOISTURE_OPTIONS,
  MEAT_CUT_OPTIONS,
  MEAT_GRADE_OPTIONS,
  MILK_APPEARANCE_OPTIONS,
  MILK_GRADE_OPTIONS,
  PRODUCTION_TYPE_OPTIONS,
  PRODUCTION_UNIT_LABELS,
  PRODUCTION_UNIT_OPTIONS,
  SESSION_OPTIONS,
  WOOL_CONDITION_OPTIONS,
  WOOL_GRADE_OPTIONS,
  WOOL_SHEARING_OPTIONS,
  buildProductionLogBody,
  optionLabel,
  optionValues,
  type ProductionFormType,
} from '../animalRecordForms';

import { type PagedRecords } from '../useAnimalRecords';
import { styles } from './styles';
import {
  GreenBackArrowIcon,
  FormCalendarIcon,
  FormChevronDownIcon,
  FormPlusIcon,
  AttachmentPaperclipIcon,
  FormCheckmarkIcon,
  PlusCircleOutlineIcon,
} from '../../../../assets/icons/AssetIcons';
import { FormErrors, ModalAnimalCard, type RecordModalContext } from './shared';
import { useFields } from './useFields';

/** Add Production Record form state. */
export function useProductionForm() {
  return useFields({
    isAddProductionModalVisible: false,
    productionType: 'MILK' as ProductionFormType,
    isProductionTypeDropdownOpen: false,
    productionDate: '',
    productionNotes: '',
    isProductRestricted: false,
    productionErrors: [] as string[],

    // Milk fields
    milkingSession: 'MORNING' as string,
    isMilkingSessionDropdownOpen: false,
    milkYield: '',
    milkYieldUnit: 'L' as string,
    isMilkYieldUnitDropdownOpen: false,
    milkFat: '',
    qualityGrade: 'GRADE_A' as string,
    isQualityGradeDropdownOpen: false,
    milkAppearance: 'NORMAL' as string,
    isMilkAppearanceDropdownOpen: false,

    // Eggs fields
    eggCollectionSession: 'MORNING' as string,
    isEggSessionDropdownOpen: false,
    eggCount: '',
    eggUnit: 'PIECES' as string,
    isEggUnitDropdownOpen: false,
    damagedEggs: '',
    eggGrade: 'A_LARGE' as string,
    isEggGradeDropdownOpen: false,
    eggShellQuality: 'CLEAN_NORMAL' as string,
    isEggShellDropdownOpen: false,

    // Meat fields
    meatFacility: '',
    meatDressedWeight: '',
    meatWeightUnit: 'KG' as string,
    isMeatWeightUnitDropdownOpen: false,
    meatLiveWeight: '',
    meatLiveWeightUnit: 'KG' as string,
    isMeatLiveWeightUnitDropdownOpen: false,
    meatCutCategory: 'WHOLE_CARCASS' as string,
    isMeatCutDropdownOpen: false,
    meatGrade: 'PRIME' as string,
    isMeatGradeDropdownOpen: false,

    // Wool fields
    woolSession: 'FULL_FLEECE' as string,
    isWoolSessionDropdownOpen: false,
    woolWeight: '',
    woolWeightUnit: 'KG' as string,
    isWoolWeightUnitDropdownOpen: false,
    woolStapleLength: '',
    woolGrade: 'FINE' as string,
    isWoolGradeDropdownOpen: false,
    woolCondition: 'CLEAN_SOUND' as string,
    isWoolConditionDropdownOpen: false,

    // Manure fields
    manureCollectionType: 'DAILY_SCRAPINGS' as string,
    isManureCollectionTypeDropdownOpen: false,
    manureQuantity: '',
    manureUnit: 'KG' as string,
    isManureUnitDropdownOpen: false,
    manureMoisture: 'SEMI_DRY' as string,
    isManureMoistureDropdownOpen: false,
    manureCompostingStatus: 'RAW' as string,
    isManureCompostingDropdownOpen: false,
    manureStorageLocation: '',
  });
}

export type ProductionForm = ReturnType<typeof useProductionForm>;

export interface ProductionModalProps {
  form: ProductionForm;
  ctx: RecordModalContext;
  productionList: Pick<PagedRecords<unknown>, 'refresh'>;
  milkWindow: Pick<PagedRecords<unknown>, 'refresh'>;
}

/** Add Production Record modal (milk, eggs, meat, wool, manure). */
export function ProductionModal({
  form,
  ctx,
  productionList,
  milkWindow,
}: ProductionModalProps): React.JSX.Element {
  const {
    isAddProductionModalVisible,
    setIsAddProductionModalVisible,
    productionType,
    setProductionType,
    isProductionTypeDropdownOpen,
    setIsProductionTypeDropdownOpen,
    productionDate,
    setProductionDate,
    productionNotes,
    setProductionNotes,
    isProductRestricted,
    setIsProductRestricted,
    productionErrors,
    setProductionErrors,
    milkingSession,
    setMilkingSession,
    isMilkingSessionDropdownOpen,
    setIsMilkingSessionDropdownOpen,
    milkYield,
    setMilkYield,
    milkYieldUnit,
    setMilkYieldUnit,
    isMilkYieldUnitDropdownOpen,
    setIsMilkYieldUnitDropdownOpen,
    milkFat,
    setMilkFat,
    qualityGrade,
    setQualityGrade,
    isQualityGradeDropdownOpen,
    setIsQualityGradeDropdownOpen,
    milkAppearance,
    setMilkAppearance,
    isMilkAppearanceDropdownOpen,
    setIsMilkAppearanceDropdownOpen,
    eggCollectionSession,
    setEggCollectionSession,
    isEggSessionDropdownOpen,
    setIsEggSessionDropdownOpen,
    eggCount,
    setEggCount,
    eggUnit,
    setEggUnit,
    isEggUnitDropdownOpen,
    setIsEggUnitDropdownOpen,
    damagedEggs,
    setDamagedEggs,
    eggGrade,
    setEggGrade,
    isEggGradeDropdownOpen,
    setIsEggGradeDropdownOpen,
    eggShellQuality,
    setEggShellQuality,
    isEggShellDropdownOpen,
    setIsEggShellDropdownOpen,
    meatFacility,
    setMeatFacility,
    meatDressedWeight,
    setMeatDressedWeight,
    meatWeightUnit,
    setMeatWeightUnit,
    isMeatWeightUnitDropdownOpen,
    setIsMeatWeightUnitDropdownOpen,
    meatLiveWeight,
    setMeatLiveWeight,
    meatLiveWeightUnit,
    setMeatLiveWeightUnit,
    isMeatLiveWeightUnitDropdownOpen,
    setIsMeatLiveWeightUnitDropdownOpen,
    meatCutCategory,
    setMeatCutCategory,
    isMeatCutDropdownOpen,
    setIsMeatCutDropdownOpen,
    meatGrade,
    setMeatGrade,
    isMeatGradeDropdownOpen,
    setIsMeatGradeDropdownOpen,
    woolSession,
    setWoolSession,
    isWoolSessionDropdownOpen,
    setIsWoolSessionDropdownOpen,
    woolWeight,
    setWoolWeight,
    woolWeightUnit,
    setWoolWeightUnit,
    isWoolWeightUnitDropdownOpen,
    setIsWoolWeightUnitDropdownOpen,
    woolStapleLength,
    setWoolStapleLength,
    woolGrade,
    setWoolGrade,
    isWoolGradeDropdownOpen,
    setIsWoolGradeDropdownOpen,
    woolCondition,
    setWoolCondition,
    isWoolConditionDropdownOpen,
    setIsWoolConditionDropdownOpen,
    manureCollectionType,
    setManureCollectionType,
    isManureCollectionTypeDropdownOpen,
    setIsManureCollectionTypeDropdownOpen,
    manureQuantity,
    setManureQuantity,
    manureUnit,
    setManureUnit,
    isManureUnitDropdownOpen,
    setIsManureUnitDropdownOpen,
    manureMoisture,
    setManureMoisture,
    isManureMoistureDropdownOpen,
    setIsManureMoistureDropdownOpen,
    manureCompostingStatus,
    setManureCompostingStatus,
    isManureCompostingDropdownOpen,
    setIsManureCompostingDropdownOpen,
    manureStorageLocation,
    setManureStorageLocation,
  } = form;
  const { animalId, saving, displayName, summary, submitRecord } = ctx;

  /** Form fields with no API column, kept as labelled note lines so nothing typed is lost. */
  const productionDetails = (): Array<{ label: string; value: string }> => {
    switch (productionType) {
      case 'MILK':
        return [
          {
            label: t('farmer.livestock.detail.productionDetail.milkAppearance'),
            value: optionLabel(MILK_APPEARANCE_OPTIONS, milkAppearance),
          },
        ];
      case 'EGGS':
        return [
          { label: t('farmer.livestock.detail.productionDetail.damagedEggs'), value: damagedEggs },
          {
            label: t('farmer.livestock.detail.productionDetail.shellQuality'),
            value: optionLabel(EGG_SHELL_OPTIONS, eggShellQuality),
          },
        ];
      case 'MEAT':
        return [
          { label: t('farmer.livestock.detail.productionDetail.facility'), value: meatFacility },
          {
            label: t('farmer.livestock.detail.productionDetail.liveWeight'),
            value: meatLiveWeight
              ? `${meatLiveWeight} ${optionLabel(PRODUCTION_UNIT_LABELS, meatLiveWeightUnit)}`
              : '',
          },
          {
            label: t('farmer.livestock.detail.productionDetail.cutCategory'),
            value: optionLabel(MEAT_CUT_OPTIONS, meatCutCategory),
          },
        ];
      case 'WOOL':
        return [
          {
            label: t('farmer.livestock.detail.productionDetail.shearing'),
            value: optionLabel(WOOL_SHEARING_OPTIONS, woolSession),
          },
          {
            label: t('farmer.livestock.detail.productionDetail.stapleLength'),
            value: woolStapleLength,
          },
          {
            label: t('farmer.livestock.detail.productionDetail.woolCondition'),
            value: optionLabel(WOOL_CONDITION_OPTIONS, woolCondition),
          },
        ];
      case 'MANURE':
        return [
          {
            label: t('farmer.livestock.detail.productionDetail.collectionType'),
            value: optionLabel(MANURE_COLLECTION_OPTIONS, manureCollectionType),
          },
          {
            label: t('farmer.livestock.detail.productionDetail.moisture'),
            value: optionLabel(MANURE_MOISTURE_OPTIONS, manureMoisture),
          },
          {
            label: t('farmer.livestock.detail.productionDetail.compostingStatus'),
            value: optionLabel(MANURE_COMPOST_OPTIONS, manureCompostingStatus),
          },
          {
            label: t('farmer.livestock.detail.productionDetail.storageLocation'),
            value: manureStorageLocation,
          },
        ];
    }
  };

  const handleSaveProductionRecord = async (): Promise<void> => {
    if (!animalId || saving) return;
    const byType: Record<
      ProductionFormType,
      { quantity: string; unit: string; session?: string; grade?: string }
    > = {
      // Quality grade has no API enum: the translated label is stored as the free-text qualityGrade.
      MILK: {
        quantity: milkYield,
        unit: milkYieldUnit,
        session: milkingSession,
        grade: optionLabel(MILK_GRADE_OPTIONS, qualityGrade),
      },
      EGGS: {
        quantity: eggCount,
        unit: eggUnit,
        session: eggCollectionSession,
        grade: optionLabel(EGG_GRADE_OPTIONS, eggGrade),
      },
      MEAT: {
        quantity: meatDressedWeight,
        unit: meatWeightUnit,
        grade: optionLabel(MEAT_GRADE_OPTIONS, meatGrade),
      },
      WOOL: {
        quantity: woolWeight,
        unit: woolWeightUnit,
        grade: optionLabel(WOOL_GRADE_OPTIONS, woolGrade),
      },
      MANURE: { quantity: manureQuantity, unit: manureUnit },
    };
    const picked = byType[productionType];
    const saved = await submitRecord(
      buildProductionLogBody({
        animalId,
        productionType,
        date: productionDate,
        quantity: picked.quantity,
        unit: picked.unit,
        ...(picked.session !== undefined ? { session: picked.session } : {}),
        ...(picked.grade !== undefined ? { qualityGrade: picked.grade } : {}),
        ...(productionType === 'MILK' ? { fatPercent: milkFat } : {}),
        // BR-139: the server forces this true while the animal is under withdrawal.
        restrictedFromSale: isProductRestricted,
        notes: productionNotes,
        details: productionDetails(),
      }),
      setProductionErrors,
      null,
      createProductionLog,
    );
    if (!saved) return;
    productionList.refresh();
    milkWindow.refresh();
    setIsAddProductionModalVisible(false);
    Alert.alert(
      t('farmer.livestock.detail.common.savedTitle'),
      t('farmer.livestock.detail.production.savedBody', { name: displayName }),
    );
  };

  return (
    <Modal
      visible={isAddProductionModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setIsAddProductionModalVisible(false)}
    >
      <SafeAreaView style={styles.modalSafeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={P.white} />

        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalBackBtn}
            onPress={() => setIsAddProductionModalVisible(false)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.livestock.detail.a11y.back')}
          >
            <GreenBackArrowIcon size={24} color={P.deepGreen} />
          </TouchableOpacity>
          <Text style={styles.modalHeaderTitle}>
            {t('farmer.livestock.detail.production.addRecord')}
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

          {/* Production type * */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              {t('farmer.livestock.detail.productionForm.productionType')}{' '}
              <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.formDropdownTrigger}
              onPress={() => setIsProductionTypeDropdownOpen(!isProductionTypeDropdownOpen)}
              testID="productionForm.typeTrigger"
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.a11y.selectProductionType')}
            >
              <Text style={styles.formDropdownSelectedText}>
                {optionLabel(PRODUCTION_TYPE_OPTIONS, productionType)}
              </Text>
              <FormChevronDownIcon size={18} color={P.twGray500} />
            </TouchableOpacity>
            {isProductionTypeDropdownOpen && (
              <View style={styles.formDropdownMenu}>
                {optionValues(PRODUCTION_TYPE_OPTIONS).map((type) => (
                  <TouchableOpacity
                    key={type}
                    testID={`productionForm.type:${type}`}
                    style={[
                      styles.formDropdownItem,
                      productionType === type && styles.formDropdownItemActive,
                    ]}
                    onPress={() => {
                      setProductionType(type);
                      setIsProductionTypeDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.formDropdownItemText,
                        productionType === type && styles.formDropdownItemTextActive,
                      ]}
                    >
                      {optionLabel(PRODUCTION_TYPE_OPTIONS, type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Production date * */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              {t('farmer.livestock.detail.field.productionDate')}{' '}
              <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.formInputContainer}>
              <FormCalendarIcon size={18} color={P.twGray500} />
              <TextInput
                style={styles.formInputWithIcon}
                value={productionDate}
                onChangeText={setProductionDate}
                testID="productionForm.date"
                placeholder=""
                placeholderTextColor={P.twGray400}
                maxLength={INPUT_MAX_LENGTH.date}
              />
            </View>
          </View>

          {/* ── Type 1: Milk ── */}
          {productionType === 'MILK' && (
            <>
              {/* Milking session * */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.productionForm.milkingSession')}{' '}
                  <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.formDropdownTrigger}
                  onPress={() => setIsMilkingSessionDropdownOpen(!isMilkingSessionDropdownOpen)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.a11y.selectMilkingSession')}
                >
                  <Text style={styles.formDropdownSelectedText}>
                    {optionLabel(SESSION_OPTIONS, milkingSession)}
                  </Text>
                  <FormChevronDownIcon size={18} color={P.twGray500} />
                </TouchableOpacity>
                {isMilkingSessionDropdownOpen && (
                  <View style={styles.formDropdownMenu}>
                    {optionValues(SESSION_OPTIONS).map((ses) => (
                      <TouchableOpacity
                        key={ses}
                        style={[
                          styles.formDropdownItem,
                          milkingSession === ses && styles.formDropdownItemActive,
                        ]}
                        onPress={() => {
                          setMilkingSession(ses);
                          setIsMilkingSessionDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.formDropdownItemText,
                            milkingSession === ses && styles.formDropdownItemTextActive,
                          ]}
                        >
                          {optionLabel(SESSION_OPTIONS, ses)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Milk yield * (Value + Unit side by side) */}
              <View style={styles.formRowHalf}>
                <View style={[styles.formGroup, styles.flexRatio14]}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.productionForm.milkYield')}{' '}
                    <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={milkYield}
                    onChangeText={setMilkYield}
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
                    onPress={() => setIsMilkYieldUnitDropdownOpen(!isMilkYieldUnitDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectMilkYieldUnit')}
                  >
                    <Text style={styles.formDropdownSelectedText}>
                      {optionLabel(PRODUCTION_UNIT_LABELS, milkYieldUnit)}
                    </Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isMilkYieldUnitDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {PRODUCTION_UNIT_OPTIONS.MILK.map((u) => (
                        <TouchableOpacity
                          key={u}
                          style={[
                            styles.formDropdownItem,
                            milkYieldUnit === u && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setMilkYieldUnit(u);
                            setIsMilkYieldUnitDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              milkYieldUnit === u && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(PRODUCTION_UNIT_LABELS, u)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Milk fat % */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.field.fatPercent')}
                </Text>
                <TextInput
                  style={styles.formTextInput}
                  value={milkFat}
                  onChangeText={setMilkFat}
                  keyboardType="decimal-pad"
                  placeholder=""
                  placeholderTextColor={P.twGray400}
                  maxLength={INPUT_MAX_LENGTH.decimal}
                />
              </View>

              {/* Quality grade * */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.field.qualityGrade')}{' '}
                  <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.formDropdownTrigger}
                  onPress={() => setIsQualityGradeDropdownOpen(!isQualityGradeDropdownOpen)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.a11y.selectQualityGrade')}
                >
                  <Text style={styles.formDropdownSelectedText}>
                    {optionLabel(MILK_GRADE_OPTIONS, qualityGrade)}
                  </Text>
                  <FormChevronDownIcon size={18} color={P.twGray500} />
                </TouchableOpacity>
                {isQualityGradeDropdownOpen && (
                  <View style={styles.formDropdownMenu}>
                    {optionValues(MILK_GRADE_OPTIONS).map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[
                          styles.formDropdownItem,
                          qualityGrade === g && styles.formDropdownItemActive,
                        ]}
                        onPress={() => {
                          setQualityGrade(g);
                          setIsQualityGradeDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.formDropdownItemText,
                            qualityGrade === g && styles.formDropdownItemTextActive,
                          ]}
                        >
                          {optionLabel(MILK_GRADE_OPTIONS, g)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Milk appearance */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.productionDetail.milkAppearance')}
                </Text>
                <TouchableOpacity
                  style={styles.formDropdownTrigger}
                  onPress={() => setIsMilkAppearanceDropdownOpen(!isMilkAppearanceDropdownOpen)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.a11y.selectMilkAppearance')}
                >
                  <Text style={styles.formDropdownSelectedText}>
                    {optionLabel(MILK_APPEARANCE_OPTIONS, milkAppearance)}
                  </Text>
                  <FormChevronDownIcon size={18} color={P.twGray500} />
                </TouchableOpacity>
                {isMilkAppearanceDropdownOpen && (
                  <View style={styles.formDropdownMenu}>
                    {optionValues(MILK_APPEARANCE_OPTIONS).map((app) => (
                      <TouchableOpacity
                        key={app}
                        style={[
                          styles.formDropdownItem,
                          milkAppearance === app && styles.formDropdownItemActive,
                        ]}
                        onPress={() => {
                          setMilkAppearance(app);
                          setIsMilkAppearanceDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.formDropdownItemText,
                            milkAppearance === app && styles.formDropdownItemTextActive,
                          ]}
                        >
                          {optionLabel(MILK_APPEARANCE_OPTIONS, app)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Is milk restricted from sale? */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.productionForm.milkRestricted')}
                </Text>
                <View style={styles.restrictionToggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.restrictionToggleBtn,
                      !isProductRestricted && styles.restrictionToggleBtnActive,
                    ]}
                    onPress={() => setIsProductRestricted(false)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.option.yesNo.NO')}
                  >
                    <Text
                      style={[
                        styles.restrictionToggleBtnText,
                        !isProductRestricted && styles.restrictionToggleBtnTextActive,
                      ]}
                    >
                      {t('farmer.livestock.detail.option.yesNo.NO')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.restrictionToggleBtn,
                      isProductRestricted && styles.restrictionToggleBtnActive,
                    ]}
                    onPress={() => setIsProductRestricted(true)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.option.yesNo.YES')}
                  >
                    <Text
                      style={[
                        styles.restrictionToggleBtnText,
                        isProductRestricted && styles.restrictionToggleBtnTextActive,
                      ]}
                    >
                      {t('farmer.livestock.detail.option.yesNo.YES')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {/* ── Type 2: Eggs ── */}
          {productionType === 'EGGS' && (
            <>
              {/* Collection session * */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.productionForm.collectionSession')}{' '}
                  <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.formDropdownTrigger}
                  onPress={() => setIsEggSessionDropdownOpen(!isEggSessionDropdownOpen)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.a11y.selectCollectionSession')}
                >
                  <Text style={styles.formDropdownSelectedText}>
                    {optionLabel(EGG_SESSION_OPTIONS, eggCollectionSession)}
                  </Text>
                  <FormChevronDownIcon size={18} color={P.twGray500} />
                </TouchableOpacity>
                {isEggSessionDropdownOpen && (
                  <View style={styles.formDropdownMenu}>
                    {optionValues(EGG_SESSION_OPTIONS).map((ses) => (
                      <TouchableOpacity
                        key={ses}
                        style={[
                          styles.formDropdownItem,
                          eggCollectionSession === ses && styles.formDropdownItemActive,
                        ]}
                        onPress={() => {
                          setEggCollectionSession(ses);
                          setIsEggSessionDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.formDropdownItemText,
                            eggCollectionSession === ses && styles.formDropdownItemTextActive,
                          ]}
                        >
                          {optionLabel(EGG_SESSION_OPTIONS, ses)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Egg count * */}
              <View style={styles.formRowHalf}>
                <View style={[styles.formGroup, styles.flexRatio14]}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.productionForm.eggCount')}{' '}
                    <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={eggCount}
                    onChangeText={setEggCount}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={P.twGray400}
                    maxLength={INPUT_MAX_LENGTH.decimal}
                  />
                </View>
                <View style={[styles.formGroup, styles.flexRatio11]}>
                  <Text style={styles.formLabel}> </Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsEggUnitDropdownOpen(!isEggUnitDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectEggUnit')}
                  >
                    <Text style={styles.formDropdownSelectedText}>
                      {optionLabel(PRODUCTION_UNIT_LABELS, eggUnit)}
                    </Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isEggUnitDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {PRODUCTION_UNIT_OPTIONS.EGGS.map((u) => (
                        <TouchableOpacity
                          key={u}
                          style={[
                            styles.formDropdownItem,
                            eggUnit === u && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setEggUnit(u);
                            setIsEggUnitDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              eggUnit === u && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(PRODUCTION_UNIT_LABELS, u)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Damaged / Broken eggs */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.productionDetail.damagedEggs')}
                </Text>
                <TextInput
                  style={styles.formTextInput}
                  value={damagedEggs}
                  onChangeText={setDamagedEggs}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={P.twGray400}
                  maxLength={INPUT_MAX_LENGTH.decimal}
                />
              </View>

              {/* Egg size / Grade * */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.productionForm.eggGrade')}{' '}
                  <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.formDropdownTrigger}
                  onPress={() => setIsEggGradeDropdownOpen(!isEggGradeDropdownOpen)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.a11y.selectEggGrade')}
                >
                  <Text style={styles.formDropdownSelectedText}>
                    {optionLabel(EGG_GRADE_OPTIONS, eggGrade)}
                  </Text>
                  <FormChevronDownIcon size={18} color={P.twGray500} />
                </TouchableOpacity>
                {isEggGradeDropdownOpen && (
                  <View style={styles.formDropdownMenu}>
                    {optionValues(EGG_GRADE_OPTIONS).map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[
                          styles.formDropdownItem,
                          eggGrade === g && styles.formDropdownItemActive,
                        ]}
                        onPress={() => {
                          setEggGrade(g);
                          setIsEggGradeDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.formDropdownItemText,
                            eggGrade === g && styles.formDropdownItemTextActive,
                          ]}
                        >
                          {optionLabel(EGG_GRADE_OPTIONS, g)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Shell quality */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.productionDetail.shellQuality')}
                </Text>
                <TouchableOpacity
                  style={styles.formDropdownTrigger}
                  onPress={() => setIsEggShellDropdownOpen(!isEggShellDropdownOpen)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.a11y.selectShellQuality')}
                >
                  <Text style={styles.formDropdownSelectedText}>
                    {optionLabel(EGG_SHELL_OPTIONS, eggShellQuality)}
                  </Text>
                  <FormChevronDownIcon size={18} color={P.twGray500} />
                </TouchableOpacity>
                {isEggShellDropdownOpen && (
                  <View style={styles.formDropdownMenu}>
                    {optionValues(EGG_SHELL_OPTIONS).map((sq) => (
                      <TouchableOpacity
                        key={sq}
                        style={[
                          styles.formDropdownItem,
                          eggShellQuality === sq && styles.formDropdownItemActive,
                        ]}
                        onPress={() => {
                          setEggShellQuality(sq);
                          setIsEggShellDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.formDropdownItemText,
                            eggShellQuality === sq && styles.formDropdownItemTextActive,
                          ]}
                        >
                          {optionLabel(EGG_SHELL_OPTIONS, sq)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Are eggs restricted from sale? */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.productionForm.eggsRestricted')}
                </Text>
                <View style={styles.restrictionToggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.restrictionToggleBtn,
                      !isProductRestricted && styles.restrictionToggleBtnActive,
                    ]}
                    onPress={() => setIsProductRestricted(false)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.option.yesNo.NO')}
                  >
                    <Text
                      style={[
                        styles.restrictionToggleBtnText,
                        !isProductRestricted && styles.restrictionToggleBtnTextActive,
                      ]}
                    >
                      {t('farmer.livestock.detail.option.yesNo.NO')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.restrictionToggleBtn,
                      isProductRestricted && styles.restrictionToggleBtnActive,
                    ]}
                    onPress={() => setIsProductRestricted(true)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.option.yesNo.YES')}
                  >
                    <Text
                      style={[
                        styles.restrictionToggleBtnText,
                        isProductRestricted && styles.restrictionToggleBtnTextActive,
                      ]}
                    >
                      {t('farmer.livestock.detail.option.yesNo.YES')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {/* ── Type 3: Meat ── */}
          {productionType === 'MEAT' && (
            <>
              {/* Processing facility / Location * */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.productionForm.facility')}{' '}
                  <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TextInput
                  style={styles.formTextInput}
                  value={meatFacility}
                  onChangeText={setMeatFacility}
                  placeholder={t('farmer.livestock.detail.productionForm.facilityPlaceholder')}
                  placeholderTextColor={P.twGray400}
                  maxLength={INPUT_MAX_LENGTH.short}
                />
              </View>

              {/* Dressed weight / Yield * */}
              <View style={styles.formRowHalf}>
                <View style={[styles.formGroup, styles.flexRatio14]}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.productionForm.dressedWeight')}{' '}
                    <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={meatDressedWeight}
                    testID="productionForm.meatWeight"
                    onChangeText={setMeatDressedWeight}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={P.twGray400}
                    maxLength={INPUT_MAX_LENGTH.decimal}
                  />
                </View>
                <View style={[styles.formGroup, styles.flexRatio10]}>
                  <Text style={styles.formLabel}> </Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsMeatWeightUnitDropdownOpen(!isMeatWeightUnitDropdownOpen)}
                    testID="productionForm.meatUnitTrigger"
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectWeightUnit')}
                  >
                    <Text style={styles.formDropdownSelectedText}>
                      {optionLabel(PRODUCTION_UNIT_LABELS, meatWeightUnit)}
                    </Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isMeatWeightUnitDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {PRODUCTION_UNIT_OPTIONS.MEAT.map((u) => (
                        <TouchableOpacity
                          key={u}
                          style={[
                            styles.formDropdownItem,
                            meatWeightUnit === u && styles.formDropdownItemActive,
                          ]}
                          testID={`productionForm.meatUnit:${u}`}
                          onPress={() => {
                            setMeatWeightUnit(u);
                            setIsMeatWeightUnitDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              meatWeightUnit === u && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(PRODUCTION_UNIT_LABELS, u)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Live weight */}
              <View style={styles.formRowHalf}>
                <View style={[styles.formGroup, styles.flexRatio14]}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.productionForm.liveWeight')}
                  </Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={meatLiveWeight}
                    onChangeText={setMeatLiveWeight}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={P.twGray400}
                    maxLength={INPUT_MAX_LENGTH.decimal}
                  />
                </View>
                <View style={[styles.formGroup, styles.flexRatio10]}>
                  <Text style={styles.formLabel}> </Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() =>
                      setIsMeatLiveWeightUnitDropdownOpen(!isMeatLiveWeightUnitDropdownOpen)
                    }
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectLiveWeightUnit')}
                  >
                    <Text style={styles.formDropdownSelectedText}>
                      {optionLabel(PRODUCTION_UNIT_LABELS, meatLiveWeightUnit)}
                    </Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isMeatLiveWeightUnitDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {PRODUCTION_UNIT_OPTIONS.MEAT.map((u) => (
                        <TouchableOpacity
                          key={u}
                          style={[
                            styles.formDropdownItem,
                            meatLiveWeightUnit === u && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setMeatLiveWeightUnit(u);
                            setIsMeatLiveWeightUnitDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              meatLiveWeightUnit === u && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(PRODUCTION_UNIT_LABELS, u)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Meat cut / Category * */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.productionForm.meatCut')}{' '}
                  <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.formDropdownTrigger}
                  onPress={() => setIsMeatCutDropdownOpen(!isMeatCutDropdownOpen)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.a11y.selectMeatCut')}
                >
                  <Text style={styles.formDropdownSelectedText}>
                    {optionLabel(MEAT_CUT_OPTIONS, meatCutCategory)}
                  </Text>
                  <FormChevronDownIcon size={18} color={P.twGray500} />
                </TouchableOpacity>
                {isMeatCutDropdownOpen && (
                  <View style={styles.formDropdownMenu}>
                    {optionValues(MEAT_CUT_OPTIONS).map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[
                          styles.formDropdownItem,
                          meatCutCategory === c && styles.formDropdownItemActive,
                        ]}
                        onPress={() => {
                          setMeatCutCategory(c);
                          setIsMeatCutDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.formDropdownItemText,
                            meatCutCategory === c && styles.formDropdownItemTextActive,
                          ]}
                        >
                          {optionLabel(MEAT_CUT_OPTIONS, c)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Quality inspection grade */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.productionForm.inspectionGrade')}
                </Text>
                <TouchableOpacity
                  style={styles.formDropdownTrigger}
                  onPress={() => setIsMeatGradeDropdownOpen(!isMeatGradeDropdownOpen)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.a11y.selectInspectionGrade')}
                >
                  <Text style={styles.formDropdownSelectedText}>
                    {optionLabel(MEAT_GRADE_OPTIONS, meatGrade)}
                  </Text>
                  <FormChevronDownIcon size={18} color={P.twGray500} />
                </TouchableOpacity>
                {isMeatGradeDropdownOpen && (
                  <View style={styles.formDropdownMenu}>
                    {optionValues(MEAT_GRADE_OPTIONS).map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[
                          styles.formDropdownItem,
                          meatGrade === g && styles.formDropdownItemActive,
                        ]}
                        onPress={() => {
                          setMeatGrade(g);
                          setIsMeatGradeDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.formDropdownItemText,
                            meatGrade === g && styles.formDropdownItemTextActive,
                          ]}
                        >
                          {optionLabel(MEAT_GRADE_OPTIONS, g)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Is meat restricted from sale? */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.productionForm.meatRestricted')}
                </Text>
                <View style={styles.restrictionToggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.restrictionToggleBtn,
                      !isProductRestricted && styles.restrictionToggleBtnActive,
                    ]}
                    onPress={() => setIsProductRestricted(false)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.option.yesNo.NO')}
                  >
                    <Text
                      style={[
                        styles.restrictionToggleBtnText,
                        !isProductRestricted && styles.restrictionToggleBtnTextActive,
                      ]}
                    >
                      {t('farmer.livestock.detail.option.yesNo.NO')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.restrictionToggleBtn,
                      isProductRestricted && styles.restrictionToggleBtnActive,
                    ]}
                    onPress={() => setIsProductRestricted(true)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.option.yesNo.YES')}
                  >
                    <Text
                      style={[
                        styles.restrictionToggleBtnText,
                        isProductRestricted && styles.restrictionToggleBtnTextActive,
                      ]}
                    >
                      {t('farmer.livestock.detail.option.yesNo.YES')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {/* ── Type 4: Wool ── */}
          {productionType === 'WOOL' && (
            <>
              {/* Shearing session * */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.productionForm.shearingSession')}{' '}
                  <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.formDropdownTrigger}
                  onPress={() => setIsWoolSessionDropdownOpen(!isWoolSessionDropdownOpen)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.a11y.selectShearingSession')}
                >
                  <Text style={styles.formDropdownSelectedText}>
                    {optionLabel(WOOL_SHEARING_OPTIONS, woolSession)}
                  </Text>
                  <FormChevronDownIcon size={18} color={P.twGray500} />
                </TouchableOpacity>
                {isWoolSessionDropdownOpen && (
                  <View style={styles.formDropdownMenu}>
                    {optionValues(WOOL_SHEARING_OPTIONS).map((ses) => (
                      <TouchableOpacity
                        key={ses}
                        style={[
                          styles.formDropdownItem,
                          woolSession === ses && styles.formDropdownItemActive,
                        ]}
                        onPress={() => {
                          setWoolSession(ses);
                          setIsWoolSessionDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.formDropdownItemText,
                            woolSession === ses && styles.formDropdownItemTextActive,
                          ]}
                        >
                          {optionLabel(WOOL_SHEARING_OPTIONS, ses)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Fleece weight * */}
              <View style={styles.formRowHalf}>
                <View style={[styles.formGroup, styles.flexRatio14]}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.productionForm.fleeceWeight')}{' '}
                    <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={woolWeight}
                    onChangeText={setWoolWeight}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={P.twGray400}
                    maxLength={INPUT_MAX_LENGTH.decimal}
                  />
                </View>
                <View style={[styles.formGroup, styles.flexRatio10]}>
                  <Text style={styles.formLabel}> </Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsWoolWeightUnitDropdownOpen(!isWoolWeightUnitDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectWeightUnit')}
                  >
                    <Text style={styles.formDropdownSelectedText}>
                      {optionLabel(PRODUCTION_UNIT_LABELS, woolWeightUnit)}
                    </Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isWoolWeightUnitDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {PRODUCTION_UNIT_OPTIONS.WOOL.map((u) => (
                        <TouchableOpacity
                          key={u}
                          style={[
                            styles.formDropdownItem,
                            woolWeightUnit === u && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setWoolWeightUnit(u);
                            setIsWoolWeightUnitDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              woolWeightUnit === u && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(PRODUCTION_UNIT_LABELS, u)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Staple length (cm) */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.productionDetail.stapleLength')}
                </Text>
                <TextInput
                  style={styles.formTextInput}
                  value={woolStapleLength}
                  onChangeText={setWoolStapleLength}
                  keyboardType="decimal-pad"
                  placeholder={t('farmer.livestock.detail.productionForm.stapleLengthPlaceholder')}
                  placeholderTextColor={P.twGray400}
                  maxLength={INPUT_MAX_LENGTH.decimal}
                />
              </View>

              {/* Wool grade / Micron * */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.productionForm.woolGrade')}{' '}
                  <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.formDropdownTrigger}
                  onPress={() => setIsWoolGradeDropdownOpen(!isWoolGradeDropdownOpen)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.a11y.selectWoolGrade')}
                >
                  <Text style={styles.formDropdownSelectedText}>
                    {optionLabel(WOOL_GRADE_OPTIONS, woolGrade)}
                  </Text>
                  <FormChevronDownIcon size={18} color={P.twGray500} />
                </TouchableOpacity>
                {isWoolGradeDropdownOpen && (
                  <View style={styles.formDropdownMenu}>
                    {optionValues(WOOL_GRADE_OPTIONS).map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[
                          styles.formDropdownItem,
                          woolGrade === g && styles.formDropdownItemActive,
                        ]}
                        onPress={() => {
                          setWoolGrade(g);
                          setIsWoolGradeDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.formDropdownItemText,
                            woolGrade === g && styles.formDropdownItemTextActive,
                          ]}
                        >
                          {optionLabel(WOOL_GRADE_OPTIONS, g)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Fleece condition */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.productionForm.fleeceCondition')}
                </Text>
                <TouchableOpacity
                  style={styles.formDropdownTrigger}
                  onPress={() => setIsWoolConditionDropdownOpen(!isWoolConditionDropdownOpen)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.a11y.selectFleeceCondition')}
                >
                  <Text style={styles.formDropdownSelectedText}>
                    {optionLabel(WOOL_CONDITION_OPTIONS, woolCondition)}
                  </Text>
                  <FormChevronDownIcon size={18} color={P.twGray500} />
                </TouchableOpacity>
                {isWoolConditionDropdownOpen && (
                  <View style={styles.formDropdownMenu}>
                    {optionValues(WOOL_CONDITION_OPTIONS).map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[
                          styles.formDropdownItem,
                          woolCondition === c && styles.formDropdownItemActive,
                        ]}
                        onPress={() => {
                          setWoolCondition(c);
                          setIsWoolConditionDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.formDropdownItemText,
                            woolCondition === c && styles.formDropdownItemTextActive,
                          ]}
                        >
                          {optionLabel(WOOL_CONDITION_OPTIONS, c)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Is wool restricted from sale? */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.productionForm.woolRestricted')}
                </Text>
                <View style={styles.restrictionToggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.restrictionToggleBtn,
                      !isProductRestricted && styles.restrictionToggleBtnActive,
                    ]}
                    onPress={() => setIsProductRestricted(false)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.option.yesNo.NO')}
                  >
                    <Text
                      style={[
                        styles.restrictionToggleBtnText,
                        !isProductRestricted && styles.restrictionToggleBtnTextActive,
                      ]}
                    >
                      {t('farmer.livestock.detail.option.yesNo.NO')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.restrictionToggleBtn,
                      isProductRestricted && styles.restrictionToggleBtnActive,
                    ]}
                    onPress={() => setIsProductRestricted(true)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.option.yesNo.YES')}
                  >
                    <Text
                      style={[
                        styles.restrictionToggleBtnText,
                        isProductRestricted && styles.restrictionToggleBtnTextActive,
                      ]}
                    >
                      {t('farmer.livestock.detail.option.yesNo.YES')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {/* ── Type 5: Manure ── */}
          {productionType === 'MANURE' && (
            <>
              {/* Collection type * */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.productionDetail.collectionType')}{' '}
                  <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.formDropdownTrigger}
                  onPress={() =>
                    setIsManureCollectionTypeDropdownOpen(!isManureCollectionTypeDropdownOpen)
                  }
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.a11y.selectCollectionType')}
                >
                  <Text style={styles.formDropdownSelectedText}>
                    {optionLabel(MANURE_COLLECTION_OPTIONS, manureCollectionType)}
                  </Text>
                  <FormChevronDownIcon size={18} color={P.twGray500} />
                </TouchableOpacity>
                {isManureCollectionTypeDropdownOpen && (
                  <View style={styles.formDropdownMenu}>
                    {optionValues(MANURE_COLLECTION_OPTIONS).map((value) => (
                      <TouchableOpacity
                        key={value}
                        style={[
                          styles.formDropdownItem,
                          manureCollectionType === value && styles.formDropdownItemActive,
                        ]}
                        onPress={() => {
                          setManureCollectionType(value);
                          setIsManureCollectionTypeDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.formDropdownItemText,
                            manureCollectionType === value && styles.formDropdownItemTextActive,
                          ]}
                        >
                          {optionLabel(MANURE_COLLECTION_OPTIONS, value)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Quantity collected * */}
              <View style={styles.formRowHalf}>
                <View style={[styles.formGroup, styles.flexRatio14]}>
                  <Text style={styles.formLabel}>
                    {t('farmer.livestock.detail.productionForm.quantityCollected')}{' '}
                    <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={manureQuantity}
                    onChangeText={setManureQuantity}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={P.twGray400}
                    maxLength={INPUT_MAX_LENGTH.decimal}
                  />
                </View>
                <View style={[styles.formGroup, styles.flexRatio11]}>
                  <Text style={styles.formLabel}> </Text>
                  <TouchableOpacity
                    style={styles.formDropdownTrigger}
                    onPress={() => setIsManureUnitDropdownOpen(!isManureUnitDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.a11y.selectQuantityUnit')}
                  >
                    <Text style={styles.formDropdownSelectedText}>
                      {optionLabel(PRODUCTION_UNIT_LABELS, manureUnit)}
                    </Text>
                    <FormChevronDownIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                  {isManureUnitDropdownOpen && (
                    <View style={styles.formDropdownMenu}>
                      {PRODUCTION_UNIT_OPTIONS.MANURE.map((u) => (
                        <TouchableOpacity
                          key={u}
                          style={[
                            styles.formDropdownItem,
                            manureUnit === u && styles.formDropdownItemActive,
                          ]}
                          onPress={() => {
                            setManureUnit(u);
                            setIsManureUnitDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.formDropdownItemText,
                              manureUnit === u && styles.formDropdownItemTextActive,
                            ]}
                          >
                            {optionLabel(PRODUCTION_UNIT_LABELS, u)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Moisture level */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.productionForm.moistureLevel')}
                </Text>
                <TouchableOpacity
                  style={styles.formDropdownTrigger}
                  onPress={() => setIsManureMoistureDropdownOpen(!isManureMoistureDropdownOpen)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.a11y.selectMoistureLevel')}
                >
                  <Text style={styles.formDropdownSelectedText}>
                    {optionLabel(MANURE_MOISTURE_OPTIONS, manureMoisture)}
                  </Text>
                  <FormChevronDownIcon size={18} color={P.twGray500} />
                </TouchableOpacity>
                {isManureMoistureDropdownOpen && (
                  <View style={styles.formDropdownMenu}>
                    {optionValues(MANURE_MOISTURE_OPTIONS).map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.formDropdownItem,
                          manureMoisture === m && styles.formDropdownItemActive,
                        ]}
                        onPress={() => {
                          setManureMoisture(m);
                          setIsManureMoistureDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.formDropdownItemText,
                            manureMoisture === m && styles.formDropdownItemTextActive,
                          ]}
                        >
                          {optionLabel(MANURE_MOISTURE_OPTIONS, m)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Composting status * */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.productionDetail.compostingStatus')}{' '}
                  <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.formDropdownTrigger}
                  onPress={() => setIsManureCompostingDropdownOpen(!isManureCompostingDropdownOpen)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.livestock.detail.a11y.selectCompostingStatus')}
                >
                  <Text style={styles.formDropdownSelectedText}>
                    {optionLabel(MANURE_COMPOST_OPTIONS, manureCompostingStatus)}
                  </Text>
                  <FormChevronDownIcon size={18} color={P.twGray500} />
                </TouchableOpacity>
                {isManureCompostingDropdownOpen && (
                  <View style={styles.formDropdownMenu}>
                    {optionValues(MANURE_COMPOST_OPTIONS).map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.formDropdownItem,
                          manureCompostingStatus === s && styles.formDropdownItemActive,
                        ]}
                        onPress={() => {
                          setManureCompostingStatus(s);
                          setIsManureCompostingDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.formDropdownItemText,
                            manureCompostingStatus === s && styles.formDropdownItemTextActive,
                          ]}
                        >
                          {optionLabel(MANURE_COMPOST_OPTIONS, s)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Storage / Bin location */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.productionForm.storageLocation')}
                </Text>
                <TextInput
                  style={styles.formTextInput}
                  value={manureStorageLocation}
                  onChangeText={setManureStorageLocation}
                  placeholder={t('farmer.livestock.detail.productionForm.storagePlaceholder')}
                  placeholderTextColor={P.twGray400}
                  maxLength={INPUT_MAX_LENGTH.short}
                />
              </View>

              {/* Is manure restricted from use/sale? */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {t('farmer.livestock.detail.productionForm.manureRestricted')}
                </Text>
                <View style={styles.restrictionToggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.restrictionToggleBtn,
                      !isProductRestricted && styles.restrictionToggleBtnActive,
                    ]}
                    onPress={() => setIsProductRestricted(false)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.option.yesNo.NO')}
                  >
                    <Text
                      style={[
                        styles.restrictionToggleBtnText,
                        !isProductRestricted && styles.restrictionToggleBtnTextActive,
                      ]}
                    >
                      {t('farmer.livestock.detail.option.yesNo.NO')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.restrictionToggleBtn,
                      isProductRestricted && styles.restrictionToggleBtnActive,
                    ]}
                    onPress={() => setIsProductRestricted(true)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.livestock.detail.option.yesNo.YES')}
                  >
                    <Text
                      style={[
                        styles.restrictionToggleBtnText,
                        isProductRestricted && styles.restrictionToggleBtnTextActive,
                      ]}
                    >
                      {t('farmer.livestock.detail.option.yesNo.YES')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {/* Notes */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.notes')}</Text>
            <TextInput
              style={styles.formNotesInput}
              value={productionNotes}
              onChangeText={setProductionNotes}
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
              <Text style={styles.formLabel}>{t('farmer.livestock.detail.attachment.title')}</Text>
            </View>
            <View
              style={[styles.attachmentAddBox, styles.attachmentAddBoxDisabled]}
              accessibilityState={{ disabled: true }}
              testID="productionForm.attachmentDisabled"
            >
              <View style={styles.attachmentAddBoxInner}>
                <View style={styles.attachmentAddCircleBtn}>
                  <FormPlusIcon size={18} color={P.twGray400} />
                </View>
                <View style={styles.attachmentDisabledCol}>
                  <Text style={styles.attachmentAddTitle}>
                    {t('farmer.livestock.detail.attachment.add')}
                  </Text>
                  <Text style={styles.attachmentAddSubtitle}>
                    {t('farmer.livestock.detail.production.attachmentUnsupported')}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* + Add Production button */}
          <TouchableOpacity
            style={styles.addFeedItemBtn}
            onPress={() => void handleSaveProductionRecord()}
            disabled={saving}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.livestock.detail.production.addRecord')}
          >
            <PlusCircleOutlineIcon size={18} color={colors.brandGreen} />
            <Text style={styles.addFeedItemBtnText}>
              {t('farmer.livestock.detail.production.addRecord')}
            </Text>
          </TouchableOpacity>

          <FormErrors errors={productionErrors} testID="productionForm.errors" />

          {/* Form Bottom Action Buttons */}
          <View style={styles.modalActionButtonsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setIsAddProductionModalVisible(false)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.common.cancel')}
            >
              <Text style={styles.cancelBtnText}>{t('farmer.livestock.detail.common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnBusy]}
              onPress={() => void handleSaveProductionRecord()}
              disabled={saving}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ disabled: saving, busy: saving }}
              accessibilityLabel={t('farmer.livestock.detail.common.save')}
              testID="productionForm.save"
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
