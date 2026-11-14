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
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  customerColors,
  customerFonts,
  customerShadow,
  customerSpacing,
} from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface AddressData {
  pincode: string;
  city: string;
  state: string;
  locality: string;
  flat: string;
  landmark?: string;
  type: 'Home' | 'Office' | 'Other';
  isDefault: boolean;
}

export interface CustomerDeliveryAddressModalProps {
  visible: boolean;
  initialStep?: 'delivery' | 'addAddress';
  onClose: () => void;
  onSaveAddress: (address: AddressData) => void;
  onUseCurrentLocation?: () => void;
  onSelectManualLocation?: () => void;
}

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

const PlusIcon = ({ color = '#1F2937' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5v14M5 12h14"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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
}) => {
  const [step, setStep] = useState<'delivery' | 'addAddress'>(initialStep);

  // Form states matching Figma exact fields
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [locality, setLocality] = useState('');
  const [flat, setFlat] = useState('');
  const [landmark, setLandmark] = useState('');
  const [addressType, setAddressType] = useState<'Home' | 'Office' | 'Other'>('Home');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (visible) {
      setStep(initialStep);
    }
  }, [visible, initialStep]);

  const handleReset = () => {
    setPincode('');
    setCity('');
    setState('');
    setLocality('');
    setFlat('');
    setLandmark('');
    setAddressType('Home');
    setIsDefault(false);
  };

  const handleSave = () => {
    onSaveAddress({
      pincode: pincode.trim(),
      city: city.trim(),
      state: state.trim(),
      locality: locality.trim(),
      flat: flat.trim(),
      landmark: landmark.trim(),
      type: addressType,
      isDefault,
    });
    handleReset();
    onClose();
  };

  if (!visible) return null;

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
              accessibilityLabel="Close"
            >
              <CloseCrossIcon />
            </TouchableOpacity>

            <Text style={styles.deliveryTitle}>Where should we deliver?</Text>
            <Text style={styles.deliverySubtitle}>
              Choose your location to discover fresh produce available near you.
            </Text>

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
                <Text style={styles.currentLocationTitle}>Use my current location</Text>
                <Text style={styles.currentLocationDesc}>
                  Find nearby products and check delivery availability for your area.
                </Text>
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
                <Text style={styles.standardOptionTitle}>Add Address</Text>
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
                <Text style={styles.standardOptionTitle}>Select location manually</Text>
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
              accessibilityLabel="Close"
            >
              <CloseCrossIcon />
            </TouchableOpacity>

            {/* Header: Title on Left, Reset on Right */}
            <View style={styles.addAddressHeaderRow}>
              <Text style={styles.addAddressTitle}>Add Address</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleReset}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.resetText}>Reset</Text>
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
                  <TextInput
                    style={styles.underlineInput}
                    placeholder="Pincode"
                    placeholderTextColor="#9CA3AF"
                    value={pincode}
                    onChangeText={setPincode}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfInputWrap}>
                  <TextInput
                    style={styles.underlineInput}
                    placeholder="City"
                    placeholderTextColor="#9CA3AF"
                    value={city}
                    onChangeText={setCity}
                  />
                </View>
              </View>

              {/* State */}
              <TextInput
                style={styles.underlineInput}
                placeholder="State"
                placeholderTextColor="#9CA3AF"
                value={state}
                onChangeText={setState}
              />

              {/* Locality / Area / Street */}
              <TextInput
                style={styles.underlineInput}
                placeholder="Locality / Area / Street"
                placeholderTextColor="#9CA3AF"
                value={locality}
                onChangeText={setLocality}
              />

              {/* Flat on / Building Name */}
              <TextInput
                style={styles.underlineInput}
                placeholder="Flat on / Building Name"
                placeholderTextColor="#9CA3AF"
                value={flat}
                onChangeText={setFlat}
              />

              {/* Landmark (optional) */}
              <TextInput
                style={styles.underlineInput}
                placeholder="Landmark (optional)"
                placeholderTextColor="#9CA3AF"
                value={landmark}
                onChangeText={setLandmark}
              />

              {/* Type of Address */}
              <Text style={styles.typeOfAddressHeading}>Type of Address</Text>

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
                        {type}
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
                <Text style={styles.checkboxLabel}>Mark as default address</Text>
              </TouchableOpacity>

              {/* Save Address Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSave}
                style={styles.saveAddressBtn}
              >
                <Text style={styles.saveAddressBtnText}>Save address</Text>
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
});

