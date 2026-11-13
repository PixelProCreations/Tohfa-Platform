import React, { useMemo } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Icon, DatePicker } from '@tohfa/mobile-ui';
import { t } from '../../../../../i18n/farmer';
import { s1 } from './i18n';
import { FieldError, RequiredLabel, type SectionProps } from './parts';

import { FULL_NAME_MAX } from './validate';

/** "DD / MM / YYYY" is 14 characters; "DD/MM/YYYY" is 10. */
const DOB_MAX_LENGTH = 14;
const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

export const PersonalSection: React.FC<SectionProps> = ({ form, styles, colors }) => {
  const { state, set, setField } = form;
  const errors = state.fieldErrors;
  const todayDate = useMemo(() => new Date(), []);

  // `value` is what is persisted (English); `label` is what the farmer sees.
  const genderOptions = [
    { value: 'Male', label: t('farmer.registration.step1.genderMale') },
    { value: 'Female', label: t('farmer.registration.step1.genderFemale') },
    { value: 'Other', label: t('farmer.registration.step1.genderOther') },
  ];
  const selectedGenderLabel =
    genderOptions.find((o) => o.value === state.gender)?.label ?? state.gender;

  return (
    <>
      {/* Full Name */}
      <View style={styles.fieldGroup}>
        <RequiredLabel styles={styles} text={t('farmer.registration.step1.fullNameLabel')} />
        <TextInput
          style={[styles.input, errors.fullName ? styles.inputError : null]}
          value={state.fullName}
          onChangeText={(text) => setField({ fullName: text }, 'fullName')}
          placeholder={t('farmer.registration.step1.fullNamePlaceholder')}
          placeholderTextColor={colors.placeholder}
          maxLength={FULL_NAME_MAX}
          autoCapitalize="words"
        />
        <FieldError styles={styles} message={errors.fullName} />
      </View>

      {/* DOB & Gender Side-by-Side */}
      <View style={styles.rowGrid}>
        <View style={styles.gridCol}>
          <RequiredLabel styles={styles} text={t('farmer.registration.step1.dobLabel')} />
          <View style={[styles.dobBox, errors.dob ? styles.inputError : null]}>
            <TextInput
              style={styles.dobInput}
              value={state.dob}
              onChangeText={(text) => setField({ dob: text }, 'dob')}
              placeholder={t('farmer.registration.step1.dobPlaceholder')}
              placeholderTextColor={colors.placeholder}
              keyboardType="numbers-and-punctuation"
              maxLength={DOB_MAX_LENGTH}
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => set({ showDatePicker: true })}
              hitSlop={HIT_SLOP}
              accessibilityRole="button"
              accessibilityLabel={s1('openCalendar')}
            >
              <Icon name="calendar_today" size={20} color={colors.subtle} />
            </TouchableOpacity>
          </View>
          <FieldError styles={styles} message={errors.dob} />

          <DatePicker
            visible={state.showDatePicker}
            onClose={() => set({ showDatePicker: false })}
            value={state.dob}
            title={s1('selectDobTitle')}
            maxDate={todayDate}
            format="DD / MM / YYYY"
            onSelect={(_date, formattedDate) => setField({ dob: formattedDate }, 'dob')}
          />
        </View>

        <View style={styles.gridCol}>
          <RequiredLabel styles={styles} text={t('farmer.registration.step1.genderLabel')} />
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.dropdownSelect, errors.gender ? styles.inputError : null]}
            onPress={() => set({ showGenderMenu: !state.showGenderMenu })}
          >
            <Text style={styles.dropdownText}>{selectedGenderLabel}</Text>
            <Text style={styles.dropdownArrow}>▾</Text>
          </TouchableOpacity>
          <FieldError styles={styles} message={errors.gender} />

          {state.showGenderMenu ? (
            <View style={styles.dropdownMenu}>
              {genderOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setField({ gender: opt.value, showGenderMenu: false }, 'gender');
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      opt.value === state.gender && styles.dropdownOptionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </>
  );
};
