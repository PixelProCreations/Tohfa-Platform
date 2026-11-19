import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authPalette as P } from '../../../../theme';
import { t } from '../../../../../../i18n/farmer';
import {
  INPUT_MAX_LENGTH,
  DEWORMING_ROUTE_OPTIONS,
  OBSERVED_REACTION_OPTIONS,
  TARGET_PARASITE_OPTIONS,
  VACCINE_DOSE_UNIT_OPTIONS,
  WEIGHT_UNIT_OPTIONS,
  type buildDewormingBody,
  optionLabel,
  optionValues,
} from '../animalRecordForms';

import { styles } from './styles';
import {
  FormCalendarIcon,
  FormChevronDownIcon,
  FormCloseIcon,
} from '../../../../assets/icons/AssetIcons';
import { useFields } from './useFields';

/** DEWORMING health-record form state. */
export function useDewormingForm() {
  return useFields({
    dewormDate: '',
    dewormProductName: '',
    activeIngredient: '',
    targetParasite: 'INTERNAL_WORMS' as string,
    isDewormTargetDropdownOpen: false,
    dewormDose: '0',
    dewormDoseUnit: 'ML' as string,
    isDewormDoseUnitDropdownOpen: false,
    dewormAdminRoute: 'ORAL' as string,
    isDewormAdminRouteDropdownOpen: false,
    dewormAnimalWeight: '0',
    dewormWeightUnit: 'KG' as string,
    isDewormWeightUnitDropdownOpen: false,
    dewormBatchNumber: '',
    dewormExpiryDate: '',
    dewormAdministeredBy: '',
    dewormNextDueDate: '',
    dewormObservedReaction: '',
    isDewormReactionDropdownOpen: false,
    dewormNotes: '',
  });
}

export type DewormingForm = ReturnType<typeof useDewormingForm>;

/** The deworming form's values as buildDewormingBody input (moved unchanged from handleSaveHealthRecord). */
export function dewormingInput(form: DewormingForm): Parameters<typeof buildDewormingBody>[0] {
  const {
    dewormDate,
    dewormProductName,
    activeIngredient,
    targetParasite,
    dewormDose,
    dewormDoseUnit,
    dewormAdminRoute,
    dewormAnimalWeight,
    dewormWeightUnit,
    dewormBatchNumber,
    dewormExpiryDate,
    dewormAdministeredBy,
    dewormNextDueDate,
    dewormObservedReaction,
    dewormNotes,
  } = form;
  return {
    recordDate: dewormDate,
    productName: dewormProductName,
    activeIngredient,
    targetParasite,
    dose: dewormDose,
    doseUnit: dewormDoseUnit,
    route: dewormAdminRoute,
    animalWeight: dewormAnimalWeight,
    weightUnit: dewormWeightUnit,
    batchNumber: dewormBatchNumber,
    expiryDate: dewormExpiryDate,
    administeredBy: dewormAdministeredBy,
    nextDueDate: dewormNextDueDate,
    observedReaction: dewormObservedReaction,
    notes: dewormNotes,
  };
}

export interface DewormingFieldsProps {
  form: DewormingForm;
}

