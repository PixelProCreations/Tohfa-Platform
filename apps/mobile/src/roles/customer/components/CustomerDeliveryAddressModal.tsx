/**
 * "Where should we deliver?" chooser + Add Address form (BR-160, Figma 46:34483).
 *
 * Save = validate -> `GET /serviceability` (pincode + map pin) -> `POST
 * /customers/me/addresses` (UI -> API mapping lives in api/addresses.ts
 * `toApiAddress`). The created `CustomerAddress` and the serviceability verdict
 * go back to the caller, which shows "Location added" or starts the unserved /
 * request-area flow (components/ServiceAreaRequestFlow.tsx).
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useQueryClient } from '@tanstack/react-query';
import {
  customerFonts,
} from '../theme';
import {
  isValidPincode,
  normalizeContactPhone,
  toApiAddress,
  useCreateAddress,
  type CustomerAddress,
  type UiAddressFields,
} from '../api/addresses';
import {
  checkServiceability,
  serviceabilityQueryKeys,
  usePickupPoints,
  type Serviceability,
  type ServiceabilityQuery,
} from '../api/serviceability';
import { mapProblem } from '../api/problem';
import { t } from '../../../i18n/customer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** UI form values (mapped to the API by `toApiAddress`). Kept under its old name for existing imports. */
export type AddressData = UiAddressFields;

export interface AddressSaveResult {
  /** `null` when the serviceability check itself failed (unknown). */
  serviceable: boolean | null;
  serviceability?: Serviceability | undefined;
}

type FormField =
  | 'pincode'
  | 'city'
  | 'state'
  | 'area'
  | 'locality'
  | 'street'
  | 'flat'
  | 'building'
  | 'landmark'
  | 'contactPhone'
  | 'nearestPickupPointId';
export type AddressFormErrors = Partial<Record<FormField, string>>;

/** API field (problem `errors[].field`, prefix-stripped) -> form field. */
const API_FIELD_TO_FORM: Record<string, FormField> = {
  line1: 'flat',
  line2: 'area',
  city: 'city',
  state: 'state',
  pincode: 'pincode',
  landmark: 'landmark',
  contactPhone: 'contactPhone',
  nearestPickupPointId: 'nearestPickupPointId',
};

export function mapAddressFieldErrors(fieldErrors: Record<string, string>): AddressFormErrors {
  const out: AddressFormErrors = {};
  for (const [k, msg] of Object.entries(fieldErrors)) {
    const key = API_FIELD_TO_FORM[k.replace(/^body\./, '')];
    if (key && !out[key]) out[key] = msg;
  }
  return out;
}

export function validateAddressForm(f: UiAddressFields): AddressFormErrors {
  const e: AddressFormErrors = {};
  if (!isValidPincode(f.pincode)) e.pincode = t('customer.serviceArea.error.pincode');
  if (!f.city.trim()) e.city = t('customer.serviceArea.error.city');
  if (!f.flat.trim()) e.flat = t('customer.address.form.error.flat');
  if ((f.contactPhone ?? '').trim() && !normalizeContactPhone(f.contactPhone)) {
    e.contactPhone = t('customer.address.form.error.phone');
  }
  return e;
}

export interface CustomerDeliveryAddressModalProps {
  visible: boolean;
  initialStep?: 'delivery' | 'addAddress';
  onClose: () => void;
  /** Called with the address the API created and whether its area is served. */
  onSaveAddress: (address: CustomerAddress, result: AddressSaveResult) => void;
  onUseCurrentLocation?: () => void;
  onSelectManualLocation?: () => void;
  /** Prefill (e.g. from the map screen). */
  initialValues?: Partial<UiAddressFields> | undefined;
  /** Map pin; sent as lat/lng and used to rank nearby markets. */
  coords?: { lat: number; lng: number } | null | undefined;
}

const NearestMarketPicker: React.FC<{
  lat?: number | undefined;
  lng?: number | undefined;
  value: string | null;
  onChange: (id: string | null) => void;
  error?: string | undefined;
}> = ({ lat, lng, value, onChange, error }) => {
  const points = usePickupPoints(lat, lng);
  const items = (points.data ?? []).slice(0, 5);
  return (
    <View testID="nearest-market-picker">
      <Text style={styles.typeOfAddressHeading}>{t('customer.address.form.market.title')}</Text>
      {points.isLoading ? (
        <ActivityIndicator color="#2E7D32" />
      ) : points.isError ? (
        <Text style={styles.helperText}>{t('customer.address.form.market.error')}</Text>
      ) : items.length === 0 ? (
        <Text style={styles.helperText}>{t('customer.address.form.market.empty')}</Text>
      ) : (
        items.map((p) => {
          const selected = value === p.id;
          return (
            <TouchableOpacity
              key={p.id}
              testID={`market-${p.id}`}
              activeOpacity={0.8}
              onPress={() => onChange(selected ? null : p.id)}
              style={styles.marketRow}
            >
              <View style={[styles.radioCircle, selected && styles.radioCircleActive]}>
                {selected && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.radioLabel, selected && styles.radioLabelActive]} numberOfLines={1}>
                {p.name}
                {typeof p.distanceKm === 'number' ? ` · ${t('customer.address.form.market.distance', { km: p.distanceKm.toFixed(1) })}` : ''}
              </Text>
            </TouchableOpacity>
          );
        })
      )}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
};

