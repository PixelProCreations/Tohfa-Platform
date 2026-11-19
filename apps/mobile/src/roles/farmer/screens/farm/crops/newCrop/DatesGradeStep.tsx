import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authPalette as P } from '../../../../theme';
import { DEFAULT_MATURITY_DAYS, UI_GRADES } from './constants';
import { CalendarIcon, ChevronDownIcon, SparkleIcon, ZoneFieldIcon } from './icons';
import { nt } from './i18n';
import { ICON_SIZE, styles } from './styles';
import type { DateField, NewCropFormApi } from './useNewCropForm';
import type { FieldValidation } from '../../../../utils/validation';
import { FieldErrorText } from '../../FieldErrorText';
import type { NewCropField } from './validation';

const GRADE_LABEL_KEY = {
  'Grade A': 'grade.a',
  'Grade B': 'grade.b',
  'Grade C': 'grade.c',
} as const;

interface DateBoxProps {
  form: NewCropFormApi;
  field: DateField;
  value: string;
  a11yKey: string;
}

function DateBox({ form, field, value, a11yKey }: DateBoxProps): React.JSX.Element {
  const active = form.state.activeDateField === field;
  return (
    <TouchableOpacity
      style={[styles.dateBox, active && styles.dateBoxActive]}
      activeOpacity={0.75}
      onPress={() => form.openCalendar(field)}
      accessibilityRole="button"
      accessibilityLabel={nt(a11yKey)}
    >
      <Text style={[styles.dateBoxText, active && styles.dateBoxTextActive]}>{value}</Text>
      <CalendarIcon size={ICON_SIZE.calendar} color={active ? P.twGreen700 : P.twGray400} />
    </TouchableOpacity>
  );
}

/** Step 2: Dates & Grade. */
export function DatesGradeStep({
  form,
  validation,
}: {
  form: NewCropFormApi;
  validation: FieldValidation<NewCropField>;
}): React.JSX.Element {
  const { state, set } = form;
  return (
    <>
      {/* Field: Zone * */}
      <View style={styles.formGroup}>
        <View style={styles.fieldLabelRow}>
          <ZoneFieldIcon size={ICON_SIZE.label} color={P.twGreen700} />
          <Text style={styles.fieldLabel}>
            {nt('dates.zone')} <Text style={styles.requiredStar}>*</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.selectorInput, styles.selectorInputActive]}
          onPress={() => set({ showZonePicker: true })}
          activeOpacity={0.8}
        >
          <Text style={styles.selectorInputText}>{state.selectedZone}</Text>
          <ChevronDownIcon size={ICON_SIZE.chevron} color={P.twGreen700} />
        </TouchableOpacity>
      </View>

      {/* Field: Area (acres) — informational only, not sent when saving:
          CreateFarmCropBody has no area field; the plot itself owns area. */}
      <View style={styles.formGroup}>
        <Text style={styles.colLabel}>{nt('dates.area')}</Text>
        <View style={styles.areaBox}>
          <TextInput
            style={styles.areaTextInput}
            value={state.areaAcres}
            onChangeText={(v) => set({ areaAcres: v })}
            onBlur={() => validation.onBlur('areaAcres')}
            maxLength={16}
            keyboardType="decimal-pad"
            placeholder={nt('dates.areaPlaceholder')}
            placeholderTextColor={P.twGray400}
          />
          <View style={styles.fromZonePill}>
            <Text style={styles.fromZonePillText}>{nt('dates.fromZone')}</Text>
          </View>
        </View>
        <FieldErrorText message={validation.messageFor('areaAcres')} />
        <Text style={styles.helpText}>{nt('dates.areaHelp')}</Text>
      </View>

      {/* Field: Plantation date & Expected harvest */}
      <View style={styles.formGroup}>
        <View style={styles.twoColRow}>
          <View style={styles.halfCol}>
            <Text style={styles.colLabel}>
              {nt('dates.plantationDate')} <Text style={styles.requiredStar}>*</Text>
            </Text>
            <DateBox
              form={form}
              field="plantation"
              value={state.plantationDate}
              a11yKey="dates.selectPlantationDateA11y"
            />
          </View>

          <View style={styles.halfCol}>
            <Text style={styles.colLabel}>{nt('dates.expectedHarvest')}</Text>
            <DateBox
              form={form}
              field="harvest"
              value={state.expectedHarvestDate}
              a11yKey="dates.selectHarvestDateA11y"
            />
          </View>
        </View>

        {/* Auto-suggested note */}
        <View style={styles.suggestionRow}>
          <SparkleIcon size={ICON_SIZE.suggestion} color={P.twGreen700} />
          <Text style={styles.suggestionText}>
            {nt('dates.autoSuggested', { days: DEFAULT_MATURITY_DAYS, crop: state.cropName })}
          </Text>
        </View>
      </View>

      {/* Field: Expected total quantity (kg) */}
      <View style={styles.formGroup}>
        <Text style={styles.colLabel}>{nt('dates.expectedQty')}</Text>
        <TextInput
          style={styles.textInput}
          value={state.expectedQtyKg}
          onChangeText={(v) => set({ expectedQtyKg: v })}
          onBlur={() => validation.onBlur('expectedQtyKg')}
          maxLength={16}
          keyboardType="decimal-pad"
          placeholder={nt('dates.expectedQtyPlaceholder')}
          placeholderTextColor={P.twGray400}
        />
        <FieldErrorText message={validation.messageFor('expectedQtyKg') ?? state.fieldErrors.expectedQtyKg} />
      </View>

      {/* Field: Expected grade */}
      <View style={styles.formGroup}>
        <Text style={styles.colLabel}>{nt('dates.expectedGrade')}</Text>
        <View style={styles.gradeButtonsRow}>
          {UI_GRADES.map((grade) => (
            <TouchableOpacity
              key={grade}
              style={[styles.gradeButton, state.expectedGrade === grade && styles.gradeButtonActive]}
              onPress={() => set({ expectedGrade: grade })}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.gradeButtonText,
                  state.expectedGrade === grade && styles.gradeButtonTextActive,
                ]}
              >
                {nt(GRADE_LABEL_KEY[grade])}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </>
  );
}
