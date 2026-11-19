import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authPalette as P } from '../../../../theme';
import { t } from '../../../../../../i18n/farmer';
import {
  INPUT_MAX_LENGTH,
  APPETITE_OPTIONS,
  CHECKUP_TYPE_OPTIONS,
  HEALTH_STATUS_OPTIONS,
  TEMPERATURE_UNIT_OPTIONS,
  WEIGHT_UNIT_OPTIONS,
  type buildCheckupBody,
  optionLabel,
  optionValues,
  type YesNo,
} from '../animalRecordForms';

import { styles } from './styles';
import {
  FormCalendarIcon,
  FormChevronDownIcon,
  FormClockIcon,
} from '../../../../assets/icons/AssetIcons';
import { useFields } from './useFields';

/** CHECKUP health-record form state. */
export function useCheckupForm() {
  return useFields({
    recordTime: '',
    checkupType: '',
    isCheckupTypeDropdownOpen: false,
    vetClinic: '',
    bodyTemp: '0',
    bodyTempUnit: 'C' as string,
    isTempUnitDropdownOpen: false,
    bodyWeight: '0',
    bodyWeightUnit: 'KG' as string,
    isWeightUnitDropdownOpen: false,
    generalHealthStatus: 'NORMAL' as string,
    isHealthStatusDropdownOpen: false,
    appetite: 'NORMAL' as string,
    isAppetiteDropdownOpen: false,
    activeLevel: '',
    symptoms: '',
    examinationFindings: '',
    diagnosis: '',
    treatmentRequired: 'NO' as YesNo,
    followUpRequired: 'NO' as YesNo,
    followUpDate: '',
    recommendedActions: '',
  });
}

export type CheckupForm = ReturnType<typeof useCheckupForm>;

/** The checkup form's values as buildCheckupBody input (moved unchanged from handleSaveHealthRecord). */
export function checkupInput(
  form: CheckupForm,
  shared: { recordDate: string; veterinarian: string },
): Parameters<typeof buildCheckupBody>[0] {
  const {
    recordTime,
    checkupType,
    vetClinic,
    bodyTemp,
    bodyTempUnit,
    bodyWeight,
    bodyWeightUnit,
    generalHealthStatus,
    appetite,
    activeLevel,
    symptoms,
    examinationFindings,
    diagnosis,
    treatmentRequired,
    followUpRequired,
    followUpDate,
    recommendedActions,
  } = form;
  const { recordDate, veterinarian } = shared;
  return {
    recordDate,
    time: recordTime,
    checkupType,
    veterinarian,
    clinic: vetClinic,
    bodyTemp,
    bodyTempUnit,
    bodyWeight,
    bodyWeightUnit,
    healthStatus: generalHealthStatus,
    appetite,
    activityLevel: activeLevel,
    symptoms,
    findings: examinationFindings,
    diagnosis,
    treatmentRequired,
    followUpRequired,
    followUpDate,
    recommendedActions,
  };
}

export interface CheckupFieldsProps {
  form: CheckupForm;
  recordDate: string;
  setRecordDate: React.Dispatch<React.SetStateAction<string>>;
  veterinarian: string;
  setVeterinarian: React.Dispatch<React.SetStateAction<string>>;
}

