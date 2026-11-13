import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { t } from '../../../../i18n/farmer';
import { Icon } from '@tohfa/mobile-ui';
import { LockIcon } from '../../assets/icons/AssetIcons';
import { authPalette as P, typography } from '../../theme';

interface NewPasswordFormProps {
  submitLabel: string;
  loading: boolean;
  /** Called with the password once both entries match. */
  onSubmit: (password: string) => void;
  /** Called instead of `onSubmit` when the two entries differ; nothing is sent. */
  onMismatch: () => void;
}

/**
 * The "new password + confirm" pair shared by Reset Password (forgot-password
 * OTP flow) and Create Password (BR-142, first password after an OTP sign-in),
 * so the two screens cannot drift apart in fields, validation or look.
 *
 * Only the match check happens here. The length policy is the server's
 * (`setPasswordBody` / `resetPasswordBody`, 10 to 128 characters) and comes
 * back as a 422 the screen translates; it is not duplicated on the device.
 */
export const NewPasswordForm: React.FC<NewPasswordFormProps> = ({ submitLabel, loading, onSubmit, onMismatch }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const disabled = !password || !confirmPassword || loading;

  function handleSubmit() {
    if (password !== confirmPassword) {
      onMismatch();
      return;
    }
    onSubmit(password);
  }

  return (
    <>
      <Text style={styles.fieldLabel}>{t('farmer.auth.reset.newPassword')}</Text>
      <View style={styles.fieldRow}>
        <LockIcon size={16} color={P.muted} />
        <TextInput
          style={styles.fieldInput}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholder="........"
          placeholderTextColor={P.muted}
          accessibilityLabel={t('farmer.auth.reset.newPassword')}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={16} color={P.muted} />
        </TouchableOpacity>
      </View>

      <Text style={styles.fieldLabel}>{t('farmer.auth.reset.confirmPassword')}</Text>
      <View style={styles.fieldRow}>
        <LockIcon size={16} color={P.muted} />
        <TextInput
          style={styles.fieldInput}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          placeholder="........"
          placeholderTextColor={P.muted}
          accessibilityLabel={t('farmer.auth.reset.confirmPassword')}
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Icon name={showConfirmPassword ? 'visibility_off' : 'visibility'} size={16} color={P.muted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        style={[styles.ctaButton, disabled && styles.ctaDisabled]}
        onPress={handleSubmit}
        disabled={disabled}
      >
        <Text style={styles.ctaText}>{submitLabel}</Text>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  fieldLabel: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.ink,
    marginTop: 24,
    marginBottom: 6,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: P.white,
    borderWidth: 1.5,
    borderColor: P.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  fieldInput: {
    flex: 1,
    fontSize: typography.bodyLarge,
    color: P.ink,
    paddingVertical: 0,
  },
  ctaButton: {
    backgroundColor: P.primary,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  ctaDisabled: {
    opacity: 0.4,
  },
  ctaText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.white,
  },
});
