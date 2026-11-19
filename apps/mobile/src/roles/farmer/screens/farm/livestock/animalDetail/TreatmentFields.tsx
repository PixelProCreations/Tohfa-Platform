import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authPalette as P, colors } from '../../../../theme';
import { t } from '../../../../../../i18n/farmer';
import {
  INPUT_MAX_LENGTH,
  TREATMENT_DOSAGE_UNIT_OPTIONS,
  TREATMENT_FREQUENCY_OPTIONS,
  TREATMENT_ROUTE_OPTIONS,
  TREATMENT_TYPE_OPTIONS,
  type buildTreatmentBody,
  optionLabel,
  optionValues,
  type YesNo,
} from '../animalRecordForms';

import { styles } from './styles';
import {
  FormCalendarIcon,
  FormChevronDownIcon,
  BandaidCrossIcon,
  MedicalCrossIcon,
} from '../../../../assets/icons/AssetIcons';
import { useFields } from './useFields';

/** TREATMENT health-record form state. */
export function useTreatmentForm() {
  return useFields({
    treatmentDate: '',
    treatmentType: 'MEDICATION' as string,
    isTreatmentTypeDropdownOpen: false,
    conditionDiagnosis: '',
    treatmentSymptoms: '',
    treatmentDescription: '',
    treatmentMedicineName: '',
    treatmentDosage: '0',
    treatmentDosageUnit: 'GRAM' as string,
    isTreatmentDosageUnitDropdownOpen: false,
    treatmentRoute: 'TOPICAL' as string,
    isTreatmentRouteDropdownOpen: false,
    treatmentFrequency: 'TWICE_DAILY' as string,
    isTreatmentFrequencyDropdownOpen: false,
    treatmentStartDate: '',
    treatmentEndDate: '',
    milkWithdrawalRequired: 'NO' as YesNo,
    milkWithdrawalStartDate: '',
    milkWithdrawalEndDate: '',
    withdrawalReason: '',
    meatWithdrawalRequired: 'NO' as YesNo,
    meatWithdrawalEndDate: '',
    prescribedBy: '',
    treatmentAdministeredBy: '',
    treatmentNotes: '',
  });
}

export type TreatmentForm = ReturnType<typeof useTreatmentForm>;

/** The treatment form's values as buildTreatmentBody input (moved unchanged from handleSaveHealthRecord). */
export function treatmentInput(form: TreatmentForm): Parameters<typeof buildTreatmentBody>[0] {
  const {
    treatmentDate,
    treatmentType,
    conditionDiagnosis,
    treatmentSymptoms,
    treatmentDescription,
    treatmentMedicineName,
    treatmentDosage,
    treatmentDosageUnit,
    treatmentRoute,
    treatmentFrequency,
    treatmentStartDate,
    treatmentEndDate,
    milkWithdrawalRequired,
    milkWithdrawalStartDate,
    milkWithdrawalEndDate,
    withdrawalReason,
    meatWithdrawalRequired,
    meatWithdrawalEndDate,
    prescribedBy,
    treatmentAdministeredBy,
    treatmentNotes,
  } = form;
  return {
    recordDate: treatmentDate,
    treatmentType,
    condition: conditionDiagnosis,
    symptoms: treatmentSymptoms,
    description: treatmentDescription,
    medicineName: treatmentMedicineName,
    dosage: treatmentDosage,
    dosageUnit: treatmentDosageUnit,
    route: treatmentRoute,
    frequency: treatmentFrequency,
    startDate: treatmentStartDate,
    endDate: treatmentEndDate,
    milkWithdrawalRequired,
    milkWithdrawalStart: milkWithdrawalStartDate,
    milkWithdrawalEnd: milkWithdrawalEndDate,
    withdrawalReason,
    meatWithdrawalRequired,
    meatWithdrawalEnd: meatWithdrawalEndDate,
    prescribedBy,
    administeredBy: treatmentAdministeredBy,
    notes: treatmentNotes,
  };
}

export interface TreatmentFieldsProps {
  form: TreatmentForm;
}