/** Checkup fields of the Add Health Record modal. */
export function CheckupFields({
  form,
  recordDate,
  setRecordDate,
  veterinarian,
  setVeterinarian,
}: CheckupFieldsProps): React.JSX.Element {
  const {
    recordTime,
    setRecordTime,
    checkupType,
    setCheckupType,
    isCheckupTypeDropdownOpen,
    setIsCheckupTypeDropdownOpen,
    vetClinic,
    setVetClinic,
    bodyTemp,
    setBodyTemp,
    bodyTempUnit,
    setBodyTempUnit,
    isTempUnitDropdownOpen,
    setIsTempUnitDropdownOpen,
    bodyWeight,
    setBodyWeight,
    bodyWeightUnit,
    setBodyWeightUnit,
    isWeightUnitDropdownOpen,
    setIsWeightUnitDropdownOpen,
    generalHealthStatus,
    setGeneralHealthStatus,
    isHealthStatusDropdownOpen,
    setIsHealthStatusDropdownOpen,
    appetite,
    setAppetite,
    isAppetiteDropdownOpen,
    setIsAppetiteDropdownOpen,
    activeLevel,
    setActiveLevel,
    symptoms,
    setSymptoms,
    examinationFindings,
    setExaminationFindings,
    diagnosis,
    setDiagnosis,
    treatmentRequired,
    setTreatmentRequired,
    followUpRequired,
    setFollowUpRequired,
    followUpDate,
    setFollowUpDate,
    recommendedActions,
    setRecommendedActions,
  } = form;

  return (
    <>
      {/* Checkup date + Time (side by side) */}
      <View style={styles.formRowHalf}>
        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>
            {t('farmer.livestock.detail.healthForm.checkupDate')}
          </Text>
          <View style={styles.formInputContainer}>
            <FormCalendarIcon size={18} color={P.twGray500} />
            <TextInput
              style={styles.formInputWithIcon}
              value={recordDate}
              onChangeText={setRecordDate}
              placeholder={t('farmer.livestock.detail.common.datePlaceholder')}
              placeholderTextColor={P.twGray400}
              maxLength={INPUT_MAX_LENGTH.date}
            />
          </View>
        </View>
        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.time')}</Text>
          <View style={styles.formInputContainer}>
            <TextInput
              style={[styles.formInputWithIcon, styles.flexRatio10]}
              value={recordTime}
              onChangeText={setRecordTime}
              placeholder={t('farmer.livestock.detail.common.timePlaceholder')}
              placeholderTextColor={P.twGray400}
              maxLength={INPUT_MAX_LENGTH.time}
            />
            <FormClockIcon size={18} color={P.twGray500} />
          </View>
        </View>
      </View>

      {/* Checkup Type dropdown */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>
          {t('farmer.livestock.detail.field.checkupType')}{' '}
          <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.formDropdownTrigger}
          onPress={() => setIsCheckupTypeDropdownOpen(!isCheckupTypeDropdownOpen)}
          activeOpacity={0.8}
        >
          <Text
            style={checkupType ? styles.formDropdownSelectedText : styles.formDropdownPlaceholder}
          >
            {optionLabel(CHECKUP_TYPE_OPTIONS, checkupType) ||
              t('farmer.livestock.detail.common.selectType')}
          </Text>
          <FormChevronDownIcon size={18} color={P.twGray500} />
        </TouchableOpacity>
        {isCheckupTypeDropdownOpen && (
          <View style={styles.formDropdownMenu}>
            {optionValues(CHECKUP_TYPE_OPTIONS).map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.formDropdownItem,
                  checkupType === option && styles.formDropdownItemActive,
                ]}
                onPress={() => {
                  setCheckupType(option);
                  setIsCheckupTypeDropdownOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.formDropdownItemText,
                    checkupType === option && styles.formDropdownItemTextActive,
                  ]}
                >
                  {optionLabel(CHECKUP_TYPE_OPTIONS, option)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Veterinarian name */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>
          {t('farmer.livestock.detail.healthForm.veterinarianName')}{' '}
          <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <TextInput
          style={styles.formTextInput}
          value={veterinarian}
          onChangeText={setVeterinarian}
          placeholder=""
          placeholderTextColor={P.twGray400}
          maxLength={INPUT_MAX_LENGTH.short}
        />
      </View>

      {/* Veterinary clinic */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>
          {t('farmer.livestock.detail.healthForm.veterinaryClinic')}{' '}
          <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <TextInput
          style={styles.formTextInput}
          value={vetClinic}
          onChangeText={setVetClinic}
          placeholder=""
          placeholderTextColor={P.twGray400}
          maxLength={INPUT_MAX_LENGTH.short}
        />
      </View>

      {/* Body temperature + Body Weight (side by side) */}
      <View style={styles.formRowHalf}>
        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.bodyTemperature')}</Text>
          <View style={styles.doseRow}>
            <View style={[styles.doseValueContainer, styles.flexRatio12]}>
              <TextInput
                style={styles.formTextInput}
                value={bodyTemp}
                onChangeText={setBodyTemp}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={P.twGray400}
                maxLength={INPUT_MAX_LENGTH.decimal}
              />
            </View>
            <TouchableOpacity
              style={[styles.doseUnitContainer, styles.flexRatio10]}
              onPress={() => setIsTempUnitDropdownOpen(!isTempUnitDropdownOpen)}
              activeOpacity={0.8}
            >
              <Text style={styles.formDropdownSelectedText}>
                {optionLabel(TEMPERATURE_UNIT_OPTIONS, bodyTempUnit)}
              </Text>
              <FormChevronDownIcon size={14} color={P.twGray500} />
            </TouchableOpacity>
          </View>
          {isTempUnitDropdownOpen && (
            <View style={styles.formDropdownMenu}>
              {optionValues(TEMPERATURE_UNIT_OPTIONS).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[
                    styles.formDropdownItem,
                    bodyTempUnit === u && styles.formDropdownItemActive,
                  ]}
                  onPress={() => {
                    setBodyTempUnit(u);
                    setIsTempUnitDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.formDropdownItemText,
                      bodyTempUnit === u && styles.formDropdownItemTextActive,
                    ]}
                  >
                    {optionLabel(TEMPERATURE_UNIT_OPTIONS, u)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.bodyWeight')}</Text>
          <View style={styles.doseRow}>
            <View style={[styles.doseValueContainer, styles.flexRatio12]}>
              <TextInput
                style={styles.formTextInput}
                value={bodyWeight}
                onChangeText={setBodyWeight}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={P.twGray400}
                maxLength={INPUT_MAX_LENGTH.decimal}
              />
            </View>
            <TouchableOpacity
              style={[styles.doseUnitContainer, styles.flexRatio10]}
              onPress={() => setIsWeightUnitDropdownOpen(!isWeightUnitDropdownOpen)}
              activeOpacity={0.8}
            >
              <Text style={styles.formDropdownSelectedText}>
                {optionLabel(WEIGHT_UNIT_OPTIONS, bodyWeightUnit)}
              </Text>
              <FormChevronDownIcon size={14} color={P.twGray500} />
            </TouchableOpacity>
          </View>
          {isWeightUnitDropdownOpen && (
            <View style={styles.formDropdownMenu}>
              {optionValues(WEIGHT_UNIT_OPTIONS).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[
                    styles.formDropdownItem,
                    bodyWeightUnit === u && styles.formDropdownItemActive,
                  ]}
                  onPress={() => {
                    setBodyWeightUnit(u);
                    setIsWeightUnitDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.formDropdownItemText,
                      bodyWeightUnit === u && styles.formDropdownItemTextActive,
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

      {/* General health status + Appetite (side by side) */}
      <View style={styles.formRowHalf}>
        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>
            {t('farmer.livestock.detail.healthForm.generalHealthStatus')}
          </Text>
          <TouchableOpacity
            style={styles.formDropdownTrigger}
            onPress={() => setIsHealthStatusDropdownOpen(!isHealthStatusDropdownOpen)}
            activeOpacity={0.8}
          >
            <Text style={styles.formDropdownSelectedText}>
              {optionLabel(HEALTH_STATUS_OPTIONS, generalHealthStatus)}
            </Text>
            <FormChevronDownIcon size={16} color={P.twGray500} />
          </TouchableOpacity>
          {isHealthStatusDropdownOpen && (
            <View style={styles.formDropdownMenu}>
              {optionValues(HEALTH_STATUS_OPTIONS).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.formDropdownItem,
                    generalHealthStatus === opt && styles.formDropdownItemActive,
                  ]}
                  onPress={() => {
                    setGeneralHealthStatus(opt);
                    setIsHealthStatusDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.formDropdownItemText,
                      generalHealthStatus === opt && styles.formDropdownItemTextActive,
                    ]}
                  >
                    {optionLabel(HEALTH_STATUS_OPTIONS, opt)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>{t('farmer.livestock.detail.healthForm.appetite')}</Text>
          <TouchableOpacity
            style={styles.formDropdownTrigger}
            onPress={() => setIsAppetiteDropdownOpen(!isAppetiteDropdownOpen)}
            activeOpacity={0.8}
          >
            <Text style={styles.formDropdownSelectedText}>
              {optionLabel(APPETITE_OPTIONS, appetite)}
            </Text>
            <FormChevronDownIcon size={16} color={P.twGray500} />
          </TouchableOpacity>
          {isAppetiteDropdownOpen && (
            <View style={styles.formDropdownMenu}>
              {optionValues(APPETITE_OPTIONS).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.formDropdownItem,
                    appetite === opt && styles.formDropdownItemActive,
                  ]}
                  onPress={() => {
                    setAppetite(opt);
                    setIsAppetiteDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.formDropdownItemText,
                      appetite === opt && styles.formDropdownItemTextActive,
                    ]}
                  >
                    {optionLabel(APPETITE_OPTIONS, opt)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Active level */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.activityLevel')}</Text>
        <TextInput
          style={styles.formTextInput}
          value={activeLevel}
          onChangeText={setActiveLevel}
          placeholder=""
          placeholderTextColor={P.twGray400}
          maxLength={INPUT_MAX_LENGTH.short}
        />
      </View>

      {/* Symptoms / Observations */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>
          {t('farmer.livestock.detail.healthForm.symptomsObservations')}
        </Text>
        <TextInput
          style={styles.formNotesInput}
          value={symptoms}
          onChangeText={setSymptoms}
          multiline
          placeholder=""
          placeholderTextColor={P.twGray400}
          textAlignVertical="top"
          maxLength={INPUT_MAX_LENGTH.long}
        />
      </View>

      {/* Examination findings */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>
          {t('farmer.livestock.detail.healthForm.examinationFindings')}
        </Text>
        <TextInput
          style={styles.formNotesInput}
          value={examinationFindings}
          onChangeText={setExaminationFindings}
          multiline
          placeholder=""
          placeholderTextColor={P.twGray400}
          textAlignVertical="top"
          maxLength={INPUT_MAX_LENGTH.long}
        />
      </View>

      {/* Diagnosis / suspected condition */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>{t('farmer.livestock.detail.healthForm.diagnosis')}</Text>
        <TextInput
          style={styles.formNotesInput}
          value={diagnosis}
          onChangeText={setDiagnosis}
          multiline
          placeholder=""
          placeholderTextColor={P.twGray400}
          textAlignVertical="top"
          maxLength={INPUT_MAX_LENGTH.long}
        />
      </View>

      {/* Treatment required + Follow-up required (side by side) */}
      <View style={styles.formRowHalf}>
        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>
            {t('farmer.livestock.detail.healthForm.treatmentRequired')}
          </Text>
          <View style={styles.yesNoRow}>
            <TouchableOpacity
              style={[styles.yesNoPill, treatmentRequired === 'YES' && styles.yesNoPillActive]}
              onPress={() => setTreatmentRequired('YES')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.yesNoPillText,
                  treatmentRequired === 'YES' && styles.yesNoPillTextActive,
                ]}
              >
                {t('farmer.livestock.detail.option.yesNo.YES')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.yesNoPill, treatmentRequired === 'NO' && styles.yesNoPillActive]}
              onPress={() => setTreatmentRequired('NO')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.yesNoPillText,
                  treatmentRequired === 'NO' && styles.yesNoPillTextActive,
                ]}
              >
                {t('farmer.livestock.detail.option.yesNo.NO')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>
            {t('farmer.livestock.detail.healthForm.followUpRequired')}
          </Text>
          <View style={styles.yesNoRow}>
            <TouchableOpacity
              style={[styles.yesNoPill, followUpRequired === 'YES' && styles.yesNoPillActive]}
              onPress={() => setFollowUpRequired('YES')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.yesNoPillText,
                  followUpRequired === 'YES' && styles.yesNoPillTextActive,
                ]}
              >
                {t('farmer.livestock.detail.option.yesNo.YES')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.yesNoPill, followUpRequired === 'NO' && styles.yesNoPillActive]}
              onPress={() => setFollowUpRequired('NO')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.yesNoPillText,
                  followUpRequired === 'NO' && styles.yesNoPillTextActive,
                ]}
              >
                {t('farmer.livestock.detail.option.yesNo.NO')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Follow-up date */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>
          {t('farmer.livestock.detail.field.followUpDate')}{' '}
          <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <View style={styles.formInputContainer}>
          <FormCalendarIcon size={18} color={P.twGray500} />
          <TextInput
            style={styles.formInputWithIcon}
            value={followUpDate}
            onChangeText={setFollowUpDate}
            placeholder={t('farmer.livestock.detail.common.datePlaceholder')}
            placeholderTextColor={P.twGray400}
            maxLength={INPUT_MAX_LENGTH.date}
          />
        </View>
      </View>

      {/* Recommended actions */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>
          {t('farmer.livestock.detail.field.recommendedActions')}
        </Text>
        <TextInput
          style={styles.formNotesInput}
          value={recommendedActions}
          onChangeText={setRecommendedActions}
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