// ── SVG ICONS ───────────────────────────────────────────────────────────────

const PinIcon = ({ color = '#1F2937' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={9} r={2.5} stroke={color} strokeWidth={1.6} />
  </Svg>
);


const ChevronRightIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 5l7 7-7 7"
      stroke="#374151"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CloseCrossIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke="#374151"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CheckmarkIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17l-5-5"
      stroke="#FFFFFF"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CustomerDeliveryAddressModal: React.FC<CustomerDeliveryAddressModalProps> = ({
  visible,
  initialStep = 'delivery',
  onClose,
  onSaveAddress,
  onUseCurrentLocation,
  onSelectManualLocation,
  initialValues,
  coords,
}) => {
  const qc = useQueryClient();
  const createAddress = useCreateAddress();
  const [step, setStep] = useState<'delivery' | 'addAddress'>(initialStep ?? 'delivery');

  // Form states (Figma 46:34483)
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [area, setArea] = useState('');
  const [locality, setLocality] = useState('');
  const [street, setStreet] = useState('');
  const [flat, setFlat] = useState('');
  const [building, setBuilding] = useState('');
  const [landmark, setLandmark] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [nearestPickupPointId, setNearestPickupPointId] = useState<string | null>(null);
  const [addressType, setAddressType] = useState<'Home' | 'Office' | 'Other'>('Home');
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState<AddressFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleReset = () => {
    setPincode(initialValues?.pincode ?? '');
    setCity(initialValues?.city ?? '');
    setState(initialValues?.state ?? '');
    setArea(initialValues?.area ?? '');
    setLocality(initialValues?.locality ?? '');
    setStreet(initialValues?.street ?? '');
    setFlat(initialValues?.flat ?? '');
    setBuilding(initialValues?.building ?? '');
    setLandmark(initialValues?.landmark ?? '');
    setContactPhone(initialValues?.contactPhone ?? '');
    setNearestPickupPointId(initialValues?.nearestPickupPointId ?? null);
    setAddressType(initialValues?.type === 'Office' || initialValues?.type === 'Other' ? initialValues.type : 'Home');
    setIsDefault(initialValues?.isDefault === true);
    setErrors({});
    setFormError(null);
  };

  useEffect(() => {
    if (visible) {
      setStep(initialStep);
      handleReset();
    }
    // Re-seed the form only when the modal opens.
  }, [visible, initialStep]);

  const clearError = (field: FormField) => {
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSave = async () => {
    if (saving) return;
    const fields: UiAddressFields = {
      pincode,
      city,
      state,
      area,
      locality,
      street,
      flat,
      building,
      landmark,
      contactPhone,
      type: addressType,
      isDefault,
      lat: coords?.lat ?? initialValues?.lat ?? null,
      lng: coords?.lng ?? initialValues?.lng ?? null,
      nearestPickupPointId,
    };
    const v = validateAddressForm(fields);
    setErrors(v);
    setFormError(null);
    if (Object.keys(v).length > 0) return;

    setSaving(true);
    try {
      // Serviceability first: its verdict decides the follow-up screen and it
      // supplies the nearest market when the customer did not pick one.
      let serviceability: Serviceability | undefined;
      const q: ServiceabilityQuery = { pincode: pincode.trim() };
      if (typeof fields.lat === 'number' && typeof fields.lng === 'number') {
        q.lat = fields.lat;
        q.lng = fields.lng;
      }
      try {
        serviceability = await qc.fetchQuery({
          queryKey: serviceabilityQueryKeys.check(q),
          queryFn: ({ signal }) => checkServiceability(q, signal),
          staleTime: 60_000,
        });
      } catch {
        serviceability = undefined; // unknown: still save the address
      }
      const created = await createAddress.mutateAsync(
        toApiAddress({
          ...fields,
          nearestPickupPointId: nearestPickupPointId ?? serviceability?.nearestPickupPointId ?? null,
        }),
      );
      onSaveAddress(created, { serviceable: serviceability ? serviceability.serviceable : null, serviceability });
      onClose();
    } catch (err) {
      const p = mapProblem(err);
      if (p.silent) return;
      const mapped = mapAddressFieldErrors(p.fieldErrors);
      setErrors(mapped);
      setFormError(p.message);
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  const field = (
    name: FormField,
    placeholder: string,
    value: string,
    onChange: (s: string) => void,
    extra?: Partial<React.ComponentProps<typeof TextInput>>,
  ) => (
    <View style={styles.fieldWrap}>
      <TextInput
        testID={`address-${name}`}
        style={[styles.underlineInput, errors[name] ? styles.underlineInputError : null]}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={(s) => {
          onChange(s);
          clearError(name);
        }}
        editable={!saving}
        {...extra}
      />
      {errors[name] ? <Text style={styles.fieldError}>{errors[name]}</Text> : null}
    </View>
  );

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}
      >
        {step === 'delivery' ? (
          /* ── SCREEN 1: WHERE SHOULD WE DELIVER? ────────────────────────── */
          <View style={styles.cardContainer}>
            {/* Top Right Floating Close Button (X in circle badge) */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={onClose}
              style={styles.floatingCloseBtn}
              accessibilityRole="button"
              accessibilityLabel={t('customer.serviceArea.close')}
            >
              <CloseCrossIcon />
            </TouchableOpacity>

            <Text style={styles.deliveryTitle}>{t('customer.address.form.delivery.title')}</Text>
            <Text style={styles.deliverySubtitle}>{t('customer.address.form.delivery.subtitle')}</Text>

            {/* Option 1: Use my current location (soft green card) */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                if (onUseCurrentLocation) {
                  onUseCurrentLocation();
                } else {
                  onClose();
                }
              }}
              style={styles.currentLocationOption}
            >
              <View style={styles.greenPinBadge}>
                <PinIcon color="#1F2937" />
              </View>
              <View style={styles.optionTextCol}>
                <Text style={styles.currentLocationTitle}>{t('customer.address.form.delivery.useCurrent')}</Text>
                <Text style={styles.currentLocationDesc}>{t('customer.address.form.delivery.useCurrentDesc')}</Text>
              </View>
              <ChevronRightIcon />
            </TouchableOpacity>

            {/* Option 2: Add Address (white card with chevron) */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setStep('addAddress')}
              style={styles.standardOption}
            >
              <View style={styles.whitePinBadge}>
                <PinIcon color="#1F2937" />
              </View>
              <View style={styles.optionTextCol}>
                <Text style={styles.standardOptionTitle}>{t('customer.address.add.title')}</Text>
              </View>
              <ChevronRightIcon />
            </TouchableOpacity>

            {/* Option 3: Select location manually */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                if (onSelectManualLocation) {
                  onSelectManualLocation();
                } else {
                  setStep('addAddress');
                }
              }}
              style={styles.standardOption}
            >
              <View style={styles.whitePinBadge}>
                <PinIcon color="#1F2937" />
              </View>
              <View style={styles.optionTextCol}>
                <Text style={styles.standardOptionTitle}>{t('customer.address.form.delivery.manual')}</Text>
              </View>
              <ChevronRightIcon />
            </TouchableOpacity>
          </View>
        ) : (
          /* ── SCREEN 2: ADD ADDRESS FORM ────────────────────────────────── */
          <View style={[styles.cardContainer, styles.addAddressContainer]}>
            {/* Top Right Floating Close Button (X in circle badge) */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={onClose}
              style={styles.floatingCloseBtn}
              accessibilityRole="button"
              accessibilityLabel={t('customer.serviceArea.close')}
            >
              <CloseCrossIcon />
            </TouchableOpacity>

            {/* Header: Title on Left, Reset on Right */}
            <View style={styles.addAddressHeaderRow}>
              <Text style={styles.addAddressTitle}>{t('customer.address.add.title')}</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleReset}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.resetText}>{t('customer.address.form.reset')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.formScrollContent}
            >
              {/* Row 1: Pincode and City side by side */}
              <View style={styles.inputRowDouble}>
                <View style={styles.halfInputWrap}>
                  {field('pincode', t('customer.address.form.pincode'), pincode, (s) => setPincode(s.replace(/\D/g, '').slice(0, 6)), {
                    keyboardType: 'numeric',
                    maxLength: 6,
                  })}
                </View>
                <View style={styles.halfInputWrap}>{field('city', t('customer.address.form.city'), city, setCity)}</View>
              </View>

              {field('state', t('customer.address.form.state'), state, setState)}
              {field('area', t('customer.address.form.area'), area, setArea)}
              {field('locality', t('customer.address.form.locality'), locality, setLocality)}
              {field('street', t('customer.address.form.street'), street, setStreet)}

              <View style={styles.inputRowDouble}>
                <View style={styles.halfInputWrap}>{field('flat', t('customer.address.form.flat'), flat, setFlat)}</View>
                <View style={styles.halfInputWrap}>{field('building', t('customer.address.form.building'), building, setBuilding)}</View>
              </View>

              {field('landmark', t('customer.address.form.landmark'), landmark, setLandmark)}
              {field('contactPhone', t('customer.address.form.contactPhone'), contactPhone, setContactPhone, {
                keyboardType: 'phone-pad',
                maxLength: 16,
              })}

              <NearestMarketPicker
                lat={coords?.lat ?? initialValues?.lat ?? undefined}
                lng={coords?.lng ?? initialValues?.lng ?? undefined}
                value={nearestPickupPointId}
                onChange={(id) => {
                  setNearestPickupPointId(id);
                  clearError('nearestPickupPointId');
                }}
                error={errors.nearestPickupPointId}
              />

              {/* Type of Address */}
              <Text style={styles.typeOfAddressHeading}>{t('customer.address.form.type.title')}</Text>

              <View style={styles.radioGroupRow}>
                {(['Home', 'Office', 'Other'] as const).map((type) => {
                  const isSelected = addressType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      activeOpacity={0.8}
                      onPress={() => setAddressType(type)}
                      style={styles.radioOption}
                    >
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                      <Text style={[styles.radioLabel, isSelected && styles.radioLabelActive]}>
                        {t(('customer.address.form.type.' + type) as 'customer.address.form.type.Home')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Mark as default address Checkbox */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsDefault(!isDefault)}
                style={styles.checkboxRow}
              >
                <View style={[styles.checkboxBox, isDefault && styles.checkboxBoxActive]}>
                  {isDefault && <CheckmarkIcon />}
                </View>
                <Text style={styles.checkboxLabel}>{t('customer.address.form.default')}</Text>
              </TouchableOpacity>

              {/* Save Address Button */}
              {formError ? (
                <Text testID="address-form-error" style={styles.formError}>
                  {formError}
                </Text>
              ) : null}

              <TouchableOpacity
                testID="address-save"
                activeOpacity={0.85}
                onPress={() => void handleSave()}
                disabled={saving}
                style={[styles.saveAddressBtn, saving && styles.saveAddressBtnDisabled]}
                accessibilityRole="button"
                accessibilityState={{ busy: saving, disabled: saving }}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveAddressBtnText}>{t('customer.address.form.save')}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: Math.min(SCREEN_WIDTH - 36, 350),
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  addAddressContainer: {
    maxHeight: '90%',
    paddingBottom: 16,
  },
  floatingCloseBtn: {
    position: 'absolute',
    top: -14,
    right: -10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  deliveryTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 22,
    color: '#1F2937',
    marginBottom: 6,
  },
  deliverySubtitle: {
    fontFamily: customerFonts.regular,
    fontSize: 12.5,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 16,
  },
  currentLocationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF7EC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  greenPinBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(46, 125, 50, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  optionTextCol: {
    flex: 1,
    paddingRight: 6,
  },
  currentLocationTitle: {
    fontFamily: customerFonts.semibold,
    fontSize: 13.5,
    color: '#1F2937',
    marginBottom: 2,
  },
  currentLocationDesc: {
    fontFamily: customerFonts.regular,
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
  },
  standardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  whitePinBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  standardOptionTitle: {
    fontFamily: customerFonts.semibold,
    fontSize: 13.5,
    color: '#1F2937',
  },

  // ── Add Address Screen Styles ──────────────────────────────────────────────
  addAddressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingRight: 12,
  },
  addAddressTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 22,
    color: '#1F2937',
  },
  resetText: {
    fontFamily: customerFonts.semibold,
    fontSize: 13.5,
    color: '#2E7D32',
  },
  formScrollContent: {
    paddingBottom: 8,
  },
  inputRowDouble: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  halfInputWrap: {
    flex: 1,
  },
  underlineInput: {
    fontFamily: customerFonts.regular,
    fontSize: 13.5,
    color: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  typeOfAddressHeading: {
    fontFamily: customerFonts.editorial,
    fontSize: 18,
    color: '#1F2937',
    marginTop: 14,
    marginBottom: 10,
  },
  radioGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: '#2E7D32',
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#2E7D32',
  },
  radioLabel: {
    fontFamily: customerFonts.regular,
    fontSize: 13.5,
    color: '#4B5563',
  },
  radioLabelActive: {
    fontFamily: customerFonts.semibold,
    color: '#1F2937',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    marginTop: 2,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  checkboxLabel: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    color: '#4B5563',
  },
  saveAddressBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 24,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  saveAddressBtnText: {
    fontFamily: customerFonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  saveAddressBtnDisabled: {
    opacity: 0.7,
  },
  fieldWrap: {
    width: '100%',
  },
  underlineInputError: {
    borderBottomColor: '#DC2626',
  },
  fieldError: {
    fontFamily: customerFonts.regular,
    fontSize: 11,
    color: '#DC2626',
    marginTop: -4,
    marginBottom: 6,
  },
  formError: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 10,
  },
  helperText: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
});

