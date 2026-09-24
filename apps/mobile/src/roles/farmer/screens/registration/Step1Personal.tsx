import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, useTheme } from '../../theme';
import { Icon, DatePicker } from '@tohfa/mobile-ui';
import { validateStep } from './validation';
import type { Step1PersonalData } from '../../storage/registrationDraft';
import { requestOtp, verifyOtp, renderOtpState } from '../../api/auth';
import { formatErrorMessage } from '../../../../shell/api/client';

interface Step1Props {
  initialData?: Step1PersonalData | undefined;
  onSave: (data: Step1PersonalData) => void;
  onBack?: (() => void) | undefined;
}

export const Step1Personal: React.FC<Step1Props> = ({ initialData, onSave }) => {
  const theme = useTheme();
  const { colors } = theme;

  // Extract or default values from initial data
  const scrollRef = useRef<ScrollView>(null);
  const [fullName, setFullName] = useState(initialData?.fullName ?? '');
  const [dob, setDob] = useState(initialData?.dob ?? '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [otp, setOtp] = useState('');

  // BR-32 mobile verification, inline on this step per product decision:
  // the farmer must prove ownership of the number before Step 1 can
  // complete, not just type something into the OTP box. `verifiedMobile`
  // tracks exactly which number the current `challengeId` was issued for --
  // editing the mobile field after a successful verify must re-arm this,
  // otherwise a farmer could verify one number then swap in a different one
  // before continuing.
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState<string | undefined>(undefined);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [verifiedMobile, setVerifiedMobile] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [now, setNow] = useState(Date.now());

  const [gender, setGender] = useState(initialData?.gender ?? '');
  const [showGenderMenu, setShowGenderMenu] = useState(false);

  // Clean initial mobile number (strip +91 prefix if already saved)
  const rawMobile = initialData?.mobile ?? '';
  const cleanMobile = rawMobile.replace(/^\+91\s?/, '');
  const [mobileNumber, setMobileNumber] = useState(cleanMobile);

  const rawAadhaar = initialData?.aadhaarNumber ?? initialData?.aadhaarLast4 ?? '';
  const [aadhaarNumber, setAadhaarNumber] = useState(rawAadhaar);

  const [addressLine1, setAddressLine1] = useState(initialData?.addressLine1 ?? '');
  const [village, setVillage] = useState(initialData?.village ?? '');
  const [taluk, setTaluk] = useState(initialData?.taluk ?? '');
  const [district, setDistrict] = useState(initialData?.district ?? 'The Nilgiris');
  const [pincode, setPincode] = useState(initialData?.pincode ?? '643217');
  const [showDistrictMenu, setShowDistrictMenu] = useState(false);

  const districtOptions = [
    'The Nilgiris', 'Coimbatore', 'Erode', 'Tiruppur', 'Salem',
    'Madurai', 'Thanjavur', 'Tiruchirappalli', 'Chennai', 'Dharmapuri',
  ];

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const genderOptions = ['Male', 'Female', 'Other'];

  function formatMobile(raw: string): string {
    return raw.startsWith('+') ? raw.trim() : `+91${raw.replace(/\s+/g, '').trim()}`;
  }

  const formattedMobile = formatMobile(mobileNumber);
  const isMobileVerified = verifiedMobile !== null && verifiedMobile === formattedMobile;

  // A challenge issued for a different number than what's currently typed
  // is stale -- clear it so the OTP field/Send-OTP button reflect reality
  // instead of pretending a challenge for the old number still applies.
  useEffect(() => {
    if (challengeId !== null && verifiedMobile !== null && verifiedMobile !== formattedMobile) {
      setChallengeId(null);
      setOtp('');
    }
  }, [formattedMobile, challengeId, verifiedMobile]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const otpState = renderOtpState({ resendAvailableAt, attemptsRemaining, now });

  async function handleSendOtp() {
    const raw = mobileNumber.replace(/\s+/g, '').trim();
    if (raw.length < 10) {
      const msg = 'Enter a valid 10-digit mobile number first.';
      setFieldErrors((prev) => ({ ...prev, mobile: msg }));
      return;
    }
    clearFieldError('mobile');
    setSendingOtp(true);
    try {
      const res = await requestOtp({ mobile: formattedMobile, purpose: 'REGISTRATION' });
      setChallengeId(res.challengeId);
      setResendAvailableAt(res.resendAvailableAt);
      setAttemptsRemaining(res.attemptsRemaining);
      // `_mockCode` only ever exists when the backend's SMS_PROVIDER is
      // `mock` (see apps/api/.../auth.service.ts's sendOtp) -- a real
      // provider (msg91/twilio) never sends this field, so auto-filling it
      // is safe by construction and needs no separate dev/prod flag here.
      setOtp(res._mockCode ?? '');
    } catch (err: unknown) {
      const msg = formatErrorMessage(err, 'Could not send OTP.');
      setFieldErrors((prev) => ({ ...prev, mobile: msg }));
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleContinue() {
    const nextErrors: Record<string, string> = {};

    const cleanName = fullName.trim();
    if (cleanName.length < 2) {
      nextErrors.fullName = 'Full name must be at least 2 characters.';
    }

    if (!dob.trim()) {
      nextErrors.dob = 'Date of birth is required.';
    }

    if (!gender) {
      nextErrors.gender = 'Please select a gender.';
    }

    const rawMob = mobileNumber.replace(/\s+/g, '').trim();
    if (!/^[0-9]{10}$/.test(rawMob)) {
      nextErrors.mobile = 'Enter a valid 10-digit mobile number.';
    } else if (!isMobileVerified) {
      if (!challengeId) {
        nextErrors.mobile = 'Please send and verify the OTP for this mobile number.';
      } else if (!otp.trim() || otp.trim().length < 6) {
        nextErrors.otp = 'Enter the 6-digit OTP sent to your mobile number.';
      }
    }

    const cleanAadhaar = aadhaarNumber.replace(/\s+/g, '').trim();
    if (!cleanAadhaar) {
      nextErrors.aadhaarNumber = 'Aadhaar / ID Number is required.';
    } else if (!/^\d{12}$/.test(cleanAadhaar)) {
      if (cleanAadhaar.length !== 4 || !/^\d{4}$/.test(cleanAadhaar)) {
        nextErrors.aadhaarNumber = 'Enter a valid 12-digit Aadhaar number.';
      }
    }

    if (!addressLine1.trim()) {
      nextErrors.addressLine1 = 'Address line is required.';
    }
    if (!village.trim()) {
      nextErrors.village = 'Village is required.';
    }
    if (!taluk.trim()) {
      nextErrors.taluk = 'Taluk is required.';
    }
    if (!district.trim()) {
      nextErrors.district = 'District is required.';
    }
    const cleanPin = pincode.replace(/\s+/g, '').trim();
    // Real Indian PIN codes never start with 0 -- matches farmers.pincode's CHECK
    // constraint (db/migrations/0003_farmers_and_farms.sql) and validation.ts's
    // step-1 check, so an invalid value is caught here rather than accepted by the
    // app and silently dropped to NULL at approval.
    if (!cleanPin || !/^[1-9][0-9]{5}$/.test(cleanPin)) {
      nextErrors.pincode = 'A valid 6-digit pincode is required.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    if (!isMobileVerified) {
      setVerifying(true);
      try {
        await verifyOtp({ challengeId: challengeId!, code: otp.trim() });
        setVerifiedMobile(formattedMobile);
      } catch (err: unknown) {
        const msg = formatErrorMessage(err, 'Incorrect or expired OTP.');
        setFieldErrors((prev) => ({ ...prev, otp: msg }));
        scrollRef.current?.scrollTo({ y: 0, animated: true });
        return;
      } finally {
        setVerifying(false);
      }
    }

    const payload: Step1PersonalData = {
      fullName: cleanName,
      mobile: formattedMobile,
      dob: dob.trim(),
      gender,
      // BR-33b / Decision 8 (db/migrations/0003_farmers_and_farms.sql): the full
      // Aadhaar number must never reach the server -- not stored, not returned, not
      // logged. `aadhaarNumber`/`cleanAadhaar` stay local, purely so this screen can
      // validate the 12-digit format the farmer typed; only the last 4 digits are
      // ever sent or saved into the draft.
      aadhaarLast4: cleanAadhaar.slice(-4),
      addressLine1: addressLine1.trim(),
      village: village.trim(),
      taluk: taluk.trim(),
      district: district.trim(),
      pincode: cleanPin,
    };

    const validation = validateStep(1, payload);
    if (!validation.valid) {
      setFieldErrors((prev) => ({ ...prev, ...validation.errors }));
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setFieldErrors({});
    onSave(payload);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgLight }]}>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Full Name */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textBody }]}>
            Full Name <Text style={{ color: colors.requiredRed }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.borderLight,
                color: colors.textDark,
                backgroundColor: colors.white,
              },
              fieldErrors.fullName ? styles.inputError : null,
            ]}
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              clearFieldError('fullName');
            }}
            placeholder="e.g. Kumar"
            placeholderTextColor={colors.textPlaceholder}
          />
          {fieldErrors.fullName ? (
            <Text style={styles.fieldErrorText}>{fieldErrors.fullName}</Text>
          ) : null}
        </View>

        {/* DOB & Gender Side-by-Side */}
        <View style={styles.rowGrid}>
          <View style={styles.gridCol}>
            <Text style={[styles.label, { color: colors.textBody }]}>
              Date of Birth <Text style={{ color: colors.requiredRed }}>*</Text>
            </Text>
            <View
              style={[
                styles.input,
                {
                  borderColor: colors.borderLight,
                  backgroundColor: colors.white,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingRight: 8,
                },
                fieldErrors.dob ? styles.inputError : null,
              ]}
            >
              <TextInput
                style={{
                  flex: 1,
                  color: colors.textDark,
                  fontSize: 15,
                  padding: 0,
                }}
                value={dob}
                onChangeText={(text) => {
                  setDob(text);
                  clearFieldError('dob');
                }}
                placeholder="DD / MM / YYYY"
                placeholderTextColor={colors.textPlaceholder}
                keyboardType="numbers-and-punctuation"
              />
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowDatePicker(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Open calendar"
              >
                <Icon name="calendar_today" size={20} color={colors.textSubtle} />
              </TouchableOpacity>
            </View>
            {fieldErrors.dob ? (
              <Text style={styles.fieldErrorText}>{fieldErrors.dob}</Text>
            ) : null}

            <DatePicker
              visible={showDatePicker}
              onClose={() => setShowDatePicker(false)}
              value={dob}
              title="Select Date of Birth"
              maxDate={new Date()}
              format="DD / MM / YYYY"
              onSelect={(_date, formattedDate) => {
                setDob(formattedDate);
                clearFieldError('dob');
              }}
            />
          </View>

          <View style={styles.gridCol}>
            <Text style={[styles.label, { color: colors.textBody }]}>
              Gender <Text style={{ color: colors.requiredRed }}>*</Text>
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.dropdownSelect,
                {
                  borderColor: colors.borderLight,
                  backgroundColor: colors.white,
                },
                fieldErrors.gender ? styles.inputError : null,
              ]}
              onPress={() => setShowGenderMenu(!showGenderMenu)}
            >
              <Text style={[styles.dropdownText, { color: colors.onSurface }]}>
                {gender}
              </Text>
              <Text style={[styles.dropdownArrow, { color: colors.textSubtle }]}>▾</Text>
            </TouchableOpacity>
            {fieldErrors.gender ? (
              <Text style={styles.fieldErrorText}>{fieldErrors.gender}</Text>
            ) : null}

            {showGenderMenu ? (
              <View
                style={[
                  styles.dropdownMenu,
                  {
                    backgroundColor: colors.white,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                {genderOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.dropdownOption, { borderBottomColor: colors.borderSoft }]}
                    onPress={() => {
                      setGender(opt);
                      clearFieldError('gender');
                      setShowGenderMenu(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        { color: colors.onSurface },
                        opt === gender && { fontWeight: '700', color: colors.brandGreen },
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        {/* Mobile Number */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textBody }]}>
            Mobile Number <Text style={{ color: colors.requiredRed }}>*</Text>
          </Text>
          <View style={styles.mobileRow}>
            <View
              style={[
                styles.countryCodeBox,
                {
                  borderColor: colors.borderLight,
                  backgroundColor: colors.prefixBg,
                },
              ]}
            >
              <Text style={[styles.countryCodeText, { color: colors.textSubtle }]}>+91</Text>
            </View>
            <TextInput
              style={[
                styles.input,
                styles.mobileInput,
                {
                  borderColor: colors.borderLight,
                  color: colors.textDark,
                  backgroundColor: colors.white,
                },
                fieldErrors.mobile ? styles.inputError : null,
              ]}
              value={mobileNumber}
              onChangeText={(text) => {
                setMobileNumber(text);
                clearFieldError('mobile');
              }}
              keyboardType="phone-pad"
              placeholder="98765 43210"
              placeholderTextColor={colors.textPlaceholder}
            />
          </View>
          {fieldErrors.mobile ? (
            <Text style={styles.fieldErrorText}>{fieldErrors.mobile}</Text>
          ) : null}

          {isMobileVerified ? (
            <Text style={[styles.helperText, { color: colors.success }]}>
              ✓ Mobile number verified
            </Text>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Text style={[styles.helperText, { color: colors.textSubtle, flex: 1 }]}>
                  We'll send an OTP to verify
                </Text>
                <TouchableOpacity
                  onPress={handleSendOtp}
                  disabled={sendingOtp || (challengeId !== null && !otpState.canResend)}
                  style={{ opacity: sendingOtp || (challengeId !== null && !otpState.canResend) ? 0.5 : 1 }}
                >
                  {sendingOtp ? (
                    <ActivityIndicator size="small" color={colors.brandGreen} />
                  ) : (
                    <Text style={{ color: colors.brandGreen, fontWeight: '700' }}>
                      {challengeId === null
                        ? 'Send OTP'
                        : otpState.canResend
                        ? 'Resend OTP'
                        : `Resend in ${otpState.secondsUntilResend}s`}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.label, { color: colors.textBody }]}>
                  OTP <Text style={{ color: colors.requiredRed }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: colors.borderLight,
                      color: colors.textDark,
                      backgroundColor: challengeId === null ? colors.prefixBg : colors.white,
                    },
                    fieldErrors.otp ? styles.inputError : null,
                  ]}
                  value={otp}
                  onChangeText={(text) => {
                    setOtp(text);
                    clearFieldError('otp');
                  }}
                  editable={challengeId !== null}
                  keyboardType="number-pad"
                  placeholder={challengeId === null ? 'Send OTP first' : 'Enter OTP'}
                  placeholderTextColor={colors.textPlaceholder}
                />
                {fieldErrors.otp ? (
                  <Text style={styles.fieldErrorText}>{fieldErrors.otp}</Text>
                ) : null}
              </View>
            </>
          )}
        </View>

        {/* Aadhaar / ID Number */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textBody }]}>
            Aadhaar / ID Number <Text style={{ color: colors.requiredRed }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.aadhaarInput,
              {
                borderColor: colors.borderLight,
                color: colors.textDark,
                backgroundColor: colors.white,
              },
              fieldErrors.aadhaarNumber ? styles.inputError : null,
            ]}
            value={aadhaarNumber}
            onChangeText={(text) => {
              setAadhaarNumber(text);
              clearFieldError('aadhaarNumber');
            }}
            keyboardType="number-pad"
            placeholder="3782 4591 0023"
            placeholderTextColor={colors.textPlaceholder}
          />
          {fieldErrors.aadhaarNumber ? (
            <Text style={styles.fieldErrorText}>{fieldErrors.aadhaarNumber}</Text>
          ) : (
            <Text style={[styles.helperText, { color: colors.textSubtle }]}>
              Used to verify your identity with TOFHA
            </Text>
          )}
        </View>

        {/* Address Line */}
        <View style={[styles.fieldGroup, { marginBottom: 24 }]}>
          <Text style={[styles.label, { color: colors.textBody }]}>
            Address Line <Text style={{ color: colors.requiredRed }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textareaInput,
              {
                borderColor: colors.borderLight,
                color: colors.textDark,
                backgroundColor: colors.white,
              },
              fieldErrors.addressLine1 ? styles.inputError : null,
            ]}
            value={addressLine1}
            onChangeText={(text) => {
              setAddressLine1(text);
              clearFieldError('addressLine1');
            }}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            placeholder="House / street / landmark"
            placeholderTextColor={colors.textPlaceholder}
          />
          {fieldErrors.addressLine1 ? (
            <Text style={styles.fieldErrorText}>{fieldErrors.addressLine1}</Text>
          ) : null}
        </View>

        {/* Village / Taluk row */}
        <View style={styles.rowGrid}>
          <View style={styles.gridCol}>
            <Text style={[styles.label, { color: colors.textBody }]}>
              Village <Text style={{ color: colors.requiredRed }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.borderLight,
                  color: colors.textDark,
                  backgroundColor: colors.white,
                },
                fieldErrors.village ? styles.inputError : null,
              ]}
              value={village}
              onChangeText={(text) => {
                setVillage(text);
                clearFieldError('village');
              }}
              placeholder="e.g. Kotagiri"
              placeholderTextColor={colors.textPlaceholder}
            />
            {fieldErrors.village ? (
              <Text style={styles.fieldErrorText}>{fieldErrors.village}</Text>
            ) : null}
          </View>
          <View style={styles.gridCol}>
            <Text style={[styles.label, { color: colors.textBody }]}>
              Taluk <Text style={{ color: colors.requiredRed }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.borderLight,
                  color: colors.textDark,
                  backgroundColor: colors.white,
                },
                fieldErrors.taluk ? styles.inputError : null,
              ]}
              value={taluk}
              onChangeText={(text) => {
                setTaluk(text);
                clearFieldError('taluk');
              }}
              placeholder="e.g. Kotagiri Taluk"
              placeholderTextColor={colors.textPlaceholder}
            />
            {fieldErrors.taluk ? (
              <Text style={styles.fieldErrorText}>{fieldErrors.taluk}</Text>
            ) : null}
          </View>
        </View>

        {/* District / Pincode row */}
        <View style={styles.rowGrid}>
          <View style={styles.gridCol}>
            <Text style={[styles.label, { color: colors.textBody }]}>
              District <Text style={{ color: colors.requiredRed }}>*</Text>
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.dropdownSelect,
                {
                  borderColor: colors.borderLight,
                  backgroundColor: colors.white,
                },
                fieldErrors.district ? styles.inputError : null,
              ]}
              onPress={() => setShowDistrictMenu(!showDistrictMenu)}
            >
              <Text style={[styles.dropdownText, { color: colors.onSurface }]} numberOfLines={1}>
                {district}
              </Text>
              <Text style={[styles.dropdownArrow, { color: colors.textSubtle }]}>▾</Text>
            </TouchableOpacity>
            {fieldErrors.district ? (
              <Text style={styles.fieldErrorText}>{fieldErrors.district}</Text>
            ) : null}

            {showDistrictMenu ? (
              <View
                style={[
                  styles.dropdownMenu,
                  {
                    backgroundColor: colors.white,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                <ScrollView style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                  {districtOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.dropdownOption, { borderBottomColor: colors.borderSoft }]}
                      onPress={() => {
                        setDistrict(opt);
                        clearFieldError('district');
                        setShowDistrictMenu(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          { color: colors.onSurface },
                          opt === district && { fontWeight: '700', color: colors.brandGreen },
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
            <Text style={[styles.label, { color: colors.textBody }]}>
              Pincode <Text style={{ color: colors.requiredRed }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.borderLight,
                  color: colors.textDark,
                  backgroundColor: colors.white,
                },
                fieldErrors.pincode ? styles.inputError : null,
              ]}
              value={pincode}
              onChangeText={(text) => {
                setPincode(text.replace(/[^0-9]/g, '').slice(0, 6));
                clearFieldError('pincode');
              }}
              keyboardType="number-pad"
              placeholder="643217"
              placeholderTextColor={colors.textPlaceholder}
            />
            {fieldErrors.pincode ? (
              <Text style={styles.fieldErrorText}>{fieldErrors.pincode}</Text>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Footer */}
      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.borderDivider,
            backgroundColor: colors.white,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={verifying}
          style={[styles.continueButton, { backgroundColor: colors.brandGreen, opacity: verifying ? 0.6 : 1 }]}
          onPress={handleContinue}
        >
          {verifying ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={[styles.continueButtonText, { color: colors.white }]}>
              Continue to Farm Details →
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    height: 46,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  rowGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  gridCol: {
    flex: 1,
    position: 'relative',
  },
  dropdownSelect: {
    height: 46,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 15,
  },
  dropdownArrow: {
    fontSize: 14,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 72,
    left: 0,
    right: 0,
    borderWidth: 1.5,
    borderRadius: 12,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 100,
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  dropdownOptionText: {
    fontSize: 14,
  },
  mobileRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeBox: {
    width: 65,
    height: 46,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '600',
  },
  mobileInput: {
    flex: 1,
  },
  aadhaarInput: {
    letterSpacing: 1,
  },
  helperText: {
    fontSize: 11,
    marginTop: 5,
  },
  textareaInput: {
    minHeight: 64,
    paddingTop: 12,
    paddingBottom: 12,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  continueButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  inputError: {
    borderColor: colors.requiredRed,
    borderWidth: 1.5,
  },
  fieldErrorText: {
    color: colors.requiredRed,
    fontSize: 12,
    marginTop: 4,
  },
});