/** Treatment fields of the Add Health Record modal (BR-137 withdrawal windows). */
export function TreatmentFields({ form }: TreatmentFieldsProps): React.JSX.Element {
  const {
    treatmentDate,
    setTreatmentDate,
    treatmentType,
    setTreatmentType,
    isTreatmentTypeDropdownOpen,
    setIsTreatmentTypeDropdownOpen,
    conditionDiagnosis,
    setConditionDiagnosis,
    treatmentSymptoms,
    setTreatmentSymptoms,
    treatmentDescription,
    setTreatmentDescription,
    treatmentMedicineName,
    setTreatmentMedicineName,
    treatmentDosage,
    setTreatmentDosage,
    treatmentDosageUnit,
    setTreatmentDosageUnit,
    isTreatmentDosageUnitDropdownOpen,
    setIsTreatmentDosageUnitDropdownOpen,
    treatmentRoute,
    setTreatmentRoute,
    isTreatmentRouteDropdownOpen,
    setIsTreatmentRouteDropdownOpen,
    treatmentFrequency,
    setTreatmentFrequency,
    isTreatmentFrequencyDropdownOpen,
    setIsTreatmentFrequencyDropdownOpen,
    treatmentStartDate,
    setTreatmentStartDate,
    treatmentEndDate,
    setTreatmentEndDate,
    milkWithdrawalRequired,
    setMilkWithdrawalRequired,
    milkWithdrawalStartDate,
    setMilkWithdrawalStartDate,
    milkWithdrawalEndDate,
    setMilkWithdrawalEndDate,
    withdrawalReason,
    setWithdrawalReason,
    meatWithdrawalRequired,
    setMeatWithdrawalRequired,
    meatWithdrawalEndDate,
    setMeatWithdrawalEndDate,
    prescribedBy,
    setPrescribedBy,
    treatmentAdministeredBy,
    setTreatmentAdministeredBy,
    treatmentNotes,
    setTreatmentNotes,
  } = form;

  return (
    <>
      {/* ── Treatment Section 1: Treatment Information ── */}
      <View style={styles.sectionBanner}>
        <BandaidCrossIcon size={16} color={P.twOrange600} />
        <Text style={styles.sectionBannerText}>
          {t('farmer.livestock.detail.treatmentForm.sectionTreatment')}
        </Text>
      </View>

      {/* Treatment date + Treatment Type (side-by-side) */}
      <View style={styles.formRowHalf}>
        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>
            {t('farmer.livestock.detail.treatmentForm.treatmentDate')}
          </Text>
          <View style={styles.formInputContainer}>
            <FormCalendarIcon size={18} color={P.twGray500} />
            <TextInput
              style={styles.formInputWithIcon}
              value={treatmentDate}
              onChangeText={setTreatmentDate}
              testID="healthForm.treatmentDate"
              placeholder={t('farmer.livestock.detail.common.datePlaceholder')}
              placeholderTextColor={P.twGray400}
              maxLength={INPUT_MAX_LENGTH.date}
            />
          </View>
        </View>

        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>
            {t('farmer.livestock.detail.treatmentForm.treatmentType')}
          </Text>
          <TouchableOpacity
            style={styles.formDropdownTrigger}
            onPress={() => setIsTreatmentTypeDropdownOpen(!isTreatmentTypeDropdownOpen)}
            activeOpacity={0.8}
          >
            <Text style={styles.formDropdownSelectedText}>
              {optionLabel(TREATMENT_TYPE_OPTIONS, treatmentType)}
            </Text>
            <FormChevronDownIcon size={16} color={P.twGray500} />
          </TouchableOpacity>
          {isTreatmentTypeDropdownOpen && (
            <View style={styles.formDropdownMenu}>
              {optionValues(TREATMENT_TYPE_OPTIONS).map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.formDropdownItem,
                    treatmentType === value && styles.formDropdownItemActive,
                  ]}
                  onPress={() => {
                    setTreatmentType(value);
                    setIsTreatmentTypeDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.formDropdownItemText,
                      treatmentType === value && styles.formDropdownItemTextActive,
                    ]}
                  >
                    {optionLabel(TREATMENT_TYPE_OPTIONS, value)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Condition / diagnosis * */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>
          {t('farmer.livestock.detail.field.condition')}{' '}
          <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <TextInput
          style={styles.formTextInput}
          value={conditionDiagnosis}
          onChangeText={setConditionDiagnosis}
          testID="healthForm.condition"
          placeholder=""
          placeholderTextColor={P.twGray400}
          maxLength={INPUT_MAX_LENGTH.short}
        />
      </View>

      {/* Symptoms */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.symptoms')}</Text>
        <TextInput
          style={styles.formTextInput}
          value={treatmentSymptoms}
          onChangeText={setTreatmentSymptoms}
          placeholder=""
          placeholderTextColor={P.twGray400}
          maxLength={INPUT_MAX_LENGTH.short}
        />
      </View>

      {/* Treatment description * */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>
          {t('farmer.livestock.detail.field.description')}{' '}
          <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <TextInput
          style={styles.formTextInput}
          value={treatmentDescription}
          onChangeText={setTreatmentDescription}
          testID="healthForm.description"
          placeholder=""
          placeholderTextColor={P.twGray400}
          maxLength={INPUT_MAX_LENGTH.short}
        />
      </View>

      {/* ── Treatment Section 2: Medication Details ── */}
      <View style={styles.sectionBanner}>
        <MedicalCrossIcon size={16} color={colors.brandGreen} />
        <Text style={styles.sectionBannerText}>
          {t('farmer.livestock.detail.treatmentForm.sectionMedication')}
        </Text>
      </View>

      {/* Medicine name + Dosage (side-by-side) */}
      <View style={styles.formRowHalf}>
        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.medicineName')}</Text>
          <TextInput
            style={styles.formTextInput}
            value={treatmentMedicineName}
            onChangeText={setTreatmentMedicineName}
            placeholder=""
            placeholderTextColor={P.twGray400}
            maxLength={INPUT_MAX_LENGTH.short}
          />
        </View>

        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.dosage')}</Text>
          <View style={styles.doseRow}>
            <View style={[styles.doseValueContainer, styles.flexRatio12]}>
              <TextInput
                style={styles.formTextInput}
                value={treatmentDosage}
                onChangeText={setTreatmentDosage}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={P.twGray400}
                maxLength={INPUT_MAX_LENGTH.decimal}
              />
            </View>
            <TouchableOpacity
              style={[styles.doseUnitContainer, styles.flexRatio10]}
              onPress={() =>
                setIsTreatmentDosageUnitDropdownOpen(!isTreatmentDosageUnitDropdownOpen)
              }
              activeOpacity={0.8}
            >
              <Text style={styles.formDropdownSelectedText}>
                {optionLabel(TREATMENT_DOSAGE_UNIT_OPTIONS, treatmentDosageUnit)}
              </Text>
              <FormChevronDownIcon size={16} color={P.twGray500} />
            </TouchableOpacity>
          </View>
          {isTreatmentDosageUnitDropdownOpen && (
            <View style={styles.formDropdownMenu}>
              {optionValues(TREATMENT_DOSAGE_UNIT_OPTIONS).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[
                    styles.formDropdownItem,
                    treatmentDosageUnit === u && styles.formDropdownItemActive,
                  ]}
                  onPress={() => {
                    setTreatmentDosageUnit(u);
                    setIsTreatmentDosageUnitDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.formDropdownItemText,
                      treatmentDosageUnit === u && styles.formDropdownItemTextActive,
                    ]}
                  >
                    {optionLabel(TREATMENT_DOSAGE_UNIT_OPTIONS, u)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Administration route + Frequency (side-by-side) */}
      <View style={styles.formRowHalf}>
        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>
            {t('farmer.livestock.detail.healthForm.administrationRoute')}
          </Text>
          <TouchableOpacity
            style={styles.formDropdownTrigger}
            onPress={() => setIsTreatmentRouteDropdownOpen(!isTreatmentRouteDropdownOpen)}
            activeOpacity={0.8}
          >
            <Text style={styles.formDropdownSelectedText}>
              {optionLabel(TREATMENT_ROUTE_OPTIONS, treatmentRoute)}
            </Text>
            <FormChevronDownIcon size={16} color={P.twGray500} />
          </TouchableOpacity>
          {isTreatmentRouteDropdownOpen && (
            <View style={styles.formDropdownMenu}>
              {optionValues(TREATMENT_ROUTE_OPTIONS).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.formDropdownItem,
                    treatmentRoute === r && styles.formDropdownItemActive,
                  ]}
                  onPress={() => {
                    setTreatmentRoute(r);
                    setIsTreatmentRouteDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.formDropdownItemText,
                      treatmentRoute === r && styles.formDropdownItemTextActive,
                    ]}
                  >
                    {optionLabel(TREATMENT_ROUTE_OPTIONS, r)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>
            {t('farmer.livestock.detail.treatmentForm.frequency')}
          </Text>
          <TouchableOpacity
            style={styles.formDropdownTrigger}
            onPress={() => setIsTreatmentFrequencyDropdownOpen(!isTreatmentFrequencyDropdownOpen)}
            activeOpacity={0.8}
          >
            <Text style={styles.formDropdownSelectedText}>
              {optionLabel(TREATMENT_FREQUENCY_OPTIONS, treatmentFrequency)}
            </Text>
            <FormChevronDownIcon size={16} color={P.twGray500} />
          </TouchableOpacity>
          {isTreatmentFrequencyDropdownOpen && (
            <View style={styles.formDropdownMenu}>
              {optionValues(TREATMENT_FREQUENCY_OPTIONS).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.formDropdownItem,
                    treatmentFrequency === f && styles.formDropdownItemActive,
                  ]}
                  onPress={() => {
                    setTreatmentFrequency(f);
                    setIsTreatmentFrequencyDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.formDropdownItemText,
                      treatmentFrequency === f && styles.formDropdownItemTextActive,
                    ]}
                  >
                    {optionLabel(TREATMENT_FREQUENCY_OPTIONS, f)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Start date + End date (side-by-side) */}
      <View style={styles.formRowHalf}>
        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.startDate')}</Text>
          <View style={styles.formInputContainer}>
            <FormCalendarIcon size={18} color={P.twGray500} />
            <TextInput
              style={styles.formInputWithIcon}
              value={treatmentStartDate}
              onChangeText={setTreatmentStartDate}
              placeholder={t('farmer.livestock.detail.common.datePlaceholder')}
              placeholderTextColor={P.twGray400}
              maxLength={INPUT_MAX_LENGTH.date}
            />
          </View>
        </View>

        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>{t('farmer.livestock.detail.treatmentForm.endDate')}</Text>
          <View style={styles.formInputContainer}>
            <FormCalendarIcon size={18} color={P.twGray500} />
            <TextInput
              style={styles.formInputWithIcon}
              value={treatmentEndDate}
              onChangeText={setTreatmentEndDate}
              placeholder={t('farmer.livestock.detail.common.datePlaceholder')}
              placeholderTextColor={P.twGray400}
              maxLength={INPUT_MAX_LENGTH.date}
            />
          </View>
        </View>
      </View>

      {/* ── Treatment Section 3: withdrawal Information ── */}
      <View style={styles.sectionBanner}>
        <BandaidCrossIcon size={16} color={P.twOrange600} />
        <Text style={styles.sectionBannerText}>
          {t('farmer.livestock.detail.treatmentForm.sectionWithdrawal')}
        </Text>
      </View>

      {/* Milk withdrawal required? */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>
          {t('farmer.livestock.detail.treatmentForm.milkWithdrawalRequired')}
        </Text>
        <View style={styles.radioRow}>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setMilkWithdrawalRequired('YES')}
            testID="healthForm.milkWithdrawalYes"
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.radioCircle,
                milkWithdrawalRequired === 'YES' && styles.radioCircleSelected,
              ]}
            >
              {milkWithdrawalRequired === 'YES' && <View style={styles.radioInnerDot} />}
            </View>
            <Text style={styles.radioLabel}>{t('farmer.livestock.detail.option.yesNo.YES')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setMilkWithdrawalRequired('NO')}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.radioCircle,
                milkWithdrawalRequired === 'NO' && styles.radioCircleSelected,
              ]}
            >
              {milkWithdrawalRequired === 'NO' && <View style={styles.radioInnerDot} />}
            </View>
            <Text style={styles.radioLabel}>{t('farmer.livestock.detail.option.yesNo.NO')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Start date + End date (side-by-side) */}
      <View style={styles.formRowHalf}>
        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.startDate')}</Text>
          <View style={styles.formInputContainer}>
            <FormCalendarIcon size={18} color={P.twGray500} />
            <TextInput
              style={styles.formInputWithIcon}
              value={milkWithdrawalStartDate}
              onChangeText={setMilkWithdrawalStartDate}
              testID="healthForm.milkWithdrawalStart"
              placeholder={t('farmer.livestock.detail.common.datePlaceholder')}
              placeholderTextColor={P.twGray400}
              maxLength={INPUT_MAX_LENGTH.date}
            />
          </View>
        </View>

        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>{t('farmer.livestock.detail.treatmentForm.endDate')}</Text>
          <View style={styles.formInputContainer}>
            <FormCalendarIcon size={18} color={P.twGray500} />
            <TextInput
              style={styles.formInputWithIcon}
              value={milkWithdrawalEndDate}
              onChangeText={setMilkWithdrawalEndDate}
              testID="healthForm.milkWithdrawalEnd"
              placeholder={t('farmer.livestock.detail.common.datePlaceholder')}
              placeholderTextColor={P.twGray400}
              maxLength={INPUT_MAX_LENGTH.date}
            />
          </View>
        </View>
      </View>

      {/* Reason */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>{t('farmer.livestock.detail.treatmentForm.reason')}</Text>
        <TextInput
          style={styles.formTextInput}
          value={withdrawalReason}
          onChangeText={setWithdrawalReason}
          placeholder=""
          placeholderTextColor={P.twGray400}
          maxLength={INPUT_MAX_LENGTH.short}
        />
      </View>

      {/* Meat withdrawal required? */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>
          {t('farmer.livestock.detail.treatmentForm.meatWithdrawalRequired')}
        </Text>
        <View style={styles.radioRow}>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setMeatWithdrawalRequired('YES')}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.radioCircle,
                meatWithdrawalRequired === 'YES' && styles.radioCircleSelected,
              ]}
            >
              {meatWithdrawalRequired === 'YES' && <View style={styles.radioInnerDot} />}
            </View>
            <Text style={styles.radioLabel}>{t('farmer.livestock.detail.option.yesNo.YES')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setMeatWithdrawalRequired('NO')}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.radioCircle,
                meatWithdrawalRequired === 'NO' && styles.radioCircleSelected,
              ]}
            >
              {meatWithdrawalRequired === 'NO' && <View style={styles.radioInnerDot} />}
            </View>
            <Text style={styles.radioLabel}>{t('farmer.livestock.detail.option.yesNo.NO')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {meatWithdrawalRequired === 'YES' && (
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>
            {t('farmer.livestock.detail.treatmentForm.meatWithdrawalEnd')}
          </Text>
          <View style={styles.formInputContainer}>
            <FormCalendarIcon size={18} color={P.twGray500} />
            <TextInput
              style={styles.formInputWithIcon}
              value={meatWithdrawalEndDate}
              onChangeText={setMeatWithdrawalEndDate}
              testID="healthForm.meatWithdrawalEnd"
              placeholder={t('farmer.livestock.detail.form.datePlaceholder')}
              placeholderTextColor={P.twGray400}
              maxLength={INPUT_MAX_LENGTH.date}
            />
          </View>
        </View>
      )}

      {/* ── Treatment Section 4: Additional Details ── */}
      <View style={styles.sectionBanner}>
        <MedicalCrossIcon size={16} color={colors.brandGreen} />
        <Text style={styles.sectionBannerText}>
          {t('farmer.livestock.detail.common.additionalDetails')}
        </Text>
      </View>

      {/* Prescribed by + Administered by (side-by-side) */}
      <View style={styles.formRowHalf}>
        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.prescribedBy')}</Text>
          <TextInput
            style={styles.formTextInput}
            value={prescribedBy}
            onChangeText={setPrescribedBy}
            placeholder=""
            placeholderTextColor={P.twGray400}
            maxLength={INPUT_MAX_LENGTH.short}
          />
        </View>

        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.administeredBy')}</Text>
          <TextInput
            style={styles.formTextInput}
            value={treatmentAdministeredBy}
            onChangeText={setTreatmentAdministeredBy}
            placeholder=""
            placeholderTextColor={P.twGray400}
            maxLength={INPUT_MAX_LENGTH.short}
          />
        </View>
      </View>

      {/* Notes */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.notes')}</Text>
        <TextInput
          style={styles.formNotesInput}
          value={treatmentNotes}
          onChangeText={setTreatmentNotes}
          multiline
          placeholder=""
          placeholderTextColor={P.twGray400}
          textAlignVertical="top"
          maxLength={INPUT_MAX_LENGTH.long}
        />
      </View>
    </>
  );
}
