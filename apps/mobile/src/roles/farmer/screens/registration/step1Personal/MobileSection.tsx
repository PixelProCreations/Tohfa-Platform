import React from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { t } from '../../../../../i18n/farmer';
import { s1 } from './i18n';
import { FieldError, RequiredLabel, type SectionProps } from './parts';

/** 10 digits plus room for the spaces a farmer types ("98765 43210"). */
const MOBILE_INPUT_MAX_LENGTH = 12;
/** docs/openapi.yaml OTP code: ^[0-9]{6}$. */
const OTP_LENGTH = 6;

export const MobileSection: React.FC<SectionProps> = ({ form, styles, colors }) => {
  const { state, setField, isMobileVerified, otpState, handleSendOtp } = form;
  const errors = state.fieldErrors;
  const otpLocked = state.challengeId === null;
  const sendDisabled = state.sendingOtp || (state.challengeId !== null && !otpState.canResend);

  const sendLabel = otpLocked
    ? s1('sendOtp')
    : otpState.canResend
      ? s1('resendOtp')
      : s1('resendIn', { seconds: otpState.secondsUntilResend });

  return (
    <View style={styles.fieldGroup}>
      <RequiredLabel styles={styles} text={t('farmer.registration.step1.mobileLabel')} />
      <View style={styles.mobileRow}>
        <View style={styles.countryCodeBox}>
          <Text style={styles.countryCodeText}>+91</Text>
        </View>
        <TextInput
          style={[styles.input, styles.mobileInput, errors.mobile ? styles.inputError : null]}
          value={state.mobileNumber}
          onChangeText={(text) => setField({ mobileNumber: text }, 'mobile')}
          keyboardType="phone-pad"
          maxLength={MOBILE_INPUT_MAX_LENGTH}
          placeholder={t('farmer.registration.step1.mobilePlaceholder')}
          placeholderTextColor={colors.placeholder}
        />
      </View>
      <FieldError styles={styles} message={errors.mobile} />

      {isMobileVerified ? (
        <Text style={[styles.helperText, styles.helperVerified]}>{s1('mobileVerified')}</Text>
      ) : (
        <>
          <View style={styles.otpActionRow}>
            <Text style={[styles.helperText, styles.helperFlex]}>
              {t('farmer.registration.step1.mobileHelper')}
            </Text>
            <TouchableOpacity
              onPress={handleSendOtp}
              disabled={sendDisabled}
              style={sendDisabled ? styles.otpActionDisabled : undefined}
            >
              {state.sendingOtp ? (
                <ActivityIndicator size="small" color={colors.brand} />
              ) : (
                <Text style={styles.otpActionText}>{sendLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.otpBlock}>
            <RequiredLabel styles={styles} text={s1('otpLabel')} />
            <TextInput
              style={[
                styles.input,
                otpLocked ? styles.inputDisabled : null,
                errors.otp ? styles.inputError : null,
              ]}
              value={state.otp}
              onChangeText={(text) => setField({ otp: text }, 'otp')}
              editable={!otpLocked}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              placeholder={otpLocked ? s1('otpPlaceholderLocked') : s1('otpPlaceholder')}
              placeholderTextColor={colors.placeholder}
            />
            <FieldError styles={styles} message={errors.otp} />
          </View>
        </>
      )}
    </View>
  );
};
