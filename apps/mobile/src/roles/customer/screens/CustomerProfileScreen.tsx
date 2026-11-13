import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  customerColors,
  customerFonts,
  customerRadius,
  customerShadow,
  customerSpacing,
} from '../theme';
import {
  branchLeavesTopLeft,
  profileEmailVerified,
  profileAvatarMale,
  profileAvatarFemale,
  satelliteMapCoimbatore,
} from '../assets/images';

export type ProfileScreenMode = 'empty' | 'view' | 'edit';

export interface CustomerProfileData {
  name: string;
  phone: string;
  phoneVerified?: boolean;
  email: string;
  emailVerified?: boolean;
  age: string;
  language: string;
  gender: 'male' | 'female' | 'prefer_not_to_say' | '';
  address: string;
  city: string;
  pincode: string;
  state: string;
}

export interface CustomerProfileScreenProps {
  initialMode?: ProfileScreenMode;
  initialData?: Partial<CustomerProfileData>;
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  onBack?: () => void;
  onSave?: (data: CustomerProfileData) => void;
}

// ── SVG ICONS ─────────────────────────────────────────────────────────────────

const BackArrowSvg = ({ color = '#1A2E1A', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PencilEditSvg = ({ color = '#1A2E1A', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CheckCircleSvg = ({ color = '#2E7D32', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} fill={color} />
    <Path
      d="M8 12.5l2.5 2.5 5.5-5.5"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronDownSvg = ({ color = '#1A2E1A', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 9l6 6 6-6"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const MapPinSvg = ({ color = '#EF4444', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21s-6-5.6-6-10a6 6 0 1112 0c0 4.4-6 10-6 10z"
      fill={color}
      stroke="#B91C1C"
      strokeWidth={1.5}
    />
    <Circle cx={12} cy={11} r={2.5} fill="#FFFFFF" />
  </Svg>
);

const CrosshairSvg = ({ color = '#2E7D32', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={8} stroke={color} strokeWidth={1.6} />
    <Path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
  </Svg>
);

const CloseSvg = ({ color = '#6B7280', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SuccessMailSvg = ({ size = 64 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <Circle cx={32} cy={32} r={28} fill="#E8F5E9" />
    <Path
      d="M16 24a4 4 0 014-4h24a4 4 0 014 4v16a4 4 0 01-4 4H20a4 4 0 01-4-4V24z"
      fill="#4CAF50"
    />
    <Path
      d="M16 24l16 12 16-12"
      stroke="#FFFFFF"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={32} cy={32} r={10} fill="#2E7D32" />
    <Path
      d="M29 32l2 2 4-4"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Customer Profile Management Component
 * Supports:
 *  - Screen 74 · Profile Deals - empty (Empty / Create mode)
 *  - Screen 75 · My Profile (Filled View mode)
 *  - Screen 76 · Edit Profile (Editable mode with Save Changes)
 *  - Screen 79 · My Profile (After email verification)
 *  - Email OTP Verification Modal / Dialog
 */
export const CustomerProfileScreen: React.FC<CustomerProfileScreenProps> = ({
  initialMode = 'view',
  initialData,
  onNavigate,
  onBack,
  onSave,
}) => {
  const [mode, setMode] = useState<ProfileScreenMode>(initialMode);

  // Form State
  const [formData, setFormData] = useState<CustomerProfileData>({
    name: initialData?.name || (initialMode === 'empty' ? '' : 'Arun Kumar'),
    phone: initialData?.phone || (initialMode === 'empty' ? '' : '+91 99944 99944'),
    phoneVerified: initialData?.phoneVerified ?? (initialMode !== 'empty'),
    email: initialData?.email || (initialMode === 'empty' ? '' : 'suresh12345@gmail.com'),
    emailVerified: initialData?.emailVerified ?? false,
    age: initialData?.age || (initialMode === 'empty' ? '' : 'Age 30'),
    language: initialData?.language || (initialMode === 'empty' ? '' : 'English'),
    gender: initialData?.gender || (initialMode === 'empty' ? '' : 'male'),
    address: initialData?.address || (initialMode === 'empty' ? '' : '12, Tea Garden Road, Ooty, Nilgiris - 643001.'),
    city: initialData?.city || (initialMode === 'empty' ? '' : 'Ooty'),
    pincode: initialData?.pincode || (initialMode === 'empty' ? '' : '643001'),
    state: initialData?.state || (initialMode === 'empty' ? '' : 'Tamil Nadu, India'),
  });

  // Email Verification Flow State
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
  const [emailOtpPin, setEmailOtpPin] = useState(['', '', '', '']);
  const [showEmailVerifiedSuccess, setShowEmailVerifiedSuccess] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleHeaderBack = () => {
    if (mode === 'edit' && initialMode !== 'edit') {
      setMode('view');
    } else {
      onBack ? onBack() : onNavigate?.('CustomerAccount');
    }
  };

  const handleSaveProfile = () => {
    onSave?.(formData);
    setMode('view');
  };

  const handleVerifyEmailSubmit = () => {
    setShowEmailOtpModal(false);
    setShowEmailVerifiedSuccess(true);
  };

  const handleContinueAfterVerification = () => {
    setShowEmailVerifiedSuccess(false);
    setFormData(prev => ({ ...prev, emailVerified: true }));
  };

  const isEditable = mode === 'edit' || mode === 'empty';

  return (
    <View style={styles.container}>
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeftGroup}>
          {/* Back Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleHeaderBack}
            style={styles.circleIconButton}
            accessibilityLabel="Back"
          >
            <BackArrowSvg color={customerColors.heading} size={18} />
          </TouchableOpacity>

          {/* Screen Title - positioned adjacent to Back button (exact Figma spec) */}
          <Text style={styles.headerTitle}>
            {mode === 'edit' ? 'Edit Profile' : 'My Profile'}
          </Text>
        </View>

        {/* Top Right Edit Pencil Icon */}
        {mode !== 'edit' ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setMode('edit')}
            style={styles.circleIconButton}
            accessibilityLabel="Edit Profile"
          >
            <PencilEditSvg color={customerColors.heading} size={16} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerPlaceholder} />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Decorative Green Branch Leaf Illustration */}
        <Image
          source={branchLeavesTopLeft}
          style={styles.decorLeavesImage}
          resizeMode="contain"
          pointerEvents="none"
        />

        {/* Subheader */}
        <Text style={styles.editorialSubheader}>
          {mode === 'edit' ? 'Update your details' : 'your profile details'}
        </Text>

        {/* ── SECTION 1: PERSONAL DETAILS ────────────────────────────────────── */}
        <Text style={styles.sectionHeadingUnderlined}>Personal details</Text>

        <View style={styles.formSection}>
          {/* 1. Name */}
          <View style={styles.fieldRow}>
            {isEditable ? (
              <TextInput
                style={styles.inputField}
                value={formData.name}
                onChangeText={text => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Please enter your name"
                placeholderTextColor={customerColors.muted}
                textAlign="center"
              />
            ) : (
              <Text style={styles.displayFieldText}>
                {formData.name || 'Please enter your name'}
              </Text>
            )}
          </View>

          {/* 2. Number */}
          <View style={styles.fieldRowWithTrailing}>
            {isEditable ? (
              <TextInput
                style={[styles.inputField, { flex: 1 }]}
                value={formData.phone}
                onChangeText={text => setFormData(prev => ({ ...prev, phone: text }))}
                placeholder="Please enter your Number"
                placeholderTextColor={customerColors.muted}
                keyboardType="phone-pad"
                textAlign="center"
              />
            ) : (
              <Text style={[styles.displayFieldText, { flex: 1 }]}>
                {formData.phone || 'Please enter your Number'}
              </Text>
            )}
            {formData.phoneVerified && (
              <View style={styles.trailingIcon}>
                <CheckCircleSvg size={16} />
              </View>
            )}
          </View>

          {/* 3. Email */}
          <View style={styles.fieldRowWithTrailing}>
            {isEditable ? (
              <TextInput
                style={[styles.inputField, { flex: 1 }]}
                value={formData.email}
                onChangeText={text => setFormData(prev => ({ ...prev, email: text }))}
                placeholder="Please enter your email"
                placeholderTextColor={customerColors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="center"
              />
            ) : (
              <Text style={[styles.displayFieldText, { flex: 1 }]}>
                {formData.email || 'Please enter your email'}
              </Text>
            )}

            {formData.email && !formData.emailVerified ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowEmailOtpModal(true)}
                style={styles.verifyBadge}
                accessibilityLabel="Verify now"
              >
                <Text style={styles.verifyBadgeText}>Verify now &gt;</Text>
              </TouchableOpacity>
            ) : formData.emailVerified ? (
              <View style={styles.trailingIcon}>
                <CheckCircleSvg size={16} />
              </View>
            ) : null}
          </View>

          {/* 4. Age */}
          <View style={styles.fieldRow}>
            {isEditable ? (
              <TextInput
                style={styles.inputField}
                value={formData.age}
                onChangeText={text => setFormData(prev => ({ ...prev, age: text }))}
                placeholder="Please enter your Age"
                placeholderTextColor={customerColors.muted}
                textAlign="center"
              />
            ) : (
              <Text style={styles.displayFieldText}>
                {formData.age || 'Please enter your Age'}
              </Text>
            )}
          </View>

          {/* 5. Language Dropdown */}
          <TouchableOpacity
            activeOpacity={isEditable ? 0.7 : 1}
            onPress={() => {
              if (isEditable) {
                setFormData(prev => ({
                  ...prev,
                  language: prev.language === 'English' ? 'Tamil' : 'English',
                }));
              }
            }}
            style={styles.dropdownFieldRow}
          >
            <Text
              style={[
                styles.displayFieldText,
                !formData.language && styles.placeholderText,
              ]}
            >
              {formData.language || 'Select language'}
            </Text>
            <ChevronDownSvg color={customerColors.heading} size={14} />
          </TouchableOpacity>

          {/* 6. Gender Selector */}
          <View style={styles.genderRow}>
            {/* Male */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => isEditable && setFormData(prev => ({ ...prev, gender: 'male' }))}
              style={[
                styles.genderChip,
                formData.gender === 'male' && styles.genderChipSelected,
              ]}
              accessibilityLabel="Male"
            >
              <Image
                source={profileAvatarMale}
                style={styles.genderAvatarImage}
                resizeMode="contain"
              />
              <Text style={styles.genderLabel}>Male</Text>
              {formData.gender === 'male' ? (
                <CheckCircleSvg size={14} />
              ) : (
                <Text style={styles.plusSymbol}>+</Text>
              )}
            </TouchableOpacity>

            {/* Female */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => isEditable && setFormData(prev => ({ ...prev, gender: 'female' }))}
              style={[
                styles.genderChip,
                formData.gender === 'female' && styles.genderChipSelected,
              ]}
              accessibilityLabel="Female"
            >
              <Image
                source={profileAvatarFemale}
                style={styles.genderAvatarImage}
                resizeMode="contain"
              />
              <Text style={styles.genderLabel}>Female</Text>
              {formData.gender === 'female' ? (
                <CheckCircleSvg size={14} />
              ) : (
                <Text style={styles.plusSymbol}>+</Text>
              )}
            </TouchableOpacity>

            {/* Prefer not to say */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => isEditable && setFormData(prev => ({ ...prev, gender: 'prefer_not_to_say' }))}
              style={[
                styles.genderChip,
                formData.gender === 'prefer_not_to_say' && styles.genderChipSelected,
              ]}
              accessibilityLabel="Prefer not to say"
            >
              <Text style={styles.genderLabelSmall}>Prefer not to say</Text>
              {formData.gender === 'prefer_not_to_say' ? (
                <CheckCircleSvg size={14} />
              ) : (
                <Text style={styles.plusSymbol}>+</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SECTION 2: ADDRESS DETAILS ────────────────────────────────────── */}
        <Text style={styles.sectionHeadingUnderlined}>Address details</Text>

        <View style={styles.formSection}>
          {/* 1. Address */}
          <View style={styles.fieldRow}>
            {isEditable ? (
              <TextInput
                style={styles.inputField}
                value={formData.address}
                onChangeText={text => setFormData(prev => ({ ...prev, address: text }))}
                placeholder="Please enter your address"
                placeholderTextColor={customerColors.muted}
                textAlign="center"
              />
            ) : (
              <Text style={styles.displayFieldText}>
                {formData.address || 'Please enter your address'}
              </Text>
            )}
          </View>

          {/* 2. City Dropdown */}
          <TouchableOpacity
            activeOpacity={isEditable ? 0.7 : 1}
            onPress={() => {
              if (isEditable) {
                setFormData(prev => ({
                  ...prev,
                  city: prev.city === 'Ooty' ? 'Coimbatore' : 'Ooty',
                }));
              }
            }}
            style={styles.dropdownFieldRow}
          >
            <Text
              style={[
                styles.displayFieldText,
                !formData.city && styles.placeholderText,
              ]}
            >
              {formData.city || 'Select city'}
            </Text>
            <ChevronDownSvg color={customerColors.heading} size={14} />
          </TouchableOpacity>

          {/* 3. Pincode */}
          <View style={styles.fieldRow}>
            {isEditable ? (
              <TextInput
                style={styles.inputField}
                value={formData.pincode}
                onChangeText={text => setFormData(prev => ({ ...prev, pincode: text }))}
                placeholder="Please enter your pincode"
                placeholderTextColor={customerColors.muted}
                keyboardType="numeric"
                textAlign="center"
              />
            ) : (
              <Text style={styles.displayFieldText}>
                {formData.pincode || 'Please enter your pincode'}
              </Text>
            )}
          </View>

          {/* 4. State Dropdown */}
          <TouchableOpacity
            activeOpacity={isEditable ? 0.7 : 1}
            onPress={() => {
              if (isEditable) {
                setFormData(prev => ({
                  ...prev,
                  state: 'Tamil Nadu, India',
                }));
              }
            }}
            style={styles.dropdownFieldRow}
          >
            <Text
              style={[
                styles.displayFieldText,
                !formData.state && styles.placeholderText,
              ]}
            >
              {formData.state || 'Select State'}
            </Text>
            <ChevronDownSvg color={customerColors.heading} size={14} />
          </TouchableOpacity>
        </View>

        {/* ── SECTION 3: LOCATION ON MAP ─────────────────────────────────────── */}
        <View style={styles.mapHeaderRow}>
          <Text style={styles.locationOnMapText}>Location on Map</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onNavigate?.('CustomerAddAddress')}
            style={styles.openMapBtn}
            accessibilityLabel="Open Map"
          >
            <Text style={styles.openMapBtnText}>Open Map</Text>
          </TouchableOpacity>
        </View>

        {/* Map Preview Card (Figma Exact Illustrated Card) */}
        {formData.address ? (
          <View style={styles.mapCardContainer}>
            <Image
              source={satelliteMapCoimbatore}
              style={styles.mapBackgroundImage}
              resizeMode="cover"
            />
            <View style={styles.mapSoftTint} />

            {/* Red Marker in Center */}
            <View style={styles.mapMarkerWrap}>
              <MapPinSvg size={24} />
            </View>

            {/* Floating Location Tooltip */}
            <View style={[styles.floatingLocationCard, customerShadow.raised]}>
              <View style={styles.tooltipIcon}>
                <MapPinSvg size={14} />
              </View>
              <View style={styles.tooltipTextWrap}>
                <Text style={styles.tooltipTitle}>Selected Location</Text>
                <Text style={styles.tooltipAddress} numberOfLines={2}>
                  {formData.address}
                </Text>
              </View>
            </View>

            {/* GPS Target Crosshair Button */}
            <TouchableOpacity style={styles.gpsTargetBtn} activeOpacity={0.8}>
              <CrosshairSvg size={16} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ── BOTTOM ACTION BUTTON (IN EDIT / EMPTY MODE) ─────────────────────── */}
        {isEditable && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSaveProfile}
            style={styles.saveChangesButton}
            accessibilityLabel="Save Changes"
          >
            <Text style={styles.saveChangesText}>✔ Save Changes</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── MODAL 1: EMAIL OTP VERIFICATION (IMAGE 4 LEFT) ─────────────────── */}
      <Modal visible={showEmailOtpModal} transparent={true} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.otpModalCard}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowEmailOtpModal(false)}
            >
              <CloseSvg size={18} />
            </TouchableOpacity>

            <Image
              source={branchLeavesTopLeft}
              style={styles.otpLeavesTop}
              resizeMode="contain"
            />

            <Text style={styles.otpEditorialTitle}>
              Please enter 4-digit PIN Sent to
            </Text>
            <View style={styles.emailEditRow}>
              <Text style={styles.otpMaskedEmail}>
                Sure***********@gmail.com
              </Text>
              <TouchableOpacity onPress={() => setShowEmailOtpModal(false)}>
                <Text style={styles.otpEditText}>• Edit</Text>
              </TouchableOpacity>
            </View>

            {/* 4 Digit PIN Boxes */}
            <View style={styles.pinBoxesRow}>
              {[0, 1, 2, 3].map(index => (
                <TextInput
                  key={index}
                  style={styles.pinInput}
                  keyboardType="numeric"
                  maxLength={1}
                  value={emailOtpPin[index]}
                  onChangeText={val => {
                    const next = [...emailOtpPin];
                    next[index] = val;
                    setEmailOtpPin(next);
                  }}
                  textAlign="center"
                />
              ))}
            </View>

            <Text style={styles.resendTimerText}>
              Didn't receive the PIN? <Text style={{ color: customerColors.muted }}>Resend in 28s</Text>
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleVerifyEmailSubmit}
              style={styles.modalPrimaryBtn}
              accessibilityLabel="Continue"
            >
              <Text style={styles.modalPrimaryBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 2: EMAIL VERIFIED SUCCESS (IMAGE 4 RIGHT) ────────────────── */}
      <Modal visible={showEmailVerifiedSuccess} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.successModalCard}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowEmailVerifiedSuccess(false)}
            >
              <CloseSvg size={18} />
            </TouchableOpacity>

            <View style={styles.successGraphicWrap}>
              <SuccessMailSvg size={68} />
            </View>

            <Text style={styles.successTitle}>Email Verified!</Text>
            <Text style={styles.successDescription}>
              Your email address has been successfully verified. You can now enjoy all features of TOHFA Market.
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleContinueAfterVerification}
              style={styles.modalPrimaryBtn}
              accessibilityLabel="Continue to Profile"
            >
              <Text style={styles.modalPrimaryBtnText}>Continue to Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: customerSpacing.base,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 12 : 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circleIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1A2E1A',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerPlaceholder: {
    width: 36,
    height: 36,
  },
  headerTitle: {
    fontSize: 22,
    color: '#1A2E1A',
    fontFamily: customerFonts.editorial,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: customerSpacing.base,
    paddingBottom: 40,
    position: 'relative',
  },
  decorLeavesImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 52,
    height: 85,
    opacity: 0.9,
  },
  editorialSubheader: {
    fontSize: 18,
    color: customerColors.brand,
    fontFamily: customerFonts.editorial,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
  sectionHeadingUnderlined: {
    fontSize: 16,
    color: customerColors.brand,
    fontFamily: customerFonts.editorial,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: 14,
    marginBottom: 6,
  },
  formSection: {
    marginTop: 4,
  },
  fieldRow: {
    borderBottomWidth: StyleSheet.hairlineWidth * 1.5,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldRowWithTrailing: {
    borderBottomWidth: StyleSheet.hairlineWidth * 1.5,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dropdownFieldRow: {
    borderBottomWidth: StyleSheet.hairlineWidth * 1.5,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  inputField: {
    fontSize: 13,
    color: customerColors.body,
    fontFamily: customerFonts.regular,
    paddingVertical: 0,
    width: '100%',
    textAlign: 'center',
  },
  displayFieldText: {
    fontSize: 13,
    color: customerColors.body,
    fontFamily: customerFonts.regular,
    textAlign: 'center',
  },
  placeholderText: {
    color: customerColors.muted,
  },
  trailingIcon: {
    position: 'absolute',
    right: 8,
  },
  verifyBadge: {
    position: 'absolute',
    right: 4,
    backgroundColor: '#FED7D7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: customerRadius.pill,
  },
  verifyBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#E53E3E',
    fontFamily: customerFonts.semibold,
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingVertical: 6,
    gap: 6,
  },
  genderChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth * 1.5,
    borderBottomColor: '#E5E7EB',
    gap: 4,
  },
  genderChipSelected: {
    borderBottomColor: customerColors.brand,
  },
  genderAvatarImage: {
    width: 18,
    height: 18,
  },
  genderLabel: {
    fontSize: 11,
    color: customerColors.body,
    fontFamily: customerFonts.regular,
  },
  genderLabelSmall: {
    fontSize: 10,
    color: customerColors.body,
    fontFamily: customerFonts.regular,
  },
  plusSymbol: {
    fontSize: 12,
    color: customerColors.muted,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 8,
  },
  locationOnMapText: {
    fontSize: 15,
    color: customerColors.brand,
    fontFamily: customerFonts.editorial,
  },
  openMapBtn: {
    backgroundColor: customerColors.brand,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: customerRadius.pill,
  },
  openMapBtnText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: customerFonts.semibold,
  },
  mapCardContainer: {
    height: 110,
    borderRadius: customerRadius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F8F2',
    position: 'relative',
    marginTop: 4,
  },
  mapBackgroundImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  mapSoftTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  mapMarkerWrap: {
    position: 'absolute',
    top: 36,
    left: '52%',
    marginLeft: -12,
  },
  floatingLocationCard: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '58%',
    gap: 6,
  },
  tooltipIcon: {
    marginTop: 1,
  },
  tooltipTextWrap: {
    flex: 1,
  },
  tooltipTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: customerColors.brand,
    fontFamily: customerFonts.bold,
  },
  tooltipAddress: {
    fontSize: 9,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
    marginTop: 1,
  },
  gpsTargetBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveChangesButton: {
    backgroundColor: customerColors.brand,
    borderRadius: customerRadius.pill,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    width: '100%',
  },
  saveChangesText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: customerFonts.bold,
  },

  // ── MODAL STYLES ───────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: customerSpacing.base,
  },
  otpModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 4,
    zIndex: 10,
  },
  otpLeavesTop: {
    width: 50,
    height: 50,
    position: 'absolute',
    top: 10,
    left: 10,
    opacity: 0.8,
  },
  otpEditorialTitle: {
    fontSize: 18,
    color: customerColors.brand,
    fontFamily: customerFonts.editorial,
    textAlign: 'center',
    marginTop: 20,
  },
  emailEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  otpMaskedEmail: {
    fontSize: 12,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
  },
  otpEditText: {
    fontSize: 12,
    color: customerColors.brand,
    fontWeight: '600',
  },
  pinBoxesRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 24,
  },
  pinInput: {
    width: 44,
    height: 44,
    borderBottomWidth: 2,
    borderBottomColor: '#D1D5DB',
    fontSize: 20,
    fontWeight: '700',
    color: customerColors.heading,
  },
  resendTimerText: {
    fontSize: 12,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
    marginBottom: 20,
  },
  modalPrimaryBtn: {
    backgroundColor: customerColors.brand,
    borderRadius: customerRadius.pill,
    height: 44,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: customerFonts.bold,
  },
  successModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  successGraphicWrap: {
    marginTop: 10,
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 20,
    color: customerColors.heading,
    fontFamily: customerFonts.editorial,
    marginTop: 6,
    textAlign: 'center',
  },
  successDescription: {
    fontSize: 12,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
});

