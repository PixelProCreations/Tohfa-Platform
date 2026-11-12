import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authPalette as P } from '../../../../theme';
import { t } from '../../../../../../i18n/farmer';
import { af } from './i18n';
import { CalendarIcon, ChevronDownIcon } from './icons';
import { computeAgeLabel, genderLabel, organicStatusLabel, speciesLabel } from './model';
import { styles } from './styles';
import type { AnimalForm } from './useAnimalForm';
import type { FormSource } from './model';
import { ANIMAL_BREED_MAX, ANIMAL_SOURCE_FARM_MAX, ANIMAL_TAG_MAX } from './validation';

export interface AnimalFormFieldsProps {
  form: AnimalForm;
  tagPlaceholder: string;
  onPressDob: () => void;
  onPressPurchaseDate: () => void;
  /** The screen-specific note under the organic-status picker. */
  statusExplainer: React.ReactNode;
}

/** Shown in a date box that has no value yet (only reachable on the edit screen). */
const EMPTY_VALUE = '—';

/**
 * The register / edit animal form body: tag, species, gender, breed, date of
 * birth, source (+ purchase details), organic status and the submit error.
 * Field values are form identifiers (model.ts); the pickers show their
 * translated labels.
 */
export function AnimalFormFields({
  form,
  tagPlaceholder,
  onPressDob,
  onPressPurchaseDate,
  statusExplainer,
}: AnimalFormFieldsProps): React.JSX.Element {
  const { state, setField, patch } = form;

  return (
    <View style={styles.formContainer}>
      {/* Animal ID / tag */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>
          {af('field.tag')} <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <TextInput
          style={styles.textInput}
          value={state.tag}
          onChangeText={(v) => setField('tag', v)}
          placeholder={tagPlaceholder}
          placeholderTextColor={P.twGray400}
          autoCapitalize="characters"
          maxLength={ANIMAL_TAG_MAX}
        />
        {state.fieldErrors['tag'] ? <Text style={styles.fieldErrorText}>{state.fieldErrors['tag']}</Text> : null}
      </View>

      {/* Species & Gender (2 columns) */}
      <View style={styles.twoColumnRow}>
        <View style={styles.columnField}>
          <Text style={styles.fieldLabel}>
            {af('field.species')} <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <PickerBox value={speciesLabel(state.species)} onPress={() => patch({ openPicker: 'species' })} />
        </View>

        <View style={styles.columnField}>
          <Text style={styles.fieldLabel}>{t('farmer.registration.step1.genderLabel')}</Text>
          <PickerBox value={genderLabel(state.gender)} onPress={() => patch({ openPicker: 'gender' })} />
        </View>
      </View>

      {/* Breed */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{af('field.breed')}</Text>
        <TextInput
          style={styles.textInput}
          value={state.breed}
          onChangeText={(v) => setField('breed', v)}
          placeholder={af('field.breedPlaceholder')}
          placeholderTextColor={P.twGray400}
          maxLength={ANIMAL_BREED_MAX}
        />
        {state.fieldErrors['breed'] ? <Text style={styles.fieldErrorText}>{state.fieldErrors['breed']}</Text> : null}
      </View>

      {/* Date of Birth */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{af('field.dob')}</Text>
        <DateBox value={state.dob} onPress={onPressDob} />
        {state.dob ? <Text style={styles.ageHelperText}>{computeAgeLabel(state.dob)}</Text> : null}
      </View>

      {/* Source */}
      <Text style={styles.sectionHeaderTitle}>{af('section.source')}</Text>
      <View style={styles.sourceSegmentContainer}>
        <SourceSegment
          value="born_on_farm"
          label={af('source.bornOnFarm')}
          active={state.source === 'born_on_farm'}
          onPress={(v) => setField('source', v)}
        />
        <SourceSegment
          value="purchased"
          label={af('source.purchased')}
          active={state.source === 'purchased'}
          onPress={(v) => setField('source', v)}
        />
      </View>

      {/* Purchase details, only for purchased animals */}
      {state.source === 'purchased' && (
        <View style={styles.twoColumnRow}>
          <View style={styles.columnField}>
            <Text style={styles.fieldLabel}>{af('field.purchaseDate')}</Text>
            <DateBox value={state.purchaseDate} onPress={onPressPurchaseDate} />
          </View>

          <View style={styles.columnField}>
            <Text style={styles.fieldLabel}>{af('field.sourceFarm')}</Text>
            <TextInput
              style={styles.textInput}
              value={state.sourceFarm}
              onChangeText={(v) => setField('sourceFarm', v)}
              placeholder={af('field.sourceFarmPlaceholder')}
              placeholderTextColor={P.twGray400}
              maxLength={ANIMAL_SOURCE_FARM_MAX}
            />
            {state.fieldErrors['sourceFarm'] ? (
              <Text style={styles.fieldErrorText}>{state.fieldErrors['sourceFarm']}</Text>
            ) : null}
          </View>
        </View>
      )}

      {/* Organic Status */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>
          {af('field.organicStatus')} <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <PickerBox value={organicStatusLabel(state.organicStatus)} onPress={() => patch({ openPicker: 'status' })} />
        <Text style={styles.statusExplainerText}>{statusExplainer}</Text>
      </View>

      {state.submitError ? (
        <View style={styles.errorBanner} accessibilityLiveRegion="polite">
          <Text style={styles.errorBannerText}>{state.submitError}</Text>
        </View>
      ) : null}
    </View>
  );
}

function PickerBox({ value, onPress }: { value: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.pickerInputBox} activeOpacity={0.8} onPress={onPress}>
      <Text style={styles.pickerValueText}>{value}</Text>
      <ChevronDownIcon size={16} color={P.twGray500} />
    </TouchableOpacity>
  );
}

/** Dates are shown in the form's own "02 Jun 2026" data format. */
function DateBox({ value, onPress }: { value: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.pickerInputBox} activeOpacity={0.8} onPress={onPress}>
      <Text style={styles.pickerValueText}>{value || EMPTY_VALUE}</Text>
      <CalendarIcon size={18} color={P.twGray400} />
    </TouchableOpacity>
  );
}

function SourceSegment({
  value,
  label,
  active,
  onPress,
}: {
  value: FormSource;
  label: string;
  active: boolean;
  onPress: (value: FormSource) => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.sourceSegmentBtn, active && styles.sourceSegmentBtnActive]}
      onPress={() => onPress(value)}
      activeOpacity={0.8}
    >
      <Text style={[styles.sourceSegmentText, active && styles.sourceSegmentTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}
