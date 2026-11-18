import React, { useState, useEffect, useMemo } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  profileAvatarMale,
  profileAvatarFemale,
  satelliteMapCoimbatore,
  profileEmailVerified,
} from '../assets/images';
import { useQueryClient } from '@tanstack/react-query';
import {
  displayName,
  formatMobileDisplay,
  genderFromApi,
  genderToApi,
  profileQueryKeys,
  requestEmailOtp,
  useCustomerProfile,
  useUpdateCustomerProfile,
  validateAge,
  verifyEmailOtp,
  type CustomerProfile,
  type UpdateCustomerProfileInput,
} from '../api/profile';
import {
  isValidPincode,
  pickDefaultAddress,
  toApiAddress,
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  type CustomerAddress,
} from '../api/addresses';
import { mapProblem } from '../api/problem';
import { setLocale } from '../../../i18n/customer';

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

/** Email OTP length: `system_config.otp_length` is not exposed to mobile; default 6, API accepts 4..8. */
export const EMAIL_OTP_LENGTH = 6;
const EMAIL_OTP_PATTERN = /^[0-9]{4,8}$/;
/** Local resend cooldown (the email OTP answer carries no `resendAvailableAt`); 429 overrides it. */
const EMAIL_RESEND_COOLDOWN_S = 60;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_UNAVAILABLE_MESSAGE = "Email verification isn't available right now";

const EMPTY_FORM: CustomerProfileData = {
  name: '',
  phone: '',
  phoneVerified: false,
  email: '',
  emailVerified: false,
  age: '',
  language: '',
  gender: '',
  address: '',
  city: '',
  pincode: '',
  state: '',
};

const joinParts = (parts: Array<string | null | undefined>) =>
  parts
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
    .join(', ');

/** Server profile + default address -> form values (age is digits only; view mode prefixes "Age"). */
export function profileToForm(
  profile: CustomerProfile | undefined,
  address: CustomerAddress | undefined,
  overrides?: Partial<CustomerProfileData>,
): CustomerProfileData {
  const g = genderFromApi(profile?.gender);
  return {
    ...EMPTY_FORM,
    ...(profile
      ? {
          name: displayName(profile),
          phone: formatMobileDisplay(profile.mobile),
          phoneVerified: Boolean(profile.mobile),
          email: profile.email ?? '',
          emailVerified: Boolean(profile.email) && profile.emailVerified,
          age: profile.age != null ? String(profile.age) : '',
          language: profile.preferredLocale === 'ta' ? 'Tamil' : 'English',
          gender: g === 'other' || g == null ? '' : g,
        }
      : {}),
    ...(address
      ? {
          address: joinParts([address.line1, address.line2]),
          city: address.city,
          pincode: address.pincode,
          state: address.state,
        }
      : {}),
    ...(overrides ?? {}),
  };
}

