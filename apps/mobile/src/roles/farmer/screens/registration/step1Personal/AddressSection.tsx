import React, { useEffect } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { t } from '../../../../../i18n/farmer';
import { s1 } from './i18n';
import { FieldError, OptionPickerModal, RequiredLabel, type SectionProps } from './parts';
import { ADDRESS_MAX, PLACE_NAME_MAX } from './validate';
import { fetchPublicZones, type PublicZoneItem } from '../../../api/registration';

/** The full Aadhaar number: 12 digits plus up to two cosmetic spaces. Never stored (BR-33b). */
const AADHAAR_INPUT_MAX_LENGTH = 14;

// Proper nouns persisted as-is in the draft; deliberately not translated.
const DISTRICT_OPTIONS = [
  'The Nilgiris', 'Coimbatore', 'Erode', 'Tiruppur', 'Salem',
  'Madurai', 'Thanjavur', 'Tiruchirappalli', 'Chennai', 'Dharmapuri',
];

export function formatZoneCollectionPoint(zone: { name: string; warehouseTown: string }): string {
  const warehouseName = zone.name.includes('Warehouse')
    ? zone.name
    : zone.name.replace(/\s*Zone$/i, ' Warehouse');
  return `${warehouseName} — ${zone.warehouseTown}`;
}

export function suggestZoneIdByTaluk(
  taluk: string,
  zones: Array<{ id: string; name: string; warehouseTown: string }>,
): string | null {
  const clean = taluk.trim().toLowerCase();
  if (!clean || zones.length === 0) return null;

  for (const z of zones) {
    if (z.warehouseTown.toLowerCase() === clean || z.name.toLowerCase().includes(clean)) {
      return z.id;
    }
  }

  if (
    clean.includes('ooty') ||
    clean.includes('udhaga') ||
    clean.includes('ootacamund') ||
    clean.includes('kundah')
  ) {
    const ooty = zones.find(
      (z) => z.warehouseTown.toLowerCase() === 'udhagamandalam' || z.name.toLowerCase().includes('ooty'),
    );
    if (ooty) return ooty.id;
  }
  if (clean.includes('coon') || clean.includes('kunu')) {
    const coon = zones.find(
      (z) => z.warehouseTown.toLowerCase() === 'coonoor' || z.name.toLowerCase().includes('coon'),
    );
    if (coon) return coon.id;
  }
  if (clean.includes('kota') || clean.includes('kotha')) {
    const kota = zones.find(
      (z) => z.warehouseTown.toLowerCase() === 'kotagiri' || z.name.toLowerCase().includes('kota'),
    );
    if (kota) return kota.id;
  }
  if (clean.includes('guda') || clean.includes('kuda') || clean.includes('pandalur') || clean.includes('pandaloor')) {
    const guda = zones.find(
      (z) => z.warehouseTown.toLowerCase() === 'gudalur' || z.name.toLowerCase().includes('guda'),
    );
    if (guda) return guda.id;
  }

  return null;
}

const DISTRICT_PICKER_OPTIONS = DISTRICT_OPTIONS.map((d) => ({ value: d, label: d }));

export const AddressSection: React.FC<SectionProps> = ({ form, styles, colors }) => {
  const { state, set, setField } = form;
  const errors = state.fieldErrors;

  useEffect(() => {
    let active = true;
    fetchPublicZones()
      .then((zones) => {
        if (!active || !Array.isArray(zones)) return;
        set({ availableZones: zones });
        if (!state.zoneId && state.taluk) {
          const suggested = suggestZoneIdByTaluk(state.taluk, zones);
          if (suggested) {
            set({ zoneId: suggested });
          }
        }
      })
      .catch(() => {
        // Failing to fetch zones must not block submission (Brief 05)
      });
    return () => {
      active = false;
    };
  }, []);

  const handleTalukChange = (text: string) => {
    const patch: Partial<typeof state> = { taluk: text };
    if (!state.zoneUserOverridden && state.availableZones.length > 0) {
      const suggested = suggestZoneIdByTaluk(text, state.availableZones);
      if (suggested) {
        patch.zoneId = suggested;
      }
    }
    setField(patch, 'taluk');
  };

  const selectedZone = state.availableZones.find((z) => z.id === state.zoneId);
  const zonePickerOptions = state.availableZones.map((z) => ({
    value: z.id,
    label: formatZoneCollectionPoint(z),
  }));

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
            onChangeText={handleTalukChange}
            maxLength={PLACE_NAME_MAX}
            placeholder={s1('talukPlaceholder')}
            placeholderTextColor={colors.placeholder}
          />
          <FieldError styles={styles} message={errors.taluk} />
        </View>
      </View>

      {/* Zone Picker (Collection Point) */}
      {state.availableZones.length > 0 ? (
        <View style={styles.fieldGroup}>
          <RequiredLabel styles={styles} text={s1('zoneLabel')} />
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.dropdownSelect, errors.zoneId ? styles.inputError : null]}
            onPress={() => set({ showZoneMenu: !state.showZoneMenu, showDistrictMenu: false })}
          >
            <Text style={styles.dropdownText} numberOfLines={1}>
              {selectedZone ? formatZoneCollectionPoint(selectedZone) : s1('zonePlaceholder')}
            </Text>
            <Text style={styles.dropdownArrow}>▾</Text>
          </TouchableOpacity>
          <Text style={styles.helperText}>{s1('zoneHelper')}</Text>
          {errors.zoneId ? <FieldError styles={styles} message={errors.zoneId} /> : null}

          <OptionPickerModal
            styles={styles}
            visible={state.showZoneMenu}
            title={s1('zoneLabel')}
            options={zonePickerOptions}
            selected={state.zoneId}
            onSelect={(value) =>
              setField({ zoneId: value, zoneUserOverridden: true, showZoneMenu: false }, 'zoneId')
            }
            onClose={() => set({ showZoneMenu: false })}
          />
        </View>
      ) : null}

      {/* District / Pincode row */}
      <View style={styles.rowGrid}>
        <View style={styles.gridCol}>
          <RequiredLabel styles={styles} text={s1('districtLabel')} />
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.dropdownSelect, errors.district ? styles.inputError : null]}
            onPress={() => set({ showDistrictMenu: !state.showDistrictMenu, showZoneMenu: false })}
          >
            <Text style={styles.dropdownText} numberOfLines={1}>
              {state.district}
            </Text>
            <Text style={styles.dropdownArrow}>▾</Text>
          </TouchableOpacity>
          <FieldError styles={styles} message={errors.district} />

          <OptionPickerModal
            styles={styles}
            visible={state.showDistrictMenu}
            title={s1('districtLabel')}
            options={DISTRICT_PICKER_OPTIONS}
            selected={state.district}
            onSelect={(value) => setField({ district: value, showDistrictMenu: false }, 'district')}
            onClose={() => set({ showDistrictMenu: false })}
          />
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
            onFocus={() => set({ showDistrictMenu: false, showZoneMenu: false })}
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
