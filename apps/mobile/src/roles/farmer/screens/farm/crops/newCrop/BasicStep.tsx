import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authPalette as P, colors } from '../../../../theme';
import { ChevronDownIcon, InfoTriangleIcon, SproutIcon, ZoneFieldIcon } from './icons';
import { nt } from './i18n';
import { ICON_SIZE, styles } from './styles';
import type { NewCropFormApi } from './useNewCropForm';
import type { FieldValidation } from '../../../../utils/validation';
import { FieldErrorText } from '../../FieldErrorText';
import type { NewCropField } from './validation';

/** Step 1: Basic. */
export function BasicStep({
  form,
  validation,
}: {
  form: NewCropFormApi;
  validation: FieldValidation<NewCropField>;
}): React.JSX.Element {
  const { state, set } = form;
  return (
    <>
      {/* Step hint banner */}
      <View style={styles.hintBanner}>
        <Text style={styles.hintBannerText}>{nt('basic.hint')}</Text>
        <InfoTriangleIcon size={ICON_SIZE.hint} color={P.twGray500} />
      </View>

      {/* Field: Farm Zone * (FIRST) */}
      <View style={styles.formGroup}>
        <View style={styles.fieldLabelRow}>
          <ZoneFieldIcon size={ICON_SIZE.label} color={colors.brandGreen} />
          <Text style={styles.fieldLabel}>
            {nt('basic.farmZone')} <Text style={styles.requiredStar}>*</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.selectorInput, styles.selectorInputActive]}
          onPress={() => set({ showZonePicker: true })}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={nt('basic.selectFarmZoneA11y')}
        >
          <Text style={styles.selectorInputText}>{state.selectedZone}</Text>
          <ChevronDownIcon size={ICON_SIZE.chevron} color={colors.brandGreen} />
        </TouchableOpacity>

        <Text style={styles.helpText}>
          {nt('basic.farmZoneHelp', { area: state.areaAcres || nt('basic.areaPlaceholderDash') })}
        </Text>
      </View>

      {/* Field: Crop name * */}
      <View style={styles.formGroup}>
        <View style={styles.fieldLabelRow}>
          <SproutIcon size={ICON_SIZE.label} color={colors.brandGreen} />
          <Text style={styles.fieldLabel}>
            {nt('basic.cropName')} <Text style={styles.requiredStar}>*</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.selectorInput, styles.selectorInputActive]}
          onPress={() => set({ showCropPicker: true })}
          activeOpacity={0.8}
        >
          <Text style={styles.selectorInputText}>{state.cropName}</Text>
          <ChevronDownIcon size={ICON_SIZE.chevron} color={colors.brandGreen} />
        </TouchableOpacity>

        <Text style={styles.helpText}>{nt('basic.cropNameHelp')}</Text>
      </View>

      {/* Field: Seed variety & Seed company */}
      <View style={styles.twoColRow}>
        <View style={styles.halfCol}>
          <Text style={styles.colLabel}>{nt('basic.seedVariety')}</Text>
          <TextInput
            style={styles.textInput}
            value={state.seedVariety}
            onChangeText={(v) => set({ seedVariety: v })}
            onBlur={() => validation.onBlur('seedVariety')}
            maxLength={160}
            placeholder={nt('basic.seedVarietyPlaceholder')}
            placeholderTextColor={P.twGray400}
          />
          <FieldErrorText message={validation.messageFor('seedVariety')} />
        </View>

        <View style={styles.halfCol}>
          <Text style={styles.colLabel}>{nt('basic.seedCompany')}</Text>
          <TextInput
            style={styles.textInput}
            value={state.seedCompany}
            onChangeText={(v) => set({ seedCompany: v })}
            onBlur={() => validation.onBlur('seedCompany')}
            maxLength={160}
            placeholder={nt('basic.seedCompanyPlaceholder')}
            placeholderTextColor={P.twGray400}
          />
          <FieldErrorText message={validation.messageFor('seedCompany')} />
        </View>
      </View>

      {/* Field: Quantity used & Unit */}
      <View style={styles.formGroup}>
        <Text style={styles.colLabel}>{nt('basic.quantityUsed')}</Text>
        <View style={styles.twoColRow}>
          <View style={[styles.halfCol, styles.quantityInputCol]}>
            <TextInput
              style={styles.textInput}
              value={state.quantityUsed}
              onChangeText={(v) => set({ quantityUsed: v })}
              onBlur={() => validation.onBlur('quantityUsed')}
              maxLength={16}
              keyboardType="decimal-pad"
              placeholder={nt('basic.quantityPlaceholder')}
              placeholderTextColor={P.twGray400}
            />
          </View>

          <TouchableOpacity
            style={[styles.selectorInput, styles.unitSelector]}
            onPress={() => set({ showUnitPicker: true })}
            activeOpacity={0.8}
          >
            <Text style={styles.selectorInputText}>{nt(`unit.${state.quantityUnit}`)}</Text>
            <ChevronDownIcon size={ICON_SIZE.chevronSmall} color={P.twGray500} />
          </TouchableOpacity>
        </View>
        <FieldErrorText message={validation.messageFor('quantityUsed') ?? state.fieldErrors.quantityUsed} />
      </View>

      {/* Field: Cost (Rs.) */}
      <View style={styles.formGroup}>
        <Text style={styles.colLabel}>{nt('basic.cost')}</Text>
        <View style={styles.currencyInputWrapper}>
          <Text style={styles.currencyPrefix}>{nt('basic.currencySymbol')}</Text>
          <TextInput
            style={styles.currencyTextInput}
            value={state.costRs}
            onChangeText={(v) => set({ costRs: v })}
            onBlur={() => validation.onBlur('costRs')}
            maxLength={13}
            keyboardType="decimal-pad"
            placeholder={nt('basic.costPlaceholder')}
            placeholderTextColor={P.twGray400}
          />
        </View>
        <FieldErrorText message={validation.messageFor('costRs') ?? state.fieldErrors.costRs} />
      </View>

      <View style={styles.bottomSpacer} />
    </>
  );
}