/** `suresh@gmail.com` -> `sure**@gmail.com`. */
export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const keep = Math.min(4, Math.max(1, local.length - 1));
  return `${local.slice(0, keep)}${'*'.repeat(Math.max(1, local.length - keep))}${email.slice(at)}`;
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
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<ProfileScreenMode>(initialMode);

  const headerTopPadding = insets.top > 0
    ? insets.top + 8
    : (Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 44) : 16);

  const queryClient = useQueryClient();
  const profileQuery = useCustomerProfile();
  const addressesQuery = useAddresses();
  const updateProfile = useUpdateCustomerProfile();
  const updateAddress = useUpdateAddress();
  const createAddress = useCreateAddress();
  const profile = profileQuery.data;
  const defaultAddress = pickDefaultAddress(addressesQuery.data);

  // Form state: mirrors the server (profile + default address) until the user edits.
  const baseline = useMemo(
    () => profileToForm(profile, defaultAddress, initialData),
    [profile, defaultAddress, initialData],
  );
  const [formData, setFormData] = useState<CustomerProfileData>(baseline);
  const [dirty, setDirty] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!dirty) setFormData(baseline);
  }, [baseline, dirty]);

  const updateForm = (fn: (prev: CustomerProfileData) => CustomerProfileData) => {
    setDirty(true);
    setFormData(fn);
  };

  // Email Verification Flow State (BR-160)
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
  const [emailOtpPin, setEmailOtpPin] = useState<string[]>(() => Array(EMAIL_OTP_LENGTH).fill(''));
  const [showEmailVerifiedSuccess, setShowEmailVerifiedSuccess] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [emailUnavailable, setEmailUnavailable] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const id = setTimeout(() => setResendIn((n) => (n > 0 ? n - 1 : 0)), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const resetEdits = () => {
    setDirty(false);
    setFieldErrors({});
    setSaveError(null);
  };

  const handleHeaderBack = () => {
    if (mode === 'edit' && initialMode !== 'edit') {
      resetEdits();
      setMode('view');
    } else if (onBack) {
      onBack();
    } else {
      onNavigate?.('CustomerAccount');
    }
  };

  const handleSaveProfile = async () => {
    if (saving) return;
    const errs: Record<string, string> = {};
    const name = formData.name.trim();
    if (!name) errs.name = 'Please enter your name';
    else if (name.length > 120) errs.name = 'Name must be 120 characters or fewer.';
    const age = validateAge(formData.age);
    if (age.error) errs.age = age.error;

    const addressText = formData.address.trim();
    const city = formData.city.trim();
    const pincode = formData.pincode.trim();
    const state = formData.state.replace(/,?\s*India$/i, '').trim() || 'Tamil Nadu';
    const addressChanged =
      addressText !== baseline.address.trim() ||
      city !== baseline.city.trim() ||
      pincode !== baseline.pincode.trim() ||
      (formData.state.trim() !== '' && state !== baseline.state.trim());
    const wantsAddress = addressChanged && (addressText !== '' || city !== '' || pincode !== '');
    if (wantsAddress) {
      if (!addressText) errs.address = 'Please enter your address';
      if (!city) errs.city = 'Please enter your city';
      if (!isValidPincode(pincode)) errs.pincode = 'Enter a valid 6-digit pincode';
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    const patch: UpdateCustomerProfileInput = {};
    if (name !== displayName(profile)) patch.fullName = name;
    if (age.value !== (profile?.age ?? null)) patch.age = age.value;
    if (formData.gender) {
      const g = genderToApi(formData.gender);
      if (g !== (profile?.gender ?? null)) patch.gender = g;
    }
    if (formData.language) {
      const locale = formData.language === 'Tamil' ? 'ta' : 'en';
      if (locale !== profile?.preferredLocale) patch.preferredLocale = locale;
    }

    setSaving(true);
    setFieldErrors({});
    setSaveError(null);
    try {
      if (Object.keys(patch).length > 0) {
        const saved = await updateProfile.mutateAsync(patch);
        if (patch.preferredLocale) setLocale(saved.preferredLocale ?? patch.preferredLocale);
      }
      if (wantsAddress) {
        const line1 = addressText.slice(0, 200);
        if (defaultAddress) {
          await updateAddress.mutateAsync({
            id: defaultAddress.id,
            input: { line1, line2: null, city: city.slice(0, 100), pincode, state },
          });
        } else {
          await createAddress.mutateAsync(
            toApiAddress({ flat: line1, city, pincode, state, type: 'Home', isDefault: true }),
          );
        }
      }
      onSave?.(formData);
      setDirty(false);
      setMode('view');
    } catch (err) {
      const p = mapProblem(err);
      if (p.silent) return;
      const fe = p.fieldErrors;
      const mapped: Record<string, string> = {};
      if (fe.fullName) mapped.name = fe.fullName;
      if (fe.age) mapped.age = fe.age;
      if (fe.gender) mapped.gender = fe.gender;
      if (fe.line1) mapped.address = fe.line1;
      if (fe.city) mapped.city = fe.city;
      if (fe.pincode) mapped.pincode = fe.pincode;
      setFieldErrors(mapped);
      setSaveError(p.message);
    } finally {
      setSaving(false);
    }
  };

  const applyEmailError = (err: unknown, target: 'email' | 'otp') => {
    const p = mapProblem(err);
    if (p.silent) return;
    if (p.code === 'EMAIL_NOT_CONFIGURED' || p.status === 501) {
      setEmailUnavailable(true);
      setShowEmailOtpModal(false);
      setEmailError(EMAIL_UNAVAILABLE_MESSAGE);
      return;
    }
    if (p.action === 'wait' && p.retryAfterSeconds) setResendIn(p.retryAfterSeconds);
    const msg = p.fieldErrors.email ?? p.fieldErrors.code ?? p.message;
    if (target === 'email') setEmailError(msg);
    else setOtpError(msg);
  };

  const sendEmailOtp = async (email: string, target: 'email' | 'otp') => {
    setSendingOtp(true);
    try {
      await requestEmailOtp(email);
      setOtpEmail(email);
      setEmailOtpPin(Array(EMAIL_OTP_LENGTH).fill(''));
      setOtpError(null);
      setEmailError(null);
      setResendIn(EMAIL_RESEND_COOLDOWN_S);
      setShowEmailOtpModal(true);
    } catch (err) {
      applyEmailError(err, target);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyNow = () => {
    if (sendingOtp || emailUnavailable) return;
    const email = formData.email.trim();
    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      setEmailError('Please enter a valid email address');
      return;
    }
    void sendEmailOtp(email, 'email');
  };

  const handleResendOtp = () => {
    if (resendIn > 0 || sendingOtp || !otpEmail) return;
    void sendEmailOtp(otpEmail, 'otp');
  };

  const otpCode = emailOtpPin.join('');
  const otpReady = EMAIL_OTP_PATTERN.test(otpCode);

  const handleVerifyEmailSubmit = async () => {
    if (!otpReady || verifyingOtp) return;
    setVerifyingOtp(true);
    setOtpError(null);
    try {
      const updated = await verifyEmailOtp({ email: otpEmail, code: otpCode });
      queryClient.setQueryData(profileQueryKeys.me, updated);
      setShowEmailOtpModal(false);
      setShowEmailVerifiedSuccess(true);
    } catch (err) {
      setEmailOtpPin(Array(EMAIL_OTP_LENGTH).fill(''));
      applyEmailError(err, 'otp');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const digits = val.replace(/[^0-9]/g, '');
    setOtpError(null);
    setEmailOtpPin((prev) => {
      const next = [...prev];
      if (digits.length > 1) {
        // Pasted code: spread across the boxes.
        digits
          .slice(0, EMAIL_OTP_LENGTH - index)
          .split('')
          .forEach((d, i) => {
            next[index + i] = d;
          });
      } else {
        next[index] = digits;
      }
      return next;
    });
  };

  const handleContinueAfterVerification = () => {
    setShowEmailVerifiedSuccess(false);
    setFormData((prev) => ({ ...prev, email: otpEmail || prev.email, emailVerified: true }));
  };

  const emailMatchesVerified =
    Boolean(profile?.emailVerified) && formData.email.trim() !== '' && formData.email.trim() === (profile?.email ?? '');
  const emailVerifiedNow = emailMatchesVerified || (formData.emailVerified === true && !dirty);
  const showVerifyNow = Boolean(formData.email.trim()) && !emailVerifiedNow && !emailUnavailable;
  const loadingProfile = !profile && profileQuery.isPending && !initialData;
  const profileError = !profile && profileQuery.isError ? mapProblem(profileQuery.error) : null;

  const isEditable = mode === 'edit' || mode === 'empty';

  return (
    <View style={styles.container}>
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <View style={[styles.headerRow, { paddingTop: headerTopPadding }]}>
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

        {loadingProfile ? (
          <View style={styles.stateBox} testID="profile-loading">
            <ActivityIndicator color={customerColors.brand} />
          </View>
        ) : profileError && !profileError.silent && !initialData ? (
          <View style={styles.stateBox} testID="profile-error">
            <Text style={styles.fieldErrorText} accessibilityRole="alert">
              {profileError.message}
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => void profileQuery.refetch()}
              accessibilityRole="button"
              accessibilityLabel="Retry"
            >
              <Text style={styles.openMapBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
        <>
        {/* ── SECTION 1: PERSONAL DETAILS ────────────────────────────────────── */}
        <Text style={styles.sectionHeadingUnderlined}>Personal details</Text>

        <View style={styles.formSection}>
          {/* 1. Name */}
          <View style={styles.fieldRow}>
            {isEditable ? (
              <TextInput
                style={styles.inputField}
                value={formData.name}
                onChangeText={text => updateForm(prev => ({ ...prev, name: text }))}
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
          {fieldErrors.name ? (
            <Text style={styles.fieldErrorText} accessibilityRole="alert" testID="profile-name-error">
              {fieldErrors.name}
            </Text>
          ) : null}

          {/* 2. Number */}
          <View style={styles.fieldRowWithTrailing}>
            {/* Mobile is the sign-in identity (BR-33): always read-only. */}
            <Text
              style={[styles.displayFieldText, { flex: 1 }, !formData.phone && styles.placeholderText]}
              accessibilityLabel="Mobile number"
            >
              {formData.phone || 'Please enter your Number'}
            </Text>
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
                onChangeText={text => updateForm(prev => ({ ...prev, email: text }))}
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

            {showVerifyNow ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleVerifyNow}
                disabled={sendingOtp}
                style={styles.verifyBadge}
                accessibilityLabel="Verify now"
                accessibilityState={{ disabled: sendingOtp, busy: sendingOtp }}
              >
                {sendingOtp ? (
                  <ActivityIndicator size="small" color={customerColors.heading} />
                ) : (
                  <Text style={styles.verifyBadgeText}>Verify now &gt;</Text>
                )}
              </TouchableOpacity>
            ) : emailVerifiedNow ? (
              <View style={styles.trailingIcon}>
                <CheckCircleSvg size={16} />
              </View>
            ) : null}
          </View>

          {emailError ? (
            <Text style={styles.fieldErrorText} accessibilityRole="alert" testID="email-error">
              {emailError}
            </Text>
          ) : null}

          {/* 4. Age */}
          <View style={styles.fieldRow}>
            {isEditable ? (
              <TextInput
                style={styles.inputField}
                value={formData.age}
                onChangeText={text => updateForm(prev => ({ ...prev, age: text.replace(/[^0-9]/g, '') }))}
                keyboardType="number-pad"
                maxLength={3}
                placeholder="Please enter your Age"
                placeholderTextColor={customerColors.muted}
                textAlign="center"
              />
            ) : (
              <Text style={styles.displayFieldText}>
                {formData.age ? `Age ${formData.age}` : 'Please enter your Age'}
              </Text>
            )}
          </View>
          {fieldErrors.age ? (
            <Text style={styles.fieldErrorText} accessibilityRole="alert" testID="profile-age-error">
              {fieldErrors.age}
            </Text>
          ) : null}

          {/* 5. Language Dropdown */}
          <TouchableOpacity
            activeOpacity={isEditable ? 0.7 : 1}
            onPress={() => {
              if (isEditable) {
                updateForm(prev => ({
                  ...prev,
                  language: prev.language === 'Tamil' ? 'English' : 'Tamil',
                }));
              }
            }}
            style={styles.dropdownFieldRow}
            accessibilityLabel="Language"
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
              onPress={() => isEditable && updateForm(prev => ({ ...prev, gender: 'male' }))}
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
              onPress={() => isEditable && updateForm(prev => ({ ...prev, gender: 'female' }))}
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
              onPress={() => isEditable && updateForm(prev => ({ ...prev, gender: 'prefer_not_to_say' }))}
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
          {fieldErrors.gender ? <Text style={styles.fieldErrorText}>{fieldErrors.gender}</Text> : null}
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
                onChangeText={text => updateForm(prev => ({ ...prev, address: text }))}
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
          {fieldErrors.address ? <Text style={styles.fieldErrorText}>{fieldErrors.address}</Text> : null}

          {/* 2. City */}
          <View style={styles.dropdownFieldRow}>
            {isEditable ? (
              <TextInput
                style={[styles.inputField, { flex: 1 }]}
                value={formData.city}
                onChangeText={text => updateForm(prev => ({ ...prev, city: text }))}
                placeholder="Select city"
                placeholderTextColor={customerColors.muted}
                maxLength={100}
                textAlign="center"
              />
            ) : (
              <Text
                style={[
                  styles.displayFieldText,
                  !formData.city && styles.placeholderText,
                ]}
              >
                {formData.city || 'Select city'}
              </Text>
            )}
            <ChevronDownSvg color={customerColors.heading} size={14} />
          </View>
          {fieldErrors.city ? <Text style={styles.fieldErrorText}>{fieldErrors.city}</Text> : null}

          {/* 3. Pincode */}
          <View style={styles.fieldRow}>
            {isEditable ? (
              <TextInput
                style={styles.inputField}
                value={formData.pincode}
                onChangeText={text => updateForm(prev => ({ ...prev, pincode: text.replace(/[^0-9]/g, '') }))}
                maxLength={6}
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
          {fieldErrors.pincode ? (
            <Text style={styles.fieldErrorText} testID="profile-pincode-error">
              {fieldErrors.pincode}
            </Text>
          ) : null}

          {/* 4. State Dropdown */}
          <TouchableOpacity
            activeOpacity={isEditable ? 0.7 : 1}
            onPress={() => {
              if (isEditable) {
                updateForm(prev => ({
                  ...prev,
                  state: prev.state || 'Tamil Nadu',
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
        {isEditable && saveError ? (
          <Text style={styles.fieldErrorText} accessibilityRole="alert" testID="profile-save-error">
            {saveError}
          </Text>
        ) : null}
        {isEditable && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => void handleSaveProfile()}
            disabled={saving}
            style={styles.saveChangesButton}
            accessibilityLabel="Save Changes"
            accessibilityState={{ disabled: saving, busy: saving }}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" testID="profile-saving" />
            ) : (
              <Text style={styles.saveChangesText}>✔ Save Changes</Text>
            )}
          </TouchableOpacity>
        )}
        </>
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
              {`Please enter ${EMAIL_OTP_LENGTH}-digit PIN Sent to`}
            </Text>
            <View style={styles.emailEditRow}>
              <Text style={styles.otpMaskedEmail}>
                {maskEmail(otpEmail)}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowEmailOtpModal(false);
                  if (mode === 'view') setMode('edit');
                }}
                accessibilityLabel="Edit email"
              >
                <Text style={styles.otpEditText}>• Edit</Text>
              </TouchableOpacity>
            </View>

            {/* PIN Boxes (EMAIL_OTP_LENGTH) */}
            <View style={styles.pinBoxesRow}>
              {emailOtpPin.map((digit, index) => (
                <TextInput
                  key={index}
                  style={styles.pinInput}
                  keyboardType="numeric"
                  maxLength={index === 0 ? EMAIL_OTP_LENGTH : 1}
                  value={digit}
                  onChangeText={val => handleOtpChange(index, val)}
                  accessibilityLabel={`PIN digit ${index + 1}`}
                  textContentType="oneTimeCode"
                  textAlign="center"
                />
              ))}
            </View>

            {otpError ? (
              <Text style={styles.fieldErrorText} accessibilityRole="alert" testID="email-otp-error">
                {otpError}
              </Text>
            ) : null}

            <Text style={styles.resendTimerText}>
              Didn't receive the PIN?{' '}
              {resendIn > 0 ? (
                <Text style={{ color: customerColors.muted }}>{`Resend in ${resendIn}s`}</Text>
              ) : (
                <Text
                  style={{ color: customerColors.brand }}
                  onPress={handleResendOtp}
                  accessibilityRole="button"
                  accessibilityLabel="Resend PIN"
                >
                  Resend
                </Text>
              )}
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => void handleVerifyEmailSubmit()}
              disabled={!otpReady || verifyingOtp}
              style={[styles.modalPrimaryBtn, (!otpReady || verifyingOtp) && { opacity: 0.6 }]}
              accessibilityLabel="Continue"
              accessibilityState={{ disabled: !otpReady || verifyingOtp, busy: verifyingOtp }}
            >
              {verifyingOtp ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.modalPrimaryBtnText}>Continue</Text>
              )}
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
              accessibilityLabel="Close"
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.successGraphicWrap}>
              <Image
                source={profileEmailVerified}
                style={styles.verifiedEnvelopeImage}
                resizeMode="contain"
              />
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
  fieldErrorText: {
    fontSize: 12,
    color: '#DC2626',
    fontFamily: customerFonts.regular,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  stateBox: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
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
    top: -12,
    right: -12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  modalCloseText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '700',
    lineHeight: 15,
  },
  verifiedEnvelopeImage: {
    width: 84,
    height: 74,
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
    gap: 8,
    marginVertical: 24,
  },
  pinInput: {
    width: 36,
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