/** Deworming fields of the Add Health Record modal. */
export function DewormingFields({ form }: DewormingFieldsProps): React.JSX.Element {
  const {
    dewormDate,
    setDewormDate,
    dewormProductName,
    setDewormProductName,
    activeIngredient,
    setActiveIngredient,
    targetParasite,
    setTargetParasite,
    isDewormTargetDropdownOpen,
    setIsDewormTargetDropdownOpen,
    dewormDose,
    setDewormDose,
    dewormDoseUnit,
    setDewormDoseUnit,
    isDewormDoseUnitDropdownOpen,
    setIsDewormDoseUnitDropdownOpen,
    dewormAdminRoute,
    setDewormAdminRoute,
    isDewormAdminRouteDropdownOpen,
    setIsDewormAdminRouteDropdownOpen,
    dewormAnimalWeight,
    setDewormAnimalWeight,
    dewormWeightUnit,
    setDewormWeightUnit,
    isDewormWeightUnitDropdownOpen,
    setIsDewormWeightUnitDropdownOpen,
    dewormBatchNumber,
    setDewormBatchNumber,
    dewormExpiryDate,
    setDewormExpiryDate,
    dewormAdministeredBy,
    setDewormAdministeredBy,
    dewormNextDueDate,
    setDewormNextDueDate,
    dewormObservedReaction,
    setDewormObservedReaction,
    isDewormReactionDropdownOpen,
    setIsDewormReactionDropdownOpen,
    dewormNotes,
    setDewormNotes,
  } = form;

  return (
    <>
      {/* Deworming date * */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>
          {t('farmer.livestock.detail.healthForm.dewormingDate')}{' '}
          <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <View style={styles.formInputContainer}>
          <FormCalendarIcon size={18} color={P.twGray500} />
          <TextInput
            style={styles.formInputWithIcon}
            value={dewormDate}
            onChangeText={setDewormDate}
            placeholder={t('farmer.livestock.detail.common.datePlaceholder')}
            placeholderTextColor={P.twGray400}
            maxLength={INPUT_MAX_LENGTH.date}
          />
        </View>
      </View>

      {/* Deworming product name * */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>
          {t('farmer.livestock.detail.healthForm.dewormingProductName')}{' '}
          <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <TextInput
          style={styles.formTextInput}
          value={dewormProductName}
          onChangeText={setDewormProductName}
          placeholder=""
          placeholderTextColor={P.twGray400}
          maxLength={INPUT_MAX_LENGTH.short}
        />
      </View>

      {/* Active ingredient */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.activeIngredient')}</Text>
        <TextInput
          style={styles.formTextInput}
          value={activeIngredient}
          onChangeText={setActiveIngredient}
          placeholder=""
          placeholderTextColor={P.twGray400}
          maxLength={INPUT_MAX_LENGTH.short}
        />
      </View>

      {/* Target parasite (Chip dropdown) */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>
          {t('farmer.livestock.detail.healthForm.targetParasite')}
        </Text>
        <TouchableOpacity
          style={styles.chipDropdownTrigger}
          onPress={() => setIsDewormTargetDropdownOpen(!isDewormTargetDropdownOpen)}
          activeOpacity={0.8}
        >
          <View style={styles.chipWrapRow}>
            {targetParasite ? (
              <View style={styles.tagChip}>
                <Text style={styles.tagChipText}>
                  {optionLabel(TARGET_PARASITE_OPTIONS, targetParasite)}
                </Text>
                <TouchableOpacity
                  onPress={() => setTargetParasite('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.tagChipClose}
                >
                  <FormCloseIcon size={12} color={P.twGray700} />
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.formDropdownPlaceholder}>
                {t('farmer.livestock.detail.healthForm.selectParasite')}
              </Text>
            )}
          </View>
          <FormChevronDownIcon size={18} color={P.twGray500} />
        </TouchableOpacity>
        {isDewormTargetDropdownOpen && (
          <View style={styles.formDropdownMenu}>
            {optionValues(TARGET_PARASITE_OPTIONS).map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.formDropdownItem,
                  targetParasite === p && styles.formDropdownItemActive,
                ]}
                onPress={() => {
                  setTargetParasite(p);
                  setIsDewormTargetDropdownOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.formDropdownItemText,
                    targetParasite === p && styles.formDropdownItemTextActive,
                  ]}
                >
                  {optionLabel(TARGET_PARASITE_OPTIONS, p)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Dose + Administration route (side-by-side) */}
      <View style={styles.formRowHalf}>
        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.dose')}</Text>
          <View style={styles.doseRow}>
            <View style={[styles.doseValueContainer, styles.flexRatio12]}>
              <TextInput
                style={styles.formTextInput}
                value={dewormDose}
                onChangeText={setDewormDose}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={P.twGray400}
                maxLength={INPUT_MAX_LENGTH.decimal}
              />
            </View>
            <TouchableOpacity
              style={[styles.doseUnitContainer, styles.flexRatio10]}
              onPress={() => setIsDewormDoseUnitDropdownOpen(!isDewormDoseUnitDropdownOpen)}
              activeOpacity={0.8}
            >
              <Text style={styles.formDropdownSelectedText}>
                {optionLabel(VACCINE_DOSE_UNIT_OPTIONS, dewormDoseUnit)}
              </Text>
              <FormChevronDownIcon size={16} color={P.twGray500} />
            </TouchableOpacity>
          </View>
          {isDewormDoseUnitDropdownOpen && (
            <View style={styles.formDropdownMenu}>
              {optionValues(VACCINE_DOSE_UNIT_OPTIONS).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[
                    styles.formDropdownItem,
                    dewormDoseUnit === u && styles.formDropdownItemActive,
                  ]}
                  onPress={() => {
                    setDewormDoseUnit(u);
                    setIsDewormDoseUnitDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.formDropdownItemText,
                      dewormDoseUnit === u && styles.formDropdownItemTextActive,
                    ]}
                  >
                    {optionLabel(VACCINE_DOSE_UNIT_OPTIONS, u)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>
            {t('farmer.livestock.detail.healthForm.administrationRoute')}
          </Text>
          <TouchableOpacity
            style={styles.formDropdownTrigger}
            onPress={() => setIsDewormAdminRouteDropdownOpen(!isDewormAdminRouteDropdownOpen)}
            activeOpacity={0.8}
          >
            <Text style={styles.formDropdownSelectedText}>
              {optionLabel(DEWORMING_ROUTE_OPTIONS, dewormAdminRoute)}
            </Text>
            <FormChevronDownIcon size={16} color={P.twGray500} />
          </TouchableOpacity>
          {isDewormAdminRouteDropdownOpen && (
            <View style={styles.formDropdownMenu}>
              {optionValues(DEWORMING_ROUTE_OPTIONS).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.formDropdownItem,
                    dewormAdminRoute === r && styles.formDropdownItemActive,
                  ]}
                  onPress={() => {
                    setDewormAdminRoute(r);
                    setIsDewormAdminRouteDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.formDropdownItemText,
                      dewormAdminRoute === r && styles.formDropdownItemTextActive,
                    ]}
                  >
                    {optionLabel(DEWORMING_ROUTE_OPTIONS, r)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Animal weight + Batch / Lot number (side-by-side) */}
      <View style={styles.formRowHalf}>
        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.animalWeight')}</Text>
          <View style={styles.doseRow}>
            <View style={[styles.doseValueContainer, styles.flexRatio12]}>
              <TextInput
                style={styles.formTextInput}
                value={dewormAnimalWeight}
                onChangeText={setDewormAnimalWeight}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={P.twGray400}
                maxLength={INPUT_MAX_LENGTH.decimal}
              />
            </View>
            <TouchableOpacity
              style={[styles.doseUnitContainer, styles.flexRatio10]}
              onPress={() => setIsDewormWeightUnitDropdownOpen(!isDewormWeightUnitDropdownOpen)}
              activeOpacity={0.8}
            >
              <Text style={styles.formDropdownSelectedText}>
                {optionLabel(WEIGHT_UNIT_OPTIONS, dewormWeightUnit)}
              </Text>
              <FormChevronDownIcon size={16} color={P.twGray500} />
            </TouchableOpacity>
          </View>
          {isDewormWeightUnitDropdownOpen && (
            <View style={styles.formDropdownMenu}>
              {optionValues(WEIGHT_UNIT_OPTIONS).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[
                    styles.formDropdownItem,
                    dewormWeightUnit === u && styles.formDropdownItemActive,
                  ]}
                  onPress={() => {
                    setDewormWeightUnit(u);
                    setIsDewormWeightUnitDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.formDropdownItemText,
                      dewormWeightUnit === u && styles.formDropdownItemTextActive,
                    ]}
                  >
                    {optionLabel(WEIGHT_UNIT_OPTIONS, u)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.batchNumber')}</Text>
          <TextInput
            style={styles.formTextInput}
            value={dewormBatchNumber}
            onChangeText={setDewormBatchNumber}
            placeholder=""
            placeholderTextColor={P.twGray400}
            maxLength={INPUT_MAX_LENGTH.batch}
          />
        </View>
      </View>

      {/* Expiry date + Administered by (side-by-side) */}
      <View style={styles.formRowHalf}>
        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.expiryDate')}</Text>
          <View style={styles.formInputContainer}>
            <FormCalendarIcon size={18} color={P.twGray500} />
            <TextInput
              style={styles.formInputWithIcon}
              value={dewormExpiryDate}
              onChangeText={setDewormExpiryDate}
              placeholder={t('farmer.livestock.detail.common.datePlaceholder')}
              placeholderTextColor={P.twGray400}
              maxLength={INPUT_MAX_LENGTH.date}
            />
          </View>
        </View>

        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.administeredBy')}</Text>
          <TextInput
            style={styles.formTextInput}
            value={dewormAdministeredBy}
            onChangeText={setDewormAdministeredBy}
            placeholder=""
            placeholderTextColor={P.twGray400}
            maxLength={INPUT_MAX_LENGTH.short}
          />
        </View>
      </View>

      {/* Next due date + Observed reaction (side-by-side) */}
      <View style={styles.formRowHalf}>
        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.nextDueDate')}</Text>
          <View style={styles.formInputContainer}>
            <FormCalendarIcon size={18} color={P.twGray500} />
            <TextInput
              style={styles.formInputWithIcon}
              value={dewormNextDueDate}
              onChangeText={setDewormNextDueDate}
              placeholder={t('farmer.livestock.detail.common.datePlaceholder')}
              placeholderTextColor={P.twGray400}
              maxLength={INPUT_MAX_LENGTH.date}
            />
          </View>
        </View>

        <View style={[styles.formGroup, styles.flexRatio10]}>
          <Text style={styles.formLabel}>
            {t('farmer.livestock.detail.healthForm.observedReaction')}
          </Text>
          <TouchableOpacity
            style={styles.formDropdownTrigger}
            onPress={() => setIsDewormReactionDropdownOpen(!isDewormReactionDropdownOpen)}
            activeOpacity={0.8}
          >
            <Text
              style={
                dewormObservedReaction
                  ? styles.formDropdownSelectedText
                  : styles.formDropdownPlaceholder
              }
            >
              {optionLabel(OBSERVED_REACTION_OPTIONS, dewormObservedReaction) ||
                t('farmer.livestock.detail.healthForm.selectReaction')}
            </Text>
            <FormChevronDownIcon size={16} color={P.twGray500} />
          </TouchableOpacity>
          {isDewormReactionDropdownOpen && (
            <View style={styles.formDropdownMenu}>
              {optionValues(OBSERVED_REACTION_OPTIONS).map((react) => (
                <TouchableOpacity
                  key={react}
                  style={[
                    styles.formDropdownItem,
                    dewormObservedReaction === react && styles.formDropdownItemActive,
                  ]}
                  onPress={() => {
                    setDewormObservedReaction(react);
                    setIsDewormReactionDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.formDropdownItemText,
                      dewormObservedReaction === react && styles.formDropdownItemTextActive,
                    ]}
                  >
                    {optionLabel(OBSERVED_REACTION_OPTIONS, react)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Notes */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>{t('farmer.livestock.detail.field.notes')}</Text>
        <TextInput
          style={styles.formNotesInput}
          value={dewormNotes}
          onChangeText={setDewormNotes}
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
