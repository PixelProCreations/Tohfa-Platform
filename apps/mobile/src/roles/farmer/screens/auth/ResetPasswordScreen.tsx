import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { t } from '../../../../i18n/farmer';
import { ErrorState } from '@tohfa/mobile-ui';
import { BackButtonIcon, LockIcon } from '../../assets/icons/AssetIcons';
import { resetPassword } from '../../api/auth';
import { ApiError } from '../../../../shell/api/client';
import { authPalette as P, typography } from '../../theme';
import { NewPasswordForm } from './NewPasswordForm';
import { useFieldValidation } from '../../utils/validation';
import {
  PASSWORD_MAX_LENGTH,
  RESET_FIELD_ORDER,
  resetRules,
  type ResetField,
} from './authValidation';

interface ResetPasswordScreenProps {
  challengeId: string;
  code: string;
  onNavigate: (screen: 'Login' | 'PasswordChangedSuccess') => void;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ challengeId, code, onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const rules = React.useMemo(() => resetRules(password), [password]);
  const validation = useFieldValidation<ResetField>({
    values: { password, confirmPassword },
    rules,
    order: RESET_FIELD_ORDER,
  });
  const passwordError = validation.messageFor('password');
  const confirmError = validation.messageFor('confirmPassword');

  async function handleReset() {
    if (!validation.validateAll().valid) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      await resetPassword({ challengeId, code, newPassword: password });
      onNavigate('PasswordChangedSuccess');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(t(`error.${err.problem.code}` as unknown as Parameters<typeof t>[0]) || t('error.generic'));
      } else {
        setErrorMsg(t('error.generic'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.backRow}>
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.7}
          style={styles.backButton}
          onPress={() => onNavigate('Login')}
        >
          <BackButtonIcon size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.iconCircle}>
        <LockIcon size={32} color={P.primary} />
      </View>

      <Text style={styles.title}>Create New Password</Text>
      <Text style={styles.subtitle}>Your new password must be different from previous used passwords.</Text>

      {errorMsg ? (
        <View style={{ marginTop: 24 }}>
          <ErrorState message={errorMsg} onRetry={() => setErrorMsg(null)} />
        </View>
      ) : null}

      <Text style={styles.fieldLabel}>New Password</Text>
      <View style={styles.fieldRow}>
        <LockIcon size={16} color={P.muted} />
        <TextInput
          style={styles.fieldInput}
          value={password}
          onChangeText={setPassword}
          onBlur={() => validation.onBlur('password')}
          maxLength={PASSWORD_MAX_LENGTH}
          secureTextEntry={!showPassword}
          placeholder="........"
          placeholderTextColor={P.muted}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={16} color={P.muted} />
        </TouchableOpacity>
      </View>
      {passwordError ? <Text accessibilityRole="alert" style={styles.fieldError}>{passwordError}</Text> : null}

      <Text style={styles.fieldLabel}>Confirm Password</Text>
      <View style={styles.fieldRow}>
        <LockIcon size={16} color={P.muted} />
        <TextInput
          style={styles.fieldInput}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          onBlur={() => validation.onBlur('confirmPassword')}
          maxLength={PASSWORD_MAX_LENGTH}
          secureTextEntry={!showConfirmPassword}
          placeholder="........"
          placeholderTextColor={P.muted}
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Icon name={showConfirmPassword ? 'visibility_off' : 'visibility'} size={16} color={P.muted} />
        </TouchableOpacity>
      </View>
      {confirmError ? <Text accessibilityRole="alert" style={styles.fieldError}>{confirmError}</Text> : null}

      <TouchableOpacity
        accessibilityRole="button"
        style={[styles.ctaButton, loading && styles.ctaDisabled]}
        onPress={handleReset}
        disabled={loading}
      >
        <Text style={styles.ctaText}>Save Password</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  fieldError: {
    color: P.red700,
    fontSize: typography.caption,
    marginTop: 6,
  },
  container: {
    flex: 1,
    backgroundColor: P.bg,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  backRow: {
    flexDirection: 'row',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: P.progressInactive,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: P.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 36,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.ink,
    textAlign: 'center',
    marginTop: 24,
  },
  subtitle: {
    fontSize: typography.bodySmall,
    lineHeight: 19,
    color: P.muted,
    textAlign: 'center',
    marginTop: 8,
  },
});
