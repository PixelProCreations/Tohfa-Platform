import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { t } from '../../../../../i18n/farmer';
import { s1 } from './i18n';
import { FieldError, RequiredLabel, type SectionProps } from './parts';
import { ADDRESS_MAX, PLACE_NAME_MAX } from './validate';

/** The full Aadhaar number: 12 digits plus up to two cosmetic spaces. Never stored (BR-33b). */
const AADHAAR_INPUT_MAX_LENGTH = 14;

// Proper nouns persisted as-is in the draft; deliberately not translated.
const DISTRICT_OPTIONS = [
  'The Nilgiris', 'Coimbatore', 'Erode', 'Tiruppur', 'Salem',
  'Madurai', 'Thanjavur', 'Tiruchirappalli', 'Chennai', 'Dharmapuri',
];

export const AddressSection: React.FC<SectionProps> = ({ form, styles, colors }) => {
  const { state, set, setField } = form;
  const errors = state.fieldErrors;

  return (
    <>
      {/* Aadhaar / ID Number */}
      <View style={styles.fieldGroup}>
        <RequiredLabel styles={styles} text={t('farmer.registration.step1.aadhaarLabel')} />
        <TextInput
          style={[
            styles.input,
            styles.aadhaarInput,
            errors.aadhaarNumber ? styles.inputError : null,
          ]}
          value={state.aadhaarNumber}
          onChangeText={(text) => setField({ aadhaarNumber: text }, 'aadhaarNumber')}
          keyboardType="number-pad"
          maxLength={AADHAAR_INPUT_MAX_LENGTH}
          placeholder={t('farmer.registration.step1.aadhaarPlaceholder')}
          placeholderTextColor={colors.placeholder}
        />
        {errors.aadhaarNumber ? (
          <FieldError styles={styles} message={errors.aadhaarNumber} />
        ) : (
          <Text style={styles.helperText}>{s1('aadhaarHelper')}</Text>
        )}
      </View>

      {/* Address Line */}
      <View style={[styles.fieldGroup, styles.addressGroup]}>
        <RequiredLabel styles={styles} text={s1('addressLabel')} />
        <TextInput
          style={[
            styles.input,
            styles.textareaInput,
            errors.addressLine1 ? styles.inputError : null,
          ]}
          value={state.addressLine1}
          onChangeText={(text) => setField({ addressLine1: text }, 'addressLine1')}
          multiline
          maxLength={ADDRESS_MAX}
          numberOfLines={2}
          textAlignVertical="top"
          placeholder={s1('addressPlaceholder')}
          placeholderTextColor={colors.placeholder}
        />
        <FieldError styles={styles} message={errors.addressLine1} />
      </View>

      {/* Village / Taluk row */}
      <View style={styles.rowGrid}>
        <View style={styles.gridCol}>
          <RequiredLabel styles={styles} text={s1('villageLabel')} />
          <TextInput
            style={[styles.input, errors.village ? styles.inputError : null]}
            value={state.village}
            onChangeText={(text) => setField({ village: text }, 'village')}
            maxLength={PLACE_NAME_MAX}
            placeholder={s1('villagePlaceholder')}
            placeholderTextColor={colors.placeholder}
          />
          <FieldError styles={styles} message={errors.village} />
        </View>
        <View style={styles.gridCol}>
          <RequiredLabel styles={styles} text={s1('talukLabel')} />
          <TextInput
            style={[styles.input, errors.taluk ? styles.inputError : null]}
            value={state.taluk}
            onChangeText={(text) => setField({ taluk: text }, 'taluk')}
            maxLength={PLACE_NAME_MAX}
            placeholder={s1('talukPlaceholder')}
            placeholderTextColor={colors.placeholder}
          />
          <FieldError styles={styles} message={errors.taluk} />
        </View>
      </View>

      {/* District / Pincode row */}
      <View style={styles.rowGrid}>
        <View style={styles.gridCol}>
          <RequiredLabel styles={styles} text={s1('districtLabel')} />
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.dropdownSelect, errors.district ? styles.inputError : null]}
            onPress={() => set({ showDistrictMenu: !state.showDistrictMenu })}
          >
            <Text style={styles.dropdownText} numberOfLines={1}>
              {state.district}
            </Text>
            <Text style={styles.dropdownArrow}>▾</Text>
          </TouchableOpacity>
          <FieldError styles={styles} message={errors.district} />

          {state.showDistrictMenu ? (
            <View style={styles.dropdownMenu}>
              <ScrollView style={styles.districtList} keyboardShouldPersistTaps="handled">
                {DISTRICT_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={styles.dropdownOption}
                    onPress={() => setField({ district: opt, showDistrictMenu: false }, 'district')}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        opt === state.district && styles.dropdownOptionTextSelected,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>
        <View style={styles.gridCol}>
          <RequiredLabel styles={styles} text={s1('pincodeLabel')} />
          <TextInput
            style={[styles.input, errors.pincode ? styles.inputError : null]}
            value={state.pincode}
            onChangeText={(text) =>
              setField({ pincode: text.replace(/[^0-9]/g, '').slice(0, 6) }, 'pincode')
            }
            // Pincode sits directly beside the District dropdown in the same row.
            // If a farmer opened District and then tapped here without picking an
            // option, the dropdown would stay open while the keyboard comes up and
            // cover it -- the keyboard is a native overlay no JS zIndex can sit
            // above. Closing it the moment this field gains focus removes the
            // overlap instead of trying to out-stack the keyboard.
            onFocus={() => set({ showDistrictMenu: false })}
            keyboardType="number-pad"
            maxLength={6}
            placeholder={s1('pincodePlaceholder')}
            placeholderTextColor={colors.placeholder}
          />
          <FieldError styles={styles} message={errors.pincode} />
        </View>
      </View>
    </>
  );
};
